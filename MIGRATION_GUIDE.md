# Framer → React Migration Guide

> ⚠️ **Этот файл устарел.** Актуальная документация находится в [`docs/MIGRATOR.md`](docs/MIGRATOR.md).

Старый `migrate-to-react.mjs` (CSS-модули, мультиязычные роуты `/de`, `/en`, `/fr`) **не используется**.

## Текущий пайплайн

```
sync-framer-site-chunks.mjs   ←  скачивает HTML + JS-чанки
extract-computed.mjs           ←  снимает computed DOM → JSON
generate-components.mjs        ←  генерирует JSX компоненты
```

Подробности, примеры и справочник скриптов: **[docs/MIGRATOR.md](docs/MIGRATOR.md)**
