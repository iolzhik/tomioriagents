import type { InstallmentPlan, InstallmentPayment } from '../types';

/**
 * Returns totalAmount - paidAmount.
 * This is the single source of truth for remaining balance.
 */
export function computeRemainingAmount(plan: InstallmentPlan): number {
  return plan.totalAmount - plan.paidAmount;
}

/**
 * Returns a new InstallmentPlan with the payment added,
 * paidAmount incremented, remainingAmount recomputed,
 * and status set to 'paid_in_full' if remainingAmount reaches 0.
 */
export function addInstallmentPayment(
  plan: InstallmentPlan,
  payment: InstallmentPayment
): InstallmentPlan {
  const newPaidAmount = plan.paidAmount + payment.amount;
  const newRemainingAmount = plan.totalAmount - newPaidAmount;
  const newStatus: InstallmentPlan['status'] =
    newRemainingAmount <= 0 ? 'paid_in_full' : (plan.status ?? 'active');

  return {
    ...plan,
    payments: [...plan.payments, payment],
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newStatus,
  };
}

/**
 * Returns true if the plan's remainingAmount is <= 0.
 */
export function isInstallmentPaidInFull(plan: InstallmentPlan): boolean {
  return plan.remainingAmount <= 0;
}
