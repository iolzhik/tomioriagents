import { NextResponse } from 'next/server';
import { getUnits, saveUnits, computeStockFromUnits, getProducts, updateProduct } from '@/lib/crm-service';

export async function POST(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const { unitId } = await params;
    const { clientId, durationMinutes = 30 } = await req.json();

    if (!clientId) return NextResponse.json({ success: false, error: 'clientId required' }, { status: 400 });

    const units = await getUnits();
    const idx = units.findIndex(u => u.unitId === unitId);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });

    const unit = units[idx];
    if (unit.locationStatus === 'reserved') {
      return NextResponse.json({ success: false, error: 'Экземпляр уже зарезервирован' }, { status: 409 });
    }
    if (['sold', 'archived'].includes(unit.locationStatus)) {
      return NextResponse.json({ success: false, error: 'Экземпляр недоступен для резервирования' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    unit.locationHistory.push({ from: unit.locationStatus, to: 'reserved', timestamp: now, managerId: clientId });
    unit.locationStatus = 'reserved';
    unit.reserveClientId = clientId;
    unit.reserveExpiresAt = expiresAt;
    unit.updatedAt = now;
    unit.updatedBy = clientId;
    
    await saveUnits([unit]);

    const stock = await computeStockFromUnits(unit.skuId);
    await updateProduct(unit.skuId, { stock });

    return NextResponse.json({ success: true, unit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const { unitId } = await params;
    const units = await getUnits();
    const idx = units.findIndex(u => u.unitId === unitId);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 404 });

    const unit = units[idx];
    const now = new Date().toISOString();

    unit.locationHistory.push({ from: 'reserved', to: 'showcase', timestamp: now, managerId: 'system', note: 'Резерв снят' });
    unit.locationStatus = 'showcase';
    unit.reserveClientId = undefined;
    unit.reserveExpiresAt = undefined;
    unit.updatedAt = now;
    unit.updatedBy = 'system';
    
    await saveUnits([unit]);

    const stock = await computeStockFromUnits(unit.skuId);
    await updateProduct(unit.skuId, { stock });

    return NextResponse.json({ success: true, unit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
