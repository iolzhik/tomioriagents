import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

// --- Categories ---
const CATEGORIES_PATH = path.join(process.cwd(), 'knowledge/crm_categories.json');
const DEFAULT_CATEGORIES = ['Подвески', 'Колье', 'Браслеты'];

export async function getCategories() {
  let manualCats: any[] = [];
  if (fs.existsSync(CATEGORIES_PATH)) {
    try { manualCats = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8')); } catch { manualCats = []; }
  }

  let uniqueWarehouseCats: string[] = [];
  try {
    const products = await getProducts();
    uniqueWarehouseCats = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[];
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

// --- Products (Neon PostgreSQL via Prisma) ---

export async function getProducts(category?: string) {
  const products = await prisma.product.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return products.map(p => ({
    ...p,
    images: parseJson(p.images, []),
  }));
}

export async function createProduct(data: any) {
  const created = await prisma.product.create({
    data: {
      name:             data.name,
      category:         data.category,
      article:          data.article?.trim() || `ART-${Date.now()}`,
      price:            Number(data.price) || 0,
      stock:            Number(data.stock) || 0,
      imageUrl:         data.imageUrl   || null,
      description:      data.description || null,
      shortDescription: data.shortDescription || null,
      origin:           data.origin     || null,
      caratWeight:      data.caratWeight     != null ? Number(data.caratWeight)     : null,
      color:            data.color      || null,
      diamondCount:     data.diamondCount    != null ? Number(data.diamondCount)    : null,
      clarity:          data.clarity    || null,
      purity:           data.purity     || null,
      discountAllowed:  data.discountAllowed != null ? Number(data.discountAllowed) : null,
      costPrice:        data.costPrice       != null ? Number(data.costPrice)       : null,
      customsDuty:      data.customsDuty     != null ? Number(data.customsDuty)     : null,
      logisticsCosts:   data.logisticsCosts  != null ? Number(data.logisticsCosts)  : null,
      totalCostPrice:   data.totalCostPrice  != null ? Number(data.totalCostPrice)  : null,
      markupPercentage: data.markupPercentage != null ? Number(data.markupPercentage) : null,
      managerCommissionPercent: data.managerCommissionPercent != null ? Number(data.managerCommissionPercent) : null,
      images:           Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images ?? '[]'),
    },
  });
  return { ...created, images: parseJson(created.images, []) };
}

export async function updateProduct(id: string, data: any) {
  const updateData: Record<string, any> = {};

  const fields: Record<string, 'string' | 'number' | 'json'> = {
    name: 'string', category: 'string', article: 'string',
    imageUrl: 'string', description: 'string', shortDescription: 'string',
    origin: 'string', color: 'string', clarity: 'string', purity: 'string',
    price: 'number', stock: 'number', caratWeight: 'number', diamondCount: 'number',
    discountAllowed: 'number', costPrice: 'number', customsDuty: 'number',
    logisticsCosts: 'number', totalCostPrice: 'number', markupPercentage: 'number',
    managerCommissionPercent: 'number',
    images: 'json',
  };

  for (const [key, type] of Object.entries(fields)) {
    if (data[key] === undefined) continue;
    if (type === 'number') updateData[key] = data[key] != null ? Number(data[key]) : null;
    else if (type === 'json') updateData[key] = Array.isArray(data[key]) ? JSON.stringify(data[key]) : (data[key] ?? '[]');
    else updateData[key] = data[key];
  }

  if (Object.keys(updateData).length === 0) {
    const existing = await prisma.product.findUnique({ where: { id } });
    return existing ? { ...existing, images: parseJson(existing.images, []) } : null;
  }

  const updated = await prisma.product.update({ where: { id }, data: updateData });
  return { ...updated, images: parseJson(updated.images, []) };
}

export async function deleteProduct(id: string) {
  return await prisma.product.delete({ where: { id } });
}

function parseJson(value: string | null | undefined, fallback: any) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
