# плэйн

Платформа для визуального вдохновения и творчества. Креаторы создают мудборды с произвольным расположением изображений, пользователи находят их через поиск.

---

## Стек

| Слой | Технологии |
|------|-----------|
| Бэкенд | Python, FastAPI, SQLAlchemy, PostgreSQL |
| Аутентификация | JWT (HS256), Argon2 |
| Фронтенд | React 19, TypeScript, Vite, SCSS |
| Анимации | Framer Motion, WebGL (OGL) |

---

## Архитектура

### Роли пользователей

**Admin** — управляет заявками на креаторство, может блокировать и удалять аккаунты.

**Creator** — одобренный пользователь с личным кабинетом и редактором мудбордов.

Единая точка входа `/api/creators/login` — проверяет сначала таблицу `admins`, затем `creators`, возвращает JWT с полем `role`.

### Система заявок

```
Заявка (pending) → Одобрение админом → Токен активации (7 дней)
→ Пользователь устанавливает пароль → Аккаунт Creator активирован
```

Ссылка активации генерируется на бэкенде и передаётся вручную — без email-сервиса.

### Редактор мудбордов

Drag-and-drop холст 1200×800px. Каждый элемент хранит `x`, `y`, `width`, `height`, `url`. Layout сериализуется в JSON и сохраняется в поле `layout` таблицы `frames`. При просмотре координаты восстанавливаются точно — пользователь видит расположение как задумал автор.

```json
{
  "items": [
    { "id": "1", "url": "/uploads/photo.jpg", "x": 50, "y": 80, "width": 300, "height": 400 }
  ]
}
```

### Поиск

`GET /api/frames?search=query` — ищет одновременно по названию мудборда, описанию, тегам, имени и юзернейму креатора через `OR` в одном SQL-запросе с `ilike`.

---

## Структура проекта

```
board/
├── client/                  # React + TypeScript
│   └── src/
│       ├── components/      # UI компоненты (каждый в своей папке)
│       ├── pages/           # Страницы по роутам (каждая в своей папке)
│       ├── services/        # api.ts — типизированные запросы
│       └── types.ts         # Общие TypeScript интерфейсы
│
└── server/                  # FastAPI
    └── app/
        ├── api/endpoints/   # admin.py, creators.py, public.py
        ├── models.py        # SQLAlchemy модели
        ├── schemas.py       # Pydantic схемы
        ├── auth.py          # JWT, get_current_admin, get_current_creator
        └── crud.py          # Операции с БД
```

---

## API

### Публичные
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/frames` | Список мудбордов (поиск по `search`, `tag`) |
| GET | `/api/frames/:id` | Мудборд по ID |
| GET | `/api/tags` | Все теги |
| GET | `/api/profiles/:username` | Публичный профиль креатора |
| GET | `/api/profiles/search?q=` | Поиск креаторов |

### Креаторы `/api/creators`
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/login` | Единый вход (admin + creator) |
| POST | `/applications` | Подать заявку на креаторство |
| POST | `/set-password` | Установить пароль по токену активации |
| GET | `/me` | Профиль текущего креатора |
| GET | `/me/frames` | Мои мудборды |
| POST | `/me/frames` | Создать мудборд |
| PUT | `/me/frames/:id` | Обновить мудборд (layout, теги, публикация) |
| DELETE | `/me/frames/:id` | Удалить мудборд |
| POST | `/me/upload` | Загрузить изображение |

### Админ `/api/admin`
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/creators/applications` | Список заявок |
| POST | `/creators/applications/:id/approve` | Одобрить, сгенерировать ссылку активации |
| POST | `/creators/applications/:id/reject` | Отклонить |
| GET | `/creators` | Все аккаунты креаторов |
| DELETE | `/creators/:id` | Удалить аккаунт и все мудборды |
| PATCH | `/creators/:id/toggle` | Заблокировать / разблокировать |

---

## Запуск

### Бэкенд
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Создать .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/moodboard" > .env
echo "SECRET_KEY=your-secret-key" >> .env

# Создать таблицы и первого администратора
python create_tables.py
python create_admin.py

uvicorn app.main:app --reload
```

### Фронтенд
```bash
cd client
npm install
npm run dev
```

### Проверка типов
```bash
cd client
npm run typecheck
```

---

## База данных

```
admins          — аккаунты администраторов
creators        — аккаунты одобренных креаторов
creator_applications — заявки (pending / approved / rejected)
frames          — мудборды (layout хранится как JSON string)
tags            — теги
frame_tag       — связь многие-ко-многим
```

---
