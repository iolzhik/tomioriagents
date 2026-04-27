'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Trash2, Plus, X,
  Eye, EyeOff, Gem, DollarSign, History, MapPin, ArrowRight,
  Package, Calendar, Weight, Sparkles
} from 'lucide-react';
import BarcodeLabel from './BarcodeLabel';
import LocationTimeline from './crm/LocationTimeline';

export type LocationStatus = 'showcase' | 'cleaning' | 'photoshoot' | 'reserved' | 'gemology' | 'service' | 'sold' | 'archived';
export type StoneType = 'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'other';
export type SettingType = 'prong' | 'bezel' | 'pave' | 'channel' | 'other';

export interface StoneRow {
  id: string; stoneType: StoneType; shape?: string; sieve?: string;
  clarityGIA?: string; colorGIA?: string; clarityGOST?: string;
  caratWeight?: number; settingType?: SettingType; quantity?: number;
  visibleOnShop: boolean;
  stoneOrigin?: 'natural' | 'lab_grown';
  stoneMethod?: 'lg' | 'cvd';
}
export interface ShopVisibility {
  showWeight: boolean; showStones: boolean; showOrigin: boolean;
  showCertificate: boolean; showPurity: boolean;
}
export interface JewelryUnit {
  unitId: string; skuId: string; metalWeight: number; totalWeight: number;
  purity: string; purchaseDate: string; locationStatus: LocationStatus;
  locationHistory: any[]; shelfNumber?: string; masterName?: string;
  gemologyOrg?: string; reserveClientId?: string; reserveExpiresAt?: string;
  soldLeadId?: string; archiveReason?: string; stones: StoneRow[];
  price: number; costPrice: number; customsDuty: number; logisticsCosts: number;
  totalCostPrice: number; priceHistory: any[]; shopVisibility: ShopVisibility;
  serviceHistory?: any[];
  origin?: string; certificateNumber?: string;
  metalColor?: 'white_gold' | 'yellow_gold' | 'rose_gold' | 'silver' | 'platinum';
  notes?: string; createdAt: string; createdBy: string; updatedAt: string; updatedBy: string;
}

const STATUS_LABELS: Record<LocationStatus, string> = {
  showcase: 'На витрине', cleaning: 'На чистке', photoshoot: 'Фотосессия',
  reserved: 'В брони', gemology: 'Геммология', service: 'Сервис', sold: 'Продан', archived: 'Архив',
};
const STATUS_COLORS: Record<LocationStatus, string> = {
  showcase: '#10B981', cleaning: '#F59E0B', photoshoot: '#8B5CF6',
  reserved: '#3B82F6', gemology: '#06B6D4', service: '#EC4899', sold: '#EF4444', archived: '#9CA3AF',
};
const STATUS_BG: Record<LocationStatus, string> = {
  showcase: '#ECFDF5', cleaning: '#FFFBEB', photoshoot: '#F5F3FF',
  reserved: '#EFF6FF', gemology: '#ECFEFF', service: '#FDF2F8', sold: '#FEF2F2', archived: '#F9FAFB',
};
const STATUS_ICONS: Record<LocationStatus, string> = {
  showcase: '🏪', cleaning: '✨', photoshoot: '📸',
  reserved: '🔒', gemology: '🔬', service: '🔧', sold: '✅', archived: '📦',
};
const STONE_TYPES: StoneType[] = ['diamond', 'ruby', 'emerald', 'sapphire', 'other'];
const STONE_LABELS: Record<StoneType, string> = {
  diamond: 'Бриллиант', ruby: 'Рубин', emerald: 'Изумруд', sapphire: 'Сапфир', other: 'Другое',
};
const SETTING_TYPES: SettingType[] = ['prong', 'bezel', 'pave', 'channel', 'other'];
const SETTING_LABELS: Record<SettingType, string> = {
  prong: 'Крапановая', bezel: 'Глухая', pave: 'Паве', channel: 'Канальная', other: 'Другое',
};
const METAL_COLOR_LABELS: Record<string, string> = {
  white_gold: 'Белое Au', yellow_gold: 'Жёлтое Au', rose_gold: 'Розовое Au',
  silver: 'Серебро', platinum: 'Платина',
};
const METAL_COLOR_DOT: Record<string, string> = {
  white_gold: '#E8E8E8', yellow_gold: '#FFD700', rose_gold: '#F4A460',
  silver: '#C0C0C0', platinum: '#E5E4E2',
};
const GIA_CLARITY = ['IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'];
const GIA_COLORS = ['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

// ─── Stone Row Editor ─────────────────────────────────────────────────────────

function StoneRowEditor({ stone, onChange, onDelete }: {
  stone: StoneRow; onChange: (s: StoneRow) => void; onDelete: () => void;
}) {
  const set = (k: keyof StoneRow, v: any) => onChange({ ...stone, [k]: v });
  const inp: React.CSSProperties = {
    padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB',
    fontSize: '0.78rem', background: '#FAFAFA', width: '100%', outline: 'none',
  };
  return (
    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: '8px 6px' }}>
        <select style={inp} value={stone.stoneType} onChange={e => set('stoneType', e.target.value)}>
          {STONE_TYPES.map(t => <option key={t} value={t}>{STONE_LABELS[t]}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 6px' }}>
        <input style={inp} placeholder="Огранка" value={stone.shape || ''} onChange={e => set('shape', e.target.value)} />
      </td>
      <td style={{ padding: '8px 6px' }}>
        <input style={{ ...inp, width: '70px' }} placeholder="мм" value={stone.sieve || ''} onChange={e => set('sieve', e.target.value)} />
      </td>
      <td style={{ padding: '8px 6px' }}>
        <select style={{ ...inp, width: '90px' }} value={stone.clarityGIA || ''} onChange={e => set('clarityGIA', e.target.value)}>
          <option value="">—</option>
          {GIA_CLARITY.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 6px' }}>
        <select style={{ ...inp, width: '70px' }} value={stone.colorGIA || ''} onChange={e => set('colorGIA', e.target.value)}>
          <option value="">—</option>
          {GIA_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 6px' }}>
        <input style={{ ...inp, width: '80px' }} type="number" step="0.0001" placeholder="кт"
          value={stone.caratWeight ?? ''} onChange={e => set('caratWeight', e.target.value ? +e.target.value : undefined)} />
      </td>
      <td style={{ padding: '8px 6px' }}>
        <select style={inp} value={stone.settingType || ''} onChange={e => set('settingType', e.target.value || undefined)}>
          <option value="">—</option>
          {SETTING_TYPES.map(t => <option key={t} value={t}>{SETTING_LABELS[t]}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 6px' }}>
        <input style={{ ...inp, width: '60px' }} type="number" min="1" placeholder="шт"
          value={stone.quantity ?? ''} onChange={e => set('quantity', e.target.value ? +e.target.value : undefined)} />
      </td>
      <td style={{ padding: '8px 6px' }}>
        <select style={{ ...inp, width: '110px' }} value={stone.stoneOrigin || ''} onChange={e => set('stoneOrigin', e.target.value || undefined)}>
          <option value="">—</option>
          <option value="natural">Натуральный</option>
          <option value="lab_grown">Лабораторный</option>
        </select>
      </td>
      <td style={{ padding: '8px 6px' }}>
        {stone.stoneOrigin === 'lab_grown' && (
          <select style={{ ...inp, width: '80px' }} value={stone.stoneMethod || ''} onChange={e => set('stoneMethod', e.target.value || undefined)}>
            <option value="">—</option>
            <option value="lg">LG</option>
            <option value="cvd">CVD</option>
          </select>
        )}
      </td>
      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
        <button type="button" onClick={() => set('visibleOnShop', !stone.visibleOnShop)}
          style={{ background: stone.visibleOnShop ? '#10B981' : '#F3F4F6', border: 'none', borderRadius: '6px',
            padding: '4px 10px', cursor: 'pointer', fontSize: '0.7rem',
            color: stone.visibleOnShop ? '#FFF' : '#6B7280', fontWeight: '600' }}>
          {stone.visibleOnShop ? '✓ Сайт' : 'Скрыт'}
        </button>
      </td>
      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
        <button type="button" onClick={onDelete}
          style={{ background: '#FEF2F2', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#EF4444' }}>
          <X size={13} />
        </button>
      </td>
    </tr>
  );
}

// ─── Status Modal ─────────────────────────────────────────────────────────────

function StatusModal({ unit, onSave, onClose }: {
  unit: JewelryUnit; onSave: (status: LocationStatus, extra: any) => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<LocationStatus>(unit.locationStatus);
  const [extra, setExtra] = useState<any>({});
  const statuses: LocationStatus[] = ['showcase', 'cleaning', 'service', 'photoshoot', 'reserved', 'gemology', 'archived'];

  const needsAmount = status === 'cleaning' || status === 'service';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#FFF', borderRadius: '24px', padding: '2rem', width: '460px',
          maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Изменить статус</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>Экземпляр #{unit.unitId.split('-').slice(-2).join('-')}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px',
            padding: '8px', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
          {statuses.map(s => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              style={{ padding: '10px 12px', borderRadius: '12px',
                border: `2px solid ${status === s ? STATUS_COLORS[s] : '#F3F4F6'}`,
                background: status === s ? STATUS_BG[s] : '#FAFAFA',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>{STATUS_ICONS[s]}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: status === s ? '700' : '500',
                color: status === s ? STATUS_COLORS[s] : '#374151' }}>
                {STATUS_LABELS[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Extra fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
          {status === 'showcase' && (
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>НОМЕР ПОЛКИ</label>
              <input className="luxury-input" value={extra.shelfNumber || ''} onChange={e => setExtra({ ...extra, shelfNumber: e.target.value })} placeholder="A-3" />
            </div>
          )}
          {(status === 'cleaning' || status === 'service') && (
            <>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  {status === 'cleaning' ? 'ИМЯ МАСТЕРА' : 'ИСПОЛНИТЕЛЬ / СЕРВИС-ЦЕНТР'}
                </label>
                <input className="luxury-input"
                  value={status === 'cleaning' ? (extra.masterName || '') : (extra.serviceProvider || '')}
                  onChange={e => setExtra({ ...extra, [status === 'cleaning' ? 'masterName' : 'serviceProvider']: e.target.value })}
                  placeholder={status === 'cleaning' ? 'Имя мастера' : 'Название сервиса'} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  СТОИМОСТЬ (₸) — спишется в расходы
                </label>
                <input className="luxury-input" type="number" min="0"
                  value={extra.serviceAmount || ''}
                  onChange={e => setExtra({ ...extra, serviceAmount: +e.target.value })}
                  placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>ОПИСАНИЕ РАБОТ</label>
                <input className="luxury-input"
                  value={extra.serviceDescription || ''}
                  onChange={e => setExtra({ ...extra, serviceDescription: e.target.value })}
                  placeholder="Полировка, замена камня..." />
              </div>
              {(extra.serviceAmount > 0) && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: '10px',
                  fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💸 {Number(extra.serviceAmount).toLocaleString()} ₸ будет автоматически списано в расходы бухгалтерии
                </div>
              )}
            </>
          )}
          {status === 'reserved' && (<>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>ID КЛИЕНТА</label>
              <input className="luxury-input" value={extra.reserveClientId || ''} onChange={e => setExtra({ ...extra, reserveClientId: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>ИСТЕКАЕТ</label>
              <input className="luxury-input" type="datetime-local" value={extra.reserveExpiresAt || ''} onChange={e => setExtra({ ...extra, reserveExpiresAt: e.target.value })} />
            </div>
          </>)}
          {status === 'gemology' && (
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>ОРГАНИЗАЦИЯ</label>
              <input className="luxury-input" value={extra.gemologyOrg || ''} onChange={e => setExtra({ ...extra, gemologyOrg: e.target.value })} />
            </div>
          )}
          {status === 'archived' && (
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>ПРИЧИНА</label>
              <input className="luxury-input" value={extra.archiveReason || ''} onChange={e => setExtra({ ...extra, archiveReason: e.target.value })} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '13px' }}>Отмена</button>
          <button onClick={() => onSave(status, extra)} className="btn-primary"
            style={{ flex: 2, padding: '13px', background: STATUS_COLORS[status], border: 'none',
              borderRadius: '12px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
            {STATUS_ICONS[status]} Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main UnitCard ────────────────────────────────────────────────────────────

interface UnitCardProps {
  unit: JewelryUnit;
  isAdmin: boolean;
  onUpdate: (unit: JewelryUnit) => void;
  onDelete: (unitId: string) => void;
}

export default function UnitCard({ unit, isAdmin, onUpdate, onDelete }: UnitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationTracking, setShowLocationTracking] = useState(false);
  const [transferData, setTransferData] = useState({ branchId: '', warehouseId: '', holderId: '', holderName: '', note: '' });
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);

  // Load lookup data on mount for resolving IDs to names
  useEffect(() => {
    Promise.all([
      fetch('/api/crm/branches').then(r => r.ok ? r.json() : { branches: [] }),
      fetch('/api/crm/warehouses').then(r => r.ok ? r.json() : { warehouses: [] }),
      fetch('/api/crm/managers').then(r => r.ok ? r.json() : { managers: [] }),
    ]).then(([br, wh, mg]) => {
      setBranches(Array.isArray(br) ? br : (br.branches ?? []));
      setWarehouses(Array.isArray(wh) ? wh : (wh.warehouses ?? []));
      setManagers(Array.isArray(mg) ? mg : (mg.managers ?? []));
    }).catch(() => {});
  }, []);

  const resolveBranch = (id: string) => branches.find((b: any) => b.branchId === id)?.name || id;
  const resolveWarehouse = (id: string) => warehouses.find((w: any) => w.warehouseId === id)?.name || id;
  const resolveManager = (id: string) => managers.find((m: any) => m.id === id)?.name || id;
  const [activeTab, setActiveTab] = useState<'stones' | 'visibility' | 'price' | 'history' | 'service' | 'tracking'>('stones');
  const [stones, setStones] = useState<StoneRow[]>(unit.stones || []);
  const [shopVis, setShopVis] = useState<ShopVisibility>(unit.shopVisibility || { showWeight: true, showStones: true, showOrigin: false, showCertificate: false, showPurity: true });
  const [saving, setSaving] = useState(false);

  const isSold = unit.locationStatus === 'sold';
  const isArchived = unit.locationStatus === 'archived';
  const totalCarats = stones.reduce((s, st) => s + (st.caratWeight || 0) * (st.quantity || 1), 0);
  const totalStones = stones.reduce((s, st) => s + (st.quantity || 1), 0);
  const shortId = unit.unitId.split('-').slice(-2).join('-').toUpperCase();
  const statusColor = STATUS_COLORS[unit.locationStatus];
  const statusBg = STATUS_BG[unit.locationStatus];

  const saveUnit = async (updates: Partial<JewelryUnit>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/crm/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: unit.unitId, ...updates }),
      });
      const data = await res.json();
      if (data.success) onUpdate(data.unit);
    } catch {}
    setSaving(false);
  };

  const handleStatusChange = async (status: LocationStatus, extra: any) => {
    await saveUnit({ locationStatus: status, ...extra });
    setShowStatusModal(false);
  };

  const handleTransfer = async (direct = false) => {
    const managerId = (unit as any).managerId ?? unit.createdBy ?? 'admin';
    setTransferLoading(true);
    try {
      const selectedManager = managers.find((m: any) => m.id === transferData.holderId);
      const toLocation = {
        branchId: transferData.branchId,
        warehouseId: transferData.warehouseId,
        holderId: transferData.holderId,
        holderName: selectedManager?.name || transferData.holderName,
        note: transferData.note,
        receivedAt: new Date().toISOString(),
      };

      if (direct && isAdmin) {
        const res = await fetch('/api/crm/units', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId: unit.unitId,
            currentLocation: toLocation,
            updatedBy: managerId,
            directAssign: true,
          }),
        });
        const data = await res.json();
        if (data.success && data.unit) {
          onUpdate(data.unit);
          // Switch to tracking tab to show the new entry
          setActiveTab('tracking');
          setExpanded(true);
        } else {
          alert('Ошибка сохранения: ' + (data.error || 'неизвестная ошибка'));
        }
      } else {
        await fetch('/api/crm/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId: unit.unitId,
            fromLocation: (unit as any).currentLocation ?? {},
            toLocation,
            requestedBy: managerId,
          }),
        });
        alert('✓ Запрос на перемещение отправлен администратору');
      }
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    }
    setTransferLoading(false);
    setShowTransferModal(false);
    setTransferData({ branchId: '', warehouseId: '', holderId: '', holderName: '', note: '' });
  };

  const openTransferModal = async () => {
    setShowTransferModal(true);
    try {
      const [brRes, whRes, mgRes] = await Promise.all([
        fetch('/api/crm/branches'),
        fetch('/api/crm/warehouses'),
        fetch('/api/crm/managers'),
      ]);
      if (brRes.ok) { const d = await brRes.json(); setBranches(Array.isArray(d) ? d : (d.branches ?? [])); }
      if (whRes.ok) { const d = await whRes.json(); setWarehouses(Array.isArray(d) ? d : (d.warehouses ?? [])); }
      if (mgRes.ok) { const d = await mgRes.json(); setManagers(Array.isArray(d) ? d : (d.managers ?? [])); }
    } catch {}
  };

  const handleVisibilityToggle = async (key: keyof ShopVisibility) => {
    const next = { ...shopVis, [key]: !shopVis[key] };
    setShopVis(next);
    await saveUnit({ shopVisibility: next });
  };

  const addStone = () => setStones(prev => [...prev, {
    id: `stone-${unit.unitId}-${Date.now()}`, stoneType: 'diamond', visibleOnShop: false,
  }]);

  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      border: `1.5px solid ${expanded ? statusColor + '40' : '#F0F0F0'}`,
      background: '#FFF',
      opacity: isSold ? 0.75 : 1,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: expanded ? `0 4px 20px ${statusColor}18` : '0 1px 4px rgba(0,0,0,0.04)',
    }}>

      {/* ── Status stripe ── */}
      <div style={{ height: '4px', background: statusColor, opacity: 0.7 }} />

      {/* ── Main row ── */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Status badge */}
        <div style={{
          flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px',
          background: statusBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.3rem',
        }}>
          {STATUS_ICONS[unit.locationStatus]}
        </div>

        {/* Info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: '700', padding: '2px 10px', borderRadius: '20px',
              background: statusBg, color: statusColor, border: `1px solid ${statusColor}30`,
            }}>
              {STATUS_LABELS[unit.locationStatus]}
            </span>
            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#111', letterSpacing: '0.02em' }}>
              #{shortId}
            </span>
            {unit.metalColor && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#6B7280' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%',
                  background: METAL_COLOR_DOT[unit.metalColor] || '#DDD',
                  border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                {METAL_COLOR_LABELS[unit.metalColor]}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Weight size={11} /> {unit.metalWeight}г металл · {unit.totalWeight}г общий
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Проба <b style={{ color: '#D4AF37' }}>{unit.purity}</b>
            </span>
            {unit.shelfNumber && (
              <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} /> Полка {unit.shelfNumber}
              </span>
            )}
            {totalStones > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gem size={11} /> {totalStones} кам. · {totalCarats.toFixed(3)} кт
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={10} /> {new Date(unit.purchaseDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
          {/* Context info by status */}
          {unit.locationStatus === 'reserved' && unit.reserveExpiresAt && (
            <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#3B82F6', background: '#EFF6FF',
              padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
              🔒 Бронь до {new Date(unit.reserveExpiresAt).toLocaleString('ru-RU')}
            </div>
          )}
          {unit.locationStatus === 'cleaning' && unit.masterName && (
            <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#F59E0B', background: '#FFFBEB',
              padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
              ✨ Мастер: {unit.masterName}
            </div>
          )}
          {unit.locationStatus === 'gemology' && unit.gemologyOrg && (
            <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#06B6D4', background: '#ECFEFF',
              padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
              🔬 {unit.gemologyOrg}
            </div>
          )}
          {/* Current physical location + Transfer button — always visible */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {(unit as any).currentLocation ? (() => {
              const loc = (unit as any).currentLocation;
              const parts = [
                loc.branchId ? resolveBranch(loc.branchId) : null,
                loc.warehouseId ? `Склад: ${resolveWarehouse(loc.warehouseId)}` : null,
                loc.holderName || (loc.holderId ? resolveManager(loc.holderId) : null),
              ].filter(Boolean);
              return (
                <span style={{
                  fontSize: '0.75rem', color: '#1D4ED8', background: '#EFF6FF',
                  padding: '5px 12px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  border: '1.5px solid #BFDBFE', fontWeight: '600',
                }}>
                  <MapPin size={12} />
                  {parts.join(' › ') || 'Местонахождение не указано'}
                </span>
              );
            })() : (
              <span style={{
                fontSize: '0.72rem', color: '#9CA3AF', background: '#F9FAFB',
                padding: '5px 12px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '5px',
                border: '1px dashed #D1D5DB',
              }}>
                <MapPin size={12} /> Местонахождение не задано
              </span>
            )}
            <button type="button" onClick={openTransferModal}
              style={{ fontSize: '0.72rem', padding: '5px 12px', borderRadius: '8px',
                border: '1.5px solid #3B82F6', background: '#EFF6FF',
                color: '#1D4ED8', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ArrowRight size={12} /> {(unit as any).currentLocation ? 'Переместить' : 'Назначить место'}
            </button>
          </div>
        </div>

        {/* Price */}
        {unit.price > 0 && (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111' }}>
              {unit.price.toLocaleString()} ₸
            </div>
            {isAdmin && unit.totalCostPrice > 0 && (
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>
                с/с {unit.totalCostPrice.toLocaleString()} ₸
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!isSold && !isArchived && (
            <button onClick={() => setShowStatusModal(true)}
              style={{ fontSize: '0.72rem', padding: '6px 12px', borderRadius: '8px',
                border: `1.5px solid ${statusColor}`, background: statusBg,
                color: statusColor, cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Статус
            </button>
          )}
          <BarcodeLabel unit={unit} />
          {!isSold && (
            <button onClick={() => onDelete(unit.unitId)}
              style={{ background: '#FEF2F2', border: 'none', borderRadius: '8px',
                padding: '6px 8px', cursor: 'pointer', color: '#EF4444' }}>
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '6px 8px', cursor: 'pointer', color: '#6B7280' }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${statusColor}20`, background: '#FAFAFA' }}>

          {/* Compact icon tabs */}
          <div style={{ display: 'flex', gap: '2px', padding: '8px 12px 0', borderBottom: '1px solid #F0F0F0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {([
              { id: 'stones' as const, icon: '💎', label: `Камни${stones.length > 0 ? ` (${stones.length})` : ''}` },
              { id: 'visibility' as const, icon: '👁', label: 'Сайт' },
              ...(isAdmin ? [{ id: 'price' as const, icon: '💰', label: 'Цены' }] : []),
              { id: 'history' as const, icon: '📍', label: `Маршрут${unit.locationHistory?.length ? ` (${unit.locationHistory.length})` : ''}` },
              { id: 'service' as const, icon: '🔧', label: `Сервис${(unit as any).serviceHistory?.length ? ` (${(unit as any).serviceHistory.length})` : ''}` },
              { id: 'tracking' as const, icon: '📦', label: 'Перемещения' },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 10px', background: activeTab === tab.id ? '#FFF' : 'transparent',
                  border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: activeTab === tab.id ? '700' : '500',
                  color: activeTab === tab.id ? '#111' : '#6B7280',
                  borderBottom: activeTab === tab.id ? `2px solid ${statusColor}` : '2px solid transparent',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '420px' }}>

                {/* ── Gemological passport ── */}
                {activeTab === 'stones' && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#111' }}>
                      <Gem size={15} color="#D4AF37" /> Геммологический паспорт
                    </div>
                    <button onClick={addStone}
                      style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '8px',
                        border: '1.5px dashed #D4AF37', background: 'transparent',
                        color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                      <Plus size={13} /> Добавить камень
                    </button>
                  </div>
                  {stones.length > 0 ? (
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #F0F0F0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: '#F8F9FA' }}>
                            {['Тип', 'Огранка', 'Рассев', 'Чистота', 'Цвет', 'Кт', 'Закрепка', 'Кол-во', 'Происхождение', 'Метод', 'Сайт', ''].map(h => (
                              <th key={h} style={{ padding: '10px 6px', fontWeight: '600', color: '#6B7280',
                                textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stones.map((stone, i) => (
                            <StoneRowEditor key={stone.id} stone={stone}
                              onChange={s => setStones(stones.map((st, j) => j === i ? s : st))}
                              onDelete={() => setStones(stones.filter((_, j) => j !== i))}
                            />
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '2px solid #E5E7EB', background: '#F8F9FA' }}>
                            <td colSpan={5} style={{ padding: '10px 6px', fontWeight: '600', color: '#6B7280', fontSize: '0.75rem' }}>Итого:</td>
                            <td style={{ padding: '10px 6px', fontWeight: '700', color: '#8B5CF6' }}>{totalCarats.toFixed(4)} кт</td>
                            <td colSpan={4} style={{ padding: '10px 6px', color: '#6B7280' }}>{totalStones} шт.</td>
                            <td colSpan={2} style={{ padding: '10px 6px' }}>
                              <button onClick={() => saveUnit({ stones })} disabled={saving}
                                style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '8px',
                                  border: 'none', background: '#10B981', color: '#FFF',
                                  cursor: 'pointer', fontWeight: '600' }}>
                                {saving ? '...' : '✓ Сохранить'}
                              </button>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF',
                      fontSize: '0.8rem', background: '#F9FAFB', borderRadius: '12px',
                      border: '1px dashed #E5E7EB' }}>
                      <Sparkles size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.3 }} />
                      Камни не добавлены
                    </div>
                  )}
                </div>
                )}

                {/* ── Shop visibility ── */}
                {activeTab === 'visibility' && (
                <div style={{ padding: '16px', background: '#FFF', borderRadius: '12px', border: '1px solid #F0F0F0' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.82rem', marginBottom: '12px',
                    display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
                    <Eye size={14} /> Видимость на сайте
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(Object.keys(shopVis) as (keyof ShopVisibility)[]).map(key => {
                      const labels: Record<keyof ShopVisibility, string> = {
                        showWeight: 'Вес', showStones: 'Камни', showOrigin: 'Происхождение',
                        showCertificate: 'Сертификат', showPurity: 'Проба',
                      };
                      return (
                        <button key={key} type="button" onClick={() => handleVisibilityToggle(key)}
                          style={{ padding: '7px 14px', borderRadius: '8px',
                            border: `1.5px solid ${shopVis[key] ? '#10B981' : '#E5E7EB'}`,
                            background: shopVis[key] ? '#F0FDF4' : '#FFF',
                            color: shopVis[key] ? '#166534' : '#6B7280',
                            fontSize: '0.78rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                          {shopVis[key] ? <Eye size={12} /> : <EyeOff size={12} />} {labels[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* ── Price history ── */}
                {activeTab === 'price' && isAdmin && (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #F0F0F0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#FFF9F9' }}>
                          {['Дата', 'Цена', 'Себест.', 'Итого с/с', 'Причина', 'Кем'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', fontWeight: '600',
                              color: '#6B7280', textAlign: 'left', fontSize: '0.7rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(unit.priceHistory || []).map((ph: any) => (
                          <tr key={ph.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px 12px', color: '#374151' }}>{new Date(ph.timestamp).toLocaleDateString('ru-RU')}</td>
                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>{ph.price?.toLocaleString()} ₸</td>
                            <td style={{ padding: '10px 12px', color: '#6B7280' }}>{ph.costPrice?.toLocaleString()} ₸</td>
                            <td style={{ padding: '10px 12px', color: '#EF4444', fontWeight: '600' }}>{ph.totalCostPrice?.toLocaleString()} ₸</td>
                            <td style={{ padding: '10px 12px', color: '#6B7280' }}>{ph.reason}</td>
                            <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{ph.changedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Location history ── */}
                {activeTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(unit.locationHistory || []).length === 0 && (
                      <div style={{ color: '#9CA3AF', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>Нет записей</div>
                    )}
                    {(unit.locationHistory || []).slice().reverse().map((h: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 12px', background: '#FFF', borderRadius: '10px',
                        border: '1px solid #F0F0F0', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#9CA3AF', fontSize: '0.68rem', minWidth: '90px' }}>
                          {new Date(h.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                          background: STATUS_BG[h.from as LocationStatus] || '#F3F4F6',
                          color: STATUS_COLORS[h.from as LocationStatus] || '#6B7280', fontSize: '0.7rem' }}>
                          {STATUS_LABELS[h.from as LocationStatus] || h.from}
                        </span>
                        <ArrowRight size={12} color="#9CA3AF" />
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                          background: STATUS_BG[h.to as LocationStatus] || '#F3F4F6',
                          color: STATUS_COLORS[h.to as LocationStatus] || '#6B7280', fontSize: '0.7rem' }}>
                          {STATUS_LABELS[h.to as LocationStatus] || h.to}
                        </span>
                        {h.note && <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>· {h.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Service history ── */}
                {activeTab === 'service' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {((unit as any).serviceHistory || []).length === 0 ? (
                      <div style={{ color: '#9CA3AF', fontSize: '0.8rem', textAlign: 'center', padding: '24px',
                        background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                        🔧 История чисток и сервиса пуста
                      </div>
                    ) : (
                      ((unit as any).serviceHistory || []).slice().reverse().map((s: any, i: number) => (
                        <div key={i} style={{ padding: '12px 14px', background: '#FFF', borderRadius: '12px',
                          border: `1px solid ${s.type === 'cleaning' ? '#FDE68A' : '#FBCFE8'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: s.type === 'cleaning' ? '#92400E' : '#9D174D' }}>
                              {s.type === 'cleaning' ? '✨ Чистка' : '🔧 Сервис'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                              {new Date(s.timestamp).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {s.masterName && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>👤 {s.masterName}</div>}
                          {s.description && <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: '3px' }}>{s.description}</div>}
                          {s.amount > 0 && (
                            <div style={{ marginTop: '6px', fontSize: '0.78rem', fontWeight: '700',
                              color: '#DC2626', background: '#FEF2F2', padding: '3px 8px',
                              borderRadius: '6px', display: 'inline-block' }}>
                              💸 {s.amount.toLocaleString()} ₸ → списано в расходы
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Location tracking ── */}
                {activeTab === 'tracking' && (
                  <div>
                    {((unit as any).locationTracking?.length ?? 0) === 0 ? (
                      <div style={{ color: '#9CA3AF', fontSize: '0.8rem', textAlign: 'center', padding: '24px',
                        background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                        📦 История перемещений пуста
                      </div>
                    ) : (
                      <LocationTimeline entries={(unit as any).locationTracking ?? []} branches={branches} managers={managers} />
                    )}
                  </div>
                )}

          </div>
        </div>
      )}

      {showStatusModal && (
        <StatusModal unit={unit} onSave={handleStatusChange} onClose={() => setShowStatusModal(false)} />
      )}

      {/* ── Transfer modal ── */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#FFF', borderRadius: '20px', padding: '1.75rem', width: '420px',
              maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>Инициировать перемещение</div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>#{shortId}</div>
              </div>
              <button onClick={() => setShowTransferModal(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#6B7280' }}>
                <X size={16} />
              </button>
            </div>
            {/* Instruction */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 12px', marginBottom: '1rem', fontSize: '0.72rem', color: '#1E40AF', lineHeight: 1.5 }}>
              ℹ️ Запрос будет отправлен администратору на подтверждение. После одобрения изделие переместится в выбранное место.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ФИЛИАЛ</label>
                <select
                  value={transferData.branchId}
                  onChange={e => setTransferData(d => ({ ...d, branchId: e.target.value, warehouseId: '' }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#FAFAFA', outline: 'none' }}
                >
                  <option value="">— Выберите филиал —</option>
                  {branches.map((b: any) => (
                    <option key={b.branchId} value={b.branchId}>{b.name} {b.city ? `(${b.city})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '5px' }}>СКЛАД</label>
                <select
                  value={transferData.warehouseId}
                  onChange={e => setTransferData(d => ({ ...d, warehouseId: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#FAFAFA', outline: 'none' }}
                >
                  <option value="">— Выберите склад —</option>
                  {warehouses
                    .filter((w: any) => !transferData.branchId || w.branchId === transferData.branchId)
                    .map((w: any) => (
                      <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '5px' }}>СОТРУДНИК / ДЕРЖАТЕЛЬ</label>
                <select
                  value={transferData.holderId}
                  onChange={e => {
                    const mgr = managers.find((m: any) => m.id === e.target.value);
                    setTransferData(d => ({ ...d, holderId: e.target.value, holderName: mgr?.name || '' }));
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '0.85rem', background: '#FAFAFA', outline: 'none' }}
                >
                  <option value="">— Выберите сотрудника —</option>
                  {managers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
                {managers.length === 0 && (
                  <input className="luxury-input" style={{ marginTop: '6px' }} value={transferData.holderName}
                    onChange={e => setTransferData(d => ({ ...d, holderName: e.target.value }))}
                    placeholder="Введите имя вручную" />
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ПРИЧИНА / ПРИМЕЧАНИЕ</label>
                <input className="luxury-input" value={transferData.note}
                  onChange={e => setTransferData(d => ({ ...d, note: e.target.value }))}
                  placeholder="Необязательно" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowTransferModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Отмена</button>
              {isAdmin ? (
                <>
                  <button onClick={() => handleTransfer(true)} disabled={transferLoading}
                    style={{ flex: 2, padding: '12px', background: '#10B981', border: 'none',
                      borderRadius: '12px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
                      opacity: transferLoading ? 0.6 : 1 }}>
                    {transferLoading ? '⏳...' : '✓ Назначить сразу'}
                  </button>
                  <button onClick={() => handleTransfer(false)} disabled={transferLoading}
                    style={{ flex: 2, padding: '12px', background: '#3B82F6', border: 'none',
                      borderRadius: '12px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
                      opacity: transferLoading ? 0.6 : 1 }}>
                    {transferLoading ? '⏳...' : '📋 Создать запрос'}
                  </button>
                </>
              ) : (
                <button onClick={() => handleTransfer(false)} disabled={transferLoading}
                  style={{ flex: 2, padding: '12px', background: '#3B82F6', border: 'none',
                    borderRadius: '12px', color: '#FFF', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                    opacity: transferLoading ? 0.6 : 1 }}>
                  {transferLoading ? '⏳ Отправка...' : '📦 Отправить запрос'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
