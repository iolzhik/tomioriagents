import fs from 'fs';
import path from 'path';
import { SHOP_DATA_DIR, MEMORY_PATH } from '../constants';
import { Product } from '../types';

export function syncDataToShopStandalone(type: 'settings' | 'categories' | 'news' | 'products', data: any) {
  const fileName = type === 'settings' ? 'settings.json' : (type === 'categories' ? 'categories.json' : (type === 'news' ? 'news.json' : 'products.json'));
  const shopPath = path.join(SHOP_DATA_DIR, fileName);
  try {
    if (!fs.existsSync(SHOP_DATA_DIR)) fs.mkdirSync(SHOP_DATA_DIR, { recursive: true });
    fs.writeFileSync(shopPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Failed to sync ${type} to shop-standalone:`, e);
  }
}

export function syncProductsToMemory(products: Product[]) {
  if (!fs.existsSync(MEMORY_PATH)) return;

  let memory = fs.readFileSync(MEMORY_PATH, 'utf8');
  const sectionHeader = '## 📦 Current Inventory (Live)';
  
  const inventoryList = products.map(p => {
    const extras = [
      p.origin ? `Происхождение: ${p.origin}` : '',
      p.caratWeight ? `${p.caratWeight} кт` : '',
      p.purity ? `Проба ${p.purity}` : '',
      p.clarity ? `Чистота ${p.clarity}` : '',
      p.color ? `Цвет: ${p.color}` : '',
    ].filter(Boolean).join(' | ');
    return `- **${p.name}** [${p.article}] (${p.category}): ${p.price.toLocaleString()} KZT | Stock: ${p.stock}${extras ? ` | ${extras}` : ''}`;
  }).join('\n');

  const inventorySection = `
${sectionHeader}
*Last Synced: ${new Date().toLocaleString('ru-RU')}*

${inventoryList}
`;

  if (memory.includes(sectionHeader)) {
    const regex = new RegExp(`${sectionHeader}[\\s\\S]*?(?=##|$)`, 'g');
    memory = memory.replace(regex, inventorySection + '\n');
  } else {
    memory += '\n\n' + inventorySection;
  }

  fs.writeFileSync(MEMORY_PATH, memory, 'utf8');
}
