import { NextResponse } from 'next/server';
import {
  getSalaryPayments, saveSalaryPayment, updateSalaryPayment, deleteSalaryPayment,
  getSalaryPlans, saveSalaryPlan, calculateManagerSalary,
  getManagers, saveAuditLog, createAccountingEntry
} from '@/lib/crm-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'payments' | 'plans' | 'calc'
  const managerId = searchParams.get('managerId');
  const month = searchParams.get('month'); // YYYY-MM

  try {
    if (type === 'plans') {
      const plans = await getSalaryPlans();
      return NextResponse.json({ success: true, plans });
    }
    if (type === 'calc' && managerId && month) {
      const result = await calculateManagerSalary(managerId, month);
      return NextResponse.json({ success: true, calc: result });
    }
    // Default: payments
    const payments = await getSalaryPayments(managerId || undefined);
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const managers = await getManagers();

    if (data.action === 'save_plan') {
      const plan = await saveSalaryPlan({
        managerId: data.managerId,
        type: data.type || 'fixed_bonus',
        fixedSalary: Number(data.fixedSalary || 0),
        bonusPercent: Number(data.bonusPercent || 0),
        monthlyPlan: Number(data.monthlyPlan || 0),
        planBonusPercent: Number(data.planBonusPercent || 0),
      });

      const manager = managers.find(m => m.id === data.managerId);
      const creator = managers.find(m => m.id === (data.createdBy || 'admin'));

      await saveAuditLog({
        managerId: data.createdBy || 'm1',
        managerName: creator?.name || 'Система',
        action: 'SAVE_SALARY_PLAN',
        details: `Обновлён план зарплаты для ${manager?.name || data.managerId}`,
        targetId: data.managerId
      });
      return NextResponse.json({ success: true, plan });
    }

    // Add payment
    const manager = managers.find(m => m.id === data.managerId);
    const payment = await saveSalaryPayment({
      managerId: data.managerId,
      type: data.type,
      amount: Number(data.amount),
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0],
      createdBy: data.createdBy || 'm1',
    });

    // Mirror to accounting
    await createAccountingEntry({
      timestamp: new Date(payment.date),
      type: 'expense',
      category: `ЗП: ${payment.type === 'advance' ? 'Аванс' : payment.type === 'salary' ? 'Зарплата' : payment.type === 'bonus' ? 'Бонус' : payment.type === 'sick_leave' ? 'Больничный' : payment.type === 'vacation' ? 'Отпускные' : 'Штраф'}`,
      amount: payment.amount,
      description: `${manager?.name || data.managerId}: ${payment.description || payment.type}`,
      managerId: data.createdBy || 'm1',
      isConfirmed: true,
    });

    const creator = managers.find(m => m.id === (data.createdBy || 'm1'));
    await saveAuditLog({
      managerId: data.createdBy || 'm1',
      managerName: creator?.name || 'Система',
      action: 'SALARY_PAYMENT',
      details: `Выплата ${payment.type} ${payment.amount.toLocaleString()} ₸ → ${manager?.name || data.managerId}`,
      targetId: payment.id
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;
    const updated = await updateSalaryPayment(id, updates);
    return NextResponse.json({ success: true, payment: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    await deleteSalaryPayment(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
