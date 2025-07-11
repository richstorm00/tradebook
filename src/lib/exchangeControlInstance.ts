import { ExchangeControl, StrategyConfig } from '../exchange/ExchangeControl';
import { PriceModule } from '../exchange/PriceModule';
import { BlofinPriceWebSocket } from '../exchange/BlofinPriceWebSocket';

// Example static strategies (you may want to load these from DB in production)
const strategies: StrategyConfig[] = [
  { id: '1', type: 'AIBot', name: 'AI Bot 1' },
  { id: '2', type: 'TradingView', name: 'TV Strat 1' },
];

// PriceModule config
const priceModule = new PriceModule({ fetchIntervalMs: 10000 });
priceModule.start();

// Start Blofin WebSocket price feed for BTCUSDT and SOLUSDT
const blofinSymbols = ['BTCUSDT', 'SOLUSDT'];
export const blofinPriceWebSocket = new BlofinPriceWebSocket(blofinSymbols);
blofinPriceWebSocket.start();

export const exchangeControl = new ExchangeControl(strategies, priceModule);
export { priceModule }; 