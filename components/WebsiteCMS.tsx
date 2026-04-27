import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Image as ImageIcon, CheckCircle, Activity, Layout, Settings as GearIcon, FileText, Globe, ShoppingBag, Users as UsersIcon, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PHP_SHOP_API = process.env.NEXT_PUBLIC_SHOP_API || 'http://localhost:8080/api';

const ImageUploadInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          onChange(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = ev.target?.result as string;
      };
      r.readAsDataURL(file);
    }
  };
  return (
    <div style={{ marginBottom: '10px' }}>
      <label className="cms-label">{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input className="luxury-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="URL картинки или загрузите" style={{ flex: 1 }} />
        <label style={{ background: '#F1F3F5', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748B' }}>
          <Upload size={14} /> Загрузить
          <input type="file" hidden accept="image/*" onChange={handleFile} />
        </label>
      </div>
      {value && <img src={value} alt="Preview" style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '8px', border: '1px solid #E5E7EB', objectFit: 'cover' }} />}
    </div>
  );
};

export default function WebsiteCMS() {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'categories' | 'news' | 'orders' | 'users' | 'health'>('settings');
  const [categories, setCategories] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [crmLeads, setCrmLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  
  const [settings, setSettings] = useState<any>({
    heroTitle: '', heroSubtitle: '', heroBtn: '', heroLink: '', footerText: '', phone: '', address: '', time: '',
    heroBg: '', lookbookBanner: '', lookbookTitle: '', lookbookSubtitle: '', lookbookLink: '',
    editorialTitle1: '', editorialDesc1: '', editorialImg1: '', editorialLink1: '',
    editorialTitle2: '', editorialImg2: '', editorialLink2: '',
    editorialTitle3: '', editorialImg3: '', editorialLink3: ''
  });
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => { fetchData(); }, [activeSubTab]);

  const fetchData = async () => {
    try {
      if (activeSubTab === 'settings') {
        const res = await fetch(`/api/crm/settings`);
        const data = await res.json();
        if (data.success) setSettings(data.settings);
      } else if (activeSubTab === 'categories') {
        const res = await fetch(`/api/crm/categories`);
        const data = await res.json();
        if (data.success) setCategories(data.categories.sort((a:any, b:any) => a.sort - b.sort));
      } else if (activeSubTab === 'news') {
        const res = await fetch(`/api/crm/news`);
        const data = await res.json();
        if (data.success) setNews(data.news);
      } else if (activeSubTab === 'orders') {
        const res = await fetch(`/api/crm/leads`);
        const data = await res.json();
        if (data.success) {
          const allOrders = data.leads
            .filter((l: any) => l.source === 'website')
            .map((l: any) => ({
              id: l.id.toString().startsWith('MAIN-') ? l.id : 'MAIN-' + l.id,
              name: l.name,
              phone: l.phone,
              address: l.deliveryAddress || '',
              total: l.finalPrice || l.productPrice || 0,
              items: l.products || [],
              status: l.status === 'closed_won' ? 'выдан' : (l.status === 'new' ? 'новый' : l.status),
              created_at: l.createdAt,
              payment: l.paymentMethod || 'card',
              delivery: l.fulfillmentMethod || 'delivery'
            }));
          setOrders(allOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      } else if (activeSubTab === 'users') {
        const res = await fetch(`${PHP_SHOP_API}/users.php`);
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } else if (activeSubTab === 'health') {
        const res = await fetch(`${PHP_SHOP_API}/health.php`);
        const data = await res.json();
        setHealth(data);
      }
    } catch(e) { console.error('Error fetching CMS data', e); }
  };

  const notify = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`/api/crm/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) notify('Настройки сайта и баннеры синхронизированы!');
    } catch(e) { notify('Ошибка соединения'); }
  };

  const handleSaveCategory = async () => {
    try {
      const newCats = editingItem.id ? categories.map(c => c.id === editingItem.id ? editingItem : c) : [...categories, { ...editingItem, id: Date.now() }];
      const res = await fetch(`/api/crm/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCats)
      });
      if (res.ok) { notify('Категория сохранена и синхронизирована'); setEditingItem(null); fetchData(); }
    } catch(e) { notify('Ошибка'); }
  };

  const handleSaveNews = async () => {
    try {
      const newNews = editingItem.id ? news.map(n => n.id === editingItem.id ? editingItem : n) : [...news, { ...editingItem, id: Date.now(), date: new Date().toISOString() }];
      const res = await fetch(`/api/crm/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNews)
      });
      if (res.ok) { notify('Статья сохранена в Журнал'); setEditingItem(null); fetchData(); }
    } catch(e) { notify('Ошибка'); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить элемент?')) return;
    const endpoint = activeSubTab === 'categories' ? 'categories' : 'news';
    try {
      const items = activeSubTab === 'categories' ? categories : news;
      const filtered = items.filter(i => i.id !== id);
      const res = await fetch(`/api/crm/${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtered)
      });
      if (res.ok) {
        notify('Успешно удалено');
        fetchData();
      }
    } catch(e) { notify('Ошибка соединения'); }
  };

  const handleGoToCrm = (orderId: string) => {
    // Correctly navigate to Leads tab and scroll to specific lead
    const numericId = orderId.toString().replace('MAIN-', '');
    // Dispatch a custom event or use window location
    window.location.hash = 'leads';
    
    // Switch the tab in CRM page by simulating a click or using state if shared
    // Since this is a separate component, we rely on the hash change and CRM page effect
    setTimeout(() => {
      const element = document.getElementById(`lead-${numericId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.parentElement!.style.border = '2px solid var(--gold)';
        setTimeout(() => {
          if (element.parentElement) element.parentElement.style.border = '1px solid #EEE';
        }, 3000);
      }
    }, 300);
  };

  const handleUpdateOrderStatus = async (order: any, newStatus: string) => {
    try {
      const isCrmOrder = order.id.toString().startsWith('MAIN-');
      const numericId = isCrmOrder ? parseInt(order.id.toString().replace('MAIN-', '')) : null;

      if (isCrmOrder && numericId) {
        // Update via CRM API
        const crmStatus = newStatus === 'выдан' ? 'closed_won' : (newStatus === 'новый' ? 'new' : newStatus);
        const res = await fetch('/api/crm/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: numericId, status: crmStatus })
        });
        if (res.ok) {
          notify(`Статус CRM заказа #${numericId} изменен на ${newStatus}`);
          fetchData();
        }
      } else {
        // Update via PHP API (Fallback for standalone legacy orders)
        const res = await fetch(`${PHP_SHOP_API}/orders.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: order.id, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          notify(`Статус заказа изменен на ${newStatus}`);
          if (newStatus === 'выдан') {
            await fetch('/api/crm/store-order-complete', {
              method: 'POST', body: JSON.stringify({ order, action: 'issue' })
            });
          }
          fetchData();
        }
      }
    } catch(e) { notify('Ошибка обновления заказа'); }
  };

  const handleVerifyUser = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'verified' ? 'pending' : 'verified';
      const res = await fetch(`${PHP_SHOP_API}/users.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        notify('Статус пользователя обновлен');
        fetchData();
      }
    } catch(e) { notify('Ошибка обновления статуса пользователя'); }
  };

  return (
    <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.4rem', color: '#1A1A1A', margin: 0 }}>Управление <span style={{ color: 'var(--gold)' }}>Сайтом</span></h1>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> Подключено: {PHP_SHOP_API}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
            <button onClick={() => { setActiveSubTab('settings'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'settings' ? 'active' : ''}`}>
              <GearIcon size={16} /> Настройки
            </button>
            <button onClick={() => { setActiveSubTab('categories'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'categories' ? 'active' : ''}`}>
              <Layout size={16} /> Категории
            </button>
            <button onClick={() => { setActiveSubTab('news'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'news' ? 'active' : ''}`}>
              <FileText size={16} /> Журнал
            </button>
            <button onClick={() => { setActiveSubTab('orders'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'orders' ? 'active' : ''}`}>
              <ShoppingBag size={16} /> Заказы
            </button>
            <button onClick={() => { setActiveSubTab('users'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'users' ? 'active' : ''}`}>
              <UsersIcon size={16} /> Пользователи
            </button>
            <button onClick={() => { setActiveSubTab('health'); setEditingItem(null); }} className={`cms-tab ${activeSubTab === 'health' ? 'active' : ''}`}>
              <Activity size={16} /> Здоровье
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
            style={{ padding: '15px 20px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold-dark)' }}>
            <CheckCircle size={18} /> {status}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '24px', padding: '2.5rem', minHeight: '500px' }}>
        {activeSubTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '900px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', marginBottom: '2rem' }}>Главный экран (Hero)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><ImageUploadInput label="Фоновое изображение (Hero Bg)" value={settings.heroBg} onChange={(v) => setSettings({...settings, heroBg: v})} /></div>
              <div><label className="cms-label">Текст кнопки</label><input className="luxury-input" value={settings.heroBtn} onChange={(e) => setSettings({...settings, heroBtn: e.target.value})} /></div>
              <div><label className="cms-label">Заголовок Hero</label><input className="luxury-input" value={settings.heroTitle} onChange={(e) => setSettings({...settings, heroTitle: e.target.value})} /></div>
              <div><label className="cms-label">Подзаголовок</label><input className="luxury-input" value={settings.heroSubtitle} onChange={(e) => setSettings({...settings, heroSubtitle: e.target.value})} /></div>
              <div><label className="cms-label">Ссылка кнопки</label><input className="luxury-input" value={settings.heroLink} placeholder="#catalog, /news.php" onChange={(e) => setSettings({...settings, heroLink: e.target.value})} /></div>
            </div>

            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', margin: '3rem 0 2rem' }}>Lookbook Баннер</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><ImageUploadInput label="Изображение Banner" value={settings.lookbookBanner} onChange={(v) => setSettings({...settings, lookbookBanner: v})} /></div>
              <div><label className="cms-label">Заголовок</label><input className="luxury-input" value={settings.lookbookTitle} onChange={(e) => setSettings({...settings, lookbookTitle: e.target.value})} /></div>
              <div><label className="cms-label">Подзаголовок</label><input className="luxury-input" value={settings.lookbookSubtitle} onChange={(e) => setSettings({...settings, lookbookSubtitle: e.target.value})} /></div>
              <div><label className="cms-label">Ссылка баннера</label><input className="luxury-input" value={settings.lookbookLink} placeholder="#catalog" onChange={(e) => setSettings({...settings, lookbookLink: e.target.value})} /></div>
            </div>

            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', margin: '3rem 0 2rem' }}>Блоки (Editorial)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <h4 style={{ margin: '0 0 15px' }}>Карточка 1 (Большая)</h4>
                <label className="cms-label">Заголовок</label><input className="luxury-input" value={settings.editorialTitle1} onChange={(e) => setSettings({...settings, editorialTitle1: e.target.value})} style={{ marginBottom: '10px' }}/>
                <label className="cms-label">Текст</label><input className="luxury-input" value={settings.editorialDesc1} onChange={(e) => setSettings({...settings, editorialDesc1: e.target.value})} style={{ marginBottom: '10px' }}/>
                <label className="cms-label">Ссылка</label><input className="luxury-input" value={settings.editorialLink1} placeholder="#catalog" onChange={(e) => setSettings({...settings, editorialLink1: e.target.value})} style={{ marginBottom: '10px' }}/>
                <ImageUploadInput label="Изображение" value={settings.editorialImg1} onChange={(v) => setSettings({...settings, editorialImg1: v})} />
              </div>
              <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <h4 style={{ margin: '0 0 15px' }}>Карточка 2</h4>
                <label className="cms-label">Заголовок</label><input className="luxury-input" value={settings.editorialTitle2} onChange={(e) => setSettings({...settings, editorialTitle2: e.target.value})} style={{ marginBottom: '10px' }}/>
                <label className="cms-label">Ссылка</label><input className="luxury-input" value={settings.editorialLink2} placeholder="#catalog" onChange={(e) => setSettings({...settings, editorialLink2: e.target.value})} style={{ marginBottom: '10px' }}/>
                <ImageUploadInput label="Изображение" value={settings.editorialImg2} onChange={(v) => setSettings({...settings, editorialImg2: v})} />
              </div>
              <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <h4 style={{ margin: '0 0 15px' }}>Карточка 3</h4>
                <label className="cms-label">Заголовок</label><input className="luxury-input" value={settings.editorialTitle3} onChange={(e) => setSettings({...settings, editorialTitle3: e.target.value})} style={{ marginBottom: '10px' }}/>
                <label className="cms-label">Ссылка</label><input className="luxury-input" value={settings.editorialLink3} placeholder="#catalog" onChange={(e) => setSettings({...settings, editorialLink3: e.target.value})} style={{ marginBottom: '10px' }}/>
                <ImageUploadInput label="Изображение" value={settings.editorialImg3} onChange={(v) => setSettings({...settings, editorialImg3: v})} />
              </div>
            </div>

            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', margin: '3rem 0 2rem' }}>Контакты и подвал</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div><label className="cms-label">Телефон</label><input className="luxury-input" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} /></div>
              <div><label className="cms-label">Адрес</label><input className="luxury-input" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} /></div>
              <div><label className="cms-label">Время работы</label><input className="luxury-input" value={settings.time} onChange={(e) => setSettings({...settings, time: e.target.value})} /></div>
            </div>
            <div>
              <label className="cms-label">Описание бренда (Футер)</label>
              <textarea style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9F9FB', fontSize: '0.9rem', minHeight: '80px' }} 
                value={settings.footerText} onChange={(e) => setSettings({...settings, footerText: e.target.value})} />
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex' }}>
              <button onClick={handleSaveSettings} style={{ padding: '16px 32px', background: '#000', color: '#FFF', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <Save size={18} /> Применить изменения
              </button>
            </div>
          </motion.div>
        )}

        {(activeSubTab === 'categories' || activeSubTab === 'news') && !editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <button 
                onClick={() => setEditingItem(activeSubTab === 'categories' ? { name: '', image: '', sort: 99 } : { title: '', image: '', excerpt: '', content: '' })}
                style={{ padding: '12px 24px', background: '#1A1A1A', color: '#FFF', borderRadius: '30px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <Plus size={16} /> Создать {activeSubTab === 'categories' ? 'категорию' : 'новость'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {(activeSubTab === 'categories' ? categories : news).map((item) => (
                <div key={item.id} onClick={() => setEditingItem(item)} style={{ background: '#FFF', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image ? (<img src={item.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<ImageIcon size={30} color="#CBD5E1" />)}
                    <button onClick={(e) => handleDelete(item.id, e)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontFamily: 'Playfair Display' }}>{activeSubTab === 'categories' ? item.name : item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {editingItem && (activeSubTab === 'categories' || activeSubTab === 'news') && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: '800px', margin: '0 auto', background: '#FFF', borderRadius: '24px', padding: '3rem', boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin: '0 0 2rem', fontFamily: 'Playfair Display', fontSize: '2rem' }}>{editingItem.id ? 'Изменить' : 'Создать'}</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label className="cms-label">{activeSubTab === 'categories' ? 'Название коллекции' : 'Заголовок'}</label>
                <input value={editingItem.name || editingItem.title || ''} onChange={e => setEditingItem({...editingItem, [activeSubTab==='categories'?'name':'title']: e.target.value})} className="luxury-input" />
              </div>
              {activeSubTab === 'news' && (
                <div><label className="cms-label">Краткое описание (Анонс)</label><textarea value={editingItem.excerpt || ''} onChange={e => setEditingItem({...editingItem, excerpt: e.target.value})} className="luxury-input" style={{ minHeight: '80px' }} /></div>
              )}
              
              <ImageUploadInput label="Главное изображение" value={editingItem.image || ''} onChange={(v) => setEditingItem({...editingItem, image: v})} />
              
              <div>
                <label className="cms-label">{activeSubTab === 'categories' ? 'Краткое SEO Описание / Альт' : 'Полный текст'}</label>
                <textarea value={editingItem.description || editingItem.content || ''} onChange={e => setEditingItem({...editingItem, [activeSubTab==='categories'?'description':'content']: e.target.value})} className="luxury-input" style={{ minHeight: '150px' }} />
              </div>
              {activeSubTab === 'categories' && (
                <div><label className="cms-label">Порядок (чем меньше, тем выше)</label><input type="number" value={editingItem.sort || 0} onChange={e => setEditingItem({...editingItem, sort: parseInt(e.target.value)||0})} className="luxury-input" /></div>
              )}
              <div style={{ display: 'flex', gap: '15px', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #F1F3F5' }}>
                <button onClick={activeSubTab === 'categories' ? handleSaveCategory : handleSaveNews} style={{ padding: '16px 32px', background: 'var(--gold)', color: '#000', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '600' }}><Save size={18} /> Сохранить</button>
                <button onClick={() => setEditingItem(null)} style={{ padding: '16px 32px', background: '#F1F3F5', color: '#64748B', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Отмена</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ... tables and health tab identical ... */}
        {activeSubTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', marginBottom: '1rem' }}>Заказы с сайта ({orders.length})</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2rem' }}>
              Ниже объединены заказы из автономного магазина (PHP) и основного (Next.js), синхронизированные с CRM.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <thead style={{ background: '#F8F9FA' }}>
                  <tr style={{ textAlign: 'left', color: '#64748B', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px' }}>ID / Дата</th>
                    <th style={{ padding: '15px' }}>Клиент / Контакты</th>
                    <th style={{ padding: '15px' }}>Сумма / Детали</th>
                    <th style={{ padding: '15px' }}>Статус</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Render All Orders from PHP Shop Data (Includes synced Next.js orders) */}
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9', background: o.id.toString().startsWith('MAIN-') ? 'rgba(212,175,55,0.03)' : 'transparent' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>
                        <div style={{ color: o.id.toString().startsWith('MAIN-') ? 'var(--gold-dark)' : '#64748B', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {o.id.toString().startsWith('MAIN-') ? 'MAIN SHOP' : 'STANDALONE'}
                        </div>
                        <div>{o.id}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(o.created_at).toLocaleDateString('ru-RU')}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div>{o.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{o.phone}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{o.address}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold' }}>{(o.total || 0).toLocaleString()} ₸</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Товаров: {o.items?.length || 0}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                          background: o.status === 'выдан' || o.status === 'closed_won' ? '#DCFCE7' : o.status === 'оплачен' ? '#DBEAFE' : o.status === 'возврат' ? '#FEE2E2' : '#FEF3C7',
                          color: o.status === 'выдан' || o.status === 'closed_won' ? '#166534' : o.status === 'оплачен' ? '#1E40AF' : o.status === 'возврат' ? '#991B1B' : '#92400E'
                        }}>{o.status === 'new' ? 'Новый' : o.status}</span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <select 
                            className="luxury-input" 
                            style={{ width: '130px', padding: '8px', fontSize: '0.8rem' }}
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o, e.target.value)}
                          >
                            <option value="new">Новый</option>
                            <option value="ожидает оплаты">Ожидает оплаты</option>
                            <option value="оплачен">Оплачен</option>
                            <option value="выдан">Выдан (Исполнен)</option>
                            <option value="возврат">Возврат</option>
                          </select>
                          {o.id.toString().startsWith('MAIN-') && (
                            <button 
                              onClick={() => handleGoToCrm(o.id)} 
                              style={{ padding: '8px 12px', background: '#000', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                              В CRM →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Нет заказов</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', marginBottom: '2rem' }}>Зарегистрированные клиенты ({users.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <thead style={{ background: '#F8F9FA' }}>
                  <tr style={{ textAlign: 'left', color: '#64748B', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px' }}>ID / Дата</th>
                    <th style={{ padding: '15px' }}>Имя / Email / Тел</th>
                    <th style={{ padding: '15px' }}>Статус верификации</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>
                        <div>{u.id}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{u.phone}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                          background: u.status === 'verified' ? '#DCFCE7' : '#FEF3C7',
                          color: u.status === 'verified' ? '#166534' : '#92400E'
                        }}>{u.status === 'verified' ? 'Верифицирован' : 'Ожидает'}</span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleVerifyUser(u.id, u.status)}
                          style={{ padding: '8px 16px', background: u.status === 'verified' ? '#FEE2E2' : '#DCFCE7', color: u.status === 'verified' ? '#991B1B' : '#166534', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          {u.status === 'verified' ? 'Отозвать верификацию' : 'Подтвердить аккаунт'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Нет зарегистрированных пользователей</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'health' && health && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', marginBottom: '2rem' }}>Состояние системы</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#FFF', borderRadius: '16px', border: '1px solid #E5E7EB', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: health.status === 'ok' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} color={health.status === 'ok' ? '#166534' : '#92400E'} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px', fontSize: '1.1rem' }}>Общий статус платформы</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Пинг до API: OK</span>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: health.status === 'ok' ? '#166534' : '#92400E' }}>
                  {health.status === 'ok' ? 'СИСТЕМА В НОРМЕ' : 'ЕСТЬ ПРЕДУПРЕЖДЕНИЯ'}
                </div>
              </div>

              {[
                { label: 'Права записи в БД (JSON)', ok: health.health.db_write, desc: 'Директория data/ доступна для записи' },
                { label: 'Таблица товаров (products.json)', ok: health.health.db_products_exist, desc: 'Товарная матрица синхронизирована' },
                { label: 'Таблица заказов (orders.json)', ok: health.health.db_orders_exist, desc: 'Реестр заказов работает штатно' },
                { label: 'Таблица пользователей (users.json)', ok: health.health.db_users_exist, desc: 'Система авторизации активна' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: '#FFF', borderRadius: '16px', border: '1px solid #E5E7EB', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px' }}>{item.label}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{item.desc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.ok ? '#10B981' : '#EF4444', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.ok ? '#10B981' : '#EF4444', boxShadow: `0 0 10px ${item.ok ? '#10B981' : '#EF4444'}` }}></div>
                    {item.ok ? 'ИСПРАВНО' : 'ОШИБКА'}
                  </div>
                </div>
              ))}
              
              <div style={{ padding: '15px', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
                PHP v{health.health.php_version} • ОЗУ: {(health.health.memory_usage / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .cms-tab {
          padding: 10px 20px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 500; transition: 0.3s;
          background: transparent; color: #666; border: none; cursor: pointer;
        }
        .cms-tab.active {
          background: #FFF; color: var(--gold-dark); box-shadow: 0 4px 15px rgba(0,0,0,0.04);
        }
        .cms-label {
          display: block; font-size: 0.75rem; font-weight: bold; color: #666; margin-bottom: 8px; text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
