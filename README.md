# ALPOOL Admin

Внутренняя SPA-панель ALPOOL для работы с заявками и их вложениями. Проект является только frontend-приложением и использует существующий backend API.

## Стек

- React 18 + TypeScript
- Vite
- React Router
- Vitest + Testing Library

## Запуск

Требуется Node.js 18+.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Адрес API задаётся переменной `VITE_API_BASE_URL`. В `.env.example` указан production API:

```text
VITE_API_BASE_URL=https://api.alpool.ru
```

Для локального backend можно указать, например, `http://127.0.0.1:8000`. Реальные credentials, JWT и другие секреты не должны попадать в исходники или `.env.example`.

## Команды

```powershell
npm test          # все frontend-тесты с моками API
npm run typecheck # TypeScript без генерации файлов
npm run build     # typecheck + production build
```

## Структура

```text
src/
  api/       API client и функции запросов
  auth/      sessionStorage и auth context
  components/ UI-состояния и status badge
  layouts/   административный layout
  pages/     login, список и карточка заявки
  types/     типы API и единый список статусов
  utils/     ошибки, даты, размеры и download helpers
  test/      тесты и test setup
```

## Маршруты

- `/login` — вход администратора;
- `/leads` — список заявок;
- `/leads/:id` — данные заявки, статус и вложения.

Корень перенаправляет авторизованного пользователя в `/leads`, остальных — в `/login`. Неизвестные маршруты показывают 404.

## Авторизация

После `POST /api/auth/login` access token хранится только в `sessionStorage`: он переживает перезагрузку текущей вкладки и удаляется при закрытии вкладки или logout. Пароль не сохраняется. API client добавляет Bearer token к защищённым запросам и при `401` очищает сессию и возвращает пользователя на `/login`.

Это компромисс для внутренней SPA: Bearer JWT нельзя сделать HttpOnly cookie на стороне frontend, поэтому токен остаётся доступен JavaScript. Клиентская защита маршрутов не заменяет backend authorization.

## Что входит в v1

- вход и выход;
- список заявок;
- карточка заявки с UTM и контактными ссылками;
- смена статуса через существующий API;
- просмотр metadata и авторизованное скачивание вложений как Blob;
- loading, empty, error и disabled states;
- desktop и mobile layout.

Upload и удаление вложений, pagination, фильтрация, роли, аналитика, статьи, Telegram и другие разделы в v1 не входят.

## Production

Планируемый адрес панели: `https://admin.alpool.ru`. Deployment не выполняется этим проектом. Перед публикацией backend должен разрешить `https://admin.alpool.ru` в CORS; также нужно проверить production environment, HTTPS и реальные server-side credentials. Commit, push и deploy выполняются отдельно.
