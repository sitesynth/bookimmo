#!/usr/bin/env python3
"""
Database integration for apartment monitoring.
Uses psycopg2 for direct PostgreSQL access.
"""

import json
import hashlib
from datetime import datetime
from typing import Optional, List, Dict

import config

def _get_conn():
    """Creates a new database connection using config credentials."""
    import psycopg2
    return psycopg2.connect(**config.get_db_connection_params())


def _stable_id(prefix: str, *parts) -> str:
    raw = ":".join(str(part or "") for part in parts)
    return f"{prefix}_{hashlib.sha256(raw.encode('utf-8')).hexdigest()[:24]}"


def _trim_preview(value: str, limit: int = 240) -> str:
    text = " ".join(str(value or "").split()).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def _coerce_iso(value: str = None) -> str:
    if not value:
        return datetime.utcnow().isoformat() + "Z"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat().replace("+00:00", "Z")
    except Exception:
        return value


def _find_matching_applications(cursor, expose_id: str, email: str = "") -> List[Dict]:
    cursor.execute("""
        SELECT a.id,
               a.user_id,
               a.property_id,
               a.status,
               a.stage,
               a.provider_source,
               a.provider_expose_id,
               a.provider_conversation_id,
               a.unread_count,
               u.email
        FROM public.applications a
        LEFT JOIN public.app_users u ON u.id = a.user_id
        WHERE COALESCE(a.provider_source, 'is24') = 'is24'
          AND (
            a.provider_expose_id = %s
            OR a.property_id = %s
            OR (%s <> '' AND lower(u.email) = lower(%s))
          )
        ORDER BY a.updated_at DESC
    """, (expose_id, expose_id, email or "", email or ""))

    items = []
    for row in cursor.fetchall():
        items.append({
            "id": row[0],
            "user_id": row[1],
            "property_id": row[2],
            "status": row[3],
            "stage": row[4],
            "provider_source": row[5],
            "provider_expose_id": row[6],
            "provider_conversation_id": row[7],
            "unread_count": row[8] or 0,
            "user_email": row[9],
        })
    return items


def _get_apartment_summary(cursor, expose_id: str) -> Dict:
    cursor.execute("""
        SELECT id, title, address, url
        FROM public.apartments
        WHERE id = %s
        LIMIT 1
    """, (expose_id,))
    row = cursor.fetchone()
    if not row:
        return {}
    return {
        "id": row[0],
        "title": row[1],
        "address": row[2],
        "url": row[3],
    }


def _upsert_provider_thread(cursor, application_id: str, provider_expose_id: str,
                            provider_conversation_id: str = None,
                            provider_listing_address: str = None,
                            counterparty_name: str = None,
                            counterparty_role: str = None,
                            account_label: str = None,
                            last_message_at: str = None,
                            last_message_preview: str = None,
                            raw_payload: Dict = None) -> None:
    raw_payload = raw_payload or {}
    thread_id = _stable_id("appthread", application_id, "is24")
    cursor.execute("""
        INSERT INTO public.application_provider_threads (
            id, application_id, provider_source, provider_conversation_id,
            provider_expose_id, provider_listing_address, counterparty_name,
            counterparty_role, account_label, last_message_at,
            last_message_preview, raw_payload, linked_at, last_synced_at,
            created_at, updated_at
        )
        VALUES (%s, %s, 'is24', %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW(), NOW(), NOW())
        ON CONFLICT (application_id, provider_source) DO UPDATE SET
            provider_conversation_id = COALESCE(EXCLUDED.provider_conversation_id, public.application_provider_threads.provider_conversation_id),
            provider_expose_id = COALESCE(EXCLUDED.provider_expose_id, public.application_provider_threads.provider_expose_id),
            provider_listing_address = COALESCE(EXCLUDED.provider_listing_address, public.application_provider_threads.provider_listing_address),
            counterparty_name = COALESCE(EXCLUDED.counterparty_name, public.application_provider_threads.counterparty_name),
            counterparty_role = COALESCE(EXCLUDED.counterparty_role, public.application_provider_threads.counterparty_role),
            account_label = COALESCE(EXCLUDED.account_label, public.application_provider_threads.account_label),
            last_message_at = COALESCE(EXCLUDED.last_message_at, public.application_provider_threads.last_message_at),
            last_message_preview = COALESCE(EXCLUDED.last_message_preview, public.application_provider_threads.last_message_preview),
            raw_payload = CASE
                WHEN EXCLUDED.raw_payload = '{}'::jsonb THEN public.application_provider_threads.raw_payload
                ELSE EXCLUDED.raw_payload
            END,
            last_synced_at = NOW(),
            updated_at = NOW()
    """, (
        thread_id,
        application_id,
        provider_conversation_id,
        provider_expose_id,
        provider_listing_address,
        counterparty_name,
        counterparty_role,
        account_label,
        last_message_at,
        last_message_preview,
        json.dumps(raw_payload),
    ))


def _sync_contact_sent_to_applications(cursor, expose_id: str, timestamp: str, first_name: str,
                                       last_name: str, email: str, phone: str, url: str = "") -> int:
    applications = _find_matching_applications(cursor, expose_id, email)
    apartment = _get_apartment_summary(cursor, expose_id)
    affected = 0

    for application in applications:
        source_key = f"contact_sent:{expose_id}:{timestamp}:{email}"
        event_id = _stable_id("appevt", application["id"], source_key)
        cursor.execute("""
            INSERT INTO public.application_events (
                id, application_id, event_type, event_source, actor_role,
                title, body, payload, occurred_at, created_at
            )
            VALUES (%s, %s, 'contact_sent', 'is24_agent_flow', 'bookimmo_agent',
                    %s, %s, %s::jsonb, %s, NOW())
            ON CONFLICT (id) DO NOTHING
        """, (
            event_id,
            application["id"],
            "Application sent to provider",
            f"Initial contact was sent for expose {expose_id}.",
            json.dumps({
                "exposeId": expose_id,
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": phone,
                "url": url,
            }),
            _coerce_iso(timestamp),
        ))

        cursor.execute("""
            UPDATE public.applications
            SET provider_source = 'is24',
                provider_expose_id = COALESCE(provider_expose_id, %s),
                stage = CASE
                    WHEN stage = 'draft' OR stage IS NULL THEN 'waiting_for_reply'
                    ELSE stage
                END,
                stage_updated_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
        """, (expose_id, application["id"]))

        _upsert_provider_thread(
            cursor,
            application["id"],
            provider_expose_id=expose_id,
            provider_listing_address=apartment.get("address"),
            account_label=f"{first_name} {last_name}".strip() or email or None,
            raw_payload={
                "url": url,
                "phone": phone,
                "listingTitle": apartment.get("title"),
                "listingUrl": apartment.get("url"),
            },
        )
        affected += 1

    return affected


def _sync_reply_to_applications(cursor, expose_id: str, sender_name: str, reply_text: str,
                                reply_timestamp: str = None,
                                provider_conversation_id: str = None,
                                provider_listing_address: str = None) -> int:
    applications = _find_matching_applications(cursor, expose_id)
    apartment = _get_apartment_summary(cursor, expose_id)
    affected = 0
    message_timestamp = _coerce_iso(reply_timestamp)
    preview = _trim_preview(reply_text)

    for application in applications:
        event_id = _stable_id("appevt", application["id"], "reply_received", expose_id, sender_name, message_timestamp, preview)
        message_id = _stable_id("appmsg", application["id"], "reply", expose_id, sender_name, message_timestamp, preview)

        cursor.execute("""
            INSERT INTO public.application_events (
                id, application_id, event_type, event_source, actor_role,
                title, body, payload, occurred_at, created_at
            )
            VALUES (%s, %s, 'reply_received', 'is24_agent_flow', 'listing_agent',
                    %s, %s, %s::jsonb, %s, NOW())
            ON CONFLICT (id) DO NOTHING
        """, (
            event_id,
            application["id"],
            "Provider reply received",
            preview or None,
            json.dumps({
                "exposeId": expose_id,
                "senderName": sender_name,
                "providerConversationId": provider_conversation_id,
            }),
            message_timestamp,
        ))

        cursor.execute("""
            INSERT INTO public.application_messages (
                id, application_id, provider_source, external_thread_id,
                external_message_id, direction, sender_role, sender_name,
                body_text, attachments, message_timestamp,
                is_unread_for_client, raw_payload, created_at
            )
            VALUES (%s, %s, 'is24', %s, %s, 'inbound', 'listing_agent', %s,
                    %s, '[]'::jsonb, %s, TRUE, %s::jsonb, NOW())
            ON CONFLICT (id) DO NOTHING
        """, (
            message_id,
            application["id"],
            provider_conversation_id,
            f"is24-reply-{expose_id}-{message_timestamp}",
            sender_name,
            reply_text,
            message_timestamp,
            json.dumps({
                "exposeId": expose_id,
                "senderName": sender_name,
                "providerConversationId": provider_conversation_id,
            }),
        ))

        cursor.execute("""
            UPDATE public.applications
            SET provider_source = 'is24',
                provider_expose_id = COALESCE(provider_expose_id, %s),
                provider_conversation_id = COALESCE(provider_conversation_id, %s),
                stage = 'reply_received',
                stage_updated_at = NOW(),
                last_message_at = %s,
                last_message_preview = %s,
                unread_count = COALESCE(unread_count, 0) + 1,
                conversation_state = 'active',
                updated_at = NOW()
            WHERE id = %s
        """, (
            expose_id,
            provider_conversation_id,
            message_timestamp,
            preview,
            application["id"],
        ))

        _upsert_provider_thread(
            cursor,
            application["id"],
            provider_expose_id=expose_id,
            provider_conversation_id=provider_conversation_id,
            provider_listing_address=provider_listing_address or apartment.get("address"),
            counterparty_name=sender_name,
            counterparty_role="listing_agent",
            account_label=application.get("user_email"),
            last_message_at=message_timestamp,
            last_message_preview=preview,
            raw_payload={
                "listingTitle": apartment.get("title"),
                "listingUrl": apartment.get("url"),
                "providerConversationId": provider_conversation_id,
            },
        )
        affected += 1

    return affected

# ============================================================================
# КОНТАКТЫ
# ============================================================================

def save_contact(expose_id: str, timestamp: str, email: str, phone: str,
                 first_name: str = "", last_name: str = "", url: str = "") -> bool:
    """Сохраняет отправленный контакт в backend database."""
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

        try:
            _sync_contact_sent_to_applications(cursor, expose_id, timestamp, first_name, last_name, email, phone, url)
        except Exception as sync_error:
            print(f"  ⚠️  Не удалось синхронизировать contact_sent в applications для {expose_id}: {sync_error}")

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

        try:
            _sync_reply_to_applications(cursor, expose_id, sender_name, reply_text, reply_timestamp)
        except Exception as sync_error:
            print(f"  ⚠️  Не удалось синхронизировать reply_received в applications для {expose_id}: {sync_error}")

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

        try:
            _sync_reply_to_applications(cursor, str(expose_id), sender_name, reply_text, reply_timestamp)
        except Exception as sync_error:
            print(f"  ⚠️  Не удалось синхронизировать reply в applications для {expose_id}: {sync_error}")

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"  Ошибка логирования ответа для {expose_id}: {e}")
        return False


def link_application_provider_thread(application_id: str, provider_source: str,
                                     provider_conversation_id: str = None,
                                     provider_expose_id: str = None,
                                     provider_listing_address: str = None,
                                     counterparty_name: str = None,
                                     counterparty_role: str = None,
                                     account_label: str = None,
                                     last_message_at: str = None,
                                     last_message_preview: str = None,
                                     raw_payload: Dict = None) -> bool:
    """Привязывает provider thread к application напрямую из backend worker."""
    try:
        conn = _get_conn()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM public.applications
            WHERE id = %s
            LIMIT 1
        """, (application_id,))
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return False

        cursor.execute("""
            UPDATE public.applications
            SET provider_source = COALESCE(%s, provider_source),
                provider_expose_id = COALESCE(%s, provider_expose_id),
                provider_conversation_id = COALESCE(%s, provider_conversation_id),
                last_message_at = COALESCE(%s, last_message_at),
                last_message_preview = COALESCE(%s, last_message_preview),
                conversation_state = CASE
                    WHEN COALESCE(%s, provider_conversation_id) IS NOT NULL THEN 'linked'
                    ELSE conversation_state
                END,
                updated_at = NOW()
            WHERE id = %s
        """, (
            provider_source,
            provider_expose_id,
            provider_conversation_id,
            last_message_at,
            last_message_preview,
            provider_conversation_id,
            application_id,
        ))

        _upsert_provider_thread(
            cursor,
            application_id,
            provider_expose_id=provider_expose_id,
            provider_conversation_id=provider_conversation_id,
            provider_listing_address=provider_listing_address,
            counterparty_name=counterparty_name,
            counterparty_role=counterparty_role,
            account_label=account_label,
            last_message_at=last_message_at,
            last_message_preview=last_message_preview,
            raw_payload=raw_payload or {},
        )

        conn.commit()
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"  Ошибка привязки provider thread для application {application_id}: {e}")
        return False


def link_provider_thread_for_expose(expose_id: str,
                                    provider_conversation_id: str = None,
                                    provider_source: str = "is24",
                                    provider_listing_address: str = None,
                                    counterparty_name: str = None,
                                    counterparty_role: str = None,
                                    account_label: str = None,
                                    last_message_at: str = None,
                                    last_message_preview: str = None,
                                    raw_payload: Dict = None) -> int:
    """Привязывает provider thread ко всем applications, связанным с expose_id."""
    try:
        expose_id = str(expose_id or "").strip()
        if not expose_id:
            return 0

        conn = _get_conn()
        cursor = conn.cursor()

        applications = _find_matching_applications(cursor, expose_id)
        apartment = _get_apartment_summary(cursor, expose_id)
        affected = 0

        for application in applications:
            event_id = _stable_id(
                "appevt",
                application["id"],
                "thread_linked",
                provider_source,
                expose_id,
                provider_conversation_id,
            )

            cursor.execute("""
                INSERT INTO public.application_events (
                    id, application_id, event_type, event_source, actor_role,
                    title, body, payload, occurred_at, created_at
                )
                VALUES (%s, %s, 'thread_linked', 'is24_agent_flow', 'bookimmo_agent',
                        %s, %s, %s::jsonb, %s, NOW())
                ON CONFLICT (id) DO NOTHING
            """, (
                event_id,
                application["id"],
                "Provider thread linked",
                f"Conversation {provider_conversation_id or 'pending'} linked to expose {expose_id}.",
                json.dumps({
                    "providerSource": provider_source,
                    "providerConversationId": provider_conversation_id,
                    "providerExposeId": expose_id,
                    "providerListingAddress": provider_listing_address or apartment.get("address"),
                    "counterpartyName": counterparty_name,
                    "counterpartyRole": counterparty_role,
                    "accountLabel": account_label,
                }),
                _coerce_iso(last_message_at),
            ))

            cursor.execute("""
                UPDATE public.applications
                SET provider_source = COALESCE(%s, provider_source),
                    provider_expose_id = COALESCE(provider_expose_id, %s),
                    provider_conversation_id = COALESCE(%s, provider_conversation_id),
                    last_message_at = COALESCE(%s, last_message_at),
                    last_message_preview = COALESCE(%s, last_message_preview),
                    conversation_state = CASE
                        WHEN COALESCE(%s, provider_conversation_id) IS NOT NULL THEN 'linked'
                        ELSE conversation_state
                    END,
                    updated_at = NOW()
                WHERE id = %s
            """, (
                provider_source,
                expose_id,
                provider_conversation_id,
                last_message_at,
                last_message_preview,
                provider_conversation_id,
                application["id"],
            ))

            _upsert_provider_thread(
                cursor,
                application["id"],
                provider_expose_id=expose_id,
                provider_conversation_id=provider_conversation_id,
                provider_listing_address=provider_listing_address or apartment.get("address"),
                counterparty_name=counterparty_name,
                counterparty_role=counterparty_role,
                account_label=account_label,
                last_message_at=last_message_at,
                last_message_preview=last_message_preview,
                raw_payload=raw_payload or {},
            )
            affected += 1

        conn.commit()
        cursor.close()
        conn.close()
        return affected

    except Exception as e:
        print(f"  Ошибка привязки provider thread по expose {expose_id}: {e}")
        return 0

# ============================================================================
# ТЕСТИРОВАНИЕ
# ============================================================================

if __name__ == "__main__":
    print("Тестирую backend database подключение...")

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

    print("\nBackend database интеграция работает!")
