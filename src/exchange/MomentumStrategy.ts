import { PriceUpdate } from './PriceModule';

export interface MomentumStrategyConfig {
  lookback: number; // Number of price points to look back for momentum
  threshold: number; // Minimum price change to trigger trade
  symbols: string[]; // NEW
}

export type TradeAction = 'BUY' | 'SELL';

export interface Trade {
  action: TradeAction;
  price: number;
  timestamp: number;
}

export class MomentumStrategy {
  private config: MomentumStrategyConfig;
  private priceHistory: Record<string, number[]> = {};
  private trades: Trade[] = [];
  private position: Record<string, TradeAction | null> = {};

  constructor(config: MomentumStrategyConfig) {
    this.config = config;
    for (const symbol of config.symbols) {
      this.priceHistory[symbol] = [];
      this.position[symbol] = null;
    }
  }

  /**
   * Consume a new price update and decide whether to open/close a trade.
   */
  onPrice(update: PriceUpdate) {
    if (!this.config.symbols.includes(update.symbol)) return;
    console.log(`[MomentumStrategy] Received price update: ${update.price} for ${update.symbol}`);
    const history = this.priceHistory[update.symbol];
    history.push(update.price);
    if (history.length > this.config.lookback) history.shift();
    if (history.length === this.config.lookback) {
      this.evaluateMomentum(update.symbol, update);
    }
  }

  /**
   * Simple momentum logic: if price change over lookback > threshold, open/close trade.
   */
  private evaluateMomentum(symbol: string, update: PriceUpdate) {
    const history = this.priceHistory[symbol];
    const first = history[0];
    const last = history[history.length - 1];
    const change = last - first;
    if (change > this.config.threshold && this.position[symbol] !== 'BUY') {
      this.openTrade(symbol, 'BUY', update.price);
    } else if (change < -this.config.threshold && this.position[symbol] !== 'SELL') {
      this.openTrade(symbol, 'SELL', update.price);
    }
  }

  private openTrade(symbol: string, action: TradeAction, price: number) {
    this.position[symbol] = action;
    this.trades.push({ action, price, timestamp: Date.now() });
    console.log(`[MomentumStrategy] Opened ${action} for ${symbol} at ${price}`);
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getPosition(symbol: string): TradeAction | null {
    return this.position[symbol] || null;
  }
} 