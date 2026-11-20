// Avaliações da equipe (Mais do treinador): tudo o que foi avaliado dos seus alunos num lugar só.
// Análise biomecânica da corrida, avaliação do movimento, avaliação física e postural, com o que espera por você no topo.
const aveNorm = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const AVE_TIPOS = {
  passada: { t: 'Análise da corrida', ic: () => PS_IC },
  movimento: { t: 'Avaliação do movimento', ic: () => MV_IC },
  fisica: { t: 'Avaliação física', ic: () => I.check },
  postural: { t: 'Avaliação postural', ic: () => I.cam },
};
async function viewAvaliacoesEquipe(filtro) {
  loading();
  const st = S.cache.ave || (S.cache.ave = { f: 'todas', busca: '' });
  if (filtro) st.f = filtro;
  const org = S.org.id;
  const [mem, pa, mv, av, po] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,ativo,treinador_id,treinador_forca_id,treinador_corrida_id')
      .eq('org_id', org)
      .eq('papel', 'aluno'),
    sb
      .from('nx_passadas')
      .select('id,aluno_id,criado_em,vista,relatorio_path,visto_em')
      .eq('org_id', org)
      .order('criado_em', { ascending: false })
      .limit(300),
    sb
      .from('nx_movimento')
      .select('id,aluno_id,criado_em,teste,lado,enviado_em,visto_em')
      .eq('org_id', org)
      .order('criado_em', { ascending: false })
      .limit(300),
    sb
      .from('nx_avaliacoes')
      .select('id,aluno_id,data,metodo,protocolo,peso,criado_em')
      .eq('org_id', org)
      .order('data', { ascending: false })
      .limit(300),
    sb
      .from('nx_posturais')
      .select('id,aluno_id,data,criado_em')
      .eq('org_id', org)
      .order('data', { ascending: false })
      .limit(300),
  ]);
  // só os alunos deste treinador (responsável, força ou corrida)
  const meus = new Map((mem.data || []).filter(ehMeuAluno).map((m) => [m.user_id, m]));
  const itens = [];
  for (const x of pa.data || [])
    if (meus.has(x.aluno_id))
      itens.push({
        tipo: 'passada',
        aluno: x.aluno_id,
        quando: x.criado_em,
        sub: x.vista === 'lado' ? 'de lado' : 'por trás',
        pend: !x.relatorio_path,
        st: x.relatorio_path ? (x.visto_em ? 'Visto pelo aluno' : 'Relatório enviado') : 'Esperando o seu relatório',
        href: `#/aluno/${x.aluno_id}/passada/${x.id}`,
      });
  for (const x of mv.data || [])
    if (meus.has(x.aluno_id))
      itens.push({
        tipo: 'movimento',
        aluno: x.aluno_id,
        quando: x.criado_em,
        sub:
          ((MV_TESTES[x.teste] || {}).curto || x.teste) +
          (x.lado ? ` · ${x.lado === 'E' ? 'esquerdo' : 'direito'}` : ''),
        pend: !x.enviado_em,
        st: x.enviado_em ? (x.visto_em ? 'Visto pelo aluno' : 'Enviado ao aluno') : 'Esperando a sua análise',
        href: `#/aluno/${x.aluno_id}/movimento/${x.id}`,
      });
  for (const x of av.data || [])
    if (meus.has(x.aluno_id))
      itens.push({
        tipo: 'fisica',
        aluno: x.aluno_id,
        quando: x.data || x.criado_em,
        sub:
          (x.metodo === 'bioimpedancia'
            ? 'Bioimpedância'
            : x.metodo === 'perimetros'
              ? 'Perímetros (fita)'
              : (PROTOCOLOS[x.protocolo] || {}).nome || 'Dobras cutâneas') +
          (x.peso ? ` · ${String(x.peso).replace('.', ',')} kg` : ''),
        pend: false,
        st: 'Relatório pronto',
        href: `#/relatorio/${x.id}`,
      });
  for (const x of po.data || [])
    if (meus.has(x.aluno_id))
      itens.push({
        tipo: 'postural',
        aluno: x.aluno_id,
        quando: x.data || x.criado_em,
        sub: 'Fotos e achados posturais',
        pend: false,
        st: 'Relatório pronto',
        href: `#/postural/${x.id}`,
      });
  itens.sort((a, b) => String(b.quando).localeCompare(String(a.quando)));
  const nPend = itens.filter((x) => x.pend).length;
  const conta = (t) => itens.filter((x) => x.tipo === t).length;
  const chips = [
    ['todas', 'Todas', itens.length],
    ['pendentes', 'Esperando você', nPend],
    ['passada', 'Corrida', conta('passada')],
    ['movimento', 'Movimento', conta('movimento')],
    ['fisica', 'Física', conta('fisica')],
    ['postural', 'Postural', conta('postural')],
  ];
  const desenhar = () => {
    const q = aveNorm(st.busca || '');
    const lista = itens.filter(
      (x) =>
        (st.f === 'todas' || (st.f === 'pendentes' ? x.pend : x.tipo === st.f)) &&
        (!q || aveNorm((meus.get(x.aluno) || {}).nome || '').includes(q)),
    );
    let mesAnt = '';
    const html = lista
      .map((x) => {
        const m = meus.get(x.aluno) || {};
        const mes = String(x.quando).slice(0, 7);
        const cab = mes !== mesAnt ? `<p class="eyebrow" style="margin:18px 0 8px">${esc(nomeMes(mes))}</p>` : '';
        mesAnt = mes;
        return `${cab}<a class="list-item" href="${x.href}" style="color:inherit"><span class="ativ-ic">${AVE_TIPOS[x.tipo].ic()}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome || 'Aluno')}</b><div class="small muted ellip">${AVE_TIPOS[x.tipo].t} · ${esc(x.sub)}</div><div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap;align-items:center"><span class="tag ${x.pend ? 'warn' : ''}">${esc(x.st)}</span><span class="tiny dim">${fmtDia(String(x.quando).length > 10 ? x.quando : x.quando + 'T12:00:00')}</span></div></div>${I.chev}</a>`;
      })
      .join('');
    document.getElementById('ave-lista').innerHTML =
      html ||
      `<div class="card" style="margin-top:18px;text-align:center"><p class="muted">${st.f === 'pendentes' ? 'Nada esperando você. Tudo analisado e enviado.' : 'Nenhuma avaliação aqui ainda.'}</p></div>`;
    document.querySelectorAll('[data-ave]').forEach((c) => c.classList.toggle('on', c.dataset.ave === st.f));
  };
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Acompanhar os alunos</p><h1 class="h1">Avaliações</h1>
    <p class="muted" style="margin-top:6px">Tudo o que foi avaliado dos seus alunos: análise da corrida, movimento, física e postural.${nPend ? ` <b>${nPend}</b> ${nPend === 1 ? 'espera' : 'esperam'} por você.` : ''}</p>
    <input class="input" id="ave-busca" placeholder="Buscar aluno" value="${esc(st.busca || '')}" style="margin-top:14px">
    <div class="chips wrap" style="margin-top:10px">${chips
      .filter(([k, , n]) => n || k === 'todas' || k === 'pendentes')
      .map(([k, t, n]) => `<button type="button" class="chip" data-ave="${k}">${t} ${n ? `<b>${n}</b>` : ''}</button>`)
      .join('')}</div>
    <div id="ave-lista"></div>`;
  document.querySelectorAll('[data-ave]').forEach(
    (c) =>
      (c.onclick = () => {
        st.f = c.dataset.ave;
        desenhar();
      }),
  );
  document.getElementById('ave-busca').oninput = (e) => {
    st.busca = e.target.value;
    desenhar();
  };
  desenhar();
}
