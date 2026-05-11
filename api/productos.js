// ═══════════════════════════════════════════════════════
//  DARIMAS — /api/productos
//  Proxy serverless: fetcha el Sheet server-side (sin CORS)
//  y devuelve JSON limpio con caché en Vercel Edge.
// ═══════════════════════════════════════════════════════

const https = require('https');

const SHEET_ID = '1ej89gQ-r0WfrsrJtjUJI8SyA02tfms5mZcpp1O5m4bY';

// ── GET con seguimiento de redirecciones ──
function httpGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Darimas/1.0)',
        'Accept': 'text/html,application/json,*/*',
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects === 0) return reject(new Error('Too many redirects'));
        return httpGet(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} en ${url}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// ── Parsea la respuesta gviz de Google Sheets ──
function parseGviz(text) {
  // Google devuelve: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Respuesta gviz inválida');

  const json = JSON.parse(text.slice(start, end + 1));
  const rows = json.table?.rows;
  if (!rows || rows.length === 0) return [];

  return rows.map(row => ({
    marca:      row.c[0]?.v  || '',
    nombre:     row.c[1]?.v  || '',
    categorias: [
      row.c[2]?.v, row.c[3]?.v, row.c[4]?.v,
      row.c[5]?.v, row.c[6]?.v, row.c[7]?.v,
    ].filter(Boolean),
    retail:     Number(row.c[8]?.v)  || 0,
    alquiler:   Number(row.c[9]?.v)  || 0,
    badge:      row.c[10]?.v || 'Nuevo',
    imagen:     row.c[11]?.v || '',
  })).filter(p => p.marca && p.nombre);
}

module.exports = async function handler(req, res) {
  try {
    // El endpoint gviz funciona con sheets compartidos como "Cualquier persona con el enlace"
    const url      = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const text     = await httpGet(url);
    const products = parseGviz(text);

    if (products.length === 0) throw new Error('El Sheet está vacío o no es accesible');

    // Caché Vercel Edge: 2 min fresh, sirve stale hasta 10 min mientras revalida
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
