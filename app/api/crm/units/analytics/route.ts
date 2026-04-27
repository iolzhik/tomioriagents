import { NextResponse } from 'next/server';
import { getUnits, computeTurnoverAnalytics } from '@/lib/crm-service';

export async function GET() {
  try {
    const units = await getUnits();
    const analytics = computeTurnoverAnalytics(units);
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
// Trigger hot reload 3
