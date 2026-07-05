#!/usr/bin/env python3
"""
Проверяет Gmail рассылку IS24 и извлекает ссылки на квартиры.
Работает параллельно с основным мониторингом через API.
"""

import imaplib
import email
import re
import time
from email.header import decode_header
from typing import List, Set
from pathlib import Path
import json

import config

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

GMAIL_IMAP_SERVER = "imap.gmail.com"
GMAIL_IMAP_PORT = 993
GMAIL_CACHE_FILE = ".gmail_seen_ids.json"  # Кэш просмотренных письм

# ============================================================================
# ЗАГРУЗКА КЭША
# ============================================================================

def load_seen_email_ids() -> Set[str]:
    """Загружает список уже обработанных письм"""
    if Path(GMAIL_CACHE_FILE).exists():
        try:
            with open(GMAIL_CACHE_FILE, 'r') as f:
                data = json.load(f)
                return set(data.get("seen_ids", []))
        except (json.JSONDecodeError, IOError):
            return set()
    return set()

def save_seen_email_ids(seen_ids: Set[str]):
    """Сохраняет список обработанных писем"""
    with open(GMAIL_CACHE_FILE, 'w') as f:
        json.dump({"seen_ids": list(seen_ids)}, f, indent=2)

# ============================================================================
# ПАРСИНГ ПИСЕМ
# ============================================================================

def extract_expose_ids(email_body: str) -> List[str]:
    """Извлекает все expose IDs из тела письма (разные форматы URL)"""
    # Пробуем несколько паттернов для разных форматов ссылок
    patterns = [
        r'https://www\.immobilienscout24\.de/expose/(\d+)',     # Основной формат IS24
        r'https://immobilienscout24\.de/expose/(\d+)',          # Без www
        r'https://push\.search\.is24\.de/email/expose/(\d+)',   # Ссылка из писем IS24
        r'expose/(\d+)',                                         # Короткая форма
        r'/expose/(\d+)',                                        # С слешем в начале
        r'expose=(\d+)',                                         # URL параметр
        r'(?:expose|object|apartment)[\?/=\-](\d{9})',          # Параметр с 9 цифрами
    ]

    found_ids = set()
    for pattern in patterns:
        matches = re.findall(pattern, email_body, re.IGNORECASE)
        found_ids.update(matches)

    # Фильтруем только валидные expose IDs (9 цифр)
    valid_ids = [id for id in found_ids if len(id) == 9 and id.isdigit()]
    return list(set(valid_ids))  # Удаляем дубликаты


def extract_address_from_email(email_subject: str, email_body: str) -> str:
    """Извлекает адрес квартиры из письма IS24.

    Формат в теле письма от IS24:
      Adresse: Mexikoring 13, Winterhude, Hamburg
      Adresse: Barmbeker Straße 91, 22305 Hamburg
    """
    # 1. Ищем поле "Adresse:" в теле письма — самый надёжный источник
    adresse_match = re.search(r'Adresse:\s*(.+?)(?:\n|$)', email_body)
    if adresse_match:
        address = adresse_match.group(1).strip()
        if len(address) > 5:
            return address

    return ""  # Адрес не найден

def get_email_body(message) -> str:
    """Извлекает текстовое тело письма"""
    body = ""

    if message.is_multipart():
        for part in message.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))

            # Берём текстовую часть (не attachments)
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except Exception as e:
                    print(f"  Ошибка при декодировании части письма: {e}")
            elif content_type == "text/html" and "attachment" not in content_disposition:
                try:
                    html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    # Простой HTML stripping
                    body += re.sub(r'<[^>]+>', '', html_body)
                except Exception as e:
                    print(f"  Ошибка при декодировании HTML: {e}")
    else:
        try:
            body = message.get_payload(decode=True).decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"  Ошибка при декодировании письма: {e}")

    return body

def decode_subject(subject: str) -> str:
    """Декодирует subject письма (может быть в разных кодировках)"""
    decoded_parts = []
    for part, encoding in decode_header(subject):
        if isinstance(part, bytes):
            encoding = encoding or 'utf-8'
            try:
                decoded_parts.append(part.decode(encoding))
            except (UnicodeDecodeError, LookupError):
                decoded_parts.append(part.decode('utf-8', errors='ignore'))
        else:
            decoded_parts.append(part)
    return ''.join(decoded_parts)

# ============================================================================
# ПРОВЕРКА GMAIL
# ============================================================================

def check_gmail() -> List[dict]:
    """
    Проверяет Gmail на новые письма от IS24.
    Возвращает список новых квартир: [{"expose_id": "123456789", "address": "улица 91"}, ...]
    """
    if not config.GMAIL_EMAIL or not config.GMAIL_APP_PASSWORD:
        print("⚠️  Gmail не настроен (GMAIL_EMAIL или GMAIL_APP_PASSWORD не установлены)")
        return []

    new_apartments = []  # Список словарей вместо просто ID
    seen_ids = load_seen_email_ids()

    try:
        print("📧 Подключаюсь к Gmail...")
        imap = imaplib.IMAP4_SSL(GMAIL_IMAP_SERVER, GMAIL_IMAP_PORT)
        imap.login(config.GMAIL_EMAIL, config.GMAIL_APP_PASSWORD)
        print("✅ Подключение успешно")

        # Пробуем разные папки (INBOX может быть пустой из-за фильтров Gmail)
        folders_to_try = ['INBOX', '"[Gmail]/All Mail"', '"[Gmail]/Important"']
        email_ids = []

        for folder in folders_to_try:
            try:
                imap.select(folder)

                # Пробуем несколько паттернов поиска для IS24 писем
                search_patterns = [
                    ('FROM', 'immobilienscout24.de'),  # Любой адрес от IS24
                    ('FROM', 'is24.de'),               # Любой адрес от IS24
                    ('SUBJECT', 'expose'),             # Письма про квартиры (на англ)
                    ('SUBJECT', 'immobilien'),         # Письма на немецком
                ]

                for search_type, search_term in search_patterns:
                    try:
                        status, messages = imap.search(None, search_type, search_term)
                        found_ids = messages[0].split()
                        email_ids.extend(found_ids)
                    except Exception as e:
                        print(f"  ℹ️  Поиск {search_type}='{search_term}' не дал результатов: {e}")

                # Удаляем дубликаты и останавливаемся, если что-то нашли
                email_ids = list(set(email_ids))
                if email_ids:
                    print(f"✅ Найдено {len(email_ids)} писем в папке {folder}")
                    break
                else:
                    print(f"ℹ️  Папка {folder}: IS24 письма не найдены")
            except Exception as e:
                print(f"⚠️  Ошибка с папкой {folder}: {e}")
                continue

        if not email_ids:
            print("ℹ️  Писем от IS24 не найдено ни в одной папке")
            imap.close()
            imap.logout()
            return []

        print(f"📬 Найдено {len(email_ids)} писем от IS24")

        # Сортируем по UID (числовой порядок) чтобы последние 20 были самые новые
        email_ids.sort(key=lambda x: int(x))

        # Обрабатываем только новые письма (в обратном порядке — новые первыми)
        for email_id in reversed(email_ids[-20:]):  # Смотрим только последние 20
            email_id_str = email_id.decode('utf-8') if isinstance(email_id, bytes) else str(email_id)

            if email_id_str in seen_ids:
                continue  # Уже обработали

            try:
                status, msg_data = imap.fetch(email_id, '(RFC822)')
                raw_email = msg_data[0][1]
                message = email.message_from_bytes(raw_email)

                # Извлекаем данные письма
                subject = decode_subject(message.get("Subject", ""))
                sender = message.get("From", "")
                body = get_email_body(message)

                # Фильтруем: только уведомления Suchauftrag от myscout@
                # Допустимые темы: "1 Angebot:", "2 Angebote:", "3 Angebote:" и т.д.
                # Исключаем: "14-Tage-Überblick", "Coolste Wohnung", "Bewerten Sie",
                # "Erinnerung", "persönliche Vorstellung", рекламу и дайджесты
                is_suchauftrag = bool(re.match(r'^\d+\s+Angebot', subject))
                if not is_suchauftrag:
                    seen_ids.add(email_id_str)  # Помечаем как seen чтобы не проверять снова
                    continue

                # Фильтруем по городу: только Hamburg
                # Проверяем и тему и тело письма
                subject_lower = subject.lower()
                body_lower = body.lower()
                if 'hamburg' not in subject_lower and 'hamburg' not in body_lower:
                    print(f"   ⚠️  Пропускаю письмо (не Hamburg): {subject[:60]}")
                    seen_ids.add(email_id_str)
                    continue

                # Ищем expose IDs и адреса
                expose_ids = extract_expose_ids(body)
                address = extract_address_from_email(subject, body)

                if expose_ids:
                    print(f"\n📨 Новое письмо: {subject[:60]}")
                    print(f"   От: {sender}")
                    print(f"   Найдено expose IDs: {expose_ids}")
                    if address:
                        print(f"   📍 Адрес: {address}")

                    # Добавляем каждый expose_id с адресом
                    for expose_id in expose_ids:
                        new_apartments.append({
                            "expose_id": expose_id,
                            "address": address
                        })

                # Отмечаем письмо как обработанное
                seen_ids.add(email_id_str)

            except Exception as e:
                print(f"  ⚠️  Ошибка обработки письма {email_id_str}: {e}")

        # Сохраняем обновленный кэш
        save_seen_email_ids(seen_ids)

        imap.close()
        imap.logout()

    except imaplib.IMAP4.error as e:
        print(f"❌ Ошибка IMAP: {e}")
        return []
    except Exception as e:
        print(f"❌ Ошибка при проверке Gmail: {e}")
        return []

    # Удаляем дубликаты по expose_id
    seen_expose_ids = set()
    unique_apartments = []
    for apt in new_apartments:
        if apt["expose_id"] not in seen_expose_ids:
            seen_expose_ids.add(apt["expose_id"])
            unique_apartments.append(apt)

    if unique_apartments:
        print(f"\n✅ Всего новых квартир из Gmail: {len(unique_apartments)}")

    return unique_apartments

# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("🤖 Тестирую Gmail checker...\n")

    new_ids = check_gmail()

    if new_ids:
        print(f"\n✅ Найдены новые квартиры:")
        for eid in new_ids:
            print(f"   - {eid}")
    else:
        print(f"\nℹ️  Новых квартир не найдено")
