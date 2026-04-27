'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ShieldCheck, MapPin, Calendar, User } from 'lucide-react';

function VerifyReceiptContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const code = searchParams.get('code');
  
  const [receipt, setReceipt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading');

  useEffect(() => {
    if (id && code) {
      fetch(`/api/crm/receipts?id=${id}&verify=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.verified) {
            setReceipt(data.receipt);
            setStatus('verified');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [id, code]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'serif' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ background: '#FFF', width: '100%', maxWidth: '500px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      >
        {status === 'loading' && (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #EEE', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ marginTop: '20px', opacity: 0.5 }}>Проверка подлинности...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <XCircle size={60} color="#EF4444" style={{ marginBottom: '20px' }} />
            <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Ошибка верификации</h1>
            <p style={{ opacity: 0.5 }}>Данный чек не найден или код безопасности недействителен.</p>
          </div>
        )}

        {status === 'verified' && receipt && (
          <div>
            <div style={{ background: '#1A1A1A', padding: '3rem 2rem', textAlign: 'center', color: '#FFF' }}>
              <ShieldCheck size={50} color="#D4AF37" style={{ marginBottom: '15px' }} />
              <h1 style={{ fontSize: '1.8rem', letterSpacing: '2px', margin: 0 }}>ПОДТВЕРЖДЕНО</h1>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Подлинное изделие Tomiori</p>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: 'none', stroke: '#1A1A1A', strokeWidth: '2' }}>
                      <path d="M50 10 L90 40 L50 90 L10 40 Z" />
                      <path d="M50 10 L70 40 L50 90 L30 40 Z" />
                      <path d="M10 40 L90 40" />
                      <path d="M30 40 L50 10 L70 40" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '4px', lineHeight: 1 }}>TOMIORI</div>
                  <div style={{ fontSize: '0.5rem', letterSpacing: '2px', opacity: 0.8, textTransform: 'uppercase' }}>HIGH JEWELRY</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2rem' }}>
                <div style={{ padding: '15px', background: '#F9F9FB', borderRadius: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', opacity: 0.4 }}>
                    <User size={14} /> <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Владелец</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{receipt.customerName}</div>
                </div>
                <div style={{ padding: '15px', background: '#F9F9FB', borderRadius: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', opacity: 0.4 }}>
                    <Calendar size={14} /> <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Дата покупки</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{new Date(receipt.timestamp).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 'bold', opacity: 0.4, textTransform: 'uppercase', marginBottom: '10px' }}>Изделия</div>
                {receipt.products.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EEE' }}>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ color: '#D4AF37', fontWeight: 'bold' }}>{p.price.toLocaleString()} ₸</div>
                  </div>
                ))}
                {receipt.packagingPrice > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EEE', opacity: 0.7 }}>
                    <div>Упаковка и оформление</div>
                    <div>{receipt.packagingPrice.toLocaleString()} ₸</div>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', borderTop: '2px solid #F1F3F5', paddingTop: '2rem' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '5px' }}>ИТОГОВАЯ СТОИМОСТЬ</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1A1A1A' }}>{receipt.totalAmount.toLocaleString()} ₸</div>
              </div>

              <div style={{ marginTop: '3rem', fontSize: '0.7rem', opacity: 0.4, textAlign: 'center', lineHeight: '1.6' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '5px' }} />
                г. Астана, ТРЦ "Керуен", 2 этаж<br/>
                ID Цифрового сертификата: {receipt.id}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyReceiptPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Загрузка системы верификации...</div>}>
      <VerifyReceiptContent />
    </Suspense>
  );
}
