'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Package, DollarSign, Shield, Plus, Edit2, X, Check, Trash2 } from 'lucide-react';
import type { Warehouse, JewelryUnit } from '@/lib/crm/types';

interface WarehouseReportProps {
  managerId: string;
  isAdmin: boolean;
}

interface WarehouseSummary {
  warehouseId: string;
  totalUnits: number;
  totalValue: number;
  byStatus: Record<string, number>;
}

const EMPTY_FORM = { name: '', branchId: '', address: '', managerId: '' };

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

function needsAudit(unit: JewelryUnit): boolean {
  if (!unit.lastAudit?.auditedAt) return true;
  return (Date.now() - new Date(unit.lastAudit.auditedAt).getTime()) / 86400000 > 30;
}

export default function WarehouseReport({ managerId, isAdmin }: WarehouseReportProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [summaries, setSummaries] = useState<WarehouseSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stock, setStock] = useState<Record<string, (JewelryUnit & { requiresAudit?: boolean })[]>>({});
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [whRes, sumRes] = await Promise.all([
        fetch('/api/crm/warehouses'),
        fetch('/api/crm/warehouses/summary'),
      ]);
      if (whRes.ok) {
        const d = await whRes.json();
        setWarehouses(d.warehouses ?? d);
      }
      if (sumRes.ok) {
        const d = await sumRes.json();
        setSummaries(d.summary ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleExpand(warehouseId: string) {
    if (expandedId === warehouseId) { setExpandedId(null); return; }
    setExpandedId(warehouseId);
    if (!stock[warehouseId]) {
      const res = await fetch(`/api/crm/warehouses/${warehouseId}/stock`);
      if (res.ok) {
        const d = await res.json();
        setStock(prev => ({ ...prev, [warehouseId]: d.units ?? d }));
      }
    }
  }

  async function handleAudit(unitId: string, warehouseId: string) {
    setAuditLoading(unitId);
    try {
      await fetch(`/api/crm/units/${unitId}/audit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, warehouseId }),
      });
      const res = await fetch(`/api/crm/warehouses/${warehouseId}/stock`);
      if (res.ok) {
        const d = await res.json();
        setStock(prev => ({ ...prev, [warehouseId]: d.units ?? d }));
      }
    } finally {
      setAuditLoading(null);
    }
  }

  function openCreate() {
    setEditingWh(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(wh: Warehouse) {
    setEditingWh(wh);
    setForm({ name: wh.name, branchId: wh.branchId, address: wh.address, managerId: wh.managerId });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingWh) {
        await fetch(`/api/crm/warehouses/${editingWh.warehouseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, managerId: form.managerId || managerId }),
        });
      } else {
        await fetch('/api/crm/warehouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, managerId: form.managerId || managerId, requestManagerId: managerId }),
        });
      }
      setShowForm(false);
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(wh: Warehouse) {
    if (!confirm(`Деактивировать склад «${wh.name}»?`)) return;
    await fetch(`/api/crm/warehouses/${wh.warehouseId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId }),
    });
    await fetchData();
  }

  // Totals across all warehouses
  const totalUnits = summaries.reduce((s, x) => s + x.totalUnits, 0);
  const totalValue = summaries.reduce((s, x) => s + x.totalValue, 0);

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header + add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>СКЛАДОВ</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{warehouses.filter(w => w.isActive).length}</div>
          </div>
          <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>ЕДИНИЦ</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#3B82F6' }}>{totalUnits}</div>
          </div>
          <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>СТОИМОСТЬ</div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10B981' }}>{formatMoney(totalValue)}</div>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={15} /> Добавить склад
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{editingWh ? 'Редактировать склад' : 'Новый склад'}</div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.5, display: 'block', marginBottom: '4px' }}>НАЗВАНИЕ *</label>
              <input className="luxury-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Главный склад" />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ФИЛИАЛ / ГОРОД</label>
              <input className="luxury-input" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} placeholder="Актобе" />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.5, display: 'block', marginBottom: '4px' }}>АДРЕС</label>
              <input className="luxury-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="ул. Примерная, 1" />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ОТВЕТСТВЕННЫЙ (ID менеджера)</label>
              <input className="luxury-input" value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} placeholder={managerId} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontSize: '0.8rem' }}>Отмена</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#FFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', opacity: saving ? 0.6 : 1 }}>
              {saving ? '...' : <><Check size={14} style={{ display: 'inline', marginRight: '4px' }} />{editingWh ? 'Сохранить' : 'Создать'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Warehouse list */}
      {warehouses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>
          <Package size={40} style={{ margin: '0 auto 12px' }} />
          <div>Склады не добавлены</div>
          {isAdmin && <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>Нажмите «Добавить склад» чтобы начать</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {warehouses.map(wh => {
            const isExpanded = expandedId === wh.warehouseId;
            const whStock = stock[wh.warehouseId] ?? [];
            const whSummary = summaries.find(s => s.warehouseId === wh.warehouseId);

            return (
              <div key={wh.warehouseId} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', opacity: wh.isActive ? 1 : 0.5 }}>
                {/* Warehouse header */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
                  <button onClick={() => handleExpand(wh.warehouseId)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      🏭
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {wh.name}
                        {!wh.isActive && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: '20px' }}>Деактивирован</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '2px' }}>
                        {[wh.branchId, wh.address].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {whSummary && (
                      <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>единиц</div>
                          <div style={{ fontWeight: '700', color: '#3B82F6' }}>{whSummary.totalUnits}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>стоимость</div>
                          <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.8rem' }}>{formatMoney(whSummary.totalValue)}</div>
                        </div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} style={{ opacity: 0.4, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ opacity: 0.4, flexShrink: 0 }} />}
                  </button>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => openEdit(wh)} title="Редактировать"
                        style={{ padding: '6px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', color: '#6B7280' }}>
                        <Edit2 size={13} />
                      </button>
                      {wh.isActive && (
                        <button onClick={() => handleDeactivate(wh)} title="Деактивировать"
                          style={{ padding: '6px', borderRadius: '8px', border: '1px solid #FEE2E2', background: '#FFF', cursor: 'pointer', color: '#EF4444' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stock table */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px' }}>
                    {whStock.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', opacity: 0.3, fontSize: '0.8rem' }}>Нет единиц на этом складе</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <thead>
                            <tr style={{ background: '#F8F9FA' }}>
                              {['ID', 'Статус', 'Вес (г)', 'Проба', 'Цена', ...(isAdmin ? ['Аудит'] : [])].map(h => (
                                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#6B7280', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {whStock.map(unit => {
                              const audit = needsAudit(unit);
                              return (
                                <tr key={unit.unitId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#D4AF37', fontSize: '0.72rem' }}>{unit.unitId}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: '#374151' }}>{unit.locationStatus}</span>
                                      {audit && (
                                        <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '20px', background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          <AlertCircle size={9} /> проверка
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#374151' }}>{unit.metalWeight.toFixed(2)}</td>
                                  <td style={{ padding: '8px 10px', color: '#374151' }}>{unit.purity}</td>
                                  <td style={{ padding: '8px 10px', fontWeight: '600' }}>{formatMoney(unit.price)}</td>
                                  {isAdmin && (
                                    <td style={{ padding: '8px 10px' }}>
                                      {audit && (
                                        <button onClick={() => handleAudit(unit.unitId, wh.warehouseId)} disabled={auditLoading === unit.unitId}
                                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#F59E0B', color: '#FFF', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', opacity: auditLoading === unit.unitId ? 0.5 : 1 }}>
                                          <Shield size={10} /> {auditLoading === unit.unitId ? '...' : 'Проверить'}
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
