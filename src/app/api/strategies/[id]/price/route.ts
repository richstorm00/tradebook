import { NextRequest, NextResponse } from 'next/server';
import { exchangeControl } from '../../../../../lib/exchangeControlInstance';

// For now, mock the symbol as 'BTCUSDT'. In a real app, this would be dynamic per strategy.
const symbol = 'BTCUSDT';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Get the price module from exchangeControl (assume it's public for now)
    // @ts-ignore
    const priceModule = exchangeControl.priceModule;
    const price = priceModule.getPrice(symbol);
    if (!price) throw new Error('No price');
    return NextResponse.json(price);
  } catch (err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
} 