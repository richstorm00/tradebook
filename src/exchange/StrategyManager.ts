import { PriceModule, PriceUpdate } from './PriceModule';
import { StrategyConfig } from './ExchangeControl';
import { MomentumStrategy, MomentumStrategyConfig, Trade, TradeAction } from './MomentumStrategy';

// Example mock strategy types
export type StrategyType = 'AIBot' | 'TradingView';

export interface Strategy {
  id: string;
  type: StrategyType;
  name: string;
  momentumConfig?: MomentumStrategyConfig; // Optional config for AIBot
  // Add more fields as needed
}

export class StrategyManager {
  private strategies: Strategy[];
  private priceModule: PriceModule;
  private momentumInstances: Map<string, MomentumStrategy> = new Map();

  constructor(strategies: Strategy[], priceModule: PriceModule) {
    this.strategies = strategies;
    this.priceModule = priceModule;
    this.initAIBotStrategies();
    this.subscribeToPrices();
  }

  /**
   * Instantiate MomentumStrategy for each AIBot with config.
   */
  private initAIBotStrategies() {
    for (const strat of this.strategies) {
      if (strat.type === 'AIBot' && strat.momentumConfig) {
        this.momentumInstances.set(
          strat.id,
          new MomentumStrategy(strat.momentumConfig)
        );
      }
    }
  }

  /**
   * Subscribe to price updates for strategies that require them (e.g., AIBot).
   */
  private subscribeToPrices() {
    this.priceModule.onPrice((update: PriceUpdate) => {
      for (const strat of this.strategies) {
        if (strat.type === 'AIBot') {
          // Forward price data to AIBot strategies (mocked)
          this.handleAIBotPrice(strat, update);
        }
        // TradingView type does not require price data
      }
    });
  }

  /**
   * Forward price data to the correct MomentumStrategy instance.
   */
  private handleAIBotPrice(strategy: Strategy, update: PriceUpdate) {
    const momentum = this.momentumInstances.get(strategy.id);
    if (momentum) {
      momentum.onPrice(update);
    }
    // In a real implementation, handle other AIBot logic here
  }

  /**
   * Get all strategies.
   */
  getStrategies(): Strategy[] {
    return this.strategies;
  }

  /**
   * Get all strategy types.
   */
  getStrategyTypes(): StrategyType[] {
    return Array.from(new Set(this.strategies.map(s => s.type)));
  }

  /**
   * Get trades for a given strategy (AIBot only).
   */
  getTrades(strategyId: string): Trade[] | undefined {
    return this.momentumInstances.get(strategyId)?.getTrades();
  }

  /**
   * Get current position for a given strategy (AIBot only).
   */
  getPosition(strategyId: string): TradeAction | null | undefined {
    return this.momentumInstances.get(strategyId)?.getPosition();
  }
} 