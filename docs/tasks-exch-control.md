Implementation Tasks for Exchange Control & Price Feed System
1. Price Module
1.1 Create a PriceModule class/service that:
Fetches prices for all configured trading pairs at a set interval.
Caches the latest price for each pair.
Emits price updates to subscribers (using EventEmitter or pub/sub).
Provides a method to get the latest price for any pair.
1.2 Add configuration for which pairs to fetch and the fetch interval.
2. Database Schema
2.1 Design and implement a positions table with the following fields:
id (primary key)
strategy_id
symbol
side
open_time
close_time
open_price
close_price
quantity
status (open/closed)
pnl
3. PaperExchange Module
3.1 Create a PaperExchange class that:
Implements the same interface as the real exchange class.
On placeOrder, simulates a fill using the latest price from the Price Module and stores the position in the database.
On closePosition, updates the position in the database and calculates PNL using the latest price.
On getPositions, fetches open positions from the database.
On getKPIs, calculates and returns KPIs from the database.
4. Exchange Control Module
4.1 Create an ExchangeControl class/service that:
Maintains a registry of exchange objects per strategy/type.
Instantiates a real exchange object if API keys are present, or a PaperExchange if not.
Routes all trade and position requests through the correct exchange object.
Listens for price updates and updates positions/KPIs as needed.
Exposes methods to get KPIs and positions for any strategy/type.
5. Strategy Manager
5.1 Create a StrategyManager class/service that:
Manages all active strategies and their types.
Subscribes to price updates for strategies that require them (e.g., AIBot).
Forwards price data to strategies as needed.
Handles signals from strategies that do not require price data (e.g., TradingView).
6. Frontend API
6.1 Implement REST or WebSocket endpoints to:
Fetch current KPIs and positions per strategy/type.
Receive real-time price updates.
7. Integration & Testing
7.1 Ensure that strategies with API keys use the real exchange and those without use PaperExchange.
7.2 Test that price updates are distributed to all relevant consumers.
7.3 Test that simulated trades are correctly stored and updated in the database.
7.4 Test that the frontend receives accurate and timely KPI, position, and price data.
8. Documentation
8.1 Document the interfaces for each module (PriceModule, ExchangeControl, PaperExchange, StrategyManager).
8.2 Document the API endpoints for the frontend.
8.3 Provide setup instructions for configuring pairs, intervals, and strategy API keys.