import { NextResponse } from 'next/server';
import { listWarehouses, saveWarehouse } from '@/lib/crm/services/warehouse.service';

export async function GET() {
  try {
    const warehouses = listWarehouses();
    return NextResponse.json({ success: true, warehouses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { warehouseId, name, branchId, address, managerId, requestManagerId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Название склада обязательно' },
        { status: 400 }
      );
    }

    const warehouse = {
      warehouseId:
        warehouseId ||
        'warehouse-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name,
      branchId: branchId || '',
      address: address || '',
      managerId: managerId || requestManagerId || 'admin',
      isActive: true,
    };

    const saved = saveWarehouse(warehouse);
    return NextResponse.json({ success: true, warehouse: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
