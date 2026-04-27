import { prisma } from '../../prisma';

export async function getAuditLogs() {
  return await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' }
  });
}

export async function saveAuditLog(data: any) {
  return await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      managerId: data.managerId || 'system',
      action: data.action,
      details: data.details,
      targetId: data.targetId ? String(data.targetId) : null
    }
  });
}

export async function clearAuditLogs() {
  return await prisma.auditLog.deleteMany();
}
