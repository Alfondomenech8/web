// ═══════════════════════════════════════════════════════
//  DARIMAS — /api/productos
//  Proxy serverless: fetcha el Sheet en el servidor,
//  cachea en Vercel Edge y devuelve JSON limpio.
// ═══════════════════════════════════════════════════════

const https = require('https');

const SHEET_ID = '1ej89gQ-r0WfrsrJtjUJI8SyA02tfms5mZcpp1O5m4bY';

// ── GET con https nativo (sin dependencias externas) ──
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      // Sigue redirecciones (Google Sheets redirige)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

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
    const url      = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv`;
    const csv      = await httpGet(url);
    const products = parseCSV(csv);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, products }));

  } catch (err) {
    console.error('productos API error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message, products: [] }));
  }
};
