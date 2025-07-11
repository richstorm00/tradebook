import { Exchange, OrderSide, Position, KPIs, PositionStatus } from './Exchange';
import { PriceModule } from './PriceModule';
import { prisma } from '../lib/prisma';

export class PaperExchange extends Exchange {
  private priceModule: PriceModule;

  constructor(priceModule: PriceModule) {
    super();
    this.priceModule = priceModule;
  }

  /**
   * Simulate placing an order by creating a new position in the database.
   */
  async placeOrder(params: {
    strategyId: string;
    symbol: string;
    side: OrderSide;
    quantity: number;
  }): Promise<Position> {
    const { strategyId, symbol, side, quantity } = params;
    const priceUpdate = this.priceModule.getPrice(symbol);
    if (!priceUpdate) throw new Error('No price available for symbol');
    const openPrice = priceUpdate.price;
    const openTime = new Date();
    const dbPosition = await prisma.position.create({
      data: {
        strategyId: Number(strategyId),
        symbol,
        side,
        openTime,
        openPrice,
        quantity,
        status: 'open',
      },
    });
    return this.toPosition(dbPosition);
  }

  /**
   * Simulate closing a position by updating it in the database and calculating PNL.
   */
  async closePosition(params: { positionId: string }): Promise<Position> {
    const { positionId } = params;
    const dbPosition = await prisma.position.findUnique({ where: { id: Number(positionId) } });
    if (!dbPosition) throw new Error('Position not found');
    if (dbPosition.status === 'closed') throw new Error('Position already closed');
    const priceUpdate = this.priceModule.getPrice(dbPosition.symbol);
    if (!priceUpdate) throw new Error('No price available for symbol');
    const closePrice = priceUpdate.price;
    const closeTime = new Date();
    // Calculate PNL (simple: (close - open) * qty * direction)
    const direction = dbPosition.side === 'buy' ? 1 : -1;
    const pnl = (closePrice - dbPosition.openPrice) * dbPosition.quantity * direction;
    const updated = await prisma.position.update({
      where: { id: dbPosition.id },
      data: {
        closeTime,
        closePrice,
        status: 'closed',
        pnl,
      },
    });
    // Optionally update KPIs here
    await this.updateKPIs(dbPosition.strategyId);
    return this.toPosition(updated);
  }

  /**
   * Get all positions for a strategy, optionally filtered by status.
   */
  async getPositions(params: { strategyId: string; status?: PositionStatus }): Promise<Position[]> {
    const { strategyId, status } = params;
    const where: any = { strategyId: Number(strategyId) };
    if (status) where.status = status;
    const dbPositions = await prisma.position.findMany({ where });
    return dbPositions.map(this.toPosition);
  }

  /**
   * Get KPIs for a strategy (PNL, win rate %, trades, max drawdown %).
   */
  async getKPIs(params: { strategyId: string }): Promise<KPIs> {
    const { strategyId } = params;
    let kpi = await prisma.kPI.findUnique({ where: { strategyId: Number(strategyId) } });
    if (!kpi) {
      // If not present, calculate and create
      kpi = await this.updateKPIs(Number(strategyId));
    }
    return {
      pnl: kpi.pnl,
      winRate: kpi.winRate,
      trades: kpi.trades,
      maxDrawdown: kpi.maxDrawdown,
    };
  }

  /**
   * Helper to calculate and update KPIs for a strategy.
   */
  private async updateKPIs(strategyId: number) {
    const positions = await prisma.position.findMany({ where: { strategyId, status: 'closed' } });
    const trades = positions.length;
    const pnl = positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
    const wins = positions.filter(p => (p.pnl ?? 0) > 0).length;
    const winRate = trades > 0 ? (wins / trades) * 100 : 0;
    // Max drawdown calculation (simple version)
    let maxDrawdown = 0;
    let peak = 0;
    let trough = 0;
    let running = 0;
    for (const p of positions) {
      running += p.pnl ?? 0;
      if (running > peak) {
        peak = running;
        trough = running;
      }
      if (running < trough) {
        trough = running;
        const dd = peak === 0 ? 0 : ((peak - trough) / Math.abs(peak)) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
    }
    const kpi = await prisma.kPI.upsert({
      where: { strategyId },
      update: { pnl, winRate, trades, maxDrawdown },
      create: { strategyId, pnl, winRate, trades, maxDrawdown },
    });
    return kpi;
  }

  /**
   * Convert DB Position to API Position.
   */
  private toPosition(db: any): Position {
    return {
      id: db.id.toString(),
      strategyId: db.strategyId.toString(),
      symbol: db.symbol,
      side: db.side as OrderSide,
      openTime: db.openTime,
      closeTime: db.closeTime ?? undefined,
      openPrice: db.openPrice,
      closePrice: db.closePrice ?? undefined,
      quantity: db.quantity,
      status: db.status as PositionStatus,
      pnl: db.pnl ?? undefined,
    };
  }
} 