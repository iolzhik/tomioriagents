'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

interface WorkDayReportRow {
  managerId: string;
  managerName?: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  hoursWorked: number;
  status: 'open' | 'closed';
}

interface WorkDayReportProps {
  managerId: string;
  isAdmin: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function WorkDayReport({ managerId, isAdmin }: WorkDayReportProps) {
  const [rows, setRows] = useState<WorkDayReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/workdays/report?requesterId=${managerId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.report ?? data.rows ?? []);
        setRows(list);
      }
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    if (isAdmin) fetchReport();
    else setLoading(false);
  }, [isAdmin, fetchReport]);

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
        <Lock size={14} />
        Доступно только администратору
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter(r => r.date === today);

  return (
    <div className="space-y-4">
      {/* Daily summary */}
      {todayRows.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-medium mb-2">Сегодня</div>
          <div className="flex flex-wrap gap-2">
            {todayRows.map(r => (
              <div
                key={r.managerId}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  r.status === 'open'
                    ? 'bg-green-800 text-green-200'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {r.managerName ?? r.managerId} — {r.status === 'open' ? 'открыт' : 'закрыт'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-sm font-medium text-white">Отчёт по рабочим дням</span>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-6 text-center">Загрузка...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center">Нет данных</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="text-left px-4 py-2 font-medium">Менеджер</th>
                  <th className="text-left px-4 py-2 font-medium">Дата</th>
                  <th className="text-left px-4 py-2 font-medium">Начало</th>
                  <th className="text-left px-4 py-2 font-medium">Конец</th>
                  <th className="text-right px-4 py-2 font-medium">Часов</th>
                  <th className="text-left px-4 py-2 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-2 text-gray-300 font-mono text-xs">{r.managerName ?? r.managerId}</td>
                    <td className="px-4 py-2 text-gray-300">{formatDate(r.date)}</td>
                    <td className="px-4 py-2 text-gray-300">{formatTime(r.startedAt)}</td>
                    <td className="px-4 py-2 text-gray-400">{r.endedAt ? formatTime(r.endedAt) : '—'}</td>
                    <td className="px-4 py-2 text-right text-white font-medium">
                      {r.hoursWorked > 0 ? r.hoursWorked.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'open'
                          ? 'bg-green-800 text-green-200'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {r.status === 'open' ? 'открыт' : 'закрыт'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
