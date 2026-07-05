/**
 * Background Service Worker для ImmoScout24 Contact Logger
 * Слушает события логирования контактов
 */

console.log("🔄 ImmoScout Contact Logger Background Worker started");

// Хранилище для логирования
let contactLog = [];

// Загружаем контакт-данные из локального сервера
function loadContactData() {
  const url = "http://localhost:5555/api/contact-data";

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд

    fetch(url, { signal: controller.signal })
      .then(r => {
        clearTimeout(timeoutId);

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        console.log(`✅ Response received (${r.status}), size: ${r.headers.get('content-length')} bytes`);
        return r.json();
      })
      .then(data => {
        if (!data || !data.contact) {
          console.log("⚠️  Пустой response:", data);
          resolve(null);
          return;
        }

        const { firstName, lastName, email, phone, message } = data.contact;
        if (!(firstName && email)) {
          console.log("⚠️  Неполные данные контакта:", data.contact);
          resolve(null);
          return;
        }

        const contactData = {
          firstName,
          lastName,
          email,
          phone,
          message: message || ""
        };

        console.log("✅ Данные контакта загружены успешно (message: " + contactData.message.substring(0, 30) + "...)");
        chrome.storage.local.set({contact_data: contactData}, () => {
          console.log("✅ Данные сохранены в chrome.storage.local");
        });
        resolve(contactData);
      })
      .catch(err => {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          console.log("❌ Timeout при загрузке данных (10 сек)");
        } else {
          console.log("❌ Ошибка загрузки: " + err.message);
        }
        reject(err);
      });
  });
}

// Загружаем при старте и каждые 5 минут
loadContactData();
setInterval(loadContactData, 5 * 60 * 1000);

// Слушаем сообщения от content скрипта
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getContactData") {
    // Для заполнения формы всегда идем за свежими данными на backend.
    loadContactData()
      .then((contactData) => {
        sendResponse({
          contact: contactData || null
        });
      })
      .catch((err) => {
        console.log("❌ Ошибка прямой загрузки contact_data: " + err.message);
        sendResponse({
          contact: null
        });
      });
    return true; // Асинхронный ответ
  }
  else if (request.type === "log_entry") {
    // Логи от content.js
    const logEntry = request.payload;
    console.log(`📍 [${logEntry.type.toUpperCase()}] ${logEntry.message}`);
    contactLog.push(logEntry);
    sendResponse({status: "logged"});
  } 
  else if (request.type === "contact_logged") {
    // Контакт успешно отправлен
    console.log("📝 Контакт залогирован от:", sender.url);
    
    contactLog.push({
      ...request.payload,
      sender_url: sender.url,
      sender_tab_id: sender.tab.id,
      type: "contact_success"
    });
    
    // Обновляем badge с количеством отправленных
    chrome.action.setBadgeText({text: String(contactLog.length)});
    chrome.action.setBadgeBackgroundColor({color: "#4CAF50"});
    
    // Сохраняем в storage
    chrome.storage.local.set({
      contact_log: contactLog
    });
    
    sendResponse({status: "logged"});
  }
});

// Слушаем установку расширения
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("🎉 Расширение установлено!");
    
    // Открываем страницу с инструкциями
    chrome.tabs.create({
      url: "data:text/html,<h1>ImmoScout24 Contact Logger установлен!</h1><p>Откройте любое объявление и отправьте контакт. Данные будут логированы локально.</p>"
    });
  }
});

// Периодически проверяем что сервер доступен
setInterval(() => {
  fetch("http://localhost:5555/health", {mode: "no-cors"})
    .then(() => {
      chrome.action.setTitle({title: "✅ ImmoScout Logger (сервер доступен)"});
    })
    .catch(() => {
      chrome.action.setTitle({title: "⚠️ ImmoScout Logger (сервер недоступен)"});
    });
}, 10000);

console.log("✅ Background Worker готов!");
