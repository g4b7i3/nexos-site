/* Nexos App · Corridas: lista, registro, detalhe, card para compartilhar e análise completa.
   Parte 14 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= CORRIDA: planilha, registros, paces e evolução ================= */
const TIPOS_CORRIDA = [
  ['rodagem', 'Rodagem', 'leve'],
  ['regenerativo', 'Regenerativo', 'leve'],
  ['longao', 'Longão', 'leve'],
  ['ritmo', 'Ritmo / limiar', 'limiar'],
  ['intervalado', 'Intervalado', 'intervalado'],
  ['tiros', 'Tiros', 'tiros'],
  ['fartlek', 'Fartlek', 'limiar'],
  ['prova', 'Prova', 'maratona'],
  ['teste', 'Teste', 'intervalado'],
  ['folga', 'Day off', 'leve'],
];
const ZONAS_PACE = [
  ['leve', 'Z2 · Leve (conversando)'],
  ['maratona', 'Z3 · Moderado (ritmo de maratona)'],
  ['limiar', 'Z4 · Limiar (forte e contínuo)'],
  ['intervalado', 'Z5 · Forte (VO₂máx)'],
  ['tiros', 'Z6 · Máximo (velocidade)'],
];
const TIPOS_ATIV = [
  ['corrida', 'Corrida de rua'],
  ['trail', 'Trail'],
  ['esteira', 'Esteira'],
  ['caminhada', 'Caminhada'],
];
// tudo que chega do relógio: corrida e também força, pedal, natação e outras atividades
const NOMES_ATIV = {
  corrida: 'Corrida',
  trail: 'Trail',
  esteira: 'Esteira',
  caminhada: 'Caminhada',
  forca: 'Treino de força',
  bike: 'Pedal',
  natacao: 'Natação',
  outro: 'Atividade',
};
const ehCorr = (c) => !c || !c.tipo || ['corrida', 'trail', 'esteira', 'caminhada'].includes(c.tipo);
const nomeAtiv = (c) => NOMES_ATIV[c && c.tipo] || 'Corrida';
const ARTIGO_ATIV = {
  caminhada: 'a caminhada',
  forca: 'o treino de força',
  bike: 'o pedal',
  natacao: 'a natação',
  outro: 'a atividade',
};
const comArtigo = (c) => ARTIGO_ATIV[c && c.tipo] || 'a corrida';
const comDist = (c) => !!c && c.distancia_m >= 50 && c.tipo !== 'forca' && c.tipo !== 'outro';
/** resumo curto de qualquer atividade: corrida com km e pace, força e outras com o tempo */
const resumoAtiv = (c) =>
  comDist(c)
    ? `${fmtKm(c.distancia_m, 1)} · ${ehCorr(c) ? fmtPace(paceDe(c)) : fmtDur(c.duracao_s)}`
    : fmtDur(c.duracao_s);
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
const fmtKm = (m, d = 2) =>
  m == null ? '–' : (m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: d }) + ' km';
const fmtDur = (s) => {
  if (s == null) return '–';
  s = Math.round(s);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    x = s % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
};
const fmtDurLongo = (s) => {
  s = Math.round(s);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
};
const fmtPace = (sPorKm) => {
  if (!sPorKm || !isFinite(sPorKm)) return '–';
  const s = Math.round(sPorKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`;
};
const paceDe = (c) => (c && c.distancia_m > 0 ? c.duracao_s / (c.distancia_m / 1000) : null);
const lerTempo = (t) => {
  const p = String(t || '')
    .trim()
    .split(':')
    .map((x) => +x.replace(',', '.'));
  if (p.some((x) => !isFinite(x))) return null;
  if (p.length > 1 && p.slice(1).some((x) => x >= 60)) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  if (p.length === 1 && p[0]) return p[0] * 60;
  return null;
};

/** VDOT de Jack Daniels a partir de uma prova/teste */
function vdotDe(distM, seg) {
  if (!distM || !seg) return null;
  const t = seg / 60,
    v = distM / t;
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  return vo2 / pct;
}
function paceNaFracao(vdot, f) {
  const a = 0.000104,
    b = 0.182258,
    c = -(4.6 + f * vdot);
  const v = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); // m/min
  return 60000 / v; // s/km
}
function pacesDe(vdot) {
  if (!vdot) return null;
  return {
    leve: [paceNaFracao(vdot, 0.74), paceNaFracao(vdot, 0.65)],
    maratona: [paceNaFracao(vdot, 0.84), paceNaFracao(vdot, 0.8)],
    limiar: [paceNaFracao(vdot, 0.89), paceNaFracao(vdot, 0.86)],
    intervalado: [paceNaFracao(vdot, 1.0), paceNaFracao(vdot, 0.97)],
    tiros: [paceNaFracao(vdot, 1.1), paceNaFracao(vdot, 1.05)],
  };
}
const faixaPace = (p) => (p ? `${fmtPace(p[0]).replace('/km', '')}–${fmtPace(p[1])}` : '–');
const prever = (distM, seg, alvoM) => seg * Math.pow(alvoM / distM, 1.06);
/* fim da planilha de corrida de cada aluno (última data planejada) */
async function fimPlanilhas() {
  const { data } = await sb
    .from('nx_plano_corrida')
    .select('aluno_id,data')
    .eq('org_id', S.org.id)
    .gte('data', isoDia(Date.now() - 120 * 864e5))
    .then((r) => r)
    .catch(() => ({ data: [] }));
  const fim = {};
  (data || []).forEach((p) => {
    if (!fim[p.aluno_id] || p.data > fim[p.aluno_id]) fim[p.aluno_id] = p.data;
  });
  return fim;
}
const statusPlanilha = (fimData) => {
  if (!fimData) return { t: 'Sem planilha de corrida', cls: 'err', d: -999 };
  const d = diasAte(fimData);
  return {
    t:
      d < 0
        ? `Planilha acabou em ${fmtCurto(fimData + 'T12:00:00')}`
        : `Planilha até ${fmtCurto(fimData + 'T12:00:00')}`,
    cls: d < 0 ? 'err' : d <= 6 ? 'warn' : 'ok',
    d,
  };
};
const ehAniversario = (nasc, dias = 0) => {
  if (!nasc) return false;
  const h = new Date(Date.now() + dias * 864e5);
  return nasc.slice(5, 10) === isoDia(h).slice(5, 10);
};

/* Previsões de desempenho (5K, 10K, meia e maratona), no estilo do Strava e calculadas pela Nexos.
   1) Para cada corrida dos 42 dias anteriores à data: VO2 pela velocidade (Jack Daniels) e o quanto do VO2máx ela
      exigiu, pela frequência cardíaca média (relação de Swain: %FCmáx = 0,64 × %VO2máx + 37) ou, sem FC, pelo esforço (0–10).
      Só entram treinos fortes (80% da FCmáx ou mais, ou esforço 7+): em treino leve a FC varia muito de um dia para o outro
      e com o calor, e um erro pequeno nela vira uma previsão bem acima do real.
   2) Junta com o VDOT direto das corridas e do teste do perfil (desempenho real é piso). Com teste recente, ele é a
      referência: a FC só mostra a evolução desde ele, até 1% por semana passada e no máximo 5%.
      FC máxima: a medida no perfil; sem ela, a maior entre a de Tanaka (208 − 0,7 × idade) e o maior pico já gravado
      pelo relógio (ninguém passa da própria máxima, então o pico corrige a fórmula quando ela erra para baixo).
      Com FC de repouso no perfil, usa a reserva de FC (Swain e Leutholtz, 1997; ACSM: %FCreserva ≈ %VO2reserva),
      que é mais precisa que o percentual da FC máxima.
   3) Converte o VDOT no tempo de cada prova (inverso da fórmula de Daniels) e ajusta meia e maratona pela
      corrida mais longa e pelo volume semanal recentes (sem base de longão, a previsão fica mais conservadora).
   4) Maratona: quando o aluno tem 8 semanas de treino registradas e está na faixa em que o estudo foi validado
      (40–111 km/semana, ritmo médio de 4:13 a 5:31 /km), usa a equação de Tanda (2011), feita com maratonistas reais:
      ritmo (s/km) = 17,1 + 140 × e^(−0,0053 × km/semana) + 0,55 × ritmo médio dos treinos. */
const PROVAS_PREV = [
  [5000, '5K', '5 km'],
  [10000, '10K', '10 km'],
  [21097, '21,1', 'Meia maratona'],
  [42195, '42,2', 'Maratona'],
];
function tempoPorVdot(vdot, d) {
  let lo = (d / 1000) * 90,
    hi = (d / 1000) * 1200;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (vdotDe(d, m) > vdot) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}
function previsaoEm(corridas, perfil, ate) {
  const t1 = typeof ate === 'number' ? ate : Date.parse(ate),
    t0 = t1 - 42 * 864e5;
  const diretos = [],
    ests = [];
  let longa = 0,
    km42 = 0,
    n = 0,
    pico = 0,
    km56 = 0,
    seg56 = 0,
    primeira = Infinity;
  corridas.forEach((c) => {
    const tc = Date.parse(c.data);
    if (tc <= t1 && ehCorr(c) && c.tipo !== 'caminhada') {
      if (c.fc_max > pico && c.fc_max <= 230) pico = c.fc_max;
      primeira = Math.min(primeira, tc);
      if (tc > t1 - 56 * 864e5 && c.distancia_m > 0 && c.duracao_s > 0) {
        km56 += c.distancia_m / 1000;
        seg56 += c.duracao_s;
      }
    }
  });
  const fcMax = perfil.fc_max || (perfil.fcMax ? Math.max(perfil.fcMax, pico) : null);
  const fcRep = perfil.fcRep && fcMax && perfil.fcRep < fcMax - 40 ? perfil.fcRep : null;
  corridas.forEach((c) => {
    const t = Date.parse(c.data);
    if (!(t <= t1 && t > t0 - 14 * 864e5) || !ehCorr(c) || c.tipo === 'caminhada' || !c.distancia_m || !c.duracao_s)
      return;
    if (t > t1 - 56 * 864e5) longa = Math.max(longa, c.distancia_m / 1000);
    if (t <= t0) return;
    km42 += c.distancia_m / 1000;
    if (c.distancia_m < 2000 || c.duracao_s < 480) return;
    const v = c.distancia_m / (c.duracao_s / 60);
    if (v < 100 || v > 450) return; // m/min (entre 10:00 e 2:13 /km)
    n++;
    diretos.push(vdotDe(c.distancia_m, c.duracao_s));
    let pct = null;
    const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v; // custo de O2 nessa velocidade (Daniels)
    let est = null;
    if (c.fc_media && fcMax && c.fc_media >= 0.8 * fcMax && c.fc_media <= 1.02 * fcMax) {
      if (fcRep) {
        const r = Math.min(1, (c.fc_media - fcRep) / (fcMax - fcRep)); // %FC de reserva = %VO2 de reserva
        est = 3.5 + (vo2 - 3.5) / r;
      } else est = vo2 / Math.min(1, (c.fc_media / fcMax - 0.37) / 0.64); // Swain: %FCmáx = 0,64 × %VO2máx + 37
    } else if (!c.fc_media && c.rpe != null && c.rpe >= 7) est = vo2 / Math.min(1, 0.55 + c.rpe * 0.045);
    if (est) ests.push({ v: est, p: Math.min(2, c.duracao_s / 1800) });
  });
  let teste = 0,
    semTeste = 0;
  if (perfil.vdot && perfil.teste_data) {
    const tt = Date.parse(perfil.teste_data + 'T12:00:00');
    if (tt <= t1 && tt > t1 - 90 * 864e5) {
      diretos.push(perfil.vdot);
      teste = perfil.vdot;
      semTeste = (t1 - tt) / (7 * 864e5);
    }
  }
  if (!diretos.length && !ests.length) return null;
  const dir = diretos.length ? Math.max(...diretos) : 0;
  let fis = 0;
  if (ests.length) {
    // média ponderada da metade de cima (os treinos que melhor mostram o condicionamento)
    ests.sort((a, b) => b.v - a.v);
    const top = ests.slice(0, Math.ceil(ests.length / 2));
    fis = top.reduce((a, x) => a + x.v * x.p, 0) / top.reduce((a, x) => a + x.p, 0);
  }
  // treino comum não é feito no máximo, por isso sem teste a FC pode puxar até 20% acima. Com teste, a FC só mostra
  // a evolução desde ele: até 1% por semana passada, no máximo 5%
  const tetoTeste = teste * (1 + Math.min(0.05, semTeste * 0.01));
  let vdot = dir ? Math.max(dir, Math.min(fis, teste ? Math.max(tetoTeste, dir) : dir * 1.2)) : fis;
  vdot = Math.max(20, Math.min(80, vdot));
  const semana = km42 / 6;
  const k8 = km56 / 8,
    p8 = km56 ? seg56 / km56 : 0;
  const tanda =
    primeira <= t1 - 56 * 864e5 && k8 >= 40 && k8 <= 111 && p8 >= 253 && p8 <= 331
      ? (17.1 + 140 * Math.exp(-0.0053 * k8) + 0.55 * p8) * 42.195
      : null;
  const tempos = PROVAS_PREV.map(([d]) => {
    if (d > 40000 && tanda) return tanda;
    let s = tempoPorVdot(vdot, d);
    if (d > 20000 && d < 22000 && longa < 16) s *= 1 + ((16 - longa) / 16) * 0.05;
    if (d > 40000)
      s *= 1 + (longa < 30 ? ((30 - longa) / 30) * 0.1 : 0) + (semana < 40 ? ((40 - semana) / 40) * 0.05 : 0);
    return s;
  });
  return { vdot, tempos, n };
}
const difTxt = (s) => {
  s = Math.round(Math.abs(s));
  return s < 60
    ? `${s}s`
    : s < 3600
      ? `${Math.floor(s / 60)}min${s % 60 ? ' ' + (s % 60) + 's' : ''}`
      : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
};
/** os quatro selos (5K, 10K, meia e maratona) com o tempo, o pace e quanto mudou. Sem SVG: também vai para o PDF. */
function previsoesGrade(atual, antes, rotAntes) {
  if (!atual)
    return '<p class="small muted">Ainda não há corridas suficientes para calcular. Registre corridas de 2 km ou mais (com frequência cardíaca ou esforço) e as previsões aparecem aqui.</p>';
  return `<div class="pv-grade">${PROVAS_PREV.map(([d, selo, nome], i) => {
    const s = atual.tempos[i],
      dif = antes ? s - antes.tempos[i] : null;
    const pill =
      dif == null
        ? ''
        : Math.abs(dif) < 1
          ? '<span class="pv-dif igual">= igual</span>'
          : `<span class="pv-dif ${dif < 0 ? 'melhor' : 'pior'}" title="${dif < 0 ? 'Mais rápido' : 'Mais lento'} que ${esc(rotAntes)}"><i></i>${difTxt(dif)}</span>`;
    return `<div class="pv-it"><span class="pv-selo"><b>${selo}</b>${d > 20000 ? '<small>KM</small>' : ''}</span><strong>${fmtDurLongo(s)}</strong><span class="pv-pace">${fmtPace(s / (d / 1000))}</span>${pill}<span class="pv-nome">${nome}</span></div>`;
  }).join('')}</div>`;
}
const PV_PER = [
  ['hoje', 'Hoje', 0],
  ['1m', '1 M', 30],
  ['3m', '3 M', 90],
  ['6m', '6 M', 180],
];
/** cartão completo para a tela: abas Hoje/1M/3M/6M e a curva dos 10 km nos últimos 6 meses */
function previsoesCard(box, corridas, perfil, { titulo = true } = {}) {
  let per = 'hoje';
  const agora = Date.now();
  const desenhar = () => {
    const off = PV_PER.find((p) => p[0] === per)[2];
    const t = agora - off * 864e5,
      at = previsaoEm(corridas, perfil, t),
      an = previsaoEm(corridas, perfil, t - 30 * 864e5);
    const hist = [];
    for (let w = 25; w >= 0; w--) {
      const p = previsaoEm(corridas, perfil, agora - w * 7 * 864e5);
      if (p)
        hist.push({ x: fmtCurto(new Date(agora - w * 7 * 864e5).toISOString()), y: +(p.tempos[1] / 60).toFixed(2) });
    }
    box.innerHTML = `<div class="card pv-card">
      ${titulo ? `<div class="row between" style="gap:8px"><b class="h3">Previsões de desempenho</b>${slashes}</div>` : ''}
      <p class="small muted" style="margin-top:4px">${off ? `Como estavam há ${off === 30 ? '1 mês' : off === 90 ? '3 meses' : '6 meses'}, comparadas com os 30 dias anteriores.` : 'Suas previsões atuais em comparação com as de 30 dias atrás.'}</p>
      ${previsoesGrade(at, an, '30 dias antes')}
      <div class="seg pv-per">${PV_PER.map(([k, l]) => `<button type="button" data-pv="${k}" class="${k === per ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${hist.length > 2 ? `<div style="margin-top:14px"><span class="small muted" style="font-weight:700">Previsão dos 10 km nos últimos 6 meses · menor é melhor</span>${grafico(hist, { fmt: (v) => fmtDurLongo(v * 60) })}</div>` : ''}
      <p class="pv-cred">Baseado nas equações de Jack Daniels e em estudos de fisiologia do exercício.</p>
      <details class="ajuda" style="margin-top:6px"><summary>Como a Nexos calcula?</summary><p>Usamos as suas corridas das últimas 6 semanas: o ritmo de cada uma e quanto ela exigiu de você (pela frequência cardíaca do relógio ou pelo esforço que você marcou). Só os treinos fortes entram nessa conta, e o seu último teste é a referência principal. Isso estima o seu condicionamento (VDOT) e vira o tempo de cada prova. Meia e maratona também dependem do seu longão e do seu volume semanal; com 8 semanas de treino registradas, a maratona usa a equação de Tanda, feita com maratonistas reais. É uma estimativa para prova em percurso plano, com o treino específico; quanto mais corridas com relógio, mais precisa.</p></details>
    </div>`;
    box.querySelector('.pv-per').onclick = (e) => {
      const b = e.target.closest('[data-pv]');
      if (b) {
        per = b.dataset.pv;
        desenhar();
      }
    };
  };
  desenhar();
}
async function buscarCorridasPrev(alunoId, ate = Date.now()) {
  const { data } = await sb
    .from('nx_corridas')
    .select('data,tipo,distancia_m,duracao_s,fc_media,fc_max,rpe')
    .eq('aluno_id', alunoId)
    .gte('data', new Date(ate - 260 * 864e5).toISOString())
    .lte('data', new Date(ate).toISOString())
    .order('data')
    .limit(1000)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  return data || [];
}

/* Fitness (carga crônica, 42 dias), Fadiga (aguda, 7 dias) e Forma (diferença) — modelo de Banister/Coggan com rTSS */
function cargaCorrida(corridas, perfil) {
  const lim =
    perfil && perfil.paces && perfil.paces.limiar ? (perfil.paces.limiar[0] + perfil.paces.limiar[1]) / 2 : null;
  const dia0 = new Date();
  dia0.setHours(12, 0, 0, 0);
  const N = 120;
  const L = Array(N + 1).fill(0);
  corridas.forEach((c) => {
    if (!c.duracao_s || !c.distancia_m) return;
    const k = Math.round((dia0 - dia(isoDia(c.data))) / 864e5);
    if (k < 0 || k > N) return;
    const pace = c.duracao_s / (c.distancia_m / 1000);
    const IF = lim ? Math.min(1.25, Math.max(0.5, lim / pace)) : c.rpe != null ? 0.5 + c.rpe * 0.05 : 0.75;
    L[N - k] += (c.duracao_s / 3600) * IF * IF * 100;
  });
  let ctl = 0,
    atl = 0;
  L.forEach((l) => {
    ctl += (l - ctl) / 42;
    atl += (l - atl) / 7;
  });
  return {
    fitness: Math.round(ctl),
    fadiga: Math.round(atl),
    forma: Math.round(ctl - atl),
    temDados: L.some((x) => x > 0),
  };
}
function cargaHTML3(cg) {
  if (!cg.temDados) return '';
  const f = cg.forma;
  const est =
    f > 5
      ? ['Descansado', 'ok']
      : f >= -10
        ? ['Equilibrado', 'ok']
        : f >= -30
          ? ['Treinando forte', 'warn']
          : ['Atenção: carga alta', 'err'];
  return `<div class="card carga3"><div class="c3">${[
    ['Fitness', cg.fitness, 'c-fit', 'Condicionamento acumulado (42 dias)'],
    ['Fadiga', cg.fadiga, 'c-fad', 'Cansaço recente (7 dias)'],
    ['Forma', cg.forma, 'c-for', 'Fitness − Fadiga'],
  ]
    .map(([n, v, c, d]) => `<div class="c3-i" title="${d}"><b class="${c}">${v}</b><span>${n}</span></div>`)
    .join('')}</div>
    <p class="small" style="margin-top:10px;text-align:center"><span class="tag ${est[1]}">${est[0]}</span></p>
    <details class="ajuda" style="margin-top:6px"><summary>O que são esses números?</summary><p><b>Fitness</b> é a média da carga das corridas nas últimas 6 semanas: sobe devagar conforme o aluno treina. <b>Fadiga</b> é a carga dos últimos 7 dias. <b>Forma</b> = Fitness − Fadiga: positiva quer dizer descansado (bom para prova); muito negativa (abaixo de −30) indica carga alta e risco de excesso. A carga de cada corrida é calculada pelo tempo e pela intensidade em relação ao pace de limiar do aluno.</p></details></div>`;
}

const DSEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const dsemIdx = (iso) => (dia(iso).getDay() + 6) % 7;
const diasTxt = (d) =>
  d && d.length
    ? d
        .slice()
        .sort()
        .map((i) => DSEM[i].slice(0, 3))
        .join(', ')
    : '';

function perfilCorrida(m) {
  const c = (m && m.corrida) || {};
  const vdot = vdotDe((c.teste_km || 0) * 1000, c.teste_seg);
  const idade = m && m.nascimento ? idadeEm(m.nascimento) : null;
  const fcMax = c.fc_max || (idade ? 208 - 0.7 * idade : null);
  // zonas automáticas (VDOT) + ajustes manuais do treinador, que têm prioridade
  let paces = pacesDe(vdot);
  const man = c.paces_manual && Object.keys(c.paces_manual).length ? c.paces_manual : null;
  let za = c.zonas_auto && c.zonas_auto.paces ? c.zonas_auto : null; // zonas do último teste de campo (30 min, VAM ou VC)
  if (za && c.teste_data && za.data && za.data < c.teste_data) za = null; // teste de prova mais novo vale mais
  if (za) paces = { ...(paces || {}), ...za.paces };
  if (man) paces = { ...(paces || {}), ...man };
  // modo adaptação: sem teste, o aluno segue a percepção de esforço (sem pace e sem FC estimada); o teste desliga sozinho
  if (c.modo_pse && !vdot && !za && !man)
    return {
      ...c,
      vdot: null,
      paces: null,
      manual: false,
      auto: null,
      fcMax: null,
      fcRep: null,
      lthr: null,
      pse: true,
    };
  return { ...c, vdot, paces, manual: !!man, auto: za, fcMax, fcRep: c.fc_rep || null, lthr: c.lthr || null };
}
function inicioSemana(d = new Date()) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const isoDia = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

/** cor de cada ponto do percurso pelo pace naquele trecho (zonas do aluno, ou do mais lento ao mais rápido da corrida) */
function coresRotaPace(c, perfil) {
  const S = c.analise && c.analise.serie,
    R = c.rota;
  if (!S || !S.vel || !R || R.length < 3 || S.vel.length < 10) return null;
  const nS = S.vel.length,
    pace = R.map((_, i) => {
      const k = Math.round((i * (nS - 1)) / (R.length - 1));
      const vs = S.vel.slice(Math.max(0, k - 2), k + 3).filter((v) => v > 0.8);
      return vs.length ? 1000 / (vs.reduce((a, b) => a + b, 0) / vs.length) : null;
    });
  if (perfil && perfil.paces) {
    const cores = pace.map((p) => (p ? ZONAS_INFO[zonaDoPace(p, perfil) || 'rec'].c : '#9aa8c0'));
    const usadas = [...new Set(pace.filter(Boolean).map((p) => zonaDoPace(p, perfil) || 'rec'))];
    return {
      cores,
      leg: ['rec', 'leve', 'maratona', 'limiar', 'intervalado', 'tiros']
        .filter((k) => usadas.includes(k))
        .map((k) => `<span><i style="background:${ZONAS_INFO[k].c}"></i>${ZONAS_INFO[k].z} ${ZONAS_INFO[k].d}</span>`)
        .join(''),
    };
  }
  const ok = pace.filter(Boolean).sort((a, b) => a - b);
  if (ok.length < 5) return null;
  const q = [0.2, 0.4, 0.6, 0.8].map((f) => ok[Math.floor(ok.length * f)]),
    PAL = ['#ff6b6b', '#ff9f43', '#ffcf5c', '#46d6ff', '#3ddc97'];
  const cores = pace.map((p) => (p ? PAL[q.filter((x) => p > x).length] : '#9aa8c0'));
  return {
    cores,
    leg: `<span><i style="background:#3ddc97"></i>mais lento</span><span class="rota-grad"></span><span><i style="background:#ff6b6b"></i>mais rápido</span>`,
  };
}
function rotaSVG(rota, h = 200, cores = null) {
  if (!rota || rota.length < 2) return '';
  const lats = rota.map((p) => p[0]),
    lons = rota.map((p) => p[1]);
  const la0 = Math.min(...lats),
    la1 = Math.max(...lats),
    lo0 = Math.min(...lons),
    lo1 = Math.max(...lons);
  const k = Math.cos((((la0 + la1) / 2) * Math.PI) / 180);
  const w = Math.max((lo1 - lo0) * k, 1e-6),
    hh = Math.max(la1 - la0, 1e-6);
  const W = 320,
    s = Math.min((W - 24) / w, (h - 24) / hh);
  const ox = (W - w * s) / 2,
    oy = (h - hh * s) / 2;
  const pts = rota.map(([la, lo]) => `${(ox + (lo - lo0) * k * s).toFixed(1)},${(h - oy - (la - la0) * s).toFixed(1)}`);
  const [x0, y0] = pts[0].split(','),
    [x1, y1] = pts[pts.length - 1].split(',');
  return `<svg class="rota" viewBox="0 0 ${W} ${h}" role="img" aria-label="Percurso">${
    cores
      ? pts
          .slice(1)
          .map(
            (pt, i2) =>
              `<line x1="${pts[i2].split(',')[0]}" y1="${pts[i2].split(',')[1]}" x2="${pt.split(',')[0]}" y2="${pt.split(',')[1]}" stroke="${cores[i2 + 1] || cores[i2] || '#2f6bff'}" stroke-width="4" stroke-linecap="round"/>`,
          )
          .join('')
      : `<polyline points="${pts.join(' ')}" fill="none" style="stroke:var(--acc)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`
  }<circle cx="${x0}" cy="${y0}" r="6" style="fill:var(--ok)"/><circle cx="${x1}" cy="${y1}" r="6" style="fill:var(--ink)"/></svg>`;
}

async function buscarCorridas(alunoId, limit = 300) {
  const { data, error } = await sb
    .from('nx_corridas')
    .select('id,data,titulo,tipo,distancia_m,duracao_s,fc_media,rpe,dor,fonte,plano_id,visto_treinador')
    .eq('org_id', S.org.id)
    .eq('aluno_id', alunoId)
    .order('data', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
async function buscarPlano(alunoId, de, ate) {
  let q = sb
    .from('nx_plano_corrida')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('aluno_id', alunoId)
    .gte('data', de)
    .lte('data', ate)
    .order('data');
  if (!S.staff) q = q.eq('liberado', true); // o aluno só vê semanas liberadas pelo treinador
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/* ---------- registrar corrida ---------- */
let fitCarregando = null;
function carregarLeitor() {
  if (window.NxFit) return Promise.resolve();
  if (!fitCarregando)
    fitCarregando = new Promise((ok, err) => {
      const s = document.createElement('script');
      s.src = 'nxfit.js';
      s.onload = ok;
      s.onerror = () => {
        fitCarregando = null;
        err(new Error('Não foi possível carregar o leitor de arquivos.'));
      };
      document.head.appendChild(s);
    });
  return fitCarregando;
}
async function registrarCorrida(alunoId, onSalvo) {
  const plano = await buscarPlano(alunoId, isoDia(Date.now() - 4 * 864e5), isoDia(Date.now() + 2 * 864e5)).catch(
    () => [],
  );
  openSheet(
    `<p class="eyebrow">Registrar corrida</p><div class="h2" style="margin-top:4px">Como você quer registrar?</div>
    <label class="opcao" style="margin-top:16px"><input type="file" id="arq" accept=".fit,.gpx,.tcx,application/gpx+xml,application/octet-stream" hidden><span class="go">${I.up}</span><div><b>Enviar o arquivo do relógio</b><p class="small muted">.FIT, .GPX ou .TCX. O app lê distância, tempo, FC, parciais e o percurso.</p></div></label>
    <button type="button" class="opcao" id="manual"><span class="go">${I.plus}</span><div><b>Digitar os dados</b><p class="small muted">Distância, tempo e FC que o relógio ou o app mostrou.</p></div></button>
    <details class="ajuda"><summary>Como baixar o arquivo da corrida?</summary>
      <p><b>Garmin Connect (site):</b> abra a atividade → ícone de engrenagem → Exportar original (.FIT) ou Exportar para GPX.</p>
      <p><b>Coros:</b> app Coros → atividade → ⋯ → Exportar dados → .FIT.</p>
      <p><b>Polar Flow:</b> site → atividade → Exportar sessão → .GPX ou .TCX.</p>
      <p><b>Strava (site):</b> atividade → ⋯ → Exportar GPX (ou Exportar original).</p>
      <p><b>Apple Watch:</b> use o app HealthFit (iPhone) → toque na corrida → compartilhar → arquivo .FIT.</p></details>`,
    (r) => {
      r.querySelector('#manual').onclick = () =>
        formCorrida(alunoId, { data: new Date().toISOString(), fonte: 'manual' }, plano, onSalvo);
      r.querySelector('#arq').onchange = async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const lab = e.target.closest('.opcao');
        lab.querySelector('b').textContent = 'Lendo o arquivo…';
        try {
          await carregarLeitor();
          const d = await window.NxFit.ler(f);
          if (!d.distancia_m || !d.duracao_s) throw new Error('Não encontrei distância e tempo nesse arquivo.');
          formCorrida(
            alunoId,
            {
              ...d,
              fonte: 'arquivo',
              ext_id: 'arq-' + new Date(d.data).getTime() + '-' + d.distancia_m,
              titulo: f.name.replace(/\.(fit|gpx|tcx)$/i, ''),
            },
            plano,
            onSalvo,
          );
        } catch (err) {
          console.error(err);
          lab.querySelector('b').textContent = 'Enviar o arquivo do relógio';
          toast(
            err.message && /[ãçéí]/.test(err.message)
              ? err.message
              : 'Não consegui ler esse arquivo. Tente o .GPX ou digite os dados.',
            true,
          );
        }
      };
    },
  );
}
function formCorrida(alunoId, d, plano, onSalvo) {
  const dt = new Date(d.data);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  const diaD = isoDia(d.data);
  const prox = [...plano].sort((a, b) => Math.abs(dia(a.data) - dia(diaD)) - Math.abs(dia(b.data) - dia(diaD)));
  const sugerido = prox.find((p) => p.data === diaD);
  let rpe = d.rpe ?? null,
    dor = !!d.dor;
  const corpo = { cansaco: d.cansaco ?? null, sono: d.sono ?? null };
  const lido = d.fonte === 'arquivo' || d.fonte === 'celular';
  openSheet(
    `<p class="eyebrow">${d.fonte === 'arquivo' ? 'Arquivo lido ✓' : d.fonte === 'celular' ? 'Treino gravado ✓' : 'Nova corrida'}</p><div class="h2" style="margin-top:4px">Confira e salve</div>
    ${lido ? `<div class="mini-stats"><div><b>${fmtKm(d.distancia_m)}</b><span>distância</span></div><div><b>${fmtDur(d.duracao_s)}</b><span>tempo</span></div><div><b>${fmtPace(paceDe(d))}</b><span>pace</span></div></div>${d.rota ? `<div class="rota-box">${rotaSVG(d.rota, 150)}</div>` : ''}` : ''}
    <form id="f-corr" style="margin-top:16px">
      <div class="grid2"><label class="field"><span>Data e hora</span><input class="input" type="datetime-local" name="data" value="${dt.toISOString().slice(0, 16)}" required></label><label class="field"><span>Tipo</span><select class="input" name="tipo">${TIPOS_ATIV.map(([k, l]) => `<option value="${k}" ${d.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="field"><span>Distância (km)</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" value="${d.distancia_m ? String(+(d.distancia_m / 1000).toFixed(2)).replace('.', ',') : ''}" placeholder="Ex.: 8,2" required></label><label class="field"><span>Tempo (h:mm:ss)</span><input class="input" name="tempo" data-mask="tempo" inputmode="numeric" value="${d.duracao_s ? fmtDurLongo(d.duracao_s) : ''}" placeholder="Ex.: 45:30" required></label></div>
      <p class="small muted" id="pace-calc" style="margin:-6px 0 12px"></p>
      <div class="grid2"><label class="field"><span>FC média (bpm)</span><input class="input" name="fc_media" data-mask="num" inputmode="numeric" value="${esc(d.fc_media ?? '')}"></label><label class="field"><span>FC máxima (bpm)</span><input class="input" name="fc_max" data-mask="num" inputmode="numeric" value="${esc(d.fc_max ?? '')}"></label></div>
      ${
        plano.length
          ? `<label class="field"><span>É de qual treino da planilha?</span><select class="input" name="plano"><option value="">Corrida avulsa</option>${prox
              .slice(0, 8)
              .map(
                (p) =>
                  `<option value="${p.id}" ${(d.plano_id || sugerido?.id) === p.id ? 'selected' : ''}>${fmtData(p.data + 'T12:00:00')} · ${esc(p.titulo || nomeTipo(p.tipo))}${p.distancia_km ? ' · ' + String(p.distancia_km).replace('.', ',') + ' km' : ''}</option>`,
              )
              .join('')}</select></label>`
          : ''
      }
      <div class="field"><span>Esforço percebido</span>${esforcoHTML(rpe)}</div>
      <div class="field"><span>Sentiu alguma dor?</span><div class="seg"><button type="button" class="${dor ? '' : 'on'}" data-dor="0">Não</button><button type="button" class="${dor ? 'on alert' : ''}" data-dor="1">Sim</button></div>
        <input class="input" id="dor-local" placeholder="Onde? Ex.: panturrilha esquerda" style="margin-top:12px" value="${esc(d.dor_local || '')}" ${dor ? '' : 'hidden'}></div>
      ${corpoHTML(corpo)}
      <label class="field"><span>Como foi? (opcional)</span><textarea class="textarea" name="comentario" placeholder="Ex.: calor forte, segurei o pace no fim">${esc(d.comentario || '')}</textarea></label>
      <button class="btn block" type="submit">Salvar corrida ${I.check}</button>
    </form>`,
    (r) => {
      const f = r.querySelector('#f-corr');
      const atual = () => {
        const km = num(f.km.value),
          s = lerTempo(f.tempo.value);
        r.querySelector('#pace-calc').textContent = km && s ? `Pace médio: ${fmtPace(s / km)}` : '';
      };
      f.oninput = atual;
      atual();
      bindEsforco(r, (n) => {
        rpe = n;
      });
      r.querySelectorAll('[data-dor]').forEach(
        (b) =>
          (b.onclick = () => {
            dor = b.dataset.dor === '1';
            r.querySelectorAll('[data-dor]').forEach((x) => {
              x.classList.toggle('on', x === b);
              x.classList.toggle('alert', x === b && dor);
            });
            r.querySelector('#dor-local').hidden = !dor;
          }),
      );
      bindCorpo(r, corpo);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const km = num(f.km.value),
          seg = lerTempo(f.tempo.value);
        if (!km || km <= 0) return toast('Informe a distância em km.', true);
        if (!seg) return toast('Informe o tempo, por exemplo 45:30.', true);
        const btn = f.querySelector('[type=submit]');
        btn.disabled = true;
        // a distância aparece arredondada (2 casas): se a pessoa não mexeu nela, os dados do GPS/arquivo (etapas, parciais, gráficos) vão junto
        const reaproveitaArquivo =
          lido && (f.km.value === f.km.defaultValue || Math.abs(km * 1000 - d.distancia_m) <= 10);
        const row = {
          org_id: S.org.id,
          aluno_id: alunoId,
          data: new Date(f.data.value).toISOString(),
          tipo: f.tipo.value,
          titulo: d.titulo || null,
          distancia_m: reaproveitaArquivo ? Math.round(d.distancia_m) : Math.round(km * 1000),
          duracao_s: seg,
          fc_media: num(f.fc_media.value),
          fc_max: num(f.fc_max.value),
          elevacao_m: d.elevacao_m ?? null,
          cadencia: d.cadencia ?? null,
          rpe,
          dor,
          dor_local: dor ? r.querySelector('#dor-local').value.trim() || null : null,
          cansaco: corpo.cansaco ?? null,
          sono: corpo.sono ?? null,
          comentario: f.comentario.value.trim() || null,
          plano_id: f.plano ? f.plano.value || null : null,
          parciais: reaproveitaArquivo ? d.parciais : null,
          rota: d.rota || null,
          fonte: d.fonte || 'manual',
          ext_id: d.ext_id || null,
          analise: reaproveitaArquivo ? d.analise || null : null,
        };
        const { data: novo, error } = await sb.from('nx_corridas').insert(row).select('id').single();
        if (error) {
          btn.disabled = false;
          return toast(
            /duplicate|unique/i.test(error.message || '')
              ? 'Essa corrida já foi registrada.'
              : 'Não foi possível salvar. Verifique a internet.',
            true,
          );
        }
        if (alunoId === S.user.id) notificar('corrida', novo.id);
        closeSheet();
        toast('Corrida registrada!');
        onSalvo ? onSalvo(novo.id) : (location.hash = '#/corrida/' + novo.id);
      };
    },
  );
}

/* ---------- detalhe de uma corrida ---------- */
/* ---------- card da corrida para compartilhar (minimalista, com a marca da Nexos) ---------- */
const CARD_STATS = [
  ['dist', 'Distância'],
  ['pace', 'Pace'],
  ['tempo', 'Tempo'],
  ['fc', 'FC média'],
  ['elev', 'Subida'],
  ['cad', 'Cadência'],
  ['kcal', 'Calorias'],
  ['passos', 'Passos'],
  ['rota', 'Percurso'],
  ['data', 'Data'],
  ['logo', 'Logo Nexos'],
];
// modelos do card (inspirados nos stickers de corrida, com a cara da Nexos)
const CARD_LAYOUTS = [
  ['recorde', 'Novo recorde'],
  ['mesmo', 'Mesmo percurso'],
  ['gigante', 'Número gigante'],
  ['pace_km', 'Pace km a km'],
  ['altimetria', 'Altimetria'],
  ['zonas_fc', 'Zonas de FC'],
  ['zonas_pot', 'Zonas de potência'],
  ['efeito', 'Efeito do treino'],
  ['vo2', 'VO2máx'],
  ['semana', 'Minha semana'],
  ['constancia', 'Constância'],
  ['icones', 'Com ícones'],
  ['clima', 'Clima'],
  ['clima_faixa', 'Clima + números'],
  ['tiros', 'Tiros'],
  ['nome', 'Nome do treino'],
  ['classico', 'Coluna'],
  ['faixa', 'Faixa'],
  ['percurso', 'Percurso'],
  ['lado', 'Lado a lado'],
  ['mapa', 'Só o mapa'],
  ['sobre', 'Mapa + números'],
  ['tabela', 'Ficha'],
  ['ficha_mapa', 'Ficha + mapa'],
  ['lateral', 'Diagonal'],
  ['pilulas', 'Número de peito'],
  ['parciais', 'Parciais'],
  ['parciais_total', 'Parciais + total'],
  ['recibo', 'Medalha'],
  ['destaque', 'Destaque'],
  ['linha', 'Na foto'],
];
const cardCarregarImg = (src) =>
  new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
const CARD_IMGS = {};
const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
// SVG sem largura e altura vira uma imagem pequena (300 × 150) em alguns celulares e sai borrada e acinzentada no card:
// aqui ele ganha um tamanho grande antes de ir para o card, para o traço ficar branco e nítido
const cardSvgGrande = async (src) => {
  try {
    const t = await (await fetch(src)).text();
    const vb = (t.match(/viewBox="([^"]+)"/) || [])[1];
    if (!vb) return null;
    const [, , w, h] = vb.split(/[\s,]+/).map(Number);
    const L = 4000;
    const svg = t.replace(/<svg\b/, `<svg width="${L}" height="${Math.round((L * h) / w)}"`);
    return await cardCarregarImg(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
  } catch {
    return null;
  }
};
const cardImg = async (src) =>
  CARD_IMGS[src] ||
  (CARD_IMGS[src] = (/\.svg$/.test(src) && (await cardSvgGrande(src))) || (await cardCarregarImg(src)));
/* card:puro:inicio — contas dos cards do relógio (testadas em scripts/testes/cards.test.js) */
// efeito do treino na escala da Garmin (0 a 5)
const TE_NOMES = ['Sem benefício', 'Benefício menor', 'Mantendo', 'Impactando', 'Muito impactante', 'Sobrecarga'];
const teNome = (v) => (v == null || !(v >= 0) ? null : TE_NOMES[Math.min(5, Math.floor(v + 1e-9))]);
// VO2máx: classificação do Cooper Institute, a mesma que o relógio Garmin mostra
// limites mínimos de Razoável, Bom, Excelente e Superior por faixa de idade (20-29 … 70-79)
const VO2_LIM = {
  M: [
    [41.7, 45.4, 51.1, 55.4],
    [40.5, 44, 48.3, 54],
    [38.5, 42.4, 46.4, 52.5],
    [35.6, 39.2, 43.4, 48.9],
    [32.3, 35.5, 39.5, 45.7],
    [29.4, 32.3, 36.7, 42.1],
  ],
  F: [
    [36.1, 39.5, 43.9, 49.6],
    [34.4, 37.8, 42.4, 47.4],
    [33, 36.3, 39.7, 45.3],
    [30.1, 33, 36.7, 41.1],
    [27.5, 30, 33, 37.8],
    [25.9, 28.1, 30.9, 36.7],
  ],
};
const VO2_NOMES = ['Ruim', 'Razoável', 'Bom', 'Excelente', 'Superior'];
/** classe do VO2máx (0 Ruim … 4 Superior) com os limites da faixa; sem sexo ou idade não classifica */
function vo2Classe(v, idade, sexo) {
  const s = sexo === 'F' || sexo === 'feminino' ? 'F' : sexo === 'M' || sexo === 'masculino' ? 'M' : null;
  if (!(v > 0) || !s || !(idade > 0)) return null;
  const faixa = Math.max(0, Math.min(5, Math.floor(idade / 10) - 2)),
    lim = VO2_LIM[s][faixa];
  const i = lim.filter((x) => v >= x).length;
  return {
    i,
    nome: VO2_NOMES[i],
    lim,
    faixa: `${20 + faixa * 10} a ${29 + faixa * 10} anos`,
  };
}
/** segundos em cada zona a partir das frações e do tempo total (soma bate com o total) */
function segZonas(fr, total) {
  if (!fr || !total) return null;
  const s = fr.map((x) => Math.round(x * total));
  const dif = Math.round(total) - s.reduce((a, b) => a + b, 0);
  if (dif) s[s.indexOf(Math.max(...s))] += dif;
  return s;
}
/* card:puro:fim */
// zonas de FC do card: as do relógio quando ele manda o tempo em cada zona, senão as mesmas da análise (perfil do aluno)
function cardZonasFC(c) {
  const E = (c.analise && c.analise.extras) || {},
    R = E.zonas_rel && E.zonas_rel.fc;
  if (R && R.t && R.t.length >= 3 && R.t.some((x) => x > 0)) return { seg: R.t, lim: R.lim || null, rel: true };
  const p = c._x && c._x.perfil;
  if (!p || !c.duracao_s) return null;
  const zs = p.lthr ? zonasFCLimiar(p.lthr, p.fc_max) : p.fc_max ? zonasFC(p.fc_max, p.fcRep) : null;
  const fr = tempoZonasFC(c.analise && c.analise.serie, zs);
  return fr ? { seg: segZonas(fr, c.duracao_s), lim: zs.map((z) => z.de), rel: false } : null;
}
// zonas de potência: só quando o relógio manda (o app não calcula zonas de potência)
function cardZonasPot(c) {
  const E = (c.analise && c.analise.extras) || {},
    R = E.zonas_rel && E.zonas_rel.pot;
  return R && R.t && R.t.length >= 3 && R.t.some((x) => x > 0) ? { seg: R.t, lim: R.lim || null } : null;
}
const cardTE = (c) => {
  const E = (c.analise && c.analise.extras) || {};
  return E.te_aer != null && E.te_aer > 0 ? { aer: E.te_aer, ana: E.te_ana != null ? E.te_ana : null } : null;
};
function cardValores(c) {
  const pace = paceDe(c);
  const E = { ...(c.resumo_rel || {}), ...((c.analise && c.analise.extras) || {}) };
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
  const t = `${(plano && plano.titulo) || ''} ${c.titulo || ''}`.toLowerCase(),
    tp = plano && plano.tipo;
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
  const vs = ((c.analise && c.analise.voltas) || [])
    .filter((v) => v && v.d >= 100 && v.seg > 0)
    .map((v, i) => ({ ...v, i, p: v.seg / (v.d / 1000) }));
  if (vs.length < 3 || sr.leve) return [];
  const ord = vs.map((v) => v.p).sort((a, b) => a - b);
  let corte = null,
    maior = 1;
  for (let i = 1; i < ord.length; i++) {
    const r = ord[i] / ord[i - 1];
    if (r > maior) {
      maior = r;
      corte = (ord[i] + ord[i - 1]) / 2;
    }
  }
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
    const p0 = c.fonte !== 'garmin' && c.rota && c.rota[0];
    if (!p0) throw 0;
    const dt = new Date(c.data),
      dia = isoDia(dt),
      antigo = Date.now() - dt.getTime() > 80 * 864e5;
    const base = antigo ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
    const url = `${base}?latitude=${p0[0]}&longitude=${p0[1]}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&start_date=${dia}&end_date=${dia}&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) throw 0;
    const j = await r.json();
    const meio = new Date(dt.getTime() + (c.duracao_s || 0) * 500);
    const hh = meio.getHours();
    const k = Math.max(
      0,
      Math.min(
        23,
        (j.hourly.time || []).findIndex((t) => +t.slice(11, 13) === hh),
      ),
    );
    const h = j.hourly;
    if (h.temperature_2m[k] != null)
      res = {
        temp: Math.round(h.temperature_2m[k]),
        sens: Math.round(h.apparent_temperature[k]),
        umid: Math.round(h.relative_humidity_2m[k]),
        vento: Math.round(h.wind_speed_10m[k]),
        cod: h.weather_code[k],
        dia: h.is_day[k] !== 0,
        fonte: 'clima',
      };
  } catch {}
  CLIMA_CACHE[c.id] = res;
  return res;
}
const climaTxt = (cod) =>
  cod == null
    ? ''
    : cod === 0
      ? 'Céu limpo'
      : cod <= 2
        ? 'Poucas nuvens'
        : cod === 3
          ? 'Nublado'
          : cod <= 48
            ? 'Neblina'
            : cod <= 57
              ? 'Garoa'
              : cod <= 67
                ? 'Chuva'
                : cod <= 77
                  ? 'Neve'
                  : cod <= 82
                    ? 'Pancadas de chuva'
                    : 'Trovoada';
function cardRota(ctx, rota, x, y, w, h, cor, lw, brilho = false) {
  if (!rota || rota.length < 2) return false;
  const lats = rota.map((p) => p[0]),
    lons = rota.map((p) => p[1]);
  const la0 = Math.min(...lats),
    la1 = Math.max(...lats),
    lo0 = Math.min(...lons),
    lo1 = Math.max(...lons);
  const k = Math.cos((((la0 + la1) / 2) * Math.PI) / 180);
  const rw = Math.max((lo1 - lo0) * k, 1e-6),
    rh = Math.max(la1 - la0, 1e-6);
  const s = Math.min(w / rw, h / rh),
    ox = x + (w - rw * s) / 2,
    oy = y + (h - rh * s) / 2;
  const caminho = () => {
    ctx.beginPath();
    rota.forEach((p, i) => {
      const px = ox + (p[1] - lo0) * k * s,
        py = oy + rh * s - (p[0] - la0) * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (brilho) {
    ctx.shadowColor = cor;
    ctx.shadowBlur = lw * 3;
  }
  ctx.strokeStyle = cor;
  ctx.lineWidth = lw;
  caminho();
  ctx.stroke();
  // ponto de largada
  const p0 = rota[0],
    sx = ox + (p0[1] - lo0) * k * s,
    sy = oy + rh * s - (p0[0] - la0) * s;
  ctx.shadowBlur = 0;
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(sx, sy, lw * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return true;
}
const ret = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
async function desenharCard(cv, c, o) {
  const W = 1080,
    H = o.formato === 'post' ? 1350 : 1920;
  const esc = o.escala || 1;
  cv.width = W * esc;
  cv.height = H * esc;
  const ctx = cv.getContext('2d');
  ctx.setTransform(esc, 0, 0, esc, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, W, H);
  const branco = o.cor === 'branco',
    post = o.formato === 'post';
  const tx = branco ? '#ffffff' : '#0b1834',
    sub = branco ? 'rgba(255,255,255,.74)' : 'rgba(11,24,52,.6)';
  const AC = branco ? '#46d6ff' : '#0b62d6'; // ciano da marca (no texto preto, o azul Nexos)
  if (o.fundo === 'foto' && o.img) {
    const im = o.img,
      sc = Math.max(W / im.width, H / im.height);
    ctx.drawImage(im, (W - im.width * sc) / 2, (H - im.height * sc) / 2, im.width * sc, im.height * sc);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,.2)');
    g.addColorStop(0.5, 'rgba(0,0,0,.04)');
    g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (o.fundo === 'nexos') {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, '#0d2a5e');
    g.addColorStop(1, '#040a18');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W * 0.9, H * 0.08, 0, W * 0.9, H * 0.08, W * 0.9);
    r.addColorStop(0, 'rgba(70,214,255,.22)');
    r.addColorStop(1, 'rgba(70,214,255,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  }
  const sombra = branco && o.fundo !== 'nexos';
  // tamanho e posição escolhidos com os dedos (o fundo não mexe)
  const zz = o.zoom || 1;
  ctx.save();
  ctx.translate(W / 2 + (o.dx || 0), H / 2 + (o.dy || 0));
  ctx.scale(zz, zz);
  ctx.translate(-W / 2, -H / 2);
  const FB = "'Manrope', system-ui, sans-serif",
    FH = "'Unbounded', 'Manrope', system-ui, sans-serif",
    FM = "'JetBrains Mono', ui-monospace, monospace";
  const txt = (t, x, y, font, cor, al = 'center', esp = 0) => {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = cor;
    ctx.textAlign = al;
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = esp + 'px';
    if (sombra) {
      ctx.shadowColor = 'rgba(0,0,0,.3)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 2;
    }
    ctx.fillText(t, x, y);
    ctx.restore();
  };
  const larg = (t, font, esp = 0) => {
    ctx.save();
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = esp + 'px';
    const w = ctx.measureText(t).width;
    ctx.restore();
    return w;
  };
  const V = cardValores(c);
  const sel = ['dist', 'pace', 'tempo', 'fc', 'elev', 'cad', 'kcal', 'passos']
    .filter((k) => o.stats[k] && V[k])
    .map((k) => V[k]);
  const VAL = (px) => `700 ${Math.round(px * 0.84)}px ${FH}`,
    LBL = (px) => `700 ${px}px ${FB}`;
  // rótulo pequeno + número grande (unidade menor ao lado)
  const stat = (s, x, y, px, al = 'center', caixa = false) => {
    const fu = `700 ${Math.round(px * 0.42)}px ${FB}`,
      ev = -px * 0.035;
    const wv = larg(s.v, VAL(px), ev),
      wu = s.u ? larg(s.u, fu) + px * 0.12 : 0,
      tot = wv + wu;
    const x0 = al === 'center' ? x - tot / 2 : al === 'right' ? x - tot : x;
    txt(
      caixa ? s.l.toUpperCase() : s.l,
      al === 'center' ? x : al === 'right' ? x : x0,
      y,
      LBL(Math.max(24, Math.round(px * 0.34))),
      sub,
      al,
      caixa ? px * 0.05 : 0,
    );
    txt(s.v, x0, y + px * 1.04, VAL(px), tx, 'left', ev);
    if (s.u) txt(s.u, x0 + wv + px * 0.12, y + px * 1.04, fu, sub, 'left');
    return wv + wu;
  };
  const grade = (lista, y, px, x0 = 80, x1 = W - 80, porLinha = 3, al = 'left') => {
    let yy = y;
    for (let i = 0; i < lista.length; i += porLinha) {
      const parte = lista.slice(i, i + porLinha),
        cw = (x1 - x0) / porLinha;
      parte.forEach((s, j) => stat(s, al === 'center' ? x0 + cw * j + cw / 2 : x0 + cw * j, yy, px, al));
      yy += px * 1.9;
    }
    return yy;
  };
  const comLogo = o.stats.logo;
  const wm = comLogo ? await cardImg(branco ? 'icons/wordmark.svg' : 'icons/wordmark-escuro.svg') : null;
  const sim = comLogo ? await cardImg(branco ? 'icons/simbolo.svg' : 'icons/simbolo-escuro.svg') : null;
  const desenha = (im, ar, x, y, w, al = 'left', leve = false) => {
    if (!im) return 0;
    const h = w * ar;
    const xx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    ctx.save();
    if (sombra) {
      ctx.shadowColor = leve ? 'rgba(0,0,0,.22)' : 'rgba(0,0,0,.28)';
      ctx.shadowBlur = leve ? 5 : 12;
      if (leve) ctx.shadowOffsetY = 1;
    }
    ctx.drawImage(im, xx, y, w, h);
    ctx.restore();
    return h;
  };
  const logoTexto = (x, y, w = 240, al = 'center') => desenha(wm, 937.1 / 5645, x, y, w, al);
  const simbolo = (x, y, w = 120, al = 'center') => desenha(sim, 2333.5 / 5528.6, x, y, w, al);
  // a marca principal nos cards é o símbolo (maior que o nome escrito)
  const logo = (x, y, w = 240, al = 'center') => simbolo(x, y - w * 0.05, w * 0.72, al);
  const dt = new Date(c.data);
  const dataTxt = o.stats.data ? `${fmtDia(c.data)} · ${fmtHora(c.data)}`.toUpperCase() : '';
  const temRota = o.stats.rota && c.rota && c.rota.length > 1;
  const rota = (x, y, w, h, lw = 9, br = false) => temRota && cardRota(ctx, c.rota, x, y, w, h, AC, lw, br);
  const L = o.layout;
  // modelos novos: dados de outras atividades (recorde, mesmo percurso, semana, constância) e tons de apoio
  const CX = c._x || {},
    apag = branco ? 'rgba(255,255,255,.45)' : 'rgba(11,24,52,.4)',
    fino = branco ? 'rgba(255,255,255,.16)' : 'rgba(11,24,52,.12)',
    meio = branco ? 'rgba(255,255,255,.38)' : 'rgba(11,24,52,.3)',
    forte = branco ? 'rgba(255,255,255,.92)' : 'rgba(11,24,52,.85)';
  // tamanho da fonte que cabe na largura
  const cabe = (t, peso, px, max, fam, esp = 0) => {
    let p = Math.round(px);
    while (p > 40 && larg(t, `${peso} ${p}px ${fam}`, esp) > max) p -= 6;
    return p;
  };
  const corta = (t, font, max) => {
    let s = String(t || '');
    while (s.length > 3 && larg(s, font) > max) s = s.slice(0, -2).trimEnd() + '…';
    return s;
  };
  const pilula = (t, cx, y, px) => {
    const f = `800 ${px}px ${FB}`,
      w = larg(t, f) + 90,
      h = px * 2.2;
    ctx.save();
    ret(ctx, cx - w / 2, y, w, h, h / 2);
    ctx.fillStyle = branco ? 'rgba(70,214,255,.16)' : 'rgba(11,98,214,.12)';
    ctx.fill();
    ctx.restore();
    txt(t, cx, y + h * 0.66, f, AC, 'center');
  };
  const assinatura = () => {
    // as três faixas diagonais da Nexos no canto superior direito
    ctx.save();
    const bx = W - 70,
      by = post ? 66 : 96,
      hh = 54;
    [0, 1, 2].forEach((k) => {
      ctx.globalAlpha = 1 - k * 0.32;
      ctx.fillStyle = AC;
      ctx.beginPath();
      const x0 = bx - 150 + k * 46;
      ctx.moveTo(x0, by + hh);
      ctx.lineTo(x0 + 30, by + hh);
      ctx.lineTo(x0 + 58, by);
      ctx.lineTo(x0 + 28, by);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
    // selo da marca na base
    if (L === 'icones' || L === 'mapa')
      txt('NEXOS · PERFORMANCE E SAÚDE', W / 2, H - (post ? 44 : 64), `500 22px ${FM}`, sub, 'center', 6);
  };

  const clima = o.clima;
  const iconeClima = (cx, cy, r) => {
    // sol, lua, nuvem e chuva desenhados
    const cod = clima && clima.cod,
      dia = !clima || clima.dia !== false;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const sol = cod == null || cod <= 2;
    if (sol) {
      if (dia) {
        ctx.fillStyle = '#ffcf5c';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffcf5c';
        ctx.lineWidth = r * 0.09;
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6);
          ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#dfe8ff';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, cy - r * 0.18, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    if (cod == null || cod >= 1) {
      // nuvem
      const nx = sol ? cx + r * 0.25 : cx,
        ny = sol ? cy + r * 0.28 : cy;
      ctx.fillStyle = branco ? '#ffffff' : '#c9d6ea';
      ctx.beginPath();
      ctx.arc(nx - r * 0.3, ny, r * 0.26, 0, Math.PI * 2);
      ctx.arc(nx, ny - r * 0.14, r * 0.34, 0, Math.PI * 2);
      ctx.arc(nx + r * 0.32, ny + r * 0.02, r * 0.24, 0, Math.PI * 2);
      ctx.rect(nx - r * 0.3, ny, r * 0.62, r * 0.26);
      ctx.fill();
      if (cod != null && cod >= 51) {
        ctx.strokeStyle = AC;
        ctx.lineWidth = r * 0.08;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(nx + k * r * 0.25, ny + r * 0.42);
          ctx.lineTo(nx + k * r * 0.25 - r * 0.08, ny + r * 0.66);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };
  if (L === 'clima') {
    // temperatura em destaque, com sensação, umidade e vento
    let y = post ? 120 : 330;
    simbolo(W / 2, y, 220);
    y += 170;
    if (clima) {
      iconeClima(W / 2, y + 120, 130);
      y += 290;
      const tt = `${clima.temp}°`;
      txt(tt, W / 2 + 30, y + 190, `800 ${post ? 220 : 260}px ${FH}`, tx, 'center', -10);
      y += 240;
      if (clima.fonte === 'clima' && climaTxt(clima.cod)) {
        txt(climaTxt(clima.cod).toUpperCase(), W / 2, y, LBL(30), AC, 'center', 6);
        y += 70;
      } else y += 20;
      const det = [
        clima.sens != null ? { l: 'Sensação', v: `${clima.sens}°`, u: '' } : null,
        clima.umid != null ? { l: 'Umidade', v: `${clima.umid}`, u: '%' } : null,
        clima.vento != null ? { l: 'Vento', v: `${clima.vento}`, u: 'km/h' } : null,
      ].filter(Boolean);
      if (det.length) y = grade(det, y + 10, 60, 90, W - 90, 3, 'center');
    } else {
      txt('Buscando o clima…', W / 2, y + 200, LBL(34), sub, 'center');
      y += 400;
    }
    ctx.save();
    ctx.fillStyle = branco ? 'rgba(255,255,255,.25)' : 'rgba(11,24,52,.15)';
    ctx.fillRect(140, y + 10, W - 280, 2);
    ctx.restore();
    grade(sel.slice(0, 3), y + 60, 64, 70, W - 70, 3, 'center');
  } else if (L === 'clima_faixa') {
    // números da corrida com uma etiqueta do clima
    const lista = sel.slice(0, 3);
    let y = (H - 620) / 2;
    simbolo(80, y, 200, 'left');
    y += 150;
    if (clima) {
      const t = `${clima.temp}°C`,
        partes = [
          clima.fonte === 'clima' ? climaTxt(clima.cod) : '',
          clima.umid != null ? `${clima.umid}% umidade` : '',
          clima.vento != null ? `vento ${clima.vento} km/h` : '',
        ].filter(Boolean);
      // o texto sempre cabe dentro do selo: diminui a letra e, se ainda faltar espaço, tira a descrição do céu
      const cabe = W - 160 - 200 - larg(t, `800 46px ${FH}`) - 24;
      let extra = partes.join(' · '),
        fs = 36;
      while (fs > 26 && larg(extra, `600 ${fs}px ${FB}`) > cabe) fs--;
      if (larg(extra, `600 ${fs}px ${FB}`) > cabe && partes.length > 2) {
        extra = partes.slice(1).join(' · ');
        fs = 36;
        while (fs > 26 && larg(extra, `600 ${fs}px ${FB}`) > cabe) fs--;
      }
      const wT = larg(t, `800 46px ${FH}`) + larg(extra, `600 ${fs}px ${FB}`) + 200;
      ctx.save();
      ctx.strokeStyle = tx;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3;
      ret(ctx, 80, y, Math.min(W - 160, wT), 110, 55);
      ctx.stroke();
      ctx.restore();
      iconeClima(140, y + 55, 70);
      txt(t, 200, y + 72, `800 46px ${FH}`, tx, 'left', -1);
      txt(extra, 200 + larg(t, `800 46px ${FH}`) + 26, y + 68, `600 ${fs}px ${FB}`, sub, 'left');
    }
    y += 190;
    grade(lista, y, 76, 80, W - 80, 3, 'left');
  } else if (L === 'tiros') {
    // só as voltas fortes (sem recuperação)
    const tr = tirosDe(c),
      pk = tr.map((v) => v.p),
      mn = Math.min(...pk),
      mx = Math.max(...pk);
    const dists = tr.map((v) => Math.round(v.d / 100) * 100),
      iguais = dists.every((d) => Math.abs(d - dists[0]) <= 100);
    const lh = Math.min(post ? 74 : 92, (H - (post ? 560 : 760)) / Math.max(1, tr.length));
    let y = (H - (190 + tr.length * lh + 260)) / 2;
    const tit = (c._serie && c._serie.titulo) || 'Tiros';
    txt(tit, 100, y + 70, `800 ${tit.length > 9 ? 70 : 84}px ${FH}`, tx, 'left', -2);
    txt(
      iguais
        ? `${tr.length} × ${dists[0] >= 1000 ? (dists[0] / 1000).toString().replace('.', ',') + ' km' : dists[0] + ' m'}`
        : `${tr.length} ${tr.length > 1 ? 'séries' : 'série'}`,
      W - 100,
      y + 66,
      `700 40px ${FB}`,
      AC,
      'right',
    );
    y += 150;
    txt('#', 100, y + 10, LBL(24), sub, 'left', 3);
    txt('PACE', W - 100, y + 10, LBL(24), sub, 'right', 3);
    y += 30;
    tr.forEach((v, i) => {
      const yy = y + i * lh,
        w = mx > mn ? 120 + (200 * (mx - v.p)) / (mx - mn) : 260,
        top = v.p === mn;
      ctx.save();
      ctx.fillStyle = top ? AC : branco ? 'rgba(255,255,255,.14)' : 'rgba(11,24,52,.1)';
      ctx.beginPath();
      ctx.arc(126, yy + lh * 0.5, lh * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      txt(
        String(i + 1),
        126,
        yy + lh * 0.5 + lh * 0.13,
        `800 ${Math.round(lh * 0.34)}px ${FB}`,
        top ? '#04122b' : tx,
        'center',
      );
      ctx.save();
      ctx.fillStyle = top ? AC : branco ? 'rgba(255,255,255,.85)' : 'rgba(11,24,52,.82)';
      ret(ctx, 190, yy + lh * 0.3, w, lh * 0.4, lh * 0.2);
      ctx.fill();
      ctx.restore();
      txt(
        `${iguais ? '' : v.d >= 1000 ? (v.d / 1000).toFixed(1).replace('.', ',') + ' km · ' : Math.round(v.d) + ' m · '}${fmtDur(v.seg)}${v.fc ? ' · ' + v.fc + ' bpm' : ''}`,
        540,
        yy + lh * 0.5 + 12,
        `600 ${Math.round(lh * 0.3)}px ${FB}`,
        sub,
        'left',
      );
      txt(
        fmtPace(v.p).replace('/km', ''),
        W - 100,
        yy + lh * 0.5 + 14,
        `800 ${Math.round(lh * 0.4)}px ${FH}`,
        top ? AC : tx,
        'right',
        -1,
      );
    });
    y += tr.length * lh + 50;
    const med = tr.reduce((a, v) => a + v.seg, 0) / tr.reduce((a, v) => a + v.d / 1000, 0);
    grade(
      [
        {
          l: tit === 'Tiros' ? 'Pace médio dos tiros' : 'Pace médio das séries',
          v: fmtPace(med).replace('/km', ''),
          u: '/km',
        },
        { l: 'Melhor', v: fmtPace(mn).replace('/km', ''), u: '/km' },
      ],
      y,
      64,
      100,
      W - 100,
      2,
      'left',
    );
    simbolo(W / 2, H - (post ? 150 : 230), 170);
  } else if (L === 'nome') {
    // minimalista: só o nome do treino, uma linha de números e a marca
    const nm = (c._serie && c._serie.nome) || 'Corrida',
      esp = 6;
    let px = post ? 150 : 170;
    while (px > 60 && larg(nm, `400 ${px}px ${FH}`, esp) > W - 180) px -= 4;
    const linha = sel
      .slice(0, 3)
      .map((s) => `${s.v}${s.u ? ' ' + s.u : ''}`)
      .join('   ·   ');
    const alt = (dataTxt ? 80 : 0) + px + 60 + (linha ? 70 : 0);
    let y = (H - alt) / 2 - (post ? 30 : 60);
    if (dataTxt) {
      txt(dataTxt, W / 2, y + 26, `600 28px ${FB}`, sub, 'center', 8);
      y += 80;
    }
    txt(nm, W / 2 + esp / 2, y + px * 0.82, `400 ${px}px ${FH}`, tx, 'center', esp);
    y += px + 40;
    ctx.save();
    ctx.fillStyle = AC;
    ctx.fillRect(W / 2 - 40, y, 80, 4);
    ctx.restore();
    y += 30;
    if (linha) txt(linha, W / 2, y + 44, `500 38px ${FB}`, sub, 'center', 2);
    simbolo(W / 2, H - (post ? 170 : 260), 150);
  } else if (L === 'icones') {
    // grade 2 colunas com ícone em cima de cada número
    const IC = {
      dist: 'M6 21s-4-4.5-4-7.5A4 4 0 0 1 10 13.5C10 16.5 6 21 6 21zM6 13.5h.01M18 11s-3-3.4-3-5.6a3 3 0 0 1 6 0C21 7.6 18 11 18 11zM18 5.4h.01M9 19.5c3 0 4-1.5 5.5-4s2.5-3 3.5-3',
      tempo: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 1.5M10 2h4M12 2v3M19 6l1.5-1.5',
      pace: 'M3.5 17a9 9 0 1 1 17 0M12 13l4-4M12 13.5a1 1 0 1 0 0-.01M6.5 13H5M19 13h-1.5M12 6.5V5M7.6 8.6 6.6 7.6M16.4 8.6l1-1',
      elev: 'M2 20 9 8l4 6 3-4 6 10zM9 8l2 3',
      fc: 'M12 20s-7-4.4-9-9a4.7 4.7 0 0 1 9-3 4.7 4.7 0 0 1 9 3c-2 4.6-9 9-9 9zM3.5 12h4l2-3 2.5 6 2-3h6.5',
      passos:
        'M7 4c1.7 0 2.5 1.8 2.5 4S8.7 12 7 12s-2.5-1.8-2.5-4S5.3 4 7 4zM5 14.5h4.5v2a2.3 2.3 0 0 1-4.5 0zM17 8c1.7 0 2.5 1.8 2.5 4s-.8 4-2.5 4-2.5-1.8-2.5-4S15.3 8 17 8zM15 18.5h4.5v.5a2.3 2.3 0 0 1-4.5 0z',
      cad: 'M7 4c1.7 0 2.5 1.8 2.5 4S8.7 12 7 12s-2.5-1.8-2.5-4S5.3 4 7 4zM5 14.5h4.5v2a2.3 2.3 0 0 1-4.5 0zM17 8c1.7 0 2.5 1.8 2.5 4s-.8 4-2.5 4-2.5-1.8-2.5-4S15.3 8 17 8zM15 18.5h4.5v.5a2.3 2.3 0 0 1-4.5 0z',
      kcal: 'M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.7 3.5 4.4 3.5 7 0 3.4-2.5 6-6.5 6z',
    };
    // usa o que estiver marcado e completa com os outros números da corrida até 6
    const ordem = ['dist', 'tempo', 'pace', 'elev', 'fc', 'passos', 'cad', 'kcal'];
    const chaves = [...ordem.filter((k) => o.stats[k] && V[k]), ...ordem.filter((k) => !o.stats[k] && V[k])]
      .slice(0, 6)
      .sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    const rows = Math.ceil(chaves.length / 2),
      rh = post ? 300 : 340;
    let y = (H - (rows * rh + 210)) / 2;
    simbolo(W / 2, y, 300);
    y += 210;
    const icone = (k, cx, cy, sz) => {
      if (!IC[k] || !window.Path2D) return;
      ctx.save();
      ctx.translate(cx - sz / 2, cy);
      ctx.scale(sz / 24, sz / 24);
      ctx.strokeStyle = tx;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,.3)';
        ctx.shadowBlur = 6;
      }
      ctx.stroke(new Path2D(IC[k]));
      ctx.restore();
    };
    chaves.forEach((k, i) => {
      const col = i % 2,
        row = Math.floor(i / 2),
        cx = col ? W * 0.72 : W * 0.28,
        cy = y + row * rh;
      icone(k, cx, cy, 84);
      const s2 = V[k];
      txt(s2.l, cx, cy + 140, `600 38px ${FB}`, tx, 'center');
      const px = 86,
        wv = larg(s2.v, VAL(px), -px * 0.035),
        fu = `700 ${Math.round(px * 0.5)}px ${FB}`,
        wu = s2.u ? larg(s2.u, fu) + 12 : 0,
        x0 = cx - (wv + wu) / 2;
      txt(s2.v, x0, cy + 236, VAL(px), tx, 'left', -px * 0.035);
      if (s2.u) txt(s2.u, x0 + wv + 12, cy + 236, fu, tx, 'left');
      if (row < rows - 1) {
        ctx.save();
        ctx.fillStyle = branco ? 'rgba(255,255,255,.22)' : 'rgba(11,24,52,.15)';
        ctx.fillRect(cx - 190, cy + rh - 30, 380, 2);
        ctx.restore();
      }
    });
  } else if (L === 'classico') {
    // coluna centrada: percurso, números e logo
    const px = post ? 84 : 100,
      passo = px * 1.95,
      hR = temRota ? (post ? 250 : 340) : 0;
    const tot = (hR ? hR + 70 : 0) + sel.length * passo + (dataTxt ? 70 : 0) + (wm ? 110 : 0);
    let y = (H - tot) / 2;
    if (temRota) {
      rota(W / 2 - 230, y, 460, hR, 10);
      y += hR + 70;
    }
    if (dataTxt) {
      txt(dataTxt, W / 2, y + 26, LBL(28), sub, 'center', 3);
      y += 70;
    }
    sel.forEach((s) => {
      stat(s, W / 2, y + 30, px, 'center');
      y += passo;
    });
    logo(W / 2, y + 30, 250);
  } else if (L === 'faixa') {
    // símbolo + logo numa linha e os números lado a lado
    const lista = sel.slice(0, 6),
      px = lista.length > 3 ? 64 : 70;
    const alt = 140 + Math.ceil(lista.length / 3) * px * 1.9;
    let y = (H - alt) / 2;
    const hs = simbolo(80, y, 190, 'left');
    logoTexto(80 + (sim ? 220 : 0), y + Math.max(0, (hs - 46) / 2), 270, 'left');
    if (dataTxt) txt(dataTxt, W - 80, y + 40, LBL(24), sub, 'right', 3);
    grade(lista, y + 150, px, 80, W - 80, 3, 'left');
  } else if (L === 'percurso') {
    // percurso grande, logo e números embaixo
    const hr = post ? 620 : 900,
      yr = post ? 150 : 240;
    rota(130, yr, W - 260, hr, 12);
    let y = yr + hr + (post ? 60 : 100);
    simbolo(W / 2, y, 230);
    y += 130;
    if (dataTxt) {
      txt(dataTxt, W / 2, y + 10, LBL(26), sub, 'center', 3);
      y += 60;
    }
    y = grade(sel.slice(0, 3), y, post ? 66 : 72, 70, W - 70, 3, 'center');
  } else if (L === 'lado') {
    // percurso à esquerda, logo e números em coluna à direita
    const yc = H / 2,
      hr = post ? 520 : 600;
    rota(70, yc - hr / 2, 470, hr, 12);
    const px = 66;
    let y = yc - (sel.slice(0, 4).length * px * 1.95 + 120) / 2;
    logo(600, y, 340, 'left');
    y += 120;
    sel.slice(0, 4).forEach((s) => {
      stat(s, 600, y + 28, px, 'left');
      y += px * 1.95;
    });
  } else if (L === 'mapa') {
    // só o percurso e a marca
    const hr = post ? 760 : 1050;
    const y0 = (H - hr - 160) / 2;
    rota(110, y0, W - 220, hr, 14, true);
    logo(W / 2, y0 + hr + 90, 300);
  } else if (L === 'sobre') {
    // números empilhados por cima do percurso
    ctx.save();
    ctx.globalAlpha = 0.9;
    rota(110, post ? 180 : 300, W - 220, post ? 900 : 1250, 16);
    ctx.restore();
    const px = post ? 70 : 80,
      passo = px * 1.85,
      lista = sel.slice(0, 6);
    let y = (H - (lista.length * passo + 110)) / 2;
    logo(W / 2, y, 260);
    y += 110;
    lista.forEach((s) => {
      stat(s, W / 2, y + 26, px, 'center');
      y += passo;
    });
  } else if (L === 'tabela' || L === 'ficha_mapa') {
    // ficha com pontilhado (estilo recibo de prova)
    const lista = sel.slice(0, 7),
      lh = post ? 64 : 72,
      fs = post ? 38 : 42;
    const alt = (wm ? 90 : 0) + lista.length * lh + (dataTxt ? 70 : 0);
    let y = L === 'ficha_mapa' ? H - (post ? 110 : 170) - alt : (H - alt) / 2;
    if (L === 'ficha_mapa') rota(160, post ? 110 : 200, W - 320, y - (post ? 190 : 300), 13);
    const x0 = 150,
      x1 = W - 150;
    if (wm) {
      logo(x0, y, 230, 'left');
      y += 90;
    }
    if (dataTxt) {
      txt(dataTxt, x0, y + 30, LBL(24), sub, 'left', 3);
      y += 70;
    }
    lista.forEach((s) => {
      const vt = s.v + (s.u ? ' ' + s.u : '');
      y += lh;
      txt(s.l, x0, y, `600 ${fs}px ${FB}`, tx, 'left');
      txt(vt, x1, y, `800 ${fs}px ${FB}`, tx, 'right');
      const a = x0 + larg(s.l, `600 ${fs}px ${FB}`) + 22,
        b = x1 - larg(vt, `800 ${fs}px ${FB}`) - 22;
      ctx.save();
      ctx.fillStyle = sub;
      for (let xx = a; xx < b; xx += 15) {
        ctx.beginPath();
        ctx.arc(xx, y - fs * 0.32, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  } else if (L === 'lateral') {
    // faixa diagonal da marca atravessando o card, com os números dentro
    rota(W / 2 - 230, post ? 120 : 210, 460, post ? 330 : 470, 10);
    const yc = H * (post ? 0.58 : 0.56),
      bh = post ? 330 : 380,
      inc = 140;
    ctx.save();
    ctx.translate(0, yc);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, branco ? 'rgba(70,214,255,.22)' : 'rgba(11,98,214,.14)');
    g.addColorStop(1, branco ? 'rgba(47,107,255,.32)' : 'rgba(11,98,214,.24)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-40, -bh / 2 + inc / 2);
    ctx.lineTo(W + 40, -bh / 2 - inc / 2);
    ctx.lineTo(W + 40, bh / 2 - inc / 2);
    ctx.lineTo(-40, bh / 2 + inc / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = AC;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-40, -bh / 2 + inc / 2);
    ctx.lineTo(W + 40, -bh / 2 - inc / 2);
    ctx.stroke();
    ctx.rotate(-Math.atan2(inc, W + 80));
    const lista = sel.slice(0, 3),
      cw = (W - 120) / Math.max(1, lista.length);
    lista.forEach((s, k) => stat(s, 60 + cw * k + cw / 2, -40, post ? 64 : 70, 'center', true));
    ctx.restore();
    if (dataTxt) txt(dataTxt, W / 2, yc + bh / 2 + 90, LBL(26), sub, 'center', 4);
    simbolo(W / 2, H - (post ? 260 : 360), 230);
  } else if (L === 'pilulas') {
    // número de peito: a "inscrição" da corrida
    const bw = 820,
      bh = post ? 760 : 860,
      x = (W - bw) / 2,
      y = (H - bh) / 2 - (post ? 0 : 40);
    ctx.save();
    if (sombra) {
      ctx.shadowColor = 'rgba(0,0,0,.25)';
      ctx.shadowBlur = 30;
    }
    ctx.fillStyle = branco ? 'rgba(255,255,255,.96)' : '#ffffff';
    ret(ctx, x, y, bw, bh, 34);
    ctx.fill();
    ctx.restore();
    const faixa = 180;
    ctx.save();
    ret(ctx, x, y, bw, bh, 34);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + bw, y);
    g.addColorStop(0, '#0d2a5e');
    g.addColorStop(1, '#143a7c');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, faixa);
    ctx.fillStyle = '#46d6ff';
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = 1 - k * 0.3;
      ctx.beginPath();
      const sx = x + bw - 210 + k * 46;
      ctx.moveTo(sx, y + faixa);
      ctx.lineTo(sx + 30, y + faixa);
      ctx.lineTo(sx + 70, y);
      ctx.lineTo(sx + 40, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // furos dos alfinetes
    ctx.save();
    ctx.fillStyle = branco ? 'rgba(0,0,0,.0)' : 'rgba(0,0,0,0)';
    ctx.globalCompositeOperation = 'destination-out';
    [
      [x + 46, y + 46],
      [x + bw - 46, y + 46],
      [x + 46, y + bh - 46],
      [x + bw - 46, y + bh - 46],
    ].forEach(([a, b2]) => {
      ctx.beginPath();
      ctx.arc(a, b2, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    });
    ctx.restore();
    const wmB = await cardImg('icons/wordmark.svg'),
      simE = await cardImg('icons/simbolo-escuro.svg');
    if (wmB) ctx.drawImage(wmB, x + 110, y + faixa / 2 - 26, 312, 312 * (937.1 / 5645));
    const d0 = V.dist || sel[0];
    const nb = d0 ? d0.v : '';
    ctx.save();
    ctx.font = `800 ${post ? 230 : 260}px ${FH}`;
    ctx.fillStyle = '#0b1834';
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-10px';
    ctx.fillText(nb, W / 2, y + faixa + (post ? 300 : 340));
    ctx.restore();
    ctx.save();
    ctx.font = `800 44px ${FB}`;
    ctx.fillStyle = '#0b62d6';
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '12px';
    ctx.fillText('KM', W / 2, y + faixa + (post ? 380 : 430));
    ctx.restore();
    const resto = sel.filter((s) => s !== d0).slice(0, 3);
    const cw = (bw - 120) / Math.max(1, resto.length);
    resto.forEach((s, k) => {
      const cx = x + 60 + cw * k + cw / 2,
        yy = y + bh - (post ? 150 : 170);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(11,24,52,.55)';
      ctx.font = `700 26px ${FB}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      ctx.fillText(s.l.toUpperCase(), cx, yy);
      ctx.fillStyle = '#0b1834';
      ctx.font = `700 52px ${FH}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '-1px';
      ctx.fillText(s.v + (s.u === '/km' ? '' : ''), cx, yy + 66);
      ctx.restore();
    });
    if (simE) {
      const w2 = 96;
      ctx.drawImage(simE, x + bw - 60 - w2, y + bh - 60 - w2 * (2333.5 / 5528.6), w2, w2 * (2333.5 / 5528.6));
    }
    ctx.save();
    ctx.fillStyle = 'rgba(11,24,52,.45)';
    ctx.font = `500 22px ${FM}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText(`${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`, x + 60, y + bh - 50);
    ctx.restore();
  } else if (L === 'parciais_total') {
    // parciais em cima e o total (Nexos + distância, pace e tempo) embaixo: dá para copiar cada parte separada
    const cima = o.parte !== 'baixo',
      baixo = o.parte !== 'cima';
    const parc = (c.parciais || []).filter((p) => !p.parcial || p.km % 1 > 0.3).slice(0, post ? 14 : 24);
    const pk = (p) => p.seg / (p.parcial ? p.km % 1 || 1 : 1);
    const vs = parc.map(pk),
      mn = Math.min(...vs),
      mx = Math.max(...vs);
    // cada parte mexe sozinha (dois dedos em cima de uma parte aumenta e move só ela)
    const pc = o.pc || { z: 1, dx: 0, dy: 0 },
      pb = o.pb || { z: 1, dx: 0, dy: 0 };
    const lhC = Math.min(post ? 72 : 92, ((post ? 0.52 : 0.58) * H - 160) / Math.max(1, parc.length));
    const topoC = post ? 60 : 90,
      cyC = topoC + (110 + parc.length * lhC) / 2;
    const pxB = post ? 72 : 80,
      yS = H - (post ? 80 : 120) - pxB * 1.4,
      cyB = (yS - (post ? 150 : 170) + yS + pxB * 1.5) / 2;
    o._cy = { pc: cyC + pc.dy, pb: cyB + pb.dy };
    const parte = (t, cy, fn) => {
      ctx.save();
      ctx.translate(W / 2 + t.dx, cy + t.dy);
      ctx.scale(t.z, t.z);
      ctx.translate(-W / 2, -cy);
      fn();
      ctx.restore();
    };
    if (cima)
      parte(pc, cyC, () => {
        const lh = lhC;
        let y = topoC;
        txt('Parciais por km', 80, y + 56, `800 58px ${FH}`, tx, 'left', -1);
        y += 110;
        parc.forEach((p, i) => {
          const v = vs[i],
            w = mx > mn ? 200 + (420 * (mx - v)) / (mx - mn) : 560,
            yy = y + i * lh;
          txt(
            p.parcial ? String(p.km).replace('.', ',') : String(p.km),
            80,
            yy + lh * 0.62,
            `700 ${Math.round(lh * 0.48)}px ${FB}`,
            sub,
            'left',
          );
          ctx.save();
          ctx.fillStyle = v === mn ? AC : branco ? 'rgba(255,255,255,.88)' : 'rgba(11,24,52,.85)';
          if (sombra) {
            ctx.shadowColor = 'rgba(0,0,0,.22)';
            ctx.shadowBlur = 10;
          }
          ret(ctx, 160, yy + lh * 0.2, w, lh * 0.56, lh * 0.28);
          ctx.fill();
          ctx.restore();
          txt(
            fmtPace(v).replace('/km', ''),
            W - 80,
            yy + lh * 0.62,
            `800 ${Math.round(lh * 0.48)}px ${FB}`,
            v === mn ? AC : tx,
            'right',
          );
        });
      });
    if (baixo)
      parte(pb, cyB, () => {
        const tot = ['dist', 'pace', 'tempo'].filter((k) => V[k]).map((k) => V[k]);
        if (comLogo) {
          // a marca branca e nítida como os números (sombra curta, para não acinzentar o traço fino)
          const yL = yS - (post ? 160 : 185);
          // símbolo e nome lado a lado, com espaço entre eles, centralizados juntos
          const wS = 220,
            wN = 330,
            gap = 40,
            hS = wS * (2333.5 / 5528.6),
            hN = wN * (937.1 / 5645),
            x0 = W / 2 - (wS + gap + wN) / 2;
          desenha(sim, 2333.5 / 5528.6, x0, yL, wS, 'left', true);
          desenha(wm, 937.1 / 5645, x0 + wS + gap, yL + (hS - hN) / 2, wN, 'left', true);
        }
        grade(tot, yS, pxB, 50, W - 50, 3, 'center');
      });
  } else if (L === 'parciais') {
    // barras dos km (o mais rápido em destaque)
    const parc = (c.parciais || []).filter((p) => !p.parcial || p.km % 1 > 0.3).slice(0, post ? 16 : 24);
    const pk = (p) => p.seg / (p.parcial ? p.km % 1 || 1 : 1);
    const vs = parc.map(pk),
      mn = Math.min(...vs),
      mx = Math.max(...vs);
    const lh = Math.min(post ? 56 : 66, (H - (post ? 520 : 700)) / Math.max(1, parc.length));
    let y = (H - (130 + parc.length * lh + 150)) / 2;
    txt('Parciais por km', 100, y + 60, `800 64px ${FH}`, tx, 'left', -1);
    y += 130;
    parc.forEach((p, i) => {
      const v = vs[i],
        w = mx > mn ? 220 + (440 * (mx - v)) / (mx - mn) : 600,
        yy = y + i * lh;
      txt(
        p.parcial ? String(p.km).replace('.', ',') : String(p.km),
        100,
        yy + lh * 0.62,
        `700 ${Math.round(lh * 0.5)}px ${FB}`,
        sub,
        'left',
      );
      ctx.save();
      ctx.fillStyle = v === mn ? AC : branco ? 'rgba(255,255,255,.88)' : 'rgba(11,24,52,.85)';
      ret(ctx, 180, yy + lh * 0.2, w, lh * 0.56, lh * 0.28);
      ctx.fill();
      ctx.restore();
      txt(
        fmtPace(v).replace('/km', ''),
        W - 100,
        yy + lh * 0.62,
        `800 ${Math.round(lh * 0.5)}px ${FB}`,
        v === mn ? AC : tx,
        'right',
      );
    });
    logo(W / 2, y + parc.length * lh + 60, 240);
  } else if (L === 'recibo') {
    // medalha: fita em V e o disco com a distância
    const cx = W / 2,
      cy = H * (post ? 0.56 : 0.54),
      R0 = post ? 250 : 280;
    ctx.save(); // fita
    const fita = (lado, cor) => {
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(cx + lado * 40, cy - R0 + 20);
      ctx.lineTo(cx + lado * 260, cy - R0 - (post ? 420 : 560));
      ctx.lineTo(cx + lado * 120, cy - R0 - (post ? 420 : 560));
      ctx.lineTo(cx - lado * 60, cy - R0 + 30);
      ctx.closePath();
      ctx.fill();
    };
    fita(-1, '#143a7c');
    fita(1, '#46d6ff');
    ctx.restore();
    ctx.save();
    if (sombra) {
      ctx.shadowColor = 'rgba(0,0,0,.3)';
      ctx.shadowBlur = 30;
    }
    const gm = ctx.createRadialGradient(cx - R0 * 0.3, cy - R0 * 0.3, R0 * 0.1, cx, cy, R0);
    gm.addColorStop(0, '#e9f6ff');
    gm.addColorStop(0.6, '#9fd8f5');
    gm.addColorStop(1, '#4aa7da');
    ctx.fillStyle = gm;
    ctx.beginPath();
    ctx.arc(cx, cy, R0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(11,24,52,.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R0 - 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const simE = await cardImg('icons/simbolo-escuro.svg');
    if (simE) ctx.drawImage(simE, cx - 70, cy - R0 + 60, 140, 140 * (2333.5 / 5528.6));
    const d0 = V.dist || sel[0];
    if (d0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0b1834';
      ctx.font = `800 ${R0 * 0.52}px ${FH}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '-6px';
      ctx.fillText(d0.v, cx, cy + R0 * 0.16);
      ctx.font = `800 34px ${FB}`;
      ctx.fillStyle = '#0b62d6';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
      ctx.fillText((d0.u || '').toUpperCase(), cx, cy + R0 * 0.36);
      ctx.restore();
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(11,24,52,.6)';
    ctx.font = `600 26px ${FM}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText(
      `${DIAS_LONGOS[dt.getDay()].toUpperCase()} · ${dt.getDate()} ${MESES[dt.getMonth()]}`,
      cx,
      cy + R0 * 0.62,
    );
    ctx.restore();
    const resto = sel.filter((s) => s !== d0).slice(0, 2);
    const yy = cy + R0 + (post ? 90 : 130);
    resto.forEach((s, k) => stat(s, resto.length > 1 ? W / 2 + (k ? 200 : -200) : W / 2, yy, 70, 'center'));
    logo(W / 2, H - (post ? 130 : 220), 260);
  } else if (L === 'destaque') {
    // um número gigante e o resto pequeno embaixo
    const prim = sel[0],
      resto = sel.slice(1);
    let y = H * (post ? 0.26 : 0.3);
    if (dataTxt) txt(dataTxt, W / 2, y - 40, LBL(28), sub, 'center', 3);
    if (prim) {
      txt(prim.l.toUpperCase(), W / 2, y + 40, LBL(34), sub, 'center', 5);
      const px = post ? 230 : 270;
      txt(prim.v, W / 2, y + 40 + px * 0.98, `800 ${px}px ${FH}`, tx, 'center', -px * 0.05);
      if (prim.u)
        txt(prim.u.replace('/', '').toUpperCase(), W / 2, y + 40 + px * 0.98 + 80, `800 46px ${FB}`, AC, 'center', 10);
      y += 40 + px * 0.98 + 190;
    }
    y = grade(resto.slice(0, 3), y, post ? 66 : 74, 70, W - 70, 3, 'center');
    if (temRota && !post) rota(W / 2 - 160, y + 10, 320, 240, 8);
    logo(W / 2, H - (post ? 110 : 150), 250);
  } else if (L === 'recorde' && CX.recorde) {
    // novo recorde pessoal: tempo novo grande e o antigo riscado
    const R = CX.recorde,
      F = post ? 0.78 : 1;
    let y = H * (post ? 0.17 : 0.22);
    txt('NOVO RECORDE PESSOAL', W / 2, y, `800 30px ${FB}`, AC, 'center', 5);
    y += 130 * F;
    txt(R.n, W / 2, y, `800 ${Math.round(92 * F)}px ${FH}`, tx, 'center', -2);
    const tNovo = fmtDurLongo(R.t),
      pxT = cabe(tNovo, '800', Math.round(300 * F), W - 120, FH, -10);
    y += pxT * 0.98;
    txt(tNovo, W / 2, y, `800 ${pxT}px ${FH}`, tx, 'center', -10);
    y += 150 * F;
    const fa = `700 ${Math.round(76 * F)}px ${FH}`,
      ta = fmtDurLongo(R.antes),
      wa = larg(ta, fa);
    txt(ta, W / 2, y, fa, apag, 'center');
    ctx.save();
    ctx.fillStyle = sub;
    ctx.fillRect(W / 2 - wa / 2 - 10, y - 27 * F, wa + 20, 6);
    ctx.restore();
    y += 60 * F;
    pilula(`${cardDifTxt(R.antes - R.t)} mais rápido`, W / 2, y, Math.round(44 * F));
    y += 96 * F + 100 * F;
    stat({ l: 'Pace', v: fmtPace(R.t / R.d).replace('/km', ''), u: '/km' }, W / 2 - 220, y, 70 * F, 'center');
    stat({ l: 'Data', v: dataCurta(c.data), u: '' }, W / 2 + 220, y, 70 * F, 'center');
    logo(W / 2, H - (post ? 150 : 270), 240);
  } else if (L === 'mesmo' && CX.igual) {
    // o mesmo trajeto de outro dia, com a diferença de tempo
    const G = CX.igual;
    let y = post ? 150 : 250;
    txt('MESMO PERCURSO', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    const hR = post ? 330 : 560;
    cardRota(ctx, c.rota, 140, y + 50, W - 280, hR, AC, 13, true);
    y += 50 + hR + (post ? 80 : 120);
    const linha = (yy, quando, d) => {
      const dest = d === c;
      txt(quando, 100, yy, `700 34px ${FB}`, dest ? AC : sub, 'left', 2);
      txt(
        fmtDurLongo(d.duracao_s),
        100,
        yy + (dest ? 104 : 88),
        `800 ${dest ? 104 : 80}px ${FH}`,
        dest ? tx : apag,
        'left',
        -3,
      );
      txt(
        fmtPace(paceDe(d)).replace('/km', ' /km'),
        W - 100,
        yy + (dest ? 104 : 88),
        `700 ${dest ? 50 : 40}px ${FB}`,
        dest ? tx : apag,
        'right',
      );
    };
    linha(y, dataCurta(c.data).toUpperCase(), c);
    y += post ? 150 : 160;
    ctx.save();
    ctx.fillStyle = fino;
    ctx.fillRect(100, y, W - 200, 2);
    ctx.restore();
    y += post ? 55 : 60;
    linha(y, 'EM ' + dataCurta(G.data).toUpperCase(), G);
    y += post ? 135 : 160;
    pilula(
      G.mesmaDist
        ? `${cardDifTxt(G.ganho)} mais rápido no mesmo trajeto`
        : `${Math.round(G.ganho)} s/km mais rápido no mesmo trajeto`,
      W / 2,
      y,
      40,
    );
    logo(W / 2, H - (post ? 130 : 230), 230);
  } else if (L === 'semana' && CX.semana) {
    // a semana da corrida: km, corridas, tempo e as barras de cada dia
    const S0 = CX.semana,
      F = post ? 0.78 : 1;
    let y = post ? 140 : 280;
    txt(`MINHA SEMANA  ·  ${S0.rotulo}`, 100, y, `800 30px ${FB}`, AC, 'left', 5);
    const kmT = fmtNum(S0.total, S0.total >= 100 ? 0 : 1),
      pxK = cabe(kmT, '800', Math.round(260 * F), W - 360, FH, -10);
    y += pxK * 0.98;
    txt(kmT, 100, y, `800 ${pxK}px ${FH}`, tx, 'left', -10);
    txt('km', 100 + larg(kmT, `800 ${pxK}px ${FH}`, -10) + 24, y, `800 ${Math.round(80 * F)}px ${FB}`, sub, 'left');
    y += 110 * F;
    const tot = [
      { l: S0.n === 1 ? 'Corrida' : 'Corridas', v: String(S0.n), u: '' },
      S0.seg ? { l: 'Tempo', v: fmtHM(S0.seg), u: '' } : null,
      S0.seg ? { l: 'Pace médio', v: fmtPace(S0.seg / S0.total).replace('/km', ''), u: '/km' } : null,
    ].filter(Boolean);
    tot.forEach((s, i) => stat(s, 100 + i * 300, y, 70 * F, 'left'));
    const base = H - (post ? 250 : 430),
      topo = y + 70 * F * 2 + (post ? 70 : 140),
      alt = base - topo,
      bw = 92,
      gap = (W - 200 - bw * 7) / 6,
      mx = Math.max(...S0.km);
    S0.km.forEach((k, i) => {
      const x = 100 + i * (bw + gap),
        h = k ? Math.max(30, (k / mx) * alt) : 14;
      ctx.save();
      ret(ctx, x, base - h, bw, h, Math.min(18, h / 2));
      ctx.fillStyle = k ? (k === mx ? AC : forte) : fino;
      if (sombra && k) {
        ctx.shadowColor = 'rgba(0,0,0,.22)';
        ctx.shadowBlur = 10;
      }
      ctx.fill();
      ctx.restore();
      if (k) txt(fmtNum(k, 1), x + bw / 2, base - h - 22, `700 30px ${FB}`, k === mx ? AC : sub, 'center');
      txt('STQQSSD'[i], x + bw / 2, base + 60, `800 34px ${FB}`, sub, 'center');
    });
    logo(W / 2, H - (post ? 120 : 210), 220);
  } else if (L === 'constancia' && CX.const) {
    // semanas seguidas treinando, com os quadrados das últimas 16 semanas
    const K = CX.const,
      F = post ? 0.74 : 1;
    let y = post ? 130 : 330;
    txt('CONSTÂNCIA', W / 2, y, `800 30px ${FB}`, AC, 'center', 5);
    y += 360 * F;
    txt(String(K.n), W / 2, y, `800 ${Math.round(380 * F)}px ${FH}`, tx, 'center', -14);
    y += 100 * F;
    txt('semanas seguidas', W / 2, y, `800 ${Math.round(64 * F)}px ${FB}`, tx, 'center');
    y += 70 * F;
    txt('treinando 2 vezes ou mais por semana', W / 2, y, `600 ${Math.round(40 * F)}px ${FB}`, sub, 'center');
    y += 100 * F;
    const cols = 8,
      q = Math.round(92 * F),
      g = Math.round(22 * F),
      x0 = (W - (cols * q + (cols - 1) * g)) / 2;
    K.sem.forEach((n, i) => {
      const x = x0 + (i % cols) * (q + g),
        yy = y + Math.floor(i / cols) * (q + g);
      ctx.save();
      ret(ctx, x, yy, q, q, 20 * F);
      ctx.fillStyle = n >= 2 ? (i === K.sem.length - 1 ? AC : forte) : n === 1 ? meio : fino;
      ctx.fill();
      ctx.restore();
    });
    y += 2 * (q + g) + 60 * F;
    txt(`${K.treinos} treinos nessas ${K.n} semanas`, W / 2, y, `700 ${Math.round(40 * F)}px ${FB}`, sub, 'center');
    logo(W / 2, H - (post ? 130 : 260), 240);
  } else if (L === 'pace_km') {
    // linha do pace a cada km (mais rápido em cima) e o melhor km marcado
    const parc = parcKm(c),
      F = post ? 0.8 : 1;
    let y = post ? 130 : 270;
    txt('PACE KM A KM', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    y += 60;
    const tops = ['dist', 'tempo', 'pace'].filter((k) => V[k]).map((k) => V[k]);
    tops.forEach((s, i) => stat(s, 100 + i * 310, y, 66 * F, 'left'));
    const vs = parc.map((p) => p.v),
      mn = Math.floor((Math.min(...vs) - 8) / 15) * 15,
      mx = Math.ceil((Math.max(...vs) + 8) / 15) * 15,
      passo = mx - mn > 150 ? 60 : 30;
    const gx0 = 160,
      gx1 = W - 100,
      gy0 = y + 66 * F * 2 + (post ? 120 : 200),
      gy1 = H - (post ? 280 : 470);
    const py = (v) => gy0 + ((v - mn) / (mx - mn)) * (gy1 - gy0);
    for (let s = Math.ceil(mn / passo) * passo; s <= mx; s += passo) {
      ctx.save();
      ctx.fillStyle = fino;
      ctx.fillRect(gx0, py(s), gx1 - gx0, 2);
      ctx.restore();
      txt(fmtPace(s).replace('/km', ''), gx0 - 20, py(s) + 9, `500 26px ${FM}`, sub, 'right');
    }
    const P = parc.map((p, i) => [gx0 + (parc.length > 1 ? (i / (parc.length - 1)) * (gx1 - gx0) : 0), py(p.v)]);
    const caminho = () => {
      ctx.beginPath();
      P.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)));
    };
    const ga = ctx.createLinearGradient(0, gy0, 0, gy1);
    ga.addColorStop(0, branco ? 'rgba(70,214,255,.35)' : 'rgba(11,98,214,.25)');
    ga.addColorStop(1, branco ? 'rgba(70,214,255,0)' : 'rgba(11,98,214,0)');
    ctx.save();
    caminho();
    ctx.lineTo(gx1, gy1);
    ctx.lineTo(gx0, gy1);
    ctx.closePath();
    ctx.fillStyle = ga;
    ctx.fill();
    ctx.strokeStyle = AC;
    ctx.lineWidth = 10;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.shadowColor = AC;
    ctx.shadowBlur = 18;
    caminho();
    ctx.stroke();
    ctx.restore();
    const iMelhor = vs.indexOf(Math.min(...vs)),
      cada = parc.length > 14 ? 3 : parc.length > 9 ? 2 : 1;
    P.forEach(([x, yy], i) => {
      ctx.save();
      ctx.fillStyle = i === iMelhor ? tx : AC;
      ctx.beginPath();
      ctx.arc(x, yy, i === iMelhor ? 18 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (i % cada === 0 || i === P.length - 1 || i === iMelhor)
        txt(parc[i].rot, x, gy1 + 60, `700 30px ${FB}`, sub, 'center');
    });
    const [bx, by] = P[iMelhor],
      rot = `km ${parc[iMelhor].rot}  ${fmtPace(vs[iMelhor]).replace('/km', '')}`,
      fr = `800 36px ${FB}`,
      wr = larg(rot, fr) + 60,
      cx = Math.max(wr / 2 + 20, Math.min(W - wr / 2 - 20, bx));
    ctx.save();
    ret(ctx, cx - wr / 2, by - 130, wr, 88, 24);
    ctx.fillStyle = branco ? '#ffffff' : '#0b1834';
    ctx.fill();
    ctx.restore();
    txt(rot, cx, by - 73, fr, branco ? '#0b1834' : '#ffffff', 'center');
    txt('km', (gx0 + gx1) / 2, gy1 + 115, `600 28px ${FB}`, sub, 'center');
    logo(W / 2, H - (post ? 120 : 230), 220);
  } else if ((L === 'zonas_fc' && cardZonasFC(c)) || (L === 'zonas_pot' && cardZonasPot(c))) {
    // tempo em cada zona: FC em colunas e potência em faixas, como na tela do relógio
    const pot = L === 'zonas_pot',
      Z = pot ? cardZonasPot(c) : cardZonasFC(c),
      F = post ? 0.8 : 1,
      E = (c.analise && c.analise.extras) || {},
      n = Z.seg.length,
      tot = Z.seg.reduce((a, b) => a + b, 0) || 1,
      mx = Math.max(...Z.seg) || 1;
    const CZ = ['#9aa3b2', '#3b8cff', '#2fc46b', '#ff9a2e', '#ff4757', '#c04dff', '#8a5cff'];
    const mmss = (s) => {
      s = Math.round(s);
      const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60),
        ss = String(s % 60).padStart(2, '0');
      return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
    };
    const faixa = (i) => {
      if (!Z.lim || Z.lim[i] == null) return '';
      const u = pot ? ' W' : '';
      if (i === 0) return Z.lim[1] != null ? `até ${Z.lim[1] - 1}${u}` : '';
      if (i === n - 1 || Z.lim[i + 1] == null) return `${Z.lim[i]}+${u}`;
      return `${Z.lim[i]}–${Z.lim[i + 1] - 1}${u}`;
    };
    const media = pot ? E.pot_med_rel || E.pot_med : c.fc_media;
    let y = post ? 130 : 280;
    txt(pot ? 'ZONAS DE POTÊNCIA' : 'ZONAS DE FC', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    y += 160 * F;
    const fg = `800 ${Math.round(150 * F)}px ${FH}`,
      big = media ? String(Math.round(media)) : mmss(c.duracao_s);
    txt(big, 100, y, fg, tx, 'left', -6);
    if (media)
      txt(pot ? 'W' : 'bpm', 100 + larg(big, fg, -6) + 22, y, `700 ${Math.round(56 * F)}px ${FB}`, sub, 'left');
    y += 70 * F;
    txt(
      media ? (pot ? 'potência média' : 'frequência cardíaca média') : 'de treino',
      100,
      y,
      `600 ${Math.round(42 * F)}px ${FB}`,
      sub,
      'left',
    );
    y += 90 * F;
    [V.dist, V.tempo, V.pace].filter(Boolean).forEach((s, i) => stat(s, 100 + i * 310, y, 66 * F, 'left'));
    const g0 = y + 170 * F,
      g1 = H - (post ? 200 : 330);
    const barra = (x, yy, w, h, cor) => {
      ctx.save();
      if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,.25)';
        ctx.shadowBlur = 10;
      }
      ret(ctx, x, yy, w, h, Math.min(14, w / 2, h / 2));
      ctx.fillStyle = cor;
      ctx.fill();
      ctx.restore();
    };
    if (!pot) {
      // colunas Z1 a Z5
      const cw = (W - 200) / n,
        bw = cw * 0.6,
        base = g1 - 100 * F,
        hMax = base - (g0 + 110 * F);
      Z.seg.forEach((s, i) => {
        const cx = 100 + cw * i + cw / 2,
          h = Math.max(10, (s / mx) * hMax),
          top = base - h;
        ctx.save();
        ret(ctx, cx - bw / 2, base - hMax, bw, hMax, 14);
        ctx.fillStyle = fino;
        ctx.fill();
        ctx.restore();
        barra(cx - bw / 2, top, bw, h, CZ[i]);
        txt(mmss(s), cx, top - 52 * F, `800 ${Math.round(44 * F)}px ${FB}`, tx, 'center');
        txt(`${Math.round((s / tot) * 100)}%`, cx, top - 16 * F, `700 ${Math.round(28 * F)}px ${FB}`, sub, 'center');
        txt(`Z${i + 1}`, cx, base + 56 * F, `800 ${Math.round(42 * F)}px ${FH}`, CZ[i], 'center');
        const fx = faixa(i);
        if (fx) txt(fx, cx, base + 96 * F, `600 ${Math.round(26 * F)}px ${FB}`, sub, 'center');
      });
    } else {
      // faixas da zona mais alta para a mais baixa
      const rh = (g1 - g0) / n,
        x0 = 330,
        bMax = W - 100 - 190 - x0;
      for (let k = 0; k < n; k++) {
        const i = n - 1 - k,
          s = Z.seg[i],
          yc = g0 + rh * k + rh / 2,
          bh = Math.min(64, rh * 0.46),
          w = Math.max(12, (s / mx) * bMax);
        txt(`Z${i + 1}`, 100, yc + (faixa(i) ? 0 : 14), `800 ${Math.round(44 * F)}px ${FH}`, CZ[i], 'left');
        if (faixa(i)) txt(faixa(i), 100, yc + 36 * F, `600 ${Math.round(26 * F)}px ${FB}`, sub, 'left');
        ctx.save();
        ret(ctx, x0, yc - bh / 2, bMax, bh, 14);
        ctx.fillStyle = fino;
        ctx.fill();
        ctx.restore();
        barra(x0, yc - bh / 2, w, bh, CZ[i]);
        txt(mmss(s), W - 100, yc + 2, `800 ${Math.round(44 * F)}px ${FB}`, tx, 'right');
        txt(`${Math.round((s / tot) * 100)}%`, W - 100, yc + 38 * F, `700 ${Math.round(26 * F)}px ${FB}`, sub, 'right');
      }
    }
    logo(W / 2, H - (post ? 110 : 190), 220);
  } else if (L === 'efeito' && cardTE(c)) {
    // efeito do treino do relógio: aeróbico e anaeróbico na escala de 0 a 5
    const T = cardTE(c),
      F = post ? 0.8 : 1;
    let y = post ? 130 : 280;
    txt('EFEITO DO TREINO', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    y += 130 * F;
    const princ = T.ana != null && T.ana > T.aer ? T.ana : T.aer,
      fp = `800 ${cabe(teNome(princ), '800', 104 * F, W - 200, FH, -4)}px ${FH}`;
    txt(teNome(princ), 100, y, fp, tx, 'left', -4);
    y += 66 * F;
    txt(
      T.ana != null && T.ana > T.aer ? 'para velocidade e potência' : 'para a base aeróbica',
      100,
      y,
      `600 ${Math.round(42 * F)}px ${FB}`,
      sub,
      'left',
    );
    y += 90 * F;
    [V.dist, V.tempo, V.pace].filter(Boolean).forEach((s, i) => stat(s, 100 + i * 310, y, 66 * F, 'left'));
    const g0 = y + 170 * F,
      g1 = H - (post ? 230 : 380);
    const A0 = Math.PI * 0.75,
      A1 = Math.PI * 2.25;
    const medidor = (cx, cy, R, v, rot) => {
      const lw = R * 0.17;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = lw;
      ctx.strokeStyle = fino;
      ctx.beginPath();
      ctx.arc(cx, cy, R, A0, A1);
      ctx.stroke();
      const a = A0 + (A1 - A0) * Math.max(0.01, Math.min(1, v / 5));
      const gr = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      gr.addColorStop(0, branco ? '#46d6ff' : '#0b62d6');
      gr.addColorStop(1, branco ? '#9ef0ff' : '#46a0ff');
      if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,.25)';
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = gr;
      ctx.beginPath();
      ctx.arc(cx, cy, R, A0, a);
      ctx.stroke();
      ctx.restore();
      // marcas de 1 a 4
      for (let k = 1; k < 5; k++) {
        const ak = A0 + ((A1 - A0) * k) / 5;
        ctx.save();
        ctx.strokeStyle = branco ? 'rgba(4,10,24,.45)' : 'rgba(255,255,255,.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ak) * (R - lw / 2), cy + Math.sin(ak) * (R - lw / 2));
        ctx.lineTo(cx + Math.cos(ak) * (R + lw / 2), cy + Math.sin(ak) * (R + lw / 2));
        ctx.stroke();
        ctx.restore();
      }
      txt(fmtNum(v, 1), cx, cy + R * 0.16, `800 ${Math.round(R * 0.5)}px ${FH}`, tx, 'center', -3);
      txt(rot.toUpperCase(), cx, cy + R * 0.44, `800 ${Math.round(Math.max(24, R * 0.13))}px ${FB}`, AC, 'center', 3);
      txt(teNome(v), cx, cy + R + lw * 0.2 + 40 * F, `700 ${Math.round(Math.max(28, R * 0.17))}px ${FB}`, tx, 'center');
      txt(
        '0',
        cx + Math.cos(A0) * R,
        cy + Math.sin(A0) * R + lw + 26 * F,
        `600 ${Math.round(26 * F)}px ${FB}`,
        sub,
        'center',
      );
      txt(
        '5',
        cx + Math.cos(A1) * R,
        cy + Math.sin(A1) * R + lw + 26 * F,
        `600 ${Math.round(26 * F)}px ${FB}`,
        sub,
        'center',
      );
    };
    if (T.ana != null) {
      const R = Math.min(190 * F, (g1 - g0) / 2.6);
      const cy = (g0 + g1) / 2 - 20 * F;
      medidor(W / 4 + 10, cy, R, T.aer, 'Aeróbico');
      medidor((W * 3) / 4 - 10, cy, R, T.ana, 'Anaeróbico');
    } else {
      const R = Math.min(280 * F, (g1 - g0) / 2.6);
      medidor(W / 2, (g0 + g1) / 2 - 20 * F, R, T.aer, 'Aeróbico');
    }
    txt('Escala do relógio, de 0 a 5', W / 2, g1 + 70 * F, `600 ${Math.round(28 * F)}px ${FB}`, sub, 'center');
    logo(W / 2, H - (post ? 110 : 190), 220);
  } else if (L === 'vo2' && c._x && c._x.vo2) {
    // VO2máx do relógio com a classificação por idade e sexo (Cooper Institute, a mesma da Garmin)
    const VO = c._x.vo2,
      K = VO.classe,
      F = post ? 0.8 : 1;
    const CV = ['#ff4757', '#ff9a2e', '#2fc46b', '#3b8cff', '#a35cff'];
    let y = post ? 130 : 280;
    txt('VO2MÁX', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    y += 120 * F;
    txt(
      K ? `Condicionamento ${K.nome.toLowerCase()}` : 'Capacidade aeróbica',
      100,
      y,
      `800 ${cabe(K ? `Condicionamento ${K.nome.toLowerCase()}` : 'Capacidade aeróbica', '800', 72 * F, W - 200, FH, -3)}px ${FH}`,
      tx,
      'left',
      -3,
    );
    y += 60 * F;
    txt('estimado pelo relógio', 100, y, `600 ${Math.round(40 * F)}px ${FB}`, sub, 'left');
    const g0 = y + 60 * F,
      g1 = H - (post ? 400 : 600),
      R = Math.min(330 * F, (g1 - g0) / 1.8),
      cx = W / 2,
      cy = g0 + R + 50 * F,
      lw = R * 0.15;
    const A0 = Math.PI * 0.75,
      A1 = Math.PI * 2.25,
      seg = (A1 - A0) / 5,
      gap = 0.035;
    ctx.save();
    ctx.lineWidth = lw;
    if (sombra) {
      ctx.shadowColor = 'rgba(0,0,0,.22)';
      ctx.shadowBlur = 10;
    }
    for (let k = 0; k < 5; k++) {
      ctx.strokeStyle = K ? CV[k] : k <= 2 ? fino : AC;
      ctx.globalAlpha = K && k !== K.i ? 0.42 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, A0 + seg * k + gap, A0 + seg * (k + 1) - gap);
      ctx.stroke();
    }
    ctx.restore();
    if (K) {
      const l = K.lim,
        i = K.i,
        lo = i === 0 ? l[0] - (l[1] - l[0]) : l[i - 1],
        hi = i === 4 ? l[3] + (l[3] - l[2]) : l[i],
        f = Math.max(0.06, Math.min(0.94, (VO.v - lo) / (hi - lo))),
        a = A0 + seg * (i + f);
      const mx0 = cx + Math.cos(a) * R,
        my0 = cy + Math.sin(a) * R;
      ctx.save();
      if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,.35)';
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx0, my0, lw * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = CV[i];
      ctx.beginPath();
      ctx.arc(mx0, my0, lw * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    txt(
      fmtNum(VO.v, Number.isInteger(VO.v) ? 0 : 1),
      cx,
      cy + R * 0.12,
      `800 ${Math.round(R * 0.62)}px ${FH}`,
      tx,
      'center',
      -6,
    );
    txt('ml/kg/min', cx, cy + R * 0.32, `600 ${Math.round(R * 0.1)}px ${FB}`, sub, 'center');
    if (K)
      txt(K.nome, cx, cy + R * 0.58, `800 ${Math.round(R * 0.17)}px ${FB}`, branco ? '#ffffff' : CV[K.i], 'center');
    let yb = cy + R + 40 * F;
    if (K) {
      // legenda das cinco faixas
      const lw2 = (W - 200) / 5;
      VO2_NOMES.forEach((nm, k) => {
        const xx = 100 + lw2 * k + lw2 / 2;
        ctx.save();
        ctx.fillStyle = CV[k];
        ctx.globalAlpha = k === K.i ? 1 : 0.55;
        ctx.beginPath();
        ctx.arc(xx - larg(nm, `700 ${Math.round(26 * F)}px ${FB}`) / 2 - 18, yb - 9 * F, 9 * F, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        txt(nm, xx + 6, yb, `${k === K.i ? 800 : 600} ${Math.round(26 * F)}px ${FB}`, k === K.i ? tx : sub, 'center');
      });
      yb += 50 * F;
      txt(
        'Classificação por idade e sexo (Cooper Institute)',
        W / 2,
        yb,
        `600 ${Math.round(24 * F)}px ${FB}`,
        sub,
        'center',
      );
    }
    const yS = H - (post ? 330 : 470);
    [V.dist, V.tempo, V.pace]
      .filter(Boolean)
      .forEach((s, i, arr) => stat(s, W / 2 + (i - (arr.length - 1) / 2) * 300, yS, 60 * F, 'center'));
    logo(W / 2, H - (post ? 110 : 190), 220);
  } else if (L === 'altimetria' && altDe(c)) {
    // perfil de subidas e descidas do percurso
    const A = altSuave(altDe(c)),
      as = A.map((p) => p[1]),
      amin = Math.min(...as),
      amax = Math.max(...as),
      F = post ? 0.8 : 1;
    const E = (c.analise && c.analise.extras) || {},
      subida = Math.round(c.elevacao_m || E.sub || 0),
      altMax = Math.round(E.alt_max != null ? E.alt_max : amax);
    let y = post ? 130 : 280;
    txt('ALTIMETRIA', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    const grande = subida ? `+${subida} m` : `${Math.round(amax - amin)} m`;
    y += 160 * F;
    txt(grande, 100, y, `800 ${Math.round(150 * F)}px ${FH}`, tx, 'left', -6);
    y += 70 * F;
    txt(
      subida ? 'de subida acumulada' : 'de diferença de altitude',
      100,
      y,
      `600 ${Math.round(42 * F)}px ${FB}`,
      sub,
      'left',
    );
    y += 90 * F;
    const tops = [V.dist, { l: 'Alt. máxima', v: String(altMax), u: 'm' }, V.pace].filter(Boolean);
    tops.forEach((s, i) => stat(s, 100 + i * 310, y, 66 * F, 'left'));
    const gy1 = H - (post ? 200 : 380),
      hA = post ? 300 : 500,
      d0 = A[0][0],
      d1 = A[A.length - 1][0] || 1;
    const pts = A.map(([d, a]) => [
      ((d - d0) / (d1 - d0 || 1)) * W,
      gy1 - ((a - amin) / (amax - amin)) * hA * 0.85 - hA * 0.08,
    ]);
    const ga = ctx.createLinearGradient(0, gy1 - hA, 0, gy1 + 160);
    ga.addColorStop(0, branco ? 'rgba(70,214,255,.55)' : 'rgba(11,98,214,.4)');
    ga.addColorStop(1, branco ? 'rgba(70,214,255,0)' : 'rgba(11,98,214,0)');
    ctx.save();
    ctx.beginPath();
    pts.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)));
    ctx.lineTo(W, gy1 + 160);
    ctx.lineTo(0, gy1 + 160);
    ctx.closePath();
    ctx.fillStyle = ga;
    ctx.fill();
    ctx.strokeStyle = tx;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)));
    ctx.stroke();
    const topo = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    ctx.fillStyle = tx;
    ctx.beginPath();
    ctx.arc(topo[0], topo[1], 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    txt(`${altMax} m`, Math.max(80, Math.min(W - 80, topo[0])), topo[1] - 36, `800 34px ${FB}`, tx, 'center');
    logo(W / 2, H - (post ? 110 : 190), 220);
  } else if (L === 'gigante' && V.dist) {
    // só a distância enorme, para colar por cima da foto
    const km = c.distancia_m / 1000,
      num = fmtNum(km, km >= 10 ? 1 : 2),
      fk = `800 ${post ? 80 : 90}px ${FB}`,
      wk = larg('km', fk),
      px = cabe(num, '800', post ? 290 : 330, W - 180 - wk, FH, -14),
      fn = `800 ${px}px ${FH}`,
      wn = larg(num, fn, -14),
      x0 = (W - (wn + 16 + wk)) / 2,
      yb = H * (post ? 0.7 : 0.74);
    txt(num, x0, yb, fn, tx, 'left', -14);
    txt('km', x0 + wn + 16, yb, fk, tx, 'left');
    const nome = cardNomeDist(km) || (c._serie && c._serie.nome ? c._serie.nome.toUpperCase() : ''),
      linhaS = [nome, V.tempo && V.tempo.v, !nome && V.pace ? V.pace.v + ' /KM' : ''].filter(Boolean).join('  ·  ');
    txt(linhaS, W / 2, yb + 100, `800 36px ${FB}`, tx, 'center', 4);
    logo(W / 2, yb + 170, 180);
  } else if (L === 'forca' && c._forca) {
    // treino de força: carga total levantada, números do treino e os exercícios
    const T = c._forca,
      F = post ? 0.8 : 1;
    let y = post ? 120 : 260;
    txt('TREINO DE FORÇA', 100, y, `800 30px ${FB}`, AC, 'left', 5);
    const tit = T.titulo || 'Treino',
      pxT = cabe(tit, '800', Math.round(66 * F), W - 200, FH, -1);
    y += 92 * F;
    txt(tit, 100, y, `800 ${pxT}px ${FH}`, tx, 'left', -1);
    const big = T.volume ? Math.round(T.volume).toLocaleString('pt-BR') : String(T.min || '–'),
      pxB = cabe(big, '800', Math.round(210 * F), W - 380, FH, -8);
    y += pxB * 1.04;
    txt(big, 100, y, `800 ${pxB}px ${FH}`, tx, 'left', -8);
    txt(
      T.volume ? 'kg' : 'min',
      100 + larg(big, `800 ${pxB}px ${FH}`, -8) + 22,
      y,
      `800 ${Math.round(70 * F)}px ${FB}`,
      sub,
      'left',
    );
    y += 70 * F;
    txt(T.volume ? 'levantados no total' : 'de treino', 100, y, `600 ${Math.round(40 * F)}px ${FB}`, sub, 'left');
    y += 90 * F;
    [
      { l: 'Exercícios', v: String(T.exs), u: '' },
      T.series ? { l: 'Séries', v: String(T.series), u: '' } : null,
      T.volume && T.min
        ? { l: 'Duração', v: String(T.min), u: 'min' }
        : T.esforco != null
          ? { l: 'Esforço', v: String(T.esforco), u: '/10' }
          : null,
    ]
      .filter(Boolean)
      .forEach((s, i) => stat(s, 100 + i * 310, y, 66 * F, 'left'));
    y += 66 * F * 2 + (post ? 40 : 70);
    ctx.save();
    ctx.fillStyle = fino;
    ctx.fillRect(100, y, W - 200, 2);
    ctx.restore();
    const maxL = post ? 3 : 5,
      lista = T.lista.slice(0, maxL),
      temTop = lista.some((e) => e.top);
    if (temTop) txt('Maior carga do dia', W - 100, y + 44, `700 26px ${FB}`, AC, 'right');
    y += post ? 90 : 110;
    lista.forEach((e) => {
      const fN = `700 ${Math.round(40 * F)}px ${FB}`,
        fC = `800 ${Math.round(46 * F)}px ${FH}`,
        wC = e.kg ? larg(e.kg, fC, -1) + 40 : 0;
      txt(corta(e.n, fN, W - 200 - wC), 100, y, fN, e.top ? tx : sub, 'left');
      if (e.sr) txt(e.sr, 100, y + 48 * F, `500 ${Math.round(30 * F)}px ${FM}`, sub, 'left');
      if (e.kg) txt(e.kg, W - 100, y + 24 * F, fC, e.top ? AC : tx, 'right', -1);
      y += 120 * F;
    });
    if (T.lista.length > maxL)
      txt(
        `+ ${T.lista.length - maxL} exercício${T.lista.length - maxL > 1 ? 's' : ''}`,
        100,
        y,
        `700 ${Math.round(34 * F)}px ${FB}`,
        sub,
        'left',
      );
    logo(W / 2, H - (post ? 110 : 230), 220);
  } else {
    // 'linha': tudo numa faixa embaixo, a foto fica livre
    if (o.fundo === 'foto') {
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
    }
    const lista = sel.slice(0, 3),
      px = 72;
    let y = H - (post ? 120 : 170) - px * 1.4;
    rota(80, y - 320, 260, 230, 7);
    simbolo(W - 80, y - 230, 190, 'right');
    logoTexto(W - 80, y - 120, 210, 'right');
    if (dataTxt) txt(dataTxt, 80, y - 50 - 20, LBL(24), sub, 'left', 3);
    ctx.save();
    ctx.fillStyle = branco ? 'rgba(255,255,255,.35)' : 'rgba(11,24,52,.2)';
    ctx.fillRect(80, y - 40, W - 160, 2);
    ctx.restore();
    grade(lista, y + 10, px, 80, W - 80, 3, 'left');
  }
  if (o.local) {
    // localização escolhida pelo atleta: alfinete + nome do lugar
    const fl = `700 ${post ? 30 : 34}px ${FB}`,
      maxW = L === 'recibo' ? W - 200 : W - 70 - 250;
    let t = String(o.local);
    while (t.length > 3 && larg(t, fl, 1) > maxW) t = t.slice(0, -2).trimEnd() + '…';
    const ic = post ? 34 : 38,
      w = ic + 12 + larg(t, fl, 1);
    const x0 = L === 'recibo' ? (W - w) / 2 : 70,
      yb = L === 'recibo' ? H - (post ? 46 : 104) : (post ? 66 : 96) + 42;
    if (window.Path2D) {
      ctx.save();
      ctx.translate(x0, yb - ic * 0.86);
      ctx.scale(ic / 24, ic / 24);
      ctx.fillStyle = AC;
      if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,.3)';
        ctx.shadowBlur = 8;
      }
      ctx.fill(
        new Path2D(
          'M12 23s-7.5-6.9-7.5-12.6a7.5 7.5 0 0 1 15 0C19.5 16.1 12 23 12 23zm0-9.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z',
        ),
        'evenodd',
      );
      ctx.restore();
    }
    txt(t, x0 + ic + 12, yb, fl, tx, 'left', 1);
  }
  ctx.restore();
  if (o.parte !== 'baixo') assinatura();
}
// localização do card: busca no OpenStreetMap (só quando o atleta pede; nada é enviado sozinho)
const locCurto = (r) => {
  const a = r.address || {};
  const nome = r.name || a.amenity || a.leisure || a.tourism || a.road || '';
  const cid = a.city || a.town || a.village || a.municipality || a.city_district || '';
  const uf = (a['ISO3166-2-lvl4'] || '').replace(/^BR-/, '');
  return (
    [...new Set([nome, cid].filter(Boolean))].join(', ') + (uf && cid && uf.length === 2 ? ` - ${uf}` : '') ||
    r.display_name ||
    ''
  );
};
async function locBuscar(q) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=pt-BR&q=${encodeURIComponent(q)}`,
  );
  if (!r.ok) throw 0;
  return (await r.json()).map(locCurto).filter((x, i, a) => x && a.indexOf(x) === i);
}
async function locReversa(lat, lon) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=pt-BR&lat=${lat}&lon=${lon}`,
  );
  if (!r.ok) throw 0;
  return locCurto(await r.json());
}
/* ---------- dados dos modelos novos do card ---------- */
const dataCurta = (d) => {
  const x = new Date(d);
  return `${x.getDate()} ${MES_CURTO[x.getMonth()]}`;
};
const cardDifTxt = (s) => (Math.round(s) < 60 ? `${Math.round(s)} s` : fmtDurLongo(s));
const fmtNum = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const fmtHM = (s) => {
  const h = Math.floor(s / 3600),
    m = Math.round((s % 3600) / 60);
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
};
const cardNomeDist = (km) =>
  km >= 20.9 && km <= 21.6 ? 'MEIA MARATONA' : km >= 41.9 && km <= 42.8 ? 'MARATONA' : km > 42.8 ? 'ULTRAMARATONA' : '';
// parciais por km com o pace de cada um (o pedaço final só entra se for maior que 300 m)
const parcKm = (c) =>
  (c.parciais || [])
    .filter((p) => p && p.seg > 0 && (!p.parcial || p.km % 1 > 0.3))
    .slice(0, 42)
    .map((p) => ({
      v: p.seg / (p.parcial ? p.km % 1 || 1 : 1),
      rot: p.parcial ? fmtNum(p.km, 1) : String(p.km),
    }));
// altitude ao longo da corrida (vem do relógio: Garmin e arquivo); null se não tiver ou se for tudo plano
const altDe = (c) => {
  const s = c && c.analise && c.analise.serie;
  if (!s || !Array.isArray(s.alt) || !Array.isArray(s.d)) return null;
  const pts = s.alt.map((a, i) => [s.d[i], a]).filter(([d, a]) => d != null && a != null && isFinite(a) && isFinite(d));
  if (pts.length < 20) return null;
  const as = pts.map((p) => p[1]);
  return Math.max(...as) - Math.min(...as) >= 3 ? pts : null;
};
const altSuave = (pts) =>
  pts.map(([d], i) => {
    const j = pts.slice(Math.max(0, i - 3), i + 4);
    return [d, j.reduce((a, p) => a + p[1], 0) / j.length];
  });
// dois percursos são o mesmo trajeto quando quase todos os pontos de um passam a menos de 70 m do outro (nos dois sentidos)
function rotaIgual(a, b) {
  if (!a || !b || a.length < 5 || b.length < 5) return false;
  const amostra = (r, n) => {
    const p = Math.max(1, Math.floor(r.length / n));
    return r.filter((_, i) => i % p === 0);
  };
  const k = Math.cos((a[0][0] * Math.PI) / 180) * 111320;
  const perto = (p, r) =>
    r.some((q) => {
      const dx = (p[1] - q[1]) * k,
        dy = (p[0] - q[0]) * 110540;
      return dx * dx + dy * dy < 4900;
    });
  const cobre = (x, y) => {
    const s = amostra(x, 30);
    return s.filter((p) => perto(p, y)).length >= s.length * 0.9;
  };
  return cobre(a, amostra(b, 400)) && cobre(b, amostra(a, 400));
}
async function cardContexto(c) {
  const X = {};
  if (!c || !c.aluno_id || !c.data || !comDist(c)) return X;
  const dt = new Date(c.data),
    ini = inicioSemana(dt);
  ini.setHours(0, 0, 0, 0);
  const fimSem = new Date(ini.getTime() + 7 * 864e5),
    NS = 52,
    desde = new Date(ini.getTime() - (NS - 1) * 7 * 864e5);
  const diaCorr = new Date(dt.getTime() - dt.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const [hist, ses, memb, vo2] = await Promise.all([
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,parciais')
      .eq('aluno_id', c.aluno_id)
      .lt('data', fimSem.toISOString())
      .order('data', { ascending: false })
      .limit(800)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_sessoes')
      .select('iniciado_em')
      .eq('aluno_id', c.aluno_id)
      .not('finalizado_em', 'is', null)
      .gte('iniciado_em', desde.toISOString())
      .lt('iniciado_em', fimSem.toISOString())
      .then(
        (r) => r.data || [],
        () => [],
      ),
    // perfil (zonas de FC, idade e sexo para o VO2máx)
    sb
      .from('nx_membros')
      .select('corrida,nascimento,sexo')
      .eq('org_id', S.org.id)
      .eq('user_id', c.aluno_id)
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
    // VO2máx do relógio: o último valor até o dia da corrida (no máximo 30 dias antes)
    sb
      .from('nx_garmin_dia')
      .select('dia,vo2max')
      .eq('aluno_id', c.aluno_id)
      .not('vo2max', 'is', null)
      .lte('dia', diaCorr)
      .gte('dia', new Date(dt.getTime() - 30 * 864e5).toISOString().slice(0, 10))
      .order('dia', { ascending: false })
      .limit(1)
      .then(
        (r) => (r.data || [])[0] || null,
        () => null,
      ),
  ]);
  if (memb) {
    const pc = memb.corrida || {};
    X.perfil = {
      lthr: pc.lthr || null,
      fc_max: pc.fc_max || null,
      fcRep: pc.fc_rep || null,
    };
    const idade = memb.nascimento ? idadeEm(memb.nascimento, diaCorr) : null;
    if (vo2 && vo2.vo2max)
      X.vo2 = {
        v: Number(vo2.vo2max),
        dia: vo2.dia,
        classe: vo2Classe(Number(vo2.vo2max), idade, memb.sexo),
      };
  }
  // caminhada e outras atividades ficam fora do recorde, da semana de corrida e do mesmo percurso
  const corre = (h) => comDist(h) && ehCorrHist(h),
    ehCorrida = corre(c);
  const antes = hist.filter((h) => h.id !== c.id && new Date(h.data) < dt);
  // recorde: a maior distância em que esta corrida bateu o melhor tempo de antes
  const m = ehCorrida ? melhoresDaCorrida(c) : {},
    melhor = {};
  antes.filter(corre).forEach((h) =>
    Object.entries(melhoresDaCorrida(h)).forEach(([d, t]) => {
      if (melhor[d] == null || t < melhor[d]) melhor[d] = t;
    }),
  );
  const recs = DIST_REC.filter(([d]) => m[d] != null && melhor[d] != null && m[d] < melhor[d]);
  if (recs.length) {
    const [d, n] = recs[recs.length - 1];
    X.recorde = { d, n, t: m[d], antes: melhor[d] };
  }
  // a semana da corrida (segunda a domingo)
  const daSemana = hist.filter((h) => corre(h) && new Date(h.data) >= ini);
  if (ehCorrida && daSemana.length) {
    const km = Array(7).fill(0);
    let seg = 0,
      tot = 0;
    daSemana.forEach((h) => {
      km[(new Date(h.data).getDay() + 6) % 7] += h.distancia_m / 1000;
      seg += h.duracao_s || 0;
      tot += h.distancia_m / 1000;
    });
    const fim = new Date(ini.getTime() + 6 * 864e5),
      mesmoMes = fim.getMonth() === ini.getMonth();
    X.semana = {
      km,
      seg,
      total: tot,
      n: daSemana.length,
      rotulo: (mesmoMes
        ? `${ini.getDate()} a ${fim.getDate()} ${MES_CURTO[fim.getMonth()]}`
        : `${dataCurta(ini)} a ${dataCurta(fim)}`
      ).toUpperCase(),
    };
  }
  // constância: semanas seguidas com 2 treinos ou mais (corridas e força); a semana em andamento não quebra a sequência
  const cont = Array(NS).fill(0),
    semDe = (d) => {
      const x = inicioSemana(new Date(d));
      x.setHours(0, 0, 0, 0);
      return NS - 1 - Math.round((ini - x) / (7 * 864e5));
    };
  [...hist.map((h) => h.data), ...ses.map((s) => s.iniciado_em)].forEach((d) => {
    const i = semDe(d);
    if (i >= 0 && i < NS) cont[i]++;
  });
  let i = NS - 1;
  if (cont[i] < 2 && fimSem > Date.now()) i--;
  let n = 0,
    treinos = 0;
  while (i >= 0 && cont[i] >= 2) {
    n++;
    treinos += cont[i];
    i--;
  }
  if (n >= 3) X.const = { n, treinos, sem: cont.slice(-16) };
  // mesmo percurso: a corrida mais recente no mesmo trajeto em que ela foi mais devagar
  if (c.tipo !== 'esteira' && c.rota && c.rota.length > 5 && c.duracao_s) {
    const cand = antes
      .filter(
        (h) =>
          comDist(h) &&
          (h.tipo || 'corrida') === (c.tipo || 'corrida') &&
          h.duracao_s &&
          Math.abs(h.distancia_m / c.distancia_m - 1) <= 0.08,
      )
      .slice(0, 25);
    if (cand.length) {
      const { data } = await sb
        .from('nx_corridas')
        .select('id,rota')
        .in(
          'id',
          cand.map((h) => h.id),
        )
        .then(
          (r) => r,
          () => ({ data: [] }),
        );
      const rot = {};
      (data || []).forEach((r) => (rot[r.id] = r.rota));
      for (const h of cand) {
        if (!rotaIgual(c.rota, rot[h.id])) continue;
        const mesmaDist = Math.abs(h.distancia_m / c.distancia_m - 1) <= 0.03,
          ganho = mesmaDist ? h.duracao_s - c.duracao_s : paceDe(h) - paceDe(c);
        if (ganho >= (mesmaDist ? 5 : 2)) {
          X.igual = { ...h, ganho, mesmaDist };
          break;
        }
      }
    }
  }
  return X;
}
// card do treino de força: carga total (carga × repetições × séries), séries, duração e os exercícios
async function abrirCardForca(sessaoId) {
  const { data: s } = await sb
    .from('nx_sessoes')
    .select('id,aluno_id,treino_titulo,iniciado_em,finalizado_em,esforco')
    .eq('id', sessaoId)
    .maybeSingle()
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  if (!s) return toast('Não foi possível abrir o treino. Verifique a internet.', true);
  const { data: regs } = await sb
    .from('nx_registros')
    .select('treino_item_id,exercicio_nome,carga_kg,reps,reps_feitas,feito')
    .eq('sessao_id', s.id)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const ids = [...new Set((regs || []).map((r) => r.treino_item_id).filter(Boolean))];
  const { data: its } = ids.length
    ? await sb
        .from('nx_treino_itens')
        .select('id,ordem,series,series_det')
        .in('id', ids)
        .then(
          (r) => r,
          () => ({ data: [] }),
        )
    : { data: [] };
  const IT = {};
  (its || []).forEach((x) => (IT[x.id] = x));
  const repN = (r) => {
    const t = String(r || '');
    if (/\d\s*(s|seg|min)\b/i.test(t)) return null;
    const n = (t.match(/\d+/g) || []).map(Number);
    return n.length ? (n.length > 1 && /-|\ba\b/.test(t) ? (n[0] + n[1]) / 2 : n[0]) : null;
  };
  const feitos = (regs || [])
    .filter((r) => r.feito)
    .sort((a, b) => ((IT[a.treino_item_id] || {}).ordem ?? 99) - ((IT[b.treino_item_id] || {}).ordem ?? 99));
  let volume = 0,
    series = 0;
  const lista = feitos.map((r) => {
    const it = IT[r.treino_item_id] || {},
      sr = it.series || (Array.isArray(it.series_det) ? it.series_det.length : 0) || 0,
      rp = r.reps_feitas || repN(r.reps),
      kg = r.carga_kg > 0 ? +r.carga_kg : 0;
    series += sr;
    if (kg && rp) volume += kg * rp * (sr || 1);
    return {
      n: r.exercicio_nome || 'Exercício',
      sr: sr && r.reps ? `${sr} × ${r.reps}` : r.reps ? String(r.reps) : '',
      kg: kg ? `${fmtNum(kg, kg % 1 ? 1 : 0)} kg` : '',
      _kg: kg,
    };
  });
  const top = Math.max(0, ...lista.map((e) => e._kg));
  if (top) lista.find((e) => e._kg === top).top = true;
  abrirCardCorrida(
    {
      id: s.id,
      aluno_id: s.aluno_id,
      data: s.iniciado_em,
      _forca: {
        titulo: s.treino_titulo,
        volume,
        series,
        exs: feitos.length,
        min: s.finalizado_em ? minutos(s.iniciado_em, s.finalizado_em) : null,
        esforco: s.esforco,
        lista,
      },
    },
    null,
  );
}
async function abrirCardCorrida(c, plano) {
  c._serie = serieDe(c, plano);
  try {
    await Promise.all(
      ["800 100px 'Unbounded'", "400 100px 'Unbounded'", "700 40px 'Manrope'", "500 40px 'Manrope'"].map((f) =>
        document.fonts.load(f),
      ),
    );
  } catch {}
  let st = {};
  try {
    st = JSON.parse(localStorage.getItem('nx-card') || '{}');
  } catch {}
  const V = cardValores(c);
  const o = {
    layout: st.layout || 'classico',
    fundo: st.fundo || 'transparente',
    cor: st.cor || 'branco',
    formato: st.formato || 'story',
    img: null,
    stats: Object.assign(
      {
        dist: true,
        pace: true,
        tempo: true,
        fc: false,
        elev: false,
        cad: false,
        kcal: false,
        rota: true,
        data: false,
        logo: true,
      },
      st.stats || {},
    ),
  };
  if (!CARD_LAYOUTS.some(([k]) => k === o.layout)) o.layout = 'classico';
  try {
    o.local = localStorage.getItem('nx-card-loc-' + c.id) || '';
  } catch {
    o.local = '';
  }
  // dados de outras atividades para os modelos de recorde, mesmo percurso, semana e constância (no máximo 5 s de espera)
  c._x = c._forca
    ? {}
    : await Promise.race([cardContexto(c).catch(() => ({})), new Promise((res) => setTimeout(() => res({}), 5000))]);
  // corrida com recorde abre direto no card do recorde
  if (c._x.recorde) o.layout = 'recorde';
  const temParc = (c.parciais || []).length >= 2;
  const temTiros = tirosDe(c).length >= (c._serie.qual ? 1 : 2),
    temClima = !!((c.rota && c.rota.length) || (c.analise && c.analise.extras && c.analise.extras.temp_med != null));
  const modelos = c._forca
    ? [['forca', 'Treino de força']]
    : CARD_LAYOUTS.map(([k, l]) => [k, k === 'tiros' ? c._serie.titulo : k === 'nome' ? c._serie.nome : l]).filter(
        ([k]) =>
          ((k !== 'parciais' && k !== 'parciais_total') || temParc) &&
          (k !== 'tiros' || temTiros) &&
          (k !== 'nome' || !!c._serie.nome) &&
          (!k.startsWith('clima') || temClima) &&
          (!['mapa', 'sobre', 'ficha_mapa', 'lado', 'percurso', 'mesmo'].includes(k) ||
            (c.rota && c.rota.length > 1)) &&
          (k !== 'recorde' || !!c._x.recorde) &&
          (k !== 'mesmo' || !!c._x.igual) &&
          (k !== 'semana' || !!c._x.semana) &&
          (k !== 'constancia' || !!c._x.const) &&
          (k !== 'pace_km' || parcKm(c).length >= 3) &&
          (k !== 'altimetria' || !!altDe(c)) &&
          (k !== 'zonas_fc' || !!cardZonasFC(c)) &&
          (k !== 'zonas_pot' || !!cardZonasPot(c)) &&
          (k !== 'efeito' || !!cardTE(c)) &&
          (k !== 'vo2' || !!c._x.vo2) &&
          (k !== 'gigante' || !!V.dist),
      );
  if (!modelos.some(([k]) => k === o.layout))
    o.layout = modelos.some(([k]) => k === 'classico') ? 'classico' : modelos[0][0];
  const seg = (k, ops, val) =>
    `<div class="seg card-seg" data-o="${k}">${ops.map(([v, l]) => `<button type="button" data-v="${v}" class="${val === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const disponivel0 = (k) =>
    c._forca ? k === 'logo' : k === 'rota' ? c.rota && c.rota.length > 1 : k === 'data' || k === 'logo' ? true : !!V[k];
  openSheet(
    `<p class="eyebrow">Compartilhar</p><div class="h2" style="margin-top:4px">${c._forca ? 'Card do treino' : 'Card da corrida'}</div>
    <div class="card-prev ${o.fundo === 'transparente' ? 'xadrez' : ''}" id="cd-prev"><canvas id="cd-cv"></canvas></div>
    <div class="cd-zoom"><button type="button" class="icon-btn sm" data-z="-1" aria-label="Diminuir">−</button><span class="tiny dim">Pince com 2 dedos para aumentar ou diminuir e arraste para mover</span><button type="button" class="icon-btn sm" data-z="1" aria-label="Aumentar">+</button><button type="button" class="link-btn tiny" id="cd-reset">Centralizar</button></div>
    <div class="field"><span>Fundo</span>${seg(
      'fundo',
      [
        ['transparente', 'Sem fundo'],
        ['foto', 'Foto'],
        ['nexos', 'Azul Nexos'],
      ],
      o.fundo,
    )}</div>
    <input type="file" accept="image/*" id="cd-foto" hidden>
    <div class="field"><span>Modelo</span><div class="card-gal" id="cd-gal">${modelos.map(([k, l]) => `<button type="button" class="cg-it ${k === o.layout ? 'on' : ''}" data-lay="${k}"><span class="cg-cv"><canvas></canvas></span><small>${l}</small></button>`).join('')}</div></div>
    <div class="grid2"><div class="field"><span>Formato</span>${seg(
      'formato',
      [
        ['story', 'Story'],
        ['post', 'Post'],
      ],
      o.formato,
    )}</div><div class="field"><span>Cor do texto</span>${seg(
      'cor',
      [
        ['branco', 'Branco'],
        ['preto', 'Preto'],
      ],
      o.cor,
    )}</div></div>
    <div class="field"><span>O que aparece</span><div class="chips wrap" id="cd-stats">${CARD_STATS.filter(([k]) =>
      disponivel0(k),
    )
      .map(
        ([k, l]) =>
          `<label class="chipc"><input type="checkbox" value="${k}" ${o.stats[k] ? 'checked' : ''}><span>${l}</span></label>`,
      )
      .join('')}</div></div>
    <div class="field"><span>Localização</span><div id="cd-loc"></div></div>
    <div class="row" style="gap:8px;margin-top:6px"><button class="btn grow" id="cd-share"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg> Compartilhar</button></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost grow" id="cd-copy"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg> Copiar</button><button class="btn ghost grow" id="cd-down">Baixar</button></div>
    <div class="cd-partes" id="cd-partes" hidden><span class="tiny dim">Copiar em duas figurinhas, para mover e aumentar cada uma no story:</span><div class="row" style="gap:8px;margin-top:6px"><button class="btn ghost grow sm" data-parte="cima">Copiar as parciais</button><button class="btn ghost grow sm" data-parte="baixo">Copiar o total</button></div></div>
    <p class="tiny dim" style="margin-top:8px" id="cd-dica"></p>`,
    (r) => {
      const cv = r.querySelector('#cd-cv'),
        prev = r.querySelector('#cd-prev'),
        inp = r.querySelector('#cd-foto'),
        dica = r.querySelector('#cd-dica');
      const salvar = () => {
        try {
          localStorage.setItem(
            'nx-card',
            JSON.stringify({
              layout: c._forca ? st.layout : o.layout,
              fundo: o.fundo === 'foto' ? 'transparente' : o.fundo,
              cor: o.cor,
              formato: o.formato,
              stats: o.stats,
            }),
          );
        } catch {}
      };
      const pinta = async () => {
        r.querySelector('#cd-partes').hidden = !(o.layout === 'parciais_total' && o.fundo === 'transparente');
        prev.classList.toggle('xadrez', o.fundo === 'transparente');
        prev.classList.toggle('post', o.formato === 'post');
        dica.textContent =
          o.layout === 'parciais_total'
            ? 'As parciais e o total mexem separados: toque em uma parte e arraste, ou pince com dois dedos para aumentar só ela.'
            : o.fundo === 'transparente'
              ? 'Sem fundo: toque em “Copiar” e cole no story do Instagram por cima da sua foto. Dá para voltar, trocar o modelo e copiar outro para colar junto.'
              : o.fundo === 'foto' && !o.img
                ? 'Toque em “Foto” para escolher a imagem de fundo.'
                : '';
        await desenharCard(cv, c, o);
        miniaturas();
      };
      // miniaturas dos modelos com os dados reais da corrida
      let mT = null;
      const miniaturas = () => {
        clearTimeout(mT);
        mT = setTimeout(async () => {
          const gal = r.querySelector('#cd-gal');
          if (!gal) return;
          gal.classList.toggle('xadrez', o.fundo === 'transparente');
          gal.classList.toggle('post', o.formato === 'post');
          const tmp = document.createElement('canvas');
          for (const b of gal.querySelectorAll('[data-lay]')) {
            await desenharCard(tmp, c, { ...o, layout: b.dataset.lay, zoom: 1, dx: 0, dy: 0, pc: null, pb: null });
            const mc = b.querySelector('canvas');
            mc.width = 216;
            mc.height = Math.round((216 * tmp.height) / tmp.width);
            const mx = mc.getContext('2d');
            mx.clearRect(0, 0, mc.width, mc.height);
            mx.drawImage(tmp, 0, 0, mc.width, mc.height);
          }
        }, 60);
      };
      r.querySelector('#cd-gal').onclick = (e) => {
        const b = e.target.closest('[data-lay]');
        if (!b) return;
        o.layout = b.dataset.lay;
        r.querySelectorAll('#cd-gal [data-lay]').forEach((x) => x.classList.toggle('on', x === b));
        r.querySelector('#cd-partes').hidden = !(o.layout === 'parciais_total' && o.fundo === 'transparente');
        salvar();
        pinta();
      };
      r.querySelectorAll('.card-seg').forEach(
        (sg) =>
          (sg.onclick = (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            const k = sg.dataset.o;
            if (k === 'fundo' && b.dataset.v === 'foto') {
              inp.click();
              if (!o.img) return;
            }
            o[k] = b.dataset.v;
            if (k === 'fundo' && o.fundo === 'foto') o.cor = 'branco';
            if (k === 'fundo' && o.fundo === 'nexos') o.cor = 'branco';
            r.querySelectorAll('.card-seg').forEach((x) =>
              x.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y.dataset.v === o[x.dataset.o])),
            );
            salvar();
            pinta();
          }),
      );
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        cardCarregarImg(url).then((im) => {
          if (!im) return toast('Não foi possível abrir a foto.', true);
          o.img = im;
          o.fundo = 'foto';
          o.cor = 'branco';
          r.querySelectorAll('.card-seg').forEach((x) =>
            x.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y.dataset.v === o[x.dataset.o])),
          );
          pinta();
        });
      };
      // mexer no card com os dedos
      o.zoom = 1;
      o.dx = 0;
      o.dy = 0;
      let quadro = 0;
      const redesenha = () => {
        if (quadro) return;
        quadro = requestAnimationFrame(async () => {
          quadro = 0;
          await desenharCard(cv, c, o);
        });
      };
      // no modelo Parciais + total, o dedo mexe só na parte que tocou (parciais ou total); nos outros, no card todo
      o.pc = { z: 1, dx: 0, dy: 0 };
      o.pb = { z: 1, dx: 0, dy: 0 };
      let alvo = null;
      const doisPartes = () => o.layout === 'parciais_total';
      const T = () => (doisPartes() ? o[alvo || 'pc'] : null);
      const getT = () => {
        const t = T();
        return t ? { z: t.z, dx: t.dx, dy: t.dy } : { z: o.zoom, dx: o.dx, dy: o.dy };
      };
      const setT = (z, dx, dy) => {
        const t = T();
        const lim = 700;
        z = Math.min(t ? 2.4 : 1.8, Math.max(0.35, z));
        dx = Math.max(-lim, Math.min(lim, dx));
        dy = Math.max(-lim * 1.4, Math.min(lim * 1.4, dy));
        if (t) Object.assign(t, { z, dx, dy });
        else Object.assign(o, { zoom: z, dx, dy });
      };
      const escolheAlvo = (clientY) => {
        if (!doisPartes() || !o._cy) return;
        const rc = cv.getBoundingClientRect(),
          y = ((clientY - rc.top) / rc.height) * (o.formato === 'post' ? 1350 : 1920);
        alvo = Math.abs(y - o._cy.pc) <= Math.abs(y - o._cy.pb) ? 'pc' : 'pb';
      };
      const limita = () => {
        const t = getT();
        setT(t.z, t.dx, t.dy);
      };
      const escala = () => cv.width / cv.getBoundingClientRect().width;
      const toques = new Map();
      let ini = null;
      cv.style.touchAction = 'none';
      const estado = () => {
        const p = [...toques.values()];
        if (p.length >= 2) {
          const [a, b] = p;
          return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        }
        return p.length ? { d: 0, cx: p[0].x, cy: p[0].y } : null;
      };
      cv.addEventListener('pointerdown', (e) => {
        cv.setPointerCapture(e.pointerId);
        if (!toques.size) escolheAlvo(e.clientY);
        toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
        ini = { ...estado(), ...getT() };
      });
      cv.addEventListener('pointermove', (e) => {
        if (!toques.has(e.pointerId) || !ini) return;
        toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const agora = estado(),
          k = escala();
        setT(
          agora.d && ini.d ? ini.z * (agora.d / ini.d) : getT().z,
          ini.dx + (agora.cx - ini.cx) * k,
          ini.dy + (agora.cy - ini.cy) * k,
        );
        redesenha();
      });
      const solta = (e) => {
        toques.delete(e.pointerId);
        const st0 = estado();
        ini = st0 ? { ...st0, ...getT() } : null;
      };
      cv.addEventListener('pointerup', solta);
      cv.addEventListener('pointercancel', solta);
      cv.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          escolheAlvo(e.clientY);
          const t = getT();
          setT(t.z * (e.deltaY < 0 ? 1.06 : 1 / 1.06), t.dx, t.dy);
          redesenha();
        },
        { passive: false },
      );
      r.querySelectorAll('[data-z]').forEach(
        (b) =>
          (b.onclick = () => {
            const t = getT();
            setT(t.z * (Number(b.dataset.z) > 0 ? 1.12 : 1 / 1.12), t.dx, t.dy);
            redesenha();
          }),
      );
      r.querySelector('#cd-reset').onclick = () => {
        o.zoom = 1;
        o.dx = 0;
        o.dy = 0;
        o.pc = { z: 1, dx: 0, dy: 0 };
        o.pb = { z: 1, dx: 0, dy: 0 };
        redesenha();
      };
      // localização: só aparece se o atleta escolher
      const locBox = r.querySelector('#cd-loc');
      const recentes = () => {
        try {
          return JSON.parse(localStorage.getItem('nx-card-locs') || '[]');
        } catch {
          return [];
        }
      };
      const usarLoc = (t) => {
        o.local = String(t || '')
          .trim()
          .slice(0, 60);
        try {
          o.local
            ? localStorage.setItem('nx-card-loc-' + c.id, o.local)
            : localStorage.removeItem('nx-card-loc-' + c.id);
          if (o.local)
            localStorage.setItem(
              'nx-card-locs',
              JSON.stringify([o.local, ...recentes().filter((x) => x !== o.local)].slice(0, 5)),
            );
        } catch {}
        locUI();
        pinta();
      };
      const PIN =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path fill-rule="evenodd" d="M12 23s-7.5-6.9-7.5-12.6a7.5 7.5 0 0 1 15 0C19.5 16.1 12 23 12 23zm0-9.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/></svg>';
      const locUI = (aberto) => {
        if (o.local && !aberto) {
          locBox.innerHTML = `<div class="loc-on">${PIN}<b class="grow ellip">${esc(o.local)}</b><button type="button" class="link-btn small" data-l="trocar">Trocar</button><button type="button" class="icon-btn sm" data-l="tirar" aria-label="Tirar a localização">✕</button></div>`;
          return;
        }
        if (!aberto) {
          locBox.innerHTML = `<button type="button" class="btn ghost sm" data-l="abrir">${PIN} Adicionar localização</button>`;
          return;
        }
        const rec = recentes();
        locBox.innerHTML = `<div class="loc-box"><form class="row" style="gap:8px" id="loc-f"><input class="input grow" id="loc-q" placeholder="Ex.: Lagoa da Jansen, São Luís" value="${esc(o.local || '')}" autocomplete="off"><button class="btn sm" type="submit">Buscar</button></form>
        <div class="chips wrap" style="margin-top:10px"><button type="button" class="chip" data-l="aqui">${PIN} Onde estou agora</button>${c.rota && c.rota.length && c.fonte !== 'garmin' ? `<button type="button" class="chip" data-l="corrida">${PIN} Onde foi a corrida</button>` : ''}${rec.map((x) => `<button type="button" class="chip" data-usar="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div id="loc-res" class="loc-res"></div>
        <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="link-btn small" data-l="escrito">Usar do jeito que escrevi</button><span class="grow"></span><button type="button" class="link-btn small" data-l="fechar">Cancelar</button></div>
        <p class="tiny dim" style="margin-top:6px">A busca usa o OpenStreetMap e só acontece quando você toca em Buscar.</p></div>`;
        const q = locBox.querySelector('#loc-q');
        setTimeout(() => q.focus(), 50);
        locBox.querySelector('#loc-f').onsubmit = async (e) => {
          e.preventDefault();
          const t = q.value.trim();
          if (t.length < 3) return toast('Digite pelo menos 3 letras.', true);
          const res = locBox.querySelector('#loc-res');
          res.innerHTML = '<p class="small muted">Buscando…</p>';
          try {
            const l = await locBuscar(t);
            res.innerHTML = l.length
              ? l
                  .map(
                    (x) =>
                      `<button type="button" class="loc-it" data-usar="${esc(x)}">${PIN}<span>${esc(x)}</span></button>`,
                  )
                  .join('')
              : '<p class="small muted">Nada encontrado. Você pode usar do jeito que escreveu.</p>';
          } catch {
            res.innerHTML =
              '<p class="small muted">Não foi possível buscar agora. Você pode usar do jeito que escreveu.</p>';
          }
        };
      };
      locBox.onclick = async (e) => {
        const u = e.target.closest('[data-usar]');
        if (u) return usarLoc(u.dataset.usar);
        const b = e.target.closest('[data-l]');
        if (!b) return;
        const a = b.dataset.l;
        if (a === 'abrir' || a === 'trocar') return locUI(true);
        if (a === 'fechar') return locUI(false);
        if (a === 'tirar') return usarLoc('');
        if (a === 'escrito') {
          const t = locBox.querySelector('#loc-q').value.trim();
          return t ? usarLoc(t) : toast('Escreva o nome do lugar.', true);
        }
        if (a === 'corrida') {
          b.disabled = true;
          try {
            usarLoc(await locReversa(c.rota[0][0], c.rota[0][1]));
          } catch {
            b.disabled = false;
            toast('Não foi possível achar o lugar agora.', true);
          }
          return;
        }
        if (a === 'aqui') {
          if (!navigator.geolocation) return toast('Este aparelho não tem localização disponível.', true);
          b.disabled = true;
          b.lastChild.textContent = ' Procurando…';
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                usarLoc(await locReversa(pos.coords.latitude.toFixed(5), pos.coords.longitude.toFixed(5)));
              } catch {
                b.disabled = false;
                toast('Não foi possível achar o lugar agora.', true);
              }
            },
            () => {
              b.disabled = false;
              b.lastChild.textContent = ' Onde estou agora';
              toast('Permita a localização para usar onde você está.', true);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
          );
        }
      };
      locUI(false);
      r.querySelector('#cd-stats').onchange = (e) => {
        o.stats[e.target.value] = e.target.checked;
        salvar();
        pinta();
      };
      // a imagem salva sai em alta definição (2160 × 3840 no story), mesmo a prévia sendo menor
      const blob = async () => {
        const hd = document.createElement('canvas');
        await desenharCard(hd, c, { ...o, escala: 2 });
        return await new Promise((res) => hd.toBlob(res, 'image/png'));
      };
      const nomeArq = `nexos-${c._forca ? 'treino' : 'corrida'}-${isoDia(c.data)}.png`;
      const marcar = () => {
        try {
          localStorage.setItem('nx-card-' + c.id, '1');
        } catch {}
      };
      // enquanto a imagem é preparada, o botão mostra que está trabalhando (leva alguns segundos em alta definição)
      const ocupado = async (bt, txt, fn) => {
        if (!bt || bt.dataset.ocupado) return;
        bt.dataset.ocupado = '1';
        const antes = bt.innerHTML;
        bt.disabled = true;
        bt.classList.add('carregando');
        bt.innerHTML = `<span class="btn-spin" aria-hidden="true"></span>${txt}`;
        try {
          await fn();
        } finally {
          bt.innerHTML = antes;
          bt.disabled = false;
          bt.classList.remove('carregando');
          delete bt.dataset.ocupado;
        }
      };
      r.querySelector('#cd-down').onclick = (e) => ocupado(e.currentTarget, 'Baixando…', baixar);
      const baixar = async () => {
        const b = await blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = nomeArq;
        document.body.append(a);
        a.click();
        a.remove();
        marcar();
        toast('Imagem salva!');
      };
      // copiar para colar como figurinha no story (sem fundo: corta o espaço vazio em volta)
      const blobCopia = async (parte) => {
        const hd = document.createElement('canvas');
        // a parte copiada sai inteira e no tamanho original (no story ela é ajustada com os dedos)
        await desenharCard(hd, c, {
          ...o,
          escala: 2,
          parte: parte || null,
          ...(parte ? { pc: null, pb: null, zoom: 1, dx: 0, dy: 0 } : {}),
        });
        let saida = hd;
        if (o.fundo === 'transparente') {
          const W = hd.width,
            H = hd.height,
            px = hd.getContext('2d').getImageData(0, 0, W, H).data;
          let x0 = W,
            y0 = H,
            x1 = -1,
            y1 = -1;
          for (let y = 0; y < H; y += 2)
            for (let x = 0; x < W; x += 2)
              if (px[(y * W + x) * 4 + 3] > 8) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
              }
          if (x1 > x0 && y1 > y0) {
            const m = 40;
            x0 = Math.max(0, x0 - m);
            y0 = Math.max(0, y0 - m);
            x1 = Math.min(W, x1 + m);
            y1 = Math.min(H, y1 + m);
            saida = document.createElement('canvas');
            saida.width = x1 - x0;
            saida.height = y1 - y0;
            saida.getContext('2d').drawImage(hd, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
          }
        }
        return await new Promise((res) => saida.toBlob(res, 'image/png'));
      };
      r.querySelector('#cd-copy').onclick = (ev) => {
        if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem))
          return toast('Este celular não deixa copiar imagem. Use “Compartilhar” ou “Baixar”.', true);
        ocupado(ev.currentTarget, 'Copiando…', async () => {
          try {
            // o ClipboardItem precisa nascer na hora do toque (exigência do iPhone); a imagem fica pronta logo depois
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobCopia() })]);
            marcar();
            toast(
              'Card copiado! No story do Instagram, toque na tela e escolha “Colar”. Depois volte aqui para copiar outro.',
            );
          } catch (e) {
            toast('Não foi possível copiar. Use “Compartilhar” ou “Baixar”.', true);
          }
        });
      };
      r.querySelectorAll('[data-parte]').forEach(
        (bt) =>
          (bt.onclick = () => {
            if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem))
              return toast('Este celular não deixa copiar imagem. Use “Compartilhar” ou “Baixar”.', true);
            ocupado(bt, 'Copiando…', async () => {
              try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobCopia(bt.dataset.parte) })]);
                marcar();
                toast(
                  bt.dataset.parte === 'cima'
                    ? 'Parciais copiadas! Cole no story, ajuste com dois dedos e volte para copiar o total.'
                    : 'Total copiado! Cole no story e ajuste com dois dedos.',
                );
              } catch (e) {
                toast('Não foi possível copiar. Use “Compartilhar” ou “Baixar”.', true);
              }
            });
          }),
      );
      r.querySelector('#cd-share').onclick = (ev) =>
        ocupado(ev.currentTarget, 'Preparando…', async () => {
          const b = await blob();
          const file = new File([b], nomeArq, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file] });
              marcar();
            } catch (e) {
              if (e.name !== 'AbortError') toast('Não foi possível compartilhar. Use “Baixar”.', true);
            }
          } else await baixar();
        });
      if (temClima)
        climaDe(c).then((cl) => {
          o.clima = cl;
          pinta();
        });
      pinta();
    },
  );
}

/* ---------- análise completa da corrida (gráficos, voltas, zonas de FC, números do relógio) ---------- */
const GR_CORES = {
  pace: '#2f6bff',
  fc: '#ff4d6d',
  cad: '#8b5cf6',
  alt: '#7f8ea8',
  pot: '#f59e0b',
  temp: '#f97316',
  gct: '#0ea5a4',
  osc: '#14b8a6',
  passo: '#6366f1',
  bal: '#a855f7',
  resp: '#0891b2',
};
const ZONAS_FC = [
  ['Z1', 'Recuperação', 0, 0.6, '#9aa8c0'],
  ['Z2', 'Leve', 0.6, 0.7, '#3ddc97'],
  ['Z3', 'Moderado', 0.7, 0.8, '#46d6ff'],
  ['Z4', 'Limiar', 0.8, 0.9, '#ffcf5c'],
  ['Z5', 'Máximo', 0.9, 9, '#ff6b6b'],
];
const paceTxt = (v) => (v && v > 0.5 ? fmtPace(1000 / v).replace('/km', '') : '–');
function analiseCorridaHTML(c, fcMax, fcMaxFonte, paces, zonasAluno) {
  const A = c.analise || {},
    S = A.serie || {},
    E = { ...(c.resumo_rel || {}), ...(A.extras || {}) };
  const blocos = [];
  // ---- gráficos (arrastar o dedo mostra os valores do ponto) ----
  const n = (S.t || []).length;
  if (n > 5) {
    const porDist = (S.d[n - 1] || 0) > 300;
    const X = porDist ? S.d.map((d) => d / 1000) : S.t.map((t) => t / 60);
    const series = [
      ['pace', 'Pace', S.vel, (v) => paceTxt(v), '/km'],
      ['fc', 'Frequência cardíaca', S.fc, (v) => (v ? Math.round(v) : '–'), 'bpm'],
      ['cad', 'Cadência', S.cad, (v) => (v ? Math.round(v) : '–'), 'ppm'],
      ['alt', 'Altitude', S.alt, (v) => (v != null ? Math.round(v) : '–'), 'm'],
      ['pot', 'Potência', S.pot, (v) => (v ? Math.round(v) : '–'), 'W'],
      ['temp', 'Temperatura', S.temp, (v) => (v != null ? f1(v) : '–'), '°C'],
      ['gct', 'Tempo de contato com o solo', S.gct, (v) => (v ? Math.round(v) : '–'), 'ms'],
      ['osc', 'Oscilação vertical', S.osc, (v) => (v ? f1(v) : '–'), 'cm'],
      ['passo', 'Comprimento da passada', S.passo, (v) => (v ? f1(v, 2) : '–'), 'm'],
      ['bal', 'Equilíbrio de contato (esquerda)', S.bal, (v) => (v ? f1(v) : '–'), '%'],
      ['resp', 'Respiração', S.resp, (v) => (v ? Math.round(v) : '–'), 'rpm'],
    ].filter(([, , y]) => y && y.filter((v) => v != null).length > 3);
    const W = 600,
      H = 110;
    const graf = ([k, nome, Y, fmt, un]) => {
      let ys = Y.map((v) => (v == null ? null : k === 'pace' ? (v > 0.8 ? Math.min(v, 7) : null) : v));
      const val = ys.filter((v) => v != null);
      if (!val.length) return '';
      let lo = Math.min(...val),
        hi = Math.max(...val);
      if (k === 'pace') {
        const s = val.slice().sort((a, b) => a - b);
        lo = s[Math.floor(s.length * 0.03)];
        hi = s[Math.ceil(s.length * 0.99) - 1];
      }
      if (hi - lo < 1e-6) {
        hi += 1;
        lo -= 1;
      }
      const pad = (hi - lo) * 0.12;
      lo -= pad;
      hi += pad;
      const x0 = X[0],
        x1 = X[n - 1] || 1;
      const px = (i) => ((X[i] - x0) / (x1 - x0 || 1)) * W,
        py = (v) => H - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * H;
      let d = '',
        abre = false;
      ys.forEach((v, i) => {
        if (v == null) {
          abre = false;
          return;
        }
        d += `${abre ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`;
        abre = true;
      });
      const area =
        k === 'alt'
          ? `<path d="${d}L${px(n - 1).toFixed(1)},${H}L${px(0).toFixed(1)},${H}Z" fill="${GR_CORES[k]}" opacity=".18"/>`
          : '';
      const medV = val.reduce((a, b) => a + b, 0) / val.length;
      const resumoTxt =
        k === 'pace'
          ? `média ${paceTxt((c.distancia_m || 0) / (c.duracao_s || 1))} · melhor ${paceTxt(Math.max(...val))}`
          : k === 'alt'
            ? `${Math.round(Math.min(...val))}–${Math.round(Math.max(...val))} m`
            : `média ${fmt(medV)} · máx ${fmt(Math.max(...val))}`;
      return `<div class="gr" data-k="${k}"><div class="gr-h"><b style="color:${GR_CORES[k]}">${nome}</b><span class="gr-v" data-v="${k}">${resumoTxt}</span></div>
        <div class="gr-area"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${area}<path d="${d}" fill="none" stroke="${GR_CORES[k]}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><i class="gr-cur" hidden></i></div></div>`;
    };
    const graficos = series.map(graf).join('');
    if (graficos)
      blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Gráficos</h2>${slashes}</div><div class="card graficos" id="graficos" data-pordist="${porDist ? 1 : 0}">
      <div class="gr-leitura" id="gr-leitura">Arraste o dedo sobre os gráficos para ver cada ponto</div>${graficos}
      <div class="gr-eixo"><span>0</span><span>${porDist ? f1(X[n - 1], 1) + ' km' : Math.round(X[n - 1]) + ' min'}</span></div></div></div>`);
  }
  // ---- pace e FC no mesmo gráfico (deriva cardíaca e onde o ritmo caiu) ----
  if (n > 20 && S.vel && S.fc && S.fc.filter((v) => v).length > 10) {
    const W = 600,
      H = 150,
      porDist = (S.d[n - 1] || 0) > 300,
      X = porDist ? S.d : S.t,
      x0 = X[0],
      x1 = X[n - 1] || 1;
    const pv = S.vel.map((v) => (v > 0.8 ? 1000 / v : null)),
      pvv = pv.filter((v) => v).sort((a, b) => a - b);
    const pLo = pvv[Math.floor(pvv.length * 0.03)],
      pHi = pvv[Math.ceil(pvv.length * 0.97) - 1];
    const fv = S.fc.filter((v) => v),
      fLo = Math.min(...fv) - 3,
      fHi = Math.max(...fv) + 3;
    const px = (i) => (((X[i] - x0) / (x1 - x0 || 1)) * W).toFixed(1);
    const linha = (ys, lo, hi, inv) => {
      let d = '',
        ab = false;
      ys.forEach((v, i) => {
        if (v == null) {
          ab = false;
          return;
        }
        const k = (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo || 1);
        d += `${ab ? 'L' : 'M'}${px(i)},${(inv ? k * H : H - k * H).toFixed(1)}`;
        ab = true;
      });
      return d;
    };
    if (pLo && pHi && pHi > pLo)
      blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Pace e frequência juntos</h2>${slashes}</div><div class="card pfc">
      <div class="pfc-leg"><span><i style="background:${GR_CORES.pace}"></i>Pace (para cima = mais rápido)</span><span><i style="background:${GR_CORES.fc}"></i>Frequência cardíaca</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="pfc-svg"><path d="${linha(pv, pLo, pHi, true)}" fill="none" stroke="${GR_CORES.pace}" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="${linha(S.fc, fLo, fHi, false)}" fill="none" stroke="${GR_CORES.fc}" stroke-width="2" vector-effect="non-scaling-stroke" opacity=".85"/></svg>
      <div class="gr-eixo"><span>0</span><span>${porDist ? f1(S.d[n - 1] / 1000, 1) + ' km' : Math.round(S.t[n - 1] / 60) + ' min'}</span></div>
      <p class="tiny dim" style="margin-top:6px">Quando a linha vermelha sobe e a azul não acompanha, o coração está trabalhando mais para o mesmo ritmo.</p></div></div>`);
  }
  // ---- tempo em cada zona de pace (as zonas do aluno) ----
  if (paces && S.vel && n > 10) {
    const ZP = [
      ['rec', 'Z1'],
      ['leve', 'Z2'],
      ['maratona', 'Z3'],
      ['limiar', 'Z4'],
      ['intervalado', 'Z5'],
      ['tiros', 'Z6'],
    ];
    const tz = {};
    let tot = 0;
    for (let i = 1; i < n; i++) {
      const v = S.vel[i],
        dt = S.t[i] - S.t[i - 1];
      if (!(v > 0.8) || !(dt > 0) || dt > 120) continue;
      const z = zonaDoPace(1000 / v, { paces }) || 'rec';
      tz[z] = (tz[z] || 0) + dt;
      tot += dt;
    }
    if (tot > 120)
      blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Zonas de pace</h2>${slashes}</div><div class="card zonas-fc">
      ${ZP.filter(([k]) => paces[k] || k === 'rec')
        .map(([k, z]) => {
          const pc = ((tz[k] || 0) / tot) * 100;
          const inf = ZONAS_INFO[k];
          return `<div class="zf"><span class="zf-n"><b>${z}</b> ${inf.d}<em>${paces[k] ? faixaPace(paces[k]) : 'mais lento'}</em></span><div class="zf-bar"><i style="width:${Math.max(pc, pc ? 2 : 0).toFixed(1)}%;background:${inf.c}"></i></div><span class="zf-t">${fmtDur(tz[k] || 0)}<em>${Math.round(pc)}%</em></span></div>`;
        })
        .join('')}
      <p class="tiny dim" style="margin-top:8px">Tempo em movimento em cada zona de pace do perfil de corrida.</p></div></div>`);
  }
  // ---- zonas de FC ----
  if (S.fc && S.fc.filter((v) => v).length > 5) {
    const fm = fcMax || c.fc_max;
    // mesmas zonas do perfil do aluno (FC de limiar, reserva ou % da máxima); sem perfil, % da máxima
    const zs = zonasAluno || (fm ? zonasFC(fm) : null);
    const tz = ZONAS_FC.map(() => 0);
    for (let i = 1; zs && i < n; i++) {
      const v = S.fc[i];
      const dt = S.t[i] - S.t[i - 1];
      if (!v || !(dt > 0) || dt > 120) continue;
      tz[zonaFCIdx(zs, v)] += dt;
    }
    const tot = tz.reduce((a, b) => a + b, 0);
    if (tot > 0 && zs)
      blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Zonas de frequência cardíaca</h2>${slashes}</div><div class="card zonas-fc">
      ${ZONAS_FC.map(([z, nm, , , cor], i) => {
        const pc = (tz[i] / tot) * 100;
        return `<div class="zf"><span class="zf-n"><b>${z}</b> ${nm}<em>${i === 0 ? 'até ' + (zs[1].de - 1) : i === 4 ? zs[4].de + '+' : zs[i].de + '–' + (zs[i + 1].de - 1)} bpm</em></span><div class="zf-bar"><i style="width:${Math.max(pc, pc ? 2 : 0).toFixed(1)}%;background:${cor}"></i></div><span class="zf-t">${fmtDur(tz[i])}<em>${Math.round(pc)}%</em></span></div>`;
      }).join('')}
      <p class="tiny dim" style="margin-top:8px">${zonasAluno && zonasAluno.base ? zonasAluno.base : `FC máxima usada: ${Math.round(fm)} bpm (${fcMaxFonte || 'a maior da corrida'})`}. As mesmas zonas do perfil de corrida.</p></div></div>`);
  }
  // ---- voltas ----
  const V = A.voltas || [];
  if (V.length > 1) {
    const pv = V.map((v) => (v.d > 0 ? v.seg / (v.d / 1000) : null));
    const ok = pv.filter((x) => x);
    const pMin = Math.min(...ok),
      pMax = Math.max(...ok);
    const temPot = V.some((v) => v.pot);
    blocos.push(`<div class="section"><div class="section-h"><h2 class="h2">Voltas</h2><span class="small muted">${V.length} voltas</span></div><div class="card voltas-c"><div class="voltas-t${temPot ? ' pot' : ''}">
      <div class="vt-h"><span>#</span><span>Dist.</span><span>Tempo</span><span>Pace</span><span>FC</span><span>Máx</span><span>Cad.</span>${temPot ? '<span>Pot.</span>' : ''}</div>
      ${V.map((v, i) => {
        const p = pv[i];
        const w = p && pMax > pMin ? 25 + (75 * (pMax - p)) / (pMax - pMin) : 60;
        return `<div class="vt-l"><span>${i + 1}</span><span>${v.d >= 1000 ? f1(v.d / 1000, 2) + ' km' : Math.round(v.d) + ' m'}</span><span>${fmtDur(v.seg)}</span><span class="vt-p"><i style="width:${w.toFixed(0)}%"></i><b>${p ? fmtPace(p).replace('/km', '') : '–'}</b></span><span>${v.fc || '–'}</span><span>${v.fcmax || '–'}</span><span>${v.cad || '–'}</span>${temPot ? `<span>${v.pot || '–'}</span>` : ''}</div>`;
      }).join('')}
    </div></div></div>`);
  }
  // ---- metades da corrida (split e deriva cardíaca) ----
  if (n > 20 && S.d[n - 1] > 1500) {
    const meio = S.d[n - 1] / 2;
    const im = S.d.findIndex((d) => d >= meio);
    const p1 = S.t[im] / (S.d[im] / 1000),
      p2 = (S.t[n - 1] - S.t[im]) / ((S.d[n - 1] - S.d[im]) / 1000);
    const fcM = (a, b) => {
      const v = (S.fc || []).slice(a, b).filter((x) => x);
      return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
    };
    const f1a = fcM(0, im),
      f2a = fcM(im, n);
    const dif = Math.round(p2 - p1);
    const linhas = [
      [`1ª metade`, `${fmtPace(p1)}${f1a ? ' · ' + Math.round(f1a) + ' bpm' : ''}`],
      [`2ª metade`, `${fmtPace(p2)}${f2a ? ' · ' + Math.round(f2a) + ' bpm' : ''}`],
      [
        'Divisão',
        dif === 0
          ? 'igual nas duas metades'
          : dif < 0
            ? `negativa (2ª metade ${-dif} s/km mais rápida)`
            : `positiva (2ª metade ${dif} s/km mais lenta)`,
      ],
    ];
    if (f1a && f2a) {
      const ef1 = 1000 / p1 / f1a,
        ef2 = 1000 / p2 / f2a;
      const dec = ((ef1 - ef2) / ef1) * 100;
      linhas.push([
        'Desacoplamento (pace × FC)',
        `${f1(dec, 1)}%${Math.abs(dec) < 5 ? ' · estável' : ' · a FC subiu em relação ao pace'}`,
      ]);
    }
    blocos.push(
      `<div class="section"><div class="section-h"><h2 class="h2">Metades da corrida</h2>${slashes}</div><div class="card kv">${linhas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div></div>`,
    );
  }
  // ---- todos os números do relógio ----
  const velMax = E.vel_max_rel || E.vel_max;
  const num = [
    ['Tempo em movimento', E.mov_s && Math.abs(E.mov_s - c.duracao_s) > 20 ? fmtDurLongo(E.mov_s) : null],
    ['Tempo total (com pausas)', E.total_s && E.total_s - c.duracao_s > 20 ? fmtDurLongo(E.total_s) : null],
    ['Melhor pace', E.vel_max ? paceTxt(E.vel_max) + '/km' : null],
    ['Velocidade máxima', velMax ? f1(velMax * 3.6) + ' km/h' : null],
    ['FC mínima', E.fc_min ? E.fc_min + ' bpm' : null],
    ['Cadência máxima', E.cad_max || E.cad_max_rel ? (E.cad_max || E.cad_max_rel) + ' ppm' : null],
    ['Descida', (E.desc ?? E.desc_rel) ? Math.round(E.desc ?? E.desc_rel) + ' m' : null],
    [
      'Altitude',
      E.alt_min != null && E.alt_max != null ? `${Math.round(E.alt_min)} a ${Math.round(E.alt_max)} m` : null,
    ],
    ['Potência média', E.pot_med || E.pot_med_rel ? (E.pot_med || E.pot_med_rel) + ' W' : null],
    ['Potência máxima', E.pot_max || E.pot_max_rel ? (E.pot_max || E.pot_max_rel) + ' W' : null],
    [
      'Temperatura',
      E.temp_med != null
        ? `${f1(E.temp_med)} °C${E.temp_min != null && E.temp_max !== E.temp_min ? ` (${f1(E.temp_min)} a ${f1(E.temp_max)})` : ''}`
        : null,
    ],
    ['Calorias', E.kcal ? Math.round(E.kcal) + ' kcal' : null],
    ['Passos', E.passos ? Math.round(E.passos).toLocaleString('pt-BR') : null],
    ['Comprimento da passada', E.passada_m ? f1(E.passada_m, 2) + ' m' : null],
    ['Oscilação vertical', E.oscil_cm ? f1(E.oscil_cm) + ' cm' : null],
    ['Tempo de contato com o solo', E.contato_ms ? E.contato_ms + ' ms' : null],
    ['Razão vertical', E.razao_vert ? f1(E.razao_vert) + '%' : null],
    ['Equilíbrio de contato', E.bal_med ? `${f1(E.bal_med)}% esquerda · ${f1(100 - E.bal_med)}% direita` : null],
    ['Respiração média', E.resp_med ? Math.round(E.resp_med) + ' respirações/min' : null],
    ['Efeito de treino aeróbico', E.te_aer ? f1(E.te_aer) : null],
    ['Efeito de treino anaeróbico', E.te_ana ? f1(E.te_ana) : null],
    ['Carga do treino (Garmin)', E.carga ? E.carga : null],
    ['Relógio', E.dispositivo || null],
  ].filter(([, v]) => v);
  if (num.length)
    blocos.push(
      `<div class="section"><div class="section-h"><h2 class="h2">Todos os números</h2>${slashes}</div><div class="card kv">${num.map(([a, b]) => `<div><span>${a}</span><b>${esc(String(b))}</b></div>`).join('')}</div></div>`,
    );
  return blocos;
}
function bindGraficos(root, c) {
  const box = root.querySelector('#graficos');
  if (!box) return;
  const S = c.analise.serie,
    n = S.t.length,
    porDist = box.dataset.pordist === '1';
  const X = porDist ? S.d.map((d) => d / 1000) : S.t.map((t) => t / 60);
  const leitura = box.querySelector('#gr-leitura');
  const fmt = {
    pace: (v) => paceTxt(v) + '/km',
    fc: (v) => (v ? Math.round(v) + ' bpm' : '–'),
    cad: (v) => (v ? Math.round(v) + ' ppm' : '–'),
    alt: (v) => (v != null ? Math.round(v) + ' m' : '–'),
    pot: (v) => (v ? Math.round(v) + ' W' : '–'),
    temp: (v) => (v != null ? f1(v) + ' °C' : '–'),
    gct: (v) => (v ? Math.round(v) + ' ms' : '–'),
    osc: (v) => (v ? f1(v) + ' cm' : '–'),
    passo: (v) => (v ? f1(v, 2) + ' m' : '–'),
    bal: (v) => (v ? f1(v) + '% esq.' : '–'),
    resp: (v) => (v ? Math.round(v) + ' rpm' : '–'),
  };
  const chave = {
    pace: 'vel',
    fc: 'fc',
    cad: 'cad',
    alt: 'alt',
    pot: 'pot',
    temp: 'temp',
    gct: 'gct',
    osc: 'osc',
    passo: 'passo',
    bal: 'bal',
    resp: 'resp',
  };
  const resumoOrig = {};
  box.querySelectorAll('[data-v]').forEach((s) => (resumoOrig[s.dataset.v] = s.textContent));
  const mostrar = (clientX) => {
    const r = box.querySelector('.gr-area').getBoundingClientRect();
    const fr = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const alvo = X[0] + fr * (X[n - 1] - X[0]);
    let i = 0;
    while (i < n - 1 && X[i + 1] <= alvo) i++;
    box.querySelectorAll('.gr-cur').forEach((c2) => {
      c2.hidden = false;
      c2.style.left = (fr * 100).toFixed(2) + '%';
    });
    box.querySelectorAll('[data-v]').forEach((s) => {
      const arr = S[chave[s.dataset.v]];
      if (arr) s.textContent = fmt[s.dataset.v](arr[i]);
    });
    leitura.textContent = `${f1(S.d[i] / 1000, 2)} km · ${fmtDurLongo(S.t[i])}`;
  };
  const sair = () => {
    box.querySelectorAll('.gr-cur').forEach((c2) => (c2.hidden = true));
    box.querySelectorAll('[data-v]').forEach((s) => (s.textContent = resumoOrig[s.dataset.v]));
    leitura.textContent = 'Arraste o dedo sobre os gráficos para ver cada ponto';
  };
  box.querySelectorAll('.gr-area').forEach((a) => {
    a.addEventListener('pointerdown', (e) => mostrar(e.clientX));
    a.addEventListener('pointermove', (e) => mostrar(e.clientX));
    a.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') sair();
    });
  });
  box.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') setTimeout(sair, 1800);
  });
}
