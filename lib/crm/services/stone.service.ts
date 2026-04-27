import type { StoneRow } from '../types';

/**
 * Validates a StoneRow against stone origin/method constraints:
 * - natural origin → stoneMethod must be null/undefined
 * - lab_grown origin → stoneMethod must be 'lg' or 'cvd'
 * - no origin (undefined/null) → no constraint, always valid
 */
export function validateStoneRow(row: StoneRow): boolean {
  if (row.stoneOrigin === 'natural') {
    return row.stoneMethod == null;
  }
  if (row.stoneOrigin === 'lab_grown') {
    return row.stoneMethod === 'lg' || row.stoneMethod === 'cvd';
  }
  // undefined/null origin — no constraint
  return true;
}
