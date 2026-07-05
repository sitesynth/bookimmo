# Bookimmo Cabinet Implementation Map

## Зачем этот документ

Ниже прикладная карта текущего фронтенда `bookimmo`:

- что уже можно использовать для кабинета клиентов;
- что является только Framer-макетом;
- что нужно переписать;
- какие новые файлы и блоки логично добавить;
- в каком порядке внедрять кабинет без хаотичной переделки проекта.

Это мост между текущей кодовой базой и MVP кабинета.

## Главный вывод

Кабинет уже не нужно "изобретать".

В проекте есть готовый skeleton:

- `dashboard-home`
- `search`
- `bookmark`
- `account`
- auth pages
- боковая навигация

Но пока это в основном визуальный слой из Framer. Значит, задача не в том, чтобы сделать новый UI с нуля, а в том, чтобы постепенно заменить статические/демо-блоки на рабочие продуктовые модули.

## Что уже есть в проекте

## Роуты

Текущие основные страницы:

- [DashboardHomePage.jsx](/Users/miguelaprossine/bookimmo/src/pages/DashboardHomePage.jsx)
- [SearchPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/SearchPage.jsx)
- [BookmarkPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/BookmarkPage.jsx)
- [AccountPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/AccountPage.jsx)
- [LogInPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/LogInPage.jsx)
- [SignUpPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/SignUpPage.jsx)
- [ForgotPasswordPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/ForgotPasswordPage.jsx)
- [UpdatePasswordPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/UpdatePasswordPage.jsx)

## Основные текущие UI-блоки

- [DashboardHomeMain.jsx](/Users/miguelaprossine/bookimmo/src/components/DashboardHomeMain.jsx)
- [SearchMain.jsx](/Users/miguelaprossine/bookimmo/src/components/SearchMain.jsx)
- [BookmarkMain.jsx](/Users/miguelaprossine/bookimmo/src/components/BookmarkMain.jsx)
- [AccountMain.jsx](/Users/miguelaprossine/bookimmo/src/components/AccountMain.jsx)
- [AccountSsrHiddenRzt52a.jsx](/Users/miguelaprossine/bookimmo/src/components/AccountSsrHiddenRzt52a.jsx)
- [SupabaseAuthForm.jsx](/Users/miguelaprossine/bookimmo/src/components/SupabaseAuthForm.jsx)
- [AuthGateModal.jsx](/Users/miguelaprossine/bookimmo/src/components/AuthGateModal.jsx)

## Оценка по текущим файлам

## 1. `SearchPage` / `SearchMain`

Файлы:

- [SearchPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/SearchPage.jsx)
- [SearchMain.jsx](/Users/miguelaprossine/bookimmo/src/components/SearchMain.jsx)
- [useDirectusSearch.js](/Users/miguelaprossine/bookimmo/src/hooks/useDirectusSearch.js)

Статус:

- это лучший текущий фундамент для MVP;
- здесь уже есть живая логика фильтров и загрузки объектов;
- UI still mixed: часть фильтров рабочая, часть осталась из Framer-концепта.

Что оставить:

- сам роут `/search`;
- идея двухколоночного экрана;
- карточки объектов как отправную точку;
- hook поиска как временный data source;
- связь с property detail page.

Что заменить:

- демо-категории и неактуальные фильтры;
- захардкоженные англоязычные значения типа `Germany`, `France`, `Sales`, `Lease`;
- текущую bookmark-кнопку, которая ведет на `sign-up`;
- сетку без карты;
- часть Framer-обвязки, которая усложняет поддержку.

Что добавить:

- реальную карту;
- сохранение поиска;
- избранное;
- реальный apply CTA;
- синхронизацию фильтров с URL;
- пустые состояния для authenticated user;
- загрузку `isFavorite`, `applicationStatus`, `fitScore` позже.

Вывод:

`SearchMain` не выкидываем, а эволюционируем.

## 2. `AccountPage` / `AccountMain`

Файлы:

- [AccountPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/AccountPage.jsx)
- [AccountMain.jsx](/Users/miguelaprossine/bookimmo/src/components/AccountMain.jsx)

Статус:

- сейчас это почти заглушка для состояния "не залогинен";
- продуктовой логики кабинета здесь пока нет.

Что оставить:

- сам роут `/account`;
- назначение страницы как входной точки кабинета;
- общую визуальную иерархию;
- идею использования боковой навигации рядом.

Что переписать полностью:

- основной контент `AccountMain.jsx`.

Во что превратить:

- в container/entry для кабинета;
- в layout со вкладками:
  - Dashboard
  - Profile
  - Applications
  - Favorites
  - Saved Searches
  - Documents

Вывод:

`AccountMain.jsx` лучше не чинить точечно, а заменить на новый кабинетный shell.

## 3. `DashboardHomePage` / `DashboardHomeMain`

Файлы:

- [DashboardHomePage.jsx](/Users/miguelaprossine/bookimmo/src/pages/DashboardHomePage.jsx)
- [DashboardHomeMain.jsx](/Users/miguelaprossine/bookimmo/src/components/DashboardHomeMain.jsx)

Статус:

- визуальный прообраз dashboard уже есть;
- контент внутри mostly static/demo.

Что оставить:

- сам роут `/dashboard-home`;
- роль страницы как dashboard;
- CTA `Search properties`;
- место для быстрых action cards.

Что заменить:

- все demo featured cards;
- статику “Hi 👋”;
- фейковые списки;
- фрагменты, которые сейчас повторяют маркетинговый UI.

Во что превратить:

- настоящий user dashboard:
  - profile completion;
  - active applications;
  - saved searches;
  - recent viewed/favorited properties;
  - alerts and missing documents.

Вывод:

`DashboardHomeMain.jsx` стоит переписать, но сохранить как отдельный dashboard route.

## 4. `BookmarkPage` / `BookmarkMain`

Файлы:

- [BookmarkPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/BookmarkPage.jsx)
- [BookmarkMain.jsx](/Users/miguelaprossine/bookimmo/src/components/BookmarkMain.jsx)

Статус:

- это хороший placeholder для будущих favorites;
- сейчас внутри только empty-state макет.

Что оставить:

- роут `/Bookmark` как временный favorites route;
- пустое состояние;
- базовую идею страницы “сохранённые объекты”.

Что изменить:

- лучше позже переименовать route в lower-case `/bookmarks` или `/favorites`;
- вывести реальные favorite cards;
- добавить remove/save/apply actions.

Вывод:

Это не мусор. Это готовая точка входа для блока Favorites.

## 5. Auth pages

Файлы:

- [SupabaseAuthForm.jsx](/Users/miguelaprossine/bookimmo/src/components/SupabaseAuthForm.jsx)
- [LogInPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/LogInPage.jsx)
- [SignUpPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/SignUpPage.jsx)
- [ForgotPasswordPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/ForgotPasswordPage.jsx)
- [UpdatePasswordPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/UpdatePasswordPage.jsx)

Статус:

- это уже полезный рабочий слой;
- auth базово интегрирован с Supabase.

Что оставить:

- все auth routes;
- `SupabaseAuthForm`;
- reset/update password flow.

Что улучшить:

- redirect после логина не на `/`, а в кабинет;
- onboarding после sign-up;
- нормальный auth context;
- state “logged in / logged out / loading user”.

Вывод:

Auth не нужно переписывать с нуля. Его нужно встроить в новый кабинетный shell.

## 6. `AuthGateModal`

Файл:

- [AuthGateModal.jsx](/Users/miguelaprossine/bookimmo/src/components/AuthGateModal.jsx)

Статус:

- полезный transitional компонент;
- сейчас приглашает `Sign up / Sign in / Continue as guest`.

Что оставить:

- сам паттерн gated action;
- использование на property cards или apply actions.

Что изменить:

- текст и сценарий под клиентский кабинет;
- открывать его не только на home cards, но и на `favorite`, `apply`, `save search`;
- интегрировать с настоящей auth-проверкой.

## 7. Боковая навигация

Файлы:

- [AccountSsrHiddenRzt52a.jsx](/Users/miguelaprossine/bookimmo/src/components/AccountSsrHiddenRzt52a.jsx)
- [DashboardHomeSsrHidden1nymtbs.jsx](/Users/miguelaprossine/bookimmo/src/components/DashboardHomeSsrHidden1nymtbs.jsx)
- related SSR hidden nav components

Статус:

- это самый ценный существующий UI skeleton;
- структура sidebar уже соответствует кабинету.

Проблема:

- сейчас это Framer-export с жёсткими ссылками и дублированием.

Что делать:

- не развивать эти компоненты дальше;
- вынести из них визуальную идею;
- заменить на один новый reusable React-компонент sidebar.

Новый целевой компонент:

- `src/components/cabinet/CabinetSidebar.jsx`

Меню MVP:

- Dashboard
- Search
- Favorites
- Applications
- Profile
- Documents

## Что сохраняем, а что переписываем

## Сохраняем как основу

- [SearchPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/SearchPage.jsx)
- [SearchMain.jsx](/Users/miguelaprossine/bookimmo/src/components/SearchMain.jsx) как стартовую точку
- [BookmarkPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/BookmarkPage.jsx)
- [DashboardHomePage.jsx](/Users/miguelaprossine/bookimmo/src/pages/DashboardHomePage.jsx)
- auth pages
- [SupabaseAuthForm.jsx](/Users/miguelaprossine/bookimmo/src/components/SupabaseAuthForm.jsx)
- [AuthGateModal.jsx](/Users/miguelaprossine/bookimmo/src/components/AuthGateModal.jsx)

## Переписываем целиком

- [AccountMain.jsx](/Users/miguelaprossine/bookimmo/src/components/AccountMain.jsx)
- [DashboardHomeMain.jsx](/Users/miguelaprossine/bookimmo/src/components/DashboardHomeMain.jsx)
- [BookmarkMain.jsx](/Users/miguelaprossine/bookimmo/src/components/BookmarkMain.jsx)
- sidebar Framer nav components

## Частично рефакторим

- [SearchMain.jsx](/Users/miguelaprossine/bookimmo/src/components/SearchMain.jsx)
- [App.jsx](/Users/miguelaprossine/bookimmo/src/App.jsx)
- [src/lib/supabase.js](/Users/miguelaprossine/bookimmo/src/lib/supabase.js)

## Новая целевая структура

Предлагаемая новая структура файлов:

```text
src/
  components/
    cabinet/
      CabinetLayout.jsx
      CabinetSidebar.jsx
      CabinetTopbar.jsx
      ProfileCompletionCard.jsx
      EmptyStateCard.jsx
    dashboard/
      DashboardOverview.jsx
      DashboardStats.jsx
      DashboardAlerts.jsx
    profile/
      ProfileForm.jsx
      ProfilePersonalSection.jsx
      ProfileFinanceSection.jsx
      ProfilePreferencesSection.jsx
      ProfileDocumentsChecklist.jsx
    applications/
      ApplicationsList.jsx
      ApplicationCard.jsx
      ApplicationTimeline.jsx
    favorites/
      FavoritesList.jsx
    search/
      SearchFiltersPanel.jsx
      SearchResultsGrid.jsx
      SearchMapPanel.jsx
      PropertyResultCard.jsx
    documents/
      DocumentsList.jsx
      DocumentUploader.jsx
  hooks/
    useAuthUser.js
    useProfileCompletion.js
    useFavorites.js
    useApplications.js
    useSavedSearches.js
  pages/
    DashboardHomePage.jsx
    SearchPage.jsx
    BookmarkPage.jsx
    AccountPage.jsx
    ApplicationsPage.jsx
    DocumentsPage.jsx
  features/
    cabinet/
      routes.js
      constants.js
```

## Как связать это с текущими страницами

## `DashboardHomePage`

Оставляем route, меняем внутренности:

- сейчас:
  - `DashboardHomeMain`
- целевой вариант:
  - `CabinetLayout`
  - `DashboardOverview`

## `AccountPage`

Оставляем route, меняем роль:

- сейчас:
  - почти пустая account page
- целевой вариант:
  - `CabinetLayout`
  - `ProfileForm`

## `BookmarkPage`

Оставляем route, меняем внутренности:

- сейчас:
  - placeholder bookmarks
- целевой вариант:
  - `CabinetLayout`
  - `FavoritesList`

## `SearchPage`

Оставляем route, постепенно улучшаем:

- сейчас:
  - filters + property list
- целевой вариант:
  - `CabinetLayout`
  - `SearchFiltersPanel`
  - `SearchResultsGrid`
  - `SearchMapPanel`

## Чего пока не хватает в кодовой базе

Нужно добавить:

- auth user state provider;
- profile data hooks;
- favorites hooks;
- applications hooks;
- saved searches hooks;
- documents hooks;
- reusable cabinet layout;
- map integration layer;
- protected route pattern.

## Порядок внедрения

## Этап 1. Основа кабинета

Сделать:

- `CabinetLayout`
- `CabinetSidebar`
- `useAuthUser`
- protected route behavior

Цель:

- получить единый каркас, в который потом встраиваются страницы.

## Этап 2. Dashboard и Profile

Сделать:

- переписать `DashboardHomeMain`
- переписать `AccountMain`
- подключить `profiles` и `tenant_profiles`

Почему сначала это:

- без профиля невозможно нормально строить apply flow.

## Этап 3. Favorites и Search upgrade

Сделать:

- реальные favorites;
- доработать `SearchMain`;
- сохранить фильтры;
- подготовить место под карту.

## Этап 4. Applications

Сделать:

- `ApplicationsPage`
- application list
- application detail / timeline
- apply CTA from search/property pages

## Этап 5. Documents

Сделать:

- upload;
- file list;
- required docs states;
- profile completion integration.

## Практическая рекомендация по первому реальному рефактору

Если идти по делу и без расползания, первым кодовым спринтом я бы делал только это:

1. Новый `CabinetLayout`.
2. Новый `CabinetSidebar`.
3. Новый `useAuthUser`.
4. Замена `AccountMain` на реальный `Profile shell`.
5. Замена `DashboardHomeMain` на реальный `Dashboard shell`.

Это даст:

- визуально уже настоящий кабинет;
- понятную структуру проекта;
- платформу для profile/applications/documents.

## Что не стоит делать сейчас

- не переписывать сразу все Framer-компоненты;
- не смешивать маркетинговые страницы и кабинетные;
- не добавлять карту до появления нормального cabinet layout и фильтровой модели;
- не строить applications до появления user/profile/document state.

## Короткий итог

Текущий `bookimmo` уже содержит заготовку кабинета по роутам и навигации.

Правильный путь:

- сохранить существующие страницы как входные точки;
- заменить их внутренние Framer-демо-компоненты на продуктовые React-модули;
- строить кабинет поверх уже существующего skeleton, а не рядом с ним.
