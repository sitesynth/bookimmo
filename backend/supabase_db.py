#!/usr/bin/env python3
"""
Database integration for apartment monitoring.
Uses psycopg2 for direct PostgreSQL access.
"""

import json
from datetime import datetime
from typing import Optional, List, Dict

import config

def _get_conn():
    """Creates a new database connection using config credentials."""
    import psycopg2
    return psycopg2.connect(**config.get_db_connection_params())

# ============================================================================
# КОНТАКТЫ
# ============================================================================

def save_contact(expose_id: str, timestamp: str, email: str, phone: str,
                 first_name: str = "", last_name: str = "", url: str = "") -> bool:
    """Сохраняет отправленный контакт в Supabase"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO public.contacts
            (expose_id, timestamp, first_name, last_name, email, phone, url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'sent')
            ON CONFLICT (expose_id) DO UPDATE
            SET timestamp = EXCLUDED.timestamp, status = 'sent'
        """, (expose_id, timestamp, first_name, last_name, email, phone, url))

        conn.commit()
        cursor.close()
        conn.close()

        print(f"  Контакт {expose_id} сохранен: {first_name} {last_name} ({email})")
        return True

    except Exception as e:
        print(f"  Ошибка при сохранении контакта {expose_id}: {e}")
        return False

def is_contact_sent(expose_id: str) -> bool:
    """Проверяет был ли контакт отправлен"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM public.contacts WHERE expose_id = %s", (expose_id,))
        count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return count > 0
    except Exception as e:
        print(f"  Ошибка проверки контакта: {e}")
        return False

def get_all_contacts() -> List[Dict]:
    """Получает все отправленные контакты"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, expose_id, timestamp, first_name, last_name, email, phone, url, status
            FROM public.contacts
            ORDER BY timestamp DESC
        """)

        contacts = []
        for row in cursor.fetchall():
            contacts.append({
                'id': str(row[0]),
                'expose_id': row[1],
                'timestamp': row[2].isoformat() if row[2] else None,
                'first_name': row[3],
                'last_name': row[4],
                'email': row[5],
                'phone': row[6],
                'url': row[7],
                'status': row[8]
            })

        cursor.close()
        conn.close()

        return contacts
    except Exception as e:
        print(f"  Ошибка получения контактов: {e}")
        return []

def mark_as_sent(expose_id: str) -> bool:
    """Отмечает контакт как отправленный в таблице contacts."""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE public.contacts
            SET status = 'sent'
            WHERE expose_id = %s AND status != 'sent'
        """, (expose_id,))

        conn.commit()
        cursor.close()
        conn.close()

        print(f"  Контакт {expose_id} отмечен как отправленный")
        return True

    except Exception as e:
        print(f"  Ошибка отметки контакта как отправленного: {e}")
        return False

# ============================================================================
# КВАРТИРЫ
# ============================================================================

def save_apartment(apartment_id: str, title: str, address: str = "",
                   price: str = "", rooms: Optional[float] = None,
                   district: str = "", marketing_type: str = "",
                   url: str = "", lat: Optional[float] = None,
                   lon: Optional[float] = None,
                   postcode: str = "") -> bool:
    """Сохраняет информацию о квартире"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO public.apartments
            (id, title, address, price, rooms, district, marketing_type, url, lat, lon, postcode, found_timestamp, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE
            SET title = EXCLUDED.title,
                address = EXCLUDED.address,
                price = EXCLUDED.price,
                rooms = EXCLUDED.rooms,
                district = EXCLUDED.district,
                marketing_type = EXCLUDED.marketing_type,
                url = EXCLUDED.url,
                lat = EXCLUDED.lat,
                lon = EXCLUDED.lon,
                postcode = EXCLUDED.postcode,
                found_timestamp = EXCLUDED.found_timestamp,
                updated_at = NOW()
        """, (
            apartment_id,
            title,
            address,
            price,
            rooms,
            district,
            marketing_type,
            url,
            lat,
            lon,
            postcode,
            datetime.utcnow().isoformat() + "Z",
        ))

        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"  Ошибка при сохранении квартиры: {e}")
        return False

# ============================================================================
# TIMELINE СОБЫТИЯ (НАЙДЕНА -> ОБРАБОТАНА -> ОТВЕТ)
# ============================================================================

def log_apartment_event(expose_id: int, event_type: str, data: Dict = None, timestamp: str = None) -> bool:
    """Логирует событие квартиры в временную шкалу"""
    try:
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat() + "Z"

        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO public.apartment_timeline
            (expose_id, event_type, timestamp, data)
            VALUES (%s, %s, %s, %s)
        """, (expose_id, event_type, timestamp, json.dumps(data) if data else None))

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка логирования события {event_type} для {expose_id}: {e}")
        return False

def get_apartment_timeline(expose_id: str) -> List[Dict]:
    """Получает полную временную шкалу для одной квартиры"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, expose_id, event_type, timestamp, data, created_at
            FROM public.apartment_timeline
            WHERE expose_id = %s
            ORDER BY timestamp ASC
        """, (expose_id,))

        timeline = []
        for row in cursor.fetchall():
            timeline.append({
                "id": row[0],
                "expose_id": row[1],
                "event_type": row[2],
                "timestamp": row[3].isoformat() if row[3] else None,
                "data": row[4] if row[4] else {},
                "created_at": row[5].isoformat() if row[5] else None
            })

        cursor.close()
        conn.close()

        return timeline

    except Exception as e:
        print(f"  Ошибка при получении timeline для {expose_id}: {e}")
        return []

def get_recent_timelines(limit: int = 10) -> Dict[int, List[Dict]]:
    """Получает временные шкалы для недавних контактов"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT expose_id FROM public.apartment_timeline
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))

        expose_ids = [row[0] for row in cursor.fetchall()]

        result = {}
        for eid in expose_ids:
            cursor.execute("""
                SELECT id, expose_id, event_type, timestamp, data, created_at
                FROM public.apartment_timeline
                WHERE expose_id = %s
                ORDER BY timestamp ASC
            """, (eid,))

            timeline = []
            for row in cursor.fetchall():
                timeline.append({
                    "event_type": row[2],
                    "timestamp": row[3].isoformat() if row[3] else None,
                    "data": json.loads(row[4]) if row[4] else None
                })

            result[eid] = timeline

        cursor.close()
        conn.close()

        return result

    except Exception as e:
        print(f"  Ошибка получения недавних timeline: {e}")
        return {}

def log_apartment_found(expose_id: str, title: str, district: str, price, rooms, url: str = "") -> bool:
    """Логирует момент когда квартира НАЙДЕНА в поиске"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        data = {
            "title": title,
            "district": district,
            "price": price,
            "rooms": rooms,
            "url": url
        }

        cursor.execute("""
            INSERT INTO public.apartment_timeline
            (expose_id, event_type, timestamp, data)
            VALUES (%s, %s, %s, %s)
        """, (expose_id, 'found', datetime.utcnow(), json.dumps(data)))

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка при логировании найденной квартиры {expose_id}: {e}")
        return False

def log_apartment_contact_sent(expose_id: str, timestamp: str, first_name: str, last_name: str,
                               email: str, phone: str, url: str = "") -> bool:
    """Логирует момент когда контакт ОТПРАВЛЕН"""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        data = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "url": url
        }

        cursor.execute("""
            INSERT INTO public.apartment_timeline
            (expose_id, event_type, timestamp, data)
            VALUES (%s, %s, %s, %s)
        """, (expose_id, 'contact_sent', timestamp, json.dumps(data)))

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка при логировании отправленного контакта {expose_id}: {e}")
        return False

def log_apartment_reply_received(expose_id: str, sender_name: str, reply_text: str,
                                 reply_timestamp: str = None) -> bool:
    """Логирует момент когда пришел ОТВЕТ"""
    try:
        if reply_timestamp is None:
            reply_timestamp = datetime.utcnow().isoformat() + "Z"

        conn = _get_conn()
        cursor = conn.cursor()

        data = {
            "sender_name": sender_name,
            "reply_text": reply_text[:500]
        }

        cursor.execute("""
            INSERT INTO public.apartment_timeline
            (expose_id, event_type, timestamp, data)
            VALUES (%s, %s, %s, %s)
        """, (expose_id, 'reply_received', reply_timestamp, json.dumps(data)))

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка при логировании ответа для {expose_id}: {e}")
        return False

def log_apartment_reply(expose_id: int, sender_name: str, reply_text: str, reply_timestamp: str = None) -> bool:
    """Логирует ответ владельца в messenger"""
    try:
        if reply_timestamp is None:
            reply_timestamp = datetime.utcnow().isoformat() + "Z"

        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO public.apartment_replies
            (expose_id, sender_name, reply_text, reply_timestamp)
            VALUES (%s, %s, %s, %s)
        """, (expose_id, sender_name, reply_text, reply_timestamp))

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка логирования ответа для {expose_id}: {e}")
        return False

# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("Тестирую Supabase подключение...")

    print("\nСохраняю тестовый контакт...")
    save_contact(
        "165067062",
        datetime.utcnow().isoformat() + "Z",
        "test@example.com",
        "+49 171 169 1182",
        "Sergey",
        "Zakharov",
        "https://www.immobilienscout24.de/expose/165067062"
    )

    print("\nСуpabase интеграция работает!")
