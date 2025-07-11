import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calculateKPIs(trades: any[]) {
  if (!trades || trades.length === 0) return {
    netPnl: 0,
    netPnlPercent: 0,
    winRate: '0%',
    numTrades: 0,
    maxDrawdown: '0%'
  };
  const netPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const netPnlPercent = trades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  const numTrades = trades.length;
  const wins = trades.filter(t => t.win).length;
  const winRate = ((wins / numTrades) * 100).toFixed(0) + '%';
  const maxDrawdown = Math.min(0, ...trades.map(t => t.pnlPercent || 0)) + '%';
  return { netPnl, netPnlPercent, winRate, numTrades, maxDrawdown };
}

function generateWebhookUrl(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const id = Math.random().toString(36).substring(2, 10);
  return `https://webhook.site/${slug}-${id}`;
}

export async function GET() {
  const strategies = await prisma.strategy.findMany({
    include: { trades: true },
    orderBy: { createdAt: 'desc' },
  });
  const enriched = strategies.map(s => {
    const kpis = calculateKPIs(s.trades);
    // Explicitly include status in the response
    return { ...s, status: s.status, ...kpis };
  });
  return NextResponse.json(enriched, { status: 200 });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  let strategyData: any = {
    type: data.type,
    tags: data.tags || '',
    mode: data.mode || 'paper',
  };
  if (data.type === 'TradingView') {
    strategyData.name = data.name;
    strategyData.webhook = generateWebhookUrl(data.name || 'strategy');
  } else if (data.type === 'AIBot') {
    strategyData.bot = data.bot;
    if (typeof data.capital === 'number') {
      strategyData.capital = data.capital;
    }
    if (
      data.momentumConfig &&
      typeof data.momentumConfig === 'object' &&
      !Array.isArray(data.momentumConfig)
    ) {
      strategyData.momentumConfig = data.momentumConfig;
    }
  }
  const strategy = await prisma.strategy.create({ data: strategyData });
  return NextResponse.json(strategy, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing strategy ID' }, { status: 400 });
  }
  const strategyId = parseInt(id, 10);
  if (isNaN(strategyId)) {
    return NextResponse.json({ error: 'Invalid strategy ID' }, { status: 400 });
  }
  try {
    // Delete related trades, positions, and KPI first due to foreign key constraints
    await prisma.trade.deleteMany({ where: { strategyId } });
    await prisma.position.deleteMany({ where: { strategyId } });
    await prisma.kPI.deleteMany({ where: { strategyId } });
    // Delete the strategy itself
    await prisma.strategy.delete({ where: { id: strategyId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 });
  }
} 