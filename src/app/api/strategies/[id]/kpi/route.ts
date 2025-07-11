import { NextRequest, NextResponse } from 'next/server';
import { exchangeControl } from '../../../../../lib/exchangeControlInstance';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const kpi = await exchangeControl.getKPIs({ strategyId: id });
    return NextResponse.json(kpi);
  } catch (err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
} 