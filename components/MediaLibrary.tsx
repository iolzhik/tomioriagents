'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Search, Trash2, Check, Image as ImageIcon, Video, Grid, List, Plus, Wand2 } from 'lucide-react';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size?: number;
  createdAt: string;
  tags?: string[];
  source?: 'upload' | 'product';
}

interface Props {
  /** If provided, renders as a modal picker */
  onSelect?: (item: MediaItem) => void;
  /** Allow multi-select */
  multi?: boolean;
  onMultiSelect?: (items: MediaItem[]) => void;
  onClose?: () => void;
  /** If false, renders inline (no modal wrapper) */
  modal?: boolean;
  accept?: 'image' | 'video' | 'all';
}

const MEDIA_CACHE_KEY = 'tomiori_media_library_cache_v1';
const MEDIA_DB_NAME = 'tomiori_media_db';
const MEDIA_STORE_NAME = 'items';

function readCachedMedia(): MediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MEDIA_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedMedia(items: MediaItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEDIA_CACHE_KEY, JSON.stringify(items.slice(0, 500)));
  } catch {}
}

function openMediaDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(MEDIA_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
          db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readIndexedMedia(): Promise<MediaItem[]> {
  const db = await openMediaDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const value = Array.isArray(req.result) ? (req.result as MediaItem[]) : [];
        resolve(value.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
      };
      req.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch {
      try { db.close(); } catch {}
      resolve([]);
    }
  });
}

async function upsertIndexedMedia(items: MediaItem[]) {
  if (!items.length) return;
  const db = await openMediaDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE_NAME);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); resolve(); };
    } catch {
      try { db.close(); } catch {}
      resolve();
    }
  });
}

async function deleteIndexedMedia(id: string) {
  const db = await openMediaDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      tx.objectStore(MEDIA_STORE_NAME).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); resolve(); };
    } catch {
      try { db.close(); } catch {}
      resolve();
    }
  });
}

function mergeUniqueById(primary: MediaItem[], secondary: MediaItem[]): MediaItem[] {
  const out: MediaItem[] = [];
  const seen = new Set<string>();
  for (const item of [...primary, ...secondary]) {
    const id = String(item?.id || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export default function MediaLibrary({ onSelect, multi, onMultiSelect, onClose, modal = true, accept = 'all' }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [bgRemoveLoading, setBgRemoveLoading] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    const cached = readCachedMedia();
    const indexed = await readIndexedMedia();
    const clientMerged = mergeUniqueById(indexed, cached);
    try {
      const res = await fetch('/api/crm/media');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const merged = mergeUniqueById(data.items, clientMerged);
        setItems(merged);
        writeCachedMedia(merged);
        await upsertIndexedMedia(merged.slice(0, 1000));
        return;
      }
    } catch {}
    setItems(clientMerged);
    writeCachedMedia(clientMerged);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const arr = Array.from(files);
    const toUpload: MediaItem[] = [];

    for (const file of arr) {
      if (accept === 'image' && !file.type.startsWith('image/')) continue;
      if (accept === 'video' && !file.type.startsWith('video/')) continue;
      const url = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      toUpload.push({
        id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: file.name,
        url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        createdAt: new Date().toISOString(),
        source: 'upload',
      });
    }

    if (toUpload.length) {
      await upsertIndexedMedia(toUpload);
      setItems(prev => {
        const nextItems = mergeUniqueById(toUpload, prev);
        writeCachedMedia(nextItems);
        return nextItems;
      });
      try {
        const res = await fetch('/api/crm/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: toUpload }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Не удалось сохранить');
      } catch {
        // Keep local cache as fallback when server storage is unavailable.
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteIndexedMedia(id);
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      writeCachedMedia(next);
      return next;
    });
    try {
      await fetch('/api/crm/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
    } catch {}
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleBgRemove = async (item: MediaItem) => {
    if (item.type !== 'image') return;
    setBgRemoveLoading(item.id);
    try {
      // Try server-side first
      const imageBase64 = item.url.includes(',') ? item.url.split(',')[1] : item.url;
      const res = await fetch('/api/crm/bg-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();

      let resultUrl: string;

      if (data.success) {
        resultUrl = 'data:image/png;base64,' + data.resultBase64;
      } else if (data.useClientFallback) {
        // Use canvas-based removal
        const { removeBackgroundClient } = await import('@/lib/client-bg-remove');
        resultUrl = await removeBackgroundClient(item.url.startsWith('data:') ? item.url : `data:image/jpeg;base64,${imageBase64}`);
      } else {
        alert('Ошибка удаления фона: ' + data.error);
        return;
      }

      const newItem: MediaItem = {
        id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: item.name.replace(/\.[^.]+$/, '') + '_nobg.png',
        url: resultUrl,
        type: 'image',
        createdAt: new Date().toISOString(),
        source: 'upload',
      };
      await upsertIndexedMedia([newItem]);
      setItems(prev => {
        const nextItems = mergeUniqueById([newItem], prev);
        writeCachedMedia(nextItems);
        return nextItems;
      });
      try {
        await fetch('/api/crm/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [newItem] }),
        });
      } catch {}
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setBgRemoveLoading(null);
    }
  };

  const toggleSelect = (item: MediaItem) => {
    if (!multi) {
      onSelect?.(item);
      return;
    }
    setSelected(prev => {
      const s = new Set(prev);
      s.has(item.id) ? s.delete(item.id) : s.add(item.id);
      return s;
    });
  };

  const confirmMulti = () => {
    const chosen = items.filter(i => selected.has(i.id));
    onMultiSelect?.(chosen);
  };

  // Drag & drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, []);

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: modal ? '80vh' : 'auto', minHeight: modal ? undefined : '400px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input className="luxury-input" style={{ paddingLeft: '32px', fontSize: '0.8rem' }} placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', background: '#F1F3F5', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {(['all', 'image', 'video'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: filter === f ? '#FFF' : 'transparent', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {f === 'all' ? 'Все' : f === 'image' ? 'Фото' : 'Видео'}
            </button>
          ))}
        </div>
        <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #EEE', background: '#FFF', cursor: 'pointer' }}>
          {view === 'grid' ? <List size={16} /> : <Grid size={16} />}
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem' }}>
          {uploading ? '...' : <><Upload size={14} /> Загрузить</>}
        </button>
        <input ref={fileRef} type="file" hidden multiple accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*'} onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* Drop zone + grid */}
      <div
        ref={dropRef}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
      >
        {filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', opacity: 0.3, gap: '12px' }}>
            <ImageIcon size={48} />
            <div style={{ fontSize: '0.85rem' }}>Перетащите файлы сюда или нажмите «Загрузить»</div>
          </div>
        )}

        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => toggleSelect(item)}
                style={{
                  position: 'relative', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                  border: selected.has(item.id) ? '3px solid var(--gold)' : '2px solid transparent',
                  aspectRatio: '1', background: '#F1F3F5',
                  transition: 'border-color 0.15s',
                }}
              >
                {item.type === 'video' ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
                    <Video size={32} color="#FFF" opacity={0.6} />
                  </div>
                ) : (
                  <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {selected.has(item.id) && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={13} color="#000" />
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                  style={{ position: 'absolute', top: '6px', left: '6px', width: '22px', height: '22px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                  className="media-delete-btn"
                >
                  <Trash2 size={11} color="#FFF" />
                </button>
                {item.type === 'image' && (
                  <button
                    onClick={e => { e.stopPropagation(); handleBgRemove(item); }}
                    disabled={bgRemoveLoading === item.id}
                    style={{ position: 'absolute', bottom: '30px', right: '6px', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.9)', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: bgRemoveLoading === item.id ? 0.5 : 0 }}
                    className="media-delete-btn"
                  >
                    <Wand2 size={10} color="#FFF" />
                    <span style={{ fontSize: '0.6rem', color: '#FFF', fontWeight: '600' }}>Удалить фон</span>
                  </button>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 6px 5px', fontSize: '0.6rem', color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => toggleSelect(item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '10px', border: selected.has(item.id) ? '2px solid var(--gold)' : '1px solid #EEE', cursor: 'pointer', background: '#FFF' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#F1F3F5' }}>
                  {item.type === 'image' ? <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}><Video size={18} color="#FFF" /></div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(item.createdAt).toLocaleDateString('ru-RU')} · {item.type}</div>
                </div>
                {selected.has(item.id) && <Check size={16} color="var(--gold)" />}
                <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', opacity: 0.5 }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-select confirm */}
      {multi && selected.size > 0 && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Выбрано: {selected.size}</span>
          <button onClick={confirmMulti} className="btn-primary" style={{ padding: '10px 20px' }}>Вставить выбранные</button>
        </div>
      )}
    </div>
  );

  if (!modal) return content;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: '#FFF', width: '100%', maxWidth: '900px', borderRadius: '24px', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>Медиатека</h3>
          <button onClick={onClose} style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>
        {content}
      </motion.div>
    </div>
  );
}
