import EventEmitter from 'events';

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

interface PriceModuleConfig {
  fetchIntervalMs: number;
}

export class PriceModule extends EventEmitter {
  private prices: Map<string, PriceUpdate> = new Map();
  private pairs: string[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private config: PriceModuleConfig;

  constructor(config: PriceModuleConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the module: fetch pairs and start price polling.
   */
  async start() {
    await this.fetchPairs();
    this.pollPrices();
    this.intervalId = setInterval(() => this.pollPrices(), this.config.fetchIntervalMs);
  }

  /**
   * Stop polling for prices.
   */
  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Fetch available futures trading pairs from Blofin API.
   */
  private async fetchPairs() {
    this.pairs = ['BTCUSDT', 'SOLUSDT'];
    return;
    // Example endpoint: https://api.blofin.com/api/v1/futures/instruments
    // const res = await fetch('https://api.blofin.com/api/v1/futures/instruments');
    // let data;
    // try {
    //   data = await res.json();
    // } catch (e) {
    //   console.error('Failed to parse pairs response as JSON:', e);
    //   this.pairs = [];
    //   return;
    // }
    // if (!data.data) {
    //   console.error('No data field in pairs response:', data);
    //   this.pairs = [];
    //   return;
    // }
    // this.pairs = data.data.map((item: any) => item.symbol);
  }

  /**
   * Poll prices for all pairs and emit updates.
   */
  private async pollPrices() {
    if (this.pairs.length === 0) return;
    // Use the correct Blofin endpoint for each symbol
    for (const symbol of this.pairs) {
      try {
        const url = `https://openapi.blofin.com/api/v1/market/tickers?instId=${symbol.replace('USDT', '-USDT')}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code !== '0' || !data.data || !data.data[0]) continue;
        const price = parseFloat(data.data[0].last);
        const update: PriceUpdate = { symbol, price, timestamp: Date.now() };
        this.prices.set(symbol, update);
        this.emit('price', update);
      } catch (err) {
        // Optionally log error
      }
    }
  }

  /**
   * Get the latest price for a symbol.
   */
  getPrice(symbol: string): PriceUpdate | undefined {
    return this.prices.get(symbol);
  }

  /**
   * Subscribe to price updates.
   */
  onPrice(listener: (update: PriceUpdate) => void) {
    this.on('price', listener);
  }
} 