// Card Binder API and page host.
// Fixed routes: /api/status, /api/scan, /api/price. Everything else serves the page.
// Secrets and per-deployment values are Worker settings, never in this file:
//   ANTHROPIC_API_KEY (secret), TEAM_DOMAIN and POLICY_AUD (Cloudflare Access),
//   optional AI (Workers AI binding), USAGE (KV binding), DAILY_LIMIT, SCAN_BACKEND.
import HTML from '../public/index.html';

const json = (o, status = 200) => Response.json(o, { status });
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const dec = b => JSON.parse(new TextDecoder().decode(b64u(b)));
const NL = String.fromCharCode(10);
const str = (v, n = 80) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').trim().slice(0, n);
const one = (v, n) => str(v, n).split(NL).join(' ');

// Static-assets Workers do not receive ctx.access, so verify the JWT ourselves.
async function verifyAccess(request, env) {
  const tok = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!tok || !env.TEAM_DOMAIN || !env.POLICY_AUD) return false;
  try {
    const [h, p, s] = tok.split('.');
    const head = dec(h), body = dec(p);
    if (head.alg !== 'RS256' || body.iss !== env.TEAM_DOMAIN) return false;
    if (!(body.exp * 1000 > Date.now())) return false;
    if (![].concat(body.aud || []).includes(env.POLICY_AUD)) return false;
    const certs = await (await fetch(env.TEAM_DOMAIN + '/cdn-cgi/access/certs', { cf: { cacheTtl: 3600, cacheEverything: true } })).json();
    const jwk = certs.keys.find(k => k.kid === head.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(h + '.' + p));
  } catch { return false; }
}

// Daily cost guard. Counts per route in KV (binding USAGE) when present, else per isolate.
const memUse = {};
async function spend(env, route) {
  const day = new Date().toISOString().slice(0, 10);
  const limit = Number(env.DAILY_LIMIT) || 150;
  let cur = memUse[day] || {};
  if (env.USAGE) { try { cur = JSON.parse((await env.USAGE.get('u:' + day)) || '{}'); } catch { cur = {}; } }
  const used = Object.values(cur).reduce((a, b) => a + b, 0);
  const ok = used < limit;
  if (!route || !ok) return { ok, used, limit };
  cur[route] = (cur[route] || 0) + 1;
  memUse[day] = cur;
  if (env.USAGE) { try { await env.USAGE.put('u:' + day, JSON.stringify(cur), { expirationTtl: 3456000 }); } catch { /* guard only */ } }
  return { ok: true, used: used + 1, limit };
}

const SCAN = 'These are photos or screenshots of ONE sports trading card (front first, then back if two are given). They may show a slab or a listing page. Read what is printed on the card and any visible listing text. Reply with only a JSON object: {"player":"","year":"","set":"brand and set, e.g. Topps Chrome","number":"card number as printed","parallel":"e.g. Green Refractor, or empty for base","serial":"e.g. 087/99, or /99 if only the print run shows","type":"raw or graded","grader":"","grade":"","cert":"","autograph":false,"unsure":["names of fields you are not certain about"],"confidence":"high|medium|low"}. Use an empty string for anything you cannot see. Never guess.';
const priceText = c => 'I am pricing this card: ' + one(c.title, 160) + (one(c.serial, 40) ? ' (serial ' + one(c.serial, 40) + ')' : '') + ', ' + (c.type === 'graded' ? 'graded ' + one(c.grader, 40) + ' ' + one(c.grade, 20) : 'raw (ungraded)') + '. The attached screenshots show marketplace search results. List every listing visible. Reply with only JSON: {"kind":"sold or active or unknown","note":"","listings":[{"title":"","price":0,"same":true,"related":false}]}. price is the item price as a number, without shipping. same is true only if the listing is clearly this exact card: same year, set, player, card number, parallel and print run, and the same grade (or raw). related is true when it is the same player and card number but a different parallel, print run or grade. Lots, reprints, other cards and other players are false for both. kind is sold when the page says Sold or shows sold dates, active when it shows current asking prices. note is one short sentence on why listings were left out or what is missing, such as which version the listings were instead of this one.';

// Anthropic backend (used for /api/price, and for /api/scan when SCAN_BACKEND is "anthropic").
async function ask(env, images, text, deep, max) {
  const content = [];
  for (const u of images) {
    const m = /^data:(image[/](?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(typeof u === 'string' ? u : '');
    if (!m) throw { status: 400, error: 'bad_image' };
    if (m[2].length > 5e6) throw { status: 413, error: 'image_too_large' };
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({ type: 'text', text });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: deep ? (env.MODEL_DEEP || 'claude-sonnet-5-5') : (env.MODEL_QUICK || 'claude-haiku-5-5'),
      max_tokens: max,
      system: 'You read sports trading cards and marketplace screenshots. Reply with a single JSON value only, no markdown fences.',
      messages: [{ role: 'user', content }],
    }),
  });
  if (r.status === 429) throw { status: 429, error: 'busy' };
  if (!r.ok) throw { status: 502, error: 'model_failed' };
  const data = await r.json();
  const t = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  const i = t.search(/[[{]/), k = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  try { return JSON.parse(t.slice(i, k + 1)); } catch { throw { status: 502, error: 'unreadable' }; }
}

// Workers AI backend (no external API key). Change models with AI_MODEL_QUICK / AI_MODEL_DEEP.
const QUICK_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
const DEEP_MODEL = '@cf/mistralai/mistral-small-3.1-24b-instruct';
const CF_SYS = 'You read sports trading cards. Reply with a single JSON value only, no markdown fences.';
const SCAN_SCHEMA = {
  type: 'object',
  properties: {
    player: { type: 'string' }, year: { type: 'string' }, set: { type: 'string' }, number: { type: 'string' },
    parallel: { type: 'string' }, serial: { type: 'string' },
    type: { type: 'string', enum: ['raw', 'graded'] },
    grader: { type: 'string' }, grade: { type: 'string' }, cert: { type: 'string' },
    autograph: { type: 'boolean' },
    unsure: { type: 'array', items: { type: 'string', enum: ['player', 'year', 'set', 'number', 'parallel', 'serial', 'type', 'grader', 'grade', 'cert'] } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['player', 'year', 'set', 'number', 'parallel', 'serial', 'type', 'grader', 'grade', 'cert', 'autograph', 'unsure', 'confidence'],
};
async function askCF(env, images, text, deep) {
  const content = [{ type: 'text', text }];
  for (const u of images) {
    if (typeof u !== 'string' || !/^data:image[/](?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u)) throw { status: 400, error: 'bad_image' };
    if (u.length > 5e6) throw { status: 413, error: 'image_too_large' };
    content.push({ type: 'image_url', image_url: { url: u } });
  }
  const model = deep ? (env.AI_MODEL_DEEP || DEEP_MODEL) : (env.AI_MODEL_QUICK || QUICK_MODEL);
  const body = { messages: [{ role: 'system', content: CF_SYS }, { role: 'user', content }], max_tokens: 600, temperature: 0 };
  const cfErr = e => {
    const m = String((e && e.message) || e);
    return /allocation|neurons|4006/i.test(m) ? { status: 429, error: 'daily_limit' } : /rate limit|too many|429/i.test(m) ? { status: 429, error: 'busy' } : null;
  };
  let out;
  try { out = await env.AI.run(model, deep ? body : { ...body, guided_json: SCAN_SCHEMA }); }
  catch (e) {
    const known = cfErr(e);
    if (known) throw known;
    try { out = await env.AI.run(model, body); }
    catch (e2) { throw cfErr(e2) || { status: 502, error: 'model_failed' }; }
  }
  const r = out && out.response;
  if (r && typeof r === 'object') return r;
  const t = String(r || '');
  const i = t.search(/[[{]/), k = t.lastIndexOf('}');
  try { return JSON.parse(t.slice(i, k + 1)); } catch { throw { status: 502, error: 'unreadable' }; }
}

const FIELDS = ['player', 'year', 'set', 'number', 'parallel', 'serial', 'type', 'grader', 'grade'];
function cleanScan(r) {
  r = r && typeof r === 'object' ? r : {};
  const o = {};
  for (const f of FIELDS) o[f] = str(r[f]);
  o.type = /grad/i.test(o.type) ? 'graded' : o.type ? 'raw' : '';
  o.cert = str(r.cert, 40);
  o.autograph = r.autograph === true;
  o.unsure = (Array.isArray(r.unsure) ? r.unsure : []).map(x => str(x, 20)).filter(x => FIELDS.includes(x) || x === 'cert').slice(0, 12);
  o.confidence = ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'low';
  return o;
}
function cleanPrice(r) {
  r = r && typeof r === 'object' ? r : {};
  const L = (Array.isArray(r.listings) ? r.listings : []).slice(0, 80).map(x => {
    x = x && typeof x === 'object' ? x : {};
    return { title: str(x.title, 160), price: parseFloat(String(x.price == null ? '' : x.price).replace(/[^0-9.]/g, '')), same: x.same === true, related: x.related === true };
  }).filter(x => x.price > 0);
  return { kind: ['sold', 'active', 'unknown'].includes(r.kind) ? r.kind : 'unknown', note: str(r.note, 300), listings: L };
}

async function run(env, route, fn) {
  const s = await spend(env, route);
  if (!s.ok) return json({ error: 'daily_limit', used: s.used, limit: s.limit }, 429);
  try { return json(await fn()); } catch (e) { return json({ error: (e && e.error) || 'failed' }, (e && e.status) || 502); }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith('/api/')) return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
    const authed = await verifyAccess(request, env);
    if (path === '/api/status') {
      if (!authed) return json({ ready: false, reason: env.TEAM_DOMAIN && env.POLICY_AUD ? 'signin' : 'access_not_set' });
      if (!env.ANTHROPIC_API_KEY && !env.AI) return json({ ready: false, reason: 'no_key' });
      const u = await spend(env, null);
      return json({ ready: u.ok, reason: u.ok ? 'ready' : 'limit', used: u.used, limit: u.limit, price: u.ok && !!env.ANTHROPIC_API_KEY });
    }
    if (!authed) return json({ error: 'signin' }, 401);
    if (!env.ANTHROPIC_API_KEY && !env.AI) return json({ error: 'no_key' }, 503);
    if (request.method !== 'POST') return json({ error: 'not_found' }, 404);
    const b = await request.json().catch(() => null);
    const imgs = b && Array.isArray(b.images) ? b.images : [];
    const known = path === '/api/scan' || path === '/api/price';
    if (path === '/api/scan' && imgs.length >= 1 && imgs.length <= 2) {
      return run(env, 'scan', async () => cleanScan(env.AI && env.SCAN_BACKEND !== 'anthropic' ? await askCF(env, imgs, SCAN, b.deep === true) : await ask(env, imgs, SCAN, b.deep === true, 700)));
    }
    if (path === '/api/price' && imgs.length >= 1 && imgs.length <= 4 && b.card && typeof b.card === 'object') {
      if (!env.ANTHROPIC_API_KEY) return json({ error: 'price_needs_anthropic' }, 503);
      return run(env, 'price', async () => cleanPrice(await ask(env, imgs, priceText(b.card), false, 2000)));
    }
    return json({ error: known ? 'bad_request' : 'not_found' }, known ? 400 : 404);
  },
};
