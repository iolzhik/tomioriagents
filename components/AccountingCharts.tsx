'use client';
import React, { useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  TrendingUp, TrendingDown, Minus, Sparkles, Loader2,
  ArrowUpRight, ArrowDownRight, DollarSign, BarChart3,
  PieChart, Activity, Target, AlertTriangle, CheckCircle,
  RefreshCw, Download, Calendar
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountingEntry {
  id: string; timestamp: string; type: 'income' | 'expense' | 'tax';
  category: string; amount: number; description: string;
  leadId?: string; managerId: string; isConfirmed?: boolean;
  taxDetails?: { vat: number; incomeTax: number };
}

interface Props {
  entries: AccountingEntry[];
  leads?: any[];
  managers?: any[];
  getAiBody?: () => any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function groupByDay(entries: AccountingEntry[], days = 30) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const day = entries.filter(e => e.timestamp.slice(0, 10) === key);
    const income = day.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = day.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { date: key, label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }), income, expense, profit: income - expense };
  });
}

function groupByMonth(entries: AccountingEntry[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
    const month = entries.filter(e => e.timestamp.slice(0, 7) === key);
    const income = month.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = month.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { date: key, label, income, expense, profit: income - expense };
  });
}

function groupByCategory(entries: AccountingEntry[], type: 'income' | 'expense') {
  const map: Record<string, number> = {};
  entries.filter(e => e.type === type).forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
}

function trendPercent(current: number, prev: number): number {
  if (!prev) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color, width = 80, height = 32 }: {
  values: number[]; color: string; width?: number; height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts: [number, number][] = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - (v / max) * (height - 4) - 2,
  ]);
  const area = `${smoothPath(pts)} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, sparkValues, color, icon }: {
  label: string; value: string; sub?: string;
  trend?: number; sparkValues?: number[];
  color: string; icon: React.ReactNode;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div style={{ background: '#FFF', borderRadius: '18px', padding: '20px 22px',
      border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px',
          background: color + '18', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px',
            borderRadius: '8px', background: trendUp ? '#F0FDF4' : '#FEF2F2',
            color: trendUp ? '#16A34A' : '#DC2626',
            display: 'flex', alignItems: 'center', gap: '3px' }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111', letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '3px' }}>{sub}</div>}
      </div>
      {sparkValues && sparkValues.length > 1 && (
        <Sparkline values={sparkValues} color={color} width={100} height={28} />
      )}
    </div>
  );
}

// ─── Main Line/Bar Chart ──────────────────────────────────────────────────────

function MainChart({ data, width = 700, height = 200 }: {
  data: { label: string; income: number; expense: number; profit: number }[];
  width?: number; height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 24, right: 24, bottom: 36, left: 64 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const toX = (i: number) => pad.left + (i / (data.length - 1)) * W;
  const toY = (v: number) => pad.top + H - (v / maxVal) * H;

  const incPts: [number, number][] = data.map((d, i) => [toX(i), toY(d.income)]);
  const expPts: [number, number][] = data.map((d, i) => [toX(i), toY(d.expense)]);
  const proPts: [number, number][] = data.map((d, i) => [toX(i), toY(Math.max(0, d.profit))]);

  const areaInc = `${smoothPath(incPts)} L ${toX(data.length - 1)} ${pad.top + H} L ${toX(0)} ${pad.top + H} Z`;
  const areaExp = `${smoothPath(expPts)} L ${toX(data.length - 1)} ${pad.top + H} L ${toX(0)} ${pad.top + H} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xStep = Math.ceil(data.length / 7);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}
      onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {yTicks.map(t => {
        const y = toY(maxVal * t);
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + W} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">
              {fmt(maxVal * t)}
            </text>
          </g>
        );
      })}

      {/* Areas */}
      <path d={areaInc} fill="url(#gInc)" />
      <path d={areaExp} fill="url(#gExp)" />

      {/* Lines */}
      <path d={smoothPath(incPts)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
      <path d={smoothPath(expPts)} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="6,3" />
      <path d={smoothPath(proPts)} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />

      {/* Hover areas + dots */}
      {data.map((d, i) => (
        <g key={i} onMouseEnter={() => setHover(i)}>
          <rect x={toX(i) - W / data.length / 2} y={pad.top} width={W / data.length} height={H}
            fill="transparent" />
          {hover === i && (
            <>
              <line x1={toX(i)} y1={pad.top} x2={toX(i)} y2={pad.top + H} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,2" />
              <circle cx={toX(i)} cy={toY(d.income)} r="4" fill="#10B981" stroke="#FFF" strokeWidth="2" />
              <circle cx={toX(i)} cy={toY(d.expense)} r="4" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
              {/* Tooltip */}
              <rect x={toX(i) - 60} y={pad.top - 2} width="120" height="58" rx="8" fill="#1F2937" opacity="0.92" />
              <text x={toX(i)} y={pad.top + 13} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.label}</text>
              <text x={toX(i)} y={pad.top + 26} textAnchor="middle" fontSize="10" fill="#10B981">+{fmt(d.income)} ₸</text>
              <text x={toX(i)} y={pad.top + 39} textAnchor="middle" fontSize="10" fill="#EF4444">-{fmt(d.expense)} ₸</text>
              <text x={toX(i)} y={pad.top + 52} textAnchor="middle" fontSize="10" fill="#60A5FA">{d.profit >= 0 ? '+' : ''}{fmt(d.profit)} ₸</text>
            </>
          )}
        </g>
      ))}

      {/* X labels */}
      {data.filter((_, i) => i % xStep === 0 || i === data.length - 1).map((d, _, arr) => {
        const i = data.indexOf(d);
        return <text key={i} x={toX(i)} y={pad.top + H + 20} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.label}</text>;
      })}
    </svg>
  );
}

// ─── Bar Chart (monthly) ──────────────────────────────────────────────────────

function BarChart({ data, width = 700, height = 200 }: {
  data: { label: string; income: number; expense: number; profit: number }[];
  width?: number; height?: number;
}) {
  const pad = { top: 24, right: 24, bottom: 36, left: 64 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const bw = (W / data.length) * 0.32;
  const gap = (W / data.length) * 0.06;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="bInc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="bExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F87171" /><stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pad.top + H - t * H;
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + W} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{fmt(maxVal * t)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = pad.left + (i + 0.5) * (W / data.length);
        const ih = (d.income / maxVal) * H;
        const eh = (d.expense / maxVal) * H;
        return (
          <g key={i}>
            <rect x={cx - bw - gap / 2} y={pad.top + H - ih} width={bw} height={ih} fill="url(#bInc)" rx="4" />
            <rect x={cx + gap / 2} y={pad.top + H - eh} width={bw} height={eh} fill="url(#bExp)" rx="4" />
            <text x={cx} y={pad.top + H + 20} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.label}</text>
            {d.profit > 0 && (
              <text x={cx - bw / 2 - gap / 2} y={pad.top + H - ih - 5} textAnchor="middle" fontSize="9" fill="#10B981">
                +{fmt(d.profit)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const COLORS = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#10B981','#EC4899','#06B6D4'];

function DonutChart({ data, label, size = 150 }: { data: [string, number][]; label: string; size?: number }) {
  const total = data.reduce((s, [, v]) => s + v, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.24;
  let angle = -Math.PI / 2;
  const slices = data.map(([name, value], i) => {
    const sweep = (value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const xi1 = cx + inner * Math.cos(angle - sweep), yi1 = cy + inner * Math.sin(angle - sweep);
    const xi2 = cx + inner * Math.cos(angle), yi2 = cy + inner * Math.sin(angle);
    return { name, value, color: COLORS[i % COLORS.length], path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" />)}
        <circle cx={cx} cy={cy} r={inner - 2} fill="#FFF" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#9CA3AF">{label}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
          {fmt(total)} ₸
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            <span style={{ fontWeight: '700', color: '#111', flexShrink: 0 }}>{fmt(s.value)} ₸</span>
            <span style={{ color: '#9CA3AF', flexShrink: 0, fontSize: '0.68rem' }}>{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cumulative P&L ───────────────────────────────────────────────────────────

function PLCurve({ data, width = 700, height = 140 }: {
  data: { label: string; income: number; expense: number }[];
  width?: number; height?: number;
}) {
  const pad = { top: 20, right: 24, bottom: 32, left: 64 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  let cum = 0;
  const cumData = data.map(d => { cum += d.income - d.expense; return cum; });
  const minV = Math.min(...cumData, 0), maxV = Math.max(...cumData, 1);
  const range = maxV - minV || 1;
  const toX = (i: number) => pad.left + (i / (data.length - 1)) * W;
  const toY = (v: number) => pad.top + H - ((v - minV) / range) * H;
  const zeroY = toY(0);
  const pts: [number, number][] = cumData.map((v, i) => [toX(i), toY(v)]);
  const area = `${smoothPath(pts)} L ${toX(data.length - 1)} ${zeroY} L ${toX(0)} ${zeroY} Z`;
  const isPositive = cumData[cumData.length - 1] >= 0;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gPL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#3B82F6' : '#EF4444'} stopOpacity="0.25" />
          <stop offset="100%" stopColor={isPositive ? '#3B82F6' : '#EF4444'} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={pad.left} y1={zeroY} x2={pad.left + W} y2={zeroY} stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="5,3" />
      <path d={area} fill="url(#gPL)" />
      <path d={smoothPath(pts)} fill="none" stroke={isPositive ? '#3B82F6' : '#EF4444'} strokeWidth="2.5" strokeLinecap="round" />
      {[minV, 0, maxV].map((v, i) => (
        <text key={i} x={pad.left - 8} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{fmt(v)}</text>
      ))}
      {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d, _, arr) => {
        const i = data.indexOf(d);
        return <text key={i} x={toX(i)} y={pad.top + H + 20} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.label}</text>;
      })}
    </svg>
  );
}

// ─── Expense Breakdown ───────────────────────────────────────────────────────

const EXPENSE_ICONS: Record<string, string> = {
  'Закуп материала': '💎',
  'Аренда': '🏢',
  'Зарплата': '👤',
  'Маркетинг': '📣',
  'Коммунальные услуги': '💡',
  'Ремонт изделия': '🔧',
  'Доставка изделия': '🚚',
  'Прочее': '📦',
};

function ExpenseBreakdown({ entries }: { entries: AccountingEntry[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    entries.filter(e => e.type === 'expense').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name, value,
        color: COLORS[i % COLORS.length],
        pct: Math.round((value / (Object.values(map).reduce((s, v) => s + v, 0) || 1)) * 100),
      }));
  }, [entries]);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '0.85rem' }}>
        Нет данных о расходах
      </div>
    );
  }

  // SVG donut
  const size = 180;
  const cx = size / 2, cy = size / 2, r = size * 0.4, inner = size * 0.26;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const xi1 = cx + inner * Math.cos(angle - sweep), yi1 = cy + inner * Math.sin(angle - sweep);
    const xi2 = cx + inner * Math.cos(angle), yi2 = cy + inner * Math.sin(angle);
    const midAngle = angle - sweep / 2;
    const lx = cx + (r + 14) * Math.cos(midAngle);
    const ly = cy + (r + 14) * Math.sin(midAngle);
    return {
      ...d,
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`,
      lx, ly, pct: Math.round((d.value / total) * 100),
    };
  });

  const active = hovered ? data.find(d => d.name === hovered) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '28px', alignItems: 'center' }}>
      {/* Donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path
              key={i} d={s.path}
              fill={s.color}
              opacity={hovered && hovered !== s.name ? 0.35 : 0.92}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={() => setHovered(s.name)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={inner - 2} fill="#FFF" />
          {active ? (
            <>
              <text x={cx} y={cy - 10} textAnchor="middle" fontSize="10" fill="#9CA3AF">{active.name.length > 12 ? active.name.slice(0, 12) + '…' : active.name}</text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111">{fmt(active.value)} ₸</text>
              <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fill={active.color}>{active.pct}%</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">Расходы</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111">{fmt(total)} ₸</text>
            </>
          )}
        </svg>
      </div>

      {/* Horizontal bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((d, i) => (
          <div key={d.name}
            onMouseEnter={() => setHovered(d.name)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'default', opacity: hovered && hovered !== d.name ? 0.45 : 1, transition: 'opacity 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1rem' }}>{EXPENSE_ICONS[d.name] || '📦'}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>{d.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#111' }}>{fmt(d.value)} ₸</span>
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF', minWidth: '32px', textAlign: 'right' }}>{d.pct}%</span>
              </div>
            </div>
            <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${d.pct}%`,
                background: `linear-gradient(90deg, ${d.color}cc, ${d.color})`,
                borderRadius: '4px',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manager Performance ──────────────────────────────────────────────────────

function ManagerPerf({ entries, managers }: { entries: AccountingEntry[]; managers: any[] }) {
  const byManager = useMemo(() => {
    const map: Record<string, { income: number; count: number; name: string }> = {};
    entries.filter(e => e.type === 'income').forEach(e => {
      if (!map[e.managerId]) {
        const m = managers.find(m => m.id === e.managerId);
        map[e.managerId] = { income: 0, count: 0, name: m?.name || e.managerId };
      }
      map[e.managerId].income += e.amount;
      map[e.managerId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.income - a.income).slice(0, 5);
  }, [entries, managers]);

  const maxIncome = byManager[0]?.income || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {byManager.length === 0 && (
        <div style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center', padding: '20px' }}>Нет данных</div>
      )}
      {byManager.map((m, i) => (
        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: COLORS[i] + '20',
            color: COLORS[i], fontSize: '0.72rem', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#111', flexShrink: 0, marginLeft: '8px' }}>{fmt(m.income)} ₸</span>
            </div>
            <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(m.income / maxIncome) * 100}%`,
                background: COLORS[i], borderRadius: '3px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>{m.count} операций</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

function Forecast({ monthly }: { monthly: { label: string; income: number; expense: number; profit: number }[] }) {
  const last3 = monthly.slice(-3);
  const avgIncome = last3.reduce((s, m) => s + m.income, 0) / (last3.length || 1);
  const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / (last3.length || 1);
  const trend = last3.length >= 2
    ? (last3[last3.length - 1].income - last3[0].income) / (last3.length - 1)
    : 0;
  const forecastIncome = Math.max(0, avgIncome + trend);
  const forecastProfit = forecastIncome - avgExpense;
  const isGood = forecastProfit > 0;

  return (
    <div style={{ padding: '18px', background: isGood ? '#F0FDF4' : '#FEF2F2',
      borderRadius: '14px', border: `1px solid ${isGood ? '#BBF7D0' : '#FECACA'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Target size={16} color={isGood ? '#16A34A' : '#DC2626'} />
        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: isGood ? '#16A34A' : '#DC2626' }}>
          Прогноз на следующий месяц
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Ожид. доход', value: fmt(forecastIncome) + ' ₸', color: '#16A34A' },
          { label: 'Ожид. расход', value: fmt(avgExpense) + ' ₸', color: '#DC2626' },
          { label: 'Ожид. прибыль', value: (forecastProfit >= 0 ? '+' : '') + fmt(forecastProfit) + ' ₸', color: isGood ? '#2563EB' : '#DC2626' },
        ].map(f => (
          <div key={f.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#6B7280', marginBottom: '3px' }}>{f.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: f.color }}>{f.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.72rem', color: '#6B7280' }}>
        {isGood
          ? `📈 Тренд положительный. Среднемесячный рост дохода: +${fmt(Math.abs(trend))} ₸`
          : `⚠️ Расходы превышают доходы. Рекомендуется оптимизация затрат.`}
      </div>
    </div>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────

function AiPanel({ entries, leads, getAiBody }: {
  entries: AccountingEntry[]; leads: any[]; getAiBody?: () => any;
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState('');

  const generate = useCallback(async () => {
    if (!getAiBody) { setError('AI не настроен'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/crm/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'accounting', entries, leads, ...getAiBody() }),
      });
      const data = await res.json();
      if (data.success) setReport(data.report);
      else setError(data.error || 'Ошибка ИИ');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [entries, leads, getAiBody]);

  return (
    <div style={{ background: '#0F172A', borderRadius: '20px', padding: '24px',
      border: '1px solid #D4AF3740' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#D4AF3720',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#D4AF37" />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#FFF' }}>Финансовый советник ИИ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Анализ, аудит, рекомендации</div>
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          style={{ padding: '9px 18px', background: '#D4AF37', border: 'none', borderRadius: '10px',
            color: '#000', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px', opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
          {report ? 'Обновить' : 'Провести аудит'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: '10px',
          color: '#DC2626', fontSize: '0.78rem', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {report ? (
        <div style={{ fontSize: '0.83rem', lineHeight: '1.7', color: '#CBD5E1',
          maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }} className="markdown-prose">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      ) : !loading && (
        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: '1.6' }}>
          ИИ проанализирует структуру доходов и расходов, рассчитает налоговую нагрузку,
          выявит аномалии и даст конкретные рекомендации по улучшению финансовых показателей.
        </p>
      )}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B', fontSize: '0.82rem' }}>
          <Loader2 size={16} className="spin" color="#D4AF37" /> Анализирую данные...
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AccountingCharts({ entries, leads = [], managers = [], getAiBody }: Props) {
  const [period, setPeriod] = useState<'30d' | '6m'>('30d');

  const daily = useMemo(() => groupByDay(entries, 30), [entries]);
  const monthly = useMemo(() => groupByMonth(entries, 6), [entries]);
  const expCats = useMemo(() => groupByCategory(entries, 'expense'), [entries]);
  const incCats = useMemo(() => groupByCategory(entries, 'income'), [entries]);

  // Current vs previous period
  const now = new Date();
  const curMonthKey = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = prevDate.toISOString().slice(0, 7);

  const cur = useMemo(() => {
    const e = entries.filter(e => e.timestamp.slice(0, 7) === curMonthKey);
    return {
      income: e.filter(x => x.type === 'income').reduce((s, x) => s + x.amount, 0),
      expense: e.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0),
      tax: e.filter(x => x.type === 'income').reduce((s, x) => s + (x.taxDetails?.vat || 0) + (x.taxDetails?.incomeTax || 0), 0),
    };
  }, [entries, curMonthKey]);

  const prev = useMemo(() => {
    const e = entries.filter(e => e.timestamp.slice(0, 7) === prevMonthKey);
    return {
      income: e.filter(x => x.type === 'income').reduce((s, x) => s + x.amount, 0),
      expense: e.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0),
    };
  }, [entries, prevMonthKey]);

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalTax = entries.filter(e => e.type === 'income').reduce((s, e) => s + (e.taxDetails?.vat || 0) + (e.taxDetails?.incomeTax || 0), 0);
  const netProfit = totalIncome - totalExpense - totalTax;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  const incomeByDay = daily.map(d => d.income);
  const expenseByDay = daily.map(d => d.expense);
  const profitByDay = daily.map(d => d.profit);

  const chartData = period === '30d' ? daily : monthly;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        <KpiCard
          label="Доходы (всего)"
          value={fmt(totalIncome) + ' ₸'}
          sub={`Этот месяц: ${fmt(cur.income)} ₸`}
          trend={trendPercent(cur.income, prev.income)}
          sparkValues={incomeByDay}
          color="#10B981"
          icon={<ArrowUpRight size={18} />}
        />
        <KpiCard
          label="Расходы (всего)"
          value={fmt(totalExpense) + ' ₸'}
          sub={`Этот месяц: ${fmt(cur.expense)} ₸`}
          trend={trendPercent(cur.expense, prev.expense)}
          sparkValues={expenseByDay}
          color="#EF4444"
          icon={<ArrowDownRight size={18} />}
        />
        <KpiCard
          label="Чистая прибыль"
          value={fmt(netProfit) + ' ₸'}
          sub={netProfit >= 0 ? 'Прибыльно' : 'Убыток'}
          sparkValues={profitByDay}
          color={netProfit >= 0 ? '#3B82F6' : '#EF4444'}
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="Маржинальность"
          value={`${margin}%`}
          sub={margin >= 30 ? 'Отличный показатель' : margin >= 15 ? 'Средний' : 'Низкий'}
          color={margin >= 30 ? '#10B981' : margin >= 15 ? '#F59E0B' : '#EF4444'}
          icon={<BarChart3 size={18} />}
        />
        <KpiCard
          label="Налоговая нагрузка"
          value={fmt(totalTax) + ' ₸'}
          sub={totalIncome > 0 ? `${Math.round((totalTax / totalIncome) * 100)}% от дохода` : '—'}
          color="#F59E0B"
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* ── Main Chart ── */}
      <div style={{ background: '#FFF', borderRadius: '20px', padding: '22px',
        border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111' }}>Доходы vs Расходы</div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
              {period === '30d' ? 'Последние 30 дней' : 'Последние 6 месяцев'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem' }}>
              {[['#10B981', 'Доходы'], ['#EF4444', 'Расходы'], ['#3B82F6', 'Прибыль']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280' }}>
                  <span style={{ width: '20px', height: '3px', background: c, display: 'inline-block', borderRadius: '2px' }} />{l}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
              {([['30d', '30 дней'], ['6m', '6 мес.']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setPeriod(id)}
                  style={{ padding: '5px 14px', borderRadius: '8px', border: 'none',
                    background: period === id ? '#FFF' : 'transparent',
                    fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                    boxShadow: period === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    color: period === id ? '#111' : '#6B7280' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {period === '30d' ? <MainChart data={daily} /> : <BarChart data={monthly} />}
      </div>

      {/* ── P&L Curve + Forecast ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        <div style={{ background: '#FFF', borderRadius: '20px', padding: '22px',
          border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111', marginBottom: '4px' }}>P&L кривая</div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '14px' }}>Накопленная прибыль/убыток</div>
          <PLCurve data={chartData} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Forecast monthly={monthly} />
          {/* Quick stats */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '18px',
            border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111' }}>Быстрая статистика</div>
            {[
              { label: 'Подтверждённых записей', value: entries.filter(e => e.isConfirmed).length + ' / ' + entries.length },
              { label: 'Средний чек (доход)', value: fmt(totalIncome / Math.max(entries.filter(e => e.type === 'income').length, 1)) + ' ₸' },
              { label: 'Ср. расход на операцию', value: fmt(totalExpense / Math.max(entries.filter(e => e.type === 'expense').length, 1)) + ' ₸' },
              { label: 'Дней с операциями', value: String(new Set(entries.map(e => e.timestamp.slice(0, 10))).size) },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#6B7280' }}>{s.label}</span>
                <span style={{ fontWeight: '700', color: '#111' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expense Breakdown ── */}
      <div style={{ background: '#FFF', borderRadius: '20px', padding: '24px',
        border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111' }}>Статьи расходов</div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
              Наведите на сегмент для детализации
            </div>
          </div>
          {expCats.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#6B7280', background: '#FEF2F2',
              padding: '5px 12px', borderRadius: '8px', fontWeight: '600' }}>
              Всего: {fmt(entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0))} ₸
            </div>
          )}
        </div>
        <ExpenseBreakdown entries={entries} />
      </div>

      {/* ── Income Donut ── */}
      {incCats.length > 0 && (
        <div style={{ background: '#FFF', borderRadius: '20px', padding: '22px',
          border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111', marginBottom: '16px' }}>
            Структура доходов
          </div>
          <DonutChart data={incCats} label="Доходы" />
        </div>
      )}

      {/* ── Manager Performance ── */}
      {managers.length > 0 && (
        <div style={{ background: '#FFF', borderRadius: '20px', padding: '22px',
          border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111', marginBottom: '16px' }}>
            Топ менеджеров по доходам
          </div>
          <ManagerPerf entries={entries} managers={managers} />
        </div>
      )}

      {/* ── AI Panel ── */}
      <AiPanel entries={entries} leads={leads} getAiBody={getAiBody} />

    </div>
  );
}
