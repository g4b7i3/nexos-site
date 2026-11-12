/* Nexos App · Confete, card para story, medalhas, retrospectiva, treino não feito, replay do percurso, comparativos, modo prova, plano de prova, cards da Hoje e áudio na conversa.
   Parte 8 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* =====================================================================
   MOMENTOS DO ALUNO
   1) comemoração e cards para o story  2) medalhas (marcos)
   3) retrospectiva do mês e do ano     4) replay do percurso
   5) você contra você                  6) antes e depois de 3 meses
   7) modo prova                        (o áudio do treinador fica na conversa)
   ===================================================================== */
const MESES_N = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const ehCorrHist = (c) => !c.tipo || ['corrida', 'trail', 'esteira'].includes(c.tipo);
const semMov = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- confete ---------- */
function confete(dur = 2600) {
  if (semMov()) return;
  const cv = document.createElement('canvas');
  cv.className = 'confete';
  document.body.append(cv);
  const dp = Math.min(2, devicePixelRatio || 1),
    W = (cv.width = innerWidth * dp),
    H = (cv.height = innerHeight * dp),
    ctx = cv.getContext('2d');
  const cores = ['#46d6ff', '#2f6bff', '#3ddc97', '#ffcf5c', '#ff8a65', '#ffffff'];
  const ps = Array.from({ length: 150 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4,
    y: H * 0.32,
    vx: (Math.random() - 0.5) * W * 0.02,
    vy: -Math.random() * H * 0.022 - H * 0.006,
    r: (5 + Math.random() * 7) * dp,
    c: cores[(Math.random() * cores.length) | 0],
    a: Math.random() * 6,
    va: (Math.random() - 0.5) * 0.3,
  }));
  const t0 = performance.now();
  const f = (t) => {
    const k = (t - t0) / dur;
    ctx.clearRect(0, 0, W, H);
    ps.forEach((p) => {
      p.vy += H * 0.0006;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k * k);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    });
    if (k < 1) requestAnimationFrame(f);
    else cv.remove();
  };
  requestAnimationFrame(f);
}

/* ---------- card para o story (1080 x 1920, marca Nexos) ---------- */
let _logoNx = null;
const logoNx = () =>
  _logoNx ||
  (_logoNx = new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = 'icons/wordmark.svg';
  }));
async function fontesStory() {
  try {
    await Promise.all(
      ["800 100px 'Unbounded'", "600 100px 'Unbounded'", "700 40px 'Manrope'", "500 40px 'Manrope'"].map((f) =>
        document.fonts.load(f),
      ),
    );
  } catch {}
}
function quebraTexto(x, t, max) {
  const ps = String(t).split(' '),
    ls = [];
  let l = '';
  ps.forEach((p) => {
    const n = l ? l + ' ' + p : p;
    if (x.measureText(n).width > max && l) {
      ls.push(l);
      l = p;
    } else l = n;
  });
  if (l) ls.push(l);
  return ls;
}
function fundoStory(x, W, H) {
  const cp = corP();
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, cp.h1);
  g.addColorStop(0.55, cp.h2);
  g.addColorStop(1, misturaHex(cp.h3, '#000000', 0.3));
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const rg = x.createRadialGradient(W * 0.85, H * 0.1, 10, W * 0.85, H * 0.1, 760);
  rg.addColorStop(0, cp.p1 + '57');
  rg.addColorStop(1, cp.p1 + '00');
  x.fillStyle = rg;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.06)';
  x.lineWidth = 2;
  [360, 500, 640].forEach((r) => {
    x.beginPath();
    x.arc(W * 0.92, H * 0.96, r, 0, 7);
    x.stroke();
  });
}
async function desenharStory(cv, o) {
  await fontesStory();
  const W = 1080,
    H = 1920;
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  fundoStory(x, W, H);
  const cp = corP();
  const lg = await logoNx();
  if (lg) {
    const h = 52,
      w = (lg.width / lg.height) * h;
    x.drawImage(lg, 90, 120, w, h);
  }
  let y = 360;
  if (o.medalha) {
    desenharMedalha(x, W / 2, 580, 180, o.grupo || 'nexos', o.rotulo);
    y = 870;
  }
  x.textAlign = o.medalha ? 'center' : 'left';
  const cx = o.medalha ? W / 2 : 90;
  x.fillStyle = cp.p1;
  x.font = "700 34px 'Manrope'";
  try {
    x.letterSpacing = '7px';
  } catch {}
  x.fillText(String(o.eyebrow || '').toUpperCase(), cx, y);
  try {
    x.letterSpacing = '0px';
  } catch {}
  y += 92;
  x.fillStyle = '#fff';
  x.font = "600 76px 'Unbounded'";
  quebraTexto(x, o.titulo || '', W - 180)
    .slice(0, 3)
    .forEach((l) => {
      x.fillText(l, cx, y);
      y += 92;
    });
  if (o.grande) {
    y += 150;
    x.font = "800 210px 'Unbounded'";
    const gw = x.measureText(o.grande).width;
    x.fillText(o.grande, o.medalha ? cx - (o.unidade ? 60 : 0) : cx, y);
    if (o.unidade) {
      x.font = "700 60px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.8)';
      x.textAlign = 'left';
      x.fillText(o.unidade, (o.medalha ? cx - 60 + gw / 2 : cx + gw) + 20, y);
      x.textAlign = o.medalha ? 'center' : 'left';
    }
    y += 40;
  }
  if (o.texto) {
    y += 50;
    x.font = "500 42px 'Manrope'";
    x.fillStyle = 'rgba(255,255,255,.78)';
    quebraTexto(x, o.texto, W - 180)
      .slice(0, 4)
      .forEach((l) => {
        x.fillText(l, cx, y);
        y += 58;
      });
  }
  if (o.linhas && o.linhas.length) {
    y = Math.max(y + 50, 1100);
    x.textAlign = 'left';
    o.linhas.slice(0, 6).forEach(([l, v]) => {
      x.strokeStyle = 'rgba(255,255,255,.14)';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(90, y - 62);
      x.lineTo(W - 90, y - 62);
      x.stroke();
      x.font = "500 40px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.72)';
      x.fillText(l, 90, y);
      x.font = "600 52px 'Unbounded'";
      x.fillStyle = '#fff';
      x.textAlign = 'right';
      x.fillText(v, W - 90, y);
      x.textAlign = 'left';
      y += 112;
    });
  }
  x.textAlign = 'left';
  x.font = "700 34px 'Manrope'";
  x.fillStyle = '#fff';
  x.fillText(o.nome || '', 90, H - 150);
  x.font = "500 30px 'Manrope'";
  x.fillStyle = 'rgba(255,255,255,.6)';
  x.fillText('Treino acompanhado pela Nexos Performance e Saúde', 90, H - 100);
}
function desenharMedalha(x, cx, cy, r, g, rt) {
  const [, c1, c2] = GRUPOS_M[g] || GRUPOS_M.nexos;
  const hex = (k) => {
    x.beginPath();
    [
      [0, -1],
      [0.866, -0.5],
      [0.866, 0.5],
      [0, 1],
      [-0.866, 0.5],
      [-0.866, -0.5],
    ].forEach(([a, b], i) => (i ? x.lineTo(cx + a * r * k, cy + b * r * k) : x.moveTo(cx + a * r * k, cy + b * r * k)));
    x.closePath();
  };
  x.save();
  const gl = x.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2);
  gl.addColorStop(0, 'rgba(70,214,255,.45)');
  gl.addColorStop(1, 'rgba(70,214,255,0)');
  x.fillStyle = gl;
  x.beginPath();
  x.arc(cx, cy, r * 2, 0, 7);
  x.fill();
  const gr = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  gr.addColorStop(0, c2);
  gr.addColorStop(1, c1);
  hex(1);
  x.fillStyle = gr;
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,.4)';
  x.lineWidth = r * 0.025;
  x.stroke();
  hex(0.8);
  x.strokeStyle = 'rgba(255,255,255,.3)';
  x.lineWidth = r * 0.02;
  x.stroke();
  const sh = x.createLinearGradient(0, cy - r, 0, cy);
  sh.addColorStop(0, 'rgba(255,255,255,.35)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  hex(1);
  x.save();
  x.clip();
  x.fillStyle = sh;
  x.fillRect(cx - r, cy - r, r * 2, r);
  x.restore();
  if (rt) {
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.font = `800 ${rt[0].length > 3 ? r * 0.42 : rt[0].length > 2 ? r * 0.5 : r * 0.62}px 'Unbounded'`;
    x.fillText(rt[0], cx, cy + (rt[1] ? r * 0.12 : r * 0.22));
    if (rt[1]) {
      x.font = `700 ${r * 0.16}px 'Manrope'`;
      x.fillStyle = 'rgba(255,255,255,.85)';
      try {
        x.letterSpacing = '4px';
      } catch {}
      x.fillText(rt[1], cx, cy + r * 0.42);
      try {
        x.letterSpacing = '0px';
      } catch {}
    }
  } else
    try {
      const k = (r * 1.05) / 24;
      x.translate(cx - 12 * k, cy - 12 * k);
      x.scale(k, k);
      x.strokeStyle = '#fff';
      x.lineWidth = 1.9;
      x.lineCap = 'round';
      x.lineJoin = 'round';
      x.stroke(new Path2D(ICONE_M[g] || ICONE_M.nexos));
    } catch {}
  x.restore();
}
async function compartilharCanvas(cv, nome) {
  const b = await new Promise((r) => cv.toBlob(r, 'image/png'));
  const file = new File([b], nome, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function abrirStory(o, nome) {
  openSheet(
    `<p class="eyebrow">Card para o story</p><div class="story-prev"><canvas id="st-cv"></canvas></div><button class="btn block" id="st-share" style="margin-top:12px">${I.up || ''} Compartilhar ou baixar</button><p class="tiny dim center" style="margin-top:8px">Marque a @nexos.perform no story.</p>`,
    async (r) => {
      const cv = r.querySelector('#st-cv');
      await desenharStory(cv, { nome: S.me && S.me.nome, ...o });
      r.querySelector('#st-share').onclick = () => compartilharCanvas(cv, nome);
    },
  );
}

/* ---------- histórico completo do aluno (base para medalhas, retrospectiva e antes e depois) ---------- */
async function historicoAluno(id) {
  const [cs, ss, hs, ps, avs] = await Promise.all([
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,fc_media,parciais,titulo')
      .eq('aluno_id', id)
      .order('data')
      .limit(3000)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_sessoes')
      .select('id,iniciado_em,finalizado_em')
      .eq('aluno_id', id)
      .not('finalizado_em', 'is', null)
      .order('iniciado_em')
      .limit(3000)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_hidratacao')
      .select('dia,ml,meta')
      .eq('aluno_id', id)
      .order('dia')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_prontidao')
      .select('dia')
      .eq('aluno_id', id)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    buscarAvaliacoes(id).catch(() => []),
  ]);
  return { corridas: cs, sessoes: ss, agua: hs, pront: ps, avs };
}
const datasAtiv = (h) => [...h.corridas.map((c) => c.data), ...h.sessoes.map((s) => s.iniciado_em)].sort();

/* ---------- 2) medalhas ---------- */
// cores das medalhas seguem a paleta escolhida
const GRUPOS_M = {
  get corrida() {
    const c = corP();
    return ['Corrida', c.p3, c.p1];
  },
  get constancia() {
    const c = corP();
    return ['Constância', c.p2, misturaHex(c.p1, '#ffffff', 0.35)];
  },
  get forca() {
    const c = corP();
    return ['Força', c.h1, c.p2];
  },
  get saude() {
    const c = corP();
    return ['Saúde', misturaHex(c.p2, c.h1, 0.3), misturaHex(c.p1, '#5eead4', 0.4)];
  },
  get nexos() {
    const c = corP();
    return ['Nexos', c.h3, c.p3];
  },
};
// ícones das medalhas (traço branco, 24 x 24)
const ICONE_M = {
  corrida: 'M5 19c3 0 3-6 7-6s4-6 7-6M5 19a1.6 1.6 0 1 0 0 .01M19 7l0-3 3 1.5-3 1.5',
  constancia:
    'M12 3c.6 3 3.6 4.6 4.6 7.4 1.4 3.9-.9 8.6-4.6 8.6s-6-3.5-4.8-7.2c.5 1.6 1.6 2.4 2.6 2.6-.6-3.2.8-6.6 2.2-11.4z',
  forca: 'M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12',
  saude: 'M12 3.5s6 6.6 6 10.7a6 6 0 0 1-12 0C6 10.1 12 3.5 12 3.5z',
  nexos: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
};
function calcMarcos(h, inicio) {
  const out = [];
  const add = (k, g, nome, desc, quando, prog, falta) =>
    out.push({ k, g, nome, desc, quando: quando || null, prog: Math.max(0, Math.min(1, prog || 0)), falta });
  const corr = h.corridas.filter(ehCorrHist);
  // km acumulados
  let soma = 0;
  const quandoKm = {};
  corr.forEach((c) => {
    soma += (+c.distancia_m || 0) / 1000;
    [50, 100, 250, 500, 1000].forEach((n) => {
      if (soma >= n && !quandoKm[n]) quandoKm[n] = c.data;
    });
  });
  [50, 100, 250, 500, 1000].forEach((n) =>
    add(
      'km' + n,
      'corrida',
      `${n} km na Nexos`,
      `Somou ${n} km de corrida`,
      quandoKm[n],
      soma / n,
      quandoKm[n] ? '' : `faltam ${f1(n - soma)} km`,
    ),
  );
  // primeiras distâncias
  [
    [5, 4950, 'Primeiros 5 km'],
    [10, 9900, 'Primeiros 10 km'],
    [21, 21000, 'Primeira meia maratona'],
    [42, 42000, 'Primeira maratona'],
  ].forEach(([n, m, nome]) => {
    const c = corr.find((x) => (+x.distancia_m || 0) >= m);
    const mx = Math.max(0, ...corr.map((x) => +x.distancia_m || 0));
    add(
      'd' + n,
      'corrida',
      nome,
      `Correu ${n === 21 ? '21,1' : n === 42 ? '42,2' : n} km de uma vez`,
      c && c.data,
      mx / m,
      c ? '' : `maior até agora: ${f1(mx / 1000)} km`,
    );
  });
  // semanas seguidas
  const sem = [...new Set(datasAtiv(h).map((d) => isoDia(inicioSemana(new Date(d)))))].sort();
  let seq = 0,
    ant = null,
    maxSeq = 0;
  const quandoS = {};
  sem.forEach((w) => {
    seq = ant && somaDias(ant, 7) === w ? seq + 1 : 1;
    ant = w;
    maxSeq = Math.max(maxSeq, seq);
    [4, 10, 26, 52].forEach((n) => {
      if (seq >= n && !quandoS[n]) quandoS[n] = w;
    });
  });
  [
    [4, 'Um mês sem falhar'],
    [10, '10 semanas seguidas'],
    [26, 'Meio ano de constância'],
    [52, 'Um ano inteiro'],
  ].forEach(([n, nome]) =>
    add(
      's' + n,
      'constancia',
      nome,
      `${n} semanas seguidas treinando`,
      quandoS[n] && somaDias(quandoS[n], 6) <= hojeISO() ? somaDias(quandoS[n], 6) : quandoS[n],
      maxSeq / n,
      quandoS[n] ? '' : `melhor sequência: ${maxSeq}`,
    ),
  );
  // força
  [
    [10, 'Base de força'],
    [50, '50 treinos de força'],
    [100, '100 treinos de força'],
  ].forEach(([n, nome]) => {
    const s = h.sessoes[n - 1];
    add(
      'f' + n,
      'forca',
      nome,
      `${n} treinos de força concluídos`,
      s && s.iniciado_em,
      h.sessoes.length / n,
      s ? '' : `faltam ${n - h.sessoes.length}`,
    );
  });
  // água
  const okA = h.agua
    .filter((a) => a.meta && a.ml >= a.meta)
    .map((a) => a.dia)
    .sort();
  let sa = 0,
    aa = null,
    q7 = null,
    maxA = 0;
  okA.forEach((d) => {
    sa = aa && somaDias(aa, 1) === d ? sa + 1 : 1;
    aa = d;
    maxA = Math.max(maxA, sa);
    if (sa >= 7 && !q7) q7 = d;
  });
  add(
    'a7',
    'saude',
    'Semana hidratada',
    '7 dias seguidos batendo a meta de água',
    q7,
    maxA / 7,
    q7 ? '' : `melhor sequência: ${maxA} dia${maxA === 1 ? '' : 's'}`,
  );
  add(
    'a30',
    'saude',
    '30 dias hidratado',
    'Bateu a meta de água em 30 dias',
    okA[29],
    okA.length / 30,
    okA[29] ? '' : `${okA.length} de 30`,
  );
  const pr = h.pront.map((p) => p.dia).sort();
  add(
    'c30',
    'saude',
    'Corpo no radar',
    '30 check-ins da manhã respondidos',
    pr[29],
    pr.length / 30,
    pr[29] ? '' : `${pr.length} de 30`,
  );
  // tempo de Nexos
  if (inicio)
    [
      [30, 'Primeiro mês de Nexos'],
      [180, 'Seis meses de Nexos'],
      [365, 'Um ano de Nexos'],
    ].forEach(([n, nome]) => {
      const d = somaDias(isoDia(inicio), n);
      add(
        'n' + n,
        'nexos',
        nome,
        `${n === 30 ? '1 mês' : n === 180 ? '6 meses' : '1 ano'} treinando com a Nexos`,
        d <= hojeISO() ? d : null,
        diasDesde(inicio) / n,
        d <= hojeISO() ? '' : `faltam ${Math.ceil(n - diasDesde(inicio))} dias`,
      );
    });
  return out;
}
const ROTULO_M = (k) => {
  const n = +(String(k).match(/\d+/) || [0])[0];
  if (/^km/.test(k)) return [String(n), 'KM'];
  if (/^d/.test(k))
    return [n === 21 ? '21K' : n === 42 ? '42K' : n + 'K', n === 21 ? 'MEIA' : n === 42 ? 'MARATONA' : 'PRIMEIROS'];
  if (/^s/.test(k)) return [String(n), 'SEMANAS'];
  if (/^f/.test(k)) return [String(n), 'TREINOS'];
  if (k === 'a7') return ['7', 'DIAS'];
  if (k === 'a30') return ['30', 'DIAS'];
  if (k === 'c30') return ['30', 'CHECK-INS'];
  if (k === 'n30') return ['1', 'MÊS'];
  if (k === 'n180') return ['6', 'MESES'];
  if (k === 'n365') return ['1', 'ANO'];
  return null;
};
const SELO_SVG = (g, on = true, k = '') => {
  const [, c1, c2] = GRUPOS_M[g] || GRUPOS_M.nexos;
  const id = 'sg-' + g;
  const rt = k ? ROTULO_M(k) : null;
  return `<svg viewBox="0 0 72 80" class="selo ${on ? 'on' : 'off'}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient><linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <path d="M36 3 67 21v38L36 77 5 59V21z" fill="${on ? `url(#${id})` : 'none'}" stroke="${on ? 'rgba(255,255,255,.35)' : 'currentColor'}" stroke-width="${on ? 1.5 : 2}" stroke-dasharray="${on ? '' : '4 4'}"/>
  ${on ? `<path d="M36 3 67 21v14L5 35V21z" fill="url(#${id}-b)" opacity=".5"/><path d="M36 11 60 25v30L36 69 12 55V25z" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.2"/>` : ''}
  ${
    rt
      ? `<text x="36" y="${rt[1] ? 44 : 49}" text-anchor="middle" class="selo-n" fill="${on ? '#fff' : 'currentColor'}" font-size="${rt[0].length > 3 ? 15 : rt[0].length > 2 ? 18 : 22}">${rt[0]}</text>${rt[1] ? `<text x="36" y="57" text-anchor="middle" class="selo-s" fill="${on ? 'rgba(255,255,255,.85)' : 'currentColor'}" font-size="${rt[1].length > 8 ? 5.4 : 6.6}">${rt[1]}</text>` : ''}`
      : `<g transform="translate(18 22) scale(1.5)" fill="none" stroke="${on ? '#fff' : 'currentColor'}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONE_M[g] || ICONE_M.nexos}"/></g>`
  }</svg>`;
};
const MEDALHA_SVG = (cor, on = true, g = 'corrida') => SELO_SVG(g, on);
async function viewMedalhas() {
  loading();
  const h = await historicoAluno(S.user.id);
  const ms = calcMarcos(h, S.me.criado_em);
  const tem = ms.filter((m) => m.quando).length;
  const ult = ms.filter((m) => m.quando).sort((a, b) => (a.quando < b.quando ? 1 : -1))[0];
  const pct = Math.round((tem / ms.length) * 100);
  $app.innerHTML = `<a class="back" href="#/historico">${I.back} Evolução</a>
    <section class="med-hero"><div class="med-anel" style="--p:${pct}"><b>${tem}</b><span>de ${ms.length}</span></div><div class="grow"><span class="hh-data">Conquistas</span><h1>Suas medalhas</h1><p>${ult ? `Última: <b>${esc(ult.nome)}</b> em ${fmtCurto(ult.quando)}` : 'A primeira está perto. Cada medalha vira um card para o story.'}</p></div></section>
    ${Object.entries(GRUPOS_M)
      .map(([g, [nome]]) => {
        const l = ms.filter((m) => m.g === g);
        if (!l.length) return '';
        const n = l.filter((m) => m.quando).length;
        return `<div class="med-sec"><p class="sec-lbl">${nome} <span class="med-cont">${n}/${l.length}</span></p><div class="med-grid">${l.map((m) => `<button type="button" class="med ${m.quando ? 'on' : ''}" data-m="${m.k}">${SELO_SVG(g, !!m.quando, m.k)}<b>${esc(m.nome)}</b><small>${m.quando ? fmtDia(isoDia(m.quando)) : esc(m.falta || '')}</small>${m.quando ? '' : `<i class="med-prog"><i style="width:${Math.max(4, Math.round(m.prog * 100))}%"></i></i>`}</button>`).join('')}</div></div>`;
      })
      .join('')}`;
  $app.onclick = (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    const m = ms.find((x) => x.k === b.dataset.m);
    if (!m) return;
    if (!m.quando)
      return toast(`${m.desc}. ${m.falta ? m.falta.charAt(0).toUpperCase() + m.falta.slice(1) + '.' : ''}`);
    abrirStory(
      {
        eyebrow: 'Nova conquista',
        titulo: m.nome,
        texto: m.desc + '.',
        medalha: true,
        grupo: m.g,
        rotulo: ROTULO_M(m.k),
      },
      `conquista-${m.k}.png`,
    );
  };
}

/* ---------- 3) retrospectiva ---------- */
function statsPeriodo(h, ini, fim) {
  const dentro = (d) => {
    const k = isoDia(d);
    return k >= ini && k <= fim;
  };
  const cs = h.corridas.filter((c) => dentro(c.data)),
    ss = h.sessoes.filter((s) => dentro(s.iniciado_em));
  const corr = cs.filter(ehCorrHist);
  const km = corr.reduce((a, c) => a + (+c.distancia_m || 0), 0) / 1000;
  const segC = cs.reduce((a, c) => a + (+c.duracao_s || 0), 0),
    segF = ss.reduce(
      (a, s) => a + Math.max(0, Math.min(3 * 3600, (new Date(s.finalizado_em) - new Date(s.iniciado_em)) / 1000)),
      0,
    );
  const dias = new Set([...cs.map((c) => isoDia(c.data)), ...ss.map((s) => isoDia(s.iniciado_em))]).size;
  const maior = corr.reduce((a, c) => (!a || (+c.distancia_m || 0) > (+a.distancia_m || 0) ? c : a), null);
  const validas = corr.filter((c) => c.tipo !== 'esteira' && c.distancia_m >= 3000 && c.duracao_s);
  const pace = validas.length
    ? validas.reduce((a, c) => a + c.duracao_s, 0) / (validas.reduce((a, c) => a + c.distancia_m, 0) / 1000)
    : null;
  // recordes batidos no período
  const antes = {},
    no = {};
  h.corridas.forEach((c) => {
    const k = isoDia(c.data);
    const alvo = k < ini ? antes : dentro(c.data) ? no : null;
    if (!alvo) return;
    Object.entries(melhoresDaCorrida(c)).forEach(([d, t]) => {
      if (alvo[d] == null || t < alvo[d]) alvo[d] = t;
    });
  });
  const recs = DIST_REC.filter(([d]) => no[d] != null && antes[d] != null && no[d] < antes[d]).map(([d, n]) => ({
    n,
    t: no[d],
    ganho: antes[d] - no[d],
  }));
  const ag = h.agua.filter((a) => a.dia >= ini && a.dia <= fim);
  const litros = ag.reduce((a, x) => a + (+x.ml || 0), 0) / 1000,
    diasMeta = ag.filter((a) => a.meta && a.ml >= a.meta).length;
  const pront = h.pront.filter((p) => p.dia >= ini && p.dia <= fim).length;
  return {
    km,
    nCorr: corr.length,
    nForca: ss.length,
    horas: (segC + segF) / 3600,
    dias,
    maior,
    pace,
    recs,
    litros,
    diasMeta,
    pront,
  };
}
function periodoRetro(k) {
  if (/^\d{4}$/.test(k))
    return {
      ini: k + '-01-01',
      fim: k + '-12-31',
      nome: k,
      ano: true,
      antIni: +k - 1 + '-01-01',
      antFim: +k - 1 + '-12-31',
    };
  const [a, m] = k.split('-').map(Number);
  const ini = `${a}-${String(m).padStart(2, '0')}-01`,
    fim = isoDia(new Date(a, m, 0, 12));
  const ap = m === 1 ? [a - 1, 12] : [a, m - 1];
  const antIni = `${ap[0]}-${String(ap[1]).padStart(2, '0')}-01`,
    antFim = isoDia(new Date(ap[0], ap[1], 0, 12));
  return { ini, fim, nome: MESES_N[m - 1], ano: false, antIni, antFim };
}
function slidesRetro(h, k) {
  const P = periodoRetro(k),
    s = statsPeriodo(h, P.ini, P.fim),
    a = statsPeriodo(h, P.antIni, P.antFim);
  const nome = firstName(S.me.nome),
    de = P.ano ? `de ${P.nome}` : `de ${P.nome}`;
  const sl = [
    {
      eyebrow: `Retrospectiva ${P.ano ? P.nome : P.nome}`,
      titulo: `${nome}, este foi o seu ${P.ano ? 'ano' : 'mês'} na Nexos`,
      texto: `${s.dias} dia${s.dias === 1 ? '' : 's'} de treino ${de}. Vamos ver o que você construiu.`,
      cls: 'r0',
    },
  ];
  if (s.km)
    sl.push({
      eyebrow: 'Corrida',
      grande: f1(s.km),
      unidade: 'km',
      titulo: `em ${s.nCorr} corrida${s.nCorr === 1 ? '' : 's'}`,
      texto: a.km
        ? s.km >= a.km
          ? `${f1(s.km - a.km)} km a mais que no ${P.ano ? 'ano' : 'mês'} anterior.`
          : `No ${P.ano ? 'ano' : 'mês'} anterior foram ${f1(a.km)} km.`
        : '',
      cls: 'r1',
    });
  if (s.horas >= 1)
    sl.push({
      eyebrow: 'Tempo investido',
      grande: s.horas >= 10 ? String(Math.round(s.horas)) : f1(s.horas),
      unidade: 'horas',
      titulo: 'treinando',
      texto: s.nForca
        ? `${s.nForca} treino${s.nForca === 1 ? '' : 's'} de força e ${s.nCorr} corrida${s.nCorr === 1 ? '' : 's'}.`
        : '',
      cls: 'r2',
    });
  if (s.maior && s.maior.distancia_m >= 3000)
    sl.push({
      eyebrow: 'Seu dia mais forte',
      grande: f1(s.maior.distancia_m / 1000),
      unidade: 'km',
      titulo: `em ${fmtDia(isoDia(s.maior.data))}`,
      texto: `${fmtDurLongo(s.maior.duracao_s)} de corrida, a mais longa ${de}.`,
      cls: 'r3',
    });
  if (s.pace && a.pace && Math.abs(a.pace - s.pace) >= 3)
    sl.push({
      eyebrow: 'Evolução do pace',
      grande: fmtPace(s.pace).replace('/km', ''),
      unidade: '/km',
      titulo: s.pace < a.pace ? `${Math.round(a.pace - s.pace)} s/km mais rápido` : 'pace médio',
      texto:
        s.pace < a.pace
          ? `No ${P.ano ? 'ano' : 'mês'} anterior seu pace médio foi ${fmtPace(a.pace)}.`
          : `Pace médio das corridas de 3 km ou mais. Meses de base costumam ser mais leves: é assim que se constrói.`,
      cls: 'r4',
    });
  if (s.recs.length)
    sl.push({
      eyebrow: 'Recordes pessoais',
      titulo: s.recs.length === 1 ? 'Você bateu um recorde' : `Você bateu ${s.recs.length} recordes`,
      linhas: s.recs.map((r) => [r.n, fmtDurLongo(r.t)]),
      cls: 'r5',
    });
  if (s.nForca)
    sl.push({
      eyebrow: 'Força',
      grande: String(s.nForca),
      unidade: s.nForca === 1 ? 'treino' : 'treinos',
      titulo: 'de força concluídos',
      texto: 'Força é o que protege as articulações e sustenta o ritmo no fim da prova.',
      cls: 'r6',
    });
  if (s.litros >= 1)
    sl.push({
      eyebrow: 'Hidratação',
      grande: String(Math.round(s.litros)),
      unidade: 'litros',
      titulo: 'de água registrados',
      texto: s.diasMeta ? `Meta batida em ${s.diasMeta} dia${s.diasMeta === 1 ? '' : 's'}.` : '',
      cls: 'r7',
    });
  const linhas = [
    ['Dias de treino', String(s.dias)],
    ...(s.km ? [['Corrida', f1(s.km) + ' km']] : []),
    ...(s.nForca ? [['Treinos de força', String(s.nForca)]] : []),
    ...(s.horas >= 1 ? [['Horas treinando', f1(s.horas)]] : []),
    ...(s.recs.length ? [['Recordes', String(s.recs.length)]] : []),
    ...(s.litros >= 1 ? [['Água', Math.round(s.litros) + ' L']] : []),
  ];
  sl.push({
    eyebrow: `Seu ${P.ano ? 'ano' : 'mês'} em resumo`,
    titulo: `Retrospectiva ${P.nome}`,
    linhas,
    final: true,
    cls: 'r8',
  });
  return { sl, P, s, linhas };
}
async function viewRetrospectiva(k) {
  loading();
  const h = await historicoAluno(S.user.id);
  if (!k) {
    const meses = [...new Set(datasAtiv(h).map((d) => isoDia(d).slice(0, 7)))].sort().reverse();
    const anos = [...new Set(meses.map((m) => m.slice(0, 4)))];
    $app.innerHTML = `<a class="back" href="#/historico">${I.back} Evolução</a><p class="eyebrow">Retrospectiva</p><h1 class="h1">Suas retrospectivas</h1>
      <p class="small muted" style="margin-top:6px">Toque para ver em tela cheia e gerar o card para o story.</p>
      ${
        meses.length
          ? `<div class="stack" style="margin-top:16px">${anos.map((a) => `<a class="card retro-it ano" href="#/retrospectiva/${a}"><b>${a}</b><span>Retrospectiva do ano</span>${I.chev}</a>`).join('')}${meses
              .map((m) => {
                const st = statsPeriodo(h, periodoRetro(m).ini, periodoRetro(m).fim);
                return `<a class="card retro-it" href="#/retrospectiva/${m}"><b>${MESES_N[+m.slice(5) - 1]} ${m.slice(0, 4)}</b><span>${st.dias} dia${st.dias === 1 ? '' : 's'} de treino${st.km ? ` · ${f1(st.km)} km` : ''}${m === hojeISO().slice(0, 7) ? ' · até agora' : ''}</span>${I.chev}</a>`;
              })
              .join('')}</div>`
          : '<div class="empty" style="margin-top:20px"><div class="h3">Ainda sem treinos registrados</div></div>'
      }`;
    return;
  }
  history.replaceState(history.state, '', '#/retrospectiva');
  await viewRetrospectiva();
  abrirRetro(h, k);
}
function abrirRetro(h, k) {
  const { sl, P, linhas } = slidesRetro(h, k);
  let i = 0,
    tm = null;
  {
    const v = store.get('nx-momentos-' + S.user.id, {});
    v[(/^\d{4}$/.test(k) ? 'ra-' : 'r-') + k] = 1;
    store.set('nx-momentos-' + S.user.id, v);
  } // viu: o card sai da tela Hoje
  const ov = document.createElement('div');
  ov.className = 'retro';
  document.body.append(ov);
  document.body.style.overflow = 'hidden';
  const fecha = () => {
    clearTimeout(tm);
    ov.remove();
    document.body.style.overflow = '';
  };
  const desenha = () => {
    const x = sl[i];
    clearTimeout(tm);
    ov.innerHTML = `<div class="retro-bars">${sl.map((_, j) => `<i class="${j < i ? 'ok' : j === i ? 'at' : ''}"><i></i></i>`).join('')}</div><button class="retro-x" aria-label="Fechar">${I.x}</button>
      <div class="retro-s ${x.cls}"><span class="retro-ey">${esc(x.eyebrow)}</span>${x.grande ? `<div class="retro-big"><b>${x.grande}</b><small>${esc(x.unidade || '')}</small></div>` : ''}<h2>${esc(x.titulo || '')}</h2>${x.texto ? `<p>${esc(x.texto)}</p>` : ''}
      ${x.linhas ? `<div class="retro-l">${x.linhas.map(([l, v]) => `<div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      ${x.final ? `<button class="btn block retro-story" id="rt-story">Gerar card para o story</button>` : ''}</div>`;
    ov.querySelector('.retro-x').onclick = (e) => {
      e.stopPropagation();
      fecha();
    };
    const st = ov.querySelector('#rt-story');
    if (st)
      st.onclick = (e) => {
        e.stopPropagation();
        fecha();
        abrirStory(
          {
            eyebrow: `Retrospectiva ${P.nome}`,
            titulo: P.ano ? `Meu ${P.nome} na Nexos` : `Meu ${P.nome} na Nexos`,
            linhas,
          },
          `retrospectiva-${k}.png`,
        );
      };
    if (!x.final && !semMov())
      tm = setTimeout(() => {
        i++;
        desenha();
      }, 5500);
  };
  ov.onclick = (e) => {
    if (e.target.closest('button')) return;
    const esq = e.clientX < innerWidth * 0.33;
    if (esq) i = Math.max(0, i - 1);
    else if (i < sl.length - 1) i++;
    else return;
    desenha();
  };
  desenha();
}

/* ---------- treino não feito: o aluno conta o motivo (pergunta enviada pelo nx-faltas de manhã) ---------- */
const FALTA_MOT = [
  ['cansaco', 'Cansaço ou fadiga'],
  ['dor', 'Dor ou lesão'],
  ['doenca', 'Doença'],
  ['trabalho', 'Trabalho ou estudo'],
  ['pessoal', 'Compromisso pessoal'],
  ['clima', 'Chuva ou clima'],
  ['sono', 'Dormi mal'],
  ['esqueci', 'Esqueci'],
  ['fiz', 'Fiz, mas não registrei'],
  ['outro', 'Outro motivo'],
];
const faltaMotTxt = (k) => (FALTA_MOT.find((m) => m[0] === k) || [k, k])[1];
const DIA_SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaSemDe = (iso) => DIA_SEM[new Date(iso + 'T12:00:00').getDay()];
async function faltasPendentes() {
  const box = document.getElementById('falta-pend');
  if (!box) return;
  const desde = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const { data } = await sb
    .from('nx_faltas')
    .select('id,dia,treinos')
    .eq('aluno_id', S.user.id)
    .is('respondido_em', null)
    .gte('dia', desde)
    .order('dia', { ascending: false })
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  if (!data || !data.length || !document.getElementById('falta-pend')) return;
  box.innerHTML = data
    .map(
      (f) =>
        `<button type="button" class="list-item falta-row" data-falta="${f.id}" style="width:100%;text-align:left"><span class="ativ-ic">${I.cal}</span><div class="grow"><b>Treino de ${diaSemDe(f.dia)} não registrado</b><div class="small muted">${esc((f.treinos || []).join(' e '))}. Conte o que aconteceu para o seu treinador ajustar a semana.</div></div>${I.chev}</button>`,
    )
    .join('');
  const ps = document.getElementById('pend-sec');
  if (ps) ps.hidden = false;
  box.querySelectorAll('[data-falta]').forEach((b) => {
    b.onclick = () =>
      responderFalta(
        data.find((f) => f.id === b.dataset.falta),
        () => {
          b.remove();
        },
      );
  });
}
function responderFalta(f, depois) {
  if (!f) return;
  let mot = null;
  openSheet(
    `<p class="eyebrow">Treino de ${diaSemDe(f.dia)} · ${fmtCurto(f.dia + 'T12:00:00')}</p><div class="h2" style="margin-top:4px">O que aconteceu?</div>
    <p class="small muted" style="margin-top:6px">${esc((f.treinos || []).join(' e '))} não ${(f.treinos || []).length > 1 ? 'foram registrados' : 'foi registrado'}. Sua resposta vai só para o seu treinador e ajuda a ajustar os próximos treinos.</p>
    <div class="chips" id="fm-ch" style="margin-top:14px;flex-wrap:wrap;overflow:visible">${FALTA_MOT.map(([k, t]) => `<button type="button" class="chip" data-m="${k}">${t}</button>`).join('')}</div>
    <label class="field" style="margin-top:14px"><span>Quer contar mais? (opcional)</span><textarea class="input" id="fm-det" rows="3" maxlength="400" placeholder="Ex.: dor no joelho direito desde quarta"></textarea></label>
    <p class="small" id="fm-fiz" hidden style="margin-top:8px">Depois de enviar, registre o treino em <b>Histórico</b> para ele contar na sua evolução.</p>
    <button class="btn block" id="fm-ok" style="margin-top:14px" disabled>Enviar para o treinador</button>
    <button type="button" class="falta-pular" id="fm-pular">Prefiro não responder</button>
    <p class="tiny dim" style="text-align:center;margin-top:4px">O aviso sai da sua tela. Seu treinador vê apenas que você preferiu não comentar.</p>`,
    (r) => {
      const ok = r.querySelector('#fm-ok');
      r.querySelectorAll('#fm-ch [data-m]').forEach((c) => {
        c.onclick = () => {
          mot = c.dataset.m;
          r.querySelectorAll('#fm-ch [data-m]').forEach((x) => x.classList.toggle('on', x === c));
          ok.disabled = false;
          r.querySelector('#fm-fiz').hidden = mot !== 'fiz';
        };
      });
      // o aluno pode encerrar o aviso sem dar explicação: fica registrado como "Preferiu não responder", sem notificar ninguém
      const pular = r.querySelector('#fm-pular');
      pular.onclick = async () => {
        pular.disabled = true;
        const { error } = await sb
          .from('nx_faltas')
          .update({ motivo: 'Preferiu não responder', detalhe: null, respondido_em: new Date().toISOString() })
          .eq('id', f.id)
          .eq('aluno_id', S.user.id);
        if (error) {
          pular.disabled = false;
          return toast('Não foi possível agora. Tente de novo.', true);
        }
        closeSheet();
        toast('Tudo bem. O aviso foi encerrado.');
        if (depois) depois();
      };
      ok.onclick = async () => {
        if (!mot) return;
        ok.disabled = true;
        ok.textContent = 'Enviando…';
        const det = r.querySelector('#fm-det').value.trim().slice(0, 400) || null;
        const { error } = await sb
          .from('nx_faltas')
          .update({ motivo: faltaMotTxt(mot), detalhe: det, respondido_em: new Date().toISOString() })
          .eq('id', f.id)
          .eq('aluno_id', S.user.id);
        if (error) {
          ok.disabled = false;
          ok.textContent = 'Enviar para o treinador';
          return toast('Não foi possível enviar. Tente de novo.', true);
        }
        sb.functions.invoke('nx-faltas', { body: { acao: 'respondida', id: f.id } }).catch(() => {});
        closeSheet();
        toast('Obrigado! Seu treinador já recebeu.');
        if (depois) depois();
        if (mot === 'fiz') location.hash = '#/historico/corrida';
      };
    },
  );
}
/** treinador: treinos não feitos nos últimos 7 dias, com o motivo que o aluno contou (ou aguardando resposta) */
async function faltasEquipe(ids, porId) {
  const box = document.getElementById('faltas-eq');
  if (!box || !ids.length) return;
  const desde = isoDia(inicioSemana()); // só a semana atual; as anteriores ficam em Semanas anteriores
  const { data } = await sb
    .from('nx_faltas')
    .select('id,aluno_id,dia,treinos,motivo,detalhe,respondido_em,visto_treinador')
    .eq('org_id', S.org.id)
    .in('aluno_id', ids)
    .gte('dia', desde)
    .order('dia', { ascending: false })
    .limit(30)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  if (!data || !data.length || !document.getElementById('faltas-eq')) return;
  const novas = data.filter((f) => f.respondido_em && !f.visto_treinador).length;
  box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Treinos não feitos</h2>${novas ? `<span class="tag acc">${novas} resposta${novas > 1 ? 's' : ''} nova${novas > 1 ? 's' : ''}</span>` : `<a class="link-btn small" href="#/semanas">Semanas anteriores</a>`}</div><div class="stack">${data
    .map((f) => {
      const m = porId[f.aluno_id] || { nome: 'Aluno' };
      return `<a class="list-item" href="#/aluno/${f.aluno_id}" data-javi="falta:${f.id}" data-falta-vista="${f.respondido_em && !f.visto_treinador ? f.id : ''}" style="color:inherit;align-items:flex-start">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(firstName(m.nome))} · ${diaSemDe(f.dia)}</b><div class="small muted">${esc((f.treinos || []).join(' e '))}</div>${f.respondido_em ? `<div class="small" style="margin-top:4px"><b>${esc(f.motivo || '')}</b>${f.detalhe ? `: ${esc(f.detalhe)}` : ''}</div>` : '<div class="small muted" style="margin-top:4px">Aguardando a resposta do aluno</div>'}</div>${f.respondido_em && !f.visto_treinador ? '<i class="alert-dot"></i>' : ''}</a>`;
    })
    .join('')}</div></div>`;
  box.querySelectorAll('[data-falta-vista]').forEach((a) => {
    if (!a.dataset.faltaVista) return;
    a.addEventListener('click', () => {
      sb.from('nx_faltas')
        .update({ visto_treinador: true })
        .eq('id', a.dataset.faltaVista)
        .then(
          () => {},
          () => {},
        );
    });
  });
}
/** seções da Hoje do treinador: seta para ocultar/mostrar (lembra a escolha) e "Mostrar mais" quando a lista é longa.
    Vale também para as seções que carregam depois (faltas, sugestões, datas especiais). */
let obsRecolhe = null;
const recAbertas = new Set(); // listas que o treinador expandiu nesta visita
function vigiarRecolhiveis() {
  if (obsRecolhe) obsRecolhe.disconnect();
  let agendado = false;
  const roda = () => {
    agendado = false;
    if (!/^#?\/?$/.test(location.hash)) {
      obsRecolhe.disconnect();
      return;
    }
    jaViAplicar($app);
    recolhiveis($app);
  };
  obsRecolhe = new MutationObserver(() => {
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(roda);
    }
  });
  obsRecolhe.observe($app, { childList: true, subtree: true });
  jaViAplicar($app);
  recolhiveis($app);
}
function recolhiveis(raiz) {
  const SETA =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
  raiz.querySelectorAll('.section').forEach((sec) => {
    if (sec.dataset.recolhe || sec.querySelector('#ocultar-ativ')) return;
    const cab = sec.querySelector(':scope > .section-h'),
      h = cab && cab.querySelector('h2');
    if (!h) return;
    sec.dataset.recolhe = '1';
    const nome = h.textContent.trim(),
      chave =
        'nx_sec_' +
        nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[^a-z0-9]+/g, '_');
    const corpo = document.createElement('div');
    corpo.className = 'sec-corpo';
    while (cab.nextSibling) corpo.appendChild(cab.nextSibling);
    sec.appendChild(corpo);
    // lista principal da seção: a que tem mais itens
    const listas = [corpo, ...corpo.querySelectorAll('.stack, .card.ativ, .list')];
    const lista = listas.reduce((a, b) => (b.children.length > a.children.length ? b : a), corpo);
    const itens = [...lista.children].filter((x) => !x.matches('button'));
    const LIM = 5;
    if (itens.length > LIM + 1) {
      const bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'link-btn small sec-mais';
      const pinta = () => {
        const ab = recAbertas.has(chave);
        itens.forEach((x, i) => {
          x.hidden = !ab && i >= LIM;
        });
        bt.textContent = ab ? 'Mostrar menos' : `Mostrar mais ${itens.length - LIM}`;
      };
      bt.onclick = () => {
        recAbertas.has(chave) ? recAbertas.delete(chave) : recAbertas.add(chave);
        pinta();
      };
      lista.after(bt);
      pinta();
    }
    const qtd = itens.length;
    const aviso = document.createElement('p');
    aviso.className = 'small muted sec-oculta';
    aviso.textContent = `${qtd > 1 ? qtd + ' itens ocultos' : qtd === 1 ? '1 item oculto' : 'Seção oculta'}. Toque na seta para mostrar.`;
    sec.appendChild(aviso);
    const ob = document.createElement('button');
    ob.type = 'button';
    ob.className = 'ocultar-btn';
    ob.innerHTML = SETA;
    const aplica = () => {
      const f = !!store.get(chave, false);
      corpo.hidden = f;
      aviso.hidden = !f;
      ob.classList.toggle('fechado', f);
      ob.title = f ? 'Mostrar' : 'Ocultar';
      ob.setAttribute('aria-label', `${f ? 'Mostrar' : 'Ocultar'} ${nome}`);
    };
    ob.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      store.set(chave, !store.get(chave, false));
      aplica();
    };
    // a seta fica à direita, junto do que já existia no cabeçalho
    const extras = [...cab.children].filter((x) => x !== h);
    const lado = document.createElement('div');
    lado.className = 'row';
    lado.style.cssText = 'gap:6px;align-items:center';
    extras.forEach((x) => lado.appendChild(x));
    lado.appendChild(ob);
    cab.appendChild(lado);
    aplica();
  });
}
/** abertas pela notificação: o aluno cai direto na pergunta; o treinador, direto na resposta */
async function abrirFaltaAluno(dia) {
  history.replaceState(null, '', location.pathname + '#/');
  let q = sb.from('nx_faltas').select('id,dia,treinos,respondido_em').eq('aluno_id', S.user.id);
  q = /^\d{4}-\d{2}-\d{2}$/.test(dia || '')
    ? q.eq('dia', dia)
    : q.is('respondido_em', null).order('dia', { ascending: false });
  const { data } = await q.limit(1).then(
    (r) => r,
    () => ({ data: [] }),
  );
  const f = data && data[0];
  if (!f) return;
  if (f.respondido_em) return toast('Você já contou o motivo desse treino. Obrigado!');
  responderFalta(f, () => {
    const b = document.querySelector(`[data-falta="${f.id}"]`);
    if (b) b.remove();
  });
}
async function abrirFaltaStaff(id) {
  history.replaceState(null, '', location.pathname + '#/');
  const { data: f } = await sb
    .from('nx_faltas')
    .select('id,aluno_id,dia,treinos,motivo,detalhe,respondido_em')
    .eq('id', id)
    .maybeSingle()
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  if (!f) return rolarAte('faltas-eq');
  const { data: m } = await sb
    .from('nx_membros')
    .select('nome')
    .eq('org_id', S.org.id)
    .eq('user_id', f.aluno_id)
    .maybeSingle()
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  const nome = firstName((m && m.nome) || 'Aluno');
  if (f.respondido_em)
    sb.from('nx_faltas')
      .update({ visto_treinador: true })
      .eq('id', f.id)
      .then(
        () => {},
        () => {},
      );
  openSheet(
    `<p class="eyebrow">Treino de ${diaSemDe(f.dia)} · ${fmtCurto(f.dia + 'T12:00:00')}</p><div class="h2" style="margin-top:4px">${esc(nome)} ${f.respondido_em ? (f.motivo === 'Preferiu não responder' ? 'preferiu não comentar a falta' : 'explicou a falta') : 'ainda não respondeu'}</div>
    <p class="small muted" style="margin-top:6px">${esc((f.treinos || []).join(' e '))}</p>
    ${f.respondido_em ? `<div class="card" style="margin-top:14px"><b>${esc(f.motivo || '')}</b>${f.detalhe ? `<p style="margin-top:6px">${esc(f.detalhe)}</p>` : ''}</div>` : ''}
    <div id="sug-falta"></div>
    <div class="stack" style="margin-top:14px"><a class="btn block" href="#/aluno/${f.aluno_id}/conversa">Responder na conversa</a><a class="btn block ghost" href="#/aluno/${f.aluno_id}">Ver aluno</a></div>`,
    (r) =>
      cartaoSugestao(r.querySelector('#sug-falta'), {
        chave: 'sug:falta:' + f.id + (f.respondido_em ? ':r' : ''),
        titulo: 'Sugestão de resposta',
        texto: sugestaoFalta(f, m && m.nome),
        destino: 'Abre a conversa com o aluno com a mensagem no campo, para você editar e enviar.',
        usar: (t) => {
          closeSheet(true);
          abrirConversaCom(f.aluno_id, t);
        },
      }),
  );
}
/** rola até uma seção que carrega depois da tela (espera até 4 s) */
function rolarAte(id) {
  let n = 0;
  const t = setInterval(() => {
    const el = document.getElementById(id);
    if ((el && el.childElementCount) || ++n > 20) {
      clearInterval(t);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 200);
}
/* ---------- 4) replay do percurso ---------- */
// mapa de verdade por baixo do percurso (OpenFreeMap, o mesmo da tela do GPS): monta fora da tela, tira uma "foto" e devolve
// a imagem e a posição de cada ponto do percurso nela. Sem internet ou sem suporte, o replay segue sem o mapa.
async function mapaDoPercurso(R, w, h) {
  let box = null,
    mapa = null;
  try {
    await carregarMapaLib();
    box = document.createElement('div');
    box.style.cssText = `position:fixed;left:-30000px;top:0;width:${w}px;height:${h}px;pointer-events:none`;
    document.body.append(box);
    mapa = new window.maplibregl.Map({
      container: box,
      style: 'https://tiles.openfreemap.org/styles/dark',
      pixelRatio: 1,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });
    const lats = R.map((p) => p[0]),
      lons = R.map((p) => p[1]);
    mapa.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: { top: 150, bottom: 150, left: 110, right: 110 }, animate: false, maxZoom: 16.5 },
    );
    await new Promise((ok, er) => {
      const t = setTimeout(() => er(new Error('tempo')), 9000);
      mapa.once('idle', () => {
        clearTimeout(t);
        ok();
      });
    });
    const img = document.createElement('canvas');
    img.width = w;
    img.height = h;
    img.getContext('2d').drawImage(mapa.getCanvas(), 0, 0, w, h);
    const P = R.map(([la, lo]) => {
      const q = mapa.project([lo, la]);
      return [q.x, q.y];
    });
    return { img, P };
  } catch {
    return null;
  } finally {
    try {
      mapa && mapa.remove();
    } catch {}
    if (box) box.remove();
  }
}
const REPLAY_MODOS = [
  ['classico', 'Clássico'],
  ['sat', 'Satélite 3D Nexos'],
  ['sat-segue', 'Satélite seguindo'],
  ['3d', '3D noturno'],
  ['3d-real', '3D realista'],
];
// chave do mapa de satélite (Esri): fica no banco, só para quem está logado, e só funciona no domínio da Nexos
let chaveMapaP = null;
const chaveMapa = () =>
  (chaveMapaP =
    chaveMapaP ||
    sb.rpc('nx_config_mapa').then(
      (r) => r.data || null,
      () => null,
    ));
const SAT_FONTES = [
  (k) => `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${k}`,
  (k) =>
    `https://static-map-tiles-api.arcgis.com/arcgis/rest/services/static-basemap-tiles-service/v1/arcgis/imagery/static/tile/{z}/{y}/{x}?token=${k}`,
];
// testa um pedaço de imagem de cada endereço e usa o primeiro que responder (chave válida e dentro do limite)
async function fonteSatelite(lon, lat) {
  const k = await chaveMapa();
  if (!k) return null;
  const z = 15,
    n = 2 ** z,
    tx = Math.floor(((lon + 180) / 360) * n),
    r = (lat * Math.PI) / 180,
    ty = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  for (const f of SAT_FONTES) {
    const url = f(k);
    try {
      const resp = await fetch(url.replace('{z}', z).replace('{y}', ty).replace('{x}', tx));
      if (resp.ok && /^image\//.test(resp.headers.get('content-type') || ''))
        return { url, tam: /static-map-tiles/.test(url) ? 512 : 256 };
    } catch {}
  }
  return null;
}
// distância da câmera nos modos 3D (soma no zoom do mapa)
const ZOOM_CAM = [
  ['perto', 'Perto'],
  ['medio', 'Médio'],
  ['longe', 'Longe'],
];
// biblioteca que monta o arquivo .mp4 do vídeo salvo (mp4-muxer, código aberto); só carrega ao salvar
let MUX_LIB = null;
const carregarMux = () =>
  MUX_LIB ||
  (MUX_LIB = new Promise((ok, er) => {
    if (window.Mp4Muxer) return ok();
    const sc = document.createElement('script');
    sc.src = new URL('vendor/mp4-muxer.js', document.baseURI).href;
    sc.onload = () => ok();
    sc.onerror = () => {
      MUX_LIB = null;
      er(new Error('mux'));
    };
    document.head.append(sc);
  }));
function abrirReplay(c, perfil) {
  const R = c.rota;
  if (!R || R.length < 10) return;
  const ov = document.createElement('div');
  ov.className = 'replay';
  document.body.append(ov);
  document.body.style.overflow = 'hidden';
  ov.innerHTML = `<button class="retro-x" aria-label="Fechar">${I.x}</button><canvas id="rp-cv"></canvas>
    <div class="replay-modos" role="radiogroup" aria-label="Estilo do vídeo">${REPLAY_MODOS.map(([k, n]) => `<button type="button" data-rpm="${k}" class="${k === 'classico' ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="replay-vel" role="radiogroup" aria-label="Velocidade do vídeo"><span>Velocidade</span>${[0.5, 1, 2].map((v) => `<button type="button" data-rpv="${v}" class="${v === 1 ? 'on' : ''}">${String(v).replace('.', ',')}x</button>`).join('')}</div>
    <div class="replay-vel replay-zoom" role="radiogroup" aria-label="Distância da câmera" hidden><span>Câmera</span>${ZOOM_CAM.map(([k, n]) => `<button type="button" data-rpz="${k}">${n}</button>`).join('')}</div>
    <div class="replay-bts"><button class="btn ghost sm" id="rp-de-novo">Repetir</button><button class="btn ghost sm" id="rp-det">Detalhes</button><button class="btn sm" id="rp-video">Salvar vídeo</button></div>`;
  const cv = ov.querySelector('#rp-cv'),
    W = 1080,
    H = 1920;
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  let raf = 0;
  let vel = 1; // velocidade do vídeo: 0,5x, 1x ou 2x
  let zoomCam = store.get('nx-replay-zoom', 'medio'); // nos modos 3D: câmera perto, média ou longe
  let modo = 'classico',
    m3 = null; // mapa 3D ao vivo (só nos modos 3D)
  const ehSat = () => modo === 'sat' || modo === 'sat-segue';
  const bv = ov.querySelector('#rp-video');
  const fecha = () => {
    cancelAnimationFrame(raf);
    fechar3D();
    ov.remove();
    document.body.style.overflow = '';
  };
  ov.querySelector('.retro-x').onclick = fecha;
  const rc = coresRotaPace(c, perfil);
  const cores = rc && rc.cores;
  // projeção do percurso na caixa do mapa
  const lats = R.map((p) => p[0]),
    lons = R.map((p) => p[1]),
    la0 = Math.min(...lats),
    la1 = Math.max(...lats),
    lo0 = Math.min(...lons),
    lo1 = Math.max(...lons);
  const kk = Math.cos((((la0 + la1) / 2) * Math.PI) / 180),
    bw = Math.max((lo1 - lo0) * kk, 1e-6),
    bh = Math.max(la1 - la0, 1e-6);
  const BX = 90,
    BY = 440,
    BW = 900,
    BH = 940,
    sc = Math.min(BW / bw, BH / bh),
    ox = BX + (BW - bw * sc) / 2,
    oy = BY + (BH - bh * sc) / 2;
  let P = R.map(([la, lo]) => [ox + (lo - lo0) * kk * sc, oy + (la1 - la) * sc]);
  const P0 = P;
  const MY = 400,
    MH = 1060;
  let fundoMapa = null; // faixa do mapa real: de cima do título até os números
  const dist = +c.distancia_m || 0,
    dur = +c.duracao_s || 0,
    DUR = 9000;
  const ser = c.analise && c.analise.serie;
  const faixa = document.createElement('canvas');
  faixa.width = W;
  faixa.height = MH;
  const fx = faixa.getContext('2d');
  // números ao vivo: distância, tempo e pace no ponto k do percurso
  const vivo = (k) => {
    const dk = dist * k,
      tk = dur * k;
    let pc = dk > 50 ? tk / (dk / 1000) : null,
      j = -1;
    if (ser && ser.t) {
      j = ser.t.findIndex((t) => t >= tk);
      if (j < 0) j = ser.t.length - 1;
    }
    // na chegada o vídeo para nos números do treino todo: pace médio (e não o do último trecho)
    const final = k >= 0.999;
    if (final) pc = dist > 50 ? dur / (dist / 1000) : pc;
    else if (j >= 0 && ser.vel) {
      const vs = ser.vel.slice(Math.max(0, j - 3), j + 3).filter((v) => v > 0.8);
      if (vs.length) pc = 1000 / (vs.reduce((a, b) => a + b, 0) / vs.length);
    }
    return { dk, tk, pc, j, final };
  };
  // ---------- detalhes: o aluno escolhe até 3 números para aparecer no vídeo ----------
  const temS = (k) => !!(ser && Array.isArray(ser[k]) && ser[k].some((v) => v != null && v > 0));
  const perto = (arr, j) => {
    if (!arr || j < 0) return null;
    const v = arr.slice(Math.max(0, j - 3), j + 4).filter((y) => y != null && y > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  // subida acumulada até cada ponto (ignora oscilações menores que 1 m)
  const subAc = [];
  if (temS('alt')) {
    let b = null,
      acc = 0;
    ser.alt.forEach((a, i) => {
      if (a != null) {
        if (b == null) b = a;
        else if (a - b >= 1) {
          acc += a - b;
          b = a;
        } else if (b - a >= 1) b = a;
      }
      subAc[i] = acc;
    });
  }
  const DETALHES = [
    { id: 'dist', n: 'Distância', d: 'Quanto já percorreu', ok: true, v: (q) => [f1(q.dk / 1000), 'km'] },
    { id: 'tempo', n: 'Tempo', d: 'Tempo de corrida até o ponto', ok: true, v: (q) => [fmtDurLongo(q.tk), ''] },
    {
      id: 'pace',
      n: 'Pace',
      d: 'Ritmo naquele trecho',
      ok: true,
      v: (q) => [q.pc ? fmtPace(q.pc).replace('/km', '') : '–', '/km'],
    },
    {
      id: 'vel',
      n: 'Velocidade',
      d: 'Em km por hora',
      ok: true,
      v: (q) => [q.pc ? (3600 / q.pc).toFixed(1).replace('.', ',') : '–', 'km/h'],
    },
    {
      id: 'fc',
      n: temS('fc') ? 'Freq. cardíaca' : 'FC média',
      d: temS('fc') ? 'Batimentos naquele trecho' : 'Média do treino (o relógio não mandou o gráfico)',
      ok: temS('fc') || !!c.fc_media,
      v: (q) => {
        const f = temS('fc') ? perto(ser.fc, q.j) : c.fc_media;
        return [f ? Math.round(f) : '–', 'bpm'];
      },
    },
    {
      id: 'cad',
      n: temS('cad') ? 'Cadência' : 'Cadência média',
      d: temS('cad') ? 'Passos por minuto naquele trecho' : 'Média do treino',
      ok: temS('cad') || !!c.cadencia,
      v: (q) => {
        const f = temS('cad') ? perto(ser.cad, q.j) : c.cadencia;
        return [f ? Math.round(f) : '–', 'ppm'];
      },
    },
    {
      id: 'alt',
      n: 'Altitude',
      d: 'Altura em relação ao mar',
      ok: temS('alt'),
      v: (q) => [Math.round(perto(ser.alt, q.j) ?? 0), 'm'],
    },
    {
      id: 'sub',
      n: 'Subida',
      d: 'Quanto já subiu no percurso',
      ok: temS('alt'),
      v: (q) => [Math.round(subAc[q.j] || 0), 'm'],
    },
    {
      id: 'pot',
      n: 'Potência',
      d: 'Força medida pelo relógio',
      ok: temS('pot'),
      v: (q) => [Math.round(perto(ser.pot, q.j) ?? 0), 'W'],
    },
  ];
  let det = (store.get('nx-replay-det', null) || ['dist', 'tempo', 'pace'])
    .filter((id) => DETALHES.some((m) => m.id === id && m.ok))
    .slice(0, 3);
  if (!det.length) det = ['dist', 'tempo', 'pace'];
  // colunas na ordem da lista: [rótulo, valor, unidade]
  const colunas = (k) => {
    const q = vivo(k);
    const MEDIA = { pace: 'Pace médio', vel: 'Vel. média', fc: 'FC média', cad: 'Cadência média' };
    return DETALHES.filter((m) => det.includes(m.id)).map((m) => {
      let v = m.v(q);
      if (q.final && m.id === 'fc' && c.fc_media) v = [Math.round(c.fc_media), 'bpm'];
      if (q.final && m.id === 'cad' && c.cadencia) v = [Math.round(c.cadencia), 'ppm'];
      return [q.final && MEDIA[m.id] ? MEDIA[m.id] : m.n, ...v.map(String)];
    });
  };
  // modo satélite (estilo dos vídeos de prova): mapa na tela inteira, números em cima, câmera de drone
  const desenhaSat = (k) => {
    x.drawImage(m3.map.getCanvas(), 0, 0, W, H);
    let g = x.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, 'rgba(3,8,20,.9)');
    g.addColorStop(0.55, 'rgba(3,8,20,.5)');
    g.addColorStop(1, 'rgba(3,8,20,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, 760);
    g = x.createLinearGradient(0, H - 440, 0, H);
    g.addColorStop(0, 'rgba(3,8,20,0)');
    g.addColorStop(1, 'rgba(3,8,20,.88)');
    x.fillStyle = g;
    x.fillRect(0, H - 440, W, 440);
    P = R.map(([la, lo]) => {
      const q = m3.map.project([lo, la]);
      return [q.x, q.y];
    });
    const n = Math.max(1, Math.floor(k * (P.length - 1)));
    let [px, py] = P[n];
    if (n < P.length - 1) {
      const fr = k * (P.length - 1) - n;
      px += (P[n + 1][0] - px) * fr;
      py += (P[n + 1][1] - py) * fr;
    }
    x.save();
    x.beginPath();
    x.rect(0, 560, W, H - 560);
    x.clip();
    x.lineCap = 'round';
    x.lineJoin = 'round';
    const segue = modo === 'sat-segue';
    if (segue) {
      // estilo perseguição: o percurso inteiro em vermelho forte, com contorno escuro, e o ponto branco por cima
      const linha = (larg, cor) => {
        x.strokeStyle = cor;
        x.lineWidth = larg;
        x.beginPath();
        P.forEach(([a, b], j) => (j ? x.lineTo(a, b) : x.moveTo(a, b)));
        x.stroke();
      };
      linha(30, 'rgba(60,8,0,.55)');
      linha(20, '#ff3b1f');
      x.fillStyle = '#ff3b1f';
      x.beginPath();
      x.arc(px, py, 24, 0, 7);
      x.fill();
      x.fillStyle = '#fff';
      x.beginPath();
      x.arc(px, py, 16, 0, 7);
      x.fill();
      x.fillStyle = '#ff3b1f';
      x.beginPath();
      x.arc(px, py, 7, 0, 7);
      x.fill();
      x.restore();
    }
    // o percurso todo bem leve; a parte já corrida grossa, com contorno escuro para destacar no satélite
    if (!segue) {
      x.strokeStyle = 'rgba(255,255,255,.28)';
      x.lineWidth = 6;
      x.beginPath();
      P.forEach(([a, b], j) => (j ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.stroke();
      const feito = (larg, cor) => {
        x.lineWidth = larg;
        for (let j = 1; j <= n; j++) {
          x.strokeStyle = cor || (cores ? cores[j - 1] : corP().p1);
          x.beginPath();
          x.moveTo(P[j - 1][0], P[j - 1][1]);
          x.lineTo(j === n ? px : P[j][0], j === n ? py : P[j][1]);
          x.stroke();
        }
      };
      feito(24, 'rgba(0,0,0,.4)');
      x.shadowColor = corP().p1;
      x.shadowBlur = 18;
      feito(15);
      x.shadowBlur = 0;
      const gl = x.createRadialGradient(px, py, 2, px, py, 46);
      gl.addColorStop(0, 'rgba(255,255,255,.9)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gl;
      x.beginPath();
      x.arc(px, py, 46, 0, 7);
      x.fill();
      x.fillStyle = corP().p1;
      x.beginPath();
      x.arc(px, py, 19, 0, 7);
      x.fill();
      x.fillStyle = '#fff';
      x.beginPath();
      x.arc(px, py, 12, 0, 7);
      x.fill();
      x.restore();
    }
    // título e data
    x.textAlign = 'center';
    x.fillStyle = '#fff';
    x.font = "600 50px 'Unbounded'";
    x.fillText(quebraTexto(x, c.titulo || 'Minha corrida', 920)[0], W / 2, 270);
    x.fillStyle = corP().p1;
    x.font = "700 28px 'Manrope'";
    try {
      x.letterSpacing = '6px';
    } catch {}
    x.fillText(`${fmtDia(isoDia(c.data))}`.toUpperCase(), W / 2, 325);
    try {
      x.letterSpacing = '0px';
    } catch {}
    // números ao vivo, em três colunas
    const cs = colunas(k);
    cs.forEach(([l, v, u], j) => {
      const cx = (W / cs.length) * (j + 0.5);
      x.textAlign = 'center';
      x.font = "600 30px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.fillText(l, cx, 420);
      x.font = "600 68px 'Unbounded'";
      x.fillStyle = '#fff';
      x.fillText(v, cx, 500);
      if (u) {
        x.font = "700 28px 'Manrope'";
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.fillText(u, cx, 545);
      }
    });
    x.textAlign = 'left';
    x.font = "700 32px 'Manrope'";
    x.fillStyle = '#fff';
    x.fillText(S.staff ? '' : S.me.nome || '', 90, H - 160);
    x.font = "500 28px 'Manrope'";
    x.fillStyle = 'rgba(255,255,255,.7)';
    x.fillText('Treino acompanhado pela Nexos Performance e Saúde', 90, H - 112);
    x.font = "500 19px 'Manrope'";
    x.fillStyle = 'rgba(255,255,255,.55)';
    x.fillText('Powered by Esri · Imagem: Esri, Maxar, Earthstar Geographics · Relevo: Mapzen/AWS', 90, H - 52);
  };
  // fim do vídeo no satélite: a câmera sobe para mostrar o percurso inteiro e entra o cartão da Nexos
  const cartaoFinal = (a) => {
    x.save();
    x.globalAlpha = a;
    fundoStory(x, W, H);
    if (logo) {
      const h = 120,
        w = (logo.width / logo.height) * h;
      x.drawImage(logo, (W - w) / 2, H / 2 - 160, w, h);
    }
    x.textAlign = 'center';
    x.fillStyle = '#fff';
    x.font = "600 46px 'Unbounded'";
    x.fillText(`${f1(dist / 1000)} km · ${fmtDurLongo(dur)}`, W / 2, H / 2 + 60);
    x.font = "500 30px 'Manrope'";
    x.fillStyle = 'rgba(255,255,255,.7)';
    x.fillText('Treino acompanhado pela Nexos Performance e Saúde', W / 2, H / 2 + 120);
    x.restore();
  };
  const desenha = (k) => {
    if (ehSat() && m3 && m3.pronto) return desenhaSat(k);
    fundoStory(x, W, H);
    if (m3 && m3.pronto) {
      // mapa 3D: a câmera já foi posicionada; copia o quadro e apaga as bordas de cima e de baixo
      fx.globalCompositeOperation = 'source-over';
      fx.clearRect(0, 0, W, MH);
      fx.drawImage(m3.map.getCanvas(), 0, 0, W, MH);
      if (modo === '3d') {
        fx.globalCompositeOperation = 'multiply';
        fx.fillStyle = '#3a5aa0';
        fx.fillRect(0, 0, W, MH);
      }
      const ms = fx.createLinearGradient(0, 0, 0, MH);
      ms.addColorStop(0, 'rgba(0,0,0,0)');
      ms.addColorStop(0.16, 'rgba(0,0,0,1)');
      ms.addColorStop(0.82, 'rgba(0,0,0,1)');
      ms.addColorStop(1, 'rgba(0,0,0,0)');
      fx.globalCompositeOperation = 'destination-in';
      fx.fillStyle = ms;
      fx.fillRect(0, 0, W, MH);
      x.drawImage(faixa, 0, MY);
      x.textAlign = 'right';
      x.font = "500 20px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.5)';
      x.fillText('© OpenStreetMap · OpenFreeMap', W - 40, MY + MH - 30);
      P = R.map(([la, lo]) => {
        const q = m3.map.project([lo, la]);
        return [q.x, q.y + MY];
      });
    } else if (fundoMapa) {
      // mapa escuro, puxado para o azul da Nexos, sumindo em cima e embaixo
      x.drawImage(fundoMapa.vis, 0, MY);
      x.textAlign = 'right';
      x.font = "500 20px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.4)';
      x.fillText('© OpenStreetMap · OpenFreeMap', W - 40, MY + MH - 30);
    }
    x.textAlign = 'left';
    x.fillStyle = corP().p1;
    x.font = "700 34px 'Manrope'";
    try {
      x.letterSpacing = '7px';
    } catch {}
    x.fillText(`${fmtDia(isoDia(c.data))}`.toUpperCase(), 90, 230);
    try {
      x.letterSpacing = '0px';
    } catch {}
    x.fillStyle = '#fff';
    x.font = "600 64px 'Unbounded'";
    quebraTexto(x, c.titulo || 'Minha corrida', 900)
      .slice(0, 2)
      .forEach((l, j) => x.fillText(l, 90, 320 + j * 76));
    const em3 = m3 && m3.pronto;
    if (em3) {
      x.save();
      x.beginPath();
      x.rect(0, MY + 40, W, MH - 80);
      x.clip();
    }
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.strokeStyle = fundoMapa || em3 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.14)';
    x.lineWidth = fundoMapa ? 10 : 14;
    x.beginPath();
    P.forEach(([a, b], j) => (j ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.stroke();
    const n = Math.max(1, Math.floor(k * (P.length - 1)));
    x.lineWidth = fundoMapa ? 12 : 16;
    if (fundoMapa) {
      x.save();
      x.shadowColor = cores ? 'rgba(70,214,255,.55)' : corP().p1;
      x.shadowBlur = 22;
    }
    for (let j = 1; j <= n; j++) {
      x.strokeStyle = cores ? cores[j - 1] : corP().p1;
      x.beginPath();
      x.moveTo(P[j - 1][0], P[j - 1][1]);
      x.lineTo(P[j][0], P[j][1]);
      x.stroke();
    }
    if (fundoMapa) x.restore();
    let [px, py] = P[n];
    if (em3 && n < P.length - 1) {
      // no 3D o ponto anda suave entre as amostras do GPS (a câmera segue o mesmo ponto)
      const fr = k * (P.length - 1) - n;
      px += (P[n + 1][0] - px) * fr;
      py += (P[n + 1][1] - py) * fr;
    }
    const gl = x.createRadialGradient(px, py, 2, px, py, 50);
    gl.addColorStop(0, 'rgba(255,255,255,.95)');
    gl.addColorStop(1, 'rgba(70,214,255,0)');
    x.fillStyle = gl;
    x.beginPath();
    x.arc(px, py, 50, 0, 7);
    x.fill();
    x.fillStyle = '#fff';
    x.beginPath();
    x.arc(px, py, 14, 0, 7);
    x.fill();
    if (em3) x.restore();
    // números ao vivo (os que o aluno escolheu em Detalhes)
    const cols = colunas(k);
    cols.forEach(([l, v, u], j) => {
      const cx = 90 + j * (cols.length === 3 ? 320 : cols.length === 2 ? 450 : 0);
      x.textAlign = 'left';
      x.font = "500 34px 'Manrope'";
      x.fillStyle = 'rgba(255,255,255,.65)';
      x.fillText(l, cx, 1530);
      x.font = "600 64px 'Unbounded'";
      x.fillStyle = '#fff';
      x.fillText(v, cx, 1615);
      if (u) {
        const w = x.measureText(v).width;
        x.font = "700 32px 'Manrope'";
        x.fillStyle = 'rgba(255,255,255,.7)';
        x.fillText(u, cx + w + 8, 1615);
      }
    });
    x.font = "700 32px 'Manrope'";
    x.fillStyle = '#fff';
    x.fillText(S.staff ? '' : S.me.nome || '', 90, H - 150);
    x.font = "500 28px 'Manrope'";
    x.fillStyle = 'rgba(255,255,255,.6)';
    x.fillText('Treino acompanhado pela Nexos Performance e Saúde', 90, H - 100);
  };
  let logo = null;
  logoNx().then((l) => {
    logo = l;
  });
  // linha do tempo do vídeo: cada quadro sai do instante (ms), sem depender da velocidade do celular.
  // Assim a prévia e o vídeo salvo seguem o mesmo roteiro, e o vídeo salvo pode ser gerado quadro a quadro.
  const PARADO = 1800,
    SUBIDA = 4200;
  const roteiro = () => {
    const d3 = !!(m3 && m3.pronto),
      sat = d3 && ehSat(),
      corre = (d3 ? Math.min(24000, Math.max(13000, (dist / 1000) * 2600)) : DUR) / vel;
    return { d3, sat, corre, fim: corre + (sat ? PARADO + SUBIDA : 0), segura: sat ? 900 : 1500, de: null };
  };
  // no 3D a velocidade é quase constante (só suaviza a saída e a chegada)
  const curva = (rt, k) =>
    rt.d3
      ? k < 0.06
        ? (k * k) / 0.12
        : k > 0.94
          ? 1 - ((1 - k) * (1 - k)) / 0.12
          : k
      : k < 0.5
        ? 2 * k * k
        : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const marcaLogo = (centro) => {
    if (!logo) return;
    const h = 48,
      w = (logo.width / logo.height) * h;
    x.drawImage(logo, centro ? (W - w) / 2 : 90, 110, w, h);
  };
  // posiciona a câmera do mapa no instante ms; devolve true quando ela mexeu (o mapa precisa ser redesenhado)
  const cameraQuadro = (rt, ms, dt) => {
    if (!rt.d3) return false;
    if (ms <= rt.corre) {
      const e = curva(rt, Math.min(1, ms / rt.corre));
      (modo === 'sat-segue' ? cameraSegue : modo === 'sat' ? cameraSat : camera3D)(e, dt);
      return true;
    }
    if (!rt.sat || ms <= rt.corre + PARADO) return false; // parado na chegada com o pace médio na tela
    // a câmera sobe para mostrar o percurso inteiro
    if (!rt.de)
      rt.de = {
        c: m3.map.getCenter(),
        z: m3.map.getZoom(),
        b: m3.map.getBearing(),
        p: m3.map.getPitch(),
        pad: (m3.map.getPadding() || {}).top || 0,
      };
    const de = rt.de,
      ate = m3.vista,
      q = Math.min(1, (ms - rt.corre - PARADO) / SUBIDA),
      s1 = Math.min(1, q / 0.62),
      e = s1 < 0.5 ? 2 * s1 * s1 : 1 - Math.pow(-2 * s1 + 2, 2) / 2;
    m3.map.jumpTo({
      center: [de.c.lng + (ate.c[0] - de.c.lng) * e, de.c.lat + (ate.c[1] - de.c.lat) * e],
      zoom: de.z + (ate.z - de.z) * e,
      bearing: de.b + 25 * e,
      pitch: de.p + (45 - de.p) * e,
      padding: { top: de.pad * (1 - e), bottom: 0, left: 0, right: 0 },
    });
    return true;
  };
  const pintaQuadro = (rt, ms) => {
    if (ms <= rt.corre || !rt.sat) {
      desenha(curva(rt, Math.min(1, ms / rt.corre)));
      marcaLogo(rt.sat);
      return;
    }
    desenhaSat(1);
    marcaLogo(true);
    const q = (ms - rt.corre - PARADO) / SUBIDA;
    if (q > 0.72) cartaoFinal(Math.min(1, (q - 0.72) / 0.2));
  };
  const tocar = (aoFim) => {
    cancelAnimationFrame(raf);
    const rt = roteiro();
    if (rt.d3) m3.rumo = null;
    let t0 = null,
      ant = 0;
    const f = (t) => {
      if (t0 == null) t0 = t;
      const ms = Math.min(rt.fim, t - t0);
      // redesenha o mapa na hora, junto com a câmera: o percurso não "escorrega" em cima da imagem
      if (cameraQuadro(rt, ms, ms - ant)) m3.map.redraw();
      ant = ms;
      pintaQuadro(rt, ms);
      if (ms < rt.fim) raf = requestAnimationFrame(f);
      else if (aoFim) setTimeout(aoFim, rt.segura);
    };
    raf = requestAnimationFrame(f);
  };
  // espera o mapa ter todas as imagens do quadro antes de desenhar (só no vídeo salvo)
  const mapaPronto = async () => {
    const map = m3.map,
      t0 = performance.now();
    map.redraw();
    while (!map.areTilesLoaded() && performance.now() - t0 < 3000) {
      await new Promise((ok) => setTimeout(ok, 40));
      map.redraw();
    }
  };
  // vídeo salvo gerado quadro a quadro, 30 por segundo, com o tempo de cada quadro marcado:
  // fica liso mesmo em celular mais lento (ele só demora mais para ficar pronto)
  const FPS = 30;
  const configVideo = async () => {
    if (!window.VideoEncoder || !window.VideoFrame) return null;
    for (const codec of ['avc1.640028', 'avc1.64002a', 'avc1.4d0028', 'avc1.42e028', 'avc1.640033']) {
      const cfg = {
        codec,
        width: W,
        height: H,
        bitrate: ehSat() ? 10000000 : 6000000,
        framerate: FPS,
        avc: { format: 'avc' },
      };
      try {
        if ((await window.VideoEncoder.isConfigSupported(cfg)).supported) return cfg;
      } catch {}
    }
    return null;
  };
  const gerarVideo = async (cfg, aoAvancar) => {
    await carregarMux();
    cancelAnimationFrame(raf);
    const rt = roteiro();
    if (rt.d3) m3.rumo = null;
    const total = Math.ceil(((rt.fim + rt.segura) / 1000) * FPS),
      { Muxer, ArrayBufferTarget } = window.Mp4Muxer,
      muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H, frameRate: FPS },
        fastStart: 'in-memory',
      });
    let erro = null;
    const enc = new window.VideoEncoder({
      output: (ch, meta) => muxer.addVideoChunk(ch, meta),
      error: (er) => (erro = er),
    });
    enc.configure(cfg);
    let ant = 0;
    try {
      for (let i = 0; i < total; i++) {
        if (erro) throw erro;
        if (!ov.isConnected) return null;
        const ms = Math.min(rt.fim, (i * 1000) / FPS);
        if (cameraQuadro(rt, ms, ms - ant)) await mapaPronto();
        ant = ms;
        pintaQuadro(rt, ms);
        const fr = new window.VideoFrame(cv, {
          timestamp: Math.round((i * 1e6) / FPS),
          duration: Math.round(1e6 / FPS),
        });
        enc.encode(fr, { keyFrame: i % (FPS * 2) === 0 });
        fr.close();
        while (enc.encodeQueueSize > 4) await new Promise((ok) => setTimeout(ok, 5));
        if (i % 5 === 0) {
          aoAvancar(i / total);
          await new Promise((ok) => setTimeout(ok, 0));
        }
      }
      await enc.flush();
      if (erro) throw erro;
      muxer.finalize();
      return new Blob([muxer.target.buffer], { type: 'video/mp4' });
    } finally {
      try {
        enc.close();
      } catch {}
    }
  };
  // câmera de drone: alta, inclinada, girando devagar em volta do ponto que corre
  function cameraSat(e) {
    m3.map.jumpTo({ center: pontoEm(e), bearing: m3.rumo0 + e * 80, pitch: 60, zoom: m3.zoom });
  }
  // câmera de perseguição (como os vídeos do Strava): atrás do corredor, virada para onde ele vai,
  // com o ponto mais embaixo na tela para mostrar o caminho à frente
  // giro suave que não depende de quantos quadros por segundo o celular consegue
  const giro = (taxa, dt) => 1 - Math.pow(1 - taxa, Math.max(0, dt || 16.7) / 16.7);
  function cameraSegue(e, dt) {
    const c0 = pontoEm(e),
      adiante = pontoEm(Math.min(1, e + 0.05));
    const alvo = Math.hypot(adiante[0] - c0[0], adiante[1] - c0[1]) > 1e-6 ? rumoEntre(c0, adiante) : (m3.rumo ?? 0);
    if (m3.rumo == null) m3.rumo = alvo;
    const d = ((alvo - m3.rumo + 540) % 360) - 180; // gira pelo lado mais curto, devagar
    m3.rumo += d * giro(0.04, dt);
    const h = m3.map.getContainer().clientHeight || H;
    m3.map.jumpTo({
      center: c0,
      bearing: m3.rumo,
      pitch: 56,
      zoom: m3.zoom - 0.35,
      padding: { top: Math.round(h * 0.42), bottom: 0, left: 0, right: 0 },
    });
  }
  // ---------- modos 3D: câmera inclinada que segue o corredor, com prédios em 3D ----------
  const pontoEm = (e) => {
    const t = e * (R.length - 1),
      i = Math.min(R.length - 2, Math.floor(t)),
      fr = t - i;
    return [R[i][1] + (R[i + 1][1] - R[i][1]) * fr, R[i][0] + (R[i + 1][0] - R[i][0]) * fr];
  };
  const rumoEntre = (a, b) => {
    const k = Math.cos((a[1] * Math.PI) / 180);
    return (Math.atan2((b[0] - a[0]) * k, b[1] - a[1]) * 180) / Math.PI;
  };
  function camera3D(e, dt) {
    const c0 = pontoEm(e),
      adiante = pontoEm(Math.min(1, e + 0.035));
    let alvo = Math.hypot(adiante[0] - c0[0], adiante[1] - c0[1]) > 1e-6 ? rumoEntre(c0, adiante) : (m3.rumo ?? 0);
    if (m3.rumo == null) m3.rumo = alvo;
    let d = ((alvo - m3.rumo + 540) % 360) - 180; // gira pelo lado mais curto
    m3.rumo += d * giro(0.05, dt);
    m3.map.jumpTo({ center: c0, bearing: m3.rumo, pitch: 58, zoom: m3.zoom });
  }
  function fechar3D() {
    if (!m3) return;
    try {
      m3.map.remove();
    } catch {}
    m3.box.remove();
    m3 = null;
  }
  async function preparar3D(estilo) {
    fechar3D();
    await carregarMapaLib();
    const sat = estilo === 'sat';
    let estiloMapa = `https://tiles.openfreemap.org/styles/${estilo === '3d' ? 'dark' : 'liberty'}`;
    let fonteSat = null;
    if (sat) {
      const fonte = (fonteSat = await fonteSatelite(R[0][1], R[0][0]));
      if (!fonte) return 'sem-satelite';
      estiloMapa = {
        version: 8,
        sources: {
          sat: { type: 'raster', tiles: [fonte.url], tileSize: fonte.tam, maxzoom: 19 },
          dem: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15,
          },
        },
        layers: [
          { id: 'fundo', type: 'background', paint: { 'background-color': '#0b1a2e' } },
          { id: 'sat', type: 'raster', source: 'sat' },
        ],
        terrain: { source: 'dem', exaggeration: 1.4 },
      };
    }
    const box = document.createElement('div');
    box.style.cssText = `position:fixed;left:-30000px;top:0;width:${W}px;height:${sat ? H : MH}px;pointer-events:none`;
    document.body.append(box);
    const map = new window.maplibregl.Map({
      container: box,
      style: estiloMapa,
      pixelRatio: 1,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      center: pontoEm(0),
      zoom: 16,
      pitch: 62,
      maxPitch: 75,
    });
    const meu = (m3 = { map, box, pronto: false, rumo: null, zoom: 16.2 });
    const espera = (ms) =>
      new Promise((ok) => {
        const t = setTimeout(ok, ms);
        map.once('idle', () => {
          clearTimeout(t);
          ok();
        });
      });
    await new Promise((ok, er) => {
      const t = setTimeout(() => er(new Error('tempo')), 15000);
      map.once('load', () => {
        clearTimeout(t);
        ok();
      });
    });
    if (m3 !== meu) return false;
    if (sat) {
      meu.fonte = fonteSat;
      return prepararSat(meu);
    }
    // prédios em 3D (o estilo escuro não traz; no realista reforça a altura)
    const camadas = map.getStyle().layers || [];
    if (!camadas.some((l) => l.type === 'fill-extrusion')) {
      const fonte = Object.keys(map.getStyle().sources).find((k) => map.getStyle().sources[k].type === 'vector');
      if (fonte)
        map.addLayer({
          id: 'nx-predios-3d',
          type: 'fill-extrusion',
          source: fonte,
          'source-layer': 'building',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': estilo === '3d' ? '#1d2c4f' : '#d9d4cc',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.9,
          },
        });
    }
    // zoom pelo tamanho do percurso: corrida curta mais perto, longa um pouco mais longe
    const km = dist / 1000;
    meu.zoom = (km < 3 ? 16.6 : km < 8 ? 16.2 : km < 15 ? 15.8 : 15.4) + zoomDelta();
    // percorre o caminho antes para baixar os mapas, assim o vídeo não aparece com buracos
    const N = 12;
    for (let i = 0; i <= N; i++) {
      if (m3 !== meu || !ov.isConnected) return false;
      m3.rumo = null;
      camera3D(i / N);
      bv.textContent = `Preparando o 3D… ${Math.round((i / N) * 100)}%`;
      await espera(2500);
    }
    meu.pronto = true;
    return true;
  }
  // satélite: céu no horizonte, enquadramento final e mapas baixados antes de gravar
  async function prepararSat(meu) {
    const map = meu.map;
    try {
      map.setSky({
        'sky-color': '#7fb2e6',
        'horizon-color': '#cfe3f5',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.5,
        'fog-color': '#b8cde0',
        'fog-ground-blend': 0.6,
      });
    } catch {}
    let erros = 0;
    map.on('error', (ev) => {
      if (ev && ev.sourceId === 'sat') erros++;
    });
    const km = dist / 1000;
    meu.zoom = (km < 3 ? 15.8 : km < 8 ? 15.2 : km < 15 ? 14.7 : 14.2) + zoomDelta();
    meu.rumo0 = rumoEntre(pontoEm(0), pontoEm(0.08)) - 30;
    const ls = R.map((p) => p[0]),
      os = R.map((p) => p[1]);
    const cam = map.cameraForBounds(
      [
        [Math.min(...os), Math.min(...ls)],
        [Math.max(...os), Math.max(...ls)],
      ],
      { padding: { top: 640, bottom: 420, left: 120, right: 120 } },
    );
    meu.vista = { c: cam ? [cam.center.lng, cam.center.lat] : pontoEm(0.5), z: cam ? cam.zoom - 0.35 : meu.zoom - 1.5 };
    const espera = (ms) =>
      new Promise((ok) => {
        const t = setTimeout(ok, ms);
        map.once('idle', () => {
          clearTimeout(t);
          ok();
        });
      });
    // 1) baixa em paralelo os pedaços de satélite e de relevo ao longo do percurso (o navegador guarda e o mapa usa na hora)
    const urls = new Set(),
      zS = Math.floor(meu.zoom) + (meu.fonte.tam === 256 ? 1 : 0),
      peca = (z, lo, la) => {
        const n = 2 ** z,
          r = (la * Math.PI) / 180;
        return [
          Math.floor(((lo + 180) / 360) * n),
          Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n),
        ];
      };
    const passo = Math.max(1, Math.floor(R.length / 160));
    for (let i = 0; i < R.length; i += passo) {
      const [la, lo] = R[i];
      for (let z = zS - 2; z <= zS; z++) {
        const [tx, ty] = peca(z, lo, la),
          raio = z === zS ? 1 : 0;
        for (let dx = -raio; dx <= raio; dx++)
          for (let dy = -raio; dy <= raio; dy++)
            urls.add(
              meu.fonte.url
                .replace('{z}', z)
                .replace('{y}', ty + dy)
                .replace('{x}', tx + dx),
            );
      }
      const zd = Math.min(15, zS - 2),
        [dx, dy] = peca(zd, lo, la);
      urls.add(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zd}/${dx}/${dy}.png`);
    }
    const fila = [...urls];
    let feitos = 0;
    const baixar = async () => {
      while (fila.length && m3 === meu) {
        const u = fila.pop();
        try {
          await fetch(u, { mode: 'cors', credentials: 'omit' });
        } catch {}
        feitos++;
        bv.textContent = `Preparando o satélite… ${Math.round((feitos / urls.size) * 80)}%`;
      }
    };
    await Promise.all(Array.from({ length: 16 }, baixar));
    // 2) passa a câmera por alguns pontos para o mapa montar o relevo
    const N = 6;
    for (let i = 0; i <= N + 1; i++) {
      if (m3 !== meu || !ov.isConnected) return false;
      if (i <= N) (modo === 'sat-segue' ? cameraSegue : cameraSat)(i / N);
      else map.jumpTo({ center: meu.vista.c, zoom: meu.vista.z, bearing: meu.rumo0 + 105, pitch: 45 });
      bv.textContent = `Preparando o satélite… ${80 + Math.round((i / (N + 1)) * 20)}%`;
      await espera(1500);
      if (erros > 6) return 'sem-satelite';
    }
    meu.pronto = true;
    return true;
  }
  ov.querySelectorAll('[data-rpm]').forEach((bt) => {
    bt.onclick = async () => {
      if (bt.dataset.rpm === modo || bv.dataset.gravando) return;
      modo = bt.dataset.rpm;
      ov.querySelectorAll('[data-rpm]').forEach((o) => o.classList.toggle('on', o === bt));
      ov.querySelector('.replay-zoom').hidden = modo === 'classico'; // o clássico mostra o percurso inteiro
      cancelAnimationFrame(raf);
      if (modo === 'classico') {
        fechar3D();
        P = fundoMapa ? fundoMapa.P.map(([a, b]) => [a, b + MY]) : P0;
        bv.disabled = false;
        bv.textContent = 'Salvar vídeo';
        return tocar();
      }
      bv.disabled = true;
      bv.textContent = ehSat() ? 'Preparando o satélite…' : 'Preparando o 3D…';
      const ok = await preparar3D(ehSat() ? 'sat' : modo).catch(() => false);
      if (!ov.isConnected || modo !== bt.dataset.rpm) return;
      bv.disabled = false;
      bv.textContent = 'Salvar vídeo';
      if (ok === 'sem-satelite') {
        // chave vencida, limite do mês ou internet fraca: segue com o mapa realista gratuito
        fechar3D();
        toast('O satélite não está disponível agora. Usando o mapa 3D realista.');
        return ov.querySelector('[data-rpm="3d-real"]').click();
      }
      if (!ok) {
        toast('Não foi possível carregar o mapa 3D agora. Confira a internet e tente de novo.', true);
        return ov.querySelector('[data-rpm="classico"]').click();
      }
      tocar();
    };
  });
  // mostra já o replay simples e, quando o mapa real carregar, recomeça por cima dele
  fontesStory().then(() => tocar());
  bv.disabled = true;
  bv.textContent = 'Carregando mapa…';
  mapaDoPercurso(R, W, MH).then((m) => {
    if (modo === 'classico') {
      bv.disabled = false;
      bv.textContent = 'Salvar vídeo';
    }
    if (!m || !ov.isConnected) return;
    const v = document.createElement('canvas');
    v.width = W;
    v.height = MH;
    const g = v.getContext('2d');
    g.drawImage(m.img, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#2a4a8a';
    g.fillRect(0, 0, W, MH);
    const ms = g.createLinearGradient(0, 0, 0, MH);
    ms.addColorStop(0, 'rgba(0,0,0,0)');
    ms.addColorStop(0.2, 'rgba(0,0,0,1)');
    ms.addColorStop(0.78, 'rgba(0,0,0,1)');
    ms.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = ms;
    g.fillRect(0, 0, W, MH);
    fundoMapa = { ...m, vis: v };
    if (modo !== 'classico') return; // o aluno já trocou para o 3D
    P = m.P.map(([a, b]) => [a, b + MY]);
    tocar();
  });
  ov.querySelector('#rp-de-novo').onclick = () => tocar();
  ov.querySelector('#rp-det').onclick = () => {
    if (bv.dataset.gravando || ov.querySelector('.replay-det')) return;
    let sel = [...det];
    const p = document.createElement('div');
    p.className = 'replay-det';
    const pinta = () => {
      p.innerHTML = `<div class="rd-box"><div class="rd-top"><div><b>Detalhes do vídeo</b><span>Escolha até 3 números para aparecer no vídeo.</span></div><span class="rd-cont">${sel.length} de 3</span></div>
        <div class="rd-lista">${DETALHES.map((m) => {
          const on = sel.includes(m.id),
            bloq = !m.ok || (!on && sel.length >= 3);
          return `<button type="button" class="rd-it ${on ? 'on' : ''}" data-det="${m.id}" ${bloq ? 'disabled' : ''}><span class="rd-chk">${on ? I.check || '✓' : ''}</span><span class="rd-tx"><b>${m.n}</b><small>${m.ok ? m.d : 'Seu relógio não registrou neste treino'}</small></span></button>`;
        }).join('')}</div>
        ${sel.length >= 3 ? '<p class="rd-aviso">Para trocar, desmarque um antes de marcar outro.</p>' : ''}
        <button type="button" class="btn block" id="rd-ok" ${sel.length ? '' : 'disabled'}>Pronto</button></div>`;
      p.querySelectorAll('[data-det]').forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.det;
          sel = sel.includes(id) ? sel.filter((y) => y !== id) : [...sel, id];
          pinta();
        };
      });
      p.querySelector('#rd-ok').onclick = () => {
        det = DETALHES.filter((m) => sel.includes(m.id)).map((m) => m.id);
        store.set('nx-replay-det', det);
        p.remove();
        tocar();
      };
    };
    p.onclick = (e) => {
      if (e.target === p) p.remove();
    };
    pinta();
    ov.append(p);
  };
  const zoomDelta = () => ({ perto: 1.3, medio: 0, longe: -1 })[zoomCam] || 0;
  const marcaZoom = () =>
    ov.querySelectorAll('[data-rpz]').forEach((o) => o.classList.toggle('on', o.dataset.rpz === zoomCam));
  marcaZoom();
  ov.querySelectorAll('[data-rpz]').forEach((bt) => {
    bt.onclick = () => {
      if (bv.dataset.gravando || bv.disabled || bt.dataset.rpz === zoomCam) return;
      zoomCam = bt.dataset.rpz;
      store.set('nx-replay-zoom', zoomCam);
      marcaZoom();
      // monta o 3D de novo com a câmera na nova distância (baixa os mapas no detalhe certo)
      const atual = modo;
      modo = '';
      ov.querySelector(`[data-rpm="${atual}"]`).click();
    };
  });
  ov.querySelectorAll('[data-rpv]').forEach((bt) => {
    bt.onclick = () => {
      if (bv.dataset.gravando) return;
      vel = +bt.dataset.rpv;
      ov.querySelectorAll('[data-rpv]').forEach((o) => o.classList.toggle('on', o === bt));
      tocar();
    };
  });
  ov.querySelector('#rp-video').onclick = async (e) => {
    const b = e.currentTarget;
    if (b.dataset.gravando) return;
    const entregar = async (blob, ext) => {
      const file = new File([blob], `replay-nexos.${ext}`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (er) {
          if (er.name === 'AbortError') return;
        }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    const libera = () => {
      b.disabled = false;
      b.textContent = 'Salvar vídeo';
      delete b.dataset.gravando;
    };
    b.disabled = true;
    b.dataset.gravando = '1';
    b.textContent = 'Preparando…';
    // 1) caminho bom: gera o vídeo quadro a quadro (liso em qualquer celular)
    const cfg = await configVideo();
    if (cfg) {
      try {
        const blob = await gerarVideo(cfg, (p) => (b.textContent = `Gerando vídeo… ${Math.round(p * 100)}%`));
        libera();
        if (blob) await entregar(blob, 'mp4');
        tocar();
        return;
      } catch (er) {
        console.warn('[replay] gerar quadro a quadro falhou, gravando em tempo real', er);
      }
    }
    // 2) navegador sem esse recurso: grava a tela do replay enquanto ele toca
    const tipo = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(
      (t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t),
    );
    if (!tipo || !cv.captureStream) {
      libera();
      return toast('Este navegador não grava vídeo. Grave a tela do celular enquanto o replay toca.', true);
    }
    b.textContent = 'Gravando…';
    const rec = new MediaRecorder(cv.captureStream(30), {
      mimeType: tipo,
      videoBitsPerSecond: ehSat() ? 9000000 : 6000000,
    });
    const partes = [];
    rec.ondataavailable = (ev) => ev.data.size && partes.push(ev.data);
    rec.onstop = () => {
      libera();
      entregar(new Blob(partes, { type: tipo.split(';')[0] }), tipo.includes('mp4') ? 'mp4' : 'webm');
    };
    rec.start();
    tocar(() => rec.stop());
  };
}

/* ---------- 5) você contra você ---------- */
const distGeo = (a, b) => {
  const R = 6371000,
    dl = ((b[0] - a[0]) * Math.PI) / 180,
    dn = ((b[1] - a[1]) * Math.PI) / 180,
    m =
      Math.sin(dl / 2) ** 2 +
      Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(m));
};
async function vcvHTML(c) {
  if (!ehCorrHist(c) || !c.distancia_m || c.distancia_m < 2000 || !c.duracao_s) return '';
  const { data } = await sb
    .from('nx_corridas')
    .select('id,data,tipo,distancia_m,duracao_s,fc_media,rota')
    .eq('aluno_id', c.aluno_id)
    .neq('id', c.id)
    .gte('data', isoDia(new Date(c.data) - 150 * 864e5))
    .lte('data', isoDia(new Date(c.data) - 14 * 864e5))
    .order('data')
    .limit(120);
  const esteira = c.tipo === 'esteira',
    R = c.rota && c.rota.length > 5 ? c.rota : null;
  const cand = (data || []).filter(
    (o) =>
      ehCorrHist(o) &&
      (o.tipo === 'esteira') === esteira &&
      o.duracao_s &&
      Math.abs(o.distancia_m - c.distancia_m) / c.distancia_m <= 0.08,
  );
  let alvo = null,
    mesmo = false;
  if (R)
    alvo =
      cand.find(
        (o) =>
          o.rota &&
          o.rota.length > 5 &&
          distGeo(o.rota[0], R[0]) < 250 &&
          distGeo(o.rota[o.rota.length - 1], R[R.length - 1]) < 400,
      ) || null;
  if (alvo) mesmo = true;
  else alvo = cand.find((o) => Math.abs(o.distancia_m - c.distancia_m) / c.distancia_m <= 0.03) || null;
  if (!alvo) return '';
  const pH = c.duracao_s / (c.distancia_m / 1000),
    pA = alvo.duracao_s / (alvo.distancia_m / 1000),
    dp = Math.round(pA - pH);
  const fcH = c.fc_media,
    fcA = alvo.fc_media,
    dfc = fcH && fcA ? fcA - fcH : null;
  // eficiência: metros por minuto a cada batimento
  const efH = fcH ? ((1000 / pH) * 60) / fcH : null,
    efA = fcA ? ((1000 / pA) * 60) / fcA : null,
    def = efH && efA ? Math.round((efH / efA - 1) * 100) : null;
  const melhor = dp > 0 && (dfc == null || dfc >= -2);
  const frase =
    dp > 0
      ? `Hoje você foi <b>${dp} s/km mais rápido</b>${dfc != null ? (dfc > 0 ? ` com <b>${dfc} batimentos a menos</b>` : dfc < 0 ? ` (com a FC ${-dfc} batimentos mais alta)` : ' com a mesma FC') : ''}.`
      : dp < 0
        ? `Hoje o pace ficou ${-dp} s/km mais lento${dfc != null && dfc > 0 ? `, com ${dfc} batimentos a menos: treino mais controlado` : ''}. Treinos leves e dias de cansaço explicam boa parte dessa diferença.`
        : `Mesmo pace${dfc != null && dfc > 0 ? `, com ${dfc} batimentos a menos` : ''}.`;
  return `<div class="card vcv ${melhor ? 'melhor' : ''}"><span class="eyebrow">Você contra você</span>
    <p style="margin-top:6px">${mesmo ? 'Neste mesmo percurso' : 'Na mesma distância'}, em ${fmtDia(isoDia(alvo.data))}, você fez <b>${fmtPace(pA)}</b>${fcA ? ` com FC média ${fcA}` : ''}. ${frase}</p>
    <div class="vcv-g"><div><span>${fmtCurto(alvo.data)}</span><b>${fmtPace(pA).replace('/km', '')}</b><small>${fcA ? fcA + ' bpm' : ''}</small></div><i>${I.chev}</i><div class="hj"><span>Hoje</span><b>${fmtPace(pH).replace('/km', '')}</b><small>${fcH ? fcH + ' bpm' : ''}</small></div></div>
    ${def != null && Math.abs(def) >= 2 ? `<p class="tiny dim" style="margin-top:6px">Eficiência aeróbia (velocidade por batimento): ${def > 0 ? '+' : ''}${def}%. ${def > 0 ? 'Sinal de condicionamento melhor.' : ''}</p>` : ''}</div>`;
}

/* ---------- 6) antes e depois de 3 meses ---------- */
function janela(h, ini, fim) {
  const dentro = (d) => {
    const k = isoDia(d);
    return k >= ini && k <= fim;
  };
  const corr = h.corridas.filter((c) => ehCorrHist(c) && dentro(c.data)),
    ses = h.sessoes.filter((s) => dentro(s.iniciado_em));
  const sem = Math.max(1, (dia(fim) - dia(ini)) / (7 * 864e5));
  const val = corr.filter((c) => c.tipo !== 'esteira' && c.distancia_m >= 3000 && c.duracao_s);
  const pace = val.length
    ? val.reduce((a, c) => a + c.duracao_s, 0) / (val.reduce((a, c) => a + c.distancia_m, 0) / 1000)
    : null;
  const comFc = val.filter((c) => c.fc_media);
  const fc = comFc.length ? comFc.reduce((a, c) => a + c.fc_media, 0) / comFc.length : null;
  const ef = comFc.length
    ? comFc.reduce((a, c) => a + ((c.distancia_m / c.duracao_s) * 60) / c.fc_media, 0) / comFc.length
    : null;
  return {
    kmSem: corr.reduce((a, c) => a + (+c.distancia_m || 0), 0) / 1000 / sem,
    corrSem: corr.length / sem,
    forcaSem: ses.length / sem,
    pace,
    fc,
    ef,
  };
}
async function viewAntesDepois(alunoId) {
  loading();
  const id = alunoId || S.user.id,
    staff = !!alunoId && S.staff;
  const [h, mb, fotos] = await Promise.all([
    historicoAluno(id),
    sb
      .from('nx_membros')
      .select('nome,criado_em,recado_evolucao,sexo')
      .eq('org_id', S.org.id)
      .eq('user_id', id)
      .maybeSingle()
      .then((r) => r.data || {}),
    sb
      .from('nx_fotos')
      .select('caminho,data,vista')
      .eq('aluno_id', id)
      .order('data')
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const ds = datasAtiv(h),
    inicio = ds[0] ? isoDia(ds[0]) : mb.criado_em ? isoDia(mb.criado_em) : null;
  const voltar = staff
    ? `<a class="back" href="#/aluno/${id}/saude">${I.back} ${esc(firstName(mb.nome))}</a>`
    : `<a class="back" href="#/historico">${I.back} Evolução</a>`;
  const dd = inicio ? diasDesde(inicio) : 0;
  if (!inicio || dd < 60) {
    $app.innerHTML = `${voltar}<p class="eyebrow">Antes e depois</p><h1 class="h1">${staff ? esc(firstName(mb.nome)) : 'Sua evolução'}</h1><div class="empty" style="margin-top:20px"><div class="h3">Disponível a partir de ${inicio ? fmtDia(somaDias(inicio, 60)) : '60 dias de treino'}</div><p class="small">A comparação precisa de pelo menos 2 meses de treino.</p></div>`;
    return;
  }
  const A = janela(h, inicio, somaDias(inicio, 29)),
    B = janela(h, isoDia(Date.now() - 29 * 864e5), hojeISO());
  const linha = (l, a, b, fmt, melhorSobe, u = '') => {
    if (a == null || b == null) return '';
    const d = b - a,
      bom = melhorSobe ? d > 0 : d < 0,
      igual = Math.abs(d) < Math.abs(a) * 0.02;
    return `<div class="ad-l"><span>${l}</span><b>${fmt(a)}${u}</b><i>${I.chev}</i><b class="${igual ? '' : bom ? 'up' : 'dn'}">${fmt(b)}${u}</b></div>`;
  };
  const av0 = h.avs[0],
    av1 = h.avs[h.avs.length - 1];
  const r0 = av0 ? calcAval(av0) : {},
    r1 = av1 && av1 !== av0 ? calcAval(av1) : null;
  const fr = fotos.filter((f) => /frente|frontal/i.test(f.vista || ''));
  const f0 = fr[0] || fotos[0],
    f1x = fr.length > 1 ? fr[fr.length - 1] : fotos.length > 1 ? fotos[fotos.length - 1] : null;
  $app.innerHTML = `${voltar}<p class="eyebrow">Antes e depois</p><h1 class="h1">${staff ? esc(firstName(mb.nome)) + ': ' : ''}${Math.round(dd / 30)} meses de Nexos</h1>
    <p class="small muted" style="margin-top:6px">Primeiro mês (${fmtCurto(inicio)} a ${fmtCurto(somaDias(inicio, 29))}) comparado aos últimos 30 dias.</p>
    <div class="card ad-card" style="margin-top:14px"><div class="ad-h"><span></span><span>1º mês</span><span></span><span>Agora</span></div>
      ${linha('Km por semana', A.kmSem, B.kmSem, (v) => f1(v), true)}
      ${linha('Corridas por semana', A.corrSem, B.corrSem, (v) => f1(v), true)}
      ${linha('Pace médio', A.pace, B.pace, (v) => fmtPace(v).replace('/km', ''), false, '/km')}
      ${linha('FC média nas corridas', A.fc, B.fc, (v) => Math.round(v), false, ' bpm')}
      ${linha('Eficiência aeróbia', A.ef, B.ef, (v) => f1(v, 2), true, ' m/bat')}
      ${linha('Treinos de força por semana', A.forcaSem, B.forcaSem, (v) => f1(v), true)}
      ${r1 ? linha('Gordura corporal', r0.gordura, r1.gordura, (v) => f1(v), false, '%') + linha('Massa magra', r0.massa_magra, r1.massa_magra, (v) => f1(v), true, ' kg') + linha('Peso', num(av0.peso), num(av1.peso), (v) => f1(v), false, ' kg') : ''}
      <p class="tiny dim" style="margin-top:8px">Eficiência aeróbia = metros por minuto a cada batimento: subir esse número é correr mais rápido com o mesmo esforço cardíaco. Verde é melhora.</p></div>
    ${f0 && f1x ? `<div class="ad-fotos" id="ad-fotos"><figure><img alt="Antes"><figcaption>${fmtDia(f0.data)}</figcaption></figure><figure><img alt="Depois"><figcaption>${fmtDia(f1x.data)}</figcaption></figure></div>` : ''}
    <div class="card ad-recado"><span class="eyebrow">Recado do treinador</span>${staff ? `<textarea class="textarea" id="ad-rec" rows="4" placeholder="Escreva o que você viu de evolução e o próximo objetivo. O aluno vê aqui.">${esc(mb.recado_evolucao || '')}</textarea><button class="btn sm" id="ad-salvar" style="margin-top:8px">Salvar recado</button>` : `<p style="margin-top:6px;white-space:pre-line">${mb.recado_evolucao ? esc(mb.recado_evolucao) : 'Seu treinador vai deixar um recado aqui sobre a sua evolução.'}</p>`}</div>
    ${staff ? '' : `<button class="btn block" id="ad-story" style="margin-top:12px">Gerar card para o story</button>`}`;
  if (f0 && f1x) {
    const ims = document.querySelectorAll('#ad-fotos img');
    sb.storage
      .from('nx-fotos')
      .createSignedUrls([f0.caminho, f1x.caminho], 3600)
      .then(({ data }) => {
        (data || []).forEach((u, j) => {
          if (ims[j] && u.signedUrl) ims[j].src = u.signedUrl;
        });
      })
      .catch(() => {});
  }
  const sv = document.getElementById('ad-salvar');
  if (sv)
    sv.onclick = async () => {
      const { error } = await sb
        .from('nx_membros')
        .update({ recado_evolucao: document.getElementById('ad-rec').value.trim() || null })
        .eq('org_id', S.org.id)
        .eq('user_id', id);
      toast(error ? 'Não foi possível salvar.' : 'Recado salvo. O aluno já vê.', !!error);
    };
  const st = document.getElementById('ad-story');
  if (st)
    st.onclick = () =>
      abrirStory(
        {
          eyebrow: 'Antes e depois',
          titulo: `${Math.round(dd / 30)} meses de Nexos`,
          linhas: [
            ...(A.pace && B.pace
              ? [['Pace médio', `${fmtPace(A.pace).replace('/km', '')} → ${fmtPace(B.pace).replace('/km', '')}`]]
              : []),
            ...(A.kmSem || B.kmSem ? [['Km por semana', `${f1(A.kmSem)} → ${f1(B.kmSem)}`]] : []),
            ...(A.fc && B.fc ? [['FC média', `${Math.round(A.fc)} → ${Math.round(B.fc)}`]] : []),
            ...(r1 && r0.gordura != null && r1.gordura != null
              ? [['Gordura', `${f1(r0.gordura)}% → ${f1(r1.gordura)}%`]]
              : []),
          ],
        },
        'antes-e-depois.png',
      );
}

/* ---------- 7) modo prova ---------- */
const kmProvaAlvo = (p) => {
  const t = semAcento(String((p && (p.distancia || p.titulo)) || ''));
  if (/maratona/.test(t) && !/meia/.test(t)) return 42.195;
  if (/meia|21/.test(t)) return 21.0975;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(k|km)/);
  return m ? +m[1].replace(',', '.') : null;
};
function planoDeProva(p, perfil) {
  const km = kmProvaAlvo(p);
  if (!km) return null;
  let T = p.meta ? lerTempo(String(p.meta).trim()) : null,
    fonte = 'sua meta';
  if (!T && perfil && perfil.teste_seg && perfil.teste_km) {
    T = prever(perfil.teste_km * 1000, perfil.teste_seg, km * 1000);
    fonte = 'a previsão do seu último teste';
  }
  if (!T || T / km < 150) return { km, T: null };
  const pa = T / km,
    n = Math.ceil(km);
  // estratégia: 1º km um pouco mais contido, meio no alvo e fechamento levemente mais forte (negative split)
  const fator = (i) => (i === 0 ? 1.02 : i >= n - 2 ? 0.985 : 1);
  const bruto = Array.from({ length: n }, (_, i) => pa * fator(i) * (i === n - 1 ? km - (n - 1) : 1));
  const aj = T / bruto.reduce((a, b) => a + b, 0);
  let acc = 0;
  const splits = bruto.map((s, i) => {
    acc += s * aj;
    return { km: i === n - 1 ? km : i + 1, pace: pa * fator(i) * aj, acc };
  });
  return { km, T, pa, splits, fonte };
}
const CHECK_PROVA = {
  vespera: [
    'Separar roupa, tênis, número de peito e alfinetes',
    'Jantar com carboidrato que você já conhece, nada novo',
    'Hidratar bem durante o dia',
    'Dormir cedo: 7 a 9 horas',
    'Conferir horário, local de largada e como chegar',
    'Carregar o relógio e o celular',
  ],
  dia: [
    'Café da manhã 2 a 3 horas antes',
    'Água: 400 a 600 ml até 2 horas antes',
    'Chegar 45 minutos antes',
    'Aquecer 10 a 15 min leve com 3 acelerações',
    'Largar no ritmo do plano: sem empolgar no 1º km',
  ],
};
function modoProvaHTML(p, perfil) {
  const d = Math.round((dia(p.data) - dia(hojeISO())) / 864e5);
  const pl = planoDeProva(p, perfil);
  const chk = store.get('nx-prova-chk-' + p.id, {});
  const grupo = d <= 0 ? 'dia' : d === 1 ? 'vespera' : null;
  const linhas =
    pl && pl.splits ? (pl.km > 12 ? pl.splits.filter((s) => s.km % 5 === 0 || s.km === pl.km) : pl.splits) : [];
  const quando = d === 0 ? 'É hoje!' : d === 1 ? 'Amanhã' : `Faltam ${d} dias`;
  PM_CTX[p.id] = [p, perfil];
  // o aluno pode recolher o card; cada prova nova começa aberta
  if (store.get('nx-prova-oculta-' + p.id, false))
    return `<div class="card prova-modo pm-mini" data-pm="${p.id}"><div class="grow" style="min-width:0"><span class="eyebrow">Modo prova · ${quando}</span><b class="ellip" style="display:block">${esc(p.titulo)}</b></div><button type="button" class="link-btn small pm-tg" data-pm-tg="mostrar">Mostrar</button></div>`;
  return `<div class="card prova-modo" data-pm="${p.id}"><div class="pm-top"><span class="eyebrow">Modo prova</span><div class="row" style="gap:10px;align-items:center"><b>${quando}</b><button type="button" class="link-btn small pm-tg" data-pm-tg="ocultar">Ocultar</button></div></div>
    <div class="h3" style="margin-top:4px">${esc(p.titulo)}</div><a class="btn sm pm-plano" href="#/prova/${p.id}">Plano de prova completo</a><p class="small muted">${fmtDiaSem(p.data)}${p.cidade ? ' · ' + esc(p.cidade) : ''}${pl ? ` · ${String(f1(pl.km)).replace(',0', '')} km` : ''}</p>
    ${
      pl && pl.T
        ? `<div class="pm-alvo"><div><span>Tempo alvo</span><b>${fmtDurLongo(pl.T)}</b></div><div><span>Pace médio</span><b>${fmtPace(pl.pa)}</b></div></div>
      <p class="tiny dim">${pl.fonte === 'sua meta' ? 'Pela sua meta' : 'Pela previsão do seu último teste'}. Estratégia: 1º km um pouco mais contido e fechamento levemente mais forte.</p>
      <details class="pm-split"><summary>Ritmo por km</summary><div class="pm-tab">${linhas.map((s) => `<div><span>km ${String(f1(s.km)).replace(',0', '')}</span><b>${fmtPace(s.pace).replace('/km', '')}</b><em>${fmtDurLongo(s.acc)}</em></div>`).join('')}</div></details>`
        : '<p class="small muted" style="margin-top:8px">Combine com o seu treinador o tempo alvo para ver o ritmo por km.</p>'
    }
    ${grupo ? `<p class="sec-lbl" style="margin-top:12px">${grupo === 'dia' ? 'Checklist do dia' : 'Checklist da véspera'}</p><div class="pm-chk" data-prova="${p.id}">${CHECK_PROVA[grupo].map((t, j) => `<label><input type="checkbox" data-ck="${grupo}${j}" ${chk[grupo + j] ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>` : `<p class="tiny dim" style="margin-top:10px">Na véspera e no dia aparece aqui o checklist da prova.</p>`}</div>`;
}
const PM_CTX = {};
function bindModoProva(root) {
  root.querySelectorAll('[data-pm-tg]').forEach(
    (b) =>
      (b.onclick = () => {
        const card = b.closest('[data-pm]'),
          id = card.dataset.pm,
          ocultar = b.dataset.pmTg === 'ocultar';
        store.set('nx-prova-oculta-' + id, ocultar);
        const ctx = PM_CTX[id],
          pai = card.parentElement;
        if (!ctx || !pai) return;
        card.outerHTML = modoProvaHTML(ctx[0], ctx[1]);
        bindModoProva(pai);
      }),
  );
  root.querySelectorAll('.pm-chk').forEach(
    (b) =>
      (b.onchange = (e) => {
        const i = e.target.closest('[data-ck]');
        if (!i) return;
        const k = 'nx-prova-chk-' + b.dataset.prova;
        const st = store.get(k, {});
        st[i.dataset.ck] = i.checked;
        store.set(k, st);
        const d = b.closest('.pp-chk'),
          tg = d && d.querySelector('summary .tag');
        if (tg) {
          const tot = b.querySelectorAll('[data-ck]').length,
            ok = b.querySelectorAll('[data-ck]:checked').length;
          tg.textContent = `${ok}/${tot}`;
          tg.classList.toggle('ok', ok === tot);
        }
      }),
  );
}

/* ---------- plano de prova completo: ritmo por km, nutrição e checagem ---------- */
// referências: ACSM/ADA/DC (Thomas et al., 2016), ISSN (Kerksick et al., 2017), Jeukendrup (2014), Burke et al. (2011)
const CHECK_PROVA_C = {
  semana: [
    'Seguir a redução de volume da planilha, sem treino extra',
    'Testar num treino a roupa, o tênis e o gel que vai usar na prova',
    'Retirar o kit e conferir o número de peito',
    'Dormir bem a semana toda: o sono das noites anteriores conta mais que o da véspera',
  ],
  vespera: CHECK_PROVA.vespera,
  dia: CHECK_PROVA.dia,
  largada: [
    'Ir ao banheiro com antecedência',
    'Posicionar-se no pelotão do seu ritmo',
    'Relógio com GPS pronto antes da largada',
    'Lembrar do ritmo do 1º km do plano',
  ],
};
const ROT_CHK = { semana: 'Semana da prova', vespera: 'Véspera', dia: 'Manhã da prova', largada: 'Na largada' };
function nutricaoProva(T, km, peso) {
  const h = T / 3600,
    p = peso || null,
    g = (a, b) =>
      p ? `${Math.round((a * p) / 10) * 10} a ${Math.round((b * p) / 10) * 10} g` : `${a} a ${b} g por kg`;
  const out = [];
  if (h >= 1.5)
    out.push([
      'Dias antes: carregar carboidrato',
      `Nas 36 a 48 horas antes, aumente o carboidrato para 10 a 12 g por kg por dia (${p ? `cerca de ${Math.round(10 * p)} a ${Math.round(12 * p)} g por dia` : 'calcule pelo seu peso'}): arroz, massa, pão, batata, frutas. Diminua fibras e gordura para não pesar.`,
    ]);
  else
    out.push([
      'Véspera',
      `Jantar com carboidrato que você já conhece (arroz, massa, batata), pouca gordura e pouca fibra. Prova de ${String(f1(km)).replace(',0', '')} km não pede carregamento de vários dias.`,
    ]);
  out.push([
    'Café da manhã da prova',
    `2 a 3 horas antes, ${g(1, 2)} de carboidrato${p ? '' : ''}: por exemplo pão com mel ou geleia, banana, tapioca. Evite novidade, fritura e muita fibra.`,
  ]);
  out.push([
    'Água antes',
    `${p ? `${Math.round((5 * p) / 50) * 50} a ${Math.round((7 * p) / 50) * 50} ml` : '5 a 7 ml por kg'} cerca de 4 horas antes e mais um copo até 1 hora antes, se tiver sede.`,
  ]);
  let durante;
  if (h < 0.75) durante = 'Prova curta: não precisa de gel. Água só se tiver sede ou estiver muito quente.';
  else if (h < 1.25)
    durante =
      'Pode usar pequenas quantidades de carboidrato (meio gel ou bochecho com isotônico). Água pela sede, em goles nos postos.';
  else {
    const gh = h < 2.5 ? [30, 60] : [60, 90],
      tot = Math.round(gh[0] * h),
      tot2 = Math.round(gh[1] * h),
      geis = [Math.max(1, Math.round(tot / 25)), Math.max(1, Math.round(tot2 / 25))];
    const cada = Math.max(25, Math.round(60 / ((gh[0] + gh[1]) / 2 / 25)));
    durante = `${gh[0]} a ${gh[1]} g de carboidrato por hora: cerca de ${geis[0]} a ${geis[1]} géis de 25 g na prova toda, um a cada ${cada} minutos, começando por volta dos 40 minutos. ${h >= 2.5 ? 'Acima de 60 g por hora, prefira géis com glicose e frutose. ' : ''}Água: 400 a 800 ml por hora, de acordo com a sede e o calor.`;
  }
  out.push(['Durante a prova', durante]);
  out.push(['Depois', `Nas primeiras horas, ${g(1, 1.2)} de carboidrato e 20 a 40 g de proteína, com água à vontade.`]);
  return out;
}
function splitsProva(T, km, modo) {
  const n = Math.ceil(km),
    pa = T / km;
  const fator = (i) => (modo === 'negativo' ? (i === 0 ? 1.02 : i < n / 2 ? 1.012 : 0.988) : i === 0 ? 1.01 : 1);
  const bruto = Array.from({ length: n }, (_, i) => pa * fator(i) * (i === n - 1 ? km - (n - 1) : 1));
  const aj = T / bruto.reduce((a, b) => a + b, 0);
  let acc = 0;
  return bruto.map((s, i) => {
    acc += s * aj;
    return { km: i === n - 1 ? km : i + 1, pace: pa * fator(i) * aj, acc };
  });
}
// recado sugerido no tom do treinador, a partir do próprio plano (o treinador confere e edita se quiser)
function recadoAutoProva(m, km, T, modo, sp) {
  const n = firstName(m.nome) || 'Atleta',
    kmT = String(f1(km)).replace(',0', '');
  if (!T || !sp.length)
    return `${n}, me diga a sua meta para os ${kmT} km para eu fechar a estratégia com você. Enquanto isso: largue confortável, sem se empolgar com o pelotão, e encontre o seu ritmo depois do 1º km. Confie no treino. Boa prova!`;
  const metade = sp.find((x) => x.km >= km / 2),
    seg = sp.filter((x) => x.km > km / 2),
    p2 = seg.length ? seg.reduce((a, x) => a + x.pace, 0) / seg.length : T / km,
    h = T / 3600;
  return [
    `${n}, a estratégia para os ${kmT} km:`,
    `Largue contido, perto de ${fmtPace(sp[0].pace)} no 1º km, e se acomode em ${fmtPace(T / km)}.`,
    modo === 'negativo'
      ? `Na segunda metade, se estiver bem, acelere para perto de ${fmtPace(p2)}.`
      : 'Segure o ritmo até o fim e só acelere no último km se sobrar.',
    metade ? `Passe na metade em torno de ${fmtDurLongo(metade.acc)}.` : '',
    h >= 1.25
      ? 'Gel a partir dos 40 minutos, como está no plano, e água nos postos.'
      : h >= 0.75
        ? 'Água nos postos se sentir sede.'
        : 'Prova curta: foco no ritmo, sem precisar parar para água.',
    'Confie no treino. Boa prova!',
  ]
    .filter(Boolean)
    .join(' ');
}
async function viewPlanoProva(pid) {
  loading();
  S.staff ? dockStaff() : dockAluno();
  const p = await sb
    .from('nx_participacoes')
    .select('*')
    .eq('id', pid)
    .maybeSingle()
    .then(
      (r) => r.data,
      () => null,
    );
  if (!p) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Prova não encontrada</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const [m, corrs, aval] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,corrida,nascimento,sexo')
      .eq('org_id', S.org.id)
      .eq('user_id', p.aluno_id)
      .maybeSingle()
      .then(
        (r) => r.data || {},
        () => ({}),
      ),
    sb
      .from('nx_corridas')
      .select('data,tipo,distancia_m,duracao_s,fc_media,fc_max,rpe')
      .eq('aluno_id', p.aluno_id)
      .gte('data', new Date(Date.now() - 70 * 864e5).toISOString())
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_avaliacoes')
      .select('peso,data')
      .eq('aluno_id', p.aluno_id)
      .order('data', { ascending: false })
      .limit(1)
      .then(
        (r) => (r.data || [])[0] || null,
        () => null,
      ),
  ]);
  const km = kmProvaAlvo(p),
    perfil = perfilCorrida(m);
  const pv = previsaoEm(corrs, perfil, Date.now());
  const iPv = km ? PROVAS_PREV.findIndex(([dd]) => Math.abs(dd / 1000 - km) < 0.3) : -1;
  const prevT = km && pv ? (iPv >= 0 ? pv.tempos[iPv] : tempoPorVdot(pv.vdot, km * 1000)) : null;
  const metaT = p.meta ? lerTempo(String(p.meta).trim()) : null;
  let fonte = metaT ? 'meta' : prevT ? 'previsao' : null;
  let modo = p.estrategia || (km && km >= 15 ? 'negativo' : 'constante');
  let peso = num(aval && aval.peso) || num((m.corrida || {}).peso) || store.get('nx-peso-prova', null);
  const d = Math.round((dia(p.data) - dia(hojeISO())) / 864e5);
  const chk = store.get('nx-prova-chk-' + p.id, {});
  const desenhar = () => {
    const T = fonte === 'meta' ? metaT : fonte === 'previsao' ? prevT : null;
    const sp = T && km ? splitsProva(T, km, modo) : [];
    const mostrar = km > 12 ? sp.filter((s) => s.km % (km > 25 ? 5 : 1) === 0 || s.km === km || s.km === 1) : sp;
    const metade = sp.length ? sp.find((s) => s.km >= km / 2) : null;
    $app.innerHTML = `<a class="back" href="${S.staff ? `#/aluno/${p.aluno_id}/corrida` : '#/eventos'}">${I.back} ${S.staff ? esc(firstName(m.nome)) : 'Eventos'}</a>
      <div class="pp-hero"><p class="eyebrow">Plano de prova${S.staff ? ' · ' + esc(m.nome || '') : ''}</p><h1 class="h1">${esc(p.titulo || 'Prova')}</h1>
        <p class="small" style="opacity:.85;margin-top:4px">${fmtDiaSem(p.data)}${p.cidade ? ' · ' + esc(p.cidade) : ''}${km ? ` · ${String(f1(km)).replace(',0', '')} km` : ''}</p>
        <div class="pp-cont"><b>${d > 1 ? `Faltam ${d} dias` : d === 1 ? 'É amanhã' : d === 0 ? 'É hoje!' : 'Prova realizada'}</b></div></div>
      ${
        !km
          ? '<div class="card" style="margin-top:12px"><p class="small muted">Não foi possível identificar a distância desta prova. Edite a participação em Eventos informando a distância (ex.: 10 km).</p></div>'
          : `
      <div class="section"><div class="section-h"><h2 class="h2">Tempo alvo</h2></div>
        <div class="pp-fontes">${metaT ? `<button type="button" data-f="meta" class="${fonte === 'meta' ? 'on' : ''}"><span>Meta</span><b>${fmtDurLongo(metaT)}</b><small>${fmtPace(metaT / km)}</small></button>` : ''}
          ${prevT ? `<button type="button" data-f="previsao" class="${fonte === 'previsao' ? 'on' : ''}"><span>Previsão do app</span><b>${fmtDurLongo(prevT)}</b><small>${fmtPace(prevT / km)}</small></button>` : ''}</div>
        <form id="pp-meta" class="row" style="gap:8px;margin-top:10px"><input class="input" name="meta" data-mask="tempo" inputmode="numeric" placeholder="${metaT ? 'Mudar a meta' : 'Definir uma meta'} (ex.: 52:30 ou 1:55:00)" style="flex:1"><button class="btn ghost sm">Salvar</button></form>
        ${prevT ? '<p class="tiny dim" style="margin-top:6px">A previsão usa as suas corridas das últimas semanas (fórmulas de Jack Daniels). Uma meta muito mais rápida que a previsão é arriscada.</p>' : ''}
        ${metaT && prevT && metaT < prevT * 0.97 ? `<p class="small" style="color:var(--warn);margin-top:6px">A meta está ${difTxt(prevT - metaT)} mais rápida que a previsão. Converse com o seu treinador sobre a estratégia.</p>` : ''}</div>
      ${
        T
          ? `<div class="section"><div class="section-h"><h2 class="h2">Ritmo por km</h2></div>
        <div class="seg sm pp-modo"><button type="button" data-m="constante" class="${modo === 'constante' ? 'on' : ''}">Ritmo constante</button><button type="button" data-m="negativo" class="${modo === 'negativo' ? 'on' : ''}">Segunda metade mais rápida</button></div>
        <p class="small muted" style="margin-top:8px">${modo === 'negativo' ? 'Começar levemente contido e acelerar um pouco na segunda metade. É a estratégia mais usada em recordes de provas longas e evita quebrar no fim.' : 'O mesmo ritmo do início ao fim, só com o 1º km um pouco mais contido por causa do aglomerado da largada.'}</p>
        <div class="pp-res"><div><span>Pace médio</span><b>${fmtPace(T / km)}</b></div>${metade ? `<div><span>Na metade (km ${String(f1(metade.km)).replace(',0', '')})</span><b>${fmtDurLongo(metade.acc)}</b></div>` : ''}<div><span>Chegada</span><b>${fmtDurLongo(T)}</b></div></div>
        <div class="pp-tab"><div class="pp-cab"><span>Km</span><span>Ritmo</span><span>Faixa</span><span>Tempo total</span></div>${mostrar.map((s) => `<div><span>${String(f1(s.km)).replace(',0', '')}</span><b>${fmtPace(s.pace).replace('/km', '')}</b><em>${fmtPace(s.pace - 4).replace('/km', '')} a ${fmtPace(s.pace + 4).replace('/km', '')}</em><span>${fmtDurLongo(s.acc)}</span></div>`).join('')}</div>
        ${km > 12 ? `<p class="tiny dim" style="margin-top:6px">Mostrando ${km > 25 ? 'de 5 em 5 km' : 'km a km'}. A faixa é de 4 segundos para mais ou para menos.</p>` : '<p class="tiny dim" style="margin-top:6px">A faixa é de 4 segundos para mais ou para menos.</p>'}</div>`
          : ''
      }
      <div class="section"><div class="section-h"><h2 class="h2">Alimentação e hidratação</h2></div>
        ${!peso ? `<form id="pp-peso" class="card row" style="gap:8px;align-items:center"><span class="small grow">Informe o peso para calcular as quantidades.</span><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="kg" style="width:80px"><button class="btn ghost sm">Ok</button></form>` : `<p class="tiny dim">Calculado para ${f1(peso)} kg${T ? ` e cerca de ${fmtDurLongo(T)} de prova` : ''}.</p>`}
        <div class="stack" style="margin-top:8px">${nutricaoProva(T || km * 360, km, peso)
          .map(
            ([t, x]) =>
              `<div class="card pp-nut"><b>${esc(t)}</b><p class="small" style="margin-top:4px">${esc(x)}</p></div>`,
          )
          .join('')}</div>
        <p class="tiny dim" style="margin-top:8px">Baseado nas recomendações do ACSM e da Sociedade Internacional de Nutrição Esportiva. Teste tudo nos treinos longos: nada novo no dia da prova. Para um plano individual, procure um nutricionista.</p></div>`
      }
      ${
        km
          ? (() => {
              const auto = recadoAutoProva(m, km, T, modo, sp),
                txt = p.recado || auto;
              return `<div class="section"><div class="section-h"><h2 class="h2">Recado do treinador</h2></div>${S.staff ? `${p.recado ? '' : '<p class="tiny dim" style="margin-bottom:6px">Sugestão automática montada pelo plano. O aluno já vê este texto; edite e salve se quiser mudar.</p>'}<textarea class="textarea" id="pp-recado" rows="5">${esc(txt)}</textarea><div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost sm" id="pp-rec-salvar">Salvar recado</button>${p.recado ? '<button class="link-btn small" id="pp-rec-auto">Voltar para a sugestão automática</button>' : ''}</div>` : `<div class="card"><p style="white-space:pre-line">${esc(txt)}</p></div>`}</div>`;
            })()
          : ''
      }
      <div class="section"><div class="section-h"><h2 class="h2">Checagem</h2></div>
        ${Object.entries(CHECK_PROVA_C)
          .map(([k, l]) => {
            const feitos = l.filter((_, j) => chk[k + j]).length;
            return `<details class="card pp-chk" ${(k === 'semana' && d > 1 && d <= 7) || (k === 'vespera' && d === 1) || ((k === 'dia' || k === 'largada') && d === 0) ? 'open' : ''}><summary><b>${ROT_CHK[k]}</b><span class="tag ${feitos === l.length ? 'ok' : ''}">${feitos}/${l.length}</span></summary><div class="pm-chk" data-prova="${p.id}">${l.map((t, j) => `<label><input type="checkbox" data-ck="${k}${j}" ${chk[k + j] ? 'checked' : ''} ${S.staff ? 'disabled' : ''}><span>${esc(t)}</span></label>`).join('')}</div></details>`;
          })
          .join('')}</div>`;
    $app.querySelectorAll('[data-f]').forEach(
      (b) =>
        (b.onclick = () => {
          fonte = b.dataset.f;
          desenhar();
        }),
    );
    $app.querySelectorAll('[data-m]').forEach(
      (b) =>
        (b.onclick = async () => {
          modo = b.dataset.m;
          desenhar();
          await sb
            .from('nx_participacoes')
            .update({ estrategia: modo })
            .eq('id', p.id)
            .then(
              () => {},
              () => {},
            );
        }),
    );
    const fm = document.getElementById('pp-meta');
    if (fm)
      fm.onsubmit = async (e) => {
        e.preventDefault();
        const v = fm.meta.value.trim(),
          t = /(^|:)[0-5]\d:[0-5]\d$|^\d{1,3}:[0-5]\d$/.test(v) ? lerTempo(v) : null;
        if (!t || t / km < 150 || t / km > 1200) return toast('Tempo inválido. Use o formato 52:30 ou 1:55:00.', true);
        const { error } = await sb.from('nx_participacoes').update({ meta: v }).eq('id', p.id);
        if (error) return toast('Não foi possível salvar.', true);
        p.meta = v;
        toast('Meta salva.');
        viewPlanoProva(pid);
      };
    const fp = document.getElementById('pp-peso');
    if (fp)
      fp.onsubmit = (e) => {
        e.preventDefault();
        const v = num(fp.peso.value);
        if (!v || v < 30 || v > 200) return toast('Peso inválido.', true);
        peso = v;
        store.set('nx-peso-prova', v);
        desenhar();
      };
    const ra = document.getElementById('pp-rec-auto');
    if (ra)
      ra.onclick = async () => {
        const { error } = await sb.from('nx_participacoes').update({ recado: null }).eq('id', p.id);
        if (error) return toast('Não foi possível salvar.', true);
        p.recado = null;
        toast('Voltou para a sugestão automática.');
        desenhar();
      };
    const rs = document.getElementById('pp-rec-salvar');
    if (rs)
      rs.onclick = async () => {
        const v = document.getElementById('pp-recado').value.trim() || null;
        const { error } = await sb.from('nx_participacoes').update({ recado: v }).eq('id', p.id);
        if (error) return toast('Não foi possível salvar.', true);
        p.recado = v;
        toast('Recado salvo. O aluno vê no plano da prova.');
      };
    bindModoProva($app);
  };
  desenhar();
}

/* ---------- cards da tela Hoje (aparecem só no momento certo) ---------- */
async function momentosHoje(box, perfil, provaProx) {
  if (!box) return;
  const cards = [];
  const vistos = store.get('nx-momentos-' + S.user.id, {});
  // modo prova (até 7 dias antes)
  if (provaProx && Math.round((dia(provaProx.data) - dia(hojeISO())) / 864e5) <= 7)
    cards.push({ html: modoProvaHTML(provaProx, perfil) });
  const [h, provaFeita] = await Promise.all([
    historicoAluno(S.user.id),
    sb
      .from('nx_participacoes')
      .select('*')
      .eq('aluno_id', S.user.id)
      .gte('data', isoDia(Date.now() - 3 * 864e5))
      .lte('data', somaDias(hojeISO(), -1))
      .order('data', { ascending: false })
      .limit(1)
      .then(
        (r) => (r.data || [])[0] || null,
        () => null,
      ),
  ]);
  // medalha da prova (até 3 dias depois)
  if (provaFeita && !vistos['prova-' + provaFeita.id]) {
    const c = h.corridas
      .filter((x) => isoDia(x.data) === provaFeita.data && ehCorrHist(x))
      .sort((a, b) => b.distancia_m - a.distancia_m)[0];
    if (c)
      cards.push({
        k: 'prova-' + provaFeita.id,
        festa: true,
        html: `<div class="card mom-card"><div class="mom-med">${SELO_SVG('nexos')}</div><div class="grow"><span class="eyebrow">Prova concluída</span><div class="h3">${esc(provaFeita.titulo)}</div><p class="small muted">${f1(c.distancia_m / 1000)} km em <b>${fmtDurLongo(c.duracao_s)}</b> · ${fmtPace(paceDe(c))}</p><div class="row mom-bts"><button class="btn sm" data-story="prova">Card para o story</button><button class="link-btn small" data-fecha="prova-${provaFeita.id}">Fechar</button></div></div></div>`,
        story: {
          eyebrow: 'Prova concluída',
          titulo: provaFeita.titulo,
          grande: fmtDurLongo(c.duracao_s),
          texto: `${f1(c.distancia_m / 1000)} km · pace ${fmtPace(paceDe(c))}`,
          medalha: true,
          grupo: 'nexos',
        },
        nome: 'prova-concluida.png',
      });
  }
  // nova medalha (conquistada nos últimos 3 dias)
  const nova = calcMarcos(h, S.me.criado_em)
    .filter((m) => m.quando && isoDia(m.quando) >= isoDia(Date.now() - 3 * 864e5) && !vistos['m-' + m.k])
    .sort((a, b) => (a.quando < b.quando ? 1 : -1))[0];
  if (nova)
    cards.push({
      k: 'm-' + nova.k,
      festa: true,
      html: `<div class="card mom-card"><div class="mom-med">${SELO_SVG(nova.g, true, nova.k)}</div><div class="grow"><span class="eyebrow">Nova conquista</span><div class="h3">${esc(nova.nome)}</div><p class="small muted">${esc(nova.desc)}</p><div class="row mom-bts"><button class="btn sm" data-story="m">Card para o story</button><a class="btn ghost sm" href="#/medalhas">Ver medalhas</a><button class="link-btn small" data-fecha="m-${nova.k}">Fechar</button></div></div></div>`,
      story: {
        eyebrow: 'Nova conquista',
        titulo: nova.nome,
        texto: nova.desc + '.',
        medalha: true,
        grupo: nova.g,
        rotulo: ROTULO_M(nova.k),
      },
      nome: `conquista-${nova.k}.png`,
    });
  // retrospectiva do mês que acabou (primeiros 7 dias do mês) e do ano (dezembro e começo de janeiro)
  const hj = new Date(),
    mesAnt = isoDia(new Date(hj.getFullYear(), hj.getMonth() - 1, 15)).slice(0, 7);
  if (hj.getDate() <= 7 && !vistos['r-' + mesAnt] && datasAtiv(h).some((d) => isoDia(d).slice(0, 7) === mesAnt))
    cards.push({
      k: 'r-' + mesAnt,
      html: `<a class="card mom-card retro-cta" href="#/retrospectiva/${mesAnt}"><div class="mom-ic">${I.cal}</div><div class="grow"><span class="eyebrow">Retrospectiva</span><div class="h3">Seu ${MESES_N[+mesAnt.slice(5) - 1]} está pronto</div><p class="small muted">Km, horas, recordes e evolução em tela cheia.</p></div>${I.chev}</a>`,
    });
  const ano =
    hj.getFullYear() >= 2027 && hj.getMonth() === 11 && hj.getDate() >= 25 && hj.getDate() <= 30
      ? String(hj.getFullYear())
      : null; // card na tela Hoje só a partir de 2027 (em Evolução todas ficam disponíveis) // retrospectiva do ano: de 25 a 30 de dezembro, até a pessoa ver
  if (ano && !vistos['ra-' + ano] && datasAtiv(h).some((d) => isoDia(d).startsWith(ano)))
    cards.push({
      k: 'ra-' + ano,
      html: `<a class="card mom-card retro-cta ano" href="#/retrospectiva/${ano}"><div class="mom-ic">${I.cal}</div><div class="grow"><span class="eyebrow">Retrospectiva ${ano}</span><div class="h3">Seu ano na Nexos</div><p class="small muted">Tudo o que você construiu em ${ano}.</p></div>${I.chev}</a>`,
    });
  // antes e depois aos 3 meses
  const ini = datasAtiv(h)[0];
  const dd = ini ? diasDesde(ini) : 0;
  if (dd >= 90 && dd <= 100 && !vistos.ad90)
    cards.push({
      k: 'ad90',
      html: `<a class="card mom-card" href="#/antes-depois"><div class="mom-ic">${I.hist}</div><div class="grow"><span class="eyebrow">3 meses de Nexos</span><div class="h3">Seu antes e depois está pronto</div><p class="small muted">Primeiro mês contra agora: pace, FC, volume e composição.</p></div>${I.chev}</a>`,
    });
  if (!cards.length) return;
  box.innerHTML = cards.map((c) => c.html).join('');
  bindModoProva(box);
  if (cards.some((c) => c.festa) && !sessionStorage.getItem('nx-festa-' + cards.find((c) => c.festa).k)) {
    try {
      sessionStorage.setItem('nx-festa-' + cards.find((c) => c.festa).k, '1');
    } catch {}
    confete();
  }
  box.onclick = (e) => {
    const st = e.target.closest('[data-story]');
    if (st) {
      const c = cards.find(
        (x) => x.story && (st.dataset.story === 'prova' ? x.k.startsWith('prova') : x.k.startsWith('m-')),
      );
      if (c) abrirStory(c.story, c.nome);
      return;
    }
    const fx = e.target.closest('[data-fecha]');
    if (fx) {
      const v = store.get('nx-momentos-' + S.user.id, {});
      v[fx.dataset.fecha] = 1;
      store.set('nx-momentos-' + S.user.id, v);
      fx.closest('.mom-card').remove();
      return;
    }
    const a = e.target.closest('a.retro-cta,a[href="#/antes-depois"]');
    if (a) {
      const c =
        cards.find((x) => x.k && a.getAttribute('href').includes(x.k.replace(/^r-|^ra-/, ''))) ||
        cards.find((x) => x.k === 'ad90' && a.getAttribute('href') === '#/antes-depois');
      if (c) {
        const v = store.get('nx-momentos-' + S.user.id, {});
        v[c.k] = 1;
        store.set('nx-momentos-' + S.user.id, v);
      }
    }
  };
}

/* ---------- áudio do treinador na conversa ---------- */
function botaoAudioHTML() {
  return `<button type="button" class="btn ghost send mic" id="mic" aria-label="Gravar áudio">${MIC_IC}</button>`;
}
const MIC_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function bindAudio(box, alunoId, depois) {
  const b = box.querySelector('#mic');
  if (!b) return;
  let rec = null,
    partes = [],
    t0 = 0,
    tm = null;
  b.onclick = async () => {
    if (rec) {
      rec.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Este navegador não grava áudio.', true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return toast('Libere o microfone para gravar.', true);
    }
    const tipo =
      ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      ) || '';
    rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    partes = [];
    t0 = Date.now();
    rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
    rec.onstop = async () => {
      clearInterval(tm);
      stream.getTracks().forEach((t) => t.stop());
      b.classList.remove('gravando');
      b.innerHTML = MIC_IC;
      const seg = Math.round((Date.now() - t0) / 1000);
      const r0 = rec;
      rec = null;
      if (seg < 1) return;
      const mime = (r0.mimeType || 'audio/webm').split(';')[0],
        ext = mime.includes('mp4') || mime.includes('aac') ? 'm4a' : 'webm';
      const path = `${S.org.id}/${alunoId}/${Date.now()}.${ext}`;
      b.disabled = true;
      const { error } = await sb.storage
        .from('nx-audios')
        .upload(path, new Blob(partes, { type: mime }), { contentType: mime });
      if (error) {
        b.disabled = false;
        console.error(error);
        return toast('Não foi possível enviar o áudio.', true);
      }
      const { data: nm, error: e2 } = await sb
        .from('nx_mensagens')
        .insert({
          org_id: S.org.id,
          aluno_id: alunoId,
          autor_id: S.user.id,
          texto: `Mensagem de voz (${seg < 60 ? seg + ' s' : Math.floor(seg / 60) + ' min ' + (seg % 60) + ' s'})`,
          audio_path: path,
          audio_seg: seg,
        })
        .select('id')
        .single();
      b.disabled = false;
      if (e2) return toast('Não foi possível enviar o áudio.', true);
      notificar('mensagem', nm && nm.id);
      depois && depois();
    };
    rec.start();
    b.classList.add('gravando');
    tm = setInterval(() => {
      const s = Math.round((Date.now() - t0) / 1000);
      b.innerHTML = `<span class="mic-t">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span>`;
      if (s >= 120) rec && rec.stop();
    }, 500);
    toast('Gravando. Toque de novo para enviar.');
  };
}
async function carregarAudios(root) {
  const els = [...root.querySelectorAll('[data-audio]')];
  if (!els.length) return;
  const { data } = await sb.storage
    .from('nx-audios')
    .createSignedUrls(
      els.map((e) => e.dataset.audio),
      3600,
    )
    .catch(() => ({ data: [] }));
  (data || []).forEach((u, i) => {
    const a = els[i] && els[i].querySelector('audio');
    if (a && u.signedUrl) a.src = u.signedUrl;
  });
}
