# API Endpoints Documentation

## Get KPIs for a Strategy
- **Method:** GET
- **Path:** `/api/strategies/[id]/kpi`
- **Description:** Returns KPIs (PNL, win rate %, trades, max drawdown %) for the given strategy.
- **Parameters:**
  - `id` (path): Strategy ID
- **Example Response:**
```json
{
  "pnl": 100.5,
  "winRate": 60.0,
  "trades": 10,
  "maxDrawdown": 12.5
}
```

---

## Get Positions for a Strategy
- **Method:** GET
- **Path:** `/api/strategies/[id]/positions`
- **Description:** Returns all positions for the given strategy.
- **Parameters:**
  - `id` (path): Strategy ID
- **Example Response:**
```json
[
  {
    "id": "1",
    "strategyId": "1",
    "symbol": "BTCUSDT",
    "side": "buy",
    "openTime": "2024-07-11T10:00:00.000Z",
    "closeTime": "2024-07-11T11:00:00.000Z",
    "openPrice": 100,
    "closePrice": 105,
    "quantity": 1,
    "status": "closed",
    "pnl": 5
  }
]
```

---

## Get Latest Price for a Strategy (Mocked Symbol)
- **Method:** GET
- **Path:** `/api/strategies/[id]/price`
- **Description:** Returns the latest price for the main symbol (currently mocked as BTCUSDT).
- **Parameters:**
  - `id` (path): Strategy ID
- **Example Response:**
```json
{
  "symbol": "BTCUSDT",
  "price": 100.0,
  "timestamp": 1720700000000
}
``` 