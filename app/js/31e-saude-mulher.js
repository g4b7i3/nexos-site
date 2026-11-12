/* Nexos App · Saúde da mulher: área que junta o ciclo menstrual, a triagem de energia e alimentação, o assoalho
   pélvico, a volta à corrida no pós-parto, o ferro, o conforto das mamas e a corrida segura (link ao vivo para um
   contato de confiança, para todos os alunos).
   Fontes: consenso do COI sobre REDs (Mountjoy et al., 2023) e domínios do LEAF-Q (Melin et al., 2014) na triagem de
   energia; revisão Cochrane sobre treino do assoalho pélvico na incontinência de esforço (Dumoulin et al., 2018);
   guia de volta à corrida no pós-parto (Goom, Donnelly e Brockwell, 2019); ferro no esporte (Sim et al., 2019);
   dor nas mamas em maratonistas (Brown et al., 2014). */

const SM_ROSA = '#e85d75';
const SM_IC = {
  energia:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  pelvico:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 4-7 7-7 11a7 7 0 0 0 14 0c0-4-3-7-7-11z"/><path d="M9 14a3 3 0 0 0 6 0"/></svg>',
  bebe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M10.5 8h.01M13.5 8h.01"/></svg>',
  ferro:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/><path d="M9 15h6"/></svg>',
  mamas:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6c2 0 3 2 3 4a4 4 0 0 0 10 0c0-2 1-4 3-4"/><path d="M7 10v8M17 10v8"/></svg>',
  escudo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  ciclo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16"/></svg>',
};

/* ---------- dados ---------- */
async function smBuscar(alunoId) {
  return sb
    .from('nx_saude_mulher')
    .select('*')
    .eq('aluno_id', alunoId)
    .maybeSingle()
    .then(
      (r) => r.data || null,
      () => null,
    );
}
async function smSalvar(campo, valor) {
  const { error } = await sb
    .from('nx_saude_mulher')
    .upsert(
      { aluno_id: S.user.id, org_id: S.org.id, [campo]: valor, atualizado_em: new Date().toISOString() },
      { onConflict: 'aluno_id' },
    );
  if (error) toast('Não foi possível salvar. Tente de novo.', true);
  return !error;
}
const smData = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '');
const smDiasDesde = (iso) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / 864e5) : 9999);

/* ---------- triagem de energia e alimentação ----------
   Não é o LEAF-Q oficial (que tem pontuação validada própria): usa os mesmos domínios dele (menstruação, lesões e
   intestino) e os sinais do consenso do COI 2023. Conta sinais, não dá diagnóstico. Repetir a cada 3 meses. */
const SM_ENERGIA = [
  [
    'mens',
    'Nos últimos 3 meses, a sua menstruação veio todo mês?',
    [
      ['regular', 'Sim, todo mês'],
      ['falhou1', 'Falhou 1 mês'],
      ['falhou2', 'Falhou 2 meses ou mais'],
      ['hormonal', 'Uso anticoncepcional e não menstruo'],
      ['na', 'Estou grávida, amamentando ou na menopausa'],
    ],
  ],
  [
    'mudou',
    'A menstruação ficou mais espaçada ou parou depois que você aumentou o treino?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
  [
    'lesao',
    'Nos últimos 12 meses, quantas vezes uma lesão te tirou do treino?',
    [
      ['0', 'Nenhuma'],
      ['1', 'Uma vez'],
      ['2', 'Duas vezes ou mais'],
    ],
  ],
  [
    'osso',
    'Já teve fratura por estresse ou dor em osso (canela, pé, quadril) que demorou a passar?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
  [
    'barriga',
    'Fora do período menstrual, com que frequência sente inchaço ou cólica na barriga?',
    [
      ['raro', 'Raramente'],
      ['semana', 'Uma vez por semana ou mais'],
      ['dia', 'Quase todo dia'],
    ],
  ],
  [
    'peso',
    'Perdeu peso sem querer nos últimos meses?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
  [
    'jejum',
    'Nos dias de treino, costuma ficar muitas horas sem comer?',
    [
      ['raro', 'Raramente'],
      ['vezes', 'Às vezes'],
      ['sempre', 'Quase sempre'],
    ],
  ],
  [
    'cansaco',
    'Sente cansaço ou frio fora do normal, mesmo quando descansa?',
    [
      ['raro', 'Raramente'],
      ['vezes', 'Às vezes'],
      ['sempre', 'Com frequência'],
    ],
  ],
];
function smEnergiaResultado(r) {
  const s = [];
  if (r.mens === 'falhou1' || r.mens === 'falhou2' || r.mudou === 'sim') s.push('Menstruação');
  if (r.lesao === '2' || r.osso === 'sim') s.push('Lesões e ossos');
  if (r.barriga === 'semana' || r.barriga === 'dia') s.push('Intestino');
  if (r.peso === 'sim') s.push('Peso');
  if (r.jejum === 'sempre') s.push('Alimentação nos dias de treino');
  if (r.cansaco === 'sempre') s.push('Cansaço');
  const medico = r.mens === 'falhou2' || r.osso === 'sim';
  return { sinais: s, n: s.length, medico, nivel: s.length >= 2 || medico ? 'alerta' : s.length ? 'atencao' : 'ok' };
}
function smEnergiaTexto(x) {
  if (!x) return '';
  return x.nivel === 'alerta'
    ? 'Apareceram sinais de que o corpo pode estar recebendo menos energia do que gasta. Isso tem solução e vale cuidar logo: o seu treinador já foi avisado, e o ideal é uma consulta com médico e nutricionista do esporte.'
    : x.nivel === 'atencao'
      ? 'Apareceu um sinal. Sozinho ele não quer dizer muita coisa, mas fique atenta e responda de novo em 3 meses.'
      : 'Nenhum sinal de baixa energia. Continue comendo bem antes e depois dos treinos.';
}

/* ---------- assoalho pélvico ---------- */
const SM_PELV = [
  [
    'urina',
    'Perde urina ao correr, saltar, tossir, espirrar ou rir?',
    [
      ['nunca', 'Nunca'],
      ['vezes', 'Às vezes'],
      ['freq', 'Com frequência'],
    ],
  ],
  [
    'protetor',
    'Usa protetor ou absorvente para treinar por causa disso?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
  [
    'peso',
    'Sente peso, pressão ou uma "bola" na vagina, principalmente no fim do treino?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
  [
    'urgencia',
    'Precisa correr para o banheiro com urgência durante o treino?',
    [
      ['nunca', 'Nunca'],
      ['vezes', 'Às vezes'],
      ['freq', 'Com frequência'],
    ],
  ],
  [
    'evita',
    'Já deixou de correr, saltar ou fazer algum exercício por causa disso?',
    [
      ['nao', 'Não'],
      ['sim', 'Sim'],
    ],
  ],
];
function smPelvResultado(r) {
  const algum =
    r.urina !== 'nunca' || r.protetor === 'sim' || r.peso === 'sim' || r.urgencia !== 'nunca' || r.evita === 'sim';
  const alerta = r.peso === 'sim' || r.urina === 'freq' || r.evita === 'sim' || r.urgencia === 'freq';
  return { algum, alerta, nivel: alerta ? 'alerta' : algum ? 'atencao' : 'ok' };
}

/* ---------- pós-parto: testes de volta à corrida (Goom, Donnelly e Brockwell, 2019) ---------- */
const SM_POSPARTO = [
  [
    'carga',
    'Testes de carga e impacto',
    [
      ['caminhar', 'Caminhar 30 minutos'],
      ['equilibrio', 'Ficar num pé só por 10 segundos, de cada lado'],
      ['agach', 'Agachamento num pé só, 10 vezes de cada lado'],
      ['corrida_lugar', 'Correr parada no lugar por 1 minuto'],
      ['saltos_frente', 'Saltar para a frente 10 vezes'],
      ['pulos', 'Pular num pé só no lugar, 10 vezes de cada lado'],
      ['correr_um_pe', 'Movimento de corrida num pé só, 10 vezes de cada lado'],
    ],
  ],
  [
    'forca',
    'Testes de força (20 vezes cada lado)',
    [
      ['panturrilha', 'Subir na ponta de um pé só'],
      ['ponte', 'Ponte com uma perna só'],
      ['sentar', 'Sentar e levantar da cadeira com uma perna só'],
      ['lateral', 'Deitada de lado, abrir a perna de cima'],
    ],
  ],
];
const SM_POSPARTO_TOTAL = SM_POSPARTO.reduce((a, g) => a + g[2].length, 0);

/* ---------- ferro: a partir do que ela registra no ciclo e no check-in ---------- */
async function smFerroSinais(alunoId) {
  const desde = somaDias(hojeISO(), -90);
  const [dias, pr] = await Promise.all([
    sb
      .from('nx_ciclo_dias')
      .select('dia,menstruada,fluxo,sintomas')
      .eq('aluno_id', alunoId)
      .gte('dia', desde)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_prontidao')
      .select('dia,energia')
      .eq('aluno_id', alunoId)
      .gte('dia', desde)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const intenso = dias.filter((d) => d.menstruada && d.fluxo === 'intenso').length;
  const cansDias = dias.filter((d) => (d.sintomas || []).includes('cansaco')).length;
  const prBaixa = pr.filter((p) => p.energia != null && p.energia <= 2).length;
  const cansaco = cansDias >= 4 || (pr.length >= 10 && prBaixa / pr.length >= 0.3);
  return {
    intenso,
    cansaco,
    atencao: intenso >= 4 && cansaco,
    observar: intenso >= 4 || cansaco,
    temDados: dias.length > 0,
  };
}

/* ---------- aviso ao treinador (só quando há motivo) ---------- */
function smAvisar(tipo) {
  notificar('saude_mulher', S.user.id, { tipo });
}

/* ---------- formulário de perguntas com chips ---------- */
function smPerguntasHTML(lista, resp) {
  return lista
    .map(
      ([k, p, ops], i) =>
        `<div class="sm-q" data-q="${k}"><b><span>${i + 1}</span>${esc(p)}</b><div class="sm-ops">${ops
          .map(
            ([v, t]) =>
              `<button type="button" data-v="${v}" class="${resp && resp[k] === v ? 'on' : ''}">${esc(t)}</button>`,
          )
          .join('')}</div></div>`,
    )
    .join('');
}
function smLigarPerguntas(root, resp) {
  root.querySelectorAll('.sm-q').forEach((q) =>
    q.querySelectorAll('[data-v]').forEach(
      (b) =>
        (b.onclick = () => {
          q.querySelectorAll('[data-v]').forEach((x) => x.classList.toggle('on', x === b));
          resp[q.dataset.q] = b.dataset.v;
          q.classList.remove('falta');
        }),
    ),
  );
}
function smFaltando(root, lista, resp) {
  const falta = lista.filter(([k]) => !resp[k]);
  falta.forEach(([k]) => root.querySelector(`.sm-q[data-q="${k}"]`).classList.add('falta'));
  if (falta.length) {
    root.querySelector(`.sm-q[data-q="${falta[0][0]}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Responda todas as perguntas.', true);
  }
  return falta.length > 0;
}

/* ---------- área Saúde da mulher ---------- */
async function viewMulher(sub) {
  loading();
  dockAluno();
  if (sub === 'energia') return smViewEnergia();
  if (sub === 'pelvico') return smViewPelvico();
  if (sub === 'posparto') return smViewPosparto();
  if (sub === 'ferro') return smViewFerro();
  if (sub === 'mamas') return smViewMamas();
  const [row, c, fe] = await Promise.all([
    smBuscar(S.user.id),
    buscarCiclo(S.user.id).catch(() => null),
    smFerroSinais(S.user.id),
  ]);
  const inf = c && c.ativo ? cicloInfo(c) : null;
  const fv = S.me.fase_vida && S.me.fase_vida.tipo;
  const en = row && row.energia,
    pe = row && row.pelvico,
    pp = row && row.posparto,
    cs = S.me.contato_seguro;
  const status = (txt, cls = '') => `<span class="sm-st ${cls}">${txt}</span>`;
  const card = (href, ic, cor, t, d, st) =>
    `<a class="sm-card" href="${href}" style="--sc:${cor}"><span class="sm-ic">${ic}</span><b>${t}</b><small>${d}</small>${st || ''}</a>`;
  const cicloSt =
    !c || !c.ativo
      ? status('Ativar', 'novo')
      : inf && inf.fase
        ? status(`${FASES_CICLO[inf.fase][0]} · dia ${inf.dia}`)
        : status('Acompanhando');
  const enSt = !en
    ? status('Responder', 'novo')
    : smDiasDesde(en.em) > 90
      ? status('Responder de novo', 'novo')
      : status(
          en.n ? `${en.n} ${en.n === 1 ? 'sinal' : 'sinais'}` : 'Nenhum sinal',
          en.nivel === 'alerta' ? 'alerta' : en.n ? 'atencao' : 'ok',
        );
  const peSt = !pe
    ? status('Responder', 'novo')
    : status(pe.nivel === 'ok' ? 'Tudo certo' : 'Ver orientação', pe.nivel === 'ok' ? 'ok' : pe.nivel);
  const nPP = pp && pp.testes ? Object.values(pp.testes).filter(Boolean).length : 0;
  const ferroSt = !fe.temDados
    ? status('Registre o ciclo')
    : fe.atencao
      ? status('Vale checar', 'alerta')
      : fe.observar
        ? status('Fique de olho', 'atencao')
        : status('Tudo certo', 'ok');
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Saúde</p><h1 class="h1">Saúde da mulher</h1>
    <p class="muted" style="margin-top:6px">Tudo o que influencia o seu treino e que quase ninguém pergunta. Só você e o seu treinador veem.</p>
    <div class="sm-grade">
      ${card('#/ciclo', SM_IC.ciclo, SM_ROSA, 'Ciclo menstrual', 'Fases, previsão, sintomas e autocuidado', cicloSt)}
      ${card('#/mulher/energia', SM_IC.energia, '#e0a400', 'Energia e alimentação', 'Triagem rápida de baixa energia, a cada 3 meses', enSt)}
      ${card('#/mulher/pelvico', SM_IC.pelvico, '#8b6be8', 'Assoalho pélvico', 'Escape de urina, peso na vagina e exercícios guiados', peSt)}
      ${card('#/mulher/ferro', SM_IC.ferro, '#c0392b', 'Ferro', 'Fluxo intenso, cansaço e quando fazer exame', ferroSt)}
      ${card('#/mulher/mamas', SM_IC.mamas, '#2fb6e0', 'Conforto das mamas', 'Top de sustentação e dor ao correr')}
      ${card('#/mulher/posparto', SM_IC.bebe, '#16a34a', 'Pós-parto', 'Testes para voltar a correr com segurança', fv === 'pos_parto' ? status(`${nPP} de ${SM_POSPARTO_TOTAL} testes`, nPP === SM_POSPARTO_TOTAL ? 'ok' : '') : '')}
      ${card('#/seguranca', SM_IC.escudo, '#1f6feb', 'Corrida segura', 'Link ao vivo para alguém de confiança', cs ? status(`Com ${esc(firstName(cs.nome))}`, 'ok') : status('Configurar', 'novo'))}
    </div>
    ${fv ? `<div style="margin-top:16px">${faseVidaCardHTML(S.me, false)}</div>` : ''}
    <p class="tiny dim" style="margin-top:16px">As orientações daqui são gerais e não substituem consulta. Em qualquer dúvida, fale com o seu treinador ou com o seu médico.</p>`;
}

async function smViewEnergia() {
  const row = await smBuscar(S.user.id);
  const ant = row && row.energia;
  const resp = {};
  const topo = `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a><p class="eyebrow">Triagem · 8 perguntas</p><h1 class="h1">Energia e alimentação</h1>`;
  const mostrarResultado = (x) => {
    $app.innerHTML = `${topo}
      <div class="card sm-res ${x.nivel}" style="margin-top:14px"><span class="eyebrow">${smData(x.em)}</span>
        <div class="h2" style="margin-top:4px">${x.n ? `${x.n} ${x.n === 1 ? 'sinal' : 'sinais'} de baixa energia` : 'Nenhum sinal'}</div>
        ${x.sinais.length ? `<div class="sm-tags">${x.sinais.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
        <p style="margin-top:10px">${esc(smEnergiaTexto(x))}</p>
        ${x.medico ? '<p class="small" style="margin-top:8px"><b>Falhar a menstruação por 2 meses ou mais, ou ter tido dor em osso, merece consulta com o médico mesmo sem outros sinais.</b></p>' : ''}
      </div>
      <div class="card sm-info"><b>O que é baixa energia</b><p>Quando o corpo recebe menos energia do que gasta no dia e no treino, ele começa a economizar: a menstruação falha, o osso fica mais frágil, o intestino muda e o rendimento cai. Pode acontecer sem a pessoa perceber, só por comer pouco perto dos treinos.</p>
        <b>O que ajuda</b><ul><li>Comer algo com carboidrato 1 a 3 horas antes de treinar.</li><li>Fazer uma refeição com proteína e carboidrato até 1 hora depois.</li><li>Não passar muitas horas sem comer nos dias de treino longo.</li></ul></div>
      <button class="btn ghost block" id="sm-de-novo" style="margin-top:12px">Responder de novo</button>
      <p class="tiny dim" style="margin-top:12px">Triagem baseada nos sinais do consenso do Comitê Olímpico Internacional (Mountjoy et al., 2023) e nos temas do questionário LEAF-Q (Melin et al., 2014). Não é diagnóstico.</p>`;
    document.getElementById('sm-de-novo').onclick = () => form();
    window.scrollTo(0, 0);
  };
  const form = () => {
    $app.innerHTML = `${topo}
      <p class="muted" style="margin-top:6px">Leva 1 minuto. Ajuda a pegar cedo os sinais de que o corpo está recebendo menos energia do que o treino pede.</p>
      <div class="stack sm-form" style="margin-top:14px">${smPerguntasHTML(SM_ENERGIA, resp)}</div>
      <button class="btn block" id="sm-ok" style="margin-top:16px">Ver resultado</button>`;
    smLigarPerguntas($app, resp);
    document.getElementById('sm-ok').onclick = async () => {
      if (smFaltando($app, SM_ENERGIA, resp)) return;
      const x = { ...smEnergiaResultado(resp), resp: { ...resp }, em: new Date().toISOString() };
      if (!(await smSalvar('energia', x))) return;
      if (x.nivel === 'alerta') smAvisar('energia');
      mostrarResultado(x);
    };
    window.scrollTo(0, 0);
  };
  if (ant && smDiasDesde(ant.em) <= 90) mostrarResultado(ant);
  else form();
}

async function smViewPelvico() {
  const row = await smBuscar(S.user.id);
  const ant = row && row.pelvico;
  const resp = {};
  const topo = `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a><p class="eyebrow">Saúde íntima</p><h1 class="h1">Assoalho pélvico</h1>`;
  const orient = (x) =>
    x.nivel === 'ok'
      ? '<p>Nenhum sintoma. Os exercícios abaixo ajudam a manter o assoalho pélvico forte, principalmente se você salta e corre muito.</p>'
      : `<p>Escape de urina ao correr é comum, inclusive em quem nunca teve filho, e <b>tem tratamento</b>. O primeiro passo com melhor evidência é o treino dos músculos do assoalho pélvico, de preferência orientado por uma fisioterapeuta pélvica.</p>
         ${x.alerta ? '<p><b>Procure uma fisioterapeuta pélvica ou ginecologista.</b> Sensação de peso na vagina, escape frequente ou deixar de treinar por causa disso merecem avaliação antes de aumentar o impacto. O seu treinador foi avisado para ajustar saltos e tiros enquanto isso.</p>' : ''}`;
  const mostrar = (x) => {
    $app.innerHTML = `${topo}
      ${x ? `<div class="card sm-res ${x.nivel}" style="margin-top:14px"><span class="eyebrow">${smData(x.em)}</span><div class="h2" style="margin-top:4px">${x.nivel === 'ok' ? 'Sem sintomas' : x.alerta ? 'Vale uma avaliação' : 'Sintomas leves'}</div>${orient(x)}</div>` : ''}
      <button type="button" class="cic-rot sm-rot" data-rot="pelvico"><span class="cic-rot-ic">${I.play}</span><b>${esc(ROTINAS_CICLO.pelvico.t)}</b><small>${esc(ROTINAS_CICLO.pelvico.d)}</small></button>
      <div class="card sm-info"><b>Como encontrar o músculo certo</b><p>Imagine que vai segurar o xixi e o gás ao mesmo tempo: a sensação é de fechar e puxar para dentro e para cima. Sem prender a respiração, sem contrair a barriga com força e sem apertar o bumbum. Não treine parando o xixi no banheiro.</p>
        <b>No dia a dia do treino</b><ul><li>Contraia o assoalho pélvico um instante antes de tossir, espirrar ou saltar.</li><li>Faça a rotina guiada 3 vezes por semana, por pelo menos 3 meses.</li><li>Se houver escape, troque saltos por exercícios de força até melhorar.</li></ul></div>
      <button class="btn ghost block" id="sm-de-novo" style="margin-top:12px">${x ? 'Responder de novo' : 'Responder as perguntas'}</button>
      <p class="tiny dim" style="margin-top:12px">Treino dos músculos do assoalho pélvico como primeira opção na incontinência de esforço: revisão Cochrane (Dumoulin et al., 2018).</p>`;
    $app.querySelector('[data-rot]').onclick = () => abrirRotina('pelvico');
    document.getElementById('sm-de-novo').onclick = () => form();
    window.scrollTo(0, 0);
  };
  const form = () => {
    $app.innerHTML = `${topo}
      <p class="muted" style="margin-top:6px">5 perguntas sobre os últimos 3 meses. É um assunto comum entre corredoras e quase ninguém pergunta.</p>
      <div class="stack sm-form" style="margin-top:14px">${smPerguntasHTML(SM_PELV, resp)}</div>
      <button class="btn block" id="sm-ok" style="margin-top:16px">Ver orientação</button>`;
    smLigarPerguntas($app, resp);
    document.getElementById('sm-ok').onclick = async () => {
      if (smFaltando($app, SM_PELV, resp)) return;
      const x = { ...smPelvResultado(resp), resp: { ...resp }, em: new Date().toISOString() };
      if (!(await smSalvar('pelvico', x))) return;
      if (x.alerta) smAvisar('pelvico');
      mostrar(x);
    };
    window.scrollTo(0, 0);
  };
  if (ant) mostrar(ant);
  else form();
}

async function smViewPosparto() {
  const row = await smBuscar(S.user.id);
  const pp = (row && row.posparto) || { testes: {} };
  const fv = S.me.fase_vida;
  const topo = `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a><p class="eyebrow">Pós-parto</p><h1 class="h1">Volta à corrida</h1>`;
  if (!fv || fv.tipo !== 'pos_parto') {
    $app.innerHTML = `${topo}<div class="card sm-info" style="margin-top:14px"><b>Teve bebê?</b><p>Peça ao seu treinador para marcar o pós-parto na sua ficha, com a data do parto. A partir daí o app mostra o que fazer em cada semana e libera os testes para voltar a correr com segurança.</p></div>
      <a class="btn block" href="#/conversa" style="margin-top:12px">Falar com o treinador</a>`;
    return;
  }
  const sem = fv.data ? Math.max(0, semanasEntre(fv.data, hojeISO())) : null;
  const libera = sem != null && sem >= 12;
  const desenhar = () => {
    const n = Object.values(pp.testes || {}).filter(Boolean).length;
    $app.innerHTML = `${topo}
      ${faseVidaCardHTML(S.me, false)}
      <div class="card sm-res ${n === SM_POSPARTO_TOTAL ? 'ok' : ''}"><span class="eyebrow">${sem != null ? `${sem} semanas depois do parto` : 'Data do parto não marcada'}</span>
        <div class="h2" style="margin-top:4px">${n} de ${SM_POSPARTO_TOTAL} testes</div>
        <div class="apr-barra" style="margin-top:10px"><i style="width:${(n / SM_POSPARTO_TOTAL) * 100}%"></i></div>
        <p class="small" style="margin-top:10px">${libera ? 'Marque cada teste que você fez <b>sem dor, sem escape de urina e sem sensação de peso na vagina</b>. Com todos marcados, o seu treinador recebe o aviso para começar o corre e caminha.' : 'Os testes são feitos a partir de 12 semanas depois do parto, com a liberação do médico. Até lá, siga as orientações acima.'}</p></div>
      ${SM_POSPARTO.map(
        ([, titulo, itens]) =>
          `<p class="sec-lbl">${titulo}</p><div class="stack">${itens
            .map(
              ([k, t]) =>
                `<button type="button" class="sm-teste ${pp.testes[k] ? 'on' : ''}" data-t="${k}" ${libera ? '' : 'disabled'}><span class="apr-ck">${pp.testes[k] ? I.check : ''}</span><span>${esc(t)}</span></button>`,
            )
            .join('')}</div>`,
      ).join('')}
      <p class="tiny dim" style="margin-top:12px">Testes do guia de volta à corrida no pós-parto (Goom, Donnelly e Brockwell, 2019). Sentiu algo em algum teste? Não marque e fale com o seu treinador.</p>`;
    $app.querySelectorAll('[data-t]').forEach(
      (b) =>
        (b.onclick = async () => {
          const antes = Object.values(pp.testes).filter(Boolean).length;
          pp.testes = { ...pp.testes, [b.dataset.t]: !pp.testes[b.dataset.t] };
          pp.em = new Date().toISOString();
          if (!(await smSalvar('posparto', pp))) return;
          const depois = Object.values(pp.testes).filter(Boolean).length;
          if (depois === SM_POSPARTO_TOTAL && antes < SM_POSPARTO_TOTAL) {
            smAvisar('posparto');
            confete();
            toast('Todos os testes feitos. O seu treinador foi avisado.');
          }
          desenhar();
        }),
    );
  };
  desenhar();
}

async function smViewFerro() {
  const [row, fe] = await Promise.all([smBuscar(S.user.id), smFerroSinais(S.user.id)]);
  const fr = (row && row.ferro) || {};
  const topo = `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a><p class="eyebrow">Nutrição</p><h1 class="h1">Ferro</h1>`;
  const titulo = !fe.temDados
    ? 'Registre o seu ciclo para o app acompanhar'
    : fe.atencao
      ? 'Vale conversar com o médico sobre o ferro'
      : fe.observar
        ? 'Fique de olho'
        : 'Nenhum sinal nos últimos 3 meses';
  const nivel = fe.atencao ? 'alerta' : fe.observar ? 'atencao' : 'ok';
  $app.innerHTML = `${topo}
    <div class="card sm-res ${fe.temDados ? nivel : ''}" style="margin-top:14px"><span class="eyebrow">Últimos 90 dias</span><div class="h2" style="margin-top:4px">${titulo}</div>
      ${fe.temDados ? `<p class="small" style="margin-top:8px">Dias com fluxo intenso: <b>${fe.intenso}</b> · Cansaço frequente: <b>${fe.cansaco ? 'sim' : 'não'}</b></p>` : '<p class="small" style="margin-top:8px">O app cruza o fluxo que você marca no ciclo com o cansaço do check-in da manhã.</p>'}
      ${fr.exame ? `<p class="small" style="margin-top:6px">Último exame de ferro marcado em ${new Date(fr.exame + 'T12:00:00').toLocaleDateString('pt-BR')}.</p>` : ''}</div>
    <div class="card sm-info"><b>Por que importa</b><p>A falta de ferro é bem mais comum em mulheres que treinam, principalmente com menstruação volumosa. Ela causa cansaço, falta de ar nos treinos e queda de rendimento, mesmo antes de virar anemia.</p>
      <b>O que fazer</b><ul><li>Peça ao médico o exame de ferritina (o estoque de ferro), além do hemograma, pelo menos uma vez por ano.</li><li>Inclua carnes, feijão, lentilha e folhas escuras, com uma fruta rica em vitamina C na mesma refeição.</li><li>Café e chá logo depois da refeição atrapalham a absorção do ferro.</li><li>Não tome suplemento de ferro por conta própria: a dose depende do exame.</li></ul></div>
    <form class="card sm-info" id="sm-ferro"><b>Fiz o exame</b><p class="small muted">Marque a data. Só a data fica guardada, para lembrar quando repetir.</p>
      <div class="row" style="gap:8px;margin-top:8px"><input class="input" type="date" name="d" max="${hojeISO()}" value="${esc(fr.exame || '')}" required style="flex:1"><button class="btn sm" type="submit">Salvar</button></div></form>
    <p class="tiny dim" style="margin-top:12px">Ferro no esporte: revisão de Sim et al. (2019). Orientação geral, não substitui consulta.</p>`;
  document.getElementById('sm-ferro').onsubmit = async (e) => {
    e.preventDefault();
    if (await smSalvar('ferro', { exame: e.target.d.value, em: new Date().toISOString() })) {
      toast('Data do exame salva.');
      smViewFerro();
    }
  };
}

function smViewMamas() {
  $app.innerHTML = `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a><p class="eyebrow">Conforto</p><h1 class="h1">Conforto das mamas</h1>
    <div class="card sm-res" style="margin-top:14px"><div class="h3">Dor nas mamas ao correr é comum</div><p style="margin-top:6px">Em uma pesquisa com corredoras da Maratona de Londres, cerca de 1 em cada 3 relatou dor nas mamas, e parte delas chegou a diminuir o treino por isso. Na maioria das vezes, um bom top resolve.</p></div>
    <div class="card sm-info"><b>Como escolher o top</b><ul>
      <li>Procure modelos de alta sustentação, próprios para corrida.</li>
      <li>A faixa de baixo é quem segura: precisa ficar firme e não subir quando você levanta os braços.</li>
      <li>Alças largas e acolchoadas, que não marcam o ombro.</li>
      <li>Teste na loja: pule e corra parada no lugar. As mamas devem se mexer pouco.</li>
      <li>Troque quando o tecido perder a elasticidade, em geral depois de 6 a 12 meses de uso frequente.</li></ul>
      <b>Quando procurar o médico</b><p>Dor que não tem relação com o movimento, caroço, saída de líquido pelo mamilo ou mudança na pele.</p></div>
    <p class="tiny dim" style="margin-top:12px">Dor nas mamas em corredoras da Maratona de Londres de 2012 (Brown et al., 2014).</p>`;
}

/* ---------- rotina guiada do assoalho pélvico (usa o mesmo tocador das rotinas do ciclo) ---------- */
ROTINAS_CICLO.pelvico = {
  t: 'Assoalho pélvico',
  d: 'Contrações guiadas, 6 minutos',
  passos: [
    [
      'Ajeite-se',
      'Deitada de barriga para cima, joelhos dobrados, pés apoiados. Respire normalmente pela barriga.',
      30,
    ],
    [
      'Contrações lentas',
      'Feche e puxe para dentro e para cima, como se segurasse o xixi e o gás. Segure 5 segundos e solte por 5 segundos. Repita até o fim do tempo.',
      100,
    ],
    ['Descanse', 'Solte tudo e respire devagar.', 20],
    [
      'Contrações rápidas',
      'Contraia forte e solte logo, uma por segundo, 10 vezes. Descanse alguns segundos e repita.',
      60,
    ],
    ['Descanse', 'Solte o assoalho pélvico por completo. Sentir ele relaxar faz parte do treino.', 20],
    [
      'Ponte com contração',
      'Contraia o assoalho pélvico, suba o quadril, segure 3 segundos e desça soltando. Repita no seu ritmo.',
      60,
    ],
    [
      'Antes do esforço',
      'Sentada: contraia um instante antes de fingir uma tosse. É esse truque que você vai usar antes de saltar e tossir.',
      40,
    ],
    ['Respiração final', 'Inspire em 4 tempos deixando a barriga e a pelve soltarem, e solte o ar em 6.', 30],
  ],
};
DICAS_CICLO.push([
  'Conforto das mamas',
  'Dor nas mamas ao correr é comum e quase sempre melhora com um top de alta sustentação, com faixa firme embaixo e alças largas. Veja mais em Saúde da mulher.',
]);

/* ---------- corrida segura: contato de confiança e link ao vivo ---------- */
const AO_VIVO_URL = (t) => `${location.origin}/seguro/?t=${t}`;
function aoVivoToken() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 28);
}
async function viewSeguranca() {
  loading();
  dockAluno();
  const cs = S.me.contato_seguro;
  const volta =
    S.me.sexo === 'F'
      ? `<a class="back" href="#/mulher">${I.back} Saúde da mulher</a>`
      : `<a class="back" href="#/mais">${I.back} Mais</a>`;
  $app.innerHTML = `${volta}<p class="eyebrow">Segurança</p><h1 class="h1">Corrida segura</h1>
    <p class="muted" style="margin-top:6px">Quando você treina pelo GPS do app, uma pessoa de confiança pode acompanhar onde você está por um link, até o fim do treino.</p>
    <div class="card sm-info" style="margin-top:14px"><b>Como funciona</b><ul>
      <li>Antes de começar o treino, toque em <b>Enviar link ao vivo</b>. O WhatsApp abre com a mensagem pronta para a pessoa.</li>
      <li>Pelo link, ela vê o seu ponto no mapa, o trajeto e se você está correndo, parada ou se terminou.</li>
      <li>Se você ficar parada por mais de 5 minutos, ou o celular parar de mandar a posição, a página mostra o aviso em destaque.</li>
      <li>O link para de funcionar sozinho 12 horas depois.</li></ul>
      <p class="tiny dim" style="margin-top:8px">A posição só é enviada com a tela do treino aberta. Com o celular bloqueado por muito tempo, alguns aparelhos param de mandar.</p></div>
    <form class="card" id="seg-f" style="margin-top:12px"><b>Pessoa de confiança</b>
      <label class="field" style="margin-top:10px"><span>Nome</span><input class="input" name="nome" maxlength="60" required value="${esc((cs && cs.nome) || '')}" placeholder="Ex.: Minha mãe"></label>
      <label class="field"><span>WhatsApp</span><input class="input" name="tel" data-mask="tel" inputmode="numeric" required placeholder="(98) 9 9999-9999" value="${esc((cs && cs.tel) || '')}"></label>
      <button class="btn block" type="submit">${cs ? 'Salvar' : 'Ativar corrida segura'}</button>
      ${cs ? '<button class="btn ghost block" type="button" id="seg-off" style="margin-top:8px">Desativar</button>' : ''}</form>`;
  const f = document.getElementById('seg-f');
  aplicarMascaras(f);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const v = { nome: f.nome.value.trim(), tel: f.tel.value.replace(/\D/g, ''), auto: true };
    if (v.tel.length < 10) return toast('Confira o WhatsApp com DDD.', true);
    const { error } = await sb.rpc('nx_contato_seguro', { p: v });
    if (error) return toast('Não foi possível salvar.', true);
    S.me.contato_seguro = v;
    toast('Pronto. Na tela do treino pelo GPS vai aparecer o botão para enviar o link.');
    viewSeguranca();
  };
  const off = document.getElementById('seg-off');
  if (off)
    off.onclick = async () => {
      const { error } = await sb.rpc('nx_contato_seguro', { p: null });
      if (error) return toast('Não foi possível desativar.', true);
      S.me.contato_seguro = null;
      toast('Corrida segura desativada.');
      viewSeguranca();
    };
}
/* ganchos chamados pela tela do treino pelo GPS (20-corrida-gps.js) */
const AO_VIVO = { env: 0, estado: '' };
function seguroGpsMontar(st) {
  const box = document.getElementById('g-seg');
  if (!box) return;
  const cs = S.me && S.me.contato_seguro;
  if (!cs) {
    box.innerHTML = '';
    return;
  }
  const nome = esc(firstName(cs.nome) || cs.nome);
  box.innerHTML = st.seguro
    ? `<div class="g-seg on">${SM_IC.escudo}<span>Ao vivo para ${nome}</span><button type="button" id="g-seg-re">Reenviar</button></div>`
    : `<button type="button" class="g-seg" id="g-seg-env">${SM_IC.escudo}<span>Enviar link ao vivo para ${nome}</span></button>`;
  const enviar = async () => {
    if (!st.seguro) {
      const token = aoVivoToken();
      const { error } = await sb.from('nx_ao_vivo').insert({
        token,
        org_id: S.org.id,
        titulo: String(st.titulo || 'Corrida').slice(0, 120),
        estado: st.estado === 'correndo' ? 'correndo' : st.estado === 'pausado' ? 'pausado' : 'pronto',
        inicio: st.inicio || null,
      });
      if (error) return toast('Não foi possível criar o link agora.', true);
      st.seguro = token;
      store.set(GPS_KEY, st);
    }
    const msg = `Oi, ${firstName(cs.nome) || cs.nome}! Vou correr agora. Você pode acompanhar onde estou por este link até eu terminar: ${AO_VIVO_URL(st.seguro)}`;
    window.open(`https://wa.me/${telWa(cs.tel)}?text=${encodeURIComponent(msg)}`, '_blank');
    seguroGpsMontar(st);
  };
  const b = box.querySelector('#g-seg-env') || box.querySelector('#g-seg-re');
  if (b) b.onclick = enviar;
}
/** chamado a cada salvamento do treino: manda posição e estado no máximo a cada 30 s (ou na hora, se o estado mudou) */
function seguroSync(st) {
  if (!st || !st.seguro) return;
  const mudou = AO_VIVO.estado !== st.estado;
  if (!mudou && Date.now() - AO_VIVO.env < 30000) return;
  AO_VIVO.env = Date.now();
  AO_VIVO.estado = st.estado;
  const ult = st.rota && st.rota.length ? st.rota[st.rota.length - 1] : null;
  const passo = Math.max(1, Math.ceil((st.rota || []).length / 300));
  const rota = (st.rota || []).filter((_, i) => i % passo === 0 || i === st.rota.length - 1);
  if (ult && (!st._segUlt || gpsDist(st._segUlt, ult) > 15)) {
    st._segUlt = ult;
    st._segMov = new Date().toISOString();
  }
  const row = {
    estado: st.estado === 'correndo' ? 'correndo' : st.estado === 'pausado' ? 'pausado' : 'pronto',
    inicio: st.inicio || null,
    dist_m: Math.round(st.dist || 0),
    rota: rota.length ? rota : null,
  };
  if (ult) {
    row.lat = ult[0];
    row.lng = ult[1];
    row.pos_em = new Date().toISOString();
    row.mov_em = st._segMov || row.pos_em;
  }
  sb.from('nx_ao_vivo')
    .update(row)
    .eq('token', st.seguro)
    .then(
      () => {},
      () => {},
    );
}
/** treino salvo ou descartado: avisa no link que terminou */
function seguroFim(st) {
  if (!st || !st.seguro) return;
  sb.from('nx_ao_vivo')
    .update({ estado: 'fim', fim: new Date().toISOString(), dist_m: Math.round(st.dist || 0) })
    .eq('token', st.seguro)
    .then(
      () => {},
      () => {},
    );
  AO_VIVO.estado = '';
}

/* ---------- treinador: resumo da saúde da mulher na ficha da aluna ---------- */
async function smCardTreinador(box, m) {
  const [row, fe] = await Promise.all([smBuscar(m.user_id), smFerroSinais(m.user_id)]);
  if (!box.isConnected) return;
  const ela = firstName(m.nome) || 'Ela';
  const linha = (ic, cor, t, d, nivel) =>
    `<div class="sm-tr-l"><span class="sm-ic sm-ic-p" style="--sc:${cor}">${ic}</span><div class="grow"><b>${t}</b><span class="small muted">${d}</span></div>${nivel ? `<span class="sm-st ${nivel}">${nivel === 'alerta' ? 'Atenção' : nivel === 'atencao' ? 'Observar' : 'Ok'}</span>` : ''}</div>`;
  const en = row && row.energia,
    pe = row && row.pelvico,
    pp = row && row.posparto,
    fr = row && row.ferro;
  const nPP = pp && pp.testes ? Object.values(pp.testes).filter(Boolean).length : 0;
  const pr = (pe && pe.resp) || {};
  const html = `<div class="card sa-card sm-tr"><div class="sa-top"><span class="sa-ic" style="color:${SM_ROSA}">${FV_IC}</span><div class="sa-txt"><span class="eyebrow">Saúde da mulher</span><b>O que ${esc(ela)} respondeu</b><span>Só a equipe vê</span></div></div>
    ${linha(SM_IC.energia, '#e0a400', 'Energia e alimentação', en ? `${en.n ? (en.sinais || []).join(', ') : 'Nenhum sinal'} · ${smData(en.em)}${smDiasDesde(en.em) > 90 ? ' · vencida' : ''}` : 'Ainda não respondeu', en ? en.nivel : '')}
    ${linha(SM_IC.pelvico, '#8b6be8', 'Assoalho pélvico', pe ? `${pe.nivel === 'ok' ? 'Sem sintomas' : ([pr.urina && pr.urina !== 'nunca' ? 'escape de urina' : '', pr.peso === 'sim' ? 'peso na vagina' : '', pr.urgencia && pr.urgencia !== 'nunca' ? 'urgência' : '', pr.evita === 'sim' ? 'deixou de treinar' : ''].filter(Boolean).join(', ') || 'Com sintomas').replace(/^./, (c) => c.toUpperCase())} · ${smData(pe.em)}` : 'Ainda não respondeu', pe ? pe.nivel : '')}
    ${linha(SM_IC.ferro, '#c0392b', 'Ferro', fe.temDados ? `${fe.intenso} dias de fluxo intenso em 90 dias · cansaço ${fe.cansaco ? 'frequente' : 'normal'}${fr && fr.exame ? ` · exame em ${new Date(fr.exame + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}` : 'Sem registros do ciclo', fe.temDados ? (fe.atencao ? 'alerta' : fe.observar ? 'atencao' : 'ok') : '')}
    ${m.fase_vida && m.fase_vida.tipo === 'pos_parto' ? linha(SM_IC.bebe, '#16a34a', 'Testes de volta à corrida', `${nPP} de ${SM_POSPARTO_TOTAL} feitos sem sintomas`, nPP === SM_POSPARTO_TOTAL ? 'ok' : '') : ''}
    ${pe && pe.alerta ? `<p class="small" style="margin-top:10px"><b>Assoalho pélvico:</b> troque saltos e tiros por força até ela passar por avaliação com fisioterapeuta pélvica.</p>` : ''}
    ${en && en.nivel === 'alerta' ? `<p class="small" style="margin-top:6px"><b>Energia:</b> converse sobre alimentação perto dos treinos e encaminhe para médico e nutricionista do esporte.</p>` : ''}</div>`;
  box.insertAdjacentHTML('beforeend', html);
}
