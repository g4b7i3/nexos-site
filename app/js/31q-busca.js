/* Nexos App · Busca (lupa): procura telas do app, tutoriais da central de ajuda, dicas e, para a equipe, alunos */

const LUPA_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

// sem acento e em minúsculas, para "agua" achar "Água"
const buscaNorm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// telas do aluno: [rota, título, descrição, palavras que também acham a tela, aparece?]
function buscaTelasAluno() {
  const fC = faz('corrida'),
    fM = faz('musculacao');
  return [
    ['#/', 'Hoje', 'Treino do dia, check-in e resumo da semana', 'inicio home dia'],
    ['#/planilha', 'Planilha', 'Seus treinos da semana', 'treinos calendario semana corrida forca musculacao'],
    ['#/historico', 'Evolução', 'Treinos feitos, gráficos e relatórios', 'historico progresso graficos feitos'],
    ['#/conversa', 'Conversa com o treinador', 'Mensagens com o seu treinador', 'chat mensagem falar professor'],
    [
      '#/gps',
      'Treinar pelo celular',
      'Corrida com GPS na rua ou na esteira',
      'gps correr esteira iniciar rua livre',
      fC,
    ],
    ['#/meta', 'Minha meta', 'Seu objetivo com data e barra de progresso', 'objetivo alvo prova'],
    ['#/eventos', 'Eventos e provas', 'Treinões da Nexos e as suas provas', 'treinao prova corrida inscricao', fC],
    ['#/recordes', 'Meus recordes', 'Melhores tempos em 1 km, 5 km, 10 km e meia', 'tempo melhor marca pr', fC],
    [
      '#/historico/avaliacoes',
      'Avaliações físicas',
      'Medidas, composição corporal e relatórios',
      'peso gordura medidas bioimpedancia',
    ],
    ['#/historico/fotos', 'Fotos de evolução', 'Antes e depois e avaliação postural', 'foto antes depois postura'],
    [
      '#/historico/previsoes',
      'Testes e previsões',
      'Tempos estimados e zonas de treino',
      'zona ritmo teste previsao vdot pace',
      fC,
    ],
    [
      '#/passada',
      'Análise biomecânica da corrida',
      'Filme a sua corrida e receba o relatório do seu treinador',
      'passada video filmar postura bracos biomecanica tecnica pisada',
      fC,
    ],
    ['#/agua', 'Hidratação', 'Sua semana, meta de água e lembretes', 'agua beber copo lembrete'],
    [
      '#/prontidao',
      'Check-in e dores',
      'Sono, energia, dor e estresse dos últimos dias',
      'dor sono energia estresse cansaco',
    ],
    ['#/relogio', 'Dados do relógio', 'Sono, VFC, frequência de repouso e mais', 'garmin vfc frequencia cardiaca sono'],
    [
      '#/mulher',
      'Saúde da mulher',
      'Ciclo, energia, assoalho pélvico, ferro e mais',
      'ciclo menstruacao menstrual gravidez pos parto',
      S.me.sexo === 'F',
    ],
    [
      '#/seguranca',
      'Corrida segura',
      'Alguém de confiança acompanha o seu treino pelo link',
      'link ao vivo contato emergencia seguranca',
    ],
    ['#/saude', 'Minha ficha de saúde', 'Anamnese e PAR-Q', 'anamnese parq doenca remedio'],
    ['#/dicas', 'Dicas da Nexos', 'Sono, alimentação, recuperação e prova', 'dica texto alimentacao sono'],
    ['#/medalhas', 'Medalhas', 'Conquistas dos seus treinos', 'conquista trofeu'],
    ['#/tv', 'TV Nexos', 'Filmes e documentários de corrida', 'filme documentario video assistir'],
    [
      '#/meditacao',
      'Meditação',
      'Sessões guiadas para acalmar, focar, recuperar e dormir',
      'respiracao relaxar dormir ansiedade',
    ],
    ['#/conexoes', 'Conexões', 'Relógio Garmin, Strava e outras marcas', 'garmin strava coros polar relogio conectar'],
    ['#/pagamentos', 'Pagamentos e plano', 'Mensalidades e formas de pagamento', 'mensalidade pix plano pagar boleto'],
    ['#/termos', 'Meus termos', 'Os termos que você assinou, em PDF', 'contrato termo assinatura'],
    ['#/notificacoes', 'Notificações', 'Os avisos do seu treinador e do app', 'avisos sino'],
    ['#/perfil', 'Meu perfil', 'Foto, dados, cores do app e sair', 'foto dados senha sair tema cores escuro claro'],
    ['#/mais', 'Mais', 'Tudo o que tem no app', 'menu tudo'],
    ['/ajuda/', 'Central de ajuda', 'Tutoriais passo a passo de tudo do app', 'ajuda tutorial como usar duvida'],
    ['tour', 'Tour pelo app', 'Um passeio rápido por tudo o que o app faz', 'tour apresentacao'],
  ].filter((x) => x[4] !== false && (fM || x[0] !== '#/forca'));
}
// telas da equipe
function buscaTelasEquipe() {
  return [
    ['#/', 'Hoje', 'O que precisa de você hoje', 'inicio home pendencias'],
    ['#/alunos', 'Meus atletas', 'Todos os alunos e a ficha de cada um', 'alunos atletas lista ficha'],
    ['#/mensagens', 'Mensagens', 'Conversas com os alunos', 'chat conversa'],
    ['#/treinos', 'Treinos', 'Modelos e biblioteca de exercícios', 'modelos biblioteca exercicios'],
    ['#/feed', 'Feedbacks', 'Treinos que os alunos fizeram', 'feito checkin feedback'],
    ['#/laboratorio', 'Laboratório', 'Relatórios e estudos da equipe', 'laboratorio relatorios'],
    ['#/aprimoramento', 'Aprimorar', 'Trilhas de estudo para a equipe', 'estudo curso trilha aprimoramento'],
    [
      '#/prontidao-equipe',
      'Prontidão da equipe',
      'Check-in da manhã de todos e alerta de carga',
      'prontidao carga sono dor',
    ],
    [
      '#/fidelizacao',
      'Painel de fidelização',
      'Alunos esfriando, longe do app ou com pendências',
      'fidelizacao evasao sumido',
    ],
    ['#/checkup', 'Check-up do Corredor', 'Avaliação de entrada e saída', 'checkup avaliacao entrada'],
    ['#/relogios', 'Relógios dos alunos', 'Quem está conectado e com qual relógio', 'garmin relogio conexao'],
    ['#/desativados', 'Alunos desativados', 'Quem saiu da Nexos e a opção de reativar', 'inativo reativar saiu'],
    ['#/videochamadas', 'Videochamadas', 'Ligar para um professor ou para um aluno', 'video chamada ligar'],
    ['#/aviso', 'Aviso para os alunos', 'Uma notificação no celular dos alunos', 'aviso notificacao push comunicado'],
    ['#/eventos', 'Eventos', 'Treinões da Nexos e alunos nas provas', 'treinao prova'],
    ['#/desafio', 'Desafio do mês', 'Meta coletiva da equipe', 'desafio meta coletiva'],
    ['#/dicas', 'Dicas da Nexos', 'Textos curtos com base científica para os alunos', 'dica texto'],
    ['#/formularios', 'Formulários', 'Ficha de entrada para mandar no WhatsApp', 'formulario ficha entrada link'],
    ['#/tv', 'TV Nexos', 'Filmes e documentários de corrida', 'filme documentario'],
    ['#/meditacao', 'Meditação', 'Sessões guiadas', 'respiracao relaxar'],
    ['#/financeiro', 'Financeiro', 'Mensalidades, Pix e quem está em dia', 'mensalidade pix pagamento cobranca'],
    ['#/termos-equipe', 'Termos', 'Termos aceitos pelos alunos, em PDF', 'contrato termo'],
    ['#/perfil', 'Perfil e equipe', 'Sua conta, notificações e cores do app', 'conta senha sair equipe cores tema'],
    [
      '#/saude-sistema',
      'Saúde do sistema',
      'Erros, Garmin, notificações e avisos automáticos',
      'erro sistema problema',
    ],
    ['#/notificacoes', 'Notificações', 'Os avisos do app', 'avisos sino'],
    ['#/mais', 'Mais', 'Gestão da assessoria', 'menu tudo'],
    [
      '/treinador/ajuda/',
      'Central de ajuda do treinador',
      'Tutoriais passo a passo',
      'ajuda tutorial como usar duvida',
    ],
  ];
}
// tutoriais da central de ajuda (lidos da própria página, então ficam sempre em dia)
let buscaAjudaCache = null;
async function buscaAjuda() {
  if (buscaAjudaCache) return buscaAjudaCache;
  const url = S.staff ? '/treinador/ajuda/' : '/ajuda/';
  try {
    const html = await (await fetch(url)).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const vistos = new Set();
    buscaAjudaCache = [...doc.querySelectorAll('a.tile[href^="#"]')]
      .map((a) => ({
        href: url + a.getAttribute('href'),
        t: (a.querySelector('b') || a).textContent.trim(),
        d: (a.querySelector('small') || {}).textContent || '',
        p: a.dataset.busca || '',
      }))
      .filter((x) => x.t && !vistos.has(x.href) && vistos.add(x.href));
  } catch {
    buscaAjudaCache = [];
  }
  return buscaAjudaCache;
}
let buscaDadosCache = null;
async function buscaDados() {
  if (buscaDadosCache) return buscaDadosCache;
  const [al, dc] = await Promise.all([
    S.staff
      ? sb.from('nx_membros').select('user_id,nome').eq('org_id', S.org.id).eq('papel', 'aluno').eq('ativo', true)
      : Promise.resolve({ data: [] }),
    sb.from('nx_dicas').select('id,titulo').eq('org_id', S.org.id).eq('publicada', true).limit(200),
  ]).catch(() => [{ data: [] }, { data: [] }]);
  buscaDadosCache = { alunos: (al && al.data) || [], dicas: (dc && dc.data) || [] };
  return buscaDadosCache;
}
// pontua: título começando com o que foi digitado vale mais; todas as palavras precisam aparecer em algum lugar
function buscaPontos(q, t, extra) {
  const ws = buscaNorm(q).split(/\s+/).filter(Boolean);
  if (!ws.length) return 0;
  // compara pelo começo das palavras ("ana" acha "Ana", mas não "semana")
  const pal = (x) =>
    buscaNorm(x)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  const T = pal(t),
    X = T.concat(pal(extra));
  if (!ws.every((w) => X.some((x) => x.startsWith(w)))) return 0;
  let p = 1;
  if (T[0] && T[0].startsWith(ws[0])) p += 6;
  ws.forEach((w) => {
    if (T.some((x) => x.startsWith(w))) p += 4;
  });
  return p;
}
async function abrirBusca() {
  const telas = (S.staff ? buscaTelasEquipe() : buscaTelasAluno()).map(([href, t, d, p]) => ({ href, t, d, p }));
  const atalhos = S.staff
    ? ['#/alunos', '#/mensagens', '#/feed', '#/financeiro']
    : ['#/planilha', '#/gps', '#/historico', '#/conversa'];
  openSheet(
    `<div class="busca-topo"><span class="busca-ic">${LUPA_IC}</span><input class="input busca-in" id="busca-in" type="search" enterkeyhint="search" autocomplete="off" placeholder="${S.staff ? 'Procurar aluno, tela ou tutorial' : 'O que você procura?'}" aria-label="Procurar no app"></div>
    <div id="busca-res" class="busca-res"></div>`,
    (r) => {
      const inp = r.querySelector('#busca-in'),
        res = r.querySelector('#busca-res');
      const item = (x, ic) =>
        `<a class="list-item busca-it" href="${esc(x.href)}" style="color:inherit"><span class="ativ-ic">${ic}</span><div class="grow"><b>${esc(x.t)}</b>${x.d ? `<div class="small muted">${esc(x.d)}</div>` : ''}</div>${I.chev}</a>`;
      const grupo = (tit, lista) =>
        lista.length ? `<p class="sec-lbl busca-sec">${tit}</p><div class="stack">${lista.join('')}</div>` : '';
      let dados = null,
        ajuda = null;
      const mostrar = () => {
        const q = inp.value.trim();
        if (!q) {
          res.innerHTML = grupo(
            'Atalhos',
            atalhos
              .map((h) => telas.find((x) => x.href === h))
              .filter(Boolean)
              .map((x) => item(x, I.grid)),
          );
          return;
        }
        const ord = (lista, f) =>
          lista
            .map((x) => [buscaPontos(q, x.t, f(x)), x])
            .filter(([p]) => p > 0)
            .sort((a, b) => b[0] - a[0])
            .map(([, x]) => x);
        const rTelas = ord(telas, (x) => x.d + ' ' + x.p).slice(0, 8);
        const rAlunos = dados
          ? ord(
              dados.alunos.map((a) => ({ href: '#/aluno/' + a.user_id, t: a.nome, d: 'Ficha do aluno' })),
              () => '',
            ).slice(0, 6)
          : [];
        const rDicas = dados
          ? ord(
              dados.dicas.map((dc) => ({ href: '#/dicas/' + dc.id, t: dc.titulo, d: 'Dica da Nexos' })),
              () => '',
            ).slice(0, 4)
          : [];
        const rAjuda = ajuda ? ord(ajuda, (x) => x.d + ' ' + x.p).slice(0, 6) : [];
        const html =
          grupo(
            'Alunos',
            rAlunos.map((x) => item(x, I.user)),
          ) +
          grupo(
            'No app',
            rTelas.map((x) => item(x, I.grid)),
          ) +
          grupo(
            'Dicas',
            rDicas.map((x) => item(x, I.ficha)),
          ) +
          grupo(
            'Como fazer (central de ajuda)',
            rAjuda.map((x) => item(x, I.ficha)),
          );
        res.innerHTML =
          html ||
          `<p class="small muted busca-vazio">Nada encontrado para "${esc(q)}". Tente outra palavra${dados && ajuda ? '' : ' ou espere um instante, ainda estou carregando'}.</p>`;
      };
      res.addEventListener('click', (e) => {
        const a = e.target.closest('a.busca-it');
        if (!a) return;
        const h = a.getAttribute('href');
        if (h === 'tour') {
          e.preventDefault();
          closeSheet(true);
          iniciarTour();
          return;
        }
        closeSheet(true);
      });
      let tm = null;
      inp.addEventListener('input', () => {
        clearTimeout(tm);
        tm = setTimeout(mostrar, 120);
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const a = res.querySelector('a.busca-it');
          if (a) a.click();
        }
      });
      mostrar();
      setTimeout(() => inp.focus(), 60);
      buscaDados().then((d) => {
        dados = d;
        if (inp.value.trim()) mostrar();
      });
      buscaAjuda().then((a) => {
        ajuda = a;
        if (inp.value.trim()) mostrar();
      });
    },
  );
}
// qualquer botão com data-busca abre a lupa; no computador, a tecla / também
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-busca]');
  if (!b || b.closest('#sheet')) return;
  e.preventDefault();
  abrirBusca();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (!S.user || !document.getElementById('sheet').hidden) return;
  e.preventDefault();
  abrirBusca();
});
// campo de busca no topo das telas Mais
const buscaCampoHTML = () =>
  `<button type="button" class="busca-campo" data-busca>${LUPA_IC}<span>${S.staff ? 'Procurar aluno, tela ou tutorial' : 'Procurar no app'}</span></button>`;
