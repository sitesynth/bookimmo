#!/usr/bin/env python3
"""Тестирует соединение с рабочей PostgreSQL-конфигурацией backend."""

import psycopg2

import config


def main():
    db_config = config.get_db_connection_params()

    print("🔍 Тестирую соединение с backend PostgreSQL...")
    print("=" * 60)
    print(f"Host: {db_config['host']}")
    print(f"Port: {db_config['port']}")
    print(f"Database: {db_config['database']}")
    print(f"User: {db_config['user']}")
    print("=" * 60)

    try:
        print("\n1️⃣  Проверяю соединение...")
        conn = psycopg2.connect(**db_config)
        print("   ✅ Соединение установлено!")

        cursor = conn.cursor()

        print("\n2️⃣  Проверяю таблицу contacts...")
        cursor.execute("SELECT COUNT(*) FROM public.contacts")
        print(f"   ✅ Таблица contacts существует, записей: {cursor.fetchone()[0]}")

        print("\n3️⃣  Проверяю таблицу apartment_timeline...")
        cursor.execute("SELECT COUNT(*) FROM public.apartment_timeline")
        print(f"   ✅ Таблица apartment_timeline существует, записей: {cursor.fetchone()[0]}")

        print("\n4️⃣  Проверяю последнюю запись в contacts...")
        cursor.execute("""
            SELECT expose_id, timestamp, status
            FROM public.contacts
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        last_contact = cursor.fetchone()
        if last_contact:
            print("   ✅ Последняя запись:")
            print(f"      ID: {last_contact[0]}")
            print(f"      Timestamp: {last_contact[1]}")
            print(f"      Status: {last_contact[2]}")
        else:
            print("   ℹ️  Таблица contacts пуста")

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!")

    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        print(f"Тип ошибки: {type(e).__name__}")


if __name__ == "__main__":
    main()
