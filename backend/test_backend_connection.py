#!/usr/bin/env python3
"""Тестирует соединение с рабочей backend PostgreSQL-конфигурацией."""

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

        for table in ("contacts", "apartments", "apartment_timeline", "listings_cache"):
            print(f"\nПроверяю таблицу {table}...")
            cursor.execute(f"SELECT COUNT(*) FROM public.{table}")
            print(f"   ✅ Таблица {table} существует, записей: {cursor.fetchone()[0]}")

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!")

    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        print(f"Тип ошибки: {type(e).__name__}")


if __name__ == "__main__":
    main()
