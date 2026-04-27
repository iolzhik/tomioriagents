import { NextResponse } from 'next/server';
import { getProducts, updateProduct, createAccountingEntry, saveAuditLog, getManagers, AccountingEntry } from '@/lib/crm-service';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const order = data.order;
    const action = data.action; // 'issue' or 'refund'
    
    if (!order || !order.items) {
      return NextResponse.json({ success: false, error: 'Invalid order payload' }, { status: 400 });
    }

    const products = await getProducts();
    for (const item of order.items) {
      const p = products.find((prod: any) => prod.id === item.productId);
      if (p) {
        let newStock = p.stock;
        if (action === 'issue') {
           newStock = Math.max(0, p.stock - (item.quantity || 1));
        } else if (action === 'refund') {
           newStock = p.stock + (item.quantity || 1);
        }
        await updateProduct(p.id, { stock: newStock });
      }
    }

    const amount = order.total || 0;
    const vatAmount = Math.round(amount - (amount / 1.12));
    const incomeTaxAmount = Math.round(amount * 0.03);
    
    if (action === 'issue') {
      const entry = await createAccountingEntry({
        timestamp: new Date(),
        type: 'income',
        category: 'Продажа изделия (Интернет-магазин)',
        amount: amount,
        description: `Автоматическое зачисление по заказу #${order.id} с сайта. Способ оплаты: ${order.payment}, Доставка: ${order.delivery}`,
        leadId: `web-${order.id}`,
        managerId: 'm1',
        isConfirmed: false,
        taxDetails: JSON.stringify({ vat: vatAmount, incomeTax: incomeTaxAmount })
      });
      
      await saveAuditLog({ managerId: 'm1', managerName: 'Система', action: 'STORE_ORDER_ISSUED', details: `Магазин: Заказ #${order.id} выдан клиенту. Товар списан со склада.`, targetId: order.id });
    } else if (action === 'refund') {
      await createAccountingEntry({
        timestamp: new Date(),
        type: 'expense',
        category: 'Возврат (Интернет-магазин)',
        amount: -amount,
        description: `Возврат по заказу #${order.id} с сайта.`,
        managerId: 'm1',
        isConfirmed: false
      });
      
      await saveAuditLog({ managerId: 'm1', managerName: 'Система', action: 'STORE_ORDER_REFUND', details: `Магазин: Возврат заказа #${order.id}. Товар возвращен на склад.`, targetId: order.id });
    }
    
    return NextResponse.json({ success: true, message: `Order ${action} processed successfully.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
