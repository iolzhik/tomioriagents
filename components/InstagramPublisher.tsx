'use client';
import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Info, RefreshCw, Calendar, Zap, ExternalLink, X, Key, Edit2, Trash2, Plus, Library } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import MediaLibrary from './MediaLibrary';

const IgIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface QueueItem {
  id: string; imageUrl: string; caption: string; scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed'; containerId?: string;
  igUsername?: string; createdAt: string; note?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'REEL' | 'STORY';
}

const QUEUE_KEY = 'ig_publish_queue_v2';
const loadQ = (): QueueItem[] => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const saveQ = (q: QueueItem[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
const uid = () => Math.random().toString(36).slice(2, 9);
const minDT = () => new Date(Date.now() + 11 * 60 * 1000).toISOString().slice(0, 16);
const maxDT = () => new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

const lbl: React.CSSProperties = { fontSize: '0.72rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' };
const inp: React.CSSProperties = { padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #E5E5E5', fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: '#FAFAFA' };

// ── Token Help ────────────────────────────────────────────────────────────────
function TokenHelp() {
  return (
    <div style={{ background: '#F8F9FA', borderRadius: '12px', padding: '1rem', fontSize: '0.78rem', lineHeight: 1.7, color: '#444', border: '1px solid #E5E5E5' }}>
      <strong>Как получить токен:</strong>
      <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
        <li>Перейди на <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color: '#1877F2' }}>developers.facebook.com/apps</a></li>
        <li>Создай приложение типа <strong>Business</strong></li>
        <li>Добавь продукт <strong>Instagram Graph API</strong></li>
        <li>В <strong>Tools → Graph API Explorer</strong> выбери приложение</li>
        <li>Разрешения: <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_show_list</code></li>
        <li>Нажми <strong>Generate Access Token</strong></li>
      </ol>
      <div style={{ marginTop: '8px', padding: '8px', background: '#FFF3CD', borderRadius: '8px', fontSize: '0.72rem' }}>
        ⚠️ Аккаунт Instagram должен быть <strong>Business или Creator</strong> и привязан к Facebook Page
      </div>
    </div>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────────
function QueueCard({ item, onEdit, onDelete, onMarkPublished }: { item: QueueItem; onEdit: (i: QueueItem) => void; onDelete: (id: string) => void; onMarkPublished: (id: string) => void; }) {
  const isPast = new Date(item.scheduledAt) < new Date();
  const sc = item.status === 'published' ? '#16A34A' : item.status === 'failed' ? '#DC2626' : isPast ? '#F59E0B' : '#6366F1';
  const sl = item.status === 'published' ? '✓ Опубликован' : item.status === 'failed' ? '✗ Ошибка' : isPast ? '⏳ Ожидает' : '🕐 Запланирован';
  return (
    <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '88px', flexShrink: 0, background: '#F1F3F5', minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt="" style={{ width: '88px', height: '88px', objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <ImageIcon size={22} color="#CCC" />}
        </div>
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', background: `${sc}18`, color: sc, whiteSpace: 'nowrap' }}>{sl}</span>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {item.status === 'scheduled' && (
                <button onClick={() => onMarkPublished(item.id)} title="Отметить опубликованным"
                  style={{ background: 'none', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#16A34A', fontSize: '0.65rem', fontWeight: '800' }}>✓</button>
              )}
              <button onClick={() => onEdit(item)} style={{ background: 'none', border: '1px solid #E5E5E5', borderRadius: '8px', padding: '4px 6px', cursor: 'pointer', color: '#555' }}><Edit2 size={12} /></button>
              <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: '1px solid #FECACA', borderRadius: '8px', padding: '4px 6px', cursor: 'pointer', color: '#DC2626' }}><Trash2 size={12} /></button>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#333', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, marginBottom: '5px' }}>
            {item.caption || <span style={{ color: '#AAA' }}>Без подписи</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#6366F1' }}>
            <Calendar size={11} />
            {new Date(item.scheduledAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {item.igUsername && <span style={{ color: '#AAA', marginLeft: '4px' }}>· @{item.igUsername}</span>}
          </div>
          {item.note && <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>{item.note}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }: { item: QueueItem; onSave: (u: QueueItem) => void; onClose: () => void; }) {
  const [form, setForm] = useState({ ...item });
  const set = (k: keyof QueueItem, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#FFF', borderRadius: '20px', padding: '2rem', width: '480px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', gap: '14px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '900', fontSize: '1rem' }}>Редактировать пост</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={lbl}>URL изображения</label>
          <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} style={inp} placeholder="https://..." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={lbl}>Подпись</label>
          <textarea value={form.caption} onChange={e => set('caption', e.target.value)} style={{ ...inp, minHeight: '90px', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={lbl}>Дата и время</label>
          <input type="datetime-local" value={form.scheduledAt.slice(0, 16)} min={minDT()} max={maxDT()} onChange={e => set('scheduledAt', e.target.value)} style={{ ...inp, borderColor: '#6366F1' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={lbl}>Статус</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inp }}>
            <option value="scheduled">Запланирован</option>
            <option value="published">Опубликован</option>
            <option value="failed">Ошибка</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={lbl}>Заметка</label>
          <input value={form.note || ''} onChange={e => set('note', e.target.value)} style={inp} placeholder="Для чего этот пост..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FFF', cursor: 'pointer', fontWeight: '700' }}>Отмена</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#000', color: '#FFF', cursor: 'pointer', fontWeight: '700' }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstagramPublisher() {
  const [token, setToken] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'REEL' | 'STORY'>('IMAGE');
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [publishing, setPublishing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [account, setAccount] = useState<{ igUserId: string; username: string; limit: any } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [editing, setEditing] = useState<QueueItem | null>(null);
  const [tab, setTab] = useState<'publish' | 'queue'>('publish');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'failed'>('all');
  const [showMediaLib, setShowMediaLib] = useState(false);

  useEffect(() => { setQueue(loadQ()); }, []);

  const persist = (q: QueueItem[]) => { setQueue(q); saveQ(q); };

  const verifyToken = async () => {
    const cleanToken = token.trim();
    if (!cleanToken) return;
    setChecking(true); setResult(null);
    try {
      const res = await fetch(`/api/instagram/graph-publish?accessToken=${encodeURIComponent(cleanToken)}`);
      const data = await res.json();
      if (data.success) setAccount({ igUserId: data.igUserId, username: data.username, limit: data.limit });
      else setResult({ success: false, error: data.error });
    } catch (e: any) { setResult({ success: false, error: e.message }); }
    setChecking(false);
  };

  const handlePublish = async () => {
    const cleanToken = token.trim();
    if (!cleanToken || !imageUrl || (mediaType !== 'STORY' && !caption)) return;
    setPublishing(true); setResult(null);
    try {
      const body: any = { accessToken: cleanToken, imageUrl, caption, mediaType };
      if (mode === 'schedule' && scheduledAt) body.scheduledAt = scheduledAt;
      const res = await fetch('/api/instagram/graph-publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        const item: QueueItem = { id: uid(), imageUrl, caption, scheduledAt: scheduledAt || new Date().toISOString(), status: mode === 'schedule' ? 'scheduled' : 'published', containerId: data.containerId, igUsername: data.username || account?.username, createdAt: new Date().toISOString(), note, mediaType };
        persist([item, ...queue]);
        if (mode === 'schedule') { setImageUrl(''); setCaption(''); setScheduledAt(''); setNote(''); setTab('queue'); }
      }
    } catch (e: any) { setResult({ success: false, error: e.message }); }
    setPublishing(false);
  };

  const deleteItem = (id: string) => { if (!confirm('Удалить из очереди?')) return; persist(queue.filter(q => q.id !== id)); };
  const saveEdit = (u: QueueItem) => { persist(queue.map(q => q.id === u.id ? u : q)); setEditing(null); };
  const markPublished = (id: string) => persist(queue.map(q => q.id === id ? { ...q, status: 'published' } : q));
  const addManual = () => { const item: QueueItem = { id: uid(), imageUrl: '', caption: '', scheduledAt: minDT(), status: 'scheduled', createdAt: new Date().toISOString(), mediaType: 'IMAGE' }; persist([item, ...queue]); setEditing(item); };

  const filtered = filter === 'all' ? queue : queue.filter(q => q.status === filter);
  const counts = { all: queue.length, scheduled: queue.filter(q => q.status === 'scheduled').length, published: queue.filter(q => q.status === 'published').length, failed: queue.filter(q => q.status === 'failed').length };
  const quotaUsed = account?.limit?.quota_usage ?? null;
  const quotaTotal = account?.limit?.config?.quota_total ?? 25;
  const canPublish = !!token && !!imageUrl && (mediaType === 'STORY' || !!caption) && (mode === 'now' || !!scheduledAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '760px' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#833AB4 0%,#FD1D1D 50%,#FCB045 100%)', borderRadius: '20px', padding: '1.4rem 1.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <IgIcon size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '900', fontSize: '1.05rem' }}>Instagram Graph API Publisher</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Meta Graph API v22.0 · 25 постов/24ч · до 75 дней вперёд</div>
        </div>
        {account && (
          <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: '800' }}>@{account.username}</div>
            {quotaUsed !== null && <div style={{ opacity: 0.8 }}>{quotaUsed}/{quotaTotal} постов</div>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F3F5', borderRadius: '14px', padding: '4px' }}>
        {[{ id: 'publish', label: '✍️ Публикация' }, { id: 'queue', label: `📅 Очередь (${counts.all})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', transition: 'all 0.15s', background: tab === t.id ? '#FFF' : 'transparent', color: tab === t.id ? '#000' : '#888', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'publish' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Token */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '1.4rem', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={lbl}><Key size={13} /> Access Token</label>
              <button onClick={() => setShowHelp(!showHelp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Info size={12} /> Как получить?</button>
            </div>
            {showHelp && <TokenHelp />}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="IGAA... или EAA..." style={{ ...inp, flex: 1, fontFamily: 'monospace' }} />
              <button onClick={verifyToken} disabled={!token || checking} style={{ padding: '10px 16px', borderRadius: '10px', background: '#000', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', opacity: !token ? 0.4 : 1, whiteSpace: 'nowrap' }}>
                {checking ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Проверить
              </button>
            </div>
            {/* Account Info if verified */}
            {account && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: '700' }}>@{account.username} · ID: {account.igUserId}</span>
                {quotaUsed !== null && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#555' }}>{quotaUsed}/{quotaTotal} постов/24ч</span>}
              </div>
            )}
          </div>

          {/* Media Type Selection */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '1.4rem', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={lbl}>Тип контента</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'IMAGE', label: 'Пост', icon: <ImageIcon size={16} /> },
                { id: 'VIDEO', label: 'Видео', icon: <Zap size={16} /> },
                { id: 'REEL', label: 'Reels', icon: <Send size={16} /> },
                { id: 'STORY', label: 'Story', icon: <Clock size={16} /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMediaType(t.id as any)}
                  style={{
                    padding: '10px 5px',
                    borderRadius: '10px',
                    border: mediaType === t.id ? '2px solid #000' : '1px solid #EEE',
                    background: mediaType === t.id ? '#000' : '#FFF',
                    color: mediaType === t.id ? '#FFF' : '#666',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: '0.2s'
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image/Video URL */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '1.4rem', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={lbl}><ImageIcon size={13} /> URL {mediaType === 'VIDEO' || mediaType === 'REEL' ? 'видео' : 'изображения'}</label>
              <button onClick={() => setShowMediaLib(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #EEE', background: '#F8F9FA', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' }}>
                <Library size={13} /> Медиатека
              </button>
            </div>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://yoursite.com/media.jpg" style={inp} />
            <div style={{ fontSize: '0.7rem', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={11} /> Должен быть публичный HTTPS URL.</div>
            {imageUrl?.startsWith('https://') && mediaType === 'IMAGE' && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '180px', border: '1px solid #EEE' }}>
                <img src={imageUrl} alt="preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          {/* Media Library Modal */}
          <AnimatePresence>
            {showMediaLib && (
              <MediaLibrary
                onSelect={item => { setImageUrl(item.url); setShowMediaLib(false); }}
                onClose={() => setShowMediaLib(false)}
                accept={mediaType === 'VIDEO' || mediaType === 'REEL' ? 'video' : 'image'}
              />
            )}
          </AnimatePresence>

          {/* Caption */}
          {mediaType !== 'STORY' && (
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '1.4rem', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={lbl}>Подпись (Caption)</label>
                <span style={{ fontSize: '0.7rem', color: caption.length > 2000 ? '#EF4444' : '#AAA' }}>{caption.length}/2200</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={2200} placeholder="Текст поста, хэштеги..." style={{ ...inp, minHeight: '110px', resize: 'vertical' }} />
            </div>
          )}

          {/* Mode */}
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '1.4rem', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={lbl}>Режим публикации</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[{ id: 'now', icon: <Zap size={18} />, label: 'Сейчас', sub: 'Немедленная публикация', color: '#D4AF37' }, { id: 'schedule', icon: <Clock size={18} />, label: 'Запланировать', sub: 'До 75 дней вперёд', color: '#6366F1' }].map(m => (
                <button key={m.id} onClick={() => setMode(m.id as any)} style={{ padding: '14px', borderRadius: '12px', border: mode === m.id ? `2px solid ${m.color}` : '2px solid #E5E5E5', background: mode === m.id ? `${m.color}12` : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px', transition: 'all 0.15s' }}>
                  <div style={{ color: mode === m.id ? m.color : '#AAA' }}>{m.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: mode === m.id ? '#000' : '#666' }}>{m.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#AAA' }}>{m.sub}</div>
                </button>
              ))}
            </div>
            {mode === 'schedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={lbl}>Дата и время публикации</label>
                  <input type="datetime-local" value={scheduledAt} onChange={setScheduledAt as any} min={minDT()} max={maxDT()} style={{ ...inp, borderColor: '#6366F1' }} />
                  {scheduledAt && <div style={{ fontSize: '0.75rem', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={12} /> {new Date(scheduledAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={lbl}>Заметка (опционально)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Для чего этот пост..." style={inp} />
                </div>
              </div>
            )}
          </div>

          {/* Publish button */}
          <button onClick={handlePublish} disabled={publishing || !canPublish} style={{ padding: '1.1rem', borderRadius: '14px', background: mode === 'now' ? 'linear-gradient(135deg,#833AB4,#FD1D1D,#FCB045)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#FFF', border: 'none', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: !canPublish ? 0.4 : 1, transition: 'opacity 0.2s' }}>
            {publishing ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Публикация...</> : mode === 'now' ? <><Send size={20} /> Опубликовать в Instagram</> : <><Clock size={20} /> Запланировать пост</>}
          </button>

          {/* Result */}
          {result && (
            <div style={{ borderRadius: '14px', padding: '1.2rem 1.5rem', background: result.success ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.success ? '#BBF7D0' : '#FECACA'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {result.success ? <CheckCircle2 size={20} color="#16A34A" /> : <AlertCircle size={20} color="#DC2626" />}
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: result.success ? '#15803D' : '#DC2626' }}>{result.success ? (result.scheduled ? 'Контент запланирован' : 'Контент опубликован') : 'Ошибка'}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.6 }}>{result.message || result.error}</div>
              {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1877F2', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}><ExternalLink size={14} /> Открыть</a>}
            </div>
          )}
        </div>
      )}

      {tab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {(['all', 'scheduled', 'published', 'failed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', transition: 'all 0.15s', background: filter === f ? '#000' : '#F1F3F5', color: filter === f ? '#FFF' : '#666' }}>
                {f === 'all' ? `Все (${counts.all})` : f === 'scheduled' ? `Запланированы (${counts.scheduled})` : f === 'published' ? `Опубликованы (${counts.published})` : `Ошибки (${counts.failed})`}
              </button>
            ))}
            <button onClick={addManual} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px', border: '1.5px dashed #D4AF37', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Plus size={13} /> Добавить вручную
            </button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#CCC' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#AAA' }}>Очередь пуста</div>
              <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#CCC' }}>Запланируй пост или добавь вручную</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(item => <QueueCard key={item.id} item={item} onEdit={setEditing} onDelete={deleteItem} onMarkPublished={markPublished} />)}
            </div>
          )}
        </div>
      )}

      {editing && <EditModal item={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
