import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWarehouseSummary } from '@/lib/crm/services/warehouse.service';
import type { JewelryUnit } from '@/lib/crm/types';

const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const units = readUnits();
    const summary = getWarehouseSummary(units);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
