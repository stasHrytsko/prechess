# Decisions

Record architecture decisions here as the project grows.

---

## ADR-001 — Модель данных и RPC-контракт (фаза 1)

**Статус:** принято. **Дата:** 2026-06-23.

Server-authoritative модель: баланс и ставки меняются только на сервере
(RPC `SECURITY DEFINER` + RLS), фронт не может писать баланс напрямую.
Воркер пишет игровые данные сервис-ролью (минуя RLS).

### Таблицы

| Таблица | Назначение | Кто пишет |
|---|---|---|
| `profiles` | юзер + баланс очков (1:1 с `auth.users`) | триггер при регистрации, RPC |
| `games` | шахматные партии (источник: Lichess) | worker (service role) |
| `prob_ticks` | тики win-probability во времени | worker (service role) |
| `markets` | рынок на партию (фаза 1: только `winner`) | worker (service role) |
| `bets` | ставки пользователей | только RPC `place_bet` |
| `ledger` | аудит всех движений баланса | триггер/RPC |

### Ценообразование (модель Polymarket, в синхроне с web)
- Цена доли в центах: `price_cents = clamp(round(prob_side * 100), 1, 99)`.
- Куплено долей: `shares = stake / price_cents`.
- Выплата при выигрыше: `payout = round(shares * 100)` (доля гасится по 100 очков).
- Маржи дома нет (биржевая модель).

### RPC-контракт
- `place_bet(p_market_id uuid, p_side text, p_stake int) returns bets`
  — `authenticated`. Атомарно: проверяет открытость рынка, берёт последний
  `prob_tick`, считает цену/доли/выплату, проверяет и списывает баланс,
  создаёт `bet` + запись в `ledger`. Бросает ошибку при закрытом рынке или
  нехватке очков.
- `resolve_market(p_market_id uuid, p_result text) returns void`
  — `service_role`. Закрывает рынок и партию, начисляет выплаты победившим,
  фиксирует `pnl`. `p_result = 'draw'` → возврат ставок (refund).

### RLS (кратко)
- `profiles`, `games`, `markets`, `prob_ticks` — публичное чтение; запись только
  сервером (триггер/сервис-роль). Прямой `update` баланса клиентом запрещён.
- `bets`, `ledger` — пользователь видит только свои строки; запись только через RPC.

### Realtime
Включены в публикацию `supabase_realtime`: `prob_ticks`, `markets`, `bets`
(для живой линии и обновления позиций на фронте — шаг 4 роадмапа).

### Открытые вопросы / на потом
- Шаблонные пропы и parimutuel — фаза 2 (см. `mvp 2.0/decision.md`).
- Кэш-аут позиции до резолва (сейчас в моках есть mark-to-market, в БД — нет).
- Anti-cheat / лимиты на ставки — не в фазе 1.
