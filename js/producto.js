// ═══════════════════════════════════════════════════════
//  DARIMAS — producto.js
//  Carga y muestra el detalle de una pieza desde el Sheet
// ═══════════════════════════════════════════════════════

const WHATSAPP_NUMBER = '34600000000'; // ← cambia por tu número real

// ── Lee el parámetro ?id= de la URL ──
const params     = new URLSearchParams(window.location.search);
const productId  = parseInt(params.get('id') ?? '0', 10);

// ── Icono placeholder ──
const PH_SVG_LARGE = `
  <div class="ph" style="height:100%">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="0.8">
      <rect x="3" y="3" width="18" height="18" rx="1"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <span>Foto de la pieza</span>
  </div>`;

// ── Rellena la página con los datos del producto ──
function renderProduct(p) {
  // Título pestaña
  document.title = `${p.nombre} — ${p.marca} | DARIMAS`;

  // Breadcrumb
  document.getElementById('pd-breadcrumb-name').textContent = p.nombre;

  // Imagen
  const imgEl = document.getElementById('pd-img-main');
  if (p.imagen) {
    imgEl.innerHTML = `<img src="${p.imagen}" alt="${p.nombre}">`;
  } else {
    imgEl.innerHTML = PH_SVG_LARGE;
  }

  // Info básica
  document.getElementById('pd-brand').textContent  = p.marca;
  document.getElementById('pd-name').textContent   = p.nombre;
  document.getElementById('pd-retail').textContent = `€${Number(p.retail).toLocaleString('es-ES')}`;
  document.getElementById('pd-alquiler').textContent = `€${Number(p.alquiler).toLocaleString('es-ES')}`;

  // Ahorro
  if (p.retail && p.alquiler) {
    const ahorro = Math.round((1 - p.alquiler / p.retail) * 100);
    document.getElementById('pd-saving').textContent = `Ahorras un ${ahorro}% vs precio retail`;
  }

  // Categorías
  const catsEl = document.getElementById('pd-cats');
  if (p.categorias && p.categorias.length) {
    catsEl.innerHTML = p.categorias
      .map(c => `<span class="pd__cat-tag">${c}</span>`)
      .join('');
  }

  // WhatsApp CTA (se actualiza con las fechas seleccionadas)
  updateWhatsApp(p);
}

// ── Construye el mensaje de WhatsApp ──
function updateWhatsApp(p) {
  const start = document.getElementById('pd-date-start').value;
  const end   = document.getElementById('pd-date-end').value;
  const note  = document.getElementById('pd-dates-note');

  let msg = `Hola, me interesa alquilar: *${p.marca} — ${p.nombre}* (Alquiler €${p.alquiler})`;

  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    const dias = Math.round((e - s) / 86400000);
    if (dias >= 4) {
      msg += `\nFechas: del ${s.toLocaleDateString('es-ES')} al ${e.toLocaleDateString('es-ES')} (${dias} días)`;
      note.textContent = `${dias} días seleccionados ✓`;
      note.classList.add('ok');
    } else {
      note.textContent = 'El mínimo de alquiler es 4 días';
      note.classList.remove('ok');
    }
  } else {
    note.textContent = 'Selecciona las fechas para ver disponibilidad';
    note.classList.remove('ok');
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  document.getElementById('pd-btn-whatsapp').href = url;
}

// ── Carga el producto desde el Sheet ──
async function loadProduct() {
  // Reutiliza SHEET_ID definido en main.js
  if (typeof SHEET_ID === 'undefined' || SHEET_ID === 'TU_SHEET_ID_AQUI') {
    renderProduct(DEMO_PRODUCTS[productId % DEMO_PRODUCTS.length]);
    return;
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

  try {
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const row  = json.table.rows[productId];

    if (!row) { window.location.href = '/'; return; }

    const p = {
      marca:      row.c[0]?.v ?? '',
      nombre:     row.c[1]?.v ?? '',
      categorias: [row.c[2]?.v, row.c[3]?.v, row.c[4]?.v, row.c[5]?.v, row.c[6]?.v, row.c[7]?.v].filter(Boolean),
      retail:     row.c[8]?.v ?? 0,
      alquiler:   row.c[9]?.v ?? 0,
      badge:      row.c[10]?.v ?? '',
      imagen:     row.c[11]?.v ?? '',
    };

    renderProduct(p);

    // Actualizar WhatsApp al cambiar fechas
    document.getElementById('pd-date-start').addEventListener('change', () => updateWhatsApp(p));
    document.getElementById('pd-date-end').addEventListener('change',   () => updateWhatsApp(p));

  } catch (err) {
    console.error('Error cargando producto:', err);
    window.location.href = '/';
  }
}

// ── Productos demo (cuando no hay Sheet) ──
const DEMO_PRODUCTS = [
  { marca:'Jacquemus',    nombre:'Le Robe Tropea',      retail:1800, alquiler:120, categorias:['Vestido','Midi'],    imagen:'' },
  { marca:'Magda Butrym', nombre:'Vestido floral seda', retail:2200, alquiler:150, categorias:['Vestido','Seda'],    imagen:'' },
  { marca:'Self-Portrait',nombre:'Mini vestido encaje', retail:950,  alquiler:85,  categorias:['Vestido','Mini'],    imagen:'' },
  { marca:'Nanushka',     nombre:'Vestido midi satén',  retail:1400, alquiler:110, categorias:['Vestido','Satén'],   imagen:'' },
  { marca:'The Attico',   nombre:'Vestido lentejuelas', retail:3100, alquiler:220, categorias:['Vestido','Noche'],   imagen:'' },
  { marca:'Rotate',       nombre:'Blazer oversize',     retail:760,  alquiler:70,  categorias:['Blazer','Casual'],   imagen:'' },
  { marca:'Cult Gaia',    nombre:'Vestido cut-out',     retail:1200, alquiler:95,  categorias:['Vestido','Verano'],  imagen:'' },
  { marca:'Staud',        nombre:'Mini vestido fruncido',retail:890, alquiler:80,  categorias:['Vestido','Mini'],    imagen:'' },
];

// ── Init ──
loadProduct();
