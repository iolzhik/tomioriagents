import fs from 'fs';
import path from 'path';
import { Warehouse, JewelryUnit, WarehouseAuditEntry } from '../types';

const WAREHOUSES_PATH = path.join(process.cwd(), 'knowledge', 'crm_warehouses.json');

function readWarehouses(): Warehouse[] {
  if (!fs.existsSync(WAREHOUSES_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(WAREHOUSES_PATH, 'utf8')); } catch { return []; }
}

function writeWarehouses(warehouses: Warehouse[]): void {
  const dir = path.dirname(WAREHOUSES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WAREHOUSES_PATH, JSON.stringify(warehouses, null, 2), 'utf8');
}

export function listWarehouses(): Warehouse[] {
  return readWarehouses();
}

export function saveWarehouse(warehouse: Warehouse): Warehouse {
  const warehouses = readWarehouses();
  const idx = warehouses.findIndex(w => w.warehouseId === warehouse.warehouseId);
  if (idx !== -1) {
    warehouses[idx] = warehouse;
  } else {
    warehouses.push(warehouse);
  }
  writeWarehouses(warehouses);
  return warehouse;
}

export function deactivateWarehouse(id: string): Warehouse {
  const warehouses = readWarehouses();
  const idx = warehouses.findIndex(w => w.warehouseId === id);
  if (idx === -1) throw new Error('Warehouse not found');
  const updated: Warehouse = { ...warehouses[idx], isActive: false };
  warehouses[idx] = updated;
  writeWarehouses(warehouses);
  return updated;
}

export function getWarehouseStock(warehouseId: string, units: JewelryUnit[]): JewelryUnit[] {
  return units.filter(u => u.currentLocation?.warehouseId === warehouseId);
}

export function getWarehouseSummary(
  units: JewelryUnit[]
): { warehouseId: string; totalUnits: number; totalValue: number; byStatus: Record<string, number> }[] {
  const map = new Map<string, { totalUnits: number; totalValue: number; byStatus: Record<string, number> }>();

  for (const unit of units) {
    const warehouseId = unit.currentLocation?.warehouseId;
    if (!warehouseId) continue;

    if (!map.has(warehouseId)) {
      map.set(warehouseId, { totalUnits: 0, totalValue: 0, byStatus: {} });
    }

    const entry = map.get(warehouseId)!;
    entry.totalUnits += 1;
    entry.totalValue += unit.price ?? 0;
    entry.byStatus[unit.locationStatus] = (entry.byStatus[unit.locationStatus] ?? 0) + 1;
  }

  return Array.from(map.entries()).map(([warehouseId, data]) => ({ warehouseId, ...data }));
}

export function recordAudit(unit: JewelryUnit, auditEntry: WarehouseAuditEntry): JewelryUnit {
  return { ...unit, lastAudit: auditEntry };
}
