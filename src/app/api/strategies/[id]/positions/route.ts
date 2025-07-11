import { NextRequest, NextResponse } from 'next/server';
import { exchangeControl } from '../../../../../lib/exchangeControlInstance';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const positions = await exchangeControl.getPositions({ strategyId: id });
    return NextResponse.json(positions);
  } catch (err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
} 