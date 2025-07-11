# Exchange & Strategy Modules Documentation

## Exchange (Abstract Class)
Defines the contract for all exchange implementations (real or paper).

**Main Methods:**
- `placeOrder({ strategyId, symbol, side, quantity })` — Place a new order and open a position.
- `closePosition({ positionId })` — Close an open position by ID.
- `getPositions({ strategyId, status? })` — Get all positions for a strategy (optionally filtered by status).
- `getKPIs({ strategyId })` — Get KPIs for a strategy (PNL, win rate %, trades, max drawdown %).

---

## PriceModule
Fetches and caches real-time prices for all available futures pairs from the Blofin API. Publishes price updates via EventEmitter.

**Main Methods:**
- `start()` — Begin polling for pairs and prices.
- `stop()` — Stop polling.
- `getPrice(symbol)` — Get the latest price for a symbol.
- `onPrice(listener)` — Subscribe to price updates.

**Usage:**
- Used by both PaperExchange and ExchangeControl for price data.

---

## PaperExchange
Implements the Exchange interface for simulated (paper) trading. Stores positions and KPIs in the database using Prisma.

**Main Methods:**
- `placeOrder(...)` — Simulate a fill using the latest price from PriceModule and store the position.
- `closePosition(...)` — Update the position and calculate PNL using the latest price.
- `getPositions(...)` — Fetch open/closed positions from the database.
- `getKPIs(...)` — Calculate and return KPIs from the database.

**Usage:**
- Used for strategies without API keys.

---

## BlofinExchange
Implements the Exchange interface for real trading on Blofin. (Currently a scaffold; methods throw Not Implemented.)

**Main Methods:**
- `placeOrder(...)` — (To be implemented) Place a real order via Blofin API.
- `closePosition(...)` — (To be implemented) Close a real position via Blofin API.
- `getPositions(...)` — (To be implemented) Fetch positions from Blofin.
- `getKPIs(...)` — (To be implemented) Calculate KPIs from Blofin data.

**Usage:**
- Used for strategies with API keys.

---

## ExchangeControl
Central manager for all exchange objects per strategy. Routes trade and position requests, and exposes unified methods for KPIs and positions.

**Main Methods:**
- `placeOrder({ strategyId, ... })` — Route order to the correct exchange.
- `closePosition({ strategyId, positionId })` — Route close to the correct exchange.
- `getPositions({ strategyId, status? })` — Get positions for a strategy.
- `getKPIs({ strategyId })` — Get KPIs for a strategy.
- `getStrategies()` — Get all configured strategies.

**Usage:**
- Used by API endpoints and higher-level modules.

---

## StrategyManager
Manages all active strategies and their types. Subscribes to price updates for strategies that require them (e.g., AIBot).

**Main Methods:**
- `getStrategies()` — Get all strategies.
- `getStrategyTypes()` — Get all unique strategy types.

**Usage:**
- Used for managing and forwarding price data to strategies. 