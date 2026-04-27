'use client';
import React, { useState, useRef } from 'react';
import { X, Printer, Download, Gem, Award, Shield } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface CertificateData {
  unitId?: string;
  productName?: string;
  purity?: string;
  metalWeight?: number;
  totalWeight?: number;
  metalColor?: string;
  stones?: any[];
  price?: number;
  saleDate?: string;
  clientName?: string;
  clientPhone?: string;
  managerName?: string;
  certificateNumber?: string;
  warrantyMonths?: number;
  origin?: string;
  notes?: string;
}

const METAL_COLOR_LABELS: Record<string, string> = {
  white_gold: 'Белое золото', yellow_gold: 'Жёлтое золото',
  rose_gold: 'Розовое золото', silver: 'Серебро', platinum: 'Платина',
};

function CertificateView({ data, certRef }: { data: CertificateData; certRef: React.RefObject<HTMLDivElement | null> }) {
  const shortId = data.unitId ? data.unitId.split('-').slice(-2).join('-').toUpperCase() : '';
  const certNum = data.certificateNumber || `CERT-${shortId}-${new Date().getFullYear()}`;
  const totalCarats = (data.stones || []).reduce((s: number, st: any) => s + (st.caratWeight || 0) * (st.quantity || 1), 0);
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/crm/units/scan?id=${data.unitId || ''}`;

  return (
    <div ref={certRef} style={{
      width: '680px', background: '#FFF', position: 'relative', overflow: 'hidden',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Gold border frame */}
      <div style={{ position: 'absolute', inset: '8px', border: '1px solid #D4AF37', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: '12px', border: '0.5px solid #D4AF3760', pointerEvents: 'none', zIndex: 1 }} />

      {/* Background ornament */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, #FFF9E6 0%, #FFF 60%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
        background: 'linear-gradient(90deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px',
        background: 'linear-gradient(90deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 3, padding: '40px 48px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
            <Gem size={20} color="#D4AF37" />
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          </div>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: '#B8860B', fontFamily: 'Arial', fontWeight: '600', marginBottom: '6px' }}>
            TOMIORI JEWELRY
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '400', color: '#1A1A1A', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Сертификат подлинности
          </div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#9CA3AF', fontFamily: 'Arial' }}>
            CERTIFICATE OF AUTHENTICITY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
            <div style={{ width: '6px', height: '6px', background: '#D4AF37', transform: 'rotate(45deg)' }} />
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          </div>
        </div>

        {/* Certificate number */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.7rem', fontFamily: 'Arial', color: '#9CA3AF', letterSpacing: '0.15em' }}>№ </span>
          <span style={{ fontSize: '0.85rem', fontFamily: 'Arial', fontWeight: '700', color: '#D4AF37', letterSpacing: '0.1em' }}>
            {certNum}
          </span>
        </div>

        {/* Product name */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '1.3rem', color: '#1A1A1A', fontWeight: '400', marginBottom: '4px' }}>
            {data.productName || 'Ювелирное изделие'}
          </div>
          {data.origin && (
            <div style={{ fontSize: '0.75rem', fontFamily: 'Arial', color: '#6B7280' }}>
              Происхождение: {data.origin}
            </div>
          )}
        </div>

        {/* Main content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '24px',
          border: '1px solid #E8D5A3', borderRadius: '4px', overflow: 'hidden' }}>
          {[
            { label: 'Металл', value: data.metalColor ? METAL_COLOR_LABELS[data.metalColor] || data.metalColor : '—' },
            { label: 'Проба', value: data.purity ? data.purity + '°' : '—' },
            { label: 'Вес металла', value: data.metalWeight ? data.metalWeight + ' г' : '—' },
            { label: 'Общий вес', value: data.totalWeight ? data.totalWeight + ' г' : '—' },
            ...(totalCarats > 0 ? [{ label: 'Вставки', value: `${totalCarats.toFixed(3)} кт` }] : []),
            { label: 'Дата продажи', value: data.saleDate ? new Date(data.saleDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU') },
          ].map((f, i) => (
            <div key={f.label} style={{
              padding: '12px 16px',
              background: i % 2 === 0 ? '#FFFDF5' : '#FFF',
              borderBottom: i < 4 ? '1px solid #E8D5A3' : 'none',
              borderRight: i % 2 === 0 ? '1px solid #E8D5A3' : 'none',
            }}>
              <div style={{ fontSize: '0.62rem', fontFamily: 'Arial', color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: '3px' }}>
                {f.label.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.88rem', fontFamily: 'Arial', fontWeight: '600', color: '#1A1A1A' }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Stones table */}
        {(data.stones || []).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'Arial', letterSpacing: '0.15em', color: '#B8860B',
              textAlign: 'center', marginBottom: '10px' }}>ХАРАКТЕРИСТИКИ ВСТАВОК</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'Arial' }}>
              <thead>
                <tr style={{ background: '#FFF9E6', borderBottom: '1px solid #E8D5A3' }}>
                  {['Тип', 'Огранка', 'Чистота', 'Цвет', 'Кт', 'Кол-во'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#6B7280', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.stones || []).map((s: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.stoneType}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.shape || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.clarityGIA || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.colorGIA || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.caratWeight || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{s.quantity || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Client + warranty */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'Arial', color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: '6px' }}>ВЛАДЕЛЕЦ</div>
            <div style={{ fontSize: '0.9rem', fontFamily: 'Arial', fontWeight: '600', color: '#111' }}>{data.clientName || '—'}</div>
            {data.clientPhone && <div style={{ fontSize: '0.75rem', fontFamily: 'Arial', color: '#6B7280', marginTop: '2px' }}>{data.clientPhone}</div>}
          </div>
          <div style={{ padding: '14px 16px', background: '#FFFDF5', borderRadius: '8px', border: '1px solid #E8D5A3' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'Arial', color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: '6px' }}>ГАРАНТИЯ</div>
            <div style={{ fontSize: '0.9rem', fontFamily: 'Arial', fontWeight: '600', color: '#D4AF37' }}>
              {data.warrantyMonths || 12} месяцев
            </div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'Arial', color: '#6B7280', marginTop: '2px' }}>
              до {new Date(new Date(data.saleDate || Date.now()).setMonth(new Date(data.saleDate || Date.now()).getMonth() + (data.warrantyMonths || 12))).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>

        {/* Footer: signature + QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={14} color="#D4AF37" />
              <span style={{ fontSize: '0.68rem', fontFamily: 'Arial', color: '#6B7280' }}>
                Изделие прошло контроль качества Tomiori
              </span>
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'Arial', color: '#9CA3AF', marginBottom: '20px' }}>Подпись менеджера</div>
              {data.managerName && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'Arial', color: '#374151' }}>{data.managerName}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginLeft: '24px' }}>
            {data.unitId && (
              <>
                <QRCodeCanvas value={verifyUrl} size={72} level="M" />
                <div style={{ fontSize: '0.55rem', fontFamily: 'Arial', color: '#9CA3AF', marginTop: '4px' }}>Проверить подлинность</div>
              </>
            )}
          </div>
        </div>

        {data.notes && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#F9FAFB', borderRadius: '6px',
            fontSize: '0.72rem', fontFamily: 'Arial', color: '#6B7280', borderLeft: '3px solid #D4AF37' }}>
            {data.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Certificate Modal ────────────────────────────────────────────────────────

export default function SaleCertificate({ unit, product, lead, onClose }: {
  unit?: any; product?: any; lead?: any; onClose: () => void;
}) {
  const certRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CertificateData>({
    unitId: unit?.unitId || '',
    productName: product?.name || lead?.product || '',
    purity: unit?.purity || product?.purity || '',
    metalWeight: unit?.metalWeight,
    totalWeight: unit?.totalWeight,
    metalColor: unit?.metalColor,
    stones: unit?.stones || [],
    price: unit?.price || lead?.finalPrice || lead?.paymentAmount,
    saleDate: lead?.createdAt ? lead.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    clientName: lead?.name || '',
    clientPhone: lead?.phone || '',
    managerName: '',
    certificateNumber: '',
    warrantyMonths: 12,
    origin: unit?.origin || product?.origin || '',
    notes: '',
  });

  const set = (k: keyof CertificateData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handlePrint = async () => {
    if (!certRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: '#FFF' });
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Сертификат</title>
      <style>* { margin:0; padding:0; } @media print { @page { size: A4 landscape; margin: 0; } }</style>
      </head><body>
      <img src="${canvas.toDataURL('image/png')}" style="width:100%;max-width:100%;" />
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: '#FFF' });
    const link = document.createElement('a');
    link.download = `Сертификат_${form.certificateNumber || form.unitId || 'Tomiori'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', zIndex: 3000, padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', width: '100%', maxWidth: '900px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.3)', marginTop: '20px', marginBottom: '20px' }}>

        {/* Modal header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F0F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="#D4AF37" />
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>Сертификат подлинности</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDownload}
              style={{ padding: '8px 16px', background: '#F3F4F6', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Скачать PNG
            </button>
            <button onClick={handlePrint}
              style={{ padding: '8px 16px', background: '#D4AF37', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', color: '#FFF',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={14} /> Распечатать
            </button>
            <button onClick={onClose}
              style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0' }}>
          {/* Form panel */}
          <div style={{ padding: '20px', borderRight: '1px solid #F0F0F0', overflowY: 'auto', maxHeight: '80vh' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '14px' }}>Данные сертификата</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'productName', label: 'Название изделия', type: 'text' },
                { key: 'certificateNumber', label: 'Номер сертификата', type: 'text', placeholder: 'Авто' },
                { key: 'clientName', label: 'Имя владельца', type: 'text' },
                { key: 'clientPhone', label: 'Телефон', type: 'text' },
                { key: 'managerName', label: 'Менеджер', type: 'text' },
                { key: 'saleDate', label: 'Дата продажи', type: 'date' },
                { key: 'warrantyMonths', label: 'Гарантия (мес.)', type: 'number' },
                { key: 'purity', label: 'Проба', type: 'text' },
                { key: 'metalWeight', label: 'Вес металла (г)', type: 'number' },
                { key: 'totalWeight', label: 'Общий вес (г)', type: 'number' },
                { key: 'origin', label: 'Происхождение', type: 'text' },
                { key: 'notes', label: 'Примечание', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                    {f.label.toUpperCase()}
                  </label>
                  <input
                    className="luxury-input"
                    type={f.type}
                    value={(form as any)[f.key] ?? ''}
                    placeholder={f.placeholder}
                    onChange={e => set(f.key as keyof CertificateData, f.type === 'number' ? +e.target.value : e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '4px' }}>МЕТАЛЛ</label>
                <select className="luxury-input" value={form.metalColor || ''} onChange={e => set('metalColor', e.target.value)} style={{ fontSize: '0.82rem' }}>
                  <option value="">— не указано —</option>
                  {Object.entries(METAL_COLOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Certificate preview */}
          <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '80vh', background: '#F9FAFB' }}>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '12px', textAlign: 'center' }}>Предпросмотр</div>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
              <CertificateView data={form} certRef={certRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
