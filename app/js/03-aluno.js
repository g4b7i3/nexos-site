/* Nexos App · Área do aluno: mapa do corpo, check-in de prontidão, datas especiais, pesquisa, dicas, meta pessoal, resgate, água e notificações.
   Parte 3 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= ALUNO ================= */
async function buscarTreinosDoAluno(alunoId) {
  const { data, error } = await sb
    .from('nx_treinos')
    .select('id,titulo,foco,observacoes,ordem,ativo,atualizado_em,dias,inicio,nx_treino_itens(id)')
    .eq('aluno_id', alunoId)
    .eq('org_id', S.org.id)
    .order('ordem')
    .order('criado_em');
  if (error) throw error;
  return data || [];
}
async function buscarSessoes(alunoId, limit = 60) {
  let q = sb
    .from('nx_sessoes')
    .select('*')
    .eq('org_id', S.org.id)
    .not('finalizado_em', 'is', null)
    .order('iniciado_em', { ascending: false })
    .limit(limit);
  if (alunoId) q = q.eq('aluno_id', alunoId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
function letraTreino(t, i) {
  const m = String(t.titulo || '').match(/\b([A-Z])\b/);
  return m ? m[1] : String.fromCharCode(65 + (i % 26));
}

/* ---------- mapa do corpo (onde dói): modelo anatômico frente e costas ---------- */
const REG_DOR = {
  pescoco: 'Pescoço e trapézio',
  ombro: 'Ombro',
  braco: 'Braço (bíceps)',
  triceps: 'Braço (tríceps)',
  antebraco: 'Antebraço',
  mao: 'Punho e mão',
  peito: 'Peito',
  abdomen: 'Abdômen',
  quadril: 'Quadril e virilha',
  coxa_f: 'Coxa (frente)',
  joelho: 'Joelho',
  canela: 'Canela',
  tornozelo: 'Tornozelo',
  pe: 'Pé',
  costas: 'Costas',
  lombar: 'Lombar',
  gluteo: 'Glúteo',
  coxa_t: 'Coxa (posterior)',
  panturrilha: 'Panturrilha',
  aquiles: 'Tendão de Aquiles',
  calcanhar: 'Calcanhar e sola',
};
const REG_FEM = ['canela', 'panturrilha', 'coxa_f', 'coxa_t'];
const nomeRegDor = (k) => {
  const m = /^(.*)_(d|e)$/.exec(k);
  const b = m && REG_DOR[m[1]] ? m[1] : k,
    l = m && REG_DOR[m[1]] ? m[2] : '';
  const n = REG_DOR[b] || (b === 'colica' ? 'Cólica menstrual' : b);
  if (!l) return n;
  const lado = REG_FEM.includes(b) ? (l === 'd' ? 'direita' : 'esquerda') : l === 'd' ? 'direito' : 'esquerdo';
  if (/ e /.test(n)) return `${n} (lado ${l === 'd' ? 'direito' : 'esquerdo'})`;
  const i = n.indexOf(' (');
  return i > 0 ? `${n.slice(0, i)} ${lado}${n.slice(i)}` : `${n} ${lado}`;
};
// metade direita do desenho (x >= 100); a outra metade é espelhada. B = braço (deslocado junto com o ombro)
const CORPO_F = {
  frente: [
    ['pescoco', 'M100,54 L108,52 C108,60 109,66 112,72 L100,77 Z', 0, 1],
    ['pescoco', 'M108,62 C114,70 126,73 138,76 C128,79 118,78 112,74 Z', 0, 1],
    ['peito', 'M100,79 L112,76 C122,78 132,82 135,92 C137,102 135,112 129,118 C118,122 108,122 100,119 Z', 0, 1],
    [
      'abdomen',
      'M100,121 C110,124 120,123 129,120 C131,135 128,148 128,160 C129,170 132,178 134,186 C122,194 110,200 100,202 Z',
      0,
      1,
    ],
    ['quadril', 'M100,204 C112,202 124,197 134,189 C138,197 140,205 141,213 C130,219 116,226 104,234 L100,234 Z', 0, 1],
    [
      'coxa_f',
      'M104,236 C116,229 130,221 142,215 C145,237 144,262 139,288 C137,300 133,308 131,313 L108,313 C106,298 104,278 103,258 Z',
      0,
    ],
    ['joelho', 'M108,315 L131,315 C133,322 132,330 129,335 L110,335 C107,330 106,322 108,315 Z', 0],
    [
      'canela',
      'M110,337 L129,337 C133,352 134,368 131,384 C129,394 127,402 126,408 L114,408 C113,396 111,380 109,366 C108,354 108,345 110,337 Z',
      0,
    ],
    ['tornozelo', 'M114,410 L126,410 C127,414 127,418 126,421 L114,421 C113,418 113,414 114,410 Z', 0],
    [
      'pe',
      'M113,423 L126,423 C129,428 133,433 136,437 C138.5,440 139,444 137,446.5 C135,448 131,448.5 127,448.5 L113,448.5 C109.5,448.5 107.5,446 108,442 C108.8,435 110.8,428 113,423 Z',
      0,
    ],
    [
      'ombro',
      'M138,75 C148,75 155,83 155,95 C155,105 152,112 149,118 C145,109 139,101 133,95 C131,86 132,78 138,75 Z',
      1,
    ],
    [
      'braco',
      'M135,100 C141,106 147,112 150,119 C155,129 156,145 154,160 C150,164 142,164 138,162 C136,148 134,130 135,112 Z',
      1,
    ],
    [
      'antebraco',
      'M138,165 C144,167 150,167 154,163 C158,176 159,192 157,210 C155,218 152,224 150,228 L142,228 C141,216 140,200 139,186 C138,178 137,171 138,165 Z',
      1,
    ],
    [
      'mao',
      'M142,229 L151,229 C152.5,233 153.5,237 155,240 C158,243 159.5,248 157.8,251.5 C156.6,253 155,251.5 154,248.5 L153.6,250 C153.8,256 153.6,261 152.8,264 C152.2,266 150.2,266 150,263.6 L149.4,253 L148.9,253 C149,258 148.9,264 148.4,267 C147.9,269 145.8,269 145.6,266.8 L145.3,253 L144.8,253 C144.8,258 144.5,262 144.1,265 C143.7,267 141.8,267 141.7,264.8 L141.9,253 L141.4,253 C141.3,256 141.1,259 140.8,261 C140.4,262.6 138.9,262.4 138.9,260.6 C139,253 139.6,245 140.6,238 Z',
      1,
    ],
  ],
  costas: [
    ['pescoco', 'M100,56 L108,54 C109,62 112,68 118,72 C128,76 136,78 140,80 C131,86 120,95 112,104 L100,109 Z', 0, 1],
    [
      'costas',
      'M100,111 L113,106 C121,96 132,88 141,82 C135,93 134,104 135,114 C133,130 131,146 127,157 C118,161 108,161 100,161 Z',
      0,
      1,
    ],
    ['lombar', 'M100,163 C110,163 119,162 127,159 C128,169 131,179 135,188 C124,192 112,194 100,194 Z', 0, 1],
    [
      'gluteo',
      'M101,196 C113,196 125,194 135,190 C141,200 143,212 141,224 C137,234 127,240 115,240 C107,240 102,236 101,230 Z',
      0,
    ],
    [
      'coxa_t',
      'M102,243 C113,245 129,241 141,229 C144,251 143,273 139,296 C137,304 134,310 131,313 L108,313 C106,296 103,272 102,252 Z',
      0,
    ],
    ['joelho', 'M108,315 L131,315 C132,322 131,328 129,333 L110,333 C108,328 107,322 108,315 Z', 0],
    [
      'panturrilha',
      'M110,335 L129,335 C135,347 137,361 134,377 C132,387 129,395 127,401 L115,401 C113,393 109,383 107,371 C105,357 106,345 110,335 Z',
      0,
    ],
    ['aquiles', 'M115,403 L127,403 C127,411 127,418 128,424 L114,424 C114,418 115,411 115,403 Z', 0],
    ['calcanhar', 'M113,426 L129,426 C131,432 131,440 127,447 L115,447 C111,440 111,432 113,426 Z', 0],
    [
      'ombro',
      'M139,79 C149,77 156,85 156,96 C156,106 153,113 150,118 C146,110 140,103 135,98 C133,89 134,82 139,79 Z',
      1,
    ],
    [
      'triceps',
      'M136,102 C142,108 148,113 151,120 C156,130 156,146 154,160 C150,164 142,164 138,162 C136,148 134,130 136,112 Z',
      1,
    ],
    [
      'antebraco',
      'M138,165 C144,167 150,167 154,163 C158,176 159,192 157,210 C155,218 152,224 150,228 L142,228 C141,216 140,200 139,186 C138,178 137,171 138,165 Z',
      1,
    ],
    [
      'mao',
      'M142,229 L151,229 C152.5,233 153.5,237 155,240 C158,243 159.5,248 157.8,251.5 C156.6,253 155,251.5 154,248.5 L153.6,250 C153.8,256 153.6,261 152.8,264 C152.2,266 150.2,266 150,263.6 L149.4,253 L148.9,253 C149,258 148.9,264 148.4,267 C147.9,269 145.8,269 145.6,266.8 L145.3,253 L144.8,253 C144.8,258 144.5,262 144.1,265 C143.7,267 141.8,267 141.7,264.8 L141.9,253 L141.4,253 C141.3,256 141.1,259 140.8,261 C140.4,262.6 138.9,262.4 138.9,260.6 C139,253 139.6,245 140.6,238 Z',
      1,
    ],
  ],
};
// linhas de detalhe: contornos dos músculos e direção das fibras (só desenho, não recebem toque)
const LIN_COMUM = {
  frente:
    'M104,54 C106,62 108,70 106,78 M103,78 C114,76 126,78 138,77 M128,112 L131,116 M127,118 L131,122 M127,124 L130,128 M104,226 C116,214 128,204 136,192 M136,206 C128,240 118,280 111,312 M126,228 C126,256 124,286 120,308 M140,232 C140,262 136,290 129,310 M108,284 C106,296 110,306 117,308 M104,240 C110,256 112,268 110,280 M114,318 C118,314 124,314 126,320 C126,328 122,332 119,332 C115,332 113,326 114,318 M117,340 C122,360 122,380 119,404 M110,342 C109,356 110,368 112,380 M118,426 L120,439 M122,426 L126,439 M125,425 L131,437 M113.5,441 C113,444 113,446.5 113.6,448 M117.6,441 L118,448.3 M121.6,440.6 L122.4,448.3 M125.5,440 L126.8,448 M129.6,439.4 L131.6,447.4 M110.5,444 C111.5,442.5 113,442.5 113.4,444',
  costas:
    'M104,62 C114,72 128,78 138,80 M102,80 C112,86 124,88 134,86 M112,92 C122,90 130,94 132,104 C128,112 118,116 110,112 M102,94 L114,104 M108,120 C116,130 126,140 128,156 M102,140 C112,146 120,150 126,154 M104,164 C106,176 106,186 104,194 M110,164 C114,176 114,186 112,194 M118,198 C126,202 132,208 136,216 M101,232 C110,238 124,238 134,232 M120,250 C121,270 121,292 120,310 M108,260 C110,280 112,296 114,310 M134,250 C134,270 132,290 128,306 M120,338 C118,356 118,372 120,390 M112,384 C116,392 124,392 128,384 M118,404 L118,422 M123,404 L123,422 M115,441 C119,444 124,444 128,441',
};
const LIN_BRACO = {
  frente:
    'M146,82 C144,94 144,104 147,116 M140,120 C142,136 144,150 146,160 M142,168 C146,184 148,200 150,224 M152,170 C153,190 152,210 150,226 M141.8,246 C144,248 149,248 153.5,246 M143,240 C145,242 149,242 152,240',
  costas:
    'M146,84 C145,96 146,106 148,114 M140,120 C142,134 146,140 150,138 M142,168 C146,184 148,200 150,224 M152,170 C153,190 152,210 150,226 M141.8,246 C144,248 149,248 153.5,246 M143,240 C145,242 149,242 152,240',
};
const CORPO_LIN = {
  frente: {
    M:
      LIN_COMUM.frente +
      ' M100,104 C110,118 124,118 133,104 M104,86 C114,93 124,97 132,97 M104,95 C114,101 124,104 131,103 M100,121 L100,198 M100,138 C106,137 112,137 117,139 M100,155 C106,154 112,154 117,156 M100,172 C106,171 112,171 116,173 M117,124 C121,150 121,172 117,194 M124,124 C126,142 128,162 132,184',
    F:
      LIN_COMUM.frente +
      ' M104,100 C106,114 118,120 128,114 C133,108 133,100 130,94 M100,124 L100,140 M100,150 L100,176 M100,180 C101,182 101,184 100,186 M117,126 C121,150 122,172 118,194 M124,126 C126,142 128,162 132,184',
  },
  costas: { M: 'M100,58 L100,194 ' + LIN_COMUM.costas, F: 'M100,58 L100,194 ' + LIN_COMUM.costas },
};
// braços levemente abertos (posição anatômica): gira em torno da articulação do ombro
function abreBraco(d, F) {
  const cx = F ? 134 : 140,
    cy = 84,
    a = (-9 * Math.PI) / 180,
    co = Math.cos(a),
    si = Math.sin(a);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const dx = +x - cx,
      dy = +y - cy;
    if (dy < 8) return `${x},${y}`;
    const k = Math.min(1, (dy - 8) / 22);
    const ang = a * k;
    const c2 = Math.cos(ang),
      s2 = Math.sin(ang);
    return `${(cx + dx * c2 - dy * s2).toFixed(1)},${(cy + dx * s2 + dy * c2).toFixed(1)}`;
  });
}
// corpo feminino: mesma anatomia com ombros e cintura mais estreitos e quadril mais largo
function deformaF(d, braco) {
  const fx = (y) => {
    const P = [
      [0, 0.93],
      [80, 0.88],
      [120, 0.88],
      [160, 0.83],
      [200, 1.03],
      [235, 1.06],
      [300, 1.01],
      [340, 0.96],
      [460, 0.94],
    ];
    for (let i = 1; i < P.length; i++)
      if (y <= P[i][0]) {
        const [y0, a] = P[i - 1],
          [y1, b] = P[i];
        return a + ((b - a) * (y - y0)) / (y1 - y0);
      }
    return 0.94;
  };
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    x = +x;
    y = +y;
    let nx;
    if (braco) {
      const ax = 141.4;
      nx = 100 + (x - 100) * 0.9;
      nx = ax + (nx - ax) * 0.84;
    } else nx = 100 + (x - 100) * fx(y);
    return `${nx.toFixed(1)},${y}`;
  });
}
function corpoSVG(sexo, vista) {
  const F = sexo === 'F';
  const lv = vista === 'frente' ? 'e' : 'd',
    lo = lv === 'e' ? 'd' : 'e'; // lado da pessoa na metade direita do desenho
  const esp = ' transform="translate(200 0) scale(-1 1)"';
  const regs = CORPO_F[vista]
    .map(([r, d, b, meio]) => {
      let dd = F ? deformaF(d, b) : d;
      if (b) dd = abreBraco(dd, F);
      return meio
        ? `<path d="${dd}" data-r="${r}"/><path d="${dd}" data-r="${r}"${esp}/>`
        : `<path d="${dd}" data-r="${r}_${lv}"/><path d="${dd}" data-r="${r}_${lo}"${esp}/>`;
    })
    .join('');
  const lin =
    (F ? deformaF(CORPO_LIN[vista].F, 0) : CORPO_LIN[vista].M) +
    ' ' +
    abreBraco(F ? deformaF(LIN_BRACO[vista], 1) : LIN_BRACO[vista], F);
  const cab =
    vista === 'frente'
      ? F
        ? '<path class="cp-cab" d="M82,36 C80,14 90,6 100,6 C110,6 120,14 118,36 C118,48 120,58 122,66 C118,66 116,62 115,56 C116,44 114,30 108,22 C100,26 92,26 86,24 C84,34 84,46 85,56 C84,62 82,66 78,66 C80,58 82,48 82,36 Z"/>'
        : '<path class="cp-cab" d="M83,30 C82,14 90,8 100,8 C110,8 118,14 117,30 C114,20 108,17 100,17 C92,17 86,20 83,30 Z"/>'
      : F
        ? '<path class="cp-cab" d="M82,34 C80,12 90,5 100,5 C110,5 120,12 118,34 C119,48 121,58 123,68 C114,72 106,73 100,73 C94,73 86,72 77,68 C79,58 81,48 82,34 Z"/>'
        : '<path class="cp-cab" d="M83,32 C82,12 90,7 100,7 C110,7 118,12 117,32 C116,42 112,48 100,48 C88,48 84,42 83,32 Z"/>';
  const g = 'cpg-' + vista + (F ? 'f' : 'm');
  const base = CORPO_F[vista]
    .map(([, d, b]) => {
      let dd = F ? deformaF(d, b) : d;
      if (b) dd = abreBraco(dd, F);
      return `<path d="${dd}"/><path d="${dd}"${esp}/>`;
    })
    .join('');
  return `<svg viewBox="14 0 172 452" class="corpo-svg" role="img" aria-label="Corpo ${vista === 'frente' ? 'de frente' : 'de costas'}">
    <defs><radialGradient id="${g}" cx="38%" cy="30%" r="80%"><stop offset="0" class="cp-g1"/><stop offset="1" class="cp-g2"/></radialGradient>
      <radialGradient id="${g}-on" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ff8a80"/><stop offset="1" stop-color="#d93a3a"/></radialGradient></defs>
    <g class="cp-deco"><ellipse cx="100" cy="32" rx="${F ? 16 : 17}" ry="22"/><ellipse cx="${F ? 83.5 : 82.5}" cy="35" rx="3" ry="5.5"/><ellipse cx="${F ? 116.5 : 117.5}" cy="35" rx="3" ry="5.5"/></g>${cab}
    <g class="cp-base">${base}</g>
    <g class="cp-reg" style="--g:url(#${g});--gon:url(#${g}-on)">${regs}</g><path class="cp-lin" d="${lin}"/><path class="cp-lin" d="${lin}"${esp}/></svg>`;
}
function mapaCorpoHTML(sexo) {
  return `<div class="corpo-map"><div class="corpo-v"><span>Frente</span>${corpoSVG(sexo, 'frente')}</div><div class="corpo-v"><span>Costas</span>${corpoSVG(sexo, 'costas')}</div></div><div class="corpo-sel small muted" id="corpo-sel">Toque nas partes do corpo onde sente dor.</div>`;
}
function bindMapaCorpo(root, sel) {
  const atual = () => {
    root.querySelectorAll('[data-r]').forEach((e) => e.classList.toggle('on', sel.has(e.dataset.r)));
    const t = root.querySelector('#corpo-sel');
    if (t)
      t.innerHTML = sel.size
        ? [...sel].map((k) => `<span class="tag err">${esc(nomeRegDor(k))}</span>`).join(' ')
        : 'Toque nas partes do corpo onde sente dor.';
  };
  root.querySelectorAll('.cp-reg [data-r]').forEach((e) => {
    e.onclick = () => {
      const r = e.dataset.r;
      sel.has(r) ? sel.delete(r) : sel.add(r);
      try {
        navigator.vibrate && navigator.vibrate(8);
      } catch {}
      atual();
    };
  });
  atual();
}

/* ---------- check-in de prontidão (manhã) ---------- */
// questionário de bem-estar no modelo de Hooper e McLean: 4 itens, 1 = pior, 5 = melhor (total 4 a 20)
const PRONT_Q = [
  ['sono', 'Como você dormiu?', ['Muito mal', 'Mal', 'Regular', 'Bem', 'Muito bem']],
  ['energia', 'Como está sua energia?', ['Exausto', 'Cansado', 'Normal', 'Disposto', 'Muito disposto']],
  ['dor', 'Dor muscular', ['Muita dor', 'Dor', 'Incômodo leve', 'Quase nada', 'Nenhuma']],
  ['estresse', 'Estresse', ['Muito alto', 'Alto', 'Normal', 'Baixo', 'Muito baixo']],
];
const PRONT_COR = ['#e5484d', '#f08a32', '#e3b341', '#5fbf73', '#2fa565'];
const prontAlerta = (r) =>
  ['sono', 'energia', 'dor', 'estresse'].some((k) => r[k] === 1) ||
  r.dor <= 2 ||
  r.sono + r.energia + r.dor + r.estresse <= 10;
const prontNivel = (t) => (t >= 16 ? ['Boa', 'ok'] : t >= 12 ? ['Moderada', 'warn'] : ['Baixa', 'err']);
function prontCardHTML() {
  return `<button class="list-item msg-row pront-row" id="pront-abrir" style="width:100%;text-align:left"><span class="ativ-ic">${PRONT_IC}</span><div class="grow"><b>Check-in do dia</b><div class="small muted">Sono, energia, dor e estresse · 20 segundos</div></div>${I.chev}</button>`;
}
function abrirProntidao(aoSalvar) {
  const r = {},
    sel = new Set();
  let dInt = null;
  openSheet(
    `<p class="eyebrow">Check-in da manhã</p><div class="h2" style="margin-top:4px">Como você está hoje?</div><p class="small muted" style="margin-top:4px">Seu treinador usa essas respostas para ajustar o treino.</p>
    <form id="f-pront" style="margin-top:14px">${PRONT_Q.map(
      ([k, t, op]) =>
        `<div class="pq"><b>${t}</b><div class="pq-op">${op
          .map((o) =>
            S.me.sexo === 'F'
              ? o.replace(/^(Exaust|Cansad|Dispost)o$/, '$1a').replace(/^Muito disposto$/, 'Muito disposta')
              : o,
          )
          .map(
            (o, i) =>
              `<button type="button" data-q="${k}" data-v="${i + 1}" style="--pc:${PRONT_COR[i]}">${o}</button>`,
          )
          .join('')}</div></div>`,
    ).join('')}
    <div id="pront-dor" hidden><div class="pq"><b>Onde dói?</b>${mapaCorpoHTML(S.me.sexo)}</div>
      <div class="pq"><b>Intensidade da dor</b><div class="pq-int">${Array.from({ length: 11 }, (_, i) => `<button type="button" data-int="${i}">${i}</button>`).join('')}</div><div class="row between tiny dim" style="margin-top:4px"><span>sem dor</span><span>pior dor possível</span></div></div></div>
    <div id="pront-ciclo"></div>
    <label class="field" style="margin-top:6px"><span>Algo mais para o treinador? (opcional)</span><textarea class="input" name="obs" rows="2" maxlength="500" placeholder="Ex.: dormi pouco por causa do trabalho"></textarea></label>
    <button class="btn block" id="pront-env" disabled>Enviar check-in</button></form>`,
    (root) => {
      const f = root.querySelector('#f-pront'),
        btn = root.querySelector('#pront-env'),
        boxDor = root.querySelector('#pront-dor');
      // ciclo: só para alunas com o acompanhamento ativo; perguntas completas nos dias de menstruação (prevista ou já registrada)
      let cic = null,
        cicR = null,
        cicAntes = null;
      if (S.me.sexo === 'F') {
        const hj = hojeISO();
        Promise.all([
          buscarCiclo(S.user.id).catch(() => null),
          sb
            .from('nx_ciclo_dias')
            .select('*')
            .eq('aluno_id', S.user.id)
            .gte('dia', somaDias(hj, -1))
            .then(
              (x) => x.data || [],
              () => [],
            ),
        ]).then(([c, ds]) => {
          const box = root.querySelector('#pront-ciclo');
          if (!box || !c || !c.ativo || c.situacao === 'contraceptivo' || c.situacao === 'nao_menstrua') return;
          cic = c;
          cicAntes = ds.find((x) => x.dia === hj) || null;
          const ontem = ds.find((x) => x.dia === somaDias(hj, -1)),
            inf = cicloInfo(c) || {};
          const naMenstruacao =
            (ontem && ontem.menstruada) ||
            inf.fase === 'menstrual' ||
            inf.atraso > 0 ||
            (cicAntes && cicAntes.menstruada);
          const montar = (r0) => {
            cicR = r0;
            box.innerHTML = `<div class="pront-cic"><p class="eyebrow" style="color:${CIC_ROSA}">Ciclo menstrual</p>${camposCicloHTML(cicR, true)}</div>`;
            bindCamposCiclo(box.querySelector('.cic-campos'), cicR);
          };
          if (naMenstruacao)
            montar({
              ...(cicAntes || {}),
              menstruada: cicAntes ? cicAntes.menstruada : null,
              sintomas: (cicAntes && cicAntes.sintomas) || [],
            });
          else {
            box.innerHTML = `<button type="button" class="link-btn small pront-cic-ini" style="color:${CIC_ROSA}">Minha menstruação começou hoje</button>`;
            box.querySelector('button').onclick = () =>
              montar({ ...(cicAntes || {}), menstruada: true, sintomas: (cicAntes && cicAntes.sintomas) || [] });
          }
        });
      }
      bindMapaCorpo(boxDor, sel);
      const pronto = () => {
        btn.disabled = !(r.sono && r.energia && r.dor && r.estresse);
      };
      f.onclick = (e) => {
        const b = e.target.closest('[data-q]');
        if (b) {
          r[b.dataset.q] = +b.dataset.v;
          b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          if (b.dataset.q === 'dor') boxDor.hidden = r.dor > 2;
          pronto();
        }
        const ib = e.target.closest('[data-int]');
        if (ib) {
          dInt = +ib.dataset.int;
          ib.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === ib));
        }
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const comDor = r.dor <= 2;
        if (comDor && !sel.size) return toast('Toque no boneco para mostrar onde dói.', true);
        const row = {
          org_id: S.org.id,
          aluno_id: S.user.id,
          dia: isoDia(new Date()),
          sono: r.sono,
          energia: r.energia,
          dor: r.dor,
          estresse: r.estresse,
          dor_locais: comDor ? [...sel] : null,
          dor_int: comDor ? dInt : null,
          obs: f.obs.value.trim() || null,
        };
        row.alerta = prontAlerta(row);
        btn.disabled = true;
        const { data, error } = await sb
          .from('nx_prontidao')
          .upsert(row, { onConflict: 'aluno_id,dia' })
          .select('id')
          .single();
        if (error) {
          btn.disabled = false;
          console.error(error);
          return toast('Não foi possível enviar. Tente de novo.', true);
        }
        if (row.alerta) notificar('prontidao', data.id);
        let novoIni = false;
        if (cic && cicR && (cicR.menstruada != null || (cicR.sintomas || []).length)) {
          const rc = await salvarDiaCiclo(
            {
              ...(cicAntes || {}),
              ...cicR,
              dia: row.dia,
              humor: (cicAntes && cicAntes.humor) || [],
              nota: (cicAntes && cicAntes.nota) || null,
            },
            cic.inicios,
          );
          novoIni = !!rc.novoInicio;
        }
        closeSheet();
        toast(
          novoIni ? 'Check-in enviado. O início da menstruação foi registrado.' : 'Check-in enviado ao seu treinador.',
        );
        if (aoSalvar) aoSalvar(row);
      };
    },
  );
}
// respostas completas de um check-in (toque numa linha da tabela de prontidão)
const PRONT_ROWS = new Map();
function prontDetalhe(x) {
  if (!S.staff) return prontDetalheAluno(x);
  const [n] = prontNivel(x.total);
  const motivos = [
    ...PRONT_Q.filter(([k]) => x[k] === 1).map(([k, , op]) => `${PRONT_CURTO[k]}: “${op[0]}”`),
    ...(x.dor <= 2 && x.dor !== 1 ? ['Dor muscular marcada como “Dor”'] : []),
    ...(x.total <= 10 ? ['Soma de 10 ou menos'] : []),
  ];
  const hora = x.criado_em
    ? new Date(x.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
  const nome = x._nome || (!S.staff && S.me ? S.me.nome : '') || 'Atleta';
  // cor e situação no estilo de um boletim clínico
  const nivel = x.alerta ? 'alerta' : x.total >= 16 ? 'boa' : x.total >= 12 ? 'mod' : 'alerta';
  const SIT = {
    boa: ['Pronto para treinar', '#3ef0b0'],
    mod: ['Atenção ao volume', '#f5c04a'],
    alerta: ['Em alerta', '#ff5d6c'],
  }[nivel];
  const pct = Math.max(0, Math.min(1, (x.total - 4) / 16));
  const R = 54;
  const C = 2 * Math.PI * R;
  // número do atleta na assessoria (ordem de entrada), como numa matrícula
  const mat = x._mat || (!S.staff && S.me ? S.me.matricula : null);
  const bat = 'M0 60 L40 60 L50 54 L58 60 L72 60 L78 66 L86 14 L94 90 L102 60 L128 60 L140 50 L154 60 L200 60';
  const ecg = [0, 200, 400, 600]
    .map((dx) => bat.replace(/(\d+) (\d+)/g, (_, a, b) => `${+a + dx} ${b}`))
    .join(' ')
    .replace(/ M/g, ' L');
  const el = telaCheia(
    'md-tela',
    'Check-in de prontidão',
    `<div class="md-fundo" aria-hidden="true"><div class="md-papel"></div><div class="md-luz"></div>
      <img class="md-marca" src="icons/simbolo.svg" alt="">
      <div class="md-ecg"><svg viewBox="0 0 800 120" preserveAspectRatio="none"><path d="${ecg}"/></svg></div>
      <div class="md-ecg b"><svg viewBox="0 0 800 120" preserveAspectRatio="none"><path d="${ecg}"/></svg></div>
      <div class="fb-scan md-scan"></div></div>
    <button class="fb-x" aria-label="Fechar">${I.x}</button>
    <div class="fb-conteudo">
      <header class="fb-topo md-topo"><img src="icons/wordmark.svg" alt="Nexos Performance e Saúde"><span><b class="md-vivo"></b>Boletim de prontidão</span></header>
      <div class="md-card" style="--md:${SIT[1]}">
        <div class="md-cab"><div><p class="md-rot">Atleta</p><div class="md-nome">${esc(nome)}</div>
          <div class="md-quando">Check-in da manhã · ${esc(fmtDia(x.dia))}${hora ? ` · ${hora}` : ''}</div></div>
          ${mat ? `<span class="md-cod"><small>Nexos</small>Nº ${String(mat).padStart(3, '0')}</span>` : ''}</div>
        <div class="md-geral">
          <div class="md-anel"><svg viewBox="0 0 128 128"><circle cx="64" cy="64" r="${R}" class="md-trilho"/><circle cx="64" cy="64" r="${R}" class="md-arco" style="stroke-dasharray:${C};--md-fim:${C * (1 - pct)};stroke-dashoffset:${C}"/></svg>
            <div class="md-num"><b>${x.total}</b><span>de 20</span></div></div>
          <div class="md-sit"><p class="md-rot">Situação</p><div class="md-sit-v"><i></i>${SIT[0]}</div>
            <p class="md-sit-d">Prontidão ${n.toLowerCase()}${motivos.length ? `. Em alerta por: ${esc(motivos.join('; '))}` : ''}.</p></div>
        </div>
        <div class="md-sinais">${PRONT_Q.map(([k, t, op]) => {
          const v = x[k];
          const cor = PRONT_COR[v - 1];
          return `<div class="md-sinal" style="--c:${cor}"><p class="md-rot">${PRONT_CURTO[k]}</p><div class="md-v"><b>${v}</b><span>/5</span></div>
            <div class="md-seg">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</div><p class="md-resp">${esc(op[v - 1])}</p></div>`;
        }).join('')}</div>
        ${
          (x.dor_locais || []).length
            ? `<div class="md-dor"><p class="md-rot">Onde dói</p><div class="md-dor-l">${x.dor_locais.map((d) => `<span>${esc(nomeRegDor(d))}</span>`).join('')}</div>
          ${x.dor_int != null ? `<div class="md-int"><div class="md-int-b"><i style="width:${x.dor_int * 10}%;background:${x.dor_int <= 3 ? '#3ef0b0' : x.dor_int <= 6 ? '#f5c04a' : '#ff5d6c'}"></i></div><b>${x.dor_int}/10</b></div>` : ''}</div>`
            : ''
        }
        ${x.obs ? `<div class="md-obs"><p class="md-rot">Relato do atleta</p><p>“${esc(x.obs)}”</p></div>` : ''}
        <div class="md-rodape"><img src="icons/simbolo.svg" alt=""><span>Escala de bem-estar de Hooper e McLean: 4 perguntas de 1 a 5, total de 4 a 20. Boa de 16 a 20 · moderada de 12 a 15 · baixa até 11.</span></div>
      </div>
    </div>`,
  );
  requestAnimationFrame(() =>
    setTimeout(() => {
      const a = el.querySelector('.md-arco');
      if (a) a.style.strokeDashoffset = a.style.getPropertyValue('--md-fim');
    }, 120),
  );
}
// aluno vê as respostas do jeito simples; a tela de monitor é só do treinador
function prontDetalheAluno(x) {
  const [n, cls] = prontNivel(x.total);
  const motivos = [
    ...PRONT_Q.filter(([k]) => x[k] === 1).map(([k, , op]) => `${PRONT_CURTO[k]}: “${op[0]}”`),
    ...(x.dor <= 2 && x.dor !== 1 ? ['Dor muscular marcada como “Dor”'] : []),
    ...(x.total <= 10 ? ['Soma de 10 ou menos'] : []),
  ];
  const hora = x.criado_em
    ? new Date(x.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
  openSheet(`<p class="eyebrow">Check-in da manhã</p><div class="h2" style="margin-top:4px">${fmtDia(x.dia)}${hora ? ` · ${hora}` : ''}</div>
    <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><span class="tag ${cls}">Prontidão ${n.toLowerCase()}: ${x.total} de 20</span>${x.alerta ? '<span class="tag err">Em alerta</span>' : ''}</div>
    <div class="stack" style="margin-top:14px;gap:12px">${PRONT_Q.map(
      ([
        k,
        t,
        op,
      ]) => `<div class="pd-q"><div class="row between" style="gap:8px"><b>${t}</b><span class="pd-v" style="background:${PRONT_COR[x[k] - 1]}">${x[k]} de 5</span></div>
      <div class="pd-op">${op.map((o, i) => `<span class="${i + 1 === x[k] ? 'on' : ''}" style="${i + 1 === x[k] ? `border-color:${PRONT_COR[i]};background:color-mix(in srgb,${PRONT_COR[i]} 18%,transparent)` : ''}">${o}</span>`).join('')}</div>
      ${k === 'dor' && (x.dor_locais || []).length ? `<p class="small" style="margin-top:6px;color:var(--err)">Onde dói${x.dor_int != null ? ` (${x.dor_int}/10)` : ''}: ${x.dor_locais.map((d) => esc(nomeRegDor(d))).join(', ')}</p>` : ''}</div>`,
    ).join('')}</div>
    ${x.obs ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Comentário do aluno</span><p style="margin-top:6px">${esc(x.obs)}</p></div>` : ''}
    <div class="card" style="margin-top:12px"><span class="eyebrow">Como ler</span><p class="small" style="margin-top:6px">A prontidão é a soma das 4 respostas (de 4 a 20). <b>Boa</b>: 16 a 20 · <b>Moderada</b>: 12 a 15 · <b>Baixa</b>: 11 ou menos.${motivos.length ? ` Em alerta por: ${motivos.join('; ')}.` : ''}</p></div>`);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pront]');
  if (!b) return;
  const x = PRONT_ROWS.get(b.dataset.pront);
  if (x) prontDetalhe(x);
});
async function prontStaffHTML(m) {
  const ini = isoDia(Date.now() - 13 * 864e5);
  const rows = await sb
    .from('nx_prontidao')
    .select('*')
    .eq('aluno_id', m.user_id)
    .gte('dia', ini)
    .order('dia', { ascending: false })
    .then(
      (r) => r.data || [],
      () => [],
    );
  if (!rows.length)
    return `<div class="card pront-staff"><div class="row between"><b>${PRONT_IC} Prontidão</b><span class="tiny dim">check-in da manhã</span></div><p class="small muted" style="margin-top:8px">O aluno ainda não respondeu o check-in nos últimos 14 dias.</p></div>`;
  const media = rows.reduce((a, x) => a + x.total, 0) / rows.length;
  return `<div class="card pront-staff"><div class="row between"><b>${PRONT_IC} Prontidão</b><span class="tiny dim">últimos 14 dias</span></div>
    <p class="small muted" style="margin-top:6px">Média <b>${f1(media)}/20</b> em ${rows.length} ${rows.length === 1 ? 'resposta' : 'respostas'}. Cada pergunta vale de 1 a 5, e 5 é sempre o melhor (na dor, 5 = nenhuma dor). Toque num dia para ver as respostas.</p>
    <div class="ps-cab tiny dim"><span></span><span>Sono</span><span>Energia</span><span>Dor</span><span>Estresse</span><span>Total</span></div>
    ${rows
      .map((x) => {
        PRONT_ROWS.set(x.id, { ...x, _nome: m.nome, _mat: m.matricula });
        const [n, cls] = prontNivel(x.total);
        return `<div class="ps-lin${x.alerta ? ' alerta' : ''}" data-pront="${x.id}" role="button" tabindex="0"><span class="tiny">${fmtCurto(x.dia)}</span>${['sono', 'energia', 'dor', 'estresse'].map((k) => `<i style="background:${PRONT_COR[x[k] - 1]}" title="${PRONT_Q.find((q) => q[0] === k)[2][x[k] - 1]}">${x[k]}</i>`).join('')}<b class="tag ${cls}">${x.total} · ${n}</b></div>${x.dor_locais && x.dor_locais.length ? `<div class="ps-dor small">Dor${x.dor_int != null ? ` ${x.dor_int}/10` : ''}: ${x.dor_locais.map((k) => esc(nomeRegDor(k))).join(', ')}</div>` : ''}${x.obs ? `<div class="ps-dor small muted">"${esc(x.obs)}"</div>` : ''}`;
      })
      .join('')}</div>`;
}

/* ---------- datas especiais: aniversários e marcos dos alunos, com mensagem pronta ---------- */
const MARCO_TXT = {
  aniversario: (x) => ['Faz aniversário hoje', x.valor ? `${x.valor} anos` : ''],
  tempo: (x) => [
    `Completa ${x.valor >= 12 ? (x.valor % 12 ? `${x.valor} meses` : `${x.valor / 12} ano${x.valor > 12 ? 's' : ''}`) : `${x.valor} meses`} de Nexos`,
    '',
  ],
  km: (x) => [`Passou de ${x.valor.toLocaleString('pt-BR')} km corridos na Nexos`, ''],
  treinos: (x) => [`Chegou a ${x.valor} treinos registrados`, ''],
};
function msgMarco(x) {
  const n = firstName(x.nome),
    eu = firstName(S.me.nome);
  if (x.tipo === 'aniversario')
    return `Parabéns, ${n}! Hoje o dia é seu. Toda a equipe Nexos deseja um novo ano com muita saúde, treinos bons e conquistas. Conte sempre com a gente!\n\n${eu}, Nexos Performance e Saúde`;
  if (x.tipo === 'tempo') {
    const t = MARCO_TXT.tempo(x)[0].replace('Completa ', '').replace(' de Nexos', '');
    return `${n}, hoje você completa ${t} de Nexos! Obrigado pela confiança e pela dedicação. A sua evolução nesse tempo é real, e o melhor ainda está por vir. Bora para a próxima fase!\n\n${eu}`;
  }
  if (x.tipo === 'km')
    return `${n}, você passou dos ${x.valor.toLocaleString('pt-BR')} km corridos com a Nexos! Isso é constância de verdade, um treino de cada vez. Parabéns, e bora para os próximos quilômetros!\n\n${eu}`;
  return `${n}, você chegou a ${x.valor} treinos registrados na Nexos! Disciplina é o que faz o resultado aparecer, e você está mostrando isso. Parabéns!\n\n${eu}`;
}
const ICO_MARCO = { aniversario: I.bolo || I.flag, tempo: I.cal, km: I.run, treinos: I.check };
/* ---------- pesquisa de satisfação (a cada 3 meses) ---------- */
async function pesquisaSatisfacao(box) {
  if (!box || S.staff || !S.me.criado_em || diasDesde(S.me.criado_em) < 90) return;
  const ult = await sb
    .from('nx_satisfacao')
    .select('adiada,criado_em')
    .eq('aluno_id', S.user.id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => (r.data || [])[0] || null,
      () => undefined,
    );
  if (ult === undefined || (ult && diasDesde(ult.criado_em) < (ult.adiada ? 14 : 90))) return;
  box.innerHTML = `<button type="button" class="list-item" id="sat-abrir" style="width:100%;text-align:left"><span class="ativ-ic">${I.feed}</span><div class="grow"><b>Como está sendo a Nexos para você?</b><div class="small muted">Uma nota rápida, leva 10 segundos.</div></div>${I.chev}</button>`;
  const sec = document.getElementById('pend-sec');
  if (sec) sec.hidden = false;
  const salvar = async (row) => {
    const { error } = await sb.from('nx_satisfacao').insert({ org_id: S.org.id, ...row });
    if (error) {
      toast('Não foi possível enviar. Tente de novo.', true);
      return false;
    }
    box.innerHTML = '';
    return true;
  };
  box.querySelector('#sat-abrir').onclick = () =>
    openSheet(
      `<p class="eyebrow">Pesquisa rápida</p><div class="h2">De 0 a 10, quanto você recomendaria a Nexos para um amigo?</div>
    <div class="sat-esc" id="sat-esc">${Array.from({ length: 11 }, (_, i) => `<button type="button" data-n="${i}">${i}</button>`).join('')}</div>
    <div class="row between tiny dim" style="margin-top:4px"><span>Nada provável</span><span>Com certeza</span></div>
    <label class="field" style="margin-top:14px"><span id="sat-perg">Quer contar o motivo? (opcional)</span><textarea class="input" id="sat-com" rows="3" maxlength="1500" placeholder="O que está bom e o que podemos melhorar"></textarea></label>
    <button class="btn block" id="sat-env" disabled>Enviar</button>
    <button class="link-btn small" id="sat-dep" style="display:block;margin:10px auto 0">Agora não</button>
    <p class="tiny dim" style="text-align:center;margin-top:8px">Só a equipe Nexos vê sua resposta.</p>`,
      (el) => {
        let nota = null;
        el.querySelector('#sat-esc').onclick = (e) => {
          const b = e.target.closest('[data-n]');
          if (!b) return;
          nota = +b.dataset.n;
          el.querySelectorAll('#sat-esc button').forEach((x) => x.classList.toggle('on', x === b));
          el.querySelector('#sat-env').disabled = false;
          el.querySelector('#sat-perg').textContent =
            nota >= 9
              ? 'O que você mais gosta? (opcional)'
              : nota >= 7
                ? 'O que faria a nota ser 10? (opcional)'
                : 'O que não está funcionando para você? (opcional)';
        };
        el.querySelector('#sat-env').onclick = async () => {
          if (nota == null) return;
          const com = el.querySelector('#sat-com').value.trim();
          if (await salvar({ nota, comentario: com || null, adiada: false })) {
            closeSheet();
            toast('Obrigado! Sua resposta chegou para a equipe.');
          }
        };
        el.querySelector('#sat-dep').onclick = async () => {
          if (await salvar({ nota: null, adiada: true })) closeSheet();
        };
      },
    );
}
/* ================= DICAS, META PESSOAL E RESGATE ================= */

/* ---------- dicas da Nexos: a equipe escreve e publica; o aluno lê ---------- */
const DICA_CAT = {
  sono: 'Sono',
  alimentacao: 'Alimentação',
  hidratacao: 'Hidratação',
  recuperacao: 'Recuperação',
  prova: 'Dia de prova',
  treino: 'Treino',
};
async function viewDicas(cat) {
  loading();
  S.staff ? dockStaff() : dockAluno();
  const { data } = await sb
    .from('nx_dicas')
    .select('*')
    .eq('org_id', S.org.id)
    .order('criado_em', { ascending: false })
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const todas = data || [];
  if (!S.staff)
    try {
      store.set('nx-dicas-visto', new Date().toISOString());
    } catch {}
  const pubs = todas.filter((d) => d.publicada),
    rasc = todas.filter((d) => !d.publicada);
  const lista = S.staff ? todas : pubs;
  const cats = Object.keys(DICA_CAT).filter((k) => lista.some((d) => d.categoria === k));
  const sel = cat && DICA_CAT[cat] ? cat : 'todas';
  const vis = sel === 'todas' ? pubs : pubs.filter((d) => d.categoria === sel);
  const item = (d) =>
    `<details class="card dica"><summary><span class="tag acc">${DICA_CAT[d.categoria]}</span><b>${esc(d.titulo)}</b></summary><p>${esc(d.texto)}</p>${d.fonte ? `<p class="tiny dim dica-fonte">Fonte: ${esc(d.fonte)}</p>` : ''}${S.staff ? `<button class="link-btn small" data-dica="${d.id}" style="margin-top:8px">Editar</button>` : ''}</details>`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Nexos</p><h1 class="h1">Dicas da Nexos</h1>
    <p class="muted" style="margin-top:6px">${S.staff ? 'Textos curtos com base científica. Os alunos só veem as dicas publicadas.' : 'Textos curtos da equipe Nexos sobre sono, alimentação, recuperação e prova, com a fonte de cada um.'}</p>
    ${S.staff ? `<button class="btn block" id="dica-nova" style="margin-top:14px">${I.plus || '+'} Nova dica</button>` : ''}
    ${S.staff && rasc.length ? `<p class="sec-lbl">Rascunhos para revisar <span class="tag warn">${rasc.length}</span></p><div class="stack">${rasc.map(item).join('')}</div>` : ''}
    ${S.staff ? `<p class="sec-lbl">Publicadas</p>` : ''}
    ${
      cats.length > 1 && pubs.length > 3
        ? `<div class="chips" id="dica-cat" style="margin-top:12px"><button class="chip ${sel === 'todas' ? 'on' : ''}" data-c="todas">Todas</button>${cats
            .filter((k) => pubs.some((d) => d.categoria === k))
            .map((k) => `<button class="chip ${sel === k ? 'on' : ''}" data-c="${k}">${DICA_CAT[k]}</button>`)
            .join('')}</div>`
        : ''
    }
    <div class="stack" style="margin-top:12px">${vis.map(item).join('') || `<div class="empty"><div class="h3">${S.staff ? 'Nenhuma dica publicada ainda' : 'Em breve'}</div><p class="small muted">${S.staff ? 'Revise um rascunho e marque como publicada.' : 'A equipe está preparando as primeiras dicas.'}</p></div>`}</div>`;
  const ch = document.getElementById('dica-cat');
  if (ch)
    ch.onclick = (e) => {
      const b = e.target.closest('[data-c]');
      if (b) viewDicas(b.dataset.c);
    };
  if (!S.staff) return;
  document.getElementById('dica-nova').onclick = () => dicaEditar(null, () => viewDicas(sel));
  $app.querySelectorAll('[data-dica]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.preventDefault();
        dicaEditar(
          todas.find((d) => d.id === b.dataset.dica),
          () => viewDicas(sel),
        );
      }),
  );
}
function dicaEditar(d, depois) {
  openSheet(
    `<p class="eyebrow">Dicas da Nexos</p><div class="h2">${d ? 'Editar dica' : 'Nova dica'}</div>
    <form id="f-dica" style="margin-top:14px">
      <label class="field"><span>Assunto</span><select class="input" name="categoria">${Object.entries(DICA_CAT)
        .map(([k, l]) => `<option value="${k}" ${d && d.categoria === k ? 'selected' : ''}>${l}</option>`)
        .join('')}</select></label>
      <label class="field"><span>Título</span><input class="input" name="titulo" maxlength="90" required value="${esc(d?.titulo || '')}"></label>
      <label class="field"><span>Texto</span><textarea class="input" name="texto" rows="6" maxlength="1500" required>${esc(d?.texto || '')}</textarea></label>
      <label class="field"><span>Fonte (estudo ou diretriz)</span><input class="input" name="fonte" maxlength="400" value="${esc(d?.fonte || '')}" placeholder="Ex.: Walsh NP et al. Br J Sports Med, 2021."></label>
      <label class="check-row" style="display:flex;gap:10px;align-items:center;margin:4px 0 8px"><input type="checkbox" name="publicada" ${d?.publicada ? 'checked' : ''}> <span>Publicada (os alunos veem)</span></label>
      ${d?.avisada_em ? `<p class="tiny dim" style="margin:0 0 14px">Os alunos já foram avisados desta dica em ${fmtCurto(d.avisada_em)}. Salvar de novo não manda outra notificação.</p>` : `<label class="check-row" id="dica-avisar-l" style="display:flex;gap:10px;align-items:center;margin:0 0 14px" ${d?.publicada ? '' : 'hidden'}><input type="checkbox" name="avisar" checked> <span>Avisar os alunos por notificação</span></label>`}
      <button class="btn block" type="submit">Salvar</button>
      ${d ? '<button class="btn block ghost" type="button" id="dica-apagar" style="margin-top:8px">Apagar dica</button>' : ''}
    </form>`,
    (el) => {
      const f = el.querySelector('#f-dica');
      const avL = el.querySelector('#dica-avisar-l');
      if (avL)
        f.publicada.onchange = () => {
          avL.hidden = !f.publicada.checked;
        };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const row = {
          categoria: f.categoria.value,
          titulo: f.titulo.value.trim(),
          texto: f.texto.value.trim(),
          fonte: f.fonte.value.trim() || null,
          publicada: f.publicada.checked,
          atualizado_em: new Date().toISOString(),
        };
        if (row.publicada && !row.fonte) return toast('Coloque a fonte antes de publicar.', true);
        const { data: salva, error } = await (d
          ? sb.from('nx_dicas').update(row).eq('id', d.id).select('id').single()
          : sb
              .from('nx_dicas')
              .insert({ ...row, org_id: S.org.id })
              .select('id')
              .single());
        if (error) return toast('Não foi possível salvar a dica.', true);
        // notificação só na primeira publicação (o servidor também garante isso)
        const avisar = row.publicada && !d?.avisada_em && f.avisar && f.avisar.checked;
        if (avisar) notificar('dica', (salva && salva.id) || d?.id);
        closeSheet();
        toast(
          !row.publicada
            ? 'Dica salva como rascunho.'
            : avisar
              ? 'Dica publicada e alunos avisados.'
              : 'Dica publicada. Os alunos já veem em Mais.',
        );
        depois && depois();
      };
      const ap = el.querySelector('#dica-apagar');
      if (ap)
        ap.onclick = async () => {
          if (ap.dataset.ok !== '1') {
            ap.dataset.ok = '1';
            ap.textContent = 'Toque de novo para apagar';
            return;
          }
          const { error } = await sb.from('nx_dicas').delete().eq('id', d.id);
          if (error) return toast('Não foi possível apagar.', true);
          closeSheet();
          toast('Dica apagada.');
          depois && depois();
        };
    },
  );
}

/* ---------- meta pessoal do aluno (tempo numa distância, ou meta livre) ---------- */
const META_DIST = [
  [5000, '5 km'],
  [10000, '10 km'],
  [21097, 'Meia maratona (21,1 km)'],
  [42195, 'Maratona (42,2 km)'],
];
const nomeDist = (m) => (META_DIST.find((x) => x[0] === m) || [0, `${f1(m / 1000)} km`])[1].replace(/ \(.*\)/, '');
// previsão de hoje para a distância da meta, pelas corridas das últimas 6 semanas (mesma conta das Previsões)
async function previsaoPara(alunoId, membro, dist) {
  const corr = await buscarCorridasPrev(alunoId);
  const pv = previsaoEm(corr, perfilCorrida(membro), Date.now());
  return pv ? tempoPorVdot(pv.vdot, dist) : null;
}
async function metaAtual(alunoId, membro) {
  const meta = await sb
    .from('nx_metas')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('ativa', true)
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => (r.data || [])[0] || null,
      () => null,
    );
  if (!meta) return { meta: null };
  const atual = meta.tipo === 'tempo' ? await previsaoPara(alunoId, membro, meta.distancia_m) : null;
  return { meta, atual };
}
function metaCardHTML({ meta, atual }, { compacto = false, staff = false } = {}) {
  if (!meta) return '';
  const hoje = hojeISO(),
    dias = Math.round((dia(meta.prazo) - dia(hoje)) / 864e5);
  const prazoTxt = meta.concluida_em
    ? `Conquistada em ${fmtCurto(meta.concluida_em)}`
    : dias < 0
      ? `Prazo era ${fmtCurto(meta.prazo)}`
      : dias === 0
        ? 'Prazo: hoje'
        : dias < 21
          ? `Faltam ${dias} dias · até ${fmtCurto(meta.prazo)}`
          : `Faltam ${Math.round(dias / 7)} semanas · até ${fmtCurto(meta.prazo)}`;
  let titulo,
    pct = 0,
    linha = '',
    ok = !!meta.concluida_em;
  if (meta.tipo === 'tempo') {
    titulo = `${nomeDist(meta.distancia_m)} abaixo de ${fmtDurLongo(meta.tempo_alvo_s)}`;
    if (atual) {
      const ini = Math.max(meta.tempo_inicial_s || atual, atual);
      if (atual <= meta.tempo_alvo_s) {
        pct = 100;
        ok = true;
      } else
        pct =
          ini > meta.tempo_alvo_s ? Math.max(3, Math.min(97, ((ini - atual) / (ini - meta.tempo_alvo_s)) * 100)) : 3;
      linha =
        atual <= meta.tempo_alvo_s
          ? `Previsão de hoje: <b>${fmtDurLongo(atual)}</b>. Pela previsão, a meta já está no alcance. Agora é confirmar na prova.`
          : `Previsão de hoje: <b>${fmtDurLongo(atual)}</b> · faltam ${difTxt(atual - meta.tempo_alvo_s)}`;
    } else linha = 'A previsão aparece depois de algumas corridas de pelo menos 2 km com GPS.';
  } else {
    titulo = esc(meta.titulo);
    const tot = Math.max(1, Math.round((dia(meta.prazo) - dia(isoDia(meta.criado_em))) / 864e5)),
      passou = tot - Math.max(0, dias);
    pct = ok ? 100 : Math.max(3, Math.min(100, (passou / tot) * 100));
    linha = ok ? 'Meta conquistada.' : `A barra mostra quanto do prazo já passou.`;
  }
  if (compacto)
    return `<a class="card meta-card mini" href="#/meta" style="color:inherit"><div class="row between" style="gap:8px"><span class="eyebrow">Minha meta</span><span class="tiny dim">${prazoTxt}</span></div><b class="meta-tit">${titulo}</b><div class="meta-bar ${ok ? 'ok' : ''}"><i style="width:${pct}%"></i></div></a>`;
  return `<div class="card meta-card${ok ? ' ok' : ''}"><div class="row between" style="gap:8px;align-items:flex-start"><div class="grow" style="min-width:0"><span class="eyebrow">${staff ? 'Meta do aluno' : 'Minha meta'}</span><div class="h3 meta-tit">${titulo}</div></div><button class="link-btn small" id="meta-ed">Editar</button></div>
    <div class="meta-bar ${ok ? 'ok' : ''}"><i style="width:${pct}%"></i></div>
    <p class="small" style="margin-top:8px">${linha}</p><p class="tiny dim" style="margin-top:4px">${prazoTxt}${meta.tipo === 'tempo' && meta.tempo_inicial_s ? ` · no início: ${fmtDurLongo(meta.tempo_inicial_s)}` : ''}</p>
    ${meta.tipo === 'livre' && !meta.concluida_em ? '<button class="btn sm" id="meta-ok" style="margin-top:10px">Conquistei</button>' : ''}
    ${meta.concluida_em || ok ? '<button class="btn sm ghost" id="meta-nova" style="margin-top:10px">Definir nova meta</button>' : ''}</div>`;
}
function metaBind(box, dados, alunoId, membro, depois) {
  const ed = box.querySelector('#meta-ed');
  if (ed) ed.onclick = () => metaEditar(dados.meta, alunoId, membro, depois);
  const nv = box.querySelector('#meta-nova');
  if (nv) nv.onclick = () => metaEditar(null, alunoId, membro, depois);
  const okB = box.querySelector('#meta-ok');
  if (okB)
    okB.onclick = async () => {
      const { error } = await sb
        .from('nx_metas')
        .update({ concluida_em: new Date().toISOString() })
        .eq('id', dados.meta.id);
      if (error) return toast('Não foi possível salvar.', true);
      toast('Parabéns pela conquista!');
      depois && depois();
    };
}
async function metaBox(box, alunoId, membro, { staff = false } = {}) {
  if (!box) return;
  const dados = await metaAtual(alunoId, membro);
  const rec = () => metaBox(box, alunoId, membro, { staff });
  if (!dados.meta) {
    box.innerHTML = `<button type="button" class="list-item" id="meta-criar" style="width:100%;text-align:left"><span class="ativ-ic">${I.flag}</span><div class="grow"><b>${staff ? 'Definir meta do aluno' : 'Definir minha meta'}</b><div class="small muted">Ex.: 10 km abaixo de 55 min até março</div></div>${I.chev}</button>`;
    box.querySelector('#meta-criar').onclick = () => metaEditar(null, alunoId, membro, rec);
    return;
  }
  box.innerHTML = metaCardHTML(dados, { staff });
  metaBind(box, dados, alunoId, membro, rec);
}
async function viewMeta() {
  loading();
  dockAluno();
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Evolução</p><h1 class="h1">Minha meta</h1>
    <p class="muted" style="margin-top:6px">Um objetivo com data. Nas metas de tempo, a barra acompanha a sua previsão de desempenho, calculada pelas corridas das últimas 6 semanas.</p>
    <div id="meta-box" style="margin-top:14px"></div>`;
  metaBox(document.getElementById('meta-box'), S.user.id, S.me);
}
async function metaEditar(meta, alunoId, membro, depois) {
  const corre = faz('corrida', membro);
  const tipo0 = meta?.tipo || (corre ? 'tempo' : 'livre');
  const d0 = meta?.distancia_m || 10000,
    outra = !META_DIST.some((x) => x[0] === d0);
  const prazo0 = meta?.prazo || somaDias(hojeISO(), 90);
  openSheet(
    `<p class="eyebrow">Meta pessoal</p><div class="h2">${meta ? 'Editar meta' : 'Nova meta'}</div>
    <form id="f-meta" style="margin-top:14px">
      ${corre ? `<div class="seg" id="meta-tipo" style="margin-bottom:12px"><button type="button" data-t="tempo" class="${tipo0 === 'tempo' ? 'on' : ''}">Tempo numa distância</button><button type="button" data-t="livre" class="${tipo0 === 'livre' ? 'on' : ''}">Outra meta</button></div>` : ''}
      <div id="mt-tempo" ${tipo0 === 'tempo' ? '' : 'hidden'}>
        <label class="field"><span>Distância</span><select class="input" name="dist">${META_DIST.map(([v, l]) => `<option value="${v}" ${!outra && v === d0 ? 'selected' : ''}>${l}</option>`).join('')}<option value="outra" ${outra ? 'selected' : ''}>Outra distância</option></select></label>
        <label class="field" id="mt-km" ${outra ? '' : 'hidden'}><span>Distância em km</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" value="${outra ? String(d0 / 1000).replace('.', ',') : ''}" placeholder="Ex.: 15"></label>
        <label class="field"><span>Tempo alvo (abaixo de)</span><input class="input" name="alvo" data-mask="tempo" inputmode="numeric" value="${meta?.tempo_alvo_s ? fmtDurLongo(meta.tempo_alvo_s) : ''}" placeholder="Ex.: 55:00 ou 1:55:00"></label>
        <p class="small muted" id="mt-prev" style="margin:-4px 0 12px"></p>
      </div>
      <div id="mt-livre" ${tipo0 === 'livre' ? '' : 'hidden'}>
        <label class="field"><span>Qual é a meta?</span><input class="input" name="titulo" maxlength="120" value="${esc(meta?.titulo || '')}" placeholder="Ex.: Completar a primeira meia maratona"></label>
      </div>
      <label class="field"><span>Até quando</span><input class="input" name="prazo" type="date" required min="${hojeISO()}" value="${prazo0}"></label>
      <button class="btn block" type="submit">${meta ? 'Salvar' : 'Definir meta'}</button>
      ${meta ? '<button class="btn block ghost" type="button" id="meta-apagar" style="margin-top:8px">Apagar meta</button>' : ''}
    </form>`,
    (el) => {
      const f = el.querySelector('#f-meta');
      let tipo = tipo0;
      const distAtual = () =>
        f.dist.value === 'outra'
          ? Math.round(parseFloat(String(f.km.value).replace(',', '.')) * 1000) || 0
          : +f.dist.value;
      let prevT = null;
      const dicaAlvo = () => {
        const p = el.querySelector('#mt-prev'),
          dd = distAtual();
        if (!prevT || !dd) {
          p.textContent = '';
          return;
        }
        const v = f.alvo.value.trim(),
          t = /^\d{1,3}:[0-5]\d(:[0-5]\d)?$/.test(v) ? lerTempo(v) : null;
        p.textContent =
          `Previsão de hoje para ${nomeDist(dd)}: ${fmtDurLongo(prevT)}.` +
          (t && t >= prevT ? ' Pela previsão, esse tempo já está no alcance. Dá para mirar um pouco mais rápido.' : '');
      };
      const mostraPrev = async () => {
        const dd = distAtual();
        prevT = dd ? await previsaoPara(alunoId, membro, dd) : null;
        dicaAlvo();
      };
      f.alvo.addEventListener('input', dicaAlvo);
      const tp = el.querySelector('#meta-tipo');
      if (tp)
        tp.onclick = (e) => {
          const b = e.target.closest('[data-t]');
          if (!b) return;
          tipo = b.dataset.t;
          tp.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          el.querySelector('#mt-tempo').hidden = tipo !== 'tempo';
          el.querySelector('#mt-livre').hidden = tipo !== 'livre';
        };
      f.dist.onchange = () => {
        el.querySelector('#mt-km').hidden = f.dist.value !== 'outra';
        mostraPrev();
      };
      f.km.onchange = mostraPrev;
      if (tipo0 === 'tempo') mostraPrev();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const row = { tipo, prazo: f.prazo.value, titulo: null, distancia_m: null, tempo_alvo_s: null };
        if (tipo === 'tempo') {
          const dd = distAtual(),
            v = f.alvo.value.trim(),
            t = /(^|:)[0-5]\d:[0-5]\d$|^\d{1,3}:[0-5]\d$/.test(v) ? lerTempo(v) : null;
          if (!dd || dd < 400 || dd > 100000) return toast('Escolha uma distância válida.', true);
          if (!t || t / (dd / 1000) < 150 || t / (dd / 1000) > 1200)
            return toast('Tempo inválido. Use o formato 55:00 ou 1:55:00.', true);
          Object.assign(row, { distancia_m: dd, tempo_alvo_s: Math.round(t) });
          if (!meta || meta.distancia_m !== dd || !meta.tempo_inicial_s) {
            const p = await previsaoPara(alunoId, membro, dd);
            row.tempo_inicial_s = p ? Math.round(p) : null;
          }
        } else {
          row.titulo = f.titulo.value.trim();
          if (!row.titulo) return toast('Escreva a meta.', true);
        }
        let error;
        if (meta) ({ error } = await sb.from('nx_metas').update(row).eq('id', meta.id));
        else {
          await sb
            .from('nx_metas')
            .update({ ativa: false })
            .eq('aluno_id', alunoId)
            .eq('ativa', true)
            .then(
              () => {},
              () => {},
            );
          ({ error } = await sb.from('nx_metas').insert({ ...row, org_id: S.org.id, aluno_id: alunoId, ativa: true }));
        }
        if (error) return toast('Não foi possível salvar a meta.', true);
        closeSheet();
        toast(meta ? 'Meta atualizada.' : 'Meta definida. Agora é treinar!');
        depois && depois();
      };
      const ap = el.querySelector('#meta-apagar');
      if (ap)
        ap.onclick = async () => {
          if (ap.dataset.ok !== '1') {
            ap.dataset.ok = '1';
            ap.textContent = 'Toque de novo para apagar';
            return;
          }
          const { error } = await sb.from('nx_metas').delete().eq('id', meta.id);
          if (error) return toast('Não foi possível apagar.', true);
          closeSheet();
          toast('Meta apagada.');
          depois && depois();
        };
    },
  );
}

/* ---------- resgate de aluno sumido: mensagem pronta para o WhatsApp ---------- */
const RESGATE_DIAS = 10;
function textoResgate(m, dias) {
  const n = firstName(m.nome) || '';
  return dias >= 21
    ? `Oi, ${n}! Tudo bem com você? Faz um tempinho que você não registra treino e senti sua falta. Se a rotina apertou ou aconteceu alguma coisa, me conta. A gente monta um plano mais leve para você voltar no seu ritmo, sem pressa.`
    : `Oi, ${n}! Tudo bem? Vi que faz ${dias} dias que você não registra treino. Está tudo certo? Se a semana apertou, me fala que eu ajusto o plano para caber na sua rotina.`;
}
function abrirResgate(m, dias, depois) {
  const tel = telWa(m.telefone);
  openSheet(
    `<p class="eyebrow">Aluno sem treinar há ${dias} dias</p><div class="h2">Mensagem para ${esc(firstName(m.nome))}</div>
    <p class="small muted" style="margin-top:6px">Confira e ajuste o texto antes de mandar.</p>
    <textarea class="input" id="rs-txt" rows="6" style="margin-top:12px">${esc(textoResgate(m, dias))}</textarea>
    ${tel ? `<button class="btn block" id="rs-wa" style="margin-top:12px">${I.wa} Abrir no WhatsApp</button>` : '<p class="small" style="margin-top:12px;color:var(--warn)">Este aluno não tem telefone cadastrado. Copie o texto e mande pela conversa do app.</p>'}
    <button class="btn block ghost" id="rs-cp" style="margin-top:8px">Copiar texto</button>
    <button class="link-btn small" id="rs-ja" style="display:block;margin:10px auto 0">Já mandei por outro meio</button>
    <p class="tiny dim" style="margin-top:10px;text-align:center">Depois de enviada, o aviso some por 7 dias.</p>`,
    (el) => {
      const txt = () => el.querySelector('#rs-txt').value.trim();
      const registrar = () =>
        sb
          .from('nx_resgates')
          .insert({ org_id: S.org.id, aluno_id: m.user_id, enviado_em: new Date().toISOString() })
          .then(
            () => {},
            () => {},
          );
      const wa = el.querySelector('#rs-wa');
      if (wa)
        wa.onclick = async () => {
          window.open(`https://wa.me/${tel}?text=${encodeURIComponent(txt())}`, '_blank', 'noopener');
          await registrar();
          closeSheet();
          toast('Registrado. O aviso some por 7 dias.');
          depois && depois();
        };
      el.querySelector('#rs-ja').onclick = async () => {
        await registrar();
        closeSheet();
        toast('Registrado. O aviso some por 7 dias.');
        depois && depois();
      };
      el.querySelector('#rs-cp').onclick = async () => {
        try {
          await navigator.clipboard.writeText(txt());
          toast('Texto copiado.');
        } catch {
          toast('Não consegui copiar. Selecione o texto e copie.', true);
        }
      };
    },
  );
}

/* ---------- lembrete de água: o aluno escolhe de quanto em quanto tempo (ou desliga) ---------- */
const AGUA_INT = [30, 40, 60, 90, 120, 180];
const AGUA_INT_TXT = (m) =>
  m < 60
    ? `a cada ${m} min`
    : m === 60
      ? 'a cada 1 hora'
      : m % 60
        ? `a cada ${Math.floor(m / 60)}h${m % 60}`
        : `a cada ${m / 60} horas`;
function lembretesAguaSheet(depois) {
  const atual = S.me.lembrete_agua === false ? 0 : S.me.agua_intervalo_min || 60;
  openSheet(
    `<p class="eyebrow">Hidratação</p><div class="h2">Lembretes de água</div>
    <p class="small muted" style="margin-top:6px">Os avisos vão das 8h40 às 19h40 e mostram quanto falta para a sua meta. Quando você bate a meta do dia, eles param.</p>
    <div class="agua-int" id="agua-int">${AGUA_INT.map((m) => `<button type="button" data-min="${m}" class="${atual === m ? 'on' : ''}">${m < 60 ? `${m} min` : m === 60 ? '1 hora' : m % 60 ? `${Math.floor(m / 60)}h${m % 60}` : `${m / 60} horas`}</button>`).join('')}<button type="button" data-min="0" class="off ${atual === 0 ? 'on' : ''}">Não quero receber</button></div>`,
    (el) => {
      el.querySelector('#agua-int').onclick = async (e) => {
        const b = e.target.closest('[data-min]');
        if (!b) return;
        const m = +b.dataset.min;
        const { error } = m
          ? await sb.rpc('nx_agua_intervalo', { p_min: m })
          : await sb.rpc('nx_lembrete_agua', { p_on: false });
        if (error) return toast('Não foi possível salvar.', true);
        S.me.lembrete_agua = !!m;
        if (m) S.me.agua_intervalo_min = m;
        closeSheet();
        toast(m ? `Lembretes ${AGUA_INT_TXT(m)}.` : 'Lembretes de água desligados.');
        depois && depois();
      };
    },
  );
}

/* ---------- central de notificações (sininho) ---------- */
const sinoHTML = () =>
  `<a class="sino" href="#/notificacoes" aria-label="Notificações">${I.bell}<i id="sino-n" hidden></i></a>`;
function atualizarSino() {
  sb.from('nx_notificacoes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', S.user.id)
    .is('lida_em', null)
    .then(
      (r) => {
        const n = r.count || 0,
          el = document.getElementById('sino-n');
        if (!el) return;
        el.hidden = !n;
        el.textContent = n > 9 ? '9+' : String(n);
      },
      () => {},
    );
}
async function viewNotificacoes() {
  loading();
  S.staff ? dockStaff() : dockAluno();
  const lista = await sb
    .from('nx_notificacoes')
    .select('*')
    .eq('user_id', S.user.id)
    .order('criado_em', { ascending: false })
    .limit(80)
    .then(
      (r) => r.data || [],
      () => [],
    );
  const hoje = hojeISO(),
    ontem = somaDias(hoje, -1);
  const grupo = (x) => {
    const k = isoDia(x.criado_em);
    return k === hoje
      ? 'Hoje'
      : k === ontem
        ? 'Ontem'
        : dia(k).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };
  const hora = (x) => new Date(x.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let ult = '';
  const itens = lista
    .map((x) => {
      const g = grupo(x);
      const cab = g !== ult ? `<p class="sec-lbl">${g}</p>` : '';
      ult = g;
      return `${cab}<a class="list-item notif ${x.lida_em ? '' : 'nova'}" href="${esc(x.url && x.url.startsWith('#/') ? x.url : '#/')}" style="color:inherit"><span class="ativ-ic">${I.bell}</span><div class="grow" style="min-width:0"><b>${esc(x.titulo)}</b>${x.corpo ? `<div class="small muted">${esc(x.corpo)}</div>` : ''}<div class="tiny dim" style="margin-top:3px">${hora(x)}</div></div></a>`;
    })
    .join('');
  $app.innerHTML = `<a class="back" href="${S.staff ? '#/' : '#/'}">${I.back} Voltar</a><p class="eyebrow">Avisos</p><h1 class="h1">Notificações</h1>
    <p class="muted" style="margin-top:6px">Tudo o que a Nexos te avisou nos últimos 90 dias${S.staff ? '' : '. Os lembretes de água não entram aqui, para não encher a lista'}.</p>
    <div class="stack notif-lista" style="margin-top:8px">${itens || `<div class="empty"><div class="h3">Nada por aqui ainda</div><p class="small muted">Quando chegar um aviso da Nexos, ele aparece aqui.</p></div>`}</div>`;
  if (lista.some((x) => !x.lida_em))
    sb.from('nx_notificacoes')
      .update({ lida_em: new Date().toISOString() })
      .eq('user_id', S.user.id)
      .is('lida_em', null)
      .then(
        () => {},
        () => {},
      );
}
