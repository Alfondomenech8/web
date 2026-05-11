// ═══════════════════════════════════════════════════════
//  DARIMAS — catalogo.js
//  Carga todas las prendas y filtra por categoría
// ═══════════════════════════════════════════════════════

const PH_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1">
  <rect x="3" y="3" width="18" height="18" rx="1"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <path d="M21 15l-5-5L5 21"/>
</svg>`;

let allProducts  = [];
let activeFilter = 'todas';

// ── Construye una card ──
function buildCard(p, index) {
  const isTall    = index % 5 === 1 || index % 5 === 4;
  const badgeClass = (p.badge || '').toLowerCase() === 'nuevo'
    ? 'product-badge--new'
    : 'product-badge--preloved';

  const imgHtml = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="ph ph--light">${PH_SVG}<span>${p.nombre}</span></div>`;

  const cats = (p.categorias || []).join(',');

  return `
    <a href="producto.html?id=${index}"
       class="product-card ${isTall ? 'product-card--tall' : ''}"
       data-cats="${cats}">
      <div class="product-card__img">
        ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ''}
        ${imgHtml}
        <div class="product-card__overlay">
          <p class="overlay__retail">Retail <s>€${Number(p.retail).toLocaleString('es-ES')}</s></p>
          <p class="overlay__rent">Alquiler desde <strong>€${Number(p.alquiler).toLocaleString('es-ES')}</strong></p>
          <p class="overlay__cta">Ver pieza →</p>
        </div>
      </div>
      <div class="product-card__info">
        <p class="product-brand">${p.marca}</p>
        <p class="product-name">${p.nombre}</p>
        <div class="product-price-row">
          <span class="price-retail">Retail <s>€${Number(p.retail).toLocaleString('es-ES')}</s></span>
          <span class="price-rent">Alquiler <strong>€${Number(p.alquiler).toLocaleString('es-ES')}</strong></span>
        </div>
      </div>
    </a>`;
}

// ── Genera los botones de filtro desde las categorías del Sheet ──
function buildFilters(products) {
  const cats = new Set();
  products.forEach(p => (p.categorias || []).forEach(c => { if (c) cats.add(c); }));

  const filtersEl = document.querySelector('.cat-filters__scroll');
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className    = 'cat-filter';
    btn.dataset.filter = cat;
    btn.textContent  = cat;
    filtersEl.appendChild(btn);
    btn.addEventListener('click', () => applyFilter(cat));
  });
}

// ── Aplica el filtro activo ──
function applyFilter(filter) {
  activeFilter = filter;

  // Actualiza botones
  document.querySelectorAll('.cat-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  // Filtra cards
  const cards   = document.querySelectorAll('#cat-grid .product-card');
  let visible   = 0;

  cards.forEach(card => {
    const cats    = card.dataset.cats.split(',').map(c => c.trim().toLowerCase());
    const matches = filter === 'todas' || cats.includes(filter.toLowerCase());
    card.style.display = matches ? '' : 'none';
    if (matches) visible++;
  });

  // Actualiza contador
  document.getElementById('cat-count').textContent =
    `${visible} ${visible === 1 ? 'pieza' : 'piezas'}${filter !== 'todas' ? ` en "${filter}"` : ''}`;

  // Empty state
  document.getElementById('cat-empty').style.display = visible === 0 ? 'block' : 'none';
}

// ── Carga productos desde Google Sheet ──
async function loadCatalog() {
  const grid = document.getElementById('cat-grid');

  // Si no hay Sheet configurado, usa demo
  if (typeof SHEET_ID === 'undefined' || SHEET_ID === 'TU_SHEET_ID_AQUI') {
    allProducts = DEMO_PRODUCTS;
    renderAll();
    return;
  }

  try {
    const url  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    if (!rows || rows.length === 0) {
      grid.innerHTML = '';
      document.getElementById('cat-count').textContent = '0 piezas';
      document.getElementById('cat-empty').style.display = 'block';
      return;
    }

    allProducts = rows.map(row => ({
      marca:      row.c[0]?.v ?? '',
      nombre:     row.c[1]?.v ?? '',
      categorias: [
        row.c[2]?.v, row.c[3]?.v, row.c[4]?.v,
        row.c[5]?.v, row.c[6]?.v, row.c[7]?.v,
      ].filter(Boolean),
      retail:     row.c[8]?.v ?? 0,
      alquiler:   row.c[9]?.v ?? 0,
      badge:      row.c[10]?.v ?? 'Nuevo',
      imagen:     row.c[11]?.v ?? '',
    })).filter(p => p.marca && p.nombre);

    renderAll();

  } catch (err) {
    console.error('Error cargando catálogo:', err);
    allProducts = DEMO_PRODUCTS;
    renderAll();
  }
}

function renderAll() {
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = allProducts.map(buildCard).join('');

  buildFilters(allProducts);
  applyFilter('todas');

  // Activa botón "Todas"
  document.querySelector('[data-filter="todas"]').addEventListener('click', () => applyFilter('todas'));
}

// ── Demo products ──
const DEMO_PRODUCTS = [
  { marca:'Jacquemus',    nombre:'Le Robe Tropea',      retail:1800, alquiler:120, badge:'Nuevo', categorias:['Vestido','Midi','Verano'],   imagen:'' },
  { marca:'Magda Butrym', nombre:'Vestido floral seda', retail:2200, alquiler:150, badge:'Nuevo', categorias:['Vestido','Seda','Boda'],     imagen:'' },
  { marca:'Self-Portrait',nombre:'Mini vestido encaje', retail:950,  alquiler:85,  badge:'Nuevo', categorias:['Vestido','Mini','Fiesta'],   imagen:'' },
  { marca:'Nanushka',     nombre:'Vestido midi satén',  retail:1400, alquiler:110, badge:'Nuevo', categorias:['Vestido','Midi','Casual'],   imagen:'' },
  { marca:'The Attico',   nombre:'Vestido lentejuelas', retail:3100, alquiler:220, badge:'Nuevo', categorias:['Vestido','Noche','Gala'],    imagen:'' },
  { marca:'Rotate',       nombre:'Blazer oversize',     retail:760,  alquiler:70,  badge:'Nuevo', categorias:['Blazer','Casual'],           imagen:'' },
  { marca:'Cult Gaia',    nombre:'Vestido cut-out',     retail:1200, alquiler:95,  badge:'Nuevo', categorias:['Vestido','Verano','Fiesta'], imagen:'' },
  { marca:'Staud',        nombre:'Mini vestido fruncido',retail:890, alquiler:80,  badge:'Nuevo', categorias:['Vestido','Mini','Casual'],   imagen:'' },
];

// ── Init ──
loadCatalog();
