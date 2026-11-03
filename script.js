/* =========================================================
   NEXOS · CONFIGURAÇÃO  (edite aqui)
   ========================================================= */
const CONFIG = {
  whatsapp: '5598900000000',            // DDI+DDD+número, só dígitos (TROCAR)
  instagram: 'https://instagram.com/',  // link do perfil (TROCAR)
  precoAvulsa: 30,                      // valor da aula avulsa em R$ (TROCAR)
  diasFuncional: [2, 4],                // 0=dom 1=seg 2=ter 3=qua 4=qui 5=sex 6=sáb (TROCAR)
  horarios: ['06:00', '18:30'],         // horários do funcional (TROCAR)
  vagasPorTurma: 15,                    // limite por turma (TROCAR)
  local: 'Local do treino (TROCAR)',
  // Quando tiver os links de pagamento (Mercado Pago, InfinitePay etc.), cole aqui:
  linkPix: '',
  linkCartao: '',
  patrocinadores: [
    { nome: 'Vida Mais Medicina do Trabalho', img: 'img/sp-vida-mais.webp' },
    { nome: 'Empório Döll Produtos Naturais', img: 'img/sp-emporio-doll.webp' },
    { nome: 'Iogurte São João', img: 'img/sp-iogurte-sao-joao.webp' },
    { nome: 'Ótica Diniz Prime', img: 'img/sp-diniz.svg' },
  ],
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- NAV / PROGRESS / GLOW ---------- */
const nav = $('#nav'), prog = $('#progress');
addEventListener('scroll', () => {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('scrolled', y > 30);
  prog.style.width = (y / h * 100) + '%';
  updateSteps();
}, { passive: true });

$('#burger').addEventListener('click', e => {
  e.currentTarget.classList.toggle('open'); const ab = $('#links').classList.toggle('open');
  $('#nav').classList.toggle('menu-aberto', ab); document.body.style.overflow = ab ? 'hidden' : '';
});
$$('#links a').forEach(a => a.addEventListener('click', () => {
  $('#burger').classList.remove('open'); $('#links').classList.remove('open');
  $('#nav').classList.remove('menu-aberto'); document.body.style.overflow = '';
}));

const glow = $('#glow');
addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

/* ---------- REVEAL ---------- */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: .15 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });

/* ---------- TEMA CLARO / ESCURO ---------- */
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement), light = document.documentElement.dataset.theme === 'light';
  C.acc = cs.getPropertyValue('--acc-rgb').trim(); C.acc2 = cs.getPropertyValue('--acc2-rgb').trim();
  C.dot = light ? C.acc : '160,236,255'; C.k = light ? 1.6 : 1;
}
function applyLogos() {
  const light = document.documentElement.dataset.theme === 'light';
  $$('[data-logo]').forEach(img => { img.src = `img/${img.dataset.logo}${light ? '-navy' : ''}.png`; });
  document.querySelector('meta[name=theme-color]').content = light ? '#f5f7fc' : '#050c1c';
}
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('nexos-tema', t); } catch (e) {}
  readColors(); applyLogos();
}
$('#theme-btn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  if (document.startViewTransition && !reduce) document.startViewTransition(() => setTheme(next)); else setTheme(next);
});
readColors(); applyLogos();

/* ---------- HERO CANVAS: linhas de fluxo (inspiradas no traço da logo) ---------- */
function flowCanvas(cv, opts = {}) {
  const ctx = cv.getContext('2d');
  let w, h, dpr, t = 0, mx = .5, my = .5;
  const lines = opts.lines || 14;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);
  cv.parentElement.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
  });
  const dots = Array.from({ length: lines }, (_, i) => ({ i, p: Math.random() }));
  function yAt(i, x) {
    const base = h * (.35 + i / lines * .55);
    const amp = 30 + i * 4 + (my - .5) * 60;
    return base + Math.sin(x / w * Math.PI * 1.6 + t * .6 + i * .35) * amp
      - (x / w) * h * .25 + Math.cos(x / 180 + t * .3) * 8 + (mx - .5) * 30 * (x / w);
  }
  function frame() {
    t += .012;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < lines; i++) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      const a = .05 + (i / lines) * .22;
      g.addColorStop(0, `rgba(${C.acc2},0)`); g.addColorStop(.5, `rgba(${C.acc},${a * C.k})`); g.addColorStop(1, `rgba(${C.acc2},${a * .5 * C.k})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 12) { const y = yAt(i, x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    dots.forEach(d => {
      d.p += .0018 + d.i * .00008; if (d.p > 1) d.p = 0;
      const x = d.p * w, y = yAt(d.i, x);
      ctx.fillStyle = `rgba(${C.dot},.9)`; ctx.shadowColor = `rgb(${C.acc})`; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    });
    if (!reduce) requestAnimationFrame(frame);
  }
  frame();
}

/* telemetria ao vivo: alterna Corrida / Musculação */
const tele = { mode: 'run', s: 312, b: 148, c: 172, kg: 80, set: 1, rpe: 7 };
const TELE_LBL = {
  run: [['PACE', 'min/km'], ['FC', 'bpm'], ['CADÊNCIA', 'ppm']],
  gym: [['CARGA', 'kg'], ['SÉRIE', 'de 4'], ['RPE', '/10']],
};
function teleTick() {
  if (tele.mode === 'run') {
    tele.s = Math.max(285, Math.min(340, tele.s + (Math.random() * 8 - 4)));
    tele.b = Math.max(138, Math.min(166, tele.b + Math.round(Math.random() * 4 - 2)));
    tele.c = Math.max(166, Math.min(182, tele.c + Math.round(Math.random() * 2 - 1)));
    $('#t1').textContent = `${Math.floor(tele.s / 60)}:${String(Math.round(tele.s % 60)).padStart(2, '0')}`;
    $('#t2').textContent = tele.b; $('#t3').textContent = tele.c;
  } else {
    if (Math.random() < .35) { tele.set = tele.set % 4 + 1; if (tele.set === 1) tele.kg = tele.kg >= 100 ? 80 : tele.kg + 2.5; }
    tele.rpe = Math.min(10, 6 + tele.set * .8 + (tele.kg - 80) / 20);
    $('#t1').textContent = tele.kg.toLocaleString('pt-BR');
    $('#t2').textContent = tele.set;
    $('#t3').textContent = tele.rpe.toFixed(1).replace('.', ',');
  }
}
function setMode(m) {
  tele.mode = m;
  $$('#mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#mode').classList.toggle('gym', m === 'gym');
  TELE_LBL[m].forEach(([l, u], i) => { $('#t' + (i + 1) + 'l').textContent = l; $('#t' + (i + 1) + 'u').textContent = u; });
  const t = $('#telemetry'); t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip');
  teleTick();
}
$$('#mode button').forEach(b => b.addEventListener('click', () => { clearInterval(tele.auto); setMode(b.dataset.mode); }));
setInterval(teleTick, 1100);
// alterna sozinho entre corrida e musculação até a pessoa tocar
tele.auto = setInterval(() => setMode(tele.mode === 'run' ? 'gym' : 'run'), 7000);

/* ---------- TABS ---------- */
const ink = $('#tab-ink');
function moveInk(btn) { ink.style.left = btn.offsetLeft + 'px'; ink.style.width = btn.offsetWidth + 'px'; }
$$('.tab').forEach(b => b.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === b)); moveInk(b);
  $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === b.dataset.tab));
}));
addEventListener('load', () => moveInk($('.tab.active'))); addEventListener('resize', () => moveInk($('.tab.active')));
$$('.bars span').forEach((s, i) => s.style.setProperty('--i', i));

/* anel do circuito funcional */
(function ring() {
  const fg = $('.ring-fg'), n = $('#ring-count'); let on = true, s = 40;
  setInterval(() => {
    s--; if (s < 0) { on = !on; s = on ? 40 : 20; }
    const tot = on ? 40 : 20;
    n.textContent = s; n.nextElementSibling.textContent = on ? 'seg ON' : 'seg OFF';
    fg.style.stroke = on ? 'var(--acc)' : 'var(--warn)';
    fg.style.strokeDashoffset = 314 * (1 - s / tot);
  }, 1000);
})();

/* tilt 3D */
if (matchMedia('(hover:hover)').matches) $$('.tilt').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  el.addEventListener('pointerleave', () => el.style.transform = '');
});

/* ---------- MÉTODO: linha de progresso ---------- */
function updateSteps() {
  const st = $('#steps'); if (!st) return;
  const r = st.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (innerHeight * .75 - r.top) / r.height));
  const fill = $('#steps-fill');
  if (innerWidth <= 760) { fill.style.height = p * 100 + '%'; fill.style.width = '100%'; }
  else { fill.style.width = p * 100 + '%'; fill.style.height = '100%'; }
}

/* ---------- LAB: pace + Riegel ---------- */
let distKm = 5;
const fmt = sec => {
  sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};
function calc() {
  const tot = (+$('#t-h').value || 0) * 3600 + (+$('#t-m').value || 0) * 60 + (+$('#t-s').value || 0);
  if (!tot) return;
  $('#pace-out').textContent = fmt(tot / distKm);
  const ds = [[5, '5K'], [10, '10K'], [21.0975, '21K'], [42.195, '42K']];
  const preds = ds.map(([d, l]) => [l, tot * Math.pow(d / distKm, 1.06), d]);
  const max = preds[3][1];
  $('#pred').innerHTML = preds.map(([l, t, d]) =>
    `<div class="pred-row ${d === distKm ? 'cur' : ''}"><span>${l}</span><div class="pred-bar"><i style="width:${t / max * 100}%"></i></div><b>${fmt(t)}</b></div>`).join('');
}
$$('#dist-seg button').forEach(b => b.addEventListener('click', () => {
  $$('#dist-seg button').forEach(x => x.classList.toggle('on', x === b)); distKm = +b.dataset.km; calc();
}));
['#t-h', '#t-m', '#t-s'].forEach(id => $(id).addEventListener('input', calc));
calc();

/* troca de ferramenta do Lab */
$$('#lab-switch button').forEach(b => b.addEventListener('click', () => {
  $$('#lab-switch button').forEach(x => x.classList.toggle('on', x === b));
  $$('.lab-pane').forEach(p => { const on = p.dataset.pane === b.dataset.lab; p.classList.toggle('on', on); if (on) p.classList.add('in'); });
}));

/* calculadora de carga (Epley) */
const ZONES = [
  ['Força', '85–90%', '3–5 reps', .85, .90],
  ['Hipertrofia', '70–80%', '6–12 reps', .70, .80],
  ['Resistência', '55–65%', '15+ reps', .55, .65],
];
const r25 = v => Math.round(v / 2.5) * 2.5;
const kgf = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
function calcRM() {
  const w = +$('#rm-w').value || 0, r = +$('#rm-r').value;
  $('#rm-rv').textContent = r;
  if (!w) return;
  const rm = r === 1 ? w : w * (1 + r / 30);
  $('#rm-out').textContent = kgf(r25(rm));
  $('#zones').innerHTML = ZONES.map(([n, pct, reps, a, b]) =>
    `<div class="zone"><div><b>${n}</b><small>${pct} · ${reps}</small></div><div class="zone-kg mono">${kgf(r25(rm * a))}–${kgf(r25(rm * b))} kg</div><div class="zone-bar"><i style="left:${a * 100}%;width:${(b - a) * 100}%"></i></div></div>`).join('');
}
['#rm-w', '#rm-r'].forEach(id => $(id).addEventListener('input', calcRM));
calcRM();

/* ---------- AULA AVULSA ---------- */
const DOW = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const book = { step: 1, date: null, hora: null, nome: '', zap: '', pay: 'pix' };

function goStep(n) {
  book.step = n;
  $$('.bstep').forEach(s => s.classList.toggle('on', +s.dataset.step === n));
  $$('#stepper li').forEach((li, i) => { li.classList.toggle('on', i + 1 === n); li.classList.toggle('done', i + 1 < n); });
  if (n > 1) $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$$('[data-back]').forEach(b => b.addEventListener('click', () => goStep(book.step - 1)));

// vagas simuladas (determinístico por data): na versão real viriam do sistema
function ocupadas(d, h) { const k = d.getDate() * 7 + d.getMonth() * 3 + h.length + +h.slice(0, 2); return (k * 37) % (CONFIG.vagasPorTurma + 1); }

function renderDays() {
  const out = [], d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 28 && out.length < 8; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    if (CONFIG.diasFuncional.includes(x.getDay())) out.push(x);
  }
  $('#days').innerHTML = out.map((x, i) =>
    `<button class="day" data-i="${i}"><small>${DOW[x.getDay()]}</small><b>${x.getDate()}</b><em>${MES[x.getMonth()]}</em></button>`).join('');
  $$('.day').forEach(b => b.addEventListener('click', () => {
    $$('.day').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
    book.date = out[+b.dataset.i]; renderSlots(); setTimeout(() => goStep(2), 220);
  }));
}
function renderSlots() {
  $('#slots').innerHTML = CONFIG.horarios.map(h => {
    const occ = ocupadas(book.date, h), livre = CONFIG.vagasPorTurma - occ, pct = occ / CONFIG.vagasPorTurma * 100;
    return `<button class="slot ${livre <= 3 ? 'low' : ''}" data-h="${h}" ${livre <= 0 ? 'disabled' : ''}>
      <div><b>${h}</b><div class="vagas">Funcional · ${CONFIG.local}</div></div>
      <div style="text-align:right"><div class="vagas">${livre > 0 ? livre + ' vagas' : 'Esgotado'}</div><div class="meter"><i style="width:${pct}%"></i></div></div>
    </button>`;
  }).join('');
  $$('.slot').forEach(b => b.addEventListener('click', () => { book.hora = b.dataset.h; goStep(3); }));
}

// máscara de WhatsApp
$('#f-zap').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  e.target.value = v;
});
$('#form-dados').addEventListener('submit', e => {
  e.preventDefault();
  const nome = $('#f-nome').value.trim(), zap = $('#f-zap').value.replace(/\D/g, '');
  const err = $('#f-err');
  if (nome.length < 3) return err.textContent = 'Informe seu nome completo.';
  if (zap.length < 10) return err.textContent = 'Informe um WhatsApp válido.';
  if (!$('#f-ok').checked) return err.textContent = 'Confirme a declaração para continuar.';
  err.textContent = ''; book.nome = nome; book.zap = $('#f-zap').value;
  renderSummary(); goStep(4);
});
function dataLonga(d) { return `${DOW[d.getDay()].toLowerCase()}, ${d.getDate()} de ${MES[d.getMonth()]}`; }
function renderSummary() {
  $('#summary').innerHTML = `
    <div><span>Aula</span><b>Funcional avulso</b></div>
    <div><span>Data</span><b>${dataLonga(book.date)}</b></div>
    <div><span>Horário</span><b>${book.hora}</b></div>
    <div><span>Nome</span><b>${book.nome}</b></div>
    <div class="total"><span>Total</span><b>${brl(CONFIG.precoAvulsa)}</b></div>`;
}
$$('.pay-opt').forEach(b => b.addEventListener('click', () => {
  $$('.pay-opt').forEach(x => x.classList.toggle('on', x === b)); book.pay = b.dataset.pay;
}));
$('#go-pay').addEventListener('click', () => {
  const link = book.pay === 'pix' ? CONFIG.linkPix : CONFIG.linkCartao;
  if (link) { window.open(link, '_blank', 'noopener'); }
  else toast('Demonstração: o link de pagamento ainda não foi configurado.');
  const msg = encodeURIComponent(`Olá! Reservei uma aula avulsa de funcional na ${dataLonga(book.date)} às ${book.hora}. Nome: ${book.nome}. Pagamento: ${book.pay === 'pix' ? 'Pix' : 'cartão'}.`);
  $('#done-txt').innerHTML = `Na versão final, aqui a pessoa paga com ${book.pay === 'pix' ? 'Pix' : 'cartão'} no checkout seguro e recebe a confirmação.<br><br>
    <a class="btn btn-sm" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${msg}">Enviar comprovante no WhatsApp</a>`;
  goStep(5);
});
$('#restart').addEventListener('click', () => {
  $('#form-dados').reset(); $$('.day').forEach(x => x.classList.remove('sel')); goStep(1);
});
renderDays();

/* ---------- PATROCINADORES ---------- */
(function sponsors() {
  const cards = CONFIG.patrocinadores.map(p => `<div class="sp" title="${p.nome}"><img src="${p.img}" alt="${p.nome}"></div>`).join('')
    + `<a class="sp sp-cta" href="#contato"><div><b>+ você</b>Seja parceiro Nexos</div></a>`;
  // repete para preencher a faixa e duplica para o loop infinito
  const reps = Math.max(2, Math.ceil(8 / (CONFIG.patrocinadores.length + 1)));
  const half = Array(reps).fill(cards).join('');
  $('#marquee-track').innerHTML = half + half;
})();

/* ---------- CONTATO ---------- */
$('#cta-zap').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('Olá! Quero saber mais sobre a assessoria Nexos.')}`;
$('#cta-insta').href = CONFIG.instagram;
$('#year').textContent = new Date().getFullYear();

/* ---------- TREINADORES ---------- */
// contadores animados
const cio = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target, end = +el.dataset.count, plus = el.hasAttribute('data-plus');
  let t0 = null;
  const step = ts => { t0 ??= ts; const p = Math.min(1, (ts - t0) / 1200), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
    el.textContent = (plus && p === 1 ? '+' : '') + v + (el.dataset.count === '10' && p === 1 ? 'x' : ''); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); cio.unobserve(el);
}), { threshold: .6 });
$$('[data-count]').forEach(el => cio.observe(el));

// lightbox por galeria
const lb = { list: [], i: 0 };
function lbShow() { const b = lb.list[lb.i]; $('#lb-img').src = b.dataset.src; $('#lb-img').alt = b.dataset.cap; $('#lb-cap').textContent = b.dataset.cap; }
function lbOpen(btn) {
  lb.list = $$('.gal-item', btn.closest('.gal')); lb.i = lb.list.indexOf(btn); lbShow();
  const one = lb.list.length < 2; $('#lb-prev').hidden = one; $('#lb-next').hidden = one;
  $('#lightbox').classList.add('open'); $('#lightbox').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
}
function lbClose() { $('#lightbox').classList.remove('open'); $('#lightbox').setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
const lbGo = d => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; lbShow(); };
$$('.gal-item').forEach(b => b.addEventListener('click', () => lbOpen(b)));
$('#lb-close').addEventListener('click', lbClose);
$('#lb-prev').addEventListener('click', e => { e.stopPropagation(); lbGo(-1); });
$('#lb-next').addEventListener('click', e => { e.stopPropagation(); lbGo(1); });
$('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') lbClose(); });
addEventListener('keydown', e => {
  if (!$('#lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowRight') lbGo(1); if (e.key === 'ArrowLeft') lbGo(-1);
});
let tx = 0;
$('#lightbox').addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
$('#lightbox').addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) lbGo(d < 0 ? 1 : -1); });

// botão flutuante: aparece depois do topo, some quando a seção de treinadores está na tela
(function fab() {
  const f = $('#fab'), sec = $('#treinadores'); let inView = false;
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; upd(); }, { threshold: .15 }).observe(sec);
  function upd() {
    const fim = scrollY + innerHeight >= document.documentElement.scrollHeight - 160; // chegou ao final
    f.classList.toggle('out', fim);
    f.classList.toggle('show', !fim && scrollY > innerHeight * .6 && !inView);
  }
  addEventListener('scroll', upd, { passive: true }); upd();
})();
/* ---------- FUNDO: logo grande em movimento (efeitos mudam a cada seção) ---------- */
(function bgLogo() {
  const wrap = $('#bg-logo'), mv = $('#bg-logo-move'); if (!wrap) return;
  // cada seção ganha um "jeito" diferente da logo
  const FX = { topo: 'fx-glow', modalidades: 'fx-echo', metodo: 'fx-outline', treinadores: 'fx-scan', treinos: 'fx-echo',
    lab: 'fx-scan', avulsa: 'fx-glow', kit: 'fx-outline', patrocinadores: 'fx-echo', faq: 'fx-outline', contato: 'fx-glow' };
  const ALL = ['fx-glow', 'fx-echo', 'fx-outline', 'fx-scan'];
  function setFx(fx) { if (wrap.classList.contains(fx)) return; ALL.forEach(c => wrap.classList.remove(c)); wrap.classList.add(fx); }
  setFx('fx-glow');
  const io2 = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && FX[en.target.id]) setFx(FX[en.target.id]); }),
    { rootMargin: '-45% 0px -45% 0px' });
  Object.keys(FX).forEach(id => { const el = document.getElementById(id); if (el) io2.observe(el); });

  // movimento conforme a rolagem: desliza de um lado pro outro, gira e cresce de leve
  let q = false;
  function move() {
    q = false;
    const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
    const x = Math.sin(p * Math.PI * 3) * (innerWidth < 760 ? 5 : 20), r = Math.sin(p * Math.PI * 2) * 7, s = 1 + Math.sin(p * Math.PI) * .08, y = Math.cos(p * Math.PI * 4) * 4;
    mv.style.transform = `translate(${x}vw, ${y}vh) rotate(${r}deg) scale(${s})`;
  }
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(move); } }, { passive: true });
  move();
})();

/* abertura do app: logo reluzindo antes de ir para o login */
(function abrirApp() {
  const links = document.querySelectorAll('a[href="app/"]');
  if (!links.length) return;
  const sp = document.createElement('div');
  sp.className = 'splash'; sp.setAttribute('aria-hidden', 'true');
  sp.innerHTML = '<div class="splash-c"><div class="splash-logo"><span class="splash-ring"></span><img src="img/nexos-logo.png" alt=""><span class="splash-shine"></span></div><div class="splash-t">Abrindo a área do aluno</div><div class="splash-bar"><i></i></div></div>';
  document.body.appendChild(sp);
  let pre = false;
  const prefetch = () => { if (pre) return; pre = true; const l = document.createElement('link'); l.rel = 'prefetch'; l.href = 'app/'; document.head.appendChild(l); };
  const rapido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  links.forEach((a) => {
    a.addEventListener('pointerenter', prefetch, { passive: true });
    a.addEventListener('touchstart', prefetch, { passive: true });
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); prefetch();
      ['links', 'burger'].forEach((id) => { const el = document.getElementById(id); if (el) el.classList.remove('open'); });
      sp.classList.remove('saindo'); sp.classList.add('on');
      setTimeout(() => sp.classList.add('saindo'), rapido ? 300 : 1950);
      setTimeout(() => { try { sessionStorage.setItem('nx-splash', Date.now()); } catch {} location.href = a.href; }, rapido ? 450 : 2300);
    });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) sp.classList.remove('on', 'saindo'); });
})();

/* catálogo da camisa: cores, troca sozinho, setas, miniaturas e arrastar com o dedo */
(function catalogo() {
  const root = document.getElementById('cat'); if (!root) return;
  const slides = [...root.querySelectorAll('.cat-slide')], thumbs = [...root.querySelectorAll('.cat-thumbs button')];
  const cores = [...root.querySelectorAll('.cat-cores button')];
  const cap = document.getElementById('cat-cap'), num = document.getElementById('cat-n'), prog = document.getElementById('cat-prog');
  const stage = root.querySelector('.cat-stage'), total = root.querySelector('.cat-num');
  const TEMPO = 4000, parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cor = 'marinho', lista = [], pos = 0, t0 = performance.now(), pausa = false, visivel = false;
  const montar = (c) => {
    cor = c; lista = slides.map((s, k) => k).filter((k) => slides[k].dataset.cor === c);
    cores.forEach((b) => b.classList.toggle('on', b.dataset.cor === c));
    thumbs.forEach((b) => (b.hidden = b.dataset.cor !== c));
    total.innerHTML = `<b id="cat-n"></b> / ${String(lista.length).padStart(2, '0')}`;
    ir(0);
  };
  const ir = (n) => {
    pos = (n + lista.length) % lista.length; const i = lista[pos];
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    thumbs.forEach((b, k) => b.classList.toggle('on', k === i));
    cap.textContent = thumbs[i].getAttribute('aria-label');
    document.getElementById('cat-n').textContent = String(pos + 1).padStart(2, '0');
    const box = thumbs[i].parentElement; box.scrollTo({ left: thumbs[i].offsetLeft - box.clientWidth / 2 + thumbs[i].clientWidth / 2, behavior: 'smooth' });
    t0 = performance.now(); prog.style.width = '0%';
  };
  const tick = (now) => {
    if (!pausa && visivel && !parado) {
      const p = Math.min(1, (now - t0) / TEMPO); prog.style.width = p * 100 + '%';
      if (p >= 1) ir(pos + 1);
    } else t0 = now - (parseFloat(prog.style.width) || 0) / 100 * TEMPO;
    requestAnimationFrame(tick);
  };
  document.getElementById('cat-prev').onclick = () => ir(pos - 1);
  document.getElementById('cat-next').onclick = () => ir(pos + 1);
  thumbs.forEach((b, k) => (b.onclick = () => ir(lista.indexOf(k))));
  cores.forEach((b) => (b.onclick = () => montar(b.dataset.cor)));
  stage.addEventListener('mouseenter', () => (pausa = true));
  stage.addEventListener('mouseleave', () => (pausa = false));
  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; pausa = true; }, { passive: true });
  stage.addEventListener('touchend', (e) => { if (x0 != null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(pos + (dx < 0 ? 1 : -1)); } x0 = null; pausa = false; });
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ir(pos + 1); if (e.key === 'ArrowLeft') ir(pos - 1); });
  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; }, { threshold: 0.3 }).observe(stage);
  montar('marinho');
  requestAnimationFrame(tick);
})();
