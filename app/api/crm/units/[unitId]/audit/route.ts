import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { recordAudit } from '@/lib/crm/services/warehouse.service';
import type { Manager, JewelryUnit } from '@/lib/crm/types';

const MANAGERS_PATH = path.join(process.cwd(), 'knowledge', 'crm_managers.json');
const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');

function getManagers(): Manager[] {
  try { return JSON.parse(fs.readFileSync(MANAGERS_PATH, 'utf8')); } catch { return []; }
}

function isAdmin(managerId: string): boolean {
  return getManagers().find(m => m.id === managerId)?.role === 'admin';
}

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8')); } catch { return []; }
}

function writeUnits(units: JewelryUnit[]): void {
  fs.writeFileSync(UNITS_PATH, JSON.stringify(units, null, 2), 'utf8');
}

export async function PUT(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const { unitId } = await params;
    const { managerId, warehouseId } = await req.json();

    if (!managerId || !isAdmin(managerId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const units = readUnits();
    const unitIdx = units.findIndex(u => u.unitId === unitId);
    if (unitIdx === -1) {
      return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });
    }

    const unit = units[unitIdx];
    const now = new Date().toISOString();
    const updatedUnit = recordAudit(unit, {
      auditedAt: now,
      auditedBy: managerId,
      warehouseId,
    });

    units[unitIdx] = updatedUnit;
    writeUnits(units);

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
