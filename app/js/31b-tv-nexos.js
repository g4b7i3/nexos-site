/* Nexos App · TV Nexos (Mais › Entretenimento): filmes e documentários de corrida, filmes completos e gratuitos
   e uma sala Infantil, como uma TV. Só vídeos publicados no YouTube por quem tem os direitos (marcas, provas,
   federações, produtoras, distribuidoras de filmes gratuitos e canais oficiais infantis).
   O vídeo toca no player do próprio YouTube (youtube-nocookie) e só carrega quando a pessoa toca.
   A busca usa a função nx-youtube (API oficial do YouTube); sem a chave configurada, a busca não aparece. */
const tvYt = (id, t, canal, d, o = {}) => ({ id, t, canal, d, ...o });
const TV_EN = { en: true };

// Sala principal: filmes e documentários de corrida, só dos canais de quem fez (marcas, provas, federações, produtoras).
const TV_HERO = tvYt('5oDtotEdHEc', 'MENTAL: a escola queniana de corrida', 'Olympikus', '36 min');
const TV_SECOES = [
  {
    id: 'pt',
    nome: 'Corrida em português',
    itens: [
      TV_HERO,
      tvYt('gdSbHVcD4Mw', 'Brutal: UTMB CCC 2024', 'Olympikus', '24 min'),
      tvYt('WEcErdCit14', 'A vida é uma maratona: os novos limites da longevidade', 'Drauzio Varella', '1 h 54'),
      tvYt('INiR6aXJwyg', '240 km na Brazil 135: minha primeira prova de três dígitos', 'Daniel Canny', '23 min'),
      tvYt('eyU1S5VT3Jo', 'Do zero à minha primeira maratona', 'Bruna Ianhez', '32 min'),
    ],
  },
  {
    id: 'filmes',
    nome: 'Filmes de corrida',
    sub: 'Filmes completos e gratuitos',
    itens: [
      tvYt('W6XqqFbVL9Q', 'Rumo à Vitória', 'NetMovies Família', '1 h 39 · dublado'),
      tvYt('6JL6SYxlaJk', 'Freerunner: Corra por Sua Vida', 'Swen Action', '1 h 27'),
      tvYt('nv97RBG9LJc', 'The Perfect Race', 'Christian Movies', '1 h 37', TV_EN),
      tvYt('zH0EGqlb7eg', 'Remember the Goal', 'Christian Movies', '1 h 28', TV_EN),
      tvYt('F2nO-6mzCF8', 'Run for the Dream: a história de Gail Devers', 'FilmRise Movies', '1 h 40', TV_EN),
      tvYt('CMK7e7uP-TY', 'Run for Your Life: a criação da Maratona de Nova York', 'Popcornflix', '1 h 35', TV_EN),
      tvYt('cVdhRdehw9M', 'The Long Green Line: cross-country', 'Indie Rights Movies', '1 h 30', TV_EN),
    ],
  },
  {
    id: 'ultra',
    nome: 'Ultramaratona e trail',
    sub: 'Filmes completos',
    itens: [
      tvYt('zy1as6CTYXI', 'Unbreakable: The Western States 100', 'Journeyfilm', '1 h 46', TV_EN),
      tvYt('MbXwKTZoLQ4', 'Walmsley: o filme', 'Wahoo Fitness', '1 h 34', TV_EN),
      tvYt('herA1iwUW8k', 'Conquistando o Mont-Blanc: o caminho até o UTMB', 'HOKA UTMB Mont-Blanc', '52 min', TV_EN),
      tvYt('JOhQGe-tRPA', 'The Mirage: a corrida de Timothy Olson contra o tempo', 'National Geographic', '1 h', TV_EN),
      tvYt('k0HkYULFVvA', 'The Chase: Cocodona 250', 'Aravaipa Running', '1 h 51', TV_EN),
      tvYt('5ciEqPZsOCs', 'Transamericana: 6.000 km correndo pelos EUA', 'Salomon TV', '1 h 15', TV_EN),
      tvYt('a5LJ36lFJuw', 'Running Out: 231 km na trilha Larapinta', 'Salomon TV', '43 min', TV_EN),
      tvYt('yqOIPKt4m2Q', 'Courtney Dauwalter e François D’haene no Hardrock', 'Salomon TV', '52 min', TV_EN),
      tvYt('r6O5vI0cmAI', 'François D’haene no Tor des Géants', 'Salomon TV', '29 min', TV_EN),
      tvYt('PgTEsybXw-4', 'The Finisher: Jasmin Paris e a Barkley Marathons', 'Singletrack', '47 min', TV_EN),
      tvYt('XOmCLl1z7c0', 'Kilian Jornet: desenhando o futuro', 'NNormal', '45 min', TV_EN),
    ],
  },
  {
    id: 'maratona',
    nome: 'Maratona e pista',
    itens: [
      tvYt(
        'k-XgKRJUEgQ',
        'INEOS 1:59: Kipchoge abaixo de 2 horas (corrida completa)',
        'INEOS 1:59 Challenge',
        '3 h 32',
        TV_EN,
      ),
      tvYt('6rMjOzO5td0', 'O caminho até Viena: documentário do 1:59', 'INEOS 1:59 Challenge', '18 min', TV_EN),
      tvYt('CGnL0c-g2rI', 'O homem mais rápido do mundo: Usain Bolt', 'Olympic Games', '18 min', TV_EN),
      tvYt('ZhVl_gqnjxs', 'Ferro afia ferro: os bastidores de um grupo de treino', 'World Athletics', '45 min', TV_EN),
      tvYt('tPM6UJFGkTs', 'Feito para a velocidade: a história de Letsile Tebogo', 'World Athletics', '18 min', TV_EN),
    ],
  },
  // Filmes (distribuidoras que publicam filmes completos e gratuitos no YouTube: NetMovies, Bigtime, Booh!, Swen)
  {
    id: 'anos2000',
    nome: 'Destaques de 2000 pra cá',
    sub: 'Dublados',
    itens: [
      tvYt('YMbsC2J1R2o', 'Réquiem para um Sonho', 'NetMovies Romance', '2000 · drama'),
      tvYt('W7tZgGcMPUg', 'Mortdecai: A Arte da Trapaça (Johnny Depp)', 'NetMovies Comédia', '2015 · comédia'),
      tvYt('JyRhwOohMnM', 'Quebrando Regras', 'NetMovies Suspense', '2008 · ação'),
      tvYt('CD4uTmJJ3Cg', 'Xangai (John Cusack)', 'NetMovies', '2010 · drama'),
      tvYt('zlmWuf84vO0', 'Super-Herói: O Filme', 'NetMovies', '2008 · comédia'),
      tvYt('cUTDW3YMuUM', 'Down a Dark Hall (Uma Thurman)', 'NetMovies Suspense', '2018 · suspense'),
      tvYt('A4dLYkekQuE', 'Halloween 2', 'Booh!', 'terror'),
      tvYt('itMbWPsjhiw', 'Walt Antes de Mickey', 'Bigtime Filmes', '2015 · drama'),
    ],
  },
  {
    id: 'acao',
    nome: 'Ação e aventura',
    itens: [
      tvYt('hqoRGV9uZeM', 'Jack Hunter e o Tesouro Perdido de Ugarit', 'Bigtime Filmes', '1 h 38'),
      tvYt('hwjM4IPs3ko', 'Jack Hunter e a Busca pela Tumba de Akhenaton', 'Bigtime Filmes', '1 h 38'),
      tvYt('UGQuwICI5do', 'Jack Hunter e a Estrela do Céu', 'Bigtime Filmes', '1 h 38'),
      tvYt('lP_CSU6AZUk', 'El Dorado: Em Busca da Cidade de Ouro', 'Bigtime Filmes', '1 h 39'),
      tvYt('08LBSgyAkcM', 'Eldorado 2: Em Busca do Templo Perdido', 'Bigtime Filmes', '1 h 33'),
      tvYt('3WKGfL7QCfo', 'A Lenda do Dragão', 'Bigtime Filmes', '2011'),
      tvYt('SClsIAfQkIs', 'City God', 'NetMovies Ação', '2010'),
      tvYt('jiB8Gef0r7w', 'A Máfia Não Perdoa', 'NetMovies', '1 h 47'),
      tvYt('jqU7zumuop0', 'Viagem ao Centro da Terra', 'NetMovies', '1 h 30'),
      tvYt('Thj9zryZ3fw', 'Komodo vs. Cobra', 'Bigtime Filmes', '2005'),
      tvYt('uW8BE6C67pw', 'Zona de Desastre', 'Bigtime Filmes', '2015'),
    ],
  },
  {
    id: 'comedia',
    nome: 'Comédia',
    itens: [
      tvYt('W7tZgGcMPUg', 'Mortdecai: A Arte da Trapaça', 'NetMovies Comédia', '2015'),
      tvYt('zlmWuf84vO0', 'Super-Herói: O Filme', 'NetMovies', '2008'),
      tvYt('VDFrQNZaqdI', 'Mayberry Man', 'NetMovies Comédia', '1 h 39'),
      tvYt('Vg1ZZOLH3U8', 'Atraídos pelo Perigo', 'NetMovies Comédia', '1 h 40'),
      tvYt('TvhOx7j2oZE', 'O Tesouro Perdido', 'NetMovies Comédia', '1 h 23'),
      tvYt('HaC3-lYPeGc', 'Todos os Cães do Natal', 'Bigtime Filmes', '1 h 42'),
    ],
  },
  {
    id: 'drama',
    nome: 'Drama',
    itens: [
      tvYt('YMbsC2J1R2o', 'Réquiem para um Sonho', 'NetMovies Romance', '2000'),
      tvYt('ohUup_43uXM', 'O Som da Alma', 'NetMovies', '2 h 10'),
      tvYt('itMbWPsjhiw', 'Walt Antes de Mickey', 'Bigtime Filmes', '2015'),
      tvYt('u5P9JKhQpkk', 'À Espreita do Mal', 'NetMovies Drama', '2019'),
      tvYt('YRFduLk_Enc', 'Em Busca da Graça', 'Bigtime Filmes', '2019'),
      tvYt('QaRHMXMWc-0', 'A História de Fátima', 'Bigtime Filmes', '2020'),
      tvYt('Fvuu3--B4-Q', 'O Lado Simples da Vida', 'NetMovies Romance', '2021'),
      tvYt('keOMnDi54W4', 'A Luz da Liberdade', 'Swen Family', '2 h 04'),
      tvYt('bUzNgEynP-8', 'The Arrival (Charlie Sheen)', 'NetMovies Drama', '1 h 50'),
    ],
  },
  {
    id: 'romance',
    nome: 'Romance',
    itens: [
      tvYt('AdufX1bQSMg', 'Encontrando o Amor em Nebraska (Diogo Morgado)', 'NetMovies Romance', '2016'),
      tvYt('u7af5ZGUnC4', 'Siga Seu Coração', 'NetMovies Romance', '2020'),
      tvYt('VUhCMCsKaNI', 'Uma Paixão Inesperada', 'NetMovies Comédia', '1 h 56'),
      tvYt('V-e9QMBZPgw', 'Questões de Família', 'NetMovies Romance', '1 h 58'),
      tvYt('ihFiUd34tYE', 'A Lição do Amor', 'NetMovies Família', '1 h 34'),
      tvYt('7xB_SRxJX7Q', 'Eu Vou Te Amar Além de Tudo', 'Bigtime Filmes', '1 h 28'),
      tvYt('wk1KZvwFEOE', 'Receitas de Amor', 'Bigtime Filmes', '2011'),
    ],
  },
  {
    id: 'terror',
    nome: 'Terror e suspense',
    itens: [
      tvYt('A4dLYkekQuE', 'Halloween 2', 'Booh!', '1 h 37'),
      tvYt('BvEpDvPm040', 'O Assassino do Alfabeto', 'Booh!', '2008'),
      tvYt('cUTDW3YMuUM', 'Down a Dark Hall (Uma Thurman)', 'NetMovies Suspense', '2018'),
      tvYt('x4nqPjoVuh8', 'Vivendo Entre Nós', 'Bigtime Filmes', '2018'),
      tvYt('YRbLaIwmbaM', 'Saturno 3 (Kirk Douglas)', 'Bigtime Filmes', '1980'),
      tvYt('CkXXM4HT-38', 'Intenções Ocultas', 'Bigtime Filmes', '2009'),
      tvYt('PnmUgYAisL4', 'A Garota Misteriosa', 'NetMovies Suspense', '1 h 51'),
      tvYt('HgDKffqYH_o', 'Contrato Vital', 'NetMovies Suspense', '1 h 33'),
    ],
  },
  {
    id: 'nacional',
    nome: 'Cinema nacional: Mazzaropi',
    sub: 'Clássicos brasileiros',
    itens: [
      tvYt('1X4U8ctaCso', 'Jeca Tatu', 'NetMovies Comédia', '1959'),
      tvYt('kSyi4gIN89g', 'Chofer de Praça', 'NetMovies Comédia', '1959'),
      tvYt('AMRJS1ivRsI', 'O Jeca e a Freira', 'NetMovies Comédia', '1 h 37'),
      tvYt('sgycDtk212Y', 'Jeca e Seu Filho Preto', 'NetMovies Comédia', '1978'),
      tvYt('rZ6r6ns5c1Y', 'No Paraíso das Solteironas', 'NetMovies Velho Oeste', '1 h 37'),
      tvYt('Lrb5nafnXXc', 'Meu Japão Brasileiro', 'NetMovies Velho Oeste', '1 h 39'),
      tvYt('g_7ZafdFlp4', 'Casinha Pequenina', 'NetMovies Família', '1 h 34'),
    ],
  },
  {
    id: 'faroeste',
    nome: 'Faroeste',
    itens: [
      tvYt('V5J53CAm7AY', 'Uma Longa Fila de Cruzes', 'NetMovies Velho Oeste', '1 h 37'),
      tvYt('kxasUAe1R4s', 'Um Dólar Entre os Dentes', 'NetMovies Velho Oeste', '1 h 26'),
      tvYt('iaax9HxpdQQ', 'Joe, o Pistoleiro', 'NetMovies Velho Oeste', '1 h 32'),
      tvYt('JLBWv93WLv4', 'Luta pela Liberdade', 'NetMovies Velho Oeste', '1 h 36'),
    ],
  },
];

// Infantil: só abre pelo card "Infantil" (canais oficiais em português)
const TV_INFANTIL = [
  {
    id: 'aovivo',
    nome: 'Ao vivo agora',
    sub: 'Canal 24 horas',
    itens: [
      tvYt('OxvEX_G9LEI', 'Masha e o Urso · todos os melhores episódios', 'Masha e o Urso', '24 horas no ar', {
        aoVivo: true,
      }),
    ],
  },
  {
    id: 'corrida-kids',
    nome: 'Corrida em desenho',
    itens: [
      tvYt('fW_6ls9Rpqw', 'Papai Pig corre a Maratona de Londres', 'Peppa Pig Brasil', '2 h'),
      tvYt('j_7Kb6-govA', 'Treinando para a maratona', 'Peppa Pig Brasil', '2 h'),
      tvYt('_Whe25hRPI0', 'Peppa corre contra Rebecca: mini maratona', 'Peppa Pig Brasil', '2 h'),
    ],
  },
  {
    id: 'desenhos',
    nome: 'Desenhos',
    itens: [
      tvYt('optbgi5LAB0', 'Galinha Pintadinha Mini · Episódio 1', 'Galinha Pintadinha', '12 min'),
      tvYt('3QLmXNSbA08', 'Galinha Pintadinha Mini · Episódio 2', 'Galinha Pintadinha', '12 min'),
      tvYt('JLfghDvWgTE', 'Galinha Pintadinha Mini · Episódio 3', 'Galinha Pintadinha', '12 min'),
      tvYt('dnOUR9ItBXo', 'Masha e o Urso · 1 hora de desenhos', 'Masha e o Urso', '1 h'),
      tvYt('Nh_G9ZxGuQg', 'O Show da Luna · Maratona Sentimentos e Emoções', 'O Show da Luna!'),
      tvYt('nBTMLY0rABg', 'O Show da Luna · Maratona Chove Chuva', 'O Show da Luna!'),
      tvYt('YBxdLSwPmEM', 'Peppa Pig · A fábrica de donuts', 'Peppa Pig Brasil', '2 h'),
      tvYt('T6WGzj4rFU0', 'Turma da Mônica · WebTira Denise', 'Turma da Mônica'),
    ],
  },
  {
    id: 'musica',
    nome: 'Música',
    itens: [
      tvYt('8b8MX2TpCaQ', 'Bita e os Animais · álbum completo', 'Mundo Bita', '27 min'),
      tvYt('DqLrNhru-qE', 'Bita e as Brincadeiras · álbum completo', 'Mundo Bita', '31 min'),
      tvYt('kMyFG81dF70', 'Bita e o Corpo Humano · álbum completo', 'Mundo Bita', '33 min'),
      tvYt('l_F72X5FjBw', 'Bita e a Natureza · álbum completo', 'Mundo Bita', '34 min'),
    ],
  },
];

const TV_IC =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M8 2.5l4 3.5 4-3.5"/></svg>';
const TV_PLAY =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
const TV_GENEROS = [
  ['Corrida', 'filme de corrida a pé completo'],
  ['Comédia', 'filme de comédia completo dublado'],
  ['Ação', 'filme de ação completo dublado'],
  ['Drama', 'filme de drama completo dublado'],
  ['Romance', 'filme de romance completo dublado'],
  ['Suspense', 'filme de suspense completo dublado'],
  ['Terror', 'filme de terror completo dublado'],
  ['Animação', 'filme de animação completo dublado'],
  ['Nacional', 'filme brasileiro completo'],
];
const tvCapa = (x) => `https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`;
const tvCapaG = (x) => `https://i.ytimg.com/vi/${x.id}/maxresdefault.jpg`;
const tvPlayer = (x) =>
  `https://www.youtube-nocookie.com/embed/${x.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1${x.en ? '&cc_load_policy=1&cc_lang_pref=pt&hl=pt' : ''}`;
const tvFora = (x) => `https://www.youtube.com/watch?v=${x.id}`;
const tvCard = (x, s) =>
  `<button type="button" class="tv-card" data-tv="${esc(x.id)}" data-sec="${esc(s)}"><span class="tv-capa"><img src="${tvCapa(x)}" alt="" loading="lazy"><i>${TV_PLAY}</i>${x.d ? `<em>${esc(x.d)}</em>` : ''}${x.en ? '<u>EN</u>' : ''}${x.aoVivo ? '<u class="vivo">AO VIVO</u>' : ''}</span><b>${esc(x.t)}</b><small>${esc(x.canal || '')}</small></button>`;

/** tela da TV: #/tv (sala principal) e #/tv/infantil */
async function viewTv(sala) {
  const infantil = sala === 'infantil';
  const secoes = infantil ? TV_INFANTIL : TV_SECOES;
  const hero = infantil ? TV_INFANTIL[0].itens[0] : TV_HERO;
  const porSec = Object.fromEntries(secoes.map((s) => [s.id, s]));
  const busca = { id: 'busca', nome: 'Resultados', itens: [] };
  porSec.busca = busca;
  const volta = infantil ? '#/tv' : '#/mais';
  $app.innerHTML = `<a class="back" href="${volta}">${I.back} ${infantil ? 'TV Nexos' : 'Mais'}</a>
    <div class="tv-cab"><span class="tv-logo">${TV_IC}</span><div><p class="eyebrow">Entretenimento</p><h1 class="h1">${infantil ? 'TV Nexos Infantil' : 'TV Nexos'}</h1></div></div>
    <p class="muted" style="margin-top:4px">${infantil ? 'Desenhos e músicas em português, dos canais oficiais.' : 'Filmes e documentários de corrida, filmes completos e gratuitos e uma sala para as crianças.'}</p>
    <button type="button" class="tv-hero" data-tv="${esc(hero.id)}" data-sec="${esc(secoes[0].id)}">
      <img src="${tvCapaG(hero)}" alt="" onerror="this.onerror=null;this.src='${tvCapa(hero)}'">
      <span class="tv-hero-txt">${hero.aoVivo ? '<span class="tv-selo vivo"><i></i>AO VIVO</span>' : '<span class="tv-selo">EM DESTAQUE</span>'}<b>${esc(hero.t)}</b><small>${esc(hero.canal)}${hero.d ? ' · ' + esc(hero.d) : ''}</small><span class="tv-assistir">${TV_PLAY} Assistir</span></span>
    </button>
    ${infantil ? '' : '<div id="tv-busca"></div>'}
    ${infantil ? '' : `<a class="tv-kids" href="#/tv/infantil"><img src="${tvCapa(TV_INFANTIL[0].itens[0])}" alt="" loading="lazy"><span><b>Infantil</b><small>Desenhos e músicas em português · canal ao vivo</small></span>${I.chev}</a>`}
    ${secoes
      .map(
        (s) =>
          `<section class="tv-sec"><h2 class="tv-sec-t">${esc(s.nome)}${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</h2><div class="tv-trilho">${s.itens.map((x) => tvCard(x, s.id)).join('')}</div></section>`,
      )
      .join('')}
    <p class="tiny dim tv-nota">Vídeos publicados no YouTube pelos próprios donos: marcas, provas, federações, produtoras e distribuidoras de filmes gratuitos. Os anúncios, quando aparecem, são do YouTube. Vídeos marcados com EN são em inglês: ative a legenda em português na engrenagem do player.</p>`;
  const achar = (id, sec) => {
    const s = porSec[sec];
    return { item: (s && s.itens.find((x) => x.id === id)) || null, secao: s };
  };
  $app.onclick = (e) => {
    const c = e.target.closest('[data-tv]');
    if (!c) return;
    const { item, secao } = achar(c.dataset.tv, c.dataset.sec);
    if (item) tvTocar(item, secao);
  };
  if (!infantil) tvBusca(document.getElementById('tv-busca'), busca);
}

/* busca do YouTube (só aparece quando a chave está configurada) */
async function tvBusca(box, secao) {
  if (!box) return;
  const st = await sb.functions.invoke('nx-youtube', { body: { status: true } }).then(
    (r) => r.data,
    () => null,
  );
  if (!st || !st.ligado || !box.isConnected) return;
  let longo = true,
    genero = null,
    indo = false;
  box.innerHTML = `<form class="tv-busca" id="tv-f"><input class="input" name="q" placeholder="Buscar filme ou vídeo" aria-label="Buscar filme ou vídeo" enterkeyhint="search"><button class="btn sm" id="tv-b">Buscar</button></form>
    <div class="tv-chips" id="tv-gen">${TV_GENEROS.map((g) => `<button type="button" class="chip" data-gen="${esc(g[0])}">${esc(g[0])}</button>`).join('')}</div>
    <div class="tv-chips" id="tv-tipo"><button type="button" class="chip on" data-longo="1">Filmes (longos)</button><button type="button" class="chip" data-longo="0">Tudo</button></div>
    <div id="tv-res"></div>`;
  const f = box.querySelector('#tv-f'),
    res = box.querySelector('#tv-res');
  const rodar = async (termo, titulo) => {
    if (termo.trim().length < 2 || indo) return;
    indo = true;
    res.innerHTML = '<p class="small muted" style="margin-top:10px">Buscando…</p>';
    const { data } = await sb.functions.invoke('nx-youtube', { body: { q: termo.trim(), longo } }).then(
      (r) => r,
      () => ({ data: { erro: 'A busca do YouTube não respondeu agora.' } }),
    );
    indo = false;
    const itens = (data && data.itens) || [];
    secao.itens = itens;
    secao.nome = titulo;
    res.innerHTML =
      data && data.erro
        ? `<p class="small muted" style="margin-top:10px">${esc(data.erro)}</p>`
        : !itens.length
          ? '<p class="small muted" style="margin-top:10px">Nada encontrado. Tente outro nome.</p>'
          : `<section class="tv-sec"><h2 class="tv-sec-t">${esc(titulo)}<small>${itens.length} vídeos</small></h2><div class="tv-grade">${itens.map((x) => tvCard(x, 'busca')).join('')}</div></section>`;
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    genero = null;
    box.querySelectorAll('[data-gen]').forEach((b) => b.classList.remove('on'));
    rodar(f.q.value, 'Resultados');
  };
  box.querySelector('#tv-gen').onclick = (e) => {
    const b = e.target.closest('[data-gen]');
    if (!b) return;
    const g = TV_GENEROS.find((x) => x[0] === b.dataset.gen);
    genero = g[0];
    longo = true;
    box.querySelectorAll('[data-gen]').forEach((x) => x.classList.toggle('on', x === b));
    box.querySelectorAll('[data-longo]').forEach((x) => x.classList.toggle('on', x.dataset.longo === '1'));
    f.q.value = '';
    rodar(g[1], genero);
  };
  box.querySelector('#tv-tipo').onclick = (e) => {
    const b = e.target.closest('[data-longo]');
    if (!b) return;
    longo = b.dataset.longo === '1';
    box.querySelectorAll('[data-longo]').forEach((x) => x.classList.toggle('on', x === b));
  };
}

/* player em tela cheia, com a lista do que mais tem na mesma seção */
function tvTocar(item, secao) {
  document.querySelectorAll('.tv-player').forEach((x) => x.remove());
  const el = document.createElement('div');
  el.className = 'tv-player';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', item.t);
  const desenhar = (x) => {
    const outros = (secao ? secao.itens : []).filter((o) => o.id !== x.id);
    el.innerHTML = `<div class="tv-p-topo"><button type="button" class="icon-btn" data-tvx aria-label="Fechar">${I.x}</button><b class="ellip">${esc(secao ? secao.nome : 'TV Nexos')}</b></div>
      <div class="tv-p-tela"><iframe src="${tvPlayer(x)}" title="${esc(x.t)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      <div class="tv-p-info">${x.aoVivo ? '<span class="tv-selo vivo"><i></i>AO VIVO</span>' : ''}<h2 class="h2">${esc(x.t)}</h2><p class="small muted">${esc(x.canal || '')} · YouTube${x.d ? ' · ' + esc(x.d) : ''}${x.en ? ' · em inglês (ative a legenda na engrenagem do player)' : ''}</p>
        <a class="btn ghost sm" href="${tvFora(x)}" target="_blank" rel="noopener">Não carregou? Abrir no YouTube</a></div>
      ${outros.length ? `<h3 class="tv-sec-t" style="margin-top:18px">Mais em ${esc(secao.nome)}</h3><div class="tv-lista">${outros.map((o) => `<button type="button" data-tvo="${esc(o.id)}"><span class="tv-capa"><img src="${tvCapa(o)}" alt="" loading="lazy">${o.d ? `<em>${esc(o.d)}</em>` : ''}</span><span><b>${esc(o.t)}</b><small>${esc(o.canal || '')}${o.en ? ' · EN' : ''}</small></span></button>`).join('')}</div>` : ''}`;
    el.scrollTop = 0;
  };
  const fechar = () => {
    el.remove();
    window.removeEventListener('hashchange', fechar);
    document.removeEventListener('keydown', tecla);
  };
  const tecla = (e) => e.key === 'Escape' && fechar();
  el.onclick = (e) => {
    if (e.target.closest('[data-tvx]')) return fechar();
    const o = e.target.closest('[data-tvo]');
    if (o) desenhar(secao.itens.find((x) => x.id === o.dataset.tvo));
  };
  window.addEventListener('hashchange', fechar);
  document.addEventListener('keydown', tecla);
  desenhar(item);
  document.body.appendChild(el);
}
