'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Transfer } from '@/lib/crm/types';

interface TransferPanelProps {
  managerId: string;
  isAdmin: boolean;
}

function elapsed(requestedAt: string): { label: string; isLong: boolean } {
  const ms = Date.now() - new Date(requestedAt).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const label = hours > 0 ? `${hours} ч ${mins % 60} мин` : `${mins} мин`;
  return { label, isLong: ms > 3600000 };
}

function formatLocation(loc: Transfer['fromLocation']): string {
  const parts: string[] = [];
  if (loc.holderName) parts.push(loc.holderName);
  if (loc.branchId) parts.push(loc.branchId);
  if (loc.warehouseId) parts.push(`Склад: ${loc.warehouseId}`);
  return parts.join(' / ') || '—';
}

export default function TransferPanel({ managerId, isAdmin }: TransferPanelProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/transfers?status=pending');
      if (res.ok) {
        const data = await res.json();
        setTransfers(Array.isArray(data) ? data : (data.transfers ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
    const interval = setInterval(fetchTransfers, 30000);
    return () => clearInterval(interval);
  }, [fetchTransfers]);

  async function handleApprove(transferId: string) {
    setActionLoading(transferId);
    try {
      await fetch(`/api/crm/transfers/${transferId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      });
      await fetchTransfers();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(transferId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(transferId);
    try {
      await fetch(`/api/crm/transfers/${transferId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, reason: rejectReason }),
      });
      setRejectId(null);
      setRejectReason('');
      await fetchTransfers();
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-4 text-center">Загрузка...</div>;
  }

  if (transfers.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        Нет ожидающих перемещений
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white">
          Ожидающие перемещения ({transfers.length})
        </h3>
        <button
          onClick={fetchTransfers}
          className="text-gray-400 hover:text-white transition-colors"
          title="Обновить"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {transfers.map(t => {
        const { label, isLong } = elapsed(t.requestedAt);
        return (
          <div
            key={t.transferId}
            className={`rounded-lg p-3 space-y-2 border ${
              isLong
                ? 'bg-amber-950/30 border-amber-700/50'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            {isLong && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertTriangle size={12} />
                Ожидает более 1 часа
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 text-sm">
                <div className="font-mono text-amber-400 text-xs">{t.unitId}</div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Откуда:</span> {formatLocation(t.fromLocation)}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Куда:</span> {formatLocation(t.toLocation)}
                </div>
                <div className="text-gray-400 text-xs">
                  Запросил: {t.requestedBy}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Clock size={11} />
                {label}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-1 space-y-2">
                {rejectId === t.transferId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Причина отказа..."
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(t.transferId)}
                        disabled={!rejectReason.trim() || actionLoading === t.transferId}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs py-1.5 rounded transition-colors"
                      >
                        Подтвердить отказ
                      </button>
                      <button
                        onClick={() => { setRejectId(null); setRejectReason(''); }}
                        className="px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(t.transferId)}
                      disabled={actionLoading === t.transferId}
                      className="flex items-center gap-1.5 flex-1 justify-center bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs py-1.5 rounded transition-colors"
                    >
                      <CheckCircle size={13} />
                      Одобрить
                    </button>
                    <button
                      onClick={() => setRejectId(t.transferId)}
                      disabled={actionLoading === t.transferId}
                      className="flex items-center gap-1.5 flex-1 justify-center bg-gray-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs py-1.5 rounded transition-colors"
                    >
                      <XCircle size={13} />
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
