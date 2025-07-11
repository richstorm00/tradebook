import { PaperExchange } from '../PaperExchange';
import { Exchange, OrderSide } from '../Exchange';
import { PriceModule, PriceUpdate } from '../PriceModule';
import { prisma } from '../../lib/prisma';

describe('PaperExchange Integration', () => {
  let paperExchange: PaperExchange;
  let mockPriceModule: PriceModule;

  beforeAll(async () => {
    // Mock PriceModule
    mockPriceModule = {
      getPrice: (symbol: string) => ({ symbol, price: 100, timestamp: Date.now() }),
      onPrice: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    } as any;
    paperExchange = new PaperExchange(mockPriceModule);
    // Clean DB
    await prisma.position.deleteMany();
    await prisma.kPI.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should place an order and create a position', async () => {
    const position = await paperExchange.placeOrder({
      strategyId: '1',
      symbol: 'BTCUSDT',
      side: 'buy',
      quantity: 1,
    });
    expect(position).toMatchObject({
      strategyId: '1',
      symbol: 'BTCUSDT',
      side: 'buy',
      openPrice: 100,
      status: 'open',
    });
  });

  it('should close a position and calculate PNL', async () => {
    // Place order first
    const position = await paperExchange.placeOrder({
      strategyId: '1',
      symbol: 'BTCUSDT',
      side: 'buy',
      quantity: 2,
    });
    // Close it
    const closed = await paperExchange.closePosition({ positionId: position.id });
    expect(closed.status).toBe('closed');
    expect(closed.pnl).toBeCloseTo(0); // Since open and close price are both 100
  });

  it('should return correct KPIs', async () => {
    const kpis = await paperExchange.getKPIs({ strategyId: '1' });
    expect(kpis.trades).toBeGreaterThan(0);
    expect(typeof kpis.pnl).toBe('number');
    expect(typeof kpis.winRate).toBe('number');
    expect(typeof kpis.maxDrawdown).toBe('number');
  });
}); 