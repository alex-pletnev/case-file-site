# 10 — Конфигурация и деплой

## 1. Стек

| Компонент | Технология | Файл |
|-----------|-----------|------|
| Разметка | HTML5 | `index.html` |
| Стили | CSS3 (no preprocessor) | `css/style.css` |
| Логика | Vanilla JS (ES6+) | `js/main.js` |
| Контент | JSON | `content.json` |
| Фото | WebP + JPEG fallback, манифест | `photos/photos.json` |
| Аудио | MP3/OGG | `audio/` |
| Шрифты | Google Fonts (PT Mono, PT Sans, Bebas Neue, Caveat) | `index.html:10-14` |

Никаких npm, webpack, babel, node_modules — чистая статика.

## 2. Деплой — GitHub Pages

| Шаг | Команда | Примечание |
|-----|---------|-----------|
| Добавить remote | `git remote add origin https://github.com/<user>/<repo>.git` | Один раз |
| Публичный push | `git push -u origin main` | Первый push |
| Последующие пуши | `git push` | Авто-деплой |

Настройки GitHub Pages: Settings → Pages → Source: `Deploy from branch: main / (root)`.

URL сайта: `https://<user>.github.io/<repo>/`

**Важно:** все пути в коде — относительные (`./css/style.css`, `./photos/photos.json`), иначе GitHub Pages сломает ссылки.

## 3. Локальный запуск

Открыть `index.html` напрямую в браузере (`file://`) — должно работать без HTTP-сервера.

Для проверки с HTTP (рекомендуется перед деплоем):
```bash
python3 -m http.server 8000
# открыть http://localhost:8000
```

## 4. Вспомогательные скрипты

| Скрипт | Назначение | Запуск |
|--------|-----------|--------|
| `process_photos.py` | Конвертация фото → WebP, нарезка thumb/full | `python3 process_photos.py` |
| `generate_manifest.py` | Генерация `photos/photos.json` из папки | `python3 generate_manifest.py` |
| `process_media.sh` | Bash-обёртка для медиа-обработки | `bash process_media.sh` |
| `process_remaining.sh` | Обработка оставшихся фото | `bash process_remaining.sh` |

Зависимости скриптов: Python 3, Pillow (`pip install Pillow`).

## 5. Структура папки photos/

```
photos/
  photos.json          # манифест — источник правды
  source/              # оригиналы (не коммитить если большие)
  full/                # WebP в полный размер
  thumb/               # WebP-превью 400px
  events/              # фото по событиям
  inbox/               # необработанные входящие
  04-chelyabinsk/      # фото из Челябинска
```

## 6. Lighthouse audit

Запустить после финальной сборки контента:

```bash
# В Chrome DevTools → Lighthouse → Mobile → Generate report
# ИЛИ через CLI:
npx lighthouse https://<user>.github.io/<repo>/ --preset=mobile
```

Целевые пороги: Performance ≥ 85, Accessibility ≥ 90.

## 7. Что НЕ делать

- Не добавлять серверный код, API-ключи, бэкенд.
- Не хотлинковать фото с Instagram или других сервисов.
- Не подключать аналитику (GA, Metrica, pixel).
- Не хардкодить личные тексты вне `content.json` и `photos/photos.json`.
