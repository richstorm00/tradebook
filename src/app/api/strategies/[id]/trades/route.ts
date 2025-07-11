import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const strategyId = parseInt(params.id, 10);
  if (isNaN(strategyId)) {
    return NextResponse.json({ error: 'Invalid strategy ID' }, { status: 400 });
  }
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy) {
    return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
  }
  const data = await req.json();
  const { symbol, entry, leverage, current, pnl, pnlPercent, win } = data;
  if (!symbol || entry == null || leverage == null || current == null || pnl == null || pnlPercent == null || win == null) {
    return NextResponse.json({ error: 'Missing trade fields' }, { status: 400 });
  }
  const trade = await prisma.trade.create({
    data: {
      strategyId,
      symbol,
      entry,
      leverage,
      current,
      pnl,
      pnlPercent,
      win,
    },
  });
  return NextResponse.json(trade, { status: 201 });
} 