import { NextResponse } from 'next/server';
import { getProducts, createProduct, updateProduct, deleteProduct, saveAuditLog, getManagers } from '@/lib/crm-service';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ success: true, products });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const product = await createProduct(data);
    
    // Audit log (non-blocking in readonly mode)
    try {
      const managers = await getManagers();
      const manager = managers.find(m => m.id === data.managerId) || managers[0];
      if (manager) {
        await saveAuditLog({
          managerId: manager.id,
          managerName: manager.name,
          action: 'CREATE_PRODUCT',
          details: `Создан новый товар: ${product.name} (${product.article})`,
          targetId: product.id
        });
      }
    } catch {}

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, managerId, ...updates } = data;
    const product = await updateProduct(id, updates);
    
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
