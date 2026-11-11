/* Nexos App · Configuração, tema, utilidades, painel (sheet), navegação (rotas) e sessão.
   Parte 1 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';
// versão publicada do código (scripts/versao.sh troca a cada commit; igual à de app/versao.json)
const NX_BUILD = 'v20261111010020';

const SUPABASE_URL = 'https://gbcshtmesawpokuwiaxb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY3NodG1lc2F3cG9rdXdpYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MDg2MjYsImV4cCI6MjEwODk4NDYyNn0.ZR4vHBDAa_yMA8pSCWUriKAoh8OsEUKXO7WgZnR89Ak';

// veio pelo link de "esqueci minha senha"? (o endereço traz type=recovery; o login lê e limpa o endereço logo depois)
const NX_RECUPERACAO = /type=recovery/.test(location.hash + location.search);
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'nexos-app-auth' },
});

const S = { user: null, me: null, org: null, staff: false, cache: {} };
const $app = document.getElementById('app');
const $dock = document.getElementById('dock');

/* ---------- tema ---------- */
const LOGO = {
  s: () => (document.documentElement.dataset.tema === 'escuro' ? 'icons/simbolo.svg' : 'icons/simbolo-escuro.svg'),
  w: () => (document.documentElement.dataset.tema === 'escuro' ? 'icons/wordmark.svg' : 'icons/wordmark-escuro.svg'),
};
function aplicarTema(t) {
  document.documentElement.dataset.tema = t;
  store.set('nx-tema', t);
  const m = document.querySelector('meta[name=theme-color]');
  if (m)
    m.content =
      t === 'escuro'
        ? getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#050c1c'
        : '#f3f6fb';
}
// paletas de cor: mudam os destaques e os cards escuros; o fundo (claro ou escuro) continua sendo escolhido à parte
const PALETAS = [
  ['nexos', 'Nexos', '#46d6ff', '#0a1a42'],
  ['rosa', 'Rosa', '#ff7ab6', '#3d0b24'],
  ['vermelho', 'Vermelho', '#ff7a7a', '#3f080c'],
  ['laranja', 'Laranja', '#ffb057', '#3b1805'],
  ['dourado', 'Dourado', '#ffd166', '#302304'],
  ['verde', 'Verde', '#5ef2a0', '#082b18'],
  ['turquesa', 'Turquesa', '#5eead4', '#072a28'],
  ['roxo', 'Roxo', '#b794ff', '#1e0b45'],
  ['lilas', 'Lilás', '#e0a8ff', '#280a3e'],
  ['grafite', 'Grafite', '#cbd5e1', '#151c26'],
];
// cores da paleta atual em hex (para SVG e canvas, que não leem variáveis do CSS)
const corP = () => {
  const cs = getComputedStyle(document.documentElement),
    v = (k, d) => cs.getPropertyValue(k).trim() || d;
  return {
    p1: v('--p1', '#46d6ff'),
    p2: v('--p2', '#1a7fe6'),
    p3: v('--p3', '#2f6bff'),
    h1: v('--h1', '#0d2a66'),
    h2: v('--h2', '#0a1a42'),
    h3: v('--h3', '#071230'),
    h4: v('--h4', '#0f2a5c'),
  };
};
const misturaHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)),
    pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    '#' +
    pa
      .map((x, i) =>
        Math.round(x + (pb[i] - x) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
function aplicarPaleta(k) {
  if (!PALETAS.some((x) => x[0] === k)) k = 'nexos';
  document.documentElement.dataset.paleta = k;
  store.set('nx-paleta', k);
  aplicarTema(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro');
}
/* ---------- utilidades ---------- */
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const initials = (n) =>
  String(n || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
const firstName = (n) =>
  String(n || '')
    .trim()
    .split(/\s+/)[0] || '';
const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const fmtData = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const fmtHora = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
// dias de calendário (meia-noite a meia-noite, no horário do aparelho): ontem às 18h é "ontem", mesmo que faça menos de 24 h
const diasDesde = (d) => {
  const a = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? d + 'T12:00:00' : d),
    h = new Date();
  if (isNaN(a)) return 0;
  return Math.round(
    (new Date(h.getFullYear(), h.getMonth(), h.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) /
      86400000,
  );
};
const quando = (d) => {
  const n = diasDesde(d);
  return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
};
const minutos = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
const store = {
  get(k, def) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};
const rpeCor = (n) =>
  n == null ? 'var(--dim)' : n <= 3 ? '#3ddc97' : n <= 6 ? '#46d6ff' : n <= 8 ? '#ffcf5c' : '#ff8a8a';
const rpeTxt = (n) =>
  n == null ? '' : n <= 2 ? 'Muito leve' : n <= 4 ? 'Leve' : n <= 6 ? 'Moderado' : n <= 8 ? 'Intenso' : 'Máximo';
// escala de esforço percebido (CR-10 de Borg, usada na PSE da sessão de Foster)
const ESF_ESC = [
  ['Repouso', 'Nenhum esforço.'],
  ['Muito, muito leve', 'Quase nada. Como uma caminhada bem tranquila.'],
  ['Muito leve', 'Bem fácil. Daria para manter por horas.'],
  ['Leve', 'Confortável. Respiração tranquila, dá para conversar normalmente.'],
  ['Leve a moderado', 'Começou a esquentar, mas ainda dá para conversar sem dificuldade.'],
  ['Moderado', 'Respiração mais forte. Exigiu esforço, mas foi controlado.'],
  ['Moderado a forte', 'Cansativo. Precisou de concentração para manter.'],
  ['Forte', 'Difícil. Conversar ficaria complicado.'],
  ['Muito forte', 'Bem desconfortável. Sobrou pouca coisa no fim.'],
  ['Quase máximo', 'No limite. Quase não sobrou nada.'],
  ['Máximo', 'O maior esforço possível. Não dava para fazer mais.'],
];
// cores da escala no azul da Nexos: do ciano claro (leve) ao azul profundo (máximo)
const ESF_COR = new Proxy([], {
  get: (t, k) => {
    const n = Number(k);
    if (!Number.isInteger(n)) return t[k];
    const c = corP(),
      claro = misturaHex(c.p1, '#ffffff', 0.25);
    return n <= 5 ? misturaHex(claro, c.p2, n / 5) : misturaHex(c.p2, misturaHex(c.h1, c.p3, 0.35), (n - 5) / 5);
  },
});
// rostinho desenhado (sem emoji): boca, olhos e sobrancelhas mudam com o esforço
function rostoEsf(n) {
  const c = n == null ? 'var(--dim)' : ESF_COR[n];
  if (n == null)
    return `<svg viewBox="0 0 100 100" class="rosto"><circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="6 9" stroke-linecap="round"/><circle cx="36" cy="42" r="4.5" fill="${c}"/><circle cx="64" cy="42" r="4.5" fill="${c}"/><path d="M36 66 H64" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`;
  const curva = [18, 16, 14, 11, 7, 3, -1, -5, -9, -12, -14][n];
  const olhos =
    n <= 1
      ? '<path d="M28 44 Q36 36 44 44 M56 44 Q64 36 72 44" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
      : n >= 9
        ? '<path d="M28 36 L42 43 L28 50 M72 36 L58 43 L72 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        : `<circle cx="36" cy="43" r="${n >= 7 ? 4.5 : 5.5}" fill="#fff"/><circle cx="64" cy="43" r="${n >= 7 ? 4.5 : 5.5}" fill="#fff"/>`;
  const sob =
    n >= 6 && n <= 8
      ? `<path d="M27 34 L43 ${30 - (n - 6) * 2}" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M73 34 L57 ${30 - (n - 6) * 2}" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`
      : '';
  const boca =
    n === 10
      ? '<rect x="33" y="60" width="34" height="16" rx="7" fill="#fff"/><path d="M33 68 H67 M44 60 V76 M56 60 V76" stroke="' +
        c +
        '" stroke-width="2.5"/>'
      : n === 9
        ? '<ellipse cx="50" cy="69" rx="11" ry="8" fill="#fff"/>'
        : `<path d="M30 ${66 - Math.max(0, curva) / 3} Q50 ${66 + curva} 70 ${66 - Math.max(0, curva) / 3}" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>`;
  const suor = n >= 7 ? `<path d="M82 22 q-6 9 0 12 q6-3 0-12z" fill="#bfefff" opacity="${n >= 9 ? 1 : 0.8}"/>` : '';
  return `<svg viewBox="0 0 100 100" class="rosto"><circle cx="50" cy="50" r="46" fill="${c}"/><circle cx="50" cy="50" r="46" fill="url(#rosto-luz)"/>
    <defs><radialGradient id="rosto-luz" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    ${sob}${olhos}${boca}${suor}</svg>`;
}
function esforcoHTML(v) {
  return `<div class="esf" data-v="${v ?? ''}">
    <div class="esf-rosto" id="esf-rosto">${rostoEsf(v)}</div>
    <div class="esf-niv"><b id="esf-num">${v ?? ''}</b><span id="esf-niv">${v == null ? 'Arraste para marcar' : ESF_ESC[v][0]}</span></div>
    <p class="esf-desc" id="esf-desc">${v == null ? 'De 0 (repouso) a 10 (o máximo que você aguenta).' : ESF_ESC[v][1]}</p>
    <input type="range" class="esf-range" min="0" max="10" step="1" value="${v ?? 5}" aria-label="Esforço percebido de 0 a 10">
    <div class="esf-marcas">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-n="${n}" aria-label="${n}">${n}</button>`).join('')}</div>
    <div class="esf-pontas"><span>Repouso</span><span>Máximo</span></div>
  </div>`;
}
function bindEsforco(root, onChange) {
  const box = root.querySelector('.esf');
  if (!box) return;
  const rg = box.querySelector('.esf-range'),
    num = box.querySelector('#esf-num'),
    rosto = box.querySelector('#esf-rosto');
  const set = (n, vib) => {
    n = Math.max(0, Math.min(10, Math.round(n)));
    rg.value = n;
    box.classList.add('tem');
    box.style.setProperty('--esf', ESF_COR[n]);
    box.style.setProperty('--p', `${n * 10}%`);
    if (num.textContent !== String(n)) {
      num.textContent = n;
      rosto.innerHTML = rostoEsf(n);
      rosto.classList.remove('pop');
      void rosto.offsetWidth;
      rosto.classList.add('pop');
    }
    box.querySelector('#esf-niv').textContent = ESF_ESC[n][0];
    box.querySelector('#esf-desc').textContent = ESF_ESC[n][1];
    box.querySelectorAll('.esf-marcas button').forEach((b) => b.classList.toggle('on', +b.dataset.n === n));
    if (vib && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
    onChange(n);
  };
  rg.oninput = () => set(+rg.value, true);
  box.querySelector('.esf-marcas').onclick = (e) => {
    const b = e.target.closest('[data-n]');
    if (b) set(+b.dataset.n, true);
  };
  if (box.dataset.v !== '') set(+box.dataset.v, false);
}
function gerarSenha() {
  const a = 'abcdefghjkmnpqrstuvwxyz',
    d = '23456789';
  const r = (s) => s[Math.floor(Math.random() * s.length)];
  return 'nx' + r(a) + r(a) + r(a) + r(d) + r(d) + r(d) + r(d);
}
const AREA = window.NX_AREA === 'treinador' ? 'treinador' : 'aluno';
// Na Área do treinador a página usa <base href="/app/">; sem isto, links "#/..." levariam para a Área do aluno.
if (document.querySelector('base')) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || a.target || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const h = a.getAttribute('href');
    if (location.hash === h) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = h;
  });
}
const loginURL = () => {
  try {
    return new URL('.', document.baseURI).href;
  } catch {
    return location.origin + location.pathname.replace(/[^/]*$/, '');
  }
};

const I = {
  alerta:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17h.01"/></svg>',
  espera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  bolo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M5 20v-6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V20"/><path d="M5 15.5c1.4 1 2.8 1 4.2 0s2.8-1 4.2 0 2.8 1 4.2 0"/><path d="M12 11.5V8M12 5.5v.01"/></svg>',
  saude:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-4 3 8 2-4h7"/></svg>',
  caixa:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13 6.5 5h11L20 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20"/></svg>',
  okc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/></svg>',
  raio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
  paste:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5h6v3H9z"/><path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/></svg>',
  ficha:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="18" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.7c2 .8 3.2 2.7 3.6 5.3"/></svg>',
  feed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z"/></svg>',
  lib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  timer:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  money:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
  run: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16.4" cy="3.9" r="2.2" fill="currentColor" stroke="none"/><path d="M14.8 7.4 12.7 13"/><path d="M14.5 8.1 11.2 8.1 9.3 10.6"/><path d="M14.5 8.1 16.6 11.4 19.6 10.3"/><path d="M12.7 13 15.6 16.3 13.6 20.6"/><path d="M12.7 13 10.5 16.1 7.2 14.4"/><path d="M3.2 7.4h3.6M2 10.4h4M3.2 13.4h2.6" stroke-width="2"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  watch:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 9.5V12l1.5 1.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  today:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.1z"/></svg>',
};
const icCorr = () => I.run;
// selos sólidos da marca para corrida e força (no lugar de emoji)
const HALTER_S =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="1.2" y="9" width="2.8" height="6" rx="1.1"/><rect x="4.6" y="5.6" width="3.6" height="12.8" rx="1.4"/><rect x="15.8" y="5.6" width="3.6" height="12.8" rx="1.4"/><rect x="20" y="9" width="2.8" height="6" rx="1.1"/><rect x="8" y="10.5" width="8" height="3" rx="1"/></svg>';
const modSelos = (m) => {
  const md = m && Array.isArray(m.modalidades) && m.modalidades.length ? m.modalidades : ['corrida', 'musculacao'];
  return `<span class="mod-selos" title="${md.includes('corrida') && md.includes('musculacao') ? 'Corrida e força' : md.includes('corrida') ? 'Só corrida' : 'Só força'}">${md.includes('corrida') ? selo('corrida', 'sm') : ''}${md.includes('musculacao') ? selo('forca', 'sm') : ''}</span>`;
};
const selo = (k, extra = '') =>
  `<span class="selo ${k === 'corrida' ? 'selo-c' : 'selo-f'} ${extra}" ${k === 'corrida' ? 'title="Corrida"' : 'title="Força"'}>${k === 'corrida' ? I.run : HALTER_S}</span>`;
const imgURL = (p) => (/^https?:/.test(p) ? p : 'ex/' + p);
function exFig(ex, cls = '') {
  const im = (ex && ex.imagens) || [];
  if (!im.length && ex && ehVideoArquivo(ex.video_url))
    return `<div class="exfig ${cls}"><video src="${esc(ex.video_url.split('#')[0])}#t=0.5" muted playsinline preload="metadata" aria-hidden="true"></video></div>`;
  if (!im.length)
    return `<div class="exfig empty ${cls}" aria-hidden="true"><span>${esc((ex && ex.grupo) || '')}</span></div>`;
  return `<div class="exfig ${im.length > 1 ? 'anim' : ''} ${cls}">${im
    .slice(0, 2)
    .map((p, k) => `<img src="${esc(imgURL(p))}" alt="${k ? '' : esc(ex.nome)}" loading="lazy" decoding="async">`)
    .join('')}</div>`;
}
const passosHTML = (l) => `<ol class="steps">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
const instrCache = {};
async function hidratarInstrucoes(root = document) {
  for (const el of root.querySelectorAll('[data-instr-ref]')) {
    const ref = el.dataset.instrRef;
    el.removeAttribute('data-instr-ref');
    try {
      if (!instrCache[ref])
        instrCache[ref] = fetch(imgURL(ref + '/info.json')).then((r) => (r.ok ? r.json() : { instrucoes: [] }));
      const d = await instrCache[ref];
      el.innerHTML =
        d.instrucoes && d.instrucoes.length ? passosHTML(d.instrucoes) : '<p class="dim">Sem instruções.</p>';
    } catch {
      el.innerHTML = '<p class="dim">Não foi possível carregar as instruções.</p>';
    }
  }
}
// vídeo em arquivo (mp4/mov/webm ou do armazenamento) toca dentro do app; link de YouTube etc. abre fora
const ehVideoArquivo = (u) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u || '') || /\/storage\/v1\/object\//.test(u || '');
const exVideoHTML = (ex) =>
  ex && ex.video_url && ehVideoArquivo(ex.video_url)
    ? `<div class="ex-vid">${/#loop$/.test(ex.video_url) ? `<video src="${esc(ex.video_url.split('#')[0])}" autoplay muted loop playsinline preload="metadata" disablepictureinpicture></video>` : `<video src="${esc(ex.video_url)}" controls playsinline ${ex.com_audio ? '' : 'muted'} loop preload="none"></video>`}${ex.video_credito ? `<p class="tiny dim">Vídeo: ${esc(ex.video_credito).replace('CC BY-SA 4.0', '<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt_BR" target="_blank" rel="noopener" class="dim">CC BY-SA 4.0</a>')}</p>` : ''}</div>`
    : '';
function exDetalhe(ex) {
  const passos =
    ex.instrucoes && ex.instrucoes.length
      ? passosHTML(ex.instrucoes)
      : ex.ref_externa
        ? `<div data-instr-ref="${esc(ex.ref_externa)}"><p class="dim small">Carregando instruções…</p></div>`
        : ex.descricao
          ? `<p>${esc(ex.descricao)}</p>`
          : '<p class="dim">Sem instruções.</p>';
  const mus = [
    ...(ex.musculos || []).map((m) => `<span class="tag acc">${esc(m)}</span>`),
    ...(ex.musculos_sec || []).map((m) => `<span class="tag">${esc(m)}</span>`),
  ].join('');
  return `${exVideoHTML(ex)}${passos}${mus ? `<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${mus}</div>` : ''}${ex.equipamento ? `<p class="tiny dim" style="margin-top:8px">Equipamento: ${esc(ex.equipamento)}${ex.nivel ? ' · Nível: ' + esc(ex.nivel) : ''}</p>` : ''}`;
}
const slashes = '<span class="slashes" aria-hidden="true"><i></i><i></i><i></i></span>';

let toastT;
const vibrar = (p) => {
  try {
    if (navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(p);
  } catch {}
};
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  // sucesso ganha um check animado e uma vibração curta; erro vibra diferente; "Enviando…" fica neutro
  const neutro = !err && /…$/.test(String(msg));
  t.innerHTML = `${neutro ? '' : `<span class="toast-ic">${err ? I.alerta : I.check}</span>`}<span>${esc(String(msg))}</span>`;
  t.className = 'toast show' + (err ? ' err' : '') + (neutro ? ' neutro' : '');
  if (!neutro) vibrar(err ? [40, 60, 40] : 18);
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.className = 'toast' + (err ? ' err' : '')), 2800);
}

/* ---------- painel (sheet) ---------- */
const $sheet = document.getElementById('sheet');
const $sheetBody = document.getElementById('sheet-body');
function openSheet(html, onMount) {
  if ($sheet.hidden) {
    try {
      history.pushState({ ...(history.state || {}), nxPainel: 1 }, '');
    } catch {}
  }
  $sheetBody.innerHTML = html;
  $sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  onMount && onMount($sheetBody);
  const f = $sheetBody.querySelector('[autofocus]');
  if (f) setTimeout(() => f.focus(), 250);
}
function closeSheet(semVoltar) {
  const estava = !$sheet.hidden;
  $sheet.hidden = true;
  $sheetBody.innerHTML = '';
  document.body.style.overflow = '';
  const sh = $sheet.querySelector('.sheet');
  if (sh) sh.style.transform = '';
  // o painel abriu um passo no histórico: fechar pelo X tira esse passo (o "voltar" do celular também fecha)
  if (estava && !semVoltar && history.state && history.state.nxPainel) {
    voltaDoPainel = true;
    history.back();
  }
  if (estava) document.dispatchEvent(new Event('nx:painel-fechado'));
}
// o "voltar" que o próprio closeSheet dispara não pode fechar um painel novo aberto logo em seguida (ex.: fechar o aviso e abrir o check-in)
let voltaDoPainel = false;
window.addEventListener('popstate', () => {
  if (voltaDoPainel) {
    voltaDoPainel = false;
    return;
  }
  if (!$sheet.hidden) closeSheet(true);
  // passo de um painel que já foi fechado (ex.: saiu da tela pelo painel): o voltar pula direto para a tela anterior
  else if (history.state && history.state.nxPainel) history.back();
});
// arrastar o painel para baixo fecha (quando ele está no topo)
(() => {
  const sh = $sheet.querySelector('.sheet');
  if (!sh) return;
  let y0 = null,
    dy = 0;
  sh.addEventListener(
    'touchstart',
    (e) => {
      if (
        sh.scrollTop > 0 ||
        e.touches.length > 1 ||
        e.target.closest('canvas,input,textarea,select,.card-gal,.chips')
      ) {
        y0 = null;
        return;
      }
      y0 = e.touches[0].clientY;
      dy = 0;
    },
    { passive: true },
  );
  sh.addEventListener(
    'touchmove',
    (e) => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0) {
        sh.style.transition = 'none';
        sh.style.transform = innerWidth >= 700 ? `translate(-50%, calc(-50% + ${dy}px))` : `translate(-50%, ${dy}px)`;
      }
    },
    { passive: true },
  );
  sh.addEventListener('touchend', () => {
    if (y0 == null) return;
    sh.style.transition = '';
    if (dy > 110) closeSheet();
    else sh.style.transform = '';
    y0 = null;
  });
})();
$sheet.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeSheet();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$sheet.hidden) closeSheet();
});

async function chamarFuncao(body) {
  const { data, error } = await sb.functions.invoke('nx-alunos', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let msg = 'Não foi possível concluir. Tente de novo.';
    try {
      const j = await error.context.json();
      if (j?.erro) msg = j.erro;
    } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}

// ícone dentro do texto (no lugar de emoji) e ícone grande de estado
const icT = (svg, cls = '') => `<i class="ic-t ${cls}">${svg}</i>`;
const estIc = (svg, tom = 'acc') => `<div class="est-ic t-${tom}">${svg}</div>`;

/* ---------- telas vazias: ícone do assunto em cima do texto (automático) ---------- */
const EMPTY_IC = [
  [/mensag|conversa/i, 'feed'],
  [/prova/i, 'flag'],
  [/avalia/i, 'ficha'],
  [/mensalid|pagament/i, 'money'],
  [/atleta|aluno/i, 'users'],
  [/ficha|anamnese/i, 'ficha'],
  [/carga/i, 'up'],
  [/ritmo|pace/i, 'watch'],
  [/exerc/i, 'lib'],
  [/corrida/i, 'run'],
  [/treino/i, 'cal'],
  [/encontrad/i, 'search'],
];
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
  const rolavel = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 4) {
        const ox = getComputedStyle(n).overflowX;
        if (ox === 'auto' || ox === 'scroll') return n;
      }
    }
    return null;
  };
  let arr = null;
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('input,textarea,select,.mod,[data-mod],[draggable="true"]')) return;
    const n = rolavel(e.target);
    if (!n) return;
    arr = { n, x: e.clientX, sl: n.scrollLeft, moveu: false };
  });
  document.addEventListener('mousemove', (e) => {
    if (!arr) return;
    const dx = e.clientX - arr.x;
    if (!arr.moveu && Math.abs(dx) < 6) return;
    arr.moveu = true;
    arr.n.scrollLeft = arr.sl - dx;
    arr.n.classList.add('arrastando-x');
    e.preventDefault();
  });
  document.addEventListener('mouseup', () => {
    if (!arr) return;
    const a = arr;
    arr = null;
    a.n.classList.remove('arrastando-x');
    if (a.moveu) {
      const k = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      document.addEventListener('click', k, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', k, { capture: true }), 0);
    }
  });
  document.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.shiftKey) return;
      const n = rolavel(e.target);
      if (!n || n.scrollHeight > n.clientHeight + 4) return;
      const fim = e.deltaY > 0 ? n.scrollLeft + n.clientWidth >= n.scrollWidth - 1 : n.scrollLeft <= 0;
      if (fim) return;
      n.scrollLeft += e.deltaY;
      e.preventDefault();
    },
    { passive: false },
  );
})();

/* ---------- a página não dá zoom com os dedos ---------- */
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1 && !e.target.closest('#cd-cv')) e.preventDefault();
  },
  { passive: false },
);

/* ---------- Sistema Nexos (só no computador, área do treinador) ---------- */
let hubAnim = null;
function fecharHub() {
  const h = document.getElementById('nx-hub');
  if (h) h.remove();
  if (hubAnim) {
    cancelAnimationFrame(hubAnim.raf);
    removeEventListener('resize', hubAnim.rs);
    hubAnim = null;
  }
}
function staffSistema() {
  fecharHub();
  $dock.hidden = true;
  $app.innerHTML = '';
  const card = (h, ic, t, d, n) =>
    `<a class="hub-card" href="${h}" style="--d:${300 + n * 120}ms"><span class="hub-num">0${n + 1}</span><span class="hub-ic">${ic}</span><span class="hub-tx"><b>${t}</b><small>${d}</small></span><span class="hub-seta">${I.chev}</span><i class="hub-luz"></i></a>`;
  const hub = document.createElement('div');
  hub.id = 'nx-hub';
  hub.innerHTML = `<canvas id="hub-cv"></canvas><div class="hub-grade"></div><div class="hub-brilho"></div><div class="hub-scan"></div>
    <div class="hub-lado"><div class="hub-orb">
      <span class="hub-anel a1"></span><span class="hub-anel a2"></span><span class="hub-anel a3"></span><span class="hub-radar"></span>
      <span class="hub-sat s1"></span><span class="hub-sat s2"></span><span class="hub-sat s3"></span>
      <span class="hub-onda"></span><span class="hub-onda o2"></span>
      <img src="icons/simbolo.svg" alt="" class="hub-logo"></div></div>
    <div class="hub-c"><p class="hub-ey"><i></i>Nexos Performance e Saúde</p><h1 class="hub-h">Sistema<br>Nexos</h1><p class="hub-sub">Olá, ${esc(firstName(S.me && S.me.nome) || 'treinador')}. Escolha por onde começar.</p>
      <div class="hub-cards">${card('#/', I.today, 'Painel do treinador', 'Alunos, treinos, mensagens, planilhas e o dia a dia da assessoria', 0)}${card('#/laboratorio', LAB_IC, 'Laboratório Nexos', 'Dossiês de desempenho, visão da assessoria e evolução dos atletas', 1)}${card('#/aprimoramento', APR_IC, 'Aprimoramento intelectual', 'Estudo, questões e atualização científica da equipe', 2)}</div></div>
    <div class="hub-rod"><span>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span class="hub-on"><i></i>Sistema online</span></div>`;
  document.body.appendChild(hub);
  // fundo: rede de pontos nas cores da paleta escolhida no perfil, com pacotes de luz correndo pelas ligações; reage ao mouse
  const cv = hub.querySelector('#hub-cv'),
    ctx = cv.getContext('2d'),
    rap = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0,
    H = 0,
    dpr = Math.min(2, devicePixelRatio || 1),
    pts = [],
    pac = [],
    mx = -999,
    my = -999,
    cor = corP(),
    t0 = performance.now(),
    ultCor = 0;
  const rs = () => {
    W = innerWidth;
    H = innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(170, Math.round((W * H) / 9000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 1 + Math.random() * 2,
      f: Math.random() * 6.28,
    }));
    pac = [];
  };
  rs();
  const mover = (e) => {
    mx = e.clientX;
    my = e.clientY;
    hub.style.setProperty('--mx', (mx / W - 0.5).toFixed(3));
    hub.style.setProperty('--my', (my / H - 0.5).toFixed(3));
  };
  hub.addEventListener('pointermove', mover);
  hub.addEventListener('pointerleave', () => {
    mx = my = -999;
  });
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
  const quadro = (agora) => {
    if (agora - ultCor > 400) {
      cor = corP();
      ultCor = agora;
      hub.style.setProperty('--hp1', cor.p1);
      hub.style.setProperty('--hp3', cor.p3);
      hub.style.setProperty('--hh3', cor.h3);
      hub.style.setProperty('--hh1', cor.h1);
    }
    const c1 = rgb(cor.p1),
      c3 = rgb(cor.p3),
      tt = (agora - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!rap) {
        p.x += p.vx;
        p.y += p.vy;
      }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mx,
        dy = p.y - my,
        d = Math.hypot(dx, dy);
      if (d < 170 && d > 0) {
        p.x += (dx / d) * 1.6;
        p.y += (dy / d) * 1.6;
      }
    }
    const lig = [];
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i],
          b = pts[j],
          d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 150) continue;
        const perto = mx > 0 && Math.hypot((a.x + b.x) / 2 - mx, (a.y + b.y) / 2 - my) < 200;
        ctx.strokeStyle = `rgba(${perto ? c1 : c3},${(1 - d / 150) * (perto ? 0.7 : 0.38)})`;
        ctx.lineWidth = perto ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        lig.push([a, b]);
      }
    // pacotes de luz: nascem em ligações aleatórias e correm de um ponto ao outro
    if (!rap && lig.length && pac.length < 26 && Math.random() < 0.25) {
      const [a, b] = lig[(Math.random() * lig.length) | 0];
      pac.push({ a, b, t: 0, v: 0.012 + Math.random() * 0.02 });
    }
    pac = pac.filter((k) => (k.t += k.v) < 1);
    for (const k of pac) {
      const x = k.a.x + (k.b.x - k.a.x) * k.t,
        y = k.a.y + (k.b.y - k.a.y) * k.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, `rgba(${c1},.95)`);
      g.addColorStop(1, `rgba(${c1},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 9, y - 9, 18, 18);
    }
    for (const p of pts) {
      const pisca = 0.35 + 0.65 * Math.abs(Math.sin(tt * 1.6 + p.f));
      ctx.fillStyle = `rgba(${c1},${pisca})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
    if (mx > 0) {
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
      g.addColorStop(0, `rgba(${c1},.22)`);
      g.addColorStop(1, `rgba(${c1},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(mx - 220, my - 220, 440, 440);
    }
    hubAnim.raf = requestAnimationFrame(quadro);
  };
  hubAnim = { raf: 0, rs };
  addEventListener('resize', rs);
  hubAnim.raf = requestAnimationFrame(quadro);
}

/* ---------- navegação ---------- */
function setDock(items) {
  if (!items) {
    $dock.hidden = true;
    return;
  }
  const cur = location.hash || '#/';
  // no computador o dock vira menu lateral: marca no topo e o perfil no rodapé
  const marca = `<a href="#/" class="dock-brand" aria-label="Início"><img class="lg-claro" src="icons/wordmark-escuro.svg" alt="Nexos"><img class="lg-escuro" src="icons/wordmark.svg" alt="Nexos"><img class="lg-sim lg-sim-c" src="icons/simbolo-escuro.svg" alt=""><img class="lg-sim lg-sim-e" src="icons/simbolo.svg" alt=""><small>${S.staff ? 'Área do treinador' : 'Área do aluno'}</small></a>`;
  const eu = S.me
    ? `<a href="#/perfil" class="dock-eu ${cur.startsWith('#/perfil') ? 'on' : ''}" aria-label="Meu perfil">${avAluno(S.me, 'sm')}<span><b>${esc(firstName(S.me.nome) || 'Perfil')}</b><small>Meu perfil</small></span></a>`
    : '';
  $dock.innerHTML =
    marca +
    items
      .map((it) => {
        const on = it.match.some((m) => cur === m || (m.length > 2 && cur.startsWith(m + '/')));
        return `<a href="${it.href}" class="${on ? 'on' : ''} ${it.cls || ''}" aria-label="${esc(it.label)}">${it.icon}<span>${esc(it.label)}</span>${it.badge ? `<i class="badge">${it.badge}</i>` : ''}</a>`;
      })
      .join('') +
    eu;
  $dock.classList.toggle('d7', items.filter((it) => !/so-desk|so-tab/.test(it.cls || '')).length > 6);
  $dock.hidden = false;
}
const MODS = [
  ['musculacao', 'Musculação'],
  ['corrida', 'Corrida'],
];
const faz = (k, m = S.me) => !(m && Array.isArray(m.modalidades) && m.modalidades.length) || m.modalidades.includes(k);
const modsHTML = (sel, nome = 'mod') =>
  `<div class="chips wrap">${MODS.map(([k, l]) => `<label class="chipc"><input type="checkbox" name="${nome}" value="${k}" ${!sel || sel.includes(k) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
const dockAluno = () =>
  setDock([
    { href: '#/', match: ['#/', '#'], icon: I.home, label: 'Hoje' },
    { href: '#/planilha', match: ['#/planilha'], icon: I.cal, label: 'Planilha' },
    {
      href: '#/historico',
      match: [
        '#/historico',
        '#/avaliacao',
        '#/corrida',
        '#/relatorio',
        '#/medalhas',
        '#/retrospectiva',
        '#/antes-depois',
        '#/checkup',
      ],
      icon: I.hist,
      label: 'Evolução',
    },
    { href: '#/conversa', match: ['#/conversa'], icon: I.feed, label: 'Treinador', badge: S.cache.msgNovas || '' },
    // no celular ficam dentro do Mais; no computador aparecem no menu lateral
    ...(faz('corrida')
      ? [{ href: '#/eventos', match: ['#/eventos'], icon: I.flag, label: 'Eventos', cls: 'so-desk' }]
      : []),
    { href: '#/conexoes', match: ['#/conexoes'], icon: I.watch, label: 'Conexões', cls: 'so-desk' },
    {
      href: '#/mais',
      match: [
        '#/mais',
        '#/eventos',
        '#/conexoes',
        '#/pagamentos',
        '#/perfil',
        '#/saude',
        '#/termo',
        '#/adesao',
        '#/termos',
        '#/agua',
        '#/prontidao',
        '#/relogio',
        '#/tv',
        '#/meditacao',
        '#/recordes',
      ],
      icon: I.grid,
      label: 'Mais',
      cls: 'so-mob',
    },
  ]);
const SIS_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>';
// computador e tablet (tela grande); celular deitado não conta
const ehDesk = () => matchMedia('(min-width:768px) and (min-height:600px)').matches;
const dockStaff = () =>
  setDock([
    {
      href: '#/sistema',
      match: ['#/sistema', '#/laboratorio', '#/relatorios', '#/aprimoramento'],
      icon: SIS_IC,
      label: 'Sistema',
      cls: 'so-tab',
    },
    {
      href: '#/',
      match: ['#/', '#', '#/feed', '#/prontidao-equipe'],
      icon: I.today,
      label: 'Hoje',
      badge: (S.cache.naoVistos || 0) + (S.cache.pendentes || 0) || '',
    },
    {
      href: '#/alunos',
      match: ['#/alunos', '#/aluno', '#/treino', '#/corrida', '#/relatorio', '#/postural'],
      icon: I.users,
      label: 'Atletas',
    },
    { href: '#/mensagens', match: ['#/mensagens'], icon: I.feed, label: 'Mensagens', badge: S.cache.msgNovas || '' },
    { href: '#/treinos', match: ['#/treinos', '#/modelo', '#/biblioteca'], icon: I.lib, label: 'Treinos' },
    // no computador o Laboratório e o Aprimoramento abrem pela tela do Sistema Nexos (logo no topo do menu)
    {
      href: '#/laboratorio',
      match: ['#/laboratorio', '#/relatorios'],
      icon: LAB_IC,
      label: 'Laboratório',
      cls: 'so-cel',
    },
    { href: '#/aprimoramento', match: ['#/aprimoramento'], icon: APR_IC, label: 'Aprimorar', cls: 'so-cel' },
    {
      href: '#/mais',
      match: [
        '#/mais',
        '#/financeiro',
        '#/eventos',
        '#/perfil',
        '#/formularios',
        '#/saude-sistema',
        '#/erros',
        '#/checkup',
        '#/desativados',
        '#/videochamadas',
        '#/tv',
        '#/meditacao',
        '#/termos-equipe',
        '#/aviso',
      ],
      icon: I.grid,
      label: 'Mais',
      badge: (S.cache.pagInformados || 0) + (S.cache.fichasNovas || 0) || '',
    },
  ]);

function layout(cls = '') {
  $app.className = 'app ' + cls;
  $app.dataset.novo = '1';
  window.scrollTo(0, 0);
}
// a tela nova entra suave só quando o conteúdo de verdade chega (não a cada atualização)
new MutationObserver(() => {
  if (!$app.dataset.novo) return;
  const f = $app.firstElementChild;
  if (!f || f.classList.contains('sk-pag')) return;
  delete $app.dataset.novo;
  $app.classList.add('entrando');
  clearTimeout($app._entT);
  $app._entT = setTimeout(() => $app.classList.remove('entrando'), 700);
}).observe($app, { childList: true });
// esqueleto de carregamento: o formato da tela aparece enquanto os dados chegam
const sk = (cls = '', st = '') => `<i class="sk ${cls}"${st ? ` style="${st}"` : ''}></i>`;
const skLinha = (n = 4) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<div class="sk-row">${sk('sk-av')}<div class="sk-col">${sk('sk-t', `width:${[62, 48, 70, 55, 66][i % 5]}%`)}${sk('sk-s', `width:${[38, 30, 44, 34, 40][i % 5]}%`)}</div></div>`,
  ).join('');
const esqBloco = (tipo = 'lista') =>
  tipo === 'cal'
    ? `<div class="sk-wrap"><div class="sk-cal">${Array.from({ length: 7 }, () => `<div class="sk-dia">${sk('sk-s', 'width:40%')}${sk('sk-card')}</div>`).join('')}</div></div>`
    : tipo === 'chat'
      ? `<div class="sk-wrap sk-chat">${sk('sk-bolha', 'width:58%')}${sk('sk-bolha eu', 'width:44%')}${sk('sk-bolha', 'width:66%')}${sk('sk-bolha eu', 'width:36%')}</div>`
      : `<div class="sk-wrap">${skLinha(3)}</div>`;
function loading() {
  $app.innerHTML = `<div class="sk-pag" aria-busy="true" aria-label="Carregando">${sk('sk-ey')}${sk('sk-h1')}<div class="sk-tiles">${sk('sk-tile')}${sk('sk-tile')}${sk('sk-tile')}</div>${skLinha(4)}</div>`;
}

/* ---------- navegação: o "voltar" leva para a tela de onde a pessoa veio ----------
   Cada passo do histórico recebe um id (history.state.nxId) e o app guarda a pilha das telas abertas.
   - Trocar de aba dentro da mesma tela não soma passo: o voltar sai da tela.
   - Voltar para uma tela que já estava aberta (ex.: salvar o treino e cair no aluno) corta o que veio depois.
   - O botão de voltar do app faz o mesmo que o voltar do celular e mostra o nome da tela anterior. */
const NAV_RAIZ = {
  '': 'Hoje',
  sistema: 'Sistema',
  alunos: 'Meus Atletas',
  mensagens: 'Mensagens',
  treinos: 'Treinos',
  laboratorio: 'Laboratório',
  aprimoramento: 'Aprimoramento',
  mais: 'Mais',
  historico: 'Evolução',
  planilha: 'Planilha',
  conversa: 'Treinador',
  eventos: 'Eventos',
  conexoes: 'Conexões',
};
const NAV_NOME = {
  ...NAV_RAIZ,
  feed: 'Feedbacks',
  financeiro: 'Financeiro',
  perfil: 'Perfil',
  notificacoes: 'Notificações',
};
const navLer = (k, v) => {
  try {
    return JSON.parse(sessionStorage.getItem(k)) || v;
  } catch {
    return v;
  }
};
let navPilha = navLer('nx-nav', []);
const navFora = new Set(navLer('nx-nav-fora', []));
let navTroca = false;
let navMostrada = null;
const navGuardar = () => {
  try {
    sessionStorage.setItem('nx-nav', JSON.stringify(navPilha.slice(-40)));
    sessionStorage.setItem('nx-nav-fora', JSON.stringify([...navFora].slice(-200)));
  } catch {}
};
const navHash = () => location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
// a planilha (corrida e força) e a ficha do aluno são a mesma tela para o voltar
const navFamilia = (h) => {
  const m = h.match(/^aluno\/([^/]+)(?:\/(inicio|corrida|forca))?$/);
  return m ? 'aluno/' + m[1] : h;
};
/** troca a tela atual sem criar um passo no histórico (funciona também na Área do treinador, que usa <base>) */
function trocarRota(h) {
  const i = String(h).indexOf('#');
  const alvo = i >= 0 ? String(h).slice(i) : '#/';
  if (alvo !== location.hash) navTroca = true;
  location.replace(location.pathname + location.search + alvo);
}
function navTitulo(h) {
  if (NAV_NOME[h] != null) return NAV_NOME[h];
  const el = $app.querySelector('h1, .h1, .h2');
  const t = el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  return t.length > 28 ? t.slice(0, 27) + '…' : t;
}
// devolve false quando o passo deve ser pulado (já foi deixado para trás)
function navRegistrar() {
  const h = navHash();
  const st = history.state || {};
  const troca = navTroca;
  navTroca = false;
  const topo = navPilha[navPilha.length - 1];
  if (topo && topo.h === navMostrada && $app.firstElementChild && !$app.querySelector('.sk-pag'))
    topo.t = navTitulo(navMostrada) || topo.t;
  if (st.nxId) {
    if (navFora.has(st.nxId) && navPilha.length) {
      history.back();
      return false;
    }
    const i = navPilha.findIndex((x) => x.id === st.nxId);
    if (i >= 0) {
      navPilha = navPilha.slice(0, i + 1);
      navPilha[i].h = h;
    } else navPilha = [{ id: st.nxId, h }];
  } else {
    const id = Math.random().toString(36).slice(2, 10);
    try {
      history.replaceState({ ...st, nxId: id }, '');
    } catch {}
    const novo = { id, h };
    const fam = navFamilia(h);
    let j = -1;
    for (let k = navPilha.length - 2; k >= 0; k--)
      if (navFamilia(navPilha[k].h) === fam) {
        j = k;
        break;
      }
    if (NAV_RAIZ[h] != null) navPilha = [novo];
    else if (troca && navPilha.length) {
      navFora.add(navPilha.pop().id);
      navPilha.push(novo);
    } else if (j >= 0) {
      navPilha.splice(j).forEach((x) => navFora.add(x.id));
      navPilha.push(novo);
    } else navPilha.push(novo);
  }
  navMostrada = h;
  navGuardar();
  return true;
}
// o botão de voltar mostra o nome da tela de onde a pessoa veio
function navRotulo() {
  const a = $app.querySelector('a.back');
  if (!a || a.dataset.nxRot) return;
  const prev = navPilha.length >= 2 && navPilha[navPilha.length - 2];
  if (!prev) return;
  const t = prev.t || NAV_NOME[prev.h] || (/^mensagens\//.test(prev.h) ? 'Conversa' : 'Voltar');
  a.dataset.nxRot = '1';
  a.innerHTML = `${I.back} ${esc(t)}`;
}
new MutationObserver(navRotulo).observe($app, { childList: true });
// abas dentro da mesma tela não viram passo do histórico
document.addEventListener(
  'click',
  (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || a.target) return;
    if (a.matches('a.back, a[aria-label="Voltar"]')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      // passo de painel já fechado por cima da tela: volta dois passos
      if (navPilha.length >= 2) history.go(history.state && history.state.nxPainel && $sheet.hidden ? -2 : -1);
      else trocarRota(a.getAttribute('href'));
      return;
    }
    if (a.closest('.subtabs, .tabs, .seg') && a.getAttribute('href') !== location.hash) navTroca = true;
  },
  true,
);

async function router() {
  if (!navRegistrar()) return;
  closeSheet(true);
  clearInterval(S.presVer);
  stopRest();
  $app.onclick = null;
  $app.oninput = null;
  clearInterval(S.chatT);
  clearInterval(S.msgT);
  const fichaTk = (location.hash.match(/^#\/ficha\/([a-f0-9]{12,40})/) || [])[1];
  if (fichaTk) return viewFicha(fichaTk);
  if (!S.user) return viewLogin();
  if (!S.me) return viewSemAcesso();
  escutarChamadas();
  iniciarPresenca();
  if (!window.NX_DEMO && AREA === 'aluno' && S.staff) return viewOutraArea('treinador');
  if (!window.NX_DEMO && AREA === 'treinador' && !S.staff) return viewOutraArea('aluno');
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [a, b, c, d] = parts;
  try {
    if (!S.staff) {
      const sd = await carregarSaude();
      if (!sd.termo) return viewTermo();
      if (!sd.anamnese) return await viewAnamnese({ gate: true, anamnese: null });
      const ad = await carregarAdesao();
      if (ad.pendente) return viewAdesao(ad);
    }
    if (a === 'chamada' && b) return await viewChamada(b);
    if (S.staff) {
      fecharHub();
      // computador: ao abrir a área do treinador, primeiro a tela do Sistema Nexos (uma vez por sessão)
      if (!a && ehDesk() && !sessionStorage.getItem('nx-hub')) {
        sessionStorage.setItem('nx-hub', '1');
        trocarRota(location.pathname + '#/sistema');
        return;
      }
      if (a === 'sistema') {
        sessionStorage.setItem('nx-hub', '1');
        if (!ehDesk()) {
          trocarRota(location.pathname + '#/');
          return;
        }
        return staffSistema();
      }
      dockStaff();
      layout('wide');
      if (!a) return await staffHoje();
      if (a === 'alunos') return await staffAlunos();
      if (a === 'financeiro') return await staffFinanceiro();
      if (a === 'falta' && b) {
        await staffHoje();
        return abrirFaltaStaff(b);
      }
      if (a === 'faltas') {
        history.replaceState(null, '', location.pathname + '#/');
        await staffHoje();
        return rolarAte('faltas-eq');
      }
      if (a === 'aluno' && b && c === 'postural') return await formPostural(b, d && d !== 'nova' ? d : null);
      if (a === 'postural' && b) return await viewPostural(b);
      if (a === 'aluno' && b && c === 'treino') return await staffTreinoEditor(b, d || null);
      if (a === 'aluno' && b && c === 'avaliacao') return await formAvaliacao(b, d && d !== 'nova' ? d : null);
      if (a === 'relatorio' && b) return await viewRelatorio(b);
      if (a === 'corrida' && b) return await viewCorrida(b);
      if (a === 'aluno' && b && c === 'dossie') return await staffDossie(b, d);
      if (a === 'aluno' && b) return await staffAluno(b, c, d);
      if (a === 'treino' && b) return await viewExecucao(b, true);
      if (a === 'feed') return await staffFeed();
      if (a === 'semanas') return await staffSemanas(b);
      if (a === 'modelo' && b) return await staffTreinoEditor(null, b, 'modelo');
      if (a === 'biblioteca') return b === 'modelos' ? (location.hash = '#/treinos') : await staffBiblioteca();
      if (a === 'treinos')
        return b === 'ciclos'
          ? await viewCiclos(c)
          : b === 'ciclos-forca'
            ? await viewCiclosForca(c)
            : await staffTreinos(b);
      if (a === 'relatorios') return await staffRelatorios();
      if (a === 'laboratorio') {
        if (b === 'dossie' && c) return await staffDossie(c, d);
        if (b === 'assessoria') return await staffAssessoria(c);
        return await staffLaboratorio();
      }
      if (a === 'mais') return staffMais();
      if (a === 'tv') return await viewTv(b);
      if (a === 'meditacao') return await viewMeditacao(b);
      if (a === 'aviso') return await staffAviso();
      if (a === 'termos-equipe') return await staffTermos();
      if (a === 'desafio') return await staffDesafio();
      if (a === 'dicas') return await viewDicas(b);
      if (a === 'notificacoes') return await viewNotificacoes();
      if (a === 'aprimoramento') return await viewAprimoramento(b, c);
      if (a === 'checkup') return await viewCheckup(b, c, d);
      if (a === 'erros') return await staffErros();
      if (a === 'saude-sistema') return await staffSaudeSistema();
      if (a === 'prontidao-equipe') return await staffProntidao(b);
      if (a === 'relogios') return await staffRelogios();
      if (a === 'desativados') return await staffDesativados();
      if (a === 'videochamadas') return await staffVideochamadas();
      if (a === 'fidelizacao') return await staffFidelizacao();
      if (a === 'antes-depois' && b) return await viewAntesDepois(b);
      if (a === 'formularios') return await staffFormularios(b);
      if (a === 'mensagens') return await staffMensagens(b);
      if (a === 'eventos') return await viewEventos(b);
      if (a === 'prova' && b) return await viewPlanoProva(b);
      if (a === 'perfil') return viewPerfil();
      return await staffHoje();
    }
    if (a === 'treino' && b) {
      $dock.hidden = true;
      layout();
      return await viewExecucao(b, false);
    }
    dockAluno();
    layout('wide aluno');
    if (!a) return await alunoHoje();
    if (a === 'falta') {
      await alunoHoje();
      return abrirFaltaAluno(b);
    }
    if (a === 'historico') return await alunoHistorico(b);
    if (a === 'checkup') return await viewCheckup(b, c);
    if (a === 'planilha') return await viewPlanilhaAluno(b);
    if (a === 'eventos' && faz('corrida')) return await viewEventos(b);
    if (a === 'prova' && b) return await viewPlanoProva(b);
    if (a === 'relatorio' && b) return await viewRelatorio(b);
    if (a === 'conversa') return await viewConversa(S.user.id, $app, false);
    if (a === 'conexoes') return await viewConexoes(b);
    if (a === 'previsoes') {
      trocarRota('#/historico/previsoes');
      return;
    }
    if (a === 'gps' && faz('corrida')) return b ? await viewGps(b, c) : await viewGpsLista();
    if (a === 'postural' && b) return await viewPostural(b);
    if (a === 'corrida' && b) return await viewCorrida(b);
    if (a === 'saude') return await viewAnamnese({});
    if (a === 'termo') return viewTermoLido();
    if (a === 'adesao') return await viewAdesaoLida();
    if (a === 'termos') return await viewTermos();
    if (a === 'pagamentos') return await viewPagamentos(b);
    if (a === 'perfil') return viewPerfil();
    if (a === 'mais') return alunoMais();
    if (a === 'tv') return await viewTv(b);
    if (a === 'meditacao') return await viewMeditacao(b);
    if (a === 'medalhas') return await viewMedalhas();
    if (a === 'retrospectiva') return await viewRetrospectiva(b);
    if (a === 'antes-depois') return await viewAntesDepois();
    if (a === 'recordes') return await viewRecordes();
    if (a === 'agua') return await viewAguaAluno();
    if (a === 'ciclo') return await viewCicloAluna(b);
    if (a === 'prontidao') return await viewProntAluno(b === 'agora');
    if (a === 'relogio') return await viewRelogioAluno();
    if (a === 'meta') return await viewMeta();
    if (a === 'notificacoes') return await viewNotificacoes();
    if (a === 'dicas') return await viewDicas(b);
    return await alunoHoje();
  } catch (e) {
    console.error(e);
    reportarErro(e, 'tela não carregou');
    $app.innerHTML = `<div class="empty" style="margin-top:40px"><div class="h3">Algo não carregou</div><p class="small">Verifique sua internet e tente de novo.</p><button class="btn sm" style="margin-top:16px" onclick="location.reload()">Recarregar</button></div>`;
  }
}
window.addEventListener('hashchange', router);

/* ---------- sessão ---------- */
// último acesso ao app (painel de fidelização do treinador): marca ao abrir e ao voltar para o app, no máximo a cada 15 min
let ultMarca = 0;
function marcarAcesso() {
  if (!S.user || Date.now() - ultMarca < 15 * 60000) return;
  ultMarca = Date.now();
  sb.rpc('nx_marcar_acesso').then(
    () => {},
    () => {},
  );
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') marcarAcesso();
});
async function carregarPerfil() {
  const { data, error } = await sb
    .from('nx_membros')
    .select('*, nx_orgs(id,nome,slug,config)')
    .eq('user_id', S.user.id)
    .eq('ativo', true)
    .order('criado_em');
  if (error) throw error;
  const m = (data || []).sort((x, y) => (x.papel === 'aluno') - (y.papel === 'aluno'))[0] || null;
  S.me = m;
  S.org = m?.nx_orgs || null;
  S.staff = !!m && (m.papel === 'admin' || m.papel === 'treinador');
  marcarAcesso();
  // aparência salva na conta acompanha a pessoa em qualquer aparelho
  if (m?.tema && m.tema !== document.documentElement.dataset.tema) aplicarTema(m.tema);
  if (m?.paleta && m.paleta !== document.documentElement.dataset.paleta) aplicarPaleta(m.paleta);
  // quem já tinha escolhido cores neste aparelho antes de existir o salvamento na conta: leva a escolha para a conta
  if (
    m &&
    !m.paleta &&
    !m.tema &&
    ((document.documentElement.dataset.paleta || 'nexos') !== 'nexos' ||
      document.documentElement.dataset.tema === 'escuro')
  )
    salvarAparencia();
}
const salvarAparencia = () => {
  const d = document.documentElement.dataset;
  if (S.me) {
    S.me.paleta = d.paleta || 'nexos';
    S.me.tema = d.tema || 'claro';
  }
  sb.rpc('nx_aparencia', { p_paleta: d.paleta || 'nexos', p_tema: d.tema || 'claro' }).then(
    () => {},
    () => {},
  );
};
async function iniciar() {
  aplicarTema(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro');
  const { data } = await sb.auth.getSession();
  S.user = data.session?.user || null;
  if (S.user) {
    try {
      await carregarPerfil();
    } catch (e) {
      console.error(e);
    }
  }
  // a equipe pediu para todos atualizarem o app: limpa o cache e recarrega uma vez
  try {
    const f = S.org && S.org.config && S.org.config.forcar_em;
    if (f && store.get('nx-forcado-em', '') !== f) {
      store.set('nx-forcado-em', f);
      if (window.caches) {
        const ks = await caches.keys();
        await Promise.all(ks.map((k) => caches.delete(k)));
      }
      if (swReg) await swReg.update().catch(() => {});
      location.reload();
      return;
    }
  } catch (e) {
    console.error(e);
  }
  router();
}
let novaSenhaAberta = false;
sb.auth.onAuthStateChange((ev, session) => {
  if (ev === 'PASSWORD_RECOVERY' || (NX_RECUPERACAO && ev === 'SIGNED_IN' && session)) {
    if (!novaSenhaAberta) {
      novaSenhaAberta = true;
      setTimeout(abrirNovaSenha, 1200);
    }
  }
  if (ev === 'SIGNED_OUT') {
    S.user = null;
    S.me = null;
    S.org = null;
    S.staff = false;
    S.cache = {};
    $dock.hidden = true;
    router();
  }
  if (ev === 'TOKEN_REFRESHED' && session) S.user = session.user;
});

/** depois do link de "esqueci minha senha": a pessoa já entrou pelo link e cria a senha nova */
function abrirNovaSenha() {
  try {
    if (/access_token|type=recovery/.test(location.hash)) history.replaceState(null, '', location.pathname + '#/');
  } catch {}
  openSheet(
    `<p class="eyebrow">Recuperar acesso</p><div class="h2" style="margin-top:4px">Crie a sua senha nova</div>
    <form id="f-nova" style="margin-top:14px"><label class="field"><span>Senha nova</span><input class="input" type="password" name="s1" minlength="6" required autocomplete="new-password"></label>
    <label class="field"><span>Repita a senha</span><input class="input" type="password" name="s2" minlength="6" required autocomplete="new-password"></label>
    <button class="btn block" type="submit">Salvar senha</button></form>`,
    (r) => {
      const f = r.querySelector('#f-nova');
      f.onsubmit = async (e) => {
        e.preventDefault();
        if (f.s1.value.length < 6) return toast('Use pelo menos 6 caracteres.', true);
        if (f.s1.value !== f.s2.value) return toast('As duas senhas estão diferentes.', true);
        const b = f.querySelector('button');
        b.disabled = true;
        const { error } = await sb.auth.updateUser({ password: f.s1.value });
        if (error) {
          b.disabled = false;
          return toast(
            /same|different/i.test(error.message || '')
              ? 'Use uma senha diferente da antiga.'
              : 'Não foi possível salvar. Tente de novo.',
            true,
          );
        }
        closeSheet();
        toast('Senha nova salva! Use ela da próxima vez que entrar.');
      };
    },
  );
}
