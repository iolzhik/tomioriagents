import { prisma } from '../../prisma';
import { SalaryPayment, SalaryPlan } from '../types';
import { getLeads } from './lead.service';

export async function getSalaryPayments(managerId?: string): Promise<any[]> {
  return await prisma.salaryPayment.findMany({
    where: managerId ? { managerId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

export async function saveSalaryPayment(data: any) {
  return await prisma.salaryPayment.create({
    data
  });
}

export async function updateSalaryPayment(id: string, data: any) {
  return await prisma.salaryPayment.update({
    where: { id },
    data
  });
}

export async function deleteSalaryPayment(id: string) {
  return await prisma.salaryPayment.delete({
    where: { id }
  });
}

export async function getSalaryPlans(): Promise<any[]> {
  return await prisma.salaryPlan.findMany();
}

export async function saveSalaryPlan(data: any) {
  return await prisma.salaryPlan.upsert({
    where: { managerId: data.managerId },
    update: data,
    create: data
  });
}

export async function calculateManagerSalary(managerId: string, month: string) {
  const plan = await prisma.salaryPlan.findUnique({ where: { managerId } });
  const allLeads = await getLeads();
  const allPayments = await getSalaryPayments(managerId);

  const monthLeads = allLeads.filter(l => {
    if (l.managerId !== managerId || l.status !== 'closed_won') return false;
    const leadDate = new Date(l.createdAt);
    const leadMonth = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`;
    return leadMonth === month;
  });
  
  const totalSales = monthLeads.reduce((s, l) => s + (l.paymentAmount || l.finalPrice || 0), 0);

  const fixedSalary = plan?.fixedSalary || 0;
  const bonusPercent = plan?.bonusPercent || 0;
  const monthlyPlan = plan?.monthlyPlan || 0;
  const planBonusPercent = plan?.planBonusPercent || 0;

  const salesBonus = Math.round(totalSales * (bonusPercent / 100));
  const planBonus = (monthlyPlan > 0 && totalSales >= monthlyPlan)
    ? Math.round(totalSales * (planBonusPercent / 100))
    : 0;

  const grossSalary = fixedSalary + salesBonus + planBonus;

  // Fiscal calculations for Kazakhstan
  const pensionContrib = Math.round(grossSalary * 0.10);       // ОПВ 10%
  const taxableBase = Math.max(0, grossSalary - pensionContrib);
  const ipn = Math.round(taxableBase * 0.10);                  // ИПН 10%
  const socialTax = Math.round(grossSalary * 0.095);           // Соц. налог 9.5%
  const socialInsurance = Math.round(grossSalary * 0.035);     // ОСМС 3.5%
  const netSalary = grossSalary - pensionContrib - ipn;

  const monthPayments = allPayments.filter(p => p.date.startsWith(month));
  const advances = monthPayments.filter(p => p.type === 'advance').reduce((s, p) => s + p.amount, 0);
  const bonusPaid = monthPayments.filter(p => p.type === 'bonus').reduce((s, p) => s + p.amount, 0);
  const sickLeave = monthPayments.filter(p => p.type === 'sick_leave').reduce((s, p) => s + p.amount, 0);
  const vacation = monthPayments.filter(p => p.type === 'vacation').reduce((s, p) => s + p.amount, 0);
  const penalties = monthPayments.filter(p => p.type === 'penalty').reduce((s, p) => s + p.amount, 0);
  
  const totalPaid = advances + bonusPaid + sickLeave + vacation;
  const remaining = netSalary + sickLeave + vacation - totalPaid - penalties;

  return {
    managerId,
    month,
    totalSales,
    fixedSalary,
    salesBonus,
    planBonus,
    grossSalary,
    pensionContrib,
    ipn,
    socialTax,
    socialInsurance,
    netSalary,
    advances,
    bonusPaid,
    sickLeave,
    vacation,
    penalties,
    totalPaid,
    remaining,
    planAchieved: monthlyPlan > 0 ? Math.round((totalSales / monthlyPlan) * 100) : null,
    salesCount: monthLeads.length,
  };
}
