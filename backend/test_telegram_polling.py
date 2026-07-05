#!/usr/bin/env python3
"""
Тестирует Telegram polling и обработку команд
"""

import telegram_bridge
import time
import sys

if __name__ == "__main__":
    print("🤖 Запускаю Telegram polling тест...")
    print("📝 Напишите /start в Telegram боте (https://t.me/BesichtNowBot)")
    print("⏳ Слушаю обновления в течение 60 сек...\n")
    
    # Запускаем polling в основном потоке (с логами)
    offset = 0
    count = 0
    start_time = time.time()
    
    while time.time() - start_time < 60:
        try:
            import httpx
            
            url = f"{telegram_bridge.API_BASE}/getUpdates"
            params = {
                "offset": offset,
                "timeout": 5,
                "allowed_updates": ["message"]
            }
            
            print(f"[{time.time() - start_time:.0f}s] 📡 Проверяю обновления (offset={offset})...")
            
            with httpx.Client(timeout=10) as client:
                response = client.post(url, json=params)
                
                if response.status_code != 200:
                    print(f"   ❌ API ошибка: {response.status_code}")
                    continue
                
                data = response.json()
                
                if not data.get("ok"):
                    print(f"   ❌ {data.get('description')}")
                    continue
                
                updates = data.get("result", [])
                
                if not updates:
                    print(f"   (нет обновлений)")
                else:
                    print(f"   ✅ Получено {len(updates)} обновлений!")
                    
                    for update in updates:
                        count += 1
                        print(f"\n   📨 Update #{count}:")
                        print(f"      ID: {update.get('update_id')}")
                        
                        if "message" in update:
                            msg = update["message"]
                            print(f"      From: {msg.get('from', {}).get('first_name')} (ID: {msg.get('from', {}).get('id')})")
                            print(f"      Text: {msg.get('text')}")
                            print(f"      Chat: {msg.get('chat', {}).get('id')}")
                            
                            # Обрабатываем команду
                            telegram_bridge.handle_command(update)
                        
                        offset = update["update_id"] + 1
            
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Ошибка: {e}")
            time.sleep(1)
    
    print(f"\n✅ Тест завершен. Получено {count} обновлений.")
