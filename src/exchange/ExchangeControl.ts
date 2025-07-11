import { PaperExchange } from './PaperExchange';
import { BlofinExchange } from './BlofinExchange';
import { Exchange, OrderSide, Position, KPIs, PositionStatus } from './Exchange';
import { PriceModule } from './PriceModule';

// Example static config for strategies
export interface StrategyConfig {
  id: string;
  type: string;
  name: string;
  apiKey?: string;
  apiSecret?: string;
}

export class ExchangeControl {
  private exchanges: Map<string, Exchange> = new Map();
  private strategies: StrategyConfig[];
  private priceModule: PriceModule;

  constructor(strategies: StrategyConfig[], priceModule: PriceModule) {
    this.strategies = strategies;
    this.priceModule = priceModule;
    this.initExchanges();
  }

  /**
   * Initialize exchange objects for each strategy.
   */
  private initExchanges() {
    for (const strat of this.strategies) {
      let exchange: Exchange;
      if (strat.apiKey && strat.apiSecret) {
        exchange = new BlofinExchange(strat.apiKey, strat.apiSecret);
      } else {
        exchange = new PaperExchange(this.priceModule);
      }
      this.exchanges.set(strat.id, exchange);
    }
  }

  /**
   * Place an order for a strategy.
   */
  async placeOrder(params: {
    strategyId: string;
    symbol: string;
    side: OrderSide;
    quantity: number;
  }): Promise<Position> {
    const exchange = this.exchanges.get(params.strategyId);
    if (!exchange) throw new Error('Strategy not found');
    return exchange.placeOrder(params);
  }

  /**
   * Close a position for a strategy.
   */
  async closePosition(params: { strategyId: string; positionId: string }): Promise<Position> {
    const exchange = this.exchanges.get(params.strategyId);
    if (!exchange) throw new Error('Strategy not found');
    return exchange.closePosition({ positionId: params.positionId });
  }

  /**
   * Get positions for a strategy.
   */
  async getPositions(params: { strategyId: string; status?: PositionStatus }): Promise<Position[]> {
    const exchange = this.exchanges.get(params.strategyId);
    if (!exchange) throw new Error('Strategy not found');
    return exchange.getPositions(params);
  }

  /**
   * Get KPIs for a strategy.
   */
  async getKPIs(params: { strategyId: string }): Promise<KPIs> {
    const exchange = this.exchanges.get(params.strategyId);
    if (!exchange) throw new Error('Strategy not found');
    return exchange.getKPIs(params);
  }

  /**
   * Get all strategies.
   */
  getStrategies(): StrategyConfig[] {
    return this.strategies;
  }
} 