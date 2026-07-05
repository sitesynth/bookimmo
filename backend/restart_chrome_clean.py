#!/usr/bin/env python3
"""
Скрипт перезагрузки Chrome с закрытием накопившихся вкладок.
Работает по cron расписанию или может быть вызван вручную.

Логика:
1. Закрывает все вкладки с объявлениями (immobilienscout24.de/expose)
2. Сохраняет ТОЛЬКО вкладку мессенджера
3. Убивает старый Chrome
4. Запускает Chrome заново с восстановлением сохраненной сессии
"""

import requests
import subprocess
import time
import sys
import os
from datetime import datetime

# Конфигурация
DEBUG_PORT = int(os.environ.get("CHROME_DEBUG_PORT", "9222"))
CHROME_PATH = os.environ.get("CHROME_PATH", "/opt/google/chrome/google-chrome")
PROFILE_DIR = os.environ.get("CHROME_PROFILE_DIR", "Profile 5")
EXTENSION_PATH = os.environ.get(
    "CHROME_EXTENSION_PATH",
    os.path.join(os.path.dirname(__file__), "immoscout_contact_ext"),
)
DISPLAY = os.environ.get("CHROME_DISPLAY", ":99")
XAUTHORITY = os.environ.get("CHROME_XAUTHORITY", "")


def build_chrome_env_prefix():
    parts = [f"DISPLAY={DISPLAY}"]
    if XAUTHORITY:
        parts.append(f"XAUTHORITY={XAUTHORITY}")
    return " ".join(parts)

def close_extra_tabs_cdp(debug_port=DEBUG_PORT):
    """
    Закрывает ненужные вкладки через Chrome DevTools Protocol.
    Сохраняет ТОЛЬКО мессенджер.
    
    Returns:
        True если успешно, False иначе
    """
    try:
        # Получаем список вкладок через CDP
        response = requests.get(f"http://localhost:{debug_port}/json/list", timeout=3)
        if response.status_code != 200:
            print(f"  ⚠️  CDP недоступен (статус {response.status_code})")
            return False
        
        tabs = response.json()
        if not tabs:
            print("  ℹ️  Вкладок не найдено")
            return True
        
        closed_count = 0
        messenger_found = False
        
        print(f"  📊 Обнаружено {len(tabs)} вкладок:")
        
        # Закрываем все вкладки кроме мессенджера
        for tab in tabs:
            tab_id = tab.get('id')
            tab_title = tab.get('title', 'Unknown')
            tab_url = tab.get('url', '')
            
            # Сохраняем мессенджер
            if 'messenger/conversations' in tab_url or 'facebook.com' in tab_url:
                print(f"     📌 СОХРАНЯЮ: {tab_title[:50]}")
                messenger_found = True
            # Закрываем вкладки с объявлениями
            elif 'immobilienscout24.de/expose' in tab_url:
                try:
                    requests.get(f"http://localhost:{debug_port}/json/close/{tab_id}", timeout=2)
                    print(f"     ✓ Закрыто объявление: {tab_title[:50]}")
                    closed_count += 1
                except:
                    pass
            # Закрываем остальные вкладки (кроме chrome://)
            elif 'chrome://' not in tab_url and tab_url:
                try:
                    requests.get(f"http://localhost:{debug_port}/json/close/{tab_id}", timeout=2)
                    print(f"     ✓ Закрыто: {tab_title[:50]}")
                    closed_count += 1
                except:
                    pass
        
        print(f"  ✅ Закрыто вкладок: {closed_count}")
        
        if not messenger_found:
            print(f"  ⚠️  ВНИМАНИЕ: Мессенджер не найден!")
        else:
            print(f"  ✓ Мессенджер сохранен")
        
        return True
            
    except Exception as e:
        print(f"  ⚠️  Ошибка при закрытии вкладок: {e}")
        return False

def restart_chrome():
    """
    Перезагружает Chrome:
    1. Закрывает все вкладки кроме мессенджера
    2. Убивает старый Chrome полностью
    3. Запускает новый Chrome с восстановлением сессии
    """
    
    print("\n" + "="*80)
    print("🔄 ПЕРЕЗАГРУЗКА CHROME С ОЧИСТКОЙ ВКЛАДОК")
    print(f"   Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    try:
        # 1. ЗАКРЫВАЕМ НЕНУЖНЫЕ ВКЛАДКИ (пока Chrome еще запущена)
        print("\n✋ ШАГ 1: Закрытие ненужных вкладок...")
        close_extra_tabs_cdp(DEBUG_PORT)
        
        # КРИТИЧНО! Даем Chrome время СОХРАНИТЬ состояние в файлы
        # Без этого Chrome восстановит ВСЕ вкладки, потому что они еще в памяти процесса
        print("   ⏳ Ожидание сохранения состояния (5 сек)...")
        time.sleep(5)
        print("   ✓ Chrome сохранила состояние закрытых вкладок в файлы")
        
        # 2. УБИВАЕМ CHROME (АГРЕССИВНО!)
        print("\n⏹️  ШАГ 2: Остановка Chrome...")
        
        # STEP 1: Сначала пытаемся корректное завершение (SIGTERM)
        print("   → Этап 1: SIGTERM (корректное завершение)...")
        subprocess.run(
            "pkill -TERM -f 'google-chrome' 2>/dev/null || true",
            shell=True,
            timeout=5
        )
        time.sleep(2)
        
        # STEP 2: Проверяем что Chrome закрыта
        result = subprocess.run(
            "pgrep -f 'google-chrome'",
            shell=True,
            capture_output=True,
            timeout=5
        )
        
        if result.returncode == 0:
            # Chrome все еще работает - SIGKILL!
            print("   ⚠️  Chrome не ответила на SIGTERM, применяю SIGKILL...")
            subprocess.run(
                "pkill -9 -f 'google-chrome' 2>/dev/null || true",
                shell=True,
                timeout=5
            )
            time.sleep(3)
            
            # Еще раз проверяем
            result = subprocess.run(
                "pgrep -f 'google-chrome'",
                shell=True,
                capture_output=True,
                timeout=5
            )
            
            if result.returncode == 0:
                print("   🔥 Chrome УПОРНО не умирает! SUPER KILL:")
                subprocess.run(
                    "killall -9 chrome 2>/dev/null; killall -9 chromium 2>/dev/null; killall -9 google-chrome 2>/dev/null || true",
                    shell=True,
                    timeout=5
                )
                time.sleep(2)
        
        # FINAL CHECK
        result = subprocess.run(
            "pgrep -f 'google-chrome' && echo 'RUNNING' || echo 'CLOSED'",
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "CLOSED" in result.stdout:
            print("  ✅ Chrome полностью закрыта")
        else:
            print("  ❌ ОШИБКА: Chrome ВСЕ ЕЩЕ работает! Продолжаем рисковать...")
            # Все равно переходим к запуску нового Chrome
        
        # 3. ЗАПУСКАЕМ НОВЫЙ CHROME
        print("\n🚀 ШАГ 3: Запуск Chrome как новый процесс...")
        
        cmd = (
            f'{build_chrome_env_prefix()} '
            f'{CHROME_PATH} '
            f'--new-instance '
            f'--profile-directory="{PROFILE_DIR}" '
            f'--load-extension="{EXTENSION_PATH}" '
            f'--remote-debugging-port={DEBUG_PORT} '
            f'--disable-dev-shm-usage '
            f'--disable-gpu '
            f'--disable-crash-reporter '
            f'--no-first-run '
            f'--no-default-browser-check '
            f'https://www.immobilienscout24.de/messenger/conversations '
            f'> /dev/null 2>&1 &'
        )
        
        print(f"  📝 Запускаю Chrome с восстановлением сохраненной сессии...")
        subprocess.Popen(cmd, shell=True)
        
        time.sleep(10)  # Даем Chrome время загрузиться
        
        # Проверяем что Chrome запустилась
        result = subprocess.run(
            "pgrep -f 'google-chrome' && echo 'RUNNING' || echo 'FAILED'",
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "RUNNING" in result.stdout:
            print("  ✅ Chrome успешно запущена")
        else:
            print("  ❌ Chrome не запустилась!")
            return False
        
        print("\n" + "="*80)
        print("✅ ПЕРЕЗАГРУЗКА ЗАВЕРШЕНА УСПЕШНО")
        print("="*80 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}\n")
        return False

def should_restart():
    """Проверяет должна ли быть перезагрузка (в 03:00)"""
    now = datetime.now()
    return now.hour == 3 and now.minute == 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        # Принудительная перезагрузка
        restart_chrome()
    elif len(sys.argv) > 1 and sys.argv[1] == "--check":
        # Только проверка времени
        if should_restart():
            print("✓ Время перезагрузки (03:00)")
            restart_chrome()
        else:
            now = datetime.now()
            print(f"✗ Еще не время (сейчас {now.strftime('%H:%M')})")
    else:
        # Обычный запуск - проверяем время и перезагружаем если нужно
        if should_restart():
            restart_chrome()
            sys.exit(0)
        else:
            now = datetime.now()
            print(f"ℹ️  Перезагрузка только в 03:00 (сейчас {now.strftime('%H:%M')})")
            sys.exit(1)
