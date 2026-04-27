import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { rejectTransfer } from '@/lib/crm/services/transfer.service';
import type { Manager } from '@/lib/crm/types';

const MANAGERS_PATH = path.join(process.cwd(), 'knowledge', 'crm_managers.json');

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { managerId, reason } = body;

    if (!managerId || !isAdmin(managerId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updatedTransfer = rejectTransfer(id, managerId, reason ?? '');
    return NextResponse.json({ success: true, transfer: updatedTransfer });
  } catch (error: any) {
    if (error.message === 'Transfer not found') {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
