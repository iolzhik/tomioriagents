import fs from 'fs';
import path from 'path';
import { JewelryUnit, UnitLocation, LocationTrackingEntry, Branch } from '../types';

const BRANCHES_PATH = path.join(process.cwd(), 'knowledge', 'crm_branches.json');

function readBranches(): Branch[] {
  if (!fs.existsSync(BRANCHES_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(BRANCHES_PATH, 'utf8')); } catch { return []; }
}

function writeBranches(branches: Branch[]): void {
  const dir = path.dirname(BRANCHES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BRANCHES_PATH, JSON.stringify(branches, null, 2), 'utf8');
}

export function updateUnitLocation(
  unit: JewelryUnit,
  newLocation: UnitLocation,
  changedBy: string,
  reason: string
): JewelryUnit {
  const entry: LocationTrackingEntry = {
    previousLocation: unit.currentLocation ?? {},
    newLocation,
    timestamp: new Date().toISOString(),
    changedBy,
    changeReason: reason,
  };

  return {
    ...unit,
    currentLocation: newLocation,
    locationTracking: [...(unit.locationTracking ?? []), entry],
    updatedAt: new Date().toISOString(),
    updatedBy: changedBy,
  };
}

export function getBranchDirectory(): Branch[] {
  return readBranches();
}

export function saveBranch(branch: Branch): Branch {
  const branches = readBranches();
  const idx = branches.findIndex(b => b.branchId === branch.branchId);
  if (idx !== -1) {
    branches[idx] = branch;
  } else {
    branches.push(branch);
  }
  writeBranches(branches);
  return branch;
}

export function deleteBranch(id: string): void {
  const branches = readBranches().filter(b => b.branchId !== id);
  writeBranches(branches);
}
