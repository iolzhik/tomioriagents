'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, TrendingUp, Layout, Image as ImageIcon, 
  MessageSquare, Settings, Share2, Layers, Zap, Clock, ChevronRight,
  ArrowLeft, Loader2, Download, Printer, ShieldCheck, Heart, ShoppingBag,
  Target, BarChart3, Palette, History, Search, FileText, Smartphone, Globe,
  Link as LinkIcon, Eye, CheckCircle2, AlertCircle, Plus, Megaphone, Workflow,
  SearchCode, UserPlus, Info, Scissors, Maximize, Copy, Mail, MapPin, PhoneCall,
  User, Bot, Upload, FileUp, X, ChevronDown, ChevronUp, Database, ExternalLink, RefreshCw, LogOut
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CreativeBuilder from '../../components/CreativeBuilder';
import InstagramPublisher from '../../components/InstagramPublisher';

// --- Nano Banana Panel Component ---
const SCENE_TYPES = [
  {
    value: 'nature',
    label: 'Природа',
    sub: 'Тёмно-зелёный фон, мох, листья',
    img: '/templatezz/photo_2026-03-27_00-10-36.jpg',
    color: '#0F3B25',
  },
  {
    value: 'editorial',
    label: 'На человеке',
    sub: 'Editorial, драматичный свет',
    img: '/templatezz/photo_2026-03-27_00-10-32.jpg',
    color: '#1A2A3A',
  },
  {
    value: 'neutral',
    label: 'Изделие',
    sub: 'Тёмный бархат, нейтральный фон',
    img: '/templatezz/photo_2026-03-27_00-10-15.jpg',
    color: '#0C4A4F',
  },
];

const PRODUCTS_NB = [
  { v: 'ring',            l: '💍 Кольцо' },
  { v: 'engagement_ring', l: '💍 Помолвочное' },
  { v: 'wedding_band',    l: '🤍 Обручальное' },
  { v: 'necklace',        l: '📿 Колье' },
  { v: 'pendant',         l: '🔮 Подвеска' },
  { v: 'earrings_studs',  l: '✨ Пуссеты' },
  { v: 'earrings_drop',   l: '💧 Серьги-капли' },
  { v: 'earrings_hoop',   l: '⭕ Серьги-кольца' },
  { v: 'bracelet',        l: '⌚ Браслет' },
  { v: 'tennis_bracelet', l: '�� Теннисный' },
  { v: 'brooch',          l: '🌸 Брошь' },
  { v: 'tiara',           l: '👑 Тиара' },
  { v: 'set',             l: '🎁 Комплект' },
];

function NbPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: '30px',
      border: active ? '1.5px solid #D4AF37' : '1.5px solid #E5E5E5',
      background: active ? '#000' : '#FFF',
      color: active ? '#D4AF37' : '#555',
      fontSize: '0.75rem', fontWeight: active ? '700' : '500',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
      boxShadow: active ? '0 2px 12px rgba(212,175,55,0.18)' : 'none',
    }}>{label}</button>
  );
}

function NbSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>{children}</div>
    </div>
  );
}

function NanoBananaPanel({ params, setParams, onGenerate, isLoading, history, onHistoryClick }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box" style={{ background: 'rgba(252,211,77,0.08)', borderColor: 'rgba(252,211,77,0.25)', marginBottom: 0 }}>
        <Palette size={15} color="#D4AF37" /> Конструктор промптов — Nano Banana AI
      </div>

      {/* ── ТИП СЦЕНЫ — главный выбор ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🎬 Тип сцены</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {SCENE_TYPES.map(s => (
            <button key={s.value} onClick={() => setParams({...params, sceneType: s.value})}
              style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '2/3',
                border: params.sceneType === s.value ? '2.5px solid #D4AF37' : '2px solid transparent',
                cursor: 'pointer', padding: 0, background: s.color,
                boxShadow: params.sceneType === s.value ? '0 0 0 3px rgba(212,175,55,0.25), 0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}>
              <img src={s.img} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: params.sceneType === s.value ? 1 : 0.6, transition: 'opacity 0.2s' }} />
              <div style={{ position: 'absolute', inset: 0, background: params.sceneType === s.value ? 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' : 'linear-gradient(transparent 20%, rgba(0,0,0,0.85))' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 8px 10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: params.sceneType === s.value ? '#D4AF37' : '#FFF', textAlign: 'center' }}>{s.label}</div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '2px', lineHeight: 1.3 }}>{s.sub}</div>
              </div>
              {params.sceneType === s.value && (
                <div style={{ position: 'absolute', top: '7px', right: '7px', width: '20px', height: '20px', borderRadius: '50%', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={12} color="#000" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── ИЗДЕЛИЕ ── */}
      <NbSection label="💎 Изделие">
        {PRODUCTS_NB.map(o => <NbPill key={o.v} label={o.l} active={params.product === o.v} onClick={() => setParams({...params, product: o.v})} />)}
      </NbSection>

      <div className="param-input">
        <label>📝 Описание изделия</label>
        <input className="luxury-input" placeholder="Напр: золото 18к, бриллиант 2ct VS1, огранка принцесса..." value={params.productDescription} onChange={e => setParams({...params, productDescription: e.target.value})} />
      </div>

      {/* ── ФОТО ИЗДЕЛИЯ И ЛОГОТИПА (НОВОЕ) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>📸 Фото изделия</span>
          <div style={{ position: 'relative', height: '100px', borderRadius: '12px', border: '2px dashed #EEE', background: params.productImage ? '#F8F9FA' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {params.productImage ? (
              <>
                <img src={params.productImage} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <button onClick={() => setParams({...params, productImage: ''})} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: '#FFF', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12}/></button>
              </>
            ) : (
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <Upload size={18} opacity={0.3} />
                <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Загрузить</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setParams({...params, productImage: ev.target?.result as string});
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🏷 Логотип</span>
          <div style={{ position: 'relative', height: '100px', borderRadius: '12px', border: '2px dashed #EEE', background: params.logoImage ? '#F8F9FA' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {params.logoImage ? (
              <>
                <img src={params.logoImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <button onClick={() => setParams({...params, logoImage: ''})} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: '#FFF', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12}/></button>
              </>
            ) : (
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <Upload size={18} opacity={0.3} />
                <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Загрузить</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setParams({...params, logoImage: ev.target?.result as string});
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ── ФОКУС ── */}
      <NbSection label="🔍 Фокус камеры">
        {[
          { v: 'macro_stones',    l: '🔬 Макро огранка' },
          { v: 'macro_metal',     l: '🪨 Макро металл' },
          { v: 'full_jewel',      l: '📷 Всё изделие' },
          { v: 'sparkle_bokeh',   l: '✨ Блеск + боке' },
          { v: 'worn_context',    l: '👁 На теле' },
          { v: 'lifestyle_scene', l: '🌆 Лайфстайл' },
          { v: 'detail_setting',  l: '⚙️ Закрепка' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.focus === o.v} onClick={() => setParams({...params, focus: o.v})} />)}
      </NbSection>

      {/* ── КАДР ── */}
      <NbSection label="🖼 Формат кадра">
        {[
          { v: 'portrait_9x16', l: '📱 9:16 Reels' },
          { v: 'square_1x1',    l: '⬜ 1:1 Пост' },
          { v: 'portrait_4x5',  l: '📸 4:5 IG' },
          { v: 'landscape_16x9',l: '🖥 16:9 Баннер' },
          { v: 'cinematic_21x9',l: '🎬 21:9 Кино' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.frame === o.v} onClick={() => setParams({...params, frame: o.v})} />)}
      </NbSection>

      {/* ── ЦВЕТОВАЯ ГАММА ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🎨 Цветовая гамма</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {[
            { v: 'tomiori_dark_green', l: 'Tomiori Зелёный',  c1: '#0C4A4F', c2: '#1A5230' },
            { v: 'black_gold',         l: 'Чёрный + Золото',  c1: '#000',    c2: '#D4AF37' },
            { v: 'forest_emerald',     l: 'Лес + Изумруд',    c1: '#0F3B25', c2: '#50C878' },
            { v: 'deep_navy_gold',     l: 'Синий + Золото',   c1: '#0D1B4B', c2: '#D4AF37' },
            { v: 'white_gold',         l: 'Белый + Золото',   c1: '#F5F5F5', c2: '#D4AF37' },
            { v: 'ruby_gold',          l: 'Рубин + Золото',   c1: '#8B0000', c2: '#D4AF37' },
            { v: 'sapphire_gold',      l: 'Сапфир + Золото',  c1: '#0F2B6B', c2: '#D4AF37' },
            { v: 'amethyst_gold',      l: 'Аметист + Золото', c1: '#4B0082', c2: '#D4AF37' },
            { v: 'rose_gold_blush',    l: 'Розовое золото',   c1: '#F4C2C2', c2: '#B76E79' },
            { v: 'champagne',          l: 'Шампань',          c1: '#F7E7CE', c2: '#C9A96E' },
            { v: 'platinum_ice',       l: 'Платина + Лёд',    c1: '#E8E8E8', c2: '#B0C4DE' },
            { v: 'onyx_silver',        l: 'Оникс + Серебро',  c1: '#1C1C1C', c2: '#C0C0C0' },
            { v: 'burgundy_gold',      l: 'Бордо + Золото',   c1: '#6B1A2A', c2: '#D4AF37' },
            { v: 'teal_gold',          l: 'Бирюза + Золото',  c1: '#008080', c2: '#D4AF37' },
            { v: 'coral_gold',         l: 'Коралл + Золото',  c1: '#FF6B6B', c2: '#D4AF37' },
            { v: 'monochrome_black',   l: 'Монохром чёрный',  c1: '#111',    c2: '#444' },
          ].map(o => (
            <button key={o.v} onClick={() => setParams({...params, colorPalette: o.v})}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px 6px 8px',
                borderRadius: '30px', border: params.colorPalette === o.v ? '1.5px solid #D4AF37' : '1.5px solid #E5E5E5',
                background: params.colorPalette === o.v ? '#000' : '#FFF',
                color: params.colorPalette === o.v ? '#D4AF37' : '#555',
                fontSize: '0.72rem', fontWeight: params.colorPalette === o.v ? '700' : '500',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <span style={{ display: 'flex', borderRadius: '50%', overflow: 'hidden', width: '14px', height: '14px', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}>
                <span style={{ width: '7px', height: '14px', background: o.c1 }} />
                <span style={{ width: '7px', height: '14px', background: o.c2 }} />
              </span>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── МЕТАЛЛ ── */}
      <NbSection label="🥇 Тон металла">
        {[
          { v: 'yellow_gold',  l: '🟡 Жёлтое золото' },
          { v: 'white_gold',   l: '⚪ Белое золото' },
          { v: 'rose_gold',    l: '🌸 Розовое золото' },
          { v: 'platinum',     l: '🔘 Платина' },
          { v: 'silver',       l: '⚫ Серебро' },
          { v: 'blackened',    l: '🖤 Чернёное' },
          { v: 'mixed',        l: '🔀 Комбо' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.metalTone === o.v} onClick={() => setParams({...params, metalTone: o.v})} />)}
      </NbSection>

      {/* ── ОСВЕЩЕНИЕ ── */}
      <NbSection label="💡 Освещение">
        {[
          { v: 'studio_soft',      l: '�� Студийный мягкий' },
          { v: 'dramatic_side',    l: '🎭 Драматичный' },
          { v: 'natural_forest',   l: '🌿 Лесной рассеянный' },
          { v: 'rim_light',        l: '💫 Контровой' },
          { v: 'golden_hour',      l: '🌅 Золотой час' },
          { v: 'low_key',          l: '🌑 Low-key тёмный' },
          { v: 'backlit_sparkle',  l: '✨ Подсветка + блеск' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.lighting === o.v} onClick={() => setParams({...params, lighting: o.v})} />)}
      </NbSection>

      {/* ── НАСТРОЕНИЕ ── */}
      <NbSection label="✨ Настроение">
        {[
          { v: 'elite_desire',     l: '👑 Элитное желание' },
          { v: 'romantic',         l: '❤️ Романтика' },
          { v: 'mysterious',       l: '🌙 Таинственность' },
          { v: 'bridal',           l: '👰 Свадебное' },
          { v: 'nature_serenity',  l: '�� Природная серенность' },
          { v: 'power_editorial',  l: '⚡ Сила / Editorial' },
          { v: 'gift_moment',      l: '🎁 Момент подарка' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.mood === o.v} onClick={() => setParams({...params, mood: o.v})} />)}
      </NbSection>

      {/* ── ТЕКСТ НА ИЗОБРАЖЕНИИ ── */}
      <NbSection label="🏷 Текст / Оверлей">
        {[
          { v: 'logo_top',          l: '✨ Только логотип' },
          { v: 'logo_price',        l: '💰 Логотип + цена' },
          { v: 'logo_tagline',      l: '📝 Логотип + слоган' },
          { v: 'logo_product_name', l: '💎 Логотип + название' },
          { v: 'logo_cta',          l: '📲 Логотип + CTA' },
          { v: 'minimal_no_text',   l: '🚫 Без текста' },
        ].map(o => <NbPill key={o.v} label={o.l} active={params.textOverlay === o.v} onClick={() => setParams({...params, textOverlay: o.v})} />)}
      </NbSection>

      {params.textOverlay !== 'logo_top' && params.textOverlay !== 'minimal_no_text' && (
        <div className="param-input">
          <label>✏️ Текст для надписи</label>
          <input className="luxury-input" placeholder="Напр: от 450 000 ₸ / Eternal Collection / DM для заказа..." value={params.textContent} onChange={e => setParams({...params, textContent: e.target.value})} />
        </div>
      )}

      <div className="param-input">
        <label>📌 Дополнительные пожелания</label>
        <textarea className="luxury-input" style={{ height: '55px', resize: 'none' }} placeholder="Особые детали, референс, настроение..." value={params.extraNotes} onChange={e => setParams({...params, extraNotes: e.target.value})} />
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !params.product || !params.sceneType}
        style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 100%)', color: '#000', border: 'none', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (!params.product || !params.sceneType) ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        {isLoading ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />}
        СОЗДАТЬ ПРОМПТ
      </button>

      {history.length > 0 && (
        <div style={{ borderTop: '1px solid #EEE', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '8px' }}><History size={14} /> ИСТОРИЯ</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {history.slice(0, 5).map((h: any) => (
              <div key={h.id} className="history-item" onClick={() => onHistoryClick(h.content)}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{h.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Components ---

const AI_MODULES = [
  { id: 'captions', name: 'Конструктор описаний', icon: <MessageSquare size={20} />, color: '#D4AF37', desc: 'Генерация постов с авто-подстановкой контактов' },
  { id: 'nano_banana', name: '🍌 Nano Banana ИИ', icon: <Palette size={20} />, color: '#FCD34D', desc: 'Конструктор промптов по фирменному стилю Tomiori' },
  { id: 'creative_builder', name: '🎨 Конструктор креативов', icon: <Layout size={20} />, color: '#EC4899', desc: 'Canva-редактор для постов и сторис Instagram' },
  { id: 'meta_ads', name: 'Meta Ads Консультант', icon: <Target size={20} />, color: '#1877F2', desc: 'Полная настройка рекламы FB/IG от А до Я' },
  { id: 'content_plan', name: 'Генератор контент-плана', icon: <Layout size={20} />, color: '#6366F1', desc: 'Стратегия постов, рилсов и сторис' },
  { id: 'funnel', name: 'Архитектор воронок', icon: <Workflow size={20} />, color: '#8B5CF6', desc: 'Визуальные пошаговые воронки продаж' },
  { id: 'trends', name: 'Анализатор трендов', icon: <TrendingUp size={20} />, color: '#10B981', desc: 'ИИ-агенты по ювелирным новостям 2026' },
  { id: 'competitor', name: 'Анализ конкурентов', icon: <SearchCode size={20} />, color: '#EF4444', desc: 'Анализ Instagram и сайтов по ссылке' },
  { id: 'chat_bot', name: 'Чат-бот Tomiori', icon: <Bot size={20} />, color: '#000', desc: 'Ответы на любые вопросы по бренду из Memory Bank' },
  { id: 'rag_learn', name: 'Дообучение ИИ', icon: <Zap size={20} />, color: '#D4AF37', desc: 'Загрузка PDF/Excel/Word в Memory Bank' },
  { id: 'reels_director', name: '🎬 Reels Director', icon: <Scissors size={20} />, color: '#E1306C', desc: 'Профессиональная режиссура, свет и сценарии Reels' },
  { id: 'stories_architect', name: '📱 Stories Architect', icon: <Smartphone size={20} />, color: '#FF8C00', desc: 'Архитектура вовлечения и прогрева в Stories' },
  { id: 'ig_publisher', name: '📲 Instagram Publisher', icon: <Share2 size={20} />, color: '#E1306C', desc: 'Публикация и планирование постов через Meta Graph API' }
];

// --- Result Rendering Components ---

const ReelsResultCard = ({ result }: { result: any }) => {
  if (!result || !result.scenes) return null;

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#1A1A1A', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Card */}
      <div style={{ background: '#000', color: '#FFF', padding: '40px', borderRadius: '32px', border: '1px solid #E1306C', boxShadow: '0 20px 50px rgba(225, 48, 108, 0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>🎬</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E1306C', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '3px', marginBottom: '15px', textTransform: 'uppercase' }}>
          <Scissors size={16} /> РЕЖИССЕР REELS v1.0
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '25px', lineHeight: 1.1, letterSpacing: '-1px' }}>{result.title}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div style={{ background: 'rgba(225, 48, 108, 0.15)', padding: '20px', borderRadius: '20px', borderLeft: '5px solid #E1306C', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#E1306C', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>🔥 ХУК (0-3 СЕКУНДЫ)</div>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', lineHeight: 1.4 }}>{result.hook?.text || (typeof result.hook === 'string' ? result.hook : '')}</p>
            {result.hook?.visual && (
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid rgba(225,48,108,0.2)', paddingTop: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#E1306C' }}>ВИЗУАЛ:</span> {result.hook.visual}
              </div>
            )}
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', letterSpacing: '1px' }}>⚙️ ТЕХНИЧЕСКИЕ НАСТРОЙКИ</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#DDD' }}>
              {typeof result.techSettings === 'string' ? result.techSettings : JSON.stringify(result.techSettings)}
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '3px', opacity: 0.5, textTransform: 'uppercase' }}>РАСКАДРОВКА ПРОДАКШЕНА</div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #EEE, transparent)' }} />
        </div>
        
        {result.scenes?.map((s: any, i: number) => (
          <div key={i} style={{ background: '#FFF', padding: '30px', borderRadius: '32px', border: '1px solid #F0F0F0', display: 'grid', gridTemplateColumns: '100px 1fr', gap: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#E1306C', background: 'rgba(225, 48, 108, 0.05)', width: '100%', textAlign: 'center', padding: '10px 0', borderRadius: '15px' }}>{s.time}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA' }}>СЦЕНА {i+1}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ fontWeight: '900', fontSize: '1.3rem', color: '#000', lineHeight: 1.2 }}>{s.visual}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#F9F9FB', padding: '15px', borderRadius: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', marginBottom: '4px' }}>🎬 ДЕЙСТВИЕ</div>
                  <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: '600' }}>{s.action}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', marginBottom: '4px' }}>💡 СВЕТ</div>
                  <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: '600' }}>{s.lighting}</div>
                </div>
              </div>

              {s.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(to right, rgba(225, 48, 108, 0.1), transparent)', padding: '12px 20px', borderRadius: '15px', borderLeft: '4px solid #E1306C' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#E1306C' }}>{s.text}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '25px' }}>
        <div style={{ background: '#F9F9FB', padding: '35px', borderRadius: '32px', border: '1px solid #EEE', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', color: '#000', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎵</span> ЗВУКОВАЯ КАРТА & ASMR
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #EEE' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#E1306C', marginBottom: '5px' }}>МУЗЫКАЛЬНЫЙ ВАЙБ</div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', lineHeight: 1.5 }}>{result.audio?.music}</p>
            </div>
            {result.audio?.asmr && (
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #EEE' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#E1306C', marginBottom: '5px' }}>ASMR ДЕТАЛИ</div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', lineHeight: 1.5 }}>{result.audio.asmr}</p>
              </div>
            )}
            {result.audio?.voiceover && (
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #EEE', borderLeft: '4px solid #E1306C' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#E1306C', marginBottom: '5px' }}>🎙 ЗАКАДРОВЫЙ ГОЛОС</div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', lineHeight: 1.5, color: '#000' }}>{result.audio.voiceover}</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ background: '#000', padding: '35px', borderRadius: '32px', color: '#FFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '4rem', opacity: 0.1 }}>💎</div>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', color: '#E1306C', textTransform: 'uppercase' }}>СОВЕТ РЕЖИССЕРА</h4>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, fontWeight: '500', opacity: 0.9 }}>{result.directorNote}</p>
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: '900', color: '#E1306C' }}>РЕКОМЕНДАЦИИ ПО МОНТАЖУ:</span> {result.editing}
          </div>
        </div>
      </div>
    </div>
  );
};

const StoriesResultCard = ({ result }: { result: any }) => {
  if (!result || !result.series) return null;

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#1A1A1A', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Story Card */}
      <div style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)', color: '#FFF', padding: '45px', borderRadius: '40px', boxShadow: '0 25px 60px rgba(255, 140, 0, 0.35)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '10rem', opacity: 0.1, transform: 'rotate(10deg)' }}>📱</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '3px', marginBottom: '15px', textTransform: 'uppercase' }}>
          <Smartphone size={16} /> АРХИТЕКТОР STORIES v1.0
        </div>
        <h2 style={{ fontSize: '2.6rem', fontWeight: '900', margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }}>{result.goal}</h2>
        <p style={{ marginTop: '20px', opacity: 0.95, fontSize: '1.15rem', lineHeight: 1.5, maxWidth: '80%', fontWeight: '500' }}>{result.narrative}</p>
        <div style={{ marginTop: '30px', padding: '15px 25px', background: 'rgba(0,0,0,0.9)', color: '#FF8C00', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <Zap size={20} fill="#FF8C00" /> СТРАТЕГИЧЕСКИЙ ХУК: {result.strategicHook}
        </div>
      </div>

      {/* Horizontal Story Scroll */}
      <div style={{ display: 'flex', gap: '25px', overflowX: 'auto', padding: '10px 10px 30px 10px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {result.series?.map((s: any, i: number) => (
          <div key={i} style={{ minWidth: '340px', background: '#FFF', padding: '40px', borderRadius: '45px', border: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '25px', scrollSnapAlign: 'start', boxShadow: '0 15px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '18px', background: '#000', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.3rem' }}>{s.slide}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1,2,3,4,5].map(dot => (
                  <div key={dot} style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot === s.slide ? '#FF8C00' : '#EEE' }} />
                ))}
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', marginBottom: '8px' }}>📸 ВИЗУАЛ</div>
                <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#000', lineHeight: 1.3 }}>{s.visual}</div>
              </div>
              
              <div style={{ background: '#F8F9FA', padding: '20px', borderRadius: '25px', border: '1px solid #F1F3F5', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#FFF', padding: '2px 10px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: '900', color: '#FF8C00', border: '1px solid #EEE' }}>ТЕКСТ НА СЛАЙДЕ</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#333', fontStyle: 'italic', lineHeight: 1.4 }}>"{s.text}"</div>
              </div>

              <div style={{ border: '2px dashed #FF8C00', padding: '20px', borderRadius: '25px', background: 'rgba(255, 140, 0, 0.02)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#FF8C00', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔘</span> ИНТЕРАКТИВНЫЙ СТИКЕР
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#000' }}>{s.sticker}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📍 <span style={{ fontWeight: '600' }}>Позиция:</span> {s.placement}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#FF8C00" fill="#FF8C00" />
                <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>ПРИЗЫВ: {s.cta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stories Visual Strategy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        <div style={{ background: '#000', color: '#FFF', padding: '40px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', fontWeight: '900', color: '#FF8C00', letterSpacing: '2px', textTransform: 'uppercase' }}>ВИЗУАЛЬНЫЙ КОД БРЕНДА</h4>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.7, opacity: 0.9, fontWeight: '500' }}>{result.visualCodes}</p>
        </div>
        <div style={{ background: '#FFF', padding: '40px', borderRadius: '40px', border: '2px solid #FF8C00', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', fontWeight: '900', color: '#FF8C00', letterSpacing: '2px', textTransform: 'uppercase' }}>PRO TIP ДЛЯ ОХВАТОВ</h4>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#000', lineHeight: 1.4 }}>{result.proTip}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function CreativeLab() {
  const [creativeUser, setCreativeUser] = useState<any | null>(null);
  const [creativeAuthForm, setCreativeAuthForm] = useState({ login: '', password: '' });
  const [creativeAuthError, setCreativeAuthError] = useState('');
  const [isCreativeAuthLoading, setIsCreativeAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('captions');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{success?: boolean, message?: string, error?: string} | null>(null);
  const [result, setResult] = useState<any>(null);
  const [activeScrapedData, setActiveScrapedData] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [learnInput, setLearnInput] = useState('');
  const [learnStatus, setLearnStatus] = useState<{status: 'idle'|'uploading'|'structuring'|'success', message?: string}>({ status: 'idle' });
  
  // Advanced Plan Params
  const [planParams, setPlanParams] = useState({
    days: 7,
    posts: 5,
    reels: 3,
    stories: 14
  });
  
  // Settings
  const [apiConfig, setApiConfig] = useState({ 
    provider: 'openai', 
    model: 'gpt-4o',
    openaiKey: '',
    geminiKey: '',
    openRouterKey: '',
    grokKey: ''
  });

  // Competitor Credentials
  const [igCreds, setIgCreds] = useState({
    graphToken: '',
    igAccountId: ''
  });
  const [isIgVerifying, setIsIgVerifying] = useState(false);
  const [igStatus, setIgStatus] = useState<'idle' | 'verified' | 'error'>('idle');
  const [igMessage, setIgMessage] = useState('');
  
  // Real-time Trends Dashboard Data
  const [trendData, setTrendData] = useState<any>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  // Nano Banana Constructor State
  const [nanoBananaParams, setNanoBananaParams] = useState({
    sceneType: '',
    product: '',
    productDescription: '',
    focus: 'sparkle_bokeh',
    frame: 'portrait_9x16',
    colorPalette: 'tomiori_dark_green',
    metalTone: 'yellow_gold',
    lighting: 'studio_soft',
    mood: 'elite_desire',
    textOverlay: 'logo_top',
    textContent: '',
    extraNotes: '',
    productImage: '',
    logoImage: '',
  });
  const [nanoBananaResult, setNanoBananaResult] = useState<any>(null);
  const [isNanoBananaLoading, setIsNanoBananaLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Independent Global Feed Carousel State
  const [globalCompetitors, setGlobalCompetitors] = useState<string[]>(['tiffanyandco', 'cartier', 'bulgari']);
  const [verifiedCompetitors, setVerifiedCompetitors] = useState<string[]>([]);
  const [globalFeed, setGlobalFeed] = useState<any[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);

  // Reels Director Constructor Params
  const [reelsParams, setReelsParams] = useState({
    device: 'iphone_15_pro',
    lighting: 'studio_soft',
    mood: 'cinematic',
    pacing: 'dynamic',
    location: 'indoor_luxury',
    asmr: true
  });

  // Stories Architect Constructor Params
  const [storiesParams, setStoriesParams] = useState({
    seriesType: 'unboxing',
    goal: 'sales',
    tone: 'luxury_personal',
    interactive: 'all'
  });

  const parsePermissions = (value: any): Record<string, boolean> => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return {};
  };

  const HR_MANAGERS_CACHE_KEY = 'tomiori_hr_managers_cache_v1';

  const readCachedManagers = (): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HR_MANAGERS_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const findCachedManager = (login: string, password: string): any | null => {
    const normalizedLogin = String(login || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    if (!normalizedLogin || !normalizedPassword) return null;
    return readCachedManagers().find((m: any) =>
      String(m?.login || '').trim().toLowerCase() === normalizedLogin &&
      String(m?.password || '') === normalizedPassword
    ) || null;
  };

  const mergeWithCachedManager = (user: any): any => {
    if (!user) return user;
    const cached = readCachedManagers().find((m: any) =>
      (user.id && String(m?.id || '') === String(user.id)) ||
      String(m?.login || '').trim().toLowerCase() === String(user?.login || '').trim().toLowerCase()
    );
    if (!cached) return user;
    return { ...user, ...cached };
  };

  const canAccessCreative = (user: any): boolean => {
    // Hotfix: allow any authenticated CRM user into Creative Lab
    // to unblock production access issues caused by inconsistent permissions state.
    return !!user;
  };

  const fetchGlobalFeed = async (urls: string[], force: boolean = false) => {
    const cleanUrls = urls.filter(u => u && u.trim() !== '');
    if (cleanUrls.length === 0) {
      setGlobalFeed([]);
      setVerifiedCompetitors([]);
      setFeedError(null);
      return;
    }
    
    setIsFeedLoading(true);
    setFeedError(null);
    
    try {
      const savedIg = localStorage.getItem('tomiori_ig_creds');
      const ig = savedIg ? JSON.parse(savedIg) : {};
      
      console.log('[Feed] Syncing with IG Account:', ig.igAccountId || 'Guest/Scraper', force ? '(FORCED)' : '');

      const res = await fetch(`/api/analyze/multi-feed?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          urls: cleanUrls, 
          graphToken: ig.graphToken || '', 
          igAccountId: ig.igAccountId || '',
          forceRefresh: force
        }),
        signal: AbortSignal.timeout(90000) // 90 second timeout for the entire feed
      });
      
      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        console.log('[Feed] Data received:', data.posts?.length, 'posts');
        if (data.posts && data.posts.length > 0) {
           console.log('[Feed] Sample post URL:', data.posts[0].url?.substring(0, 50) + '...');
        }
        setGlobalFeed(data.posts || []);
        if (data.verifiedUsernames) {
          setVerifiedCompetitors(data.verifiedUsernames);
        }
        if (!data.posts || data.posts.length === 0) {
          const methods = data.debug?.sourceMethod ? Object.values(data.debug.sourceMethod) : [];
          const allBlocked = methods.length > 0 && methods.every(m => m === 'none');
          
          if (allBlocked) {
            setFeedError('Instagram заблокировал анонимный доступ для всех аккаунтов. Это происходит из-за частых запросов с сервера. Рекомендуется обновить Facebook Graph Token в настройках или попробовать позже.');
          } else if (data.debug?.errors) {
            const firstErr = Object.values(data.debug.errors)[0] as string;
            setFeedError(`Ошибка загрузки: ${firstErr}`);
          } else {
            setFeedError('Посты не найдены. Убедитесь, что аккаунты открыты и активны.');
          }
        }
      } else {
        setFeedError(data.error || 'Ошибка загрузки ленты');
      }
    } catch (e) {
      console.error('Failed to fetch global feed', e);
      setFeedError('Ошибка сети при загрузке ленты');
    } finally {
      setIsFeedLoading(false);
    }
  };

  const handleHardReset = () => {
    if (confirm('Вы уверены, что хотите сбросить состояние? Это очистит ВСЕ данные, включая ключи Instagram, и перезагрузит страницу.')) {
      // Clear all related keys
      localStorage.removeItem('tomiori_global_competitors');
      localStorage.removeItem('tomiori_creative_history');
      localStorage.removeItem('tomiori_ig_creds');
      localStorage.removeItem('tomiori_ai_config');
      // Re-init with defaults or reload
      window.location.reload();
    }
  };

  useEffect(() => {
    const savedCreativeUser = localStorage.getItem('creative_user');
    const savedCrmUser = localStorage.getItem('crm_user');
    const candidateUser = savedCreativeUser
      ? JSON.parse(savedCreativeUser)
      : (savedCrmUser ? JSON.parse(savedCrmUser) : null);

    const mergedCandidate = mergeWithCachedManager(candidateUser);
    if (mergedCandidate && canAccessCreative(mergedCandidate)) {
      setCreativeUser(mergedCandidate);
      localStorage.setItem('creative_user', JSON.stringify(mergedCandidate));
    } else {
      setCreativeUser(null);
      localStorage.removeItem('creative_user');
    }

    const savedConfig = localStorage.getItem('tomiori_ai_config');
    const savedHistory = localStorage.getItem('tomiori_creative_history');
    const savedIg = localStorage.getItem('tomiori_ig_creds');
    const savedCompetitors = localStorage.getItem('tomiori_global_competitors');
    
    let currentCompetitors = ['tiffanyandco', 'cartier', 'bulgari'];
    if (savedCompetitors) {
      currentCompetitors = JSON.parse(savedCompetitors);
      setGlobalCompetitors(currentCompetitors);
    }
    
    if (savedIg) {
      const parsedIg = JSON.parse(savedIg);
      setIgCreds(parsedIg);
      setIgStatus('verified'); 
      if (!isFeedInitialized) {
        fetchGlobalFeed(currentCompetitors);
        setIsFeedInitialized(true);
      }
    } else if (!isFeedInitialized) {
      fetchGlobalFeed(currentCompetitors);
      setIsFeedInitialized(true);
    }

    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (!parsed.provider) parsed.provider = 'openai';
      if (!parsed.model) parsed.model = parsed.provider === 'openai' ? 'gpt-4o' : 'gemini-2.5-flash';
      parsed.openaiKey = parsed.openaiKey || '';
      parsed.geminiKey = parsed.geminiKey || '';
      setApiConfig(parsed);
    } else {
      // First launch — use OpenAI by default, key can come from server env.
      setApiConfig(prev => ({
        ...prev,
        provider: 'openai',
        model: 'gpt-4o',
      }));
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    setHasMounted(true);
  }, []);

  const handleCreativeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreativeAuthError('');
    setIsCreativeAuthLoading(true);
    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: String(creativeAuthForm.login || '').trim(),
          password: creativeAuthForm.password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const localManager = findCachedManager(creativeAuthForm.login, creativeAuthForm.password);
        if (!localManager) {
          setCreativeAuthError(data.error || 'Неверный логин или пароль');
          return;
        }
        if (!canAccessCreative(localManager)) {
          setCreativeAuthError('У вас нет доступа к Creative Lab. Обратитесь к администратору.');
          return;
        }
        setCreativeUser(localManager);
        localStorage.setItem('creative_user', JSON.stringify(localManager));
        localStorage.setItem('crm_user', JSON.stringify(localManager));
        setCreativeAuthForm({ login: '', password: '' });
        return;
      }
      const mergedManager = mergeWithCachedManager(data.manager);
      if (!canAccessCreative(mergedManager)) {
        setCreativeAuthError('У вас нет доступа к Creative Lab. Обратитесь к администратору.');
        return;
      }
      setCreativeUser(mergedManager);
      localStorage.setItem('creative_user', JSON.stringify(mergedManager));
      localStorage.setItem('crm_user', JSON.stringify(mergedManager));
      setCreativeAuthForm({ login: '', password: '' });
    } catch (error: any) {
      const localManager = findCachedManager(creativeAuthForm.login, creativeAuthForm.password);
      if (localManager && canAccessCreative(localManager)) {
        setCreativeUser(localManager);
        localStorage.setItem('creative_user', JSON.stringify(localManager));
        localStorage.setItem('crm_user', JSON.stringify(localManager));
        setCreativeAuthForm({ login: '', password: '' });
      } else {
        setCreativeAuthError(error?.message || 'Ошибка входа');
      }
    } finally {
      setIsCreativeAuthLoading(false);
    }
  };

  const handleCreativeLogout = () => {
    setCreativeUser(null);
    localStorage.removeItem('creative_user');
  };

  useEffect(() => {
    if (activeTab === 'trends' && !trendData) {
      fetchTrends();
    }
  }, [activeTab]);

  const fetchTrends = async () => {
    setIsTrendLoading(true);
    setTrendError(null);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphToken: igCreds.graphToken || '',
          igAccountId: igCreds.igAccountId || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTrendData(data.trends);
        setResult(data.trends); 
      } else {
        setTrendError(data.error || 'Не удалось обновить тренды');
        setResult({ error: data.error || 'Не удалось обновить тренды' });
      }
    } catch (err) {
      console.error('Error fetching trends:', err);
      setTrendError('Ошибка сети при обновлении трендов');
      setResult({ error: 'Ошибка сети при обновлении трендов' });
    } finally {
      setIsTrendLoading(false);
    }
  };

  const saveConfig = (newConfig: any) => {
    setApiConfig(newConfig);
    localStorage.setItem('tomiori_ai_config', JSON.stringify(newConfig));
  };

  const verifyAndSaveIg = async () => {
    const cleanToken = igCreds.graphToken?.trim();
    if (!cleanToken) {
      setIgStatus('error');
      setIgMessage('Введите токен');
      return;
    }
    
    setIsIgVerifying(true);
    setIgStatus('idle');
    setIgMessage('Проверка токена...');
    
    try {
      const res = await fetch('/api/instagram/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: cleanToken })
      });
      
      const data = await res.json();
      if (data.success) {
        const newCreds = { graphToken: cleanToken, igAccountId: data.igAccountId };
        setIgCreds(newCreds);
        setIgStatus('verified');
        setIgMessage('Токен подтвержден и сохранен');
        localStorage.setItem('tomiori_ig_creds', JSON.stringify(newCreds));
      } else {
        setIgStatus('error');
        setIgMessage(data.error || 'Ошибка проверки');
      }
    } catch (e: any) {
      setIgStatus('error');
      setIgMessage('Ошибка соединения');
    } finally {
      setIsIgVerifying(false);
    }
  };

  const handleGenerate = async (overrides: any = {}) => {
    setIsGenerating(true);
    if (!overrides.historyItem) setResult(null);
    try {
      let endpoint = '/api/crm/ai/content-plan'; 
      const currentProvider = overrides.provider || apiConfig.provider;
      const currentModel = overrides.model || apiConfig.model;
      const currentKey = 
        currentProvider === 'gemini' ? apiConfig.geminiKey : 
        currentProvider === 'openrouter' ? apiConfig.openRouterKey :
        currentProvider === 'grok' ? apiConfig.grokKey :
        apiConfig.openaiKey;

      if (!currentKey && !['trends', 'chat_bot', 'rag_learn'].includes(activeTab)) {
        throw new Error(`Пожалуйста, укажите API ключ для ${currentProvider.toUpperCase()} в настройках.`);
      }

      let body: any = { 
        prompt, 
        aiProvider: currentProvider, 
        selectedModel: currentModel,
        openaiKey: apiConfig.openaiKey,
        geminiKey: apiConfig.geminiKey,
        openRouterKey: apiConfig.openRouterKey,
        grokKey: apiConfig.grokKey,
        ...overrides 
      };
      
      const currentPlanParams = overrides.planParams || planParams;
      body.planParams = currentPlanParams;
      body.days = currentPlanParams.days;
      body.posts = currentPlanParams.posts;
      body.reels = currentPlanParams.reels;
      body.stories = currentPlanParams.stories;

      if (activeTab === 'captions') {
        endpoint = '/api/generate-captions';
        body.rawInfo = prompt;
      } else if (activeTab === 'meta_ads') {
        endpoint = '/api/ads';
        body.query = prompt;
      } else if (activeTab === 'reels_director') {
        endpoint = '/api/creative/reels-director';
        body.concept = prompt;
        body = { ...body, ...reelsParams };
      } else if (activeTab === 'stories_architect') {
        endpoint = '/api/creative/stories-architect';
        body.goal = prompt;
        body = { ...body, ...storiesParams };
      } else if (activeTab === 'chat_bot') {
        endpoint = '/api/crm/ai/chat';
        body.query = prompt;
        body.config = { provider: currentProvider, apiKey: currentKey, model: currentModel };
      } else if (activeTab === 'funnel') {
        endpoint = '/api/crm/ai/content-plan'; 
        body.type = 'funnel';
      } else if (activeTab === 'competitor') {
        endpoint = '/api/analyze';
        body.competitorUrl = prompt;
        body.graphToken = igCreds.graphToken;
        body.igAccountId = igCreds.igAccountId;
      } else if (activeTab === 'trends') {
        endpoint = '/api/trends';
        body.graphToken = igCreds.graphToken;
        body.igAccountId = igCreds.igAccountId;
      } else if (activeTab === 'rag_learn') {
        endpoint = '/api/crm/ai/learn';
        body.data = prompt || learnInput;
        body.config = { provider: currentProvider, apiKey: currentKey, model: currentModel };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (data.success) {
        // Correctly prioritize and unwrap the result for Reels/Stories
        let out = data.result || data.trends || data.captions || data.plan || data.advice || data.answer || data.analysisReport || data;
        
        // Robust recursive JSON parsing for stringified outputs
        const tryParse = (val: any): any => {
          if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
            try {
              const parsed = JSON.parse(val);
              return tryParse(parsed);
            } catch (e) {
              return val;
            }
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            // Check for nested result property which often happens with some providers
            if (val.result) return tryParse(val.result);
            
            // Recurse into objects
            const next: any = {};
            for (const k in val) {
              next[k] = tryParse(val[k]);
            }
            return next;
          }
          return val;
        };

        out = tryParse(out);
        
        setResult(out);
        if (data.scrapedData) setActiveScrapedData(data.scrapedData);
        
        const newEntry = { 
          id: Date.now(), 
          tab: activeTab, 
          title: prompt.substring(0, 40) || (activeTab === 'competitor' ? 'Анализ конкурента' : 'ИИ Запрос'), 
          date: new Date().toLocaleString('ru-RU'), 
          content: out,
          scrapedData: data.scrapedData
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('tomiori_creative_history', JSON.stringify(updatedHistory));

        if (activeTab === 'chat_bot') {
          setChatMessages([...chatMessages, { role: 'user', content: prompt || 'Запрос' }, { role: 'assistant', content: data.answer || '...' }]);
          setPrompt('');
        }
      } else {
        setResult({ error: data.error || 'Неизвестная ошибка ИИ' });
      }
    } catch (e: any) {
      setResult({ error: e.message || 'Ошибка подключения к серверу' });
    }
    setIsGenerating(false);
  };

  const handleLearn = async (text?: string) => {
    setIsLearning(true);
    setLearnStatus({ status: 'uploading', message: 'Загрузка в RAG...' });
    try {
      setTimeout(() => setLearnStatus({ status: 'structuring', message: 'ИИ структурирует информацию...' }), 1000);
      const res = await fetch('/api/crm/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: text || learnInput, 
          fileName: 'Manual Update', 
          config: { 
            provider: apiConfig.provider, 
            apiKey: apiConfig.provider === 'gemini' ? apiConfig.geminiKey : apiConfig.openaiKey 
          } 
        })
      });
      const data = await res.json();
      if (data.success) {
        setLearnStatus({ status: 'success', message: 'Успешно дообучено!' });
        setTimeout(() => setLearnStatus({ status: 'idle' }), 3000);
        setLearnInput('');
      } else {
        setLearnStatus({ status: 'idle' });
        alert('Ошибка: ' + data.error);
      }
    } catch (e) {
      setLearnStatus({ status: 'idle' });
    }
    setIsLearning(false);
  };

  const handleNanoBanana = async () => {
    setIsNanoBananaLoading(true);
    setNanoBananaResult(null);
    try {
      const res = await fetch('/api/creative/nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nanoBananaParams,
          geminiKey: apiConfig.geminiKey,
          openaiKey: apiConfig.openaiKey,
          openRouterKey: apiConfig.openRouterKey,
          grokKey: apiConfig.grokKey,
          aiProvider: apiConfig.provider,
          selectedModel: apiConfig.model,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNanoBananaResult(data.result);
        const newEntry = {
          id: Date.now(),
          tab: 'nano_banana',
          title: PRODUCTS_NB.find(p => p.v === nanoBananaParams.product)?.l || 'Nano Banana Промпт',
          date: new Date().toLocaleString('ru-RU'),
          content: data.result,
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('tomiori_creative_history', JSON.stringify(updatedHistory));
      } else {
        setNanoBananaResult({ error: data.error });
      }
    } catch (e: any) {
      setNanoBananaResult({ error: e.message });
    }
    setIsNanoBananaLoading(false);
  };

  if (!hasMounted) {
    return <div style={{ minHeight: '100vh', background: '#F8F9FA' }} />;
  }

  if (!creativeUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: '#FFF', border: '1px solid #EEE', borderRadius: '18px', padding: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Вход в Creative Lab</h2>
          <p style={{ marginTop: '8px', marginBottom: '18px', fontSize: '0.8rem', opacity: 0.6 }}>
            Доступ только для пользователей с правом `creative` или роли `admin`.
          </p>
          <form onSubmit={handleCreativeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="luxury-input"
              placeholder="Логин"
              value={creativeAuthForm.login}
              onChange={(e) => setCreativeAuthForm((s) => ({ ...s, login: e.target.value }))}
              required
            />
            <input
              className="luxury-input"
              type="password"
              placeholder="Пароль"
              value={creativeAuthForm.password}
              onChange={(e) => setCreativeAuthForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
            {creativeAuthError && (
              <div style={{ fontSize: '0.75rem', color: '#EF4444' }}>{creativeAuthError}</div>
            )}
            <button type="submit" className="btn-primary" style={{ padding: '12px', borderRadius: '12px' }} disabled={isCreativeAuthLoading}>
              {isCreativeAuthLoading ? 'Вход...' : 'Войти'}
            </button>
            <Link href="/crm" style={{ fontSize: '0.8rem', textAlign: 'center', color: '#666', textDecoration: 'none' }}>
              Назад в CRM
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', color: '#1A1A1A', overflow: 'hidden' }}>
      <style jsx global>{`
        .markdown-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
          color: inherit;
          background: #FFF;
          border-radius: 8px;
          overflow: hidden;
        }
        .markdown-prose th {
          background: #F8F9FA;
          text-align: left;
          padding: 12px 15px;
          border: 1px solid #EEE;
          font-weight: 900;
          color: #000;
        }
        .markdown-prose td {
          padding: 12px 15px;
          border: 1px solid #EEE;
          vertical-align: top;
          color: #333;
        }
        .luxury-report table {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .luxury-report th {
          background: rgba(212,175,55,0.15);
          color: #FFF;
          border-color: rgba(255,255,255,0.1);
        }
        .luxury-report td {
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
        }
        .markdown-prose p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
      `}</style>
      
      <aside style={{ width: '360px', background: '#FFF', borderRight: '1px solid #EEE', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '2.5rem 2rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
            <div style={{ background: '#000', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="#D4AF37" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>TOMIORI AI</h1>
              <span style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 'bold', letterSpacing: '1px' }}>CREATIVE LAB v5.0</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {AI_MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => { setActiveTab(m.id); setResult(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '15px',
                  border: activeTab === m.id ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                  background: activeTab === m.id ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                  color: activeTab === m.id ? '#000' : '#666', cursor: 'pointer', transition: '0.2s', textAlign: 'left'
                }}
              >
                <div style={{ 
                  width: '34px', height: '34px', borderRadius: '10px', background: activeTab === m.id ? '#D4AF37' : '#F1F3F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === m.id ? '#FFF' : '#1A1A1A'
                }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{m.name}</div>
                </div>
                {activeTab === m.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37' }} />}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #F1F3F5', background: '#F9F9FB' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/crm" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
              <ArrowLeft size={18} /> КАНБАН / СКЛАД
            </Link>
            <button
              onClick={handleCreativeLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <LogOut size={16} /> Выйти из Creative Lab
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
        <header style={{ padding: '1.5rem 3rem', background: '#FFF', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{AI_MODULES.find(m => m.id === activeTab)?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Мозг: {apiConfig.provider.toUpperCase()} 2026 Активен</span>
            </div>
          </div>
          <button onClick={() => { setIsSettingsOpen(true); setTestStatus(null); }} className="btn-secondary" style={{ padding: '12px', background: isSettingsOpen ? '#F1F3F5' : '#FFF' }}>
             <Settings size={20} />
          </button>
        </header>

        <div style={{ flex: 1, display: activeTab === 'creative_builder' || activeTab === 'ig_publisher' ? 'block' : 'grid', gridTemplateColumns: 'minmax(400px, 420px) 1fr', overflow: 'hidden' }}>
          {activeTab === 'creative_builder' ? (
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <CreativeBuilder />
            </div>
          ) : activeTab === 'ig_publisher' ? (
            <div style={{ height: '100%', overflowY: 'auto', padding: '2.5rem 3rem', background: '#F8F9FA' }}>
              <InstagramPublisher />
            </div>
          ) : (
          <><section style={{ background: '#FFF', borderRight: '1px solid #EEE', padding: '2rem', overflowY: 'auto' }}>            {activeTab === 'chat_bot' ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                 <div className="info-box" style={{ marginBottom: '1.5rem' }}>
                    <Bot size={16} /> Задайте любой вопрос про Tomiori.
                 </div>
                 <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '1.5rem' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                         <div style={{ maxWidth: '85%', padding: '12px 18px', borderRadius: '18px', background: msg.role === 'user' ? '#000' : '#F1F3F5', color: msg.role === 'user' ? '#FFF' : '#000', fontSize: '0.9rem' }}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="luxury-input" placeholder="Ваш вопрос..." value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} />
                    <button onClick={() => handleGenerate()} disabled={isGenerating} style={{ background: '#000', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px' }}>
                       {isGenerating ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                    </button>
                 </div>
              </div>
            ) : activeTab === 'rag_learn' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <div className="info-box"><Zap size={16} /> Внесите знания в Memory Bank.</div>
                 <textarea className="luxury-input" placeholder="Например: 'Наш новый менеджер - Элия...'" style={{ height: '180px' }} value={learnInput} onChange={(e) => setLearnInput(e.target.value)} />
                 
                 {learnStatus.status !== 'idle' && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: learnStatus.status === 'success' ? '#E8F5E9' : '#F1F3F5', borderRadius: '12px', color: learnStatus.status === 'success' ? '#2E7D32' : '#666' }}>
                     {learnStatus.status === 'success' ? <CheckCircle2 size={18} /> : <Loader2 size={18} className="spin" />}
                     <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{learnStatus.message}</span>
                   </div>
                 )}

                 <button onClick={() => handleLearn()} disabled={isLearning || !learnInput} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: '#D4AF37' }}>
                    {isLearning ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />} ОБУЧИТЬ TOMIORI
                 </button>
              </div>
            ) : activeTab === 'reels_director' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <div className="info-box" style={{ background: 'rgba(225, 48, 108, 0.08)', borderColor: 'rgba(225, 48, 108, 0.2)' }}>
                    <Scissors size={16} color="#E1306C" /> Reels Director: Конструктор сценария и съемки.
                 </div>

                 {/* Device Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>📱 Камера / Устройство</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'iphone_14_pro', l: 'iPhone 14 Pro' },
                       { v: 'iphone_15_pro', l: 'iPhone 15 Pro' },
                       { v: 'iphone_16_pro', l: 'iPhone 16 Pro Max' },
                       { v: 'iphone_17_pro', l: 'iPhone 17 Pro Max' },
                       { v: 'sony_a7iv', l: 'Sony A7IV' },
                       { v: 'red_komodo', l: 'RED Komodo' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setReelsParams({...reelsParams, device: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: reelsParams.device === o.v ? '1px solid #E1306C' : '1px solid #EEE', background: reelsParams.device === o.v ? 'rgba(225, 48, 108, 0.1)' : '#FFF', color: reelsParams.device === o.v ? '#E1306C' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Lighting Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>💡 Освещение</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'studio_soft', l: 'Studio Soft' },
                       { v: 'natural_sun', l: 'Natural Sun' },
                       { v: 'dramatic_neon', l: 'Dramatic / Neon' },
                       { v: 'low_light', l: 'Luxury Dark' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setReelsParams({...reelsParams, lighting: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: reelsParams.lighting === o.v ? '1px solid #E1306C' : '1px solid #EEE', background: reelsParams.lighting === o.v ? 'rgba(225, 48, 108, 0.1)' : '#FFF', color: reelsParams.lighting === o.v ? '#E1306C' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Mood Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🎭 Настроение</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'cinematic', l: 'Кино' },
                       { v: 'lifestyle', l: 'Лайфстайл' },
                       { v: 'minimalist', l: 'Минимализм' },
                       { v: 'glamour', l: 'Гламур' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setReelsParams({...reelsParams, mood: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: reelsParams.mood === o.v ? '1px solid #E1306C' : '1px solid #EEE', background: reelsParams.mood === o.v ? 'rgba(225, 48, 108, 0.1)' : '#FFF', color: reelsParams.mood === o.v ? '#E1306C' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Pacing Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>⏱️ Темп монтажа</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'dynamic', l: 'Динамичный' },
                       { v: 'slow_mo', l: 'Slow-mo' },
                       { v: 'fast_cuts', l: 'Ритмичный' },
                       { v: 'steady', l: 'Спокойный' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setReelsParams({...reelsParams, pacing: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: reelsParams.pacing === o.v ? '1px solid #E1306C' : '1px solid #EEE', background: reelsParams.pacing === o.v ? 'rgba(225, 48, 108, 0.1)' : '#FFF', color: reelsParams.pacing === o.v ? '#E1306C' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Location Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>📍 Локация</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'indoor_luxury', l: 'Бутик' },
                       { v: 'outdoor_city', l: 'Город' },
                       { v: 'nature', l: 'Природа' },
                       { v: 'studio_minimal', l: 'Студия' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setReelsParams({...reelsParams, location: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: reelsParams.location === o.v ? '1px solid #E1306C' : '1px solid #EEE', background: reelsParams.location === o.v ? 'rgba(225, 48, 108, 0.1)' : '#FFF', color: reelsParams.location === o.v ? '#E1306C' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 <div className="param-input">
                    <label>🎬 Концепция или Тема</label>
                    <textarea className="luxury-input" placeholder="Напр: Распаковка кольца в лесу, процесс примерки в студии..." style={{ height: '80px' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                 </div>
                 <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: 'linear-gradient(135deg, #E1306C 0%, #833AB4 100%)', color: '#FFF', border: 'none', fontWeight: 'bold' }}>
                    {isGenerating ? <Loader2 size={24} className="spin" /> : <Sparkles size={24} />} СОЗДАТЬ СЦЕНАРНЫЙ ПЛАН
                 </button>

                 {/* History Section for Reels */}
                 <div style={{ marginTop: '2rem', borderTop: '1px solid #EEE', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px', color: '#E1306C' }}>
                       <History size={16} /> ИСТОРИЯ ГЕНЕРАЦИЙ (REELS)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                       {history.filter(h => h.tab === 'reels_director').slice(0, 8).map(h => (
                         <div key={h.id} className="history-item" onClick={() => { setPrompt(h.title || ''); setResult(h.content); }} style={{ padding: '12px 20px', borderRadius: '15px', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s', background: '#FFF' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{h.title || 'Сценарий Reels'}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(h.timestamp).toLocaleString('ru-RU')}</div>
                         </div>
                       ))}
                       {history.filter(h => h.tab === 'reels_director').length === 0 && <div style={{ fontSize:'0.8rem', opacity:0.5 }}>История пуста.</div>}
                    </div>
                 </div>
              </div>
            ) : activeTab === 'stories_architect' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <div className="info-box" style={{ background: 'rgba(255, 140, 0, 0.08)', borderColor: 'rgba(255, 140, 0, 0.2)' }}>
                    <Smartphone size={16} color="#FF8C00" /> Stories Architect: Конструктор вовлечения.
                 </div>

                 {/* Series Type Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>📦 Тип серии</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'unboxing', l: 'Распаковка' },
                       { v: 'making_of', l: 'Процесс создания' },
                       { v: 'educational', l: 'Экспертный контент' },
                       { v: 'lifestyle_vlog', l: 'Лайфстайл' },
                       { v: 'promo_sale', l: 'Акция / Скидки' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setStoriesParams({...storiesParams, seriesType: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: storiesParams.seriesType === o.v ? '1px solid #FF8C00' : '1px solid #EEE', background: storiesParams.seriesType === o.v ? 'rgba(255, 140, 0, 0.1)' : '#FFF', color: storiesParams.seriesType === o.v ? '#FF8C00' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Goal Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🎯 Главная цель</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'sales', l: 'Продажи' },
                       { v: 'engagement', l: 'Охваты / Реакции' },
                       { v: 'trust', l: 'Доверие / Лояльность' },
                       { v: 'awareness', l: 'Узнаваемость' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setStoriesParams({...storiesParams, goal: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: storiesParams.goal === o.v ? '1px solid #FF8C00' : '1px solid #EEE', background: storiesParams.goal === o.v ? 'rgba(255, 140, 0, 0.1)' : '#FFF', color: storiesParams.goal === o.v ? '#FF8C00' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Tone Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🎭 Тон общения</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'luxury_personal', l: 'Luxury Personal' },
                       { v: 'professional', l: 'Профессиональный' },
                       { v: 'friendly', l: 'Дружелюбный' },
                       { v: 'mysterious', l: 'Загадочный' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setStoriesParams({...storiesParams, tone: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: storiesParams.tone === o.v ? '1px solid #FF8C00' : '1px solid #EEE', background: storiesParams.tone === o.v ? 'rgba(255, 140, 0, 0.1)' : '#FFF', color: storiesParams.tone === o.v ? '#FF8C00' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 {/* Interactive Level Selector */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.45, textTransform: 'uppercase' }}>🔘 Уровень интерактива</span>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                     {[
                       { v: 'none', l: 'Без стикеров' },
                       { v: 'poll', l: 'Опрос / Тест' },
                       { v: 'question', l: 'Вопрос' },
                       { v: 'all', l: 'Максимум вовлечения' },
                     ].map(o => (
                       <div key={o.v} onClick={() => setStoriesParams({...storiesParams, interactive: o.v})} style={{ padding: '6px 14px', borderRadius: '20px', border: storiesParams.interactive === o.v ? '1px solid #FF8C00' : '1px solid #EEE', background: storiesParams.interactive === o.v ? 'rgba(255, 140, 0, 0.1)' : '#FFF', color: storiesParams.interactive === o.v ? '#FF8C00' : '#666', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>{o.l}</div>
                     ))}
                   </div>
                 </div>

                 <div className="param-input">
                    <label>📝 О чем серия? (Кратко)</label>
                    <textarea className="luxury-input" placeholder="Напр: Новая коллекция 'Eternal', отзывы клиентов..." style={{ height: '80px' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                 </div>
                 <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)', color: '#FFF', border: 'none', fontWeight: 'bold' }}>
                    {isGenerating ? <Loader2 size={24} className="spin" /> : <Layout size={24} />} СПРОЕКТИРОВАТЬ СЕРИЮ
                 </button>

                 {/* History Section for Stories */}
                 <div style={{ marginTop: '2rem', borderTop: '1px solid #EEE', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px', color: '#FF8C00' }}>
                       <History size={16} /> ИСТОРИЯ ГЕНЕРАЦИЙ (STORIES)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                       {history.filter(h => h.tab === 'stories_architect').slice(0, 8).map(h => (
                         <div key={h.id} className="history-item" onClick={() => { setPrompt(h.title || ''); setResult(h.content); }} style={{ padding: '12px 20px', borderRadius: '15px', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s', background: '#FFF' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{h.title || 'Серия Stories'}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(h.timestamp).toLocaleString('ru-RU')}</div>
                         </div>
                       ))}
                       {history.filter(h => h.tab === 'stories_architect').length === 0 && <div style={{ fontSize:'0.8rem', opacity:0.5 }}>История пуста.</div>}
                    </div>
                 </div>
              </div>
            ) : activeTab === 'meta_ads' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <div className="info-box" style={{ background: 'rgba(59, 89, 152, 0.08)', borderColor: 'rgba(59, 89, 152, 0.2)' }}>
                    <Share2 size={16} color="#3b5998" /> Meta Ads Consultant: Аудит и стратегия рекламы.
                 </div>
                 <textarea className="luxury-input" placeholder="Опишите ваши текущие кампании или цели..." style={{ height: '200px' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                 <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: '#3b5998', color: '#FFF', border: 'none', fontWeight: 'bold' }}>
                    {isGenerating ? <Loader2 size={24} className="spin" /> : <ShieldCheck size={24} />} ГЕНЕРИРОВАТЬ СТРАТЕГИЮ
                 </button>

                 {/* History Section for Meta Ads */}
                 <div style={{ marginTop: '2rem', borderTop: '1px solid #EEE', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px', color: '#3b5998' }}>
                       <History size={16} /> ИСТОРИЯ ГЕНЕРАЦИЙ (META ADS)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                       {history.filter(h => h.tab === 'meta_ads').slice(0, 8).map(h => (
                         <div key={h.id} className="history-item" onClick={() => { setPrompt(h.title || ''); setResult(h.content); }} style={{ padding: '12px 20px', borderRadius: '15px', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s', background: '#FFF' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{h.title || 'Аудит рекламы'}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(h.timestamp).toLocaleString('ru-RU')}</div>
                         </div>
                       ))}
                       {history.filter(h => h.tab === 'meta_ads').length === 0 && <div style={{ fontSize:'0.8rem', opacity:0.5 }}>История пуста.</div>}
                    </div>
                 </div>
              </div>
            ) : activeTab === 'content_plan' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className="info-box"><Layout size={16} /> Настройте параметры плана.</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="param-input">
                       <label>Период (дней)</label>
                       <input type="number" value={planParams.days} onChange={(e) => setPlanParams({...planParams, days: parseInt(e.target.value)})} />
                    </div>
                    <div className="param-input">
                       <label>Посты</label>
                       <input type="number" value={planParams.posts} onChange={(e) => setPlanParams({...planParams, posts: parseInt(e.target.value)})} />
                    </div>
                    <div className="param-input">
                       <label>Reels</label>
                       <input type="number" value={planParams.reels} onChange={(e) => setPlanParams({...planParams, reels: parseInt(e.target.value)})} />
                    </div>
                    <div className="param-input">
                       <label>Stories</label>
                       <input type="number" value={planParams.stories} onChange={(e) => setPlanParams({...planParams, stories: parseInt(e.target.value)})} />
                    </div>
                 </div>
                 <textarea className="luxury-input" placeholder="Доп. пожелания (коллекция, стиль)..." style={{ height: '100px' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                 <button onClick={() => handleGenerate()} disabled={isGenerating} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: '#000', color:'#FFF' }}>
                    {isGenerating ? <Loader2 size={24} className="spin" /> : <Zap size={24} />} ГЕНЕРИРОВАТЬ ПЛАН
                 </button>
                 <div style={{ marginTop: '1rem', borderTop: '1px solid #EEE', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', opacity: 0.6, display:'flex', alignItems:'center', gap:'8px' }}><History size={14}/> ИСТОРИЯ ПЛАНОВ</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                       {history.filter(h => h.tab === activeTab).map(h => (
                         <div key={h.id} className="history-item" onClick={() => setResult(h.content)}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{h.title || 'Контент-план'}</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            ) : activeTab === 'trends' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className="info-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <TrendingUp size={16} color="#10B981" /> Анализатор работает в режиме реального времени.
                 </div>
                 <div style={{ padding:'20px', background:'#F9F9FB', borderRadius:'20px', border:'1px solid #EEE' }}>
                    <h4 style={{ fontSize: '0.85rem', display:'flex', alignItems:'center', gap:'8px', margin: '0 0 15px 0' }}>
                       <Zap size={14} color="#D4AF37" /> ТЕКУЩИЙ СТАТУС
                    </h4>
                    <p style={{ fontSize:'0.85rem', opacity: 0.6, margin: 0 }}>
                       Модуль автоматически собирает данные по ювелирным трендам Казахстана, анализирует Instagram конкурентов и мировые подиумы. Обновление происходит каждые 6 часов.
                    </p>
                 </div>
                 <button onClick={() => fetchTrends()} disabled={isTrendLoading} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: '#10B981', color:'#FFF', border:'none' }}>
                    {isTrendLoading ? <Loader2 size={24} className="spin" /> : <TrendingUp size={24} />} ОБНОВИТЬ ДАННЫЕ
                 </button>
                 {trendError && (
                   <div style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.8rem' }}>
                     {trendError}
                   </div>
                 )}
                 <div style={{ marginTop: '1rem', borderTop: '1px solid #EEE', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', opacity: 0.6, display:'flex', alignItems:'center', gap:'8px' }}><History size={14}/> ИСТОРИЯ ПОИСКА</h4>
                    <p style={{ fontSize:'0.75rem', opacity:0.4 }}>Все тренды автоматически сохраняются в Memory Bank для обучения ИИ.</p>
                 </div>
              </div>
            ) : activeTab === 'competitor' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className="info-box"><SearchCode size={16} /> Анализ Instagram и сайтов.</div>
                 
                 <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ссылка на профиль / Сайт</label>
                    <input className="luxury-input" placeholder="https://instagram.com/..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                 </div>

                 <div style={{ background: '#F9F9FB', padding: '15px', borderRadius: '15px', border: '1px solid #EEE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>INSTAGRAM API (OFFICIAL)</span>
                          {igStatus === 'verified' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981' }} />}
                       </div>
                       <Share2 size={14} color="#E1306C" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>ACCESS TOKEN</span>
                          <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: '#1877F2', textDecoration: 'none' }}>Как получить?</a>
                       </div>
                       <div style={{ position: 'relative' }}>
                          <input className="luxury-input" style={{ background: '#FFF', width: '100%', paddingRight: '40px' }} placeholder="Access Token (EAA... / IGAA...)" value={igCreds.graphToken || ''} onChange={e => { setIgCreds({...igCreds, graphToken: e.target.value}); setIgStatus('idle'); }} />
                          {isIgVerifying && <div style={{ position: 'absolute', right: '12px', top: '12px' }}><Loader2 size={16} className="spin" /></div>}
                          {igStatus === 'verified' && <div style={{ position: 'absolute', right: '12px', top: '12px' }}><CheckCircle2 size={16} color="#10B981" /></div>}
                          {igStatus === 'error' && <div style={{ position: 'absolute', right: '12px', top: '12px' }}><AlertCircle size={16} color="#EF4444" /></div>}
                       </div>
                       
                       {igMessage && (
                          <div style={{ fontSize: '0.65rem', color: igStatus === 'error' ? '#EF4444' : (igStatus === 'verified' ? '#10B981' : '#666'), marginTop: '-4px' }}>
                             {igMessage}
                          </div>
                       )}

                       <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '5px' }}>BUSINESS ACCOUNT ID (OPTIONAL)</div>
                       <input className="luxury-input" style={{ background: '#FFF' }} placeholder="Instagram Business Account ID" value={igCreds.igAccountId || ''} onChange={e => setIgCreds({...igCreds, igAccountId: e.target.value})} />
                       
                       <button 
                          onClick={verifyAndSaveIg} 
                          disabled={isIgVerifying || !igCreds.graphToken}
                          style={{ 
                             width: '100%', 
                             padding: '10px', 
                             borderRadius: '10px', 
                             background: igStatus === 'verified' ? 'rgba(16, 185, 129, 0.1)' : '#000', 
                             color: igStatus === 'verified' ? '#10B981' : '#FFF',
                             border: igStatus === 'verified' ? '1px solid #10B981' : 'none',
                             fontSize: '0.75rem',
                             fontWeight: 'bold',
                             cursor: 'pointer',
                             marginTop: '5px'
                          }}
                       >
                          {igStatus === 'verified' ? 'ТОКЕН ПОДТВЕРЖДЕН' : 'ПРОВЕРИТЬ И СОХРАНИТЬ'}
                       </button>
                    </div>
                 </div>

                 <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: '#000', color: '#FFF' }}>
                    {isGenerating ? <Loader2 size={24} className="spin" /> : <Zap size={24} />} НАЧАТЬ АНАЛИЗ
                 </button>

                 <div style={{ marginTop: '1rem', borderTop: '1px solid #EEE', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', opacity: 0.6, display:'flex', alignItems:'center', gap:'8px' }}><History size={14}/> ИСТОРИЯ АНАЛИЗОВ</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                       {history.filter(h => h.tab === 'competitor').map(h => (
                         <div key={h.id} className="history-item" onClick={() => { setActiveTab('competitor'); setResult(h.content); if(h.scrapedData) setActiveScrapedData(h.scrapedData); }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{h.title}</div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* GLOBAL FEED SETTINGS */}
                 <div style={{ marginTop: '2rem', background: '#F1F3F5', padding: '25px', borderRadius: '24px', border: '1.5px solid #DDD', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Layers size={16} color="#000" />
                          <span style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '1px' }}>МОНИТОРИНГ ЛЕНТ</span>
                       </div>
                       {isFeedLoading && <Loader2 size={14} className="spin" />}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {globalCompetitors.map((username, idx) => {
                          const isVerified = verifiedCompetitors.includes(username.replace('@', '').toLowerCase());
                          return (
                          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <div style={{ position: 'relative', flex: 1 }}>
                                <input className="luxury-input" style={{ background: '#FFF', fontSize: '0.8rem', padding: '10px 35px 10px 12px', width: '100%', borderRadius: '12px' }} 
                                   value={username} 
                                   placeholder="username"
                                   onChange={e => {
                                      const newComps = [...globalCompetitors];
                                      newComps[idx] = e.target.value;
                                      setGlobalCompetitors(newComps);
                                   }} 
                                />
                                {isVerified && (
                                   <div style={{ position: 'absolute', right: '12px', top: '14px', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', zIndex: 2 }} 
                                        title="Активен" />
                                )}
                             </div>
                             <button onClick={() => {
                                const newComps = globalCompetitors.filter((_, i) => i !== idx);
                                setGlobalCompetitors(newComps);
                                localStorage.setItem('tomiori_global_competitors', JSON.stringify(newComps));
                                // Immediately refresh feed when removing
                                fetchGlobalFeed(newComps);
                             }} style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
                          </div>
                          );
                       })}
                       
                       <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                          <button onClick={() => setGlobalCompetitors([...globalCompetitors, ''])} 
                             style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1.5px dashed #BBB', background: 'none', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', color: '#666' }}>
                             + ДОБАВИТЬ
                          </button>
                          <button onClick={() => {
                             localStorage.setItem('tomiori_global_competitors', JSON.stringify(globalCompetitors));
                             fetchGlobalFeed(globalCompetitors, true);
                          }} 
                             style={{ flex: 1.5, padding: '10px', borderRadius: '12px', border: 'none', background: '#000', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <RefreshCw size={12} className={isFeedLoading ? 'spin' : ''} /> СОХРАНИТЬ И ОБНОВИТЬ
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            ) : activeTab === 'nano_banana' ? (
              <NanoBananaPanel
                params={nanoBananaParams}
                setParams={setNanoBananaParams}
                onGenerate={handleNanoBanana}
                isLoading={isNanoBananaLoading}
                history={history.filter(h => h.tab === 'nano_banana')}
                onHistoryClick={(c: any) => setNanoBananaResult(c)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <textarea className="luxury-input" placeholder="Опишите задачу подробно..." style={{ height: '200px' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <button onClick={() => handleGenerate()} disabled={isGenerating || !prompt} className="btn-primary" style={{ width: '100%', padding: '1.5rem', borderRadius: '18px', background: '#000', color: '#FFF', fontWeight: 'bold' }}>
                  {isGenerating ? <Loader2 size={24} className="spin" /> : <Zap size={24} />} ГЕНЕРИРОВАТЬ
                </button>
                <div style={{ marginTop: '2rem', borderTop: '1px solid #EEE', paddingTop: '1.5rem' }}>
                   <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px' }}><History size={16} /> ИСТОРИЯ МОДУЛЯ</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                      {history.filter(h => h.tab === activeTab).slice(0, 8).map(h => (
                        <div key={h.id} className="history-item" onClick={() => setResult(h.content)}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '5px' }}>
                              <span>{h.date}</span>
                              <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>ПРОСМОТР</span>
                           </div>
                           <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{h.title}</div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </section>

          <section style={{ background: '#F9F9FB', padding: '3rem', overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
                   {activeTab === 'competitor' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                         {/* INDEPENDENT GLOBAL FEED CAROUSEL */}
                   <div style={{ background: '#FFF', borderRadius: '32px', padding: '30px', border: '1px solid #EEE', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', boxShadow: '0 0 15px rgba(225,48,108,0.4)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '900', letterSpacing: '3px', color: '#000', textTransform: 'uppercase' }}>Пульс Конкурентов</span>
                         </div>
                         <div style={{ fontSize: '0.7rem', color: '#AAA', fontWeight: 'bold' }}>
                            {isFeedLoading ? 'ОБНОВЛЕНИЕ...' : `LIVE • ${globalFeed.length} ПОСТОВ`}
                         </div>
                      </div>
                      
                      <div style={{ overflow: 'hidden', position: 'relative', width: '100%', minHeight: '220px' }}>
                           {globalFeed.length > 0 ? (
                              <div className="infinite-scroll-container" style={{ animation: `infiniteScroll ${Math.max(20, globalFeed.length * 1.8)}s linear infinite` }}>
                                 {[...globalFeed, ...globalFeed].map((post: any, i: number) => (
                                  <a key={i} href={post.permalink || '#'} target="_blank" rel="noreferrer" 
                                     style={{ position: 'relative', minWidth: '220px', width: '220px', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#111' }}>
                                     {post.url ? (
                                       <img 
                                          src={`/api/proxy-image?url=${encodeURIComponent(post.url)}`} 
                                          alt="" 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                          onError={(e) => {
                                             // Fallback: try direct if proxy fails, or show generic icon
                                             const target = e.currentTarget as HTMLImageElement;
                                             if (target.src.includes('/api/proxy-image')) {
                                               target.src = post.url;
                                             } else {
                                               target.style.display = 'none';
                                               const parent = target.parentElement;
                                               if (parent) parent.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;color:#D4AF37;gap:10px;"><div style="font-size:2rem;">💎</div><div style="font-size:0.6rem;font-weight:bold;letter-spacing:1px;opacity:0.5;">TOMIORI VISUAL</div></div>';
                                             }
                                          }}
                                       />
                                     ) : activeTab === 'competitor' ? (
                            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                              <div className="ai-loader-container"><div className="loader-orbit" /><SearchCode size={40} style={{ color: '#EF4444' }} /></div>
                              <h3 style={{ marginTop: '2rem', letterSpacing: '2px' }}>АНАЛИЗИРУЮ КОНКУРЕНТА...</h3>
                              <p style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '400px', margin: '1rem auto' }}>
                                ИИ пробует 7 различных методов обхода блокировок Instagram (Graph API, Hiker, instagrapi, Picuki, Imginn, Dumpor, Greatfon). 
                                Это может занять до 60 секунд.
                              </p>
                            </div>
                          ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#D4AF37', gap: '10px' }}>
                                           <div style={{ fontSize: '2rem' }}>💎</div>
                                           <div style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.5 }}>TOMIORI VISUAL</div>
                                        </div>
                                      )}
                                     <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: '#FFF', padding: '4px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 'bold', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                        @{post.username}
                                     </div>
                                     {(post.likes || post.comments || post.source) && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', color: '#FFF', fontSize: '0.75rem', display: 'flex', gap: '15px', fontWeight: 'bold', alignItems: 'center' }}>
                                           {post.likes && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>❤️ {post.likes}</span>}
                                           {post.comments && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💬 {post.comments}</span>}
                                           {post.source && (
                                              <div style={{ marginLeft: 'auto', fontSize: '0.5rem', opacity: 0.5, textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>
                                                 {post.source}
                                              </div>
                                           )}
                                        </div>
                                     )}
                                  </a>
                               ))}
                            </div>
                         ) : (
                            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#CCC', fontSize: '0.85rem' }}>
                               {isFeedLoading ? (
                                  <Loader2 className="spin" size={30} />
                               ) : feedError ? (
                                  <>
                                     <AlertCircle size={30} color="#EF4444" />
                                     <div style={{ color: '#EF4444', textAlign: 'center', maxWidth: '300px' }}>{feedError}</div>
                                     <button onClick={() => fetchGlobalFeed(globalCompetitors)} style={{ marginTop: '10px', background: '#000', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>ПОПРОБОВАТЬ СНОВА</button>
                                  </>
                               ) : 'Настройте список конкурентов слева для запуска ленты'}
                            </div>
                         )}
                      </div>
                   </div>

                   {/* SPECIFIC ANALYSIS RESULT */}
                   {result ? (
                      <div style={{ background: '#FFF', padding: '40px', borderRadius: '32px', border: '1px solid #EEE', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                         <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #EEE', paddingBottom:'25px', marginBottom: '25px' }}>
                            <div>
                               <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>Результат генерации</h2>
                               <span style={{ fontSize:'0.75rem', opacity: 0.5, letterSpacing: '1px' }}>Tomiori Creative AI v5.0</span>
                            </div>
                            <div style={{ display:'flex', gap:'12px' }}>
                               <button className="icon-btn-luxury" onClick={() => window.print()}><Printer size={20}/></button>
                            </div>
                         </div>
                         
                         {/* High-end Designer Results */}
                         {result.scenes ? (
                            <ReelsResultCard result={result} />
                         ) : result.series ? (
                            <StoriesResultCard result={result} />
                         ) : (
                            <div className="markdown-prose">
                               <ReactMarkdown>{typeof result === 'string' ? result : (result.answer || result.report || JSON.stringify(result, null, 2))}</ReactMarkdown>
                            </div>
                         )}
                      </div>
                   ) : !isGenerating && (
                      <div style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>
                         <SearchCode size={40} style={{ marginBottom: '15px' }} />
                         <div>Введите ссылку на конкурента слева для детального анализа</div>
                      </div>
                   )}
                </div>
              ) : activeTab === 'nano_banana' ? (
                <>
                  {!nanoBananaResult && !isNanoBananaLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🍌</div>
                      <h3 style={{ marginTop: '1rem', opacity: 0.3 }}>NANO BANANA КОНСТРУКТОР</h3>
                      <p style={{ maxWidth: '340px', margin: '1rem auto', fontSize: '0.85rem', opacity: 0.5 }}>Выберите параметры слева и нажмите «Создать промпт». ИИ сгенерирует идеальный промпт для Nano Banana с учётом фирменного стиля Tomiori.</p>
                      <div style={{ marginTop: '2rem', padding: '20px', background: 'rgba(212,175,55,0.06)', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.15)', maxWidth: '400px', margin: '2rem auto 0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.5, marginBottom: '10px' }}>ФИРМЕННЫЙ СТИЛЬ TOMIORI</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                          {['Чёрный + Золото', 'Бархат', 'Кинематограф', 'Логотип сверху', 'Пьедестал', 'Макро'].map(tag => (
                            <span key={tag} style={{ fontSize: '0.7rem', padding: '4px 12px', background: '#FFF', border: '1px solid #EEE', borderRadius: '20px' }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : isNanoBananaLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                      <div className="ai-loader-container"><div className="loader-orbit" /><span style={{ fontSize: '2rem' }}>🍌</span></div>
                      <h3 style={{ marginTop: '2rem', letterSpacing: '2px' }}>СОЗДАЮ ПРОМПТ...</h3>
                      <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Gemini анализирует фирменный стиль Tomiori</p>
                    </div>
                  ) : nanoBananaResult?.error ? (
                    <div style={{ padding: '20px', background: '#FFEBEE', borderRadius: '16px', color: '#C62828' }}>
                      <AlertCircle size={20} /> {nanoBananaResult.error}
                    </div>
                  ) : nanoBananaResult ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEE', paddingBottom: '1.5rem' }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>🍌 Nano Banana Промпт</h2>
                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Готов к использованию в Nano Banana AI</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="icon-btn-luxury" onClick={() => { navigator.clipboard.writeText(nanoBananaResult.mainPrompt); alert('Промпт скопирован!'); }} title="Копировать промпт">
                              <Copy size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Layers info banner */}
                        <div style={{ background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', borderRadius: '16px', padding: '1.2rem 1.5rem', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '2px' }}>🍌 ИНСТРУКЦИЯ ДЛЯ СЛОЕВ</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                              { n: '1', t: 'Вставь промпт ниже в Nano Banana → Генерируй фон' },
                              { n: '2', t: 'Прикрепи изделие (Product) — ИИ подготовил под него фокус' },
                              { n: '3', t: 'Прикрепи логотип (Logo) — ИИ оставил место вверху по центру' },
                            ].map(s => (
                              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#D4AF37', color: '#000', fontSize: '0.65rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                                <span style={{ fontSize: '0.78rem', color: '#FFF', opacity: 0.9 }}>{s.t}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Main Prompt */}
                        <div style={{ background: '#000', borderRadius: '20px', padding: '2rem', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '2px' }}>MAIN PROMPT</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(nanoBananaResult.mainPrompt); alert('Промпт скопирован!'); }}
                              style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Copy size={12} /> КОПИРОВАТЬ
                            </button>
                          </div>
                          <p style={{ color: '#FFF', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{nanoBananaResult.mainPrompt}</p>
                          <a
                            href="https://gemini.google.com/app?android-min-version=301356232&ios-min-version=322.0&is_sa=1&hl=en-KZ&utm_campaign=microsite_gemini_image_generation_page&icid=microsite_gemini_image_generation_page&utm_source=gemini&utm_medium=web&_gl=1*1fhbfmd*_gcl_au*MjA0Mjc0Nzk3My4xNzc3MDI0Mjc1*_ga*MTQ1Mzg2MDk5NS4xNzY2NDkwNzI3*_ga_WC57KJ50ZZ*czE3NzcwMjQyNzgkbzQkZzAkdDE3NzcwMjQyNzgkajYwJGwwJGgw"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: '1rem',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '1px solid rgba(212,175,55,0.45)',
                              background: 'rgba(212,175,55,0.16)',
                              color: '#F5D76E',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              letterSpacing: '0.4px',
                              textDecoration: 'none',
                            }}
                          >
                            Перейти в Nano Banana
                          </a>
                        </div>

                        {/* Negative Prompt */}
                        {nanoBananaResult.negativePrompt && (
                          <div style={{ background: '#FFF5F5', borderRadius: '16px', padding: '1.5rem', border: '1px solid #FFE0E0' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#C62828', letterSpacing: '2px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <X size={14} /> NEGATIVE PROMPT
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0, lineHeight: 1.6 }}>{nanoBananaResult.negativePrompt}</p>
                          </div>
                        )}

                        {/* Technical Specs */}
                        {nanoBananaResult.technicalSpecs && (
                          <div style={{ background: '#F9F9FB', borderRadius: '16px', padding: '1.5rem', border: '1px solid #EEE' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5, letterSpacing: '2px', marginBottom: '10px' }}>📷 ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ</div>
                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{nanoBananaResult.technicalSpecs}</p>
                          </div>
                        )}

                        {/* Layer Instructions */}
                        {(nanoBananaResult.layerInstructions || nanoBananaResult.logoInstruction) && (
                          <div style={{ background: 'rgba(212,175,55,0.06)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '2px', marginBottom: '10px' }}>🔲 СЛОИ: ИЗДЕЛИЕ + ЛОГОТИП</div>
                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{nanoBananaResult.layerInstructions || nanoBananaResult.logoInstruction}</p>
                          </div>
                        )}

                        {/* Style Notes */}
                        {nanoBananaResult.styleNotes && (
                          <div style={{ background: '#F0FFF4', borderRadius: '16px', padding: '1.5rem', border: '1px solid #C6F6D5' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#276749', letterSpacing: '2px', marginBottom: '10px' }}>✅ СООТВЕТСТВИЕ СТИЛЮ TOMIORI</div>
                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6, color: '#276749' }}>{nanoBananaResult.styleNotes}</p>
                          </div>
                        )}

                        {/* Copy All Button */}
                        <button
                          onClick={() => {
                            const full = `MAIN PROMPT:\n${nanoBananaResult.mainPrompt}\n\nNEGATIVE PROMPT:\n${nanoBananaResult.negativePrompt}\n\nТЕХНИЧЕСКИЕ ПАРАМЕТРЫ:\n${nanoBananaResult.technicalSpecs}`;
                            navigator.clipboard.writeText(full);
                            alert('Полный промпт скопирован!');
                          }}
                          style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 100%)', color: '#000', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                          <Copy size={18} /> СКОПИРОВАТЬ ПОЛНЫЙ ПРОМПТ
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </>
              ) : !result && !isGenerating ? (
                <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                   <Bot size={80} color="#DDD" />
                   <h3 style={{ marginTop: '2rem', opacity: 0.3 }}>ОЖИДАНИЕ ЗАПРОСА</h3>
                   <p style={{ maxWidth: '300px', margin: '1rem auto', fontSize: '0.85rem', opacity: 0.5 }}>Выберите модуль и опишите задачу. ИИ Tomiori готов к работе.</p>
                </div>
              ) : isGenerating ? (
                <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                   <div className="ai-loader-container"><div className="loader-orbit" /><Sparkles size={45} color="#D4AF37" /></div>
                   <h3 style={{ marginTop: '2rem', letterSpacing: '2px' }}>АНАЛИЗ ДАННЫХ...</h3>
                   <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Агенты Tomiori собирают информацию из Memory Bank</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                   <div style={{ background: '#FFF', padding: '3rem', borderRadius: '32px', border: '1px solid #EEE', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                      
                      {/* High-end Specialized Designers (Priority) */}
                      {result?.scenes ? (
                        <ReelsResultCard result={result} />
                      ) : result?.series ? (
                        <StoriesResultCard result={result} />
                      ) : ((activeTab === 'funnel' || (result?.stages && !result?.days)) && result?.stages) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                           <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                              <h2 style={{ color: '#D4AF37' }}>{result.title}</h2>
                              <p style={{ opacity: 0.6 }}>{result.description}</p>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              {result.stages.map((s: any, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: '20px' }}>
                                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#000', color: '#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', zIndex: 2 }}>{i+1}</div>
                                      {i < result.stages.length - 1 && <div style={{ flex: 1, width: '2px', background: '#EEE', margin: '5px 0' }} />}
                                   </div>
                                   <div style={{ flex: 1, padding: '25px', background: '#F9F9FB', borderRadius: '20px', border: '1px solid #EEE' }}>
                                      <h4 style={{ margin: 0, color: '#D4AF37' }}>{s.name}</h4>
                                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '10px 0' }}>{s.goal}</p>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0' }}>
                                         {s.platforms?.map((p: string) => <span key={p} style={{ fontSize: '0.65rem', padding: '4px 10px', background: '#FFF', border: '1px solid #EEE', borderRadius: '20px' }}>{p}</span>)}
                                      </div>
                                      <div style={{ background: '#FFF', padding: '15px', borderRadius: '12px', marginTop: '15px' }}>
                                         <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Контент-стратегия</span>
                                         <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '0.85rem' }}>
                                            {s.contentIdeas?.map((idea: string, j: number) => <li key={j} style={{ marginBottom: '5px' }}>{idea}</li>)}
                                         </ul>
                                      </div>
                                      <div style={{ marginTop: '15px', fontSize: '0.75rem', fontWeight: 'bold' }}>📈 KPI: {s.kpi}</div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ) : ((activeTab === 'content_plan' || (result.days && !result.stages)) && result.days) ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #EEE', paddingBottom:'1.5rem' }}>
                               <h2 style={{ margin: 0 }}>{result.title}</h2>
                               <div style={{ display:'flex', gap:'10px' }}>
                                  <button className="icon-btn-luxury" onClick={() => window.print()}><Printer size={18}/></button>
                                  <button className="icon-btn-luxury" onClick={() => {navigator.clipboard.writeText(JSON.stringify(result, null, 2)); alert('План скопирован!')}}><Copy size={18}/></button>
                               </div>
                            </div>
                            {(result.strategySummary || (Array.isArray(result.weeklyGoals) && result.weeklyGoals.length > 0)) && (
                              <div style={{ padding: '20px', borderRadius: '18px', border: '1px solid #EEE', background: '#FAFAFA' }}>
                                {result.strategySummary && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>СТРАТЕГИЧЕСКОЕ РЕЗЮМЕ</div>
                                    <div style={{ marginTop: '6px', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.strategySummary}</div>
                                  </div>
                                )}
                                {Array.isArray(result.weeklyGoals) && result.weeklyGoals.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>ЦЕЛИ НЕДЕЛИ</div>
                                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                      {result.weeklyGoals.map((g: string, i: number) => <li key={i}>{g}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            {result.days.map((d: any) => (
                              <div key={d.day} style={{ display: 'flex', gap: '30px' }}>
                                <div style={{ width: '80px', flexShrink: 0 }}>
                                   <div style={{ fontSize: '2rem', fontWeight: '900', color: '#D4AF37' }}>{d.day < 10 ? `0${d.day}` : d.day}</div>
                                   <div style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5, textTransform: 'uppercase' }}>ДЕНЬ</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>{d.theme}</h3>
                                  {(d.dayGoal || d.audienceIntent) && (
                                    <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '12px', border: '1px solid #EEE', background: '#FFF' }}>
                                      {d.dayGoal && <div style={{ fontSize: '0.8rem', marginBottom: d.audienceIntent ? '6px' : 0 }}><strong>Цель дня:</strong> {d.dayGoal}</div>}
                                      {d.audienceIntent && <div style={{ fontSize: '0.78rem', opacity: 0.8 }}><strong>Инсайт аудитории:</strong> {d.audienceIntent}</div>}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                     {d.content?.map((c: any, i: number) => (
                                       <div key={i} style={{ padding: '25px', background: '#F9F9FB', borderRadius: '24px', border: '1px solid #EEE' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                             <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#FFF', background: '#D4AF37', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>{c.type}</span>
                                             <h5 style={{ margin: 0, fontSize: '1rem' }}>{c.title}</h5>
                                          </div>
                                          <div style={{ margin: '15px 0', padding: '15px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', borderLeft: '3px solid #D4AF37' }}>
                                             <span style={{ fontSize: '0.65rem', fontWeight: 'bold', opacity: 0.5 }}>ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ</span>
                                             <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{c.description}</p>
                                          </div>
                                          {c.visualBrief && (
                                            <div style={{ margin: '10px 0', fontSize: '0.8rem', opacity: 0.85 }}>
                                              <strong>Visual Brief:</strong> {c.visualBrief}
                                            </div>
                                          )}
                                          <div style={{ background: '#FFF', padding: '20px', borderRadius: '15px', border: '1px solid #EEE' }}>
                                             <div style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>🪝 {c.hook}</div>
                                             <div className="markdown-prose" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{c.caption}</div>
                                          </div>
                                          {(c.cta || c.kpi || c.offerAngle) && (
                                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.76rem', opacity: 0.85 }}>
                                              {c.cta && <div><strong>CTA:</strong> {c.cta}</div>}
                                              {c.kpi && <div><strong>KPI:</strong> {c.kpi}</div>}
                                              {c.offerAngle && <div><strong>Offer:</strong> {c.offerAngle}</div>}
                                            </div>
                                          )}
                                       </div>
                                     ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                         </div>
                      ) : activeTab === 'trends' && result?.globalBriefing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                           <section>
                              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                                 <Globe size={24} color="#D4AF37" />
                                 <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{result.globalBriefing.title}</h3>
                              </div>
                              <div style={{ padding:'25px', background:'rgba(212, 175, 55, 0.05)', borderRadius:'24px', border:'1px solid rgba(212, 175, 55, 0.1)' }}>
                                 <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: '500', lineHeight: 1.6 }}>{result.globalBriefing.summary}</p>
                                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px' }}>
                                    {result.globalBriefing.highlights.map((h: any, i: number) => (
                                      <div key={i} style={{ padding:'15px', background:'#FFF', borderRadius:'16px', border:'1px solid #EEE' }}>
                                         <div style={{ fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37' }} />
                                            {h.item}
                                         </div>
                                         <div style={{ fontSize:'0.8rem', opacity: 0.6 }}>{h.detail}</div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           </section>
                           <section>
                              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                                 <MapPin size={24} color="#D4AF37" />
                                 <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{result.kazakhstanReport.title}</h3>
                              </div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px' }}>
                                 <div style={{ padding:'25px', background:'#FFF', borderRadius:'24px', border:'1px solid #EEE' }}>
                                    <h5 style={{ margin:'0 0 10px 0', opacity: 0.5, fontSize:'0.7rem', textTransform:'uppercase' }}>ПРОГНОЗ РЫНКА РК</h5>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{result.kazakhstanReport.forecast}</div>
                                    <div style={{ marginTop:'15px', fontSize:'0.8rem', opacity: 0.7 }}>{result.kazakhstanReport.hotSpots}</div>
                                 </div>
                                 <div style={{ padding:'25px', background:'#FFF', borderRadius:'24px', border:'1px solid #EEE' }}>
                                    <h5 style={{ margin:'0 0 10px 0', opacity: 0.5, fontSize:'0.7rem', textTransform:'uppercase' }}>ЛОКАЛЬНЫЕ ИГРОКИ (Benchmark)</h5>
                                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                       {result.kazakhstanReport.localPlayers.map((p: any, i: number) => (
                                         <div key={i} style={{ fontSize:'0.85rem' }}>
                                            <span style={{ fontWeight:'bold' }}>{p.name}:</span>
                                            <span style={{ marginLeft:'5px', opacity: 0.7 }}>{p.style}</span>
                                         </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </section>
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px' }}>
                              <section style={{ padding:'25px', background:'#000', borderRadius:'24px', color:'#FFF' }}>
                                 <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px' }}>
                                    <BarChart3 size={18} color="#D4AF37" />
                                    <span style={{ fontSize:'0.8rem', fontWeight:'bold' }}>СЫРЬЕ И ИНВЕСТИЦИИ</span>
                                 </div>
                                 <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
                                    <div>
                                       <div style={{ fontSize:'0.7rem', opacity: 0.5 }}>ЦЕНЫ НА ЗОЛОТО</div>
                                       <div style={{ fontSize:'0.9rem' }}>{result.commodities.goldStatus}</div>
                                    </div>
                                    <div>
                                       <div style={{ fontSize:'0.7rem', opacity: 0.5 }}>LAB-GROWN РЕВОЛЮЦИЯ</div>
                                       <div style={{ fontSize:'0.9rem' }}>{result.commodities.labGrownTrend}</div>
                                    </div>
                                 </div>
                              </section>
                              <section style={{ padding:'25px', background:'linear-gradient(135deg, #1877F2 0%, #000 100%)', borderRadius:'24px', color:'#FFF' }}>
                                 <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px' }}>
                                    <Share2 size={18} />
                                    <span style={{ fontSize:'0.8rem', fontWeight:'bold' }}>SOCIAL SENTIMENT</span>
                                 </div>
                                 <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
                                    <div>
                                       <div style={{ fontSize:'0.7rem', opacity: 0.5 }}>ТОП ТЕМА</div>
                                       <div style={{ fontSize:'0.9rem' }}>{result.socialSentiment.topTopic}</div>
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                       <div>
                                          <div style={{ fontSize:'0.7rem', opacity: 0.5 }}>KEYWORD</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFF' }}>#{result.socialSentiment.viralKeyword}</div>
                                       </div>
                                       <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem' }}>
                                          {result.socialSentiment.platformVibe}
                                       </div>
                                    </div>
                                 </div>
                              </section>
                           </div>

                           {/* INSTAGRAM INSIGHTS IN TRENDS */}
                           {result.instagramInsights && (
                              <section style={{ background: 'linear-gradient(135deg, #E1306C 0%, #833AB4 100%)', borderRadius: '24px', padding: '24px', color: '#FFF' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                       <Share2 size={24} />
                                       <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Real-time Instagram Pulse</h3>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px' }}>
                                       Source: {result.instagramInsights.source}
                                    </span>
                                 </div>
                                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                                    {result.instagramInsights.recentPosts.map((post: any, i: number) => (
                                       <a key={i} href={post.permalink} target="_blank" rel="noreferrer" 
                                          style={{ aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', display: 'block' }}>
                                          <img 
                                             src={`/api/proxy-image?url=${encodeURIComponent(post.url)}`} 
                                             alt="" 
                                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                             onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = post.url;
                                             }}
                                          />
                                       </a>
                                    ))}
                                 </div>
                                 <div style={{ marginTop: '15px', fontSize: '0.8rem', opacity: 0.9 }}>
                                    Анализ {result.instagramInsights.topMediaCount} топовых постов по хэштегу за последние 24 часа.
                                 </div>
                              </section>
                           )}

                           <section>
                              <h4 style={{ margin:'0 0 20px 0', fontSize:'0.9rem', opacity: 0.5, letterSpacing:'1px' }}>ВИЗУАЛЬНЫЕ КОДЫ 2026</h4>
                              <div style={{ display:'flex', gap:'15px', overflowX:'auto', paddingBottom:'10px' }}>
                                 {result.styles.map((s: any, i: number) => (
                                   <div key={i} style={{ minWidth:'250px', padding:'20px', background:'#FFF', borderRadius:'20px', border:'1px solid #EEE', textAlign:'center' }}>
                                      <div style={{ fontSize:'2.5rem', marginBottom:'10px' }}>{s.visual}</div>
                                      <div style={{ fontWeight:'bold', marginBottom:'5px' }}>{s.name}</div>
                                      <div style={{ fontSize:'0.8rem', opacity: 0.6 }}>{s.details}</div>
                                   </div>
                                 ))}
                              </div>
                           </section>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #EEE', paddingTop:'20px' }}>
                              <div style={{ display:'flex', gap:'8px' }}>
                                 {result.hashtags.map((t: any) => (
                                    <span key={t.id} style={{ fontSize:'0.75rem', color: '#D4AF37', fontWeight: '600' }}>{t.name}</span>
                                 ))}
                              </div>
                              <div style={{ fontSize:'0.7rem', opacity: 0.4 }}>Обновлено: {result.timestamp}</div>
                           </div>
                        </div>
                      ) : (activeTab === 'competitor' && (result || activeScrapedData)) ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* LIVE FEED CAROUSEL - SEPARATE SECTION */}
                            {activeScrapedData?.posts && activeScrapedData.posts.length > 0 && (
                               <div style={{ background: '#FFF', borderRadius: '32px', padding: '30px', border: '1px solid #EEE', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', boxShadow: '0 0 15px rgba(225,48,108,0.4)' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '900', letterSpacing: '3px', color: '#000', textTransform: 'uppercase' }}>Live Brand Feed</span>
                                     </div>
                                     <div style={{ fontSize: '0.7rem', color: '#AAA', fontWeight: 'bold' }}>AUTO-ROTATING • {activeScrapedData.posts.length} POSTS</div>
                                  </div>
                                  
                                  <div style={{ overflow: 'hidden', position: 'relative', width: '100%' }}>
                                     <div className="infinite-scroll-container" style={{ animation: `infiniteScroll ${Math.max(20, activeScrapedData.posts.length * 2.5)}s linear infinite` }}>
                                        {/* Original items */}
                                        {activeScrapedData.posts.map((post: any, i: number) => (
                                           <a key={`orig-${i}`} href={post.permalink || '#'} target="_blank" rel="noreferrer" 
                                              style={{ position: 'relative', minWidth: '220px', width: '220px', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', border: '1px solid #F0F0F0', display: 'block', flexShrink: 0 }}>
                                              <img 
                                                 src={`/api/proxy-image?url=${encodeURIComponent(post.url)}`} 
                                                 alt={post.caption} 
                                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                 onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = post.url;
                                                 }}
                                              />
                                              {(post.likes || post.comments) && (
                                                 <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', color: '#FFF', fontSize: '0.75rem', display: 'flex', gap: '15px', fontWeight: 'bold' }}>
                                                    {post.likes && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>❤️ {post.likes}</span>}
                                                    {post.comments && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💬 {post.comments}</span>}
                                                 </div>
                                              )}
                                           </a>
                                        ))}
                                        {/* Duplicated items for infinite scroll */}
                                        {activeScrapedData.posts.map((post: any, i: number) => (
                                           <a key={`dup-${i}`} href={post.permalink || '#'} target="_blank" rel="noreferrer" 
                                              style={{ position: 'relative', minWidth: '220px', width: '220px', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', border: '1px solid #F0F0F0', display: 'block', flexShrink: 0 }}>
                                              <img 
                                                 src={`/api/proxy-image?url=${encodeURIComponent(post.url)}`} 
                                                 alt={post.caption} 
                                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                 onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = post.url;
                                                 }}
                                              />
                                              {(post.likes || post.comments) && (
                                                 <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', color: '#FFF', fontSize: '0.75rem', display: 'flex', gap: '15px', fontWeight: 'bold' }}>
                                                    {post.likes && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>❤️ {post.likes}</span>}
                                                    {post.comments && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💬 {post.comments}</span>}
                                                 </div>
                                              )}
                                           </a>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            )}

                            {result && (
                               <div style={{ background: '#FFF', padding: '40px', borderRadius: '32px', border: '1px solid #EEE', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #EEE', paddingBottom:'25px', marginBottom: '25px' }}>
                                     <div>
                                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>Аналитический отчет</h2>
                                        <span style={{ fontSize:'0.75rem', opacity: 0.5, letterSpacing: '1px' }}>Tomiori Strategic Intel v5.0</span>
                                     </div>
                                     <div style={{ display:'flex', gap:'12px' }}>
                                        <button className="icon-btn-luxury" onClick={() => window.print()}><Printer size={20}/></button>
                                     </div>
                                  </div>
                                  
                                  {/* Luxury Styled Report Container */}
                                  <div style={{ background: '#000', color: '#FFF', padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden', marginBottom: '30px' }}>
                                     <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '10rem', opacity: 0.05, transform: 'rotate(15deg)' }}>⚔️</div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '3px', marginBottom: '15px', textTransform: 'uppercase' }}>
                                        <ShieldCheck size={16} /> PERFORMANCE AUDIT
                                     </div>
                                     <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '10px', lineHeight: 1.1 }}>
                                        {(activeTab as string) === 'meta_ads' ? 'Рекламная стратегия' : 'Стратегический разбор'}
                                     </h3>
                                     <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
                                        {(activeTab as string) === 'meta_ads' ? 'Технический план запуска и масштабирования кампаний.' : 'Глубокий анализ ДНК бренда, контент-матрицы и точек роста.'}
                                     </p>
                                  </div>

                                  <div className="markdown-prose luxury-report" style={{ color: (activeTab as string) === 'meta_ads' ? '#1A1A1A' : 'inherit' }}>
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof result === 'string' ? result : (result.analysisReport || result.answer || result.report || result.advice || JSON.stringify(result, null, 2))}</ReactMarkdown>
                                  </div>
                               </div>
                            )}
                         </div>
                      ) : (
                        <div style={{ background: '#FFF', padding: '3rem', borderRadius: '32px', border: '1px solid #EEE', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                           <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #EEE', paddingBottom:'25px', marginBottom: '25px' }}>
                              <div>
                                 <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>Результат генерации</h2>
                                 <span style={{ fontSize:'0.75rem', opacity: 0.5, letterSpacing: '1px' }}>Tomiori Creative AI v5.0</span>
                              </div>
                              <div style={{ display:'flex', gap:'12px' }}>
                                 <button className="icon-btn-luxury" onClick={() => window.print()}><Printer size={20}/></button>
                              </div>
                           </div>
                           
                           {result.error ? (
                              <div style={{ padding: '25px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                 <AlertCircle size={24} />
                                 <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Ошибка генерации</div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{result.error}</div>
                                 </div>
                              </div>
                           ) : ((activeTab as string) === 'reels_director' && result?.scenes) ? (
                              <ReelsResultCard result={result} />
                           ) : ((activeTab as string) === 'stories_architect' && result?.series) ? (
                              <StoriesResultCard result={result} />
                           ) : ((activeTab as string) === 'meta_ads') ? (
                              <div style={{ background: 'linear-gradient(135deg, #3b5998 0%, #4c70ba 100%)', color: '#FFF', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 50px rgba(59, 89, 152, 0.25)', position: 'relative', overflow: 'hidden' }}>
                                 <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.1, transform: 'rotate(-15deg)' }}>📈</div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '3px', marginBottom: '20px', textTransform: 'uppercase' }}>
                                    <Share2 size={16} /> Meta Ads Consultant v5.0
                                 </div>
                                 <div className="markdown-prose" style={{ color: '#FFF' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof result === 'string' ? result : (result.report || JSON.stringify(result, null, 2))}</ReactMarkdown>
                                 </div>
                              </div>
                           ) : (
                              <div className="markdown-prose">
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof result === 'string' ? result : (result.answer || result.advice || result.report || JSON.stringify(result, null, 2))}</ReactMarkdown>
                              </div>
                           )}
                        </div>
                      )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
          </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-content" onClick={e => e.stopPropagation()}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Настройки</h2>
                  <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {/* BRAIN SWITCHER */}
                   <div>
                     <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', opacity: 0.4, textTransform: 'uppercase', marginBottom: '10px' }}>🧠 Мозг ИИ</div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                       {/* GEMINI BLOCK */}
                       <div style={{ border: apiConfig.provider === 'gemini' ? '2px solid #D4AF37' : '2px solid #EEE', borderRadius: '16px', padding: '14px', cursor: 'pointer', background: apiConfig.provider === 'gemini' ? 'rgba(212,175,55,0.05)' : '#FFF', transition: 'all 0.2s' }}
                         onClick={() => saveConfig({...apiConfig, provider: 'gemini', model: 'gemini-2.5-flash'})}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                           <span style={{ fontSize: '1.2rem' }}>🔵</span>
                           <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>Google Gemini</span>
                           {apiConfig.provider === 'gemini' && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                           {[
                             { m: 'gemini-2.5-flash', l: '2.5 Flash ⚡' },
                             { m: 'gemini-2.5-pro', l: '2.5 Pro 🧠' },
                             { m: 'gemini-3-flash-preview', l: '3.0 Flash 🚀' },
                             { m: 'gemini-3-pro-preview', l: '3.0 Pro 👑' },
                           ].map(o => (
                             <button key={o.m} onClick={e => { e.stopPropagation(); saveConfig({...apiConfig, provider: 'gemini', model: o.m}); }}
                               style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                 background: apiConfig.provider === 'gemini' && apiConfig.model === o.m ? '#000' : '#F1F3F5',
                                 color: apiConfig.provider === 'gemini' && apiConfig.model === o.m ? '#D4AF37' : '#555',
                               }}>{o.l}</button>
                           ))}
                         </div>
                       </div>
                       {/* OPENAI BLOCK */}
                       <div style={{ border: apiConfig.provider === 'openai' ? '2px solid #10B981' : '2px solid #EEE', borderRadius: '16px', padding: '14px', cursor: 'pointer', background: apiConfig.provider === 'openai' ? 'rgba(16,185,129,0.05)' : '#FFF', transition: 'all 0.2s' }}
                         onClick={() => saveConfig({...apiConfig, provider: 'openai', model: 'gpt-4o'})}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                           <span style={{ fontSize: '1.2rem' }}>🟢</span>
                           <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>OpenAI GPT</span>
                           {apiConfig.provider === 'openai' && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                           {[
                             { m: 'gpt-4o', l: 'GPT-4o ⚡' },
                             { m: 'gpt-4o-mini', l: 'GPT-4o Mini 💨' },
                             { m: 'gpt-4-turbo', l: 'GPT-4 Turbo 🧠' },
                             { m: 'o1-mini', l: 'o1 Mini 🔬' },
                           ].map(o => (
                             <button key={o.m} onClick={e => { e.stopPropagation(); saveConfig({...apiConfig, provider: 'openai', model: o.m}); }}
                               style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                 background: apiConfig.provider === 'openai' && apiConfig.model === o.m ? '#000' : '#F1F3F5',
                                 color: apiConfig.provider === 'openai' && apiConfig.model === o.m ? '#10B981' : '#555',
                               }}>{o.l}</button>
                           ))}
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* ACTIVE MODEL BADGE */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid #EEE' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', flexShrink: 0 }} />
                     <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Активно:</span>
                     <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: '800' }}>{apiConfig.provider.toUpperCase()} / {apiConfig.model}</span>
                   </div>
                   
                   <div>
                      <label style={{ fontSize:'0.7rem', fontWeight:'bold', opacity:0.5, textTransform:'uppercase', marginBottom:'5px', display:'block' }}>API Key — {apiConfig.provider.toUpperCase()}</label>
                      <input type="password" placeholder={`Enter ${apiConfig.provider} API Key`} className="luxury-input" value={
                        apiConfig.provider === 'openai' ? apiConfig.openaiKey : 
                        apiConfig.provider === 'gemini' ? apiConfig.geminiKey :
                        apiConfig.provider === 'openrouter' ? apiConfig.openRouterKey :
                        apiConfig.grokKey
                      } onChange={(e) => {
                        const val = e.target.value;
                        if (apiConfig.provider === 'openai') setApiConfig({...apiConfig, openaiKey: val});
                        else if (apiConfig.provider === 'gemini') setApiConfig({...apiConfig, geminiKey: val});
                        else if (apiConfig.provider === 'openrouter') setApiConfig({...apiConfig, openRouterKey: val});
                        else setApiConfig({...apiConfig, grokKey: val});
                      }} />
                   </div>

                  <button 
                    disabled={isTestLoading}
                    onClick={async () => {
                      setIsTestLoading(true);
                      setTestStatus(null);
                      try {
                        const res = await fetch('/api/crm/ai/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            provider: apiConfig.provider, 
                            apiKey: apiConfig.provider === 'openai' ? apiConfig.openaiKey : apiConfig.geminiKey,
                            model: apiConfig.model
                          })
                        });
                        const data = await res.json();
                        setTestStatus(data);
                      } catch (e: any) { setTestStatus({ success: false, message: 'Ошибка сети' }); }
                      setIsTestLoading(false);
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#F1F3F5', border: 'none', fontWeight: 'bold' }}
                  >
                    {isTestLoading ? 'ПРОВЕРКА...' : 'ПРОВЕРИТЬ СВЯЗЬ'}
                  </button>

                  {testStatus && (
                    <div style={{ padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', background: testStatus.success ? '#E8F5E9' : '#FFEBEE', color: testStatus.success ? '#2E7D32' : '#C62828' }}>
                       {testStatus.success ? 'Соединение установлено!' : testStatus.error || testStatus.message}
                    </div>
                  )}

                  <button onClick={() => { localStorage.setItem('tomiori_ai_config', JSON.stringify(apiConfig)); setIsSettingsOpen(false); }} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', color: '#FFF', border: 'none', fontWeight: 'bold' }}>СОХРАНИТЬ</button>

                  <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #EEE' }}>
                    <button 
                      onClick={handleHardReset}
                      style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'none', border: '1.5px solid #EF4444', color: '#EF4444', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      СБРОСИТЬ СОСТОЯНИЕ (ХАРД-РЕСЕТ)
                    </button>
                    <p style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'center', marginTop: '8px' }}>
                      Используйте, если лента зависла или не обновляется
                    </p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .luxury-input { width: 100%; border-radius: 12px; border: 1px solid #EEE; padding: 12px; background: #F9F9FB; outline: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #FFF; padding: 2rem; border-radius: 20px; width: 440px; }
        .provider-btn { padding: 10px; border-radius: 10px; border: 1px solid #EEE; background: #FFF; cursor: pointer; font-size: 0.75rem; transition: 0.2s; }
        .provider-btn.active { background: #000; color: #FFF; border-color: #000; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes infiniteScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .infinite-scroll-container {
          display: flex;
          gap: 15px;
          width: max-content;
        }
        .infinite-scroll-container:hover {
          animation-play-state: paused;
        }
        .ai-loader-container { position: relative; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
        .loader-orbit { position: absolute; width: 100%; height: 100%; border: 3px solid transparent; border-top-color: #D4AF37; border-radius: 50%; animation: spin 1s linear infinite; }
        .markdown-prose { line-height: 1.6; }
        .param-input { display: flex; flex-direction: column; gap: 5px; }
        .param-input label { font-size: 0.65rem; font-weight: bold; opacity: 0.5; text-transform: uppercase; }
        .param-input input { width: 100%; padding: 10px; border: 1px solid #EEE; border-radius: 10px; background: #FFF; outline: none; transition: 0.2s; }
        .param-input input:focus { border-color: #D4AF37; }
        .history-item { cursor: pointer; padding: 15px; background: #F9F9FB; border-radius: 15px; border: 1px solid #EEE; transition: 0.2s; overflow: hidden; }
        .history-item:hover { transform: translateX(5px); border-color: #D4AF37; background: #FFF; }
        .icon-btn-luxury { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #FFF; border: 1px solid #EEE; border-radius: 12px; cursor: pointer; transition: 0.2s; }
        .icon-btn-luxury:hover { background: #000; color: #FFF; border-color: #000; transform: translateY(-2px); }
        .info-box { display: flex; align-items: center; gap: 10px; padding: 12px 15px; background: rgba(212, 175, 55, 0.08); border-radius: 12px; font-size: 0.8rem; color: #000; border: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 20px; }
      `}</style>
    </div>
  );
}
