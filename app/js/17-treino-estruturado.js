/* Nexos App · Treino estruturado e biblioteca de corrida por nível.
   Parte 17 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- treino estruturado: passos, zonas e perfil de intensidade ---------- */
const ZONAS_INFO = {
  rec: { z: 'Z1', d: 'Recuperação', n: 'Z1 · Recuperação', c: '#9aa8c0', h: 0.22, pd: 450 },
  leve: { z: 'Z2', d: 'Leve', n: 'Z2 · Leve', c: '#3ddc97', h: 0.4, pd: 390 },
  maratona: { z: 'Z3', d: 'Moderado', n: 'Z3 · Moderado', c: '#46d6ff', h: 0.58, pd: 345 },
  limiar: { z: 'Z4', d: 'Limiar', n: 'Z4 · Limiar', c: '#ffcf5c', h: 0.74, pd: 315 },
  intervalado: { z: 'Z5', d: 'Forte (VO₂)', n: 'Z5 · Forte', c: '#ff9f43', h: 0.88, pd: 290 },
  tiros: { z: 'Z6', d: 'Máximo', n: 'Z6 · Máximo', c: '#ff6b6b', h: 1, pd: 270 },
};
// percepção de esforço (escala de 0 a 10) e teste da fala por zona: usado no modo adaptação (Foster et al. 2008; Reed & Pipe 2014)
const PSE_Z = {
  rec: [1, 2, 'conversa fácil, bem tranquilo'],
  leve: [3, 4, 'consegue conversar em frases completas'],
  maratona: [5, 6, 'fala só frases curtas'],
  limiar: [7, 8, 'fala poucas palavras'],
  intervalado: [9, 9, 'quase não consegue falar'],
  tiros: [10, 10, 'esforço máximo, sem falar'],
};
const pseTxt = (z, curto) => {
  const x = PSE_Z[z] || PSE_Z.leve;
  return `esforço ${x[0]}${x[1] > x[0] ? ' a ' + x[1] : ''} de 10${curto ? '' : ' · ' + x[2]}`;
};
// pace de cada zona para o aluno: faixa dele (pelo teste) ou média, sempre visível (no modo adaptação, o esforço)
const paceZonaTxt = (z, perfil) => {
  if (perfil && perfil.pse) return pseTxt(z);
  const p = perfil && perfil.paces;
  if (p && p[z]) return faixaPace(p[z]);
  return '~' + fmtPace(paceZona(z, perfil));
};
const PASSOS = {
  aq: 'Aquecimento',
  co: 'Corrida',
  rc: 'Recuperação',
  ca: 'Caminhada',
  lv: 'Livre',
  dq: 'Desaquecimento',
};
// caminhada e livre não têm ritmo-alvo: o aluno segue a orientação escrita
const PASSO_LIVRE = { ca: 'caminhada em passo firme e confortável', lv: 'livre: no ritmo que quiser, pela sensação' };
const alvoLivre = (s) => PASSO_LIVRE[s && s.k] || null;
const passo = (k, v, med, z) => ({ k, v, med, z });
const serie = (n, passos) => ({ k: 'rep', n, passos });
/* ---------- biblioteca de corrida por nível (base: método norueguês + ciência atual) ---------- */
const NIVEIS_CORR = [
  ['ini', 'Iniciante'],
  ['int', 'Intermediário'],
  ['ava', 'Avançado'],
  ['pro', 'Profissional'],
];
const CATS_CORR = [
  ['base', 'Base e rodagem'],
  ['limiar', 'Limiar norueguês'],
  ['vo2', 'VO₂máx'],
  ['veloc', 'Velocidade e subidas'],
  ['fartlek', 'Fartlek e progressivos'],
  ['longao', 'Longão'],
  ['rec', 'Recuperação'],
  ['teste', 'Testes e provas'],
  ['off', 'Descanso'],
];
const _A = (v, med = 'km') => passo('aq', v, med, 'leve'),
  _D = (v, med = 'km') => passo('dq', v, med, 'leve'),
  _C = (v, med, z) => passo('co', v, med, z),
  _R = (v, med, z = 'rec') => passo('rc', v, med, z);
const TODOS_NIV = ['ini', 'int', 'ava', 'pro'];
const GUIA_NIV = {
  ini: [
    '3 a 4 corridas por semana, quase tudo leve (Z2).',
    'Uma sessão curta de qualidade (fartlek, subidas ou limiar leve) só depois de 4–6 semanas correndo 30 min sem parar.',
    'Aumente o volume aos poucos e tenha pelo menos 1 day off.',
  ],
  int: [
    '4 a 5 corridas por semana.',
    'Até 2 sessões de sublimiar ou limiar (ex.: terça e quinta), um longão leve no fim de semana e o resto leve.',
    'A qualidade fica em torno de 20–25% do volume da semana.',
  ],
  ava: [
    '5 a 6 corridas por semana.',
    '2 sessões de sublimiar (ex.: terça e quinta) e 1 sessão mais forte acima do limiar no sábado (VO₂ ou subidas).',
    'Longão leve. Duplo limiar só com 80 km ou mais por semana.',
  ],
  pro: [
    'Modelo norueguês completo: 2 dias de duplo limiar (manhã ~2,5 mmol, tarde ~3–3,5 mmol).',
    'Sessão X no sábado; o restante leve, muitas vezes em dois treinos por dia.',
    'Longão leve no domingo. Controle por lactato ou FC: limiar não é prova.',
  ],
};
const INFO_NOR =
  'Método norueguês: limiar controlado, sem passar do ponto (lactato ~2–3,5 mmol, esforço 5–6 de 10, ainda dá para falar frases curtas). Pausas curtas. Na dúvida, mais devagar: o erro mais comum é correr rápido demais.';
const INFO_SUB =
  'Sublimiar (Norwegian singles): blocos longos entre o ritmo de maratona e o de meia maratona, com 1 min de pausa. Para amadores, 2–3 sessões assim por semana somando ~20–25% do volume; o resto é leve.';
const MODELOS_PADRAO = [
  {
    id: 'p-off',
    nome: 'Day off',
    tipo: 'folga',
    estrutura: [],
    niv: TODOS_NIV,
    cat: 'off',
    info: 'Descanso total. Faz parte do treino: é quando o corpo assimila o que foi feito.',
  },
  {
    id: 'p-forca',
    nome: 'Força',
    tipo: 'forca',
    estrutura: [],
    niv: TODOS_NIV,
    cat: 'off',
    info: 'Dia do treino de força que o aluno faz por conta própria (academia ou outro profissional). Nesse dia não tem corrida.',
  },
  // ---------- INICIANTE ----------
  {
    id: 'i-cc8',
    nome: 'Corre e caminha 8 × 1 min',
    tipo: 'rodagem',
    niv: ['ini'],
    cat: 'base',
    info: 'Adaptação ao impacto: alterna trote leve e caminhada. Ideal para as primeiras semanas.',
    estrutura: [_A(5, 'min'), serie(8, [_C(1, 'min', 'leve'), _R(2, 'min')]), _D(5, 'min')],
  },
  {
    id: 'i-cc6',
    nome: 'Corre e caminha 6 × 3 min',
    tipo: 'rodagem',
    niv: ['ini'],
    cat: 'base',
    info: 'Próximo passo do corre e caminha: blocos maiores de corrida com pausa curta caminhando.',
    estrutura: [_A(5, 'min'), serie(6, [_C(3, 'min', 'leve'), _R(1, 'min')]), _D(5, 'min')],
  },
  {
    id: 'i-c20',
    nome: 'Contínuo 20 min leve',
    tipo: 'rodagem',
    niv: ['ini'],
    cat: 'base',
    info: 'Primeira corrida sem parar. Ritmo de conversa (Z2).',
    estrutura: [_C(20, 'min', 'leve')],
  },
  {
    id: 'i-c30',
    nome: 'Contínuo 30 min leve',
    tipo: 'rodagem',
    niv: ['ini'],
    cat: 'base',
    info: 'Base aeróbica: a maior parte do treino de quem corre deve ser assim, leve (modelo polarizado, ~80% em Z1–Z2).',
    estrutura: [_C(30, 'min', 'leve')],
  },
  {
    id: 'i-lim',
    nome: 'Limiar leve 4 × 3 min',
    tipo: 'ritmo',
    niv: ['ini'],
    cat: 'limiar',
    info: 'Primeiro contato com o limiar no estilo norueguês: blocos curtos, controlados, sem chegar ao limite. Use só depois de 4–6 semanas correndo 30 min sem parar.',
    estrutura: [_A(10, 'min'), serie(4, [_C(3, 'min', 'limiar'), _R(2, 'min')]), _D(5, 'min')],
  },
  {
    id: 'i-far',
    nome: 'Fartlek leve 6 × 1 min',
    tipo: 'fartlek',
    niv: ['ini'],
    cat: 'fartlek',
    info: 'Brincadeira de ritmo: 1 min um pouco mais rápido (Z3) e 2 min bem leve.',
    estrutura: [_A(10, 'min'), serie(6, [_C(1, 'min', 'maratona'), _R(2, 'min')]), _D(5, 'min')],
  },
  {
    id: 'i-pro',
    nome: 'Progressivo 25 min',
    tipo: 'ritmo',
    niv: ['ini'],
    cat: 'fartlek',
    info: 'Começa leve e termina moderado. Ensina a controlar o ritmo.',
    estrutura: [_C(18, 'min', 'leve'), _C(7, 'min', 'maratona')],
  },
  {
    id: 'i-sub',
    nome: 'Subidas curtas 6 × 60 m',
    tipo: 'tiros',
    niv: ['ini'],
    cat: 'veloc',
    info: 'Força e técnica de corrida com pouco impacto (a subida reduz a carga nas articulações). Volta caminhando.',
    estrutura: [_A(10, 'min'), serie(6, [_C(60, 'm', 'tiros'), _R(1.5, 'min')]), _D(5, 'min')],
  },
  {
    id: 'i-lo40',
    nome: 'Longão 40 min',
    tipo: 'longao',
    niv: ['ini'],
    cat: 'longao',
    info: 'O treino mais longo da semana, sempre leve. Constrói resistência.',
    estrutura: [_C(40, 'min', 'leve')],
  },
  {
    id: 'i-lo5',
    nome: 'Longão 5 km',
    tipo: 'longao',
    niv: ['ini'],
    cat: 'longao',
    info: 'Longão por distância para quem já corre 30 min sem parar.',
    estrutura: [_C(5, 'km', 'leve')],
  },
  {
    id: 'i-reg',
    nome: 'Regenerativo 20 min',
    tipo: 'regenerativo',
    niv: ['ini'],
    cat: 'rec',
    info: 'Trote muito leve (Z1) para recuperar no dia seguinte a um treino forte.',
    estrutura: [_C(20, 'min', 'rec')],
  },
  {
    id: 'p-te3',
    nome: 'Teste de 3 km',
    tipo: 'teste',
    niv: ['ini', 'int'],
    cat: 'teste',
    info: 'Correr 3 km no máximo sustentável. O tempo dá o VDOT (Daniels & Gilbert) e entra em Ritmos e zonas, calculando os paces de cada zona do aluno.',
    estrutura: [_A(10, 'min'), _C(3, 'km', 'intervalado'), _D(5, 'min')],
  },
  // ---------- INTERMEDIÁRIO ----------
  {
    id: 'p-rod',
    nome: 'Rodagem leve 6 km',
    tipo: 'rodagem',
    niv: ['int'],
    cat: 'base',
    info: 'Rodagem de base em Z2.',
    estrutura: [_C(6, 'km', 'leve')],
  },
  {
    id: 'm-r8',
    nome: 'Rodagem 8 km',
    tipo: 'rodagem',
    niv: ['int', 'ava'],
    cat: 'base',
    info: 'Volume aeróbico em ritmo de conversa.',
    estrutura: [_C(8, 'km', 'leve')],
  },
  {
    id: 'm-str',
    nome: 'Rodagem + 6 strides',
    tipo: 'rodagem',
    niv: ['int', 'ava'],
    cat: 'veloc',
    info: 'Rodagem leve com 6 acelerações de 100 m no fim: melhora a economia de corrida sem cansar.',
    estrutura: [_C(6, 'km', 'leve'), serie(6, [_C(100, 'm', 'tiros'), _R(100, 'm')])],
  },
  {
    id: 'm-5x6',
    nome: 'Sublimiar 5 × 6 min',
    tipo: 'ritmo',
    niv: ['int', 'ava'],
    cat: 'limiar',
    info: INFO_SUB,
    estrutura: [_A(2), serie(5, [_C(6, 'min', 'maratona'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'm-3x10',
    nome: 'Sublimiar 3 × 10 min',
    tipo: 'ritmo',
    niv: ['int', 'ava'],
    cat: 'limiar',
    info: INFO_SUB,
    estrutura: [_A(2), serie(3, [_C(10, 'min', 'maratona'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'm-8x3',
    nome: 'Limiar 8 × 3 min',
    tipo: 'ritmo',
    niv: ['int'],
    cat: 'limiar',
    info: 'Versão “por tempo” do 10 × 1000 m norueguês, para quem ainda corre o km mais devagar. ' + INFO_NOR,
    estrutura: [_A(2), serie(8, [_C(3, 'min', 'limiar'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'm-6x1k',
    nome: 'Limiar 6 × 1000 m',
    tipo: 'ritmo',
    niv: ['int'],
    cat: 'limiar',
    info: INFO_NOR,
    estrutura: [_A(2), serie(6, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'p-rit',
    nome: 'Sublimiar 3 × 2 km',
    tipo: 'ritmo',
    niv: ['int'],
    cat: 'limiar',
    info: INFO_SUB,
    estrutura: [_A(2), serie(3, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'm-tmp',
    nome: 'Tempo run 20 min',
    tipo: 'ritmo',
    niv: ['int'],
    cat: 'limiar',
    info: 'Clássico contínuo no limiar. Bom para treinar a sensação do ritmo de prova de 10–21 km.',
    estrutura: [_A(2), _C(20, 'min', 'limiar'), _D(1)],
  },
  {
    id: 'm-4x4',
    nome: '4 × 4 min (NTNU)',
    tipo: 'intervalado',
    niv: ['int', 'ava'],
    cat: 'vo2',
    info: 'Protocolo da NTNU (Helgerud et al.): 4 min a 90–95% da FC máx com 3 min de trote a ~70%. Em 8 semanas, 3 vezes por semana, o VO₂máx subiu cerca de 8%, mais que corrida contínua ou no limiar com o mesmo gasto.',
    estrutura: [_A(2), serie(4, [_C(4, 'min', 'intervalado'), _R(3, 'min')]), _D(1)],
  },
  {
    id: 'p-int',
    nome: '6 × 800 m',
    tipo: 'intervalado',
    niv: ['int'],
    cat: 'vo2',
    info: 'Intervalado clássico em Z5 para potência aeróbica.',
    estrutura: [_A(2), serie(6, [_C(800, 'm', 'intervalado'), _R(2, 'min')]), _D(1)],
  },
  {
    id: 'm-f10',
    nome: 'Fartlek 10 × 1 min',
    tipo: 'fartlek',
    niv: ['int'],
    cat: 'fartlek',
    info: '1 min no limiar e 1 min leve, sem parar. Trabalha troca de ritmo.',
    estrutura: [_A(10, 'min'), serie(10, [_C(1, 'min', 'limiar'), _R(1, 'min', 'leve')]), _D(10, 'min')],
  },
  {
    id: 'p-pro',
    nome: 'Progressivo 6 km',
    tipo: 'ritmo',
    niv: ['int'],
    cat: 'fartlek',
    info: 'Termina mais rápido do que começa: Z2, Z3 e Z4.',
    estrutura: [_C(3, 'km', 'leve'), _C(2, 'km', 'maratona'), _C(1, 'km', 'limiar')],
  },
  {
    id: 'm-sub',
    nome: 'Subidas 8 × 100 m',
    tipo: 'tiros',
    niv: ['int'],
    cat: 'veloc',
    info: 'Força específica na subida, volta trotando. Protege de lesão e melhora a passada.',
    estrutura: [_A(2), serie(8, [_C(100, 'm', 'tiros'), _R(1.5, 'min')]), _D(1)],
  },
  {
    id: 'm-l12',
    nome: 'Longão 12 km',
    tipo: 'longao',
    niv: ['int'],
    cat: 'longao',
    info: 'Longão leve em Z2.',
    estrutura: [_C(12, 'km', 'leve')],
  },
  {
    id: 'p-lon',
    nome: 'Longão 14 km',
    tipo: 'longao',
    niv: ['int', 'ava'],
    cat: 'longao',
    info: 'Longão leve em Z2.',
    estrutura: [_C(14, 'km', 'leve')],
  },
  {
    id: 'p-reg',
    nome: 'Regenerativo 30 min',
    tipo: 'regenerativo',
    niv: ['int', 'ava', 'pro'],
    cat: 'rec',
    info: 'Trote muito leve (Z1). Recupera sem gerar fadiga.',
    estrutura: [_C(30, 'min', 'rec')],
  },
  {
    id: 'p-tes',
    nome: 'Teste de 5 km',
    tipo: 'teste',
    niv: ['int', 'ava', 'pro'],
    cat: 'teste',
    info: 'Correr 5 km no máximo. O tempo dá o VDOT (Daniels & Gilbert) e recalcula os paces em Ritmos e zonas.',
    estrutura: [_A(2), _C(5, 'km', 'intervalado'), _D(1)],
  },
  // ---------- AVANÇADO ----------
  {
    id: 'a-r10',
    nome: 'Rodagem 10 km',
    tipo: 'rodagem',
    niv: ['ava', 'pro'],
    cat: 'base',
    info: 'Volume aeróbico em Z2.',
    estrutura: [_C(10, 'km', 'leve')],
  },
  {
    id: 'a-5x2',
    nome: 'Sublimiar 5 × 2 km',
    tipo: 'ritmo',
    niv: ['ava', 'pro'],
    cat: 'limiar',
    info: INFO_SUB,
    estrutura: [_A(3), serie(5, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(2)],
  },
  {
    id: 'a-25x4',
    nome: '25 × 400 m sublimiar',
    tipo: 'ritmo',
    niv: ['ava', 'pro'],
    cat: 'limiar',
    info: 'Sessão marcante dos Ingebrigtsen: muitos 400 m no limiar com 30 s de pausa. Muito volume de limiar com pouca fadiga.',
    estrutura: [_A(3), serie(25, [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)],
  },
  {
    id: 'a-10x1k',
    nome: 'Limiar 10 × 1000 m',
    tipo: 'ritmo',
    niv: ['ava'],
    cat: 'limiar',
    info: INFO_NOR,
    estrutura: [_A(3), serie(10, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)],
  },
  {
    id: 'a-4x8',
    nome: '4 × 8 min (Seiler)',
    tipo: 'intervalado',
    niv: ['ava'],
    cat: 'vo2',
    info: 'Estudo de Seiler et al. (2013, com ciclistas recreativos): 4 × 8 min no máximo sustentável, com 2 min de pausa, trouxe mais ganho que 4 × 4 ou 4 × 16.',
    estrutura: [_A(3), serie(4, [_C(8, 'min', 'limiar'), _R(2, 'min')]), _D(2)],
  },
  {
    id: 'a-dlm',
    nome: 'Duplo limiar · manhã 5 × 6 min',
    tipo: 'ritmo',
    niv: ['ava'],
    cat: 'limiar',
    info: 'Dia de duplo limiar: manhã mais suave (blocos longos, lactato ~2,5) e tarde um pouco mais forte. Só para quem já corre 80 km ou mais por semana; para os outros, uma sessão de sublimiar por dia rende quase o mesmo.',
    estrutura: [_A(2), serie(5, [_C(6, 'min', 'maratona'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'a-dlt',
    nome: 'Duplo limiar · tarde 10 × 1000 m',
    tipo: 'ritmo',
    niv: ['ava'],
    cat: 'limiar',
    info: 'Tarde do dia de duplo limiar (lactato ~3–3,5): tiros mais curtos, um pouco mais rápidos. Deve terminar com a sensação de que dava para mais. Só para quem já corre 80 km ou mais por semana.',
    estrutura: [_A(2), serie(10, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(1)],
  },
  {
    id: 'a-5x1k',
    nome: '5 × 1000 m VO₂',
    tipo: 'intervalado',
    niv: ['ava'],
    cat: 'vo2',
    info: 'Intervalado em Z5 com pausa de 2 min. Potência aeróbica para 5 e 10 km.',
    estrutura: [_A(3), serie(5, [_C(1000, 'm', 'intervalado'), _R(2, 'min')]), _D(2)],
  },
  {
    id: 'a-pir',
    nome: 'Pirâmide 400 a 1600 m',
    tipo: 'intervalado',
    niv: ['ava'],
    cat: 'vo2',
    info: 'Sobe e desce de distância em Z5. Variado e muito específico para provas de 5–10 km.',
    estrutura: [
      _A(3),
      _C(400, 'm', 'intervalado'),
      _R(1, 'min'),
      _C(800, 'm', 'intervalado'),
      _R(1.5, 'min'),
      _C(1200, 'm', 'intervalado'),
      _R(2, 'min'),
      _C(1600, 'm', 'intervalado'),
      _R(2, 'min'),
      _C(1200, 'm', 'intervalado'),
      _R(2, 'min'),
      _C(800, 'm', 'intervalado'),
      _R(1.5, 'min'),
      _C(400, 'm', 'intervalado'),
      _D(2),
    ],
  },
  {
    id: 'a-f21',
    nome: 'Fartlek 8 × (2 + 1 min)',
    tipo: 'fartlek',
    niv: ['ava'],
    cat: 'fartlek',
    info: '2 min no limiar e 1 min leve, contínuo.',
    estrutura: [_A(2), serie(8, [_C(2, 'min', 'limiar'), _R(1, 'min', 'leve')]), _D(1)],
  },
  {
    id: 'a-sub',
    nome: 'Subidas 10 × 200 m',
    tipo: 'tiros',
    niv: ['ava'],
    cat: 'veloc',
    info: 'Subida forte (Z6) e volta trotando. Força específica e potência.',
    estrutura: [_A(3), serie(10, [_C(200, 'm', 'tiros'), _R(200, 'm')]), _D(2)],
  },
  {
    id: 'p-tir',
    nome: '10 × 200 m velocidade',
    tipo: 'tiros',
    niv: ['ava', 'pro'],
    cat: 'veloc',
    info: 'Velocidade pura (Z6) com recuperação completa. Mantém a passada rápida e econômica.',
    estrutura: [_A(2), serie(10, [_C(200, 'm', 'tiros'), _R(200, 'm')]), _D(1)],
  },
  {
    id: 'a-l18',
    nome: 'Longão 18 km com final forte',
    tipo: 'longao',
    niv: ['ava'],
    cat: 'longao',
    info: '14 km leves e os 4 últimos em ritmo moderado (Z3). Prepara para terminar forte na prova.',
    estrutura: [_C(14, 'km', 'leve'), _C(4, 'km', 'maratona')],
  },
  // ---------- PROFISSIONAL ----------
  {
    id: 'r-r14',
    nome: 'Rodagem 14 km',
    tipo: 'rodagem',
    niv: ['pro'],
    cat: 'base',
    info: 'Volume aeróbico em Z2.',
    estrutura: [_C(14, 'km', 'leve')],
  },
  {
    id: 'r-dlm',
    nome: 'Duplo limiar · manhã 5 × 2 km',
    tipo: 'ritmo',
    niv: ['pro'],
    cat: 'limiar',
    info: 'Manhã do dia de duplo limiar (modelo Bakken/Ingebrigtsen), lactato ~2,5 mmol. Controle o ritmo: limiar, não prova. Combine com 25 × 400 m ou 10 × 1000 m à tarde.',
    estrutura: [_A(3), serie(5, [_C(2, 'km', 'maratona'), _R(1, 'min')]), _D(2)],
  },
  {
    id: 'r-dlt',
    nome: 'Duplo limiar · tarde 25 × 400 m',
    tipo: 'ritmo',
    niv: ['pro'],
    cat: 'limiar',
    info: 'Tarde do dia de duplo limiar: 400 m no limiar com 30 s de pausa.',
    estrutura: [_A(3), serie(25, [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)],
  },
  {
    id: 'r-4x3',
    nome: 'Sublimiar 4 × 3 km',
    tipo: 'ritmo',
    niv: ['pro'],
    cat: 'limiar',
    info: INFO_SUB,
    estrutura: [_A(3), serie(4, [_C(3, 'km', 'maratona'), _R(1.5, 'min')]), _D(2)],
  },
  {
    id: 'r-12x1k',
    nome: 'Limiar 12 × 1000 m',
    tipo: 'ritmo',
    niv: ['pro'],
    cat: 'limiar',
    info: INFO_NOR,
    estrutura: [_A(3), serie(12, [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)],
  },
  {
    id: 'r-6x16',
    nome: '6 × 1600 m VO₂',
    tipo: 'intervalado',
    niv: ['pro'],
    cat: 'vo2',
    info: 'Bloco longo em Z5 com 2 min de pausa. Específico para 10 km e meia.',
    estrutura: [_A(3), serie(6, [_C(1600, 'm', 'intervalado'), _R(2, 'min')]), _D(2)],
  },
  {
    id: 'r-20x4',
    nome: '20 × 400 m',
    tipo: 'intervalado',
    niv: ['pro'],
    cat: 'vo2',
    info: '400 m em Z5 com 45 s de pausa. Potência aeróbica com volume.',
    estrutura: [_A(3), serie(20, [_C(400, 'm', 'intervalado'), _R(0.75, 'min')]), _D(2)],
  },
  {
    id: 'r-x',
    nome: 'Sprints em subida 10 × 60 m',
    tipo: 'tiros',
    niv: ['ava', 'pro'],
    cat: 'veloc',
    info: 'Sprints curtos e fortes em subida no fim de uma rodagem leve, com pausa completa. Potência e força com pouca fadiga.',
    estrutura: [_C(10, 'km', 'leve'), serie(10, [_C(60, 'm', 'tiros'), _R(2, 'min')])],
  },
  {
    id: 'r-x2',
    nome: 'Sessão X · 20 × 200 m em subida',
    tipo: 'intervalado',
    niv: ['ava', 'pro'],
    cat: 'vo2',
    info: 'O “X” do modelo norueguês: uma sessão por semana acima do limiar (geralmente no sábado), muitas vezes em subida. Volta trotando na descida.',
    estrutura: [_A(3), serie(20, [_C(200, 'm', 'intervalado'), _R(200, 'm')]), _D(2)],
  },
  {
    id: 'r-l25',
    nome: 'Longão 25 km com 5 km em ritmo',
    tipo: 'longao',
    niv: ['pro'],
    cat: 'longao',
    info: '20 km em Z2 e 5 km em ritmo de maratona (Z3). Específico para meia e maratona.',
    estrutura: [_C(20, 'km', 'leve'), _C(5, 'km', 'maratona')],
  },
  {
    id: 'r-l30',
    nome: 'Longão 30 km',
    tipo: 'longao',
    niv: ['pro'],
    cat: 'longao',
    info: 'Longão de maratona, todo em Z2.',
    estrutura: [_C(30, 'km', 'leve')],
  },
  // ---------- TESTES DE CAMPO PARA ZONAS (com base científica) ----------
  {
    id: 't-fala',
    nome: 'Teste da fala (Talk Test)',
    tipo: 'teste',
    niv: ['ini'],
    cat: 'teste',
    info: 'Estágios de 3 min, cada um um pouco mais rápido. No fim de cada estágio o aluno fala um texto curto. O último estágio em que ainda fala com conforto corresponde ao 1º limiar ventilatório (VT1): é o topo da Z2. Validado em Persinger et al. (2004) e Foster et al. (2008). Ideal para iniciantes, sem precisar de relógio.',
    estrutura: [
      _A(5, 'min'),
      _C(3, 'min', 'rec'),
      _C(3, 'min', 'leve'),
      _C(3, 'min', 'maratona'),
      _C(3, 'min', 'limiar'),
      _D(5, 'min'),
    ],
  },
  {
    id: 't-rock',
    nome: 'Teste de caminhada de 1,6 km (Rockport)',
    tipo: 'teste',
    niv: ['ini'],
    cat: 'teste',
    info: 'Caminhar 1.609 m o mais rápido possível, sem correr. Anotar o tempo e a FC ao terminar. O VO₂máx sai pela equação de Kline et al. (1987), que usa peso, idade, sexo, tempo e FC. Para sedentários e quem está começando.',
    estrutura: [_A(5, 'min'), _C(1.6, 'km', 'leve'), _D(5, 'min')],
  },
  {
    id: 't-cooper',
    nome: 'Teste de Cooper (12 min)',
    tipo: 'teste',
    niv: ['ini', 'int'],
    cat: 'teste',
    info: 'Maior distância possível em 12 min. VO₂máx ≈ (distância em m − 504,9) ÷ 44,73 (Cooper, 1968). Bom para acompanhar a evolução; a distância também estima o VDOT para os paces de zona.',
    estrutura: [_A(15, 'min'), _C(12, 'min', 'intervalado'), _D(10, 'min')],
  },
  {
    id: 't-2400',
    nome: 'Teste de 2.400 m',
    tipo: 'teste',
    niv: ['ini', 'int'],
    cat: 'teste',
    info: 'Correr 2.400 m (1,5 milha) no menor tempo. VO₂máx ≈ 3,5 + 483 ÷ tempo em minutos (ACSM). Muito usado em avaliações físicas; o tempo também estima o VDOT.',
    estrutura: [_A(15, 'min'), _C(2.4, 'km', 'intervalado'), _D(10, 'min')],
  },
  {
    id: 't-30',
    nome: 'Teste de 30 min (Friel)',
    tipo: 'teste',
    niv: ['int', 'ava', 'pro'],
    cat: 'teste',
    info: 'Correr 30 min sozinho no máximo sustentável, de forma constante. A FC média dos últimos 20 min é a FC de limiar (LTHR) e o pace médio é o pace de limiar. As zonas de FC saem em % da LTHR (Friel, 2009). Precisa de relógio com FC.',
    estrutura: [_A(15, 'min'), _C(30, 'min', 'limiar'), _D(10, 'min')],
  },
  {
    id: 't-vam',
    nome: 'Teste progressivo de VAM (Léger-Boucher)',
    tipo: 'teste',
    niv: ['int', 'ava', 'pro'],
    cat: 'teste',
    info: 'Na pista ou na esteira: começa a 8 km/h e sobe 1 km/h a cada 2 min até não conseguir manter. A velocidade do último estágio completo é a VAM (velocidade aeróbia máxima); VO₂máx ≈ 3,5 × VAM em km/h (Léger & Boucher, 1980). Zonas em % da VAM. Ajuste a quantidade de estágios ao aluno.',
    estrutura: [
      _A(10, 'min'),
      _C(2, 'min', 'rec'),
      _C(2, 'min', 'leve'),
      _C(2, 'min', 'leve'),
      _C(2, 'min', 'maratona'),
      _C(2, 'min', 'maratona'),
      _C(2, 'min', 'limiar'),
      _C(2, 'min', 'limiar'),
      _C(2, 'min', 'intervalado'),
      _C(2, 'min', 'intervalado'),
      _C(2, 'min', 'tiros'),
      _D(10, 'min'),
    ],
  },
  {
    id: 't-vc',
    nome: 'Teste de velocidade crítica (1.200 m + 3.600 m)',
    tipo: 'teste',
    niv: ['ava', 'pro'],
    cat: 'teste',
    info: 'Duas provas no máximo, com 30 min de descanso (ou em dias diferentes). Velocidade crítica = (3.600 − 1.200) ÷ (tempo 2 − tempo 1), em m/s. A VC marca o limite entre os domínios pesado e severo e é muito usada para os treinos de limiar e VO₂ (Jones & Vanhatalo, 2017).',
    estrutura: [_A(15, 'min'), _C(1.2, 'km', 'tiros'), _R(30, 'min'), _C(3.6, 'km', 'intervalado'), _D(10, 'min')],
  },
  {
    id: 't-fcmax',
    nome: 'Teste de FC máxima de campo',
    tipo: 'teste',
    niv: ['int', 'ava', 'pro'],
    cat: 'teste',
    info: 'De preferência numa subida leve: 3 min forte, 2 min de trote, 2 min muito forte, 2 min de trote e 1 min no máximo. A maior FC registrada é a FC máxima, bem mais precisa que 220 − idade (erro de ±10 bpm; Tanaka et al., 2001). Só para quem já treina e sem restrição médica.',
    estrutura: [
      _A(15, 'min'),
      _C(3, 'min', 'limiar'),
      _R(2, 'min'),
      _C(2, 'min', 'intervalado'),
      _R(2, 'min'),
      _C(1, 'min', 'tiros'),
      _D(10, 'min'),
    ],
  },
  {
    id: 't-10k',
    nome: 'Teste de 10 km',
    tipo: 'teste',
    niv: ['ava', 'pro'],
    cat: 'teste',
    info: 'Correr 10 km no máximo (pode ser uma prova). O tempo dá o VDOT (Daniels & Gilbert) e o pace se aproxima do limiar para quem corre em até 40 min. Recalcula os paces em Ritmos e zonas.',
    estrutura: [_A(2), _C(10, 'km', 'limiar'), _D(1)],
  },
  {
    id: 'p-prv',
    nome: 'Prova',
    tipo: 'prova',
    niv: TODOS_NIV,
    cat: 'teste',
    info: 'Dia de prova. Ajuste a distância no editor.',
    estrutura: [_C(10, 'km', 'maratona')],
  },
];
// filtro de nível da biblioteca (lembra a escolha)
const chipsNivHTML = (sel, id) =>
  `<div class="chips niv-chips" id="${id}">${[['todos', 'Todos'], ...NIVEIS_CORR, ['meus', 'Meus']].map(([k, l]) => `<button type="button" class="chip ${sel === k ? 'on' : ''}" data-niv="${k}">${l}</button>`).join('')}</div>`;
const passaNiv = (md, sel) => sel === 'todos' || (sel === 'meus' ? !!md.org_id : (md.niv || []).includes(sel));
const ordemCat = (md) => {
  if (md.cat === 'off') return -1;
  const i = CATS_CORR.findIndex((c) => c[0] === md.cat);
  return i < 0 ? 99 : i;
};
const clone = (x) => JSON.parse(JSON.stringify(x));
function paceZona(z, perfil) {
  const p = perfil && perfil.paces;
  if (z === 'rec') return p && p.rec ? (p.rec[0] + p.rec[1]) / 2 : p && p.leve ? p.leve[1] * 1.12 : ZONAS_INFO.rec.pd;
  return p && p[z] ? (p[z][0] + p[z][1]) / 2 : (ZONAS_INFO[z] || ZONAS_INFO.leve).pd;
}
/** lista achatada de passos com metros e segundos estimados */
function achatar(estrutura, perfil) {
  const out = [];
  const add = (s, rep) => {
    const pace = s.k === 'ca' ? 600 : paceZona(s.z, perfil);
    const m = s.med === 'km' ? s.v * 1000 : s.med === 'm' ? s.v : ((s.v * 60) / pace) * 1000;
    const seg = s.med === 'min' ? s.v * 60 : (m / 1000) * pace;
    out.push({ ...s, metros: m, seg, rep });
  };
  (estrutura || []).forEach((s) => {
    if (s.k === 'rep') {
      for (let i = 0; i < (s.n || 1); i++) (s.passos || []).forEach((p) => add(p, i + 1));
    } else add(s);
  });
  return out;
}
/** faixa de pace (s/km, [rápido, lento]) do aluno numa zona */
function faixaZona(z, perfil) {
  const p = perfil && perfil.paces;
  if (p && p[z]) {
    const a = Math.min(p[z][0], p[z][1]),
      b = Math.max(p[z][0], p[z][1]);
    return a === b ? [a * 0.97, a * 1.03] : [a, b];
  }
  if (z === 'rec' && p && p.leve) return [Math.max(p.leve[0], p.leve[1]) * 1.08, Math.max(p.leve[0], p.leve[1]) * 1.16];
  const c = paceZona(z, perfil);
  return [c * 0.96, c * 1.04];
}
const kmTxt = (km) =>
  km < 1 ? `${Math.round(km * 100) * 10} m` : `${(Math.round(km * 10) / 10).toString().replace('.', ',')} km`;
const faixaKmTxt = (a, b) => {
  const x = kmTxt(a),
    y = kmTxt(b);
  if (x === y) return x;
  return a < 1 && b < 1
    ? `${x.replace(' m', '')}–${y}`
    : a >= 1 && b >= 1
      ? `${x.replace(' km', '')}–${y}`
      : `${x}–${y}`;
};
const faixaDurTxt = (a, b) => {
  const x = fmtDur(a),
    y = fmtDur(b);
  return x === y ? x : `${x}–${y}`;
};
/** estimativa de um passo: por tempo → distância; por distância → tempo (pela faixa de pace do aluno) */
function estimaPasso(s, perfil) {
  const [a, b] = faixaZona(s.z, perfil);
  if (s.med === 'min') {
    const seg = s.v * 60;
    return { tipo: 'dist', txt: faixaKmTxt(seg / b, seg / a) };
  }
  const km = s.med === 'km' ? s.v : s.v / 1000;
  return { tipo: 'tempo', txt: faixaDurTxt(km * a, km * b) };
}
/** total estimado do treino (faixa de km e de tempo) */
function estimaTotal(estrutura, perfil) {
  let k0 = 0,
    k1 = 0,
    t0 = 0,
    t1 = 0;
  const add = (s, n = 1) => {
    const [a, b] = faixaZona(s.z, perfil);
    if (s.med === 'min') {
      const seg = s.v * 60 * n;
      t0 += seg;
      t1 += seg;
      k0 += seg / b;
      k1 += seg / a;
    } else {
      const km = (s.med === 'km' ? s.v : s.v / 1000) * n;
      k0 += km;
      k1 += km;
      t0 += km * a;
      t1 += km * b;
    }
  };
  (estrutura || []).forEach((s) => (s.k === 'rep' ? (s.passos || []).forEach((p) => add(p, s.n || 1)) : add(s)));
  if (perfil && perfil.pse) {
    const temT = JSON.stringify(estrutura || []).includes('"min"'),
      temD = /"med":"(km|m)"/.test(JSON.stringify(estrutura || []));
    return {
      km: temT ? 'pela sensação' : faixaKmTxt(k0, k1),
      tempo: temD ? 'pela sensação' : faixaDurTxt(t0, t1),
      soDist: true,
      soTempo: true,
    };
  }
  return { km: faixaKmTxt(k0, k1), tempo: faixaDurTxt(t0, t1), soDist: k0 === k1, soTempo: t0 === t1 };
}
// tempo no estilo das planilhas: 1h03'44" · 25'00"
const tempoAsp = (sg) => {
  sg = Math.round(sg);
  const h = Math.floor(sg / 3600),
    m = Math.floor((sg % 3600) / 60),
    x = sg % 60;
  return h
    ? `${h}h${String(m).padStart(2, '0')}'${String(x).padStart(2, '0')}"`
    : `${m}'${String(x).padStart(2, '0')}"`;
};
const paceAsp = (a, b) => `${fmtPace(a).replace('/km', '')} a ${fmtPace(b)}`;
/** treino escrito passo a passo, frases curtas (cartão do aluno) */
function linhasTreino(estrutura, perfil) {
  const verbo = { aq: 'Aquecer', co: 'Correr', rc: 'Recuperar', ca: 'Caminhar', lv: 'Livre', dq: 'Desaquecer' };
  const frase = (s, verboOn = true) => {
    const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
    if (alvoLivre(s))
      return `${verboOn ? `<b>${verbo[s.k]}</b> ` : ''}${s.med === 'min' ? `${String(s.v).replace('.', ',')} min` : medTxt(s)} <span class="lt-est">${alvoLivre(s)}</span>`;
    if (perfil && perfil.pse)
      return `${verboOn ? `<b>${verbo[s.k] || 'Correr'}</b> ` : ''}${s.med === 'min' ? `${String(s.v).replace('.', ',')} min` : medTxt(s)} em <b>${z.z}</b> · ${z.d} (${pseTxt(s.z)}) <span class="lt-est">sem olhar o ritmo: siga a sensação</span>`;
    const [a, b] = faixaZona(s.z, perfil);
    const e = estimaPasso(s, perfil);
    const qto = s.med === 'min' ? `${String(s.v).replace('.', ',')} min` : medTxt(s);
    const fim =
      s.med === 'min'
        ? `cerca de ${e.txt.replace('–', ' a ')}`
        : `completar entre ${tempoAsp(s.med === 'km' ? s.v * a : (s.v / 1000) * a)} e ${tempoAsp(s.med === 'km' ? s.v * b : (s.v / 1000) * b)}`;
    return `${verboOn ? `<b>${verbo[s.k] || 'Correr'}</b> ` : ''}${qto} em <b>${z.z}</b> · ${z.d} (${paceAsp(a, b)}) <span class="lt-est">${fim}</span>`;
  };
  return (estrutura || [])
    .map((s) =>
      s.k === 'rep'
        ? `<li><b>Repetir ${s.n}×:</b><ul>${(s.passos || []).map((p) => `<li>${frase(p)}</li>`).join('')}</ul></li>`
        : `<li>${frase(s)}</li>`,
    )
    .join('');
}
function estimaTotalSeg(estrutura, perfil) {
  let t0 = 0,
    t1 = 0;
  const add = (s, n = 1) => {
    const [a, b] = faixaZona(s.z, perfil);
    if (s.med === 'min') {
      t0 += s.v * 60 * n;
      t1 += s.v * 60 * n;
    } else {
      const km = (s.med === 'km' ? s.v : s.v / 1000) * n;
      t0 += km * a;
      t1 += km * b;
    }
  };
  (estrutura || []).forEach((s) => (s.k === 'rep' ? (s.passos || []).forEach((p) => add(p, s.n || 1)) : add(s)));
  return [t0, t1];
}
function resumoEstrutura(estrutura, perfil) {
  const l = achatar(estrutura, perfil);
  const r = { km: l.reduce((a, s) => a + s.metros, 0) / 1000, seg: l.reduce((a, s) => a + s.seg, 0) };
  // no modo adaptação não há estimativa: só mostra km se o treino é todo por distância, e tempo se é todo por tempo
  if (perfil && perfil.pse) {
    const porT = l.some((s) => s.med === 'min'),
      porD = l.some((s) => s.med !== 'min');
    r.mostraKm = !porT;
    r.mostraSeg = !porD;
  } else {
    r.mostraKm = true;
    r.mostraSeg = true;
  }
  return r;
}
const medTxt = (s) =>
  s.med === 'km'
    ? `${String(s.v).replace('.', ',')} km`
    : s.med === 'm'
      ? `${s.v} m`
      : `${String(s.v).replace('.', ',')} min`;
function descreverEstrutura(estrutura, perfil) {
  const zt = (p) => {
    if (alvoLivre(p)) return `(${alvoLivre(p)})`;
    const z = ZONAS_INFO[p.z] || ZONAS_INFO.leve;
    return `${z.z}${perfil ? ' (' + paceZonaTxt(p.z, perfil).replace('/km', '') + ')' : ''}`;
  };
  const est = (p) => (perfil && !perfil.pse && p.med === 'min' ? ` ≈${estimaPasso(p, perfil).txt}` : '');
  return (estrutura || [])
    .map((s) =>
      s.k === 'rep'
        ? `${s.n}× (${(s.passos || []).map((p) => `${medTxt(p)} ${zt(p)}${est(p)}`).join(' + ')})`
        : `${s.k === 'aq' ? 'Aquecimento ' : s.k === 'dq' ? 'Desaquecimento ' : s.k === 'ca' ? 'Caminhada ' : s.k === 'lv' ? 'Livre ' : ''}${medTxt(s)} ${zt(s)}${est(s)}`,
    )
    .join(' · ');
}
function perfilHTML(estrutura, perfil, alto = false) {
  const l = achatar(estrutura, perfil);
  const tot = l.reduce((a, s) => a + s.seg, 0) || 1;
  if (!l.length) return '<div class="perfil-int vazio"></div>';
  return `<div class="perfil-int ${alto ? 'alto' : ''}" aria-hidden="true">${l
    .map((s) => {
      const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
      return `<i style="flex:${((s.seg / tot) * 100).toFixed(2)};height:${Math.round(z.h * 100)}%;background:${z.c}"></i>`;
    })
    .join('')}</div>`;
}
function estruturaDe(p) {
  if (semCorrida(p)) return [];
  if (p.estrutura && p.estrutura.length) return p.estrutura;
  if (p.distancia_km) return [passo('co', +p.distancia_km, 'km', p.zona || 'leve')];
  if (p.duracao_min) return [passo('co', +p.duracao_min, 'min', p.zona || 'leve')];
  return [];
}
