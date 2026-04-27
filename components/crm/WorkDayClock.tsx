'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkDay } from '@/lib/crm/types';

interface WorkDayClockProps {
  managerId: string;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WorkDayClock({ managerId }: WorkDayClockProps) {
  const [workDay, setWorkDay] = useState<WorkDay | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWorkDay = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/workdays?managerId=${managerId}`);
      if (res.ok) {
        const data = await res.json();
        const list: WorkDay[] = Array.isArray(data) ? data : (data.workDays ?? []);
        const open = list.find(d => d.status === 'open') ?? null;
        setWorkDay(open);
        if (open) {
          const secs = Math.floor((Date.now() - new Date(open.startedAt).getTime()) / 1000);
          setElapsed(Math.max(0, secs));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => { fetchWorkDay(); }, [fetchWorkDay]);

  useEffect(() => {
    if (workDay?.status === 'open') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [workDay]);

  async function handleStart() {
    setActionLoading(true);
    setWarning(null);
    try {
      const res = await fetch('/api/crm/workdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      });
      if (res.status === 409) { setWarning('Рабочий день уже открыт'); return; }
      if (res.ok) await fetchWorkDay();
    } finally { setActionLoading(false); }
  }

  async function handleEnd() {
    if (!workDay) return;
    if (!confirm('Завершить рабочий день?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/crm/workdays/${workDay.workDayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });
      setWorkDay(null);
      setElapsed(0);
    } finally { setActionLoading(false); }
  }

  if (loading) return null;

  const startTime = workDay ? new Date(workDay.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: workDay ? 'linear-gradient(135deg, #064E3B, #065F46)' : '#F8F9FA',
      border: workDay ? '1px solid #059669' : '1px solid #E5E7EB',
      borderRadius: '14px', padding: '10px 16px',
      transition: 'all 0.3s ease',
    }}>
      {/* Status dot */}
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        background: workDay ? '#34D399' : '#D1D5DB',
        boxShadow: workDay ? '0 0 0 3px rgba(52,211,153,0.25)' : 'none',
        animation: workDay ? 'pulse 2s infinite' : 'none',
      }} />

      {workDay ? (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: '#6EE7B7', fontWeight: '600', letterSpacing: '0.5px' }}>
              РАБОЧИЙ ДЕНЬ
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#FFF', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {formatElapsed(elapsed)}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#6EE7B7' }}>с {startTime}</span>
            </div>
          </div>
          <button
            onClick={handleEnd}
            disabled={actionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 14px', borderRadius: '10px', border: 'none',
              background: 'rgba(255,255,255,0.15)', color: '#FFF',
              fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              opacity: actionLoading ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            ⏹ Завершить
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '500' }}>
              Рабочий день не начат
            </div>
            {warning && <div style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: '2px' }}>{warning}</div>}
          </div>
          <button
            onClick={handleStart}
            disabled={actionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 16px', borderRadius: '10px', border: 'none',
              background: '#1A1A1A', color: '#FFF',
              fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
              opacity: actionLoading ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1A1A1A')}
          >
            ▶ Начать день
          </button>
        </>
      )}
    </div>
  );
}
