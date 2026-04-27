import { prisma } from '../../prisma';
import { Lead as CRMLead } from '../types';
import fs from 'fs';

const LEADS_OVERLAY_PATH = '/tmp/tomiori_leads_overlay.json';

type LeadOverlay = {
  created: any[];
  updated: Record<string, Record<string, any>>;
  deleted: string[];
};

function emptyOverlay(): LeadOverlay {
  return { created: [], updated: {}, deleted: [] };
}

function readOverlay(): LeadOverlay {
  try {
    if (!fs.existsSync(LEADS_OVERLAY_PATH)) return emptyOverlay();
    const raw = fs.readFileSync(LEADS_OVERLAY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      created: Array.isArray(parsed?.created) ? parsed.created : [],
      updated: parsed?.updated && typeof parsed.updated === 'object' ? parsed.updated : {},
      deleted: Array.isArray(parsed?.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(data: LeadOverlay) {
  fs.writeFileSync(LEADS_OVERLAY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function applyOverlay(baseLeads: CRMLead[]): CRMLead[] {
  const overlay = readOverlay();
  const baseById = new Map<string, CRMLead>();
  for (const lead of baseLeads) {
    baseById.set(String(lead.id), { ...lead });
  }

  for (const id of overlay.deleted) baseById.delete(String(id));

  for (const [id, patch] of Object.entries(overlay.updated)) {
    if (baseById.has(id)) {
      baseById.set(id, { ...(baseById.get(id) as CRMLead), ...patch } as CRMLead);
    }
  }

  const created = overlay.created
    .filter((lead) => !overlay.deleted.includes(String(lead.id)))
    .map((lead) => ({ ...lead, ...(overlay.updated[String(lead.id)] || {}) })) as CRMLead[];

  return [...created, ...Array.from(baseById.values())]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function normalizeLeadDefaults(data: any, id: string): CRMLead {
  const now = new Date().toISOString();
  return {
    id,
    clientId: data.clientId || undefined,
    name: data.name || '',
    phone: data.phone || '',
    product: data.product || '',
    productId: data.productId || undefined,
    status: data.status || 'new',
    source: data.source || 'boutique',
    managerId: data.managerId || 'm1',
    paymentMethod: data.paymentMethod || undefined,
    paymentAmount: data.paymentAmount || undefined,
    productPrice: data.productPrice || undefined,
    discount: data.discount || 0,
    discountAmount: data.discountAmount || 0,
    finalPrice: data.finalPrice || undefined,
    occasion: data.occasion || undefined,
    additionalInfo: data.additionalInfo || undefined,
    instagramAccount: data.instagramAccount || undefined,
    fulfillmentMethod: data.fulfillmentMethod || 'pickup',
    deliveryAddress: data.deliveryAddress || undefined,
    deliveryDate: data.deliveryDate || undefined,
    deliveryDateTime: data.deliveryDateTime || undefined,
    deliveryStatus: data.deliveryStatus || undefined,
    courierName: data.courierName || undefined,
    courierCarNumber: data.courierCarNumber || undefined,
    products: Array.isArray(data.products) ? data.products : [],
    packagingOptions: data.packagingOptions || { giftWrap: false, jewelryBox: false, card: false },
    packagingPrice: data.packagingPrice || 0,
    unitId: data.unitId || undefined,
    isInstallment: !!data.isInstallment,
    installments: Array.isArray(data.installments) ? data.installments : [],
    installmentTotal: data.installmentTotal || 0,
    installmentPlan: data.installmentPlan || undefined,
    whatsappStatus: data.whatsappStatus || undefined,
    whatsappConfirmedAt: data.whatsappConfirmedAt || undefined,
    whatsappConfirmedBy: data.whatsappConfirmedBy || undefined,
    communicationLog: Array.isArray(data.communicationLog) ? data.communicationLog : [],
    giftCertCode: data.giftCertCode || undefined,
    branchId: data.branchId || undefined,
    createdAt: data.createdAt || now,
  } as CRMLead;
}

function mapPrismaToLead(p: any): CRMLead {
  return {
    ...p,
    id: String(p.id),
    products: typeof p.products === 'string' ? JSON.parse(p.products || '[]') : (p.products || []),
    packagingOptions: typeof p.packagingOptions === 'string' ? JSON.parse(p.packagingOptions || '{}') : (p.packagingOptions || { giftWrap: false, jewelryBox: false, card: false }),
    installments: typeof p.installments === 'string' ? JSON.parse(p.installments || '[]') : (p.installments || []),
    installmentPlan: typeof p.installmentPlan === 'string' ? JSON.parse(p.installmentPlan || '{}') : (p.installmentPlan || undefined),
    communicationLog: typeof p.communicationLog === 'string' ? JSON.parse(p.communicationLog || '[]') : (p.communicationLog || []),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  } as CRMLead;
}

export async function getLeads(managerId?: string): Promise<CRMLead[]> {
  let base: CRMLead[] = [];
  try {
    const leads = await prisma.lead.findMany({
      where: managerId ? { managerId } : undefined,
      include: { client: true, productRef: true },
      orderBy: { createdAt: 'desc' }
    });
    base = leads.map(mapPrismaToLead);
  } catch {
    base = [];
  }
  const merged = applyOverlay(base);
  if (!managerId) return merged;
  return merged.filter((lead) => String(lead.managerId || '') === String(managerId));
}

export async function createLead(data: any): Promise<CRMLead> {
  const { products, packagingOptions, installments, installmentPlan, communicationLog, ...rest } = data;
  
  // Remove unknown fields that aren't in Prisma schema
  const { discountAmount: _da, unitId: _ui, giftCertCode: _gcc, ...safeRest } = rest;

  try {
    let clientId = data.clientId;
    if (!clientId && data.phone) {
      const existing = await prisma.client.findUnique({ where: { phone: data.phone } });
      if (existing) {
        clientId = existing.id;
      } else {
        const client = await prisma.client.create({
          data: {
            name: data.name || 'New Client',
            phone: data.phone,
            managerId: data.managerId,
            loyaltyStatus: 'Pearl'
          }
        });
        clientId = client.id;
      }
    }

    const p = await prisma.lead.create({
      data: {
        ...safeRest,
        clientId,
        products: JSON.stringify(products || []),
        packagingOptions: JSON.stringify(packagingOptions || { giftWrap: false, jewelryBox: false, card: false }),
        installments: JSON.stringify(installments || []),
        installmentPlan: JSON.stringify(installmentPlan || {}),
        communicationLog: JSON.stringify(communicationLog || []),
        productId: data.productId || null,
      }
    });
    return mapPrismaToLead(p);
  } catch {
    const overlay = readOverlay();
    const lead = normalizeLeadDefaults(
      {
        ...safeRest,
        products,
        packagingOptions,
        installments,
        installmentPlan,
        communicationLog,
      },
      `l${Date.now()}`
    );
    overlay.created.push(lead);
    overlay.deleted = overlay.deleted.filter((id) => id !== String(lead.id));
    writeOverlay(overlay);
    return lead;
  }
}

export async function updateLead(id: string, data: any): Promise<CRMLead> {
  const { products, packagingOptions, installments, installmentPlan, communicationLog, communicationLogEntry, ...rest } = data;

  // Strip fields not in Prisma schema
  const { discountAmount: _da, unitId: _ui, giftCertCode: _gcc, certCode: _cc, certApplied: _ca, ...safeRest } = rest;

  const updateData: any = { ...safeRest };
  
  if (products !== undefined) updateData.products = JSON.stringify(products);
  if (packagingOptions !== undefined) updateData.packagingOptions = JSON.stringify(packagingOptions);
  if (installments !== undefined) updateData.installments = JSON.stringify(installments);
  if (installmentPlan !== undefined) updateData.installmentPlan = JSON.stringify(installmentPlan);
  if (communicationLog !== undefined) updateData.communicationLog = JSON.stringify(communicationLog);

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: { client: true }
    });

    if (data.status === 'closed_won' && lead.clientId) {
      await prisma.client.update({
        where: { id: lead.clientId },
        data: {
          totalSpent: { increment: lead.finalPrice || 0 },
          loyaltyStatus: (lead.finalPrice || 0) > 5000000 ? 'Diamond' : (lead.finalPrice || 0) > 1000000 ? 'Emerald' : 'Pearl'
        }
      });
    }
    
    return mapPrismaToLead(lead);
  } catch {
    const sid = String(id);
    const overlay = readOverlay();
    const patch: Record<string, any> = { ...safeRest };
    if (products !== undefined) patch.products = products;
    if (packagingOptions !== undefined) patch.packagingOptions = packagingOptions;
    if (installments !== undefined) patch.installments = installments;
    if (installmentPlan !== undefined) patch.installmentPlan = installmentPlan;
    if (communicationLog !== undefined) patch.communicationLog = communicationLog;

    const createdIdx = overlay.created.findIndex((lead) => String(lead.id) === sid);
    if (createdIdx !== -1) {
      overlay.created[createdIdx] = { ...overlay.created[createdIdx], ...patch };
      writeOverlay(overlay);
      return overlay.created[createdIdx] as CRMLead;
    }

    overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...patch };
    writeOverlay(overlay);
    const current = (await getLeads()).find((lead) => String(lead.id) === sid) || normalizeLeadDefaults({}, sid);
    return { ...current, ...patch } as CRMLead;
  }
}

export async function deleteLead(id: string) {
  try {
    return await prisma.lead.delete({ where: { id } });
  } catch {
    const sid = String(id);
    const overlay = readOverlay();
    overlay.created = overlay.created.filter((lead) => String(lead.id) !== sid);
    delete overlay.updated[sid];
    if (!overlay.deleted.includes(sid)) overlay.deleted.push(sid);
    writeOverlay(overlay);
    return { id: sid };
  }
}

export async function getClients(managerId?: string) {
  return await prisma.client.findMany({
    where: managerId ? { managerId } : undefined,
    orderBy: { totalSpent: 'desc' }
  });
}

export async function getUpcomingAnniversaries() {
  const clients = await prisma.client.findMany();
  const today = new Date();
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return clients.filter(c => {
    if (!c.birthday && !c.anniversary) return false;
    const bday = c.birthday ? new Date(c.birthday) : null;
    const anniv = c.anniversary ? new Date(c.anniversary) : null;
    
    const isThisMonth = (d: Date) => {
      return d.getMonth() === today.getMonth() || d.getMonth() === nextMonth.getMonth();
    };
    
    return (bday && isThisMonth(bday)) || (anniv && isThisMonth(anniv));
  });
}
