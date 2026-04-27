'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Heart, X, CheckCircle, Eye, Plus, Minus,
  Truck, Shield, Gift, Phone, Send, Star, MapPin, Clock, ChevronRight
} from 'lucide-react';
import './shop.css';

// Add missing styles for the checkout form and luxury select
const checkoutStyles = `
  .form-field input, .form-field textarea, .luxury-select {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    background: #F9FAFB;
  }
  .luxury-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m2 4 4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 15px center;
    cursor: pointer;
  }
  .form-field textarea { height: 80px; resize: none; }
`;

interface Product {
  id: string; category: string; name: string; article: string;
  price: number; stock: number; imageUrl?: string;
}
interface CartItem extends Product { quantity: number; }

const FALLBACK_IMAGES: Record<string, string> = {
  'Кольца': '/ring.png', 'перстни': '/ring.png',
  'Серьги': '/earrings.png', 'default': '/necklace.png',
};

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStep, setOrderStep] = useState<'browsing' | 'checkout' | 'success'>('browsing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [customerData, setCustomerData] = useState({ 
    name: '', 
    phone: '', 
    address: '',
    paymentMethod: 'kaspi' as 'kaspi' | 'card' | 'cash',
    fulfillmentMethod: 'pickup' as 'pickup' | 'delivery'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/products')
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.products); })
      .finally(() => setIsLoading(false));
  }, []);

  const normalizeImageUrl = (url?: string) => {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
    if (raw.startsWith('photo-')) return `https://images.unsplash.com/${raw}?auto=format&fit=crop&w=1200&q=80`;
    return raw;
  };

  const getProductImage = (p: Product) =>
    normalizeImageUrl(p.imageUrl) || FALLBACK_IMAGES[p.category] || FALLBACK_IMAGES['default'];

  const categories = ['Все', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Все' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = useCallback((p: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...p, quantity: qty }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderData = {
        name: customerData.name,
        phone: customerData.phone,
        source: 'website',
        status: 'new',
        products: cart.map(p => ({ productId: p.id, name: p.name, price: p.price * p.quantity })),
        productPrice: cartTotal,
        finalPrice: cartTotal,
        paymentMethod: customerData.paymentMethod,
        fulfillmentMethod: customerData.fulfillmentMethod,
        deliveryAddress: customerData.fulfillmentMethod === 'delivery' ? customerData.address : 'ТРЦ Керуен, 2 этаж (Самовывоз)',
        additionalInfo: `Заказ из интернет-магазина: ${cart.map(i => `${i.name} x${i.quantity}`).join(', ')}. Оплата: ${customerData.paymentMethod}`
      };

      // 1. Save to CRM (Automatically syncs to PHP Shop via API)
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) { 
        setOrderStep('success'); 
        setCart([]); 
        setCustomerData({ 
          name: '', 
          phone: '', 
          address: '', 
          paymentMethod: 'kaspi', 
          fulfillmentMethod: 'pickup' 
        });
      }
    } catch {}
  };

  return (
    <div className="shop-page">
      <style>{checkoutStyles}</style>
      {/* Header */}
      <header className="shop-header">
        <a href="/shop" className="shop-logo">TOMIORI<span>High Jewelry · Astana</span></a>
        <div className="search-bar">
          <Search size={16} color="#999" />
          <input placeholder="Поиск украшений..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={() => setIsCartOpen(true)} aria-label="Корзина">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="shop-hero">
        <img src="/hero.png" alt="Tomiori High Jewelry" />
        <div className="hero-overlay" />
        <motion.div className="hero-content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h2>Новая Коллекция</h2>
          <p>Высокое ювелирное искусство</p>
          <a href="#catalog" className="hero-cta">Смотреть каталог</a>
        </motion.div>
      </section>

      {/* FEATURES */}
      <div className="features-strip">
        {[
          { icon: <Truck size={22} />, title: 'Доставка по Астане', desc: 'Бесплатная курьерская доставка' },
          { icon: <Shield size={22} />, title: 'Гарантия качества', desc: 'Сертификат на каждое изделие' },
          { icon: <Gift size={22} />, title: 'Подарочная упаковка', desc: 'Премиальная презентация' },
          { icon: <Clock size={22} />, title: 'Поддержка 24/7', desc: 'Всегда на связи с вами' },
        ].map((f, i) => (
          <div className="feature-item" key={i}>
            <div className="icon">{f.icon}</div>
            <h5>{f.title}</h5>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div className="categories-bar" id="catalog">
        {categories.map(c => (
          <button key={c} className={`cat-btn ${selectedCategory === c ? 'active' : ''}`} onClick={() => setSelectedCategory(c)}>{c}</button>
        ))}
      </div>

      {/* PRODUCTS */}
      <section className="products-section">
        <h3>{selectedCategory === 'Все' ? 'Все украшения' : selectedCategory}</h3>
        <p className="subtitle">{filteredProducts.length} {filteredProducts.length === 1 ? 'изделие' : 'изделий'} в каталоге</p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spin" style={{ display: 'inline-block' }}><Clock size={32} color="#C9A96E" /></div>
            <p style={{ marginTop: '1rem', color: '#999' }}>Загрузка каталога...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Ничего не найдено</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((p, i) => (
              <motion.div key={p.id} className="product-card" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <div className="img-wrap" onClick={() => { setSelectedProduct(p); setModalQty(1); }}>
                  <img src={getProductImage(p)} alt={p.name} />
                  {p.stock > 0 ? (
                    <span className="stock-badge">В наличии</span>
                  ) : (
                    <span className="stock-badge out-of-stock">Под заказ</span>
                  )}
                  <div className="quick-actions">
                    <button className={`quick-action-btn ${wishlist.includes(p.id) ? 'wishlisted' : ''}`} onClick={e => { e.stopPropagation(); toggleWishlist(p.id); }}><Heart size={18} fill={wishlist.includes(p.id) ? '#e74c3c' : 'none'} /></button>
                    <button className="quick-action-btn" onClick={e => { e.stopPropagation(); setSelectedProduct(p); setModalQty(1); }}><Eye size={18} /></button>
                    <button className="quick-action-btn" onClick={e => { e.stopPropagation(); addToCart(p); setIsCartOpen(true); }}><ShoppingBag size={18} /></button>
                  </div>
                </div>
                <div className="product-info">
                  <div className="category-label">{p.category}</div>
                  <h4>{p.name}</h4>
                  <div className="price">{p.price.toLocaleString()} ₸</div>
                  <div className="article">Арт. {p.article}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* PRODUCT MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)}>
            <motion.div className="product-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="modal-image">
                <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} />
                <button className="close-modal" onClick={() => setSelectedProduct(null)}><X size={18} /></button>
              </div>
              <div className="modal-details">
                <span className="cat">{selectedProduct.category}</span>
                <h2>{selectedProduct.name}</h2>
                <div className="modal-price">{selectedProduct.price.toLocaleString()} ₸</div>
                <p className="desc">
                  Изысканное украшение из коллекции Tomiori. Создано вручную нашими мастерами с использованием драгоценных камней высочайшего качества. Каждое изделие сопровождается сертификатом подлинности.
                </p>
                <div className="art-info">
                  <div>Артикул: {selectedProduct.article}</div>
                  <div style={{ marginTop: 4 }}>{selectedProduct.stock > 0 ? `✓ В наличии (${selectedProduct.stock} шт.)` : '⟳ Доступно под заказ'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <span style={{ fontSize: '0.8rem', color: '#757575' }}>Количество:</span>
                  <div className="qty-selector">
                    <button className="qty-btn" onClick={() => setModalQty(Math.max(1, modalQty - 1))}><Minus size={16} /></button>
                    <span className="qty-val">{modalQty}</span>
                    <button className="qty-btn" onClick={() => setModalQty(modalQty + 1)}><Plus size={16} /></button>
                  </div>
                </div>
                <button className="add-to-cart-btn" onClick={() => { addToCart(selectedProduct, modalQty); setSelectedProduct(null); setIsCartOpen(true); }}>
                  Добавить в корзину — {(selectedProduct.price * modalQty).toLocaleString()} ₸
                </button>
                <button className="add-to-cart-btn" style={{ background: 'transparent', color: '#1A1A1A', border: '1px solid #E8E8E8', marginTop: '-0.5rem' }} onClick={() => toggleWishlist(selectedProduct.id)}>
                  <Heart size={16} fill={wishlist.includes(selectedProduct.id) ? '#e74c3c' : 'none'} color={wishlist.includes(selectedProduct.id) ? '#e74c3c' : '#1A1A1A'} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  {wishlist.includes(selectedProduct.id) ? 'В избранном' : 'В избранное'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} />
            <motion.div className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.35 }}>
              <div className="cart-header">
                <h2>Корзина {cartCount > 0 && `(${cartCount})`}</h2>
                <button className="header-btn" onClick={() => setIsCartOpen(false)}><X size={22} /></button>
              </div>

              {orderStep === 'browsing' && (
                <>
                  <div className="cart-items">
                    {cart.length === 0 ? (
                      <div className="empty-cart">
                        <ShoppingBag size={48} color="#E8E8E8" />
                        <p>Ваша корзина пуста</p>
                      </div>
                    ) : cart.map(item => (
                      <div className="cart-item" key={item.id}>
                        <div className="cart-item-img"><img src={getProductImage(item)} alt={item.name} /></div>
                        <div className="cart-item-info">
                          <span className="name">{item.name}</span>
                          <span className="cat">{item.category}</span>
                          <span className="item-price">{(item.price * item.quantity).toLocaleString()} ₸</span>
                          <div className="cart-item-qty">
                            <button onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQty(item.id, -1)}><Minus size={14} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                          </div>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="cart-footer">
                      <div className="cart-total"><span>Итого:</span><span>{cartTotal.toLocaleString()} ₸</span></div>
                      <button className="checkout-btn" onClick={() => setOrderStep('checkout')}>Оформить заказ <ChevronRight size={16} style={{ verticalAlign: 'middle' }} /></button>
                    </div>
                  )}
                </>
              )}

              {orderStep === 'checkout' && (
                <div className="cart-items">
                  <form className="checkout-form" onSubmit={submitOrder}>
                    <h3>Оформление заказа</h3>
                    <div style={{ background: '#FAFAFA', padding: '1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                      {cart.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>{i.name} ×{i.quantity}</span><span style={{ fontWeight: 600 }}>{(i.price * i.quantity).toLocaleString()} ₸</span></div>)}
                      <div style={{ borderTop: '1px solid #E8E8E8', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Итого:</span><span>{cartTotal.toLocaleString()} ₸</span></div>
                    </div>
                    <div className="form-field"><label>Ваше имя</label><input required value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} placeholder="Введите ваше имя" /></div>
                    <div className="form-field"><label>Телефон</label><input required value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} placeholder="+7 (7__) ___-__-__" /></div>
                    
                    <div className="form-field">
                      <label>Способ оплаты</label>
                      <select 
                        value={customerData.paymentMethod} 
                        onChange={e => setCustomerData({ ...customerData, paymentMethod: e.target.value as any })}
                        className="luxury-select"
                        style={{ appearance: 'auto', background: '#F9FAFB' }}
                      >
                        <option value="kaspi">Kaspi (QR / Перевод)</option>
                        <option value="card">Карта (Visa / Mastercard)</option>
                        <option value="cash">Наличные</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Получение</label>
                      <select 
                        value={customerData.fulfillmentMethod} 
                        onChange={e => setCustomerData({ ...customerData, fulfillmentMethod: e.target.value as any })}
                        className="luxury-select"
                        style={{ appearance: 'auto', background: '#F9FAFB' }}
                      >
                        <option value="pickup">Самовывоз (ТРЦ Керуен, 2 этаж)</option>
                        <option value="delivery">Доставка курьером</option>
                      </select>
                    </div>

                    {customerData.fulfillmentMethod === 'delivery' && (
                      <div className="form-field">
                        <label>Адрес доставки</label>
                        <textarea 
                          required 
                          value={customerData.address} 
                          onChange={e => setCustomerData({ ...customerData, address: e.target.value })} 
                          placeholder="Город, улица, дом, квартира" 
                        />
                      </div>
                    )}

                    <button type="submit" className="submit-order-btn">Подтвердить заказ</button>
                    <button type="button" className="back-btn" onClick={() => setOrderStep('browsing')}>← Вернуться к корзине</button>
                  </form>
                </div>
              )}

              {orderStep === 'success' && (
                <div className="cart-items">
                  <div className="success-view">
                    <CheckCircle size={60} color="#10B981" />
                    <h2>Заказ принят!</h2>
                    <p>Спасибо за выбор Tomiori. Наш менеджер свяжется с вами в ближайшее время для подтверждения деталей.</p>
                    <button className="continue-btn" onClick={() => { setIsCartOpen(false); setOrderStep('browsing'); setCustomerData({ name: '', phone: '', address: '', paymentMethod: 'kaspi', fulfillmentMethod: 'pickup' }); }}>Продолжить покупки</button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="shop-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>TOMIORI</h4>
            <p>Бренд высокого ювелирного искусства из Астаны. Каждое украшение — результат кропотливой работы наших мастеров и отражение вашей индивидуальности.</p>
          </div>
          <div className="footer-col">
            <h4>Каталог</h4>
            {categories.filter(c => c !== 'Все').map(c => <a key={c} href="#catalog" onClick={() => setSelectedCategory(c)}>{c}</a>)}
          </div>
          <div className="footer-col">
            <h4>Информация</h4>
            <a href="#">Доставка и оплата</a>
            <a href="#">Гарантия</a>
            <a href="#">Уход за украшениями</a>
            <a href="#">О бренде</a>
          </div>
          <div className="footer-col">
            <h4>Контакты</h4>
            <p><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Астана, Keruen City Mall</p>
            <p><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />+7 (707) 123-45-67</p>
            <p><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Пн–Вс: 10:00 — 22:00</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 TOMIORI HIGH JEWELRY. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
          <div className="footer-socials">
            <a href="#"><InstagramIcon size={18} /></a>
            <a href="#"><Send size={18} /></a>
            <a href="#"><Phone size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
