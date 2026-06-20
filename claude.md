# Claude.md

Этот файл - живая рабочая память проекта. Обновляй его каждый раз, когда меняется цель, архитектура, границы MVP, данные или структура репозитория.

## 1. Что строим

Chess Prediction MVP на виртуальных очках.

Цель фазы 1: проверить, держит ли пользователя связка "живая линия win-probability + ставка + резолв". В этой фазе нет реальных денег, KYC/AML, лицензии, Dota и AMM.

## 2. Текущая иерархия проекта

```text
prediction-chess/
├── claude.md
├── draft.md
├── TD prechess
├── docs/
│   ├── product/
│   │   ├── vision.md
│   │   ├── scope.md
│   │   └── acceptance-criteria.md
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   └── decisions.md
│   └── legal/
│       ├── regulatory-notes.md
│       └── risk-register.md
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── board/
│   │   │   │   ├── market-line/
│   │   │   │   ├── bet-panel/
│   │   │   │   └── leaderboard/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── markets/
│   │   │   │   ├── bets/
│   │   │   │   └── points/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── public/
│   └── worker/
│       ├── src/
│       │   ├── ingest/
│       │   ├── stockfish/
│       │   ├── markets/
│       │   ├── resolvers/
│       │   └── lib/
│       └── bin/
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── chess/
│   │   │   ├── math/
│   │   │   └── validators/
│   │   └── package.json
│   └── config/
│       ├── eslint/
│       ├── tsconfig/
│       └── prettier/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed/
├── scripts/
│   ├── dev/
│   ├── test/
│   └── maintenance/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## 3. Правила роста структуры

1. Сначала меняем документацию и договоренности, потом код.
2. Не добавляем вторую игру, реальную монетизацию или AMM, пока Chess MVP не доказал retention.
3. Любая новая папка должна принадлежать одному из трех слоев: web, worker, shared.
4. Если появляется новый домен, сначала заводим его в `docs/architecture/decisions.md`.
5. Если меняется правило рынка, резолва, баланса или античита, обновляется этот файл и связанные документы.

## 4. Короткая карта модулей

- `apps/web` - клиент, доска, линия, ставки, баланс, лидерборд.
- `apps/worker` - Lichess ingest, Stockfish, расчет вероятностей, резолв рынков.
- `packages/shared` - общие типы, шахматная логика, математические преобразования, валидация.
- `supabase` - схема данных, RLS, RPC, realtime.
- `docs` - продукт, архитектура, допущения, юридические риски.

## 5. Что нужно держать актуальным

- Точный scope MVP.
- Источник оракула и его ограничения.
- Схема данных и RPC-контракты.
- Frontend-флоу первой ставки и резолва.
- Решения, которые нельзя менять задним числом без заметки в `docs/architecture/decisions.md`.

## 6. Следующее обновление

После появления реального кода сюда нужно добавить:

- фактический tree проекта;
- стек и версии зависимостей;
- команды запуска и тестирования;
- известные ограничения и технические долги;
- список завершенных решений по архитектуре.