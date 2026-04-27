'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GiftCertificate, CertificateStatus } from '@/lib/crm/types';

interface GiftCertificatesProps {
  managerId: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

const STATUS_CONFIG: Record<CertificateStatus, { label: string; bg: string; color: string; border: string }> = {
  active:  { label: 'Активен',      bg: '#0D2B1A', color: '#34D399', border: '#065F46' },
  used:    { label: 'Использован',  bg: '#1F1F1F', color: '#6B7280', border: '#374151' },
  expired: { label: 'Истёк',        bg: '#2B0D0D', color: '#F87171', border: '#7F1D1D' },
};

function StatusBadge({ status }: { status: CertificateStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    }}>
      {cfg.label}
    </span>
  );
}

interface PrintModalProps {
  cert: GiftCertificate;
  onClose: () => void;
}

function PrintModal({ cert, onClose }: PrintModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        background: '#FFF', borderRadius: '20px', padding: '2.5rem',
        width: '100%', maxWidth: '420px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        textAlign: 'center',
      }}>
        {/* Branding */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.35em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>
            Ювелирный бутик
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '0.15em', color: '#111', fontFamily: 'Georgia, serif' }}>
            TOMIORI
          </div>
        </div>

        <div style={{ width: '60px', height: '2px', background: '#D4AF37', margin: '1rem auto' }} />

        <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Подарочный сертификат
        </div>

        {/* Amount */}
        <div style={{
          background: '#111', borderRadius: '14px', padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '0.02em' }}>
            {formatMoney(cert.amount)}
          </div>
        </div>

        {/* Code */}
        <div style={{
          fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: '700',
          letterSpacing: '0.2em', color: '#111', background: '#F9FAFB',
          border: '1.5px dashed #D4AF37', borderRadius: '10px',
          padding: '12px 20px', marginBottom: '1.25rem',
        }}>
          {cert.code}
        </div>

        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '1.75rem' }}>
          Действителен до: <strong style={{ color: '#111' }}>{formatDate(cert.expiresAt)}</strong>
        </div>

        <div style={{ display: 'flex', gap: '10px' }} className="print:hidden">
          <button
            onClick={() => window.print()}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              background: '#111', color: '#FFF', fontWeight: '700', fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            🖨 Печать
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: '1px solid #E5E7EB',
              background: '#FFF', color: '#374151', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GiftCertificates({ managerId }: GiftCertificatesProps) {
  const [certs, setCerts] = useState<GiftCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [printCert, setPrintCert] = useState<GiftCertificate | null>(null);

  const [issueAmount, setIssueAmount] = useState('');
  const [issueExpiry, setIssueExpiry] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  const [validateCode, setValidateCode] = useState('');
  const [validateLeadId, setValidateLeadId] = useState('');
  const [validateResult, setValidateResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);

  const fetchCerts = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/gift-certificates');
      if (res.ok) {
        const data = await res.json();
        setCerts(Array.isArray(data) ? data : (data.certificates ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!issueAmount || !issueExpiry) return;
    setIssueLoading(true);
    try {
      await fetch('/api/crm/gift-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(issueAmount), expiresAt: issueExpiry, issuedBy: managerId }),
      });
      setIssueAmount('');
      setIssueExpiry('');
      await fetchCerts();
    } finally {
      setIssueLoading(false);
    }
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCode) return;
    setValidateLoading(true);
    setValidateResult(null);
    try {
      const res = await fetch('/api/crm/gift-certificates/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: validateCode, leadId: validateLeadId || undefined }),
      });
      const data = await res.json();
      setValidateResult(data);
      if (data.valid) await fetchCerts();
    } finally {
      setValidateLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #2D2D2D', background: '#0D0D0D',
    color: '#FFF', fontSize: '0.85rem', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Issue form ── */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)',
        borderRadius: '16px', padding: '1.5rem',
        border: '1px solid #2A2A2A',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
          }}>🎁</div>
          <div>
            <div style={{ fontWeight: '700', color: '#FFF', fontSize: '0.95rem' }}>Выпустить сертификат</div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Новый подарочный сертификат Tomiori</div>
          </div>
        </div>
        <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Сумма (₸)
              </label>
              <input
                type="number"
                value={issueAmount}
                onChange={e => setIssueAmount(e.target.value)}
                placeholder="50 000"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Действителен до
              </label>
              <input
                type="date"
                value={issueExpiry}
                onChange={e => setIssueExpiry(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!issueAmount || !issueExpiry || issueLoading}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: 'none',
              background: issueLoading || !issueAmount || !issueExpiry
                ? '#2A2A2A'
                : 'linear-gradient(135deg, #D4AF37, #B8860B)',
              color: issueLoading || !issueAmount || !issueExpiry ? '#555' : '#111',
              fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {issueLoading ? '⏳ Выпуск...' : '✦ Выпустить сертификат'}
          </button>
        </form>
      </div>

      {/* ── Validate / apply ── */}
      <div style={{
        background: '#111', borderRadius: '16px', padding: '1.5rem',
        border: '1px solid #1E3A2A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#0D2B1A', border: '1px solid #065F46',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>✓</div>
          <div>
            <div style={{ fontWeight: '700', color: '#FFF', fontSize: '0.95rem' }}>Проверить / применить</div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Валидация и применение к сделке</div>
          </div>
        </div>
        <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Код сертификата
            </label>
            <input
              type="text"
              value={validateCode}
              onChange={e => setValidateCode(e.target.value.toUpperCase())}
              placeholder="GIFT-XXXX-XXXX"
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.1em', color: '#D4AF37' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ID сделки (необязательно)
            </label>
            <input
              type="text"
              value={validateLeadId}
              onChange={e => setValidateLeadId(e.target.value)}
              placeholder="lead-id"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={!validateCode || validateLoading}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: 'none',
              background: !validateCode || validateLoading ? '#1A2A1A' : '#065F46',
              color: !validateCode || validateLoading ? '#4B5563' : '#34D399',
              fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {validateLoading ? '⏳ Проверка...' : '✓ Применить'}
          </button>
          {validateResult && (
            <div style={{
              padding: '12px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600',
              background: validateResult.valid ? '#0D2B1A' : '#2B0D0D',
              color: validateResult.valid ? '#34D399' : '#F87171',
              border: `1px solid ${validateResult.valid ? '#065F46' : '#7F1D1D'}`,
            }}>
              {validateResult.valid ? '✓ Сертификат действителен и применён' : `✗ ${validateResult.error}`}
            </div>
          )}
        </form>
      </div>

      {/* ── Certificate list ── */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Все сертификаты
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#4B5563', fontSize: '0.85rem' }}>Загрузка...</div>
        ) : certs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2.5rem', color: '#4B5563', fontSize: '0.85rem',
            background: '#111', borderRadius: '14px', border: '1px dashed #2A2A2A',
          }}>
            🎁 Сертификаты не найдены
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {certs.map(cert => (
              <div key={cert.certificateId} style={{
                background: '#111', borderRadius: '14px', padding: '1rem 1.25rem',
                border: `1px solid ${cert.status === 'active' ? '#1E3A2A' : '#1F1F1F'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ minWidth: 0 }}>
                  {/* Code */}
                  <div style={{
                    fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: '700',
                    color: '#D4AF37', letterSpacing: '0.12em', marginBottom: '5px',
                  }}>
                    {cert.code}
                  </div>
                  {/* Amount + expiry */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFF' }}>
                      {formatMoney(cert.amount)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                      до {formatDate(cert.expiresAt)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <StatusBadge status={cert.status} />
                  {cert.status === 'active' && (
                    <button
                      onClick={() => setPrintCert(cert)}
                      title="Печать"
                      style={{
                        width: '34px', height: '34px', borderRadius: '8px',
                        background: '#1A1A1A', border: '1px solid #2A2A2A',
                        color: '#9CA3AF', cursor: 'pointer', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      🖨
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {printCert && <PrintModal cert={printCert} onClose={() => setPrintCert(null)} />}
    </div>
  );
}
