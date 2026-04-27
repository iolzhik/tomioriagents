'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Users, Phone, Camera, MessageCircle, Globe, Target, 
  Search, Filter, MoreVertical, Trash2, Edit2, CheckCircle, 
  XCircle, Clock, ChevronRight, Layout, LayoutDashboard, Database,
  ArrowLeft, ArrowRight, Loader2, Sparkles, User, CreditCard, Banknote, Wallet, Gift, Heart, Baby, Star, Calendar as CalendarIcon, Download, FileSpreadsheet,
  TrendingUp, BarChart3, PieChart, ShoppingBag, Settings, Shield, UserPlus, PackagePlus, Percent, Calculator, Briefcase, Lock, LogOut, Store, Truck, MapPin, Info, Image as ImageIcon, Search as SearchIcon, FileText, ExternalLink, RefreshCw, Printer, Zap
} from 'lucide-react';

const InstagramIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import WebsiteCMS from '../../components/WebsiteCMS';
import WarehouseManager from '../../components/WarehouseManager';
import HRManager from '../../components/HRManager';
import AccountingCharts from '../../components/AccountingCharts';
import MediaLibrary from '../../components/MediaLibrary';
import InventoryAnalytics from '../../components/InventoryAnalytics';
import SaleCertificate from '../../components/SaleCertificate';
import { BarcodeScanner } from '../../components/BarcodeLabel';
import GiftCertificates from '../../components/crm/GiftCertificates';
import LayawayList from '../../components/crm/LayawayList';
import WorkDayClock from '../../components/crm/WorkDayClock';
import WorkDayReport from '../../components/crm/WorkDayReport';
import DeliveriesToday from '../../components/crm/DeliveriesToday';
import BranchManager from '../../components/crm/BranchManager';

interface Receipt {
  id: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  products: LeadProduct[];
  totalAmount: number;
  paymentMethod: string;
  packagingOptions?: any;
  packagingPrice?: number;
  timestamp: string;
  managerName: string;
  verificationCode: string;
}

interface ManagerPermissions {
  kanban?: boolean;
  creative?: boolean;
  accounting?: boolean;
  warehouse?: boolean;
  analytics?: boolean;
  receipts?: boolean;
  shop?: boolean;
  website_cms?: boolean;
  hr?: boolean;
}

interface Manager {
  id: string;
  name: string;
  login: string;
  role: 'admin' | 'sales' | 'accountant';
  permissions?: ManagerPermissions | string;
}

type AppView =
  | 'kanban'
  | 'admin'
  | 'analytics'
  | 'accounting'
  | 'content_plan'
  | 'receipts'
  | 'shop_settings'
  | 'website_cms'
  | 'hr'
  | 'clients'
  | 'certificates'
  | 'layaways'
  | 'workday'
  | 'infrastructure';

const DEFAULT_MANAGER_PERMISSIONS: Required<ManagerPermissions> = {
  kanban: true,
  creative: false,
  accounting: false,
  warehouse: false,
  analytics: true,
  receipts: true,
  shop: false,
  website_cms: false,
  hr: false,
};

const HR_MANAGERS_CACHE_KEY = 'tomiori_hr_managers_cache_v1';
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const SUPPORTED_IMAGE_EXTENSIONS_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const MAX_PRODUCT_REQUEST_BYTES = 950_000;
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
    throw new Error('Файл слишком большой. Уменьшите размер фото и повторите.');
  }
  throw new Error(text.slice(0, 180) || `Ошибка сервера: ${res.status}`);
}

function parsePermissions(raw: unknown): Required<ManagerPermissions> {
  const base = { ...DEFAULT_MANAGER_PERMISSIONS };
  if (!raw) return base;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return base;
    return { ...base, ...(parsed as Partial<ManagerPermissions>) };
  } catch {
    return base;
  }
}

function isForcedCreativeWarehouseUser(user: any): boolean {
  const login = String(user?.login || '').trim().toLowerCase();
  return login === 'elmira' || login === 'elmirat';
}

function normalizeManager(manager: any): Manager {
  return {
    ...manager,
    permissions: parsePermissions(manager?.permissions),
  };
}

function readCachedManagers(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HR_MANAGERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findCachedManager(login: string, password: string): any | null {
  const normalizedLogin = String(login || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  if (!normalizedLogin || !normalizedPassword) return null;
  const cached = readCachedManagers();
  return cached.find((m: any) =>
    String(m?.login || '').trim().toLowerCase() === normalizedLogin &&
    String(m?.password || '') === normalizedPassword
  ) || null;
}

function mergeWithCachedManager(manager: any): any {
  if (!manager) return manager;
  const cached = readCachedManagers().find((m: any) =>
    (manager.id && String(m?.id || '') === String(manager.id)) ||
    String(m?.login || '').trim().toLowerCase() === String(manager?.login || '').trim().toLowerCase()
  );
  if (!cached) return manager;
  return { ...manager, ...cached };
}

interface AuditLog {
  id: string;
  timestamp: string;
  managerId: string;
  managerName: string;
  action: string;
  details: string;
  targetId?: string;
}

interface AccountingEntry {
  id: string;
  timestamp: string;
  type: 'income' | 'expense' | 'tax';
  category: string;
  amount: number;
  description: string;
  leadId?: string;
  managerId: string;
  isConfirmed?: boolean;
  taxDetails?: {
    vat: number;
    incomeTax: number;
  };
}

interface Product {
  id: string;
  category: string;
  name: string;
  article: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  shortDescription?: string;
}

interface LeadProduct {
  productId: string;
  name: string;
  price: number;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  product: string;
  productId?: string;
  products?: LeadProduct[];
  packagingOptions?: {
    giftWrap: boolean;
    jewelryBox: boolean;
    card: boolean;
  };
  packagingPrice?: number;
  managerId: string;
  status: 'new' | 'contacted' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: 'boutique' | 'instagram' | 'whatsapp' | 'website' | 'target';
  instagramAccount?: string;
  paymentMethod?: 'card' | 'cash' | 'transfer' | 'kaspi';
  paymentAmount?: number;
  productPrice?: number;
  discount?: number;
  finalPrice?: number;
  occasion?: string;
  additionalInfo?: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryDate?: string;
  createdAt: string;
  // Installment
  isInstallment?: boolean;
  installments?: any[];
  installmentTotal?: number;
  // Unit-based inventory
  unitId?: string;
  branchId?: string;
}

const COLUMNS = [
  { id: 'new', title: 'Новые', color: '#3B82F6' },
  { id: 'contacted', title: 'В контакте', color: '#F59E0B' },
  { id: 'negotiation', title: 'Переговоры', color: '#8B5CF6' },
  { id: 'closed_won', title: 'Успешно', color: '#10B981' },
  { id: 'closed_lost', title: 'Отказ', color: '#EF4444' }
];

const OCCASIONS = [
  "Свадьба", "Узату", "Сырга салу", "Подарок любимому человеку", 
  "Предложение", "Юбилей", "8 марта", "14 февраля", 
  "Рождение ребенка", "Бесик той"
];

const SOURCES = [
  { id: 'boutique', label: 'Бутик', icon: <Store size={14} /> },
  { id: 'instagram', label: 'Instagram', icon: <Camera size={14} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} /> },
  { id: 'website', label: 'Сайт', icon: <Globe size={14} /> },
  { id: 'target', label: 'Таргет', icon: <Target size={14} /> }
];

// ─── InstallmentModal ─────────────────────────────────────────────────────────
function InstallmentModal({ lead, total, paid, remaining, onClose, onSave }: {
  lead: any; total: number; paid: number; remaining: number;
  onClose: () => void; onSave: (amt: number, method: string, note: string) => void;
}) {
  const [amt, setAmt] = React.useState(remaining);
  const [method, setMethod] = React.useState('kaspi');
  const [note, setNote] = React.useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: '#FFF', width: '100%', maxWidth: '460px', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold' }}>Рассрочка / частичная оплата</h3>
          <button onClick={onClose} style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={22} /></button>
        </div>
        <div style={{ marginBottom: '1.5rem', padding: '14px', background: '#F8F9FA', borderRadius: '14px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{lead.name} — {lead.product}</div>
          {[['Итого:', total, '#1A1A1A'], ['Оплачено:', paid, '#10B981'], ['Остаток:', remaining, '#EF4444']].map(([l, v, c]: any) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ opacity: 0.6 }}>{l}</span><span style={{ fontWeight: 'bold', color: c }}>{v.toLocaleString()} ₸</span>
            </div>
          ))}
          <div style={{ height: '6px', background: '#EEE', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (paid / (total || 1)) * 100)}%`, background: '#10B981', borderRadius: '3px' }} />
          </div>
          {(lead.installments || []).length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(lead.installments || []).map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.6 }}>
                  <span>{p.date} · {p.method}{p.note ? ` · ${p.note}` : ''}</span><span style={{ color: '#10B981' }}>+{p.amount.toLocaleString()} ₸</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>СУММА ПЛАТЕЖА (₸)</label>
            <input className="luxury-input" type="number" value={amt} onChange={e => setAmt(+e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '8px' }}>СПОСОБ ОПЛАТЫ</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[{ id: 'kaspi', label: 'Kaspi' }, { id: 'card', label: 'Карта' }, { id: 'transfer', label: 'Перевод' }, { id: 'cash', label: 'Наличные' }].map(m => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${method === m.id ? '#10B981' : '#EEE'}`, background: method === m.id ? '#F0FDF4' : '#FFF', fontWeight: method === m.id ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem' }}>{m.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '5px' }}>КОММЕНТАРИЙ</label>
            <input className="luxury-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Необязательно..." />
          </div>
          <button onClick={() => onSave(amt, method, note)} className="btn-primary" style={{ padding: '14px', borderRadius: '12px', fontWeight: 'bold', background: '#10B981', border: 'none' }}>
            Зафиксировать платёж {amt >= remaining ? '(полная оплата ✓)' : `(остаток: ${(remaining - amt).toLocaleString()} ₸)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CRMPage() {
  const [currentUser, setCurrentUser] = useState<Manager | null>(null);
  const [authForm, setAuthForm] = useState({ login: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  const [activeView, setActiveView] = useState<AppView>('kanban');
  const [activeBranchId, setActiveBranchId] = useState<string>('all');
  const [branches, setBranches] = useState<any[]>([]);
  const [isSyncingIg, setIsSyncingIg] = useState(false);
  const [syncResult, setSyncResult] = useState<{created: number, updated: number} | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{id: string, status: string} | null>(null);
  
  // Accounting filter states
  const [accDateFilter, setAccDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  const [accTypeFilter, setAccDateTypeFilter] = useState<'all' | 'income' | 'expense' | 'tax'>('all');
  
  // Content Plan state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [contentPlanResult, setContentPlanResult] = useState<any>(null);
  const [planParams, setPlanParams] = useState({ days: 7, posts: 3, reels: 3, stories: 15 });
  
  // Deep AI Analytics state
  const [isGeneratingDeepReport, setIsGeneratingDeepReport] = useState(false);
  const [deepAiReport, setDeepAiReport] = useState<string | null>(null);
  
  // Admin/Warehouse states
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingManager, setIsAddingManager] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({ category: '', name: '', article: '', price: 0, stock: 0, imageUrl: '', description: '', shortDescription: '' });
  const [newManager, setNewManager] = useState<Partial<Manager & {password: string}>>({ name: '', login: '', password: '', role: 'sales' });
  const [productSearch, setProductSearch] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newAccEntry, setNewAccEntry] = useState<Partial<AccountingEntry>>({ type: 'income', category: 'Продажа изделия', amount: 0, description: '' });
  const [isAddingAccEntry, setIsAddingAccEntry] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Accountant Tools states
  const [isAiAccountingLoading, setIsAiAccountingLoading] = useState(false);
  const [aiAccountingInsight, setAiAccountingInsight] = useState<string | null>(null);
  
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Installment modal
  const [installmentLeadId, setInstallmentLeadId] = useState<string | null>(null);

  // Unit selector in lead form
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  // Admin sub-view
  const [adminSubView, setAdminSubView] = useState<'warehouse' | 'analytics'>('warehouse');
  const [certificateLead, setCertificateLead] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showLayaways, setShowLayaways] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [allUnits, setAllUnits] = useState<any[]>([]);

  // Filter states (for Admin)
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('all');
  const [whatsappFilter, setWhatsappFilter] = useState<string>('all');
  
  const [paymentData, setPaymentData] = useState({
    method: 'kaspi' as const,
    amount: 0
  });

  const [customOccasion, setCustomOccasion] = useState('');
  const [showCustomOccasion, setShowCustomOccasion] = useState(false);

  const [leadFormData, setLeadFormData] = useState<Partial<Lead & { discountAmount?: number }>>({
    name: '',
    phone: '',
    product: '',
    productId: '',
    products: [],
    packagingOptions: { giftWrap: false, jewelryBox: false, card: false },
    packagingPrice: 0,
    managerId: '',
    status: 'new',
    source: 'boutique',
    occasion: '',
    productPrice: 0,
    discount: 0,
    discountAmount: 0,
    finalPrice: 0,
    additionalInfo: '',
    fulfillmentMethod: 'pickup',
    deliveryAddress: '',
    deliveryDate: '',
    unitId: '',
  });

  const userPermissions = useMemo(
    () => parsePermissions(currentUser?.permissions),
    [currentUser?.permissions]
  );

  const canUseSection = (view: AppView) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const forcedAccess = isForcedCreativeWarehouseUser(currentUser);

    switch (view) {
      case 'kanban':
        return !!userPermissions.kanban;
      case 'analytics':
        return !!userPermissions.analytics;
      case 'receipts':
        return !!userPermissions.receipts;
      case 'shop_settings':
        return !!userPermissions.shop;
      case 'website_cms':
        return !!userPermissions.website_cms;
      case 'hr':
        return !!userPermissions.hr;
      case 'admin':
        // Hotfix: show warehouse/admin section to any authenticated user
        // while permissions synchronization is unstable in production.
        return true;
      case 'accounting':
        return currentUser.role === 'accountant' || !!userPermissions.accounting;
      case 'content_plan':
        return forcedAccess || !!userPermissions.creative;
      case 'infrastructure':
        return false;
      case 'clients':
      case 'certificates':
      case 'layaways':
      case 'workday':
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      const user = normalizeManager(JSON.parse(savedUser));
      setCurrentUser(user);
      if (user.role === 'sales') {
        setSelectedManagerFilter(user.id);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (canUseSection(activeView)) return;

    const fallbackOrder: AppView[] = [
      'kanban',
      'clients',
      'analytics',
      'receipts',
      'workday',
      'certificates',
      'layaways',
      'shop_settings',
      'accounting',
      'admin',
      'hr',
      'website_cms',
      'content_plan',
      'infrastructure',
    ];
    const fallback = fallbackOrder.find(v => canUseSection(v)) || 'kanban';
    setActiveView(fallback);
  }, [activeView, currentUser, userPermissions]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, managersRes, productsRes, logsRes, accountingRes, receiptsRes, clientsRes] = await Promise.all([
        fetch('/api/crm/leads'),
        fetch('/api/crm/managers'),
        fetch('/api/crm/products'),
        fetch('/api/crm/logs'),
        fetch('/api/crm/accounting'),
        fetch('/api/crm/receipts'),
        fetch('/api/crm/clients')
      ]);
      
      const leadsData = await leadsRes.json();
      const managersData = await managersRes.json();
      const productsData = await productsRes.json();
      const logsData = await logsRes.json();
      const accountingData = await accountingRes.json();
      const receiptsData = await receiptsRes.json();
      const clientsData = await clientsRes.json();

      if (leadsData.success) setLeads(leadsData.leads);
      if (managersData.success) setManagers((managersData.managers || []).map(normalizeManager));
      if (productsData.success) setProducts(productsData.products);
      if (logsData.success) setAuditLogs(logsData.logs);
      if (accountingData.success) {
        const mappedAccounting = accountingData.entries.map((e: any) => ({
          ...e,
          taxDetails: typeof e.taxDetails === 'string' ? JSON.parse(e.taxDetails || '{}') : (e.taxDetails || {})
        }));
        setAccountingEntries(mappedAccounting);
      }
      if (receiptsData.success) {
        const mappedReceipts = receiptsData.receipts.map((r: any) => ({
          ...r,
          products: typeof r.products === 'string' ? JSON.parse(r.products) : (r.products || [])
        }));
        setReceipts(mappedReceipts);
      }
      if (clientsData.success) {
        setClients(clientsData.clients);
        setAnniversaries(clientsData.anniversaries || []);
      }

      // Load units for certificate lookup (non-blocking)
      fetch('/api/crm/units').then(r => r.json()).then(d => {
        if (d.success) setAllUnits(d.units);
      }).catch(() => {});

      // Load branches (non-blocking)
      fetch('/api/crm/branches').then(r => r.json()).then(d => {
        if (d.success) setBranches(d.branches || []);
      }).catch(() => {});
      
      setLastUpdateTime(new Date().toLocaleString('ru-RU'));
    } catch (e) {
      console.error('Failed to fetch CRM data', e);
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: String(authForm.login || '').trim(),
          password: authForm.password
        })
      });
      const data = await res.json();
      if (data.success) {
        const normalizedManager = normalizeManager(mergeWithCachedManager(data.manager));
        setCurrentUser(normalizedManager);
        localStorage.setItem('crm_user', JSON.stringify(normalizedManager));
        if (normalizedManager.role === 'sales') {
          setSelectedManagerFilter(normalizedManager.id);
        } else {
          setSelectedManagerFilter('all');
        }
      } else {
        const localManager = findCachedManager(authForm.login, authForm.password);
        if (localManager) {
          const normalizedManager = normalizeManager(localManager);
          setCurrentUser(normalizedManager);
          localStorage.setItem('crm_user', JSON.stringify(normalizedManager));
          if (normalizedManager.role === 'sales') setSelectedManagerFilter(normalizedManager.id);
          else setSelectedManagerFilter('all');
          return;
        }
        setAuthError(data.error || 'Ошибка входа');
      }
    } catch (e) {
      const localManager = findCachedManager(authForm.login, authForm.password);
      if (localManager) {
        const normalizedManager = normalizeManager(localManager);
        setCurrentUser(normalizedManager);
        localStorage.setItem('crm_user', JSON.stringify(normalizedManager));
        if (normalizedManager.role === 'sales') setSelectedManagerFilter(normalizedManager.id);
        else setSelectedManagerFilter('all');
        return;
      }
      setAuthError('Ошибка сервера');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_user');
  };

  // Logic for discount calculation
  useEffect(() => {
    const basePrice = (leadFormData.products || []).reduce((sum, p) => sum + p.price, 0);
    const packagingPrice = leadFormData.packagingPrice || 0;
    const totalPriceBeforeDiscount = basePrice + packagingPrice;
    
    const discPercent = leadFormData.discount || 0;
    const discAmount = Math.round(totalPriceBeforeDiscount * (discPercent / 100));
    const final = totalPriceBeforeDiscount - discAmount;
    
    if (leadFormData.discountAmount !== discAmount || leadFormData.productPrice !== basePrice || leadFormData.finalPrice !== final) {
      setLeadFormData(prev => ({ 
        ...prev, 
        productPrice: basePrice, 
        discountAmount: discAmount, 
        finalPrice: final 
      }));
    }
  }, [leadFormData.products, leadFormData.packagingPrice, leadFormData.discount]);

  const handleDiscountAmountChange = (amount: number) => {
    const basePrice = (leadFormData.products || []).reduce((sum, p) => sum + p.price, 0);
    const packagingPrice = leadFormData.packagingPrice || 0;
    const totalPriceBeforeDiscount = basePrice + packagingPrice;
    
    const percent = totalPriceBeforeDiscount > 0 ? Math.round((amount / totalPriceBeforeDiscount) * 100) : 0;
    const final = totalPriceBeforeDiscount - amount;
    setLeadFormData(prev => ({ ...prev, discountAmount: amount, discount: percent, finalPrice: final }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingLead;
    const url = '/api/crm/leads';
    const method = isEdit ? 'PUT' : 'POST';
    
    const finalData = { ...leadFormData, managerId: currentUser?.id };
    if (showCustomOccasion && customOccasion) finalData.occasion = customOccasion;
    if (isEdit) (finalData as any).id = editingLead.id;
    if (!isEdit && activeBranchId !== 'all') (finalData as any).branchId = activeBranchId;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const data = await parseApiJsonSafe(res);
      if (data.success) {
        if (isEdit) {
          setLeads(leads.map(l => l.id === data.lead.id ? data.lead : l));
        } else {
          setLeads([...leads, data.lead]);
        }
        setIsAddingLead(false);
        setEditingLead(null);
        resetLeadForm();
        setLastUpdateTime(new Date().toLocaleString('ru-RU'));
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить лид'));
      }
    } catch (e) {
      console.error('Failed to save lead', e);
      alert('Ошибка сохранения лида. Проверьте данные и попробуйте снова.');
    }
  };

  const resetLeadForm = () => {
    setLeadFormData({
      name: '', phone: '', product: '', productId: '',
      products: [], packagingOptions: { giftWrap: false, jewelryBox: false, card: false }, packagingPrice: 0,
      managerId: currentUser?.role === 'sales' ? currentUser.id : (managers[0]?.id || 'm1'),
      status: 'new', source: 'boutique',
      occasion: '', productPrice: 0, discount: 0, discountAmount: 0, finalPrice: 0,
      additionalInfo: '', fulfillmentMethod: 'pickup', deliveryAddress: '', deliveryDate: '',
      unitId: '',
      deliveryDateTime: '',
      isInstallment: false,
      installmentPlan: undefined,
      whatsappStatus: undefined,
      giftCertCode: '',
    } as any);
    setCustomOccasion('');
    setShowCustomOccasion(false);
    setAvailableUnits([]);
    setSelectedUnitId('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 30МБ.');
      return;
    }

    const isSupported = SUPPORTED_IMAGE_MIME_TYPES.has(file.type) || SUPPORTED_IMAGE_EXTENSIONS_RE.test(file.name);
    if (!isSupported) {
      alert('Неподдерживаемый формат изображения. Используйте JPG, PNG, WEBP, GIF или AVIF.');
      e.target.value = '';
      return;
    }

    try {
      const optimized = await fileToOptimizedDataUrl(file);
      setNewProduct({ ...newProduct, imageUrl: optimized });
    } catch (err: any) {
      alert(err?.message || `Не удалось обработать файл: ${file.name}`);
    }
  };

  const handleProductAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingProduct;
    const method = isEdit ? 'PUT' : 'POST';
    const payload = isEdit ? { ...newProduct, id: editingProduct.id } : newProduct;
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    if (payloadBytes > MAX_PRODUCT_REQUEST_BYTES) {
      alert('Слишком большой запрос: уменьшите размер фото товара.');
      return;
    }
    
    try {
      const res = await fetch('/api/crm/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await parseApiJsonSafe(res);
      if (data.success) {
        if (isEdit) {
          setProducts(products.map(p => p.id === data.product.id ? data.product : p));
        } else {
          setProducts([...products, data.product]);
        }
        setIsAddingProduct(false);
        setEditingProduct(null);
        setNewProduct({ category: '', name: '', article: '', price: 0, stock: 0, imageUrl: '', description: '', shortDescription: '' });
        fetchData(); // Refresh memory bank sync
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить товар'));
      }
    } catch (e: any) {
      alert('Ошибка сети: ' + (e?.message || 'Не удалось сохранить товар'));
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить товар со склада?')) return;
    try {
      const res = await fetch(`/api/crm/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter(p => p.id !== id));
        fetchData();
      }
    } catch (e) {}
  };

  const downloadBackup = async () => {
    setIsBackupLoading(true);
    try {
      const res = await fetch('/api/crm/backup');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tomiori_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert('Ошибка при создании бэкапа');
    }
    setIsBackupLoading(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ВНИМАНИЕ: Восстановление из бэкапа полностью перезапишет текущие данные, включая доступы менеджеров. Продолжить?')) return;

    setIsRestoreLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const backup = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/crm/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup })
        });
        const data = await res.json();
        if (data.success) {
          alert('Система успешно восстановлена. Страница будет перезагружена.');
          window.location.reload();
        } else {
          alert('Ошибка при восстановлении: ' + data.error);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      alert('Ошибка при чтении файла бэкапа');
    }
    setIsRestoreLoading(false);
  };

  const getAiBody = () => {
    return {
      aiProvider: localStorage.getItem('ai_provider') || 'openai',
      openaiKey: localStorage.getItem('openai_key') || '',
      openRouterKey: localStorage.getItem('openrouter_key') || '',
      grokKey: localStorage.getItem('grok_key') || '',
      geminiKey: localStorage.getItem('gemini_key') || '',
      selectedModel: localStorage.getItem('selected_model') || 'openai/gpt-4o'
    };
  };

  const generateContentPlanAction = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/crm/ai/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...planParams, 
          ...getAiBody()
        })
      });
      const data = await res.json();
      if (data.success) {
        setContentPlanResult(data.plan);
      } else {
        alert('Ошибка ИИ: ' + data.error);
      }
    } catch (e) {
      alert('Ошибка при генерации контент-плана');
    }
    setIsGeneratingPlan(false);
  };

  const generateDeepAiReportAction = async () => {
    setIsGeneratingDeepReport(true);
    try {
      const res = await fetch('/api/crm/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leads: filteredLeads, 
          managers, 
          stats: analytics, 
          ...getAiBody()
        })
      });
      const data = await res.json();
      if (data.success) {
        setDeepAiReport(data.report);
      } else {
        alert('Ошибка ИИ: ' + data.error);
      }
    } catch (e) {
      alert('Ошибка при генерации глубокой аналитики');
    }
    setIsGeneratingDeepReport(false);
  };

  const handleManagerAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManager)
      });
      const data = await res.json();
      if (data.success) {
        setManagers([...managers, data.manager]);
        setIsAddingManager(false);
        setNewManager({ name: '', login: '', password: '', role: 'sales' });
        fetchData();
      } else {
        alert('Ошибка сохранения менеджера: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (e: any) {
      alert('Ошибка сохранения менеджера: ' + (e?.message || 'Ошибка сети'));
    }
  };

  const handleAccEntryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccEntry, managerId: currentUser?.id })
      });
      const data = await res.json();
      if (data.success) {
        setAccountingEntries([...accountingEntries, data.entry]);
        setIsAddingAccEntry(false);
        setNewAccEntry({ type: 'income', category: 'Продажа изделия', amount: 0, description: '' });
        fetchData(); // Refresh logs
      }
    } catch (e) {}
  };

  const deleteAccEntry = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await fetch(`/api/crm/accounting?id=${id}&managerId=${currentUser?.id}`, { method: 'DELETE' });
      setAccountingEntries(accountingEntries.filter(e => e.id !== id));
      fetchData();
    } catch (e) {}
  };

  const confirmAccEntry = async (id: string) => {
    try {
      const res = await fetch('/api/crm/accounting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isConfirmed: true, managerId: currentUser?.id })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {}
  };

  const generateAiAccountingInsights = async () => {
    setIsAiAccountingLoading(true);
    try {
      const res = await fetch('/api/crm/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'accounting',
          entries: filteredAccountingEntries,
          leads: filteredLeads,
          ...getAiBody()
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAccountingInsight(data.report);
      } else {
        alert('Ошибка ИИ: ' + data.error);
      }
    } catch (e) {
      alert('Ошибка при генерации финансового отчета');
    }
    setIsAiAccountingLoading(false);
  };

  const generateReceipt = async (leadId: string) => {
    try {
      const res = await fetch('/api/crm/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, managerId: currentUser?.id })
      });
      const data = await res.json();
      if (data.success) {
        const r = data.receipt;
        const mapped = {
          ...r,
          products: typeof r.products === 'string' ? JSON.parse(r.products) : (r.products || [])
        };
        setSelectedReceipt(mapped);
        setIsReceiptModalOpen(true);
        fetchData();
      }
    } catch (e) {
      alert('Ошибка генерации чека');
    }
  };

  const downloadReceiptPDF = async () => {
    const receiptElement = document.getElementById('premium-receipt-content');
    if (!receiptElement) return;

    const canvas = await html2canvas(receiptElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Tomiori_Receipt_${selectedReceipt?.id}.pdf`);
  };

  const updateLeadStatus = async (id: string, newStatus: string, additionalData: any = {}) => {
    if (newStatus === 'closed_won' && !additionalData.paymentMethod) {
      const lead = leads.find(l => l.id === id);
      setPendingStatusUpdate({ id, status: newStatus });
      setPaymentData({ method: 'kaspi', amount: lead?.finalPrice || lead?.productPrice || 0 });
      setIsPaymentModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, managerId: currentUser?.id, ...additionalData })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus as any, ...additionalData } : l));
        setIsPaymentModalOpen(false);
        setPendingStatusUpdate(null);
        setLastUpdateTime(new Date().toLocaleString('ru-RU'));
        fetchData(); // Refresh to get logs and accounting entries
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Удалить лид?')) return;
    try {
      await fetch(`/api/crm/leads?id=${id}&managerId=${currentUser?.id}`, { method: 'DELETE' });
      setLeads(leads.filter(l => l.id !== id));
      setLastUpdateTime(new Date().toLocaleString('ru-RU'));
      fetchData();
    } catch (e) {}
  };

  const addInstallmentPayment = async (leadId: string, payment: { amount: number; method: string; note?: string }) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const newPayment = { id: 'inst-' + Date.now(), amount: payment.amount, date: new Date().toISOString().split('T')[0], method: payment.method as any, note: payment.note };
    const installments = [...(lead.installments || []), newPayment];
    const installmentTotal = installments.reduce((s, p) => s + p.amount, 0);
    const finalPrice = lead.finalPrice || lead.productPrice || 0;
    const isFullyPaid = installmentTotal >= finalPrice;
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, managerId: currentUser?.id, isInstallment: true, installments, installmentTotal, ...(isFullyPaid ? { status: 'closed_won', paymentMethod: payment.method, paymentAmount: installmentTotal } : {}) })
      });
      const data = await res.json();
      if (data.success) { fetchData(); setInstallmentLeadId(null); }
    } catch (e) {}
  };

  const filteredLeads = useMemo(() => {
    if (!currentUser) return [];
    let list = currentUser.role === 'admin'
      ? (selectedManagerFilter === 'all' ? leads : leads.filter(l => l.managerId === selectedManagerFilter))
      : leads.filter(l => l.managerId === currentUser.id);
    if (whatsappFilter !== 'all') {
      list = list.filter(l => (l as any).whatsappStatus === whatsappFilter);
    }
    if (activeBranchId !== 'all') {
      list = list.filter(l => (l as any).branchId === activeBranchId);
    }
    return list;
  }, [leads, currentUser, selectedManagerFilter, whatsappFilter, activeBranchId]);

  const analytics = useMemo(() => {
    const totalRevenue = filteredLeads.filter(l => l.status === 'closed_won').reduce((acc, l) => acc + (l.paymentAmount || 0), 0);
    const potentialRevenue = filteredLeads.filter(l => l.status !== 'closed_won' && l.status !== 'closed_lost').reduce((acc, l) => acc + (l.finalPrice || l.productPrice || 0), 0);
    const conversionRate = filteredLeads.length > 0 ? (filteredLeads.filter(l => l.status === 'closed_won').length / filteredLeads.length) * 100 : 0;
    
    return { totalRevenue, potentialRevenue, conversionRate, count: filteredLeads.length };
  }, [filteredLeads]);

  // Communication stats per manager
  const commStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const statsMap = new Map<string, { answered: number; ignored: number; followup: number }>();
    filteredLeads.forEach(lead => {
      const log: any[] = (lead as any).communicationLog || [];
      log.forEach(entry => {
        const mgr = entry.managerId || lead.managerId;
        if (!statsMap.has(mgr)) statsMap.set(mgr, { answered: 0, ignored: 0, followup: 0 });
        const s = statsMap.get(mgr)!;
        if (entry.type === 'answered') s.answered++;
        else if (entry.type === 'ignored') s.ignored++;
        else if (entry.type === 'followup') s.followup++;
      });
    });
    return Array.from(statsMap.entries()).map(([managerId, s]) => {
      const total = s.answered + s.ignored;
      const responseRate = total > 0 ? Math.round((s.answered / total) * 1000) / 10 : 0;
      const managerName = managers.find(m => m.id === managerId)?.name || managerId;
      return { managerId, managerName, ...s, responseRate };
    });
  }, [filteredLeads, managers]);

  const aiInsights = useMemo(() => {
    if (filteredLeads.length === 0) return "Недостаточно данных для анализа.";
    
    const closedWon = filteredLeads.filter(l => l.status === 'closed_won');
    const closedLost = filteredLeads.filter(l => l.status === 'closed_lost');
    const sources = filteredLeads.reduce((acc: any, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {});
    
    const topSource = Object.entries(sources).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A';
    const avgCheck = closedWon.length > 0 
      ? Math.round(closedWon.reduce((acc, l) => acc + (l.paymentAmount || 0), 0) / closedWon.length) 
      : 0;

    const topOccasion = filteredLeads.reduce((acc: any, l) => {
      if (l.occasion) acc[l.occasion] = (acc[l.occasion] || 0) + 1;
      return acc;
    }, {});
    const bestOccasion = Object.entries(topOccasion).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'Свадьба';

    return `Анализ ${filteredLeads.length} лидов показывает, что основным каналом привлечения является ${topSource}. 
    Средний чек успешных сделок составляет ${avgCheck.toLocaleString()} ₸. 
    ${closedLost.length > closedWon.length ? "Внимание: количество отказов превышает продажи. Рекомендуется пересмотреть стратегию прогрева." : "Положительная динамика: конверсия в продажу стабильна."} 
    Наибольший интерес вызывают изделия к событию "${bestOccasion}".`;
  }, [filteredLeads]);

  const exportToExcel = () => {
    const excelData = filteredLeads.map(lead => ({
      'ID': lead.id,
      'Менеджер': managers.find(m => m.id === lead.managerId)?.name || 'Неизвестен',
      'Клиент': lead.name,
      'Телефон': lead.phone,
      'Изделие': lead.product,
      'Цена (₸)': lead.productPrice || 0,
      'Скидка (%)': lead.discount || 0,
      'Итог (₸)': lead.finalPrice || lead.productPrice || 0,
      'Повод': lead.occasion || '-',
      'Статус': COLUMNS.find(c => c.id === lead.status)?.title || lead.status,
      'Источник': lead.source,
      'Instagram': lead.instagramAccount || '-',
      'Форма получения': lead.fulfillmentMethod === 'pickup' ? 'Самовывоз' : 'Доставка',
      'Адрес доставки': lead.deliveryAddress || '-',
      'Дата доставки': lead.deliveryDate || '-',
      'Метод оплаты': lead.paymentMethod || '-',
      'Сумма оплаты (₸)': lead.paymentAmount || 0,
      'Дата создания': new Date(lead.createdAt).toLocaleString('ru-RU')
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    const filename = currentUser?.role === 'sales' ? `My_Leads_${currentUser.name}_${new Date().toISOString().split('T')[0]}.xlsx` : `All_Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const filteredAccountingEntries = useMemo(() => {
    let filtered = [...accountingEntries];
    
    // Type filter
    if (accTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === accTypeFilter);
    }
    
    // Date filter
    const now = new Date();
    if (accDateFilter === 'day') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(e => new Date(e.timestamp) >= startOfDay);
    } else if (accDateFilter === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      filtered = filtered.filter(e => new Date(e.timestamp) >= startOfWeek);
    } else if (accDateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(e => new Date(e.timestamp) >= startOfMonth);
    } else if (accDateFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(e => new Date(e.timestamp) >= startOfYear);
    }
    
    return filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [accountingEntries, accDateFilter, accTypeFilter]);

  const exportAccountingToExcel = () => {
    const excelData = filteredAccountingEntries.map(entry => ({
      'ID': entry.id,
      'Дата': new Date(entry.timestamp).toLocaleDateString('ru-RU'),
      'Тип': entry.type === 'income' ? 'Доход' : entry.type === 'expense' ? 'Расход' : 'Налог',
      'Категория': entry.category,
      'Сумма (₸)': entry.amount,
      'НДС 12% (₸)': entry.taxDetails?.vat || 0,
      'ИПН/КПН 3% (₸)': entry.taxDetails?.incomeTax || 0,
      'Описание': entry.description,
      'Статус': entry.isConfirmed ? 'Подтверждено' : 'Ожидает подтверждения',
      'Лид ID': entry.leadId || '-',
      'Менеджер': managers.find(m => m.id === entry.managerId)?.name || 'Система'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounting_Report");
    XLSX.writeFile(workbook, `Accounting_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleIgSync = async () => {
    const savedIg = localStorage.getItem('tomiori_ig_creds');
    const savedConfig = localStorage.getItem('tomiori_ai_config');
    
    if (!savedIg) {
      alert('Сначала настройте Instagram API в модуле "Анализ конкурентов" (Creative Lab)');
      return;
    }

    const igCreds = JSON.parse(savedIg);
    const aiConfig = savedConfig ? JSON.parse(savedConfig) : {};

    setIsSyncingIg(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/crm/instagram-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: igCreds.graphToken, 
          igAccountId: igCreds.igAccountId,
          aiConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ created: data.leadsCreated, updated: data.leadsUpdated });
        fetchData(); // Refresh leads
        setTimeout(() => setSyncResult(null), 5000);
      } else {
        alert('Ошибка синхронизации: ' + data.error);
      }
    } catch (e) {
      alert('Ошибка соединения с сервером');
    } finally {
      setIsSyncingIg(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  const searchedProducts = useMemo(() => {
    if (!productSearch) return products;
    const s = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.article.toLowerCase().includes(s) || 
      p.category.toLowerCase().includes(s)
    );
  }, [products, productSearch]);

  // Drag & Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedLeadId !== null) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.status !== columnId) {
        updateLeadStatus(draggedLeadId, columnId);
      }
    }
    setDraggedLeadId(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#FFF', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>TOMIORI <span className="gold-text">CRM</span></h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '8px' }}>Введите данные для входа в систему</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ЛОГИН</label>
              <input type="text" required className="luxury-input" value={authForm.login} onChange={e => setAuthForm({...authForm, login: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ПАРОЛЬ</label>
              <input type="password" required className="luxury-input" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            </div>
            {authError && <div style={{ fontSize: '0.75rem', color: '#EF4444', textAlign: 'center' }}>{authError}</div>}
            <button type="submit" className="btn-primary" style={{ padding: '15px', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px' }}>Войти в систему</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="crm-container" style={{ minHeight: '100vh', background: '#F8F9FA', color: '#1A1A1A' }}>
      {/* Navigation */}
      <nav style={{ padding: '1rem 2rem', background: '#FFF', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}><ArrowLeft size={16} /></Link>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>TOMIORI <span className="gold-text">CRM v4.0</span></h1>
          {/* Branch selector */}
          {branches.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', padding: '3px', borderRadius: '10px' }}>
              <button
                onClick={() => setActiveBranchId('all')}
                style={{ padding: '4px 12px', borderRadius: '7px', border: 'none', background: activeBranchId === 'all' ? '#FFF' : 'transparent', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', color: activeBranchId === 'all' ? '#B8860B' : '#6B7280', boxShadow: activeBranchId === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
              >
                Все
              </button>
              {branches.map((b, i) => {
                const BRANCH_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
                const isActive = activeBranchId === b.branchId;
                return (
                  <button
                    key={b.branchId}
                    onClick={() => setActiveBranchId(b.branchId)}
                    style={{ padding: '4px 12px', borderRadius: '7px', border: 'none', background: isActive ? color : 'transparent', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', color: isActive ? '#FFF' : '#6B7280', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s' }}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: '5px', background: '#F1F3F5', padding: '4px', borderRadius: '10px' }}>
            {canUseSection('kanban') && <button onClick={() => setActiveView('kanban')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'kanban' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Канбан</button>}
            {canUseSection('analytics') && <button onClick={() => setActiveView('analytics')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'analytics' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Аналитика</button>}
            {canUseSection('clients') && <button onClick={() => setActiveView('clients')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'clients' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14} /> Клиенты</button>}
            {canUseSection('receipts') && <button onClick={() => setActiveView('receipts')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'receipts' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14} /> Чеки</button>}
            {canUseSection('shop_settings') && <button onClick={() => setActiveView('shop_settings')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'shop_settings' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><InstagramIcon size={14} /> Instagram Shop</button>}
            {canUseSection('accounting') && (
              <button onClick={() => setActiveView('accounting')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'accounting' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Бухгалтерия</button>
            )}
            {(canUseSection('admin') || canUseSection('hr') || canUseSection('website_cms')) && (
              <>
                {canUseSection('admin') && <button onClick={() => setActiveView('admin')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'admin' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Склад / Админ</button>}
                {canUseSection('hr') && <button onClick={() => setActiveView('hr')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'hr' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14} /> HR</button>}
                {canUseSection('website_cms') && <button onClick={() => setActiveView('website_cms')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'website_cms' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={14} /> Сайт Магазина</button>}
              </>
            )}
            {canUseSection('certificates') && <button onClick={() => setActiveView('certificates')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'certificates' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>🎁 Сертификаты</button>}
            {canUseSection('infrastructure') && (
              <button onClick={() => setActiveView('infrastructure')} style={{ padding: '6px 15px', borderRadius: '8px', border: 'none', background: activeView === 'infrastructure' ? '#FFF' : 'transparent', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>🏗 Инфраструктура</button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{currentUser.role === 'admin' ? 'Администратор' : 'Менеджер'}</div>
           </div>
           <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: '#EF4444' }}><LogOut size={18} /></button>
           <button className="btn-primary" onClick={() => { resetLeadForm(); setIsAddingLead(true); }} style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Создать лид</button>
        </div>
      </nav>

      <main style={{ padding: '2rem' }}>
        {activeView === 'kanban' && (
          <div className="fade-in">
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIsAddingLead(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Добавить лид
                  </button>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF', border: '1px solid #D4AF37', color: '#B8860B' }}
                  >
                    🔍 Сканер ТМЦ
                  </button>
                  <button 
                    onClick={handleIgSync} 
                    disabled={isSyncingIg}
                    className="btn-secondary" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: '#FFF', 
                      border: '1px solid #E1306C', 
                      color: '#E1306C',
                      opacity: isSyncingIg ? 0.6 : 1
                    }}
                  >
                    {isSyncingIg ? <Loader2 size={16} className="spin" /> : <InstagramIcon size={16} color="#E1306C" />} 
                    {isSyncingIg ? 'Синхронизация...' : 'Синхронизировать Direct'}
                  </button>
                  <button onClick={() => setShowLayaways(s => !s)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', background: showLayaways ? '#1A1A1A' : '#FFF', color: showLayaways ? '#FFF' : '#1A1A1A', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔒 Отложки
                  </button>
                  <button onClick={() => setShowDeliveries(s => !s)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', background: showDeliveries ? '#3B82F6' : '#FFF', color: showDeliveries ? '#FFF' : '#1A1A1A', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🚚 Доставки
                  </button>
               </div>
               
               {syncResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '0.75rem', background: '#F0FDF4', color: '#16A34A', padding: '8px 15px', borderRadius: '10px', border: '1px solid #BBF7D0', fontWeight: 'bold' }}
                  >
                    ✅ Готово: +{syncResult.created} новых, {syncResult.updated} обновлено
                  </motion.div>
               )}
            </div>

            {/* Branch banner */}
            {activeBranchId !== 'all' && (() => {
              const branchIdx = branches.findIndex(b => b.branchId === activeBranchId);
              const BRANCH_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
              const color = BRANCH_COLORS[branchIdx % BRANCH_COLORS.length] || '#3B82F6';
              const branch = branches[branchIdx];
              return (
                <div style={{ marginBottom: '1rem', padding: '10px 16px', borderRadius: '12px', background: color + '15', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color }}>
                  <MapPin size={14} /> Филиал: {branch?.name} — показаны только лиды этого филиала
                </div>
              );
            })()}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { label: `ВЫРУЧКА ${currentUser.role === 'sales' ? '(МОЯ)' : ''}`, value: `${analytics.totalRevenue.toLocaleString()} ₸`, color: '#10B981' },
                { label: 'ПОТЕНЦИАЛ', value: `${analytics.potentialRevenue.toLocaleString()} ₸`, color: 'var(--gold)' },
                { label: 'КОНВЕРСИЯ', value: `${analytics.conversionRate.toFixed(1)}%`, color: '#1A1A1A' },
                { label: 'ЛИДОВ В РАБОТЕ', value: analytics.count, color: '#1A1A1A' }
              ].map((stat, i) => (
                <div key={i} className="glass-card" style={{ background: '#FFF' }}>
                  <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>{stat.label}</p>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Work Day Clock for all users */}
            <div style={{ marginBottom: '1rem' }}>
              <WorkDayClock managerId={currentUser.id} />
            </div>

            {/* WhatsApp filter + Communication stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* WhatsApp filter */}
              <div style={{ display: 'flex', gap: '6px', background: '#F1F3F5', padding: '4px', borderRadius: '10px' }}>
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'manual_confirmed', label: '✓ WA подтверждён' },
                  { id: 'unverified', label: '⚠ WA не подтверждён' },
                ].map(f => (
                  <button key={f.id} onClick={() => setWhatsappFilter(f.id)}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: whatsappFilter === f.id ? '#FFF' : 'transparent', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', color: whatsappFilter === f.id ? '#1A1A1A' : '#6B7280' }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Communication stats per manager */}
              {commStats.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {commStats.map(s => (
                    <div key={s.managerId} style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '8px 12px', fontSize: '0.7rem' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px', color: '#1A1A1A' }}>{s.managerName}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#10B981' }}>✓ {s.answered}</span>
                        <span style={{ color: '#EF4444' }}>✗ {s.ignored}</span>
                        <span style={{ color: '#F59E0B' }}>↻ {s.followup}</span>
                        <span style={{ background: s.responseRate >= 70 ? '#D1FAE5' : s.responseRate >= 40 ? '#FEF3C7' : '#FEE2E2', color: s.responseRate >= 70 ? '#065F46' : s.responseRate >= 40 ? '#92400E' : '#991B1B', padding: '1px 6px', borderRadius: '20px', fontWeight: '700' }}>
                          {s.responseRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '2rem' }}>
              {COLUMNS.map(column => (
                <div
                  key={column.id}
                  onDragOver={e => handleDragOver(e, column.id)}
                  onDrop={e => handleDrop(e, column.id)}
                  onDragLeave={() => setDragOverColumn(null)}
                  style={{
                    flex: 1, minWidth: '280px', background: dragOverColumn === column.id ? column.color + '12' : '#F1F3F5',
                    borderRadius: '20px', display: 'flex', flexDirection: 'column',
                    border: dragOverColumn === column.id ? '2px dashed ' + column.color : '1px solid #E9ECEF',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ padding: '1rem', borderBottom: '2px solid ' + column.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF', borderRadius: '20px 20px 0 0' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>{column.title}</h3>
                    <span style={{ fontSize: '0.7rem', background: column.color + '15', color: column.color, padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold' }}>{filteredLeads.filter(l => l.status === column.id).length}</span>
                  </div>
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '80px' }}>
                    {filteredLeads.filter(l => l.status === column.id).map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className="glass-card"
                        style={{
                          background: '#FFF', padding: '1rem', border: '1px solid #EEE',
                          cursor: 'grab', opacity: draggedLeadId === lead.id ? 0.4 : 1,
                          transform: draggedLeadId === lead.id ? 'rotate(2deg) scale(0.98)' : 'none',
                          transition: 'opacity 0.15s, transform 0.15s',
                          userSelect: 'none',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div id={`lead-${lead.id}`} style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '4px' }}>ID: {lead.id} | {lead.fulfillmentMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                             <button onClick={() => { setEditingLead(lead); setLeadFormData(lead); setIsAddingLead(true); }} style={{ opacity: 0.3 }}><Edit2 size={12} /></button>
                             <button onClick={() => deleteLead(lead.id)} style={{ opacity: 0.3, color: '#EF4444' }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{lead.phone}</div>
                        <div style={{ marginTop: '8px', padding: '8px', background: '#F9F9FB', borderRadius: '10px' }}>
                           <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{lead.product}</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--gold)' }}>{lead.finalPrice?.toLocaleString() || lead.productPrice?.toLocaleString()} ₸</div>
                              {lead.discount ? <div style={{ fontSize: '0.6rem', background: '#EF444415', color: '#EF4444', padding: '2px 5px', borderRadius: '4px' }}>-{lead.discount}%</div> : null}
                           </div>
                        </div>
                        {lead.deliveryDate && (
                          <div style={{ marginTop: '8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px', color: '#3B82F6' }}>
                            <Truck size={12} /> {lead.deliveryDate}
                          </div>
                        )}
                        {/* deliveryDateTime with 2-hour warning */}
                        {(lead as any).deliveryDateTime && lead.fulfillmentMethod === 'delivery' && (() => {
                          const dt = new Date((lead as any).deliveryDateTime);
                          const diff = dt.getTime() - Date.now();
                          const isUrgent = diff >= 0 && diff <= 2 * 60 * 60 * 1000;
                          return (
                            <div style={{ marginTop: '6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px', color: isUrgent ? '#EF4444' : '#3B82F6', background: isUrgent ? '#FEF2F2' : '#EFF6FF', padding: '3px 8px', borderRadius: '6px' }}>
                              <Truck size={11} /> {dt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              {isUrgent && ' ⚠ Скоро'}
                            </div>
                          );
                        })()}
                        {/* Courier info */}
                        {lead.fulfillmentMethod === 'delivery' && ((lead as any).courierName || (lead as any).deliveryStatus) && (
                          <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(lead as any).deliveryStatus && (() => {
                              const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
                                pending:    { label: '⏳ Ожидает',       color: '#92400E', bg: '#FEF3C7' },
                                in_transit: { label: '🚚 В пути',        color: '#1D4ED8', bg: '#DBEAFE' },
                                delivered:  { label: '✅ Доставлено',    color: '#065F46', bg: '#D1FAE5' },
                                failed:     { label: '❌ Не доставлено', color: '#991B1B', bg: '#FEE2E2' },
                                returned:   { label: '↩️ Возврат',       color: '#6B7280', bg: '#F3F4F6' },
                              };
                              const s = STATUS_MAP[(lead as any).deliveryStatus] || { label: (lead as any).deliveryStatus, color: '#6B7280', bg: '#F3F4F6' };
                              return (
                                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: '600' }}>
                                  {s.label}
                                </span>
                              );
                            })()}
                            {(lead as any).courierName && (
                              <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '20px', background: '#F3F4F6', color: '#374151' }}>
                                👤 {(lead as any).courierName}
                              </span>
                            )}
                            {(lead as any).courierCarNumber && (
                              <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '20px', background: '#F3F4F6', color: '#374151' }}>
                                🚗 {(lead as any).courierCarNumber}
                              </span>
                            )}
                          </div>
                        )}
                        {/* WhatsApp badge + discount */}
                        {(lead as any).whatsappStatus === 'manual_confirmed' && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#D1FAE5', color: '#065F46', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>
                              ✓ WhatsApp подтверждён
                            </div>
                            {/* WA discount selector */}
                            <select
                              defaultValue=""
                              onChange={async e => {
                                const pct = Number(e.target.value);
                                if (!pct) return;
                                const base = lead.productPrice || lead.finalPrice || 0;
                                const newFinal = Math.round(base * (1 - pct / 100));
                                await fetch('/api/crm/leads', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: lead.id, managerId: currentUser.id, discount: pct, finalPrice: newFinal }),
                                });
                                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, discount: pct, finalPrice: newFinal } : l));
                                e.target.value = '';
                              }}
                              style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '20px', border: '1px solid #86EFAC', background: '#F0FDF4', color: '#166534', cursor: 'pointer' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="">🎁 Скидка WA</option>
                              {[3, 5, 7, 10, 15, 20].map(p => (
                                <option key={p} value={p}>{p}%</option>
                              ))}
                            </select>
                            {lead.discount ? (
                              <span style={{ fontSize: '0.6rem', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '20px', fontWeight: '700' }}>
                                -{lead.discount}% применено
                              </span>
                            ) : null}
                          </div>
                        )}
                        {(lead as any).whatsappStatus === 'unverified' && lead.source === 'whatsapp' && (
                          <div style={{ marginTop: '4px', fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>
                            ⚠ WA — ожидает подтверждения
                          </div>
                        )}
                        {!(lead as any).whatsappStatus && lead.source === 'whatsapp' && (
                          <div style={{ marginTop: '4px', fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', color: '#6B7280', padding: '2px 7px', borderRadius: '20px' }}>
                            📱 WhatsApp
                          </div>
                        )}
                        {/* Installment progress */}
                        {lead.isInstallment && (
                          <div style={{ marginTop: '8px', padding: '8px', background: '#FFF9F0', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', color: '#92400E' }}>Рассрочка</span>
                              <span style={{ color: '#92400E' }}>{(lead.installmentTotal||0).toLocaleString()} / {(lead.finalPrice||lead.productPrice||0).toLocaleString()} ₸</span>
                            </div>
                            <div style={{ height: '4px', background: '#FDE68A', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, ((lead.installmentTotal||0) / (lead.finalPrice||lead.productPrice||1)) * 100)}%`, background: '#F59E0B', borderRadius: '2px' }} />
                            </div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '3px' }}>{(lead.installments||[]).length} платежей</div>
                          </div>
                        )}
                        {/* Installment button */}
                        {lead.status !== 'closed_lost' && (
                          <button onClick={() => setInstallmentLeadId(lead.id)} style={{ marginTop: '8px', width: '100%', padding: '6px', fontSize: '0.65rem', background: 'none', border: '1px dashed #F59E0B', borderRadius: '8px', color: '#92400E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Wallet size={11} /> {lead.isInstallment ? 'Добавить платёж' : 'Рассрочка / частичная оплата'}
                          </button>
                        )}
                        {lead.status === 'closed_won' && (
                          <>
                          <button
                            onClick={() => {
                              const receipt = receipts.find(r => r.leadId === lead.id);
                              if (receipt) { setSelectedReceipt(receipt); setIsReceiptModalOpen(true); }
                              else { generateReceipt(lead.id); }
                            }}
                            className="btn-primary"
                            style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '0.7rem', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                          >
                            <CreditCard size={14} /> {receipts.some(r => r.leadId === lead.id) ? 'Показать чек' : 'Сформировать чек'}
                          </button>
                          <button
                            onClick={() => setCertificateLead(lead)}
                            style={{ marginTop: '6px', width: '100%', padding: '7px', fontSize: '0.7rem',
                              background: 'linear-gradient(135deg, #FFF9E6, #FFFDF5)',
                              border: '1px solid #D4AF37', borderRadius: '8px', color: '#B8860B',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: '600' }}
                          >
                            🏅 Сертификат подлинности
                          </button>
                          </>
                        )}
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{managers.find(m => m.id === lead.managerId)?.name}</div>
                           <div style={{ display: 'flex', gap: '3px' }}>
                              {COLUMNS.map(col => lead.status !== col.id && (
                                <button key={col.id} onClick={() => updateLeadStatus(lead.id, col.id)} title={col.title} style={{ width: '18px', height: '18px', borderRadius: '50%', background: col.color + '20', border: '1px solid ' + col.color + '30', cursor: 'pointer' }} />
                              ))}
                           </div>
                        </div>
                        {/* Communication log quick actions */}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                          {[
                            { type: 'answered', label: '✓ Ответил', color: '#10B981', bg: '#D1FAE5' },
                            { type: 'ignored', label: '✗ Игнор', color: '#EF4444', bg: '#FEE2E2' },
                            { type: 'followup', label: '↻ Дожать', color: '#F59E0B', bg: '#FEF3C7' },
                          ].map(({ type, label, color, bg }) => (
                            <button key={type}
                              onClick={async () => {
                                const entry = { id: 'cl-' + Date.now(), type, timestamp: new Date().toISOString(), managerId: currentUser.id };
                                await fetch('/api/crm/leads', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: lead.id, managerId: currentUser.id, communicationLogEntry: entry }),
                                });
                                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, communicationLog: [...((l as any).communicationLog || []), entry] } as any : l));
                              }}
                              style={{ flex: 1, padding: '3px 0', fontSize: '0.55rem', fontWeight: '700', background: bg, color, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                              {label}
                            </button>
                          ))}
                        </div>
                        {/* Communication log count */}
                        {((lead as any).communicationLog?.length > 0) && (
                          <div style={{ marginTop: '4px', fontSize: '0.6rem', opacity: 0.5, textAlign: 'right' }}>
                            {((lead as any).communicationLog?.length)} контактов
                          </div>
                        )}
                      </div>
                    ))}
                    {dragOverColumn === column.id && draggedLeadId !== null && (
                      <div style={{ border: '2px dashed ' + column.color, borderRadius: '12px', padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: column.color, opacity: 0.7 }}>
                        Отпустите здесь
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showLayaways && (
              <div style={{ marginTop: '1.5rem', background: '#FFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700' }}>🔒 Отложки и рассрочки</h3>
                <LayawayList managerId={currentUser.id} />
              </div>
            )}
            {showDeliveries && (
              <div style={{ marginTop: '1.5rem', background: '#FFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700' }}>🚚 Доставки сегодня</h3>
                <DeliveriesToday managerId={currentUser.id} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
               <div className="glass-card" style={{ background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Аналитика {currentUser.role === 'admin' ? 'по менеджерам' : '(Моя)'}</h3>
                    {currentUser.role === 'admin' && (
                      <select value={selectedManagerFilter} onChange={e => setSelectedManagerFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #EEE', fontSize: '0.8rem' }}>
                        <option value="all">Все менеджеры</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 0' }}>
                     {COLUMNS.map(col => {
                        const count = filteredLeads.filter(l => l.status === col.id).length;
                        const height = (count / (filteredLeads.length || 1)) * 100;
                        return (
                          <div key={col.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                             <div style={{ width: '100%', height: `${Math.max(height, 5)}%`, background: col.color, borderRadius: '8px 8px 0 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>{count}</div>
                             </div>
                             <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{col.title}</div>
                          </div>
                        )
                     })}
                  </div>
               </div>
               <div className="glass-card" style={{ background: '#000', color: '#FFF', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Deep AI Analytics</h3>
                    <Sparkles size={18} color="var(--gold)" />
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', marginBottom: '1.5rem', paddingRight: '10px' }} className="custom-scrollbar">
                    {deepAiReport ? (
                      <div className="ai-report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#EEE' }}>
                        <ReactMarkdown>{deepAiReport}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: '1.6' }}>
                        {aiInsights}
                        <p style={{ marginTop: '1rem', color: 'var(--gold)', fontWeight: 'bold' }}>
                          Нажмите кнопку ниже для запуска глубокого ИИ-анализа всей базы данных Tomiori.
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={generateDeepAiReportAction}
                      disabled={isGeneratingDeepReport}
                      className="btn-primary"
                      style={{ flex: 2, background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {isGeneratingDeepReport ? (
                        <> <Loader2 size={16} className="spin" /> Генерирую... </>
                      ) : (
                        <> <Sparkles size={16} /> Сгенерировать глубокий отчет </>
                      )}
                    </button>
                    <button onClick={handlePrintReport} className="btn-secondary" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                      <Printer size={16} /> Печать
                    </button>
                  </div>
               </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2rem', background: '#FFF', padding: 0, overflow: 'hidden' }}>
               <div style={{ padding: '1.5rem', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{currentUser.role === 'admin' ? 'Общий экспорт сделок' : 'Мой экспорт сделок'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                     <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Обновлено: {lastUpdateTime}</span>
                     <button onClick={exportToExcel} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Excel</button>
                  </div>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#F9F9FB', textAlign: 'left' }}>
                      <th style={{ padding: '12px 15px' }}>ID</th>
                      <th style={{ padding: '12px 15px' }}>Клиент</th>
                      <th style={{ padding: '12px 15px' }}>Менеджер</th>
                      <th style={{ padding: '12px 15px' }}>Товар</th>
                      <th style={{ padding: '12px 15px' }}>Сумма</th>
                      <th style={{ padding: '12px 15px' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.slice(-5).reverse().map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                        <td style={{ padding: '12px 15px' }}>{l.id}</td>
                        <td style={{ padding: '12px 15px' }}>{l.name}</td>
                        <td style={{ padding: '12px 15px' }}>{managers.find(m => m.id === l.managerId)?.name}</td>
                        <td style={{ padding: '12px 15px' }}>{l.product}</td>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{(l.paymentAmount || l.finalPrice || l.productPrice || 0).toLocaleString()} ₸</td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: COLUMNS.find(c => c.id === l.status)?.color + '15', color: COLUMNS.find(c => c.id === l.status)?.color, fontWeight: 'bold', fontSize: '0.65rem' }}>{COLUMNS.find(c => c.id === l.status)?.title}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeView === 'accounting' && canUseSection('accounting') && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="glass-card" style={{ background: '#FFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}><Calculator size={20} className="gold-text" /> Бухгалтерский учет</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                      {[
                        { id: 'all', label: 'Все' },
                        { id: 'day', label: 'День' },
                        { id: 'week', label: 'Неделя' },
                        { id: 'month', label: 'Месяц' },
                        { id: 'year', label: 'Год' }
                      ].map(f => (
                        <button 
                          key={f.id} 
                          onClick={() => setAccDateFilter(f.id as any)} 
                          style={{ padding: '4px 12px', borderRadius: '8px', border: 'none', background: accDateFilter === f.id ? '#FFF' : 'transparent', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: accDateFilter === f.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <select 
                      value={accTypeFilter} 
                      onChange={e => setAccDateTypeFilter(e.target.value as any)}
                      style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #EEE', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      <option value="all">Все типы</option>
                      <option value="income">Только доходы</option>
                      <option value="expense">Только расходы</option>
                      <option value="tax">Налоги</option>
                    </select>
                    <button onClick={exportAccountingToExcel} className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSpreadsheet size={16} /> Экспорт (Excel)
                    </button>
                    <button onClick={() => setIsAddingAccEntry(true)} className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.8rem' }}><Plus size={16} /> Добавить операцию</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '15px', background: '#F0FDF4', borderRadius: '15px', border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 'bold' }}>ОБЩИЙ ДОХОД</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#166534' }}>
                      {filteredAccountingEntries.filter(e => e.type === 'income').reduce((acc, e) => acc + e.amount, 0).toLocaleString()} ₸
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#FEF2F2', borderRadius: '15px', border: '1px solid #FEE2E2' }}>
                    <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 'bold' }}>ОБЩИЙ РАСХОД</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#991B1B' }}>
                      {filteredAccountingEntries.filter(e => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0).toLocaleString()} ₸
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#FFF7ED', borderRadius: '15px', border: '1px solid #FFEDD5' }}>
                    <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 'bold' }}>НАЛОГИ (3% + НДС 12%)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#9A3412' }}>
                      {(filteredAccountingEntries.filter(e => e.type === 'income').reduce((acc, e) => acc + (e.taxDetails?.incomeTax || 0) + (e.taxDetails?.vat || 0), 0)).toLocaleString()} ₸
                    </div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '5px' }}>
                      НДС к зачету: {filteredAccountingEntries.filter(e => e.type === 'income').reduce((acc, e) => acc + (e.taxDetails?.vat || 0), 0).toLocaleString()} ₸
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#F0F9FF', borderRadius: '15px', border: '1px solid #E0F2FE' }}>
                    <div style={{ fontSize: '0.7rem', color: '#075985', fontWeight: 'bold' }}>ЧИСТАЯ ПРИБЫЛЬ</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#075985' }}>
                      {(
                        filteredAccountingEntries.filter(e => e.type === 'income').reduce((acc, e) => acc + e.amount, 0) -
                        filteredAccountingEntries.filter(e => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0) -
                        filteredAccountingEntries.filter(e => e.type === 'income').reduce((acc, e) => acc + (e.taxDetails?.incomeTax || 0) + (e.taxDetails?.vat || 0), 0)
                      ).toLocaleString()} ₸
                    </div>
                  </div>
                </div>

                {/* ── Accounting Charts ── */}
                <AccountingCharts
                  entries={accountingEntries}
                  leads={leads}
                  managers={managers}
                  getAiBody={getAiBody}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', marginTop: '1.5rem' }}>
                   <button
                     onClick={exportAccountingToExcel}
                     style={{ padding: '12px', background: '#000', color: '#FFF', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     <Download size={16} /> Экспорт P&L в Excel
                   </button>
                   <button
                     onClick={() => {
                       const income = filteredAccountingEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
                       const tax = filteredAccountingEntries.filter(e => e.type === 'income').reduce((s, e) => s + (e.taxDetails?.incomeTax || 0) + (e.taxDetails?.vat || 0), 0);
                       alert(`Налоговая декларация 910.00\n\nДоход за период: ${income.toLocaleString()} ₸\nНалог 3%: ${Math.round(income * 0.03).toLocaleString()} ₸\nНДС 12%: ${Math.round(income * 0.12).toLocaleString()} ₸\nИтого к уплате: ${tax.toLocaleString()} ₸\n\nДля подачи используйте кабинет налогоплательщика cabinet.salyk.kz`);
                     }}
                     style={{ padding: '12px', background: '#F8F9FA', color: '#1A1A1A', borderRadius: '12px', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                     <FileText size={16} /> Налоговая декларация 910.00
                   </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#F9F9FB', textAlign: 'left' }}>
                      <th style={{ padding: '12px 15px' }}>Дата</th>
                      <th style={{ padding: '12px 15px' }}>Тип</th>
                      <th style={{ padding: '12px 15px' }}>Категория</th>
                      <th style={{ padding: '12px 15px' }}>Описание</th>
                      <th style={{ padding: '12px 15px' }}>Сумма</th>
                      <th style={{ padding: '12px 15px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccountingEntries.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                        <td style={{ padding: '12px 15px', opacity: 0.6 }}>{new Date(e.timestamp).toLocaleDateString('ru-RU')}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: e.type === 'income' ? '#DCFCE7' : '#FEE2E2', color: e.type === 'income' ? '#166534' : '#991B1B', fontWeight: 'bold', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {e.type === 'income' ? 'Доход' : 'Расход'}
                            {e.isConfirmed ? <CheckCircle size={10} /> : <Clock size={10} />}
                          </span>
                        </td>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{e.category}</td>
                        <td style={{ padding: '12px 15px', opacity: 0.8 }}>
                          {e.description}
                          {e.taxDetails && (e.taxDetails.vat !== undefined || e.taxDetails.incomeTax !== undefined) && (
                            <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '4px' }}>
                              НДС: {(e.taxDetails.vat || 0).toLocaleString()} ₸ | Налог 3%: {(e.taxDetails.incomeTax || 0).toLocaleString()} ₸
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: e.type === 'income' ? '#166534' : '#991B1B' }}>
                          {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()} ₸
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {!e.isConfirmed && currentUser.role === 'admin' && (
                              <button onClick={() => confirmAccEntry(e.id)} style={{ color: '#10B981', background: '#DCFCE7', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>Подтвердить</button>
                            )}
                            <button onClick={() => deleteAccEntry(e.id)} style={{ color: '#EF4444', opacity: 0.3 }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass-card" style={{ background: '#FFF' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Логирование действий</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                  {auditLogs.map(log => (
                    <div key={log.id} style={{ padding: '10px', border: '1px solid #EEE', borderRadius: '10px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{log.managerName}</span>
                        <span style={{ opacity: 0.4, fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.65rem', color: '#666', marginBottom: '3px' }}>{log.action}</div>
                      <div style={{ opacity: 0.8 }}>{log.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'admin' && canUseSection('admin') && (
          <div className="fade-in">
            <div style={{ display: 'flex', gap: '5px', background: '#F1F3F5', padding: '4px', borderRadius: '10px', marginBottom: '1.5rem', width: 'fit-content' }}>
              {[{ id: 'warehouse', label: 'Склад / SKU' }, { id: 'analytics', label: 'Аналитика ТМЦ' }].map(t => (
                <button key={t.id} onClick={() => setAdminSubView(t.id as any)}
                  style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: adminSubView === t.id ? '#FFF' : 'transparent', fontWeight: adminSubView === t.id ? 'bold' : 'normal', fontSize: '0.8rem', cursor: 'pointer', boxShadow: adminSubView === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  {t.label}
                </button>
              ))}
            </div>
            {adminSubView === 'warehouse' && <WarehouseManager currentUserId={currentUser.id} isAdmin={currentUser.role === 'admin' || canUseSection('admin')} activeBranchId={activeBranchId} />}
            {adminSubView === 'analytics' && <InventoryAnalytics />}
          </div>
        )}

        {activeView === 'hr' && canUseSection('hr') && (
          <div className="fade-in">
            <HRManager currentUserId={currentUser.id} />
            {/* System backup */}
            {currentUser.role === 'admin' && <div className="glass-card" style={{ background: '#F8F9FA', border: '1px solid #EEE', marginTop: '2rem', maxWidth: '400px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Система и Бэкап</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button onClick={downloadBackup} disabled={isBackupLoading} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px' }}>
                  {isBackupLoading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Полный бэкап системы (.json)
                </button>
                <div style={{ borderTop: '1px solid #EEE', paddingTop: '15px' }}>
                  <p style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '10px' }}>Восстановление из файла:</p>
                  <input type="file" ref={restoreFileInputRef} hidden accept=".json" onChange={handleRestore} />
                  <button onClick={() => restoreFileInputRef.current?.click()} disabled={isRestoreLoading} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', background: '#1A1A1A' }}>
                    {isRestoreLoading ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />} Восстановить из бэкапа
                  </button>
                </div>
              </div>
            </div>}
          </div>
        )}

        {activeView === 'content_plan' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
              {/* Constructor Sidebar */}
              <div className="glass-card" style={{ background: '#FFF', alignSelf: 'start', position: 'sticky', top: '100px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={20} className="gold-text" /> Конструктор плана
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>ПЕРИОД (ДНЕЙ)</label>
                    <input type="number" className="luxury-input" value={planParams.days} onChange={e => setPlanParams({...planParams, days: parseInt(e.target.value) || 1})} min="1" max="31" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>ПОСТОВ</label>
                      <input type="number" className="luxury-input" value={planParams.posts} onChange={e => setPlanParams({...planParams, posts: parseInt(e.target.value) || 0})} min="0" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>РИЛСОВ</label>
                      <input type="number" className="luxury-input" value={planParams.reels} onChange={e => setPlanParams({...planParams, reels: parseInt(e.target.value) || 0})} min="0" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>ВСЕГО СТОРИС</label>
                    <input type="number" className="luxury-input" value={planParams.stories} onChange={e => setPlanParams({...planParams, stories: parseInt(e.target.value) || 0})} min="0" />
                  </div>

                  <button
                    onClick={generateContentPlanAction}
                    disabled={isGeneratingPlan}
                    className="btn-primary"
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {isGeneratingPlan ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isGeneratingPlan ? 'Генерация...' : 'Создать ИИ-план'}
                  </button>

                  <p style={{ fontSize: '0.65rem', opacity: 0.4, textAlign: 'center' }}>
                    План будет сформирован на основе базы знаний бренда Tomiori и актуальных трендов 2026 года.
                  </p>
                </div>
              </div>

              {/* Plan Results Area */}
              <div className="glass-card" style={{ background: '#FFF', minHeight: '600px' }}>
                {!contentPlanResult && !isGeneratingPlan && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, textAlign: 'center', padding: '4rem' }}>
                    <LayoutDashboard size={60} style={{ marginBottom: '20px' }} />
                    <h3>Ваш контент-план появится здесь</h3>
                    <p>Настройте параметры слева и нажмите кнопку генерации</p>
                  </div>
                )}

                {isGeneratingPlan && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--gold)" />
                    <h3 style={{ marginTop: '20px' }}>ИИ анализирует базу знаний...</h3>
                    <p style={{ opacity: 0.5 }}>Формируем стратегию для Tomiori</p>
                  </div>
                )}

                {contentPlanResult && (
                  <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #EEE', paddingBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{contentPlanResult.title}</h2>
                      <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Печать / PDF</button>
                    </div>

                    {(contentPlanResult.strategySummary || (Array.isArray(contentPlanResult.weeklyGoals) && contentPlanResult.weeklyGoals.length > 0)) && (
                      <div style={{ marginBottom: '1.5rem', padding: '16px', borderRadius: '14px', border: '1px solid #EEE', background: '#FAFAFA' }}>
                        {contentPlanResult.strategySummary && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', opacity: 0.5, marginBottom: '6px' }}>СТРАТЕГИЯ НЕДЕЛИ</div>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{contentPlanResult.strategySummary}</div>
                          </div>
                        )}
                        {Array.isArray(contentPlanResult.weeklyGoals) && contentPlanResult.weeklyGoals.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', opacity: 0.5, marginBottom: '6px' }}>ЦЕЛИ</div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                              {contentPlanResult.weeklyGoals.map((g: string, i: number) => <li key={i}>{g}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {contentPlanResult.days.map((day: any) => (
                        <div key={day.day} style={{ border: '1px solid #EEE', borderRadius: '20px', overflow: 'hidden' }}>
                          <div style={{ background: '#F8F9FA', padding: '12px 20px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontWeight: 'bold' }}>День {day.day}: {day.theme}</h4>
                            <span style={{ fontSize: '0.7rem', background: 'var(--gold)', color: '#000', padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold' }}>{day.content.length} позиций</span>
                          </div>
                          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {day.content.map((item: any, idx: number) => (
                              <div key={idx} style={{ padding: '15px', border: '1px solid #F1F3F5', borderRadius: '15px', background: '#FFF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <div style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    background: item.type === 'reel' ? '#FEE2E2' : item.type === 'post' ? '#E0F2FE' : '#FEF3C7',
                                    color: item.type === 'reel' ? '#991B1B' : item.type === 'post' ? '#075985' : '#92400E'
                                  }}>
                                    {item.type}
                                  </div>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.title}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '10px', lineHeight: '1.5' }}>
                                  <strong>Концепт:</strong> {item.description}
                                </div>
                                {item.visualBrief && (
                                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '10px', lineHeight: '1.5' }}>
                                    <strong>Визуал:</strong> {item.visualBrief}
                                  </div>
                                )}
                                {item.hook && (
                                  <div style={{ fontSize: '0.75rem', padding: '8px', background: '#F8F9FA', borderRadius: '8px', marginBottom: '10px' }}>
                                    <strong>Hook:</strong> {item.hook}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                  <strong>Caption:</strong> {item.caption}
                                </div>
                                {(item.cta || item.kpi || item.offerAngle) && (
                                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', opacity: 0.7 }}>
                                    {item.cta && <div><strong>CTA:</strong> {item.cta}</div>}
                                    {item.kpi && <div><strong>KPI:</strong> {item.kpi}</div>}
                                    {item.offerAngle && <div><strong>Offer:</strong> {item.offerAngle}</div>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'website_cms' && canUseSection('website_cms') && (
          <div className="fade-in">
            <WebsiteCMS />
          </div>
        )}

        {activeView === 'clients' && (
          <div className="fade-in">
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="glass-card" style={{ background: '#FFF' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}><Users size={20} className="gold-text" /> База клиентов (Loyalty 2.0)</h2>
                      <div style={{ position: 'relative' }}>
                         <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                         <input type="text" placeholder="Поиск по имени или телефону..." className="luxury-input" style={{ paddingLeft: '40px', width: '300px' }} />
                      </div>
                   </div>

                   <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                         <thead>
                            <tr style={{ background: '#F9F9FB', textAlign: 'left' }}>
                               <th style={{ padding: '15px' }}>Клиент</th>
                               <th style={{ padding: '15px' }}>Статус</th>
                               <th style={{ padding: '15px' }}>Сумма покупок</th>
                               <th style={{ padding: '15px' }}>Дата рождения</th>
                               <th style={{ padding: '15px' }}>Последний визит</th>
                            </tr>
                         </thead>
                         <tbody>
                            {(clients || []).map((c: any) => (
                               <tr key={c.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                                  <td style={{ padding: '15px' }}>
                                     <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                                     <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{c.phone}</div>
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                     <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '10px', 
                                        background: c.loyaltyStatus === 'Diamond' ? '#F0FDFA' : c.loyaltyStatus === 'Emerald' ? '#ECFDF5' : '#F8F9FA',
                                        color: c.loyaltyStatus === 'Diamond' ? '#0D9488' : c.loyaltyStatus === 'Emerald' ? '#059669' : '#666',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        width: 'fit-content'
                                     }}>
                                        {c.loyaltyStatus === 'Diamond' ? <Star size={12} /> : (c.loyaltyStatus === 'Emerald' ? <Heart size={12} /> : <User size={12} />)}
                                        {c.loyaltyStatus}
                                     </span>
                                  </td>
                                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{(c.totalSpent || 0).toLocaleString()} ₸</td>
                                  <td style={{ padding: '15px', opacity: 0.6 }}>{c.birthday || '—'}</td>
                                  <td style={{ padding: '15px', opacity: 0.6 }}>{new Date(c.updatedAt).toLocaleDateString('ru-RU')}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div className="glass-card" style={{ background: '#FFF' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <CalendarIcon size={18} className="gold-text" /> Предстоящие события
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {(anniversaries || []).map((ann: any, i: number) => (
                            <div key={i} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#FAFAFA' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{ann.name}</span>
                                  <span style={{ fontSize: '0.7rem', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '6px' }}>{ann.daysUntil} дн.</span>
                               </div>
                               <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{ann.type === 'birthday' ? 'День рождения' : 'Годовщина'}</div>
                               <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '5px' }}>{new Date(ann.date).toLocaleDateString('ru-RU')}</div>
                            </div>
                         ))}
                         {(!anniversaries || anniversaries.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.3, fontSize: '0.8rem' }}>Событий нет</div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeView === 'receipts' && (
          <div className="fade-in">
            <div className="glass-card" style={{ background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}><FileText size={20} className="gold-text" /> Реестр выданных чеков</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    <input type="text" placeholder="Поиск по чекам..." className="luxury-input" style={{ paddingLeft: '40px', width: '300px' }} />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#F9F9FB', textAlign: 'left' }}>
                      <th style={{ padding: '15px' }}>ID Чека</th>
                      <th style={{ padding: '15px' }}>Клиент</th>
                      <th style={{ padding: '15px' }}>Дата</th>
                      <th style={{ padding: '15px' }}>Сумма</th>
                      <th style={{ padding: '15px' }}>Метод</th>
                      <th style={{ padding: '15px' }}>Менеджер</th>
                      <th style={{ padding: '15px' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F8F9FA' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{r.id}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold' }}>{r.customerName}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{r.customerPhone}</div>
                        </td>
                        <td style={{ padding: '15px', opacity: 0.6 }}>{new Date(r.timestamp).toLocaleString('ru-RU')}</td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--gold)' }}>{r.totalAmount.toLocaleString()} ₸</td>
                        <td style={{ padding: '15px', textTransform: 'uppercase', fontSize: '0.7rem' }}>{r.paymentMethod}</td>
                        <td style={{ padding: '15px' }}>{r.managerName}</td>
                        <td style={{ padding: '15px' }}>
                          <button
                            onClick={() => { setSelectedReceipt(r); setIsReceiptModalOpen(true); }}
                            className="btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.7rem' }}
                          >
                            Посмотреть
                          </button>
                        </td>
                      </tr>
                    ))}
                    {receipts.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', opacity: 0.3 }}>
                          Чеки пока не выдавались
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'shop_settings' && (
          <div className="fade-in">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="glass-card" style={{ background: '#FFF', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <div style={{ background: 'rgba(225, 48, 108, 0.1)', width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#E1306C' }}>
                    <InstagramIcon size={40} />
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Instagram Shop Integration</h2>
                  <p style={{ opacity: 0.5, marginTop: '10px' }}>Синхронизация склада Tomiori с витриной Instagram и Facebook</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ padding: '20px', background: '#F8F9FA', borderRadius: '15px', border: '1px solid #EEE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Публичная витрина (Storefront)</div>
                      <span style={{ fontSize: '0.6rem', background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold' }}>АКТИВНО</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>Ваша онлайн-витрина доступна для клиентов по ссылке ниже. Заказы оттуда падают сразу в Канбан.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/shop` : '/shop'} className="luxury-input" style={{ flex: 1, background: '#FFF' }} />
                      <a href="/shop" target="_blank" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <ExternalLink size={16} /> Открыть
                      </a>
                    </div>
                  </div>

                  <div style={{ padding: '20px', background: '#F8F9FA', borderRadius: '15px', border: '1px solid #EEE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Data Feed (XML) для Instagram Shop</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6rem', color: '#666' }}>
                        <RefreshCw size={12} className="animate-spin" /> Авто-обновление каждые 60 мин
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>Используйте эту ссылку в Meta Commerce Manager (Data Sources {"->"} Scheduled Feed) для синхронизации товаров.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/api/shop/feed` : '/api/shop/feed'} className="luxury-input" style={{ flex: 1, background: '#FFF' }} />
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/shop/feed`); alert('Ссылка скопирована!'); }} className="btn-secondary">Копировать</button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #EEE', paddingTop: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem' }}>Как подключить:</h4>
                    <ol style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: '20px', lineHeight: '1.8' }}>
                      <li>Зайдите в <strong>Meta Commerce Manager</strong>.</li>
                      <li>Выберите ваш каталог и перейдите в <strong>Data Sources</strong>.</li>
                      <li>Нажмите <strong>Add Items</strong> {"->"} <strong>Data Feed</strong>.</li>
                      <li>Выберите <strong>Scheduled Feed</strong> и вставьте ссылку на XML фид выше.</li>
                      <li>Установите частоту обновления (рекомендуется ежедневно).</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="fade-in">
             <div className="glass-card" style={{ background: '#FFF', padding: '3rem', textAlign: 'center' }}>
                <TrendingUp size={60} color="var(--gold)" style={{ margin: '0 auto 20px' }} />
                <h2>Глубокая ИИ-аналитика</h2>
                <p style={{ maxWidth: '600px', margin: '0 auto 2rem', opacity: 0.6 }}>Анализ {filteredLeads.length} сделок для формирования персональных рекомендаций.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'left' }}>
                   <div style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Эффективность</h4>
                      <div style={{ fontSize: '0.8rem' }}>Средний чек: {Math.round(analytics.totalRevenue / (filteredLeads.filter(l => l.status === 'closed_won').length || 1)).toLocaleString()} ₸</div>
                      <div style={{ fontSize: '0.8rem' }}>Всего продаж: {filteredLeads.filter(l => l.status === 'closed_won').length}</div>
                   </div>
                   <div style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Популярные изделия</h4>
                      {Array.from(new Set(filteredLeads.map(l => l.product))).slice(0, 3).map((p, i) => (
                        <div key={i} style={{ fontSize: '0.8rem' }}>{i+1}. {p}</div>
                      ))}
                   </div>
                   <div style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Прогноз</h4>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10B981' }}>+12% выручки</div>
                   </div>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'left', background: '#F9F9F9', padding: '2.5rem', borderRadius: '24px', border: '1px solid #EEE', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    <Sparkles size={20} color="var(--gold)" /> {deepAiReport ? 'Полный аналитический отчет' : 'Предварительный анализ'}
                  </h3>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#333', flex: 1 }}>
                    {isGeneratingDeepReport ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <Loader2 className="spin" size={30} />
                        <p style={{ marginTop: '15px' }}>ИИ анализирует базу данных...</p>
                      </div>
                    ) : (
                      deepAiReport ? (
                        <ReactMarkdown>{deepAiReport}</ReactMarkdown>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{aiInsights}</div>
                      )
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '3rem' }}>
                  <button
                    onClick={generateDeepAiReportAction}
                    disabled={isGeneratingDeepReport}
                    className="btn-primary"
                    style={{ padding: '15px 40px', background: deepAiReport ? '#000' : 'var(--gold)' }}
                  >
                    {isGeneratingDeepReport ? <Loader2 className="spin" /> : (deepAiReport ? 'Обновить ИИ-анализ' : 'Запустить глубокий ИИ-анализ')}
                  </button>
                  <button onClick={handlePrintReport} className="btn-secondary" style={{ padding: '15px 40px', border: '1px solid #DDD' }}>
                    <Printer size={18} /> Печать отчета
                  </button>
                </div>
             </div>
          </div>
        )}

        {/* 🎁 Gift Certificates */}
        {activeView === 'certificates' && (
          <div className="fade-in">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>🎁 Подарочные сертификаты</h2>
              <GiftCertificates managerId={currentUser.id} />
            </div>
          </div>
        )}

        {/* 🔒 Layaways */}
        {activeView === 'layaways' && (
          <div className="fade-in">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>🔒 Отложки и рассрочки</h2>
              <LayawayList managerId={currentUser.id} />
            </div>
          </div>
        )}

        {/* ⏱ Work Day */}
        {activeView === 'workday' && (
          <div className="fade-in">
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>⏱ Рабочий день</h2>
                <WorkDayClock managerId={currentUser.id} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📋 Отчёт по сменам</h3>
                <WorkDayReport managerId={currentUser.id} isAdmin={currentUser.role === 'admin'} />
              </div>
              {currentUser.role === 'admin' && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>🚚 Доставки сегодня</h3>
                  <DeliveriesToday managerId={currentUser.id} />
                </div>
              )}
            </div>
          </div>
        )}
        {/* 🏗 Infrastructure */}
        {activeView === 'infrastructure' && canUseSection('infrastructure') && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>🏗 Инфраструктура</h2>
            <BranchManager currentManagerId={currentUser.id} isAdmin={currentUser.role === 'admin'} />
          </div>
        )}
      </main>

      {/* Lead Modal */}
      <AnimatePresence>
        {isAddingLead && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#FFF', width: '100%', maxWidth: '650px', borderRadius: '24px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>{editingLead ? `Редактирование лида #${editingLead.id}` : 'Новый потенциальный клиент'}</h2>
                <button onClick={() => { setIsAddingLead(false); setEditingLead(null); }} style={{ opacity: 0.5 }}><XCircle size={28} /></button>
              </div>

              <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ИМЯ КЛИЕНТА</label>
                    <input type="text" required className="luxury-input" value={leadFormData.name} onChange={e => setLeadFormData({...leadFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ТЕЛЕФОН</label>
                    <input type="tel" required className="luxury-input" value={leadFormData.phone} onChange={e => setLeadFormData({...leadFormData, phone: e.target.value})} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      {(leadFormData as any).whatsappStatus === 'manual_confirmed' && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: '#D1FAE5', color: '#065F46', fontWeight: '600' }}>✓ WhatsApp подтверждён</span>
                      )}
                      {(leadFormData as any).whatsappStatus === 'unverified' && leadFormData.source === 'whatsapp' && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: '#FEF3C7', color: '#92400E', fontWeight: '600' }}>⚠ WhatsApp не подтверждён</span>
                      )}
                      {(leadFormData as any).whatsappStatus !== 'manual_confirmed' && (
                        <button type="button" onClick={() => setLeadFormData({...leadFormData, whatsappStatus: 'manual_confirmed'} as any)}
                          style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', cursor: 'pointer' }}>
                          Подтвердить WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>КАНАЛ ПРОДАЖ</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                       {SOURCES.map(src => (
                         <button type="button" key={src.id} onClick={() => setLeadFormData({...leadFormData, source: src.id as any})} style={{ padding: '8px', borderRadius: '10px', border: '1px solid ' + (leadFormData.source === src.id ? 'var(--gold)' : '#EEE'), background: leadFormData.source === src.id ? 'rgba(212, 175, 55, 0.1)' : '#FFF', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                           {src.icon} {src.label}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>{leadFormData.source === 'instagram' ? 'INSTAGRAM АККАУНТ' : 'ОТВЕТСТВЕННЫЙ МЕНЕДЖЕР'}</label>
                    {leadFormData.source === 'instagram' ? (
                      <input type="text" className="luxury-input" placeholder="@username" value={leadFormData.instagramAccount} onChange={e => setLeadFormData({...leadFormData, instagramAccount: e.target.value})} />
                    ) : (
                      <select className="luxury-input" value={leadFormData.managerId} onChange={e => setLeadFormData({...leadFormData, managerId: e.target.value})} disabled={currentUser.role === 'sales'}>
                         {currentUser.role === 'sales' ? <option value={currentUser.id}>{currentUser.name}</option> : (
                           <>
                             <option value="">-- Выберите менеджера --</option>
                             {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                           </>
                         )}
                      </select>
                    )}
                  </div>
                </div>

                {leadFormData.source === 'instagram' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ОТВЕТСТВЕННЫЙ МЕНЕДЖЕР</label>
                    <select className="luxury-input" value={leadFormData.managerId} onChange={e => setLeadFormData({...leadFormData, managerId: e.target.value})} disabled={currentUser.role === 'sales'}>
                       {currentUser.role === 'sales' ? <option value={currentUser.id}>{currentUser.name}</option> : (
                         <>
                           <option value="">-- Выберите менеджера --</option>
                           {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </>
                       )}
                    </select>
                  </div>
                )}

                <div>
                   <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ВЫБОР ИЗДЕЛИЙ (МОЖНО НЕСКОЛЬКО)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {(leadFormData.products || []).map((p, idx) => (
                         <div key={idx} style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.name} ({p.price.toLocaleString()} ₸)
                            <button type="button" onClick={() => {
                               const newProds = [...(leadFormData.products || [])];
                               newProds.splice(idx, 1);
                               setLeadFormData({...leadFormData, products: newProds});
                            }} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><XCircle size={14} /></button>
                         </div>
                      ))}
                   </div>
                   <select className="luxury-input" value="" onChange={async e => {
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p) {
                         const newProds = [...(leadFormData.products || []), { productId: p.id, name: p.name, price: p.price }];
                         setLeadFormData({ ...leadFormData, products: newProds, productId: p.id, product: p.name });
                         // Load available units for this SKU
                         try {
                           const res = await fetch(`/api/crm/units?skuId=${p.id}&available=true`);
                           const data = await res.json();
                           if (data.success) setAvailableUnits(data.units);
                         } catch {}
                      }
                   }}>
                      <option value="">-- Добавить изделие из каталога --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.article} | {p.name} ({p.category}) - {p.price.toLocaleString()} ₸</option>)}
                   </select>

                   {/* Unit selector — appears when SKU has physical units */}
                   {availableUnits.length > 0 && (
                     <div style={{ marginTop: '8px', padding: '12px', background: '#F0F9FF', borderRadius: '10px', border: '1px solid #BAE6FD' }}>
                       <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.6 }}>КОНКРЕТНЫЙ ЭКЗЕМПЛЯР (ТМЦ)</label>
                       <select className="luxury-input" value={selectedUnitId} onChange={async e => {
                         const unitId = e.target.value;
                         setSelectedUnitId(unitId);
                         if (unitId) {
                           // Reserve for 24h
                           try {
                             await fetch(`/api/crm/units/${unitId}/reserve`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ clientId: `lead-${Date.now()}`, durationMinutes: 1440 }),
                             });
                           } catch {}
                           setLeadFormData((prev: any) => ({ ...prev, unitId }));
                         }
                       }}>
                         <option value="">— не указан (legacy режим) —</option>
                         {availableUnits.map((u: any) => {
                           const totalCarats = (u.stones || []).reduce((s: number, st: any) => s + (st.caratWeight || 0) * (st.quantity || 1), 0);
                           return (
                             <option key={u.unitId} value={u.unitId}>
                               #{u.unitId.split('-').slice(-2).join('-')} · {u.metalWeight}г · {u.purity}° {totalCarats > 0 ? `· ${totalCarats.toFixed(2)}кт` : ''} {u.shelfNumber ? `· полка ${u.shelfNumber}` : ''}
                             </option>
                           );
                         })}
                       </select>
                       {!selectedUnitId && (
                         <div style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           ⚠️ Не указан конкретный экземпляр — остаток SKU уменьшится на 1
                         </div>
                       )}
                     </div>
                   )}
                </div>

                <div style={{ background: '#F9F9FB', padding: '15px', borderRadius: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '10px', opacity: 0.5 }}>ДОПОЛНИТЕЛЬНОЕ ОФОРМЛЕНИЕ</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    {[
                      { id: 'giftWrap', label: 'Подарочная упаковка', price: 2000, icon: <Gift size={16} /> },
                      { id: 'jewelryBox', label: 'Премиум шкатулка', price: 15000, icon: <ShoppingBag size={16} /> },
                      { id: 'card', label: 'Открытка', price: 1000, icon: <MessageCircle size={16} /> }
                    ].map(opt => (
                      <button 
                        type="button" 
                        key={opt.id} 
                        onClick={() => {
                          const options = { ...(leadFormData.packagingOptions || { giftWrap: false, jewelryBox: false, card: false }) };
                          const isSelected = !options[opt.id as keyof typeof options];
                          options[opt.id as keyof typeof options] = isSelected;
                          
                          const newPackagingPrice = (leadFormData.packagingPrice || 0) + (isSelected ? opt.price : -opt.price);
                          setLeadFormData({ ...leadFormData, packagingOptions: options, packagingPrice: newPackagingPrice });
                        }}
                        style={{ 
                          padding: '12px 10px', 
                          borderRadius: '12px', 
                          border: '1px solid ' + (leadFormData.packagingOptions?.[opt.id as keyof typeof leadFormData.packagingOptions] ? 'var(--gold)' : '#EEE'),
                          background: leadFormData.packagingOptions?.[opt.id as keyof typeof leadFormData.packagingOptions] ? 'rgba(212, 175, 55, 0.1)' : '#FFF',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ color: leadFormData.packagingOptions?.[opt.id as keyof typeof leadFormData.packagingOptions] ? 'var(--gold)' : '#CCC' }}>{opt.icon}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{opt.label}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>+{opt.price.toLocaleString()} ₸</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', background: '#F9F9FB', padding: '15px', borderRadius: '15px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ЦЕНА (₸)</label>
                     <input type="number" className="luxury-input" value={leadFormData.productPrice} onChange={e => setLeadFormData({...leadFormData, productPrice: parseInt(e.target.value) || 0})} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>СКИДКА (%)</label>
                     <input type="number" className="luxury-input" value={leadFormData.discount ?? 0} onChange={e => setLeadFormData({...leadFormData, discount: parseInt(e.target.value) || 0})} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>СКИДКА (₸)</label>
                     <input type="number" className="luxury-input" value={leadFormData.discountAmount ?? 0} onChange={e => handleDiscountAmountChange(parseInt(e.target.value) || 0)} />
                   </div>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ИТОГО (₸)</label>
                     <div style={{ height: '45px', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--gold)', fontSize: '1rem' }}>{leadFormData.finalPrice?.toLocaleString()} ₸</div>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ФОРМА ПОЛУЧЕНИЯ</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <button type="button" onClick={() => setLeadFormData({...leadFormData, fulfillmentMethod: 'pickup'})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid ' + (leadFormData.fulfillmentMethod === 'pickup' ? '#000' : '#EEE'), background: leadFormData.fulfillmentMethod === 'pickup' ? '#000' : '#FFF', color: leadFormData.fulfillmentMethod === 'pickup' ? '#FFF' : '#000', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Store size={16} /> Самовывоз
                         </button>
                         <button type="button" onClick={() => setLeadFormData({...leadFormData, fulfillmentMethod: 'delivery'})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid ' + (leadFormData.fulfillmentMethod === 'delivery' ? '#3B82F6' : '#EEE'), background: leadFormData.fulfillmentMethod === 'delivery' ? '#3B82F6' : '#FFF', color: leadFormData.fulfillmentMethod === 'delivery' ? '#FFF' : '#000', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Truck size={16} /> Доставка
                         </button>
                      </div>
                   </div>
                   {leadFormData.fulfillmentMethod === 'delivery' && (
                      <div>
                         <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ДАТА И ВРЕМЯ ДОСТАВКИ</label>
                         <input type="datetime-local" className="luxury-input" value={(leadFormData as any).deliveryDateTime || ''} onChange={e => setLeadFormData({...leadFormData, deliveryDateTime: e.target.value} as any)} />
                      </div>
                   )}
                </div>

                {leadFormData.fulfillmentMethod === 'delivery' && (
                   <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>АДРЕС ДОСТАВКИ</label>
                      <div style={{ position: 'relative' }}>
                         <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', opacity: 0.3 }} />
                         <input type="text" className="luxury-input" style={{ paddingLeft: '40px' }} placeholder="Город, улица, дом, квартира..." value={leadFormData.deliveryAddress} onChange={e => setLeadFormData({...leadFormData, deliveryAddress: e.target.value})} />
                      </div>
                   </div>
                )}

                {leadFormData.fulfillmentMethod === 'delivery' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#F8F9FA', borderRadius: '12px', padding: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ИМЯ КУРЬЕРА</label>
                      <input type="text" className="luxury-input" placeholder="Иван Иванов"
                        value={(leadFormData as any).courierName || ''}
                        onChange={e => setLeadFormData({...leadFormData, courierName: e.target.value} as any)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>НОМЕР МАШИНЫ</label>
                      <input type="text" className="luxury-input" placeholder="A 123 BC"
                        value={(leadFormData as any).courierCarNumber || ''}
                        onChange={e => setLeadFormData({...leadFormData, courierCarNumber: e.target.value} as any)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>СТАТУС ДОСТАВКИ</label>
                      <select className="luxury-input"
                        value={(leadFormData as any).deliveryStatus || ''}
                        onChange={e => setLeadFormData({...leadFormData, deliveryStatus: e.target.value} as any)}>
                        <option value="">— выбрать —</option>
                        <option value="pending">⏳ Ожидает</option>
                        <option value="in_transit">🚚 В пути</option>
                        <option value="delivered">✅ Доставлено</option>
                        <option value="failed">❌ Не доставлено</option>
                        <option value="returned">↩️ Возврат</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</label>
                  <textarea className="luxury-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Особенности заказа, пожелания клиента..." value={leadFormData.additionalInfo} onChange={e => setLeadFormData({...leadFormData, additionalInfo: e.target.value})} />
                </div>

                {/* Installment Plan */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5 }}>РАССРОЧКА</label>
                    <button type="button" onClick={() => setLeadFormData({...leadFormData, isInstallment: !(leadFormData as any).isInstallment} as any)}
                      style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: '20px', border: '1px solid #E5E7EB', background: (leadFormData as any).isInstallment ? '#1A1A1A' : '#FFF', color: (leadFormData as any).isInstallment ? '#FFF' : '#1A1A1A', cursor: 'pointer' }}>
                      {(leadFormData as any).isInstallment ? 'Включена' : 'Включить'}
                    </button>
                  </div>
                  {(leadFormData as any).isInstallment && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', marginBottom: '4px' }}>СУММА</label>
                        <input type="number" className="luxury-input" placeholder="0" value={(leadFormData as any).installmentPlan?.totalAmount || ''} onChange={e => setLeadFormData({...leadFormData, installmentPlan: {...((leadFormData as any).installmentPlan || {}), totalAmount: +e.target.value, paidAmount: (leadFormData as any).installmentPlan?.paidAmount || 0, remainingAmount: +e.target.value - ((leadFormData as any).installmentPlan?.paidAmount || 0)}} as any)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', marginBottom: '4px' }}>КОЛ-ВО ПЛАТЕЖЕЙ</label>
                        <input type="number" className="luxury-input" placeholder="0" value={(leadFormData as any).installmentPlan?.installmentCount || ''} onChange={e => setLeadFormData({...leadFormData, installmentPlan: {...((leadFormData as any).installmentPlan || {}), installmentCount: +e.target.value}} as any)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ДАТА НАЧАЛА</label>
                        <input type="date" className="luxury-input" value={(leadFormData as any).installmentPlan?.startDate || ''} onChange={e => setLeadFormData({...leadFormData, installmentPlan: {...((leadFormData as any).installmentPlan || {}), startDate: e.target.value}} as any)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', marginBottom: '4px' }}>ДАТА ОКОНЧАНИЯ</label>
                        <input type="date" className="luxury-input" value={(leadFormData as any).installmentPlan?.endDate || ''} onChange={e => setLeadFormData({...leadFormData, installmentPlan: {...((leadFormData as any).installmentPlan || {}), endDate: e.target.value}} as any)} />
                      </div>
                      {(leadFormData as any).installmentPlan?.totalAmount > 0 && (
                        <div style={{ gridColumn: '1/-1', background: '#F9FAFB', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.5 }}>Оплачено:</span>
                            <span style={{ fontWeight: '600' }}>{((leadFormData as any).installmentPlan?.paidAmount || 0).toLocaleString()} ₸</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ opacity: 0.5 }}>Остаток:</span>
                            <span style={{ fontWeight: '600', color: '#EF4444' }}>{(((leadFormData as any).installmentPlan?.totalAmount || 0) - ((leadFormData as any).installmentPlan?.paidAmount || 0)).toLocaleString()} ₸</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gift Certificate */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '10px' }}>ПОДАРОЧНЫЙ СЕРТИФИКАТ</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="luxury-input" placeholder="GIFT-XXXX-XXXX" style={{ fontFamily: 'monospace', flex: 1 }}
                      value={(leadFormData as any).giftCertCode || ''}
                      onChange={e => setLeadFormData({...leadFormData, giftCertCode: e.target.value.toUpperCase()} as any)} />
                    <button type="button"
                      onClick={async () => {
                        const code = (leadFormData as any).giftCertCode;
                        if (!code) return;
                        const res = await fetch('/api/crm/gift-certificates/validate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ code, leadId: editingLead?.id }) });
                        const data = await res.json();
                        alert(data.success ? `✓ Сертификат применён: -${data.certificate?.amount?.toLocaleString()} ₸` : `✗ ${data.error}`);
                      }}
                      style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Применить
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ПОВОД</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {OCCASIONS.map(occ => (
                      <button type="button" key={occ} onClick={() => { setLeadFormData({...leadFormData, occasion: occ}); setShowCustomOccasion(false); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (leadFormData.occasion === occ ? 'var(--gold)' : '#EEE'), background: leadFormData.occasion === occ ? 'rgba(212, 175, 55, 0.1)' : '#FFF', fontSize: '0.7rem', cursor: 'pointer' }}>{occ}</button>
                    ))}
                    <button type="button" onClick={() => setShowCustomOccasion(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (showCustomOccasion ? 'var(--gold)' : '#EEE'), background: showCustomOccasion ? 'rgba(212, 175, 55, 0.1)' : '#FFF', fontSize: '0.7rem', cursor: 'pointer' }}>+ Другой</button>
                  </div>
                  {showCustomOccasion && <input type="text" className="luxury-input" style={{ marginTop: '10px' }} placeholder="Укажите повод..." value={customOccasion} onChange={e => setCustomOccasion(e.target.value)} />}
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '18px', borderRadius: '15px', fontWeight: 'bold', width: '100%', fontSize: '1rem' }}>{editingLead ? 'Сохранить изменения' : 'Создать лид'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Modals */}
      <AnimatePresence>
        {isAddingAccEntry && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ background: '#FFF', width: '450px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Добавить финансовую операцию</h3>
                <button onClick={() => setIsAddingAccEntry(false)} style={{ opacity: 0.5 }}><XCircle size={24} /></button>
              </div>
              <form onSubmit={handleAccEntryAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ТИП ОПЕРАЦИИ</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setNewAccEntry({...newAccEntry, type: 'income'})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid ' + (newAccEntry.type === 'income' ? '#10B981' : '#EEE'), background: newAccEntry.type === 'income' ? '#DCFCE7' : '#FFF', color: newAccEntry.type === 'income' ? '#166534' : '#000', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Доход</button>
                    <button type="button" onClick={() => setNewAccEntry({...newAccEntry, type: 'expense'})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid ' + (newAccEntry.type === 'expense' ? '#EF4444' : '#EEE'), background: newAccEntry.type === 'expense' ? '#FEE2E2' : '#FFF', color: newAccEntry.type === 'expense' ? '#991B1B' : '#000', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Расход</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>КАТЕГОРИЯ</label>
                  <select className="luxury-input" value={newAccEntry.category} onChange={e => setNewAccEntry({...newAccEntry, category: e.target.value})}>
                    {newAccEntry.type === 'income' ? (
                      <>
                        <option value="Продажа изделия">Продажа изделия</option>
                        <option value="Возврат">Возврат</option>
                        <option value="Прочее">Прочее</option>
                      </>
                    ) : (
                      <>
                        <option value="Закуп материала">Закуп материала</option>
                        <option value="Аренда">Аренда</option>
                        <option value="Зарплата">Зарплата</option>
                        <option value="Маркетинг">Маркетинг</option>
                        <option value="Коммунальные услуги">Коммунальные услуги</option>
                        <option value="Ремонт изделия">Ремонт изделия</option>
                        <option value="Сервис изделия">Сервис изделия</option>
                        <option value="Доставка изделия">Доставка изделия</option>
                        <option value="Прочее">Прочее</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>СУММА (₸)</label>
                  <input type="number" required className="luxury-input" value={newAccEntry.amount} onChange={e => setNewAccEntry({...newAccEntry, amount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '6px', opacity: 0.5 }}>ОПИСАНИЕ</label>
                  <textarea className="luxury-input" style={{ minHeight: '80px' }} value={newAccEntry.description} onChange={e => setNewAccEntry({...newAccEntry, description: e.target.value})} required />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '15px', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px' }}>Сохранить операцию</button>
              </form>
            </motion.div>
          </div>
        )}
        {isAddingProduct && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ background: '#FFF', width: '500px', padding: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>{editingProduct ? 'Редактировать товар' : 'Добавить товар на склад'}</h3>
                    <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ category: '', name: '', article: '', price: 0, stock: 0, imageUrl: '', description: '', shortDescription: '' }); }} style={{ opacity: 0.5 }}><XCircle size={24} /></button>
                 </div>
                 <form onSubmit={handleProductAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                       <div onClick={() => fileInputRef.current?.click()} style={{ width: '120px', height: '120px', border: '2px dashed #EEE', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#F9F9FB' }}>
                          {newProduct.imageUrl ? <img src={newProduct.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = IMAGE_FALLBACK_SRC;
                          }} /> : (
                            <>
                              <ImageIcon size={30} opacity={0.2} />
                              <span style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '5px' }}>Добавить фото</span>
                            </>
                          )}
                       </div>
                       <input type="file" ref={fileInputRef} hidden accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={handleImageUpload} />
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="text" placeholder="Артикул" className="luxury-input" value={newProduct.article} onChange={e => setNewProduct({...newProduct, article: e.target.value})} required />
                          <input type="text" placeholder="Название изделия" className="luxury-input" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>КАТЕГОРИЯ</label>
                          <select className="luxury-input" value={newProduct.category} onChange={e => {
                             if (e.target.value === 'new') {
                                setIsAddingCategory(true);
                             } else {
                                setNewProduct({...newProduct, category: e.target.value});
                             }
                          }}>
                             <option value="">-- Выбрать --</option>
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                             <option value="new">+ Новая категория</option>
                          </select>
                       </div>
                       {isAddingCategory && (
                          <div style={{ flex: 1 }}>
                             <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>НОВАЯ КАТЕГОРИЯ</label>
                             <input type="text" className="luxury-input" placeholder="Название..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onBlur={() => {
                                if (newCategoryName) {
                                   setNewProduct({...newProduct, category: newCategoryName});
                                   setIsAddingCategory(false);
                                }
                             }} />
                          </div>
                       )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>ЦЕНА (₸)</label>
                          <input type="number" className="luxury-input" value={newProduct.price === 0 ? '' : newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})} required />
                       </div>
                       <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>ОСТАТОК</label>
                          <input type="number" className="luxury-input" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} required />
                       </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>КРАТКОЕ ОПИСАНИЕ (ДЛЯ ВИТРИНЫ)</label>
                        <input type="text" className="luxury-input" placeholder="Кратко о товаре..." value={newProduct.shortDescription} onChange={e => setNewProduct({...newProduct, shortDescription: e.target.value})} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.5 }}>ПОЛНОЕ ОПИСАНИЕ (ДЛЯ КАРТОЧКИ МАГАЗИНА)</label>
                        <textarea className="luxury-input" style={{ minHeight: '80px' }} placeholder="Подробное описание изделия, материалы, камни..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                       <button type="button" onClick={() => setIsAddingProduct(false)} className="btn-secondary" style={{ flex: 1 }}>Отмена</button>
                       <button type="submit" className="btn-primary" style={{ flex: 1 }}>Сохранить на склад</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}
        {isAddingManager && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ background: '#FFF', width: '400px', padding: '2rem' }}>
                 <h3 style={{ marginBottom: '1.5rem' }}>Добавить менеджера</h3>
                 <form onSubmit={handleManagerAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="ФИО Менеджера" className="luxury-input" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} required />
                    <input type="text" placeholder="Логин" className="luxury-input" value={newManager.login} onChange={e => setNewManager({...newManager, login: e.target.value})} required />
                    <input type="password" placeholder="Пароль" className="luxury-input" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} required />
                    <select className="luxury-input" value={newManager.role} onChange={e => setNewManager({...newManager, role: e.target.value as any})}>
                       <option value="sales">Менеджер по продажам</option>
                       <option value="admin">Администратор</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <button type="button" onClick={() => setIsAddingManager(false)} className="btn-secondary" style={{ flex: 1 }}>Отмена</button>
                       <button type="submit" className="btn-primary" style={{ flex: 1 }}>Создать</button>
                    </div>
                 </form>
              </motion.div>
           </div>
        )}
        {isPaymentModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#FFF', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                  <CheckCircle size={30} color="#166534" />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Оформление продажи</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '5px' }}>Подтвердите итоговую сумму и способ оплаты</p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (pendingStatusUpdate) {
                  updateLeadStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, {
                    paymentMethod: paymentData.method,
                    paymentAmount: paymentData.amount
                  });
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.6 }}>Сумма оплаты (₸)</label>
                  <input type="number" required className="luxury-input" style={{ fontSize: '1.1rem', fontWeight: 'bold' }} value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px', opacity: 0.6 }}>Способ оплаты</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { id: 'kaspi', label: 'Kaspi', icon: <div style={{ width: '14px', height: '14px', background: '#F52D56', borderRadius: '3px', fontSize: '9px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>K</div> },
                      { id: 'card', label: 'Карта', icon: <CreditCard size={14} /> },
                      { id: 'transfer', label: 'Перевод', icon: <Wallet size={14} /> },
                      { id: 'cash', label: 'Наличные', icon: <Banknote size={14} /> }
                    ].map(method => (
                      <div key={method.id} onClick={() => setPaymentData({...paymentData, method: method.id as any})} style={{ padding: '10px', borderRadius: '10px', border: paymentData.method === method.id ? '2px solid #10B981' : '1px solid #EEE', background: paymentData.method === method.id ? '#F0FDF4' : '#FFF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        {method.icon}
                        <span style={{ fontSize: '0.8rem', fontWeight: paymentData.method === method.id ? 'bold' : 'normal' }}>{method.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Gift Certificate */}
                <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>🎁 Подарочный сертификат (необязательно)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="luxury-input"
                      placeholder="GIFT-XXXX-XXXX"
                      style={{ fontFamily: 'monospace', flex: 1, textTransform: 'uppercase' }}
                      value={(paymentData as any).certCode || ''}
                      onChange={e => setPaymentData({ ...paymentData, certCode: e.target.value.toUpperCase() } as any)}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const code = (paymentData as any).certCode;
                        if (!code) return;
                        const leadId = pendingStatusUpdate?.id;
                        const res = await fetch('/api/crm/gift-certificates/validate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ code, leadId, managerId: currentUser?.id }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          const discount = data.certificate?.amount || 0;
                          setPaymentData(p => ({ ...p, amount: Math.max(0, (p.amount || 0) - discount), certApplied: discount } as any));
                          alert(`✓ Сертификат применён: -${discount.toLocaleString()} ₸`);
                        } else {
                          alert(`✗ ${data.error}`);
                        }
                      }}
                      style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #D4AF37', background: '#FFF', color: '#B8860B', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Применить
                    </button>
                  </div>
                  {(paymentData as any).certApplied > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                      ✓ Скидка по сертификату: -{(paymentData as any).certApplied.toLocaleString()} ₸
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                   <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Отмена</button>
                   <button type="submit" className="btn-primary" style={{ flex: 2, background: '#10B981' }}>Завершить</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isReceiptModalOpen && selectedReceipt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem', overflowY: 'auto' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => setIsReceiptModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><XCircle size={32} /></button>
              </div>
              
              <div id="premium-receipt-content" style={{ background: '#FFF', padding: '3rem', borderRadius: '2px', color: '#000', fontFamily: 'serif', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                {/* Luxury Border */}
                <div style={{ position: 'absolute', inset: '10px', border: '1px solid var(--gold)', opacity: 0.3, pointerEvents: 'none' }}></div>
                
                {/* Header with Logo */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: 'none', stroke: '#1A1A1A', strokeWidth: '1.5' }}>
                        <path d="M50 10 L90 40 L50 90 L10 40 Z" />
                        <path d="M50 10 L70 40 L50 90 L30 40 Z" />
                        <path d="M10 40 L90 40" />
                        <path d="M30 40 L50 10 L70 40" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', letterSpacing: '6px', lineHeight: 1 }}>TOMIORI</div>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '3px', opacity: 0.8, textTransform: 'uppercase', marginTop: '5px' }}>HIGH JEWELRY</div>
                  </div>
                  
                  <div style={{ width: '40px', height: '1px', background: 'var(--gold)', margin: '1.5rem auto' }}></div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>ЭЛЕКТРОННЫЙ ЧЕК</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px' }}>№ {selectedReceipt.id}</div>
                </div>

                {/* Body */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.6rem' }}>Клиент</div>
                      <div style={{ fontWeight: 'bold' }}>{selectedReceipt.customerName}</div>
                      <div style={{ opacity: 0.7 }}>{selectedReceipt.customerPhone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.6rem' }}>Дата</div>
                      <div style={{ fontWeight: 'bold' }}>{new Date(selectedReceipt.timestamp).toLocaleDateString('ru-RU')}</div>
                      <div style={{ opacity: 0.7 }}>{new Date(selectedReceipt.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #EEE', borderBottom: '1px solid #EEE', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', opacity: 0.4, fontSize: '0.6rem', textTransform: 'uppercase' }}>
                          <th style={{ paddingBottom: '10px' }}>Наименование</th>
                          <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedReceipt.products || []).map((p, i) => (
                          <tr key={i}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{p.name}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>{p.price.toLocaleString()} ₸</td>
                          </tr>
                        ))}
                        {selectedReceipt.packagingPrice ? (
                          <tr>
                            <td style={{ padding: '8px 0', opacity: 0.7 }}>Упаковка и оформление</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>{selectedReceipt.packagingPrice.toLocaleString()} ₸</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>Способ оплаты</div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>{selectedReceipt.paymentMethod}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>Итого к оплате</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold)' }}>{selectedReceipt.totalAmount.toLocaleString()} ₸</div>
                    </div>
                  </div>
                </div>

                {/* Footer / QR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '2rem', borderTop: '1px dashed #DDD' }}>
                  <div style={{ maxWidth: '250px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '5px' }}>ОФИЦИАЛЬНОЕ ПОДТВЕРЖДЕНИЕ</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5, lineHeight: '1.4' }}>
                      Данный чек является цифровым подтверждением подлинности изделия Tomiori. Отсканируйте QR-код для проверки статуса гарантии и верификации в реестре.
                    </div>
                    <div style={{ marginTop: '15px', fontSize: '0.6rem' }}>
                      <strong>Адрес:</strong> г. Астана, ТРЦ "Керуен", 2 этаж<br/>
                      <strong>Менеджер:</strong> {selectedReceipt.managerName}
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: '#FFF', border: '1px solid #EEE' }}>
                    <QRCodeCanvas 
                      value={`http://localhost:3000/verify-receipt?id=${selectedReceipt.id}&code=${selectedReceipt.verificationCode}`}
                      size={80}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                <button onClick={downloadReceiptPDF} className="btn-primary" style={{ flex: 1, padding: '15px', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Download size={20} /> Скачать PDF
                </button>
                <button onClick={() => window.print()} className="btn-secondary" style={{ flex: 1, padding: '15px', color: '#FFF', borderColor: '#FFF' }}>
                  Печать
                </button>
                <button onClick={() => setIsReceiptModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '15px', color: '#FFF', borderColor: '#FFF' }}>
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Installment Modal */}
      <AnimatePresence>
        {installmentLeadId !== null && (() => {
          const lead = leads.find(l => l.id === installmentLeadId);
          if (!lead) return null;
          const total = lead.finalPrice || lead.productPrice || 0;
          const paid = lead.installmentTotal || 0;
          const remaining = Math.max(0, total - paid);
          return (
            <InstallmentModal
              lead={lead}
              total={total}
              paid={paid}
              remaining={remaining}
              onClose={() => setInstallmentLeadId(null)}
              onSave={(amt, method, note) => addInstallmentPayment(installmentLeadId, { amount: amt, method, note })}
            />
          );
        })()}
      </AnimatePresence>

      {/* Certificate modal */}
      {certificateLead && (
        <SaleCertificate
          lead={certificateLead}
          unit={allUnits.find(u => u.unitId === (certificateLead as any).unitId) || null}
          product={products.find(p => p.id === certificateLead.productId)}
          onClose={() => setCertificateLead(null)}
        />
      )}

      {/* Barcode scanner modal */}
      {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} />}

      <style>{`
        .crm-container .gold-text {
          color: #D4AF37;
          background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 50%, #D4AF37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .crm-container .fade-in {
          animation: crmFadeIn 0.4s ease-out;
        }
        @keyframes crmFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .crm-container .media-delete-btn:hover { opacity: 1 !important; }
        .crm-container .media-delete-btn { opacity: 0; transition: opacity 0.15s; }
        .crm-container div:hover > .media-delete-btn { opacity: 1; }
      `}</style>
      {/* Print-only content */}
       <div className="print-only" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', color: '#D4AF37', margin: '0 0 10px 0' }}>TOMIORI CRM - AI Sales Report</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>Дата отчета: {new Date().toLocaleString('ru-RU')}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Ответственный: {currentUser?.name} ({currentUser?.role})</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '2px solid #D4AF37', paddingBottom: '5px', marginBottom: '15px' }}>Интеллектуальный анализ</h2>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <ReactMarkdown>{deepAiReport || aiInsights}</ReactMarkdown>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '2px solid #D4AF37', paddingBottom: '5px', marginBottom: '15px' }}>Ключевые показатели</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px' }}>
              <strong>Всего лидов:</strong> {analytics.count}
            </div>
            <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px' }}>
              <strong>Общая выручка:</strong> {analytics.totalRevenue.toLocaleString()} ₸
            </div>
            <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px' }}>
              <strong>Потенциал:</strong> {analytics.potentialRevenue.toLocaleString()} ₸
            </div>
            <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px' }}>
              <strong>Конверсия:</strong> {analytics.conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '18px', borderBottom: '2px solid #D4AF37', paddingBottom: '5px', marginBottom: '15px' }}>Последние сделки</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F4F4F4' }}>
                <th style={{ padding: '10px', border: '1px solid #DDD', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #DDD', textAlign: 'left' }}>Клиент</th>
                <th style={{ padding: '10px', border: '1px solid #DDD', textAlign: 'left' }}>Изделие</th>
                <th style={{ padding: '10px', border: '1px solid #DDD', textAlign: 'left' }}>Сумма</th>
                <th style={{ padding: '10px', border: '1px solid #DDD', textAlign: 'left' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.slice(-15).reverse().map(l => (
                <tr key={l.id}>
                  <td style={{ padding: '10px', border: '1px solid #DDD' }}>{l.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #DDD' }}>{l.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #DDD' }}>{l.product}</td>
                  <td style={{ padding: '10px', border: '1px solid #DDD' }}>{(l.paymentAmount || l.finalPrice || l.productPrice || 0).toLocaleString()} ₸</td>
                  <td style={{ padding: '10px', border: '1px solid #DDD' }}>{COLUMNS.find(c => c.id === l.status)?.title || l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
