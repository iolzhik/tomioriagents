import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { addLayawayPayment, cancelLayaway, getLayaway } from '@/lib/crm/services/layaway.service';
import type { JewelryUnit } from '@/lib/crm/types';

const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8')); } catch { return []; }
}

function writeUnits(units: JewelryUnit[]): void {
  fs.writeFileSync(UNITS_PATH, JSON.stringify(units, null, 2), 'utf8');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'add_payment') {
      const { payment } = body;
      const result = addLayawayPayment(id, payment);

      if (result.status === 'redeemed') {
        const layaway = getLayaway(id);
        if (layaway) {
          const units = readUnits();
          const unitIdx = units.findIndex(u => u.unitId === layaway.unitId);
          if (unitIdx !== -1) {
            const unit = units[unitIdx];
            const now = new Date().toISOString();
            units[unitIdx] = {
              ...unit,
              locationStatus: 'sold',
              locationHistory: [...unit.locationHistory, { from: unit.locationStatus, to: 'sold', timestamp: now, managerId: layaway.leadId }],
              updatedAt: now,
              updatedBy: layaway.leadId,
            };
            writeUnits(units);
          }
        }
      }

      return NextResponse.json({ success: true, layaway: result });
    }

    if (action === 'cancel') {
      const result = cancelLayaway(id);

      const units = readUnits();
      const unitIdx = units.findIndex(u => u.unitId === result.unitId);
      if (unitIdx !== -1) {
        const unit = units[unitIdx];
        const now = new Date().toISOString();
        units[unitIdx] = {
          ...unit,
          locationStatus: 'showcase',
          locationHistory: [...unit.locationHistory, { from: unit.locationStatus, to: 'showcase', timestamp: now, managerId: result.leadId }],
          updatedAt: now,
          updatedBy: result.leadId,
        };
        writeUnits(units);
      }

      return NextResponse.json({ success: true, layaway: result });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
