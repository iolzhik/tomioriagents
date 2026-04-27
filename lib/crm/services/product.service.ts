import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

// --- Categories (Still JSON for CMS flexibility) ---
const CATEGORIES_PATH = path.join(process.cwd(), 'knowledge/crm_categories.json');
const DEFAULT_CATEGORIES = ['Подвески', 'Колье', 'Браслеты'];

// Overlay stored in /tmp (writable on Vercel), base products from knowledge JSON + Prisma
const PRODUCTS_OVERLAY_PATH = '/tmp/tomiori_products_overlay.json';
const PRODUCTS_JSON_PATH = path.join(process.cwd(), 'knowledge/crm_products.json');

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

type ProductOverlay = {
  created: any[];
  updated: Record<string, Record<string, any>>;
  deleted: string[];
};

function emptyOverlay(): ProductOverlay {
  return { created: [], updated: {}, deleted: [] };
}

function readOverlay(): ProductOverlay {
  try {
    if (!fs.existsSync(PRODUCTS_OVERLAY_PATH)) return emptyOverlay();
    const raw = fs.readFileSync(PRODUCTS_OVERLAY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      created: Array.isArray(parsed?.created) ? parsed.created : [],
      updated: parsed?.updated && typeof parsed.updated === 'object' ? parsed.updated : {},
      deleted: Array.isArray(parsed?.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(data: ProductOverlay) {
  try {
    fs.writeFileSync(PRODUCTS_OVERLAY_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // /tmp not writable in some environments — silently ignore
  }
}

function readBaseProductsFromJson(): any[] {
  try {
    if (!fs.existsSync(PRODUCTS_JSON_PATH)) return [];
    return JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function applyOverlay(baseProducts: any[]): any[] {
  const overlay = readOverlay();
  const baseById = new Map<string, any>();
  for (const p of baseProducts) baseById.set(String(p.id), { ...p });

  for (const id of overlay.deleted) baseById.delete(String(id));

  for (const [id, patch] of Object.entries(overlay.updated)) {
    if (baseById.has(id)) {
      baseById.set(id, { ...baseById.get(id), ...patch });
    }
  }

  const created = overlay.created
    .filter(p => !overlay.deleted.includes(String(p.id)))
    .map(p => ({ ...p, ...(overlay.updated[String(p.id)] || {}) }));

  return [...Array.from(baseById.values()), ...created];
}

function isReadonlyError(err: any): boolean {
  const msg = String(err?.message || '');
  return /readonly database|attempt to write a readonly database|no such table|does not exist|unable to open database file|database is locked/i.test(msg);
}

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

// --- Products ---

export async function getProducts(category?: string) {
  let baseProducts: any[] = [];
  try {
    baseProducts = await prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Prisma unavailable (readonly DB on Vercel) — fall back to JSON
    baseProducts = readBaseProductsFromJson();
  }

  const merged = applyOverlay(baseProducts);
  if (!category) return merged;
  return merged.filter((p: any) => p.category === category);
}

export async function createProduct(data: any) {
  const extendedData: Record<string, any> = {};
  for (const f of EXTENDED_PRODUCT_FIELDS) {
    if (data[f] !== undefined) extendedData[f] = data[f];
  }

  const coreData = {
    name: data.name,
    category: data.category,
    article: data.article?.trim() || `ART-${Date.now()}`,
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    imageUrl: data.imageUrl || null,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
  };

  try {
    const created = await prisma.product.create({ data: coreData });
    // Store extended fields in overlay since they may not be in DB schema on Vercel
    if (Object.keys(extendedData).length > 0) {
      const overlay = readOverlay();
      const sid = String(created.id);
      overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...extendedData };
      writeOverlay(overlay);
    }
    return { ...created, ...extendedData };
  } catch (err) {
    if (!isReadonlyError(err)) throw err;
    // Readonly DB (Vercel) — store entirely in overlay
    const overlay = readOverlay();
    const product = {
      id: `p${Date.now()}`,
      ...coreData,
      ...extendedData,
      createdAt: new Date().toISOString(),
    };
    overlay.created.push(product);
    overlay.deleted = overlay.deleted.filter(id => id !== String(product.id));
    writeOverlay(overlay);
    return product;
  }
}

export async function updateProduct(id: string, data: any) {
  const allowedCore: Record<string, any> = {};
  for (const f of CORE_PRODUCT_FIELDS) {
    if (data[f] !== undefined) allowedCore[f] = data[f];
  }
  const allowedExtended: Record<string, any> = {};
  for (const f of EXTENDED_PRODUCT_FIELDS) {
    if (data[f] !== undefined) allowedExtended[f] = data[f];
  }
  const fullAllowed = { ...allowedCore, ...allowedExtended };

  // Check if this is an overlay-only product (id starts with 'p' + timestamp)
  const overlay = readOverlay();
  const sid = String(id);
  const createdIdx = overlay.created.findIndex(p => String(p.id) === sid);
  if (createdIdx !== -1) {
    overlay.created[createdIdx] = { ...overlay.created[createdIdx], ...fullAllowed };
    writeOverlay(overlay);
    return overlay.created[createdIdx];
  }

  if (Object.keys(allowedCore).length === 0) {
    overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...fullAllowed };
    writeOverlay(overlay);
    const current = (await getProducts()).find((p: any) => String(p.id) === sid) || { id: sid };
    return { ...current, ...fullAllowed };
  }

  try {
    const updated = await prisma.product.update({ where: { id }, data: allowedCore });
    if (Object.keys(allowedExtended).length > 0) {
      overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...allowedExtended };
      writeOverlay(overlay);
    }
    return { ...updated, ...allowedExtended };
  } catch (err) {
    if (!isReadonlyError(err)) throw err;
    overlay.updated[sid] = { ...(overlay.updated[sid] || {}), ...fullAllowed };
    writeOverlay(overlay);
    return { id: sid, ...fullAllowed };
  }
}

export async function deleteProduct(id: string) {
  try {
    return await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (!isReadonlyError(err)) throw err;
    const overlay = readOverlay();
    const sid = String(id);
    overlay.created = overlay.created.filter(p => String(p.id) !== sid);
    delete overlay.updated[sid];
    if (!overlay.deleted.includes(sid)) overlay.deleted.push(sid);
    writeOverlay(overlay);
    return { id: sid };
  }
}

function parseImages(images: string | null | undefined): any[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}
