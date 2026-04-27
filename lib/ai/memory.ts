import fs from 'fs';
import path from 'path';
import { AIConfig } from './config';

export function getMemoryBank(type: 'brand' | 'ads' = 'brand', config?: AIConfig) {
  try {
    const isFree = config?.model?.includes('free') || config?.provider === 'openrouter';
    const limit = isFree ? 4000 : 8000;
    const fileName = type === 'brand' ? 'tomiori_memory.md' : 'meta_ads_guide.md';
    const memoryPath = path.join(process.cwd(), 'knowledge', fileName);
    if (fs.existsSync(memoryPath)) {
      return fs.readFileSync(memoryPath, 'utf8').substring(0, limit);
    }
  } catch (e) {}
  return type === 'brand' 
    ? "Brand: Tomiori, location: г.Астана, ТРЦ \"Керуен\", 2 этаж, Instagram: @tomiori_official"
    : "Meta Ads Best Practices: Use Sales Objective, High-income targeting, GIA certifications.";
}
