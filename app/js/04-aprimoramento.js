/* Nexos App · Aprimoramento intelectual (só treinadores).
   Parte 4 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= APRIMORAMENTO INTELECTUAL (só treinadores) ================= */
// banco de questões em app/aprimoramento/*.json (cada questão com explicação e fonte); respostas em nx_quiz_respostas
const APR_AREAS = ['corrida', 'triatlo', 'forca', 'anatomia', 'sistemas', 'fisiologia', 'casos'];
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
async function viewAprimoramento(area, tema) {
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
  if (ar && tema) {
    const t = ar.temas.find((x) => x.id === tema);
    if (t)
      return aprQuiz(
        aprSorteio(
          t.q.map((q) => q.id),
          ult,
          10,
        ),
        t.titulo,
        `#/aprimoramento/${ar.id}`,
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
    $app.innerHTML = `<a class="back" href="#/aprimoramento">${I.back} Aprimoramento Intelectual</a><p class="eyebrow">Área</p><h1 class="h1">${esc(ar.titulo)}</h1><p class="muted" style="margin-top:6px">${esc(ar.desc)}</p>
      <div class="card apr-resumo">${aprBarra(aprStats(idsA, ult))}<a class="btn block" href="#/aprimoramento/${ar.id}/simulado" style="margin-top:12px">Simulado da área (15 questões)</a></div>
      <p class="sec-lbl">Temas</p><div class="stack">${ar.temas
        .map((t) => {
          const st = aprStats(
            t.q.map((q) => q.id),
            ult,
          );
          return `<a class="card apr-tema" href="#/aprimoramento/${ar.id}/${t.id}" style="color:inherit"><div class="row between" style="gap:10px"><b>${esc(t.titulo)}</b>${I.chev}</div>${aprBarra(st)}</a>`;
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
    <p class="sec-lbl">Áreas</p><div class="stack">${B.areas
      .map((ar) => {
        const ids = ar.temas.flatMap((x) => x.q.map((q) => q.id));
        return `<a class="card apr-area" href="#/aprimoramento/${ar.id}" style="color:inherit"><div class="row between" style="gap:10px;align-items:flex-start"><div class="grow" style="min-width:0"><b class="h3">${esc(ar.titulo)}</b><p class="small muted" style="margin-top:4px">${ar.temas.length} temas · ${esc(ar.desc)}</p></div>${I.chev}</div>${aprBarra(aprStats(ids, ult))}</a>`;
      })
      .join('')}</div>
    <p class="sec-lbl">Equipe</p><a class="list-item" href="#/aprimoramento/reportes" style="color:inherit;margin-bottom:8px"><span class="ativ-ic">${I.alerta}</span><div class="grow"><b>Questões reportadas <span id="apr-nrep"></span></b><div class="small muted">O que a equipe marcou para revisar</div></div>${I.chev}</a><a class="list-item" href="#/aprimoramento/equipe" style="color:inherit"><span class="ativ-ic">${TROFEU_IC}</span><div class="grow"><b>Aproveitamento da equipe</b><div class="small muted">Quantas questões cada treinador respondeu e acertou</div></div>${I.chev}</a>`;
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
        const { error } = await sb
          .from('nx_quiz_reportes')
          .insert({
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
