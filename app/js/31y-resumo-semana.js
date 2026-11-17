/* Nexos App · Resumo da semana (treinador → aluno).
   Toda semana o app junta, para cada aluno do treinador, o que foi feito (planilha, km, força), as dores, o check-in
   da manhã e, para quem tem Garmin, sono, frequência de repouso e VFC. Monta um rascunho de mensagem; o treinador
   confere, edita se quiser e envia na conversa do aluno. Aluno novo entra sozinho na lista.
   As contas e os textos ficam no bloco puro (testado em scripts/testes/semana.test.js). */
'use strict';

/* semana:puro:inicio */
const SEM_MESES = [
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
const semNum = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('pt-BR', { maximumFractionDigits: d });
const semHoras = (h) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
};
const semDiaIso = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
/** "10 a 16 de novembro", "27 de outubro a 2 de novembro" */
function semanaPeriodo(s0) {
  const s6 = semDiaIso(s0, 6);
  const [, m0, d0] = s0.split('-').map(Number),
    [, m6, d6] = s6.split('-').map(Number);
  return m0 === m6
    ? `${d0} a ${d6} de ${SEM_MESES[m6 - 1]}`
    : `${d0} de ${SEM_MESES[m0 - 1]} a ${d6} de ${SEM_MESES[m6 - 1]}`;
}

/** análise da semana de um aluno e o rascunho da mensagem.
 *  r = { nome, s0, fC, fM, km, kmCronico, corridas, longaoKm, previstos, feitos, forca, dores [[locais de cada registro]],
 *        checkin { dias, media, sono } | null, relogio { noites, sonoH, diasFc, fcRep, fcBase, vfc } | null }
 *  Referências: aumento de carga acima de 1,3x a média das semanas anteriores (Gabbett, 2016); 7 horas de sono ou mais
 *  para adultos (Watson et al., 2015); VFC pela faixa normal da própria pessoa (Plews et al., 2013). */
function semanaAnalise(r) {
  const bem = [],
    atencao = [],
    focos = [];
  const treinos = (r.fC ? r.corridas : 0) + (r.fM ? r.forca : 0);
  const ader = r.previstos ? Math.round((r.feitos / r.previstos) * 100) : null;
  const ck = r.checkin && r.checkin.dias >= 3 ? r.checkin : null;
  const rel = r.relogio || null;

  if (r.fC && r.previstos >= 3 && ader >= 80)
    bem.push(
      r.feitos === r.previstos
        ? `Você cumpriu todos os ${r.previstos} treinos de corrida da planilha.`
        : `Você fez ${r.feitos} dos ${r.previstos} treinos de corrida da planilha.`,
    );
  if (r.fM && r.forca >= 2) bem.push(`Fez ${r.forca} treinos de força, que ajudam a prevenir lesões.`);
  if (treinos >= 3 && !r.dores.length) bem.push('Nenhuma dor registrada nos treinos.');
  // o relógio mostrando cansaço (FC de repouso alta, VFC baixa ou pouco sono) pesa mais que o check-in bom
  const relCansado =
    rel &&
    ((rel.diasFc >= 3 && rel.fcBase && rel.fcRep - rel.fcBase >= 5) ||
      rel.vfc === 'abaixo' ||
      (rel.noites >= 4 && rel.sonoH < 7));
  if (ck && ck.media >= 16 && !relCansado)
    bem.push(`Sua prontidão média no check-in foi de ${semNum(ck.media)} de 20, sinal de boa recuperação.`);
  if (rel && rel.noites >= 4 && rel.sonoH >= 7)
    bem.push(`Dormiu em média ${semHoras(rel.sonoH)} por noite, dentro do recomendado.`);
  if (rel && rel.vfc === 'normal') bem.push('Sua VFC ficou dentro da sua faixa normal, sinal de boa recuperação.');

  // sem planilha nem treino de força no app: não cobra treino, fala só do que tem (check-in e relógio)
  if (!treinos && !r.semPlano) {
    atencao.push('Não vi treinos registrados no app nesta semana.');
    focos.push('Me conta como está a rotina, para ajustarmos a planilha ao que cabe na sua semana.');
  }
  if (r.dores.length) {
    const locais = [...new Set(r.dores.flat().filter(Boolean))];
    const n = r.dores.length;
    atencao.push(
      `Você registrou dor ${n === 1 ? 'uma vez' : `${n} vezes`}${locais.length ? ` (${locais.join(', ')})` : ''}. Me avise como está, para ajustarmos a carga se precisar.`,
    );
    focos.push('Antes dos treinos mais fortes, me conte como está a dor.');
  }
  if (rel && rel.diasFc >= 3 && rel.fcBase && rel.fcRep - rel.fcBase >= 5) {
    atencao.push(
      `Sua frequência cardíaca de repouso ficou ${Math.round(rel.fcRep - rel.fcBase)} bpm acima do seu normal. Isso pode indicar cansaço acumulado, estresse ou o começo de uma gripe.`,
    );
    focos.push('A prioridade é a recuperação. Se continuar alta, vamos aliviar os treinos fortes.');
  }
  if (rel && rel.vfc === 'abaixo') {
    atencao.push('Sua VFC ficou abaixo da sua faixa normal, sinal de que o corpo ainda está se recuperando.');
    focos.push('A prioridade é a recuperação, com boas noites de sono.');
  }
  if (rel && rel.noites >= 4 && rel.sonoH < 7) {
    atencao.push(
      `Você dormiu em média ${semHoras(rel.sonoH)} por noite, abaixo das 7 horas recomendadas para adultos.`,
    );
    focos.push('Tente ganhar um pouco mais de sono, porque é ali que o corpo assimila o treino.');
  } else if (ck && ck.sono <= 2.5) {
    atencao.push('O sono foi o ponto mais baixo do seu check-in da manhã.');
    focos.push('Tente ganhar um pouco mais de sono, porque é ali que o corpo assimila o treino.');
  }
  if (ck && ck.media < 12)
    atencao.push(`A prontidão média do check-in ficou baixa, ${semNum(ck.media)} de 20. Vale cuidar da recuperação.`);
  if (r.fC && r.kmCronico >= 10 && r.km > r.kmCronico * 1.3) {
    atencao.push(
      `O volume subiu ${Math.round((r.km / r.kmCronico - 1) * 100)}% em relação à média das últimas semanas. Vale segurar o aumento para o corpo se adaptar.`,
    );
    focos.push('Vamos manter o volume parecido para o corpo assimilar.');
  }
  if (r.fC && r.previstos >= 3 && ader < 60 && treinos) {
    atencao.push(
      `Você fez ${r.feitos} dos ${r.previstos} treinos de corrida da planilha. Vamos ver juntos o que atrapalhou.`,
    );
    focos.push('O objetivo é encaixar todos os treinos da planilha.');
  }
  if (r.fM && !r.forca && treinos) {
    atencao.push('Nenhum treino de força registrado. Duas sessões por semana já ajudam a prevenir lesões.');
    focos.push('Vamos incluir os treinos de força.');
  }

  const nome = String(r.nome || '')
    .trim()
    .split(/\s+/)[0];
  const linhas = [`Oi, ${nome}! Fechamos a sua semana de ${semanaPeriodo(r.s0)}.`];
  const feito = [];
  if (r.fC && r.corridas)
    feito.push(`${r.corridas} ${r.corridas === 1 ? 'corrida' : 'corridas'}, ${semNum(r.km)} km no total`);
  if (r.fM && r.forca) feito.push(`${r.forca} ${r.forca === 1 ? 'treino' : 'treinos'} de força`);
  if (feito.length) {
    let l = `Foram ${feito.join(' e ')}.`;
    if (r.fC && r.corridas >= 2 && r.longaoKm >= 8) l += ` A corrida mais longa teve ${semNum(r.longaoKm)} km.`;
    linhas.push(l);
  }
  linhas.push(...bem, ...atencao);
  if (treinos || r.semPlano)
    linhas.push(
      `Para esta semana, ${(focos[0] || 'é manter a constância.').replace(/^./, (c) => c.toLowerCase())} Bons treinos!`,
    );
  else linhas.push(focos[0]);
  return { bem, atencao, ader, treinos, texto: linhas.join('\n\n') };
}
/* semana:puro:fim */

/* ---------- tela do treinador ---------- */
const SEM_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h8"/></svg>';

/** junta os números da semana de cada aluno (uma busca por tabela para a equipe toda) */
async function semanaDados(s0, alunos) {
  const s6 = somaDias(s0, 6);
  const ids = alunos.map((m) => m.user_id);
  if (!ids.length) return {};
  const lista = (p) =>
    p.then(
      (r) => r.data || [],
      () => [],
    );
  const [corrs, sess, plano, pronts, rel, treinosF] = await Promise.all([
    lista(
      sb
        .from('nx_corridas')
        .select('aluno_id,data,tipo,distancia_m,duracao_s,plano_id,dor,dor_local')
        .eq('org_id', S.org.id)
        .in('aluno_id', ids)
        .gte('data', somaDias(s0, -28))
        .lte('data', s6 + 'T23:59:59')
        .limit(5000),
    ),
    lista(
      sb
        .from('nx_sessoes')
        .select('aluno_id,iniciado_em,dor,dor_local')
        .eq('org_id', S.org.id)
        .in('aluno_id', ids)
        .not('finalizado_em', 'is', null)
        .gte('iniciado_em', s0)
        .lte('iniciado_em', s6 + 'T23:59:59'),
    ),
    lista(
      sb
        .from('nx_plano_corrida')
        .select('id,aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .in('aluno_id', ids)
        .gte('data', s0)
        .lte('data', s6),
    ),
    lista(
      sb
        .from('nx_prontidao')
        .select('aluno_id,dia,total,sono,dor_locais')
        .eq('org_id', S.org.id)
        .in('aluno_id', ids)
        .gte('dia', s0)
        .lte('dia', s6),
    ),
    lista(
      sb
        .from('nx_garmin_dia')
        .select('aluno_id,dia,sono_s,fc_repouso,vfc')
        .in('aluno_id', ids)
        .gte('dia', somaDias(s0, -66))
        .lte('dia', s6),
    ),
    // quem tem treino de força ativo no app (sem isso o app não sabe se a força foi feita)
    lista(sb.from('nx_treinos').select('aluno_id').eq('org_id', S.org.id).in('aluno_id', ids).eq('ativo', true)),
  ]);
  const doAluno = (l, id) => l.filter((x) => x.aluno_id === id);
  const out = {};
  for (const m of alunos) {
    const id = m.user_id;
    // caminhada não conta como corrida nos km nem no número de corridas
    const todas = doAluno(corrs, id).filter(ehCorr);
    const cs = todas.filter((c) => c.tipo !== 'caminhada');
    const csSem = cs.filter((c) => isoDia(c.data) >= s0);
    const km = csSem.reduce((a, c) => a + (c.distancia_m || 0), 0) / 1000;
    // média semanal das 4 semanas anteriores (só se correu em pelo menos 2 delas)
    const semAnt = [1, 2, 3, 4].map((k) => {
      const a = somaDias(s0, -7 * k),
        b = somaDias(a, 6);
      return cs.filter((c) => isoDia(c.data) >= a && isoDia(c.data) <= b).reduce((x, c) => x + c.distancia_m, 0) / 1000;
    });
    const kmCronico = semAnt.filter((x) => x > 0).length >= 2 ? semAnt.reduce((a, b) => a + b, 0) / 4 : null;
    const pl = doAluno(plano, id).filter((p) => !semCorrida(p) && p.liberado !== false);
    const feitos = pl.filter(
      (p) => todas.some((c) => c.plano_id === p.id) || csSem.some((c) => isoDia(c.data) === p.data),
    ).length;
    const ss = doAluno(sess, id);
    const pr = doAluno(pronts, id);
    // um item por registro de dor; o local escrito à mão só entra se for curto (senão vira frase dentro da frase)
    const localCurto = (t) => (t && t.trim().length <= 30 ? [t.trim()] : []);
    const dores = [
      ...todas.filter((c) => c.dor && isoDia(c.data) >= s0).map((c) => localCurto(c.dor_local)),
      ...ss.filter((x) => x.dor).map((x) => localCurto(x.dor_local)),
      ...pr.filter((p) => p.dor_locais && p.dor_locais.length).map((p) => p.dor_locais.map(nomeRegDor)),
    ];
    const med = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const checkin = pr.length
      ? { dias: pr.length, media: med(pr.map((p) => +p.total || 0)), sono: med(pr.map((p) => +p.sono || 0)) }
      : null;
    // relógio (Garmin): sono e FC de repouso da semana, VFC pela faixa pessoal
    const g = doAluno(rel, id);
    const gSem = g.filter((x) => x.dia >= s0);
    let relogio = null;
    if (gSem.length) {
      const sonos = gSem.filter((x) => x.sono_s > 0).map((x) => x.sono_s / 3600);
      const fcs = gSem.filter((x) => x.fc_repouso > 0).map((x) => +x.fc_repouso);
      const fcSerie = g.filter((x) => x.fc_repouso > 0).map((x) => ({ dia: x.dia, v: +x.fc_repouso }));
      const vfcSerie = g.filter((x) => x.vfc > 0).map((x) => ({ dia: x.dia, v: +x.vfc }));
      const lv = leituraVfc(vfcSerie, s6);
      relogio = {
        noites: sonos.length,
        sonoH: med(sonos),
        diasFc: fcs.length,
        fcRep: med(fcs),
        fcBase: mediaPessoal(fcSerie, s0, 30, 7),
        vfc: lv.estado === 'base' ? null : lv.estado,
      };
    }
    const longa = csSem.reduce((a, c) => Math.max(a, c.distancia_m || 0), 0) / 1000;
    const fC = faz('corrida', m),
      fM = faz('musculacao', m) && treinosF.some((t) => t.aluno_id === id);
    const r = {
      nome: m.apelido || m.nome,
      s0,
      fC,
      fM,
      semPlano: !fM && (!fC || (!pl.length && !csSem.length)),
      km,
      kmCronico,
      corridas: csSem.length,
      longaoKm: longa,
      previstos: pl.length,
      feitos,
      forca: ss.length,
      dores,
      checkin,
      relogio,
    };
    out[id] = { r, a: semanaAnalise(r) };
  }
  return out;
}

async function staffResumoSemana(sel) {
  loading();
  const segAtual = isoDia(inicioSemana());
  const s0 =
    /^\d{4}-\d{2}-\d{2}$/.test(sel || '') && sel <= segAtual ? isoDia(inicioSemana(dia(sel))) : somaDias(segAtual, -7);
  const emAndamento = s0 === segAtual;
  const [membT, salvos] = await Promise.all([
    sb
      .from('nx_membros')
      .select(
        'user_id,nome,apelido,foto_url,ativo,aprovacao,treinador_id,treinador_forca_id,treinador_corrida_id,modalidades,criado_em',
      )
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_resumos_semana')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('semana', s0)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  dockStaff();
  // só os alunos de quem eu sou o responsável; quem entrou depois do fim da semana fica de fora dela
  const fimSem = somaDias(s0, 6);
  const al = membT.filter(
    (m) =>
      ehMeuResponsavel(m) &&
      m.ativo &&
      m.aprovacao !== 'pendente' &&
      m.aprovacao !== 'recusado' &&
      (!m.criado_em || isoDia(m.criado_em) <= fimSem),
  );
  const D = await semanaDados(s0, al);
  const sv = Object.fromEntries(salvos.map((x) => [x.aluno_id, x]));
  const st = S.cache.semTxt || (S.cache.semTxt = {});
  const chave = (id) => s0 + '|' + id;
  const enviados = al.filter((m) => sv[m.user_id] && sv[m.user_id].enviado_em);
  // primeiro quem pede atenção, depois os outros; os enviados vão para o fim
  const ordem = [...al].sort((a, b) => {
    const ea = sv[a.user_id] && sv[a.user_id].enviado_em ? 1 : 0,
      eb = sv[b.user_id] && sv[b.user_id].enviado_em ? 1 : 0;
    return ea - eb || D[b.user_id].a.atencao.length - D[a.user_id].a.atencao.length;
  });
  const chips = (r) =>
    [
      r.fC ? `<span>${f1(r.km)} km</span>` : '',
      r.fC && r.previstos ? `<span>planilha ${r.feitos}/${r.previstos}</span>` : '',
      r.fM ? `<span>força ${r.forca}</span>` : '',
      r.checkin ? `<span>prontidão ${f1(r.checkin.media)}</span>` : '',
      r.relogio && r.relogio.noites ? `<span>sono ${semHoras(r.relogio.sonoH)}</span>` : '',
      r.relogio && r.relogio.diasFc ? `<span>FC rep. ${Math.round(r.relogio.fcRep)}</span>` : '',
      r.relogio && r.relogio.vfc ? `<span>VFC ${r.relogio.vfc}</span>` : '',
    ]
      .filter(Boolean)
      .join('');
  const cartao = (m) => {
    const { r, a } = D[m.user_id];
    const s = sv[m.user_id];
    const txt = st[chave(m.user_id)] ?? (s && s.texto) ?? a.texto;
    const tag =
      s && s.enviado_em
        ? `<span class="tag ok">Enviado ${fmtCurto(s.enviado_em)}</span>`
        : a.atencao.length
          ? `<span class="tag warn">${a.atencao.length} ${a.atencao.length === 1 ? 'ponto' : 'pontos'} de atenção</span>`
          : '<span class="tag">Para enviar</span>';
    return `<details class="card rs-al" data-id="${m.user_id}"><summary class="row" style="gap:12px;align-items:flex-start">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><div class="rs-chips">${chips(r)}</div><div class="rs-st">${tag}</div></div>${I.chev}</summary>
      <div class="rs-corpo">
        ${a.atencao.length ? `<p class="rs-lbl at">Atenção</p><ul class="rs-lista at">${a.atencao.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${a.bem.length ? `<p class="rs-lbl ok">Foi bem</p><ul class="rs-lista ok">${a.bem.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${!r.relogio ? '<p class="tiny dim" style="margin-top:6px">Sem dados de saúde do relógio nesta semana (sono, FC de repouso e VFC chegam pelo Garmin).</p>' : ''}
        <label class="field" style="margin-top:12px"><span>Mensagem para ${esc(firstName(m.apelido || m.nome))}</span><textarea class="textarea rs-tx" rows="9">${esc(txt)}</textarea></label>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:4px"><button type="button" class="link-btn small rs-refazer">Voltar ao texto do app</button><button type="button" class="link-btn small rs-copiar">Copiar</button></div>
        <div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn ghost grow rs-salvar">Salvar</button><button type="button" class="btn grow rs-enviar">${s && s.enviado_em ? 'Enviar de novo' : 'Enviar na conversa'}</button></div>
      </div></details>`;
  };
  const nav = `<div class="mes-nav pe-nav"><a class="icon-btn sm" href="#/semana/${somaDias(s0, -7)}" aria-label="Semana anterior">${I.back}</a><b class="rs-per">${semanaPeriodo(s0)}${emAndamento ? ' (em andamento)' : ''}</b>${emAndamento ? '<span class="icon-btn sm" style="visibility:hidden"></span>' : `<a class="icon-btn sm" href="#/semana/${somaDias(s0, 7)}" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</a>`}</div>`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Acompanhamento</p><h1 class="h1">Resumo da semana</h1>
    <p class="small muted" style="margin-top:6px">O app junta a semana de cada aluno seu (planilha, km, força, dores, check-in e, para quem tem Garmin, sono, FC de repouso e VFC) e escreve um rascunho. Confira, ajuste se quiser e envie na conversa. Aluno novo aparece aqui sozinho.</p>
    ${nav}
    <div class="pe-resumo rs-res">
      <div><b>${al.length}</b><span>aluno${al.length === 1 ? '' : 's'}</span></div>
      <div class="ok"><b>${enviados.length}</b><span>enviado${enviados.length === 1 ? '' : 's'}</span></div>
      <div class="${al.length - enviados.length ? 'warn' : ''}"><b>${al.length - enviados.length}</b><span>para enviar</span></div>
    </div>
    ${emAndamento ? '<p class="tiny dim" style="margin-top:10px">A semana ainda não terminou: os números contam só até hoje.</p>' : ''}
    <div class="stack" style="margin-top:16px">${ordem.length ? ordem.map(cartao).join('') : '<div class="card"><p class="small muted">Nenhum aluno seu nesta semana.</p></div>'}</div>`;
  $app.querySelectorAll('.rs-al').forEach((el) => {
    const id = el.dataset.id,
      m = al.find((x) => x.user_id === id),
      { r, a } = D[id];
    const ta = el.querySelector('.rs-tx');
    ta.oninput = () => (st[chave(id)] = ta.value);
    el.querySelector('.rs-refazer').onclick = () => {
      ta.value = a.texto;
      st[chave(id)] = a.texto;
    };
    el.querySelector('.rs-copiar').onclick = async () => {
      try {
        await navigator.clipboard.writeText(ta.value);
        toast('Texto copiado.');
      } catch {
        toast('Não foi possível copiar.', true);
      }
    };
    const gravar = async (enviar, bt) => {
      const texto = ta.value.trim();
      if (!texto) return toast('Escreva a mensagem antes.', true);
      bt.disabled = true;
      const t0 = bt.textContent;
      bt.textContent = enviar ? 'Enviando…' : 'Salvando…';
      let mensagem_id = (sv[id] && sv[id].mensagem_id) || null;
      if (enviar) {
        const { data: nm, error } = await sb
          .from('nx_mensagens')
          .insert({ org_id: S.org.id, aluno_id: id, autor_id: S.user.id, texto })
          .select('id')
          .single();
        if (error || !nm) {
          bt.disabled = false;
          bt.textContent = t0;
          return toast('Não foi possível enviar. Tente de novo.', true);
        }
        mensagem_id = nm.id;
        notificar('mensagem', nm.id);
      }
      const row = {
        org_id: S.org.id,
        aluno_id: id,
        semana: s0,
        texto,
        dados: {
          km: +r.km.toFixed(2),
          corridas: r.corridas,
          forca: r.forca,
          previstos: r.previstos,
          feitos: r.feitos,
          dores: r.dores.length,
          atencao: a.atencao.length,
        },
        mensagem_id,
        atualizado_em: new Date().toISOString(),
        ...(enviar ? { enviado_em: new Date().toISOString(), enviado_por: S.user.id } : {}),
      };
      const { error: e2 } = await sb.from('nx_resumos_semana').upsert(row, { onConflict: 'aluno_id,semana' });
      if (e2 && !enviar) {
        bt.disabled = false;
        bt.textContent = t0;
        return toast('Não foi possível salvar. Tente de novo.', true);
      }
      delete st[chave(id)];
      toast(enviar ? `Enviado! ${firstName(m.apelido || m.nome)} recebeu na conversa.` : 'Rascunho salvo.');
      staffResumoSemana(s0);
    };
    const bS = el.querySelector('.rs-salvar'),
      bE = el.querySelector('.rs-enviar');
    bS.onclick = () => gravar(false, bS);
    bE.onclick = () => gravar(true, bE);
  });
}
