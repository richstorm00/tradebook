// PriceStore.ts
// Singleton in-memory price store for symbol prices

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

class PriceStore {
  private prices: Map<string, PriceData> = new Map();

  updatePrice(symbol: string, price: number) {
    this.prices.set(symbol, { symbol, price, timestamp: Date.now() });
  }

  getPrice(symbol: string): PriceData | undefined {
    return this.prices.get(symbol);
  }

  getAllPrices(): PriceData[] {
    return Array.from(this.prices.values());
  }
}

export const priceStore = new PriceStore(); 