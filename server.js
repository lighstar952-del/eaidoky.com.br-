// Servidor sem dependências (Node 18+). Serve /public e expõe /api/feed e /api/links.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const HANDLE = process.env.YT_HANDLE || 'eaidoky';
let CHANNEL_ID = process.env.YT_CHANNEL_ID || '';
async function resolveChannel() {
  if (CHANNEL_ID) return CHANNEL_ID;
  const r = await fetch(`https://www.youtube.com/@${HANDLE}`, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-BR' } });
  const html = await r.text();
  const m = html.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/) || html.match(/channel_id=(UC[\w-]{22})/);
  if (!m) throw new Error('Canal não encontrado; defina YT_CHANNEL_ID');
  return (CHANNEL_ID = m[1]);
}
// Procura o site em ./public; se a pasta não existir no repositório, usa a raiz.
const ROOT = fs.existsSync(path.join(__dirname, 'public', 'index.html')) ? path.join(__dirname, 'public') : __dirname;
console.log('Servindo arquivos de:', ROOT);
const MIME = {'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.ico':'image/x-icon'};

let cache = { at: 0, data: null };
const pick = (s, re) => (s.match(re) || [])[1] || '';
const decode = s => s.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');

async function getFeed() {
  if (cache.data && Date.now() - cache.at < 60000) return cache.data;
  const id = await resolveChannel();
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  if (!r.ok) throw new Error('YouTube ' + r.status);
  const xml = await r.text();
  const items = xml.split('<entry>').slice(1).map(e => {
    const id = pick(e, /<yt:videoId>(.*?)<\/yt:videoId>/);
    const title = decode(pick(e, /<title>(.*?)<\/title>/));
    const desc = decode(pick(e, /<media:description>([\s\S]*?)<\/media:description>/));
    const isShort = /#shorts/i.test(title + ' ' + desc);
    return { id, title, isShort, published: pick(e, /<published>(.*?)<\/published>/),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}` };
  });
  const data = { live: items.find(i => !i.isShort) || items[0] || null, short: items.find(i => i.isShort) || null };
  cache = { at: Date.now(), data };
  return data;
}

const json = (res, code, obj) => { res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/feed') {
    try { return json(res, 200, await getFeed()); }
    catch (e) { return cache.data ? json(res, 200, cache.data) : json(res, 502, { error: e.message }); }
  }
  let file = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT) || /server\.js$|package\.json$/.test(file)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado: ' + url.pathname + ' (procurei em ' + path.basename(ROOT) + ')'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
    res.end(buf);
  });
}).listen(PORT, () => console.log('Rodando na porta ' + PORT));
