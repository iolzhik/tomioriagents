import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

// --- Categories (Still JSON for CMS flexibility) ---
const CATEGORIES_PATH = path.join(process.cwd(), 'knowledge/crm_categories.json');
const DEFAULT_CATEGORIES = ['Подвески', 'Колье', 'Браслеты'];

const CORE_PRODUCT_FIELDS = [
  'name', 'category', 'article', 'price', 'stock',
  'imageUrl', 'description', 'shortDescription',
] as const;

const EXTENDED_PRODUCT_FIELDS = [
  'origin',
  'caratWeight',
  'color',
  'diamondCount',
  'clarity',
  'purity',
  'discountAllowed',
  'costPrice',
  'customsDuty',
  'logisticsCosts',
  'totalCostPrice',
  'markupPercentage',
  'managerCommissionPercent',
  'images',
] as const;

const ALL_PRODUCT_FIELDS = [...CORE_PRODUCT_FIELDS, ...EXTENDED_PRODUCT_FIELDS] as const;

export async function getCategories() {
  let manualCats: any[] = [];
  if (fs.existsSync(CATEGORIES_PATH)) {
    try { manualCats = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8')); } catch { manualCats = []; }
  }

  let uniqueWarehouseCats: string[] = [];
  try {
    const warehouseProducts = await getProducts();
    uniqueWarehouseCats = Array.from(new Set(warehouseProducts.map((p: any) => p.category))).filter(Boolean);
  } catch {
    uniqueWarehouseCats = [];
  }

  const merged = [...manualCats];
  DEFAULT_CATEGORIES.forEach((catName) => {
    if (!merged.find(c => c.name === catName)) {
      merged.push({ id: 'default-' + catName, name: catName, isWarehouse: true, image: '', sort: 90 });
    }
  });
  uniqueWarehouseCats.forEach(catName => {
    if (!merged.find(c => c.name === catName)) {
      merged.push({ id: 'wh-' + catName, name: catName, isWarehouse: true, image: '', sort: 100 });
    }
  });

  return merged;
}

export async function saveCategories(categories: any[]) {
  const manualOnly = categories.filter(c => !c.isWarehouse);
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(manualOnly, null, 2), 'utf8');
}

// --- Products (all data in Prisma, no /tmp overlay) ---

export async function getProducts(category?: string) {
  const products = await prisma.product.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return products;
}

export async function createProduct(data: any) {
  const created = await prisma.product.create({
    data: {
      name: data.name,
      category: data.category,
      article: data.article?.trim() || `ART-${Date.now()}`,
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      imageUrl: data.imageUrl || null,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      // Extended fields
      origin: data.origin ?? null,
      caratWeight: data.caratWeight != null ? Number(data.caratWeight) : null,
      color: data.color ?? null,
      diamondCount: data.diamondCount != null ? Number(data.diamondCount) : null,
      clarity: data.clarity ?? null,
      purity: data.purity ?? null,
      discountAllowed: data.discountAllowed ?? null,
      costPrice: data.costPrice != null ? Number(data.costPrice) : null,
      customsDuty: data.customsDuty != null ? Number(data.customsDuty) : null,
      logisticsCosts: data.logisticsCosts != null ? Number(data.logisticsCosts) : null,
      totalCostPrice: data.totalCostPrice != null ? Number(data.totalCostPrice) : null,
      markupPercentage: data.markupPercentage != null ? Number(data.markupPercentage) : null,
      managerCommissionPercent: data.managerCommissionPercent != null ? Number(data.managerCommissionPercent) : null,
      images: Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images ?? '[]'),
    },
  });
  return { ...created, images: parseImages(created.images) };
}

export async function updateProduct(id: string, data: any) {
  const updateData: Record<string, any> = {};

  for (const f of CORE_PRODUCT_FIELDS) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }

  // Extended fields
  if (data.origin !== undefined) updateData.origin = data.origin;
  if (data.caratWeight !== undefined) updateData.caratWeight = data.caratWeight != null ? Number(data.caratWeight) : null;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.diamondCount !== undefined) updateData.diamondCount = data.diamondCount != null ? Number(data.diamondCount) : null;
  if (data.clarity !== undefined) updateData.clarity = data.clarity;
  if (data.purity !== undefined) updateData.purity = data.purity;
  if (data.discountAllowed !== undefined) updateData.discountAllowed = data.discountAllowed;
  if (data.costPrice !== undefined) updateData.costPrice = data.costPrice != null ? Number(data.costPrice) : null;
  if (data.customsDuty !== undefined) updateData.customsDuty = data.customsDuty != null ? Number(data.customsDuty) : null;
  if (data.logisticsCosts !== undefined) updateData.logisticsCosts = data.logisticsCosts != null ? Number(data.logisticsCosts) : null;
  if (data.totalCostPrice !== undefined) updateData.totalCostPrice = data.totalCostPrice != null ? Number(data.totalCostPrice) : null;
  if (data.markupPercentage !== undefined) updateData.markupPercentage = data.markupPercentage != null ? Number(data.markupPercentage) : null;
  if (data.managerCommissionPercent !== undefined) updateData.managerCommissionPercent = data.managerCommissionPercent != null ? Number(data.managerCommissionPercent) : null;
  if (data.images !== undefined) updateData.images = Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images ?? '[]');

  if (Object.keys(updateData).length === 0) {
    const existing = await prisma.product.findUnique({ where: { id } });
    return existing ? { ...existing, images: parseImages(existing.images) } : null;
  }

  const updated = await prisma.product.update({ where: { id }, data: updateData });
  return { ...updated, images: parseImages(updated.images) };
}

export async function deleteProduct(id: string) {
  return await prisma.product.delete({ where: { id } });
}

function parseImages(images: string | null | undefined): any[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}
