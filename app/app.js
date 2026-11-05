/* Nexos App — área do aluno e do treinador */
(() => {
'use strict';

const SUPABASE_URL = 'https://gbcshtmesawpokuwiaxb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY3NodG1lc2F3cG9rdXdpYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MDg2MjYsImV4cCI6MjEwODk4NDYyNn0.ZR4vHBDAa_yMA8pSCWUriKAoh8OsEUKXO7WgZnR89Ak';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'nexos-app-auth' }
});

const S = { user: null, me: null, org: null, staff: false, cache: {} };
const $app = document.getElementById('app');
const $dock = document.getElementById('dock');

/* ---------- tema ---------- */
const LOGO = { s: () => document.documentElement.dataset.tema === 'escuro' ? 'icons/simbolo.svg' : 'icons/simbolo-escuro.svg', w: () => document.documentElement.dataset.tema === 'escuro' ? 'icons/wordmark.svg' : 'icons/wordmark-escuro.svg' };
function aplicarTema(t) {
  document.documentElement.dataset.tema = t; store.set('nx-tema', t);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'escuro' ? '#050c1c' : '#f3f6fb';
}
/* ---------- utilidades ---------- */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => String(n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const fmtData = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const fmtHora = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diasDesde = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const quando = (d) => { const n = diasDesde(d); return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`; };
const minutos = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const rpeCor = (n) => n == null ? 'var(--dim)' : n <= 3 ? '#3ddc97' : n <= 6 ? '#46d6ff' : n <= 8 ? '#ffcf5c' : '#ff8a8a';
const rpeTxt = (n) => n == null ? '' : n <= 2 ? 'Muito leve' : n <= 4 ? 'Leve' : n <= 6 ? 'Moderado' : n <= 8 ? 'Intenso' : 'Máximo';
function gerarSenha() {
  const a = 'abcdefghjkmnpqrstuvwxyz', d = '23456789';
  const r = (s) => s[Math.floor(Math.random() * s.length)];
  return 'nx' + r(a) + r(a) + r(a) + r(d) + r(d) + r(d) + r(d);
}
const AREA = window.NX_AREA === 'treinador' ? 'treinador' : 'aluno';
// Na Área do treinador a página usa <base href="/app/">; sem isto, links "#/..." levariam para a Área do aluno.
if (document.querySelector('base')) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || a.target || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); const h = a.getAttribute('href');
    if (location.hash === h) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = h;
  });
}
const loginURL = () => { try { return new URL('.', document.baseURI).href; } catch { return location.origin + location.pathname.replace(/[^/]*$/, ''); } };

const I = {
  alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17h.01"/></svg>',
  espera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  bolo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M5 20v-6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V20"/><path d="M5 15.5c1.4 1 2.8 1 4.2 0s2.8-1 4.2 0 2.8 1 4.2 0"/><path d="M12 11.5V8M12 5.5v.01"/></svg>',
  saude: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-4 3 8 2-4h7"/></svg>',
  caixa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13 6.5 5h11L20 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20"/></svg>',
  okc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/></svg>',
  raio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
  paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5h6v3H9z"/><path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/></svg>',
  ficha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="18" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.7c2 .8 3.2 2.7 3.6 5.3"/></svg>',
  feed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z"/></svg>',
  lib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
  run: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16.4" cy="3.9" r="2.2" fill="currentColor" stroke="none"/><path d="M14.8 7.4 12.7 13"/><path d="M14.5 8.1 11.2 8.1 9.3 10.6"/><path d="M14.5 8.1 16.6 11.4 19.6 10.3"/><path d="M12.7 13 15.6 16.3 13.6 20.6"/><path d="M12.7 13 10.5 16.1 7.2 14.4"/><path d="M3.2 7.4h3.6M2 10.4h4M3.2 13.4h2.6" stroke-width="2"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  watch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 9.5V12l1.5 1.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.1z"/></svg>',
};
const icCorr = () => I.run;
// selos sólidos da marca para corrida e força (no lugar de emoji)
const HALTER_S = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="1.2" y="9" width="2.8" height="6" rx="1.1"/><rect x="4.6" y="5.6" width="3.6" height="12.8" rx="1.4"/><rect x="15.8" y="5.6" width="3.6" height="12.8" rx="1.4"/><rect x="20" y="9" width="2.8" height="6" rx="1.1"/><rect x="8" y="10.5" width="8" height="3" rx="1"/></svg>';
const modSelos = (m) => { const md = m && Array.isArray(m.modalidades) && m.modalidades.length ? m.modalidades : ['corrida', 'musculacao']; return `<span class="mod-selos" title="${md.includes('corrida') && md.includes('musculacao') ? 'Corrida e força' : md.includes('corrida') ? 'Só corrida' : 'Só força'}">${md.includes('corrida') ? selo('corrida', 'sm') : ''}${md.includes('musculacao') ? selo('forca', 'sm') : ''}</span>`; };
const selo = (k, extra = '') => `<span class="selo ${k === 'corrida' ? 'selo-c' : 'selo-f'} ${extra}" ${k === 'corrida' ? 'title="Corrida"' : 'title="Força"'}>${k === 'corrida' ? I.run : HALTER_S}</span>`;
const imgURL = (p) => (/^https?:/.test(p) ? p : 'ex/' + p);
function exFig(ex, cls = '') {
  const im = (ex && ex.imagens) || [];
  if (!im.length && ex && ehVideoArquivo(ex.video_url)) return `<div class="exfig ${cls}"><video src="${esc(ex.video_url.split('#')[0])}#t=0.5" muted playsinline preload="metadata" aria-hidden="true"></video></div>`;
  if (!im.length) return `<div class="exfig empty ${cls}" aria-hidden="true"><span>${esc((ex && ex.grupo) || '')}</span></div>`;
  return `<div class="exfig ${im.length > 1 ? 'anim' : ''} ${cls}">${im.slice(0, 2).map((p, k) => `<img src="${esc(imgURL(p))}" alt="${k ? '' : esc(ex.nome)}" loading="lazy" decoding="async">`).join('')}</div>`;
}
const passosHTML = (l) => `<ol class="steps">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
const instrCache = {};
async function hidratarInstrucoes(root = document) {
  for (const el of root.querySelectorAll('[data-instr-ref]')) {
    const ref = el.dataset.instrRef; el.removeAttribute('data-instr-ref');
    try {
      if (!instrCache[ref]) instrCache[ref] = fetch(imgURL(ref + '/info.json')).then((r) => r.ok ? r.json() : { instrucoes: [] });
      const d = await instrCache[ref];
      el.innerHTML = d.instrucoes && d.instrucoes.length ? passosHTML(d.instrucoes) : '<p class="dim">Sem instruções.</p>';
    } catch { el.innerHTML = '<p class="dim">Não foi possível carregar as instruções.</p>'; }
  }
}
// vídeo em arquivo (mp4/mov/webm ou do armazenamento) toca dentro do app; link de YouTube etc. abre fora
const ehVideoArquivo = (u) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u || '') || /\/storage\/v1\/object\//.test(u || '');
const exVideoHTML = (ex) => ex && ex.video_url && ehVideoArquivo(ex.video_url)
  ? `<div class="ex-vid">${/#loop$/.test(ex.video_url) ? `<video src="${esc(ex.video_url.split('#')[0])}" autoplay muted loop playsinline preload="metadata" disablepictureinpicture></video>` : `<video src="${esc(ex.video_url)}" controls playsinline ${ex.com_audio ? '' : 'muted'} loop preload="none"></video>`}${ex.video_credito ? `<p class="tiny dim">Vídeo: ${esc(ex.video_credito).replace('CC BY-SA 4.0', '<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt_BR" target="_blank" rel="noopener" class="dim">CC BY-SA 4.0</a>')}</p>` : ''}</div>` : '';
function exDetalhe(ex) {
  const passos = (ex.instrucoes && ex.instrucoes.length) ? passosHTML(ex.instrucoes)
    : ex.ref_externa ? `<div data-instr-ref="${esc(ex.ref_externa)}"><p class="dim small">Carregando instruções…</p></div>`
    : (ex.descricao ? `<p>${esc(ex.descricao)}</p>` : '<p class="dim">Sem instruções.</p>');
  const mus = [...(ex.musculos || []).map((m) => `<span class="tag acc">${esc(m)}</span>`), ...(ex.musculos_sec || []).map((m) => `<span class="tag">${esc(m)}</span>`)].join('');
  return `${exVideoHTML(ex)}${passos}${mus ? `<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${mus}</div>` : ''}${ex.equipamento ? `<p class="tiny dim" style="margin-top:8px">Equipamento: ${esc(ex.equipamento)}${ex.nivel ? ' · Nível: ' + esc(ex.nivel) : ''}</p>` : ''}`;
}
const slashes = '<span class="slashes" aria-hidden="true"><i></i><i></i><i></i></span>';

let toastT;
const vibrar = (p) => { try { if (navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(p); } catch {} };
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  // sucesso ganha um check animado e uma vibração curta; erro vibra diferente; "Enviando…" fica neutro
  const neutro = !err && /…$/.test(String(msg));
  t.innerHTML = `${neutro ? '' : `<span class="toast-ic">${err ? I.alerta : I.check}</span>`}<span>${esc(String(msg))}</span>`;
  t.className = 'toast show' + (err ? ' err' : '') + (neutro ? ' neutro' : '');
  if (!neutro) vibrar(err ? [40, 60, 40] : 18);
  clearTimeout(toastT); toastT = setTimeout(() => (t.className = 'toast' + (err ? ' err' : '')), 2800);
}

/* ---------- painel (sheet) ---------- */
const $sheet = document.getElementById('sheet');
const $sheetBody = document.getElementById('sheet-body');
function openSheet(html, onMount) {
  if ($sheet.hidden) { try { history.pushState({ ...(history.state || {}), nxPainel: 1 }, ''); } catch {} }
  $sheetBody.innerHTML = html; $sheet.hidden = false; document.body.style.overflow = 'hidden';
  onMount && onMount($sheetBody);
  const f = $sheetBody.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 250);
}
function closeSheet(semVoltar) {
  const estava = !$sheet.hidden;
  $sheet.hidden = true; $sheetBody.innerHTML = ''; document.body.style.overflow = ''; const sh = $sheet.querySelector('.sheet'); if (sh) sh.style.transform = '';
  // o painel abriu um passo no histórico: fechar pelo X tira esse passo (o "voltar" do celular também fecha)
  if (estava && !semVoltar && history.state && history.state.nxPainel) history.back();
}
window.addEventListener('popstate', () => { if (!$sheet.hidden) closeSheet(true); });
// arrastar o painel para baixo fecha (quando ele está no topo)
(() => {
  const sh = $sheet.querySelector('.sheet'); if (!sh) return; let y0 = null, dy = 0;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop > 0 || e.touches.length > 1 || e.target.closest('canvas,input,textarea,select,.card-gal,.chips')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
  sh.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = innerWidth >= 700 ? `translate(-50%, calc(-50% + ${dy}px))` : `translate(-50%, ${dy}px)`; } }, { passive: true });
  sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transition = ''; if (dy > 110) closeSheet(); else sh.style.transform = ''; y0 = null; });
})();
$sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$sheet.hidden) closeSheet(); });

async function chamarFuncao(body) {
  const { data, error } = await sb.functions.invoke('nx-alunos', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let msg = 'Não foi possível concluir. Tente de novo.';
    try { const j = await error.context.json(); if (j?.erro) msg = j.erro; } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}

// ícone dentro do texto (no lugar de emoji) e ícone grande de estado
const icT = (svg, cls = '') => `<i class="ic-t ${cls}">${svg}</i>`;
const estIc = (svg, tom = 'acc') => `<div class="est-ic t-${tom}">${svg}</div>`;

/* ---------- telas vazias: ícone do assunto em cima do texto (automático) ---------- */
const EMPTY_IC = [[/mensag|conversa/i, 'feed'], [/prova/i, 'flag'], [/avalia/i, 'ficha'], [/mensalid|pagament/i, 'money'], [/atleta|aluno/i, 'users'], [/ficha|anamnese/i, 'ficha'], [/carga/i, 'up'], [/ritmo|pace/i, 'watch'], [/exerc/i, 'lib'], [/corrida/i, 'run'], [/treino/i, 'cal'], [/encontrad/i, 'search']];
function enfeitarVazios(raiz) {
  raiz.querySelectorAll('.empty:not(.com-ic)').forEach((e) => {
    e.classList.add('com-ic');
    if (e.querySelector('.est-ic')) return;
    const t = (e.querySelector('.h3') || e).textContent || '';
    const k = (EMPTY_IC.find(([re]) => re.test(t)) || [, 'grid'])[1];
    e.insertAdjacentHTML('afterbegin', `<div class="est-ic">${I[k] || I.grid}</div>`);
  });
}
new MutationObserver(() => enfeitarVazios(document.body)).observe(document.body, { childList: true, subtree: true });

/* ---------- computador: faixas que rolam para o lado aceitam arrastar com o mouse e a roda ---------- */
(() => {
  if (!matchMedia('(pointer:fine)').matches) return;
  const rolavel = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.scrollWidth > n.clientWidth + 4) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return n; } } return null; };
  let arr = null;
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('input,textarea,select,.mod,[data-mod],[draggable="true"]')) return;
    const n = rolavel(e.target); if (!n) return;
    arr = { n, x: e.clientX, sl: n.scrollLeft, moveu: false };
  });
  document.addEventListener('mousemove', (e) => {
    if (!arr) return; const dx = e.clientX - arr.x;
    if (!arr.moveu && Math.abs(dx) < 6) return;
    arr.moveu = true; arr.n.scrollLeft = arr.sl - dx; arr.n.classList.add('arrastando-x'); e.preventDefault();
  });
  document.addEventListener('mouseup', () => {
    if (!arr) return; const a = arr; arr = null; a.n.classList.remove('arrastando-x');
    if (a.moveu) { const k = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', k, { capture: true, once: true }); setTimeout(() => document.removeEventListener('click', k, { capture: true }), 0); }
  });
  document.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.shiftKey) return;
    const n = rolavel(e.target); if (!n || n.scrollHeight > n.clientHeight + 4) return;
    const fim = e.deltaY > 0 ? n.scrollLeft + n.clientWidth >= n.scrollWidth - 1 : n.scrollLeft <= 0; if (fim) return;
    n.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });
})();

/* ---------- a página não dá zoom com os dedos ---------- */
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 && !e.target.closest('#cd-cv')) e.preventDefault(); }, { passive: false });

/* ---------- navegação ---------- */
function setDock(items) {
  if (!items) { $dock.hidden = true; return; }
  const cur = location.hash || '#/';
  // no computador o dock vira menu lateral: marca no topo e o perfil no rodapé
  const marca = `<a href="#/" class="dock-brand" aria-label="Início"><img class="lg-claro" src="icons/wordmark-escuro.svg" alt="Nexos"><img class="lg-escuro" src="icons/wordmark.svg" alt="Nexos"><img class="lg-sim lg-sim-c" src="icons/simbolo-escuro.svg" alt=""><img class="lg-sim lg-sim-e" src="icons/simbolo.svg" alt=""><small>${S.staff ? 'Área do treinador' : 'Área do aluno'}</small></a>`;
  const eu = S.me ? `<a href="#/perfil" class="dock-eu ${cur.startsWith('#/perfil') ? 'on' : ''}" aria-label="Meu perfil">${avAluno(S.me, 'sm')}<span><b>${esc(firstName(S.me.nome) || 'Perfil')}</b><small>Meu perfil</small></span></a>` : '';
  $dock.innerHTML = marca + items.map((it) => {
    const on = it.match.some((m) => cur === m || (m.length > 2 && cur.startsWith(m + '/')));
    return `<a href="${it.href}" class="${on ? 'on' : ''}" aria-label="${esc(it.label)}">${it.icon}<span>${esc(it.label)}</span>${it.badge ? `<i class="badge">${it.badge}</i>` : ''}</a>`;
  }).join('') + eu;
  $dock.hidden = false;
}
const MODS = [['musculacao', 'Musculação'], ['corrida', 'Corrida']];
const faz = (k, m = S.me) => !(m && Array.isArray(m.modalidades) && m.modalidades.length) || m.modalidades.includes(k);
const modsHTML = (sel, nome = 'mod') => `<div class="chips wrap">${MODS.map(([k, l]) => `<label class="chipc"><input type="checkbox" name="${nome}" value="${k}" ${!sel || sel.includes(k) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
const dockAluno = () => setDock([
  { href: '#/', match: ['#/', '#'], icon: I.home, label: 'Hoje' },
  { href: '#/planilha', match: ['#/planilha'], icon: I.cal, label: 'Planilha' },
  { href: '#/historico', match: ['#/historico', '#/avaliacao', '#/corrida', '#/relatorio'], icon: I.hist, label: 'Evolução' },
  ...(faz('corrida') ? [{ href: '#/eventos', match: ['#/eventos'], icon: I.flag, label: 'Eventos' }] : []),
  { href: '#/conversa', match: ['#/conversa'], icon: I.feed, label: 'Treinador', badge: S.cache.msgNovas || '' },
  { href: '#/conexoes', match: ['#/conexoes'], icon: I.watch, label: 'Conexões' },
]);
const dockStaff = () => setDock([
  { href: '#/', match: ['#/', '#', '#/feed'], icon: I.today, label: 'Hoje', badge: (S.cache.naoVistos || 0) + (S.cache.pendentes || 0) || '' },
  { href: '#/alunos', match: ['#/alunos', '#/aluno', '#/treino', '#/corrida', '#/relatorio', '#/postural'], icon: I.users, label: 'Atletas' },
  { href: '#/mensagens', match: ['#/mensagens'], icon: I.feed, label: 'Mensagens', badge: S.cache.msgNovas || '' },
  { href: '#/treinos', match: ['#/treinos', '#/modelo', '#/biblioteca'], icon: I.lib, label: 'Treinos' },
  { href: '#/relatorios', match: ['#/relatorios'], icon: I.hist, label: 'Relatórios' },
  { href: '#/mais', match: ['#/mais', '#/financeiro', '#/eventos', '#/perfil', '#/formularios'], icon: I.grid, label: 'Mais', badge: (S.cache.pagInformados || 0) + (S.cache.fichasNovas || 0) || '' },
]);

function layout(cls = '') { $app.className = 'app ' + cls; $app.dataset.novo = '1'; window.scrollTo(0, 0); }
// a tela nova entra suave só quando o conteúdo de verdade chega (não a cada atualização)
new MutationObserver(() => {
  if (!$app.dataset.novo) return; const f = $app.firstElementChild;
  if (!f || f.classList.contains('sk-pag')) return;
  delete $app.dataset.novo; $app.classList.add('entrando'); clearTimeout($app._entT); $app._entT = setTimeout(() => $app.classList.remove('entrando'), 700);
}).observe($app, { childList: true });
// esqueleto de carregamento: o formato da tela aparece enquanto os dados chegam
const sk = (cls = '', st = '') => `<i class="sk ${cls}"${st ? ` style="${st}"` : ''}></i>`;
const skLinha = (n = 4) => Array.from({ length: n }, (_, i) => `<div class="sk-row">${sk('sk-av')}<div class="sk-col">${sk('sk-t', `width:${[62, 48, 70, 55, 66][i % 5]}%`)}${sk('sk-s', `width:${[38, 30, 44, 34, 40][i % 5]}%`)}</div></div>`).join('');
const esqBloco = (tipo = 'lista') => tipo === 'cal'
  ? `<div class="sk-wrap"><div class="sk-cal">${Array.from({ length: 7 }, () => `<div class="sk-dia">${sk('sk-s', 'width:40%')}${sk('sk-card')}</div>`).join('')}</div></div>`
  : tipo === 'chat'
    ? `<div class="sk-wrap sk-chat">${sk('sk-bolha', 'width:58%')}${sk('sk-bolha eu', 'width:44%')}${sk('sk-bolha', 'width:66%')}${sk('sk-bolha eu', 'width:36%')}</div>`
    : `<div class="sk-wrap">${skLinha(3)}</div>`;
function loading() {
  $app.innerHTML = `<div class="sk-pag" aria-busy="true" aria-label="Carregando">${sk('sk-ey')}${sk('sk-h1')}<div class="sk-tiles">${sk('sk-tile')}${sk('sk-tile')}${sk('sk-tile')}</div>${skLinha(4)}</div>`;
}

async function router() {
  closeSheet(true); stopRest(); $app.onclick = null; $app.oninput = null; clearInterval(S.chatT); clearInterval(S.msgT);
  const fichaTk = (location.hash.match(/^#\/ficha\/([a-f0-9]{12,40})/) || [])[1];
  if (fichaTk) return viewFicha(fichaTk);
  if (!S.user) return viewLogin();
  if (!S.me) return viewSemAcesso();
  if (!window.NX_DEMO && AREA === 'aluno' && S.staff) return viewOutraArea('treinador');
  if (!window.NX_DEMO && AREA === 'treinador' && !S.staff) return viewOutraArea('aluno');
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [a, b, c, d] = parts;
  try {
    if (!S.staff) {
      const sd = await carregarSaude();
      if (!sd.termo) return viewTermo();
      if (!sd.anamnese) return await viewAnamnese({ gate: true, anamnese: null });
    }
    if (S.staff) {
      dockStaff(); layout('wide');
      if (!a) return await staffHoje();
      if (a === 'alunos') return await staffAlunos();
      if (a === 'financeiro') return await staffFinanceiro();
      if (a === 'aluno' && b && c === 'postural') return await formPostural(b, d && d !== 'nova' ? d : null);
      if (a === 'postural' && b) return await viewPostural(b);
      if (a === 'aluno' && b && c === 'treino') return await staffTreinoEditor(b, d || null);
      if (a === 'aluno' && b && c === 'avaliacao') return await formAvaliacao(b, d && d !== 'nova' ? d : null);
      if (a === 'relatorio' && b) return await viewRelatorio(b);
      if (a === 'corrida' && b) return await viewCorrida(b);
      if (a === 'aluno' && b) return await staffAluno(b, c, d);
      if (a === 'treino' && b) return await viewExecucao(b, true);
      if (a === 'feed') return await staffFeed();
      if (a === 'modelo' && b) return await staffTreinoEditor(null, b, 'modelo');
      if (a === 'biblioteca') return b === 'modelos' ? (location.hash = '#/treinos') : await staffBiblioteca();
      if (a === 'treinos') return await staffTreinos(b);
      if (a === 'relatorios') return await staffRelatorios();
      if (a === 'mais') return staffMais();
      if (a === 'erros') return await staffErros();
      if (a === 'formularios') return await staffFormularios(b);
      if (a === 'mensagens') return await staffMensagens(b);
      if (a === 'eventos') return await viewEventos(b);
      if (a === 'perfil') return viewPerfil();
      return await staffHoje();
    }
    if (a === 'treino' && b) { $dock.hidden = true; layout(); return await viewExecucao(b, false); }
    dockAluno(); layout('wide aluno');
    if (!a) return await alunoHoje();
    if (a === 'historico') return await alunoHistorico(b);
    if (a === 'planilha') return await viewPlanilhaAluno(b);
    if (a === 'eventos' && faz('corrida')) return await viewEventos(b);
    if (a === 'relatorio' && b) return await viewRelatorio(b);
    if (a === 'conversa') return await viewConversa(S.user.id, $app, false);
    if (a === 'conexoes') return await viewConexoes(b);
    if (a === 'previsoes') { location.replace('#/historico/previsoes'); return; }
    if (a === 'gps' && faz('corrida')) return b ? await viewGps(b) : await viewGpsLista();
    if (a === 'postural' && b) return await viewPostural(b);
    if (a === 'corrida' && b) return await viewCorrida(b);
    if (a === 'saude') return await viewAnamnese({});
    if (a === 'termo') return viewTermoLido();
    if (a === 'pagamentos') return await viewPagamentos();
    if (a === 'perfil') return viewPerfil();
    return await alunoHoje();
  } catch (e) {
    console.error(e); reportarErro(e, 'tela não carregou');
    $app.innerHTML = `<div class="empty" style="margin-top:40px"><div class="h3">Algo não carregou</div><p class="small">Verifique sua internet e tente de novo.</p><button class="btn sm" style="margin-top:16px" onclick="location.reload()">Recarregar</button></div>`;
  }
}
window.addEventListener('hashchange', router);

/* ---------- sessão ---------- */
async function carregarPerfil() {
  const { data, error } = await sb.from('nx_membros').select('*, nx_orgs(id,nome,slug,config)').eq('user_id', S.user.id).eq('ativo', true).order('criado_em');
  if (error) throw error;
  const m = (data || []).sort((x, y) => (x.papel === 'aluno') - (y.papel === 'aluno'))[0] || null;
  S.me = m; S.org = m?.nx_orgs || null; S.staff = !!m && (m.papel === 'admin' || m.papel === 'treinador');
}
async function iniciar() {
  aplicarTema(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro');
  const { data } = await sb.auth.getSession();
  S.user = data.session?.user || null;
  if (S.user) { try { await carregarPerfil(); } catch (e) { console.error(e); } }
  router();
}
sb.auth.onAuthStateChange((ev, session) => {
  if (ev === 'SIGNED_OUT') { S.user = null; S.me = null; S.org = null; S.staff = false; S.cache = {}; $dock.hidden = true; router(); }
  if (ev === 'TOKEN_REFRESHED' && session) S.user = session.user;
});

/* ================= LOGIN ================= */
function viewLogin() {
  $dock.hidden = true; layout('bare');
  $app.innerHTML = `
  <section class="login">
    <div class="login-hero">
      <img class="sym" src="${LOGO.s()}" alt="">
      <img class="wm" src="${LOGO.w()}" alt="Nexos Performance e Saúde">
      <div class="row" style="gap:12px">${slashes}<span class="eyebrow">${AREA === 'treinador' ? 'Área do treinador' : 'Área do aluno'}</span></div>
    </div>
    <form id="f-login" class="card" autocomplete="on">
      <label class="field"><span>E-mail</span><input class="input" type="email" name="email" required autocomplete="username" inputmode="email" placeholder="seuemail@exemplo.com"></label>
      <label class="field"><span>Senha</span><div class="pass-wrap"><input class="input" type="password" name="senha" required autocomplete="current-password" placeholder="Sua senha"><button type="button" class="icon-btn" id="ver-senha" aria-label="Mostrar senha">${I.eye}</button></div></label>
      <button class="btn block" type="submit">Entrar ${I.arrow}</button>
      <p class="small muted center" id="login-msg" style="margin-top:12px;min-height:1.4em"></p>
    </form>
    <div class="login-foot small muted">
      <button class="link-btn" id="esqueci">Esqueci minha senha</button>
      <p style="margin-top:16px">${AREA === 'treinador' ? '<a href="/app/" class="muted">Sou aluno → Área do aluno</a>' : ''}</p>
      <p style="margin-top:12px"><a href="../" class="muted">← Voltar ao site da Nexos</a> · <a href="../privacidade.html" class="muted" target="_blank" rel="noopener">Privacidade</a></p>
    </div>
  </section>`;
  const f = document.getElementById('f-login');
  document.getElementById('ver-senha').onclick = () => { const i = f.senha; i.type = i.type === 'password' ? 'text' : 'password'; };
  document.getElementById('esqueci').onclick = () => openSheet(`
    <div class="h2">Esqueceu a senha?</div>
    <p class="muted" style="margin:10px 0 18px">${AREA === 'treinador' ? 'Fale com o administrador da Nexos para gerar uma senha nova.' : 'Fale com seu treinador da Nexos. Ele gera uma senha nova pra você na hora, pelo próprio app.'}</p>
    <button class="btn block" data-close>Entendi</button>`);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg'); const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; msg.textContent = 'Entrando…';
    const { data, error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.senha.value });
    if (error) { btn.disabled = false; msg.textContent = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar. Tente de novo.'; return; }
    S.user = data.user;
    try { await carregarPerfil(); } catch {}
    location.hash = '#/'; router();
  };
}
function viewOutraArea(destino) {
  $dock.hidden = true; layout('bare');
  const t = destino === 'treinador';
  $app.innerHTML = `<section class="login"><div class="login-hero"><img class="sym" src="${LOGO.s()}" alt=""><img class="wm" src="${LOGO.w()}" alt="Nexos Performance e Saúde"></div>
    <div class="card center"><div class="h3">${t ? 'Você é treinador da Nexos' : 'Esta é a área dos treinadores'}</div>
    <p class="small muted" style="margin:8px 0 16px">${t ? 'Sua conta entra pela Área do treinador, onde ficam alunos, planilhas, financeiro e eventos.' : 'Sua conta é de aluno. Seus treinos ficam na Área do aluno.'}</p>
    <a class="btn block" href="${t ? '/treinador/' : '/app/'}">Ir para a ${t ? 'Área do treinador' : 'Área do aluno'} ${I.arrow}</a>
    <button class="link-btn small" id="sair" style="margin-top:12px">Sair e entrar com outra conta</button></div></section>`;
  document.getElementById('sair').onclick = () => sb.auth.signOut();
}
function viewSemAcesso() {
  $dock.hidden = true; layout('bare');
  const pinta = (pend) => { $app.innerHTML = pend
    ? `<section class="login"><div class="empty">${estIc(I.espera, 'warn')}<div class="h3">Seu cadastro está aguardando a aprovação do treinador</div><p class="small" style="margin:8px 0 16px">Assim que ele aprovar, você recebe o acesso no seu e-mail e já pode entrar.</p><button class="btn sm" id="de-novo">Verificar de novo</button> <button class="btn sm ghost" id="sair">Sair</button></div></section>`
    : `<section class="login"><div class="empty"><div class="h3">Sua conta ainda não está ligada a uma assessoria</div><p class="small" style="margin:8px 0 16px">Peça ao seu treinador para cadastrar o seu e-mail no app da Nexos.</p><button class="btn sm ghost" id="sair">Sair</button></div></section>`;
    document.getElementById('sair').onclick = () => sb.auth.signOut();
    const dn = document.getElementById('de-novo'); if (dn) dn.onclick = async () => { await carregarPerfil().catch(() => {}); router(); }; };
  pinta(false);
  sb.from('nx_membros').select('aprovacao').eq('user_id', S.user.id).eq('aprovacao', 'pendente').limit(1).then((r) => { if (r.data && r.data.length) pinta(true); }, () => {});
}

/* ================= EVENTOS: provas do Radar + eventos da Nexos ================= */
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDiaSem = (iso) => { const d = dia(iso); return `${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`; };
const faltam = (iso) => { const n = Math.round((dia(iso) - dia(hojeISO())) / 864e5); return n === 0 ? 'é hoje!' : n === 1 ? 'é amanhã' : n > 0 ? `faltam ${n} dias` : `foi há ${-n} dia${n < -1 ? 's' : ''}`; };
async function carregarEventos() {
  if (S.cache.eventos && Date.now() - S.cache.eventos.t < 10 * 60000) return S.cache.eventos;
  const [radar, { data: nx }, { data: part }] = await Promise.all([
    sb.functions.invoke('nx-eventos', { body: {} }).then((r) => (r.data && r.data.eventos) || []).catch(() => []),
    sb.from('nx_eventos').select('*').eq('org_id', S.org.id).gte('data', isoDia(Date.now() - 864e5)).order('data'),
    S.staff ? sb.from('nx_participacoes').select('*').eq('org_id', S.org.id).gte('data', isoDia(Date.now() - 60 * 864e5)).order('data')
      : sb.from('nx_participacoes').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).order('data'),
  ]);
  const eventos = [
    ...(nx || []).map((e) => ({ ref: 'nx:' + e.id, fonte: 'nexos', nexos: e, nome: e.titulo, data: e.data, hora: e.hora, cidade: e.local, local: e.local, distancias: e.distancias ? e.distancias.split(/[,;/]/).map((x) => x.trim()).filter(Boolean) : [], tipo: e.tipo, obs: e.descricao, link: e.link })),
    ...radar.map((e) => ({ ref: 'radar:' + e.id, fonte: 'radar', nome: e.nome, data: e.data, hora: e.hora, cidade: e.cidade, local: e.local, distancias: (e.distancias || []).map((x) => String(x).replace('.', ',') + ' km'), modalidade: e.modalidade, status: e.status, preco: e.preco, obs: e.obs, link: e.link })),
  ].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.fonte === 'nexos' ? -1 : 1));
  const meus = S.staff ? await idsMeusAlunos() : null;
  S.cache.eventos = { t: Date.now(), eventos, part: (part || []).filter((p) => !meus || meus.has(p.aluno_id)) };
  return S.cache.eventos;
}
const TIPO_EV = { treinao: 'Treinão Nexos', prova: 'Prova da equipe', evento: 'Evento Nexos' };
function cartaoEvento(e, minhas, contagem) {
  const d = dia(e.data); const eu = minhas && minhas.find((p) => p.evento_ref === e.ref);
  return `<button class="ev-card ${e.fonte === 'nexos' ? 'nexos' : ''}" data-ev="${esc(e.ref)}">
    <div class="ev-data"><b>${d.getDate()}</b><span>${MES_CURTO[d.getMonth()]}</span></div>
    <div class="grow" style="min-width:0">
      ${e.fonte === 'nexos' ? `<span class="tag acc">${esc(TIPO_EV[e.tipo] || 'Nexos')}</span>` : ''}
      <b class="ev-nome">${esc(e.nome)}</b>
      <span class="small muted ellip">${[e.cidade, e.hora ? e.hora.replace(':00', 'h') : ''].filter(Boolean).map(esc).join(' · ')}</span>
      <div class="row" style="gap:5px;flex-wrap:wrap;margin-top:6px">${(e.distancias || []).slice(0, 4).map((x) => `<span class="pill">${esc(String(x))}</span>`).join('')}${e.status && /adiad|cancel|esgot|encerr/i.test(e.status) ? `<span class="tag warn">${esc(e.status)}</span>` : ''}${eu ? `<span class="tag ok">✓ você vai${eu.distancia ? ' · ' + esc(eu.distancia) : ''}</span>` : ''}${contagem ? `<span class="tag">${contagem} aluno${contagem > 1 ? 's' : ''}</span>` : ''}</div>
    </div>${I.chev}</button>`;
}
function detalheEvento(e, dados, aoMudar) {
  const eu = !S.staff && dados.part.find((p) => p.evento_ref === e.ref);
  const quem = S.staff ? dados.part.filter((p) => p.evento_ref === e.ref) : [];
  const dists = e.distancias || [];
  openSheet(`<p class="eyebrow">${e.fonte === 'nexos' ? esc(TIPO_EV[e.tipo] || 'Evento Nexos') : e.fonte === 'manual' ? 'Prova cadastrada por você' : 'Agenda do Radar Corridas MA'}</p>
    <div class="h2" style="margin-top:4px">${esc(e.nome)}</div>
    <p class="small muted" style="margin-top:6px">${fmtDiaSem(e.data)}${e.hora ? ' · ' + esc(e.hora) : ''} · ${faltam(e.data)}</p>
    <div class="ev-info">
      ${e.local ? `<div><span>Local</span><b>${esc(e.local)}${e.cidade && e.cidade !== e.local ? ' · ' + esc(e.cidade) : ''}</b></div>` : ''}
      ${dists.length ? `<div><span>Distâncias</span><b>${dists.map(esc).join(' · ')}</b></div>` : ''}
      ${e.preco ? `<div><span>Inscrição</span><b>${esc(e.preco)}${e.status ? ' · ' + esc(e.status) : ''}</b></div>` : e.status ? `<div><span>Inscrições</span><b>${esc(e.status)}</b></div>` : ''}
    </div>
    ${e.obs ? `<p class="small" style="margin-top:12px;white-space:pre-line">${esc(e.obs)}</p>` : ''}
    ${e.link ? `<a class="btn ghost block" href="${esc(e.link)}" target="_blank" rel="noopener" style="margin-top:16px">${e.fonte === 'radar' ? 'Fazer a inscrição no site oficial' : 'Abrir link do evento'} ↗</a>` : ''}
    ${S.staff ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2" style="font-size:1rem">Alunos que vão (${quem.length})</h2></div>${quem.length ? quem.map((p) => `<a class="list-item" href="#/aluno/${p.aluno_id}/corrida" style="color:inherit"><b class="grow">${esc((S.cache.nomes || {})[p.aluno_id] || 'Aluno')}</b>${p.distancia ? `<span class="pill">${esc(p.distancia)}</span>` : ''}${p.meta ? `<span class="tag">meta ${esc(p.meta)}</span>` : ''}</a>`).join('') : '<p class="small muted">Ninguém marcou ainda.</p>'}</div>
      ${e.fonte === 'nexos' ? '<button class="btn ghost block sm" id="ev-editar" style="margin-top:12px">Editar evento</button>' : ''}`
      : eu ? `<div class="card" style="margin-top:14px;border-color:rgba(14,154,95,.4)"><b>✓ Você vai${eu.distancia ? ' nos ' + esc(eu.distancia) : ''}</b>${eu.meta ? `<p class="small muted">Meta: ${esc(eu.meta)}</p>` : ''}<p class="small muted">A prova aparece na sua planilha e no calendário. ${faltam(e.data)}.</p></div><button class="link-btn small" id="ev-sair" style="margin-top:10px;color:var(--err)">Não vou mais</button>`
      : `<form id="ev-vou" class="card" style="margin-top:16px"><b>Vai participar?</b><p class="small muted" style="margin:4px 0 10px">${e.fonte === 'radar' ? 'Faça a inscrição no site oficial e marque aqui para a prova entrar na sua planilha.' : 'Confirme para o treinador saber quem vai.'}</p>
        ${dists.length ? `<div class="chips wrap" style="margin-bottom:10px">${dists.map((x, i) => `<label class="chipc"><input type="radio" name="dist" value="${esc(String(x))}" ${i === dists.length - 1 ? 'checked' : ''}><span>${esc(String(x))}</span></label>`).join('')}</div>` : ''}
        ${e.fonte === 'radar' ? '<label class="field"><span>Meta de tempo (opcional)</span><input class="input" name="meta" placeholder="Ex.: 55:00"></label>' : ''}
        <button class="btn block">${e.fonte === 'radar' ? 'Vou correr ✓' : 'Vou ✓'}</button></form>`}`, (r) => {
    const f = r.querySelector('#ev-vou');
    if (f) f.onsubmit = async (ev) => {
      ev.preventDefault(); const fd = new FormData(f);
      const { data: nova, error } = await sb.from('nx_participacoes').insert({ org_id: S.org.id, aluno_id: S.user.id, evento_ref: e.ref, fonte: e.fonte, titulo: e.nome, data: e.data, cidade: e.cidade || null, distancia: fd.get('dist') || null, meta: (fd.get('meta') || '').trim() || null, link: e.link || null }).select('id').single();
      if (error) return toast('Não foi possível confirmar.', true);
      notificar('prova', nova && nova.id);
      S.cache.eventos = null; closeSheet(); toast('Confirmado! A prova entrou no seu calendário.'); aoMudar();
    };
    const sair = r.querySelector('#ev-sair');
    if (sair) sair.onclick = async () => { await sb.from('nx_participacoes').delete().eq('id', eu.id); S.cache.eventos = null; closeSheet(); toast('Participação removida.'); aoMudar(); };
    const ed = r.querySelector('#ev-editar'); if (ed) ed.onclick = () => formEventoNexos(e.nexos, aoMudar);
  });
}
function formEventoNexos(ev, aoSalvar) {
  ev = ev || { tipo: 'treinao', data: hojeISO(), hora: '06:00' };
  openSheet(`<p class="eyebrow">${ev.id ? 'Editar evento' : 'Novo evento da Nexos'}</p><form id="f-ev" style="margin-top:12px">
    <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">${Object.entries(TIPO_EV).map(([k, l]) => `<button type="button" data-tipo="${k}" class="${ev.tipo === k ? 'on' : ''}">${l.replace(' Nexos', '').replace(' da equipe', '')}</button>`).join('')}</div>
    <label class="field"><span>Título</span><input class="input" name="titulo" value="${esc(ev.titulo || '')}" placeholder="Ex.: Treinão de domingo na Litorânea" required></label>
    <div class="grid2"><label class="field"><span>Data</span><input class="input" type="date" name="data" value="${esc(ev.data)}" required></label><label class="field"><span>Horário</span><input class="input" type="time" name="hora" value="${esc(ev.hora || '')}"></label></div>
    <label class="field"><span>Local</span><input class="input" name="local" value="${esc(ev.local || '')}" placeholder="Ex.: Espigão Costeiro, Ponta d'Areia"></label>
    <label class="field"><span>Distâncias (opcional)</span><input class="input" name="distancias" value="${esc(ev.distancias || '')}" placeholder="Ex.: 5 km, 10 km"></label>
    <label class="field"><span>Detalhes</span><textarea class="textarea" name="descricao" placeholder="Ex.: concentração 5h40, leve água e boné">${esc(ev.descricao || '')}</textarea></label>
    <label class="field"><span>Link (opcional)</span><input class="input" name="link" value="${esc(ev.link || '')}" placeholder="Inscrição, localização no mapa…"></label>
    <label class="aceite"><input type="checkbox" name="avisar" ${ev.id ? '' : 'checked'}><span>Avisar todos os alunos por notificação</span></label>
    <button class="btn block">Salvar evento</button>${ev.id ? '<button type="button" class="link-btn small" id="ev-del" style="margin-top:10px;color:var(--err)">Excluir evento</button>' : ''}</form>`, (r) => {
    let tipo = ev.tipo;
    r.querySelectorAll('[data-tipo]').forEach((b) => b.onclick = () => { tipo = b.dataset.tipo; r.querySelectorAll('[data-tipo]').forEach((x) => x.classList.toggle('on', x === b)); });
    const f = r.querySelector('#f-ev');
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f); const g = (k) => String(fd.get(k) || '').trim() || null;
      const row = { tipo, titulo: g('titulo'), data: g('data'), hora: g('hora'), local: g('local'), distancias: g('distancias'), descricao: g('descricao'), link: g('link') };
      const q = ev.id ? await sb.from('nx_eventos').update(row).eq('id', ev.id).select('id').single() : await sb.from('nx_eventos').insert({ ...row, org_id: S.org.id, criado_por: S.user.id }).select('id').single();
      if (q.error) return toast('Não foi possível salvar.', true);
      if (fd.get('avisar')) notificar('evento', (q.data && q.data.id) || ev.id);
      S.cache.eventos = null; closeSheet(); toast('Evento salvo!'); aoSalvar();
    };
    const del = r.querySelector('#ev-del');
    if (del) del.onclick = async () => { if (!confirm('Excluir este evento?')) return; await sb.from('nx_eventos').delete().eq('id', ev.id); S.cache.eventos = null; closeSheet(); toast('Evento excluído.'); aoSalvar(); };
  });
}
async function viewEventos(aba) {
  loading();
  const st = S.cache.evSt || (S.cache.evSt = { filtro: 'slz', q: '', max: 20 });
  aba = aba === 'minhas' || aba === 'equipe' ? aba : 'proximas';
  const dados = await carregarEventos();
  if (S.staff && !S.cache.nomes) { const { data } = await sb.from('nx_membros').select('user_id,nome').eq('org_id', S.org.id); S.cache.nomes = Object.fromEntries((data || []).map((m) => [m.user_id, m.nome])); }
  const abas = S.staff ? [['proximas', 'Agenda'], ['equipe', 'Equipe nas provas']] : [['proximas', 'Próximas provas'], ['minhas', `Minhas provas${dados.part.filter((p) => p.data >= hojeISO()).length ? ' (' + dados.part.filter((p) => p.data >= hojeISO()).length + ')' : ''}`]];
  const cont = {}; if (S.staff) dados.part.forEach((p) => { cont[p.evento_ref] = (cont[p.evento_ref] || 0) + 1; });
  let corpo = '';
  if (aba === 'proximas') {
    const nq = semAcento(st.q); const hj = hojeISO();
    const bate = (e) => !nq || semAcento(e.nome + ' ' + (e.cidade || '') + ' ' + (e.local || '')).includes(nq);
    const daNexos = dados.eventos.filter((e) => e.fonte === 'nexos' && e.data >= hj && bate(e));
    const todas = dados.eventos.filter((e) => e.fonte === 'radar' && e.data >= hj && bate(e) && (st.filtro === 'todas' || (st.filtro === 'slz' ? /s[aã]o lu[ií]s|ribamar|pa[cç]o do lumiar|raposa|alc[aâ]ntara/i.test(e.cidade || '') : /trail/i.test(e.modalidade || ''))));
    const lista = todas.slice(0, st.max);
    const meses = {}; lista.forEach((e) => { const k = e.data.slice(0, 7); (meses[k] = meses[k] || []).push(e); });
    corpo = `<div class="search">${I.search}<input class="input" id="ev-q" placeholder="Buscar prova ou cidade" value="${esc(st.q)}"></div>
      ${daNexos.length ? `<p class="mes-rot">Da equipe Nexos</p><div class="stack">${daNexos.map((e) => cartaoEvento(e, S.staff ? null : dados.part, cont[e.ref])).join('')}</div>` : ''}
      <div class="row between" style="margin-top:18px;gap:10px;flex-wrap:wrap"><p class="mes-rot" style="margin:0">Provas no Maranhão</p></div>
      <div class="chips" id="ev-f" style="margin-top:8px">${[['slz', 'Grande São Luís'], ['todas', 'Todo o Maranhão'], ['trail', 'Trail']].map(([k, l]) => `<button class="chip ${st.filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div id="ev-l">${Object.entries(meses).map(([k, l]) => `<p class="mes-rot">${nomeMes(k)}</p><div class="stack">${l.map((e) => cartaoEvento(e, S.staff ? null : dados.part, cont[e.ref])).join('')}</div>`).join('') || '<div class="empty" style="margin-top:16px"><div class="h3">Nenhuma prova encontrada</div><p class="small">Tente outro filtro.</p></div>'}
      ${todas.length > lista.length ? `<button class="btn ghost block" id="ev-mais" style="margin-top:16px">Ver mais provas (${todas.length - lista.length})</button>` : ''}</div>
      <p class="tiny dim" style="margin-top:16px">Agenda de provas do Maranhão pelo <b>Radar Corridas MA</b>. A inscrição é feita no site oficial de cada prova.</p>`;
  } else if (aba === 'minhas') {
    const fut = dados.part.filter((p) => p.data >= hojeISO()), pas = dados.part.filter((p) => p.data < hojeISO()).reverse();
    const linha = (p) => `<button class="ev-card" data-part="${p.id}"><div class="ev-data"><b>${dia(p.data).getDate()}</b><span>${MES_CURTO[dia(p.data).getMonth()]}</span></div><div class="grow" style="min-width:0"><b class="ev-nome">${esc(p.titulo)}</b><span class="small muted">${[p.distancia, p.cidade].filter(Boolean).map(esc).join(' · ')}</span><span class="small" style="color:var(--acc);font-weight:700">${faltam(p.data)}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span></div>${I.chev}</button>`;
    corpo = fut.length ? `<div class="stack">${fut.map(linha).join('')}</div>` : `<div class="empty"><div class="h3">Nenhuma prova marcada</div><p class="small">Veja as próximas provas e toque em “Vou correr”.</p><a class="btn sm" href="#/eventos" style="margin-top:12px">Ver próximas provas</a></div>`;
    if (pas.length) corpo += `<div class="section"><div class="section-h"><h2 class="h2">Provas que você já correu</h2>${slashes}</div><div class="stack">${pas.map(linha).join('')}</div></div>`;
  } else {
    const fut = dados.part.filter((p) => p.data >= hojeISO());
    const porEv = {}; fut.forEach((p) => { (porEv[p.evento_ref] = porEv[p.evento_ref] || { p, l: [] }).l.push(p); });
    corpo = Object.values(porEv).length ? `<div class="stack">${Object.values(porEv).map(({ p, l }) => `<div class="card"><div class="row between" style="gap:10px;align-items:flex-start"><div><b>${esc(p.titulo)}</b><div class="small muted">${fmtDiaSem(p.data)} · ${faltam(p.data)}</div></div><span class="tag acc">${l.length} aluno${l.length > 1 ? 's' : ''}</span></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">${l.map((x) => `<a class="pill" href="#/aluno/${x.aluno_id}/corrida">${esc(firstName((S.cache.nomes || {})[x.aluno_id] || 'Aluno'))}${x.distancia ? ' · ' + esc(x.distancia) : ''}</a>`).join('')}</div></div>`).join('')}</div>`
      : '<div class="empty"><div class="h3">Nenhum aluno marcou prova ainda</div><p class="small">Quando os alunos marcarem “Vou correr”, aparece aqui.</p></div>';
  }
  $app.innerHTML = `<p class="eyebrow">Eventos</p><h1 class="h1">${S.staff ? 'Provas e eventos' : 'Provas e eventos'}</h1>
    <div class="subtabs" style="margin-top:16px">${abas.map(([k, l]) => `<a class="${aba === k ? 'on' : ''}" href="#/eventos${k === 'proximas' ? '' : '/' + k}">${l}</a>`).join('')}</div>
    ${S.staff ? `<button class="btn sm" id="ev-novo" style="margin-bottom:12px">${I.plus} Treinão ou evento da Nexos</button>` : `<button class="card tap prova-fora" id="ev-minha"><span class="go">${I.plus}</span><div class="grow"><b>A prova que vou correr não está aqui</b><div class="small muted">Cadastre a sua prova e ela entra na sua planilha</div></div>${I.chev}</button>`}
    ${corpo}`;
  const re = () => viewEventos(aba);
  const q = document.getElementById('ev-q');
  if (q) { q.oninput = () => { st.q = q.value; clearTimeout(st.t); st.t = setTimeout(() => { viewEventos(aba).then(() => { const n = document.getElementById('ev-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 250); }; }
  const ff = document.getElementById('ev-f'); if (ff) ff.onclick = (e) => { const b = e.target.closest('[data-f]'); if (b) { st.filtro = b.dataset.f; st.max = 20; re(); } };
  const vm = document.getElementById('ev-mais'); if (vm) vm.onclick = async () => { const y = scrollY; st.max += 20; await re(); scrollTo(0, y); };
  $app.onclick = (e) => {
    const c = e.target.closest('[data-ev]'); if (c) return detalheEvento(dados.eventos.find((x) => x.ref === c.dataset.ev), dados, re);
    const p = e.target.closest('[data-part]');
    if (p) { const pp = dados.part.find((x) => x.id === p.dataset.part); const ev = dados.eventos.find((x) => x.ref === pp.evento_ref) || { ref: pp.evento_ref, fonte: pp.fonte, nome: pp.titulo, data: pp.data, cidade: pp.cidade, distancias: pp.distancia ? [pp.distancia] : [], link: pp.link }; return detalheEvento(ev, dados, re); }
  };
  const nv = document.getElementById('ev-novo'); if (nv) nv.onclick = () => formEventoNexos(null, re);
  const mp = document.getElementById('ev-minha'); if (mp) mp.onclick = () => formProvaPropria(() => { location.hash = '#/eventos/minhas'; if (aba === 'minhas') re(); });
}
function formProvaPropria(aoSalvar) {
  const DIST = ['5 km', '10 km', '21 km', '42 km'];
  openSheet(`<p class="eyebrow">Minha prova</p><div class="h2" style="margin-top:4px">Cadastrar uma prova</div><p class="small muted" style="margin-top:4px">Para provas fora do Maranhão ou que ainda não estão na agenda. O treinador é avisado e a prova entra na sua planilha.</p>
    <form id="f-pp" style="margin-top:16px">
      <label class="field"><span>Nome da prova *</span><input class="input" name="titulo" required placeholder="Ex.: Maratona do Rio"></label>
      <div class="grid2"><label class="field"><span>Data *</span><input class="input" type="date" name="data" required min="${hojeISO()}"></label><label class="field"><span>Cidade</span><input class="input" name="cidade" placeholder="Ex.: Rio de Janeiro"></label></div>
      <div class="field"><span>Distância</span><div class="chips wrap">${DIST.map((d) => `<label class="chipc"><input type="radio" name="dist" value="${d}"><span>${d}</span></label>`).join('')}<label class="chipc"><input type="radio" name="dist" value="outra"><span>Outra</span></label></div></div>
      <label class="field" id="pp-outra" hidden><span>Qual distância?</span><input class="input" name="dist_outra" placeholder="Ex.: 15 km, trail 25 km"></label>
      <div class="grid2"><label class="field"><span>Meta de tempo</span><input class="input" name="meta" placeholder="Ex.: 55:00"></label><label class="field"><span>Site da prova</span><input class="input" name="link" inputmode="url" placeholder="opcional"></label></div>
      <button class="btn block" type="submit">Salvar minha prova</button></form>`, (r) => {
    const f = r.querySelector('#f-pp');
    f.onchange = (e) => { if (e.target.name === 'dist') r.querySelector('#pp-outra').hidden = e.target.value !== 'outra'; };
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f); const btn = f.querySelector('[type=submit]');
      const titulo = String(fd.get('titulo') || '').trim(); const data = fd.get('data');
      if (titulo.length < 3) return toast('Escreva o nome da prova.', true);
      if (!data) return toast('Escolha a data da prova.', true);
      let dist = fd.get('dist') || ''; if (dist === 'outra') dist = String(fd.get('dist_outra') || '').trim();
      let link = String(fd.get('link') || '').trim(); if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
      btn.disabled = true;
      const { data: nova, error } = await sb.from('nx_participacoes').insert({ org_id: S.org.id, aluno_id: S.user.id, evento_ref: 'manual-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), fonte: 'manual', titulo: titulo.slice(0, 140), data, cidade: String(fd.get('cidade') || '').trim() || null, distancia: dist || null, meta: String(fd.get('meta') || '').trim() || null, link: link || null }).select('id').single();
      if (error) { btn.disabled = false; return toast('Não foi possível salvar.', true); }
      notificar('prova', nova && nova.id);
      S.cache.eventos = null; closeSheet(); toast('Prova salva! Ela já está na sua planilha.'); aoSalvar && aoSalvar();
    };
  });
}

/* ================= PLANILHA DO ALUNO: corrida, musculação e calendário ================= */
async function viewPlanilhaAluno(aba) {
  // quem faz corrida e força vê uma planilha só: a semana com os dois juntos e, embaixo, os treinos de força
  if (faz('corrida') && faz('musculacao')) {
    const mes = aba === 'calendario';
    $app.innerHTML = `<p class="eyebrow">Planilha</p><div class="row" style="justify-content:space-between;align-items:flex-end;gap:10px"><h1 class="h1">Seus treinos</h1><a class="btn ghost sm" href="#/planilha${mes ? '' : '/calendario'}">${mes ? 'Ver a semana' : `${I.cal} Ver o mês`}</a></div>
      ${mes ? '' : '<p class="small muted" style="margin-top:6px">Corrida e força na mesma planilha.</p>'}<div id="pl-c" style="margin-top:12px"></div><div id="pl-f"></div>`;
    const box = document.getElementById('pl-c');
    if (mes) return viewCalendarioMes(S.user.id, box);
    await viewCorridaPainel(S.user.id, box, false, S.me, ['planilha']);
    return planilhaForcaAluno(document.getElementById('pl-f'), true);
  }
  const abasP = [['corrida', 'Corrida'], ['musculacao', 'Musculação'], ['calendario', 'Calendário']].filter(([k]) => k === 'calendario' || faz(k));
  aba = abasP.some(([k]) => k === aba) ? aba : abasP[0][0];
  $app.innerHTML = `<p class="eyebrow">Planilha</p><h1 class="h1">Seus treinos</h1>
    <div class="subtabs" style="margin-top:16px">${abasP.map(([k, l]) => `<a class="${aba === k ? 'on' : ''}" href="#/planilha/${k}">${l}</a>`).join('')}</div><div id="pl-c"></div>`;
  const box = document.getElementById('pl-c');
  if (aba === 'corrida') return viewCorridaPainel(S.user.id, box, false, S.me, ['planilha']);
  if (aba === 'musculacao') return planilhaForcaAluno(box, false);
  return viewCalendarioMes(S.user.id, box);
}
// treinos de força do aluno; soLista = sem a grade da semana (na planilha única a força já aparece em cada dia)
async function planilhaForcaAluno(box, soLista) {
  {
    const [treinos, sessoes] = await Promise.all([buscarTreinosDoAluno(S.user.id), buscarSessoes(S.user.id, 200)]);
    const ativos = treinos.filter((t) => t.ativo);
    const hj = dsemIdx(hojeISO()); const seq = ativos.filter((t) => !(t.dias && t.dias.length));
    const prox = ativos.find((t) => (t.dias || []).includes(hj)) || null;
    // semana de força do aluno (mesma visão do treinador, só leitura)
    const fs = S.cache.fsemA || (S.cache.fsemA = { off: 0 }); const iniF = inicioSemana(); iniF.setDate(iniF.getDate() + fs.off * 7);
    const diasF = Array.from({ length: 7 }, (_, i) => { const d = new Date(iniF); d.setDate(iniF.getDate() + i); return isoDia(d); });
    const hojeF = hojeISO(); const temDias = ativos.some((t) => t.dias && t.dias.length);
    const libA = await sb.from('nx_forca_semanas').select('id').eq('aluno_id', S.user.id).eq('semana', diasF[0]).maybeSingle().then((r) => !!r.data).catch(() => false);
    const offF = libA ? (dispDe(S.me).off_forca || []) : [];
    const semanaF = `<div class="pl-top" style="margin-top:4px"><div class="row" style="gap:6px"><button class="icon-btn sm" id="fa-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="fa-h">${fs.off === 0 ? 'Esta semana' : fs.off === -1 ? 'Semana passada' : fs.off === 1 ? 'Próxima semana' : `${dia(diasF[0]).getDate()}/${dia(diasF[0]).getMonth() + 1} a ${dia(diasF[6]).getDate()}/${dia(diasF[6]).getMonth() + 1}`}</button><button class="icon-btn sm" id="fa-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>
        <span class="small muted">${sessoes.filter((x) => isoDia(x.iniciado_em) >= diasF[0] && isoDia(x.iniciado_em) <= diasF[6]).length} treino(s) feitos</span></div>
      ${temDias && !libA ? '<div class="lib-bar"><span>Seu treinador ainda não liberou esta semana de força.</span></div>' : ''}
      <div class="fsem">${diasF.map((k, i) => { const doDia = libA ? ativos.filter((t) => (t.dias || []).includes(i)) : []; const feitos = sessoes.filter((x) => isoDia(x.iniciado_em) === k);
        return `<div class="fdia ${k === hojeF ? 'hoje' : ''} ${k < hojeF ? 'passado' : ''}"><div class="fdia-h"><b class="fdia-n">${dia(k).getDate()}</b><span>${DSEM[i]}</span></div>
          <div class="fdia-c">${doDia.map((t) => { const ok = feitos.find((x) => x.treino_id === t.id); return `<a class="ftr ${ok ? 'feito' : k < hojeF ? 'perdeu' : ''}" href="#/treino/${t.id}" style="color:inherit"><span class="grow" style="min-width:0">${ok ? `<span class="ses-conc fo"><i>${I.check}</i>Treino concluído</span>` : ''}<b class="ellip" style="display:block">${esc(t.titulo)}</b><small>${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios${ok ? '' : k < hojeF ? ' · não feito' : ''}</small></span>${!ok && k >= hojeF ? `<span class="add-ic">${I.play}</span>` : ''}</a>`; }).join('')}
          ${feitos.filter((x) => !doDia.some((t) => t.id === x.treino_id)).map((x) => `<div class="ftr feito extra"><span class="grow"><span class="ses-conc fo"><i>${I.check}</i>Treino extra</span><b>${esc(x.treino_titulo || 'Treino')}</b></span></div>`).join('')}
          ${offF.includes(i) ? `<div class="ftr folga"><span class="off-ic">${OFF_IC}</span><span class="grow"><b>Day off</b><small>Descanso de força</small></span></div>` : ''}
          ${!doDia.length && !feitos.length && !offF.includes(i) ? `<span class="cal-vazio">${temDias ? 'sem treino' : 'treino na sequência abaixo'}</span>` : ''}</div></div>`; }).join('')}</div>
      ${seq.length && temDias ? `<p class="small muted" style="margin-top:8px">Sem dia fixo (faça na sequência): ${seq.map((t) => `<b>${esc(t.titulo)}</b>`).join(', ')}.</p>` : ''}`;
    box.innerHTML = ativos.length ? (soLista ? '' : semanaF) + `<div class="section"><div class="section-h"><h2 class="h2">${soLista ? 'Seus treinos de força' : 'Seus treinos'}</h2>${slashes}</div><div class="stack">${ativos.map((t, i) => { const ex = sessoes.filter((s) => s.treino_id === t.id); return `<div class="card tr-card ${prox && prox.id === t.id ? 'prox' : ''}"><div class="row" style="gap:12px;align-items:flex-start"><div class="wletter sm">${esc(letraTreino(t, i))}</div>
      <div class="grow">${prox && prox.id === t.id ? `<span class="eyebrow">${(t.dias || []).includes(hj) ? 'Treino de hoje' : 'Próximo da sequência'}</span>` : ''}<div class="h3" style="margin-top:2px">${esc(t.titulo)}</div><div class="small muted">${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios</div>${t.dias && t.dias.length ? `<span class="tag acc" style="margin-top:4px">${diasTxt(t.dias)}</span>` : ''}</div></div>
      <p class="small" style="margin:10px 0 0;color:var(--acc)">${ex.length ? `Você fez ${ex.length} ${ex.length === 1 ? 'vez' : 'vezes'}, a última em ${fmtData(ex[0].iniciado_em)}` : 'Você ainda não fez este treino'}</p>
      <div class="grid2 tr-acoes"><a class="btn sm" href="#/treino/${t.id}">${I.play} Começar</a><a class="btn ghost sm" href="#/historico/cargas">${I.hist} Evolução</a></div></div>`; }).join('')}</div></div>`
      : (soLista ? '<div class="section"><div class="section-h"><h2 class="h2">Seus treinos de força</h2>' + slashes + '</div><div class="empty"><div class="h3">Seu treino de musculação está sendo preparado</div><p class="small">Assim que o treinador liberar, ele aparece aqui.</p></div></div>' : '<div class="empty"><div class="h3">Seu treino de musculação está sendo preparado</div><p class="small">Assim que o treinador liberar, ele aparece aqui.</p></div>');
    const reF = () => planilhaForcaAluno(box, soLista);
    const fa = (id, f) => { const el = document.getElementById(id); if (el) el.onclick = () => { f(); reF(); }; };
    fa('fa-a', () => fs.off--); fa('fa-p', () => fs.off++); fa('fa-h', () => { fs.off = 0; });
  }
}
async function viewCalendarioMes(alunoId, box) {
  const st = S.cache.calMes || (S.cache.calMes = { comp: compDe() });
  const [y, m] = st.comp.split('-').map(Number);
  const ini = new Date(y, m - 1, 1, 12), fim = new Date(y, m, 0, 12);
  const de = isoDia(ini), ate = isoDia(fim);
  const [plano, corrs, sess, provas] = await Promise.all([
    buscarPlano(alunoId, de, ate),
    sb.from('nx_corridas').select('id,data,tipo,distancia_m,duracao_s,plano_id,fc_media').eq('aluno_id', alunoId).gte('data', de).lte('data', ate + 'T23:59:59').then((r) => r.data || []),
    sb.from('nx_sessoes').select('id,iniciado_em,treino_titulo').eq('aluno_id', alunoId).not('finalizado_em', 'is', null).gte('iniciado_em', de).lte('iniciado_em', ate + 'T23:59:59').then((r) => r.data || []),
    sb.from('nx_participacoes').select('*').eq('aluno_id', alunoId).gte('data', de).lte('data', ate).then((r) => r.data || []),
  ]);
  const perfil = perfilCorrida(S.staff ? {} : S.me);
  const hoje = hojeISO(); const off = (ini.getDay() + 6) % 7; const nd = fim.getDate();
  const doDia = (k) => ({ pl: plano.filter((p) => p.data === k), co: corrs.filter((c) => ehCorr(c) && isoDia(c.data) === k), ou: corrs.filter((c) => !ehCorr(c) && isoDia(c.data) === k), se: sess.filter((s) => isoDia(s.iniciado_em) === k), pr: provas.filter((p) => p.data === k) });
  let cells = '';
  for (let i = 0; i < off; i++) cells += '<div class="cm-d vazio"></div>';
  for (let d = 1; d <= nd; d++) {
    const k = `${st.comp}-${String(d).padStart(2, '0')}`; const x = doDia(k);
    const corPl = x.pl.map((p) => { if (p.tipo === 'forca') return 'var(--fpc-ac)'; const z = achatar(estruturaDe(p), perfil).filter((s) => s.k === 'co').sort((a, b) => b.seg - a.seg)[0]; return (ZONAS_INFO[(z && z.z) || 'leve'] || ZONAS_INFO.leve).c; });
    const lbl = [...x.pr.map((p) => `<i class="cm-t pr">${icT(I.flag)}${esc(p.titulo)}</i>`), ...x.pl.map((p, j) => `<i class="cm-t ${x.co.some((c) => c.plano_id === p.id) ? 'ok' : ''}" style="--c:${corPl[j]}">${esc(p.titulo || nomeTipo(p.tipo))}</i>`), ...x.co.filter((c) => !c.plano_id).map((c) => `<i class="cm-t ok" style="--c:var(--ok)">${f1(c.distancia_m / 1000)} km</i>`), ...x.se.map((s2) => `<i class="cm-t tmu">${esc(s2.treino_titulo || 'Musculação')}</i>`)].join('');
    cells += `<button class="cm-d ${k === hoje ? 'hoje' : ''} ${k < hoje ? 'passado' : ''} ${x.co.length ? 'co-ok' : ''} ${x.se.length || x.ou.some((c) => c.tipo === 'forca') ? 'fo-ok' : ''}" data-k="${k}"><span>${d}</span>${x.co.length || x.se.length || x.ou.length ? `<div class="cm-faixas">${x.co.length ? '<i class="fx-co"></i>' : ''}${x.se.length || x.ou.some((c) => c.tipo === 'forca') ? '<i class="fx-fo"></i>' : ''}${x.ou.some((c) => c.tipo !== 'forca') ? '<i class="fx-ou"></i>' : ''}</div>` : ''}<div class="cm-txt">${lbl}</div><div class="cm-ic">${x.pr.length ? `<i class="pr">${icT(I.flag)}</i>` : ''}${x.pl.map((p, j) => `<i class="dot ${x.co.some((c) => c.plano_id === p.id) ? 'ok' : ''}" style="--c:${corPl[j]}"></i>`).join('')}${x.co.filter((c) => !c.plano_id).map(() => '<i class="dot ok" style="--c:var(--ok)"></i>').join('')}${x.se.length ? '<i class="mu"></i>' : ''}</div></button>`;
  }
  const totKm = plano.reduce((a, p) => a + resumoEstrutura(estruturaDe(p), perfil).km, 0), feitoKm = corrs.reduce((a, c) => a + c.distancia_m / 1000, 0);
  box.innerHTML = `<div class="mes-nav" style="margin-top:4px"><button class="icon-btn sm" id="cm-a" aria-label="Mês anterior">${I.back}</button><b>${nomeMes(st.comp)}</b><button class="icon-btn sm" id="cm-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
    <p class="small muted center">${totKm ? `previsto ${f1(totKm)} km · ` : ''}feito ${f1(feitoKm)} km${sess.length ? ` · ${sess.length} treino${sess.length > 1 ? 's' : ''} de musculação` : ''}</p>
    <div class="cal-mes"><div class="cm-sem">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((x) => `<span>${x}</span>`).join('')}</div><div class="cm-grade">${cells}</div></div>
    <div class="cm-leg"><span><i class="dot" style="--c:var(--acc)"></i>corrida planejada</span><span><i class="lg-co"></i>corrida concluída</span><span><i class="lg-fo"></i>força concluída</span><span><i class="lg-ou"></i>outras atividades</span><span>${icT(I.flag, 'pr')}prova</span></div>
    ${provas.length ? `<div class="section"><div class="section-h"><h2 class="h2">Provas do mês</h2>${slashes}</div><div class="stack">${provas.map((p) => `<a class="list-item" href="#/eventos/minhas" style="color:inherit"><span class="li-ic pr">${I.flag}</span><div class="grow"><b>${esc(p.titulo)}</b><div class="small muted">${fmtData(p.data + 'T12:00:00')}${p.distancia ? ' · ' + esc(p.distancia) : ''} · ${faltam(p.data)}</div></div>${I.chev}</a>`).join('')}</div></div>` : ''}`;
  box.querySelector('#cm-a').onclick = () => { st.comp = somaMes(st.comp, -1); viewCalendarioMes(alunoId, box); };
  box.querySelector('#cm-p').onclick = () => { st.comp = somaMes(st.comp, 1); viewCalendarioMes(alunoId, box); };
  box.querySelector('.cm-grade').onclick = (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; const x = doDia(k);
    if (!x.pl.length && !x.co.length && !x.se.length && !x.pr.length && !x.ou.length) return toast('Dia livre: descanso.');
    openSheet(`<p class="eyebrow">${fmtDiaSem(k)}</p><div class="stack" style="margin-top:12px">
      ${x.pr.map((p) => `<a class="list-item" href="#/eventos/minhas" style="color:inherit"><span class="li-ic pr">${I.flag}</span><div class="grow"><b>${esc(p.titulo)}</b><div class="small muted">${esc(p.distancia || '')} ${p.meta ? '· meta ' + esc(p.meta) : ''}</div></div></a>`).join('')}
      ${x.pl.map((p) => cartaoSessao(p, perfil, x.co.find((c) => c.plano_id === p.id), false)).join('')}
      ${x.co.filter((c) => !c.plano_id).map((c) => `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><span class="ativ-ic">${icCorr(S.staff ? null : S.me)}</span><div class="grow"><b>Corrida · ${fmtKm(c.distancia_m, 1)}</b><div class="small muted">${fmtPace(paceDe(c))}</div></div>${I.chev}</a>`).join('')}
      ${x.ou.map((c) => `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><span class="ativ-ic">${c.tipo === 'forca' ? HALTER_S : I.watch}</span><div class="grow"><b>${esc(nomeAtiv(c))}</b><div class="small muted">${resumoAtiv(c)} · do relógio</div></div>${I.chev}</a>`).join('')}
      ${x.se.map((s) => `<div class="list-item"><span class="ativ-ic">${I.lib}</span><div class="grow"><b>${esc(s.treino_titulo || 'Musculação')}</b><div class="small muted">feito às ${fmtHora(s.iniciado_em)}</div></div></div>`).join('')}</div>`, (r) => {
      r.querySelectorAll('[data-ses]').forEach((el) => el.onclick = () => { const p = x.pl.find((q) => q.id === el.dataset.ses); verTreinoPlanilha(p, perfil, x.co.find((c) => c.plano_id === p.id)); });
    });
  };
}


/* ================= ALUNO ================= */
async function buscarTreinosDoAluno(alunoId) {
  const { data, error } = await sb.from('nx_treinos').select('id,titulo,foco,observacoes,ordem,ativo,atualizado_em,dias,nx_treino_itens(id)').eq('aluno_id', alunoId).eq('org_id', S.org.id).order('ordem').order('criado_em');
  if (error) throw error; return data || [];
}
async function buscarSessoes(alunoId, limit = 60) {
  let q = sb.from('nx_sessoes').select('*').eq('org_id', S.org.id).not('finalizado_em', 'is', null).order('iniciado_em', { ascending: false }).limit(limit);
  if (alunoId) q = q.eq('aluno_id', alunoId);
  const { data, error } = await q; if (error) throw error; return data || [];
}
function letraTreino(t, i) {
  const m = String(t.titulo || '').match(/\b([A-Z])\b/); return m ? m[1] : String.fromCharCode(65 + (i % 26));
}

async function alunoHoje() {
  loading();
  const hoje = isoDia(new Date());
  const [treinos, sessoes, , planoSem, cobP, corrSem, provaProx, semNota] = await Promise.all([
    buscarTreinosDoAluno(S.user.id), buscarSessoes(S.user.id, 40), contarMsgNovas(),
    buscarPlano(S.user.id, hoje, isoDia(Date.now() + 13 * 864e5)).catch(() => []), minhaCobrancaPendente().catch(() => null),
    sb.from('nx_corridas').select('id,data,tipo,distancia_m,duracao_s,plano_id,titulo,elevacao_m,fc_media,cadencia,rota').eq('aluno_id', S.user.id).gte('data', isoDia(Date.now() - 8 * 864e5)).then((r) => (r.data || []).filter(ehCorr)).catch(() => []),
    sb.from('nx_participacoes').select('*').eq('aluno_id', S.user.id).gte('data', hoje).order('data').limit(1).then((r) => (r.data || [])[0] || null).catch(() => null),
    // corridas que chegaram do relógio sem o check-in (esforço/dor)
    sb.from('nx_corridas').select('id,data,tipo,distancia_m,duracao_s,fonte,titulo,comentario').eq('aluno_id', S.user.id).is('rpe', null).gte('data', isoDia(Date.now() - 3 * 864e5)).order('data', { ascending: false }).limit(1).then((r) => (r.data || [])[0] || null).catch(() => null),
  ]);
  const corrNova = corrSem.filter((c) => c.distancia_m && Date.now() - new Date(c.data) < 864e5 && !(() => { try { return localStorage.getItem('nx-card-' + c.id); } catch { return 1; } })()).sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  corrSem.splice(0, corrSem.length, ...corrSem.filter((c) => isoDia(c.data) >= isoDia(inicioSemana())));
  const corrHoje = corrSem.filter((c) => isoDia(c.data) === hoje);
  const perfC = perfilCorrida(S.me);
  dockAluno();
  const ativos = treinos.filter((t) => t.ativo);
  const ativSem = [...sessoes, ...corrSem.map((c) => ({ iniciado_em: c.data }))];
  let prox = null;
  const forcaLib = await sb.from('nx_forca_semanas').select('id').eq('aluno_id', S.user.id).eq('semana', isoDia(inicioSemana())).maybeSingle().then((r) => !!r.data).catch(() => false);
  const doDiaM = forcaLib ? ativos.filter((t) => (t.dias || []).includes(dsemIdx(hoje))) : [];
  let fixoHoje = false;
  if (doDiaM.length) { prox = doDiaM.find((t) => !sessoes.some((s) => s.treino_id === t.id && isoDia(s.iniciado_em) === hoje)) || doDiaM[0]; fixoHoje = true; }
  // só mostra musculação no Hoje quando há treino marcado para este dia (sem “próximo da sequência”)
  const fC = faz('corrida'), fM = faz('musculacao');
  if (!fM) prox = null;
  const muscHoje = sessoes.find((s) => isoDia(s.iniciado_em) === hoje);
  const offCorr = fC && planoSem.some((p) => p.data === hoje && p.tipo === 'folga');
  const offForca = fM && forcaLib && (dispDe(S.me).off_forca || []).includes(dsemIdx(hoje));
  if (offForca) prox = null;
  const corrDoDia = fC ? planoSem.filter((p) => p.data === hoje && !semCorrida(p)) : [];
  const forcaHoje = fC ? planoSem.find((p) => p.data === hoje && p.tipo === 'forca') : null;
  const proxCorr = fC ? planoSem.find((p) => p.data > hoje && !semCorrida(p)) : null;
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const cardCorr = (p) => {
    const feito = corrHoje.find((c) => c.plano_id === p.id); const est = estruturaDe(p);
    return `<div class="card corr-home ${feito ? 'feito' : ''}"><div class="row between" style="gap:8px"><span class="eyebrow">${icCorr(S.me)} Corrida</span>${feito ? '<span class="tag ok">✓ feita</span>' : ''}</div>
      <div class="h3" style="margin-top:4px">${esc(p.titulo || nomeTipo(p.tipo))}</div>
      <div style="margin:8px 0 6px">${perfilHTML(est, perfC, true)}</div>
      ${est.length ? (() => { const t = estimaTotal(est, perfC); return `<div class="kv-t"><div><span>Tipo</span><b>${esc(nomeTipo(p.tipo))}</b></div><div><span>Distância</span><b>${t.soDist ? '' : '≈ '}${t.km.replace('–', ' a ')}</b></div><div><span>Duração</span><b>${(() => { const tt = estimaTotalSeg(est, perfC); return tt[0] === tt[1] ? tempoAsp(tt[0]) : `${tempoAsp(tt[0])} a ${tempoAsp(tt[1])}`; })()}</b></div></div>
      <ul class="linhas-t">${linhasTreino(est, perfC)}</ul>`; })() : ''}
      ${p.descricao ? `<p class="obs-t"><b>Obs. do treinador:</b> ${esc(p.descricao)}</p>` : ''}
      <div class="row" style="gap:8px;margin-top:12px">${feito ? `<a class="btn ghost sm" href="#/corrida/${feito.id}">Ver minha corrida</a>` : `<button class="btn sm" data-reg="${p.id}">${I.plus} Registrar corrida</button>`}<button class="btn ghost sm" data-ver="${p.id}">Ver passos</button></div></div>`;
  };
  const cardMusc = prox ? (muscHoje
    ? `<div class="card wcard feito" style="display:flex"><div class="wletter">✓</div><div class="grow"><span class="eyebrow">Musculação</span><div class="h3" style="margin-top:2px">${esc(muscHoje.treino_titulo || 'Treino')} feito</div><div class="small muted">${fixoHoje ? 'Bom trabalho! Treino do dia concluído.' : 'Próximo da sequência: ' + esc(prox.titulo)}</div></div></div>`
    : `<a class="card tap wcard" href="#/treino/${prox.id}" style="display:flex"><div class="wletter">${esc(letraTreino(prox, ativos.indexOf(prox)))}</div><div class="grow"><span class="eyebrow">Musculação · ${fixoHoje ? 'treino de hoje' : 'próximo da sequência'}</span><div class="h3" style="margin-top:2px">${esc(prox.titulo)}</div>${prox.foco ? `<div class="small muted">${esc(prox.foco)}</div>` : ''}<div class="meta"><span class="tag">${prox.nx_treino_itens.length} exercícios</span></div></div><span class="go">${I.play}</span></a>`) : '';
  const descanso = !corrDoDia.length && !cardMusc && !forcaHoje;
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""></div><a class="perfil-btn" href="#/perfil">${I.user}<span>Editar perfil</span></a></div>
    <div class="saud-row"><a class="top-foto" href="#/perfil" aria-label="Meu perfil" title="Meu perfil">${fotoHTML(S.me)}</a><div style="min-width:0"><p class="eyebrow">${saud} · ${fmtDiaSem(hoje)}</p>
    <h1 class="h1">${esc(firstName(S.me.nome))}, ${descanso ? 'hoje é day off' : 'seu treino de hoje'}</h1></div></div>
    <div class="hoje-grid"><div class="hoje-main">
    ${cartaoCobrancaHTML(cobP)}
    <div class="stack" style="margin-top:16px">
      ${forcaHoje ? `<div class="card wcard dia-forca" style="display:flex"><div class="wletter fo">${FORCA_IC}</div><div class="grow"><span class="eyebrow">Definido pelo treinador</span><div class="h3" style="margin-top:2px">Hoje é dia de força</div><div class="small">${forcaHoje.descricao ? esc(forcaHoje.descricao) : 'Treino de força por sua conta. Hoje não tem corrida.'}</div></div></div>` : ''}
      ${corrDoDia.map(cardCorr).join('')}
      ${cardMusc}
      ${descanso ? `<div class="card wcard dayoff" style="display:flex"><div class="wletter off">${OFF_IC}</div><div class="grow"><span class="eyebrow">Day off${offCorr || offForca ? ' · definido pelo treinador' : ''}</span><div class="h3" style="margin-top:2px">Hoje é dia de descanso</div><div class="small muted">Recuperar também é treino. Hidrate-se, coma bem e durma bem.</div>${proxCorr ? `<div class="meta"><span class="tag">Próximo: ${esc(proxCorr.titulo || nomeTipo(proxCorr.tipo))}</span></div>` : ''}</div></div>` : ''}
    </div>
    ${corrNova ? `<button class="card-cta" id="card-nova" style="margin-top:12px"><span class="card-cta-ic">${I.cam}</span><div class="grow" style="text-align:left"><b>Corrida de ${fmtKm(corrNova.distancia_m, 1)} registrada!</b><span class="small">Gere o card e poste no seu story</span></div>${I.chev}</button>` : ''}
    ${semNota ? `<button class="list-item msg-row termo-row" id="termo-corr" style="width:100%;text-align:left"><span class="ativ-ic">${icCorr(S.me)}</span><div class="grow"><b>Como foi ${comArtigo(semNota)} de ${isoDia(semNota.data) === hoje ? 'hoje' : isoDia(semNota.data) === isoDia(Date.now() - 864e5) ? 'ontem' : fmtDiaSem(isoDia(semNota.data)).split(',')[0].toLowerCase()}?</b><div class="small muted">${resumoAtiv(semNota)} · leva 10 segundos responder</div></div>${I.chev}</button>` : ''}
    <div id="ciclo-box"></div>
    ${S.cache.msgNovas ? `<a class="list-item msg-row" href="#/conversa"><span class="ativ-ic">${I.feed}</span><div class="grow"><b>${S.cache.msgNovas === 1 ? 'Nova mensagem' : S.cache.msgNovas + ' novas mensagens'} do treinador</b><div class="small muted">Toque para ler e responder</div></div><i class="cv-n">${S.cache.msgNovas}</i></a>` : ''}
    ${cartaoPushHTML()}
    </div><div class="hoje-side">
    ${fC && provaProx ? `<a class="card tap prova-card" href="#/eventos/minhas" style="margin-top:12px;display:flex">${provaProx.data === hoje ? '<div class="pc-n"><b style="font-size:1rem">É</b><span>hoje</span></div>' : `<div class="pc-n"><b>${Math.round((dia(provaProx.data) - dia(hoje)) / 864e5)}</b><span>${Math.round((dia(provaProx.data) - dia(hoje)) / 864e5) === 1 ? 'dia' : 'dias'}</span></div>`}<div class="grow" style="min-width:0"><span class="eyebrow">${icT(I.flag)}Sua próxima prova</span><b class="ellip" style="display:block;margin-top:2px">${esc(provaProx.titulo)}</b><div class="small muted">${fmtData(provaProx.data + 'T12:00:00')}${provaProx.distancia ? ' · ' + esc(provaProx.distancia) : ''}</div></div>${I.chev}</a>` : ''}
    <div class="semana-comp" style="margin-top:12px">${freqSemanaHTML(ativSem.map((x) => x.iniciado_em), 'Sua semana')}</div>
    </div></div>`;
  bindCartaoPush();
  $app.onclick = (e) => {
    const r = e.target.closest('[data-reg]'); if (r) return registrarCorrida(S.user.id, () => alunoHoje());
    const v = e.target.closest('[data-ver]'); if (v) { const p = corrDoDia.find((x) => x.id === v.dataset.ver); return verTreinoPlanilha(p, perfC, corrHoje.find((c) => c.plano_id === p.id)); }
  };
  const rh = document.getElementById('reg-home'); if (rh) rh.onclick = () => registrarCorrida(S.user.id, () => alunoHoje());
  const cn = document.getElementById('card-nova'); if (cn) cn.onclick = async () => {
    let c = corrNova, plano = null;
    try {
      const { data: full } = await sb.from('nx_corridas').select('*').eq('id', corrNova.id).maybeSingle(); if (full) c = full;
      if (c.plano_id) plano = (await sb.from('nx_plano_corrida').select('*').eq('id', c.plano_id).maybeSingle()).data || null;
    } catch {}
    abrirCardCorrida(c, plano);
  };
  const tc = document.getElementById('termo-corr'); if (tc) tc.onclick = () => termometroCorrida(semNota, () => alunoHoje());
  let jaAvisou = true; try { jaAvisou = !!(semNota && (localStorage.getItem('nx-pop-' + semNota.id) || sessionStorage.getItem('nx-pop-' + semNota.id))); } catch {}
  if (semNota && !jaAvisou) setTimeout(() => {
    if (location.hash && location.hash !== '#/' ) return;
    try { sessionStorage.setItem('nx-pop-' + semNota.id, '1'); } catch {}
    const c = semNota; const quandoC = isoDia(c.data) === hoje ? 'hoje' : isoDia(c.data) === isoDia(Date.now() - 864e5) ? 'ontem' : fmtDiaSem(isoDia(c.data)).split(',')[0].toLowerCase();
    openSheet(`<div class="center"><div class="chegou-ic">${I.check}</div>
      <p class="eyebrow" style="margin-top:12px">${c.fonte === 'garmin' ? 'Treino carregado do Garmin' : 'Treino registrado'}</p>
      <div class="h2" style="margin-top:4px">${ehCorr(c) && c.tipo !== 'caminhada' ? 'Sua corrida' : c.tipo === 'caminhada' ? 'Sua caminhada' : c.tipo === 'forca' ? 'Seu treino de força' : c.tipo === 'bike' ? 'Seu pedal' : c.tipo === 'natacao' ? 'Sua natação' : 'Sua atividade'} de ${quandoC} foi concluída</div></div>
      <div class="mini-stats" style="margin-top:16px">${comDist(c) ? `<div><b>${fmtKm(c.distancia_m, 1)}</b><span>distância</span></div>` : ''}${c.duracao_s ? `<div><b>${fmtDur(c.duracao_s)}</b><span>tempo</span></div>` : ''}${comDist(c) && ehCorr(c) && c.duracao_s ? `<div><b>${fmtPace(paceDe(c))}</b><span>pace</span></div>` : ''}</div>
      <p class="small muted center" style="margin-top:16px">Quer comentar como foi o treino? Seu treinador usa isso para ajustar os próximos.</p>
      <button class="btn block" id="pop-sim" style="margin-top:16px">Comentar o treino</button>
      <button class="btn ghost block" id="pop-nao" style="margin-top:8px">Agora não</button>`, (r) => {
      r.querySelector('#pop-sim').onclick = () => { closeSheet(); termometroCorrida(c, () => alunoHoje()); };
      r.querySelector('#pop-nao').onclick = () => { try { localStorage.setItem('nx-pop-' + c.id, '1'); } catch {} closeSheet(); };
    });
  }, 500);
  if (S.me.sexo === 'F') buscarCiclo(S.user.id).then((c) => { const bx = document.getElementById('ciclo-box'); if (!bx) return;
    if (!c) { if (store.get('nx_ciclo_conv', false)) return; bx.innerHTML = `<div class="ciclo-l ciclo-conv" style="--cf:#e85d75"><i></i><span class="grow"><b>Ciclo menstrual</b> · ajuste o treino a cada fase</span><button type="button" class="link-btn small" id="cic-at">Ativar</button><button type="button" class="link-btn small" id="cic-nao" style="color:var(--dim)">Agora não</button></div>`;
      bx.querySelector('#cic-at').onclick = () => ativarCiclo(() => alunoHoje()); bx.querySelector('#cic-nao').onclick = () => { store.set('nx_ciclo_conv', true); bx.innerHTML = ''; }; return; } bx.innerHTML = cicloLinhaHTML(c, false); const b = bx.querySelector('.btn-ciclo'); if (b) b.onclick = () => abrirCiclo(c, () => alunoHoje()); }).catch(() => {});
  if (fC && planoSem.length) sb.from('nx_integracoes').select('id').eq('user_id', S.user.id).eq('provedor', 'garmin').maybeSingle().then(({ data }) => { if (data) sincronizarGarmin(S.user.id, planoSem, perfC, false); }).catch(() => {});
  const pp = document.getElementById('pagar-pix'); if (pp) pp.onclick = () => pagarComPix(cobP);
}

/* check-in rápido de uma corrida que veio do relógio */
function termometroCorrida(c, depois) {
  let rpe = null, dor = false; const corpo = {};
  openSheet(`<p class="eyebrow">Check-in · ${resumoAtiv(c)}</p><div class="h2" style="margin-top:4px">Como foi ${comArtigo(c)}?</div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Esforço percebido (0 a 10)</span>
      <div class="effort" id="eff">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="effort-lbl"><span>Repouso</span><span id="eff-txt"></span><span>Máximo</span></div></div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Sentiu alguma dor?</span>
      <div class="seg" style="margin-top:8px"><button type="button" class="on" data-dor="0">Não</button><button type="button" data-dor="1">Sim</button></div>
      <input class="input" id="dor-local" placeholder="Onde? Ex.: joelho direito" style="margin-top:12px" hidden></div>
    ${corpoHTML()}
    <label class="field" style="margin-top:16px"><span>Comentário para o treinador (opcional)</span><textarea class="textarea" id="t-coment" placeholder="Ex.: senti as pernas pesadas no fim, o calor atrapalhou">${esc(c.comentario || '')}</textarea></label>
    <button class="btn block" id="t-salvar" style="margin-top:12px">Enviar ${I.check}</button>`, (root) => {
    root.querySelector('#eff').onclick = (e) => { const b = e.target.closest('[data-n]'); if (!b) return; rpe = +b.dataset.n; root.querySelectorAll('#eff button').forEach((x) => { const on = +x.dataset.n === rpe; x.classList.toggle('on', on); x.style.background = on ? rpeCor(rpe) : ''; }); root.querySelector('#eff-txt').textContent = rpeTxt(rpe); };
    root.querySelectorAll('[data-dor]').forEach((b) => b.onclick = () => { dor = b.dataset.dor === '1'; root.querySelectorAll('[data-dor]').forEach((x) => { x.classList.toggle('on', x === b); x.classList.toggle('alert', x === b && dor); }); root.querySelector('#dor-local').hidden = !dor; });
    bindCorpo(root, corpo);
    root.querySelector('#t-salvar').onclick = async (e) => {
      if (rpe == null) return toast('Escolha o esforço de 0 a 10.', true);
      e.currentTarget.disabled = true;
      const { error } = await sb.from('nx_corridas').update({ rpe, dor, dor_local: dor ? (root.querySelector('#dor-local').value.trim() || null) : null, cansaco: corpo.cansaco ?? null, sono: corpo.sono ?? null, comentario: root.querySelector('#t-coment').value.trim() || null, visto_treinador: false }).eq('id', c.id);
      if (error) { e.currentTarget.disabled = false; return toast('Não foi possível salvar. Verifique a internet.', true); }
      try { localStorage.setItem('nx-pop-' + c.id, '1'); } catch {}
      closeSheet(); toast('Valeu! Seu treinador já vê como você está.'); depois && depois();
    };
  });
}

function sessaoCard(s, nome) {
  const d = new Date(s.iniciado_em);
  return `<div class="card hist" ${nome !== undefined ? `data-sessao="${s.id}" style="cursor:pointer"` : ''}>
    <div class="hist-date"><b>${d.getDate()}</b><span>${MESES[d.getMonth()]}</span></div>
    <div class="grow">
      ${nome ? `<div class="row" style="gap:8px">${!s.visto_treinador ? '<i class="alert-dot" title="Novo"></i>' : ''}<b class="ellip">${esc(nome)}</b></div>` : ''}
      <div class="${nome ? 'small muted' : 'h3'}">${esc(s.treino_titulo || 'Treino')}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">
        ${s.esforco != null ? `<span class="rpe" style="background:${rpeCor(s.esforco)}">Esforço ${s.esforco}</span>` : ''}
        ${s.finalizado_em ? `<span class="tag">${minutos(s.iniciado_em, s.finalizado_em)} min</span>` : ''}
        ${s.total_itens ? `<span class="tag">${s.itens_feitos.length}/${s.total_itens} exercícios</span>` : ''}
        ${s.dor ? `<span class="tag warn">Dor${s.dor_local ? ': ' + esc(s.dor_local) : ''}</span>` : ''}
        ${corpoTags(s)}
        <span class="tag">${quando(s.iniciado_em)} · ${fmtHora(s.iniciado_em)}</span>
      </div>
      ${s.comentario ? `<p class="small muted" style="margin-top:8px">“${esc(s.comentario)}”</p>` : ''}
    </div></div>`;
}

function freqSemanaHTML(datas, titulo = 'Frequência da semana') {
  const hoje = isoDia(new Date()); const seg = inicioSemana(); const set = new Set(datas.map((d) => isoDia(d)));
  const circ = Array.from({ length: 7 }, (_, i) => { const d = new Date(seg); d.setDate(seg.getDate() + i); const k = isoDia(d); return `<div class="fq-d ${set.has(k) ? 'ok' : ''} ${k === hoje ? 'hoje' : ''} ${k > hoje ? 'fut' : ''}"><i>${set.has(k) ? I.check : ''}</i><span>${'STQQSSD'[i]}</span></div>`; }).join('');
  const n = [...set].filter((k) => k >= isoDia(seg) && k <= hoje).length;
  return `<div class="card ov-card"><div class="row between"><b>${titulo}</b><span class="tag acc">${n} ${n === 1 ? 'dia' : 'dias'} treinados</span></div><div class="fq">${circ}</div></div>`;
}
function constanciaHTML(datas, titulo = 'Sua constância') {
  const ord = datas.map((d) => isoDia(d)).sort(); const ult = ord[ord.length - 1];
  const dias = ult ? Math.round((dia(isoDia(new Date())) - dia(ult)) / 864e5) : null;
  const media = datas.filter((d) => diasDesde(d) < 28).length / 4;
  const st = dias == null ? ['Comece hoje', 'acc'] : dias > 21 ? ['Hora de voltar', 'err'] : dias > 7 ? ['Bora retomar', 'warn'] : ['Em dia', 'ok'];
  return `<div class="card ov-card"><div class="row between"><b>${titulo}</b><span class="tag ${st[1]}">${st[0]}</span></div>
    <div class="ov-num"><div><span>Último treino</span><b>${dias == null ? '–' : dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}</b></div><div><span>Média</span><b>${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x por semana</b></div></div></div>`;
}
async function alunoHistorico(aba) {
  loading();
  const abasH = [['previsoes', 'Previsões'], ['relatorio', 'Relatório'], ['treinos', 'Treinos'], ['corrida', 'Corrida'], ['cargas', 'Cargas'], ['avaliacoes', 'Avaliações'], ['fotos', 'Fotos']].filter(([k]) => (k !== 'treinos' && k !== 'cargas') || faz('musculacao')).filter(([k]) => (k !== 'corrida' && k !== 'previsoes') || faz('corrida'));
  const INFO = { previsoes: [I.flag, 'Previsões de desempenho', 'Seus tempos estimados para 5K, 10K, meia e maratona'], relatorio: [I.ficha, 'Relatório do mês', 'Seu resumo mensal em PDF'], treinos: [I.feed, 'Treinos feitos', 'Histórico e feedbacks'], corrida: [icCorr(S.me), 'Corrida', 'Volume, pace e corridas'], cargas: [I.hist, 'Cargas', 'Quanto você evoluiu em cada exercício'], avaliacoes: [I.check, 'Avaliações', 'Composição corporal e relatórios'], fotos: [I.cam, 'Fotos', 'Seu progresso visual'] };
  if (!aba || !abasH.some(([k]) => k === aba)) {
    const [ses, cor] = await Promise.all([buscarSessoes(S.user.id, 200), sb.from('nx_corridas').select('data').eq('aluno_id', S.user.id).gte('data', isoDia(Date.now() - 60 * 864e5)).then((r) => r.data || []).catch(() => [])]);
    const datas = [...ses.map((x) => x.iniciado_em), ...cor.map((c) => c.data)];
    $app.innerHTML = `<p class="eyebrow">Evolução</p><h1 class="h1">Sua evolução</h1>
      <div class="stack" style="margin-top:16px">${freqSemanaHTML(datas)}${constanciaHTML(datas)}
      <div class="sec-grid">${abasH.map(([k]) => `<a class="sec-tile" href="#/historico/${k}"><span class="st-ic">${INFO[k][0]}</span><b>${INFO[k][1]}</b><small>${INFO[k][2]}</small></a>`).join('')}</div></div>`;
    return;
  }
  const head = `<a class="back" href="#/historico">${I.back} Evolução</a><div class="sec-tit"><span class="st-ic">${INFO[aba][0]}</span><div><p class="eyebrow">Sua evolução</p><h1 class="h2">${INFO[aba][1]}</h1></div></div>`;
  const bindTabs = () => {};
  if (aba === 'previsoes') { $app.innerHTML = head + '<div id="pv-box" style="margin-top:14px"></div>'; return previsoesCard(document.getElementById('pv-box'), await buscarCorridasPrev(S.user.id), perfilCorrida(S.me), { titulo: false }); }
  if (aba === 'relatorio') { $app.innerHTML = head + '<div id="relm"></div>'; return relatorioMes(S.user.id, document.getElementById('relm'), false, S.me); }
  if (aba === 'cargas') {
    const grupos = agruparCargas(await buscarRegistros(S.user.id));
    $app.innerHTML = head + `<div id="cargas">${cargasHTML(grupos, false)}</div>`; bindTabs(); bindCargas(document.getElementById('cargas'), grupos); return;
  }
  if (aba === 'corrida') {
    $app.innerHTML = head + '<div id="corr"></div>'; bindTabs();
    if (/\/(garmin-ok|garmin-erro|ok|erro)$/.test(location.hash)) { location.replace(location.pathname + '#/conexoes/' + location.hash.split('/').pop()); return; }
    if (/\/garmin-(ok|erro)$/.test(location.hash)) { const ok = location.hash.endsWith('-ok'); toast(ok ? 'Garmin conectado! Suas próximas corridas chegam sozinhas.' : 'Não foi possível conectar o Garmin. Tente de novo.', !ok); history.replaceState(null, '', location.pathname + '#/historico/corrida'); }
    else if (/\/(ok|erro)$/.test(location.hash)) { toast(location.hash.endsWith('/ok') ? 'Intervals.icu conectado! Buscando suas corridas…' : 'Não foi possível conectar o Intervals.icu.', !location.hash.endsWith('/ok')); history.replaceState(null, '', location.pathname + '#/historico/corrida'); S.cache.semCorr = { off: 0, sub: 'corridas', aluno: S.user.id }; }
    await viewCorridaPainel(S.user.id, document.getElementById('corr'), false, S.me, ['evolucao', 'corridas', 'ritmos']); return;
  }
  if (aba === 'fotos') {
    $app.innerHTML = head + '<div id="fotos"></div>'; bindTabs(); await viewFotos(S.user.id, document.getElementById('fotos'), false); return;
  }
  if (aba === 'avaliacoes') {
    const avs = await buscarAvaliacoes(S.user.id);
    $app.innerHTML = head + avaliacoesHTML(avs, S.user.id, false); bindTabs(); return;
  }
  const sessoes = await buscarSessoes(S.user.id, 120);
  const total = sessoes.length;
  const mes = sessoes.filter((s) => diasDesde(s.iniciado_em) < 30).length;
  const media = total ? (sessoes.slice(0, 10).reduce((a, s) => a + (s.esforco ?? 0), 0) / Math.min(10, total)).toFixed(1).replace('.', ',') : '–';
  const sem = Array(12).fill(0);
  sessoes.forEach((s) => { const w = Math.floor(diasDesde(s.iniciado_em) / 7); if (w < 12) sem[11 - w]++; });
  const max = Math.max(3, ...sem);
  const bars = sem.map((v, i) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;height:90px"><div title="${v} treinos" style="height:${(v / max) * 100}%;min-height:${v ? 6 : 2}px;border-radius:6px;background:${i === 11 ? 'linear-gradient(180deg,var(--acc),var(--acc2))' : 'var(--s3)'}"></div></div>`).join('');
  $app.innerHTML = head + `
    <div class="stats" style="margin-top:0"><div class="stat"><b>${total}</b><span>treinos no total</span></div><div class="stat"><b>${mes}</b><span>nos últimos 30 dias</span></div><div class="stat"><b>${media}</b><span>esforço médio recente</span></div></div>
    <div class="card"><div class="row between"><span class="small muted">Treinos por semana</span><span class="tiny dim">últimas 12 semanas</span></div><div style="display:flex;gap:6px;margin-top:14px">${bars}</div></div>
    <div class="section"><div class="section-h"><h2 class="h2">Sessões</h2>${slashes}</div>
    ${sessoes.length ? sessoes.map((s) => sessaoCard(s)).join('') : '<div class="empty"><div class="h3">Nenhum treino registrado ainda</div><p class="small">Quando você finalizar um treino, ele aparece aqui.</p></div>'}</div>`;
  bindTabs();
}

/* ---------- execução do treino ---------- */
let restT = null;
function stopRest() { clearInterval(restT); restT = null; const r = document.getElementById('rest'); if (r) r.hidden = true; }
function startRest(seg) {
  stopRest();
  const r = document.getElementById('rest'); let left = seg; const C = 2 * Math.PI * 100;
  r.innerHTML = `<p class="eyebrow">Descanso</p><div class="ring"><svg viewBox="0 0 220 220"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#2f6bff"/><stop offset="1" stop-color="#46d6ff"/></linearGradient></defs><circle class="bgc" cx="110" cy="110" r="100"/><circle class="fgc" id="rest-c" cx="110" cy="110" r="100" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="t mono" id="rest-t">${left}</div></div><div class="row" style="gap:10px"><button class="btn ghost sm" id="rest-mais">+15 s</button><button class="btn sm" id="rest-pular">Pular</button></div>`;
  r.hidden = false; let total = seg;
  const tick = () => {
    document.getElementById('rest-t').textContent = left;
    document.getElementById('rest-c').style.strokeDashoffset = String(C * (1 - left / total));
    if (left <= 0) { stopRest(); try { navigator.vibrate && navigator.vibrate([180, 80, 180]); } catch {} toast('Descanso concluído. Próxima série!'); }
    left--;
  };
  document.getElementById('rest-mais').onclick = () => { left += 15; total += 15; };
  document.getElementById('rest-pular').onclick = stopRest;
  tick(); restT = setInterval(tick, 1000);
}

/* ---------- cargas: histórico e sugestão ---------- */
const numCarga = (v) => { const m = String(v ?? '').replace(',', '.').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const fmtKg = (n) => n == null ? '–' : (Math.round(n * 10) / 10).toString().replace('.', ',') + ' kg';
function passoCarga(kg) { return kg < 10 ? 1 : kg < 40 ? 2 : 2.5; }
function arred(kg, passo) { return Math.round(kg / passo) * passo; }
/** sugestão: usa a última carga, o esforço e a dor do último treino e a carga prescrita */
function sugerirCarga(prev, presc) {
  if (!prev || prev.carga_kg == null) return presc != null ? { kg: presc, motivo: 'carga prescrita pelo treinador' } : null;
  const last = +prev.carga_kg, s = prev.sessao || {};
  if (presc != null && presc > last) return { kg: presc, motivo: 'nova carga definida pelo treinador' };
  if (s.dor) return { kg: last, motivo: 'você relatou dor no último treino: mantenha' };
  if (s.esforco != null && s.esforco >= 9) return { kg: last, motivo: 'último treino foi muito intenso: mantenha' };
  if (s.esforco != null && s.esforco <= 7 && prev.feito !== false) {
    const p = passoCarga(last); return { kg: arred(last + Math.max(p, last * 0.05), p), motivo: 'você treinou com folga: tente subir' };
  }
  return { kg: last, motivo: 'repita e consolide a técnica' };
}
async function ultimasCargas(alunoId, exIds) {
  if (!exIds.length) return {};
  const { data } = await sb.from('nx_registros').select('exercicio_id,carga_kg,reps,feito,criado_em,sessao_id,nx_sessoes(esforco,dor)').eq('aluno_id', alunoId).in('exercicio_id', exIds).not('carga_kg', 'is', null).order('criado_em', { ascending: false }).limit(400);
  const out = {};
  (data || []).forEach((r) => { if (!out[r.exercicio_id]) out[r.exercicio_id] = { ...r, sessao: r.nx_sessoes }; });
  return out;
}

async function viewExecucao(treinoId, preview) {
  loading();
  const { data: t, error } = await sb.from('nx_treinos').select('*, nx_treino_itens(*, nx_exercicios(nome,grupo,equipamento,descricao,video_url,video_credito,com_audio,imagens,instrucoes,musculos,musculos_sec,nivel,ref_externa))').eq('id', treinoId).maybeSingle();
  if (error) throw error;
  if (!t) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Treino não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>'; return; }
  const itens = (t.nx_treino_itens || []).sort((a, b) => a.ordem - b.ordem);
  const prevs = await ultimasCargas(t.aluno_id, [...new Set(itens.map((i) => i.exercicio_id))]);
  const key = 'nx-exec-' + t.id;
  const st = preview ? { feitos: [], cargas: {}, ser: {} } : store.get(key, { feitos: [], ini: null, cargas: {}, ser: {} });
  st.cargas = st.cargas || {}; st.ser = st.ser || {};
  if (!preview && !st.ini) { st.ini = new Date().toISOString(); store.set(key, st); }
  const feitos = new Set(st.feitos);
  const sug = {};
  itens.forEach((it) => { sug[it.id] = sugerirCarga(prevs[it.exercicio_id], numCarga(it.carga)); });

  const cargaHTML = (it) => {
    const prev = prevs[it.exercicio_id]; const sg = sug[it.id];
    if (!prev && !sg && !numCarga(it.carga)) return `<div class="load"><label class="load-in"><span>Carga hoje</span><input data-mask="dec" inputmode="decimal" data-carga="${it.id}" value="${esc(st.cargas[it.id] ?? '')}" placeholder="kg" ${preview ? 'disabled' : ''}></label><span class="tiny dim">Sem carga? Deixe em branco.</span></div>`;
    return `<div class="load">
      <label class="load-in"><span>Carga hoje</span><input data-mask="dec" inputmode="decimal" data-carga="${it.id}" value="${esc(st.cargas[it.id] ?? '')}" placeholder="${sg ? String(sg.kg).replace('.', ',') : 'kg'}" ${preview ? 'disabled' : ''}><em>kg</em></label>
      <div class="load-info">
        ${prev ? `<span class="tiny muted">Última vez: <b>${fmtKg(prev.carga_kg)}</b> · ${quando(prev.criado_em)}</span>` : '<span class="tiny muted">Primeira vez registrando</span>'}
        ${sg ? `<button type="button" class="sug" data-sug="${it.id}" data-kg="${sg.kg}" title="${esc(sg.motivo)}">Sugerida <b>${fmtKg(sg.kg)}</b></button><span class="tiny dim">${esc(sg.motivo)}</span>` : ''}
      </div></div>`;
  };

  const render = () => {
    const pct = itens.length ? Math.round((feitos.size / itens.length) * 100) : 0;
    $app.innerHTML = `
      <div class="exec-head">
        <div class="row between">
          <a class="icon-btn" href="${preview ? `#/aluno/${t.aluno_id}` : '#/'}" aria-label="Voltar">${I.back}</a>
          <div class="grow center"><div class="eyebrow">${preview ? 'Pré-visualização' : 'Em treino'}</div><div class="h3 ellip">${esc(t.titulo)}</div></div>
          <span class="mono small muted" style="width:42px;text-align:right">${feitos.size}/${itens.length}</span>
        </div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </div>
      ${t.observacoes ? `<div class="card" style="border-color:rgba(70,214,255,.3)"><span class="eyebrow">Recado do treinador</span><p style="margin-top:6px">${esc(t.observacoes)}</p></div>` : ''}
      <div class="stack" style="margin-top:12px">
      ${itens.map((it, i) => {
        const ex = it.nx_exercicios || {};
        const done = feitos.has(it.id);
        return `<div class="card ex ${done ? 'done' : ''}" data-item="${it.id}">
          <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="grow" data-toggle-info>
            ${exFig(ex, 'ex-fig')}
            <div class="ex-name">${esc(ex.nome || 'Exercício')}</div>
            ${Array.isArray(it.series_det) && it.series_det.length ? `<div class="ser-ex">${it.series_det.map((d, k) => { const ok = (st.ser[it.id] || []).includes(k); return `<button type="button" class="se-l ${ok ? 'ok' : ''}" data-ser="${it.id}" data-k="${k}" data-desc="${d.desc || ''}"><b class="mono">${k + 1}ª</b><span class="se-t">${[d.reps ? `<b>${esc(d.reps)}</b> reps` : '', d.carga ? `<b>${esc(d.carga)}</b>` : ''].filter(Boolean).join(' · ')}</span><span class="dim">${d.desc ? d.desc + 's' : ''}</span><i>${I.check}</i></button>`; }).join('')}<p class="tiny dim" style="margin-top:4px">Toque na série quando terminar: o descanso começa sozinho.</p></div>` : `<div class="ex-pres">
              ${it.series ? `<span class="pill"><b>${it.series}</b> séries</span>` : ''}
              ${it.repeticoes ? `<span class="pill"><b>${esc(it.repeticoes)}</b> reps</span>` : ''}
              ${it.carga ? `<span class="pill">prescrita <b>${esc(it.carga)}</b></span>` : ''}
              ${it.descanso_seg ? `<span class="pill">descanso <b>${it.descanso_seg}s</b></span>` : ''}
            </div>`}
            ${it.observacao ? `<p class="small" style="margin-top:8px;color:var(--warn)">${esc(it.observacao)}</p>` : ''}
            ${cargaHTML(it)}
            <div class="ex-more">${exDetalhe(ex)}</div>
            <button type="button" class="link-btn ex-how" data-how>Como fazer</button>
            <div class="ex-actions">
              ${it.descanso_seg ? `<button class="btn ghost sm" data-rest="${it.descanso_seg}">${I.timer} Descanso</button>` : ''}
              ${ex.video_url ? (ehVideoArquivo(ex.video_url) ? `<button type="button" class="btn ghost sm" data-vid>${I.play} Vídeo</button>` : `<a class="btn ghost sm" href="${esc(ex.video_url)}" target="_blank" rel="noopener">${I.play} Vídeo</a>`) : ''}
            </div>
          </div>
          <button class="check" data-check aria-label="Marcar como feito">${I.check}</button>
        </div>`;
      }).join('')}
      </div>
      ${preview ? '' : `<div style="height:90px"></div><div class="finish-bar"><button class="btn" id="finalizar">${feitos.size === itens.length && itens.length ? 'Finalizar treino' : `Finalizar treino (${feitos.size}/${itens.length})`} ${I.arrow}</button></div>`}`;
  };
  render();
  $app.oninput = (e) => {
    const inp = e.target.closest('[data-carga]'); if (!inp || preview) return;
    st.cargas[inp.dataset.carga] = inp.value; store.set(key, st);
  };
  $app.onclick = (e) => {
    const card = e.target.closest('[data-item]');
    const vidB = e.target.closest('[data-vid]');
    if (vidB) { const card = vidB.closest('.ex'); if (card) { card.classList.add('open'); const v = card.querySelector('.ex-vid video'); if (v) { v.scrollIntoView({ block: 'center', behavior: 'smooth' }); v.play().catch(() => {}); } } return; }
    const restB = e.target.closest('[data-rest]');
    if (restB) { e.stopPropagation(); startRest(+restB.dataset.rest); return; }
    const serB = e.target.closest('[data-ser]');
    if (serB) {
      e.stopPropagation(); if (preview) return toast('Pré-visualização: o aluno marca as séries.');
      const id = serB.dataset.ser, k = +serB.dataset.k; const l = new Set(st.ser[id] || []);
      const marcando = !l.has(k); marcando ? l.add(k) : l.delete(k); st.ser[id] = [...l];
      const it = itens.find((x) => x.id === id); const tot = it.series_det.length;
      if (l.size === tot) feitos.add(id); else feitos.delete(id);
      st.feitos = [...feitos]; store.set(key, st);
      try { navigator.vibrate && navigator.vibrate(15); } catch {}
      const y = window.scrollY; render(); window.scrollTo(0, y);
      if (marcando && l.size < tot && +serB.dataset.desc) startRest(+serB.dataset.desc);
      if (feitos.size === itens.length && itens.length) toast('Tudo feito! Finalize e conte como foi.');
      return;
    }
    if (e.target.closest('a') || e.target.closest('input') || e.target.closest('.load-in')) return;
    const sb_ = e.target.closest('[data-sug]');
    if (sb_) {
      if (preview) return;
      const v = String(sb_.dataset.kg).replace('.', ',');
      st.cargas[sb_.dataset.sug] = v; store.set(key, st);
      const inp = $app.querySelector(`[data-carga="${sb_.dataset.sug}"]`); if (inp) inp.value = v;
      toast('Carga sugerida aplicada'); return;
    }
    if (card && e.target.closest('[data-check]')) {
      if (preview) return toast('Pré-visualização: o aluno marca os exercícios.');
      const id = card.dataset.item;
      feitos.has(id) ? feitos.delete(id) : feitos.add(id);
      st.feitos = [...feitos]; store.set(key, st);
      try { navigator.vibrate && navigator.vibrate(18); } catch {}
      const y = window.scrollY; render(); window.scrollTo(0, y);
      if (feitos.size === itens.length && itens.length) toast('Tudo feito! Finalize e conte como foi.');
      return;
    }
    if (card && e.target.closest('[data-toggle-info]')) { card.classList.toggle('open'); hidratarInstrucoes(card); }
    if (e.target.closest('#finalizar')) abrirCheckin(t, itens, st, key);
  };
}

/* termômetro: cansaço e sono (0 bom · 1 médio · 2 ruim) */
const CORPO = { cansaco: ['Cansaço', ['Normal', 'Cansado', 'Muito cansado']], sono: ['Sono da última noite', ['Bom', 'Regular', 'Ruim']] };
const corpoTags = (x) => [x.cansaco ? `<span class="tag ${x.cansaco === 2 ? 'warn' : ''}">${CORPO.cansaco[1][x.cansaco]}</span>` : '', x.sono ? `<span class="tag ${x.sono === 2 ? 'warn' : ''}">Sono ${CORPO.sono[1][x.sono].toLowerCase()}</span>` : ''].join('');
function corpoHTML(v = {}) {
  return `<div class="corpo">${Object.entries(CORPO).map(([k, [t, ops]]) => `<div class="corpo-l"><span>${t}</span><div class="seg sm" data-corpo="${k}">${ops.map((o, i) => `<button type="button" data-v="${i}" class="${v[k] === i ? 'on' + (i === 2 ? ' alert' : '') : ''}">${o}</button>`).join('')}</div></div>`).join('')}</div>`;
}
function bindCorpo(root, v) {
  root.querySelectorAll('[data-corpo]').forEach((g) => g.onclick = (e) => {
    const b = e.target.closest('[data-v]'); if (!b) return; const k = g.dataset.corpo, n = +b.dataset.v;
    v[k] = v[k] === n ? null : n;
    g.querySelectorAll('button').forEach((x) => { const on = +x.dataset.v === v[k]; x.classList.toggle('on', on); x.classList.toggle('alert', on && v[k] === 2); });
  });
}
function abrirCheckin(t, itens, st, key) {
  let esforco = null, dor = false; const corpo = {};
  openSheet(`
    <p class="eyebrow">Check-in</p><div class="h2" style="margin-top:4px">Como foi o treino?</div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Esforço percebido (0 a 10)</span>
      <div class="effort" id="eff">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="effort-lbl"><span>Repouso</span><span id="eff-txt"></span><span>Máximo</span></div></div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Sentiu alguma dor?</span>
      <div class="seg" style="margin-top:8px"><button type="button" class="on" data-dor="0">Não</button><button type="button" data-dor="1">Sim</button></div>
      <input class="input" id="dor-local" placeholder="Onde? Ex.: joelho direito" style="margin-top:12px" hidden></div>
    ${corpoHTML()}
    <label class="field" style="margin-top:16px"><span>Quer deixar um recado pro treinador? (opcional)</span><textarea class="textarea" id="coment" placeholder="Ex.: senti o ombro no supino"></textarea></label>
    <button class="btn block" id="salvar-sessao">Salvar treino ${I.check}</button>
    <button class="btn ghost block" data-close style="margin-top:8px">Voltar ao treino</button>`, (root) => {
    root.querySelector('#eff').onclick = (e) => {
      const b = e.target.closest('[data-n]'); if (!b) return;
      esforco = +b.dataset.n;
      root.querySelectorAll('#eff button').forEach((x) => { const on = +x.dataset.n === esforco; x.classList.toggle('on', on); x.style.background = on ? rpeCor(esforco) : ''; });
      root.querySelector('#eff-txt').textContent = rpeTxt(esforco);
    };
    root.querySelectorAll('[data-dor]').forEach((b) => b.onclick = () => {
      dor = b.dataset.dor === '1';
      root.querySelectorAll('[data-dor]').forEach((x) => x.classList.toggle('on', x === b));
      b.classList.toggle('alert', dor);
      root.querySelector('#dor-local').hidden = !dor;
    });
    bindCorpo(root, corpo);
    root.querySelector('#salvar-sessao').onclick = async (e) => {
      if (esforco == null) return toast('Escolha o esforço de 0 a 10.', true);
      const btn = e.currentTarget; btn.disabled = true;
      const comentario = root.querySelector('#coment').value.trim() || null;
      const { data: ses, error } = await sb.from('nx_sessoes').insert({
        org_id: S.org.id, aluno_id: S.user.id, treino_id: t.id, treino_titulo: t.titulo,
        iniciado_em: st.ini || new Date().toISOString(), finalizado_em: new Date().toISOString(),
        itens_feitos: st.feitos, total_itens: itens.length, esforco, dor,
        dor_local: dor ? (root.querySelector('#dor-local').value.trim() || null) : null, comentario,
        cansaco: corpo.cansaco ?? null, sono: corpo.sono ?? null,
      }).select('id').single();
      if (error || !ses) { btn.disabled = false; return toast('Não foi possível salvar. Verifique a internet.', true); }
      const regs = itens.map((it) => ({
        org_id: S.org.id, aluno_id: S.user.id, sessao_id: ses.id, treino_item_id: it.id, exercicio_id: it.exercicio_id,
        exercicio_nome: (it.nx_exercicios || {}).nome || null, carga_kg: numCarga(st.cargas[it.id]), reps: it.repeticoes || null,
        feito: st.feitos.includes(it.id),
      })).filter((r) => r.feito || r.carga_kg != null);
      if (regs.length) await sb.from('nx_registros').insert(regs);
      notificar('checkin', ses.id);
      const novasCargas = regs.filter((r) => r.carga_kg != null).length;
      store.del(key); closeSheet();
      $app.innerHTML = `<section class="login center"><div class="slashes" style="justify-content:center;margin:0 auto 18px"><i></i><i></i><i></i></div><h1 class="h1">Treino concluído!</h1><p class="muted" style="margin:10px 0 6px">Seu treinador já recebeu o seu check-in.</p>${novasCargas ? `<p class="small" style="margin-bottom:24px">${novasCargas} carga${novasCargas > 1 ? 's' : ''} registrada${novasCargas > 1 ? 's' : ''} na sua evolução.</p>` : '<div style="height:18px"></div>'}<a class="btn" href="#/">Voltar ao início</a><a class="btn ghost" href="#/historico/cargas" style="margin-top:12px">Ver minha evolução</a></section>`;
    };
  });
}

/* ================= EVOLUÇÃO: cargas, avaliações e conversa ================= */
const num = (v) => { if (v === '' || v == null) return null; const n = +String(v).replace(',', '.'); return isFinite(n) ? n : null; };
const f1 = (n, d = 1) => (n == null || !isFinite(n)) ? '–' : (+n).toFixed(d).replace('.', ',');
const fN = (n, d = 1) => f1(n, Math.abs(Math.round(n * 10 ** d) / 10 ** d % 1) < 1e-9 ? 0 : d);
const dia = (d) => new Date(String(d).length === 10 ? d + 'T12:00:00' : d);
const fmtDia = (d) => dia(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ de /g, ' ').replace('.', '');
const fmtCurto = (d) => dia(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const hojeISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const somaDias = (iso, n) => { const d = dia(iso); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

/** gráfico de linha em SVG (mini = sparkline) */
function grafico(pts, { mini = false, unid = '', dec = 1, fmt = null } = {}) {
  if (!pts.length) return '';
  const W = mini ? 120 : 320, H = mini ? 38 : 140, pl = mini ? 3 : 10, pr = mini ? 3 : 10, pt = mini ? 5 : 22, pb = mini ? 5 : 22;
  const ys = pts.map((p) => p.y); let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const X = (i) => pts.length === 1 ? W / 2 : pl + (i * (W - pl - pr)) / (pts.length - 1);
  const Y = (v) => pt + ((hi - v) * (H - pt - pb)) / (hi - lo);
  const line = pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  let s = `<svg class="chart${mini ? ' mini' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--acc)" stop-opacity=".28"/><stop offset="1" style="stop-color:var(--acc)" stop-opacity="0"/></linearGradient></defs>`;
  if (!mini) s += `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" style="stroke:var(--line2)"/>`;
  if (pts.length > 1) s += `<polygon points="${X(0).toFixed(1)},${H - pb} ${line} ${X(pts.length - 1).toFixed(1)},${H - pb}" fill="url(#${gid})"/><polyline points="${line}" fill="none" style="stroke:var(--acc)" stroke-width="${mini ? 2 : 2.5}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  const iMax = ys.indexOf(Math.max(...ys));
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    if (mini) { if (last) s += `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3" style="fill:var(--acc)"/>`; return; }
    s += `<circle cx="${X(i)}" cy="${Y(p.y)}" r="${last ? 4.5 : 3}" style="fill:${last ? 'var(--acc)' : 'var(--bg2)'};stroke:var(--acc)" stroke-width="2"/>`;
    if (pts.length <= 8 || last || i === 0 || i === iMax) s += `<text x="${X(i)}" y="${Y(p.y) - 9}" text-anchor="middle" class="cv">${fmt ? fmt(p.y) : f1(p.y, p.y % 1 ? dec : 0) + unid}</text>`;
  });
  if (!mini) {
    s += `<text x="${X(0)}" y="${H - 6}" text-anchor="${pts.length === 1 ? 'middle' : 'start'}" class="cx">${esc(pts[0].x)}</text>`;
    if (pts.length > 1) s += `<text x="${X(pts.length - 1)}" y="${H - 6}" text-anchor="end" class="cx">${esc(pts[pts.length - 1].x)}</text>`;
  }
  return s + '</svg>';
}

/* ---------- cargas ---------- */
async function buscarRegistros(alunoId) {
  const { data, error } = await sb.from('nx_registros').select('exercicio_id,exercicio_nome,carga_kg,reps,criado_em,sessao_id').eq('aluno_id', alunoId).not('carga_kg', 'is', null).order('criado_em').limit(3000);
  if (error) throw error; return data || [];
}
function agruparCargas(regs) {
  const m = new Map();
  regs.forEach((r) => {
    const k = r.exercicio_id || r.exercicio_nome;
    if (!m.has(k)) m.set(k, { nome: r.exercicio_nome || 'Exercício', regs: [] });
    const g = m.get(k); if (r.exercicio_nome) g.nome = r.exercicio_nome; g.regs.push(r);
  });
  return [...m.values()].map((g) => {
    const porSes = new Map();
    g.regs.forEach((r) => { const k = r.sessao_id || r.criado_em; const c = porSes.get(k); if (!c || +r.carga_kg > +c.carga_kg) porSes.set(k, r); });
    const pts = [...porSes.values()].sort((a, b) => (a.criado_em < b.criado_em ? -1 : 1));
    const ys = pts.map((p) => +p.carga_kg);
    const melhor = Math.max(...ys);
    const antes = pts.filter((p) => diasDesde(p.criado_em) >= 30).map((p) => +p.carga_kg);
    const recorde = pts.length > 1 && diasDesde(pts[ys.lastIndexOf(melhor)].criado_em) < 30 && (!antes.length || melhor > Math.max(...antes));
    return { ...g, pts, ultima: ys[ys.length - 1], primeira: ys[0], melhor, recorde, quando: pts[pts.length - 1].criado_em };
  }).sort((a, b) => (a.quando < b.quando ? 1 : -1));
}
function deltaTag(d, bom = 'up', unid = '', dec = 1) {
  if (d == null || !isFinite(d) || Math.abs(d) < 0.05) return '<span class="delta">=</span>';
  const cls = bom === 'up' ? (d > 0 ? 'good' : 'bad') : bom === 'down' ? (d < 0 ? 'good' : 'bad') : '';
  return `<span class="delta ${cls}">${d > 0 ? '▲ +' : '▼ '}${fN(Math.abs(d), dec)}${unid}</span>`;
}
function cargasHTML(grupos, staff) {
  if (!grupos.length) return `<div class="empty"><div class="h3">Nenhuma carga registrada ainda</div><p class="small">${staff ? 'Quando o aluno anotar a carga durante o treino, a evolução aparece aqui.' : 'Durante o treino, anote a carga que você usou em cada exercício. A sua evolução aparece aqui.'}</p></div>`;
  const rec = grupos.filter((g) => g.recorde).length;
  const subiu = grupos.filter((g) => g.ultima > g.primeira).length;
  return `<div class="stats"><div class="stat"><b>${grupos.length}</b><span>exercícios acompanhados</span></div><div class="stat"><b>${subiu}</b><span>com carga maior que no início</span></div><div class="stat"><b style="color:${rec ? 'var(--acc)' : 'inherit'}">${rec}</b><span>recordes nos últimos 30 dias</span></div></div>
    <div class="cols" style="margin-top:12px">${grupos.map((g, i) => `
    <button type="button" class="card tap lift" data-lift="${i}">
      <div class="grow" style="min-width:0">
        <b class="lift-t">${esc(g.nome)}</b>
        <div class="lift-n"><b>${fmtKg(g.ultima)}</b>${g.pts.length > 1 ? deltaTag(g.ultima - g.primeira, 'up', ' kg') : ''}</div>
        ${g.recorde ? '<span class="tag acc" style="margin-bottom:4px">recorde recente</span><br>' : ''}<span class="tiny dim">melhor ${fmtKg(g.melhor)} · ${g.pts.length} ${g.pts.length === 1 ? 'treino' : 'treinos'} · ${quando(g.quando)}</span>
      </div>
      ${g.pts.length > 1 ? grafico(g.pts.map((p) => ({ x: fmtCurto(p.criado_em), y: +p.carga_kg })), { mini: true }) : '<span class="tiny dim" style="flex:none">1º registro</span>'}
    </button>`).join('')}</div>`;
}
function bindCargas(root, grupos) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lift]'); if (!b) return;
    const g = grupos[+b.dataset.lift];
    openSheet(`<p class="eyebrow">Evolução de carga</p><div class="h2" style="margin-top:4px">${esc(g.nome)}</div>
      <div class="row" style="gap:8px;margin:12px 0;flex-wrap:wrap"><span class="tag acc">atual ${fmtKg(g.ultima)}</span><span class="tag">melhor ${fmtKg(g.melhor)}</span><span class="tag">início ${fmtKg(g.primeira)}</span></div>
      <div class="card" style="padding:12px 8px">${grafico(g.pts.map((p) => ({ x: fmtCurto(p.criado_em), y: +p.carga_kg })), { unid: '' })}</div>
      <div class="section" style="margin-top:16px"><span class="small muted" style="font-weight:700">Registros</span>
      <div class="tbl" style="margin-top:8px">${[...g.pts].reverse().map((p, i, arr) => `<div><span>${fmtDia(p.criado_em)}</span><span class="dim">${p.reps ? esc(p.reps) + ' reps' : ''}</span><b>${fmtKg(p.carga_kg)}</b>${arr[i + 1] ? deltaTag(+p.carga_kg - +arr[i + 1].carga_kg, 'up', '') : '<span></span>'}</div>`).join('')}</div></div>
      <button class="btn ghost block" data-close style="margin-top:16px">Fechar</button>`);
  });
}

/* ---------- avaliação física ---------- */
const DOBRAS = [['peitoral', 'Peitoral'], ['axilar', 'Axilar média'], ['triceps', 'Tríceps'], ['subescapular', 'Subescapular'], ['abdominal', 'Abdominal'], ['suprailiaca', 'Suprailíaca'], ['coxa', 'Coxa'], ['panturrilha', 'Panturrilha medial']];
const PROTOCOLOS = {
  pollock7: { nome: 'Pollock 7 dobras', M: DOBRAS.slice(0, 7).map((d) => d[0]), F: DOBRAS.slice(0, 7).map((d) => d[0]) },
  petroski: { nome: 'Petroski 4 dobras (brasileiros)', M: ['subescapular', 'triceps', 'suprailiaca', 'panturrilha'], F: ['subescapular', 'triceps', 'suprailiaca', 'panturrilha'] },
  pollock3: { nome: 'Pollock 3 dobras', M: ['peitoral', 'abdominal', 'coxa'], F: ['triceps', 'suprailiaca', 'coxa'] },
  faulkner: { nome: 'Faulkner 4 dobras', M: ['triceps', 'subescapular', 'suprailiaca', 'abdominal'], F: ['triceps', 'subescapular', 'suprailiaca', 'abdominal'] },
};
const PERIM = [['torax', 'Tórax'], ['cintura', 'Cintura'], ['abdomen', 'Abdômen'], ['quadril', 'Quadril'], ['braco_d', 'Braço dir.'], ['braco_e', 'Braço esq.'], ['antebraco', 'Antebraço'], ['coxa_d', 'Coxa dir.'], ['coxa_e', 'Coxa esq.'], ['panturrilha_d', 'Panturrilha dir.'], ['panturrilha_e', 'Panturrilha esq.']];
const BIO = [['gordura', '% de gordura', '%'], ['musculo', 'Massa muscular', 'kg'], ['agua', 'Água corporal', '%'], ['visceral', 'Gordura visceral', 'nível'], ['tmb', 'Metabolismo basal', 'kcal']];
function calcAval(a) {
  const r = {}; const peso = num(a.peso), alt = num(a.altura), sexo = a.sexo, idade = num(a.idade);
  if (peso && alt) r.imc = peso / ((alt / 100) ** 2);
  const p = a.perimetros || {}; const ci = num(p.cintura), qu = num(p.quadril);
  if (ci && qu) r.rcq = ci / qu;
  let g = null;
  if (a.metodo === 'bioimpedancia') g = num((a.bio || {}).gordura);
  else if (PROTOCOLOS[a.protocolo] && (sexo === 'M' || sexo === 'F')) {
    const vals = PROTOCOLOS[a.protocolo][sexo].map((k) => num((a.dobras || {})[k]));
    if (vals.every((v) => v != null && v > 0)) {
      const s = vals.reduce((x, y) => x + y, 0); r.soma_dobras = s;
      if (a.protocolo === 'faulkner') g = 0.153 * s + 5.783;
      else if (a.protocolo === 'petroski') {
        if (idade != null && (sexo === 'M' || (peso && alt))) {
          const D = sexo === 'M' ? 1.10726863 - 0.00081201 * s + 0.00000212 * s * s - 0.00041761 * idade
            : 1.02902361 - 0.00067159 * s + 0.00000242 * s * s - 0.00026073 * idade - 0.00056009 * peso + 0.00054649 * alt;
          r.densidade = D; g = (4.95 / D - 4.5) * 100;
        }
      } else if (idade != null) {
        const D = a.protocolo === 'pollock7'
          ? (sexo === 'M' ? 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * idade : 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * idade)
          : (sexo === 'M' ? 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * idade : 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * idade);
        r.densidade = D; g = (4.95 / D - 4.5) * 100;
      }
    }
  }
  if (g != null && isFinite(g) && g > 0 && g < 70) { r.gordura = g; if (peso) { r.massa_gorda = (peso * g) / 100; r.massa_magra = peso - r.massa_gorda; } }
  if (a.metodo === 'bioimpedancia') { const mm = num((a.bio || {}).musculo); if (mm) r.massa_muscular = mm; }
  if (idade != null) r.fc_max = 208 - 0.7 * idade;
  if (r.massa_magra) { r.tmb = 370 + 21.6 * r.massa_magra; r.tmb_metodo = 'Katch-McArdle'; }
  else if (peso && alt && idade != null && (sexo === 'M' || sexo === 'F')) { r.tmb = 10 * peso + 6.25 * alt - 5 * idade + (sexo === 'M' ? 5 : -161); r.tmb_metodo = 'Mifflin-St Jeor'; }
  return r;
}
const clsIMC = (v) => v == null ? '' : v < 18.5 ? 'Abaixo do peso' : v < 25 ? 'Peso adequado' : v < 30 ? 'Sobrepeso' : v < 35 ? 'Obesidade grau I' : v < 40 ? 'Obesidade grau II' : 'Obesidade grau III';
const clsRCQ = (v, sx) => v == null || !sx ? '' : v < (sx === 'M' ? 0.9 : 0.85) ? 'Dentro da referência' : 'Acima da referência';
const clsCint = (v, sx) => v == null || !sx ? '' : sx === 'M' ? (v >= 102 ? 'Risco muito aumentado' : v >= 94 ? 'Risco aumentado' : 'Dentro da referência') : (v >= 88 ? 'Risco muito aumentado' : v >= 80 ? 'Risco aumentado' : 'Dentro da referência');
const clsPA = (s, d) => { if (!s || !d) return ''; if (s >= 180 || d >= 110) return 'Hipertensão estágio 3'; if (s >= 160 || d >= 100) return 'Hipertensão estágio 2'; if (s >= 140 || d >= 90) return 'Hipertensão estágio 1'; if (s >= 130 || d >= 85) return 'Pré-hipertensão'; if (s >= 120 || d >= 80) return 'Normal'; return 'Ótima'; };
const mediana = (l) => { const v = l.filter((x) => x != null).sort((a, b) => a - b); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
function zonasFC(fcMax, fcRep) {
  const Z = [['Z1', 'Regenerativo', 0.5, 0.6], ['Z2', 'Aeróbico leve', 0.6, 0.7], ['Z3', 'Aeróbico moderado', 0.7, 0.8], ['Z4', 'Limiar', 0.8, 0.9], ['Z5', 'Máximo', 0.9, 1]];
  return Z.map(([z, n, a, b]) => ({ z, n, de: Math.round(fcRep ? fcRep + a * (fcMax - fcRep) : a * fcMax), ate: Math.round(fcRep ? fcRep + b * (fcMax - fcRep) : b * fcMax) }));
}
const idadeEm = (nasc, data) => { if (!nasc) return null; const n = dia(nasc), d = dia(data || hojeISO()); let i = d.getFullYear() - n.getFullYear(); if (d.getMonth() < n.getMonth() || (d.getMonth() === n.getMonth() && d.getDate() < n.getDate())) i--; return i; };

async function buscarAvaliacoes(alunoId) {
  const { data, error } = await sb.from('nx_avaliacoes').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('data');
  if (error) throw error; return data || [];
}
function avaliacoesHTML(avs, alunoId, staff) {
  const lista = [...avs].reverse(); const ult = lista[0];
  const prox = ult && ult.proxima ? `<div class="card" style="border-color:rgba(70,214,255,.3)"><span class="eyebrow">Próxima avaliação</span><div class="h3" style="margin-top:4px">${fmtDia(ult.proxima)}</div><p class="small muted">${dia(ult.proxima) < new Date() ? 'Já passou da data: ' + (staff ? 'agende com o aluno.' : 'combine com seu treinador.') : 'Faltam ' + Math.ceil((dia(ult.proxima) - new Date()) / 86400000) + ' dias.'}</p></div>` : '';
  const pp = avs.filter((a) => a.peso != null).map((a) => ({ x: fmtCurto(a.data), y: +a.peso }));
  const pg = avs.map((a) => ({ x: fmtCurto(a.data), y: calcAval(a).gordura })).filter((p) => p.y != null);
  const charts = avs.length > 1 ? `<div class="grid2 g-charts">${pp.length > 1 ? `<div class="card" style="padding:12px 8px"><span class="small muted" style="padding-left:6px;font-weight:700">Peso (kg)</span>${grafico(pp)}</div>` : ''}${pg.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">% de gordura</span>${grafico(pg, { unid: '%' })}</div>` : ''}</div>` : '';
  return `${staff ? `<a class="btn block" href="#/aluno/${alunoId}/avaliacao/nova" style="margin-bottom:14px">${I.plus} Nova avaliação</a>` : ''}${prox}${charts}
    <div class="stack" style="margin-top:12px">${lista.length ? lista.map((a) => {
      const r = calcAval(a);
      return `<a class="card tap av-item" href="#/relatorio/${a.id}"><div class="hist-date"><b>${dia(a.data).getDate()}</b><span>${MESES[dia(a.data).getMonth()]}</span></div>
        <div class="grow"><div class="h3">Avaliação de ${fmtDia(a.data)}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${a.peso ? `<span class="tag">${f1(a.peso)} kg</span>` : ''}${r.gordura != null ? `<span class="tag acc">${f1(r.gordura)}% gordura</span>` : ''}<span class="tag">${a.metodo === 'bioimpedancia' ? 'Bioimpedância' : esc((PROTOCOLOS[a.protocolo] || {}).nome || 'Medidas')}</span></div></div>${I.chev}</a>`;
    }).join('') : `<div class="empty"><div class="h3">Nenhuma avaliação ainda</div><p class="small">${staff ? 'Registre a primeira avaliação física deste aluno.' : 'Quando seu treinador fizer a sua avaliação física, o relatório aparece aqui.'}</p></div>`}</div>`;
}

async function formAvaliacao(alunoId, avId) {
  loading();
  const [{ data: m }, avs] = await Promise.all([sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(), buscarAvaliacoes(alunoId)]);
  if (!m) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div></div>'; return; }
  const ant = avs[avs.length - 1];
  const av = avId ? avs.find((a) => a.id === avId) : {
    data: hojeISO(), proxima: somaDias(hojeISO(), 60), sexo: m.sexo || ant?.sexo || '', idade: idadeEm(m.nascimento, hojeISO()) ?? ant?.idade ?? null,
    altura: ant?.altura ?? null, metodo: ant?.metodo || 'dobras', protocolo: ant?.protocolo || 'pollock7', dobras: {}, bio: {}, perimetros: {},
  };
  if (!av) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Avaliação não encontrada</div></div>'; return; }
  const v = (x) => (x == null ? '' : String(x).replace('.', ','));
  const inp = (name, val, ph = '', unid = '') => `<div class="inp-u"><input class="input" name="${name}" data-mask="dec" inputmode="decimal" value="${esc(v(val))}" placeholder="${ph}">${unid ? `<em>${unid}</em>` : ''}</div>`;
  const radios = (name, val, ops) => `<div class="radios">${ops.map(([k, l]) => `<label><input type="radio" name="${name}" value="${k}" ${val === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  $app.innerHTML = `
    <a class="back" href="#/aluno/${alunoId}/avaliacoes">${I.back} ${esc(m.nome)}</a>
    <p class="eyebrow">${avId ? 'Editar avaliação' : 'Nova avaliação física'}</p><h1 class="h1">${esc(firstName(m.nome))}</h1>
    ${ant && !avId ? `<p class="small muted" style="margin-top:6px">Última avaliação em ${fmtDia(ant.data)}. Altura, sexo e protocolo já vieram preenchidos.</p>` : ''}
    <form id="f-av" class="av-form" autocomplete="off">
      <div class="av-main">
        <div class="card"><span class="eyebrow">Dados</span>
          <div class="grid2" style="margin-top:12px"><label class="field"><span>Data da avaliação</span><input class="input" type="date" name="data" value="${esc(av.data)}" required></label><label class="field"><span>Próxima avaliação</span><input class="input" type="date" name="proxima" value="${esc(av.proxima || '')}"></label></div>
          <div class="field"><span>Sexo (usado nas equações)</span>${radios('sexo', av.sexo, [['M', 'Masculino'], ['F', 'Feminino']])}</div>
          <div class="grid3"><label class="field"><span>Idade</span>${inp('idade', av.idade, '', 'anos')}</label><label class="field"><span>Peso</span>${inp('peso', av.peso, '', 'kg')}</label><label class="field"><span>Altura</span>${inp('altura', av.altura, '', 'cm')}</label></div>
          <div class="grid3"><label class="field"><span>PA sistólica</span>${inp('pa_sis', av.pa_sis, '120', 'mmHg')}</label><label class="field"><span>PA diastólica</span>${inp('pa_dia', av.pa_dia, '80', 'mmHg')}</label><label class="field"><span>FC repouso</span>${inp('fc_rep', av.fc_rep, '', 'bpm')}</label></div>
        </div>
        <div class="card"><span class="eyebrow">Composição corporal</span>
          <div class="field" style="margin-top:12px"><span>Método</span>${radios('metodo', av.metodo, [['dobras', 'Dobras cutâneas'], ['bioimpedancia', 'Bioimpedância']])}</div>
          <div id="b-dobras">
            <label class="field"><span>Protocolo</span><select class="input" name="protocolo">${Object.entries(PROTOCOLOS).map(([k, p]) => `<option value="${k}" ${av.protocolo === k ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></label>
            <p class="tiny dim" style="margin:-4px 0 10px">Meça até 3 vezes cada ponto (lado direito). O app usa a mediana automaticamente.</p>
            <div id="dobras">${DOBRAS.map(([k, l]) => { const ms = ((av.dobras || {})._medidas || {})[k] || [(av.dobras || {})[k]]; return `<div class="dobra-row" data-dobra="${k}"><span>${l}</span>${[0, 1, 2].map((n) => `<input class="input c" name="d_${k}_${n}" data-mask="dec" inputmode="decimal" value="${esc(v(ms[n]))}" placeholder="${n + 1}ª" aria-label="${l} medida ${n + 1}">`).join('')}<b data-med="${k}">–</b></div>`; }).join('')}</div>
            <p class="tiny dim" id="dobras-msg"></p>
          </div>
          <div id="b-bio"><div class="grid2">${BIO.map(([k, l, u]) => `<label class="field"><span>${l}</span>${inp('b_' + k, (av.bio || {})[k], '', u)}</label>`).join('')}</div></div>
        </div>
        <div class="card"><span class="eyebrow">Perímetros</span>
          <div class="grid3" style="margin-top:12px">${PERIM.map(([k, l]) => `<label class="field"><span>${l}</span>${inp('p_' + k, (av.perimetros || {})[k], '', 'cm')}</label>`).join('')}</div></div>
        <div class="card"><span class="eyebrow">Flexibilidade e observações</span>
          <label class="field" style="margin-top:12px"><span>Banco de Wells (sentar e alcançar)</span>${inp('flex', av.flexibilidade, '', 'cm')}</label>
          <label class="field"><span>Observações para o aluno</span><textarea class="textarea" name="obs" placeholder="Ex.: ótima evolução na cintura; manter foco no sono e hidratação">${esc(av.observacoes || '')}</textarea></label></div>
      </div>
      <aside class="av-side"><div class="card res-card" id="res"></div>
        <button class="btn block" type="submit" style="margin-top:12px">Salvar e ver relatório ${I.arrow}</button>
        ${avId ? '<button class="btn danger block sm" type="button" id="excluir" style="margin-top:8px">Excluir avaliação</button>' : ''}</aside>
    </form>`;
  const f = document.getElementById('f-av');
  const lerDobras = () => {
    const fd = new FormData(f); const o = {}, med = {};
    DOBRAS.forEach(([k]) => { const l = [0, 1, 2].map((n) => num(fd.get(`d_${k}_${n}`))).filter((x) => x != null); if (l.length) { o[k] = Math.round(mediana(l) * 10) / 10; if (l.length > 1) med[k] = l; } });
    if (Object.keys(med).length) o._medidas = med;
    return o;
  };
  const ler = () => {
    const fd = new FormData(f); const g = (k) => fd.get(k);
    const obj = (pre, lista) => { const o = {}; lista.forEach(([k]) => { const n = num(g(pre + k)); if (n != null) o[k] = n; }); return o; };
    const int = (k) => { const n = num(g(k)); return n == null ? null : Math.round(n); };
    const metodo = g('metodo') || 'dobras';
    return { data: g('data'), proxima: g('proxima') || null, sexo: g('sexo') || null, idade: int('idade'), peso: num(g('peso')), altura: num(g('altura')),
      pa_sis: int('pa_sis'), pa_dia: int('pa_dia'), fc_rep: int('fc_rep'), metodo, protocolo: metodo === 'dobras' ? g('protocolo') : null,
      dobras: metodo === 'dobras' ? lerDobras() : {}, bio: metodo === 'bioimpedancia' ? obj('b_', BIO) : {}, perimetros: obj('p_', PERIM),
      flexibilidade: num(g('flex')), observacoes: (g('obs') || '').trim() || null };
  };
  const atualizar = () => {
    const a = ler(); const r = calcAval(a);
    document.getElementById('b-dobras').hidden = a.metodo !== 'dobras';
    document.getElementById('b-bio').hidden = a.metodo !== 'bioimpedancia';
    const prot = PROTOCOLOS[a.protocolo]; const usadas = prot && a.sexo ? prot[a.sexo] : prot ? [...new Set([...prot.M, ...prot.F])] : [];
    f.querySelectorAll('[data-dobra]').forEach((el) => { el.hidden = !usadas.includes(el.dataset.dobra); });
    f.querySelectorAll('[data-med]').forEach((el) => { const x = (a.dobras || {})[el.dataset.med]; el.textContent = x != null ? fN(x) + ' mm' : '–'; });
    document.getElementById('dobras-msg').textContent = !a.sexo ? 'Escolha o sexo para ver as dobras do protocolo.' : (a.protocolo !== 'faulkner' && a.idade == null) ? 'Esse protocolo usa a idade: preencha a idade.' : (a.protocolo === 'petroski' && a.sexo === 'F' && !(a.peso && a.altura)) ? 'Petroski feminino usa peso e altura: preencha os dois.' : '';
    const linha = (l, val, extra = '') => `<div class="res-l"><span>${l}</span><b>${val}</b>${extra ? `<em>${extra}</em>` : ''}</div>`;
    document.getElementById('res').innerHTML = `<span class="eyebrow">Resultado ao vivo</span>
      <div class="res-big"><b>${r.gordura != null ? f1(r.gordura) + '%' : '–'}</b><span>gordura corporal</span></div>
      ${linha('Massa gorda', r.massa_gorda != null ? f1(r.massa_gorda) + ' kg' : '–')}
      ${linha('Massa magra', r.massa_magra != null ? f1(r.massa_magra) + ' kg' : '–')}
      ${r.massa_muscular != null ? linha('Massa muscular', f1(r.massa_muscular) + ' kg') : ''}
      ${linha('IMC', r.imc != null ? f1(r.imc) : '–', clsIMC(r.imc))}
      ${linha('Relação cintura/quadril', r.rcq != null ? f1(r.rcq, 2) : '–', clsRCQ(r.rcq, a.sexo))}
      ${r.soma_dobras != null ? linha('Soma das dobras', f1(r.soma_dobras) + ' mm') : ''}
      ${r.densidade != null ? linha('Densidade corporal', f1(r.densidade, 4)) : ''}
      ${a.pa_sis && a.pa_dia ? linha('Pressão arterial', a.pa_sis + '/' + a.pa_dia, clsPA(a.pa_sis, a.pa_dia)) : ''}
      ${r.fc_max ? linha('FC máxima estimada', Math.round(r.fc_max) + ' bpm', 'Tanaka: 208 − 0,7 × idade') : ''}
      ${r.tmb ? linha('Metabolismo basal', Math.round(r.tmb) + ' kcal/dia', r.tmb_metodo) : ''}`;
  };
  f.oninput = atualizar;
  f.onchange = (e) => { if (e.target.name === 'data' && m.nascimento) { const i = idadeEm(m.nascimento, e.target.value); if (i != null) f.idade.value = i; } atualizar(); };
  atualizar();
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = f.querySelector('[type=submit]');
    const a = ler(); if (!a.data) return toast('Informe a data.', true);
    if (!a.peso) return toast('Informe o peso.', true);
    btn.disabled = true;
    const row = { ...a, resultados: calcAval(a) };
    let id = avId, error;
    if (avId) ({ error } = await sb.from('nx_avaliacoes').update(row).eq('id', avId));
    else { const r = await sb.from('nx_avaliacoes').insert({ ...row, org_id: S.org.id, aluno_id: alunoId, avaliador_id: S.user.id }).select('id').single(); error = r.error; id = r.data && r.data.id; }
    if (error || !id) { btn.disabled = false; return toast('Não foi possível salvar a avaliação.', true); }
    if (!avId) notificar('avaliacao', id);
    if (a.sexo && m.sexo !== a.sexo) await sb.from('nx_membros').update({ sexo: a.sexo }).eq('org_id', S.org.id).eq('user_id', alunoId);
    toast('Avaliação salva!'); location.hash = '#/relatorio/' + id;
  };
  const ex = document.getElementById('excluir');
  if (ex) ex.onclick = async () => {
    if (!confirm('Excluir esta avaliação? Não dá para desfazer.')) return;
    const { error } = await sb.from('nx_avaliacoes').delete().eq('id', avId);
    error ? toast('Não foi possível excluir.', true) : (toast('Avaliação excluída.'), location.hash = `#/aluno/${alunoId}/avaliacoes`);
  };
}

async function viewRelatorio(avId) {
  loading();
  const { data: av, error } = await sb.from('nx_avaliacoes').select('*').eq('id', avId).maybeSingle();
  if (error) throw error;
  if (!av) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Relatório não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>'; return; }
  const [avs, nome] = await Promise.all([buscarAvaliacoes(av.aluno_id), S.staff
    ? sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', av.aluno_id).maybeSingle().then((r) => r.data?.nome || 'Aluno')
    : Promise.resolve(S.me.nome)]);
  const idx = avs.findIndex((a) => a.id === av.id); const ant = idx > 0 ? avs[idx - 1] : null; const ate = avs.slice(0, idx + 1);
  const r = calcAval(av), ra = ant ? calcAval(ant) : {};
  const voltar = S.staff ? `#/aluno/${av.aluno_id}/avaliacoes` : '#/historico/avaliacoes';
  const met = (l, val, prev, unid, bom, dec = 1, sub = '') => val == null ? '' : `<div class="metric"><span>${l}</span><b>${f1(val, dec)}<small>${unid}</small></b>${prev != null ? deltaTag(val - prev, bom, unid ? ' ' + unid.trim() : '', dec) : ''}${sub ? `<em>${sub}</em>` : ''}</div>`;
  const tabela = (lista, cur, prev, unid) => {
    const ln = lista.filter(([k]) => (cur || {})[k] != null); if (!ln.length) return '';
    return `<div class="tbl">${ln.map(([k, l]) => `<div><span>${l}</span><b>${fN(cur[k])} ${unid}</b>${prev && prev[k] != null ? deltaTag(cur[k] - prev[k], null, '') : '<span></span>'}</div>`).join('')}</div>`;
  };
  const sx = av.sexo;
  const pts = (fn) => ate.map((a) => ({ x: fmtCurto(a.data), y: fn(a) })).filter((p) => p.y != null && isFinite(p.y));
  const pPeso = pts((a) => num(a.peso)), pG = pts((a) => calcAval(a).gordura ?? null);
  $app.innerHTML = `
    <div class="no-print row between"><a class="back" href="${voltar}" style="margin:0">${I.back} Voltar</a><div class="row" style="gap:8px">${S.staff ? `<a class="btn ghost sm" href="#/aluno/${av.aluno_id}/avaliacao/${av.id}">Editar</a>` : ''}<button class="btn ghost sm" id="imprimir">Salvar PDF</button></div></div>
    <div class="rel-head"><img src="${LOGO.s()}" alt=""><div><p class="eyebrow">Relatório de avaliação física</p><h1 class="h1" style="margin-top:4px">${esc(nome)}</h1>
      <p class="small muted">${fmtDia(av.data)}${av.idade ? ` · ${av.idade} anos` : ''}${av.altura ? ` · ${f1(av.altura, 0)} cm` : ''} · ${av.metodo === 'bioimpedancia' ? 'Bioimpedância' : esc((PROTOCOLOS[av.protocolo] || {}).nome || '')}${ant ? ` · comparado a ${fmtDia(ant.data)}` : ''}</p></div></div>
    <div class="metrics">
      ${met('Peso', num(av.peso), ant ? num(ant.peso) : null, ' kg', null)}
      ${met('Gordura corporal', r.gordura, ra.gordura, '%', 'down')}
      ${met('Massa magra', r.massa_magra, ra.massa_magra, ' kg', 'up')}
      ${met('Massa gorda', r.massa_gorda, ra.massa_gorda, ' kg', 'down')}
      ${met('Massa muscular', r.massa_muscular, ra.massa_muscular, ' kg', 'up')}
      ${met('IMC', r.imc, ra.imc, '', null, 1, clsIMC(r.imc))}
      ${met('Cintura/quadril', r.rcq, ra.rcq, '', 'down', 2, clsRCQ(r.rcq, sx))}
      ${met('Cintura', num((av.perimetros || {}).cintura), ant ? num((ant.perimetros || {}).cintura) : null, ' cm', 'down', 1, clsCint(num((av.perimetros || {}).cintura), sx))}
    </div>
    ${pPeso.length > 1 || pG.length > 1 ? `<div class="grid2 g-charts" style="margin-top:12px">${pPeso.length > 1 ? `<div class="card" style="padding:12px 8px"><span class="small muted" style="padding-left:6px;font-weight:700">Peso (kg)</span>${grafico(pPeso)}</div>` : ''}${pG.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">% de gordura</span>${grafico(pG, { unid: '%' })}</div>` : ''}</div>` : ''}
    ${Object.keys(av.perimetros || {}).length ? `<div class="section"><div class="section-h"><h2 class="h2">Perímetros</h2>${slashes}</div>${tabela(PERIM, av.perimetros, ant && ant.perimetros, 'cm')}</div>` : ''}
    ${av.metodo === 'dobras' && Object.keys(av.dobras || {}).length ? `<div class="section"><div class="section-h"><h2 class="h2">Dobras cutâneas</h2>${slashes}</div>${tabela(DOBRAS, av.dobras, ant && ant.metodo === 'dobras' && ant.dobras, 'mm')}${r.soma_dobras != null ? `<p class="small muted" style="margin-top:8px">Soma do protocolo: <b>${f1(r.soma_dobras)} mm</b>${ra.soma_dobras != null ? ' ' + deltaTag(r.soma_dobras - ra.soma_dobras, 'down', ' mm') : ''}</p>` : ''}</div>` : ''}
    ${av.metodo === 'bioimpedancia' && Object.keys(av.bio || {}).length ? `<div class="section"><div class="section-h"><h2 class="h2">Bioimpedância</h2>${slashes}</div><div class="tbl">${BIO.filter(([k]) => av.bio[k] != null).map(([k, l, u]) => `<div><span>${l}</span><b>${f1(av.bio[k])} ${u}</b>${ant && ant.bio && ant.bio[k] != null ? deltaTag(av.bio[k] - ant.bio[k], null, '') : '<span></span>'}</div>`).join('')}</div></div>` : ''}
    ${av.pa_sis || av.fc_rep || av.flexibilidade != null || r.tmb ? `<div class="section"><div class="section-h"><h2 class="h2">Outros dados</h2>${slashes}</div><div class="tbl">
      ${av.pa_sis ? `<div><span>Pressão arterial${av.pa_dia ? `<br><em class="tbl-sub">${clsPA(av.pa_sis, av.pa_dia)}</em>` : ''}</span><b>${av.pa_sis}/${av.pa_dia || '–'} mmHg</b><span></span></div>` : ''}
      ${r.tmb ? `<div><span>Metabolismo basal<br><em class="tbl-sub">${r.tmb_metodo}</em></span><b>${Math.round(r.tmb)} kcal/dia</b><span></span></div>` : ''}
      ${av.fc_rep ? `<div><span>FC de repouso</span><b>${av.fc_rep} bpm</b>${ant && ant.fc_rep ? deltaTag(av.fc_rep - ant.fc_rep, 'down', '', 0) : '<span></span>'}</div>` : ''}
      ${av.flexibilidade != null ? `<div><span>Flexibilidade (Wells)</span><b>${f1(av.flexibilidade)} cm</b>${ant && ant.flexibilidade != null ? deltaTag(av.flexibilidade - ant.flexibilidade, 'up', '') : '<span></span>'}</div>` : ''}</div></div>` : ''}
    ${r.fc_max ? `<div class="section"><div class="section-h"><h2 class="h2">Zonas de frequência cardíaca</h2>${slashes}</div>
      <p class="small muted" style="margin-bottom:10px">FC máxima estimada <b style="color:var(--ink)">${Math.round(r.fc_max)} bpm</b> (Tanaka)${av.fc_rep ? ` · zonas por FC de reserva (Karvonen), repouso ${av.fc_rep} bpm` : ' · percentual da FC máxima'}</p>
      <div class="zonas">${zonasFC(r.fc_max, av.fc_rep).map((z, i) => `<div class="zona z${i + 1}"><b>${z.z}</b><span>${z.n}</span><em>${z.de}–${z.ate} bpm</em></div>`).join('')}</div></div>` : ''}
    ${av.observacoes ? `<div class="card" style="margin-top:24px;border-color:rgba(70,214,255,.3)"><span class="eyebrow">Recado do avaliador</span><p style="margin-top:6px;white-space:pre-line">${esc(av.observacoes)}</p></div>` : ''}
    ${av.proxima ? `<div class="card"><span class="eyebrow">Próxima avaliação</span><div class="h3" style="margin-top:4px">${fmtDia(av.proxima)}</div></div>` : ''}
    <p class="tiny dim" style="margin-top:16px">Os percentuais de gordura são estimativas por equações de referência (Jackson & Pollock, Petroski, Faulkner, conversão de Siri) ou pela balança de bioimpedância. Servem para acompanhar a sua evolução ao longo do tempo e não são diagnóstico. Classificações de IMC, cintura e cintura/quadril seguem a OMS; pressão arterial, a Diretriz Brasileira de Hipertensão (2020). FC máxima por Tanaka (2001); zonas por Karvonen; metabolismo basal por Katch-McArdle ou Mifflin-St Jeor.</p>
    <p class="tiny dim" style="margin-top:6px">Nexos Performance e Saúde · São Luís–MA</p>`;
  document.getElementById('imprimir').onclick = () => window.print();
}

/* ---------- conversa aluno ↔ treinador ---------- */
async function contarMsgNovas() {
  let q = sb.from('nx_mensagens').select('aluno_id,autor_id').eq('org_id', S.org.id).eq('lida', false).limit(1000);
  if (!S.staff) q = q.eq('aluno_id', S.user.id);
  const [{ data }, vis] = await Promise.all([q, S.staff ? idsMeusAlunos() : null]);
  const l = (data || []).filter((m) => (S.staff ? m.autor_id === m.aluno_id && vis.has(m.aluno_id) : m.autor_id !== S.user.id));
  S.cache.msgNovas = l.length; S.cache.msgPorAluno = {};
  l.forEach((m) => { S.cache.msgPorAluno[m.aluno_id] = (S.cache.msgPorAluno[m.aluno_id] || 0) + 1; });
  return l;
}
async function viewConversa(alunoId, box, staff, sessaoId) {
  let ref = null;
  if (sessaoId) { const { data } = await sb.from('nx_sessoes').select('id,treino_titulo,iniciado_em,comentario,esforco').eq('id', sessaoId).maybeSingle(); ref = data; }
  const equipeToda = await carregarEquipe();
  const porId = Object.fromEntries(equipeToda.map((p) => [p.user_id, p]));
  const resp = !staff && S.me.treinador_id && porId[S.me.treinador_id];
  const equipe = resp ? [resp] : equipeToda;
  const nomesEq = equipe.map((p) => firstName(p.nome));
  if (staff) { const { data: al } = await sb.from('nx_membros').select('user_id,nome,foto_url').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(); if (al) porId[al.user_id] = al; }
  box.innerHTML = `${staff ? '' : `<p class="eyebrow">Conversa</p>
    <div class="treinador-top">${equipe.length ? `<div class="fotos-eq">${equipe.slice(0, 3).map((p) => fotoHTML(p, 'md')).join('')}</div>` : ''}<div class="grow" style="min-width:0"><h1 class="h2">${equipe.length ? esc(nomesEq.length > 1 ? nomesEq.slice(0, -1).join(', ') + ' e ' + nomesEq[nomesEq.length - 1] : nomesEq[0]) : 'Seu treinador'}</h1><p class="small muted">${equipe.length > 1 ? 'Treinadores da Nexos' : 'Seu treinador na Nexos'} · <span class="online-dot"></span> ${equipe.length > 1 ? 'respondem' : 'responde'} por aqui</p></div></div>
    <p class="small muted" style="margin-top:12px">Dúvidas, ajustes no treino ou como você está se sentindo.</p>`}
    <div class="chat" id="chat">${esqBloco('chat')}</div>
    <form class="composer" id="f-msg">
      <div id="ref-box"></div>
      <div class="row" style="gap:8px;align-items:flex-end"><textarea class="textarea" name="texto" rows="1" maxlength="2000" placeholder="${staff ? 'Escreva para o aluno…' : 'Escreva para o seu treinador…'}" required></textarea><button class="btn send" aria-label="Enviar">${I.arrow}</button></div>
    </form>`;
  const $chat = box.querySelector('#chat'), f = box.querySelector('#f-msg');
  const drawRef = () => { box.querySelector('#ref-box').innerHTML = ref ? `<div class="ref-chip"><span>Respondendo ao check-in: <b>${esc(ref.treino_titulo || 'Treino')}</b> · ${fmtData(ref.iniciado_em)}</span><button type="button" class="icon-btn" id="ref-x" aria-label="Remover">${I.x}</button></div>` : ''; const x = box.querySelector('#ref-x'); if (x) x.onclick = () => { ref = null; drawRef(); }; };
  drawRef();
  let assin = '';
  const ladoMeu = (m) => (staff ? m.autor_id !== alunoId : m.autor_id === S.user.id);
  const carregar = async () => {
    const { data, error } = await sb.from('nx_mensagens').select('*, nx_sessoes(treino_titulo,iniciado_em)').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('criado_em').limit(400);
    if (error || !document.body.contains($chat)) return;
    const msgs = data || []; S.chatMsgs = msgs;
    const nova = msgs.map((m) => m.id + (m.lida ? 1 : 0)).join();
    if (nova !== assin) {
      assin = nova; let ult = '';
      $chat.innerHTML = msgs.length ? msgs.map((m) => {
        const d = new Date(m.criado_em).toDateString(); const sep = d !== ult ? `<div class="day-sep">${quando(m.criado_em) === 'hoje' ? 'Hoje' : quando(m.criado_em) === 'ontem' ? 'Ontem' : fmtData(m.criado_em)}</div>` : ''; ult = d;
        const meu = ladoMeu(m);
        const autor = porId[m.autor_id];
        const bolha = `<div class="bubble ${meu ? 'me' : ''}" data-msg="${m.id}">${autor && (!meu || m.autor_id !== S.user.id) && !(staff && m.autor_id === alunoId) ? `<span class="b-autor">${esc(firstName(autor.nome))}</span>` : ''}${m.nx_sessoes ? `<span class="b-ref">Sobre: ${esc(m.nx_sessoes.treino_titulo || 'treino')} · ${fmtData(m.nx_sessoes.iniciado_em)}</span>` : ''}<p>${esc(m.texto)}</p><span class="b-meta">${fmtHora(m.criado_em)}${meu && m.lida ? ' · lida' : ''}</span></div>`;
        return sep + (!meu && autor ? `<div class="b-linha">${fotoHTML(autor, 'sm')}${bolha}</div>` : bolha);
      }).join('') : `<div class="empty"><div class="h3">Nenhuma mensagem ainda</div><p class="small">${staff ? 'Mande um recado, um ajuste ou um parabéns.' : 'Mande sua primeira mensagem para o treinador.'}</p></div>`;
      $chat.scrollTop = $chat.scrollHeight;
      if (!staff) window.scrollTo(0, document.body.scrollHeight);
    }
    const naoLidas = msgs.filter((m) => !m.lida && !ladoMeu(m));
    if (naoLidas.length) {
      let q = sb.from('nx_mensagens').update({ lida: true }).eq('aluno_id', alunoId).eq('lida', false);
      q = staff ? q.eq('autor_id', alunoId) : q.neq('autor_id', S.user.id);
      await q; await contarMsgNovas(); staff ? dockStaff() : dockAluno();
      const tb = document.querySelector('[data-aba="conversa"]'); if (tb) tb.textContent = 'Conversa';
    }
  };
  const ta = f.texto;
  ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
  ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer:fine)').matches) { e.preventDefault(); f.requestSubmit(); } };
  f.onsubmit = async (e) => {
    e.preventDefault(); const texto = ta.value.trim(); if (!texto) return;
    const btn = f.querySelector('.send'); btn.disabled = true;
    const { data: nm, error } = await sb.from('nx_mensagens').insert({ org_id: S.org.id, aluno_id: alunoId, autor_id: S.user.id, texto, sessao_id: ref ? ref.id : null }).select('id').single();
    btn.disabled = false;
    if (error) return toast('Não foi possível enviar.', true);
    notificar('mensagem', nm && nm.id);
    ta.value = ''; ta.style.height = ''; ref = null; drawRef(); await carregar();
  };
  // pressionar a mensagem (ou botão direito no computador): copiar / apagar
  const menuMsg = (id) => {
    const m = (S.chatMsgs || []).find((x) => x.id === id); if (!m) return;
    const minha = m.autor_id === S.user.id;
    try { navigator.vibrate && navigator.vibrate(15); } catch {}
    openSheet(`<div class="msg-prev">${esc(m.texto.length > 160 ? m.texto.slice(0, 159) + '…' : m.texto)}</div>
      <div class="stack" style="margin-top:16px">
        <button class="list-item msg-ac" id="mc-copiar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><b>Copiar</b></button>
        ${minha ? `<button class="list-item msg-ac del" id="mc-apagar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg><b>Apagar para todos</b></button>` : ''}
      </div>
      <button class="btn ghost block" data-close style="margin-top:12px">Cancelar</button>`, (r) => {
      r.querySelector('#mc-copiar').onclick = async () => {
        try { await navigator.clipboard.writeText(m.texto); } catch { const t = document.createElement('textarea'); t.value = m.texto; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
        closeSheet(); toast('Mensagem copiada');
      };
      const ap = r.querySelector('#mc-apagar');
      if (ap) ap.onclick = async () => {
        if (!ap.dataset.ok) { ap.dataset.ok = '1'; ap.querySelector('b').textContent = 'Toque de novo para apagar'; return; }
        ap.disabled = true;
        const { error } = await sb.from('nx_mensagens').delete().eq('id', m.id);
        if (error) { ap.disabled = false; return toast('Não foi possível apagar.', true); }
        closeSheet(); toast('Mensagem apagada'); assin = ''; await carregar(); contarMsgNovas();
      };
    });
  };
  let pressT = null, pressXY = null;
  $chat.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-msg]'); if (!b || e.button > 0) return;
    pressXY = [e.clientX, e.clientY]; b.classList.add('press');
    pressT = setTimeout(() => { pressT = null; b.classList.remove('press'); menuMsg(b.dataset.msg); }, 480);
  });
  const soltar = () => { if (pressT) clearTimeout(pressT); pressT = null; $chat.querySelectorAll('.press').forEach((x) => x.classList.remove('press')); };
  $chat.addEventListener('pointerup', soltar); $chat.addEventListener('pointercancel', soltar); $chat.addEventListener('pointerleave', soltar);
  $chat.addEventListener('pointermove', (e) => { if (pressXY && Math.hypot(e.clientX - pressXY[0], e.clientY - pressXY[1]) > 10) soltar(); });
  $chat.addEventListener('contextmenu', (e) => { const b = e.target.closest('[data-msg]'); if (!b) return; e.preventDefault(); soltar(); menuMsg(b.dataset.msg); });
  await carregar();
  clearInterval(S.chatT); S.chatT = setInterval(carregar, 15000);
  if (sessaoId) ta.focus();
}

/* ================= SAÚDE: termo LGPD, anamnese e PAR-Q ================= */
const TERMO_VERSAO = '2026-11.2'; // 2026-11.2: entra o termo de responsabilidade e assunção de riscos
const CONTATO = { email: 'nexosperformanceesaude@gmail.com', insta: '@nexos.perform' };
const PARQ = [
  'Algum médico já disse que você tem algum problema de coração e que só deveria fazer atividade física com supervisão de profissionais de saúde?',
  'Você sente dor no peito quando pratica atividade física?',
  'No último mês, você sentiu dor no peito quando praticou atividade física?',
  'Você perde o equilíbrio por causa de tontura ou já perdeu a consciência?',
  'Você tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
  'Você toma atualmente algum remédio para pressão arterial ou para o coração?',
  'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?',
];
const DOENCAS = ['Hipertensão', 'Diabetes', 'Doença cardíaca', 'Asma ou bronquite', 'Colesterol alto', 'Problema de tireoide', 'Hérnia de disco', 'Artrose', 'Ansiedade ou depressão', 'Outra'];
const OBJETIVOS = [['emagrecimento', 'Emagrecimento'], ['hipertrofia', 'Ganho de massa muscular'], ['corrida', 'Performance na corrida'], ['saude', 'Saúde e qualidade de vida'], ['condicionamento', 'Condicionamento físico'], ['retorno', 'Voltar depois de lesão ou pausa']];
function termoTexto() {
  return `
  <p><b>Termo de consentimento para tratamento de dados pessoais e de saúde</b> · versão ${TERMO_VERSAO}</p>
  <p>Ao usar o app da <b>Nexos Performance e Saúde</b> (assessoria esportiva de São Luís–MA, sob responsabilidade de Gabriel Vinícius e Orlando Borges), você autoriza o tratamento dos seus dados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
  <p><b>Quais dados.</b> Nome, e-mail, telefone, data de nascimento, objetivo, treinos, cargas, check-ins e mensagens. Também dados de saúde, que a LGPD chama de dados sensíveis: respostas da anamnese e do PAR-Q, medidas da avaliação física, pressão arterial, frequência cardíaca, relatos de dor e fotos de progresso e de avaliação postural.</p>
  <p><b>Para quê.</b> Exclusivamente para prescrever, acompanhar e ajustar o seu treino com segurança, montar os relatórios de evolução e falar com você. Os seus dados não são vendidos nem usados para publicidade.</p>
  <p><b>Fotos.</b> Servem só para acompanhamento técnico. Ficam em área privada, visíveis apenas para você e para os treinadores da Nexos. Nenhuma foto é publicada ou usada em divulgação sem uma autorização separada e por escrito.</p>
  <p><b>Quem acessa.</b> Você e os treinadores da Nexos. Os dados ficam guardados em servidores da Supabase localizados em São Paulo (Brasil), com acesso protegido por senha e regras de segurança no banco de dados.</p>
  <p><b>Por quanto tempo.</b> Enquanto você for aluno e, depois disso, por até 5 anos para cumprir obrigações legais, salvo se você pedir a exclusão antes, nos casos em que a lei permite.</p>
  <p><b>Seus direitos.</b> Você pode, a qualquer momento, pedir acesso, correção, cópia ou exclusão dos seus dados e revogar este consentimento (art. 18 da LGPD), pelo e-mail ${esc(CONTATO.email)} ou pelo Instagram ${esc(CONTATO.insta)}. Sem o consentimento para dados de saúde não é possível acompanhar o seu treino pelo app.</p>
  <p>Detalhes completos na <a href="../privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</p>`;
}
// termo de responsabilidade e assunção de riscos (aceito por todo aluno, com versão e data)
function termoRiscosTexto() {
  return `
  <p><b>Termo de responsabilidade e assunção de riscos</b> · versão ${TERMO_VERSAO}</p>
  <p><b>Riscos da atividade.</b> Declaro que conheço os riscos próprios da prática de corrida, musculação e outros exercícios físicos, em treinos e em provas, como lesões musculares, articulares e ósseas, mal-estar, desidratação, alterações da pressão arterial, problemas cardíacos, quedas e acidentes e, em casos extremos, morte súbita. Pratico a atividade por livre escolha e assumo esses riscos.</p>
  <p><b>Saúde.</b> Declaro estar apto para a atividade física e que as informações da minha anamnese e do PAR-Q são verdadeiras e completas. Comprometo-me a informar à Nexos, antes do treino seguinte, qualquer mudança na minha saúde, lesão, dor, medicação ou sintoma, e a apresentar atestado médico de aptidão sempre que for recomendado ou solicitado.</p>
  <p><b>Orientações.</b> Comprometo-me a seguir as orientações dos treinadores, a respeitar os meus limites e a interromper o exercício e procurar atendimento médico diante de dor no peito, falta de ar fora do normal, tontura, desmaio ou qualquer sinal de alerta.</p>
  <p><b>Limites da responsabilidade.</b> A Nexos Performance e Saúde, seus sócios e treinadores não se responsabilizam por lesões, doenças, acidentes, danos materiais ou morte decorrentes: dos riscos próprios da atividade; de condições de saúde existentes ou não informadas; do descumprimento das orientações ou da alteração do treino por conta própria; de treinos feitos sem a supervisão presencial da Nexos; de provas e eventos organizados por terceiros; de trânsito, clima, terreno ou equipamentos; de alimentação, suplementação ou uso de medicamentos e substâncias sem orientação; ou de qualquer outro fato fora do controle da Nexos.</p>
  <p><b>Menores de idade.</b> Se o aluno tiver menos de 18 anos, este termo é aceito pelo seu responsável legal, que assume as declarações acima em nome dele.</p>`;
}
async function carregarSaude(force) {
  if (S.cache.saude && !force) return S.cache.saude;
  const [{ data: c }, { data: a }] = await Promise.all([
    sb.from('nx_consentimentos').select('id,versao,aceito_em').eq('org_id', S.org.id).eq('aluno_id', S.user.id).eq('versao', TERMO_VERSAO).maybeSingle(),
    sb.from('nx_anamneses').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).maybeSingle(),
  ]);
  S.cache.saude = { termo: c || null, anamnese: a || null };
  return S.cache.saude;
}
function viewTermo() {
  $dock.hidden = true; layout('bare');
  const idade = S.me && S.me.nascimento ? idadeEm(S.me.nascimento) : null, menor = idade != null && idade < 18;
  $app.innerHTML = `
    <section class="login" style="justify-content:flex-start;padding-top:10px">
      <div class="row" style="gap:12px;margin-bottom:14px"><img src="${LOGO.s()}" alt="" style="width:44px">${slashes}</div>
      <p class="eyebrow">Antes de começar</p><h1 class="h1" style="margin-top:4px">Seus dados, suas regras</h1>
      <p class="muted small" style="margin:8px 0 14px">Para acompanhar seu treino com segurança precisamos guardar alguns dados de saúde e combinar algumas responsabilidades. Leia com calma:</p>
      <div class="card termo">${termoTexto()}</div>
      <div class="card termo" style="margin-top:12px">${termoRiscosTexto()}</div>
      <form id="f-termo" style="margin-top:16px">
        ${menor ? `<div class="card" style="margin-bottom:12px"><span class="eyebrow">Responsável legal</span><p class="small muted" style="margin:6px 0 10px">Como o aluno tem menos de 18 anos, os termos são aceitos pelo responsável.</p>
          <label class="field"><span>Nome completo do responsável</span><input class="input" name="resp_nome" required autocomplete="name"></label>
          <label class="field"><span>CPF do responsável</span><input class="input" name="resp_cpf" required inputmode="numeric" placeholder="000.000.000-00" maxlength="14"></label></div>` : ''}
        <label class="aceite"><input type="checkbox" name="a" required><span>Li e concordo com o termo e com a Política de Privacidade.</span></label>
        <label class="aceite"><input type="checkbox" name="b" required><span>Autorizo, de forma específica e destacada, o tratamento dos meus dados de saúde e das minhas fotos para o acompanhamento do treino (art. 11, I, da LGPD).</span></label>
        <label class="aceite"><input type="checkbox" name="c" required><span>Li e aceito o termo de responsabilidade e assunção de riscos${menor ? ', como responsável legal do aluno' : ''}.</span></label>
        <button class="btn block" type="submit" style="margin-top:8px">Aceitar e continuar ${I.arrow}</button>
        <button class="btn ghost block" type="button" id="recusar" style="margin-top:8px">Não aceito</button>
      </form>
    </section>`;
  const f = document.getElementById('f-termo');
  f.onsubmit = async (e) => {
    e.preventDefault(); const b = f.querySelector('[type=submit]'); b.disabled = true;
    const cpf = menor ? soDig(f.resp_cpf.value) : null;
    if (menor && cpf.length !== 11) { b.disabled = false; return toast('Confira o CPF do responsável (11 números).', true); }
    const { error } = await sb.from('nx_consentimentos').insert({ org_id: S.org.id, aluno_id: S.user.id, versao: TERMO_VERSAO, dispositivo: navigator.userAgent.slice(0, 180), termo_riscos: true,
      responsavel_nome: menor ? f.resp_nome.value.trim() : null, responsavel_cpf: menor ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : null });
    if (error && !/duplicate|unique/i.test(error.message || '')) { b.disabled = false; return toast('Não foi possível registrar. Tente de novo.', true); }
    await carregarSaude(true); router();
  };
  document.getElementById('recusar').onclick = () => openSheet(`<div class="h2">Tudo bem</div><p class="muted" style="margin:10px 0 18px">Sem o seu consentimento não conseguimos usar o app para acompanhar o seu treino. Se tiver dúvidas sobre os seus dados, fale com o seu treinador ou escreva para ${esc(CONTATO.email)}.</p><button class="btn block" data-close>Voltar e ler de novo</button><button class="btn ghost block" id="sair-t" style="margin-top:8px">Sair</button>`, (r) => { r.querySelector('#sair-t').onclick = () => { closeSheet(); sb.auth.signOut(); }; });
}

/** ficha de anamnese + PAR-Q. alunoId/nome quando o treinador edita. */
/* ---------- formulários em etapas + máscaras de números ---------- */
const soDig = (v) => String(v || '').replace(/\D/g, '');
const MASCARA = {
  tel: (v) => { const d = soDig(v).slice(0, 11); if (!d) return ''; if (d.length <= 2) return `(${d}`; const dd = d.slice(0, 2), r = d.slice(2);
    if (d.length === 11) return `(${dd}) ${r[0]} ${r.slice(1, 5)}-${r.slice(5)}`; return r.length > 4 ? `(${dd}) ${r.slice(0, 4)}-${r.slice(4)}` : `(${dd}) ${r}`; },
  data: (v) => { const d = soDig(v).slice(0, 8); return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/'); },
  hora: (v) => { const d = soDig(v).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d; },
  altura: (v) => { const d = soDig(v).slice(0, 3); return d.length > 1 ? `${d[0]},${d.slice(1)}` : d; },
  peso: (v) => { const d = soDig(v).slice(0, 4); const n = d[0] === '1' || d[0] === '2' ? 3 : 2; return d.length > n ? `${d.slice(0, n)},${d[n]}` : d; }, // 88 · 885→88,5 · 105 · 1055→105,5
  num: (v, el) => soDig(v).slice(0, +(el && el.dataset.max) || 3),
  // tempo como no relógio: 2530 → 25:30 · 12530 → 1:25:30
  tempo: (v) => { const d = soDig(v).replace(/^0+(?=\d{3})/, '').slice(0, 6); if (d.length <= 2) return d; if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`; return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`; },
  // pace: 512 → 5:12 · 1005 → 10:05
  pace: (v) => { const d = soDig(v).replace(/^0+(?=\d{3})/, '').slice(0, 4); return d.length <= 2 ? d : `${d.slice(0, -2)}:${d.slice(-2)}`; },
  // número com vírgula (km, kg, cm, R$): aceita ponto ou vírgula e mostra vírgula
  dec: (v) => { let t = String(v || '').replace(/\./g, ',').replace(/[^\d,]/g, ''); const i = t.indexOf(','); if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/,/g, '').slice(0, 2); return t; },
};
// "25/03/1995" -> "1995-03-25" (ou '' se não for uma data válida)
const dataISO = (br) => { const m = String(br || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (!m) return ''; const iso = `${m[3]}-${m[2]}-${m[1]}`; const d = new Date(iso + 'T12:00:00'); return !isNaN(d) && d.getDate() === +m[1] && d.getMonth() + 1 === +m[2] ? iso : ''; };
const dataBR = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
function aplicarMascaras(root) {
  root.querySelectorAll('[data-mask]').forEach((el) => { const fn = MASCARA[el.dataset.mask]; if (fn && el.value) el.value = fn(el.value, el); });
}
// vale para todos os campos com data-mask do app, em qualquer tela ou janela
document.addEventListener('input', (e) => { const el = e.target; const fn = el && el.dataset && MASCARA[el.dataset.mask]; if (fn) { const nv = fn(el.value, el); if (nv !== el.value) el.value = nv; } }, true);
// mostra uma etapa por vez; "Próximo" só avança quando validar(etapa) não devolve erro
function etapas(form, validar, aoAvancar) { // aoAvancar(etapa): salva na hora o que não pode se perder se a pessoa sair no meio
  form.classList.add('wz');
  const enviar = form.querySelector('[type=submit]');
  const prog = document.createElement('div'); prog.className = 'wz-prog';
  const nav = document.createElement('div'); nav.className = 'wz-nav';
  nav.innerHTML = `<button type="button" class="btn ghost" data-wz="volta">${I.back} Voltar</button><button type="button" class="btn grow" data-wz="prox">Próximo ${I.arrow}</button>`;
  form.prepend(prog); enviar.before(nav); nav.append(enviar); enviar.classList.add('grow'); enviar.classList.remove('block');
  const volta = nav.querySelector('[data-wz=volta]'), prox = nav.querySelector('[data-wz=prox]');
  let i = 0;
  const lista = () => [...form.querySelectorAll('.wz-step')].filter((x) => !x.hidden);
  const atual = () => { const L = lista(); i = Math.max(0, Math.min(i, L.length - 1)); return L[i]; };
  const checar = () => { const L = lista(), el = atual(); const ok = !validar(el); (i === L.length - 1 ? enviar : prox).classList.toggle('wz-bloq', !ok); };
  const pinta = (rolar) => {
    const L = lista(), el = atual();
    form.querySelectorAll('.wz-step').forEach((x) => x.classList.toggle('wz-on', x === el));
    prog.innerHTML = `<div class="wz-txt"><b>Etapa ${i + 1} de ${L.length}</b><span>${esc(el.dataset.titulo || '')}</span></div><div class="wz-bar">${L.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
    volta.hidden = i === 0; prox.hidden = i === L.length - 1; enviar.hidden = i !== L.length - 1;
    checar();
    if (rolar) prog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  prox.onclick = () => {
    const err = validar(atual());
    if (err) { toast(err.msg, true); const alvo = err.sel && atual().querySelector(err.sel); const box = alvo && alvo.closest('.field, .parq, .ficha-aceite, label, .card'); if (box) { box.classList.add('wz-erro'); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => box.classList.remove('wz-erro'), 1600); } return; }
    if (aoAvancar) aoAvancar(atual());
    i++; pinta(true);
  };
  volta.onclick = () => { i--; pinta(true); };
  form.addEventListener('input', checar); form.addEventListener('change', () => setTimeout(() => pinta()));
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && enviar.hidden) { e.preventDefault(); prox.click(); } });
  pinta();
  return { pinta };
}

async function viewAnamnese(opts = {}) {
  const staff = !!opts.alunoId; const alunoId = opts.alunoId || S.user.id;
  let a = opts.anamnese;
  if (a === undefined) { const { data } = await sb.from('nx_anamneses').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).maybeSingle(); a = data; }
  const r = (a && a.respostas) || {}; const pq = (a && a.parq) || {};
  const box = opts.box || $app;
  const cic = !staff && S.me.sexo === 'F' ? await buscarCiclo(S.user.id) : null;
  if (opts.gate) { $dock.hidden = true; layout('bare'); }
  const sel = (name, val, ops) => `<select class="input" name="${name}"><option value="">Selecione</option>${ops.map(([k, l]) => `<option value="${k}" ${val === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const sn = (name, val) => `<div class="radios"><label><input type="radio" name="${name}" value="nao" ${val === 'nao' ? 'checked' : ''}><span>Não</span></label><label><input type="radio" name="${name}" value="sim" ${val === 'sim' ? 'checked' : ''}><span>Sim</span></label></div>`;
  box.innerHTML = `
    ${opts.gate ? `<div class="row" style="gap:12px;margin-bottom:14px"><img src="${LOGO.s()}" alt="" style="width:44px">${slashes}</div><p class="eyebrow">Passo 2 de 2</p><h1 class="h1" style="margin-top:4px">Sua ficha de saúde</h1><p class="muted small" style="margin:8px 0 4px">Leva uns 3 minutos. Com isso o seu treinador monta um treino seguro pra você.</p>`
      : staff ? '' : `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Minha saúde</p><h1 class="h1">Anamnese e PAR-Q</h1><p class="muted small" style="margin-top:6px">Mudou alguma coisa? Atualize aqui e o seu treinador é avisado.</p><div style="margin-top:14px">${atestadoHTML(a, false)}</div>`}
    <form id="f-ana" class="stack" style="margin-top:16px">
      <div class="card wz-step" data-k="parq" data-titulo="PAR-Q"><span class="eyebrow">PAR-Q · prontidão para atividade física</span>
        <p class="tiny dim" style="margin:6px 0 4px">Responda com sinceridade. Uma resposta "sim" não impede o treino, mas pede uma conversa com o médico antes.</p>
        ${PARQ.map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1), pq['q' + (i + 1)])}</div>`).join('')}
      </div>
      <div class="stack wz-step" data-k="objetivo" data-titulo="Sobre você e objetivo">
      <div class="card"><span class="eyebrow">Sobre você</span>
        ${!staff && !S.me.sexo ? `<div class="field" style="margin-top:12px"><span>Sexo</span><div class="radios"><label><input type="radio" name="sexo_al" value="F"><span>Feminino</span></label><label><input type="radio" name="sexo_al" value="M"><span>Masculino</span></label></div></div>` : ''}
        <div class="grid2" style="margin-top:12px"><label class="field"><span>Altura</span><div class="un-wrap"><input class="input" name="altura" data-mask="altura" inputmode="numeric" placeholder="1,75" value="${esc(r.altura || '')}"><i>m</i></div></label><label class="field"><span>Peso</span><div class="un-wrap"><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="70" value="${esc(r.peso || '')}"><i>kg</i></div></label></div></div>
      <div class="card"><span class="eyebrow">Objetivo e rotina</span>
        <label class="field" style="margin-top:12px"><span>Objetivo principal</span>${sel('objetivo', r.objetivo, OBJETIVOS)}</label>
        <label class="field"><span>Conte mais sobre o seu objetivo (opcional)</span><input class="input" name="objetivo_txt" value="${esc(r.objetivo_txt || '')}" placeholder="Ex.: correr 10 km abaixo de 55 min"></label>
        <label class="field"><span>Experiência com treino</span>${sel('experiencia', r.experiencia, [['nunca', 'Nunca treinei'], ['parado', 'Parado há mais de 6 meses'], ['iniciante', 'Treino há menos de 1 ano'], ['intermediario', 'Treino de 1 a 3 anos'], ['avancado', 'Treino há mais de 3 anos']])}</label>
        <label class="field"><span>Atividades que pratica hoje</span><input class="input" name="atividades" value="${esc(r.atividades || '')}" placeholder="Ex.: corrida 3x por semana, futebol no sábado"></label>
        <div class="grid2"><label class="field"><span>Dias por semana para treinar</span>${sel('dias', r.dias, [1, 2, 3, 4, 5, 6, 7].map((n) => [String(n), n + (n === 1 ? ' dia' : ' dias')]))}</label><label class="field"><span>Tempo por treino</span>${sel('tempo', r.tempo, [['30', '30 min'], ['45', '45 min'], ['60', '1 hora'], ['90', '1h30 ou mais']])}</label></div>
        <div class="grid2"><label class="field"><span>Se corre: km por semana</span><input class="input" name="km_semana" data-mask="num" data-max="3" inputmode="numeric" value="${esc(r.km_semana || '')}"></label><label class="field"><span>Prova-alvo (se tiver)</span><input class="input" name="prova" value="${esc(r.prova || '')}" placeholder="Ex.: 10 km em março"></label></div>
      </div></div>
      <div class="card wz-step" data-k="saude" data-titulo="Histórico de saúde"><span class="eyebrow">Histórico de saúde</span>
        <div class="field" style="margin-top:12px"><span>Tem ou já teve alguma destas condições?</span><div class="chips wrap" id="doencas">${DOENCAS.map((d) => `<label class="chipc"><input type="checkbox" name="doencas" value="${d}" ${(r.doencas || []).includes(d) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div></div>
        <label class="field"><span>Detalhes das condições (se marcou alguma)</span><input class="input" name="doencas_txt" value="${esc(r.doencas_txt || '')}"></label>
        <label class="field"><span>Lesões atuais ou anteriores</span><input class="input" name="lesoes" value="${esc(r.lesoes || '')}" placeholder="Ex.: entorse no tornozelo direito em 2024"></label>
        <label class="field"><span>Sente alguma dor hoje? Onde?</span><input class="input" name="dores" value="${esc(r.dores || '')}" placeholder="Ex.: lombar ao acordar"></label>
        <label class="field"><span>Cirurgias</span><input class="input" name="cirurgias" value="${esc(r.cirurgias || '')}"></label>
        <label class="field"><span>Medicamentos de uso contínuo</span><input class="input" name="medicamentos" value="${esc(r.medicamentos || '')}"></label>
        <label class="field"><span>Alergias</span><input class="input" name="alergias" value="${esc(r.alergias || '')}"></label>
        <div class="field" id="gest-f" ${!staff && S.me.sexo === 'M' ? 'hidden' : ''}><span>Está gestante ou teve bebê nos últimos 6 meses?</span>${sn('gestante', r.gestante)}</div>
      </div>
      <div class="card wz-step" data-k="habitos" data-titulo="Hábitos"><span class="eyebrow">Hábitos</span>
        <div class="grid2" style="margin-top:12px"><div class="field"><span>Fuma?</span>${sn('fuma', r.fuma)}</div><label class="field"><span>Bebida alcoólica</span>${sel('alcool', r.alcool, [['nunca', 'Não bebo'], ['social', 'Às vezes'], ['frequente', 'Toda semana']])}</label></div>
        <div class="grid2"><label class="field"><span>Horas de sono por noite</span>${sel('sono_h', r.sono_h, [['5', 'Até 5 h'], ['6', '6 h'], ['7', '7 h'], ['8', '8 h ou mais']])}</label><label class="field"><span>Qualidade do sono</span>${sel('sono_q', r.sono_q, [['boa', 'Boa'], ['regular', 'Regular'], ['ruim', 'Ruim']])}</label></div>
        <label class="field"><span>Nível de estresse no dia a dia</span>${sel('estresse', r.estresse, [['baixo', 'Baixo'], ['medio', 'Médio'], ['alto', 'Alto']])}</label>
      </div>
      ${!staff && S.me.sexo !== 'M' ? `<div class="card wz-step" data-k="ciclo" data-titulo="Ciclo menstrual" id="ciclo-card" ${S.me.sexo === 'F' ? '' : 'hidden'}><span class="eyebrow">Ciclo menstrual · opcional</span>
        <p class="tiny dim" style="margin:6px 0 10px">Ajuda o seu treinador a ajustar a intensidade de acordo com a fase do ciclo. Só você e os treinadores da Nexos veem.</p>
        <label class="aceite"><input type="checkbox" name="cic_on" ${cic && cic.ativo ? 'checked' : ''}><span>Quero acompanhar o meu ciclo no app</span></label>
        <div id="cic-campos" ${cic && cic.ativo ? '' : 'hidden'}>
          <label class="field" style="margin-top:12px"><span>Como é o seu ciclo?</span>${sel('cic_sit', cic ? cic.situacao : 'regular', SIT_CICLO)}</label>
          <div id="cic-datas">
            <label class="field"><span>Início da última menstruação</span><input class="input" name="cic_ini" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${cic && cic.inicios && cic.inicios[0] ? dataBR(cic.inicios[0]) : ''}"></label>
            <div class="grid2"><label class="field"><span>Duração média do ciclo (dias)</span><input class="input" name="cic_cl" data-mask="num" data-max="2" inputmode="numeric" value="${cic ? cic.duracao_ciclo : 28}"></label><label class="field"><span>Dias de menstruação</span><input class="input" name="cic_dm" data-mask="num" data-max="2" inputmode="numeric" value="${cic ? cic.duracao_menstr : 5}"></label></div>
          </div>
          <p class="tiny dim">Ao marcar, você concorda que esses dados de saúde sejam usados só para orientar o seu treino (LGPD, art. 11). Pode desativar quando quiser, e os registros são apagados.</p>
        </div>
      </div>` : ''}
      <div class="card wz-step" data-k="emerg" data-titulo="Contato de emergência"><span class="eyebrow">Contato de emergência</span><p class="tiny dim" style="margin:6px 0 0">Quem a gente avisa se acontecer alguma coisa no treino.</p>
        <div class="grid2" style="margin-top:12px"><label class="field"><span>Nome</span><input class="input" name="emerg_nome" value="${esc(r.emerg_nome || '')}"></label><label class="field"><span>Telefone</span><input class="input" name="emerg_tel" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${esc(r.emerg_tel || '')}"></label></div>
      </div>
      <button class="btn block" type="submit">${opts.gate ? 'Concluir e começar' : 'Salvar ficha'} ${I.check}</button>
    </form>`;
  const f = box.querySelector('#f-ana');
  if (!staff && !opts.gate && a) bindAtestado(box, a, alunoId, () => { const el = box.querySelector('#atestado-box'); if (el) { el.outerHTML = atestadoHTML(a, false); bindAtestado(box, a, alunoId); } });
  const cc = box.querySelector('#ciclo-card');
  if (cc) {
    const mostrar = () => { cc.querySelector('#cic-campos').hidden = !f.cic_on.checked; const sit = f.cic_sit.value; cc.querySelector('#cic-datas').hidden = sit === 'contraceptivo' || sit === 'nao_menstrua'; };
    f.cic_on.onchange = mostrar; f.cic_sit.onchange = mostrar; mostrar();
    f.querySelectorAll('[name=sexo_al]').forEach((x) => x.onchange = () => { cc.hidden = f.sexo_al.value !== 'F'; if (cc.hidden) f.cic_on.checked = false; mostrar(); });
  }
  aplicarMascaras(f);
  f.querySelectorAll('[name=sexo_al]').forEach((x) => x.addEventListener('change', () => { f.querySelector('#gest-f').hidden = f.sexo_al.value === 'M'; }));
  if (!staff) {
    const vz = (n) => !f.querySelector(`[name="${n}"]`) || String(new FormData(f).get(n) || '').trim();
    etapas(f, (el) => {
      const fd = new FormData(f), k = el.dataset.k;
      if (k === 'parq') { const q = PARQ.findIndex((_, i) => !fd.get('q' + (i + 1))); return q >= 0 ? { msg: `Responda a pergunta ${q + 1} do PAR-Q.`, sel: `[name=q${q + 1}]` } : null; }
      if (k === 'objetivo') {
        if (f.querySelector('[name=sexo_al]') && !fd.get('sexo_al')) return { msg: 'Marque o seu sexo.', sel: '[name=sexo_al]' };
        const al = String(fd.get('altura') || ''); if (al && !/^[12],\d{2}$/.test(al)) return { msg: 'Confira a altura (ex.: 1,75).', sel: '[name=altura]' };
        for (const [n, m] of [['objetivo', 'Escolha o seu objetivo principal.'], ['experiencia', 'Escolha a sua experiência com treino.'], ['dias', 'Escolha quantos dias por semana pode treinar.'], ['tempo', 'Escolha o tempo por treino.']]) if (!vz(n)) return { msg: m, sel: `[name=${n}]` };
        return null;
      }
      if (k === 'saude') { if (!fd.get('gestante') && !f.querySelector('#gest-f').hidden) return { msg: 'Responda sobre gestação.', sel: '[name=gestante]' }; return null; }
      if (k === 'habitos') { for (const [n, m] of [['fuma', 'Responda se fuma.'], ['alcool', 'Responda sobre bebida alcoólica.'], ['sono_h', 'Escolha as horas de sono.'], ['sono_q', 'Escolha a qualidade do sono.'], ['estresse', 'Escolha o nível de estresse.']]) if (!vz(n)) return { msg: m, sel: `[name=${n}]` }; return null; }
      if (k === 'ciclo') { if (!f.cic_on.checked) return null; const sit = f.cic_sit.value; if (sit === 'contraceptivo' || sit === 'nao_menstrua') return null; const d = dataISO(f.cic_ini.value); return !d || d > hojeISO() ? { msg: 'Confira a data do início da última menstruação (dd/mm/aaaa).', sel: '[name=cic_ini]' } : null; }
      if (k === 'emerg') { if (String(fd.get('emerg_nome') || '').trim().length < 2) return { msg: 'Escreva o nome do contato de emergência.', sel: '[name=emerg_nome]' }; if (soDig(fd.get('emerg_tel')).length < 10) return { msg: 'Confira o telefone com DDD.', sel: '[name=emerg_tel]' }; return null; }
      return null;
    }, (el) => { if (el.dataset.k === 'ciclo') salvarCiclo(); }); // o ciclo é salvo já ao passar da etapa
  }
  const salvarCiclo = async () => {
    if (!cc || cc.hidden) return true;
    if (!f.cic_on.checked) { if (cic) { await sb.from('nx_ciclo_inicios').delete().eq('aluno_id', S.user.id); await sb.from('nx_ciclo').delete().eq('aluno_id', S.user.id); } return true; }
    const sit = f.cic_sit.value || 'regular', semData = sit === 'contraceptivo' || sit === 'nao_menstrua';
    const cl = Math.min(45, Math.max(20, parseInt(f.cic_cl.value, 10) || 28)), dm = Math.min(10, Math.max(2, parseInt(f.cic_dm.value, 10) || 5));
    const ini = dataISO(f.cic_ini.value);
    if (!semData && (!ini || ini > hojeISO())) { toast('Confira a data do início da última menstruação.', true); return false; }
    const { error } = await sb.from('nx_ciclo').upsert({ aluno_id: S.user.id, org_id: S.org.id, ativo: true, situacao: sit, duracao_ciclo: cl, duracao_menstr: dm, consentimento_em: (cic && cic.consentimento_em) || new Date().toISOString(), atualizado_em: new Date().toISOString() }, { onConflict: 'aluno_id' });
    if (error) { toast('Não foi possível salvar o ciclo.', true); return false; }
    if (!semData) await sb.from('nx_ciclo_inicios').upsert({ org_id: S.org.id, aluno_id: S.user.id, data: ini }, { onConflict: 'aluno_id,data' });
    return true;
  };
  f.onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(f);
    const parq = {}; let falta = 0;
    PARQ.forEach((_, i) => { const v = fd.get('q' + (i + 1)); if (!v) falta++; parq['q' + (i + 1)] = v || null; });
    if (falta) return toast('Responda todas as perguntas do PAR-Q.', true);
    const resp = {};
    ['altura', 'peso', 'objetivo', 'objetivo_txt', 'experiencia', 'atividades', 'dias', 'tempo', 'km_semana', 'prova', 'doencas_txt', 'lesoes', 'dores', 'cirurgias', 'medicamentos', 'alergias', 'gestante', 'fuma', 'alcool', 'sono_h', 'sono_q', 'estresse', 'emerg_nome', 'emerg_tel']
      .forEach((k) => { const v = String(fd.get(k) || '').trim(); if (v) resp[k] = v; });
    resp.doencas = fd.getAll('doencas');
    const positivo = Object.values(parq).includes('sim');
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    if (f.sexo_al && f.sexo_al.value) { await sb.rpc('nx_definir_sexo', { p_sexo: f.sexo_al.value }).catch(() => {}); S.me.sexo = f.sexo_al.value; }
    if (!(await salvarCiclo())) { btn.disabled = false; return; }
    const row = { parq, parq_positivo: positivo, respostas: resp, atualizado_em: new Date().toISOString(), visto_treinador: staff };
    let id = a && a.id, error;
    if (id) ({ error } = await sb.from('nx_anamneses').update(row).eq('id', id));
    else { const q = await sb.from('nx_anamneses').insert({ ...row, org_id: S.org.id, aluno_id: alunoId }).select('id').single(); error = q.error; id = q.data && q.data.id; }
    if (error) { btn.disabled = false; return toast('Não foi possível salvar a ficha.', true); }
    if (!staff) notificar('anamnese', id);
    toast('Ficha salva!');
    if (staff) return opts.onSave && opts.onSave();
    await carregarSaude(true);
    const seguir = () => { const alvo = opts.gate ? '#/' : '#/perfil'; if (location.hash === alvo || (alvo === '#/' && !location.hash)) router(); else location.hash = alvo; };
    if (positivo) {
      box.innerHTML = `<section class="login center">${estIc(I.saude)}<h1 class="h1" style="margin-top:8px">Converse com um médico</h1>
        <p class="muted" style="margin:12px 0 18px">Você respondeu "sim" em pelo menos uma pergunta do PAR-Q. Antes de começar ou aumentar a intensidade dos treinos, procure um médico para uma avaliação. Seu treinador já foi avisado e vai ajustar o treino com você.</p>
        <div style="text-align:left;width:100%">${atestadoHTML({ id, parq_positivo: true, atestado_path: a && a.atestado_path, atestado_em: a && a.atestado_em }, false)}</div>
        <button class="btn" id="seguir" style="margin-top:16px">${a && a.atestado_path ? 'Continuar' : 'Enviar depois e continuar'}</button></section>`;
      bindAtestado(box, { id, parq_positivo: true, atestado_path: a && a.atestado_path, atestado_em: a && a.atestado_em }, alunoId, seguir);
      box.querySelector('#seguir').onclick = seguir; window.scrollTo(0, 0); return;
    }
    seguir();
  };
}
// atestado médico (quando o PAR-Q tem "sim"): foto ou PDF guardado na área privada
function atestadoHTML(a, staff) {
  if (!a || !a.parq_positivo) return '';
  const ok = !!a.atestado_path;
  return `<div class="card atestado ${ok ? 'ok' : ''}" id="atestado-box"><div><div>
    <span class="eyebrow">Atestado médico</span>
    <b style="display:block;margin-top:2px">${ok ? `Enviado em ${fmtDia(a.atestado_em)}` : staff ? 'Ainda não enviado' : 'Envie o seu atestado de aptidão'}</b>
    <p class="small muted" style="margin-top:4px">${ok ? (staff ? 'Liberação médica guardada na área privada do aluno.' : 'Obrigado. O seu treinador já pode ver a liberação.') : staff ? 'O PAR-Q teve “sim”. Peça a liberação médica antes de intensificar o treino.' : 'Como o PAR-Q teve “sim”, envie o atestado do seu médico liberando a atividade física (foto ou PDF).'}</p>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${ok ? '<button type="button" class="btn ghost sm" data-at="ver">Ver atestado</button>' : ''}${!staff ? `<label class="btn ${ok ? 'ghost' : ''} sm" style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg> ${ok ? 'Trocar' : 'Enviar atestado'}<input type="file" accept="image/*,application/pdf" data-at="arq" hidden></label>` : ''}</div>
  </div></div></div>`;
}
function bindAtestado(box, a, alunoId, aoMudar) {
  const el = box && box.querySelector('#atestado-box'); if (!el) return;
  const ver = el.querySelector('[data-at="ver"]');
  if (ver) ver.onclick = async () => { const { data, error } = await sb.storage.from('nx-fotos').createSignedUrl(a.atestado_path, 600); if (error || !data) return toast('Não foi possível abrir o atestado.', true); window.open(data.signedUrl, '_blank', 'noopener'); };
  const inp = el.querySelector('[data-at="arq"]');
  if (inp) inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const pdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
    if (pdf && f.size > 5 * 1024 * 1024) return toast('O PDF passa de 5 MB. Envie uma foto do atestado.', true);
    const lb = inp.closest('label'); lb.classList.add('carregando'); lb.firstChild && (lb.childNodes[1].textContent = ' Enviando…');
    try {
      const corpo = pdf ? f : await comprimirImagem(f, 2000);
      const caminho = `${S.org.id}/${alunoId}/atestado-${Date.now()}.${pdf ? 'pdf' : 'jpg'}`;
      const { error } = await sb.storage.from('nx-fotos').upload(caminho, corpo, { contentType: pdf ? 'application/pdf' : 'image/jpeg', upsert: false });
      if (error) throw error;
      const quando = new Date().toISOString();
      const { error: e2 } = await sb.from('nx_anamneses').update({ atestado_path: caminho, atestado_em: quando, visto_treinador: false }).eq('id', a.id);
      if (e2) throw e2;
      a.atestado_path = caminho; a.atestado_em = quando;
      notificar('anamnese', a.id); toast('Atestado enviado! O seu treinador foi avisado.');
      aoMudar ? aoMudar() : (el.outerHTML = atestadoHTML(a, false), bindAtestado(box, a, alunoId));
    } catch (e) { console.error(e); toast('Não foi possível enviar. Verifique a internet e tente de novo.', true); lb.classList.remove('carregando'); }
  };
}
function anamneseResumoHTML(a, termo) {
  const termoH = (termo ? `<span class="tag ok">Termo aceito em ${fmtDia(termo.aceito_em)} · v${esc(termo.versao)}</span>${termo.termo_riscos ? '<span class="tag ok">Assunção de riscos aceita</span>' : '<span class="tag warn">Falta aceitar o termo de riscos</span>'}${termo.responsavel_nome ? `<span class="tag">Responsável: ${esc(termo.responsavel_nome)}</span>` : ''}` : '<span class="tag warn">Termo ainda não aceito</span>')
    + (a && a.parq_positivo ? (a.atestado_path ? '<span class="tag ok">Atestado enviado</span>' : '<span class="tag err">Sem atestado médico</span>') : '');
  if (!a) return `<div class="row" style="gap:6px;flex-wrap:wrap">${termoH}</div><div class="empty" style="margin-top:12px"><div class="h3">Ficha ainda não preenchida</div><p class="small">O aluno preenche a anamnese no primeiro acesso ao app. Você também pode preencher junto com ele.</p></div>`;
  const r = a.respostas || {}; const nomeOp = (lista, v) => (lista.find((x) => x[0] === v) || [, v])[1];
  const linha = (l, v) => v ? `<div><span>${l}</span><b>${esc(v)}</b></div>` : '';
  const sim = PARQ.map((q, i) => [i + 1, q, (a.parq || {})['q' + (i + 1)]]).filter((x) => x[2] === 'sim');
  return `<div class="row" style="gap:6px;flex-wrap:wrap">${termoH}<span class="tag">Atualizada ${quando(a.atualizado_em)}</span></div>
    <div class="card" style="margin-top:12px;${a.parq_positivo ? 'border-color:rgba(255,207,92,.45)' : ''}"><span class="eyebrow" style="${a.parq_positivo ? 'color:var(--warn)' : ''}">PAR-Q ${a.parq_positivo ? '· atenção' : '· sem alterações'}</span>
      ${a.parq_positivo ? `<p class="small" style="margin:6px 0 8px">Respondeu <b>sim</b> em:</p>${sim.map(([n, q]) => `<p class="small" style="margin-top:6px">${icT(I.alerta, 'warn')}${n}. ${q}</p>`).join('')}<p class="tiny dim" style="margin-top:12px">Recomendado pedir liberação médica antes de intensificar o treino.</p>` : '<p class="small muted" style="margin-top:6px">Respondeu "não" a todas as perguntas.</p>'}
    </div>
    ${atestadoHTML(a, true)}
    <div class="card"><span class="eyebrow">Ficha</span><div class="kv" style="margin-top:8px">
      ${linha('Altura e peso', [r.altura && r.altura + ' m', r.peso && r.peso + ' kg'].filter(Boolean).join(' · '))}
      ${linha('Objetivo', [nomeOp(OBJETIVOS, r.objetivo), r.objetivo_txt].filter(Boolean).join(' · '))}
      ${linha('Experiência', { nunca: 'Nunca treinou', parado: 'Parado há mais de 6 meses', iniciante: 'Menos de 1 ano', intermediario: '1 a 3 anos', avancado: 'Mais de 3 anos' }[r.experiencia])}
      ${linha('Pratica hoje', r.atividades)}
      ${linha('Disponibilidade', [r.dias && r.dias + 'x por semana', r.tempo && r.tempo + ' min'].filter(Boolean).join(' · '))}
      ${linha('Corrida', [r.km_semana && r.km_semana + ' km/semana', r.prova].filter(Boolean).join(' · '))}
      ${linha('Condições', [(r.doencas || []).join(', '), r.doencas_txt].filter(Boolean).join(' · '))}
      ${linha('Lesões', r.lesoes)}${linha('Dor atual', r.dores)}${linha('Cirurgias', r.cirurgias)}${linha('Medicamentos', r.medicamentos)}${linha('Alergias', r.alergias)}
      ${r.gestante === 'sim' ? linha('Gestação/pós-parto', 'Sim') : ''}
      ${linha('Fuma', r.fuma === 'sim' ? 'Sim' : r.fuma === 'nao' ? 'Não' : '')}${linha('Álcool', { nunca: 'Não bebe', social: 'Às vezes', frequente: 'Toda semana' }[r.alcool])}
      ${linha('Sono', [r.sono_h && r.sono_h + ' h', { boa: 'boa qualidade', regular: 'qualidade regular', ruim: 'qualidade ruim' }[r.sono_q]].filter(Boolean).join(' · '))}${linha('Estresse', { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }[r.estresse])}
      ${linha('Emergência', [r.emerg_nome, r.emerg_tel].filter(Boolean).join(' · '))}
    </div></div>
    <button class="btn ghost block" id="editar-ana" style="margin-top:12px">Editar ficha</button>`;
}

/* ================= FOTOS: progresso e avaliação postural ================= */
const VISTAS = [['frente', 'Frente'], ['lado', 'Lado'], ['costas', 'Costas']];
const ACHADOS = {
  frente: [['cab_incl_d', 'Cabeça inclinada para a direita'], ['cab_incl_e', 'Cabeça inclinada para a esquerda'], ['ombro_d_alto', 'Ombro direito mais alto'], ['ombro_e_alto', 'Ombro esquerdo mais alto'], ['pelve_d_alta', 'Crista ilíaca direita mais alta'], ['pelve_e_alta', 'Crista ilíaca esquerda mais alta'], ['joelho_valgo', 'Joelhos para dentro (valgo)'], ['joelho_varo', 'Joelhos para fora (varo)'], ['pes_abd', 'Pés abertos (rotação externa)'], ['pes_adu', 'Pés para dentro (rotação interna)']],
  lado: [['cab_ant', 'Cabeça anteriorizada'], ['ombro_prot', 'Ombros projetados para frente'], ['hipercifose', 'Hipercifose torácica'], ['hiperlordose', 'Hiperlordose lombar'], ['retificacao', 'Retificação lombar'], ['antev', 'Anteversão pélvica'], ['retrov', 'Retroversão pélvica'], ['recurvato', 'Hiperextensão de joelho'], ['flexo', 'Joelho semiflexionado'], ['tronco_ant', 'Tronco inclinado para frente']],
  costas: [['esc_alada_d', 'Escápula direita alada'], ['esc_alada_e', 'Escápula esquerda alada'], ['esc_abd', 'Escápulas afastadas da coluna'], ['desvio_lat', 'Desvio lateral da coluna (sugere escoliose)'], ['gluteo_assim', 'Assimetria das pregas glúteas'], ['calc_valgo', 'Calcanhar para dentro (pé pronado)'], ['calc_varo', 'Calcanhar para fora (pé supinado)']],
};
const urlCache = {};
async function urlsAssinadas(paths) {
  const falta = paths.filter((p) => p && (!urlCache[p] || urlCache[p].exp < Date.now()));
  if (falta.length) {
    const { data } = await sb.storage.from('nx-fotos').createSignedUrls(falta, 3600);
    (data || []).forEach((d) => { if (d.signedUrl) urlCache[d.path] = { url: d.signedUrl, exp: Date.now() + 50 * 60000 }; });
  }
  return Object.fromEntries(paths.map((p) => [p, urlCache[p] ? urlCache[p].url : '']));
}
async function comprimirImagem(file, max = 1440) {
  let img;
  try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { img = await new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = URL.createObjectURL(file); }); }
  const w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}
async function enviarFoto(file, alunoId, extra) {
  const blob = await comprimirImagem(file);
  const caminho = `${S.org.id}/${alunoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage.from('nx-fotos').upload(caminho, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { error: e2 } = await sb.from('nx_fotos').insert({ org_id: S.org.id, aluno_id: alunoId, caminho, enviado_por: S.user.id, ...extra });
  if (e2) { await sb.storage.from('nx-fotos').remove([caminho]); throw e2; }
  return caminho;
}
const slotFotoHTML = (v, l, url = '', grade = false) => `<label class="foto-slot ${url ? 'tem' : ''}" data-slot="${v}">
  <input type="file" accept="image/*" capture="environment" name="f_${v}" hidden>
  <div class="foto-prev">${url ? `<img src="${esc(url)}" alt="${l}">` : `<span>${I.plus}<b>${l}</b></span>`}${grade ? '<i class="grade"></i>' : ''}</div><em>${l}</em></label>`;
function bindSlots(root, grade) {
  const files = {};
  root.querySelectorAll('[data-slot] input[type=file]').forEach((inp) => {
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return; const v = inp.closest('[data-slot]').dataset.slot; files[v] = f;
      const lab = inp.closest('[data-slot]'); lab.classList.add('tem');
      lab.querySelector('.foto-prev').innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">${grade ? '<i class="grade"></i>' : ''}`;
    };
  });
  return files;
}
const DICAS_FOTO = '<p class="tiny dim" style="margin-top:12px">Dicas: mesma luz, mesma roupa justa, mesma distância (uns 2,5 m), celular na altura do umbigo e corpo inteiro no quadro. Assim a comparação fica fiel.</p>';

async function viewFotos(alunoId, box, staff) {
  box.innerHTML = esqBloco();
  const [{ data: fotos }, { data: posts }] = await Promise.all([
    sb.from('nx_fotos').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('data').order('criado_em'),
    sb.from('nx_posturais').select('id,data,achados,observacoes').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('data', { ascending: false }),
  ]);
  const prog = (fotos || []).filter((f) => f.tipo === 'progresso');
  const datas = [...new Set(prog.map((f) => f.data))];
  const urls = await urlsAssinadas((fotos || []).map((f) => f.caminho));
  const st = { a: datas[0], b: datas[datas.length - 1], vista: 'frente', grade: false };
  const fotoDe = (d, v) => prog.filter((f) => f.data === d && f.vista === v).slice(-1)[0];
  const qtdAchados = (p) => Object.values(p.achados || {}).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
  const draw = () => {
    const vistasComFoto = VISTAS.filter(([v]) => prog.some((f) => f.vista === v));
    if (vistasComFoto.length && !vistasComFoto.some(([v]) => v === st.vista)) st.vista = vistasComFoto[0][0];
    const fa = fotoDe(st.a, st.vista), fb = fotoDe(st.b, st.vista);
    const op = (sel) => datas.map((d) => `<option value="${d}" ${d === sel ? 'selected' : ''}>${fmtDia(d)}</option>`).join('');
    const quadro = (f, d) => `<figure class="cmp-f">${f ? `<img src="${esc(urls[f.caminho])}" alt="Foto de ${fmtDia(d)}" data-foto="${f.id}">` : '<div class="cmp-vazio">Sem foto nesta vista</div>'}${st.grade ? '<i class="grade"></i>' : ''}<figcaption>${d ? fmtDia(d) : ''}</figcaption></figure>`;
    box.innerHTML = `
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" id="add-fotos">${I.plus} Fotos de progresso</button>${staff ? `<a class="btn ghost sm" href="#/aluno/${alunoId}/postural/nova">${I.plus} Avaliação postural</a>` : ''}</div>
      ${datas.length ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Antes e depois</h2>${slashes}</div>
        <div class="card cmp">
          <div class="chips">${VISTAS.map(([v, l]) => `<button class="chip ${st.vista === v ? 'on' : ''}" data-vista="${v}">${l}</button>`).join('')}<button class="chip ${st.grade ? 'on' : ''}" id="grade">Grade</button></div>
          ${datas.length > 1 ? `<div class="grid2" style="margin-top:12px"><select class="input" id="da">${op(st.a)}</select><select class="input" id="db">${op(st.b)}</select></div>` : ''}
          <div class="cmp-grid ${datas.length > 1 ? '' : 'one'}" style="margin-top:12px">${quadro(fa, st.a)}${datas.length > 1 ? quadro(fb, st.b) : ''}</div>
          ${datas.length > 1 ? `<p class="tiny dim center" style="margin-top:8px">${Math.max(0, Math.round((dia(st.b) - dia(st.a)) / 86400000))} dias entre as fotos</p>` : ''}
        </div></div>
        <div class="section"><div class="section-h"><h2 class="h2">Todas as fotos</h2>${slashes}</div>
          <div class="stack">${[...datas].reverse().map((d) => `<div class="card foto-dia"><b>${fmtDia(d)}</b><div class="thumbs">${prog.filter((f) => f.data === d).map((f) => `<button class="thumb-f" data-foto="${f.id}"><img src="${esc(urls[f.caminho])}" alt="" loading="lazy"><span>${VISTAS.find((x) => x[0] === f.vista)?.[1] || 'Foto'}</span></button>`).join('')}</div></div>`).join('')}</div></div>`
      : `<div class="empty" style="margin-top:16px"><div class="h3">Nenhuma foto de progresso ainda</div><p class="small">Tire fotos de frente, de lado e de costas a cada 4 a 8 semanas para ver a evolução lado a lado.</p></div>`}
      <div class="section"><div class="section-h"><h2 class="h2">Avaliação postural</h2>${slashes}</div>
        ${(posts || []).length ? (posts || []).map((p) => `<a class="card tap av-item" href="#/postural/${p.id}"><div class="hist-date"><b>${dia(p.data).getDate()}</b><span>${MESES[dia(p.data).getMonth()]}</span></div><div class="grow"><div class="h3">Postural de ${fmtDia(p.data)}</div><span class="small muted">${qtdAchados(p) ? qtdAchados(p) + ' ponto' + (qtdAchados(p) > 1 ? 's' : '') + ' de atenção' : 'Sem desvios marcados'}</span></div>${I.chev}</a>`).join('')
          : `<div class="empty"><div class="h3">Nenhuma avaliação postural</div><p class="small">${staff ? 'Faça a primeira com fotos de frente, lado e costas.' : 'Quando o seu treinador fizer a sua avaliação postural, ela aparece aqui.'}</p></div>`}
      </div>`;
    const g = box.querySelector('#grade'); if (g) g.onclick = () => { st.grade = !st.grade; draw(); };
    box.querySelectorAll('[data-vista]').forEach((b) => b.onclick = () => { st.vista = b.dataset.vista; draw(); });
    const da = box.querySelector('#da'), db = box.querySelector('#db');
    if (da) da.onchange = () => { st.a = da.value; draw(); }; if (db) db.onchange = () => { st.b = db.value; draw(); };
    box.querySelectorAll('[data-foto]').forEach((el) => el.onclick = () => abrirFoto((fotos || []).find((f) => f.id === el.dataset.foto)));
    box.querySelector('#add-fotos').onclick = () => novasFotos();
  };
  const abrirFoto = (f) => {
    if (!f) return;
    const podeApagar = staff || f.enviado_por === S.user.id;
    openSheet(`<p class="eyebrow">${VISTAS.find((x) => x[0] === f.vista)?.[1] || 'Foto'} · ${fmtDia(f.data)}</p><div class="foto-grande" style="margin-top:12px"><img src="${esc(urls[f.caminho])}" alt=""><i class="grade" hidden></i></div>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost sm" id="g2">Grade</button>${podeApagar ? '<button class="btn danger sm" id="apagar-f">Apagar foto</button>' : ''}<button class="btn ghost sm" data-close style="margin-left:auto">Fechar</button></div>`, (r) => {
      r.querySelector('#g2').onclick = () => { const gi = r.querySelector('.grade'); gi.hidden = !gi.hidden; };
      const ap = r.querySelector('#apagar-f');
      if (ap) ap.onclick = async () => {
        if (!confirm('Apagar esta foto? Não dá para desfazer.')) return;
        await sb.storage.from('nx-fotos').remove([f.caminho]);
        const { error } = await sb.from('nx_fotos').delete().eq('id', f.id);
        if (error) return toast('Não foi possível apagar.', true);
        closeSheet(); toast('Foto apagada.'); viewFotos(alunoId, box, staff);
      };
    });
  };
  const novasFotos = () => {
    openSheet(`<p class="eyebrow">Fotos de progresso</p><div class="h2" style="margin-top:4px">Novo registro</div>
      <label class="field" style="margin-top:16px"><span>Data</span><input class="input" type="date" id="fdata" value="${hojeISO()}"></label>
      <div class="slots">${VISTAS.map(([v, l]) => slotFotoHTML(v, l)).join('')}</div>${DICAS_FOTO}
      <button class="btn block" id="enviar-f" style="margin-top:16px">Salvar fotos</button><button class="btn ghost block" data-close style="margin-top:8px">Cancelar</button>`, (r) => {
      const files = bindSlots(r, false);
      r.querySelector('#enviar-f').onclick = async (e) => {
        const vs = Object.keys(files); if (!vs.length) return toast('Escolha pelo menos uma foto.', true);
        const b = e.currentTarget; b.disabled = true; b.textContent = 'Enviando…';
        try {
          for (const v of vs) await enviarFoto(files[v], alunoId, { tipo: 'progresso', vista: v, data: r.querySelector('#fdata').value || hojeISO() });
          closeSheet(); toast('Fotos salvas!'); viewFotos(alunoId, box, staff);
        } catch (err) { console.error(err); b.disabled = false; b.textContent = 'Salvar fotos'; toast('Não foi possível enviar. Verifique a internet.', true); }
      };
    });
  };
  draw();
}

async function formPostural(alunoId, posId) {
  loading();
  const [{ data: m }, pq] = await Promise.all([
    sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
    posId ? sb.from('nx_posturais').select('*').eq('id', posId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const p = pq.data || { data: hojeISO(), achados: {}, observacoes: '' };
  let fotos = [];
  if (posId) { const { data } = await sb.from('nx_fotos').select('*').eq('postural_id', posId); fotos = data || []; }
  const urls = await urlsAssinadas(fotos.map((f) => f.caminho));
  const fv = (v) => fotos.find((f) => f.vista === v);
  $app.innerHTML = `
    <a class="back" href="#/aluno/${alunoId}/fotos">${I.back} ${esc(m ? m.nome : 'Aluno')}</a>
    <p class="eyebrow">${posId ? 'Editar' : 'Nova'} avaliação postural</p><h1 class="h1">${esc(firstName(m ? m.nome : ''))}</h1>
    <form id="f-pos" class="stack" style="margin-top:16px">
      <div class="card"><label class="field"><span>Data</span><input class="input" type="date" name="data" value="${esc(p.data)}" required></label>
        <span class="small muted" style="font-weight:700">Fotos (com grade de referência)</span>
        <div class="slots" style="margin-top:8px">${VISTAS.map(([v, l]) => slotFotoHTML(v, l, fv(v) ? urls[fv(v).caminho] : '', true)).join('')}</div>${DICAS_FOTO}</div>
      ${VISTAS.map(([v, l]) => `<div class="card"><span class="eyebrow">Vista ${v === 'lado' ? 'lateral' : l.toLowerCase() === 'frente' ? 'anterior' : 'posterior'}</span>
        <div class="chips wrap" style="margin-top:12px">${ACHADOS[v].map(([k, t]) => `<label class="chipc"><input type="checkbox" name="${v}" value="${k}" ${((p.achados || {})[v] || []).includes(k) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>`).join('')}
      <div class="card"><label class="field"><span>Observações e orientações para o aluno</span><textarea class="textarea" name="obs" placeholder="Ex.: reforçar glúteo médio e mobilidade torácica; manter alongamento de peitoral">${esc(p.observacoes || '')}</textarea></label></div>
      <button class="btn block" type="submit">Salvar avaliação postural ${I.check}</button>
      ${posId ? '<button class="btn danger block sm" type="button" id="apagar-p">Excluir avaliação</button>' : ''}
    </form>`;
  const f = document.getElementById('f-pos');
  const files = bindSlots(f, true);
  f.onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(f); const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Salvando…';
    const achados = {}; VISTAS.forEach(([v]) => { achados[v] = fd.getAll(v); });
    const row = { data: fd.get('data'), achados, observacoes: String(fd.get('obs') || '').trim() || null };
    try {
      let id = posId;
      if (id) { const { error } = await sb.from('nx_posturais').update(row).eq('id', id); if (error) throw error; }
      else { const { data, error } = await sb.from('nx_posturais').insert({ ...row, org_id: S.org.id, aluno_id: alunoId, avaliador_id: S.user.id }).select('id').single(); if (error) throw error; id = data.id; }
      for (const v of Object.keys(files)) {
        const velha = fv(v);
        await enviarFoto(files[v], alunoId, { tipo: 'postural', vista: v, data: row.data, postural_id: id });
        if (velha) { await sb.storage.from('nx-fotos').remove([velha.caminho]); await sb.from('nx_fotos').delete().eq('id', velha.id); }
      }
      if (!posId) notificar('postural', id);
      toast('Avaliação postural salva!'); location.hash = '#/postural/' + id;
    } catch (err) { console.error(err); btn.disabled = false; btn.textContent = 'Salvar avaliação postural'; toast('Não foi possível salvar. Verifique a internet.', true); }
  };
  const ap = document.getElementById('apagar-p');
  if (ap) ap.onclick = async () => {
    if (!confirm('Excluir esta avaliação postural e as fotos dela?')) return;
    if (fotos.length) await sb.storage.from('nx-fotos').remove(fotos.map((x) => x.caminho));
    const { error } = await sb.from('nx_posturais').delete().eq('id', posId);
    error ? toast('Não foi possível excluir.', true) : (toast('Avaliação excluída.'), location.hash = `#/aluno/${alunoId}/fotos`);
  };
}

async function viewPostural(posId) {
  loading();
  const { data: p } = await sb.from('nx_posturais').select('*').eq('id', posId).maybeSingle();
  if (!p) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Avaliação não encontrada</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>'; return; }
  const [{ data: fotos }, nome] = await Promise.all([
    sb.from('nx_fotos').select('*').eq('postural_id', posId),
    S.staff ? sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', p.aluno_id).maybeSingle().then((r) => r.data?.nome || 'Aluno') : Promise.resolve(S.me.nome),
  ]);
  const urls = await urlsAssinadas((fotos || []).map((f) => f.caminho));
  const voltar = S.staff ? `#/aluno/${p.aluno_id}/fotos` : '#/historico/fotos';
  const nomeAch = (v, k) => (ACHADOS[v].find((x) => x[0] === k) || [, k])[1];
  const total = VISTAS.reduce((n, [v]) => n + ((p.achados || {})[v] || []).length, 0);
  $app.innerHTML = `
    <div class="no-print row between"><a class="back" href="${voltar}" style="margin:0">${I.back} Voltar</a><div class="row" style="gap:8px">${S.staff ? `<a class="btn ghost sm" href="#/aluno/${p.aluno_id}/postural/${p.id}">Editar</a>` : ''}<button class="btn ghost sm" id="grade-t">Grade</button><button class="btn ghost sm" id="imprimir">Salvar PDF</button></div></div>
    <div class="rel-head"><img src="${LOGO.s()}" alt=""><div><p class="eyebrow">Avaliação postural</p><h1 class="h1" style="margin-top:4px">${esc(nome)}</h1><p class="small muted">${fmtDia(p.data)} · ${total ? total + ' ponto' + (total > 1 ? 's' : '') + ' de atenção' : 'sem desvios marcados'}</p></div></div>
    <div class="post-fotos">${VISTAS.map(([v, l]) => { const f = (fotos || []).find((x) => x.vista === v); return `<figure class="cmp-f">${f ? `<img src="${esc(urls[f.caminho])}" alt="${l}">` : '<div class="cmp-vazio">Sem foto</div>'}<i class="grade" hidden></i><figcaption>${l}</figcaption></figure>`; }).join('')}</div>
    <div class="section"><div class="section-h"><h2 class="h2">O que foi observado</h2>${slashes}</div>
      ${VISTAS.map(([v, l]) => { const ls = (p.achados || {})[v] || []; return `<div class="card"><span class="eyebrow">${l}</span>${ls.length ? `<ul class="achados">${ls.map((k) => `<li>${esc(nomeAch(v, k))}</li>`).join('')}</ul>` : '<p class="small muted" style="margin-top:6px">Sem desvios marcados nesta vista.</p>'}</div>`; }).join('')}</div>
    ${p.observacoes ? `<div class="card" style="margin-top:16px;border-color:rgba(70,214,255,.3)"><span class="eyebrow">Orientações do avaliador</span><p style="margin-top:6px;white-space:pre-line">${esc(p.observacoes)}</p></div>` : ''}
    <p class="tiny dim" style="margin-top:16px">A avaliação postural por fotos é observacional: registra o alinhamento naquele momento para orientar o treino e acompanhar mudanças. Não é diagnóstico. Desvios com dor ou limitação devem ser avaliados por médico ou fisioterapeuta.</p>`;
  document.getElementById('imprimir').onclick = () => window.print();
  document.getElementById('grade-t').onclick = () => $app.querySelectorAll('.post-fotos .grade').forEach((g) => (g.hidden = !g.hidden));
}

/* ================= NOTIFICAÇÕES PUSH ================= */
const VAPID_PUB = 'BJaMy5iaiHmB1quf2fmZe0m8IabwKFr98xYW9N4y-3yGtQKNTg-CIU9kvt5NwKGsyVFBq-shuTEkVcgDz78gRBo';
const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
// Android/Chrome: guarda o pedido de instalação para o botão "Instalar o app"
let pedidoInstalar = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; if (location.hash === '#/conexoes') viewConexoes(); });
window.addEventListener('appinstalled', () => { pedidoInstalar = null; try { localStorage.setItem('nx-instalado', '1'); } catch {} if (location.hash === '#/conexoes') viewConexoes(); });
const IC_COMPART = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
const IC_MAIS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-3px"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
function instalarHTML() {
  if (instalado()) return `<div class="card inst-card ok"><b>App instalado ✓</b><p class="small muted" style="margin-top:4px">Você já está usando o app da Nexos pela tela de início.</p></div>`;
  if (ehIOS()) return `<div class="card inst-card"><b>No iPhone, pelo Safari</b><ol class="inst-passos">
      <li>Abra este link no <b>Safari</b>.</li>
      <li>Toque em <span class="inst-ic">${IC_COMPART}</span> <b>Compartilhar</b>, na barra de baixo (ou de cima).</li>
      <li>Role a lista e toque em <span class="inst-ic">${IC_MAIS}</span> <b>Adicionar à Tela de Início</b>.</li>
      <li>Toque em <b>Adicionar</b>. Pronto: o ícone da Nexos aparece junto dos seus apps.</li></ol>
      <p class="tiny dim">Depois abra sempre pelo ícone. É assim que as notificações funcionam no iPhone.</p></div>`;
  return `<div class="card inst-card"><b>No Android</b>
      ${pedidoInstalar ? `<p class="small muted" style="margin-top:4px">Um toque e o app da Nexos fica na sua tela de início, como qualquer aplicativo.</p><button class="btn block" id="inst-btn" style="margin-top:12px"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg> Instalar o app</button>` : ''}
      ${pedidoInstalar ? '<p class="tiny dim" style="margin:14px 0 0">Se o botão não funcionar:</p>' : ''}<ol class="inst-passos">
      <li>Abra este link no <b>Chrome</b>.</li>
      <li>Toque nos <b>três pontinhos ⋮</b>, no canto de cima.</li>
      <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>
      <li>Confirme em <b>Instalar</b>. O ícone da Nexos aparece junto dos seus apps.</li></ol></div>`;
}
function bindInstalar(root) {
  const b = root.querySelector('#inst-btn'); if (!b) return;
  b.onclick = async () => { if (!pedidoInstalar) return; pedidoInstalar.prompt(); const r = await pedidoInstalar.userChoice.catch(() => null); pedidoInstalar = null; if (r && r.outcome === 'accepted') toast('App instalado! Procure o ícone da Nexos na tela de início.'); viewConexoes(); };
}
let swReg = null;
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js', AREA === 'treinador' ? { scope: '/treinador/' } : undefined).then((r) => { swReg = r; r.update().catch(() => {}); }).catch(() => {}); // sempre procura versão nova do service worker
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.nav) location.href = e.data.nav;
    if (e.data && e.data.atualizado && !document.getElementById('nx-atual')) { // versão nova baixada em segundo plano
      const b = document.createElement('button'); b.id = 'nx-atual'; b.className = 'nx-atual'; b.innerHTML = 'Nova versão do app pronta · <b>Atualizar</b>'; b.onclick = () => location.reload(); document.body.append(b);
    }
  });
}
function notificar(acao, id) {
  if (!id) return;
  try { sb.functions.invoke('nx-push', { body: { acao, id } }).catch(() => {}); } catch {}
}
const b64u = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
async function inscricaoAtual() {
  if (!pushSuportado()) return null;
  try { const reg = swReg || (await navigator.serviceWorker.getRegistration()); if (!reg) return null; return await reg.pushManager.getSubscription(); } catch { return null; }
}
class ErroPT extends Error {}
async function ativarPush() {
  try { await ativarPushInterno(); }
  catch (e) { throw e instanceof ErroPT ? e : new Error('Não foi possível ativar as notificações neste navegador.'); }
}
async function ativarPushInterno() {
  if (!pushSuportado()) {
    if (ehIOS() && !instalado()) throw new ErroPT('No iPhone, primeiro adicione o app à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.');
    throw new ErroPT('Este navegador não aceita notificações.');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new ErroPT('Notificações bloqueadas. Libere nas configurações do navegador para este site.');
  const reg = swReg || (await navigator.serviceWorker.register('sw.js', AREA === 'treinador' ? { scope: '/treinador/' } : undefined)); await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUB) });
  const j = sub.toJSON();
  const { data, error } = await sb.functions.invoke('nx-push', { body: { acao: 'inscrever', org_id: S.org.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, dispositivo: navigator.userAgent.slice(0, 120) } });
  if (error || data?.erro) throw new ErroPT('Não foi possível ativar agora. Tente de novo.');
  sb.functions.invoke('nx-push', { body: { acao: 'teste' } }).catch(() => {});
  store.set('nx-push-ok', 1);
}
async function desativarPush() {
  const sub = await inscricaoAtual();
  if (sub) { await sb.functions.invoke('nx-push', { body: { acao: 'desinscrever', endpoint: sub.endpoint } }).catch(() => {}); await sub.unsubscribe(); }
  store.del('nx-push-ok');
}
function cartaoPushHTML() {
  if (store.get('nx-push-dispensado') || store.get('nx-push-ok')) return '';
  if (pushSuportado() && Notification.permission !== 'default') return '';
  if (!pushSuportado() && !(ehIOS() && !instalado())) return '';
  return `<div class="card push-card" id="push-card"><div class="row" style="gap:12px;align-items:flex-start"><span class="go">${I.bell}</span><div class="grow"><b>Ative as notificações</b><p class="small muted">${S.staff ? 'Saiba na hora quando um aluno finalizar o treino, relatar dor ou mandar mensagem.' : 'Saiba na hora quando o treinador mandar treino novo, mensagem ou relatório.'}</p>
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" id="push-on">Ativar</button><button class="link-btn small" id="push-x">Agora não</button></div></div></div></div>`;
}
function bindCartaoPush() {
  const on = document.getElementById('push-on'); if (!on) return;
  on.onclick = async () => { try { await ativarPush(); toast('Notificações ativadas!'); document.getElementById('push-card').remove(); } catch (e) { toast(e.message, true); } };
  document.getElementById('push-x').onclick = () => { store.set('nx-push-dispensado', 1); document.getElementById('push-card').remove(); };
}
async function secaoNotificacoes(el) {
  const sub = await inscricaoAtual();
  const ativo = !!sub && pushSuportado() && Notification.permission === 'granted';
  el.innerHTML = `<div class="card"><div class="row between" style="gap:12px"><div><b>Notificações neste aparelho</b><p class="small muted">${ativo ? 'Ativadas.' : !pushSuportado() ? (ehIOS() && !instalado() ? 'No iPhone, adicione o app à tela de início e abra por lá para ativar.' : 'Este navegador não aceita notificações.') : Notification.permission === 'denied' ? 'Bloqueadas no navegador. Libere nas configurações do site.' : 'Desativadas.'}</p></div>
    ${pushSuportado() && Notification.permission !== 'denied' ? `<button class="btn ${ativo ? 'ghost' : ''} sm" id="push-tg">${ativo ? 'Desativar' : 'Ativar'}</button>` : ''}</div></div>`;
  const b = el.querySelector('#push-tg');
  if (b) b.onclick = async () => { b.disabled = true; try { ativo ? await desativarPush() : await ativarPush(); toast(ativo ? 'Notificações desativadas.' : 'Notificações ativadas!'); } catch (e) { toast(e.message, true); } secaoNotificacoes(el); };
}

function viewTermoLido() {
  const t = (S.cache.saude || {}).termo;
  $app.innerHTML = `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Privacidade</p><h1 class="h1">Termo e seus dados</h1>
    ${t ? `<span class="tag ok" style="margin-top:12px">Você aceitou em ${fmtDia(t.aceito_em)} · versão ${esc(t.versao)}</span>` : ''}
    <div class="card termo" style="margin-top:16px">${termoTexto()}</div>
    <p class="small muted" style="margin-top:16px">Quer uma cópia dos seus dados, corrigir algo ou pedir a exclusão? Escreva para <b>${esc(CONTATO.email)}</b> ou fale com o seu treinador.</p>`;
}

/* ================= CORRIDA: planilha, registros, paces e evolução ================= */
const TIPOS_CORRIDA = [
  ['rodagem', 'Rodagem', 'leve'], ['regenerativo', 'Regenerativo', 'leve'], ['longao', 'Longão', 'leve'], ['ritmo', 'Ritmo / limiar', 'limiar'],
  ['intervalado', 'Intervalado', 'intervalado'], ['tiros', 'Tiros', 'tiros'], ['fartlek', 'Fartlek', 'limiar'], ['prova', 'Prova', 'maratona'], ['teste', 'Teste', 'intervalado'], ['folga', 'Day off', 'leve'],
];
const ZONAS_PACE = [['leve', 'Z2 · Leve (conversando)'], ['maratona', 'Z3 · Moderado (ritmo de maratona)'], ['limiar', 'Z4 · Limiar (forte e contínuo)'], ['intervalado', 'Z5 · Forte (VO₂máx)'], ['tiros', 'Z6 · Máximo (velocidade)']];
const TIPOS_ATIV = [['corrida', 'Corrida de rua'], ['trail', 'Trail'], ['esteira', 'Esteira'], ['caminhada', 'Caminhada']];
// tudo que chega do relógio: corrida e também força, pedal, natação e outras atividades
const NOMES_ATIV = { corrida: 'Corrida', trail: 'Trail', esteira: 'Esteira', caminhada: 'Caminhada', forca: 'Treino de força', bike: 'Pedal', natacao: 'Natação', outro: 'Atividade' };
const ehCorr = (c) => !c || !c.tipo || ['corrida', 'trail', 'esteira', 'caminhada'].includes(c.tipo);
const nomeAtiv = (c) => NOMES_ATIV[c && c.tipo] || 'Corrida';
const ARTIGO_ATIV = { caminhada: 'a caminhada', forca: 'o treino de força', bike: 'o pedal', natacao: 'a natação', outro: 'a atividade' };
const comArtigo = (c) => ARTIGO_ATIV[c && c.tipo] || 'a corrida';
const comDist = (c) => !!c && c.distancia_m >= 50 && c.tipo !== 'forca' && c.tipo !== 'outro';
/** resumo curto de qualquer atividade: corrida com km e pace, força e outras com o tempo */
const resumoAtiv = (c) => comDist(c) ? `${fmtKm(c.distancia_m, 1)} · ${ehCorr(c) ? fmtPace(paceDe(c)) : fmtDur(c.duracao_s)}` : fmtDur(c.duracao_s);
// explicação curta só dos treinos que o aluno pode não conhecer (app e Garmin Connect)
const SOBRE_TREINO = {
  ritmo: 'Forte e contínuo, sem parar. Ritmo em que você só consegue falar poucas palavras.',
  intervalado: 'Trechos fortes com recuperação entre eles. Tente fazer todos no mesmo ritmo.',
  tiros: 'Trechos curtos e bem rápidos, com recuperação entre um e outro.',
  fartlek: 'Corrida sem parar, alternando trechos mais fortes e trechos leves.',
  teste: 'Corra no seu máximo para essa distância. O resultado ajusta os seus paces.',
};
const sobreTreino = (k) => SOBRE_TREINO[k] || '';
const nomeTipo = (k) => (TIPOS_CORRIDA.find((t) => t[0] === k) || [, k || 'Corrida'])[1];
const fmtKm = (m, d = 2) => m == null ? '–' : (m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: d }) + ' km';
const fmtDur = (s) => { if (s == null) return '–'; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
const fmtDurLongo = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const fmtPace = (sPorKm) => { if (!sPorKm || !isFinite(sPorKm)) return '–'; const s = Math.round(sPorKm); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`; };
const paceDe = (c) => c && c.distancia_m > 0 ? c.duracao_s / (c.distancia_m / 1000) : null;
const lerTempo = (t) => { const p = String(t || '').trim().split(':').map((x) => +x.replace(',', '.')); if (p.some((x) => !isFinite(x))) return null; if (p.length > 1 && p.slice(1).some((x) => x >= 60)) return null; if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]; if (p.length === 2) return p[0] * 60 + p[1]; if (p.length === 1 && p[0]) return p[0] * 60; return null; };

/** VDOT de Jack Daniels a partir de uma prova/teste */
function vdotDe(distM, seg) {
  if (!distM || !seg) return null;
  const t = seg / 60, v = distM / t;
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  return vo2 / pct;
}
function paceNaFracao(vdot, f) {
  const a = 0.000104, b = 0.182258, c = -(4.6 + f * vdot);
  const v = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); // m/min
  return 60000 / v; // s/km
}
function pacesDe(vdot) {
  if (!vdot) return null;
  return { leve: [paceNaFracao(vdot, 0.74), paceNaFracao(vdot, 0.65)], maratona: [paceNaFracao(vdot, 0.84), paceNaFracao(vdot, 0.80)], limiar: [paceNaFracao(vdot, 0.89), paceNaFracao(vdot, 0.86)], intervalado: [paceNaFracao(vdot, 1.0), paceNaFracao(vdot, 0.97)], tiros: [paceNaFracao(vdot, 1.1), paceNaFracao(vdot, 1.05)] };
}
const faixaPace = (p) => p ? `${fmtPace(p[0]).replace('/km', '')}–${fmtPace(p[1])}` : '–';
const prever = (distM, seg, alvoM) => seg * Math.pow(alvoM / distM, 1.06);
/* fim da planilha de corrida de cada aluno (última data planejada) */
async function fimPlanilhas() {
  const { data } = await sb.from('nx_plano_corrida').select('aluno_id,data').eq('org_id', S.org.id).gte('data', isoDia(Date.now() - 120 * 864e5)).then((r) => r).catch(() => ({ data: [] }));
  const fim = {}; (data || []).forEach((p) => { if (!fim[p.aluno_id] || p.data > fim[p.aluno_id]) fim[p.aluno_id] = p.data; }); return fim;
}
const statusPlanilha = (fimData) => {
  if (!fimData) return { t: 'Sem planilha de corrida', cls: 'err', d: -999 };
  const d = diasAte(fimData);
  return { t: d < 0 ? `Planilha acabou em ${fmtCurto(fimData + 'T12:00:00')}` : `Planilha até ${fmtCurto(fimData + 'T12:00:00')}`, cls: d < 0 ? 'err' : d <= 6 ? 'warn' : 'ok', d };
};
const ehAniversario = (nasc, dias = 0) => { if (!nasc) return false; const h = new Date(Date.now() + dias * 864e5); return nasc.slice(5, 10) === isoDia(h).slice(5, 10); };

/* Previsões de desempenho (5K, 10K, meia e maratona), no estilo do Strava e calculadas pela Nexos.
   1) Para cada corrida dos 42 dias anteriores à data: VO2 pela velocidade (Jack Daniels) e o quanto do VO2máx ela
      exigiu, pela frequência cardíaca média (relação de Swain: %FCmáx = 0,64 × %VO2máx + 37) ou, sem FC, pelo esforço (0–10).
   2) Junta com o VDOT direto das corridas e do teste do perfil (desempenho real é piso).
   3) Converte o VDOT no tempo de cada prova (inverso da fórmula de Daniels) e ajusta meia e maratona pela
      corrida mais longa e pelo volume semanal recentes (sem base de longão, a previsão fica mais conservadora). */
const PROVAS_PREV = [[5000, '5K', '5 km'], [10000, '10K', '10 km'], [21097, '21,1', 'Meia maratona'], [42195, '42,2', 'Maratona']];
function tempoPorVdot(vdot, d) {
  let lo = (d / 1000) * 90, hi = (d / 1000) * 1200;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (vdotDe(d, m) > vdot) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function previsaoEm(corridas, perfil, ate) {
  const t1 = typeof ate === 'number' ? ate : Date.parse(ate), t0 = t1 - 42 * 864e5;
  const diretos = [], ests = []; let longa = 0, km42 = 0, n = 0;
  corridas.forEach((c) => {
    const t = Date.parse(c.data); if (!(t <= t1 && t > t0 - 14 * 864e5) || !ehCorr(c) || c.tipo === 'caminhada' || !c.distancia_m || !c.duracao_s) return;
    if (t > t1 - 56 * 864e5) longa = Math.max(longa, c.distancia_m / 1000);
    if (t <= t0) return;
    km42 += c.distancia_m / 1000;
    if (c.distancia_m < 2000 || c.duracao_s < 480) return;
    const v = c.distancia_m / (c.duracao_s / 60); if (v < 100 || v > 450) return; // m/min (entre 10:00 e 2:13 /km)
    n++;
    diretos.push(vdotDe(c.distancia_m, c.duracao_s));
    let pct = null;
    if (c.fc_media && perfil.fcMax) { const f = (c.fc_media / perfil.fcMax) * 100; if (f >= 62 && f <= 102) pct = Math.min(1, (f - 37) / 64); }
    else if (c.rpe != null && c.rpe > 0) pct = Math.min(1, 0.55 + c.rpe * 0.045);
    if (pct && pct >= 0.4) ests.push({ v: (-4.6 + 0.182258 * v + 0.000104 * v * v) / pct, p: Math.min(2, c.duracao_s / 1800) });
  });
  if (perfil.vdot && perfil.teste_data) { const tt = Date.parse(perfil.teste_data + 'T12:00:00'); if (tt <= t1 && tt > t1 - 90 * 864e5) diretos.push(perfil.vdot); }
  if (!diretos.length && !ests.length) return null;
  const dir = diretos.length ? Math.max(...diretos) : 0;
  let fis = 0;
  if (ests.length) { // média ponderada da metade de cima (os treinos que melhor mostram o condicionamento)
    ests.sort((a, b) => b.v - a.v); const top = ests.slice(0, Math.ceil(ests.length / 2));
    fis = top.reduce((a, x) => a + x.v * x.p, 0) / top.reduce((a, x) => a + x.p, 0);
  }
  let vdot = dir ? Math.max(dir, Math.min(fis, dir * 1.2)) : fis;
  vdot = Math.max(20, Math.min(80, vdot));
  const semana = km42 / 6;
  const tempos = PROVAS_PREV.map(([d]) => {
    let s = tempoPorVdot(vdot, d);
    if (d > 20000 && d < 22000 && longa < 16) s *= 1 + ((16 - longa) / 16) * 0.05;
    if (d > 40000) s *= 1 + (longa < 30 ? ((30 - longa) / 30) * 0.1 : 0) + (semana < 40 ? ((40 - semana) / 40) * 0.05 : 0);
    return s;
  });
  return { vdot, tempos, n };
}
const difTxt = (s) => { s = Math.round(Math.abs(s)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}min${s % 60 ? ' ' + (s % 60) + 's' : ''}` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`; };
/** os quatro selos (5K, 10K, meia e maratona) com o tempo, o pace e quanto mudou. Sem SVG: também vai para o PDF. */
function previsoesGrade(atual, antes, rotAntes) {
  if (!atual) return '<p class="small muted">Ainda não há corridas suficientes para calcular. Registre corridas de 2 km ou mais (com frequência cardíaca ou esforço) e as previsões aparecem aqui.</p>';
  return `<div class="pv-grade">${PROVAS_PREV.map(([d, selo, nome], i) => {
    const s = atual.tempos[i], dif = antes ? s - antes.tempos[i] : null;
    const pill = dif == null ? '' : Math.abs(dif) < 1 ? '<span class="pv-dif igual">= igual</span>' : `<span class="pv-dif ${dif < 0 ? 'melhor' : 'pior'}" title="${dif < 0 ? 'Mais rápido' : 'Mais lento'} que ${esc(rotAntes)}"><i></i>${difTxt(dif)}</span>`;
    return `<div class="pv-it"><span class="pv-selo"><b>${selo}</b>${d > 20000 ? '<small>KM</small>' : ''}</span><strong>${fmtDurLongo(s)}</strong><span class="pv-pace">${fmtPace(s / (d / 1000))}</span>${pill}<span class="pv-nome">${nome}</span></div>`;
  }).join('')}</div>`;
}
const PV_PER = [['hoje', 'Hoje', 0], ['1m', '1 M', 30], ['3m', '3 M', 90], ['6m', '6 M', 180]];
/** cartão completo para a tela: abas Hoje/1M/3M/6M e a curva dos 10 km nos últimos 6 meses */
function previsoesCard(box, corridas, perfil, { titulo = true } = {}) {
  let per = 'hoje';
  const agora = Date.now();
  const desenhar = () => {
    const off = PV_PER.find((p) => p[0] === per)[2];
    const t = agora - off * 864e5, at = previsaoEm(corridas, perfil, t), an = previsaoEm(corridas, perfil, t - 30 * 864e5);
    const hist = []; for (let w = 25; w >= 0; w--) { const p = previsaoEm(corridas, perfil, agora - w * 7 * 864e5); if (p) hist.push({ x: fmtCurto(new Date(agora - w * 7 * 864e5).toISOString()), y: +(p.tempos[1] / 60).toFixed(2) }); }
    box.innerHTML = `<div class="card pv-card">
      ${titulo ? `<div class="row between" style="gap:8px"><b class="h3">Previsões de desempenho</b>${slashes}</div>` : ''}
      <p class="small muted" style="margin-top:4px">${off ? `Como estavam há ${off === 30 ? '1 mês' : off === 90 ? '3 meses' : '6 meses'}, comparadas com os 30 dias anteriores.` : 'Suas previsões atuais em comparação com as de 30 dias atrás.'}</p>
      ${previsoesGrade(at, an, '30 dias antes')}
      <div class="seg pv-per">${PV_PER.map(([k, l]) => `<button type="button" data-pv="${k}" class="${k === per ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${hist.length > 2 ? `<div style="margin-top:14px"><span class="small muted" style="font-weight:700">Previsão dos 10 km nos últimos 6 meses · menor é melhor</span>${grafico(hist, { fmt: (v) => fmtDurLongo(v * 60) })}</div>` : ''}
      <p class="pv-cred">Baseado nas equações de Jack Daniels e em estudos de fisiologia do exercício.</p>
      <details class="ajuda" style="margin-top:6px"><summary>Como a Nexos calcula?</summary><p>Usamos as suas corridas das últimas 6 semanas: o ritmo de cada uma e quanto ela exigiu de você (pela frequência cardíaca do relógio ou pelo esforço que você marcou). Isso estima o seu condicionamento (VDOT) e vira o tempo de cada prova. Meia e maratona também dependem do seu longão e do seu volume semanal. É uma estimativa para prova em percurso plano, com o treino específico; quanto mais corridas com relógio, mais precisa.</p></details>
    </div>`;
    box.querySelector('.pv-per').onclick = (e) => { const b = e.target.closest('[data-pv]'); if (b) { per = b.dataset.pv; desenhar(); } };
  };
  desenhar();
}
async function buscarCorridasPrev(alunoId, ate = Date.now()) {
  const { data } = await sb.from('nx_corridas').select('data,tipo,distancia_m,duracao_s,fc_media,rpe').eq('aluno_id', alunoId)
    .gte('data', new Date(ate - 260 * 864e5).toISOString()).lte('data', new Date(ate).toISOString()).order('data').limit(1000).then((r) => r, () => ({ data: [] }));
  return data || [];
}

/* Fitness (carga crônica, 42 dias), Fadiga (aguda, 7 dias) e Forma (diferença) — modelo de Banister/Coggan com rTSS */
function cargaCorrida(corridas, perfil) {
  const lim = perfil && perfil.paces && perfil.paces.limiar ? (perfil.paces.limiar[0] + perfil.paces.limiar[1]) / 2 : null;
  const dia0 = new Date(); dia0.setHours(12, 0, 0, 0); const N = 120; const L = Array(N + 1).fill(0);
  corridas.forEach((c) => {
    if (!c.duracao_s || !c.distancia_m) return; const k = Math.round((dia0 - dia(isoDia(c.data))) / 864e5); if (k < 0 || k > N) return;
    const pace = c.duracao_s / (c.distancia_m / 1000);
    const IF = lim ? Math.min(1.25, Math.max(0.5, lim / pace)) : c.rpe != null ? 0.5 + c.rpe * 0.05 : 0.75;
    L[N - k] += (c.duracao_s / 3600) * IF * IF * 100;
  });
  let ctl = 0, atl = 0; L.forEach((l) => { ctl += (l - ctl) / 42; atl += (l - atl) / 7; });
  return { fitness: Math.round(ctl), fadiga: Math.round(atl), forma: Math.round(ctl - atl), temDados: L.some((x) => x > 0) };
}
function cargaHTML3(cg) {
  if (!cg.temDados) return '';
  const f = cg.forma; const est = f > 5 ? ['Descansado', 'ok'] : f >= -10 ? ['Equilibrado', 'ok'] : f >= -30 ? ['Treinando forte', 'warn'] : ['Atenção: carga alta', 'err'];
  return `<div class="card carga3"><div class="c3">${[['Fitness', cg.fitness, 'c-fit', 'Condicionamento acumulado (42 dias)'], ['Fadiga', cg.fadiga, 'c-fad', 'Cansaço recente (7 dias)'], ['Forma', cg.forma, 'c-for', 'Fitness − Fadiga']].map(([n, v, c, d]) => `<div class="c3-i" title="${d}"><b class="${c}">${v}</b><span>${n}</span></div>`).join('')}</div>
    <p class="small" style="margin-top:10px;text-align:center"><span class="tag ${est[1]}">${est[0]}</span></p>
    <details class="ajuda" style="margin-top:6px"><summary>O que são esses números?</summary><p><b>Fitness</b> é a média da carga das corridas nas últimas 6 semanas: sobe devagar conforme o aluno treina. <b>Fadiga</b> é a carga dos últimos 7 dias. <b>Forma</b> = Fitness − Fadiga: positiva quer dizer descansado (bom para prova); muito negativa (abaixo de −30) indica carga alta e risco de excesso. A carga de cada corrida é calculada pelo tempo e pela intensidade em relação ao pace de limiar do aluno.</p></details></div>`;
}

const DSEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const dsemIdx = (iso) => (dia(iso).getDay() + 6) % 7;
const diasTxt = (d) => (d && d.length ? d.slice().sort().map((i) => DSEM[i].slice(0, 3)).join(', ') : '');

function perfilCorrida(m) {
  const c = (m && m.corrida) || {};
  const vdot = vdotDe((c.teste_km || 0) * 1000, c.teste_seg);
  const idade = m && m.nascimento ? idadeEm(m.nascimento) : null;
  const fcMax = c.fc_max || (idade ? 208 - 0.7 * idade : null);
  // zonas automáticas (VDOT) + ajustes manuais do treinador, que têm prioridade
  let paces = pacesDe(vdot); const man = c.paces_manual && Object.keys(c.paces_manual).length ? c.paces_manual : null;
  if (man) paces = { ...(paces || {}), ...man };
  return { ...c, vdot, paces, manual: !!man, fcMax, fcRep: c.fc_rep || null };
}
function inicioSemana(d = new Date()) { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const isoDia = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };

function rotaSVG(rota, h = 200) {
  if (!rota || rota.length < 2) return '';
  const lats = rota.map((p) => p[0]), lons = rota.map((p) => p[1]);
  const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons), lo1 = Math.max(...lons);
  const k = Math.cos(((la0 + la1) / 2) * Math.PI / 180);
  const w = Math.max((lo1 - lo0) * k, 1e-6), hh = Math.max(la1 - la0, 1e-6);
  const W = 320, s = Math.min((W - 24) / w, (h - 24) / hh);
  const ox = (W - w * s) / 2, oy = (h - hh * s) / 2;
  const pts = rota.map(([la, lo]) => `${(ox + (lo - lo0) * k * s).toFixed(1)},${(h - oy - (la - la0) * s).toFixed(1)}`);
  const [x0, y0] = pts[0].split(','), [x1, y1] = pts[pts.length - 1].split(',');
  return `<svg class="rota" viewBox="0 0 ${W} ${h}" role="img" aria-label="Percurso"><polyline points="${pts.join(' ')}" fill="none" style="stroke:var(--acc)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x0}" cy="${y0}" r="6" style="fill:var(--ok)"/><circle cx="${x1}" cy="${y1}" r="6" style="fill:var(--ink)"/></svg>`;
}

async function buscarCorridas(alunoId, limit = 300) {
  const { data, error } = await sb.from('nx_corridas').select('id,data,titulo,tipo,distancia_m,duracao_s,fc_media,rpe,dor,fonte,plano_id,visto_treinador').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('data', { ascending: false }).limit(limit);
  if (error) throw error; return data || [];
}
async function buscarPlano(alunoId, de, ate) {
  let q = sb.from('nx_plano_corrida').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).gte('data', de).lte('data', ate).order('data');
  if (!S.staff) q = q.eq('liberado', true); // o aluno só vê semanas liberadas pelo treinador
  const { data, error } = await q;
  if (error) throw error; return data || [];
}

/* ---------- registrar corrida ---------- */
let fitCarregando = null;
function carregarLeitor() {
  if (window.NxFit) return Promise.resolve();
  if (!fitCarregando) fitCarregando = new Promise((ok, err) => { const s = document.createElement('script'); s.src = 'nxfit.js'; s.onload = ok; s.onerror = () => { fitCarregando = null; err(new Error('Não foi possível carregar o leitor de arquivos.')); }; document.head.appendChild(s); });
  return fitCarregando;
}
async function registrarCorrida(alunoId, onSalvo) {
  const plano = await buscarPlano(alunoId, isoDia(Date.now() - 4 * 864e5), isoDia(Date.now() + 2 * 864e5)).catch(() => []);
  openSheet(`<p class="eyebrow">Registrar corrida</p><div class="h2" style="margin-top:4px">Como você quer registrar?</div>
    <label class="opcao" style="margin-top:16px"><input type="file" id="arq" accept=".fit,.gpx,.tcx,application/gpx+xml,application/octet-stream" hidden><span class="go">${I.up}</span><div><b>Enviar o arquivo do relógio</b><p class="small muted">.FIT, .GPX ou .TCX. O app lê distância, tempo, FC, parciais e o percurso.</p></div></label>
    <button type="button" class="opcao" id="manual"><span class="go">${I.plus}</span><div><b>Digitar os dados</b><p class="small muted">Distância, tempo e FC que o relógio ou o app mostrou.</p></div></button>
    <details class="ajuda"><summary>Como baixar o arquivo da corrida?</summary>
      <p><b>Garmin Connect (site):</b> abra a atividade → ícone de engrenagem → Exportar original (.FIT) ou Exportar para GPX.</p>
      <p><b>Coros:</b> app Coros → atividade → ⋯ → Exportar dados → .FIT.</p>
      <p><b>Polar Flow:</b> site → atividade → Exportar sessão → .GPX ou .TCX.</p>
      <p><b>Strava (site):</b> atividade → ⋯ → Exportar GPX (ou Exportar original).</p>
      <p><b>Apple Watch:</b> use o app HealthFit (iPhone) → toque na corrida → compartilhar → arquivo .FIT.</p></details>`, (r) => {
    r.querySelector('#manual').onclick = () => formCorrida(alunoId, { data: new Date().toISOString(), fonte: 'manual' }, plano, onSalvo);
    r.querySelector('#arq').onchange = async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const lab = e.target.closest('.opcao'); lab.querySelector('b').textContent = 'Lendo o arquivo…';
      try {
        await carregarLeitor();
        const d = await window.NxFit.ler(f);
        if (!d.distancia_m || !d.duracao_s) throw new Error('Não encontrei distância e tempo nesse arquivo.');
        formCorrida(alunoId, { ...d, fonte: 'arquivo', ext_id: 'arq-' + new Date(d.data).getTime() + '-' + d.distancia_m, titulo: f.name.replace(/\.(fit|gpx|tcx)$/i, '') }, plano, onSalvo);
      } catch (err) { console.error(err); lab.querySelector('b').textContent = 'Enviar o arquivo do relógio'; toast(err.message && /[ãçéí]/.test(err.message) ? err.message : 'Não consegui ler esse arquivo. Tente o .GPX ou digite os dados.', true); }
    };
  });
}
function formCorrida(alunoId, d, plano, onSalvo) {
  const dt = new Date(d.data); dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  const diaD = isoDia(d.data);
  const prox = [...plano].sort((a, b) => Math.abs(dia(a.data) - dia(diaD)) - Math.abs(dia(b.data) - dia(diaD)));
  const sugerido = prox.find((p) => p.data === diaD);
  let rpe = d.rpe ?? null, dor = !!d.dor; const corpo = { cansaco: d.cansaco ?? null, sono: d.sono ?? null };
  const lido = d.fonte === 'arquivo' || d.fonte === 'celular';
  openSheet(`<p class="eyebrow">${d.fonte === 'arquivo' ? 'Arquivo lido ✓' : d.fonte === 'celular' ? 'Treino gravado ✓' : 'Nova corrida'}</p><div class="h2" style="margin-top:4px">Confira e salve</div>
    ${lido ? `<div class="mini-stats"><div><b>${fmtKm(d.distancia_m)}</b><span>distância</span></div><div><b>${fmtDur(d.duracao_s)}</b><span>tempo</span></div><div><b>${fmtPace(paceDe(d))}</b><span>pace</span></div></div>${d.rota ? `<div class="rota-box">${rotaSVG(d.rota, 150)}</div>` : ''}` : ''}
    <form id="f-corr" style="margin-top:16px">
      <div class="grid2"><label class="field"><span>Data e hora</span><input class="input" type="datetime-local" name="data" value="${dt.toISOString().slice(0, 16)}" required></label><label class="field"><span>Tipo</span><select class="input" name="tipo">${TIPOS_ATIV.map(([k, l]) => `<option value="${k}" ${d.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="field"><span>Distância (km)</span><input class="input" name="km" data-mask="dec" inputmode="decimal" value="${d.distancia_m ? String(+(d.distancia_m / 1000).toFixed(2)).replace('.', ',') : ''}" placeholder="Ex.: 8,2" required></label><label class="field"><span>Tempo (h:mm:ss)</span><input class="input" name="tempo" data-mask="tempo" inputmode="numeric" value="${d.duracao_s ? fmtDurLongo(d.duracao_s) : ''}" placeholder="Ex.: 45:30" required></label></div>
      <p class="small muted" id="pace-calc" style="margin:-6px 0 12px"></p>
      <div class="grid2"><label class="field"><span>FC média (bpm)</span><input class="input" name="fc_media" data-mask="num" inputmode="numeric" value="${esc(d.fc_media ?? '')}"></label><label class="field"><span>FC máxima (bpm)</span><input class="input" name="fc_max" data-mask="num" inputmode="numeric" value="${esc(d.fc_max ?? '')}"></label></div>
      ${plano.length ? `<label class="field"><span>É de qual treino da planilha?</span><select class="input" name="plano"><option value="">Corrida avulsa</option>${prox.slice(0, 8).map((p) => `<option value="${p.id}" ${(d.plano_id || sugerido?.id) === p.id ? 'selected' : ''}>${fmtData(p.data + 'T12:00:00')} · ${esc(p.titulo || nomeTipo(p.tipo))}${p.distancia_km ? ' · ' + String(p.distancia_km).replace('.', ',') + ' km' : ''}</option>`).join('')}</select></label>` : ''}
      <div class="field"><span>Esforço percebido (0 a 10)</span><div class="effort" id="rpe">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-n="${n}" class="${rpe === n ? 'on' : ''}" style="${rpe === n ? 'background:' + rpeCor(n) : ''}">${n}</button>`).join('')}</div></div>
      <div class="field"><span>Sentiu alguma dor?</span><div class="seg"><button type="button" class="${dor ? '' : 'on'}" data-dor="0">Não</button><button type="button" class="${dor ? 'on alert' : ''}" data-dor="1">Sim</button></div>
        <input class="input" id="dor-local" placeholder="Onde? Ex.: panturrilha esquerda" style="margin-top:12px" value="${esc(d.dor_local || '')}" ${dor ? '' : 'hidden'}></div>
      ${corpoHTML(corpo)}
      <label class="field"><span>Como foi? (opcional)</span><textarea class="textarea" name="comentario" placeholder="Ex.: calor forte, segurei o pace no fim">${esc(d.comentario || '')}</textarea></label>
      <button class="btn block" type="submit">Salvar corrida ${I.check}</button>
    </form>`, (r) => {
    const f = r.querySelector('#f-corr');
    const atual = () => { const km = num(f.km.value), s = lerTempo(f.tempo.value); r.querySelector('#pace-calc').textContent = km && s ? `Pace médio: ${fmtPace(s / km)}` : ''; };
    f.oninput = atual; atual();
    r.querySelector('#rpe').onclick = (e) => { const b = e.target.closest('[data-n]'); if (!b) return; rpe = +b.dataset.n; r.querySelectorAll('#rpe button').forEach((x) => { const on = +x.dataset.n === rpe; x.classList.toggle('on', on); x.style.background = on ? rpeCor(rpe) : ''; }); };
    r.querySelectorAll('[data-dor]').forEach((b) => b.onclick = () => { dor = b.dataset.dor === '1'; r.querySelectorAll('[data-dor]').forEach((x) => { x.classList.toggle('on', x === b); x.classList.toggle('alert', x === b && dor); }); r.querySelector('#dor-local').hidden = !dor; });
    bindCorpo(r, corpo);
    f.onsubmit = async (e) => {
      e.preventDefault(); const km = num(f.km.value), seg = lerTempo(f.tempo.value);
      if (!km || km <= 0) return toast('Informe a distância em km.', true);
      if (!seg) return toast('Informe o tempo, por exemplo 45:30.', true);
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      const reaproveitaArquivo = lido && Math.abs(km * 1000 - d.distancia_m) < 5;
      const row = {
        org_id: S.org.id, aluno_id: alunoId, data: new Date(f.data.value).toISOString(), tipo: f.tipo.value,
        titulo: d.titulo || null, distancia_m: Math.round(km * 1000), duracao_s: seg,
        fc_media: num(f.fc_media.value), fc_max: num(f.fc_max.value), elevacao_m: d.elevacao_m ?? null, cadencia: d.cadencia ?? null,
        rpe, dor, dor_local: dor ? (r.querySelector('#dor-local').value.trim() || null) : null, cansaco: corpo.cansaco ?? null, sono: corpo.sono ?? null,
        comentario: f.comentario.value.trim() || null, plano_id: f.plano ? (f.plano.value || null) : null,
        parciais: reaproveitaArquivo ? d.parciais : null, rota: d.rota || null, fonte: d.fonte || 'manual', ext_id: d.ext_id || null,
        analise: reaproveitaArquivo ? (d.analise || null) : null,
      };
      const { data: novo, error } = await sb.from('nx_corridas').insert(row).select('id').single();
      if (error) { btn.disabled = false; return toast(/duplicate|unique/i.test(error.message || '') ? 'Essa corrida já foi registrada.' : 'Não foi possível salvar. Verifique a internet.', true); }
      if (alunoId === S.user.id) notificar('corrida', novo.id);
      closeSheet(); toast('Corrida registrada!');
      onSalvo ? onSalvo(novo.id) : (location.hash = '#/corrida/' + novo.id);
    };
  });
}

/* ---------- detalhe de uma corrida ---------- */
/* ---------- card da corrida para compartilhar (minimalista, com a marca da Nexos) ---------- */
const CARD_STATS = [['dist', 'Distância'], ['pace', 'Pace'], ['tempo', 'Tempo'], ['fc', 'FC média'], ['elev', 'Subida'], ['cad', 'Cadência'], ['kcal', 'Calorias'], ['passos', 'Passos'], ['rota', 'Percurso'], ['data', 'Data'], ['logo', 'Logo Nexos']];
// modelos do card (inspirados nos stickers de corrida, com a cara da Nexos)
const CARD_LAYOUTS = [
  ['icones', 'Com ícones'], ['clima', 'Clima'], ['clima_faixa', 'Clima + números'], ['tiros', 'Tiros'], ['nome', 'Nome do treino'], ['classico', 'Coluna'], ['faixa', 'Faixa'], ['percurso', 'Percurso'], ['lado', 'Lado a lado'], ['mapa', 'Só o mapa'],
  ['sobre', 'Mapa + números'], ['tabela', 'Ficha'], ['ficha_mapa', 'Ficha + mapa'], ['lateral', 'Diagonal'], ['pilulas', 'Número de peito'],
  ['parciais', 'Parciais'], ['recibo', 'Medalha'], ['destaque', 'Destaque'], ['linha', 'Na foto'],
];
const cardCarregarImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const CARD_IMGS = {};
const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const cardImg = async (src) => (CARD_IMGS[src] || (CARD_IMGS[src] = await cardCarregarImg(src)));
function cardValores(c) {
  const pace = paceDe(c); const E = { ...(c.resumo_rel || {}), ...((c.analise && c.analise.extras) || {}) };
  return {
    dist: c.distancia_m ? { l: 'Distância', v: (c.distancia_m / 1000).toFixed(2).replace('.', ','), u: 'km' } : null,
    pace: pace ? { l: 'Pace', v: fmtPace(pace).replace('/km', ''), u: '/km' } : null,
    tempo: c.duracao_s ? { l: 'Tempo', v: fmtDurLongo(c.duracao_s), u: '' } : null,
    fc: c.fc_media ? { l: 'FC média', v: String(c.fc_media), u: 'bpm' } : null,
    elev: c.elevacao_m ? { l: 'Subida', v: String(Math.round(c.elevacao_m)), u: 'm' } : null,
    cad: c.cadencia ? { l: 'Cadência', v: String(c.cadencia), u: 'ppm' } : null,
    kcal: E.kcal ? { l: 'Calorias', v: Math.round(E.kcal).toLocaleString('pt-BR'), u: 'kcal' } : null,
    passos: E.passos ? { l: 'Passos', v: Math.round(E.passos).toLocaleString('pt-BR'), u: '' } : null,
  };
}
// voltas fortes (tiros): separa as voltas rápidas das de recuperação pelo pace
// tipo do treino de qualidade (pela planilha ou pelo título): o card de séries leva esse nome
function serieDe(c, plano) {
  const t = `${(plano && plano.titulo) || ''} ${c.titulo || ''}`.toLowerCase(), tp = plano && plano.tipo;
  if (/sub\s*-?\s*limiar/.test(t)) return { titulo: 'Sublimiar', qual: true };
  if (tp === 'fartlek' || /fartlek/.test(t)) return { titulo: 'Fartlek', qual: true };
  if (tp === 'ritmo' || /limiar|ritmo/.test(t)) return { titulo: 'Limiar', qual: true };
  if (tp === 'tiros' || /tiro/.test(t)) return { titulo: 'Tiros', qual: true };
  if (tp === 'intervalado' || /intervalad/.test(t)) return { titulo: 'Intervalado', qual: true };
  if (tp === 'teste') return { titulo: 'Teste', qual: true };
  // treinos leves ganham o card minimalista com o nome do treino
  const NOME_LEVE = { rodagem: 'Rodagem', regenerativo: 'Regenerativo', longao: 'Longão' };
  if (NOME_LEVE[tp]) return { titulo: 'Tiros', qual: false, leve: true, nome: NOME_LEVE[tp] };
  if (tp) return { titulo: 'Tiros', qual: false, leve: tp === 'folga' };
  if (/long[aã]o/.test(t)) return { titulo: 'Tiros', qual: false, leve: true, nome: 'Longão' };
  if (/regenerativ/.test(t)) return { titulo: 'Tiros', qual: false, leve: true, nome: 'Regenerativo' };
  if (/rodagem/.test(t)) return { titulo: 'Tiros', qual: false, leve: true, nome: 'Rodagem' };
  return { titulo: 'Tiros', qual: false };
}
function tirosDe(c) {
  const sr = c._serie || {};
  const vs = ((c.analise && c.analise.voltas) || []).filter((v) => v && v.d >= 100 && v.seg > 0).map((v, i) => ({ ...v, i, p: v.seg / (v.d / 1000) }));
  if (vs.length < 3 || sr.leve) return [];
  const ord = vs.map((v) => v.p).sort((a, b) => a - b);
  let corte = null, maior = 1;
  for (let i = 1; i < ord.length; i++) { const r = ord[i] / ord[i - 1]; if (r > maior) { maior = r; corte = (ord[i] + ord[i - 1]) / 2; } }
  if (maior < (sr.qual ? 1.06 : 1.12) || corte == null) return [];
  const fortes = vs.filter((v) => v.p < corte);
  return fortes.length >= (sr.qual ? 1 : 2) && fortes.length < vs.length ? fortes.slice(0, 10) : [];
}
// clima da hora e do lugar da corrida (Open-Meteo, sem chave); se não der, a temperatura do relógio
const CLIMA_CACHE = {};
async function climaDe(c) {
  if (CLIMA_CACHE[c.id] !== undefined) return CLIMA_CACHE[c.id];
  const E = (c.analise && c.analise.extras) || {};
  const doRelogio = E.temp_med != null ? { temp: Math.round(E.temp_med), fonte: 'relogio' } : null;
  let res = doRelogio;
  try {
    // dados vindos da Garmin não saem do app (compromisso da política de privacidade): nesses casos fica a temperatura do relógio
    const p0 = c.fonte !== 'garmin' && c.rota && c.rota[0]; if (!p0) throw 0;
    const dt = new Date(c.data), dia = isoDia(dt), antigo = Date.now() - dt.getTime() > 80 * 864e5;
    const base = antigo ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
    const url = `${base}?latitude=${p0[0]}&longitude=${p0[1]}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&start_date=${dia}&end_date=${dia}&timezone=auto`;
    const r = await fetch(url); if (!r.ok) throw 0; const j = await r.json();
    const meio = new Date(dt.getTime() + (c.duracao_s || 0) * 500); const hh = meio.getHours();
    const k = Math.max(0, Math.min(23, (j.hourly.time || []).findIndex((t) => +t.slice(11, 13) === hh)));
    const h = j.hourly;
    if (h.temperature_2m[k] != null) res = { temp: Math.round(h.temperature_2m[k]), sens: Math.round(h.apparent_temperature[k]), umid: Math.round(h.relative_humidity_2m[k]), vento: Math.round(h.wind_speed_10m[k]), cod: h.weather_code[k], dia: h.is_day[k] !== 0, fonte: 'clima' };
  } catch {}
  CLIMA_CACHE[c.id] = res; return res;
}
const climaTxt = (cod) => cod == null ? '' : cod === 0 ? 'Céu limpo' : cod <= 2 ? 'Poucas nuvens' : cod === 3 ? 'Nublado' : cod <= 48 ? 'Neblina' : cod <= 57 ? 'Garoa' : cod <= 67 ? 'Chuva' : cod <= 77 ? 'Neve' : cod <= 82 ? 'Pancadas de chuva' : 'Trovoada';
function cardRota(ctx, rota, x, y, w, h, cor, lw, brilho = false) {
  if (!rota || rota.length < 2) return false;
  const lats = rota.map((p) => p[0]), lons = rota.map((p) => p[1]);
  const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons), lo1 = Math.max(...lons);
  const k = Math.cos(((la0 + la1) / 2) * Math.PI / 180);
  const rw = Math.max((lo1 - lo0) * k, 1e-6), rh = Math.max(la1 - la0, 1e-6);
  const s = Math.min(w / rw, h / rh), ox = x + (w - rw * s) / 2, oy = y + (h - rh * s) / 2;
  const caminho = () => { ctx.beginPath(); rota.forEach((p, i) => { const px = ox + (p[1] - lo0) * k * s, py = oy + rh * s - (p[0] - la0) * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); };
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (brilho) { ctx.shadowColor = cor; ctx.shadowBlur = lw * 3; }
  ctx.strokeStyle = cor; ctx.lineWidth = lw; caminho(); ctx.stroke();
  // ponto de largada
  const p0 = rota[0], sx = ox + (p0[1] - lo0) * k * s, sy = oy + rh * s - (p0[0] - la0) * s;
  ctx.shadowBlur = 0; ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(sx, sy, lw * 1.25, 0, Math.PI * 2); ctx.fill();
  ctx.restore(); return true;
}
const ret = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
async function desenharCard(cv, c, o) {
  const W = 1080, H = o.formato === 'post' ? 1350 : 1920; const esc = o.escala || 1; cv.width = W * esc; cv.height = H * esc;
  const ctx = cv.getContext('2d'); ctx.setTransform(esc, 0, 0, esc, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.clearRect(0, 0, W, H);
  const branco = o.cor === 'branco', post = o.formato === 'post';
  const tx = branco ? '#ffffff' : '#0b1834', sub = branco ? 'rgba(255,255,255,.74)' : 'rgba(11,24,52,.6)';
  const AC = branco ? '#46d6ff' : '#0b62d6'; // ciano da marca (no texto preto, o azul Nexos)
  if (o.fundo === 'foto' && o.img) {
    const im = o.img, sc = Math.max(W / im.width, H / im.height);
    ctx.drawImage(im, (W - im.width * sc) / 2, (H - im.height * sc) / 2, im.width * sc, im.height * sc);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(.5, 'rgba(0,0,0,.04)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (o.fundo === 'nexos') {
    const g = ctx.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, '#0d2a5e'); g.addColorStop(1, '#040a18'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W * .9, H * .08, 0, W * .9, H * .08, W * .9); r.addColorStop(0, 'rgba(70,214,255,.22)'); r.addColorStop(1, 'rgba(70,214,255,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  const sombra = branco && o.fundo !== 'nexos';
  // tamanho e posição escolhidos com os dedos (o fundo não mexe)
  const zz = o.zoom || 1; ctx.save(); ctx.translate(W / 2 + (o.dx || 0), H / 2 + (o.dy || 0)); ctx.scale(zz, zz); ctx.translate(-W / 2, -H / 2);
  const FB = "'Manrope', system-ui, sans-serif", FH = "'Unbounded', 'Manrope', system-ui, sans-serif", FM = "'JetBrains Mono', ui-monospace, monospace";
  const txt = (t, x, y, font, cor, al = 'center', esp = 0) => {
    ctx.save(); ctx.font = font; ctx.fillStyle = cor; ctx.textAlign = al; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = esp + 'px';
    if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 2; }
    ctx.fillText(t, x, y); ctx.restore();
  };
  const larg = (t, font, esp = 0) => { ctx.save(); ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = esp + 'px'; const w = ctx.measureText(t).width; ctx.restore(); return w; };
  const V = cardValores(c);
  const sel = ['dist', 'pace', 'tempo', 'fc', 'elev', 'cad', 'kcal', 'passos'].filter((k) => o.stats[k] && V[k]).map((k) => V[k]);
  const VAL = (px) => `700 ${Math.round(px * .84)}px ${FH}`, LBL = (px) => `700 ${px}px ${FB}`;
  // rótulo pequeno + número grande (unidade menor ao lado)
  const stat = (s, x, y, px, al = 'center', caixa = false) => {
    const fu = `700 ${Math.round(px * .42)}px ${FB}`, ev = -px * .035;
    const wv = larg(s.v, VAL(px), ev), wu = s.u ? larg(s.u, fu) + px * .12 : 0, tot = wv + wu;
    const x0 = al === 'center' ? x - tot / 2 : al === 'right' ? x - tot : x;
    txt(caixa ? s.l.toUpperCase() : s.l, al === 'center' ? x : al === 'right' ? x : x0, y, LBL(Math.max(24, Math.round(px * .34))), sub, al, caixa ? px * .05 : 0);
    txt(s.v, x0, y + px * 1.04, VAL(px), tx, 'left', ev);
    if (s.u) txt(s.u, x0 + wv + px * .12, y + px * 1.04, fu, sub, 'left');
    return wv + wu;
  };
  const grade = (lista, y, px, x0 = 80, x1 = W - 80, porLinha = 3, al = 'left') => {
    let yy = y;
    for (let i = 0; i < lista.length; i += porLinha) {
      const parte = lista.slice(i, i + porLinha), cw = (x1 - x0) / porLinha;
      parte.forEach((s, j) => stat(s, al === 'center' ? x0 + cw * j + cw / 2 : x0 + cw * j, yy, px, al));
      yy += px * 1.9;
    }
    return yy;
  };
  const comLogo = o.stats.logo;
  const wm = comLogo ? await cardImg(branco ? 'icons/wordmark.svg' : 'icons/wordmark-escuro.svg') : null;
  const sim = comLogo ? await cardImg(branco ? 'icons/simbolo.svg' : 'icons/simbolo-escuro.svg') : null;
  const desenha = (im, ar, x, y, w, al = 'left') => { if (!im) return 0; const h = w * ar; const xx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x; ctx.save(); if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 12; } ctx.drawImage(im, xx, y, w, h); ctx.restore(); return h; };
  const logoTexto = (x, y, w = 240, al = 'center') => desenha(wm, 937.1 / 5645, x, y, w, al);
  const simbolo = (x, y, w = 120, al = 'center') => desenha(sim, 2333.5 / 5528.6, x, y, w, al);
  // a marca principal nos cards é o símbolo (maior que o nome escrito)
  const logo = (x, y, w = 240, al = 'center') => simbolo(x, y - w * .05, w * .72, al);
  const dt = new Date(c.data);
  const dataTxt = o.stats.data ? `${fmtDia(c.data)} · ${fmtHora(c.data)}`.toUpperCase() : '';
  const temRota = o.stats.rota && c.rota && c.rota.length > 1;
  const rota = (x, y, w, h, lw = 9, br = false) => temRota && cardRota(ctx, c.rota, x, y, w, h, AC, lw, br);
  const L = o.layout;
  const assinatura = () => {
    // as três faixas diagonais da Nexos no canto superior direito
    ctx.save(); const bx = W - 70, by = post ? 66 : 96, hh = 54;
    [0, 1, 2].forEach((k) => { ctx.globalAlpha = 1 - k * .32; ctx.fillStyle = AC; ctx.beginPath(); const x0 = bx - 150 + k * 46; ctx.moveTo(x0, by + hh); ctx.lineTo(x0 + 30, by + hh); ctx.lineTo(x0 + 58, by); ctx.lineTo(x0 + 28, by); ctx.closePath(); ctx.fill(); });
    ctx.restore();
    // selo da marca na base
    if (L === 'icones' || L === 'mapa') txt('NEXOS · PERFORMANCE E SAÚDE', W / 2, H - (post ? 44 : 64), `500 22px ${FM}`, sub, 'center', 6);
  };

  const clima = o.clima;
  const iconeClima = (cx, cy, r) => { // sol, lua, nuvem e chuva desenhados
    const cod = clima && clima.cod, dia = !clima || clima.dia !== false;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const sol = cod == null || cod <= 2;
    if (sol) {
      if (dia) { ctx.fillStyle = '#ffcf5c'; ctx.beginPath(); ctx.arc(cx, cy, r * .42, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffcf5c'; ctx.lineWidth = r * .09; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6); ctx.lineTo(cx + Math.cos(a) * r * .82, cy + Math.sin(a) * r * .82); ctx.stroke(); } }
      else { ctx.fillStyle = '#dfe8ff'; ctx.beginPath(); ctx.arc(cx, cy, r * .5, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx + r * .25, cy - r * .18, r * .45, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    }
    if (cod == null || cod >= 1) { // nuvem
      const nx = sol ? cx + r * .25 : cx, ny = sol ? cy + r * .28 : cy; ctx.fillStyle = branco ? '#ffffff' : '#c9d6ea';
      ctx.beginPath(); ctx.arc(nx - r * .3, ny, r * .26, 0, Math.PI * 2); ctx.arc(nx, ny - r * .14, r * .34, 0, Math.PI * 2); ctx.arc(nx + r * .32, ny + r * .02, r * .24, 0, Math.PI * 2); ctx.rect(nx - r * .3, ny, r * .62, r * .26); ctx.fill();
      if (cod != null && cod >= 51) { ctx.strokeStyle = AC; ctx.lineWidth = r * .08; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(nx + k * r * .25, ny + r * .42); ctx.lineTo(nx + k * r * .25 - r * .08, ny + r * .66); ctx.stroke(); } }
    }
    ctx.restore();
  };
  if (L === 'clima') { // temperatura em destaque, com sensação, umidade e vento
    let y = post ? 120 : 330;
    simbolo(W / 2, y, 220); y += 170;
    if (clima) {
      iconeClima(W / 2, y + 120, 130); y += 290;
      const tt = `${clima.temp}°`; txt(tt, W / 2 + 30, y + 190, `800 ${post ? 220 : 260}px ${FH}`, tx, 'center', -10); y += 240;
      if (clima.fonte === 'clima' && climaTxt(clima.cod)) { txt(climaTxt(clima.cod).toUpperCase(), W / 2, y, LBL(30), AC, 'center', 6); y += 70; } else y += 20;
      const det = [clima.sens != null ? { l: 'Sensação', v: `${clima.sens}°`, u: '' } : null, clima.umid != null ? { l: 'Umidade', v: `${clima.umid}`, u: '%' } : null, clima.vento != null ? { l: 'Vento', v: `${clima.vento}`, u: 'km/h' } : null].filter(Boolean);
      if (det.length) y = grade(det, y + 10, 60, 90, W - 90, 3, 'center');
    } else { txt('Buscando o clima…', W / 2, y + 200, LBL(34), sub, 'center'); y += 400; }
    ctx.save(); ctx.fillStyle = branco ? 'rgba(255,255,255,.25)' : 'rgba(11,24,52,.15)'; ctx.fillRect(140, y + 10, W - 280, 2); ctx.restore();
    grade(sel.slice(0, 3), y + 60, 64, 70, W - 70, 3, 'center');
  } else if (L === 'clima_faixa') { // números da corrida com uma etiqueta do clima
    const lista = sel.slice(0, 3); let y = (H - 620) / 2;
    simbolo(80, y, 200, 'left'); y += 150;
    if (clima) {
      const t = `${clima.temp}°C`, extra = [clima.fonte === 'clima' ? climaTxt(clima.cod) : '', clima.umid != null ? `${clima.umid}% umidade` : '', clima.vento != null ? `vento ${clima.vento} km/h` : ''].filter(Boolean).join(' · ');
      const fs = 36, wT = larg(t, `800 46px ${FH}`) + larg(extra, `600 ${fs}px ${FB}`) + 200;
      ctx.save(); ctx.strokeStyle = tx; ctx.globalAlpha = .55; ctx.lineWidth = 3; ret(ctx, 80, y, Math.min(W - 160, wT), 110, 55); ctx.stroke(); ctx.restore();
      iconeClima(140, y + 55, 70);
      txt(t, 200, y + 72, `800 46px ${FH}`, tx, 'left', -1);
      txt(extra, 200 + larg(t, `800 46px ${FH}`) + 26, y + 68, `600 ${fs}px ${FB}`, sub, 'left');
    }
    y += 190;
    grade(lista, y, 76, 80, W - 80, 3, 'left');
  } else if (L === 'tiros') { // só as voltas fortes (sem recuperação)
    const tr = tirosDe(c), pk = tr.map((v) => v.p), mn = Math.min(...pk), mx = Math.max(...pk);
    const dists = tr.map((v) => Math.round(v.d / 100) * 100), iguais = dists.every((d) => Math.abs(d - dists[0]) <= 100);
    const lh = Math.min(post ? 74 : 92, (H - (post ? 560 : 760)) / Math.max(1, tr.length));
    let y = (H - (190 + tr.length * lh + 260)) / 2;
    const tit = (c._serie && c._serie.titulo) || 'Tiros';
    txt(tit, 100, y + 70, `800 ${tit.length > 9 ? 70 : 84}px ${FH}`, tx, 'left', -2);
    txt(iguais ? `${tr.length} × ${dists[0] >= 1000 ? (dists[0] / 1000).toString().replace('.', ',') + ' km' : dists[0] + ' m'}` : `${tr.length} ${tr.length > 1 ? 'séries' : 'série'}`, W - 100, y + 66, `700 40px ${FB}`, AC, 'right'); y += 150;
    txt('#', 100, y + 10, LBL(24), sub, 'left', 3); txt('PACE', W - 100, y + 10, LBL(24), sub, 'right', 3); y += 30;
    tr.forEach((v, i) => {
      const yy = y + i * lh, w = mx > mn ? 120 + 200 * (mx - v.p) / (mx - mn) : 260, top = v.p === mn;
      ctx.save(); ctx.fillStyle = top ? AC : (branco ? 'rgba(255,255,255,.14)' : 'rgba(11,24,52,.1)'); ctx.beginPath(); ctx.arc(126, yy + lh * .5, lh * .32, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      txt(String(i + 1), 126, yy + lh * .5 + lh * .13, `800 ${Math.round(lh * .34)}px ${FB}`, top ? '#04122b' : tx, 'center');
      ctx.save(); ctx.fillStyle = top ? AC : (branco ? 'rgba(255,255,255,.85)' : 'rgba(11,24,52,.82)'); ret(ctx, 190, yy + lh * .3, w, lh * .4, lh * .2); ctx.fill(); ctx.restore();
      txt(`${iguais ? '' : (v.d >= 1000 ? (v.d / 1000).toFixed(1).replace('.', ',') + ' km · ' : Math.round(v.d) + ' m · ')}${fmtDur(v.seg)}${v.fc ? ' · ' + v.fc + ' bpm' : ''}`, 540, yy + lh * .5 + 12, `600 ${Math.round(lh * .3)}px ${FB}`, sub, 'left');
      txt(fmtPace(v.p).replace('/km', ''), W - 100, yy + lh * .5 + 14, `800 ${Math.round(lh * .4)}px ${FH}`, top ? AC : tx, 'right', -1);
    });
    y += tr.length * lh + 50;
    const med = tr.reduce((a, v) => a + v.seg, 0) / tr.reduce((a, v) => a + v.d / 1000, 0);
    grade([{ l: tit === 'Tiros' ? 'Pace médio dos tiros' : 'Pace médio das séries', v: fmtPace(med).replace('/km', ''), u: '/km' }, { l: 'Melhor', v: fmtPace(mn).replace('/km', ''), u: '/km' }], y, 64, 100, W - 100, 2, 'left');
    simbolo(W / 2, H - (post ? 150 : 230), 170);
  } else if (L === 'nome') { // minimalista: só o nome do treino, uma linha de números e a marca
    const nm = (c._serie && c._serie.nome) || 'Corrida', esp = 6;
    let px = post ? 150 : 170; while (px > 60 && larg(nm, `400 ${px}px ${FH}`, esp) > W - 180) px -= 4;
    const linha = sel.slice(0, 3).map((s) => `${s.v}${s.u ? ' ' + s.u : ''}`).join('   ·   ');
    const alt = (dataTxt ? 80 : 0) + px + 60 + (linha ? 70 : 0);
    let y = (H - alt) / 2 - (post ? 30 : 60);
    if (dataTxt) { txt(dataTxt, W / 2, y + 26, `600 28px ${FB}`, sub, 'center', 8); y += 80; }
    txt(nm, W / 2 + esp / 2, y + px * .82, `400 ${px}px ${FH}`, tx, 'center', esp); y += px + 40;
    ctx.save(); ctx.fillStyle = AC; ctx.fillRect(W / 2 - 40, y, 80, 4); ctx.restore(); y += 30;
    if (linha) txt(linha, W / 2, y + 44, `500 38px ${FB}`, sub, 'center', 2);
    simbolo(W / 2, H - (post ? 170 : 260), 150);
  } else if (L === 'icones') { // grade 2 colunas com ícone em cima de cada número
    const IC = { dist: 'M6 21s-4-4.5-4-7.5A4 4 0 0 1 10 13.5C10 16.5 6 21 6 21zM6 13.5h.01M18 11s-3-3.4-3-5.6a3 3 0 0 1 6 0C21 7.6 18 11 18 11zM18 5.4h.01M9 19.5c3 0 4-1.5 5.5-4s2.5-3 3.5-3', tempo: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 1.5M10 2h4M12 2v3M19 6l1.5-1.5', pace: 'M3.5 17a9 9 0 1 1 17 0M12 13l4-4M12 13.5a1 1 0 1 0 0-.01M6.5 13H5M19 13h-1.5M12 6.5V5M7.6 8.6 6.6 7.6M16.4 8.6l1-1', elev: 'M2 20 9 8l4 6 3-4 6 10zM9 8l2 3', fc: 'M12 20s-7-4.4-9-9a4.7 4.7 0 0 1 9-3 4.7 4.7 0 0 1 9 3c-2 4.6-9 9-9 9zM3.5 12h4l2-3 2.5 6 2-3h6.5', passos: 'M7 4c1.7 0 2.5 1.8 2.5 4S8.7 12 7 12s-2.5-1.8-2.5-4S5.3 4 7 4zM5 14.5h4.5v2a2.3 2.3 0 0 1-4.5 0zM17 8c1.7 0 2.5 1.8 2.5 4s-.8 4-2.5 4-2.5-1.8-2.5-4S15.3 8 17 8zM15 18.5h4.5v.5a2.3 2.3 0 0 1-4.5 0z', cad: 'M7 4c1.7 0 2.5 1.8 2.5 4S8.7 12 7 12s-2.5-1.8-2.5-4S5.3 4 7 4zM5 14.5h4.5v2a2.3 2.3 0 0 1-4.5 0zM17 8c1.7 0 2.5 1.8 2.5 4s-.8 4-2.5 4-2.5-1.8-2.5-4S15.3 8 17 8zM15 18.5h4.5v.5a2.3 2.3 0 0 1-4.5 0z', kcal: 'M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.7 3.5 4.4 3.5 7 0 3.4-2.5 6-6.5 6z' };
    // usa o que estiver marcado e completa com os outros números da corrida até 6
    const ordem = ['dist', 'tempo', 'pace', 'elev', 'fc', 'passos', 'cad', 'kcal'];
    const chaves = [...ordem.filter((k) => o.stats[k] && V[k]), ...ordem.filter((k) => !o.stats[k] && V[k])].slice(0, 6).sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    const rows = Math.ceil(chaves.length / 2), rh = post ? 300 : 340;
    let y = (H - (rows * rh + 210)) / 2;
    simbolo(W / 2, y, 300); y += 210;
    const icone = (k, cx, cy, sz) => { if (!IC[k] || !window.Path2D) return; ctx.save(); ctx.translate(cx - sz / 2, cy); ctx.scale(sz / 24, sz / 24); ctx.strokeStyle = tx; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6; } ctx.stroke(new Path2D(IC[k])); ctx.restore(); };
    chaves.forEach((k, i) => {
      const col = i % 2, row = Math.floor(i / 2), cx = col ? W * .72 : W * .28, cy = y + row * rh;
      icone(k, cx, cy, 84);
      const s2 = V[k]; txt(s2.l, cx, cy + 140, `600 38px ${FB}`, tx, 'center');
      const px = 86, wv = larg(s2.v, VAL(px), -px * .035), fu = `700 ${Math.round(px * .5)}px ${FB}`, wu = s2.u ? larg(s2.u, fu) + 12 : 0, x0 = cx - (wv + wu) / 2;
      txt(s2.v, x0, cy + 236, VAL(px), tx, 'left', -px * .035); if (s2.u) txt(s2.u, x0 + wv + 12, cy + 236, fu, tx, 'left');
      if (row < rows - 1) { ctx.save(); ctx.fillStyle = branco ? 'rgba(255,255,255,.22)' : 'rgba(11,24,52,.15)'; ctx.fillRect(cx - 190, cy + rh - 30, 380, 2); ctx.restore(); }
    });
  } else if (L === 'classico') { // coluna centrada: percurso, números e logo
    const px = post ? 84 : 100, passo = px * 1.95, hR = temRota ? (post ? 250 : 340) : 0;
    const tot = (hR ? hR + 70 : 0) + sel.length * passo + (dataTxt ? 70 : 0) + (wm ? 110 : 0);
    let y = (H - tot) / 2;
    if (temRota) { rota(W / 2 - 230, y, 460, hR, 10); y += hR + 70; }
    if (dataTxt) { txt(dataTxt, W / 2, y + 26, LBL(28), sub, 'center', 3); y += 70; }
    sel.forEach((s) => { stat(s, W / 2, y + 30, px, 'center'); y += passo; });
    logo(W / 2, y + 30, 250);
  } else if (L === 'faixa') { // símbolo + logo numa linha e os números lado a lado
    const lista = sel.slice(0, 6), px = lista.length > 3 ? 64 : 70;
    const alt = 140 + Math.ceil(lista.length / 3) * px * 1.9;
    let y = (H - alt) / 2;
    const hs = simbolo(80, y, 190, 'left'); logoTexto(80 + (sim ? 220 : 0), y + Math.max(0, (hs - 46) / 2), 270, 'left');
    if (dataTxt) txt(dataTxt, W - 80, y + 40, LBL(24), sub, 'right', 3);
    grade(lista, y + 150, px, 80, W - 80, 3, 'left');
  } else if (L === 'percurso') { // percurso grande, logo e números embaixo
    const hr = post ? 620 : 900, yr = post ? 150 : 240;
    rota(130, yr, W - 260, hr, 12);
    let y = yr + hr + (post ? 60 : 100);
    simbolo(W / 2, y, 230); y += 130;
    if (dataTxt) { txt(dataTxt, W / 2, y + 10, LBL(26), sub, 'center', 3); y += 60; }
    y = grade(sel.slice(0, 3), y, post ? 66 : 72, 70, W - 70, 3, 'center');
  } else if (L === 'lado') { // percurso à esquerda, logo e números em coluna à direita
    const yc = H / 2, hr = post ? 520 : 600;
    rota(70, yc - hr / 2, 470, hr, 12);
    const px = 66; let y = yc - (sel.slice(0, 4).length * px * 1.95 + 120) / 2;
    logo(600, y, 340, 'left'); y += 120;
    sel.slice(0, 4).forEach((s) => { stat(s, 600, y + 28, px, 'left'); y += px * 1.95; });
  } else if (L === 'mapa') { // só o percurso e a marca
    const hr = post ? 760 : 1050; const y0 = (H - hr - 160) / 2;
    rota(110, y0, W - 220, hr, 14, true);
    logo(W / 2, y0 + hr + 90, 300);
  } else if (L === 'sobre') { // números empilhados por cima do percurso
    ctx.save(); ctx.globalAlpha = .9; rota(110, post ? 180 : 300, W - 220, post ? 900 : 1250, 16); ctx.restore();
    const px = post ? 70 : 80, passo = px * 1.85, lista = sel.slice(0, 6);
    let y = (H - (lista.length * passo + 110)) / 2;
    logo(W / 2, y, 260); y += 110;
    lista.forEach((s) => { stat(s, W / 2, y + 26, px, 'center'); y += passo; });
  } else if (L === 'tabela' || L === 'ficha_mapa') { // ficha com pontilhado (estilo recibo de prova)
    const lista = sel.slice(0, 7), lh = post ? 64 : 72, fs = post ? 38 : 42;
    const alt = (wm ? 90 : 0) + lista.length * lh + (dataTxt ? 70 : 0);
    let y = L === 'ficha_mapa' ? H - (post ? 110 : 170) - alt : (H - alt) / 2;
    if (L === 'ficha_mapa') rota(160, post ? 110 : 200, W - 320, y - (post ? 190 : 300), 13);
    const x0 = 150, x1 = W - 150;
    if (wm) { logo(x0, y, 230, 'left'); y += 90; }
    if (dataTxt) { txt(dataTxt, x0, y + 30, LBL(24), sub, 'left', 3); y += 70; }
    lista.forEach((s) => {
      const vt = s.v + (s.u ? ' ' + s.u : ''); y += lh;
      txt(s.l, x0, y, `600 ${fs}px ${FB}`, tx, 'left'); txt(vt, x1, y, `800 ${fs}px ${FB}`, tx, 'right');
      const a = x0 + larg(s.l, `600 ${fs}px ${FB}`) + 22, b = x1 - larg(vt, `800 ${fs}px ${FB}`) - 22;
      ctx.save(); ctx.fillStyle = sub; for (let xx = a; xx < b; xx += 15) { ctx.beginPath(); ctx.arc(xx, y - fs * .32, 2.6, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    });
  } else if (L === 'lateral') { // faixa diagonal da marca atravessando o card, com os números dentro
    rota(W / 2 - 230, post ? 120 : 210, 460, post ? 330 : 470, 10);
    const yc = H * (post ? .58 : .56), bh = post ? 330 : 380, inc = 140;
    ctx.save(); ctx.translate(0, yc);
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, branco ? 'rgba(70,214,255,.22)' : 'rgba(11,98,214,.14)'); g.addColorStop(1, branco ? 'rgba(47,107,255,.32)' : 'rgba(11,98,214,.24)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-40, -bh / 2 + inc / 2); ctx.lineTo(W + 40, -bh / 2 - inc / 2); ctx.lineTo(W + 40, bh / 2 - inc / 2); ctx.lineTo(-40, bh / 2 + inc / 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = AC; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, -bh / 2 + inc / 2); ctx.lineTo(W + 40, -bh / 2 - inc / 2); ctx.stroke();
    ctx.rotate(-Math.atan2(inc, W + 80));
    const lista = sel.slice(0, 3), cw = (W - 120) / Math.max(1, lista.length);
    lista.forEach((s, k) => stat(s, 60 + cw * k + cw / 2, -40, post ? 64 : 70, 'center', true));
    ctx.restore();
    if (dataTxt) txt(dataTxt, W / 2, yc + bh / 2 + 90, LBL(26), sub, 'center', 4);
    simbolo(W / 2, H - (post ? 260 : 360), 230);
  } else if (L === 'pilulas') { // número de peito: a "inscrição" da corrida
    const bw = 820, bh = post ? 760 : 860, x = (W - bw) / 2, y = (H - bh) / 2 - (post ? 0 : 40);
    ctx.save(); if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 30; }
    ctx.fillStyle = branco ? 'rgba(255,255,255,.96)' : '#ffffff'; ret(ctx, x, y, bw, bh, 34); ctx.fill(); ctx.restore();
    const faixa = 180; ctx.save(); ret(ctx, x, y, bw, bh, 34); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + bw, y); g.addColorStop(0, '#0d2a5e'); g.addColorStop(1, '#143a7c'); ctx.fillStyle = g; ctx.fillRect(x, y, bw, faixa);
    ctx.fillStyle = '#46d6ff'; for (let k = 0; k < 3; k++) { ctx.globalAlpha = 1 - k * .3; ctx.beginPath(); const sx = x + bw - 210 + k * 46; ctx.moveTo(sx, y + faixa); ctx.lineTo(sx + 30, y + faixa); ctx.lineTo(sx + 70, y); ctx.lineTo(sx + 40, y); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // furos dos alfinetes
    ctx.save(); ctx.fillStyle = branco ? 'rgba(0,0,0,.0)' : 'rgba(0,0,0,0)'; ctx.globalCompositeOperation = 'destination-out'; [[x + 46, y + 46], [x + bw - 46, y + 46], [x + 46, y + bh - 46], [x + bw - 46, y + bh - 46]].forEach(([a, b2]) => { ctx.beginPath(); ctx.arc(a, b2, 16, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); }); ctx.restore();
    const wmB = await cardImg('icons/wordmark.svg'), simE = await cardImg('icons/simbolo-escuro.svg');
    if (wmB) ctx.drawImage(wmB, x + 110, y + faixa / 2 - 26, 312, 312 * (937.1 / 5645));
    const d0 = V.dist || sel[0];
    const nb = d0 ? d0.v : '';
    ctx.save(); ctx.font = `800 ${post ? 230 : 260}px ${FH}`; ctx.fillStyle = '#0b1834'; ctx.textAlign = 'center'; if ('letterSpacing' in ctx) ctx.letterSpacing = '-10px'; ctx.fillText(nb, W / 2, y + faixa + (post ? 300 : 340)); ctx.restore();
    ctx.save(); ctx.font = `800 44px ${FB}`; ctx.fillStyle = '#0b62d6'; ctx.textAlign = 'center'; if ('letterSpacing' in ctx) ctx.letterSpacing = '12px'; ctx.fillText('KM', W / 2, y + faixa + (post ? 380 : 430)); ctx.restore();
    const resto = sel.filter((s) => s !== d0).slice(0, 3); const cw = (bw - 120) / Math.max(1, resto.length);
    resto.forEach((s, k) => { const cx = x + 60 + cw * k + cw / 2, yy = y + bh - (post ? 150 : 170);
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(11,24,52,.55)'; ctx.font = `700 26px ${FB}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '3px'; ctx.fillText(s.l.toUpperCase(), cx, yy); ctx.fillStyle = '#0b1834'; ctx.font = `700 52px ${FH}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '-1px'; ctx.fillText(s.v + (s.u === '/km' ? '' : ''), cx, yy + 66); ctx.restore(); });
    if (simE) { const w2 = 96; ctx.drawImage(simE, x + bw - 60 - w2, y + bh - 60 - w2 * (2333.5 / 5528.6), w2, w2 * (2333.5 / 5528.6)); }
    ctx.save(); ctx.fillStyle = 'rgba(11,24,52,.45)'; ctx.font = `500 22px ${FM}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '4px'; ctx.fillText(`${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`, x + 60, y + bh - 50); ctx.restore();
  } else if (L === 'parciais') { // barras dos km (o mais rápido em destaque)
    const parc = (c.parciais || []).filter((p) => !p.parcial || p.km % 1 > .3).slice(0, post ? 16 : 24);
    const pk = (p) => p.seg / (p.parcial ? (p.km % 1 || 1) : 1);
    const vs = parc.map(pk), mn = Math.min(...vs), mx = Math.max(...vs);
    const lh = Math.min(post ? 56 : 66, (H - (post ? 520 : 700)) / Math.max(1, parc.length));
    let y = (H - (130 + parc.length * lh + 150)) / 2;
    txt('Parciais por km', 100, y + 60, `800 64px ${FH}`, tx, 'left', -1); y += 130;
    parc.forEach((p, i) => {
      const v = vs[i], w = mx > mn ? 220 + 440 * (mx - v) / (mx - mn) : 600, yy = y + i * lh;
      txt(p.parcial ? String(p.km).replace('.', ',') : String(p.km), 100, yy + lh * .62, `700 ${Math.round(lh * .5)}px ${FB}`, sub, 'left');
      ctx.save(); ctx.fillStyle = v === mn ? AC : (branco ? 'rgba(255,255,255,.88)' : 'rgba(11,24,52,.85)'); ret(ctx, 180, yy + lh * .2, w, lh * .56, lh * .28); ctx.fill(); ctx.restore();
      txt(fmtPace(v).replace('/km', ''), W - 100, yy + lh * .62, `800 ${Math.round(lh * .5)}px ${FB}`, v === mn ? AC : tx, 'right');
    });
    logo(W / 2, y + parc.length * lh + 60, 240);
  } else if (L === 'recibo') { // medalha: fita em V e o disco com a distância
    const cx = W / 2, cy = H * (post ? .56 : .54), R0 = post ? 250 : 280;
    ctx.save(); // fita
    const fita = (lado, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(cx + lado * 40, cy - R0 + 20); ctx.lineTo(cx + lado * 260, cy - R0 - (post ? 420 : 560)); ctx.lineTo(cx + lado * 120, cy - R0 - (post ? 420 : 560)); ctx.lineTo(cx - lado * 60, cy - R0 + 30); ctx.closePath(); ctx.fill(); };
    fita(-1, '#143a7c'); fita(1, '#46d6ff');
    ctx.restore();
    ctx.save(); if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 30; }
    const gm = ctx.createRadialGradient(cx - R0 * .3, cy - R0 * .3, R0 * .1, cx, cy, R0); gm.addColorStop(0, '#e9f6ff'); gm.addColorStop(.6, '#9fd8f5'); gm.addColorStop(1, '#4aa7da');
    ctx.fillStyle = gm; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(11,24,52,.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R0 - 26, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const simE = await cardImg('icons/simbolo-escuro.svg'); if (simE) ctx.drawImage(simE, cx - 70, cy - R0 + 60, 140, 140 * (2333.5 / 5528.6));
    const d0 = V.dist || sel[0];
    if (d0) { ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#0b1834'; ctx.font = `800 ${R0 * .52}px ${FH}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '-6px'; ctx.fillText(d0.v, cx, cy + R0 * .16); ctx.font = `800 34px ${FB}`; ctx.fillStyle = '#0b62d6'; if ('letterSpacing' in ctx) ctx.letterSpacing = '10px'; ctx.fillText((d0.u || '').toUpperCase(), cx, cy + R0 * .36); ctx.restore(); }
    ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(11,24,52,.6)'; ctx.font = `600 26px ${FM}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '4px'; ctx.fillText(`${DIAS_LONGOS[dt.getDay()].toUpperCase()} · ${dt.getDate()} ${MESES[dt.getMonth()]}`, cx, cy + R0 * .62); ctx.restore();
    const resto = sel.filter((s) => s !== d0).slice(0, 2); const yy = cy + R0 + (post ? 90 : 130);
    resto.forEach((s, k) => stat(s, resto.length > 1 ? W / 2 + (k ? 200 : -200) : W / 2, yy, 70, 'center'));
    logo(W / 2, H - (post ? 130 : 220), 260);
  } else if (L === 'destaque') { // um número gigante e o resto pequeno embaixo
    const prim = sel[0], resto = sel.slice(1);
    let y = H * (post ? .26 : .3);
    if (dataTxt) txt(dataTxt, W / 2, y - 40, LBL(28), sub, 'center', 3);
    if (prim) {
      txt(prim.l.toUpperCase(), W / 2, y + 40, LBL(34), sub, 'center', 5);
      const px = post ? 230 : 270; txt(prim.v, W / 2, y + 40 + px * .98, `800 ${px}px ${FH}`, tx, 'center', -px * .05);
      if (prim.u) txt(prim.u.replace('/', '').toUpperCase(), W / 2, y + 40 + px * .98 + 80, `800 46px ${FB}`, AC, 'center', 10);
      y += 40 + px * .98 + 190;
    }
    y = grade(resto.slice(0, 3), y, post ? 66 : 74, 70, W - 70, 3, 'center');
    if (temRota && !post) rota(W / 2 - 160, y + 10, 320, 240, 8);
    logo(W / 2, H - (post ? 110 : 150), 250);
  } else { // 'linha': tudo numa faixa embaixo, a foto fica livre
    if (o.fundo === 'foto') { const g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45); }
    const lista = sel.slice(0, 3), px = 72;
    let y = H - (post ? 120 : 170) - px * 1.4;
    rota(80, y - 320, 260, 230, 7);
    simbolo(W - 80, y - 230, 190, 'right'); logoTexto(W - 80, y - 120, 210, 'right');
    if (dataTxt) txt(dataTxt, 80, y - 50 - 20, LBL(24), sub, 'left', 3);
    ctx.save(); ctx.fillStyle = branco ? 'rgba(255,255,255,.35)' : 'rgba(11,24,52,.2)'; ctx.fillRect(80, y - 40, W - 160, 2); ctx.restore();
    grade(lista, y + 10, px, 80, W - 80, 3, 'left');
  }
  if (o.local) { // localização escolhida pelo atleta: alfinete + nome do lugar
    const fl = `700 ${post ? 30 : 34}px ${FB}`, maxW = L === 'recibo' ? W - 200 : W - 70 - 250;
    let t = String(o.local); while (t.length > 3 && larg(t, fl, 1) > maxW) t = t.slice(0, -2).trimEnd() + '…';
    const ic = post ? 34 : 38, w = ic + 12 + larg(t, fl, 1);
    const x0 = L === 'recibo' ? (W - w) / 2 : 70, yb = L === 'recibo' ? H - (post ? 46 : 104) : (post ? 66 : 96) + 42;
    if (window.Path2D) { ctx.save(); ctx.translate(x0, yb - ic * .86); ctx.scale(ic / 24, ic / 24); ctx.fillStyle = AC; if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; } ctx.fill(new Path2D('M12 23s-7.5-6.9-7.5-12.6a7.5 7.5 0 0 1 15 0C19.5 16.1 12 23 12 23zm0-9.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z'), 'evenodd'); ctx.restore(); }
    txt(t, x0 + ic + 12, yb, fl, tx, 'left', 1);
  }
  ctx.restore();
  assinatura();
}
// localização do card: busca no OpenStreetMap (só quando o atleta pede; nada é enviado sozinho)
const locCurto = (r) => { const a = r.address || {}; const nome = r.name || a.amenity || a.leisure || a.tourism || a.road || ''; const cid = a.city || a.town || a.village || a.municipality || a.city_district || ''; const uf = (a['ISO3166-2-lvl4'] || '').replace(/^BR-/, ''); return [...new Set([nome, cid].filter(Boolean))].join(', ') + (uf && cid && uf.length === 2 ? ` - ${uf}` : '') || r.display_name || ''; };
async function locBuscar(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=pt-BR&q=${encodeURIComponent(q)}`); if (!r.ok) throw 0;
  return (await r.json()).map(locCurto).filter((x, i, a) => x && a.indexOf(x) === i);
}
async function locReversa(lat, lon) {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=pt-BR&lat=${lat}&lon=${lon}`); if (!r.ok) throw 0;
  return locCurto(await r.json());
}
async function abrirCardCorrida(c, plano) {
  c._serie = serieDe(c, plano);
  try { await Promise.all(["800 100px 'Unbounded'", "400 100px 'Unbounded'", "700 40px 'Manrope'", "500 40px 'Manrope'"].map((f) => document.fonts.load(f))); } catch {}
  let st = {}; try { st = JSON.parse(localStorage.getItem('nx-card') || '{}'); } catch {}
  const V = cardValores(c);
  const o = { layout: st.layout || 'classico', fundo: st.fundo || 'transparente', cor: st.cor || 'branco', formato: st.formato || 'story', img: null,
    stats: Object.assign({ dist: true, pace: true, tempo: true, fc: false, elev: false, cad: false, kcal: false, rota: true, data: false, logo: true }, st.stats || {}) };
  if (!CARD_LAYOUTS.some(([k]) => k === o.layout)) o.layout = 'classico';
  try { o.local = localStorage.getItem('nx-card-loc-' + c.id) || ''; } catch { o.local = ''; }
  const temParc = (c.parciais || []).length >= 2;
  const temTiros = tirosDe(c).length >= (c._serie.qual ? 1 : 2), temClima = !!((c.rota && c.rota.length) || (c.analise && c.analise.extras && c.analise.extras.temp_med != null));
  const modelos = CARD_LAYOUTS.map(([k, l]) => [k, k === 'tiros' ? c._serie.titulo : k === 'nome' ? c._serie.nome : l]).filter(([k]) => (k !== 'parciais' || temParc) && (k !== 'tiros' || temTiros) && (k !== 'nome' || !!c._serie.nome) && (!k.startsWith('clima') || temClima) && (!['mapa', 'sobre', 'ficha_mapa', 'lado', 'percurso'].includes(k) || (c.rota && c.rota.length > 1)));
  if (!modelos.some(([k]) => k === o.layout)) o.layout = 'classico';
  const seg = (k, ops, val) => `<div class="seg card-seg" data-o="${k}">${ops.map(([v, l]) => `<button type="button" data-v="${v}" class="${val === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const disponivel0 = (k) => k === 'rota' ? c.rota && c.rota.length > 1 : k === 'data' || k === 'logo' ? true : !!V[k];
  openSheet(`<p class="eyebrow">Compartilhar</p><div class="h2" style="margin-top:4px">Card da corrida</div>
    <div class="card-prev ${o.fundo === 'transparente' ? 'xadrez' : ''}" id="cd-prev"><canvas id="cd-cv"></canvas></div>
    <div class="cd-zoom"><button type="button" class="icon-btn sm" data-z="-1" aria-label="Diminuir">−</button><span class="tiny dim">Pince com 2 dedos para aumentar ou diminuir e arraste para mover</span><button type="button" class="icon-btn sm" data-z="1" aria-label="Aumentar">+</button><button type="button" class="link-btn tiny" id="cd-reset">Centralizar</button></div>
    <div class="field"><span>Fundo</span>${seg('fundo', [['transparente', 'Sem fundo'], ['foto', 'Foto'], ['nexos', 'Azul Nexos']], o.fundo)}</div>
    <input type="file" accept="image/*" id="cd-foto" hidden>
    <div class="field"><span>Modelo</span><div class="card-gal" id="cd-gal">${modelos.map(([k, l]) => `<button type="button" class="cg-it ${k === o.layout ? 'on' : ''}" data-lay="${k}"><span class="cg-cv"><canvas></canvas></span><small>${l}</small></button>`).join('')}</div></div>
    <div class="grid2"><div class="field"><span>Formato</span>${seg('formato', [['story', 'Story'], ['post', 'Post']], o.formato)}</div><div class="field"><span>Cor do texto</span>${seg('cor', [['branco', 'Branco'], ['preto', 'Preto']], o.cor)}</div></div>
    <div class="field"><span>O que aparece</span><div class="chips wrap" id="cd-stats">${CARD_STATS.filter(([k]) => disponivel0(k)).map(([k, l]) => `<label class="chipc"><input type="checkbox" value="${k}" ${o.stats[k] ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="field"><span>Localização</span><div id="cd-loc"></div></div>
    <div class="row" style="gap:8px;margin-top:6px"><button class="btn grow" id="cd-share"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg> Compartilhar</button></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost grow" id="cd-copy"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg> Copiar</button><button class="btn ghost grow" id="cd-down">Baixar</button></div>
    <p class="tiny dim" style="margin-top:8px" id="cd-dica"></p>`, (r) => {
    const cv = r.querySelector('#cd-cv'), prev = r.querySelector('#cd-prev'), inp = r.querySelector('#cd-foto'), dica = r.querySelector('#cd-dica');
    const salvar = () => { try { localStorage.setItem('nx-card', JSON.stringify({ layout: o.layout, fundo: o.fundo === 'foto' ? 'transparente' : o.fundo, cor: o.cor, formato: o.formato, stats: o.stats })); } catch {} };
    const pinta = async () => {
      prev.classList.toggle('xadrez', o.fundo === 'transparente'); prev.classList.toggle('post', o.formato === 'post');
      dica.textContent = o.fundo === 'transparente' ? 'Sem fundo: toque em “Copiar” e cole no story do Instagram por cima da sua foto. Dá para voltar, trocar o modelo e copiar outro para colar junto.' : o.fundo === 'foto' && !o.img ? 'Toque em “Foto” para escolher a imagem de fundo.' : '';
      await desenharCard(cv, c, o);
      miniaturas();
    };
    // miniaturas dos modelos com os dados reais da corrida
    let mT = null;
    const miniaturas = () => { clearTimeout(mT); mT = setTimeout(async () => {
      const gal = r.querySelector('#cd-gal'); if (!gal) return;
      gal.classList.toggle('xadrez', o.fundo === 'transparente'); gal.classList.toggle('post', o.formato === 'post');
      const tmp = document.createElement('canvas');
      for (const b of gal.querySelectorAll('[data-lay]')) {
        await desenharCard(tmp, c, { ...o, layout: b.dataset.lay, zoom: 1, dx: 0, dy: 0 });
        const mc = b.querySelector('canvas'); mc.width = 216; mc.height = Math.round(216 * tmp.height / tmp.width);
        const mx = mc.getContext('2d'); mx.clearRect(0, 0, mc.width, mc.height); mx.drawImage(tmp, 0, 0, mc.width, mc.height);
      }
    }, 60); };
    r.querySelector('#cd-gal').onclick = (e) => { const b = e.target.closest('[data-lay]'); if (!b) return; o.layout = b.dataset.lay; r.querySelectorAll('#cd-gal [data-lay]').forEach((x) => x.classList.toggle('on', x === b)); salvar(); desenharCard(cv, c, o); };
    r.querySelectorAll('.card-seg').forEach((sg) => sg.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return; const k = sg.dataset.o;
      if (k === 'fundo' && b.dataset.v === 'foto') { inp.click(); if (!o.img) return; }
      o[k] = b.dataset.v; if (k === 'fundo' && o.fundo === 'foto') o.cor = 'branco';
      if (k === 'fundo' && o.fundo === 'nexos') o.cor = 'branco';
      r.querySelectorAll('.card-seg').forEach((x) => x.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y.dataset.v === o[x.dataset.o])));
      salvar(); pinta();
    });
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const url = URL.createObjectURL(f); cardCarregarImg(url).then((im) => { if (!im) return toast('Não foi possível abrir a foto.', true); o.img = im; o.fundo = 'foto'; o.cor = 'branco'; r.querySelectorAll('.card-seg').forEach((x) => x.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y.dataset.v === o[x.dataset.o]))); pinta(); }); };
    // mexer no card com os dedos
    o.zoom = 1; o.dx = 0; o.dy = 0;
    let quadro = 0; const redesenha = () => { if (quadro) return; quadro = requestAnimationFrame(async () => { quadro = 0; await desenharCard(cv, c, o); }); };
    const limita = () => { o.zoom = Math.min(1.8, Math.max(.35, o.zoom)); const lim = 700; o.dx = Math.max(-lim, Math.min(lim, o.dx)); o.dy = Math.max(-lim * 1.4, Math.min(lim * 1.4, o.dy)); };
    const escala = () => cv.width / cv.getBoundingClientRect().width;
    const toques = new Map(); let ini = null;
    cv.style.touchAction = 'none';
    const estado = () => { const p = [...toques.values()]; if (p.length >= 2) { const [a, b] = p; return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; } return p.length ? { d: 0, cx: p[0].x, cy: p[0].y } : null; };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); toques.set(e.pointerId, { x: e.clientX, y: e.clientY }); ini = { ...estado(), z: o.zoom, dx: o.dx, dy: o.dy }; });
    cv.addEventListener('pointermove', (e) => {
      if (!toques.has(e.pointerId) || !ini) return; toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const agora = estado(), k = escala();
      if (agora.d && ini.d) o.zoom = ini.z * (agora.d / ini.d);
      o.dx = ini.dx + (agora.cx - ini.cx) * k; o.dy = ini.dy + (agora.cy - ini.cy) * k; limita(); redesenha();
    });
    const solta = (e) => { toques.delete(e.pointerId); const st0 = estado(); ini = st0 ? { ...st0, z: o.zoom, dx: o.dx, dy: o.dy } : null; };
    cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); o.zoom *= e.deltaY < 0 ? 1.06 : 1 / 1.06; limita(); redesenha(); }, { passive: false });
    r.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { o.zoom *= Number(b.dataset.z) > 0 ? 1.12 : 1 / 1.12; limita(); redesenha(); });
    r.querySelector('#cd-reset').onclick = () => { o.zoom = 1; o.dx = 0; o.dy = 0; redesenha(); };
    // localização: só aparece se o atleta escolher
    const locBox = r.querySelector('#cd-loc');
    const recentes = () => { try { return JSON.parse(localStorage.getItem('nx-card-locs') || '[]'); } catch { return []; } };
    const usarLoc = (t) => {
      o.local = String(t || '').trim().slice(0, 60);
      try { o.local ? localStorage.setItem('nx-card-loc-' + c.id, o.local) : localStorage.removeItem('nx-card-loc-' + c.id); if (o.local) localStorage.setItem('nx-card-locs', JSON.stringify([o.local, ...recentes().filter((x) => x !== o.local)].slice(0, 5))); } catch {}
      locUI(); pinta();
    };
    const PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M12 23s-7.5-6.9-7.5-12.6a7.5 7.5 0 0 1 15 0C19.5 16.1 12 23 12 23zm0-9.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/></svg>';
    const locUI = (aberto) => {
      if (o.local && !aberto) { locBox.innerHTML = `<div class="loc-on">${PIN}<b class="grow ellip">${esc(o.local)}</b><button type="button" class="link-btn small" data-l="trocar">Trocar</button><button type="button" class="icon-btn sm" data-l="tirar" aria-label="Tirar a localização">✕</button></div>`; return; }
      if (!aberto) { locBox.innerHTML = `<button type="button" class="btn ghost sm" data-l="abrir">${PIN} Adicionar localização</button>`; return; }
      const rec = recentes();
      locBox.innerHTML = `<div class="loc-box"><form class="row" style="gap:8px" id="loc-f"><input class="input grow" id="loc-q" placeholder="Ex.: Lagoa da Jansen, São Luís" value="${esc(o.local || '')}" autocomplete="off"><button class="btn sm" type="submit">Buscar</button></form>
        <div class="chips wrap" style="margin-top:10px"><button type="button" class="chip" data-l="aqui">${PIN} Onde estou agora</button>${c.rota && c.rota.length && c.fonte !== 'garmin' ? `<button type="button" class="chip" data-l="corrida">${PIN} Onde foi a corrida</button>` : ''}${rec.map((x) => `<button type="button" class="chip" data-usar="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div id="loc-res" class="loc-res"></div>
        <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="link-btn small" data-l="escrito">Usar do jeito que escrevi</button><span class="grow"></span><button type="button" class="link-btn small" data-l="fechar">Cancelar</button></div>
        <p class="tiny dim" style="margin-top:6px">A busca usa o OpenStreetMap e só acontece quando você toca em Buscar.</p></div>`;
      const q = locBox.querySelector('#loc-q'); setTimeout(() => q.focus(), 50);
      locBox.querySelector('#loc-f').onsubmit = async (e) => {
        e.preventDefault(); const t = q.value.trim(); if (t.length < 3) return toast('Digite pelo menos 3 letras.', true);
        const res = locBox.querySelector('#loc-res'); res.innerHTML = '<p class="small muted">Buscando…</p>';
        try { const l = await locBuscar(t); res.innerHTML = l.length ? l.map((x) => `<button type="button" class="loc-it" data-usar="${esc(x)}">${PIN}<span>${esc(x)}</span></button>`).join('') : '<p class="small muted">Nada encontrado. Você pode usar do jeito que escreveu.</p>'; }
        catch { res.innerHTML = '<p class="small muted">Não foi possível buscar agora. Você pode usar do jeito que escreveu.</p>'; }
      };
    };
    locBox.onclick = async (e) => {
      const u = e.target.closest('[data-usar]'); if (u) return usarLoc(u.dataset.usar);
      const b = e.target.closest('[data-l]'); if (!b) return; const a = b.dataset.l;
      if (a === 'abrir' || a === 'trocar') return locUI(true);
      if (a === 'fechar') return locUI(false);
      if (a === 'tirar') return usarLoc('');
      if (a === 'escrito') { const t = locBox.querySelector('#loc-q').value.trim(); return t ? usarLoc(t) : toast('Escreva o nome do lugar.', true); }
      if (a === 'corrida') { b.disabled = true; try { usarLoc(await locReversa(c.rota[0][0], c.rota[0][1])); } catch { b.disabled = false; toast('Não foi possível achar o lugar agora.', true); } return; }
      if (a === 'aqui') {
        if (!navigator.geolocation) return toast('Este aparelho não tem localização disponível.', true);
        b.disabled = true; b.lastChild.textContent = ' Procurando…';
        navigator.geolocation.getCurrentPosition(async (pos) => { try { usarLoc(await locReversa(pos.coords.latitude.toFixed(5), pos.coords.longitude.toFixed(5))); } catch { b.disabled = false; toast('Não foi possível achar o lugar agora.', true); } },
          () => { b.disabled = false; b.lastChild.textContent = ' Onde estou agora'; toast('Permita a localização para usar onde você está.', true); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
      }
    };
    locUI(false);
    r.querySelector('#cd-stats').onchange = (e) => { o.stats[e.target.value] = e.target.checked; salvar(); pinta(); };
    // a imagem salva sai em alta definição (2160 × 3840 no story), mesmo a prévia sendo menor
    const blob = async () => { const hd = document.createElement('canvas'); await desenharCard(hd, c, { ...o, escala: 2 }); return await new Promise((res) => hd.toBlob(res, 'image/png')); };
    const nomeArq = `nexos-corrida-${isoDia(c.data)}.png`;
    const marcar = () => { try { localStorage.setItem('nx-card-' + c.id, '1'); } catch {} };
    r.querySelector('#cd-down').onclick = async () => { const b = await blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nomeArq; document.body.append(a); a.click(); a.remove(); marcar(); toast('Imagem salva!'); };
    // copiar para colar como figurinha no story (sem fundo: corta o espaço vazio em volta)
    const blobCopia = async () => {
      const hd = document.createElement('canvas'); await desenharCard(hd, c, { ...o, escala: 2 });
      let saida = hd;
      if (o.fundo === 'transparente') {
        const W = hd.width, H = hd.height, px = hd.getContext('2d').getImageData(0, 0, W, H).data;
        let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (px[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 > x0 && y1 > y0) {
          const m = 40; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W, x1 + m); y1 = Math.min(H, y1 + m);
          saida = document.createElement('canvas'); saida.width = x1 - x0; saida.height = y1 - y0;
          saida.getContext('2d').drawImage(hd, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
        }
      }
      return await new Promise((res) => saida.toBlob(res, 'image/png'));
    };
    r.querySelector('#cd-copy').onclick = async () => {
      if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) return toast('Este celular não deixa copiar imagem. Use “Compartilhar” ou “Baixar”.', true);
      try {
        // o ClipboardItem precisa nascer na hora do toque (exigência do iPhone); a imagem fica pronta logo depois
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobCopia() })]);
        marcar(); toast('Card copiado! No story do Instagram, toque na tela e escolha “Colar”. Depois volte aqui para copiar outro.');
      } catch (e) { toast('Não foi possível copiar. Use “Compartilhar” ou “Baixar”.', true); }
    };
    r.querySelector('#cd-share').onclick = async () => {
      const b = await blob(); const file = new File([b], nomeArq, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); marcar(); } catch (e) { if (e.name !== 'AbortError') toast('Não foi possível compartilhar. Use “Baixar”.', true); } }
      else r.querySelector('#cd-down').click();
    };
    if (temClima) climaDe(c).then((cl) => { o.clima = cl; pinta(); });
    pinta();
  });
}

/* ---------- análise completa da corrida (gráficos, voltas, zonas de FC, números do relógio) ---------- */
const GR_CORES = { pace: '#2f6bff', fc: '#ff4d6d', cad: '#8b5cf6', alt: '#7f8ea8', pot: '#f59e0b', temp: '#f97316' };
const ZONAS_FC = [['Z1', 'Recuperação', 0, 0.6, '#9aa8c0'], ['Z2', 'Leve', 0.6, 0.7, '#3ddc97'], ['Z3', 'Moderado', 0.7, 0.8, '#46d6ff'], ['Z4', 'Limiar', 0.8, 0.9, '#ffcf5c'], ['Z5', 'Máximo', 0.9, 9, '#ff6b6b']];
const paceTxt = (v) => (v && v > 0.5 ? fmtPace(1000 / v).replace('/km', '') : '–');
function analiseCorridaHTML(c, fcMax, fcMaxFonte) {
  const A = c.analise || {}, S = A.serie || {}, E = { ...(c.resumo_rel || {}), ...(A.extras || {}) };
  const blocos = [];
  // ---- gráficos (arrastar o dedo mostra os valores do ponto) ----
  const n = (S.t || []).length;
  if (n > 5) {
    const porDist = (S.d[n - 1] || 0) > 300;
    const X = porDist ? S.d.map((d) => d / 1000) : S.t.map((t) => t / 60);
    const series = [
      ['pace', 'Pace', S.vel, (v) => paceTxt(v), '/km'], ['fc', 'Frequência cardíaca', S.fc, (v) => (v ? Math.round(v) : '–'), 'bpm'],
      ['cad', 'Cadência', S.cad, (v) => (v ? Math.round(v) : '–'), 'ppm'], ['alt', 'Altitude', S.alt, (v) => (v != null ? Math.round(v) : '–'), 'm'],
      ['pot', 'Potência', S.pot, (v) => (v ? Math.round(v) : '–'), 'W'], ['temp', 'Temperatura', S.temp, (v) => (v != null ? f1(v) : '–'), '°C'],
    ].filter(([, , y]) => y && y.filter((v) => v != null).length > 3);
    const W = 600, H = 110;
    const graf = ([k, nome, Y, fmt, un]) => {
      let ys = Y.map((v) => (v == null ? null : k === 'pace' ? (v > 0.8 ? Math.min(v, 7) : null) : v));
      const val = ys.filter((v) => v != null); if (!val.length) return '';
      let lo = Math.min(...val), hi = Math.max(...val);
      if (k === 'pace') { const s = val.slice().sort((a, b) => a - b); lo = s[Math.floor(s.length * 0.03)]; hi = s[Math.ceil(s.length * 0.99) - 1]; }
      if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
      const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
      const x0 = X[0], x1 = X[n - 1] || 1;
      const px = (i) => ((X[i] - x0) / (x1 - x0 || 1)) * W, py = (v) => H - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * H;
      let d = '', abre = false; ys.forEach((v, i) => { if (v == null) { abre = false; return; } d += `${abre ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`; abre = true; });
      const area = k === 'alt' ? `<path d="${d}L${px(n - 1).toFixed(1)},${H}L${px(0).toFixed(1)},${H}Z" fill="${GR_CORES[k]}" opacity=".18"/>` : '';
      const medV = val.reduce((a, b) => a + b, 0) / val.length;
      const resumoTxt = k === 'pace' ? `média ${paceTxt((c.distancia_m || 0) / (c.duracao_s || 1))} · melhor ${paceTxt(Math.max(...val))}` : k === 'alt' ? `${Math.round(Math.min(...val))}–${Math.round(Math.max(...val))} m` : `média ${fmt(medV)} · máx ${fmt(Math.max(...val))}`;
      return `<div class="gr" data-k="${k}"><div class="gr-h"><b style="color:${GR_CORES[k]}">${nome}</b><span class="gr-v" data-v="${k}">${resumoTxt}</span></div>
        <div class="gr-area"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${area}<path d="${d}" fill="none" stroke="${GR_CORES[k]}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><i class="gr-cur" hidden></i></div></div>`;
    };
    const graficos = series.map(graf).join('');
    if (graficos) blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Gráficos</h2>${slashes}</div><div class="card graficos" id="graficos" data-pordist="${porDist ? 1 : 0}">
      <div class="gr-leitura" id="gr-leitura">Arraste o dedo sobre os gráficos para ver cada ponto</div>${graficos}
      <div class="gr-eixo"><span>0</span><span>${porDist ? f1(X[n - 1], 1) + ' km' : Math.round(X[n - 1]) + ' min'}</span></div></div></div>`);
  }
  // ---- zonas de FC ----
  if (S.fc && S.fc.filter((v) => v).length > 5) {
    const fm = fcMax || c.fc_max; const tz = ZONAS_FC.map(() => 0);
    for (let i = 1; i < n; i++) { const v = S.fc[i]; const dt = S.t[i] - S.t[i - 1]; if (!v || !(dt > 0) || dt > 120) continue; const p = v / fm; const z = ZONAS_FC.findIndex(([, , a, b]) => p >= a && p < b); if (z >= 0) tz[z] += dt; }
    const tot = tz.reduce((a, b) => a + b, 0);
    if (tot > 0 && fm) blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Zonas de frequência cardíaca</h2>${slashes}</div><div class="card zonas-fc">
      ${ZONAS_FC.map(([z, nm, a, b, cor], i) => { const pc = (tz[i] / tot) * 100; return `<div class="zf"><span class="zf-n"><b>${z}</b> ${nm}<em>${a === 0 ? 'até ' + Math.round(fm * b) : b > 2 ? Math.round(fm * a) + '+' : Math.round(fm * a) + '–' + Math.round(fm * b)} bpm</em></span><div class="zf-bar"><i style="width:${Math.max(pc, pc ? 2 : 0).toFixed(1)}%;background:${cor}"></i></div><span class="zf-t">${fmtDur(tz[i])}<em>${Math.round(pc)}%</em></span></div>`; }).join('')}
      <p class="tiny dim" style="margin-top:8px">FC máxima usada: ${Math.round(fm)} bpm (${fcMaxFonte || 'a maior da corrida'}).</p></div></div>`);
  }
  // ---- voltas ----
  const V = A.voltas || [];
  if (V.length > 1) {
    const pv = V.map((v) => (v.d > 0 ? v.seg / (v.d / 1000) : null)); const ok = pv.filter((x) => x);
    const pMin = Math.min(...ok), pMax = Math.max(...ok); const temPot = V.some((v) => v.pot);
    blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Voltas</h2><span class="small muted">${V.length} voltas</span></div><div class="card voltas-c"><div class="voltas-t${temPot ? ' pot' : ''}">
      <div class="vt-h"><span>#</span><span>Dist.</span><span>Tempo</span><span>Pace</span><span>FC</span><span>Máx</span><span>Cad.</span>${temPot ? '<span>Pot.</span>' : ''}</div>
      ${V.map((v, i) => { const p = pv[i]; const w = p && pMax > pMin ? 25 + (75 * (pMax - p)) / (pMax - pMin) : 60; return `<div class="vt-l"><span>${i + 1}</span><span>${v.d >= 1000 ? f1(v.d / 1000, 2) + ' km' : Math.round(v.d) + ' m'}</span><span>${fmtDur(v.seg)}</span><span class="vt-p"><i style="width:${w.toFixed(0)}%"></i><b>${p ? fmtPace(p).replace('/km', '') : '–'}</b></span><span>${v.fc || '–'}</span><span>${v.fcmax || '–'}</span><span>${v.cad || '–'}</span>${temPot ? `<span>${v.pot || '–'}</span>` : ''}</div>`; }).join('')}
    </div></div></div>`);
  }
  // ---- metades da corrida (split e deriva cardíaca) ----
  if (n > 20 && S.d[n - 1] > 1500) {
    const meio = S.d[n - 1] / 2; const im = S.d.findIndex((d) => d >= meio);
    const p1 = S.t[im] / (S.d[im] / 1000), p2 = (S.t[n - 1] - S.t[im]) / ((S.d[n - 1] - S.d[im]) / 1000);
    const fcM = (a, b) => { const v = (S.fc || []).slice(a, b).filter((x) => x); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
    const f1a = fcM(0, im), f2a = fcM(im, n);
    const dif = Math.round(p2 - p1);
    const linhas = [[`1ª metade`, `${fmtPace(p1)}${f1a ? ' · ' + Math.round(f1a) + ' bpm' : ''}`], [`2ª metade`, `${fmtPace(p2)}${f2a ? ' · ' + Math.round(f2a) + ' bpm' : ''}`],
      ['Divisão', dif === 0 ? 'igual nas duas metades' : dif < 0 ? `negativa (2ª metade ${-dif} s/km mais rápida)` : `positiva (2ª metade ${dif} s/km mais lenta)`]];
    if (f1a && f2a) { const ef1 = (1000 / p1) / f1a, ef2 = (1000 / p2) / f2a; const dec = ((ef1 - ef2) / ef1) * 100; linhas.push(['Desacoplamento (pace × FC)', `${f1(dec, 1)}%${Math.abs(dec) < 5 ? ' · estável' : ' · a FC subiu em relação ao pace'}`]); }
    blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Metades da corrida</h2>${slashes}</div><div class="card kv">${linhas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div></div>`);
  }
  // ---- todos os números do relógio ----
  const velMax = E.vel_max_rel || E.vel_max;
  const num = [
    ['Tempo em movimento', E.mov_s && Math.abs(E.mov_s - c.duracao_s) > 20 ? fmtDurLongo(E.mov_s) : null], ['Tempo total (com pausas)', E.total_s && E.total_s - c.duracao_s > 20 ? fmtDurLongo(E.total_s) : null],
    ['Melhor pace', E.vel_max ? paceTxt(E.vel_max) + '/km' : null], ['Velocidade máxima', velMax ? f1(velMax * 3.6) + ' km/h' : null],
    ['FC mínima', E.fc_min ? E.fc_min + ' bpm' : null], ['Cadência máxima', (E.cad_max || E.cad_max_rel) ? (E.cad_max || E.cad_max_rel) + ' ppm' : null],
    ['Descida', (E.desc ?? E.desc_rel) ? Math.round(E.desc ?? E.desc_rel) + ' m' : null], ['Altitude', E.alt_min != null && E.alt_max != null ? `${Math.round(E.alt_min)} a ${Math.round(E.alt_max)} m` : null],
    ['Potência média', (E.pot_med || E.pot_med_rel) ? (E.pot_med || E.pot_med_rel) + ' W' : null], ['Potência máxima', (E.pot_max || E.pot_max_rel) ? (E.pot_max || E.pot_max_rel) + ' W' : null],
    ['Temperatura', E.temp_med != null ? `${f1(E.temp_med)} °C${E.temp_min != null && E.temp_max !== E.temp_min ? ` (${f1(E.temp_min)} a ${f1(E.temp_max)})` : ''}` : null],
    ['Calorias', E.kcal ? Math.round(E.kcal) + ' kcal' : null], ['Passos', E.passos ? Math.round(E.passos).toLocaleString('pt-BR') : null],
    ['Comprimento da passada', E.passada_m ? f1(E.passada_m, 2) + ' m' : null], ['Oscilação vertical', E.oscil_cm ? f1(E.oscil_cm) + ' cm' : null],
    ['Tempo de contato com o solo', E.contato_ms ? E.contato_ms + ' ms' : null], ['Razão vertical', E.razao_vert ? f1(E.razao_vert) + '%' : null],
    ['Efeito de treino aeróbico', E.te_aer ? f1(E.te_aer) : null], ['Efeito de treino anaeróbico', E.te_ana ? f1(E.te_ana) : null],
    ['Relógio', E.dispositivo || null],
  ].filter(([, v]) => v);
  if (num.length) blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Todos os números</h2>${slashes}</div><div class="card kv">${num.map(([a, b]) => `<div><span>${a}</span><b>${esc(String(b))}</b></div>`).join('')}</div></div>`);
  return blocos;
}
function bindGraficos(root, c) {
  const box = root.querySelector('#graficos'); if (!box) return;
  const S = c.analise.serie, n = S.t.length, porDist = box.dataset.pordist === '1';
  const X = porDist ? S.d.map((d) => d / 1000) : S.t.map((t) => t / 60);
  const leitura = box.querySelector('#gr-leitura');
  const fmt = { pace: (v) => paceTxt(v) + '/km', fc: (v) => (v ? Math.round(v) + ' bpm' : '–'), cad: (v) => (v ? Math.round(v) + ' ppm' : '–'), alt: (v) => (v != null ? Math.round(v) + ' m' : '–'), pot: (v) => (v ? Math.round(v) + ' W' : '–'), temp: (v) => (v != null ? f1(v) + ' °C' : '–') };
  const chave = { pace: 'vel', fc: 'fc', cad: 'cad', alt: 'alt', pot: 'pot', temp: 'temp' };
  const resumoOrig = {}; box.querySelectorAll('[data-v]').forEach((s) => (resumoOrig[s.dataset.v] = s.textContent));
  const mostrar = (clientX) => {
    const r = box.querySelector('.gr-area').getBoundingClientRect(); const fr = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const alvo = X[0] + fr * (X[n - 1] - X[0]); let i = 0; while (i < n - 1 && X[i + 1] <= alvo) i++;
    box.querySelectorAll('.gr-cur').forEach((c2) => { c2.hidden = false; c2.style.left = (fr * 100).toFixed(2) + '%'; });
    box.querySelectorAll('[data-v]').forEach((s) => { const arr = S[chave[s.dataset.v]]; if (arr) s.textContent = fmt[s.dataset.v](arr[i]); });
    leitura.textContent = `${f1(S.d[i] / 1000, 2)} km · ${fmtDurLongo(S.t[i])}`;
  };
  const sair = () => { box.querySelectorAll('.gr-cur').forEach((c2) => (c2.hidden = true)); box.querySelectorAll('[data-v]').forEach((s) => (s.textContent = resumoOrig[s.dataset.v])); leitura.textContent = 'Arraste o dedo sobre os gráficos para ver cada ponto'; };
  box.querySelectorAll('.gr-area').forEach((a) => {
    a.addEventListener('pointerdown', (e) => mostrar(e.clientX));
    a.addEventListener('pointermove', (e) => mostrar(e.clientX));
    a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') sair(); });
  });
  box.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(sair, 1800); });
}

/* ---------- Leitura Nexos: leitura automática de cada corrida ----------
   Roda no próprio aparelho com regras de fisiologia (zonas, FC, parciais, histórico e planilha):
   não depende de servidor, então funciona igual com 5 ou 5 mil alunos. */
const N1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
function zonaDoPace(pace, perfil) {
  const P = perfil && perfil.paces; if (!P || !pace) return null;
  const ordem = ['tiros', 'intervalado', 'limiar', 'maratona', 'leve'];
  for (const k of ordem) { const f = P[k]; if (f && pace <= Math.max(f[0], f[1]) + 3) return k; }
  return 'rec';
}
const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const fmtSeg = (s) => { s = Math.round(Math.abs(s)); return s < 60 ? `${s} s` : `${Math.floor(s / 60)}min${s % 60 ? ' ' + String(s % 60).padStart(2, '0') + 's' : ''}`; };
/** separa as voltas do relógio em esforço x recuperação (2 grupos pelo pace) */
function tirosDasVoltas(voltas, comAqDq, repPl) {
  const L = (voltas || []).map((v, i) => ({ ...v, i, pace: v.d > 30 && v.seg > 8 ? v.seg / (v.d / 1000) : null })).filter((v) => v.pace && v.pace < 1200);
  if (L.length < 4) return null;
  // com a planilha: o tiro é a volta com a duração (ou distância) do passo forte; sobrando, ficam os mais rápidos
  const co = repPl && (repPl.passos || []).find((p) => p.k === 'co'), rc = repPl && (repPl.passos || []).find((p) => p.k !== 'co');
  if (co) {
    const alvo = co.med === 'min' ? { k: 'seg', v: co.v * 60 } : { k: 'd', v: co.med === 'km' ? co.v * 1000 : co.v };
    const alvoRc = rc && (rc.med === 'min' ? { k: 'seg', v: rc.v * 60 } : { k: 'd', v: rc.med === 'km' ? rc.v * 1000 : rc.v });
    const bate = (v, a, tol) => Math.abs(v[a.k] - a.v) / a.v <= tol;
    const ambiguo = alvoRc && alvoRc.k === alvo.k && Math.abs(alvoRc.v - alvo.v) / alvo.v < 0.3;
    if (!ambiguo) {
      let esf = L.filter((v) => bate(v, alvo, 0.2));
      if (esf.length >= 2) {
        if (esf.length > repPl.n) esf = esf.slice().sort((x, y) => x.pace - y.pace).slice(0, repPl.n).sort((x, y) => x.i - y.i);
        const ids = new Set(esf.map((v) => v.i)), i0 = esf[0].i, i1 = esf[esf.length - 1].i;
        const rec = L.filter((v) => !ids.has(v.i) && v.i > i0 && v.i < i1);
        if (rec.length) return { esf, rec };
      }
    }
  }
  const miolo = comAqDq && L.length > 5 ? L.slice(1, -1) : L;
  let a = Math.min(...miolo.map((v) => v.pace)), b = Math.max(...miolo.map((v) => v.pace));
  for (let k = 0; k < 12; k++) { const lim = (a + b) / 2; const f = miolo.filter((v) => v.pace <= lim), s = miolo.filter((v) => v.pace > lim); if (!f.length || !s.length) break; a = media(f.map((v) => v.pace)); b = media(s.map((v) => v.pace)); }
  const lim = (a + b) / 2, esf = miolo.filter((v) => v.pace <= lim), rec = miolo.filter((v) => v.pace > lim);
  if (esf.length < 2 || !rec.length || a > b * 0.88) return null; // não é um treino de tiros de verdade
  return { esf, rec };
}
/** tempo em cada zona de FC (Z1 a Z5, em % da FC máxima) pela série do relógio */
function tempoZonasFC(serie, fcMax) {
  const T = serie && serie.t, F = serie && serie.fc; if (!T || !F || !fcMax || T.length < 20) return null;
  const z = [0, 0, 0, 0, 0]; let tot = 0;
  for (let i = 1; i < T.length; i++) { const f = F[i]; const dt = T[i] - T[i - 1]; if (!f || !(dt > 0) || dt > 30) continue; const p = f / fcMax; z[p < 0.6 ? 0 : p < 0.7 ? 1 : p < 0.8 ? 2 : p < 0.9 ? 3 : 4] += dt; tot += dt; }
  return tot > 300 ? z.map((x) => x / tot) : null;
}
function nexosInteligencia(c, { plano = null, perfil = {}, hist = [] } = {}) {
  if (!c || !comDist(c) || !c.duracao_s) return null;
  const A = c.analise || {}, EX = A.extras || {}, km = c.distancia_m / 1000, pace = paceDe(c);
  const tipo = (plano && plano.tipo) || c.tipo;
  const est = plano ? estruturaDe(plano) : [];
  const repPl = est.find((s) => s.k === 'rep');
  let misto = !!repPl || ['intervalado', 'tiros', 'fartlek'].includes(tipo);
  const leveP = ['rodagem', 'regenerativo', 'longao'].includes(tipo);
  const sec = { exe: [], ritmo: [], fc: [], cond: [], comp: [] }; // detalhes do "Ver mais"
  const frases = []; let dica = '';
  const fcMax = perfil.fcMax || null;
  // ---------- esforço geral ----------
  let esfN = 0; const pctFc = c.fc_media && fcMax ? c.fc_media / fcMax : null;
  if (pctFc) esfN = pctFc < 0.75 ? 1 : pctFc < 0.83 ? 2 : pctFc < 0.9 ? 3 : 4;
  else if (c.rpe != null) esfN = c.rpe <= 3 ? 1 : c.rpe <= 5 ? 2 : c.rpe <= 7 ? 3 : 4;
  else { const z = !misto && zonaDoPace(pace, perfil); esfN = { rec: 1, leve: 1, maratona: 2, limiar: 3, intervalado: 4, tiros: 4 }[z] || 0; }
  const esf = ['', 'esforço leve', 'esforço moderado', 'esforço relativo elevado', 'esforço muito alto'][esfN];
  const nome = tipo === 'ritmo' ? 'Treino de ritmo' : TIPOS_CORRIDA.some((t) => t[0] === tipo) && tipo !== 'folga' ? nomeTipo(tipo) : 'Corrida';
  let abertura = `${nome} de ${N1(km)} km${esf ? ` com ${esf}` : ''}`;
  // ---------- 1. execução de treino intervalado ----------
  let tiros = misto ? tirosDasVoltas(A.voltas, est.some((s) => s.k === 'aq') || !plano, repPl) : null;
  if (!tiros && !misto && !leveP) { const t = tirosDasVoltas(A.voltas, true); if (t && t.esf.length >= 3 && media(t.esf.map((v) => v.pace)) < media(t.rec.map((v) => v.pace)) * 0.85) tiros = t; } // tiros sem planilha
  if (tiros) {
    const { esf: E, rec: R } = tiros, pE = E.map((v) => v.pace), nPl = repPl ? repPl.n : null;
    const pm = media(pE), melhor = Math.min(...pE), pior = Math.max(...pE), spread = pior - melhor;
    const ini = media(pE.slice(0, Math.min(2, Math.floor(pE.length / 2)))), fim = media(pE.slice(-Math.min(2, Math.floor(pE.length / 2))));
    const queda = (fim - ini) / ini;
    const alvoPasso = repPl && (repPl.passos || []).find((p) => p.k === 'co');
    if (!misto) { misto = true; }
    abertura = repPl && plano.titulo
      ? `${plano.titulo}: ${E.length >= nPl ? `fez ${nPl === E.length ? 'as' : 'mais que as'} ${nPl} repetições` : `${E.length} de ${nPl} repetições`}${esf ? `, com ${esf}` : ''}`
      : `${tipo === 'corrida' ? 'Treino intervalado' : nome} com ${E.length} ${E.length === 1 ? 'tiro' : 'tiros'}${nPl ? ` de ${nPl} previstos` : ''}${esf ? `, ${esf}` : ''}`;
    sec.exe.push(`${E.length} ${E.length === 1 ? 'esforço' : 'esforços'} identificados nas voltas do relógio${nPl ? ` (planilha: ${nPl})` : ''}. Pace médio nos tiros: ${fmtPace(pm)}; o mais rápido em ${fmtPace(melhor)} e o mais lento em ${fmtPace(pior)}.`);
    sec.exe.push(`Tiros: ${E.map((v, k) => `${k + 1}º ${v.d >= 950 ? N1(v.d / 1000) + ' km' : Math.round(v.d) + ' m'} em ${fmtSeg(v.seg)}${v.fc ? ` (${v.fc} bpm)` : ''}`).join(' · ')}.`);
    if (alvoPasso) {
      const alvoQ = alvoPasso.med === 'm' ? alvoPasso.v : alvoPasso.med === 'km' ? alvoPasso.v * 1000 : null, alvoT = alvoPasso.med === 'min' ? alvoPasso.v * 60 : null;
      if (alvoQ) { const dm = media(E.map((v) => v.d)); if (Math.abs(dm - alvoQ) / alvoQ > 0.12) sec.exe.push(`Os tiros tiveram em média ${Math.round(dm)} m, e a planilha pedia ${Math.round(alvoQ)} m.`); }
      if (alvoT) { const tm = media(E.map((v) => v.seg)); if (Math.abs(tm - alvoT) / alvoT > 0.15) sec.exe.push(`Os tiros duraram em média ${fmtSeg(tm)}, e a planilha pedia ${fmtSeg(alvoT)}.`); }
      const fx = perfil.paces && perfil.paces[alvoPasso.z];
      if (fx) {
        const rap = Math.min(...fx), len = Math.max(...fx);
        if (pm < rap - 4) { sec.exe.push(`Os tiros saíram ${fmtSeg(rap - pm)}/km mais rápidos que a zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`); dica = dica || `nos próximos tiros, segure no alvo de ${faixaPace(fx)}: correr acima da zona aumenta o desgaste sem trazer mais adaptação`; }
        else if (pm > len + 4) { sec.exe.push(`Os tiros ficaram ${fmtSeg(pm - len)}/km mais lentos que a zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`); }
        else sec.exe.push(`Os tiros ficaram dentro da zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`);
      }
    }
    if (nPl && E.length < nPl && !(repPl && plano.titulo)) { frases.push(`Faltaram ${nPl - E.length} ${nPl - E.length === 1 ? 'tiro' : 'tiros'} em relação à planilha.`); }
    if (queda > 0.04) { frases.push(`Os últimos tiros ficaram ${fmtSeg(fim - ini)}/km mais lentos que os primeiros, sinal de que a largada foi forte demais ou a recuperação curta.`); dica = dica || 'comece os primeiros tiros 3 a 5 s/km mais devagar para chegar inteiro no fim'; }
    else if (queda < -0.02) frases.push(`Terminou os tiros mais rápido do que começou, ótima distribuição de esforço.`);
    else if (spread / pm < 0.04) frases.push(`Tiros muito regulares: diferença de só ${fmtSeg(spread)}/km entre o mais rápido e o mais lento.`);
    else frases.push(`Variação de ${fmtSeg(spread)}/km entre o tiro mais rápido e o mais lento.`);
    const fE = E.filter((v) => v.fc).map((v) => v.fc), fR = R.filter((v) => v.fc).map((v) => v.fc);
    if (fE.length && fR.length) {
      const queda2 = media(fE) - media(fR), pico = Math.max(...E.map((v) => v.fcmax || v.fc || 0));
      sec.fc.push(`FC média nos tiros: ${Math.round(media(fE))} bpm${pico ? ` (pico de ${pico})` : ''}; nas recuperações: ${Math.round(media(fR))} bpm.`);
      if (queda2 < 8) { sec.fc.push(`A frequência quase não baixou entre os tiros (${queda2 > 0 ? Math.round(queda2) + ' bpm' : 'ficou igual'}): as recuperações ficaram curtas ou rápidas demais.`); dica = dica || 'nas recuperações, trote bem leve ou caminhe até a respiração voltar'; }
      else sec.fc.push(`A frequência baixou ${Math.round(queda2)} bpm nas recuperações: boa recuperação entre os tiros.`);
    }
  }
  // ---------- 2. ritmo e fadiga em corrida contínua ----------
  const sp = (c.parciais || []).filter((p) => !p.parcial && p.seg > 0);
  if (!tiros && sp.length >= 4) {
    const med = media(sp.map((p) => p.seg)), h = Math.floor(sp.length / 2);
    const m1 = media(sp.slice(0, h).map((p) => p.seg)), m2 = media(sp.slice(-h).map((p) => p.seg));
    const cv = Math.sqrt(media(sp.map((p) => (p.seg - med) ** 2))) / med;
    const fimN = Math.min(3, Math.ceil(sp.length / 4)), mFim = media(sp.slice(-fimN).map((p) => p.seg));
    const rapido = sp.reduce((a, p) => (p.seg < a.seg ? p : a)), lento = sp.reduce((a, p) => (p.seg > a.seg ? p : a));
    const dif = (m2 - m1) / m1;
    let r;
    if (misto) r = `ritmo variando entre ${fmtPace(rapido.seg)} e ${fmtPace(lento.seg)}, como pede o treino`;
    else if (dif < -0.02) r = 'terminou mais forte do que começou (split negativo)';
    else if (mFim > med * 1.05 && esfN >= 3) r = 'manteve o ritmo apesar da fadiga nos últimos quilômetros';
    else if (mFim > med * 1.05) r = `perdeu ${fmtSeg(mFim - med)}/km nos últimos ${fimN} km`;
    else if (cv < 0.03) r = 'ritmo muito consistente do início ao fim';
    else if (dif > 0.04) r = 'começou forte e foi caindo';
    else r = 'ritmo regular';
    abertura += `; ${r}`;
    sec.ritmo.push(`Primeira metade em ${fmtPace(m1)} e segunda em ${fmtPace(m2)} (${m2 > m1 ? '+' : '−'}${fmtSeg(m2 - m1)}/km). Km mais rápido: o ${rapido.km}º em ${fmtPace(rapido.seg)}; mais lento: o ${lento.km}º em ${fmtPace(lento.seg)}.`);
    sec.ritmo.push(`Variação entre os quilômetros: ${Math.round(cv * 100)}% (${cv < 0.03 ? 'muito estável' : cv < 0.06 ? 'estável' : 'oscilou bastante'}).`);
    if (!misto && mFim > med * 1.05 && !dica) dica = 'no próximo treino parecido, largue um pouco mais devagar e guarde energia para o fim';
    // desacoplamento aeróbico (Friel): eficiência = velocidade ÷ FC, 1ª x 2ª metade
    const f1 = sp.slice(0, h).filter((p) => p.fc), f2 = sp.slice(-h).filter((p) => p.fc);
    if (!misto && f1.length >= 2 && f2.length >= 2) {
      const ef1 = media(f1.map((p) => 1000 / p.seg / p.fc)), ef2 = media(f2.map((p) => 1000 / p.seg / p.fc));
      const dec = (ef1 - ef2) / ef1;
      sec.fc.push(`Desacoplamento aeróbico de ${N1(dec * 100)}% (relação entre ritmo e frequência da 1ª para a 2ª metade). ${dec < 0.05 ? 'Abaixo de 5%: boa base aeróbica para esse ritmo e distância.' : 'Acima de 5%: o coração precisou trabalhar mais para manter o ritmo no fim.'}`);
      if (dec >= 0.08 && km >= 8) frases.push(`A frequência subiu ${Math.round(media(f2.map((p) => p.fc)) - media(f1.map((p) => p.fc)))} bpm na segunda metade sem ganho de ritmo (deriva cardíaca), típico de calor, hidratação curta ou base aeróbica ainda em construção.`);
    }
  } else if (!tiros) abertura += '';
  // ---------- 3. zonas de frequência ----------
  const zf = tempoZonasFC(A.serie, fcMax);
  if (zf) {
    sec.fc.push(`Tempo em cada zona de FC: ${zf.map((x, i) => `Z${i + 1} ${Math.round(x * 100)}%`).join(' · ')}.`);
    if (leveP && zf[2] + zf[3] + zf[4] > 0.35) { frases.push(`Para um treino leve, ${Math.round((zf[2] + zf[3] + zf[4]) * 100)}% do tempo ficou acima da Z2: virou um treino moderado.`); dica = dica || `no leve, mantenha a frequência abaixo de ${Math.round(fcMax * 0.75)} bpm, mesmo que precise caminhar nas subidas`; }
  } else if (pctFc) sec.fc.push(`FC média de ${c.fc_media} bpm, cerca de ${Math.round(pctFc * 100)}% da sua máxima${c.fc_max ? `; pico de ${c.fc_max}` : ''}.`);
  if (leveP && !zf && perfil.paces && perfil.paces.leve && pace < Math.min(...perfil.paces.leve) * 0.95) { frases.push(`O ritmo ficou acima da zona leve (${faixaPace(perfil.paces.leve)}).`); dica = dica || `no próximo leve, fique entre ${faixaPace(perfil.paces.leve)}: o leve de verdade é o que constrói a base`; }
  if (!misto) { const zp = zonaDoPace(pace, perfil); if (zp) sec.ritmo.push(`Ritmo médio de ${fmtPace(pace)}, que fica na sua zona ${ZONAS_INFO[zp].n}.`); }
  // ---------- 4. condições: calor, subida, cadência ----------
  const temp = EX.temp_med != null ? EX.temp_med : null, sub = EX.sub != null ? EX.sub : c.elevacao_m;
  if (temp != null && temp >= 27) { sec.cond.push(`Temperatura média de ${N1(temp)} °C. No calor, a frequência sobe de 5 a 10 bpm e o ritmo cai alguns segundos por km para o mesmo esforço.`); if (temp >= 29 && esfN >= 3) frases.push(`Os ${Math.round(temp)} °C pesaram no esforço.`); }
  if (sub != null && km > 0) { const m = sub / km; if (m >= 10) { sec.cond.push(`Percurso com ${Math.round(sub)} m de subida (${Math.round(m)} m por km): o ritmo em plano seria cerca de ${Math.round(m * 0.8)} s/km mais rápido.`); if (m >= 15) frases.push(`Percurso com bastante subida (${Math.round(sub)} m), o que explica parte do ritmo.`); } else if (sub > 0) sec.cond.push(`Percurso quase plano (${Math.round(sub)} m de subida).`); }
  const cad = c.cadencia || (A.voltas && media(A.voltas.filter((v) => v.cad > 100).map((v) => v.cad)));
  if (cad) { sec.cond.push(`Cadência média de ${Math.round(cad)} passos por minuto${cad < 160 && !misto ? ': passos um pouco mais curtos e rápidos (perto de 165–175) costumam aliviar o impacto' : ''}.`); }
  if (EX.te_aer != null) sec.cond.push(`Efeito de treino do relógio: aeróbico ${N1(EX.te_aer)}${EX.te_ana != null ? ` e anaeróbico ${N1(EX.te_ana)}` : ''} (escala de 0 a 5).`);
  // ---------- 5. planilha ----------
  let planTxt = '';
  if (plano) {
    const prev = Number(plano.distancia_km) || 0;
    if (prev) { const pc = km / prev; planTxt = pc >= 0.95 ? (pc > 1.15 ? `foi além do previsto (${N1(km)} de ${N1(prev)} km)` : 'cumpriu a distância prevista') : `fez ${Math.round(pc * 100)}% da distância prevista`; sec.exe.unshift(`Planilha: ${plano.titulo || nomeTipo(plano.tipo)}, ${N1(prev)} km previstos; feito ${N1(km)} km.`); }
  }
  // ---------- 6. comparação com o próprio atleta (90 dias) ----------
  const t0 = Date.parse(c.data);
  const ant = hist.filter((x) => x.id !== c.id && ehCorr(x) && x.distancia_m >= 2000 && Date.parse(x.data) < t0 && Date.parse(x.data) > t0 - 90 * 864e5);
  let marco = '';
  if (ant.length >= 3) {
    const maxKm = Math.max(...ant.map((x) => x.distancia_m)) / 1000;
    const rap = ant.filter((x) => x.distancia_m >= Math.min(5000, c.distancia_m * 0.9)).map(paceDe).filter(Boolean);
    if (km > maxKm + 0.2 && km >= 5) marco = 'sua corrida mais longa dos últimos 3 meses';
    else if (!misto && rap.length && c.distancia_m >= 5000 && pace < Math.min(...rap) - 1) marco = `seu melhor ritmo dos últimos 3 meses em ${N1(km)} km ou mais`;
    // eficiência aeróbica: ritmo na mesma frequência, comparado com as corridas aeróbicas anteriores
    if (!misto && c.fc_media && fcMax && pctFc < 0.86) {
      const ef = (x) => (x.distancia_m / x.duracao_s) / x.fc_media;
      const base = ant.filter((x) => x.fc_media && x.fc_media / fcMax < 0.86 && x.duracao_s > 900).map(ef);
      if (base.length >= 3) {
        const d = (ef(c) - media(base)) / media(base);
        const sKm = Math.round(pace - 1000 / (media(base) * c.fc_media));
        if (d > 0.03) { sec.comp.push(`Na mesma frequência cardíaca, você correu cerca de ${fmtSeg(-sKm)}/km mais rápido que a média das suas corridas leves e moderadas dos últimos 3 meses.`); frases.push('Comparado com as suas corridas anteriores, você está mais rápido na mesma frequência cardíaca: sinal claro de evolução aeróbica.'); }
        else if (d < -0.05) sec.comp.push(`Hoje o ritmo para a mesma frequência ficou ${fmtSeg(sKm)}/km abaixo da sua média recente: calor, cansaço acumulado ou sono costumam explicar.`);
        else sec.comp.push('Eficiência (ritmo para a mesma frequência) igual à sua média recente.');
      }
    }
    const sem4 = ant.filter((x) => Date.parse(x.data) > t0 - 28 * 864e5).reduce((a, x) => a + x.distancia_m, 0) / 4000;
    if (sem4 > 0) sec.comp.push(`Sua média nas últimas 4 semanas é de ${N1(sem4)} km por semana; este treino representa ${Math.round((km / sem4) * 100)}% disso.`);
    if (sem4 > 0 && km > sem4 * 0.45 && km >= 10) sec.comp.push('Corrida longa para o seu volume atual: priorize sono, alimentação e um dia leve depois.');
  }
  // ---------- 7. corpo ----------
  let alerta = '';
  if (c.dor) alerta = `Você relatou dor${c.dor_local ? ' (' + c.dor_local + ')' : ''}: se continuar nos próximos treinos, avise o seu treinador.`;
  else if (c.sono === 1 || c.cansaco === 2) sec.comp.push('Você marcou sono ruim ou cansaço alto: dê atenção à recuperação nos próximos dias.');
  // ---------- texto final ----------
  let txt = abertura + '.';
  const extra = [marco && `Foi ${marco}`, planTxt && (marco ? `e ${planTxt}` : `Você ${planTxt}`)].filter(Boolean).join(' ');
  if (extra) txt += ` ${extra}.`;
  frases.slice(0, 2).forEach((f) => { txt += ' ' + f; });
  if (alerta) txt += ' ' + alerta;
  else if (dica) txt += ` Dica: ${dica}.`;
  else if (esfN >= 3 && !misto) txt += ' Depois de um esforço assim, um dia leve ou de descanso ajuda a absorver o treino.';
  const det = [['Execução do treino', sec.exe], ['Ritmo', sec.ritmo], ['Frequência cardíaca', sec.fc], ['Condições', sec.cond], ['Comparado com você mesmo', sec.comp]].filter(([, l]) => l.length);
  return { txt: txt.charAt(0).toUpperCase() + txt.slice(1), det };
}
const NI_LOGO = '<span class="ni-logo" aria-hidden="true"><i></i><i></i><i></i></span>';
function nexosIntHTML(r) {
  if (!r) return '';
  return `<div class="ni-card"><div class="ni-h">${NI_LOGO}<b>Leitura Nexos</b></div><p class="ni-txt">${esc(r.txt)}</p>
    ${r.det.length ? `<details class="ni-mais"><summary><span class="ni-a">Ver mais</span><span class="ni-b">Ver menos</span></summary>${r.det.map(([t, l]) => `<div class="ni-sec"><b>${t}</b><ul>${l.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>`).join('')}</details>` : ''}</div>`;
}
const buscarHist90 = (alunoId, ate) => sb.from('nx_corridas').select('id,data,tipo,distancia_m,duracao_s,fc_media').eq('aluno_id', alunoId).gte('data', new Date(Date.parse(ate) - 92 * 864e5).toISOString()).lte('data', ate).then((r) => r.data || [], () => []);

async function viewCorrida(id) {
  loading();
  const { data: c } = await sb.from('nx_corridas').select('*').eq('id', id).maybeSingle();
  if (!c) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Corrida não encontrada</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>'; return; }
  const [plano, nome, hist90] = await Promise.all([
    c.plano_id ? sb.from('nx_plano_corrida').select('*').eq('id', c.plano_id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
    S.staff ? sb.from('nx_membros').select('nome,corrida,nascimento').eq('org_id', S.org.id).eq('user_id', c.aluno_id).maybeSingle().then((r) => r.data || { nome: 'Aluno' }) : Promise.resolve(null),
    ehCorr(c) ? buscarHist90(c.aluno_id, c.data) : Promise.resolve([]),
  ]);
  const membroC = S.staff ? nome : S.me; const pc = perfilCorrida(membroC || {});
  const fcMaxFonte = membroC && membroC.corrida && membroC.corrida.fc_max ? 'medida no perfil de corrida' : pc.fcMax ? 'estimada pela idade' : '';
  const analiseBlocos = c.analise ? analiseCorridaHTML(c, pc.fcMax && (!c.fc_max || pc.fcMax >= c.fc_max) ? pc.fcMax : c.fc_max, pc.fcMax && (!c.fc_max || pc.fcMax >= c.fc_max) ? fcMaxFonte : 'a maior da corrida') : [];
  // o treinador marca como visto quando quiser (o aluno é avisado)
  const pace = paceDe(c);
  const parc = c.parciais || [];
  const pk = (p) => p.seg / (p.parcial ? (p.km % 1 || 1) : 1);
  const pMin = parc.length ? Math.min(...parc.map(pk)) : 0, pMax = parc.length ? Math.max(...parc.map(pk)) : 0;
  const voltar = S.staff ? `#/aluno/${c.aluno_id}/corrida` : '#/historico/corrida';
  $app.innerHTML = `
    <div class="row between"><a class="back" href="${voltar}" style="margin:0">${I.back} ${S.staff ? esc(nome.nome || 'Aluno') : 'Corridas'}</a>${S.staff ? `<div class="row" style="gap:6px">${c.visto_treinador ? `<span class="tag ok">${I.check} Visto</span>` : `<button class="btn sm visto-btn grande" data-visto="corrida|${c.id}">${I.check} Visto</button>`}<button class="btn ghost sm" id="coment-tr">${I.feed} Comentar</button></div>` : c.comentario_treinador ? `<span class="tag ok">${I.check} Analisado e comentado pelo treinador</span>` : c.visto_treinador ? `<span class="tag ok">${I.check} Analisado pelo treinador</span>` : ''}</div>
    <p class="eyebrow" style="margin-top:16px">${esc((TIPOS_ATIV.find((t) => t[0] === c.tipo) || [, nomeAtiv(c)])[1])} · ${fmtDia(c.data)} · ${fmtHora(c.data)}${c.fonte === 'garmin' ? ' · Garmin' : ''}</p>
    <h1 class="h1">${esc(c.titulo && !/^\d/.test(c.titulo) ? c.titulo : comDist(c) ? fmtKm(c.distancia_m) : nomeAtiv(c))}</h1>
    ${!S.staff && comDist(c) ? `<button class="card-cta" id="gerar-card"><span class="card-cta-ic">${I.cam}</span><div class="grow" style="text-align:left"><b>Gerar card para o story</b><span class="small">Com foto de fundo ou sem fundo, com a marca da Nexos</span></div>${I.chev}</button>` : ''}
    <div class="metrics">
      ${comDist(c) ? `<div class="metric"><span>Distância</span><b>${fmtKm(c.distancia_m).replace(' km', '')}<small>km</small></b></div>` : ''}
      <div class="metric"><span>${comDist(c) ? 'Tempo' : 'Duração'}</span><b>${fmtDurLongo(c.duracao_s)}</b></div>
      ${ehCorr(c) && comDist(c) ? `<div class="metric"><span>Pace médio</span><b>${fmtPace(pace).replace('/km', '')}<small>/km</small></b></div>` : comDist(c) ? `<div class="metric"><span>Velocidade</span><b>${(c.distancia_m / 1000 / (c.duracao_s / 3600)).toFixed(1).replace('.', ',')}<small>km/h</small></b></div>` : ''}
      ${c.fc_media ? `<div class="metric"><span>FC média</span><b>${c.fc_media}<small>bpm</small></b>${c.fc_max ? `<em>máx ${c.fc_max}</em>` : ''}</div>` : ''}
      ${c.elevacao_m ? `<div class="metric"><span>Subida</span><b>${Math.round(c.elevacao_m)}<small>m</small></b></div>` : ''}
      ${c.cadencia ? `<div class="metric"><span>Cadência</span><b>${c.cadencia}<small>ppm</small></b></div>` : ''}
      ${c.rpe != null ? `<div class="metric"><span>Esforço</span><b>${c.rpe}<small>/10</small></b><em>${rpeTxt(c.rpe)}</em></div>` : ''}
    </div>
    ${ehCorr(c) ? nexosIntHTML(nexosInteligencia(c, { plano, perfil: pc, hist: hist90 })) : ''}
    ${c.dor ? `<div class="card" style="margin-top:12px;border-color:rgba(214,120,0,.35)"><span class="eyebrow" style="color:var(--warn)">Relatou dor${c.dor_local ? ': ' + esc(c.dor_local) : ''}</span></div>` : ''}
    ${corpoTags(c) ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${corpoTags(c)}</div>` : ''}
    ${c.comentario ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Como foi</span><p style="margin-top:6px">“${esc(c.comentario)}”</p></div>` : ''}
    ${c.comentario_treinador ? `<div class="card coment-tr" style="margin-top:12px"><div class="row between"><span class="eyebrow">${I.feed} Comentário do treinador</span>${c.comentario_treinador_em ? `<span class="tiny dim">${fmtDia(c.comentario_treinador_em)}</span>` : ''}</div><p style="margin-top:6px;white-space:pre-line">${esc(c.comentario_treinador)}</p>${S.staff ? `<button class="link-btn tiny" id="coment-tr-ed" style="margin-top:8px">Editar</button>` : ''}</div>` : ''}
    ${plano ? `<div class="card plan-vs"><span class="eyebrow">Previsto × realizado</span><div class="h3" style="margin-top:4px">${esc(plano.titulo || nomeTipo(plano.tipo))}</div>
      <div class="pv"><div><span>Previsto</span><b>${plano.distancia_km ? String(plano.distancia_km).replace('.', ',') + ' km' : plano.duracao_min ? plano.duracao_min + ' min' : '–'}</b></div><div><span>Feito</span><b>${fmtKm(c.distancia_m)}</b></div>
      ${plano.distancia_km ? `<div><span>Cumprido</span><b>${Math.round((c.distancia_m / 1000 / plano.distancia_km) * 100)}%</b></div>` : ''}</div>
      ${plano.descricao ? `<p class="small muted" style="margin-top:8px">${esc(plano.descricao)}</p>` : ''}</div>` : ''}
    ${c.rota ? `<div class="section"><div class="section-h"><h2 class="h2">Percurso</h2>${slashes}</div><div class="card rota-box">${rotaSVG(c.rota)}</div></div>` : ''}
    ${analiseBlocos.slice(0, analiseBlocos.length - (c.analise && analiseBlocos.length && analiseBlocos[analiseBlocos.length - 1].includes('Todos os números') ? 1 : 0)).join('')}
    ${parc.length ? `<div class="section"><div class="section-h"><h2 class="h2">Parciais</h2>${slashes}</div><div class="card"><div class="splits">${parc.map((p) => { const v = pk(p); const w = pMax > pMin ? 35 + (65 * (pMax - v)) / (pMax - pMin) : 100; return `<div><span>${p.parcial ? String(p.km).replace('.', ',') : 'km ' + p.km}</span><i style="width:${w.toFixed(0)}%"></i><b>${fmtPace(v).replace('/km', '')}</b><em>${p.fc ? p.fc + ' bpm' : ''}</em></div>`; }).join('')}</div></div></div>` : ''}
    ${analiseBlocos.length && analiseBlocos[analiseBlocos.length - 1].includes('Todos os números') ? analiseBlocos[analiseBlocos.length - 1] : ''}
    <p class="tiny dim" style="margin-top:16px">Fonte: ${c.fonte === 'garmin' ? 'Garmin' : c.fonte === 'arquivo' ? 'arquivo do relógio' : c.fonte === 'celular' ? 'GPS do celular' : c.fonte === 'intervals' ? 'Intervals.icu' : 'digitado'} · <button class="link-btn tiny" id="apagar-c">Apagar corrida</button></p>`;
  const gc = document.getElementById('gerar-card'); if (gc) gc.onclick = () => abrirCardCorrida(c, plano);
  $app.querySelectorAll('[data-visto]').forEach((b) => b.onclick = () => marcarVisto(b));
  ['coment-tr', 'coment-tr-ed'].forEach((k) => { const e = document.getElementById(k); if (e) e.onclick = () => comentarTreino(c, nome); });
  if (c.analise) bindGraficos($app, c);
  document.getElementById('apagar-c').onclick = async () => {
    if (!confirm('Apagar esta corrida?')) return;
    const { error } = await sb.from('nx_corridas').delete().eq('id', c.id);
    error ? toast('Não foi possível apagar.', true) : (toast('Corrida apagada.'), location.hash = voltar);
  };
}

function formPerfilCorrida(m, onSalvo) {
  const c = m.corrida || {};
  openSheet(`<p class="eyebrow">Perfil de corrida</p><div class="h2" style="margin-top:4px">${esc(firstName(m.nome))}</div>
    <p class="small muted" style="margin-top:6px">Use uma prova ou teste recente feito no limite (ideal: 3 a 10 km). O app calcula o VDOT, os paces de treino e as previsões de prova.</p>
    <form id="f-pc" style="margin-top:16px">
      <div class="grid2"><label class="field"><span>Distância do teste (km)</span><input class="input" name="km" data-mask="dec" inputmode="decimal" value="${esc(c.teste_km != null ? String(c.teste_km).replace('.', ',') : '')}" placeholder="5"></label><label class="field"><span>Tempo (h:mm:ss)</span><input class="input" name="tempo" data-mask="tempo" inputmode="numeric" value="${c.teste_seg ? fmtDurLongo(c.teste_seg) : ''}" placeholder="25:30"></label></div>
      <label class="field"><span>Data do teste</span><input class="input" type="date" name="data" value="${esc(c.teste_data || hojeISO())}"></label>
      <div class="grid2"><label class="field"><span>FC máxima medida (opcional)</span><input class="input" name="fcmax" data-mask="num" inputmode="numeric" value="${esc(c.fc_max ?? '')}" placeholder="se souber"></label><label class="field"><span>FC de repouso</span><input class="input" name="fcrep" data-mask="num" inputmode="numeric" value="${esc(c.fc_rep ?? '')}"></label></div>
      <p class="small" id="pc-prev" style="margin:-4px 0 12px;color:var(--acc)"></p>
      <button class="btn block" type="submit">Salvar perfil</button></form>`, (r) => {
    const f = r.querySelector('#f-pc');
    const prev = () => { const v = vdotDe(num(f.km.value) * 1000, lerTempo(f.tempo.value)); r.querySelector('#pc-prev').textContent = v > 0 ? `VDOT ${f1(v)} · leve ${faixaPace(pacesDe(v).leve)} · limiar ${faixaPace(pacesDe(v).limiar)}` : ''; };
    f.oninput = prev; prev();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const corrida = { teste_km: num(f.km.value), teste_seg: lerTempo(f.tempo.value), teste_data: f.data.value || null, fc_max: num(f.fcmax.value) ? Math.round(num(f.fcmax.value)) : null, fc_rep: num(f.fcrep.value) ? Math.round(num(f.fcrep.value)) : null };
      const { error } = await sb.from('nx_membros').update({ corrida: { ...(m.corrida || {}), ...corrida } }).eq('org_id', S.org.id).eq('user_id', m.user_id);
      if (error) return toast('Não foi possível salvar.', true);
      closeSheet(); toast('Perfil de corrida salvo!'); onSalvo();
    };
  });
}

/* ---------- treino estruturado: passos, zonas e perfil de intensidade ---------- */
const ZONAS_INFO = {
  rec: { z: 'Z1', d: 'Recuperação', n: 'Z1 · Recuperação', c: '#9aa8c0', h: 0.22, pd: 450 },
  leve: { z: 'Z2', d: 'Leve', n: 'Z2 · Leve', c: '#3ddc97', h: 0.4, pd: 390 },
  maratona: { z: 'Z3', d: 'Moderado', n: 'Z3 · Moderado', c: '#46d6ff', h: 0.58, pd: 345 },
  limiar: { z: 'Z4', d: 'Limiar', n: 'Z4 · Limiar', c: '#ffcf5c', h: 0.74, pd: 315 },
  intervalado: { z: 'Z5', d: 'Forte (VO₂)', n: 'Z5 · Forte', c: '#ff9f43', h: 0.88, pd: 290 },
  tiros: { z: 'Z6', d: 'Máximo', n: 'Z6 · Máximo', c: '#ff6b6b', h: 1, pd: 270 },
};
// pace de cada zona para o aluno: faixa dele (pelo teste) ou média, sempre visível
const paceZonaTxt = (z, perfil) => { const p = perfil && perfil.paces; if (p && p[z]) return faixaPace(p[z]); return '~' + fmtPace(paceZona(z, perfil)); };
const PASSOS = { aq: 'Aquecimento', co: 'Corrida', rc: 'Recuperação', dq: 'Desaquecimento' };
const passo = (k, v, med, z) => ({ k, v, med, z });
const serie = (n, passos) => ({ k: 'rep', n, passos });
/* ---------- biblioteca de corrida por nível (base: método norueguês + ciência atual) ---------- */
const NIVEIS_CORR = [['ini', 'Iniciante'], ['int', 'Intermediário'], ['ava', 'Avançado'], ['pro', 'Profissional']];
const CATS_CORR = [['base', 'Base e rodagem'], ['limiar', 'Limiar norueguês'], ['vo2', 'VO₂máx'], ['veloc', 'Velocidade e subidas'], ['fartlek', 'Fartlek e progressivos'], ['longao', 'Longão'], ['rec', 'Recuperação'], ['teste', 'Testes e provas'], ['off', 'Descanso']];
const _A = (v, med = 'km') => passo('aq', v, med, 'leve'), _D = (v, med = 'km') => passo('dq', v, med, 'leve'), _C = (v, med, z) => passo('co', v, med, z), _R = (v, med, z = 'rec') => passo('rc', v, med, z);
const TODOS_NIV = ['ini', 'int', 'ava', 'pro'];
const GUIA_NIV = {
  ini: ['3 a 4 corridas por semana, quase tudo leve (Z2).', 'Uma sessão curta de qualidade (fartlek, subidas ou limiar leve) só depois de 4–6 semanas correndo 30 min sem parar.', 'Aumente o volume aos poucos e tenha pelo menos 1 day off.'],
  int: ['4 a 5 corridas por semana.', 'Até 2 sessões de sublimiar ou limiar (ex.: terça e quinta), um longão leve no fim de semana e o resto leve.', 'A qualidade fica em torno de 20–25% do volume da semana.'],
  ava: ['5 a 6 corridas por semana.', '2 sessões de sublimiar (ex.: terça e quinta) e 1 sessão mais forte acima do limiar no sábado (VO₂ ou subidas).', 'Longão leve. Duplo limiar só com 80 km ou mais por semana.'],
  pro: ['Modelo norueguês completo: 2 dias de duplo limiar (manhã ~2,5 mmol, tarde ~3–3,5 mmol).', 'Sessão X no sábado; o restante leve, muitas vezes em dois treinos por dia.', 'Longão leve no domingo. Controle por lactato ou FC: limiar não é prova.'],
};
const INFO_NOR = 'Método norueguês: limiar controlado, sem passar do ponto (lactato ~2–3,5 mmol, esforço 5–6 de 10, ainda dá para falar frases curtas). Pausas curtas. Na dúvida, mais devagar: o erro mais comum é correr rápido demais.';
const INFO_SUB = 'Sublimiar (Norwegian singles): blocos longos entre o ritmo de maratona e o de meia maratona, com 1 min de pausa. Para amadores, 2–3 sessões assim por semana somando ~20–25% do volume; o resto é leve.';
const MODELOS_PADRAO = [
  { id: 'p-off', nome: 'Day off', tipo: 'folga', estrutura: [], niv: TODOS_NIV, cat: 'off', info: 'Descanso total. Faz parte do treino: é quando o corpo assimila o que foi feito.' },
  { id: 'p-forca', nome: 'Força', tipo: 'forca', estrutura: [], niv: TODOS_NIV, cat: 'off', info: 'Dia do treino de força que o aluno faz por conta própria (academia ou outro profissional). Nesse dia não tem corrida.' },
  // ---------- INICIANTE ----------
  { id: 'i-cc8', nome: 'Corre e caminha 8 × 1 min', tipo: 'rodagem', niv: ['ini'], cat: 'base', info: 'Adaptação ao impacto: alterna trote leve e caminhada. Ideal para as primeiras semanas.', estrutura: [_A(5, 'min'), serie(8, [_C(1, 'min', 'leve'), _R(2, 'min')]), _D(5, 'min')] },
  { id: 'i-cc6', nome: 'Corre e caminha 6 × 3 min', tipo: 'rodagem', niv: ['ini'], cat: 'base', info: 'Próximo passo do corre e caminha: blocos maiores de corrida com pausa curta caminhando.', estrutura: [_A(5, 'min'), serie(6, [_C(3, 'min', 'leve'), _R(1, 'min')]), _D(5, 'min')] },
  { id: 'i-c20', nome: 'Contínuo 20 min leve', tipo: 'rodagem', niv: ['ini'], cat: 'base', info: 'Primeira corrida sem parar. Ritmo de conversa (Z2).', estrutura: [_C(20, 'min', 'leve')] },
  { id: 'i-c30', nome: 'Contínuo 30 min leve', tipo: 'rodagem', niv: ['ini'], cat: 'base', info: 'Base aeróbica: a maior parte do treino de quem corre deve ser assim, leve (modelo polarizado, ~80% em Z1–Z2).', estrutura: [_C(30, 'min', 'leve')] },
  { id: 'i-lim', nome: 'Limiar leve 4 × 3 min', tipo: 'ritmo', niv: ['ini'], cat: 'limiar', info: 'Primeiro contato com o limiar no estilo norueguês: blocos curtos, controlados, sem chegar ao limite. Use só depois de 4–6 semanas correndo 30 min sem parar.', estrutura: [_A(10, 'min'), serie(4, [_C(3, 'min', 'limiar'), _R(2, 'min')]), _D(5, 'min')] },
  { id: 'i-far', nome: 'Fartlek leve 6 × 1 min', tipo: 'fartlek', niv: ['ini'], cat: 'fartlek', info: 'Brincadeira de ritmo: 1 min um pouco mais rápido (Z3) e 2 min bem leve.', estrutura: [_A(10, 'min'), serie(6, [_C(1, 'min', 'maratona'), _R(2, 'min')]), _D(5, 'min')] },
  { id: 'i-pro', nome: 'Progressivo 25 min', tipo: 'ritmo', niv: ['ini'], cat: 'fartlek', info: 'Começa leve e termina moderado. Ensina a controlar o ritmo.', estrutura: [_C(18, 'min', 'leve'), _C(7, 'min', 'maratona')] },
  { id: 'i-sub', nome: 'Subidas curtas 6 × 60 m', tipo: 'tiros', niv: ['ini'], cat: 'veloc', info: 'Força e técnica de corrida com pouco impacto (a subida reduz a carga nas articulações). Volta caminhando.', estrutura: [_A(10, 'min'), serie(6, [_C(60, 'm', 'tiros'), _R(1.5, 'min')]), _D(5, 'min')] },
  { id: 'i-lo40', nome: 'Longão 40 min', tipo: 'longao', niv: ['ini'], cat: 'longao', info: 'O treino mais longo da semana, sempre leve. Constrói resistência.', estrutura: [_C(40, 'min', 'leve')] },
  { id: 'i-lo5', nome: 'Longão 5 km', tipo: 'longao', niv: ['ini'], cat: 'longao', info: 'Longão por distância para quem já corre 30 min sem parar.', estrutura: [_C(5, 'km', 'leve')] },
  { id: 'i-reg', nome: 'Regenerativo 20 min', tipo: 'regenerativo', niv: ['ini'], cat: 'rec', info: 'Trote muito leve (Z1) para recuperar no dia seguinte a um treino forte.', estrutura: [_C(20, 'min', 'rec')] },
  { id: 'p-te3', nome: 'Teste de 3 km', tipo: 'teste', niv: ['ini', 'int'], cat: 'teste', info: 'Teste no máximo sustentável. O resultado entra em Ritmos e zonas e calcula os paces do aluno.', estrutura: [_A(10, 'min'), _C(3, 'km', 'intervalado'), _D(5, 'min')] },
  // ---------- INTERMEDIÁRIO ----------
  { id: 'p-rod', nome: 'Rodagem leve 6 km', tipo: 'rodagem', niv: ['int'], cat: 'base', info: 'Rodagem de base em Z2.', estrutura: [_C(6, 'km', 'leve')] },
  { id: 'm-r8', nome: 'Rodagem 8 km', tipo: 'rodagem', niv: ['int', 'ava'], cat: 'base', info: 'Volume aeróbico em ritmo de conversa.', estrutura: [_C(8, 'km', 'leve')] },
  { id: 'm-str', nome: 'Rodagem + 6 strides', tipo: 'rodagem', niv: ['int', 'ava'], cat: 'veloc', info: 'Rodagem leve com 6 acelerações de 100 m no fim: melhora a economia de corrida sem cansar.', estrutura: [_C(6, 'km', 'leve'), serie(6, [_C(100, 'm', 'tiros'), _R(100, 'm')])] },
  { id: 'm-5x6', nome: 'Sublimiar 5 × 6 min', tipo: 'ritmo', niv: ['int', 'ava'], cat: 'limiar', info: INFO_SUB, estrutura: [_A(2), serie(5, [_C(6, 'min', 'maratona'), _R(1, 'min')]), _D(1)] },
  { id: 'm-3x10', nome: 'Sublimiar 3 × 10 min', tipo: 'ritmo', niv: ['int', 'ava'], cat: 'limiar', info: INFO_SUB, estrutura: [_A(2), serie(3, [_C(10, 'min', 'maratona'), _R(1, 'min')]), _D(1)] },
  { id: 'm-8x3', nome: 'Limiar 8 × 3 min', tipo: 'ritmo', niv: ['int'], cat: 'limiar', info: 'Versão “por tempo” do 10 × 1000 m norueguês, para quem ainda corre o km mais devagar. ' + INFO_NOR, estrutura: [_A(2), serie(8, [_C(3, 'min', 'limiar'), _R(1, 'min')]), _D(1)] },
  { id: 'm-6x1k', nome: 'Limiar 6 × 1000 m', tipo: 'ritmo', niv: ['int'], cat: 'limiar', info: INFO_NOR, estrutura: [_A(2), serie(6, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(1)] },
  { id: 'p-rit', nome: 'Sublimiar 3 × 2 km', tipo: 'ritmo', niv: ['int'], cat: 'limiar', info: INFO_SUB, estrutura: [_A(2), serie(3, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(1)] },
  { id: 'm-tmp', nome: 'Tempo run 20 min', tipo: 'ritmo', niv: ['int'], cat: 'limiar', info: 'Clássico contínuo no limiar. Bom para treinar a sensação do ritmo de prova de 10–21 km.', estrutura: [_A(2), _C(20, 'min', 'limiar'), _D(1)] },
  { id: 'm-4x4', nome: '4 × 4 min (NTNU)', tipo: 'intervalado', niv: ['int', 'ava'], cat: 'vo2', info: 'Protocolo da NTNU (Helgerud et al.): 4 min a 90–95% da FC máx com 3 min de trote a ~70%. Em 8 semanas, 3 vezes por semana, o VO₂máx subiu cerca de 8%, mais que corrida contínua ou no limiar com o mesmo gasto.', estrutura: [_A(2), serie(4, [_C(4, 'min', 'intervalado'), _R(3, 'min')]), _D(1)] },
  { id: 'p-int', nome: '6 × 800 m', tipo: 'intervalado', niv: ['int'], cat: 'vo2', info: 'Intervalado clássico em Z5 para potência aeróbica.', estrutura: [_A(2), serie(6, [_C(800, 'm', 'intervalado'), _R(2, 'min')]), _D(1)] },
  { id: 'm-f10', nome: 'Fartlek 10 × 1 min', tipo: 'fartlek', niv: ['int'], cat: 'fartlek', info: '1 min no limiar e 1 min leve, sem parar. Trabalha troca de ritmo.', estrutura: [_A(10, 'min'), serie(10, [_C(1, 'min', 'limiar'), _R(1, 'min', 'leve')]), _D(10, 'min')] },
  { id: 'p-pro', nome: 'Progressivo 6 km', tipo: 'ritmo', niv: ['int'], cat: 'fartlek', info: 'Termina mais rápido do que começa: Z2, Z3 e Z4.', estrutura: [_C(3, 'km', 'leve'), _C(2, 'km', 'maratona'), _C(1, 'km', 'limiar')] },
  { id: 'm-sub', nome: 'Subidas 8 × 100 m', tipo: 'tiros', niv: ['int'], cat: 'veloc', info: 'Força específica na subida, volta trotando. Protege de lesão e melhora a passada.', estrutura: [_A(2), serie(8, [_C(100, 'm', 'tiros'), _R(1.5, 'min')]), _D(1)] },
  { id: 'm-l12', nome: 'Longão 12 km', tipo: 'longao', niv: ['int'], cat: 'longao', info: 'Longão leve em Z2.', estrutura: [_C(12, 'km', 'leve')] },
  { id: 'p-lon', nome: 'Longão 14 km', tipo: 'longao', niv: ['int', 'ava'], cat: 'longao', info: 'Longão leve em Z2.', estrutura: [_C(14, 'km', 'leve')] },
  { id: 'p-reg', nome: 'Regenerativo 30 min', tipo: 'regenerativo', niv: ['int', 'ava', 'pro'], cat: 'rec', info: 'Trote muito leve (Z1). Recupera sem gerar fadiga.', estrutura: [_C(30, 'min', 'rec')] },
  { id: 'p-tes', nome: 'Teste de 5 km', tipo: 'teste', niv: ['int', 'ava', 'pro'], cat: 'teste', info: 'Teste de 5 km no máximo. O resultado recalcula os paces em Ritmos e zonas.', estrutura: [_A(2), _C(5, 'km', 'intervalado'), _D(1)] },
  // ---------- AVANÇADO ----------
  { id: 'a-r10', nome: 'Rodagem 10 km', tipo: 'rodagem', niv: ['ava', 'pro'], cat: 'base', info: 'Volume aeróbico em Z2.', estrutura: [_C(10, 'km', 'leve')] },
  { id: 'a-5x2', nome: 'Sublimiar 5 × 2 km', tipo: 'ritmo', niv: ['ava', 'pro'], cat: 'limiar', info: INFO_SUB, estrutura: [_A(3), serie(5, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(2)] },
  { id: 'a-25x4', nome: '25 × 400 m sublimiar', tipo: 'ritmo', niv: ['ava', 'pro'], cat: 'limiar', info: 'Sessão marcante dos Ingebrigtsen: muitos 400 m no limiar com 30 s de pausa. Muito volume de limiar com pouca fadiga.', estrutura: [_A(3), serie(25, [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)] },
  { id: 'a-10x1k', nome: 'Limiar 10 × 1000 m', tipo: 'ritmo', niv: ['ava'], cat: 'limiar', info: INFO_NOR, estrutura: [_A(3), serie(10, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)] },
  { id: 'a-4x8', nome: '4 × 8 min (Seiler)', tipo: 'intervalado', niv: ['ava'], cat: 'vo2', info: 'Estudo de Seiler et al. (2013, com ciclistas recreativos): 4 × 8 min no máximo sustentável, com 2 min de pausa, trouxe mais ganho que 4 × 4 ou 4 × 16.', estrutura: [_A(3), serie(4, [_C(8, 'min', 'limiar'), _R(2, 'min')]), _D(2)] },
  { id: 'a-dlm', nome: 'Duplo limiar · manhã 5 × 6 min', tipo: 'ritmo', niv: ['ava'], cat: 'limiar', info: 'Dia de duplo limiar: manhã mais suave (blocos longos, lactato ~2,5) e tarde um pouco mais forte. Só para quem já corre 80 km ou mais por semana; para os outros, uma sessão de sublimiar por dia rende quase o mesmo.', estrutura: [_A(2), serie(5, [_C(6, 'min', 'maratona'), _R(1, 'min')]), _D(1)] },
  { id: 'a-dlt', nome: 'Duplo limiar · tarde 10 × 1000 m', tipo: 'ritmo', niv: ['ava'], cat: 'limiar', info: 'Tarde do dia de duplo limiar (lactato ~3–3,5): tiros mais curtos, um pouco mais rápidos. Deve terminar com a sensação de que dava para mais. Só para quem já corre 80 km ou mais por semana.', estrutura: [_A(2), serie(10, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(1)] },
  { id: 'a-5x1k', nome: '5 × 1000 m VO₂', tipo: 'intervalado', niv: ['ava'], cat: 'vo2', info: 'Intervalado em Z5 com pausa de 2 min. Potência aeróbica para 5 e 10 km.', estrutura: [_A(3), serie(5, [_C(1000, 'm', 'intervalado'), _R(2, 'min')]), _D(2)] },
  { id: 'a-pir', nome: 'Pirâmide 400 a 1600 m', tipo: 'intervalado', niv: ['ava'], cat: 'vo2', info: 'Sobe e desce de distância em Z5. Variado e muito específico para provas de 5–10 km.', estrutura: [_A(3), _C(400, 'm', 'intervalado'), _R(1, 'min'), _C(800, 'm', 'intervalado'), _R(1.5, 'min'), _C(1200, 'm', 'intervalado'), _R(2, 'min'), _C(1600, 'm', 'intervalado'), _R(2, 'min'), _C(1200, 'm', 'intervalado'), _R(2, 'min'), _C(800, 'm', 'intervalado'), _R(1.5, 'min'), _C(400, 'm', 'intervalado'), _D(2)] },
  { id: 'a-f21', nome: 'Fartlek 8 × (2 + 1 min)', tipo: 'fartlek', niv: ['ava'], cat: 'fartlek', info: '2 min no limiar e 1 min leve, contínuo.', estrutura: [_A(2), serie(8, [_C(2, 'min', 'limiar'), _R(1, 'min', 'leve')]), _D(1)] },
  { id: 'a-sub', nome: 'Subidas 10 × 200 m', tipo: 'tiros', niv: ['ava'], cat: 'veloc', info: 'Subida forte (Z6) e volta trotando. Força específica e potência.', estrutura: [_A(3), serie(10, [_C(200, 'm', 'tiros'), _R(200, 'm')]), _D(2)] },
  { id: 'p-tir', nome: '10 × 200 m velocidade', tipo: 'tiros', niv: ['ava', 'pro'], cat: 'veloc', info: 'Velocidade pura (Z6) com recuperação completa. Mantém a passada rápida e econômica.', estrutura: [_A(2), serie(10, [_C(200, 'm', 'tiros'), _R(200, 'm')]), _D(1)] },
  { id: 'a-l18', nome: 'Longão 18 km com final forte', tipo: 'longao', niv: ['ava'], cat: 'longao', info: '14 km leves e os 4 últimos em ritmo moderado (Z3). Prepara para terminar forte na prova.', estrutura: [_C(14, 'km', 'leve'), _C(4, 'km', 'maratona')] },
  // ---------- PROFISSIONAL ----------
  { id: 'r-r14', nome: 'Rodagem 14 km', tipo: 'rodagem', niv: ['pro'], cat: 'base', info: 'Volume aeróbico em Z2.', estrutura: [_C(14, 'km', 'leve')] },
  { id: 'r-dlm', nome: 'Duplo limiar · manhã 5 × 2 km', tipo: 'ritmo', niv: ['pro'], cat: 'limiar', info: 'Manhã do dia de duplo limiar (modelo Bakken/Ingebrigtsen), lactato ~2,5 mmol. Controle o ritmo: limiar, não prova. Combine com 25 × 400 m ou 10 × 1000 m à tarde.', estrutura: [_A(3), serie(5, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(2)] },
  { id: 'r-dlt', nome: 'Duplo limiar · tarde 25 × 400 m', tipo: 'ritmo', niv: ['pro'], cat: 'limiar', info: 'Tarde do dia de duplo limiar: 400 m no limiar com 30 s de pausa.', estrutura: [_A(3), serie(25, [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)] },
  { id: 'r-4x3', nome: 'Sublimiar 4 × 3 km', tipo: 'ritmo', niv: ['pro'], cat: 'limiar', info: INFO_SUB, estrutura: [_A(3), serie(4, [_C(3, 'km', 'maratona'), _R(1.5, 'min')]), _D(2)] },
  { id: 'r-12x1k', nome: 'Limiar 12 × 1000 m', tipo: 'ritmo', niv: ['pro'], cat: 'limiar', info: INFO_NOR, estrutura: [_A(3), serie(12, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)] },
  { id: 'r-6x16', nome: '6 × 1600 m VO₂', tipo: 'intervalado', niv: ['pro'], cat: 'vo2', info: 'Bloco longo em Z5 com 2 min de pausa. Específico para 10 km e meia.', estrutura: [_A(3), serie(6, [_C(1600, 'm', 'intervalado'), _R(2, 'min')]), _D(2)] },
  { id: 'r-20x4', nome: '20 × 400 m', tipo: 'intervalado', niv: ['pro'], cat: 'vo2', info: '400 m em Z5 com 45 s de pausa. Potência aeróbica com volume.', estrutura: [_A(3), serie(20, [_C(400, 'm', 'intervalado'), _R(0.75, 'min')]), _D(2)] },
  { id: 'r-x', nome: 'Sprints em subida 10 × 60 m', tipo: 'tiros', niv: ['ava', 'pro'], cat: 'veloc', info: 'Sprints curtos e fortes em subida no fim de uma rodagem leve, com pausa completa. Potência e força com pouca fadiga.', estrutura: [_C(10, 'km', 'leve'), serie(10, [_C(60, 'm', 'tiros'), _R(2, 'min')])] },
  { id: 'r-x2', nome: 'Sessão X · 20 × 200 m em subida', tipo: 'intervalado', niv: ['ava', 'pro'], cat: 'vo2', info: 'O “X” do modelo norueguês: uma sessão por semana acima do limiar (geralmente no sábado), muitas vezes em subida. Volta trotando na descida.', estrutura: [_A(3), serie(20, [_C(200, 'm', 'intervalado'), _R(200, 'm')]), _D(2)] },
  { id: 'r-l25', nome: 'Longão 25 km com 5 km em ritmo', tipo: 'longao', niv: ['pro'], cat: 'longao', info: '20 km em Z2 e 5 km em ritmo de maratona (Z3). Específico para meia e maratona.', estrutura: [_C(20, 'km', 'leve'), _C(5, 'km', 'maratona')] },
  { id: 'r-l30', nome: 'Longão 30 km', tipo: 'longao', niv: ['pro'], cat: 'longao', info: 'Longão de maratona, todo em Z2.', estrutura: [_C(30, 'km', 'leve')] },
  { id: 'p-prv', nome: 'Prova', tipo: 'prova', niv: TODOS_NIV, cat: 'teste', info: 'Dia de prova. Ajuste a distância no editor.', estrutura: [_C(10, 'km', 'maratona')] },
];
// filtro de nível da biblioteca (lembra a escolha)
const chipsNivHTML = (sel, id) => `<div class="chips niv-chips" id="${id}">${[['todos', 'Todos'], ...NIVEIS_CORR, ['meus', 'Meus']].map(([k, l]) => `<button type="button" class="chip ${sel === k ? 'on' : ''}" data-niv="${k}">${l}</button>`).join('')}</div>`;
const passaNiv = (md, sel) => sel === 'todos' || (sel === 'meus' ? !!md.org_id : (md.niv || []).includes(sel));
const ordemCat = (md) => { if (md.cat === 'off') return -1; const i = CATS_CORR.findIndex((c) => c[0] === md.cat); return i < 0 ? 99 : i; };
const clone = (x) => JSON.parse(JSON.stringify(x));
function paceZona(z, perfil) {
  const p = perfil && perfil.paces;
  if (z === 'rec') return p && p.rec ? (p.rec[0] + p.rec[1]) / 2 : p && p.leve ? p.leve[1] * 1.12 : ZONAS_INFO.rec.pd;
  return p && p[z] ? (p[z][0] + p[z][1]) / 2 : (ZONAS_INFO[z] || ZONAS_INFO.leve).pd;
}
/** lista achatada de passos com metros e segundos estimados */
function achatar(estrutura, perfil) {
  const out = [];
  const add = (s, rep) => {
    const pace = paceZona(s.z, perfil);
    const m = s.med === 'km' ? s.v * 1000 : s.med === 'm' ? s.v : (s.v * 60) / pace * 1000;
    const seg = s.med === 'min' ? s.v * 60 : (m / 1000) * pace;
    out.push({ ...s, metros: m, seg, rep });
  };
  (estrutura || []).forEach((s) => { if (s.k === 'rep') { for (let i = 0; i < (s.n || 1); i++) (s.passos || []).forEach((p) => add(p, i + 1)); } else add(s); });
  return out;
}
/** faixa de pace (s/km, [rápido, lento]) do aluno numa zona */
function faixaZona(z, perfil) {
  const p = perfil && perfil.paces;
  if (p && p[z]) { const a = Math.min(p[z][0], p[z][1]), b = Math.max(p[z][0], p[z][1]); return a === b ? [a * 0.97, a * 1.03] : [a, b]; }
  if (z === 'rec' && p && p.leve) return [Math.max(p.leve[0], p.leve[1]) * 1.08, Math.max(p.leve[0], p.leve[1]) * 1.16];
  const c = paceZona(z, perfil); return [c * 0.96, c * 1.04];
}
const kmTxt = (km) => (km < 1 ? `${Math.round(km * 100) * 10} m` : `${(Math.round(km * 10) / 10).toString().replace('.', ',')} km`);
const faixaKmTxt = (a, b) => { const x = kmTxt(a), y = kmTxt(b); if (x === y) return x; return a < 1 && b < 1 ? `${x.replace(' m', '')}–${y}` : a >= 1 && b >= 1 ? `${x.replace(' km', '')}–${y}` : `${x}–${y}`; };
const faixaDurTxt = (a, b) => { const x = fmtDur(a), y = fmtDur(b); return x === y ? x : `${x}–${y}`; };
/** estimativa de um passo: por tempo → distância; por distância → tempo (pela faixa de pace do aluno) */
function estimaPasso(s, perfil) {
  const [a, b] = faixaZona(s.z, perfil);
  if (s.med === 'min') { const seg = s.v * 60; return { tipo: 'dist', txt: faixaKmTxt(seg / b, seg / a) }; }
  const km = s.med === 'km' ? s.v : s.v / 1000; return { tipo: 'tempo', txt: faixaDurTxt(km * a, km * b) };
}
/** total estimado do treino (faixa de km e de tempo) */
function estimaTotal(estrutura, perfil) {
  let k0 = 0, k1 = 0, t0 = 0, t1 = 0;
  const add = (s, n = 1) => { const [a, b] = faixaZona(s.z, perfil); if (s.med === 'min') { const seg = s.v * 60 * n; t0 += seg; t1 += seg; k0 += seg / b; k1 += seg / a; } else { const km = (s.med === 'km' ? s.v : s.v / 1000) * n; k0 += km; k1 += km; t0 += km * a; t1 += km * b; } };
  (estrutura || []).forEach((s) => (s.k === 'rep' ? (s.passos || []).forEach((p) => add(p, s.n || 1)) : add(s)));
  return { km: faixaKmTxt(k0, k1), tempo: faixaDurTxt(t0, t1), soDist: k0 === k1, soTempo: t0 === t1 };
}
// tempo no estilo das planilhas: 1h03'44" · 25'00"
const tempoAsp = (sg) => { sg = Math.round(sg); const h = Math.floor(sg / 3600), m = Math.floor((sg % 3600) / 60), x = sg % 60; return h ? `${h}h${String(m).padStart(2, '0')}'${String(x).padStart(2, '0')}"` : `${m}'${String(x).padStart(2, '0')}"`; };
const paceAsp = (a, b) => `${fmtPace(a).replace('/km', '')} a ${fmtPace(b)}`;
/** treino escrito passo a passo, frases curtas (cartão do aluno) */
function linhasTreino(estrutura, perfil) {
  const verbo = { aq: 'Aquecer', co: 'Correr', rc: 'Recuperar', dq: 'Desaquecer' };
  const frase = (s, verboOn = true) => {
    const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve; const [a, b] = faixaZona(s.z, perfil); const e = estimaPasso(s, perfil);
    const qto = s.med === 'min' ? `${String(s.v).replace('.', ',')} min` : medTxt(s);
    const fim = s.med === 'min' ? `cerca de ${e.txt.replace('–', ' a ')}` : `completar entre ${tempoAsp(s.med === 'km' ? s.v * a : s.v / 1000 * a)} e ${tempoAsp(s.med === 'km' ? s.v * b : s.v / 1000 * b)}`;
    return `${verboOn ? `<b>${verbo[s.k] || 'Correr'}</b> ` : ''}${qto} em <b>${z.z}</b> · ${z.d} (${paceAsp(a, b)}) <span class="lt-est">${fim}</span>`;
  };
  return (estrutura || []).map((s) => s.k === 'rep'
    ? `<li><b>Repetir ${s.n}×:</b><ul>${(s.passos || []).map((p) => `<li>${frase(p)}</li>`).join('')}</ul></li>`
    : `<li>${frase(s)}</li>`).join('');
}
function estimaTotalSeg(estrutura, perfil) {
  let t0 = 0, t1 = 0;
  const add = (s, n = 1) => { const [a, b] = faixaZona(s.z, perfil); if (s.med === 'min') { t0 += s.v * 60 * n; t1 += s.v * 60 * n; } else { const km = (s.med === 'km' ? s.v : s.v / 1000) * n; t0 += km * a; t1 += km * b; } };
  (estrutura || []).forEach((s) => (s.k === 'rep' ? (s.passos || []).forEach((p) => add(p, s.n || 1)) : add(s)));
  return [t0, t1];
}
function resumoEstrutura(estrutura, perfil) {
  const l = achatar(estrutura, perfil);
  return { km: l.reduce((a, s) => a + s.metros, 0) / 1000, seg: l.reduce((a, s) => a + s.seg, 0) };
}
const medTxt = (s) => s.med === 'km' ? `${String(s.v).replace('.', ',')} km` : s.med === 'm' ? `${s.v} m` : `${String(s.v).replace('.', ',')} min`;
function descreverEstrutura(estrutura, perfil) {
  const zt = (p) => { const z = ZONAS_INFO[p.z] || ZONAS_INFO.leve; return `${z.z}${perfil ? ' (' + paceZonaTxt(p.z, perfil).replace('/km', '') + ')' : ''}`; };
  const est = (p) => (perfil && p.med === 'min' ? ` ≈${estimaPasso(p, perfil).txt}` : '');
  return (estrutura || []).map((s) => s.k === 'rep'
    ? `${s.n}× (${(s.passos || []).map((p) => `${medTxt(p)} ${zt(p)}${est(p)}`).join(' + ')})`
    : `${s.k === 'aq' ? 'Aquecimento ' : s.k === 'dq' ? 'Desaquecimento ' : ''}${medTxt(s)} ${zt(s)}${est(s)}`).join(' · ');
}
function perfilHTML(estrutura, perfil, alto = false) {
  const l = achatar(estrutura, perfil); const tot = l.reduce((a, s) => a + s.seg, 0) || 1;
  if (!l.length) return '<div class="perfil-int vazio"></div>';
  return `<div class="perfil-int ${alto ? 'alto' : ''}" aria-hidden="true">${l.map((s) => { const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve; return `<i style="flex:${(s.seg / tot * 100).toFixed(2)};height:${Math.round(z.h * 100)}%;background:${z.c}"></i>`; }).join('')}</div>`;
}
function estruturaDe(p) {
  if (semCorrida(p)) return [];
  if (p.estrutura && p.estrutura.length) return p.estrutura;
  if (p.distancia_km) return [passo('co', +p.distancia_km, 'km', p.zona || 'leve')];
  if (p.duracao_min) return [passo('co', +p.duracao_min, 'min', p.zona || 'leve')];
  return [];
}

/* ---------- relatório mensal do aluno (PDF para mandar no WhatsApp) ---------- */
async function relatorioMes(alunoId, box, staff, m) {
  const st = S.cache.relM || (S.cache.relM = { comp: compDe(), msg: '' });
  const [y, mm] = st.comp.split('-').map(Number);
  const ini = isoDia(new Date(y, mm - 1, 1, 12)), fim = isoDia(new Date(y, mm, 0, 12));
  const iniAnt = isoDia(new Date(y, mm - 2, 1, 12)), fimAnt = isoDia(new Date(y, mm - 1, 0, 12));
  box.innerHTML = esqBloco();
  const ate = (d) => d + 'T23:59:59';
  const [corrs, corrsAnt, sess, sessAnt, plano, regs, provas] = await Promise.all([
    sb.from('nx_corridas').select('data,tipo,distancia_m,duracao_s,plano_id').eq('aluno_id', alunoId).gte('data', ini).lte('data', ate(fim)).order('data').then((r) => (r.data || []).filter(ehCorr)).catch(() => []),
    sb.from('nx_corridas').select('data,tipo,distancia_m').eq('aluno_id', alunoId).gte('data', iniAnt).lte('data', ate(fimAnt)).then((r) => (r.data || []).filter(ehCorr)).catch(() => []),
    sb.from('nx_sessoes').select('iniciado_em,treino_titulo').eq('aluno_id', alunoId).not('finalizado_em', 'is', null).gte('iniciado_em', ini).lte('iniciado_em', ate(fim)).then((r) => r.data || []).catch(() => []),
    sb.from('nx_sessoes').select('iniciado_em').eq('aluno_id', alunoId).not('finalizado_em', 'is', null).gte('iniciado_em', iniAnt).lte('iniciado_em', ate(fimAnt)).then((r) => r.data || []).catch(() => []),
    sb.from('nx_plano_corrida').select('id,data,tipo,liberado').eq('aluno_id', alunoId).gte('data', ini).lte('data', fim).then((r) => (r.data || []).filter((p) => !semCorrida(p) && p.liberado !== false)).catch(() => []),
    sb.from('nx_registros').select('exercicio_nome,carga_kg,criado_em').eq('aluno_id', alunoId).not('carga_kg', 'is', null).lte('criado_em', ate(fim)).order('criado_em').limit(3000).then((r) => r.data || []).catch(() => []),
    sb.from('nx_participacoes').select('titulo,data,distancia').eq('aluno_id', alunoId).gte('data', ini).lte('data', fim).then((r) => r.data || []).catch(() => []),
  ]);
  const km = corrs.reduce((a, c) => a + c.distancia_m, 0) / 1000, kmAnt = corrsAnt.reduce((a, c) => a + c.distancia_m, 0) / 1000;
  const diasT = new Set([...corrs.map((c) => isoDia(c.data)), ...sess.map((x) => isoDia(x.iniciado_em))]).size;
  const diasAnt = new Set([...corrsAnt.map((c) => isoDia(c.data)), ...sessAnt.map((x) => isoDia(x.iniciado_em))]).size;
  const feitosPl = plano.filter((p) => corrs.some((c) => c.plano_id === p.id)).length;
  const ader = plano.length ? Math.round((feitosPl / plano.length) * 100) : null;
  // km e pace por semana do mês
  const semanas = []; for (let d = inicioSemana(dia(ini)); isoDia(d) <= fim; d.setDate(d.getDate() + 7)) semanas.push(isoDia(d));
  const porSem = semanas.map((s0) => { const s1 = isoDia(dia(s0).getTime() + 6 * 864e5); const l = corrs.filter((c) => isoDia(c.data) >= s0 && isoDia(c.data) <= s1); const dist = l.reduce((a, c) => a + c.distancia_m, 0); const t = l.filter((c) => c.distancia_m >= 2500).reduce((a, c) => [a[0] + c.duracao_s, a[1] + c.distancia_m], [0, 0]); return { s0, km: dist / 1000, pace: t[1] ? t[0] / (t[1] / 1000) : null }; });
  const maxKm = Math.max(5, ...porSem.map((x) => x.km));
  const longa = corrs.reduce((a, c) => (!a || c.distancia_m > a.distancia_m ? c : a), null);
  const rapida = corrs.filter((c) => c.distancia_m >= 3000).reduce((a, c) => (!a || paceDe(c) < paceDe(a) ? c : a), null);
  // cargas: melhor carga no mês x antes do mês
  const porEx = {}; regs.forEach((r) => { const n = r.exercicio_nome || 'Exercício'; const e = (porEx[n] = porEx[n] || { antes: 0, mes: 0, vezes: 0 }); const c = +r.carga_kg || 0; if (isoDia(r.criado_em) >= ini) { e.mes = Math.max(e.mes, c); e.vezes++; } else e.antes = Math.max(e.antes, c); });
  const cargas = Object.entries(porEx).filter(([, e]) => e.mes > 0).sort((a, b) => (b[1].mes - b[1].antes) - (a[1].mes - a[1].antes) || b[1].vezes - a[1].vezes).slice(0, 5);
  const delta = (a, b, un = '') => { if (!b) return ''; const d = a - b; if (Math.abs(d) < 0.05) return '<span class="rm-d">igual ao mês anterior</span>'; return `<span class="rm-d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${un === 'km' ? f1(Math.abs(d)) + ' km' : Math.abs(Math.round(d))} vs. mês anterior</span>`; };
  const treinador = (await carregarEquipe()).find((p) => p.user_id === (m.treinador_id || S.user.id));
  const nomeMesTxt = nomeMes(st.comp);
  const fC = faz('corrida', m), fM = faz('musculacao', m);
  box.innerHTML = `
    <div class="rm-bar"><div class="row" style="gap:6px"><button class="icon-btn sm" id="rm-a" aria-label="Mês anterior">${I.back}</button><b class="rm-mes">${nomeMesTxt}</b><button class="icon-btn sm" id="rm-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
      <div class="row" style="gap:6px"><button class="btn sm" id="rm-pdf">${I.ficha} ${staff ? 'Gerar PDF' : 'Baixar PDF'}</button></div></div>
    ${staff ? `<label class="field" style="margin-top:12px"><span>Mensagem do treinador (vai no relatório)</span><textarea class="textarea" id="rm-msg" placeholder="Ex.: Mês muito consistente! Agora é manter os longões e caprichar no sono.">${esc(st.msg)}</textarea></label>` : ''}
    <div class="rm-folha" id="rm-folha">
      <div class="rm-top"><img src="icons/simbolo-escuro.svg" alt="Nexos"><div><span class="rm-ey">Relatório mensal</span><b>${nomeMesTxt}</b></div></div>
      <div class="rm-aluno">${fotoHTML(m, 'md')}<div><h2>${esc(m.nome || '')}</h2><span>${m.objetivo ? 'Objetivo: ' + esc(m.objetivo) : 'Nexos Performance e Saúde'}</span></div></div>
      <div class="rm-nums">
        ${fC ? `<div><b>${f1(km)}</b><span>km corridos</span>${delta(km, kmAnt, 'km')}</div><div><b>${corrs.length}</b><span>corridas</span></div>` : ''}
        ${fM ? `<div><b>${sess.length}</b><span>treinos de força</span></div>` : ''}
        <div><b>${diasT}</b><span>dias treinados</span>${delta(diasT, diasAnt)}</div>
        ${fC && ader != null ? `<div><b>${ader}%</b><span>da planilha cumprida</span></div>` : ''}
      </div>
      ${fC && corrs.length ? `<div class="rm-sec"><h3>Quilômetros por semana</h3><div class="rm-barras">${porSem.map((x) => `<div><i style="height:${Math.max(3, (x.km / maxKm) * 100)}%"></i><b>${f1(x.km)}</b><small>${dia(x.s0).getDate()}/${dia(x.s0).getMonth() + 1}</small></div>`).join('')}</div></div>
      <div class="rm-sec"><h3>Pace médio por semana</h3><div class="rm-paces">${porSem.filter((x) => x.pace).map((x) => `<div><small>semana de ${dia(x.s0).getDate()}/${dia(x.s0).getMonth() + 1}</small><b>${fmtPace(x.pace)}</b></div>`).join('') || '<p class="small muted">Sem corridas de 2,5 km ou mais no mês.</p>'}</div></div>
      <div class="rm-sec"><h3>Destaques</h3><ul class="rm-dest">${longa ? `<li>Corrida mais longa: <b>${fmtKm(longa.distancia_m, 1)}</b> em ${fmtDia(longa.data)}</li>` : ''}${rapida ? `<li>Melhor pace (3 km ou mais): <b>${fmtPace(paceDe(rapida))}</b> em ${fmtDia(rapida.data)}</li>` : ''}${provas.map((p) => `<li>${icT(I.flag)}Prova: <b>${esc(p.titulo)}</b>${p.distancia ? ' · ' + esc(p.distancia) : ''}</li>`).join('')}</ul></div>` : ''}
      ${fM && cargas.length ? `<div class="rm-sec"><h3>Evolução de cargas</h3><div class="rm-cargas">${cargas.map(([n, e]) => `<div><span>${esc(n)}</span><b>${e.antes && e.antes !== e.mes ? `${fmtKg(e.antes)} → ` : ''}${fmtKg(e.mes)}</b>${!e.antes ? '<em class="nv">novo</em>' : e.mes > e.antes ? `<em>+${fmtKg(e.mes - e.antes)}</em>` : e.mes === e.antes ? '<em class="nv">mantida</em>' : ''}</div>`).join('')}</div></div>` : ''}
      ${!corrs.length && !sess.length ? '<p class="small muted" style="margin:14px 0">Nenhum treino registrado neste mês.</p>' : ''}
      <div class="rm-msg" id="rm-msg-out" ${st.msg ? '' : 'hidden'}><span>Mensagem do seu treinador</span><p>${esc(st.msg)}</p>${treinador ? `<b>${esc(firstName(treinador.nome))}</b>` : ''}</div>
      <div class="rm-pe">Nexos Performance e Saúde · ${esc(CONTATO.insta)} · São Luís–MA</div>
    </div>`;
  const re = () => relatorioMes(alunoId, box, staff, m);
  box.querySelector('#rm-a').onclick = () => { st.comp = somaMes(st.comp, -1); re(); };
  box.querySelector('#rm-p').onclick = () => { st.comp = somaMes(st.comp, 1); re(); };
  const msg = box.querySelector('#rm-msg'); if (msg) msg.oninput = () => { st.msg = msg.value; const o = box.querySelector('#rm-msg-out'); o.hidden = !st.msg.trim(); o.querySelector('p').textContent = st.msg; };
  box.querySelector('#rm-pdf').onclick = async (e) => {
    const b = e.currentTarget; b.disabled = true; const txt = b.innerHTML; b.textContent = 'Gerando…';
    try {
      if (!window.html2pdf) await new Promise((ok, erro) => { const sc = document.createElement('script'); sc.src = (window.NX_DEMO && window.NX_VENDOR) || new URL('vendor/html2pdf.bundle.min.js', document.baseURI).href; sc.onload = ok; sc.onerror = erro; document.head.appendChild(sc); });
      // o gerador de PDF não desenha SVG: troca a logo por PNG antes
      for (const im of box.querySelectorAll('#rm-folha img')) {
        if (!/svg/i.test(im.src)) continue;
        const w = im.clientWidth || 80, h = im.clientHeight || 34, cv = document.createElement('canvas'); cv.width = w * 3; cv.height = h * 3;
        await new Promise((ok) => { const t = new Image(); t.onload = () => { cv.getContext('2d').drawImage(t, 0, 0, cv.width, cv.height); ok(); }; t.onerror = ok; t.src = im.src; });
        im.style.width = w + 'px'; im.style.height = h + 'px'; im.src = cv.toDataURL('image/png');
      }
      const nomeArq = `Relatorio-Nexos-${firstName(m.nome || 'aluno')}-${st.comp}.pdf`;
      // gera a partir de uma cópia com largura de folha A4 (assim fica igual no celular e no computador)
      const caixa = document.createElement('div'); caixa.style.cssText = 'position:fixed;left:0;top:0;width:760px;z-index:-1;pointer-events:none;opacity:1';
      const copia = box.querySelector('#rm-folha').cloneNode(true); copia.removeAttribute('id'); copia.classList.add('rm-print'); caixa.appendChild(copia); document.body.appendChild(caixa);
      let blob; try { blob = await window.html2pdf().set({ margin: 0, filename: nomeArq, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 760, windowWidth: 760, scrollX: 0, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(copia).outputPdf('blob'); } finally { caixa.remove(); }
      const arq = new File([blob], nomeArq, { type: 'application/pdf' });
      if (staff) {
        const tel = telWa(m.telefone);
        openSheet(`<p class="eyebrow">Relatório de ${esc(nomeMesTxt)}</p><div class="h2" style="margin-top:4px">PDF pronto</div><p class="small muted" style="margin-top:6px">Compartilhe direto no WhatsApp do aluno ou baixe o arquivo.</p>
          <div class="stack" style="margin-top:16px">${navigator.canShare && navigator.canShare({ files: [arq] }) ? '<button class="btn block wa-btn" id="rm-share">Compartilhar o PDF (WhatsApp)</button>' : ''}
          <button class="btn ghost block" id="rm-down">Baixar o PDF</button>
          ${tel ? `<a class="btn ghost block" href="https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${firstName(m.nome || '')}! Segue o seu relatório de ${nomeMesTxt} da Nexos`)}" target="_blank" rel="noopener">Abrir a conversa no WhatsApp</a>` : ''}</div>
          <p class="tiny dim" style="margin-top:12px">No computador: baixe o PDF, abra a conversa e arraste o arquivo para o WhatsApp.</p>`, (r) => {
          const sh = r.querySelector('#rm-share'); if (sh) sh.onclick = () => navigator.share({ files: [arq], title: nomeArq, text: `Relatório de ${nomeMesTxt} · Nexos` }).catch(() => {});
          r.querySelector('#rm-down').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeArq; a.click(); };
        });
      } else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomeArq; a.click(); toast('PDF baixado!'); }
    } catch (err) { console.error(err); toast('Não foi possível gerar o PDF. Tente de novo.', true); }
    b.disabled = false; b.innerHTML = txt;
  };
}

/* ---------- guia rápido da planilha (primeira vez) ---------- */
function guiaPlanilha() {
  const toque = matchMedia('(pointer:coarse)').matches;
  const passos = [
    ['1', 'Arraste da Biblioteca', toque ? 'Segure um treino da Biblioteca por um instante, até ele “descolar”, e arraste até o dia. Solte e pronto.' : 'Clique num treino da Biblioteca, segure e arraste até o dia. Solte e pronto.', 'mod'],
    ['2', 'Mude de dia ou exclua', `Arraste um treino de um dia para outro para mudar a data. Para excluir, arraste até “Solte aqui para excluir”, que aparece no topo.${toque ? '' : ' Segure Ctrl ou Alt para copiar em vez de mover.'}`, 'mov'],
    ['3', 'Toque para editar', 'O + de cada dia cria um treino do zero. Tocando num treino você muda os passos, distâncias e zonas. No fim, use “Avisar aluno” para ele receber a notificação.', 'ed'],
  ];
  let i = 0;
  const draw = (r) => {
    const [n, t, d, k] = passos[i];
    r.querySelector('#gp').innerHTML = `<div class="gp-ilu gp-${k}"><span class="gp-card"></span><span class="gp-dia"></span><span class="gp-mao"></span></div>
      <p class="eyebrow" style="margin-top:16px">Passo ${n} de ${passos.length}</p><div class="h2" style="margin-top:4px">${t}</div><p class="small muted" style="margin-top:6px">${d}</p>
      <div class="gp-dots">${passos.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="grid2" style="margin-top:16px"><button class="btn ghost" id="gp-a">${i ? 'Voltar' : 'Pular'}</button><button class="btn" id="gp-p">${i === passos.length - 1 ? 'Entendi' : 'Próximo'}</button></div>`;
    r.querySelector('#gp-a').onclick = () => { if (!i) { store.set('nx_guia_plan', true); return closeSheet(); } i--; draw(r); };
    r.querySelector('#gp-p').onclick = () => { if (i === passos.length - 1) { store.set('nx_guia_plan', true); return closeSheet(); } i++; draw(r); };
  };
  openSheet('<div id="gp"></div>', draw);
}

/* ---------- arrastar e soltar (mouse e dedo) ---------- */
function arrastar(root, { item, alvo, soltar, handle }) {
  let st = null; let bloqueiaClique = false;
  const limpar = () => {
    if (!st) return; clearTimeout(st.timer);
    if (st.ghost) st.ghost.remove();
    if (st.alvoEl) st.alvoEl.classList.remove('alvo-on');
    if (st.el) st.el.classList.remove('arrastando-origem');
    document.body.classList.remove('arrastando'); document.documentElement.classList.remove('trava-scroll'); removeEventListener('scroll', segura); cancelAnimationFrame(st.raf); st = null;
  };
  // trava a página enquanto arrasta (no celular o dedo não pode rolar a tela)
  const segura = () => { if (st && st.ativo && Math.abs(scrollY - st.sy) > 1) scrollTo(scrollX, st.sy); };
  const comecar = () => {
    st.ativo = true; bloqueiaClique = true; st.sy = scrollY;
    document.documentElement.classList.add('trava-scroll'); addEventListener('scroll', segura, { passive: true });
    const r = st.el.getBoundingClientRect();
    const g = st.el.cloneNode(true); g.classList.add('fantasma');
    g.style.width = Math.min(r.width, 260) + 'px'; g.style.left = '0px'; g.style.top = '0px';
    document.body.appendChild(g); st.ghost = g; st.dx = Math.min(st.x - r.left, 240); st.dy = st.y - r.top;
    st.el.classList.add('arrastando-origem'); document.body.classList.add('arrastando');
    try { navigator.vibrate && navigator.vibrate(15); } catch {}
    mover(st.x, st.y);
    const sc = root.closest('.sheet'); const auto = () => { if (!st) return; const dv = st.y < 70 ? -12 : st.y > innerHeight - 60 ? 12 : 0; if (dv) { if (sc) sc.scrollTop += dv; else { window.scrollBy(0, dv); st.sy = scrollY; } } st.raf = requestAnimationFrame(auto); };
    st.raf = requestAnimationFrame(auto);
  };
  const mover = (x, y) => {
    st.x = x; st.y = y; if (!st.ativo) return;
    st.ghost.style.transform = `translate(${x - st.dx}px, ${y - st.dy}px) rotate(-2deg)`;
    const el = document.elementFromPoint(x, y); const a = el && el.closest(alvo);
    if (a !== st.alvoEl) { if (st.alvoEl) st.alvoEl.classList.remove('alvo-on'); if (a) a.classList.add('alvo-on'); st.alvoEl = a; }
  };
  const terminar = () => { if (st && st.ativo && st.alvoEl) { const el = st.el, a = st.alvoEl, ev = { copia: st.copia }; limpar(); soltar(el, a, ev); } else limpar(); setTimeout(() => (bloqueiaClique = false), 50); };
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    const el = e.target.closest(item); if (!el || !root.contains(el)) return;
    if (handle && !e.target.closest(handle)) return;
    if (e.target.closest('input,select,textarea')) return;
    st = { el, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, copia: e.altKey || e.ctrlKey || e.metaKey };
    const mv = (ev) => { if (!st) return; st.copia = ev.ctrlKey || ev.altKey || ev.metaKey; if (!st.ativo && Math.hypot(ev.clientX - st.x0, ev.clientY - st.y0) > 6) { st.x = ev.clientX; st.y = ev.clientY; comecar(); } mover(ev.clientX, ev.clientY); if (st && st.ativo) ev.preventDefault(); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); terminar(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  root.addEventListener('touchstart', (e) => {
    const el = e.target.closest(item); if (!el || !root.contains(el) || e.touches.length > 1) return;
    if (handle && !e.target.closest(handle)) return;
    if (e.target.closest('input,select,textarea')) return;
    const t = e.touches[0];
    st = { el, x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, toque: true };
    st.timer = setTimeout(() => { if (st && !st.ativo) comecar(); }, handle ? 120 : 280);
    const mv = (ev) => {
      if (!st) return; const tt = ev.touches[0];
      if (!st.ativo) { if (Math.hypot(tt.clientX - st.x0, tt.clientY - st.y0) > 10) { limpar(); off(); } return; }
      if (ev.cancelable) ev.preventDefault(); mover(tt.clientX, tt.clientY);
    };
    const end = () => { off(); terminar(); };
    const off = () => { document.removeEventListener('touchmove', mv); document.removeEventListener('touchend', end); document.removeEventListener('touchcancel', end); };
    document.addEventListener('touchmove', mv, { passive: false }); document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
  }, { passive: true });
  root.addEventListener('click', (e) => { if (bloqueiaClique) { e.stopPropagation(); e.preventDefault(); } }, true);
  root.addEventListener('contextmenu', (e) => { if (st || e.target.closest(item)) e.preventDefault(); });
}

/* ---------- planilha do treinador: o que o aluno fez naquele treino (aparece junto do editor) ---------- */
async function montarFeito(r, feitoBase, plano) {
  const plan = document.createElement('div'); plan.id = 'ed-plan'; plan.hidden = true;
  while (r.firstChild) plan.appendChild(r.firstChild);
  r.innerHTML = `<p class="eyebrow">${fmtDia(plano.data)} · ${esc(plano.titulo || nomeTipo(plano.tipo))}</p>
    <div class="seg ed-modo" style="margin-top:10px"><button type="button" data-modo="feito" class="on">${I.check} Feito pelo aluno</button><button type="button" data-modo="plan">Treino prescrito</button></div>
    <div id="ed-feito" style="margin-top:14px"><p class="small muted">Carregando o treino do aluno…</p></div>`;
  r.appendChild(plan);
  r.querySelector('.ed-modo').onclick = (e) => {
    const b = e.target.closest('[data-modo]'); if (!b) return;
    r.querySelectorAll('.ed-modo button').forEach((x) => x.classList.toggle('on', x === b));
    r.querySelector('#ed-feito').hidden = b.dataset.modo !== 'feito'; plan.hidden = b.dataset.modo !== 'plan';
  };
  const box = r.querySelector('#ed-feito');
  const [{ data: c }, { data: al }] = await Promise.all([
    sb.from('nx_corridas').select('*').eq('id', feitoBase.id).maybeSingle(),
    sb.from('nx_membros').select('nome,corrida,nascimento').eq('org_id', S.org.id).eq('user_id', feitoBase.aluno_id || plano.aluno_id).maybeSingle(),
  ]);
  const hist90 = c ? await buscarHist90(c.aluno_id, c.data) : [];
  if (!c) { box.innerHTML = '<p class="small muted">Não foi possível carregar o treino do aluno.</p>'; return; }
  const pace = paceDe(c), parc = c.parciais || [];
  const pk = (x) => x.seg / (x.parcial ? (x.km % 1 || 1) : 1);
  const pMin = parc.length ? Math.min(...parc.map(pk)) : 0, pMax = parc.length ? Math.max(...parc.map(pk)) : 0;
  const prevKm = plano.distancia_km ? Number(plano.distancia_km) : null;
  box.innerHTML = `
    <div class="row between" style="gap:8px;flex-wrap:wrap"><b>${fmtDia(c.data)} · ${fmtHora(c.data)}${c.fonte === 'garmin' ? ' · Garmin' : c.fonte === 'celular' ? ' · GPS do celular' : ''}</b>
      ${c.comentario_treinador ? `<span class="tag ok">${I.check} Comentado</span>` : c.visto_treinador ? `<span class="tag ok">${I.check} Visto</span>` : '<span class="tag warn">Ainda não visto</span>'}</div>
    <div class="metrics" style="margin-top:10px">
      ${comDist(c) ? `<div class="metric"><span>Distância</span><b>${fmtKm(c.distancia_m).replace(' km', '')}<small>km</small></b>${prevKm ? `<em>previsto ${String(prevKm).replace('.', ',')} km · ${Math.round((c.distancia_m / 1000 / prevKm) * 100)}%</em>` : ''}</div>` : ''}
      <div class="metric"><span>Tempo</span><b>${fmtDurLongo(c.duracao_s)}</b></div>
      ${comDist(c) ? `<div class="metric"><span>Pace médio</span><b>${fmtPace(pace).replace('/km', '')}<small>/km</small></b></div>` : ''}
      ${c.fc_media ? `<div class="metric"><span>FC média</span><b>${c.fc_media}<small>bpm</small></b>${c.fc_max ? `<em>máx ${c.fc_max}</em>` : ''}</div>` : ''}
      ${c.elevacao_m ? `<div class="metric"><span>Subida</span><b>${Math.round(c.elevacao_m)}<small>m</small></b></div>` : ''}
      ${c.rpe != null ? `<div class="metric"><span>Esforço</span><b>${c.rpe}<small>/10</small></b><em>${rpeTxt(c.rpe)}</em></div>` : ''}
    </div>
    ${nexosIntHTML(nexosInteligencia(c, { plano, perfil: perfilCorrida(al || {}), hist: hist90 }))}
    ${c.dor ? `<div class="card" style="margin-top:10px;border-color:rgba(214,120,0,.35)"><span class="eyebrow" style="color:var(--warn)">Relatou dor${c.dor_local ? ': ' + esc(c.dor_local) : ''}</span></div>` : ''}
    ${corpoTags(c) ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${corpoTags(c)}</div>` : ''}
    ${c.comentario ? `<div class="card" style="margin-top:10px"><span class="eyebrow">Como foi, nas palavras do aluno</span><p style="margin-top:6px">“${esc(c.comentario)}”</p></div>` : ''}
    ${c.comentario_treinador ? `<div class="card coment-tr" style="margin-top:10px"><span class="eyebrow">${I.feed} Seu comentário</span><p style="margin-top:6px;white-space:pre-line">${esc(c.comentario_treinador)}</p></div>` : ''}
    ${parc.length ? `<div class="card" style="margin-top:10px"><span class="eyebrow">Parciais</span><div class="splits" style="margin-top:8px">${parc.slice(0, 30).map((x) => { const v = pk(x); const w = pMax > pMin ? 35 + (65 * (pMax - v)) / (pMax - pMin) : 100; return `<div><span>${x.parcial ? String(x.km).replace('.', ',') : 'km ' + x.km}</span><i style="width:${w.toFixed(0)}%"></i><b>${fmtPace(v).replace('/km', '')}</b><em>${x.fc ? x.fc + ' bpm' : ''}</em></div>`; }).join('')}</div></div>` : ''}
    <div class="grid2" style="margin-top:14px">${c.visto_treinador ? '' : `<button type="button" class="btn ghost" data-visto="corrida|${c.id}">${I.check} Visto</button>`}<button type="button" class="btn ghost" id="fe-coment">${I.feed} ${c.comentario_treinador ? 'Editar comentário' : 'Comentar'}</button></div>
    <a class="btn block" href="#/corrida/${c.id}" style="margin-top:8px">Ver análise completa (gráficos, mapa e voltas)</a>
    <button type="button" class="link-btn small" id="fe-editar" style="display:block;margin:12px auto 0">Editar o treino prescrito</button>`;
  const vb = box.querySelector('[data-visto]'); if (vb) vb.onclick = () => marcarVisto(vb);
  box.querySelector('#fe-coment').onclick = () => comentarTreino(c, al || { nome: 'Aluno' });
  box.querySelector('#fe-editar').onclick = () => r.querySelector('[data-modo="plan"]').click();
  box.querySelector('a[href^="#/corrida/"]').onclick = () => closeSheet(true);
}

/* ---------- editor de treino estruturado ---------- */
function editorTreino({ alunoId, perfil, sessao, data, modelo, aoSalvar, modelos, feito }) {
  const base = sessao ? { ...sessao, estrutura: clone(estruturaDe(sessao)) } : { data, tipo: (modelo && modelo.tipo) || 'rodagem', titulo: modelo ? modelo.nome : '', estrutura: clone(modelo ? modelo.estrutura : [passo('co', 6, 'km', 'leve')]), descricao: '' };
  const t = base;
  const zonaSel = (z, cam) => `<select class="input zsel" data-cam="${cam}" data-f="z" style="--zc:${(ZONAS_INFO[z] || ZONAS_INFO.leve).c}">${Object.entries(ZONAS_INFO).map(([k, i]) => `<option value="${k}" ${z === k ? 'selected' : ''}>${i.n}</option>`).join('')}</select>`;
  const medSel = (m, cam) => `<select class="input msel" data-cam="${cam}" data-f="med">${[['km', 'km'], ['m', 'metros'], ['min', 'min']].map(([k, l]) => `<option value="${k}" ${m === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const linhaPasso = (s, cam) => `<div class="passo" data-cam="${cam}" style="--zc:${(ZONAS_INFO[s.z] || ZONAS_INFO.leve).c}">
      <span class="alca" aria-label="Arrastar">⋮⋮</span>
      <select class="input ksel" data-cam="${cam}" data-f="k">${Object.entries(PASSOS).map(([k, l]) => `<option value="${k}" ${s.k === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input class="input vin" data-cam="${cam}" data-f="v" data-mask="dec" inputmode="decimal" value="${esc(String(s.v).replace('.', ','))}">
      ${medSel(s.med, cam)}${zonaSel(s.z, cam)}
      <em class="pace-dica">pace ${paceZonaTxt(s.z, perfil)}${perfil.paces && (perfil.paces[s.z] || s.z === 'rec') ? '' : ' <span>(média, sem teste)</span>'} · ${s.med === 'min' ? 'dist.' : 'tempo'} est. ≈ ${estimaPasso(s, perfil).txt}</em>
      <button type="button" class="x-passo" data-del="${cam}" aria-label="Remover">${I.x}</button></div>`;
  const desenhar = (r) => {
    r.querySelector('#passos').innerHTML = t.estrutura.map((s, i) => s.k === 'rep'
      ? `<div class="serie" data-cam="${i}"><div class="serie-h"><span class="alca" aria-label="Arrastar">⋮⋮</span><b>Repetir</b><input class="input nin" data-cam="${i}" data-f="n" data-mask="num" data-max="2" inputmode="numeric" value="${s.n}"><b>vezes</b><button type="button" class="x-passo" data-del="${i}" aria-label="Remover série">${I.x}</button></div>
          <div class="serie-c">${(s.passos || []).map((p, j) => linhaPasso(p, i + '.' + j)).join('')}<button type="button" class="link-btn small" data-addin="${i}">+ passo na série</button></div></div>`
      : linhaPasso(s, String(i))).join('') || '<p class="small muted">Adicione os passos do treino abaixo.</p>';
    r.querySelector('#perf').innerHTML = perfilHTML(t.estrutura, perfil, true);
    r.querySelector('#tot').innerHTML = `${(() => { const tt = estimaTotal(t.estrutura, perfil); return `<b>${tt.soDist ? '' : '≈ '}${tt.km}</b> · ${tt.soTempo ? '' : '≈ '}${tt.tempo}`; })()}${perfil.paces ? '' : ' <span class="tiny dim">(estimativa com paces médios)</span>'}`;
    r.querySelector('#desc-auto').textContent = descreverEstrutura(t.estrutura, perfil);
  };
  const pega = (cam) => { const [a, b] = String(cam).split('.').map(Number); return b == null ? { lista: t.estrutura, i: a } : { lista: t.estrutura[a].passos, i: b }; };
  openSheet(`<p class="eyebrow">${sessao ? 'Editar treino' : 'Novo treino'} · ${fmtDia(base.data)}</p>
    <div class="grid2" style="margin-top:12px"><label class="field"><span>Nome do treino</span><input class="input" id="t-nome" value="${esc(t.titulo || '')}" placeholder="Ex.: 6 × 800 m"></label><label class="field"><span>Tipo</span><select class="input" id="t-tipo">${TIPOS_CORRIDA.map(([k, l]) => `<option value="${k}" ${t.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <p class="small muted sobre-ed" id="t-sobre">${esc(sobreTreino(t.tipo))}</p>
    <div class="card perf-card"><div id="perf"></div><div class="row between" style="margin-top:8px"><span class="small" id="tot"></span><span class="legenda">${Object.entries(ZONAS_INFO).map(([, z]) => `<i style="background:${z.c}" title="${z.n}"></i>`).join('')}</span></div><p class="tiny dim" id="desc-auto" style="margin-top:6px"></p></div>
    <div id="passos" class="passos"></div>
    <div class="add-passos">${Object.entries(PASSOS).map(([k, l]) => `<button type="button" class="chip" data-add="${k}">+ ${l}</button>`).join('')}<button type="button" class="chip" data-add="rep">+ Série (repetir)</button></div>
    <label class="field" style="margin-top:16px"><span>Sua observação para o aluno (opcional)</span><textarea class="textarea" id="t-desc" placeholder="Ex.: terreno plano, hidrate a cada 20 min">${esc(t.descricao || '')}</textarea></label>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn grow" id="t-salvar">Salvar treino ${I.check}</button>${sessao ? '<button class="btn ghost" id="t-dup">Duplicar</button>' : ''}</div>
    <div class="row between" style="margin-top:12px"><button class="link-btn small" id="t-modelo">Salvar como modelo</button>${sessao ? '<button class="link-btn small" id="t-del" style="color:var(--err)">Excluir treino</button>' : ''}</div>`, (r) => {
    desenhar(r);
    if (feito && sessao) montarFeito(r, feito, sessao);
    const pc = r.querySelector('#passos');
    pc.addEventListener('change', (e) => {
      const el = e.target.closest('[data-cam]'); if (!el || !el.dataset.f) return;
      if (el.dataset.f === 'n') { t.estrutura[+el.dataset.cam].n = Math.max(1, Math.round(num(el.value) || 1)); desenhar(r); return; }
      const { lista, i } = pega(el.dataset.cam); const f = el.dataset.f;
      lista[i][f] = f === 'v' ? (num(el.value) || 0) : el.value;
      if (f === 'k' && el.value === 'rc' && lista[i].z !== 'rec') lista[i].z = 'rec';
      if (f === 'k' && (el.value === 'aq' || el.value === 'dq')) lista[i].z = 'leve';
      desenhar(r);
    });
    pc.addEventListener('click', (e) => {
      const d = e.target.closest('[data-del]'), ai = e.target.closest('[data-addin]');
      if (d) { const { lista, i } = pega(d.dataset.del); lista.splice(i, 1); desenhar(r); }
      if (ai) { t.estrutura[+ai.dataset.addin].passos.push(passo('co', 400, 'm', 'intervalado')); desenhar(r); }
    });
    r.querySelector('.add-passos').onclick = (e) => {
      const b = e.target.closest('[data-add]'); if (!b) return; const k = b.dataset.add;
      const novo = k === 'rep' ? serie(4, [passo('co', 400, 'm', 'intervalado'), passo('rc', 90, 'm', 'rec')]) : k === 'aq' ? passo('aq', 2, 'km', 'leve') : k === 'dq' ? passo('dq', 1, 'km', 'leve') : k === 'rc' ? passo('rc', 2, 'min', 'rec') : passo('co', 2, 'km', 'leve');
      const iDq = t.estrutura.findIndex((s) => s.k === 'dq');
      if (k === 'aq') t.estrutura.unshift(novo); else if (k !== 'dq' && iDq >= 0) t.estrutura.splice(iDq, 0, novo); else t.estrutura.push(novo);
      desenhar(r);
    };
    // reordenar passos arrastando pela alça
    arrastar(pc, { item: '.passo, .serie', handle: '.alca', alvo: '.passo, .serie', soltar: (el, alvoEl) => {
      const de = el.dataset.cam, para = alvoEl.dataset.cam;
      if (de === para || para.startsWith(de + '.')) return;
      const o = pega(de), d = pega(para);
      const mov = o.lista[o.i];
      if (mov.k === 'rep' && d.lista !== t.estrutura) return toast('Uma série não pode ficar dentro de outra.', true);
      const ref = d.lista[d.i], mesma = o.lista === d.lista, desce = mesma && o.i < d.i;
      o.lista.splice(o.i, 1);
      const idx = d.lista.indexOf(ref);
      d.lista.splice(desce ? idx + 1 : idx, 0, mov); desenhar(r);
    } });
    const lerTopo = () => { t.titulo = r.querySelector('#t-nome').value.trim(); t.tipo = r.querySelector('#t-tipo').value; t.descricao = r.querySelector('#t-desc').value.trim(); };
    r.querySelector('#t-tipo').addEventListener('change', (e) => { r.querySelector('#t-sobre').textContent = sobreTreino(e.target.value); });
    const linha = () => { lerTopo(); const rs = resumoEstrutura(t.estrutura, perfil); const zs = achatar(t.estrutura, perfil).filter((s) => s.k === 'co').sort((a, b) => b.seg - a.seg); return { data: t.data, tipo: t.tipo, titulo: t.titulo || null, estrutura: t.estrutura, distancia_km: Math.round(rs.km * 10) / 10, duracao_min: Math.round(rs.seg / 60), zona: zs[0] ? (zs[0].z === 'rec' ? 'leve' : zs[0].z) : null, descricao: t.descricao || null }; };
    r.querySelector('#t-salvar').onclick = async (e) => {
      if (!t.estrutura.length) return toast('Adicione pelo menos um passo.', true);
      e.currentTarget.disabled = true; const row = linha();
      const { error } = sessao ? await sb.from('nx_plano_corrida').update(row).eq('id', sessao.id) : await sb.from('nx_plano_corrida').insert({ ...row, org_id: S.org.id, aluno_id: alunoId, criado_por: S.user.id });
      if (error) { e.currentTarget.disabled = false; return toast('Não foi possível salvar.', true); }
      closeSheet(); toast('Treino salvo!'); aoSalvar();
      // treino já liberado e enviado ao Garmin: manda a versão nova para o relógio
      if (sessao && sessao.liberado && S.cache.garmOn) enviarGarmin(alunoId, [{ ...sessao, ...row, id: sessao.id, liberado: true }], perfil).then((r) => { if (r.enviados) toast('Treino atualizado também no Garmin do aluno ⌚'); }).catch(() => {});
    };
    const dup = r.querySelector('#t-dup');
    if (dup) dup.onclick = async () => { const row = linha(); const d = dia(row.data); d.setDate(d.getDate() + 1); const { error } = await sb.from('nx_plano_corrida').insert({ ...row, data: isoDia(d), org_id: S.org.id, aluno_id: alunoId, criado_por: S.user.id }); if (error) return toast('Não foi possível duplicar.', true); closeSheet(); toast('Duplicado no dia seguinte. Arraste para onde quiser.'); aoSalvar(); };
    const del = r.querySelector('#t-del');
    if (del) del.onclick = async () => { if (sessao.garmin_workout_id) await chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: [{ plano_id: sessao.id }] }).catch(() => {}); const { error } = await sb.from('nx_plano_corrida').delete().eq('id', sessao.id); if (error) return toast('Não foi possível excluir.', true); closeSheet(); toast('Treino excluído.'); aoSalvar(); };
    r.querySelector('#t-modelo').onclick = async () => {
      lerTopo(); const nome = t.titulo || nomeTipo(t.tipo);
      const { data: novo, error } = await sb.from('nx_modelos_corrida').insert({ org_id: S.org.id, nome, tipo: t.tipo, estrutura: t.estrutura, criado_por: S.user.id }).select('*').single();
      if (error) return toast('Não foi possível salvar o modelo.', true);
      if (modelos && novo) modelos.push(novo);
      toast(`Modelo “${nome}” salvo na biblioteca.`);
    };
  });
}

/* ---------- detalhe do treino para o aluno ---------- */
function verTreinoPlanilha(p, perfil, feito) {
  const est = estruturaDe(p);
  const passoH = (s, extra = '') => { const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve; const pzt = paceZonaTxt(s.z, perfil); const e = estimaPasso(s, perfil); const alvoT = ` <em class="alvo-t">${e.tipo === 'dist' ? 'dist. est.' : 'tempo est.'} ≈ ${e.txt}</em>`; return `<div class="passo-v" style="--zc:${z.c}"><b>${PASSOS[s.k]}${extra}</b><span>${medTxt(s)} · ${z.n} · <strong>${pzt}</strong>${alvoT}</span></div>`; };
  openSheet(`<p class="eyebrow">${fmtDia(p.data)} · ${esc(nomeTipo(p.tipo))}</p><div class="h2" style="margin-top:4px">${esc(p.titulo || nomeTipo(p.tipo))}</div>
    ${sobreTreino(p.tipo) ? `<p class="small muted" style="margin-top:6px">${esc(sobreTreino(p.tipo))}</p>` : ''}
    <div class="card perf-card" style="margin-top:12px">${perfilHTML(est, perfil, true)}<p class="small" style="margin-top:8px">${(() => { const t = estimaTotal(est, perfil); return `<b>${t.soDist ? '' : '≈ '}${t.km}</b> · ${t.soTempo ? '' : '≈ '}${t.tempo}`; })()}</p></div>
    <div class="stack" style="margin-top:12px">${est.map((s) => s.k === 'rep' ? `<div class="serie-v"><b>Repita ${s.n} vezes:</b>${(s.passos || []).map((x) => passoH(x)).join('')}</div>` : passoH(s)).join('')}</div>
    ${p.descricao ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Observação do treinador</span><p style="margin-top:6px;white-space:pre-line">${esc(p.descricao)}</p></div>` : ''}
    ${feito ? `<a class="btn ghost block" href="#/corrida/${feito.id}" style="margin-top:16px">✓ Feito: ${fmtKm(feito.distancia_m, 1)} · ${fmtPace(paceDe(feito))}</a>` : `<button class="btn block" id="reg-agora" style="margin-top:16px">${I.plus} Registrar esta corrida</button>`}
    ${!feito && !S.staff && p.data >= hojeISO() && est.length ? `<button class="btn ghost block gar-btn" id="gar-env" style="margin-top:8px" hidden>${RELOGIO_IC} ${p.garmin_enviado_em ? 'Já está no seu Garmin ✓ · reenviar' : 'Enviar para o meu Garmin'}</button>` : ''}
    <button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`, (r) => {
    const b = r.querySelector('#reg-agora'); if (b) b.onclick = () => registrarCorrida(S.user.id, (id) => { location.hash = '#/corrida/' + id; });
    const g = r.querySelector('#gar-env');
    if (g) {
      sb.from('nx_integracoes').select('id').eq('user_id', S.user.id).eq('provedor', 'garmin').maybeSingle().then(({ data }) => { if (data) g.hidden = false; }).catch(() => {});
      g.onclick = async () => {
        g.disabled = true; g.textContent = 'Enviando…';
        try { const res = await enviarGarmin(S.user.id, [p], perfil); if (res.enviados) { p.garmin_enviado_em = new Date().toISOString(); g.innerHTML = `${RELOGIO_IC} No seu Garmin ✓`; toast('Treino enviado! Sincronize o relógio para ele aparecer.'); } else { g.disabled = false; g.textContent = 'Tentar de novo'; toast(res.sem_garmin ? 'Conecte o Garmin na aba Conexões.' : 'Não consegui enviar agora. Tente de novo.', true); } }
        catch (er) { g.disabled = false; g.textContent = 'Tentar de novo'; toast(er.message, true); }
      };
    }
  });
}

/* ================= PROVAS NA PLANILHA + POLIMENTO ================= */
const kmDaProva = (txt) => { const m = String(txt || '').replace(',', '.').match(/\d+(\.\d+)?/); const v = m ? +m[0] : 10; return /mi(lha)?s?\b/i.test(txt || '') ? v * 1.609 : v; };
const janelaPolimento = (km) => (km >= 30 ? 14 : km >= 15 ? 10 : 7);
const fatorPolimento = (diasAntes) => (diasAntes <= 2 ? 0.45 : diasAntes <= 7 ? 0.6 : 0.8);
const diasAte = (iso) => Math.round((dia(iso) - dia(hojeISO())) / 864e5);
function arredPasso(v, med) { if (med === 'km') return Math.max(1, Math.round(v * 2) / 2); if (med === 'm') return Math.max(100, Math.round(v / 100) * 100); return Math.max(5, Math.round(v / 5) * 5); }
function reduzirEstrutura(est, f) {
  return est.map((s) => s.k === 'rep' ? { ...s, n: Math.max(1, Math.round(s.n * f)) } : s.k === 'co' ? { ...s, v: arredPasso(s.v * f, s.med) } : clone(s));
}
function tempoAteProva(iso) {
  const d = diasAte(iso);
  if (d <= 0) return { big: d === 0 ? 'Hoje' : '–', un: d === 0 ? '' : '', txt: d === 0 ? 'é hoje!' : 'já passou' };
  if (d < 7) return { big: String(d), un: d === 1 ? 'dia' : 'dias', txt: d === 1 ? 'é amanhã' : `é nesta semana · faltam ${d} dias` };
  const s = Math.floor(d / 7), r = d % 7, sr = Math.round(d / 7);
  return { big: String(sr), un: sr === 1 ? 'semana' : 'semanas', txt: `faltam ${s} semana${s > 1 ? 's' : ''}${r ? ` e ${r} dia${r > 1 ? 's' : ''}` : ''} (${d} dias)` };
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pa-nav]'); if (!b) return;
  const car = b.closest('.prova-alertas').querySelector('.pa-car'); car.scrollBy({ left: +b.dataset.paNav * car.clientWidth, behavior: 'smooth' });
});
document.addEventListener('scroll', (e) => {
  const car = e.target; if (!car.classList || !car.classList.contains('pa-car')) return;
  const box = car.closest('.prova-alertas'); const n = car.children.length; const i = Math.round(car.scrollLeft / Math.max(1, car.clientWidth));
  const lab = box.querySelector('[data-pa-i]'); if (lab) lab.textContent = i + 1;
  box.querySelectorAll('[data-pa-nav]').forEach((x) => { x.disabled = x.dataset.paNav === '-1' ? i <= 0 : i >= n - 1; });
}, true);
function provasBannerHTML(provas, staff, semPol) {
  if (!provas.length) return '';
  const varias = provas.length > 1;
  return `<div class="prova-alertas">${varias ? `<div class="pa-nav"><span class="pa-cont"><b data-pa-i>1</b> de ${provas.length} provas</span><button type="button" class="pa-seta" data-pa-nav="-1" aria-label="Prova anterior" disabled>${I.back}</button><button type="button" class="pa-seta" data-pa-nav="1" aria-label="Próxima prova">${I.chev}</button></div>` : ''}<div class="pa-car">${provas.map((p, i) => {
    const t = tempoAteProva(p.data); const km = kmDaProva(p.distancia); const jan = janelaPolimento(km); const d = diasAte(p.data);
    const outra = provas[i + 1] && Math.round((dia(provas[i + 1].data) - dia(p.data)) / 864e5);
    const fase = !staff || semPol ? '' : d <= jan ? '<span class="pa-fase">Janela de polimento</span>' : `<span class="pa-fase off">Janela de polimento a partir de ${fmtCurto(isoDia(dia(p.data).getTime() - jan * 864e5) + 'T12:00:00')}</span>`;
    return `<div class="prova-alerta"><div class="pa-n"><b>${t.big}</b><span>${t.un}</span></div>
      <div class="grow" style="min-width:0"><span class="pa-ey">${icT(I.flag)}${staff ? 'Aluno tem prova' : 'Você tem prova'}</span><b class="pa-t">${esc(p.titulo)}</b>
        <span class="pa-s">${fmtDiaSem(p.data)}${p.distancia ? ' · ' + esc(p.distancia) : ''}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span>
        <span class="pa-s pa-falta">${t.txt}</span>
        ${staff && outra && outra <= 14 ? `<span class="pa-s" style="color:var(--prova);font-weight:700">Outra prova ${outra} dia${outra > 1 ? 's' : ''} depois</span>` : ''}${fase}
        ${staff && !semPol ? `<button class="btn sm pa-btn" data-pol="${p.id}">Ver sugestão de polimento</button>` : ''}</div></div>`;
  }).join('')}</div>
  ${staff ? `<p class="tiny dim" style="margin-top:2px">${semPol ? 'Sugestão de polimento desligada para este aluno (compete com frequência). <button class="link-btn tiny" data-semp="0">Ligar de novo</button>' : 'O polimento é só sugestão: nada muda na planilha sem você aplicar. <button class="link-btn tiny" data-semp="1">Não sugerir para este aluno</button>'}</p>` : ''}</div>`;
}
function semanaPolimentoPadrao(km) {
  const L = (n, k) => passo('co', n, 'km', k);
  const base = [
    [6, 'Rodagem leve', 'rodagem', [L(km >= 15 ? 7 : 5, 'leve')]],
    [4, 'Ritmo de prova curto', 'ritmo', [passo('aq', 2, 'km', 'leve'), serie(3, [passo('co', 1, 'km', km >= 15 ? 'maratona' : 'limiar'), passo('rc', 2, 'min', 'rec')]), passo('dq', 1, 'km', 'leve')]],
    [2, 'Soltura + acelerações', 'regenerativo', [passo('co', 20, 'min', 'leve'), serie(4, [passo('co', 100, 'm', 'tiros'), passo('rc', 1, 'min', 'rec')])]],
  ];
  if (km >= 15) base.unshift([9, 'Rodagem com ritmo de prova', 'ritmo', [L(3, 'leve'), L(4, 'maratona'), L(2, 'leve')]]);
  if (km >= 30) base.unshift([13, 'Último longão (reduzido)', 'longao', [L(16, 'leve')]], [11, '3 × 3 km ritmo de prova', 'ritmo', [passo('aq', 2, 'km', 'leve'), serie(3, [L(3, 'maratona'), passo('rc', 3, 'min', 'rec')]), passo('dq', 1, 'km', 'leve')]]);
  return base.map(([d, titulo, tipo, estrutura]) => ({ d, titulo, tipo, estrutura }));
}
async function polimentoSheet(alunoId, prova, perfil, aoAplicar) {
  const km = kmDaProva(prova.distancia); const jan = janelaPolimento(km);
  const hoje = hojeISO(); const ini = isoDia(dia(prova.data).getTime() - jan * 864e5); const fim = isoDia(dia(prova.data).getTime() - 864e5);
  const de = ini > hoje ? ini : hoje;
  const plano = de <= fim ? await buscarPlano(alunoId, de, fim) : [];
  const jaFeito = (p) => /polimento/i.test(p.titulo || '');
  const linhas = plano.map((p) => {
    const est = estruturaDe(p); const antes = resumoEstrutura(est, perfil).km;
    const da = Math.round((dia(prova.data) - dia(p.data)) / 864e5); const f = fatorPolimento(da);
    const nova = jaFeito(p) ? est : reduzirEstrutura(est, f); const depois = resumoEstrutura(nova, perfil).km;
    return { p, nova, antes, depois, da, f, ja: jaFeito(p) };
  });
  const totA = linhas.reduce((a, l) => a + l.antes, 0), totD = linhas.reduce((a, l) => a + (l.ja ? l.antes : l.depois), 0);
  const padrao = semanaPolimentoPadrao(km).filter((x) => isoDia(dia(prova.data).getTime() - x.d * 864e5) >= hoje);
  openSheet(`<p class="eyebrow">Sugestão de polimento · ${esc(prova.titulo)}</p><div class="h2" style="margin-top:4px">Semana${jan > 7 ? 's' : ''} mais leve${jan > 7 ? 's' : ''} antes da prova?</div><p class="small" style="margin-top:6px;color:var(--prova);font-weight:700">É só uma sugestão. Nada muda na planilha até você tocar em “Aplicar”.</p>
    <p class="small muted" style="margin-top:6px">Prova de ${f1(km)} km em ${fmtDiaSem(prova.data).toLowerCase()}. Sugestão: reduzir o <b>volume</b> nos ${jan} dias antes e manter a <b>intensidade</b> (os tiros e ritmos continuam no mesmo pace, só com menos repetições). Isso chega o aluno descansado sem perder o ritmo.</p>
    <div class="pol-regra"><span>8 a 14 dias antes</span><b>−20%</b><span>3 a 7 dias antes</span><b>−40%</b><span>1 e 2 dias antes</span><b>−55%</b></div>
    ${linhas.length ? `<div class="stack" style="margin-top:16px">${linhas.map((l) => `<div class="pol-l ${l.ja ? 'ja' : ''}"><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(l.p.titulo || nomeTipo(l.p.tipo))}</b><span class="small muted">${DIAS[dia(l.p.data).getDay()]} ${dia(l.p.data).getDate()} · ${l.da} dia${l.da > 1 ? 's' : ''} antes</span></div>${l.ja ? '<span class="tag ok">já ajustado</span>' : `<span class="pol-km"><s>${f1(l.antes)} km</s> → <b>${f1(l.depois)} km</b></span>`}</div>`).join('')}</div>
      <p class="small" style="margin-top:12px">Volume nesses dias: <b>${f1(totA)} km → ${f1(totD)} km</b></p>
      <label class="aceite" style="margin-top:12px"><input type="checkbox" id="pol-avisar" checked><span>Avisar o aluno que a planilha mudou</span></label>
      ${linhas.some((l) => !l.ja) ? '<button class="btn block" id="pol-ok" style="margin-top:12px">Aplicar polimento</button>' : '<p class="small muted" style="margin-top:12px">O polimento já está aplicado nesses treinos.</p>'}`
      : `<div class="card" style="margin-top:16px"><b>Ainda não há treinos nesses dias</b><p class="small muted" style="margin:4px 0 10px">Posso montar uma semana de polimento pronta para ${f1(km)} km. Depois é só ajustar arrastando.</p>
        ${padrao.length ? `<div class="stack">${padrao.map((x) => `<div class="pol-l"><div class="grow"><b>${esc(x.titulo)}</b><span class="small muted" style="display:block">${x.d} dias antes · ${f1(resumoEstrutura(x.estrutura, perfil).km)} km</span></div>${perfilHTML(x.estrutura, perfil)}</div>`).join('')}</div><button class="btn block" id="pol-criar" style="margin-top:12px">Montar semana de polimento</button>` : '<p class="small muted">A prova está muito próxima para montar treinos.</p>'}</div>`}
    <p class="tiny dim" style="margin-top:12px">Base: polimento com redução de volume de 40–60% e intensidade mantida (Bosquet e col., 2007; Mujika e Padilla, 2003).</p>`, (r) => {
    const ok = r.querySelector('#pol-ok');
    if (ok) ok.onclick = async () => {
      ok.disabled = true;
      for (const l of linhas.filter((x) => !x.ja)) {
        const rs = resumoEstrutura(l.nova, perfil);
        await sb.from('nx_plano_corrida').update({ estrutura: l.nova, titulo: `${l.p.titulo || nomeTipo(l.p.tipo)} · polimento`, distancia_km: Math.round(rs.km * 10) / 10, duracao_min: Math.round(rs.seg / 60) }).eq('id', l.p.id);
      }
      if (r.querySelector('#pol-avisar').checked) notificarAluno('planilha', alunoId);
      closeSheet(); toast('Polimento aplicado!'); aoAplicar();
    };
    const cr = r.querySelector('#pol-criar');
    if (cr) cr.onclick = async () => {
      cr.disabled = true;
      const novos = padrao.map((x) => { const rs = resumoEstrutura(x.estrutura, perfil); return { org_id: S.org.id, aluno_id: alunoId, data: isoDia(dia(prova.data).getTime() - x.d * 864e5), tipo: x.tipo, titulo: x.titulo + ' · polimento', estrutura: x.estrutura, distancia_km: Math.round(rs.km * 10) / 10, duracao_min: Math.round(rs.seg / 60), zona: null, criado_por: S.user.id }; });
      const { error } = await sb.from('nx_plano_corrida').insert(novos);
      if (error) { cr.disabled = false; return toast('Não foi possível montar.', true); }
      closeSheet(); toast('Semana de polimento montada!'); aoAplicar();
    };
  });
}

/* ---------- calendário da planilha ---------- */
// dias sem corrida na planilha: day off e dia de força por conta do aluno
const semCorrida = (p) => !!p && (p.tipo === 'folga' || p.tipo === 'forca');
const FORCA_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>';
const OFF_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" opacity=".5"><rect x="2" y="7.6" width="3.6" height="11" rx="1.7"/><rect x="2.6" y="14.8" width="14.6" height="3.8" rx="1.7"/><rect x="3.8" y="18.2" width="2.2" height="3.2" rx=".9"/><rect x="14.4" y="18.2" width="2.2" height="3.2" rx=".9"/></g><g fill="none" stroke="currentColor" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"><path d="M8.2 8.8 9.7 13.4h6.2l1.6 6.6h2.4"/><path d="M8.6 10.4l4.2 2"/></g><circle cx="8" cy="4.5" r="2.5" fill="currentColor"/></svg>'; // pessoa sentada na poltrona
function cartaoSessao(p, perfil, feito, staff) {
  if (p.tipo === 'forca') return `<div class="ses forca-l ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}"><div class="ses-t"><span class="off-ic fo">${FORCA_IC}</span><b>Força</b></div><span class="ses-m">${p.descricao ? esc(p.descricao) : 'por conta do aluno'}</span></div>`;
  if (p.tipo === 'folga') return `<div class="ses folga ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}"><div class="ses-t"><span class="off-ic">${OFF_IC}</span><b>Day off</b></div><span class="ses-m">Descanso</span></div>`;
  const hoje = isoDia(new Date());
  const st = feito ? 'feito' : p.data < hoje ? 'perdido' : 'pend';
  const est = estruturaDe(p); const rs = resumoEstrutura(est, perfil);
  return `<div class="ses ${st} ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}" ${staff ? 'draggable="false"' : ''}>
    ${feito ? `<div class="ses-conc"><i>${I.check}</i>Treino concluído</div>` : ''}
    <div class="ses-t"><b>${esc(p.titulo || nomeTipo(p.tipo))}</b>${!feito && st === 'perdido' ? '<span class="ses-x">!</span>' : ''}</div>
    ${perfilHTML(est, perfil)}
    ${feito ? `<div class="ses-res"><div><small>Distância</small><b>${fmtKm(feito.distancia_m, 1)}</b></div><div><small>Pace</small><b>${fmtPace(paceDe(feito)).replace('/km', '')}<em>/km</em></b></div></div>` : ''}
    <span class="ses-m">${feito ? 'Previsto ' : ''}${rs.km ? f1(rs.km) + ' km' : ''}${rs.seg ? ' · ' + fmtDur(rs.seg) : ''}</span></div>`;
}
// etiqueta de força (Nexos) no dia da semana de corrida: prevista, feita ou rascunho (só o treinador vê)
function forcaDiaHTML(fc, k, semana, staff) {
  if (!fc) return '';
  const i = dsemIdx(k), lib = fc.lib.includes(semana), feitos = fc.se.filter((x) => isoDia(x.iniciado_em) === k);
  const prev = (lib || staff) && !fc.off.includes(i) ? fc.tr.filter((t) => (t.dias || []).includes(i)) : [];
  const itens = [...prev.map((t) => ({ t: t.titulo, id: t.id, ok: feitos.some((x) => x.treino_id === t.id), rasc: !lib })), ...feitos.filter((x) => !prev.some((t) => t.id === x.treino_id)).map((x) => ({ t: x.treino_titulo || 'Treino', ok: true }))];
  const hoje = hojeISO();
  // para o aluno, a etiqueta abre o treino de força
  return itens.map((x) => { const tag = !staff && x.id ? 'a' : 'div'; return `<${tag} class="forca-tag ${x.ok ? 'ok' : k < hoje ? 'perdeu' : ''} ${x.rasc && !x.ok ? 'rasc' : ''}"${tag === 'a' ? ` href="#/treino/${x.id}" style="color:inherit;text-decoration:none"` : ''} title="Força · ${esc(x.t)}${x.ok ? ' (feito)' : x.rasc ? ' (semana de força ainda não liberada)' : ''}"><span class="ft-ic">${HALTER_S}</span><span class="ellip">${esc(x.t)}</span>${x.ok ? `<i class="ft-ok">${I.check}</i>` : ''}</${tag}>`; }).join('');
}
function calendarioHTML(ini, semanas, plano, ativs, perfil, staff, provas = [], m = null, fc = null, ciclo = null) {
  const corridas = ativs.filter(ehCorr), outras = ativs.filter((c) => !ehCorr(c));
  const hoje = isoDia(new Date()); let h = '';
  for (let w = 0; w < semanas; w++) {
    const s0 = new Date(ini); s0.setDate(ini.getDate() + w * 7);
    const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(s0); d.setDate(s0.getDate() + i); return d; });
    const doPlano = plano.filter((p) => p.data >= isoDia(dias[0]) && p.data <= isoDia(dias[6]));
    const km = doPlano.reduce((a, p) => a + resumoEstrutura(estruturaDe(p), perfil).km, 0);
    const feitoKm = corridas.filter((c) => { const k = isoDia(c.data); return k >= isoDia(dias[0]) && k <= isoDia(dias[6]); }).reduce((a, c) => a + c.distancia_m / 1000, 0);
    const prSem = provas.filter((p) => p.data >= isoDia(dias[0]) && p.data <= isoDia(dias[6]));
    h += `<div class="cal-sem ${prSem.length ? 'sem-prova' : ''}">${prSem.length ? `<div class="sem-prova-l">${icT(I.flag)}Semana da prova: ${prSem.map((p) => esc(p.titulo)).join(', ')}</div>` : ''}<div class="cal-sem-h"><b>${dias[0].getDate()}/${dias[0].getMonth() + 1} – ${dias[6].getDate()}/${dias[6].getMonth() + 1}</b><span>${km ? `previsto ${f1(km)} km` : 'sem treinos'}${feitoKm ? ` · feito ${f1(feitoKm)} km` : ''}</span></div>${staff && doPlano.length ? (() => { const nLib = doPlano.filter((p) => p.liberado !== false).length; const de = isoDia(dias[0]), ate = isoDia(dias[6]);
      return nLib === doPlano.length
        ? `<div class="lib-bar ok"><span>✓ Semana liberada: o aluno já vê estes treinos</span><button type="button" class="link-btn small" data-desliberar="${de}|${ate}">Cancelar liberação</button></div>${S.cache.garmOn ? (() => { const tr = doPlano.filter((p) => p.tipo !== 'folga' && estruturaDe(p).length && p.data >= hojeISO()); const env = tr.filter((p) => p.garmin_enviado_em).length; const err = tr.some((p) => p.garmin_erro); return tr.length ? `<div class="gar-bar ${env === tr.length ? 'ok' : err ? 'err' : ''}"><span>${RELOGIO_IC} ${env === tr.length ? 'No Garmin e no relógio do aluno ✓' : err ? 'Não consegui enviar ao Garmin' : `${tr.length - env} treino${tr.length - env > 1 ? 's' : ''} ainda não enviado${tr.length - env > 1 ? 's' : ''} ao Garmin`}</span><button type="button" class="link-btn small" data-garmin="${de}|${ate}">${env ? 'Reenviar' : 'Enviar ao Garmin'}</button></div>` : ''; })() : ''}`
        : `<div class="lib-bar"><span>${nLib ? `${doPlano.length - nLib} treino${doPlano.length - nLib > 1 ? 's' : ''} ainda não liberado${doPlano.length - nLib > 1 ? 's' : ''}` : 'Rascunho: o aluno ainda não vê esta semana'}</span><button type="button" class="btn sm lib-btn" data-liberar="${de}|${ate}">Liberar semana</button></div>`; })() : ''}<div class="cal-dias">`;
    dias.forEach((d) => {
      const k = isoDia(d); const itens = plano.filter((p) => p.data === k);
      const av = corridas.filter((c) => !c.plano_id && isoDia(c.data) === k);
      const ou = outras.filter((c) => isoDia(c.data) === k);
      const pr = provas.filter((p) => p.data === k);
      const fTag = forcaDiaHTML(fc, k, isoDia(dias[0]), staff);
      h += `<div class="cal-dia ${k === hoje ? 'hoje' : ''} ${k < hoje ? 'passado' : ''}" data-dia="${k}"><div class="cal-dia-h"><b>${DIAS[d.getDay()]}</b><span>${d.getDate()}</span>${cicloSeloHTML(ciclo, k)}${staff ? `<span class="disp-cal">${dispIcones(m, (d.getDay() + 6) % 7)}</span>` : ''}${staff ? `<button class="cal-add" data-novo="${k}" aria-label="Novo treino">${I.plus}</button>` : ''}</div><div class="cal-dia-c">
        ${fTag}
        ${pr.map((p) => `<a class="ses prova" href="${staff ? '#/eventos/equipe' : '#/eventos/minhas'}"><div class="ses-t"><b>${icT(I.flag)}${esc(p.titulo)}</b></div><span class="ses-m">${esc(p.distancia || 'Prova')}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span></a>`).join('')}
        ${itens.map((p) => cartaoSessao(p, perfil, corridas.find((c) => c.plano_id === p.id), staff)).join('')}
        ${av.map((c) => `<a class="ses feito avulsa" href="#/corrida/${c.id}"><div class="ses-conc"><i>${I.check}</i>Treino extra</div><div class="ses-t"><b>${c.tipo === 'caminhada' ? 'Caminhada' : 'Corrida avulsa'}</b></div><div class="ses-res"><div><small>Distância</small><b>${fmtKm(c.distancia_m, 1)}</b></div><div><small>Pace</small><b>${fmtPace(paceDe(c)).replace('/km', '')}<em>/km</em></b></div></div></a>`).join('')}
        ${ou.map((c) => `<a class="ses feito ${c.tipo === 'forca' ? 'ativ-fo' : 'ativ-ou'}" href="#/corrida/${c.id}"><div class="ses-conc ${c.tipo === 'forca' ? 'fo' : ''}"><i>${I.check}</i>Do relógio</div><div class="ses-t"><b>${esc(nomeAtiv(c))}</b></div><div class="ses-res"><div><small>${comDist(c) ? 'Distância' : 'Duração'}</small><b>${comDist(c) ? fmtKm(c.distancia_m, 1) : fmtDur(c.duracao_s)}</b></div>${c.fc_media ? `<div><small>FC média</small><b>${c.fc_media}<em>bpm</em></b></div>` : ''}</div></a>`).join('')}
        ${!itens.length && !av.length && !pr.length && !ou.length && !fTag ? `<span class="cal-vazio">${staff ? 'solte um treino aqui' : 'descanso'}</span>` : ''}</div></div>`;
    });
    h += '</div></div>';
  }
  return h;
}

/* ---------- painel de corrida (aluno e treinador) ---------- */
async function viewCorridaPainel(alunoId, box, staff, m, subs, silencioso) {
  // silencioso: atualiza sem piscar a tela nem perder a rolagem (depois de arrastar, salvar etc.)
  const sv = silencioso && box.isConnected ? { y: scrollY, h: box.offsetHeight, bl: (box.querySelector('.biblio-l') || {}).scrollLeft || 0 } : null;
  if (sv) box.style.minHeight = sv.h + 'px'; else box.innerHTML = esqBloco('cal');
  if (!m || m.user_id !== alunoId) { const { data } = await sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(); m = data || {}; }
  const st = S.cache.semCorr || (S.cache.semCorr = { off: 0, sub: 'planilha' });
  if (st.aluno !== alunoId) { st.aluno = alunoId; st.off = 0; st.sub = 'planilha'; st.todas = false; }
  const SUBS = subs || ['planilha', 'evolucao', 'corridas', 'ritmos'];
  if (!SUBS.includes(st.sub)) st.sub = SUBS[0];
  const semanas = innerWidth >= 900 ? 2 : 1;
  const ini = inicioSemana(); ini.setDate(ini.getDate() + st.off * 7);
  const fim = new Date(ini); fim.setDate(ini.getDate() + semanas * 7 - 1);
  const comForca = faz('musculacao', m);
  const comCiclo = (staff ? m.sexo : S.me.sexo) === 'F';
  const [ativsTodas, plano, integs, modelosOrg, provas, provasProx, forcaTr, forcaSe, forcaLib, ciclo] = await Promise.all([
    buscarCorridas(alunoId), buscarPlano(alunoId, isoDia(ini), isoDia(fim)),
    sb.from('nx_integracoes').select('provedor,athlete_id,ultima_sync,erro,conectado_em').eq('user_id', alunoId).in('provedor', ['intervals', 'garmin']).then((r) => r.data || []).catch(() => []),
    staff ? sb.from('nx_modelos_corrida').select('*').eq('org_id', S.org.id).order('criado_em').then((r) => r.data || []).catch(() => []) : Promise.resolve([]),
    sb.from('nx_participacoes').select('*').eq('aluno_id', alunoId).gte('data', isoDia(ini)).lte('data', isoDia(fim)).then((r) => r.data || []).catch(() => []),
    sb.from('nx_participacoes').select('*').eq('aluno_id', alunoId).gte('data', hojeISO()).order('data').limit(3).then((r) => r.data || []).catch(() => []),
    // força da Nexos no mesmo dia (etiqueta na semana de corrida)
    comForca ? sb.from('nx_treinos').select('id,titulo,dias').eq('aluno_id', alunoId).eq('ativo', true).then((r) => r.data || [], () => []) : Promise.resolve([]),
    comForca ? sb.from('nx_sessoes').select('id,treino_id,treino_titulo,iniciado_em').eq('aluno_id', alunoId).not('finalizado_em', 'is', null).gte('iniciado_em', isoDia(ini)).lte('iniciado_em', isoDia(fim) + 'T23:59:59').then((r) => r.data || [], () => []) : Promise.resolve([]),
    comForca ? sb.from('nx_forca_semanas').select('semana').eq('aluno_id', alunoId).gte('semana', isoDia(ini)).lte('semana', isoDia(fim)).then((r) => (r.data || []).map((x) => x.semana), () => []) : Promise.resolve([]),
    comCiclo ? buscarCiclo(alunoId).catch(() => null) : Promise.resolve(null), // fase do ciclo em cada dia da planilha
  ]);
  const forcaCal = comForca ? { tr: forcaTr, se: forcaSe, lib: forcaLib, off: dispDe(m).off_forca || [] } : null;
  const corridas = ativsTodas.filter(ehCorr); // força, pedal etc. do relógio aparecem na planilha e na lista, mas não entram nos km
  const integ = integs.find((x) => x.provedor === 'intervals') || null, garm = integs.find((x) => x.provedor === 'garmin') || null;
  S.cache.garmOn = !!garm;
  const perfil = perfilCorrida(m);
  const recarregar = () => viewCorridaPainel(alunoId, box, staff, m, subs, true);
  const sub = st.sub;
  const subTabs = `<div class="subtabs">${[['planilha', 'Planilha'], ['evolucao', 'Evolução'], ['corridas', `Atividades${ativsTodas.length ? ' (' + ativsTodas.length + ')' : ''}`], ['ritmos', 'Ritmos e zonas']].filter(([k]) => SUBS.includes(k)).map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-sub="${k}">${l}</button>`).join('')}</div>`;
  const rotulo = st.off === 0 ? (semanas > 1 ? 'Esta semana e a próxima' : 'Esta semana') : st.off === 1 ? 'Próxima semana' : st.off === -1 ? 'Semana passada' : `${ini.getDate()}/${ini.getMonth() + 1} a ${fim.getDate()}/${fim.getMonth() + 1}`;
  let corpo = '';
  if (sub === 'planilha') {
    const modelos = [...MODELOS_PADRAO, ...modelosOrg];
    corpo = `${provasBannerHTML(provasProx, staff, !!(m.corrida && m.corrida.sem_polimento))}${staff ? cargaHTML3(cargaCorrida(corridas, perfil)).replace('class="card carga3"', 'class="card carga3 compacto"') : ''}
      <div class="pl-top"><div class="row" style="gap:6px"><button class="icon-btn sm" id="sem-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="sem-h">${rotulo}</button><button class="icon-btn sm" id="sem-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>
        ${staff ? (() => { const clip = store.get('nx_clip_corr', null); return `<div class="pl-tools">
          <div class="tool-grp" role="group" aria-label="${semanas > 1 ? 'Semanas' : 'Semana'}"><button type="button" id="copiar-sem" ${plano.length ? '' : 'disabled'} title="Copiar os treinos ${semanas > 1 ? 'destas semanas' : 'desta semana'}">${I.copy}<span>Copiar</span></button><button type="button" id="colar-sem" class="${clip ? 'pronto' : ''}" ${clip ? '' : 'disabled'} title="${clip ? esc('Colar: ' + clip.itens.length + ' treinos de ' + clip.origem) : 'Copie uma semana primeiro'}">${I.paste}<span>Colar</span>${clip ? '<i class="tool-dot"></i>' : ''}</button></div>
          <button type="button" class="tool-ic" id="avisar" title="Avisar aluno da planilha" aria-label="Avisar aluno">${I.bell}</button><button type="button" class="tool-ic" id="guia-plan" title="Como usar a planilha" aria-label="Como usar a planilha">?</button></div>`; })() : `<button class="btn sm" id="reg-c">${I.plus} Registrar corrida</button>`}</div>
      <div class="${staff ? 'pl-grid' : ''}">
        ${staff ? `<aside class="biblio ${store.get('nx_bib_aberta', false) ? 'aberta' : ''}"><div class="biblio-h"><b>Biblioteca</b><span class="tiny dim">arraste para um dia</span><button type="button" class="bib-tog" id="bib-tog" aria-label="Mostrar ou esconder a biblioteca"><span class="bt-abrir">Abrir</span><span class="bt-fechar">Fechar</span>${I.chev}</button></div><p class="bib-dica">Toque em <b>+</b> no dia para escolher um treino, ou abra a biblioteca para arrastar.</p>${chipsNivHTML(store.get('nx_bib_niv', 'todos'), 'bib-niv')}<div class="biblio-l">${modelos.slice().sort((x, y) => ordemCat(x) - ordemCat(y)).map((md) => md.tipo === 'folga' ? `<div class="mod mod-off" data-mod="${md.id}"><div class="off-faixa">${OFF_IC}</div><b>Day off</b><span>Descanso</span></div>` : md.tipo === 'forca' ? `<div class="mod mod-forca" data-mod="${md.id}"><div class="off-faixa">${FORCA_IC}</div><b>Força</b><span>por conta do aluno</span></div>` : `<div class="mod" data-mod="${md.id}" ${passaNiv(md, store.get('nx_bib_niv', 'todos')) ? '' : 'hidden'}>${perfilHTML(md.estrutura, perfil)}<b>${esc(md.nome)}</b><span>${f1(resumoEstrutura(md.estrutura, perfil).km)} km · ${md.org_id ? 'meu modelo' : esc(((CATS_CORR.find((c) => c[0] === md.cat) || [])[1]) || '')}</span></div>`).join('')}</div></aside>` : ''}
        <div class="cal">${cicloFaseDia(ciclo, hojeISO()) ? `<div class="cic-leg">${Object.entries(FASES_CICLO).map(([k, [n, cor]]) => `<span><i class="cic-selo ${k === 'menstrual' ? 'gota' : ''}" style="--cf:${cor}">${k === 'menstrual' ? '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/></svg>' : ''}</i>${n.replace('Fase ', '')}</span>`).join('')}<span class="dim">vazado = previsão</span></div>` : ''}${calendarioHTML(ini, semanas, plano, ativsTodas, perfil, staff, provas, m, forcaCal, ciclo)}</div>
      </div>
      ${staff ? '<div class="lixeira" id="lixeira">Solte aqui para excluir</div><p class="tiny dim" style="margin-top:12px">Dica: arraste os modelos da biblioteca para os dias. Arraste um treino de um dia para outro para mudar a data (segure Ctrl ou Alt no computador para copiar). Toque no treino para editar os passos.</p>' : ''}
      ${!staff && !plano.length ? '<p class="small muted" style="margin-top:12px">Quando o seu treinador montar a planilha de corrida, os treinos aparecem aqui.</p>' : ''}`;
  } else if (sub === 'evolucao') {
    const c3 = cargaHTML3(cargaCorrida(corridas, perfil));
    const sem = Array(12).fill(0); const base = inicioSemana();
    corridas.forEach((c) => { const w = Math.floor((base - inicioSemana(new Date(c.data))) / (7 * 864e5)); if (w >= 0 && w < 12) sem[11 - w] += c.distancia_m / 1000; });
    const maxS = Math.max(10, ...sem);
    const c30 = corridas.filter((c) => diasDesde(c.data) < 30); const km30 = c30.reduce((a, c) => a + c.distancia_m, 0);
    const paceMed = c30.length ? c30.reduce((a, c) => a + c.duracao_s, 0) / (km30 / 1000) : null;
    const longa = corridas.reduce((a, c) => (!a || c.distancia_m > a.distancia_m ? c : a), null);
    const tend = corridas.filter((c) => c.distancia_m >= 3000 && c.tipo !== 'caminhada').slice(0, 16).reverse().map((c) => ({ x: fmtCurto(c.data), y: +(paceDe(c) / 60).toFixed(2) }));
    corpo = c3 + `${staff ? `<div id="pv-evo" style="margin-top:${c3 ? 12 : 0}px"></div>` : ''}<div class="stats" style="margin-top:${c3 || staff ? 12 : 0}px"><div class="stat"><b>${f1(km30 / 1000)}</b><span>km em 30 dias</span></div><div class="stat"><b>${c30.length}</b><span>corridas em 30 dias</span></div><div class="stat"><b>${paceMed ? fmtPace(paceMed).replace('/km', '') : '–'}</b><span>pace médio (30 dias)</span></div></div>
      <div class="grid2 g-charts">
        <div class="card" style="padding:14px"><div class="row between"><span class="small muted" style="font-weight:700">Km por semana</span><span class="tiny dim">12 semanas</span></div><div style="display:flex;gap:5px;margin-top:12px;align-items:flex-end;height:110px">${sem.map((v, i) => `<div title="${f1(v)} km" style="flex:1;height:${(v / maxS) * 100}%;min-height:${v ? 6 : 2}px;border-radius:5px;background:${i === 11 ? 'linear-gradient(180deg,var(--acc),var(--acc2))' : 'var(--s3)'}"></div>`).join('')}</div><div class="row between tiny dim" style="margin-top:6px"><span>12 semanas atrás</span><span>esta semana: ${f1(sem[11])} km</span></div></div>
        ${tend.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">Pace médio por corrida · menor é melhor</span>${grafico(tend, { fmt: (v) => fmtPace(v * 60).replace('/km', '') })}</div>` : ''}
      </div>
      ${longa ? `<p class="small muted" style="margin-top:12px">Corrida mais longa: <b style="color:var(--ink)">${fmtKm(longa.distancia_m, 1)}</b> em ${fmtDia(longa.data)}</p>` : ''}
      ${!corridas.length ? '<div class="empty" style="margin-top:12px"><div class="h3">Sem corridas ainda</div><p class="small">A evolução aparece conforme as corridas forem registradas.</p></div>' : ''}`;
  } else if (sub === 'corridas') {
    corpo = `${staff ? '' : `<button class="btn sm" id="reg-c">${I.plus} Registrar corrida</button>`}
      ${ativsTodas.length ? `<div class="stack" style="margin-top:12px">${ativsTodas.slice(0, st.todas ? 300 : 12).map((c) => `<a class="card tap corr-item" href="#/corrida/${c.id}"><div class="hist-date"><b>${new Date(c.data).getDate()}</b><span>${MESES[new Date(c.data).getMonth()]}</span></div><div class="grow"><div class="row" style="gap:8px">${staff && !c.visto_treinador ? '<i class="alert-dot"></i>' : ''}${ehCorr(c) ? `<b>${fmtKm(c.distancia_m, 1)}</b><span class="muted">· ${fmtDur(c.duracao_s)} · ${fmtPace(paceDe(c))}</span>` : `<b>${esc(nomeAtiv(c))}</b><span class="muted">· ${resumoAtiv(c)}</span>`}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${c.rpe != null ? `<span class="rpe" style="background:${rpeCor(c.rpe)}">Esforço ${c.rpe}</span>` : ''}${c.fc_media ? `<span class="tag">${c.fc_media} bpm</span>` : ''}${c.dor ? '<span class="tag warn">dor</span>' : ''}${c.plano_id ? '<span class="tag ok">da planilha</span>' : ''}<span class="tag">${c.fonte === 'arquivo' ? 'relógio' : c.fonte === 'intervals' ? 'Intervals' : c.fonte === 'garmin' ? 'Garmin' : 'digitada'}</span></div></div>${I.chev}</a>`).join('')}</div>${ativsTodas.length > 12 && !st.todas ? `<button class="btn ghost block sm" id="ver-todas" style="margin-top:12px">Ver todas as ${corridas.length} corridas</button>` : ''}`
        : `<div class="empty" style="margin-top:12px"><div class="h3">Nenhuma corrida registrada</div><p class="small">${staff ? 'As corridas do aluno aparecem aqui.' : 'Depois de correr, toque em “Registrar corrida”. Dá para enviar o arquivo do relógio.'}</p></div>`}
      ${staff ? `<p class="small muted" style="margin-top:16px">${I.watch.replace('<svg', '<svg class="rel-ic"')} ${garm ? 'Garmin conectado: as corridas chegam sozinhas e os treinos liberados vão para o relógio.' : integ ? 'Relógio conectado pelo Intervals.icu.' : 'O aluno ainda não conectou um relógio (ele faz isso na aba Conexões).'}</p>` : `<a class="list-item" href="#/conexoes" style="margin-top:16px">${I.watch}<div class="grow"><b>${garm || integ ? 'Relógio conectado ✓' : 'Conectar o seu relógio'}</b><div class="small muted">${garm || integ ? 'Gerencie na aba Conexões' : 'Garmin, Coros, Polar e outros: as corridas chegam sozinhas'}</div></div>${I.chev}</a>`}`;
  } else {
    const ZT = [['rec', 'Z1 · Recuperação (trote)'], ...ZONAS_PACE];
    const faixaDe = (k) => (perfil.paces && perfil.paces[k]) || (k === 'rec' && perfil.paces && perfil.paces.leve ? [Math.round(perfil.paces.leve[1] * 1.08), Math.round(perfil.paces.leve[1] * 1.16)] : [ZONAS_INFO[k].pd - 10, ZONAS_INFO[k].pd + 10]);
    const mmss = (sg) => { const v = Math.round(sg); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
    const tileZ = ([k, l]) => staff
      ? `<div class="pz-ed" style="border-left:4px solid ${ZONAS_INFO[k].c}"><span>${l}</span><div class="pz-in"><input class="input mono" data-pz="${k}" data-i="0" data-mask="pace" value="${mmss(faixaDe(k)[0])}" inputmode="numeric" aria-label="${l} de"><i>–</i><input class="input mono" data-pz="${k}" data-i="1" data-mask="pace" value="${mmss(faixaDe(k)[1])}" inputmode="numeric" aria-label="${l} até"><em>/km</em></div></div>`
      : `<div style="border-left:4px solid ${ZONAS_INFO[k].c}"><span>${l}</span><b>${paceZonaTxt(k, perfil)}</b></div>`;
    corpo = `${perfil.paces || staff ? `<div class="card"><div class="row between" style="gap:8px;flex-wrap:wrap"><span class="small muted">${perfil.vdot ? `Base: ${String(perfil.teste_km).replace('.', ',')} km em ${fmtDurLongo(perfil.teste_seg)}${perfil.teste_data ? ' · ' + fmtDia(perfil.teste_data) : ''}` : 'Sem teste cadastrado'}</span><span class="row" style="gap:6px">${perfil.manual ? '<span class="tag warn">ajustado pelo treinador</span>' : perfil.vdot ? '<span class="tag">automático</span>' : ''}${perfil.vdot ? `<span class="tag acc">VDOT ${f1(perfil.vdot)}</span>` : ''}</span></div>
        ${staff ? '<p class="tiny dim" style="margin-top:8px">Edite o pace de cada zona (minutos:segundos por km) e toque em “Salvar zonas”. É o que o aluno vê nos treinos.</p>' : ''}
        <div class="paces">${ZT.map(tileZ).join('')}</div>
        ${staff ? `<div class="${perfil.manual ? 'grid2' : ''}" style="margin-top:12px"><button class="btn block" id="pz-salvar">${I.check} Salvar zonas</button>${perfil.manual ? '<button class="btn ghost" id="pz-auto">Voltar ao automático</button>' : ''}</div>` : ''}
        ${perfil.vdot ? `<span class="small muted" style="display:block;margin-top:14px;font-weight:700">Previsão de provas</span>
        <div class="prev-prova">${[[5000, '5 km'], [10000, '10 km'], [21097, '21 km'], [42195, '42 km']].map(([d, l]) => `<div><span>${l}</span><b>${fmtDurLongo(prever(perfil.teste_km * 1000, perfil.teste_seg, d))}</b></div>`).join('')}</div>
        <p class="tiny dim" style="margin-top:8px">Paces automáticos pelo VDOT de Jack Daniels; previsões pela fórmula de Riegel. São estimativas para provas no plano e com treino específico.</p>` : ''}</div>`
      : `<div class="empty"><div class="h3">Ritmos ainda não calculados</div><p class="small">Seu treinador vai cadastrar um teste para calcular os seus paces.</p></div>`}
      ${staff ? `<button class="btn ${perfil.paces ? 'ghost' : ''} sm" id="ed-perfil" style="margin-top:12px">${perfil.paces ? 'Atualizar teste' : 'Cadastrar teste'}</button>` : ''}
      ${perfil.fcMax ? `<div class="card" style="margin-top:12px"><span class="small muted">Zonas de FC · FC máx ${Math.round(perfil.fcMax)} bpm${perfil.fc_max ? ' (medida)' : ' (estimada)'}${perfil.fcRep ? ` · repouso ${perfil.fcRep}` : ''}</span><div class="zonas" style="margin-top:12px">${zonasFC(perfil.fcMax, perfil.fcRep).map((z, i) => `<div class="zona z${i + 1}"><b>${z.z}</b><span>${z.n}</span><em>${z.de}–${z.ate}</em></div>`).join('')}</div></div>` : ''}`;
  }
  box.innerHTML = (SUBS.length > 1 ? subTabs : '') + `<div class="sub-corpo">${corpo}</div>`;
  if (sv) { const bl = box.querySelector('.biblio-l'); if (bl) bl.scrollLeft = sv.bl; scrollTo(scrollX, sv.y); requestAnimationFrame(() => { box.style.minHeight = ''; }); }
  if (SUBS.length > 1) box.querySelector('.subtabs').onclick = (e) => { const b = e.target.closest('[data-sub]'); if (b) { st.sub = b.dataset.sub; recarregar(); } };
  const q = (s) => box.querySelector(s);
  if (q('#pv-evo')) previsoesCard(q('#pv-evo'), corridas, perfil);
  if (q('#reg-c')) q('#reg-c').onclick = () => registrarCorrida(alunoId, (id) => { location.hash = '#/corrida/' + id; });
  if (q('#ver-todas')) q('#ver-todas').onclick = () => { st.todas = true; recarregar(); };
  if (q('#pz-salvar')) q('#pz-salvar').onclick = async () => {
    const lerS = (v) => { const m2 = String(v || '').trim().match(/^(\d{1,2})[:.,](\d{1,2})$/) || String(v || '').trim().match(/^(\d{1,2})$/); if (!m2) return null; const sg = (+m2[1]) * 60 + (+(m2[2] || 0)); return m2[2] && +m2[2] > 59 ? null : sg; };
    const man = {}; let erro = '';
    [['rec'], ...ZONAS_PACE].forEach(([k]) => { const a2 = lerS(box.querySelector(`[data-pz="${k}"][data-i="0"]`).value), b2 = lerS(box.querySelector(`[data-pz="${k}"][data-i="1"]`).value); if (a2 == null || b2 == null || a2 < 150 || b2 > 1200) erro = ZONAS_INFO[k].z; else man[k] = [Math.min(a2, b2), Math.max(a2, b2)]; });
    if (erro) return toast(`Confira o pace da ${erro} (use minutos:segundos, ex.: 5:30).`, true);
    const corrida = { ...(m.corrida || {}), paces_manual: man };
    const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
    if (error) return toast('Não foi possível salvar.', true);
    m.corrida = corrida; toast('Zonas salvas! O aluno já vê esses paces.'); recarregar();
  };
  if (q('#pz-auto')) q('#pz-auto').onclick = async () => {
    const corrida = { ...(m.corrida || {}) }; delete corrida.paces_manual;
    const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
    if (error) return toast('Não foi possível salvar.', true);
    m.corrida = corrida; toast('Zonas voltaram ao cálculo automático.'); recarregar();
  };
  if (q('#ed-perfil')) q('#ed-perfil').onclick = () => formPerfilCorrida(m, async () => { const { data } = await sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(); m = data || m; recarregar(); });
  if (q('#intervals-box')) bindIntervals(q('#intervals-box'), integ, staff, alunoId, recarregar);
  if (q('#garmin-box')) bindGarmin(q('#garmin-box'), recarregar);
  // sincronização automática com o Garmin: todo treino liberado que ainda não está no relógio vai sozinho
  if (garm) sincronizarGarmin(alunoId, plano, perfil, staff).then((n) => { if (n) recarregar(); });
  if (sub === 'planilha') {
    box.querySelectorAll('[data-pol]').forEach((b) => b.onclick = () => polimentoSheet(alunoId, provasProx.find((x) => x.id === b.dataset.pol), perfil, recarregar));
    box.querySelectorAll('[data-semp]').forEach((b) => b.onclick = async () => {
      const corrida = { ...(m.corrida || {}), sem_polimento: b.dataset.semp === '1' };
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.corrida = corrida; toast(corrida.sem_polimento ? 'Pronto: o app não sugere polimento para este aluno.' : 'Sugestão de polimento ligada.'); recarregar();
    });
    q('#sem-a').onclick = () => { st.off -= semanas; recarregar(); };
    q('#sem-p').onclick = () => { st.off += semanas; recarregar(); };
    q('#sem-h').onclick = () => { st.off = 0; recarregar(); };
    const modelos = [...MODELOS_PADRAO, ...modelosOrg];
    const bt = q('#bib-tog'); if (bt) bt.onclick = () => { const ab = bt.closest('.biblio').classList.toggle('aberta'); store.set('nx_bib_aberta', ab); };
    const bn = q('#bib-niv'); if (bn) bn.onclick = (e) => { const b = e.target.closest('[data-niv]'); if (!b) return; store.set('nx_bib_niv', b.dataset.niv); bn.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b)); box.querySelectorAll('.biblio-l .mod').forEach((el) => { const md = modelos.find((x) => x.id === el.dataset.mod); el.hidden = !!md && md.tipo !== 'folga' && !passaNiv(md, b.dataset.niv); }); };
    const cal = q('.cal');
    cal.addEventListener('click', async (e) => {
      const lb = e.target.closest('[data-liberar],[data-desliberar]');
      if (lb) {
        const lib = !!lb.dataset.liberar; const [de, ate] = (lb.dataset.liberar || lb.dataset.desliberar).split('|'); lb.disabled = true;
        if (!lib && !confirm('Cancelar a liberação? O aluno deixa de ver os treinos desta semana.')) { lb.disabled = false; return; }
        const { error } = await sb.from('nx_plano_corrida').update({ liberado: lib }).eq('org_id', S.org.id).eq('aluno_id', alunoId).gte('data', de).lte('data', ate);
        if (error) { lb.disabled = false; return toast('Não foi possível salvar.', true); }
        const daSemana = plano.filter((p) => p.data >= de && p.data <= ate).map((p) => ({ ...p, liberado: lib }));
        if (lib) {
          notificarAluno('planilha', alunoId); toast('Semana liberada! O aluno foi avisado.');
          if (S.cache.garmOn) { const k = 'garSync:' + alunoId; S.cache.garSync = S.cache.garSync || {}; S.cache.garSync[k] = (S.cache.garSync[k] || []).filter((id) => !daSemana.some((p) => p.id === id)); sincronizarGarmin(alunoId, daSemana, perfil, true).then((n) => { if (n) recarregar(); }); }
        } else {
          toast('Liberação cancelada. A semana voltou a ser rascunho.');
          const noG = daSemana.filter((p) => p.garmin_workout_id); if (noG.length) chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: noG.map((p) => ({ plano_id: p.id })) }).catch(() => {});
        }
        return recarregar();
      }
      const gb = e.target.closest('[data-garmin]');
      if (gb) {
        const [de, ate] = gb.dataset.garmin.split('|'); gb.disabled = true; gb.textContent = 'Enviando…';
        try { const r = await enviarGarmin(alunoId, plano.filter((p) => p.data >= de && p.data <= ate), perfil); toast(r.sem_garmin ? 'O aluno não está com o Garmin conectado.' : r.enviados ? `${r.enviados} treino${r.enviados > 1 ? 's' : ''} no Garmin do aluno ⌚` : r.erros ? 'Não consegui enviar ao Garmin. Tente de novo em instantes.' : 'Nada para enviar nesta semana.', !r.enviados); }
        catch (er) { toast(er.message, true); }
        return recarregar();
      }
      const nv = e.target.closest('[data-novo]'), se = e.target.closest('[data-ses]');
      if (nv) return escolherModelo(nv.dataset.novo);
      if (se) { const p = plano.find((x) => x.id === se.dataset.ses); if (!p) return;
        if (p.tipo === 'forca') return staff ? openSheet(`<p class="eyebrow">${fmtDia(p.data)}</p><div class="h2" style="margin-top:4px">Dia de força</div><p class="small muted" style="margin-top:6px">O aluno faz força por conta própria e não tem corrida nesse dia. Ele vê “Hoje é dia de força” na tela inicial.</p><label class="field" style="margin-top:14px"><span>Recado para o aluno (opcional)</span><input class="input" id="fo-obs" maxlength="120" placeholder="Ex.: academia às 18h, foco em pernas" value="${esc(p.descricao || '')}"></label><button class="btn block" id="fo-ok" style="margin-top:12px">Salvar</button><button class="btn ghost danger block" id="fo-del" style="margin-top:8px">Tirar o dia de força</button>`, (r) => { r.querySelector('#fo-ok').onclick = async () => { const { error } = await sb.from('nx_plano_corrida').update({ descricao: r.querySelector('#fo-obs').value.trim() || null }).eq('id', p.id); closeSheet(); error ? toast('Não foi possível salvar.', true) : (toast('Dia de força salvo.'), recarregar()); }; r.querySelector('#fo-del').onclick = async () => { await sb.from('nx_plano_corrida').delete().eq('id', p.id); closeSheet(); toast('Dia de força removido.'); recarregar(); }; }) : toast(p.descricao ? `Dia de força: ${p.descricao}` : 'Dia de força: treino de força por sua conta, sem corrida.');
        if (p.tipo === 'folga') return staff ? openSheet(`<p class="eyebrow">${fmtDia(p.data)}</p><div class="h2" style="margin-top:4px">Day off</div><p class="small muted" style="margin-top:6px">Dia de descanso de corrida. O aluno vê “Hoje é day off” na tela inicial.</p><button class="btn danger block" id="off-del" style="margin-top:16px">Tirar o day off</button>`, (r) => { r.querySelector('#off-del').onclick = async () => { await sb.from('nx_plano_corrida').delete().eq('id', p.id); closeSheet(); toast('Day off removido.'); recarregar(); }; }) : toast('Day off: dia de descanso.');
        staff ? editorTreino({ alunoId, perfil, sessao: p, aoSalvar: recarregar, modelos: modelosOrg, feito: corridas.find((c) => c.plano_id === p.id) }) : verTreinoPlanilha(p, perfil, corridas.find((c) => c.plano_id === p.id)); }
    });
    const escolherModelo = (data) => openSheet(`<p class="eyebrow">${fmtDia(data)}</p><div class="h2" style="margin-top:4px">Escolha um ponto de partida</div><div style="margin-top:12px">${chipsNivHTML(store.get('nx_bib_niv', 'todos'), 'pick-niv')}</div><div class="sheet-mods" id="pick-l"></div>`, (r) => {
      const desenhaPick = () => { const sel = store.get('nx_bib_niv', 'todos'); const lst = modelos.filter((md) => !semCorrida(md) && passaNiv(md, sel));
        const grupos = CATS_CORR.filter((c) => c[0] !== 'off').map(([k, l]) => [l, lst.filter((md) => (md.cat || (md.org_id ? '' : 'base')) === k)]).filter(([, l2]) => l2.length);
        const meus = lst.filter((md) => md.org_id);
        const card = (md) => `<button class="mod" data-pick="${md.id}">${perfilHTML(md.estrutura, perfil)}<b>${esc(md.nome)}</b><span>${f1(resumoEstrutura(md.estrutura, perfil).km)} km</span></button>`;
        r.querySelector('#pick-l').innerHTML = `<div class="pick-g"><div class="biblio-l"><button class="mod mod-off" data-pick="p-off"><div class="off-faixa">${OFF_IC}</div><b>Day off</b><span>Descanso</span></button><button class="mod mod-forca" data-pick="p-forca"><div class="off-faixa">${FORCA_IC}</div><b>Força</b><span>por conta do aluno</span></button><button class="mod" data-pick=""><div class="perfil-int vazio"></div><b>Em branco</b><span>montar do zero</span></button></div></div>`
          + (meus.length ? `<p class="mes-rot">Meus modelos</p><div class="biblio-l">${meus.map(card).join('')}</div>` : '')
          + grupos.map(([l, l2]) => `<p class="mes-rot">${l}</p><div class="biblio-l">${l2.map(card).join('')}</div>`).join('');
      };
      desenhaPick();
      r.querySelector('#pick-niv').onclick = (e) => { const b = e.target.closest('[data-niv]'); if (!b) return; store.set('nx_bib_niv', b.dataset.niv); r.querySelectorAll('#pick-niv .chip').forEach((x) => x.classList.toggle('on', x === b)); desenhaPick(); };
      r.querySelector('.sheet-mods').onclick = async (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; const md = modelos.find((x) => x.id === b.dataset.pick);
        if (md && semCorrida(md)) { const { error } = await sb.from('nx_plano_corrida').insert({ org_id: S.org.id, aluno_id: alunoId, data, tipo: md.tipo, titulo: md.nome, estrutura: [], distancia_km: 0, duracao_min: 0, zona: null, criado_por: S.user.id }); closeSheet(); return error ? toast('Não foi possível salvar.', true) : (toast(md.tipo === 'forca' ? 'Dia de força marcado.' : 'Day off marcado.'), recarregar()); } editorTreino({ alunoId, perfil, data, modelo: md || { nome: '', tipo: 'rodagem', estrutura: [] }, aoSalvar: recarregar, modelos: modelosOrg }); };
    });
    if (staff) {
      const area = q('.pl-grid');
      arrastar(area, { item: '.mod, .ses[data-ses]', alvo: '.cal-dia, .lixeira', soltar: async (el, alvoEl, ev) => {
        // mostra o resultado na hora, antes de salvar
        if (alvoEl.id === 'lixeira') { if (el.dataset.ses) el.remove(); }
        else { const c = alvoEl.querySelector('.cal-dia-c'); if (c) { c.querySelector('.cal-vazio')?.remove(); const nv = el.dataset.mod ? Object.assign(document.createElement('div'), { className: 'ses salvando', innerHTML: `<div class="ses-t"><b>${esc(el.querySelector('b')?.textContent || 'Treino')}</b></div>${el.querySelector('.perfil-int')?.outerHTML || ''}<span class="ses-m">salvando…</span>` }) : ev.copia ? Object.assign(el.cloneNode(true), { className: el.className + ' salvando' }) : el; c.appendChild(nv); } }
        if (alvoEl.id === 'lixeira') {
          if (!el.dataset.ses) return;
          const pg = plano.find((x) => x.id === el.dataset.ses); if (pg && pg.garmin_workout_id) await chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: [{ plano_id: pg.id }] }).catch(() => {});
          const { error } = await sb.from('nx_plano_corrida').delete().eq('id', el.dataset.ses);
          error ? toast('Não foi possível excluir.', true) : (toast('Treino excluído.'), recarregar()); return;
        }
        const data = alvoEl.dataset.dia;
        if (el.dataset.mod) {
          const md = modelos.find((x) => x.id === el.dataset.mod); if (!md) return;
          const rs = resumoEstrutura(md.estrutura, perfil);
          const { error } = await sb.from('nx_plano_corrida').insert({ org_id: S.org.id, aluno_id: alunoId, data, tipo: md.tipo, titulo: md.nome, estrutura: md.estrutura, distancia_km: Math.round(rs.km * 10) / 10, duracao_min: Math.round(rs.seg / 60), zona: null, criado_por: S.user.id });
          error ? toast('Não foi possível adicionar.', true) : (toast(`${md.nome} em ${DIAS[dia(data).getDay()]} ${dia(data).getDate()}`), recarregar());
        } else if (el.dataset.ses) {
          const p = plano.find((x) => x.id === el.dataset.ses); if (!p || p.data === data && !ev.copia) return;
          if (ev.copia) { const { id, criado_em, garmin_workout_id, garmin_schedule_id, garmin_enviado_em, garmin_erro, ...resto } = p; const { error } = await sb.from('nx_plano_corrida').insert({ ...resto, data, liberado: false, criado_por: S.user.id }); error ? toast('Não foi possível copiar.', true) : (toast('Treino copiado.'), recarregar()); }
          else { const { error } = await sb.from('nx_plano_corrida').update({ data }).eq('id', p.id); error ? toast('Não foi possível mover.', true) : (toast(`Movido para ${DIAS[dia(data).getDay()]} ${dia(data).getDate()}`), recarregar()); if (!error && p.garmin_workout_id && p.liberado && S.cache.garmOn) enviarGarmin(alunoId, [{ ...p, data }], perfil).catch(() => {}); }
        }
      } });
      // copiar/colar semana: a cópia fica guardada e dá para colar em outra semana ou em outro aluno
      q('#copiar-sem').onclick = () => {
        if (!plano.length) return;
        const base = isoDia(ini);
        const itens = plano.map((p) => { const { id, criado_em, aluno_id, org_id, data, criado_por, garmin_workout_id, garmin_schedule_id, garmin_enviado_em, garmin_erro, ...resto } = p; return { ...resto, off: Math.round((dia(data) - dia(base)) / 864e5) }; });
        store.set('nx_clip_corr', { origem: `${firstName(m.nome || 'aluno')} · ${ini.getDate()}/${ini.getMonth() + 1}`, semanas, itens });
        toast(`${itens.length} treino${itens.length > 1 ? 's' : ''} copiado${itens.length > 1 ? 's' : ''}. Vá até a semana (ou outro aluno) e toque em “Colar”.`); recarregar();
      };
      const colar = q('#colar-sem'); if (colar) colar.onclick = () => {
        const clip = store.get('nx_clip_corr', null); if (!clip) return;
        const fimC = new Date(ini); fimC.setDate(ini.getDate() + clip.semanas * 7 - 1);
        const ja = plano.filter((p) => p.data >= isoDia(ini) && p.data <= isoDia(fimC)).length;
        openSheet(`<p class="eyebrow">Colar ${clip.semanas > 1 ? 'semanas' : 'semana'}</p><div class="h2" style="margin-top:4px">${clip.itens.length} treino${clip.itens.length > 1 ? 's' : ''} de ${esc(clip.origem)}</div>
          <p class="small muted" style="margin-top:6px">Vão para ${esc(firstName(m.nome || 'o aluno'))}, a partir de ${fmtDia(isoDia(ini))}, nos mesmos dias da semana.${ja ? ` Essa semana já tem ${ja} treino${ja > 1 ? 's' : ''}.` : ''}</p>
          <div class="stack" style="margin-top:16px">${ja ? `<button class="btn block" data-modo="trocar">Substituir os ${ja} treinos que já estão lá</button><button class="btn ghost block" data-modo="somar">Somar aos que já estão</button>` : '<button class="btn block" data-modo="somar">Colar aqui</button>'}
          <button class="link-btn small" data-modo="limpar" style="color:var(--err)">Descartar a cópia</button></div>`, (r) => {
          r.onclick = async (e) => {
            const b2 = e.target.closest('[data-modo]'); if (!b2) return; const modo = b2.dataset.modo;
            if (modo === 'limpar') { store.del('nx_clip_corr'); closeSheet(); toast('Cópia descartada.'); return recarregar(); }
            b2.disabled = true;
            if (modo === 'trocar') { const velhos = plano.filter((p) => p.data >= isoDia(ini) && p.data <= isoDia(fimC)); const ids = velhos.map((p) => p.id); const noG = velhos.filter((p) => p.garmin_workout_id); if (noG.length) await chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: noG.map((p) => ({ plano_id: p.id })) }).catch(() => {}); if (ids.length) await sb.from('nx_plano_corrida').delete().in('id', ids); }
            const novos = clip.itens.map(({ off, garmin_workout_id, garmin_schedule_id, garmin_enviado_em, garmin_erro, ...resto }) => { const d = new Date(ini); d.setDate(ini.getDate() + off); return { ...resto, org_id: S.org.id, aluno_id: alunoId, data: isoDia(d), liberado: false, criado_por: S.user.id }; });
            const { error } = await sb.from('nx_plano_corrida').insert(novos);
            closeSheet();
            if (error) return toast('Não foi possível colar.', true);
            toast('Treinos colados!'); recarregar();
          };
        });
      };
      q('#avisar').onclick = () => { notificarAluno('planilha', alunoId); toast('Aluno avisado da planilha.'); };
      q('#guia-plan').onclick = () => guiaPlanilha();
      if (!store.get('nx_guia_plan', false)) setTimeout(() => { if (box.isConnected) guiaPlanilha(); }, 400);
    }
  }
  if (!staff && integ && (!integ.ultima_sync || Date.now() - new Date(integ.ultima_sync) > 30 * 60000) && !st.syncTentado) {
    st.syncTentado = true;
    sincronizarIntervals(alunoId).then((n) => { if (n > 0) { toast(`${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''} do relógio`); recarregar(); } }).catch(() => {});
  }
}

function notificarAluno(acao, alunoId) { try { sb.functions.invoke('nx-push', { body: { acao, aluno_id: alunoId } }).catch(() => {}); } catch {} }

/* ---------- Intervals.icu ---------- */
function intervalsCardHTML(integ, staff) {
  if (integ) return `<div class="card"><div class="row between" style="gap:12px"><div><b>Intervals.icu conectado ✓</b><p class="small muted">${integ.ultima_sync ? 'Última sincronização ' + quando(integ.ultima_sync) + ' às ' + fmtHora(integ.ultima_sync) : 'Aguardando a primeira sincronização'}${integ.erro ? ` · <span style="color:var(--warn)">${esc(integ.erro)}</span>` : ''}</p></div>
    <div class="row" style="gap:6px">${staff ? '' : '<button class="btn ghost sm" id="int-sync">Sincronizar</button><button class="link-btn small" id="int-off">Desconectar</button>'}</div></div></div>`;
  if (staff) return '<div class="card"><p class="small muted">O aluno ainda não conectou o relógio. Ele faz isso aqui mesmo, na aba de corrida dele. Enquanto isso, as corridas podem ser enviadas por arquivo.</p></div>';
  return `<div class="card"><b>Corridas chegando sozinhas</b><p class="small muted" style="margin-top:4px">Conecte o seu relógio (Coros, Polar, Suunto, Wahoo e outros) ao <b>Intervals.icu</b>, que é gratuito, e depois conecte o Intervals.icu aqui. As corridas passam a aparecer no app sem você fazer nada.</p>
    <ol class="small muted passos-int"><li>Crie uma conta grátis em intervals.icu e conecte o seu relógio lá (Configurações → Conexões).</li><li>Volte aqui e toque em “Conectar Intervals.icu”.</li></ol>
    <button class="btn sm" id="int-on" style="margin-top:12px">Conectar Intervals.icu</button>
    <p class="tiny dim" style="margin-top:8px">Tem relógio Garmin? Use o botão “Conectar Garmin” acima, que é direto e oficial.</p></div>`;
}
/* ---------- ciclo menstrual (opcional, só a aluna e os treinadores veem) ---------- */
const FASES_CICLO = {
  menstrual: ['Fase menstrual', '#e85d75', 'A energia pode estar menor. Treine pela sensação e ajuste a intensidade se precisar.'],
  folicular: ['Fase folicular', '#2fb6e0', 'Costuma ser uma boa fase para treinos fortes e de qualidade.'],
  ovulatoria: ['Fase ovulatória', '#e0a400', 'Energia geralmente alta. Capriche no aquecimento.'],
  lutea: ['Fase lútea', '#8b6be8', 'Calor e cansaço maiores são comuns. Hidratação extra e intensidade pelo esforço percebido.'],
};
const SIT_CICLO = [['regular', 'Regular, todo mês'], ['irregular', 'Irregular'], ['contraceptivo', 'Anticoncepcional sem menstruação'], ['nao_menstrua', 'Não menstruo (menopausa, gestação…)']];
async function buscarCiclo(alunoId) {
  const [c, ini] = await Promise.all([
    sb.from('nx_ciclo').select('*').eq('aluno_id', alunoId).maybeSingle().then((r) => r.data).catch(() => null),
    sb.from('nx_ciclo_inicios').select('data').eq('aluno_id', alunoId).order('data', { ascending: false }).limit(6).then((r) => r.data || []).catch(() => []),
  ]);
  return c ? { ...c, inicios: ini.map((x) => x.data) } : null;
}
function cicloInfo(c, ref = hojeISO()) {
  if (!c || !c.ativo) return null;
  if (c.situacao === 'contraceptivo' || c.situacao === 'nao_menstrua') return { semFase: true };
  const ins = (c.inicios || []).filter((d) => d <= ref); if (!ins.length) return { semData: true };
  let cl = c.duracao_ciclo || 28; const difs = [];
  for (let i = 0; i < Math.min(ins.length - 1, 3); i++) { const d = Math.round((dia(ins[i]) - dia(ins[i + 1])) / 864e5); if (d >= 20 && d <= 45) difs.push(d); }
  if (difs.length) cl = Math.round(difs.reduce((a, b) => a + b, 0) / difs.length);
  const desde = Math.round((dia(ref) - dia(ins[0])) / 864e5), d = (desde % cl) + 1, dm = c.duracao_menstr || 5, ov = cl - 14;
  const fase = d <= dm ? 'menstrual' : d < ov - 1 ? 'folicular' : d <= ov + 1 ? 'ovulatoria' : 'lutea';
  return { dia: d, ciclo: cl, fase, prox: somaDias(ins[0], cl * (Math.floor(desde / cl) + 1)), ultimo: ins[0], atraso: desde >= cl ? desde - cl + 1 : 0 };
}
/** fase do ciclo num dia (usa a menstruação registrada mais recente até aquele dia; antes dela, conta para trás) */
function cicloFaseDia(c, k) {
  if (!c || !c.ativo || c.situacao === 'contraceptivo' || c.situacao === 'nao_menstrua') return null;
  const ins = (c.inicios || []).slice().sort().reverse(); if (!ins.length) return null;
  let cl = c.duracao_ciclo || 28; const difs = [];
  for (let i = 0; i < Math.min(ins.length - 1, 3); i++) { const x = Math.round((dia(ins[i]) - dia(ins[i + 1])) / 864e5); if (x >= 20 && x <= 45) difs.push(x); }
  if (difs.length) cl = Math.round(difs.reduce((a, b) => a + b, 0) / difs.length);
  const base = ins.find((x) => x <= k) || ins[ins.length - 1];
  const desde = Math.round((dia(k) - dia(base)) / 864e5), d = ((desde % cl) + cl) % cl + 1, dm = c.duracao_menstr || 5, ov = cl - 14;
  const fase = d <= dm ? 'menstrual' : d < ov - 1 ? 'folicular' : d <= ov + 1 ? 'ovulatoria' : 'lutea';
  return { fase, dia: d, ciclo: cl, previsto: k > hojeISO() || desde < 0 || (fase === 'menstrual' && desde >= cl) };
}
/** sinal do ciclo no cabeçalho do dia da planilha: gota na menstruação, ponto colorido nas outras fases */
function cicloSeloHTML(c, k) {
  const f = cicloFaseDia(c, k); if (!f) return '';
  const [nome, cor] = FASES_CICLO[f.fase];
  const dica = `${nome} · dia ${f.dia} de ${f.ciclo}${f.previsto ? ' (previsão)' : ''}`;
  return `<i class="cic-selo ${f.fase === 'menstrual' ? 'gota' : ''} ${f.previsto ? 'prev' : ''}" style="--cf:${cor}" title="${esc(dica)}" aria-label="${esc(dica)}">${f.fase === 'menstrual' ? '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/></svg>' : ''}</i>`;
}
/** linha resumida da fase (aluna no Hoje e treinador na planilha) */
function cicloLinhaHTML(c, staff) {
  const inf = cicloInfo(c); if (!inf) return '';
  if (inf.semFase) return staff ? `<div class="ciclo-l" style="--cf:#8b9ab8"><i></i><span>Ciclo: ${esc((SIT_CICLO.find((x) => x[0] === c.situacao) || [, ''])[1].split(' (')[0])}</span></div>` : '';
  if (inf.semData) return staff ? '' : `<button type="button" class="ciclo-l btn-ciclo" style="--cf:#e85d75"><i></i><span><b>Ciclo menstrual</b> · registre o início da última menstruação</span>${I.chev}</button>`;
  const f = FASES_CICLO[inf.fase];
  const txt = inf.atraso ? `previsão passou há ${inf.atraso} dia${inf.atraso > 1 ? 's' : ''}${staff ? '' : ': já começou? toque para registrar'}` : `dia ${inf.dia} de ${inf.ciclo} · próxima menstruação ~${fmtCurto(inf.prox + 'T12:00:00')}`;
  return staff
    ? `<div class="ciclo-l" style="--cf:${f[1]}"><i></i><span><b>${f[0]}</b> · ${txt}</span></div>`
    : `<button type="button" class="ciclo-l btn-ciclo" style="--cf:${f[1]}"><i></i><span><b>${f[0]}</b> · ${txt}</span>${I.chev}</button>`;
}
// ativar o acompanhamento do ciclo sem precisar abrir a ficha de saúde inteira
function ativarCiclo(depois) {
  const sel = (ops, v) => ops.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('');
  openSheet(`<p class="eyebrow">Ciclo menstrual · opcional</p><div class="h2" style="margin-top:4px">Acompanhar o meu ciclo</div>
    <p class="muted small" style="margin-top:6px">O seu treinador ajusta a intensidade dos treinos de acordo com a fase do ciclo. Só você e os treinadores da Nexos veem.</p>
    <form id="f-cic" style="margin-top:14px">
      <label class="field"><span>Como é o seu ciclo?</span><select class="input" name="sit">${sel(SIT_CICLO, 'regular')}</select></label>
      <div id="cic-d">
        <label class="field"><span>Início da última menstruação</span><input class="input" type="date" name="ini" max="${hojeISO()}" required></label>
        <div class="grid2"><label class="field"><span>Duração média do ciclo (dias)</span><input class="input" name="cl" inputmode="numeric" value="28" maxlength="2"></label><label class="field"><span>Dias de menstruação</span><input class="input" name="dm" inputmode="numeric" value="5" maxlength="2"></label></div>
      </div>
      <p class="tiny dim">Ao ativar, você concorda que esses dados de saúde sejam usados só para orientar o seu treino (LGPD, art. 11). Pode desativar quando quiser em Perfil > Minha ficha de saúde, e os registros são apagados.</p>
      <button class="btn block" type="submit" style="margin-top:12px">Ativar acompanhamento</button>
    </form>`, (r) => {
    const f = r.querySelector('#f-cic'), d = r.querySelector('#cic-d');
    const ver = () => { const sem = f.sit.value === 'contraceptivo' || f.sit.value === 'nao_menstrua'; d.hidden = sem; f.ini.required = !sem; };
    f.sit.onchange = ver; ver();
    f.onsubmit = async (e) => {
      e.preventDefault(); const b = f.querySelector('[type=submit]'); b.disabled = true;
      const sit = f.sit.value, sem = sit === 'contraceptivo' || sit === 'nao_menstrua';
      const cl = Math.min(45, Math.max(20, parseInt(f.cl.value, 10) || 28)), dm = Math.min(10, Math.max(2, parseInt(f.dm.value, 10) || 5));
      if (!sem && (!f.ini.value || f.ini.value > hojeISO())) { b.disabled = false; return toast('Confira a data do início da última menstruação.', true); }
      const agora = new Date().toISOString();
      const { error } = await sb.from('nx_ciclo').upsert({ aluno_id: S.user.id, org_id: S.org.id, ativo: true, situacao: sit, duracao_ciclo: cl, duracao_menstr: dm, consentimento_em: agora, atualizado_em: agora }, { onConflict: 'aluno_id' });
      if (error) { b.disabled = false; return toast('Não foi possível ativar agora.', true); }
      if (!sem) await sb.from('nx_ciclo_inicios').upsert({ org_id: S.org.id, aluno_id: S.user.id, data: f.ini.value }, { onConflict: 'aluno_id,data' });
      if (S.me.sexo !== 'F') { await sb.from('nx_membros').update({ sexo: 'F' }).eq('org_id', S.org.id).eq('user_id', S.user.id); S.me.sexo = 'F'; }
      closeSheet(); toast('Acompanhamento do ciclo ativado.'); depois && depois();
    };
  });
}
/** folha para a aluna registrar a menstruação e ver a fase */
function abrirCiclo(c, depois) {
  const inf = cicloInfo(c) || {};
  const f = inf.fase ? FASES_CICLO[inf.fase] : null;
  openSheet(`<p class="eyebrow">Meu ciclo</p><div class="h2" style="margin-top:4px">${f ? f[0] : 'Ciclo menstrual'}</div>
    ${f ? `<p class="muted small" style="margin-top:6px">${inf.atraso ? 'A menstruação prevista ainda não foi registrada.' : `Dia ${inf.dia} de um ciclo de cerca de ${inf.ciclo} dias.`} ${f[2]}</p>` : '<p class="muted small" style="margin-top:6px">Registre o início da menstruação para o app calcular a sua fase e o seu treinador ajustar os treinos.</p>'}
    <button class="btn block" id="ci-hoje" style="margin-top:16px">Minha menstruação começou hoje</button>
    <label class="field" style="margin-top:12px"><span>Ou escolha a data em que começou</span><div class="row" style="gap:8px"><input class="input" type="date" id="ci-data" max="${hojeISO()}" value="${hojeISO()}"><button class="btn ghost sm" id="ci-salvar">Salvar</button></div></label>
    ${c && c.inicios && c.inicios.length ? `<p class="tiny dim" style="margin-top:6px">Últimos registros: ${c.inicios.slice(0, 4).map((d) => fmtCurto(d + 'T12:00:00')).join(' · ')}</p>` : ''}
    <a class="link-btn small" href="#/saude" style="display:inline-block;margin-top:12px">Editar ou desativar o acompanhamento</a>
    <button class="btn ghost block" data-close style="margin-top:12px">Fechar</button>`, (r) => {
    const salvar = async (data) => {
      const { error } = await sb.from('nx_ciclo_inicios').upsert({ org_id: S.org.id, aluno_id: S.user.id, data }, { onConflict: 'aluno_id,data' });
      if (error) return toast('Não foi possível salvar.', true);
      closeSheet(); toast('Registrado! A fase do seu ciclo foi atualizada.'); depois && depois();
    };
    r.querySelector('#ci-hoje').onclick = () => salvar(hojeISO());
    r.querySelector('#ci-salvar').onclick = () => { const v = r.querySelector('#ci-data').value; if (!v || v > hojeISO()) return toast('Escolha uma data válida.', true); salvar(v); };
  });
}

/* ---------- aba Conexões (aluno): relógios e apps ---------- */
async function viewConexoes(ret) {
  loading(); dockAluno();
  const integs = await sb.from('nx_integracoes').select('provedor,athlete_id,ultima_sync,erro,conectado_em').eq('user_id', S.user.id).in('provedor', ['intervals', 'garmin']).then((r) => r.data || []).catch(() => []);
  const integ = integs.find((x) => x.provedor === 'intervals') || null, garm = integs.find((x) => x.provedor === 'garmin') || null;
  let marcaInt = null; try { marcaInt = localStorage.getItem('nx-marca'); } catch {}
  if (!MARCA_NOME[marcaInt] || marcaInt === 'garmin' || marcaInt === 'outro') marcaInt = null;
  if (ret) {
    const ok = /ok$/.test(ret), g = ret.startsWith('garmin');
    toast(g ? (ok ? 'Garmin conectado! Suas corridas chegam sozinhas e os treinos vão para o relógio.' : 'Não foi possível conectar o Garmin. Tente de novo.') : (ok ? 'Intervals.icu conectado! Buscando suas corridas…' : 'Não foi possível conectar o Intervals.icu.'), !ok);
    history.replaceState(null, '', location.pathname + '#/conexoes');
  }
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""></div><a class="perfil-btn" href="#/perfil">${I.user}<span>Editar perfil</span></a></div>
    <p class="eyebrow">Conexões</p><h1 class="h1">Seus aparelhos</h1>
    <p class="muted" style="margin-top:6px">Conecte o seu relógio uma vez: as corridas entram sozinhas no app${garm ? ' e os treinos da planilha vão para o relógio' : ''}.</p>
    <div class="section"><div class="section-h"><h2 class="h2">Seu relógio</h2>${slashes}</div><p class="small muted" style="margin:-4px 0 12px">Toque na marca do seu relógio.</p>
      <div class="marcas">${MARCAS.map(([k, nome]) => { const on = (k === 'garmin' && garm) || (k !== 'garmin' && k !== 'outro' && integ && marcaInt === k); return `<button type="button" class="marca${on ? ' on' : ''}" data-marca="${k}">${marcaLogo(k, nome)}${on ? '<span class="marca-ok">Conectado ✓</span>' : ''}</button>`; }).join('')}</div>
      ${garm || integ ? `<div class="stack" style="margin-top:12px">${garm ? `<div id="garmin-box">${garminCardHTML(garm, false)}</div>` : ''}${integ ? `<div id="intervals-box">${intervalsCardHTML(integ, false).replace('Intervals.icu conectado ✓', `${esc(MARCA_NOME[marcaInt] || 'Relógio')} conectado ✓ <span class="tiny dim">pelo Intervals.icu</span>`)}</div>` : ''}</div>` : ''}
    </div>
    <div class="section"><a class="gps-cta" href="#/gps"><span class="gps-cta-ic">${I.run}</span><div class="grow"><b>Não tem relógio compatível com a Nexos?</b><span>Faça o treino da sua planilha pelo celular, com GPS, aviso de cada parte e registro automático.</span></div>${I.chev}</a></div>
    <div class="section"><div class="section-h"><h2 class="h2">Sem conexão?</h2>${slashes}</div><button class="list-item" id="cx-arq" style="width:100%;text-align:left"><span class="ativ-ic">${I.plus}</span><div class="grow"><b>Enviar o arquivo do relógio</b><div class="small muted">.FIT, .GPX ou .TCX, ou digite distância e tempo</div></div>${I.chev}</button></div>
    <div class="section"><div class="section-h"><h2 class="h2">Instalar o aplicativo</h2>${slashes}</div><p class="small muted" style="margin:-4px 0 10px">Tenha a Nexos na tela de início do celular, abrindo como um aplicativo e recebendo notificações.</p><div id="inst-box">${instalarHTML()}</div></div>`;
  bindInstalar($app);
  const recarregar = () => viewConexoes();
  if (document.getElementById('garmin-box')) bindGarmin(document.getElementById('garmin-box'), recarregar);
  if (document.getElementById('intervals-box')) bindIntervals(document.getElementById('intervals-box'), integ, false, S.user.id, recarregar);
  $app.querySelectorAll('[data-marca]').forEach((b) => b.onclick = () => abrirMarca(b.dataset.marca, garm, integ, marcaInt, recarregar));
  document.getElementById('cx-arq').onclick = () => registrarCorrida(S.user.id, (id) => { location.hash = '#/corrida/' + id; });
  if (integ && (!integ.ultima_sync || Date.now() - new Date(integ.ultima_sync) > 30 * 60000)) sincronizarIntervals(S.user.id).then((n) => { if (n > 0) toast(`${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''} do relógio`); }).catch(() => {});
}

/* ---------- treino pelo celular (GPS do aparelho, para quem não tem relógio compatível) ----------
   App web: o GPS só funciona com a tela ligada. Por isso a tela fica acesa durante o treino (Wake Lock),
   o progresso é guardado no aparelho a cada poucos segundos e, se a tela apagar, o treino continua de onde parou. */
const GPS_IC = {
  som: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  mudo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
  trava: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
};
const GPS_KEY = 'nx-gps';
const gpsSalvo = () => { const s = store.get(GPS_KEY, null); return s && s.inicio && Date.now() - s.salvoEm < 8 * 3600e3 ? s : null; };
// passos do treino em ordem, com o número da repetição (ex.: Tiro 3 de 6)
function gpsPassos(p, perfil) {
  const out = [];
  const add = (s, rep, nrep) => {
    const alvo = s.med === 'min' ? { t: s.v * 60 } : { d: s.med === 'km' ? s.v * 1000 : s.v };
    const [a, b] = faixaZona(s.z, perfil);
    out.push({ k: s.k, z: s.z, med: s.med, v: s.v, rep, nrep, ...alvo, pa: a, pb: b });
  };
  (estruturaDe(p) || []).forEach((s) => { if (s.k === 'rep') { for (let i = 0; i < (s.n || 1); i++) (s.passos || []).forEach((x) => add(x, i + 1, s.n || 1)); } else add(s); });
  return out;
}
const gpsNomePasso = (s, curto) => { const n = s.k === 'co' ? (s.nrep ? 'Tiro' : 'Corrida') : PASSOS[s.k] || 'Corrida'; return s.nrep && !curto ? `${n} ${s.rep} de ${s.nrep}` : n; };
const gpsAlvoTxt = (s) => s.t ? `${String(s.v).replace('.', ',')} min` : s.d >= 1000 ? `${String(+(s.d / 1000).toFixed(2)).replace('.', ',')} km` : `${Math.round(s.d)} m`;
const gpsDist = (a, b) => { const R = 6371000, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

// lista: os treinos da semana para escolher e fazer pelo celular
async function viewGpsLista() {
  loading(); dockAluno(); layout('aluno');
  const ini = inicioSemana(), fim = new Date(ini); fim.setDate(ini.getDate() + 6);
  const [plano, feitas] = await Promise.all([
    buscarPlano(S.user.id, isoDia(ini), isoDia(fim)).catch(() => []),
    sb.from('nx_corridas').select('id,plano_id').eq('aluno_id', S.user.id).gte('data', isoDia(ini)).then((r) => r.data || [], () => []),
  ]);
  const perfil = perfilCorrida(S.me), hoje = hojeISO(), salvo = gpsSalvo();
  const treinos = plano.filter((p) => !semCorrida(p) && estruturaDe(p).length);
  const cartao = (p) => {
    const feito = feitas.some((c) => c.plano_id === p.id), tot = estimaTotal(estruturaDe(p), perfil);
    return `<div class="card gps-tr ${p.data === hoje ? 'hoje' : ''} ${p.data < hoje && !feito ? 'passado' : ''}">
      <div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><div style="min-width:0"><span class="eyebrow">${p.data === hoje ? 'Hoje' : fmtDiaSem(p.data)}</span><div class="h3" style="margin-top:2px">${esc(p.titulo || nomeTipo(p.tipo))}</div></div>${feito ? '<span class="tag ok">Feito ✓</span>' : ''}</div>
      ${perfilHTML(estruturaDe(p), perfil)}
      <p class="small muted" style="margin-top:8px">${esc(descreverEstrutura(estruturaDe(p), perfil))}</p>
      <p class="tiny dim" style="margin-top:4px">Total estimado: ${tot.km} · ${tot.tempo}</p>
      <a class="btn ${p.data === hoje ? '' : 'ghost'} sm" style="margin-top:12px" href="#/gps/${p.id}">${I.play} ${feito ? 'Fazer de novo' : 'Fazer este treino'}</a></div>`;
  };
  $app.innerHTML = `<a class="back" href="#/conexoes">${I.back} Conexões</a>
    <p class="eyebrow">Treinar pelo celular</p><h1 class="h1">Seus treinos da semana</h1>
    <p class="muted" style="margin-top:6px">Escolha o treino e faça com o GPS do celular. O app mostra cada parte do treino, avisa com som e voz quando trocar e registra a corrida sozinho no final.</p>
    <div class="gps-aviso">${I.raio}<div><b>Deixe a tela ligada durante o treino.</b> O app mantém a tela acesa. Se o celular bloquear, o GPS para até você desbloquear, e o treino continua de onde parou.</div></div>
    ${salvo ? `<div class="card gps-rec"><b>Você tem um treino em andamento</b><p class="small muted" style="margin-top:4px">${esc(salvo.titulo)} · ${fmtKm(salvo.dist, 2)} · ${fmtDurLongo(salvo.mov / 1000)}</p><div class="row" style="gap:8px;margin-top:10px"><a class="btn sm" href="#/gps/${salvo.id}">Continuar</a><button class="btn ghost sm" id="gps-desc">Descartar</button></div></div>` : ''}
    <div class="section"><div class="section-h"><h2 class="h2">Esta semana</h2>${slashes}</div>
      ${treinos.length ? `<div class="stack">${treinos.map(cartao).join('')}</div>` : '<div class="empty"><div class="h3">Nenhum treino liberado nesta semana</div><p class="small">Quando o treinador liberar a sua semana, os treinos aparecem aqui. Você pode fazer uma corrida livre.</p></div>'}
    </div>
    <div class="section"><a class="list-item" href="#/gps/livre" style="color:inherit"><span class="ativ-ic">${I.run}</span><div class="grow"><b>Corrida livre</b><div class="small muted">Sem treino definido: só tempo, distância e pace, com volta a cada 1 km.</div></div>${I.chev}</a></div>`;
  const d = document.getElementById('gps-desc'); if (d) d.onclick = () => { if (!confirm('Descartar o treino em andamento?')) return; store.del(GPS_KEY); viewGpsLista(); };
}

// tela do treino
async function viewGps(id) {
  loading(); $dock.hidden = true; layout('gps-app');
  let p = null;
  if (id !== 'livre') {
    const { data } = await sb.from('nx_plano_corrida').select('*').eq('id', id).maybeSingle();
    p = data; if (!p) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Treino não encontrado</div><a class="btn sm" href="#/gps" style="margin-top:12px">Voltar</a></div>'; return; }
  }
  const perfil = perfilCorrida(S.me);
  const passos = p ? gpsPassos(p, perfil) : [];
  const titulo = p ? (p.titulo || nomeTipo(p.tipo)) : 'Corrida livre';
  // estado (guardado no aparelho)
  const ant = gpsSalvo();
  const st = ant && ant.id === id ? ant : { id, titulo, inicio: null, estado: 'pronto', mov: 0, dist: 0, passo: 0, pIni: { t: 0, d: 0 }, voltas: [], parciais: [], rota: [], serie: { t: [], d: [], vel: [] }, lacunas: 0, voz: true };
  if (st.estado === 'correndo') st.estado = 'pausado'; // voltou depois de fechar: espera o aluno continuar
  const recuperado = !!(ant && ant.id === id && ant.inicio);
  let btsChave = '', nTick = 0, podeSemSinal = false, ultimo = null, ultimoT = 0, tickRef = 0, watch = null, lock = null, actx = null, marcaMov = 0, janela = [], gpsOk = false;
  const salvar = () => { st.salvoEm = Date.now(); store.set(GPS_KEY, st); };
  const movAgora = () => st.mov + (st.estado === 'correndo' && marcaMov ? Date.now() - marcaMov : 0);

  $app.innerHTML = `<div class="gps">
    <div class="gps-top"><button class="icon-btn sm" id="g-sair" aria-label="Sair">${I.back}</button><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(titulo)}</b><span class="tiny" id="g-sinal">Procurando GPS…</span></div><button class="icon-btn sm" id="g-voz" aria-label="Voz">${st.voz ? GPS_IC.som : GPS_IC.mudo}</button></div>
    <div class="gps-passo" id="g-passo"></div>
    <div class="gps-num"><div><span>Tempo</span><b id="g-tempo">0:00</b></div><div><span>Distância</span><b id="g-dist">0,00<small> km</small></b></div><div><span>Pace agora</span><b id="g-pace">–</b></div><div><span>Pace médio</span><b id="g-pm">–</b></div></div>
    <div class="gps-prox" id="g-prox"></div>
    <div class="gps-bts" id="g-bts"></div>
    <p class="tiny dim center" id="g-dica" style="margin-top:10px"></p>
    <div class="gps-trava" id="g-trava" hidden><div class="gps-trava-c"><div class="h3">Tela travada</div><p class="small" style="margin:6px 0 18px">Os toques estão desligados para não atrapalhar a corrida.</p><button class="btn ghost" id="g-dest">Segure para destravar</button></div></div>
  </div>`;
  const $ = (s) => document.getElementById(s);

  // som, vibração e voz nas trocas
  const beep = (n = 1) => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); for (let i = 0; i < n; i++) { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); const t0 = actx.currentTime + i * 0.28; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2); o.start(t0); o.stop(t0 + 0.22); } } catch {} };
  const falar = (t) => { if (!st.voz || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; u.rate = 1.05; speechSynthesis.speak(u); } catch {} };
  const paceFala = (s) => { const x = Math.round(s); return `${Math.floor(x / 60)} e ${String(x % 60).padStart(2, '0')}`; };
  const anunciar = (s) => { if (!s) return; const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve; falar(`${gpsNomePasso(s)}. ${gpsAlvoTxt(s).replace(',', ' vírgula ').replace(/ km$/, ' quilômetros').replace(/ m$/, ' metros').replace(/ min$/, ' minutos')}. ${z.d.replace(/\s*\(.*\)/, '')}, pace de ${paceFala(s.pa)} a ${paceFala(s.pb)}.`); };
  const vibrar = (p2) => { try { navigator.vibrate && navigator.vibrate(p2); } catch {} };

  // tela acesa
  const pedirTela = async () => { try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch {} };
  const soltarTela = () => { try { lock && lock.release(); } catch {} lock = null; };

  const passoAtual = () => passos[st.passo] || null;
  const desenha = () => {
    const mov = movAgora() / 1000, s = passoAtual();
    $('g-tempo').textContent = fmtDurLongo(mov);
    $('g-dist').innerHTML = `${(st.dist / 1000).toFixed(2).replace('.', ',')}<small> km</small>`;
    $('g-pm').textContent = st.dist > 50 ? fmtPace(mov / (st.dist / 1000)).replace('/km', '') : '–';
    // pace dos últimos ~20 s
    const j = janela.filter((x) => Date.now() - x.t < 20000); const pa = j.length > 1 ? (j[j.length - 1].t - j[0].t) / 1000 / ((j[j.length - 1].d - j[0].d) / 1000) : null;
    $('g-pace').textContent = pa && isFinite(pa) && pa < 1200 && pa > 120 ? fmtPace(pa).replace('/km', '') : '–';
    if (s) {
      const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve, fT = mov - st.pIni.t, fD = st.dist - st.pIni.d;
      const falta = s.t ? Math.max(0, s.t - fT) : Math.max(0, s.d - fD), pr = s.t ? fT / s.t : fD / s.d;
      const noRitmo = pa && isFinite(pa) ? (pa < s.pa * 0.97 ? 'rapido' : pa > s.pb * 1.03 ? 'lento' : 'ok') : '';
      $('g-passo').style.setProperty('--zc', z.c);
      $('g-passo').innerHTML = `<div class="gps-p-h"><span class="gps-z">${z.z} · ${z.d}</span><span class="tiny">Parte ${st.passo + 1} de ${passos.length}</span></div>
        <div class="gps-p-n">${gpsNomePasso(s)}</div>
        <div class="gps-p-f">${s.t ? fmtDurLongo(falta) : falta >= 1000 ? (falta / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(falta) + ' m'}<small>${s.t ? ' faltando' : ' faltando'}</small></div>
        <div class="gps-bar"><i style="width:${Math.min(100, pr * 100).toFixed(1)}%"></i></div>
        <div class="gps-p-alvo">Pace alvo <b>${fmtPace(s.pa).replace('/km', '')} a ${fmtPace(s.pb)}</b>${noRitmo === 'rapido' ? '<span class="gps-r r">Rápido demais</span>' : noRitmo === 'lento' ? '<span class="gps-r l">Acelere</span>' : noRitmo === 'ok' ? '<span class="gps-r ok">No ritmo</span>' : ''}</div>`;
      const nx = passos[st.passo + 1];
      $('g-prox').innerHTML = nx ? `Depois: <b>${gpsNomePasso(nx)}</b> · ${gpsAlvoTxt(nx)} · ${(ZONAS_INFO[nx.z] || ZONAS_INFO.leve).z}` : 'Última parte do treino';
    } else if (passos.length) {
      $('g-passo').style.setProperty('--zc', 'var(--ok)');
      $('g-passo').innerHTML = '<div class="gps-p-n">Treino completo</div><p class="small" style="margin-top:6px">Pode desacelerar e tocar em Terminar para salvar.</p>';
      $('g-prox').innerHTML = '';
    } else {
      const v = st.voltas.length + 1, fD = st.dist - st.pIni.d;
      $('g-passo').style.setProperty('--zc', 'var(--acc)');
      $('g-passo').innerHTML = `<div class="gps-p-h"><span class="gps-z">Corrida livre</span><span class="tiny">Volta ${v}</span></div><div class="gps-p-f">${(fD / 1000).toFixed(2).replace('.', ',')}<small> km nesta volta</small></div><div class="gps-bar"><i style="width:${Math.min(100, fD / 10).toFixed(1)}%"></i></div>`;
      $('g-prox').innerHTML = '';
    }
    const E = st.estado, chave = E + gpsOk + podeSemSinal + !!passoAtual();
    if (chave === btsChave) return; btsChave = chave; // botões só mudam quando o estado muda (não some no meio do toque)
    $('g-bts').innerHTML = E === 'pronto'
      ? (gpsOk ? `<button class="btn block gps-go" id="g-ini">${I.play} Começar</button>` : podeSemSinal ? `<button class="btn block ghost" id="g-ini">${I.play} Começar mesmo assim</button>` : `<button class="btn block gps-go" id="g-ini" disabled>Esperando o GPS…</button>`)
      : E === 'correndo'
        ? `<button class="btn ghost" id="g-trv" aria-label="Travar a tela">${GPS_IC.trava}</button><button class="btn grow gps-pausa" id="g-pau">Pausar</button>${passos.length && passoAtual() ? `<button class="btn ghost" id="g-pul">Pular ›</button>` : ''}`
        : `<button class="btn grow gps-go" id="g-con">${I.play} Continuar</button><button class="btn ghost grow" id="g-fim">Terminar</button>`;
    $('g-dica').textContent = E === 'pronto' ? (gpsOk ? 'Fique em um lugar aberto. Toque em Começar quando for sair.' : podeSemSinal ? 'Sinal fraco (dentro de casa ou entre prédios). Dá para começar: a distância passa a contar quando o sinal melhorar.' : 'Ao ar livre o GPS acha o sinal mais rápido.') : E === 'pausado' ? (recuperado && !marcaMov ? 'Treino recuperado. Toque em Continuar para seguir.' : 'Treino pausado.') : 'Mantenha a tela ligada.';
    liga();
  };
  const liga = () => {
    const b = (i, f) => { const el = $(i); if (el) el.onclick = f; };
    b('g-ini', comecar); b('g-pau', pausar); b('g-con', continuar); b('g-fim', terminar); b('g-pul', () => fecharPasso()); b('g-trv', () => { $('g-trava').hidden = false; });
  };

  // fecha a parte atual (volta) e passa para a próxima
  const fecharPasso = () => {
    const mov = movAgora() / 1000;
    const v = { d: Math.round(st.dist - st.pIni.d), seg: Math.round(mov - st.pIni.t) };
    if (v.seg > 0) st.voltas.push(v);
    st.pIni = { t: mov, d: st.dist };
    if (passos.length) {
      st.passo++; const nx = passoAtual();
      vibrar([300, 120, 300]); beep(nx && nx.k === 'co' ? 3 : 2);
      if (nx) anunciar(nx); else falar('Treino completo. Muito bem! Toque em terminar para salvar.');
    } else { vibrar(200); beep(1); falar(`${st.voltas.length} quilômetro${st.voltas.length > 1 ? 's' : ''}. Pace ${paceFala(v.seg / (v.d / 1000))}.`); }
    salvar(); desenha();
  };
  const verificaPasso = () => {
    if (st.estado !== 'correndo') return;
    const s = passoAtual(), mov = movAgora() / 1000;
    if (s) { if ((s.t && mov - st.pIni.t >= s.t) || (s.d && st.dist - st.pIni.d >= s.d)) fecharPasso(); }
    else if (!passos.length && st.dist - st.pIni.d >= 1000) fecharPasso();
  };

  // GPS
  const onPos = (pos) => {
    if (!document.getElementById('g-sinal')) return; // já saiu da tela do treino
    const c = pos.coords, pt = [+c.latitude.toFixed(6), +c.longitude.toFixed(6)], t = pos.timestamp || Date.now();
    gpsOk = c.accuracy <= 35;
    $('g-sinal').textContent = c.accuracy <= 15 ? 'GPS ótimo' : c.accuracy <= 35 ? 'GPS bom' : `GPS fraco (±${Math.round(c.accuracy)} m)`;
    $('g-sinal').className = 'tiny ' + (c.accuracy <= 35 ? 'gps-ok' : 'gps-fraco');
    if (st.estado === 'pronto') desenha();
    if (st.estado !== 'correndo') { ultimo = null; return; }
    if (c.accuracy > 35) return;
    if (ultimo) {
      const inc = gpsDist(ultimo, pt), dt = (t - ultimoT) / 1000;
      if (dt <= 0) return;
      if (inc / dt > 9) return; // salto do GPS (mais rápido que 9 m/s): ignora
      if (inc < 2 || (c.speed != null && c.speed < 0.4 && inc < 6)) return; // parado: não soma o tremor do sinal
      if (dt > 30) st.lacunas++; // ficou um tempo sem sinal (tela apagada): liga em linha reta
      st.dist += inc;
    }
    ultimo = pt; ultimoT = t;
    st.rota.push(pt);
    const mov = movAgora() / 1000;
    janela.push({ t: Date.now(), d: st.dist }); if (janela.length > 40) janela.shift();
    const sr = st.serie, ul = sr.t[sr.t.length - 1];
    if (ul == null || mov - ul >= 5) { const j = janela.filter((x) => Date.now() - x.t < 15000); const vel = j.length > 1 ? (j[j.length - 1].d - j[0].d) / ((j[j.length - 1].t - j[0].t) / 1000) : 0; sr.t.push(Math.round(mov)); sr.d.push(Math.round(st.dist)); sr.vel.push(+(isFinite(vel) ? vel : 0).toFixed(2)); }
    const km = Math.floor(st.dist / 1000); if (km > st.parciais.length) { const antT = st.parciais.reduce((a, x) => a + x.seg, 0); st.parciais.push({ km: st.parciais.length + 1, seg: Math.round(mov - antT) }); }
    verificaPasso(); desenha();
  };
  const onErro = (e) => { $('g-sinal').textContent = e.code === 1 ? 'Sem permissão de localização' : 'GPS sem sinal'; $('g-sinal').className = 'tiny gps-fraco'; if (e.code === 1) toast('Permita o acesso à localização para treinar pelo celular (configurações do navegador).', true); };
  const ligarGPS = () => { if (!navigator.geolocation) { toast('Este celular não tem GPS disponível no navegador.', true); return; } if (watch == null) watch = navigator.geolocation.watchPosition(onPos, onErro, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }); };
  const desligarGPS = () => { if (watch != null) navigator.geolocation.clearWatch(watch); watch = null; };

  const comecar = () => {
    actx = actx || (() => { try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } })();
    st.inicio = new Date().toISOString(); st.estado = 'correndo'; marcaMov = Date.now(); ultimo = null;
    pedirTela(); beep(1); vibrar(200);
    const s = passoAtual(); if (s) anunciar(s); else falar('Corrida iniciada.');
    salvar(); desenha();
  };
  const pausar = () => { st.mov = movAgora(); marcaMov = 0; st.estado = 'pausado'; ultimo = null; salvar(); falar('Pausado.'); desenha(); };
  const continuar = () => { ligarGPS(); st.estado = 'correndo'; marcaMov = Date.now(); ultimo = null; pedirTela(); recuperado && falar('Continuando.'); salvar(); desenha(); };
  const terminar = () => {
    openSheet(`<div class="h2">Terminar o treino?</div><p class="small muted" style="margin-top:6px">${fmtKm(st.dist, 2)} em ${fmtDurLongo(movAgora() / 1000)}.</p>
      <div class="stack" style="margin-top:16px"><button class="btn block" id="t-sal">${I.check} Terminar e salvar</button><button class="btn ghost block" id="t-vol">Voltar ao treino</button><button class="link-btn small" id="t-desc" style="margin-top:6px;color:var(--err)">Descartar este treino</button></div>`, (r) => {
      r.querySelector('#t-vol').onclick = () => closeSheet();
      r.querySelector('#t-desc').onclick = () => { if (!confirm('Descartar? A corrida não será salva.')) return; closeSheet(true); encerrar(); store.del(GPS_KEY); location.hash = '#/gps'; };
      r.querySelector('#t-sal').onclick = () => finalizar(); // abre a ficha de salvar no mesmo painel
    });
  };
  const encerrar = () => { clearInterval(tickRef); desligarGPS(); soltarTela(); document.removeEventListener('visibilitychange', onVis); try { speechSynthesis.cancel(); } catch {} };
  const finalizar = () => {
    const mov = Math.round(movAgora() / 1000);
    if (st.dist < 100 || mov < 30) return toast('O treino ficou curto demais para salvar (menos de 100 m).', true);
    // última parte em andamento entra como volta
    const resto = { d: Math.round(st.dist - st.pIni.d), seg: Math.round(mov - st.pIni.t) }, voltas = resto.seg > 5 && resto.d > 0 ? [...st.voltas, resto] : st.voltas;
    const passo = Math.max(1, Math.ceil(st.rota.length / 400)), rota = st.rota.filter((_, i) => i % passo === 0 || i === st.rota.length - 1);
    const d = {
      data: st.inicio, tipo: 'corrida', distancia_m: Math.round(st.dist), duracao_s: mov, rota: rota.length > 1 ? rota : null,
      parciais: st.parciais.length ? st.parciais : null, plano_id: p ? p.id : null, titulo: titulo, fonte: 'celular',
      ext_id: 'cel-' + new Date(st.inicio).getTime(),
      analise: { v: 1, serie: st.serie, voltas, extras: { dispositivo: 'Celular (GPS)', total_s: Math.round((Date.now() - new Date(st.inicio)) / 1000), lacunas: st.lacunas } },
    };
    st.estado = 'pausado'; salvar();
    const plano = p ? [p] : [];
    formCorrida(S.user.id, d, plano, (novo) => { encerrar(); store.del(GPS_KEY); setTimeout(() => { location.hash = '#/corrida/' + novo; }, 150); });
  };
  // tela apagou e voltou: GPS e tela acesa de novo; o tempo corre certo porque é pelo relógio do aparelho
  const onVis = () => { if (document.visibilityState === 'visible') { ultimo = null; if (st.estado === 'correndo') pedirTela(); desenha(); } else salvar(); };
  document.addEventListener('visibilitychange', onVis);
  $('g-voz').onclick = () => { st.voz = !st.voz; $('g-voz').innerHTML = st.voz ? GPS_IC.som : GPS_IC.mudo; salvar(); };
  $('g-sair').onclick = () => {
    if (st.estado === 'pronto') { encerrar(); location.hash = '#/gps'; return; }
    if (st.estado === 'correndo' && !confirm('Sair da tela do treino? Ele fica pausado e você pode continuar depois em Conexões → Treinar pelo celular.')) return;
    if (st.estado === 'correndo') { st.mov = movAgora(); marcaMov = 0; st.estado = 'pausado'; }
    salvar(); encerrar(); location.hash = '#/gps';
  };
  // destravar: segurar 1 s
  let segura = 0; const dest = $('g-dest');
  const ini = (e) => { e.preventDefault(); dest.classList.add('segurando'); segura = setTimeout(() => { $('g-trava').hidden = true; dest.classList.remove('segurando'); vibrar(60); }, 900); };
  const sol = () => { clearTimeout(segura); dest.classList.remove('segurando'); };
  dest.addEventListener('pointerdown', ini); dest.addEventListener('pointerup', sol); dest.addEventListener('pointerleave', sol); dest.addEventListener('contextmenu', (e) => e.preventDefault());
  // relógio da tela + checagem das partes por tempo
  const tick = () => { if (!document.getElementById('g-tempo')) return encerrar(); verificaPasso(); if (st.estado === 'correndo') { desenha(); if (++nTick % 5 === 0) salvar(); } };
  tickRef = setInterval(tick, 1000);
  ligarGPS(); desenha();
  setTimeout(() => { podeSemSinal = true; if (document.getElementById('g-bts')) desenha(); }, 15000); // sem sinal bom em 15 s: libera começar assim mesmo
  // saiu da tela por navegação: libera GPS e tela
  const sairRota = () => { if (!location.hash.startsWith('#/gps/' + id)) { if (st.estado === 'correndo') { st.mov = movAgora(); marcaMov = 0; st.estado = 'pausado'; salvar(); } encerrar(); window.removeEventListener('hashchange', sairRota); } };
  window.addEventListener('hashchange', sairRota);
}

/* ---------- marcas de relógio: Garmin pela API oficial; as outras pelo Intervals.icu ---------- */
const MARCAS = [['garmin', 'Garmin'], ['coros', 'Coros'], ['polar', 'Polar'], ['suunto', 'Suunto'], ['wahoo', 'Wahoo'], ['outro', 'Outro relógio']];
const MARCA_NOME = Object.fromEntries(MARCAS);
// logo oficial se o arquivo existir em icons/marcas/<marca>.png; senão, o nome da marca
const marcaLogo = (k, nome) => k === 'outro' ? `<span class="marca-txt outro">${I.plus}<small>${nome}</small></span>` : `<img class="marca-img" src="icons/marcas/${k}.png" alt="${nome}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'marca-txt',textContent:'${nome}'}))">`;
function abrirMarca(k, garm, integ, marcaInt, recarregar) {
  const nome = MARCA_NOME[k];
  const fechar = () => { closeSheet(); recarregar(); };
  if (k === 'garmin') {
    openSheet(`<div class="marca-topo">${marcaLogo(k, nome)}</div><div class="h2" style="margin-top:12px">Garmin</div>
      ${integ && !garm ? `<p class="aviso-dup">Você já conectou um relógio pelo Intervals.icu. Se esse relógio também for Garmin, use só uma das conexões para as corridas não entrarem duas vezes.</p>` : ''}
      <div id="m-box" style="margin-top:12px">${garminCardHTML(garm, false)}</div>`, (r) => bindGarmin(r.querySelector('#m-box'), fechar));
    return;
  }
  if (k === 'outro') {
    openSheet(`<div class="h2">Outro relógio</div><p class="small muted" style="margin-top:6px">Amazfit, Apple Watch, Samsung, Xiaomi ou app de celular: envie o arquivo da corrida ou digite os dados.</p>
      <button class="btn block" id="m-arq" style="margin-top:16px">${I.plus} Registrar uma corrida</button>
      <p class="tiny dim" style="margin-top:12px"><b>Apple Watch:</b> o app HealthFit (iPhone) exporta a corrida em .FIT. <b>Amazfit/Zepp:</b> exporte pelo Strava ou pelo próprio app em .GPX.</p>`, (r) => { r.querySelector('#m-arq').onclick = () => { closeSheet(); registrarCorrida(S.user.id, (id) => { location.hash = '#/corrida/' + id; }); }; });
    return;
  }
  const ligado = integ && (!marcaInt || marcaInt === k);
  openSheet(`<div class="marca-topo">${marcaLogo(k, nome)}</div><div class="h2" style="margin-top:12px">${nome}</div>
    ${garm ? `<p class="aviso-dup">Você já conectou um Garmin. Se for usar o ${nome}, desconecte o Garmin para as corridas não entrarem duas vezes.</p>` : ''}
    ${ligado ? `<div id="m-box" style="margin-top:12px">${intervalsCardHTML(integ, false).replace('Intervals.icu conectado ✓', `${nome} conectado ✓ <span class="tiny dim">pelo Intervals.icu</span>`)}</div>`
      : integ ? `<p class="aviso-dup">Você já tem um relógio conectado pelo Intervals.icu. Para trocar para o ${nome}, conecte o ${nome} lá no Intervals (Configurações → Conexões). As corridas dele já vão chegar por esta mesma conexão.</p>`
      : `<p class="small muted" style="margin-top:6px">O ${nome} chega ao app pelo <b>Intervals.icu</b>, um site gratuito que recebe as corridas do seu relógio. É só fazer uma vez:</p>
      <ol class="passos-marca">
        <li>Crie uma conta grátis no <a href="https://intervals.icu" target="_blank" rel="noopener">intervals.icu</a> (pode entrar com o Google).</li>
        <li>Lá, abra <b>Configurações → Conexões</b> e conecte o seu <b>${nome}</b>.</li>
        <li>Volte aqui e toque no botão abaixo para autorizar.</li></ol>
      <div id="m-box"><button class="btn block" id="int-on">Conectar ${nome}</button></div>
      <p class="tiny dim" style="margin-top:8px">Depois de conectado, cada corrida nova entra no app com gráficos, voltas, zonas e mapa.</p>`}`, (r) => {
    const on = r.querySelector('#int-on'); if (on) on.addEventListener('click', () => { try { localStorage.setItem('nx-marca', k); } catch {} }, true);
    const box = r.querySelector('#m-box'); if (box) bindIntervals(box, integ, false, S.user.id, fechar);
  });
}

/* ---------- Garmin Connect (conexão oficial) ---------- */
const RELOGIO_IC = '<svg class="rel-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 9.5V12l1.5 1.5"/></svg>';
/** converte um treino da planilha para o formato de passos enviado ao Garmin */
function garminItem(p, perfil) {
  const est = estruturaDe(p); if (!est.length) return null;
  const INT = { aq: 'WARMUP', dq: 'COOLDOWN', rc: 'RECOVERY', co: 'INTERVAL' };
  const conv = (s, emSerie) => {
    const zi = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
    const [pmin, pmax] = faixaZona(s.z, perfil); // todo passo leva a faixa de pace como alvo, inclusive a recuperação
    return { int: s.k === 'co' && !emSerie ? 'ACTIVE' : (INT[s.k] || 'ACTIVE'), dur: s.med === 'min' ? 'TIME' : 'DISTANCE', valor: s.med === 'km' ? s.v * 1000 : s.med === 'm' ? s.v : s.v * 60, pmin: pmin && Math.round(pmin), pmax: pmax && Math.round(pmax), nota: `${zi.z} ${zi.d} · ${fmtPace(pmin).replace('/km', '')}–${fmtPace(pmax)}`.slice(0, 100) };
  };
  const tot = estimaTotal(est, perfil);
  // o treino estruturado por escrito, na mesma ordem do app (aparece no Garmin Connect)
  const NOMES = { aq: 'Aquecimento', co: 'Corrida', rc: 'Recuperação', dq: 'Desaquecimento' };
  const linhaPasso = (x) => { const zi = ZONAS_INFO[x.z] || ZONAS_INFO.leve; const [a, b] = faixaZona(x.z, perfil); return `${NOMES[x.k] || 'Corrida'} ${medTxt(x)} · ${zi.z} ${zi.d}${a && b ? ` (${fmtPace(a).replace('/km', '')}–${fmtPace(b)})` : ''}`; };
  const estruturaTxt = est.map((x, i) => x.k === 'rep' ? `${i + 1}. Repetir ${x.n || 1}×:\n${(x.passos || []).map((y) => `   • ${linhaPasso(y)}`).join('\n')}` : `${i + 1}. ${linhaPasso(x)}`).join('\n');
  const montar = (sobre) => [`TREINO\n${estruturaTxt}`, `Total est.: ${tot.soDist ? '' : '≈ '}${tot.km} · ${tot.soTempo ? '' : '≈ '}${tot.tempo}`, p.descricao ? 'Treinador: ' + p.descricao : '', sobre].filter(Boolean).join('\n\n');
  // o Garmin aceita até 500 letras: o texto sobre o tipo de treino sai primeiro se não couber
  let desc = montar(sobreTreino(p.tipo)); if (desc.length > 500) desc = montar('');
  return { plano_id: p.id, data: p.data, nome: p.titulo || nomeTipo(p.tipo), descricao: desc, passos: est.map((s) => s.k === 'rep' ? { repetir: s.n || 1, passos: (s.passos || []).map((x) => conv(x, true)) } : conv(s, false)) };
}
/** manda ao Garmin os treinos liberados (de hoje em diante) que ainda não estão lá — uma vez por sessão por aluno */
async function sincronizarGarmin(alunoId, planos, perfil, staff) {
  const chave = 'garSync:' + alunoId; S.cache.garSync = S.cache.garSync || {};
  const GARMIN_FMT = '2026-11-04T03:05:00Z'; // mudou o que vai para o relógio: o que foi antes disso é reenviado
  const pend = (planos || []).filter((p) => p.liberado !== false && !semCorrida(p) && p.data >= hojeISO() && (!p.garmin_workout_id || (p.garmin_enviado_em && p.garmin_enviado_em < GARMIN_FMT)) && estruturaDe(p).length && !(S.cache.garSync[chave] || []).includes(p.id));
  if (!pend.length) return 0;
  S.cache.garSync[chave] = [...(S.cache.garSync[chave] || []), ...pend.map((p) => p.id)];
  try {
    const r = await enviarGarmin(alunoId, pend, perfil);
    if (r.enviados) toast(staff ? `${r.enviados} treino${r.enviados > 1 ? 's' : ''} enviado${r.enviados > 1 ? 's' : ''} ao Garmin do aluno ⌚` : `${r.enviados} treino${r.enviados > 1 ? 's' : ''} da sua planilha ${r.enviados > 1 ? 'foram' : 'foi'} para o seu Garmin ⌚`);
    return r.enviados || 0;
  } catch { return 0; }
}
async function enviarGarmin(alunoId, planos, perfil) {
  const itens = planos.filter((p) => !semCorrida(p) && p.liberado !== false && p.data >= hojeISO()).map((p) => garminItem(p, perfil)).filter(Boolean);
  if (!itens.length) return { enviados: 0 };
  return chamarGarmin({ acao: 'enviar_treinos', aluno_id: alunoId, itens });
}
function garminCardHTML(g, staff) {
  if (g) return `<div class="card garmin-card on"><div class="row between" style="gap:12px"><div style="min-width:0"><b>Garmin conectado ✓</b><p class="small muted">${g.erro ? `<span style="color:var(--warn)">${esc(g.erro)}</span>` : g.ultima_sync ? 'Última corrida recebida ' + quando(g.ultima_sync) + ' às ' + fmtHora(g.ultima_sync) : 'As próximas corridas do relógio chegam aqui sozinhas.'}</p></div>${staff ? '' : '<button class="link-btn small" id="gar-off">Desconectar</button>'}</div></div>`;
  if (staff) return '<div class="card"><p class="small muted">O aluno ainda não conectou o Garmin. Ele faz isso na aba Conexões, com um toque.</p></div>';
  return `<div class="card garmin-card"><b>Tem relógio Garmin?</b><p class="small muted" style="margin-top:4px">Conecte uma vez e cada corrida que você terminar no relógio entra sozinha aqui, já ligada ao treino do dia, com pace, frequência cardíaca, parciais e percurso.</p>
    <button class="btn sm" id="gar-on" style="margin-top:12px">Conectar Garmin</button>
    <p class="tiny dim" style="margin-top:8px">Você autoriza na tela oficial da Garmin e pode desconectar quando quiser. Só entram as atividades feitas depois da conexão.</p></div>`;
}
async function chamarGarmin(body) {
  const { data, error } = await sb.functions.invoke('nx-garmin', { body: { org_id: S.org.id, ...body } });
  if (error) { let msg = 'Não foi possível falar com o Garmin agora.'; try { const j = await error.context.json(); if (j?.erro) msg = j.erro; } catch {} throw new Error(msg); }
  if (data?.erro) throw new Error(data.erro);
  return data;
}
function bindGarmin(el, recarregar) {
  const on = el.querySelector('#gar-on'), off = el.querySelector('#gar-off');
  if (on) on.onclick = async () => {
    on.disabled = true;
    try {
      const r = await chamarGarmin({ acao: 'iniciar', retorno: location.origin + location.pathname });
      if (!r.configurado) { on.disabled = false; return openSheet(`<div class="h2">Quase lá</div><p class="muted" style="margin:10px 0 18px">A conexão com o Garmin está aguardando a liberação final da Garmin para o app da Nexos. Assim que sair, este botão passa a funcionar. Enquanto isso, registre as corridas enviando o arquivo do relógio.</p><button class="btn block" data-close>Entendi</button>`); }
      location.href = r.url;
    } catch (e) { on.disabled = false; toast(e.message, true); }
  };
  if (off) off.onclick = async () => { if (!confirm('Desconectar o Garmin? As corridas que já chegaram continuam no app e os treinos param de ir para o relógio.')) return; try { await chamarGarmin({ acao: 'desconectar' }); toast('Garmin desconectado.'); recarregar(); } catch (e) { toast(e.message, true); } };
}
async function chamarIntervals(body) {
  const { data, error } = await sb.functions.invoke('nx-intervals', { body: { org_id: S.org.id, ...body } });
  if (error) { let msg = 'Não foi possível falar com o Intervals.icu agora.'; try { const j = await error.context.json(); if (j?.erro) msg = j.erro; } catch {} throw new Error(msg); }
  if (data?.erro) throw new Error(data.erro);
  return data;
}
async function sincronizarIntervals(alunoId) { const r = await chamarIntervals({ acao: 'sync', aluno_id: alunoId }); return r.novas || 0; }
function bindIntervals(el, integ, staff, alunoId, recarregar) {
  const on = el.querySelector('#int-on'), sy = el.querySelector('#int-sync'), off = el.querySelector('#int-off');
  if (on) on.onclick = async () => {
    on.disabled = true;
    try {
      const r = await chamarIntervals({ acao: 'iniciar', retorno: location.origin + location.pathname });
      if (!r.configurado) { on.disabled = false; return openSheet(`<div class="h2">Quase lá</div><p class="muted" style="margin:10px 0 18px">A conexão com o Intervals.icu está aguardando a aprovação do aplicativo da Nexos pelo Intervals. Assim que for aprovada, este botão passa a funcionar. Enquanto isso, registre as corridas enviando o arquivo do relógio.</p><button class="btn block" data-close>Entendi</button>`); }
      location.href = r.url;
    } catch (e) { on.disabled = false; toast(e.message, true); }
  };
  if (sy) sy.onclick = async () => { sy.disabled = true; sy.textContent = 'Sincronizando…'; try { const n = await sincronizarIntervals(alunoId); toast(n ? `${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''}!` : 'Nenhuma corrida nova.'); recarregar(); } catch (e) { toast(e.message, true); sy.disabled = false; sy.textContent = 'Sincronizar'; } };
  if (off) off.onclick = async () => { if (!confirm('Desconectar o Intervals.icu? As corridas já importadas continuam no app.')) return; try { await chamarIntervals({ acao: 'desconectar' }); toast('Intervals.icu desconectado.'); recarregar(); } catch (e) { toast(e.message, true); } };
}

/* ================= FINANCEIRO: planos, mensalidades e Pix ================= */
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const CICLOS = [[1, 'Mensal'], [3, 'Trimestral'], [6, 'Semestral'], [12, 'Anual']];
const FORMAS = [['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao', 'Cartão'], ['transferencia', 'Transferência']];
const brl = (v) => (+v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const compDe = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const somaMes = (comp, n) => { const [y, m] = comp.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return compDe(d); };
const nomeMes = (comp) => { const [y, m] = comp.split('-').map(Number); return `${MESES_LONGOS[m - 1]} ${y}`; };
const mesesEntre = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };
function statusCob(c) {
  if (c.status === 'paga') return { k: 'paga', l: 'Paga', cls: 'ok' };
  if (c.status === 'cancelada') return { k: 'cancelada', l: 'Cancelada', cls: '' };
  if (c.status === 'informada') return { k: 'informada', l: 'Avisou que pagou', cls: 'acc' };
  return c.vencimento < hojeISO() ? { k: 'atrasada', l: 'Atrasada', cls: 'err' } : { k: 'aberta', l: 'A receber', cls: 'warn' };
}
function quandoVence(c) {
  const st = statusCob(c);
  if (st.k === 'paga') return `paga em ${fmtData(c.pago_em || c.vencimento)}${c.forma ? ' · ' + ((FORMAS.find((f) => f[0] === c.forma) || [, c.forma])[1]) : ''}`;
  if (st.k === 'cancelada') return 'cancelada';
  const d = Math.round((dia(c.vencimento) - dia(hojeISO())) / 864e5);
  if (d < 0) return `venceu há ${-d} dia${d < -1 ? 's' : ''}`;
  if (d === 0) return 'vence hoje';
  return `vence ${fmtData(c.vencimento + 'T12:00:00')}`;
}

/* ---------- Pix copia e cola (BR Code estático) ---------- */
const pixTexto = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 .,@+\-_]/g, '').trim();
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) { crc ^= str.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function chavePix(ch) {
  ch = String(ch || '').trim();
  if (ch.includes('@')) return ch.toLowerCase();
  const d = ch.replace(/\D/g, '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ch)) return ch.toLowerCase();
  if (ch.startsWith('+')) return '+' + d;
  if (d.length === 11 && /^\d{2}9/.test(d) && !/^\d{3}\.\d{3}/.test(ch)) return '+55' + d; // celular
  return d.length >= 11 ? d : ch;
}
function pixCopiaECola({ chave, nome, cidade, valor, txid }) {
  const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const conta = f('00', 'br.gov.bcb.pix') + f('01', chavePix(chave));
  let p = f('00', '01') + f('26', conta) + f('52', '0000') + f('53', '986');
  if (valor) p += f('54', (+valor).toFixed(2));
  p += f('58', 'BR') + f('59', pixTexto(nome).toUpperCase().slice(0, 25) || 'NEXOS') + f('60', pixTexto(cidade).toUpperCase().slice(0, 15) || 'SAO LUIS');
  p += f('62', f('05', (String(txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)) || '***'));
  p += '6304';
  return p + crc16(p);
}
let qrCarregando = null;
function carregarQR() {
  if (window.qrcode) return Promise.resolve();
  if (!qrCarregando) qrCarregando = new Promise((ok, err) => { const s = document.createElement('script'); s.src = 'qr.js'; s.onload = ok; s.onerror = () => { qrCarregando = null; err(new Error('qr')); }; document.head.appendChild(s); });
  return qrCarregando;
}
async function qrSVG(texto) {
  await carregarQR();
  const q = window.qrcode(0, 'M'); q.addData(texto); q.make();
  return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

/* ---------- geração das mensalidades do mês ---------- */
async function carregarFinanceiroBase() {
  const [{ data: planos }, { data: alunos }] = await Promise.all([
    sb.from('nx_planos').select('*').eq('org_id', S.org.id).order('valor'),
    sb.from('nx_membros').select('user_id,nome,ativo,telefone,financeiro,treinador_id').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome'),
  ]);
  return { planos: planos || [], alunos: (alunos || []).filter(ehMeuAluno) }; // financeiro de cada treinador: só os próprios alunos
}
async function gerarCobrancas(comp, base, soAluno) {
  if (mesesEntre(compDe(), comp) > 1) return 0;
  const { data: existentes } = await sb.from('nx_cobrancas').select('aluno_id').eq('org_id', S.org.id).eq('competencia', comp);
  const ja = new Set((existentes || []).map((c) => c.aluno_id));
  const [y, m] = comp.split('-').map(Number); const ultimo = new Date(y, m, 0).getDate();
  const novas = [];
  base.alunos.forEach((a) => {
    if (soAluno && a.user_id !== soAluno) return;
    const fz = a.financeiro || {}; if (!a.ativo || !fz.plano_id || ja.has(a.user_id)) return;
    const pl = base.planos.find((p) => p.id === fz.plano_id); if (!pl) return;
    const ini = fz.inicio || comp; const dm = mesesEntre(ini, comp);
    if (dm < 0 || dm % (pl.meses || 1) !== 0) return;
    const diaV = Math.min(+fz.dia || 10, ultimo);
    novas.push({ org_id: S.org.id, aluno_id: a.user_id, plano_id: pl.id, competencia: comp, descricao: `${pl.nome} · ${nomeMes(comp)}`, valor: fz.valor != null && fz.valor !== '' ? +fz.valor : +pl.valor, vencimento: `${comp}-${String(diaV).padStart(2, '0')}` });
  });
  if (novas.length) await sb.from('nx_cobrancas').insert(novas);
  return novas.length;
}

/* ---------- tela Financeiro (treinador) ---------- */
async function staffFinanceiro() {
  loading();
  const st = S.cache.fin || (S.cache.fin = { comp: compDe(), filtro: 'todas' });
  const base = await carregarFinanceiroBase();
  await gerarCobrancas(st.comp, base);
  const { data: cobsT } = await sb.from('nx_cobrancas').select('*').eq('org_id', S.org.id).eq('competencia', st.comp).order('vencimento');
  const nome = Object.fromEntries(base.alunos.map((a) => [a.user_id, a]));
  const lista = (cobsT || []).filter((c) => c.status !== 'cancelada' && nome[c.aluno_id]);
  const tot = { pago: 0, aberto: 0, atraso: 0 };
  lista.forEach((c) => { const k = statusCob(c).k; if (k === 'paga') tot.pago += +c.valor; else if (k === 'atrasada') tot.atraso += +c.valor; else tot.aberto += +c.valor; });
  const semPlano = base.alunos.filter((a) => a.ativo && !(a.financeiro || {}).plano_id);
  const pix = (S.org.config || {}).pix || {};
  const atrasadas = lista.filter((c) => statusCob(c).k === 'atrasada');
  const filtros = [['todas', 'Todas'], ['receber', 'A receber'], ['atrasada', 'Atrasadas'], ['informada', 'Avisaram'], ['paga', 'Pagas']];
  const passa = (c) => { const k = statusCob(c).k; return st.filtro === 'todas' || (st.filtro === 'receber' ? k === 'aberta' : k === st.filtro); };
  $app.innerHTML = `
    <div class="row between"><div><p class="eyebrow">Financeiro</p><h1 class="h1">Mensalidades</h1></div><button class="icon-btn" id="fin-cfg" aria-label="Planos e Pix">${I.gear}</button></div>
    <div class="mes-nav"><button class="icon-btn sm" id="m-a" aria-label="Mês anterior">${I.back}</button><b>${nomeMes(st.comp)}</b><button class="icon-btn sm" id="m-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
    <div class="fin-tot"><div class="ok"><span>Recebido</span><b>${brl(tot.pago)}</b></div><div><span>A receber</span><b>${brl(tot.aberto)}</b></div><div class="${tot.atraso ? 'err' : ''}"><span>Atrasado</span><b>${brl(tot.atraso)}</b></div></div>
    ${!pix.chave ? `<button class="aviso-linha" id="cfg-pix">${I.bell}<span><b>Cadastre a chave Pix da Nexos</b> para o aluno pagar pelo app.</span>${I.chev}</button>` : ''}
    ${!base.planos.length ? `<button class="aviso-linha" id="cfg-planos">${I.plus}<span><b>Crie os planos</b> (ex.: Corrida mensal R$ 150) para gerar as mensalidades.</span>${I.chev}</button>`
      : semPlano.length ? `<button class="aviso-linha" id="sem-plano">${I.users}<span><b>${semPlano.length} aluno${semPlano.length > 1 ? 's' : ''} sem plano</b>: defina para gerar a mensalidade.</span>${I.chev}</button>` : ''}
    <div class="row between" style="margin-top:18px;gap:10px;flex-wrap:wrap"><div class="chips" id="fin-f">${filtros.map(([k, l]) => `<button class="chip ${st.filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      ${atrasadas.length ? `<button class="btn ghost sm" id="lembrar-todos">${I.bell} Lembrar atrasados (${atrasadas.length})</button>` : ''}</div>
    <div class="stack" style="margin-top:12px" id="fin-l">${lista.filter(passa).map((c) => { const s = statusCob(c); const a = nome[c.aluno_id] || {}; return `<div class="list-item cob" data-cob="${c.id}"><div class="av">${esc(initials(a.nome))}</div><div class="grow"><b class="ellip" style="display:block">${esc(a.nome || 'Aluno')}</b><span class="small muted">${quandoVence(c)}</span></div><div class="cob-v"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div>${s.k === 'informada' ? `<button class="mini-acao ok" data-conf="${c.id}" aria-label="Confirmar pagamento">${I.check}</button>` : s.k === 'paga' ? '' : `<button class="mini-acao" data-lemb="${c.id}" aria-label="Lembrar aluno">${I.bell}</button>`}</div>`; }).join('')
      || `<div class="empty"><div class="h3">${lista.length ? 'Nada neste filtro' : 'Nenhuma mensalidade neste mês'}</div><p class="small">${lista.length ? '' : base.planos.length ? 'Defina o plano dos alunos para as mensalidades aparecerem aqui.' : 'Comece criando os planos da Nexos.'}</p></div>`}</div>`;
  const ir = (n) => { st.comp = somaMes(st.comp, n); staffFinanceiro(); };
  document.getElementById('m-a').onclick = () => ir(-1);
  document.getElementById('m-p').onclick = () => ir(1);
  document.getElementById('fin-f').onclick = (e) => { const b = e.target.closest('[data-f]'); if (b) { st.filtro = b.dataset.f; staffFinanceiro(); } };
  document.getElementById('fin-cfg').onclick = () => ajustesFinanceiro(base);
  ['cfg-pix', 'cfg-planos'].forEach((id) => { const b = document.getElementById(id); if (b) b.onclick = () => ajustesFinanceiro(base); });
  const sp = document.getElementById('sem-plano');
  if (sp) sp.onclick = () => openSheet(`<div class="h2">Alunos sem plano</div><p class="small muted" style="margin:6px 0 12px">Toque no aluno para definir o plano em “Dados”.</p>${semPlano.map((a) => `<a class="list-item" href="#/aluno/${a.user_id}/dados" style="color:inherit"><div class="av">${esc(initials(a.nome))}</div><b class="grow">${esc(a.nome)}</b>${I.chev}</a>`).join('')}`);
  const lt = document.getElementById('lembrar-todos');
  if (lt) lt.onclick = async () => { for (const c of atrasadas) await lembrarCobranca(c, nome[c.aluno_id], true); toast(`Lembrete enviado para ${atrasadas.length} aluno${atrasadas.length > 1 ? 's' : ''}.`); staffFinanceiro(); };
  document.getElementById('fin-l').onclick = async (e) => {
    const conf = e.target.closest('[data-conf]'), lemb = e.target.closest('[data-lemb]'), row = e.target.closest('[data-cob]');
    if (conf) { e.stopPropagation(); await marcarPaga(lista.find((c) => c.id === conf.dataset.conf), 'pix'); return; }
    if (lemb) { e.stopPropagation(); const c = lista.find((x) => x.id === lemb.dataset.lemb); return lembrarCobranca(c, nome[c.aluno_id]); }
    if (row) detalheCobranca(lista.find((c) => c.id === row.dataset.cob), nome[lista.find((c) => c.id === row.dataset.cob).aluno_id] || {});
  };
}
async function marcarPaga(c, forma, depois) {
  const { error } = await sb.from('nx_cobrancas').update({ status: 'paga', forma, pago_em: new Date().toISOString() }).eq('id', c.id);
  if (error) return toast('Não foi possível registrar.', true);
  toast('Pagamento registrado ✓'); closeSheet(); (depois || staffFinanceiro)();
}
async function lembrarCobranca(c, aluno, silencioso) {
  notificar('cobranca', c.id);
  await sb.from('nx_cobrancas').update({ lembrete_em: new Date().toISOString() }).eq('id', c.id);
  if (silencioso) return;
  const pix = (S.org.config || {}).pix || {};
  const tel = String((aluno || {}).telefone || '').replace(/\D/g, '');
  const msg = `Olá, ${firstName((aluno || {}).nome)}! Passando para lembrar da mensalidade da Nexos de ${brl(c.valor)}, ${quandoVence(c)}.${pix.chave ? `\n\nPix copia e cola:\n${pixCopiaECola({ ...pix, valor: c.valor, txid: 'NX' + c.competencia.replace('-', '') })}` : ''}\n\nVocê também pode pagar pelo app. Obrigado!`;
  openSheet(`<div class="h2">Lembrete enviado no app</div><p class="small muted" style="margin:6px 0 16px">${esc(firstName((aluno || {}).nome))} recebe uma notificação (se ativou no celular). Quer mandar também pelo WhatsApp?</p>
    <a class="btn block" style="background:#25d366;color:#04122b" href="https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${I.wa} Enviar pelo WhatsApp</a>
    <button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`);
}
function detalheCobranca(c, aluno, depois) {
  const s = statusCob(c); depois = depois || staffFinanceiro;
  openSheet(`<p class="eyebrow">${esc(c.descricao || nomeMes(c.competencia))}</p><div class="h2" style="margin-top:4px">${esc(aluno.nome || 'Aluno')}</div>
    <div class="cob-det"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div><p class="small muted">${quandoVence(c)}${c.informada_em && s.k === 'informada' ? ` · avisou ${quando(c.informada_em)}` : ''}${c.lembrete_em ? ` · último lembrete ${quando(c.lembrete_em)}` : ''}</p>
    ${s.k !== 'paga' ? `<div class="card" style="margin-top:16px"><b>Registrar pagamento</b><div class="seg four" id="formas" style="margin-top:12px">${FORMAS.map(([k, l]) => `<button type="button" data-forma="${k}">${l}</button>`).join('')}</div></div>
      <button class="btn ghost block" id="d-lemb" style="margin-top:12px">${I.bell} Lembrar o aluno</button>`
      : '<button class="btn ghost block" id="d-desf" style="margin-top:16px">Desfazer pagamento</button>'}
    <details class="ajuda" style="margin-top:16px"><summary>Editar valor ou vencimento</summary>
      <div class="grid2" style="margin-top:12px"><label class="field"><span>Valor (R$)</span><input class="input" id="d-val" data-mask="dec" inputmode="decimal" value="${String(c.valor).replace('.', ',')}"></label><label class="field"><span>Vencimento</span><input class="input" type="date" id="d-ven" value="${c.vencimento}"></label></div>
      <div class="row between"><button class="btn sm" id="d-salvar">Salvar</button><button class="link-btn small" id="d-canc" style="color:var(--err)">Cancelar esta cobrança</button></div></details>`, (r) => {
    const fm = r.querySelector('#formas'); if (fm) fm.onclick = (e) => { const b = e.target.closest('[data-forma]'); if (b) marcarPaga(c, b.dataset.forma, depois); };
    const lb = r.querySelector('#d-lemb'); if (lb) lb.onclick = () => lembrarCobranca(c, aluno);
    const df = r.querySelector('#d-desf'); if (df) df.onclick = async () => { await sb.from('nx_cobrancas').update({ status: 'aberta', pago_em: null, forma: null }).eq('id', c.id); toast('Pagamento desfeito.'); closeSheet(); depois(); };
    r.querySelector('#d-salvar').onclick = async () => { const v = num(r.querySelector('#d-val').value); if (v == null) return toast('Valor inválido.', true); const { error } = await sb.from('nx_cobrancas').update({ valor: v, vencimento: r.querySelector('#d-ven').value || c.vencimento }).eq('id', c.id); if (error) return toast('Não foi possível salvar.', true); toast('Cobrança atualizada.'); closeSheet(); depois(); };
    r.querySelector('#d-canc').onclick = async () => { if (!confirm('Cancelar esta cobrança?')) return; await sb.from('nx_cobrancas').update({ status: 'cancelada' }).eq('id', c.id); toast('Cobrança cancelada.'); closeSheet(); depois(); };
  });
}
function ajustesFinanceiro(base) {
  const pix = (S.org.config || {}).pix || {};
  const admin = S.me.papel === 'admin';
  const desenhar = (r) => {
    r.querySelector('#pl-l').innerHTML = base.planos.length ? base.planos.map((p) => `<div class="list-item" data-pl="${p.id}"><div class="grow"><b>${esc(p.nome)}</b><div class="small muted">${brl(p.valor)} · ${(CICLOS.find((c) => c[0] === p.meses) || [, 'Mensal'])[1]}${p.ativo ? '' : ' · inativo'}</div></div>${I.chev}</div>`).join('') : '<p class="small muted">Nenhum plano ainda.</p>';
  };
  openSheet(`<p class="eyebrow">Ajustes do financeiro</p>
    <div class="section" style="margin-top:12px"><div class="section-h"><h2 class="h2">Planos</h2><button class="btn sm" id="pl-novo">${I.plus} Novo plano</button></div><div id="pl-l" class="stack"></div></div>
    <div class="section"><div class="section-h"><h2 class="h2">Pix da Nexos</h2></div>
      ${admin ? `<form id="f-pix"><label class="field"><span>Chave Pix</span><input class="input" name="chave" value="${esc(pix.chave || '')}" placeholder="CNPJ, e-mail, chave aleatória ou celular (+5598…)" required></label>
      <div class="grid2"><label class="field"><span>Nome do recebedor</span><input class="input" name="nome" value="${esc(pix.nome || '')}" placeholder="Como aparece no banco" required></label><label class="field"><span>Cidade</span><input class="input" name="cidade" value="${esc(pix.cidade || 'São Luís')}" required></label></div>
      <p class="tiny dim" style="margin:-4px 0 12px">O app gera o QR Code e o “copia e cola” com o valor certo. O dinheiro cai direto na conta da chave.</p>
      <button class="btn block">Salvar Pix</button></form>` : `<p class="small muted">${pix.chave ? 'Chave cadastrada: ' + esc(pix.chave) : 'Peça ao administrador para cadastrar a chave Pix.'}</p>`}</div>`, (r) => {
    desenhar(r);
    const formPlano = (p) => openSheet(`<p class="eyebrow">${p ? 'Editar plano' : 'Novo plano'}</p><form id="f-pl" style="margin-top:12px">
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(p ? p.nome : '')}" placeholder="Ex.: Corrida mensal" required></label>
      <div class="grid2"><label class="field"><span>Valor (R$)</span><input class="input" name="valor" data-mask="dec" inputmode="decimal" value="${p ? String(p.valor).replace('.', ',') : ''}" required></label><label class="field"><span>Cobrança</span><select class="input" name="meses">${CICLOS.map(([k, l]) => `<option value="${k}" ${p && p.meses === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      ${p ? `<label class="aceite" style="padding:4px 0 12px"><input type="checkbox" name="ativo" ${p.ativo ? 'checked' : ''}><span>Plano ativo</span></label>` : ''}
      <button class="btn block">Salvar plano</button>${p ? '<button type="button" class="link-btn small" id="pl-del" style="margin-top:10px;color:var(--err)">Excluir plano</button>' : ''}</form>`, (r2) => {
      const f = r2.querySelector('#f-pl');
      f.onsubmit = async (e) => {
        e.preventDefault(); const valor = num(f.valor.value); if (valor == null) return toast('Valor inválido.', true);
        const row = { nome: f.nome.value.trim(), valor, meses: +f.meses.value, ...(p ? { ativo: f.ativo.checked } : {}) };
        const q = p ? await sb.from('nx_planos').update(row).eq('id', p.id).select('*').single() : await sb.from('nx_planos').insert({ ...row, org_id: S.org.id }).select('*').single();
        if (q.error) return toast('Não foi possível salvar.', true);
        if (p) Object.assign(p, q.data || row); else base.planos.push(q.data);
        toast('Plano salvo!'); closeSheet(); location.hash === '#/financeiro' ? staffFinanceiro() : null;
      };
      const del = r2.querySelector('#pl-del');
      if (del) del.onclick = async () => { if (!confirm('Excluir este plano? As mensalidades já geradas continuam.')) return; const { error } = await sb.from('nx_planos').delete().eq('id', p.id); if (error) return toast('Não foi possível excluir.', true); toast('Plano excluído.'); closeSheet(); staffFinanceiro(); };
    });
    r.querySelector('#pl-novo').onclick = () => formPlano(null);
    r.querySelector('#pl-l').onclick = (e) => { const it = e.target.closest('[data-pl]'); if (it) formPlano(base.planos.find((p) => p.id === it.dataset.pl)); };
    const fp = r.querySelector('#f-pix');
    if (fp) fp.onsubmit = async (e) => {
      e.preventDefault(); const cfg = { ...(S.org.config || {}), pix: { chave: fp.chave.value.trim(), nome: fp.nome.value.trim(), cidade: fp.cidade.value.trim() } };
      const { error } = await sb.from('nx_orgs').update({ config: cfg }).eq('id', S.org.id);
      if (error) return toast('Não foi possível salvar.', true);
      S.org.config = cfg; toast('Pix salvo!'); closeSheet(); staffFinanceiro();
    };
  });
}
/** cartão “Plano e pagamento” na aba Dados do aluno */
async function planoDoAlunoHTML(m) {
  const base = await carregarFinanceiroBase();
  const { data: cobs } = await sb.from('nx_cobrancas').select('*').eq('org_id', S.org.id).eq('aluno_id', m.user_id).neq('status', 'cancelada').order('vencimento', { ascending: false }).limit(6);
  const fz = m.financeiro || {};
  return { base, cobs: cobs || [], html: `<div class="card" id="plano-card"><b>Plano e pagamento</b>
    ${base.planos.length ? `<form id="f-plano" style="margin-top:12px"><label class="field"><span>Plano</span><select class="input" name="plano"><option value="">Sem plano (não gera mensalidade)</option>${base.planos.filter((p) => p.ativo || p.id === fz.plano_id).map((p) => `<option value="${p.id}" ${fz.plano_id === p.id ? 'selected' : ''}>${esc(p.nome)} · ${brl(p.valor)}</option>`).join('')}</select></label>
      <div class="grid3"><label class="field"><span>Valor</span><input class="input" name="valor" data-mask="dec" inputmode="decimal" value="${fz.valor != null && fz.valor !== '' ? String(fz.valor).replace('.', ',') : ''}" placeholder="do plano"></label><label class="field"><span>Vence dia</span><input class="input" name="dia" data-mask="num" data-max="2" inputmode="numeric" value="${esc(fz.dia || 10)}"></label><label class="field"><span>Início</span><input class="input" type="month" name="inicio" value="${esc(fz.inicio || compDe())}"></label></div>
      <button class="btn ghost block sm">Salvar plano do aluno</button></form>` : '<p class="small muted" style="margin-top:6px">Crie os planos em Financeiro → Ajustes.</p>'}
    ${(cobs || []).length ? `<div class="stack" style="margin-top:12px">${cobs.map((c) => { const s = statusCob(c); return `<div class="cob-mini" data-cobm="${c.id}"><span>${esc(nomeMes(c.competencia))}</span><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div>`; }).join('')}</div>` : ''}</div>` };
}
function bindPlanoDoAluno(m, info, recarregar) {
  const f = document.getElementById('f-plano');
  if (f) f.onsubmit = async (e) => {
    e.preventDefault();
    const dd = Math.round(num(f.dia.value) || 10);
    if (dd < 1 || dd > 28) return toast('Use um dia de 1 a 28.', true);
    const financeiro = { plano_id: f.plano.value || null, valor: num(f.valor.value), dia: dd, inicio: f.inicio.value || compDe() };
    const { error } = await sb.from('nx_membros').update({ financeiro }).eq('org_id', S.org.id).eq('user_id', m.user_id);
    if (error) return toast('Não foi possível salvar.', true);
    m.financeiro = financeiro;
    const base = { ...info.base, alunos: [{ ...m, ativo: m.ativo }] };
    const n = await gerarCobrancas(compDe(), base, m.user_id);
    toast(n ? 'Plano salvo e mensalidade do mês gerada!' : 'Plano salvo!'); recarregar();
  };
  const card = document.getElementById('plano-card');
  if (card) card.addEventListener('click', (e) => { const r = e.target.closest('[data-cobm]'); if (r) detalheCobranca(info.cobs.find((c) => c.id === r.dataset.cobm), m, recarregar); });
}

/* ---------- lado do aluno ---------- */
async function minhaCobrancaPendente() {
  const { data } = await sb.from('nx_cobrancas').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).in('status', ['aberta', 'informada']).order('vencimento').limit(3);
  const lim = isoDia(Date.now() + 5 * 864e5);
  return (data || []).find((c) => c.status === 'informada' || c.vencimento <= lim) || null;
}
function cartaoCobrancaHTML(c) {
  if (!c) return '';
  const s = statusCob(c);
  if (s.k === 'informada') return `<div class="card cob-card info"><div class="row" style="gap:12px"><span class="go">${I.check}</span><div class="grow"><b>Pagamento informado</b><div class="small muted">Mensalidade de ${esc(nomeMes(c.competencia).split(' ')[0])} · aguardando confirmação do treinador</div></div></div></div>`;
  return `<div class="card cob-card ${s.k === 'atrasada' ? 'atraso' : ''}"><div class="row" style="gap:12px"><span class="go">${I.money}</span><div class="grow"><b>Mensalidade de ${esc(nomeMes(c.competencia).split(' ')[0])} · ${brl(c.valor)}</b><div class="small muted">${quandoVence(c)}</div></div><button class="btn sm" id="pagar-pix" data-cob="${c.id}">Pagar</button></div></div>`;
}
async function pagarComPix(c) {
  const { data: org } = await sb.from('nx_orgs').select('config').eq('id', S.org.id).maybeSingle();
  const pix = ((org && org.config) || {}).pix || {};
  if (!pix.chave) return openSheet('<div class="h2">Pix ainda não configurado</div><p class="muted" style="margin:10px 0 18px">Fale com o seu treinador para combinar o pagamento.</p><button class="btn block" data-close>Entendi</button>');
  const codigo = pixCopiaECola({ ...pix, valor: c.valor, txid: 'NX' + c.competencia.replace('-', '') });
  openSheet(`<p class="eyebrow">Pagar com Pix</p><div class="h2" style="margin-top:4px">${brl(c.valor)}</div><p class="small muted">${esc(c.descricao || '')} · para ${esc(pix.nome)}</p>
    <div class="qr-box" id="qr"><div class="boot-bar"><i></i></div></div>
    <label class="field"><span>Pix copia e cola</span><textarea class="textarea mono" id="pix-cod" readonly rows="3">${esc(codigo)}</textarea></label>
    <button class="btn block" id="copiar-pix">Copiar código Pix</button>
    <p class="tiny dim center" style="margin-top:8px">No app do banco: Pix → Pagar → Pix copia e cola (ou ler QR Code).</p>
    <button class="btn ghost block" id="ja-paguei" style="margin-top:16px">${I.check} Já paguei</button>`, async (r) => {
    try { r.querySelector('#qr').innerHTML = await qrSVG(codigo); } catch { r.querySelector('#qr').remove(); }
    r.querySelector('#copiar-pix').onclick = async () => { try { await navigator.clipboard.writeText(codigo); toast('Código copiado! Cole no app do banco.'); } catch { r.querySelector('#pix-cod').select(); toast('Selecione e copie o código.', true); } };
    r.querySelector('#ja-paguei').onclick = async () => {
      const { error } = await sb.rpc('nx_informar_pagamento', { cobranca: c.id });
      if (error) return toast('Não foi possível avisar agora.', true);
      notificar('pagamento', c.id); closeSheet(); toast('Obrigado! Seu treinador vai confirmar.'); router();
    };
  });
}
async function viewPagamentos() {
  loading();
  const { data } = await sb.from('nx_cobrancas').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).neq('status', 'cancelada').order('vencimento', { ascending: false }).limit(24);
  const l = data || [];
  $app.innerHTML = `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Pagamentos</p><h1 class="h1">Minhas mensalidades</h1>
    <div class="stack" style="margin-top:16px" id="pg-l">${l.map((c) => { const s = statusCob(c); return `<div class="list-item" ${s.k === 'aberta' || s.k === 'atrasada' ? `data-pagar="${c.id}"` : ''}><div class="grow"><b>${esc(nomeMes(c.competencia))}</b><div class="small muted">${quandoVence(c)}</div></div><div class="cob-v"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div></div>`; }).join('') || '<div class="empty"><div class="h3">Nenhuma mensalidade</div><p class="small">Quando houver mensalidade, ela aparece aqui.</p></div>'}</div>`;
  document.getElementById('pg-l').onclick = (e) => { const it = e.target.closest('[data-pagar]'); if (it) pagarComPix(l.find((c) => c.id === it.dataset.pagar)); };
}

/* ================= HOJE: o que pede atenção ================= */
/** treinador marca o treino como visto: o aluno recebe "Seu treinador analisou seu treino" */
// comentário do treinador sobre um treino (fica no treino, não vai para o chat)
function comentarTreino(c, al) {
  const tinha = !!c.comentario_treinador;
  openSheet(`<p class="eyebrow">Comentário sobre o treino</p><div class="h2" style="margin-top:4px">${esc(firstName((al && al.nome) || 'Aluno'))} · ${fmtKm(c.distancia_m)}</div>
    <p class="small muted" style="margin-top:6px">Aparece para o aluno dentro deste treino. Não vai para o chat.</p>
    <textarea class="textarea" id="ct-txt" rows="5" style="margin-top:12px" placeholder="Ex.: ótimo controle no ritmo dos tiros. Na recuperação, segure um pouco mais." autofocus>${esc(c.comentario_treinador || '')}</textarea>
    <button class="btn block" id="ct-salvar" style="margin-top:12px">${tinha ? 'Salvar comentário' : 'Enviar comentário'}</button>
    ${tinha ? '<button class="link-btn small" id="ct-apagar" style="margin:12px auto 0;display:block">Remover comentário</button>' : ''}`, (r) => {
    const enviar = async (texto) => {
      const bt = r.querySelector('#ct-salvar'); bt.disabled = true; bt.textContent = 'Enviando…';
      const { data, error } = await sb.functions.invoke('nx-push', { body: { acao: 'visto', tipo: 'corrida', id: c.id, comentario: texto } });
      if (error || (data && data.erro)) { bt.disabled = false; bt.textContent = 'Tentar de novo'; return toast((data && data.erro) || 'Não foi possível salvar agora.', true); }
      closeSheet(); toast(texto ? 'Comentário enviado! O aluno vê no treino.' : 'Comentário removido.');
      contarNaoVistos().then(dockStaff).catch(() => {});
      router();
    };
    r.querySelector('#ct-salvar').onclick = () => { const t = r.querySelector('#ct-txt').value.trim(); if (!t) return toast('Escreva o comentário.', true); enviar(t); };
    const ap = r.querySelector('#ct-apagar'); if (ap) ap.onclick = () => confirm('Remover o comentário deste treino?') && enviar('');
  });
}
async function marcarVisto(b) {
  const [tipo, id] = b.dataset.visto.split('|'); b.disabled = true; b.textContent = '…';
  const { data, error } = await sb.functions.invoke('nx-push', { body: { acao: 'visto', tipo, id } });
  if (error || (data && data.erro)) { b.disabled = false; b.innerHTML = `${I.check} Visto`; return toast((data && data.erro) || 'Não foi possível marcar agora.', true); }
  b.outerHTML = `<span class="visto-ok" title="Você já viu">${I.check}</span>`;
  toast('Visto! O aluno foi avisado que você analisou o treino.');
  contarNaoVistos().then(dockStaff).catch(() => {});
}
// separação por treinador: cada um vê só os próprios alunos (e os que ainda estão sem treinador, para alguém assumir)
const formMeu = (f) => !f.criado_por || f.criado_por === S.user.id;
const ehMeuAluno = (m) => !!m && (!m.treinador_id || m.treinador_id === S.user.id);
async function idsMeusAlunos() {
  const { data } = await sb.from('nx_membros').select('user_id,treinador_id').eq('org_id', S.org.id).eq('papel', 'aluno');
  return new Set((data || []).filter(ehMeuAluno).map((m) => m.user_id));
}
async function staffHoje() {
  loading();
  const seteDias = new Date(Date.now() - 7 * 864e5).toISOString();
  const segAtual = isoDia(inicioSemana()), segPass = somaDias(segAtual, -7), segProx = somaDias(segAtual, 7);
  const [{ data: membrosT }, sessT, corrT, anamsT, avsT, cobsT, provasEqT, planoResT, treinosResT, libsResT] = await Promise.all([
    sb.from('nx_membros').select('user_id,nome,email,ativo,aprovacao,pedido_em,objetivo,criado_em,sexo,treinador_id,foto_url,nascimento,telefone,modalidades,disponibilidade').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome'),
    buscarSessoes(null, 300),
    sb.from('nx_corridas').select('id,aluno_id,data,tipo,distancia_m,duracao_s,rpe,dor,dor_local,cansaco,sono,visto_treinador,plano_id').eq('org_id', S.org.id).order('data', { ascending: false }).limit(300).then((r) => r.data || []),
    sb.from('nx_anamneses').select('aluno_id,parq_positivo,visto_treinador,atestado_path').eq('org_id', S.org.id).then((r) => r.data || []),
    sb.from('nx_avaliacoes').select('aluno_id,data,proxima').eq('org_id', S.org.id).order('data', { ascending: false }).then((r) => r.data || []),
    sb.from('nx_cobrancas').select('id,aluno_id,valor,vencimento,status,competencia').eq('org_id', S.org.id).in('status', ['aberta', 'informada']).then((r) => r.data || []),
    sb.from('nx_participacoes').select('aluno_id,titulo,data,distancia').eq('org_id', S.org.id).gte('data', hojeISO()).lte('data', isoDia(Date.now() + 21 * 864e5)).order('data').then((r) => r.data || []).catch(() => []),
    sb.from('nx_plano_corrida').select('id,aluno_id,data,tipo,liberado').eq('org_id', S.org.id).gte('data', segPass).lte('data', somaDias(segProx, 6)).then((r) => r.data || []).catch(() => []),
    sb.from('nx_treinos').select('aluno_id,dias,ativo').eq('org_id', S.org.id).eq('ativo', true).then((r) => r.data || []).catch(() => []),
    sb.from('nx_forca_semanas').select('aluno_id,semana').eq('org_id', S.org.id).gte('semana', segPass).then((r) => r.data || []).catch(() => []),
    contarNaoVistos(), contarMsgNovas(),
  ]);
  const membros = (membrosT || []).filter(ehMeuAluno), vis = new Set(membros.map((m) => m.user_id)), soMeus = (l) => (l || []).filter((x) => vis.has(x.aluno_id));
  const [sess, corr, anams, avs, cobs, provasEq, planoRes, treinosRes, libsRes] = [sessT, corrT, anamsT, avsT, cobsT, provasEqT, planoResT, treinosResT, libsResT].map(soMeus);
  dockStaff();
  const fimPl = await fimPlanilhas();
  const ativos = (membros || []).filter((m) => m.ativo);
  const pendentes = (membros || []).filter((m) => m.aprovacao === 'pendente').sort((a, b) => ((a.pedido_em || '') < (b.pedido_em || '') ? 1 : -1));
  S.cache.pendentes = pendentes.length; dockStaff();
  const hoje = hojeISO();
  const ultimoTreino = {};
  sess.forEach((s) => { if (!ultimoTreino[s.aluno_id] || s.iniciado_em > ultimoTreino[s.aluno_id]) ultimoTreino[s.aluno_id] = s.iniciado_em; });
  corr.forEach((c) => { if (!ultimoTreino[c.aluno_id] || c.data > ultimoTreino[c.aluno_id]) ultimoTreino[c.aluno_id] = c.data; });
  const ultAval = {}; avs.forEach((a) => { if (!ultAval[a.aluno_id]) ultAval[a.aluno_id] = a; });
  const alertas = ativos.map((m) => {
    const id = m.user_id, l = [];
    const dorS = sess.find((s) => s.aluno_id === id && s.dor && !s.visto_treinador && s.iniciado_em > seteDias);
    const dorC = corr.find((c) => c.aluno_id === id && c.dor && !c.visto_treinador && c.data > seteDias);
    if (dorS || dorC) l.push({ p: 1, t: dorS && dorS.dor_local ? `Dor: ${dorS.dor_local}` : 'Relatou dor', cls: 'err', ir: dorS ? `#/aluno/${id}/historico` : `#/corrida/${dorC.id}` });
    // termômetro dos últimos 7 dias (check-ins de força e corrida)
    const ck = [...sess.filter((s) => s.aluno_id === id && s.iniciado_em > seteDias).map((s) => ({ e: s.esforco, dor: s.dor, c: s.cansaco, so: s.sono })),
      ...corr.filter((c) => c.aluno_id === id && c.data > seteDias).map((c) => ({ e: c.rpe, dor: c.dor, c: c.cansaco, so: c.sono }))];
    const esf = ck.filter((x) => x.e != null).map((x) => x.e);
    const ir = `#/aluno/${id}/historico`;
    if (!dorS && !dorC && ck.filter((x) => x.dor).length >= 2) l.push({ p: 1, t: 'Dor repetida na semana', cls: 'err', ir });
    if (esf.filter((e) => e >= 8).length >= 3 || (esf.length >= 3 && esf.reduce((a, b) => a + b, 0) / esf.length >= 7.5)) l.push({ p: 1, t: 'Sobrecarga: esforço alto', cls: 'err', ir });
    if (ck.filter((x) => x.c === 2).length >= 2) l.push({ p: 2, t: 'Muito cansado', cls: 'warn', ir });
    if (ck.filter((x) => x.so === 2).length >= 2) l.push({ p: 2, t: 'Dormindo mal', cls: 'warn', ir });
    const an = anams.find((a) => a.aluno_id === id);
    if (an && an.parq_positivo && !an.visto_treinador) l.push({ p: 1, t: 'PAR-Q com “sim”', cls: 'err', ir: `#/aluno/${id}/saude` });
    else if (an && an.parq_positivo && !an.atestado_path) l.push({ p: 3, t: 'Sem atestado médico', cls: 'warn', ir: `#/aluno/${id}/saude` });
    const pv = provasEq.find((x) => x.aluno_id === id);
    if (pv) { const dd = diasAte(pv.data); l.push({ p: 2, t: `Prova ${dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd < 7 ? `em ${dd} dias` : `em ${dd} dias`}`, cls: 'prova', ir: `#/aluno/${id}/corrida` }); }
    const msgs = (S.cache.msgPorAluno || {})[id];
    if (msgs) l.push({ p: 2, t: `${msgs} mensage${msgs > 1 ? 'ns' : 'm'}`, cls: 'acc', ir: `#/aluno/${id}/conversa` });
    const inf = cobs.find((c) => c.aluno_id === id && c.status === 'informada');
    if (inf) l.push({ p: 2, t: 'Avisou que pagou', cls: 'acc', ir: '#/financeiro', cob: inf.id });
    const atr = cobs.find((c) => c.aluno_id === id && c.status === 'aberta' && c.vencimento < hoje);
    if (atr) l.push({ p: 3, t: 'Mensalidade atrasada', cls: 'warn', ir: '#/financeiro' });
    const ult = ultimoTreino[id]; const dd = ult ? diasDesde(ult) : diasDesde(m.criado_em);
    if (dd >= 7) l.push({ p: dd >= 21 ? 1 : 3, t: ult ? `Sem treinar há ${dd} dias` : 'Ainda não treinou', cls: dd >= 21 ? 'err' : 'warn', ir: `#/aluno/${id}/conversa` });
    if (faz('corrida', m)) { const sp = statusPlanilha(fimPl[id]); if (sp.d < 0) l.push({ p: 1, t: fimPl[id] ? 'Planilha acabou, sem a próxima' : 'Sem planilha de corrida', cls: 'err', ir: `#/aluno/${id}/corrida` }); else if (sp.d <= 4) l.push({ p: 2, t: `Planilha acaba ${sp.d === 0 ? 'hoje' : sp.d === 1 ? 'amanhã' : `em ${sp.d} dias`}`, cls: 'warn', ir: `#/aluno/${id}/corrida` }); }
    const av = ultAval[id];
    if (av && av.proxima && av.proxima < hoje) l.push({ p: 4, t: 'Reavaliação pendente', cls: '', ir: `#/aluno/${id}/avaliacoes` });
    l.sort((a, b) => a.p - b.p);
    return { m, l };
  }).filter((x) => x.l.length).sort((a, b) => a.l[0].p - b.l[0].p || a.m.nome.localeCompare(b.m.nome));
  const nomes = Object.fromEntries((membros || []).map((m) => [m.user_id, m.nome]));
  const alMeus = alertas;
  const recentes = [
    ...sess.filter((s) => s.iniciado_em > seteDias).map((s) => ({ id: s.id, tp: 'sessao', t: s.iniciado_em, novo: !s.visto_treinador, h: `#/aluno/${s.aluno_id}/historico`, n: nomes[s.aluno_id], d: `${esc(s.treino_titulo || 'Treino')}${s.esforco != null ? ` · esforço ${s.esforco}` : ''}`, dor: s.dor, ic: I.lib })),
    ...corr.filter((c) => c.data > seteDias).map((c) => ({ id: c.id, tp: 'corrida', t: c.data, novo: !c.visto_treinador, h: `#/corrida/${c.id}`, n: nomes[c.aluno_id], d: ehCorr(c) ? `${fmtKm(c.distancia_m, 1)} · ${fmtPace(paceDe(c))}` : `${nomeAtiv(c)} · ${resumoAtiv(c)}`, dor: c.dor, ic: icCorr((membros || []).find((x) => x.user_id === c.aluno_id)) })),
  ].sort((a, b) => (a.t < b.t ? 1 : -1));
  const treinosSemana = recentes.length;
  // ---- resumo da semana (alunos do treinador) ----
  const meus = ativos;
  const naSem = (d, s0) => { const x = String(d).length === 10 ? String(d) : isoDia(d); return x >= s0 && x <= somaDias(s0, 6); };
  const alvoLib = new Date().getDay() >= 1 && new Date().getDay() <= 4 ? segAtual : segProx; // seg–qui: esta semana · sex–dom: a próxima
  const rs = { treinaram: [], faltaram: [], provas: [], semLib: [] };
  meus.forEach((m) => {
    const id = m.user_id;
    const sP = sess.filter((s) => s.aluno_id === id && naSem(s.iniciado_em, segPass)), cP = corr.filter((c) => c.aluno_id === id && naSem(c.data, segPass));
    if (sP.length || cP.length) rs.treinaram.push({ m, d: [cP.length ? `${cP.length} corrida${cP.length > 1 ? 's' : ''}` : '', sP.length ? `${sP.length} força` : ''].filter(Boolean).join(' · ') });
    let prev = 0, fez = 0;
    if (faz('corrida', m)) { const pl = planoRes.filter((p) => p.aluno_id === id && !semCorrida(p) && p.liberado && naSem(p.data, segPass)); prev += pl.length; fez += pl.filter((p) => cP.some((c) => c.plano_id === p.id || (ehCorr(c) && isoDia(c.data) === p.data))).length; }
    if (faz('musculacao', m) && libsRes.some((l) => l.aluno_id === id && l.semana === segPass)) { const off = dispDe(m).off_forca || []; const pf = treinosRes.filter((t) => t.aluno_id === id).reduce((a, t) => a + (t.dias || []).filter((d) => !off.includes(d)).length, 0); prev += pf; fez += Math.min(pf, sP.length); }
    if (prev && fez < prev) rs.faltaram.push({ m, d: `fez ${fez} de ${prev}`, f: prev - fez });
    const pv = provasEq.find((x) => x.aluno_id === id && diasAte(x.data) <= 14);
    if (pv) { const dd = diasAte(pv.data); rs.provas.push({ m, d: `${esc(pv.titulo)} · ${dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : `em ${dd} dias`}`, h: `#/aluno/${id}/corrida` }); }
    const falta = [];
    if (faz('corrida', m)) { const pl = planoRes.filter((p) => p.aluno_id === id && naSem(p.data, alvoLib)); if (!pl.length) falta.push('corrida vazia'); else if (pl.some((p) => !p.liberado)) falta.push('corrida'); }
    if (faz('musculacao', m) && treinosRes.some((t) => t.aluno_id === id && (t.dias || []).length) && !libsRes.some((l) => l.aluno_id === id && l.semana === alvoLib)) falta.push('força');
    if (falta.length) rs.semLib.push({ m, d: falta.join(' · '), h: `#/aluno/${id}/${falta[0] === 'força' ? 'forca' : 'corrida'}` });
  });
  rs.faltaram.sort((a, b) => b.f - a.f);
  const ehSeg = new Date().getDay() === 1;
  const resumoHTML = meus.length ? `<div class="section"><div class="section-h"><h2 class="h2">${ehSeg ? 'Resumo da semana' : 'Semana passada'}</h2><span class="small muted">${fmtCurto(segPass)} a ${fmtCurto(somaDias(segPass, 6))}</span></div>
    <div class="rs-grid">${[['treinaram', rs.treinaram.length, `de ${meus.length} treinaram`, 'ok'], ['faltaram', rs.faltaram.length, 'faltaram treino', rs.faltaram.length ? 'warn' : ''], ['provas', rs.provas.length, 'provas em 14 dias', ''], ['semLib', rs.semLib.length, `sem liberar ${alvoLib === segAtual ? 'esta semana' : 'a próxima'}`, rs.semLib.length ? 'err' : '']].map(([k, n, t, c]) => `<button class="rs-t ${c}" data-rs="${k}" ${n ? '' : 'disabled'}><b>${n}</b><span>${t}</span></button>`).join('')}</div>
    ${Object.entries(rs).filter(([, l]) => l.length).map(([k, l]) => `<div class="card rs-lista" data-rsl="${k}" hidden>${l.map((x) => `<a class="ativ-l" href="${x.h || `#/aluno/${x.m.user_id}/historico`}">${avAluno(x.m, 'sm')}<b class="grow ellip">${esc(x.m.nome)}</b><span class="small muted">${x.d}</span></a>`).join('')}</div>`).join('')}</div>` : '';
  const comp = compDe(); const aReceber = cobs.filter((c) => c.competencia === comp).reduce((a, c) => a + +c.valor, 0);
  const h = new Date().getHours(); const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const st = S.cache.hoje || (S.cache.hoje = { tudo: false });
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""><span class="eyebrow">${esc(S.org.nome)}</span></div><a class="top-foto" href="#/perfil" aria-label="Meu perfil" title="Meu perfil">${fotoHTML(S.me)}</a></div>
    <h1 class="h1">${saud}, ${esc(firstName(S.me.nome))}</h1>
    <p class="muted" style="margin-top:6px">${alMeus.length ? `${alMeus.length} aluno${alMeus.length > 1 ? 's seus pedem' : ' seu pede'} atenção hoje.` : 'Seus alunos estão em dia.'}</p>
    ${pendentes.length ? `<div class="section"><div class="section-h"><h2 class="h2">Novos alunos para aprovar</h2><span class="tag acc">${pendentes.length}</span></div><div class="stack">${pendentes.map((m) => `<div class="card aprovar" data-pend="${m.user_id}">
      <div class="row" style="gap:12px">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><span class="small muted ellip" style="display:block">${esc(m.email || '')}</span></div><span class="tiny dim">${m.pedido_em ? quando(m.pedido_em) : ''}</span></div>
      ${(() => { const md = m.modalidades || [], c = md.includes('corrida'), f = md.includes('musculacao'); const ic = (c ? selo('corrida', 'sm') : '') + (f ? selo('forca', 'sm') : ''); const t = (ic ? `<span class="pend-ic">${ic}</span>` : '') + `<span>${c && f ? 'Este aluno é de <b>corrida e musculação</b>' : c ? 'Este aluno é <b>só de corrida</b>' : f ? 'Este aluno é <b>só de musculação</b>' : 'Não marcou a modalidade'}</span>`; return `<div class="pend-mod">${t}</div>`; })()}
      ${m.objetivo ? `<p class="small muted" style="margin-top:6px">Objetivo: ${esc(String(m.objetivo).slice(0, 90))}</p>` : ''}
      <p class="small muted" style="margin-top:8px">Preencheu a ficha de entrada e pediu acesso ao app.</p>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" data-aprovar="${m.user_id}">${I.check} Aprovar</button><button class="btn sm ghost" data-recusar="${m.user_id}">Recusar</button><a class="link-btn small" href="#/aluno/${m.user_id}/saude" style="margin-left:auto">Ver ficha</a></div></div>`).join('')}</div></div>` : ''}
    ${cartaoPushHTML()}
    <div class="stats"><a class="stat" href="#/alunos" style="color:inherit"><b>${ativos.length}</b><span>alunos ativos</span></a><div class="stat"><b>${treinosSemana}</b><span>treinos em 7 dias</span></div><a class="stat" href="#/financeiro" style="color:inherit"><b>${aReceber ? brl(aReceber).replace(',00', '') : 'R$ 0'}</b><span>a receber no mês</span></a></div>
    ${ehSeg ? resumoHTML : ''}
    ${(() => { const aniv = ativos.filter((m) => ehAniversario(m.nascimento)); const prox = ativos.filter((m) => !ehAniversario(m.nascimento) && [1, 2, 3, 4, 5, 6].some((d) => ehAniversario(m.nascimento, d)));
      if (!aniv.length && !prox.length) return '';
      const msg = (m) => encodeURIComponent(`Parabéns, ${firstName(m.nome)}! Toda a equipe Nexos deseja um novo ano cheio de saúde, treinos e conquistas. Bora pra cima!`);
      return `<div class="section"><div class="section-h"><h2 class="h2">Aniversários</h2>${slashes}</div><div class="stack">${aniv.map((m) => `<div class="list-item aniv">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><span class="small" style="color:var(--acc);font-weight:700">Faz aniversário hoje${m.nascimento ? ` · ${idadeEm(m.nascimento)} anos` : ''}</span></div>${m.telefone ? `<a class="btn sm" href="https://wa.me/55${esc(String(m.telefone).replace(/\D/g, ''))}?text=${msg(m)}" target="_blank" rel="noopener">Parabéns</a>` : `<a class="btn sm" href="#/aluno/${m.user_id}/conversa">Parabéns</a>`}</div>`).join('')}
        ${prox.length ? `<p class="small muted" style="margin-top:4px">Esta semana: ${prox.map((m) => `${esc(firstName(m.nome))} (${fmtCurto(isoDia(new Date()).slice(0, 4) + m.nascimento.slice(4, 10) + 'T12:00:00')})`).join(', ')}</p>` : ''}</div></div>`; })()}
    ${(() => { const card = ({ m, l }) => `<a class="list-item alerta" href="${l[0].ir}" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)} ${modSelos(m)}${!m.treinador_id ? ' <span class="tag warn" style="vertical-align:2px">sem treinador</span>' : ''}</b><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px">${l.slice(0, 3).map((x) => `<span class="tag ${x.cls}">${esc(x.t)}</span>`).join('')}${l.length > 3 ? `<span class="tag">+${l.length - 3}</span>` : ''}</div></div>${(() => { const p = l[0].p; const n = p === 1 ? ['Alta', 'n-alta'] : p <= 3 ? ['Média', 'n-media'] : ['Baixa', 'n-baixa']; return `<span class="nivel ${n[1]}">${n[0]}</span>`; })()}</a>`;
      return (alMeus.length ? `<div class="section"><div class="section-h"><h2 class="h2">Seus alunos pedem atenção</h2>${slashes}</div><div class="stack" id="alertas">${alMeus.map(card).join('')}</div></div>` : ''); })()}
    ${ehSeg ? '' : resumoHTML}
    <div class="section"><div class="section-h"><h2 class="h2">Atividade da semana</h2><div class="row" style="gap:6px;align-items:center"><a class="link-btn" href="#/feed">Ver retornos</a><button type="button" class="ocultar-btn ${store.get('nx_ativ_oculta', false) ? 'fechado' : ''}" id="ocultar-ativ" aria-label="${store.get('nx_ativ_oculta', false) ? 'Mostrar' : 'Ocultar'} atividade da semana" title="${store.get('nx_ativ_oculta', false) ? 'Mostrar' : 'Ocultar'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg></button></div></div>
      <div id="ativ-corpo" ${store.get('nx_ativ_oculta', false) ? 'hidden' : ''}>${recentes.length ? `<div class="card ativ">${recentes.slice(0, st.tudo ? 60 : 6).map((x) => `<div class="ativ-row"><a class="ativ-l" href="${x.h}"><span class="ativ-ic">${x.ic}</span><div class="grow" style="min-width:0"><b class="ellip">${esc(firstName(x.n))}</b><span class="small muted ellip">${x.d}</span></div>${x.dor ? '<span class="tag err">dor</span>' : ''}<span class="tiny dim">${quando(x.t)}</span></a>${x.novo ? `<button type="button" class="visto-btn" data-visto="${x.tp}|${x.id}">${I.check} Visto</button>` : `<span class="visto-ok" title="Você já viu">${I.check}</span>`}</div>`).join('')}
        ${recentes.length > 6 ? `<button class="link-btn small" id="mais-ativ" style="margin-top:8px">${st.tudo ? 'Mostrar menos' : `Mostrar mais ${recentes.length - 6}`}</button>` : ''}</div>` : '<div class="empty"><div class="h3">Nenhum treino nos últimos 7 dias</div></div>'}</div>
      ${store.get('nx_ativ_oculta', false) ? `<p class="small muted" id="ativ-oculta-txt">${recentes.length} ${recentes.length === 1 ? 'atividade oculta' : 'atividades ocultas'}. Toque na seta para mostrar.</p>` : ''}
    </div>`;
  bindCartaoPush();
  $app.querySelectorAll('[data-visto]').forEach((b) => b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); marcarVisto(b); });
  $app.querySelectorAll('[data-aprovar]').forEach((b) => b.onclick = async () => {
    const m = pendentes.find((x) => x.user_id === b.dataset.aprovar); if (!m) return;
    b.disabled = true; b.textContent = 'Aprovando…';
    const { data: r, error } = await sb.functions.invoke('nx-email', { body: { org_id: S.org.id, acao: 'aprovar', aluno_id: m.user_id } });
    if (error || !r || r.erro) { b.disabled = false; b.innerHTML = `${I.check} Aprovar`; return toast((r && r.erro) || 'Não foi possível aprovar agora.', true); }
    S.cache.nomes = null;
    if (r.enviado) { toast(`${firstName(m.nome)} aprovado! O acesso foi para ${r.email}.`); return staffHoje(); }
    if (r.senha) return mostrarCredenciais({ nome: m.nome, telefone: m.telefone, email: r.email, senha: r.senha }, false, true, 'acesso'), staffHoje();
    toast(`${firstName(m.nome)} aprovado! Ele entra com a senha que já tem.`); staffHoje();
  });
  $app.querySelectorAll('[data-recusar]').forEach((b) => b.onclick = async () => {
    const m = pendentes.find((x) => x.user_id === b.dataset.recusar); if (!m) return;
    if (!confirm(`Recusar o pedido de ${m.nome}? Ele não vai ter acesso ao app.`)) return;
    b.disabled = true;
    const { data: r, error } = await sb.functions.invoke('nx-email', { body: { org_id: S.org.id, acao: 'recusar', aluno_id: m.user_id } });
    if (error || !r || r.erro) { b.disabled = false; return toast((r && r.erro) || 'Não foi possível recusar agora.', true); }
    toast('Pedido recusado.'); staffHoje();
  });
  const ma = document.getElementById('mais-ativ'); if (ma) ma.onclick = () => { st.tudo = !st.tudo; staffHoje(); };
  const oa = document.getElementById('ocultar-ativ'); if (oa) oa.onclick = () => {
    const fechar = !store.get('nx_ativ_oculta', false); store.set('nx_ativ_oculta', fechar);
    const corpo = document.getElementById('ativ-corpo'); if (corpo) corpo.hidden = fechar;
    const tx = document.getElementById('ativ-oculta-txt'); if (tx) tx.hidden = !fechar;
    else if (fechar) corpo.insertAdjacentHTML('afterend', `<p class="small muted" id="ativ-oculta-txt">${recentes.length} ${recentes.length === 1 ? 'atividade oculta' : 'atividades ocultas'}. Toque na seta para mostrar.</p>`);
    oa.classList.toggle('fechado', fechar); oa.setAttribute('aria-label', `${fechar ? 'Mostrar' : 'Ocultar'} atividade da semana`); oa.title = fechar ? 'Mostrar' : 'Ocultar';
  };
  $app.querySelectorAll('[data-rs]').forEach((b) => b.onclick = () => {
    const abrir = !b.classList.contains('on');
    $app.querySelectorAll('[data-rs]').forEach((x) => x.classList.toggle('on', abrir && x === b));
    $app.querySelectorAll('[data-rsl]').forEach((x) => { x.hidden = !(abrir && x.dataset.rsl === b.dataset.rs); });
  });
}

/* ================= PERFIL (todos) ================= */
/* ---------- equipe (treinadores) e fotos ---------- */
async function carregarEquipe(forcar) {
  if (S.cache.equipe && !forcar) return S.cache.equipe;
  let data = null;
  try { const r = await sb.rpc('nx_equipe', { p_org: S.org.id }); data = r.data; } catch (e) { console.error(e); }
  S.cache.equipe = data || []; return S.cache.equipe;
}
const fotoHTML = (p, cls = '') => p && p.foto_url ? `<img class="foto ${cls}" src="${esc(p.foto_url)}" alt="${esc(p.nome || '')}" loading="lazy">` : `<span class="foto ini ${cls}">${esc(initials((p && p.nome) || 'N'))}</span>`;
const avAluno = (m, cls = '') => `<div class="av ${cls} ${m && m.foto_url ? 'com-foto' : ''}">${m && m.foto_url ? `<img src="${esc(m.foto_url)}" alt="" loading="lazy">` : esc(initials((m && m.nome) || ''))}</div>`;
function reduzirImagem(file, lado = 512) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = lado; const ctx = c.getContext('2d');
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, lado, lado); URL.revokeObjectURL(url); c.toBlob((b) => (b ? res(b) : rej(new Error('img'))), 'image/jpeg', 0.86); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); }; img.src = url;
  });
}
async function trocarFoto() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    try {
      toast('Enviando foto…'); let blob; try { blob = await reduzirImagem(f); } catch { return toast('Não consegui ler essa imagem. Tente outra foto (JPG ou PNG).', true); }
      const caminho = `${S.user.id}/foto-${Date.now()}.jpg`;
      const { error } = await sb.storage.from('nx-avatares').upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) throw error;
      const url = sb.storage.from('nx-avatares').getPublicUrl(caminho).data.publicUrl;
      const { error: e2 } = await sb.rpc('nx_definir_foto', { p_url: url }); if (e2) throw e2;
      S.me.foto_url = url; S.cache.equipe = null; toast(S.staff ? 'Foto atualizada! Os alunos já veem na conversa.' : 'Foto atualizada! Seu treinador já vê.'); viewPerfil();
    } catch (e) { console.error(e); toast('Não foi possível enviar a foto. Verifique a internet e tente de novo.', true); }
  };
  inp.click();
}

function viewPerfil() {
  const papel = { admin: 'Administrador', treinador: 'Treinador', aluno: 'Aluno' }[S.me.papel];
  $app.innerHTML = `
    <a class="back" href="${S.staff ? '#/mais' : '#/'}">${I.back} Voltar</a>
    <p class="eyebrow">Perfil</p>
    <div class="row" style="margin-top:12px;gap:16px"><button class="foto-edit" id="trocar-foto" aria-label="Trocar foto">${fotoHTML(S.me, 'lg')}<i>${I.cam}</i></button><div class="grow"><div class="h2">${esc(S.me.nome)}</div><div class="small muted ellip">${esc(S.user.email)}</div><span class="tag acc" style="margin-top:6px">${papel} · ${esc(S.org.nome)}</span></div></div>
    <div class="perfil-grid"><div>
    <div class="section"><div class="section-h"><h2 class="h2">Minha conta</h2></div>
      <button type="button" class="list-item" id="trocar-foto2" style="width:100%;text-align:left"><span class="ativ-ic">${I.cam}</span><div class="grow"><b>Trocar foto</b><div class="small muted">Aparece para o seu ${S.staff ? 'aluno' : 'treinador'}</div></div>${I.chev}</button>
      <details class="list-item acc-item"><summary><span class="ativ-ic">${I.user}</span><div class="grow"><b>Trocar senha</b><div class="small muted">Toque para abrir</div></div>${I.chev}</summary>
        <form id="f-senha" style="margin-top:12px"><label class="field"><span>Nova senha</span><input class="input" type="password" name="s1" minlength="6" required autocomplete="new-password"></label><label class="field"><span>Repita a nova senha</span><input class="input" type="password" name="s2" minlength="6" required autocomplete="new-password"></label><button class="btn block">Salvar nova senha</button></form></details></div>
    ${S.staff ? '' : '<div class="section" id="meu-tr" hidden></div>'}
    ${S.staff ? '' : `<div class="section"><div class="section-h"><h2 class="h2">Saúde e pagamentos</h2></div>
      <a class="list-item" href="#/saude" style="color:inherit"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Minha ficha de saúde</b><div class="small muted">Anamnese e PAR-Q</div></div>${I.chev}</a>
      ${S.me.sexo !== 'M' ? `<button type="button" class="list-item" id="perf-ciclo" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic" style="color:#e85d75">${I.cal}</span><div class="grow"><b>Ciclo menstrual</b><div class="small muted">Registrar a menstruação ou ativar o acompanhamento</div></div>${I.chev}</button>` : ''}
      <a class="list-item" href="#/pagamentos" style="color:inherit"><span class="ativ-ic">${I.money}</span><div class="grow"><b>Pagamentos</b><div class="small muted">Mensalidades e Pix</div></div>${I.chev}</a>
      <a class="list-item" href="#/termo" style="color:inherit"><span class="ativ-ic">${I.ficha}</span><div class="grow"><b>Termo e meus dados</b><div class="small muted">O que guardamos e seus direitos (LGPD)</div></div>${I.chev}</a></div>`}
    ${S.me.papel === 'admin' ? `<div class="section"><div class="section-h"><h2 class="h2">Equipe</h2></div><div class="card"><p class="small muted">Adicione outro treinador da Nexos. Ele vai poder cadastrar alunos e montar treinos.</p><button class="btn ghost block" id="add-trein" style="margin-top:12px">${I.plus} Adicionar treinador</button></div></div>` : ''}
    </div><div>
    <div class="section"><div class="section-h"><h2 class="h2">Configurações</h2></div>
      <div id="notif"></div>
      <div class="card" style="margin-top:12px"><b>Cor de fundo</b><p class="small muted">O claro é melhor para ler no sol e na academia.</p>
        <div class="tema-seg seg" id="tema">${[['claro', 'Claro'], ['escuro', 'Escuro']].map(([k, l]) => `<button type="button" data-tema="${k}" class="${(document.documentElement.dataset.tema || 'claro') === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <details class="list-item acc-item" style="margin-top:12px"><summary><span class="ativ-ic">${I.home}</span><div class="grow"><b>Instalar no celular</b><div class="small muted">Ter o app na tela de início</div></div>${I.chev}</summary><p class="small muted" style="margin-top:12px">No navegador, toque em “Compartilhar” ou no menu ⋮ e escolha “Adicionar à tela de início”.</p></details></div>
    <button class="btn danger block" id="sair" style="margin-top:16px">Sair da conta</button>
    <p class="tiny dim center" style="margin-top:16px">Nexos Performance e Saúde · app v1.9 · <a href="../privacidade.html" target="_blank" rel="noopener" class="dim">Política de Privacidade</a></p>
    </div></div>`;
  document.getElementById('sair').onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; };
  const tf = document.getElementById('trocar-foto'); if (tf) tf.onclick = trocarFoto;
  const tf2 = document.getElementById('trocar-foto2'); if (tf2) tf2.onclick = trocarFoto;
  secaoNotificacoes(document.getElementById('notif'));
  if (!S.staff) carregarEquipe().then((eq) => { // o aluno vê com quem está treinando
    const box = document.getElementById('meu-tr'); const t = eq.find((p) => p.user_id === S.me.treinador_id); if (!box || !t) return;
    box.innerHTML = `<div class="section-h"><h2 class="h2">Meu treinador</h2></div><a class="list-item" href="#/conversa" style="color:inherit">${fotoHTML(t, 'md')}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(t.nome)}</b><div class="small muted">Responsável pelos seus treinos · toque para conversar</div></div>${I.chev}</a>`;
    box.hidden = false;
  }, () => {});
  document.getElementById('tema').onclick = (e) => { const b = e.target.closest('[data-tema]'); if (!b) return; aplicarTema(b.dataset.tema); document.querySelectorAll('#tema button').forEach((x) => x.classList.toggle('on', x === b)); };
  const pc = document.getElementById('perf-ciclo');
  if (pc) pc.onclick = async () => { pc.disabled = true; const c = await buscarCiclo(S.user.id).catch(() => null); pc.disabled = false; c ? abrirCiclo(c, () => viewPerfil()) : ativarCiclo(() => viewPerfil()); };
  document.getElementById('f-senha').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    if (f.s1.value !== f.s2.value) return toast('As senhas não conferem.', true);
    const { error } = await sb.auth.updateUser({ password: f.s1.value });
    if (error) return toast(/different|same/i.test(error.message) ? 'Use uma senha diferente da atual.' : 'Não foi possível trocar a senha.', true);
    f.reset(); toast('Senha atualizada!');
  };
  const add = document.getElementById('add-trein');
  if (add) add.onclick = () => formPessoa('treinador');
}

/* ================= TREINADOR ================= */
async function contarNaoVistos() {
  const [{ data: ses }, { data: pend }, vis] = await Promise.all([
    sb.from('nx_sessoes').select('aluno_id').eq('org_id', S.org.id).eq('visto_treinador', false).not('finalizado_em', 'is', null).limit(1000),
    sb.from('nx_membros').select('user_id,treinador_id').eq('org_id', S.org.id).eq('papel', 'aluno').eq('aprovacao', 'pendente'),
    idsMeusAlunos(),
  ]);
  S.cache.naoVistos = (ses || []).filter((x) => vis.has(x.aluno_id)).length;
  S.cache.pendentes = (pend || []).filter(ehMeuAluno).length;
}
async function staffAlunos() {
  loading();
  const st0 = S.cache.atl || (S.cache.atl = { off: 0, q: '', f: 'ativos', modo: 'corrida' }); if (!st0.modo) st0.modo = 'corrida';
  const ini = inicioSemana(); ini.setDate(ini.getDate() + st0.off * 7);
  const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(ini); d.setDate(ini.getDate() + i); return isoDia(d); });
  const de = dias[0], ate = dias[6], hoje = hojeISO();
  const [{ data: membrosT, error }, sess, , , , fimPl, plano, corrs, provas, trDias, libsF, ciclos, cicIni] = await Promise.all([
    sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome'),
    buscarSessoes(null, 600), contarNaoVistos(), contarMsgNovas(),
    sb.from('nx_anamneses').select('aluno_id,parq_positivo,visto_treinador').eq('org_id', S.org.id).then((r) => { S.cache.anam = Object.fromEntries((r.data || []).map((x) => [x.aluno_id, x])); }),
    fimPlanilhas(),
    sb.from('nx_plano_corrida').select('id,aluno_id,data,tipo,liberado').eq('org_id', S.org.id).gte('data', de).lte('data', ate).then((r) => (r.data || []).filter((p) => !semCorrida(p))).catch(() => []),
    sb.from('nx_corridas').select('aluno_id,data,tipo,plano_id').eq('org_id', S.org.id).gte('data', isoDia(Date.now() - 90 * 864e5)).order('data', { ascending: false }).then((r) => r.data || []).catch(() => []),
    sb.from('nx_participacoes').select('aluno_id,titulo,data,distancia').eq('org_id', S.org.id).gte('data', hoje).order('data').then((r) => r.data || []).catch(() => []),
    sb.from('nx_treinos').select('aluno_id,dias,ativo').eq('org_id', S.org.id).eq('ativo', true).then((r) => r.data || []).catch(() => []),
    sb.from('nx_forca_semanas').select('aluno_id').eq('org_id', S.org.id).eq('semana', de).then((r) => new Set((r.data || []).map((x) => x.aluno_id))).catch(() => new Set()),
    sb.from('nx_ciclo').select('*').eq('org_id', S.org.id).eq('ativo', true).then((r) => r.data || []).catch(() => []),
    sb.from('nx_ciclo_inicios').select('aluno_id,data').eq('org_id', S.org.id).gte('data', isoDia(Date.now() - 200 * 864e5)).order('data', { ascending: false }).then((r) => r.data || []).catch(() => []),
  ]);
  // situação da semana: sem planilha · em preparação (montada, não liberada) · liberada
  const situacao = (m) => {
    if (st0.modo === 'forca') { if (!nTr[m.user_id]) return 'sem'; return libsF.has(m.user_id) ? 'lib' : 'prep'; }
    const pl = plano.filter((p) => p.aluno_id === m.user_id); if (!pl.length) return 'sem';
    return pl.every((p) => p.liberado) ? 'lib' : 'prep';
  };
  const SIT = { sem: ['Sem planilha', 'err'], prep: ['Em preparação', 'warn'], lib: ['Liberada', 'ok'] };
  const cicloDe = {}; ciclos.forEach((c) => { cicloDe[c.aluno_id] = { ...c, inicios: cicIni.filter((x) => x.aluno_id === c.aluno_id).map((x) => x.data) }; });
  const iconesAtl = (m) => {
    const out = [];
    const ci = cicloDe[m.user_id] && cicloInfo(cicloDe[m.user_id]);
    if (ci && ci.fase) { const f = FASES_CICLO[ci.fase]; out.push(`<button type="button" class="atl-ic" style="--ic:${f[1]}" data-dica="${esc(`${f[0]} · dia ${ci.dia} de ${ci.ciclo}${ci.prox ? ` · próxima menstruação ~${fmtCurto(ci.prox + 'T12:00:00')}` : ''}`)}" aria-label="Ciclo menstrual"><svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="currentColor"/></svg></button>`); }
    if (faz('corrida', m) && !perfilCorrida(m).vdot && !(m.corrida && m.corrida.paces_manual && Object.keys(m.corrida.paces_manual).length)) out.push(`<button type="button" class="atl-ic" style="--ic:#e5484d" data-dica="Atleta sem zonas de treino: cadastre um teste ou prova no perfil de corrida para os paces ficarem certos." aria-label="Sem zonas de treino"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/><path d="M6 12h3l1.5-2.5 2 5 1.5-2.5H18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></button>`);
    return out.join('');
  };
  const sel = S.cache.atlSel || (S.cache.atlSel = new Set());
  if (error) throw error;
  const membros = (membrosT || []).filter(ehMeuAluno); // cada treinador vê só os próprios alunos
  dockStaff();
  const ultAtiv = {}; sess.forEach((x) => { if (!ultAtiv[x.aluno_id] || x.iniciado_em > ultAtiv[x.aluno_id]) ultAtiv[x.aluno_id] = x.iniciado_em; }); corrs.forEach((c) => { if (!ultAtiv[c.aluno_id] || c.data > ultAtiv[c.aluno_id]) ultAtiv[c.aluno_id] = c.data; });
  // mapa aluno -> dia -> estado
  const mapa = {}; const marca = (id, k, v) => { (mapa[id] = mapa[id] || {}); mapa[id][k] = mapa[id][k] || {}; mapa[id][k][v] = (mapa[id][k][v] || 0) + 1; };
  plano.forEach((p) => marca(p.aluno_id, p.data, 'pl'));
  corrs.forEach((c) => { const k = isoDia(c.data); if (k >= de && k <= ate && (ehCorr(c) || c.tipo === 'forca')) marca(c.aluno_id, k, ehCorr(c) ? 'co' : 'mu'); });
  sess.forEach((x) => { const k = isoDia(x.iniciado_em); if (k >= de && k <= ate) marca(x.aluno_id, k, 'mu'); });
  provas.forEach((p) => { if (p.data >= de && p.data <= ate) marca(p.aluno_id, p.data, 'pr'); });
  // força: dias da semana com treino fixo
  const fDias = {}; const nTr = {}; trDias.forEach((t) => { nTr[t.aluno_id] = (nTr[t.aluno_id] || 0) + 1; (t.dias || []).forEach((d) => { (fDias[t.aluno_id] = fDias[t.aluno_id] || new Set()).add(d); }); });
  const ultMu = {}; sess.forEach((x) => { if (!ultMu[x.aluno_id] || x.iniciado_em > ultMu[x.aluno_id]) ultMu[x.aluno_id] = x.iniciado_em; });
  const proxProva = {}; provas.forEach((p) => { if (!proxProva[p.aluno_id]) proxProva[p.aluno_id] = p; });
  const ativos = membros.filter((m) => m.ativo);
  const rot = (k) => { const d = dia(k); return `${d.getDate()}/${d.getMonth() + 1}`; };
  const pontos = (id) => {
    const md = mapa[id] || {};
    if (st0.modo === 'forca') {
      const fd = fDias[id] || new Set();
      return `<div class="sem3 so1"><div class="sem1">${dias.map((k, i) => {
        const x = md[k] || {}; let c = 'vazio', t = 'Sem treino';
        if (fd.has(i)) { const feito = (x.mu || 0) >= 1; c = feito ? 'feito' : k < hoje ? 'perdeu' : 'plan'; t = feito ? 'Treino feito' : k < hoje ? 'Treino não feito' : 'Treino planejado'; }
        else if (x.mu) { c = 'extra'; t = 'Treino fora do dia'; }
        return `<span class="pt ${c} ${k === hoje ? 'hoje' : ''}" title="${rot(k)} · ${t}"><small>${'STQQSSD'[i]}</small><i></i><em>${dia(k).getDate()}</em></span>`;
      }).join('')}</div></div>`;
    }
    return `<div class="sem3 so1"><div class="sem1">${dias.map((k, i) => {
      const x = md[k] || {}; let c = 'vazio', t = 'Sem treino';
      if (x.pr) { c = 'prova'; t = 'Prova'; }
      else if (x.pl) { const feito = (x.co || 0) >= 1; c = feito ? 'feito' : k < hoje ? 'perdeu' : 'plan'; t = feito ? 'Corrida feita' : k < hoje ? 'Treino não feito' : 'Treino planejado'; }
      else if (x.co || x.mu) { c = 'extra'; t = x.co ? 'Corrida' : 'Musculação'; }
      return `<span class="pt ${c} ${k === hoje ? 'hoje' : ''}" title="${rot(k)} · ${t}"><small>${'STQQSSD'[i]}</small><i></i><em>${dia(k).getDate()}</em></span>`;
    }).join('')}</div></div>`;
  };
  $app.innerHTML = `
    <div class="row between" style="gap:10px;flex-wrap:wrap"><div><p class="eyebrow">Gestão de atletas</p><h1 class="h1">Meus Atletas</h1></div><button class="btn sm" id="novo">${I.plus} Novo aluno</button></div>
    <div class="atl-top">
      <div class="row" style="gap:6px"><button class="icon-btn sm" id="sem-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="sem-h">${st0.off === 0 ? 'Esta semana' : st0.off === -1 ? 'Semana passada' : st0.off === 1 ? 'Próxima semana' : `${rot(de)} a ${rot(ate)}`}</button><button class="icon-btn sm" id="sem-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>

    </div>
    <div class="subtabs mod-tabs" id="modo" style="margin-top:12px"><button type="button" data-m="corrida" class="${st0.modo === 'corrida' ? 'on' : ''}">${I.run} Corrida</button><button type="button" data-m="forca" class="${st0.modo === 'forca' ? 'on' : ''}">${I.lib} Força</button></div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="q" placeholder="Buscar atleta" value="${esc(st0.q)}"></div>
    <div class="sit-tiles" id="sit-tiles"></div>
    <div class="chips" id="filtros">${[['ativos', 'Ativos'], ['planilha', 'Planilha acabando'], ['naofez', 'Faltou treino'], ['sumidos', 'Sem treinar há 7+ dias'], ['inativos', 'Inativos']].map(([k, l]) => `<button class="chip ${st0.f === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="atl-leg"><span><i class="pt-l feito"></i>feito</span><span><i class="pt-l plan"></i>planejado</span><span><i class="pt-l perdeu"></i>não fez</span><span><i class="pt-l extra"></i>treino extra</span><span><i class="pt-l prova"></i>prova</span></div>
    <p class="tiny dim" id="cont" style="margin-top:6px"></p>
    <div id="lista" class="atl-lista"></div>
    <div class="bulk-bar" id="bulk" hidden><label class="bulk-all"><input type="checkbox" id="sel-todos"><span>Todos</span></label><b id="bulk-n"></b><button class="btn sm" id="bulk-lib">${I.check} Liberar semana</button><button class="link-btn small" id="bulk-x">Limpar</button></div>`;
  const draw = () => {
    const q = semAcento(st0.q);
    const modoF = st0.modo === 'forca';
    document.querySelector('#filtros [data-f="planilha"]').textContent = modoF ? 'Sem dia fixo' : 'Planilha acabando';
    let l = membros.filter((m) => !q || semAcento(m.nome + ' ' + (m.email || '')).includes(q)).filter((m) => faz(modoF ? 'musculacao' : 'corrida', m));
    if (st0.f === 'ativos') l = l.filter((m) => m.ativo);
    if (st0.f === 'inativos') l = l.filter((m) => !m.ativo);
    if (st0.f === 'sumidos') l = l.filter((m) => m.ativo && (!ultAtiv[m.user_id] || diasDesde(ultAtiv[m.user_id]) >= 7));
    if (st0.f === 'naofez') l = l.filter((m) => m.ativo && (modoF ? dias.some((k, i) => k < hoje && (fDias[m.user_id] || new Set()).has(i % 7) && !((mapa[m.user_id] || {})[k] || {}).mu) : Object.entries(mapa[m.user_id] || {}).some(([k, x]) => x.pl && !x.co && k < hoje)));
    if (st0.f === 'sumidos' && modoF) l = l.filter((m) => !ultMu[m.user_id] || diasDesde(ultMu[m.user_id]) >= 7);
    if (st0.f === 'planilha' && modoF) l = l.filter((m) => m.ativo && !(fDias[m.user_id] || new Set()).size);
    else if (st0.f === 'planilha') l = l.filter((m) => m.ativo && faz('corrida', m) && statusPlanilha(fimPl[m.user_id]).d <= 6).sort((a, b) => statusPlanilha(fimPl[a.user_id]).d - statusPlanilha(fimPl[b.user_id]).d);
    // contadores da semana (sobre os atletas ativos visíveis no modo atual)
    const base = membros.filter((m) => m.ativo && faz(modoF ? 'musculacao' : 'corrida', m));
    const cnt = { sem: 0, prep: 0, lib: 0 }; base.forEach((m) => cnt[situacao(m)]++);
    document.getElementById('sit-tiles').innerHTML = [['ativos', base.length, 'atletas ativos', 'acc'], ['sit-prep', cnt.prep, 'em preparação', 'warn'], ['sit-sem', cnt.sem, modoF ? 'sem treino de força' : 'sem planilha', 'err'], ['sit-lib', cnt.lib, 'semanas liberadas', 'ok']]
      .map(([k, n, t, c]) => `<button type="button" class="sit-t ${c} ${st0.f === k ? 'on' : ''}" data-f="${k}"><b>${n}</b><span>${t}</span><i></i></button>`).join('');
    if (st0.f && st0.f.startsWith('sit-')) l = l.filter((m) => m.ativo && situacao(m) === st0.f.slice(4));
    document.getElementById('cont').textContent = `${l.length} atleta${l.length === 1 ? '' : 's'}`;
    S.cache.atlVis = l.filter((m) => m.ativo).map((m) => m.user_id);
    document.getElementById('lista').innerHTML = l.length ? l.map((m) => {
      const dd = ultAtiv[m.user_id] ? diasDesde(ultAtiv[m.user_id]) : null;
      const stc = !m.ativo ? '' : dd == null ? '' : dd <= 3 ? 'st-ok' : dd <= 7 ? 'st-warn' : '';
      const sp = faz('corrida', m) ? statusPlanilha(fimPl[m.user_id]) : null; const pv = proxProva[m.user_id];
      const alerta = (S.cache.anam || {})[m.user_id]?.parq_positivo ? '<span class="tag err">PAR-Q</span>' : '';
      const si = m.ativo ? SIT[situacao(m)] : null;
      return `<div class="atl ${sel.has(m.user_id) ? 'sel' : ''}" data-aluno="${m.user_id}">
        <div class="atl-id">${m.ativo ? `<label class="atl-chk" data-chk="${m.user_id}"><input type="checkbox" ${sel.has(m.user_id) ? 'checked' : ''}></label>` : ''}${avAluno(m, stc)}<div class="grow" style="min-width:0"><div class="atl-nome"><b class="ellip">${esc(m.nome)}</b>${modSelos(m)}${iconesAtl(m)}${si ? `<span class="tag ${si[1]} sit-tag">${si[0]}</span>` : ''}</div>
          <div class="atl-sub">${!m.treinador_id ? '<span class="tag warn">sem treinador</span>' : ''}${alerta}${(S.cache.msgPorAluno || {})[m.user_id] ? `<span class="tag acc">${S.cache.msgPorAluno[m.user_id]} msg</span>` : ''}${modoF ? `<span class="${nTr[m.user_id] ? '' : 'pl-err'}">${nTr[m.user_id] ? `${nTr[m.user_id]} treino${nTr[m.user_id] > 1 ? 's' : ''}${(fDias[m.user_id] || new Set()).size ? ' · ' + diasTxt([...fDias[m.user_id]]) : ' · sem dia fixo'}` : 'Sem treino de força'}</span>${ultMu[m.user_id] ? `<span class="dim">último ${diasDesde(ultMu[m.user_id]) === 0 ? 'hoje' : 'há ' + diasDesde(ultMu[m.user_id]) + 'd'}</span>` : ''}` : sp ? `<span class="pl-${sp.cls}">${esc(sp.t)}</span>` : ''}</div>
          ${pv && !modoF ? `<div class="atl-prova">${icT(I.flag)}${esc(pv.titulo)} · ${fmtCurto(pv.data + 'T12:00:00')}${pv.distancia ? ' · ' + esc(pv.distancia) : ''} · <b>${faltam(pv.data)}</b></div>` : ''}</div></div>
        ${m.ativo ? pontos(m.user_id) : '<div class="atl-inativo dim small">Inativo</div>'}
        <div class="atl-ac">${faz('corrida', m) ? `<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/corrida" aria-label="Planilha de corrida" title="Planilha de corrida">${I.run}</button>` : ''}${faz('musculacao', m) ? `<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/forca" aria-label="Planilha de força" title="Planilha de força">${I.lib}</button>` : ''}<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/conversa" aria-label="Conversa" title="Conversa">${I.feed}</button></div>
      </div>`;
    }).join('') : `<div class="empty"><div class="h3">${membros.length ? 'Nenhum atleta nesse filtro' : 'Nenhum atleta ainda'}</div><p class="small">${membros.length ? '' : 'Toque em “Novo aluno” para cadastrar o primeiro.'}</p></div>`;
  };
  draw();
  const re = () => staffAlunos();
  document.getElementById('sem-a').onclick = () => { st0.off -= 1; re(); };
  document.getElementById('sem-p').onclick = () => { st0.off += 1; re(); };
  document.getElementById('sem-h').onclick = () => { st0.off = 0; re(); };
  document.getElementById('q').oninput = (e) => { st0.q = e.target.value; draw(); };
  document.getElementById('filtros').onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; st0.f = b.dataset.f; document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.toggle('on', c === b)); draw(); };
  const bulk = () => { const n = sel.size; const b = document.getElementById('bulk'); b.hidden = !n; document.getElementById('bulk-n').textContent = `${n} selecionado${n > 1 ? 's' : ''}`; const vis = S.cache.atlVis || []; document.getElementById('sel-todos').checked = vis.length && vis.every((id) => sel.has(id)); };
  document.getElementById('sit-tiles').onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; st0.f = st0.f === b.dataset.f ? 'ativos' : b.dataset.f; document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === st0.f)); draw(); };
  document.getElementById('sel-todos').onchange = (e) => { (S.cache.atlVis || []).forEach((id) => (e.target.checked ? sel.add(id) : sel.delete(id))); draw(); bulk(); };
  document.getElementById('bulk-x').onclick = () => { sel.clear(); draw(); bulk(); };
  document.getElementById('bulk-lib').onclick = async (e) => {
    const ids = [...sel]; const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Liberando…';
    try {
      if (st0.modo === 'forca') {
        const novos = ids.filter((id) => nTr[id] && !libsF.has(id));
        if (novos.length) { const { error: er } = await sb.from('nx_forca_semanas').insert(novos.map((id) => ({ org_id: S.org.id, aluno_id: id, semana: de }))); if (er) throw er; }
        novos.forEach((id) => notificarAluno('planilha', id));
        toast(novos.length ? `Treinos de força liberados para ${novos.length} atleta${novos.length > 1 ? 's' : ''}.` : 'Nada para liberar nos selecionados.');
      } else {
        const comPlano = ids.filter((id) => plano.some((p) => p.aluno_id === id && !p.liberado));
        if (comPlano.length) { const { error: er } = await sb.from('nx_plano_corrida').update({ liberado: true }).eq('org_id', S.org.id).in('aluno_id', comPlano).gte('data', de).lte('data', ate); if (er) throw er; }
        comPlano.forEach((id) => notificarAluno('planilha', id));
        // treinos liberados também vão para o Garmin de quem tiver
        if (comPlano.length) sb.from('nx_plano_corrida').select('*').eq('org_id', S.org.id).in('aluno_id', comPlano).gte('data', de).lte('data', ate).then(({ data: pls }) => {
          comPlano.forEach((id) => { const m = membros.find((x) => x.user_id === id); const lista = (pls || []).filter((p) => p.aluno_id === id); if (lista.length) enviarGarmin(id, lista, perfilCorrida(m)).catch(() => {}); });
        }).catch(() => {});
        const semNada = ids.length - comPlano.length;
        toast(comPlano.length ? `Semana liberada para ${comPlano.length} atleta${comPlano.length > 1 ? 's' : ''}. Eles foram avisados.${semNada ? ` (${semNada} já estava${semNada > 1 ? 'm' : ''} liberado${semNada > 1 ? 's' : ''} ou sem planilha)` : ''}` : 'Os selecionados já estão liberados ou sem planilha nesta semana.');
      }
      sel.clear(); staffAlunos();
    } catch (er) { console.error(er); btn.disabled = false; btn.innerHTML = `${I.check} Liberar semana`; toast('Não foi possível liberar agora.', true); }
  };
  bulk();
  document.getElementById('lista').onclick = (e) => {
    const ic = e.target.closest('[data-dica]'); if (ic) { e.stopPropagation(); toast(ic.dataset.dica); return; }
    const ck = e.target.closest('[data-chk]'); if (ck) { e.stopPropagation(); if (e.target.tagName !== 'INPUT') return; const id = ck.dataset.chk; e.target.checked ? sel.add(id) : sel.delete(id); ck.closest('.atl').classList.toggle('sel', e.target.checked); bulk(); return; }
    const ir = e.target.closest('[data-ir]'); if (ir) { location.hash = ir.dataset.ir; return; } const it = e.target.closest('[data-aluno]'); if (it) location.hash = '#/aluno/' + it.dataset.aluno + '/' + st0.modo; };
  document.getElementById('modo').onclick = (e) => { const b = e.target.closest('[data-m]'); if (!b) return; st0.modo = b.dataset.m; document.querySelectorAll('#modo button').forEach((x) => x.classList.toggle('on', x === b)); draw(); };
  document.getElementById('novo').onclick = () => formPessoa('aluno');
}

function formPessoa(tipo, pre = {}, aoCriar) {
  const senha = gerarSenha();
  const aluno = tipo === 'aluno'; const pv = (k) => esc(pre[k] || '');
  openSheet(`
    <p class="eyebrow">${aluno ? 'Novo aluno' : 'Novo treinador'}</p><div class="h2" style="margin-top:4px">${aluno ? 'Cadastrar aluno' : 'Adicionar treinador'}</div>
    <form id="f-pessoa" style="margin-top:16px">
      <label class="field"><span>Nome completo</span><input class="input" name="nome" required autofocus value="${pv('nome')}"></label>
      <label class="field"><span>E-mail (será o login)</span><input class="input" type="email" name="email" required inputmode="email" value="${pv('email')}"></label>
      ${aluno ? `<div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${pv('telefone')}"></label><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(pv('nascimento'))}"></label></div>
      <div class="field"><span>Faz com a Nexos</span>${modsHTML(pre.mods || null)}</div>
      <label class="field"><span>Objetivo</span><input class="input" name="objetivo" placeholder="Ex.: correr 10 km, emagrecer, hipertrofia" value="${pv('objetivo')}"></label>
      <label class="field"><span>Observações de saúde / restrições</span><textarea class="textarea" name="observacoes" placeholder="Ex.: dor no joelho esquerdo, hipertensão controlada">${pv('observacoes')}</textarea></label>` : ''}
      <label class="field"><span>Senha inicial</span><div class="row" style="gap:8px"><input class="input mono" name="senha" value="${senha}" minlength="6" required><button type="button" class="btn ghost sm" id="nova-senha">Gerar</button></div></label>
      <p class="tiny dim" style="margin:-4px 0 16px">Ele pode trocar a senha depois, no perfil.</p>
      <button class="btn block" type="submit">${aluno ? 'Cadastrar aluno' : 'Adicionar treinador'}</button>
    </form>`, (root) => {
    root.querySelector('#nova-senha').onclick = () => (root.querySelector('[name=senha]').value = gerarSenha());
    root.querySelector('#f-pessoa').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target; const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      const fd = new FormData(f); const mods = fd.getAll('mod'); fd.delete('mod');
      if (aluno && !mods.length) { btn.disabled = false; return toast('Marque musculação, corrida ou as duas.', true); }
      const dados = Object.fromEntries(fd.entries());
      if (dados.nascimento) { const iso = dataISO(dados.nascimento); if (!iso) { btn.disabled = false; return toast('Confira a data de nascimento (dd/mm/aaaa).', true); } dados.nascimento = iso; }
      Object.keys(dados).forEach((k) => { if (dados[k] === '') delete dados[k]; });
      try {
        const r = await chamarFuncao({ acao: aluno ? 'criar' : 'criar_treinador', ...dados });
        if (aluno && r.user_id && mods.length < MODS.length) await sb.from('nx_membros').update({ modalidades: mods }).eq('org_id', S.org.id).eq('user_id', r.user_id);
        if (aoCriar) try { await aoCriar(r); } catch (e2) { console.error(e2); }
        mostrarCredenciais(dados, r.existente, aluno);
        if (aluno && location.hash === '#/alunos') staffAlunos();
      } catch (err) { btn.disabled = false; toast(err.message, true); }
    };
  });
}

/** envia um e-mail da Nexos (com a logo) pelo Gmail da assessoria */
async function enviarEmailNexos(body, btn) {
  const txt = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
  try {
    const { data, error } = await sb.functions.invoke('nx-email', { body: { org_id: S.org.id, ...body } });
    let erro = data && data.erro;
    if (error) { erro = 'Não foi possível enviar o e-mail agora.'; try { const j = await error.context.json(); if (j?.erro) erro = j.erro; } catch {} }
    if (data && data.configurado === false) { toast('O envio por e-mail ainda não foi configurado (falta a senha de app do Gmail).', true); return false; }
    if (erro) { toast(erro, true); return false; }
    toast(`E-mail enviado para ${body.para}`);
    if (btn) { btn.innerHTML = `${I.check} E-mail enviado`; }
    return true;
  } finally { if (btn && btn.textContent === 'Enviando…') { btn.disabled = false; btn.innerHTML = txt; } }
}
function mostrarCredenciais(d, existente, aluno = true, tipo = 'acesso') {
  const url = loginURL();
  const msg = existente
    ? `Olá, ${firstName(d.nome)}! Seu acesso ao app da Nexos foi liberado. Entre em ${url} com o e-mail ${d.email} e a senha que você já usa.`
    : `Olá, ${firstName(d.nome)}! Seu acesso ao app da Nexos está pronto\n\nAcesse: ${url}\nE-mail: ${d.email}\nSenha: ${d.senha}\n\nDepois de entrar, você pode trocar a senha no seu perfil.`;
  const tel = String(d.telefone || '').replace(/\D/g, '');
  const wa = `https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(msg)}`;
  openSheet(`
    <div class="center">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">${aluno ? 'Aluno cadastrado' : 'Treinador adicionado'}</div>
    <p class="small muted" style="margin:6px 0 16px">${existente ? 'Esse e-mail já tinha conta: a pessoa entra com a senha que já usa.' : 'Envie os dados de acesso:'}</p></div>
    <div class="cred">Acesso: <b>${esc(url)}</b><br>E-mail: <b>${esc(d.email)}</b>${existente ? '' : `<br>Senha: <b>${esc(d.senha)}</b>`}</div>
    <a class="btn block" style="margin-top:16px;background:#25d366;color:#04122b" href="${esc(wa)}" target="_blank" rel="noopener">${I.wa} Enviar pelo WhatsApp</a>
    ${d.email ? `<button class="btn block mail-btn" id="por-email" style="margin-top:8px">${I.mail} Enviar por e-mail</button>` : ''}
    <button class="btn ghost block" id="copiar" style="margin-top:8px">Copiar mensagem</button>
    <button class="btn ghost block" data-close style="margin-top:8px">Concluir</button>`, (root) => {
    const pe = root.querySelector('#por-email');
    if (pe) pe.onclick = () => enviarEmailNexos({ tipo, para: d.email, nome: d.nome, login: d.email, senha: existente ? null : d.senha, link: url }, pe);
    root.querySelector('#copiar').onclick = async () => { try { await navigator.clipboard.writeText(msg); toast('Mensagem copiada!'); } catch { toast('Não foi possível copiar.', true); } };
  });
}

async function silencioso(fn) { const y = scrollY; S.silencio = true; try { await fn(); } finally { S.silencio = false; scrollTo(scrollX, y); } }
async function staffAluno(alunoId, aba, extra) {
  if (!S.silencio) loading(); let anamnese = null, termo = null, planoInfo = null;
  let corrRec = [];
  const [{ data: m, error }, treinos, sess] = await Promise.all([
    sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
    buscarTreinosDoAluno(alunoId), buscarSessoes(alunoId, 300), contarMsgNovas(),
    sb.from('nx_anamneses').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).maybeSingle().then((r) => r.data),
    sb.from('nx_corridas').select('id,data').eq('aluno_id', alunoId).gte('data', isoDia(Date.now() - 60 * 864e5)).then((r) => r.data || []).catch(() => []),
  ]).then((r) => { anamnese = r[4]; corrRec = r[5]; return r; });
  dockStaff();
  if (error) throw error;
  if (!m) { $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>'; return; }
  aba = aba || 'inicio'; if (aba === 'treinos') aba = 'forca';
  const cicloA = (aba === 'corrida' || aba === 'forca') && m.sexo === 'F' ? await buscarCiclo(alunoId).catch(() => null) : null;
  const provaProxA = (aba === 'corrida' || aba === 'forca') ? (await sb.from('nx_participacoes').select('titulo,data,distancia').eq('aluno_id', alunoId).gte('data', hojeISO()).order('data').limit(1).then((r) => (r.data || [])[0]).catch(() => null)) : null;
  let grupos = [];
  const u = sess[0];
  let corpo = '';
  const fM = faz('musculacao', m), fC = faz('corrida', m);
  const SECOES = [
    ['forca', 'Força', I.lib, 'Planilha de musculação', fM],
    ['corrida', 'Corrida', icCorr(m), 'Planilha e evolução', fC],
    ['historico', 'Feedbacks', I.feed, `${sess.length} treino${sess.length === 1 ? '' : 's'} registrados`, true],
    ['cargas', 'Evolução de cargas', I.hist, 'Progressão por exercício', fM],
    ['relmes', 'Relatório do mês', I.ficha, 'PDF para mandar ao aluno', true],
    ['avaliacoes', 'Avaliações', I.check, 'Composição corporal e relatórios', true],
    ['fotos', 'Fotos e postura', I.cam, 'Progresso visual', true],
    ['saude', 'Saúde', I.bell, anamnese && anamnese.parq_positivo ? 'PAR-Q com “sim”' : 'Anamnese e PAR-Q', true],
    ['conversa', 'Conversa', I.feed, (S.cache.msgPorAluno || {})[alunoId] ? `${S.cache.msgPorAluno[alunoId]} mensagem nova` : 'Falar com o aluno', true],
    ['dados', 'Dados e plano', I.money, 'Cadastro, plano e acesso', true],
  ].filter((x) => x[4]);
  if (aba === 'inicio') {
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0); const seg = inicioSemana();
    const diasAtiv = new Set([...sess.map((x) => isoDia(x.iniciado_em)), ...corrRec.map((c) => isoDia(c.data))]);
    const circ = Array.from({ length: 7 }, (_, i) => { const d = new Date(seg); d.setDate(seg.getDate() + i); const k = isoDia(d); return `<div class="fq-d ${diasAtiv.has(k) ? 'ok' : ''} ${k === isoDia(hoje) ? 'hoje' : ''} ${k > isoDia(hoje) ? 'fut' : ''}"><i>${diasAtiv.has(k) ? I.check : ''}</i><span>${'STQQSSD'[i]}</span></div>`; }).join('');
    const datas = [...diasAtiv].sort(); const ult = datas[datas.length - 1];
    const diasSem = ult ? Math.round((dia(isoDia(hoje)) - dia(ult)) / 864e5) : null;
    const n28 = [...sess.map((x) => x.iniciado_em), ...corrRec.map((c) => c.data)].filter((d) => diasDesde(d) < 28).length;
    const media = n28 / 4;
    const novo = !ult && diasDesde(m.criado_em) < 14;
    const st = novo ? ['Novo', 'acc'] : diasSem == null || diasSem > 21 ? ['Abandono', 'err'] : diasSem > 7 ? ['Atenção', 'warn'] : ['Ativo', 'ok'];
    corpo = `<div class="card ov-card"><div class="row between"><b>Frequência da semana</b><span class="small muted">${[...diasAtiv].filter((k) => k >= isoDia(seg)).length} dia(s)</span></div><div class="fq">${circ}</div></div>
      <div class="card ov-card"><div class="row between"><b>Engajamento</b><span class="tag ${st[1]}">${st[0]}</span></div>
        <div class="ov-num"><div><span>Último treino há</span><b>${diasSem == null ? '–' : diasSem === 0 ? 'hoje' : diasSem + (diasSem === 1 ? ' dia' : ' dias')}</b></div><div><span>Frequência média</span><b>${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x semana</b></div></div></div>
      <div class="sec-grid">${SECOES.map(([k, l, ic, d]) => `<a class="sec-tile" href="#/aluno/${alunoId}/${k}"><span class="st-ic">${ic}</span><b>${l}</b><small>${d}</small></a>`).join('')}</div>`;
  } else if (aba === 'relmes') {
    corpo = '<div id="relm"></div>';
  } else if (aba === 'forca') {
    const ultData = (t) => sess.filter((x) => x.treino_id === t.id);
    const fst = S.cache.fsem || (S.cache.fsem = { off: 0 }); const ini = inicioSemana(); ini.setDate(ini.getDate() + fst.off * 7);
    const diasF = Array.from({ length: 7 }, (_, i) => { const d = new Date(ini); d.setDate(ini.getDate() + i); return isoDia(d); });
    const hojeF = hojeISO(); const ativosT = treinos.filter((t) => t.ativo);
    const semDia = ativosT.filter((t) => !(t.dias && t.dias.length));
    const offF = (dispDe(m).off_forca || []);
    const libF = await sb.from('nx_forca_semanas').select('id').eq('aluno_id', alunoId).eq('semana', diasF[0]).maybeSingle().then((r) => r.data).catch(() => null);
    const temFixos = ativosT.some((t) => t.dias && t.dias.length) || offF.length;
    corpo = `<div class="pl-top"><div class="row" style="gap:6px"><button class="icon-btn sm" id="fs-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="fs-h">${fst.off === 0 ? 'Esta semana' : `${dia(diasF[0]).getDate()}/${dia(diasF[0]).getMonth() + 1} a ${dia(diasF[6]).getDate()}/${dia(diasF[6]).getMonth() + 1}`}</button><button class="icon-btn sm" id="fs-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>
      <span class="small muted">${sess.filter((x) => isoDia(x.iniciado_em) >= diasF[0] && isoDia(x.iniciado_em) <= diasF[6]).length} treino(s) feitos na semana</span></div>
      ${temFixos ? (libF ? `<div class="lib-bar ok"><span>✓ Semana liberada: o aluno já vê estes treinos</span><button type="button" class="link-btn small" id="f-desliberar">Cancelar liberação</button></div>` : `<div class="lib-bar"><span>Rascunho: o aluno ainda não vê esta semana</span><button type="button" class="btn sm lib-btn" id="f-liberar">Liberar semana</button></div>`) : ''}
      <div class="fsem ${temFixos && !libF ? 'rasc' : ''}">${diasF.map((k, i) => { const doDia = ativosT.filter((t) => (t.dias || []).includes(i)); const feitos = sess.filter((x) => isoDia(x.iniciado_em) === k);
        return `<div class="fdia ${k === hojeF ? 'hoje' : ''} ${k < hojeF ? 'passado' : ''}"><div class="fdia-h"><b class="fdia-n">${dia(k).getDate()}</b><span>${DSEM[i]}</span>${dispIcones(m, i)}<button class="cal-add" data-fadd="${i}" aria-label="Pôr treino na ${DSEM[i]}">${I.plus}</button></div>
          <div class="fdia-c">${doDia.map((t) => { const ok = feitos.find((x) => x.treino_id === t.id); return `<div class="ftr ${ok ? 'feito' : k < hojeF ? 'perdeu' : ''}"><a href="#/aluno/${alunoId}/treino/${t.id}" class="grow" style="color:inherit;min-width:0">${ok ? `<span class="ses-conc fo"><i>${I.check}</i>Treino concluído</span>` : ''}<b class="ellip" style="display:block">${esc(t.titulo)}</b><small>${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios${ok ? (ok.esforco != null ? ' · esforço ' + ok.esforco + '/10' : '') : k < hojeF ? ' · não fez' : ''}</small></a><button class="sd-x" data-frm="${t.id}" data-d="${i}" aria-label="Tirar deste dia">${I.x}</button></div>`; }).join('')}
          ${feitos.filter((x) => !doDia.some((t) => t.id === x.treino_id)).map((x) => `<div class="ftr feito extra"><span class="grow"><span class="ses-conc fo"><i>${I.check}</i>Treino extra</span><b>${esc(x.treino_titulo || 'Treino')}</b><small>fora do dia planejado${x.esforco != null ? ' · esforço ' + x.esforco + '/10' : ''}</small></span></div>`).join('')}
          ${offF.includes(i) ? `<div class="ftr folga"><span class="off-ic">${OFF_IC}</span><span class="grow"><b>Day off</b><small>Descanso de força</small></span><button class="sd-x" data-froff="${i}" aria-label="Tirar o day off">${I.x}</button></div>` : ''}
          ${!doDia.length && !feitos.length && !offF.includes(i) ? '<span class="cal-vazio">sem treino</span>' : ''}</div></div>`; }).join('')}</div>
      ${semDia.length ? `<p class="small muted" style="margin-top:12px">Sem dia fixo (o aluno faz na sequência): ${semDia.map((t) => `<b>${esc(t.titulo)}</b>`).join(', ')}. Toque no + de um dia para fixar.</p>` : ''}
      <div class="section"><div class="section-h"><h2 class="h2">Treinos do aluno</h2>${slashes}</div><div class="stack">` + (treinos.length ? treinos.map((t, i) => { const ex = ultData(t); return `
      <div class="card tr-card"><div class="row between" style="align-items:flex-start;gap:10px"><div class="row" style="gap:12px;align-items:flex-start"><div class="wletter sm">${esc(letraTreino(t, i))}</div>
        <div><div class="h3">${esc(t.titulo)}</div><div class="small muted">${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} ${t.nx_treino_itens.length === 1 ? 'exercício' : 'exercícios'}${!t.ativo ? ' · <span style="color:var(--warn)">pausado</span>' : ''}</div>${t.dias && t.dias.length ? `<span class="tag acc" style="margin-top:4px">${diasTxt(t.dias)}</span>` : ''}</div></div>
        <a class="icon-btn sm" href="#/treino/${t.id}" aria-label="Ver como aluno" title="Ver como o aluno vê">${I.eye}</a></div>
        <p class="small" style="margin:10px 0 0;color:var(--acc)">${ex.length ? `Executado ${ex.length} ${ex.length === 1 ? 'vez' : 'vezes'}, última execução ${fmtData(ex[0].iniciado_em)}` : 'O aluno ainda não executou este treino'}</p>
        <div class="grid3 tr-acoes"><a class="btn sm" href="#/aluno/${alunoId}/treino/${t.id}">Editar</a><a class="btn ghost sm" href="#/aluno/${alunoId}/cargas">${I.hist} Evolução</a><a class="btn ghost sm" href="#/aluno/${alunoId}/historico">${I.feed} Feedbacks</a></div></div>`; }).join('')
      : '<div class="empty"><div class="h3">Nenhum treino ainda</div><p class="small">Monte o primeiro treino deste aluno.</p></div>')
      + `<div class="grid2" style="margin-top:16px"><a class="btn" href="#/aluno/${alunoId}/treino/novo">${I.plus} Novo treino</a><button class="btn ghost" id="treino-modelo">${I.lib} Usar modelo</button></div></div></div>`;
  } else if (aba === 'historico') {
    corpo = sess.length ? sess.map((s) => sessaoCard(s).replace(/<\/div><\/div>$/, `<a class="btn ghost sm" href="#/aluno/${alunoId}/conversa/${s.id}" style="margin-top:12px">${I.feed} Responder</a></div></div>`)).join('') : '<div class="empty"><div class="h3">Sem treinos registrados</div><p class="small">Os check-ins do aluno aparecem aqui.</p></div>';
  } else if (aba === 'cargas') {
    grupos = agruparCargas(await buscarRegistros(alunoId));
    corpo = `<div id="cargas">${cargasHTML(grupos, true)}</div>`;
  } else if (aba === 'avaliacoes') {
    corpo = avaliacoesHTML(await buscarAvaliacoes(alunoId), alunoId, true);
  } else if (aba === 'conversa') {
    corpo = '<div id="conv"></div>';
  } else if (aba === 'corrida') {
    corpo = '<div id="corr"></div>';
  } else if (aba === 'fotos') {
    corpo = '<div id="fotos"></div>';
  } else if (aba === 'saude') {
    termo = (await sb.from('nx_consentimentos').select('versao,aceito_em,termo_riscos,responsavel_nome').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('aceito_em', { ascending: false }).limit(1)).data?.[0] || null;
    corpo = `<div id="saude">${anamneseResumoHTML(anamnese, termo)}</div>`;
  } else {
    corpo = `<form class="card" id="f-dados">
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(m.nome)}" required></label>
      <div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${esc(MASCARA.tel(m.telefone || ''))}"></label><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(m.nascimento)}"></label></div>
      <label class="field"><span>Objetivo</span><input class="input" name="objetivo" value="${esc(m.objetivo || '')}"></label>
      <label class="field"><span>Observações de saúde / restrições</span><textarea class="textarea" name="observacoes">${esc(m.observacoes || '')}</textarea></label>
      <button class="btn block">Salvar dados</button></form>
      <div class="card"><b>Acesso ao app</b><p class="small muted" style="margin:4px 0 12px">Login: ${esc(m.email || '')}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" id="reset-senha">Gerar nova senha</button><button class="btn ${m.ativo ? 'danger' : ''} sm" id="ativo">${m.ativo ? 'Desativar aluno' : 'Reativar aluno'}</button></div>
        <p class="tiny dim" style="margin-top:12px">Aluno desativado não consegue ver os treinos, mas o histórico fica guardado.</p></div>`;
    planoInfo = await planoDoAlunoHTML(m);
    const eqD = await carregarEquipe();
    corpo = `<div class="card"><b>Treinador responsável</b><p class="small muted" style="margin:4px 0 10px">É quem tem a obrigação de acompanhar e responder este aluno. Os outros treinadores também podem responder, se quiserem. O aluno vê o responsável na conversa.</p>
      <select class="select" id="resp"><option value="">Sem responsável</option>${eqD.map((p) => `<option value="${p.user_id}" ${p.user_id === m.treinador_id ? 'selected' : ''}>${esc(p.nome)}${p.user_id === S.user.id ? ' (você)' : ''}</option>`).join('')}</select></div>
      <div class="card" id="mods-card"><b>O que o aluno faz com a Nexos</b><p class="small muted" style="margin:4px 0 10px">O app do aluno mostra só o que estiver marcado.</p>${modsHTML(m.modalidades)}</div>` + planoInfo.html + corpo;
  }
  const secAtual = SECOES.find((x) => x[0] === aba);
  const cabecalho = `
    <a class="back" href="#/alunos">${I.back} Meus Atletas</a>
    <div class="row" style="gap:16px">${avAluno(m, 'lg ' + (u && diasDesde(u.iniciado_em) <= 3 ? 'st-ok' : u && diasDesde(u.iniciado_em) <= 7 ? 'st-warn' : ''))}
      <div class="grow"><h1 class="h2">${esc(m.nome)}</h1><div class="small muted">${m.objetivo ? esc(m.objetivo) : 'Sem objetivo cadastrado'}</div>
      <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">${u ? `<span class="tag">Último treino ${quando(u.iniciado_em)}</span>` : '<span class="tag">Ainda não treinou</span>'}${(m.modalidades || []).length === 1 ? `<span class="tag acc">Só ${MODS.find((x) => x[0] === m.modalidades[0])[1].toLowerCase()}</span>` : ''}${!m.ativo ? '<span class="tag warn">Inativo</span>' : ''}${m.telefone ? `<a class="tag ok" href="https://wa.me/55${esc(String(m.telefone).replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div></div></div>
    ${m.observacoes || (anamnese && anamnese.parq_positivo) ? `<div class="card" style="margin-top:16px;border-color:rgba(255,207,92,.3)"><span class="eyebrow" style="color:var(--warn)">Atenção</span>${anamnese && anamnese.parq_positivo ? `<p class="small" style="margin-top:4px">${icT(I.alerta, 'warn')}PAR-Q com resposta "sim". <a href="#/aluno/${alunoId}/saude">Ver ficha de saúde</a></p>` : ''}${m.observacoes ? `<p class="small" style="margin-top:4px">${esc(m.observacoes)}</p>` : ''}</div>` : ''}
`;
  const planHead = () => `<a class="back" href="#/alunos">${I.back} Meus Atletas</a>
      <div class="card plan-head"><div class="ph-id">${avAluno(m, 'lg')}<div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><h1 class="h2">${esc(m.nome)}</h1><a class="tag" href="#/aluno/${alunoId}">Ficha completa ${I.chev}</a><a class="tag acc" data-ficha-ins="${alunoId}" hidden>Ficha de inscrição ✎</a>${(setTimeout(() => preencherFichaIns(alunoId), 0), '')}</div>
        <div class="small muted">Objetivo: ${m.objetivo ? esc(m.objetivo) : '<a href="#/aluno/' + alunoId + '/dados">definir objetivo</a>'}</div>
        <button type="button" class="disp-res" id="disp-ed">${dispResumo(m) ? `Dias de treino: ${dispResumo(m)}` : `+ Marcar dias de treino ${selo('corrida', 'sm')} ${selo('forca', 'sm')}`} <span class="dim">· editar</span></button>${cicloA ? cicloLinhaHTML(cicloA, true) : ''}</div></div>
        ${provaProxA ? `<div class="ph-ev"><span class="tiny dim">Próximo evento</span><b>${icT(I.flag)}${esc(provaProxA.titulo)}</b><span class="small">${fmtCurto(provaProxA.data + 'T12:00:00')}${provaProxA.distancia ? ' · ' + esc(provaProxA.distancia) : ''} · ${faltam(provaProxA.data)}</span></div>` : ''}</div>
      ${fM && fC ? `<div class="subtabs mod-tabs" style="margin-top:12px"><a class="${aba === 'corrida' ? 'on' : ''}" href="#/aluno/${alunoId}/corrida">${I.run} Corrida</a><a class="${aba === 'forca' ? 'on' : ''}" href="#/aluno/${alunoId}/forca">${I.lib} Força</a></div>` : ''}`;
  $app.innerHTML = aba === 'inicio'
    ? cabecalho + `<div class="stack" style="margin-top:16px">${corpo}</div>`
    : (aba === 'corrida' || aba === 'forca') ? planHead() + `<div class="stack" style="margin-top:12px">${corpo}</div>`
    : `<a class="back" href="#/aluno/${alunoId}">${I.back} ${esc(m.nome)}</a>
      <div class="sec-tit"><span class="st-ic">${secAtual ? secAtual[2] : I.user}</span><div><p class="eyebrow">${esc(firstName(m.nome))}</p><h1 class="h2">${secAtual ? secAtual[1] : 'Aluno'}</h1></div></div>
      <div class="stack">${corpo}</div>`;
  if (aba === 'cargas') bindCargas(document.getElementById('cargas'), grupos);
  const tm = document.getElementById('treino-modelo');
  if (tm) tm.onclick = () => escolherModeloTreino(async (md) => {
    try { const ex = treinos.length; const t0 = { titulo: 'Treino ' + String.fromCharCode(65 + ex), foco: md.foco || '', observacoes: md.observacoes || '', itens: md.itens || [] }; await aplicarTreinoAlunos(t0, [alunoId], true); toast(`“${md.nome}” aplicado como ${t0.titulo}.`); staffAluno(alunoId, 'treinos'); }
    catch (err) { console.error(err); toast('Não foi possível aplicar o modelo.', true); }
  });
  if (aba === 'conversa') await viewConversa(alunoId, document.getElementById('conv'), true, extra);
  if (aba === 'fotos') await viewFotos(alunoId, document.getElementById('fotos'), true);
  const dispEd = document.getElementById('disp-ed'); if (dispEd) dispEd.onclick = () => editarDisponibilidade(m, () => silencioso(() => staffAluno(alunoId, aba)));
  if (aba === 'corrida') await viewCorridaPainel(alunoId, document.getElementById('corr'), true, m);
  if (aba === 'relmes') await relatorioMes(alunoId, document.getElementById('relm'), true, m);
  if (aba === 'forca') {
    const fst = S.cache.fsem; const re = () => silencioso(() => staffAluno(alunoId, 'forca'));
    document.getElementById('fs-a').onclick = () => { fst.off -= 1; re(); };
    document.getElementById('fs-p').onclick = () => { fst.off += 1; re(); };
    document.getElementById('fs-h').onclick = () => { fst.off = 0; re(); };
    const salvarDias = async (t, dias) => { const { error } = await sb.from('nx_treinos').update({ dias: dias.length ? dias.sort() : null }).eq('id', t.id); if (error) return toast('Não foi possível salvar.', true); re(); };
    const iniFs = inicioSemana(); iniFs.setDate(iniFs.getDate() + fst.off * 7); const segF = isoDia(iniFs);
    const fl = document.getElementById('f-liberar'); if (fl) fl.onclick = async () => { fl.disabled = true; const { error } = await sb.from('nx_forca_semanas').insert({ org_id: S.org.id, aluno_id: alunoId, semana: segF, liberado_por: S.user.id }); if (error && !/duplicate/i.test(error.message || '')) { fl.disabled = false; return toast('Não foi possível liberar.', true); } notificarAluno('planilha_forca', alunoId); toast('Semana de força liberada! O aluno foi avisado.'); re(); };
    const fd = document.getElementById('f-desliberar'); if (fd) fd.onclick = async () => { if (!confirm('Cancelar a liberação? O aluno deixa de ver os treinos de força desta semana.')) return; await sb.from('nx_forca_semanas').delete().eq('aluno_id', alunoId).eq('semana', segF); toast('Liberação cancelada. A semana voltou a ser rascunho.'); re(); };
    const salvarOff = async (lista) => { const nv = { ...dispDe(m), off_forca: lista }; const { error } = await sb.from('nx_membros').update({ disponibilidade: nv }).eq('org_id', S.org.id).eq('user_id', alunoId); if (error) return toast('Não foi possível salvar.', true); m.disponibilidade = nv; re(); };
    $app.querySelectorAll('[data-froff]').forEach((b) => b.onclick = () => salvarOff((dispDe(m).off_forca || []).filter((d) => d !== +b.dataset.froff)));
    $app.querySelectorAll('[data-frm]').forEach((b) => b.onclick = (e) => { e.preventDefault(); const t = treinos.find((x) => x.id === b.dataset.frm); salvarDias(t, (t.dias || []).filter((d) => d !== +b.dataset.d)); });
    $app.querySelectorAll('[data-fadd]').forEach((b) => b.onclick = () => {
      const d = +b.dataset.fadd; const at = treinos.filter((t) => t.ativo);
      openSheet(`<p class="eyebrow">${DSEM[d]}</p><div class="h2" style="margin-top:4px">Qual treino neste dia?</div><p class="small muted" style="margin-top:4px">Vale para todas as semanas, até você mudar.</p>
        <div class="stack" style="margin-top:12px"><button class="list-item off-op" data-off="1" style="width:100%;text-align:left"><span class="off-ic lg">${OFF_IC}</span><div class="grow"><b>Day off</b><div class="small muted">Dia de descanso de força</div></div>${(dispDe(m).off_forca || []).includes(d) ? '<span class="tag ok">já está</span>' : `<span class="add-ic">${I.plus}</span>`}</button>${at.map((t, i) => `<button class="list-item" data-esc="${t.id}" style="width:100%;text-align:left"><div class="wletter sm">${esc(letraTreino(t, i))}</div><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(t.titulo)}</b><div class="small muted ellip">${t.foco ? esc(t.foco) + ' · ' : ''}${diasTxt(t.dias) || 'sem dia fixo'}</div></div>${(t.dias || []).includes(d) ? '<span class="tag ok">já está</span>' : `<span class="add-ic">${I.plus}</span>`}</button>`).join('') || '<p class="small muted">O aluno ainda não tem treinos de força.</p>'}</div>
        <a class="btn ghost block" href="#/aluno/${alunoId}/treino/novo" style="margin-top:12px">${I.plus} Criar treino novo</a>`, (r) => {
        r.querySelector('[data-off]').onclick = () => { closeSheet(); const l = dispDe(m).off_forca || []; if (!l.includes(d)) salvarOff([...l, d]); };
        r.querySelectorAll('[data-esc]').forEach((x) => x.onclick = () => { const t = treinos.find((y) => y.id === x.dataset.esc); closeSheet(); if ((t.dias || []).includes(d)) return; salvarDias(t, [...(t.dias || []), d]); });
      });
    });
  }
  if (aba === 'saude') {
    if (anamnese && !anamnese.visto_treinador) sb.from('nx_anamneses').update({ visto_treinador: true }).eq('id', anamnese.id).then(() => {});
    const ed = document.getElementById('editar-ana');
    const abrirEd = () => viewAnamnese({ alunoId, anamnese, box: document.getElementById('saude'), onSave: () => staffAluno(alunoId, 'saude') });
    bindAtestado(document.getElementById('saude'), anamnese, alunoId);
    if (ed) ed.onclick = abrirEd;
    else { const sd = document.getElementById('saude'); sd.insertAdjacentHTML('beforeend', '<button class="btn ghost block" id="preencher-ana" style="margin-top:12px">Preencher a ficha com o aluno</button>'); sd.querySelector('#preencher-ana').onclick = abrirEd; }
  }
  if (aba === 'historico' && sess.some((s) => !s.visto_treinador)) {
    sb.from('nx_sessoes').update({ visto_treinador: true }).eq('aluno_id', alunoId).eq('org_id', S.org.id).eq('visto_treinador', false).then(() => contarNaoVistos().then(dockStaff));
  }
  if (aba === 'dados') {
    const rs = document.getElementById('resp');
    rs.onchange = async () => { const { error } = await sb.from('nx_membros').update({ treinador_id: rs.value || null }).eq('org_id', S.org.id).eq('user_id', alunoId); if (error) return toast('Não foi possível salvar.', true); m.treinador_id = rs.value || null; toast(rs.value ? `Responsável: ${rs.options[rs.selectedIndex].text.replace(' (você)', '')}` : 'Aluno sem responsável.'); };
    const mc = document.getElementById('mods-card');
    mc.onchange = async () => {
      const sel = [...mc.querySelectorAll('input:checked')].map((i) => i.value);
      if (!sel.length) { toast('Marque pelo menos uma modalidade.', true); return staffAluno(alunoId, 'dados'); }
      const { error } = await sb.from('nx_membros').update({ modalidades: sel }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.modalidades = sel; toast(`Agora o aluno vê: ${sel.map((k) => MODS.find((x) => x[0] === k)[1]).join(' e ')}.`);
    };
    if (planoInfo) bindPlanoDoAluno(m, planoInfo, () => staffAluno(alunoId, 'dados'));
    document.getElementById('f-dados').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target;
      const upd = { nome: f.nome.value.trim(), telefone: f.telefone.value.trim() || null, nascimento: dataISO(f.nascimento.value) || null, objetivo: f.objetivo.value.trim() || null, observacoes: f.observacoes.value.trim() || null };
      const { error: er } = await sb.from('nx_membros').update(upd).eq('org_id', S.org.id).eq('user_id', alunoId);
      er ? toast('Não foi possível salvar.', true) : (toast('Dados salvos!'), staffAluno(alunoId, 'dados'));
    };
    document.getElementById('ativo').onclick = async () => {
      if (m.ativo && !confirm(`Desativar ${m.nome}? Ele deixa de acessar os treinos.`)) return;
      const { error: er } = await sb.from('nx_membros').update({ ativo: !m.ativo }).eq('org_id', S.org.id).eq('user_id', alunoId);
      er ? toast('Não foi possível alterar.', true) : (toast(m.ativo ? 'Aluno desativado.' : 'Aluno reativado!'), staffAluno(alunoId, 'dados'));
    };
    document.getElementById('reset-senha').onclick = async (e) => {
      const nova = gerarSenha(); e.currentTarget.disabled = true;
      try { await chamarFuncao({ acao: 'senha', user_id: alunoId, senha: nova }); mostrarCredenciais({ nome: m.nome, email: m.email, senha: nova, telefone: m.telefone }, false, true, 'senha'); }
      catch (err) { toast(err.message, true); } finally { e.target.disabled = false; }
    };
  }
}

/* ---------- montar / editar treino ---------- */
async function carregarExercicios(force) {
  if (!S.cache.ex || force) {
    const cols = 'id,nome,nome_en,grupo,categoria,equipamento,imagens,video_url,video_credito,com_audio,nivel,fonte,ref_externa,criado_por';
    let all = [], from = 0;
    for (;;) {
      const { data, error } = await sb.from('nx_exercicios').select(cols).eq('org_id', S.org.id).order('nome').range(from, from + 999);
      if (error) throw error; all = all.concat(data || []);
      if (!data || data.length < 1000) break; from += 1000;
    }
    S.cache.ex = all;
  }
  return S.cache.ex;
}

async function staffTreinoEditor(alunoId, treinoId, modo) {
  loading();
  const ehModelo = modo === 'modelo';
  const [exs, { data: aluno }] = await Promise.all([carregarExercicios(), ehModelo ? Promise.resolve({ data: null }) : sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle()]);
  let t = { titulo: '', foco: '', observacoes: '', ativo: true, itens: [] };
  const novo = !treinoId || treinoId === 'novo';
  if (ehModelo && !novo) {
    const { data } = await sb.from('nx_modelos_treino').select('*').eq('id', treinoId).maybeSingle();
    if (data) t = { id: data.id, titulo: data.nome, foco: data.foco || '', observacoes: data.observacoes || '', ativo: true, itens: clone(data.itens || []) };
  } else if (ehModelo) {
    t.titulo = '';
  } else if (!novo) {
    const { data, error } = await sb.from('nx_treinos').select('*, nx_treino_itens(*)').eq('id', treinoId).maybeSingle();
    if (error) throw error;
    if (data) t = { ...data, itens: (data.nx_treino_itens || []).sort((a, b) => a.ordem - b.ordem).map((i) => ({ ...i })) };
  } else {
    const ex = await buscarTreinosDoAluno(alunoId);
    t.titulo = 'Treino ' + String.fromCharCode(65 + ex.length);
  }
  const exMap = Object.fromEntries(exs.map((e) => [e.id, e]));
  const voltar = ehModelo ? '#/treinos' : `#/aluno/${alunoId}/forca`;
  const draw = () => {
    $app.innerHTML = `
      <a class="back" href="${voltar}">${I.back} ${ehModelo ? 'Treinos' : esc(aluno?.nome || 'Aluno')}</a>
      <p class="eyebrow">${ehModelo ? (novo ? 'Novo modelo de treino' : 'Modelo de treino') : novo ? 'Novo treino' : 'Editar treino'}</p>${!ehModelo && novo ? `<button class="aviso-linha" id="usar-modelo">${I.lib}<span><b>Começar de um modelo pronto</b> e só ajustar</span>${I.chev}</button>` : ''}
      <div class="card" style="margin-top:12px">
        <div class="grid2"><label class="field"><span>${ehModelo ? 'Nome do modelo' : 'Nome do treino'}</span><input class="input" id="t-titulo" value="${esc(t.titulo)}" placeholder="${ehModelo ? 'Ex.: Hipertrofia A – inferiores' : 'Treino A'}"></label>
        <label class="field"><span>Foco</span><input class="input" id="t-foco" value="${esc(t.foco || '')}" placeholder="Ex.: Inferiores + core"></label></div>
        <label class="field"><span>Recado para o aluno (aparece no topo do treino)</span><textarea class="textarea" id="t-obs" placeholder="Ex.: aqueça 10 min na esteira antes">${esc(t.observacoes || '')}</textarea></label>
        <label class="row small" style="gap:10px;cursor:pointer;${ehModelo ? 'display:none' : ''}"><input type="checkbox" id="t-ativo" ${t.ativo ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--acc)"> Treino liberado para o aluno</label>
      </div>
      <div class="section"><div class="section-h"><h2 class="h2">Exercícios (${t.itens.length})</h2>${t.itens.length ? `<button class="link-btn small" id="exp-todos">${t.itens.every((x) => x._aberto) ? 'Recolher todos' : 'Expandir todos'}</button>` : slashes}</div>
        <div class="ex-lista" id="itens">${t.itens.map((it, i) => {
          const ex = exMap[it.exercicio_id] || { nome: '(exercício removido)' };
          const det = Array.isArray(it.series_det) && it.series_det.length ? it.series_det : null;
          const resumo = det ? esc(resumoDet(det)) : [it.series && it.repeticoes ? `${it.series} × ${it.repeticoes}` : it.series ? `${it.series} séries` : '', it.carga, it.descanso_seg ? `${it.descanso_seg}s` : ''].filter(Boolean).map(esc).join(' · ');
          if (!it._aberto) return `<div class="ex-li" data-i="${i}"><button type="button" class="ex-li-h" data-tg><span class="mono ex-n">${String(i + 1).padStart(2, '0')}</span>${exFig(ex, 'thumb')}<span class="grow ex-li-t"><b>${esc(ex.nome)}</b><small>${resumo || 'toque para definir séries e carga'}</small></span><span class="ex-chev">${I.chev}</span></button></div>`;
          return `<div class="ex-li aberto card" data-i="${i}"><button type="button" class="ex-li-h" data-tg><span class="mono ex-n">${String(i + 1).padStart(2, '0')}</span><span class="grow ex-li-t"><b>${esc(ex.nome)}</b><small>${esc(ex.grupo || '')}</small></span><span class="ex-chev up">${I.chev}</span></button>
            <div class="item-row" style="margin-top:12px"><div class="ex-fig-g">${exFig(ex, '')}</div>
            <div class="row" style="gap:6px;align-items:flex-start"><div class="reorder"><button type="button" data-mv="-1" aria-label="Subir">${I.up}</button><button type="button" data-mv="1" aria-label="Descer">${I.down}</button></div><button type="button" class="icon-btn" data-rm aria-label="Remover" style="width:36px;height:36px">${I.x}</button></div></div>
            ${det ? `<div class="ser-det"><div class="sd-h"><span></span><span class="tiny dim">Reps</span><span class="tiny dim">Carga</span><span class="tiny dim">Desc. (s)</span><span></span></div>${det.map((d, k) => `<div class="sd-l" data-k="${k}"><b class="mono">${k + 1}ª</b><input class="input c" data-d="reps" value="${esc(d.reps ?? '')}" placeholder="12"><input class="input c" data-d="carga" value="${esc(d.carga ?? '')}" placeholder="20 kg"><input class="input c" inputmode="numeric" data-d="desc" data-mask="num" value="${esc(d.desc ?? '')}" placeholder="60"><button type="button" class="sd-x" data-sdrm="${k}" aria-label="Remover série">${I.x}</button></div>`).join('')}
              <div class="sd-acoes"><button type="button" class="link-btn small" data-sdadd>${I.plus} Adicionar série</button><button type="button" class="link-btn small" data-sdoff style="color:var(--mute)">Voltar para séries iguais</button></div></div>`
            : `<div class="grid4" style="margin-top:12px">
              <label><span class="tiny dim">Séries</span><input class="input c" data-mask="num" data-max="2" inputmode="numeric" data-f="series" value="${esc(it.series ?? '')}" placeholder="3"></label>
              <label><span class="tiny dim">Reps</span><input class="input c" data-f="repeticoes" value="${esc(it.repeticoes ?? '')}" placeholder="12"></label>
              <label><span class="tiny dim">Carga</span><input class="input c" data-f="carga" value="${esc(it.carga ?? '')}" placeholder="20 kg"></label>
              <label><span class="tiny dim">Desc. (s)</span><input class="input c" data-mask="num" inputmode="numeric" data-f="descanso_seg" value="${esc(it.descanso_seg ?? '')}" placeholder="60"></label>
            </div><button type="button" class="link-btn small sd-on" data-sdon>Séries com carga ou reps diferentes (pirâmide, aquecimento)</button>`}
            <input class="input" data-f="observacao" value="${esc(it.observacao ?? '')}" placeholder="Observação (opcional): ex. cadência 3-1-1" style="margin-top:8px"></div>`;
        }).join('') || '<div class="empty"><div class="h3">Nenhum exercício</div><p class="small">Adicione da sua biblioteca.</p></div>'}</div>
        <button class="btn ghost block" id="add-ex" style="margin-top:12px">${I.plus} Adicionar exercício</button>
      </div>
      <div class="section"><button class="btn block" id="salvar">${ehModelo ? 'Salvar modelo' : 'Salvar treino'} ${I.check}</button>
      <div class="acoes-extra">${ehModelo ? `<button class="btn ghost" id="aplicar">${I.users} Aplicar a alunos</button>` : `<button class="btn ghost" id="enviar-outros">${I.users} Enviar para outros alunos</button><button class="btn ghost" id="salvar-modelo">${I.lib} Salvar como modelo</button>`}</div>
      ${novo ? '' : `<button class="link-btn small" id="excluir" style="margin-top:14px;color:var(--err)">${ehModelo ? 'Excluir modelo' : 'Excluir treino'}</button>`}</div>`;
  };
  const syncCampos = () => {
    t.titulo = document.getElementById('t-titulo').value; t.foco = document.getElementById('t-foco').value;
    t.observacoes = document.getElementById('t-obs').value; t.ativo = document.getElementById('t-ativo').checked;
    document.querySelectorAll('[data-i]').forEach((card) => {
      const it = t.itens[+card.dataset.i];
      card.querySelectorAll('[data-f]').forEach((inp) => { it[inp.dataset.f] = inp.value; });
      card.querySelectorAll('.sd-l').forEach((l) => { const d = it.series_det && it.series_det[+l.dataset.k]; if (d) l.querySelectorAll('[data-d]').forEach((inp) => { d[inp.dataset.d] = inp.value; }); });
    });
  };
  draw();
  $app.onclick = async (e) => {
    const card = e.target.closest('[data-i]');
    if (card && e.target.closest('[data-mv]')) {
      syncCampos(); const i = +card.dataset.i, j = i + +e.target.closest('[data-mv]').dataset.mv;
      if (j < 0 || j >= t.itens.length) return; [t.itens[i], t.itens[j]] = [t.itens[j], t.itens[i]]; draw(); return;
    }
    if (card && e.target.closest('[data-rm]')) { syncCampos(); t.itens.splice(+card.dataset.i, 1); draw(); return; }
    if (card && e.target.closest('[data-tg]')) { syncCampos(); const it = t.itens[+card.dataset.i]; it._aberto = !it._aberto; draw(); const el = document.querySelector(`[data-i="${card.dataset.i}"]`); if (el && it._aberto) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (card && e.target.closest('[data-sdon]')) { syncCampos(); const it = t.itens[+card.dataset.i]; const n = Math.max(1, numInt(it.series) || 3); it.series_det = Array.from({ length: n }, () => ({ reps: it.repeticoes || '', carga: it.carga || '', desc: it.descanso_seg || '' })); draw(); return; }
    if (card && e.target.closest('[data-sdadd]')) { syncCampos(); const it = t.itens[+card.dataset.i]; const ult = it.series_det[it.series_det.length - 1] || {}; it.series_det.push({ ...ult }); draw(); return; }
    if (card && e.target.closest('[data-sdrm]')) { syncCampos(); const it = t.itens[+card.dataset.i]; it.series_det.splice(+e.target.closest('[data-sdrm]').dataset.sdrm, 1); if (!it.series_det.length) it.series_det = null; draw(); return; }
    if (card && e.target.closest('[data-sdoff]')) { syncCampos(); const it = t.itens[+card.dataset.i]; const d0 = it.series_det[0] || {}; it.series = it.series_det.length; it.repeticoes = d0.reps || ''; it.carga = d0.carga || ''; it.descanso_seg = d0.desc || ''; it.series_det = null; draw(); return; }
    if (e.target.closest('#exp-todos')) { syncCampos(); const abrir = !t.itens.every((x) => x._aberto); t.itens.forEach((x) => (x._aberto = abrir)); draw(); return; }
    if (e.target.closest('#add-ex')) {
      syncCampos();
      escolherExercicio(exs, (ex) => { exMap[ex.id] = ex; t.itens.push({ exercicio_id: ex.id, series: 3, repeticoes: '12', carga: '', descanso_seg: 60, observacao: '', _aberto: true }); draw(); toast(`${ex.nome} adicionado`); });
      return;
    }
    if (e.target.closest('#usar-modelo')) {
      syncCampos();
      return escolherModeloTreino((md) => { t.foco = md.foco || t.foco; t.observacoes = md.observacoes || t.observacoes; t.itens = clone(md.itens || []); draw(); toast(`Modelo “${md.nome}” carregado. Ajuste o que quiser.`); });
    }
    if (e.target.closest('#salvar-modelo')) {
      syncCampos(); if (!t.itens.length) return toast('Adicione exercícios antes.', true);
      return salvarComoModelo(t);
    }
    if (e.target.closest('#enviar-outros') || e.target.closest('#aplicar')) {
      syncCampos(); if (!t.itens.length) return toast('Adicione exercícios antes.', true);
      if (!t.titulo.trim()) return toast('Dê um nome ao treino.', true);
      return escolherAlunos(ehModelo ? null : alunoId, ehModelo ? 'Aplicar modelo a alunos' : 'Enviar este treino para', async (ids, avisar) => { const n = await aplicarTreinoAlunos(t, ids, avisar); toast(`Treino enviado para ${n} aluno${n > 1 ? 's' : ''}!`); });
    }
    if (ehModelo && e.target.closest('#salvar')) {
      syncCampos();
      if (!t.titulo.trim()) return toast('Dê um nome ao modelo.', true);
      const btn = e.target.closest('#salvar'); btn.disabled = true;
      const row = { nome: t.titulo.trim(), foco: t.foco.trim() || null, observacoes: t.observacoes.trim() || null, itens: itensLimpos(t.itens), atualizado_em: new Date().toISOString() };
      const { error } = t.id ? await sb.from('nx_modelos_treino').update(row).eq('id', t.id) : await sb.from('nx_modelos_treino').insert({ ...row, org_id: S.org.id, criado_por: S.user.id });
      if (error) { btn.disabled = false; return toast('Não foi possível salvar o modelo.', true); }
      toast('Modelo salvo!'); location.hash = '#/treinos'; return;
    }
    if (ehModelo && e.target.closest('#excluir')) {
      if (!confirm('Excluir este modelo? Os treinos já enviados aos alunos continuam.')) return;
      const { error } = await sb.from('nx_modelos_treino').delete().eq('id', t.id);
      error ? toast('Não foi possível excluir.', true) : (toast('Modelo excluído.'), (location.hash = '#/treinos')); return;
    }
    if (e.target.closest('#salvar')) {
      syncCampos();
      if (!t.titulo.trim()) return toast('Dê um nome ao treino.', true);
      const btn = e.target.closest('#salvar'); btn.disabled = true;
      try {
        const base = { titulo: t.titulo.trim(), foco: t.foco.trim() || null, observacoes: t.observacoes.trim() || null, ativo: t.ativo, atualizado_em: new Date().toISOString() };
        let id = t.id;
        if (novo) {
          const ex = await buscarTreinosDoAluno(alunoId);
          const { data, error } = await sb.from('nx_treinos').insert({ ...base, org_id: S.org.id, aluno_id: alunoId, ordem: ex.length, criado_por: S.user.id }).select('id').single();
          if (error) throw error; id = data.id;
        } else {
          const { error } = await sb.from('nx_treinos').update(base).eq('id', id); if (error) throw error;
          const { error: e2 } = await sb.from('nx_treino_itens').delete().eq('treino_id', id); if (e2) throw e2;
        }
        const num = (v) => { const n = parseInt(String(v).replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; };
        if (t.itens.length) {
          const { error } = await sb.from('nx_treino_itens').insert(t.itens.map((it, i) => ({
            treino_id: id, exercicio_id: it.exercicio_id, ordem: i, series: Array.isArray(it.series_det) && it.series_det.length ? it.series_det.length : num(it.series), series_det: detLimpo(it),
            repeticoes: String(it.repeticoes || '').trim() || null, carga: String(it.carga || '').trim() || null,
            descanso_seg: num(it.descanso_seg), observacao: String(it.observacao || '').trim() || null,
          })));
          if (error) throw error;
        }
        if (t.ativo && t.itens.length) notificar('treino', id);
        toast('Treino salvo!'); location.hash = `#/aluno/${alunoId}/forca`;
      } catch (err) { console.error(err); btn.disabled = false; toast('Não foi possível salvar o treino.', true); }
      return;
    }
    if (e.target.closest('#excluir')) {
      if (!confirm('Excluir este treino? O histórico do aluno continua guardado.')) return;
      const { error } = await sb.from('nx_treinos').delete().eq('id', t.id);
      error ? toast('Não foi possível excluir.', true) : (toast('Treino excluído.'), (location.hash = `#/aluno/${alunoId}/forca`));
    }
  };
}

/* ---------- modelos de treino e envio para vários alunos ---------- */
const numInt = (v) => { const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; };
const detLimpo = (it) => Array.isArray(it.series_det) && it.series_det.length ? it.series_det.map((d) => ({ reps: String(d.reps || '').trim() || null, carga: String(d.carga || '').trim() || null, desc: numInt(d.desc) })) : null;
const resumoDet = (det) => { const r = det.map((d) => d.reps).filter(Boolean); const c = det.map((d) => d.carga).filter(Boolean); return [`${det.length} séries`, r.length ? r.join('/') + ' reps' : '', c.length ? (c[0] === c[c.length - 1] ? c[0] : `${c[0]} → ${c[c.length - 1]}`) : ''].filter(Boolean).join(' · '); };
const itensLimpos = (itens) => itens.map((it) => ({ series_det: detLimpo(it), exercicio_id: it.exercicio_id, series: Array.isArray(it.series_det) && it.series_det.length ? it.series_det.length : numInt(it.series), repeticoes: String(it.repeticoes || '').trim() || null, carga: String(it.carga || '').trim() || null, descanso_seg: numInt(it.descanso_seg), observacao: String(it.observacao || '').trim() || null }));
async function buscarModelosTreino() {
  const { data } = await sb.from('nx_modelos_treino').select('*').eq('org_id', S.org.id).order('nome');
  return data || [];
}
async function escolherModeloTreino(aoEscolher) {
  const mods = await buscarModelosTreino();
  openSheet(`<p class="eyebrow">Modelos de treino</p><div class="h2" style="margin-top:4px">Escolha um modelo</div>
    ${mods.length ? `<div class="stack" style="margin-top:16px" id="ml">${mods.map((m) => `<button class="list-item" data-m="${m.id}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.lib}</span><div class="grow"><b>${esc(m.nome)}</b><div class="small muted">${m.foco ? esc(m.foco) + ' · ' : ''}${(m.itens || []).length} exercícios</div></div>${I.chev}</button>`).join('')}</div>`
      : '<div class="empty" style="margin-top:16px"><div class="h3">Nenhum modelo ainda</div><p class="small">Monte um treino e toque em “Salvar como modelo”, ou crie em Exercícios → Modelos.</p></div>'}`, (r) => {
    const l = r.querySelector('#ml'); if (l) l.onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { closeSheet(); aoEscolher(mods.find((m) => m.id === b.dataset.m)); } };
  });
}
function salvarComoModelo(t) {
  openSheet(`<p class="eyebrow">Salvar como modelo</p><form id="f-sm" style="margin-top:12px"><label class="field"><span>Nome do modelo</span><input class="input" name="nome" value="${esc(t.titulo)}${t.foco ? ' – ' + esc(t.foco) : ''}" required autofocus></label>
    <p class="tiny dim" style="margin:-4px 0 12px">O modelo fica em Exercícios → Modelos, pronto para usar com qualquer aluno.</p><button class="btn block">Salvar modelo</button></form>`, (r) => {
    r.querySelector('#f-sm').onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.from('nx_modelos_treino').insert({ org_id: S.org.id, nome: e.target.nome.value.trim(), foco: t.foco.trim() || null, observacoes: t.observacoes.trim() || null, itens: itensLimpos(t.itens), criado_por: S.user.id });
      if (error) return toast('Não foi possível salvar o modelo.', true);
      closeSheet(); toast('Modelo salvo na biblioteca!');
    };
  });
}
async function escolherAlunos(excluir, titulo, aoConfirmar) {
  const { data } = await sb.from('nx_membros').select('user_id,nome,objetivo,ativo,treinador_id').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome');
  const alunos = (data || []).filter((a) => a.ativo && a.user_id !== excluir && ehMeuAluno(a));
  const sel = new Set(); let q = '';
  openSheet(`<p class="eyebrow">${esc(titulo)}</p><div class="h2" style="margin-top:4px">Escolha os alunos</div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="pa-q" placeholder="Buscar aluno"></div>
    <div class="row between" style="margin:10px 0 6px"><button class="link-btn small" id="pa-todos">Selecionar todos</button><span class="small muted" id="pa-n">nenhum selecionado</span></div>
    <div class="stack pa-lista" id="pa-l"></div>
    <label class="aceite" style="margin-top:8px"><input type="checkbox" id="pa-avisar" checked><span>Avisar os alunos por notificação</span></label>
    <button class="btn block" id="pa-ok" disabled>Enviar</button>`, (r) => {
    const draw = () => {
      const nq = semAcento(q);
      r.querySelector('#pa-l').innerHTML = alunos.filter((a) => !nq || semAcento(a.nome).includes(nq)).map((a) => `<label class="pa-item ${sel.has(a.user_id) ? 'on' : ''}"><input type="checkbox" data-a="${a.user_id}" ${sel.has(a.user_id) ? 'checked' : ''}><div class="av">${esc(initials(a.nome))}</div><div class="grow"><b>${esc(a.nome)}</b>${a.objetivo ? `<div class="tiny dim ellip">${esc(a.objetivo)}</div>` : ''}</div><span class="pa-check">${I.check}</span></label>`).join('') || '<p class="small muted">Nenhum aluno encontrado.</p>';
      const n = sel.size; r.querySelector('#pa-n').textContent = n ? `${n} selecionado${n > 1 ? 's' : ''}` : 'nenhum selecionado';
      const ok = r.querySelector('#pa-ok'); ok.disabled = !n; ok.textContent = n ? `Enviar para ${n} aluno${n > 1 ? 's' : ''}` : 'Enviar';
    };
    draw();
    r.querySelector('#pa-q').oninput = (e) => { q = e.target.value; draw(); };
    r.querySelector('#pa-l').onchange = (e) => { const c = e.target.closest('[data-a]'); if (!c) return; c.checked ? sel.add(c.dataset.a) : sel.delete(c.dataset.a); draw(); };
    r.querySelector('#pa-todos').onclick = () => { const todos = alunos.every((a) => sel.has(a.user_id)); alunos.forEach((a) => (todos ? sel.delete(a.user_id) : sel.add(a.user_id))); draw(); };
    r.querySelector('#pa-ok').onclick = async (e) => { e.currentTarget.disabled = true; e.currentTarget.textContent = 'Enviando…'; try { await aoConfirmar([...sel], r.querySelector('#pa-avisar').checked); closeSheet(); } catch (err) { console.error(err); toast('Não foi possível enviar.', true); draw(); } };
  });
}
async function aplicarTreinoAlunos(t, ids, avisar) {
  if (!ids.length) return 0;
  const { data: ex } = await sb.from('nx_treinos').select('aluno_id').eq('org_id', S.org.id).in('aluno_id', ids);
  const qtd = {}; (ex || []).forEach((x) => { qtd[x.aluno_id] = (qtd[x.aluno_id] || 0) + 1; });
  const agora = new Date().toISOString();
  const { data: novos, error } = await sb.from('nx_treinos').insert(ids.map((id) => ({ org_id: S.org.id, aluno_id: id, titulo: t.titulo.trim(), foco: (t.foco || '').trim() || null, observacoes: (t.observacoes || '').trim() || null, ativo: true, ordem: qtd[id] || 0, criado_por: S.user.id, atualizado_em: agora }))).select('id,aluno_id');
  if (error) throw error;
  const limpos = itensLimpos(t.itens);
  const itens = [];
  (novos || []).forEach((n) => limpos.forEach((it, i) => itens.push({ ...it, treino_id: n.id, ordem: i })));
  if (itens.length) { const { error: e2 } = await sb.from('nx_treino_itens').insert(itens); if (e2) throw e2; }
  if (avisar) (novos || []).forEach((n) => notificar('treino', n.id));
  return (novos || []).length;
}

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function filtrarEx(exs, g, q, eq) {
  const nq = semAcento(q).trim().split(/\s+/).filter(Boolean);
  return exs.filter((e) => (g === 'Todos' || e.grupo === g) && (!eq || eq === 'Todos' || e.equipamento === eq) &&
    (!nq.length || nq.every((w) => semAcento(e.nome + ' ' + (e.nome_en || '') + ' ' + (e.equipamento || '')).includes(w))));
}
const LIM = 60;
/* ---------- biblioteca de exercícios: buscar, favoritar, criar (com foto, vídeo ou YouTube) ---------- */
const GRUPOS_MUSC = ['Abdômen', 'Antebraço', 'Bíceps', 'Cardio', 'Core', 'Corrida/Educativo', 'Costas', 'Funcional', 'Glúteos', 'Mobilidade', 'Alongamento', 'Ombros', 'Panturrilha', 'Peito', 'Pernas', 'Pescoço', 'Pliometria', 'Posterior', 'Tríceps'];
const CATS_EX = ['Musculação', 'Funcional', 'Mobilidade', 'Alongamento', 'Aquecimento', 'Pliometria', 'Cardio', 'Educativo de corrida'];
const STAR = (on) => `<svg viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`;
const ordenaPt = (l) => [...new Set(l.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
async function carregarFavoritos() {
  if (!S.cache.fav) {
    const { data } = await sb.from('nx_ex_favoritos').select('exercicio_id').eq('user_id', S.user.id).then((r) => r, () => ({ data: [] }));
    S.cache.fav = new Set((data || []).map((x) => x.exercicio_id));
  }
  return S.cache.fav;
}
async function alternarFavorito(id) {
  const fav = await carregarFavoritos(); const on = !fav.has(id);
  on ? fav.add(id) : fav.delete(id);
  const { error } = on ? await sb.from('nx_ex_favoritos').insert({ exercicio_id: id, org_id: S.org.id })
    : await sb.from('nx_ex_favoritos').delete().eq('user_id', S.user.id).eq('exercicio_id', id);
  if (error) { on ? fav.delete(id) : fav.add(id); toast('Não foi possível salvar o favorito.', true); }
  return fav.has(id);
}
const exMidia = (e) => e.video_url ? (ehVideoArquivo(e.video_url) ? 'video' : 'youtube') : (e.imagens || []).some((p) => /nx-exvideos/.test(p)) ? 'foto' : 'nenhuma';
function exItemBib(e, fav, acao) {
  const md = exMidia(e);
  const tags = [e.grupo, e.categoria].filter(Boolean).map((t) => `<span class="pill">${esc(t)}</span>`).join('');
  return `<div class="bib-it" data-ex="${e.id}">${exFig(e, 'thumb')}
    <div class="grow" style="min-width:0"><b class="ellip2">${esc(e.nome)}</b><div class="bib-tags">${tags}${md === 'video' || md === 'youtube' ? `<span class="pill acc">${I.play} vídeo</span>` : ''}</div></div>
    <button type="button" class="bib-star ${fav.has(e.id) ? 'on' : ''}" data-fav="${e.id}" aria-label="${fav.has(e.id) ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}">${STAR(fav.has(e.id))}</button>${acao}</div>`;
}
/** lista com abas (Todos, Favoritos, Meus), busca, grupo muscular e categoria. Usada na biblioteca e na hora de prescrever. */
function bibliotecaUI(box, exs, fav, { aoTocar, aoCriar, acao = '' }) {
  const st = S.cache.bibSt || (S.cache.bibSt = { aba: 'todos', g: '', c: '', q: '' });
  let n = LIM;
  const grupos = ordenaPt(exs.map((e) => e.grupo)), cats = ordenaPt([...CATS_EX, ...exs.map((e) => e.categoria)]);
  box.innerHTML = `<button type="button" class="bib-criar" data-criar>${I.plus} Criar exercício</button>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" data-q placeholder="Buscar exercícios…" value="${esc(st.q)}"></div>
    <div class="bib-abas">${[['todos', 'Todos'], ['fav', 'Favoritos'], ['meus', 'Meus exercícios']].map(([k, l]) => `<button type="button" data-aba="${k}" class="${st.aba === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="bib-filtros"><select class="select" data-g><option value="">Grupo muscular</option>${grupos.map((x) => `<option ${st.g === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <select class="select" data-c><option value="">Categoria</option>${cats.map((x) => `<option ${st.c === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <button type="button" class="link-btn small" data-limpar>Limpar</button></div>
    <p class="tiny dim" data-n style="margin-top:10px"></p><div class="bib-lista" data-l></div>`;
  const draw = () => {
    let l = filtrarEx(exs, st.g || 'Todos', st.q);
    if (st.c) l = l.filter((e) => e.categoria === st.c);
    if (st.aba === 'fav') l = l.filter((e) => fav.has(e.id)); else if (st.aba === 'meus') l = l.filter((e) => e.criado_por === S.user.id);
    box.querySelector('[data-n]').textContent = `${l.length} exercício${l.length === 1 ? '' : 's'}`;
    const vazio = st.aba === 'fav' ? 'Toque na estrela de um exercício para ele aparecer aqui.' : st.aba === 'meus' ? 'Os exercícios que você criar aparecem aqui.' : 'Nada encontrado. Tente outro termo ou crie o exercício.';
    box.querySelector('[data-l]').innerHTML = (l.slice(0, n).map((e) => exItemBib(e, fav, acao)).join('') || `<div class="empty"><p class="small">${vazio}</p></div>`)
      + (l.length > n ? `<button type="button" class="btn ghost block" data-mais style="margin-top:10px">Mostrar mais (${l.length - n})</button>` : '');
  };
  draw();
  box.querySelector('[data-q]').oninput = (e) => { st.q = e.target.value; n = LIM; draw(); };
  box.querySelector('[data-g]').onchange = (e) => { st.g = e.target.value; n = LIM; draw(); };
  box.querySelector('[data-c]').onchange = (e) => { st.c = e.target.value; n = LIM; draw(); };
  box.onclick = async (e) => {
    if (e.target.closest('[data-criar]')) return aoCriar();
    if (e.target.closest('[data-limpar]')) { Object.assign(st, { g: '', c: '', q: '' }); box.querySelector('[data-q]').value = ''; box.querySelector('[data-g]').value = ''; box.querySelector('[data-c]').value = ''; n = LIM; return draw(); }
    if (e.target.closest('[data-mais]')) { n += LIM; return draw(); }
    const ab = e.target.closest('[data-aba]');
    if (ab) { st.aba = ab.dataset.aba; box.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('on', b === ab)); n = LIM; return draw(); }
    const fb = e.target.closest('[data-fav]');
    if (fb) { const on = await alternarFavorito(fb.dataset.fav); fb.classList.toggle('on', on); fb.innerHTML = STAR(on); if (st.aba === 'fav') draw(); return; }
    const it = e.target.closest('[data-ex]'); if (it) aoTocar(exs.find((x) => x.id === it.dataset.ex));
  };
}
async function escolherExercicio(exs, onPick) {
  const fav = await carregarFavoritos();
  const abrir = () => openSheet(`<div class="h2" style="padding-right:44px">Biblioteca de exercícios</div><div id="bib-box" style="margin-top:14px"></div>`, (root) => {
    bibliotecaUI(root.querySelector('#bib-box'), exs, fav, {
      acao: `<span class="icon-btn" style="width:36px;height:36px;flex:none">${I.plus}</span>`,
      aoTocar: (ex) => { closeSheet(); onPick(ex); },
      aoCriar: () => formExercicio(null, { voltar: abrir, aoSalvar: (ex) => { exs.push(ex); exs.sort((a, b) => a.nome.localeCompare(b.nome, 'pt')); closeSheet(); onPick(ex); } }),
    });
  });
  abrir();
}
/** corta um trecho do vídeo no próprio aparelho (sem servidor): toca o trecho num canvas e grava.
 *  Sai um clipe curto, leve e sem som, que o app toca em loop como um GIF. */
async function cortarVideo(src, ini, fim, aoProgresso) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.crossOrigin = 'anonymous'; v.preload = 'auto';
  v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0';
  document.body.appendChild(v);
  const url = src instanceof Blob ? URL.createObjectURL(src) : src;
  try {
    v.src = url;
    await new Promise((ok, erro) => { v.onloadedmetadata = ok; v.onerror = () => erro(new Error('vídeo')); });
    const k = Math.min(1, 720 / Math.max(v.videoWidth || 720, v.videoHeight || 720));
    const cv = document.createElement('canvas'); cv.width = Math.round(((v.videoWidth || 720) * k) / 2) * 2; cv.height = Math.round(((v.videoHeight || 1280) * k) / 2) * 2;
    const ctx = cv.getContext('2d');
    const tipo = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!tipo || !cv.captureStream) throw new Error('sem suporte');
    v.currentTime = ini; await new Promise((ok) => { v.onseeked = ok; });
    ctx.drawImage(v, 0, 0, cv.width, cv.height);
    const rec = new MediaRecorder(cv.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 2500000 });
    const partes = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
    const fimRec = new Promise((ok) => { rec.onstop = ok; });
    rec.start(250); await v.play();
    await new Promise((ok) => {
      const passo = () => {
        ctx.drawImage(v, 0, 0, cv.width, cv.height);
        if (aoProgresso) aoProgresso(Math.min(1, (v.currentTime - ini) / (fim - ini)));
        if (v.currentTime >= fim || v.ended) { v.pause(); ok(); return; }
        v.requestVideoFrameCallback ? v.requestVideoFrameCallback(passo) : requestAnimationFrame(passo);
      };
      passo();
    });
    rec.stop(); await fimRec;
    const mime = tipo.split(';')[0];
    return new File([new Blob(partes, { type: mime })], `trecho.${mime === 'video/mp4' ? 'mp4' : 'webm'}`, { type: mime });
  } finally { if (src instanceof Blob) URL.revokeObjectURL(url); v.remove(); }
}
const mmssC = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}${t % 1 >= 0.05 ? ',' + Math.floor((t % 1) * 10) : ''}`;
/** painel de corte: prévia, começo/fim e atalhos de 5, 10 e 15 s. Devolve { ativo, ini, fim } atualizado */
function painelCorte(box, src, cortarPadrao) {
  const st = { ativo: false, ini: 0, fim: 0, dur: 0 };
  const url = src instanceof Blob ? URL.createObjectURL(src) : src;
  box.hidden = false;
  box.innerHTML = `<div class="corte-v"><video src="${esc(url)}" muted playsinline preload="metadata" crossorigin="anonymous"></video></div>
    <label class="aceite" style="margin-top:10px"><input type="checkbox" data-c="on"><span><b>Cortar o vídeo</b> (vira um trecho curto, em loop, como um GIF)</span></label>
    <div data-c="ctl" hidden>
      <div class="corte-faixa"><i data-c="sel"></i></div>
      <label class="corte-r"><span>Começa em <b data-c="ti">0:00</b></span><input type="range" data-c="ini" min="0" step="0.1" value="0"></label>
      <label class="corte-r"><span>Termina em <b data-c="tf">0:00</b></span><input type="range" data-c="fim" min="0" step="0.1" value="0"></label>
      <div class="row between" style="gap:8px;flex-wrap:wrap;margin-top:6px"><div class="row" style="gap:6px">${[5, 10, 15].map((n) => `<button type="button" class="chip" data-dur="${n}">${n} s</button>`).join('')}</div>
        <button type="button" class="btn ghost sm" data-c="ver">${I.play} Ver trecho</button></div>
      <p class="tiny dim" data-c="info" style="margin-top:8px"></p>
    </div>`;
  const v = box.querySelector('video'), q = (k) => box.querySelector(`[data-c="${k}"]`);
  const desenhar = () => {
    q('ti').textContent = mmssC(st.ini); q('tf').textContent = mmssC(st.fim);
    q('ini').value = st.ini; q('fim').value = st.fim;
    q('sel').style.left = (st.ini / st.dur) * 100 + '%'; q('sel').style.width = ((st.fim - st.ini) / st.dur) * 100 + '%';
    q('info').textContent = `Trecho de ${(Math.round((st.fim - st.ini) * 10) / 10).toString().replace('.', ',')} s de um vídeo de ${mmssC(st.dur)}. O trecho fica sem som e leve para o aluno abrir rápido.`;
  };
  const ligar = (on) => { st.ativo = on; q('on').checked = on; q('ctl').hidden = !on; box.closest('form').querySelector('[name="sem_audio"]').closest('label').hidden = on; };
  v.onloadedmetadata = () => {
    st.dur = v.duration || 0; if (!isFinite(st.dur) || !st.dur) return;
    q('ini').max = st.dur; q('fim').max = st.dur; st.fim = Math.min(st.dur, 10);
    desenhar(); ligar(cortarPadrao || st.dur > 20);
  };
  q('on').onchange = () => ligar(q('on').checked);
  q('ini').oninput = () => { st.ini = Math.min(+q('ini').value, st.dur - 1); if (st.fim <= st.ini + 1) st.fim = Math.min(st.dur, st.ini + 1); if (st.fim - st.ini > 30) st.fim = st.ini + 30; v.currentTime = st.ini; desenhar(); };
  q('fim').oninput = () => { st.fim = Math.max(+q('fim').value, st.ini + 1); if (st.fim - st.ini > 30) st.ini = st.fim - 30; v.currentTime = st.fim; desenhar(); };
  box.onclick = (e) => {
    const d = e.target.closest('[data-dur]'); if (d) { st.fim = Math.min(st.dur, st.ini + +d.dataset.dur); desenhar(); return; }
    if (e.target.closest('[data-c="ver"]')) { v.currentTime = st.ini; v.play().catch(() => {}); const ate = () => { if (v.currentTime >= st.fim) { v.pause(); v.currentTime = st.ini; return; } requestAnimationFrame(ate); }; ate(); }
  };
  return st;
}
async function enviarMidiaEx(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || (file.type.split('/')[1] || 'bin');
  const path = `${S.org.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('nx-exvideos').upload(path, file, { contentType: file.type || undefined, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('nx-exvideos').getPublicUrl(path).data.publicUrl;
}
/** criar ou editar exercício. opts.aoSalvar recebe o exercício salvo; opts.voltar volta para a lista de onde veio */
async function formExercicio(exLista, opts = {}) {
  const novo = !exLista;
  let ex = { nome: '', grupo: '', categoria: '', equipamento: '', descricao: '', video_url: '', imagens: [], instrucoes: [], com_audio: false };
  if (!novo) {
    const { data } = await sb.from('nx_exercicios').select('*').eq('id', exLista.id).maybeSingle();
    ex = data || exLista;
    if ((!ex.instrucoes || !ex.instrucoes.length) && ex.ref_externa) {
      try { const r = await fetch(imgURL(ex.ref_externa + '/info.json')); if (r.ok) ex.instrucoes = (await r.json()).instrucoes || []; } catch {}
    }
  }
  const fav = await carregarFavoritos();
  const passos = (ex.instrucoes && ex.instrucoes.length ? ex.instrucoes : (ex.descricao ? [ex.descricao] : [])).join('\n');
  const grupos = ordenaPt([...GRUPOS_MUSC, ...(S.cache.ex || []).map((e) => e.grupo), ex.grupo]);
  const cats = ordenaPt([...CATS_EX, ...(S.cache.ex || []).map((e) => e.categoria), ex.categoria]);
  const md0 = exMidia(ex);
  const MIDIAS = [['nenhuma', 'Sem mídia'], ['foto', 'Foto ou GIF'], ['video', 'Vídeo do celular'], ['youtube', 'Link do YouTube']];
  openSheet(`
    ${opts.voltar ? `<button type="button" class="ex-voltar" id="ex-voltar">${I.back} Biblioteca</button>` : `<p class="eyebrow">${novo ? 'Biblioteca' : esc(ex.grupo || '')}</p>`}
    <div class="h2" style="margin-top:6px;padding-right:44px">${novo ? 'Criar exercício' : esc(ex.nome)}</div>
    ${novo ? '' : `${ex.imagens && ex.imagens.length ? exFig(ex, 'big') : ''}<div class="ex-detail">${exDetalhe(ex)}</div><div class="tabs" style="margin-top:16px"><button class="on" type="button">Editar</button></div>`}
    <form id="f-ex" style="margin-top:14px" novalidate>
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(ex.nome)}" ${novo ? 'autofocus' : ''} placeholder="Ex.: Agachamento búlgaro"></label>
      <label class="field"><span>Mídia</span><select class="select" name="midia">${MIDIAS.map(([k, l]) => `<option value="${k}" ${k === md0 ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="ex-midia" data-m="foto" hidden><div class="field"><span>Foto ou GIF</span><label class="arq-btn"><input type="file" name="foto" accept="image/jpeg,image/png,image/webp,image/gif"><b>Escolher arquivo</b><i>nenhum arquivo selecionado</i></label></div>
        ${md0 === 'foto' ? '<p class="tiny dim" style="margin-top:-6px">Já tem uma foto. Escolha outra só se quiser trocar.</p>' : ''}</div>
      <div class="ex-midia" data-m="video" hidden><div class="field"><span>Vídeo do celular</span><label class="arq-btn"><input type="file" name="video" accept="video/mp4,video/quicktime,video/webm"><b>Escolher arquivo</b><i>nenhum arquivo selecionado</i></label></div>
        ${md0 === 'video' ? '<p class="tiny dim" style="margin-top:-6px">Já tem um vídeo. Escolha outro só se quiser trocar, ou <button type="button" class="link-btn small" id="corte-atual">corte o vídeo atual</button>.</p>' : ''}
        <div class="corte" id="corte" hidden></div>
        <label class="aceite" style="margin-top:4px"><input type="checkbox" name="sem_audio" ${ex.com_audio ? '' : 'checked'}><span>Remover áudio (o vídeo toca sem som para o aluno)</span></label></div>
      <div class="ex-midia" data-m="youtube" hidden><label class="field"><span>Link do YouTube</span><input class="input" type="url" name="yt" value="${md0 === 'youtube' ? esc(ex.video_url) : ''}" placeholder="https://youtube.com/…"></label></div>
      <label class="field"><span>Grupo muscular</span><select class="select" name="grupo"><option value="">Selecione o grupo muscular</option>${grupos.map((x) => `<option ${x === ex.grupo ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><small class="campo-erro" data-err="grupo" hidden>Campo obrigatório</small></label>
      <label class="field"><span>Categoria</span><select class="select" name="categoria"><option value="">Selecione a categoria</option>${cats.map((x) => `<option ${x === ex.categoria ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <div class="field"><span>Adicionar aos favoritos</span><div class="radios"><label><input type="radio" name="fav" value="1" ${!novo && fav.has(ex.id) ? 'checked' : ''}><span>Sim</span></label><label><input type="radio" name="fav" value="0" ${novo || !fav.has(ex.id) ? 'checked' : ''}><span>Não</span></label></div></div>
      <details class="ex-mais"${!novo && (passos || ex.equipamento) ? ' open' : ''}><summary>Mais detalhes (opcional)</summary>
        <label class="field" style="margin-top:10px"><span>Equipamento</span><input class="input" name="equipamento" value="${esc(ex.equipamento || '')}" placeholder="Halteres, elástico, peso do corpo…"></label>
        <label class="field"><span>Como executar (um passo por linha)</span><textarea class="textarea" name="instrucoes" rows="4" placeholder="Pés na largura dos ombros&#10;Desça com o quadril para trás">${esc(passos)}</textarea></label></details>
      <button class="btn block" id="ex-salvar">Salvar</button>
      ${novo ? '' : '<button type="button" class="btn danger block" id="del-ex" style="margin-top:8px">Excluir exercício</button>'}
    </form>`, (root) => {
    const f = root.querySelector('#f-ex');
    const mostrar = () => root.querySelectorAll('.ex-midia').forEach((d) => { d.hidden = d.dataset.m !== f.midia.value; });
    mostrar(); f.midia.onchange = mostrar;
    let corte = null, corteSrc = null;
    root.querySelectorAll('.arq-btn input').forEach((inp) => { inp.onchange = () => {
      inp.parentNode.querySelector('i').textContent = inp.files[0] ? inp.files[0].name : 'nenhum arquivo selecionado'; inp.parentNode.classList.toggle('ok', !!inp.files[0]);
      if (inp.name === 'video') { if (inp.files[0]) { corteSrc = inp.files[0]; corte = painelCorte(root.querySelector('#corte'), corteSrc, inp.files[0].size > 50 * 1024 * 1024); } else { corte = null; root.querySelector('#corte').hidden = true; } }
    }; });
    const ca = root.querySelector('#corte-atual'); if (ca) ca.onclick = () => { corteSrc = ex.video_url; corte = painelCorte(root.querySelector('#corte'), corteSrc, true); };
    f.grupo.onchange = () => { root.querySelector('[data-err="grupo"]').hidden = !!f.grupo.value; };
    const vt = root.querySelector('#ex-voltar'); if (vt) vt.onclick = opts.voltar;
    f.onsubmit = async (e) => {
      e.preventDefault();
      const nome = f.nome.value.trim(), midia = f.midia.value;
      if (nome.length < 2) { f.nome.focus(); return toast('Digite o nome do exercício.', true); }
      if (!f.grupo.value) { root.querySelector('[data-err="grupo"]').hidden = false; f.grupo.focus(); return toast('Escolha o grupo muscular.', true); }
      const arq = midia === 'foto' ? f.foto.files[0] : midia === 'video' ? f.video.files[0] : null;
      if (midia === 'foto' && !arq && md0 !== 'foto') return toast('Escolha a foto ou o GIF.', true);
      if (midia === 'video' && !arq && md0 !== 'video') return toast('Escolha o vídeo.', true);
      const vaiCortar = midia === 'video' && corte && corte.ativo && corte.fim > corte.ini;
      if (arq && !vaiCortar && arq.size > 50 * 1024 * 1024) return toast('O vídeo passa de 50 MB. Marque “Cortar o vídeo” e escolha um trecho.', true);
      const yt = f.yt.value.trim();
      if (midia === 'youtube' && !/^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(yt)) return toast('Cole um link do YouTube válido.', true);
      const btn = root.querySelector('#ex-salvar'); btn.disabled = true; btn.textContent = arq ? 'Enviando a mídia…' : 'Salvando…';
      let arqFinal = arq;
      try {
        if (vaiCortar) {
          try { arqFinal = await cortarVideo(corteSrc, corte.ini, corte.fim, (p) => { btn.textContent = `Cortando o vídeo… ${Math.round(p * 100)}%`; }); }
          catch (er) { console.error(er); btn.disabled = false; btn.textContent = 'Salvar'; return toast('Este celular não conseguiu cortar o vídeo. Tente pelo Chrome ou envie um vídeo mais curto.', true); }
          btn.textContent = 'Enviando a mídia…';
        }
        const linhas = f.instrucoes.value.split('\n').map((x) => x.trim()).filter(Boolean);
        const proprias = (ex.imagens || []).filter((p) => /nx-exvideos/.test(p)), daBib = (ex.imagens || []).filter((p) => !/nx-exvideos/.test(p));
        const d = { nome, grupo: f.grupo.value, categoria: f.categoria.value || null, equipamento: f.equipamento.value.trim() || null, instrucoes: linhas, descricao: linhas[0] || null };
        const url = arqFinal ? (await enviarMidiaEx(arqFinal)) + (vaiCortar ? '#loop' : '') : null;
        if (midia === 'nenhuma') Object.assign(d, { video_url: null, imagens: daBib });
        else if (midia === 'foto') Object.assign(d, { video_url: null, imagens: url ? [url] : proprias.length ? proprias : daBib });
        else if (midia === 'video') Object.assign(d, { video_url: url || ex.video_url, imagens: proprias.length ? [] : daBib, com_audio: !vaiCortar && !f.sem_audio.checked });
        else Object.assign(d, { video_url: yt, imagens: proprias.length ? [] : daBib });
        if (!d.video_url || midia !== 'video') d.com_audio = false;
        const r = novo ? await sb.from('nx_exercicios').insert({ ...d, org_id: S.org.id, criado_por: S.user.id }).select('*').single()
          : await sb.from('nx_exercicios').update(d).eq('id', ex.id).select('*').single();
        if (r.error) throw r.error;
        const querFav = f.fav.value === '1';
        if (querFav !== fav.has(r.data.id)) await alternarFavorito(r.data.id);
        S.cache.ex = null; toast(novo ? 'Exercício criado!' : 'Exercício atualizado!');
        if (opts.aoSalvar) return opts.aoSalvar(r.data);
        closeSheet(); staffBiblioteca();
      } catch (err) {
        console.error(err); btn.disabled = false; btn.textContent = 'Salvar';
        toast(arq ? 'Não foi possível enviar a mídia. Confira a internet e tente de novo.' : 'Não foi possível salvar.', true);
      }
    };
    const del = root.querySelector('#del-ex');
    if (del) del.onclick = async () => {
      if (!confirm(`Excluir “${ex.nome}”?`)) return;
      const { error } = await sb.from('nx_exercicios').delete().eq('id', ex.id);
      if (error) return toast('Esse exercício está em algum treino. Remova dos treinos antes de excluir.', true);
      closeSheet(); toast('Exercício excluído.'); S.cache.ex = null; staffBiblioteca();
    };
  });
}

/* ---------- retornos (feed de check-ins) ---------- */
async function staffFeed() {
  loading();
  const [sessT, { data: membrosT }, , , corrNovasT] = await Promise.all([buscarSessoes(null, 80), sb.from('nx_membros').select('user_id,nome,papel,treinador_id').eq('org_id', S.org.id), contarNaoVistos(), contarMsgNovas(),
    sb.from('nx_corridas').select('id,aluno_id,data,tipo,distancia_m,duracao_s,rpe,dor,comentario').eq('org_id', S.org.id).eq('visto_treinador', false).order('data', { ascending: false }).limit(30).then((r) => r.data || [])]);
  const membros = (membrosT || []).filter((m) => m.papel === 'aluno' && ehMeuAluno(m)), vis = new Set(membros.map((m) => m.user_id));
  const sess = sessT.filter((x) => vis.has(x.aluno_id)), corrNovas = corrNovasT.filter((x) => vis.has(x.aluno_id));
  const nomes = Object.fromEntries(membros.map((m) => [m.user_id, m.nome]));
  dockStaff();
  const novos = sess.filter((s) => !s.visto_treinador);
  const porAluno = Object.entries(S.cache.msgPorAluno || {});
  $app.innerHTML = `
    <p class="eyebrow">Retornos</p><h1 class="h1">Retornos dos alunos</h1>
    <p class="muted small" style="margin-top:6px">${novos.length || porAluno.length ? [novos.length ? `${novos.length} check-in${novos.length > 1 ? 's' : ''} novo${novos.length > 1 ? 's' : ''}` : '', S.cache.msgNovas ? `${S.cache.msgNovas} mensage${S.cache.msgNovas > 1 ? 'ns' : 'm'} sem resposta` : ''].filter(Boolean).join(' · ') : 'Tudo em dia por aqui.'}</p>
    ${porAluno.length ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Mensagens</h2>${slashes}</div>${porAluno.map(([id, n]) => `<a class="list-item" href="#/aluno/${id}/conversa" style="color:inherit"><div class="av st-ok">${esc(initials(nomes[id]))}</div><div class="grow"><b class="ellip" style="display:block">${esc(nomes[id] || 'Aluno')}</b><span class="small muted">${n} mensage${n > 1 ? 'ns' : 'm'} nova${n > 1 ? 's' : ''}</span></div><span class="tag acc">Responder</span></a>`).join('')}</div>` : ''}
    ${corrNovas.length ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Atividades novas</h2>${slashes}</div>${corrNovas.map((c) => `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><div class="av st-ok">${esc(initials(nomes[c.aluno_id]))}</div><div class="grow"><b class="ellip" style="display:block">${esc(nomes[c.aluno_id] || 'Aluno')}</b><span class="small muted">${ehCorr(c) ? `${fmtKm(c.distancia_m, 1)} · ${fmtPace(paceDe(c))}` : `${nomeAtiv(c)} · ${resumoAtiv(c)}`} · ${quando(c.data)}</span></div>${c.dor ? '<span class="tag warn">dor</span>' : ''}${c.rpe != null ? `<span class="rpe" style="background:${rpeCor(c.rpe)}">${c.rpe}</span>` : ''}${I.chev}</a>`).join('')}</div>` : ''}
    <div class="section" style="margin-top:22px"><div class="section-h"><h2 class="h2">Check-ins</h2>${novos.length ? '<button class="link-btn" id="todos-vistos">Marcar todos como vistos</button>' : slashes}</div>
    <div class="stack" id="feed">${sess.length ? sess.map((s) => sessaoCard(s, nomes[s.aluno_id] || 'Aluno').replace(/<\/div><\/div>$/, `<div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost sm" data-resp="${s.id}">${I.feed} Responder</button><button class="link-btn small" data-ver="${s.id}">Ver aluno</button></div></div></div>`)).join('') : '<div class="empty"><div class="h3">Nenhum treino registrado ainda</div><p class="small">Quando os alunos finalizarem treinos, os check-ins aparecem aqui.</p></div>'}</div></div>`;
  document.getElementById('feed').onclick = async (e) => {
    const c = e.target.closest('[data-sessao]'); if (!c) return;
    const s = sess.find((x) => x.id === c.dataset.sessao);
    if (s && !s.visto_treinador) await sb.from('nx_sessoes').update({ visto_treinador: true }).eq('id', s.id);
    location.hash = e.target.closest('[data-resp]') ? `#/aluno/${s.aluno_id}/conversa/${s.id}` : `#/aluno/${s.aluno_id}/historico`;
  };
  const tv = document.getElementById('todos-vistos');
  if (tv) tv.onclick = async () => { await sb.from('nx_sessoes').update({ visto_treinador: true }).eq('org_id', S.org.id).eq('visto_treinador', false).in('aluno_id', [...vis]); staffFeed(); }; // só os check-ins dos seus alunos
}

/* ---------- montagem de treino: modelos de musculação e de corrida ---------- */
/* ================= BIBLIOTECA DE FORÇA NEXOS =================
   Base científica (resumo):
   - ACSM 2026 (Currier et al., Med Sci Sports Exerc 58(4):851-872): cada grupo muscular ≥2x/semana; força com ≥80% 1RM e 2–3 séries;
     hipertrofia com ≥10 séries por músculo/semana (retorno diminui depois de ~18–20), qualquer carga de ~30–100% 1RM se a série for
     perto da falha (2–3 reps sobrando); falha total não traz ganho extra; amplitude completa; máquina = peso livre; potência com subida rápida.
   - Robinson et al. 2024 (Sports Med): mais perto da falha → mais hipertrofia; para força, a distância da falha pesa pouco.
   - Pelland et al. (Sports Med): mais volume semanal → mais ganho, com retorno decrescente.
   - Singer et al. 2024 (Front Sports Act Living): descanso >60 s dá pequena vantagem para hipertrofia; acima de ~90 s pouco muda.
   - Wolf et al. 2023 (IJSC) e Maeo et al. 2021/2022: treinar o músculo alongado ajuda (mesa flexora sentada > deitada; tríceps acima da cabeça > pulley).
   - Plotkin et al. 2023 (Front Physiol): elevação pélvica e agachamento dão glúteo parecido; agachamento dá mais coxa.
   - Wewege et al. 2021 (Sports Med): só musculação já reduz ~1,4% de gordura corporal; melhor resultado = força + aeróbio + alimentação.
   - Llanos-Lagos et al. 2024 (Sports Med): para corredores, força pesada (≥80% 1RM), pliometria e a combinação melhoram a economia de corrida.
   - Lauersen et al. 2014 (BJSM): treino de força reduz lesões esportivas para menos de 1/3.
   - Rønnestad et al. 2011 (JSCR): 1 sessão de força por semana mantém os ganhos na temporada; a cada 2 semanas, não.
   - Iversen et al. 2021 (Sports Med): mínimo de 4 séries por músculo/semana (6–15 RM); bi-séries, drop-set e rest-pause cortam o tempo pela metade.
   - Sødal et al. 2023 (Sports Med Open): drop-set dá hipertrofia parecida com séries tradicionais em menos tempo.
   - van Dyk et al. 2019 (BJSM): programas com flexão nórdica reduzem lesões de posterior em ~51% (8.459 atletas).
   - Harøy et al. 2019 (BJSM): prancha de Copenhague reduz problemas na virilha em ~41%.
   - Watson et al. 2018 (JBMR, LIFTMOR): 5×5 a >80–85% + impacto, 2x/semana, aumenta densidade óssea em pós-menopausa.
   - Su et al. 2023 (Front Endocrinol): musculação reduz HbA1c no diabetes tipo 2.
   - Hayden et al. 2021 (Cochrane): exercício reduz a dor lombar crônica.
   - Meta-análise de treino concorrente 2022 (Sports Med 52:2391): a corrida reduz um pouco o crescimento das fibras. */
const NIVEIS_FORCA = [['ini', 'Iniciante'], ['int', 'Intermediário'], ['ava', 'Avançado']];
const CATS_FORCA = [['hipertrofia', 'Hipertrofia'], ['gluteo', 'Glúteos e pernas'], ['emagrecimento', 'Emagrecimento'], ['forca', 'Força máxima'], ['rapido', 'Treino rápido'], ['corredor', 'Força para corredores'], ['prevencao', 'Prevenção de lesões'], ['casa', 'Em casa'], ['saude', 'Saúde e longevidade']];
const GUIA_FORCA = {
  ini: ['2 a 3 treinos por semana, corpo inteiro, com pelo menos 1 dia de descanso entre eles.', 'Pare cada série com 2–3 repetições sobrando: técnica primeiro, falha não é necessária.', 'Quando fizer o topo da faixa de repetições em todas as séries, aumente a carga (2–5%).', 'Descanso de 1 a 2 minutos. Amplitude completa em todos os exercícios.'],
  int: ['3 a 4 treinos por semana, cada músculo pelo menos 2 vezes.', 'Cerca de 10–15 séries por músculo na semana. Compostos pesados com 2–3 reps sobrando; isoladores podem chegar a 0–1.', 'Descanso de 1,5 a 3 min nos compostos e 1 a 1,5 min nos isoladores.', 'Anote as cargas: progredir carga ou repetições toda semana é o que faz evoluir.'],
  ava: ['4 a 6 treinos por semana, cada músculo 2 vezes.', '12–20 séries por músculo na semana (acima de ~18–20 o ganho extra é pequeno).', 'Priorize exercícios que alongam o músculo sob carga (mesa sentada, tríceps acima da cabeça, rosca inclinada, búlgaro).', 'Organize em blocos de 4–8 semanas e faça uma semana mais leve quando o desempenho cair.'],
};
const _F = (nome, series, repeticoes, descanso_seg, observacao) => ({ nome, series, repeticoes, descanso_seg, observacao: observacao || null });
const BIB_FORCA = [
  /* ---------- HIPERTROFIA ---------- */
  { id: 'hip-ini', cat: 'hipertrofia', niv: 'ini', nome: 'Hipertrofia · Corpo inteiro', freq: '3x por semana, em sequência A → B → C',
    info: 'Corpo inteiro 3x por semana: cada músculo é treinado com frequência, que é o que mais rende para quem está começando. Faixa de 8–15 repetições, parando com 2–3 sobrando (ACSM 2026).',
    treinos: [
      { titulo: 'Treino A', foco: 'Corpo inteiro', itens: [
        _F('Agachamento goblet', 3, '10–12', 90, 'Desça até a coxa passar da paralela, coluna neutra.'),
        _F('Supino reto com halteres', 3, '10–12', 90, 'Desça até alongar o peito, 2–3 reps sobrando.'),
        _F('Puxada frontal pegada aberta', 3, '10–12', 90, 'Puxe até o queixo, sem jogar o tronco.'),
        _F('Stiff com halteres', 3, '10–12', 90, 'Quadril para trás, sinta alongar o posterior.'),
        _F('Desenvolvimento sentado com halteres', 2, '10–12', 75),
        _F('Mesa flexora sentada', 2, '12–15', 60, 'Sentada alonga mais o posterior e rende mais que a deitada.'),
        _F('Prancha', 3, '30 s', 45),
      ] },
      { titulo: 'Treino B', foco: 'Corpo inteiro', itens: [
        _F('Leg press', 3, '10–12', 90, 'Desça o máximo que conseguir sem tirar o quadril do banco.'),
        _F('Remada baixa no cabo', 3, '10–12', 90, 'Estique bem os braços na volta, alongando as costas.'),
        _F('Supino inclinado com halteres', 3, '10–12', 90),
        _F('Elevação pélvica com barra', 3, '10–12', 90, 'Segure 1 s em cima, apertando o glúteo.'),
        _F('Elevação lateral com halteres', 2, '12–15', 60),
        _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 60, 'Banco inclinado alonga o bíceps.'),
        _F('Tríceps francês no cabo com corda', 2, '10–12', 60, 'Braços acima da cabeça: cresce mais que o pulley.'),
        _F('Dead bug', 2, '8 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Corpo inteiro', itens: [
        _F('Agachamento com afundo e pé elevado com halteres', 3, '10 cada perna', 90, 'Búlgaro: comece só com o peso do corpo se precisar.'),
        _F('Puxada frontal com pegada supinada', 3, '10–12', 90),
        _F('Supino reto na máquina', 3, '10–12', 90),
        _F('Levantamento terra romeno', 3, '10–12', 90, 'Barra perto das pernas, coluna neutra.'),
        _F('Remada unilateral com halter (serrote)', 2, '10–12 cada lado', 75),
        _F('Panturrilha em pé com halteres', 2, '12–15', 60, 'Pausa embaixo, com a panturrilha alongada.'),
        _F('Pallof press', 2, '10 cada lado', 45),
      ] },
    ] },
  { id: 'hip-int', cat: 'hipertrofia', niv: 'int', nome: 'Hipertrofia · Superior e inferior', freq: '4x por semana (Sup A, Inf A, Sup B, Inf B)',
    info: 'Divisão superior/inferior: cada músculo 2x por semana com 10–15 séries semanais. Compostos com 2–3 reps sobrando e isoladores mais perto da falha (Robinson 2024). Descanso maior que 60 s (Singer 2024).',
    treinos: [
      { titulo: 'Superior A', foco: 'Peito, costas e braços', itens: [
        _F('Supino reto com barra (pegada média)', 3, '6–10', 150, '2–3 reps sobrando.'),
        _F('Remada curvada com barra', 3, '8–10', 120),
        _F('Supino inclinado com halteres', 3, '8–12', 120),
        _F('Puxada frontal com pegada supinada', 3, '8–12', 90),
        _F('Elevação lateral sentada no cabo', 3, '12–15', 60, 'O cabo mantém tensão no começo do movimento.'),
        _F('Tríceps francês no cabo com corda', 3, '10–12', 60, 'Última série perto da falha.'),
        _F('Rosca alternada com halteres no banco inclinado', 3, '10–12', 60, 'Última série perto da falha.'),
      ] },
      { titulo: 'Inferior A', foco: 'Quadríceps e posterior', itens: [
        _F('Agachamento livre com barra', 3, '6–10', 180, 'Amplitude completa, 2–3 reps sobrando.'),
        _F('Levantamento terra romeno', 3, '8–10', 150, 'Desça até sentir o posterior bem alongado.'),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8–12 cada perna', 90, 'Búlgaro: ótimo para glúteo e quadríceps.'),
        _F('Mesa flexora sentada', 3, '10–12', 75),
        _F('Cadeira extensora', 2, '12–15', 60),
        _F('Panturrilha em pé na máquina', 3, '10–15', 60, 'Pausa de 1–2 s embaixo, com a panturrilha alongada.'),
        _F('Abdominal no cabo com corda', 3, '10–12', 60),
      ] },
      { titulo: 'Superior B', foco: 'Ombros, costas e braços', itens: [
        _F('Desenvolvimento sentado com halteres', 3, '8–10', 120),
        _F('Barra fixa', 3, '6–10', 120, 'Use a assistida com elástico se ainda não fizer 6.'),
        _F('Supino reto na máquina', 3, '10–12', 90),
        _F('Remada unilateral com halter (serrote)', 3, '10–12 cada lado', 75),
        _F('Crucifixo na máquina (peck deck)', 2, '12–15', 60),
        _F('Face pull', 2, '12–15', 60, 'Ombro posterior e saúde do ombro.'),
        _F('Rosca martelo com halteres', 2, '10–12', 60),
        _F('Tríceps corda', 2, '10–12', 60),
      ] },
      { titulo: 'Inferior B', foco: 'Glúteo e posterior', itens: [
        _F('Leg press', 3, '10–12', 120),
        _F('Elevação pélvica com barra', 3, '8–12', 120),
        _F('Stiff com halteres', 3, '10–12', 90),
        _F('Avanço para trás com halteres', 3, '10 cada perna', 90),
        _F('Cadeira abdutora', 2, '15–20', 60),
        _F('Panturrilha sentado', 3, '12–15', 60),
        _F('Roda abdominal', 3, '8–10', 60),
      ] },
    ] },
  { id: 'hip-ava', cat: 'hipertrofia', niv: 'ava', nome: 'Hipertrofia · Empurrar, puxar e pernas', freq: '3 a 6x por semana (repita o ciclo)',
    info: 'Divisão empurrar/puxar/pernas. Feita 2x na semana, dá 12–20 séries por músculo, a faixa de mais ganho (ACSM 2026; Pelland). Usa exercícios com o músculo alongado sob carga (Maeo 2021/2022; Wolf 2023).',
    treinos: [
      { titulo: 'Empurrar', foco: 'Peito, ombros e tríceps', itens: [
        _F('Supino inclinado com halteres', 4, '6–10', 150, 'Desça fundo, alongando o peito.'),
        _F('Supino reto com barra (pegada média)', 3, '6–8', 150),
        _F('Desenvolvimento sentado com halteres', 3, '8–10', 120),
        _F('Paralelas para peito', 3, '8–12', 90, 'Tronco inclinado à frente; adicione peso quando passar de 12.'),
        _F('Elevação lateral sentada no cabo', 4, '12–20', 60, 'Última série até a falha.'),
        _F('Tríceps francês no cabo com corda', 3, '10–12', 75),
        _F('Tríceps corda', 2, '12–15', 60, 'Última série até a falha.'),
      ] },
      { titulo: 'Puxar', foco: 'Costas, ombro posterior e bíceps', itens: [
        _F('Barra fixa com peso', 4, '6–10', 150),
        _F('Remada cavalinho apoiada no peito', 3, '8–10', 120),
        _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75, 'Deixe o braço subir todo, alongando o dorsal.'),
        _F('Remada baixa no cabo', 3, '10–12', 90),
        _F('Crucifixo inverso na máquina (peck deck)', 3, '12–20', 60),
        _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 75),
        _F('Rosca martelo com halteres', 2, '10–12', 60, 'Última série até a falha.'),
      ] },
      { titulo: 'Pernas', foco: 'Quadríceps, posterior, glúteo e panturrilha', itens: [
        _F('Agachamento livre com barra', 4, '5–8', 180),
        _F('Levantamento terra romeno', 3, '6–10', 150),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8–10 cada perna', 120),
        _F('Mesa flexora sentada', 3, '8–12', 75),
        _F('Cadeira extensora', 3, '10–15', 75, 'Incline o tronco para trás para alongar o reto femoral.'),
        _F('Elevação pélvica com barra', 3, '8–12', 90),
        _F('Panturrilha em pé na máquina', 4, '8–12', 60, 'Pausa embaixo, alongada.'),
        _F('Elevação de pernas suspenso na barra', 3, '10–15', 60),
      ] },
    ] },

  /* ---------- EMAGRECIMENTO ---------- */
  { id: 'ema-ini', cat: 'emagrecimento', niv: 'ini', nome: 'Emagrecimento · Circuito corpo inteiro', freq: '3x por semana (A, B e C) + caminhada ou corrida leve',
    info: 'Circuito: faça um exercício atrás do outro com 30–45 s de pausa e descanse 2 min ao fim de cada volta. Só musculação já reduz ~1,4% de gordura (Wewege 2021); o melhor resultado vem de força + aeróbio + alimentação, preservando músculo.',
    treinos: [
      { titulo: 'Treino A', foco: 'Circuito corpo inteiro (3 voltas)', itens: [
        _F('Agachamento goblet', 3, '12', 40, 'Séries = voltas do circuito.'),
        _F('Flexão de braço inclinada', 3, '8–12', 40, 'Mãos no banco; quanto mais baixo, mais difícil.'),
        _F('Remada baixa no cabo', 3, '12', 40),
        _F('Ponte de glúteos', 3, '15', 40),
        _F('Desenvolvimento sentado com halteres', 3, '12', 40),
        _F('Bicicleta ergométrica', 3, '1 min', 40, 'Ritmo moderado a forte.'),
        _F('Prancha', 3, '30 s', 120, 'Ao fim da volta, descanse 2 min.'),
      ] },
      { titulo: 'Treino B', foco: 'Circuito corpo inteiro (3 voltas)', itens: [
        _F('Leg press', 3, '12', 40),
        _F('Puxada frontal pegada aberta', 3, '12', 40),
        _F('Supino reto na máquina', 3, '12', 40),
        _F('Avanço para trás com halteres', 3, '10 cada perna', 40),
        _F('Remada unilateral com halter (serrote)', 3, '12 cada lado', 40),
        _F('Remo ergométrico', 3, '1 min', 40, 'Ritmo moderado a forte.'),
        _F('Dead bug', 3, '8 cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
      ] },
      { titulo: 'Treino C', foco: 'Circuito corpo inteiro (3 voltas)', itens: [
        _F('Subida no banco com halteres', 3, '10 cada perna', 40),
        _F('Supino reto com halteres', 3, '12', 40),
        _F('Puxada frontal com pegada supinada', 3, '12', 40),
        _F('Stiff com halteres', 3, '12', 40),
        _F('Elevação lateral com halteres', 3, '12–15', 40),
        _F('Bicicleta ergométrica', 3, '1 min', 40, 'Ritmo moderado a forte.'),
        _F('Prancha lateral', 3, '20–30 s cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
      ] },
    ] },
  { id: 'ema-int', cat: 'emagrecimento', niv: 'int', nome: 'Emagrecimento · Bi-séries + finalizador', freq: '3x por semana (A, B e C) + aeróbio',
    info: 'Bi-séries de músculos opostos: o treino fica mais denso e curto sem perder o estímulo de força. No fim, um finalizador intervalado. Carga desafiadora: no déficit calórico, o treino pesado é o que segura a massa muscular.',
    treinos: [
      { titulo: 'Treino A', foco: 'Bi-séries corpo inteiro', itens: [
        _F('Agachamento livre com barra', 4, '8–10', 30, 'Bi-série 1: faça e vá direto para a puxada.'),
        _F('Puxada frontal pegada aberta', 4, '10', 90, 'Fim da bi-série 1: descanse 90 s.'),
        _F('Levantamento terra romeno', 3, '10', 30, 'Bi-série 2.'),
        _F('Supino inclinado com halteres', 3, '10', 90),
        _F('Avanço com halteres', 3, '10 cada perna', 30, 'Bi-série 3.'),
        _F('Face pull', 3, '15', 90),
        _F('Kettlebell swing', 6, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s de pausa.'),
      ] },
      { titulo: 'Treino B', foco: 'Bi-séries corpo inteiro', itens: [
        _F('Leg press', 4, '12', 30, 'Bi-série 1.'),
        _F('Supino reto com halteres', 4, '10', 90),
        _F('Elevação pélvica com barra', 3, '12', 30, 'Bi-série 2.'),
        _F('Remada baixa no cabo', 3, '12', 90),
        _F('Subida no banco com halteres', 3, '10 cada perna', 30, 'Bi-série 3.'),
        _F('Desenvolvimento sentado com halteres', 3, '12', 90),
        _F('Remo ergométrico', 8, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s leve.'),
      ] },
      { titulo: 'Treino C', foco: 'Bi-séries corpo inteiro', itens: [
        _F('Agachamento com afundo e pé elevado com halteres', 3, '10 cada perna', 30, 'Bi-série 1.'),
        _F('Remada curvada com halteres', 3, '10', 90),
        _F('Levantamento terra com barra hexagonal', 3, '8', 30, 'Bi-série 2.'),
        _F('Flexão de braços', 3, '8–15', 90, 'Apoie os joelhos se precisar.'),
        _F('Mesa flexora sentada', 3, '12', 30, 'Bi-série 3.'),
        _F('Elevação lateral com halteres', 3, '15', 75),
        _F('Bicicleta ergométrica', 8, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s leve.'),
      ] },
    ] },
  { id: 'ema-ava', cat: 'emagrecimento', niv: 'ava', nome: 'Emagrecimento · Força + condicionamento', freq: '3x por semana (A, B e C) + aeróbio',
    info: 'Junta treino pesado (para manter força e músculo no déficit) com condicionamento de alta intensidade. Avance só se a recuperação estiver boa: sono e alimentação mandam no resultado.',
    treinos: [
      { titulo: 'Treino A', foco: 'Pernas pesado + intervalado', itens: [
        _F('Agachamento livre com barra', 4, '5–6', 180, 'Pesado: 2 reps sobrando.'),
        _F('Levantamento terra romeno', 3, '6–8', 150),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 90),
        _F('Empurrar trenó', 6, '20 m', 60, 'Rápido e forte.'),
        _F('Corda naval', 6, '20 s', 40),
      ] },
      { titulo: 'Treino B', foco: 'Superior em bi-séries', itens: [
        _F('Supino reto com barra (pegada média)', 4, '6–8', 30, 'Bi-série 1.'),
        _F('Barra fixa com peso', 4, '6–8', 120),
        _F('Desenvolvimento militar com barra em pé', 3, '8', 30, 'Bi-série 2.'),
        _F('Remada curvada com barra', 3, '8', 120),
        _F('Paralelas para peito', 3, '8–12', 75),
        _F('Burpee', 10, '6–8', 0, 'EMOM: 1 série no início de cada minuto, por 10 minutos.'),
      ] },
      { titulo: 'Treino C', foco: 'Circuito metabólico (4 voltas)', itens: [
        _F('Thruster com kettlebells', 4, '10', 30, 'Séries = voltas.'),
        _F('Kettlebell swing', 4, '15', 30),
        _F('Remada renegada alternada', 4, '8 cada lado', 30),
        _F('Mountain climber', 4, '30 s', 30),
        _F('Remo ergométrico', 4, '250 m', 30),
        _F('Prancha lateral', 4, '30 s cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
      ] },
    ] },

  /* ---------- FORÇA MÁXIMA ---------- */
  { id: 'for-ini', cat: 'forca', niv: 'ini', nome: 'Força · Base técnica', freq: '3x por semana, em sequência A → B → C',
    info: 'Progressão linear: mesmas séries de 5, subindo um pouco a carga a cada treino enquanto a técnica estiver perfeita. Força responde melhor a cargas altas (≥80% 1RM) e 2–3 séries (ACSM 2026). Falha não é necessária.',
    treinos: [
      { titulo: 'Treino A', foco: 'Agachamento e supino', itens: [
        _F('Agachamento livre com barra', 3, '5', 180, 'Suba 2,5–5 kg por treino enquanto a técnica estiver boa.'),
        _F('Supino reto com barra (pegada média)', 3, '5', 180, 'Suba 1–2,5 kg por treino.'),
        _F('Remada curvada com barra', 3, '6–8', 120),
        _F('Mesa flexora sentada', 2, '8–10', 90),
        _F('Prancha', 3, '30–45 s', 60),
      ] },
      { titulo: 'Treino B', foco: 'Levantamento terra e desenvolvimento', itens: [
        _F('Levantamento terra com barra hexagonal', 3, '5', 180, 'Mais fácil de aprender que o terra tradicional.'),
        _F('Desenvolvimento militar com barra em pé', 3, '5', 150),
        _F('Barra fixa assistida com elástico', 3, '5–8', 120, 'Diminua a ajuda do elástico com o tempo.'),
        _F('Agachamento goblet', 2, '8', 90, 'Treino de técnica do agachamento.'),
        _F('Pallof press', 3, '10 cada lado', 60),
      ] },
      { titulo: 'Treino C', foco: 'Agachamento e supino (variação)', itens: [
        _F('Agachamento livre com barra', 3, '5', 180, 'Mesma progressão do Treino A.'),
        _F('Supino inclinado com halteres', 3, '6–8', 150),
        _F('Remada unilateral com halter (serrote)', 3, '6–8 cada lado', 120),
        _F('Levantamento terra romeno', 2, '6–8', 150, 'Reforça o posterior para o terra.'),
        _F('Prancha lateral', 3, '30 s cada lado', 60),
      ] },
    ] },
  { id: 'for-int', cat: 'forca', niv: 'int', nome: 'Força · Pesado por movimento', freq: '3 a 4x por semana (A, B e C)',
    info: 'Cada treino tem um levantamento principal pesado (80–88% 1RM, 4–6 reps, 2–3 sobrando) e acessórios para os pontos fracos. Descanso longo (3–4 min) nos principais para manter a carga alta.',
    treinos: [
      { titulo: 'Treino A', foco: 'Agachamento', itens: [
        _F('Agachamento livre com barra', 4, '4–6', 210, '80–85% 1RM.'),
        _F('Levantamento terra romeno', 3, '6', 150),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '6–8 cada perna', 90),
        _F('Elevação pélvica com barra', 3, '6–8', 120),
        _F('Roda abdominal', 3, '8', 60),
      ] },
      { titulo: 'Treino B', foco: 'Supino e barra fixa', itens: [
        _F('Supino reto com barra (pegada média)', 4, '4–6', 210, '80–85% 1RM.'),
        _F('Barra fixa com peso', 4, '4–6', 150),
        _F('Desenvolvimento militar com barra em pé', 3, '5–6', 150),
        _F('Remada curvada com barra', 3, '6', 120),
        _F('Supino fechado com barra', 3, '6–8', 120),
      ] },
      { titulo: 'Treino C', foco: 'Levantamento terra', itens: [
        _F('Levantamento terra com barra', 4, '3–5', 240, '80–88% 1RM. Pare se a lombar arredondar.'),
        _F('Agachamento frontal com barra', 3, '5', 180),
        _F('Mesa flexora sentada', 3, '8', 90),
        _F('Panturrilha em pé na máquina', 3, '8', 75),
        _F('Prancha lateral', 3, '30 s cada lado', 60),
      ] },
    ] },
  { id: 'for-ava', cat: 'forca', niv: 'ava', nome: 'Força · Ondulado (pesado, volume e velocidade)', freq: '3x por semana (A, B e C)',
    info: 'Periodização ondulada: um dia pesado (85–90%), um de volume (75–80%) e um de velocidade (60–70% movidos o mais rápido possível). A velocidade na subida é o que mais transfere para potência (ACSM 2026).',
    treinos: [
      { titulo: 'Pesado', foco: 'Cargas de 85–90% 1RM', itens: [
        _F('Agachamento livre com barra', 5, '3', 240, '85–90% 1RM, 1–2 reps sobrando.'),
        _F('Supino reto com barra (pegada média)', 5, '3', 240, '85–90% 1RM.'),
        _F('Remada curvada com barra', 4, '5', 150),
        _F('Glute-ham raise no chão', 3, '4–6', 120, 'Flexão nórdica: desça devagar.'),
      ] },
      { titulo: 'Volume', foco: 'Cargas de 75–80% 1RM', itens: [
        _F('Levantamento terra com barra', 4, '4', 210, '75–80% 1RM, técnica perfeita.'),
        _F('Supino inclinado com halteres', 4, '6', 150),
        _F('Barra fixa com peso', 4, '6', 150),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 120),
        _F('Desenvolvimento militar com barra em pé', 3, '6', 150),
      ] },
      { titulo: 'Velocidade', foco: 'Cargas de 60–70% 1RM, subida explosiva', itens: [
        _F('Power clean', 6, '2', 120, 'Técnica antes de carga.'),
        _F('Agachamento livre com barra', 6, '2', 90, '60–70% 1RM, suba o mais rápido possível.'),
        _F('Supino reto com barra (pegada média)', 6, '3', 90, '60–70% 1RM, suba o mais rápido possível.'),
        _F('Salto frontal na caixa', 4, '3', 90, 'Desça do caixote andando.'),
      ] },
    ] },

  /* ---------- FORÇA PARA CORREDORES ---------- */
  { id: 'cor-ini', cat: 'corredor', niv: 'ini', nome: 'Corredor · Força e prevenção', freq: '2x por semana em rodízio A → B → C, longe dos treinos fortes de corrida',
    info: 'Base de força para correr: unilaterais, glúteo, posterior e panturrilha (a cada passada o chão devolve 2 a 3 vezes o peso do corpo, e a panturrilha é o músculo que mais trabalha). Treino de força reduz lesões esportivas para menos de 1/3 (Lauersen 2014).',
    treinos: [
      { titulo: 'Treino A', foco: 'Pernas e core', itens: [
        _F('Agachamento goblet', 3, '8–10', 90),
        _F('Avanço para trás com halteres', 3, '8 cada perna', 75),
        _F('Ponte de glúteos unilateral', 3, '10 cada perna', 60),
        _F('Panturrilha em pé com halteres', 3, '12–15', 60, 'Desça devagar (3 s) e pause embaixo.'),
        _F('Stiff com halteres', 3, '10', 75),
        _F('Prancha lateral', 3, '30 s cada lado', 45),
        _F('Dead bug', 3, '8 cada lado', 45),
      ] },
      { titulo: 'Treino B', foco: 'Unilateral e estabilidade', itens: [
        _F('Subida no banco com halteres', 3, '8 cada perna', 75, 'Suba empurrando com a perna de cima.'),
        _F('Levantamento terra unilateral com kettlebell', 3, '8 cada perna', 75, 'Equilíbrio e posterior.'),
        _F('Panturrilha sentado', 3, '15', 60, 'Sóleo: muito exigido na corrida.'),
        _F('Monster walk (caminhada com elástico)', 2, '12 passos cada lado', 45, 'Glúteo médio: estabiliza o joelho.'),
        _F('Glute-ham raise no chão', 2, '4–6', 90, 'Flexão nórdica: protege o posterior.'),
        _F('Bird dog', 3, '8 cada lado', 45),
        _F('Pallof press', 2, '10 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Posterior, pé e quadril', itens: [
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 75),
        _F('Levantamento terra romeno', 3, '8', 90),
        _F('Panturrilha em pé com halteres', 3, '12 cada perna', 60, 'Uma perna por vez, descida em 3 s.'),
        _F('Abdução de quadril com elástico', 2, '15 cada lado', 45),
        _F('Elevação pélvica com barra', 3, '10', 75),
        _F('Prancha', 3, '40 s', 45),
      ] },
    ] },
  { id: 'cor-int', cat: 'corredor', niv: 'int', nome: 'Corredor · Força pesada + saltos', freq: '2x por semana em rodízio A → B → C',
    info: 'Força pesada (≥80% 1RM, poucas repetições) e pliometria melhoram a economia de corrida; a combinação dos dois teve o maior efeito, mas com evidência ainda fraca (Llanos-Lagos 2024). Cargas altas com poucas repetições quase não aumentam o peso do corpo.',
    treinos: [
      { titulo: 'Treino A', foco: 'Agachamento pesado + saltos', itens: [
        _F('Salto na caixa (múltiplas repetições)', 3, '5', 90, 'Antes da força, com as pernas descansadas.'),
        _F('Agachamento livre com barra', 4, '4–6', 180, '≥80% 1RM, 2–3 reps sobrando.'),
        _F('Levantamento terra romeno', 3, '6', 150),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 90),
        _F('Panturrilha em pé na máquina', 4, '8', 75, 'Pesada.'),
        _F('Prancha', 3, '45 s', 45),
      ] },
      { titulo: 'Treino B', foco: 'Terra + reatividade', itens: [
        _F('Saltos laterais sobre cones', 3, '10', 75, 'Contato curto com o chão.'),
        _F('Skipping rápido', 4, '15 s', 45),
        _F('Levantamento terra com barra hexagonal', 4, '4–6', 180, '≥80% 1RM.'),
        _F('Subida no banco com halteres', 3, '6 cada perna', 90, 'Pesado.'),
        _F('Glute-ham raise no chão', 3, '5', 90),
        _F('Panturrilha sentado', 3, '10', 60),
        _F('Pallof press', 3, '10 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Unilateral pesado + elasticidade', itens: [
        _F('Saltito unilateral com calcanhar ao glúteo', 3, '10 cada perna', 60, 'Contato rápido com o chão.'),
        _F('Agachamento com afundo e pé elevado com halteres', 4, '5 cada perna', 120, 'Pesado.'),
        _F('Levantamento terra unilateral com kettlebell', 3, '6 cada perna', 90),
        _F('Elevação pélvica com barra', 3, '6', 120, 'Pesada.'),
        _F('Panturrilha em pé na máquina', 4, '8', 75),
        _F('Prancha lateral', 3, '30 s cada lado', 45),
      ] },
    ] },
  { id: 'cor-ava', cat: 'corredor', niv: 'ava', nome: 'Corredor · Força máxima + pliometria', freq: '2x por semana em rodízio A → B → C (1x na semana de prova)',
    info: 'Método de contraste: exercício pesado seguido de salto. É a combinação que mais melhorou a economia de corrida (Llanos-Lagos 2024), com efeito maior em quem corre mais rápido. Nunca na véspera de treino forte.',
    treinos: [
      { titulo: 'Treino A', foco: 'Contraste agachamento + salto', itens: [
        _F('Agachamento livre com barra', 4, '3–5', 150, '85–90% 1RM. Logo depois, faça o salto.'),
        _F('Salto frontal na caixa', 4, '3', 150, 'Contraste: 30 s depois do agachamento.'),
        _F('Levantamento terra romeno', 3, '5', 150),
        _F('Salto em profundidade linear', 3, '5', 120, 'Caia e saia do chão o mais rápido possível.'),
        _F('Panturrilha em pé na máquina', 4, '6', 75, 'Bem pesada.'),
        _F('Roda abdominal', 3, '8', 60),
      ] },
      { titulo: 'Treino B', foco: 'Contraste terra + saltos horizontais', itens: [
        _F('Levantamento terra com barra hexagonal', 4, '3', 180, '85–90% 1RM.'),
        _F('Salto lateral alternado (bound)', 4, '6', 120, 'Contraste: depois do terra.'),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '5 cada perna', 120, 'Pesado.'),
        _F('Saltos sobre barreiras', 4, '6', 90),
        _F('Glute-ham raise no chão', 3, '5', 90),
        _F('Panturrilha sentado', 3, '8', 60),
      ] },
      { titulo: 'Treino C', foco: 'Potência e reatividade', itens: [
        _F('Power clean', 5, '2', 120, 'Técnica antes de carga.'),
        _F('Salto em profundidade linear', 4, '4', 120),
        _F('Elevação pélvica com barra', 4, '4–5', 150, 'Pesada.'),
        _F('Salto com afundo alternado', 3, '6 cada perna', 90),
        _F('Panturrilha em pé na máquina', 4, '6', 75, 'Bem pesada.'),
        _F('Pallof press', 3, '10 cada lado', 45),
      ] },
    ] },

  /* ---------- SAÚDE E LONGEVIDADE ---------- */
  { id: 'sau-ini', cat: 'saude', niv: 'ini', nome: 'Saúde · Primeiros passos', freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem está começando ou voltando: máquinas e movimentos simples, 2 séries, longe da falha. 2 treinos por semana já trazem ganho real de força e função, e o treino de força está ligado a 10–17% menos risco de morte por todas as causas.',
    treinos: [
      { titulo: 'Treino A', foco: 'Máquinas, corpo inteiro', itens: [
        _F('Leg press', 2, '10–12', 90),
        _F('Supino reto na máquina', 2, '10–12', 90),
        _F('Puxada frontal pegada aberta', 2, '10–12', 90),
        _F('Mesa flexora sentada', 2, '10–12', 75),
        _F('Remada baixa no cabo', 2, '10–12', 75),
        _F('Panturrilha sentado', 2, '12–15', 60),
        _F('Bird dog', 2, '8 cada lado', 45),
      ] },
      { titulo: 'Treino B', foco: 'Movimentos do dia a dia', itens: [
        _F('Agachamento com halteres até o banco', 2, '10', 90, 'Sentar e levantar com controle.'),
        _F('Flexão de braço inclinada', 2, '8–10', 75),
        _F('Remada unilateral com halter (serrote)', 2, '10 cada lado', 75),
        _F('Ponte de glúteos', 2, '12', 60),
        _F('Subida no banco com halteres', 2, '8 cada perna', 75, 'Equilíbrio: segure em algo se precisar.'),
        _F('Panturrilha em pé com halteres', 2, '12', 60),
        _F('Pallof press', 2, '10 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Máquinas e equilíbrio', itens: [
        _F('Cadeira extensora', 2, '10–12', 75),
        _F('Desenvolvimento de ombros na máquina', 2, '10–12', 75),
        _F('Remada baixa no cabo', 2, '10–12', 75),
        _F('Mesa flexora sentada', 2, '10–12', 75),
        _F('Supino reto na máquina', 2, '10–12', 75),
        _F('Panturrilha sentado', 2, '12–15', 60),
        _F('Prancha', 2, '20–30 s', 45),
      ] },
    ] },
  { id: 'sau-int', cat: 'saude', niv: 'int', nome: 'Saúde · Força e potência', freq: '2 a 3x por semana (A, B e C)',
    info: 'Subir o peso o mais rápido possível (descer com controle) melhora velocidade de marcha, equilíbrio e subir escadas: é a recomendação mais forte para função (ACSM 2026). Mantenha 2–3 reps sobrando.',
    treinos: [
      { titulo: 'Treino A', foco: 'Força com subida rápida', itens: [
        _F('Agachamento goblet', 3, '8', 90, 'Suba rápido, desça em 2–3 s.'),
        _F('Supino reto com halteres', 3, '8', 90, 'Suba rápido.'),
        _F('Remada baixa no cabo', 3, '10', 75),
        _F('Levantamento terra romeno', 3, '8', 90),
        _F('Arremesso de peito com bola (múltiplas repetições)', 3, '6', 60, 'Potência.'),
        _F('Prancha lateral', 2, '30 s cada lado', 45),
      ] },
      { titulo: 'Treino B', foco: 'Potência e equilíbrio', itens: [
        _F('Leg press', 3, '8', 90, 'Empurre rápido, volte devagar.'),
        _F('Desenvolvimento sentado com halteres', 3, '8', 90),
        _F('Puxada frontal pegada aberta', 3, '10', 75),
        _F('Avanço para trás com halteres', 3, '8 cada perna', 75),
        _F('Arremesso de medicine ball no chão', 3, '6', 60),
        _F('Panturrilha em pé com halteres', 3, '12', 60),
      ] },
      { titulo: 'Treino C', foco: 'Força e carregamento', itens: [
        _F('Levantamento terra com barra hexagonal', 3, '6', 120, 'Suba rápido, desça com controle.'),
        _F('Flexão de braços', 3, '6–12', 75, 'Mãos num banco se precisar.'),
        _F('Remada unilateral com halter (serrote)', 3, '10 cada lado', 75),
        _F('Subida no banco com halteres', 3, '8 cada perna', 75, 'Suba rápido.'),
        _F('Kettlebell swing', 3, '10', 60),
        _F('Pallof press', 3, '10 cada lado', 45),
      ] },
    ] },
  { id: 'sau-ava', cat: 'saude', niv: 'ava', nome: 'Saúde · Força total e potência', freq: '3x por semana (A, B e C)',
    info: 'Para quem já treina há tempo e quer força, potência e independência física a longo prazo: levantamentos básicos, exercícios explosivos e carregamentos. Falha não é necessária, principalmente depois dos 60 anos.',
    treinos: [
      { titulo: 'Treino A', foco: 'Força e potência', itens: [
        _F('Agachamento livre com barra', 4, '5', 180),
        _F('Push press com barra', 4, '3', 120, 'Impulso das pernas, barra rápida.'),
        _F('Levantamento terra com barra hexagonal', 3, '5', 180),
        _F('Barra fixa', 3, '5–8', 120),
        _F('Kettlebell swing', 4, '10', 60, 'Quadril explosivo.'),
        _F('Turkish get-up com kettlebell (estilo agachamento)', 2, '2 cada lado', 60, 'Mobilidade e controle do corpo todo.'),
      ] },
      { titulo: 'Treino B', foco: 'Potência e unilateral', itens: [
        _F('Agachamento com salto e carga', 4, '4', 90, 'Carga leve, salto máximo.'),
        _F('Supino reto com halteres', 3, '6', 120),
        _F('Remada curvada com halteres', 3, '8', 90),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 90),
        _F('Arremesso de peito com bola (múltiplas repetições)', 4, '5', 60),
        _F('Pallof press', 3, '10 cada lado', 45),
        _F('Panturrilha em pé com halteres', 3, '10', 60),
      ] },
      { titulo: 'Treino C', foco: 'Força pesada e core', itens: [
        _F('Agachamento frontal com barra', 4, '5', 180),
        _F('Desenvolvimento militar com barra em pé', 3, '5', 150),
        _F('Levantamento terra romeno', 3, '6', 150),
        _F('Barra fixa com peso', 3, '5', 150),
        _F('Salto frontal na caixa', 3, '3', 90),
        _F('Roda abdominal', 3, '8', 60),
      ] },
    ] },
  /* ---------- EM CASA ---------- */
  { id: 'casa-ini', cat: 'casa', niv: 'ini', nome: 'Em casa · Peso do corpo', freq: '3x por semana (A, B e C)',
    info: 'Sem academia: peso do corpo, uma cadeira firme e, se tiver, um elástico. Elásticos e peso do corpo dão ganhos de força e massa parecidos com os do treino convencional quando a série é feita perto da falha (ACSM 2026).',
    treinos: [
      { titulo: 'Treino A', foco: 'Corpo inteiro', itens: [
        _F('Agachamento livre com peso do corpo', 3, '12–20', 60, 'Desça devagar (3 s).'),
        _F('Flexão de braço inclinada', 3, '8–15', 60, 'Mãos na cadeira ou na mesa.'),
        _F('Ponte de glúteos', 3, '15–20', 45, 'Segure 2 s em cima.'),
        _F('Abertura com elástico (pull apart)', 3, '15', 45),
        _F('Superman', 2, '10', 45),
        _F('Prancha', 3, '30 s', 45),
      ] },
      { titulo: 'Treino B', foco: 'Corpo inteiro', itens: [
        _F('Avanço para trás com halteres', 3, '10 cada perna', 60, 'Sem halteres, use mochila com livros.'),
        _F('Mergulho no banco', 3, '8–12', 60, 'Use uma cadeira firme.'),
        _F('Elevação pélvica com elástico', 3, '15', 45),
        _F('Desenvolvimento de ombros com elástico', 3, '12', 45),
        _F('Dead bug', 3, '8 cada lado', 45),
        _F('Polichinelo', 3, '30 s', 30),
      ] },
      { titulo: 'Treino C', foco: 'Corpo inteiro', itens: [
        _F('Subida no banco com elevação de joelho', 3, '10 cada perna', 60, 'Degrau ou cadeira baixa.'),
        _F('Flexão de braços', 3, 'máximo com boa técnica', 75, 'Joelhos no chão se precisar.'),
        _F('Ponte de glúteos unilateral', 3, '10 cada perna', 45),
        _F('Crucifixo inverso com elástico', 3, '15', 45),
        _F('Bird dog', 3, '8 cada lado', 45),
        _F('Prancha lateral', 2, '20–30 s cada lado', 45),
      ] },
    ] },
  { id: 'casa-int', cat: 'casa', niv: 'int', nome: 'Em casa · Elásticos e halteres', freq: '3 a 4x por semana (A, B e C)',
    info: 'Com um par de halteres (ou galões de água) e elásticos dá para treinar todo o corpo com carga. Quando ficar fácil, use mais repetições, desça mais devagar ou faça uma perna por vez: o importante é a série terminar perto da falha.',
    treinos: [
      { titulo: 'Treino A', foco: 'Pernas e empurrar', itens: [
        _F('Agachamento goblet', 4, '10–15', 75, 'Desça em 3 s.'),
        _F('Supino reto com halteres', 3, '10–15', 75, 'No chão ou num banco.'),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '10 cada perna', 75, 'Pé de trás no sofá.'),
        _F('Desenvolvimento sentado com halteres', 3, '10–12', 60),
        _F('Tríceps francês sentado com halter', 3, '10–12', 60),
        _F('Prancha', 3, '45 s', 45),
      ] },
      { titulo: 'Treino B', foco: 'Puxar e posterior', itens: [
        _F('Stiff com halteres', 4, '10–12', 75),
        _F('Remada curvada com halteres', 3, '10–12', 75),
        _F('Remada unilateral com halter (serrote)', 3, '10–12 cada lado', 60),
        _F('Elevação pélvica com elástico', 3, '15', 60),
        _F('Rosca alternada com halteres no banco inclinado', 3, '10–12', 60, 'Encostado num sofá reclinado.'),
        _F('Dead bug', 3, '8 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Corpo inteiro', itens: [
        _F('Subida no banco com halteres', 3, '10 cada perna', 75),
        _F('Flexão de braços', 3, 'máximo − 2', 75),
        _F('Agachamento com elástico (alças)', 3, '15', 60),
        _F('Crucifixo inverso com elástico', 3, '15', 45),
        _F('Elevação lateral com elástico', 3, '15', 45),
        _F('Rosca martelo com halteres', 2, '12', 45),
        _F('Kettlebell swing', 4, '15', 45, 'Um halter segurado pelas duas mãos funciona.'),
      ] },
    ] },
  { id: 'casa-ava', cat: 'casa', niv: 'ava', nome: 'Em casa · Calistenia avançada', freq: '4x por semana (A, B, C e repete)',
    info: 'Peso do corpo em variações difíceis: unilaterais, excêntricas lentas e saltos. Precisa de uma barra fixa. Progrida trocando para a variação mais difícil quando passar de ~15 repetições.',
    treinos: [
      { titulo: 'Treino A', foco: 'Empurrar e pernas', itens: [
        _F('Flexão de braços com pés elevados', 4, '8–15', 90),
        _F('Agachamento unilateral no caixote alto', 4, '6–10 cada perna', 90, 'Desça até sentar no caixote, em 3 s.'),
        _F('Paralelas para tríceps', 3, '8–12', 90, 'Entre duas cadeiras firmes.'),
        _F('Flexão de braço em parada de mão', 3, '3–8', 120, 'Contra a parede; comece com pike.'),
        _F('Salto com afundo alternado', 3, '8 cada perna', 60),
      ] },
      { titulo: 'Treino B', foco: 'Puxar e posterior', itens: [
        _F('Barra fixa', 4, '6–12', 120, 'Desça em 3 s.'),
        _F('Glute-ham raise natural', 3, '4–6', 120, 'Flexão nórdica com os pés presos no sofá.'),
        _F('Barra fixa supinada', 3, '6–10', 90),
        _F('Ponte de glúteos unilateral', 3, '12–15 cada perna', 60, 'Ombros no sofá.'),
        _F('Elevação de pernas suspenso na barra', 3, '8–12', 60),
      ] },
      { titulo: 'Treino C', foco: 'Potência e core', itens: [
        _F('Flexão pliométrica', 4, '5', 90),
        _F('Agachamento com salto sem peso', 4, '6', 90, 'Salto máximo, aterrisse macio.'),
        _F('Flexão de braço unilateral', 3, '3–6 cada lado', 90, 'Mão num banco para facilitar.'),
        _F('Burpee', 4, '10', 60),
        _F('Rastejar de aranha', 3, '10 m', 45),
        _F('Prancha lateral', 3, '45 s cada lado', 45),
      ] },
    ] },

  /* ---------- GLÚTEOS E PERNAS ---------- */
  { id: 'glu-ini', cat: 'gluteo', niv: 'ini', nome: 'Glúteos e pernas · Base', freq: '3x por semana (A, B e C)',
    info: 'Foco em glúteos e pernas, com o resto do corpo em menor volume. Elevação pélvica e agachamento crescem o glúteo de forma parecida; o agachamento ainda trabalha mais a coxa (Plotkin 2023), por isso os dois entram.',
    treinos: [
      { titulo: 'Treino A', foco: 'Glúteo e quadríceps', itens: [
        _F('Agachamento goblet', 3, '10–12', 90),
        _F('Elevação pélvica com barra', 3, '10–12', 90, 'Segure 1 s em cima.'),
        _F('Cadeira abdutora', 3, '15', 60),
        _F('Leg press', 3, '12', 90, 'Pés mais altos na plataforma pegam mais glúteo.'),
        _F('Puxada frontal pegada aberta', 2, '12', 75),
        _F('Prancha', 3, '30 s', 45),
      ] },
      { titulo: 'Treino B', foco: 'Glúteo e posterior', itens: [
        _F('Stiff com halteres', 3, '10–12', 90),
        _F('Ponte de glúteos unilateral', 3, '10 cada perna', 60),
        _F('Mesa flexora sentada', 3, '12', 75),
        _F('Avanço para trás com halteres', 3, '10 cada perna', 75),
        _F('Supino reto com halteres', 2, '12', 75),
        _F('Panturrilha em pé com halteres', 2, '15', 45),
      ] },
      { titulo: 'Treino C', foco: 'Glúteo médio e unilateral', itens: [
        _F('Subida no banco com halteres', 3, '10 cada perna', 75),
        _F('Monster walk (caminhada com elástico)', 3, '12 passos cada lado', 45),
        _F('Coice no cabo unilateral', 3, '12 cada perna', 60),
        _F('Agachamento plié com halter', 3, '12', 75, 'Pés afastados, desça fundo.'),
        _F('Remada baixa no cabo', 2, '12', 75),
        _F('Dead bug', 3, '8 cada lado', 45),
      ] },
    ] },
  { id: 'glu-int', cat: 'gluteo', niv: 'int', nome: 'Glúteos e pernas · Volume', freq: '3 a 4x por semana (A, B e C)',
    info: 'Cerca de 12–16 séries de glúteo na semana, com cargas mais altas nos compostos e mais repetições nos isoladores. Os exercícios com o quadril bem flexionado (búlgaro, stiff, agachamento fundo) alongam o glúteo sob carga.',
    treinos: [
      { titulo: 'Treino A', foco: 'Agachamento e glúteo', itens: [
        _F('Agachamento livre com barra', 4, '6–10', 150, 'Fundo, até onde a técnica permitir.'),
        _F('Elevação pélvica com barra', 4, '8–12', 120),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8–10 cada perna', 90, 'Tronco levemente inclinado à frente.'),
        _F('Cadeira abdutora', 3, '15–20', 60, 'Tronco inclinado à frente pega mais glúteo.'),
        _F('Elevação de pernas suspenso na barra', 3, '10–12', 60),
      ] },
      { titulo: 'Treino B', foco: 'Posterior e glúteo', itens: [
        _F('Levantamento terra romeno', 4, '6–10', 150),
        _F('Mesa flexora sentada', 3, '10–12', 75),
        _F('Extensão lombar no banco', 3, '12–15', 60, 'Costas arredondadas e foco em apertar o glúteo.'),
        _F('Pull through no cabo', 3, '12–15', 60),
        _F('Puxada frontal pegada aberta', 3, '10–12', 75),
        _F('Desenvolvimento sentado com halteres', 2, '10–12', 75),
      ] },
      { titulo: 'Treino C', foco: 'Unilateral e quadríceps', itens: [
        _F('Leg press', 4, '10–12', 120, 'Pés altos e afastados.'),
        _F('Avanço com halteres', 3, '10 cada perna', 90, 'Passo longo.'),
        _F('Ponte de glúteos com barra', 3, '12–15', 75),
        _F('Coice no cabo unilateral', 3, '12 cada perna', 60),
        _F('Cadeira extensora', 2, '12–15', 60),
        _F('Panturrilha sentado', 3, '12–15', 60),
      ] },
    ] },
  { id: 'glu-ava', cat: 'gluteo', niv: 'ava', nome: 'Glúteos e pernas · Avançado', freq: '4x por semana (A, B, C e repete A)',
    info: 'Volume alto de glúteo (16–20 séries na semana) distribuído em vários dias, com progressão de carga nos compostos e isoladores perto da falha. Acima de ~20 séries o ganho extra é pequeno (ACSM 2026).',
    treinos: [
      { titulo: 'Treino A', foco: 'Pesado: agachamento e elevação pélvica', itens: [
        _F('Agachamento livre com barra', 4, '5–8', 180),
        _F('Elevação pélvica com barra', 4, '6–10', 150, 'Pesada, pausa de 1 s em cima.'),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 120),
        _F('Cadeira abdutora', 3, '15–20', 60, 'Última série até a falha.'),
        _F('Panturrilha em pé na máquina', 3, '10–12', 60),
      ] },
      { titulo: 'Treino B', foco: 'Pesado: terra e posterior', itens: [
        _F('Levantamento terra sumô', 4, '4–6', 180),
        _F('Levantamento terra romeno', 3, '8', 150),
        _F('Mesa flexora sentada', 3, '8–12', 75),
        _F('Extensão reversa de quadril', 3, '12–15', 75),
        _F('Barra fixa', 3, '6–10', 120),
        _F('Roda abdominal', 3, '8–10', 60),
      ] },
      { titulo: 'Treino C', foco: 'Volume: unilateral e isoladores', itens: [
        _F('Leg press', 4, '10–15', 120, 'Pés altos e afastados.'),
        _F('Subida no banco com halteres', 3, '8–10 cada perna', 90, 'Banco alto.'),
        _F('Ponte de glúteos com barra', 3, '15–20', 75),
        _F('Coice no cabo unilateral', 3, '12–15 cada perna', 45),
        _F('Pull through no cabo', 3, '15', 60),
        _F('Desenvolvimento sentado com halteres', 3, '10–12', 75),
      ] },
    ] },

  /* ---------- MAIS HIPERTROFIA, SAÚDE E CORREDORES ---------- */
  { id: 'hip-abc', cat: 'hipertrofia', niv: 'int', nome: 'Hipertrofia · ABC clássico', freq: '6x por semana (ABC 2 vezes) ou 3x',
    info: 'Divisão ABC por grupos musculares. Feita 2 vezes na semana (ABCABC), cada músculo é treinado 2x, o que é melhor que 1x. Feita só 3x na semana, cada músculo fica com 1x: aí aumente o número de séries de cada treino.',
    treinos: [
      { titulo: 'Treino A', foco: 'Peito, ombros e tríceps', itens: [
        _F('Supino reto com barra (pegada média)', 4, '6–10', 150),
        _F('Supino inclinado com halteres', 3, '8–12', 120),
        _F('Crucifixo na máquina (peck deck)', 3, '12–15', 60),
        _F('Desenvolvimento sentado com halteres', 3, '8–12', 90),
        _F('Elevação lateral com halteres', 4, '12–20', 60),
        _F('Tríceps francês no cabo com corda', 3, '10–12', 60),
        _F('Tríceps corda', 2, '12–15', 60),
      ] },
      { titulo: 'Treino B', foco: 'Costas, ombro posterior e bíceps', itens: [
        _F('Barra fixa', 4, '6–10', 120),
        _F('Remada curvada com barra', 3, '8–10', 120),
        _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75),
        _F('Remada baixa no cabo', 3, '10–12', 90),
        _F('Face pull', 3, '15', 60),
        _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 60),
        _F('Rosca martelo com halteres', 2, '10–12', 60),
      ] },
      { titulo: 'Treino C', foco: 'Pernas completas', itens: [
        _F('Agachamento livre com barra', 4, '6–10', 180),
        _F('Leg press', 3, '10–12', 120),
        _F('Levantamento terra romeno', 3, '8–10', 150),
        _F('Mesa flexora sentada', 3, '10–12', 75),
        _F('Cadeira extensora', 3, '12–15', 60),
        _F('Elevação pélvica com barra', 3, '8–12', 90),
        _F('Panturrilha em pé na máquina', 4, '10–15', 60),
      ] },
    ] },
  { id: 'sau-60', cat: 'saude', niv: 'ini', nome: 'Saúde · 60+ equilíbrio e prevenção de quedas', freq: '2 a 3x por semana (A, B e C)',
    info: 'Força de pernas, equilíbrio e potência para levantar, subir escadas e evitar quedas. Os estudos com mais de 11 mil idosos mostram que o treino de força é seguro; evite ir até a falha e faça a subida rápida, com a descida controlada (ACSM 2026).',
    treinos: [
      { titulo: 'Treino A', foco: 'Levantar e sentar', itens: [
        _F('Agachamento com halteres até o banco', 2, '8–10', 90, 'Levante rápido, sente devagar.'),
        _F('Supino reto na máquina', 2, '10', 75),
        _F('Remada baixa no cabo', 2, '10', 75),
        _F('Panturrilha em pé com halteres', 2, '12', 60, 'Segure em algo firme.'),
        _F('Prancha de equilíbrio', 2, '20–30 s', 45, 'Perto de uma parede ou apoio.'),
        _F('Bird dog', 2, '6 cada lado', 45),
      ] },
      { titulo: 'Treino B', foco: 'Degraus e marcha', itens: [
        _F('Subida no banco com halteres', 2, '8 cada perna', 75, 'Degrau baixo, com apoio para a mão.'),
        _F('Leg press', 2, '10', 90, 'Empurre rápido, volte devagar.'),
        _F('Puxada frontal pegada aberta', 2, '10', 75),
        _F('Elevação lateral de perna em pé', 2, '10 cada perna', 45, 'Apoiado na cadeira.'),
        _F('Mesa flexora sentada', 2, '10', 75),
        _F('Pallof press', 2, '8 cada lado', 45),
      ] },
      { titulo: 'Treino C', foco: 'Força geral', itens: [
        _F('Cadeira extensora', 2, '10–12', 75),
        _F('Desenvolvimento de ombros na máquina', 2, '10', 75),
        _F('Ponte de glúteos', 2, '12', 60),
        _F('Flexão de braço inclinada', 2, '8–10', 60, 'Mãos na parede ou na mesa.'),
        _F('Avanço para trás com halteres', 2, '6 cada perna', 75, 'Sem halteres e com apoio no começo.'),
        _F('Prancha', 2, '20 s', 45),
      ] },
    ] },
  { id: 'cor-manut', cat: 'corredor', niv: 'int', nome: 'Corredor · Manutenção em fase de provas', freq: '1x por semana, em rodízio A → B → C',
    info: 'Na fase de provas, 1 sessão curta e pesada por semana costuma manter a força ganha na preparação; a cada 2 semanas já se perde força e velocidade (Rønnestad 2011, com atletas). Faça pelo menos 48 h antes de treino forte ou prova.',
    treinos: [
      { titulo: 'Treino A', foco: 'Agachamento pesado', itens: [
        _F('Salto frontal na caixa', 3, '3', 90),
        _F('Agachamento livre com barra', 3, '3–5', 180, '≥80% 1RM, 2–3 reps sobrando.'),
        _F('Panturrilha em pé na máquina', 3, '6–8', 75),
        _F('Prancha lateral', 2, '30 s cada lado', 45),
      ] },
      { titulo: 'Treino B', foco: 'Terra pesado', itens: [
        _F('Skipping rápido', 3, '15 s', 45),
        _F('Levantamento terra com barra hexagonal', 3, '3–5', 180, '≥80% 1RM.'),
        _F('Glute-ham raise no chão', 2, '4–5', 90),
        _F('Panturrilha sentado', 3, '8', 60),
      ] },
      { titulo: 'Treino C', foco: 'Unilateral pesado', itens: [
        _F('Saltos laterais sobre cones', 3, '8', 60),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '4–6 cada perna', 120, 'Pesado.'),
        _F('Elevação pélvica com barra', 3, '5', 120),
        _F('Pallof press', 2, '10 cada lado', 45),
      ] },
    ] },

  /* ---------- TREINO RÁPIDO ---------- */
  { id: 'rap-ini', cat: 'rapido', niv: 'ini', nome: 'Treino rápido · 30 minutos', freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem tem pouco tempo: exercícios multiarticulares em bi-séries, aquecimento só com séries leves do primeiro exercício e sem alongamento antes. Mínimo de 4 séries por músculo na semana, com 6–15 repetições perto da falha, já traz resultado (Iversen 2021).',
    treinos: [
      { titulo: 'Treino A', foco: '30 min · corpo inteiro', itens: [
        _F('Agachamento goblet', 3, '8–12', 30, 'Bi-série 1. Aqueça com 1 série leve.'),
        _F('Puxada frontal pegada aberta', 3, '8–12', 75, 'Fim da bi-série 1.'),
        _F('Supino reto com halteres', 3, '8–12', 30, 'Bi-série 2.'),
        _F('Levantamento terra romeno', 3, '8–12', 75, 'Fim da bi-série 2.'),
        _F('Prancha', 2, '40 s', 30),
      ] },
      { titulo: 'Treino B', foco: '30 min · corpo inteiro', itens: [
        _F('Leg press', 3, '10–12', 30, 'Bi-série 1.'),
        _F('Supino reto na máquina', 3, '10–12', 75),
        _F('Remada baixa no cabo', 3, '10–12', 30, 'Bi-série 2.'),
        _F('Elevação pélvica com barra', 3, '10–12', 75),
        _F('Dead bug', 2, '8 cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: '30 min · corpo inteiro', itens: [
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8–10 cada perna', 30, 'Bi-série 1.'),
        _F('Desenvolvimento sentado com halteres', 3, '8–12', 75),
        _F('Remada unilateral com halter (serrote)', 3, '10 cada lado', 30, 'Bi-série 2.'),
        _F('Flexão de braço inclinada', 3, '8–15', 75),
        _F('Pallof press', 2, '10 cada lado', 30),
      ] },
    ] },
  { id: 'rap-int', cat: 'rapido', niv: 'int', nome: 'Treino rápido · 40 minutos com drop-set', freq: '3x por semana (A, B e C)',
    info: 'Bi-séries de músculos opostos e drop-set na última série dos isoladores: dão hipertrofia parecida com o treino tradicional em cerca da metade do tempo (Iversen 2021; Sødal 2023). Funcionam melhor para massa do que para força máxima.',
    treinos: [
      { titulo: 'Treino A', foco: '40 min · inferior + empurrar', itens: [
        _F('Agachamento livre com barra', 3, '6–10', 120, 'Aqueça com 2 séries leves. Descanso normal aqui.'),
        _F('Supino inclinado com halteres', 3, '8–12', 30, 'Bi-série.'),
        _F('Mesa flexora sentada', 3, '10–12', 75),
        _F('Elevação lateral com halteres', 3, '12–15', 45, 'Última série em drop-set: tire ~25% do peso e continue até a falha, 2 vezes.'),
        _F('Tríceps francês no cabo com corda', 2, '10–12', 45, 'Última série em drop-set.'),
      ] },
      { titulo: 'Treino B', foco: '40 min · posterior + puxar', itens: [
        _F('Levantamento terra romeno', 3, '6–10', 120),
        _F('Barra fixa', 3, '6–10', 30, 'Bi-série. Assistida se precisar.'),
        _F('Elevação pélvica com barra', 3, '8–12', 75),
        _F('Remada baixa no cabo', 3, '10–12', 45, 'Última série em drop-set.'),
        _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 45, 'Última série em drop-set.'),
      ] },
      { titulo: 'Treino C', foco: '40 min · corpo inteiro', itens: [
        _F('Leg press', 3, '10–12', 30, 'Bi-série.'),
        _F('Supino reto com halteres', 3, '8–12', 75),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 30, 'Bi-série.'),
        _F('Puxada frontal com pegada supinada', 3, '10–12', 75),
        _F('Panturrilha em pé na máquina', 3, '10–15', 45, 'Última série em drop-set.'),
      ] },
    ] },
  { id: 'rap-ava', cat: 'rapido', niv: 'ava', nome: 'Treino rápido · rest-pause', freq: '3 a 4x por semana (A, B e C)',
    info: 'Rest-pause: faça a série até perto da falha, descanse 15–20 s e faça mais repetições com o mesmo peso, 2 a 3 vezes. Num estudo, o treino caiu de 57 para 35 minutos mantendo o volume (Iversen 2021). Use nos isoladores e máquinas, não em agachamento e terra pesados.',
    treinos: [
      { titulo: 'Treino A', foco: 'Empurrar + quadríceps', itens: [
        _F('Supino reto com barra (pegada média)', 3, '5–8', 150, 'Pesado, sem rest-pause.'),
        _F('Agachamento hack na máquina', 2, '8–10 + rest-pause', 120, 'Rest-pause: 2 mini-séries com 15–20 s de pausa.'),
        _F('Supino inclinado com halteres', 2, '8–10', 90),
        _F('Elevação lateral sentada no cabo', 2, '12–15 + rest-pause', 60),
        _F('Tríceps corda', 2, '10–12 + rest-pause', 60),
      ] },
      { titulo: 'Treino B', foco: 'Puxar + posterior', itens: [
        _F('Barra fixa com peso', 3, '5–8', 150, 'Sem rest-pause.'),
        _F('Mesa flexora sentada', 2, '8–10 + rest-pause', 75),
        _F('Remada cavalinho apoiada no peito', 2, '8–10 + rest-pause', 90),
        _F('Crucifixo inverso na máquina (peck deck)', 2, '12–15 + rest-pause', 60),
        _F('Rosca alternada com halteres no banco inclinado', 2, '10–12 + rest-pause', 60),
      ] },
      { titulo: 'Treino C', foco: 'Pernas + ombros', itens: [
        _F('Levantamento terra romeno', 3, '6–8', 150, 'Sem rest-pause.'),
        _F('Leg press', 2, '10–12 + rest-pause', 120),
        _F('Desenvolvimento de ombros na máquina', 2, '8–10 + rest-pause', 90),
        _F('Cadeira extensora', 2, '12–15 + rest-pause', 60),
        _F('Panturrilha em pé na máquina', 2, '10–12 + rest-pause', 60),
      ] },
    ] },

  /* ---------- TÉCNICAS AVANÇADAS DE HIPERTROFIA ---------- */
  { id: 'hip-tec', cat: 'hipertrofia', niv: 'ava', nome: 'Hipertrofia · Técnicas avançadas', freq: '4 a 5x por semana (A, B, C e repete)',
    info: 'Bloco de 4–6 semanas com drop-set, rest-pause e excêntrica lenta nos isoladores. Drop-sets dão hipertrofia parecida com séries tradicionais gastando menos tempo (Sødal 2023). Use só no fim do exercício: muitas séries até a falha atrapalham a recuperação.',
    treinos: [
      { titulo: 'Treino A', foco: 'Peito, ombros e tríceps', itens: [
        _F('Supino inclinado com halteres', 4, '6–10', 150, 'Descida em 3 s.'),
        _F('Supino reto na máquina', 3, '8–10', 120, 'Última série em drop-set (2 quedas de ~25%).'),
        _F('Crucifixo na máquina (peck deck)', 2, '12–15 + rest-pause', 60),
        _F('Elevação lateral sentada no cabo', 4, '12–20', 60, 'Última série em drop-set.'),
        _F('Tríceps francês no cabo com corda', 3, '10–12', 60, 'Última série em rest-pause.'),
      ] },
      { titulo: 'Treino B', foco: 'Costas e bíceps', itens: [
        _F('Barra fixa com peso', 4, '6–10', 150, 'Descida em 3 s.'),
        _F('Remada cavalinho apoiada no peito', 3, '8–10', 120, 'Última série em drop-set.'),
        _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75),
        _F('Crucifixo inverso na máquina (peck deck)', 3, '15–20 + rest-pause', 60),
        _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 60, 'Última série em drop-set.'),
      ] },
      { titulo: 'Treino C', foco: 'Pernas', itens: [
        _F('Agachamento livre com barra', 4, '5–8', 180, 'Sem técnicas: só carga.'),
        _F('Levantamento terra romeno', 3, '6–10', 150, 'Descida em 3 s.'),
        _F('Leg press', 2, '10–12', 120, 'Última série em drop-set.'),
        _F('Mesa flexora sentada', 3, '8–12 + rest-pause', 75),
        _F('Cadeira extensora', 2, '12–15', 60, 'Última série em drop-set.'),
        _F('Panturrilha em pé na máquina', 4, '8–12', 60, 'Pausa de 2 s embaixo.'),
      ] },
    ] },

  /* ---------- PREVENÇÃO DE LESÕES ---------- */
  { id: 'pre-ini', cat: 'prevencao', niv: 'ini', nome: 'Prevenção de lesões · Base', freq: '2x por semana (rodízio A → B → C), 20–30 min',
    info: 'Os exercícios com melhor prova contra lesão: flexão nórdica (programas com ela cortam as lesões de posterior pela metade, van Dyk 2019), prancha de Copenhague (41% menos problemas na virilha, Harøy 2019), panturrilha e glúteo médio. Pode ser feito como complemento de outro treino.',
    treinos: [
      { titulo: 'Treino A', foco: 'Posterior e virilha', itens: [
        _F('Glute-ham raise no chão', 2, '3–5', 90, 'Flexão nórdica: desça o mais devagar que conseguir, apoie as mãos no fim.'),
        _F('Prancha de Copenhague curta (joelho apoiado)', 2, '15–20 s cada lado', 45),
        _F('Ponte de glúteos unilateral', 3, '10 cada perna', 45),
        _F('Panturrilha em pé com halteres', 3, '12 cada perna', 45, 'Uma perna por vez, descida em 3 s.'),
        _F('Bird dog', 2, '8 cada lado', 30),
      ] },
      { titulo: 'Treino B', foco: 'Quadril e joelho', itens: [
        _F('Monster walk (caminhada com elástico)', 2, '12 passos cada lado', 30),
        _F('Agachamento isométrico na parede (cadeirinha)', 3, '30–45 s', 60),
        _F('Subida no banco com halteres', 3, '8 cada perna', 60, 'Joelho alinhado com o pé.'),
        _F('Abdução de quadril com elástico', 2, '15 cada lado', 30),
        _F('Prancha lateral', 2, '30 s cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: 'Tornozelo, panturrilha e core', itens: [
        _F('Panturrilha sentado unilateral com halter', 3, '12 cada perna', 45, 'Sóleo.'),
        _F('Prancha de equilíbrio', 3, '30 s', 30),
        _F('Levantamento terra unilateral com kettlebell', 2, '8 cada perna', 60, 'Equilíbrio e posterior.'),
        _F('Pallof press', 2, '10 cada lado', 30),
        _F('Dead bug', 2, '8 cada lado', 30),
      ] },
    ] },
  { id: 'pre-int', cat: 'prevencao', niv: 'int', nome: 'Prevenção de lesões · Progressão', freq: '2x por semana (rodízio A → B → C)',
    info: 'Mais volume nos protetores: nórdicas e Copenhague com repetições, panturrilha pesada e unilaterais. O efeito protetor aparece com regularidade: o que funciona é fazer toda semana, durante a temporada inteira.',
    treinos: [
      { titulo: 'Treino A', foco: 'Posterior e virilha', itens: [
        _F('Glute-ham raise no chão', 3, '5–6', 90),
        _F('Prancha de Copenhague curta (joelho apoiado)', 3, '8–10 cada lado', 45, 'Agora em repetições.'),
        _F('Levantamento terra romeno', 3, '8', 90),
        _F('Panturrilha em pé na máquina', 3, '10', 60, 'Pesada, pausa embaixo.'),
        _F('Prancha lateral', 2, '40 s cada lado', 30),
      ] },
      { titulo: 'Treino B', foco: 'Quadril e joelho', itens: [
        _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 75),
        _F('Cadeira adutora', 3, '12', 45),
        _F('Agachamento isométrico na parede (cadeirinha)', 3, '45 s', 60, 'Segure um halter no colo para dificultar.'),
        _F('Cadeira abdutora', 3, '15', 45),
        _F('Pallof press', 3, '10 cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: 'Reatividade e tornozelo', itens: [
        _F('Saltito unilateral com calcanhar ao glúteo', 3, '10 cada perna', 45),
        _F('Panturrilha sentado unilateral com halter', 3, '10 cada perna', 45),
        _F('Subida no banco com halteres', 3, '8 cada perna', 60),
        _F('Caminhada do fazendeiro', 3, '30 m', 60, 'Core e postura.'),
        _F('Bird dog', 2, '10 cada lado', 30),
      ] },
    ] },
  { id: 'pre-ava', cat: 'prevencao', niv: 'ava', nome: 'Prevenção de lesões · Atleta', freq: '2x por semana (rodízio A → B → C)',
    info: 'Para quem já faz nórdicas e Copenhague completas: carga excêntrica alta, saltos com aterrissagem controlada e força unilateral pesada. Mantenha 1 sessão por semana nas fases de competição para não perder o efeito.',
    treinos: [
      { titulo: 'Treino A', foco: 'Posterior e virilha avançado', itens: [
        _F('Glute-ham raise no chão', 3, '6–8', 120, 'Sem apoiar as mãos.'),
        _F('Prancha de Copenhague (pé apoiado)', 3, '8–12 cada lado', 60),
        _F('Levantamento terra romeno', 3, '6', 120, 'Pesado.'),
        _F('Panturrilha em pé na máquina', 4, '8', 60, 'Pesada.'),
      ] },
      { titulo: 'Treino B', foco: 'Aterrissagem e joelho', itens: [
        _F('Salto frontal na caixa', 3, '5', 90, 'Aterrisse macio, joelho alinhado.'),
        _F('Salto lateral alternado (bound)', 3, '6', 90, 'Segure 2 s em cada aterrissagem.'),
        _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 90, 'Pesado.'),
        _F('Agachamento isométrico na parede (cadeirinha)', 3, '45 s', 60, 'Com carga.'),
        _F('Pallof press', 3, '12 cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: 'Força unilateral e tronco', itens: [
        _F('Subida no banco com halteres', 3, '6 cada perna', 90, 'Banco alto, pesado.'),
        _F('Levantamento terra unilateral com kettlebell', 3, '6 cada perna', 75),
        _F('Cadeira adutora', 3, '10', 45),
        _F('Caminhada do fazendeiro', 3, '40 m', 60),
        _F('Roda abdominal', 3, '8', 45),
      ] },
    ] },

  /* ---------- SAÚDE: OSSOS, GLICEMIA E COLUNA ---------- */
  { id: 'sau-ossos', cat: 'saude', niv: 'int', nome: 'Saúde · Ossos fortes (pós-menopausa)', freq: '2x por semana, 30 min (A, B e C)',
    info: 'Baseado no estudo LIFTMOR: mulheres pós-menopausa com baixa massa óssea fizeram 5×5 acima de 80–85% da carga máxima em terra, agachamento e desenvolvimento, mais saltos com aterrissagem, 2x por semana por 8 meses, e ganharam densidade óssea na coluna e no fêmur (Watson 2018). O primeiro mês é de adaptação com cargas leves. Precisa de liberação médica e supervisão próxima.',
    treinos: [
      { titulo: 'Treino A', foco: 'Terra e desenvolvimento', itens: [
        _F('Levantamento terra com barra hexagonal', 5, '5', 150, '>80–85% 1RM depois do mês de adaptação. Coluna neutra sempre.'),
        _F('Desenvolvimento militar com barra em pé', 5, '5', 120, '>80–85% 1RM.'),
        _F('Agachamento com salto sem peso', 3, '5', 60, 'Impacto: aterrisse firme nos calcanhares.'),
        _F('Prancha', 2, '30 s', 30),
      ] },
      { titulo: 'Treino B', foco: 'Agachamento e puxada', itens: [
        _F('Agachamento livre com barra', 5, '5', 150, '>80–85% 1RM. Pode ser no banco (sentar e levantar).'),
        _F('Barra fixa assistida com elástico', 3, '5', 90),
        _F('Salto frontal na caixa', 3, '5', 60, 'Desça do caixote pulando (impacto).'),
        _F('Bird dog', 2, '8 cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: 'Corpo inteiro', itens: [
        _F('Levantamento terra com barra hexagonal', 3, '5', 150),
        _F('Agachamento livre com barra', 3, '5', 150),
        _F('Desenvolvimento sentado com halteres', 3, '6', 90),
        _F('Caminhada do fazendeiro', 3, '30 m', 60),
      ] },
    ] },
  { id: 'sau-glic', cat: 'saude', niv: 'ini', nome: 'Saúde · Controle da glicemia', freq: '2 a 3x por semana (A, B e C), por pelo menos 12 semanas',
    info: 'Na meta-análise de 2023 sobre diabetes tipo 2, a musculação baixou a hemoglobina glicada; os melhores resultados vieram com 2–3 treinos por semana, 3 séries de 6–10 repetições a ~70–80% da carga máxima e 12–16 semanas (Su 2023). Complementa, não substitui, o tratamento médico: confira a glicemia antes e depois no começo.',
    treinos: [
      { titulo: 'Treino A', foco: 'Grandes músculos', itens: [
        _F('Leg press', 3, '8–10', 75),
        _F('Supino reto na máquina', 3, '8–10', 75),
        _F('Remada baixa no cabo', 3, '8–10', 75),
        _F('Mesa flexora sentada', 3, '8–10', 60),
        _F('Bicicleta ergométrica', 1, '10 min', 0, 'Leve, no fim do treino.'),
      ] },
      { titulo: 'Treino B', foco: 'Grandes músculos', itens: [
        _F('Agachamento goblet', 3, '8–10', 75),
        _F('Puxada frontal pegada aberta', 3, '8–10', 75),
        _F('Desenvolvimento sentado com halteres', 3, '8–10', 75),
        _F('Elevação pélvica com barra', 3, '8–10', 60),
        _F('Caminhada na esteira', 1, '10 min', 0, 'Leve, no fim do treino.'),
      ] },
      { titulo: 'Treino C', foco: 'Grandes músculos', itens: [
        _F('Cadeira extensora', 3, '8–10', 60),
        _F('Supino reto com halteres', 3, '8–10', 75),
        _F('Remada unilateral com halter (serrote)', 3, '8–10 cada lado', 60),
        _F('Levantamento terra romeno', 3, '8–10', 75),
        _F('Panturrilha sentado', 3, '10–12', 45),
      ] },
    ] },
  { id: 'sau-coluna', cat: 'saude', niv: 'ini', nome: 'Saúde · Coluna e core', freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem quer uma coluna mais forte ou tem dor lombar crônica sem sinal de alerta. Na revisão Cochrane de 2021 (249 estudos), o exercício reduziu a dor lombar crônica em média 15 pontos (de 100) em relação a não tratar, sem um tipo melhor que outro. Dor forte, irradiada ou depois de queda: avaliação antes.',
    treinos: [
      { titulo: 'Treino A', foco: 'Estabilidade', itens: [
        _F('Bird dog', 3, '8 cada lado', 30, 'Devagar, sem girar o quadril.'),
        _F('Dead bug', 3, '8 cada lado', 30),
        _F('Ponte de glúteos', 3, '12', 45),
        _F('Prancha lateral', 3, '20–30 s cada lado', 30, 'Joelhos no chão para facilitar.'),
        _F('Agachamento com halteres até o banco', 2, '10', 60),
      ] },
      { titulo: 'Treino B', foco: 'Movimento de quadril', itens: [
        _F('Levantamento terra romeno', 3, '10', 75, 'Leve: aprenda a dobrar no quadril com a coluna neutra.'),
        _F('Pallof press', 3, '10 cada lado', 30),
        _F('Remada baixa no cabo', 3, '10–12', 60),
        _F('Superman', 2, '10', 30),
        _F('Caminhada do fazendeiro', 3, '20 m', 45, 'Peso leve, postura alta.'),
      ] },
      { titulo: 'Treino C', foco: 'Força geral', itens: [
        _F('Agachamento goblet', 3, '8–10', 75),
        _F('Extensão lombar no banco', 2, '10–12', 60, 'Amplitude que não doa.'),
        _F('Puxada frontal pegada aberta', 3, '10', 60),
        _F('Prancha', 3, '30 s', 30),
        _F('Elevação pélvica com barra', 3, '10', 60),
      ] },
    ] },

  /* ---------- CORREDOR QUE QUER MASSA ---------- */
  { id: 'cor-hip', cat: 'corredor', niv: 'int', nome: 'Corredor · Ganhar massa sem parar de correr', freq: '3x por semana (A, B e C), em dias de corrida leve',
    info: 'Correr e treinar força juntos atrapalha pouco o ganho de massa, mas a corrida tende a reduzir um pouco o crescimento das fibras (meta-análise de 2022). Por isso: musculação nos dias de corrida leve, de preferência antes da corrida ou com 6 h ou mais de intervalo, e longe dos treinos fortes.',
    treinos: [
      { titulo: 'Treino A', foco: 'Superior', itens: [
        _F('Supino inclinado com halteres', 3, '8–12', 120),
        _F('Barra fixa', 3, '6–10', 120),
        _F('Desenvolvimento sentado com halteres', 3, '8–12', 90),
        _F('Remada baixa no cabo', 3, '10–12', 90),
        _F('Tríceps francês no cabo com corda', 2, '10–12', 60),
        _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 60),
      ] },
      { titulo: 'Treino B', foco: 'Inferior (força)', itens: [
        _F('Agachamento livre com barra', 3, '6–8', 150),
        _F('Levantamento terra romeno', 3, '8', 120),
        _F('Agachamento com afundo e pé elevado com halteres', 2, '8 cada perna', 90),
        _F('Panturrilha em pé na máquina', 3, '8–12', 60),
        _F('Prancha lateral', 2, '30 s cada lado', 30),
      ] },
      { titulo: 'Treino C', foco: 'Superior + core', itens: [
        _F('Supino reto com barra (pegada média)', 3, '6–10', 120),
        _F('Remada cavalinho apoiada no peito', 3, '8–10', 90),
        _F('Elevação lateral sentada no cabo', 3, '12–15', 60),
        _F('Puxada frontal unilateral', 2, '10–12 cada lado', 60),
        _F('Paralelas para peito', 2, '8–12', 75),
        _F('Roda abdominal', 3, '8–10', 45),
      ] },
    ] },
];
const treinosAbas = (k) => `<div class="subtabs" style="margin-top:16px">${[['musculacao', 'Musculação', '#/treinos'], ['corrida', 'Corrida', '#/treinos/corrida'], ['exercicios', 'Exercícios', '#/biblioteca']].map(([x, l, h]) => `<a class="${k === x ? 'on' : ''}" href="${h}">${l}</a>`).join('')}</div>`;
async function staffTreinos(aba) {
  if (aba !== 'corrida') return staffBiblioteca('modelos');
  loading();
  const org = await sb.from('nx_modelos_corrida').select('*').eq('org_id', S.org.id).order('criado_em').then((r) => r.data || []).catch(() => []);
  const perfil = perfilCorrida({});
  const st = S.cache.libCorr || (S.cache.libCorr = { niv: store.get('nx_lib_niv', 'ini') });
  const nomeNiv = Object.fromEntries(NIVEIS_CORR);
  const card = (md, meu) => `<div class="card mod-corr"><div class="row between" style="gap:10px;align-items:flex-start"><div style="min-width:0"><b>${esc(md.nome)}</b><div class="mc-tags">${meu ? '<span class="tag acc">meu modelo</span>' : (md.niv || []).length === 4 ? '<span class="tag">todos os níveis</span>' : (md.niv || []).map((n) => `<span class="tag niv-${n}">${nomeNiv[n]}</span>`).join('')}</div></div>${meu ? `<button class="link-btn tiny" data-delmc="${md.id}" style="color:var(--err)">Excluir</button>` : ''}</div>
    <div style="margin:10px 0 6px">${md.tipo === 'folga' ? `<div class="off-faixa grande">${OFF_IC}</div>` : md.tipo === 'forca' ? `<div class="off-faixa grande fo">${FORCA_IC}</div>` : perfilHTML(md.estrutura, perfil, true)}</div>
    ${semCorrida(md) ? '' : `<p class="small"><b>${f1(resumoEstrutura(md.estrutura, perfil).km)} km</b> · ~${fmtDur(resumoEstrutura(md.estrutura, perfil).seg)}</p><p class="small muted" style="margin-top:2px">${esc(descreverEstrutura(md.estrutura))}</p>`}
    ${md.info ? `<p class="mc-info">${esc(md.info)}</p>` : ''}</div>`;
  const desenhar = () => {
    const sel = st.niv; const lst = sel === 'meus' ? [] : MODELOS_PADRAO.filter((md) => passaNiv(md, sel));
    const grupos = CATS_CORR.map(([k, l]) => [k, l, lst.filter((md) => md.cat === k)]).filter(([, , l2]) => l2.length);
    const cont = (k) => k === 'meus' ? org.length : k === 'todos' ? MODELOS_PADRAO.length : MODELOS_PADRAO.filter((md) => (md.niv || []).includes(k)).length;
    $app.innerHTML = `<p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('corrida')}
      <p class="muted small">Biblioteca de corrida organizada por nível. A maior parte segue o <b>método norueguês</b> (limiar controlado com pausas curtas, duplo limiar e muito volume leve). Para usar, abra a planilha do aluno e arraste o treino para o dia.</p>
      <div class="niv-tabs" id="niv-tabs">${[...NIVEIS_CORR, ['todos', 'Todos'], ['meus', 'Meus']].map(([k, l]) => `<button type="button" class="${sel === k ? 'on' : ''}" data-niv="${k}"><b>${l}</b><span>${cont(k)} treinos</span></button>`).join('')}</div>
      ${GUIA_NIV[sel] ? `<div class="card guia-niv"><span class="eyebrow">Como montar a semana · ${nomeNiv[sel]}</span><ul>${GUIA_NIV[sel].map((t) => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      ${sel === 'meus' ? (org.length ? `<div class="cols" style="margin-top:16px">${org.map((m2) => card(m2, true)).join('')}</div>` : '<div class="empty" style="margin-top:16px"><div class="h3">Nenhum modelo seu ainda</div><p class="small">Monte um treino na planilha de um aluno e toque em “Salvar como modelo”.</p></div>')
        : grupos.map(([k, l, l2]) => `<div class="section"><div class="section-h"><h2 class="h2">${l}</h2><span class="tiny dim">${l2.length}</span></div><div class="cols">${l2.map((m2) => card(m2, false)).join('')}</div></div>`).join('')}
      <a class="btn ghost block" href="#/alunos" style="margin-top:16px">${I.users} Abrir a planilha de um aluno</a>`;
    document.getElementById('niv-tabs').onclick = (e) => { const b = e.target.closest('[data-niv]'); if (!b) return; st.niv = b.dataset.niv; store.set('nx_lib_niv', st.niv); desenhar(); };
  };
  desenhar();
  $app.onclick = async (e) => {
    const d = e.target.closest('[data-delmc]'); if (!d) return;
    if (!confirm('Excluir este modelo de corrida?')) return;
    const { error } = await sb.from('nx_modelos_corrida').delete().eq('id', d.dataset.delmc);
    error ? toast('Não foi possível excluir.', true) : (toast('Modelo excluído.'), staffTreinos('corrida'));
  };
}
/* ---------- Relatórios do treinador: evolução de todos os SEUS alunos num lugar só ---------- */
async function todasAsLinhas(fab) { // busca em páginas de 1000 (o limite do banco)
  let tudo = [], de = 0;
  for (;;) { const { data, error } = await fab().range(de, de + 999); if (error) throw error; tudo = tudo.concat(data || []); if (!data || data.length < 1000) break; de += 1000; }
  return tudo;
}
const REL_PER = [['4s', '4 semanas', 28], ['3m', '3 meses', 91], ['6m', '6 meses', 182]];
async function staffRelatorios() {
  loading();
  const st = S.cache.relSt || (S.cache.relSt = { per: '4s', ord: 'atencao', f: 'todos', q: '' });
  const dias = REL_PER.find((p) => p[0] === st.per)[2];
  const agora = Date.now(), t1 = agora, t0 = agora - dias * 864e5, tA = t0 - dias * 864e5;
  const iso = (t) => new Date(t).toISOString();
  const [membrosT, corrT, sessT, planoT] = await Promise.all([
    sb.from('nx_membros').select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades,corrida,nascimento,criado_em').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome').then((r) => r.data || []),
    todasAsLinhas(() => sb.from('nx_corridas').select('id,aluno_id,data,tipo,distancia_m,duracao_s,fc_media,rpe,dor,plano_id').eq('org_id', S.org.id).gte('data', iso(tA - 42 * 864e5)).order('data')),
    todasAsLinhas(() => sb.from('nx_sessoes').select('aluno_id,iniciado_em').eq('org_id', S.org.id).not('finalizado_em', 'is', null).gte('iniciado_em', iso(tA)).order('iniciado_em')),
    todasAsLinhas(() => sb.from('nx_plano_corrida').select('id,aluno_id,data,tipo,liberado').eq('org_id', S.org.id).gte('data', isoDia(t0)).lte('data', hojeISO()).order('data')),
  ]);
  const alunos = membrosT.filter((m) => ehMeuAluno(m) && m.ativo && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const vis = new Set(alunos.map((m) => m.user_id));
  const corr = corrT.filter((c) => vis.has(c.aluno_id) && ehCorr(c)), sess = sessT.filter((x) => vis.has(x.aluno_id));
  const plano = planoT.filter((p) => vis.has(p.aluno_id) && !semCorrida(p) && p.liberado !== false);
  const feitos = new Set(corr.map((c) => c.plano_id).filter(Boolean));
  const noPer = (t, a, b) => t > a && t <= b;
  const linhas = alunos.map((m) => {
    const cs = corr.filter((c) => c.aluno_id === m.user_id), ss = sess.filter((x) => x.aluno_id === m.user_id);
    const cP = cs.filter((c) => noPer(Date.parse(c.data), t0, t1)), cA = cs.filter((c) => noPer(Date.parse(c.data), tA, t0));
    const km = cP.reduce((a, c) => a + c.distancia_m, 0) / 1000, kmA = cA.reduce((a, c) => a + c.distancia_m, 0) / 1000;
    const paceM = (l) => { const x = l.filter((c) => c.distancia_m >= 3000); const d = x.reduce((a, c) => a + c.distancia_m, 0); return d ? x.reduce((a, c) => a + c.duracao_s, 0) / (d / 1000) : null; };
    const forca = ss.filter((x) => noPer(Date.parse(x.iniciado_em), t0, t1)).length, forcaA = ss.filter((x) => noPer(Date.parse(x.iniciado_em), tA, t0)).length;
    const pl = plano.filter((p) => p.aluno_id === m.user_id), plF = pl.filter((p) => feitos.has(p.id)).length;
    const perfil = perfilCorrida(m);
    const pv1 = faz('corrida', m) ? previsaoEm(cs, perfil, t1) : null, pv0 = faz('corrida', m) ? previsaoEm(cs, perfil, t0) : null;
    const ult = [...cs.map((c) => Date.parse(c.data)), ...ss.map((x) => Date.parse(x.iniciado_em))].reduce((a, b) => Math.max(a, b), 0);
    const parado = ult ? Math.floor((agora - ult) / 864e5) : null;
    const dor = cP.filter((c) => c.dor).length;
    const ader = pl.length ? Math.round((plF / pl.length) * 100) : null;
    const alertas = [];
    if (parado == null || parado >= 7) alertas.push(parado == null ? 'Nenhum treino registrado' : `Sem treinar há ${parado} dias`);
    if (dor) alertas.push(`Relatou dor ${dor === 1 ? '1 vez' : dor + ' vezes'}`);
    if (ader != null && pl.length >= 3 && ader < 50) alertas.push(`Cumpriu só ${ader}% da planilha`);
    if (kmA >= 10 && km < kmA * 0.6) alertas.push(`Volume caiu ${Math.round((1 - km / kmA) * 100)}%`);
    return { m, km, kmA, corridas: cP.length, forca, forcaA, ader, plTot: pl.length, plF, pace: paceM(cP), paceA: paceM(cA), p10: pv1 && pv1.tempos[1], p10A: pv0 && pv0.tempos[1], ult, parado, dor, alertas };
  });
  // números da equipe
  const soma = (k) => linhas.reduce((a, l) => a + (l[k] || 0), 0);
  const kmT = soma('km'), kmTA = soma('kmA'), forT = soma('forca'), forTA = soma('forcaA'), corT = soma('corridas');
  const plTot = soma('plTot'), plF = soma('plF'), treinando = linhas.filter((l) => l.parado != null && l.parado < 7).length;
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const dTag = (v, inverso) => v == null || !isFinite(v) || v === 0 ? '' : `<em class="rel-d ${(v > 0) !== !!inverso ? 'bom' : 'ruim'}">${v > 0 ? '▲' : '▼'} ${Math.abs(v)}%</em>`;
  // km e força por semana (equipe)
  const nSem = Math.round(dias / 7), semIni = inicioSemana(new Date(t1)); semIni.setDate(semIni.getDate() - (nSem - 1) * 7);
  const semanas = Array.from({ length: nSem }, (_, i) => { const a = new Date(semIni); a.setDate(a.getDate() + i * 7); const b = new Date(a); b.setDate(b.getDate() + 7);
    return { ini: a, km: corr.filter((c) => Date.parse(c.data) >= a && Date.parse(c.data) < b).reduce((s, c) => s + c.distancia_m, 0) / 1000, fo: sess.filter((x) => Date.parse(x.iniciado_em) >= a && Date.parse(x.iniciado_em) < b).length }; });
  const maxKm = Math.max(10, ...semanas.map((s) => s.km)), maxFo = Math.max(3, ...semanas.map((s) => s.fo));
  const evol = linhas.filter((l) => l.p10 && l.p10A && l.p10A - l.p10 >= 5).sort((a, b) => (b.p10A - b.p10) - (a.p10A - a.p10)).slice(0, 5);
  const volume = linhas.filter((l) => l.km > 0).sort((a, b) => b.km - a.km).slice(0, 5);
  const consta = linhas.filter((l) => l.ader != null && l.plTot >= 3).sort((a, b) => b.ader - a.ader || b.plTot - a.plTot).slice(0, 5);
  const atencao = linhas.filter((l) => l.alertas.length);
  const nomeLink = (l, extra) => `<a class="rel-mini" href="#/aluno/${l.m.user_id}" style="color:inherit">${avAluno(l.m, 'sm')}<span class="grow ellip">${esc(l.m.nome)}</span><b>${extra}</b></a>`;
  const per = REL_PER.find((p) => p[0] === st.per)[1];
  dockStaff();
  $app.innerHTML = `
    <p class="eyebrow">Relatórios</p><h1 class="h1">Evolução dos seus alunos</h1>
    <p class="muted small" style="margin-top:6px">${alunos.length} aluno${alunos.length === 1 ? '' : 's'} ativo${alunos.length === 1 ? '' : 's'} sob a sua responsabilidade. Comparação com as ${per} anteriores.</p>
    <div class="row between" style="gap:10px;flex-wrap:wrap;margin-top:14px"><div class="seg rel-per">${REL_PER.map(([k, l]) => `<button type="button" data-per="${k}" class="${st.per === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <button type="button" class="btn ghost sm" id="rel-csv">${I.ficha} Baixar planilha (CSV)</button></div>
    <div class="rel-kpis">
      <div><span>Km corridos</span><b>${f1(kmT, 0)}</b>${dTag(pct(kmT, kmTA))}</div>
      <div><span>Corridas</span><b>${corT}</b></div>
      <div><span>Treinos de força</span><b>${forT}</b>${dTag(pct(forT, forTA))}</div>
      <div><span>Planilha cumprida</span><b>${plTot ? Math.round((plF / plTot) * 100) + '%' : '–'}</b><small>${plF} de ${plTot} treinos</small></div>
      <div><span>Treinaram na última semana</span><b>${treinando}<small>/${alunos.length}</small></b></div>
      <div class="${atencao.length ? 'alerta' : ''}"><span>Precisam de atenção</span><b>${atencao.length}</b></div>
    </div>
    <div class="card rel-graf"><div class="row between"><b class="small">Volume da equipe por semana</b><span class="rel-leg"><i class="km"></i>km <i class="fo"></i>força</span></div>
      <div class="rel-barras">${semanas.map((s) => `<div title="Semana de ${fmtCurto(isoDia(s.ini))}: ${f1(s.km)} km · ${s.fo} treino${s.fo === 1 ? '' : 's'} de força"><div class="rel-bb"><i class="km" style="height:${Math.max(2, (s.km / maxKm) * 100)}%"></i><i class="fo" style="height:${Math.max(2, (s.fo / maxFo) * 100)}%"></i></div>${nSem <= 13 || s.ini.getDate() <= 7 ? `<small>${fmtCurto(isoDia(s.ini))}</small>` : '<small></small>'}</div>`).join('')}</div></div>
    <div class="rel-dest">
      <div class="card"><b class="small">Maior evolução (previsão dos 10 km)</b>${evol.map((l) => nomeLink(l, `−${difTxt(l.p10A - l.p10)}`)).join('') || '<p class="tiny dim" style="margin-top:8px">Ainda sem dados suficientes de corrida.</p>'}</div>
      <div class="card"><b class="small">Mais quilômetros</b>${volume.map((l) => nomeLink(l, f1(l.km) + ' km')).join('') || '<p class="tiny dim" style="margin-top:8px">Nenhuma corrida no período.</p>'}</div>
      <div class="card"><b class="small">Mais fiéis à planilha</b>${consta.map((l) => nomeLink(l, l.ader + '%')).join('') || '<p class="tiny dim" style="margin-top:8px">Sem planilhas liberadas no período.</p>'}</div>
    </div>
    ${atencao.length ? `<div class="section"><div class="section-h"><h2 class="h2">Precisam de atenção</h2>${slashes}</div><div class="stack">${atencao.map((l) => `<a class="list-item" href="#/aluno/${l.m.user_id}" style="color:inherit">${avAluno(l.m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(l.m.nome)}</b><div class="row" style="gap:5px;flex-wrap:wrap;margin-top:4px">${l.alertas.map((a) => `<span class="tag warn">${esc(a)}</span>`).join('')}</div></div>${I.chev}</a>`).join('')}</div></div>` : ''}
    <div class="section"><div class="section-h"><h2 class="h2">Aluno por aluno</h2>${slashes}</div>
      <div class="rel-filtros"><div class="search">${I.search}<input class="input" id="rel-q" placeholder="Buscar aluno" value="${esc(st.q)}"></div>
        <select class="select" id="rel-ord">${[['atencao', 'Precisam de atenção primeiro'], ['nome', 'Nome'], ['km', 'Mais km'], ['evol', 'Maior evolução nos 10 km'], ['ader', 'Planilha cumprida'], ['forca', 'Mais treinos de força'], ['parado', 'Mais tempo sem treinar']].map(([k, l]) => `<option value="${k}" ${st.ord === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="rel-tab" id="rel-tab"></div></div>
    <p class="tiny dim" style="margin-top:14px">Km e pace contam só corridas. Pace médio considera corridas de 3 km ou mais. A previsão dos 10 km usa as equações de Jack Daniels com as corridas das 6 semanas anteriores a cada data. Planilha cumprida: treinos liberados até hoje que têm corrida ligada.</p>`;
  const linhaHTML = (l) => {
    const dKm = l.kmA ? pct(l.km, l.kmA) : null, dPace = l.pace && l.paceA ? Math.round(l.pace - l.paceA) : null, d10 = l.p10 && l.p10A ? Math.round(l.p10 - l.p10A) : null;
    const seta = (v, txt) => v == null || Math.abs(v) < 1 ? '' : `<em class="rel-d ${v < 0 ? 'bom' : 'ruim'}">${v < 0 ? '▼' : '▲'} ${txt}</em>`;
    return `<a class="rel-row" href="#/aluno/${l.m.user_id}">
      <div class="rel-c rel-nome">${avAluno(l.m, 'sm')}<div style="min-width:0"><b class="ellip" style="display:block">${esc(l.m.nome)}</b><small>${l.parado == null ? 'sem treinos' : l.parado === 0 ? 'treinou hoje' : `último treino ${quando(new Date(l.ult).toISOString())}`}</small></div></div>
      <div class="rel-c"><span>Km</span><b>${f1(l.km)}</b>${dKm != null ? `<em class="rel-d ${dKm >= 0 ? 'bom' : 'ruim'}">${dKm >= 0 ? '▲' : '▼'} ${Math.abs(dKm)}%</em>` : ''}</div>
      <div class="rel-c"><span>Corridas</span><b>${l.corridas}</b></div>
      <div class="rel-c"><span>Força</span><b>${l.forca}</b></div>
      <div class="rel-c"><span>Planilha</span><b>${l.ader != null ? l.ader + '%' : '–'}</b>${l.ader != null ? `<i class="rel-bar"><i style="width:${l.ader}%"></i></i>` : ''}</div>
      <div class="rel-c"><span>Pace médio</span><b>${l.pace ? fmtPace(l.pace).replace('/km', '') : '–'}</b>${seta(dPace, Math.abs(dPace) + 's')}</div>
      <div class="rel-c"><span>10 km previsto</span><b>${l.p10 ? fmtDurLongo(l.p10) : '–'}</b>${seta(d10, d10 ? difTxt(d10) : '')}</div>
      <div class="rel-c rel-al">${l.alertas.length ? `<span class="tag warn">${l.alertas.length} alerta${l.alertas.length > 1 ? 's' : ''}</span>` : '<span class="tag ok">em dia</span>'}</div></a>`;
  };
  const ordenar = {
    atencao: (a, b) => b.alertas.length - a.alertas.length || a.m.nome.localeCompare(b.m.nome, 'pt'), nome: (a, b) => a.m.nome.localeCompare(b.m.nome, 'pt'),
    km: (a, b) => b.km - a.km, evol: (a, b) => ((b.p10A && b.p10 ? b.p10A - b.p10 : -1e9) - (a.p10A && a.p10 ? a.p10A - a.p10 : -1e9)),
    ader: (a, b) => (b.ader ?? -1) - (a.ader ?? -1), forca: (a, b) => b.forca - a.forca, parado: (a, b) => (b.parado ?? 1e9) - (a.parado ?? 1e9),
  };
  const tabela = () => {
    const nq = semAcento(st.q);
    const l = linhas.filter((x) => !nq || semAcento(x.m.nome).includes(nq)).sort(ordenar[st.ord]);
    document.getElementById('rel-tab').innerHTML = `<div class="rel-head"><span>Aluno</span><span>Km</span><span>Corridas</span><span>Força</span><span>Planilha</span><span>Pace médio</span><span>10 km previsto</span><span></span></div>`
      + (l.map(linhaHTML).join('') || '<div class="empty"><p class="small">Nenhum aluno encontrado.</p></div>');
  };
  tabela();
  document.getElementById('rel-q').oninput = (e) => { st.q = e.target.value; tabela(); };
  document.getElementById('rel-ord').onchange = (e) => { st.ord = e.target.value; tabela(); };
  $app.querySelector('.rel-per').onclick = (e) => { const b = e.target.closest('[data-per]'); if (b && b.dataset.per !== st.per) { st.per = b.dataset.per; staffRelatorios(); } };
  document.getElementById('rel-csv').onclick = () => {
    const cab = ['Aluno', 'Km', 'Km período anterior', 'Corridas', 'Treinos de força', 'Planilha cumprida (%)', 'Pace médio (min/km)', 'Pace anterior (min/km)', '10 km previsto', '10 km previsto no início', 'Dias sem treinar', 'Alertas'];
    const cel = (v) => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const linhasCsv = linhas.slice().sort(ordenar.nome).map((l) => [l.m.nome, f1(l.km), f1(l.kmA), l.corridas, l.forca, l.ader ?? '', l.pace ? fmtPace(l.pace).replace('/km', '') : '', l.paceA ? fmtPace(l.paceA).replace('/km', '') : '', l.p10 ? fmtDurLongo(l.p10) : '', l.p10A ? fmtDurLongo(l.p10A) : '', l.parado ?? '', l.alertas.join(' | ')].map(cel).join(';'));
    const blob = new Blob(['﻿' + [cab.join(';'), ...linhasCsv].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Relatorio-Nexos-${per.replace(' ', '-')}-${hojeISO()}.csv`; document.body.appendChild(a); a.click(); a.remove();
    toast('Planilha baixada! Abre no Excel ou no Google Planilhas.');
  };
}

function staffMais() {
  dockStaff();
  if (S.cache.fichasNovas == null) Promise.all([sb.from('nx_form_respostas').select('form_id').eq('org_id', S.org.id).eq('visto', false), sb.from('nx_formularios').select('id,criado_por').eq('org_id', S.org.id)]).then(([r, f]) => { const meus = new Set((f.data || []).filter(formMeu).map((x) => x.id)); S.cache.fichasNovas = (r.data || []).filter((x) => !x.form_id || meus.has(x.form_id)).length; if (S.cache.fichasNovas && location.hash === '#/mais') staffMais(); }).catch(() => {});
  if (S.cache.errosAbertos == null) sb.from('nx_erros').select('id', { count: 'exact', head: true }).eq('org_id', S.org.id).eq('resolvido', false).then((r) => { S.cache.errosAbertos = r.count || 0; if (S.cache.errosAbertos && location.hash === '#/mais') staffMais(); }, () => {});
  const it = (href, ic, t, d) => `<a class="list-item" href="${href}" style="color:inherit"><span class="ativ-ic">${ic}</span><div class="grow"><b>${t}</b><div class="small muted">${d}</div></div>${I.chev}</a>`;
  $app.innerHTML = `<p class="eyebrow">Mais</p><h1 class="h1">Gestão da assessoria</h1>
    <div class="stack" style="margin-top:16px">
      ${it('#/financeiro', I.money, 'Financeiro', 'Mensalidades, Pix e quem está em dia')}
      ${it('#/formularios', I.ficha, `Formulários${S.cache.fichasNovas ? ` <span class="tag acc">${S.cache.fichasNovas} nova${S.cache.fichasNovas > 1 ? 's' : ''}</span>` : ''}`, 'Ficha de entrada: gere o link e mande no WhatsApp')}
      ${it('#/eventos', I.flag, 'Eventos', 'Treinões da Nexos e alunos nas provas')}
      ${it('#/erros', I.alerta, `Erros do app${S.cache.errosAbertos ? ` <span class="tag acc">${S.cache.errosAbertos} aberto${S.cache.errosAbertos > 1 ? 's' : ''}</span>` : ''}`, 'O que deu errado no app dos alunos, com tela e aparelho')}
      ${it('#/perfil', I.user, 'Perfil e equipe', S.me.papel === 'admin' ? 'Sua conta, treinadores e notificações' : 'Sua conta e notificações')}
    </div>`;
}

/* ---------- biblioteca de exercícios ---------- */
async function staffBiblioteca(aba) {
  loading();
  if (aba === 'modelos') {
    const mods = await buscarModelosTreino();
    dockStaff();
    const exs0 = await carregarExercicios();
    const exMap0 = Object.fromEntries(exs0.map((e) => [e.id, e]));
    const porNome = Object.fromEntries(exs0.map((e) => [semAcento(e.nome), e]));
    const exDe = (it) => porNome[semAcento(it.nome)] || null;
    // treino da biblioteca → itens com o exercício do catálogo da assessoria
    const itensDe = (t) => t.itens.map((it) => ({ ...it, exercicio_id: (exDe(it) || {}).id })).filter((it) => it.exercicio_id);
    const st = S.cache.libF || (S.cache.libF = { niv: store.get('nx_libf_niv', 'ini'), cat: 'todos', abertos: {} });
    const nomeNiv = Object.fromEntries(NIVEIS_FORCA), nomeCat = Object.fromEntries(CATS_FORCA);
    const cardMeu = (m) => { const its = m.itens || []; const grupos = [...new Set(its.map((i) => (exMap0[i.exercicio_id] || {}).grupo).filter(Boolean))].slice(0, 3); return `<div class="card modelo-t" data-mt="${m.id}"><div class="row between" style="align-items:flex-start;gap:10px"><div style="min-width:0"><b class="h3" style="display:block">${esc(m.nome)}</b><div class="small muted">${its.length} exercício${its.length === 1 ? '' : 's'}${grupos.length ? ' · ' + grupos.map(esc).join(', ') : ''}</div></div>${I.chev}</div>
        <div class="mt-fotos">${its.slice(0, 5).map((i) => exFig(exMap0[i.exercicio_id] || {}, 'thumb')).join('')}</div>
        <button class="btn ghost sm" data-aplicar="${m.id}" style="margin-top:12px">${I.users} Aplicar a alunos</button></div>`; };
    const cardProg = (pg) => {
      const aberto = !!st.abertos[pg.id]; const nEx = pg.treinos.reduce((a, t) => a + t.itens.length, 0);
      return `<div class="card prog-f cat-${pg.cat}" data-prog="${pg.id}">
        <div class="pf-top"><span class="pf-ic">${FORCA_IC}</span><div style="min-width:0"><b class="h3" style="display:block">${esc(pg.nome)}</b>
          <div class="mc-tags"><span class="tag cat-t cat-${pg.cat}">${nomeCat[pg.cat]}</span><span class="tag niv-${pg.niv}">${nomeNiv[pg.niv]}</span><span class="tag">${pg.treinos.length} treino${pg.treinos.length > 1 ? 's' : ''} · ${nEx} exercícios</span></div></div></div>
        <p class="small pf-freq">${icT(I.cal || I.clock || '')}${esc(pg.freq)}</p>
        <p class="mc-info">${esc(pg.info)}</p>
        <div class="pf-treinos">${pg.treinos.map((t, k) => `<div class="pf-t">
          <button type="button" class="pf-t-h" data-tog="${pg.id}"><b>${esc(t.titulo)}</b><span class="small muted ellip">${esc(t.foco)}</span><span class="mt-fotos">${t.itens.slice(0, 4).map((it) => exFig(exDe(it) || {}, 'thumb')).join('')}</span></button>
          ${aberto ? `<ol class="pf-ex">${t.itens.map((it) => { const ex = exDe(it); return `<li><span class="pf-fig">${exFig(ex || {}, 'thumb')}</span><div class="grow" style="min-width:0"><b>${esc(it.nome)}</b><div class="small muted">${it.series} × ${esc(it.repeticoes)}${it.descanso_seg ? ` · descanso ${it.descanso_seg >= 60 && it.descanso_seg % 30 === 0 ? (it.descanso_seg / 60).toString().replace('.', ',') + ' min' : it.descanso_seg + ' s'}` : ' · sem descanso'}</div>${it.observacao ? `<div class="tiny dim">${esc(it.observacao)}</div>` : ''}</div></li>`; }).join('')}</ol>` : ''}
        </div>`).join('')}</div>
        <button type="button" class="link-btn small pf-ver" data-tog="${pg.id}">${aberto ? 'Esconder exercícios' : 'Ver todos os exercícios'}</button>
        <div class="pf-acoes"><button type="button" class="btn sm" data-aplprog="${pg.id}">${I.users} Aplicar a alunos</button><button type="button" class="btn ghost sm" data-salvprog="${pg.id}">Salvar nos meus modelos</button></div></div>`;
    };
    const desenhar = () => {
      const sel = st.niv, meus = sel === 'meus';
      const ordCat = CATS_FORCA.map(([k]) => k); const lista = BIB_FORCA.filter((pg) => pg.niv === sel && (st.cat === 'todos' || pg.cat === st.cat)).sort((a, b) => ordCat.indexOf(a.cat) - ordCat.indexOf(b.cat));
      const cont = (k) => k === 'meus' ? mods.length : BIB_FORCA.filter((pg) => pg.niv === k).length;
      $app.innerHTML = `<p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('musculacao')}
        <p class="muted small">Biblioteca de força da Nexos por nível e objetivo, montada com as recomendações mais recentes (posição do ACSM de 2026 e meta-análises de 2021 a 2026). Aplique o programa inteiro a um aluno ou salve nos seus modelos para ajustar.</p>
        <div class="niv-tabs niv-f" id="fniv">${[...NIVEIS_FORCA, ['meus', 'Meus modelos']].map(([k, l]) => `<button type="button" class="${sel === k ? 'on' : ''}" data-fniv="${k}"><b>${l}</b><span>${cont(k)} ${k === 'meus' ? 'modelos' : 'programas'}</span></button>`).join('')}</div>
        ${meus ? `<div class="cols" style="margin-top:16px" id="mods">${mods.map(cardMeu).join('') || '<div class="empty" style="grid-column:1/-1"><div class="h3">Nenhum modelo ainda</div><p class="small">Crie no + ou salve um programa da biblioteca para ajustar do seu jeito.</p></div>'}</div>`
          : `<div class="card guia-niv"><span class="eyebrow">Como montar · ${nomeNiv[sel]}</span><ul>${GUIA_FORCA[sel].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div class="chips" id="fcat" style="margin-top:14px">${[['todos', 'Todos os objetivos'], ...CATS_FORCA].map(([k, l]) => `<button class="chip ${st.cat === k ? 'on' : ''}" data-fcat="${k}">${l}</button>`).join('')}</div>
        <div class="cols" style="margin-top:16px">${lista.map(cardProg).join('')}</div>
        <p class="tiny dim" style="margin-top:18px">Bases: ACSM 2026 (Currier et al., Med Sci Sports Exerc); Robinson 2024 e Pelland (Sports Med); Singer 2024; Wolf 2023; Maeo 2021 e 2022; Plotkin 2023; Wewege 2021; Llanos-Lagos 2024; Lauersen 2014; Rønnestad 2011; Iversen 2021; Sødal 2023; van Dyk 2019; Harøy 2019; Watson 2018 (LIFTMOR); Su 2023; Hayden 2021 (Cochrane).</p>`}
        <a class="fab" href="#/modelo/novo" aria-label="Novo modelo">${I.plus}</a>`;
    };
    desenhar();
    $app.onclick = async (e) => {
      const nv = e.target.closest('[data-fniv]'); if (nv) { st.niv = nv.dataset.fniv; store.set('nx_libf_niv', st.niv); return desenhar(); }
      const ct = e.target.closest('[data-fcat]'); if (ct) { st.cat = ct.dataset.fcat; return desenhar(); }
      const tg = e.target.closest('[data-tog]'); if (tg) { st.abertos[tg.dataset.tog] = !st.abertos[tg.dataset.tog]; const y = scrollY; desenhar(); scrollTo(0, y); return; }
      const ap = e.target.closest('[data-aplprog]');
      if (ap) {
        const pg = BIB_FORCA.find((x) => x.id === ap.dataset.aplprog);
        return escolherAlunos(null, `Aplicar “${pg.nome}”`, async (ids, avisar) => {
          let n = 0;
          for (const [k, t] of pg.treinos.entries()) n = await aplicarTreinoAlunos({ titulo: t.titulo, foco: t.foco, observacoes: `${pg.nome} (${nomeNiv[pg.niv]}) · ${pg.freq}.\n${pg.info}`, itens: itensDe(t) }, ids, avisar && k === 0);
          toast(`${pg.treinos.length} treinos enviados para ${n} aluno${n > 1 ? 's' : ''}! Defina os dias da semana no treino de cada um.`);
        });
      }
      const sv = e.target.closest('[data-salvprog]');
      if (sv) {
        const pg = BIB_FORCA.find((x) => x.id === sv.dataset.salvprog); sv.disabled = true;
        const linhas = pg.treinos.map((t) => ({ org_id: S.org.id, nome: `${pg.nome} (${nomeNiv[pg.niv]}) – ${t.titulo}`, foco: t.foco, observacoes: `${pg.freq}.\n${pg.info}`, itens: itensLimpos(itensDe(t)), criado_por: S.user.id }));
        const { data: novos, error } = await sb.from('nx_modelos_treino').insert(linhas).select('*');
        sv.disabled = false; if (error) return toast('Não foi possível salvar.', true);
        mods.push(...(novos || [])); mods.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
        return toast(`${linhas.length} treinos salvos em Meus modelos. Lá você pode editar.`);
      }
      const apm = e.target.closest('[data-aplicar]');
      if (apm) { const m = mods.find((x) => x.id === apm.dataset.aplicar); return escolherAlunos(null, `Aplicar “${m.nome}”`, async (ids, avisar) => { const n = await aplicarTreinoAlunos({ titulo: m.nome, foco: m.foco || '', observacoes: m.observacoes || '', itens: m.itens || [] }, ids, avisar); toast(`Treino enviado para ${n} aluno${n > 1 ? 's' : ''}!`); }); }
      const c = e.target.closest('[data-mt]'); if (c) location.hash = '#/modelo/' + c.dataset.mt;
    };
    return;
  }
  const [exs, fav] = await Promise.all([carregarExercicios(true), carregarFavoritos()]);
  const comMidia = exs.filter((e) => (e.imagens && e.imagens.length) || e.video_url).length;
  $app.innerHTML = `
    <p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('exercicios')}
    <p class="muted small" style="margin-top:6px">${exs.length} exercícios · ${comMidia} com foto ou vídeo. Toque em um para ver como fazer, editar ou trocar a mídia.</p>
    <div id="bib-box" style="margin-top:14px"></div>`;
  bibliotecaUI(document.getElementById('bib-box'), exs, fav, { acao: I.chev, aoTocar: (ex) => formExercicio(ex), aoCriar: () => formExercicio(null) });
}

/* ---------- mensagens (caixa de entrada do treinador, estilo WhatsApp) ---------- */
const horaMsg = (iso) => { const d = new Date(iso); const q = quando(iso); return q === 'hoje' ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : q === 'ontem' ? 'Ontem' : `${d.getDate()}/${d.getMonth() + 1}`; };
async function staffMensagens(alunoId) {
  const largo = innerWidth >= 900;
  const st = S.cache.msgSt || (S.cache.msgSt = { q: '' });
  if (!S.cache.msgLista) loading();
  const [{ data: membrosT }, { data: msgsT }] = await Promise.all([
    sb.from('nx_membros').select('user_id,nome,foto_url,treinador_id,ativo').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome'),
    sb.from('nx_mensagens').select('aluno_id,autor_id,texto,criado_em,lida').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(2000),
  ]);
  const membros = (membrosT || []).filter(ehMeuAluno), vis = new Set(membros.map((m) => m.user_id)), msgs = (msgsT || []).filter((m) => vis.has(m.aluno_id));
  dockStaff();
  const ult = {}, nl = {};
  (msgs || []).forEach((m) => { if (!ult[m.aluno_id]) ult[m.aluno_id] = m; if (m.autor_id === m.aluno_id && !m.lida) nl[m.aluno_id] = (nl[m.aluno_id] || 0) + 1; });
  S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0); dockStaff();
  const porId = Object.fromEntries((membros || []).map((m) => [m.user_id, m]));
  let conversas = Object.keys(ult).filter((id) => porId[id]).sort((a, b) => (ult[b].criado_em > ult[a].criado_em ? 1 : -1));
  S.cache.msgLista = true;
  const itemHTML = (id) => { const m = porId[id], u = ult[id], n = nl[id] || 0; const eu = u.autor_id !== id;
    return `<a class="cv ${n ? 'nova' : ''} ${id === alunoId ? 'on' : ''}" href="#/mensagens/${id}" data-cv="${id}">${avAluno(m)}<div class="cv-c"><div class="cv-l1"><b class="ellip">${esc(m.nome)}</b><span class="cv-h">${horaMsg(u.criado_em)}</span></div>
      <div class="cv-l2"><span class="ellip">${eu ? '<i class="cv-eu">Você:</i> ' : ''}${esc(u.texto || '')}</span>${n ? `<i class="cv-n">${n}</i>` : ''}</div></div></a>`; };
  const listaHTML = () => {
    const q = semAcento(st.q);
    const l = conversas.filter((id) => (!q || semAcento(porId[id].nome).includes(q)));
    return l.length ? l.map(itemHTML).join('') : `<div class="empty" style="margin-top:12px"><div class="h3">${conversas.length ? 'Nenhuma conversa aqui' : 'Nenhuma mensagem ainda'}</div><p class="small">${conversas.length ? 'Tente outra busca.' : 'Quando um aluno mandar mensagem, a conversa aparece aqui.'}</p></div>`;
  };
  const painelLista = `<div class="cv-top"><div><p class="eyebrow">Conversas</p><h1 class="h1" style="margin:2px 0 0">Mensagens</h1></div><button class="btn sm" id="cv-nova">${I.plus} Nova</button></div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="cv-q" placeholder="Buscar aluno" value="${esc(st.q)}"></div>
    <div class="cv-lista" id="cv-lista">${listaHTML()}</div>`;
  const aluno = alunoId && porId[alunoId];
  const cabChat = aluno ? `<div class="cv-chat-h">${largo ? '' : `<a class="icon-btn sm" href="#/mensagens" aria-label="Voltar">${I.back}</a>`}${avAluno(aluno)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(aluno.nome)}</b><span class="tiny dim">Aluno${aluno.treinador_id && aluno.treinador_id !== S.user.id ? '' : ' seu'}</span></div><a class="btn ghost sm" href="#/aluno/${alunoId}">Ver atleta</a></div><div id="cv-box"></div>` : '';
  if (largo) {
    $app.innerHTML = `<div class="cv-split"><aside class="cv-side">${painelLista}</aside><section class="cv-main">${aluno ? cabChat : `<div class="cv-vazio">${I.feed}<b>Escolha uma conversa</b><span class="small muted">As mensagens dos alunos aparecem à esquerda, a mais recente em cima.</span></div>`}</section></div>`;
  } else {
    $app.innerHTML = aluno ? cabChat : painelLista;
  }
  if (aluno) { await viewConversa(alunoId, document.getElementById('cv-box'), true); nl[alunoId] = 0; S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0); dockStaff(); const it = document.querySelector(`[data-cv="${alunoId}"]`); if (it) { it.classList.remove('nova'); it.querySelector('.cv-n')?.remove(); } }
  // a lista se atualiza sozinha (mensagens novas sobem para o topo)
  const atualizar = async () => {
    const lst = document.getElementById('cv-lista'); if (!lst || !location.hash.startsWith('#/mensagens')) return clearInterval(S.msgT);
    const { data } = await sb.from('nx_mensagens').select('aluno_id,autor_id,texto,criado_em,lida').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(2000);
    if (!data) return;
    Object.keys(ult).forEach((k) => delete ult[k]); Object.keys(nl).forEach((k) => delete nl[k]);
    data.forEach((m) => { if (!ult[m.aluno_id]) ult[m.aluno_id] = m; if (m.autor_id === m.aluno_id && !m.lida && m.aluno_id !== alunoId) nl[m.aluno_id] = (nl[m.aluno_id] || 0) + 1; });
    conversas = Object.keys(ult).filter((id) => porId[id]).sort((a, b) => (ult[b].criado_em > ult[a].criado_em ? 1 : -1));
    const y = lst.scrollTop; lst.innerHTML = listaHTML(); lst.scrollTop = y;
    S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0); dockStaff();
  };
  clearInterval(S.msgT); S.msgT = setInterval(atualizar, 12000);
  const fm = document.getElementById('f-msg'); if (fm) fm.addEventListener('submit', () => setTimeout(atualizar, 1200));
  const qi = document.getElementById('cv-q'); if (qi) qi.oninput = () => { st.q = qi.value; document.getElementById('cv-lista').innerHTML = listaHTML(); };
  const nv = document.getElementById('cv-nova'); if (nv) nv.onclick = () => {
    const al = (membros || []).filter((m) => m.ativo);
    openSheet(`<p class="eyebrow">Nova conversa</p><div class="h2" style="margin-top:4px">Para qual aluno?</div><div class="search" style="margin-top:12px">${I.search}<input class="input" id="nc-q" placeholder="Buscar aluno"></div><div class="stack" id="nc-l" style="margin-top:10px;max-height:52vh;overflow:auto"></div>`, (r) => {
      const draw = (q) => { r.querySelector('#nc-l').innerHTML = al.filter((m) => !q || semAcento(m.nome).includes(semAcento(q))).map((m) => `<a class="list-item" href="#/mensagens/${m.user_id}" style="color:inherit">${avAluno(m)}<b class="grow">${esc(m.nome)}</b>${I.chev}</a>`).join('') || '<p class="small muted">Nenhum aluno encontrado.</p>'; };
      draw(''); r.querySelector('#nc-q').oninput = (e) => draw(e.target.value);
    });
  };
}

/* ---------- formulários (ficha de entrada por link) ---------- */
const FICHA_RELOGIOS = ['Garmin', 'Coros', 'Apple Watch', 'Polar', 'Amazfit', 'Samsung', 'Xiaomi', 'Outro', 'Não tenho'];
const FICHA_EXP = [['nunca', 'Nunca corri'], ['iniciante', 'Comecei há menos de 6 meses'], ['intermediario', 'Corro de 6 meses a 2 anos'], ['experiente', 'Corro há mais de 2 anos']];
const FICHA_HOR = [['cedo', 'Bem cedo (5h–7h)'], ['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite']];
const FICHA_LOCAL = [['rua', 'Rua / orla'], ['esteira', 'Esteira'], ['academia', 'Academia'], ['pista', 'Pista de atletismo'], ['trilha', 'Trilha'], ['casa', 'Em casa']];
const FICHA_ORIGEM = [['instagram', 'Instagram'], ['indicacao', 'Indicação de amigo'], ['radar', 'Radar Corridas Maranhão'], ['evento', 'Em uma prova ou treinão'], ['outro', 'Outro']];
const FICHA_ESPORTES = [['nunca', 'Nunca pratiquei'], ['corrida', 'Corrida'], ['natacao', 'Natação'], ['ciclismo', 'Ciclismo'], ['musculacao', 'Musculação'], ['triathlon', 'Triathlon'], ['futebol', 'Futebol'], ['voleibol', 'Voleibol'], ['basquete', 'Basquetebol'], ['judo', 'Judô'], ['lutas', 'Artes marciais'], ['outros', 'Outros esportes']];
const FICHA_NIVEL = [['sedentario', 'Sedentário'], ['iniciante', 'Iniciante'], ['intermediario', 'Intermediário'], ['avancado', 'Avançado'], ['profissional', 'Profissional']];
const FICHA_HIST = ['Alguma doença na família nos últimos anos?', 'Alguma doença pessoal nos últimos anos?', 'Possui alguma restrição à prática de atividade física?', 'Já fez alguma cirurgia?', 'Possui algum tipo de alergia?', 'Já sofreu algum acidente ou lesão nos ossos, músculos ou articulações?', 'Usa algum medicamento?', 'Fuma ou já teve o hábito de fumar?', 'Tem sentido dores no corpo?', 'Está em dieta para perder ou ganhar peso?', 'Fez algum exame do coração nos últimos 6 meses?'];
const FICHA_TERMO = 'Declaro que conheço os riscos próprios da prática de corrida, musculação e outros exercícios físicos, em treinos e em provas, como lesões musculares, articulares e ósseas, mal-estar, desidratação, problemas cardíacos, quedas e acidentes e, em casos extremos, morte súbita, e que pratico a atividade por livre escolha, assumindo esses riscos. Declaro que estou apto para a atividade física, que as informações desta ficha são verdadeiras e completas e que vou informar à Nexos Performance e Saúde qualquer mudança na minha saúde, apresentando atestado médico sempre que for recomendado ou solicitado. A Nexos, seus sócios e treinadores não se responsabilizam por lesões, doenças, acidentes ou morte decorrentes dos riscos próprios da atividade, de condições de saúde não informadas, do descumprimento das orientações, de treinos sem a supervisão presencial da Nexos, de provas organizadas por terceiros ou de qualquer outro fato fora do seu controle. Autorizo a Nexos a usar estes dados, inclusive os de saúde, somente para montar e acompanhar o meu treino, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).';
const fichaLink = (tk) => loginURL() + '#/ficha/' + tk;
const telWa = (t) => { const d = String(t || '').replace(/\D/g, ''); return d ? (d.length <= 11 ? '55' + d : d) : ''; };
const fichaMsg = (nome, link) => `Olá${nome ? ', ' + firstName(nome) : ''}! Aqui é da Nexos Performance e Saúde\n\nPara montarmos o seu treino, preencha sua ficha de entrada (leva uns 5 minutos):\n${link}`;
// disponibilidade do aluno (dias que corre / faz força), marcada na ficha ou pelo treinador
const dispDe = (m) => (m && m.disponibilidade) || {};
const dispIcones = (m, i) => { const dp = dispDe(m); return `${(dp.corrida || []).includes(i) ? selo('corrida', 'disp-ic') : ''}${(dp.forca || []).includes(i) ? selo('forca', 'disp-ic') : ''}`; };
const dispResumo = (m) => { const dp = dispDe(m); const t = (l) => (l || []).slice().sort().map((i) => DSEM[i].slice(0, 3)).join(', '); return [dp.corrida && dp.corrida.length ? `${selo('corrida', 'sm')} ${t(dp.corrida)}` : '', dp.forca && dp.forca.length ? `${selo('forca', 'sm')} ${t(dp.forca)}` : ''].filter(Boolean).join(' · '); };
function editarDisponibilidade(m, aoSalvar) {
  const dp = dispDe(m);
  const linha = (k, ic, l) => `<div class="field"><span>${ic} ${l}</span><div class="chips wrap">${DSEM.map((d, i) => `<label class="chipc"><input type="checkbox" name="${k}" value="${i}" ${(dp[k] || []).includes(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></div>`;
  openSheet(`<p class="eyebrow">${esc(firstName(m.nome))}</p><div class="h2" style="margin-top:4px">Dias de treino</div><p class="small muted" style="margin-top:4px">Os dias aparecem com ${selo('corrida', 'sm')} e ${selo('forca', 'sm')} nas planilhas, para você encaixar os treinos certinho.</p>
    <form id="f-disp" style="margin-top:16px">${faz('corrida', m) ? linha('corrida', selo('corrida', 'sm'), 'Corrida') : ''}${faz('musculacao', m) ? linha('forca', selo('forca', 'sm'), 'Força') : ''}
    <label class="field"><span>Comentário sobre a disponibilidade</span><textarea class="textarea" name="obs">${esc(dp.obs || '')}</textarea></label><button class="btn block" type="submit">Salvar</button></form>`, (r) => {
    r.querySelector('#f-disp').onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target);
      const nv = { ...dp, corrida: fd.getAll('corrida').map(Number), forca: fd.getAll('forca').map(Number), obs: String(fd.get('obs') || '').trim() || undefined };
      const { error } = await sb.from('nx_membros').update({ disponibilidade: nv }).eq('org_id', S.org.id).eq('user_id', m.user_id);
      if (error) return toast('Não foi possível salvar.', true);
      m.disponibilidade = nv; closeSheet(); toast('Dias salvos.'); aoSalvar && aoSalvar();
    };
  });
}

async function chamarForm(body) {
  const { data, error } = await sb.functions.invoke('nx-form', { body });
  if (error) { let m = 'Não foi possível carregar. Verifique sua internet.'; try { const j = await error.context.json(); m = j.erro || m; } catch {} throw new Error(m); }
  if (data && data.erro) throw new Error(data.erro);
  return data;
}

async function viewFicha(token) {
  $dock.hidden = true; layout('bare'); loading();
  let info;
  try { info = await chamarForm({ acao: 'abrir', token }); }
  catch (e) { $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="empty" style="margin-top:30px"><div class="h3">Link indisponível</div><p class="small">${esc(e.message)}</p></div>`; return; }
  if (info.respondido) { $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="card center" style="margin-top:24px;padding:26px 18px">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Ficha já enviada</div><p class="small muted" style="margin-top:6px">Recebemos suas respostas. O seu treinador vai falar com você pelo WhatsApp.</p></div>`; return; }
  const chips = (name, ops, tipo = 'checkbox') => `<div class="chips wrap">${ops.map(([k, l]) => `<label class="chipc"><input type="${tipo}" name="${name}" value="${k}"><span>${l}</span></label>`).join('')}</div>`;
  const sn = (name) => `<div class="radios"><label><input type="radio" name="${name}" value="nao"><span>Não</span></label><label><input type="radio" name="${name}" value="sim"><span>Sim</span></label></div>`;
  const sn3 = (name) => `<div class="radios r3"><label><input type="radio" name="${name}" value="sim"><span>Sim</span></label><label><input type="radio" name="${name}" value="nao"><span>Não</span></label><label><input type="radio" name="${name}" value="naosei"><span>Não sei</span></label></div>`;
  const diasL = (k, ic, l) => `<div class="field disp-l" data-disp="${k}"><span>${ic} ${l}</span>${chips('d_' + k, DSEM.map((d, i) => [String(i), d.slice(0, 3)]))}</div>`;
  const sec = (n, t, d, corpo) => `<section class="card ficha-sec wz-step" data-k="${n}" data-titulo="${t.split(' · ')[0]}"><div class="ficha-n">${n}</div><div class="grow" style="min-width:0"><div class="h3">${t}</div>${d ? `<p class="tiny dim" style="margin:3px 0 0">${d}</p>` : ''}<div class="stack" style="margin-top:12px;gap:2px">${corpo}</div></div></section>`;
  $app.innerHTML = `
    <div class="ficha-top"><img src="${LOGO.s()}" alt="">${slashes}</div>
    <p class="eyebrow">${esc(info.org)}</p><h1 class="h1" style="margin-top:4px">Ficha de entrada</h1>
    <p class="muted small" style="margin:8px 0 0">São 7 etapas rápidas, uns 5 minutos. Com essas respostas o treinador monta um treino certo para você, com segurança. Campos com * são obrigatórios.</p>
    <form id="f-ficha" class="stack" style="margin-top:16px" novalidate>
      ${sec(1, 'Seus dados', '', `
        <label class="field"><span>Nome completo *</span><input class="input" name="nome" required value="${esc(info.nome)}" autocomplete="name"></label>
        <div class="grid2"><label class="field"><span>WhatsApp *</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" required placeholder="(98) 9 9999-9999" value="${esc(info.telefone)}" autocomplete="tel"></label>
        <label class="field"><span>E-mail *</span><input class="input" type="email" name="email" required inputmode="email" autocomplete="email" placeholder="será o seu login no app"></label></div>
        <div class="grid2"><label class="field"><span>Data de nascimento *</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa"></label>
        <label class="field"><span>Sexo *</span><select class="input" name="sexo"><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="nao_informar">Prefiro não dizer</option></select></label></div>
        <div class="grid2"><label class="field"><span>Altura</span><div class="un-wrap"><input class="input" name="altura" data-mask="altura" inputmode="numeric" placeholder="1,75"><i>m</i></div></label>
        <label class="field"><span>Peso</span><div class="un-wrap"><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="70"><i>kg</i></div></label></div>
        <label class="field"><span>Bairro / cidade</span><input class="input" name="cidade" placeholder="Ex.: Cohama, São Luís"></label>`)}
      ${sec(2, 'Objetivo', '', `
        <div class="field"><span>Quer treinar com a Nexos *</span>${chips('modalidades', MODS)}</div>
        <div class="field"><span>Objetivo principal</span>${chips('objetivo', OBJETIVOS, 'radio')}</div>
        <label class="field"><span>Quais são os seus objetivos pessoais com o treino? *</span><textarea class="textarea" name="meta" placeholder="Ex.: correr meus primeiros 10 km, perder peso, voltar a treinar sem dor"></textarea></label>
        <label class="field"><span>Tem alguma prova em vista?</span><input class="input" name="prova" placeholder="Nome e data, se já souber"></label>`)}
      ${sec(3, 'Histórico esportivo', '', `
        <div class="field"><span>Já praticou ou pratica algum esporte? *</span>${chips('esportes', FICHA_ESPORTES)}</div>
        <label class="field" id="esp-outros" hidden><span>Quais outros esportes?</span><input class="input" name="esportes_outros"></label>
        <label class="field"><span>Como é ou foi a sua rotina de exercícios?</span><textarea class="textarea" name="atividade" placeholder="Ex.: musculação 3x por semana há 1 ano, futebol aos sábados"></textarea></label>
        <div class="field"><span>Como avalia o seu condicionamento físico hoje? *</span>${chips('nivel', FICHA_NIVEL, 'radio')}</div>
        <div class="field ficha-corr"><span>Experiência com corrida</span><select class="input" name="corrida_exp"><option value="">Selecione</option>${FICHA_EXP.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        <div class="grid2 ficha-corr"><label class="field"><span>Maior distância que já correu</span><input class="input" name="maior_dist" placeholder="Ex.: 10 km"></label>
        <label class="field"><span>Tempo recente (5 ou 10 km)</span><input class="input" name="tempo_recente" placeholder="Ex.: 5 km em 32 min"></label></div>
        <label class="field ficha-corr"><span>Relógio ou app que usa</span><select class="input" name="relogio"><option value="">Selecione</option>${FICHA_RELOGIOS.map((r) => `<option>${r}</option>`).join('')}</select></label>`)}
      ${sec(4, 'Histórico médico', 'Responda todas. Se tiver dúvida, marque “Não sei”.', `
        ${FICHA_HIST.map((q, i) => `<div class="parq"><p>${q}</p>${sn3('h' + (i + 1))}</div>`).join('')}
        <label class="field" style="margin-top:8px"><span>Observações sobre o seu histórico médico</span><textarea class="textarea" name="obs_medica" placeholder="Conte o que marcou como “sim”: qual doença, cirurgia, remédio, lesão…"></textarea></label>`)}
      ${sec(5, 'PAR-Q · prontidão para atividade física', 'Responda com sinceridade. Um "sim" não impede o treino, só pede uma conversa com o médico antes.', `
        ${PARQ.map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1))}</div>`).join('')}`)}
      ${sec(6, 'Disponibilidade para treinar', 'Marque os dias em que você consegue treinar cada modalidade.', `
        ${diasL('corrida', selo('corrida', 'sm'), 'Dias de corrida')}${diasL('forca', selo('forca', 'sm'), 'Dias de força (musculação)')}
        <div class="field"><span>Melhor horário</span>${chips('horario', FICHA_HOR)}</div>
        <div class="field"><span>Onde prefere treinar</span>${chips('local', FICHA_LOCAL)}</div>
        <label class="field"><span>Algum comentário sobre a sua disponibilidade?</span><textarea class="textarea" name="disp_obs" placeholder="Ex.: às quartas só depois das 19h"></textarea></label>`)}
      ${sec(7, 'Termo de aceite', '', `
        <div class="ficha-termo">${FICHA_TERMO}</div>
        <label class="ficha-aceite"><input type="checkbox" name="aceite"><span>Li e aceito o termo de responsabilidade acima. *</span></label>
        <div class="field" style="margin-top:12px"><span>Como conheceu a Nexos?</span>${chips('origem', FICHA_ORIGEM, 'radio')}</div>
        <label class="field"><span>Quer contar mais alguma coisa?</span><textarea class="textarea" name="obs"></textarea></label>`)}
      <button class="btn block" type="submit">Enviar ficha ${I.check}</button>
      <p class="tiny dim center">Suas respostas vão só para a equipe de treinadores da Nexos.</p>
    </form>`;
  const f = document.getElementById('f-ficha');
  const ajustar = () => {
    const mods = [...f.querySelectorAll('[name=modalidades]:checked')].map((x) => x.value);
    const corrOn = !mods.length || mods.includes('corrida'), forOn = !mods.length || mods.includes('musculacao');
    f.querySelectorAll('.ficha-corr').forEach((x) => (x.hidden = !corrOn));
    f.querySelector('[data-disp=corrida]').hidden = !corrOn; f.querySelector('[data-disp=forca]').hidden = !forOn;
    f.querySelector('#esp-outros').hidden = !f.querySelector('[name=esportes][value=outros]').checked;
  };
  f.addEventListener('change', (e) => {
    if (e.target.name === 'esportes' && e.target.checked) { // "nunca pratiquei" exclui os outros
      if (e.target.value === 'nunca') f.querySelectorAll('[name=esportes]').forEach((x) => { if (x !== e.target) x.checked = false; });
      else f.querySelector('[name=esportes][value=nunca]').checked = false;
    }
    ajustar();
  });
  aplicarMascaras(f);
  ajustar();
  etapas(f, (el) => {
    const fd = new FormData(f), v = (n) => String(fd.get(n) || '').trim(), k = el.dataset.k;
    const mods = fd.getAll('modalidades');
    if (k === '1') {
      if (v('nome').length < 3 || !v('nome').includes(' ')) return { msg: 'Escreva o seu nome completo.', sel: '[name=nome]' };
      if (soDig(v('telefone')).length < 10) return { msg: 'Confira o seu WhatsApp com DDD.', sel: '[name=telefone]' };
      if (!/^\S+@\S+\.\S+$/.test(v('email'))) return { msg: 'Confira o seu e-mail.', sel: '[name=email]' };
      const nas = dataISO(v('nascimento')); if (!nas || nas > hojeISO() || nas < '1920-01-01') return { msg: 'Confira a data de nascimento (dd/mm/aaaa).', sel: '[name=nascimento]' };
      if (!v('sexo')) return { msg: 'Escolha uma opção em Sexo.', sel: '[name=sexo]' };
      if (v('altura') && !/^[12],\d{2}$/.test(v('altura'))) return { msg: 'Confira a altura (ex.: 1,75).', sel: '[name=altura]' };
      return null;
    }
    if (k === '2') { if (!mods.length) return { msg: 'Marque corrida, musculação ou as duas.', sel: '[name=modalidades]' }; if (!v('meta')) return { msg: 'Conte quais são os seus objetivos.', sel: '[name=meta]' }; return null; }
    if (k === '3') { if (!fd.getAll('esportes').length) return { msg: 'Marque os esportes que já praticou (ou “Nunca pratiquei”).', sel: '[name=esportes]' }; if (!v('nivel')) return { msg: 'Escolha o seu nível de condicionamento.', sel: '[name=nivel]' }; return null; }
    if (k === '4') { const ih = FICHA_HIST.findIndex((_, i) => !fd.get('h' + (i + 1))); return ih >= 0 ? { msg: 'Responda todas as perguntas do histórico médico.', sel: `[name=h${ih + 1}]` } : null; }
    if (k === '5') { const iq = PARQ.findIndex((_, i) => !fd.get('q' + (i + 1))); return iq >= 0 ? { msg: `Responda a pergunta ${iq + 1} do PAR-Q.`, sel: `[name=q${iq + 1}]` } : null; }
    if (k === '6') { const c = mods.includes('corrida') ? fd.getAll('d_corrida') : [], fo = mods.includes('musculacao') ? fd.getAll('d_forca') : []; return c.length || fo.length ? null : { msg: 'Marque os dias em que pode treinar.', sel: '.disp-l:not([hidden]) input' }; }
    if (k === '7') return fd.get('aceite') ? null : { msg: 'Aceite o termo de responsabilidade.', sel: '[name=aceite]' };
    return null;
  });
  f.onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(f); const btn = f.querySelector('[type=submit]');
    const d = {}; ['nome', 'telefone', 'email', 'nascimento', 'sexo', 'altura', 'peso', 'cidade', 'objetivo', 'meta', 'prova', 'esportes_outros', 'atividade', 'nivel', 'corrida_exp', 'maior_dist', 'tempo_recente', 'relogio', 'obs_medica', 'disp_obs', 'origem', 'obs'].forEach((k) => { const v = String(fd.get(k) || '').trim(); if (v) d[k] = v.slice(0, 1500); });
    ['modalidades', 'esportes', 'horario', 'local'].forEach((k) => { const v = fd.getAll(k); if (v.length) d[k] = v; });
    if (d.nascimento) d.nascimento = dataISO(d.nascimento) || undefined;
    const mods = d.modalidades || [];
    d.disponibilidade = { corrida: mods.includes('corrida') ? fd.getAll('d_corrida').map(Number) : [], forca: mods.includes('musculacao') ? fd.getAll('d_forca').map(Number) : [] };
    d.hist = {}; FICHA_HIST.forEach((_, i) => { d.hist['h' + (i + 1)] = fd.get('h' + (i + 1)) || null; });
    d.parq = {}; PARQ.forEach((_, i) => { d.parq['q' + (i + 1)] = fd.get('q' + (i + 1)) || null; });
    const falta = (sel, msg) => { const el = f.querySelector(sel); toast(msg, true); if (el) el.closest('.field, .parq, .ficha-aceite, label')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    if (!d.nome || d.nome.length < 3) return falta('[name=nome]', 'Escreva seu nome completo.');
    if (String(d.telefone || '').replace(/\D/g, '').length < 10) return falta('[name=telefone]', 'Confira o seu WhatsApp com DDD.');
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) return falta('[name=email]', 'Confira o seu e-mail.');
    if (!mods.length) return falta('[name=modalidades]', 'Marque corrida, musculação ou as duas.');
    if (!d.meta) return falta('[name=meta]', 'Conte quais são os seus objetivos.');
    if (!d.esportes) return falta('[name=esportes]', 'Marque os esportes que já praticou (ou “Nunca pratiquei”).');
    if (!d.nivel) return falta('[name=nivel]', 'Escolha o seu nível de condicionamento.');
    const ih = FICHA_HIST.findIndex((_, i) => !d.hist['h' + (i + 1)]); if (ih >= 0) return falta(`[name=h${ih + 1}]`, 'Responda todas as perguntas do histórico médico.');
    const iq = PARQ.findIndex((_, i) => !d.parq['q' + (i + 1)]); if (iq >= 0) return falta(`[name=q${iq + 1}]`, `Responda a pergunta ${iq + 1} do PAR-Q.`);
    if (!d.disponibilidade.corrida.length && !d.disponibilidade.forca.length) return falta('.disp-l:not([hidden]) input', 'Marque os dias em que pode treinar.');
    if (!fd.get('aceite')) return falta('[name=aceite]', 'Aceite o termo de responsabilidade no final.');
    if (!d.nascimento) return falta('[name=nascimento]', 'Confira a data de nascimento.');
    d.aceite = true; btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const env = await chamarForm({ acao: 'enviar', token, dados: d });
      window.scrollTo(0, 0);
      $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="card center" style="margin-top:24px;padding:28px 18px">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Ficha enviada, ${esc(firstName(d.nome))}!</div><p class="small muted" style="margin-top:8px">O seu treinador da Nexos já recebeu as suas respostas.</p></div>
        ${env && env.resposta ? `<div class="card acesso-card" id="acesso-card" style="margin-top:16px"><div class="center"><div class="h3">Enviando o seu pedido de acesso…</div></div></div>` : ''}`;
      // o pedido de acesso sai sozinho junto com a ficha (antes dependia de mais um toque e muita gente saía da página)
      const pedir = async () => {
        const box = document.getElementById('acesso-card'); if (!box) return;
        try {
          const r = await chamarForm({ acao: 'criar_acesso', token, resposta: env.resposta });
          box.innerHTML = r.pendente
            ? `<div class="center">${estIc(I.espera, 'warn')}<div class="h3" style="margin-top:6px">Pedido de acesso enviado!</div><p class="small muted" style="margin:6px 0 4px">Assim que o seu treinador aprovar, o login e a senha do app chegam em <b>${esc(r.email)}</b>.</p><p class="tiny dim">Pode fechar esta página. Se o e-mail não aparecer, olhe também no Spam ou em Promoções.</p></div>`
            : r.senha
            ? `<div class="center">${estIc(I.okc, 'ok')}<div class="h3" style="margin-top:6px">Acesso criado!</div><p class="small muted" style="margin:6px 0 12px">Anote os seus dados:</p></div><div class="cred">E-mail: <b>${esc(r.email)}</b><br>Senha: <b>${esc(r.senha)}</b></div><a class="btn block" href="${esc(loginURL())}" style="margin-top:12px">Entrar no app</a>`
            : `<div class="center">${estIc(I.caixa)}<div class="h3" style="margin-top:6px">Você já tem acesso!</div><p class="small muted" style="margin:6px 0 12px">Entre no app com <b>${esc(r.email)}</b> e a senha que você já usa.</p></div><a class="btn block" href="${esc(loginURL())}">Ir para o app</a>`;
        } catch (er) {
          box.innerHTML = `<div class="center"><div class="h3">Falta só um passo</div><p class="small muted" style="margin:6px 0 12px">${esc(er.message || 'Não conseguimos enviar o pedido de acesso agora.')}</p></div><button class="btn block mail-btn" id="receber">${I.mail} Pedir meu acesso de novo</button>`;
          box.querySelector('#receber').onclick = () => { box.innerHTML = '<div class="center"><div class="h3">Enviando…</div></div>'; pedir(); };
        }
      };
      if (env && env.resposta) pedir();
    } catch (err) { btn.disabled = false; btn.textContent = 'Enviar ficha'; toast(err.message, true); }
  };
}

function fichaResumo(d) {
  const sim = PARQ.map((q, i) => [i + 1, q]).filter(([n]) => (d.parq || {})['q' + n] === 'sim');
  const histSim = FICHA_HIST.map((q, i) => [q, (d.hist || {})['h' + (i + 1)]]).filter(([, v]) => v === 'sim' || v === 'naosei');
  return { sim, histSim, mods: (d.modalidades || []).map((k) => (MODS.find((m) => m[0] === k) || [k, k])[1]).join(' + '), obj: (OBJETIVOS.find((o) => o[0] === d.objetivo) || [])[1] || '' };
}

async function staffFormularios(id) {
  loading();
  if (id) return staffFichaResposta(id);
  const [{ data: formsT }, { data: respsT }] = await Promise.all([
    sb.from('nx_formularios').select('*').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(500),
    sb.from('nx_form_respostas').select('*').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(300),
  ]);
  const meusForms = (formsT || []).filter(formMeu);
  const idsForms = new Set(meusForms.map((f) => f.id));
  const forms = meusForms.filter((f) => f.ativo);
  const resps = (respsT || []).filter((r) => !r.form_id || idsForms.has(r.form_id));
  const { data: mbs } = await sb.from('nx_membros').select('user_id,aprovacao,ativo').eq('org_id', S.org.id).eq('papel', 'aluno');
  const stM = Object.fromEntries((mbs || []).map((m) => [m.user_id, m]));
  const semAcesso = (r) => !r.aluno_id || (stM[r.aluno_id] && stM[r.aluno_id].aprovacao === 'pendente');
  dockStaff();
  S.cache.fichasNovas = (resps || []).filter((r) => !r.visto).length;
  const geral = (forms || []).find((f) => f.multiplo);
  const aguardando = (forms || []).filter((f) => !f.multiplo && !f.respondido_em);
  const linhaResp = (r) => { const d = r.dados || {}; const rs = fichaResumo(d);
    return `<a class="list-item ficha-it" href="#/formularios/${r.id}" style="color:inherit"><span class="ativ-ic">${I.ficha}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(d.nome || 'Sem nome')}</b><div class="small muted ellip">${[rs.mods, rs.obj].filter(Boolean).map(esc).join(' · ') || 'Ficha de entrada'}</div>
      <div class="ficha-tags">${!r.visto ? '<span class="tag acc">nova</span>' : ''}${rs.sim.length ? '<span class="tag err">PAR-Q</span>' : ''}${semAcesso(r) ? '<span class="tag warn">aguardando acesso</span>' : r.aluno_id ? '<span class="tag ok">cadastrado</span>' : ''}<span class="tiny dim">${quando(r.criado_em)}</span></div></div>${I.chev}</a>`; };
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>
    <p class="eyebrow">Formulários</p><h1 class="h1">Ficha de entrada</h1>
    <p class="muted small" style="margin-top:6px">Gere o link, mande no WhatsApp e a pessoa preenche pelo celular, sem precisar de login. As respostas chegam aqui.</p>
    <div class="grid2" style="margin-top:16px"><button class="btn" id="gerar">${I.plus} Gerar link</button><button class="btn ghost" id="geral">${I.feed} Link geral</button></div>
    <div class="section"><div class="section-h"><h2 class="h2">Respostas</h2>${slashes}</div>
      <div class="stack">${(resps || []).length ? resps.map(linhaResp).join('') : '<div class="empty"><div class="h3">Nenhuma ficha ainda</div><p class="small">Quando alguém preencher, aparece aqui e você recebe uma notificação.</p></div>'}</div></div>
    ${aguardando.length ? `<div class="section"><div class="section-h"><h2 class="h2">Aguardando resposta</h2></div><div class="stack">${aguardando.map((f) => `<div class="list-item"><span class="ativ-ic">${I.espera}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(f.nome || 'Link sem nome')}</b><div class="small muted">${f.telefone ? esc(f.telefone) + ' · ' : ''}enviado ${quando(f.criado_em)}</div></div>
      <button class="icon-btn sm" data-wa="${f.id}" aria-label="Mandar de novo no WhatsApp" title="WhatsApp">${I.feed}</button><button class="icon-btn sm" data-del="${f.id}" aria-label="Cancelar link" title="Cancelar link">${I.x}</button></div>`).join('')}</div></div>` : ''}`;
  const mostrar = (f) => {
    const link = fichaLink(f.token); const msg = fichaMsg(f.nome, link); const tel = telWa(f.telefone);
    openSheet(`<p class="eyebrow">${f.multiplo ? 'Link geral' : 'Link pronto'}</p><div class="h2" style="margin-top:4px">${f.multiplo ? 'Use na bio do Instagram ou em grupos' : esc(f.nome ? 'Ficha de ' + firstName(f.nome) : 'Ficha de entrada')}</div>
      <p class="small muted" style="margin-top:6px">${f.multiplo ? 'Qualquer pessoa pode preencher este link, quantas vezes for preciso.' : 'Vale para uma pessoa. Depois que ela enviar, o link fecha.'}</p>
      <div class="ficha-link mono">${esc(link)}</div>
      <a class="btn block wa-btn" href="https://wa.me/${tel}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" style="margin-top:12px">Enviar no WhatsApp${tel ? '' : ' (escolher contato)'}</a>
      <div class="mail-row" style="margin-top:8px"><input class="input" type="email" id="fx-mail" placeholder="E-mail da pessoa" value="${esc(f.email || '')}"><button class="btn mail-btn" id="fx-env">${I.mail} Enviar</button></div>
      <div class="grid2" style="margin-top:8px"><button class="btn ghost" id="cp-link">Copiar link</button><button class="btn ghost" id="cp-msg">Copiar mensagem</button></div>`, (r) => {
      r.querySelector('#fx-env').onclick = (ev) => { const para = r.querySelector('#fx-mail').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return toast('Digite um e-mail válido.', true); enviarEmailNexos({ tipo: 'ficha', para, nome: f.nome || '', link }, ev.currentTarget); };
      const cp = async (t, ok) => { try { await navigator.clipboard.writeText(t); toast(ok); } catch { toast('Não foi possível copiar.', true); } };
      r.querySelector('#cp-link').onclick = () => cp(link, 'Link copiado!');
      r.querySelector('#cp-msg').onclick = () => cp(msg, 'Mensagem copiada!');
    });
  };
  document.getElementById('gerar').onclick = () => openSheet(`<p class="eyebrow">Ficha de entrada</p><div class="h2" style="margin-top:4px">Gerar link</div>
    <form id="f-gl" style="margin-top:16px"><label class="field"><span>Nome da pessoa (opcional)</span><input class="input" name="nome" placeholder="Já aparece preenchido para ela"></label>
    <label class="field"><span>WhatsApp (opcional)</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999"></label>
    <p class="tiny dim" style="margin:-4px 0 14px">Com o número, o WhatsApp já abre na conversa dela.</p><button class="btn block" type="submit">Gerar link</button></form>`, (r) => {
    r.querySelector('#f-gl').onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target); e.target.querySelector('button').disabled = true;
      const { data, error } = await sb.from('nx_formularios').insert({ org_id: S.org.id, tipo: 'entrada', nome: String(fd.get('nome') || '').trim() || null, telefone: String(fd.get('telefone') || '').trim() || null, criado_por: S.user.id }).select('*').single();
      if (error) { e.target.querySelector('button').disabled = false; return toast('Não foi possível gerar o link.', true); }
      closeSheet(); staffFormularios().then(() => mostrar(data));
    };
  });
  document.getElementById('geral').onclick = async () => {
    if (geral) return mostrar(geral);
    const { data, error } = await sb.from('nx_formularios').insert({ org_id: S.org.id, tipo: 'entrada', multiplo: true, criado_por: S.user.id }).select('*').single();
    if (error) return toast('Não foi possível gerar o link.', true);
    mostrar(data);
  };
  $app.querySelectorAll('[data-wa]').forEach((b) => b.onclick = () => mostrar(forms.find((f) => f.id === b.dataset.wa)));
  $app.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (!confirm('Cancelar este link? A pessoa não vai mais conseguir preencher.')) return;
    await sb.from('nx_formularios').update({ ativo: false }).eq('id', b.dataset.del); staffFormularios();
  });
}

/* ---------- editar a ficha de inscrição (treinador) ---------- */
async function preencherFichaIns(alunoId) {
  const el = document.querySelector(`[data-ficha-ins="${alunoId}"]`); if (!el) return;
  const { data } = await sb.from('nx_form_respostas').select('id').eq('aluno_id', alunoId).order('criado_em', { ascending: false }).limit(1).then((r) => r, () => ({ data: null }));
  if (data && data[0]) { el.href = '#/formularios/' + data[0].id; el.hidden = false; }
}
function editarFicha(r, aoSalvar) {
  const d = JSON.parse(JSON.stringify(r.dados || {})); const dp = d.disponibilidade || {}; const h = d.hist || {}, pq = d.parq || {};
  const v = (k) => esc(d[k] || '');
  const chk = (name, ops, sel, tipo = 'checkbox') => `<div class="chips wrap">${ops.map(([k, l]) => `<label class="chipc"><input type="${tipo}" name="${name}" value="${k}" ${(Array.isArray(sel) ? sel.map(String).includes(String(k)) : String(sel) === String(k)) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const sn = (name, val, tres) => `<div class="radios ${tres ? 'r3' : ''}">${(tres ? [['sim', 'Sim'], ['nao', 'Não'], ['naosei', 'Não sei']] : [['nao', 'Não'], ['sim', 'Sim']]).map(([k, l]) => `<label><input type="radio" name="${name}" value="${k}" ${val === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const sec = (t, corpo, aberto) => `<details class="card ed-sec" ${aberto ? 'open' : ''}><summary><b>${t}</b>${I.chev}</summary><div class="stack" style="margin-top:12px;gap:2px">${corpo}</div></details>`;
  const diasOps = DSEM.map((x, i) => [String(i), x.slice(0, 3)]);
  openSheet(`<p class="eyebrow">Ficha de inscrição</p><div class="h2" style="margin-top:4px">Editar ${esc(firstName(d.nome || ''))}</div>
    <p class="small muted" style="margin-top:4px">Corrija o que precisar. ${r.aluno_id ? 'O cadastro do aluno no app é atualizado junto (modalidade, dados, dias de treino e PAR-Q).' : ''}</p>
    <form id="f-edf" class="stack" style="margin-top:14px;gap:10px">
      ${sec('Seus dados', `<label class="field"><span>Nome completo</span><input class="input" name="nome" value="${v('nome')}"></label>
        <div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" value="${esc(MASCARA.tel(d.telefone || ''))}"></label><label class="field"><span>E-mail</span><input class="input" name="email" type="email" value="${v('email')}"></label></div>
        <div class="grid2"><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(d.nascimento)}"></label>
        <label class="field"><span>Sexo</span><select class="input" name="sexo">${[['', 'Selecione'], ['feminino', 'Feminino'], ['masculino', 'Masculino'], ['nao_informar', 'Prefere não dizer']].map(([k, l]) => `<option value="${k}" ${d.sexo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="grid2"><label class="field"><span>Altura</span><input class="input" name="altura" data-mask="altura" inputmode="numeric" value="${v('altura')}"></label><label class="field"><span>Peso</span><input class="input" name="peso" data-mask="peso" inputmode="numeric" value="${v('peso')}"></label></div>
        <label class="field"><span>Bairro / cidade</span><input class="input" name="cidade" value="${v('cidade')}"></label>`, true)}
      ${sec('Objetivo e modalidade', `<div class="field"><span>Quer treinar</span>${chk('modalidades', MODS, d.modalidades || [])}</div>
        <div class="field"><span>Objetivo principal</span>${chk('objetivo', OBJETIVOS, d.objetivo, 'radio')}</div>
        <label class="field"><span>Objetivos pessoais</span><textarea class="textarea" name="meta">${v('meta')}</textarea></label>
        <label class="field"><span>Prova em vista</span><input class="input" name="prova" value="${v('prova')}"></label>`, true)}
      ${sec('Histórico esportivo', `<div class="field"><span>Esportes</span>${chk('esportes', FICHA_ESPORTES, d.esportes || [])}</div>
        <label class="field"><span>Outros esportes</span><input class="input" name="esportes_outros" value="${v('esportes_outros')}"></label>
        <label class="field"><span>Rotina de exercícios</span><textarea class="textarea" name="atividade">${v('atividade')}</textarea></label>
        <div class="field"><span>Condicionamento</span>${chk('nivel', FICHA_NIVEL, d.nivel, 'radio')}</div>
        <label class="field"><span>Experiência com corrida</span><select class="input" name="corrida_exp"><option value="">Selecione</option>${FICHA_EXP.map(([k, l]) => `<option value="${k}" ${d.corrida_exp === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="grid2"><label class="field"><span>Maior distância</span><input class="input" name="maior_dist" value="${v('maior_dist')}"></label><label class="field"><span>Tempo recente</span><input class="input" name="tempo_recente" value="${v('tempo_recente')}"></label></div>
        <label class="field"><span>Relógio</span><select class="input" name="relogio"><option value="">Selecione</option>${FICHA_RELOGIOS.map((x) => `<option ${d.relogio === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`)}
      ${sec('Histórico médico', `${FICHA_HIST.map((q, i) => `<div class="parq"><p>${q}</p>${sn('h' + (i + 1), h['h' + (i + 1)], true)}</div>`).join('')}
        <label class="field" style="margin-top:8px"><span>Observações médicas</span><textarea class="textarea" name="obs_medica">${v('obs_medica')}</textarea></label>`)}
      ${sec('PAR-Q', PARQ.map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1), pq['q' + (i + 1)])}</div>`).join(''))}
      ${sec('Disponibilidade', `<div class="field"><span>${selo('corrida', 'sm')} Dias de corrida</span>${chk('d_corrida', diasOps, (dp.corrida || []).map(String))}</div>
        <div class="field"><span>${selo('forca', 'sm')} Dias de força</span>${chk('d_forca', diasOps, (dp.forca || []).map(String))}</div>
        <div class="field"><span>Melhor horário</span>${chk('horario', FICHA_HOR, d.horario || [])}</div>
        <div class="field"><span>Onde prefere treinar</span>${chk('local', FICHA_LOCAL, d.local || [])}</div>
        <label class="field"><span>Comentário</span><textarea class="textarea" name="disp_obs">${v('disp_obs')}</textarea></label>`)}
      ${sec('Outros', `<div class="field"><span>Como conheceu a Nexos</span>${chk('origem', FICHA_ORIGEM, d.origem, 'radio')}</div><label class="field"><span>Comentário</span><textarea class="textarea" name="obs">${v('obs')}</textarea></label>`)}
      <button class="btn block" type="submit">Salvar alterações ${I.check}</button>
    </form>`, (root) => {
    const f = root.querySelector('#f-edf'); aplicarMascaras(f);
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f); const btn = f.querySelector('[type=submit]');
      ['nome', 'telefone', 'email', 'sexo', 'altura', 'peso', 'cidade', 'objetivo', 'meta', 'prova', 'esportes_outros', 'atividade', 'nivel', 'corrida_exp', 'maior_dist', 'tempo_recente', 'relogio', 'obs_medica', 'disp_obs', 'origem', 'obs'].forEach((k) => { const x = String(fd.get(k) || '').trim(); if (x) d[k] = x.slice(0, 1500); else delete d[k]; });
      const nas = String(fd.get('nascimento') || '').trim(); if (nas) { const iso = dataISO(nas); if (!iso) return toast('Confira a data de nascimento (dd/mm/aaaa).', true); d.nascimento = iso; } else delete d.nascimento;
      ['modalidades', 'esportes', 'horario', 'local'].forEach((k) => { const x = fd.getAll(k); if (x.length) d[k] = x; else delete d[k]; });
      if (!(d.modalidades || []).length) return toast('Marque corrida, musculação ou as duas.', true);
      d.disponibilidade = { corrida: fd.getAll('d_corrida').map(Number), forca: fd.getAll('d_forca').map(Number) };
      d.hist = {}; FICHA_HIST.forEach((_, i) => { d.hist['h' + (i + 1)] = fd.get('h' + (i + 1)) || null; });
      d.parq = {}; PARQ.forEach((_, i) => { d.parq['q' + (i + 1)] = fd.get('q' + (i + 1)) || null; });
      btn.disabled = true;
      const { error } = await sb.from('nx_form_respostas').update({ dados: d }).eq('id', r.id);
      if (error) { btn.disabled = false; return toast('Não foi possível salvar a ficha.', true); }
      if (r.aluno_id) { // o cadastro do aluno acompanha
        const mods = (d.modalidades || []).filter((x) => x === 'corrida' || x === 'musculacao');
        const { data: mAnt } = await sb.from('nx_membros').select('disponibilidade').eq('org_id', S.org.id).eq('user_id', r.aluno_id).maybeSingle();
        const upd = { nome: d.nome || undefined, telefone: d.telefone || null, nascimento: d.nascimento || null, objetivo: d.meta || null, sexo: d.sexo === 'feminino' ? 'F' : d.sexo === 'masculino' ? 'M' : null, modalidades: mods.length ? mods : null,
          disponibilidade: { ...((mAnt && mAnt.disponibilidade) || {}), corrida: d.disponibilidade.corrida, forca: d.disponibilidade.forca, ...(d.disp_obs ? { obs: d.disp_obs } : {}) } };
        Object.keys(upd).forEach((k) => upd[k] === undefined && delete upd[k]);
        const { error: e2 } = await sb.from('nx_membros').update(upd).eq('org_id', S.org.id).eq('user_id', r.aluno_id);
        if (e2) console.error(e2);
        const parq = {}; PARQ.forEach((_, i) => { parq['q' + (i + 1)] = d.parq['q' + (i + 1)] || 'nao'; });
        await sb.from('nx_anamneses').update({ parq, parq_positivo: Object.values(parq).includes('sim') }).eq('org_id', S.org.id).eq('aluno_id', r.aluno_id).then(() => {}, () => {});
        S.cache.nomes = null;
      }
      closeSheet(); toast(r.aluno_id ? 'Ficha e cadastro do aluno atualizados.' : 'Ficha atualizada.'); aoSalvar && aoSalvar();
    };
  });
}

async function staffFichaResposta(id) {
  const { data: r } = await sb.from('nx_form_respostas').select('*').eq('id', id).maybeSingle();
  dockStaff();
  if (!r) { $app.innerHTML = `<a class="back" href="#/formularios">${I.back} Formulários</a><div class="empty"><div class="h3">Ficha não encontrada</div></div>`; return; }
  if (!r.visto) { sb.from('nx_form_respostas').update({ visto: true }).eq('id', id).then(() => {}, () => {}); S.cache.fichasNovas = Math.max(0, (S.cache.fichasNovas || 1) - 1); }
  const d = r.dados || {}; const rs = fichaResumo(d);
  const mbr = r.aluno_id ? (await sb.from('nx_membros').select('aprovacao,ativo').eq('org_id', S.org.id).eq('user_id', r.aluno_id).maybeSingle()).data : null;
  const pend = !!(d.email && (!r.aluno_id || (mbr && mbr.aprovacao === 'pendente')));
  const nome = (l, k) => ((l.find((x) => x[0] === k) || [])[1]) || '';
  const idade = d.nascimento ? Math.floor((Date.now() - dia(d.nascimento)) / 31557600000) : null;
  const lin = (t, v) => v ? `<div class="ficha-l"><span>${t}</span><b>${v}</b></div>` : '';
  const lista = (arr, l) => (arr || []).map((k) => esc(l ? nome(l, k) || k : k)).join(', ');
  const tel = telWa(d.telefone); const dp = d.disponibilidade || {};
  const diasT = (l) => (l || []).slice().sort().map((i) => DSEM[i].slice(0, 3)).join(', ');
  $app.innerHTML = `<a class="back" href="#/formularios">${I.back} Formulários</a>
    <div class="card plan-head"><div class="ph-id"><div class="av lg">${esc(initials(d.nome || '?'))}</div><div class="grow" style="min-width:0"><h1 class="h2">${esc(d.nome || 'Sem nome')}</h1><div class="small muted">Ficha enviada ${fmtData(r.criado_em)}${rs.mods ? ' · ' + esc(rs.mods) : ''}</div></div></div>
      ${pend ? `<div class="aviso-acesso"><b>Esta pessoa ainda não tem acesso ao app.</b><span class="small muted">${r.aluno_id ? 'O pedido está esperando a sua aprovação.' : 'Ela mandou a ficha, mas não chegou a pedir o acesso.'}</span><button class="btn block" id="ap-acesso" style="margin-top:12px">${I.mail} Aprovar e enviar acesso por e-mail</button></div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" id="ed-ficha">✎ Editar ficha</button>${r.aluno_id ? `<a class="btn ghost sm" href="#/aluno/${r.aluno_id}">Ver aluno ${I.chev}</a>` : ''}</div></div>
    ${rs.sim.length ? `<div class="card ficha-alerta"><b>${icT(I.alerta, 'warn')}PAR-Q com ${rs.sim.length} resposta${rs.sim.length > 1 ? 's' : ''} SIM</b>${rs.sim.map(([n, q]) => `<p class="small">${n}. ${esc(q)}</p>`).join('')}<p class="tiny dim">Peça liberação médica antes de começar.</p></div>` : ''}
    <div class="grid2" style="margin-top:12px">${tel ? `<a class="btn wa-btn" href="https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${firstName(d.nome || '')}! Aqui é da Nexos Recebemos sua ficha.`)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>` : ''}${r.aluno_id || pend ? '' : `<button class="btn ${tel ? 'ghost' : ''}" id="cadastrar">${I.plus} Cadastrar como aluno</button>`}</div>
    <div class="stack" style="margin-top:16px">
      <div class="card"><span class="eyebrow">Contato</span>${lin('WhatsApp', esc(d.telefone || ''))}${lin('E-mail', esc(d.email || ''))}${lin('Nascimento', d.nascimento ? fmtData(d.nascimento + 'T12:00:00') + (idade != null ? ` · ${idade} anos` : '') : '')}${lin('Sexo', esc(nome([['feminino', 'Feminino'], ['masculino', 'Masculino'], ['nao_informar', 'Prefere não dizer']], d.sexo)))}${lin('Altura e peso', esc([d.altura && d.altura + ' m', d.peso && d.peso + ' kg'].filter(Boolean).join(' · ')))}${lin('Bairro / cidade', esc(d.cidade || ''))}</div>
      <div class="card"><span class="eyebrow">Objetivo</span>${lin('Quer treinar', esc(rs.mods))}${lin('Objetivo', esc(rs.obj))}${lin('Objetivos pessoais', esc(d.meta || ''))}${lin('Prova em vista', esc(d.prova || ''))}</div>
      <div class="card"><span class="eyebrow">Disponibilidade</span>${lin(selo('corrida', 'sm') + ' Corrida', diasT(dp.corrida))}${lin(selo('forca', 'sm') + ' Força', diasT(dp.forca))}${lin('Horário', lista(d.horario, FICHA_HOR))}${lin('Local', lista(d.local, FICHA_LOCAL))}${lin('Comentário', esc(d.disp_obs || ''))}</div>
      <div class="card"><span class="eyebrow">Histórico esportivo</span>${lin('Esportes', lista(d.esportes, FICHA_ESPORTES) + (d.esportes_outros ? ` (${esc(d.esportes_outros)})` : ''))}${lin('Rotina', esc(d.atividade || ''))}${lin('Condicionamento', esc(nome(FICHA_NIVEL, d.nivel)))}${lin('Corrida', esc(nome(FICHA_EXP, d.corrida_exp)))}${lin('Maior distância', esc(d.maior_dist || ''))}${lin('Tempo recente', esc(d.tempo_recente || ''))}${lin('Relógio', esc(d.relogio || ''))}</div>
      <div class="card"><span class="eyebrow">Histórico médico</span>${rs.histSim.length ? rs.histSim.map(([q, v]) => lin(esc(q), v === 'sim' ? '<span style="color:var(--err)">Sim</span>' : 'Não sei')).join('') : lin('Respostas', 'Tudo “não”')}${lin('Observações', esc(d.obs_medica || ''))}${lin('PAR-Q', rs.sim.length ? `<span style="color:var(--err)">${rs.sim.length} sim</span>` : 'Tudo “não”')}</div>
      ${d.origem || d.obs ? `<div class="card"><span class="eyebrow">Outros</span>${lin('Conheceu por', esc(nome(FICHA_ORIGEM, d.origem)))}${lin('Comentário', esc(d.obs || ''))}</div>` : ''}
      <p class="tiny dim">✓ Aceitou o termo de responsabilidade ao enviar.</p>
      <button class="link-btn small" id="apagar" style="color:var(--err);justify-self:start">Apagar esta ficha</button>
    </div>`;
  const cad = document.getElementById('cadastrar');
  if (cad) cad.onclick = () => {
    const saude = [rs.histSim.filter(([, v]) => v === 'sim').map(([q]) => q.replace(/\?$/, '')).join('; '), d.obs_medica, rs.sim.length ? `PAR-Q com ${rs.sim.length} sim` : ''].filter(Boolean).join('. ');
    formPessoa('aluno', { nome: d.nome, email: d.email, telefone: d.telefone, nascimento: d.nascimento, objetivo: d.meta || rs.obj, observacoes: saude, mods: d.modalidades }, async (res) => {
      if (!res || !res.user_id) return;
      await sb.from('nx_form_respostas').update({ aluno_id: res.user_id }).eq('id', id);
      if (dp.corrida || dp.forca) await sb.from('nx_membros').update({ disponibilidade: { corrida: dp.corrida || [], forca: dp.forca || [], obs: d.disp_obs || undefined } }).eq('org_id', S.org.id).eq('user_id', res.user_id);
      // a ficha já vale como anamnese: o aluno não responde o PAR-Q de novo no primeiro acesso
      try {
        const h = d.hist || {}; const simH = (k) => h[k] === 'sim';
        const parq = {}; PARQ.forEach((_, i) => { parq['q' + (i + 1)] = (d.parq || {})['q' + (i + 1)] || 'nao'; });
        const resp = { origem: 'ficha_entrada', objetivo: d.objetivo, objetivo_txt: d.meta, experiencia: { sedentario: 'parado', iniciante: 'iniciante', intermediario: 'intermediario', avancado: 'avancado', profissional: 'avancado' }[d.nivel],
          atividades: [lista(d.esportes, FICHA_ESPORTES), d.atividade].filter(Boolean).join(' · ') || undefined, dias: String(new Set([...(dp.corrida || []), ...(dp.forca || [])]).size || '') || undefined, prova: d.prova,
          doencas: [], doencas_txt: [rs.histSim.map(([q, v]) => q.replace(/\?$/, '') + (v === 'naosei' ? ' (não sabe)' : '')).join('; '), d.obs_medica].filter(Boolean).join('. ') || undefined,
          cirurgias: simH('h4') ? 'Sim (ver detalhes)' : undefined, alergias: simH('h5') ? 'Sim (ver detalhes)' : undefined, lesoes: simH('h6') ? 'Sim (ver detalhes)' : undefined, medicamentos: simH('h7') ? 'Sim (ver detalhes)' : undefined, dores: simH('h9') ? 'Sim (ver detalhes)' : undefined, fuma: h.h8 === 'sim' ? 'sim' : h.h8 === 'nao' ? 'nao' : undefined };
        Object.keys(resp).forEach((k) => resp[k] === undefined && delete resp[k]);
        const { data: ja } = await sb.from('nx_anamneses').select('id').eq('org_id', S.org.id).eq('aluno_id', res.user_id).maybeSingle();
        if (!ja) await sb.from('nx_anamneses').insert({ org_id: S.org.id, aluno_id: res.user_id, parq, parq_positivo: Object.values(parq).includes('sim'), respostas: resp, visto_treinador: true });
      } catch (e2) { console.error(e2); }
    });
  };
  document.getElementById('ed-ficha').onclick = () => editarFicha(r, () => staffFichaResposta(id));
  const apA = document.getElementById('ap-acesso');
  if (apA) apA.onclick = async () => {
    apA.disabled = true; apA.textContent = 'Criando o acesso…';
    try {
      let alunoId = r.aluno_id;
      if (!alunoId) { // cria o pedido como se a pessoa tivesse pedido no fim da ficha
        const { data: fm } = await sb.from('nx_formularios').select('token').eq('id', r.form_id).maybeSingle();
        if (!fm) throw new Error('O link desta ficha não existe mais.');
        await chamarForm({ acao: 'criar_acesso', token: fm.token, resposta: r.id });
        const { data: r2 } = await sb.from('nx_form_respostas').select('aluno_id').eq('id', r.id).maybeSingle(); alunoId = r2 && r2.aluno_id;
        if (!alunoId) throw new Error('Não foi possível criar o acesso.');
      }
      const { data: res, error: er } = await sb.functions.invoke('nx-email', { body: { org_id: S.org.id, acao: 'aprovar', aluno_id: alunoId } });
      if (er || !res || res.erro) throw new Error((res && res.erro) || 'Não foi possível aprovar agora.');
      S.cache.nomes = null; S.cache.pendentes = Math.max(0, (S.cache.pendentes || 1) - 1);
      if (res.enviado) toast(`Acesso aprovado! O login foi para ${res.email}.`);
      else if (res.senha) mostrarCredenciais({ nome: d.nome, telefone: d.telefone, email: res.email, senha: res.senha }, false, true, 'acesso');
      else toast('Acesso aprovado! Ela entra com a senha que já tem.');
      staffFichaResposta(id);
    } catch (e) { apA.disabled = false; apA.innerHTML = `${I.mail} Aprovar e enviar acesso por e-mail`; toast(e.message, true); }
  };
  document.getElementById('apagar').onclick = async () => { if (!confirm('Apagar esta ficha? Não dá para desfazer.')) return; await sb.from('nx_form_respostas').delete().eq('id', id); location.hash = '#/formularios'; };
}

/* ---------- monitoramento de erros: todo erro do app chega para a equipe em Mais → Erros do app ---------- */
const NX_VERSAO = '2026.11.03';
const ERROS_ENVIADOS = new Set(); let errosN = 0;
function reportarErro(err, onde) {
  try {
    if (window.NX_DEMO) return;
    const msg = String((err && (err.message || (typeof err.reason === 'string' && err.reason))) || err || '').slice(0, 500);
    // ruído de internet e de navegador que não é defeito do app
    if (!msg || /ResizeObserver loop|^Script error\.?$|AbortError|Load failed|NetworkError|Failed to fetch|cancelad|The user aborted|JWT expired|refresh_token/i.test(msg)) return;
    const chave = msg + '|' + (onde || '');
    if (ERROS_ENVIADOS.has(chave) || ++errosN > 15) return; // o mesmo erro vai uma vez por sessão; no máximo 15
    ERROS_ENVIADOS.add(chave);
    sb.rpc('nx_registrar_erro', { p_org: S.org ? S.org.id : null, p_msg: msg, p_stack: `${onde ? '[' + onde + ']\n' : ''}${String((err && err.stack) || '').slice(0, 3800)}`,
      p_url: (location.hash || '#/').slice(0, 300), p_area: AREA, p_ua: navigator.userAgent, p_versao: NX_VERSAO }).then(() => {}, () => {});
  } catch {}
}
window.addEventListener('error', (e) => { if (e && (e.error || e.message)) reportarErro(e.error || e.message, 'erro na tela'); });
window.addEventListener('unhandledrejection', (e) => reportarErro(e && e.reason, 'ação que falhou'));
// resumo em português dos erros mais comuns do navegador (o texto original fica nos detalhes)
const erroPT = (m) => {
  m = String(m || ''); let x;
  if ((x = m.match(/(?:Cannot read propert(?:y|ies) of (?:undefined|null)(?: \(reading '([^']+)'\))?|undefined is not an object|null is not an object)/))) return `Faltou uma informação que a tela esperava${x[1] ? ` (“${x[1]}”)` : ''}`;
  if (/is not a function/.test(m)) return 'Uma parte do app tentou fazer algo que não existe';
  if (/is not defined/.test(m)) return 'Uma parte do app não foi carregada';
  if (/row-level security|permission denied|42501/i.test(m)) return 'O banco de dados recusou a gravação (permissão)';
  if (/duplicate key|23505/i.test(m)) return 'Tentou salvar algo que já existia';
  if (/QuotaExceeded|quota/i.test(m)) return 'A memória do navegador do aparelho está cheia';
  if (/timeout|timed out/i.test(m)) return 'Demorou demais para responder';
  if (/NotAllowedError|permission/i.test(m)) return 'O aparelho não deu permissão (câmera, notificação ou arquivo)';
  if (/JSON/.test(m)) return 'Recebeu um dado em formato errado';
  return '';
};
const aparelhoTxt = (ua) => {
  ua = ua || ''; const so = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Outro';
  const nav = /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'navegador';
  return `${so} · ${nav}`;
};
async function staffErros() {
  dockStaff(); loading();
  const [{ data: erros, error }, { data: membros }] = await Promise.all([
    sb.from('nx_erros').select('*').eq('org_id', S.org.id).order('resolvido').order('ultimo_em', { ascending: false }).limit(100),
    sb.from('nx_membros').select('user_id,nome').eq('org_id', S.org.id),
  ]);
  if (error) throw error;
  const nomes = Object.fromEntries((membros || []).map((m) => [m.user_id, m.nome]));
  const abertos = (erros || []).filter((e) => !e.resolvido), resolvidos = (erros || []).filter((e) => e.resolvido);
  const quando = (d) => `${fmtData(d)} às ${fmtHora(d)}`;
  const item = (e) => {
    const pessoas = (e.usuarios || []).map((u) => nomes[u] || 'alguém de fora').slice(0, 4);
    return `<div class="card erro-it ${e.resolvido ? 'ok' : ''}" data-id="${e.id}">
      <div class="erro-top"><span class="erro-ic ${e.resolvido ? "ok" : ""}">${e.resolvido ? I.okc : I.alerta}</span><div class="grow"><b class="erro-msg">${esc(erroPT(e.msg) || e.msg)}</b>
        <div class="small muted">${e.vezes}× · ${pessoas.length ? esc(pessoas.join(', ')) + ((e.usuarios || []).length > 4 ? ` e mais ${(e.usuarios || []).length - 4}` : '') : 'sem login'} · área do ${e.area === 'treinador' ? 'treinador' : 'aluno'}</div>
        <div class="tiny dim">Última vez ${quando(e.ultimo_em)}${e.vezes > 1 ? ` · primeira ${quando(e.primeiro_em)}` : ''} · tela ${esc(e.url || '#/')} · ${esc(aparelhoTxt(e.ua))}</div></div></div>
      <details class="erro-det"><summary class="tiny">Detalhes técnicos</summary><pre>${esc(e.msg)}${e.stack ? '\n\n' + esc(e.stack) : ''}</pre></details>
      <div class="erro-acoes"><button type="button" class="link-btn small" data-copiar-erro="${e.id}">${I.copy || ''}Copiar erro</button>${e.resolvido ? `<button type="button" class="link-btn small" data-reabrir="${e.id}">Reabrir</button>` : `<button type="button" class="btn sm" data-resolver="${e.id}">Resolvido</button>`}<button type="button" class="link-btn small" data-apagar-erro="${e.id}">Apagar</button></div></div>`;
  };
  $app.innerHTML = `<p class="eyebrow">Mais</p><h1 class="h1">Erros do app</h1>
    <p class="muted small" style="margin-top:6px">Quando algo dá errado no app de um aluno ou de um treinador, o erro aparece aqui sozinho, com quem pegou, em que tela e em qual aparelho. Erros iguais se juntam num só.</p>
    <div class="section"><div class="section-h"><h2 class="h2">Abertos${abertos.length ? ` <span class="tag acc">${abertos.length}</span>` : ''}</h2></div>
      ${abertos.length ? `<div class="stack">${abertos.map(item).join('')}</div>` : `<div class="empty"><div class="h3">Nenhum erro aberto</div><p class="small muted">Tudo funcionando para os alunos.</p></div>`}</div>
    ${resolvidos.length ? `<div class="section"><div class="section-h"><h2 class="h2">Resolvidos</h2></div><div class="stack">${resolvidos.slice(0, 30).map(item).join('')}</div></div>` : ''}`;
  $app.onclick = async (ev) => {
    const cp = ev.target.closest('[data-copiar-erro]');
    if (cp) {
      const e = (erros || []).find((x) => x.id === Number(cp.dataset.copiarErro)); if (!e) return;
      const pessoas = (e.usuarios || []).map((u) => nomes[u] || 'alguém de fora');
      const texto = [`Erro no app Nexos — pode corrigir?`, '', `Resumo: ${erroPT(e.msg) || e.msg}`, `Mensagem: ${e.msg}`, `Tela: ${e.url || '#/'} (área do ${e.area === 'treinador' ? 'treinador' : 'aluno'})`,
        `Aparelho: ${aparelhoTxt(e.ua)} — ${e.ua || 'desconhecido'}`, `Aconteceu ${e.vezes}× com ${pessoas.length ? pessoas.join(', ') : 'quem estava sem login'}`,
        `Primeira vez: ${quando(e.primeiro_em)} · Última: ${quando(e.ultimo_em)} · Versão ${e.versao || '?'} · Código do erro #${e.id}`, '', 'Detalhes técnicos:', e.stack || '(sem detalhes)'].join('\n');
      try { await navigator.clipboard.writeText(texto); }
      catch { const t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
      return toast('Copiado! Cole na conversa com o Claude.');
    }
    const r = ev.target.closest('[data-resolver],[data-reabrir],[data-apagar-erro]'); if (!r) return;
    const id = Number(r.dataset.resolver || r.dataset.reabrir || r.dataset.apagarErro);
    if (r.dataset.apagarErro && !confirm('Apagar este erro da lista?')) return;
    const q = r.dataset.apagarErro ? sb.from('nx_erros').delete().eq('id', id) : sb.from('nx_erros').update({ resolvido: !!r.dataset.resolver }).eq('id', id);
    const { error: er } = await q; if (er) return toast('Não foi possível salvar.', true);
    S.cache.errosAbertos = null; toast(r.dataset.resolver ? 'Marcado como resolvido.' : r.dataset.reabrir ? 'Erro reaberto.' : 'Erro apagado.'); staffErros();
  };
}

if (window.NX_DEMO) window.__nx = { loading, toast, garminItem };
iniciar();
})();
