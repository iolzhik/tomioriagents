import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEDIA_PATH = path.join(process.cwd(), 'knowledge', 'crm_media.json');
const MEDIA_FALLBACK_PATH = '/tmp/tomiori_crm_media.json';

export interface MediaItem {
  id: string;
  name: string;
  url: string; // base64 or external URL
  type: 'image' | 'video';
  size?: number;
  createdAt: string;
  tags?: string[];
  source?: 'upload' | 'product'; // where it came from
}

function getMedia(): MediaItem[] {
  const sources = [MEDIA_PATH, MEDIA_FALLBACK_PATH];
  const merged: MediaItem[] = [];
  const seen = new Set<string>();

  for (const p of sources) {
    if (!fs.existsSync(p)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed) {
        const id = String(item?.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(item as MediaItem);
      }
    } catch {}
  }

  return merged;
}

function saveMedia(items: MediaItem[]) {
  const payload = JSON.stringify(items, null, 2);
  try {
    fs.mkdirSync(path.dirname(MEDIA_PATH), { recursive: true });
    fs.writeFileSync(MEDIA_PATH, payload, 'utf8');
    return;
  } catch {}

  fs.mkdirSync(path.dirname(MEDIA_FALLBACK_PATH), { recursive: true });
  fs.writeFileSync(MEDIA_FALLBACK_PATH, payload, 'utf8');
}

export async function GET() {
  return NextResponse.json({ success: true, items: getMedia() });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const items = getMedia();

    if (data.action === 'delete') {
      const filtered = items.filter(i => i.id !== data.id);
      saveMedia(filtered);
      return NextResponse.json({ success: true });
    }

    // Add new item(s)
    const newItems: MediaItem[] = Array.isArray(data.items) ? data.items : [data];
    const toAdd = newItems.map(item => ({
      id: item.id || 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: item.name || 'Без названия',
      url: item.url,
      type: item.type || (item.url?.startsWith('data:video') ? 'video' : 'image'),
      size: item.size,
      createdAt: item.createdAt || new Date().toISOString(),
      tags: item.tags || [],
      source: item.source || 'upload',
    } as MediaItem));

    // Deduplicate by id
    const existingIds = new Set(items.map(i => i.id));
    const fresh = toAdd.filter(i => !existingIds.has(i.id));
    const updated = [...fresh, ...items]; // newest first
    saveMedia(updated);

    return NextResponse.json({ success: true, items: fresh });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
