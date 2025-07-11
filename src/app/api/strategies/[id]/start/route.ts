import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { strategyRuntimeManager } from '@/exchange/StrategyRuntimeManager';
import { priceModule } from '@/lib/exchangeControlInstance';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const strategyId = parseInt(id, 10);
  if (isNaN(strategyId)) {
    return NextResponse.json({ error: 'Invalid strategy ID' }, { status: 400 });
  }
  try {
    const strategy = await prisma.strategy.update({
      where: { id: strategyId },
      data: { status: 'running' },
      select: { id: true, type: true, status: true, momentumConfig: true },
    });
    if (strategy && strategy.type === 'AIBot' && strategy.momentumConfig) {
      // Ensure momentumConfig is a valid MomentumStrategyConfig and add symbols
      const config = typeof strategy.momentumConfig === 'string'
        ? JSON.parse(strategy.momentumConfig)
        : strategy.momentumConfig;
      config.symbols = ['BTCUSDT', 'SOLUSDT']; // Use default symbols for now
      strategyRuntimeManager.startMomentumStrategy(
        String(strategy.id),
        config
      );
    }
    return NextResponse.json(strategy, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start strategy' }, { status: 500 });
  }
} 