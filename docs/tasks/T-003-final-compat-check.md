---
id: T-003
title: Финальная проверка совместимости — file:// и GitHub Pages
status: pending
priority: medium
created: 2026-07-14
updated: 2026-07-14
related_code:
  - index.html
  - js/main.js
  - css/style.css
  - photos/photos.json
related_docs:
  - docs/04-tech-hosting.md
  - docs/10-configuration.md
  - docs/11-known-gaps.md
tags: [feature]
---

## Контекст

Definition of Done требует работы сайта как с `file://`, так и с GitHub Pages URL. Не тестировалось после реализации. Все пути должны быть относительными.

## Acceptance criteria

- [ ] Сайт полностью работает при открытии `index.html` через `file://` в Chrome/Safari (включая загрузку фото и контента)
- [ ] Сайт работает на GitHub Pages URL (`https://<user>.github.io/<repo>/`)
- [ ] Нет ошибок в консоли браузера (CORS, 404, mixed content)
- [ ] Кнопка «Открыть дело» и все секции отображаются корректно на мобильном (ширина 380px)

## План

1. Проверить все пути в index.html, main.js — должны быть `./путь`, не `/путь`
2. Открыть через `file://` в Chrome и Safari на реальном iPhone или эмуляторе
3. Залить на GitHub Pages и проверить в браузере
4. Устранить найденные проблемы

## Лог

- 2026-07-14: заведена автоматически при setup-agent-harness.
