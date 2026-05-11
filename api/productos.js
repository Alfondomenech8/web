// ═══════════════════════════════════════════════════════
//  DARIMAS — /api/productos
//  Proxy serverless: fetcha el Sheet en el servidor,
//  cachea en Vercel Edge y devuelve JSON limpio.
// ═══════════════════════════════════════════════════════

const SHEET_ID = '1ej89gQ-r0WfrsrJtjUJI8SyA02tfms5mZcpp1O5m4bY';

// ── Parser CSV robusto (maneja campos con comas entre comillas) ──
function parseCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  // Primera fila = cabeceras, las saltamos
  return lines.slice(1).map(line => {
    const c = parseCSVLine(line);
    return {
      marca:      c[0]  || '',
      nombre:     c[1]  || '',
      categorias: [c[2], c[3], c[4], c[5], c[6], c[7]].filter(Boolean),
      retail:     parseFloat(c[8])  || 0,
      alquiler:   parseFloat(c[9])  || 0,
      badge:      c[10] || 'Nuevo',
      imagen:     c[11] || '',
    };
  }).filter(p => p.marca && p.nombre);
}

module.exports = async function handler(req, res) {
  try {
    // URL CSV pública (requiere "Publicar en la web → CSV" en el Sheet)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sheet HTTP ${response.status}`);

    const csv      = await response.text();
    const products = parseCSV(csv);

    // Caché Vercel Edge: 2 min fresh, sirve stale hasta 10 min mientras revalida
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ ok: true, products });

  } catch (err) {
    console.error('productos API error:', err.message);
    res.status(500).json({ ok: false, error: err.message, products: [] });
  }
};
