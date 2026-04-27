import fs from 'fs';
import { NEWS_PATH } from '../constants';

export function getNews() {
  if (!fs.existsSync(NEWS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

export function saveNews(news: any[]) {
  try {
    fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save news:', e);
  }
}
