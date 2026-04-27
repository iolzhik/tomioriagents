import { NextResponse } from 'next/server';
import { 
  getAccountingEntries, 
  createAccountingEntry, 
  updateAccountingEntry, 
  deleteAccountingEntry,
  saveAuditLog,
  getManagers
} from '@/lib/crm-service';

export async function GET() {
  try {
    const entries = await getAccountingEntries();
    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { managerId, ...entryData } = data;
    
    const managers = await getManagers();
    const manager = managers.find(m => m.id === managerId);

    const entry = await createAccountingEntry({
      ...entryData,
      managerId: managerId || 'm1',
      timestamp: new Date()
    });

    if (manager) {
      await saveAuditLog({
        managerId,
        managerName: manager.name,
        action: 'CREATE_ACCOUNTING_ENTRY',
        details: `Создана бухгалтерская запись: ${entry.type === 'income' ? 'Доход' : 'Расход'} ${entry.amount} ₸ (${entry.category})`,
        targetId: entry.id
      });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, managerId, ...updates } = data;
    
    const managers = await getManagers();
    const manager = managers.find(m => m.id === managerId);

    const updated = await updateAccountingEntry(id, updates);
    
    if (updated && manager) {
      await saveAuditLog({
        managerId,
        managerName: manager.name,
        action: 'UPDATE_ACCOUNTING_ENTRY',
        details: `Обновлена бухгалтерская запись: ${updated.id}`,
        targetId: updated.id
      });
    }

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const managerId = searchParams.get('managerId');
    
    if (!id || !managerId) return NextResponse.json({ success: false, error: 'ID and managerId required' }, { status: 400 });

    const managers = await getManagers();
    const manager = managers.find(m => m.id === managerId);
    
    await deleteAccountingEntry(id);

    if (manager) {
      await saveAuditLog({
        managerId,
        managerName: manager.name,
        action: 'DELETE_ACCOUNTING_ENTRY',
        details: `Удалена бухгалтерская запись: ${id}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
