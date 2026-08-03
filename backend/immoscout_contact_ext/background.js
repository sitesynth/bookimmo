/**
 * Background Service Worker для ImmoScout24 Contact Logger
 * Слушает события логирования контактов
 */

console.log("🔄 ImmoScout Contact Logger Background Worker started");

// Хранилище для логирования
let contactLog = [];
const recentExposeContexts = new Map();
const linkedConversationKeys = new Set();

function nowTs() {
  return Date.now();
}

function extractExposeId(value) {
  const match = String(value || "").match(/\/expose\/(\d+)/);
  return match ? match[1] : null;
}

function extractConversationId(value) {
  const match = String(value || "").match(/\/messenger\/messages\/([0-9a-f-]{8,})/i);
  return match ? match[1] : null;
}

function rememberExposeContext(tabId, payload = {}) {
  const exposeId = payload.exposeId || extractExposeId(payload.url);
  if (!tabId || !exposeId) return null;

  const context = {
    tabId,
    exposeId,
    url: payload.url || "",
    title: payload.title || "",
    address: payload.address || "",
    seenAt: nowTs()
  };

  recentExposeContexts.set(tabId, context);
  return context;
}

function resolveRecentExposeContext(tabId, openerTabId = null) {
  const cutoff = nowTs() - 10 * 60 * 1000;
  const candidates = [];

  if (tabId && recentExposeContexts.has(tabId)) {
    candidates.push(recentExposeContexts.get(tabId));
  }
  if (openerTabId && recentExposeContexts.has(openerTabId)) {
    candidates.push(recentExposeContexts.get(openerTabId));
  }

  for (const item of candidates) {
    if (item && item.seenAt >= cutoff) {
      return item;
    }
  }

  return null;
}

function postJsonWithFallback(path, payload) {
  return fetch(`http://localhost:5555${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {
    return fetch(`http://192.168.0.105:5555${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });
}

function notifyProviderThreadLink(payload) {
  const exposeId = payload.expose_id || payload.provider_expose_id;
  const conversationId = payload.provider_conversation_id || payload.conversation_id || extractConversationId(payload.url);
  if (!exposeId || !conversationId) return;

  const dedupeKey = `${exposeId}:${conversationId}`;
  if (linkedConversationKeys.has(dedupeKey)) return;
  linkedConversationKeys.add(dedupeKey);

  postJsonWithFallback("/provider_thread_link", {
    ...payload,
    expose_id: exposeId,
    provider_expose_id: exposeId,
    provider_conversation_id: conversationId,
    provider_source: payload.provider_source || "is24",
    timestamp: payload.timestamp || new Date().toISOString()
  })
    .then(() => {
      console.log(`🔗 Provider thread linked: expose ${exposeId} -> ${conversationId}`);
    })
    .catch((err) => {
      linkedConversationKeys.delete(dedupeKey);
      console.log(`❌ Ошибка отправки provider thread link: ${err.message}`);
    });
}

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
  else if (request.type === "expose_page_seen") {
    rememberExposeContext(sender?.tab?.id, {
      exposeId: request.exposeId,
      url: request.url || sender?.url || "",
      title: request.title || "",
      address: request.address || ""
    });
    sendResponse({status: "ok"});
  }
  else if (request.type === "messenger_thread_seen") {
    const tabId = sender?.tab?.id;
    const openerTabId = sender?.tab?.openerTabId || null;
    const context = resolveRecentExposeContext(tabId, openerTabId);
    const exposeId = request.exposeId || context?.exposeId || null;
    const address = request.listingAddress || context?.address || "";

    if (exposeId) {
      notifyProviderThreadLink({
        expose_id: exposeId,
        provider_conversation_id: request.conversationId,
        provider_listing_address: address,
        counterparty_name: request.counterpartyName || null,
        counterparty_role: request.counterpartyRole || null,
        account_label: request.accountLabel || null,
        last_message_preview: request.lastMessagePreview || null,
        last_message_at: request.lastMessageAt || null,
        url: request.url || sender?.url || "",
        raw_context: {
          tabId,
          openerTabId,
          context
        }
      });
    }

    sendResponse({
      status: "ok",
      exposeId: exposeId || null
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const nextUrl = changeInfo.url || tab?.url || "";
  if (!nextUrl) return;

  const exposeId = extractExposeId(nextUrl);
  if (exposeId) {
    rememberExposeContext(tabId, {
      exposeId,
      url: nextUrl,
      title: tab?.title || ""
    });
    return;
  }

  const conversationId = extractConversationId(nextUrl);
  if (!conversationId) return;

  const context = resolveRecentExposeContext(tabId, tab?.openerTabId || null);
  if (!context?.exposeId) return;

  notifyProviderThreadLink({
    expose_id: context.exposeId,
    provider_conversation_id: conversationId,
    provider_listing_address: context.address || "",
    url: nextUrl,
    raw_context: {
      tabId,
      openerTabId: tab?.openerTabId || null,
      context
    }
  });
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
