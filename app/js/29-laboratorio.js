/* Nexos App · Laboratório Nexos, relatórios do treinador e saúde do sistema.
   Parte 29 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Relatórios do treinador: evolução de todos os SEUS alunos num lugar só ---------- */
/* ================= LABORATÓRIO NEXOS (só a equipe vê) ================= */
const LAB_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L4.6 18.2A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.8L14 9.5V3"/><path d="M7.5 15h9"/></svg>';
const LAB_PER = [
  [4, '4 semanas'],
  [8, '8 semanas'],
  [12, '12 semanas'],
  [26, '6 meses'],
];
const repsNum = (r) => {
  const m = /\d+/.exec(String(r || ''));
  return m ? Math.min(100, +m[0]) : null;
};
const pctTxt = (v) => (v == null || !isFinite(v) ? '' : `${v > 0 ? '+' : ''}${Math.round(v)}%`);
const varPct = (a, b) => (b ? ((a - b) / b) * 100 : null);
const labDelta = (v, bomSobe = true, txt) =>
  v == null || !isFinite(v) || Math.abs(v) < 0.5
    ? ''
    : `<em class="lab-d ${v > 0 === bomSobe ? 'bom' : 'ruim'}">${v > 0 ? '▲' : '▼'} ${txt || Math.abs(Math.round(v)) + '%'}</em>`;
const semanaRot = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

// largura do desenho conforme a tela, para o texto dos eixos não ficar minúsculo no celular
const labW = (frac = 1) => {
  const w = Math.min(640, (window.innerWidth || 800) - 70);
  return Math.max(300, Math.round(window.innerWidth > 900 ? 640 * frac : w));
};
/** gráfico de barras com linha opcional por cima (SVG puro, sai igual no PDF) */
function labGraf({
  barras = [],
  linha = null,
  rot = [],
  corB = corP().p2,
  corL = '#e0a400',
  faixa = null,
  maxL = null,
  fmtB = (v) => f1(v, 0),
  fmtL = (v) => f1(v),
  uniB = '',
  uniL = '',
}) {
  const W = labW(),
    H = Math.round(W * 0.32) + 20,
    pl = 46,
    pr = linha ? 34 : 8,
    pt = 14,
    pb = 26,
    n = Math.max(1, barras.length),
    iw = W - pl - pr,
    ih = H - pt - pb,
    bw = iw / n;
  const mB = Math.max(1, ...barras.map((v) => v || 0)) * 1.12,
    mL = maxL || Math.max(1, ...(linha || []).filter((v) => v != null)) * 1.15;
  const yB = (v) => pt + ih - (v / mB) * ih,
    yL = (v) => pt + ih - (Math.min(v, mL) / mL) * ih;
  const passo = Math.max(1, Math.ceil(n / Math.max(4, Math.floor(W / 64))));
  let s = `<svg viewBox="0 0 ${W} ${H}" class="lab-svg" role="img">`;
  [0, 0.5, 1].forEach((f) => {
    const y = pt + ih - f * ih;
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" class="lab-grade"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end" class="lab-eixo">${fmtB((mB * f) / 1.12)}${f === 1 ? uniB : ''}</text>`;
  });
  if (faixa && linha)
    s += `<rect x="${pl}" width="${iw}" y="${yL(faixa[1])}" height="${yL(faixa[0]) - yL(faixa[1])}" fill="#3ddc97" opacity=".12"/>`;
  barras.forEach((v, i) => {
    const h = Math.max(0, pt + ih - yB(v || 0));
    s += `<rect x="${pl + i * bw + bw * 0.18}" y="${yB(v || 0)}" width="${bw * 0.64}" height="${h}" rx="4" fill="${corB}" opacity="${i === n - 1 ? 1 : 0.78}"><title>${esc(rot[i] || '')}: ${fmtB(v || 0)}${uniB}</title></rect>`;
    if (i % passo === 0 || i === n - 1)
      s += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="lab-eixo">${esc(rot[i] || '')}</text>`;
  });
  if (linha) {
    const pts = linha.map((v, i) => (v == null ? null : [pl + i * bw + bw / 2, yL(v)]));
    let d = '';
    pts.forEach((p, i) => {
      if (!p) return;
      d += `${d && pts[i - 1] ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    });
    s += `<path d="${d}" fill="none" stroke="${corL}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      if (p)
        s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${corL}"><title>${esc(rot[i] || '')}: ${fmtL(linha[i])}${uniL}</title></circle>`;
    });
    [0, 0.5, 1].forEach((f) => {
      const y = pt + ih - f * ih;
      s += `<text x="${W - pr + 6}" y="${y + 4}" class="lab-eixo" fill="${corL}">${fmtL(mL * f)}</text>`;
    });
  }
  return s + '</svg>';
}
/** linha simples (pace, previsão, carga de um exercício) */
function labLinha(vals, { cor = corP().p2, inverso = false, fmt = (v) => f1(v), rot = [], frac = 1 } = {}) {
  const pts = vals.map((v, i) => [i, v]).filter((p) => p[1] != null);
  if (pts.length < 2) return '<p class="tiny dim">Poucos dados no período para desenhar a curva.</p>';
  const W = labW(frac),
    H = Math.round(W * 0.34) + 16,
    pl = 54,
    pr = 12,
    pt = 14,
    pb = 22,
    iw = W - pl - pr,
    ih = H - pt - pb;
  const vs = pts.map((p) => p[1]),
    lo = Math.min(...vs),
    hi = Math.max(...vs),
    pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.05 || 1;
  const a = lo - pad,
    b = hi + pad,
    n = Math.max(2, vals.length);
  const x = (i) => pl + (i / (n - 1)) * iw,
    y = (v) => (inverso ? pt + ((v - a) / (b - a)) * ih : pt + ih - ((v - a) / (b - a)) * ih);
  let d = '';
  pts.forEach((p, k) => {
    d += `${k ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)} `;
  });
  const area = `${d} L${x(pts[pts.length - 1][0])} ${pt + ih} L${x(pts[0][0])} ${pt + ih} Z`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="lab-svg" role="img"><defs><linearGradient id="lg${cor.slice(1)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".22"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>`;
  [a + pad, b - pad].forEach((v) => {
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="lab-grade"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" class="lab-eixo">${fmt(v)}</text>`;
  });
  s += `<path d="${area}" fill="url(#lg${cor.slice(1)})"/><path d="${d}" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ult = pts[pts.length - 1];
  s += `<circle cx="${x(ult[0])}" cy="${y(ult[1])}" r="5" fill="${cor}"/>`;
  if (rot.length)
    [0, n - 1].forEach((i) => {
      s += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}" class="lab-eixo">${esc(rot[i] || '')}</text>`;
    });
  return s + '</svg>';
}
async function equipeLab() {
  if (!S.cache.equipeLab)
    S.cache.equipeLab = await sb
      .from('nx_membros')
      .select('user_id,nome')
      .eq('org_id', S.org.id)
      .neq('papel', 'aluno')
      .then(
        (r) => r.data || [],
        () => [],
      );
  return S.cache.equipeLab;
}
const kpi = (rot, val, delta = '', sub = '') =>
  `<div class="lab-kpi"><span>${rot}</span><b>${val}</b>${delta}${sub ? `<small>${sub}</small>` : ''}</div>`;

/* ---------- hub ---------- */
async function staffLaboratorio() {
  loading();
  dockStaff();
  const membT = await sb
    .from('nx_membros')
    .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const al = membT.filter((m) => ehMeuAluno(m) && m.ativo && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  $app.innerHTML = `<div class="lab-hero"><span class="lab-hero-ic">${LAB_IC}</span><p class="eyebrow">Só a equipe vê</p><h1 class="h1">Laboratório Nexos</h1><p class="small" style="opacity:.82;margin-top:6px">Análises de desempenho dos atletas e da assessoria, com os dados que o app coleta todos os dias.</p></div>
    <div class="lab-cards">
      <a class="lab-card" href="#lab-dossie" id="lab-ab-dossie"><span class="lab-card-ic">${I.user}</span><b>Dossiê do atleta</b><small>Relatório completo de um aluno: corrida, força, prontidão, adesão, composição corporal e o seu parecer. Sai em PDF.</small></a>
      <a class="lab-card" href="#/laboratorio/assessoria"><span class="lab-card-ic">${I.users}</span><b>Visão da assessoria</b><small>Alunos ativos, novos e saídas, retenção, adesão, alunos em risco e o perfil da equipe, mês a mês.</small></a>
      <a class="lab-card" href="#/relatorios"><span class="lab-card-ic">${I.hist}</span><b>Evolução dos alunos</b><small>Todos os alunos lado a lado: km, força, planilha cumprida, pace e previsão dos 10 km.</small></a>
    </div>
    <div class="section" id="lab-dossie"><div class="section-h"><h2 class="h2">Abrir o dossiê de</h2></div>
      <div class="search">${I.search}<input class="input" id="lab-q" placeholder="Buscar aluno"></div>
      <div class="stack" id="lab-lista" style="margin-top:10px"></div></div>`;
  const lista = (q) => {
    const nq = semAcento(q || '');
    document.getElementById('lab-lista').innerHTML =
      al
        .filter((m) => !nq || semAcento(m.nome).includes(nq))
        .map(
          (m) =>
            `<a class="list-item" href="#/laboratorio/dossie/${m.user_id}" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><span class="small muted">${[faz('corrida', m) && 'Corrida', faz('musculacao', m) && 'Força'].filter(Boolean).join(' e ')}</span></div>${I.chev}</a>`,
        )
        .join('') || '<p class="small muted">Nenhum aluno encontrado.</p>';
  };
  lista('');
  document.getElementById('lab-q').oninput = (e) => lista(e.target.value);
  document.getElementById('lab-ab-dossie').onclick = (e) => {
    e.preventDefault();
    document.getElementById('lab-dossie').scrollIntoView({ behavior: semMov() ? 'auto' : 'smooth' });
    document.getElementById('lab-q').focus();
  };
}

/* ---------- dossiê do atleta ---------- */
async function staffDossie(alunoId, semSel) {
  loading();
  dockStaff();
  const N = LAB_PER.some((p) => p[0] === +semSel) ? +semSel : S.cache.labN || 12;
  S.cache.labN = N;
  const agora = Date.now(),
    hj = hojeISO();
  const fimSem = inicioSemana(new Date());
  fimSem.setDate(fimSem.getDate() + 7); // segunda da próxima semana
  const t1 = agora,
    t0 = fimSem.getTime() - N * 7 * 864e5,
    tA = t0 - N * 7 * 864e5;
  const iso = (t) => new Date(t).toISOString(),
    isoD = (t) => isoDia(new Date(t));
  const [m, corrT, sessT, regs, plano, treinos, libs, pronts, avals, hid, cic, cicD, dossA, provas] = await Promise.all(
    [
      sb
        .from('nx_membros')
        .select('*')
        .eq('org_id', S.org.id)
        .eq('user_id', alunoId)
        .maybeSingle()
        .then(
          (r) => r.data,
          () => null,
        ),
      sb
        .from('nx_corridas')
        .select('id,data,tipo,distancia_m,duracao_s,fc_media,rpe,dor,dor_local,plano_id,parciais,titulo')
        .eq('aluno_id', alunoId)
        .gte('data', iso(tA - 56 * 864e5))
        .order('data')
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_sessoes')
        .select('id,iniciado_em,finalizado_em,esforco,fase,treino_titulo,psr,dor,dor_local')
        .eq('aluno_id', alunoId)
        .not('finalizado_em', 'is', null)
        .gte('iniciado_em', iso(tA - 42 * 864e5))
        .order('iniciado_em')
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_registros')
        .select('exercicio_nome,carga_kg,reps,feito,criado_em')
        .eq('aluno_id', alunoId)
        .gte('criado_em', iso(tA))
        .order('criado_em')
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_plano_corrida')
        .select('id,data,tipo,liberado')
        .eq('aluno_id', alunoId)
        .gte('data', isoD(tA))
        .lte('data', hj)
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_treinos')
        .select('id,titulo,dias,ativo')
        .eq('aluno_id', alunoId)
        .eq('ativo', true)
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_forca_semanas')
        .select('semana')
        .eq('aluno_id', alunoId)
        .gte('semana', isoD(tA))
        .then(
          (r) => (r.data || []).map((x) => x.semana),
          () => [],
        ),
      sb
        .from('nx_prontidao')
        .select('dia,total,sono,energia,dor,estresse,dor_locais,dor_int')
        .eq('aluno_id', alunoId)
        .gte('dia', isoD(tA))
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_avaliacoes')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('data')
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_hidratacao')
        .select('dia,ml,meta')
        .eq('aluno_id', alunoId)
        .gte('dia', isoD(t0))
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_ciclo')
        .select('ativo,situacao')
        .eq('aluno_id', alunoId)
        .maybeSingle()
        .then(
          (r) => r.data,
          () => null,
        ),
      sb
        .from('nx_ciclo_dias')
        .select('dia,menstruada,sintomas,colica_int')
        .eq('aluno_id', alunoId)
        .gte('dia', isoD(t0))
        .then(
          (r) => r.data || [],
          () => [],
        ),
      sb
        .from('nx_dossies')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('criado_em', { ascending: false })
        .limit(1)
        .then(
          (r) => (r.data || [])[0] || null,
          () => null,
        ),
      sb
        .from('nx_participacoes')
        .select('titulo,data,distancia,meta')
        .eq('aluno_id', alunoId)
        .gte('data', hj)
        .order('data')
        .limit(3)
        .then(
          (r) => r.data || [],
          () => [],
        ),
    ],
  );
  const histAnt = await sb
    .from('nx_corridas')
    .select('data,tipo,distancia_m,duracao_s,parciais')
    .eq('aluno_id', alunoId)
    .lte('data', iso(t0))
    .gte('distancia_m', 900)
    .then(
      (r) => r.data || [],
      () => [],
    );
  if (!m) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div><a class="btn sm" href="#/laboratorio" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const fC = faz('corrida', m),
    fM = faz('musculacao', m),
    perfil = perfilCorrida(m);
  const noP = (t) => t > t0 && t <= t1,
    noA = (t) => t > tA && t <= t0;
  const corr = corrT.filter((c) => ehCorrHist(c)),
    cP = corr.filter((c) => noP(Date.parse(c.data))),
    cA = corr.filter((c) => noA(Date.parse(c.data)));
  const sP = sessT.filter((x) => noP(Date.parse(x.iniciado_em))),
    sA = sessT.filter((x) => noA(Date.parse(x.iniciado_em)));
  const todasAtiv = corrT; // carga considera todas as atividades
  const km = (l) => l.reduce((a, c) => a + (+c.distancia_m || 0), 0) / 1000,
    horas = (l) => l.reduce((a, c) => a + (+c.duracao_s || 0), 0) / 3600;
  const kmP = km(cP),
    kmA = km(cA);
  const paceM = (l) => {
    const x = l.filter((c) => c.distancia_m >= 3000 && c.tipo !== 'caminhada');
    const d = km(x);
    return d ? x.reduce((a, c) => a + c.duracao_s, 0) / d : null;
  };
  const paceP = paceM(cP),
    paceA = paceM(cA);
  // semanas do período
  const sems = Array.from({ length: N }, (_, i) => {
    const a = new Date(t0 + i * 7 * 864e5);
    const b = new Date(a.getTime() + 7 * 864e5);
    return { a, b, fim: Math.min(b.getTime() - 1, agora) };
  });
  const naSem = (t, s) => t >= s.a.getTime() && t < s.b.getTime();
  sems.forEach((s) => {
    s.km = km(corr.filter((c) => naSem(Date.parse(c.data), s)));
    s.fo = sessT.filter((x) => naSem(Date.parse(x.iniciado_em), s)).length;
    s.cg = calcCarga(todasAtiv, sessT, s.fim);
    s.pv = fC ? previsaoEm(corrT, perfil, s.fim) : null;
    const pr = pronts.filter((p) => naSem(Date.parse(p.dia + 'T12:00:00'), s));
    s.pront = pr.length ? pr.reduce((a, p) => a + p.total, 0) / pr.length : null;
    s.ton = regs
      .filter((r) => naSem(Date.parse(r.criado_em), s) && r.carga_kg != null && repsNum(r.reps))
      .reduce((a, r) => a + r.carga_kg * repsNum(r.reps), 0);
  });
  const rot = sems.map((s) => semanaRot(s.a));
  // intensidade (tempo em cada faixa, pelo esforço ou pela FC)
  const dist = { leve: 0, mod: 0, forte: 0, sem: 0 };
  cP.forEach((c) => {
    const mn = (+c.duracao_s || 0) / 60;
    let k = 'sem';
    if (c.rpe != null) k = c.rpe <= 4 ? 'leve' : c.rpe <= 6 ? 'mod' : 'forte';
    else if (c.fc_media && perfil.fcMax) {
      const f = c.fc_media / perfil.fcMax;
      k = f < 0.8 ? 'leve' : f < 0.88 ? 'mod' : 'forte';
    }
    dist[k] += mn;
  });
  const distT = dist.leve + dist.mod + dist.forte;
  // previsões
  const pv1 = fC ? previsaoEm(corrT, perfil, t1) : null,
    pv0 = fC ? previsaoEm(corrT, perfil, t0) : null;
  // recordes no período
  const best = (lista) => {
    const o = {};
    lista.forEach((c) =>
      Object.entries(melhoresDaCorrida(c)).forEach(([d, t]) => {
        if (o[d] == null || t < o[d]) o[d] = t;
      }),
    );
    return o;
  };
  const bAntes = best(histAnt.filter((c) => ehCorrHist(c))),
    bP = best(cP);
  const recs = DIST_REC.filter(([d]) => bP[d] != null && (bAntes[d] == null || bP[d] < bAntes[d])).map(([d, n]) => ({
    n,
    t: bP[d],
    antes: bAntes[d],
  }));
  const longao = cP.reduce((a, c) => Math.max(a, (+c.distancia_m || 0) / 1000), 0);
  // adesão
  const plP = plano.filter((p) => noP(Date.parse(p.data + 'T12:00:00')) && !semCorrida(p) && p.liberado !== false);
  const diasCorr = new Set(corr.map((c) => isoDia(c.data))),
    feitosIds = new Set(corr.map((c) => c.plano_id).filter(Boolean));
  const plFeito = (p) => feitosIds.has(p.id) || diasCorr.has(p.data);
  const aderC = plP.length ? (plP.filter(plFeito).length / plP.length) * 100 : null;
  const plA = plano.filter((p) => noA(Date.parse(p.data + 'T12:00:00')) && !semCorrida(p) && p.liberado !== false);
  const aderCA = plA.length ? (plA.filter(plFeito).length / plA.length) * 100 : null;
  let prevF = 0,
    feitoF = 0;
  sems.forEach((s) => {
    const seg = isoDia(s.a);
    if (!libs.includes(seg)) return;
    const passaram = Math.min(7, Math.floor((Math.min(agora, s.b.getTime()) - s.a.getTime()) / 864e5) + 1);
    const off = (m.disponibilidade && m.disponibilidade.off_forca) || [];
    const p = treinos.reduce((n, t) => n + (t.dias || []).filter((d) => d < passaram && !off.includes(d)).length, 0);
    prevF += p;
    feitoF += Math.min(p, s.fo);
  });
  const aderF = prevF ? (feitoF / prevF) * 100 : null;
  const faltasDia = Array(7).fill(0);
  plP
    .filter((p) => !plFeito(p) && p.data < hj)
    .forEach((p) => {
      faltasDia[dsemIdx(p.data)]++;
    });
  const maxFalta = Math.max(...faltasDia),
    diaFalta = maxFalta >= 2 ? DSEM[faltasDia.indexOf(maxFalta)] : null;
  const semAtiv = sems.filter((s) => s.km > 0 || s.fo > 0).length;
  // força
  const exs = {};
  regs
    .filter((r) => r.carga_kg != null && noP(Date.parse(r.criado_em)))
    .forEach((r) => {
      (exs[r.exercicio_nome || 'Exercício'] = exs[r.exercicio_nome || 'Exercício'] || []).push(r);
    });
  const topEx = Object.entries(exs)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([n, l]) => {
      const porSem = sems.map((s) => {
        const v = l.filter((r) => naSem(Date.parse(r.criado_em), s)).map((r) => +r.carga_kg);
        return v.length ? Math.max(...v) : null;
      });
      const vals = porSem.filter((v) => v != null);
      return { n, porSem, ini: vals[0], fim: vals[vals.length - 1] };
    });
  const tonP = sems.reduce((a, s) => a + s.ton, 0);
  const faseAt = (
    sessT
      .slice()
      .reverse()
      .find((x) => x.fase) || {}
  ).fase;
  const pseF = sP.filter((x) => x.esforco != null).map((x) => x.esforco),
    pseFm = pseF.length ? pseF.reduce((a, b) => a + b, 0) / pseF.length : null;
  // prontidão e saúde
  const prP = pronts.filter((p) => noP(Date.parse(p.dia + 'T12:00:00'))),
    prA = pronts.filter((p) => noA(Date.parse(p.dia + 'T12:00:00')));
  const med = (l, k) => (l.length ? l.reduce((a, p) => a + p[k], 0) / l.length : null);
  const prM = med(prP, 'total'),
    prMA = med(prA, 'total');
  const dores = {};
  prP.forEach((p) => (p.dor_locais || []).forEach((k) => (dores[k] = (dores[k] || 0) + 1)));
  const doresTop = Object.entries(dores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const dorTreinos = cP.filter((c) => c.dor).length + sP.filter((x) => x.dor).length;
  const hidOk = hid.filter((h) => h.ml >= (h.meta || m.meta_agua_ml || 2500)).length;
  const cicSint = {};
  cicD.forEach((x) => (x.sintomas || []).forEach((k) => (cicSint[k] = (cicSint[k] || 0) + 1)));
  // composição corporal
  const av = avals.map((a) => ({ ...a, r: calcAval(a) }));
  const avFim = av.filter((a) => a.data <= hj).slice(-1)[0],
    avIni = av.length > 1 ? av[0] : null;
  const ci = (a) => num((a.perimetros || {}).cintura);
  // carga atual
  const cgAgora = calcCarga(todasAtiv, sessT, agora);
  // resumo executivo (só com o que os dados mostram)
  const frases = [];
  if (fC && kmP)
    frases.push(
      `Correu ${f1(kmP)} km em ${cP.length} corrida${cP.length === 1 ? '' : 's'}${kmA ? `, ${kmP >= kmA ? 'alta' : 'queda'} de ${Math.abs(Math.round(varPct(kmP, kmA)))}% em relação às ${N} semanas anteriores` : ''}.`,
    );
  if (fM && sP.length)
    frases.push(
      `Fez ${sP.length} treino${sP.length === 1 ? '' : 's'} de força${sA.length ? ` (${sA.length} no período anterior)` : ''}${faseAt && FASES_F[faseAt] ? ` e está na fase de ${FASES_F[faseAt].n.toLowerCase()}` : ''}.`,
    );
  if (pv1 && pv0 && pv0.tempos[1] - pv1.tempos[1] >= 5)
    frases.push(
      `A previsão nos 10 km melhorou ${difTxt(pv0.tempos[1] - pv1.tempos[1])}, para ${fmtDurLongo(pv1.tempos[1])}.`,
    );
  else if (pv1 && pv0 && pv1.tempos[1] - pv0.tempos[1] >= 5)
    frases.push(
      `A previsão nos 10 km piorou ${difTxt(pv1.tempos[1] - pv0.tempos[1])}, hoje em ${fmtDurLongo(pv1.tempos[1])}.`,
    );
  if (recs.length)
    frases.push(
      `${recs.length === 1 ? 'Bateu recorde' : `Bateu ${recs.length} recordes`} no período: ${recs.map((r) => `${r.n} em ${fmtDurLongo(r.t)}`).join(', ')}.`,
    );
  const aderG = [aderC, aderF].filter((v) => v != null);
  if (aderG.length)
    frases.push(
      `Cumpriu ${Math.round(aderG.reduce((a, b) => a + b, 0) / aderG.length)}% dos treinos planejados${diaFalta ? `; ${diaFalta.toLowerCase()} é o dia em que mais falta` : ''}.`,
    );
  if (cgAgora.nivel) frases.push(`Atenção: ${cgAgora.txt}.`);
  if (prM != null)
    frases.push(
      `Prontidão média de ${f1(prM)} de 20 no check-in da manhã${prMA != null && Math.abs(prM - prMA) >= 0.5 ? ` (${prM > prMA ? 'subiu' : 'caiu'} de ${f1(prMA)})` : ''}.`,
    );
  if (doresTop.length)
    frases.push(
      `Relatou dor principalmente em: ${doresTop
        .slice(0, 3)
        .map(([k]) => nomeRegDor(k).toLowerCase())
        .join(', ')}.`,
    );
  if (avFim && avIni && avFim.r.gordura != null && avIni.r.gordura != null && avFim.id !== avIni.id)
    frases.push(`Gordura corporal de ${f1(avIni.r.gordura)}% para ${f1(avFim.r.gordura)}% desde a primeira avaliação.`);
  const treinador = (await equipeLab()).find((x) => x.user_id === m.treinador_id) || null;
  const nomeT = treinador ? treinador.nome : S.me.nome;
  const iniTxt = fmtCurto(isoDia(new Date(t0 + 864e5)) + 'T12:00:00'),
    fimTxt = fmtCurto(hj + 'T12:00:00');
  const sec = (t, corpo, cls = '') => `<section class="lab-sec ${cls}"><h2 class="lab-h">${t}</h2>${corpo}</section>`;
  const idade = m.nascimento ? Math.floor((agora - Date.parse(m.nascimento + 'T12:00:00')) / (365.25 * 864e5)) : null;
  $app.innerHTML = `<div class="no-print"><a class="back" href="#/laboratorio">${I.back} Laboratório Nexos</a>
      <div class="row between" style="gap:10px;flex-wrap:wrap;margin-top:8px"><div class="cic-modo lab-per">${LAB_PER.map(([n, l]) => `<a href="#/laboratorio/dossie/${alunoId}/${n}" class="${n === N ? 'on' : ''}">${l}</a>`).join('')}</div>
      <button class="btn sm" id="lab-pdf">${I.ficha} Salvar em PDF</button></div></div>
    <article class="lab-doc">
      <header class="lab-cab"><div class="lab-cab-l"><img src="icons/simbolo.svg" alt="" class="lab-logo"><div><p class="lab-marca">Laboratório Nexos</p><h1 class="lab-tit">Dossiê de desempenho</h1></div></div>
        <div class="lab-at">${avAluno(m)}<div><b>${esc(m.nome)}</b><span>${[idade && idade + ' anos', [fC && 'corrida', fM && 'força'].filter(Boolean).join(' e ')].filter(Boolean).join(' · ')}</span><span>${iniTxt} a ${fimTxt} · ${N} semanas · treinador: ${esc(nomeT || '')}</span></div></div></header>
      ${sec('Resumo executivo', frases.length ? `<ul class="lab-res">${frases.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '<p class="small muted">Ainda não há dados suficientes neste período.</p>', 'lab-resumo')}
      ${sec(
        'Números do período',
        `<div class="lab-kpis">
        ${fC ? kpi('Km corridos', f1(kmP), labDelta(varPct(kmP, kmA))) : ''}
        ${fC ? kpi('Tempo correndo', fmtDurLongo(horas(cP) * 3600).replace(/:\d\d$/, '') + ' h') : ''}
        ${fM ? kpi('Treinos de força', sP.length, labDelta(varPct(sP.length, sA.length))) : ''}
        ${kpi('Semanas ativas', `${semAtiv}<small>/${N}</small>`)}
        ${aderC != null ? kpi('Planilha de corrida', Math.round(aderC) + '%', labDelta(aderCA != null ? aderC - aderCA : null, true, aderCA != null ? Math.abs(Math.round(aderC - aderCA)) + ' p.p.' : '')) : ''}
        ${aderF != null ? kpi('Treinos de força feitos', Math.round(aderF) + '%') : ''}
        ${fC && paceP ? kpi('Pace médio', fmtPace(paceP).replace('/km', ''), paceA ? labDelta(paceA - paceP, true, Math.abs(Math.round(paceP - paceA)) + 's') : '', 'corridas de 3 km ou mais') : ''}
        ${prM != null ? kpi('Prontidão média', f1(prM) + '<small>/20</small>', prMA != null ? labDelta(varPct(prM, prMA)) : '') : ''}
      </div>`,
      )}
      ${
        fC
          ? sec(
              'Corrida',
              `
        <div class="lab-bloco"><div class="lab-bt"><b>Volume semanal e carga</b><span class="lab-leg"><i style="background:${corP().p2}"></i>km por semana <i style="background:#e0a400"></i>carga dos 7 dias x média das 4 anteriores</span></div>
          ${labGraf({ barras: sems.map((s) => s.km), linha: sems.map((s) => s.cg.acwr), rot, faixa: [0.8, 1.3], maxL: 2, fmtL: (v) => f1(v), uniB: ' km' })}
          <p class="tiny dim">Faixa verde de 0,8 a 1,3: referência de monitoramento (Gabbett 2016), mas os estudos mais recentes não confirmaram que ela prevê lesão (Impellizzeri et al. 2020; Frandsen et al. 2025). O alerta do app olha o salto de um treino isolado. Carga = minutos x esforço de todos os treinos, corrida e força.</p></div>
        <div class="lab-2">
          <div class="lab-bloco"><div class="lab-bt"><b>Distribuição de intensidade</b></div>
            ${
              distT
                ? `<div class="lab-int">${[
                    ['leve', 'Leve', '#3ddc97'],
                    ['mod', 'Moderado', '#ffcf5c'],
                    ['forte', 'Forte', '#ff8a8a'],
                  ]
                    .map(([k, l, c]) => `<i style="flex:${dist[k] || 0.0001};background:${c}"></i>`)
                    .join('')}</div>
              <div class="lab-int-l">${[
                ['leve', 'Leve'],
                ['mod', 'Moderado'],
                ['forte', 'Forte'],
              ]
                .map(([k, l]) => `<span><b>${Math.round((dist[k] / distT) * 100)}%</b> ${l}</span>`)
                .join('')}</div>
              <p class="tiny dim" style="margin-top:8px">Pelo tempo de cada corrida, classificado pelo esforço marcado ou pela FC média. Corredores de resistência bem treinados costumam fazer perto de 80% do tempo em intensidade leve (Seiler, 2010).${dist.sem ? ` ${Math.round(dist.sem)} min sem esforço nem FC ficaram de fora.` : ''}</p>`
                : '<p class="small muted">Sem corridas com esforço ou frequência cardíaca no período.</p>'
            }</div>
          <div class="lab-bloco"><div class="lab-bt"><b>Previsões de prova</b></div>${previsoesGrade(pv1, pv0, `há ${N} semanas`)}</div>
        </div>
        <div class="lab-2">
          <div class="lab-bloco"><div class="lab-bt"><b>Previsão nos 10 km, semana a semana</b></div>${labLinha(
            sems.map((s) => (s.pv ? s.pv.tempos[1] : null)),
            { cor: '#1a7fe6', inverso: true, fmt: (v) => fmtDurLongo(v), rot, frac: 0.5 },
          )}<p class="tiny dim">Para cima é mais rápido.</p></div>
          <div class="lab-bloco"><div class="lab-bt"><b>Recordes e marcas</b></div>
            ${recs.length ? `<div class="stack">${recs.map((r) => `<div class="lab-rec"><b>${r.n}</b><span>${fmtDurLongo(r.t)}</span>${r.antes ? `<em class="lab-d bom">▼ ${difTxt(r.antes - r.t)}</em>` : '<em class="lab-d bom">primeira marca</em>'}</div>`).join('')}</div>` : '<p class="small muted">Nenhum recorde novo no período.</p>'}
            <p class="small" style="margin-top:10px">Corrida mais longa: <b>${longao ? f1(longao) + ' km' : '–'}</b></p>
            ${provas.length ? `<p class="small" style="margin-top:6px">Próximas provas: ${provas.map((p) => `<b>${esc(p.titulo || 'prova')}</b> (${fmtCurto(p.data + 'T12:00:00')}${p.distancia ? ', ' + esc(p.distancia) : ''})`).join(' · ')}</p>` : ''}</div>
        </div>`,
            )
          : ''
      }
      ${
        fM
          ? sec(
              'Força',
              `
        <div class="lab-bloco"><div class="lab-bt"><b>Treinos e volume levantado por semana</b><span class="lab-leg"><i style="background:${corP().h1}"></i>toneladas (carga x repetições) <i style="background:${corP().p1}"></i>treinos</span></div>
          ${labGraf({ barras: sems.map((s) => s.ton / 1000), linha: sems.map((s) => s.fo), rot, corB: corP().h1, corL: corP().p1, fmtB: (v) => f1(v), uniB: ' t', fmtL: (v) => f1(v, 0), maxL: Math.max(2, 2 * Math.ceil(Math.max(...sems.map((s) => s.fo)) * 0.6)) })}
          <p class="tiny dim">Total no período: ${f1(tonP / 1000)} toneladas${pseFm != null ? ` · esforço médio das sessões ${f1(pseFm)}/10` : ''}${faseAt && FASES_F[faseAt] ? ` · fase atual: ${FASES_F[faseAt].n.toLowerCase()}` : ''}.</p></div>
        ${topEx.length ? `<div class="lab-exs">${topEx.map((e) => `<div class="lab-bloco"><div class="lab-bt"><b class="ellip">${esc(e.n)}</b>${e.ini != null && e.fim != null && e.fim !== e.ini ? `<em class="lab-d ${e.fim > e.ini ? 'bom' : 'ruim'}">${e.fim > e.ini ? '▲' : '▼'} ${f1(Math.abs(e.fim - e.ini))} kg</em>` : ''}</div>${labLinha(e.porSem, { cor: '#2550cf', fmt: (v) => f1(v) + ' kg', rot, frac: 0.5 })}<p class="tiny dim">${e.ini != null ? `${f1(e.ini)} kg → ${f1(e.fim)} kg (maior carga da semana)` : ''}</p></div>`).join('')}</div>` : '<p class="small muted">Sem cargas registradas no período.</p>'}`,
            )
          : ''
      }
      ${sec(
        'Prontidão e saúde',
        `<div class="lab-2">
        <div class="lab-bloco"><div class="lab-bt"><b>Check-in da manhã</b></div>${
          prP.length
            ? `${labLinha(
                sems.map((s) => s.pront),
                { cor: '#1fb0ec', fmt: (v) => f1(v), rot, frac: 0.5 },
              )}
          <div class="lab-mini">${['sono', 'energia', 'dor', 'estresse'].map((k) => `<span>${PRONT_CURTO[k]} <b>${f1(med(prP, k))}</b>/5</span>`).join('')}</div><p class="tiny dim">${prP.length} respostas no período (escala de 4 a 20; nos itens, 5 é o melhor).</p>`
            : '<p class="small muted">Não respondeu o check-in no período.</p>'
        }</div>
        <div class="lab-bloco"><div class="lab-bt"><b>Dores e cuidados</b></div>
          ${doresTop.length ? `<div class="cic-hist">${doresTop.map(([k, n]) => `<div><span class="tiny dim">${esc(nomeRegDor(k))}</span><i style="width:${(n / doresTop[0][1]) * 100}%;background:#e85d75"></i><b class="tiny">${n}x</b></div>`).join('')}</div>` : '<p class="small muted">Nenhuma dor marcada no check-in.</p>'}
          ${dorTreinos ? `<p class="small" style="margin-top:8px">Marcou dor em ${dorTreinos} treino${dorTreinos === 1 ? '' : 's'}.</p>` : ''}
          ${hid.length ? `<p class="small" style="margin-top:8px">Hidratação: registrou água em ${hid.length} dia${hid.length === 1 ? '' : 's'} e bateu a meta em ${hidOk}.</p>` : ''}
          ${
            cic && cic.ativo && Object.keys(cicSint).length
              ? `<p class="small" style="margin-top:8px">Ciclo: ${Object.entries(cicSint)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([k, n]) => `${esc(nomeSint(k)).toLowerCase()} (${n} dia${n === 1 ? '' : 's'})`)
                  .join(', ')}.</p>`
              : ''
          }
          <p class="small" style="margin-top:8px">Carga agora: <b>${cgAgora.acwr != null ? f1(cgAgora.acwr) + 'x a média' : 'histórico curto'}</b>${cgAgora.nivel ? ` <span class="tag ${cgAgora.nivel === 'alto' ? 'err' : 'warn'}">alerta</span>` : ''}</p></div>
      </div>`,
      )}
      ${sec(
        'Adesão',
        `<div class="lab-2">
        <div class="lab-bloco"><div class="lab-bt"><b>Treinos planejados x feitos</b></div>
          ${aderC != null ? `<div class="lab-barra"><span>Corrida</span><i><i style="width:${aderC}%"></i></i><b>${Math.round(aderC)}%</b></div>` : ''}
          ${aderF != null ? `<div class="lab-barra"><span>Força</span><i><i style="width:${aderF}%;background:${corP().h1}"></i></i><b>${Math.round(aderF)}%</b></div>` : ''}
          ${aderC == null && aderF == null ? '<p class="small muted">Sem treinos liberados no período.</p>' : ''}</div>
        <div class="lab-bloco"><div class="lab-bt"><b>Faltas por dia da semana</b></div>
          ${plP.some((p) => !plFeito(p)) ? `<div class="lab-dsem">${DSEM.map((d, i) => `<div><i style="height:${maxFalta ? (faltasDia[i] / maxFalta) * 100 : 0}%"></i><span>${d.slice(0, 3)}</span><b>${faltasDia[i] || ''}</b></div>`).join('')}</div>` : '<p class="small muted">Nenhuma falta de corrida no período.</p>'}</div>
      </div>`,
      )}
      ${
        av.length
          ? sec(
              'Composição corporal',
              (() => {
                const lin = (rotl, k, unid, bomSobe, dig = 1) => {
                  const a = avIni && avIni.r[k],
                    b = avFim && avFim.r[k];
                  return b == null
                    ? ''
                    : `<tr><td>${rotl}</td><td>${a != null && avIni.id !== avFim.id ? f1(a, dig) + unid : '–'}</td><td><b>${f1(b, dig)}${unid}</b></td><td>${a != null && avIni.id !== avFim.id ? labDelta(b - a, bomSobe, `${f1(Math.abs(b - a), dig)}${unid}`) : ''}</td></tr>`;
                };
                const peso = (a) => num(a && a.peso);
                return `<table class="lab-tab"><thead><tr><th></th><th>${avIni && avIni.id !== avFim.id ? fmtCurto(avIni.data + 'T12:00:00') : ''}</th><th>${fmtCurto(avFim.data + 'T12:00:00')}</th><th>Diferença</th></tr></thead><tbody>
          ${peso(avFim) != null ? `<tr><td>Peso</td><td>${avIni && avIni.id !== avFim.id && peso(avIni) != null ? f1(peso(avIni)) + ' kg' : '–'}</td><td><b>${f1(peso(avFim))} kg</b></td><td>${avIni && avIni.id !== avFim.id && peso(avIni) != null ? labDelta(peso(avFim) - peso(avIni), false, f1(Math.abs(peso(avFim) - peso(avIni))) + ' kg') : ''}</td></tr>` : ''}
          ${lin('Gordura corporal', 'gordura', '%', false)}${lin('Massa magra', 'massa_magra', ' kg', true)}${lin('Massa gorda', 'massa_gorda', ' kg', false)}
          ${ci(avFim) != null ? `<tr><td>Cintura</td><td>${avIni && avIni.id !== avFim.id && ci(avIni) != null ? f1(ci(avIni)) + ' cm' : '–'}</td><td><b>${f1(ci(avFim))} cm</b></td><td>${avIni && avIni.id !== avFim.id && ci(avIni) != null ? labDelta(ci(avFim) - ci(avIni), false, f1(Math.abs(ci(avFim) - ci(avIni))) + ' cm') : ''}</td></tr>` : ''}
        </tbody></table><p class="tiny dim">${av.length} avaliaç${av.length === 1 ? 'ão' : 'ões'} no histórico. Comparação entre a primeira e a mais recente.</p>`;
              })(),
            )
          : ''
      }
      ${sec(
        'Parecer do treinador',
        `<div class="no-print"><label class="field"><span>Análise do período</span><textarea class="textarea" id="lab-parecer" rows="5" maxlength="4000" placeholder="O que evoluiu, o que precisa de atenção e por quê">${esc((dossA && dossA.parecer) || '')}</textarea></label>
          <label class="field"><span>Próximos objetivos</span><textarea class="textarea" id="lab-obj" rows="3" maxlength="2000" placeholder="Ex.: chegar a 40 km por semana sem dor; sub 50 nos 10 km em março">${esc((dossA && dossA.objetivos) || '')}</textarea></label>
          <button class="btn ghost sm" id="lab-salvar">${I.check} Salvar parecer</button>${dossA ? `<span class="tiny dim" style="margin-left:8px">Último parecer: ${fmtCurto(dossA.atualizado_em)}</span>` : ''}</div>
        <div class="lab-parecer-imp" id="lab-parecer-imp"></div>`,
      )}
      <footer class="lab-rod"><span>Nexos Performance e Saúde · Laboratório Nexos</span><span>Gerado em ${fmtCurto(hj + 'T12:00:00')} com os dados registrados no app. Previsões e cálculos são estimativas baseadas na literatura científica.</span></footer>
    </article>`;
  const imp = () => {
    const p = document.getElementById('lab-parecer').value.trim(),
      o = document.getElementById('lab-obj').value.trim();
    document.getElementById('lab-parecer-imp').innerHTML =
      `${p ? `<p>${esc(p).replace(/\n/g, '<br>')}</p>` : ''}${o ? `<p style="margin-top:10px"><b>Próximos objetivos:</b> ${esc(o).replace(/\n/g, '<br>')}</p>` : ''}${p || o ? `<p class="tiny dim" style="margin-top:10px">${esc(nomeT || '')}</p>` : '<p class="small muted">Sem parecer escrito.</p>'}`;
  };
  imp();
  document.getElementById('lab-parecer').oninput = imp;
  document.getElementById('lab-obj').oninput = imp;
  document.getElementById('lab-salvar').onclick = async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    const row = {
      org_id: S.org.id,
      aluno_id: alunoId,
      per_ini: isoDia(new Date(t0 + 864e5)),
      per_fim: hj,
      parecer: document.getElementById('lab-parecer').value.trim() || null,
      objetivos: document.getElementById('lab-obj').value.trim() || null,
      atualizado_em: new Date().toISOString(),
    };
    const q =
      dossA && diasDesde(dossA.criado_em) < 7
        ? sb.from('nx_dossies').update(row).eq('id', dossA.id)
        : sb.from('nx_dossies').insert(row);
    const { error } = await q;
    b.disabled = false;
    toast(error ? 'Não foi possível salvar o parecer.' : 'Parecer salvo.', !!error);
  };
  document.getElementById('lab-pdf').onclick = () => window.print();
}

/* ---------- visão da assessoria ---------- */
async function staffAssessoria(mesSel) {
  loading();
  dockStaff();
  const hj = hojeISO(),
    mesK = /^\d{4}-\d{2}$/.test(mesSel || '') && mesSel <= hj.slice(0, 7) ? mesSel : hj.slice(0, 7);
  const d0 = new Date(mesK + '-01T12:00:00'),
    mIni = mesK + '-01',
    mFim = isoDia(new Date(d0.getFullYear(), d0.getMonth() + 1, 0, 12));
  const ehAtual = mesK === hj.slice(0, 7),
    mFimEf = ehAtual ? hj : mFim;
  const pIni = isoDia(new Date(d0.getFullYear(), d0.getMonth() - 1, 1, 12)),
    pFim = isoDia(new Date(d0.getFullYear(), d0.getMonth(), 0, 12));
  const diasMes = Math.round((dia(mFimEf) - dia(mIni)) / 864e5) + 1,
    diasPrevEf = ehAtual
      ? Math.min(diasMes, Math.round((dia(pFim) - dia(pIni)) / 864e5) + 1)
      : Math.round((dia(pFim) - dia(pIni)) / 864e5) + 1;
  const pFimEf = isoDia(new Date(dia(pIni).getTime() + (diasPrevEf - 1) * 864e5)); // compara o mesmo número de dias
  const ini12 = isoDia(new Date(dia(mFimEf).getTime() - 83 * 864e5));
  const isoT = (k, fim) => new Date(k + (fim ? 'T23:59:59' : 'T00:00:00')).toISOString();
  const menor = ini12 < pIni ? ini12 : pIni;
  const [membT, corrT, sessT, planoT, prontT, provasT, satT] = await Promise.all([
    sb
      .from('nx_membros')
      .select(
        'user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades,sexo,nascimento,criado_em,desativado_em,objetivo',
      )
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    todasAsLinhas(() =>
      sb
        .from('nx_corridas')
        .select('aluno_id,data,tipo,distancia_m,duracao_s,parciais')
        .eq('org_id', S.org.id)
        .gte('data', isoT(menor))
        .order('data'),
    ),
    todasAsLinhas(() =>
      sb
        .from('nx_sessoes')
        .select('aluno_id,iniciado_em')
        .eq('org_id', S.org.id)
        .not('finalizado_em', 'is', null)
        .gte('iniciado_em', isoT(menor))
        .order('iniciado_em'),
    ),
    todasAsLinhas(() =>
      sb
        .from('nx_plano_corrida')
        .select('id,aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .gte('data', pIni)
        .lte('data', mFimEf)
        .order('data'),
    ),
    todasAsLinhas(() =>
      sb
        .from('nx_prontidao')
        .select('aluno_id,dia')
        .eq('org_id', S.org.id)
        .gte('dia', pIni)
        .lte('dia', mFimEf)
        .order('dia'),
    ),
    sb
      .from('nx_participacoes')
      .select('aluno_id,titulo,data,distancia')
      .eq('org_id', S.org.id)
      .gte('data', hj)
      .lte('data', somaDias(hj, 60))
      .order('data')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_satisfacao')
      .select('aluno_id,nota,comentario,criado_em')
      .eq('org_id', S.org.id)
      .eq('adiada', false)
      .gte('criado_em', isoT(somaDias(hj, -365)))
      .order('criado_em', { ascending: false })
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const todos = membT.filter((m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const ativoEm = (m, k) =>
    m.criado_em.slice(0, 10) <= k && (m.ativo || (m.desativado_em && m.desativado_em.slice(0, 10) > k));
  const nAt = (k) => todos.filter((m) => ativoEm(m, k)).length;
  const atFim = nAt(mFimEf),
    atIni = nAt(somaDias(mIni, -1)),
    atFimP = nAt(pFimEf),
    atIniP = nAt(somaDias(pIni, -1));
  const novos = todos.filter((m) => m.criado_em.slice(0, 10) >= mIni && m.criado_em.slice(0, 10) <= mFimEf),
    novosP = todos.filter((m) => m.criado_em.slice(0, 10) >= pIni && m.criado_em.slice(0, 10) <= pFimEf);
  const saidas = todos.filter(
      (m) => m.desativado_em && m.desativado_em.slice(0, 10) >= mIni && m.desativado_em.slice(0, 10) <= mFimEf,
    ),
    saidasP = todos.filter(
      (m) => m.desativado_em && m.desativado_em.slice(0, 10) >= pIni && m.desativado_em.slice(0, 10) <= pFimEf,
    );
  const semData = todos.filter((m) => !m.ativo && !m.desativado_em).length;
  const reten = atIni ? ((atIni - saidas.length) / atIni) * 100 : null,
    retenP = atIniP ? ((atIniP - saidasP.length) / atIniP) * 100 : null;
  const vis = new Set(todos.map((m) => m.user_id));
  const corr = corrT.filter((c) => vis.has(c.aluno_id) && ehCorrHist(c)),
    sess = sessT.filter((x) => vis.has(x.aluno_id));
  const entre = (k, a, b) => k >= a && k <= b,
    dK = (t) => isoDia(t);
  const daqui = (a, b) => {
    const cs = corr.filter((c) => entre(dK(c.data), a, b)),
      ss = sess.filter((x) => entre(dK(x.iniciado_em), a, b));
    const ativosIds = todos.filter((m) => ativoEm(m, b)).map((m) => m.user_id);
    const treinaram = new Set([...cs, ...ss].map((x) => x.aluno_id).filter((id) => ativosIds.includes(id)));
    const pl = planoT.filter(
      (p) => vis.has(p.aluno_id) && entre(p.data, a, b) && p.data <= hj && !semCorrida(p) && p.liberado !== false,
    );
    const dias = new Set(corr.map((c) => c.aluno_id + '|' + dK(c.data)));
    const plF = pl.filter((p) => dias.has(p.aluno_id + '|' + p.data)).length;
    const pr = prontT.filter((p) => vis.has(p.aluno_id) && entre(p.dia, a, b)).length;
    const nd = Math.round((dia(b) - dia(a)) / 864e5) + 1;
    return {
      km: cs.reduce((s, c) => s + (+c.distancia_m || 0), 0) / 1000,
      corridas: cs.length,
      forca: ss.length,
      treinaram: treinaram.size,
      ativos: ativosIds.length,
      ader: pl.length ? (plF / pl.length) * 100 : null,
      plTot: pl.length,
      pront: ativosIds.length ? (pr / (ativosIds.length * nd)) * 100 : null,
    };
  };
  const M = daqui(mIni, mFimEf),
    P = daqui(pIni, pFimEf);
  // pesquisa de satisfação: vale a resposta mais recente de cada aluno
  const satUlt = {};
  satT.forEach((x) => {
    if (vis.has(x.aluno_id) && !satUlt[x.aluno_id]) satUlt[x.aluno_id] = x;
  });
  const satR = Object.values(satUlt).filter((x) => diasDesde(x.criado_em) <= 180);
  const satProm = satR.filter((x) => x.nota >= 9).length,
    satDet = satR.filter((x) => x.nota <= 6).length;
  const satNps = satR.length ? Math.round(((satProm - satDet) / satR.length) * 100) : null,
    satMed = satR.length ? satR.reduce((a, x) => a + x.nota, 0) / satR.length : null;
  const porIdSat = Object.fromEntries(membT.map((m) => [m.user_id, m]));
  // alunos em risco: treinando bem menos que antes, ou parados
  const ativosAgora = todos.filter((m) => m.ativo);
  const risco = ativosAgora
    .map((m) => {
      const ts = [
        ...corr.filter((c) => c.aluno_id === m.user_id).map((c) => Date.parse(c.data)),
        ...sess.filter((x) => x.aluno_id === m.user_id).map((x) => Date.parse(x.iniciado_em)),
      ];
      const agora = Date.now(),
        r14 = ts.filter((t) => agora - t < 14 * 864e5).length / 2,
        r28 = ts.filter((t) => agora - t >= 14 * 864e5 && agora - t < 42 * 864e5).length / 4;
      const ult = ts.length ? Math.max(...ts) : null,
        parado = ult ? Math.floor((agora - ult) / 864e5) : null;
      let mot = null;
      if (parado != null && parado >= 10) mot = `Sem treinar há ${parado} dias`;
      else if (r28 >= 1.5 && r14 < r28 * 0.5) mot = `Caiu de ${f1(r28)} para ${f1(r14)} treinos por semana`;
      else if (!ts.length && diasDesde(m.criado_em) > 14) mot = 'Nenhum treino registrado ainda';
      const ns = satUlt[m.user_id];
      if (!mot && ns && ns.nota <= 6 && diasDesde(ns.criado_em) <= 90)
        mot = `Nota ${ns.nota} na pesquisa de satisfação`;
      return mot ? { m, mot, parado } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.parado || 0) - (a.parado || 0));
  // semanas (12)
  const semIni = inicioSemana(dia(mFimEf));
  semIni.setDate(semIni.getDate() - 77);
  const sems = Array.from({ length: 12 }, (_, i) => {
    const a = new Date(semIni.getTime() + i * 7 * 864e5),
      b = new Date(a.getTime() + 7 * 864e5);
    const cs = corr.filter((c) => Date.parse(c.data) >= a && Date.parse(c.data) < b),
      ss = sess.filter((x) => Date.parse(x.iniciado_em) >= a && Date.parse(x.iniciado_em) < b);
    return { a, n: cs.length + ss.length, al: new Set([...cs, ...ss].map((x) => x.aluno_id)).size };
  });
  // perfil da equipe
  const at = ativosAgora;
  const mod = {
    ambos: at.filter((m) => faz('corrida', m) && faz('musculacao', m)).length,
    corrida: at.filter((m) => faz('corrida', m) && !faz('musculacao', m)).length,
    forca: at.filter((m) => !faz('corrida', m) && faz('musculacao', m)).length,
  };
  const sx = { F: at.filter((m) => m.sexo === 'F').length, M: at.filter((m) => m.sexo === 'M').length };
  const idade = (m) =>
    m.nascimento ? Math.floor((Date.now() - Date.parse(m.nascimento + 'T12:00:00')) / (365.25 * 864e5)) : null;
  const faixas = [
    ['Até 24', 0, 24],
    ['25 a 34', 25, 34],
    ['35 a 44', 35, 44],
    ['45 a 54', 45, 54],
    ['55 ou mais', 55, 200],
  ].map(([l, a, b]) => [
    l,
    at.filter((m) => {
      const i = idade(m);
      return i != null && i >= a && i <= b;
    }).length,
  ]);
  const objs = {};
  at.forEach((m) => {
    if (m.objetivo) objs[m.objetivo] = (objs[m.objetivo] || 0) + 1;
  });
  // recordes do mês
  const recM = [];
  at.forEach((m) => {
    const cs = corr.filter((c) => c.aluno_id === m.user_id);
    const ant = {},
      noM = {};
    cs.forEach((c) => {
      const k = dK(c.data),
        alvo = k < mIni ? ant : entre(k, mIni, mFimEf) ? noM : null;
      if (!alvo) return;
      Object.entries(melhoresDaCorrida(c)).forEach(([d, t]) => {
        if (alvo[d] == null || t < alvo[d]) alvo[d] = t;
      });
    });
    DIST_REC.forEach(([d, n]) => {
      if (noM[d] != null && ant[d] != null && noM[d] < ant[d]) recM.push({ m, n, t: noM[d], dif: ant[d] - noM[d] });
    });
  });
  // destaques do mês
  const porAl = at.map((m) => ({
    m,
    km:
      corr
        .filter((c) => c.aluno_id === m.user_id && entre(dK(c.data), mIni, mFimEf))
        .reduce((s, c) => s + (+c.distancia_m || 0), 0) / 1000,
    tr:
      corr.filter((c) => c.aluno_id === m.user_id && entre(dK(c.data), mIni, mFimEf)).length +
      sess.filter((x) => x.aluno_id === m.user_id && entre(dK(x.iniciado_em), mIni, mFimEf)).length,
  }));
  const topKm = porAl
      .filter((x) => x.km > 0)
      .sort((a, b) => b.km - a.km)
      .slice(0, 5),
    topTr = porAl
      .filter((x) => x.tr > 0)
      .sort((a, b) => b.tr - a.tr)
      .slice(0, 5);
  // por treinador
  const equipe = (await equipeLab())
    .map((t) => {
      const meus = at.filter((m) => m.treinador_id === t.user_id);
      const ids = new Set(meus.map((m) => m.user_id));
      const tr = new Set(
        [...corr, ...sess]
          .filter((x) => ids.has(x.aluno_id) && entre(dK(x.data || x.iniciado_em), mIni, mFimEf))
          .map((x) => x.aluno_id),
      ).size;
      return { t, n: meus.length, tr };
    })
    .filter((x) => x.n);
  const semTreinador = at.filter((m) => !m.treinador_id).length;
  const nomeMes = `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][d0.getMonth()]} de ${d0.getFullYear()}`;
  const mAnt = pIni.slice(0, 7),
    mProx = isoDia(new Date(d0.getFullYear(), d0.getMonth() + 1, 15)).slice(0, 7);
  const pctBarra = (n, tot) => (tot ? (n / tot) * 100 : 0);
  const linhaPessoa = (m, dir) =>
    `<a class="rel-mini" href="#/laboratorio/dossie/${m.user_id}" style="color:inherit">${avAluno(m, 'sm')}<span class="grow ellip">${esc(m.nome)}</span><b>${dir}</b></a>`;
  $app.innerHTML = `<div class="no-print"><a class="back" href="#/laboratorio">${I.back} Laboratório Nexos</a>
      <div class="row between" style="gap:10px;flex-wrap:wrap;margin-top:8px"><div class="row" style="gap:6px"><a class="icon-btn sm" href="#/laboratorio/assessoria/${mAnt}" aria-label="Mês anterior">${I.back}</a><b style="min-width:150px;text-align:center">${nomeMes}</b>${ehAtual ? '<span class="icon-btn sm" style="visibility:hidden"></span>' : `<a class="icon-btn sm" href="#/laboratorio/assessoria/${mProx}" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</a>`}</div>
      <button class="btn sm" id="lab-pdf">${I.ficha} Salvar em PDF</button></div></div>
    <article class="lab-doc">
      <header class="lab-cab"><div class="lab-cab-l"><img src="icons/simbolo.svg" alt="" class="lab-logo"><div><p class="lab-marca">Laboratório Nexos</p><h1 class="lab-tit">Visão da assessoria</h1></div></div>
        <div class="lab-at"><div><b>${nomeMes}</b><span>${ehAtual ? `parcial até ${fmtCurto(hj + 'T12:00:00')} · ` : ''}comparação com os mesmos dias do mês anterior</span>${S.me.papel === 'admin' ? '' : '<span>só os seus alunos</span>'}</div></div></header>
      <section class="lab-sec"><h2 class="lab-h">Alunos</h2><div class="lab-kpis">
        ${kpi('Ativos', atFim, labDelta(varPct(atFim, atFimP)))}
        ${kpi('Novos', novos.length, labDelta(varPct(novos.length, novosP.length)))}
        ${kpi('Saídas', saidas.length, labDelta(varPct(saidas.length, saidasP.length), false))}
        ${kpi('Retenção', reten != null ? Math.round(reten) + '%' : '–', retenP != null && reten != null ? labDelta(reten - retenP, true, Math.abs(Math.round(reten - retenP)) + ' p.p.') : '', 'quem estava no início do mês e continuou')}
      </div>${semData ? `<p class="tiny dim">${semData} aluno${semData === 1 ? '' : 's'} desativado${semData === 1 ? '' : 's'} antes de o app registrar a data da saída ficam fora do cálculo de saídas.</p>` : ''}</section>
      <section class="lab-sec"><h2 class="lab-h">Treino da equipe</h2><div class="lab-kpis">
        ${kpi('Treinaram no mês', `${M.treinaram}<small>/${M.ativos}</small>`, labDelta(varPct(M.ativos ? M.treinaram / M.ativos : 0, P.ativos ? P.treinaram / P.ativos : 0)))}
        ${kpi('Planilha cumprida', M.ader != null ? Math.round(M.ader) + '%' : '–', M.ader != null && P.ader != null ? labDelta(M.ader - P.ader, true, Math.abs(Math.round(M.ader - P.ader)) + ' p.p.') : '', 'corrida')}
        ${kpi('Km corridos', f1(M.km, 0), labDelta(varPct(M.km, P.km)))}
        ${kpi('Corridas', M.corridas, labDelta(varPct(M.corridas, P.corridas)))}
        ${kpi('Treinos de força', M.forca, labDelta(varPct(M.forca, P.forca)))}
        ${kpi('Check-ins respondidos', M.pront != null ? Math.round(M.pront) + '%' : '–', M.pront != null && P.pront != null ? labDelta(M.pront - P.pront, true, Math.abs(Math.round(M.pront - P.pront)) + ' p.p.') : '', 'dos dias possíveis')}
      </div>
      <div class="lab-bloco"><div class="lab-bt"><b>Treinos por semana (12 semanas)</b><span class="lab-leg"><i style="background:${corP().p2}"></i>treinos registrados <i style="background:#e0a400"></i>alunos que treinaram</span></div>
        ${labGraf({ barras: sems.map((s) => s.n), linha: sems.map((s) => s.al), rot: sems.map((s) => semanaRot(s.a)), fmtL: (v) => f1(v, 0), maxL: Math.max(2, 2 * Math.ceil(Math.max(...sems.map((s) => s.al)) * 0.6)) })}</div></section>
      <section class="lab-sec"><h2 class="lab-h">Alunos em risco${risco.length ? ` <span class="tag warn">${risco.length}</span>` : ''}</h2>
        ${risco.length ? `<div class="stack">${risco.map((x) => linhaPessoa(x.m, `<span class="small" style="font-weight:600;color:var(--warn)">${esc(x.mot)}</span>`)).join('')}</div><p class="tiny dim" style="margin-top:6px">Treinando menos da metade do que vinha treinando nas 4 semanas anteriores, ou parado há 10 dias ou mais. Quem para de treinar é quem mais costuma cancelar: vale um contato.</p>` : '<p class="small muted">Ninguém com queda forte de frequência agora.</p>'}</section>
      <section class="lab-sec"><h2 class="lab-h">Satisfação dos alunos</h2>
        ${
          satR.length
            ? `<div class="lab-kpis">${kpi('Nota média', f1(satMed), '', 'de 0 a 10')}${kpi('Índice de recomendação', (satNps > 0 ? '+' : '') + satNps, '', 'de -100 a +100')}${kpi('Responderam', `${satR.length}<small>/${atFim}</small>`, '', 'últimos 6 meses')}</div>
        <div class="lab-bloco">${[
          ['Recomendariam (9 e 10)', satProm, '#16a34a'],
          ['Neutros (7 e 8)', satR.length - satProm - satDet, '#e0a400'],
          ['Insatisfeitos (0 a 6)', satDet, '#dc2626'],
        ]
          .map(
            ([l, n, c]) =>
              `<div class="lab-barra"><span>${l}</span><i><i style="width:${pctBarra(n, satR.length)}%;background:${c}"></i></i><b>${n}</b></div>`,
          )
          .join('')}</div>
        ${
          satR.filter((x) => x.comentario || x.nota <= 6).length
            ? `<div class="stack" style="margin-top:10px">${satR
                .filter((x) => x.comentario || x.nota <= 6)
                .sort((a, b) => a.nota - b.nota)
                .slice(0, 12)
                .map((x) => {
                  const m = porIdSat[x.aluno_id] || { nome: 'Aluno' };
                  return `<div class="sat-com"><div class="row" style="gap:10px">${avAluno(m, 'sm')}<b class="grow ellip">${esc(m.nome)}</b><span class="sat-nota ${x.nota >= 9 ? 'ok' : x.nota >= 7 ? 'mid' : 'bad'}">${x.nota}</span></div>${x.comentario ? `<p class="small" style="margin-top:6px">${esc(x.comentario)}</p>` : ''}<p class="tiny dim" style="margin-top:4px">${fmtCurto(x.criado_em)}</p></div>`;
                })
                .join('')}</div>`
            : ''
        }
        <p class="tiny dim" style="margin-top:8px">A pesquisa aparece para cada aluno a cada 3 meses. Índice de recomendação = % que dá 9 ou 10 menos % que dá 0 a 6. Nota 6 ou menor também entra em Alunos em risco.</p>`
            : '<p class="tiny dim">Ainda sem respostas. A pesquisa aparece para cada aluno depois de 3 meses de assessoria e se repete a cada 3 meses.</p>'
        }</section>
      <section class="lab-sec"><h2 class="lab-h">Perfil da equipe</h2><div class="lab-2">
        <div class="lab-bloco"><div class="lab-bt"><b>Modalidade</b></div>${[
          ['Corrida e força', mod.ambos, corP().p2],
          ['Só corrida', mod.corrida, corP().p1],
          ['Só força', mod.forca, corP().h1],
        ]
          .map(
            ([l, n, c]) =>
              `<div class="lab-barra"><span>${l}</span><i><i style="width:${pctBarra(n, at.length)}%;background:${c}"></i></i><b>${n}</b></div>`,
          )
          .join('')}
          <div class="lab-bt" style="margin-top:14px"><b>Sexo</b></div>${[
            ['Mulheres', sx.F, '#e85d75'],
            ['Homens', sx.M, corP().p2],
          ]
            .map(
              ([l, n, c]) =>
                `<div class="lab-barra"><span>${l}</span><i><i style="width:${pctBarra(n, at.length)}%;background:${c}"></i></i><b>${n}</b></div>`,
            )
            .join('')}</div>
        <div class="lab-bloco"><div class="lab-bt"><b>Faixa de idade</b></div>${faixas.map(([l, n]) => `<div class="lab-barra"><span>${l}</span><i><i style="width:${pctBarra(n, Math.max(...faixas.map((f) => f[1]), 1))}%;background:#1fb0ec"></i></i><b>${n}</b></div>`).join('')}
          ${
            Object.keys(objs).length
              ? `<div class="lab-bt" style="margin-top:14px"><b>Objetivo principal</b></div>${Object.entries(objs)
                  .sort((a, b) => b[1] - a[1])
                  .map(
                    ([k, n]) =>
                      `<div class="lab-barra"><span>${esc((OBJETIVOS.find((o) => o[0] === k) || [, k])[1])}</span><i><i style="width:${pctBarra(n, at.length)}%;background:${corP().h1}"></i></i><b>${n}</b></div>`,
                  )
                  .join('')}`
              : ''
          }</div>
      </div></section>
      <section class="lab-sec"><h2 class="lab-h">Destaques do mês</h2><div class="lab-3">
        <div class="lab-bloco"><div class="lab-bt"><b>Mais quilômetros</b></div>${topKm.map((x) => linhaPessoa(x.m, f1(x.km) + ' km')).join('') || '<p class="tiny dim">Nenhuma corrida.</p>'}</div>
        <div class="lab-bloco"><div class="lab-bt"><b>Mais treinos</b></div>${topTr.map((x) => linhaPessoa(x.m, x.tr + ' treino' + (x.tr === 1 ? '' : 's'))).join('') || '<p class="tiny dim">Nenhum treino.</p>'}</div>
        <div class="lab-bloco"><div class="lab-bt"><b>Recordes batidos</b></div>${
          recM
            .sort((a, b) => b.dif - a.dif)
            .slice(0, 6)
            .map((r) => linhaPessoa(r.m, `${r.n} ${fmtDurLongo(r.t)}`))
            .join('') || '<p class="tiny dim">Nenhum recorde novo.</p>'
        }</div>
      </div></section>
      <section class="lab-sec"><h2 class="lab-h">Provas nos próximos 60 dias</h2>${
        provasT.filter((p) => vis.has(p.aluno_id)).length
          ? `<table class="lab-tab"><thead><tr><th>Data</th><th>Prova</th><th>Distância</th><th>Aluno</th></tr></thead><tbody>${provasT
              .filter((p) => vis.has(p.aluno_id))
              .map(
                (p) =>
                  `<tr><td>${fmtCurto(p.data + 'T12:00:00')}</td><td>${esc(p.titulo || 'Prova')}</td><td>${esc(p.distancia || '–')}</td><td>${esc((todos.find((m) => m.user_id === p.aluno_id) || {}).nome || '')}</td></tr>`,
              )
              .join('')}</tbody></table>`
          : '<p class="small muted">Nenhum aluno inscrito em prova nos próximos 60 dias.</p>'
      }</section>
      ${equipe.length > 1 || semTreinador ? `<section class="lab-sec"><h2 class="lab-h">Por treinador</h2><table class="lab-tab"><thead><tr><th>Treinador</th><th>Alunos ativos</th><th>Treinaram no mês</th></tr></thead><tbody>${equipe.map((x) => `<tr><td>${esc(x.t.nome)}</td><td>${x.n}</td><td>${x.tr} (${Math.round(pctBarra(x.tr, x.n))}%)</td></tr>`).join('')}${semTreinador ? `<tr><td>Sem treinador definido</td><td>${semTreinador}</td><td>–</td></tr>` : ''}</tbody></table></section>` : ''}
      <footer class="lab-rod"><span>Nexos Performance e Saúde · Laboratório Nexos</span><span>Gerado em ${fmtCurto(hj + 'T12:00:00')}. O financeiro entra aqui quando os pagamentos forem ativados.</span></footer>
    </article>`;
  document.getElementById('lab-pdf').onclick = () => window.print();
}

async function todasAsLinhas(fab) {
  // busca em páginas de 1000 (o limite do banco)
  let tudo = [],
    de = 0;
  for (;;) {
    const { data, error } = await fab().range(de, de + 999);
    if (error) throw error;
    tudo = tudo.concat(data || []);
    if (!data || data.length < 1000) break;
    de += 1000;
  }
  return tudo;
}
const REL_PER = [
  ['4s', '4 semanas', 28],
  ['3m', '3 meses', 91],
  ['6m', '6 meses', 182],
];
async function staffRelatorios() {
  loading();
  const st = S.cache.relSt || (S.cache.relSt = { per: '4s', ord: 'atencao', f: 'todos', q: '' });
  const dias = REL_PER.find((p) => p[0] === st.per)[2];
  const agora = Date.now(),
    t1 = agora,
    t0 = agora - dias * 864e5,
    tA = t0 - dias * 864e5;
  const iso = (t) => new Date(t).toISOString();
  const [membrosT, corrT, sessT, planoT] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades,corrida,nascimento,criado_em')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome')
      .then((r) => r.data || []),
    todasAsLinhas(() =>
      sb
        .from('nx_corridas')
        .select('id,aluno_id,data,tipo,distancia_m,duracao_s,fc_media,rpe,dor,plano_id')
        .eq('org_id', S.org.id)
        .gte('data', iso(tA - 42 * 864e5))
        .order('data'),
    ),
    todasAsLinhas(() =>
      sb
        .from('nx_sessoes')
        .select('aluno_id,iniciado_em')
        .eq('org_id', S.org.id)
        .not('finalizado_em', 'is', null)
        .gte('iniciado_em', iso(tA))
        .order('iniciado_em'),
    ),
    todasAsLinhas(() =>
      sb
        .from('nx_plano_corrida')
        .select('id,aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .gte('data', isoDia(t0))
        .lte('data', hojeISO())
        .order('data'),
    ),
  ]);
  const alunos = membrosT.filter(
    (m) => ehMeuAluno(m) && m.ativo && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado',
  );
  const vis = new Set(alunos.map((m) => m.user_id));
  const corr = corrT.filter((c) => vis.has(c.aluno_id) && ehCorr(c)),
    sess = sessT.filter((x) => vis.has(x.aluno_id));
  const plano = planoT.filter((p) => vis.has(p.aluno_id) && !semCorrida(p) && p.liberado !== false);
  const feitos = new Set(corr.map((c) => c.plano_id).filter(Boolean));
  const noPer = (t, a, b) => t > a && t <= b;
  const linhas = alunos.map((m) => {
    const cs = corr.filter((c) => c.aluno_id === m.user_id),
      ss = sess.filter((x) => x.aluno_id === m.user_id);
    const cP = cs.filter((c) => noPer(Date.parse(c.data), t0, t1)),
      cA = cs.filter((c) => noPer(Date.parse(c.data), tA, t0));
    const km = cP.reduce((a, c) => a + c.distancia_m, 0) / 1000,
      kmA = cA.reduce((a, c) => a + c.distancia_m, 0) / 1000;
    const paceM = (l) => {
      const x = l.filter((c) => c.distancia_m >= 3000);
      const d = x.reduce((a, c) => a + c.distancia_m, 0);
      return d ? x.reduce((a, c) => a + c.duracao_s, 0) / (d / 1000) : null;
    };
    const forca = ss.filter((x) => noPer(Date.parse(x.iniciado_em), t0, t1)).length,
      forcaA = ss.filter((x) => noPer(Date.parse(x.iniciado_em), tA, t0)).length;
    const pl = plano.filter((p) => p.aluno_id === m.user_id),
      plF = pl.filter((p) => feitos.has(p.id)).length;
    const perfil = perfilCorrida(m);
    const pv1 = faz('corrida', m) ? previsaoEm(cs, perfil, t1) : null,
      pv0 = faz('corrida', m) ? previsaoEm(cs, perfil, t0) : null;
    const ult = [...cs.map((c) => Date.parse(c.data)), ...ss.map((x) => Date.parse(x.iniciado_em))].reduce(
      (a, b) => Math.max(a, b),
      0,
    );
    const parado = ult ? Math.floor((agora - ult) / 864e5) : null;
    const dor = cP.filter((c) => c.dor).length;
    const ader = pl.length ? Math.round((plF / pl.length) * 100) : null;
    const alertas = [];
    if (parado == null || parado >= 7)
      alertas.push(parado == null ? 'Nenhum treino registrado' : `Sem treinar há ${parado} dias`);
    if (dor) alertas.push(`Relatou dor ${dor === 1 ? '1 vez' : dor + ' vezes'}`);
    if (ader != null && pl.length >= 3 && ader < 50) alertas.push(`Cumpriu só ${ader}% da planilha`);
    if (kmA >= 10 && km < kmA * 0.6) alertas.push(`Volume caiu ${Math.round((1 - km / kmA) * 100)}%`);
    return {
      m,
      km,
      kmA,
      corridas: cP.length,
      forca,
      forcaA,
      ader,
      plTot: pl.length,
      plF,
      pace: paceM(cP),
      paceA: paceM(cA),
      p10: pv1 && pv1.tempos[1],
      p10A: pv0 && pv0.tempos[1],
      ult,
      parado,
      dor,
      alertas,
    };
  });
  // números da equipe
  const soma = (k) => linhas.reduce((a, l) => a + (l[k] || 0), 0);
  const kmT = soma('km'),
    kmTA = soma('kmA'),
    forT = soma('forca'),
    forTA = soma('forcaA'),
    corT = soma('corridas');
  const plTot = soma('plTot'),
    plF = soma('plF'),
    treinando = linhas.filter((l) => l.parado != null && l.parado < 7).length;
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const dTag = (v, inverso) =>
    v == null || !isFinite(v) || v === 0
      ? ''
      : `<em class="rel-d ${v > 0 !== !!inverso ? 'bom' : 'ruim'}">${v > 0 ? '▲' : '▼'} ${Math.abs(v)}%</em>`;
  // km e força por semana (equipe)
  const nSem = Math.round(dias / 7),
    semIni = inicioSemana(new Date(t1));
  semIni.setDate(semIni.getDate() - (nSem - 1) * 7);
  const semanas = Array.from({ length: nSem }, (_, i) => {
    const a = new Date(semIni);
    a.setDate(a.getDate() + i * 7);
    const b = new Date(a);
    b.setDate(b.getDate() + 7);
    return {
      ini: a,
      km:
        corr.filter((c) => Date.parse(c.data) >= a && Date.parse(c.data) < b).reduce((s, c) => s + c.distancia_m, 0) /
        1000,
      fo: sess.filter((x) => Date.parse(x.iniciado_em) >= a && Date.parse(x.iniciado_em) < b).length,
    };
  });
  const maxKm = Math.max(10, ...semanas.map((s) => s.km)),
    maxFo = Math.max(3, ...semanas.map((s) => s.fo));
  const evol = linhas
    .filter((l) => l.p10 && l.p10A && l.p10A - l.p10 >= 5)
    .sort((a, b) => b.p10A - b.p10 - (a.p10A - a.p10))
    .slice(0, 5);
  const volume = linhas
    .filter((l) => l.km > 0)
    .sort((a, b) => b.km - a.km)
    .slice(0, 5);
  const consta = linhas
    .filter((l) => l.ader != null && l.plTot >= 3)
    .sort((a, b) => b.ader - a.ader || b.plTot - a.plTot)
    .slice(0, 5);
  const atencao = linhas.filter((l) => l.alertas.length);
  const nomeLink = (l, extra) =>
    `<a class="rel-mini" href="#/aluno/${l.m.user_id}" style="color:inherit">${avAluno(l.m, 'sm')}<span class="grow ellip">${esc(l.m.nome)}</span><b>${extra}</b></a>`;
  const per = REL_PER.find((p) => p[0] === st.per)[1];
  dockStaff();
  $app.innerHTML = `
    <a class="back" href="#/laboratorio">${I.back} Laboratório Nexos</a><p class="eyebrow">Laboratório Nexos</p><h1 class="h1">Evolução dos seus alunos</h1>
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
        <select class="select" id="rel-ord">${[
          ['atencao', 'Precisam de atenção primeiro'],
          ['nome', 'Nome'],
          ['km', 'Mais km'],
          ['evol', 'Maior evolução nos 10 km'],
          ['ader', 'Planilha cumprida'],
          ['forca', 'Mais treinos de força'],
          ['parado', 'Mais tempo sem treinar'],
        ]
          .map(([k, l]) => `<option value="${k}" ${st.ord === k ? 'selected' : ''}>${l}</option>`)
          .join('')}</select></div>
      <div class="rel-tab" id="rel-tab"></div></div>
    <p class="tiny dim" style="margin-top:14px">Km e pace contam só corridas. Pace médio considera corridas de 3 km ou mais. A previsão dos 10 km usa as equações de Jack Daniels com as corridas das 6 semanas anteriores a cada data. Planilha cumprida: treinos liberados até hoje que têm corrida ligada.</p>`;
  const linhaHTML = (l) => {
    const dKm = l.kmA ? pct(l.km, l.kmA) : null,
      dPace = l.pace && l.paceA ? Math.round(l.pace - l.paceA) : null,
      d10 = l.p10 && l.p10A ? Math.round(l.p10 - l.p10A) : null;
    const seta = (v, txt) =>
      v == null || Math.abs(v) < 1
        ? ''
        : `<em class="rel-d ${v < 0 ? 'bom' : 'ruim'}">${v < 0 ? '▼' : '▲'} ${txt}</em>`;
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
    atencao: (a, b) => b.alertas.length - a.alertas.length || a.m.nome.localeCompare(b.m.nome, 'pt'),
    nome: (a, b) => a.m.nome.localeCompare(b.m.nome, 'pt'),
    km: (a, b) => b.km - a.km,
    evol: (a, b) => (b.p10A && b.p10 ? b.p10A - b.p10 : -1e9) - (a.p10A && a.p10 ? a.p10A - a.p10 : -1e9),
    ader: (a, b) => (b.ader ?? -1) - (a.ader ?? -1),
    forca: (a, b) => b.forca - a.forca,
    parado: (a, b) => (b.parado ?? 1e9) - (a.parado ?? 1e9),
  };
  const tabela = () => {
    const nq = semAcento(st.q);
    const l = linhas.filter((x) => !nq || semAcento(x.m.nome).includes(nq)).sort(ordenar[st.ord]);
    document.getElementById('rel-tab').innerHTML =
      `<div class="rel-thead"><span>Aluno</span><span>Km</span><span>Corridas</span><span>Força</span><span>Planilha</span><span>Pace médio</span><span>10 km previsto</span><span></span></div>` +
      (l.map(linhaHTML).join('') || '<div class="empty"><p class="small">Nenhum aluno encontrado.</p></div>');
  };
  tabela();
  document.getElementById('rel-q').oninput = (e) => {
    st.q = e.target.value;
    tabela();
  };
  document.getElementById('rel-ord').onchange = (e) => {
    st.ord = e.target.value;
    tabela();
  };
  $app.querySelector('.rel-per').onclick = (e) => {
    const b = e.target.closest('[data-per]');
    if (b && b.dataset.per !== st.per) {
      st.per = b.dataset.per;
      staffRelatorios();
    }
  };
  document.getElementById('rel-csv').onclick = () => {
    const cab = [
      'Aluno',
      'Km',
      'Km período anterior',
      'Corridas',
      'Treinos de força',
      'Planilha cumprida (%)',
      'Pace médio (min/km)',
      'Pace anterior (min/km)',
      '10 km previsto',
      '10 km previsto no início',
      'Dias sem treinar',
      'Alertas',
    ];
    const cel = (v) => {
      const t = String(v ?? '');
      return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const linhasCsv = linhas
      .slice()
      .sort(ordenar.nome)
      .map((l) =>
        [
          l.m.nome,
          f1(l.km),
          f1(l.kmA),
          l.corridas,
          l.forca,
          l.ader ?? '',
          l.pace ? fmtPace(l.pace).replace('/km', '') : '',
          l.paceA ? fmtPace(l.paceA).replace('/km', '') : '',
          l.p10 ? fmtDurLongo(l.p10) : '',
          l.p10A ? fmtDurLongo(l.p10A) : '',
          l.parado ?? '',
          l.alertas.join(' | '),
        ]
          .map(cel)
          .join(';'),
      );
    const blob = new Blob(['﻿' + [cab.join(';'), ...linhasCsv].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Relatorio-Nexos-${per.replace(' ', '-')}-${hojeISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Planilha baixada! Abre no Excel ou no Google Planilhas.');
  };
}

/* ---------- saúde do sistema (equipe) ---------- */
const fmtDH = (d) =>
  new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const MSG_SAUDE = {
  garmin: (n) =>
    `Oi, ${n}! Aqui é o ${firstName(S.me.nome)}, da Nexos. Seu Garmin parou de sincronizar com o app. Para resolver: abra o app da Nexos, vá em Mais > Conexões, toque em Desconectar e depois em Conectar Garmin. Leva 1 minuto.`,
  push: (n) =>
    `Oi, ${n}! Aqui é o ${firstName(S.me.nome)}, da Nexos. Ative as notificações do app para receber os lembretes, o treino do dia e as minhas mensagens: abra o app, vá em Mais e toque em Ativar, em Notificações. No iPhone, antes adicione o app à tela de início (Compartilhar > Adicionar à Tela de Início) e abra por lá.`,
};
function saudeStatus(d) {
  const out = [];
  const e = d.erros || {};
  out.push({
    k: 'erros',
    t: 'Erros do app',
    nivel: e.novos_24h ? 'err' : e.abertos ? 'warn' : 'ok',
    res: e.abertos
      ? `${e.abertos} erro${e.abertos > 1 ? 's' : ''} em aberto${e.novos_24h ? `, ${e.novos_24h} nas últimas 24 h` : ''}`
      : 'Nenhum erro em aberto',
    linhas: (e.lista || []).map((x) => ({
      html: `${esc(String(x.msg || '').slice(0, 90))} <span class="tiny dim">· ${x.vezes}× · ${(x.usuarios || []).length} pessoa${(x.usuarios || []).length === 1 ? '' : 's'} · ${fmtDH(x.ultimo_em)}</span>`,
      bts: [
        ['copiar', x.id, 'Copiar relatório'],
        ['resolver', x.id, 'Marcar resolvido'],
      ],
    })),
    acao: e.abertos
      ? 'Copie o relatório e cole aqui no Claude para eu corrigir. Se o erro for de uma versão antiga do app, forçar a atualização já resolve.'
      : '',
    bts: [
      [
        'forcar',
        '',
        d.versao_forcada
          ? `Forçar atualização do app (última: ${fmtDH(d.versao_forcada)})`
          : 'Forçar atualização do app',
      ],
      ...(e.abertos ? [['link', '#/erros', 'Ver todos os detalhes']] : []),
    ],
  });
  const gErr = (d.garmin || []).filter((x) => x.erro),
    gVelho = (d.garmin || []).filter((x) => !x.erro);
  out.push({
    k: 'garmin',
    t: 'Garmin',
    nivel: gErr.length ? 'err' : gVelho.length ? 'warn' : 'ok',
    res: !d.garmin_total
      ? 'Nenhum aluno conectado ainda'
      : gErr.length || gVelho.length
        ? [
            gErr.length ? `${gErr.length} com erro na conexão` : '',
            gVelho.length ? `${gVelho.length} sem sincronizar há mais de 4 dias` : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : `${d.garmin_total} aluno${d.garmin_total > 1 ? 's' : ''} conectado${d.garmin_total > 1 ? 's' : ''}, tudo sincronizando`,
    linhas: [...gErr, ...gVelho].map((x) => ({
      html: `<b>${esc(x.nome)}</b>: ${x.erro ? esc(String(x.erro).slice(0, 80)) : `última sincronização ${x.ultima_sync ? fmtDH(x.ultima_sync) : 'nunca'}`}`,
      bts: [
        ['buscar', x.user_id, 'Buscar atividades'],
        ['wa', `garmin|${x.user_id}`, 'Pedir para reconectar'],
      ],
    })),
    acao:
      gErr.length || gVelho.length
        ? 'Primeiro toque em Buscar atividades. Se não resolver, peça para o aluno reconectar: o WhatsApp abre com a mensagem pronta e ela também vai para a conversa do app.'
        : '',
  });
  const tf = d.treinos_fora_relogio || [];
  const porAl = Object.values(
    tf.reduce((a, x) => {
      (a[x.aluno_id] = a[x.aluno_id] || { aluno_id: x.aluno_id, nome: x.nome, itens: [] }).itens.push(x);
      return a;
    }, {}),
  );
  out.push({
    k: 'relogio',
    t: 'Treinos no relógio',
    nivel: tf.some((x) => x.erro) ? 'err' : tf.length ? 'warn' : 'ok',
    res: tf.length
      ? `${tf.length} treino${tf.length > 1 ? 's' : ''} dos próximos 2 dias ainda não ${tf.length > 1 ? 'foram' : 'foi'} para o relógio`
      : 'Treinos dos próximos dias já estão nos relógios',
    linhas: porAl.map((g) => ({
      html: `<b>${esc(g.nome)}</b>: ${g.itens.map((x) => `${esc(x.titulo || 'treino')} (${fmtCurto(x.data)})`).join(', ')}${g.itens.some((x) => x.erro) ? ` · <span style="color:var(--err)">${esc(String(g.itens.find((x) => x.erro).erro).slice(0, 60))}</span>` : ''}`,
      bts: [['enviar', g.aluno_id, 'Enviar agora']],
    })),
    acao: '',
  });
  const sp = d.sem_push || [],
    pf = d.push_falhas || [];
  out.push({
    k: 'push',
    t: 'Notificações',
    nivel: pf.some((x) => x.motivo !== 'inscrição expirada') ? 'err' : sp.length || pf.length ? 'warn' : 'ok',
    res: [
      sp.length
        ? `${sp.length} de ${d.alunos_ativos} aluno${d.alunos_ativos > 1 ? 's' : ''} sem notificações ativas`
        : `Todos os ${d.alunos_ativos} alunos recebem notificações`,
      pf.length ? `${pf.length} falha${pf.length > 1 ? 's' : ''} de envio na semana` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    linhas: [
      ...sp.map((x) => ({
        html: `<b>${esc(x.nome)}</b>: notificações desligadas`,
        bts: [['wa', `push|${x.user_id}`, 'Pedir para ativar']],
      })),
      ...pf
        .filter((x) => !sp.some((y) => y.user_id === x.user_id))
        .slice(0, 6)
        .map((x) => ({
          html: `<b>${esc(x.nome || 'Usuário')}</b>: ${esc(x.motivo || 'falha')} (${fmtDH(x.quando)})`,
          bts: x.user_id ? [['wa', `push|${x.user_id}`, 'Pedir para ativar de novo']] : [],
        })),
    ],
    acao:
      sp.length || pf.length
        ? 'Sem notificação, o aluno não recebe lembretes de água, o treino do dia nem as suas mensagens no celular.'
        : '',
    bts: sp.length > 1 ? [['todos-push', '', `Mandar o passo a passo no app para os ${sp.length}`]] : [],
  });
  const ag = d.agendador || [],
    falhou = ag.filter((x) => x.status === 'failed');
  const NOME_JOB = (n) =>
    n === 'nx-avisos-manha'
      ? 'Bom dia com o treino'
      : /^nx-agua/.test(n)
        ? 'Lembretes de água (das 8h40 às 19h40, no intervalo de cada aluno)'
        : n;
  // cada envio registra início e fim: o que não terminou (ou terminou com erro) acende aqui
  const ex = d.avisos || [],
    exFalhos = ex.filter((x) => x.ok === false || (!x.terminado && Date.now() - Date.parse(x.iniciado) > 10 * 60000));
  const NOME_AC = {
    agua: 'Lembrete de água',
    manha: 'Avisos da manhã',
    saude: 'Checagem do sistema',
    carga: 'Alerta de carga',
    ciclo: 'Lembrete do ciclo',
    marcos: 'Datas especiais',
    faltas: 'Faltas de ontem',
    resumo: 'Resumo da semana',
  };
  const linhasEx = ex.slice(0, 8).map((x) => {
    const enviados = x.resumo && x.resumo.agua ? x.resumo.agua.enviados : null;
    const st =
      x.ok === false
        ? `<span style="color:var(--err)">não terminou: ${esc(x.erro || 'erro')}</span>`
        : !x.terminado
          ? Date.now() - Date.parse(x.iniciado) > 10 * 60000
            ? '<span style="color:var(--err)">começou e não terminou</span>'
            : 'enviando agora'
          : `terminou${enviados != null ? `, ${enviados} entregue${enviados === 1 ? '' : 's'}` : ''}`;
    return { html: `${NOME_AC[x.acao] || esc(x.acao)} · ${fmtDH(x.iniciado)}: ${st}`, bts: [] };
  });
  out.push({
    k: 'auto',
    t: 'Avisos automáticos',
    nivel: falhou.length || exFalhos.length ? 'err' : 'ok',
    res: exFalhos.length
      ? `${exFalhos.length} envio${exFalhos.length > 1 ? 's' : ''} que não ${exFalhos.length > 1 ? 'terminaram' : 'terminou'} nas últimas 24 h`
      : falhou.length
        ? `${falhou.length} aviso${falhou.length > 1 ? 's' : ''} com falha na última execução`
        : ex.length
          ? `Todos os envios das últimas 24 h terminaram (${ex.length})`
          : 'Rodando nos horários certos',
    linhas: [
      ...linhasEx,
      ...ag.map((x) => ({
        html: `${NOME_JOB(x.nome)}: ${x.status === 'succeeded' ? `ok (${fmtDH(x.quando)})` : x.status === 'failed' ? `<span style="color:var(--err)">falhou (${fmtDH(x.quando)})</span>` : 'ainda não rodou (começa no próximo horário)'}`,
        bts: x.status === 'failed' ? [['rodar', x.nome, 'Rodar de novo agora']] : [],
      })),
    ],
    acao:
      falhou.length || exFalhos.length
        ? 'Toque em Rodar de novo agora. Se falhar outra vez, copie a linha e me mande.'
        : '',
    sempreLista: true,
  });
  return out;
}
function relatorioErroTxt(x) {
  return [
    `Erro no app da Nexos (painel Saúde do sistema)`,
    `Mensagem: ${x.msg}`,
    `Tela: ${x.url || '-'} · área: ${x.area || '-'}`,
    `Versão: ${x.versao || '-'}`,
    `Vezes: ${x.vezes} · pessoas: ${(x.usuarios || []).length}`,
    `Primeira vez: ${fmtDH(x.primeiro_em || x.ultimo_em)} · última: ${fmtDH(x.ultimo_em)}`,
    `Aparelho: ${x.ua || '-'}`,
    `Detalhes técnicos:`,
    x.stack || '-',
  ].join('\n');
}
async function copiarTexto(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    ta.remove();
    return ok;
  }
}
async function staffSaudeSistema(dadoPronto) {
  dockStaff();
  if (!dadoPronto) loading();
  const { data, error } = dadoPronto ? { data: dadoPronto } : await sb.rpc('nx_saude_sistema', { p_org: S.org.id });
  if (error || !data) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Não foi possível checar agora</div><p class="small">Tente de novo em instantes.</p></div>';
    return;
  }
  const st = saudeStatus(data),
    prob = st.filter((x) => x.nivel !== 'ok');
  S.cache.saudeProb = prob.length;
  S.cache.saudeVerm = st.some((x) => x.nivel === 'err');
  const bt = ([a, v, l], cls = 'btn ghost sm') =>
    a === 'link'
      ? `<a class="${cls}" href="${v}">${l}</a>`
      : `<button type="button" class="${cls}" data-ss="${a}" data-v="${esc(v)}">${l}</button>`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Sistema</p><h1 class="h1">Saúde do sistema</h1>
    <div class="ss-resumo ${S.cache.saudeVerm ? 'err' : prob.length ? 'warn' : 'ok'}"><i></i><div><b>${prob.length ? `${prob.length} ponto${prob.length > 1 ? 's' : ''} de atenção` : 'Tudo funcionando'}</b><span>Checado agora, ${fmtDH(data.agora)}</span></div><button class="btn ghost sm" id="ss-atual">Atualizar</button></div>
    <div class="stack" style="margin-top:14px">${st
      .map(
        (
          x,
        ) => `<div class="card ss-item ${x.nivel}"><div class="row" style="gap:10px;align-items:flex-start"><i class="ss-dot"></i><div class="grow"><b>${x.t}</b><p class="small muted">${x.res}</p></div></div>
      ${x.linhas.length && (x.nivel !== 'ok' || x.sempreLista) ? `<div class="ss-lista">${x.linhas.map((l) => `<div class="ss-l"><span>${l.html}</span>${l.bts.length ? `<div class="ss-bts">${l.bts.map((b) => bt(b, 'ss-b')).join('')}</div>` : ''}</div>`).join('')}</div>` : ''}
      ${x.acao ? `<p class="ss-acao">${x.acao}</p>` : ''}${(x.bts || []).length ? `<div class="row ss-acoes">${x.bts.map((b) => bt(b)).join('')}</div>` : ''}</div>`,
      )
      .join('')}</div>
    <p class="tiny dim" style="margin-top:14px">Todo dia de manhã o app checa isso sozinho. Se tiver algo em vermelho, vocês recebem uma notificação.</p>`;
  document.getElementById('ss-atual').onclick = () => staffSaudeSistema();
  const msgNoApp = async (alunoId, texto) => {
    const { data: nm } = await sb
      .from('nx_mensagens')
      .insert({ org_id: S.org.id, aluno_id: alunoId, autor_id: S.user.id, texto })
      .select('id')
      .single();
    if (nm) notificar('mensagem', nm.id);
    return !!nm;
  };
  const pessoa = (id) =>
    [...(data.garmin || []), ...(data.sem_push || []), ...(data.push_falhas || [])].find((x) => x.user_id === id) || {};
  $app.onclick = async (ev) => {
    const b = ev.target.closest('[data-ss]');
    if (!b) return;
    const a = b.dataset.ss,
      v = b.dataset.v,
      txt0 = b.textContent;
    const ocupado = (t) => {
        b.disabled = true;
        b.textContent = t;
      },
      pronto = (t) => {
        b.textContent = t;
        setTimeout(() => {
          b.textContent = txt0;
          b.disabled = false;
        }, 2500);
      };
    try {
      if (a === 'copiar') {
        const x = ((data.erros || {}).lista || []).find((y) => String(y.id) === v);
        if (x && (await copiarTexto(relatorioErroTxt(x)))) {
          toast('Relatório copiado. Cole aqui no Claude.');
          pronto('Copiado');
        } else toast('Não foi possível copiar.', true);
        return;
      }
      if (a === 'resolver') {
        ocupado('Salvando…');
        const { error: er } = await sb.from('nx_erros').update({ resolvido: true }).eq('id', v);
        if (er) throw er;
        toast('Marcado como resolvido.');
        return staffSaudeSistema();
      }
      if (a === 'forcar') {
        ocupado('Enviando…');
        const { error: er } = await sb.rpc('nx_forcar_atualizacao', { p_org: S.org.id });
        if (er) throw er;
        toast('Pronto. Na próxima vez que abrirem o app, todos recebem a versão mais nova.');
        return staffSaudeSistema();
      }
      if (a === 'buscar') {
        ocupado('Pedindo ao Garmin…');
        const { data: r, error: er } = await sb.functions.invoke('nx-garmin-busca', { body: { aluno_id: v, dias: 7 } });
        if (er) throw er;
        if (r && r.erro) {
          toast(r.erro, true);
          b.textContent = txt0;
          b.disabled = false;
          return;
        }
        toast('Pedido feito. As atividades dos últimos 7 dias chegam em alguns minutos.');
        pronto('Pedido feito');
        return;
      }
      if (a === 'wa') {
        const [tipo, id] = v.split('|'),
          p = pessoa(id),
          nome = firstName(p.nome || 'aluno'),
          texto = MSG_SAUDE[tipo](nome),
          tel = telWa(p.telefone);
        if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        await msgNoApp(id, texto).catch(() => false);
        toast(
          tel
            ? 'WhatsApp aberto com a mensagem. Ela também foi para a conversa do app.'
            : 'Aluno sem telefone cadastrado: a mensagem foi para a conversa do app.',
        );
        pronto('Enviado');
        return;
      }
      if (a === 'todos-push') {
        ocupado('Enviando…');
        let n = 0;
        for (const p of data.sem_push || [])
          if (await msgNoApp(p.user_id, MSG_SAUDE.push(firstName(p.nome || 'aluno'))).catch(() => false)) n++;
        toast(`Passo a passo enviado na conversa do app para ${n} aluno${n === 1 ? '' : 's'}.`);
        pronto('Enviado');
        return;
      }
      if (a === 'enviar') {
        ocupado('Enviando…');
        const ids = (data.treinos_fora_relogio || []).filter((x) => x.aluno_id === v).map((x) => x.id);
        const [{ data: pl }, { data: mb }] = await Promise.all([
          sb.from('nx_plano_corrida').select('*').in('id', ids),
          sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', v).maybeSingle(),
        ]);
        const r = await enviarGarmin(v, pl || [], perfilCorrida(mb || {}));
        if (r && r.erros) toast(`${r.enviados || 0} enviado(s), ${r.erros} com erro. Veja o motivo na lista.`, true);
        else toast(`${(r && r.enviados) || 0} treino(s) enviado(s) ao relógio.`);
        return staffSaudeSistema();
      }
      if (a === 'rodar') {
        const h = new Date().getHours();
        if (/agua/.test(v) && (h >= 21 || h < 7))
          return toast(
            'Lembrete de água fora de hora acordaria os alunos. Ele roda de novo amanhã no horário certo.',
            true,
          );
        ocupado('Rodando…');
        const { error: er } = await sb.rpc('nx_rodar_aviso', { p_org: S.org.id, p_job: v });
        if (er) throw er;
        toast('Aviso disparado. Atualize em 1 minuto para conferir.');
        pronto('Disparado');
        return;
      }
    } catch (er) {
      console.error(er);
      toast('Não foi possível agora. Tente de novo.', true);
      b.textContent = txt0;
      b.disabled = false;
    }
  };
}
function staffMais() {
  dockStaff();
  if (S.cache.saudeProb == null)
    sb.rpc('nx_saude_sistema', { p_org: S.org.id })
      .then(({ data }) => {
        if (!data) return;
        const st = saudeStatus(data);
        S.cache.saudeProb = st.filter((x) => x.nivel !== 'ok').length;
        S.cache.saudeVerm = st.some((x) => x.nivel === 'err');
        if (S.cache.saudeProb && location.hash === '#/mais') staffMais();
      })
      .catch(() => {});
  if (S.cache.fichasNovas == null)
    Promise.all([
      sb.from('nx_form_respostas').select('form_id').eq('org_id', S.org.id).eq('visto', false),
      sb.from('nx_formularios').select('id,criado_por').eq('org_id', S.org.id),
    ])
      .then(([r, f]) => {
        const meus = new Set((f.data || []).filter(formMeu).map((x) => x.id));
        S.cache.fichasNovas = (r.data || []).filter((x) => !x.form_id || meus.has(x.form_id)).length;
        if (S.cache.fichasNovas && location.hash === '#/mais') staffMais();
      })
      .catch(() => {});
  if (S.cache.errosAbertos == null)
    sb.from('nx_erros')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', S.org.id)
      .eq('resolvido', false)
      .then(
        (r) => {
          S.cache.errosAbertos = r.count || 0;
          if (S.cache.errosAbertos && location.hash === '#/mais') staffMais();
        },
        () => {},
      );
  const it = (href, ic, t, d) =>
    `<a class="list-item" href="${href}" style="color:inherit"><span class="ativ-ic">${ic}</span><div class="grow"><b>${t}</b><div class="small muted">${d}</div></div>${I.chev}</a>`;
  $app.innerHTML = `<p class="eyebrow">Mais</p><h1 class="h1">Gestão da assessoria</h1>
    <div class="stack" style="margin-top:16px">
      ${it('#/financeiro', I.money, 'Financeiro', 'Mensalidades, Pix e quem está em dia')}
      ${it('#/formularios', I.ficha, `Formulários${S.cache.fichasNovas ? ` <span class="tag acc">${S.cache.fichasNovas} nova${S.cache.fichasNovas > 1 ? 's' : ''}</span>` : ''}`, 'Ficha de entrada: gere o link e mande no WhatsApp')}
      ${it('#/eventos', I.flag, 'Eventos', 'Treinões da Nexos e alunos nas provas')}
      ${it('#/checkup', I.check, 'Check-up do Corredor', 'Avaliação de entrada e saída: Pré-temporada, aluno novo, ciclo de prova')}
      ${it('#/desafio', I.flag, 'Desafio do mês', 'Meta coletiva da equipe com barra de progresso')}
      ${it('#/dicas', I.ficha, 'Dicas da Nexos', 'Textos curtos com base científica para os alunos')}
      ${it('#/prontidao-equipe', PRONT_IC, 'Prontidão da equipe', 'Check-in da manhã de todos e alerta de carga')}
      ${it('#/fidelizacao', I.user, 'Painel de fidelização', 'Alunos esfriando: treinando menos, longe do app ou com pendências')}
      ${it('#/relogios', I.watch, 'Relógios dos alunos', 'Quem está conectado, por onde e qual o modelo do relógio')}
      ${it('#/saude-sistema', I.alerta, `Saúde do sistema${S.cache.saudeProb ? ` <span class="tag ${S.cache.saudeVerm ? 'err' : 'warn'}">${S.cache.saudeProb}</span>` : ''}`, 'Erros, Garmin, notificações e avisos automáticos')}
      ${it('#/perfil', I.user, 'Perfil e equipe', S.me.papel === 'admin' ? 'Sua conta, equipe, notificações e cores do app' : 'Sua conta, notificações e cores do app')}
    </div>
    <p class="sec-lbl">Ajuda</p><div class="stack">
      <button class="list-item" id="mais-tour" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.play}</span><div class="grow"><b>Tour pelo painel</b><div class="small muted">Um passeio rápido por tudo o que o painel do treinador faz</div></div>${I.chev}</button>
    </div>`;
  document.getElementById('mais-tour').onclick = () => iniciarTour();
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
    const itensDe = (t) =>
      t.itens.map((it) => ({ ...it, exercicio_id: (exDe(it) || {}).id })).filter((it) => it.exercicio_id);
    const st = S.cache.libF || (S.cache.libF = { niv: store.get('nx_libf_niv', 'ini'), cat: 'todos', abertos: {} });
    const nomeNiv = Object.fromEntries(NIVEIS_FORCA),
      nomeCat = Object.fromEntries(CATS_FORCA);
    const cardMeu = (m) => {
      const its = m.itens || [];
      const grupos = [...new Set(its.map((i) => (exMap0[i.exercicio_id] || {}).grupo).filter(Boolean))].slice(0, 3);
      return `<div class="card modelo-t" data-mt="${m.id}"><div class="row between" style="align-items:flex-start;gap:10px"><div style="min-width:0"><b class="h3" style="display:block">${esc(m.nome)}</b><div class="small muted">${its.length} exercício${its.length === 1 ? '' : 's'}${grupos.length ? ' · ' + grupos.map(esc).join(', ') : ''}</div></div>${I.chev}</div>
        <div class="mt-fotos">${its
          .slice(0, 5)
          .map((i) => exFig(exMap0[i.exercicio_id] || {}, 'thumb'))
          .join('')}</div>
        <button class="btn ghost sm" data-aplicar="${m.id}" style="margin-top:12px">${I.users} Aplicar a alunos</button></div>`;
    };
    const cardProg = (pg) => {
      const aberto = !!st.abertos[pg.id];
      const nEx = pg.treinos.reduce((a, t) => a + t.itens.length, 0);
      return `<div class="card prog-f cat-${pg.cat}" data-prog="${pg.id}">
        <div class="pf-top"><span class="pf-ic">${FORCA_IC}</span><div style="min-width:0"><b class="h3" style="display:block">${esc(pg.nome)}</b>
          <div class="mc-tags"><span class="tag cat-t cat-${pg.cat}">${nomeCat[pg.cat]}</span><span class="tag niv-${pg.niv}">${nomeNiv[pg.niv]}</span><span class="tag">${pg.treinos.length} treino${pg.treinos.length > 1 ? 's' : ''} · ${nEx} exercícios</span></div></div></div>
        <p class="small pf-freq">${icT(I.cal || I.clock || '')}${esc(pg.freq)}</p>
        <p class="mc-info">${esc(pg.info)}</p>
        <div class="pf-treinos">${pg.treinos
          .map(
            (t, k) => `<div class="pf-t">
          <button type="button" class="pf-t-h" data-tog="${pg.id}"><b>${esc(t.titulo)}</b><span class="small muted ellip">${esc(t.foco)}</span><span class="mt-fotos">${t.itens
            .slice(0, 4)
            .map((it) => exFig(exDe(it) || {}, 'thumb'))
            .join('')}</span></button>
          ${
            aberto
              ? `<ol class="pf-ex">${t.itens
                  .map((it) => {
                    const ex = exDe(it);
                    return `<li><span class="pf-fig">${exFig(ex || {}, 'thumb')}</span><div class="grow" style="min-width:0"><b>${esc(it.nome)}</b><div class="small muted">${it.series} × ${esc(it.repeticoes)}${it.descanso_seg ? ` · descanso ${it.descanso_seg >= 60 && it.descanso_seg % 30 === 0 ? (it.descanso_seg / 60).toString().replace('.', ',') + ' min' : it.descanso_seg + ' s'}` : ' · sem descanso'}</div>${it.observacao ? `<div class="tiny dim">${esc(it.observacao)}</div>` : ''}</div></li>`;
                  })
                  .join('')}</ol>`
              : ''
          }
        </div>`,
          )
          .join('')}</div>
        <button type="button" class="link-btn small pf-ver" data-tog="${pg.id}">${aberto ? 'Esconder exercícios' : 'Ver todos os exercícios'}</button>
        <div class="pf-acoes"><button type="button" class="btn sm" data-aplprog="${pg.id}">${I.users} Aplicar a alunos</button><button type="button" class="btn ghost sm" data-salvprog="${pg.id}">Salvar nos meus modelos</button></div></div>`;
    };
    const desenhar = () => {
      const sel = st.niv,
        meus = sel === 'meus';
      const ordCat = CATS_FORCA.map(([k]) => k);
      const lista = BIB_FORCA.filter((pg) => pg.niv === sel && (st.cat === 'todos' || pg.cat === st.cat)).sort(
        (a, b) => ordCat.indexOf(a.cat) - ordCat.indexOf(b.cat),
      );
      const cont = (k) => (k === 'meus' ? mods.length : BIB_FORCA.filter((pg) => pg.niv === k).length);
      $app.innerHTML = `<p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('musculacao')}
        <p class="muted small">Biblioteca de força da Nexos por nível e objetivo, montada com as recomendações mais recentes (posição do ACSM de 2026 e meta-análises de 2021 a 2026). Aplique o programa inteiro a um aluno ou salve nos seus modelos para ajustar.</p>
        <a class="card tap cic-cta" href="#/treinos/ciclos-forca" style="color:inherit"><span class="ativ-ic">${I.cal}</span><div class="grow"><b>Ciclos de força (periodização)</b><div class="small muted">Linear, linear reverso, ondulatório semanal e diário, blocos e macrociclo de 6 meses. Aplica as fases semana a semana no aluno.</div></div>${I.chev}</a>
        <div class="niv-tabs niv-f" id="fniv">${[...NIVEIS_FORCA, ['meus', 'Meus modelos']].map(([k, l]) => `<button type="button" class="${sel === k ? 'on' : ''}" data-fniv="${k}"><b>${l}</b><span>${cont(k)} ${k === 'meus' ? 'modelos' : 'programas'}</span></button>`).join('')}</div>
        ${
          meus
            ? `<div class="cols" style="margin-top:16px" id="mods">${mods.map(cardMeu).join('') || '<div class="empty" style="grid-column:1/-1"><div class="h3">Nenhum modelo ainda</div><p class="small">Crie no + ou salve um programa da biblioteca para ajustar do seu jeito.</p></div>'}</div>`
            : `<div class="card guia-niv"><span class="eyebrow">Como montar · ${nomeNiv[sel]}</span><ul>${GUIA_FORCA[sel].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div class="chips" id="fcat" style="margin-top:14px">${[['todos', 'Todos os objetivos'], ...CATS_FORCA].map(([k, l]) => `<button class="chip ${st.cat === k ? 'on' : ''}" data-fcat="${k}">${l}</button>`).join('')}</div>
        <div class="cols" style="margin-top:16px">${lista.map(cardProg).join('')}</div>
        <p class="tiny dim" style="margin-top:18px">Bases: ACSM 2026 (Currier et al., Med Sci Sports Exerc); Robinson 2024 e Pelland 2026 (Sports Med); Singer 2024; Wolf 2023; Maeo 2021 e 2022; Plotkin 2023; Wewege 2021; Llanos-Lagos 2024; Lauersen 2014; Rønnestad 2011; Iversen 2021; Sødal 2023; van Dyk 2019; Harøy 2019; Watson 2018 (LIFTMOR); Su 2023; Hayden 2021 (Cochrane).</p>`
        }
        <a class="fab" href="#/modelo/novo" aria-label="Novo modelo">${I.plus}</a>`;
    };
    desenhar();
    $app.onclick = async (e) => {
      const nv = e.target.closest('[data-fniv]');
      if (nv) {
        st.niv = nv.dataset.fniv;
        store.set('nx_libf_niv', st.niv);
        return desenhar();
      }
      const ct = e.target.closest('[data-fcat]');
      if (ct) {
        st.cat = ct.dataset.fcat;
        return desenhar();
      }
      const tg = e.target.closest('[data-tog]');
      if (tg) {
        st.abertos[tg.dataset.tog] = !st.abertos[tg.dataset.tog];
        const y = scrollY;
        desenhar();
        scrollTo(0, y);
        return;
      }
      const ap = e.target.closest('[data-aplprog]');
      if (ap) {
        const pg = BIB_FORCA.find((x) => x.id === ap.dataset.aplprog);
        return escolherAlunos(null, `Aplicar “${pg.nome}”`, async (ids, avisar) => {
          let n = 0;
          for (const [k, t] of pg.treinos.entries())
            n = await aplicarTreinoAlunos(
              {
                titulo: t.titulo,
                foco: t.foco,
                observacoes: `${pg.nome} (${nomeNiv[pg.niv]}) · ${pg.freq}.\n${pg.info}`,
                itens: itensDe(t),
              },
              ids,
              avisar && k === 0,
            );
          toast(
            `${pg.treinos.length} treinos enviados para ${n} aluno${n > 1 ? 's' : ''}! Defina os dias da semana no treino de cada um.`,
          );
        });
      }
      const sv = e.target.closest('[data-salvprog]');
      if (sv) {
        const pg = BIB_FORCA.find((x) => x.id === sv.dataset.salvprog);
        sv.disabled = true;
        const linhas = pg.treinos.map((t) => ({
          org_id: S.org.id,
          nome: `${pg.nome} (${nomeNiv[pg.niv]}) – ${t.titulo}`,
          foco: t.foco,
          observacoes: `${pg.freq}.\n${pg.info}`,
          itens: itensLimpos(itensDe(t)),
          criado_por: S.user.id,
        }));
        const { data: novos, error } = await sb.from('nx_modelos_treino').insert(linhas).select('*');
        sv.disabled = false;
        if (error) return toast('Não foi possível salvar.', true);
        mods.push(...(novos || []));
        mods.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
        return toast(`${linhas.length} treinos salvos em Meus modelos. Lá você pode editar.`);
      }
      const apm = e.target.closest('[data-aplicar]');
      if (apm) {
        const m = mods.find((x) => x.id === apm.dataset.aplicar);
        return escolherAlunos(null, `Aplicar “${m.nome}”`, async (ids, avisar) => {
          const n = await aplicarTreinoAlunos(
            { titulo: m.nome, foco: m.foco || '', observacoes: m.observacoes || '', itens: m.itens || [] },
            ids,
            avisar,
          );
          toast(`Treino enviado para ${n} aluno${n > 1 ? 's' : ''}!`);
        });
      }
      const c = e.target.closest('[data-mt]');
      if (c) location.hash = '#/modelo/' + c.dataset.mt;
    };
    return;
  }
  const [exs, fav] = await Promise.all([carregarExercicios(true), carregarFavoritos()]);
  const comMidia = exs.filter((e) => (e.imagens && e.imagens.length) || e.video_url).length;
  $app.innerHTML = `
    <p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('exercicios')}
    <p class="muted small" style="margin-top:6px">${exs.length} exercícios · ${comMidia} com foto ou vídeo. Toque em um para ver como fazer, editar ou trocar a mídia.</p>
    <div id="bib-box" style="margin-top:14px"></div>`;
  bibliotecaUI(document.getElementById('bib-box'), exs, fav, {
    acao: I.chev,
    aoTocar: (ex) => formExercicio(ex),
    aoCriar: () => formExercicio(null),
  });
}
