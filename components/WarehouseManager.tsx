'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Search, Download, Package, DollarSign,
  ChevronDown, ChevronUp, X, Check, AlertCircle, Gem, MapPin,
  Tag, Layers, Star, Shield, Percent, TrendingUp, Eye, EyeOff,
  Image as ImageIcon, RefreshCw, List, Warehouse, Users, ArrowLeftRight
} from 'lucide-react';
import UnitCard from './UnitCard';
import TransferPanel from './crm/TransferPanel';
import WarehouseReport from './crm/WarehouseReport';
import type { JewelryUnit } from '@/lib/crm-service';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string; category: string; name: string; article: string;
  price: number; stock: number; imageUrl?: string;
  description?: string; shortDescription?: string;
  origin?: string; caratWeight?: number; color?: string;
  diamondCount?: number; clarity?: string; purity?: string;
  discountAllowed?: number; costPrice?: number; customsDuty?: number;
  logisticsCosts?: number; totalCostPrice?: number; markupPercentage?: number;
  managerCommissionPercent?: number;
}

interface StockMovement {
  id: string; productId: string; type: 'in' | 'out' | 'adjustment';
  quantity: number; reason: string; date: string; managerId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CLARITY_OPTIONS = ['IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'];
const PURITY_OPTIONS = ['375','585','750','875','916','925','958','999'];
const COLOR_PALETTE = [
  { code: '#F5F5F5', name: 'D (бесцветный)' },
  { code: '#FFFDE7', name: 'E (бесцветный)' },
  { code: '#FFF9C4', name: 'F (бесцветный)' },
  { code: '#FFF8E1', name: 'G (почти бесцветный)' },
  { code: '#FFF3E0', name: 'H (почти бесцветный)' },
  { code: '#FFF0D0', name: 'I (слабый оттенок)' },
  { code: '#FFECC0', name: 'J (слабый оттенок)' },
  { code: '#FFE0B2', name: 'K (заметный оттенок)' },
  { code: '#FFCC80', name: 'L (заметный оттенок)' },
  { code: '#FFB74D', name: 'M (заметный оттенок)' },
  { code: '#FFA726', name: 'N-R (желтоватый)' },
  { code: '#FF9800', name: 'S-Z (жёлтый)' },
  { code: '#FFD700', name: 'Fancy Yellow' },
  { code: '#FF69B4', name: 'Fancy Pink' },
  { code: '#4169E1', name: 'Fancy Blue' },
  { code: '#228B22', name: 'Fancy Green' },
  { code: '#FF4500', name: 'Fancy Red' },
  { code: '#8B4513', name: 'Fancy Brown' },
  { code: '#808080', name: 'Fancy Grey' },
  { code: '#000000', name: 'Fancy Black' },
];

const DEFAULT_CATEGORIES = ['Подвески', 'Колье', 'Браслеты'];
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const SUPPORTED_IMAGE_EXTENSIONS_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const MAX_PRODUCT_REQUEST_BYTES = 950_000;
const MAX_FORM_IMAGES = 8;
const IMAGE_FALLBACK_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="18">Изображение недоступно</text></svg>'
  );

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Не удалось прочитать файл: ${file.name}`));
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/gif') return original;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Не удалось обработать изображение: ${file.name}`));
    el.src = original;
  });

  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
  const width = Math.max(1, Math.round((img.width || 1) * ratio));
  const height = Math.max(1, Math.round((img.height || 1) * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, width, height);

  const optimized = canvas.toDataURL('image/webp', 0.82);
  return optimized.length < original.length ? optimized : original;
}

async function parseApiJsonSafe(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return await res.json();
  const text = await res.text();
  if (text.includes('Request Entity Too Large') || text.includes('Payload Too Large')) {
    throw new Error('Файл(ы) слишком большие. Уменьшите размер/количество фото и повторите.');
  }
  throw new Error(text.slice(0, 180) || `Ошибка сервера: ${res.status}`);
}

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  category: '', name: '', article: '', price: 0, stock: 0,
  imageUrl: '', description: '', shortDescription: '',
  origin: '', caratWeight: undefined, color: '',
  diamondCount: undefined, clarity: '', purity: '585',
  discountAllowed: 10, costPrice: 0, customsDuty: 0,
  logisticsCosts: 0, totalCostPrice: 0, markupPercentage: 0,
  managerCommissionPercent: 5,
};

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({ initial, onSave, onCancel, isAdmin, categories }: {
  initial: Omit<Product, 'id'> & { id?: string };
  onSave: (p: any) => void;
  onCancel: () => void;
  isAdmin: boolean;
  categories: string[];
}) {
  const [form, setForm] = useState(initial);
  const [showFinancials, setShowFinancials] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [bgRemoveIdx, setBgRemoveIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Normalise images array from imageUrl for backward compat
  const images: string[] = (form as any).images?.length
    ? (form as any).images
    : form.imageUrl ? [form.imageUrl] : [];

  const setImages = (imgs: string[]) => {
    setForm(f => ({ ...f, images: imgs, imageUrl: imgs[0] || '' } as any));
  };

  const set = (k: string, v: any) => setForm(f => {
    const next = { ...f, [k]: v };
    if (['costPrice','customsDuty','logisticsCosts','price'].includes(k)) {
      const total = (next.costPrice||0) + (next.customsDuty||0) + (next.logisticsCosts||0);
      next.totalCostPrice = total;
      next.markupPercentage = total > 0 ? Math.round(((next.price - total) / total) * 100) : 0;
    }
    return next;
  });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const unsupported = files.filter(file =>
      !(SUPPORTED_IMAGE_MIME_TYPES.has(file.type) || SUPPORTED_IMAGE_EXTENSIONS_RE.test(file.name))
    );
    if (unsupported.length > 0) {
      alert(
        `Неподдерживаемый формат: ${unsupported.map(f => f.name).join(', ')}. ` +
        'Загрузите JPG, PNG, WEBP, GIF или AVIF.'
      );
    }

    const supported = files.filter(file => SUPPORTED_IMAGE_MIME_TYPES.has(file.type) || SUPPORTED_IMAGE_EXTENSIONS_RE.test(file.name));
    const freeSlots = Math.max(0, MAX_FORM_IMAGES - images.length);
    if (freeSlots <= 0) {
      alert(`Можно добавить максимум ${MAX_FORM_IMAGES} фото к товару.`);
      e.target.value = '';
      return;
    }
    if (supported.length > freeSlots) {
      alert(`Добавлено только ${freeSlots} фото. Лимит: ${MAX_FORM_IMAGES}.`);
    }

    try {
      const optimized = await Promise.all(supported.slice(0, freeSlots).map(fileToOptimizedDataUrl));
      setImages([...images, ...optimized]);
    } catch (err: any) {
      alert(err?.message || 'Не удалось обработать изображения');
    }
    e.target.value = '';
  };

  const handleBgRemove = async (idx: number) => {
    setBgRemoveIdx(idx);
    try {
      const url = images[idx];
      const imageBase64 = url.includes(',') ? url.split(',')[1] : url;
      const res = await fetch('/api/crm/bg-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();

      let resultUrl: string;
      if (data.success) {
        resultUrl = 'data:image/png;base64,' + data.resultBase64;
      } else if (data.useClientFallback) {
        const { removeBackgroundClient } = await import('@/lib/client-bg-remove');
        resultUrl = await removeBackgroundClient(url.startsWith('data:') ? url : `data:image/jpeg;base64,${imageBase64}`);
      } else {
        alert('Ошибка удаления фона: ' + data.error);
        return;
      }

      const newImgs = [...images];
      newImgs[idx] = resultUrl;
      setImages(newImgs);
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setBgRemoveIdx(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Images gallery */}
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '8px' }}>ФОТОГРАФИИ ТОВАРА</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {images.length === 0 && (
            <div onClick={() => fileRef.current?.click()} style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #DDD', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#F8F9FA', color: '#999', fontSize: '0.7rem' }}>
              <ImageIcon size={24} opacity={0.3} />
              Добавить фото
            </div>
          )}
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: idx === 0 ? '2px solid var(--gold)' : '2px solid #EEE', flexShrink: 0 }}>
              <img
                src={img}
                alt={`Фото товара ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = IMAGE_FALLBACK_SRC;
                }}
              />
              {idx === 0 && <div style={{ position: 'absolute', top: '3px', left: '3px', background: 'rgba(212,175,55,0.9)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.55rem', color: '#000', fontWeight: '700' }}>Обложка</div>}
              <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))}
                style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#FFF', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                ×
              </button>
              <button type="button" onClick={() => handleBgRemove(idx)} disabled={bgRemoveIdx === idx}
                style={{ position: 'absolute', bottom: '3px', left: '3px', right: '3px', background: 'rgba(139,92,246,0.85)', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '0.55rem', cursor: 'pointer', padding: '2px 4px', fontWeight: '600' }}>
                {bgRemoveIdx === idx ? '...' : '✨ Удалить фон'}
              </button>
            </div>
          ))}
          {images.length > 0 && (
            <div onClick={() => fileRef.current?.click()} style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #DDD', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#F8F9FA', color: '#999', fontSize: '0.7rem' }}>
              <Plus size={20} opacity={0.4} />
              Ещё фото
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={handleImage} />
      </div>

      {/* Name / Article row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>НАЗВАНИЕ *</label>
              <input className="luxury-input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>АРТИКУЛ</label>
              <input className="luxury-input" value={form.article} onChange={e => set('article', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КАТЕГОРИЯ *</label>
              <select className="luxury-input" value={form.category} onChange={e => {
                if (e.target.value === '__new__') { setNewCat(''); set('category', ''); }
                else set('category', e.target.value);
              }} required>
                <option value="">— выбрать —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ Новая категория</option>
              </select>
              {(form.category === '' || !categories.includes(form.category)) && (
                <input className="luxury-input" style={{ marginTop: '6px' }} placeholder="Введите название категории..." value={form.category || newCat} onChange={e => { setNewCat(e.target.value); set('category', e.target.value); }} />
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ЦЕНА (₸) *</label>
              <input className="luxury-input" type="number" value={form.price === 0 ? '' : form.price} onChange={e => set('price', e.target.value === '' ? 0 : +e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ОСТАТОК (шт.)</label>
              <input className="luxury-input" type="number" value={form.stock} onChange={e => set('stock', +e.target.value)} />
            </div>
          </div>
      </div>

      {/* Jewelry Characteristics */}
      <div style={{ background: '#F8F9FA', borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gem size={16} color="var(--gold)" /> Ювелирные характеристики
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ПРОИСХОЖДЕНИЕ (ГОРОД)</label>
            <input className="luxury-input" placeholder="Дубай, Антверпен, Москва..." value={form.origin||''} onChange={e => set('origin', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КАРАТНОСТЬ</label>
            <input className="luxury-input" type="number" step="0.01" placeholder="1.00" value={form.caratWeight||''} onChange={e => set('caratWeight', +e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ПРОБА</label>
            <select className="luxury-input" value={form.purity||'585'} onChange={e => set('purity', e.target.value)}>
              {PURITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КОЛ-ВО БРИЛЛИАНТОВ</label>
            <input className="luxury-input" type="number" placeholder="0" value={form.diamondCount||''} onChange={e => set('diamondCount', +e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>ЧИСТОТА</label>
            <select className="luxury-input" value={form.clarity||''} onChange={e => set('clarity', e.target.value)}>
              <option value="">— не указано —</option>
              {CLARITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>МАКС. СКИДКА (%)</label>
            <input className="luxury-input" type="number" min="0" max="100" value={form.discountAllowed??10} onChange={e => set('discountAllowed', +e.target.value)} />
          </div>
        </div>
        {/* Color Palette */}
        <div style={{ marginTop: '15px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '8px' }}>ЦВЕТ КАМНЯ</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {COLOR_PALETTE.map(c => (
              <button
                key={c.code}
                type="button"
                title={c.name}
                onClick={() => set('color', c.name)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c.code, border: form.color === c.name ? '3px solid #1A1A1A' : '2px solid #DDD',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: c.code === '#F5F5F5' || c.code === '#FFFDE7' ? 'inset 0 0 0 1px #CCC' : 'none'
                }}
              />
            ))}
          </div>
          {form.color && <div style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.7 }}>Выбрано: {form.color}</div>}
        </div>
        {/* Manager commission */}
        <div style={{ marginTop: '15px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>% МЕНЕДЖЕРУ ПРИ ПРОДАЖЕ</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input className="luxury-input" type="number" min="0" max="100" step="0.5" style={{ width: '120px' }} value={form.managerCommissionPercent??5} onChange={e => set('managerCommissionPercent', +e.target.value)} />
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>= {Math.round(form.price * ((form.managerCommissionPercent||5)/100)).toLocaleString()} ₸ от текущей цены</span>
          </div>
        </div>
      </div>

      {/* Financial Section (admin only) */}
      {isAdmin && (
        <div style={{ border: '1px solid #EEE', borderRadius: '16px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowFinancials(!showFinancials)}
            style={{ width: '100%', padding: '15px 20px', background: '#FFF', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="#EF4444" /> Финансовые данные (только бухгалтерия)
            </span>
            {showFinancials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showFinancials && (
            <div style={{ padding: '20px', background: '#FFF9F9', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>СЕБЕСТОИМОСТЬ (₸)</label>
                <input className="luxury-input" type="number" value={form.costPrice||0} onChange={e => set('costPrice', +e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>РАСТАМОЖКА (₸)</label>
                <input className="luxury-input" type="number" value={form.customsDuty||0} onChange={e => set('customsDuty', +e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>РАСХОДЫ (₸)</label>
                <input className="luxury-input" type="number" value={form.logisticsCosts||0} onChange={e => set('logisticsCosts', +e.target.value)} />
              </div>
              <div style={{ background: '#FFF', padding: '12px', borderRadius: '10px', border: '1px solid #EEE' }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>ИТОГО СЕБЕСТОИМОСТЬ</div>
                <div style={{ fontWeight: 'bold', color: '#EF4444' }}>{(form.totalCostPrice||0).toLocaleString()} ₸</div>
              </div>
              <div style={{ background: '#FFF', padding: '12px', borderRadius: '10px', border: '1px solid #EEE' }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>НАЦЕНКА</div>
                <div style={{ fontWeight: 'bold', color: '#10B981' }}>{form.markupPercentage||0}%</div>
              </div>
              <div style={{ background: '#FFF', padding: '12px', borderRadius: '10px', border: '1px solid #EEE' }}>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>ПРИБЫЛЬ С ЕД.</div>
                <div style={{ fontWeight: 'bold', color: '#10B981' }}>{((form.price||0) - (form.totalCostPrice||0)).toLocaleString()} ₸</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КРАТКОЕ ОПИСАНИЕ (для магазина)</label>
        <input className="luxury-input" value={form.shortDescription||''} onChange={e => set('shortDescription', e.target.value)} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #EEE' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '12px 24px' }}>Отмена</button>
        <button type="button" onClick={() => onSave(form)} className="btn-primary" style={{ padding: '12px 24px' }}>
          {(initial as any).id ? 'Сохранить изменения' : 'Добавить товар'}
        </button>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ p, isAdmin, onEdit, onDelete }: {
  p: Product; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showUnitsDrawer, setShowUnitsDrawer] = useState(false);
  const [units, setUnits] = useState<JewelryUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitError, setAddUnitError] = useState('');
  const [addUnitLoading, setAddUnitLoading] = useState(false);
  const [newUnit, setNewUnit] = useState({ metalWeight: '', totalWeight: '', purity: '585', purchaseDate: new Date().toISOString().split('T')[0], price: p.price, quantity: 1 });
  const colorEntry = COLOR_PALETTE.find(c => c.name === p.color);

  const loadUnits = async () => {
    setUnitsLoading(true);
    try {
      const res = await fetch(`/api/crm/units?skuId=${p.id}`);
      const data = await res.json();
      if (data.success) setUnits(data.units);
    } catch {}
    setUnitsLoading(false);
  };

  const openDrawer = () => {
    if (units.length === 0) loadUnits();
    setShowUnitsDrawer(true);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUnitError('');
    setAddUnitLoading(true);
    try {
      const res = await fetch('/api/crm/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuId: p.id, ...newUnit, metalWeight: +newUnit.metalWeight, totalWeight: +newUnit.totalWeight, price: +newUnit.price }),
      });
      const data = await res.json();
      if (data.success) {
        setUnits(prev => [...prev, ...data.units]);
        setShowAddUnit(false);
        setNewUnit({ metalWeight: '', totalWeight: '', purity: '585', purchaseDate: new Date().toISOString().split('T')[0], price: p.price, quantity: 1 });
      } else {
        setAddUnitError(data.error || 'Ошибка при добавлении');
      }
    } catch (err: any) {
      setAddUnitError(err.message || 'Сетевая ошибка');
    }
    setAddUnitLoading(false);
  };

  const handleUnitUpdate = (updated: JewelryUnit) => setUnits(units.map(u => u.unitId === updated.unitId ? updated : u));
  const handleUnitDelete = async (unitId: string) => {
    if (!confirm('Удалить экземпляр?')) return;
    const res = await fetch(`/api/crm/units?unitId=${unitId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setUnits(units.filter(u => u.unitId !== unitId));
    } else {
      alert(data.error || 'Не удалось удалить');
    }
  };

  return (
    <>
    <div style={{ border: '1px solid #EEE', borderRadius: '16px', overflow: 'hidden', background: '#FFF' }}>
      <div style={{ height: '140px', background: '#F8F9FA', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = IMAGE_FALLBACK_SRC;
            }}
          />
        ) : <ImageIcon size={36} opacity={0.1} />}
        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.95)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>{p.article}</div>
        {p.purity && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(212,175,55,0.9)', color: '#FFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold' }}>{p.purity}°</div>}
        {colorEntry && <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '18px', height: '18px', borderRadius: '50%', background: colorEntry.code, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} title={colorEntry.name} />}
      </div>
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 'bold', textTransform: 'uppercase' }}>{p.category}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={onEdit} style={{ opacity: 0.3, padding: '2px' }}><Edit2 size={12} /></button>
            <button onClick={onDelete} style={{ opacity: 0.3, color: '#EF4444', padding: '2px' }}><Trash2 size={12} /></button>
          </div>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '4px 0', lineHeight: '1.3' }}>{p.name}</div>
        {p.origin && <div style={{ fontSize: '0.65rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />{p.origin}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{p.price.toLocaleString()} ₸</div>
          <div style={{ fontSize: '0.75rem', color: p.stock < 2 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{p.stock} шт.</div>
        </div>
        {/* Jewelry badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {p.caratWeight && <span style={{ fontSize: '0.6rem', background: '#F3E8FF', color: '#7C3AED', padding: '2px 6px', borderRadius: '4px' }}>{p.caratWeight} кт</span>}
          {p.clarity && <span style={{ fontSize: '0.6rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '4px' }}>{p.clarity}</span>}
          {p.diamondCount ? <span style={{ fontSize: '0.6rem', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px' }}>{p.diamondCount} бр.</span> : null}
          {p.discountAllowed ? <span style={{ fontSize: '0.6rem', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' }}>скидка до {p.discountAllowed}%</span> : null}
          {p.managerCommissionPercent ? <span style={{ fontSize: '0.6rem', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>комиссия {p.managerCommissionPercent}%</span> : null}
        </div>
        {/* Financial (admin only) */}
        {isAdmin && p.totalCostPrice ? (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: '8px', fontSize: '0.65rem', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {expanded ? <EyeOff size={10} /> : <Eye size={10} />} {expanded ? 'Скрыть финансы' : 'Показать финансы'}
          </button>
        ) : null}
        {isAdmin && expanded && p.totalCostPrice ? (
          <div style={{ marginTop: '8px', padding: '10px', background: '#FFF9F9', borderRadius: '8px', fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Себестоимость:</span><span>{(p.costPrice||0).toLocaleString()} ₸</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Растаможка:</span><span>{(p.customsDuty||0).toLocaleString()} ₸</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Расходы:</span><span>{(p.logisticsCosts||0).toLocaleString()} ₸</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #EEE', marginTop: '6px', paddingTop: '6px' }}><span>Итого себест.:</span><span style={{ color: '#EF4444' }}>{(p.totalCostPrice||0).toLocaleString()} ₸</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Наценка:</span><span style={{ color: '#10B981' }}>{p.markupPercentage||0}%</span></div>
          </div>
        ) : null}

        {/* ── Units button → opens drawer ── */}
        <button onClick={openDrawer}
          style={{ marginTop: '12px', width: '100%', padding: '9px', borderRadius: '10px',
            border: '1.5px solid #E0F2FE', background: '#F0F9FF', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', color: '#0369A1' }}>
          <List size={14} />
          Экземпляры (ТМЦ)
          {units.length > 0 && (
            <span style={{ background: '#0369A1', color: '#FFF', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem' }}>
              {units.length}
            </span>
          )}
          <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.7rem' }}>открыть →</span>
        </button>
      </div>
    </div>

    {/* ── Units Drawer ── */}
    <AnimatePresence>
      {showUnitsDrawer && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowUnitsDrawer(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1100 }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '640px', maxWidth: '95vw',
              background: '#FFF', zIndex: 1200, display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111' }}>Экземпляры ТМЦ</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>{p.name} · {p.article}</div>
              </div>
              {units.length > 0 && (
                <span style={{ background: '#F0F9FF', color: '#0369A1', borderRadius: '10px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '700' }}>
                  {units.length} шт.
                </span>
              )}
              <button onClick={() => setShowUnitsDrawer(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#6B7280' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unitsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', fontSize: '0.85rem' }}>Загрузка...</div>
              ) : units.length === 0 && !showAddUnit ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                  <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
                  <div style={{ fontSize: '0.88rem' }}>Экземпляры не добавлены</div>
                </div>
              ) : (
                units.map(unit => (
                  <UnitCard key={unit.unitId} unit={unit} isAdmin={isAdmin} onUpdate={handleUnitUpdate} onDelete={handleUnitDelete} />
                ))
              )}

              {showAddUnit ? (
                <form onSubmit={handleAddUnit} style={{ padding: '20px', background: '#F0F9FF',
                  borderRadius: '16px', border: '1.5px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Package size={16} /> Новый экземпляр ТМЦ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ВЕС МЕТАЛЛА (г) *</label>
                      <input className="luxury-input" type="number" step="0.01" required value={newUnit.metalWeight} onChange={e => setNewUnit({ ...newUnit, metalWeight: e.target.value })} placeholder="3.42" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ОБЩИЙ ВЕС (г) *</label>
                      <input className="luxury-input" type="number" step="0.01" required value={newUnit.totalWeight} onChange={e => setNewUnit({ ...newUnit, totalWeight: e.target.value })} placeholder="4.15" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ПРОБА *</label>
                      <select className="luxury-input" value={newUnit.purity} onChange={e => setNewUnit({ ...newUnit, purity: e.target.value })}>
                        {['375','585','750','875','925','958','999'].map(pu => <option key={pu} value={pu}>{pu}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ДАТА ПОСТУПЛЕНИЯ *</label>
                      <input className="luxury-input" type="date" required value={newUnit.purchaseDate} onChange={e => setNewUnit({ ...newUnit, purchaseDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>ЦЕНА (₸)</label>
                      <input className="luxury-input" type="number" value={newUnit.price === 0 ? '' : newUnit.price} onChange={e => setNewUnit({ ...newUnit, price: e.target.value === '' ? 0 : +e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '5px' }}>КОЛ-ВО (bulk)</label>
                      <input className="luxury-input" type="number" min="1" max="100" value={newUnit.quantity} onChange={e => setNewUnit({ ...newUnit, quantity: +e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => { setShowAddUnit(false); setAddUnitError(''); }}
                      className="btn-secondary" style={{ flex: 1, padding: '11px', fontSize: '0.82rem' }}>Отмена</button>
                    <button type="submit" disabled={addUnitLoading} className="btn-primary"
                      style={{ flex: 2, padding: '11px', fontSize: '0.82rem', fontWeight: '700' }}>
                      {addUnitLoading ? 'Сохранение...' : '+ Добавить экземпляр'}
                    </button>
                  </div>
                  {addUnitError && (
                    <div style={{ fontSize: '0.78rem', color: '#EF4444', padding: '10px 14px',
                      background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                      {addUnitError}
                    </div>
                  )}
                </form>
              ) : (
                <button onClick={() => setShowAddUnit(true)}
                  style={{ padding: '14px', borderRadius: '14px', border: '1.5px dashed #3B82F6',
                    background: '#F0F9FF', color: '#3B82F6', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                  <Plus size={16} /> Добавить экземпляр
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

// ─── LocationView Component ──────────────────────────────────────────────────

function LocationView({ managerId, activeBranchId }: { managerId: string; activeBranchId?: string }) {
  const [units, setUnits] = useState<JewelryUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/units')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUnits(data.units);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, JewelryUnit[]>>();
    units.forEach(u => {
      const loc = (u as any).currentLocation;
      if (!loc) return;
      const branchId = loc.branchId || 'unknown';
      // Filter by active branch if set
      if (activeBranchId && activeBranchId !== 'all' && branchId !== activeBranchId) return;
      const holderId = loc.holderId || 'unknown';
      if (!map.has(branchId)) map.set(branchId, new Map());
      const branchMap = map.get(branchId)!;
      if (!branchMap.has(holderId)) branchMap.set(holderId, []);
      branchMap.get(holderId)!.push(u);
    });
    return map;
  }, [units, activeBranchId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from(grouped.entries()).map(([branchId, holderMap]) => (
        <div key={branchId} style={{ background: '#FFF', borderRadius: '12px', padding: '1rem', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} style={{ color: 'var(--gold)' }} />
            {branchId}
          </div>
          {Array.from(holderMap.entries()).map(([holderId, unitList]) => (
            <div key={holderId} style={{ marginBottom: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem', color: '#6B7280' }}>
                {holderId} ({unitList.length} ед.)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {unitList.map(u => (
                  <span key={u.unitId} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#F3F4F6', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {u.unitId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      {grouped.size === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>Нет данных о местонахождении</div>
      )}
    </div>
  );
}

// ─── Main WarehouseManager Component ─────────────────────────────────────────

export default function WarehouseManager({ currentUserId, isAdmin, activeBranchId }: { currentUserId: string; isAdmin: boolean; activeBranchId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stoneOriginFilter, setStoneOriginFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'products' | 'warehouses' | 'location' | 'transfers'>('products');
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/products');
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (e) {}
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/crm/categories');
      const data = await res.json();
      if (data.success) setDbCategories(data.categories.map((c: any) => typeof c === 'string' ? c : c.name));
    } catch {}
  };

  const handleSave = async (form: any) => {
    const isEdit = !!editing;
    // Auto-generate article if empty
    const payload = isEdit
      ? { ...form, id: editing!.id }
      : { ...form, article: form.article?.trim() || `ART-${Date.now()}` };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    if (payloadBytes > MAX_PRODUCT_REQUEST_BYTES) {
      alert('Слишком большой запрос: уменьшите размер или количество фото товара.');
      return;
    }
    try {
      const res = await fetch('/api/crm/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await parseApiJsonSafe(res);
      if (data.success) {
        if (isEdit) setProducts(products.map(p => p.id === data.product.id ? data.product : p));
        else setProducts([...products, data.product]);
        // Sync image to media library
        if (form.imageUrl && form.imageUrl.startsWith('data:')) {
          fetch('/api/crm/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ name: form.name, url: form.imageUrl, type: 'image', source: 'product', createdAt: new Date().toISOString() }] })
          }).catch(() => {});
        }
        // Save new category if not in db
        if (form.category && !dbCategories.includes(form.category)) {
          const newCats = [...dbCategories, form.category];
          setDbCategories(newCats);
          fetch('/api/crm/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCats) }).catch(() => {});
        }
        setIsAdding(false);
        setEditing(null);
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить товар'));
      }
    } catch (e: any) {
      alert('Ошибка сети: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар со склада?')) return;
    try {
      const res = await fetch(`/api/crm/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setProducts(products.filter(p => p.id !== id));
    } catch (e) {}
  };

  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const all = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories, ...fromProducts]));
    return all;
  }, [products, dbCategories]);

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || p.article.toLowerCase().includes(s) || (p.origin||'').toLowerCase().includes(s));
    }
    return list;
  }, [products, search, categoryFilter]);

  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price * p.stock, 0), [products]);
  const totalCost = useMemo(() => products.reduce((s, p) => s + (p.totalCostPrice||0) * p.stock, 0), [products]);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0' }}>
        {[
          { id: 'products', label: 'Товары', icon: '📦' },
          { id: 'warehouses', label: 'Склады', icon: '🏭' },
          { id: 'location', label: 'Где находится?', icon: '📍' },
          ...(isAdmin ? [{ id: 'transfers', label: 'Перемещения', icon: '🔄' }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: activeTab === tab.id ? '700' : '400',
              color: activeTab === tab.id ? '#1A1A1A' : '#6B7280',
              borderBottom: activeTab === tab.id ? '2px solid #1A1A1A' : '2px solid transparent',
              marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Warehouses tab */}
      {activeTab === 'warehouses' && (
        <WarehouseReport managerId={currentUserId} isAdmin={isAdmin} />
      )}

      {/* Location tab */}
      {activeTab === 'location' && (
        <LocationView managerId={currentUserId} activeBranchId={activeBranchId} />
      )}

      {/* Transfers tab (admin only) */}
      {activeTab === 'transfers' && isAdmin && (
        <TransferPanel managerId={currentUserId} isAdmin={isAdmin} />
      )}

      {/* Products tab */}
      {activeTab === 'products' && (
      <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'ПОЗИЦИЙ', value: products.length, color: '#1A1A1A' },
          { label: 'ЕДИНИЦ НА СКЛАДЕ', value: products.reduce((s,p) => s+p.stock, 0), color: '#3B82F6' },
          { label: 'СТОИМОСТЬ СКЛАДА', value: totalValue.toLocaleString() + ' ₸', color: 'var(--gold)' },
          ...(isAdmin ? [{ label: 'СЕБЕСТОИМОСТЬ', value: totalCost.toLocaleString() + ' ₸', color: '#EF4444' }] : [{ label: 'МАЛО НА СКЛАДЕ', value: products.filter(p => p.stock < 2).length, color: '#EF4444' }]),
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ background: '#FFF' }}>
            <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0 }}>{s.label}</p>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            <input className="luxury-input" style={{ paddingLeft: '38px' }} placeholder="Поиск по названию, артикулу, городу..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="luxury-input" style={{ width: 'auto' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="luxury-input" style={{ width: 'auto' }} value={stoneOriginFilter} onChange={e => setStoneOriginFilter(e.target.value)}>
            <option value="all">Все камни</option>
            <option value="natural">Натуральные</option>
            <option value="lab_grown">Лабораторные</option>
          </select>
        </div>
        <button onClick={() => { setEditing(null); setIsAdding(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Добавить товар
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3 }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {filtered.map(p => (
            <ProductCard
              key={p.id} p={p} isAdmin={isAdmin}
              onEdit={() => { setEditing(p); setIsAdding(true); }}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', opacity: 0.3 }}>
              <Package size={48} style={{ margin: '0 auto 12px' }} />
              <div>Товары не найдены</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isAdding && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#FFF', width: '100%', maxWidth: '780px', borderRadius: '24px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold' }}>{editing ? 'Редактировать товар' : 'Добавить товар на склад'}</h3>
                <button onClick={() => { setIsAdding(false); setEditing(null); }} style={{ opacity: 0.4 }}><X size={20} /></button>
              </div>
              <ProductForm
                initial={editing ? { ...editing } : { ...EMPTY_PRODUCT }}
                onSave={handleSave}
                onCancel={() => { setIsAdding(false); setEditing(null); }}
                isAdmin={isAdmin}
                categories={categories}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      )}
    </div>
  );
}
