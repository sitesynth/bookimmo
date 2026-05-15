# Framer → React Migrator

Полная документация по конвертации Framer-сайта в готовое React-приложение с **универсальным парсингом** вместо hardcoded решений.

---

## Быстрый старт (TL;DR)

```bash
# 1. Извлечь HTML/CSS из Framer сайта
node framer-extract-smart.mjs https://homfort.framer.website

# 2. Сгенерировать полный React проект (все 10 шагов)
node generate-components.mjs

# 3. Запустить dev сервер
cd react-app && npm run dev
```

Готово! ✅ Мигратор автоматически:
- ✅ Генерирует все React компоненты
- ✅ Создаёт App.jsx с многоязычной маршрутизацией
- ✅ Настраивает Vite с прокси для Directus
- ✅ Генерирует Vercel functions для API
- ✅ Извлекает дизайн-токены
- ✅ **Никогда не перезаписывает существующие файлы**

---

## Обзор

Мигратор состоит из двух скриптов, которые запускаются последовательно:

```
1. node framer-extract-smart.mjs   →  извлекает HTML/CSS из Framer
2. node generate-components.mjs    →  генерирует React-компоненты
```

Входные данные — URL Framer-сайта.  
Выходные данные — полный набор `.jsx` компонентов + `framer-styles.css` в `react-app/src/`.

---

## Шаг 1 — `framer-extract-smart.mjs`

### Что делает

Открывает Framer-сайт через headless Chrome (CDP) и извлекает:
- Отрендеренный HTML каждой страницы
- Весь CSS (из JS-бандлов + из Chrome runtime)
- SVG-спрайты (иконки, логотипы)
- Схему CMS-коллекций для Directus

### Запуск

```bash
# Базовый запуск (автоматический Chrome)
node framer-extract-smart.mjs https://homfort.framer.website

# Использовать Chrome с авторизованной сессией (для приватных страниц)
node framer-extract-smart.mjs --real-browser-port=9222

# Только пересобрать CSS, не трогать HTML
node framer-extract-smart.mjs --only-css

# Без запуска Chrome (только из бандлов)
node framer-extract-smart.mjs --skip-chrome
```

### Пошаговая работа

#### Шаг 1 — Парсинг route map из бандла

Скрипт загружает `script_main.mjs` (сначала из локального кэша `_local/static/sites/<id>/`, потом с CDN).

Из бандла парсится карта маршрутов:
```
/            → chunk-abc.mjs   (homepage)
/search      → chunk-def.mjs   (search)
/property/*  → chunk-ghi.mjs   (property details)
```

Также определяется `siteId` — уникальный идентификатор сайта на Framer CDN.

#### Шаг 1.5 — CSS из статических HTML-файлов

Из `index.html` проекта извлекаются три категории CSS:
- **`@font-face`** — декларации шрифтов
- **Breakpoint CSS** — классы `hidden-*` для адаптивности
- **Global SSR CSS** — reset, текстовая система, CSS-токены

#### Шаг 2 — CSS из JS-бандлов

Каждый `.mjs` чанк содержит CSS в виде template literals (backtick-строк).  
Скрипт обходит все бандлы и извлекает:
- Чистые CSS-блоки (`.framer-XXX { ... }`)
- Breakpoint-правила (`@media (max-width: 809px) { .hidden-XXX { display:none } }`)
- Смешанные блоки с `${bodyClassName}` — очищаются через bracket-aware парсер

Особенности:
- Строки с JS-ключевыми словами (`const`, `function`, `return`, ...) отбрасываются
- HTML-теги в backtick-строках отбрасываются
- Дубли удаляются через `Set`

#### Шаг 3 — Chrome page visits

Для каждого маршрута Chrome (headless) открывает страницу в **SSR-режиме** (JS страницы отключён через CDP).

Почему JS отключён:
- Framer клиент-сайд роутер после гидрации заменяет "приватные" страницы на 404
- SSR HTML содержит полный контент для всех страниц
- CDP `Runtime.evaluate` при этом работает — только `<script>` тегов страницы нет

Для каждой страницы:
1. Навигация + ожидание `networkIdle` + 2.5с буфер
2. Скролл до середины страницы (для ленивого контента) + обратно
3. Проверка: есть ли `[data-framer-root]` и хотя бы 1 секция
4. Извлечение HTML секций через `extractPageHTML`
5. Извлечение CSS через `extractPageCSS` (adoptedStyleSheets + regular sheets)

**JS-гидрация (иконки и логотипы)**

После SSR-прохода скрипт проверяет наличие пустых `display:contents` контейнеров — это mount-точки для React-компонентов (иконки Phosphor, логотипы и т.д.).

Если есть пустые mount-точки — делается второй проход **с включённым JS**:
- Ждёт 3 секунды гидрации React
- Проверяет, что страница не стала 404
- Перевыбирает HTML (теперь иконки/логотипы на месте)
- Повторно извлекает CSS (дополнительные runtime-стили)

#### Шаг 4 — Запись `framer-styles.css`

CSS собирается в один файл в строго определённом порядке:
1. `@font-face` из HTML
2. Breakpoint классы из HTML  
3. Global SSR CSS из HTML
4. Уникальные правила из JS-бандлов (после дедупликации)
5. Chrome-захваченный CSS (runtime computed)
6. **Auto-fix**: добавляет `transform: translateX(-50%)` для `left: 50%; position: absolute` правил без transform
7. **Runtime patches**: scroll-appear анимации, ticker/marquee, sidebar fix

#### Шаг 5 — Completeness Report

Выводит таблицу: какие маршруты успешно извлечены, какие недоступны (приватные).

#### Шаг 6 — Directus CMS sync

Анализирует `.mjs`-чанки на предмет Framer CMS схем (паттерн `type:t.String`, `type:t.Image` и т.д.).

Для каждой найденной коллекции:
- Создаёт коллекцию в Directus (если не существует)
- Добавляет недостающие поля (с маппингом типов Framer → Directus)
- Сохраняет `framer-directus-field-map.json` для использования в React

Маппинг типов:
| Framer      | Directus  |
|-------------|-----------|
| String      | string    |
| RichText    | text      |
| Image       | uuid      |
| Number      | float     |
| Boolean     | boolean   |
| Date        | date      |
| Enum        | string    |

### Выходные файлы

| Файл | Описание |
|------|----------|
| `react-app/src/framer-styles.css` | Весь CSS сайта |
| `react-app/src/computed-styles.json` | HTML-секции homepage |
| `react-app/src/computed-styles-{slug}.json` | HTML-секции каждой страницы |
| `react-app/src/framer-directus-field-map.json` | Маппинг полей CMS |

---

## Шаг 2 — `generate-components.mjs`

### Что делает

Полный 10-этапный pipeline:
1. **Шаги 1-4** — Генерация компонентов и страниц (основной функционал)
2. **Шаги 5-10** — Автоматическая генерация инфраструктуры (универсальный scaffolding)

### Запуск

```bash
cd /Users/miguelaprossine/bookimmo
node generate-components.mjs
```

Для переборки только одной страницы:
```bash
node generate-components.mjs --only=search
```

### Пошаговая работа

#### Шаги 1-4: Генерация компонентов

##### 1 — Скачивание видео-ассетов

Сканирует все `computed-styles*.json` в поиске `framerusercontent.com/assets/*.mp4`.  
Каждое видео скачивается в `react-app/public/assets/videos/` через `curl`.  
URL в HTML автоматически заменяются на локальные `/assets/videos/filename.mp4`.

##### 2 — HTML → JSX трансформация (`htmlToJsx`)

Каждый HTML-блок проходит через цепочку трансформаций:

**a) `stripFramerCredits`**
- Удаляет `<div data-framer-name="Template by ...">` — кредиты автора шаблона
- Удаляет `<a href="framer.com/marketplace/...">` — ссылки на маркетплейс

**b) `addTickerAnimation`**  
Framer ticker (бесконечный скролл) в SSR рендерится как `<ul style="flex-direction:column">` без анимации (JS-only в оригинале).  
Мигратор:
- Находит все `<ul>` с `flex-direction:column` (2+ `<li>` внутри)
- Дублирует все `<li>` для бесшовного loop
- Добавляет `data-framer-ticker="vertical"` — CSS-анимация подхватывает его

**c) Замена видео URL** — framerusercontent.com → локальные пути

**d) `transformAttrs` — трансформация атрибутов каждого тега:**

| Исходный HTML | JSX |
|---------------|-----|
| `class="..."` | `className="..."` |
| `for="..."` | `htmlFor="..."` |
| `style="color:red"` | `style={{color: "red"}}` |
| `muted=""` | `muted` (boolean) |
| `loop=""` | `loop` (boolean) |
| `data-framer-*` | удаляется (кроме `appear-id`, `ticker`) |
| `tabindex="-1"` | `tabIndex={-1}` |

Дополнительные правила:
- `opacity < 0.01` → удаляется (invisible Framer init states)
- `transform: translateY(...)` → удаляется (Framer animation initial states)  
- `visibility: hidden` → `visibility: visible`
- `will-change` → удаляется
- SVG data URL → percent-encoded для надёжности в React style prop

**Видео-специфичные правила:**
- `preload="none"` → `preload="auto"` (SSR не добавляет autoplay)
- Добавляется `autoPlay` (Framer добавляет его через JS)
- Добавляется `ref={el => { if (el) { el.muted = true; el.play?.().catch(() => {}) } }}` — обход известного бага React с `muted` пропом

#### 3 — `injectAppearIds`

Вставляет `data-framer-appear-id` на карточки и элементы, у которых его нет.  
Использует паттерн имени: `Variant N`, `Testimonial`, `Metric`, `Perk`, `Feature`, `Step`, `Review`, `Card`, `Item`.  
Это позволяет IntersectionObserver запускать stagger-анимацию появления.

#### 4 — Фильтрация Framer-промо блоков

Любая секция, чей HTML содержит текст `"Get Template"` — пропускается.  
Это убирает виджет "Get Template for $129" (Framer marketplace overlay).

#### 5 — Генерация `SvgSprites.jsx`

SVG-спрайты со всех страниц объединяются в один компонент.  
Используется `_allSvgSprites` из `computed-styles.json` (если extractor уже смержил), иначе собирается вручную из всех per-page JSON.  
Дубликаты по `id` отфильтровываются.

#### 6 — Генерация компонентов секций

Для каждой top-level секции создаётся `{ComponentName}.jsx`:

```jsx
import React from 'react'

export default function Hero() {
  return (
    <>
      {/* полный JSX секции */}
    </>
  )
}
```

Имя компонента = PascalCase от `data-framer-name` секции.  
Имена, начинающиеся с цифры, получают префикс `_`.

##### 7 — Генерация страниц

`HomePage.jsx` — импортирует все секции в порядке y-позиции:

```jsx
export default function HomePage() {
  useFramerAppear()
  return (
    <div className="framer-...">
      <SvgSprites />
      <Hero />
      <PROPERTIESINTHEAREA />
      {/* ... */}
    </div>
  )
}
```

Аналогично для каждой `computed-styles-{slug}.json` → `{Slug}Page.jsx`.

##### 8 — Cleanup orphaned files

После генерации скрипт проверяет все `.jsx` в `components/`.  
Файлы, которых нет в текущем списке сгенерированных — удаляются.  
Исключение: файлы с комментарием `// manual` или `/* manual */`.

---

#### Шаги 5-10: Универсальная инфраструктура (Scaffold Generation)

Эти шаги **полностью автоматические** и не требуют ручного кодирования. Мигратор **никогда не перезаписывает** существующие файлы — использует функцию `scaffold()` которая пропускает файлы, если они уже есть.

##### 5 — Обнаружение языков и страниц

Сканирует проект для определения конфигурации:

**Обнаружение языков:**
- Проверяет `react-app/src/i18n/` на наличие `{lang}.json` файлов
- Если i18n не найден — пытается определить языки из Framer HTML навигации
- Пример: если найдены файлы `de.json`, `en.json`, `fr.json` — то языки = `['de', 'en', 'fr']`

**Обнаружение страниц:**
- Сканирует все файлы `computed-styles-*.json` в `react-app/src/`
- Из имён файлов извлекает slugs страниц
- Разделяет на статические (без `:`) и динамические (с `:` в имени)
- Пример: `computed-styles-Property-Details-:hgGxadhfR.json` → динамическая страница с параметром `slug`

```
Найдено:
  Статические: 12 страниц (HomePage, SearchPage, AccountPage, ...)
  Динамические: 2 страницы (PropertyDetailPage с параметром :slug)
  Языки: [de, en, fr, it, nl]
```

##### 6 — Генерация App.jsx с многоязычной маршрутизацией

Если обнаружены языки и i18n файлы — генерируется `App.jsx` с полной поддержкой React Router:

```jsx
// Автоматически сгенерируется структура для каждого языка
<Route path="/de" element={<LangWrapper lang="de" />}>
  <Route index element={<HomePage />} />
  <Route path="search" element={<SearchPage />} />
  <Route path="Property-Details/:slug" element={<PropertyDetailPage />} />
  {/* ... для каждой найденной страницы */}
</Route>

<Route path="/en" element={<LangWrapper lang="en" />}>
  {/* аналогичная структура для английского */}
</Route>

// Остальные языки: /fr, /it, /nl
```

**LangWrapper компонент:**
- Переключает язык i18next при изменении URL
- Показывает языковой переключатель в углу страницы
- Сохраняет навигационное состояние при смене языка

##### 7 — Генерация основных хуков и утилит

Создаёт набор стандартных React хуков (если не существуют):

| Файл | Описание | Строк |
|------|----------|-------|
| `src/hooks/useFramerAppear.js` | IntersectionObserver для scroll-appear анимаций | 26 |
| `src/hooks/useDirectus.js` | Генерический fetcher для Directus коллекций | 43 |
| `src/hooks/useDirectusSearch.js` | Поиск с фильтрами (category, location, type, bedrooms, price) | 41 |
| `src/components/FramerForm.jsx` | Универсальная форма на Supabase с honeypot защитой | 65 |
| `src/lib/supabase.js` | Supabase клиент с graceful fallback | 20 |
| `src/api/directus.js` | Инициализация Directus SDK | 14 |

##### 8 — Генерация конфигов и точек входа

Создаёт конфигурационные файлы для сборки и запуска приложения:

| Файл | Описание | Строк |
|------|----------|-------|
| `src/main.jsx` | React entry point с BrowserRouter и i18n | 14 |
| `src/index.html` | HTML с языковой детекцией | 12 |
| `src/index.css` | Tailwind + reset CSS | 18 |
| `src/postcss.config.js` | PostCSS конфигурация | 6 |
| `src/tailwind.config.js` | Tailwind конфигурация | 25 |
| `vite.config.js` | Vite с прокси Directus и static файлов Framer | 121 |

**vite.config.js особенности:**
- Настраивает dev сервер на port 5173
- Добавляет middleware для прокси `/api/directus` → Directus API
- Настраивает static file serving из `react-app/public/`
- Поддерживает видео-ассеты (`.mp4`)

##### 9 — Генерация API функций (Vercel serverless)

Создаёт serverless functions для production deployment:

| Файл | Описание | Строк |
|------|----------|-------|
| `api/directus.js` | Прокси для Directus API с CORS | 61 |
| `api/asset.js` | Прокси для статических ассетов | 48 |

**Зачем нужны:**
- **directus.js** — проксирует запросы к Directus API от фронтенда (проходит CORS)
- **asset.js** — кэширует и переправляет статические файлы (видео, изображения)

##### 10 — Генерация конфигов развёртывания и дизайн-токенов

Создаёт конфигурацию для Vercel и извлекает дизайн-токены из CSS:

**vercel.json:**
```json
{
  "rewrites": [
    // Переписывает /api/* → api/* functions
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ],
  "headers": [
    // CORS headers для всех endpoints
    {
      "source": "/api/:path*",
      "headers": [{"key": "Access-Control-Allow-Origin", "value": "*"}]
    }
  ]
}
```

**Извлечение дизайн-токенов** из `framer-styles.css`:
- Ищет все CSS переменные `--token-*`
- Извлекает значения цветов (RGB, HEX)
- Извлекает семейства шрифтов из `font-family`
- Генерирует `src/tokens.js`:

```javascript
export const colors = {
  // --token-primary-blue
  'primary-blue': 'rgb(25, 130, 209)',
  // --token-secondary-gray
  'secondary-gray': 'rgb(155, 160, 170)',
}

export const fonts = [
  'Inter',
  'Playfair Display',
]
```

---

#### Функция `scaffold(filePath, content, label)`

Все 22 файла генерируются через единую функцию, которая **никогда не перезаписывает**:

```javascript
async function scaffold(filePath, content, label) {
  try {
    // Проверяем, существует ли файл
    await fs.access(filePath)
    console.log(`skip ${label} (exists)`)  // ← не перезаписываем
  } catch {
    // Файла нет → создаём директорию и пишем
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`write ${label}`)
  }
}
```

**Преимущества этого подхода:**
- Можно запускать migrator многократно
- Ручные правки остаются нетронутыми
- Обновления структуры не сломают custom код
- "Снимок" состояния при каждом запуске

---



---

## Полный список генерируемых файлов (22 файла)

После запуска `node generate-components.mjs` создаются:

### Компоненты (динамически, зависит от Framer)
| Файл | Что это | Создание |
|------|--------|----------|
| `src/components/SvgSprites.jsx` | Все SVG иконки со всех страниц | ВСЕГДА |
| `src/components/{SectionName}.jsx` | По одному на каждую section Framer | По количеству секций |
| `src/pages/{PageName}Page.jsx` | По одному на каждую страницу Framer | По количеству страниц |

### Хуки и утилиты (всегда создаются, если не существуют)
| Файл | Назначение | Размер |
|------|-----------|--------|
| `src/hooks/useFramerAppear.js` | Scroll-appear анимации (IntersectionObserver) | 26 строк |
| `src/hooks/useDirectus.js` | Fetch любой Directus коллекции | 43 строки |
| `src/hooks/useDirectusSearch.js` | Search + filters для PropertyList | 41 строка |
| `src/components/FramerForm.jsx` | Универсальная форма на Supabase | 65 строк |
| `src/lib/supabase.js` | Supabase клиент инициализация | 20 строк |
| `src/api/directus.js` | Directus SDK wrapper | 14 строк |

### Конфигурация (ВСЕГДА создаются)
| Файл | Назначение | Примечание |
|------|-----------|-----------|
| `src/main.jsx` | React entry point с BrowserRouter | 14 строк |
| `src/index.html` | HTML с language detection | 12 строк |
| `src/index.css` | Tailwind + reset CSS | 18 строк |
| `src/postcss.config.js` | PostCSS конфигурация | 6 строк |
| `src/tailwind.config.js` | Tailwind конфигурация | 25 строк |
| `src/App.jsx` | React Router с многоязычностью | АВТО-генерируется |
| `vite.config.js` | Vite сервер конфигурация | 121 строка |

### i18n (если есть языки)
| Файл | Назначение |
|------|-----------|
| `src/i18n/config.js` | i18next инициализация | АВТО-генерируется |
| `src/i18n/{lang}.json` | Переводы для каждого языка | Пусто, нужно заполнить |

### API Functions (для Vercel)
| Файл | Назначение | Размер |
|------|-----------|--------|
| `api/directus.js` | Serverless прокси для Directus API | 61 строка |
| `api/asset.js` | Serverless прокси для статических файлов | 48 строк |

### Deployment
| Файл | Назначение |
|------|-----------|
| `vercel.json` | Vercel конфигурация (rewrites, headers) | АВТО-генерируется |
| `src/tokens.js` | Design tokens из framer-styles.css | Если CSS существует |

**Итого:** 22 файла базовой инфраструктуры + компоненты и страницы по количеству в Framer.

**Важно:** ✅ Все файлы создаются функцией `scaffold()` которая **НИКОГДА не перезаписывает**. Можно запускать мигратор многократно.

---

## Архитектурные принципы: Универсальный парсинг вместо hardcode

Ключевое требование к мигратору — **работать с ЛЮБЫМ Framer шаблоном без изменения кода**.

### ❌ Что было бы неправильно (hardcode):

```javascript
// ❌ ПЛОХО: Привязка к конкретной странице
if (pageName === 'SearchPage') {
  const filterSection = extractByClassName('framer-1qxa1zo')  // конкретный ID
  const resetButton = extractByName('Reset button')           // конкретное имя
  // ...
}

// ❌ ПЛОХО: Извлечение по известному имени компонента
const categoryFilter = findByName('Property Category')  // зависит от текста
const locationFilter = findByName('Location')          // может измениться
```

### ✅ Что делает наш мигратор (динамический парсинг):

```javascript
// ✅ ХОРОШО: Парсинг структуры HTML
function extractFilters(html) {
  const sidebar = querySelector('[class*="scroll"]')  // найдём скроллируемую панель
  const headings = findAllHeadings(sidebar)           // обнаружим все заголовки фильтров
  
  headings.forEach(heading => {
    const label = heading.textContent  // "Category", "Location", "Price" и т.д.
    const options = extractOptionsBelow(heading)
    filters[label.toLowerCase()] = options
  })
}

// ✅ ХОРОШО: Поиск по структуре и patterns
const resetButton = findElement(
  el => el.className.includes('reset') || el.hasClass('primary-button'),
  { context: sidebar, fallback: el => el.textContent === 'Reset' }
)
```

### Принципы универсальности:

| Принцип | Пример | Зачем |
|---------|--------|-------|
| **Парсинг структуры вместо ID** | Ищем `<ul>` с 2+ `<li>` вместо `#ticker-main` | Работает с любыми ID, названиями классов |
| **Обнаружение по контексту** | Находим кнопку сброса в sidebar | Не зависит от точного текста "Reset" |
| **Динамическое извлечение данных** | Получаем языки из i18n файлов, страницы из JSON имён | Не требует hardcode списков |
| **Pattern matching вместо точных совпадений** | Ищем `data-framer-ticker` по наличию pattern, не по конкретному значению | Работает с вариациями |
| **Анализ computed styles вместо hardcode CSS** | Извлекаем цвета, шрифты из реального CSS | Адаптируется к любому дизайну |
| **Трансформация HTML-to-JSX универсально** | Один алгоритм для всех элементов | Работает с любым Framer компонентом |

### Кейс: Фильтры на странице поиска

**Проблема:** Framer CMS может иметь фильтры в разных местах, с разными названиями, разным количеством опций.

**Универсальное решение:**

1. **Обнаружение sidebar:**
   ```javascript
   const sidebar = html.querySelector('[class*="scroll"]') ||  // может быть scroll-area
                   html.querySelector('[style*="overflow"]') ||  // может быть overflow-y
                   findSmallestContainer()  // fallback: найдём узкий контейнер
   ```

2. **Обнаружение фильтров по заголовкам:**
   ```javascript
   sidebar.querySelectorAll('h2, h3, h4').forEach(heading => {
     const label = heading.textContent.trim()
     if (FILTER_KEYWORDS.some(k => label.includes(k))) {
       // Это фильтр! Извлекаем опции ниже
       const options = extractButtonsBelow(heading)
     }
   })
   ```

3. **Генерация React компонента:**
   ```jsx
   const SearchMain = ({ filters = {} }) => {
     const [state, setState] = useState({})
     
     return (
       <div>
         {Object.entries(filters).map(([name, options]) => (
           <FilterGroup key={name} label={name} options={options}
             onChange={(v) => setState({...state, [name]: v})} />
         ))}
       </div>
     )
   }
   ```

Этот код работает, если у Framer шаблона:
- ✅ 2 фильтра или 10 фильтров
- ✅ Фильтры называются "Category", "Тип", "Цена", "Спальни"
- ✅ Фильтры расположены вверху sidebar или внизу
- ✅ Опции это кнопки, чекбоксы или links

---

## Runtime hooks и CSS

### `useFramerAppear` (`src/hooks/useFramerAppear.js`)

IntersectionObserver для scroll-appear анимаций:
- Наблюдает за всеми `[data-framer-appear-id]` элементами
- При попадании в viewport → добавляет класс `appeared`
- Дочерние `[data-framer-appear-id]` элементы каскадно получают `appeared` с задержкой 80мс

Настройки observer: `threshold: 0.01, rootMargin: '200px 0px 200px 0px'`  
(большой rootMargin — чтобы элементы появлялись до того, как пользователь до них докрутил)

### `framer-styles.css` — runtime patches

**Scroll-appear анимация:**
```css
[data-framer-appear-id] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s, transform 0.6s;
}
[data-framer-appear-id].appeared {
  opacity: 1 !important;
  transform: none !important;
}
```
Важно: `translateY` = 24px (не 150px как в оригинале Framer).  
150px выводит элементы за пределы `rootMargin` и IntersectionObserver их не видит.

**Ticker анимация:**
```css
@keyframes framerTickerScroll {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}
[data-framer-ticker="vertical"] {
  animation: framerTickerScroll 20s linear infinite;
}
```
`-50%` работает потому что элементы удвоены — прокрутив половину, мы снова в начале (seamless loop).

---

## Полный pipeline

```
Framer URL
    │
    ▼
framer-extract-smart.mjs
    ├── script_main.mjs  →  route map
    ├── JS chunks        →  CSS rules
    ├── Chrome (SSR)     →  HTML секций
    ├── Chrome (JS)      →  иконки/логотипы (hydration pass)
    └── Directus         →  CMS schema sync
    │
    ▼
computed-styles.json
computed-styles-{slug}.json
framer-styles.css
    │
    ▼
generate-components.mjs (10 шагов)
    │
    ├─ Шаги 1-4: Генерация компонентов
    │   ├── скачивает видео
    │   ├── stripFramerCredits  →  удаляет "Template by..."
    │   ├── addTickerAnimation  →  дублирует li + data-framer-ticker
    │   ├── htmlToJsx           →  class→className, style→объект, boolean attrs
    │   ├── injectAppearIds     →  data-framer-appear-id на карточки
    │   └── SvgSprites + Pages
    │
    └─ Шаги 5-10: Универсальный Scaffold (инфраструктура)
        ├── Обнаружение языков и страниц
        ├── App.jsx (многоязычная маршрутизация)
        ├── Хуки и утилиты (useFramerAppear, useDirectus, FramerForm, etc.)
        ├── Конфиги сборки (vite.config.js, tailwind, postcss)
        ├── API functions (directus.js, asset.js прокси)
        ├── Vercel конфигурация (vercel.json)
        └── Design tokens (tokens.js)
    │
    ▼
react-app/src/
    ├── components/
    │   ├── SvgSprites.jsx
    │   ├── Hero.jsx
    │   ├── PROPERTIESINTHEAREA.jsx
    │   └── ... (1 файл на секцию)
    │
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── SearchPage.jsx
    │   ├── PropertyDetailPage.jsx (с Directus интеграцией)
    │   └── ... (для каждой найденной страницы)
    │
    ├── hooks/
    │   ├── useFramerAppear.js
    │   ├── useDirectus.js
    │   └── useDirectusSearch.js
    │
    ├── lib/
    │   ├── supabase.js
    │   └── directus.js
    │
    ├── i18n/
    │   ├── config.js (автогенерируется)
    │   └── {lang}.json (для каждого языка)
    │
    ├── App.jsx (автогенерируется с маршрутами для каждого языка)
    ├── main.jsx
    ├── index.html
    ├── index.css
    ├── tokens.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    └── framer-styles.css
    │
    ├── components/FramerForm.jsx
    │
api/
    ├── directus.js (Vercel serverless)
    └── asset.js (Vercel serverless)
    │
vercel.json (автогенерируется)
```

---

## Частые проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| Видео не воспроизводится | React-баг: `muted` prop не применяется | ref-callback `el.muted = true` в generatecomponents |
| Секция невидима (opacity 0) | Framer init state + большой translateY | translateY уменьшен до 24px, rootMargin увеличен |
| Иконки/логотипы пустые | JS-only mount в Framer | JS hydration pass в extractor |
| "Get Template" виджет | Framer marketplace overlay | Фильтр по тексту "Get Template" |
| "Template by Plaiter" в футере | data-framer-name="Template by..." | `stripFramerCredits` в generator |
| Ticker не анимируется | JS-only анимация в Framer SSR | `addTickerAnimation` + CSS keyframes |
| data-framer-ticker не в DOM | `FRAMER_ATTRS_RE` его стрипал | Добавлен в negative lookahead regex |
| Preview не обновляется | Worktree ≠ основной репозиторий | Запускать generate-components из worktree |
| Кастомная секция не отображается на Vercel | Компонент не добавлен в `src/pages/HomePage.jsx` (production) | Добавить `import` + JSX и синхронизировать worktree → production через `cp` |
| Заголовок секции выглядит иначе | `letterSpacing` не соответствует Framer-токенам | h2: `letterSpacing: '-2px'`, `fontWeight: 500`, `fontSize: 40` |

---

## Добавление нового шаблона

Процесс полностью **автоматизирован**:

### Для полносью нового проекта:

1. **Извлечь HTML/CSS из Framer:**
   ```bash
   node framer-extract-smart.mjs https://new-template.framer.website
   ```
   Создаст: `computed-styles-*.json`, `framer-styles.css`, и др.

2. **Сгенерировать весь React проект:**
   ```bash
   node generate-components.mjs
   ```
   Это создаст все 22 файла автоматически:
   - ✅ Все компоненты секций
   - ✅ Все страницы
   - ✅ App.jsx с многоязычными маршрутами (если есть i18n)
   - ✅ Все хуки и утилиты
   - ✅ Конфиги (vite, tailwind, postcss)
   - ✅ API functions
   - ✅ Vercel конфигурация
   - ✅ Design tokens

3. **Запустить dev сервер:**
   ```bash
   cd react-app
   npm run dev
   ```

### Обновление существующего проекта:

Если нужно переборать компоненты с одной страницы (например, после правок в Framer):

```bash
# Переборать только SearchPage
node generate-components.mjs --only=search

# Переборать PropertyDetails
node generate-components.mjs --only=property-details
```

**Безопасно:** 
- Существующие файлы **никогда не перезаписываются**
- Ручные правки в `.jsx` файлах остаются нетронутыми
- Можно запускать многократно без потери данных

### Что нужно сделать вручную:

После автоматической генерации:

1. **Наполнить i18n переводы** (если многоязычный проект):
   - Отредактировать `src/i18n/{lang}.json` для каждого языка
   - Использовать ключи из Framer текстов

2. **Заполнить Directus данными** (если есть CMS страницы):
   - Создать коллекцию `properties` в Directus
   - Добавить тестовые данные

3. **Настроить Supabase** (если есть auth форм):
   - Установить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в `.env`
   - Настроить Email Templates в Supabase

4. **Развернуть на Vercel:**
   ```bash
   vercel --prod
   ```

Все правила трансформации работают универсально — специальные правки не нужны.

---

## Кастомные React-секции (не из Framer)

Секции, написанные вручную (не мигрированные из Framer HTML), требуют соблюдения нескольких обязательных паттернов.

### 1 — Регистрация в HomePage.jsx

Мигратор **не добавляет** кастомные компоненты в `HomePage.jsx` автоматически. После создания файла нужно вручную:

```jsx
// src/pages/HomePage.jsx
import Pricing from '../components/Pricing.jsx'
import FAQ from '../components/FAQ.jsx'

export default function HomePage() {
  return (
    <div ...>
      <FeaturedProperties />
      <Pricing />   {/* ← добавить */}
      <FAQ />       {/* ← добавить */}
      ...
    </div>
  )
}
```

> ⚠️ При использовании worktree изменение нужно применить **в обоих местах**:
> - `react-app/src/pages/HomePage.jsx` (worktree preview)
> - `src/pages/HomePage.jsx` (production / Vercel)
>
> ```bash
> cp react-app/src/pages/HomePage.jsx src/pages/HomePage.jsx
> ```

### 2 — Section anchor + nav link

Если секция должна быть доступна из nav-меню:

```jsx
// В компоненте секции — добавить id на <section>
<section id="pricing" ...>

// В Variant1.jsx — добавить в NAV_LINKS
const NAV_LINKS = [
  ...
  { label: 'Pricing', href: '#pricing' },
]

// И в десктопный HTML nav внутри Variant1.jsx
<a href="#pricing">Pricing</a>
```

### 3 — Типографика (дизайн-токены BookImmo)

Все кастомные секции должны использовать те же токены, что и Framer-секции:

```jsx
// H2 заголовок секции
h2: {
  fontFamily: '"Bricolage Grotesque", sans-serif',
  fontSize: 40,          // мобильный: 30
  fontWeight: 500,
  letterSpacing: '-2px',
  color: 'rgb(255,102,37)',
  lineHeight: 1.2,
}

// Подзаголовок / subtitle
p: {
  fontFamily: '"Lexend", sans-serif',
  fontSize: 16,
  fontWeight: 400,
  color: 'rgb(25,26,32)',
}

// Цвета
const ORANGE = 'rgb(255,102,37)'
const DARK   = 'rgb(25,26,32)'
const LIGHT_BG = 'rgb(245,245,245)'
```

### 4 — useIsMobile (адаптивность кастомных компонентов)

Для секций с разным desktop/mobile layout — использовать хук:

```jsx
import { useState, useEffect } from 'react'

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}
```

Breakpoint: `< 768px` = мобильный.  
На мобильном h2: `fontSize: 30`, `padding: '60px 20px'` вместо `'80px 40px'`.

### 5 — CTA кнопки → ссылки на sign-up

Основные CTA («Get started», «Start free trial» и т.п.) должны быть `<a>`, а не `<button>`:

```jsx
// ✅ Правильно
<a href="./sign-up" style={{
  padding: '13px 24px',
  borderRadius: 10,
  backgroundColor: 'rgb(255,102,37)',
  color: 'white',
  textDecoration: 'none',
  display: 'inline-block',
  fontFamily: '"Lexend", sans-serif',
  fontSize: 14,
  fontWeight: 600,
}}>
  Get started
</a>

// ❌ Неправильно для навигационных CTA
<button onClick={...}>Get started</button>
```

---

## Опциональные шаги: Search Filters и Auth

### Search Filters (поиск + фильтры)

Мигратор **автоматически** распознаёт страницы с фильтрами свойств и генерирует полнофункциональный компонент, подключённый к Directus.

**Условия срабатывания:**  
- HTML содержит ≥3 ключевых слова из списка: `Apartment`, `Houses`, `Duplex`, `Sales`, `Lease`, `Rent`, `PROPERTY CATEGORY`, `Featured Property`, `Bedroom`, и т.д.  
- HTML содержит ссылки на `/Property-Details/`

**Что генерируется:**
- `SearchMain.jsx` с:
  - `useState` для фильтров (category, location, type, featured, bedrooms)
  - хуком `useDirectusSearch` для запроса к Directus с фильтрами
  - динамическим рендером карточек свойств
  - onClick на каждой кнопке фильтра
  - визуальной индикацией активного фильтра (`data-filter-active`)
- `src/hooks/useDirectusSearch.js` — хук, который нужно создать вручную (или он уже есть)

**CSS для активных фильтров** (в `framer-styles.css`):
```css
[data-filter-active="true"] .framer-V3Hf0 { background-color: rgba(25, 26, 32, 0.08) !important; }
[data-filter-active="true"] .framer-z6Ez9 { background-color: rgba(25, 26, 32, 0.08) !important; }
.framer-LzZXo[data-filter-active="true"] { background-color: rgb(25, 26, 32) !important; }
```

**Данные в Directus** — коллекция `properties` должна иметь поля:
- `property_category` — `Apartment | Houses | Duplex | Industrial | Offices | Land`
- `listing_type` — `Sales | Lease | Rent`
- `city_slug` — `Pleasantville | West Side | Capitol Hill | Greenville | Jersey City | Catskills`
- `is_featured` — boolean
- `bedrooms` — integer

### Auth Pages (аутентификация)

Мигратор **автоматически** распознаёт страницы sign-in/sign-up и генерирует функциональный компонент на Supabase Auth.

**Условия срабатывания:**  
- HTML содержит ≥2 слова из: `sign up`, `sign in`, `log in`, `register`, `email address`, `password`  
- HTML содержит `<form` или `<input`

**Что генерируется:**
- `SignUp.jsx` / `SignIn.jsx` с:
  - формой email + password
  - `supabase.auth.signUp()` / `signInWithPassword()` / `resetPasswordForEmail()`
  - переключением между режимами: Sign In / Create Account / Forgot Password
  - показом ошибок и успешных сообщений

**Требования:**
- `src/lib/supabase.js` с настроенным Supabase клиентом
- В Supabase Dashboard: Authentication → Email Templates настроены
- RLS политики в Supabase настроены для нужных таблиц

---

| Проблема | Причина | Решение |
|----------|---------|---------|
| **Компоненты старые** | Переборали только один файл с `--only=` | Запустить `node generate-components.mjs` без флагов |
| **App.jsx не обновляется** | Файл уже существует → scaffold пропускает | Удалить `react-app/src/App.jsx` и переборать, или отредактировать вручную |
| **i18n не работает** | Забыли заполнить `src/i18n/{lang}.json` | Добавить переводы для каждого языка |
| **Фильтры не срабатывают** | Поля в Directus NULL | Заполнить `property_category`, `listing_type`, `city_slug` через API PATCH |
| **RLS блокирует запросы** | Anon токен не тот | Использовать legacy JWT anon key из Supabase API Keys |
| **Duplicate style error** | tabIndex div уже имеет style | Не добавлять `style` в onClick injection |
| **Auth форма не работает** | Email не подтверждён | Проверить Supabase Auth settings → Confirm Email |
| **Vercel deployment fails** | VITE_* переменные не задали | Добавить в Vercel Project Settings → Environment Variables |
| **CSS переменные не найдены** | framer-styles.css не существует | Убедиться что `framer-extract-smart.mjs` успешно завершился |

---

## FAQ

### Почему мигратор не перезаписывает файлы?

**Ответ:** Это защита от потери ручных правок. Если вы сделали кастомизацию:
```javascript
// ваша правка в SearchPage.jsx
export default function SearchPage() {
  // ... custom hooks, state, logic
}
```

При переборке новые версии не перезапишут ваш код. Если нужно обновить:
1. Удалите файл: `rm react-app/src/pages/SearchPage.jsx`
2. Переборайте: `node generate-components.mjs --only=search`
3. Вернёте свои правки

### Как добавить новый язык?

1. Создайте `src/i18n/{lang}.json`:
   ```json
   {
     "home.title": "Добро пожаловать",
     "search.filters": "Фильтры"
   }
   ```
2. Переборайте generator: `node generate-components.mjs`
3. App.jsx автоматически добавит маршруты `/ru/`, `/ru/search`, и т.д.

### Как отключить какую-то генерацию?

Отредактируйте `generate-components.mjs`, закомментируйте нужный шаг:

```javascript
// Step 9: Tokens
// if (tokensContent) { await scaffold(...) }
```

### Я хочу использовать собственную структуру папок

Отредактируйте пути в начале `generate-components.mjs`:
```javascript
const OUT   = path.resolve('my-custom-components-dir')
const PAGES = path.resolve('my-custom-pages-dir')
```
