#!/usr/bin/env python3
"""
Анализ конверсии: отправленные контакты → ответы от арендодателей/риелторов.
"""

import imaplib
import email
import re
import sys
from email.header import decode_header

sys.path.insert(0, '/home/ubuntu/BesichtNow')
import config
from gmail_checker import decode_subject


def connect_gmail():
    imap = imaplib.IMAP4_SSL('imap.gmail.com', 993)
    imap.login(config.GMAIL_EMAIL, config.GMAIL_APP_PASSWORD)
    return imap


def get_text_body(msg):
    """Извлекает текстовое тело"""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct == "text/plain" and "attachment" not in str(part.get("Content-Disposition", "")):
                try:
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except:
                    pass
            elif ct == "text/html" and "attachment" not in str(part.get("Content-Disposition", "")):
                try:
                    html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    return re.sub(r'<[^>]+>', '', html)
                except:
                    pass
    else:
        try:
            return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            pass
    return ""


def main():
    imap = connect_gmail()
    imap.select('"[Gmail]/All Mail"')

    # ============================================================
    # Шаг 1: Подтверждения отправки
    # ============================================================
    print("📧 Загружаю подтверждения отправки...")
    status, msgs = imap.search(None, '(BODY "Kontaktaufnahme wurde erfolgreich verschickt")')
    confirm_uids = msgs[0].split() if msgs[0] else []
    print(f"   Найдено: {len(confirm_uids)}")

    sent_contacts = {}  # expose_id -> {name, date, address}

    # Пакетная загрузка
    if confirm_uids:
        uid_str = b','.join(confirm_uids)
        status, data = imap.fetch(uid_str, '(RFC822)')

        for i in range(0, len(data)):
            if not isinstance(data[i], tuple):
                continue
            msg = email.message_from_bytes(data[i][1])
            body = get_text_body(msg)
            date_str = msg.get('Date', '')

            # Scout-ID
            sid = re.search(r'Scout-ID\s*:?\s*(\d{9})', body)
            expose_id = sid.group(1) if sid else None
            if not expose_id:
                continue

            # Имя: Vorname + Nachname
            vn = re.search(r'Vorname\s+([\w\-äöüÄÖÜß]+)', body)
            nn = re.search(r'Nachname\s+([\w\-äöüÄÖÜß\s]+?)(?:\n|Telefon)', body)
            firma = re.search(r'Firma\s+(.+?)(?:\n|$)', body)

            name = '???'
            if vn and nn:
                v = vn.group(1).strip()
                n = nn.group(1).strip()
                if n.lower() not in ('privatangebot', ''):
                    name = f"{v} {n}"
                elif firma:
                    name = firma.group(1).strip()
            elif nn:
                n = nn.group(1).strip()
                if n.lower() not in ('privatangebot', '') and len(n) > 2:
                    name = n
            elif firma:
                name = firma.group(1).strip()

            # Адрес
            addr = re.search(r'Adresse:\s*(.+?)(?:\n|$)', body)
            address = addr.group(1).strip() if addr else ''

            if expose_id not in sent_contacts:
                sent_contacts[expose_id] = {
                    'name': name,
                    'date': date_str,
                    'address': address
                }

    print(f"✅ Контактов отправлено: {len(sent_contacts)}")

    # ============================================================
    # Шаг 2: Ответы через IS24 мессенджер (только заголовки)
    # ============================================================
    print("\n📨 Загружаю ответы...")
    status, msgs = imap.search(None, '(FROM "@nachrichten.immobilienscout24.de")')
    reply_uids = msgs[0].split() if msgs[0] else []
    print(f"   Найдено: {len(reply_uids)}")

    replies = {}  # expose_id -> {sender_name, date, subject}
    reply_by_name = {}  # sender_name -> [expose_ids]

    if reply_uids:
        uid_str = b','.join(reply_uids)
        status, data = imap.fetch(uid_str, '(BODY[HEADER.FIELDS (FROM SUBJECT DATE)])')

        for i in range(0, len(data)):
            if not isinstance(data[i], tuple):
                continue
            header = email.message_from_bytes(data[i][1])

            sender = header.get('From', '')
            subject = decode_subject(header.get('Subject', ''))
            date_str = header.get('Date', '')

            # Имя отправителя
            nm = re.match(r'^"?([^"<]+)"?\s*<', sender)
            sender_name = nm.group(1).strip() if nm else sender

            # expose_id из темы
            em = re.search(r'Objekt\s+(\d{9})', subject)
            expose_id = em.group(1) if em else None

            if expose_id:
                replies[expose_id] = {
                    'sender_name': sender_name,
                    'date': date_str,
                    'subject': subject[:70]
                }
            if sender_name not in reply_by_name:
                reply_by_name[sender_name] = []
            reply_by_name[sender_name].append({
                'expose_id': expose_id,
                'subject': subject[:70]
            })

    print(f"✅ Ответов: {len(reply_uids)} от {len(reply_by_name)} человек")

    # ============================================================
    # Шаг 3: Сопоставление
    # ============================================================
    print("\n" + "=" * 80)
    print(f"{'Expose ID':<14} {'Anbieter':<35} {'Адрес':<30} {'Ответ'}")
    print("=" * 80)

    matched = 0
    unmatched = 0
    matched_expose_ids = set()

    for expose_id, info in sorted(sent_contacts.items(), key=lambda x: x[1]['date']):
        name = info['name']
        address = info['address'][:28] if info['address'] else ''

        # Сопоставляем по expose_id
        if expose_id in replies:
            matched += 1
            matched_expose_ids.add(expose_id)
            r = replies[expose_id]
            print(f"{expose_id:<14} {name:<35} {address:<30} ✅ {r['sender_name']}")
        else:
            # Пробуем по имени
            found = False
            for reply_name, reply_list in reply_by_name.items():
                if name != '???' and name.lower() in reply_name.lower():
                    found = True
                    matched += 1
                    print(f"{expose_id:<14} {name:<35} {address:<30} ✅ {reply_name}")
                    break
            if not found:
                unmatched += 1
                print(f"{expose_id:<14} {name:<35} {address:<30} ❌")

    # ============================================================
    # Итоги
    # ============================================================
    total = len(sent_contacts)
    print("\n" + "=" * 80)
    print("📈 ИТОГО")
    print("=" * 80)
    print(f"   Контактов отправлено:  {total}")
    print(f"   Получено ответов:      {matched}")
    print(f"   Без ответа:            {unmatched}")
    if total > 0:
        print(f"   Конверсия:             {matched / total * 100:.1f}%")

    imap.close()
    imap.logout()


if __name__ == '__main__':
    main()
