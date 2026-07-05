import imaplib
import email
import re
import json
from datetime import datetime
from email.header import decode_header
from typing import List, Set, Dict
import os

# Загрузка переменных окружения
from dotenv import load_dotenv
load_dotenv()

class Config:
    def __init__(self):
        self.GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
        self.GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

config = Config()

# Теперь, после загрузки .env, можно прочитать переменные
config.GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
config.GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")





GMAIL_IMAP_SERVER = "imap.gmail.com"
GMAIL_IMAP_PORT = 993

# --- Вспомогательные функции (аналогичные gmail_checker.py, но адаптированные) ---
def get_email_body(message) -> str:
    """Извлекает текстовое тело письма"""
    body = ""
    if message.is_multipart():
        for part in message.walk():
            ctype = part.get_content_type()
            cdisposition = str(part.get("Content-Disposition"))

            # Ищем текстовые части
            if ctype == "text/plain" and "attachment" not in cdisposition:
                try:
                    body = part.get_payload(decode=True).decode()
                    break
                except:
                    pass
            elif ctype == "text/html" and "attachment" not in cdisposition:
                try:
                    body = part.get_payload(decode=True).decode()
                except:
                    pass
    else:
        try:
            body = message.get_payload(decode=True).decode()
        except:
            pass
    return body

def decode_subject(subject_encoded):
    """Декодирует тему письма"""
    decoded_words = decode_header(subject_encoded)
    decoded_subject = []
    for s, encoding in decoded_words:
        if isinstance(s, bytes):
            decoded_subject.append(s.decode(encoding or 'utf-8', errors='ignore'))
        else:
            decoded_subject.append(s)
    return "".join(decoded_subject)

# --- Основная логика анализа ответов ---
def analyze_realtor_responses():
    """Подключается к Gmail, ищет ответы риэлторов и анализирует их."""
    print("\n======================================================================")
    print("📧 АНАЛИЗ ОТВЕТОВ РИЭЛТОРОВ И ХОЗЯЕВ КВАРТИР")
    print("======================================================================")

    if not config.GMAIL_EMAIL or not config.GMAIL_APP_PASSWORD:
        print("❌ GMAIL_EMAIL или GMAIL_APP_PASSWORD не установлены в .env")
        return

    try:
        print(f"📧 Подключаюсь к Gmail ({config.GMAIL_EMAIL})...")
        imap = imaplib.IMAP4_SSL(GMAIL_IMAP_SERVER, GMAIL_IMAP_PORT)
        imap.login(config.GMAIL_EMAIL, config.GMAIL_APP_PASSWORD)
        print("✅ Подключение успешно")

        imap.select("INBOX") # Можно попробовать и другие папки, например "[Gmail]/All Mail"

        # Ищем письма, которые подтверждают успешную отправку контакта
        search_criteria_sent_confirmations = (
            'UNSEEN',
            'FROM', '"ImmoScout24"',
            'SUBJECT', '"Ihre Kontaktaufnahme wurde erfolgreich verschickt."'
        )
        
        # Затем ищем письма, которые являются ответами от риелторов/хозяев
        search_criteria_realtor_responses = (
            'UNSEEN',
            'OR',
            'SUBJECT "Re: Ihre Anfrage"',
            'SUBJECT "Anfrage zu"',
            'SUBJECT "Besichtigungstermin"',
            'SUBJECT "Ihr Interesse"',
            'FROM "@nachrichten.immobilienscout24.de"',
            'FROM "immobilienscout24.de"'
        )

        sent_confirmations = []
        realtor_responses = []
        all_msg_ids = set()

        # Поиск подтверждений отправки
        status, msg_ids_raw = imap.search(None, *search_criteria_sent_confirmations)
        if msg_ids_raw[0]:
            for block in msg_ids_raw[0].split():
                all_msg_ids.add(block)
        
        # Поиск ответов от риелторов
        status, msg_ids_raw = imap.search(None, *search_criteria_realtor_responses)
        if msg_ids_raw[0]:
            for block in msg_ids_raw[0].split():
                all_msg_ids.add(block)


        for block in all_msg_ids:
            status, data = imap.fetch(block, 
            msg = email.message_from_bytes(data[0][1])
            
            subject = decode_subject(msg.get("Subject", ""))
            sender = msg.get("From", "")
            body = get_email_body(msg)

            email_data = {
                "id": block.decode(),
                "sender": sender,
                "subject": subject,
                "body": body,
                "timestamp": msg.get("Date")
            }

            # Классификация
            if "Ihre Kontaktaufnahme wurde erfolgreich verschickt." in subject:
                sent_confirmations.append(email_data)
            else:
                realtor_responses.append(email_data)

            # Помечаем письмо как прочитанное, чтобы не обрабатывать повторно
            imap.store(block, 

        print(f"\n📬 Найдено {len(sent_confirmations)} подтверждений отправки.")
        for conf in sent_confirmations:
            print(f"   - От: {conf["sender"]}, Тема: {conf["subject"][:50]}...")
            # Здесь можно извлечь имя риелтора из тела письма
            match = re.search(r"Kontaktdaten des Anbieters\s*(.*?)\n", conf["body"], re.DOTALL)
            if match:
                realtor_name = match.group(1).split("\n")[0].strip()
                print(f"     -> Имя риелтора: {realtor_name}")

        print(f"\n📬 Найдено {len(realtor_responses)} потенциальных ответов от риэлторов/хозяев.")
        for resp in realtor_responses:
            print(f"   - От: {resp["sender"]}, Тема: {resp["subject"][:50]}...")

        imap.logout()

    except imaplib.IMAP4.error as e:
        print(f"❌ Ошибка IMAP: {e}")
    except Exception as e:
        print(f"❌ Произошла ошибка: {e}")

if __name__ == "__main__":
    analyze_realtor_responses()
