/* Nexos App · Tela Hoje (aluno e treinador).
   Parte 23 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= HOJE: o que pede atenção ================= */
/** treinador marca o treino como visto: o aluno recebe "Seu treinador analisou seu treino" */
// comentário do treinador sobre um treino (fica no treino, não vai para o chat)
function comentarTreino(c, al) {
  const tinha = !!c.comentario_treinador;
  openSheet(
    `<p class="eyebrow">Comentário sobre o treino</p><div class="h2" style="margin-top:4px">${esc(firstName((al && al.nome) || 'Aluno'))} · ${fmtKm(c.distancia_m)}</div>
    <p class="small muted" style="margin-top:6px">Aparece para o aluno dentro deste treino. Não vai para o chat.</p>
    <textarea class="textarea" id="ct-txt" rows="5" style="margin-top:12px" placeholder="Ex.: ótimo controle no ritmo dos tiros. Na recuperação, segure um pouco mais." autofocus>${esc(c.comentario_treinador || '')}</textarea>
    <button class="btn block" id="ct-salvar" style="margin-top:12px">${tinha ? 'Salvar comentário' : 'Enviar comentário'}</button>
    ${tinha ? '<button class="link-btn small" id="ct-apagar" style="margin:12px auto 0;display:block">Remover comentário</button>' : ''}`,
    (r) => {
      const enviar = async (texto) => {
        const bt = r.querySelector('#ct-salvar');
        bt.disabled = true;
        bt.textContent = 'Enviando…';
        const { data, error } = await sb.functions.invoke('nx-push', {
          body: { acao: 'visto', tipo: 'corrida', id: c.id, comentario: texto },
        });
        if (error || (data && data.erro)) {
          bt.disabled = false;
          bt.textContent = 'Tentar de novo';
          return toast((data && data.erro) || 'Não foi possível salvar agora.', true);
        }
        closeSheet();
        toast(texto ? 'Comentário enviado! O aluno vê no treino.' : 'Comentário removido.');
        contarNaoVistos()
          .then(dockStaff)
          .catch(() => {});
        router();
      };
      r.querySelector('#ct-salvar').onclick = () => {
        const t = r.querySelector('#ct-txt').value.trim();
        if (!t) return toast('Escreva o comentário.', true);
        enviar(t);
      };
      const ap = r.querySelector('#ct-apagar');
      if (ap) ap.onclick = () => confirm('Remover o comentário deste treino?') && enviar('');
    },
  );
}
async function marcarVisto(b) {
  const [tipo, id] = b.dataset.visto.split('|');
  b.disabled = true;
  b.textContent = '…';
  const { data, error } = await sb.functions.invoke('nx-push', { body: { acao: 'visto', tipo, id } });
  if (error || (data && data.erro)) {
    b.disabled = false;
    b.innerHTML = `${I.check} Visto`;
    return toast((data && data.erro) || 'Não foi possível marcar agora.', true);
  }
  b.outerHTML = `<span class="visto-ok" title="Você já viu">${I.check}</span>`;
  toast('Visto! O aluno foi avisado que você analisou o treino.');
  contarNaoVistos()
    .then(dockStaff)
    .catch(() => {});
}
// separação por treinador: cada um vê só os próprios alunos (e os que ainda estão sem treinador, para alguém assumir)
const formMeu = (f) => !f.criado_por || f.criado_por === S.user.id;
const ehMeuAluno = (m) => !!m && (!m.treinador_id || m.treinador_id === S.user.id);
async function idsMeusAlunos() {
  const { data } = await sb
    .from('nx_membros')
    .select('user_id,treinador_id')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno');
  return new Set((data || []).filter(ehMeuAluno).map((m) => m.user_id));
}
async function staffHoje() {
  loading();
  const seteDias = new Date(Date.now() - 7 * 864e5).toISOString();
  const segAtual = isoDia(inicioSemana()),
    segPass = somaDias(segAtual, -7),
    segProx = somaDias(segAtual, 7);
  const prontP = sb
    .from('nx_prontidao')
    .select('aluno_id,dia,total,dor,dor_locais,alerta')
    .eq('org_id', S.org.id)
    .eq('dia', hojeISO())
    .then(
      (r) => r.data || [],
      () => [],
    );
  const resgP = sb
    .from('nx_resgates')
    .select('aluno_id,enviado_em')
    .eq('org_id', S.org.id)
    .gte('enviado_em', new Date(Date.now() - 7 * 864e5).toISOString())
    .then(
      (r) => r.data || [],
      () => [],
    );
  const satP = sb
    .from('nx_satisfacao')
    .select('aluno_id,nota,criado_em')
    .eq('org_id', S.org.id)
    .eq('adiada', false)
    .lte('nota', 6)
    .gte('criado_em', new Date(Date.now() - 14 * 864e5).toISOString())
    .then(
      (r) => r.data || [],
      () => [],
    );
  const cicP = sb
    .from('nx_ciclo_dias')
    .select('aluno_id,colica_int,fluxo')
    .eq('org_id', S.org.id)
    .eq('dia', hojeISO())
    .then(
      (r) => r.data || [],
      () => [],
    );
  const cargasP = buscarCargas(null).catch(() => ({}));
  const [{ data: membrosT }, sessT, corrT, anamsT, avsT, cobsT, provasEqT, planoResT, treinosResT, libsResT] =
    await Promise.all([
      sb
        .from('nx_membros')
        .select(
          'user_id,nome,email,ativo,aprovacao,pedido_em,objetivo,criado_em,sexo,treinador_id,foto_url,nascimento,telefone,modalidades,disponibilidade',
        )
        .eq('org_id', S.org.id)
        .eq('papel', 'aluno')
        .order('nome'),
      buscarSessoes(null, 300),
      sb
        .from('nx_corridas')
        .select('id,aluno_id,data,tipo,distancia_m,duracao_s,rpe,dor,dor_local,cansaco,sono,visto_treinador,plano_id')
        .eq('org_id', S.org.id)
        .order('data', { ascending: false })
        .limit(300)
        .then((r) => r.data || []),
      sb
        .from('nx_anamneses')
        .select('aluno_id,parq_positivo,visto_treinador,atestado_path')
        .eq('org_id', S.org.id)
        .then((r) => r.data || []),
      sb
        .from('nx_avaliacoes')
        .select('aluno_id,data,proxima')
        .eq('org_id', S.org.id)
        .order('data', { ascending: false })
        .then((r) => r.data || []),
      sb
        .from('nx_cobrancas')
        .select('id,aluno_id,valor,vencimento,status,competencia')
        .eq('org_id', S.org.id)
        .in('status', ['aberta', 'informada'])
        .then((r) => r.data || []),
      sb
        .from('nx_participacoes')
        .select('aluno_id,titulo,data,distancia')
        .eq('org_id', S.org.id)
        .gte('data', hojeISO())
        .lte('data', isoDia(Date.now() + 21 * 864e5))
        .order('data')
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_plano_corrida')
        .select('id,aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .gte('data', segPass)
        .lte('data', somaDias(segProx, 6))
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_treinos')
        .select('aluno_id,dias,ativo')
        .eq('org_id', S.org.id)
        .eq('ativo', true)
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_forca_semanas')
        .select('aluno_id,semana')
        .eq('org_id', S.org.id)
        .gte('semana', segPass)
        .then((r) => r.data || [])
        .catch(() => []),
      contarNaoVistos(),
      contarMsgNovas(),
    ]);
  const membros = (membrosT || []).filter(ehMeuAluno),
    vis = new Set(membros.map((m) => m.user_id)),
    soMeus = (l) => (l || []).filter((x) => vis.has(x.aluno_id));
  const [sess, corr, anams, avs, cobs, provasEq, planoRes, treinosRes, libsRes] = [
    sessT,
    corrT,
    anamsT,
    avsT,
    cobsT,
    provasEqT,
    planoResT,
    treinosResT,
    libsResT,
  ].map(soMeus);
  dockStaff();
  const fimPl = await fimPlanilhas();
  const ativos = (membros || []).filter((m) => m.ativo);
  const pendentes = (membros || [])
    .filter((m) => m.aprovacao === 'pendente')
    .sort((a, b) => ((a.pedido_em || '') < (b.pedido_em || '') ? 1 : -1));
  S.cache.pendentes = pendentes.length;
  dockStaff();
  const hoje = hojeISO();
  const ultimoTreino = {};
  sess.forEach((s) => {
    if (!ultimoTreino[s.aluno_id] || s.iniciado_em > ultimoTreino[s.aluno_id]) ultimoTreino[s.aluno_id] = s.iniciado_em;
  });
  corr.forEach((c) => {
    if (!ultimoTreino[c.aluno_id] || c.data > ultimoTreino[c.aluno_id]) ultimoTreino[c.aluno_id] = c.data;
  });
  const ultAval = {};
  avs.forEach((a) => {
    if (!ultAval[a.aluno_id]) ultAval[a.aluno_id] = a;
  });
  const [pronts, cargas, cicH, satB, resgs] = await Promise.all([prontP, cargasP, cicP, satP, resgP]);
  const alertas = ativos
    .map((m) => {
      const id = m.user_id,
        l = [];
      const ch = cicH.find((x) => x.aluno_id === id);
      if (ch && ((ch.colica_int != null && ch.colica_int >= 7) || ch.fluxo === 'intenso'))
        l.push({
          p: 2,
          t:
            ch.colica_int != null && ch.colica_int >= 7
              ? `Cólica forte hoje (${ch.colica_int}/10)`
              : 'Fluxo menstrual intenso hoje',
          cls: 'warn',
          ir: '#/prontidao-equipe',
        });
      const sb_ = satB.find((x) => x.aluno_id === id);
      if (sb_)
        l.push({ p: 2, t: `Nota ${sb_.nota} na pesquisa de satisfação`, cls: 'warn', ir: `#/laboratorio/assessoria` });
      const cg = cargas[id];
      if (cg && cg.nivel)
        l.push({
          p: cg.nivel === 'alto' ? 1 : 2,
          t: cg.curto,
          cls: cg.nivel === 'alto' ? 'err' : 'warn',
          ir: `#/aluno/${id}/${faz('corrida', m) ? 'corrida' : 'forca'}`,
        });
      const pr = pronts.find((x) => x.aluno_id === id && x.alerta);
      if (pr)
        l.push({
          p: 1,
          t: `Prontidão baixa hoje (${pr.total}/20)${pr.dor_locais && pr.dor_locais.length ? ' · dor: ' + pr.dor_locais.map(nomeRegDor).join(', ') : ''}`,
          cls: 'err',
          ir: `#/aluno/${id}/saude`,
        });
      const dorS = sess.find((s) => s.aluno_id === id && s.dor && !s.visto_treinador && s.iniciado_em > seteDias);
      const dorC = corr.find((c) => c.aluno_id === id && c.dor && !c.visto_treinador && c.data > seteDias);
      if (dorS || dorC)
        l.push({
          p: 1,
          t: dorS && dorS.dor_local ? `Dor: ${dorS.dor_local}` : 'Relatou dor',
          cls: 'err',
          ir: dorS ? `#/aluno/${id}/historico` : `#/corrida/${dorC.id}`,
        });
      // termômetro dos últimos 7 dias (check-ins de força e corrida)
      const ck = [
        ...sess
          .filter((s) => s.aluno_id === id && s.iniciado_em > seteDias)
          .map((s) => ({ e: s.esforco, dor: s.dor, c: s.cansaco, so: s.sono })),
        ...corr
          .filter((c) => c.aluno_id === id && c.data > seteDias)
          .map((c) => ({ e: c.rpe, dor: c.dor, c: c.cansaco, so: c.sono })),
      ];
      const esf = ck.filter((x) => x.e != null).map((x) => x.e);
      const ir = `#/aluno/${id}/historico`;
      if (!dorS && !dorC && ck.filter((x) => x.dor).length >= 2)
        l.push({ p: 1, t: 'Dor repetida na semana', cls: 'err', ir });
      if (
        esf.filter((e) => e >= 8).length >= 3 ||
        (esf.length >= 3 && esf.reduce((a, b) => a + b, 0) / esf.length >= 7.5)
      )
        l.push({ p: 1, t: 'Sobrecarga: esforço alto', cls: 'err', ir });
      if (ck.filter((x) => x.c === 2).length >= 2) l.push({ p: 2, t: 'Muito cansado', cls: 'warn', ir });
      if (ck.filter((x) => x.so === 2).length >= 2) l.push({ p: 2, t: 'Dormindo mal', cls: 'warn', ir });
      const an = anams.find((a) => a.aluno_id === id);
      if (an && an.parq_positivo && !an.visto_treinador)
        l.push({ p: 1, t: 'PAR-Q com “sim”', cls: 'err', ir: `#/aluno/${id}/saude` });
      else if (an && an.parq_positivo && !an.atestado_path)
        l.push({ p: 3, t: 'Sem atestado médico', cls: 'warn', ir: `#/aluno/${id}/saude` });
      const pv = provasEq.find((x) => x.aluno_id === id);
      if (pv) {
        const dd = diasAte(pv.data);
        l.push({
          p: 2,
          t: `Prova ${dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : dd < 7 ? `em ${dd} dias` : `em ${dd} dias`}`,
          cls: 'prova',
          ir: `#/aluno/${id}/corrida`,
        });
      }
      const msgs = (S.cache.msgPorAluno || {})[id];
      if (msgs)
        l.push({ p: 2, t: `${msgs} mensage${msgs > 1 ? 'ns' : 'm'}`, cls: 'acc', ir: `#/aluno/${id}/conversa` });
      const inf = cobs.find((c) => c.aluno_id === id && c.status === 'informada');
      if (inf) l.push({ p: 2, t: 'Avisou que pagou', cls: 'acc', ir: '#/financeiro', cob: inf.id });
      const atr = cobs.find((c) => c.aluno_id === id && c.status === 'aberta' && c.vencimento < hoje);
      if (atr) l.push({ p: 3, t: 'Mensalidade atrasada', cls: 'warn', ir: '#/financeiro' });
      const ult = ultimoTreino[id];
      const dd = ult ? diasDesde(ult) : diasDesde(m.criado_em);
      const rsg = resgs.find((x) => x.aluno_id === id);
      if (dd >= 7)
        l.push({
          p: rsg ? 4 : dd >= 21 ? 1 : 3,
          t: ult
            ? `Sem treinar há ${dd} dias${rsg ? ` · mensagem enviada ${fmtCurto(rsg.enviado_em)}` : ''}`
            : 'Ainda não treinou',
          cls: rsg ? '' : dd >= 21 ? 'err' : 'warn',
          ir: `#/aluno/${id}/conversa`,
          resg: ult && dd >= RESGATE_DIAS && !rsg ? dd : 0,
        });
      if (faz('corrida', m)) {
        const sp = statusPlanilha(fimPl[id]);
        if (sp.d < 0)
          l.push({
            p: 1,
            t: fimPl[id] ? 'Planilha acabou, sem a próxima' : 'Sem planilha de corrida',
            cls: 'err',
            ir: `#/aluno/${id}/corrida`,
          });
        else if (sp.d <= 4)
          l.push({
            p: 2,
            t: `Planilha acaba ${sp.d === 0 ? 'hoje' : sp.d === 1 ? 'amanhã' : `em ${sp.d} dias`}`,
            cls: 'warn',
            ir: `#/aluno/${id}/corrida`,
          });
      }
      const av = ultAval[id];
      if (av && av.proxima && av.proxima < hoje) {
        const dd = Math.round((dia(hoje) - dia(av.proxima)) / 864e5);
        l.push({
          p: dd > 30 ? 2 : 3,
          t: `Reavaliação vencida desde ${fmtCurto(av.proxima)}${dd > 30 ? ` (${dd} dias)` : ''}`,
          cls: 'warn',
          ir: `#/aluno/${id}/avaliacoes`,
        });
      }
      l.sort((a, b) => a.p - b.p);
      return { m, l };
    })
    .filter((x) => x.l.length)
    .sort((a, b) => a.l[0].p - b.l[0].p || a.m.nome.localeCompare(b.m.nome));
  const nomes = Object.fromEntries((membros || []).map((m) => [m.user_id, m.nome]));
  const alMeus = alertas;
  const recentes = [
    ...sess
      .filter((s) => s.iniciado_em > seteDias)
      .map((s) => ({
        id: s.id,
        tp: 'sessao',
        t: s.iniciado_em,
        novo: !s.visto_treinador,
        h: `#/aluno/${s.aluno_id}/historico`,
        n: nomes[s.aluno_id],
        d: `${esc(s.treino_titulo || 'Treino')}${s.esforco != null ? ` · esforço ${s.esforco}` : ''}`,
        dor: s.dor,
        ic: I.lib,
      })),
    ...corr
      .filter((c) => c.data > seteDias)
      .map((c) => ({
        id: c.id,
        tp: 'corrida',
        t: c.data,
        novo: !c.visto_treinador,
        h: `#/corrida/${c.id}`,
        n: nomes[c.aluno_id],
        d: ehCorr(c) ? `${fmtKm(c.distancia_m, 1)} · ${fmtPace(paceDe(c))}` : `${nomeAtiv(c)} · ${resumoAtiv(c)}`,
        dor: c.dor,
        ic: icCorr((membros || []).find((x) => x.user_id === c.aluno_id)),
      })),
  ].sort((a, b) => (a.t < b.t ? 1 : -1));
  const treinosSemana = recentes.length;
  // ---- resumo da semana (alunos do treinador) ----
  const meus = ativos;
  const naSem = (d, s0) => {
    const x = String(d).length === 10 ? String(d) : isoDia(d);
    return x >= s0 && x <= somaDias(s0, 6);
  };
  const alvoLib = new Date().getDay() >= 1 && new Date().getDay() <= 4 ? segAtual : segProx; // seg–qui: esta semana · sex–dom: a próxima
  const rs = { treinaram: [], faltaram: [], provas: [], semLib: [] };
  meus.forEach((m) => {
    const id = m.user_id;
    const sP = sess.filter((s) => s.aluno_id === id && naSem(s.iniciado_em, segPass)),
      cP = corr.filter((c) => c.aluno_id === id && naSem(c.data, segPass));
    if (sP.length || cP.length)
      rs.treinaram.push({
        m,
        d: [cP.length ? `${cP.length} corrida${cP.length > 1 ? 's' : ''}` : '', sP.length ? `${sP.length} força` : '']
          .filter(Boolean)
          .join(' · '),
      });
    let prev = 0,
      fez = 0;
    if (faz('corrida', m)) {
      const pl = planoRes.filter((p) => p.aluno_id === id && !semCorrida(p) && p.liberado && naSem(p.data, segPass));
      prev += pl.length;
      fez += pl.filter((p) => cP.some((c) => c.plano_id === p.id || (ehCorr(c) && isoDia(c.data) === p.data))).length;
    }
    if (faz('musculacao', m) && libsRes.some((l) => l.aluno_id === id && l.semana === segPass)) {
      const off = dispDe(m).off_forca || [];
      const pf = treinosRes
        .filter((t) => t.aluno_id === id)
        .reduce((a, t) => a + (t.dias || []).filter((d) => !off.includes(d)).length, 0);
      prev += pf;
      fez += Math.min(pf, sP.length);
    }
    if (prev && fez < prev) rs.faltaram.push({ m, d: `fez ${fez} de ${prev}`, f: prev - fez });
    const pv = provasEq.find((x) => x.aluno_id === id && diasAte(x.data) <= 14);
    if (pv) {
      const dd = diasAte(pv.data);
      rs.provas.push({
        m,
        d: `${esc(pv.titulo)} · ${dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : `em ${dd} dias`}`,
        h: `#/aluno/${id}/corrida`,
      });
    }
    const falta = [];
    if (faz('corrida', m)) {
      const pl = planoRes.filter((p) => p.aluno_id === id && naSem(p.data, alvoLib));
      if (!pl.length) falta.push('corrida vazia');
      else if (pl.some((p) => !p.liberado)) falta.push('corrida');
    }
    if (
      faz('musculacao', m) &&
      treinosRes.some((t) => t.aluno_id === id && (t.dias || []).length) &&
      !libsRes.some((l) => l.aluno_id === id && l.semana === alvoLib)
    )
      falta.push('força');
    if (falta.length)
      rs.semLib.push({ m, d: falta.join(' · '), h: `#/aluno/${id}/${falta[0] === 'força' ? 'forca' : 'corrida'}` });
  });
  rs.faltaram.sort((a, b) => b.f - a.f);
  const ehSeg = new Date().getDay() === 1;
  const resumoHTML = meus.length
    ? `<div class="section"><div class="section-h"><h2 class="h2">${ehSeg ? 'Resumo da semana' : 'Semana passada'}</h2><span class="small muted">${fmtCurto(segPass)} a ${fmtCurto(somaDias(segPass, 6))}</span></div>
    <div class="rs-grid">${[
      ['treinaram', rs.treinaram.length, `de ${meus.length} treinaram`, 'ok'],
      ['faltaram', rs.faltaram.length, 'faltaram treino', rs.faltaram.length ? 'warn' : ''],
      ['provas', rs.provas.length, 'provas em 14 dias', ''],
      [
        'semLib',
        rs.semLib.length,
        `sem liberar ${alvoLib === segAtual ? 'esta semana' : 'a próxima'}`,
        rs.semLib.length ? 'err' : '',
      ],
    ]
      .map(
        ([k, n, t, c]) =>
          `<button class="rs-t ${c}" data-rs="${k}" ${n ? '' : 'disabled'}><b>${n}</b><span>${t}</span></button>`,
      )
      .join('')}</div>
    ${Object.entries(rs)
      .filter(([, l]) => l.length)
      .map(
        ([k, l]) =>
          `<div class="card rs-lista" data-rsl="${k}" hidden>${l.map((x) => `<a class="ativ-l" href="${x.h || `#/aluno/${x.m.user_id}/historico`}">${avAluno(x.m, 'sm')}<b class="grow ellip">${esc(x.m.nome)}</b><span class="small muted">${x.d}</span></a>`).join('')}</div>`,
      )
      .join('')}</div>`
    : '';
  const comp = compDe();
  const aReceber = cobs.filter((c) => c.competencia === comp).reduce((a, c) => a + +c.valor, 0);
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const st = S.cache.hoje || (S.cache.hoje = { tudo: false });
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""><span class="eyebrow">${esc(S.org.nome)}</span></div><div class="top-acoes">${sinoHTML()}<a class="top-foto" href="#/perfil" aria-label="Meu perfil" title="Meu perfil">${fotoHTML(S.me)}</a></div></div>
    <h1 class="h1">${saud}, ${esc(firstName(S.me.nome))}</h1>
    <p class="muted" style="margin-top:6px">${alMeus.length ? `${alMeus.length} aluno${alMeus.length > 1 ? 's seus pedem' : ' seu pede'} atenção hoje.` : 'Seus alunos estão em dia.'}</p>
    <div id="cic-term"></div>
    <div id="testes-eq"></div>
    <div id="energia-eq"></div>
    <div id="faltas-eq"></div>
    ${
      pendentes.length
        ? `<div class="section"><div class="section-h"><h2 class="h2">Novos alunos para aprovar</h2><span class="tag acc">${pendentes.length}</span></div><div class="stack">${pendentes
            .map(
              (m) => `<div class="card aprovar" data-pend="${m.user_id}">
      <div class="row" style="gap:12px">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><span class="small muted ellip" style="display:block">${esc(m.email || '')}</span></div><span class="tiny dim">${m.pedido_em ? quando(m.pedido_em) : ''}</span></div>
      ${(() => {
        const md = m.modalidades || [],
          c = md.includes('corrida'),
          f = md.includes('musculacao');
        const ic = (c ? selo('corrida', 'sm') : '') + (f ? selo('forca', 'sm') : '');
        const t =
          (ic ? `<span class="pend-ic">${ic}</span>` : '') +
          `<span>${c && f ? 'Este aluno é de <b>corrida e musculação</b>' : c ? 'Este aluno é <b>só de corrida</b>' : f ? 'Este aluno é <b>só de musculação</b>' : 'Não marcou a modalidade'}</span>`;
        return `<div class="pend-mod">${t}</div>`;
      })()}
      ${m.objetivo ? `<p class="small muted" style="margin-top:6px">Objetivo: ${esc(String(m.objetivo).slice(0, 90))}</p>` : ''}
      <p class="small muted" style="margin-top:8px">Preencheu a ficha de entrada e pediu acesso ao app.</p>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" data-aprovar="${m.user_id}">${I.check} Aprovar</button><button class="btn sm ghost" data-recusar="${m.user_id}">Recusar</button><a class="link-btn small" href="#/aluno/${m.user_id}/saude" style="margin-left:auto">Ver ficha</a></div></div>`,
            )
            .join('')}</div></div>`
        : ''
    }
    ${cartaoPushHTML()}
    <div class="stats"><a class="stat" href="#/alunos" style="color:inherit"><b>${ativos.length}</b><span>alunos ativos</span></a><div class="stat"><b>${treinosSemana}</b><span>treinos em 7 dias</span></div><a class="stat" href="#/financeiro" style="color:inherit"><b>${aReceber ? brl(aReceber).replace(',00', '') : 'R$ 0'}</b><span>a receber no mês</span></a></div>
    ${(() => {
      const resp = ativos.filter((m) => pronts.some((p) => p.aluno_id === m.user_id));
      const at = pronts.filter((p) => p.alerta && vis.has(p.aluno_id)).length;
      const ok = pronts.filter((p) => !p.alerta && p.total >= 16 && vis.has(p.aluno_id)).length;
      const cgN = ativos.filter((m) => cargas[m.user_id] && cargas[m.user_id].nivel).length;
      return ativos.length
        ? `<a class="card pe-card" id="pront-eq" href="#/prontidao-equipe" style="color:inherit"><span class="ativ-ic">${PRONT_IC}</span><div class="grow" style="min-width:0"><b>Prontidão de hoje</b><div class="small muted">${resp.length} de ${ativos.length} responderam o check-in${at ? ` · <span style="color:var(--err)">${at} pede${at > 1 ? 'm' : ''} atenção</span>` : ''}${ok ? ` · ${ok} pronto${ok > 1 ? 's' : ''} para treinar` : ''}${cgN ? ` · <span style="color:var(--warn)">${cgN} com alerta de carga</span>` : ''}</div></div>${I.chev}</a>`
        : '';
    })()}
    ${ehSeg ? resumoHTML : ''}
    <div id="datas-esp"></div>
    ${(() => {
      const card = ({ m, l }) =>
        `<a class="list-item alerta" href="${l[0].ir}" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)} ${modSelos(m)}${!m.treinador_id ? ' <span class="tag warn" style="vertical-align:2px">sem treinador</span>' : ''}</b><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px">${l
          .slice(0, 3)
          .map((x) => `<span class="tag ${x.cls}">${esc(x.t)}</span>`)
          .join('')}${l.length > 3 ? `<span class="tag">+${l.length - 3}</span>` : ''}</div></div>${(() => {
          const rr = l.find((x) => x.resg);
          return rr
            ? `<button type="button" class="alerta-wa" data-resgate="${m.user_id}" data-dias="${rr.resg}" aria-label="Mandar mensagem de resgate">${I.wa}</button>`
            : '';
        })()}${(() => {
          const p = l[0].p;
          const n = p === 1 ? ['Alta', 'n-alta'] : p <= 3 ? ['Média', 'n-media'] : ['Baixa', 'n-baixa'];
          return `<span class="nivel ${n[1]}">${n[0]}</span>`;
        })()}</a>`;
      return alMeus.length
        ? `<div class="section"><div class="section-h"><h2 class="h2">Seus alunos pedem atenção</h2>${slashes}</div><div class="stack" id="alertas">${alMeus.map(card).join('')}</div></div>`
        : '';
    })()}
    <div id="sug-hoje"></div>
    ${ehSeg ? '' : resumoHTML}
    <div class="section"><div class="section-h"><h2 class="h2">Atividade da semana</h2><div class="row" style="gap:6px;align-items:center"><a class="link-btn" href="#/feed">Ver retornos</a><button type="button" class="ocultar-btn ${store.get('nx_ativ_oculta', false) ? 'fechado' : ''}" id="ocultar-ativ" aria-label="${store.get('nx_ativ_oculta', false) ? 'Mostrar' : 'Ocultar'} atividade da semana" title="${store.get('nx_ativ_oculta', false) ? 'Mostrar' : 'Ocultar'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg></button></div></div>
      <div id="ativ-corpo" ${store.get('nx_ativ_oculta', false) ? 'hidden' : ''}>${
        recentes.length
          ? `<div class="card ativ">${recentes
              .slice(0, st.tudo ? 60 : 6)
              .map(
                (x) =>
                  `<div class="ativ-row"><a class="ativ-l" href="${x.h}"><span class="ativ-ic">${x.ic}</span><div class="grow" style="min-width:0"><b class="ellip">${esc(firstName(x.n))}</b><span class="small muted ellip">${x.d}</span></div>${x.dor ? '<span class="tag err">dor</span>' : ''}<span class="tiny dim">${quando(x.t)}</span></a>${x.novo ? `<button type="button" class="visto-btn" data-visto="${x.tp}|${x.id}">${I.check} Visto</button>` : `<span class="visto-ok" title="Você já viu">${I.check}</span>`}</div>`,
              )
              .join('')}
        ${recentes.length > 6 ? `<button class="link-btn small" id="mais-ativ" style="margin-top:8px">${st.tudo ? 'Mostrar menos' : `Mostrar mais ${recentes.length - 6}`}</button>` : ''}</div>`
          : '<div class="empty"><div class="h3">Nenhum treino nos últimos 7 dias</div></div>'
      }</div>
      ${store.get('nx_ativ_oculta', false) ? `<p class="small muted" id="ativ-oculta-txt">${recentes.length} ${recentes.length === 1 ? 'atividade oculta' : 'atividades ocultas'}. Toque na seta para mostrar.</p>` : ''}
    </div>`;
  dadosSugestoes(
    ativos.map((m) => m.user_id),
    1,
  )
    .then((sg) => {
      const bx = document.getElementById('sug-hoje');
      if (!bx || !sg.length) return;
      bx.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Sugestões do app</h2><span class="tag acc">${sg.length}</span></div><div class="stack">${sg.map((x) => sugCardHTML(x)).join('')}</div></div>`;
      bindSugestoes(bx, sg, () => {
        if (!bx.querySelector('.sug-card')) bx.innerHTML = '';
      });
    })
    .catch((e) => console.error(e));
  ciclosTerminandoHTML(vis, Object.fromEntries(membros.map((m) => [m.user_id, m.nome]))).then(
    (h) => {
      const el = document.getElementById('cic-term');
      if (el) el.innerHTML = h;
    },
    () => {},
  );
  faltasEquipe([...vis], Object.fromEntries(membros.map((m) => [m.user_id, m])));
  energiaEquipe([...vis], Object.fromEntries(membros.map((m) => [m.user_id, m]))).catch((e) => console.error(e));
  testesPendentesEquipe([...vis])
    .then((ts) => {
      const box = document.getElementById('testes-eq');
      if (!box || !ts.length) return;
      const porId = Object.fromEntries(membros.map((m) => [m.user_id, m]));
      box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Testes para confirmar</h2><span class="tag acc">${ts.length}</span></div><div class="stack">${ts
        .map((x) => {
          const m = porId[x.c.aluno_id] || { nome: 'Aluno' };
          return `<button class="list-item" data-tst-aluno="${x.c.aluno_id}" style="color:inherit;text-align:left;width:100%">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(firstName(m.nome))} fez o ${esc(x.p.titulo || 'teste')}</b><div class="small muted">${diaSemDe(isoDia(x.c.data))} · confira o resultado e confirme as zonas</div></div>${I.chev}</button>`;
        })
        .join('')}</div></div>`;
      box.querySelectorAll('[data-tst-aluno]').forEach((b) => (b.onclick = () => abrirRitmosAluno(b.dataset.tstAluno)));
    })
    .catch((e) => console.error(e));
  vigiarRecolhiveis();
  bindCartaoPush();
  convidarTour();
  datasEspeciais(document.getElementById('datas-esp'), ativos);
  atualizarSino();
  $app.querySelectorAll('[data-visto]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        marcarVisto(b);
      }),
  );
  $app.querySelectorAll('[data-resgate]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const m = ativos.find((x) => x.user_id === b.dataset.resgate);
        if (m) abrirResgate(m, +b.dataset.dias, () => staffHoje());
      }),
  );
  $app.querySelectorAll('[data-aprovar]').forEach(
    (b) =>
      (b.onclick = async () => {
        const m = pendentes.find((x) => x.user_id === b.dataset.aprovar);
        if (!m) return;
        b.disabled = true;
        b.textContent = 'Aprovando…';
        const { data: r, error } = await sb.functions.invoke('nx-email', {
          body: { org_id: S.org.id, acao: 'aprovar', aluno_id: m.user_id },
        });
        if (error || !r || r.erro) {
          b.disabled = false;
          b.innerHTML = `${I.check} Aprovar`;
          return toast((r && r.erro) || 'Não foi possível aprovar agora.', true);
        }
        S.cache.nomes = null;
        if (r.enviado) {
          toast(`${firstName(m.nome)} aprovado! O acesso foi para ${r.email}.`);
          return staffHoje();
        }
        if (r.senha)
          return (
            mostrarCredenciais(
              { nome: m.nome, telefone: m.telefone, email: r.email, senha: r.senha },
              false,
              true,
              'acesso',
            ),
            staffHoje()
          );
        toast(`${firstName(m.nome)} aprovado! Já pode entrar no app com a senha que criou.`);
        staffHoje();
      }),
  );
  $app.querySelectorAll('[data-recusar]').forEach(
    (b) =>
      (b.onclick = async () => {
        const m = pendentes.find((x) => x.user_id === b.dataset.recusar);
        if (!m) return;
        if (!confirm(`Recusar o pedido de ${m.nome}? Ele não vai ter acesso ao app.`)) return;
        b.disabled = true;
        const { data: r, error } = await sb.functions.invoke('nx-email', {
          body: { org_id: S.org.id, acao: 'recusar', aluno_id: m.user_id },
        });
        if (error || !r || r.erro) {
          b.disabled = false;
          return toast((r && r.erro) || 'Não foi possível recusar agora.', true);
        }
        toast('Pedido recusado.');
        staffHoje();
      }),
  );
  const ma = document.getElementById('mais-ativ');
  if (ma)
    ma.onclick = () => {
      st.tudo = !st.tudo;
      staffHoje();
    };
  const oa = document.getElementById('ocultar-ativ');
  if (oa)
    oa.onclick = () => {
      const fechar = !store.get('nx_ativ_oculta', false);
      store.set('nx_ativ_oculta', fechar);
      const corpo = document.getElementById('ativ-corpo');
      if (corpo) corpo.hidden = fechar;
      const tx = document.getElementById('ativ-oculta-txt');
      if (tx) tx.hidden = !fechar;
      else if (fechar)
        corpo.insertAdjacentHTML(
          'afterend',
          `<p class="small muted" id="ativ-oculta-txt">${recentes.length} ${recentes.length === 1 ? 'atividade oculta' : 'atividades ocultas'}. Toque na seta para mostrar.</p>`,
        );
      oa.classList.toggle('fechado', fechar);
      oa.setAttribute('aria-label', `${fechar ? 'Mostrar' : 'Ocultar'} atividade da semana`);
      oa.title = fechar ? 'Mostrar' : 'Ocultar';
    };
  $app.querySelectorAll('[data-rs]').forEach(
    (b) =>
      (b.onclick = () => {
        const abrir = !b.classList.contains('on');
        $app.querySelectorAll('[data-rs]').forEach((x) => x.classList.toggle('on', abrir && x === b));
        $app.querySelectorAll('[data-rsl]').forEach((x) => {
          x.hidden = !(abrir && x.dataset.rsl === b.dataset.rs);
        });
      }),
  );
}
