/* Nexos App · Aprimoramento intelectual (só treinadores).
   Parte 4 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= APRIMORAMENTO INTELECTUAL (só treinadores) ================= */
// banco de questões em app/aprimoramento/*.json (cada questão com explicação e fonte); respostas em nx_quiz_respostas
const APR_AREAS = [
  'especializacao',
  'preparacao',
  'corrida',
  'triatlo',
  'forca',
  'anatomia',
  'sistemas',
  'fisiologia',
  'casos',
];
const APR_NIVEL = { 1: ['Básico', 'ok'], 2: ['Intermediário', 'acc'], 3: ['Avançado', 'warn'] };
const APR_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/></svg>';
async function aprCarregar() {
  if (S.cache.apr) return S.cache.apr;
  const areas = await Promise.all(
    APR_AREAS.map((a) =>
      fetch(`aprimoramento/${a}.json`).then(
        (r) => (r.ok ? r.json() : null),
        () => null,
      ),
    ),
  );
  const ok = areas.filter(Boolean);
  const porId = {};
  ok.forEach((ar) =>
    ar.temas.forEach((t) =>
      t.q.forEach((q) => {
        porId[q.id] = { ...q, area: ar.id, tema: t.id, areaT: ar.titulo, temaT: t.titulo };
      }),
    ),
  );
  return (S.cache.apr = { areas: ok, porId });
}
// última resposta de cada questão (o que vale para o aproveitamento)
async function aprRespostas() {
  const linhas = await sb
    .from('nx_quiz_respostas')
    .select('questao,acertou,criado_em')
    .eq('user_id', S.user.id)
    .order('criado_em', { ascending: false })
    .limit(5000)
    .then(
      (r) => r.data || [],
      () => [],
    );
  const ult = {};
  linhas.forEach((x) => {
    if (!(x.questao in ult)) ult[x.questao] = x.acertou;
  });
  return ult;
}
const aprStats = (ids, ult) => {
  const resp = ids.filter((i) => i in ult);
  const ac = resp.filter((i) => ult[i]).length;
  return { total: ids.length, resp: resp.length, ac, pct: resp.length ? Math.round((ac / resp.length) * 100) : null };
};
const aprBarra = (st) =>
  `<div class="apr-barra"><i style="width:${st.total ? (st.resp / st.total) * 100 : 0}%"></i></div><div class="apr-num"><span>${st.resp} de ${st.total} respondidas</span>${st.pct != null ? `<b class="${st.pct >= 70 ? 'ok' : st.pct >= 50 ? 'mid' : 'bad'}">${st.pct}% de acerto</b>` : ''}</div>`;
// escolhe as questões: primeiro as não respondidas, depois as erradas, depois as demais
function aprSorteio(ids, ult, n) {
  const emb = (l) =>
    l
      .map((x) => [Math.random(), x])
      .sort((a, b) => a[0] - b[0])
      .map((x) => x[1]);
  return [
    ...emb(ids.filter((i) => !(i in ult))),
    ...emb(ids.filter((i) => ult[i] === false)),
    ...emb(ids.filter((i) => ult[i] === true)),
  ].slice(0, n);
}
async function viewAprimoramento(area, tema, sub) {
  loading();
  dockStaff();
  const [B, ult] = await Promise.all([aprCarregar(), aprRespostas()]);
  if (!B.areas.length) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Não foi possível carregar as questões</div><p class="small muted">Verifique a internet e tente de novo.</p></div>';
    return;
  }
  const todasIds = Object.keys(B.porId);
  if (area === 'equipe') return aprEquipe();
  if (area === 'reportes') return aprReportes();
  if (area === 'erros') {
    const ids = todasIds.filter((i) => ult[i] === false);
    return aprQuiz(ids.slice(0, 20), 'Revisar meus erros', '#/aprimoramento');
  }
  if (area === 'simulado') return aprQuiz(aprSorteio(todasIds, ult, 20), 'Simulado geral', '#/aprimoramento');
  const ar = B.areas.find((x) => x.id === area);
  if (ar && ar.especializacao) return espView(ar, tema, sub, ult);
  if (ar && tema) {
    const t = ar.temas.find((x) => x.id === tema);
    // módulo de trilha: abre o estudo; as questões ficam em .../questoes
    if (t && t.estudo && sub !== 'questoes') return aprEstudo(ar, t, ult);
    if (t)
      return aprQuiz(
        aprSorteio(
          t.q.map((q) => q.id),
          ult,
          10,
        ),
        t.titulo,
        t.estudo ? `#/aprimoramento/${ar.id}/${t.id}` : `#/aprimoramento/${ar.id}`,
      );
    if (tema === 'simulado')
      return aprQuiz(
        aprSorteio(
          ar.temas.flatMap((x) => x.q.map((q) => q.id)),
          ult,
          15,
        ),
        `Simulado: ${ar.titulo}`,
        `#/aprimoramento/${ar.id}`,
      );
  }
  if (ar) {
    const idsA = ar.temas.flatMap((x) => x.q.map((q) => q.id));
    $app.innerHTML = `<a class="back" href="#/aprimoramento">${I.back} Aprimoramento Intelectual</a><p class="eyebrow">${ar.trilha ? 'Trilha de estudo' : 'Área'}</p><h1 class="h1">${esc(ar.titulo)}</h1><p class="muted" style="margin-top:6px">${esc(ar.desc)}</p>
      ${ar.plano ? `<div class="apr-plano">${esc(ar.plano)}</div>` : ''}
      <div class="card apr-resumo">${aprBarra(aprStats(idsA, ult))}<a class="btn block" href="#/aprimoramento/${ar.id}/simulado" style="margin-top:12px">Simulado ${ar.trilha ? 'da trilha' : 'da área'} (15 questões)</a></div>
      <p class="sec-lbl">${ar.trilha ? 'Módulos' : 'Temas'}</p><div class="stack">${ar.temas
        .map((t, k) => {
          const st = aprStats(
            t.q.map((q) => q.id),
            ult,
          );
          const feito = st.resp === st.total && st.pct >= 80;
          return `<a class="card apr-tema" href="#/aprimoramento/${ar.id}/${t.id}" style="color:inherit"><div class="row between" style="gap:10px"><div class="grow" style="min-width:0">${ar.trilha ? `<span class="apr-mod${feito ? ' ok' : ''}">Módulo ${k + 1}${feito ? ' · concluído' : ''}</span>` : ''}<b style="display:block">${esc(t.titulo)}</b></div>${I.chev}</div>${aprBarra(st)}</a>`;
        })
        .join('')}</div>`;
    return;
  }
  const geral = aprStats(todasIds, ult),
    nErros = todasIds.filter((i) => ult[i] === false).length;
  sb.from('nx_quiz_reportes')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', S.org.id)
    .eq('resolvido', false)
    .then(
      (r) => {
        const el = document.getElementById('apr-nrep');
        if (el && r.count) el.innerHTML = `<span class="tag warn">${r.count}</span>`;
      },
      () => {},
    );
  $app.innerHTML = `<p class="eyebrow">Equipe Nexos</p><h1 class="h1">Aprimoramento Intelectual</h1>
    <p class="muted" style="margin-top:6px">${todasIds.length} questões com base científica, cada uma com explicação e fonte. Escolha uma área, responda e acompanhe o seu aproveitamento.</p>
    <div class="card apr-resumo"><span class="eyebrow">Seu aproveitamento geral</span>${aprBarra(geral)}
      <div class="grid2" style="margin-top:12px;gap:8px"><a class="btn sm" href="#/aprimoramento/simulado">Simulado geral (20)</a><a class="btn sm ghost" href="#/aprimoramento/erros" ${nErros ? '' : 'aria-disabled="true" style="opacity:.5;pointer-events:none"'}>Revisar erros${nErros ? ` (${nErros})` : ''}</a></div></div>
    ${B.areas
      .filter((ar) => ar.especializacao)
      .map(
        (ar) =>
          `<a class="card apr-esp-hero" href="#/aprimoramento/${ar.id}" style="color:inherit"><span class="apr-mod">Programa de 12 meses · ${ar.temas.reduce((t, d) => t + d.horas, 0)} horas</span><b class="h3" style="display:block">${esc(ar.titulo)}</b><p class="small muted" style="margin-top:4px">${ar.temas.length} disciplinas com aulas, artigos comentados, casos, prática e prova.</p><span class="apr-esp-ir">Abrir o programa ${I.chev}</span></a>`,
      )
      .join('')}
    ${
      B.areas.some((ar) => ar.trilha)
        ? `<p class="sec-lbl">Trilhas de estudo</p><div class="stack">${B.areas
            .filter((ar) => ar.trilha)
            .map((ar) => {
              const ids = ar.temas.flatMap((x) => x.q.map((q) => q.id));
              return `<a class="card apr-area apr-trilha" href="#/aprimoramento/${ar.id}" style="color:inherit"><span class="apr-mod">${ar.temas.length} módulos · estudo, prática e questões</span><div class="row between" style="gap:10px;align-items:flex-start"><b class="h3">${esc(ar.titulo)}</b>${I.chev}</div>${aprBarra(aprStats(ids, ult))}</a>`;
            })
            .join('')}</div>`
        : ''
    }
    <p class="sec-lbl">Áreas</p><div class="stack">${B.areas
      .filter((ar) => !ar.trilha && !ar.especializacao)
      .map((ar) => {
        const ids = ar.temas.flatMap((x) => x.q.map((q) => q.id));
        return `<a class="card apr-area" href="#/aprimoramento/${ar.id}" style="color:inherit"><div class="row between" style="gap:10px;align-items:flex-start"><div class="grow" style="min-width:0"><b class="h3">${esc(ar.titulo)}</b><p class="small muted" style="margin-top:4px">${ar.temas.length} temas · ${esc(ar.desc)}</p></div>${I.chev}</div>${aprBarra(aprStats(ids, ult))}</a>`;
      })
      .join('')}</div>
    <p class="sec-lbl">Equipe</p><a class="list-item" href="#/aprimoramento/reportes" style="color:inherit;margin-bottom:8px"><span class="ativ-ic">${I.alerta}</span><div class="grow"><b>Questões reportadas <span id="apr-nrep"></span></b><div class="small muted">O que a equipe marcou para revisar</div></div>${I.chev}</a><a class="list-item" href="#/aprimoramento/equipe" style="color:inherit"><span class="ativ-ic">${TROFEU_IC}</span><div class="grow"><b>Aproveitamento da equipe</b><div class="small muted">Quantas questões cada treinador respondeu e acertou</div></div>${I.chev}</a>`;
}
/* ---------- Especialização Nexos: disciplinas com aulas, artigos, casos, prática e prova ---------- */
// o que o treinador já estudou e entregou fica em nx_estudo_lido (item = 'esp-d1-a1', 'esp-d1-pratica', 'esp-tcc')
async function espLidos() {
  const l = await sb
    .from('nx_estudo_lido')
    .select('item,texto,criado_em')
    .eq('user_id', S.user.id)
    .like('item', 'esp-%')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const m = {};
  l.forEach((x) => (m[x.item] = x));
  return m;
}
async function espMarcar(item, sim, texto) {
  const r = sim
    ? await sb
        .from('nx_estudo_lido')
        .upsert({ org_id: S.org.id, user_id: S.user.id, item, texto: texto || null }, { onConflict: 'user_id,item' })
    : await sb.from('nx_estudo_lido').delete().eq('user_id', S.user.id).eq('item', item);
  if (r.error) toast('Não foi possível salvar.', true);
  return !r.error;
}
const espData = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
// situação de uma disciplina: aulas estudadas, prática entregue e prova com 70% ou mais
function espSituacao(d, lidos, ult) {
  if (!d.pronta) return { estado: 'breve', rotulo: 'Em preparação' };
  const aulas = d.aulas.filter((a) => lidos[`esp-${d.id}-${a.id}`]).length,
    pratica = !!lidos[`esp-${d.id}-pratica`],
    prova = aprStats(
      d.q.map((q) => q.id),
      ult,
    ),
    provaOk = prova.resp === prova.total && prova.pct >= 70,
    aprovada = aulas === d.aulas.length && pratica && provaOk,
    comecou = aulas || pratica || prova.resp;
  return {
    aulas,
    pratica,
    prova,
    provaOk,
    aprovada,
    estado: aprovada ? 'ok' : comecou ? 'and' : 'disp',
    rotulo: aprovada ? 'Aprovada' : comecou ? 'Em andamento' : 'Disponível',
  };
}
async function espView(ar, dId, sub, ult) {
  const lidos = await espLidos();
  const base = `#/aprimoramento/${ar.id}`;
  if (dId === 'tcc') return espTcc(ar, lidos);
  const d = ar.temas.find((x) => x.id === dId);
  if (d && d.pronta) {
    if (sub === 'prova')
      return aprQuiz(
        aprSorteio(
          d.q.map((q) => q.id),
          ult,
          d.q.length,
        ),
        `Prova: ${d.titulo}`,
        `${base}/${d.id}`,
      );
    if (sub === 'pratica') return espPratica(ar, d, lidos);
    const aula = sub && d.aulas.find((a) => a.id === sub);
    if (aula) return espAula(ar, d, aula, lidos);
    return espDisciplina(ar, d, lidos, ult);
  }
  // visão geral do programa
  const sit = ar.temas.map((x) => espSituacao(x, lidos, ult)),
    total = ar.temas.reduce((t, x) => t + x.horas, 0),
    feitas = ar.temas.reduce((t, x, i) => t + (sit[i].aprovada ? x.horas : 0), 0),
    tudo = sit.every((x) => x.aprovada) && lidos['esp-tcc'];
  $app.innerHTML = `<a class="back" href="#/aprimoramento">${I.back} Aprimoramento Intelectual</a><p class="eyebrow">Especialização Nexos</p><h1 class="h1">${esc(ar.titulo)}</h1>
    <p class="muted" style="margin-top:6px">${esc(ar.desc)}</p>
    <div class="card apr-resumo"><span class="eyebrow">Seu progresso</span><div class="apr-barra"><i style="width:${(feitas / total) * 100}%"></i></div><div class="apr-num"><span>${feitas} de ${total} horas concluídas</span><b>${sit.filter((x) => x.aprovada).length} de ${ar.temas.length} disciplinas</b></div></div>
    <div class="apr-plano"><b>Como funciona</b><ul class="apr-lista" style="margin-top:6px">${ar.regras.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
    ${ar.blocos
      .map(
        (bl, bi) =>
          `<p class="sec-lbl">Bloco ${bi + 1} · ${esc(bl)}</p><div class="stack">${ar.temas
            .map((x, i) => [x, sit[i]])
            .filter(([x]) => x.bloco === bi + 1)
            .map(([x, st]) => {
              const tag = x.pronta ? `a href="${base}/${x.id}"` : 'div';
              return `<${tag} class="card apr-disc ${st.estado}" style="color:inherit"><div class="row between" style="gap:10px;align-items:flex-start"><div class="grow" style="min-width:0"><span class="apr-mod">Disciplina ${x.n} · ${x.horas} h</span><b style="display:block">${esc(x.titulo)}</b><p class="small muted" style="margin-top:4px">${esc(x.resumo)}</p></div><span class="apr-st ${st.estado}">${st.rotulo}</span></div></${x.pronta ? 'a' : 'div'}>`;
            })
            .join('')}</div>`,
      )
      .join('')}
    <p class="sec-lbl">Conclusão</p><a class="card apr-disc ${lidos['esp-tcc'] ? 'ok' : 'disp'}" href="${base}/tcc" style="color:inherit"><div class="row between" style="gap:10px"><div class="grow"><span class="apr-mod">Trabalho final</span><b style="display:block">Estudo de caso de 12 semanas</b></div><span class="apr-st ${lidos['esp-tcc'] ? 'ok' : 'disp'}">${lidos['esp-tcc'] ? 'Entregue' : 'Pendente'}</span></div></a>
    <div class="card apr-cert ${tudo ? 'ok' : ''}"><span class="eyebrow">Certificado</span><p class="small" style="margin-top:6px">${tudo ? 'Programa concluído.' : `Liberado quando as ${ar.temas.length} disciplinas forem aprovadas e o trabalho final for entregue.`} ${esc(ar.certificado)}</p>${tudo ? '<button class="btn block" id="esp-cert" style="margin-top:10px">Ver certificado</button>' : ''}</div>`;
  const c = document.getElementById('esp-cert');
  if (c) c.onclick = () => espCertificado(ar, total);
  window.scrollTo(0, 0);
}
function espDisciplina(ar, d, lidos, ult) {
  const st = espSituacao(d, lidos, ult),
    base = `#/aprimoramento/${ar.id}/${d.id}`;
  const item = (ok, t, sub) =>
    `<li class="${ok ? 'ok' : ''}"><span class="apr-ck">${ok ? I.check : ''}</span><div><b>${t}</b>${sub ? `<span class="small muted">${sub}</span>` : ''}</div></li>`;
  $app.innerHTML = `<a class="back" href="#/aprimoramento/${ar.id}">${I.back} Especialização</a><p class="eyebrow">Disciplina ${d.n} · ${d.horas} horas</p><h1 class="h1">${esc(d.titulo)}</h1>
    <p class="muted" style="margin-top:6px">${esc(d.resumo)}</p>
    <div class="card apr-resumo"><div class="row between" style="gap:8px"><span class="eyebrow">Para ser aprovado</span><span class="apr-st ${st.estado}">${st.rotulo}</span></div>
      <ul class="apr-checks">${item(st.aulas === d.aulas.length, `Aulas estudadas: ${st.aulas} de ${d.aulas.length}`)}${item(st.pratica, 'Prática entregue')}${item(st.provaOk, 'Prova com 70% ou mais', st.prova.resp ? `${st.prova.resp} de ${st.prova.total} respondidas${st.prova.pct != null ? ` · ${st.prova.pct}% de acerto` : ''}` : 'Ainda não feita')}</ul></div>
    <p class="sec-lbl">Aulas</p><div class="stack">${d.aulas
      .map(
        (a, i) =>
          `<a class="card apr-aula-it" href="${base}/${a.id}" style="color:inherit"><span class="apr-num-aula ${lidos[`esp-${d.id}-${a.id}`] ? 'ok' : ''}">${i + 1}</span><div class="grow" style="min-width:0"><b>${esc(a.titulo)}</b><span class="small muted" style="display:block">${a.min} min de estudo${lidos[`esp-${d.id}-${a.id}`] ? ' · estudada' : ''}</span></div>${I.chev}</a>`,
      )
      .join('')}</div>
    <p class="sec-lbl">Artigos comentados</p><div class="stack">${d.artigos
      .map(
        (x) =>
          `<details class="card apr-art"><summary><b>${esc(x.ref)}</b></summary><p><span class="apr-rot">O que encontrou</span>${esc(x.achado)}</p><p><span class="apr-rot">Como foi feito</span>${esc(x.metodo)}</p><p><span class="apr-rot">Limites</span>${esc(x.limites)}</p><p><span class="apr-rot">Na Nexos</span>${esc(x.uso)}</p></details>`,
      )
      .join('')}</div>
    <p class="sec-lbl">Casos para resolver</p><div class="stack">${d.casos
      .map(
        (x, i) =>
          `<div class="card apr-caso"><span class="apr-mod">Caso ${i + 1}</span><b style="display:block">${esc(x.titulo)}</b><p>${esc(x.enunciado)}</p><ol class="apr-lista">${x.perguntas.map((p) => `<li>${esc(p)}</li>`).join('')}</ol><details><summary>Pense na sua resposta e depois veja a resolução</summary><p>${esc(x.resolucao)}</p></details></div>`,
      )
      .join('')}</div>
    <p class="sec-lbl">Prática com aluno</p><a class="card apr-aula-it" href="${base}/pratica" style="color:inherit"><span class="apr-num-aula ${st.pratica ? 'ok' : ''}">P</span><div class="grow" style="min-width:0"><b>${esc(d.pratica.titulo)}</b><span class="small muted" style="display:block">${st.pratica ? 'Entregue' : 'Pendente'}</span></div>${I.chev}</a>
    <p class="sec-lbl">Prova</p><div class="card apr-resumo">${aprBarra(st.prova)}<a class="btn block" href="${base}/prova" style="margin-top:12px">${st.prova.resp ? 'Refazer a prova' : 'Fazer a prova'} (${d.q.length} questões)</a><p class="tiny dim" style="margin-top:8px">Vale a resposta mais recente de cada questão. Refazer e acertar melhora a nota.</p></div>`;
  window.scrollTo(0, 0);
}
function espAula(ar, d, a, lidos) {
  const i = d.aulas.indexOf(a),
    base = `#/aprimoramento/${ar.id}/${d.id}`,
    chave = `esp-${d.id}-${a.id}`,
    prox = d.aulas[i + 1];
  $app.innerHTML = `<a class="back" href="${base}">${I.back} ${esc(d.titulo)}</a><p class="eyebrow">Aula ${i + 1} de ${d.aulas.length} · ${a.min} min</p><h1 class="h1">${esc(a.titulo)}</h1>
    <article class="card apr-estudo apr-aula">${a.texto.map((p) => `<p>${esc(p)}</p>`).join('')}</article>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Na prática</p><ul class="apr-lista pratica">${a.pratica.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
    <div class="apr-objetivo"><span class="eyebrow">Para pensar</span><p>${esc(a.pensar)}</p></div>
    <button class="btn block ${lidos[chave] ? 'ghost' : ''}" id="esp-lida" style="margin-top:16px">${lidos[chave] ? 'Estudada. Desmarcar' : 'Marcar como estudada'}</button>
    ${prox ? `<a class="btn ghost block" href="${base}/${prox.id}" style="margin-top:8px">Próxima aula: ${esc(prox.titulo)}</a>` : `<a class="btn ghost block" href="${base}" style="margin-top:8px">Voltar à disciplina</a>`}`;
  document.getElementById('esp-lida').onclick = async () => {
    if (!(await espMarcar(chave, !lidos[chave]))) return;
    toast(lidos[chave] ? 'Aula desmarcada.' : 'Aula marcada como estudada.');
    if (lidos[chave]) delete lidos[chave];
    else lidos[chave] = { item: chave };
    espAula(ar, d, a, lidos);
  };
  window.scrollTo(0, 0);
}
function espPratica(ar, d, lidos) {
  const P = d.pratica,
    chave = `esp-${d.id}-pratica`,
    feito = lidos[chave];
  $app.innerHTML = `<a class="back" href="#/aprimoramento/${ar.id}/${d.id}">${I.back} ${esc(d.titulo)}</a><p class="eyebrow">Prática com aluno</p><h1 class="h1">${esc(P.titulo)}</h1>
    <div class="apr-objetivo"><span class="eyebrow">Objetivo</span><p>${esc(P.objetivo)}</p></div>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Passo a passo</p><ol class="apr-lista">${P.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>
    <form class="card apr-estudo" id="esp-f"><p class="sec-lbl" style="margin-top:0">Sua entrega</p><p class="small muted">${esc(P.entrega)}</p>
      <textarea class="input" name="t" rows="7" maxlength="6000" required style="margin-top:10px" placeholder="Escreva aqui">${feito && feito.texto ? esc(feito.texto) : ''}</textarea>
      <button class="btn block" type="submit" style="margin-top:10px">${feito ? 'Salvar a entrega' : 'Entregar'}</button>${feito ? `<p class="tiny dim" style="margin-top:6px">Entregue em ${espData(feito.criado_em)}</p>` : ''}</form>`;
  document.getElementById('esp-f').onsubmit = async (e) => {
    e.preventDefault();
    const t = e.target.t.value.trim();
    if (t.length < 80) return toast('Escreva a análise com os dados e a decisão, em algumas linhas.', true);
    if (await espMarcar(chave, true, t)) {
      toast('Prática entregue.');
      location.hash = `#/aprimoramento/${ar.id}/${d.id}`;
    }
  };
  window.scrollTo(0, 0);
}
function espTcc(ar, lidos) {
  const feito = lidos['esp-tcc'];
  $app.innerHTML = `<a class="back" href="#/aprimoramento/${ar.id}">${I.back} Especialização</a><p class="eyebrow">Trabalho final</p><h1 class="h1">Estudo de caso de 12 semanas</h1>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Como fazer</p><ol class="apr-lista">
      <li>Escolha um aluno com objetivo definido e autorização para usar os dados sem identificação.</li>
      <li>Avaliação inicial: anamnese, testes funcionais, teste de campo e zonas (disciplinas 1 e 4).</li>
      <li>Plano de 12 semanas justificado: distribuição de intensidade, força e monitoramento (disciplinas 5 a 7).</li>
      <li>Registro semanal: carga, check-in, ajustes feitos e o motivo de cada um.</li>
      <li>Reavaliação no fim e discussão: o que funcionou, o que não funcionou e o que a literatura explica.</li>
      <li>Conclusão: o que você faria diferente com o próximo aluno.</li></ol></div>
    <form class="card apr-estudo" id="esp-f"><p class="sec-lbl" style="margin-top:0">Entrega</p><p class="small muted">Cole o texto do trabalho ou um resumo com o link do documento completo.</p>
      <textarea class="input" name="t" rows="10" maxlength="6000" required style="margin-top:10px">${feito && feito.texto ? esc(feito.texto) : ''}</textarea>
      <button class="btn block" type="submit" style="margin-top:10px">${feito ? 'Salvar' : 'Entregar o trabalho final'}</button></form>`;
  document.getElementById('esp-f').onsubmit = async (e) => {
    e.preventDefault();
    const t = e.target.t.value.trim();
    if (t.length < 300) return toast('O trabalho final precisa de mais conteúdo.', true);
    if (await espMarcar('esp-tcc', true, t)) {
      toast('Trabalho final entregue.');
      location.hash = `#/aprimoramento/${ar.id}`;
    }
  };
  window.scrollTo(0, 0);
}
function espCertificado(ar, horas) {
  const nome = (S.me && S.me.nome) || '';
  telaCheia(
    'apr-cert-tela',
    'Certificado',
    `<button class="fb-x" aria-label="Fechar">${I.x}</button><div class="apr-cert-doc"><img src="/img/nexos-logo-navy.png" alt="Nexos" class="apr-cert-logo"><p class="eyebrow">Certificado de conclusão</p><h2>${esc(nome)}</h2><p>concluiu o programa</p><h3>${esc(ar.titulo)}</h3><p>com ${horas} horas de estudo, aplicação prática com alunos e trabalho final.</p><p class="tiny dim">${esc(ar.certificado)}</p><p class="small">${espData(new Date().toISOString())}</p></div>`,
  );
}

// tela de estudo de um módulo da trilha: objetivo, resumo, pontos-chave, leituras, prática e questões
function aprEstudo(ar, t, ult) {
  const k = ar.temas.indexOf(t),
    e = t.estudo,
    st = aprStats(
      t.q.map((q) => q.id),
      ult,
    ),
    prox = ar.temas[k + 1],
    ant = ar.temas[k - 1];
  const lista = (l, cls) => `<ul class="apr-lista ${cls || ''}">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  $app.innerHTML = `<a class="back" href="#/aprimoramento/${ar.id}">${I.back} ${esc(ar.titulo)}</a>
    <p class="eyebrow">Módulo ${k + 1} de ${ar.temas.length}</p><h1 class="h1">${esc(t.titulo)}</h1>
    <div class="apr-objetivo"><span class="eyebrow">Objetivo</span><p>${esc(e.objetivo)}</p></div>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Resumo</p>${e.resumo.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Pontos-chave</p>${lista(e.pontos, 'chave')}</div>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Para ler</p>${lista(e.leituras, 'refs')}</div>
    <div class="card apr-estudo"><p class="sec-lbl" style="margin-top:0">Aplicar na Nexos</p>${lista(e.pratica, 'pratica')}</div>
    <div class="card apr-resumo"><span class="eyebrow">Questões do módulo</span>${aprBarra(st)}<a class="btn block" href="#/aprimoramento/${ar.id}/${t.id}/questoes" style="margin-top:12px">${st.resp ? 'Responder de novo' : 'Responder as questões'} (${t.q.length})</a></div>
    <div class="grid2" style="gap:8px;margin-top:12px">${ant ? `<a class="btn ghost sm" href="#/aprimoramento/${ar.id}/${ant.id}">${I.back} Módulo ${k}</a>` : '<span></span>'}${prox ? `<a class="btn ghost sm" href="#/aprimoramento/${ar.id}/${prox.id}">Módulo ${k + 2} ${I.chev}</a>` : ''}</div>`;
  window.scrollTo(0, 0);
}
function aprQuiz(ids, titulo, voltar) {
  const B = S.cache.apr,
    qs = ids.map((i) => B.porId[i]).filter(Boolean);
  if (!qs.length) {
    $app.innerHTML = `<a class="back" href="${voltar}">${I.back} Voltar</a><div class="empty" style="margin-top:30px"><div class="h3">Nada para responder aqui</div><p class="small muted">Você não tem erros para revisar.</p></div>`;
    return;
  }
  let i = 0;
  const res = [];
  const desenha = () => {
    const q = qs[i],
      ordem = q.a.map((_, k) => k).sort(() => Math.random() - 0.5),
      nv = APR_NIVEL[q.n] || APR_NIVEL[2];
    $app.innerHTML = `<a class="back" href="${voltar}">${I.back} Sair</a>
      <div class="row between" style="gap:8px;margin-top:6px"><span class="eyebrow">${esc(titulo)}</span><span class="small muted">${i + 1} de ${qs.length}</span></div>
      <div class="apr-barra fina"><i style="width:${(i / qs.length) * 100}%"></i></div>
      <div class="card apr-q"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="tag ${nv[1]}">${nv[0]}</span><span class="tag">${esc(q.temaT)}</span></div>
        <p class="apr-perg">${esc(q.p)}</p>
        <div class="apr-alts" id="apr-alts">${ordem.map((k, j) => `<button type="button" data-k="${k}"><span>${'ABCD'[j]}</span><em>${esc(q.a[k])}</em></button>`).join('')}</div>
        <div id="apr-exp"></div><button type="button" class="link-btn tiny apr-rep" id="apr-rep">Reportar questão</button></div>`;
    window.scrollTo(0, 0);
    document.getElementById('apr-rep').onclick = () => aprReportar(q);
    document.getElementById('apr-alts').onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (!b || b.parentElement.dataset.ok) return;
      b.parentElement.dataset.ok = '1';
      const k = +b.dataset.k,
        certo = k === q.c;
      res.push({ q, certo, k });
      document.querySelectorAll('#apr-alts button').forEach((x) => {
        const kk = +x.dataset.k;
        x.disabled = true;
        if (kk === q.c) x.classList.add('certa');
        else if (kk === k) x.classList.add('errada');
      });
      sb.from('nx_quiz_respostas')
        .insert({ org_id: S.org.id, user_id: S.user.id, questao: q.id, area: q.area, tema: q.tema, acertou: certo })
        .then(
          () => {},
          () => {},
        );
      document.getElementById('apr-exp').innerHTML =
        `<div class="apr-exp ${certo ? 'ok' : 'bad'}"><b>${certo ? 'Resposta certa.' : 'Resposta errada.'}</b><p>${esc(q.e)}</p><p class="tiny dim">Fonte: ${esc(q.f)}</p></div>
        <button class="btn block" id="apr-prox" style="margin-top:12px">${i + 1 < qs.length ? 'Próxima' : 'Ver resultado'}</button>`;
      document.getElementById('apr-prox').onclick = () => {
        i++;
        if (i < qs.length) desenha();
        else fim();
      };
      document.getElementById('apr-exp').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  };
  const fim = () => {
    const ac = res.filter((x) => x.certo).length,
      pct = Math.round((ac / res.length) * 100),
      erros = res.filter((x) => !x.certo);
    $app.innerHTML = `<a class="back" href="${voltar}">${I.back} Voltar</a><p class="eyebrow">${esc(titulo)}</p><h1 class="h1">Resultado</h1>
      <div class="card apr-fim"><b class="${pct >= 70 ? 'ok' : pct >= 50 ? 'mid' : 'bad'}">${ac} de ${res.length}</b><span>${pct}% de acerto</span><p class="small muted">${pct >= 85 ? 'Excelente domínio do tema.' : pct >= 70 ? 'Bom resultado. Revise os erros para fechar as lacunas.' : pct >= 50 ? 'Base razoável. Vale reler as explicações dos erros.' : 'Tema para estudar com calma. As explicações e fontes ajudam.'}</p></div>
      ${erros.length ? `<p class="sec-lbl">Revise os erros</p><div class="stack">${erros.map((x) => `<div class="card apr-rev"><p class="apr-perg sm">${esc(x.q.p)}</p><p class="small"><span class="apr-x">Sua resposta:</span> ${esc(x.q.a[x.k])}</p><p class="small"><span class="apr-v">Certa:</span> ${esc(x.q.a[x.q.c])}</p><p class="small muted" style="margin-top:6px">${esc(x.q.e)}</p><p class="tiny dim">Fonte: ${esc(x.q.f)}</p></div>`).join('')}</div>` : ''}
      <div class="grid2" style="gap:8px;margin-top:16px">${erros.length ? '<button class="btn" id="apr-refaz">Refazer os erros</button>' : ''}<a class="btn ghost" href="${voltar}">Voltar</a></div>`;
    const rf = document.getElementById('apr-refaz');
    if (rf)
      rf.onclick = () =>
        aprQuiz(
          erros.map((x) => x.q.id),
          `${titulo}: erros`,
          voltar,
        );
    window.scrollTo(0, 0);
  };
  desenha();
}
const APR_MOTIVO = {
  resposta: 'A resposta certa está errada',
  ambigua: 'Mais de uma alternativa pode estar certa',
  fonte: 'A fonte está incorreta',
  texto: 'Erro de texto ou de digitação',
  outro: 'Outro motivo',
};
function aprReportar(q) {
  openSheet(
    `<p class="eyebrow">Aprimoramento Intelectual</p><div class="h2">Reportar questão</div><p class="small muted" style="margin-top:6px">${esc(q.p)}</p>
    <form id="f-rep" style="margin-top:12px"><div class="stack">${Object.entries(APR_MOTIVO)
      .map(
        ([k, l], i) =>
          `<label class="list-item" style="cursor:pointer"><input type="radio" name="motivo" value="${k}" ${i ? '' : 'checked'}> <span>${l}</span></label>`,
      )
      .join('')}</div>
      <label class="field" style="margin-top:12px"><span>Comentário (opcional)</span><textarea class="input" name="comentario" rows="3" maxlength="1000" placeholder="O que está errado e, se souber, a fonte correta"></textarea></label>
      <button class="btn block" type="submit">Enviar</button></form>`,
    (el) => {
      el.querySelector('#f-rep').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const { error } = await sb.from('nx_quiz_reportes').insert({
          org_id: S.org.id,
          user_id: S.user.id,
          questao: q.id,
          motivo: f.motivo.value,
          comentario: f.comentario.value.trim() || null,
        });
        if (error) return toast('Não foi possível enviar.', true);
        closeSheet();
        toast('Questão reportada. Ela vai para a lista de revisão.');
      };
    },
  );
}
async function aprReportes() {
  const [lista, eq] = await Promise.all([
    sb
      .from('nx_quiz_reportes')
      .select('*')
      .eq('org_id', S.org.id)
      .order('criado_em', { ascending: false })
      .limit(200)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    equipeLab().catch(() => []),
  ]);
  const nome = (id) => (eq.find((m) => m.user_id === id) || {}).nome || 'Treinador',
    B = S.cache.apr;
  const abertos = lista.filter((x) => !x.resolvido),
    feitos = lista.filter((x) => x.resolvido);
  const item = (x) => {
    const q = B.porId[x.questao];
    return `<div class="card apr-rev"><div class="row between" style="gap:8px"><span class="tag ${x.resolvido ? 'ok' : 'warn'}">${APR_MOTIVO[x.motivo] || x.motivo}</span><span class="tiny dim">${fmtCurto(x.criado_em)} · ${esc(firstName(nome(x.user_id)))}</span></div>
    <p class="apr-perg sm" style="margin-top:8px">${q ? esc(q.p) : `Questão ${esc(x.questao)} (removida)`}</p>${q ? `<p class="small"><span class="apr-v">Resposta atual:</span> ${esc(q.a[q.c])}</p><p class="tiny dim">${esc(q.areaT)} · ${esc(q.temaT)} · ${esc(x.questao)}</p>` : ''}
    ${x.comentario ? `<p class="small" style="margin-top:6px">“${esc(x.comentario)}”</p>` : ''}${x.resolvido ? '' : `<button class="btn sm ghost" data-res="${x.id}" style="margin-top:8px">Marcar como resolvida</button>`}</div>`;
  };
  $app.innerHTML = `<a class="back" href="#/aprimoramento">${I.back} Aprimoramento Intelectual</a><p class="eyebrow">Revisão</p><h1 class="h1">Questões reportadas</h1>
    <p class="muted" style="margin-top:6px">Peça a correção no chat com o Claude citando o código da questão (ex.: cor-ini-01).</p>
    <div class="stack" style="margin-top:14px">${abertos.map(item).join('') || '<div class="empty"><div class="h3">Nada pendente</div><p class="small muted">Use "Reportar questão" durante o quiz.</p></div>'}</div>
    ${feitos.length ? `<p class="sec-lbl">Resolvidas</p><div class="stack">${feitos.map(item).join('')}</div>` : ''}`;
  $app.querySelectorAll('[data-res]').forEach(
    (b) =>
      (b.onclick = async () => {
        const { error } = await sb.from('nx_quiz_reportes').update({ resolvido: true }).eq('id', +b.dataset.res);
        if (error) return toast('Não foi possível salvar.', true);
        toast('Marcada como resolvida.');
        aprReportes();
      }),
  );
}
async function aprEquipe() {
  const lista = await sb.rpc('nx_quiz_ranking', { p_org: S.org.id }).then(
    (r) => r.data || [],
    () => [],
  );
  const tot = Object.keys(S.cache.apr.porId).length;
  $app.innerHTML = `<a class="back" href="#/aprimoramento">${I.back} Aprimoramento Intelectual</a><p class="eyebrow">Equipe</p><h1 class="h1">Aproveitamento da equipe</h1>
    <p class="muted" style="margin-top:6px">Conta a resposta mais recente de cada questão. Refazer e acertar melhora o aproveitamento.</p>
    <div class="stack" style="margin-top:14px">${
      lista
        .map((x, k) => {
          const pct = x.respondidas ? Math.round((x.acertos / x.respondidas) * 100) : null;
          return `<div class="card apr-eq"><div class="row" style="gap:12px">${avAluno(x, 'sm')}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${k + 1}. ${esc(x.nome)}${x.user_id === S.user.id ? ' (você)' : ''}</b><span class="small muted">${x.respondidas} de ${tot} respondidas${x.ultima ? ` · última em ${fmtCurto(x.ultima)}` : ''}</span></div>${pct != null ? `<b class="apr-pct ${pct >= 70 ? 'ok' : pct >= 50 ? 'mid' : 'bad'}">${pct}%</b>` : ''}</div><div class="apr-barra"><i style="width:${(x.respondidas / tot) * 100}%"></i></div></div>`;
        })
        .join('') || '<div class="empty"><div class="h3">Ninguém respondeu ainda</div></div>'
    }</div>`;
}
