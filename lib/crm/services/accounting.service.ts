import { prisma } from '../../prisma';
import { Lead } from '../types';
import { saveAuditLog } from './audit.service';

export async function getAccountingEntries() {
  return await prisma.accountingEntry.findMany({
    orderBy: { timestamp: 'desc' },
    include: { lead: true }
  });
}

export async function ensureAccountingEntryForLead(lead: Lead, managerId: string = 'system') {
  if (lead.status !== 'closed_won') return;

  const exists = await prisma.accountingEntry.findFirst({
    where: { leadId: String(lead.id) }
  });
  
  if (!exists) {
    const amount = lead.paymentAmount || lead.finalPrice || lead.productPrice || 0;
    
    const entry = await prisma.accountingEntry.create({
      data: {
        timestamp: new Date(),
        type: 'income',
        category: 'Продажа изделия',
        amount: amount,
        description: `Оплата по лиду #${lead.id}: ${lead.name} (${lead.product || 'Ювелирное изделие'})`,
        leadId: String(lead.id),
        managerId: managerId,
        isConfirmed: false
      }
    });
    
    await saveAuditLog({
      managerId: managerId,
      managerName: 'Система',
      action: 'AUTO_ACCOUNTING_ENTRY',
      details: `Автоматически создана запись о доходе по лиду #${lead.id}`,
      targetId: entry.id
    });
    
    return entry;
  }
}

export async function createAccountingEntry(data: any) {
  return await prisma.accountingEntry.create({ data });
}

export async function updateAccountingEntry(id: string, data: any) {
  return await prisma.accountingEntry.update({ where: { id }, data });
}

export async function deleteAccountingEntry(id: string) {
  return await prisma.accountingEntry.delete({ where: { id } });
}

export async function getReceipts() {
  return await prisma.receipt.findMany({
    orderBy: { timestamp: 'desc' }
  });
}

export async function saveReceipt(data: any) {
  return await prisma.receipt.create({ data });
}
