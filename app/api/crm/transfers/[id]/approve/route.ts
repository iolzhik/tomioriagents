import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { approveTransfer, getTransfer } from '@/lib/crm/services/transfer.service';
import { updateUnitLocation } from '@/lib/crm/services/location.service';
import type { Manager, JewelryUnit } from '@/lib/crm/types';

const MANAGERS_PATH = path.join(process.cwd(), 'knowledge', 'crm_managers.json');
const UNITS_PATH = path.join(process.cwd(), 'knowledge', 'crm_units.json');

function getManagers(): Manager[] {
  try {
    return JSON.parse(fs.readFileSync(MANAGERS_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function isAdmin(managerId: string): boolean {
  const managers = getManagers();
  const manager = managers.find((m) => m.id === managerId);
  return manager?.role === 'admin';
}

function readUnits(): JewelryUnit[] {
  if (!fs.existsSync(UNITS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeUnits(units: JewelryUnit[]): void {
  fs.writeFileSync(UNITS_PATH, JSON.stringify(units, null, 2), 'utf8');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { managerId } = body;

    if (!managerId || !isAdmin(managerId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const transfer = getTransfer(id);
    if (!transfer) {
      return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
    }

    const updatedTransfer = approveTransfer(id, managerId);

    // Update unit's currentLocation
    const units = readUnits();
    const unitIdx = units.findIndex((u) => u.unitId === transfer.unitId);
    if (unitIdx !== -1) {
      const updatedUnit = updateUnitLocation(
        units[unitIdx],
        transfer.toLocation,
        managerId,
        'Transfer approved'
      );
      units[unitIdx] = updatedUnit;
      writeUnits(units);
    }

    return NextResponse.json({ success: true, transfer: updatedTransfer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
