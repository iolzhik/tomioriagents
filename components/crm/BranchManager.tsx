'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp, Building2, Warehouse, Users, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { Branch, Warehouse as WarehouseType, JewelryUnit, Manager } from '@/lib/crm/types';

interface AccountingEntry { id: string; type: string; category: string; amount: number; description: string; managerId: string; timestamp: string; isConfirmed?: boolean; }

interface Props { currentManagerId: string; isAdmin: boolean; }

type Tab = 'branches' | 'warehouses' | 'staff' | 'units' | 'accounting';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'branches', icon: '🏙', label: 'Города / Филиалы' },
  { id: 'warehouses', icon: '🏭', label: 'Склады' },
  { id: 'staff', icon: '👥', label: 'Сотрудники' },
  { id: 'units', icon: '💎', label: 'ТМЦ по складам' },
  { id: 'accounting', icon: '💰', label: 'Бухгалтерия' },
];

function fmt(n: number) { return n.toLocaleString('ru-RU') + ' ₸'; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('ru-RU'); }

// ─── Branches Tab ─────────────────────────────────────────────────────────────
function BranchesTab({ isAdmin }: { isAdmin: boolean }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: '', city: '', address: '' });
  const [editing, setEditing] = useState<Branch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/crm/branches');
    if (r.ok) { const d = await r.json(); setBranches(d.branches ?? d); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/crm/branches/${editing.branchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/crm/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowForm(false); setEditing(null); setForm({ name: '', city: '', address: '' }); await load();
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Удалить филиал?')) return;
    await fetch(`/api/crm/branches/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerId: 'admin' }) });
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { setEditing(null); setForm({ name: '', city: '', address: '' }); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={14} /> Добавить филиал
          </button>
        </div>
      )}
      {showForm && (
        <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>НАЗВАНИЕ *</label>
              <input className="luxury-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Актобе" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ГОРОД *</label>
              <input className="luxury-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Актобе" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>АДРЕС</label>
              <input className="luxury-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="ул. Примерная, 1" /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontSize: '0.8rem' }}>Отмена</button>
            <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#FFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>{saving ? '...' : (editing ? 'Сохранить' : 'Создать')}</button>
          </div>
        </div>
      )}
      {branches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}><Building2 size={40} style={{ margin: '0 auto 12px' }} /><div>Филиалы не добавлены</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {branches.map(b => (
            <div key={b.branchId} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🏙 {b.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '3px' }}>{b.city}{b.address ? ` · ${b.address}` : ''}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.3, marginTop: '4px' }}>ID: {b.branchId}</div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setEditing(b); setForm({ name: b.name, city: b.city, address: b.address }); setShowForm(true); }}
                      style={{ padding: '5px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', color: '#6B7280' }}><Edit2 size={12} /></button>
                    <button onClick={() => del(b.branchId)}
                      style={{ padding: '5px', borderRadius: '6px', border: '1px solid #FEE2E2', background: '#FFF', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Warehouses Tab ───────────────────────────────────────────────────────────
function WarehousesTab({ currentManagerId, isAdmin }: { currentManagerId: string; isAdmin: boolean }) {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [form, setForm] = useState({ name: '', branchId: '', address: '', managerId: '' });
  const [editing, setEditing] = useState<WarehouseType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [wr, br, mr] = await Promise.all([fetch('/api/crm/warehouses'), fetch('/api/crm/branches'), fetch('/api/crm/managers')]);
    if (wr.ok) { const d = await wr.json(); setWarehouses(d.warehouses ?? d); }
    if (br.ok) { const d = await br.json(); setBranches(d.branches ?? d); }
    if (mr.ok) { const d = await mr.json(); setManagers(d.managers ?? d); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, managerId: form.managerId || currentManagerId, requestManagerId: currentManagerId };
      if (editing) {
        await fetch(`/api/crm/warehouses/${editing.warehouseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/crm/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setShowForm(false); setEditing(null); setForm({ name: '', branchId: '', address: '', managerId: '' }); await load();
    } finally { setSaving(false); }
  }

  async function deactivate(wh: WarehouseType) {
    if (!confirm(`Деактивировать «${wh.name}»?`)) return;
    await fetch(`/api/crm/warehouses/${wh.warehouseId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerId: currentManagerId }) });
    await load();
  }

  const branchName = (id: string) => branches.find(b => b.branchId === id)?.name || id;
  const managerName = (id: string) => managers.find(m => m.id === id)?.name || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { setEditing(null); setForm({ name: '', branchId: '', address: '', managerId: '' }); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={14} /> Добавить склад
          </button>
        </div>
      )}
      {showForm && (
        <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>НАЗВАНИЕ *</label>
              <input className="luxury-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Главный склад" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ФИЛИАЛ</label>
              <select className="luxury-input" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}>
                <option value="">— выбрать —</option>
                {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name} ({b.city})</option>)}
              </select></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>АДРЕС</label>
              <input className="luxury-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="ул. Примерная, 1" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ОТВЕТСТВЕННЫЙ</label>
              <select className="luxury-input" value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                <option value="">— выбрать —</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
              </select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontSize: '0.8rem' }}>Отмена</button>
            <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#FFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>{saving ? '...' : (editing ? 'Сохранить' : 'Создать')}</button>
          </div>
        </div>
      )}
      {warehouses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}><Warehouse size={40} style={{ margin: '0 auto 12px' }} /><div>Склады не добавлены</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {warehouses.map(wh => (
            <div key={wh.warehouseId} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', opacity: wh.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏭 {wh.name}
                    {!wh.isActive && <span style={{ fontSize: '0.6rem', background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: '20px' }}>Деактивирован</span>}
                  </div>
                  {wh.branchId && <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: '3px' }}>📍 {branchName(wh.branchId)}</div>}
                  {wh.address && <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '2px' }}>{wh.address}</div>}
                  {wh.managerId && <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '2px' }}>👤 {managerName(wh.managerId)}</div>}
                  <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', opacity: 0.3, marginTop: '4px' }}>ID: {wh.warehouseId}</div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => { setEditing(wh); setForm({ name: wh.name, branchId: wh.branchId, address: wh.address, managerId: wh.managerId }); setShowForm(true); }}
                      style={{ padding: '5px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', color: '#6B7280' }}><Edit2 size={12} /></button>
                    {wh.isActive && <button onClick={() => deactivate(wh)}
                      style={{ padding: '5px', borderRadius: '6px', border: '1px solid #FEE2E2', background: '#FFF', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={12} /></button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab({ currentManagerId, isAdmin }: { currentManagerId: string; isAdmin: boolean }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMgr, setEditingMgr] = useState<Manager | null>(null);
  const [form, setForm] = useState({ name: '', login: '', password: '', role: 'sales', phone: '', branchId: '', hireDate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [mr, br, wr] = await Promise.all([fetch('/api/crm/managers'), fetch('/api/crm/branches'), fetch('/api/crm/warehouses')]);
    if (mr.ok) { const d = await mr.json(); setManagers(d.managers ?? d); }
    if (br.ok) { const d = await br.json(); setBranches(d.branches ?? d); }
    if (wr.ok) { const d = await wr.json(); setWarehouses(d.warehouses ?? d); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', sales: 'Менеджер продаж', accountant: 'Бухгалтер' };
  const ROLE_COLORS: Record<string, string> = { admin: '#7C3AED', sales: '#2563EB', accountant: '#059669' };

  const filtered = managers.filter(m => filterBranch === 'all' || (m as any).branchId === filterBranch);

  function openCreate() {
    setEditingMgr(null);
    setForm({ name: '', login: '', password: '', role: 'sales', phone: '', branchId: filterBranch !== 'all' ? filterBranch : '', hireDate: '' });
    setShowForm(true);
  }

  function openEdit(m: Manager) {
    setEditingMgr(m);
    setForm({ name: m.name, login: m.login, password: '', role: m.role, phone: m.phone || '', branchId: (m as any).branchId || '', hireDate: m.hireDate || '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim() || !form.login.trim()) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      let res: Response;
      if (editingMgr) {
        payload.id = editingMgr.id;
        res = await fetch('/api/crm/managers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/crm/managers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const data = await res!.json().catch(() => ({} as any));
      if (!res!.ok || data?.success === false) {
        alert(data?.error || 'Не удалось сохранить сотрудника');
        return;
      }
      setShowForm(false); setEditingMgr(null); await load();
    } finally { setSaving(false); }
  }

  async function assignBranch(managerId: string, branchId: string) {
    await fetch('/api/crm/managers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: managerId, branchId }) });
    await load();
  }

  const branchName = (id: string) => branches.find(b => b.branchId === id)?.name || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="luxury-input" style={{ width: 'auto' }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="all">Все филиалы</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name} ({b.city})</option>)}
          </select>
          <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{filtered.length} сотрудников</span>
        </div>
        {isAdmin && (
          <button onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={14} /> Добавить сотрудника
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{editingMgr ? 'Редактировать сотрудника' : 'Новый сотрудник'}</div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}><X size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ИМЯ *</label>
              <input className="luxury-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иван Иванов" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ЛОГИН *</label>
              <input className="luxury-input" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="ivan" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ПАРОЛЬ {editingMgr ? '(не менять — оставь пустым)' : '*'}</label>
              <input className="luxury-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>РОЛЬ</label>
              <select className="luxury-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="sales">Менеджер продаж</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
              </select></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ТЕЛЕФОН</label>
              <input className="luxury-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7 777 000 00 00" /></div>
            <div><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ДАТА НАЙМА</label>
              <input className="luxury-input" type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ФИЛИАЛ</label>
              <select className="luxury-input" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}>
                <option value="">— Не привязан —</option>
                {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name} ({b.city})</option>)}
              </select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontSize: '0.8rem' }}>Отмена</button>
            <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#FFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>{saving ? '...' : (editingMgr ? 'Сохранить' : 'Создать')}</button>
          </div>
        </div>
      )}

      {/* Staff cards grouped by branch */}
      {branches.length > 0 && filterBranch === 'all' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Unassigned */}
          {managers.filter(m => !(m as any).branchId).length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.4, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Без филиала</div>
              <StaffGrid managers={managers.filter(m => !(m as any).branchId)} branches={branches} warehouses={warehouses} isAdmin={isAdmin} onEdit={openEdit} onAssign={assignBranch} ROLE_LABELS={ROLE_LABELS} ROLE_COLORS={ROLE_COLORS} />
            </div>
          )}
          {branches.map(b => {
            const branchManagers = managers.filter(m => (m as any).branchId === b.branchId);
            if (branchManagers.length === 0) return null;
            return (
              <div key={b.branchId}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6' }}>
                  📍 {b.name} ({b.city}) — {branchManagers.length} чел.
                </div>
                <StaffGrid managers={branchManagers} branches={branches} warehouses={warehouses} isAdmin={isAdmin} onEdit={openEdit} onAssign={assignBranch} ROLE_LABELS={ROLE_LABELS} ROLE_COLORS={ROLE_COLORS} />
              </div>
            );
          })}
        </div>
      ) : (
        <StaffGrid managers={filtered} branches={branches} warehouses={warehouses} isAdmin={isAdmin} onEdit={openEdit} onAssign={assignBranch} ROLE_LABELS={ROLE_LABELS} ROLE_COLORS={ROLE_COLORS} />
      )}
    </div>
  );
}

function StaffGrid({ managers, branches, warehouses, isAdmin, onEdit, onAssign, ROLE_LABELS, ROLE_COLORS }: {
  managers: Manager[]; branches: Branch[]; warehouses: WarehouseType[];
  isAdmin: boolean; onEdit: (m: Manager) => void; onAssign: (id: string, branchId: string) => void;
  ROLE_LABELS: Record<string, string>; ROLE_COLORS: Record<string, string>;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
      {managers.map(m => {
        const myWarehouses = warehouses.filter(w => w.managerId === m.id);
        const branchName = (m as any).branchId ? branches.find(b => b.branchId === (m as any).branchId)?.name : null;
        return (
          <div key={m.id} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: (ROLE_COLORS[m.role] || '#6B7280') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {m.role === 'admin' ? '👑' : m.role === 'accountant' ? '📊' : '💼'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{m.name}</div>
                  <span style={{ fontSize: '0.65rem', padding: '1px 8px', borderRadius: '20px', background: (ROLE_COLORS[m.role] || '#6B7280') + '15', color: ROLE_COLORS[m.role] || '#6B7280', fontWeight: '600' }}>
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => onEdit(m)} style={{ padding: '4px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', color: '#6B7280' }}>
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            {m.phone && <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '4px' }}>📞 {m.phone}</div>}
            {/* Branch assignment */}
            {isAdmin ? (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.6rem', opacity: 0.4, display: 'block', marginBottom: '3px' }}>ФИЛИАЛ</label>
                <select
                  value={(m as any).branchId || ''}
                  onChange={e => onAssign(m.id, e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.75rem', background: '#F9FAFB', outline: 'none' }}
                >
                  <option value="">— Не привязан —</option>
                  {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                </select>
              </div>
            ) : branchName ? (
              <div style={{ fontSize: '0.72rem', color: '#3B82F6', marginTop: '6px' }}>📍 {branchName}</div>
            ) : null}
            {myWarehouses.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '3px' }}>СКЛАДЫ:</div>
                {myWarehouses.map(w => (
                  <div key={w.warehouseId} style={{ fontSize: '0.72rem', color: '#3B82F6' }}>🏭 {w.name}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Units by Warehouse Tab ───────────────────────────────────────────────────
function UnitsTab() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stock, setStock] = useState<Record<string, JewelryUnit[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [wr, br] = await Promise.all([fetch('/api/crm/warehouses'), fetch('/api/crm/branches')]);
    if (wr.ok) { const d = await wr.json(); setWarehouses(d.warehouses ?? d); }
    if (br.ok) { const d = await br.json(); setBranches(d.branches ?? d); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function expand(warehouseId: string) {
    if (expanded === warehouseId) { setExpanded(null); return; }
    setExpanded(warehouseId);
    if (!stock[warehouseId]) {
      const r = await fetch(`/api/crm/warehouses/${warehouseId}/stock`);
      if (r.ok) { const d = await r.json(); setStock(p => ({ ...p, [warehouseId]: d.units ?? d })); }
    }
  }

  const branchName = (id: string) => branches.find(b => b.branchId === id)?.name || id;

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {warehouses.filter(w => w.isActive).map(wh => {
        const units = stock[wh.warehouseId] ?? [];
        const isOpen = expanded === wh.warehouseId;
        const totalVal = units.reduce((s, u) => s + (u.price || 0), 0);
        return (
          <div key={wh.warehouseId} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => expand(wh.warehouseId)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: '1.2rem' }}>🏭</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{wh.name}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>{branchName(wh.branchId)}{wh.address ? ` · ${wh.address}` : ''}</div>
              </div>
              {isOpen && units.length > 0 && (
                <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>ЕДИНИЦ</div>
                    <div style={{ fontWeight: '700', color: '#3B82F6' }}>{units.length}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>СТОИМОСТЬ</div>
                    <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.8rem' }}>{fmt(totalVal)}</div>
                  </div>
                </div>
              )}
              {isOpen ? <ChevronUp size={16} style={{ opacity: 0.4, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ opacity: 0.4, flexShrink: 0 }} />}
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 16px' }}>
                {units.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', opacity: 0.3, fontSize: '0.8rem' }}>Нет единиц на этом складе</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#F8F9FA' }}>
                          {['ID', 'SKU', 'Статус', 'Металл', 'Проба', 'Вес (г)', 'Цена'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: '600', color: '#6B7280', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {units.map((u: any) => (
                          <tr key={u.unitId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: '#D4AF37', fontSize: '0.7rem' }}>{u.unitId}</td>
                            <td style={{ padding: '7px 10px', color: '#374151' }}>{u.skuId}</td>
                            <td style={{ padding: '7px 10px' }}>
                              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '20px', background: '#F3F4F6', color: '#374151' }}>{u.locationStatus}</span>
                            </td>
                            <td style={{ padding: '7px 10px', color: '#374151' }}>{u.metalColor || '—'}</td>
                            <td style={{ padding: '7px 10px', color: '#374151' }}>{u.purity}</td>
                            <td style={{ padding: '7px 10px', color: '#374151' }}>{u.metalWeight?.toFixed(2)}</td>
                            <td style={{ padding: '7px 10px', fontWeight: '600' }}>{fmt(u.price || 0)}</td>
                          </tr>
                        ))}
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
  );
}

// ─── Accounting Tab ───────────────────────────────────────────────────────────
function AccountingTab({ currentManagerId, isAdmin }: { currentManagerId: string; isAdmin: boolean }) {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filterManager, setFilterManager] = useState(isAdmin ? 'all' : currentManagerId);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [ar, mr] = await Promise.all([fetch('/api/crm/accounting'), fetch('/api/crm/managers')]);
    if (ar.ok) { const d = await ar.json(); setEntries(d.entries ?? []); }
    if (mr.ok) { const d = await mr.json(); setManagers(d.managers ?? d); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter(e => {
    if (filterManager !== 'all' && e.managerId !== filterManager) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  const totalIncome = filtered.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  const managerName = (id: string) => managers.find(m => m.id === id)?.name || id;

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'ДОХОДЫ', value: totalIncome, color: '#10B981', icon: <TrendingUp size={18} /> },
          { label: 'РАСХОДЫ', value: totalExpense, color: '#EF4444', icon: <TrendingDown size={18} /> },
          { label: 'ПРИБЫЛЬ', value: profit, color: profit >= 0 ? '#10B981' : '#EF4444', icon: <DollarSign size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{s.label}</div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: s.color }}>{fmt(s.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {isAdmin && (
          <select className="luxury-input" style={{ width: 'auto' }} value={filterManager} onChange={e => setFilterManager(e.target.value)}>
            <option value="all">Все сотрудники</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <select className="luxury-input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Все типы</option>
          <option value="income">Доходы</option>
          <option value="expense">Расходы</option>
          <option value="tax">Налоги</option>
        </select>
        <span style={{ fontSize: '0.75rem', opacity: 0.5, alignSelf: 'center' }}>{filtered.length} записей</span>
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA' }}>
                {['Дата', 'Тип', 'Категория', 'Описание', 'Сотрудник', 'Сумма'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#6B7280', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '9px 12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(e.timestamp)}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                      background: e.type === 'income' ? '#D1FAE5' : e.type === 'expense' ? '#FEE2E2' : '#FEF3C7',
                      color: e.type === 'income' ? '#065F46' : e.type === 'expense' ? '#991B1B' : '#92400E' }}>
                      {e.type === 'income' ? '↑ Доход' : e.type === 'expense' ? '↓ Расход' : '⚖ Налог'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', color: '#374151' }}>{e.category}</td>
                  <td style={{ padding: '9px 12px', color: '#6B7280', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                  <td style={{ padding: '9px 12px', color: '#374151' }}>{managerName(e.managerId)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: e.type === 'income' ? '#10B981' : '#EF4444', whiteSpace: 'nowrap' }}>
                    {e.type === 'income' ? '+' : '-'}{fmt(e.amount)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.3 }}>Нет записей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main BranchManager ───────────────────────────────────────────────────────
export default function BranchManager({ currentManagerId, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>('branches');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: tab === t.id ? '#FFF' : 'transparent',
              fontSize: '0.78rem', fontWeight: tab === t.id ? '700' : '500', cursor: 'pointer',
              color: tab === t.id ? '#1A1A1A' : '#6B7280',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'branches' && <BranchesTab isAdmin={isAdmin} />}
      {tab === 'warehouses' && <WarehousesTab currentManagerId={currentManagerId} isAdmin={isAdmin} />}
      {tab === 'staff' && <StaffTab currentManagerId={currentManagerId} isAdmin={isAdmin} />}
      {tab === 'units' && <UnitsTab />}
      {tab === 'accounting' && <AccountingTab currentManagerId={currentManagerId} isAdmin={isAdmin} />}
    </div>
  );
}
