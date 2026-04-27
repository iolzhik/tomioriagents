'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Edit2, Trash2, X, Check, DollarSign, TrendingUp,
  Calendar, ChevronLeft, ChevronRight, User, Shield, Lock,
  Percent, Target, Award, AlertCircle, Download, Banknote,
  Clock, Heart, Minus, CheckCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ManagerPermissions {
  kanban: boolean; creative: boolean; accounting: boolean;
  warehouse: boolean; analytics: boolean; receipts: boolean;
  shop: boolean; website_cms: boolean; hr: boolean;
}

interface SalaryPlan {
  managerId: string; type: 'fixed_bonus' | 'bonus_only';
  fixedSalary: number; bonusPercent: number;
  monthlyPlan: number; planBonusPercent: number;
}

interface SalaryPayment {
  id: string; managerId: string;
  type: 'advance' | 'salary' | 'bonus' | 'sick_leave' | 'vacation' | 'penalty';
  amount: number; description: string; date: string; createdBy: string;
}

interface Manager {
  id: string; name: string; login: string; role: 'admin' | 'sales' | 'accountant';
  permissions?: ManagerPermissions; phone?: string; hireDate?: string;
}

interface SalaryCalc {
  managerId: string; month: string; totalSales: number;
  fixedSalary: number; salesBonus: number; planBonus: number;
  grossSalary: number; pensionContrib: number; ipn: number;
  socialTax: number; socialInsurance: number; netSalary: number;
  advances: number; bonusPaid: number; sickLeave: number;
  vacation: number; penalties: number; totalPaid: number;
  remaining: number; planAchieved: number | null; salesCount: number;
}

const DEFAULT_PERMISSIONS: ManagerPermissions = {
  kanban: true, creative: false, accounting: false,
  warehouse: false, analytics: true, receipts: true,
  shop: false, website_cms: false, hr: false,
};

function parsePermissions(raw: unknown): ManagerPermissions {
  const base = { ...DEFAULT_PERMISSIONS };
  if (!raw) return base;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return base;
    return { ...base, ...(parsed as Partial<ManagerPermissions>) };
  } catch {
    return base;
  }
}

function normalizeManager(manager: any): Manager {
  return {
    ...manager,
    permissions: parsePermissions(manager?.permissions),
  };
}

const PERMISSION_LABELS: Record<keyof ManagerPermissions, string> = {
  kanban: 'Канбан (CRM)', creative: 'Creative Lab', accounting: 'Бухгалтерия',
  warehouse: 'Склад', analytics: 'Аналитика', receipts: 'Чеки',
  shop: 'Instagram Shop', website_cms: 'Сайт (CMS)', hr: 'HR / Зарплаты',
};

const PAYMENT_TYPES = [
  { id: 'advance', label: 'Аванс', color: '#3B82F6' },
  { id: 'salary', label: 'Зарплата', color: '#10B981' },
  { id: 'bonus', label: 'Бонус', color: '#F59E0B' },
  { id: 'sick_leave', label: 'Больничный', color: '#8B5CF6' },
  { id: 'vacation', label: 'Отпускные', color: '#06B6D4' },
  { id: 'penalty', label: 'Штраф', color: '#EF4444' },
];

const LOCAL_MANAGERS_KEY = 'tomiori_hr_managers_cache_v1';

function readLocalManagers(): Manager[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_MANAGERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeManager);
  } catch {
    return [];
  }
}

function saveLocalManagers(list: Manager[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MANAGERS_KEY, JSON.stringify(list));
  } catch {
    // ignore localStorage quota/availability issues
  }
}

function mergeManagers(serverManagers: Manager[], localManagers: Manager[]): Manager[] {
  const map = new Map<string, Manager>();
  for (const m of serverManagers) map.set(String(m.id), normalizeManager(m));
  for (const m of localManagers) map.set(String(m.id), normalizeManager(m));
  return Array.from(map.values());
}

// ─── Salary Card ──────────────────────────────────────────────────────────────

function SalaryCard({ calc, manager, plan, onPay }: {
  calc: SalaryCalc; manager: Manager;
  plan: SalaryPlan | undefined; onPay: () => void;
}) {
  const planPct = calc.planAchieved;
  return (
    <div style={{ border: '1px solid #EEE', borderRadius: '20px', overflow: 'hidden', background: '#FFF' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #F1F3F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: '#F1F3F5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={22} opacity={0.4} /></div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{manager.name}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{manager.role === 'admin' ? 'Администратор' : 'Менеджер'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>К ВЫПЛАТЕ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: calc.remaining >= 0 ? '#10B981' : '#EF4444' }}>
            {calc.remaining.toLocaleString()} ₸
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>
        {/* Plan progress */}
        {planPct !== null && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '5px' }}>
              <span style={{ opacity: 0.6 }}>Выполнение плана</span>
              <span style={{ fontWeight: 'bold', color: planPct >= 100 ? '#10B981' : '#F59E0B' }}>{planPct}%</span>
            </div>
            <div style={{ height: '6px', background: '#F1F3F5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(planPct, 100)}%`, background: planPct >= 100 ? '#10B981' : '#F59E0B', borderRadius: '3px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '4px' }}>
              {calc.totalSales.toLocaleString()} ₸ из {(plan?.monthlyPlan||0).toLocaleString()} ₸ | {calc.salesCount} продаж
            </div>
          </div>
        )}
        {/* Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
          {[
            { label: 'Оклад', val: calc.fixedSalary, color: '#1A1A1A' },
            { label: 'Бонус с продаж', val: calc.salesBonus, color: '#10B981' },
            { label: 'Бонус за план', val: calc.planBonus, color: '#F59E0B' },
            { label: 'Начислено (gross)', val: calc.grossSalary, color: '#1A1A1A', bold: true },
            { label: 'ОПВ 10%', val: -calc.pensionContrib, color: '#EF4444' },
            { label: 'ИПН 10%', val: -calc.ipn, color: '#EF4444' },
            { label: 'На руки (net)', val: calc.netSalary, color: '#10B981', bold: true },
            { label: 'Выплачено', val: calc.totalPaid, color: '#3B82F6' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8F9FA', borderRadius: '8px' }}>
              <span style={{ opacity: 0.6 }}>{row.label}</span>
              <span style={{ fontWeight: row.bold ? 'bold' : 'normal', color: row.color }}>{row.val.toLocaleString()} ₸</span>
            </div>
          ))}
        </div>
        {/* Employer taxes */}
        <div style={{ marginTop: '10px', padding: '10px', background: '#FFF9F9', borderRadius: '10px', fontSize: '0.7rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', opacity: 0.7 }}>Налоги работодателя (не вычитаются из ЗП):</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>Соц. налог: <b>{calc.socialTax.toLocaleString()} ₸</b></span>
            <span>ОСМС: <b>{calc.socialInsurance.toLocaleString()} ₸</b></span>
          </div>
        </div>
        <button onClick={onPay} className="btn-primary" style={{ width: '100%', marginTop: '14px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Banknote size={16} /> Выплатить / Добавить операцию
        </button>
      </div>
    </div>
  );
}

// ─── Manager Edit Modal ───────────────────────────────────────────────────────

function ManagerEditModal({ manager, onSave, onClose, currentUserId }: {
  manager: Partial<Manager> & { password?: string };
  onSave: (m: any) => void; onClose: () => void; currentUserId: string;
}) {
  const [form, setForm] = useState({
    ...manager,
    permissions: parsePermissions(manager.permissions),
  });
  const [branches, setBranches] = useState<any[]>([]);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setPerm = (k: keyof ManagerPermissions, v: boolean) =>
    setForm(f => ({ ...f, permissions: { ...f.permissions!, [k]: v } }));

  useEffect(() => {
    fetch('/api/crm/branches').then(r => r.ok ? r.json() : { branches: [] }).then(d => setBranches(d.branches ?? []));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ИМЯ *</label>
          <input className="luxury-input" value={form.name||''} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ТЕЛЕФОН</label>
          <input className="luxury-input" value={form.phone||''} onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ЛОГИН *</label>
          <input className="luxury-input" value={form.login||''} onChange={e => set('login', e.target.value)} required />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ПАРОЛЬ {manager.id ? '(оставьте пустым чтобы не менять)' : '*'}</label>
          <input className="luxury-input" type="password" required={!manager.id} value={(form as any).password||''} onChange={e => set('password', e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>РОЛЬ</label>
          <select className="luxury-input" value={form.role||'sales'} onChange={e => set('role', e.target.value)}>
            <option value="sales">Менеджер продаж</option>
            <option value="accountant">Бухгалтер</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ДАТА НАЙМА</label>
          <input className="luxury-input" type="date" value={form.hireDate||''} onChange={e => set('hireDate', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ФИЛИАЛ</label>
          <select className="luxury-input" value={(form as any).branchId||''} onChange={e => set('branchId', e.target.value)}>
            <option value="">— Не привязан к филиалу —</option>
            {branches.map((b: any) => <option key={b.branchId} value={b.branchId}>{b.name} ({b.city})</option>)}
          </select>
        </div>
      </div>

      {/* Permissions */}
      <div style={{ background: '#F8F9FA', borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--gold)" /> Права доступа к разделам
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {(Object.keys(PERMISSION_LABELS) as (keyof ManagerPermissions)[]).map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#FFF', borderRadius: '10px', border: `1px solid ${form.permissions?.[key] ? 'var(--gold)' : '#EEE'}`, cursor: 'pointer', fontSize: '0.8rem' }}>
              <input type="checkbox" checked={!!form.permissions?.[key]} onChange={e => setPerm(key, e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              {PERMISSION_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 24px' }}>Отмена</button>
        <button onClick={() => onSave(form)} className="btn-primary" style={{ padding: '12px 24px' }}>
          {manager.id ? 'Сохранить' : 'Создать менеджера'}
        </button>
      </div>
    </div>
  );
}

// ─── Salary Plan Modal ────────────────────────────────────────────────────────

function SalaryPlanModal({ managerId, managerName, initial, onSave, onClose }: {
  managerId: string; managerName: string;
  initial?: SalaryPlan; onSave: (p: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<SalaryPlan>(initial || {
    managerId, type: 'fixed_bonus', fixedSalary: 0,
    bonusPercent: 5, monthlyPlan: 0, planBonusPercent: 0,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontWeight: 'bold', opacity: 0.7 }}>Настройка зарплаты: {managerName}</div>
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '8px' }}>ТИП НАЧИСЛЕНИЯ</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ id: 'fixed_bonus', label: 'Оклад + Бонус' }, { id: 'bonus_only', label: 'Только бонус' }].map(t => (
            <button key={t.id} type="button" onClick={() => set('type', t.id)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${form.type === t.id ? 'var(--gold)' : '#EEE'}`, background: form.type === t.id ? 'rgba(212,175,55,0.08)' : '#FFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {form.type === 'fixed_bonus' && (
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ОКЛАД (₸/мес)</label>
            <input className="luxury-input" type="number" value={form.fixedSalary} onChange={e => set('fixedSalary', +e.target.value)} />
          </div>
        )}
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>% С ПРОДАЖ</label>
          <input className="luxury-input" type="number" step="0.5" min="0" max="100" value={form.bonusPercent} onChange={e => set('bonusPercent', +e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ПЛАН ВЫРУЧКИ (₸/мес)</label>
          <input className="luxury-input" type="number" value={form.monthlyPlan} onChange={e => set('monthlyPlan', +e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>БОНУС ЗА ПЛАН (%)</label>
          <input className="luxury-input" type="number" step="0.5" min="0" max="100" value={form.planBonusPercent} onChange={e => set('planBonusPercent', +e.target.value)} />
        </div>
      </div>
      <div style={{ padding: '16px', background: '#F0FDF4', borderRadius: '12px', fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>Пример расчёта при выручке 2 000 000 ₸:</div>
        {(() => {
          const sales = 2000000;
          const gross = (form.type === 'fixed_bonus' ? form.fixedSalary : 0) + Math.round(sales * form.bonusPercent / 100) + (form.monthlyPlan > 0 && sales >= form.monthlyPlan ? Math.round(sales * form.planBonusPercent / 100) : 0);
          const opv = Math.round(gross * 0.1);
          const net = gross - opv - Math.round((gross - opv) * 0.1);
          return <div>Начислено: <b>{gross.toLocaleString()} ₸</b> → На руки: <b>{net.toLocaleString()} ₸</b></div>;
        })()}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 24px' }}>Отмена</button>
        <button onClick={() => onSave(form)} className="btn-primary" style={{ padding: '12px 24px' }}>Сохранить план</button>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({ managerId, managerName, currentUserId, onSave, onClose }: {
  managerId: string; managerName: string; currentUserId: string;
  onSave: (p: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ type: 'advance', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const pt = PAYMENT_TYPES.find(t => t.id === form.type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ fontWeight: 'bold', opacity: 0.7 }}>Выплата: {managerName}</div>
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '8px' }}>ТИП ВЫПЛАТЫ</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PAYMENT_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => set('type', t.id)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: `2px solid ${form.type === t.id ? t.color : '#EEE'}`, background: form.type === t.id ? t.color + '15' : '#FFF', color: form.type === t.id ? t.color : '#666', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>СУММА (₸)</label>
          <input className="luxury-input" type="number" value={form.amount} onChange={e => set('amount', +e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ДАТА</label>
          <input className="luxury-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КОММЕНТАРИЙ</label>
        <input className="luxury-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Необязательно..." />
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 24px' }}>Отмена</button>
        <button onClick={() => onSave({ ...form, managerId, createdBy: currentUserId })} className="btn-primary"
          style={{ padding: '12px 24px', background: pt?.color }}>
          Провести выплату
        </button>
      </div>
    </div>
  );
}

// ─── Main HRManager Component ─────────────────────────────────────────────────

export default function HRManager({ currentUserId }: { currentUserId: string }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [plans, setPlans] = useState<SalaryPlan[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [calcs, setCalcs] = useState<Record<string, SalaryCalc>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState<{ type: string; managerId?: string } | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [activeTab, setActiveTab] = useState<'salary' | 'managers'>('salary');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (managers.length) fetchCalcs(); }, [managers, selectedMonth]);

  const fetchAll = async () => {
    const [mgRes, plRes, pyRes] = await Promise.all([
      fetch('/api/crm/managers'),
      fetch('/api/crm/hr/salary?type=plans'),
      fetch('/api/crm/hr/salary'),
    ]);
    const [mgData, plData, pyData] = await Promise.all([mgRes.json(), plRes.json(), pyRes.json()]);
    if (mgData.success) {
      const serverManagers = (mgData.managers || []).map(normalizeManager);
      const merged = mergeManagers(serverManagers, readLocalManagers());
      setManagers(merged);
      saveLocalManagers(merged);
    }
    if (plData.success) setPlans(plData.plans);
    if (pyData.success) setPayments(pyData.payments);
  };

  const fetchCalcs = async () => {
    const results: Record<string, SalaryCalc> = {};
    await Promise.all(managers.map(async m => {
      const res = await fetch(`/api/crm/hr/salary?type=calc&managerId=${m.id}&month=${selectedMonth}`);
      const data = await res.json();
      if (data.success) results[m.id] = data.calc;
    }));
    setCalcs(results);
  };

  const handleSaveManager = async (form: any) => {
    const isEdit = !!form.id;
    if (!isEdit && !String(form?.password || '').trim()) {
      alert('Для нового менеджера укажите пароль');
      return;
    }
    const res = await fetch('/api/crm/managers', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, updatedBy: currentUserId, createdBy: currentUserId })
    });
    const data = await res.json();
    if (data.success) {
      const normalized = normalizeManager(data.manager);
      const nextManagers = isEdit
        ? managers.map(m => m.id === normalized.id ? normalized : m)
        : [...managers, normalized];
      setManagers(nextManagers);
      saveLocalManagers(nextManagers);
      setModal(null); setEditingManager(null);
      return;
    }
    alert(data.error || 'Не удалось сохранить менеджера');
  };

  const handleDeleteManager = async (id: string) => {
    if (!confirm('Удалить менеджера?')) return;
    const res = await fetch(`/api/crm/managers?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      const nextManagers = managers.filter(m => m.id !== id);
      setManagers(nextManagers);
      saveLocalManagers(nextManagers);
    }
  };

  const handleSavePlan = async (form: any) => {
    const res = await fetch('/api/crm/hr/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_plan', ...form, createdBy: currentUserId })
    });
    const data = await res.json();
    if (data.success) {
      setPlans(plans.filter(p => p.managerId !== form.managerId).concat(data.plan));
      setModal(null);
      fetchCalcs();
    }
  };

  const handlePayment = async (form: any) => {
    const res = await fetch('/api/crm/hr/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setPayments([...payments, data.payment]);
      setModal(null);
      fetchCalcs();
    }
  };

  const prevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const monthPayments = useMemo(() => payments.filter(p => p.date.startsWith(selectedMonth)), [payments, selectedMonth]);
  const totalPayroll = useMemo(() => Object.values(calcs).reduce((s, c) => s + c.netSalary, 0), [calcs]);
  const totalRemaining = useMemo(() => Object.values(calcs).reduce((s, c) => s + c.remaining, 0), [calcs]);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '5px', background: '#F1F3F5', padding: '4px', borderRadius: '10px', marginBottom: '1.5rem', width: 'fit-content' }}>
        {[{ id: 'salary', label: 'Зарплаты' }, { id: 'managers', label: 'Менеджеры' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: activeTab === t.id ? '#FFF' : 'transparent', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', boxShadow: activeTab === t.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'salary' && (
        <div>
          {/* Month selector + stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={prevMonth} className="btn-secondary" style={{ padding: '8px' }}><ChevronLeft size={16} /></button>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', minWidth: '140px', textAlign: 'center' }}>
                {new Date(selectedMonth + '-01').toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={nextMonth} className="btn-secondary" style={{ padding: '8px' }}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="glass-card" style={{ background: '#FFF', padding: '12px 20px' }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>ФОНД ЗП (net)</div>
                <div style={{ fontWeight: 'bold', color: '#10B981' }}>{totalPayroll.toLocaleString()} ₸</div>
              </div>
              <div className="glass-card" style={{ background: '#FFF', padding: '12px 20px' }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>К ВЫПЛАТЕ</div>
                <div style={{ fontWeight: 'bold', color: totalRemaining >= 0 ? '#10B981' : '#EF4444' }}>{totalRemaining.toLocaleString()} ₸</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {managers.map(m => (
              <div key={m.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}></span>
                  <button onClick={() => setModal({ type: 'plan', managerId: m.id })}
                    style={{ fontSize: '0.7rem', background: 'none', border: '1px solid #EEE', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Target size={12} /> Настроить план
                  </button>
                </div>
                {calcs[m.id] ? (
                  <SalaryCard
                    calc={calcs[m.id]} manager={m}
                    plan={plans.find(p => p.managerId === m.id)}
                    onPay={() => setModal({ type: 'payment', managerId: m.id })}
                  />
                ) : (
                  <div style={{ border: '1px solid #EEE', borderRadius: '20px', padding: '2rem', textAlign: 'center', opacity: 0.3 }}>Загрузка...</div>
                )}
              </div>
            ))}
          </div>

          {/* Payment history */}
          {monthPayments.length > 0 && (
            <div className="glass-card" style={{ background: '#FFF', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>История выплат за месяц</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {monthPayments.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                  const pt = PAYMENT_TYPES.find(t => t.id === p.type);
                  const mgr = managers.find(m => m.id === p.managerId);
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8F9FA', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', background: (pt?.color||'#666') + '15', color: pt?.color||'#666' }}>{pt?.label}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{mgr?.name}</span>
                        {p.description && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{p.description}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: p.type === 'penalty' ? '#EF4444' : '#10B981' }}>{p.type === 'penalty' ? '-' : '+'}{p.amount.toLocaleString()} ₸</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{p.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'managers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select className="luxury-input" style={{ width: 'auto' }}
                value={(managers as any)._branchFilter || 'all'}
                onChange={e => {
                  // Store filter in a local state — we'll use a ref trick via data attribute
                  const el = e.target;
                  el.dataset.filter = e.target.value;
                  // Force re-render by updating a dummy state
                  setManagers(prev => { (prev as any)._branchFilter = e.target.value; return [...prev]; });
                }}>
                <option value="all">Все филиалы</option>
                {/* branches loaded in ManagerEditModal — we need them here too */}
              </select>
            </div>
            <button onClick={() => { setEditingManager(null); setModal({ type: 'manager' }); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Добавить сотрудника
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {managers.map(m => (
              <div key={m.id} style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '16px', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#F1F3F5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={24} opacity={0.3} /></div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>
                      @{m.login} · {m.role === 'admin' ? 'Администратор' : m.role === 'accountant' ? 'Бухгалтер' : 'Менеджер'}
                      {m.phone ? ` · ${m.phone}` : ''}
                      {m.hireDate ? ` · с ${m.hireDate}` : ''}
                    </div>
                    {(m as any).branchId && (
                      <div style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📍 Филиал: {(m as any).branchId}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                      {m.permissions && (Object.keys(m.permissions) as (keyof ManagerPermissions)[]).filter(k => m.permissions![k]).map(k => (
                        <span key={k} style={{ fontSize: '0.6rem', background: '#F1F3F5', padding: '2px 8px', borderRadius: '4px' }}>{PERMISSION_LABELS[k]}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingManager(m); setModal({ type: 'manager' }); }} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit2 size={14} /> Редактировать</button>
                  {m.role !== 'admin' && <button onClick={() => handleDeleteManager(m.id)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #EEE', background: '#FFF', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#FFF', width: '100%', maxWidth: modal.type === 'manager' ? '680px' : '520px', borderRadius: '24px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold' }}>
                  {modal.type === 'manager' ? (editingManager ? 'Редактировать менеджера' : 'Новый менеджер') :
                   modal.type === 'plan' ? 'Зарплатный план' : 'Выплата'}
                </h3>
                <button onClick={() => { setModal(null); setEditingManager(null); }} style={{ opacity: 0.4 }}><X size={20} /></button>
              </div>
              {modal.type === 'manager' && (
                <ManagerEditModal
                  manager={editingManager || {}}
                  onSave={handleSaveManager}
                  onClose={() => { setModal(null); setEditingManager(null); }}
                  currentUserId={currentUserId}
                />
              )}
              {modal.type === 'plan' && modal.managerId && (
                <SalaryPlanModal
                  managerId={modal.managerId}
                  managerName={managers.find(m => m.id === modal.managerId)?.name || ''}
                  initial={plans.find(p => p.managerId === modal.managerId)}
                  onSave={handleSavePlan}
                  onClose={() => setModal(null)}
                />
              )}
              {modal.type === 'payment' && modal.managerId && (
                <PaymentModal
                  managerId={modal.managerId}
                  managerName={managers.find(m => m.id === modal.managerId)?.name || ''}
                  currentUserId={currentUserId}
                  onSave={handlePayment}
                  onClose={() => setModal(null)}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
