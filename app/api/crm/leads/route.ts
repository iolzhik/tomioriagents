import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  getLeads, createLead, updateLead, deleteLead,
  saveAuditLog, getManagers, ensureAccountingEntryForLead, 
  getUnits, saveUnits, computeStockFromUnits, 
  getProducts, updateProduct 
} from '@/lib/crm-service';

export async function GET() {
  const leads = await getLeads();
  return NextResponse.json({ success: true, leads });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // CRM 2.0: Create via async service (handles Client creation internally)
    const lead = await createLead({
      name: data.name || '',
      phone: data.phone || '',
      product: data.product || '',
      productId: data.productId,
      products: data.products || [],
      packagingOptions: data.packagingOptions || { giftWrap: false, jewelryBox: false, card: false },
      packagingPrice: data.packagingPrice || 0,
      managerId: data.managerId || 'm1',
      status: data.status || 'new',
      source: data.source || 'boutique',
      instagramAccount: data.instagramAccount,
      paymentMethod: data.paymentMethod,
      paymentAmount: data.paymentAmount,
      productPrice: data.productPrice,
      discount: data.discount || 0,
      finalPrice: data.finalPrice,
      occasion: data.occasion,
      additionalInfo: data.additionalInfo,
      fulfillmentMethod: data.fulfillmentMethod || 'pickup',
      deliveryAddress: data.deliveryAddress,
      deliveryDate: data.deliveryDate,
    });

    // Sync to Standalone Shop if it's a website order
    if (lead.source === 'website') {
      try {
        const shopOrdersPath = path.join(process.cwd(), 'shop-standalone', 'data', 'orders.json');
        const shopDataDir = path.dirname(shopOrdersPath);
        if (!fs.existsSync(shopDataDir)) fs.mkdirSync(shopDataDir, { recursive: true });
        
        const shopOrders = fs.existsSync(shopOrdersPath) ? JSON.parse(fs.readFileSync(shopOrdersPath, 'utf8')) : [];
        shopOrders.push({
          id: 'MAIN-' + lead.id,
          name: lead.name,
          phone: lead.phone,
          address: lead.deliveryAddress || '',
          total: lead.finalPrice || lead.productPrice || 0,
          items: lead.products || [],
          status: 'new',
          created_at: lead.createdAt,
          payment: lead.paymentMethod || 'card',
          delivery: lead.fulfillmentMethod
        });
        fs.writeFileSync(shopOrdersPath, JSON.stringify(shopOrders, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to sync lead to shop-standalone:', e);
      }
    }

    if (lead.status === 'closed_won') {
      await ensureAccountingEntryForLead(lead, lead.managerId);
    }

    const managers = await getManagers();
    const manager = managers.find(m => m.id === lead.managerId);
    if (manager) {
      await saveAuditLog({
        managerId: manager.id,
        managerName: manager.name,
        action: 'CREATE_LEAD',
        details: `Создан новый лид: ${lead.name} (${lead.product})`,
        targetId: lead.id.toString()
      });
    }
    
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, managerId, ...updates } = data;
    
    const oldLeads = await getLeads();
    const existing = oldLeads.find(l => l.id.toString() === id.toString());
    if (!existing) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    const oldStatus = existing.status;
    const newStatus = updates.status;

    // Append communicationLogEntry to existing communicationLog
    if (updates.communicationLogEntry) {
      const existingLog = existing.communicationLog || [];
      updates.communicationLog = [...existingLog, updates.communicationLogEntry];
      delete updates.communicationLogEntry;
    }

    // Auto-set whatsappConfirmedAt/By for manual_confirmed
    if (updates.whatsappStatus === 'manual_confirmed' && !updates.whatsappConfirmedAt) {
      updates.whatsappConfirmedAt = new Date().toISOString();
      updates.whatsappConfirmedBy = managerId;
    }

    const lead = await updateLead(String(id), updates);
    
    const managers = await getManagers();
    const performingManager = managers.find(m => m.id === managerId) || managers.find(m => m.id === lead.managerId);
    
    if (performingManager) {
      let actionDetails = `Обновлен лид #${id}`;
      if (newStatus && newStatus !== oldStatus) {
        actionDetails = `Статус лида #${id} изменен с ${oldStatus} на ${newStatus}`;
      }
      
      await saveAuditLog({
        managerId: performingManager.id,
        managerName: performingManager.name,
        action: 'UPDATE_LEAD',
        details: actionDetails,
        targetId: id.toString()
      });

      if (newStatus === 'closed_won' && oldStatus !== 'closed_won') {
        const unitId = (lead as any).unitId || updates.unitId;
        if (unitId) {
          const units = await getUnits();
          const unit = units.find(u => u.unitId === unitId);
          if (unit && unit.locationStatus !== 'sold') {
            unit.locationHistory.push({
              from: unit.locationStatus,
              to: 'sold',
              timestamp: new Date().toISOString(),
              managerId: performingManager.id,
              note: `Продан по лиду #${id} · ${lead.name}`,
            });
            unit.locationStatus = 'sold';
            unit.soldLeadId = id.toString();
            unit.updatedAt = new Date().toISOString();
            unit.updatedBy = performingManager.id;
            await saveUnits([unit]);
            const stock = await computeStockFromUnits(unit.skuId);
            await updateProduct(unit.skuId, { stock });
          }
        } else {
          await saveAuditLog({
            managerId: performingManager.id,
            action: 'LEAD_CLOSED_NO_UNIT',
            details: `Лид #${id} закрыт без указания экземпляра ТМЦ`,
            targetId: id.toString(),
          });
        }
        await ensureAccountingEntryForLead(lead, performingManager.id);
      }

      // Возврат: closed_lost → unit обратно на витрину
      if (newStatus === 'closed_lost' && oldStatus === 'closed_won') {
        const unitId = (lead as any).unitId || updates.unitId || (existing as any).unitId;
        if (unitId) {
          const units = await getUnits();
          const unit = units.find(u => u.unitId === unitId);
          if (unit && unit.locationStatus === 'sold') {
            unit.locationHistory.push({
              from: 'sold',
              to: 'showcase',
              timestamp: new Date().toISOString(),
              managerId: performingManager.id,
              note: `Возврат по лиду #${id} · ${lead.name}`,
            });
            unit.locationStatus = 'showcase';
            unit.soldLeadId = undefined;
            unit.updatedAt = new Date().toISOString();
            unit.updatedBy = performingManager.id;
            await saveUnits([unit]);
            const stock = await computeStockFromUnits(unit.skuId);
            await updateProduct(unit.skuId, { stock });
          }
        }
      }

      // Резерв при переходе в переговоры
      if (newStatus === 'closed_lost' && oldStatus !== 'closed_won') {
        // просто снять резерв если был
        const unitId = (lead as any).unitId || (existing as any).unitId;
        if (unitId) {
          const units = await getUnits();
          const unit = units.find(u => u.unitId === unitId);
          if (unit && unit.locationStatus === 'reserved') {
            unit.locationHistory.push({
              from: 'reserved',
              to: 'showcase',
              timestamp: new Date().toISOString(),
              managerId: performingManager.id,
              note: `Резерв снят — лид #${id} закрыт`,
            });
            unit.locationStatus = 'showcase';
            unit.reserveClientId = undefined;
            unit.reserveExpiresAt = undefined;
            unit.updatedAt = new Date().toISOString();
            unit.updatedBy = performingManager.id;
            await saveUnits([unit]);
            const stock = await computeStockFromUnits(unit.skuId);
            await updateProduct(unit.skuId, { stock });
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const managerId = searchParams.get('managerId');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    
    await deleteLead(id);

    const managers = await getManagers();
    const manager = managers.find(m => m.id === managerId);
    if (manager) {
      await saveAuditLog({
        managerId: manager.id,
        managerName: manager.name,
        action: 'DELETE_LEAD',
        details: `Удален лид #${id}`,
        targetId: id.toString()
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
