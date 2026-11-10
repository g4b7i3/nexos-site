/* Nexos App · Desafio do mês, alerta de carga, relógios dos alunos, painel de fidelização, prontidão da equipe e menu Mais do aluno.
   Parte 5 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- desafio do mês da equipe ---------- */
const DES_UNI = { km: ['km', 'km'], treinos: ['treino', 'treinos'], horas: ['hora', 'horas'] };
const desUni = (t, v) => (DES_UNI[t] || DES_UNI.km)[+v === 1 ? 0 : 1];
const desFmt = (t, v) => {
  const n = +v || 0;
  return t === 'treinos' || Number.isInteger(n) ? Math.round(n).toLocaleString('pt-BR') : f1(n);
};
async function desafioCard(box, ativos) {
  if (!box || !S.org) return;
  const d = await sb.rpc('nx_desafio_atual', { p_org: S.org.id }).then(
    (r) => r.data || null,
    () => null,
  );
  if (!d) {
    box.innerHTML = S.staff
      ? `<button type="button" class="list-item des-novo" id="des-criar" style="width:100%;text-align:left;margin-top:14px"><span class="ativ-ic">${I.flag}</span><div class="grow"><b>Criar desafio do mês</b><div class="small muted">Uma meta coletiva para a equipe somar junto.</div></div>${I.chev}</button>`
      : '';
    const b = document.getElementById('des-criar');
    if (b) b.onclick = () => desafioEditar(null, ativos, () => desafioCard(box, ativos));
    return;
  }
  const pct = d.meta > 0 ? Math.min(100, (d.total / d.meta) * 100) : 0,
    hoje = hojeISO(),
    acabou = d.fim < hoje;
  const faltaDias = Math.max(0, Math.round((dia(d.fim) - dia(hoje)) / 864e5));
  const batida = d.total >= d.meta;
  box.innerHTML = `<div class="card des-card${batida ? ' ok' : ''}">
    <div class="row" style="gap:10px;align-items:flex-start"><div class="grow" style="min-width:0"><span class="eyebrow">Desafio da equipe · ${fmtCurto(d.inicio)} a ${fmtCurto(d.fim)}</span><div class="h3" style="margin-top:2px">${esc(d.titulo)}</div></div>${S.staff ? `<button class="link-btn small" id="des-ed">Editar</button>` : ''}</div>
    <div class="des-num"><b>${desFmt(d.tipo, d.total)}</b><span>de ${desFmt(d.tipo, d.meta)} ${desUni(d.tipo, d.meta)}</span><em>${Math.floor(pct)}%</em></div>
    <div class="des-bar"><i style="width:${pct}%"></i></div>
    <p class="small muted" style="margin-top:8px">${batida ? 'Meta batida pela equipe.' : acabou ? 'Desafio encerrado.' : `Faltam ${desFmt(d.tipo, Math.max(0, d.meta - d.total))} ${desUni(d.tipo, d.meta - d.total)} · ${faltaDias === 0 ? 'último dia' : faltaDias === 1 ? 'termina amanhã' : `${faltaDias} dias para o fim`}`}. ${d.participantes} ${d.participantes === 1 ? 'pessoa já somou' : 'pessoas já somaram'}.</p>
    ${S.staff ? '' : `<p class="small" style="margin-top:4px">Sua parte: <b>${desFmt(d.tipo, d.eu)} ${desUni(d.tipo, d.eu)}</b></p>`}
    ${(d.ranking || []).length ? `<div class="des-rank">${d.ranking.map((x, i) => `<div class="${x.eu ? 'eu' : ''}"><span>${i + 1}</span><b class="ellip">${esc(x.nome)}${x.eu ? ' (você)' : ''}</b><em>${desFmt(d.tipo, x.val)}</em></div>`).join('')}</div>` : ''}
  </div>`;
  const ed = document.getElementById('des-ed');
  if (ed) ed.onclick = () => desafioEditar(d, ativos, () => desafioCard(box, ativos));
}
async function staffDesafio() {
  loading();
  dockStaff();
  const ativos = await sb
    .from('nx_membros')
    .select('user_id')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .then(
      (r) => r.data || [],
      () => [],
    );
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Equipe</p><h1 class="h1">Desafio do mês</h1>
    <p class="muted" style="margin-top:6px">Uma meta coletiva para a equipe somar junto. Quando houver um desafio ativo, os alunos veem a barra de progresso na tela Hoje. Lançar é opcional.</p>
    <div id="desafio-box"></div>`;
  desafioCard(document.getElementById('desafio-box'), ativos);
}
async function desafioEditar(d, ativos, depois) {
  const hoje = hojeISO(),
    ini = d?.inicio || hoje.slice(0, 8) + '01';
  const fimMes = (() => {
    const x = dia(ini);
    x.setMonth(x.getMonth() + 1, 0);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 10);
  })();
  // sugestão de meta: o que a equipe fez nos últimos 30 dias, com 10% a mais
  const ids = (ativos || []).map((m) => m.user_id),
    de = somaDias(hoje, -30);
  const [cs, ss] = ids.length
    ? await Promise.all([
        sb
          .from('nx_corridas')
          .select('distancia_m,duracao_s,tipo')
          .in('aluno_id', ids)
          .gte('data', de)
          .then(
            (r) => r.data || [],
            () => [],
          ),
        sb
          .from('nx_sessoes')
          .select('iniciado_em,finalizado_em')
          .in('aluno_id', ids)
          .gte('iniciado_em', de)
          .not('finalizado_em', 'is', null)
          .then(
            (r) => r.data || [],
            () => [],
          ),
      ])
    : [[], []];
  const arred = (v, n) => Math.max(n, Math.round((v * 1.1) / n) * n);
  const sug = {
    km: arred(
      cs
        .filter((c) => !c.tipo || ['corrida', 'trail', 'esteira'].includes(c.tipo))
        .reduce((a, c) => a + (+c.distancia_m || 0), 0) / 1000,
      50,
    ),
    treinos: arred(cs.length + ss.length, 10),
    horas: arred(
      cs.reduce((a, c) => a + (+c.duracao_s || 0), 0) / 3600 +
        ss.reduce((a, x) => {
          const h = (Date.parse(x.finalizado_em) - Date.parse(x.iniciado_em)) / 36e5;
          return a + (h > 0 && h < 4 ? h : 0);
        }, 0),
      10,
    ),
  };
  const tipo0 = d?.tipo || 'km';
  openSheet(
    `<p class="eyebrow">Desafio do mês</p><div class="h2">${d ? 'Editar desafio' : 'Novo desafio da equipe'}</div>
    <form id="f-des" style="margin-top:14px">
      <label class="field"><span>Nome</span><input class="input" name="titulo" maxlength="60" required value="${esc(d?.titulo || 'Desafio de ' + dia(ini).toLocaleDateString('pt-BR', { month: 'long' }))}"></label>
      <label class="field"><span>O que a equipe soma</span><select class="input" name="tipo"><option value="km">Quilômetros de corrida</option><option value="treinos">Treinos feitos (corrida e força)</option><option value="horas">Horas de treino</option></select></label>
      <label class="field"><span>Meta da equipe</span><input class="input" name="meta" data-mask="num" data-max="6" inputmode="numeric" required value="${d?.meta || sug[tipo0]}"></label>
      <p class="small muted" id="des-sug" style="margin:-4px 0 12px">Sugestão: ${desFmt(tipo0, sug[tipo0])} ${desUni(tipo0, sug[tipo0])} (o que a equipe fez nos últimos 30 dias, mais 10%).</p>
      <div class="row" style="gap:10px"><label class="field grow"><span>Início</span><input class="input" name="inicio" type="date" required value="${ini}"></label><label class="field grow"><span>Fim</span><input class="input" name="fim" type="date" required value="${d?.fim || fimMes}"></label></div>
      <button class="btn block" type="submit" style="margin-top:6px">${d ? 'Salvar' : 'Lançar desafio'}</button>
      ${d ? '<button class="btn block ghost" type="button" id="des-apagar" style="margin-top:8px">Apagar desafio</button>' : ''}
    </form>`,
    (el) => {
      const f = el.querySelector('#f-des');
      f.tipo.value = tipo0;
      f.tipo.onchange = () => {
        const t = f.tipo.value;
        f.meta.value = sug[t];
        el.querySelector('#des-sug').textContent =
          `Sugestão: ${desFmt(t, sug[t])} ${desUni(t, sug[t])} (o que a equipe fez nos últimos 30 dias, mais 10%).`;
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        if (f.fim.value < f.inicio.value) return toast('O fim precisa ser depois do início.', true);
        const row = {
          titulo: f.titulo.value.trim(),
          tipo: f.tipo.value,
          meta: +f.meta.value,
          inicio: f.inicio.value,
          fim: f.fim.value,
        };
        const q = d
          ? sb.from('nx_desafios').update(row).eq('id', d.id)
          : sb.from('nx_desafios').insert({ ...row, org_id: S.org.id, criado_por: S.user.id });
        const { error } = await q;
        if (error) return toast('Não foi possível salvar o desafio.', true);
        closeSheet();
        toast(d ? 'Desafio atualizado.' : 'Desafio lançado. Os alunos já veem na tela Hoje.');
        depois && depois();
      };
      const ap = el.querySelector('#des-apagar');
      if (ap)
        ap.onclick = async () => {
          if (ap.dataset.ok !== '1') {
            ap.dataset.ok = '1';
            ap.textContent = 'Toque de novo para apagar';
            return;
          }
          const { error } = await sb.from('nx_desafios').delete().eq('id', d.id);
          if (error) return toast('Não foi possível apagar.', true);
          closeSheet();
          toast('Desafio apagado.');
          depois && depois();
        };
    },
  );
}
async function datasEspeciais(box, ativos) {
  if (!box) return;
  const ids = new Set(ativos.map((m) => m.user_id));
  const lista = await sb.rpc('nx_marcos', { p_org: S.org.id }).then(
    (r) => (r.data || []).filter((x) => ids.has(x.aluno_id)),
    () => [],
  );
  const prox = ativos.filter(
    (m) =>
      m.nascimento && !ehAniversario(m.nascimento) && [1, 2, 3, 4, 5, 6].some((d) => ehAniversario(m.nascimento, d)),
  );
  if (!lista.length && !prox.length) {
    box.innerHTML = '';
    return;
  }
  const porId = Object.fromEntries(ativos.map((m) => [m.user_id, m]));
  box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Datas especiais</h2>${slashes}</div><div class="stack">
    ${lista
      .map((x, i) => {
        const [t, sub] = MARCO_TXT[x.tipo](x);
        const m = porId[x.aluno_id] || x;
        return `<div class="list-item marco-item">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(x.nome)}</b><span class="small marco-t"><i>${ICO_MARCO[x.tipo] || ''}</i>${esc(t)}${sub ? ' · ' + esc(sub) : ''}</span></div><button class="btn sm" data-marco="${i}">Mensagem pronta</button></div>`;
      })
      .join('')}
    ${prox.length ? `<p class="small muted" style="margin-top:4px">Aniversários desta semana: ${prox.map((m) => `${esc(firstName(m.nome))} (${fmtCurto(hojeISO().slice(0, 4) + m.nascimento.slice(4, 10) + 'T12:00:00')})`).join(', ')}</p>` : ''}</div></div>`;
  box
    .querySelectorAll('[data-marco]')
    .forEach((b) => (b.onclick = () => abrirComemoracao(lista[+b.dataset.marco], () => datasEspeciais(box, ativos))));
}
function abrirComemoracao(x, depois) {
  const [t] = MARCO_TXT[x.tipo](x),
    tel = telWa(x.telefone);
  const registrar = (canal) =>
    sb
      .from('nx_comemoracoes')
      .insert({ org_id: S.org.id, aluno_id: x.aluno_id, chave: x.chave, canal })
      .then(
        () => {},
        () => {},
      );
  openSheet(
    `<p class="eyebrow">Data especial</p><div class="h2" style="margin-top:4px">${esc(firstName(x.nome))} · ${esc(t.toLowerCase())}</div>
    <p class="small muted" style="margin-top:4px">Mensagem pronta no seu nome. Ajuste se quiser antes de enviar.</p>
    <textarea class="textarea" id="cm-txt" rows="7" style="margin-top:12px">${esc(msgMarco(x))}</textarea>
    <button class="btn block" id="cm-app" style="margin-top:12px">${I.feed} Enviar pelo app</button>
    ${tel ? `<button class="btn ghost block" id="cm-wa" style="margin-top:8px">${I.wa} Abrir no WhatsApp</button>` : '<p class="tiny dim" style="margin-top:8px">Sem telefone no cadastro para enviar pelo WhatsApp.</p>'}
    <button class="link-btn small" id="cm-feito" style="display:block;margin:12px auto 0">Já parabenizei por outro meio</button>`,
    (r) => {
      const txt = () => r.querySelector('#cm-txt').value.trim();
      r.querySelector('#cm-app').onclick = async (e) => {
        if (!txt()) return toast('Escreva a mensagem.', true);
        e.currentTarget.disabled = true;
        const { data, error } = await sb
          .from('nx_mensagens')
          .insert({ org_id: S.org.id, aluno_id: x.aluno_id, autor_id: S.user.id, texto: txt() })
          .select('id')
          .single();
        if (error) {
          e.currentTarget.disabled = false;
          return toast('Não foi possível enviar.', true);
        }
        notificar('mensagem', data.id);
        await registrar('app');
        closeSheet();
        toast('Mensagem enviada. Ele recebe a notificação.');
        depois && depois();
      };
      const wa = r.querySelector('#cm-wa');
      if (wa)
        wa.onclick = async () => {
          window.open(`https://wa.me/${tel}?text=${encodeURIComponent(txt())}`, '_blank', 'noopener');
          await registrar('whatsapp');
          closeSheet();
          depois && depois();
        };
      r.querySelector('#cm-feito').onclick = async () => {
        await registrar('outro');
        closeSheet();
        toast('Marcado como feito.');
        depois && depois();
      };
    },
  );
}

/* ---------- alerta de carga ---------- */
// carga de cada treino = minutos x esforço percebido de 0 a 10 (Foster, 2001); sem esforço anotado, usa a média do próprio aluno (ou 5)
// principal: na corrida, treino dos últimos 7 dias mais de 10% maior que o mais longo dos 30 dias anteriores (Frandsen et al. 2025, Br J Sports Med,
// 5.205 corredores: >10% aumentou o risco de lesão; >100% mais que dobrou). A relação aguda:crônica e o aumento de km da semana
// não tiveram associação clara com lesão nesse estudo (e são questionadas por Impellizzeri et al. 2020); ficam só como monitoramento.
function calcCarga(corrs, sess, agora = Date.now()) {
  const it = [
    ...(corrs || []).map((c) => ({
      t: Date.parse(c.data),
      min: Math.round((+c.duracao_s || 0) / 60),
      pse: c.rpe,
      km: ehCorrHist(c) ? (+c.distancia_m || 0) / 1000 : 0,
    })),
    ...(sess || [])
      .filter((s) => s.finalizado_em)
      .map((s) => ({
        t: Date.parse(s.iniciado_em),
        min: Math.min(minutos(s.iniciado_em, s.finalizado_em), 150),
        pse: s.esforco,
        km: 0,
      })),
  ].filter((x) => x.min > 0 && x.t <= agora);
  const cp = it.filter((x) => x.pse != null),
    pm = cp.length ? cp.reduce((a, x) => a + x.pse, 0) / cp.length : 5;
  const ua = [0, 0, 0, 0, 0],
    km = [0, 0, 0, 0, 0];
  it.forEach((x) => {
    const w = Math.floor((agora - x.t) / (7 * 864e5));
    if (w < 0 || w > 4) return;
    ua[w] += Math.min(x.min, 240) * (x.pse != null ? x.pse : pm);
    km[w] += x.km;
  });
  const ant = ua.slice(1),
    ativas = ant.filter((v) => v > 0).length,
    cr = ant.reduce((a, v) => a + v, 0) / 4;
  const acwr = ativas >= 3 && cr > 0 && ua[0] >= 200 ? ua[0] / cr : null;
  const kmCr = km.slice(1).reduce((a, v) => a + v, 0) / 4;
  const kmPct = ativas >= 3 && kmCr >= 8 && km[0] >= 10 ? Math.round((km[0] / kmCr - 1) * 100) : null;
  // salto de um treino isolado em relação ao mais longo dos 30 dias anteriores
  const runs = it.filter((x) => x.km > 0).sort((a, b) => a.t - b.t);
  let salto = null;
  runs
    .filter((x) => agora - x.t < 7 * 864e5)
    .forEach((x) => {
      const ant30 = runs.filter((y) => y.t < x.t - 36e5 && y.t >= x.t - 30 * 864e5);
      if (ant30.length < 3) return;
      const mx = Math.max(...ant30.map((y) => y.km));
      if (mx < 3) return;
      const pct = Math.round((x.km / mx - 1) * 100);
      if (pct > 10 && (!salto || pct > salto.pct)) salto = { pct, km: x.km, mx };
    });
  const nivel = salto && salto.pct > 100 ? 'alto' : salto || (acwr != null && acwr >= 1.5) ? 'atencao' : null;
  const partes = [];
  if (salto)
    partes.push(
      `treino de ${f1(salto.km)} km, ${salto.pct}% acima do mais longo dos 30 dias anteriores (${f1(salto.mx)} km)`,
    );
  if (acwr != null && acwr >= 1.5) partes.push(`carga da semana ${f1(acwr)}x a média das 4 anteriores`);
  const curto = salto ? `Treino +${salto.pct}%` : acwr != null && acwr >= 1.5 ? `Carga ${f1(acwr)}x a média` : '';
  return {
    acwr,
    ua: Math.round(ua[0]),
    cr: Math.round(cr),
    km: km[0],
    kmCr,
    kmPct,
    salto,
    nivel,
    txt: partes.join(' · '),
    curto,
  };
}
async function buscarCargas(ids) {
  const ini = new Date(Date.now() - 38 * 864e5).toISOString();
  let qc = sb
    .from('nx_corridas')
    .select('aluno_id,data,tipo,duracao_s,distancia_m,rpe')
    .eq('org_id', S.org.id)
    .gte('data', ini);
  let qs = sb
    .from('nx_sessoes')
    .select('aluno_id,iniciado_em,finalizado_em,esforco')
    .eq('org_id', S.org.id)
    .not('finalizado_em', 'is', null)
    .gte('iniciado_em', ini);
  if (ids) {
    qc = qc.in('aluno_id', ids);
    qs = qs.in('aluno_id', ids);
  }
  const [cs, ss] = await Promise.all([
    qc.limit(3000).then(
      (r) => r.data || [],
      () => [],
    ),
    qs.limit(3000).then(
      (r) => r.data || [],
      () => [],
    ),
  ]);
  const out = {};
  [...new Set([...cs, ...ss].map((x) => x.aluno_id))].forEach((id) => {
    out[id] = calcCarga(
      cs.filter((c) => c.aluno_id === id),
      ss.filter((s) => s.aluno_id === id),
    );
  });
  return out;
}
const cargaTag = (c) =>
  c && c.nivel
    ? `<span class="tag ${c.nivel === 'alto' ? 'err' : 'warn'}">${c.salto ? `Treino +${c.salto.pct}%` : `Carga ${f1(c.acwr)}x`}</span>`
    : '';

/* ---------- relógios dos alunos (treinador): conexão e modelo do relógio ---------- */
// modelo do relógio: vem da última atividade importada (Garmin guarda em resumo_rel; Intervals e arquivos em analise.extras)
async function relogiosDosAlunos(ids) {
  if (!ids.length) return {};
  const [integs, corrs] = await Promise.all([
    sb
      .from('nx_integracoes')
      .select('user_id,provedor,ultima_sync,erro,conectado_em')
      .in('user_id', ids)
      .in('provedor', ['intervals', 'garmin'])
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_corridas')
      .select('aluno_id,data,fonte,dg:resumo_rel->>dispositivo,di:analise->extras->>dispositivo')
      .in('aluno_id', ids)
      .gte('data', new Date(Date.now() - 120 * 864e5).toISOString())
      .order('data', { ascending: false })
      .limit(2000)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const out = {};
  ids.forEach((id) => {
    const ig = integs.filter((x) => x.user_id === id),
      c = corrs.filter((x) => x.aluno_id === id);
    const comDev = c.find((x) => x.dg || x.di),
      ultRel = c.find((x) => ['garmin', 'intervals'].includes(x.fonte)),
      ultArq = c.find((x) => x.fonte === 'arquivo');
    out[id] = {
      garmin: ig.find((x) => x.provedor === 'garmin') || null,
      intervals: ig.find((x) => x.provedor === 'intervals') || null,
      modelo: comDev ? comDev.dg || comDev.di : null,
      ultRel,
      ultArq,
    };
  });
  return out;
}
const relogioResumo = (r) => {
  if (!r) return { cls: '', st: 'Sem relógio conectado', via: '' };
  const g = r.garmin,
    i = r.intervals,
    cx = g || i;
  if (!cx)
    return {
      cls: '',
      st: 'Sem relógio conectado',
      via: r.ultArq
        ? `Envia arquivo do relógio (último ${quando(r.ultArq.data)})`
        : 'Registra as corridas à mão ou pelo GPS do app',
    };
  if (cx.erro) return { cls: 'err', st: 'Conexão com problema', via: `${g ? 'Garmin' : 'Intervals.icu'}: ${cx.erro}` };
  return {
    cls: 'ok',
    st: g ? 'Garmin conectado' : 'Conectado pelo Intervals.icu',
    via: `${cx.ultima_sync ? 'Última sincronização ' + quando(cx.ultima_sync) : 'Ainda não sincronizou'}${r.ultRel ? ` · última atividade ${quando(r.ultRel.data)}` : ''}`,
  };
};
/** notificação de volta ao app, escrita pelo treinador (o aluno recebe no celular e no sininho) */
function lembreteVolta(x, btn) {
  const ap = (x.m.apelido && String(x.m.apelido).trim()) || firstName(x.m.nome);
  const tit = `Oi, ${ap}! Sentimos sua falta por aqui`;
  const corpo =
    x.semTreino != null && x.semTreino >= 7
      ? 'Que tal voltar hoje com um treino leve? Sua planilha está pronta no app, com a sua evolução e as informações da sua saúde. Estou contigo!'
      : 'Passa no app da Nexos: sua planilha, sua evolução e as informações importantes sobre a sua saúde estão te esperando. Qualquer coisa, me chama por lá!';
  openSheet(
    `<p class="eyebrow">Notificação no celular</p><div class="h2" style="margin-top:4px">Chamar ${esc(firstName(x.m.nome))} de volta</div>
    <p class="small muted" style="margin-top:6px">Chega no celular dele e fica no sininho do app. Ajuste o texto do seu jeito.</p>
    <label class="field" style="margin-top:14px"><span>Título</span><input class="input" id="lv-t" maxlength="70" value="${esc(tit)}"></label>
    <label class="field" style="margin-top:10px"><span>Mensagem</span><textarea class="input" id="lv-c" rows="4" maxlength="180">${esc(corpo)}</textarea></label>
    <button class="btn block" id="lv-ok" style="margin-top:14px">Enviar notificação</button>`,
    (r) => {
      const ok = r.querySelector('#lv-ok');
      ok.onclick = async () => {
        const t = r.querySelector('#lv-t').value.trim(),
          c = r.querySelector('#lv-c').value.trim();
        if (t.length < 3 || c.length < 3) return toast('Escreva o título e a mensagem.', true);
        ok.disabled = true;
        ok.textContent = 'Enviando…';
        const { data, error } = await sb.functions.invoke('nx-faltas', {
          body: { acao: 'lembrete', aluno_id: x.m.user_id, titulo: t, corpo: c },
        });
        if (error || !data || data.erro) {
          ok.disabled = false;
          ok.textContent = 'Enviar notificação';
          return toast((data && data.erro) || 'Não foi possível enviar agora.', true);
        }
        closeSheet();
        toast(
          data.enviados
            ? 'Notificação enviada!'
            : 'Enviada para o sininho. As notificações estão desligadas no celular dele.',
        );
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Notificação enviada';
        }
      };
    },
  );
}
/* ---------- painel de fidelização: quem está esfriando, por quê e o que fazer ---------- */
async function staffFidelizacao() {
  loading();
  dockStaff();
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,apelido,foto_url,ativo,aprovacao,treinador_id,modalidades,telefone,criado_em,ultimo_acesso')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const al = ms.filter((m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const ids = al.map((m) => m.user_id);
  const agora = Date.now(),
    d28 = new Date(agora - 28 * 864e5).toISOString(),
    d14 = agora - 14 * 864e5,
    dia14 = isoDia(new Date(d14)),
    hoje = hojeISO();
  const nada = { data: [] },
    q = (x) =>
      x.then(
        (r) => r,
        () => nada,
      );
  const [cs, ss, pl, pr, msg, hid, ft, cb, ultC, ultS] = ids.length
    ? await Promise.all([
        q(
          sb
            .from('nx_corridas')
            .select('aluno_id,data,rpe,comentario,dor,fonte')
            .in('aluno_id', ids)
            .gte('data', d28)
            .limit(3000),
        ),
        q(
          sb
            .from('nx_sessoes')
            .select('aluno_id,iniciado_em,dor')
            .in('aluno_id', ids)
            .not('finalizado_em', 'is', null)
            .gte('iniciado_em', d28)
            .limit(3000),
        ),
        q(
          sb
            .from('nx_plano_corrida')
            .select('aluno_id,data,tipo,liberado')
            .in('aluno_id', ids)
            .gte('data', dia14)
            .lt('data', hoje)
            .eq('liberado', true)
            .neq('tipo', 'folga'),
        ),
        q(sb.from('nx_prontidao').select('aluno_id,dia,dor,criado_em').in('aluno_id', ids).gte('criado_em', d28)),
        q(
          sb
            .from('nx_mensagens')
            .select('aluno_id,autor_id,criado_em')
            .eq('org_id', S.org.id)
            .in('aluno_id', ids)
            .gte('criado_em', d28)
            .limit(3000),
        ),
        q(
          sb
            .from('nx_hidratacao')
            .select('aluno_id,atualizado_em')
            .in('aluno_id', ids)
            .gte('dia', isoDia(new Date(agora - 28 * 864e5))),
        ),
        q(sb.from('nx_faltas').select('aluno_id,respondido_em').in('aluno_id', ids).gte('dia', dia14)),
        q(
          sb
            .from('nx_cobrancas')
            .select('aluno_id,status,vencimento')
            .eq('org_id', S.org.id)
            .in('aluno_id', ids)
            .in('status', ['pendente', 'atrasada', 'informada']),
        ),
        q(
          sb
            .from('nx_corridas')
            .select('aluno_id,data')
            .in('aluno_id', ids)
            .order('data', { ascending: false })
            .limit(2000),
        ),
        q(
          sb
            .from('nx_sessoes')
            .select('aluno_id,iniciado_em')
            .in('aluno_id', ids)
            .not('finalizado_em', 'is', null)
            .order('iniciado_em', { ascending: false })
            .limit(2000),
        ),
      ])
    : Array(10).fill(nada);
  const de = (r, id) => (r.data || []).filter((x) => x.aluno_id === id);
  const lin = al
    .map((m) => {
      const id = m.user_id,
        casaD = diasDesde(m.criado_em);
      const c = de(cs, id),
        s2 = de(ss, id);
      const datas = [...c.map((x) => Date.parse(x.data)), ...s2.map((x) => Date.parse(x.iniciado_em))];
      const rec = datas.filter((t) => t >= d14).length,
        ant = datas.filter((t) => t < d14).length;
      const ult = Math.max(
        ...de(ultC, id)
          .slice(0, 1)
          .map((x) => Date.parse(x.data)),
        ...de(ultS, id)
          .slice(0, 1)
          .map((x) => Date.parse(x.iniciado_em)),
        0,
      );
      const semTreino = ult ? diasDesde(new Date(ult)) : null;
      const plan = de(pl, id),
        diasFeitos = new Set(c.map((x) => isoDia(x.data)));
      const cumpr =
        plan.length >= 3 ? Math.round((100 * plan.filter((x) => diasFeitos.has(x.data)).length) / plan.length) : null;
      // último sinal de uso do app: check-in, mensagem do aluno, água, treino de força, comentário ou esforço numa corrida
      const usos = [
        ...de(pr, id).map((x) => Date.parse(x.criado_em)),
        ...de(msg, id)
          .filter((x) => x.autor_id === id)
          .map((x) => Date.parse(x.criado_em)),
        ...de(hid, id).map((x) => Date.parse(x.atualizado_em)),
        ...s2.map((x) => Date.parse(x.iniciado_em)),
        ...c.filter((x) => x.rpe != null || x.comentario || x.fonte === 'celular').map((x) => Date.parse(x.data)),
      ].filter(Boolean);
      if (m.ultimo_acesso) usos.push(Date.parse(m.ultimo_acesso)); // último acesso real (gravado ao abrir o app); as ações valem para quem ainda não tem o registro
      const uso = usos.length ? diasDesde(new Date(Math.max(...usos))) : null;
      const dor =
        de(pr, id).some((x) => x.dor && Date.parse(x.criado_em) >= d14) ||
        c.some((x) => x.dor && Date.parse(x.data) >= d14) ||
        s2.some((x) => x.dor && Date.parse(x.iniciado_em) >= d14);
      const faltasPend = de(ft, id).filter((x) => !x.respondido_em).length;
      const atrasada = de(cb, id).some(
        (x) => x.status === 'atrasada' || (x.status === 'pendente' && x.vencimento && x.vencimento < hoje),
      );
      const sinais = [];
      let pts = 0;
      const add = (p, t, acao) => {
        pts += p;
        sinais.push({ t, acao });
      };
      if (semTreino == null) {
        if (casaD >= 7)
          add(3, 'Ainda não registrou nenhum treino', 'Confira se ele conseguiu entrar no app e conectar o relógio.');
      } else if (semTreino >= 14)
        add(3, `Sem treinar há ${semTreino} dias`, 'Mande uma mensagem pessoal perguntando como ele está.');
      else if (semTreino >= 7)
        add(
          2,
          `Sem treinar há ${semTreino} dias`,
          'Mande uma mensagem leve, sem cobrança, perguntando como foi a semana.',
        );
      if (casaD >= 28 && ant >= 3 && rec <= ant / 2)
        add(
          2,
          `Treinou ${rec} vez${rec === 1 ? '' : 'es'} nos últimos 14 dias, contra ${ant} nos 14 anteriores`,
          'Pergunte se a rotina mudou e ajuste a planilha à disponibilidade dele.',
        );
      if (cumpr != null && cumpr < 50)
        add(
          2,
          `Cumpriu ${cumpr}% da planilha nos últimos 14 dias`,
          'A planilha pode estar acima do que ele consegue fazer. Reduza ou mude os dias.',
        );
      if (uso == null ? casaD >= 7 : uso >= 10)
        add(
          2,
          uso == null ? 'Não usou o app ainda' : `Não abre o app há ${uso} dias`,
          'Mostre algo novo para ele no app: evolução, card da corrida, previsão de prova.',
        );
      else if (uso != null && uso >= 7) add(1, `Não abre o app há ${uso} dias`, '');
      if (dor)
        add(
          1,
          'Relatou dor nos últimos 14 dias',
          'Pergunte como está a dor e ajuste a carga. Aluno com dor é o que mais desiste.',
        );
      if (faltasPend >= 2)
        add(
          1,
          `${faltasPend} treinos perdidos sem resposta`,
          'Ele não está respondendo as perguntas do app. Vale um contato direto.',
        );
      if (atrasada) add(2, 'Mensalidade em atraso', 'Converse antes de cobrar: atraso costuma vir junto com desânimo.');
      const nivel = pts >= 4 ? 'alto' : pts >= 2 ? 'medio' : 'ok';
      return { m, pts, nivel, sinais, semTreino, rec, cumpr, uso, casaD };
    })
    .sort((a, b) => b.pts - a.pts || (b.semTreino || 0) - (a.semTreino || 0));
  const alto = lin.filter((x) => x.nivel === 'alto'),
    medio = lin.filter((x) => x.nivel === 'medio'),
    ok = lin.filter((x) => x.nivel === 'ok');
  S.cache.fidel = lin;
  const card = (
    x,
  ) => `<div class="card fid-card fid-${x.nivel}"><div class="row" style="gap:12px;align-items:flex-start">${avAluno(x.m)}<div class="grow" style="min-width:0">
      <a href="#/aluno/${x.m.user_id}" style="color:inherit"><b class="ellip" style="display:block">${esc(x.m.nome)}</b></a>
      <div class="small muted">${x.casaD < 30 ? `Na Nexos há ${x.casaD} dia${x.casaD === 1 ? '' : 's'}` : `Na Nexos há ${Math.floor(x.casaD / 30)} ${Math.floor(x.casaD / 30) === 1 ? 'mês' : 'meses'}`} · ${x.rec} treino${x.rec === 1 ? '' : 's'} em 14 dias${x.cumpr != null ? ` · ${x.cumpr}% da planilha` : ''}${x.m.ultimo_acesso ? ` · abriu o app ${quando(x.m.ultimo_acesso)}` : ''}</div></div>
      <span class="tag ${x.nivel === 'alto' ? 'err' : x.nivel === 'medio' ? 'warn' : 'ok'}">${x.nivel === 'alto' ? 'Risco alto' : x.nivel === 'medio' ? 'Atenção' : 'Em dia'}</span></div>
    ${x.sinais.length ? `<ul class="fid-sinais">${x.sinais.map((g) => `<li><b>${esc(g.t)}</b>${g.acao ? `<span>${esc(g.acao)}</span>` : ''}</li>`).join('')}</ul>` : ''}
    ${x.nivel !== 'ok' ? `<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><a class="btn sm" href="#/aluno/${x.m.user_id}/conversa">${I.feed} Conversa no app</a><button class="btn sm ghost" data-fid-volta="${x.m.user_id}">${I.bell} Notificação no celular</button>${x.semTreino != null && x.semTreino >= 7 ? `<button class="btn sm ghost" data-fid-rsg="${x.m.user_id}">${I.wa} WhatsApp</button>` : ''}<a class="btn sm ghost" href="#/aluno/${x.m.user_id}">Ver aluno</a></div>` : ''}</div>`;
  const okLinha = (x) =>
    `<a class="list-item" href="#/aluno/${x.m.user_id}" style="color:inherit">${avAluno(x.m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(x.m.nome)}</b><span class="small muted">${x.rec} treino${x.rec === 1 ? '' : 's'} em 14 dias${x.semTreino != null ? ` · último treino ${quando(Date.now() - x.semTreino * 864e5)}` : ''}${x.m.ultimo_acesso ? ` · app ${quando(x.m.ultimo_acesso)}` : ''}</span></div>${x.sinais.length ? `<span class="small muted">${esc(x.sinais[0].t)}</span>` : ''}${I.chev}</a>`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Equipe</p><h1 class="h1">Painel de fidelização</h1>
    <p class="muted" style="margin-top:6px">Os seus alunos que estão esfriando, o motivo e o que fazer. Olha os treinos, a planilha, o uso do app, dores, treinos perdidos e mensalidades das últimas semanas.</p>
    <div class="card" style="margin-top:14px"><div class="ck-res cic-res"><div><b style="color:var(--err)">${alto.length}</b><span>risco alto</span></div><div><b style="color:var(--warn)">${medio.length}</b><span>atenção</span></div><div><b style="color:var(--ok)">${ok.length}</b><span>em dia</span></div></div></div>
    ${alto.length ? `<div class="section"><div class="section-h"><h2 class="h2">Risco alto</h2><span class="tag err">${alto.length}</span></div><p class="small muted" style="margin:-4px 0 10px">Fale com eles esta semana.</p><div class="stack">${alto.map(card).join('')}</div></div>` : ''}
    ${medio.length ? `<div class="section"><div class="section-h"><h2 class="h2">Atenção</h2><span class="tag warn">${medio.length}</span></div><div class="stack">${medio.map(card).join('')}</div></div>` : ''}
    ${ok.length ? `<div class="section"><div class="section-h"><h2 class="h2">Em dia</h2><span class="tag ok">${ok.length}</span></div><div class="stack">${ok.map(okLinha).join('')}</div></div>` : ''}
    ${!lin.length ? '<div class="empty" style="margin-top:16px">Nenhum aluno ativo ainda.</div>' : ''}
    <p class="tiny dim" style="margin-top:18px">Como o risco é calculado: dias sem treinar, queda de treinos em relação às duas semanas anteriores, cumprimento da planilha, dias sem usar o app, dor recente, treinos perdidos sem resposta e mensalidade atrasada. Alunos com menos de 4 semanas não entram na comparação de treinos.</p>`;
  $app.querySelectorAll('[data-fid-rsg]').forEach((b) => {
    b.onclick = () => {
      const x = lin.find((y) => y.m.user_id === b.dataset.fidRsg);
      if (x) abrirResgate(x.m, x.semTreino, () => {});
    };
  });
  $app.querySelectorAll('[data-fid-volta]').forEach((b) => {
    b.onclick = () => {
      const x = lin.find((y) => y.m.user_id === b.dataset.fidVolta);
      if (x) lembreteVolta(x, b);
    };
  });
}
async function staffRelogios() {
  loading();
  dockStaff();
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades,sexo')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const al = ms.filter((m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const R = await relogiosDosAlunos(al.map((m) => m.user_id));
  const linha = (m) => {
    const r = R[m.user_id],
      x = relogioResumo(r);
    return `<a class="list-item" href="#/aluno/${m.user_id}/corrida" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><div class="small" style="margin-top:2px">${x.cls ? `<span class="tag ${x.cls}">${x.st}</span>` : `<span class="muted">${x.st}</span>`}${r && r.modelo ? ` <b>${esc(r.modelo)}</b>` : ''}</div>${x.via ? `<div class="tiny dim" style="margin-top:2px">${esc(x.via)}</div>` : ''}</div>${I.chev}</a>`;
  };
  const con = al.filter((m) => {
    const r = R[m.user_id];
    return r && (r.garmin || r.intervals) && !(r.garmin || r.intervals).erro;
  });
  const err = al.filter((m) => {
    const r = R[m.user_id];
    return r && (r.garmin || r.intervals) && (r.garmin || r.intervals).erro;
  });
  const sem = al.filter((m) => !con.includes(m) && !err.includes(m));
  const grupo = (t, l, dica) =>
    l.length
      ? `<div class="section"><div class="section-h"><h2 class="h2">${t}</h2><span class="tag">${l.length}</span></div>${dica ? `<p class="small muted" style="margin:-4px 0 10px">${dica}</p>` : ''}<div class="stack">${l.map(linha).join('')}</div></div>`
      : '';
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Equipe</p><h1 class="h1">Relógios dos alunos</h1>
    <p class="muted" style="margin-top:6px">Quem está com o relógio conectado ao app, por onde (Garmin direto ou Intervals.icu, que atende Coros, Polar, Suunto, Wahoo e Amazfit) e o modelo, que aparece depois da primeira atividade importada.</p>
    <div class="card" style="margin-top:14px"><div class="ck-res cic-res"><div><b>${con.length}</b><span>conectados</span></div><div><b>${err.length}</b><span>com problema</span></div><div><b>${sem.length}</b><span>sem conexão</span></div></div></div>
    ${grupo('Com problema', err, 'A conexão caiu ou expirou: peça ao aluno para abrir Mais → Conexões e conectar de novo.')}
    ${grupo('Conectados', con, '')}
    ${grupo('Sem relógio conectado', sem, 'As corridas desses alunos só chegam se eles enviarem o arquivo, digitarem ou usarem o GPS do app.')}
    ${!al.length ? '<div class="empty"><div class="h3">Nenhum aluno ainda</div></div>' : ''}`;
}

/* ---------- painel de prontidão da equipe ---------- */
const PRONT_CURTO = { sono: 'Sono', energia: 'Energia', dor: 'Dor', estresse: 'Estresse' };
async function staffProntidao(diaSel) {
  loading();
  const hj = hojeISO();
  const dS = /^\d{4}-\d{2}-\d{2}$/.test(diaSel || '') && diaSel <= hj ? diaSel : hj,
    ehHoje = dS === hj;
  const [membT, pronts, cargas, cicDias] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades,sexo')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_prontidao')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('dia', dS)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    ehHoje ? buscarCargas(null).catch(() => ({})) : Promise.resolve({}),
    sb
      .from('nx_ciclo_dias')
      .select('aluno_id,menstruada,fluxo,sintomas,colica_int')
      .eq('org_id', S.org.id)
      .eq('dia', dS)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  dockStaff();
  const cicD = Object.fromEntries(cicDias.map((x) => [x.aluno_id, x]));
  const al = membT.filter((m) => ehMeuAluno(m) && m.ativo && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const pr = Object.fromEntries(pronts.map((p) => [p.aluno_id, p]));
  const resp = al.filter((m) => pr[m.user_id]),
    sem = al.filter((m) => !pr[m.user_id]);
  const atencao = resp.filter((m) => pr[m.user_id].alerta).sort((a, b) => pr[a.user_id].total - pr[b.user_id].total);
  const moder = resp
    .filter((m) => !pr[m.user_id].alerta && pr[m.user_id].total < 16)
    .sort((a, b) => pr[a.user_id].total - pr[b.user_id].total);
  const prontos = resp
    .filter((m) => !pr[m.user_id].alerta && pr[m.user_id].total >= 16)
    .sort((a, b) => pr[b.user_id].total - pr[a.user_id].total);
  const comCarga = al
    .filter((m) => cargas[m.user_id] && cargas[m.user_id].nivel)
    .sort((a, b) => (cargas[b.user_id].acwr || 0) - (cargas[a.user_id].acwr || 0));
  const abaDe = (m) => (faz('corrida', m) ? 'corrida' : 'forca');
  const linha = (m) => {
    const p = pr[m.user_id],
      [n, cls] = prontNivel(p.total),
      c = cargas[m.user_id];
    return `<a class="card pe-lin" href="#/aluno/${m.user_id}/saude" style="color:inherit"><div class="row" style="gap:12px;align-items:flex-start">${avAluno(m)}<div class="grow" style="min-width:0">
      <div class="row between" style="gap:8px"><b class="ellip">${esc(m.nome)}</b><span class="pe-tot ${cls}">${p.total}<small>/20</small></span></div>
      <div class="pe-itens">${['sono', 'energia', 'dor', 'estresse'].map((k) => `<span><i style="background:${PRONT_COR[p[k] - 1]}"></i>${PRONT_CURTO[k]} <b>${p[k]}</b></span>`).join('')}</div>
      ${p.dor_locais && p.dor_locais.length ? `<div class="pe-dor">${p.dor_locais.map((k) => `<span class="tag err">${esc(nomeRegDor(k))}</span>`).join('')}${p.dor_int != null ? `<span class="small muted">intensidade ${p.dor_int}/10</span>` : ''}</div>` : ''}
      ${p.obs ? `<p class="small muted pe-obs">"${esc(p.obs)}"</p>` : ''}
      ${cicD[m.user_id] && resumoDiaCiclo(cicD[m.user_id]) ? `<div class="pe-dor"><span class="tag pe-cic">${esc(resumoDiaCiclo(cicD[m.user_id]))}</span></div>` : ''}
      ${c && c.nivel ? `<div class="pe-dor">${cargaTag(c)}<span class="small muted">${esc(c.txt)}</span></div>` : ''}
      <span class="tiny dim">Prontidão ${n.toLowerCase()}</span></div></div></a>`;
  };
  const grupo = (id, t, sub, l) =>
    l.length
      ? `<div class="section" id="${id}"><div class="section-h"><h2 class="h2">${t}</h2><span class="tag">${l.length}</span></div>${sub ? `<p class="small muted" style="margin:-4px 0 10px">${sub}</p>` : ''}<div class="stack">${l.map(linha).join('')}</div></div>`
      : '';
  const nav = `<div class="mes-nav pe-nav"><a class="icon-btn sm" href="#/prontidao-equipe/${somaDias(dS, -1)}" aria-label="Dia anterior">${I.back}</a><b>${ehHoje ? 'Hoje' : dS === somaDias(hj, -1) ? 'Ontem' : fmtCurto(dS)}</b>${ehHoje ? '<span class="icon-btn sm" style="visibility:hidden"></span>' : `<a class="icon-btn sm" href="#/prontidao-equipe/${somaDias(dS, 1)}" aria-label="Próximo dia" style="transform:scaleX(-1)">${I.back}</a>`}</div>`;
  $app.innerHTML = `<a class="back" href="#/">${I.back} Hoje</a><p class="eyebrow">Equipe</p><h1 class="h1">Prontidão</h1>
    <p class="small muted" style="margin-top:6px">Check-in da manhã dos seus alunos: sono, energia, dor muscular e estresse, de 4 (pior) a 20 (melhor).</p>
    ${nav}
    <div class="pe-resumo">
      <div><b>${resp.length}<small>/${al.length}</small></b><span>responderam</span></div>
      <a href="#pe-atencao" class="${atencao.length ? 'err' : ''}"><b>${atencao.length}</b><span>${atencao.length === 1 ? 'pede' : 'pedem'} atenção</span></a>
      <a href="#pe-prontos" class="ok"><b>${prontos.length}</b><span>prontos para treinar</span></a>
      ${ehHoje ? `<a href="#pe-carga" class="${comCarga.length ? 'warn' : ''}"><b>${comCarga.length}</b><span>alerta de carga</span></a>` : ''}
    </div>
    ${grupo('pe-atencao', 'Pedem atenção', 'Prontidão baixa, dor ou algum item no pior nível. Vale conversar e ajustar o treino de hoje.', atencao)}
    ${grupo('pe-moder', 'Prontidão moderada', 'Podem treinar, com atenção à intensidade.', moder)}
    ${grupo('pe-prontos', 'Prontos para treinar', 'Prontidão boa (16 a 20): podem seguir o treino planejado, inclusive os mais fortes.', prontos)}
    ${
      ehHoje
        ? `<div class="section" id="pe-carga"><div class="section-h"><h2 class="h2">Alerta de carga</h2>${comCarga.length ? `<span class="tag warn">${comCarga.length}</span>` : ''}</div>
      <p class="small muted" style="margin:-4px 0 10px">Compara os últimos 7 dias com a média das 4 semanas anteriores (minutos x esforço de cada treino, corrida e força). Acima de 1,3x o risco de lesão começa a subir; acima de 1,5x sobe bastante. Na corrida, aumentar mais de 30% os km também acende o alerta.</p>
      ${
        comCarga.length
          ? `<div class="stack">${comCarga
              .map((m) => {
                const c = cargas[m.user_id];
                return `<a class="list-item" href="#/aluno/${m.user_id}/${abaDe(m)}" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><span class="small muted">${esc(c.txt)}</span></div>${cargaTag(c)}</a>`;
              })
              .join('')}</div>`
          : '<div class="card"><p class="small muted">Ninguém com aumento brusco de carga agora.</p></div>'
      }</div>`
        : ''
    }
    ${
      sem.length
        ? `<div class="section" id="pe-sem"><div class="section-h"><h2 class="h2">Sem check-in ${ehHoje ? 'hoje' : 'neste dia'}</h2><span class="tag">${sem.length}</span></div>
      <div class="pe-chips">${sem.map((m) => `<a href="#/aluno/${m.user_id}/saude">${avAluno(m, 'sm')}<span class="ellip">${esc(firstName(m.nome))}</span></a>`).join('')}</div>
      ${ehHoje ? '<p class="tiny dim" style="margin-top:8px">O check-in aparece para o aluno de manhã, na tela Hoje.</p>' : ''}</div>`
        : ''
    }`;
  $app.querySelectorAll('.pe-resumo a[href^="#pe-"]').forEach(
    (a) =>
      (a.onclick = (e) => {
        e.preventDefault();
        const el = document.querySelector(a.getAttribute('href'));
        if (el) el.scrollIntoView({ behavior: semMov() ? 'auto' : 'smooth', block: 'start' });
      }),
  );
}

/* ---------- Mais (aluno): o que não cabe na barra do celular ---------- */
function alunoMais() {
  const it = (href, ic, t, d, extra = '') =>
    `<a class="list-item" href="${href}" style="color:inherit"${extra}><span class="ativ-ic">${ic}</span><div class="grow"><b>${t}</b><div class="small muted">${d}</div></div>${I.chev}</a>`;
  const fC = faz('corrida');
  $app.innerHTML = `<p class="eyebrow">Mais</p><h1 class="h1">Tudo do seu app</h1>
    <p class="sec-lbl" style="margin-top:20px">Treino e desempenho</p><div class="stack" id="mais-treino">
      ${it('#/meta', I.flag, 'Minha meta', 'Seu objetivo com data e barra de progresso')}
      ${fC ? it('#/eventos', I.flag, 'Eventos e provas', 'Treinões da Nexos e suas provas') : ''}
      ${fC ? it('#/recordes', TROFEU_IC, 'Meus recordes', 'Melhores tempos em 1 km, 5 km, 10 km e meia') : ''}
      ${it('#/historico/avaliacoes', I.ficha, 'Avaliações físicas', 'Medidas, composição corporal e relatórios')}
      ${it('#/historico/fotos', I.cam, 'Fotos de evolução', 'Antes e depois, avaliação postural')}
      ${fC ? it('#/historico/previsoes', I.hist, 'Testes e previsões', 'Tempos estimados e zonas de treino') : ''}
    </div>
    <p class="sec-lbl">Saúde</p><div class="stack" id="mais-saude">
      ${it('#/agua', AGUA_IC, 'Hidratação', 'Sua semana, meta e lembretes')}
      ${it('#/prontidao', PRONT_IC, 'Check-in e dores', 'Sono, energia, dor e estresse dos últimos dias')}
      ${it('#/relogio', I.watch, 'Dados do relógio', 'Sono, VFC, frequência de repouso e mais')}
      ${S.me.sexo === 'F' ? `<a class="list-item" id="mais-ciclo" href="#/ciclo" style="color:inherit"><span class="ativ-ic" style="color:#e85d75">${I.cal}</span><div class="grow"><b>Ciclo menstrual</b><div class="small muted">Fase, calendário, sintomas e autocuidado</div></div>${I.chev}</a>` : ''}
      ${it('#/saude', I.check, 'Minha ficha de saúde', 'Anamnese e PAR-Q')}
      <span id="mais-dicas" style="display:contents">${it('#/dicas', I.ficha, 'Dicas da Nexos', 'Sono, alimentação, recuperação e prova')}</span>
    </div>
    <p class="sec-lbl">Entretenimento</p><div class="stack" id="mais-entret">
      <a class="list-item tv-item" href="#/tv" style="color:inherit"><span class="ativ-ic tv-ic">${TV_IC}</span><div class="grow"><b>TV Nexos</b><div class="small muted">Filmes e documentários de corrida, filmes completos e sala infantil</div></div>${I.chev}</a>
      <a class="list-item" href="#/meditacao" style="color:inherit"><span class="ativ-ic med-ic">${MEDIT_IC}</span><div class="grow"><b>Meditação</b><div class="small muted">Sessões guiadas para acalmar, focar, recuperar e dormir</div></div>${I.chev}</a>
    </div>
    <p class="sec-lbl">Conta</p><div class="stack" id="mais-conta">
      ${it('#/conexoes', I.watch, 'Conexões', 'Relógio Garmin e outras marcas')}
      ${it('#/pagamentos', I.money, 'Pagamentos e plano', 'Mensalidades e formas de pagamento')}
      <div id="mais-notif"></div>
      ${it('#/perfil', I.user, 'Meu perfil', 'Foto, dados, cores do app e sair')}
      ${it('/ajuda/', I.ficha, 'Central de ajuda', 'Tutoriais passo a passo de tudo do app')}
    </div>
    <p class="sec-lbl">Ajuda</p><div class="stack">
      <button class="list-item" id="mais-tour" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.play}</span><div class="grow"><b>Tour pelo app</b><div class="small muted">Um passeio rápido por tudo o que o app faz</div></div>${I.chev}</button>
    </div>`;
  document.getElementById('mais-tour').onclick = () => iniciarTour();
  secaoNotificacoes(document.getElementById('mais-notif')).catch(() => {});
  // marca quantas dicas foram publicadas desde a última visita
  const vistoD = store.get('nx-dicas-visto') || '1970-01-01';
  sb.from('nx_dicas')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', S.org.id)
    .eq('publicada', true)
    .gt('atualizado_em', vistoD)
    .then(
      (r) => {
        const n = r.count || 0,
          b = document.querySelector('#mais-dicas b');
        if (n && b) b.insertAdjacentHTML('beforeend', ` <span class="tag acc">${n} nova${n > 1 ? 's' : ''}</span>`);
      },
      () => {},
    );
}
async function viewRecordes() {
  loading();
  const { data } = await sb
    .from('nx_corridas')
    .select('id,data,tipo,distancia_m,duracao_s,parciais')
    .eq('aluno_id', S.user.id)
    .order('data', { ascending: true })
    .limit(1000);
  const best = {};
  (data || []).forEach((c) =>
    Object.entries(melhoresDaCorrida(c)).forEach(([d, t]) => {
      const b = best[d];
      if (!b || t < b.t) best[d] = { t, c, ant: b ? b.t : null };
    }),
  );
  const back = `<a class="back" href="#/mais">${I.back} Mais</a>`;
  $app.innerHTML = `${back}<p class="eyebrow">Corrida</p><h1 class="h1">Meus recordes</h1>
    <p class="small muted" style="margin-top:6px">Calculados pelas parciais de cada km, então valem também os trechos dentro de corridas maiores. Corridas na esteira não entram.</p>
    <div class="stack" style="margin-top:16px">${DIST_REC.map(([d, n]) => {
      const b = best[d];
      return b
        ? `<a class="card rec-item" href="#/corrida/${b.c.id}" style="color:inherit"><span class="rec-ic">${TROFEU_IC}</span><div class="grow"><span class="eyebrow">${n}</span><div class="h2" style="margin-top:2px">${fmtDurLongo(b.t)}</div><div class="small muted">${fmtPace(b.t / d)} · ${fmtDia(isoDia(b.c.data))}${b.ant ? ` · melhorou ${fmtDurLongo(b.ant - b.t)}` : ''}</div></div>${I.chev}</a>`
        : `<div class="card rec-item vazio"><span class="rec-ic">${TROFEU_IC}</span><div class="grow"><span class="eyebrow">${n}</span><div class="small muted" style="margin-top:4px">Ainda sem marca nessa distância.</div></div></div>`;
    }).join('')}</div>`;
}
async function viewAguaAluno() {
  loading();
  const h = await aguaStaffHTML(S.me, true);
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Saúde</p><h1 class="h1">Hidratação</h1>
    <div id="agua-box" class="agua-box" style="margin-top:16px"></div><div style="margin-top:14px">${h}</div>`;
  montarAgua(document.getElementById('agua-box'), 0).catch((e) => console.error(e));
}
async function viewProntAluno(abrir) {
  loading();
  const [h, hoje] = await Promise.all([
    prontStaffHTML(S.me),
    sb
      .from('nx_prontidao')
      .select('id')
      .eq('aluno_id', S.user.id)
      .eq('dia', isoDia(new Date()))
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
  ]);
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Saúde</p><h1 class="h1">Check-in e dores</h1>
    ${hoje ? '' : `<button class="btn block" id="pr-agora" style="margin-top:16px">${PRONT_IC} Fazer o check-in de hoje</button>`}<div style="margin-top:16px">${h}</div>`;
  const b = document.getElementById('pr-agora');
  if (b) b.onclick = () => abrirProntidao(() => viewProntAluno());
  // veio do lembrete do check-in: já abre as perguntas
  if (b && abrir) b.click();
}
