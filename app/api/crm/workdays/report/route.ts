import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWorkDayReport, computeWorkDayHours } from '@/lib/crm/services/workday.service';
import type { Manager } from '@/lib/crm/types';

const MANAGERS_PATH = path.join(process.cwd(), 'knowledge', 'crm_managers.json');

function getManagers(): Manager[] {
  try { return JSON.parse(fs.readFileSync(MANAGERS_PATH, 'utf8')); } catch { return []; }
}

function isAdmin(managerId: string): boolean {
  return getManagers().find(m => m.id === managerId)?.role === 'admin';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId') ?? '';

    if (!requesterId || !isAdmin(requesterId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const managerId = searchParams.get('managerId') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const dateRange = from && to ? { from, to } : undefined;

    const workDays = getWorkDayReport(managerId, dateRange);
    const report = workDays.map(wd => ({
      ...wd,
      hours: computeWorkDayHours(wd),
    }));

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
