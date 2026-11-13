/* Nexos App · Dashboard da equipe: todas as planilhas liberadas na semana, o que cada aluno já fez e quando abriu o app.
   Tem também o modo demonstração (alunos fictícios, com o selo "Demonstração" sempre na tela), usado no site.
   As funções dash* deste arquivo não dependem do resto do app, para a página de demonstração do site carregar só ele. */

/* dash:puro:inicio */
const dashEsc = (s) =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const dashDia = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dashSoma = (iso, n) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dashDia(d.getTime());
};
// segunda-feira da semana de um dia (AAAA-MM-DD)
const dashSegunda = (ms) => {
  const d = new Date(ms);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dashDia(d.getTime());
};
const dashIniciais = (n) =>
  String(n || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
const dashQuando = (ms, agora) => {
  if (!ms) return 'nunca';
  const min = Math.max(0, Math.round((agora - ms) / 60000));
  if (min < 60) return min < 2 ? 'agora há pouco' : `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
};

/** junta os dados da semana em números do topo e uma linha por aluno.
 *  d = { agora (ms), alunos [{id,nome,foto_url,ultimo_acesso}], plano [{aluno_id,data,tipo,liberado}],
 *        forca [{aluno_id,semana}], treinos [{aluno_id,quando (ms),km,dor}] } */
function dashMontar(d) {
  const seg = dashSegunda(d.agora),
    dom = dashSoma(seg, 6),
    segProx = dashSoma(seg, 7),
    domProx = dashSoma(seg, 13);
  const linhas = d.alunos.map((a) => {
    const pl = d.plano.filter((p) => p.aluno_id === a.id);
    const semana = pl.filter((p) => p.data >= seg && p.data <= dom),
      prox = pl.filter((p) => p.data >= segProx && p.data <= domProx);
    const libC = semana.filter((p) => p.liberado !== false);
    const corrida = libC.length ? 'liberada' : semana.length ? 'rascunho' : null;
    const fs = d.forca.filter((f) => f.aluno_id === a.id);
    const forca = fs.some((f) => f.semana === seg);
    const proxLib = prox.some((p) => p.liberado !== false) || fs.some((f) => f.semana === segProx);
    const tr = d.treinos.filter((t) => t.aluno_id === a.id);
    const naSemana = tr.filter((t) => dashDia(t.quando) >= seg && dashDia(t.quando) <= dom);
    const previstos = libC.filter((p) => p.tipo !== 'folga' && p.tipo !== 'forca').length;
    const ult = tr.reduce((m, t) => Math.max(m, t.quando), 0);
    const viu = a.ultimo_acesso ? Date.parse(a.ultimo_acesso) : 0;
    return {
      id: a.id,
      nome: a.nome,
      foto_url: a.foto_url || null,
      corrida,
      forca,
      liberada: corrida === 'liberada' || forca,
      prox: proxLib,
      feitos: naSemana.length,
      previstos,
      km: naSemana.reduce((s, t) => s + (t.km || 0), 0),
      dor: naSemana.some((t) => t.dor),
      ultimo: ult || null,
      viu: viu || null,
      viuSemana: !!viu && dashDia(viu) >= seg,
    };
  });
  const soma = (f) => linhas.reduce((s, l) => s + f(l), 0);
  const prevTot = soma((l) => l.previstos),
    feitosDaPlanilha = soma((l) => Math.min(l.feitos, l.previstos));
  return {
    seg,
    dom,
    agora: d.agora,
    k: {
      ativos: linhas.length,
      liberadas: soma((l) => (l.liberada ? 1 : 0)),
      corrida: soma((l) => (l.corrida === 'liberada' ? 1 : 0)),
      forca: soma((l) => (l.forca ? 1 : 0)),
      prox: soma((l) => (l.prox ? 1 : 0)),
      feitos: soma((l) => l.feitos),
      previstos: prevTot,
      cumprido: prevTot ? Math.round((feitosDaPlanilha / prevTot) * 100) : null,
      km: soma((l) => l.km),
      viram: soma((l) => (l.viuSemana ? 1 : 0)),
      dor: soma((l) => (l.dor ? 1 : 0)),
    },
    linhas: linhas.sort((a, b) => b.liberada - a.liberada || a.nome.localeCompare(b.nome, 'pt-BR')),
  };
}

// alunos fictícios para a demonstração: sempre os mesmos para o mesmo número (sorteio com semente fixa)
const DASH_NOMES = [
  'Ana',
  'Bruno',
  'Camila',
  'Diego',
  'Elisa',
  'Felipe',
  'Gabriela',
  'Heitor',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Marina',
  'Nicolas',
  'Olívia',
  'Pedro',
  'Rafaela',
  'Samuel',
  'Talita',
  'Vítor',
  'Yasmin',
  'André',
  'Beatriz',
  'Caio',
  'Débora',
  'Eduardo',
  'Fernanda',
  'Gustavo',
  'Helena',
  'Igor',
  'Júlia',
  'Leonardo',
  'Mariana',
  'Otávio',
  'Paula',
  'Renato',
  'Sofia',
  'Thiago',
  'Valéria',
  'Wesley',
];
const DASH_SOBRENOMES = [
  'Almeida',
  'Barros',
  'Cardoso',
  'Duarte',
  'Esteves',
  'Freitas',
  'Gomes',
  'Holanda',
  'Lima',
  'Macedo',
  'Nogueira',
  'Oliveira',
  'Pacheco',
  'Queiroz',
  'Ramos',
  'Sales',
  'Teixeira',
  'Vasconcelos',
  'Xavier',
  'Moura',
];
function dashDemoDados(n, agora) {
  let s = 917 + n;
  const r = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const seg = dashSegunda(agora),
    hojeIdx = Math.round((new Date(dashDia(agora) + 'T12:00:00') - new Date(seg + 'T12:00:00')) / 864e5);
  const alunos = [],
    plano = [],
    forca = [],
    treinos = [];
  const usados = new Set();
  for (let i = 0; i < n; i++) {
    let nome;
    do
      nome = `${DASH_NOMES[Math.floor(r() * DASH_NOMES.length)]} ${DASH_SOBRENOMES[Math.floor(r() * DASH_SOBRENOMES.length)]}`;
    while (usados.has(nome) && usados.size < DASH_NOMES.length * DASH_SOBRENOMES.length);
    usados.add(nome);
    const id = 'demo-' + i;
    const corre = r() < 0.85,
      fazForca = r() < 0.6,
      libera = r() < 0.9;
    alunos.push({ id, nome, ultimo_acesso: new Date(agora - r() * (r() < 0.8 ? 3 : 12) * 864e5).toISOString() });
    if (corre) {
      const dias = [1, 3, 5, r() < 0.5 ? 6 : 0].filter((x, j, a) => a.indexOf(x) === j);
      dias.forEach((dd, j) => {
        plano.push({
          aluno_id: id,
          data: dashSoma(seg, dd),
          tipo: j === dias.length - 1 ? 'longao' : 'rodagem',
          liberado: libera,
        });
        if (r() < 0.75) plano.push({ aluno_id: id, data: dashSoma(seg, 7 + dd), tipo: 'rodagem', liberado: r() < 0.7 });
        if (libera && dd <= hojeIdx && r() < 0.82)
          treinos.push({
            aluno_id: id,
            quando: new Date(dashSoma(seg, dd) + 'T06:30:00').getTime(),
            km: Math.round((4 + r() * (j === dias.length - 1 ? 14 : 6)) * 10) / 10,
            dor: r() < 0.05,
          });
      });
    }
    if (fazForca && (libera || !corre)) {
      forca.push({ aluno_id: id, semana: seg });
      if (r() < 0.6) forca.push({ aluno_id: id, semana: dashSoma(seg, 7) });
      [0, 2, 4].forEach((dd) => {
        if (dd <= hojeIdx && r() < 0.7)
          treinos.push({
            aluno_id: id,
            quando: new Date(dashSoma(seg, dd) + 'T18:00:00').getTime(),
            km: 0,
            dor: false,
          });
      });
    }
  }
  return { agora, alunos, plano, forca, treinos };
}

const DASH_GRAF_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
const DASH_IC = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  busca:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
};
const dashFmt = (n, c = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
const dashDataCurta = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

/** tela do dashboard. demo = true mostra o selo e (no app) o campo da quantidade de alunos fictícios */
function dashHTML(M, { demo = false, n = 0, link = true, campoQtd = true } = {}) {
  const k = M.k;
  const kpi = (v, t, sub, cls = '') =>
    `<div class="db-k ${cls}"><b>${v}</b><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const av = (l) =>
    `<span class="av sm${l.foto_url ? ' com-foto' : ''}">${l.foto_url ? `<img src="${dashEsc(l.foto_url)}" alt="" loading="lazy">` : dashEsc(dashIniciais(l.nome))}</span>`;
  const linha = (l) => {
    const pct = l.previstos ? Math.min(100, Math.round((l.feitos / l.previstos) * 100)) : l.feitos ? 100 : 0;
    const chips = [
      l.corrida === 'liberada'
        ? `<span class="db-c ok">${DASH_IC.ok}Corrida</span>`
        : l.corrida === 'rascunho'
          ? '<span class="db-c rasc">Corrida em rascunho</span>'
          : '',
      l.forca ? `<span class="db-c ok">${DASH_IC.ok}Força</span>` : '',
      l.prox ? '<span class="db-c prox">Próxima semana pronta</span>' : '',
      l.dor ? '<span class="db-c dor">Dor</span>' : '',
      !l.liberada && !l.corrida ? '<span class="db-c sem">Sem planilha liberada</span>' : '',
    ].join('');
    const tag = link && !demo ? 'a' : 'div';
    return `<${tag} class="db-l" data-db-l="${l.liberada ? 'lib' : 'pend'}" data-nome="${dashEsc(l.nome.toLowerCase())}"${tag === 'a' ? ` href="#/aluno/${l.id}"` : ''}>
      ${av(l)}<div class="db-l-m"><b class="db-l-n">${dashEsc(l.nome)}</b><div class="db-chips">${chips}</div>
      <div class="db-bar" title="Treinos feitos na semana"><i style="width:${pct}%"></i></div>
      <div class="db-l-s">${l.feitos} treino${l.feitos === 1 ? '' : 's'} feito${l.feitos === 1 ? '' : 's'}${l.previstos ? ` de ${l.previstos} de corrida na planilha` : ''}${l.km ? ` · ${dashFmt(l.km, 1)} km` : ''} · viu o app ${dashQuando(l.viu, M.agora)}</div></div>${tag === 'a' ? DASH_IC.chev : ''}</${tag}>`;
  };
  const pend = k.ativos - k.liberadas;
  return `${demo ? `<div class="db-selo" role="note"><b>Demonstração</b><span>Todos os alunos desta tela são fictícios, gerados só para mostrar como o painel funciona.</span></div>` : ''}
    <p class="eyebrow">Semana de ${dashDataCurta(M.seg)} a ${dashDataCurta(M.dom)}</p><h1 class="h1">Dashboard</h1>
    <p class="muted small" style="margin-top:6px">As planilhas liberadas da semana, o que cada aluno já fez e quando abriu o app.</p>
    ${demo && campoQtd ? `<label class="db-qtd">Alunos fictícios na demonstração<input type="number" id="db-qtd" min="1" max="300" value="${n}" inputmode="numeric"></label>` : ''}
    <div class="db-ks">
      ${kpi(dashFmt(k.liberadas), k.liberadas === 1 ? 'planilha liberada' : 'planilhas liberadas', `de ${dashFmt(k.ativos)} aluno${k.ativos === 1 ? '' : 's'}`, 'destaque')}
      ${kpi(dashFmt(k.feitos), k.feitos === 1 ? 'treino feito' : 'treinos feitos', 'nesta semana')}
      ${kpi(k.cumprido == null ? '-' : k.cumprido + '%', 'da corrida cumprida', k.previstos ? `${dashFmt(k.previstos)} treinos na planilha` : 'nada previsto ainda')}
      ${kpi(dashFmt(k.km, 0), 'km corridos', 'somando todos')}
      ${kpi(dashFmt(k.viram), 'abriram o app', 'nesta semana')}
      ${kpi(dashFmt(k.prox), 'com a próxima semana', 'já liberada')}
    </div>
    <div class="db-split"><span><b>${dashFmt(k.corrida)}</b> com corrida</span><span><b>${dashFmt(k.forca)}</b> com força</span>${k.dor ? `<span class="err"><b>${dashFmt(k.dor)}</b> com dor</span>` : ''}${pend ? `<span><b>${dashFmt(pend)}</b> sem planilha liberada</span>` : ''}</div>
    <div class="db-ferr"><div class="db-filtro" role="tablist">
      <button type="button" class="on" data-db-f="todos">Todos <small>${k.ativos}</small></button>
      <button type="button" data-db-f="lib">Liberadas <small>${k.liberadas}</small></button>
      <button type="button" data-db-f="pend">Sem planilha <small>${pend}</small></button></div>
      <label class="db-busca">${DASH_IC.busca}<input type="search" id="db-q" placeholder="Buscar aluno" autocomplete="off"></label></div>
    <div class="db-lista" id="db-lista">${M.linhas.length ? M.linhas.map(linha).join('') : '<p class="small muted">Nenhum aluno ativo ainda.</p>'}</div>
    <p class="small muted db-vazio" id="db-vazio" hidden>Nenhum aluno neste filtro.</p>`;
}

/** feedbacks: os treinos em que o treinador tocou em Visto (o aluno é avisado de que o treino foi analisado).
 *  d = { agora, treinos [{aluno_id, nome, foto_url, tipo ('corrida'|'forca'), titulo, quando (ms), km, visto, comentario}] } */
const DASH_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dashFeedMontar(d) {
  const seg = dashSegunda(d.agora),
    mes = dashDia(d.agora).slice(0, 7);
  const vistos = d.treinos.filter((t) => t.visto).sort((a, b) => b.quando - a.quando);
  const meses = [];
  const ag = new Date(d.agora);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(ag.getFullYear(), ag.getMonth() - i, 15);
    const chave = dashDia(m.getTime()).slice(0, 7);
    meses.push({
      chave,
      rot: DASH_MESES[m.getMonth()],
      n: vistos.filter((t) => dashDia(t.quando).slice(0, 7) === chave).length,
    });
  }
  return {
    agora: d.agora,
    k: {
      vistos: vistos.length,
      recebidos: d.treinos.length,
      pct: d.treinos.length ? Math.round((vistos.length / d.treinos.length) * 100) : null,
      comentados: vistos.filter((t) => t.comentario).length,
      mes: vistos.filter((t) => dashDia(t.quando).slice(0, 7) === mes).length,
      semana: vistos.filter((t) => dashDia(t.quando) >= seg).length,
      alunos: new Set(vistos.map((t) => t.aluno_id)).size,
      corrida: vistos.filter((t) => t.tipo === 'corrida').length,
      forca: vistos.filter((t) => t.tipo === 'forca').length,
      km: vistos.reduce((s, t) => s + (t.km || 0), 0),
    },
    meses,
    recentes: vistos.slice(0, 30),
  };
}
function dashFeedHTML(F, { anonimo = false } = {}) {
  const k = F.k;
  const kpi = (v, t, sub, cls = '') =>
    `<div class="db-k ${cls}"><b>${v}</b><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const max = Math.max(1, ...F.meses.map((m) => m.n));
  const nome = (t) => (anonimo ? 'Atleta Nexos' : dashEsc(String(t.nome || 'Aluno').split(/\s+/)[0]));
  const av = (t) =>
    anonimo
      ? '<span class="av sm db-anon"></span>'
      : `<span class="av sm${t.foto_url ? ' com-foto' : ''}">${t.foto_url ? `<img src="${dashEsc(t.foto_url)}" alt="" loading="lazy">` : dashEsc(dashIniciais(t.nome))}</span>`;
  const dataTxt = (ms) => {
    const x = new Date(ms);
    return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
  };
  return `<p class="eyebrow">Feedbacks da equipe</p><h1 class="h1">Dashboard</h1>
    <p class="muted small" style="margin-top:6px">Cada treino analisado pelo treinador, com o aviso de Visto para o aluno.</p>
    <div class="db-ks">
      ${kpi(dashFmt(k.vistos), k.vistos === 1 ? 'treino analisado' : 'treinos analisados', k.pct != null ? `${k.pct}% de tudo que os alunos registraram` : '', 'destaque')}
      ${kpi(dashFmt(k.mes), 'neste mês', `${dashFmt(k.semana)} nesta semana`)}
      ${kpi(dashFmt(k.alunos), k.alunos === 1 ? 'atleta acompanhado' : 'atletas acompanhados', 'com feedback')}
      ${kpi(dashFmt(k.km, 0), 'km analisados', 'em corridas vistas')}
      ${kpi(dashFmt(k.corrida), k.corrida === 1 ? 'corrida ou caminhada' : 'corridas e caminhadas', 'analisadas')}
      ${kpi(dashFmt(k.forca), k.forca === 1 ? 'treino de força' : 'treinos de força', 'analisados')}
    </div>
    ${k.comentados ? `<div class="db-split"><span><b>${dashFmt(k.comentados)}</b> com comentário escrito do treinador</span></div>` : ''}
    <div class="card db-graf"><span class="small muted" style="font-weight:700">Treinos analisados por mês</span>
      <div class="db-cols">${F.meses.map((m) => `<div class="db-col"><small>${m.n}</small><i style="height:${Math.round((m.n / max) * 100)}%"></i><span>${m.rot}</span></div>`).join('')}</div></div>
    <p class="sec-lbl" style="margin-top:18px">Últimos feedbacks</p>
    <div class="db-lista">${
      F.recentes.length
        ? F.recentes
            .map(
              (t) =>
                `<div class="db-l db-f">${av(t)}<div class="db-l-m"><b class="db-l-n">${nome(t)}</b><div class="db-l-s">${dashEsc(t.titulo || (t.tipo === 'corrida' ? 'Corrida' : 'Treino de força'))}${t.km ? ` de ${dashFmt(t.km, 1)} km` : ''} · ${dataTxt(t.quando)}</div>${t.comentario && !anonimo ? `<div class="db-com">${dashEsc(t.comentario)}</div>` : ''}</div><span class="db-visto">${DASH_IC.ok}Visto</span></div>`,
            )
            .join('')
        : '<p class="small muted">Nenhum treino analisado ainda. Toque em Visto nos treinos dos alunos, na tela Hoje.</p>'
    }</div>`;
}
/* dash:puro:fim */

// filtros e busca da lista (no app e na página do site)
function dashLigar(raiz) {
  let f = 'todos';
  const q = raiz.querySelector('#db-q');
  const aplicar = () => {
    const t = (q.value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let n = 0;
    raiz.querySelectorAll('.db-l').forEach((el) => {
      const nome = el.dataset.nome.normalize('NFD').replace(/[̀-ͯ]/g, '');
      const ok = (f === 'todos' || el.dataset.dbL === f) && (!t || nome.split(' ').some((p) => p.startsWith(t)));
      el.hidden = !ok;
      if (ok) n++;
    });
    raiz.querySelector('#db-vazio').hidden = !!n;
  };
  raiz.querySelectorAll('[data-db-f]').forEach((b) =>
    b.addEventListener('click', () => {
      f = b.dataset.dbF;
      raiz.querySelectorAll('[data-db-f]').forEach((x) => x.classList.toggle('on', x === b));
      aplicar();
    }),
  );
  q.addEventListener('input', aplicar);
}

// rota #/dashboard (feedbacks), #/dashboard/planilhas (dados reais) e #/dashboard/demo (alunos fictícios)
const dashAbas = (atual) =>
  `<div class="db-abas"><a href="#/dashboard" class="${atual === 'feed' ? 'on' : ''}">Feedbacks</a><a href="#/dashboard/planilhas" class="${atual !== 'feed' ? 'on' : ''}">Planilhas</a></div>`;
async function staffDashboard(modo) {
  if (!modo) return staffDashFeedbacks();
  const demo = modo === 'demo';
  let M,
    n = 0;
  if (demo) {
    try {
      n = +localStorage.getItem('nx-dash-demo') || 62;
    } catch {
      n = 62;
    }
    M = dashMontar(dashDemoDados(n, Date.now()));
  } else {
    loading();
    const seg = isoDia(inicioSemana()),
      ini = somaDias(seg, -21),
      fim = somaDias(seg, 13),
      iniTs = new Date(ini + 'T00:00:00').toISOString();
    const [{ data: mem }, { data: pl }, { data: fs }, { data: ss }, { data: cs }] = await Promise.all([
      sb
        .from('nx_membros')
        .select('user_id,nome,foto_url,ultimo_acesso,ativo,aprovacao,treinador_id')
        .eq('org_id', S.org.id)
        .eq('papel', 'aluno'),
      sb
        .from('nx_plano_corrida')
        .select('aluno_id,data,tipo,liberado')
        .eq('org_id', S.org.id)
        .gte('data', seg)
        .lte('data', fim)
        .limit(5000),
      sb.from('nx_forca_semanas').select('aluno_id,semana').eq('org_id', S.org.id).gte('semana', seg),
      sb
        .from('nx_sessoes')
        .select('aluno_id,iniciado_em,dor')
        .eq('org_id', S.org.id)
        .not('finalizado_em', 'is', null)
        .gte('iniciado_em', iniTs)
        .limit(5000),
      sb
        .from('nx_corridas')
        .select('aluno_id,data,tipo,distancia_m,dor')
        .eq('org_id', S.org.id)
        .gte('data', iniTs)
        .limit(5000),
    ]);
    const alunos = (mem || []).filter((m) => m.ativo && m.aprovacao !== 'pendente' && ehMeuAluno(m));
    M = dashMontar({
      agora: Date.now(),
      alunos: alunos.map((m) => ({
        id: m.user_id,
        nome: m.nome || 'Aluno',
        foto_url: m.foto_url,
        ultimo_acesso: m.ultimo_acesso,
      })),
      plano: pl || [],
      forca: fs || [],
      treinos: [
        ...(ss || []).map((x) => ({ aluno_id: x.aluno_id, quando: Date.parse(x.iniciado_em), km: 0, dor: !!x.dor })),
        ...(cs || []).map((x) => ({
          aluno_id: x.aluno_id,
          quando: Date.parse(x.data),
          km: ehCorr(x) ? (x.distancia_m || 0) / 1000 : 0,
          dor: !!x.dor,
        })),
      ],
    });
  }
  dockStaff();
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>${dashAbas('pl')}<div class="db">${dashHTML(M, { demo, n })}
    <p class="small muted" style="margin-top:16px">${demo ? '<a href="#/dashboard/planilhas">Ver as planilhas dos alunos de verdade</a>' : '<a href="#/dashboard/demo">Abrir a demonstração com alunos fictícios</a> (para mostrar o sistema em divulgação; o selo Demonstração fica sempre na tela).'}</p></div>`;
  const raiz = $app.querySelector('.db');
  dashLigar(raiz);
  const qtd = raiz.querySelector('#db-qtd');
  if (qtd)
    qtd.addEventListener('change', () => {
      const v = Math.max(1, Math.min(300, Math.round(+qtd.value || 62)));
      try {
        localStorage.setItem('nx-dash-demo', String(v));
      } catch {}
      staffDashboard('demo');
    });
}

async function staffDashFeedbacks() {
  loading();
  const [{ data: mem }, { data: ss }, { data: cs }] = await Promise.all([
    sb.from('nx_membros').select('user_id,nome,foto_url,treinador_id').eq('org_id', S.org.id).eq('papel', 'aluno'),
    sb
      .from('nx_sessoes')
      .select('aluno_id,iniciado_em,treino_titulo,visto_treinador')
      .eq('org_id', S.org.id)
      .not('finalizado_em', 'is', null)
      .limit(10000),
    sb
      .from('nx_corridas')
      .select('aluno_id,data,tipo,distancia_m,visto_treinador,comentario_treinador')
      .eq('org_id', S.org.id)
      .limit(10000),
  ]);
  // feedbacks gerais: a equipe inteira (todos os professores somados)
  const meus = mem || [],
    porId = Object.fromEntries(meus.map((m) => [m.user_id, m]));
  const treinos = [
    ...(ss || []).map((x) => ({
      aluno_id: x.aluno_id,
      tipo: 'forca',
      titulo: x.treino_titulo,
      quando: Date.parse(x.iniciado_em),
      km: 0,
      visto: !!x.visto_treinador,
      comentario: null,
    })),
    ...(cs || []).map((x) => ({
      aluno_id: x.aluno_id,
      tipo: x.tipo === 'forca' ? 'forca' : ehCorr(x) ? 'corrida' : 'outro',
      titulo: x.tipo === 'forca' ? 'Treino de força' : nomeAtiv(x),
      quando: Date.parse(x.data),
      km: ehCorr(x) ? (x.distancia_m || 0) / 1000 : 0,
      visto: !!x.visto_treinador,
      comentario: x.comentario_treinador || null,
    })),
  ]
    .filter((t) => porId[t.aluno_id])
    .map((t) => ({ ...t, nome: porId[t.aluno_id].nome, foto_url: porId[t.aluno_id].foto_url }));
  const F = dashFeedMontar({ agora: Date.now(), treinos });
  let anonimo = false;
  try {
    anonimo = localStorage.getItem('nx-dash-anon') === '1';
  } catch {}
  const desenhar = () => {
    $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>${dashAbas('feed')}<div class="db">
      <label class="db-anon-bt"><input type="checkbox" id="db-anon" ${anonimo ? 'checked' : ''}> Esconder os nomes dos alunos (para postar)</label>
      ${dashFeedHTML(F, { anonimo })}</div>`;
    $app.querySelector('#db-anon').addEventListener('change', (e) => {
      anonimo = e.target.checked;
      try {
        localStorage.setItem('nx-dash-anon', anonimo ? '1' : '0');
      } catch {}
      desenhar();
    });
  };
  dockStaff();
  desenhar();
}
