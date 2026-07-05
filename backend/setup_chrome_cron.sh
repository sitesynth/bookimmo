#!/bin/bash

# Скрипт для установки cron задачи на перезагрузку Chrome в 03:00

echo "🔧 Установка cron задачи для перезагрузки Chrome"
echo ""

# Проверяем что скрипт Python есть
SCRIPT_PATH="${SCRIPT_PATH:-/home/ubuntu/bookimmo-backend/backend/restart_chrome_clean.py}"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Скрипт не найден: $SCRIPT_PATH"
    exit 1
fi

echo "✓ Скрипт найден: $SCRIPT_PATH"
echo ""

# Добавляем cron задачу
CRON_JOB="0 3 * * * /usr/bin/python3 $SCRIPT_PATH >> /tmp/chrome_restart_cron.log 2>&1"

echo "📝 Добавляю cron задачу:"
echo "   $CRON_JOB"
echo ""

# Проверяем текущие cron задачи
echo "📋 Текущие cron задачи:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "   (нет задач)"
echo ""

# Добавляем новую задачу если её еще нет
if crontab -l 2>/dev/null | grep -q "restart_chrome_clean.py"; then
    echo "⚠️  Задача уже существует, пропускаю добавление"
else
    # Добавляем задачу
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron задача добавлена!"
fi

echo ""
echo "📋 Финальный список cron задач:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$"

echo ""
echo "================================"
echo "✅ Установка завершена!"
echo "================================"
echo ""
echo "Логи перезагрузки: /tmp/chrome_restart_cron.log"
echo "Для тестирования (принудительная перезагрузка): python3 $SCRIPT_PATH --force"
echo "Для проверки времени: python3 $SCRIPT_PATH --check"
