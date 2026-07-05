#!/usr/bin/env python3
"""
Тестирует сохранение контакта в лог файл
"""

import json
from datetime import datetime

LOG_FILE = "contact_submissions.jsonl"

# Тестовые данные
data = {
    "expose_id": "166440062",
    "timestamp": "2026-03-21T14:46:19.766532Z",
    "contact_info": {
        "firstName": "Valeria",
        "lastName": "Jorimann",
        "email": "v.jorimann10@gmail.com",
        "phone": "+49 171 169 1182"
    },
    "url": "https://www.immobilienscout24.de/expose/166440062"
}

print(f"🔍 Тестирую запись в файл: {LOG_FILE}")
print(f"📂 Текущая директория: {__file__}")

try:
    # Пробуем записать
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False) + '\n')
    print(f"✅ Успешно записано!")
    
    # Проверяем, что файл создан
    import os
    if os.path.exists(LOG_FILE):
        size = os.path.getsize(LOG_FILE)
        print(f"✅ Файл существует, размер: {size} байт")
    else:
        print(f"❌ Файл НЕ существует!")
        
except Exception as e:
    print(f"❌ Ошибка при записи: {e}")
    print(f"Тип ошибки: {type(e).__name__}")