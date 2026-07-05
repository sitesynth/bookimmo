# Bookimmo Client Cabinet Schema And API

## Цель

Ниже схема данных и API для первого клиентского кабинета `bookimmo`.

Я исхожу из практичного варианта:

- frontend остается на текущем React/Vite;
- auth и база идут через Supabase/Postgres;
- часть бизнес-логики живет в SQL/RLS/functions;
- при необходимости позже добавляется отдельный API-layer.

## Архитектурный принцип

Нужно разделить:

1. `client platform`
   - пользователи;
   - профиль;
   - поиск;
   - заявки;
   - документы;
   - избранное.

2. `internal automation`
   - импорт объектов;
   - внешние интеграции;
   - боты;
   - Gmail/Telegram/ImmoScout automation.

Обе системы могут работать на одной БД, но с разными таблицами и правами доступа.

## Основные сущности

## 1. `users`

Обычно это `auth.users` в Supabase.

Дополнительный профиль лучше хранить отдельно.

## 2. `profiles`

Расширение auth-пользователя.

Поля:

- `id uuid pk`
- `user_id uuid unique references auth.users`
- `role text`
- `first_name text`
- `last_name text`
- `phone text`
- `preferred_language text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

Назначение:

- легкий базовый профиль аккаунта;
- не перегружать его арендными полями.

## 3. `tenant_profiles`

Главная сущность кабинета арендатора.

Поля:

- `id uuid pk`
- `user_id uuid unique references auth.users`
- `birth_date date`
- `nationality text`
- `marital_status text`
- `household_size int`
- `children_count int`
- `pets_count int`
- `pets_description text`
- `smoking_status text`
- `employment_status text`
- `employer_name text`
- `job_title text`
- `monthly_net_income numeric`
- `additional_income numeric`
- `has_guarantor boolean`
- `guarantor_details text`
- `current_city text`
- `current_country text`
- `move_in_date date`
- `min_budget numeric`
- `max_budget numeric`
- `min_rooms numeric`
- `max_rooms numeric`
- `preferred_property_types text[]`
- `preferred_locations jsonb`
- `rental_duration_preference text`
- `about_me text`
- `cover_letter text`
- `profile_completion_percent int`
- `is_profile_ready boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Замечание:

- `preferred_locations jsonb` можно хранить как массив районов, городов и геозон;
- позже можно нормализовать в отдельные таблицы.

## 4. `tenant_documents`

Документы арендатора.

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `tenant_profile_id uuid references tenant_profiles`
- `document_type text`
- `file_path text`
- `file_name text`
- `mime_type text`
- `file_size bigint`
- `status text`
- `expires_at timestamptz`
- `verified_at timestamptz`
- `created_at timestamptz`

Типы документов:

- `id_card`
- `passport`
- `income_proof`
- `employment_letter`
- `schufa`
- `bank_statement`
- `cover_letter_attachment`

## 5. `properties`

Каноническая таблица объектов для клиентского поиска.

Поля:

- `id uuid pk`
- `external_source text`
- `external_id text`
- `title text`
- `description text`
- `property_type text`
- `listing_type text`
- `price_amount numeric`
- `currency text`
- `warm_rent numeric`
- `cold_rent numeric`
- `deposit_amount numeric`
- `rooms numeric`
- `area_sqm numeric`
- `bedrooms int`
- `bathrooms int`
- `floor text`
- `furnished boolean`
- `pets_allowed boolean`
- `available_from date`
- `status text`
- `source_url text`
- `primary_image_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

## 6. `property_locations`

Отдельная таблица для карты и геопоиска.

Поля:

- `property_id uuid pk references properties`
- `country text`
- `city text`
- `district text`
- `postal_code text`
- `street text`
- `house_number text`
- `full_address text`
- `lat numeric`
- `lng numeric`
- `geo_point geography`

Зачем отдельно:

- удобнее для геозапросов;
- проще управлять приватностью адресов;
- легче индексировать карту.

## 7. `property_images`

Поля:

- `id uuid pk`
- `property_id uuid references properties`
- `image_url text`
- `sort_order int`
- `is_primary boolean`

## 8. `saved_searches`

Сохранённые поиски пользователя.

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `name text`
- `filters jsonb`
- `notifications_enabled boolean`
- `last_run_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

`filters jsonb` может хранить:

- price min/max;
- rooms;
- city;
- districts;
- property types;
- furnished;
- pets allowed;
- move-in date;
- bbox / map bounds.

## 9. `favorites`

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `property_id uuid references properties`
- `created_at timestamptz`

Ограничение:

- unique `(user_id, property_id)`

## 10. `applications`

Главная таблица заявок на аренду.

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `tenant_profile_id uuid references tenant_profiles`
- `property_id uuid references properties`
- `status text`
- `submitted_at timestamptz`
- `cover_message text`
- `completion_snapshot jsonb`
- `source_channel text`
- `created_at timestamptz`
- `updated_at timestamptz`

Статусы:

- `draft`
- `ready_to_submit`
- `submitted`
- `in_review`
- `viewing_invited`
- `accepted`
- `rejected`
- `withdrawn`
- `archived`

`completion_snapshot` полезен для фиксации состояния профиля на момент отправки.

## 11. `application_events`

Timeline по заявке.

Поля:

- `id uuid pk`
- `application_id uuid references applications`
- `event_type text`
- `event_payload jsonb`
- `created_by uuid null`
- `created_at timestamptz`

События:

- `application_created`
- `profile_incomplete`
- `documents_missing`
- `application_submitted`
- `application_review_started`
- `viewing_invite_received`
- `message_received`
- `application_rejected`
- `application_accepted`

## 12. `messages`

Сообщения, относящиеся к заявке или объекту.

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `application_id uuid null references applications`
- `property_id uuid null references properties`
- `direction text`
- `channel text`
- `subject text`
- `body text`
- `metadata jsonb`
- `created_at timestamptz`

## 13. `notifications`

Поля:

- `id uuid pk`
- `user_id uuid references auth.users`
- `type text`
- `title text`
- `body text`
- `data jsonb`
- `is_read boolean`
- `created_at timestamptz`

## 14. `profile_completion_rules`

Необязательная, но полезная таблица.

Хранит правила расчёта полноты профиля.

Если не хочется усложнять, можно держать это в коде.

## Минимальные индексы

- `profiles(user_id)`
- `tenant_profiles(user_id)`
- `favorites(user_id, property_id) unique`
- `applications(user_id, status)`
- `applications(property_id, status)`
- `application_events(application_id, created_at desc)`
- `saved_searches(user_id)`
- `properties(external_source, external_id) unique`
- `property_locations(city, district)`
- geospatial index на `property_locations.geo_point`

## RLS-правила

Для Supabase это критично.

### Пользователь должен видеть только свои:

- `profiles`
- `tenant_profiles`
- `tenant_documents`
- `favorites`
- `saved_searches`
- `applications`
- `application_events` по своим заявкам
- `messages`, где он владелец
- `notifications`

### Публично доступны:

- `properties`
- `property_locations`
- `property_images`

Но:

- часть полей можно скрывать для неавторизованных;
- полный адрес можно ограничивать.

## API-контракты MVP

Ниже логическая API-модель. Ее можно реализовать:

- через Supabase client + SQL/RPC;
- через Edge Functions;
- через отдельный backend.

## Auth

### `POST /auth/sign-up`

Вход:

```json
{
  "email": "user@example.com",
  "password": "secret",
  "firstName": "Anna",
  "lastName": "Schmidt"
}
```

Выход:

```json
{
  "userId": "uuid",
  "emailConfirmationRequired": true
}
```

### `POST /auth/sign-in`

### `POST /auth/sign-out`

### `POST /auth/reset-password`

## Profile

### `GET /me`

Возвращает краткий профиль аккаунта.

### `GET /me/tenant-profile`

Возвращает полный tenant profile.

### `PATCH /me/tenant-profile`

Частичное обновление профиля.

Пример:

```json
{
  "monthlyNetIncome": 4200,
  "moveInDate": "2026-08-15",
  "maxBudget": 1800,
  "preferredLocations": [
    { "city": "Hamburg", "district": "Winterhude" },
    { "city": "Hamburg", "district": "Eppendorf" }
  ],
  "aboutMe": "Quiet professional couple looking for long-term rent."
}
```

### `GET /me/profile-completion`

Выход:

```json
{
  "percent": 72,
  "isReady": false,
  "missing": [
    "income_proof",
    "schufa",
    "cover_letter"
  ]
}
```

## Documents

### `GET /me/documents`

### `POST /me/documents`

Можно сделать через Supabase Storage signed upload flow.

### `PATCH /me/documents/:id`

Например, переименование или замена metadata.

### `DELETE /me/documents/:id`

## Properties / Search

### `GET /properties`

Query params:

- `city`
- `district`
- `priceMin`
- `priceMax`
- `roomsMin`
- `roomsMax`
- `propertyType`
- `furnished`
- `petsAllowed`
- `moveInDate`
- `bounds`
- `page`
- `limit`

Пример ответа:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Modern 3-room apartment",
      "priceAmount": 1650,
      "rooms": 3,
      "areaSqm": 84,
      "district": "Winterhude",
      "lat": 53.59,
      "lng": 10.00,
      "primaryImageUrl": "https://...",
      "isFavorite": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 240
}
```

### `GET /properties/map`

Оптимизированный ответ для карты:

```json
{
  "items": [
    {
      "id": "uuid",
      "lat": 53.59,
      "lng": 10.00,
      "priceAmount": 1650,
      "rooms": 3,
      "district": "Winterhude"
    }
  ]
}
```

### `GET /properties/:id`

Полная карточка объекта.

## Favorites

### `GET /me/favorites`

### `POST /me/favorites`

```json
{
  "propertyId": "uuid"
}
```

### `DELETE /me/favorites/:propertyId`

## Saved Searches

### `GET /me/saved-searches`

### `POST /me/saved-searches`

```json
{
  "name": "Hamburg up to 1800",
  "filters": {
    "city": "Hamburg",
    "districts": ["Winterhude", "Eppendorf"],
    "priceMax": 1800,
    "roomsMin": 3
  },
  "notificationsEnabled": true
}
```

### `PATCH /me/saved-searches/:id`

### `DELETE /me/saved-searches/:id`

## Applications

### `GET /me/applications`

Возвращает список заявок пользователя.

### `GET /me/applications/:id`

Возвращает:

- саму заявку;
- объект;
- timeline;
- checklist профиля/документов.

### `POST /applications`

Создание заявки.

```json
{
  "propertyId": "uuid",
  "coverMessage": "We are interested in this apartment and can move in from September."
}
```

Сервер должен:

- проверить auth;
- проверить tenant profile;
- проверить документы;
- создать `draft` или `ready_to_submit`.

### `POST /applications/:id/submit`

Переводит заявку в `submitted`, если все требования выполнены.

Ответ:

```json
{
  "applicationId": "uuid",
  "status": "submitted",
  "submittedAt": "2026-07-05T12:00:00Z"
}
```

### `POST /applications/:id/withdraw`

## Notifications

### `GET /me/notifications`

### `POST /me/notifications/:id/read`

## Dashboard

### `GET /me/dashboard`

Ответ:

```json
{
  "profileCompletionPercent": 72,
  "activeApplicationsCount": 3,
  "favoritesCount": 12,
  "savedSearchesCount": 2,
  "needsAttention": [
    {
      "type": "missing_document",
      "label": "Upload SCHUFA"
    }
  ],
  "recentApplications": [
    {
      "id": "uuid",
      "status": "submitted",
      "propertyTitle": "3-room apartment in Winterhude"
    }
  ]
}
```

## Поиск на карте

Для карты есть два варианта:

### Вариант A. Простой MVP

- обычный map provider;
- фронтенд шлет bounds;
- backend отдает все точки в пределах bounds.

### Вариант B. Следующий этап

- кластеризация;
- heatmap;
- подсчёт количества объектов в области.

Для MVP хватит варианта A.

## Что лучше реализовать через Supabase сразу

- auth;
- profiles;
- tenant_profiles;
- documents metadata;
- favorites;
- saved_searches;
- applications;
- application_events;
- notifications;
- storage для документов.

## Что можно пока не делать

- real-time chat;
- сложный match scoring;
- агентские кабинеты;
- публичный marketplace для лендлордов;
- автоматическую отправку заявок во внешние площадки от имени клиента.

## Практическая рекомендация по старту

Если делать быстро и разумно, я бы начал так:

1. Таблицы:
   - `profiles`
   - `tenant_profiles`
   - `tenant_documents`
   - `properties`
   - `property_locations`
   - `favorites`
   - `saved_searches`
   - `applications`
   - `application_events`
   - `notifications`
2. RLS.
3. `SearchPage` как реальный поиск.
4. `AccountPage` как container для dashboard/profile/applications.
5. Apply flow.

## Короткий итог

Для `bookimmo` MVP-схема должна строиться вокруг трех осей:

- `tenant profile`
- `property discovery`
- `application lifecycle`

Если эти три сущности и их API сделаны хорошо, дальше продукт будет масштабироваться намного легче.
