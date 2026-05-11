// ═══════════════════════════════════════════════════════
//  DARIMAS — main.js
// ═══════════════════════════════════════════════════════

// ── 🔗 CONFIGURA AQUÍ tu Google Sheet ──────────────────
// 1. Abre tu Google Sheet
// 2. Archivo → Compartir → Publicar en la web → CSV → Publicar
// 3. Copia el ID del Sheet de la URL (la parte larga entre /d/ y /edit)
// 4. Pégalo aquí:
const SHEET_ID = '1ej89gQ-r0WfrsrJtjUJI8SyA02tfms5mZcpp1O5m4bY';
// ────────────────────────────────────────────────────────

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// ── Icono placeholder SVG ──
const PH_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1">
  <rect x="3" y="3" width="18" height="18" rx="1"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <path d="M21 15l-5-5L5 21"/>
</svg>`;

// ── Construye una card de producto ──
function buildCard(p, index) {
  const delays    = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];
  const delay     = delays[index % 4];
  const isTall    = index % 5 === 1 || index % 5 === 4; // cada 2.º y 5.º más alto
  const badgeClass = p.badge === 'Nuevo' ? 'product-badge--new' : 'product-badge--preloved';

  const imgHtml = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="ph ph--light">${PH_SVG}<span>${p.nombre}</span></div>`;

  const cats = (p.categorias || []).join(',');

  return `
    <a href="producto.html?id=${index}" class="product-card ${isTall ? 'product-card--tall' : ''} reveal ${delay}" data-categorias="${cats}">
      <div class="product-card__img">
        ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ''}
        ${imgHtml}
        <div class="product-card__overlay">
          <p class="overlay__retail">Retail <s>€${p.retail}</s></p>
          <p class="overlay__rent">Alquiler desde <strong>€${p.alquiler}</strong></p>
          <p class="overlay__cta">Ver pieza →</p>
        </div>
      </div>
      <div class="product-card__info">
        <p class="product-brand">${p.marca}</p>
        <p class="product-name">${p.nombre}</p>
        <div class="product-price-row">
          <span class="price-retail">Retail <s>€${p.retail}</s></span>
          <span class="price-rent">Alquiler <strong>€${p.alquiler}</strong></span>
        </div>
      </div>
    </a>`;
}

// ── Carga productos desde la API serverless (rápida, sin CORS) ──
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Intenta caché localStorage primero
  try {
    const raw = localStorage.getItem('darimas_products_v2');
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < 5 * 60 * 1000 && data.length > 0) {
        grid.innerHTML = data.map(buildCard).join('');
        grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
        // Refresca en background
        fetch('/api/productos').then(r => r.json()).then(({ products }) => {
          if (products?.length) localStorage.setItem('darimas_products_v2', JSON.stringify({ ts: Date.now(), data: products }));
        }).catch(() => {});
        return;
      }
    }
  } catch (_) {}

  // Sin caché: muestra demos mientras carga
  renderDemoProducts(grid);

  try {
    const res = await fetch('/api/productos');
    const { ok, products } = await res.json();
    if (!ok || !products || products.length === 0) return;

    try { localStorage.setItem('darimas_products_v2', JSON.stringify({ ts: Date.now(), data: products })); } catch (_) {}

    grid.innerHTML = products.map(buildCard).join('');
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  } catch (err) {
    console.error('Error cargando productos:', err);
    // Se queda con los demos
  }
}

// ── Demo cards mientras no hay Sheet configurado ──
function renderDemoProducts(grid) {
  const demos = [
    { marca: 'Jacquemus',   nombre: 'Le Robe Tropea',      retail: '1.800', alquiler: '120', badge: 'Nuevo',  imagen: '' },
    { marca: 'Magda Butrym',nombre: 'Vestido floral seda', retail: '2.200', alquiler: '150', badge: 'Nuevo',  imagen: '' },
    { marca: 'Self-Portrait',nombre: 'Mini vestido encaje', retail: '950',   alquiler: '85',  badge: 'Nuevo',  imagen: '' },
    { marca: 'Nanushka',    nombre: 'Vestido midi satén',  retail: '1.400', alquiler: '110', badge: 'Nuevo',  imagen: '' },
    { marca: 'The Attico',  nombre: 'Vestido lentejuelas', retail: '3.100', alquiler: '220', badge: 'Nuevo',  imagen: '' },
    { marca: 'Rotate',      nombre: 'Blazer oversize',     retail: '760',   alquiler: '70',  badge: 'Nuevo',  imagen: '' },
    { marca: 'Cult Gaia',   nombre: 'Vestido cut-out',     retail: '1.200', alquiler: '95',  badge: 'Nuevo',  imagen: '' },
    { marca: 'Staud',       nombre: 'Mini vestido fruncido',retail: '890',  alquiler: '80',  badge: 'Nuevo',  imagen: '' },
  ];
  grid.innerHTML = demos.map(buildCard).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ═══════════════════════════════════════════════════════
//  HEADER: light sobre hero → dark al salir
// ═══════════════════════════════════════════════════════
const header = document.getElementById('header');
const heroEl = document.getElementById('hero');

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    header.classList.toggle('header--light', entry.isIntersecting);
    header.classList.toggle('header--dark',  !entry.isIntersecting);
  },
  { threshold: 0.1 }
);
if (heroEl) headerObserver.observe(heroEl);

// ── Parallax hero background ──
const heroBg = document.getElementById('hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      heroBg.style.transform = `translateY(${y * 0.28}px)`;
    }
  }, { passive: true });
}

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Menú móvil ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
window.closeMobileMenu = closeMobileMenu;

// ── Búsqueda overlay ──
const searchOverlay = document.getElementById('search-overlay');
const searchInput   = document.getElementById('search-input');

document.getElementById('search-open').addEventListener('click', openSearch);
document.getElementById('search-close').addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

function openSearch() {
  searchOverlay.classList.add('open');
  setTimeout(() => searchInput.focus(), 80);
  document.body.style.overflow = 'hidden';
}
function closeSearch() {
  searchOverlay.classList.remove('open');
  searchInput.value = '';
  document.body.style.overflow = '';
}

// ── Carrito drawer ──
const cartDrawer  = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');

document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function openCart()  { cartDrawer.classList.add('open');  cartOverlay.classList.add('open');  document.body.style.overflow = 'hidden'; }
function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }

// ── Escape cierra todo ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeSearch(); closeCart(); closeMobileMenu();
});

// ── Newsletter ──
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn  = document.getElementById('subscribe-btn');
    const orig = btn.textContent;
    btn.textContent = '¡Bienvenida al Select! ✓';
    btn.style.background = 'var(--ink)';
    newsletterForm.querySelector('input').value = '';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 4000);
  });
}

// ── Ticker pausa en móvil ──
const tickerTrack = document.querySelector('.ticker__track');
if (tickerTrack) {
  tickerTrack.addEventListener('touchstart', () => tickerTrack.style.animationPlayState = 'paused', { passive: true });
  tickerTrack.addEventListener('touchend',   () => tickerTrack.style.animationPlayState = 'running', { passive: true });
}

// ── Init ──
loadProducts();
