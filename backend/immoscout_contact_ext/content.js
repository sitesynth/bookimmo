/**
 * Content Script для ImmoScout24
 * Автоматически заполняет и отправляет контакты агентам
 * БЕЗ детекции как бот - работает как обычное расширение браузера
 * 
 * КЛЮЧЕВОЙ МОМЕНТ: Форма загружается динамически (React модаль)
 * Поэтому сначала клик на кнопку контакта, потом ждем модаль, потом заполняем
 */

console.log("✅ ImmoScout Contact Auto-Fill & Send loaded on " + window.location.href);

function textFromSelectors(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.textContent?.trim();
    if (text) return text;
  }
  return "";
}

function getConversationIdFromUrl() {
  const match = window.location.pathname.match(/\/messenger\/messages\/([0-9a-f-]{8,})/i);
  return match ? match[1] : null;
}

function getExposeIdFromDom() {
  const anchors = Array.from(document.querySelectorAll('a[href*="/expose/"]'));
  for (const anchor of anchors) {
    const match = anchor.href.match(/\/expose\/(\d+)/);
    if (match) return match[1];
  }
  return null;
}

function notifyBackground(payload) {
  try {
    chrome.runtime.sendMessage(payload, () => {
      void chrome.runtime.lastError;
    });
  } catch (e) {
    console.log("⚠️  Не удалось отправить сообщение в background");
  }
}

// 🟢 HEARTBEAT: Отправляю сигнал что расширение живо!
// Это поможет нам узнать загружается ли расширение на Linux
fetch('http://localhost:5555/api/extension-heartbeat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    url: window.location.href,
    status: 'loaded'
  })
}).catch(() => {
  // Пробуем IP адрес вместо localhost (для Linux)
  fetch('http://192.168.0.105:5555/api/extension-heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      status: 'loaded'
    })
  }).catch(e => console.log("⚠️  Heartbeat не отправлен"));
});

// Функция для отправки логов на сервер (простая, без перехватов)
function logToServer(message, type = "info") {
  // Просто пишем в консоль. Без отправки на localhost если сервер не запущен
  const prefix = {
    'info': '📝',
    'error': '❌',
    'warn': '⚠️'
  }[type] || '📝';
  
  console.log(prefix + ' ' + message);
}

// НЕ перехватываем console - получается циклическая ошибка
// Просто используем обычные console.log / console.error / console.warn

// Принудительно ставим salutation=MALE (Herr), если поле появилось
function forceMaleSalutation() {
  const sel = document.querySelector('select[name="salutation"]');
  if (!sel) return;
  if (sel.value !== "MALE") {
    sel.value = "MALE";
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ salutation forced to MALE');
  }
}

let salutationTries = 0;
const salutationTimer = setInterval(() => {
  forceMaleSalutation();
  salutationTries += 1;
  if (salutationTries >= 50) {
    clearInterval(salutationTimer);
  }
}, 200);


// ============================================================================
// ОПРЕДЕЛЕНИЕ URL СЕРВЕРА (для работы на macOS и Linux)
// ============================================================================

// Функция для извлечения expose_id из URL
function getExposeIdFromUrl() {
  const match = window.location.pathname.match(/\/expose\/(\d+)/);
  return match ? match[1] : null;
}

function reportExposePageSeen() {
  const exposeId = getExposeIdFromUrl();
  if (!exposeId) return;

  notifyBackground({
    type: "expose_page_seen",
    exposeId,
    url: window.location.href,
    title: document.title || "",
    address: textFromSelectors([
      '[data-testid="object-address"]',
      '.is24qa-objektadresse',
      'div.address-block'
    ])
  });
}

function reportMessengerThreadSeen() {
  const conversationId = getConversationIdFromUrl();
  if (!conversationId) return false;

  notifyBackground({
    type: "messenger_thread_seen",
    conversationId,
    exposeId: getExposeIdFromDom(),
    listingAddress: textFromSelectors([
      '[data-testid="conversation-address"]',
      '[data-testid="object-address"]',
      '.is24qa-objektadresse',
      'div.address-block'
    ]),
    counterpartyName: textFromSelectors([
      '[data-testid="conversation-counterparty-name"]',
      '[data-testid="contact-name"]',
      'aside h2',
      'main h2'
    ]),
    counterpartyRole: textFromSelectors([
      '[data-testid="conversation-counterparty-role"]',
      '[data-testid="contact-role"]'
    ]),
    lastMessagePreview: textFromSelectors([
      '[data-testid="message-bubble"]:last-child',
      '[data-testid="message-text"]:last-child'
    ]),
    lastMessageAt: new Date().toISOString(),
    url: window.location.href
  });

  return true;
}

// Функция для извлечения адреса из HTML при удаленном объявлении
function getAddressFromDeletedListing() {
  const addressBlock = document.querySelector('div.address-block');
  if (addressBlock) {
    return addressBlock.textContent.trim();
  }
  return null;
}

// Функция для проверки если объявление было удалено
function checkIfListingDeleted() {
  // Проверяем разные варианты текста удаленного объявления
  const deletedPatterns = [
    'Angebot wurde deaktiviert',
    'Angebot nicht gefunden',
    'Angebot wurde gelöscht'
  ];

  const bodyText = document.body.innerText;
  return deletedPatterns.some(pattern => bodyText.includes(pattern));
}

// Отправляет информацию об удаленном объявлении на сервер
function reportDeletedApartment() {
  const exposeId = getExposeIdFromUrl();
  const address = getAddressFromDeletedListing();

  if (!exposeId) {
    console.log('⚠️  Не удалось извлечь expose_id из URL');
    return;
  }

  // Пытаемся отправить на localhost:5555
  const payload = {
    expose_id: exposeId,
    address: address || ''
  };

  fetch('http://localhost:5555/apartment/deleted', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Пытаемся IP адрес вместо localhost (для Linux)
    fetch('http://192.168.0.105:5555/apartment/deleted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => {
      console.log('⚠️  Не удалось отправить информацию об удаленном объявлении');
    });
  });

  console.log(`🗑️  Отправлено уведомление об удаленном объявлении (ID:${exposeId}, адрес: ${address || 'не найден'})`);
}

// Запускаем проверку при загрузке страницы (с небольшой задержкой для полной загрузки DOM)
setTimeout(() => {
  if (checkIfListingDeleted()) {
    reportDeletedApartment();
  }
}, 1000);

if (window.location.pathname.includes('/expose/')) {
  setTimeout(reportExposePageSeen, 1200);
}

if (window.location.pathname.includes('/messenger/messages/')) {
  let messengerAttempts = 0;
  const messengerTimer = setInterval(() => {
    messengerAttempts += 1;
    reportMessengerThreadSeen();
    if (messengerAttempts >= 30) {
      clearInterval(messengerTimer);
    }
  }, 1500);
}
