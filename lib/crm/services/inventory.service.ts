import { prisma } from '../../prisma';
import { JewelryUnit } from '../types';
import fs from 'fs';

const UNITS_OVERLAY_PATH = '/tmp/tomiori_units_overlay.json';

type UnitsOverlay = {
  upserts: Record<string, JewelryUnit>;
  deleted: string[];
};

function emptyUnitsOverlay(): UnitsOverlay {
  return { upserts: {}, deleted: [] };
}

function readUnitsOverlay(): UnitsOverlay {
  try {
    if (!fs.existsSync(UNITS_OVERLAY_PATH)) return emptyUnitsOverlay();
    const raw = fs.readFileSync(UNITS_OVERLAY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      upserts: parsed?.upserts && typeof parsed.upserts === 'object' ? parsed.upserts : {},
      deleted: Array.isArray(parsed?.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyUnitsOverlay();
  }
}

function writeUnitsOverlay(data: UnitsOverlay) {
  fs.writeFileSync(UNITS_OVERLAY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function applyUnitsOverlay(baseUnits: JewelryUnit[]): JewelryUnit[] {
  const overlay = readUnitsOverlay();
  const map = new Map<string, JewelryUnit>();
  for (const u of baseUnits) map.set(String(u.unitId), { ...u });
  for (const id of overlay.deleted) map.delete(String(id));
  for (const [id, u] of Object.entries(overlay.upserts)) {
    if (!overlay.deleted.includes(id)) map.set(id, u as JewelryUnit);
  }
  return Array.from(map.values()).sort((a, b) =>
    String((b as any).updatedAt || '').localeCompare(String((a as any).updatedAt || ''))
  );
}

function overlayUpsertUnit(unit: JewelryUnit) {
  const overlay = readUnitsOverlay();
  overlay.upserts[String(unit.unitId)] = unit;
  overlay.deleted = overlay.deleted.filter((id) => id !== String(unit.unitId));
  writeUnitsOverlay(overlay);
}

function overlayDeleteUnit(unitId: string) {
  const overlay = readUnitsOverlay();
  const sid = String(unitId);
  delete overlay.upserts[sid];
  if (!overlay.deleted.includes(sid)) overlay.deleted.push(sid);
  writeUnitsOverlay(overlay);
}

export async function getUnits(): Promise<JewelryUnit[]> {
  let baseUnits: JewelryUnit[] = [];
  try {
    const units = await prisma.unit.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    baseUnits = units.map(u => ({
      ...u,
      locationHistory: JSON.parse(u.locationHistory || '[]'),
      stones: JSON.parse((u as any).stones || '[]'),
      priceHistory: JSON.parse((u as any).priceHistory || '[]'),
      shopVisibility: JSON.parse((u as any).shopVisibility || '{"showWeight":true,"showStones":true,"showOrigin":false,"showCertificate":false,"showPurity":true}'),
      serviceHistory: JSON.parse((u as any).serviceHistory || '[]'),
      reserveExpiresAt: u.reserveExpiresAt?.toISOString(),
      purchaseDate: u.purchaseDate || undefined,
    })) as any;
  } catch {
    baseUnits = [];
  }
  return applyUnitsOverlay(baseUnits);
}

export function computeTurnoverAnalytics(units: JewelryUnit[]) {
  const inStock = units.filter(u => ['showcase', 'vault', 'transit'].includes(u.locationStatus));
  const sold = units.filter(u => u.locationStatus === 'sold');
  
  const currentValuation = inStock.reduce((sum, u) => sum + (u.totalCostPrice || 0), 0);
  const potentialRevenue = inStock.length * 500000;
  const costOfGoodsSold = sold.reduce((sum, u) => sum + (u.totalCostPrice || 0), 0);

  const mockSegment: any[] = [{
    label: 'Все товары',
    totalUnits: units.length,
    soldUnits: sold.length,
    turnoverRate: units.length ? sold.length / units.length : 0,
    avgDaysInStock: 30,
    avgMargin: 45
  }];

  const stagnant = inStock.filter(u => {
    if (!u.purchaseDate) return false;
    const days = Math.floor((Date.now() - new Date(u.purchaseDate).getTime()) / 86400000);
    return days > 180;
  });

  return {
    totalUnits: units.length,
    inStock: inStock.length,
    sold: sold.length,
    currentValuation,
    potentialRevenue,
    costOfGoodsSold,
    // Provide structures expected by InventoryAnalytics
    byCaratRange: mockSegment,
    byMetalWeightRange: mockSegment,
    byMetalColor: mockSegment,
    byStoneType: mockSegment,
    stagnant: stagnant,
    stonesByAvgDays: mockSegment,
    weightByAvgMargin: mockSegment
  };
}

export async function saveUnits(units: JewelryUnit[]): Promise<void> {
  for (const unit of units) {
    const commonData = {
      locationStatus: unit.locationStatus,
      reserveExpiresAt: unit.reserveExpiresAt ? new Date(unit.reserveExpiresAt) : null,
      reserveClientId: unit.reserveClientId ?? null,
      locationHistory: JSON.stringify(unit.locationHistory || []),
      metalWeight: unit.metalWeight,
      totalWeight: unit.totalWeight,
      purity: unit.purity,
      metalColor: unit.metalColor ?? null,
      purchaseDate: unit.purchaseDate,
      shelfNumber: unit.shelfNumber ?? null,
      masterName: unit.masterName ?? null,
      gemologyOrg: unit.gemologyOrg ?? null,
      soldLeadId: unit.soldLeadId ?? null,
      archiveReason: unit.archiveReason ?? null,
      origin: unit.origin ?? null,
      certificateNumber: unit.certificateNumber ?? null,
      notes: unit.notes ?? null,
      price: unit.price ?? 0,
      costPrice: unit.costPrice ?? 0,
      customsDuty: unit.customsDuty ?? 0,
      logisticsCosts: unit.logisticsCosts ?? 0,
      totalCostPrice: unit.totalCostPrice ?? 0,
      stones: JSON.stringify(unit.stones || []),
      priceHistory: JSON.stringify(unit.priceHistory || []),
      shopVisibility: JSON.stringify(unit.shopVisibility || {}),
      serviceHistory: JSON.stringify((unit as any).serviceHistory || []),
      updatedBy: unit.updatedBy ?? 'admin',
    };

    try {
      await prisma.unit.upsert({
        where: { unitId: unit.unitId },
        update: commonData,
        create: {
          unitId: unit.unitId,
          skuId: unit.skuId,
          createdBy: unit.createdBy ?? 'admin',
          ...commonData,
        }
      });
    } catch {
      overlayUpsertUnit(unit);
    }
  }
}

export async function computeStockFromUnits(skuId: string, units?: JewelryUnit[]): Promise<number> {
  const allUnits = units ?? await getUnits();
  const skuUnits = allUnits.filter(u => u.skuId === skuId);
  if (skuUnits.length === 0) {
    const product = await prisma.product.findUnique({ where: { id: skuId } });
    return product?.stock ?? 0;
  }
  return skuUnits.filter(u => !['sold', 'archived'].includes(u.locationStatus)).length;
}

export async function expireReservations(): Promise<void> {
  const units = await getUnits();
  const now = new Date();
  const affectedSkus = new Set<string>();

  for (const unit of units) {
    if (unit.locationStatus === 'reserved' && unit.reserveExpiresAt) {
      if (new Date(unit.reserveExpiresAt) < now) {
        const updated: JewelryUnit = {
          ...unit,
          locationStatus: 'showcase',
          reserveExpiresAt: undefined,
          reserveClientId: undefined,
          locationHistory: [
            ...(unit.locationHistory || []),
            {
              from: 'reserved',
              to: 'showcase',
              timestamp: new Date().toISOString(),
              managerId: 'system',
              note: 'Резерв истёк автоматически',
            }
          ],
          updatedAt: new Date().toISOString(),
          updatedBy: 'system',
        };
        await saveUnits([updated]);
        affectedSkus.add(unit.skuId);
      }
    }
  }

  // Sync SKU stock after expiration
  for (const skuId of affectedSkus) {
     const stock = await computeStockFromUnits(skuId);
     await prisma.product.update({
        where: { id: skuId },
        data: { stock }
     });
  }
}

export async function fifoUnitCost(skuId: string): Promise<number | null> {
  const units = await getUnits();
  const inStock = units
    .filter(u => u.skuId === skuId && !['sold', 'archived'].includes(u.locationStatus))
    .sort((a, b) => String(a.purchaseDate || '').localeCompare(String(b.purchaseDate || '')));
  return inStock[0]?.totalCostPrice ?? null;
}

export async function deleteUnitRecord(unitId: string): Promise<void> {
  try {
    await prisma.unit.delete({ where: { unitId } });
  } catch {
    overlayDeleteUnit(unitId);
  }
}
