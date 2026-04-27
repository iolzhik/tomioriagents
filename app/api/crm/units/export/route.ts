import { NextResponse } from 'next/server';
import { getUnits } from '@/lib/crm-service';

export async function GET() {
  const units = getUnits();
  return new Response(JSON.stringify(units, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="crm_units_export.json"' },
  });
}
