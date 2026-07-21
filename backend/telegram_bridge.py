#!/usr/bin/env python3
"""
Telegram Bridge для мониторинга квартир
Отправляет красивые логи в Telegram бот + обработчик команд для всех пользователей
"""

import httpx
import json
import threading
import time
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

import config

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

BOT_TOKEN = "8689646447:AAGjlOhwdPouIjzQHrmo8V2uPmjokbdt2ks"
ADMIN_CHAT_ID = 932333860  # Ваш ID для админ логов
REPORT_MESSAGE_ID_FILE = ".telegram_report_message_id"
SUBSCRIBERS_FILE = ".telegram_subscribers.json"  # Файл со списком подписчиков
HISTORY_FILE = "telegram_history.json"  # История сообщений
LAST_REPORT_TIME = {}  # Отслеживаем когда был последний отчет каждому пользователю

API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"
TIMEOUT = 10

# Для совместимости со старым кодом
CHAT_ID = ADMIN_CHAT_ID

# ============================================================================
# УПРАВЛЕНИЕ ИСТОРИЕЙ
# ============================================================================

def load_history() -> list:
    """Загружает историю сообщений"""
    if Path(HISTORY_FILE).exists():
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Ошибка загрузки истории: {e}")
            return []
    return []

def send_history_to_user(chat_id: int):
    """Отправляет историю пользователю батчами (группирует по датам)"""
    history = load_history()
    if not history:
        print(f"ℹ️  История не найдена")
        return 0
    
    current_date = None
    batch_text = ""
    batch_count = 0
    message_count = 0
    
    for msg in history:
        msg_date = msg.get('date', 'N/A')
        msg_time = msg.get('time', '')
        msg_text = msg.get('text', '')
        
        # Если дата изменилась, отправляем батч
        if current_date and current_date != msg_date:
            if batch_text:
                try:
                    send_message(batch_text, chat_id=chat_id)
                    message_count += 1
                    time.sleep(0.3)  # Небольшая задержка между сообщениями
                except Exception as e:
                    print(f"⚠️  Ошибка отправки батча: {e}")
            batch_text = f"📅 <b>{msg_date}</b>\n\n"
            batch_count = 0
        
        current_date = msg_date
        
        # Добавляем сообщение
        line = f"🕐 {msg_time} {msg_text}\n"
        
        # Если батч станет слишком большим, отправляем его
        if len(batch_text) + len(line) > 3500:
            if batch_text:
                try:
                    send_message(batch_text, chat_id=chat_id)
                    message_count += 1
                    time.sleep(0.3)
                except Exception as e:
                    print(f"⚠️  Ошибка отправки батча: {e}")
            batch_text = f"📅 <b>{msg_date}</b>\n\n"
            batch_count = 0
        
        batch_text += line
        batch_count += 1
    
    # Отправляем последний батч
    if batch_text:
        try:
            send_message(batch_text, chat_id=chat_id)
            message_count += 1
        except Exception as e:
            print(f"⚠️  Ошибка отправки последнего батча: {e}")
    
    print(f"✅ История отправлена: {message_count} сообщений, {len(history)} событий")
    return len(history)

# ============================================================================
# УПРАВЛЕНИЕ ПОДПИСЧИКАМИ
# ============================================================================

def load_subscribers() -> dict:
    """Загружает список активных подписчиков"""
    if Path(SUBSCRIBERS_FILE).exists():
        try:
            with open(SUBSCRIBERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_subscriber(chat_id: int, first_name: str = ""):
    """Добавляет пользователя в список подписчиков"""
    subscribers = load_subscribers()
    subscribers[str(chat_id)] = {
        "first_name": first_name,
        "subscribed_at": datetime.now().isoformat()
    }
    with open(SUBSCRIBERS_FILE, 'w') as f:
        json.dump(subscribers, f, indent=2)
    print(f"✅ Подписчик {chat_id} ({first_name}) добавлен")

def get_all_subscribers() -> list:
    """Возвращает список всех chat_id подписчиков"""
    subscribers = load_subscribers()
    return [int(chat_id) for chat_id in subscribers.keys()]

def broadcast_message(text: str, parse_mode: str = "HTML"):
    """Отправляет сообщение всем подписчикам в отдельных потоках (асинхронно)"""
    subscribers = get_all_subscribers()
    
    if not subscribers:
        print("ℹ️  Нет активных подписчиков для broadcast")
        return
    
    print(f"📢 Отправляю broadcast {len(subscribers)} подписчикам...")
    
    def send_to_subscriber(chat_id):
        """Отправляет сообщение одному подписчику с таймаутом"""
        try:
            # Используем timeout 5 сек вместо 10 (быстрее)
            url = f"{API_BASE}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            with httpx.Client(timeout=5) as client:
                response = client.post(url, json=payload)
                return response.status_code == 200
        except Exception as e:
            print(f"   ⚠️  Ошибка отправки {chat_id}: {e}")
            return False
    
    # Отправляем в потоках (максимум 3 одновременно)
    threads = []
    success_count = [0]  # Используем список для изменения в потоках
    
    for chat_id in subscribers:
        def send_wrapper(cid=chat_id):
            if send_to_subscriber(cid):
                success_count[0] += 1
        
        thread = threading.Thread(target=send_wrapper, daemon=True)
        thread.start()
        threads.append(thread)
        
        # Ограничиваем одновременные потоки
        if len(threads) >= 3:
            for t in threads:
                t.join(timeout=6)
            threads = []
    
    # Ждем последних потоков
    for t in threads:
        t.join(timeout=6)
    
    print(f"✅ Broadcast завершен: {success_count[0]} успешно, {len(subscribers) - success_count[0]} ошибок")

def notify_apartment_found(expose_id: str, title: str, district: str, price, rooms: float, url: str):
    """Отправляет яркое уведомление о найденной квартире всем подписчикам"""
    message = f"""🚨 🚨 🚨 НАЙДЕНА НОВАЯ КВАРТИРА! 🚨 🚨 🚨

{'🔥 ' * 8}

📍 <b>{title}</b>
💰 {price}
🏠 {rooms} комнат
📌 {district}
🆔 ID: {expose_id}

🔗 <a href="{url}"><b>ОТКРЫТЬ ОБЪЯВЛЕНИЕ</b></a>
🖇️ {url}

{'⏰ ' * 8}"""
    
    broadcast_message(message)
    print(f"🚨 Яркое уведомление отправлено всем подписчикам о квартире {expose_id}: {url}")

# ============================================================================
# ПЕРИОДИЧЕСКИЕ ОТЧЕТЫ
# ============================================================================

def format_user_stats(first_name: str) -> str:
    """Форматирует персональное сообщение со статистикой для пользователя с временной шкалой"""
    stats = get_stats_24h()
    
    message = f"""👋 Привет, {first_name}!

📊 СТАТИСТИКА ЗАЯВОК (последние 24 часа)

✅ Отправлено за сутки: {stats['sent_24h']}
💼 Всего в базе: {stats['total_all']}
"""
    
    if stats.get('recent_contacts'):
        message += "\n📝 Последние заявки:\n\n"
        for idx, (expose_id, fname, lname, email, timestamp, url) in enumerate(stats['recent_contacts'], 1):
            timestamp_str = str(timestamp)[:16] if timestamp else "N/A"
            url_clean = url.replace("#/basicContact/email", "#") if url else f"https://www.immobilienscout24.de/expose/{expose_id}#"
            
            message += f"{idx}. <a href=\"{url_clean}\">ID {expose_id}</a>\n"
            message += f"    ⏰ {timestamp_str}\n"
            message += f"    👤 {fname} {lname}\n"
            
            # Добавляем временную шкалу из backend database
            try:
                import storage_db
                timeline = storage_db.get_apartment_timeline(str(expose_id))
                if timeline:
                    for event in timeline:
                        event_type = event.get("event_type", "")
                        evt_time = event.get("timestamp", "")
                        
                        # Парсим timestamp для красивого отображения
                        try:
                            dt = datetime.fromisoformat(evt_time.replace('Z', '+00:00'))
                            time_str = dt.strftime("%H:%M")
                        except:
                            time_str = evt_time[:5]
                        
                        # Показываем события
                        if event_type == "found":
                            message += f"    📍 Найдена: {time_str}\n"
                        elif event_type == "contact_sent":
                            message += f"    ⏱️  Обработана: {time_str}\n"
                        elif event_type == "reply_received":
                            message += f"    💬 Ответ: {time_str}\n"
            except Exception as e:
                pass  # Молча пропускаем ошибки timeline
            
            message += "\n"
    
    return message

def send_stats_to_all_subscribers():
    """Отправляет статистику всем подписчикам (персональную)"""
    try:
        subscribers = load_subscribers()
        
        if not subscribers:
            print("ℹ️  Нет подписчиков для отправки статистики")
            return
        
        print(f"📢 Отправляю статистику {len(subscribers)} подписчикам...")
        
        def send_to_subscriber(chat_id_str, user_data):
            """Отправляет БЕЗ таймаутов (таймауты блокируют polling)"""
            try:
                chat_id = int(chat_id_str)
                first_name = user_data.get('first_name', 'Пользователь')
                
                # Просто отправляем быстрое сообщение
                message = f"""👋 {first_name}

📊 Монитор активен ✅
⏰ {datetime.now().strftime("%H:%M:%S")}"""
                
                send_message(message, chat_id=chat_id)
                print(f"   ✅ Статистика отправлена {first_name}")
                
            except Exception as e:
                print(f"   ⚠️  Ошибка отправки {chat_id_str}: {e}")
        
        # Отправляем в отдельных потоках
        threads = []
        for chat_id_str, user_data in subscribers.items():
            thread = threading.Thread(
                target=send_to_subscriber,
                args=(chat_id_str, user_data),
                daemon=True
            )
            thread.start()
            threads.append(thread)
        
        # Ждем все потоки с временем на завершение
        for t in threads:
            t.join(timeout=5)
            
    except Exception as e:
        print(f"❌ Ошибка отправки статистики: {e}")

def start_periodic_stats_timer(interval_seconds: int = 600):
    """Запускает таймер для отправки статистики каждые N секунд (по умолчанию 10 минут)"""
    def timer_loop():
        print(f"⏲️  Запустил таймер отправки статистики (каждые {interval_seconds} сек = {interval_seconds//60} мин)")
        
        while True:
            try:
                time.sleep(interval_seconds)
                print(f"\n📊 Время отправлять статистику всем подписчикам...")
                send_stats_to_all_subscribers()
            except Exception as e:
                print(f"❌ Ошибка в таймере статистики: {e}")
    
    thread = threading.Thread(target=timer_loop, daemon=True)
    thread.start()
    print("✅ Таймер статистики запущен")

# ============================================================================

def add_subscriber(chat_id: int, first_name: str = ""):
    """Добавляет пользователя в список подписчиков"""
    try:
        subscribers = {}
        if Path(SUBSCRIBERS_FILE).exists():
            with open(SUBSCRIBERS_FILE, 'r', encoding='utf-8') as f:
                subscribers = json.load(f)
        
        subscribers[str(chat_id)] = {
            "first_name": first_name,
            "subscribed_at": datetime.now().isoformat()
        }
        
        with open(SUBSCRIBERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(subscribers, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Подписчик добавлен: {first_name} (ID: {chat_id})")
        return True
    except Exception as e:
        print(f"❌ Ошибка добавления подписчика: {e}")
        return False

def get_subscribers() -> list:
    """Получает список всех подписчиков"""
    try:
        if not Path(SUBSCRIBERS_FILE).exists():
            return []
        
        with open(SUBSCRIBERS_FILE, 'r', encoding='utf-8') as f:
            subscribers = json.load(f)
        
        return [int(chat_id) for chat_id in subscribers.keys()]
    except Exception as e:
        print(f"❌ Ошибка получения подписчиков: {e}")
        return []

def send_to_subscribers(text: str, parse_mode: str = "HTML"):
    """Отправляет сообщение всем подписчикам"""
    subscribers = get_subscribers()
    
    if not subscribers:
        print("ℹ️  Нет подписчиков для отправки")
        return
    
    print(f"📤 Отправляю сообщение {len(subscribers)} подписчикам...")
    
    for chat_id in subscribers:
        try:
            send_message(text, chat_id=chat_id, parse_mode=parse_mode)
        except Exception as e:
            print(f"⚠️  Ошибка при отправке подписчику {chat_id}: {e}")

# ============================================================================
# TELEGRAM ОТПРАВКА
# ============================================================================

def get_stats_24h() -> dict:
    """Получает статистику контактов за последние 24 часа"""
    try:
        import psycopg2

        conn = psycopg2.connect(**config.get_db_connection_params())
        cursor = conn.cursor()
        
        # За последние 24 часа
        yesterday = datetime.now() - timedelta(hours=24)
        
        # Всего отправлено за сутки
        cursor.execute("""
            SELECT COUNT(*) FROM public.contacts 
            WHERE status = 'sent' AND timestamp >= %s
        """, (yesterday,))
        sent_24h = cursor.fetchone()[0]
        
        # Последние контакты за сутки
        cursor.execute("""
            SELECT expose_id, first_name, last_name, email, timestamp, url
            FROM public.contacts 
            WHERE status = 'sent' AND timestamp >= %s
            ORDER BY timestamp DESC
            LIMIT 15
        """, (yesterday,))
        
        recent_contacts = cursor.fetchall()
        
        # Всего в базе
        cursor.execute("SELECT COUNT(*) FROM public.contacts WHERE status = 'sent'")
        total_all = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            "sent_24h": sent_24h,
            "recent_contacts": recent_contacts,
            "total_all": total_all,
            "timestamp": datetime.now()
        }
    except Exception as e:
        print(f"❌ Ошибка получения статистики: {e}")
        return {
            "sent_24h": 0,
            "recent_contacts": [],
            "total_all": 0,
            "timestamp": datetime.now(),
            "error": str(e)
        }

def send_message(text: str, chat_id: int = None, parse_mode: str = "HTML") -> bool:
    """Отправляет сообщение в Telegram"""
    if chat_id is None:
        chat_id = CHAT_ID
    
    try:
        url = f"{API_BASE}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        
        with httpx.Client(timeout=TIMEOUT) as client:
            response = client.post(url, json=payload)
            return response.status_code == 200
    except Exception as e:
        print(f"❌ Ошибка отправки в Telegram: {e}")
        return False

def edit_message(text: str, message_id: int, parse_mode: str = "HTML") -> bool:
    """Редактирует существующее сообщение в Telegram"""
    try:
        url = f"{API_BASE}/editMessageText"
        payload = {
            "chat_id": CHAT_ID,
            "message_id": message_id,
            "text": text,
            "parse_mode": parse_mode
        }
        
        with httpx.Client(timeout=TIMEOUT) as client:
            response = client.post(url, json=payload)
            
            if response.status_code == 200:
                return True
            else:
                # Логируем детали ошибки от Telegram API
                try:
                    error_data = response.json()
                    error_msg = error_data.get("description", f"Статус {response.status_code}")
                except:
                    error_msg = response.text[:200]
                
                print(f"❌ Ошибка редактирования сообщения {message_id}: {error_msg}")
                return False
    except Exception as e:
        print(f"❌ Ошибка при запросе редактирования сообщения: {e}")
        return False

def send_or_edit_message(text: str, message_id_file: str = None, parse_mode: str = "HTML") -> Optional[int]:
    """Отправляет новое сообщение или редактирует существующее"""
    try:
        if message_id_file is None:
            message_id_file = REPORT_MESSAGE_ID_FILE
        
        stored_message_id = None
        if Path(message_id_file).exists():
            try:
                with open(message_id_file, 'r') as f:
                    stored_message_id = int(f.read().strip())
            except:
                pass
        
        if stored_message_id:
            # Попробуем редактировать существующее сообщение
            if edit_message(text, stored_message_id, parse_mode):
                return stored_message_id
            else:
                # Если редактирование не сработало - УДАЛИМ старый message_id
                # и отправим новое сообщение (Telegram может не позволить редактировать старые сообщения)
                print(f"⚠️  Не удалось отредактировать сообщение {stored_message_id}, отправляю новое...")
                print(f"   💡 Возможные причины: сообщение старое, не хватает прав, или Telegram API ограничение")
                try:
                    Path(message_id_file).unlink()  # Удаляем файл с старым message_id
                    print(f"   ✅ Очищен кэш message_id")
                except:
                    pass
                stored_message_id = None
        
        if not stored_message_id:
            # Отправляем новое сообщение
            url = f"{API_BASE}/sendMessage"
            payload = {
                "chat_id": CHAT_ID,
                "text": text,
                "parse_mode": parse_mode
            }
            
            with httpx.Client(timeout=TIMEOUT) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    message_data = response.json()
                    message_id = message_data.get("result", {}).get("message_id")
                    if message_id:
                        # Сохраняем message_id для будущих редактирований
                        with open(message_id_file, 'w') as f:
                            f.write(str(message_id))
                        return message_id
        
        return None
    except Exception as e:
        print(f"❌ Ошибка отправки/редактирования сообщения: {e}")
        return None

def log_cycle_start(cycle_num: int, timestamp: str):
    """Логирует начало цикла мониторинга"""
    text = f"""🔄 <b>ЦИКЛ МОНИТОРИНГА #{cycle_num}</b>
⏰ {timestamp}

📡 Запрашиваю список квартир в Гамбурге...
"""
    broadcast_message(text)

def log_apartments_found(total: int):
    """Логирует количество найденных квартир"""
    text = f"✅ Получено <b>{total}</b> квартир из API"
    broadcast_message(text)

def log_apartment_skipped(title: str, reason: str, rooms: Optional[str] = None, district: Optional[str] = None):
    """Логирует пропущенную квартиру"""
    info = ""
    if rooms:
        info += f" | {rooms} комнат"
    if district:
        info += f" | {district}"
    
    text = f"""⏭️  <b>Пропущена квартира</b>
📝 {title[:60]}...{info}
🔍 Причина: <i>{reason}</i>
"""
    broadcast_message(text)

def log_apartment_added(title: str, rooms: str, district: str, price: str, expose_id: str = None, url: str = None):
    """Логирует добавленную квартиру в очередь"""
    text = f"""✅ <b>Квартира добавлена в очередь</b>
📝 {title[:60]}
🛏️  {rooms} комнат | 📍 {district}
💰 {price}"""
    if expose_id and url:
        text += f"""
🔗 ID: {expose_id}
🔗 <a href="{url}"><b>Объявление</b></a>"""
    text += """
"""
    broadcast_message(text)

def log_apartment_contacted(title: str, expose_id: str):
    """Логирует что контакт отправлен"""
    url = f"https://www.immobilienscout24.de/expose/{expose_id}"
    text = f"""📞 <b>Контакт отправлен!</b>
📝 {title[:60]}
🔗 <a href="{url}">Перейти на объявление</a>
"""
    broadcast_message(text)

def log_apartment_contact_attempted(title: str, attempt: int):
    """Логирует попытку отправки контакта"""
    text = f"""⚙️  <b>Попытка контакта #{attempt}</b>
📝 {title[:60]}
"""
    broadcast_message(text)

def log_apartment_max_attempts(title: str, expose_id: str):
    """Логирует что исчерпаны попытки"""
    text = f"""❌ <b>Исчерпаны попытки контакта</b>
📝 {title[:60]}
🆔 {expose_id}
"""
    broadcast_message(text)

def log_cycle_summary(total_processed: int, total_contacted: int, timestamp: str):
    """Логирует итоги цикла"""
    text = f"""📊 <b>ИТОГИ ЦИКЛА</b>
⏰ {timestamp}
🔄 Обработано: <b>{total_processed}</b> квартир
✅ Отправлено контактов: <b>{total_contacted}</b>
⏳ Жду 90 сек до следующей проверки...
"""
    broadcast_message(text)

def log_error(error_type: str, error_msg: str):
    """Логирует ошибку"""
    text = f"""⚠️  <b>ОШИБКА</b>
🔴 {error_type}
📝 {error_msg[:100]}
"""
    broadcast_message(text)

def log_apartment_form_filled(title: str, expose_id: str):
    """Логирует успешное заполнение формы"""
    url = f"https://www.immobilienscout24.de/expose/{expose_id}"
    text = f"""✏️  <b>Форма заполнена и отправлена</b>
📝 {title[:60]}
🆔 {expose_id}
"""
    broadcast_message(text)

def send_daily_submissions_report():
    """Отправляет/обновляет ежедневный отчет об отправленных заявках"""
    try:
        import psycopg2

        conn = psycopg2.connect(**config.get_db_connection_params())
        cursor = conn.cursor()
        
        # Получаем ОБЩЕЕ количество отправленных контактов
        cursor.execute("SELECT COUNT(*) FROM public.contacts WHERE status = 'sent'")
        total_sent = cursor.fetchone()[0]
        
        # Получаем 20 последних контактов со статусом 'sent'
        cursor.execute("""
            SELECT expose_id, first_name, last_name, email, timestamp, url
            FROM public.contacts 
            WHERE status = 'sent'
            ORDER BY timestamp DESC
            LIMIT 20
        """)
        
        contacts = cursor.fetchall()
        cursor.close()
        conn.close()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        if not contacts:
            text = f"""📋 <b>ОТЧЕТ ОБ ОТПРАВЛЕННЫХ ЗАЯВКАХ</b>
⏰ {today}

ℹ️  Контакты еще не отправлены
💼 Всего в базе: {total_sent} контактов"""
        else:
            text = f"""📋 <b>ОТЧЕТ ОБ ОТПРАВЛЕННЫХ ЗАЯВКАХ</b>
⏰ {today}

✅ Всего отправлено: <b>{total_sent}</b> заявок
📝 Показаны последние <b>{len(contacts)}</b>:

"""
            for idx, (expose_id, first_name, last_name, email, timestamp, url) in enumerate(contacts, 1):
                timestamp_str = str(timestamp)[:16] if timestamp else "N/A"
                url_clean = url.replace("#/basicContact/email", "#") if url else f"https://www.immobilienscout24.de/expose/{expose_id}#"
                
                text += f"{idx}. <a href=\"{url_clean}\">🏠 ID {expose_id}</a>\n"
                text += f"   ⏰ {timestamp_str}\n"
                text += f"   👤 {first_name} {last_name}\n"
                text += f"   📧 {email}\n\n"
        
        # Используем send_or_edit_message для обновления одного сообщения
        send_or_edit_message(text, REPORT_MESSAGE_ID_FILE)
        
    except Exception as e:
        print(f"❌ Ошибка при отправке отчета: {e}")
        # Fallback: отправляем простой текст
        text = f"""📋 <b>ОТЧЕТ ОБ ОТПРАВЛЕННЫХ ЗАЯВКАХ</b>
⏰ {datetime.now().strftime("%Y-%m-%d")}

⚠️  Ошибка при загрузке данных из БД
"""
        send_or_edit_message(text, REPORT_MESSAGE_ID_FILE)

# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

def handle_command(update: dict):
    """Обрабатывает команды от пользователей"""
    try:
        # Извлекаем информацию из update
        message = update.get("message", {})
        text = message.get("text", "").strip()
        chat_id = message.get("chat", {}).get("id")
        user_id = message.get("from", {}).get("id")
        first_name = message.get("from", {}).get("first_name", "User")
        
        print(f"📨 Update получен: text='{text}', chat_id={chat_id}, user_id={user_id}")
        
        if not chat_id:
            print(f"⚠️  chat_id не найден в update")
            return
        
        # Команда /start
        if text == "/start" or text.startswith("/start@"):
            print(f"✅ Команда /start от {user_id} ({first_name})")
            
            # Запускаем отправку истории в отдельном потоке чтобы не блокировать polling
            def send_start_response():
                try:
                    # Отправляем приветствие
                    welcome_msg = f"""👋 <b>Добро пожаловать в BesichtNow Bot</b>

🔍 Этот бот отслеживает новые квартиры в Гамбурге
📬 Вы будете получать уведомления обо всех контактах

📜 <b>Вот история за последние 24 часа:</b>
"""
                    send_message(welcome_msg, chat_id=chat_id)
                    time.sleep(0.5)
                    
                    # Отправляем историю
                    history_count = send_history_to_user(chat_id)
                    
                    # Финальное сообщение
                    final_msg = f"""✅ <b>История загружена!</b>

📊 Показано: <b>{history_count}</b> событий
📬 Теперь вы будете получать новые уведомления
💬 Используйте /stats для статистики"""
                    
                    send_message(final_msg, chat_id=chat_id)
                    print(f"✅ /start ответ отправлен пользователю {user_id} ({first_name}) - {history_count} событий")
                    
                    # Сохраняем пользователя как подписчика
                    save_subscriber(chat_id, first_name)
                    
                except Exception as e:
                    print(f"❌ Ошибка при отправке /start: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Запускаем в потоке, чтобы не блокировать polling
            thread = threading.Thread(target=send_start_response, daemon=True)
            thread.start()
        
        # Команда /stats (краткая версия)
        elif text == "/stats" or text.startswith("/stats@"):
            print(f"✅ Команда /stats от {user_id} ({first_name})")
            stats = get_stats_24h()
            response = f"""📊 <b>СТАТИСТИКА (24 часа)</b>

✅ За сутки: {stats['sent_24h']} заявок
💼 Всего: {stats['total_all']} заявок
⏰ Обновлено: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}"""
            
            send_message(response, chat_id=chat_id)
            print(f"✅ /stats ответ отправлен пользователю {user_id}")
        
        else:
            if text:
                print(f"ℹ️  Получено сообщение (не команда): '{text}'")
        
    except Exception as e:
        print(f"❌ Ошибка обработки команды: {e}")
        import traceback
        traceback.print_exc()

def start_polling():
    """Запускает polling для получения обновлений от Telegram"""
    print("🤖 Запускаю Telegram polling для команд...")
    
    offset = 0
    errors = 0
    
    while True:
        try:
            url = f"{API_BASE}/getUpdates"
            params = {
                "offset": offset,
                "timeout": 30,
                "allowed_updates": ["message"]
            }
            
            with httpx.Client(timeout=40) as client:
                response = client.post(url, json=params)
                
                if response.status_code != 200:
                    print(f"⚠️  Telegram API ошибка: {response.status_code}")
                    errors += 1
                    if errors > 5:
                        print(f"❌ Слишком много ошибок, перезапускаю...")
                        errors = 0
                    time.sleep(5)
                    continue
                
                errors = 0
                data = response.json()
                
                if not data.get("ok"):
                    print(f"⚠️  Ошибка от Telegram: {data.get('description')}")
                    time.sleep(5)
                    continue
                
                updates = data.get("result", [])
                
                if updates:
                    print(f"📨 Получено {len(updates)} обновлений от Telegram")
                
                for update in updates:
                    try:
                        update_id = update.get("update_id")
                        if "message" in update:
                            print(f"   → Processing update {update_id}")
                        handle_command(update)
                        offset = update["update_id"] + 1
                    except Exception as e:
                        print(f"❌ Ошибка обработки update {update.get('update_id')}: {e}")
                        import traceback
                        traceback.print_exc()
                    
        except Exception as e:
            print(f"❌ Ошибка polling: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(5)

def start_polling_thread():
    """Запускает polling в отдельном потоке (фоновый процесс)"""
    thread = threading.Thread(target=start_polling, daemon=True)
    thread.start()
    print("✅ Telegram polling запущен в фоне")
    return thread

if __name__ == "__main__":
    print("🤖 Тестирую Telegram Bridge...")
    
    log_cycle_start(1, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    log_apartments_found(20)
    log_apartment_skipped(
        "Tauschwohnung: Schöne 2-Zimmer",
        "SWAP (обменная квартира)"
    )
    log_apartment_added(
        "Moderne 3-Zimmer-Wohnung in Winterhude",
        "3",
        "Winterhude",
        "1.200€"
    )
    log_apartment_contacted(
        "Moderne 3-Zimmer-Wohnung in Winterhude",
        "165067062"
    )
    log_cycle_summary(5, 1, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    print("✅ Сообщения отправлены в Telegram!")
