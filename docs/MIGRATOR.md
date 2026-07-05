# Framer → React Migrator

Полная документация по конвертации Framer-сайта в готовое React-приложение с **универсальным парсингом** вместо hardcoded решений.

---

## Быстрый старт (TL;DR)

```bash
# 1. Скачать HTML + JS-чанки, извлечь CSS + токены, найти все страницы через sitemap
node sync-framer-site-chunks.mjs --url https://your-site.framer.website

# 2. Снять computed DOM со всех страниц автоматически (через Puppeteer)
node extract-computed.mjs --url https://your-site.framer.website --all-pages
# или вручную для одной страницы: вставить extract-computed-console.js в DevTools Console

# 3. Сгенерировать React компоненты
node generate-components.mjs

# 4. Запустить dev сервер
cd react-app && npm run dev
```

Готово! ✅ Мигратор автоматически:
- ✅ Находит все страницы сайта через `sitemap.xml`
- ✅ Снимает computed DOM с каждой страницы
- ✅ **Извлекает Framer Motion анимации** через React Fiber (`whileHover`, `whileInView`, `whileTap`, `initial→animate`, `transition`, `variants`)
- ✅ Генерирует JSX компонент на каждую секцию (с `motion.*` тегами где нужно)
- ✅ Создаёт `HomePage.jsx` и страницы для всех маршрутов
- ✅ Скачивает медиафайлы → `react-app/public/assets/`
- ✅ Извлекает CSS → `framer-styles.css` и токены → `tokens.js`
- ✅ **Никогда не перезаписывает существующие файлы**

---

## Обзор

Мигратор состоит из трёх скриптов, которые запускаются последовательно:

```
1. node sync-framer-site-chunks.mjs   →  HTML + JS-чанки + CSS + токены + список страниц из sitemap
2. node extract-computed.mjs          →  computed DOM + анимации → JSON (все страницы авто или одна вручную)
   (или extract-computed-console.js   →  тот же снимок одной страницы через DevTools Console)
3. node generate-components.mjs       →  JSX компоненты (с motion.*) + страницы
```

Входные данные — URL опубликованного Framer-сайта.  
Выходные данные — полный набор `.jsx` компонентов (с `framer-motion` анимациями) + `framer-styles.css` + `tokens.js` в `react-app/src/`.

---

## Шаг 1 — `sync-framer-site-chunks.mjs`

### Что делает (6 шагов внутри)

| # | Шаг | Результат |
|---|-----|-----------|
| 1 | Авто-находит `siteId` из HTML | кэш в `framer-export/.framer-site-id` |
| 2 | Сохраняет `index.html` | `framer-export/index.html` |
| 3 | Скачивает все JS/MJS/JSON чанки | `framer-export/_local/static/sites/{siteId}/` |
| 4 | Извлекает CSS | `react-app/src/framer-styles.css` |
| 5 | Извлекает дизайн-токены | `react-app/src/tokens.js` (не перезаписывает) |
| 6 | Находит все страницы из `sitemap.xml` | `framer-export/.framer-pages.json` |

### Запуск

```bash
node sync-framer-site-chunks.mjs --url https://your-site.framer.website
# повторный запуск — siteId и pages кэшированы, только обновит чанки
```

### Пошаговая работа sync-framer-site-chunks.mjs

#### Шаг 1.1 — Определение `siteId`

Скрипт делает `fetch(siteUrl)` и парсит HTML в поиске Framer site ID.

Паттерны поиска (в порядке приоритета):
```
static/sites/{siteId}/
framercms.plus/sites/{siteId}/
framerusercontent.com/sites/{siteId}/
"siteId": "{siteId}"
/sites/{siteId}/
```

`siteId` — уникальный идентификатор сайта на Framer CDN. Все JS-чанки, шрифты и стили живут под этим ID. Кэшируется в `framer-export/.framer-site-id` чтобы не парсить HTML повторно.

#### Шаг 1.2 — Сохранение `index.html`

HTML сохраняется с rewrite URL:
- `https://static/sites/` → `/_local/static/sites/` (для локальных чанков)
- Origin-ссылки → относительные пути

#### Шаг 1.3 — Скачивание JS/MJS/JSON чанков

Рекурсивный crawler: начинает с `src`/`href` ссылок из HTML, скачивает каждый `.mjs`/`.js`/`.json` файл, парсит его содержимое в поиске новых ссылок, и продолжает пока не обойдёт все.

Базовые URL для скачивания (пробует по очереди):
```
https://static/sites/{siteId}/
https://app.framerstatic.com/sites/{siteId}/
https://framerusercontent.com/sites/{siteId}/
```

Все файлы сохраняются в `framer-export/_local/static/sites/{siteId}/`.

**Зачем скачивать JS?** Framer CDN может удалить или обновить чанки. Локальная копия — insurance. Также из чанков можно извлечь animation configs, route maps и другие метаданные при необходимости.

#### Шаг 1.4 — Извлечение CSS (SSR fallback)

Парсит `<style>` теги из скачанного `index.html`:
- `@font-face` декларации шрифтов
- Breakpoint классы (`hidden-*` для адаптивности)
- Global SSR CSS (reset, текстовая система, CSS-токены)

Добавляет **runtime patches** в конец:
- `:root { --framer-canvas-fixed-position: fixed; }` — без этого fixed-position элементы ломаются
- `[data-framer-appear-id]` — scroll-appear анимации (opacity: 0 → 1, translateY)
- `@keyframes framerTickerScroll` — ticker/marquee анимации

> ⚠️ Это **fallback CSS**. Если `extract-computed.mjs` уже записал более полный CSS через `document.styleSheets`, этот шаг автоматически пропускается (проверяет наличие `"extract-computed.mjs"` в файле).

#### Шаг 1.5 — Извлечение дизайн-токенов

Парсит `framer-styles.css` в поиске `--token-*` CSS-переменных:

```
Regex: /--(token-[a-f0-9-]{36})\s*:\s*(#hex|rgba?(...)|named)/g
```

Framer хранит цвета в CSS-переменных вида `--token-5c28b080-63a4-416d-b638-2f3867ab529e: #ff6625`. Скрипт извлекает их и записывает в `tokens.js` с ключами из первых 8 символов UUID.

Также извлекает все `font-family` из `@font-face` деклараций.

Результат:
```js
// react-app/src/tokens.js (авто)
export const colors = {
  '5c28b080': '#ff6625',
  '7bd8e2a9': '#fff8f4',
}
export const fonts = [
  '"Bricolage Grotesque", sans-serif',
  '"Inter", sans-serif',
]
```

> Файл **не перезаписывается** — можно добавить семантические алиасы (`primary: '#ff6625'`) и они сохранятся.

#### Шаг 1.6 — Обнаружение страниц из `sitemap.xml`

Все опубликованные Framer сайты имеют `sitemap.xml`. Скрипт:
1. Fetch `{origin}/sitemap.xml`
2. Парсит все `<loc>` теги
3. Конвертирует URL → slug (`https://site.com/pricing` → `pricing`, `/` → `home`)
4. Фильтрует динамические роуты (`:`, `*`, `?`) и `404`
5. Дедуплицирует
6. Сохраняет в `framer-export/.framer-pages.json`

Этот список используется `extract-computed.mjs --all-pages` для обхода всех страниц.

---

## Шаг 2 — `extract-computed.mjs` / `extract-computed-console.js`

### Что делает

Снимает полностью hydrated DOM с живого сайта + **извлекает Framer Motion анимации** через React Fiber tree. Это источник HTML и анимаций для генерации компонентов.

### Вариант A: Все страницы автоматически (рекомендуется)

```bash
# Читает framer-export/.framer-pages.json (созданный на шаге 1) и обходит все страницы
node extract-computed.mjs --url https://your-site.framer.website --all-pages
```

Сохраняет:
- `react-app/src/computed-styles.json` — главная (`/`)
- `react-app/src/computed-styles-pricing.json` — `/pricing`
- `react-app/src/computed-styles-blog-my-post.json` — `/blog/my-post`
- и т.д. для каждой страницы из sitemap

Каждый JSON содержит `_animations` — карту Framer Motion props (`whileHover`, `whileInView`, `initial`, `animate`, `transition`, `variants`) извлечённых через React Fiber tree.

### Вариант B: Одна страница (Puppeteer)

```bash
node extract-computed.mjs --url https://your-site.framer.website
node extract-computed.mjs --url https://your-site.framer.website/pricing --out react-app/src/computed-styles-pricing.json
```

### Вариант C: DevTools Console (без Puppeteer)

1. Открой страницу в Chrome
2. `Cmd+Option+J` → Console
3. Вставь содержимое `extract-computed-console.js`
4. Скачаются `computed-styles.json` (DOM + анимации) и `framer-styles.css` (CSS) — положи оба в `react-app/src/`

### Пошаговая работа extract-computed.mjs

Для каждой страницы `extractPage()` выполняет:

1. **Навигация** — `page.goto(url, { waitUntil: 'networkidle2' })` + ожидание `[data-framer-name]` элементов
2. **Scroll** — прокрутка всей страницы для запуска lazy-loaded секций, затем обратно
3. **Извлечение анимаций** (`INJECT_MOTION_IDS_FN`) — обход всего DOM через `TreeWalker`:
   - Для каждого элемента находит React Fiber (`__reactFiber$`)
   - Поднимается по Fiber tree (до 12 уровней) ища motion props
   - Извлекает: `whileHover`, `whileInView`, `whileTap`, `whileDrag`, `whileFocus`, `initial`, `animate`, `exit`, `variants`, `transition`
   - **Резолвит variant-based жесты** (`resolveVariantGestures`): Framer хранит hover/tap как варианты с суффиксами `"-hover"`, `"-pressed"` в ID (напр. `"lNk6HaDEU-hover"`). Функция находит дельту между base и gesture вариантами → конвертирует в прямые `whileHover`/`whileTap` props. На membria.ai: **103 whileHover + 9 whileTap** резолвлено из 202 variant-only элементов
   - Оставшиеся `variants` (без `-hover`/`-pressed` суффиксов) — это responsive breakpoint переключения, не жесты
   - Функции сериализуются в `null`, объекты/числа/строки сохраняются
   - Помечает элемент `data-motion-id="m0"`, сохраняет props в карту `_animations`
   - **Запускается ДО** снятия outerHTML чтобы `data-motion-id` попал в HTML
4. **Извлечение DOM** (`EXTRACT_FN`) — для каждого `[data-framer-name]`:
   - Определяет `isTopLevel` (нет parent с `data-framer-name`)
   - Снимает `getBoundingClientRect()` + `getComputedStyle()` (position, zIndex)
   - Сохраняет `outerHTML` (уже с `data-motion-id` атрибутами)
   - Отдельно захватывает `<nav>` без `data-framer-name` (fixed navbar)
5. **Извлечение CSS** (`EXTRACT_CSS_FN`) — `document.styleSheets` API даёт полный hydrated CSS (включая динамически инжектированные стили Framer runtime)
6. **Запись** — JSON с секциями + `_animations` карта, CSS аккумулируется из всех страниц

#### CSS: `document.styleSheets` vs `<style>` tag parsing

| Метод | Источник | Полнота |
|-------|----------|---------|
| `document.styleSheets` (extract-computed) | Puppeteer/Console | ✅ Полный — включает runtime-injected стили |
| `<style>` tags (sync Step 4) | SSR HTML | ⚠️ Частичный fallback — только SSR CSS |

sync Step 4 автоматически пропускается если extract-computed уже записал более полный CSS (проверяет наличие `"extract-computed.mjs"` в файле).

### Выходные файлы

| Файл | Описание |
|------|----------|
| `react-app/src/framer-styles.css` | Весь CSS сайта (через `document.styleSheets`) |
| `react-app/src/computed-styles.json` | HTML-секции + анимации homepage |
| `react-app/src/computed-styles-{slug}.json` | HTML-секции + анимации каждой страницы |
| `react-app/public/assets/images/*.{png,jpg,webp,svg}` | Все изображения (скачаны локально generate-components) |
| `react-app/public/assets/videos/*.mp4` | Все видео (скачаны локально generate-components) |

---

## Шаг 3 — `generate-components.mjs`

### Что делает

Читает `computed-styles*.json` (с DOM + анимациями) и генерирует React JSX компоненты:
1. Скачивает медиа-ассеты (видео + изображения) локально
2. Конвертирует HTML → JSX (с Framer Motion анимациями из `_animations`)
3. Генерирует страницы (HomePage + per-page) с секциями в правильном z-order
4. Cleanup устаревших файлов от предыдущих запусков

### Запуск

```bash
cd /path/to/your-project
node generate-components.mjs
```

### Пошаговая работа

#### Шаги 1-4: Генерация компонентов

##### 1 — Скачивание ассетов (видео + изображения)

**Видео** (`downloadVideoAssets`):
- Сканирует все `computed-styles*.json` в поиске `framerusercontent.com/assets/*.mp4`
- Скачивает в `react-app/public/assets/videos/` через `curl`
- URL в HTML заменяются на `/assets/videos/filename.mp4`

**Изображения** (`downloadImageAssets`):
- Сканирует все `computed-styles*.json` в поиске `framerusercontent.com/images/*.{png,jpg,jpeg,webp,svg}`
- Скачивает в `react-app/public/assets/images/` через `curl`
- URL в HTML заменяются на `/assets/images/filename.ext`
- Query-параметры (`?scale-down-to=512` и т.п.) стрипаются — отдаём оригинальный размер

Оба шага идемпотентны: если файл уже скачан, пропускается (`already downloaded`).

**Зачем:** Framer CDN (`framerusercontent.com`) — внешняя зависимость. Если Framer удалит проект или изображение, сайт сломается. Локальные копии исключают эту зависимость полностью.

##### 2 — HTML → JSX трансформация (`htmlToJsx`)

Каждый HTML-блок проходит через цепочку трансформаций:

**a) `stripFramerCredits`** (depth-aware)
- Удаляет `<div data-framer-name="Template by ...">` — кредиты автора шаблона
- Удаляет `<a href="framer.com/marketplace/...">` — ссылки на маркетплейс
- Использует подсчёт глубины вложенности (не regex `.*?`) — корректно обрабатывает вложенные div/a внутри блоков

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
| `data-motion-id` | удаляется (используется только для lookup анимаций) |
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

**e) Motion tag conversion** (Framer Motion анимации)

Когда элемент имеет `data-motion-id` (добавленный extract-computed через React Fiber):
1. Ищет ID в карте `ANIMATIONS` (загружена из `_animations` в computed-styles.json)
2. Конвертирует тег: `<div>` → `<motion.div>`, `<a>` → `<motion.a>` и т.д.
3. Добавляет animation props как JSX: `whileHover={...}`, `whileInView={...}` и т.д.
4. Tag stack отслеживает ВСЕ открывающие теги — закрывающие `</div>` → `</motion.div>` корректно матчатся даже с вложенными обычными тегами того же типа
5. Автоматически добавляет `import { motion } from 'framer-motion'` в компоненты с анимациями

Пример:
```jsx
// До (Framer SSR): <div data-motion-id="m3" class="framer-abc">...</div>
// После:
<motion.div className="framer-abc"
  whileHover={{scale: 1.05}}
  transition={{type: "spring", damping: 20, stiffness: 80}}
>...</motion.div>
```

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

`HomePage.jsx` и все per-page страницы — импортируют секции, отсортированные по zIndex → position → y-позиции (фоновые декоративные слои рендерятся первыми, контент поверх):

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

#### Что НЕ генерируется (создаётся вручную один раз)

Хуки, конфиги и инфраструктура **не генерируются автоматически** — настраиваются один раз при создании проекта:

| Файл | Описание |
|------|----------|
| `src/hooks/useFramerAppear.js` | IntersectionObserver для scroll-appear анимаций |
| `src/hooks/useDirectus.js` | Fetcher для Directus коллекций |
| `src/api/directus.js` | Directus SDK клиент + `directusAsset()` |
| `vite.config.js` | Порт, прокси `/api/directus` |
| `vercel.json` | SPA rewrites + API route |
| `main.jsx`, `index.css` | Точки входа |

> `App.jsx` с роутером, i18n, `LangWrapper` — были в старом `migrate-to-react.mjs`, в текущих скриптах не создаются.

#### Дизайн-токены

`sync-framer-site-chunks.mjs` (Шаг 5) **автоматически** извлекает `--token-*` CSS-переменные и `@font-face` шрифты в `react-app/src/tokens.js`. Файл **не перезаписывается** при повторном запуске.

#### Directus CMS интеграция

Directus подключается **runtime** (не build-time) — данные загружаются через React хуки прямо из CMS:

```
Browser → React (useDirectus) → /api/directus proxy → cms.book.immo
```

**Готовые компоненты:**

| Файл | Что делает |
|------|-----------|
| `src/api/directus.js` | SDK клиент (`@directus/sdk`), `directusAsset()` для картинок |
| `src/hooks/useDirectus.js` | Универсальный fetcher для любой коллекции |
| `src/hooks/useDirectusSearch.js` | Поиск properties с фильтрами (цена, город, тип, спальни) |
| `api/directus.js` | Vercel serverless прокси (Bearer auth + CORS) |
| `vite.config.js` | Dev прокси `/api/directus` → `cms.book.immo` |

**Коллекции в CMS:** `properties`, `agents`, `blog_posts`, `leads`

**Env-переменные:** `VITE_DIRECTUS_URL` + `VITE_DIRECTUS_TOKEN` (или хардкод `cms.book.immo`)

> Build-time sync (предгенерация страниц из CMS при деплое) не реализован. Весь контент загружается на клиенте. Для SSG/ISR нужен дополнительный скрипт.

---

## Полный список генерируемых файлов

### Что генерирует pipeline

| Скрипт | Файл | Описание |
|--------|------|----------|
| sync | `react-app/src/framer-styles.css` | CSS (fallback, перезаписывается extract-computed) |
| sync | `react-app/src/tokens.js` | Дизайн-токены (не перезаписывает) |
| sync | `framer-export/.framer-pages.json` | Список страниц из sitemap |
| extract-computed | `react-app/src/computed-styles*.json` | DOM + анимации каждой страницы |
| extract-computed | `react-app/src/framer-styles.css` | Полный CSS (document.styleSheets) |
| generate | `src/components/{SectionName}.jsx` | По одному на секцию (с `motion.*` если есть анимации) |
| generate | `src/components/SvgSprites.jsx` | SVG-спрайты со всех страниц |
| generate | `src/components/Nav.jsx` | Fixed navbar (если найден) |
| generate | `src/pages/HomePage.jsx` | Главная страница |
| generate | `src/pages/{Slug}Page.jsx` | Доп. страницы |
| generate | `public/assets/images/*` | Скачанные изображения |
| generate | `public/assets/videos/*` | Скачанные видео |

### Что НЕ генерируется (создаётся вручную один раз)

| Файл | Описание |
|------|----------|
| `src/hooks/useFramerAppear.js` | IntersectionObserver для scroll-appear |
| `src/hooks/useDirectus.js` | Fetcher для Directus коллекций |
| `src/api/directus.js` | Directus SDK клиент |
| `vite.config.js` | Порты, прокси |
| `vercel.json` | SPA rewrites + API route |
| `main.jsx`, `App.jsx` | Точки входа, роутер |

**Важно:** `generate-components.mjs` **перезаписывает** компоненты при повторном запуске. Файлы с `// manual` или `/* manual */` не удаляются при cleanup.

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

### Классификация анимаций: что выживает при миграции

| Тип | Механизм в Framer | После миграции |
|-----|-------------------|----------------|
| Scroll-appear секций | JS IntersectionObserver | ✅ `useFramerAppear` хук + CSS |
| Бесконечный тикер | JS-only CSS animation | ✅ `addTickerAnimation` + CSS keyframes |
| Текстовые `:hover` ссылки | CSS `:hover` | ✅ В `framer-styles.css` |
| Hover на карточках (scale, shadow) | `framer-motion` `whileHover` | ✅ **Извлекается через React Fiber** → `motion.div` |
| Hover на кнопках (scale, glow) | `framer-motion` `whileHover` | ✅ **Извлекается через React Fiber** → `motion.div` |
| whileInView (появление при скролле) | `framer-motion` `whileInView` | ✅ **Извлекается через React Fiber** → `motion.div` |
| whileTap (нажатие) | `framer-motion` `whileTap` | ✅ **Извлекается через React Fiber** → `motion.div` |
| Transition при смене состояния | `framer-motion` `animate` | ✅ **Извлекается через React Fiber** → `motion.div` |
| Drag анимации | `framer-motion` `whileDrag` | ✅ **Извлекается** (требует `drag` prop вручную) |
| Page transitions (exit/enter) | `framer-motion` `AnimatePresence` | ⚠️ Props извлекаются, но `AnimatePresence` wrapper — вручную |

**Как это работает:** `extract-computed.mjs` обходит DOM через `TreeWalker`, для каждого элемента находит React Fiber (`__reactFiber$`), поднимается по Fiber tree и извлекает motion props. Framer часто хранит hover/tap не как прямые `whileHover`/`whileTap`, а как варианты с суффиксами в ID (`"baseId-hover"`, `"baseId-pressed"`). `resolveVariantGestures()` вычисляет дельту → конвертирует в прямые gesture props. Элемент помечается `data-motion-id`, props сохраняются в `_animations`. При генерации JSX тег конвертируется в `motion.{tag}` с props.

---

### `useFramerAppear` (`src/hooks/useFramerAppear.js`)

IntersectionObserver для scroll-appear анимаций:
- Наблюдает за всеми `[data-framer-appear-id]` элементами
- При попадании в viewport → добавляет класс `appeared`
- Дочерние `[data-framer-appear-id]` элементы каскадно получают `appeared` с задержкой 80мс

Настройки observer: `threshold: 0.01, rootMargin: '0px 0px -40px 0px'`  
(отрицательный нижний rootMargin — анимация начинается когда элемент на 40px вошёл в нижний край viewport, пользователь видит её в процессе)

> ⚠️ Не используй большой положительный rootMargin (например `200px`) — анимация заканчивается до того, как элемент попадает в поле зрения.

### `framer-styles.css` — runtime patches

**Scroll-appear анимация:**
```css
[data-framer-appear-id] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
[data-framer-appear-id].appeared {
  opacity: 1 !important;
  transform: none !important;
}
```
Важно: `translateY` = 24px (не 150px как в оригинале Framer).  
150px выводит элементы за пределы rootMargin — IntersectionObserver их не замечает.

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

### Framer Motion анимации — автоматическое извлечение

Hover, tap, scroll-in-view и другие Framer Motion анимации **автоматически извлекаются** через React Fiber tree и конвертируются в `motion.*` компоненты с соответствующими props.

**Что происходит автоматически:**
1. `extract-computed.mjs` — находит все `motion.div`/`motion.a` через React Fiber, извлекает props, помечает `data-motion-id`
2. **Резолв variant-based жестов** — Framer хранит hover/tap не как прямые `whileHover` props, а как варианты с суффиксами в ID:
   - `"lNk6HaDEU"` — base variant (стиль по умолчанию)
   - `"lNk6HaDEU-hover"` — hover variant (стиль при наведении)
   - `"lNk6HaDEU-pressed"` — pressed variant (стиль при нажатии)
   
   `resolveVariantGestures()` вычисляет дельту между base и gesture вариантами → конвертирует в `whileHover`/`whileTap`.
   Оставшиеся `variants` без gesture-суффиксов — responsive breakpoint переключения (не жесты).
3. `generate-components.mjs` — при встрече `data-motion-id` конвертирует `<div>` → `<motion.div>` + добавляет props

**Результат:**
```jsx
import { motion } from 'framer-motion'

// Автоматически сгенерировано (из variant resolution):
<motion.div
  whileHover={{backgroundColor: "rgb(72, 143, 250)"}}
  whileTap={{backgroundColor: "rgb(72, 143, 250)", filter: "brightness(0.7)"}}
  transition={{delay: 0, duration: 0.3, ease: [0.44, 0, 0.56, 1], type: "tween"}}
  className="framer-abc"
>
  {/* содержимое кнопки */}
</motion.div>
```

**Ручные CSS-патчи** больше не нужны для hover-эффектов — они извлекаются из Framer автоматически. Если на каком-то элементе анимация не извлеклась (React Fiber не доступен или элемент вне дерева), можно добавить CSS-патч вручную:

```css
/* Fallback: ручной hover для элементов где motion extraction не сработал */
[style*="cursor: pointer"][style*="will-change"]:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

---

## Полный pipeline

```
Framer URL (опубликованный сайт)
    │
    ▼
sync-framer-site-chunks.mjs           ← автоопределение siteId
    ├── index.html                    →  framer-export/index.html
    ├── *.mjs chunks                  →  framer-export/_local/static/sites/{id}/
    ├── CSS (fallback)                →  react-app/src/framer-styles.css
    ├── tokens.js                     →  react-app/src/tokens.js
    └── sitemap.xml                   →  framer-export/.framer-pages.json
    │
    ▼
extract-computed.mjs --all-pages       ← Puppeteer + React Fiber
    ├── DOM (hydrated outerHTML)       →  computed-styles*.json
    ├── Анимации (React Fiber)         →  _animations в каждом JSON
    └── CSS (document.styleSheets)     →  framer-styles.css (полный)
    │
    ▼
generate-components.mjs
    │
    ├─ Скачивание ассетов (видео + изображения)
    ├─ HTML → JSX трансформация
    │   ├── stripFramerCredits    →  удаляет "Template by..." (depth-aware)
    │   ├── addTickerAnimation    →  дублирует li + data-framer-ticker
    │   ├── htmlToJsx             →  class→className, style→объект, boolean attrs
    │   ├── motion.* conversion   →  data-motion-id → motion.div + whileHover/etc
    │   └── injectAppearIds       →  data-framer-appear-id на карточки
    ├─ SvgSprites (merge all pages)
    ├─ Секции (sorted: zIndex → position → y)
    ├─ HomePage.jsx + {Slug}Page.jsx
    └─ Cleanup orphaned .jsx files
    │
    ▼
react-app/src/
    ├── components/
    │   ├── SvgSprites.jsx                     ← авто
    │   ├── Hero.jsx (import { motion })       ← авто (с framer-motion если нужно)
    │   └── ... (1 файл на секцию)
    │
    ├── pages/
    │   ├── HomePage.jsx                       ← авто
    │   └── {Slug}Page.jsx                     ← авто
    │
    ├── hooks/useFramerAppear.js               ← вручную
    ├── framer-styles.css                      ← авто (extract-computed)
    └── tokens.js                              ← авто (sync) + ручные алиасы
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
| Изображения не загружаются после деплоя | `framerusercontent.com` ссылки — внешняя зависимость от Framer CDN | `generate-components.mjs` автоматически скачивает все изображения в `public/assets/images/` |
| Hover на карточках не работает | `motion.*` не сгенерирован или `framer-motion` не установлен | Проверить `_animations` в JSON, `npm install framer-motion` |
| Секции появляются без анимации | `rootMargin` слишком большой — анимация заканчивается вне viewport | Использовать `rootMargin: '0px 0px -40px 0px'` в `useFramerAppear.js` |
| Scroll-анимация не видна на кастомной секции | `data-framer-appear-id` не добавлен на `<section>` | Добавить атрибут: `<section data-framer-appear-id="my-section-name">` |

---

## Добавление нового шаблона

Процесс полностью **автоматизирован**:

### Для полностью нового проекта:

```bash
# 1. Скачать сайт: HTML, JS-чанки, CSS, токены, список страниц
node sync-framer-site-chunks.mjs --url https://new-template.framer.website

# 2. Снять DOM + анимации со всех страниц
node extract-computed.mjs --url https://new-template.framer.website --all-pages

# 3. Сгенерировать React компоненты (с motion.* анимациями)
node generate-components.mjs

# 4. Установить зависимости и запустить
cd react-app && npm install framer-motion && npm run dev
```

Создаст:
- ✅ JSX-компонент на каждую секцию (с `motion.*` где есть анимации)
- ✅ `SvgSprites.jsx` + `Nav.jsx`
- ✅ `HomePage.jsx` + страницы для всех маршрутов
- ✅ Скачает медиафайлы в `public/assets/`
- ✅ `framer-styles.css` + `tokens.js`

### Обновление существующего проекта:

После правок в Framer — перезапустить полный pipeline:

```bash
node extract-computed.mjs --url https://your-site.framer.website --all-pages
node generate-components.mjs
```

> ⚠️ Компоненты перезаписываются. Файлы с `// manual` защищены от cleanup.

### Что нужно сделать вручную:

После автоматической генерации:

1. **Заполнить Directus данными** (если есть CMS страницы):
   - Создать нужные коллекции в Directus
   - Подключить через `useDirectus` хук в компонентах
   - Прописать `VITE_DIRECTUS_URL` и `VITE_DIRECTUS_TOKEN` в `.env`

2. **Развернуть на Vercel:**
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

### 3 — Типографика (дизайн-токены проекта)

`sync-framer-site-chunks.mjs` **автоматически** генерирует `react-app/src/tokens.js` (Шаг 5) — извлекает все `--token-*` переменные из `framer-styles.css` и список шрифтов из `@font-face`.

Ключи — первые 8 символов UUID токена. Файл **не перезаписывается** при повторном запуске, чтобы не затереть семантические алиасы.

```js
// react-app/src/tokens.js — авто-генерируется, затем можно дополнить алиасами
export const colors = {
  'ef341a45': '#84b9ef',   // ← raw из Framer
  'primary': '#ff6625',    // ← добавить вручную после генерации
}
export const fonts = [
  '"Fragment Mono", sans-serif',
  '"Inter", sans-serif',
]
```

Использование:
```jsx
import { colors, fonts } from '../tokens.js'
// style={{ color: colors.primary, fontFamily: fonts[1] }}
```

> **bookimmo**: `#ff6625` (orange), `"Bricolage Grotesque"` + `"Lexend"` — см. `src/tokens.js`

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

> Эти компоненты **не генерируются автоматически** — создаются вручную по образцу ниже.

### Search Filters (поиск + фильтры)

Паттерн для страниц с фильтрами недвижимости, подключённых к Directus.

**Структура `SearchMain.jsx`:**
- `useState` для фильтров (category, location, type, featured, bedrooms)
- хук `useDirectusSearch` для запроса к Directus с фильтрами
- динамический рендер карточек свойств
- onClick на каждой кнопке фильтра
- визуальная индикация активного фильтра (`data-filter-active`)

**CSS для активных фильтров** (добавить в `framer-styles.css`):
```css
[data-filter-active="true"] .framer-V3Hf0 { background-color: rgba(25, 26, 32, 0.08) !important; }
[data-filter-active="true"] .framer-z6Ez9 { background-color: rgba(25, 26, 32, 0.08) !important; }
.framer-LzZXo[data-filter-active="true"] { background-color: rgb(25, 26, 32) !important; }
```

**Коллекция `properties` в Directus** — нужные поля:
- `property_category` — `Apartment | Houses | Duplex | Industrial | Offices | Land`
- `listing_type` — `Sales | Lease | Rent`
- `city_slug` — slug города
- `is_featured` — boolean
- `bedrooms` — integer

### Auth Pages (аутентификация)

Паттерн для страниц sign-in/sign-up на Supabase Auth.

**`SignUp.jsx` / `SignIn.jsx`:**
- форма email + password
- `supabase.auth.signUp()` / `signInWithPassword()` / `resetPasswordForEmail()`
- переключение между режимами: Sign In / Create Account / Forgot Password
- показ ошибок и успешных сообщений

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
| **CSS переменные не найдены** | framer-styles.css не существует | Убедиться что `extract-computed.mjs` успешно завершился |

---

## FAQ

### Как сохранить ручные правки в компоненте?

`generate-components.mjs` **перезаписывает** компоненты при повторном запуске. Чтобы защитить файл от cleanup:
- Добавь `// manual` или `/* manual */` в начало файла — скрипт не удалит его

Для полной защиты от перезаписи: переименуй файл или перенеси логику в обёртку.

### Как кастомизировать пути?

Отредактируйте пути в начале `generate-components.mjs`:
```javascript
const OUT   = path.resolve('my-custom-components-dir')
const PAGES = path.resolve('my-custom-pages-dir')
```

### Анимации не извлеклись — что делать?

1. Проверь `_animations` в `computed-styles.json` — если пустой, React Fiber не найден (сайт мог не загрузиться полностью)
2. Перезапусти `extract-computed.mjs` — убедись что страница полностью hydrated (networkidle2)
3. Проверь лог `[motion] N elements, M gesture variants resolved` — если M=0, возможно Framer изменил конвенцию суффиксов в variant ID (ожидаются `"-hover"`, `"-pressed"`)
4. Оставшиеся `variants` (без gesture суффиксов) — responsive breakpoint переключения, их не нужно конвертировать в `whileHover`
5. Fallback: добавь CSS-патч вручную в `framer-styles.css`
6. Убедись что `framer-motion` установлен: `npm install framer-motion`
