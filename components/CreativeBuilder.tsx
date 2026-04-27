'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Trash2, Type, Square, ImageIcon, AlignCenter, Copy, ChevronUp, ChevronDown, RotateCw, Eye, EyeOff, Lock, Unlock, Library } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import MediaLibrary from './MediaLibrary';

const CYRILLIC_FONTS = [
  { name: 'Roboto', css: 'Roboto, sans-serif' },
  { name: 'Montserrat', css: 'Montserrat, sans-serif' },
  { name: 'Raleway', css: 'Raleway, sans-serif' },
  { name: 'Oswald', css: 'Oswald, sans-serif' },
  { name: 'Playfair Display', css: '"Playfair Display", serif' },
  { name: 'Merriweather', css: 'Merriweather, serif' },
  { name: 'PT Sans', css: '"PT Sans", sans-serif' },
  { name: 'PT Serif', css: '"PT Serif", serif' },
  { name: 'Lora', css: 'Lora, serif' },
  { name: 'Nunito', css: 'Nunito, sans-serif' },
  { name: 'Rubik', css: 'Rubik, sans-serif' },
  { name: 'Exo 2', css: '"Exo 2", sans-serif' },
  { name: 'Comfortaa', css: 'Comfortaa, cursive' },
  { name: 'Lobster', css: 'Lobster, cursive' },
  { name: 'Pacifico', css: 'Pacifico, cursive' },
  { name: 'Ubuntu', css: 'Ubuntu, sans-serif' },
  { name: 'Fira Sans', css: '"Fira Sans", sans-serif' },
  { name: 'Noto Sans', css: '"Noto Sans", sans-serif' },
  { name: 'Jost', css: 'Jost, sans-serif' },
  { name: 'Manrope', css: 'Manrope, sans-serif' },
  { name: 'Inter', css: 'Inter, sans-serif' },
  { name: 'Mulish', css: 'Mulish, sans-serif' },
  { name: 'Poppins', css: 'Poppins, sans-serif' },
  { name: 'Cormorant', css: 'Cormorant, serif' },
  { name: 'EB Garamond', css: '"EB Garamond", serif' },
  { name: 'Spectral', css: 'Spectral, serif' },
  { name: 'Libre Baskerville', css: '"Libre Baskerville", serif' },
  { name: 'Tenor Sans', css: '"Tenor Sans", sans-serif' },
  { name: 'Cormorant Garamond', css: '"Cormorant Garamond", serif' },
  { name: 'Cinzel', css: 'Cinzel, serif' },
  { name: 'Poiret One', css: '"Poiret One", cursive' },
  { name: 'Josefin Sans', css: '"Josefin Sans", sans-serif' },
  { name: 'Bebas Neue', css: '"Bebas Neue", cursive' },
  { name: 'Anton', css: 'Anton, sans-serif' },
  { name: 'Russo One', css: '"Russo One", sans-serif' },
  { name: 'Teko', css: 'Teko, sans-serif' },
  { name: 'Barlow', css: 'Barlow, sans-serif' },
  { name: 'DM Sans', css: '"DM Sans", sans-serif' },
  { name: 'Space Grotesk', css: '"Space Grotesk", sans-serif' },
  { name: 'Syne', css: 'Syne, sans-serif' },
  { name: 'Unbounded', css: 'Unbounded, sans-serif' },
  { name: 'Caveat', css: 'Caveat, cursive' },
  { name: 'Dancing Script', css: '"Dancing Script", cursive' },
  { name: 'Open Sans', css: '"Open Sans", sans-serif' },
  { name: 'Source Sans Pro', css: '"Source Sans Pro", sans-serif' },
  { name: 'Philosopher', css: 'Philosopher, serif' },
  { name: 'Saira', css: 'Saira, sans-serif' },
  { name: 'Righteous', css: 'Righteous, cursive' },
  { name: 'Dela Gothic One', css: '"Dela Gothic One", cursive' },
];

const FORMATS = [
  { id: 'post',   label: 'Пост 1:1',    w: 1080, h: 1080, icon: '⬜' },
  { id: 'story',  label: 'Сторис 9:16', w: 1080, h: 1920, icon: '📱' },
  { id: 'banner', label: 'Баннер 16:9', w: 1920, h: 1080, icon: '🖥' },
];

type LayerType = 'text' | 'image' | 'shape' | 'button' | 'logo';
type ShapeKind = 'rect' | 'circle' | 'triangle' | 'star' | 'diamond' | 'line' | 'rounded_rect' | 'hexagon';

interface Layer {
  id: string; type: LayerType;
  x: number; y: number; w: number; h: number; zIndex: number;
  text?: string; fontSize?: number; fontFamily?: string; color?: string;
  fontWeight?: string; fontStyle?: string; textAlign?: 'left'|'center'|'right';
  letterSpacing?: number; lineHeight?: number;
  bgColor?: string; borderRadius?: number;
  shapeKind?: ShapeKind; fill?: string; stroke?: string; strokeWidth?: number;
  opacity?: number; rotation?: number;
  src?: string; objectFit?: 'cover'|'contain';
  visible?: boolean; locked?: boolean;
}

interface CanvasState {
  format: string; bgType: 'color'|'gradient'|'image';
  bgColor: string; bgGradient: string; bgImage: string; layers: Layer[];
}

const uid = () => Math.random().toString(36).slice(2, 9);
const SCALE = 0.42;

// ── SHAPE SVG ──────────────────────────────────────────────────────────────
function ShapeSVG({ l, w, h }: { l: Layer; w: number; h: number }) {
  const fill = l.fill || '#D4AF37', stroke = l.stroke || 'none', sw = l.strokeWidth || 0;
  switch (l.shapeKind) {
    case 'circle': return <svg width={w} height={h} style={{display:'block'}}><ellipse cx={w/2} cy={h/2} rx={w/2-sw/2} ry={h/2-sw/2} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>;
    case 'triangle': return <svg width={w} height={h} style={{display:'block'}}><polygon points={`${w/2},${sw} ${w-sw},${h-sw} ${sw},${h-sw}`} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>;
    case 'star': { const cx=w/2,cy=h/2,r1=Math.min(w,h)/2-sw,r2=r1*0.45; const pts=Array.from({length:10},(_,i)=>{const a=Math.PI/5*i-Math.PI/2;const r=i%2===0?r1:r2;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' '); return <svg width={w} height={h} style={{display:'block'}}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>; }
    case 'diamond': return <svg width={w} height={h} style={{display:'block'}}><polygon points={`${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}`} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>;
    case 'line': return <svg width={w} height={h} style={{display:'block'}}><line x1={0} y1={h/2} x2={w} y2={h/2} stroke={fill} strokeWidth={Math.max(sw,3)}/></svg>;
    case 'hexagon': { const cx=w/2,cy=h/2,r=Math.min(w,h)/2-sw; const pts=Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' '); return <svg width={w} height={h} style={{display:'block'}}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>; }
    case 'rounded_rect': return <svg width={w} height={h} style={{display:'block'}}><rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} rx={16} ry={16} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>;
    default: return <svg width={w} height={h} style={{display:'block'}}><rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} fill={fill} stroke={stroke} strokeWidth={sw}/></svg>;
  }
}

// ── RESIZE HANDLE ──────────────────────────────────────────────────────────
type HandlePos = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
const HANDLES: { pos: HandlePos; cursor: string; style: React.CSSProperties }[] = [
  { pos:'nw', cursor:'nw-resize', style:{top:-5,left:-5} },
  { pos:'n',  cursor:'n-resize',  style:{top:-5,left:'calc(50% - 5px)'} },
  { pos:'ne', cursor:'ne-resize', style:{top:-5,right:-5} },
  { pos:'e',  cursor:'e-resize',  style:{top:'calc(50% - 5px)',right:-5} },
  { pos:'se', cursor:'se-resize', style:{bottom:-5,right:-5} },
  { pos:'s',  cursor:'s-resize',  style:{bottom:-5,left:'calc(50% - 5px)'} },
  { pos:'sw', cursor:'sw-resize', style:{bottom:-5,left:-5} },
  { pos:'w',  cursor:'w-resize',  style:{top:'calc(50% - 5px)',left:-5} },
];

function ResizeHandles({ onResize }: { onResize: (pos: HandlePos, dx: number, dy: number) => void }) {
  return (
    <>
      {HANDLES.map(h => (
        <div key={h.pos} onMouseDown={e => {
          e.stopPropagation(); e.preventDefault();
          const sx = e.clientX, sy = e.clientY;
          const onMove = (ev: MouseEvent) => onResize(h.pos, (ev.clientX-sx)/SCALE, (ev.clientY-sy)/SCALE);
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }} style={{ position:'absolute', width:10, height:10, background:'#FFF', border:'2px solid #D4AF37', borderRadius:2, cursor:h.cursor, zIndex:9999, ...h.style }} />
      ))}
    </>
  );
}

// ── LAYER ELEMENT ──────────────────────────────────────────────────────────
function LayerEl({ l, selected, onSelect, onUpdate }: {
  l: Layer; selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Layer>) => void;
}) {
  const dragRef = useRef<{sx:number;sy:number;ox:number;oy:number}|null>(null);
  const resizeRef = useRef<{ox:number;oy:number;ow:number;oh:number}|null>(null);
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  if (l.visible === false) return null;

  const isText = l.type === 'text' || l.type === 'button';

  const onMouseDown = (e: React.MouseEvent) => {
    if (l.locked || editing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: l.x, oy: l.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onUpdate({ x: dragRef.current.ox + (ev.clientX - dragRef.current.sx)/SCALE, y: dragRef.current.oy + (ev.clientY - dragRef.current.sy)/SCALE });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onDblClick = (e: React.MouseEvent) => {
    if (!isText || l.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        // place cursor at end
        const range = document.createRange();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const commitEdit = () => {
    if (editRef.current) {
      onUpdate({ text: editRef.current.innerText });
    }
    setEditing(false);
  };

  const handleResize = useCallback((pos: HandlePos, dx: number, dy: number) => {
    if (!resizeRef.current) resizeRef.current = { ox: l.x, oy: l.y, ow: l.w, oh: l.h };
    const { ox, oy, ow, oh } = resizeRef.current;
    let nx=ox, ny=oy, nw=ow, nh=oh;
    if (pos.includes('e')) nw = Math.max(20, ow + dx);
    if (pos.includes('s')) nh = Math.max(20, oh + dy);
    if (pos.includes('w')) { nw = Math.max(20, ow - dx); nx = ox + (ow - nw); }
    if (pos.includes('n')) { nh = Math.max(20, oh - dy); ny = oy + (oh - nh); }
    onUpdate({ x: nx, y: ny, w: nw, h: nh });
  }, [l.x, l.y, l.w, l.h, onUpdate]);

  useEffect(() => {
    const onUp = () => { resizeRef.current = null; };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const dw = l.w * SCALE, dh = l.h * SCALE;
  const base: React.CSSProperties = {
    position: 'absolute', left: l.x * SCALE, top: l.y * SCALE,
    width: dw, height: dh, zIndex: l.zIndex,
    opacity: l.opacity ?? 1,
    transform: l.rotation ? `rotate(${l.rotation}deg)` : undefined,
    cursor: editing ? 'text' : l.locked ? 'default' : 'move',
    userSelect: editing ? 'text' : 'none',
    boxSizing: 'border-box',
  };
  const selStyle: React.CSSProperties = selected
    ? { outline: editing ? '2px solid #60A5FA' : '2px solid #D4AF37', outlineOffset: '1px' }
    : {};

  // Text / button: render contentEditable when editing
  if (isText) {
    const textStyle: React.CSSProperties = {
      fontFamily: l.fontFamily,
      fontSize: (l.fontSize || 48) * SCALE,
      color: l.color || '#FFF',
      fontWeight: l.fontWeight || '400',
      fontStyle: l.fontStyle,
      textAlign: l.textAlign || 'center',
      letterSpacing: l.letterSpacing,
      lineHeight: l.lineHeight || 1.3,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      width: '100%',
      minHeight: '1em',
    };

    if (l.type === 'button') {
      return (
        <div style={{...base,...selStyle}} onMouseDown={onMouseDown} onDoubleClick={onDblClick} onClick={e=>e.stopPropagation()}>
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:l.bgColor||'#D4AF37',borderRadius:(l.borderRadius??30)*SCALE,overflow:'hidden'}}>
            {editing ? (
              <div ref={editRef} contentEditable suppressContentEditableWarning
                onBlur={commitEdit}
                onKeyDown={e=>{ if(e.key==='Escape'){e.preventDefault();commitEdit();} }}
                style={{...textStyle,outline:'none',minWidth:'20px',padding:'0 4px'}}
              >{l.text||''}</div>
            ) : (
              <span style={{...textStyle,pointerEvents:'none'}}>{l.text||'Кнопка'}</span>
            )}
          </div>
          {selected && !l.locked && !editing && <ResizeHandles onResize={handleResize}/>}
        </div>
      );
    }

    // text layer
    return (
      <div style={{...base,...selStyle}} onMouseDown={onMouseDown} onDoubleClick={onDblClick} onClick={e=>e.stopPropagation()}>
        {editing ? (
          <div ref={editRef} contentEditable suppressContentEditableWarning
            onBlur={commitEdit}
            onKeyDown={e=>{ if(e.key==='Escape'){e.preventDefault();commitEdit();} }}
            style={{...textStyle,outline:'none',width:'100%',height:'100%',overflow:'hidden',padding:'2px'}}
          >{l.text||''}</div>
        ) : (
          <div style={{width:'100%',height:'100%',overflow:'hidden',pointerEvents:'none'}}>
            <span style={{...textStyle}}>{l.text||'Текст'}</span>
          </div>
        )}
        {selected && !l.locked && !editing && <ResizeHandles onResize={handleResize}/>}
        {selected && isText && !editing && (
          <div style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',color:'#FFF',fontSize:'9px',padding:'2px 8px',borderRadius:'4px',whiteSpace:'nowrap',pointerEvents:'none'}}>
            2× клик — редактировать
          </div>
        )}
      </div>
    );
  }

  // non-text layers
  const inner = (() => {
    if (l.type === 'shape') return <ShapeSVG l={l} w={dw} h={dh} />;
    return l.src
      ? <img src={l.src} alt="" style={{width:'100%',height:'100%',objectFit:l.objectFit||'contain',display:'block',pointerEvents:'none',userSelect:'none'}}/>
      : <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFF',fontSize:'12px',pointerEvents:'none'}}>Нет изображения</div>;
  })();

  return (
    <div style={{...base,...selStyle}} onMouseDown={onMouseDown} onClick={e=>e.stopPropagation()}>
      {inner}
      {selected && !l.locked && <ResizeHandles onResize={handleResize}/>}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function CreativeBuilder() {
  const [canvas, setCanvas] = useState<CanvasState>({
    format: 'post', bgType: 'color', bgColor: '#0C4A4F',
    bgGradient: 'linear-gradient(135deg,#0C4A4F,#1A5230)', bgImage: '', layers: [],
  });
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [rightTab, setRightTab] = useState<'props'|'layers'|'bg'|'images'>('bg');
  const [savedImages, setSavedImages] = useState<{id:string;src:string;name:string;ts:number}[]>([]);
  const [showMediaLib, setShowMediaLib] = useState(false);
  const bgImgRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fmt = FORMATS.find(f => f.id === canvas.format) || FORMATS[0];
  const cw = fmt.w * SCALE, ch = fmt.h * SCALE;
  const selected = canvas.layers.find(l => l.id === selectedId) || null;

  const upd = useCallback((id: string, patch: Partial<Layer>) => {
    setCanvas(c => ({ ...c, layers: c.layers.map(l => l.id === id ? { ...l, ...patch } : l) }));
  }, []);

  // Stable onChange for selected layer — memoized by selectedId only
  const selectedOnChange = useCallback((patch: Partial<Layer>) => {
    setCanvas(c => ({ ...c, layers: c.layers.map(l => l.id === selectedId ? { ...l, ...patch } : l) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const addLayer = (type: LayerType, extra: Partial<Layer> = {}) => {
    const maxZ = canvas.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const id = uid();
    const base: Layer = { id, type, x: 80, y: 80, w: type==='text'?500:300, h: type==='text'?120:type==='button'?80:200, zIndex: maxZ+1, opacity:1, rotation:0, visible:true, locked:false, ...extra };    setCanvas(c => ({ ...c, layers: [...c.layers, base] }));
    setSelectedId(id);
    setRightTab('props');
  };

  const del = (id: string) => { setCanvas(c => ({...c, layers: c.layers.filter(l => l.id !== id)})); if (selectedId===id) setSelectedId(null); };
  const dup = (id: string) => { const l = canvas.layers.find(x=>x.id===id); if(!l) return; const nl={...l,id:uid(),x:l.x+30,y:l.y+30,zIndex:l.zIndex+1}; setCanvas(c=>({...c,layers:[...c.layers,nl]})); setSelectedId(nl.id); };

  // Reorder layers by drag in panel
  const moveLayerUp = (id: string) => {
    const layers = [...canvas.layers].sort((a,b)=>a.zIndex-b.zIndex);
    const idx = layers.findIndex(l=>l.id===id);
    if (idx < layers.length-1) {
      const a = layers[idx], b = layers[idx+1];
      setCanvas(c=>({...c, layers: c.layers.map(l=> l.id===a.id ? {...l,zIndex:b.zIndex} : l.id===b.id ? {...l,zIndex:a.zIndex} : l)}));
    }
  };
  const moveLayerDown = (id: string) => {
    const layers = [...canvas.layers].sort((a,b)=>a.zIndex-b.zIndex);
    const idx = layers.findIndex(l=>l.id===id);
    if (idx > 0) {
      const a = layers[idx], b = layers[idx-1];
      setCanvas(c=>({...c, layers: c.layers.map(l=> l.id===a.id ? {...l,zIndex:b.zIndex} : l.id===b.id ? {...l,zIndex:a.zIndex} : l)}));
    }
  };

  const handleBgImg = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setCanvas(c=>({...c,bgImage:ev.target?.result as string,bgType:'image'})); r.readAsDataURL(f); };
  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        const src = ev.target?.result as string;
        addLayer('image', { src, w: 400, h: 400 });
        // Save to local gallery
        const newImg = { id: uid(), src, name: f.name, ts: Date.now() };
        setSavedImages(prev => {
          const updated = [newImg, ...prev].slice(0, 50);
          try { localStorage.setItem('tomiori_builder_images', JSON.stringify(updated)); } catch {}
          return updated;
        });
        try {
          const mediaRaw = localStorage.getItem('tomiori_media_library_cache_v1');
          const mediaList = mediaRaw ? JSON.parse(mediaRaw) : [];
          const mediaItem = {
            id: newImg.id,
            name: f.name,
            url: src,
            type: 'image',
            size: f.size,
            createdAt: new Date().toISOString(),
            source: 'upload',
          };
          const merged = [mediaItem, ...(Array.isArray(mediaList) ? mediaList : []).filter((m: any) => String(m?.id || '') !== mediaItem.id)];
          localStorage.setItem('tomiori_media_library_cache_v1', JSON.stringify(merged.slice(0, 500)));
          if (typeof window !== 'undefined' && window.indexedDB) {
            const req = window.indexedDB.open('tomiori_media_db', 1);
            req.onupgradeneeded = () => {
              const db = req.result;
              if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
            };
            req.onsuccess = () => {
              try {
                const db = req.result;
                const tx = db.transaction('items', 'readwrite');
                tx.objectStore('items').put(mediaItem);
                tx.oncomplete = () => db.close();
                tx.onerror = () => db.close();
              } catch {}
            };
          }
        } catch {}
        // Also save to Media Library
        fetch('/api/crm/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: newImg.id, name: f.name, url: src, type: 'image', size: f.size, createdAt: new Date().toISOString(), source: 'upload' }] }),
        }).catch(() => {});
      };
      r.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const exportPng = async () => {
    const fmt = FORMATS.find(f => f.id === canvas.format) || FORMATS[0];
    const W = fmt.w, H = fmt.h;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d')!;

    // 1. Background
    if (canvas.bgType === 'image' && canvas.bgImage) {
      await new Promise<void>(res => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { ctx.drawImage(img, 0, 0, W, H); res(); };
        img.onerror = () => res();
        img.src = canvas.bgImage;
      });
    } else if (canvas.bgType === 'gradient') {
      // Parse CSS gradient → approximate with linear gradient
      const tmp = document.createElement('canvas'); tmp.width=W; tmp.height=H;
      const tctx = tmp.getContext('2d')!;
      const el = document.createElement('div');
      el.style.cssText = `width:${W}px;height:${H}px;background:${canvas.bgGradient};position:fixed;top:-9999px`;
      document.body.appendChild(el);
      const {default:h2c} = await import('html2canvas');
      const snap = await h2c(el, {scale:1,useCORS:true,allowTaint:true,logging:false});
      document.body.removeChild(el);
      ctx.drawImage(snap, 0, 0, W, H);
    } else {
      ctx.fillStyle = canvas.bgColor || '#000';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Layers sorted by zIndex
    const sorted = [...canvas.layers].filter(l=>l.visible!==false).sort((a,b)=>a.zIndex-b.zIndex);

    for (const l of sorted) {
      ctx.save();
      ctx.globalAlpha = l.opacity ?? 1;

      // Rotation around layer center
      if (l.rotation) {
        const cx = l.x + l.w/2, cy = l.y + l.h/2;
        ctx.translate(cx, cy);
        ctx.rotate(l.rotation * Math.PI / 180);
        ctx.translate(-cx, -cy);
      }

      if (l.type === 'image' || l.type === 'logo') {
        if (l.src) {
          await new Promise<void>(res => {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => {
              if (l.objectFit === 'cover') {
                const scale = Math.max(l.w/img.width, l.h/img.height);
                const sw = img.width*scale, sh = img.height*scale;
                ctx.drawImage(img, l.x+(l.w-sw)/2, l.y+(l.h-sh)/2, sw, sh);
              } else {
                const scale = Math.min(l.w/img.width, l.h/img.height);
                const sw = img.width*scale, sh = img.height*scale;
                ctx.drawImage(img, l.x+(l.w-sw)/2, l.y+(l.h-sh)/2, sw, sh);
              }
              res();
            };
            img.onerror = () => res();
            img.src = l.src!;
          });
        }
      } else if (l.type === 'shape') {
        const fill = l.fill || '#D4AF37';
        const stroke = l.stroke || 'transparent';
        const sw = l.strokeWidth || 0;
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        const {x,y,w,h} = l;
        ctx.beginPath();
        switch(l.shapeKind) {
          case 'circle': ctx.ellipse(x+w/2,y+h/2,w/2-sw/2,h/2-sw/2,0,0,Math.PI*2); break;
          case 'triangle': ctx.moveTo(x+w/2,y+sw); ctx.lineTo(x+w-sw,y+h-sw); ctx.lineTo(x+sw,y+h-sw); ctx.closePath(); break;
          case 'rounded_rect': ctx.roundRect(x+sw/2,y+sw/2,w-sw,h-sw,16); break;
          case 'diamond': ctx.moveTo(x+w/2,y+sw); ctx.lineTo(x+w-sw,y+h/2); ctx.lineTo(x+w/2,y+h-sw); ctx.lineTo(x+sw,y+h/2); ctx.closePath(); break;
          case 'line': ctx.moveTo(x,y+h/2); ctx.lineTo(x+w,y+h/2); break;
          case 'star': {
            const cx=x+w/2,cy=y+h/2,r1=Math.min(w,h)/2-sw,r2=r1*0.45;
            for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2;const r=i%2===0?r1:r2;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}
            ctx.closePath(); break;
          }
          case 'hexagon': {
            const cx=x+w/2,cy=y+h/2,r=Math.min(w,h)/2-sw;
            for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}
            ctx.closePath(); break;
          }
          default: ctx.rect(x+sw/2,y+sw/2,w-sw,h-sw);
        }
        ctx.fill();
        if (sw > 0) ctx.stroke();
      } else if (l.type === 'text' || l.type === 'button') {
        if (l.type === 'button') {
          const r = l.borderRadius ?? 30;
          ctx.fillStyle = l.bgColor || '#D4AF37';
          ctx.beginPath();
          ctx.roundRect(l.x, l.y, l.w, l.h, r);
          ctx.fill();
        }
        const fontSize = l.fontSize || 48;
        const weight = l.fontWeight || '400';
        const family = (l.fontFamily || 'Roboto, sans-serif').split(',')[0].replace(/['"]/g,'').trim();
        ctx.font = `${weight} ${fontSize}px "${family}"`;
        ctx.fillStyle = l.color || '#FFF';
        ctx.textAlign = (l.textAlign as CanvasTextAlign) || 'center';
        ctx.textBaseline = 'top';
        if (l.letterSpacing) ctx.letterSpacing = `${l.letterSpacing}px`;
        const lineH = (l.lineHeight || 1.3) * fontSize;
        const lines = (l.text || '').split('\n');
        const textX = l.textAlign === 'center' ? l.x + l.w/2 : l.textAlign === 'right' ? l.x + l.w : l.x;
        lines.forEach((line, i) => {
          ctx.fillText(line, textX, l.y + i * lineH, l.w);
        });
      }

      ctx.restore();
    }

    const a = document.createElement('a');
    a.href = cvs.toDataURL('image/png');
    a.download = `tomiori_${canvas.format}.png`;
    a.click();
  };

  const bgStyle: React.CSSProperties = canvas.bgType==='color' ? {background:canvas.bgColor} : canvas.bgType==='gradient' ? {background:canvas.bgGradient} : {backgroundImage:`url(${canvas.bgImage})`,backgroundSize:'cover',backgroundPosition:'center'};
  const sorted = [...canvas.layers].sort((a,b)=>a.zIndex-b.zIndex);

  useEffect(() => {
    const link = document.createElement('link'); link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Roboto&family=Montserrat&family=Raleway&family=Oswald&family=Playfair+Display&family=Merriweather&family=PT+Sans&family=PT+Serif&family=Lora&family=Nunito&family=Rubik&family=Exo+2&family=Comfortaa&family=Lobster&family=Pacifico&family=Ubuntu&family=Fira+Sans&family=Noto+Sans&family=Jost&family=Manrope&family=Inter&family=Mulish&family=Poppins&family=Cormorant&family=EB+Garamond&family=Spectral&family=Libre+Baskerville&family=Tenor+Sans&family=Cormorant+Garamond&family=Cinzel&family=Poiret+One&family=Josefin+Sans&family=Bebas+Neue&family=Anton&family=Russo+One&family=Teko&family=Barlow&family=DM+Sans&family=Space+Grotesk&family=Syne&family=Unbounded&family=Caveat&family=Dancing+Script&family=Open+Sans&family=Philosopher&family=Saira&family=Righteous&family=Dela+Gothic+One&display=swap';
    document.head.appendChild(link);
    // Range slider styles
    const style = document.createElement('style');
    style.textContent = `
      .cb-opacity-slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#D4AF37; border:2px solid #FFF; box-shadow:0 1px 4px rgba(0,0,0,0.3); cursor:pointer; }
      .cb-opacity-slider::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:#D4AF37; border:2px solid #FFF; box-shadow:0 1px 4px rgba(0,0,0,0.3); cursor:pointer; }
      .cb-opacity-slider::-webkit-slider-runnable-track { height:20px; border-radius:10px; }
      .cb-opacity-slider::-moz-range-track { height:20px; border-radius:10px; }
    `;
    document.head.appendChild(style);
    // Load saved images
    try {
      const saved = localStorage.getItem('tomiori_builder_images');
      if (saved) setSavedImages(JSON.parse(saved));
    } catch {}
  }, []);

  // Delete key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key==='Delete'||e.key==='Backspace') && selectedId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) del(selectedId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:'#111'}}>

      {/* LEFT TOOLBAR */}
      <div style={{width:'60px',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 0',gap:'4px',flexShrink:0,borderRight:'1px solid #222'}}>
        {[
          {icon:<Type size={18}/>, title:'Текст', fn:()=>addLayer('text',{text:'Ваш текст',fontSize:60,color:'#FFFFFF',fontFamily:CYRILLIC_FONTS[0].css,textAlign:'center',w:600,h:140})},
          {icon:<Square size={18}/>, title:'Фигура', fn:()=>addLayer('shape',{shapeKind:'rect',fill:'#D4AF37',w:250,h:250})},
          {icon:<ImageIcon size={18}/>, title:'Картинка', fn:()=>imgRef.current?.click()},
          {icon:<AlignCenter size={18}/>, title:'Кнопка', fn:()=>addLayer('button',{text:'Написать нам',fontSize:22,color:'#000',bgColor:'#D4AF37',borderRadius:30,w:340,h:90})},
        ].map((t,i)=>(
          <button key={i} title={t.title} onClick={t.fn} style={{width:'44px',height:'44px',borderRadius:'10px',background:'rgba(255,255,255,0.07)',border:'none',color:'#FFF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}>{t.icon}</button>
        ))}
        <div style={{width:'32px',height:'1px',background:'rgba(255,255,255,0.1)',margin:'6px 0'}}/>
        <button title="Логотип светлый" onClick={()=>addLayer('logo',{src:'/logos/light_logo.png',w:320,h:110,objectFit:'contain'})} style={{width:'44px',height:'44px',borderRadius:'10px',background:'rgba(255,255,255,0.07)',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1px'}}>
          <span style={{fontSize:'7px',color:'#D4AF37',fontWeight:'800'}}>LOGO</span><span style={{fontSize:'7px',color:'#888'}}>light</span>
        </button>
        <button title="Логотип тёмный" onClick={()=>addLayer('logo',{src:'/logos/dark_logo.png',w:320,h:110,objectFit:'contain'})} style={{width:'44px',height:'44px',borderRadius:'10px',background:'rgba(255,255,255,0.07)',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1px'}}>
          <span style={{fontSize:'7px',color:'#D4AF37',fontWeight:'800'}}>LOGO</span><span style={{fontSize:'7px',color:'#555'}}>dark</span>
        </button>
        <input ref={imgRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleImg}/>
      </div>

      {/* CANVAS */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'16px',overflowY:'auto',background:'#1A1A1A'}}>
        <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap',justifyContent:'center'}}>
          {FORMATS.map(f=>(
            <button key={f.id} onClick={()=>setCanvas(c=>({...c,format:f.id}))} style={{padding:'5px 14px',borderRadius:'20px',border:'none',background:canvas.format===f.id?'#D4AF37':'rgba(255,255,255,0.1)',color:canvas.format===f.id?'#000':'#FFF',fontSize:'0.72rem',fontWeight:'700',cursor:'pointer'}}>{f.icon} {f.label}</button>
          ))}
          <button onClick={exportPng} style={{padding:'5px 16px',borderRadius:'20px',border:'none',background:'#10B981',color:'#FFF',fontSize:'0.72rem',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}><Download size={13}/> PNG</button>
        </div>
        <div ref={canvasRef} onMouseDown={e=>{ if(e.target===canvasRef.current) setSelectedId(null); }} style={{position:'relative',width:cw,height:ch,flexShrink:0,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.6)',...bgStyle}}>          {sorted.map(l=>(
            <LayerEl key={l.id} l={l} selected={selectedId===l.id}
              onSelect={()=>{ setSelectedId(l.id); setRightTab('props'); }}
              onUpdate={p=>upd(l.id,p)}
            />
          ))}
        </div>
        <div style={{marginTop:'10px',fontSize:'0.65rem',color:'rgba(255,255,255,0.3)'}}>Кликни объект → тяни за углы для resize · Delete = удалить</div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{width:'290px',background:'#FFF',borderLeft:'1px solid #EEE',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:'1px solid #EEE',flexShrink:0}}>
          {([['props','⚙️ Свойства'],['layers','📋 Слои'],['bg','🎨 Фон'],['images','🖼 Медиа']] as [typeof rightTab, string][]).map(([id,label])=>(
            <button key={id} onClick={()=>setRightTab(id)} style={{flex:1,padding:'9px 1px',border:'none',background:rightTab===id?'#F9F9FB':'#FFF',fontSize:'0.58rem',fontWeight:'700',cursor:'pointer',borderBottom:rightTab===id?'2px solid #D4AF37':'2px solid transparent',color:rightTab===id?'#000':'#888'}}>{label}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {rightTab==='bg' && <BgPanel canvas={canvas} setCanvas={setCanvas} bgImgRef={bgImgRef} onBgImage={handleBgImg}/>}
          {rightTab==='layers' && <LayersPanel layers={canvas.layers} selectedId={selectedId} onSelect={(id:string)=>{setSelectedId(id);setRightTab('props');}} onDelete={del} onDuplicate={dup} onMoveUp={moveLayerUp} onMoveDown={moveLayerDown} onToggleVisible={(id:string)=>upd(id,{visible:!canvas.layers.find(l=>l.id===id)?.visible})} onToggleLock={(id:string)=>upd(id,{locked:!canvas.layers.find(l=>l.id===id)?.locked})}/>}
          {rightTab==='props' && selected && <PropsPanel key={selected.id} layer={selected} onChange={selectedOnChange}/>}
          {rightTab==='props' && !selected && <div style={{textAlign:'center',opacity:0.35,marginTop:'50px',fontSize:'0.85rem',lineHeight:1.6}}>Кликни на объект<br/>на холсте</div>}
          {rightTab==='images' && <ImagesPanel savedImages={savedImages} onInsert={src=>addLayer('image',{src,w:400,h:400})} onUpload={()=>imgRef.current?.click()} onDelete={id=>{const updated=savedImages.filter(i=>i.id!==id);setSavedImages(updated);try{localStorage.setItem('tomiori_builder_images',JSON.stringify(updated));}catch{}}} onOpenMediaLib={()=>setShowMediaLib(true)}/>}
        </div>
      </div>

      {/* Media Library Modal */}
      {showMediaLib && (
        <MediaLibrary
          modal={true}
          multi={true}
          onClose={() => setShowMediaLib(false)}
          onMultiSelect={mediaItems => {
            mediaItems.forEach(item => {
              if (item.type === 'image') addLayer('image', { src: item.url, w: 400, h: 400 });
            });
            setShowMediaLib(false);
          }}
          onSelect={item => {
            if (item.type === 'image') addLayer('image', { src: item.url, w: 400, h: 400 });
            setShowMediaLib(false);
          }}
        />
      )}
    </div>
  );
}

// ── IMAGES PANEL ───────────────────────────────────────────────────────────
function ImagesPanel({ savedImages, onInsert, onUpload, onDelete, onOpenMediaLib }: {
  savedImages: {id:string;src:string;name:string;ts:number}[];
  onInsert: (src:string) => void;
  onUpload: () => void;
  onDelete: (id:string) => void;
  onOpenMediaLib?: () => void;
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={onUpload} style={{flex:1,padding:'10px',borderRadius:'10px',border:'2px dashed #D4AF37',background:'rgba(212,175,55,0.05)',cursor:'pointer',fontSize:'0.75rem',fontWeight:'700',color:'#D4AF37',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          <ImageIcon size={14}/> Загрузить
        </button>
        <button onClick={onOpenMediaLib} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1px solid #EEE',background:'#F8F9FA',cursor:'pointer',fontSize:'0.75rem',fontWeight:'700',color:'#555',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          <Library size={14}/> Медиатека
        </button>
      </div>

      {savedImages.length === 0 ? (
        <div style={{textAlign:'center',opacity:0.35,fontSize:'0.8rem',marginTop:'20px',lineHeight:1.6}}>
          Загруженные картинки<br/>появятся здесь
        </div>
      ) : (
        <>
          <div style={{fontSize:'0.6rem',fontWeight:'800',opacity:0.4,letterSpacing:'1px'}}>СОХРАНЁННЫЕ — {savedImages.length} шт.</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {savedImages.map(img => (
              <div key={img.id} style={{position:'relative',borderRadius:'10px',overflow:'hidden',aspectRatio:'1',background:'#F1F3F5',border:'1px solid #EEE',cursor:'pointer',transition:'transform 0.1s'}}
                onClick={()=>onInsert(img.src)}
                title={img.name}
              >
                <img src={img.src} alt={img.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0)',transition:'background 0.15s',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,0,0,0.35)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(0,0,0,0)')}
                >
                  <span style={{color:'#FFF',fontSize:'0.65rem',fontWeight:'700',opacity:0,transition:'opacity 0.15s'}}
                    onMouseEnter={e=>{(e.currentTarget.style.opacity='1');}}
                    onMouseLeave={e=>{(e.currentTarget.style.opacity='0');}}
                  >Вставить</span>
                </div>
                <button
                  onClick={e=>{e.stopPropagation();onDelete(img.id);}}
                  style={{position:'absolute',top:'4px',right:'4px',width:'18px',height:'18px',borderRadius:'50%',background:'rgba(239,68,68,0.9)',border:'none',color:'#FFF',fontSize:'10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}
                >×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── BG PANEL ───────────────────────────────────────────────────────────────
function BgPanel({ canvas, setCanvas, bgImgRef, onBgImage }: any) {
  const PRESETS = ['#0C4A4F','#1A5230','#000000','#1A1A2E','#2D1B69','#8B0000','#0D1B4B','#F5F5F5','#FFF8F0','#D4AF37','#1C1C1C','#2C2C2C'];
  const GRADS = ['linear-gradient(135deg,#0C4A4F,#1A5230)','linear-gradient(135deg,#000,#1A1A1A)','linear-gradient(135deg,#0D1B4B,#1A0533)','linear-gradient(135deg,#8B0000,#2D0000)','linear-gradient(135deg,#D4AF37,#8B6914)','linear-gradient(180deg,#0C4A4F,#000)','linear-gradient(135deg,#1A5230,#0C4A4F,#000)','radial-gradient(circle,#1A5230,#000)','linear-gradient(135deg,#0D1B4B,#D4AF37)','linear-gradient(180deg,#000,#1A5230)'];
  const lbl = (t: string) => <div style={{fontSize:'0.6rem',fontWeight:'800',opacity:0.4,letterSpacing:'1px',marginBottom:'8px',textTransform:'uppercase'}}>{t}</div>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      {lbl('Тип фона')}
      <div style={{display:'flex',gap:'6px'}}>
        {[['color','Цвет'],['gradient','Градиент'],['image','Картинка']].map(([v,l])=>(
          <button key={v} onClick={()=>setCanvas((c:CanvasState)=>({...c,bgType:v as any}))} style={{flex:1,padding:'6px',borderRadius:'8px',border:canvas.bgType===v?'1.5px solid #D4AF37':'1px solid #EEE',background:canvas.bgType===v?'#000':'#FFF',color:canvas.bgType===v?'#D4AF37':'#555',fontSize:'0.7rem',fontWeight:'700',cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      {canvas.bgType==='color' && <>
        {lbl('Цвет')}
        <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'6px'}}>
          {PRESETS.map(c=><button key={c} onClick={()=>setCanvas((cv:CanvasState)=>({...cv,bgColor:c}))} style={{width:'26px',height:'26px',borderRadius:'6px',background:c,border:canvas.bgColor===c?'2px solid #D4AF37':'1px solid rgba(0,0,0,0.1)',cursor:'pointer'}}/>)}
        </div>
        <input type="color" value={canvas.bgColor} onChange={e=>setCanvas((c:CanvasState)=>({...c,bgColor:e.target.value}))} style={{width:'100%',height:'34px',borderRadius:'8px',border:'1px solid #EEE',cursor:'pointer'}}/>
      </>}
      {canvas.bgType==='gradient' && <>
        {lbl('Градиент')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
          {GRADS.map((g,i)=><button key={i} onClick={()=>setCanvas((c:CanvasState)=>({...c,bgGradient:g}))} style={{height:'38px',borderRadius:'8px',background:g,border:canvas.bgGradient===g?'2px solid #D4AF37':'1px solid transparent',cursor:'pointer'}}/>)}
        </div>
        <input type="text" value={canvas.bgGradient} onChange={e=>setCanvas((c:CanvasState)=>({...c,bgGradient:e.target.value}))} style={{width:'100%',marginTop:'6px',padding:'6px 10px',borderRadius:'8px',border:'1px solid #EEE',fontSize:'0.7rem',boxSizing:'border-box'}} placeholder="CSS gradient..."/>
      </>}
      {canvas.bgType==='image' && <>
        <button onClick={()=>bgImgRef.current?.click()} style={{width:'100%',padding:'14px',borderRadius:'10px',border:'2px dashed #EEE',background:'#F9F9FB',cursor:'pointer',fontSize:'0.8rem'}}>📁 Загрузить фон</button>
        <input ref={bgImgRef} type="file" accept="image/*" style={{display:'none'}} onChange={onBgImage}/>
      </>}
    </div>
  );
}

// ── LAYERS PANEL ───────────────────────────────────────────────────────────
function LayersPanel({ layers, selectedId, onSelect, onDelete, onDuplicate, onMoveUp, onMoveDown, onToggleVisible, onToggleLock }: any) {
  const sorted = [...layers].sort((a:Layer,b:Layer)=>b.zIndex-a.zIndex);
  const ICONS: Record<LayerType,string> = {text:'T',image:'🖼',shape:'◆',button:'⬭',logo:'★'};
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
      <div style={{fontSize:'0.6rem',fontWeight:'800',opacity:0.4,letterSpacing:'1px',marginBottom:'6px'}}>СЛОИ — {layers.length} объектов</div>
      {sorted.length===0 && <div style={{textAlign:'center',opacity:0.3,fontSize:'0.8rem',marginTop:'30px'}}>Добавьте объекты с панели слева</div>}
      {sorted.map((l:Layer)=>{
        const isSel = selectedId===l.id;
        return (
          <div key={l.id} onClick={()=>onSelect(l.id)} style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 8px',borderRadius:'10px',background:isSel?'#000':'#F9F9FB',border:isSel?'1px solid #D4AF37':'1px solid #EEE',cursor:'pointer',transition:'all 0.1s'}}>
            <span style={{fontSize:'0.7rem',width:'16px',textAlign:'center',color:isSel?'#D4AF37':'#888',flexShrink:0}}>{ICONS[l.type as LayerType]||'?'}</span>
            <span style={{flex:1,fontSize:'0.7rem',fontWeight:'600',color:isSel?'#FFF':'#333',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.text||l.type}</span>
            {(l.opacity !== undefined && l.opacity < 1) && (
              <span style={{fontSize:'0.6rem',color:isSel?'rgba(255,255,255,0.5)':'#AAA',flexShrink:0}}>{Math.round(l.opacity*100)}%</span>
            )}
            <button onClick={e=>{e.stopPropagation();onToggleVisible(l.id);}} title="Видимость" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:l.visible===false?'#CCC':isSel?'#FFF':'#888',flexShrink:0}}>{l.visible===false?<EyeOff size={11}/>:<Eye size={11}/>}</button>
            <button onClick={e=>{e.stopPropagation();onToggleLock(l.id);}} title="Заблокировать" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:l.locked?'#D4AF37':isSel?'#FFF':'#888',flexShrink:0}}>{l.locked?<Lock size={11}/>:<Unlock size={11}/>}</button>
            <button onClick={e=>{e.stopPropagation();onMoveUp(l.id);}} title="Выше" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:isSel?'#FFF':'#888',flexShrink:0}}><ChevronUp size={11}/></button>
            <button onClick={e=>{e.stopPropagation();onMoveDown(l.id);}} title="Ниже" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:isSel?'#FFF':'#888',flexShrink:0}}><ChevronDown size={11}/></button>
            <button onClick={e=>{e.stopPropagation();onDuplicate(l.id);}} title="Дублировать" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:isSel?'#FFF':'#888',flexShrink:0}}><Copy size={11}/></button>
            <button onClick={e=>{e.stopPropagation();onDelete(l.id);}} title="Удалить" style={{background:'none',border:'none',cursor:'pointer',padding:'2px',color:'#EF4444',flexShrink:0}}><Trash2 size={11}/></button>
          </div>
        );
      })}
    </div>
  );
}

// ── PROPS PANEL ────────────────────────────────────────────────────────────
function PropsPanel({ layer, onChange }: { layer: Layer; onChange: (p: Partial<Layer>) => void }) {
  const S = (label: string) => <div style={{fontSize:'0.6rem',fontWeight:'800',opacity:0.35,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px'}}>{label}</div>;
  const Inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} style={{width:'100%',padding:'5px 8px',borderRadius:'7px',border:'1px solid #EEE',fontSize:'0.78rem',boxSizing:'border-box',...props.style}}/>;
  const G2 = ({children}:{children:React.ReactNode}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>{children}</div>;
  const Blk = ({children}:{children:React.ReactNode}) => <div style={{marginBottom:'10px'}}>{children}</div>;

  return (
    <div>
      <div style={{fontSize:'0.6rem',fontWeight:'800',opacity:0.35,letterSpacing:'1px',marginBottom:'8px'}}>ПОЗИЦИЯ</div>
      <G2>
        <div>{S('X')}<Inp type="number" value={Math.round(layer.x)} onChange={e=>onChange({x:+e.target.value})}/></div>
        <div>{S('Y')}<Inp type="number" value={Math.round(layer.y)} onChange={e=>onChange({y:+e.target.value})}/></div>
      </G2>
      <G2>
        <div>{S('Поворот°')}<Inp type="number" value={layer.rotation||0} onChange={e=>onChange({rotation:+e.target.value})}/></div>
        <div>{S('Прозрачность')}<Inp type="number" min={0} max={1} step={0.05} value={layer.opacity??1} onChange={e=>onChange({opacity:+e.target.value})}/></div>
      </G2>

      {/* Opacity slider — always visible for all layer types */}
      <div style={{marginBottom:'12px'}}>
        {S('Прозрачность')}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'4px'}}>
          <div style={{flex:1,position:'relative',height:'20px',display:'flex',alignItems:'center'}}>
            {/* Track background — checkerboard to show transparency */}
            <div style={{position:'absolute',inset:0,borderRadius:'10px',background:'repeating-conic-gradient(#CCC 0% 25%, #FFF 0% 50%) 0 0 / 10px 10px',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,borderRadius:'10px',background:`linear-gradient(to right, transparent, ${layer.fill||layer.bgColor||layer.color||'#D4AF37'})`}}/>
            </div>
            <input
              type="range" min={0} max={1} step={0.01}
              value={layer.opacity ?? 1}
              onChange={e => onChange({ opacity: +e.target.value })}
              className="cb-opacity-slider"
              style={{position:'relative',width:'100%',height:'20px',appearance:'none',background:'transparent',cursor:'pointer',zIndex:1}}
            />
          </div>
          <div style={{width:'38px',textAlign:'center',fontSize:'0.75rem',fontWeight:'700',color:'#333',flexShrink:0}}>
            {Math.round((layer.opacity ?? 1) * 100)}%
          </div>
        </div>
      </div>

      {(layer.type==='text'||layer.type==='button') && <>
        <Blk>
          <div style={{padding:'8px 10px',borderRadius:'8px',background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',fontSize:'0.72rem',color:'#8B6914',display:'flex',alignItems:'center',gap:'6px'}}>
            ✏️ Двойной клик по тексту на холсте для редактирования
          </div>
        </Blk>
        <Blk>{S('Шрифт')}<select value={layer.fontFamily||CYRILLIC_FONTS[0].css} onChange={e=>onChange({fontFamily:e.target.value})} style={{width:'100%',padding:'5px 8px',borderRadius:'7px',border:'1px solid #EEE',fontSize:'0.78rem'}}>
          {CYRILLIC_FONTS.map(f=><option key={f.name} value={f.css}>{f.name}</option>)}
        </select></Blk>
        <G2>
          <div>{S('Размер')}<Inp type="number" value={layer.fontSize||48} onChange={e=>onChange({fontSize:+e.target.value})}/></div>
          <div>{S('Цвет')}<Inp type="color" value={layer.color||'#FFFFFF'} onChange={e=>onChange({color:e.target.value})} style={{height:'32px',padding:'2px'}}/></div>
        </G2>
        <G2>
          <div>{S('Жирность')}<select value={layer.fontWeight||'400'} onChange={e=>onChange({fontWeight:e.target.value})} style={{width:'100%',padding:'5px',borderRadius:'7px',border:'1px solid #EEE',fontSize:'0.75rem'}}>
            {['100','200','300','400','500','600','700','800','900'].map(w=><option key={w} value={w}>{w}</option>)}
          </select></div>
          <div>{S('Выравнивание')}<select value={layer.textAlign||'center'} onChange={e=>onChange({textAlign:e.target.value as any})} style={{width:'100%',padding:'5px',borderRadius:'7px',border:'1px solid #EEE',fontSize:'0.75rem'}}>
            <option value="left">Лево</option><option value="center">Центр</option><option value="right">Право</option>
          </select></div>
        </G2>
        <G2>
          <div>{S('Межбуквенный')}<Inp type="number" value={layer.letterSpacing||0} step={0.5} onChange={e=>onChange({letterSpacing:+e.target.value})}/></div>
          <div>{S('Межстрочный')}<Inp type="number" value={layer.lineHeight||1.3} step={0.1} onChange={e=>onChange({lineHeight:+e.target.value})}/></div>
        </G2>
      </>}

      {layer.type==='button' && <>
        <G2>
          <div>{S('Фон кнопки')}<Inp type="color" value={layer.bgColor||'#D4AF37'} onChange={e=>onChange({bgColor:e.target.value})} style={{height:'32px',padding:'2px'}}/></div>
          <div>{S('Скругление')}<Inp type="number" value={layer.borderRadius??30} onChange={e=>onChange({borderRadius:+e.target.value})}/></div>
        </G2>
      </>}

      {layer.type==='shape' && <>
        <Blk>{S('Тип фигуры')}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
            {([['rect','▭'],['rounded_rect','▢'],['circle','●'],['triangle','▲'],['star','★'],['diamond','◆'],['hexagon','⬡'],['line','—']] as [ShapeKind,string][]).map(([v,icon])=>(
              <button key={v} onClick={()=>onChange({shapeKind:v})} style={{padding:'7px 2px',borderRadius:'7px',border:layer.shapeKind===v?'1.5px solid #D4AF37':'1px solid #EEE',background:layer.shapeKind===v?'#000':'#FFF',color:layer.shapeKind===v?'#D4AF37':'#555',fontSize:'1rem',cursor:'pointer'}}>{icon}</button>
            ))}
          </div>
        </Blk>
        <G2>
          <div>{S('Заливка')}<Inp type="color" value={layer.fill||'#D4AF37'} onChange={e=>onChange({fill:e.target.value})} style={{height:'32px',padding:'2px'}}/></div>
          <div>{S('Обводка')}<Inp type="color" value={layer.stroke||'#000000'} onChange={e=>onChange({stroke:e.target.value})} style={{height:'32px',padding:'2px'}}/></div>
        </G2>
        <Blk>{S('Толщина обводки')}<Inp type="number" value={layer.strokeWidth||0} onChange={e=>onChange({strokeWidth:+e.target.value})}/></Blk>
      </>}

      {(layer.type==='image'||layer.type==='logo') && <>
        <Blk>{S('Подгонка изображения')}<select value={layer.objectFit||'contain'} onChange={e=>onChange({objectFit:e.target.value as any})} style={{width:'100%',padding:'5px 8px',borderRadius:'7px',border:'1px solid #EEE',fontSize:'0.78rem'}}>
          <option value="contain">Вписать</option><option value="cover">Заполнить</option>
        </select></Blk>
      </>}
    </div>
  );
}
