import { NextResponse } from 'next/server';
import {
  getUnits, saveUnits, computeStockFromUnits, expireReservations, deleteUnitRecord,
  getProducts, updateProduct, saveAuditLog, getManagers,
  JewelryUnit, LocationStatus, PriceHistoryEntry, LocationHistoryEntry,
} from '@/lib/crm-service';
import { prisma } from '@/lib/prisma';
import { listTransfers } from '@/lib/crm/services/transfer.service';

const REQUIRED_FIELDS = ['skuId', 'metalWeight', 'totalWeight', 'purity', 'purchaseDate'];

const STATUS_REQUIRED: Partial<Record<LocationStatus, string[]>> = {
  showcase: ['shelfNumber'],
  cleaning: ['masterName'],
  reserved: ['reserveClientId', 'reserveExpiresAt'],
  sold: ['soldLeadId'],
  gemology: [],
  photoshoot: [],
  service: [],
  archived: [],
};

function validateStatusFields(status: LocationStatus, data: any): string | null {
  const required = STATUS_REQUIRED[status] ?? [];
  for (const f of required) {
    if (!data[f]) return `Missing field for status transition: ${f}`;
  }
  return null;
}

function makeUnitId(skuId: string): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `unit-${skuId}-${Date.now()}-${rand}`;
}

function defaultShopVisibility() {
  return { showWeight: true, showStones: true, showOrigin: false, showCertificate: false, showPurity: true };
}

// Auto-create accounting expense for cleaning/service
async function createServiceExpense(unit: JewelryUnit, status: 'cleaning' | 'service', amount: number, description: string) {
  if (!amount || amount <= 0) return;
  const category = status === 'cleaning' ? 'Ремонт изделия' : 'Сервис изделия';
  try {
    await prisma.accountingEntry.create({
      data: {
        type: 'expense',
        category,
        amount,
        description: description || `${category}: ${unit.unitId}`,
        isConfirmed: false,
        timestamp: new Date(),
      }
    });
  } catch {
    // Ignore accounting write failures in readonly mode.
  }
}

export async function GET(req: Request) {
  await expireReservations();
  const { searchParams } = new URL(req.url);
  const skuId = searchParams.get('skuId');
  const locationStatus = searchParams.get('locationStatus') as LocationStatus | null;
  const available = searchParams.get('available');

  const stoneOrigin = searchParams.get('stoneOrigin');

  let units = await getUnits();
  if (skuId) units = units.filter(u => u.skuId === skuId);
  if (locationStatus) units = units.filter(u => u.locationStatus === locationStatus);
  if (available === 'true') units = units.filter(u => u.locationStatus === 'showcase');
  if (stoneOrigin) units = units.filter(u => u.stones?.some(s => s.stoneOrigin === stoneOrigin));

  return NextResponse.json({ success: true, units });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const missing = REQUIRED_FIELDS.filter(f => data[f] === undefined || data[f] === null || data[f] === '');
    if (missing.length > 0) return NextResponse.json({ success: false, error: 'Missing required fields', fields: missing }, { status: 400 });

    const quantity = Math.max(1, parseInt(data.quantity) || 1);
    const now = new Date().toISOString();
    const managerId = data.createdBy || 'admin';

    const created: JewelryUnit[] = [];
    for (let i = 0; i < quantity; i++) {
      const unitId = makeUnitId(data.skuId);
      const initialPrice: PriceHistoryEntry = {
        id: `ph-${unitId}-0`,
        timestamp: now,
        price: data.price || 0,
        costPrice: data.costPrice || 0,
        customsDuty: data.customsDuty || 0,
        logisticsCosts: data.logisticsCosts || 0,
        totalCostPrice: data.totalCostPrice || 0,
        changedBy: managerId,
        reason: 'initial',
      };
      const unit: JewelryUnit = {
        unitId,
        skuId: data.skuId,
        metalWeight: data.metalWeight,
        totalWeight: data.totalWeight,
        purity: data.purity,
        purchaseDate: data.purchaseDate,
        locationStatus: 'showcase',
        locationHistory: [{ from: 'showcase', to: 'showcase', timestamp: now, managerId, note: 'Поступление на склад' }],
        shelfNumber: data.shelfNumber,
        stones: data.stones || [],
        price: data.price || 0,
        costPrice: data.costPrice || 0,
        customsDuty: data.customsDuty || 0,
        logisticsCosts: data.logisticsCosts || 0,
        totalCostPrice: data.totalCostPrice || 0,
        priceHistory: [initialPrice],
        shopVisibility: data.shopVisibility || defaultShopVisibility(),
        origin: data.origin,
        certificateNumber: data.certificateNumber,
        metalColor: data.metalColor,
        notes: data.notes,
        createdAt: now, createdBy: managerId,
        updatedAt: now, updatedBy: managerId,
      };
      created.push(unit);
    }

    await saveUnits(created);

    // Sync SKU stock
    const stock = await computeStockFromUnits(data.skuId);
    await updateProduct(data.skuId, { stock });

    // Audit log — skip if managerId is not a real manager
    try {
      const managers = await getManagers();
      const manager = managers.find(m => m.id === managerId);
      if (manager) {
        await saveAuditLog({
          managerId,
          action: 'CREATE_UNITS',
          details: `Создано ${created.length} экземпляров для SKU ${data.skuId}`,
        });
      }
    } catch {}

    return NextResponse.json({ success: true, units: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { unitId, priceHistory: _ph, ...updates } = data;
    if (!unitId) return NextResponse.json({ success: false, error: 'unitId required' }, { status: 400 });

    const managerId = updates.updatedBy || updates.requestManagerId || 'admin';

    // Location change requires an approved transfer (unless admin or direct assignment flag)
    if (updates.currentLocation) {
      // If directAssign flag is set, skip transfer check (admin already verified on client)
      const isDirectAssign = updates.directAssign === true;
      if (!isDirectAssign) {
        const managers = await getManagers();
        const requestingManager = managers.find(m => m.id === managerId);
        const isAdminRole = requestingManager?.role === 'admin';
        if (!isAdminRole) {
          const approvedTransfers = listTransfers({ unitId, status: 'approved' });
          const hasApproved = approvedTransfers.some(t =>
            t.toLocation?.warehouseId === updates.currentLocation?.warehouseId &&
            t.toLocation?.branchId === updates.currentLocation?.branchId
          );
          if (!hasApproved) {
            return NextResponse.json({ success: false, error: 'Location change requires an approved transfer' }, { status: 403 });
          }
        }
      }
      // Always append to locationTracking on location change
      const allUnits = await getUnits();
      const existingUnit = allUnits.find(u => u.unitId === unitId);
      if (existingUnit) {
        const trackingEntry = {
          previousLocation: (existingUnit as any).currentLocation ?? {},
          newLocation: updates.currentLocation,
          timestamp: new Date().toISOString(),
          changedBy: managerId,
          changeReason: updates.currentLocation.note || 'Назначение местонахождения',
        };
        updates.locationTracking = [...((existingUnit as any).locationTracking ?? []), trackingEntry];
      }
      // Remove internal flags from updates
      delete updates.directAssign;
    }

    const units = await getUnits();
    const idx = units.findIndex(u => u.unitId === unitId);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });

    const unit = units[idx];
    const now = new Date().toISOString();
    const newStatus: LocationStatus | undefined = updates.locationStatus;

    if (newStatus && newStatus !== unit.locationStatus) {
      const err = validateStatusFields(newStatus, updates);
      if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

      unit.locationHistory.push({
        from: unit.locationStatus,
        to: newStatus,
        timestamp: now,
        managerId,
        note: updates.locationNote,
      });

      // Service history + auto accounting expense
      if (newStatus === 'cleaning' || newStatus === 'service') {
        const amount = Number(updates.serviceAmount) || 0;
        const desc = updates.serviceDescription || (newStatus === 'cleaning' ? `Чистка: ${unit.unitId}` : `Сервис: ${unit.unitId}`);
        const serviceEntry = {
          id: `svc-${unitId}-${Date.now()}`,
          type: newStatus,
          timestamp: now,
          masterName: updates.masterName || updates.serviceProvider || '',
          amount,
          description: desc,
          managerId,
        };
        const existing: any[] = (unit as any).serviceHistory || [];
        (unit as any).serviceHistory = [...existing, serviceEntry];

        if (amount > 0) {
          await createServiceExpense(unit, newStatus, amount, desc);
        }
      }
    }

    Object.assign(unit, updates, { updatedAt: now, updatedBy: managerId });
    await saveUnits([unit]);

    const stock = await computeStockFromUnits(unit.skuId);
    await updateProduct(unit.skuId, { stock });

    return NextResponse.json({ success: true, unit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId');
    if (!unitId) return NextResponse.json({ success: false, error: 'unitId required' }, { status: 400 });

    const units = await getUnits();
    const unit = units.find(u => u.unitId === unitId);
    if (!unit) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });

    if (unit.locationStatus === 'sold') return NextResponse.json({ success: false, error: 'Нельзя удалить проданный экземпляр' }, { status: 400 });

    await deleteUnitRecord(unitId);

    const stock = await computeStockFromUnits(unit.skuId);
    await updateProduct(unit.skuId, { stock });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
