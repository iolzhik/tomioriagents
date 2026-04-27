import fs from 'fs';
import path from 'path';
import { Transfer, TransferStatus, UnitLocation } from '../types';

const TRANSFERS_PATH = path.join(process.cwd(), 'knowledge', 'crm_transfers.json');

function readTransfers(): Transfer[] {
  if (!fs.existsSync(TRANSFERS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(TRANSFERS_PATH, 'utf8')); } catch { return []; }
}

function writeTransfers(transfers: Transfer[]): void {
  const dir = path.dirname(TRANSFERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TRANSFERS_PATH, JSON.stringify(transfers, null, 2), 'utf8');
}

export function createTransfer(
  unitId: string,
  fromLocation: UnitLocation,
  toLocation: UnitLocation,
  requestedBy: string
): Transfer {
  const transfers = readTransfers();
  const hasPending = transfers.some(t => t.unitId === unitId && t.status === 'pending');
  if (hasPending) throw new Error('Unit already has a pending transfer');

  const transfer: Transfer = {
    transferId: 'transfer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    unitId,
    fromLocation,
    toLocation,
    requestedBy,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  writeTransfers([...transfers, transfer]);
  return transfer;
}

export function approveTransfer(transferId: string, adminId: string): Transfer {
  const transfers = readTransfers();
  const idx = transfers.findIndex(t => t.transferId === transferId);
  if (idx === -1) throw new Error('Transfer not found');

  const updated: Transfer = {
    ...transfers[idx],
    status: 'approved',
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
  };

  transfers[idx] = updated;
  writeTransfers(transfers);
  return updated;
}

export function rejectTransfer(transferId: string, adminId: string, reason: string): Transfer {
  const transfers = readTransfers();
  const idx = transfers.findIndex(t => t.transferId === transferId);
  if (idx === -1) throw new Error('Transfer not found');

  const updated: Transfer = {
    ...transfers[idx],
    status: 'rejected',
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason,
  };

  transfers[idx] = updated;
  writeTransfers(transfers);
  return updated;
}

export function listTransfers(filter?: { status?: TransferStatus; unitId?: string }): Transfer[] {
  let transfers = readTransfers();
  if (filter?.status) transfers = transfers.filter(t => t.status === filter.status);
  if (filter?.unitId) transfers = transfers.filter(t => t.unitId === filter.unitId);
  return transfers;
}

export function getTransfer(id: string): Transfer | undefined {
  return readTransfers().find(t => t.transferId === id);
}
