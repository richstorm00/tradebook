import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { strategyRuntimeManager } from '@/exchange/StrategyRuntimeManager';

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
      data: { status: 'stopped' },
    });
    // Stop the strategy logic if running
    strategyRuntimeManager.stopStrategy(String(strategy.id));
    return NextResponse.json(strategy, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to stop strategy' }, { status: 500 });
  }
} 