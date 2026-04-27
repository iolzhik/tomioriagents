import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWarehouseStock } from '@/lib/crm/services/warehouse.service';
import type { JewelryUnit } from '@/lib/crm/types';

const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  } catch {
    return [];
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const units = readUnits();
    const stock = getWarehouseStock(id, units);
    const now = Date.now();

    const enriched = stock.map((unit) => {
      const requiresAudit =
        !unit.lastAudit ||
        now - new Date(unit.lastAudit.auditedAt).getTime() > THIRTY_DAYS_MS;

      return { ...unit, requiresAudit };
    });

    return NextResponse.json({ success: true, units: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
