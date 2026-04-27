'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Gem, Scale, RefreshCw, BarChart3 } from 'lucide-react';

interface TurnoverSegment {
  label: string;
  totalUnits: number;
  soldUnits: number;
  turnoverRate: number;
  avgDaysInStock: number;
  avgMargin: number;
}

interface Analytics {
  byCaratRange: TurnoverSegment[];
  byMetalWeightRange: TurnoverSegment[];
  byMetalColor: TurnoverSegment[];
  byStoneType: TurnoverSegment[];
  stagnant: any[];
  stonesByAvgDays: TurnoverSegment[];
  weightByAvgMargin: TurnoverSegment[];
}

function SegmentTable({ title, data, sortKey, icon }: {
  title: string;
  data: TurnoverSegment[];
  sortKey?: keyof TurnoverSegment;
  icon?: React.ReactNode;
}) {
  if (!data || data.length === 0) return null;
  const sorted = sortKey ? [...data].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)) : data;

  return (
    <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #F1F3F5', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F3F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{title}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ background: '#F8F9FA', textAlign: 'left' }}>
              {['Сегмент', 'Всего', 'Продано', 'Оборачиваемость', 'Ср. дней', 'Ср. маржа'].map(h => (
                <th key={h} style={{ padding: '8px 14px', fontWeight: 'bold', opacity: 0.6, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((seg, i) => {
              const isStagnant = seg.avgDaysInStock > 180;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F8F9FA', background: isStagnant ? '#FFF9F0' : 'transparent' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isStagnant && <AlertCircle size={12} color="#F59E0B" />}
                    {seg.label}
                  </td>
                  <td style={{ padding: '8px 14px' }}>{seg.totalUnits}</td>
                  <td style={{ padding: '8px 14px', color: '#10B981' }}>{seg.soldUnits}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '60px', height: '5px', background: '#F1F3F5', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(seg.turnoverRate * 100)}%`, background: seg.turnoverRate > 0.5 ? '#10B981' : seg.turnoverRate > 0.2 ? '#F59E0B' : '#EF4444', borderRadius: '3px' }} />
                      </div>
                      <span>{Math.round(seg.turnoverRate * 100)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 14px', color: isStagnant ? '#F59E0B' : '#1A1A1A', fontWeight: isStagnant ? 'bold' : 'normal' }}>
                    {seg.avgDaysInStock} дн.
                  </td>
                  <td style={{ padding: '8px 14px', color: seg.avgMargin > 30 ? '#10B981' : seg.avgMargin > 10 ? '#F59E0B' : '#EF4444', fontWeight: 'bold' }}>
                    {seg.avgMargin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'stagnant' | 'stones' | 'weight'>('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/units/analytics');
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', opacity: 0.4 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!analytics) return (
    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>
      <BarChart3 size={40} style={{ margin: '0 auto 12px' }} />
      <div>Нет данных для аналитики. Добавьте экземпляры (ТМЦ) на склад.</div>
    </div>
  );

  const totalUnits = analytics.byCaratRange.reduce((s, seg) => s + seg.totalUnits, 0);
  const stagnantCount = analytics.stagnant?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Всего экземпляров', value: totalUnits, color: '#1A1A1A', bg: '#F8F9FA' },
          { label: 'Застаивающихся (>180 дн.)', value: stagnantCount, color: stagnantCount > 0 ? '#F59E0B' : '#10B981', bg: stagnantCount > 0 ? '#FFFBEB' : '#F0FDF4' },
          { label: 'Ср. маржа (по весу)', value: `${analytics.weightByAvgMargin[0]?.avgMargin || 0}%`, color: '#10B981', bg: '#F0FDF4' },
          { label: 'Лучший сегмент камней', value: analytics.stonesByAvgDays[analytics.stonesByAvgDays.length - 1]?.label || '—', color: '#8B5CF6', bg: '#F5F3FF' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px', background: k.bg, borderRadius: '14px' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { id: 'overview', label: 'Обзор' },
          { id: 'stagnant', label: `Застаивающиеся (${stagnantCount})` },
          { id: 'stones', label: 'Камни' },
          { id: 'weight', label: 'По весу' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)}
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: view === t.id ? '#FFF' : 'transparent', fontWeight: view === t.id ? 'bold' : 'normal', fontSize: '0.78rem', cursor: 'pointer', boxShadow: view === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t.label}
          </button>
        ))}
        <button onClick={load} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.5 }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {view === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SegmentTable title="По каратности камней" data={analytics.byCaratRange} icon={<Gem size={16} color="#8B5CF6" />} />
          <SegmentTable title="По весу металла" data={analytics.byMetalWeightRange} icon={<Scale size={16} color="var(--gold)" />} />
          <SegmentTable title="По цвету металла" data={analytics.byMetalColor} icon={<TrendingUp size={16} color="#10B981" />} />
          <SegmentTable title="По типу камней" data={analytics.byStoneType} icon={<Gem size={16} color="#EF4444" />} />
        </div>
      )}

      {view === 'stagnant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stagnantCount === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <div>Нет застаивающихся изделий</div>
            </div>
          ) : (
            analytics.stagnant.map((unit: any) => {
              const days = Math.floor((Date.now() - new Date(unit.purchaseDate).getTime()) / 86400000);
              return (
                <div key={unit.unitId} style={{ padding: '14px', background: '#FFF9F0', borderRadius: '12px', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>#{unit.unitId.split('-').slice(-2).join('-')}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>SKU: {unit.skuId} · {unit.metalWeight}г · {unit.purity}°</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#F59E0B', fontSize: '1.1rem' }}>{days} дн.</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>на складе</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'stones' && (
        <SegmentTable
          title="Какие камни застаиваются? (сортировка по ср. дням)"
          data={analytics.stonesByAvgDays}
          icon={<Gem size={16} color="#8B5CF6" />}
        />
      )}

      {view === 'weight' && (
        <SegmentTable
          title="Какой вес приносит больше маржи? (сортировка по марже)"
          data={analytics.weightByAvgMargin}
          icon={<Scale size={16} color="var(--gold)" />}
        />
      )}
    </div>
  );
}
