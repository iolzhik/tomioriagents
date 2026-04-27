export interface ManagerPermissions {
  kanban: boolean;
  creative: boolean;
  accounting: boolean;
  warehouse: boolean;
  analytics: boolean;
  receipts: boolean;
  shop: boolean;
  website_cms: boolean;
  hr: boolean;
}

export interface SalaryPayment {
  id: string;
  managerId: string;
  type: 'advance' | 'salary' | 'bonus' | 'sick_leave' | 'vacation' | 'penalty';
  amount: number;
  description: string;
  date: string;
  createdBy: string;
}

export interface SalaryPlan {
  managerId: string;
  type: 'fixed_bonus' | 'bonus_only';
  fixedSalary: number;
  bonusPercent: number;
  monthlyPlan: number;
  planBonusPercent: number;
}

export interface Manager {
  id: string;
  name: string;
  login: string;
  password?: string;
  role: string; // 'admin' | 'sales' | 'accountant'
  permissions?: string; // JSON string in DB
  salaryPlan?: SalaryPlan;
  phone?: string;
  hireDate?: string;
  branchId?: string; // assigned branch
}

export interface AuditLog {
  id: string;
  timestamp: string;
  managerId: string;
  managerName: string;
  action: string;
  details: string;
  targetId?: string;
}

export interface AccountingEntry {
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

export interface Product {
  id: string;
  category: string;
  name: string;
  article: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  shortDescription?: string;
  origin?: string;
  caratWeight?: number;
  color?: string;
  diamondCount?: number;
  clarity?: string;
  purity?: string;
  discountAllowed?: number;
  costPrice?: number;
  customsDuty?: number;
  logisticsCosts?: number;
  totalCostPrice?: number;
  markupPercentage?: number;
  managerCommissionPercent?: number;
  unitCount?: number;
  images?: string[];
}

export interface LeadProduct {
  productId: string;
  name: string;
  price: number;
}

export interface InstallmentPayment {
  id: string;
  amount: number;
  date: string;
  method: 'card' | 'cash' | 'transfer' | 'kaspi';
  note?: string;
}

export type WhatsAppStatus = 'unverified' | 'verified' | 'manual_confirmed';

export interface CommunicationLogEntry {
  id: string;
  type: 'answered' | 'ignored' | 'followup';
  timestamp: string;
  managerId: string;
  note?: string;
}

export interface InstallmentPlan {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  startDate: string;
  endDate: string;
  payments: InstallmentPayment[];
  status?: 'active' | 'paid_in_full';
}

export interface Lead {
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
  isInstallment?: boolean;
  installments?: InstallmentPayment[];
  installmentTotal?: number;
  deliveryDateTime?: string;
  communicationLog?: CommunicationLogEntry[];
  whatsappStatus?: WhatsAppStatus;
  whatsappConfirmedAt?: string;
  whatsappConfirmedBy?: string;
  installmentPlan?: InstallmentPlan;
  appliedCertificateId?: string;
  courierName?: string;
  courierCarNumber?: string;
  deliveryStatus?: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  branchId?: string;
}

export interface Receipt {
  id: string;
  leadId: number;
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

export type LocationStatus =
  | 'showcase'
  | 'cleaning'
  | 'photoshoot'
  | 'reserved'
  | 'gemology'
  | 'service'
  | 'sold'
  | 'archived';

export interface LocationHistoryEntry {
  from: LocationStatus;
  to: LocationStatus;
  timestamp: string;
  managerId: string;
  note?: string;
}

export type StoneType = 'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'other';
export type SettingType = 'prong' | 'bezel' | 'pave' | 'channel' | 'other';
export type StoneOrigin = 'natural' | 'lab_grown';
export type StoneMethod = 'lg' | 'cvd';

export interface StoneRow {
  id: string;
  stoneType: StoneType;
  shape?: string;
  sieve?: string;
  clarityGIA?: string;
  colorGIA?: string;
  clarityGOST?: string;
  caratWeight?: number;
  settingType?: SettingType;
  quantity?: number;
  visibleOnShop: boolean;
  stoneOrigin?: StoneOrigin;
  stoneMethod?: StoneMethod;
}

export interface PriceHistoryEntry {
  id: string;
  timestamp: string;
  price: number;
  costPrice: number;
  customsDuty: number;
  logisticsCosts: number;
  totalCostPrice: number;
  changedBy: string;
  reason: string;
}

export interface ShopVisibility {
  showWeight: boolean;
  showStones: boolean;
  showOrigin: boolean;
  showCertificate: boolean;
  showPurity: boolean;
}

export interface UnitLocation {
  branchId?: string;
  warehouseId?: string;
  holderId?: string;
  holderName?: string;
  receivedAt?: string;
  note?: string;
}

export interface LocationTrackingEntry {
  previousLocation: UnitLocation;
  newLocation: UnitLocation;
  timestamp: string;
  changedBy: string;
  changeReason: string;
}

export interface WarehouseAuditEntry {
  auditedAt: string;
  auditedBy: string;
  warehouseId: string;
}

export interface JewelryUnit {
  unitId: string;
  skuId: string;
  metalWeight: number;
  totalWeight: number;
  purity: string;
  purchaseDate: string;
  locationStatus: LocationStatus;
  locationHistory: LocationHistoryEntry[];
  shelfNumber?: string;
  masterName?: string;
  gemologyOrg?: string;
  reserveClientId?: string;
  reserveExpiresAt?: string;
  soldLeadId?: string;
  archiveReason?: string;
  stones: StoneRow[];
  price: number;
  costPrice: number;
  customsDuty: number;
  logisticsCosts: number;
  totalCostPrice: number;
  priceHistory: PriceHistoryEntry[];
  shopVisibility: ShopVisibility;
  origin?: string;
  certificateNumber?: string;
  metalColor?: 'white_gold' | 'yellow_gold' | 'rose_gold' | 'silver' | 'platinum';
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  currentLocation?: UnitLocation;
  locationTracking?: LocationTrackingEntry[];
  lastAudit?: WarehouseAuditEntry;
}

// --- New entity types ---

export interface Branch {
  branchId: string;
  name: string;
  city: string;
  address: string;
}

export interface Warehouse {
  warehouseId: string;
  name: string;
  branchId: string;
  address: string;
  managerId: string;
  isActive: boolean;
}

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Transfer {
  transferId: string;
  unitId: string;
  fromLocation: UnitLocation;
  toLocation: UnitLocation;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: TransferStatus;
  rejectionReason?: string;
}

export type CertificateStatus = 'active' | 'used' | 'expired';

export interface GiftCertificate {
  certificateId: string;
  code: string;
  amount: number;
  issuedAt: string;
  issuedBy: string;
  status: CertificateStatus;
  expiresAt: string;
  usedInLeadId?: string;
}

export type LayawayStatus = 'active' | 'overdue' | 'redeemed' | 'cancelled';

export interface LayawayPayment {
  id: string;
  amount: number;
  date: string;
  method: 'card' | 'cash' | 'transfer' | 'kaspi';
  note?: string;
}

export interface Layaway {
  layawayId: string;
  unitId: string;
  leadId: string;
  clientName: string;
  clientPhone: string;
  depositAmount: number;
  totalPrice: number;
  remainingAmount: number;
  reservedAt: string;
  dueDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  status: LayawayStatus;
  payments: LayawayPayment[];
  notes?: string;
}

export type WorkDayStatus = 'open' | 'closed';

export interface WorkDay {
  workDayId: string;
  managerId: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  status: WorkDayStatus;
  notes?: string;
}
