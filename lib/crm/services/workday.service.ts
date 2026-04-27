import fs from 'fs';
import path from 'path';
import { WorkDay, WorkDayStatus } from '../types';

const WORKDAYS_PATH = path.join(process.cwd(), 'knowledge', 'crm_workdays.json');

function readWorkDays(): WorkDay[] {
  if (!fs.existsSync(WORKDAYS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(WORKDAYS_PATH, 'utf8')); } catch { return []; }
}

function writeWorkDays(workDays: WorkDay[]): void {
  const dir = path.dirname(WORKDAYS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WORKDAYS_PATH, JSON.stringify(workDays, null, 2), 'utf8');
}

export function startWorkDay(managerId: string): WorkDay {
  const workDays = readWorkDays();
  const alreadyOpen = workDays.some(w => w.managerId === managerId && w.status === 'open');
  if (alreadyOpen) throw new Error('Рабочий день уже открыт');

  const now = new Date();
  const workDay: WorkDay = {
    workDayId: 'wd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    managerId,
    date: now.toISOString().slice(0, 10),
    startedAt: now.toISOString(),
    status: 'open',
  };

  writeWorkDays([...workDays, workDay]);
  return workDay;
}

export function endWorkDay(workDayId: string): WorkDay {
  const workDays = readWorkDays();
  const idx = workDays.findIndex(w => w.workDayId === workDayId);
  if (idx === -1) throw new Error('Work day not found');
  if (workDays[idx].status === 'closed') throw new Error('Рабочий день уже завершён');

  const updated: WorkDay = {
    ...workDays[idx],
    endedAt: new Date().toISOString(),
    status: 'closed',
  };

  workDays[idx] = updated;
  writeWorkDays(workDays);
  return updated;
}

export function getOpenWorkDay(managerId: string): WorkDay | undefined {
  return readWorkDays().find(w => w.managerId === managerId && w.status === 'open');
}

export function computeWorkDayHours(workDay: WorkDay): number {
  if (!workDay.endedAt) return 0;
  const ms = new Date(workDay.endedAt).getTime() - new Date(workDay.startedAt).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function listWorkDays(filter?: { managerId?: string; date?: string }): WorkDay[] {
  let workDays = readWorkDays();
  if (filter?.managerId) workDays = workDays.filter(w => w.managerId === filter.managerId);
  if (filter?.date) workDays = workDays.filter(w => w.date === filter.date);
  return workDays;
}

export function getWorkDayReport(
  managerId?: string,
  dateRange?: { from: string; to: string }
): WorkDay[] {
  let workDays = readWorkDays();
  if (managerId) workDays = workDays.filter(w => w.managerId === managerId);
  if (dateRange) {
    workDays = workDays.filter(w => w.date >= dateRange.from && w.date <= dateRange.to);
  }
  return workDays;
}
