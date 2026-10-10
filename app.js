/* 換電觀測所 — 前端 (Gogoro + Ionex 合併視圖) */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtN = n => Number(n || 0).toLocaleString('en-US');
const shortDate = d => { const [, m, day] = d.split('-'); return `${Number(m)}/${Number(day)}`; };

const NETS = [
  { id: 'gogoro', label: 'Gogoro' },
  { id: 'ionex', label: 'Ionex' },
];

/* 縣市:由北到南固定順序 */
const CITY_ORDER = ['基隆市','台北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣','金門縣','連江縣'];
const cityRank = c => { const i = CITY_ORDER.indexOf(c); return i < 0 ? 999 : i; };
const cmpCity = (a, b) => (cityRank(a) - cityRank(b)) || (a < b ? -1 : a > b ? 1 : 0);
/* 區:逐字筆畫數排序 (字源:Unicode Unihan kRSUnicode, 依台灣教育部標準字體校正) */
const STROKES = {"七":2,"三":3,"上":3,"下":3,"中":4,"丹":4,"九":2,"二":2,"五":4,"井":4,"仁":4,"仙":5,"份":6,"伸":7,"佳":8,"來":8,"保":9,"信":9,"元":4,"光":6,"內":4,"八":2,"公":4,"六":4,"冬":5,"前":9,"功":5,"勢":13,"化":4,"北":5,"區":11,"卑":8,"卓":8,"南":9,"原":10,"口":3,"古":5,"台":5,"吉":6,"同":6,"名":6,"后":6,"和":8,"員":10,"善":12,"嘉":14,"四":5,"國":11,"圍":12,"園":13,"土":3,"地":6,"坑":7,"坪":8,"城":9,"埔":10,"埕":10,"埤":11,"基":11,"堵":11,"塘":13,"壁":16,"壇":16,"壢":19,"士":3,"壯":7,"壽":14,"外":5,"大":3,"太":4,"如":6,"姓":8,"子":3,"學":16,"安":6,"官":8,"定":8,"宜":8,"富":12,"寧":14,"寮":15,"寶":20,"將":11,"小":3,"尖":6,"尾":7,"屋":9,"屏":9,"屯":4,"山":3,"岡":8,"峰":10,"島":10,"峽":10,"崁":10,"崎":11,"崙":11,"嶼":17,"巒":22,"州":6,"巢":11,"左":5,"市":5,"布":5,"平":5,"庄":6,"店":8,"庫":10,"康":11,"廟":15,"彌":17,"彰":14,"後":9,"復":12,"德":15,"心":4,"忠":8,"恆":9,"愛":13,"成":6,"投":7,"文":4,"斗":4,"新":13,"旗":14,"日":4,"星":9,"春":9,"暖":13,"朴":6,"杉":7,"村":7,"東":8,"松":8,"板":8,"枋":8,"林":8,"柳":9,"栗":10,"桃":10,"桐":10,"梅":11,"梓":11,"梧":11,"棲":12,"楊":13,"楠":13,"樂":15,"樹":16,"橋":16,"橫":16,"歌":14,"止":4,"正":5,"武":8,"歸":18,"民":5,"水":4,"永":5,"汐":6,"江":6,"池":6,"沙":7,"河":8,"治":8,"泰":10,"洛":9,"津":9,"洲":9,"淡":11,"深":11,"清":11,"港":12,"湖":12,"源":13,"溪":13,"滿":14,"潭":15,"潮":15,"澎":15,"澳":16,"濃":16,"濱":17,"灣":25,"烈":10,"烏":10,"燕":16,"營":17,"獅":13,"玉":5,"球":11,"琉":10,"瑞":13,"田":5,"甲":5,"番":12,"白":5,"石":5,"碇":13,"礁":17,"社":7,"神":9,"福":13,"秀":7,"穗":17,"竹":6,"竿":9,"結":11,"綠":13,"線":14,"縣":16,"羅":19,"美":9,"義":3,"肚":7,"股":8,"背":9,"腳":13,"臺":14,"興":15,"芎":6,"芝":7,"芬":7,"花":7,"芳":7,"苑":8,"苓":8,"苗":8,"茄":8,"草":9,"莊":10,"莿":11,"華":11,"萣":11,"萬":13,"蓮":14,"蘆":19,"蘇":19,"蘭":20,"虎":8,"螺":17,"袋":10,"裡":12,"褒":14,"西":6,"觀":25,"谷":7,"豆":7,"豐":18,"貢":10,"路":13,"車":7,"軍":9,"通":10,"造":10,"連":10,"達":12,"邊":18,"鄉":12,"里":7,"重":9,"野":11,"金":8,"銅":13,"鎮":17,"鑼":26,"長":8,"門":8,"間":12,"關":19,"阿":7,"陀":7,"隆":11,"雄":12,"雅":12,"集":12,"雙":18,"雲":12,"霄":15,"霧":19,"靖":13,"音":9,"頂":11,"頭":16,"館":16,"香":9,"馬":10,"高":10,"魚":11,"鳥":11,"鳳":14,"鶯":21,"鹽":24,"鹿":11,"麟":23,"麥":11,"麻":11,"鼓":13,"龍":16,"龜":16};
const strokeKey = s => [...s].map(c => STROKES[c] ?? 99);
const cmpStroke = (a, b) => {
  const ka = strokeKey(a), kb = strokeKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const d = (ka[i] ?? 99) - (kb[i] ?? 99);
    if (d) return d;
  }
  return a < b ? -1 : a > b ? 1 : 0;
};

const S = {
  range: 30, start: null, end: null,
  city: '', district: '',
  manifest: null, cities: {},
  T: {},                 // net -> trends.json
  dates: [],             // 聯集日期(排序)
  dailyCache: {},        // net -> {date: daily}
  charts: {},
};
const FIELD_ZH = { rid: '站點編號', name: '站名', address: '地址', city: '縣市', district: '區', zip: '郵遞區號', lat: '緯度', lng: '經度', state: '營運狀態', state_raw: '原始狀態碼', reason: '暫停原因碼', maint_start: '暫停開始', maint_end: '暫停結束', h24: '24小時營業', hours: '營業時間' };
const REASON_ZH = { 2: '設備保養' };
const fmtTWT = iso => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    const tz = 'Asia/Taipei';
    const M = Number(new Intl.DateTimeFormat('en', { timeZone: tz, month: 'numeric' }).format(d));
    const D = Number(new Intl.DateTimeFormat('en', { timeZone: tz, day: 'numeric' }).format(d));
    const h = new Intl.DateTimeFormat('en', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return `${M}/${D} ${h}`;
  } catch (e) { return String(iso); }
};
const fmtVal = (f, v) => {
  if (v === null || v === undefined) return '—';
  if (f === 'state') return v === 1 ? '營運中' : '非營運中';
  if (f === 'h24') return v ? '是' : '否';
  if (f === 'maint_start' || f === 'maint_end') return fmtTWT(v);
  if (f === 'reason') return REASON_ZH[v] ? `${REASON_ZH[v]} (${v})` : `暫停服務 (${v})`;
  return String(v);
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const netColor = id => cssVar(id === 'gogoro' ? '--gogoro' : '--ionex');
const isLight = () => document.documentElement.dataset.theme === 'light';

function initTheme() {
  let t = 'dark';
  try { if (localStorage.getItem('sw-theme') === 'light') t = 'light'; } catch (e) {}
  document.documentElement.dataset.theme = t;
}

/* ---------- 資料 ---------- */
async function loadAll() {
  S.manifest = await (await fetch('data/manifest.json')).json();
  $('#updatedAt').textContent = S.manifest.updated || '—';
  const dateSet = new Set();
  for (const n of NETS) {
    const t = await (await fetch(`data/${n.id}/trends.json`)).json();
    S.T[n.id] = t;
    S.dailyCache[n.id] = {};
    t.dates.forEach(d => dateSet.add(d));
    const c = (S.manifest.networks[n.id] || {}).cities || {};
    for (const [city, dists] of Object.entries(c)) {
      S.cities[city] = [...new Set([...(S.cities[city] || []), ...dists])].sort(cmpStroke);
    }
  }
  S.dates = [...dateSet].sort();
  const cs = $('#citySel');
  cs.innerHTML = '<option value="">全台灣</option>' +
    Object.keys(S.cities).sort(cmpCity).map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const a = $('#dStart'), b = $('#dEnd');
  a.min = S.dates[0]; a.max = S.dates[S.dates.length - 1];
  b.min = S.dates[0]; b.max = S.dates[S.dates.length - 1];
  a.value = S.dates[0]; b.value = S.dates[S.dates.length - 1];
}

function currentDates() {
  if (S.range === 'custom' && S.start && S.end) return S.dates.filter(d => d >= S.start && d <= S.end);
  return S.dates.slice(-S.range);
}

/* 取某網絡在行政區篩選下的數列(與 S.dates 對齊,缺日為 null) */
function aligned(net, key) {
  const t = S.T[net];
  let se;
  if (S.city && S.district) se = t.districts[`${S.city}|${S.district}`];
  else if (S.city) se = t.cities[S.city];
  else se = t;
  const m = {};
  (se ? t.dates : []).forEach((d, i) => { m[d] = i; });
  if (!se) return S.dates.map(() => null);
  return S.dates.map(d => (m[d] != null && se[key][m[d]] != null ? se[key][m[d]] : null));
}

async function getDaily(net, date) {
  const cache = S.dailyCache[net];
  if (!(date in cache)) {
    // 只請求該網絡 trends.json 確實涵蓋的日期，避免 404
    if (S.T[net] && S.T[net].dates.includes(date)) {
      const r = await fetch(`data/${net}/daily/${date}.json`);
      cache[date] = r.ok ? await r.json() : null;
    } else {
      cache[date] = null;
    }
  }
  return cache[date];
}

const inRegion = s =>
  (!S.city || s.city === S.city) && (!S.district || s.district === S.district);

/* ---------- 渲染 ---------- */
function countUp(el, to) {
  if (reduceMotion) { el.textContent = fmtN(to); return; }
  const dur = 650, t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmtN(Math.round(to * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function netPeriod(net, dates) {
  const total = aligned(net, 'total'), added = aligned(net, 'added'), removed = aligned(net, 'removed');
  const idx = dates.map(d => S.dates.indexOf(d)).filter(i => i >= 0 && total[i] != null);
  if (!idx.length) return { total: 0, first: 0, added: 0, removed: 0 };
  return {
    total: total[idx[idx.length - 1]],
    first: total[idx[0]],
    added: idx.reduce((a, i) => a + (added[i] || 0), 0),
    removed: idx.reduce((a, i) => a + (removed[i] || 0), 0),
  };
}

function renderStats(dates) {
  const region = S.district ? `${S.city}・${S.district}` : S.city || '全台灣';
  const scope = `${shortDate(dates[0])} – ${shortDate(dates[dates.length - 1])}・${region}`;
  for (const n of NETS) {
    const q = netPeriod(n.id, dates);
    const nv = q.added - q.removed;
    countUp($(`#stTotal-${n.id}`), q.total);
    countUp($(`#stAdded-${n.id}`), q.added);
    countUp($(`#stRemoved-${n.id}`), q.removed);
    const ne = $(`#stNet-${n.id}`);
    ne.textContent = (nv > 0 ? '+' : '') + fmtN(nv);
    ne.className = 'mnum' + (nv > 0 ? ' up' : nv < 0 ? ' down' : '');
  }
  $('#totalSub').textContent = scope;
  $('#addSub').textContent = scope;
  $('#rmSub').textContent = scope;
  $('#feedSub').textContent = scope;
}

function chartDefaults() {
  if (!window.Chart) return;
  const light = isLight();
  Chart.defaults.color = light ? '#5C685B' : '#A3AFA2';
  Chart.defaults.borderColor = light ? 'rgba(28,35,27,.08)' : 'rgba(241,236,223,.07)';
  Chart.defaults.font.family = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  Chart.defaults.font.size = 12;
}

function renderCharts(dates) {
  if (!window.Chart) return;
  Object.values(S.charts).forEach(c => c.destroy());
  S.charts = {};
  const light = isLight();
  const labels = dates.map(shortDate);
  const idx = dates.map(d => S.dates.indexOf(d));
  const grid = { color: light ? 'rgba(28,35,27,.07)' : 'rgba(241,236,223,.06)' };
  const tooltip = {
    backgroundColor: light ? 'rgba(255,255,255,.97)' : 'rgba(16,22,16,.97)',
    titleColor: light ? '#1C231B' : '#F1ECDF',
    bodyColor: light ? '#1C231B' : '#F1ECDF',
    borderColor: light ? 'rgba(28,35,27,.16)' : 'rgba(205,235,77,.4)',
    borderWidth: 1, padding: 12, cornerRadius: 10, displayColors: true,
    titleFont: { weight: '700', size: 13 }, bodyFont: { size: 13 },
  };
  const common = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { boxWidth: 14, boxHeight: 14, usePointStyle: true, padding: 16 } },
      tooltip,
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
      y: { grid, ticks: { precision: 0 } },
    },
    animation: reduceMotion ? false : { duration: 700, easing: 'easeOutQuart' },
  };
  const lineDS = (net, key) => {
    const n = NETS.find(x => x.id === net);
    const data = idx.map(i => aligned(net, key)[i]);
    const npts = data.filter(v => v != null).length;
    return {
      label: n.label,
      data,
      borderColor: netColor(net), backgroundColor: netColor(net),
      tension: .28, borderWidth: 2.2,
      // 單一資料點時顯示圓點,否則線條本身已足夠
      pointRadius: npts < 2 ? 4 : 0, pointHoverRadius: 5,
      spanGaps: true,
    };
  };
  const barDS = (net, key) => {
    const n = NETS.find(x => x.id === net);
    return {
      label: n.label,
      data: idx.map(i => aligned(net, key)[i]),
      backgroundColor: netColor(net) + 'D9',
      hoverBackgroundColor: netColor(net),
      borderRadius: 5, maxBarThickness: 20, borderSkipped: false,
    };
  };
  S.charts.total = new Chart($('#chTotal'), {
    type: 'line',
    data: { labels, datasets: [lineDS('gogoro', 'total'), lineDS('ionex', 'total')] },
    options: common,
  });
  // 長條圖:Y 軸不顯示負值
  const barOpts = {
    ...common,
    scales: {
      ...common.scales,
      y: { ...common.scales.y, suggestedMin: 0 },
    },
  };
  S.charts.add = new Chart($('#chAdd'), {
    type: 'bar',
    data: { labels, datasets: [barDS('gogoro', 'added'), barDS('ionex', 'added')] },
    options: barOpts,
  });
  S.charts.rm = new Chart($('#chRm'), {
    type: 'bar',
    data: { labels, datasets: [barDS('gogoro', 'removed'), barDS('ionex', 'removed')] },
    options: barOpts,
  });
}

function stationRow(net, s, badge) {
  const gmap = (s.lat != null && s.lng != null)
    ? `<a class="maplink" target="_blank" rel="noopener" href="https://www.google.com.tw/maps/dir//${s.lat},${s.lng}">地圖</a>` : '';
  const dist = [s.city, s.district].filter(Boolean).join('・');
  const nc = net === 'gogoro' ? 'b-net-g' : 'b-net-i';
  const nl = net === 'gogoro' ? 'Gogoro' : 'Ionex';
  return `<div class="station">
    <span class="badge ${nc}">${nl}</span>
    <span class="badge ${badge.cls}">${badge.tx}</span>
    <div class="grow">
      <div class="nm">${esc(s.name || '(未命名)')}</div>
      ${dist ? `<div class="distline">${esc(dist)}</div>` : ''}
      <div class="ad">${esc(s.address || '')}</div>
      <div class="hrs">
        <svg viewBox="0 0 16 16" class="ic"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        ${esc(s.h24 ? '24 小時營業' : (s.hours || '營業時間未定'))}
        ${gmap ? `・${gmap}` : ''}
      </div>
    </div>
  </div>`;
}

function changedRow(net, c) {
  const rows = c.fields.map(f =>
    `<tr><th>${esc(FIELD_ZH[f] || f)}</th><td class="b">${esc(fmtVal(f, c.before[f]))}</td><td class="a">${esc(fmtVal(f, c.after[f]))}</td></tr>`).join('');
  const nc = net === 'gogoro' ? 'b-net-g' : 'b-net-i';
  const nl = net === 'gogoro' ? 'Gogoro' : 'Ionex';
  // 暫停服務詳細公告 (如:設備保養期間)
  let maint = '';
  if (c.maint && (c.maint.reason != null || c.maint.start)) {
    const r = c.maint.reason;
    const rtx = r != null ? (REASON_ZH[r] || '暫停服務') : '暫停服務';
    const period = c.maint.start ? `${fmtTWT(c.maint.start)}${c.maint.end ? ' → ' + fmtTWT(c.maint.end) : ''}` : '';
    maint = `<div class="maint-note"><span class="mnt-ic">🔧</span><span><b>${esc(rtx)}</b>${period ? `：${esc(period)} 暫停服務` : '，暫時不提供交換電池服務'}</span></div>`;
  }
  return `<div class="station">
    <span class="badge ${nc}">${nl}</span>
    <span class="badge b-chg">異動</span>
    <div class="grow">
      <div class="nm">${esc(c.name || '(未命名)')}</div>
      ${[c.city, c.district].filter(Boolean).join('・') ? `<div class="distline">${esc([c.city, c.district].filter(Boolean).join('・'))}</div>` : ''}
      ${maint}
      <details class="chg"><summary>變更 ${c.fields.length} 個欄位</summary>
        <table class="chg-table"><tr><th>欄位</th><th>變更前</th><th>變更後</th></tr>${rows}</table>
      </details>
    </div>
  </div>`;
}

async function renderFeed(dates) {
  const box = $('#feedList');
  box.innerHTML = '';
  let total = 0;
  for (const d of [...dates].reverse()) {
    let html = '', cnt = { a: 0, r: 0, c: 0 };
    for (const n of NETS) {
      const daily = await getDaily(n.id, d);
      if (!daily) continue;
      const added = (daily.added || []).filter(inRegion);
      const removed = (daily.removed || []).filter(inRegion);
      const changed = (daily.changed || []).filter(inRegion);
      cnt.a += added.length; cnt.r += removed.length; cnt.c += changed.length;
      html += added.map(s => stationRow(n.id, s, { cls: 'b-add', tx: '新增' })).join('')
        + removed.map(s => stationRow(n.id, s, { cls: 'b-rm', tx: '移除' })).join('')
        + changed.map(c => changedRow(n.id, c)).join('');
    }
    if (!html) continue;
    total += cnt.a + cnt.r + cnt.c;
    const div = document.createElement('div');
    div.className = 'dayblock';
    div.innerHTML = `<div class="dayhead">${esc(d)} <span class="dcount">新增 ${cnt.a}・移除 ${cnt.r}・異動 ${cnt.c}</span></div>${html}`;
    box.appendChild(div);
  }
  if (!total) box.innerHTML = '<div class="feed-empty">這段期間、這個地區沒有站點異動。</div>';
}

/* ---------- 主流程 ---------- */
async function render() {
  const dates = currentDates();
  if (!dates.length) return;
  updateSummary();
  renderStats(dates);
  renderCharts(dates);
  await renderFeed(dates);
}

function setupStickyFilters() {
  const bar = document.querySelector('.filters');
  const sentinel = document.getElementById('filterSentinel');
  if (!bar || !sentinel) return;
  const setTop = () => {
    const h = document.querySelector('.topbar').offsetHeight;
    document.documentElement.style.setProperty('--sticky-top', (h + 10) + 'px');
  };
  setTop();
  addEventListener('resize', setTop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setTop);
  const stickyPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sticky-top')) || 86;
  new IntersectionObserver(([e]) => {
    const stuck = e.boundingClientRect.top < stickyPx();
    bar.classList.toggle('is-stuck', stuck);
    if (!stuck) bar.classList.remove('expanded');
  }, { threshold: 0 }).observe(sentinel);
  // 手機摘要列:點一下展開/收合
  $('#filterSummary').addEventListener('click', () => {
    bar.classList.toggle('expanded');
  });
}

function updateSummary() {
  const r = $('#fsRange'), g = $('#fsRegion');
  if (!r || !g) return;
  const chip = document.querySelector('#rangeChips button.on');
  r.textContent = chip ? chip.textContent.trim() : '';
  let region = S.city || '全台灣';
  if (S.district) region += '・' + S.district;
  else if (S.city) region += '・全部區';
  g.textContent = region;
}

function bindUI() {
  $('#themeToggle').addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('sw-theme', next); } catch (e) {}
    chartDefaults();
    renderCharts(currentDates());
  });
  $$('#rangeChips button').forEach(b => b.addEventListener('click', async () => {
    $$('#rangeChips button').forEach(x => x.classList.toggle('on', x === b));
    const r = b.dataset.range;
    $('#customRange').hidden = r !== 'custom';
    if (r === 'custom') {
      S.range = 'custom'; S.start = $('#dStart').value; S.end = $('#dEnd').value;
    } else {
      S.range = Number(r);
    }
    await render();
  }));
  const customGo = async () => {
    if (S.range !== 'custom') return;
    let a = $('#dStart').value, c = $('#dEnd').value;
    if (a && c && a > c) [a, c] = [c, a], $('#dStart').value = a, $('#dEnd').value = c;
    S.start = a || S.dates[0]; S.end = c || S.dates[S.dates.length - 1];
    await render();
  };
  $('#dStart').addEventListener('change', customGo);
  $('#dEnd').addEventListener('change', customGo);
  $('#citySel').addEventListener('change', async e => {
    S.city = e.target.value; S.district = '';
    const ds = $('#distSel');
    if (S.city && S.cities[S.city]) {
      ds.innerHTML = '<option value="">全部區</option>' + S.cities[S.city].map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
      ds.disabled = false;
    } else {
      ds.innerHTML = '<option value="">全部區</option>'; ds.disabled = true;
    }
    await render();
  });
  $('#distSel').addEventListener('change', async e => { S.district = e.target.value; await render(); });
}

(async function init() {
  initTheme();
  chartDefaults();
  await loadAll();
  bindUI();
  setupStickyFilters();
  await render();
})();
