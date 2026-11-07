/* Nexos App · Evolução: atividades, execução do treino, cargas e periodização da força.
   Parte 10 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Evolução > Atividades: feed de tudo o que o aluno fez (relógio, celular e força no app) ---------- */
const ATV_FILTROS = [
  ['todas', 'Todas'],
  ['corrida', 'Corrida'],
  ['forca', 'Força'],
  ['outras', 'Outras'],
];
function atvTitulo(c) {
  if (c.titulo && !/^(running|corrida|run)$/i.test(c.titulo.trim())) return c.titulo;
  const h = atvData(c.data).getHours(),
    temHora = /T\d\d:\d\d/.test(String(c.data)) && !/T00:00:00/.test(String(c.data));
  const per = !temHora
    ? ''
    : h < 5
      ? ' da madrugada'
      : h < 12
        ? ' da manhã'
        : h < 17
          ? ' da tarde'
          : h < 19
            ? ' ao entardecer'
            : ' da noite';
  return nomeAtiv(c) + per;
}
const atvData = (d) => new Date(/^\d{4}-\d\d-\d\d$/.test(String(d)) ? d + 'T12:00:00' : d);
const atvDur = (s) => {
  if (!s) return '–';
  s = Math.round(s);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    x = s % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min ${String(x).padStart(2, '0')}s`;
};
function atvGrupo(x) {
  if (x.k === 'ses') return 'forca';
  if (x.c.tipo === 'forca') return 'forca';
  return ehCorr(x.c) ? 'corrida' : 'outras';
}
function atvCard(x, rotas, staff) {
  if (x.k === 'ses') {
    const s = x.s,
      d = new Date(s.iniciado_em),
      min = s.finalizado_em ? minutos(s.iniciado_em, s.finalizado_em) : null;
    return `<div class="card atv"><div class="atv-top"><span class="atv-ic fo">${HALTER_S}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(s.treino_titulo || 'Treino de força')}</b><span class="small muted">${d.getDate()} de ${MESES_N[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · no app</span></div></div>
      <div class="atv-num"><div><small>Tempo</small><b>${min != null ? min + ' min' : '–'}</b></div><div><small>Esforço</small><b>${s.esforco != null ? s.esforco + '/10' : '–'}</b></div><div><small>Carga</small><b>${min != null && s.esforco != null ? cargaSessao(s.esforco, min) + ' UA' : '–'}</b></div></div></div>`;
  }
  const c = x.c,
    d = atvData(c.data),
    R = rotas[c.id];
  const temHora = /T\d\d:\d\d/.test(String(c.data)) && !/T00:00:00/.test(String(c.data));
  const fonte =
    c.fonte === 'garmin'
      ? 'Garmin'
      : c.fonte === 'arquivo'
        ? 'relógio'
        : c.fonte === 'intervals'
          ? 'Intervals'
          : c.fonte === 'celular'
            ? 'GPS do celular'
            : c.fonte === 'relogio'
              ? 'relógio'
              : 'registrada à mão';
  const corr = ehCorr(c),
    dist = comDist(c);
  const nums = dist
    ? [
        ['Distância', fmtKm(c.distancia_m, 2)],
        corr ? ['Ritmo', fmtPace(paceDe(c))] : ['FC média', c.fc_media ? c.fc_media + ' bpm' : '–'],
        ['Tempo', atvDur(c.duracao_s)],
      ]
    : [
        ['Tempo', atvDur(c.duracao_s)],
        ['FC média', c.fc_media ? c.fc_media + ' bpm' : '–'],
        ['Esforço', c.rpe != null ? c.rpe + '/10' : '–'],
      ];
  let mapa = '';
  if (R && R.length > 5) {
    const passo = Math.max(1, Math.ceil(R.length / 300));
    mapa = `<div class="atv-mapa">${rotaSVG(
      R.filter((_, i) => i % passo === 0 || i === R.length - 1),
      150,
    )}</div>`;
  }
  return `<a class="card tap atv" href="#/corrida/${c.id}" style="color:inherit"><div class="atv-top"><span class="atv-ic ${c.tipo === 'forca' ? 'fo' : ''}">${c.tipo === 'forca' ? HALTER_S : corr ? icCorr(S.me) : I.watch}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${staff && !c.visto_treinador ? '<i class="alert-dot" style="display:inline-block;margin-right:6px;vertical-align:middle" title="Nova"></i>' : ''}${esc(atvTitulo(c))}</b><span class="small muted">${d.getDate()} de ${MESES_N[d.getMonth()]}${temHora ? ` · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''} · ${fonte}</span></div>${I.chev}</div>
    <div class="atv-num">${nums.map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`).join('')}</div>
    ${c.dor || c.plano_id ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${c.plano_id ? '<span class="tag ok">da planilha</span>' : ''}${c.dor ? '<span class="tag warn">dor</span>' : ''}</div>` : ''}${mapa}</a>`;
}
async function histAtividades(head) {
  $app.innerHTML = head + '<div id="atv-feed"></div>';
  await feedAtividades(S.user.id, document.getElementById('atv-feed'), false);
}
/** lista de tudo o que o aluno fez (relógio, celular e força no app), com filtros e mapinha; também na ficha do aluno para o treinador */
async function feedAtividades(alunoId, alvo, staff) {
  const [cor, ses] = await Promise.all([
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,fc_media,titulo,fonte,rpe,dor,plano_id,visto_treinador')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false })
      .limit(1000)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    buscarSessoes(alunoId, 300).catch(() => []),
  ]);
  const todas = [
    ...cor.map((c) => ({ k: 'cor', t: atvData(c.data).getTime(), c })),
    ...ses.map((s) => ({ k: 'ses', t: new Date(s.iniciado_em).getTime(), s })),
  ].sort((a, b) => b.t - a.t);
  const st = { f: 'todas', n: 15 },
    rotas = {};
  const filtradas = () => (st.f === 'todas' ? todas : todas.filter((x) => atvGrupo(x) === st.f));
  alvo.innerHTML = `<div class="chips" id="atv-f" style="margin-top:14px">${ATV_FILTROS.map(([k, l]) => `<button type="button" class="chip ${k === st.f ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div><div id="atv-l" style="margin-top:12px"></div>`;
  const box = document.getElementById('atv-l');
  const desenha = async () => {
    const L = filtradas(),
      vis = L.slice(0, st.n);
    const falta = vis.filter((x) => x.k === 'cor' && !(x.c.id in rotas)).map((x) => x.c.id);
    if (falta.length) {
      const { data } = await sb
        .from('nx_corridas')
        .select('id,rota')
        .in('id', falta)
        .then(
          (r) => r,
          () => ({ data: [] }),
        );
      falta.forEach((id) => {
        rotas[id] = null;
      });
      (data || []).forEach((r) => {
        rotas[r.id] = r.rota;
      });
    }
    if (!L.length) {
      box.innerHTML = `<div class="empty"><div class="h3">Nada por aqui ainda</div><p class="small">${st.f === 'todas' ? (staff ? 'Quando o aluno treinar, pelo relógio, pelo celular ou no app, a atividade aparece aqui.' : 'Quando você treinar, pelo relógio, pelo celular ou no app, a atividade aparece aqui.') : 'Nenhuma atividade deste tipo ainda.'}</p></div>`;
      return;
    }
    let html = '',
      mesAtual = '';
    vis.forEach((x) => {
      const d = new Date(x.t),
        chave = d.getFullYear() + '-' + d.getMonth();
      if (chave !== mesAtual) {
        mesAtual = chave;
        const doMes = L.filter((y) => {
          const e = new Date(y.t);
          return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth();
        });
        const km = doMes.filter((y) => y.k === 'cor' && comDist(y.c)).reduce((a, y) => a + y.c.distancia_m, 0);
        html += `<div class="atv-mes"><b>${MESES_N[d.getMonth()].replace(/^./, (m) => m.toUpperCase())} de ${d.getFullYear()}</b><span>${doMes.length} atividade${doMes.length > 1 ? 's' : ''}${km >= 1000 ? ` · ${fmtKm(km, 1)}` : ''}</span></div>`;
      }
      html += atvCard(x, rotas, staff);
    });
    box.innerHTML = `<div class="stack">${html}</div>${L.length > st.n ? `<button class="btn ghost block sm" id="atv-mais" style="margin-top:12px">Ver mais (${L.length - st.n})</button>` : ''}`;
    const m = document.getElementById('atv-mais');
    if (m)
      m.onclick = () => {
        m.disabled = true;
        m.textContent = 'Carregando…';
        st.n += 15;
        desenha();
      };
  };
  document.getElementById('atv-f').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (!b || b.dataset.f === st.f) return;
    st.f = b.dataset.f;
    st.n = 15;
    document.querySelectorAll('#atv-f .chip').forEach((x) => x.classList.toggle('on', x === b));
    desenha();
  };
  await desenha();
}
async function alunoHistorico(aba) {
  loading();
  const abasH = [
    ['atividades', 'Atividades'],
    ['previsoes', 'Previsões'],
    ['relatorio', 'Relatório'],
    ['treinos', 'Treinos'],
    ['corrida', 'Corrida'],
    ['cargas', 'Cargas'],
    ['avaliacoes', 'Avaliações'],
    ['fotos', 'Fotos'],
  ]
    .filter(([k]) => (k !== 'treinos' && k !== 'cargas') || faz('musculacao'))
    .filter(([k]) => (k !== 'corrida' && k !== 'previsoes') || faz('corrida'));
  const INFO = {
    previsoes: [I.flag, 'Previsões de desempenho', 'Seus tempos estimados para 5K, 10K, meia e maratona'],
    relatorio: [I.ficha, 'Relatório do mês', 'Seu resumo mensal em PDF'],
    treinos: [I.feed, 'Treinos feitos', 'Histórico e feedbacks'],
    corrida: [icCorr(S.me), 'Corrida', 'Volume, pace e corridas'],
    cargas: [I.hist, 'Cargas', 'Quanto você evoluiu em cada exercício'],
    avaliacoes: [I.check, 'Avaliações', 'Composição corporal e relatórios'],
    fotos: [I.cam, 'Fotos', 'Seu progresso visual'],
    atividades: [I.watch, 'Atividades', 'Tudo o que você fez, com mapa e números'],
  };
  if (!aba || !abasH.some(([k]) => k === aba)) {
    const [ses, cor] = await Promise.all([
      buscarSessoes(S.user.id, 200),
      sb
        .from('nx_corridas')
        .select('data')
        .eq('aluno_id', S.user.id)
        .gte('data', isoDia(Date.now() - 60 * 864e5))
        .then((r) => r.data || [])
        .catch(() => []),
    ]);
    const datas = [...ses.map((x) => x.iniciado_em), ...cor.map((c) => c.data)];
    $app.innerHTML = `<p class="eyebrow">Evolução</p><h1 class="h1">Sua evolução</h1>
      <div class="stack" style="margin-top:16px">${freqSemanaHTML(datas)}${constanciaHTML(datas)}
      <p class="sec-lbl" style="margin-top:8px">Seus momentos</p>
      <div class="sec-grid sec-mom">${[
        ['#/medalhas', TROFEU_IC, 'Medalhas', 'Suas conquistas e cards para o story'],
        ['#/retrospectiva', I.cal, 'Retrospectivas', 'Seu mês e seu ano em tela cheia'],
        ['#/antes-depois', I.hist, 'Antes e depois', 'Primeiro mês contra agora'],
      ]
        .map(
          ([h, ic, t, d]) =>
            `<a class="sec-tile mom" href="${h}"><span class="st-ic">${ic}</span><b>${t}</b><small>${d}</small></a>`,
        )
        .join('')}</div>
      <p class="sec-lbl" style="margin-top:8px">Detalhes</p>
      <div class="sec-grid sec-det">${abasH.map(([k]) => `<a class="sec-tile" href="#/historico/${k}"><span class="st-ic">${INFO[k][0]}</span><b>${INFO[k][1]}</b><small>${INFO[k][2]}</small></a>`).join('')}</div></div>`;
    return;
  }
  const head = `<a class="back" href="#/historico">${I.back} Evolução</a><div class="sec-tit"><span class="st-ic">${INFO[aba][0]}</span><div><p class="eyebrow">Sua evolução</p><h1 class="h2">${INFO[aba][1]}</h1></div></div>`;
  const bindTabs = () => {};
  if (aba === 'atividades') return histAtividades(head);
  if (aba === 'previsoes') {
    $app.innerHTML = head + '<div id="pv-box" style="margin-top:14px"></div>';
    return previsoesCard(document.getElementById('pv-box'), await buscarCorridasPrev(S.user.id), perfilCorrida(S.me), {
      titulo: false,
    });
  }
  if (aba === 'relatorio') {
    $app.innerHTML = head + '<div id="relm"></div>';
    return relatorioMes(S.user.id, document.getElementById('relm'), false, S.me);
  }
  if (aba === 'cargas') {
    const grupos = agruparCargas(await buscarRegistros(S.user.id));
    $app.innerHTML = head + `<div id="cargas">${cargasHTML(grupos, false)}</div>`;
    bindTabs();
    bindCargas(document.getElementById('cargas'), grupos);
    return;
  }
  if (aba === 'corrida') {
    $app.innerHTML = head + '<div id="corr"></div>';
    bindTabs();
    if (/\/(garmin-ok|garmin-erro|ok|erro)$/.test(location.hash)) {
      location.replace(location.pathname + '#/conexoes/' + location.hash.split('/').pop());
      return;
    }
    if (/\/garmin-(ok|erro)$/.test(location.hash)) {
      const ok = location.hash.endsWith('-ok');
      toast(
        ok
          ? 'Garmin conectado! Suas próximas corridas chegam sozinhas.'
          : 'Não foi possível conectar o Garmin. Tente de novo.',
        !ok,
      );
      history.replaceState(null, '', location.pathname + '#/historico/corrida');
    } else if (/\/(ok|erro)$/.test(location.hash)) {
      toast(
        location.hash.endsWith('/ok')
          ? 'Intervals.icu conectado! Buscando suas corridas…'
          : 'Não foi possível conectar o Intervals.icu.',
        !location.hash.endsWith('/ok'),
      );
      history.replaceState(null, '', location.pathname + '#/historico/corrida');
      S.cache.semCorr = { off: 0, sub: 'corridas', aluno: S.user.id };
    }
    await viewCorridaPainel(S.user.id, document.getElementById('corr'), false, S.me, [
      'evolucao',
      'corridas',
      'ritmos',
    ]);
    return;
  }
  if (aba === 'fotos') {
    $app.innerHTML = head + '<div id="fotos"></div>';
    bindTabs();
    await viewFotos(S.user.id, document.getElementById('fotos'), false);
    return;
  }
  if (aba === 'avaliacoes') {
    const [avs, temCk] = await Promise.all([
      buscarAvaliacoes(S.user.id),
      sb
        .from('nx_checkups')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', S.user.id)
        .then(
          (r) => (r.count || 0) > 0,
          () => false,
        ),
    ]);
    $app.innerHTML =
      head +
      (temCk
        ? `<a class="list-item" href="#/checkup" style="color:inherit;margin:14px 0 4px"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Check-up do Corredor</b><div class="small muted">Seus testes de entrada e saída</div></div>${I.chev}</a>`
        : '') +
      `<div class="card med-cta"><div class="grow"><b>Medidas em casa</b><p class="small muted">Com fita métrica e balança, uma vez por mês. O app estima a sua composição corporal no formato de uma bioimpedância.</p></div><button class="btn sm" id="med-reg">Registrar medidas</button></div>` +
      avaliacoesHTML(avs, S.user.id, false);
    bindTabs();
    document.getElementById('med-reg').onclick = () =>
      registrarMedidas((id) => {
        location.hash = '#/relatorio/' + id;
      });
    return;
  }
  const sessoes = await buscarSessoes(S.user.id, 120);
  const total = sessoes.length;
  const mes = sessoes.filter((s) => diasDesde(s.iniciado_em) < 30).length;
  const media = total
    ? (sessoes.slice(0, 10).reduce((a, s) => a + (s.esforco ?? 0), 0) / Math.min(10, total))
        .toFixed(1)
        .replace('.', ',')
    : '–';
  const sem = Array(12).fill(0);
  sessoes.forEach((s) => {
    const w = Math.floor(diasDesde(s.iniciado_em) / 7);
    if (w < 12) sem[11 - w]++;
  });
  const max = Math.max(3, ...sem);
  const bars = sem
    .map(
      (v, i) =>
        `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;height:90px"><div title="${v} treinos" style="height:${(v / max) * 100}%;min-height:${v ? 6 : 2}px;border-radius:6px;background:${i === 11 ? 'linear-gradient(180deg,var(--acc),var(--acc2))' : 'var(--s3)'}"></div></div>`,
    )
    .join('');
  $app.innerHTML =
    head +
    `
    <div class="stats" style="margin-top:0"><div class="stat"><b>${total}</b><span>treinos no total</span></div><div class="stat"><b>${mes}</b><span>nos últimos 30 dias</span></div><div class="stat"><b>${media}</b><span>esforço médio recente</span></div></div>
    <div class="card"><div class="row between"><span class="small muted">Treinos por semana</span><span class="tiny dim">últimas 12 semanas</span></div><div style="display:flex;gap:6px;margin-top:14px">${bars}</div></div>
    <div class="section"><div class="section-h"><h2 class="h2">Sessões</h2>${slashes}</div>
    ${sessoes.length ? sessoes.map((s) => sessaoCard(s)).join('') : '<div class="empty"><div class="h3">Nenhum treino registrado ainda</div><p class="small">Quando você finalizar um treino, ele aparece aqui.</p></div>'}</div>`;
  bindTabs();
}

/* ---------- execução do treino ---------- */
let restT = null;
function stopRest() {
  clearInterval(restT);
  restT = null;
  const r = document.getElementById('rest');
  if (r) r.hidden = true;
}
function startRest(seg) {
  stopRest();
  const r = document.getElementById('rest');
  let left = seg;
  const C = 2 * Math.PI * 100;
  r.innerHTML = `<p class="eyebrow">Descanso</p><div class="ring"><svg viewBox="0 0 220 220"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#2f6bff"/><stop offset="1" stop-color="#46d6ff"/></linearGradient></defs><circle class="bgc" cx="110" cy="110" r="100"/><circle class="fgc" id="rest-c" cx="110" cy="110" r="100" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="t mono" id="rest-t">${left}</div></div><div class="row" style="gap:10px"><button class="btn ghost sm" id="rest-mais">+15 s</button><button class="btn sm" id="rest-pular">Pular</button></div>`;
  r.hidden = false;
  let total = seg;
  const tick = () => {
    document.getElementById('rest-t').textContent = left;
    document.getElementById('rest-c').style.strokeDashoffset = String(C * (1 - left / total));
    if (left <= 0) {
      stopRest();
      try {
        navigator.vibrate && navigator.vibrate([180, 80, 180]);
      } catch {}
      toast('Descanso concluído. Próxima série!');
    }
    left--;
  };
  document.getElementById('rest-mais').onclick = () => {
    left += 15;
    total += 15;
  };
  document.getElementById('rest-pular').onclick = stopRest;
  tick();
  restT = setInterval(tick, 1000);
}

/* ---------- cargas: histórico e sugestão ---------- */
const numCarga = (v) => {
  const m = String(v ?? '')
    .replace(',', '.')
    .match(/\d+(\.\d+)?/);
  return m ? +m[0] : null;
};
const fmtKg = (n) => (n == null ? '–' : (Math.round(n * 10) / 10).toString().replace('.', ',') + ' kg');
function passoCarga(kg) {
  return kg < 10 ? 1 : kg < 40 ? 2 : 2.5;
}
function arred(kg, passo) {
  return Math.round(kg / passo) * passo;
}
/** sugestão: usa a última carga, o esforço e a dor do último treino e a carga prescrita */
function sugerirCarga(prev, presc) {
  if (!prev || prev.carga_kg == null)
    return presc != null ? { kg: presc, motivo: 'carga prescrita pelo treinador' } : null;
  const last = +prev.carga_kg,
    s = prev.sessao || {};
  if (presc != null && presc > last) return { kg: presc, motivo: 'nova carga definida pelo treinador' };
  if (s.dor) return { kg: last, motivo: 'você relatou dor no último treino: mantenha' };
  if (s.esforco != null && s.esforco >= 9) return { kg: last, motivo: 'último treino foi muito intenso: mantenha' };
  if (s.esforco != null && s.esforco <= 7 && prev.feito !== false) {
    const p = passoCarga(last);
    return { kg: arred(last + Math.max(p, last * 0.05), p), motivo: 'você treinou com folga: tente subir' };
  }
  return { kg: last, motivo: 'repita e consolide a técnica' };
}
async function ultimasCargas(alunoId, exIds) {
  if (!exIds.length) return {};
  const { data } = await sb
    .from('nx_registros')
    .select('exercicio_id,carga_kg,reps,feito,criado_em,sessao_id,nx_sessoes(esforco,dor)')
    .eq('aluno_id', alunoId)
    .in('exercicio_id', exIds)
    .not('carga_kg', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(400);
  const out = {};
  (data || []).forEach((r) => {
    if (!out[r.exercicio_id]) out[r.exercicio_id] = { ...r, sessao: r.nx_sessoes };
  });
  return out;
}

async function viewExecucao(treinoId, preview) {
  loading();
  const { data: t, error } = await sb
    .from('nx_treinos')
    .select(
      '*, nx_treino_itens(*, nx_exercicios(nome,grupo,equipamento,descricao,video_url,video_credito,com_audio,imagens,instrucoes,musculos,musculos_sec,nivel,ref_externa))',
    )
    .eq('id', treinoId)
    .maybeSingle();
  if (error) throw error;
  if (!t) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Treino não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  let itens = (t.nx_treino_itens || []).sort((a, b) => a.ordem - b.ordem);
  // ajustes temporários do treinador (dor): exercício pausado some; carga reduzida vira aviso no exercício
  const ajF = await sb
    .from('nx_ajustes_forca')
    .select('item_id,tipo,nota,ate')
    .eq('aluno_id', t.aluno_id)
    .gte('ate', hojeISO())
    .then(
      (r) => r.data || [],
      () => [],
    );
  const pausados = itens.filter((i) => ajF.some((a) => a.item_id === i.id && a.tipo === 'pausar'));
  if (ajF.length)
    itens = itens
      .filter((i) => !pausados.includes(i))
      .map((i) => {
        const a = ajF.find((y) => y.item_id === i.id && y.tipo === 'reduzir');
        return a
          ? {
              ...i,
              observacao: `Ajuste do treinador: ${a.nota || 'carga reduzida nesta semana.'}${i.observacao ? ' · ' + i.observacao : ''}`,
            }
          : i;
      });
  t._pausados = pausados.map((i) => (i.nx_exercicios && i.nx_exercicios.nome) || 'Exercício');
  const exIdsT = [...new Set(itens.map((i) => i.exercicio_id))];
  const fase = faseDoTreino(await faseDaSemana(t.aluno_id, isoDia(inicioSemana())), t);
  const [prevs, prevsFase] = await Promise.all([
    ultimasCargas(t.aluno_id, exIdsT),
    ultimasCargasFase(t.aluno_id, exIdsT, fase),
  ]);
  const key = 'nx-exec-' + t.id;
  const st = preview
    ? { feitos: [], cargas: {}, ser: {} }
    : store.get(key, { feitos: [], ini: null, cargas: {}, ser: {} });
  st.cargas = st.cargas || {};
  st.ser = st.ser || {};
  if (!preview && !st.ini) {
    st.ini = new Date().toISOString();
    store.set(key, st);
  }
  const feitos = new Set(st.feitos);
  const sug = {};
  itens.forEach((it) => {
    sug[it.id] = sugerirCarga(prevs[it.exercicio_id], numCarga(it.carga));
  });

  const cargaHTML = (it) => {
    const prev = prevs[it.exercicio_id];
    const sg = sug[it.id];
    if (!prev && !sg && !numCarga(it.carga) && !(fase && prevsFase[it.exercicio_id]))
      return `<div class="load"><label class="load-in"><span>Carga hoje</span><input data-mask="dec" data-int="3" data-casas="1" inputmode="decimal" data-carga="${it.id}" value="${esc(st.cargas[it.id] ?? '')}" placeholder="kg" ${preview ? 'disabled' : ''}></label><span class="tiny dim">Sem carga? Deixe em branco.</span></div>`;
    return `<div class="load">
      <label class="load-in"><span>Carga hoje</span><input data-mask="dec" data-int="3" data-casas="1" inputmode="decimal" data-carga="${it.id}" value="${esc(st.cargas[it.id] ?? '')}" placeholder="${sg ? String(sg.kg).replace('.', ',') : 'kg'}" ${preview ? 'disabled' : ''}><em>kg</em></label>
      <div class="load-info">
        ${prev ? `<span class="tiny muted">Última vez: <b>${fmtKg(prev.carga_kg)}</b> · ${quando(prev.criado_em)}</span>` : '<span class="tiny muted">Primeira vez registrando</span>'}
        ${fase && prevsFase[it.exercicio_id] ? `<span class="tiny fase-prev" style="--fc:${FASES_F[fase].cor}">Última semana de ${FASES_F[fase].n.toLowerCase()}: <b>${fmtKg(prevsFase[it.exercicio_id].carga_kg)}</b> · ${quando(prevsFase[it.exercicio_id].criado_em)}</span>` : ''}
        ${sg ? `<button type="button" class="sug" data-sug="${it.id}" data-kg="${sg.kg}" title="${esc(sg.motivo)}">Sugerida <b>${fmtKg(sg.kg)}</b></button><span class="tiny dim">${esc(sg.motivo)}</span>` : ''}
      </div></div>`;
  };

  const render = () => {
    const pct = itens.length ? Math.round((feitos.size / itens.length) * 100) : 0;
    $app.innerHTML = `
      <div class="exec-head">
        <div class="row between">
          <a class="icon-btn" href="${preview ? `#/aluno/${t.aluno_id}` : '#/'}" aria-label="Voltar">${I.back}</a>
          <div class="grow center"><div class="eyebrow">${preview ? 'Pré-visualização' : 'Em treino'}</div><div class="h3 ellip">${esc(t.titulo)}</div></div>
          <span class="mono small muted" style="width:42px;text-align:right">${feitos.size}/${itens.length}</span>
        </div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </div>
      ${t._pausados && t._pausados.length ? `<div class="aj-pausa">${I.alerta || ''}<span><b>Pausado pelo treinador nesta semana:</b> ${esc(t._pausados.join(', '))}. Pule ${t._pausados.length > 1 ? 'esses exercícios' : 'esse exercício'}.</span></div>` : ''}
      ${fase ? faseCardHTML(fase, st.psr != null ? `<span class="tiny" style="display:block;margin-top:6px">Recuperação hoje: <b style="color:${psrCor(st.psr)}">${st.psr}/10 · ${PSR_TXT(st.psr)}</b></span>` : '') : st.psr != null ? `<p class="small muted">Recuperação hoje: <b style="color:${psrCor(st.psr)}">${st.psr}/10 · ${PSR_TXT(st.psr)}</b></p>` : ''}
      ${t.observacoes ? `<div class="card" style="border-color:rgba(70,214,255,.3)"><span class="eyebrow">Recado do treinador</span><p style="margin-top:6px">${esc(t.observacoes)}</p></div>` : ''}
      <div class="stack" style="margin-top:12px">
      ${itens
        .map((it, i) => {
          const ex = it.nx_exercicios || {};
          const done = feitos.has(it.id);
          return `<div class="card ex ${done ? 'done' : ''}" data-item="${it.id}">
          <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="grow" data-toggle-info>
            ${exFig(ex, 'ex-fig')}
            <div class="ex-name">${esc(ex.nome || 'Exercício')}</div>
            ${
              Array.isArray(it.series_det) && it.series_det.length
                ? `<div class="ser-ex">${it.series_det
                    .map((d, k) => {
                      const ok = (st.ser[it.id] || []).includes(k);
                      return `<button type="button" class="se-l ${ok ? 'ok' : ''}" data-ser="${it.id}" data-k="${k}" data-desc="${d.desc || ''}"><b class="mono">${k + 1}ª</b><span class="se-t">${[d.reps ? `<b>${esc(d.reps)}</b> reps` : '', d.carga ? `<b>${esc(d.carga)}</b>` : ''].filter(Boolean).join(' · ')}</span><span class="dim">${d.desc ? d.desc + 's' : ''}</span><i>${I.check}</i></button>`;
                    })
                    .join(
                      '',
                    )}<p class="tiny dim" style="margin-top:4px">Toque na série quando terminar: o descanso começa sozinho.</p></div>`
                : `<div class="ex-pres">
              ${it.series ? `<span class="pill"><b>${it.series}</b> séries</span>` : ''}
              ${it.repeticoes ? `<span class="pill"><b>${esc(it.repeticoes)}</b> reps</span>` : ''}
              ${it.carga ? `<span class="pill">prescrita <b>${esc(it.carga)}</b></span>` : ''}
              ${it.descanso_seg ? `<span class="pill">descanso <b>${it.descanso_seg}s</b></span>` : ''}
            </div>`
            }
            ${it.observacao ? `<p class="small" style="margin-top:8px;color:var(--warn)">${esc(it.observacao)}</p>` : ''}
            ${cargaHTML(it)}
            <div class="ex-more">${exDetalhe(ex)}</div>
            <button type="button" class="link-btn ex-how" data-how>Como fazer</button>
            <div class="ex-actions">
              ${it.descanso_seg ? `<button class="btn ghost sm" data-rest="${it.descanso_seg}">${I.timer} Descanso</button>` : ''}
              ${ex.video_url ? (ehVideoArquivo(ex.video_url) ? `<button type="button" class="btn ghost sm" data-vid>${I.play} Vídeo</button>` : `<a class="btn ghost sm" href="${esc(ex.video_url)}" target="_blank" rel="noopener">${I.play} Vídeo</a>`) : ''}
            </div>
          </div>
          <button class="check" data-check aria-label="Marcar como feito">${I.check}</button>
        </div>`;
        })
        .join('')}
      </div>
      ${preview ? '' : `<div style="height:90px"></div><div class="finish-bar"><button class="btn" id="finalizar">${feitos.size === itens.length && itens.length ? 'Finalizar treino' : `Finalizar treino (${feitos.size}/${itens.length})`} ${I.arrow}</button></div>`}`;
  };
  render();
  // PSR antes de começar: como o aluno chega recuperado para este treino
  if (!preview && st.psr == null && !st.psrPulou) {
    let psr = null;
    openSheet(
      `<p class="eyebrow">Antes de começar</p><div class="h2" style="margin-top:4px">Como está a sua recuperação?</div>
      <p class="small muted" style="margin-top:6px">De 0 (muito cansado) a 10 (totalmente recuperado). Ajuda o treinador a ajustar a carga.</p>
      <div class="effort" id="psr">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="effort-lbl"><span>Muito cansado</span><span id="psr-txt"></span><span>Recuperado</span></div>
      <button class="btn block" id="psr-ok" style="margin-top:16px">Começar o treino ${I.arrow}</button>
      <button class="btn ghost block" id="psr-pular" style="margin-top:8px">Pular</button>`,
      (r) => {
        r.querySelector('#psr').onclick = (e) => {
          const b = e.target.closest('[data-n]');
          if (!b) return;
          psr = +b.dataset.n;
          r.querySelectorAll('#psr button').forEach((x) => {
            const on = +x.dataset.n === psr;
            x.classList.toggle('on', on);
            x.style.background = on ? psrCor(psr) : '';
          });
          r.querySelector('#psr-txt').textContent = PSR_TXT(psr);
        };
        r.querySelector('#psr-ok').onclick = () => {
          if (psr == null) return toast('Escolha de 0 a 10.', true);
          st.psr = psr;
          store.set(key, st);
          closeSheet();
          const y = window.scrollY;
          render();
          window.scrollTo(0, y);
        };
        r.querySelector('#psr-pular').onclick = () => {
          st.psrPulou = true;
          store.set(key, st);
          closeSheet();
        };
      },
    );
  }
  $app.oninput = (e) => {
    const inp = e.target.closest('[data-carga]');
    if (!inp || preview) return;
    st.cargas[inp.dataset.carga] = inp.value;
    store.set(key, st);
  };
  $app.onclick = (e) => {
    const card = e.target.closest('[data-item]');
    const vidB = e.target.closest('[data-vid]');
    if (vidB) {
      const card = vidB.closest('.ex');
      if (card) {
        card.classList.add('open');
        const v = card.querySelector('.ex-vid video');
        if (v) {
          v.scrollIntoView({ block: 'center', behavior: 'smooth' });
          v.play().catch(() => {});
        }
      }
      return;
    }
    const restB = e.target.closest('[data-rest]');
    if (restB) {
      e.stopPropagation();
      startRest(+restB.dataset.rest);
      return;
    }
    const serB = e.target.closest('[data-ser]');
    if (serB) {
      e.stopPropagation();
      if (preview) return toast('Pré-visualização: o aluno marca as séries.');
      const id = serB.dataset.ser,
        k = +serB.dataset.k;
      const l = new Set(st.ser[id] || []);
      const marcando = !l.has(k);
      marcando ? l.add(k) : l.delete(k);
      st.ser[id] = [...l];
      const it = itens.find((x) => x.id === id);
      const tot = it.series_det.length;
      if (l.size === tot) feitos.add(id);
      else feitos.delete(id);
      st.feitos = [...feitos];
      store.set(key, st);
      try {
        navigator.vibrate && navigator.vibrate(15);
      } catch {}
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      if (marcando && l.size < tot && +serB.dataset.desc) startRest(+serB.dataset.desc);
      if (feitos.size === itens.length && itens.length) toast('Tudo feito! Finalize e conte como foi.');
      return;
    }
    if (e.target.closest('a') || e.target.closest('input') || e.target.closest('.load-in')) return;
    const sb_ = e.target.closest('[data-sug]');
    if (sb_) {
      if (preview) return;
      const v = String(sb_.dataset.kg).replace('.', ',');
      st.cargas[sb_.dataset.sug] = v;
      store.set(key, st);
      const inp = $app.querySelector(`[data-carga="${sb_.dataset.sug}"]`);
      if (inp) inp.value = v;
      toast('Carga sugerida aplicada');
      return;
    }
    if (card && e.target.closest('[data-check]')) {
      if (preview) return toast('Pré-visualização: o aluno marca os exercícios.');
      const id = card.dataset.item;
      feitos.has(id) ? feitos.delete(id) : feitos.add(id);
      st.feitos = [...feitos];
      store.set(key, st);
      try {
        navigator.vibrate && navigator.vibrate(18);
      } catch {}
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      if (feitos.size === itens.length && itens.length) toast('Tudo feito! Finalize e conte como foi.');
      return;
    }
    if (card && e.target.closest('[data-toggle-info]')) {
      card.classList.toggle('open');
      hidratarInstrucoes(card);
    }
    if (e.target.closest('#finalizar')) abrirCheckin(t, itens, st, key, fase);
  };
}

/* ---------- periodização da força: fase da semana (zona de repetições), PSR e carga da sessão ---------- */
const FASES_F = {
  resistencia: {
    n: 'Resistência de força',
    c: 'R',
    reps: '15 a 20 repetições',
    desc: 'Adaptação ao exercício e resistência muscular: mais repetições, carga leve a moderada. Com as séries perto da falha, também ganha músculo (Schoenfeld et al. 2021).',
    desc2: 'descanso de 30 a 60 s',
    cor: '#1fae78',
  },
  hipertrofia: {
    n: 'Hipertrofia',
    c: 'H',
    reps: '8 a 12 repetições',
    desc: 'Faixa prática para ganhar músculo, mas não a única: o músculo cresce de umas 6 a 30 repetições, desde que a série termine perto da falha, com 0 a 3 repetições sobrando (Schoenfeld et al. 2021; Robinson et al. 2024).',
    desc2: 'descanso de pelo menos 60 a 90 s; mais nos exercícios grandes',
    cor: '#2f6bff',
  },
  forca: {
    n: 'Força',
    c: 'F',
    reps: '4 a 6 repetições',
    desc: 'Carga alta (cerca de 80% da máxima ou mais) e poucas repetições, com técnica impecável. Para força, não precisa ir à falha: terminar com 2 a 3 repetições sobrando dá o mesmo ganho (Robinson et al. 2024).',
    desc2: 'descanso de 2 a 3 min',
    cor: '#e39a12',
  },
  potencia: {
    n: 'Potência',
    c: 'P',
    reps: '4 a 6 repetições',
    desc: 'Carga moderada movida o mais rápido possível, com controle. Pare a série quando a velocidade começar a cair; nunca até a falha.',
    desc2: 'descanso de 2 a 3 min',
    cor: '#e5484d',
  },
  ondulatorio: {
    n: 'Ondulatório diário',
    c: 'O',
    reps: 'muda a cada treino',
    desc: 'Treino A em força (4 a 6 repetições), B em hipertrofia (8 a 12) e C em resistência (15 a 20).',
    desc2: 'descanso conforme o treino do dia',
    cor: '#b794ff',
  },
  deload: {
    n: 'Semana leve',
    c: 'L',
    reps: 'as mesmas repetições',
    desc: 'Metade das séries e carga uns 10% menor: controla o cansaço acumulado sem parar de treinar (Bell et al. 2023). Parar totalmente uma semana não aumentou o ganho de músculo e reduziu um pouco o de força (Coleman et al. 2024).',
    desc2: 'descanso normal',
    cor: '#8a97b2',
  },
  flexivel: {
    n: 'Ondulatório flexível',
    c: 'X',
    reps: 'escolhida pela recuperação do dia',
    desc: 'Bem recuperado: 4 a 6 repetições pesadas. Normal: 8 a 12. Cansado ou dormiu mal: 15 a 20 com carga leve.',
    desc2: 'descanso conforme a faixa escolhida',
    cor: '#14b8a6',
  },
  autorregulada: {
    n: 'Autorregulada (RIR)',
    c: 'A',
    reps: 'as do treino, carga pelo esforço',
    desc: 'Ajuste a carga para terminar cada série com 2 repetições sobrando (RIR 2). Sobrou mais? Aumente na próxima série. Sobrou menos? Diminua.',
    desc2: 'descanso normal',
    cor: '#d946ef',
  },
  conjugada: {
    n: 'Conjugada (Westside)',
    c: 'C',
    reps: 'muda a cada treino',
    desc: 'Treino A de esforço máximo (1 a 3 repetições bem pesadas), B de esforço dinâmico (carga média movida o mais rápido possível) e C de repetições (8 a 12).',
    desc2: 'descanso de 2 a 3 min nos pesados e explosivos',
    cor: '#f97316',
  },
};
// as 4 fases de carga (as outras duas são formas de organizar a semana)
const FASES_BASE = ['resistencia', 'hipertrofia', 'forca', 'potencia'];
// no ondulatório diário, a fase de cada treino sai da letra (A força, B hipertrofia, C resistência)
const faseDoTreino = (fase, t) => {
  if (fase !== 'ondulatorio' && fase !== 'conjugada') return fase;
  const l = (String((t && t.titulo) || '').match(/\b([A-Z])\b/) || [])[1] || 'B';
  if (fase === 'conjugada') return l === 'A' ? 'forca' : l === 'B' ? 'potencia' : 'hipertrofia'; // esforço máximo, dinâmico e repetições
  return l === 'A' ? 'forca' : l === 'C' ? 'resistencia' : 'hipertrofia';
};
const faseDaSemana = (alunoId, semana) =>
  sb
    .from('nx_forca_fases')
    .select('fase')
    .eq('aluno_id', alunoId)
    .eq('semana', semana)
    .maybeSingle()
    .then(
      (r) => (r.data && r.data.fase) || null,
      () => null,
    );
const faseCardHTML = (f, extra = '') => {
  const x = FASES_F[f];
  if (!x) return '';
  return `<div class="fase-card" style="--fc:${x.cor}"><div class="fase-l"><span class="fase-c">${x.c}</span></div><div class="grow" style="min-width:0"><span class="tiny dim">Semana de</span><b>${x.n}</b><div class="fase-meta"><span>${x.reps}</span><span>${x.desc2}</span></div><p class="small muted">${x.desc}</p>${extra}</div></div>`;
};
// PSR: percepção subjetiva de recuperação (Laurent et al., 2011), 0 a 10, antes do treino
const PSR_TXT = (n) =>
  n == null
    ? ''
    : n <= 1
      ? 'Muito cansado'
      : n <= 3
        ? 'Mal recuperado'
        : n <= 5
          ? 'Um pouco recuperado'
          : n <= 7
            ? 'Recuperado'
            : n <= 9
              ? 'Bem recuperado'
              : 'Totalmente recuperado';
const psrCor = (n) =>
  n == null ? 'var(--dim)' : n <= 3 ? '#ff8a8a' : n <= 5 ? '#ffcf5c' : n <= 7 ? '#46d6ff' : '#3ddc97';
// carga interna da sessão (Foster, 2001): PSE da sessão × duração em minutos, em unidades arbitrárias (UA)
const cargaSessao = (pse, min) => (pse == null || !min ? null : Math.round(pse * Math.min(min, 240)));
async function ultimasCargasFase(alunoId, exIds, fase) {
  if (!fase || !exIds.length) return {};
  const { data } = await sb
    .from('nx_registros')
    .select('exercicio_id,carga_kg,reps,criado_em')
    .eq('aluno_id', alunoId)
    .eq('fase', fase)
    .in('exercicio_id', exIds)
    .not('carga_kg', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(300)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const out = {};
  (data || []).forEach((r) => {
    if (!out[r.exercicio_id]) out[r.exercicio_id] = r;
  });
  return out;
}
// painel do treinador: carga semanal de força + corrida, PSR, PSE e cargas por fase
async function metricasForcaHTML(alunoId, semanaRef, sess) {
  const ini = somaDias(semanaRef, -49);
  const [corr, fases, regs] = await Promise.all([
    sb
      .from('nx_corridas')
      .select('data,duracao_s,rpe')
      .eq('aluno_id', alunoId)
      .gte('data', ini)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_forca_fases')
      .select('semana,fase')
      .eq('aluno_id', alunoId)
      .gte('semana', ini)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_registros')
      .select('exercicio_id,exercicio_nome,carga_kg,fase,criado_em')
      .eq('aluno_id', alunoId)
      .not('fase', 'is', null)
      .not('carga_kg', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(800)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const semanas = Array.from({ length: 8 }, (_, i) => somaDias(semanaRef, -7 * (7 - i)));
  const semDe = (iso) => isoDia(inicioSemana(new Date(iso)));
  const faseDe = Object.fromEntries(fases.map((f) => [f.semana, f.fase]));
  const W = semanas.map((k) => {
    const ss = sess.filter((x) => x.finalizado_em && semDe(x.iniciado_em) === k);
    const cc = corr.filter((c) => semDe(c.data) === k);
    const uaF = ss.reduce((a, x) => a + (cargaSessao(x.esforco, minutos(x.iniciado_em, x.finalizado_em)) || 0), 0);
    const uaC = cc.reduce((a, c) => a + (cargaSessao(c.rpe, Math.round((c.duracao_s || 0) / 60)) || 0), 0);
    const psr = ss.filter((x) => x.psr != null).map((x) => x.psr),
      pse = [
        ...ss.filter((x) => x.esforco != null).map((x) => x.esforco),
        ...cc.filter((c) => c.rpe != null).map((c) => c.rpe),
      ];
    return {
      k,
      uaF,
      uaC,
      tot: uaF + uaC,
      nF: ss.length,
      nC: cc.length,
      psr: psr.length ? psr.reduce((a, b) => a + b, 0) / psr.length : null,
      pse: pse.length ? pse.reduce((a, b) => a + b, 0) / pse.length : null,
      fase: faseDe[k] || null,
    };
  });
  const atual = W[W.length - 1],
    cron = W.slice(-5, -1).filter((w) => w.tot > 0);
  // mesmo cálculo do alerta de carga: últimos 7 dias x média das 4 semanas anteriores
  const acwr = calcCarga(corr, sess, Math.min(Date.now(), dia(somaDias(semanaRef, 7)).getTime())).acwr;
  const acwrTag = acwr == null ? '' : acwr > 1.5 ? 'err' : acwr > 1.3 ? 'warn' : acwr < 0.8 ? 'warn' : 'ok';
  const mx = Math.max(1, ...W.map((w) => w.tot));
  const barras = W.map((w) => {
    const fx = FASES_F[w.fase];
    return `<div class="mf-col ${w.k === semanaRef ? 'on' : ''}" title="${fmtCurto(w.k)}: força ${w.uaF} UA · corrida ${w.uaC} UA"><div class="mf-bar"><i class="c" style="height:${(w.uaC / mx) * 100}%"></i><i class="f" style="height:${(w.uaF / mx) * 100}%"></i></div><span class="mf-fase" ${fx ? `style="background:${fx.cor}"` : ''}>${fx ? fx.c : '–'}</span><small>${fmtCurto(w.k)}</small></div>`;
  }).join('');
  // última carga de cada exercício em cada fase
  const porEx = new Map();
  regs.forEach((r) => {
    const k = r.exercicio_id || r.exercicio_nome;
    if (!porEx.has(k)) porEx.set(k, { nome: r.exercicio_nome || 'Exercício', ult: r.criado_em, f: {} });
    const e = porEx.get(k);
    if (!e.f[r.fase]) e.f[r.fase] = r;
  });
  const exs = [...porEx.values()].slice(0, 10);
  const tabela = exs.length
    ? `<div class="mf-tab"><div class="mf-tr mf-th"><span>Exercício</span>${FASES_BASE.map((k) => FASES_F[k])
        .map((x) => `<span style="color:${x.cor}">${x.c}</span>`)
        .join(
          '',
        )}</div>${exs.map((e) => `<div class="mf-tr"><span class="ellip">${esc(e.nome)}</span>${FASES_BASE.map((f) => `<span>${e.f[f] ? `<b>${fN(+e.f[f].carga_kg)}</b>` : '<em>–</em>'}</span>`).join('')}</div>`).join('')}</div><p class="tiny dim" style="margin-top:6px">Última carga (kg) de cada exercício em cada fase: R resistência, H hipertrofia, F força, P potência.</p>`
    : '<p class="small muted">As cargas por fase aparecem aqui quando o aluno registrar treinos em semanas com fase definida.</p>';
  return `<div class="card mf-card"><div class="row between" style="gap:8px;flex-wrap:wrap"><b>Métricas da semana</b><span class="tiny dim">força + corrida</span></div>
    <div class="mf-kpis">
      <div><span>PSR antes do treino</span><b style="color:${psrCor(atual.psr)}">${atual.psr == null ? '–' : f1(atual.psr)}</b><small>${atual.psr == null ? 'sem registro' : PSR_TXT(Math.round(atual.psr))}</small></div>
      <div><span>PSE média</span><b style="color:${rpeCor(atual.pse == null ? null : Math.round(atual.pse))}">${atual.pse == null ? '–' : f1(atual.pse)}</b><small>${atual.nF} força · ${atual.nC} corrida</small></div>
      <div><span>Carga da semana</span><b>${atual.tot || '–'}</b><small>${atual.tot ? `${atual.uaF} força · ${atual.uaC} corrida (UA)` : 'PSE × minutos'}</small></div>
      <div><span>Aguda : crônica</span><b>${acwr == null ? '–' : f1(acwr) + 'x'}</b><small>${acwr == null ? 'precisa de mais semanas' : `<span class="tag ${acwrTag}">${acwr > 1.5 ? 'pico de carga' : acwr > 1.3 ? 'subiu rápido' : acwr < 0.8 ? 'abaixo do habitual' : 'faixa segura'}</span>`}</small></div>
    </div>
    <div class="mf-graf"><div class="mf-cols">${barras}</div><div class="mf-leg"><span><i class="f"></i>Força</span><span><i class="c"></i>Corrida</span><span class="dim">letra = fase da semana</span></div></div>
    <details class="mf-det"><summary>Cargas por fase</summary>${tabela}</details>
    <p class="tiny dim" style="margin-top:8px">Carga da sessão = PSE × minutos (Foster, 2001). Aguda : crônica = semana atual ÷ média das 4 anteriores, para acompanhar a tendência; nos estudos mais recentes ela não previu lesão sozinha (Impellizzeri et al. 2020; Frandsen et al. 2025). Na corrida, o que mais pesa é não fazer um treino mais de 10% maior que o mais longo dos últimos 30 dias.</p></div>`;
}

/* termômetro: cansaço e sono (0 bom · 1 médio · 2 ruim) */
const CORPO = {
  cansaco: ['Cansaço', ['Normal', 'Cansado', 'Muito cansado']],
  sono: ['Sono da última noite', ['Bom', 'Regular', 'Ruim']],
};
const corpoTags = (x) =>
  [
    x.cansaco ? `<span class="tag ${x.cansaco === 2 ? 'warn' : ''}">${CORPO.cansaco[1][x.cansaco]}</span>` : '',
    x.sono ? `<span class="tag ${x.sono === 2 ? 'warn' : ''}">Sono ${CORPO.sono[1][x.sono].toLowerCase()}</span>` : '',
  ].join('');
function corpoHTML(v = {}) {
  return `<div class="corpo">${Object.entries(CORPO)
    .map(
      ([k, [t, ops]]) =>
        `<div class="corpo-l"><span>${t}</span><div class="seg sm" data-corpo="${k}">${ops.map((o, i) => `<button type="button" data-v="${i}" class="${v[k] === i ? 'on' + (i === 2 ? ' alert' : '') : ''}">${o}</button>`).join('')}</div></div>`,
    )
    .join('')}</div>`;
}
function bindCorpo(root, v) {
  root.querySelectorAll('[data-corpo]').forEach(
    (g) =>
      (g.onclick = (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        const k = g.dataset.corpo,
          n = +b.dataset.v;
        v[k] = v[k] === n ? null : n;
        g.querySelectorAll('button').forEach((x) => {
          const on = +x.dataset.v === v[k];
          x.classList.toggle('on', on);
          x.classList.toggle('alert', on && v[k] === 2);
        });
      }),
  );
}
function abrirCheckin(t, itens, st, key, fase) {
  let esforco = null,
    dor = false;
  const corpo = {};
  openSheet(
    `
    <div id="ck-1"><p class="eyebrow center">Treino finalizado</p><div class="h2 center" style="margin-top:4px">Qual foi o esforço do treino?</div>
      ${esforcoHTML(null)}
      <button class="btn block" id="ck-prox">Próximo</button>
      <button class="btn ghost block" data-close style="margin-top:8px">Voltar ao treino</button></div>
    <div id="ck-2" hidden><button type="button" class="back" id="ck-volta" style="background:none;border:0;padding:0">${I.back} Esforço</button>
    <p class="eyebrow" style="margin-top:8px">Check-in</p><div class="h2" style="margin-top:4px">E o corpo, como está?</div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Sentiu alguma dor?</span>
      <div class="seg" style="margin-top:8px"><button type="button" class="on" data-dor="0">Não</button><button type="button" data-dor="1">Sim</button></div>
      <input class="input" id="dor-local" placeholder="Onde? Ex.: joelho direito" style="margin-top:12px" hidden></div>
    ${corpoHTML()}
    <label class="field" style="margin-top:16px"><span>Quer deixar um recado pro treinador? (opcional)</span><textarea class="textarea" id="coment" placeholder="Ex.: senti o ombro no supino"></textarea></label>
    <button class="btn block" id="salvar-sessao">Salvar treino ${I.check}</button></div>`,
    (root) => {
      bindEsforco(root, (n) => {
        esforco = n;
      });
      passosCheckin(root, () => esforco);
      root.querySelectorAll('[data-dor]').forEach(
        (b) =>
          (b.onclick = () => {
            dor = b.dataset.dor === '1';
            root.querySelectorAll('[data-dor]').forEach((x) => x.classList.toggle('on', x === b));
            b.classList.toggle('alert', dor);
            root.querySelector('#dor-local').hidden = !dor;
          }),
      );
      bindCorpo(root, corpo);
      root.querySelector('#salvar-sessao').onclick = async (e) => {
        if (esforco == null) return toast('Escolha o esforço de 0 a 10.', true);
        const btn = e.currentTarget;
        btn.disabled = true;
        const comentario = root.querySelector('#coment').value.trim() || null;
        const { data: ses, error } = await sb
          .from('nx_sessoes')
          .insert({
            org_id: S.org.id,
            aluno_id: S.user.id,
            treino_id: t.id,
            treino_titulo: t.titulo,
            iniciado_em: st.ini || new Date().toISOString(),
            finalizado_em: new Date().toISOString(),
            itens_feitos: st.feitos,
            total_itens: itens.length,
            esforco,
            dor,
            dor_local: dor ? root.querySelector('#dor-local').value.trim() || null : null,
            comentario,
            cansaco: corpo.cansaco ?? null,
            sono: corpo.sono ?? null,
            psr: st.psr ?? null,
            fase: fase || null,
          })
          .select('id')
          .single();
        if (error || !ses) {
          btn.disabled = false;
          return toast('Não foi possível salvar. Verifique a internet.', true);
        }
        const regs = itens
          .map((it) => ({
            org_id: S.org.id,
            aluno_id: S.user.id,
            sessao_id: ses.id,
            treino_item_id: it.id,
            exercicio_id: it.exercicio_id,
            exercicio_nome: (it.nx_exercicios || {}).nome || null,
            carga_kg: numCarga(st.cargas[it.id]),
            reps: it.repeticoes || null,
            feito: st.feitos.includes(it.id),
            fase: fase || null,
          }))
          .filter((r) => r.feito || r.carga_kg != null);
        if (regs.length) await sb.from('nx_registros').insert(regs);
        notificar('checkin', ses.id);
        const novasCargas = regs.filter((r) => r.carga_kg != null).length;
        const ua = cargaSessao(esforco, minutos(st.ini || new Date().toISOString(), new Date().toISOString()));
        store.del(key);
        closeSheet();
        $app.innerHTML = `<section class="login center"><div class="slashes" style="justify-content:center;margin:0 auto 18px"><i></i><i></i><i></i></div><h1 class="h1">Treino concluído!</h1><p class="muted" style="margin:10px 0 6px">Seu treinador já recebeu o seu check-in.</p>${ua ? `<p class="small" style="margin-bottom:6px">Carga da sessão: <b>${ua} UA</b> <span class="dim">(esforço ${esforco} × ${minutos(st.ini || new Date().toISOString(), new Date().toISOString())} min)</span></p>` : ''}${novasCargas ? `<p class="small" style="margin-bottom:24px">${novasCargas} carga${novasCargas > 1 ? 's' : ''} registrada${novasCargas > 1 ? 's' : ''} na sua evolução.</p>` : '<div style="height:18px"></div>'}<a class="btn" href="#/">Voltar ao início</a><a class="btn ghost" href="#/historico/cargas" style="margin-top:12px">Ver minha evolução</a></section>`;
      };
    },
  );
}

/* ================= EVOLUÇÃO: cargas, avaliações e conversa ================= */
const num = (v) => {
  if (v === '' || v == null) return null;
  const n = +String(v).replace(',', '.');
  return isFinite(n) ? n : null;
};
// altura: a pessoa digita em metros (1,75); o banco e os cálculos seguem em cm (175)
const altCm = (v) => {
  const n = num(v);
  if (n == null) return null;
  return n < 3 ? Math.round(n * 100) : Math.round(n);
};
const altM = (cm) => (cm == null || cm === '' ? '' : (num(cm) / 100).toFixed(2).replace('.', ','));
const f1 = (n, d = 1) => (n == null || !isFinite(n) ? '–' : (+n).toFixed(d).replace('.', ','));
const fN = (n, d = 1) => f1(n, Math.abs((Math.round(n * 10 ** d) / 10 ** d) % 1) < 1e-9 ? 0 : d);
const dia = (d) => new Date(String(d).length === 10 ? d + 'T12:00:00' : d);
const fmtDia = (d) =>
  dia(d)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ de /g, ' ')
    .replace('.', '');
const fmtCurto = (d) => dia(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const hojeISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const somaDias = (iso, n) => {
  const d = dia(iso);
  d.setDate(d.getDate() + n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** gráfico de linha em SVG (mini = sparkline) */
function grafico(pts, { mini = false, unid = '', dec = 1, fmt = null } = {}) {
  if (!pts.length) return '';
  const W = mini ? 120 : 320,
    H = mini ? 38 : 140,
    pl = mini ? 3 : 10,
    pr = mini ? 3 : 10,
    pt = mini ? 5 : 22,
    pb = mini ? 5 : 22;
  const ys = pts.map((p) => p.y);
  let lo = Math.min(...ys),
    hi = Math.max(...ys);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.15;
  lo -= pad;
  hi += pad;
  const X = (i) => (pts.length === 1 ? W / 2 : pl + (i * (W - pl - pr)) / (pts.length - 1));
  const Y = (v) => pt + ((hi - v) * (H - pt - pb)) / (hi - lo);
  const line = pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  let s = `<svg class="chart${mini ? ' mini' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolução">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--acc)" stop-opacity=".28"/><stop offset="1" style="stop-color:var(--acc)" stop-opacity="0"/></linearGradient></defs>`;
  if (!mini) s += `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" style="stroke:var(--line2)"/>`;
  if (pts.length > 1)
    s += `<polygon points="${X(0).toFixed(1)},${H - pb} ${line} ${X(pts.length - 1).toFixed(1)},${H - pb}" fill="url(#${gid})"/><polyline points="${line}" fill="none" style="stroke:var(--acc)" stroke-width="${mini ? 2 : 2.5}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  const iMax = ys.indexOf(Math.max(...ys));
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    if (mini) {
      if (last) s += `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3" style="fill:var(--acc)"/>`;
      return;
    }
    s += `<circle cx="${X(i)}" cy="${Y(p.y)}" r="${last ? 4.5 : 3}" style="fill:${last ? 'var(--acc)' : 'var(--bg2)'};stroke:var(--acc)" stroke-width="2"/>`;
    if (pts.length <= 8 || last || i === 0 || i === iMax)
      s += `<text x="${X(i)}" y="${Y(p.y) - 9}" text-anchor="middle" class="cv">${fmt ? fmt(p.y) : f1(p.y, p.y % 1 ? dec : 0) + unid}</text>`;
  });
  if (!mini) {
    s += `<text x="${X(0)}" y="${H - 6}" text-anchor="${pts.length === 1 ? 'middle' : 'start'}" class="cx">${esc(pts[0].x)}</text>`;
    if (pts.length > 1)
      s += `<text x="${X(pts.length - 1)}" y="${H - 6}" text-anchor="end" class="cx">${esc(pts[pts.length - 1].x)}</text>`;
  }
  return s + '</svg>';
}

/* ---------- cargas ---------- */
async function buscarRegistros(alunoId) {
  const { data, error } = await sb
    .from('nx_registros')
    .select('exercicio_id,exercicio_nome,carga_kg,reps,criado_em,sessao_id')
    .eq('aluno_id', alunoId)
    .not('carga_kg', 'is', null)
    .order('criado_em')
    .limit(3000);
  if (error) throw error;
  return data || [];
}
function agruparCargas(regs) {
  const m = new Map();
  regs.forEach((r) => {
    const k = r.exercicio_id || r.exercicio_nome;
    if (!m.has(k)) m.set(k, { nome: r.exercicio_nome || 'Exercício', regs: [] });
    const g = m.get(k);
    if (r.exercicio_nome) g.nome = r.exercicio_nome;
    g.regs.push(r);
  });
  return [...m.values()]
    .map((g) => {
      const porSes = new Map();
      g.regs.forEach((r) => {
        const k = r.sessao_id || r.criado_em;
        const c = porSes.get(k);
        if (!c || +r.carga_kg > +c.carga_kg) porSes.set(k, r);
      });
      const pts = [...porSes.values()].sort((a, b) => (a.criado_em < b.criado_em ? -1 : 1));
      const ys = pts.map((p) => +p.carga_kg);
      const melhor = Math.max(...ys);
      const antes = pts.filter((p) => diasDesde(p.criado_em) >= 30).map((p) => +p.carga_kg);
      const recorde =
        pts.length > 1 &&
        diasDesde(pts[ys.lastIndexOf(melhor)].criado_em) < 30 &&
        (!antes.length || melhor > Math.max(...antes));
      return {
        ...g,
        pts,
        ultima: ys[ys.length - 1],
        primeira: ys[0],
        melhor,
        recorde,
        quando: pts[pts.length - 1].criado_em,
      };
    })
    .sort((a, b) => (a.quando < b.quando ? 1 : -1));
}
function deltaTag(d, bom = 'up', unid = '', dec = 1) {
  if (d == null || !isFinite(d) || Math.abs(d) < 0.05) return '<span class="delta">=</span>';
  const cls = bom === 'up' ? (d > 0 ? 'good' : 'bad') : bom === 'down' ? (d < 0 ? 'good' : 'bad') : '';
  return `<span class="delta ${cls}">${d > 0 ? '▲ +' : '▼ '}${fN(Math.abs(d), dec)}${unid}</span>`;
}
function cargasHTML(grupos, staff) {
  if (!grupos.length)
    return `<div class="empty"><div class="h3">Nenhuma carga registrada ainda</div><p class="small">${staff ? 'Quando o aluno anotar a carga durante o treino, a evolução aparece aqui.' : 'Durante o treino, anote a carga que você usou em cada exercício. A sua evolução aparece aqui.'}</p></div>`;
  const rec = grupos.filter((g) => g.recorde).length;
  const subiu = grupos.filter((g) => g.ultima > g.primeira).length;
  return `<div class="stats"><div class="stat"><b>${grupos.length}</b><span>exercícios acompanhados</span></div><div class="stat"><b>${subiu}</b><span>com carga maior que no início</span></div><div class="stat"><b style="color:${rec ? 'var(--acc)' : 'inherit'}">${rec}</b><span>recordes nos últimos 30 dias</span></div></div>
    <div class="cols" style="margin-top:12px">${grupos
      .map(
        (g, i) => `
    <button type="button" class="card tap lift" data-lift="${i}">
      <div class="grow" style="min-width:0">
        <b class="lift-t">${esc(g.nome)}</b>
        <div class="lift-n"><b>${fmtKg(g.ultima)}</b>${g.pts.length > 1 ? deltaTag(g.ultima - g.primeira, 'up', ' kg') : ''}</div>
        ${g.recorde ? '<span class="tag acc" style="margin-bottom:4px">recorde recente</span><br>' : ''}<span class="tiny dim">melhor ${fmtKg(g.melhor)} · ${g.pts.length} ${g.pts.length === 1 ? 'treino' : 'treinos'} · ${quando(g.quando)}</span>
      </div>
      ${
        g.pts.length > 1
          ? grafico(
              g.pts.map((p) => ({ x: fmtCurto(p.criado_em), y: +p.carga_kg })),
              { mini: true },
            )
          : '<span class="tiny dim" style="flex:none">1º registro</span>'
      }
    </button>`,
      )
      .join('')}</div>`;
}
function bindCargas(root, grupos) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lift]');
    if (!b) return;
    const g = grupos[+b.dataset.lift];
    openSheet(`<p class="eyebrow">Evolução de carga</p><div class="h2" style="margin-top:4px">${esc(g.nome)}</div>
      <div class="row" style="gap:8px;margin:12px 0;flex-wrap:wrap"><span class="tag acc">atual ${fmtKg(g.ultima)}</span><span class="tag">melhor ${fmtKg(g.melhor)}</span><span class="tag">início ${fmtKg(g.primeira)}</span></div>
      <div class="card" style="padding:12px 8px">${grafico(
        g.pts.map((p) => ({ x: fmtCurto(p.criado_em), y: +p.carga_kg })),
        { unid: '' },
      )}</div>
      <div class="section" style="margin-top:16px"><span class="small muted" style="font-weight:700">Registros</span>
      <div class="tbl" style="margin-top:8px">${[...g.pts]
        .reverse()
        .map(
          (p, i, arr) =>
            `<div><span>${fmtDia(p.criado_em)}</span><span class="dim">${p.reps ? esc(p.reps) + ' reps' : ''}</span><b>${fmtKg(p.carga_kg)}</b>${arr[i + 1] ? deltaTag(+p.carga_kg - +arr[i + 1].carga_kg, 'up', '') : '<span></span>'}</div>`,
        )
        .join('')}</div></div>
      <button class="btn ghost block" data-close style="margin-top:16px">Fechar</button>`);
  });
}
