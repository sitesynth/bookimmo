#!/usr/bin/env python3
"""
Монитор для автоматической отправки контактов через расширение Chrome.
Расширение содержит полную логику автоматизации (заполнение + отправка).
Python скрипт просто открывает квартиры и ждет логирования.
"""

import requests
import json
import time
import threading
import subprocess
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
from pathlib import Path
from datetime import datetime, timezone, timedelta
import queue
import re

import config

# Scheduler для ежедневной перезагрузки Chrome
try:
    import schedule
    SCHEDULE_ENABLED = True
except ImportError:
    SCHEDULE_ENABLED = False
    print("⚠️  schedule не установлен. Ежедневная перезагрузка Chrome отключена.")

# Database integration
try:
    import storage_db
    STORAGE_DB_ENABLED = True
    print("✅ Backend database integration activated")
except ImportError:
    STORAGE_DB_ENABLED = False
    print("⚠️  backend database integration not found. Using local files")

# Telegram integration
try:
    import telegram_bridge
    TELEGRAM_ENABLED = True
except ImportError:
    TELEGRAM_ENABLED = False
    print("⚠️  Telegram bridge не найден (telegram_bridge.py). Логирование в Telegram отключено.")

# Timeline logging
try:
    import timeline_logger
    TIMELINE_ENABLED = True
except ImportError:
    TIMELINE_ENABLED = False
    print("⚠️  Timeline logger не найден (timeline_logger.py). Логирование временной шкалы отключено.")

# Gmail integration
try:
    import gmail_checker
    GMAIL_ENABLED = True
except ImportError:
    GMAIL_ENABLED = False
    print("⚠️  gmail_checker не найден (gmail_checker.py). Gmail интеграция отключена.")

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

HAMBURG_GEOCODES = [
    "0200000005056",
    "0200000006057",
    "0200000006058",
    "0200000006059",
    "0200000005048"
]
HAMBURG_DISTRICTS = {
    "Rothenbaum",
    "Harvestehude",
    "Winterhude",
    "Eppendorf",
    "Uhlenhorst"
}

# Ручные исключения: эти expose_id никогда не обрабатываем
EXCLUDED_EXPOSE_IDS = {
    "166860506",
}

API_BASE = "https://api.mobile.immobilienscout24.de"
USER_AGENT = "ImmoScout_27.12_26.2_._"
CHECK_INTERVAL = 90  # секунд между проверками (1.5 минуты)
TRACK_FILE = "contact_sent_tracking.json"
LOG_FILE = "contact_submissions.jsonl"
APARTMENT_LOG_FILE = "apartments_processed.jsonl"  # Логирование всех обработанных квартир
SEEN_HISTORY_FILE = "apartments_seen_history.json"  # История ВСЕХ просмотренных объявлений
TIMELINE_FILE = "apartments_timeline.jsonl"  # Временная шкала: НАЙДЕНА → ОБРАБОТАНА → ОТВЕТ

# Очередь для получения логов от расширения
contact_log_queue = queue.Queue()

# Очередь для обработки найденных квартир
apartment_processing_queue = queue.Queue()
apartment_processing_stop = False  # Флаг для остановки обработчика

# Защита от дубликатов: квартиры, которые уже в очереди или обрабатываются
apartments_in_queue = set()  # Глобальный set для дедупликации по expose_id
addresses_in_queue = set()  # Глобальный set для дедупликации по улице+дому
apartment_addresses = {}  # Словарь expose_id -> address (для сохранения адресов перед открытием браузера)

# ============================================================================
# ПОЛУЧЕНИЕ IP АДРЕСА ДЛЯ РАСШИРЕНИЯ
# ============================================================================

def get_local_ip():
    """Получает локальный IP адрес машины (для Linux развёрнутой)"""
    import socket
    try:
        # Подключаемся к Google DNS чтобы узнать наш IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        # Fallback - если нет интернета, используем localhost
        return "127.0.0.1"

def get_server_url():
    """Возвращает URL сервера для расширения (localhost для Mac, IP для Linux)"""
    import os
    import platform
    
    # Проверяем переменную окружения
    if os.getenv('SERVER_URL'):
        return os.getenv('SERVER_URL')
    
    # На Linux сервере используем IP адрес вместо localhost
    if platform.system() != "Darwin":  # Darwin = macOS
        local_ip = get_local_ip()
        if local_ip != "127.0.0.1":
            return f"http://{local_ip}:5555"
    
    # На Mac используем localhost 
    return "http://localhost:5555"

SERVER_URL = get_server_url()

# Browser automation runtime
CHROME_PATH = os.environ.get("CHROME_PATH", "/opt/google/chrome/google-chrome")
CHROME_PROFILE_DIR = os.environ.get("CHROME_PROFILE_DIR", "Profile 5")
CHROME_EXTENSION_PATH = os.environ.get(
    "CHROME_EXTENSION_PATH",
    str(Path(__file__).parent / "immoscout_contact_ext"),
)
CHROME_DISPLAY = os.environ.get("CHROME_DISPLAY", ":99")
CHROME_XAUTHORITY = os.environ.get("CHROME_XAUTHORITY", "")
CHROME_DEBUG_PORT = int(os.environ.get("CHROME_DEBUG_PORT", "9222"))


def build_linux_chrome_env_prefix():
    parts = [f"DISPLAY={CHROME_DISPLAY}"]
    if CHROME_XAUTHORITY:
        parts.append(f"XAUTHORITY={CHROME_XAUTHORITY}")
    return " ".join(parts)

# ============================================================================
# ПОЛУЧЕНИЕ ДАННЫХ КОНТАКТА ИЗ БД
# ============================================================================

def get_contact_data_from_db():
    """Читает контакт-данные Сергея из БД вместо hardcoded значений"""
    try:
        import psycopg2

        conn = psycopg2.connect(**config.get_db_connection_params())
        cursor = conn.cursor()

        # Читаем данные из таблицы contacts
        cursor.execute("""
            SELECT DISTINCT first_name, last_name, email, phone
            FROM public.contacts
            WHERE first_name = 'Sergey' AND last_name = 'Zakharov'
            LIMIT 1
        """)

        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            first_name, last_name, email, phone = row
            print(f"✅ Контакт-данные прочитаны из БД: {first_name} {last_name}")
        else:
            # Fallback если нет в БД
            first_name = "Sergey"
            last_name = "Zakharov"
            email = "v.jorimann10@gmail.com"
            phone = "+49 171 169 1182"
            print("⚠️  Sergey не найден в БД, используем defaults")

        # ВАЖНО: Сообщение должно быть в отдельной таблице user_messages или конфиге
        # Пока берем из файла конфига
        message = load_contact_message()

        contact_data = {
            "contact": {
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": phone,
                "message": message
            }
        }

        return contact_data

    except Exception as e:
        print(f"❌ Ошибка чтения контакт-данных из БД: {e}")
        # Fallback с дефолтными значениями
        return {
            "contact": {
                "firstName": "Sergey",
                "lastName": "Zakharov",
                "email": "v.jorimann10@gmail.com",
                "phone": "+49 171 169 1182",
                "message": load_contact_message()
            }
        }

def load_contact_message():
    """Читает текст сообщения из таблицы user_messages в БД"""
    try:
        import psycopg2

        conn = psycopg2.connect(**config.get_db_connection_params())
        cursor = conn.cursor()
        
        # Читаем текст Сергея из таблицы user_messages
        cursor.execute("""
            SELECT message FROM public.user_messages
            WHERE first_name = 'Sergey' AND last_name = 'Zakharov'
            LIMIT 1
        """)
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if row and row[0]:
            message = row[0].strip()
            print(f"✅ Сообщение загружено из БД ({len(message)} символов)")
            return message
    except Exception as e:
        print(f"⚠️  Ошибка чтения сообщения из БД: {e}")
    
    # Fallback - дефолтное сообщение если нет в БД
    return """Sehr geehrte Damen und Herren,

wir sind ein ruhiges, zuverlässiges Ehepaar (59 und 57 Jahre) und suchen eine 3-4-Zimmer-Wohnung in Hamburg zur langfristigen Miete als Hauptwohnsitz. Nichtraucher, keine Haustiere.

Wir legen großen Wert auf ein gepflegtes und ruhiges Wohnumfeld und gehen sehr sorgfältig mit der Wohnung um. Ein langfristiges, stabiles Mietverhältnis ist uns wichtig.

Unsere finanzielle Situation ist stabil und gesichert. Alle Unterlagen (SCHUFA, Einkommensnachweise, Ausweise) sind vollständig vorhanden und können jederzeit vorgelegt werden.

Wir würden uns sehr über die Möglichkeit einer Besichtigung freuen.

Mit freundlichen Grüßen
Sergey Zakharov"""

# ============================================================================
# HTTP HANDLER ДЛЯ ЛОГИРОВАНИЯ (ОТ РАСШИРЕНИЯ)
# ============================================================================

class ContactLogHandler(BaseHTTPRequestHandler):
    """Получает логи контактов от Chrome расширения"""
    
    def do_OPTIONS(self):
        """Обработка CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self):
        """Обрабатывает GET от расширения"""
        
        if self.path == "/api/contact-data":
            # Читаем контакт-данные из БД вместо hardcoded значений
            contact_data = get_contact_data_from_db()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(json.dumps(contact_data).encode('utf-8'))
        
        elif self.path == "/api/server-url":
            # Возвращаем URL сервера для расширения (нужно для Linux где localhost может не работать)
            response = {
                "server_url": SERVER_URL
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
        
        elif self.path == "/health":
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
        
        else:
            self.send_response(404)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
    
    def do_POST(self):
        """Обрабатывает POST от расширения"""
        
        if self.path == "/contact_sent":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode('utf-8'))
                sent_time = datetime.now().strftime("%H:%M:%S")
                print(f"✅ КОНТАКТ В {sent_time} (ID:{data.get('expose_id')}): {data.get('contact_info', {}).get('firstName', 'Auto')} {data.get('contact_info', {}).get('lastName', 'Test')}")
                contact_log_queue.put(data)
                
                # Сохраняем в файл и БД
                save_contact_log(data)
                expose_id = data.get('expose_id')
                expose_address = apartment_addresses.get(str(expose_id), '')
                update_tracking(expose_id, address=expose_address)
                
                # Логируем в timeline (в backend database)
                if STORAGE_DB_ENABLED:
                    try:
                        storage_db.log_apartment_contact_sent(
                            expose_id=str(data.get('expose_id')),
                            timestamp=data.get('timestamp'),
                            first_name=data.get('contact_info', {}).get('firstName', ''),
                            last_name=data.get('contact_info', {}).get('lastName', ''),
                            email=data.get('contact_info', {}).get('email', ''),
                            phone=data.get('contact_info', {}).get('phone', ''),
                            url=data.get('url', '')
                        )
                    except Exception as e:
                        print(f"    ⚠️  Не удалось залогировать контакт: {e}")
                
                # Ответ расширению с CORS
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Ошибка при обработке лога: {e}")
                self.send_response(500)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
        
        elif self.path == "/log_failure":
            # Расширение отправляет информацию об ошибке заполнения/отправки
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                expose_id = data.get('expose_id')
                reason = data.get('reason')
                details = data.get('details', '')
                
                print(f"⚠️  ОШИБКА ОТПРАВКИ (ID:{expose_id}): {reason}")
                if details:
                    print(f"    Детали: {details}")
                
                # Сохраняем информацию об ошибке в JSONL
                with open('contact_failures.jsonl', 'a') as f:
                    failure_record = {
                        'timestamp': datetime.now().isoformat(),
                        'expose_id': expose_id,
                        'reason': reason,
                        'details': details,
                        'url': data.get('url', '')
                    }
                    f.write(json.dumps(failure_record, ensure_ascii=False) + '\n')

                # Обновляем tracking.json с информацией об ошибке
                if expose_id:
                    tracking = load_tracking()
                    expose_id_str = str(expose_id)
                    if expose_id_str not in tracking:
                        tracking[expose_id_str] = {
                            "timestamp": datetime.now().isoformat(),
                            "sent": False,
                            "attempts": 1
                        }
                    else:
                        tracking[expose_id_str]["attempts"] = tracking[expose_id_str].get("attempts", 0) + 1

                    tracking[expose_id_str]["status"] = "failed"
                    tracking[expose_id_str]["sent"] = False
                    tracking[expose_id_str]["reason"] = reason or "Unknown failure"
                    save_tracking(tracking)

                    # Сигнал в очередь чтобы open_apartment не ждал 60с
                    contact_log_queue.put({
                        "expose_id": expose_id,
                        "status": "failed",
                        "reason": reason
                    })

                    # Очищаем из очереди обработки
                    if expose_id_str in apartments_in_queue:
                        apartments_in_queue.discard(expose_id_str)

            except Exception as e:
                print(f"❌ Ошибка при обработке лога об ошибке: {e}")
            
            # Ответ расширению
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
        
        elif self.path == "/api/extension-heartbeat":
            # Расширение отправляет сигнал что оно живо
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                print(f"🟢 HEARTBEAT: Расширение живо на {data.get('url', '?')}")
            except:
                print(f"🟢 HEARTBEAT: Расширение живо")
            
            # Ответ расширению
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))

        elif self.path == "/apartment/deleted":
            # Расширение отправляет уведомление о удаленной квартире
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'

            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                expose_id = data.get('expose_id')
                address = data.get('address', '')

                print(f"🗑️  ОБЪЯВЛЕНИЕ УДАЛЕНО (ID:{expose_id}): {address}")

                # Обновляем tracking с информацией об удалении
                tracking = load_tracking()
                expose_id_str = str(expose_id)
                if expose_id_str not in tracking:
                    tracking[expose_id_str] = {
                        "timestamp": datetime.now().isoformat(),
                        "sent": False,
                        "attempts": 0
                    }

                tracking[expose_id_str]["status"] = "deleted"
                tracking[expose_id_str]["sent"] = False
                tracking[expose_id_str]["deleted_at"] = datetime.now().isoformat()
                tracking[expose_id_str]["reason"] = "Angebot wurde deaktiviert"
                if address:
                    tracking[expose_id_str]["address"] = address
                    address_key = extract_street_house_key(address)
                    if address_key:
                        tracking[expose_id_str]["address_key"] = address_key

                save_tracking(tracking)

                # Очищаем из очереди если там была
                if expose_id_str in apartments_in_queue:
                    apartments_in_queue.discard(expose_id_str)
                address_key = extract_street_house_key(address)
                if address_key and address_key in addresses_in_queue:
                    addresses_in_queue.discard(address_key)

                # Кладём сигнал в очередь чтобы wait_for_contact_log не ждал 60 сек
                contact_log_queue.put({
                    "expose_id": expose_id,
                    "status": "deleted",
                    "address": address
                })

            except Exception as e:
                print(f"❌ Ошибка при обработке удаленного объявления: {e}")

            # Ответ расширению
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))

        else:
            self.send_response(404)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
    
    def log_message(self, format, *args):
        """Отключаем стандартное логирование"""
        pass

# ============================================================================
# УПРАВЛЕНИЕ ФАЙЛАМИ ОТСЛЕЖИВАНИЯ
# ============================================================================

def load_tracking():
    """Загружает список уже отправленных контактов"""
    if Path(TRACK_FILE).exists():
        with open(TRACK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_tracking(data):
    """Сохраняет список отправленных контактов"""
    with open(TRACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def should_process_apartment(expose_id, address, tracking):
    """Единая проверка: нужно ли обрабатывать квартиру.
    Returns (should_process: bool, reason: str)
    """
    expose_id_str = str(expose_id)

    # Жесткий ручной blacklist по ID объявления
    if expose_id_str in EXCLUDED_EXPOSE_IDS:
        return False, "manual_exclude"

    if expose_id_str in tracking:
        entry = tracking[expose_id_str]

        # Финальный статус: контакт отправлен успешно
        if entry.get("sent", False):
            return False, "already_sent"

        status = entry.get("status", "")

        # Удалена: не трогаем
        if status == "deleted":
            return False, "deleted"

        # Любой другой статус при sent=false не переобрабатываем автоматически
        # (повторная отправка = нарушение). Только вручную.
        return False, f"already_processed_{status or 'unsent'}"

    # Дедупликация только по точному ключу "улица+дом"
    address_key = extract_street_house_key(address)
    if address_key:
        for tracked_id, tracked_data in tracking.items():
            if not tracked_data.get("sent", False):
                continue
            tracked_key = tracked_data.get("address_key") or extract_street_house_key(tracked_data.get("address", ""))
            if tracked_key and tracked_key == address_key:
                return False, f"street_house_duplicate_of_{tracked_id}"

    # Нет в tracking → новая квартира
    return True, "new"


def load_seen_history():
    """Загружает историю ВСЕХ просмотренных объявлений"""
    if Path(SEEN_HISTORY_FILE).exists():
        with open(SEEN_HISTORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_seen_history(data):
    """Сохраняет историю просмотренных объявлений"""
    with open(SEEN_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def add_apartment_to_history(expose_id, title="", district=""):
    """Добавляет объявление в историю просмотренных (независимо от результата)"""
    history = load_seen_history()
    if str(expose_id) not in history:
        history[str(expose_id)] = {
            "first_seen": datetime.now().isoformat(),
            "title": title,
            "district": district
        }
        save_seen_history(history)

def sync_tracking_from_server():
    """Синхронизирует tracking с уже отправленными контактами из БД"""
    if not STORAGE_DB_ENABLED:
        # Fallback к локальным файлам
        return load_tracking()
    
    try:
        import psycopg2

        conn = psycopg2.connect(**config.get_db_connection_params())
        cursor = conn.cursor()
        
        # Получаем все контакты со статусом 'sent'
        cursor.execute("""
            SELECT expose_id, timestamp, email, first_name, last_name
            FROM public.contacts
            WHERE status = 'sent'
            ORDER BY timestamp DESC
        """)
        
        tracking = {}
        for row in cursor.fetchall():
            expose_id = str(row[0])
            tracking[expose_id] = {
                "expose_id": expose_id,
                "timestamp": row[1].isoformat() if row[1] else None,
                "email": row[2],
                "first_name": row[3],
                "last_name": row[4],
                "sent": True
            }
        
        cursor.close()
        conn.close()
        
        return tracking
        
    except Exception as e:
        print(f"⚠️  Ошибка синхронизации с БД: {e}")
        # Fallback к локальным файлам
        return load_tracking()

def update_tracking(expose_id, address=""):
    """Отмечает контакт как успешно отправленный"""
    # Всегда обновляем локальный tracking.json (это основной источник для системы)
    tracking = load_tracking()
    expose_id_str = str(expose_id)
    if expose_id_str not in tracking:
        tracking[expose_id_str] = {
            "timestamp": datetime.now().isoformat(),
            "sent": True,
            "attempts": 1
        }
    else:
        tracking[expose_id_str]["sent"] = True
        tracking[expose_id_str]["attempts"] = tracking[expose_id_str].get("attempts", 1) + 1

    # Сохраняем адрес если предоставлен
    if address:
        tracking[expose_id_str]["address"] = address
        address_key = extract_street_house_key(address)
        if address_key:
            tracking[expose_id_str]["address_key"] = address_key

    save_tracking(tracking)

    # Удаляем из очереди обработки (успешно обработана)
    expose_id_str = str(expose_id)
    if expose_id_str in apartments_in_queue:
        apartments_in_queue.discard(expose_id_str)

    # Попытаемся также обновить в БД (но это опционально)
    if STORAGE_DB_ENABLED:
        try:
            import storage_db
            storage_db.mark_as_sent(expose_id)
        except Exception as e:
            print(f"⚠️  Не удалось обновить expose_id={expose_id} в БД: {e}")
            print(f"   ✅ Но локальный tracking.json обновлен успешно")

def mark_apartment_attempted(expose_id, address=""):
    """Отмечает квартиру как открытую для попытки (sent остается False до подтверждения от extension)."""
    tracking = load_tracking()
    expose_id_str = str(expose_id)

    if expose_id_str not in tracking:
        tracking[expose_id_str] = {
            "timestamp": datetime.now().isoformat(),
            "sent": False,
            "attempts": 1,
            "status": "opened"
        }
    else:
        tracking[expose_id_str]["attempts"] = tracking[expose_id_str].get("attempts", 0) + 1
        if not tracking[expose_id_str].get("sent", False):
            tracking[expose_id_str]["status"] = "opened"

    if address:
        tracking[expose_id_str]["address"] = address
        address_key = extract_street_house_key(address)
        if address_key:
            tracking[expose_id_str]["address_key"] = address_key

    save_tracking(tracking)

def save_contact_log(data):
    """Сохраняет логирование контакта в JSONL файл и БД"""
    # Сохраняем в локальный файл
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False) + '\n')
    
    # Сохраняем в БД
    if STORAGE_DB_ENABLED:
        try:
            import storage_db
            storage_db.save_contact(
                expose_id=data.get("expose_id"),
                timestamp=data.get("timestamp"),
                email=data.get("contact_info", {}).get("email", ""),
                phone=data.get("contact_info", {}).get("phone", ""),
                first_name=data.get("contact_info", {}).get("firstName", ""),
                last_name=data.get("contact_info", {}).get("lastName", ""),
                url=data.get("url")
            )
        except Exception as e:
            print(f"⚠️  Ошибка сохранения контакта в БД: {e}")

def save_apartment_log(apartment_data):
    """Сохраняет информацию об обработанной квартире в JSONL файл и БД"""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "id": apartment_data.get("id"),
        "title": apartment_data.get("title"),
        "address": apartment_data.get("address"),
        "price": apartment_data.get("price"),
        "rooms": apartment_data.get("rooms"),
        "district": apartment_data.get("district"),
        "status": apartment_data.get("status"),  # "skipped" или "contacted"
        "reason": apartment_data.get("reason"),  # причина пропуска если есть
        "url": apartment_data.get("url")
    }
    with open(APARTMENT_LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

    # Если квартира удалена (не найдена) - это уже обработано в /apartment/deleted endpoint
    # или в открытии браузера при таймауте. Не дублируем здесь.
    
    # Сохраняем в БД
    if STORAGE_DB_ENABLED:
        try:
            import storage_db
            storage_db.save_apartment(
                apartment_id=log_entry["id"],
                title=log_entry["title"],
                address=log_entry["address"],
                price=log_entry["price"],
                rooms=float(log_entry["rooms"]) if log_entry["rooms"] else None,
                district=log_entry["district"],
                marketing_type=apartment_data.get("marketing_type", ""),
                url=log_entry["url"],
                lat=apartment_data.get("lat"),
                lon=apartment_data.get("lon"),
                postcode=apartment_data.get("postcode", "")
            )
        except Exception as e:
            print(f"⚠️  Ошибка сохранения квартиры в backend database: {e}")
    
    # Отправляем в Telegram (только для важных пропусков, не для обменных)
    if TELEGRAM_ENABLED:
        if log_entry["status"] == "skipped":
            # НЕ отправляем пропуски в Telegram - только статистика в конце цикла
            pass
        elif log_entry["status"] == "contacted":
            telegram_bridge.log_apartment_contacted(
                log_entry["title"],
                log_entry["id"]
            )

# ============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================================================

def parse_district(address_line):
    """
    Парсит название района из адреса, удаляя дополнительные аннотации.
    Примеры:
    - "Hamburg, Winterhude (unvollständige Adresse)" → "Winterhude"
    - "Hamburg, Barmbek-Nord" → "Barmbek-Nord"
    """
    if not address_line:
        return ""
    
    # Берем последнюю часть после запятой
    district = address_line.split(",")[-1].strip()
    
    # Удаляем аннотации в скобках (unvollständige Adresse и т.п.)
    # Берем только первую часть до скобок
    if "(" in district:
        district = district.split("(")[0].strip()
    
    return district

def extract_street_house_key(address_line):
    """
    Возвращает ключ "улица+дом" для дедупликации.
    Если в адресе нет улицы и номера дома (например unvollständige Adresse) -> None.
    """
    if not address_line:
        return None

    line = str(address_line).strip()
    if not line:
        return None

    # Для неполных адресов (район/индекс без улицы и дома) дедупликацию не применяем
    if 'unvollständige adresse' in line.lower():
        return None

    # Обычно улица+дом находится в первой части до запятой
    first_part = line.split(',', 1)[0].strip()

    # Пример: "Jarrestraße 25" -> street="Jarrestraße", number="25"
    match = re.search(r'(?P<street>.+?)\s+(?P<number>\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)\s*$', first_part)
    if not match:
        return None

    street = re.sub(r'\s+', ' ', match.group('street')).strip().lower()
    number = match.group('number').strip().lower()

    if not street or not number:
        return None

    return f"{street} {number}"

# ============================================================================
# API ЗАПРОСЫ
# ============================================================================

def get_apartments():
    """Получает квартиры из Гамбурга и возвращает по мере нахождения (генератор)
    Не ждет накопления 3 - отправляет сразу как прошли фильтры
    """
    apartments = []
    
    print(f"  🔍 Запрашиваю квартиры в Гамбурге...")
    
    # Счетчики для агрегирования фильтров
    skipped_swap = 0
    skipped_rooms = 0
    skipped_district = 0
    skipped_already_processed = 0
    total_processed = 0
    
    # Для отладки - считаем уникальные районы и комнаты
    all_districts = {}
    all_rooms = {}
    
    # Загружаем tracking чтобы исключить уже обработанные квартиры
    tracking = sync_tracking_from_server()
    
    try:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "de-DE,de;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Referer": "https://www.immobilienscout24.de/",
            "Origin": "https://www.immobilienscout24.de"
        }
        
        # Фетчим несколько страниц пока не найдем валидные квартиры в целевых районах
        max_pages = 5
        valid_found = 0
        
        for page_num in range(1, max_pages + 1):
            params = {
                "searchType": "region",
                "realestatetype": "apartmentrent",
                "pricetype": "calculatedtotalrent",
                "geocodes": ",".join(HAMBURG_GEOCODES),
                "numberofrooms": "2.5-4.5",
                "pagenumber": page_num
            }
            
            body = {
                "supportedResultListTypes": [], 
                "userData": {}
            }
            
            response = requests.post(
                f"{API_BASE}/search/list",
                params=params,
                json=body,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"    ❌ Ошибка API на странице {page_num}: {response.status_code}")
                print(f"       Ответ: {response.text[:200]}")
                
                # Если 412, скорее всего параметры неправильные
                if response.status_code == 412:
                    print(f"       💡 412 = неправильные параметры запроса")
                    print(f"       Параметры: {params}")
                    print(f"       Body: {body}")
                
                break
            
            data = response.json()
            results = data.get("resultListItems", [])
            
            if not results:
                print(f"    ℹ️  Нет результатов на странице {page_num}")
                break
            
            # ✅ СОРТИРУЕМ ПО ДАТЕ ПУБЛИКАЦИИ (новые первыми)
            # Поле 'published' содержит timestamp в формате "2026-03-07T14:30:00Z"
            try:
                results.sort(
                    key=lambda x: x.get("item", {}).get("published", ""),
                    reverse=True  # Новые первыми (большее время = позже = новее)
                )
                print(f"    📄 Страница {page_num}: обработка {len(results)} результатов (отсортировано по новизне)...")
            except Exception as e:
                print(f"    ⚠️  Ошибка при сортировке: {e}")
                print(f"    📄 Страница {page_num}: обработка {len(results)} результатов...")
            
            for item in results:
                if item.get("type") == "EXPOSE_RESULT":
                    expose = item.get("item", {})
                    expose_id = expose.get("id")
                    title = expose.get("title", "")
                    address_line = expose.get("address", {}).get("line", "")
                    postcode = expose.get("address", {}).get("postcode", "")
                    lat = expose.get("address", {}).get("lat")
                    lon = expose.get("address", {}).get("lon")
                    district = parse_district(address_line)
                    
                    # 🔧 Парсим количество комнат из attributes[ ] list
                    rooms = None
                    attributes = expose.get("attributes", [])
                    if isinstance(attributes, list) and len(attributes) >= 3:
                        # attributes это список: [цена, площадь, комнаты]
                        # Комнаты в формате "3 Zi." или "3 Zimmer"
                        zimmer_str = attributes[2].get("value", "")  # "3 Zi."
                        try:
                            # Извлекаем число из "3 Zi." -> 3.0
                            rooms = float(zimmer_str.split()[0])
                        except (ValueError, IndexError):
                            rooms = None
                    
                    price = expose.get("price")
                    market_type = expose.get("marketingType", "")
                    url = f"https://www.immobilienscout24.de/expose/{expose_id}"
                    
                    total_processed += 1
                    
                    # Собираем статистику районов и комнат для отладки
                    if district:
                        all_districts[district] = all_districts.get(district, 0) + 1
                    if rooms:
                        all_rooms[str(rooms)] = all_rooms.get(str(rooms), 0) + 1
                    
                    total_processed += 1
                    
                    # Ручное исключение по expose_id
                    if str(expose_id) in EXCLUDED_EXPOSE_IDS:
                        save_apartment_log({
                            "id": expose_id,
                            "title": title,
                            "address": address_line,
                            "price": price,
                            "rooms": rooms,
                            "district": district,
                            "status": "skipped",
                            "reason": "manual_exclude",
                            "url": url
                        })
                        continue

                    # ИСКЛЮЧАЕМ ОБМЕННЫЕ КВАРТИРЫ
                    swap_keywords = ["tausch", "austausch", "wechsel", "swap", "exchange"]
                    is_swap = (
                        market_type == "SWAP" or 
                        any(keyword in title.lower() for keyword in swap_keywords)
                    )
                    
                    # DEBUG: Логируем ID 166030674 для отладки
                    if expose_id == 166030674:
                        print(f"🔍 DEBUG ID 166030674:")
                        print(f"   Title from API: '{title}'")
                        print(f"   Market type: '{market_type}'")
                        print(f"   Swap keywords found: {[kw for kw in swap_keywords if kw in title.lower()]}")
                        print(f"   Is SWAP: {is_swap}")
                    
                    if is_swap:
                        skipped_swap += 1
                        save_apartment_log({
                            "id": expose_id,
                            "title": title,
                            "address": address_line,
                            "price": price,
                            "rooms": rooms,
                            "district": district,
                            "status": "skipped",
                            "reason": "SWAP (обменная квартира)",
                            "url": url
                        })
                        continue
                    
                    # ФИЛЬТРУЕМ ПО КОЛИЧЕСТВУ КОМНАТ (ищем 3-4 комнатные)
                    if rooms:
                        try:
                            rooms_count = float(rooms)
                            if rooms_count < 3 or rooms_count > 4.5:
                                skipped_rooms += 1
                                save_apartment_log({
                                    "id": expose_id,
                                    "title": title,
                                    "address": address_line,
                                    "price": price,
                                    "rooms": rooms,
                                    "district": district,
                                    "status": "skipped",
                                    "reason": f"Неподходящее количество комнат: {rooms} (ищем 3-4.5)",
                                    "url": url
                                })
                                continue
                        except:
                            pass
                    
                    # Фильтруем по целевым районам
                    if district not in HAMBURG_DISTRICTS:
                        skipped_district += 1
                        save_apartment_log({
                            "id": expose_id,
                            "title": title,
                            "address": address_line,
                            "price": price,
                            "rooms": rooms,
                            "district": district,
                            "status": "skipped",
                            "reason": f"Район '{district}' не в целевом списке",
                            "url": url
                        })
                        continue
                    
                    # Если ID уже был в tracking — не переобрабатываем автоматически
                    if str(expose_id) in tracking:
                        skipped_already_processed += 1
                        continue
                    
                    # Квартира прошла все фильтры - добавляем в список
                    apartment = {
                        "id": expose_id,
                        "title": title,
                        "address": address_line,
                        "postcode": postcode,
                        "price": price,
                        "rooms": rooms,
                        "district": district,
                        "lat": lat,
                        "lon": lon,
                        "marketing_type": market_type,
                        "url": url
                    }
                    if apartment["id"]:
                        apartments.append(apartment)
                        found_time = datetime.now().strftime("%H:%M:%S")
                        
                        # ПРОПУСКАЕМ если уже полностью обработана (sent=true)
                        if str(expose_id) in tracking and tracking[str(expose_id)].get('sent', False):
                            skipped_already_processed += 1
                            print(f"    ⏭️  Пропущена {found_time} (ID:{expose_id}): {title[:45]} (уже обработана)")
                            continue
                        
                        print(f"    ✅ Найдена в {found_time} (ID:{expose_id}): {title[:45]} ({rooms} комнат, {district})")
                        
                        # Отправляем уведомление в Telegram для новых квартир
                        if TELEGRAM_ENABLED:
                            try:
                                telegram_bridge.notify_apartment_found(
                                    expose_id=str(expose_id),
                                    title=title,
                                    district=district,
                                    price=price,
                                    rooms=rooms,
                                    url=url
                                )
                            except Exception as e:
                                print(f"    ⚠️  Не удалось отправить уведомление: {e}")
                        
                        # Логируем в timeline (в backend database)
                        if STORAGE_DB_ENABLED:
                            try:
                                storage_db.log_apartment_found(
                                    expose_id=str(expose_id),
                                    title=title,
                                    district=district,
                                    price=price,
                                    rooms=rooms,
                                    url=url
                                )
                            except Exception as e:
                                print(f"    ⚠️  Не удалось залогировать найденную квартиру: {e}")
                        
                        if TELEGRAM_ENABLED:
                            telegram_bridge.log_apartment_added(title, rooms, district, price, expose_id, url)
        
        # Выводим агрегированную статистику пропусков
        print(f"\n    📊 Фильтрация результатов (обработано {total_processed}):")
        print(f"    🎯 Ищем в районах: {', '.join(sorted(HAMBURG_DISTRICTS))}")
        
        # Показываем найденные районы и комнаты для отладки
        if all_districts:
            print(f"    📍 Встреченные районы: {dict(sorted(all_districts.items(), key=lambda x: x[1], reverse=True))}")
        if all_rooms:
            print(f"    🏠 Встреченные кол-во комнат: {dict(sorted(all_rooms.items(), key=lambda x: x[1], reverse=True))}")
        
        if skipped_swap > 0:
            print(f"    ⏭️  Пропущено {skipped_swap} обменных квартир (SWAP/Tausch)")
        if skipped_rooms > 0:
            print(f"    ⏭️  Пропущено {skipped_rooms} квартир (неподходящее кол-во комнат - ищем 3-4)")
        if skipped_district > 0:
            print(f"    ⏭️  Пропущено {skipped_district} квартир (неподходящие районы)")
        if skipped_already_processed > 0:
            print(f"    ✅ Пропущено {skipped_already_processed} квартир (уже обработаны)")
        
        # Отправляем агрегированную статистику в Telegram (только важные пропуски)
        if TELEGRAM_ENABLED and total_processed > 0:
            if skipped_rooms > 0 or skipped_district > 0:
                stats_text = f"Обработано {total_processed} квартир:\n"
                if skipped_rooms > 0:
                    stats_text += f"  • {skipped_rooms} неподходящее кол-во комнат\n"
                if skipped_district > 0:
                    stats_text += f"  • {skipped_district} неподходящие районы\n"
                if skipped_swap > 0:
                    stats_text += f"  • {skipped_swap} обменные (не показываю в Telegram)"
                telegram_bridge.send_message(stats_text)
    
    except Exception as e:
        print(f"    ❌ Ошибка: {e}")
    
    return apartments

def sync_tracking_from_server():
    """Синхронизирует tracking с backend database
    Получает все успешно отправленные контакты из backend database и обновляет локальный tracking.json
    """
    if not STORAGE_DB_ENABLED:
        return load_tracking()
    
    try:
        import storage_db
        # Получаем все контакты из backend database
        contacts = storage_db.get_all_contacts()
        
        # Обновляем локальный tracking
        tracking = load_tracking()
        updated = False
        
        for contact in contacts:
            expose_id = str(contact.get('expose_id'))
            if expose_id not in tracking:
                tracking[expose_id] = {
                    "timestamp": contact.get('timestamp'),
                    "sent": contact.get('status') == 'sent',
                    "attempts": 1
                }
                updated = True
            # Обновляем статус если изменился
            elif tracking[expose_id].get("sent") != (contact.get('status') == 'sent'):
                tracking[expose_id]["sent"] = contact.get('status') == 'sent'
                updated = True
        
        if updated:
            save_tracking(tracking)
            print(f"🔄 Синхронизация завершена: {len([t for t in tracking.values() if t.get('sent')])} отправлено")
        
        return tracking
    except Exception as e:
        print(f"⚠️  Ошибка синхронизации с backend database: {e}")
        return load_tracking()

def get_new_apartments(all_apartments):
    """Фильтрует квартиры для обработки используя should_process_apartment.

    Логика:
    - sent:true → никогда не обрабатывается (завершено)
    - status:deleted + в пределах 24ч → пропускаем
    - status:deleted + свыше 24ч → повтор разрешен
    - status:timeout → повтор разрешен
    - status:failed → повтор разрешен (до 5 попыток)
    - новые (не в tracking) → обрабатываются
    - дедупликация по адресу
    """
    tracking = load_tracking()
    to_process = []

    for a in all_apartments:
        apt_id = str(a['id'])
        address = a.get('address', '')

        should_process, reason = should_process_apartment(apt_id, address, tracking)

        if should_process:
            print(f"   ✅ Обрабатываю: {apt_id} (reason: {reason})")
            to_process.append(a)
        else:
            print(f"   ⏭️  Пропускаю: {apt_id} (reason: {reason})")

    if to_process:
        print(f"📋 Квартир для обработки: {len(to_process)}")
    else:
        print(f"ℹ️  Нет квартир для обработки")

    return to_process[:5]  # Максимум 5 за раз

# ============================================================================
# ОБРАБОТЧИК ОЧЕРЕДИ КВАРТИР (ПАРАЛЛЕЛЬНАЯ ОБРАБОТКА)
# ============================================================================

def apartment_processor_worker():
    """Обработчик очереди - берет квартиры с задержкой между ними для избежания капчи"""
    global apartment_processing_stop
    
    import random
    
    print("🔧 Обработчик квартир запущен (обрабатывает с задержкой 30-60сек для избежания капчи)")
    
    while not apartment_processing_stop:
        try:
            # Берем квартиру из очереди (с таймаутом 1 сек чтобы не зависнуть)
            apartment = apartment_processing_queue.get(timeout=1)
            
            print(f"\n📋 Из очереди взята квартира ID:{apartment.get('id')}")
            
            # Открываем в браузер
            open_apartment(apartment)

            # Очищаем из очередей после обработки (успешно или нет)
            apt_id_str = str(apartment.get('id'))
            apt_address = apartment.get('address', '')
            if apt_id_str in apartments_in_queue:
                apartments_in_queue.discard(apt_id_str)
            apt_address_key = extract_street_house_key(apt_address)
            if apt_address_key and apt_address_key in addresses_in_queue:
                addresses_in_queue.discard(apt_address_key)

            # ОЖИДАНИЕ 30-60 СЕК перед следующей квартирой (избегаем капчи)
            delay = random.randint(30, 60)
            print(f"⏱️ Ожидаю {delay}с перед следующей квартирой (избежание капчи)...")
            time.sleep(delay)

            apartment_processing_queue.task_done()
            
        except queue.Empty:
            # Очередь пуста - продолжаем ждать
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Ошибка в обработчике квартир: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(1)

# ============================================================================
# ОТКРЫТИЕ КВАРТИР В БРАУЗЕРЕ
# ============================================================================

def open_apartment(apartment):
    """Открывает квартиру в Chrome с расширением (на Mac и Linux)"""
    import subprocess
    import platform
    
    apt_id = apartment['id']
    
    url = f"https://www.immobilienscout24.de/expose/{apt_id}"
    
    print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 ОТКРЫВАЮ КВАРТИРУ (ID:{apt_id}):
   {apartment.get('title', 'N/A')}
   {apartment.get('address', 'N/A')}
   💰 {apartment.get('price', 'N/A')}
   📍 {apartment.get('district', 'N/A')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 {url}
    """)
    
    # Определяем ОС и открываем Chrome с расширением в правильном профиле
    try:
        if platform.system() == "Darwin":  # macOS
            # На Mac используем Profile 21 (где установлено расширение)
            print(f"📱 Открываю на macOS (Profile 21)...")
            subprocess.Popen([
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "--profile-directory=Profile 21",
                url
            ])
            print("✅ Chrome запущен")
        else:  # Linux
            # На Linux используем Profile 5 (где установлено расширение)
            # DISPLAY=:1 для GUI сессии
            print(f"🐧 Открываю на Linux ({CHROME_PROFILE_DIR})...")
            cmd = (
                f"{build_linux_chrome_env_prefix()} {CHROME_PATH} "
                f"--profile-directory='{CHROME_PROFILE_DIR}' "
                f"--remote-debugging-port={CHROME_DEBUG_PORT} "
                f"'{url}' > /tmp/chrome_apartment.log 2>&1 &"
            )
            print(f"   → Команда: {cmd[:80]}...")
            result = subprocess.Popen(cmd, shell=True)
            print(f"✅ Chrome запущена (PID: {result.pid})")
    except Exception as e:
        print(f"❌ ОШИБКА при открытии браузера: {e}")
        print(f"   Проверьте:")
        print(f"   1. Chrome установлена? (ls {CHROME_PATH})")
        print(f"   2. Профиль существует? (ls ~/.config/google-chrome/{CHROME_PROFILE_DIR})")
        print(f"   3. DISPLAY установлена? (echo $DISPLAY)")
        print(f"   4. Логи Chrome: cat /tmp/chrome_apartment.log")
        return False
    
    # Расширение обрабатывает квартиру асинхронно.
    # Важно: при открытии НЕ ставим sent=true, только фиксируем попытку.
    apt_id = apartment['id']
    apt_address = apartment_addresses.get(str(apt_id), apartment.get("address", ""))

    print(f"📝 Помечаю как открытую для попытки (sent=false, ждем /contact_sent)")
    mark_apartment_attempted(apt_id, address=apt_address)

    return True

# ============================================================================
# ОСНОВНОЙ ЦИКЛ
# ============================================================================

def monitoring_loop():
    """Основной цикл мониторинга"""
    
    print("""
╔══════════════════════════════════════════════════════════════════════════╗
║   🏠 АВТОМОНИТОРИНГ НОВЫХ КВАРТИР + АВТООТПРАВКА КОНТАКТОВ              ║
║   ✅ Расширение автоматически заполняет и отправляет контакты           ║
║   Python просто открывает квартиры и ждет логирования                   ║
╚══════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Показываем статус
    tracking = load_tracking()
    sent_count = sum(1 for v in tracking.values() if v.get("sent"))
    print(f"📊 Статус:\n   ✅ Успешно отправлено контактов: {sent_count}\n   📋 Всего попыток: {len(tracking)}")
    
    cycle = 0
    last_report_time = time.time()  # Для отправки отчета каждые 5 минут
    REPORT_INTERVAL = 300  # 5 минут
    
    try:
        while True:
            cycle += 1
            cycle_time = datetime.now().strftime('%H:%M:%S')
            print(f"\n🔄 ЦИКЛ #{cycle} - {cycle_time}")
            
            # Синхронизируем tracking с уже отправленными контактами
            print("🔄 Синхронизирую статус отправленных контактов...")
            tracking = sync_tracking_from_server()
            already_sent = sum(1 for v in tracking.values() if v.get("sent"))
            print(f"✅ В БД {already_sent} успешно отправленных контактов")
            
            if TELEGRAM_ENABLED:
                telegram_bridge.log_cycle_start(cycle, cycle_time)
            
            # Получаем все квартиры
            print("📡 Получаю список квартир...")
            all_apartments = get_apartments()
            print(f"✅ Всего квартир найдено: {len(all_apartments)}")
            if TELEGRAM_ENABLED:
                telegram_bridge.log_apartments_found(len(all_apartments))
            
            # Фильтруем: новые и повторные попытки
            apartments_to_process = get_new_apartments(all_apartments)

            # Проверяем Gmail каждые 5 минут
            current_time = time.time()
            if GMAIL_ENABLED and (not hasattr(monitoring_loop, 'last_gmail_check') or
                                   current_time - monitoring_loop.last_gmail_check >= 300):  # 300 сек = 5 мин
                print("\n📧 Проверяю Gmail на новые квартиры...")
                gmail_apartments = gmail_checker.check_gmail()

                if gmail_apartments:
                    print(f"✅ Найдено в Gmail: {len(gmail_apartments)} квартир")

                    # Обрабатываем каждую квартиру из Gmail
                    for gmail_apt in gmail_apartments:
                        expose_id = gmail_apt.get("expose_id")
                        address = gmail_apt.get("address", "")

                        tracking = load_tracking()

                        # Единая проверка should_process_apartment
                        should_process, reason = should_process_apartment(expose_id, address, tracking)
                        if not should_process:
                            print(f"   ⏭️  Квартира {expose_id} пропущена (reason: {reason})")
                            continue

                        # Также проверяем в очереди (может быть добавлена с другого источника)
                        if str(expose_id) in apartments_in_queue:
                            print(f"   ⏭️  Квартира {expose_id} уже в очереди (дубликат отклонен)")
                            continue
                        address_key = extract_street_house_key(address)
                        if address_key and address_key in addresses_in_queue:
                            print(f"   ⚠️  Адрес (street+house) '{address[:50]}' уже в обработке (дубликат отклонен)")
                            continue

                        # Создаем объект квартиры для обработки
                        apt = {
                            "id": expose_id,
                            "title": f"From Gmail #{expose_id}",
                            "address": address,
                            "price": "?",
                            "rooms": 0,
                            "district": "?"
                        }

                        apartments_to_process.append(apt)
                        print(f"   ➕ Добавлена квартира {expose_id} из Gmail")
                        if address:
                            print(f"      📍 Адрес: {address}")

                monitoring_loop.last_gmail_check = current_time

            # Добавляем в очередь обработки (обработчик в отдельном потоке заберет с 10сек задержкой)
            if apartments_to_process:
                print(f"📋 В очередь на обработку: {len(apartments_to_process)} квартир")
                for apt in apartments_to_process:
                    # Выводим информацию о добавляемой квартире
                    apt_id = apt.get('id', 'N/A')
                    apt_title = apt.get('title', 'N/A')
                    apt_rooms = apt.get('rooms', 'N/A')
                    apt_district = apt.get('district', 'N/A')
                    apt_price = apt.get('price', 'договор')  # Если цены нет - договор
                    apt_address = apt.get('address', 'N/A')
                    apt_url = f"https://www.immobilienscout24.de/expose/{apt_id}"

                    # Проверка: уже ли в очереди?
                    apt_id_str = str(apt_id)
                    if apt_id_str in apartments_in_queue:
                        print(f"   ⚠️  Квартира {apt_id} уже в очереди (дубликат отклонен)")
                        continue

                    # Добавляем в отслеживание
                    apartments_in_queue.add(apt_id_str)
                    if apt_address != 'N/A' and apt_address != '':
                        apt_address_key = extract_street_house_key(apt_address)
                        if apt_address_key:
                            addresses_in_queue.add(apt_address_key)

                    # Форматируем цену
                    if apt_price is None or apt_price == 'договор':
                        price_str = "🤝 договариваются"
                    else:
                        price_str = f"💰 {apt_price}€"

                    print(f"""
✅ Квартира добавлена в очередь
📝 {apt_title}
📍 {apt_address}
🛏️  {apt_rooms} комнат | 🏘️ {apt_district} | {price_str}
🔗 ID: {apt_id}
🌐 {apt_url}
                    """.strip())

                    apartment_processing_queue.put(apt)
            else:
                print("ℹ️  Нет квартир для обработки")
            
            # Обновляем статус перед следующей проверкой
            tracking = load_tracking()
            sent_count = sum(1 for v in tracking.values() if v.get("sent"))
            print(f"\n📊 Текущий статус: {sent_count} успешно отправлено")
            if TELEGRAM_ENABLED:
                telegram_bridge.log_cycle_summary(
                    len(all_apartments) if 'all_apartments' in locals() else 0,
                    sent_count,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                )
            
            # Проверяем (отправляем ежедневный отчет каждые 5 минут)
            current_time = time.time()
            if current_time - last_report_time >= REPORT_INTERVAL:
                if TELEGRAM_ENABLED:
                    print(f"📋 Отправляю ежедневный отчет в Telegram...")
                    telegram_bridge.send_daily_submissions_report()
                last_report_time = current_time
            
            # Ждем перед следующей проверкой
            print(f"⏳ Жду {CHECK_INTERVAL}с до следующей проверки...")
            time.sleep(CHECK_INTERVAL)
    
    except KeyboardInterrupt:
        global apartment_processing_stop
        apartment_processing_stop = True
        print("\n\n⛔ МОНИТОРИНГ ОСТАНОВЛЕН (Ctrl+C)")
        tracking = load_tracking()
        sent_count = sum(1 for v in tracking.values() if v.get("sent"))
        print(f"📊 ИТОГО: {sent_count} контактов успешно отправлено из {len(tracking)} попыток")

# ============================================================================
# ГЛАВНАЯ
# ============================================================================

# ============================================================================
# ЕЖЕДНЕВНАЯ ПЕРЕЗАГРУЗКА CHROME (ночью для сброса глюков)
# ============================================================================

def ensure_xvfb_running():
    """Убеждается что Xvfb виртуальный X сервер запущен (необходимо для Chrome)"""
    import subprocess
    
    try:
        # Проверяем есть ли Xvfb на :1
        result = subprocess.run(
            "ps aux | grep -i xvfb | grep -v grep",
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "Xvfb :1" in result.stdout or ":1" in result.stdout:
            # Xvfb уже запущен
            return True
        
        # Xvfb не запущен - запускаем его
        print("  🖥️  Запускаю Xvfb (виртуальный X сервер)...")
        subprocess.Popen(
            "Xvfb :1 -screen 0 1920x1080x24 > /tmp/xvfb.log 2>&1 &",
            shell=True
        )
        time.sleep(2)  # Даем серверу время на запуск
        
        # Проверяем запуск
        result = subprocess.run(
            "DISPLAY=:1 xhost +local: 2>/dev/null || echo 'ok'",
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        print("  ✅ Xvfb запущен на :1")
        return True
        
    except Exception as e:
        print(f"  ⚠️  Ошибка при запуске Xvfb: {e}")
        return False

def should_restart_chrome():
    """Проверяет нужно ли перезагружать Chrome (один раз в сутки ночью в 3:00)"""
    if not SCHEDULE_ENABLED:
        return False
    
    now = datetime.now()
    # Проверяем если нынешнее время между 03:00 и 03:01
    return now.hour == 3 and now.minute == 0

def close_extra_tabs_cdp(debug_port=9222, keep_first_tab=True):
    """Закрывает ненужные вкладки через Chrome DevTools Protocol.
    Сохраняет ТОЛЬКО мессенджер (проверяет по URL, не по позиции).
    
    Args:
        debug_port: Порт отладки Chrome (по умолчанию 9222)
        keep_first_tab: Если True, оставляет вкладку мессенджера
    
    Returns:
        True если удалось закрыть вкладки, False иначе
    """
    try:
        import requests
        
        # Получаем список вкладок через CDP
        response = requests.get(f"http://localhost:{debug_port}/json/list", timeout=3)
        if response.status_code != 200:
            return False
        
        tabs = response.json()
        closed_count = 0
        messenger_found = False
        
        print(f"  📊 Обнаружено {len(tabs)} вкладок:")
        
        # Сначала ищем мессенджер и закрываем остальное
        for tab in tabs:
            tab_id = tab.get('id')
            tab_title = tab.get('title', 'Unknown')
            tab_url = tab.get('url', '')
            
            # Проверяем мессенджер по URL (более надежно)
            if 'messenger/conversations' in tab_url:
                print(f"     📌 Мессенджер (СОХРАНЯЮ): {tab_title[:50]}...")
                messenger_found = True
            elif 'immobilienscout24.de/expose' in tab_url:
                # Вкладка с объявлением - закрываем
                try:
                    close_response = requests.get(f"http://localhost:{debug_port}/json/close/{tab_id}", timeout=2)
                    if close_response.status_code == 200:
                        print(f"     ✓ Объявление закрыто: {tab_title[:40]}...")
                        closed_count += 1
                except:
                    pass
            elif 'chrome://' not in tab_url and tab_url:
                # Другие вкладки - закрываем
                try:
                    close_response = requests.get(f"http://localhost:{debug_port}/json/close/{tab_id}", timeout=2)
                    if close_response.status_code == 200:
                        print(f"     ✓ Закрыто: {tab_title[:40]}...")
                        closed_count += 1
                except:
                    pass
        
        # Результат
        if closed_count > 0:
            print(f"  ✅ Закрыто {closed_count} вкладок")
        else:
            print(f"  ℹ️  Нечего закрывать")
        
        if messenger_found:
            print(f"  ✓ Мессенджер сохранен как первая вкладка")
        else:
            print(f"  ⚠️  ВНИМАНИЕ: Вкладка мессенджера не найдена!")
            return False
            
        return True
            
    except Exception as e:
        print(f"  ℹ️  CDP недоступен или Chrome не запущен: {e}")
        print(f"     (Это нормально, если Chrome только что запущен)")
        return False

def daily_chrome_restart():
    """Перезагружает Chrome один раз в 24 часа ночью (в 3:00 утра)
    Это нужно для сброса:
    - Открытых в браузере объявлений за день
    - Возможных глюков от долгой работы
    - Очистки памяти
    
    Cookies сохраняются в Profile 5, поэтому сессия не потеряется.
    """
    print("\n" + "="*80)
    print("🔄 ЕЖЕДНЕВНАЯ ПЕРЕЗАГРУЗКА CHROME (03:00)")
    print("="*80)
    
    import subprocess
    import platform
    
    if platform.system() == "Darwin":
        print("ℹ️  На macOS не выполняем автоматическую перезагрузку Chrome")
        return
    
    try:
        # 0. ПРЕДВАРИТЕЛЬНОЕ ЗАКРЫТИЕ НЕНУЖНЫХ ВКЛАДОК (если Chrome запущен)
        print("\n  🔍 Проверяю открытые вкладки...")
        close_extra_tabs_cdp(debug_port=CHROME_DEBUG_PORT, keep_first_tab=True)
        time.sleep(2)
        
        # 1. АГРЕССИВНОЕ закрытие Chrome (полное завершение процесса)
        print("  ⏸️  Закрываю Chrome полностью...")
        
        # Сначала пытаемся корректное завершение
        subprocess.run(
            f"pkill -f 'google-chrome.*{CHROME_PROFILE_DIR}' 2>/dev/null || true",
            shell=True,
            timeout=5
        )
        time.sleep(2)
        
        # Затем ГАРАНТИРОВАННОЕ завершение всех процессов Chrome
        subprocess.run(
            "pkill -9 -f 'google-chrome' 2>/dev/null || true",
            shell=True,
            timeout=5
        )
        time.sleep(3)
        
        # 2. Проверяем что Chrome по-настоящему закрыт
        result = subprocess.run(
            "pgrep -f 'google-chrome' && echo 'running' || echo 'closed'",
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "closed" in result.stdout:
            print("  ✅ Chrome полностью закрыт (сессия сохранена)")
        
        # ВАЖНО: НЕ очищаем файлы сессии! Это сохранит cookies и вкладку мессенджера
        # Сессия восстановится автоматически через флаги
        print("  💾 Сохранена: сессия с cookies и мессенджером...")
        
        # 3. Перезапускаем Chrome как НОВЫЙ процесс (не присоединяемся к старому!)
        print("  🚀 Запускаю Chrome как новый независимый процесс...")
        # --new-instance: КРИТИЧНО! Запускает отдельный процесс вместо присоединения к существующему
        # --restore-last-session: восстановит сохраненные вкладки и cookies
        # --disable-session-crashed-bubble: убирает диалог "Restore pages?" чтобы не было взаимодействия
        # --remote-debugging-port: включает CDP для управления вкладками
        cmd = (
            f'{build_linux_chrome_env_prefix()} {CHROME_PATH} '
            f'--new-instance --profile-directory="{CHROME_PROFILE_DIR}" '
            f'--load-extension="{CHROME_EXTENSION_PATH}" '
            f'--remote-debugging-port={CHROME_DEBUG_PORT} '
            f'--disable-dev-shm-usage --disable-gpu --disable-crash-reporter '
            f'--disable-session-crashed-bubble --restore-last-session '
            f'--disable-background-timer-throttling --disable-component-update '
            f'> /dev/null 2>&1 &'
        )
        subprocess.Popen(cmd, shell=True)
        
        time.sleep(8)  # Даем Chrome время на полную загрузку
        print("  ✅ Chrome перезагружен как новый процесс")
        print("  📍 Открыт мессенджер с восстановленной сессией")
        
        # 4. Отправляем уведомление в Telegram
        if TELEGRAM_ENABLED:
            try:
                telegram_bridge.send_message("🔄 Chrome перезагружен (ежедневная перезагрузка в 03:00)")
            except:
                pass
        
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"  ❌ Ошибка при перезагрузке Chrome: {e}")

def schedule_chrome_restart():
    """Планирует ежедневную перезагрузку Chrome в 03:00"""
    if not SCHEDULE_ENABLED:
        print("⚠️  schedule не установлен, ежедневная перезагрузка отключена")
        return
    
    print("⏰ Планирую ежедневную перезагрузку Chrome на 03:00...")
    
    def scheduler_worker():
        """Фоновый поток для планировщика"""
        schedule.every().day.at("03:00").do(daily_chrome_restart)
        
        while not apartment_processing_stop:
            schedule.run_pending()
            time.sleep(60)  # Проверяем каждую минуту
    
    scheduler_thread = threading.Thread(target=scheduler_worker, daemon=True)
    scheduler_thread.start()
    print("✅ Планировщик запущен")

def init_chrome_with_extension():
    """Проверяет что Chrome Profile 5 с расширением запущен (на Linux)"""
    import subprocess
    import platform
    
    if platform.system() != "Darwin":  # Только на Linux
        print("🔧 Проверяю Chrome Profile 5 с расширением...")
        try:
            # 1. Проверяем есть ли уже запущенный Chrome
            result = subprocess.run(
                f"pgrep -f 'chrome.*{CHROME_PROFILE_DIR}' || echo 'not_found'",
                shell=True,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "not_found" in result.stdout or not result.stdout.strip():
                # Chrome не запущен - запускаем его на реальном дисплее :0 как новый процесс
                print("  ℹ️  Chrome не найден, запускаю как новый процесс...")
                cmd = (
                    f'{build_linux_chrome_env_prefix()} {CHROME_PATH} '
                    f'--new-instance --profile-directory="{CHROME_PROFILE_DIR}" '
                    f'--load-extension="{CHROME_EXTENSION_PATH}" '
                    f'--remote-debugging-port={CHROME_DEBUG_PORT} '
                    f'--disable-dev-shm-usage --disable-gpu --disable-crash-reporter '
                    f'--disable-session-crashed-bubble --disable-component-update '
                    f'about:blank > /dev/null 2>&1 &'
                )
                subprocess.Popen(cmd, shell=True)
                print(f"✅ Chrome запущен с расширением на дисплее {CHROME_DISPLAY}")
                time.sleep(5)  # Даем Chrome время на загрузку
            else:
                # Chrome уже работает
                print(f"✅ Chrome уже запущен (PID: {result.stdout.strip()})")
        except Exception as e:
            print(f"⚠️  Ошибка при проверке Chrome: {e}")

def main():
    """Главная функция"""

    # Миграция: фиксим битые записи со старым неправильным tracking
    print("🔄 МИГРАЦИЯ: Проверяю и фиксю старые записи...")
    try:
        tracking = load_tracking()
        migrated = 0

        # Фиксим записи где status:deleted + sent:true (неправильно из старого кода)
        for apt_id, data in tracking.items():
            if data.get("status") == "deleted" and data.get("sent", False):
                data["sent"] = False
                data["deleted_at"] = data.get("timestamp", datetime.now().isoformat())
                migrated += 1
                print(f"   ✅ Мигрирован {apt_id}: sent:true+deleted → sent:false+deleted_at")

        if migrated > 0:
            save_tracking(tracking)
            print(f"✅ Мигрировано {migrated} записей")
        else:
            print(f"ℹ️  Миграция не требуется")

        initial_count = len(tracking)
        print(f"📊 Всего в tracking: {initial_count} квартир")

    except Exception as e:
        print(f"⚠️  ОШИБКА при миграции: {e}")
    
    print()
    
    # Инициализируем Chrome с расширением (важно на Linux)
    init_chrome_with_extension()
    
    # Запускаем HTTP сервер в отдельном потоке для получения логирований от расширения
    print("🚀 Запускаю HTTP сервер для логирования (localhost:5555)...")
    
    # ВАЖНО: Слушаем на 0.0.0.0 чтобы Chrome браузер мог подключиться на Linux!
    # Если используем 127.0.0.1, Chrome браузер может не достичь локальный сервер на Linux
    server = HTTPServer(('0.0.0.0', 5555), ContactLogHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    
    print("✅ HTTP сервер запущен на 0.0.0.0:5555 (доступен для всех источников)")
    print(f"📍 Расширение подключается к: {SERVER_URL}")
    print(f"💡 Если используется Linux: расширение использует IP адрес вместо localhost\n")
    
    time.sleep(1)
    
    # Запускаем обработчик очереди квартир в отдельном потоке
    print("🚀 Запускаю обработчик очереди квартир...")
    processor_thread = threading.Thread(target=apartment_processor_worker, daemon=True)
    processor_thread.start()
    
    time.sleep(0.5)
    
    # Запускаем Telegram polling для обработки команд пользователей
    if TELEGRAM_ENABLED:
        print("🤖 Запускаю Telegram polling для обработки команд...")
        telegram_bridge.start_polling_thread()
        time.sleep(0.5)
        
        # Запускаем периодическую отправку статистики каждые 10 минут
        print("⏲️  Запускаю таймер отправки статистики каждые 10 минут...")
        telegram_bridge.start_periodic_stats_timer(interval_seconds=600)  # 600 сек = 10 минут
        time.sleep(0.5)
    
    # ⚠️  ОТКЛЮЧЕНО: Используем external cron + restart_chrome_clean.py вместо встроенного scheduler
    # schedule_chrome_restart()
    
    # Запускаем основной цикл мониторинга
    monitoring_loop()

if __name__ == "__main__":
    main()
