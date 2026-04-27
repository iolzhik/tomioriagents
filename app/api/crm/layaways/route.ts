import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listLayaways, createLayaway } from '@/lib/crm/services/layaway.service';
import type { JewelryUnit } from '@/lib/crm/types';

const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8')); } catch { return []; }
}

function writeUnits(units: JewelryUnit[]): void {
  fs.writeFileSync(UNITS_PATH, JSON.stringify(units, null, 2), 'utf8');
}

export async function GET() {
  return NextResponse.json({ success: true, layaways: listLayaways() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, leadId, clientName, clientPhone, depositAmount, totalPrice, dueDate, nextPaymentDate, nextPaymentAmount, notes } = body;

    const units = readUnits();
    const unitIdx = units.findIndex(u => u.unitId === unitId);
    if (unitIdx === -1) {
      return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
    }

    const unit = units[unitIdx];
    if (unit.locationStatus === 'reserved' || unit.locationStatus === 'sold') {
      return NextResponse.json({ success: false, error: 'Unit is not available for layaway' }, { status: 409 });
    }

    const layaway = createLayaway({ unitId, leadId, clientName, clientPhone, depositAmount, totalPrice, dueDate, nextPaymentDate, nextPaymentAmount, notes, reservedAt: new Date().toISOString() });

    const now = new Date().toISOString();
    units[unitIdx] = {
      ...unit,
      locationStatus: 'reserved',
      locationHistory: [...unit.locationHistory, { from: unit.locationStatus, to: 'reserved', timestamp: now, managerId: leadId }],
      updatedAt: now,
      updatedBy: leadId,
    };
    writeUnits(units);

    return NextResponse.json({ success: true, layaway }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
