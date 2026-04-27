'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Calendar, CreditCard, X, Plus } from 'lucide-react';
import type { Layaway, LayawayStatus } from '@/lib/crm/types';

interface LayawayListProps {
  managerId: string;
}

function daysDiff(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function statusBadge(status: LayawayStatus) {
  const map: Record<LayawayStatus, { label: string; cls: string }> = {
    active: { label: 'Активна', cls: 'bg-green-800 text-green-200' },
    overdue: { label: 'Просрочено', cls: 'bg-red-800 text-red-200' },
    redeemed: { label: 'Выкуплено', cls: 'bg-gray-700 text-gray-300' },
    cancelled: { label: 'Отменена', cls: 'bg-gray-700 text-gray-400' },
  };
  const { label, cls } = map[status] ?? map.active;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function paymentAlert(layaway: Layaway) {
  if (layaway.status === 'overdue') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-700 text-red-100 font-medium">Просрочено</span>;
  }
  const diff = daysDiff(layaway.nextPaymentDate);
  if (diff === 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-700 text-red-100 font-medium">Платёж сегодня</span>;
  }
  if (diff > 0 && diff <= 3) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 font-medium">Платёж через {diff} дн.</span>;
  }
  return null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

interface PaymentModal {
  layawayId: string;
  amount: string;
  method: 'card' | 'cash' | 'transfer' | 'kaspi';
  date: string;
  note: string;
}

export default function LayawayList({ managerId }: LayawayListProps) {
  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<PaymentModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLayaways = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/layaways');
      if (res.ok) {
        const data = await res.json();
        setLayaways(Array.isArray(data) ? data : (data.layaways ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLayaways(); }, [fetchLayaways]);

  async function handleAddPayment() {
    if (!paymentModal) return;
    setActionLoading(paymentModal.layawayId);
    try {
      await fetch(`/api/crm/layaways/${paymentModal.layawayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_payment',
          payment: {
            amount: Number(paymentModal.amount),
            method: paymentModal.method,
            date: paymentModal.date,
            note: paymentModal.note || undefined,
          },
        }),
      });
      setPaymentModal(null);
      await fetchLayaways();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(layawayId: string) {
    if (!confirm('Отменить рассрочку?')) return;
    setActionLoading(layawayId);
    try {
      await fetch(`/api/crm/layaways/${layawayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      await fetchLayaways();
    } finally {
      setActionLoading(null);
    }
  }

  const signals = layaways
    .filter(l => l.status === 'active' || l.status === 'overdue')
    .sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime();
    });

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">Загрузка...</div>;

  return (
    <div className="space-y-4">
      {/* Signals panel */}
      {signals.length > 0 && (
        <div className="bg-gray-800 border border-amber-700/40 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2 text-amber-400 text-sm font-medium">
            <AlertTriangle size={14} />
            Сигналы ({signals.length})
          </div>
          <div className="space-y-1">
            {signals.map(l => (
              <div key={l.layawayId} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{l.clientName} — {l.unitId}</span>
                <div className="flex items-center gap-1.5">
                  {paymentAlert(l)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full list */}
      {layaways.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">Рассрочки не найдены</div>
      ) : (
        <div className="space-y-3">
          {layaways.map(l => (
            <div key={l.layawayId} className="bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{l.clientName}</div>
                  <div className="text-xs text-gray-400 font-mono">{l.unitId}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {paymentAlert(l)}
                  {statusBadge(l.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>Депозит: <span className="text-white">{formatMoney(l.depositAmount)}</span></span>
                <span>Остаток: <span className="text-amber-400 font-medium">{formatMoney(l.remainingAmount)}</span></span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  Срок: <span className="text-white ml-1">{formatDate(l.dueDate)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard size={10} />
                  Платёж: <span className="text-white ml-1">{formatDate(l.nextPaymentDate)}</span>
                </span>
              </div>

              {(l.status === 'active' || l.status === 'overdue') && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setPaymentModal({
                      layawayId: l.layawayId,
                      amount: '',
                      method: 'card',
                      date: new Date().toISOString().slice(0, 10),
                      note: '',
                    })}
                    className="flex items-center gap-1.5 text-xs bg-amber-700 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded transition-colors"
                  >
                    <Plus size={12} />
                    Платёж
                  </button>
                  <button
                    onClick={() => handleCancel(l.layawayId)}
                    disabled={actionLoading === l.layawayId}
                    className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-red-800 disabled:opacity-50 text-white px-2.5 py-1.5 rounded transition-colors"
                  >
                    <X size={12} />
                    Отменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Добавить платёж</h3>
              <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Сумма</label>
                <input
                  type="number"
                  value={paymentModal.amount}
                  onChange={e => setPaymentModal(p => p && ({ ...p, amount: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Метод</label>
                <select
                  value={paymentModal.method}
                  onChange={e => setPaymentModal(p => p && ({ ...p, method: e.target.value as PaymentModal['method'] }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="card">Карта</option>
                  <option value="cash">Наличные</option>
                  <option value="transfer">Перевод</option>
                  <option value="kaspi">Kaspi</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Дата</label>
                <input
                  type="date"
                  value={paymentModal.date}
                  onChange={e => setPaymentModal(p => p && ({ ...p, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Примечание</label>
                <input
                  type="text"
                  value={paymentModal.note}
                  onChange={e => setPaymentModal(p => p && ({ ...p, note: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Необязательно"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddPayment}
                disabled={!paymentModal.amount || actionLoading === paymentModal.layawayId}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm py-2 rounded transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setPaymentModal(null)}
                className="px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
