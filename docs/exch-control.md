Product Requirements Document (PRD): Exchange Control & Price Feed System
Overview
This feature introduces a modular backend system to manage multiple trading strategies (live and simulated/paper) across various strategy types. It centralizes price data, manages positions and KPIs, and supports both real and simulated trading, enabling efficient data flow to strategies and the frontend.
Goals
Efficiently fetch and distribute price data to strategies and the frontend.
Support multiple strategies and strategy types, each with their own exchange credentials (or none).
Allow strategies without API keys to simulate trading (paper trading), storing positions in the database.
Centralize KPI and position tracking for all strategies.
Provide a unified API for the frontend to access KPIs, positions, and price data.
Features & Requirements
1. Price Module
Fetches and caches price data for all relevant trading pairs at a configurable interval.
Publishes price updates to interested consumers (strategies, exchange control, frontend).
Provides a method to get the latest price for any pair.
Should be implemented as a singleton or service class.
Uses event-driven or pub/sub pattern for internal communication.
2. Exchange Control Module
Sits between the frontend, strategies, and the exchange(s).
Maintains a registry of exchange objects per strategy/strategy type:
Live Mode: Uses real exchange object with API keys.
Paper Mode: Uses a PaperExchange object if no API keys are present.
Aggregates and exposes KPIs and position data for each strategy/type.
Handles trade requests from strategies:
Forwards to real exchange if API keys are present.
Simulates and stores in DB if not.
Listens for price updates and updates positions/KPIs accordingly.
Exposes API endpoints for the frontend to fetch KPIs, positions, and price data.
3. PaperExchange Module
Implements the same interface as the real exchange class.
On trade actions (open/close), simulates fills using the latest price from the Price Module.
Stores and updates positions in the database.
Provides methods to fetch simulated positions and KPIs.
4. Strategy Manager
Manages all active strategies and their types.
Subscribes to price updates for strategies that require them (e.g., AIBot).
Forwards price data to strategies as needed.
Handles signals from strategies that do not require price data (e.g., TradingView).
5. Database Schema
positions table:
id
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
6. Frontend API
REST or WebSocket endpoints to:
Fetch current KPIs and positions per strategy/type.
Receive real-time price updates.
User Stories
As a strategy developer, I want my strategy to receive up-to-date price data so I can make trading decisions.
As a user, I want to see accurate KPIs and position data for each strategy on the frontend.
As an admin, I want to support both live and paper trading for strategies, with seamless switching based on API key presence.
As a system, I want to fetch prices once per pair and distribute them efficiently to all consumers.
Acceptance Criteria
[ ] Price Module fetches and caches prices for all configured pairs at a set interval.
[ ] Price updates are distributed to all subscribed modules (strategies, exchange control, frontend).
[ ] Exchange Control Module manages a separate exchange object per strategy/type, using PaperExchange if no API keys are present.
[ ] PaperExchange simulates trades and stores positions in the database.
[ ] KPIs and positions are available via API for all strategies, regardless of live or paper mode.
[ ] Frontend receives real-time price and position/KPI updates.
[ ] Database schema for positions is implemented and used by PaperExchange.
Technical Notes
Use Node.js EventEmitter or a pub/sub library for internal communication.
Use an in-memory cache (e.g., Map) for fast access to latest prices.
Use dependency injection for managing exchange objects per strategy/type.
Use REST or WebSocket for frontend communication.
Out of Scope
Advanced simulation features (slippage, latency, etc.) for paper trading (can be added later).
Multi-exchange support (focus on BloFin for now).
Deliverables
Price Module implementation.
Exchange Control Module with live/paper mode support.
PaperExchange class.
Database schema for simulated positions.
API endpoints for KPIs, positions, and price data.
Documentation for module interfaces and usage.