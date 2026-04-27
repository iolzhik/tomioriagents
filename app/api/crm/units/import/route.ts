import { NextResponse } from 'next/server';
import { getUnits, saveUnits, computeStockFromUnits, getProducts, updateProduct, JewelryUnit } from '@/lib/crm-service';

const REQUIRED = ['unitId', 'skuId', 'metalWeight', 'totalWeight', 'purity', 'purchaseDate'];

function validateUnit(unit: any): { valid: boolean; missingFields: string[] } {
  const missingFields = REQUIRED.filter(f => unit[f] === undefined || unit[f] === null || unit[f] === '');
  return { valid: missingFields.length === 0, missingFields };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected array of JewelryUnit' }, { status: 400 });
    }

    const invalidRecords: { index: number; unitId?: string; missingFields: string[] }[] = [];
    for (let i = 0; i < body.length; i++) {
      const { valid, missingFields } = validateUnit(body[i]);
      if (!valid) invalidRecords.push({ index: i, unitId: body[i].unitId, missingFields });
    }
    if (invalidRecords.length > 0) return NextResponse.json({ success: false, error: 'Invalid records in batch', invalidRecords }, { status: 400 });

    await saveUnits(body as JewelryUnit[]);

    // Recompute stock for all affected SKUs
    const affectedSkus = new Set((body as JewelryUnit[]).map(u => u.skuId));
    for (const skuId of affectedSkus) {
       const stock = await computeStockFromUnits(skuId);
       await updateProduct(skuId, { stock });
    }

    return NextResponse.json({ success: true, imported: body.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
