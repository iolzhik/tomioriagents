'use client';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, X, Search, CheckCircle, AlertCircle, Package, MapPin, Calendar, Gem } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JewelryUnit {
  unitId: string; skuId: string; metalWeight: number; totalWeight: number;
  purity: string; purchaseDate: string; locationStatus: string;
  locationHistory: any[]; shelfNumber?: string; price: number;
  metalColor?: string; stones?: any[]; notes?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  showcase: 'На витрине', cleaning: 'На чистке', photoshoot: 'Фотосессия',
  reserved: 'В брони', gemology: 'Геммология', service: 'Сервис',
  sold: 'Продан', archived: 'Архив',
};
const STATUS_COLORS: Record<string, string> = {
  showcase: '#10B981', cleaning: '#F59E0B', photoshoot: '#8B5CF6',
  reserved: '#3B82F6', gemology: '#06B6D4', service: '#EC4899',
  sold: '#EF4444', archived: '#9CA3AF',
};

// ─── Barcode SVG via JsBarcode ────────────────────────────────────────────────

function Barcode({ value, width = 200, height = 60 }: { value: string; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    import('jsbarcode').then(({ default: JsBarcode }) => {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 1.8,
        height,
        displayValue: false,
        margin: 0,
        background: 'transparent',
        lineColor: '#1A1A1A',
      });
    });
  }, [value, height]);

  return <svg ref={svgRef} style={{ width: '100%', maxWidth: width }} />;
}

// ─── Print Label ──────────────────────────────────────────────────────────────

function PrintLabel({ unit, productName, onClose }: {
  unit: JewelryUnit; productName?: string; onClose: () => void;
}) {
  const shortId = unit.unitId.split('-').slice(-2).join('-').toUpperCase();
  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/crm/units/scan?id=${unit.unitId}`;
  const totalCarats = (unit.stones || []).reduce((s: number, st: any) => s + (st.caratWeight || 0) * (st.quantity || 1), 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    const labelEl = document.getElementById('barcode-label-print');
    if (!labelEl) return;
    printWindow.document.write(`
      <html><head><title>Этикетка ${shortId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: #fff; }
        @media print { @page { size: 62mm 40mm; margin: 0; } }
      </style></head>
      <body>${labelEl.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}>
      <div style={{ background: '#FFF', borderRadius: '20px', padding: '24px', width: '420px',
        maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem' }}>Этикетка ТМЦ</div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        {/* Label preview */}
        <div id="barcode-label-print" style={{
          border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px',
          background: '#FFF', marginBottom: '16px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.05em' }}>TOMIORI</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#111', letterSpacing: '0.02em' }}>#{shortId}</div>
              {productName && <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>{productName}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px',
                background: (STATUS_COLORS[unit.locationStatus] || '#9CA3AF') + '20',
                color: STATUS_COLORS[unit.locationStatus] || '#9CA3AF',
                fontWeight: '700', display: 'inline-block' }}>
                {STATUS_LABELS[unit.locationStatus] || unit.locationStatus}
              </div>
              {unit.price > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111', marginTop: '4px' }}>
                  {unit.price.toLocaleString()} ₸
                </div>
              )}
            </div>
          </div>

          {/* Specs row */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: '#374151', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span>⚖️ {unit.metalWeight}г / {unit.totalWeight}г</span>
            <span>🔶 {unit.purity}°</span>
            {unit.shelfNumber && <span>📍 {unit.shelfNumber}</span>}
            {totalCarats > 0 && <span>💎 {totalCarats.toFixed(3)}кт</span>}
          </div>

          {/* Barcode + QR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Barcode value={unit.unitId} height={48} />
              <div style={{ fontSize: '0.6rem', color: '#9CA3AF', textAlign: 'center', marginTop: '2px', letterSpacing: '0.05em' }}>
                {unit.unitId}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <QRCodeCanvas value={scanUrl} size={64} level="M" />
              <div style={{ fontSize: '0.55rem', color: '#9CA3AF', textAlign: 'center', marginTop: '2px' }}>Сканировать</div>
            </div>
          </div>

          {/* Date */}
          <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '8px', textAlign: 'right' }}>
            {new Date(unit.purchaseDate).toLocaleDateString('ru-RU')}
          </div>
        </div>

        <button onClick={handlePrint}
          style={{ width: '100%', padding: '12px', background: '#111', color: '#FFF', border: 'none',
            borderRadius: '12px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Printer size={16} /> Распечатать этикетку
        </button>
      </div>
    </div>
  );
}

// ─── Scanner Modal ────────────────────────────────────────────────────────────

export function BarcodeScanner({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const scan = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/crm/units/scan?id=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'Не найдено');
    } catch { setError('Ошибка сети'); }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') scan(query);
  };

  const statusColor = result?.unit ? (STATUS_COLORS[result.unit.locationStatus] || '#9CA3AF') : '#9CA3AF';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '28px', width: '480px',
        maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>🔍 Сканер штрихкода</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>Введите ID или отсканируйте штрихкод</div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px',
            padding: '8px', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="unit-sku-... или отсканируйте"
            className="luxury-input"
            style={{ flex: 1, fontSize: '0.9rem' }}
          />
          <button onClick={() => scan(query)} disabled={loading}
            style={{ padding: '10px 18px', background: '#111', color: '#FFF', border: 'none',
              borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={15} /> Найти
          </button>
        </div>

        {error && (
          <div style={{ padding: '14px', background: '#FEF2F2', borderRadius: '12px',
            color: '#DC2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {result?.unit && (
          <div style={{ border: `2px solid ${statusColor}40`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ height: '4px', background: statusColor }} />
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#111' }}>
                    #{result.unit.unitId.split('-').slice(-2).join('-').toUpperCase()}
                  </div>
                  {result.product && (
                    <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '2px' }}>{result.product.name}</div>
                  )}
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '0.78rem',
                  background: statusColor + '20', color: statusColor }}>
                  {STATUS_LABELS[result.unit.locationStatus] || result.unit.locationStatus}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { icon: '⚖️', label: 'Вес металла', value: `${result.unit.metalWeight}г` },
                  { icon: '🔶', label: 'Проба', value: result.unit.purity + '°' },
                  { icon: '📍', label: 'Полка', value: result.unit.shelfNumber || '—' },
                  { icon: '💰', label: 'Цена', value: result.unit.price > 0 ? result.unit.price.toLocaleString() + ' ₸' : '—' },
                  { icon: '📅', label: 'Поступление', value: new Date(result.unit.purchaseDate).toLocaleDateString('ru-RU') },
                  { icon: '🔄', label: 'Перемещений', value: String(result.unit.locationHistory?.length || 0) },
                ].map(f => (
                  <div key={f.label} style={{ padding: '10px 12px', background: '#F9FAFB', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '2px' }}>{f.icon} {f.label}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111' }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Last movement */}
              {result.unit.locationHistory?.length > 0 && (
                <div style={{ padding: '10px 12px', background: statusColor + '10', borderRadius: '10px',
                  fontSize: '0.78rem', color: '#374151' }}>
                  <span style={{ color: '#9CA3AF' }}>Последнее перемещение: </span>
                  {(() => {
                    const last = result.unit.locationHistory[result.unit.locationHistory.length - 1];
                    return `${STATUS_LABELS[last.from] || last.from} → ${STATUS_LABELS[last.to] || last.to} · ${new Date(last.timestamp).toLocaleDateString('ru-RU')}`;
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export: barcode button + label modal ────────────────────────────────

export default function BarcodeLabel({ unit, productName }: { unit: JewelryUnit; productName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '8px',
          border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '5px', color: '#374151', fontWeight: '600' }}>
        <Package size={12} /> Этикетка
      </button>
      {open && <PrintLabel unit={unit} productName={productName} onClose={() => setOpen(false)} />}
    </>
  );
}
