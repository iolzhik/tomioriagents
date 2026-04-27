import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBranchDirectory, saveBranch, deleteBranch } from '@/lib/crm/services/location.service';
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
    const { managerId, ...fields } = body;

    if (!managerId || !isAdmin(managerId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const branches = getBranchDirectory();
    const existing = branches.find((b) => b.branchId === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    const updated = { ...existing, ...fields, branchId: id };
    const saved = saveBranch(updated);
    return NextResponse.json({ success: true, branch: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const managerId = body.managerId || req.headers.get('x-manager-id');

    if (!managerId || !isAdmin(managerId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    deleteBranch(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
