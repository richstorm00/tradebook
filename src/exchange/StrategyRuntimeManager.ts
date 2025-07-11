import { MomentumStrategy, MomentumStrategyConfig } from './MomentumStrategy';
import { PriceModule, PriceUpdate } from './PriceModule';
// import { priceStore } from './PriceStore';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of running strategies: strategyId -> { instance, unsubscribe }
type RunningStrategy = {
  instance: MomentumStrategy;
  config: MomentumStrategyConfig;
  symbol: string;
};

class StrategyRuntimeManager {
  private running: Map<string, RunningStrategy> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPollingLoop();
  }

  startMomentumStrategy(
    strategyId: string,
    config: MomentumStrategyConfig
  ) {
    if (this.running.has(strategyId)) return; // Already running
    const instance = new MomentumStrategy(config);
    // Store config and symbols for polling
    this.running.set(strategyId, { instance, config, symbol: config.symbols[0] }); // Use first symbol for now
  }

  stopStrategy(strategyId: string) {
    if (this.running.has(strategyId)) {
      this.running.delete(strategyId);
    }
  }

  isRunning(strategyId: string) {
    return this.running.has(strategyId);
  }

  getInstance(strategyId: string) {
    return this.running.get(strategyId)?.instance;
  }

  private startPollingLoop() {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(async () => {
      console.log('[StrategyRuntimeManager] Polling loop tick');
      for (const [strategyId, { instance, config }] of this.running.entries()) {
        console.log(`[StrategyRuntimeManager] Polling strategy ${strategyId}`);
        for (const symbol of config.symbols) {
          // Read latest price from DB
          const dbPrice = await prisma.price.findUnique({ where: { symbol } });
          if (dbPrice) {
            console.log(`[StrategyRuntimeManager] Sending price to strategy ${strategyId}: ${symbol} = ${dbPrice.price}`);
            instance.onPrice({
              symbol: dbPrice.symbol,
              price: dbPrice.price,
              timestamp: dbPrice.updatedAt.getTime(),
            });
          } else {
            console.log(`[StrategyRuntimeManager] No price data for ${symbol}`);
          }
        }
      }
    }, 5000);
  }
}

export const strategyRuntimeManager = new StrategyRuntimeManager(); 