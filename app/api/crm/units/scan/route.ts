import { NextResponse } from 'next/server';
import { getUnits, getProducts } from '@/lib/crm-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    const units = await getUnits();
    // Search by full unitId or short suffix (last 2 parts)
    const unit = units.find(u =>
      u.unitId === id ||
      u.unitId.split('-').slice(-2).join('-').toUpperCase() === id.toUpperCase() ||
      u.unitId.includes(id)
    );

    if (!unit) return NextResponse.json({ success: false, error: 'Изделие не найдено' }, { status: 404 });

    const products = await getProducts();
    const product = products.find(p => p.id === unit.skuId);

    return NextResponse.json({ success: true, unit, product: product || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
