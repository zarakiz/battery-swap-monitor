/**
 * 換電觀測站 — 訪客計數器 (Cloudflare Worker)
 *
 * 部署方式 (Cloudflare Dashboard):
 *  1. Workers & Pages → Create → Create Worker,取名如 swap-counter
 *  2. 把這整份程式碼貼進編輯器 → Deploy
 *  3. 左側選單 Workers & Pages → KV → 建立 namespace (如 swap-counter-kv)
 *  4. 回到這個 Worker → Settings → Bindings → Add binding → KV namespace,
 *     Variable name 填 COUNTER_KV,選剛建的 namespace → 儲存(會自動重部署)
 *  5. 把 Worker 網址 (https://swap-counter.<帳號>.workers.dev) 貼給 Muse 接前端
 *
 * 隱私:只存 IP 的 SHA-256 雜湊 (加每日鹽),不存原始 IP;每日 key 設 90 天自動過期。
 * 語意:同 IP 一天只算一次 (以台灣時區的日為界)。
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== '/hit' && url.pathname !== '/') {
      return new Response('not found', { status: 404, headers: cors });
    }
    if (!env.COUNTER_KV) {
      return new Response('KV binding COUNTER_KV not configured', { status: 500, headers: cors });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }); // YYYY-MM-DD
    const salt = 'swap-monitor-v1';
    const hashBuf = await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(`${salt}|${day}|${ip}`));
    const hash = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

    const key = `d:${day}`;
    let rec = {};
    try { rec = JSON.parse((await env.COUNTER_KV.get(key)) || '{}'); } catch (e) { rec = {}; }
    rec[hash] = 1;
    await env.COUNTER_KV.put(key, JSON.stringify(rec), { expirationTtl: 90 * 86400 });

    const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
    let yrec = {};
    try { yrec = JSON.parse((await env.COUNTER_KV.get(`d:${y}`)) || '{}'); } catch (e) { /* ignore */ }

    return new Response(
      JSON.stringify({ today: Object.keys(rec).length, yesterday: Object.keys(yrec).length, day }),
      { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  },
};
