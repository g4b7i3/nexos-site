/* Nexos App · Área do treinador: alunos, montar treino, modelos, biblioteca de exercícios e retornos.
   Parte 25 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= TREINADOR ================= */
async function contarNaoVistos() {
  const [{ data: ses }, { data: pend }, vis] = await Promise.all([
    sb
      .from('nx_sessoes')
      .select('aluno_id')
      .eq('org_id', S.org.id)
      .eq('visto_treinador', false)
      .not('finalizado_em', 'is', null)
      .limit(1000),
    sb
      .from('nx_membros')
      .select('user_id,treinador_id')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .eq('aprovacao', 'pendente'),
    idsMeusAlunos(),
  ]);
  S.cache.naoVistos = (ses || []).filter((x) => vis.has(x.aluno_id)).length;
  S.cache.pendentes = (pend || []).filter(ehMeuAluno).length;
}
async function staffAlunos() {
  loading();
  const st0 = S.cache.atl || (S.cache.atl = { off: 0, q: '', f: 'ativos', modo: 'corrida' });
  if (!st0.modo) st0.modo = 'corrida';
  const ini = inicioSemana();
  ini.setDate(ini.getDate() + st0.off * 7);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ini);
    d.setDate(ini.getDate() + i);
    return isoDia(d);
  });
  const de = dias[0],
    ate = dias[6],
    hoje = hojeISO();
  const [{ data: membrosT, error }, sess, , , , fimPl, plano, corrs, provas, trDias, libsF, ciclos, cicIni] =
    await Promise.all([
      sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('papel', 'aluno').order('nome'),
      buscarSessoes(null, 600),
      contarNaoVistos(),
      contarMsgNovas(),
      sb
        .from('nx_anamneses')
        .select('aluno_id,parq_positivo,visto_treinador')
        .eq('org_id', S.org.id)
        .then((r) => {
          S.cache.anam = Object.fromEntries((r.data || []).map((x) => [x.aluno_id, x]));
        }),
      fimPlanilhas(),
      sb
        .from('nx_plano_corrida')
        .select('id,aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .gte('data', de)
        .lte('data', ate)
        .then((r) => (r.data || []).filter((p) => !semCorrida(p)))
        .catch(() => []),
      sb
        .from('nx_corridas')
        .select('aluno_id,data,tipo,plano_id')
        .eq('org_id', S.org.id)
        .gte('data', isoDia(Date.now() - 90 * 864e5))
        .order('data', { ascending: false })
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_participacoes')
        .select('aluno_id,titulo,data,distancia')
        .eq('org_id', S.org.id)
        .gte('data', hoje)
        .order('data')
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
        .select('aluno_id')
        .eq('org_id', S.org.id)
        .eq('semana', de)
        .then((r) => new Set((r.data || []).map((x) => x.aluno_id)))
        .catch(() => new Set()),
      sb
        .from('nx_ciclo')
        .select('*')
        .eq('org_id', S.org.id)
        .eq('ativo', true)
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_ciclo_inicios')
        .select('aluno_id,data')
        .eq('org_id', S.org.id)
        .gte('data', isoDia(Date.now() - 200 * 864e5))
        .order('data', { ascending: false })
        .then((r) => r.data || [])
        .catch(() => []),
    ]);
  // situação da semana: sem planilha · em preparação (montada, não liberada) · liberada
  const situacao = (m) => {
    if (st0.modo === 'forca') {
      if (!nTr[m.user_id]) return 'sem';
      return libsF.has(m.user_id) ? 'lib' : 'prep';
    }
    const pl = plano.filter((p) => p.aluno_id === m.user_id);
    if (!pl.length) return 'sem';
    return pl.every((p) => p.liberado) ? 'lib' : 'prep';
  };
  const SIT = { sem: ['Sem planilha', 'err'], prep: ['Em preparação', 'warn'], lib: ['Liberada', 'ok'] };
  const cicloDe = {};
  ciclos.forEach((c) => {
    cicloDe[c.aluno_id] = { ...c, inicios: cicIni.filter((x) => x.aluno_id === c.aluno_id).map((x) => x.data) };
  });
  const iconesAtl = (m) => {
    const out = [];
    const ci = cicloDe[m.user_id] && cicloInfo(cicloDe[m.user_id]);
    if (ci && ci.fase) {
      const f = FASES_CICLO[ci.fase];
      out.push(
        `<button type="button" class="atl-ic" style="--ic:${f[1]}" data-dica="${esc(`${f[0]} · dia ${ci.dia} de ${ci.ciclo}${ci.prox ? ` · próxima menstruação ~${fmtCurto(ci.prox + 'T12:00:00')}` : ''}`)}" aria-label="Ciclo menstrual"><svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="currentColor"/></svg></button>`,
      );
    }
    if (
      faz('corrida', m) &&
      !perfilCorrida(m).vdot &&
      !(m.corrida && m.corrida.paces_manual && Object.keys(m.corrida.paces_manual).length)
    )
      out.push(
        `<button type="button" class="atl-ic" style="--ic:#e5484d" data-dica="Atleta sem zonas de treino: cadastre um teste ou prova no perfil de corrida para os paces ficarem certos." aria-label="Sem zonas de treino"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/><path d="M6 12h3l1.5-2.5 2 5 1.5-2.5H18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></button>`,
      );
    return out.join('');
  };
  const sel = S.cache.atlSel || (S.cache.atlSel = new Set());
  if (error) throw error;
  const membros = (membrosT || []).filter(ehMeuAluno); // cada treinador vê só os próprios alunos
  dockStaff();
  const ultAtiv = {};
  sess.forEach((x) => {
    if (!ultAtiv[x.aluno_id] || x.iniciado_em > ultAtiv[x.aluno_id]) ultAtiv[x.aluno_id] = x.iniciado_em;
  });
  corrs.forEach((c) => {
    if (!ultAtiv[c.aluno_id] || c.data > ultAtiv[c.aluno_id]) ultAtiv[c.aluno_id] = c.data;
  });
  // mapa aluno -> dia -> estado
  const mapa = {};
  const marca = (id, k, v) => {
    mapa[id] = mapa[id] || {};
    mapa[id][k] = mapa[id][k] || {};
    mapa[id][k][v] = (mapa[id][k][v] || 0) + 1;
  };
  plano.forEach((p) => marca(p.aluno_id, p.data, 'pl'));
  corrs.forEach((c) => {
    const k = isoDia(c.data);
    if (k >= de && k <= ate && (ehCorr(c) || c.tipo === 'forca')) marca(c.aluno_id, k, ehCorr(c) ? 'co' : 'mu');
  });
  sess.forEach((x) => {
    const k = isoDia(x.iniciado_em);
    if (k >= de && k <= ate) marca(x.aluno_id, k, 'mu');
  });
  provas.forEach((p) => {
    if (p.data >= de && p.data <= ate) marca(p.aluno_id, p.data, 'pr');
  });
  // força: dias da semana com treino fixo
  const fDias = {};
  const nTr = {};
  trDias.forEach((t) => {
    nTr[t.aluno_id] = (nTr[t.aluno_id] || 0) + 1;
    (t.dias || []).forEach((d) => {
      (fDias[t.aluno_id] = fDias[t.aluno_id] || new Set()).add(d);
    });
  });
  const ultMu = {};
  sess.forEach((x) => {
    if (!ultMu[x.aluno_id] || x.iniciado_em > ultMu[x.aluno_id]) ultMu[x.aluno_id] = x.iniciado_em;
  });
  const proxProva = {};
  provas.forEach((p) => {
    if (!proxProva[p.aluno_id]) proxProva[p.aluno_id] = p;
  });
  const ativos = membros.filter((m) => m.ativo);
  const rot = (k) => {
    const d = dia(k);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const pontos = (id) => {
    const md = mapa[id] || {};
    if (st0.modo === 'forca') {
      const fd = fDias[id] || new Set();
      return `<div class="sem3 so1"><div class="sem1">${dias
        .map((k, i) => {
          const x = md[k] || {};
          let c = 'vazio',
            t = 'Sem treino';
          if (fd.has(i)) {
            const feito = (x.mu || 0) >= 1;
            c = feito ? 'feito' : k < hoje ? 'perdeu' : 'plan';
            t = feito ? 'Treino feito' : k < hoje ? 'Treino não feito' : 'Treino planejado';
          } else if (x.mu) {
            c = 'extra';
            t = 'Treino fora do dia';
          }
          return `<span class="pt ${c} ${k === hoje ? 'hoje' : ''}" title="${rot(k)} · ${t}"><small>${'STQQSSD'[i]}</small><i></i><em>${dia(k).getDate()}</em></span>`;
        })
        .join('')}</div></div>`;
    }
    return `<div class="sem3 so1"><div class="sem1">${dias
      .map((k, i) => {
        const x = md[k] || {};
        let c = 'vazio',
          t = 'Sem treino';
        if (x.pr) {
          c = 'prova';
          t = 'Prova';
        } else if (x.pl) {
          const feito = (x.co || 0) >= 1;
          c = feito ? 'feito' : k < hoje ? 'perdeu' : 'plan';
          t = feito ? 'Corrida feita' : k < hoje ? 'Treino não feito' : 'Treino planejado';
        } else if (x.co || x.mu) {
          c = 'extra';
          t = x.co ? 'Corrida' : 'Musculação';
        }
        return `<span class="pt ${c} ${k === hoje ? 'hoje' : ''}" title="${rot(k)} · ${t}"><small>${'STQQSSD'[i]}</small><i></i><em>${dia(k).getDate()}</em></span>`;
      })
      .join('')}</div></div>`;
  };
  $app.innerHTML = `
    <div class="row between" style="gap:10px;flex-wrap:wrap"><div><p class="eyebrow">Gestão de atletas</p><h1 class="h1">Meus Atletas</h1></div><button class="btn sm" id="novo">${I.plus} Novo aluno</button></div>
    <div class="atl-top">
      <div class="row" style="gap:6px"><button class="icon-btn sm" id="sem-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="sem-h">${st0.off === 0 ? 'Esta semana' : st0.off === -1 ? 'Semana passada' : st0.off === 1 ? 'Próxima semana' : `${rot(de)} a ${rot(ate)}`}</button><button class="icon-btn sm" id="sem-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>

    </div>
    <div class="subtabs mod-tabs" id="modo" style="margin-top:12px"><button type="button" data-m="corrida" class="${st0.modo === 'corrida' ? 'on' : ''}">${I.run} Corrida</button><button type="button" data-m="forca" class="${st0.modo === 'forca' ? 'on' : ''}">${I.lib} Força</button></div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="q" placeholder="Buscar atleta" value="${esc(st0.q)}"></div>
    <div class="sit-tiles" id="sit-tiles"></div>
    <div class="chips" id="filtros">${[
      ['ativos', 'Ativos'],
      ['planilha', 'Planilha acabando'],
      ['naofez', 'Faltou treino'],
      ['sumidos', 'Sem treinar há 7+ dias'],
      ['inativos', 'Inativos'],
    ]
      .map(([k, l]) => `<button class="chip ${st0.f === k ? 'on' : ''}" data-f="${k}">${l}</button>`)
      .join('')}</div>
    <div class="atl-leg"><span><i class="pt-l feito"></i>feito</span><span><i class="pt-l plan"></i>planejado</span><span><i class="pt-l perdeu"></i>não fez</span><span><i class="pt-l extra"></i>treino extra</span><span><i class="pt-l prova"></i>prova</span></div>
    <p class="tiny dim" id="cont" style="margin-top:6px"></p>
    <div id="lista" class="atl-lista"></div>
    <div class="bulk-bar" id="bulk" hidden><label class="bulk-all"><input type="checkbox" id="sel-todos"><span>Todos</span></label><b id="bulk-n"></b><button class="btn sm" id="bulk-lib">${I.check} Liberar semana</button><button class="link-btn small" id="bulk-x">Limpar</button></div>`;
  const draw = () => {
    const q = semAcento(st0.q);
    const modoF = st0.modo === 'forca';
    document.querySelector('#filtros [data-f="planilha"]').textContent = modoF ? 'Sem dia fixo' : 'Planilha acabando';
    let l = membros
      .filter((m) => !q || semAcento(m.nome + ' ' + (m.email || '')).includes(q))
      .filter((m) => faz(modoF ? 'musculacao' : 'corrida', m));
    if (st0.f === 'ativos') l = l.filter((m) => m.ativo);
    if (st0.f === 'inativos') l = l.filter((m) => !m.ativo);
    if (st0.f === 'sumidos')
      l = l.filter((m) => m.ativo && (!ultAtiv[m.user_id] || diasDesde(ultAtiv[m.user_id]) >= 7));
    if (st0.f === 'naofez')
      l = l.filter(
        (m) =>
          m.ativo &&
          (modoF
            ? dias.some(
                (k, i) =>
                  k < hoje && (fDias[m.user_id] || new Set()).has(i % 7) && !((mapa[m.user_id] || {})[k] || {}).mu,
              )
            : Object.entries(mapa[m.user_id] || {}).some(([k, x]) => x.pl && !x.co && k < hoje)),
      );
    if (st0.f === 'sumidos' && modoF) l = l.filter((m) => !ultMu[m.user_id] || diasDesde(ultMu[m.user_id]) >= 7);
    if (st0.f === 'planilha' && modoF) l = l.filter((m) => m.ativo && !(fDias[m.user_id] || new Set()).size);
    else if (st0.f === 'planilha')
      l = l
        .filter((m) => m.ativo && faz('corrida', m) && statusPlanilha(fimPl[m.user_id]).d <= 6)
        .sort((a, b) => statusPlanilha(fimPl[a.user_id]).d - statusPlanilha(fimPl[b.user_id]).d);
    // contadores da semana (sobre os atletas ativos visíveis no modo atual)
    const base = membros.filter((m) => m.ativo && faz(modoF ? 'musculacao' : 'corrida', m));
    const cnt = { sem: 0, prep: 0, lib: 0 };
    base.forEach((m) => cnt[situacao(m)]++);
    document.getElementById('sit-tiles').innerHTML = [
      ['ativos', base.length, 'atletas ativos', 'acc'],
      ['sit-prep', cnt.prep, 'em preparação', 'warn'],
      ['sit-sem', cnt.sem, modoF ? 'sem treino de força' : 'sem planilha', 'err'],
      ['sit-lib', cnt.lib, 'semanas liberadas', 'ok'],
    ]
      .map(
        ([k, n, t, c]) =>
          `<button type="button" class="sit-t ${c} ${st0.f === k ? 'on' : ''}" data-f="${k}"><b>${n}</b><span>${t}</span><i></i></button>`,
      )
      .join('');
    if (st0.f && st0.f.startsWith('sit-')) l = l.filter((m) => m.ativo && situacao(m) === st0.f.slice(4));
    document.getElementById('cont').textContent = `${l.length} atleta${l.length === 1 ? '' : 's'}`;
    S.cache.atlVis = l.filter((m) => m.ativo).map((m) => m.user_id);
    document.getElementById('lista').innerHTML = l.length
      ? l
          .map((m) => {
            const dd = ultAtiv[m.user_id] ? diasDesde(ultAtiv[m.user_id]) : null;
            const stc = !m.ativo ? '' : dd == null ? '' : dd <= 3 ? 'st-ok' : dd <= 7 ? 'st-warn' : '';
            const sp = faz('corrida', m) ? statusPlanilha(fimPl[m.user_id]) : null;
            const pv = proxProva[m.user_id];
            const alerta = (S.cache.anam || {})[m.user_id]?.parq_positivo ? '<span class="tag err">PAR-Q</span>' : '';
            const si = m.ativo ? SIT[situacao(m)] : null;
            return `<div class="atl ${sel.has(m.user_id) ? 'sel' : ''}" data-aluno="${m.user_id}">
        <div class="atl-id">${m.ativo ? `<label class="atl-chk" data-chk="${m.user_id}"><input type="checkbox" ${sel.has(m.user_id) ? 'checked' : ''}></label>` : ''}${avAluno(m, stc)}<div class="grow" style="min-width:0"><div class="atl-nome"><b class="ellip">${esc(m.nome)}</b>${modSelos(m)}${iconesAtl(m)}${si ? `<span class="tag ${si[1]} sit-tag">${si[0]}</span>` : ''}</div>
          <div class="atl-sub">${!m.treinador_id ? '<span class="tag warn">sem treinador</span>' : ''}${alerta}${(S.cache.msgPorAluno || {})[m.user_id] ? `<span class="tag acc">${S.cache.msgPorAluno[m.user_id]} msg</span>` : ''}${modoF ? `<span class="${nTr[m.user_id] ? '' : 'pl-err'}">${nTr[m.user_id] ? `${nTr[m.user_id]} treino${nTr[m.user_id] > 1 ? 's' : ''}${(fDias[m.user_id] || new Set()).size ? ' · ' + diasTxt([...fDias[m.user_id]]) : ' · sem dia fixo'}` : 'Sem treino de força'}</span>${ultMu[m.user_id] ? `<span class="dim">último ${diasDesde(ultMu[m.user_id]) === 0 ? 'hoje' : 'há ' + diasDesde(ultMu[m.user_id]) + 'd'}</span>` : ''}` : sp ? `<span class="pl-${sp.cls}">${esc(sp.t)}</span>` : ''}</div>
          ${pv && !modoF ? `<div class="atl-prova">${icT(I.flag)}${esc(pv.titulo)} · ${fmtCurto(pv.data + 'T12:00:00')}${pv.distancia ? ' · ' + esc(pv.distancia) : ''} · <b>${faltam(pv.data)}</b></div>` : ''}</div></div>
        ${m.ativo ? pontos(m.user_id) : '<div class="atl-inativo dim small">Inativo</div>'}
        <div class="atl-ac">${faz('corrida', m) ? `<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/corrida" aria-label="Planilha de corrida" title="Planilha de corrida">${I.run}</button>` : ''}${faz('musculacao', m) ? `<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/forca" aria-label="Planilha de força" title="Planilha de força">${I.lib}</button>` : ''}<button class="icon-btn sm" data-ir="#/aluno/${m.user_id}/conversa" aria-label="Conversa" title="Conversa">${I.feed}</button></div>
      </div>`;
          })
          .join('')
      : `<div class="empty"><div class="h3">${membros.length ? 'Nenhum atleta nesse filtro' : 'Nenhum atleta ainda'}</div><p class="small">${membros.length ? '' : 'Toque em “Novo aluno” para cadastrar o primeiro.'}</p></div>`;
  };
  draw();
  const re = () => staffAlunos();
  document.getElementById('sem-a').onclick = () => {
    st0.off -= 1;
    re();
  };
  document.getElementById('sem-p').onclick = () => {
    st0.off += 1;
    re();
  };
  document.getElementById('sem-h').onclick = () => {
    st0.off = 0;
    re();
  };
  document.getElementById('q').oninput = (e) => {
    st0.q = e.target.value;
    draw();
  };
  document.getElementById('filtros').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    st0.f = b.dataset.f;
    document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.toggle('on', c === b));
    draw();
  };
  const bulk = () => {
    const n = sel.size;
    const b = document.getElementById('bulk');
    b.hidden = !n;
    document.getElementById('bulk-n').textContent = `${n} selecionado${n > 1 ? 's' : ''}`;
    const vis = S.cache.atlVis || [];
    document.getElementById('sel-todos').checked = vis.length && vis.every((id) => sel.has(id));
  };
  document.getElementById('sit-tiles').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    st0.f = st0.f === b.dataset.f ? 'ativos' : b.dataset.f;
    document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === st0.f));
    draw();
  };
  document.getElementById('sel-todos').onchange = (e) => {
    (S.cache.atlVis || []).forEach((id) => (e.target.checked ? sel.add(id) : sel.delete(id)));
    draw();
    bulk();
  };
  document.getElementById('bulk-x').onclick = () => {
    sel.clear();
    draw();
    bulk();
  };
  document.getElementById('bulk-lib').onclick = async (e) => {
    const ids = [...sel];
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Liberando…';
    try {
      if (st0.modo === 'forca') {
        const novos = ids.filter((id) => nTr[id] && !libsF.has(id));
        if (novos.length) {
          const { error: er } = await sb
            .from('nx_forca_semanas')
            .insert(novos.map((id) => ({ org_id: S.org.id, aluno_id: id, semana: de })));
          if (er) throw er;
        }
        novos.forEach((id) => notificarAluno('planilha', id));
        toast(
          novos.length
            ? `Treinos de força liberados para ${novos.length} atleta${novos.length > 1 ? 's' : ''}.`
            : 'Nada para liberar nos selecionados.',
        );
      } else {
        const comPlano = ids.filter((id) => plano.some((p) => p.aluno_id === id && !p.liberado));
        if (comPlano.length) {
          const { error: er } = await sb
            .from('nx_plano_corrida')
            .update({ liberado: true })
            .eq('org_id', S.org.id)
            .in('aluno_id', comPlano)
            .gte('data', de)
            .lte('data', ate);
          if (er) throw er;
        }
        comPlano.forEach((id) => notificarAluno('planilha', id));
        // treinos liberados também vão para o Garmin de quem tiver
        if (comPlano.length)
          sb.from('nx_plano_corrida')
            .select('*')
            .eq('org_id', S.org.id)
            .in('aluno_id', comPlano)
            .gte('data', de)
            .lte('data', ate)
            .then(({ data: pls }) => {
              comPlano.forEach((id) => {
                const m = membros.find((x) => x.user_id === id);
                const lista = (pls || []).filter((p) => p.aluno_id === id);
                if (lista.length) enviarGarmin(id, lista, perfilCorrida(m)).catch(() => {});
              });
            })
            .catch(() => {});
        const semNada = ids.length - comPlano.length;
        toast(
          comPlano.length
            ? `Semana liberada para ${comPlano.length} atleta${comPlano.length > 1 ? 's' : ''}. Eles foram avisados.${semNada ? ` (${semNada} já estava${semNada > 1 ? 'm' : ''} liberado${semNada > 1 ? 's' : ''} ou sem planilha)` : ''}`
            : 'Os selecionados já estão liberados ou sem planilha nesta semana.',
        );
      }
      sel.clear();
      staffAlunos();
    } catch (er) {
      console.error(er);
      btn.disabled = false;
      btn.innerHTML = `${I.check} Liberar semana`;
      toast('Não foi possível liberar agora.', true);
    }
  };
  bulk();
  document.getElementById('lista').onclick = (e) => {
    const ic = e.target.closest('[data-dica]');
    if (ic) {
      e.stopPropagation();
      toast(ic.dataset.dica);
      return;
    }
    const ck = e.target.closest('[data-chk]');
    if (ck) {
      e.stopPropagation();
      if (e.target.tagName !== 'INPUT') return;
      const id = ck.dataset.chk;
      e.target.checked ? sel.add(id) : sel.delete(id);
      ck.closest('.atl').classList.toggle('sel', e.target.checked);
      bulk();
      return;
    }
    const ir = e.target.closest('[data-ir]');
    if (ir) {
      location.hash = ir.dataset.ir;
      return;
    }
    const it = e.target.closest('[data-aluno]');
    if (it) location.hash = '#/aluno/' + it.dataset.aluno + '/' + st0.modo;
  };
  document.getElementById('modo').onclick = (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    st0.modo = b.dataset.m;
    document.querySelectorAll('#modo button').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  };
  document.getElementById('novo').onclick = () => formPessoa('aluno');
}

function formPessoa(tipo, pre = {}, aoCriar) {
  const senha = gerarSenha();
  const aluno = tipo === 'aluno';
  const pv = (k) => esc(pre[k] || '');
  openSheet(
    `
    <p class="eyebrow">${aluno ? 'Novo aluno' : 'Novo treinador'}</p><div class="h2" style="margin-top:4px">${aluno ? 'Cadastrar aluno' : 'Adicionar treinador'}</div>
    <form id="f-pessoa" style="margin-top:16px">
      <label class="field"><span>Nome completo</span><input class="input" name="nome" required autofocus value="${pv('nome')}"></label>
      <label class="field"><span>E-mail (será o login)</span><input class="input" type="email" name="email" required inputmode="email" value="${pv('email')}"></label>
      ${
        aluno
          ? `<div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${pv('telefone')}"></label><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(pv('nascimento'))}"></label></div>
      <div class="field"><span>Faz com a Nexos</span>${modsHTML(pre.mods || null)}</div>
      <label class="field"><span>Objetivo</span><input class="input" name="objetivo" placeholder="Ex.: correr 10 km, emagrecer, hipertrofia" value="${pv('objetivo')}"></label>
      <label class="field"><span>Observações de saúde / restrições</span><textarea class="textarea" name="observacoes" placeholder="Ex.: dor no joelho esquerdo, hipertensão controlada">${pv('observacoes')}</textarea></label>`
          : ''
      }
      <label class="field"><span>Senha inicial</span><div class="row" style="gap:8px"><input class="input mono" name="senha" value="${senha}" minlength="6" required><button type="button" class="btn ghost sm" id="nova-senha">Gerar</button></div></label>
      <p class="tiny dim" style="margin:-4px 0 16px">Ele pode trocar a senha depois, no perfil.</p>
      <button class="btn block" type="submit">${aluno ? 'Cadastrar aluno' : 'Adicionar treinador'}</button>
    </form>`,
    (root) => {
      root.querySelector('#nova-senha').onclick = () => (root.querySelector('[name=senha]').value = gerarSenha());
      root.querySelector('#f-pessoa').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('[type=submit]');
        btn.disabled = true;
        const fd = new FormData(f);
        const mods = fd.getAll('mod');
        fd.delete('mod');
        if (aluno && !mods.length) {
          btn.disabled = false;
          return toast('Marque musculação, corrida ou as duas.', true);
        }
        const dados = Object.fromEntries(fd.entries());
        if (dados.nascimento) {
          const iso = dataISO(dados.nascimento);
          if (!iso) {
            btn.disabled = false;
            return toast('Confira a data de nascimento (dd/mm/aaaa).', true);
          }
          dados.nascimento = iso;
        }
        Object.keys(dados).forEach((k) => {
          if (dados[k] === '') delete dados[k];
        });
        try {
          const r = await chamarFuncao({ acao: aluno ? 'criar' : 'criar_treinador', ...dados });
          if (aluno && r.user_id && mods.length < MODS.length)
            await sb.from('nx_membros').update({ modalidades: mods }).eq('org_id', S.org.id).eq('user_id', r.user_id);
          if (aoCriar)
            try {
              await aoCriar(r);
            } catch (e2) {
              console.error(e2);
            }
          mostrarCredenciais(dados, r.existente, aluno);
          if (aluno && location.hash === '#/alunos') staffAlunos();
        } catch (err) {
          btn.disabled = false;
          toast(err.message, true);
        }
      };
    },
  );
}

/** envia um e-mail da Nexos (com a logo) pelo Gmail da assessoria */
async function enviarEmailNexos(body, btn) {
  const txt = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enviando…';
  }
  try {
    const { data, error } = await sb.functions.invoke('nx-email', { body: { org_id: S.org.id, ...body } });
    let erro = data && data.erro;
    if (error) {
      erro = 'Não foi possível enviar o e-mail agora.';
      try {
        const j = await error.context.json();
        if (j?.erro) erro = j.erro;
      } catch {}
    }
    if (data && data.configurado === false) {
      toast('O envio por e-mail ainda não foi configurado (falta a senha de app do Gmail).', true);
      return false;
    }
    if (erro) {
      toast(erro, true);
      return false;
    }
    toast(`E-mail enviado para ${body.para}`);
    if (btn) {
      btn.innerHTML = `${I.check} E-mail enviado`;
    }
    return true;
  } finally {
    if (btn && btn.textContent === 'Enviando…') {
      btn.disabled = false;
      btn.innerHTML = txt;
    }
  }
}
function mostrarCredenciais(d, existente, aluno = true, tipo = 'acesso') {
  const url = loginURL();
  const msg = existente
    ? `Olá, ${firstName(d.nome)}! Seu acesso ao app da Nexos foi liberado. Entre em ${url} com o e-mail ${d.email} e a senha que você já usa.`
    : `Olá, ${firstName(d.nome)}! Seu acesso ao app da Nexos está pronto\n\nAcesse: ${url}\nE-mail: ${d.email}\nSenha: ${d.senha}\n\nDepois de entrar, você pode trocar a senha no seu perfil.`;
  const tel = String(d.telefone || '').replace(/\D/g, '');
  const wa = `https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(msg)}`;
  openSheet(
    `
    <div class="center">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">${aluno ? 'Aluno cadastrado' : 'Treinador adicionado'}</div>
    <p class="small muted" style="margin:6px 0 16px">${existente ? 'Esse e-mail já tinha conta: a pessoa entra com a senha que já usa.' : 'Envie os dados de acesso:'}</p></div>
    <div class="cred">Acesso: <b>${esc(url)}</b><br>E-mail: <b>${esc(d.email)}</b>${existente ? '' : `<br>Senha: <b>${esc(d.senha)}</b>`}</div>
    <a class="btn block" style="margin-top:16px;background:#25d366;color:#04122b" href="${esc(wa)}" target="_blank" rel="noopener">${I.wa} Enviar pelo WhatsApp</a>
    ${d.email ? `<button class="btn block mail-btn" id="por-email" style="margin-top:8px">${I.mail} Enviar por e-mail</button>` : ''}
    <button class="btn ghost block" id="copiar" style="margin-top:8px">Copiar mensagem</button>
    <button class="btn ghost block" data-close style="margin-top:8px">Concluir</button>`,
    (root) => {
      const pe = root.querySelector('#por-email');
      if (pe)
        pe.onclick = () =>
          enviarEmailNexos(
            { tipo, para: d.email, nome: d.nome, login: d.email, senha: existente ? null : d.senha, link: url },
            pe,
          );
      root.querySelector('#copiar').onclick = async () => {
        try {
          await navigator.clipboard.writeText(msg);
          toast('Mensagem copiada!');
        } catch {
          toast('Não foi possível copiar.', true);
        }
      };
    },
  );
}

async function silencioso(fn) {
  const y = scrollY;
  S.silencio = true;
  try {
    await fn();
  } finally {
    S.silencio = false;
    scrollTo(scrollX, y);
  }
}
async function staffAluno(alunoId, aba, extra) {
  if (!S.silencio) loading();
  let anamnese = null,
    termo = null,
    planoInfo = null;
  let corrRec = [];
  const [{ data: m, error }, treinos, sess] = await Promise.all([
    sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
    buscarTreinosDoAluno(alunoId),
    buscarSessoes(alunoId, 300),
    contarMsgNovas(),
    sb
      .from('nx_anamneses')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .maybeSingle()
      .then((r) => r.data),
    sb
      .from('nx_corridas')
      .select('id,data')
      .eq('aluno_id', alunoId)
      .gte('data', isoDia(Date.now() - 60 * 864e5))
      .then((r) => r.data || [])
      .catch(() => []),
  ]).then((r) => {
    anamnese = r[4];
    corrRec = r[5];
    return r;
  });
  dockStaff();
  if (error) throw error;
  if (!m) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  aba = aba || 'inicio';
  if (aba === 'treinos') aba = 'forca';
  const cicloA =
    (aba === 'corrida' || aba === 'forca') && m.sexo === 'F' ? await buscarCiclo(alunoId).catch(() => null) : null;
  const provaProxA =
    aba === 'corrida' || aba === 'forca'
      ? await sb
          .from('nx_participacoes')
          .select('titulo,data,distancia')
          .eq('aluno_id', alunoId)
          .gte('data', hojeISO())
          .order('data')
          .limit(1)
          .then((r) => (r.data || [])[0])
          .catch(() => null)
      : null;
  let grupos = [];
  const u = sess[0];
  // último treino: musculação ou corrida, o que for mais recente (aluno só de corrida não tem sessão de força)
  const ultT = [u && u.iniciado_em, ...(corrRec || []).map((x) => x.data)].filter(Boolean).sort().pop() || null;
  let corpo = '';
  const fM = faz('musculacao', m),
    fC = faz('corrida', m);
  const SECOES = [
    ['forca', 'Força', I.lib, 'Planilha de musculação', fM],
    ['corrida', 'Corrida', icCorr(m), 'Planilha e evolução', fC],
    ['historico', 'Feedbacks', I.feed, `${sess.length} treino${sess.length === 1 ? '' : 's'} registrados`, true],
    ['cargas', 'Evolução de cargas', I.hist, 'Progressão por exercício', fM],
    ['dossie', 'Dossiê de desempenho', LAB_IC, 'Laboratório Nexos', true],
    ['relmes', 'Relatório do mês', I.ficha, 'PDF para mandar ao aluno', true],
    ['avaliacoes', 'Avaliações', I.check, 'Composição corporal e relatórios', true],
    ['fotos', 'Fotos e postura', I.cam, 'Progresso visual', true],
    ['saude', 'Saúde', I.bell, anamnese && anamnese.parq_positivo ? 'PAR-Q com “sim”' : 'Anamnese e PAR-Q', true],
    [
      'energia',
      'Saúde da atleta',
      ENERGIA_IC,
      m.sexo === 'F' ? 'Energia, ciclo e fases da vida' : 'Sinais de baixa energia',
      true,
    ],
    [
      'conversa',
      'Conversa',
      I.feed,
      (S.cache.msgPorAluno || {})[alunoId] ? `${S.cache.msgPorAluno[alunoId]} mensagem nova` : 'Falar com o aluno',
      true,
    ],
    ['dados', 'Dados e plano', I.money, 'Cadastro, plano e acesso', true],
  ].filter((x) => x[4]);
  if (aba === 'inicio') {
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const seg = inicioSemana();
    const diasAtiv = new Set([...sess.map((x) => isoDia(x.iniciado_em)), ...corrRec.map((c) => isoDia(c.data))]);
    const circ = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(seg);
      d.setDate(seg.getDate() + i);
      const k = isoDia(d);
      return `<div class="fq-d ${diasAtiv.has(k) ? 'ok' : ''} ${k === isoDia(hoje) ? 'hoje' : ''} ${k > isoDia(hoje) ? 'fut' : ''}"><i>${diasAtiv.has(k) ? I.check : ''}</i><span>${'STQQSSD'[i]}</span></div>`;
    }).join('');
    const datas = [...diasAtiv].sort();
    const ult = datas[datas.length - 1];
    const diasSem = ult ? Math.round((dia(isoDia(hoje)) - dia(ult)) / 864e5) : null;
    const n28 = [...sess.map((x) => x.iniciado_em), ...corrRec.map((c) => c.data)].filter(
      (d) => diasDesde(d) < 28,
    ).length;
    const media = n28 / 4;
    const novo = !ult && diasDesde(m.criado_em) < 14;
    const st = novo
      ? ['Novo', 'acc']
      : diasSem == null || diasSem > 21
        ? ['Abandono', 'err']
        : diasSem > 7
          ? ['Atenção', 'warn']
          : ['Ativo', 'ok'];
    corpo = `<div class="card ov-card"><div class="row between"><b>Frequência da semana</b><span class="small muted">${[...diasAtiv].filter((k) => k >= isoDia(seg)).length} dia(s)</span></div><div class="fq">${circ}</div></div>
      <div class="card ov-card"><div class="row between"><b>Engajamento</b><span class="tag ${st[1]}">${st[0]}</span></div>
        <div class="ov-num"><div><span>Último treino há</span><b>${diasSem == null ? '–' : diasSem === 0 ? 'hoje' : diasSem + (diasSem === 1 ? ' dia' : ' dias')}</b></div><div><span>Frequência média</span><b>${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x semana</b></div></div></div>
      ${diasSem != null && diasSem >= RESGATE_DIAS ? `<button class="list-item resg-item" id="al-resg" data-dias="${diasSem}" style="width:100%;text-align:left"><span class="ativ-ic wa">${I.wa}</span><div class="grow"><b>Mandar mensagem de resgate</b><div class="small muted">Sem treinar há ${diasSem} dias · texto pronto para o WhatsApp</div></div>${I.chev}</button>` : ''}
      <div id="energia-al"></div>
      <div id="meta-al" style="margin-top:14px"></div>
      <div class="sec-grid">${SECOES.map(([k, l, ic, d]) => `<a class="sec-tile" href="#/aluno/${alunoId}/${k}"><span class="st-ic">${ic}</span><b>${l}</b><small>${d}</small></a>`).join('')}</div>`;
  } else if (aba === 'relmes') {
    corpo = '<div id="relm"></div>';
  } else if (aba === 'forca') {
    const ultData = (t) => sess.filter((x) => x.treino_id === t.id);
    const fst = S.cache.fsem || (S.cache.fsem = { off: 0 });
    const ini = inicioSemana();
    ini.setDate(ini.getDate() + fst.off * 7);
    const diasF = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ini);
      d.setDate(ini.getDate() + i);
      return isoDia(d);
    });
    const hojeF = hojeISO();
    const ativosT = treinos.filter((t) => t.ativo);
    const semDia = ativosT.filter((t) => !(t.dias && t.dias.length));
    const offF = dispDe(m).off_forca || [];
    const [libF, faseF, metrHTML] = await Promise.all([
      sb
        .from('nx_forca_semanas')
        .select('id')
        .eq('aluno_id', alunoId)
        .eq('semana', diasF[0])
        .maybeSingle()
        .then((r) => r.data)
        .catch(() => null),
      faseDaSemana(alunoId, diasF[0]),
      metricasForcaHTML(alunoId, diasF[0], sess).catch((e) => {
        console.error(e);
        return '';
      }),
    ]);
    const temFixos = ativosT.some((t) => t.dias && t.dias.length) || offF.length;
    corpo =
      `<div class="pl-top"><div class="sem-nav ${fst.off === 0 ? '' : 'fora'}"><button class="icon-btn sm" id="fs-a" aria-label="Semana anterior">${I.back}</button><div class="sem-nav-t"><b>${semRel(fst.off)}</b><span>${diaMes(dia(diasF[0]))} a ${diaMes(dia(diasF[6]))}</span></div><button class="icon-btn sm" id="fs-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button>${fst.off !== 0 ? `<button class="btn sm sem-volta" id="fs-h"><i></i>Voltar para esta semana</button>` : ''}</div>
      <span class="small muted">${sess.filter((x) => isoDia(x.iniciado_em) >= diasF[0] && isoDia(x.iniciado_em) <= diasF[6]).length} treino(s) feitos na semana</span></div>
      <div class="sem-tit" style="margin:10px 0 2px"><span class="sem-rel ${fst.off === 0 ? 'atual' : fst.off === 1 ? 'prox' : fst.off > 1 ? 'futura' : 'passada'}">${fst.off === 0 ? '<i></i>' : ''}${semRel(fst.off)}</span><b>${diaMes(dia(diasF[0]))} – ${diaMes(dia(diasF[6]))}</b></div>
      ${temFixos ? (libF ? `<div class="lib-bar ok"><span>✓ Semana liberada: o aluno já vê estes treinos</span><button type="button" class="link-btn small" id="f-desliberar">Cancelar liberação</button></div>` : `<div class="lib-bar"><span>Rascunho: o aluno ainda não vê esta semana</span><button type="button" class="btn sm lib-btn" id="f-liberar">Liberar ${fst.off === 0 ? 'esta semana' : fst.off === 1 ? 'a próxima semana' : fst.off > 1 ? `a semana de ${diaMes(dia(diasF[0]))}` : 'semana passada'}</button></div>`) : ''}
      <div class="fase-sel"><span class="small muted" style="font-weight:700">Fase desta semana</span><div class="fase-chips">${Object.entries(
        FASES_F,
      )
        .map(
          ([k, x]) =>
            `<button type="button" data-fase="${k}" class="${faseF === k ? 'on' : ''}" style="--fc:${x.cor}"><b>${x.n}</b><small>${x.reps.replace(' repetições', ' rep.')}</small></button>`,
        )
        .join(
          '',
        )}</div>${faseF ? `<p class="tiny dim">${FASES_F[faseF].desc} O aluno vê a fase e a carga que usou na última semana de ${FASES_F[faseF].n.toLowerCase()}. <button type="button" class="link-btn tiny" data-fase="">Tirar a fase</button></p>` : '<p class="tiny dim">Escolha a fase para o aluno ver a zona de repetições e comparar com a última semana igual.</p>'}</div>
      <div class="fsem ${temFixos && !libF ? 'rasc' : ''}">${diasF
        .map((k, i) => {
          const doDia = ativosT.filter((t) => (t.dias || []).includes(i));
          const feitos = sess.filter((x) => isoDia(x.iniciado_em) === k);
          return `<div class="fdia ${k === hojeF ? 'hoje' : ''} ${k < hojeF ? 'passado' : ''}"><div class="fdia-h"><b class="fdia-n">${dia(k).getDate()}</b><span class="fdia-d">${DSEM[i]}</span><span class="fdia-ic">${dispIcones(m, i)}</span><button class="cal-add" data-fadd="${i}" aria-label="Pôr treino na ${DSEM[i]}">${I.plus}</button></div>
          <div class="fdia-c">${doDia
            .map((t) => {
              const ok = feitos.find((x) => x.treino_id === t.id);
              return `<div class="ftr ${ok ? 'feito' : k < hojeF ? 'perdeu' : ''}"><a href="#/aluno/${alunoId}/treino/${t.id}" class="grow" style="color:inherit;min-width:0">${ok ? `<span class="ses-conc fo"><i>${I.check}</i>Treino concluído</span>` : ''}<b class="ellip" style="display:block">${esc(t.titulo)}</b><small>${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios${ok ? (ok.esforco != null ? ' · esforço ' + ok.esforco + '/10' : '') : k < hojeF ? ' · não fez' : ''}</small></a><button class="sd-x" data-frm="${t.id}" data-d="${i}" aria-label="Tirar deste dia">${I.x}</button></div>`;
            })
            .join('')}
          ${feitos
            .filter((x) => !doDia.some((t) => t.id === x.treino_id))
            .map(
              (x) =>
                `<div class="ftr feito extra"><span class="grow"><span class="ses-conc fo"><i>${I.check}</i>Treino extra</span><b>${esc(x.treino_titulo || 'Treino')}</b><small>fora do dia planejado${x.esforco != null ? ' · esforço ' + x.esforco + '/10' : ''}</small></span></div>`,
            )
            .join('')}
          ${offF.includes(i) ? `<div class="ftr folga"><span class="off-ic">${OFF_IC}</span><span class="grow"><b>Day off</b><small>Descanso de força</small></span><button class="sd-x" data-froff="${i}" aria-label="Tirar o day off">${I.x}</button></div>` : ''}
          ${!doDia.length && !feitos.length && !offF.includes(i) ? '<span class="cal-vazio">sem treino</span>' : ''}</div></div>`;
        })
        .join('')}</div>
      ${semDia.length ? `<p class="small muted" style="margin-top:12px">Sem dia fixo (o aluno faz na sequência): ${semDia.map((t) => `<b>${esc(t.titulo)}</b>`).join(', ')}. Toque no + de um dia para fixar.</p>` : ''}
      ${metrHTML}
      <div class="section"><div class="section-h"><h2 class="h2">Treinos do aluno</h2>${slashes}</div><div class="stack">` +
      (treinos.length
        ? treinos
            .map((t, i) => {
              const ex = ultData(t);
              return `
      <div class="card tr-card"><div class="row between" style="align-items:flex-start;gap:10px"><div class="row" style="gap:12px;align-items:flex-start"><div class="wletter sm">${esc(letraTreino(t, i))}</div>
        <div><div class="h3">${esc(t.titulo)}</div><div class="small muted">${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} ${t.nx_treino_itens.length === 1 ? 'exercício' : 'exercícios'}${!t.ativo ? ' · <span style="color:var(--warn)">pausado</span>' : ''}</div>${t.dias && t.dias.length ? `<span class="tag acc" style="margin-top:4px">${diasTxt(t.dias)}</span>` : ''}</div></div>
        <a class="icon-btn sm" href="#/treino/${t.id}" aria-label="Ver como aluno" title="Ver como o aluno vê">${I.eye}</a></div>
        <p class="small" style="margin:10px 0 0;color:var(--acc)">${ex.length ? `Executado ${ex.length} ${ex.length === 1 ? 'vez' : 'vezes'}, última execução ${fmtData(ex[0].iniciado_em)}` : 'O aluno ainda não executou este treino'}</p>
        <div class="grid3 tr-acoes"><a class="btn sm" href="#/aluno/${alunoId}/treino/${t.id}">Editar</a><a class="btn ghost sm" href="#/aluno/${alunoId}/cargas">${I.hist} Evolução</a><a class="btn ghost sm" href="#/aluno/${alunoId}/historico">${I.feed} Feedbacks</a></div></div>`;
            })
            .join('')
        : '<div class="empty"><div class="h3">Nenhum treino ainda</div><p class="small">Monte o primeiro treino deste aluno.</p></div>') +
      `<div class="grid2" style="margin-top:16px"><a class="btn" href="#/aluno/${alunoId}/treino/novo">${I.plus} Novo treino</a><button class="btn ghost" id="treino-modelo">${I.lib} Usar modelo</button></div></div></div>`;
  } else if (aba === 'historico') {
    corpo = sess.length
      ? sess
          .map((s) =>
            sessaoCard(s).replace(
              /<\/div><\/div>$/,
              `<a class="btn ghost sm" href="#/aluno/${alunoId}/conversa/${s.id}" style="margin-top:12px">${I.feed} Responder</a></div></div>`,
            ),
          )
          .join('')
      : '<div class="empty"><div class="h3">Sem treinos registrados</div><p class="small">Os check-ins do aluno aparecem aqui.</p></div>';
  } else if (aba === 'cargas') {
    grupos = agruparCargas(await buscarRegistros(alunoId));
    corpo = `<div id="cargas">${cargasHTML(grupos, true)}</div>`;
  } else if (aba === 'avaliacoes') {
    corpo =
      `<a class="list-item" href="#/checkup/${alunoId}" style="color:inherit;margin-bottom:12px"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Check-up do Corredor</b><div class="small muted">Avaliação de entrada e saída de cada ciclo</div></div>${I.chev}</a>` +
      avaliacoesHTML(await buscarAvaliacoes(alunoId), alunoId, true);
  } else if (aba === 'conversa') {
    corpo = '<div id="conv"></div>';
  } else if (aba === 'corrida') {
    corpo = '<div id="corr"></div>';
  } else if (aba === 'fotos') {
    corpo = '<div id="fotos"></div>';
  } else if (aba === 'energia') {
    corpo = '<div id="saude-at" class="stack"></div>';
  } else if (aba === 'saude') {
    termo =
      (
        await sb
          .from('nx_consentimentos')
          .select('versao,aceito_em,termo_riscos,responsavel_nome')
          .eq('org_id', S.org.id)
          .eq('aluno_id', alunoId)
          .order('aceito_em', { ascending: false })
          .limit(1)
      ).data?.[0] || null;
    corpo = `<div id="saude">${anamneseResumoHTML(anamnese, termo)}</div>`;
  } else {
    corpo = `<form class="card" id="f-dados">
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(m.nome)}" required></label>
      <div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${esc(MASCARA.tel(m.telefone || ''))}"></label><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(m.nascimento)}"></label></div>
      <label class="field"><span>Apelido (usado nos avisos do app)</span><input class="input" name="apelido" maxlength="30" value="${esc(m.apelido || '')}" placeholder="Ex.: Nando, Beth, Jade. Em branco usa o primeiro nome"></label>
      <label class="field"><span>Objetivo</span><input class="input" name="objetivo" value="${esc(m.objetivo || '')}"></label>
      <label class="field"><span>Observações de saúde / restrições</span><textarea class="textarea" name="observacoes">${esc(m.observacoes || '')}</textarea></label>
      <button class="btn block">Salvar dados</button></form>
      <div class="card"><b>Acesso ao app</b><p class="small muted" style="margin:4px 0 12px">Login: ${esc(m.email || '')}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" id="reset-senha">Gerar nova senha</button><button class="btn ${m.ativo ? 'danger' : ''} sm" id="ativo">${m.ativo ? 'Desativar aluno' : 'Reativar aluno'}</button></div>
        <p class="tiny dim" style="margin-top:12px">Aluno desativado não consegue ver os treinos, mas o histórico fica guardado.</p></div>`;
    planoInfo = await planoDoAlunoHTML(m);
    const eqD = await carregarEquipe();
    corpo =
      `<div class="card"><b>Treinador responsável</b><p class="small muted" style="margin:4px 0 10px">É quem tem a obrigação de acompanhar e responder este aluno. Os outros treinadores também podem responder, se quiserem. O aluno vê o responsável na conversa.</p>
      <select class="select" id="resp"><option value="">Sem responsável</option>${eqD.map((p) => `<option value="${p.user_id}" ${p.user_id === m.treinador_id ? 'selected' : ''}>${esc(p.nome)}${p.user_id === S.user.id ? ' (você)' : ''}</option>`).join('')}</select></div>
      <div class="card" id="mods-card"><b>O que o aluno faz com a Nexos</b><p class="small muted" style="margin:4px 0 10px">O app do aluno mostra só o que estiver marcado.</p>${modsHTML(m.modalidades)}</div>` +
      planoInfo.html +
      corpo;
  }
  const secAtual = SECOES.find((x) => x[0] === aba);
  const cabecalho = `
    <a class="back" href="#/alunos">${I.back} Meus Atletas</a>
    <div class="row" style="gap:16px">${avAluno(m, 'lg ' + (ultT && diasDesde(ultT) <= 3 ? 'st-ok' : ultT && diasDesde(ultT) <= 7 ? 'st-warn' : ''))}
      <div class="grow"><h1 class="h2">${esc(m.nome)}</h1><div class="small muted">${m.objetivo ? esc(m.objetivo) : 'Sem objetivo cadastrado'}</div>
      <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">${ultT ? `<span class="tag">Último treino ${quando(ultT)}</span>` : '<span class="tag">Ainda não treinou</span>'}${(m.modalidades || []).length === 1 ? `<span class="tag acc">Só ${MODS.find((x) => x[0] === m.modalidades[0])[1].toLowerCase()}</span>` : ''}${!m.ativo ? '<span class="tag warn">Inativo</span>' : ''}${m.telefone ? `<a class="tag ok" href="https://wa.me/55${esc(String(m.telefone).replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div></div></div>
    ${m.observacoes || (anamnese && anamnese.parq_positivo) ? `<div class="card" style="margin-top:16px;border-color:rgba(255,207,92,.3)"><span class="eyebrow" style="color:var(--warn)">Atenção</span>${anamnese && anamnese.parq_positivo ? `<p class="small" style="margin-top:4px">${icT(I.alerta, 'warn')}PAR-Q com resposta "sim". <a href="#/aluno/${alunoId}/saude">Ver ficha de saúde</a></p>` : ''}${m.observacoes ? `<p class="small" style="margin-top:4px">${esc(m.observacoes)}</p>` : ''}</div>` : ''}
`;
  const planHead = () => `<a class="back" href="#/alunos">${I.back} Meus Atletas</a>
      <div class="card plan-head"><div class="ph-id">${avAluno(m, 'lg')}<div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><h1 class="h2">${esc(m.nome)}</h1><a class="tag" href="#/aluno/${alunoId}">Ficha completa ${I.chev}</a><a class="tag acc" data-ficha-ins="${alunoId}" hidden>Ficha de inscrição ✎</a>${(setTimeout(() => preencherFichaIns(alunoId), 0), '')}</div>
        <div class="small muted">Objetivo: ${m.objetivo ? esc(m.objetivo) : '<a href="#/aluno/' + alunoId + '/dados">definir objetivo</a>'}</div>
        <button type="button" class="disp-res" id="disp-ed">${dispResumo(m) ? `Dias de treino: ${dispResumo(m)}` : `+ Marcar dias de treino ${selo('corrida', 'sm')} ${selo('forca', 'sm')}`} <span class="dim">· editar</span></button>${cicloA ? cicloLinhaHTML(cicloA, true) : ''}</div></div>
        ${provaProxA ? `<div class="ph-ev"><span class="tiny dim">Próximo evento</span><b>${icT(I.flag)}${esc(provaProxA.titulo)}</b><span class="small">${fmtCurto(provaProxA.data + 'T12:00:00')}${provaProxA.distancia ? ' · ' + esc(provaProxA.distancia) : ''} · ${faltam(provaProxA.data)}</span></div>` : ''}</div>
      ${fM && fC ? `<div class="subtabs mod-tabs" style="margin-top:12px"><a class="${aba === 'corrida' ? 'on' : ''}" href="#/aluno/${alunoId}/corrida">${I.run} Corrida</a><a class="${aba === 'forca' ? 'on' : ''}" href="#/aluno/${alunoId}/forca">${I.lib} Força</a></div>` : ''}`;
  $app.innerHTML =
    aba === 'inicio'
      ? cabecalho + `<div class="stack" style="margin-top:16px">${corpo}</div>`
      : aba === 'corrida' || aba === 'forca'
        ? planHead() + `<div class="stack" style="margin-top:12px">${corpo}</div>`
        : `<a class="back" href="#/aluno/${alunoId}">${I.back} ${esc(m.nome)}</a>
      <div class="sec-tit"><span class="st-ic">${secAtual ? secAtual[2] : I.user}</span><div><p class="eyebrow">${esc(firstName(m.nome))}</p><h1 class="h2">${secAtual ? secAtual[1] : 'Aluno'}</h1></div></div>
      <div class="stack">${corpo}</div>`;
  if (aba === 'cargas') bindCargas(document.getElementById('cargas'), grupos);
  if (aba === 'energia') viewSaudeAtleta(document.getElementById('saude-at'), m).catch((e) => console.error(e));
  // aviso no início da ficha quando aparecem 2 ou mais sinais de baixa energia
  if (aba === 'inicio')
    sinaisEnergia([alunoId])
      .then((r) => {
        const x = r[alunoId],
          el = document.getElementById('energia-al');
        if (!x || x.n < 2 || !el) return;
        el.innerHTML = `<a class="card sa-aviso" href="#/aluno/${alunoId}/energia" style="color:inherit"><span class="sa-ic">${ENERGIA_IC}</span><span class="sa-txt"><b>${x.n} sinais de baixa energia</b><span>Veja em Saúde da atleta o que apareceu e o que fazer</span></span>${I.chev}</a>`;
      })
      .catch(() => {});
  const tm = document.getElementById('treino-modelo');
  if (tm)
    tm.onclick = () =>
      escolherModeloTreino(async (md) => {
        try {
          const ex = treinos.length;
          const t0 = {
            titulo: 'Treino ' + String.fromCharCode(65 + ex),
            foco: md.foco || '',
            observacoes: md.observacoes || '',
            itens: md.itens || [],
          };
          await aplicarTreinoAlunos(t0, [alunoId], true);
          toast(`“${md.nome}” aplicado como ${t0.titulo}.`);
          staffAluno(alunoId, 'treinos');
        } catch (err) {
          console.error(err);
          toast('Não foi possível aplicar o modelo.', true);
        }
      });
  if (aba === 'conversa') await viewConversa(alunoId, document.getElementById('conv'), true, extra);
  if (aba === 'fotos') await viewFotos(alunoId, document.getElementById('fotos'), true);
  const dispEd = document.getElementById('disp-ed');
  if (dispEd) dispEd.onclick = () => editarDisponibilidade(m, () => silencioso(() => staffAluno(alunoId, aba)));
  if (aba === 'corrida') await viewCorridaPainel(alunoId, document.getElementById('corr'), true, m);
  if (aba === 'relmes') await relatorioMes(alunoId, document.getElementById('relm'), true, m);
  if (aba === 'inicio') {
    metaBox(document.getElementById('meta-al'), alunoId, m, { staff: true });
    const rg = document.getElementById('al-resg');
    if (rg) rg.onclick = () => abrirResgate(m, +rg.dataset.dias, () => {});
  }
  if (aba === 'forca') {
    const fst = S.cache.fsem;
    const re = () => silencioso(() => staffAluno(alunoId, 'forca'));
    document.getElementById('fs-a').onclick = () => {
      fst.off -= 1;
      re();
    };
    document.getElementById('fs-p').onclick = () => {
      fst.off += 1;
      re();
    };
    const fh = document.getElementById('fs-h');
    if (fh)
      fh.onclick = () => {
        fst.off = 0;
        re();
      };
    const salvarDias = async (t, dias) => {
      const { error } = await sb
        .from('nx_treinos')
        .update({ dias: dias.length ? dias.sort() : null })
        .eq('id', t.id);
      if (error) return toast('Não foi possível salvar.', true);
      re();
    };
    const iniFs = inicioSemana();
    iniFs.setDate(iniFs.getDate() + fst.off * 7);
    const segF = isoDia(iniFs);
    const fl = document.getElementById('f-liberar');
    if (fl)
      fl.onclick = async () => {
        fl.disabled = true;
        // mesma conferência da corrida: semana distante ou semana anterior ainda em rascunho
        const fimF = dia(segF);
        fimF.setDate(fimF.getDate() + 6);
        const antesF = async () => {
          const hoje0 = isoDia(inicioSemana());
          const { data } = await sb
            .from('nx_forca_semanas')
            .select('semana')
            .eq('aluno_id', alunoId)
            .gte('semana', hoje0)
            .lt('semana', segF);
          const lib = new Set((data || []).map((x) => x.semana));
          const out = [];
          for (const d = dia(hoje0); isoDia(d) < segF; d.setDate(d.getDate() + 7))
            if (!lib.has(isoDia(d))) out.push(isoDia(d));
          return out;
        };
        if (!(await confirmarLiberacao(alunoId, segF, isoDia(fimF), fst.off, antesF))) {
          fl.disabled = false;
          return;
        }
        const { error } = await sb
          .from('nx_forca_semanas')
          .insert({ org_id: S.org.id, aluno_id: alunoId, semana: segF, liberado_por: S.user.id });
        if (error && !/duplicate/i.test(error.message || '')) {
          fl.disabled = false;
          return toast('Não foi possível liberar.', true);
        }
        notificarAluno('planilha_forca', alunoId);
        toast('Semana de força liberada! O aluno foi avisado.');
        re();
      };
    const fd = document.getElementById('f-desliberar');
    if (fd)
      fd.onclick = async () => {
        if (!confirm('Cancelar a liberação? O aluno deixa de ver os treinos de força desta semana.')) return;
        await sb.from('nx_forca_semanas').delete().eq('aluno_id', alunoId).eq('semana', segF);
        toast('Liberação cancelada. A semana voltou a ser rascunho.');
        re();
      };
    $app.querySelectorAll('[data-fase]').forEach(
      (b) =>
        (b.onclick = async () => {
          const f = b.dataset.fase;
          const { error } = f
            ? await sb
                .from('nx_forca_fases')
                .upsert(
                  { org_id: S.org.id, aluno_id: alunoId, semana: segF, fase: f, criado_por: S.user.id },
                  { onConflict: 'aluno_id,semana' },
                )
            : await sb.from('nx_forca_fases').delete().eq('aluno_id', alunoId).eq('semana', segF);
          if (error) {
            console.error(error);
            return toast('Não foi possível salvar a fase.', true);
          }
          toast(f ? `Semana de ${FASES_F[f].n.toLowerCase()}.` : 'Fase removida.');
          re();
        }),
    );
    const salvarOff = async (lista) => {
      const nv = { ...dispDe(m), off_forca: lista };
      const { error } = await sb
        .from('nx_membros')
        .update({ disponibilidade: nv })
        .eq('org_id', S.org.id)
        .eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.disponibilidade = nv;
      re();
    };
    $app
      .querySelectorAll('[data-froff]')
      .forEach((b) => (b.onclick = () => salvarOff((dispDe(m).off_forca || []).filter((d) => d !== +b.dataset.froff))));
    $app.querySelectorAll('[data-frm]').forEach(
      (b) =>
        (b.onclick = (e) => {
          e.preventDefault();
          const t = treinos.find((x) => x.id === b.dataset.frm);
          salvarDias(
            t,
            (t.dias || []).filter((d) => d !== +b.dataset.d),
          );
        }),
    );
    $app.querySelectorAll('[data-fadd]').forEach(
      (b) =>
        (b.onclick = () => {
          const d = +b.dataset.fadd;
          const at = treinos.filter((t) => t.ativo);
          openSheet(
            `<p class="eyebrow">${DSEM[d]}</p><div class="h2" style="margin-top:4px">Qual treino neste dia?</div><p class="small muted" style="margin-top:4px">Vale para todas as semanas, até você mudar.</p>
        <div class="stack" style="margin-top:12px"><button class="list-item off-op" data-off="1" style="width:100%;text-align:left"><span class="off-ic lg">${OFF_IC}</span><div class="grow"><b>Day off</b><div class="small muted">Dia de descanso de força</div></div>${(dispDe(m).off_forca || []).includes(d) ? '<span class="tag ok">já está</span>' : `<span class="add-ic">${I.plus}</span>`}</button>${at.map((t, i) => `<button class="list-item" data-esc="${t.id}" style="width:100%;text-align:left"><div class="wletter sm">${esc(letraTreino(t, i))}</div><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(t.titulo)}</b><div class="small muted ellip">${t.foco ? esc(t.foco) + ' · ' : ''}${diasTxt(t.dias) || 'sem dia fixo'}</div></div>${(t.dias || []).includes(d) ? '<span class="tag ok">já está</span>' : `<span class="add-ic">${I.plus}</span>`}</button>`).join('') || '<p class="small muted">O aluno ainda não tem treinos de força.</p>'}</div>
        <a class="btn ghost block" href="#/aluno/${alunoId}/treino/novo" style="margin-top:12px">${I.plus} Criar treino novo</a>`,
            (r) => {
              r.querySelector('[data-off]').onclick = () => {
                closeSheet();
                const l = dispDe(m).off_forca || [];
                if (!l.includes(d)) salvarOff([...l, d]);
              };
              r.querySelectorAll('[data-esc]').forEach(
                (x) =>
                  (x.onclick = () => {
                    const t = treinos.find((y) => y.id === x.dataset.esc);
                    closeSheet();
                    if ((t.dias || []).includes(d)) return;
                    salvarDias(t, [...(t.dias || []), d]);
                  }),
              );
            },
          );
        }),
    );
  }
  if (aba === 'saude') {
    if (anamnese && !anamnese.visto_treinador)
      sb.from('nx_anamneses')
        .update({ visto_treinador: true })
        .eq('id', anamnese.id)
        .then(() => {});
    const ed = document.getElementById('editar-ana');
    const abrirEd = () =>
      viewAnamnese({
        alunoId,
        anamnese,
        box: document.getElementById('saude'),
        onSave: () => staffAluno(alunoId, 'saude'),
      });
    bindAtestado(document.getElementById('saude'), anamnese, alunoId);
    if (ed) ed.onclick = abrirEd;
    else {
      const sd = document.getElementById('saude');
      sd.insertAdjacentHTML(
        'beforeend',
        '<button class="btn ghost block" id="preencher-ana" style="margin-top:12px">Preencher a ficha com o aluno</button>',
      );
      sd.querySelector('#preencher-ana').onclick = abrirEd;
    }
    Promise.all([prontStaffHTML(m), aguaStaffHTML(m), dadosSugestoes([m.user_id], 7).catch(() => [])])
      .then(([hp, ha, sg]) => {
        const sd = document.getElementById('saude');
        if (!sd) return;
        sd.insertAdjacentHTML(
          'afterbegin',
          `<div id="sug-al">${sg.map((x) => sugCardHTML(x, false)).join('')}</div>` +
            hp +
            ha +
            `<a class="list-item" href="#/antes-depois/${m.user_id}" style="color:inherit;margin-bottom:14px"><span class="ativ-ic">${I.hist}</span><div class="grow"><b>Antes e depois</b><div class="small muted">Primeiro mês contra agora e o seu recado para o aluno</div></div>${I.chev}</a>`,
        );
        bindAguaStaff(m);
        bindSugestoes(sd.querySelector('#sug-al'), sg);
      })
      .catch((e) => console.error(e));
  }
  if (aba === 'historico' && sess.some((s) => !s.visto_treinador)) {
    sb.from('nx_sessoes')
      .update({ visto_treinador: true })
      .eq('aluno_id', alunoId)
      .eq('org_id', S.org.id)
      .eq('visto_treinador', false)
      .then(() => contarNaoVistos().then(dockStaff));
  }
  if (aba === 'dados') {
    const rs = document.getElementById('resp');
    rs.onchange = async () => {
      const { error } = await sb
        .from('nx_membros')
        .update({ treinador_id: rs.value || null })
        .eq('org_id', S.org.id)
        .eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.treinador_id = rs.value || null;
      toast(
        rs.value
          ? `Responsável: ${rs.options[rs.selectedIndex].text.replace(' (você)', '')}`
          : 'Aluno sem responsável.',
      );
    };
    const mc = document.getElementById('mods-card');
    mc.onchange = async () => {
      const sel = [...mc.querySelectorAll('input:checked')].map((i) => i.value);
      if (!sel.length) {
        toast('Marque pelo menos uma modalidade.', true);
        return staffAluno(alunoId, 'dados');
      }
      const { error } = await sb
        .from('nx_membros')
        .update({ modalidades: sel })
        .eq('org_id', S.org.id)
        .eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.modalidades = sel;
      toast(`Agora o aluno vê: ${sel.map((k) => MODS.find((x) => x[0] === k)[1]).join(' e ')}.`);
    };
    if (planoInfo) bindPlanoDoAluno(m, planoInfo, () => staffAluno(alunoId, 'dados'));
    document.getElementById('f-dados').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const upd = {
        nome: f.nome.value.trim(),
        apelido: f.apelido.value.trim().slice(0, 30) || null,
        telefone: f.telefone.value.trim() || null,
        nascimento: dataISO(f.nascimento.value) || null,
        objetivo: f.objetivo.value.trim() || null,
        observacoes: f.observacoes.value.trim() || null,
      };
      const { error: er } = await sb.from('nx_membros').update(upd).eq('org_id', S.org.id).eq('user_id', alunoId);
      er ? toast('Não foi possível salvar.', true) : (toast('Dados salvos!'), staffAluno(alunoId, 'dados'));
    };
    document.getElementById('ativo').onclick = async () => {
      if (m.ativo && !confirm(`Desativar ${m.nome}? Ele deixa de acessar os treinos.`)) return;
      const { error: er } = await sb
        .from('nx_membros')
        .update({ ativo: !m.ativo })
        .eq('org_id', S.org.id)
        .eq('user_id', alunoId);
      er
        ? toast('Não foi possível alterar.', true)
        : (toast(m.ativo ? 'Aluno desativado.' : 'Aluno reativado!'), staffAluno(alunoId, 'dados'));
    };
    document.getElementById('reset-senha').onclick = async (e) => {
      const nova = gerarSenha();
      e.currentTarget.disabled = true;
      try {
        await chamarFuncao({ acao: 'senha', user_id: alunoId, senha: nova });
        mostrarCredenciais({ nome: m.nome, email: m.email, senha: nova, telefone: m.telefone }, false, true, 'senha');
      } catch (err) {
        toast(err.message, true);
      } finally {
        e.target.disabled = false;
      }
    };
  }
}

/* ---------- montar / editar treino ---------- */
async function carregarExercicios(force) {
  if (!S.cache.ex || force) {
    const cols =
      'id,nome,nome_en,grupo,categoria,equipamento,imagens,video_url,video_credito,com_audio,nivel,fonte,ref_externa,criado_por';
    let all = [],
      from = 0;
    for (;;) {
      const { data, error } = await sb
        .from('nx_exercicios')
        .select(cols)
        .eq('org_id', S.org.id)
        .order('nome')
        .range(from, from + 999);
      if (error) throw error;
      all = all.concat(data || []);
      if (!data || data.length < 1000) break;
      from += 1000;
    }
    S.cache.ex = all;
  }
  return S.cache.ex;
}

async function staffTreinoEditor(alunoId, treinoId, modo) {
  loading();
  const ehModelo = modo === 'modelo';
  const [exs, { data: aluno }] = await Promise.all([
    carregarExercicios(),
    ehModelo
      ? Promise.resolve({ data: null })
      : sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
  ]);
  let t = { titulo: '', foco: '', observacoes: '', ativo: true, itens: [] };
  const novo = !treinoId || treinoId === 'novo';
  if (ehModelo && !novo) {
    const { data } = await sb.from('nx_modelos_treino').select('*').eq('id', treinoId).maybeSingle();
    if (data)
      t = {
        id: data.id,
        titulo: data.nome,
        foco: data.foco || '',
        observacoes: data.observacoes || '',
        ativo: true,
        itens: clone(data.itens || []),
      };
  } else if (ehModelo) {
    t.titulo = '';
  } else if (!novo) {
    const { data, error } = await sb
      .from('nx_treinos')
      .select('*, nx_treino_itens(*)')
      .eq('id', treinoId)
      .maybeSingle();
    if (error) throw error;
    if (data)
      t = { ...data, itens: (data.nx_treino_itens || []).sort((a, b) => a.ordem - b.ordem).map((i) => ({ ...i })) };
  } else {
    const ex = await buscarTreinosDoAluno(alunoId);
    t.titulo = 'Treino ' + String.fromCharCode(65 + ex.length);
  }
  const exMap = Object.fromEntries(exs.map((e) => [e.id, e]));
  const voltar = ehModelo ? '#/treinos' : `#/aluno/${alunoId}/forca`;
  const draw = () => {
    $app.innerHTML = `
      <a class="back" href="${voltar}">${I.back} ${ehModelo ? 'Treinos' : esc(aluno?.nome || 'Aluno')}</a>
      <p class="eyebrow">${ehModelo ? (novo ? 'Novo modelo de treino' : 'Modelo de treino') : novo ? 'Novo treino' : 'Editar treino'}</p>${!ehModelo && novo ? `<button class="aviso-linha" id="usar-modelo">${I.lib}<span><b>Começar de um modelo pronto</b> e só ajustar</span>${I.chev}</button>` : ''}
      <div class="card" style="margin-top:12px">
        <div class="grid2"><label class="field"><span>${ehModelo ? 'Nome do modelo' : 'Nome do treino'}</span><input class="input" id="t-titulo" value="${esc(t.titulo)}" placeholder="${ehModelo ? 'Ex.: Hipertrofia A – inferiores' : 'Treino A'}"></label>
        <label class="field"><span>Foco</span><input class="input" id="t-foco" value="${esc(t.foco || '')}" placeholder="Ex.: Inferiores + core"></label></div>
        <label class="field"><span>Recado para o aluno (aparece no topo do treino)</span><textarea class="textarea" id="t-obs" placeholder="Ex.: aqueça 10 min na esteira antes">${esc(t.observacoes || '')}</textarea></label>
        <label class="row small" style="gap:10px;cursor:pointer;${ehModelo ? 'display:none' : ''}"><input type="checkbox" id="t-ativo" ${t.ativo ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--acc)"> Treino liberado para o aluno</label>
      </div>
      <div class="section"><div class="section-h"><h2 class="h2">Exercícios (${t.itens.length})</h2>${t.itens.length ? `<button class="link-btn small" id="exp-todos">${t.itens.every((x) => x._aberto) ? 'Recolher todos' : 'Expandir todos'}</button>` : slashes}</div>
        <div class="ex-lista" id="itens">${
          t.itens
            .map((it, i) => {
              const ex = exMap[it.exercicio_id] || { nome: '(exercício removido)' };
              const det = Array.isArray(it.series_det) && it.series_det.length ? it.series_det : null;
              const resumo = det
                ? esc(resumoDet(det))
                : [
                    it.series && it.repeticoes
                      ? `${it.series} × ${it.repeticoes}`
                      : it.series
                        ? `${it.series} séries`
                        : '',
                    it.carga,
                    it.descanso_seg ? `${it.descanso_seg}s` : '',
                  ]
                    .filter(Boolean)
                    .map(esc)
                    .join(' · ');
              if (!it._aberto)
                return `<div class="ex-li" data-i="${i}"><button type="button" class="ex-li-h" data-tg><span class="mono ex-n">${String(i + 1).padStart(2, '0')}</span>${exFig(ex, 'thumb')}<span class="grow ex-li-t"><b>${esc(ex.nome)}</b><small>${resumo || 'toque para definir séries e carga'}</small></span><span class="ex-chev">${I.chev}</span></button></div>`;
              return `<div class="ex-li aberto card" data-i="${i}"><button type="button" class="ex-li-h" data-tg><span class="mono ex-n">${String(i + 1).padStart(2, '0')}</span><span class="grow ex-li-t"><b>${esc(ex.nome)}</b><small>${esc(ex.grupo || '')}</small></span><span class="ex-chev up">${I.chev}</span></button>
            <div class="item-row" style="margin-top:12px"><div class="ex-fig-g">${exFig(ex, '')}</div>
            <div class="row" style="gap:6px;align-items:flex-start"><div class="reorder"><button type="button" data-mv="-1" aria-label="Subir">${I.up}</button><button type="button" data-mv="1" aria-label="Descer">${I.down}</button></div><button type="button" class="icon-btn" data-rm aria-label="Remover" style="width:36px;height:36px">${I.x}</button></div></div>
            ${
              det
                ? `<div class="ser-det"><div class="sd-h"><span></span><span class="tiny dim">Reps</span><span class="tiny dim">Carga</span><span class="tiny dim">Desc. (s)</span><span></span></div>${det.map((d, k) => `<div class="sd-l" data-k="${k}"><b class="mono">${k + 1}ª</b><input class="input c" data-d="reps" value="${esc(d.reps ?? '')}" placeholder="12"><input class="input c" data-d="carga" value="${esc(d.carga ?? '')}" placeholder="20 kg"><input class="input c" inputmode="numeric" data-d="desc" data-mask="num" value="${esc(d.desc ?? '')}" placeholder="60"><button type="button" class="sd-x" data-sdrm="${k}" aria-label="Remover série">${I.x}</button></div>`).join('')}
              <div class="sd-acoes"><button type="button" class="link-btn small" data-sdadd>${I.plus} Adicionar série</button><button type="button" class="link-btn small" data-sdoff style="color:var(--mute)">Voltar para séries iguais</button></div></div>`
                : `<div class="grid4" style="margin-top:12px">
              <label><span class="tiny dim">Séries</span><input class="input c" data-mask="num" data-max="2" inputmode="numeric" data-f="series" value="${esc(it.series ?? '')}" placeholder="3"></label>
              <label><span class="tiny dim">Reps</span><input class="input c" data-f="repeticoes" value="${esc(it.repeticoes ?? '')}" placeholder="12"></label>
              <label><span class="tiny dim">Carga</span><input class="input c" data-f="carga" value="${esc(it.carga ?? '')}" placeholder="20 kg"></label>
              <label><span class="tiny dim">Desc. (s)</span><input class="input c" data-mask="num" inputmode="numeric" data-f="descanso_seg" value="${esc(it.descanso_seg ?? '')}" placeholder="60"></label>
            </div><button type="button" class="link-btn small sd-on" data-sdon>Séries com carga ou reps diferentes (pirâmide, aquecimento)</button>`
            }
            ${semCarga({ ...it, nx_exercicios: ex }) ? '' : `<div class="rm-linha">${+it.rm_est > 0 ? `<span class="tag ok">Máximo estimado ${fmtKg(+it.rm_est)}</span><span class="tiny dim">a carga de cada fase sai daqui</span>` : ''}<button type="button" class="link-btn small" data-rmteste>${+it.rm_est > 0 ? 'Refazer o cálculo' : 'Não sabe a carga do aluno?'}</button></div>`}
            <input class="input" data-f="observacao" value="${esc(it.observacao ?? '')}" placeholder="Observação (opcional): ex. cadência 3-1-1" style="margin-top:8px"></div>`;
            })
            .join('') ||
          '<div class="empty"><div class="h3">Nenhum exercício</div><p class="small">Adicione da sua biblioteca.</p></div>'
        }</div>
        <button class="btn ghost block" id="add-ex" style="margin-top:12px">${I.plus} Adicionar exercício</button>
      </div>
      <div class="section"><button class="btn block" id="salvar">${ehModelo ? 'Salvar modelo' : 'Salvar treino'} ${I.check}</button>
      <div class="acoes-extra">${ehModelo ? `<button class="btn ghost" id="aplicar">${I.users} Aplicar a alunos</button>` : `<button class="btn ghost" id="enviar-outros">${I.users} Enviar para outros alunos</button><button class="btn ghost" id="salvar-modelo">${I.lib} Salvar como modelo</button>`}</div>
      ${novo ? '' : `<button class="link-btn small" id="excluir" style="margin-top:14px;color:var(--err)">${ehModelo ? 'Excluir modelo' : 'Excluir treino'}</button>`}</div>`;
  };
  const syncCampos = () => {
    t.titulo = document.getElementById('t-titulo').value;
    t.foco = document.getElementById('t-foco').value;
    t.observacoes = document.getElementById('t-obs').value;
    t.ativo = document.getElementById('t-ativo').checked;
    document.querySelectorAll('[data-i]').forEach((card) => {
      const it = t.itens[+card.dataset.i];
      card.querySelectorAll('[data-f]').forEach((inp) => {
        it[inp.dataset.f] = inp.value;
      });
      card.querySelectorAll('.sd-l').forEach((l) => {
        const d = it.series_det && it.series_det[+l.dataset.k];
        if (d)
          l.querySelectorAll('[data-d]').forEach((inp) => {
            d[inp.dataset.d] = inp.value;
          });
      });
    });
  };
  draw();
  $app.onclick = async (e) => {
    const card = e.target.closest('[data-i]');
    if (card && e.target.closest('[data-mv]')) {
      syncCampos();
      const i = +card.dataset.i,
        j = i + +e.target.closest('[data-mv]').dataset.mv;
      if (j < 0 || j >= t.itens.length) return;
      [t.itens[i], t.itens[j]] = [t.itens[j], t.itens[i]];
      draw();
      return;
    }
    if (card && e.target.closest('[data-rm]')) {
      syncCampos();
      t.itens.splice(+card.dataset.i, 1);
      draw();
      return;
    }
    if (card && e.target.closest('[data-tg]')) {
      syncCampos();
      const it = t.itens[+card.dataset.i];
      it._aberto = !it._aberto;
      draw();
      const el = document.querySelector(`[data-i="${card.dataset.i}"]`);
      if (el && it._aberto) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (card && e.target.closest('[data-rmteste]')) {
      syncCampos();
      return testeCargaSheet(t.itens[+card.dataset.i], exMap[t.itens[+card.dataset.i].exercicio_id], !ehModelo, draw);
    }
    if (card && e.target.closest('[data-sdon]')) {
      syncCampos();
      const it = t.itens[+card.dataset.i];
      const n = Math.max(1, numInt(it.series) || 3);
      it.series_det = Array.from({ length: n }, () => ({
        reps: it.repeticoes || '',
        carga: it.carga || '',
        desc: it.descanso_seg || '',
      }));
      draw();
      return;
    }
    if (card && e.target.closest('[data-sdadd]')) {
      syncCampos();
      const it = t.itens[+card.dataset.i];
      const ult = it.series_det[it.series_det.length - 1] || {};
      it.series_det.push({ ...ult });
      draw();
      return;
    }
    if (card && e.target.closest('[data-sdrm]')) {
      syncCampos();
      const it = t.itens[+card.dataset.i];
      it.series_det.splice(+e.target.closest('[data-sdrm]').dataset.sdrm, 1);
      if (!it.series_det.length) it.series_det = null;
      draw();
      return;
    }
    if (card && e.target.closest('[data-sdoff]')) {
      syncCampos();
      const it = t.itens[+card.dataset.i];
      const d0 = it.series_det[0] || {};
      it.series = it.series_det.length;
      it.repeticoes = d0.reps || '';
      it.carga = d0.carga || '';
      it.descanso_seg = d0.desc || '';
      it.series_det = null;
      draw();
      return;
    }
    if (e.target.closest('#exp-todos')) {
      syncCampos();
      const abrir = !t.itens.every((x) => x._aberto);
      t.itens.forEach((x) => (x._aberto = abrir));
      draw();
      return;
    }
    if (e.target.closest('#add-ex')) {
      syncCampos();
      escolherExercicio(exs, (ex) => {
        exMap[ex.id] = ex;
        t.itens.push({
          exercicio_id: ex.id,
          series: 3,
          repeticoes: '12',
          carga: '',
          descanso_seg: 60,
          observacao: '',
          _aberto: true,
        });
        draw();
        toast(`${ex.nome} adicionado`);
      });
      return;
    }
    if (e.target.closest('#usar-modelo')) {
      syncCampos();
      return escolherModeloTreino((md) => {
        t.foco = md.foco || t.foco;
        t.observacoes = md.observacoes || t.observacoes;
        t.itens = clone(md.itens || []);
        draw();
        toast(`Modelo “${md.nome}” carregado. Ajuste o que quiser.`);
      });
    }
    if (e.target.closest('#salvar-modelo')) {
      syncCampos();
      if (!t.itens.length) return toast('Adicione exercícios antes.', true);
      return salvarComoModelo(t);
    }
    if (e.target.closest('#enviar-outros') || e.target.closest('#aplicar')) {
      syncCampos();
      if (!t.itens.length) return toast('Adicione exercícios antes.', true);
      if (!t.titulo.trim()) return toast('Dê um nome ao treino.', true);
      return escolherAlunos(
        ehModelo ? null : alunoId,
        ehModelo ? 'Aplicar modelo a alunos' : 'Enviar este treino para',
        async (ids, avisar) => {
          const n = await aplicarTreinoAlunos(t, ids, avisar);
          toast(`Treino enviado para ${n} aluno${n > 1 ? 's' : ''}!`);
        },
      );
    }
    if (ehModelo && e.target.closest('#salvar')) {
      syncCampos();
      if (!t.titulo.trim()) return toast('Dê um nome ao modelo.', true);
      const btn = e.target.closest('#salvar');
      btn.disabled = true;
      const row = {
        nome: t.titulo.trim(),
        foco: t.foco.trim() || null,
        observacoes: t.observacoes.trim() || null,
        itens: itensLimpos(t.itens),
        atualizado_em: new Date().toISOString(),
      };
      const { error } = t.id
        ? await sb.from('nx_modelos_treino').update(row).eq('id', t.id)
        : await sb.from('nx_modelos_treino').insert({ ...row, org_id: S.org.id, criado_por: S.user.id });
      if (error) {
        btn.disabled = false;
        return toast('Não foi possível salvar o modelo.', true);
      }
      toast('Modelo salvo!');
      location.hash = '#/treinos';
      return;
    }
    if (ehModelo && e.target.closest('#excluir')) {
      if (!confirm('Excluir este modelo? Os treinos já enviados aos alunos continuam.')) return;
      const { error } = await sb.from('nx_modelos_treino').delete().eq('id', t.id);
      error ? toast('Não foi possível excluir.', true) : (toast('Modelo excluído.'), (location.hash = '#/treinos'));
      return;
    }
    if (e.target.closest('#salvar')) {
      syncCampos();
      if (!t.titulo.trim()) return toast('Dê um nome ao treino.', true);
      const btn = e.target.closest('#salvar');
      btn.disabled = true;
      try {
        const base = {
          titulo: t.titulo.trim(),
          foco: t.foco.trim() || null,
          observacoes: t.observacoes.trim() || null,
          ativo: t.ativo,
          atualizado_em: new Date().toISOString(),
        };
        let id = t.id;
        if (novo) {
          const ex = await buscarTreinosDoAluno(alunoId);
          const { data, error } = await sb
            .from('nx_treinos')
            .insert({ ...base, org_id: S.org.id, aluno_id: alunoId, ordem: ex.length, criado_por: S.user.id })
            .select('id')
            .single();
          if (error) throw error;
          id = data.id;
        } else {
          const { error } = await sb.from('nx_treinos').update(base).eq('id', id);
          if (error) throw error;
          const { error: e2 } = await sb.from('nx_treino_itens').delete().eq('treino_id', id);
          if (e2) throw e2;
        }
        const num = (v) => {
          const n = parseInt(String(v).replace(/\D/g, ''), 10);
          return Number.isFinite(n) ? n : null;
        };
        if (t.itens.length) {
          const { error } = await sb.from('nx_treino_itens').insert(
            t.itens.map((it, i) => ({
              treino_id: id,
              exercicio_id: it.exercicio_id,
              ordem: i,
              series: Array.isArray(it.series_det) && it.series_det.length ? it.series_det.length : num(it.series),
              series_det: detLimpo(it),
              repeticoes: String(it.repeticoes || '').trim() || null,
              carga: String(it.carga || '').trim() || null,
              descanso_seg: num(it.descanso_seg),
              observacao: String(it.observacao || '').trim() || null,
              rm_est: +it.rm_est > 0 ? +it.rm_est : null,
            })),
          );
          if (error) throw error;
        }
        if (t.ativo && t.itens.length) notificar('treino', id);
        toast('Treino salvo!');
        location.hash = `#/aluno/${alunoId}/forca`;
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        toast('Não foi possível salvar o treino.', true);
      }
      return;
    }
    if (e.target.closest('#excluir')) {
      if (!confirm('Excluir este treino? O histórico do aluno continua guardado.')) return;
      const { error } = await sb.from('nx_treinos').delete().eq('id', t.id);
      error
        ? toast('Não foi possível excluir.', true)
        : (toast('Treino excluído.'), (location.hash = `#/aluno/${alunoId}/forca`));
    }
  };
}

/* ---------- modelos de treino e envio para vários alunos ---------- */
const numInt = (v) => {
  const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};
const detLimpo = (it) =>
  Array.isArray(it.series_det) && it.series_det.length
    ? it.series_det.map((d) => ({
        reps: String(d.reps || '').trim() || null,
        carga: String(d.carga || '').trim() || null,
        desc: numInt(d.desc),
      }))
    : null;
const resumoDet = (det) => {
  const r = det.map((d) => d.reps).filter(Boolean);
  const c = det.map((d) => d.carga).filter(Boolean);
  return [
    `${det.length} séries`,
    r.length ? r.join('/') + ' reps' : '',
    c.length ? (c[0] === c[c.length - 1] ? c[0] : `${c[0]} → ${c[c.length - 1]}`) : '',
  ]
    .filter(Boolean)
    .join(' · ');
};
const itensLimpos = (itens) =>
  itens.map((it) => ({
    series_det: detLimpo(it),
    exercicio_id: it.exercicio_id,
    series: Array.isArray(it.series_det) && it.series_det.length ? it.series_det.length : numInt(it.series),
    repeticoes: String(it.repeticoes || '').trim() || null,
    carga: String(it.carga || '').trim() || null,
    descanso_seg: numInt(it.descanso_seg),
    observacao: String(it.observacao || '').trim() || null,
  }));
async function buscarModelosTreino() {
  const { data } = await sb.from('nx_modelos_treino').select('*').eq('org_id', S.org.id).order('nome');
  return data || [];
}
/** "Não sabe a carga do aluno?": explica a calibração no primeiro treino e calcula o RM a partir de um teste rápido */
function testeCargaSheet(it, ex, podeTeste, depois) {
  let rir = 2;
  const fases = [
    ['resistencia', 'Resistência', '15 repetições'],
    ['hipertrofia', 'Hipertrofia', '10 repetições'],
    ['forca', 'Força', '5 repetições'],
    ['potencia', 'Potência', 'rápido, 4 a 6 repetições'],
  ];
  openSheet(
    `<p class="eyebrow">${esc((ex && ex.nome) || 'Exercício')}</p><div class="h2" style="margin-top:4px">Não sabe a carga do aluno?</div>
    <p class="small muted" style="margin-top:6px">Sem problema. O teste de carga máxima (1RM) não é indicado para quem está começando. O app estima a carga máxima com uma série mais leve, que é o método usado hoje.</p>
    <div class="rmt-op"><b>1. Deixe a carga em branco</b><p>No primeiro treino, o app guia o aluno: aquecer, subir o peso aos poucos e fazer uma série de 6 a 10 repetições bem feitas. Ele anota o peso, as repetições e quantas ainda conseguiria fazer. A partir daí o app calcula as cargas sozinho, de acordo com a fase da semana, e reajusta a cada treino.</p></div>
    ${
      podeTeste
        ? `<div class="rmt-op"><b>2. Já fez um teste com ele? Calcule aqui</b><p>Use uma série de 3 a 10 repetições perto da falha.</p>
      <div class="grid2" style="margin-top:8px"><label class="field"><span>Peso (kg)</span><input class="input" id="rmt-kg" inputmode="decimal" data-mask="dec" data-int="3" data-casas="1" placeholder="ex. 40"></label><label class="field"><span>Repetições feitas</span><input class="input" id="rmt-reps" inputmode="numeric" data-mask="num" data-max="2" placeholder="ex. 8"></label></div>
      <div class="rir-q"><span>Quantas ainda conseguiria fazer?</span><div class="rir-ch" id="rmt-rir">${[0, 1, 2, 3, 4].map((n) => `<button type="button" data-v="${n}" class="${n === rir ? 'on' : ''}">${n === 4 ? '4+' : n}</button>`).join('')}</div></div>
      <div id="rmt-res" class="rmt-res"></div>
      <button class="btn block" id="rmt-ok" style="margin-top:12px" disabled>Usar este teste</button></div>`
        : '<p class="tiny dim" style="margin-top:10px">No modelo, deixe a carga em branco. O cálculo por teste é feito no treino de cada aluno.</p>'
    }
    ${+it.rm_est > 0 && podeTeste ? '<button class="link-btn small" id="rmt-tirar" style="margin-top:10px">Tirar o teste e deixar o aluno descobrir no primeiro treino</button>' : ''}
    <p class="tiny dim" style="margin-top:12px">Carga máxima estimada pela fórmula de Epley, com as repetições até a falha (feitas + as que sobravam). Fica precisa até umas 10 a 12 repetições somadas. Depois, a carga se ajusta pelo desempenho de cada treino (Larsen et al. 2021; Refalo et al. 2023).</p>`,
    (r) => {
      if (!podeTeste) return;
      let rm = null;
      const conta = () => {
        const kg = numCarga(r.querySelector('#rmt-kg').value),
          reps = parseInt(r.querySelector('#rmt-reps').value, 10);
        rm = rmEstimado(kg, reps, rir);
        const box = r.querySelector('#rmt-res');
        r.querySelector('#rmt-ok').disabled = !rm;
        if (!kg || !reps) return (box.innerHTML = '');
        if (!rm)
          return (box.innerHTML =
            '<p class="small" style="color:var(--warn)">Repetições demais para estimar bem. Use uma série de até 10 repetições, somando as que sobravam.</p>');
        box.innerHTML = `<p class="small">Máximo estimado: <b>${fmtKg(rm)}</b></p><div class="rmt-tab">${fases
          .map(([f, n, d]) => {
            const v = cargaDoAlvo(rm, ALVO_F[f]);
            return `<div><b>${n}</b><span>${d}</span><em>${fmtKg(Math.max(passoCarga(v), arred(v, passoCarga(v))))}</em></div>`;
          })
          .join('')}</div>`;
      };
      r.querySelector('#rmt-kg').oninput = conta;
      r.querySelector('#rmt-reps').oninput = conta;
      r.querySelector('#rmt-rir').onclick = (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        rir = +b.dataset.v;
        r.querySelectorAll('#rmt-rir [data-v]').forEach((x) => x.classList.toggle('on', x === b));
        conta();
      };
      r.querySelector('#rmt-ok').onclick = () => {
        if (!rm) return;
        it.rm_est = rm;
        closeSheet();
        toast('Teste guardado. Salve o treino para valer.');
        depois();
      };
      const tirar = r.querySelector('#rmt-tirar');
      if (tirar)
        tirar.onclick = () => {
          it.rm_est = null;
          closeSheet();
          depois();
        };
    },
  );
}
async function escolherModeloTreino(aoEscolher) {
  const mods = await buscarModelosTreino();
  openSheet(
    `<p class="eyebrow">Modelos de treino</p><div class="h2" style="margin-top:4px">Escolha um modelo</div>
    ${
      mods.length
        ? `<div class="stack" style="margin-top:16px" id="ml">${mods.map((m) => `<button class="list-item" data-m="${m.id}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.lib}</span><div class="grow"><b>${esc(m.nome)}</b><div class="small muted">${m.foco ? esc(m.foco) + ' · ' : ''}${(m.itens || []).length} exercícios</div></div>${I.chev}</button>`).join('')}</div>`
        : '<div class="empty" style="margin-top:16px"><div class="h3">Nenhum modelo ainda</div><p class="small">Monte um treino e toque em “Salvar como modelo”, ou crie em Exercícios → Modelos.</p></div>'
    }`,
    (r) => {
      const l = r.querySelector('#ml');
      if (l)
        l.onclick = (e) => {
          const b = e.target.closest('[data-m]');
          if (b) {
            closeSheet();
            aoEscolher(mods.find((m) => m.id === b.dataset.m));
          }
        };
    },
  );
}
function salvarComoModelo(t) {
  openSheet(
    `<p class="eyebrow">Salvar como modelo</p><form id="f-sm" style="margin-top:12px"><label class="field"><span>Nome do modelo</span><input class="input" name="nome" value="${esc(t.titulo)}${t.foco ? ' – ' + esc(t.foco) : ''}" required autofocus></label>
    <p class="tiny dim" style="margin:-4px 0 12px">O modelo fica em Exercícios → Modelos, pronto para usar com qualquer aluno.</p><button class="btn block">Salvar modelo</button></form>`,
    (r) => {
      r.querySelector('#f-sm').onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await sb.from('nx_modelos_treino').insert({
          org_id: S.org.id,
          nome: e.target.nome.value.trim(),
          foco: t.foco.trim() || null,
          observacoes: t.observacoes.trim() || null,
          itens: itensLimpos(t.itens),
          criado_por: S.user.id,
        });
        if (error) return toast('Não foi possível salvar o modelo.', true);
        closeSheet();
        toast('Modelo salvo na biblioteca!');
      };
    },
  );
}
async function escolherAlunos(excluir, titulo, aoConfirmar) {
  const { data } = await sb
    .from('nx_membros')
    .select('user_id,nome,objetivo,ativo,treinador_id')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .order('nome');
  const alunos = (data || []).filter((a) => a.ativo && a.user_id !== excluir && ehMeuAluno(a));
  const sel = new Set();
  let q = '';
  openSheet(
    `<p class="eyebrow">${esc(titulo)}</p><div class="h2" style="margin-top:4px">Escolha os alunos</div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="pa-q" placeholder="Buscar aluno"></div>
    <div class="row between" style="margin:10px 0 6px"><button class="link-btn small" id="pa-todos">Selecionar todos</button><span class="small muted" id="pa-n">nenhum selecionado</span></div>
    <div class="stack pa-lista" id="pa-l"></div>
    <label class="aceite" style="margin-top:8px"><input type="checkbox" id="pa-avisar" checked><span>Avisar os alunos por notificação</span></label>
    <button class="btn block" id="pa-ok" disabled>Enviar</button>`,
    (r) => {
      const draw = () => {
        const nq = semAcento(q);
        r.querySelector('#pa-l').innerHTML =
          alunos
            .filter((a) => !nq || semAcento(a.nome).includes(nq))
            .map(
              (a) =>
                `<label class="pa-item ${sel.has(a.user_id) ? 'on' : ''}"><input type="checkbox" data-a="${a.user_id}" ${sel.has(a.user_id) ? 'checked' : ''}><div class="av">${esc(initials(a.nome))}</div><div class="grow"><b>${esc(a.nome)}</b>${a.objetivo ? `<div class="tiny dim ellip">${esc(a.objetivo)}</div>` : ''}</div><span class="pa-check">${I.check}</span></label>`,
            )
            .join('') || '<p class="small muted">Nenhum aluno encontrado.</p>';
        const n = sel.size;
        r.querySelector('#pa-n').textContent = n ? `${n} selecionado${n > 1 ? 's' : ''}` : 'nenhum selecionado';
        const ok = r.querySelector('#pa-ok');
        ok.disabled = !n;
        ok.textContent = n ? `Enviar para ${n} aluno${n > 1 ? 's' : ''}` : 'Enviar';
      };
      draw();
      r.querySelector('#pa-q').oninput = (e) => {
        q = e.target.value;
        draw();
      };
      r.querySelector('#pa-l').onchange = (e) => {
        const c = e.target.closest('[data-a]');
        if (!c) return;
        c.checked ? sel.add(c.dataset.a) : sel.delete(c.dataset.a);
        draw();
      };
      r.querySelector('#pa-todos').onclick = () => {
        const todos = alunos.every((a) => sel.has(a.user_id));
        alunos.forEach((a) => (todos ? sel.delete(a.user_id) : sel.add(a.user_id)));
        draw();
      };
      r.querySelector('#pa-ok').onclick = async (e) => {
        e.currentTarget.disabled = true;
        e.currentTarget.textContent = 'Enviando…';
        try {
          await aoConfirmar([...sel], r.querySelector('#pa-avisar').checked);
          closeSheet();
        } catch (err) {
          console.error(err);
          toast('Não foi possível enviar.', true);
          draw();
        }
      };
    },
  );
}
async function aplicarTreinoAlunos(t, ids, avisar) {
  if (!ids.length) return 0;
  const { data: ex } = await sb.from('nx_treinos').select('aluno_id').eq('org_id', S.org.id).in('aluno_id', ids);
  const qtd = {};
  (ex || []).forEach((x) => {
    qtd[x.aluno_id] = (qtd[x.aluno_id] || 0) + 1;
  });
  const agora = new Date().toISOString();
  const { data: novos, error } = await sb
    .from('nx_treinos')
    .insert(
      ids.map((id) => ({
        org_id: S.org.id,
        aluno_id: id,
        titulo: t.titulo.trim(),
        foco: (t.foco || '').trim() || null,
        observacoes: (t.observacoes || '').trim() || null,
        ativo: true,
        ordem: qtd[id] || 0,
        criado_por: S.user.id,
        atualizado_em: agora,
      })),
    )
    .select('id,aluno_id');
  if (error) throw error;
  const limpos = itensLimpos(t.itens);
  const itens = [];
  (novos || []).forEach((n) => limpos.forEach((it, i) => itens.push({ ...it, treino_id: n.id, ordem: i })));
  if (itens.length) {
    const { error: e2 } = await sb.from('nx_treino_itens').insert(itens);
    if (e2) throw e2;
  }
  if (avisar) (novos || []).forEach((n) => notificar('treino', n.id));
  return (novos || []).length;
}

const semAcento = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
function filtrarEx(exs, g, q, eq) {
  const nq = semAcento(q).trim().split(/\s+/).filter(Boolean);
  return exs.filter(
    (e) =>
      (g === 'Todos' || e.grupo === g) &&
      (!eq || eq === 'Todos' || e.equipamento === eq) &&
      (!nq.length ||
        nq.every((w) => semAcento(e.nome + ' ' + (e.nome_en || '') + ' ' + (e.equipamento || '')).includes(w))),
  );
}
const LIM = 60;
/* ---------- biblioteca de exercícios: buscar, favoritar, criar (com foto, vídeo ou YouTube) ---------- */
const GRUPOS_MUSC = [
  'Abdômen',
  'Antebraço',
  'Bíceps',
  'Cardio',
  'Core',
  'Corrida/Educativo',
  'Costas',
  'Funcional',
  'Glúteos',
  'Mobilidade',
  'Alongamento',
  'Ombros',
  'Panturrilha',
  'Peito',
  'Pernas',
  'Pescoço',
  'Pliometria',
  'Posterior',
  'Tríceps',
];
const CATS_EX = [
  'Musculação',
  'Funcional',
  'Mobilidade',
  'Alongamento',
  'Aquecimento',
  'Pliometria',
  'Cardio',
  'Educativo de corrida',
];
const STAR = (on) =>
  `<svg viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`;
const ordenaPt = (l) => [...new Set(l.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
async function carregarFavoritos() {
  if (!S.cache.fav) {
    const { data } = await sb
      .from('nx_ex_favoritos')
      .select('exercicio_id')
      .eq('user_id', S.user.id)
      .then(
        (r) => r,
        () => ({ data: [] }),
      );
    S.cache.fav = new Set((data || []).map((x) => x.exercicio_id));
  }
  return S.cache.fav;
}
async function alternarFavorito(id) {
  const fav = await carregarFavoritos();
  const on = !fav.has(id);
  on ? fav.add(id) : fav.delete(id);
  const { error } = on
    ? await sb.from('nx_ex_favoritos').insert({ exercicio_id: id, org_id: S.org.id })
    : await sb.from('nx_ex_favoritos').delete().eq('user_id', S.user.id).eq('exercicio_id', id);
  if (error) {
    on ? fav.delete(id) : fav.add(id);
    toast('Não foi possível salvar o favorito.', true);
  }
  return fav.has(id);
}
const exMidia = (e) =>
  e.video_url
    ? ehVideoArquivo(e.video_url)
      ? 'video'
      : 'youtube'
    : (e.imagens || []).some((p) => /nx-exvideos/.test(p))
      ? 'foto'
      : 'nenhuma';
function exItemBib(e, fav, acao) {
  const md = exMidia(e);
  const tags = [e.grupo, e.categoria]
    .filter(Boolean)
    .map((t) => `<span class="pill">${esc(t)}</span>`)
    .join('');
  return `<div class="bib-it" data-ex="${e.id}">${exFig(e, 'thumb')}
    <div class="grow" style="min-width:0"><b class="ellip2">${esc(e.nome)}</b><div class="bib-tags">${tags}${md === 'video' || md === 'youtube' ? `<span class="pill acc">${I.play} vídeo</span>` : ''}</div></div>
    <button type="button" class="bib-star ${fav.has(e.id) ? 'on' : ''}" data-fav="${e.id}" aria-label="${fav.has(e.id) ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}">${STAR(fav.has(e.id))}</button>${acao}</div>`;
}
/** lista com abas (Todos, Favoritos, Meus), busca, grupo muscular e categoria. Usada na biblioteca e na hora de prescrever. */
function bibliotecaUI(box, exs, fav, { aoTocar, aoCriar, acao = '' }) {
  const st = S.cache.bibSt || (S.cache.bibSt = { aba: 'todos', g: '', c: '', q: '' });
  let n = LIM;
  const grupos = ordenaPt(exs.map((e) => e.grupo)),
    cats = ordenaPt([...CATS_EX, ...exs.map((e) => e.categoria)]);
  box.innerHTML = `<button type="button" class="bib-criar" data-criar>${I.plus} Criar exercício</button>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" data-q placeholder="Buscar exercícios…" value="${esc(st.q)}"></div>
    <div class="bib-abas">${[
      ['todos', 'Todos'],
      ['fav', 'Favoritos'],
      ['meus', 'Meus exercícios'],
    ]
      .map(([k, l]) => `<button type="button" data-aba="${k}" class="${st.aba === k ? 'on' : ''}">${l}</button>`)
      .join('')}</div>
    <div class="bib-filtros"><select class="select" data-g><option value="">Grupo muscular</option>${grupos.map((x) => `<option ${st.g === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <select class="select" data-c><option value="">Categoria</option>${cats.map((x) => `<option ${st.c === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <button type="button" class="link-btn small" data-limpar>Limpar</button></div>
    <p class="tiny dim" data-n style="margin-top:10px"></p><div class="bib-lista" data-l></div>`;
  const draw = () => {
    let l = filtrarEx(exs, st.g || 'Todos', st.q);
    if (st.c) l = l.filter((e) => e.categoria === st.c);
    if (st.aba === 'fav') l = l.filter((e) => fav.has(e.id));
    else if (st.aba === 'meus') l = l.filter((e) => e.criado_por === S.user.id);
    box.querySelector('[data-n]').textContent = `${l.length} exercício${l.length === 1 ? '' : 's'}`;
    const vazio =
      st.aba === 'fav'
        ? 'Toque na estrela de um exercício para ele aparecer aqui.'
        : st.aba === 'meus'
          ? 'Os exercícios que você criar aparecem aqui.'
          : 'Nada encontrado. Tente outro termo ou crie o exercício.';
    box.querySelector('[data-l]').innerHTML =
      (l
        .slice(0, n)
        .map((e) => exItemBib(e, fav, acao))
        .join('') || `<div class="empty"><p class="small">${vazio}</p></div>`) +
      (l.length > n
        ? `<button type="button" class="btn ghost block" data-mais style="margin-top:10px">Mostrar mais (${l.length - n})</button>`
        : '');
  };
  draw();
  box.querySelector('[data-q]').oninput = (e) => {
    st.q = e.target.value;
    n = LIM;
    draw();
  };
  box.querySelector('[data-g]').onchange = (e) => {
    st.g = e.target.value;
    n = LIM;
    draw();
  };
  box.querySelector('[data-c]').onchange = (e) => {
    st.c = e.target.value;
    n = LIM;
    draw();
  };
  box.onclick = async (e) => {
    if (e.target.closest('[data-criar]')) return aoCriar();
    if (e.target.closest('[data-limpar]')) {
      Object.assign(st, { g: '', c: '', q: '' });
      box.querySelector('[data-q]').value = '';
      box.querySelector('[data-g]').value = '';
      box.querySelector('[data-c]').value = '';
      n = LIM;
      return draw();
    }
    if (e.target.closest('[data-mais]')) {
      n += LIM;
      return draw();
    }
    const ab = e.target.closest('[data-aba]');
    if (ab) {
      st.aba = ab.dataset.aba;
      box.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('on', b === ab));
      n = LIM;
      return draw();
    }
    const fb = e.target.closest('[data-fav]');
    if (fb) {
      const on = await alternarFavorito(fb.dataset.fav);
      fb.classList.toggle('on', on);
      fb.innerHTML = STAR(on);
      if (st.aba === 'fav') draw();
      return;
    }
    const it = e.target.closest('[data-ex]');
    if (it) aoTocar(exs.find((x) => x.id === it.dataset.ex));
  };
}
async function escolherExercicio(exs, onPick) {
  const fav = await carregarFavoritos();
  const abrir = () =>
    openSheet(
      `<div class="h2" style="padding-right:44px">Biblioteca de exercícios</div><div id="bib-box" style="margin-top:14px"></div>`,
      (root) => {
        bibliotecaUI(root.querySelector('#bib-box'), exs, fav, {
          acao: `<span class="icon-btn" style="width:36px;height:36px;flex:none">${I.plus}</span>`,
          aoTocar: (ex) => {
            closeSheet();
            onPick(ex);
          },
          aoCriar: () =>
            formExercicio(null, {
              voltar: abrir,
              aoSalvar: (ex) => {
                exs.push(ex);
                exs.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
                closeSheet();
                onPick(ex);
              },
            }),
        });
      },
    );
  abrir();
}
/** corta um trecho do vídeo no próprio aparelho (sem servidor): toca o trecho num canvas e grava.
 *  Sai um clipe curto, leve e sem som, que o app toca em loop como um GIF. */
async function cortarVideo(src, ini, fim, aoProgresso) {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.crossOrigin = 'anonymous';
  v.preload = 'auto';
  v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0';
  document.body.appendChild(v);
  const url = src instanceof Blob ? URL.createObjectURL(src) : src;
  try {
    v.src = url;
    await new Promise((ok, erro) => {
      v.onloadedmetadata = ok;
      v.onerror = () => erro(new Error('vídeo'));
    });
    const k = Math.min(1, 720 / Math.max(v.videoWidth || 720, v.videoHeight || 720));
    const cv = document.createElement('canvas');
    cv.width = Math.round(((v.videoWidth || 720) * k) / 2) * 2;
    cv.height = Math.round(((v.videoHeight || 1280) * k) / 2) * 2;
    const ctx = cv.getContext('2d');
    const tipo = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(
      (t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t),
    );
    if (!tipo || !cv.captureStream) throw new Error('sem suporte');
    v.currentTime = ini;
    await new Promise((ok) => {
      v.onseeked = ok;
    });
    ctx.drawImage(v, 0, 0, cv.width, cv.height);
    const rec = new MediaRecorder(cv.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 2500000 });
    const partes = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) partes.push(e.data);
    };
    const fimRec = new Promise((ok) => {
      rec.onstop = ok;
    });
    rec.start(250);
    await v.play();
    await new Promise((ok) => {
      const passo = () => {
        ctx.drawImage(v, 0, 0, cv.width, cv.height);
        if (aoProgresso) aoProgresso(Math.min(1, (v.currentTime - ini) / (fim - ini)));
        if (v.currentTime >= fim || v.ended) {
          v.pause();
          ok();
          return;
        }
        v.requestVideoFrameCallback ? v.requestVideoFrameCallback(passo) : requestAnimationFrame(passo);
      };
      passo();
    });
    rec.stop();
    await fimRec;
    const mime = tipo.split(';')[0];
    return new File([new Blob(partes, { type: mime })], `trecho.${mime === 'video/mp4' ? 'mp4' : 'webm'}`, {
      type: mime,
    });
  } finally {
    if (src instanceof Blob) URL.revokeObjectURL(url);
    v.remove();
  }
}
const mmssC = (t) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}${t % 1 >= 0.05 ? ',' + Math.floor((t % 1) * 10) : ''}`;
/** painel de corte: prévia, começo/fim e atalhos de 5, 10 e 15 s. Devolve { ativo, ini, fim } atualizado */
function painelCorte(box, src, cortarPadrao) {
  const st = { ativo: false, ini: 0, fim: 0, dur: 0 };
  const url = src instanceof Blob ? URL.createObjectURL(src) : src;
  box.hidden = false;
  box.innerHTML = `<div class="corte-v"><video src="${esc(url)}" muted playsinline preload="metadata" crossorigin="anonymous"></video></div>
    <label class="aceite" style="margin-top:10px"><input type="checkbox" data-c="on"><span><b>Cortar o vídeo</b> (vira um trecho curto, em loop, como um GIF)</span></label>
    <div data-c="ctl" hidden>
      <div class="corte-faixa"><i data-c="sel"></i></div>
      <label class="corte-r"><span>Começa em <b data-c="ti">0:00</b></span><input type="range" data-c="ini" min="0" step="0.1" value="0"></label>
      <label class="corte-r"><span>Termina em <b data-c="tf">0:00</b></span><input type="range" data-c="fim" min="0" step="0.1" value="0"></label>
      <div class="row between" style="gap:8px;flex-wrap:wrap;margin-top:6px"><div class="row" style="gap:6px">${[5, 10, 15].map((n) => `<button type="button" class="chip" data-dur="${n}">${n} s</button>`).join('')}</div>
        <button type="button" class="btn ghost sm" data-c="ver">${I.play} Ver trecho</button></div>
      <p class="tiny dim" data-c="info" style="margin-top:8px"></p>
    </div>`;
  const v = box.querySelector('video'),
    q = (k) => box.querySelector(`[data-c="${k}"]`);
  const desenhar = () => {
    q('ti').textContent = mmssC(st.ini);
    q('tf').textContent = mmssC(st.fim);
    q('ini').value = st.ini;
    q('fim').value = st.fim;
    q('sel').style.left = (st.ini / st.dur) * 100 + '%';
    q('sel').style.width = ((st.fim - st.ini) / st.dur) * 100 + '%';
    q('info').textContent =
      `Trecho de ${(Math.round((st.fim - st.ini) * 10) / 10).toString().replace('.', ',')} s de um vídeo de ${mmssC(st.dur)}. O trecho fica sem som e leve para o aluno abrir rápido.`;
  };
  const ligar = (on) => {
    st.ativo = on;
    q('on').checked = on;
    q('ctl').hidden = !on;
    box.closest('form').querySelector('[name="sem_audio"]').closest('label').hidden = on;
  };
  v.onloadedmetadata = () => {
    st.dur = v.duration || 0;
    if (!isFinite(st.dur) || !st.dur) return;
    q('ini').max = st.dur;
    q('fim').max = st.dur;
    st.fim = Math.min(st.dur, 10);
    desenhar();
    ligar(cortarPadrao || st.dur > 20);
  };
  q('on').onchange = () => ligar(q('on').checked);
  q('ini').oninput = () => {
    st.ini = Math.min(+q('ini').value, st.dur - 1);
    if (st.fim <= st.ini + 1) st.fim = Math.min(st.dur, st.ini + 1);
    if (st.fim - st.ini > 30) st.fim = st.ini + 30;
    v.currentTime = st.ini;
    desenhar();
  };
  q('fim').oninput = () => {
    st.fim = Math.max(+q('fim').value, st.ini + 1);
    if (st.fim - st.ini > 30) st.ini = st.fim - 30;
    v.currentTime = st.fim;
    desenhar();
  };
  box.onclick = (e) => {
    const d = e.target.closest('[data-dur]');
    if (d) {
      st.fim = Math.min(st.dur, st.ini + +d.dataset.dur);
      desenhar();
      return;
    }
    if (e.target.closest('[data-c="ver"]')) {
      v.currentTime = st.ini;
      v.play().catch(() => {});
      const ate = () => {
        if (v.currentTime >= st.fim) {
          v.pause();
          v.currentTime = st.ini;
          return;
        }
        requestAnimationFrame(ate);
      };
      ate();
    }
  };
  return st;
}
async function enviarMidiaEx(file) {
  const ext =
    (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || file.type.split('/')[1] || 'bin';
  const path = `${S.org.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage
    .from('nx-exvideos')
    .upload(path, file, { contentType: file.type || undefined, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('nx-exvideos').getPublicUrl(path).data.publicUrl;
}
/** criar ou editar exercício. opts.aoSalvar recebe o exercício salvo; opts.voltar volta para a lista de onde veio */
async function formExercicio(exLista, opts = {}) {
  const novo = !exLista;
  let ex = {
    nome: '',
    grupo: '',
    categoria: '',
    equipamento: '',
    descricao: '',
    video_url: '',
    imagens: [],
    instrucoes: [],
    com_audio: false,
  };
  if (!novo) {
    const { data } = await sb.from('nx_exercicios').select('*').eq('id', exLista.id).maybeSingle();
    ex = data || exLista;
    if ((!ex.instrucoes || !ex.instrucoes.length) && ex.ref_externa) {
      try {
        const r = await fetch(imgURL(ex.ref_externa + '/info.json'));
        if (r.ok) ex.instrucoes = (await r.json()).instrucoes || [];
      } catch {}
    }
  }
  const fav = await carregarFavoritos();
  const passos = (ex.instrucoes && ex.instrucoes.length ? ex.instrucoes : ex.descricao ? [ex.descricao] : []).join(
    '\n',
  );
  const grupos = ordenaPt([...GRUPOS_MUSC, ...(S.cache.ex || []).map((e) => e.grupo), ex.grupo]);
  const cats = ordenaPt([...CATS_EX, ...(S.cache.ex || []).map((e) => e.categoria), ex.categoria]);
  const md0 = exMidia(ex);
  const MIDIAS = [
    ['nenhuma', 'Sem mídia'],
    ['foto', 'Foto ou GIF'],
    ['video', 'Vídeo do celular'],
    ['youtube', 'Link do YouTube'],
  ];
  openSheet(
    `
    ${opts.voltar ? `<button type="button" class="ex-voltar" id="ex-voltar">${I.back} Biblioteca</button>` : `<p class="eyebrow">${novo ? 'Biblioteca' : esc(ex.grupo || '')}</p>`}
    <div class="h2" style="margin-top:6px;padding-right:44px">${novo ? 'Criar exercício' : esc(ex.nome)}</div>
    ${novo ? '' : `${ex.imagens && ex.imagens.length ? exFig(ex, 'big') : ''}<div class="ex-detail">${exDetalhe(ex)}</div><div class="tabs" style="margin-top:16px"><button class="on" type="button">Editar</button></div>`}
    <form id="f-ex" style="margin-top:14px" novalidate>
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(ex.nome)}" ${novo ? 'autofocus' : ''} placeholder="Ex.: Agachamento búlgaro"></label>
      <label class="field"><span>Mídia</span><select class="select" name="midia">${MIDIAS.map(([k, l]) => `<option value="${k}" ${k === md0 ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="ex-midia" data-m="foto" hidden><div class="field"><span>Foto ou GIF</span><label class="arq-btn"><input type="file" name="foto" accept="image/jpeg,image/png,image/webp,image/gif"><b>Escolher arquivo</b><i>nenhum arquivo selecionado</i></label></div>
        ${md0 === 'foto' ? '<p class="tiny dim" style="margin-top:-6px">Já tem uma foto. Escolha outra só se quiser trocar.</p>' : ''}</div>
      <div class="ex-midia" data-m="video" hidden><div class="field"><span>Vídeo do celular</span><label class="arq-btn"><input type="file" name="video" accept="video/mp4,video/quicktime,video/webm"><b>Escolher arquivo</b><i>nenhum arquivo selecionado</i></label></div>
        ${md0 === 'video' ? '<p class="tiny dim" style="margin-top:-6px">Já tem um vídeo. Escolha outro só se quiser trocar, ou <button type="button" class="link-btn small" id="corte-atual">corte o vídeo atual</button>.</p>' : ''}
        <div class="corte" id="corte" hidden></div>
        <label class="aceite" style="margin-top:4px"><input type="checkbox" name="sem_audio" ${ex.com_audio ? '' : 'checked'}><span>Remover áudio (o vídeo toca sem som para o aluno)</span></label></div>
      <div class="ex-midia" data-m="youtube" hidden><label class="field"><span>Link do YouTube</span><input class="input" type="url" name="yt" value="${md0 === 'youtube' ? esc(ex.video_url) : ''}" placeholder="https://youtube.com/…"></label></div>
      <label class="field"><span>Grupo muscular</span><select class="select" name="grupo"><option value="">Selecione o grupo muscular</option>${grupos.map((x) => `<option ${x === ex.grupo ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><small class="campo-erro" data-err="grupo" hidden>Campo obrigatório</small></label>
      <label class="field"><span>Categoria</span><select class="select" name="categoria"><option value="">Selecione a categoria</option>${cats.map((x) => `<option ${x === ex.categoria ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <div class="field"><span>Adicionar aos favoritos</span><div class="radios"><label><input type="radio" name="fav" value="1" ${!novo && fav.has(ex.id) ? 'checked' : ''}><span>Sim</span></label><label><input type="radio" name="fav" value="0" ${novo || !fav.has(ex.id) ? 'checked' : ''}><span>Não</span></label></div></div>
      <details class="ex-mais"${!novo && (passos || ex.equipamento) ? ' open' : ''}><summary>Mais detalhes (opcional)</summary>
        <label class="field" style="margin-top:10px"><span>Equipamento</span><input class="input" name="equipamento" value="${esc(ex.equipamento || '')}" placeholder="Halteres, elástico, peso do corpo…"></label>
        <label class="field"><span>Como executar (um passo por linha)</span><textarea class="textarea" name="instrucoes" rows="4" placeholder="Pés na largura dos ombros&#10;Desça com o quadril para trás">${esc(passos)}</textarea></label></details>
      <button class="btn block" id="ex-salvar">Salvar</button>
      ${novo ? '' : '<button type="button" class="btn danger block" id="del-ex" style="margin-top:8px">Excluir exercício</button>'}
    </form>`,
    (root) => {
      const f = root.querySelector('#f-ex');
      const mostrar = () =>
        root.querySelectorAll('.ex-midia').forEach((d) => {
          d.hidden = d.dataset.m !== f.midia.value;
        });
      mostrar();
      f.midia.onchange = mostrar;
      let corte = null,
        corteSrc = null;
      root.querySelectorAll('.arq-btn input').forEach((inp) => {
        inp.onchange = () => {
          inp.parentNode.querySelector('i').textContent = inp.files[0]
            ? inp.files[0].name
            : 'nenhum arquivo selecionado';
          inp.parentNode.classList.toggle('ok', !!inp.files[0]);
          if (inp.name === 'video') {
            if (inp.files[0]) {
              corteSrc = inp.files[0];
              corte = painelCorte(root.querySelector('#corte'), corteSrc, inp.files[0].size > 50 * 1024 * 1024);
            } else {
              corte = null;
              root.querySelector('#corte').hidden = true;
            }
          }
        };
      });
      const ca = root.querySelector('#corte-atual');
      if (ca)
        ca.onclick = () => {
          corteSrc = ex.video_url;
          corte = painelCorte(root.querySelector('#corte'), corteSrc, true);
        };
      f.grupo.onchange = () => {
        root.querySelector('[data-err="grupo"]').hidden = !!f.grupo.value;
      };
      const vt = root.querySelector('#ex-voltar');
      if (vt) vt.onclick = opts.voltar;
      f.onsubmit = async (e) => {
        e.preventDefault();
        const nome = f.nome.value.trim(),
          midia = f.midia.value;
        if (nome.length < 2) {
          f.nome.focus();
          return toast('Digite o nome do exercício.', true);
        }
        if (!f.grupo.value) {
          root.querySelector('[data-err="grupo"]').hidden = false;
          f.grupo.focus();
          return toast('Escolha o grupo muscular.', true);
        }
        const arq = midia === 'foto' ? f.foto.files[0] : midia === 'video' ? f.video.files[0] : null;
        if (midia === 'foto' && !arq && md0 !== 'foto') return toast('Escolha a foto ou o GIF.', true);
        if (midia === 'video' && !arq && md0 !== 'video') return toast('Escolha o vídeo.', true);
        const vaiCortar = midia === 'video' && corte && corte.ativo && corte.fim > corte.ini;
        if (arq && !vaiCortar && arq.size > 50 * 1024 * 1024)
          return toast('O vídeo passa de 50 MB. Marque “Cortar o vídeo” e escolha um trecho.', true);
        const yt = f.yt.value.trim();
        if (midia === 'youtube' && !/^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(yt))
          return toast('Cole um link do YouTube válido.', true);
        const btn = root.querySelector('#ex-salvar');
        btn.disabled = true;
        btn.textContent = arq ? 'Enviando a mídia…' : 'Salvando…';
        let arqFinal = arq;
        try {
          if (vaiCortar) {
            try {
              arqFinal = await cortarVideo(corteSrc, corte.ini, corte.fim, (p) => {
                btn.textContent = `Cortando o vídeo… ${Math.round(p * 100)}%`;
              });
            } catch (er) {
              console.error(er);
              btn.disabled = false;
              btn.textContent = 'Salvar';
              return toast(
                'Este celular não conseguiu cortar o vídeo. Tente pelo Chrome ou envie um vídeo mais curto.',
                true,
              );
            }
            btn.textContent = 'Enviando a mídia…';
          }
          const linhas = f.instrucoes.value
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean);
          const proprias = (ex.imagens || []).filter((p) => /nx-exvideos/.test(p)),
            daBib = (ex.imagens || []).filter((p) => !/nx-exvideos/.test(p));
          const d = {
            nome,
            grupo: f.grupo.value,
            categoria: f.categoria.value || null,
            equipamento: f.equipamento.value.trim() || null,
            instrucoes: linhas,
            descricao: linhas[0] || null,
          };
          const url = arqFinal ? (await enviarMidiaEx(arqFinal)) + (vaiCortar ? '#loop' : '') : null;
          if (midia === 'nenhuma') Object.assign(d, { video_url: null, imagens: daBib });
          else if (midia === 'foto')
            Object.assign(d, { video_url: null, imagens: url ? [url] : proprias.length ? proprias : daBib });
          else if (midia === 'video')
            Object.assign(d, {
              video_url: url || ex.video_url,
              imagens: proprias.length ? [] : daBib,
              com_audio: !vaiCortar && !f.sem_audio.checked,
            });
          else Object.assign(d, { video_url: yt, imagens: proprias.length ? [] : daBib });
          if (!d.video_url || midia !== 'video') d.com_audio = false;
          const r = novo
            ? await sb
                .from('nx_exercicios')
                .insert({ ...d, org_id: S.org.id, criado_por: S.user.id })
                .select('*')
                .single()
            : await sb.from('nx_exercicios').update(d).eq('id', ex.id).select('*').single();
          if (r.error) throw r.error;
          const querFav = f.fav.value === '1';
          if (querFav !== fav.has(r.data.id)) await alternarFavorito(r.data.id);
          S.cache.ex = null;
          toast(novo ? 'Exercício criado!' : 'Exercício atualizado!');
          if (opts.aoSalvar) return opts.aoSalvar(r.data);
          closeSheet();
          staffBiblioteca();
        } catch (err) {
          console.error(err);
          btn.disabled = false;
          btn.textContent = 'Salvar';
          toast(
            arq ? 'Não foi possível enviar a mídia. Confira a internet e tente de novo.' : 'Não foi possível salvar.',
            true,
          );
        }
      };
      const del = root.querySelector('#del-ex');
      if (del)
        del.onclick = async () => {
          if (!confirm(`Excluir “${ex.nome}”?`)) return;
          const { error } = await sb.from('nx_exercicios').delete().eq('id', ex.id);
          if (error) return toast('Esse exercício está em algum treino. Remova dos treinos antes de excluir.', true);
          closeSheet();
          toast('Exercício excluído.');
          S.cache.ex = null;
          staffBiblioteca();
        };
    },
  );
}

/* ---------- retornos (feed de check-ins) ---------- */
async function staffFeed() {
  loading();
  const [sessT, { data: membrosT }, , , corrNovasT] = await Promise.all([
    buscarSessoes(null, 80),
    sb.from('nx_membros').select('user_id,nome,papel,treinador_id').eq('org_id', S.org.id),
    contarNaoVistos(),
    contarMsgNovas(),
    sb
      .from('nx_corridas')
      .select('id,aluno_id,data,tipo,distancia_m,duracao_s,rpe,dor,comentario')
      .eq('org_id', S.org.id)
      .eq('visto_treinador', false)
      .order('data', { ascending: false })
      .limit(30)
      .then((r) => r.data || []),
  ]);
  const membros = (membrosT || []).filter((m) => m.papel === 'aluno' && ehMeuAluno(m)),
    vis = new Set(membros.map((m) => m.user_id));
  const sess = sessT.filter((x) => vis.has(x.aluno_id)),
    corrNovas = corrNovasT.filter((x) => vis.has(x.aluno_id));
  const nomes = Object.fromEntries(membros.map((m) => [m.user_id, m.nome]));
  dockStaff();
  const novos = sess.filter((s) => !s.visto_treinador);
  const porAluno = Object.entries(S.cache.msgPorAluno || {});
  $app.innerHTML = `
    <p class="eyebrow">Retornos</p><h1 class="h1">Retornos dos alunos</h1>
    <p class="muted small" style="margin-top:6px">${novos.length || porAluno.length ? [novos.length ? `${novos.length} check-in${novos.length > 1 ? 's' : ''} novo${novos.length > 1 ? 's' : ''}` : '', S.cache.msgNovas ? `${S.cache.msgNovas} mensage${S.cache.msgNovas > 1 ? 'ns' : 'm'} sem resposta` : ''].filter(Boolean).join(' · ') : 'Tudo em dia por aqui.'}</p>
    ${porAluno.length ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Mensagens</h2>${slashes}</div>${porAluno.map(([id, n]) => `<a class="list-item" href="#/aluno/${id}/conversa" style="color:inherit"><div class="av st-ok">${esc(initials(nomes[id]))}</div><div class="grow"><b class="ellip" style="display:block">${esc(nomes[id] || 'Aluno')}</b><span class="small muted">${n} mensage${n > 1 ? 'ns' : 'm'} nova${n > 1 ? 's' : ''}</span></div><span class="tag acc">Responder</span></a>`).join('')}</div>` : ''}
    ${corrNovas.length ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Atividades novas</h2>${slashes}</div>${corrNovas.map((c) => `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><div class="av st-ok">${esc(initials(nomes[c.aluno_id]))}</div><div class="grow"><b class="ellip" style="display:block">${esc(nomes[c.aluno_id] || 'Aluno')}</b><span class="small muted">${ehCorr(c) ? `${fmtKm(c.distancia_m, 1)} · ${fmtPace(paceDe(c))}` : `${nomeAtiv(c)} · ${resumoAtiv(c)}`} · ${quando(c.data)}</span></div>${c.dor ? '<span class="tag warn">dor</span>' : ''}${c.rpe != null ? `<span class="rpe" style="background:${rpeCor(c.rpe)}">${c.rpe}</span>` : ''}${I.chev}</a>`).join('')}</div>` : ''}
    <div class="section" style="margin-top:22px"><div class="section-h"><h2 class="h2">Check-ins</h2>${novos.length ? '<button class="link-btn" id="todos-vistos">Marcar todos como vistos</button>' : slashes}</div>
    <div class="stack" id="feed">${sess.length ? sess.map((s) => sessaoCard(s, nomes[s.aluno_id] || 'Aluno').replace(/<\/div><\/div>$/, `<div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost sm" data-resp="${s.id}">${I.feed} Responder</button><button class="link-btn small" data-ver="${s.id}">Ver aluno</button></div></div></div>`)).join('') : '<div class="empty"><div class="h3">Nenhum treino registrado ainda</div><p class="small">Quando os alunos finalizarem treinos, os check-ins aparecem aqui.</p></div>'}</div></div>`;
  document.getElementById('feed').onclick = async (e) => {
    const c = e.target.closest('[data-sessao]');
    if (!c) return;
    const s = sess.find((x) => x.id === c.dataset.sessao);
    if (s && !s.visto_treinador) await sb.from('nx_sessoes').update({ visto_treinador: true }).eq('id', s.id);
    location.hash = e.target.closest('[data-resp]')
      ? `#/aluno/${s.aluno_id}/conversa/${s.id}`
      : `#/aluno/${s.aluno_id}/historico`;
  };
  const tv = document.getElementById('todos-vistos');
  if (tv)
    tv.onclick = async () => {
      await sb
        .from('nx_sessoes')
        .update({ visto_treinador: true })
        .eq('org_id', S.org.id)
        .eq('visto_treinador', false)
        .in('aluno_id', [...vis]);
      staffFeed();
    }; // só os check-ins dos seus alunos
}
