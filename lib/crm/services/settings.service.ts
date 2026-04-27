import fs from 'fs';
import { SETTINGS_PATH } from '../constants';

export function getGlobalSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) return { currency: 'KZT', language: 'ru', vatRate: 0.12 };
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch (e) {
    return { currency: 'KZT', language: 'ru', vatRate: 0.12 };
  }
}

export function saveGlobalSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save global settings:', e);
  }
}
