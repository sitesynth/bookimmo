/**
 * Popup script для расширения
 */

// Загружаем логи при открытии popup
chrome.storage.local.get(['contact_log'], (result) => {
  const log = result.contact_log || [];
  
  // Обновляем количество контактов
  document.getElementById('contact-count').textContent = log.length;
  
  // Обновляем время последней отправки
  if (log.length > 0) {
    const lastContact = log[log.length - 1];
    const time = new Date(lastContact.timestamp);
    document.getElementById('last-contact').textContent = time.toLocaleTimeString('ru-RU');
  }
});

// Проверяем доступность сервера
fetch("http://localhost:5555/health", {mode: "no-cors"})
  .then(() => {
    document.getElementById('status').className = 'status ready';
    document.getElementById('status-text').textContent = '✅ Сервер доступен';
  })
  .catch(() => {
    document.getElementById('status').className = 'status error';
    document.getElementById('status-text').textContent = '⚠️ Сервер недоступен. Запустите contact_logger_server.py';
  });

// Кнопка просмотра логов
document.getElementById('open-logs').addEventListener('click', () => {
  chrome.storage.local.get(['contact_log'], (result) => {
    const log = result.contact_log || [];
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Логи контактов ImmoScout24</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .log-entry { 
            background: white; 
            padding: 12px; 
            margin: 8px 0; 
            border-left: 3px solid #4CAF50;
            border-radius: 4px;
        }
        .timestamp { color: #666; font-size: 12px; }
        .expose-id { color: #1a73e8; font-weight: bold; }
        .contact { color: #2e7d32; }
        pre { background: #f0f0f0; padding: 8px; overflow-x: auto; font-size: 11px; }
    </style>
</head>
<body>
    <h1>📋 Логи контактов ImmoScout24</h1>
    <p>Всего отправленных контактов: <strong>${log.length}</strong></p>
    <div id="logs"></div>
    
    <script>
        const logs = ${JSON.stringify(log)};
        const container = document.getElementById('logs');
        
        logs.forEach((entry, i) => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            const date = new Date(entry.timestamp).toLocaleString('ru-RU');
            div.innerHTML = \`
                <div><span class="timestamp">#\${i+1} \${date}</span></div>
                <div>📍 ID: <span class="expose-id">\${entry.expose_id}</span></div>
                <div>🔗 URL: <a href="\${entry.url}" target="_blank">\${entry.url}</a></div>
                <div class="contact">👤 Контакт: \${entry.contact_info?.firstName} \${entry.contact_info?.lastName}</div>
                <div>✉️ Email: \${entry.contact_info?.email}</div>
                <pre>\${JSON.stringify(entry, null, 2)}</pre>
            \`;
            container.appendChild(div);
        });
    </script>
</body>
</html>
    `;
    
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({url: url});
  });
});

// Кнопка очистки логов
document.getElementById('clear-logs').addEventListener('click', () => {
  if (confirm('Вы уверены что хотите очистить все логи?')) {
    chrome.storage.local.set({contact_log: []});
    document.getElementById('contact-count').textContent = '0';
    document.getElementById('last-contact').textContent = '-';
  }
});
