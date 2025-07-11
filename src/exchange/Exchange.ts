// Exchange.ts
// Abstract base class/interface for all exchange implementations

export type OrderSide = 'buy' | 'sell';
export type PositionStatus = 'open' | 'closed';

export interface Position {
  id: string;
  strategyId: string;
  symbol: string;
  side: OrderSide;
  openTime: Date;
  closeTime?: Date;
  openPrice: number;
  closePrice?: number;
  quantity: number;
  status: PositionStatus;
  pnl?: number;
}

export interface KPIs {
  pnl: number;
  winRate: number; // percent
  trades: number;
  maxDrawdown: number; // percent
}

export abstract class Exchange {
  /**
   * Place a new order and open a position.
   */
  abstract placeOrder(params: {
    strategyId: string;
    symbol: string;
    side: OrderSide;
    quantity: number;
  }): Promise<Position>;

  /**
   * Close an open position by ID.
   */
  abstract closePosition(params: {
    positionId: string;
  }): Promise<Position>;

  /**
   * Get all open positions for a strategy.
   */
  abstract getPositions(params: {
    strategyId: string;
    status?: PositionStatus;
  }): Promise<Position[]>;

  /**
   * Get KPIs for a strategy.
   */
  abstract getKPIs(params: {
    strategyId: string;
  }): Promise<KPIs>;
} 