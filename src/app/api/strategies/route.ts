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
    return { ...s, ...kpis };
  });
  return NextResponse.json(enriched, { status: 200 });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  let strategyData: any = {
    type: data.type,
    tags: data.tags || '',
  };
  if (data.type === 'TradingView') {
    strategyData.name = data.name;
    strategyData.webhook = generateWebhookUrl(data.name || 'strategy');
  } else if (data.type === 'AIBot') {
    strategyData.bot = data.bot;
  }
  const strategy = await prisma.strategy.create({ data: strategyData });
  return NextResponse.json(strategy, { status: 201 });
} 