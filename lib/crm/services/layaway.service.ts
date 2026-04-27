import fs from 'fs';
import path from 'path';
import { Layaway, LayawayPayment, LayawayStatus } from '../types';

const LAYAWAYS_PATH = path.join(process.cwd(), 'knowledge', 'crm_layaways.json');

function readLayaways(): Layaway[] {
  if (!fs.existsSync(LAYAWAYS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(LAYAWAYS_PATH, 'utf8')); } catch { return []; }
}

function writeLayaways(layaways: Layaway[]): void {
  const dir = path.dirname(LAYAWAYS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LAYAWAYS_PATH, JSON.stringify(layaways, null, 2), 'utf8');
}

export function createLayaway(
  data: Omit<Layaway, 'layawayId' | 'remainingAmount' | 'status' | 'payments'>
): Layaway {
  const layaways = readLayaways();
  const layaway: Layaway = {
    ...data,
    layawayId: 'layaway-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    remainingAmount: data.totalPrice - data.depositAmount,
    status: 'active',
    payments: [],
  };
  writeLayaways([...layaways, layaway]);
  return layaway;
}

export function addLayawayPayment(id: string, payment: LayawayPayment): Layaway {
  const layaways = readLayaways();
  const idx = layaways.findIndex(l => l.layawayId === id);
  if (idx === -1) throw new Error('Layaway not found');

  const existing = layaways[idx];
  const updatedPayments = [...existing.payments, payment];
  const paid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = existing.totalPrice - paid;

  const updated: Layaway = {
    ...existing,
    payments: updatedPayments,
    remainingAmount,
    status: remainingAmount <= 0 ? 'redeemed' : existing.status,
  };
  layaways[idx] = updated;
  writeLayaways(layaways);
  return updated;
}

export function computeLayawayStatus(layaway: Layaway, now: Date): LayawayStatus {
  if (layaway.status === 'active' && now > new Date(layaway.dueDate)) {
    return 'overdue';
  }
  return layaway.status;
}

export function cancelLayaway(id: string): Layaway {
  const layaways = readLayaways();
  const idx = layaways.findIndex(l => l.layawayId === id);
  if (idx === -1) throw new Error('Layaway not found');

  const updated: Layaway = { ...layaways[idx], status: 'cancelled' };
  layaways[idx] = updated;
  writeLayaways(layaways);
  return updated;
}

export function listLayaways(): Layaway[] {
  return readLayaways();
}

export function getLayaway(id: string): Layaway | undefined {
  return readLayaways().find(l => l.layawayId === id);
}
