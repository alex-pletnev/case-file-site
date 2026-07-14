---
id: T-002
title: Lighthouse audit — Performance ≥ 85, Accessibility ≥ 90
status: pending
priority: medium
created: 2026-07-14
updated: 2026-07-14
related_code:
  - index.html
  - css/style.css
  - js/main.js
  - photos/
related_docs:
  - docs/04-tech-hosting.md
  - docs/10-configuration.md
  - docs/11-known-gaps.md
tags: [feature]
---

## Контекст

Definition of Done проекта требует Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90. Аудит не проводился. Нужно запустить после финальной загрузки контента и устранить проблемы.

## Acceptance criteria

- [ ] Lighthouse mobile Performance ≥ 85 подтверждён скриншотом
- [ ] Lighthouse mobile Accessibility ≥ 90 подтверждён скриншотом
- [ ] Все фото обработаны: WebP-версии в `photos/thumb/` и `photos/full/`
- [ ] Lazy loading подключён для фото-секций
- [ ] Первый экран открывается без блокирующих ресурсов

## План

1. Убедиться что все фото обработаны (thumb 400px, full WebP)
2. Запустить Lighthouse mobile (Chrome DevTools или `npx lighthouse`)
3. Найти и устранить узкие места
4. Повторить аудит до достижения порогов

## Лог

- 2026-07-14: заведена автоматически при setup-agent-harness.
