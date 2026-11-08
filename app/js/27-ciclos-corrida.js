/* Nexos App · Ciclos prontos de corrida e modelos de treino de corrida.
   Parte 27 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Ciclos prontos de corrida: macro, meso e microciclos completos ----------
   Cada ciclo gera todas as semanas (treino a treino) e vai inteiro para a planilha do aluno, sem liberar.
   O treinador ajusta o que quiser e libera semana a semana.
   Base científica:
   · distribuição de intensidade com ~80% leve (Seiler 2010; Stöggl & Sperlich 2014) e muito volume de limiar controlado
     com pausas curtas no estilo norueguês (Haugen et al. 2022; Casado et al. 2021 e 2023);
   · progressão gradual, sem treino isolado mais de 10% acima do mais longo dos últimos 30 dias (Frandsen et al. 2025), e semana de recuperação a cada 3–4 semanas;
   · fases base → construção → específica → polimento (periodização em blocos; Issurin 2010);
   · polimento: volume 40–60% menor mantendo a intensidade e a frequência (Bosquet et al. 2007; Mujika & Padilla 2003). */
const CIC_OBJ = [
  ['trilhas', 'Trilhas'],
  ['modelos', 'Modelos de treino'],
  ['ini', 'Começar a correr'],
  ['5k', '5 km'],
  ['10k', '10 km'],
  ['21k', 'Meia maratona'],
  ['42k', 'Maratona'],
  ['ultra', 'Ultra'],
  ['trail', 'Trilha (trail)'],
  ['volta', 'Volta após lesão'],
  ['bloco', 'Blocos e transição'],
];
const CIC_NIV = { ini: 'Iniciante', int: 'Intermediário', ava: 'Avançado', pro: 'Profissional' };
const DIAS_SEM = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const CIC_FASE_COR = {
  Adaptação: '#9aa8c0',
  Base: '#3ddc97',
  Construção: '#46d6ff',
  Específica: '#ffcf5c',
  Polimento: '#ff9f43',
  Prova: '#ff6b6b',
  Recuperação: '#b794ff',
  Transição: '#9aa8c0',
  Teste: '#ff9f43',
};
const CIC_VDOT = { ini: 32, int: 41, ava: 50, pro: 62 }; // só para estimar os km dos treinos por tempo
const CICLOS_CORR = [
  // começar a correr
  {
    id: 'ini-zero',
    obj: 'ini',
    niv: 'ini',
    sem: 8,
    nome: 'Do zero aos 5 km',
    modo: 'corre',
    dias: 3,
    desc: 'Para quem nunca correu ou está parado há muito tempo. Começa alternando corrida leve e caminhada e chega a 5 km sem parar na semana 8.',
  },
  {
    id: 'ini-30',
    obj: 'ini',
    niv: 'ini',
    sem: 4,
    nome: 'Primeiros 30 minutos sem parar',
    modo: 'corre30',
    dias: 3,
    desc: 'Para quem já corre 10 a 15 min. Em 4 semanas chega a 30 min contínuos, em ritmo de conversa.',
  },
  {
    id: 'ini-base',
    obj: 'ini',
    niv: 'ini',
    sem: 6,
    nome: 'Base aeróbica iniciante',
    modo: 'base',
    dias: 3,
    km: [10, 18],
    lon: [4, 7],
    desc: 'Depois de correr 30 min sem parar: constrói volume leve, com subidas curtas e fartlek para técnica e força.',
  },
  // 5 km
  {
    id: '5k-ini',
    obj: '5k',
    niv: 'ini',
    sem: 6,
    nome: 'Melhorar os 5 km · iniciante',
    modo: 'prova',
    dias: 3,
    km: [12, 20],
    lon: [5, 8],
    desc: 'Para quem já corre 5 km e quer baixar o tempo. Uma sessão de qualidade por semana, o resto leve.',
  },
  {
    id: '5k-int4',
    obj: '5k',
    niv: 'int',
    sem: 4,
    nome: 'Bloco curto de 5 km',
    modo: 'prova',
    dias: 4,
    km: [28, 34],
    lon: [8, 10],
    desc: 'Microciclo de 4 semanas para quem já tem base e tem uma prova de 5 km em um mês.',
  },
  {
    id: '5k-int',
    obj: '5k',
    niv: 'int',
    sem: 8,
    nome: 'Melhorar os 5 km · intermediário',
    modo: 'prova',
    dias: 4,
    km: [25, 40],
    lon: [8, 12],
  },
  {
    id: '5k-ava',
    obj: '5k',
    niv: 'ava',
    sem: 8,
    nome: 'Melhorar os 5 km · avançado',
    modo: 'prova',
    dias: 6,
    km: [45, 65],
    lon: [12, 16],
  },
  {
    id: '5k-pro',
    obj: '5k',
    niv: 'pro',
    sem: 10,
    nome: '5 km · profissional (duplo limiar)',
    modo: 'prova',
    dias: 7,
    km: [115, 140],
    lon: [16, 20],
  },
  // 10 km
  {
    id: '10k-ini',
    obj: '10k',
    niv: 'ini',
    sem: 8,
    nome: 'Primeiros 10 km',
    modo: 'prova',
    dias: 3,
    km: [15, 28],
    lon: [6, 11],
    desc: 'Para quem corre 5 km com conforto e quer completar os 10 km.',
  },
  {
    id: '10k-int',
    obj: '10k',
    niv: 'int',
    sem: 10,
    nome: 'Melhorar os 10 km · intermediário',
    modo: 'prova',
    dias: 4,
    km: [30, 48],
    lon: [10, 16],
  },
  {
    id: '10k-ava',
    obj: '10k',
    niv: 'ava',
    sem: 10,
    nome: 'Melhorar os 10 km · avançado',
    modo: 'prova',
    dias: 6,
    km: [50, 75],
    lon: [14, 20],
  },
  {
    id: '10k-pro',
    obj: '10k',
    niv: 'pro',
    sem: 12,
    nome: '10 km · profissional (duplo limiar)',
    modo: 'prova',
    dias: 7,
    km: [120, 150],
    lon: [18, 24],
  },
  // meia
  {
    id: '21k-ini',
    obj: '21k',
    niv: 'ini',
    sem: 12,
    nome: 'Primeira meia maratona',
    modo: 'prova',
    dias: 3,
    km: [20, 38],
    lon: [8, 18],
    desc: 'Para quem corre 10 km e quer completar a primeira meia. Três treinos por semana, com o longão crescendo aos poucos.',
  },
  {
    id: '21k-int',
    obj: '21k',
    niv: 'int',
    sem: 12,
    nome: 'Melhorar a meia · intermediário',
    modo: 'prova',
    dias: 5,
    km: [35, 55],
    lon: [12, 21],
  },
  {
    id: '21k-ava',
    obj: '21k',
    niv: 'ava',
    sem: 12,
    nome: 'Melhorar a meia · avançado',
    modo: 'prova',
    dias: 6,
    km: [50, 80],
    lon: [16, 24],
  },
  {
    id: '21k-pro',
    obj: '21k',
    niv: 'pro',
    sem: 14,
    nome: 'Meia maratona · profissional (duplo limiar)',
    modo: 'prova',
    dias: 7,
    km: [125, 160],
    lon: [22, 28],
  },
  // maratona
  {
    id: '42k-int16',
    obj: '42k',
    niv: 'int',
    sem: 16,
    nome: 'Primeira maratona',
    modo: 'prova',
    dias: 5,
    km: [40, 70],
    lon: [16, 32],
    desc: 'Para quem já completou uma meia maratona. 16 semanas, longão até 32 km e treinos em ritmo de maratona na fase específica.',
  },
  {
    id: '42k-int12',
    obj: '42k',
    niv: 'int',
    sem: 12,
    nome: 'Maratona em 3 meses',
    modo: 'prova',
    dias: 5,
    km: [45, 70],
    lon: [20, 32],
    desc: 'Para quem já corre 40 km por semana com longão de 18 km ou mais.',
  },
  {
    id: '42k-ava',
    obj: '42k',
    niv: 'ava',
    sem: 16,
    nome: 'Melhorar a maratona · avançado',
    modo: 'prova',
    dias: 6,
    km: [60, 100],
    lon: [20, 34],
  },
  {
    id: '42k-pro',
    obj: '42k',
    niv: 'pro',
    sem: 18,
    nome: 'Maratona · profissional (duplo limiar)',
    modo: 'prova',
    dias: 7,
    km: [135, 180],
    lon: [26, 38],
  },
  // ultra
  {
    id: 'ul-int',
    obj: 'ultra',
    niv: 'int',
    sem: 16,
    nome: 'Ultra de 50 km',
    modo: 'prova',
    dias: 5,
    km: [45, 80],
    lon: [18, 35],
    prova: 50,
    desc: 'Para quem já correu uma maratona. Longões em sequência (sábado e domingo), subidas e tempo em pé. Se a prova for de trilha, faça os longões em terreno parecido.',
  },
  {
    id: 'ul-ava',
    obj: 'ultra',
    niv: 'ava',
    sem: 20,
    nome: 'Ultra de 80 a 100 km',
    modo: 'prova',
    dias: 6,
    km: [65, 115],
    lon: [22, 45],
    prova: 80,
    desc: 'Para quem já completou 50 km. Volume alto quase todo leve, longões em sequência e treino de subida.',
  },
  // blocos
  {
    id: 'bl-pre',
    obj: 'bloco',
    niv: 'int',
    sem: 8,
    nome: 'Pré-temporada Nexos · base aeróbica',
    modo: 'base',
    dias: 4,
    km: [25, 40],
    lon: [8, 14],
    teste: true,
    desc: 'Bloco de transição e base aeróbica: volume leve crescendo, sublimiar controlado, subidas e educativos. Começa e termina com o teste de 30 min (Check-up do Corredor).',
  },
  {
    id: 'bl-base-int',
    obj: 'bloco',
    niv: 'int',
    sem: 4,
    nome: 'Mesociclo de base · intermediário',
    modo: 'base',
    dias: 4,
    km: [28, 36],
    lon: [10, 13],
  },
  {
    id: 'bl-base-ava',
    obj: 'bloco',
    niv: 'ava',
    sem: 4,
    nome: 'Mesociclo de base · avançado',
    modo: 'base',
    dias: 6,
    km: [50, 62],
    lon: [14, 18],
  },
  {
    id: 'bl-lim-int',
    obj: 'bloco',
    niv: 'int',
    sem: 4,
    nome: 'Bloco de limiar norueguês · intermediário',
    modo: 'limiar',
    dias: 4,
    km: [30, 38],
    lon: [10, 13],
    desc: 'Sublimiar duas vezes por semana (Norwegian singles), tudo controlado. O resto leve.',
  },
  {
    id: 'bl-lim-ava',
    obj: 'bloco',
    niv: 'ava',
    sem: 4,
    nome: 'Bloco de limiar norueguês · avançado',
    modo: 'limiar',
    dias: 6,
    km: [55, 66],
    lon: [15, 18],
  },
  {
    id: 'bl-lim-pro',
    obj: 'bloco',
    niv: 'pro',
    sem: 4,
    nome: 'Bloco de duplo limiar · profissional',
    modo: 'limiar',
    dias: 7,
    km: [120, 140],
    lon: [20, 24],
  },
  {
    id: 'bl-vo2',
    obj: 'bloco',
    niv: 'ava',
    sem: 3,
    nome: 'Bloco de VO₂máx (3 semanas)',
    modo: 'vo2',
    dias: 5,
    km: [45, 50],
    lon: [13, 15],
    desc: 'Microciclo de choque para potência aeróbica: duas sessões em Z5 por semana (4 × 4 min NTNU e intervalados longos), o resto leve. Use depois de uma fase de base.',
  },
  {
    id: 'bl-pol',
    obj: 'bloco',
    niv: 'int',
    sem: 2,
    nome: 'Polimento de 2 semanas',
    modo: 'polimento',
    dias: 4,
    km: [30, 30],
    lon: [12, 12],
    prova: 21.1,
    desc: 'Duas semanas antes de uma prova de 10 a 21 km: volume cai 40–60%, a intensidade e a frequência continuam. Ajuste a distância da prova no último dia.',
  },
  {
    id: 'bl-pos',
    obj: 'bloco',
    niv: 'int',
    sem: 2,
    nome: 'Recuperação pós-prova',
    modo: 'pos',
    dias: 3,
    desc: 'Depois de meia, maratona ou ultra: corridas curtas e leves, sem qualidade, até as dores passarem.',
  },
  {
    id: 'bl-trans',
    obj: 'bloco',
    niv: 'int',
    sem: 2,
    nome: 'Transição entre temporadas',
    modo: 'trans',
    dias: 3,
    desc: 'Descanso ativo entre o fim de uma temporada e a pré-temporada. Pouco volume, sem compromisso de ritmo.',
  },
];
const CIC_REFS =
  'Haugen et al. 2022 (Sports Med Open); Oliveira et al. 2024 (Sports Med); Casado et al. 2022 (Int J Sports Physiol Perform); Mølmen et al. 2019 (Open Access J Sports Med); Wang et al. 2023 (PLoS One); Frandsen et al. 2025 (Br J Sports Med); Wen et al. 2019 (J Sci Med Sport); Seiler 2010 (Int J Sports Physiol Perform); Bosquet et al. 2007 (Med Sci Sports Exerc); Helgerud et al. 2007 (Med Sci Sports Exerc).';
const CIC_MACRO = [
  'Transição (2 semanas)',
  'Pré-temporada: base aeróbica (8 semanas)',
  'Bloco de limiar norueguês (4 semanas)',
  'Ciclo da prova-alvo (8 a 18 semanas)',
  'Recuperação pós-prova (2 semanas)',
];
// treino de um dia: { tipo, titulo, estrutura, obs }
const cT = (tipo, titulo, estrutura, obs) => ({ tipo, titulo, estrutura, obs: obs || '' });
const r05 = (x) => Math.max(1, Math.round(x * 2) / 2);
const lerp = (a, b, p) => a + (b - a) * Math.max(0, Math.min(1, p));
const nRep = (a, b, p) => Math.round(lerp(a, b, p));
const OBS = {
  sub: 'Sublimiar no estilo norueguês: controlado, esforço 6 de 10, ainda dá para falar frases curtas. Termine sentindo que dava para mais.',
  lim: 'Limiar controlado com pausa curta. Todas as repetições no mesmo ritmo; se a última sair mais lenta, o ritmo estava forte demais.',
  vo2: 'Forte (Z5), mas todas as repetições iguais. Recupere trotando.',
  leve: 'Ritmo de conversa (Z2). A maior parte do treino de quem corre é assim.',
  lon: 'Longão leve. Hidrate-se e, acima de 90 min, leve carboidrato.',
  pro: 'Dia de prova. Comece controlado e acelere na segunda metade.',
  sub2: 'Subida curta e forte, volta caminhando ou trotando. Força e técnica com pouco impacto.',
};
// sessões
const sRod = (km, str) =>
  cT(
    'rodagem',
    `Rodagem ${String(r05(km)).replace('.', ',')} km${str ? ' + 6 acelerações' : ''}`,
    [_C(r05(km), 'km', 'leve'), ...(str ? [serie(6, [_C(100, 'm', 'tiros'), _R(100, 'm', 'rec')])] : [])],
    str
      ? 'Rodagem leve e, no fim, 6 acelerações de 100 m (rápidas e soltas, sem forçar), voltando trotando.'
      : OBS.leve,
  );
const sReg = (min) =>
  cT(
    'regenerativo',
    `Regenerativo ${min} min`,
    [_C(min, 'min', 'rec')],
    'Trote muito leve (Z1). Recupera sem gerar cansaço.',
  );
const sLon = (km, fimKm, z = 'maratona') =>
  fimKm >= 1
    ? cT(
        'longao',
        `Longão ${String(r05(km)).replace('.', ',')} km com ${String(r05(fimKm)).replace('.', ',')} km em ritmo`,
        [_C(r05(km - fimKm), 'km', 'leve'), _C(r05(fimKm), 'km', z)],
        'Longão leve e o final no ritmo indicado. Treina terminar forte e o ritmo de prova.',
      )
    : cT('longao', `Longão ${String(r05(km)).replace('.', ',')} km`, [_C(r05(km), 'km', 'leve')], OBS.lon);
const sMil = (n, z = 'limiar') =>
  cT('ritmo', `Limiar ${n} × 1000 m`, [_A(2), serie(n, [_C(1000, 'm', z), _R(1, 'min')]), _D(1)], OBS.lim);
const sBlo = (n, min) =>
  cT(
    'ritmo',
    `Sublimiar ${n} × ${min} min`,
    [_A(2), serie(n, [_C(min, 'min', 'maratona'), _R(1, 'min')]), _D(1)],
    OBS.sub,
  );
const sKm = (n, km, z = 'maratona', pausa = 1) =>
  cT(
    'ritmo',
    `${z === 'maratona' ? 'Sublimiar' : 'Limiar'} ${n} × ${String(km).replace('.', ',')} km`,
    [_A(2), serie(n, [_C(km, 'km', z), _R(pausa, 'min')]), _D(1)],
    z === 'maratona' ? OBS.sub : OBS.lim,
  );
const sMin = (n, min, z = 'limiar') =>
  cT(
    'ritmo',
    `Limiar ${n} × ${min} min`,
    [_A(10, 'min'), serie(n, [_C(min, 'min', z), _R(min >= 4 ? 1.5 : 1, 'min')]), _D(5, 'min')],
    OBS.lim,
  );
const sFar = (n, ini) =>
  cT(
    'fartlek',
    `Fartlek ${n} × 1 min`,
    [
      _A(10, 'min'),
      serie(n, [_C(1, 'min', ini ? 'maratona' : 'limiar'), _R(ini ? 2 : 1, 'min', 'leve')]),
      _D(5, 'min'),
    ],
    'Corrida sem parar: 1 min um pouco mais forte e o resto leve.',
  );
const sSub = (n, m) =>
  cT(
    'tiros',
    `Subidas ${n} × ${m} m`,
    [_A(10, 'min'), serie(n, [_C(m, 'm', 'tiros'), _R(1.5, 'min')]), _D(5, 'min')],
    OBS.sub2,
  );
const sX = (n) =>
  cT(
    'intervalado',
    `Sessão X · ${n} × 200 m`,
    [_A(3), serie(n, [_C(200, 'm', 'intervalado'), _R(200, 'm', 'rec')]), _D(2)],
    'O “X” do modelo norueguês: uma vez por semana, acima do limiar, com recuperação trotando. Rápido, mas solto.',
  );
const sVo = (n, m, pausa = 2) =>
  cT(
    'intervalado',
    `${n} × ${m >= 1000 ? String(m / 1000).replace('.', ',') + ' km' : m + ' m'}`,
    [_A(3), serie(n, [_C(m, 'm', 'intervalado'), _R(pausa, 'min')]), _D(2)],
    OBS.vo2,
  );
const s4x4 = (n = 4) =>
  cT(
    'intervalado',
    `${n} × 4 min (NTNU)`,
    [_A(10, 'min'), serie(n, [_C(4, 'min', 'intervalado'), _R(3, 'min', 'leve')]), _D(5, 'min')],
    'Protocolo da NTNU (Helgerud et al. 2007): 4 min forte (90–95% da FC máx) e 3 min de trote.',
  );
const sSubLonga = (n) =>
  cT(
    'intervalado',
    `Subidas longas ${n} × 3 min`,
    [_A(15, 'min'), serie(n, [_C(3, 'min', 'limiar'), _R(3, 'min', 'rec')]), _D(10, 'min')],
    'Subida contínua e firme (limiar), descida trotando devagar. Força específica para provas longas e de trilha.',
  );
const sProva = (km, z) => cT('prova', `Prova ${String(km).replace('.', ',')} km`, [_C(km, 'km', z)], OBS.pro);
const sTeste30 = () =>
  cT(
    'teste',
    'Teste de 30 min (Check-up)',
    [_A(15, 'min'), _C(30, 'min', 'limiar'), _D(10, 'min')],
    'Corra 30 min sozinho no máximo sustentável. Aos 10 min aperte a volta: a FC média dos últimos 20 min é a FC de limiar. Lance o resultado no Check-up do Corredor.',
  );
const sCC = (n, corre, caminha) =>
  cT(
    'rodagem',
    `Corre e caminha ${n} × ${String(corre).replace('.', ',')} min`,
    [_A(5, 'min'), serie(n, [_C(corre, 'min', 'leve'), _R(caminha, 'min')]), _D(5, 'min')],
    'Corra leve (ritmo de conversa) e caminhe na recuperação. Se cansar demais, repita a semana.',
  );
const sCont = (min) => cT('rodagem', `Contínuo ${min} min leve`, [_C(min, 'min', 'leve')], OBS.leve);
// perfil "médio" de cada nível, só para estimar os km dos treinos marcados por tempo
const perfilNiv = (niv) =>
  perfilCorrida({ corrida: { teste_km: 5, teste_seg: Math.round(tempoPorVdot(CIC_VDOT[niv], 5000)) } });
const kmDe = (t, perfil) => resumoEstrutura(t.estrutura, perfil).km;

// fases de cada semana (planejamento)
function cicFases(c) {
  const n = c.sem,
    W = [];
  if (c.modo === 'corre' || c.modo === 'corre30') {
    for (let i = 0; i < n; i++) W.push({ fase: i < n - 1 ? 'Adaptação' : 'Teste' });
    return W;
  }
  if (c.modo === 'pos') return [{ fase: 'Recuperação' }, { fase: 'Recuperação' }];
  if (c.modo === 'trans') return [{ fase: 'Transição' }, { fase: 'Transição' }];
  if (c.modo === 'polimento') return [{ fase: 'Polimento' }, { fase: 'Prova' }];
  if (c.modo !== 'prova') {
    for (let i = 0; i < n; i++)
      W.push({
        fase: c.modo === 'base' ? 'Base' : c.modo === 'vo2' ? 'Específica' : 'Construção',
        rec: n >= 4 && i % 4 === 3,
      });
    return W;
  }
  const T = c.obj === '42k' ? (n >= 16 ? 3 : 2) : c.obj === '21k' || c.obj === 'ultra' ? 2 : 1;
  const R = n - T,
    b = Math.max(1, Math.round(R * 0.4)),
    co = Math.max(1, Math.round(R * 0.35)),
    e = Math.max(1, R - b - co);
  for (let i = 0; i < n; i++) {
    const fase =
      i < b ? 'Base' : i < b + co ? 'Construção' : i < b + co + e ? 'Específica' : i === n - 1 ? 'Prova' : 'Polimento';
    W.push({ fase, rec: i < R && i % 4 === 3 && i < R - 1 });
  }
  return W;
}
// monta as semanas com os treinos de cada dia
function gerarCiclo(c) {
  const W = cicFases(c),
    perfil = perfilNiv(c.niv),
    n = W.length;
  if (c.modo === 'corre') {
    const P = [
      [8, 1, 1.5],
      [6, 2, 1.5],
      [5, 3, 1.5],
      [4, 5, 1.5],
      [3, 8, 1.5],
      [2, 12, 1.5],
    ];
    return W.map((w, i) => ({
      ...w,
      sess:
        i < 6
          ? [
              [1, sCC(...P[i])],
              [3, sCC(...P[i])],
              [5, sCC(...P[i])],
            ]
          : i === 6
            ? [
                [1, sCont(25)],
                [3, sCont(20)],
                [5, sCont(30)],
              ]
            : [
                [1, sCont(25)],
                [3, sCont(20)],
                [
                  5,
                  cT(
                    'teste',
                    'Teste de 5 km',
                    [_A(5, 'min'), _C(5, 'km', 'maratona'), _D(5, 'min')],
                    'Seus primeiros 5 km sem parar. Ritmo confortável; o objetivo é completar.',
                  ),
                ],
              ],
    }));
  }
  if (c.modo === 'corre30') {
    const P = [
      [
        [1, sCC(3, 8, 1.5)],
        [3, sCC(3, 10, 1.5)],
        [5, sCC(2, 12, 1.5)],
      ],
      [
        [1, sCC(2, 15, 1)],
        [3, sCont(18)],
        [5, sCont(20)],
      ],
      [
        [1, sCont(20)],
        [3, sCont(22)],
        [5, sCont(25)],
      ],
      [
        [1, sCont(25)],
        [3, sCont(20)],
        [5, sCont(30)],
      ],
    ];
    return W.map((w, i) => ({ ...w, sess: P[i] }));
  }
  if (c.modo === 'pos')
    return [
      {
        ...W[0],
        sess: [
          [2, sReg(20)],
          [4, sReg(25)],
          [6, sReg(30)],
        ],
      },
      {
        ...W[1],
        sess: [
          [1, sRod(5)],
          [3, sRod(6, true)],
          [5, sRod(7)],
        ],
      },
    ];
  if (c.modo === 'trans')
    return [
      {
        ...W[0],
        sess: [
          [1, sCont(30)],
          [3, sCont(30)],
          [5, sCont(40)],
        ],
      },
      {
        ...W[1],
        sess: [
          [1, sCont(35)],
          [3, sRod(6, true)],
          [5, sCont(45)],
        ],
      },
    ];
  // dias da semana por nível
  const SLOT =
    c.niv === 'ini'
      ? [
          [1, 'q1'],
          [3, 'e'],
          [5, 'l'],
        ]
      : c.niv === 'int'
        ? c.dias >= 5
          ? [
              [1, 'q1'],
              [2, 'e'],
              [3, 'q2'],
              [4, 'r'],
              [5, 'l'],
            ]
          : [
              [1, 'q1'],
              [2, 'e'],
              [3, 'q2'],
              [5, 'l'],
            ]
        : c.niv === 'ava'
          ? c.dias >= 6
            ? [
                [1, 'q1'],
                [2, 'e'],
                [3, 'q2'],
                [4, 'e'],
                [5, 'x'],
                [6, 'l'],
              ]
            : [
                [1, 'q1'],
                [2, 'e'],
                [3, 'q2'],
                [5, 'x'],
                [6, 'l'],
              ]
          : [
              [0, 'e2'],
              [1, 'dt'],
              [2, 'e2'],
              [3, 'dt'],
              [4, 'e2'],
              [5, 'x'],
              [6, 'l'],
            ];
  const minE = { ini: 3, int: 5, ava: 7, pro: 8 }[c.niv];
  const [k0, k1] = c.km,
    [l0, l1] = c.lon;
  const nTr = W.filter((w) => !['Polimento', 'Prova'].includes(w.fase)).length;
  // progresso dentro de cada fase (0 a 1)
  const idxFase = {},
    totFase = {};
  W.forEach((w) => {
    totFase[w.fase] = (totFase[w.fase] || 0) + 1;
  });
  const ultra = c.obj === 'ultra',
    dProva = c.prova || { '5k': 5, '10k': 10, '21k': 21.1, '42k': 42.2 }[c.obj],
    zProva = { '5k': 'intervalado', '10k': 'limiar', '21k': 'limiar', '42k': 'maratona' }[c.obj] || 'leve';
  return W.map((w, i) => {
    idxFase[w.fase] = (idxFase[w.fase] || 0) + 1;
    const p = totFase[w.fase] > 1 ? (idxFase[w.fase] - 1) / (totFase[w.fase] - 1) : 1;
    const pt = nTr > 1 ? Math.min(1, i / (nTr - 1)) : 1; // progresso no ciclo todo
    const pol = w.fase === 'Polimento',
      prova = w.fase === 'Prova';
    let alvo = lerp(k0, k1, pt) * (w.rec ? 0.72 : 1);
    if (pol) alvo = k1 * (W.filter((x) => x.fase === 'Polimento').length > 1 && idxFase.Polimento === 1 ? 0.75 : 0.6);
    if (prova) alvo = k1 * 0.45;
    let lon = lerp(l0, l1, pt) * (w.rec ? 0.75 : 1);
    if (pol) lon = l1 * 0.6;
    if (prova) lon = 0;
    const F = w.fase,
      N = c.niv,
      sess = [];
    const q = (slot) => {
      // treino de qualidade conforme fase, nível e objetivo
      const red = w.rec ? 0.65 : 1,
        R = (a, b) => Math.max(2, Math.round(nRep(a, b, p) * red));
      if (prova)
        return slot === 'q1'
          ? N === 'ini'
            ? sFar(4, true)
            : sKm(3, 1, zProva === 'maratona' ? 'maratona' : 'limiar')
          : sRod(N === 'ini' ? 4 : 6, true);
      if (pol)
        return slot === 'q1'
          ? c.obj === '5k'
            ? sVo(R(4, 4), 1000)
            : c.obj === '42k'
              ? sKm(2, 5, 'maratona', 2)
              : sMil(R(5, 5))
          : slot === 'q2'
            ? sBlo(3, 6)
            : sRod(minE + 1, true);
      if (N === 'ini') {
        if (slot !== 'q1') return null;
        if (F === 'Base') return i % 2 ? sSub(R(6, 8), 60) : sFar(R(6, 8), true);
        if (F === 'Construção') return sMin(R(4, 5), R(3, 4));
        return c.obj === '5k'
          ? sVo(R(5, 6), 400, 1.5)
          : c.obj === '10k'
            ? sMin(R(4, 5), 5)
            : sKm(R(2, 3), 2, 'maratona', 1.5);
      }
      if (slot === 'q1') {
        if (F === 'Base') return N === 'int' ? sMin(R(6, 8), 3) : sMil(R(6, 8));
        if (F === 'Construção') return sMil(N === 'int' ? R(6, 10) : R(8, 12));
        // específica
        if (c.modo === 'vo2') return p < 0.5 ? sVo(R(5, 6), 1000) : sVo(R(4, 5), 1200, 2.5);
        if (c.obj === '5k') return p < 0.5 ? sVo(R(5, 6), 1000) : sVo(R(10, 12), 400, 1);
        if (c.obj === '10k') return p < 0.5 ? sVo(R(4, 5), 1600) : sKm(R(3, 4), 2, 'limiar', 2);
        if (c.obj === '21k') return p < 0.5 ? sKm(R(3, 4), 3, 'limiar', 2) : sKm(2, 5, 'limiar', 3);
        if (c.obj === '42k') return sKm(R(2, 3), 5, 'maratona', 2);
        if (ultra) return sSubLonga(R(6, 8));
        return sMil(R(8, 10));
      }
      if (slot === 'q2') {
        if (F === 'Base') return N === 'int' ? sFar(R(8, 10)) : sBlo(R(4, 5), 6);
        if (F === 'Construção') return N === 'int' ? sBlo(R(4, 5), R(6, 8)) : sKm(R(4, 5), 2, 'maratona');
        if (c.modo === 'vo2') return s4x4(R(4, 5));
        if (ultra) return sBlo(R(3, 4), 10);
        return N === 'int' ? sBlo(R(4, 5), 8) : sKm(R(3, 4), 3, 'maratona');
      }
      if (slot === 'x') {
        if (w.rec) return sRod(minE, true);
        if (F === 'Base') return sSub(R(8, 10), 100);
        if (ultra && (F === 'Específica' || (F === 'Construção' && p > 0.5))) return null; // no ultra, sábado vira longão em sequência
        if (F === 'Específica' && (c.obj === '42k' || c.obj === '21k')) return sFar(R(10, 12));
        return sX(R(16, 22));
      }
      return null;
    };
    for (const [d, s] of SLOT) {
      if (s === 'l') continue;
      if (s === 'dt') {
        // duplo limiar: manhã mais longa e controlada, tarde mais curta e um pouco mais rápida
        if (w.rec || pol || prova) {
          sess.push([
            d,
            s === 'dt' && d === 1
              ? prova
                ? sKm(3, 1, zProva === 'maratona' ? 'maratona' : 'limiar')
                : sMil(pol ? 6 : 8)
              : sRod(minE + 2, true),
          ]);
          continue;
        }
        const pp = lerp(0, 1, pt),
          mn = nRep(5, 6, pp);
        sess.push([
          d,
          cT(
            'ritmo',
            `Duplo limiar · manhã ${mn} × 2 km`,
            [_A(3), serie(mn, [_C(2, 'km', 'limiar'), _R(1, 'min')]), _D(2)],
            'Manhã do duplo limiar (lactato ~2–2,5 mmol): controlado, longe do limite.',
          ),
        ]);
        sess.push([
          d,
          d === 1
            ? cT(
                'ritmo',
                `Duplo limiar · tarde ${nRep(8, 12, pp)} × 1000 m`,
                [_A(3), serie(nRep(8, 12, pp), [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)],
                'Tarde do duplo limiar (lactato ~3–3,5 mmol): um pouco mais rápido que de manhã, todas iguais.',
              )
            : cT(
                'ritmo',
                `Duplo limiar · tarde ${nRep(20, 25, pp)} × 400 m`,
                [_A(3), serie(nRep(20, 25, pp), [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)],
                'Tarde do duplo limiar: 400 m no limiar com 30 s de pausa.',
              ),
        ]);
        continue;
      }
      if (s === 'q1' || s === 'q2' || s === 'x') {
        const t = q(s);
        if (t) sess.push([d, t]);
        continue;
      }
      if (s === 'r') {
        sess.push([d, sReg(N === 'int' ? 30 : 35)]);
        continue;
      }
      sess.push([d, s === 'e2' ? 'E2' : 'E']); // rodagens: completadas depois para fechar o volume da semana
    }
    // longão (ou prova no domingo da última semana)
    const dL = SLOT.find((x) => x[1] === 'l')[0];
    if (prova && dProva) {
      const dPr = 6;
      if (dL !== dPr) sess.push([dL, sRod(N === 'ini' ? 3 : 4, true)]);
      sess.push([dPr, sProva(dProva, zProva)]);
    } else if (ultra && (F === 'Específica' || (F === 'Construção' && p > 0.5)) && !w.rec) {
      sess.push([5, sLon(lon * 0.62, 0)]);
      sess.push([6, sLon(lon * 0.45, 0)]);
    } else if (c.teste && (i === 0 || i === n - 1)) {
      sess.push([dL, sTeste30()]);
    } else {
      const fim =
        F === 'Específica' && (c.obj === '21k' || c.obj === '42k') && !w.rec
          ? lon * (c.obj === '42k' ? (N === 'int' ? lerp(0.1, 0.25, p) : lerp(0.2, 0.35, p)) : lerp(0.15, 0.25, p))
          : 0;
      sess.push([dL, sLon(lon, fim)]);
    }
    // rodagens fecham o volume da semana
    const fixos = sess.filter((x) => typeof x[1] === 'object');
    const usado = fixos.reduce((a, x) => a + kmDe(x[1], perfil), 0);
    const nE = sess.filter((x) => x[1] === 'E').length + sess.filter((x) => x[1] === 'E2').length * 2;
    const eKm = nE ? Math.max(minE, (alvo - usado) / nE) : 0;
    const out = [];
    sess.forEach(([d, t]) => {
      if (t === 'E') out.push([d, sRod(eKm, F === 'Base' || F === 'Construção' ? d === 4 || d === 2 : false)]);
      else if (t === 'E2') {
        out.push([
          d,
          { ...sRod(eKm * 1.15), titulo: `Manhã · Rodagem ${String(r05(eKm * 1.15)).replace('.', ',')} km` },
        ]);
        out.push([
          d,
          { ...sRod(eKm * 0.85), titulo: `Tarde · Rodagem ${String(r05(eKm * 0.85)).replace('.', ',')} km` },
        ]);
      } else out.push([d, t]);
    });
    out.sort((a, b) => a[0] - b[0]);
    const km = out.reduce((a, x) => a + kmDe(x[1], perfil), 0);
    return { ...w, sess: out, km };
  });
}
/* ---------- Modelos de treino de corrida: periodização (como as fases se encadeiam) e distribuição de intensidade
   (como a semana se divide entre leve e forte), cada um em 4 níveis ---------- */
const MOD_CORR = [
  ['trad', 'Tradicional (linear)'],
  ['rev', 'Reversa'],
  ['blocos', 'Em blocos'],
  ['multi', 'Multi-ritmo (Canova)'],
  ['polar', 'Polarizada'],
  ['pira', 'Piramidal'],
  ['limiar', 'Limiar (norueguesa)'],
];
const MOD_INFO = {
  trad: {
    tipo: 'Periodização',
    oque: 'Do geral para o específico: base aeróbica com muito volume leve, depois limiar e subidas, depois a intensidade da prova (VO₂ e ritmo) e, no fim, o teste ou a prova. É a escola de Arthur Lydiard e a mais usada no mundo.',
    quando:
      'Serve para quase todo mundo e é a mais fácil de acompanhar. Boa escolha para o primeiro ciclo de qualquer aluno.',
    ci: 'Os programas que melhor funcionam combinam muito volume leve com uma progressão do geral para o específico (Kenneally et al. 2018; Haugen et al. 2022).',
  },
  rev: {
    tipo: 'Periodização',
    oque: 'O contrário da tradicional: começa pela velocidade e pelo VO₂ (tiros curtos e subidas), passa pelo limiar e termina com volume e treinos longos no ritmo da prova.',
    quando:
      'Provas longas (meia e maratona), alunos que já têm base e respondem bem à intensidade, e temporadas em que o período de calor ou de provas curtas vem antes.',
    ci: 'Muito usada por treinadores de maratona, mas com pouca pesquisa comparando com a tradicional. Base principalmente prática.',
  },
  blocos: {
    tipo: 'Periodização',
    oque: 'Um foco de cada vez, em blocos de 3 a 4 semanas: bloco de limiar, bloco de VO₂ e bloco específico, com semana leve entre eles. Concentrar o estímulo faz o corpo responder mais rápido.',
    quando:
      'Alunos intermediários e avançados que estagnaram com o treino misturado, ou quando há pouco tempo até a prova.',
    ci: 'Na meta-análise de Mølmen et al. 2019 (Open Access J Sports Med), blocos tiveram vantagem pequena sobre o treino tradicional no VO₂máx, com estudos ainda pequenos. Base teórica: Issurin 2010 (Sports Med); em atletas treinados, blocos de alta intensidade deram mais VO₂máx que o mesmo volume distribuído (Rønnestad et al. 2014).',
  },
  multi: {
    tipo: 'Periodização',
    oque: 'Vários ritmos treinados juntos, que vão se aproximando do ritmo da prova: fase introdutória, fundamental (ritmos mais lentos e mais rápidos que o da prova), especial (alternados em volta do ritmo da prova) e específica (no ritmo da prova). É a escola de Renato Canova e de muitos treinadores ingleses e quenianos.',
    quando: 'Alunos avançados e profissionais com prova-alvo definida, principalmente de 10 km a maratona.',
    ci: 'Modelo de treinadores de elite (Canova), descrito nas revisões sobre o treino dos melhores do mundo (Haugen et al. 2022), mas com pouca pesquisa controlada.',
  },
  polar: {
    tipo: 'Distribuição de intensidade',
    oque: 'Cerca de 80% do treino bem leve (Z1–Z2) e 15–20% bem forte (Z5), quase nada no meio. As sessões fortes são de VO₂máx; o resto é rodagem leve.',
    quando:
      'Alunos com pouco tempo, que tendem a correr tudo no mesmo ritmo médio, e para quebrar estagnação. Funciona bem com 4 a 6 treinos por semana.',
    ci: 'Na meta-análise mais recente (Oliveira et al. 2024, Sports Med), o polarizado deu um pouco mais de VO₂máx que as outras distribuições, principalmente em atletas bem treinados e em intervenções de até 12 semanas; no desempenho em prova, os resultados foram parecidos. Também: Rosenblat et al. 2019 (J Strength Cond Res); Stöggl & Sperlich 2014 (Front Physiol).',
  },
  pira: {
    tipo: 'Distribuição de intensidade',
    oque: 'A maior parte leve, uma fatia menor de limiar (Z3–Z4) e uma fatia ainda menor de VO₂ (Z5), como uma pirâmide. Uma sessão de limiar e uma de VO₂ por semana.',
    quando: 'O equilíbrio mais seguro para a maioria dos corredores, de 5 km à maratona.',
    ci: 'É a distribuição mais encontrada em corredores de elite ao longo da temporada (Casado et al. 2022, Int J Sports Physiol Perform; Kenneally et al. 2018).',
  },
  limiar: {
    tipo: 'Distribuição de intensidade',
    oque: 'Modelo norueguês: muito volume leve e duas sessões de limiar controlado por semana, com pausas curtas (lactato ~2–3,5 mmol, esforço 5–6 de 10). Profissionais fazem duplo limiar (manhã e tarde) nas terças e quintas, mais a sessão X no sábado.',
    quando: 'Alunos de 5 km à maratona que aguentam bem volume. O segredo é controlar o ritmo: limiar não é prova.',
    ci: 'Casado et al. 2023 (Int J Environ Res Public Health); Haugen et al. 2022 (Sports Med Open); Casado et al. 2021 (J Strength Cond Res).',
  },
};
const CIC_FASE_COR2 = {
  Velocidade: '#e5484d',
  'Bloco de limiar': '#46d6ff',
  'Bloco de VO₂': '#ff9f43',
  'Bloco específico': '#ffcf5c',
  Introdutório: '#3ddc97',
  Fundamental: '#46d6ff',
  Especial: '#b794ff',
};
Object.assign(CIC_FASE_COR, CIC_FASE_COR2);
const MOD_FASES = {
  trad: [
    ['Base', 0.35],
    ['Construção', 0.35],
    ['Específica', 0.3],
  ],
  rev: [
    ['Velocidade', 0.3],
    ['Construção', 0.35],
    ['Específica', 0.35],
  ],
  blocos: [
    ['Bloco de limiar', 0.34],
    ['Bloco de VO₂', 0.33],
    ['Bloco específico', 0.33],
  ],
  multi: [
    ['Introdutório', 0.25],
    ['Fundamental', 0.3],
    ['Especial', 0.25],
    ['Específica', 0.2],
  ],
  polar: [
    ['Base', 0.3],
    ['Construção', 0.4],
    ['Específica', 0.3],
  ],
  pira: [
    ['Base', 0.3],
    ['Construção', 0.4],
    ['Específica', 0.3],
  ],
  limiar: [
    ['Base', 0.3],
    ['Construção', 0.4],
    ['Específica', 0.3],
  ],
};
const MOD_NIV = {
  ini: { sem: 8, dias: 3, km: [12, 22], lon: [5, 10] },
  int: { sem: 10, dias: 4, km: [30, 46], lon: [10, 15] },
  ava: { sem: 12, dias: 6, km: [50, 75], lon: [14, 20] },
  pro: { sem: 12, dias: 7, km: [115, 150], lon: [20, 26] },
};
MOD_CORR.forEach(([m, nome]) =>
  ['ini', 'int', 'ava', 'pro'].forEach((niv) =>
    CICLOS_CORR.push({
      id: `m-${m}-${niv}`,
      obj: 'modelos',
      mod: m,
      niv,
      nome: `${nome} · ${CIC_NIV[niv].toLowerCase()}`,
      modo: 'modelo',
      ...MOD_NIV[niv],
    }),
  ),
);
// sessões extras dos modelos
const sVoMin = (n, min, rec = 2) =>
  cT(
    'intervalado',
    `${n} × ${String(min).replace('.', ',')} min forte`,
    [_A(10, 'min'), serie(n, [_C(min, 'min', 'intervalado'), _R(rec, 'min', 'rec')]), _D(5, 'min')],
    OBS.vo2,
  );
const sMulti = (n) =>
  cT(
    'ritmo',
    `Multi-ritmo ${n} × (2 km Z3 + 1 km Z4)`,
    [_A(2), serie(n, [_C(2, 'km', 'maratona'), _C(1, 'km', 'limiar'), _R(2, 'min')]), _D(1)],
    'Dois ritmos no mesmo bloco: 2 km moderado (ritmo de maratona) emendando 1 km no limiar. Treina o corpo a trocar de ritmo sem quebrar.',
  );
const sAlt = (n) =>
  cT(
    'ritmo',
    `Alternado ${n} × (1 km Z4 + 1 km Z3)`,
    [_A(2), serie(n, [_C(1, 'km', 'limiar'), _C(1, 'km', 'maratona')]), _D(1)],
    'Contínuo, sem parar: 1 km no limiar e 1 km um pouco mais leve (ritmo de maratona), alternando. Bem perto do ritmo da prova.',
  );
const sFlut = (n) =>
  cT(
    'intervalado',
    `${n} × 1 km forte com 1 km flutuante`,
    [_A(3), serie(n, [_C(1000, 'm', 'intervalado'), _C(1000, 'm', 'maratona')]), _D(2)],
    '1 km forte (Z5) e 1 km de recuperação ainda correndo em ritmo moderado (Z3), sem parar. Específico para 10 km e meia.',
  );
const sTesteK = (km) =>
  cT(
    'teste',
    `Teste de ${km} km`,
    [_A(2), _C(km, 'km', 'intervalado'), _D(1)],
    `Correr ${km} km no máximo, em percurso plano. O tempo atualiza o VDOT e os ritmos de cada zona do aluno.`,
  );
function qModelo(mod, F, slot, N, p, R, rec) {
  const ini = N === 'ini';
  if (rec)
    return mod === 'polar'
      ? slot === 'q1'
        ? sVoMin(R(4, 4), 2)
        : null
      : slot === 'q1'
        ? ini
          ? sFar(4, true)
          : sMil(R(5, 5))
        : slot === 'q2'
          ? sFar(R(6, 6))
          : null;
  if (mod === 'polar') {
    if (slot === 'q1')
      return F === 'Base'
        ? ini
          ? sSub(R(6, 8), 60)
          : sSub(R(8, 10), 100)
        : F === 'Construção'
          ? ini
            ? sVoMin(R(4, 6), 2)
            : s4x4(R(4, 5))
          : ini
            ? sVoMin(R(5, 6), 2)
            : sVo(R(5, 6), 1000);
    if (slot === 'q2')
      return F === 'Base' ? sVoMin(R(6, 8), 2) : F === 'Construção' ? sVo(R(5, 6), 1000) : sVoMin(4, R(6, 8), 2);
    if (slot === 'x') return sSub(R(8, 10), 100);
  }
  if (mod === 'pira') {
    if (slot === 'q1')
      return ini
        ? sMin(R(3, 5), R(3, 4))
        : F === 'Base'
          ? sMin(R(5, 6), 4)
          : F === 'Construção'
            ? sMil(R(6, 10))
            : sKm(R(3, 4), 2, 'limiar', 2);
    if (slot === 'q2') return F === 'Base' ? sFar(R(8, 10)) : F === 'Construção' ? s4x4(4) : sVo(R(5, 6), 1000);
    if (slot === 'x') return F === 'Base' ? sSub(R(8, 10), 100) : sX(R(14, 18));
  }
  if (mod === 'limiar') {
    if (slot === 'q1')
      return ini ? sMin(R(4, 6), 3) : F === 'Base' ? sMin(R(6, 8), 3) : sMil(N === 'int' ? R(6, 10) : R(8, 12));
    if (slot === 'q2')
      return F === 'Base'
        ? sBlo(R(4, 5), 6)
        : F === 'Construção'
          ? sBlo(R(4, 5), R(6, 8))
          : sKm(R(4, 5), 2, 'maratona');
    if (slot === 'x') return sX(R(16, 22));
  }
  if (mod === 'trad') {
    if (slot === 'q1')
      return F === 'Base'
        ? sFar(R(6, 10), ini)
        : F === 'Construção'
          ? ini
            ? sMin(R(4, 5), 3)
            : sMil(R(6, 10))
          : ini
            ? sVo(R(5, 6), 400, 1.5)
            : sVo(R(5, 6), 1000);
    if (slot === 'q2')
      return F === 'Base'
        ? sSub(R(6, 10), 100)
        : F === 'Construção'
          ? sBlo(R(4, 5), R(6, 8))
          : sKm(R(3, 4), 2, 'limiar', 2);
    if (slot === 'x') return F === 'Base' ? sRod(7, true) : F === 'Construção' ? sSub(R(8, 10), 200) : sX(R(16, 20));
  }
  if (mod === 'rev') {
    if (slot === 'q1')
      return F === 'Velocidade'
        ? ini
          ? sVo(R(6, 8), 200, 1.5)
          : sVo(R(8, 12), 400, 1)
        : F === 'Construção'
          ? ini
            ? sMin(R(4, 5), 3)
            : sMil(R(6, 10))
          : ini
            ? sBlo(R(2, 3), 8)
            : sKm(R(2, 3), 3, 'maratona', 2);
    if (slot === 'q2')
      return F === 'Velocidade' ? sSub(R(8, 10), 100) : F === 'Construção' ? sBlo(R(4, 5), R(6, 8)) : sBlo(R(3, 4), 10);
    if (slot === 'x') return F === 'Velocidade' ? sX(R(16, 20)) : F === 'Construção' ? sFar(R(10, 12)) : sRod(8, true);
  }
  if (mod === 'blocos') {
    if (slot === 'q1')
      return F === 'Bloco de limiar'
        ? ini
          ? sMin(R(4, 5), 3)
          : sMil(R(6, 10))
        : F === 'Bloco de VO₂'
          ? ini
            ? sVoMin(R(4, 6), 2)
            : sVo(R(5, 6), 1000)
          : ini
            ? sMin(5, 4)
            : sKm(R(3, 4), 2, 'limiar', 2);
    if (slot === 'q2')
      return F === 'Bloco de limiar' ? sBlo(R(4, 5), R(6, 8)) : F === 'Bloco de VO₂' ? s4x4(R(4, 5)) : sFar(R(10, 12));
    if (slot === 'x')
      return F === 'Bloco de VO₂' ? sX(R(16, 20)) : F === 'Bloco de limiar' ? sMil(R(6, 8)) : sSub(R(8, 10), 200);
  }
  if (mod === 'multi') {
    if (slot === 'q1')
      return F === 'Introdutório'
        ? sFar(R(8, 10), ini)
        : F === 'Fundamental'
          ? ini
            ? sMin(R(4, 5), 3)
            : sMulti(R(2, 4))
          : F === 'Especial'
            ? ini
              ? sFar(10)
              : sAlt(R(4, 6))
            : ini
              ? sMin(5, 4)
              : sKm(R(3, 4), 2, 'limiar', 1.5);
    if (slot === 'q2')
      return F === 'Introdutório'
        ? sSub(R(6, 10), 100)
        : F === 'Fundamental'
          ? sBlo(R(3, 4), 10)
          : F === 'Especial'
            ? sVo(R(5, 6), 1000)
            : sFlut(R(5, 6));
    if (slot === 'x')
      return F === 'Introdutório' ? sRod(8, true) : F === 'Fundamental' ? sSub(R(8, 10), 200) : sX(R(16, 20));
  }
  return null;
}
function gerarModelo(c) {
  const perfil = perfilNiv(c.niv),
    n = c.sem,
    R0 = n - 1,
    fr = MOD_FASES[c.mod];
  const W = [];
  let acc = 0;
  fr.forEach(([f, x], j) => {
    const q = j === fr.length - 1 ? R0 - acc : Math.max(1, Math.round(R0 * x));
    for (let i = 0; i < q; i++) W.push({ fase: f });
    acc += q;
  });
  W.forEach((w, i) => {
    w.rec = i % 4 === 3 && i < R0 - 1;
  });
  W.push({ fase: 'Teste' });
  const N = c.niv,
    pro = N === 'pro';
  const SLOT =
    N === 'ini'
      ? [
          [1, 'q1'],
          [3, 'e'],
          [5, 'l'],
        ]
      : N === 'int'
        ? [
            [1, 'q1'],
            [2, 'e'],
            [3, 'q2'],
            [5, 'l'],
          ]
        : N === 'ava'
          ? [
              [1, 'q1'],
              [2, 'e'],
              [3, 'q2'],
              [4, 'e'],
              [5, 'x'],
              [6, 'l'],
            ]
          : c.mod === 'limiar'
            ? [
                [0, 'e2'],
                [1, 'dt'],
                [2, 'e2'],
                [3, 'dt'],
                [4, 'e2'],
                [5, 'x'],
                [6, 'l'],
              ]
            : [
                [0, 'e2'],
                [1, 'q1'],
                [2, 'e2'],
                [3, 'q2'],
                [4, 'e2'],
                [5, 'x'],
                [6, 'l'],
              ];
  const minE = { ini: 3, int: 5, ava: 7, pro: 8 }[N],
    [k0, k1] = c.km,
    [l0, l1] = c.lon;
  const tot = {},
    idx = {};
  W.forEach((w) => {
    tot[w.fase] = (tot[w.fase] || 0) + 1;
  });
  return W.map((w, i) => {
    idx[w.fase] = (idx[w.fase] || 0) + 1;
    const p = tot[w.fase] > 1 ? (idx[w.fase] - 1) / (tot[w.fase] - 1) : 1,
      pt = Math.min(1, i / Math.max(1, R0 - 1));
    const teste = w.fase === 'Teste',
      red = w.rec ? 0.65 : 1,
      R = (a, b) => Math.max(2, Math.round(nRep(a, b, p) * (pro ? 1.15 : 1) * red));
    const alvo = teste ? k1 * 0.6 : lerp(k0, k1, pt) * (w.rec ? 0.72 : 1),
      lon = lerp(l0, l1, pt) * (w.rec ? 0.75 : 1);
    const sess = [];
    for (const [d, s] of SLOT) {
      if (s === 'l') continue;
      if (teste) {
        if (s === 'q1' || s === 'dt') sess.push([d, N === 'ini' ? sFar(4, true) : sMil(4)]);
        else if (s === 'x') sess.push([d, sRod(minE, true)]);
        else sess.push([d, s === 'e2' ? 'E2' : s === 'q2' ? 'E' : 'E']);
        continue;
      }
      if (s === 'dt') {
        if (w.rec) {
          sess.push([d, d === 1 ? sMil(8) : sRod(minE + 2, true)]);
          continue;
        }
        const mn = nRep(5, 6, pt);
        sess.push([
          d,
          cT(
            'ritmo',
            `Duplo limiar · manhã ${mn} × 2 km`,
            [_A(3), serie(mn, [_C(2, 'km', 'limiar'), _R(1, 'min')]), _D(2)],
            'Manhã do duplo limiar (lactato ~2–2,5 mmol): controlado, longe do limite.',
          ),
        ]);
        sess.push([
          d,
          d === 1
            ? cT(
                'ritmo',
                `Duplo limiar · tarde ${nRep(8, 12, pt)} × 1000 m`,
                [_A(3), serie(nRep(8, 12, pt), [_C(1000, 'm', 'limiar'), _R(1, 'min')]), _D(2)],
                'Tarde do duplo limiar (lactato ~3–3,5 mmol): um pouco mais rápido que de manhã, todas iguais.',
              )
            : cT(
                'ritmo',
                `Duplo limiar · tarde ${nRep(20, 25, pt)} × 400 m`,
                [_A(3), serie(nRep(20, 25, pt), [_C(400, 'm', 'limiar'), _R(0.5, 'min')]), _D(2)],
                'Tarde do duplo limiar: 400 m no limiar com 30 s de pausa.',
              ),
        ]);
        continue;
      }
      if (s === 'q1' || s === 'q2' || s === 'x') {
        const t = qModelo(c.mod, w.fase, s, N, p, R, w.rec);
        sess.push([d, t || 'E']);
        continue;
      }
      sess.push([d, s === 'e2' ? 'E2' : 'E']);
    }
    const dL = SLOT.find((x) => x[1] === 'l')[0];
    if (teste) sess.push([dL, sTesteK(N === 'ini' ? 3 : 5)]);
    else {
      const fim =
        w.fase === 'Específica' && (c.mod === 'rev' || c.mod === 'multi') && !w.rec && N !== 'ini'
          ? lon * lerp(0.15, 0.3, p)
          : 0;
      sess.push([dL, sLon(lon, fim)]);
    }
    const usado = sess.filter((x) => typeof x[1] === 'object').reduce((a, x) => a + kmDe(x[1], perfil), 0);
    const nE = sess.filter((x) => x[1] === 'E').length + sess.filter((x) => x[1] === 'E2').length * 2;
    const eKm = nE ? Math.max(minE, (alvo - usado) / nE) : 0;
    const out = [];
    sess.forEach(([d, t]) => {
      if (t === 'E') out.push([d, sRod(eKm, (d === 2 || d === 4) && !teste)]);
      else if (t === 'E2') {
        out.push([
          d,
          { ...sRod(eKm * 1.15), titulo: `Manhã · Rodagem ${String(r05(eKm * 1.15)).replace('.', ',')} km` },
        ]);
        out.push([
          d,
          { ...sRod(eKm * 0.85), titulo: `Tarde · Rodagem ${String(r05(eKm * 0.85)).replace('.', ',')} km` },
        ]);
      } else out.push([d, t]);
    });
    out.sort((a, b) => a[0] - b[0]);
    return { ...w, sess: out };
  });
}

/* Limite de salto por treino (Frandsen et al. 2025, Br J Sports Med): nenhum treino com mais de 10% acima do mais longo
   dos 30 dias anteriores. Depois de 2 semanas de ciclo, o treino que passar disso é encurtado (menos repetições ou menos km). */
const fmtN = (x) => String(x).replace('.', ',');
function encurtar(t, f) {
  const prova = t.tipo === 'prova';
  // f < 1 encurta (arredonda para baixo, para não passar do limite); f > 1 alonga (arredonda para o mais perto)
  const rd = f > 1 ? Math.round : Math.floor;
  const est = t.estrutura.map((p) => {
    // as acelerações curtas (passadas soltas de 100 m) não entram na conta: ficam as 6
    const acel = (p.passos || []).every((x) => (x.med === 'm' && x.v <= 200) || x.k === 'ca' || x.z === 'rec');
    if (p.k === 'rep') return prova || acel ? p : { ...p, n: Math.max(2, rd(p.n * f)) };
    if (prova && p.k === 'co') return p;
    if (p.med === 'km') return { ...p, v: Math.max(1, rd(p.v * f * 2) / 2) };
    if (p.med === 'min') return { ...p, v: p.v >= 30 ? rd((p.v * f) / 5) * 5 : Math.max(5, rd(p.v * f)) };
    return p;
  });
  let titulo = t.titulo;
  const r0 = t.estrutura.find((p) => p.k === 'rep'),
    r1 = est.find((p) => p.k === 'rep');
  if (!prova && r0 && r1 && r0.n !== r1.n) titulo = titulo.replace(`${r0.n} ×`, `${r1.n} ×`);
  if (t.tipo === 'longao') {
    const co = est.filter((p) => p.k === 'co'),
      km = co.filter((p) => p.med === 'km').reduce((a, p) => a + p.v, 0),
      min = co.filter((p) => p.med === 'min').reduce((a, p) => a + p.v, 0);
    if (km)
      titulo = titulo
        .replace(/^Longão [\d,]+ km/, `Longão ${fmtN(r05(km))} km`)
        .replace(/com [\d,]+ km em ritmo/, co.length > 1 ? `com ${fmtN(co[co.length - 1].v)} km em ritmo` : '');
    if (min) titulo = titulo.replace(/[\d]+ min/, `${min} min`);
  } else if (!prova) {
    // o primeiro trecho contínuo é o que dá nome ao treino (ex.: "Rodagem 8 km + 6 acelerações")
    const c = est.find((p) => p.k === 'co'),
      c0 = t.estrutura.find((p) => p.k === 'co');
    if (c && c0 && c.v !== c0.v)
      titulo = titulo.replace(
        `${fmtN(c0.v)} ${c0.med === 'min' ? 'min' : 'km'}`,
        `${fmtN(c.v)} ${c.med === 'min' ? 'min' : 'km'}`,
      );
  }
  return { ...t, estrutura: est, titulo: titulo.trim() };
}
function limitarSaltos(W, perfil) {
  const L = [];
  W.forEach((w, i) => w.sess.forEach((x, j) => L.push({ dia: i * 7 + x[0], i, j })));
  L.sort((a, b) => a.dia - b.dia);
  const km = (t) => resumoEstrutura(t.estrutura, perfil).km;
  L.forEach((o) => {
    if (o.dia < 14) return;
    const ant = L.filter((x) => x.dia < o.dia && x.dia >= o.dia - 30);
    if (!ant.length) return;
    const mx = Math.max(...ant.map((x) => km(W[x.i].sess[x.j][1]))),
      lim = mx * 1.1;
    let t = W[o.i].sess[o.j][1];
    for (let k = 0; k < 4 && km(t) > lim + 0.05; k++) {
      const t2 = encurtar(t, lim / km(t));
      if (km(t2) >= km(t)) break;
      t = t2;
    }
    W[o.i].sess[o.j] = [W[o.i].sess[o.j][0], t];
  });
  return W;
}
/* ---------- revisão científica de todo ciclo gerado (vale para ciclos prontos, trilhas, macrociclo, São Luís, trail e volta) ----------
   1) intensidade por sessão nos limites de Daniels (Daniels' Running Formula): limiar até 10% do km da semana (mínimo
      4 km, uns 20 min), intervalado (VO2) até 8% (mínimo 3 km, máximo 10 km), tiros até 5% (mínimo 2 km, máximo 8 km),
      ritmo de maratona até 20% (mínimo 8 km, máximo 29 km);
   2) longão de asfalto com no máximo 3 h no intermediário (2 h 30 no iniciante, 3 h 30 no avançado) e 32 km, porque
      acima disso o desgaste cresce mais que o ganho (prática consolidada; Daniels; Pfitzinger);
   3) semana de recuperação: depois de 4 semanas de carga seguidas, a 5ª cai uns 25% (iniciante: depois de 3);
   4) polimento de prova: a penúltima semana antes da prova fica em até ~85% do pico (polimento de 8 a 14 dias,
      Bosquet et al. 2007);
   5) por último, nenhum treino passa de 10% do mais longo dos 30 dias anteriores (Frandsen et al. 2025): limitarSaltos. */
const ZONA_LIM = { limiar: [0.1, 4, 99], intervalado: [0.08, 3, 10], tiros: [0.05, 2, 8], maratona: [0.2, 8, 29] };
const kmZona = (t, z, perfil) =>
  achatar(t.estrutura, perfil)
    .filter((x) => x.z === z && x.k !== 'aq' && x.k !== 'dq')
    .reduce((a, x) => a + x.metros, 0) / 1000;
// diminui o trabalho de uma zona (repetições ou o trecho contínuo) pelo fator f
function reduzZona(t, z, f) {
  let mudou = false;
  const est = t.estrutura.map((p) => {
    if (p.k === 'rep' && (p.passos || []).some((x) => x.z === z)) {
      const n = Math.max(2, Math.floor(p.n * f));
      if (n !== p.n) {
        mudou = true;
        return { ...p, n };
      }
      // já está em 2 repetições: encurta cada trecho daquela zona
      const f2 = f * (p.n / n);
      if (f2 >= 0.97) return p;
      mudou = true;
      return {
        ...p,
        passos: p.passos.map((x) =>
          x.z !== z
            ? x
            : x.med === 'min'
              ? { ...x, v: Math.max(3, Math.round(x.v * f2)) }
              : x.med === 'm'
                ? { ...x, v: Math.max(400, Math.round((x.v * f2) / 100) * 100) }
                : { ...x, v: Math.max(1, Math.round(x.v * f2 * 2) / 2) },
        ),
      };
    }
    if (p.k === 'co' && p.z === z) {
      mudou = true;
      return p.med === 'min'
        ? { ...p, v: Math.max(10, Math.floor((p.v * f) / 5) * 5) }
        : p.med === 'm'
          ? { ...p, v: Math.max(400, Math.floor((p.v * f) / 100) * 100) }
          : { ...p, v: Math.max(1, Math.floor(p.v * f * 2) / 2) };
    }
    return p;
  });
  if (!mudou) return t;
  let titulo = t.titulo;
  const r0 = t.estrutura.find((p) => p.k === 'rep'),
    r1 = est.find((p) => p.k === 'rep');
  if (r0 && r1 && r0.n !== r1.n) titulo = titulo.replace(`${r0.n} ×`, `${r1.n} ×`);
  if (r0 && r1 && r0.n === r1.n && r0.passos && r1.passos) {
    // trecho encurtado: atualiza a distância ou o tempo do título (ex.: 2 × 5 km → 2 × 4 km)
    const a = r0.passos.find((x) => x.z === z),
      b = r1.passos.find((x) => x.z === z);
    if (a && b && a.v !== b.v) titulo = titulo.replace(`${r0.n} × ${fmtN(a.v)}`, `${r1.n} × ${fmtN(b.v)}`);
  }
  const c0 = t.estrutura.filter((p) => p.k === 'co'),
    c1 = est.filter((p) => p.k === 'co');
  if (t.tipo === 'longao' && c1.length > 1 && c1[c1.length - 1].v !== c0[c0.length - 1].v) {
    titulo = titulo.replace(/com [\d,]+ km em ritmo/, `com ${fmtN(c1[c1.length - 1].v)} km em ritmo`);
    const km = c1.filter((p) => p.med === 'km').reduce((a, p) => a + p.v, 0);
    if (km) titulo = titulo.replace(/^Longão [\d,]+ km/, `Longão ${fmtN(r05(km))} km`);
  }
  return { ...t, estrutura: est, titulo };
}
const DURAS = ['limiar', 'intervalado', 'tiros'];
const kmSemDe = (w, perfil) => w.sess.reduce((a, x) => a + kmDe(x[1], perfil), 0);
const duroKmDe = (t, perfil) => DURAS.reduce((b, z) => b + kmZona(t, z, perfil), 0);
const ehTesteT = (t) => t.tipo === 'teste' || /^Teste/.test(t.titulo || '');
// prova para correr no máximo (não as de treino nem as de participação)
const provaForte = (t) => t.tipo === 'prova' && !/· (treino|leve)/.test(t.titulo || '');
// sessão-chave: forte (limiar ou mais), teste, prova forte ou bloco grande em ritmo de maratona
const chave = (t, perfil) =>
  provaForte(t) ||
  ehTesteT(t) ||
  duroKmDe(t, perfil) >= 1 ||
  kmZona(t, 'maratona', perfil) >= (t.tipo === 'longao' ? 5 : 8);
// longão com o trecho em ritmo tirado (vira todo leve)
function semRitmo(t) {
  if (t.tipo !== 'longao') return t;
  const est = t.estrutura.map((p) => (p.k === 'co' && p.z === 'maratona' ? { ...p, z: 'leve' } : p));
  const km = est.filter((p) => p.k === 'co' && p.med === 'km').reduce((a, p) => a + p.v, 0);
  return {
    ...t,
    estrutura: est,
    titulo: km ? `Longão ${fmtN(r05(km))} km` : t.titulo.replace(/ com [\d,]+ km em ritmo/, ''),
    obs: OBS.lon,
  };
}
// alivia a semana até o alvo de km: primeiro o volume leve, depois (pouco) as sessões fortes; a prova não muda
function aliviar(w, alvo, perfil) {
  const prova = w.sess.filter(([, t]) => t.tipo === 'prova').reduce((a, x) => a + kmDe(x[1], perfil), 0);
  const leve = w.sess.filter(([, t]) => t.tipo !== 'prova' && !chave(t, perfil));
  const forte = w.sess.filter(([, t]) => t.tipo !== 'prova' && chave(t, perfil));
  const kL = leve.reduce((a, x) => a + kmDe(x[1], perfil), 0),
    kF = forte.reduce((a, x) => a + kmDe(x[1], perfil), 0);
  if (prova + kL + kF <= alvo + 0.3) return;
  const fF = Math.max(0.7, Math.min(1, (alvo - prova) / Math.max(1, kL + kF)));
  const fL = Math.max(0.3, Math.min(1, (alvo - prova - kF * fF) / Math.max(1, kL)));
  w.sess = w.sess.map(([d, t]) => [d, t.tipo === 'prova' ? t : encurtar(t, chave(t, perfil) ? fF : fL)]);
}
/* polimento e longão antes de cada prova principal (Bosquet et al. 2007; Wang et al. 2023: volume 41 a 60% menor,
   mantendo a intensidade e a frequência; maratona: 3 semanas, Smyth & Lawlor 2021). O longão sobe até o alvo da
   prova em passos de até 10%, dentro da regra dos 10% (Frandsen et al. 2025): meia 17 km, maratona 30 km ou 2 h 45,
   ultra 60% da distância (máx. 45 km). */
function revisarProvas(W, perfil, opts = {}) {
  const { niv = 'int', dias = 0, asfalto = true, principais = null } = opts;
  // provas principais: as que o macrociclo marcou como A, a do fim do ciclo ou as "Prova A" do São Luís. As outras
  // provas fortes têm só o alívio de véspera e dos dias seguintes, que já vem no próprio treino.
  const ehPrincipal = (i, t) =>
    principais ? principais.includes(i) : i === W.length - 1 || /^Prova A\b/.test(t.titulo);
  W.forEach((w, i) => {
    const pv = w.sess.find(([, t]) => provaForte(t) && ehPrincipal(i, t));
    if (!pv) return;
    const kmP = kmDe(pv[1], perfil);
    // longão mínimo antes da prova
    if (kmP >= 15) {
      let alvo = kmP >= 45 ? Math.min(0.6 * kmP, 45) : kmP >= 30 ? 30 : Math.min(17, 0.8 * kmP);
      if (asfalto && kmP >= 30 && kmP < 45) alvo = Math.min(alvo, (165 * 60) / paceZona('leve', perfil));
      if (asfalto)
        alvo = Math.min(alvo, ({ ini: 150, int: 180, ava: 210, pro: 210 }[niv] * 60) / paceZona('leve', perfil));
      // rampa para a frente: cada longão sobe até 10% sobre o maior treino dos 30 dias anteriores, até o alvo
      const pico = i - (kmP >= 30 ? 3 : 2);
      for (let j = Math.max(0, pico - 16); j <= pico; j++) {
        const sw = W[j];
        if (!sw || sw.rec || sw.sess.some(([, t]) => provaForte(t))) continue;
        // longão, ou prova de treino/participação emendada com longão (São Luís)
        const k = sw.sess.findIndex(
          ([, t]) => t.tipo === 'longao' || (t.tipo === 'prova' && / \+ longão/.test(t.titulo)),
        );
        if (k < 0) continue;
        const d0 = j * 7 + sw.sess[k][0];
        let mx = 0;
        W.forEach((x, jj) =>
          x.sess.forEach(([d, t]) => {
            const dd = jj * 7 + d;
            if (dd < d0 && dd >= d0 - 30) mx = Math.max(mx, kmDe(t, perfil));
          }),
        );
        const atual = kmDe(sw.sess[k][1], perfil),
          quer = Math.min(alvo, mx * 1.1);
        if (quer > atual + 0.4) sw.sess[k] = [sw.sess[k][0], encurtar(sw.sess[k][1], quer / atual)];
      }
    }
    // polimento: picos das semanas anteriores (sem as do polimento)
    const nPol = kmP >= 30 ? 3 : kmP >= 15 ? 2 : 1;
    const ant = W.slice(Math.max(0, i - nPol - 6), Math.max(0, i - nPol));
    if (!ant.length) return;
    const pico = Math.max(...ant.map((x) => kmSemDe(x, perfil)));
    const fr = nPol === 3 ? [0.8, 0.65] : nPol === 2 ? [0.72] : [];
    fr.forEach((f, k) => {
      const sw = W[i - fr.length + k];
      if (sw && !sw.sess.some(([, t]) => provaForte(t))) aliviar(sw, f * pico, perfil);
    });
    // semana da prova: sem a prova, até 45 a 50% do pico, e sem aumentar o número de dias de treino
    const fim = nPol === 3 ? 0.45 : 0.5;
    const semProva = w.sess.filter(([, t]) => t.tipo !== 'prova').reduce((a, x) => a + kmDe(x[1], perfil), 0);
    const kmProva = w.sess.filter(([, t]) => t.tipo === 'prova').reduce((a, x) => a + kmDe(x[1], perfil), 0);
    if (semProva > fim * pico + 0.3) aliviar(w, fim * pico + kmProva, perfil);
    const maxDias = dias || Math.max(0, ...ant.map((x) => new Set(x.sess.map(([d]) => d)).size));
    while (maxDias && new Set(w.sess.map(([d]) => d)).size > maxDias) {
      const leves = w.sess
        .filter(([, t]) => t.tipo !== 'prova' && !chave(t, perfil))
        .sort((x, y) => kmDe(x[1], perfil) - kmDe(y[1], perfil));
      if (!leves.length) break;
      w.sess = w.sess.filter((x) => x !== leves[0]);
    }
  });
  return W;
}
/** duas sessões-chave nunca em dias seguidos (Daniels: dia forte, dia leve). O duplo limiar no mesmo dia e os
    longões de trilha em dias seguidos são de propósito e ficam. */
function separarFortes(W, perfil, trail) {
  const todas = [];
  W.forEach((w, i) => w.sess.forEach((x, j) => todas.push({ dia: i * 7 + x[0], i, j })));
  todas.sort((a, b) => a.dia - b.dia);
  for (let k = 1; k < todas.length; k++) {
    const A = todas[k - 1],
      B = todas[k];
    if (B.dia - A.dia !== 1) continue;
    const tA = W[A.i].sess[A.j][1],
      tB = W[B.i].sess[B.j][1];
    if (!chave(tA, perfil) || !chave(tB, perfil)) continue;
    if (trail && tA.tipo === 'longao' && tB.tipo === 'longao') continue;
    // o que pode virar leve: primeiro o ritmo do longão, depois a sessão forte que não é prova nem teste;
    // duas provas "de treino" em dias seguidos: a menor vira de participação (leve)
    const pode = (t) => t.tipo !== 'prova' && !ehTesteT(t);
    if (tA.tipo === 'prova' && tB.tipo === 'prova') {
      const treino = [A, B].filter((x) => /· treino/.test(W[x.i].sess[x.j][1].titulo || ''));
      if (treino.length) {
        const x = treino.sort((p, q) => kmDe(W[p.i].sess[p.j][1], perfil) - kmDe(W[q.i].sess[q.j][1], perfil))[0];
        const t = W[x.i].sess[x.j][1];
        W[x.i].sess[x.j] = [
          W[x.i].sess[x.j][0],
          {
            ...t,
            titulo: t.titulo.replace('· treino', '· leve'),
            estrutura: t.estrutura.map((p) => (p.k === 'co' && DURAS.includes(p.z) ? { ...p, z: 'leve' } : p)),
            obs: 'Prova de participação: ritmo de conversa, sem forçar. Fica leve porque há outra prova no dia seguinte.',
          },
        ];
      }
      continue;
    }
    if (tB.tipo === 'longao' && kmZona(tB, 'maratona', perfil) > 0 && duroKmDe(tB, perfil) < 1)
      W[B.i].sess[B.j] = [W[B.i].sess[B.j][0], semRitmo(tB)];
    else if (tA.tipo === 'longao' && kmZona(tA, 'maratona', perfil) > 0 && duroKmDe(tA, perfil) < 1)
      W[A.i].sess[A.j] = [W[A.i].sess[A.j][0], semRitmo(tA)];
    else {
      const alvo = pode(tB) && (!pode(tA) || duroKmDe(tB, perfil) <= duroKmDe(tA, perfil)) ? B : pode(tA) ? A : null;
      if (alvo)
        W[alvo.i].sess[alvo.j] = [
          W[alvo.i].sess[alvo.j][0],
          sRod(Math.max(3, kmDe(W[alvo.i].sess[alvo.j][1], perfil)), true),
        ];
    }
  }
  return W;
}
/** semana marcada como recuperação precisa ter caído de verdade; senão perde a marca (a força usa essa marca) */
function marcarRec(W, perfil) {
  W.forEach((w, i) => {
    if (!w.rec || !i) return;
    const ref = Math.max(...W.slice(Math.max(0, i - 3), i).map((x) => kmSemDe(x, perfil)));
    if (kmSemDe(w, perfil) > 0.9 * ref) w.rec = false;
  });
  return W;
}
function ajustarCiencia(W, perfil, c) {
  const asfalto = !['trail', 'ultra'].includes(c.obj) && c.modo !== 'trail';
  const kmSem = (w) => kmSemDe(w, perfil);
  // iniciante: nada de limiar ou mais forte nas 3 primeiras semanas (vira rodagem com acelerações)
  if (c.niv === 'ini')
    W.slice(0, 3).forEach((w) => {
      w.sess = w.sess.map(([d, t]) =>
        t.tipo !== 'prova' && !ehTesteT(t) && duroKmDe(t, perfil) >= 1
          ? [d, sRod(Math.max(3, kmDe(t, perfil)), true)]
          : [d, t],
      );
    });
  limitarZonas(W, perfil);
  // 1b) na semana: limiar ou mais forte até 20% do volume (iniciante 15%, profissional 25% no duplo limiar), e
  // ritmo de maratona + limiar ou mais forte até 30% (profissional 35%) (Seiler 2010; Stöggl & Sperlich 2014; Casado 2022)
  const capDuro = c.niv === 'pro' ? 0.25 : c.niv === 'ini' ? 0.15 : 0.2,
    capQual = c.niv === 'pro' ? 0.35 : 0.3;
  W.forEach((w) => {
    if (['Polimento', 'Prova'].includes(w.fase) || w.sess.some(([, t]) => t.tipo === 'prova')) return;
    for (let k = 0; k < 3; k++) {
      const tot = kmSem(w),
        duro = w.sess.reduce((a, [, t]) => a + duroKmDe(t, perfil), 0);
      if (!tot || duro <= capDuro * tot * 1.02) break;
      const f = Math.max(0.5, (capDuro * tot - capDuro * duro) / (duro * (1 - capDuro)));
      w.sess = w.sess.map(([d, t]) => {
        if (ehTesteT(t)) return [d, t];
        let t2 = t;
        DURAS.forEach((z) => {
          if (kmZona(t2, z, perfil) > 0) t2 = reduzZona(t2, z, f);
        });
        return [d, t2];
      });
    }
    for (let k = 0; k < 3; k++) {
      const tot = kmSem(w),
        duro = w.sess.reduce((a, [, t]) => a + duroKmDe(t, perfil), 0),
        mar = w.sess.reduce((a, [, t]) => a + kmZona(t, 'maratona', perfil), 0);
      if (!tot || !mar || duro + mar <= capQual * tot * 1.02) break;
      const f = Math.max(0.4, (capQual * tot - duro - capQual * mar) / (mar * (1 - capQual)));
      w.sess = w.sess.map(([d, t]) => [d, kmZona(t, 'maratona', perfil) > 0 ? reduzZona(t, 'maratona', f) : t]);
    }
  });
  // 1c) sessões fortes por semana
  limitarFortes(W, perfil, c.niv);
  // 2) longão de asfalto: até 3 h (iniciante 2 h 30, avançado e profissional 3 h 30) e 32 km
  if (asfalto) {
    const capMin = { ini: 150, int: 180, ava: 210, pro: 210 }[c.niv] || 180;
    W.forEach((w) => {
      w.sess = w.sess.map(([d, t]) => {
        if (t.tipo !== 'longao') return [d, t];
        const r = resumoEstrutura(t.estrutura, perfil);
        const f = Math.min(1, (capMin * 60) / r.seg, 32 / r.km);
        return [d, f < 0.98 ? encurtar(t, f) : t];
      });
    });
  }
  limitarVolume(W, perfil);
  // 3a) semana de recuperação que o próprio ciclo já marcou: cai para ~80% da maior das 3 anteriores
  W.forEach((w, i) => {
    if (!w.rec || i === 0) return;
    const ref = Math.max(...W.slice(Math.max(0, i - 3), i).map(kmSem));
    if (kmSem(w) > 0.83 * ref) aliviar(w, 0.8 * ref, perfil);
  });
  // 3) semana de recuperação depois de 4 semanas de carga (iniciante: 3)
  const maxCarga = c.niv === 'ini' ? 3 : 4;
  let seq = 0;
  W.forEach((w, i) => {
    const vols = W.map(kmSem);
    const caiu = i > 0 && vols[i] <= 0.85 * Math.max(...vols.slice(Math.max(0, i - 3), i));
    const final = i >= W.length - 3 || ['Polimento', 'Prova', 'Recuperação', 'Transição', 'Teste'].includes(w.fase);
    if (w.rec || caiu) {
      seq = 0;
      return;
    }
    seq++;
    if (final) return;
    if (seq > maxCarga) {
      aliviar(w, 0.8 * Math.max(...vols.slice(Math.max(0, i - 3), i)), perfil);
      w.rec = true;
      seq = 0;
    }
  });
  // 4) longão e polimento antes das provas principais; 5) sessões-chave em dias separados
  revisarProvas(W, perfil, { niv: c.niv, dias: c.dias, asfalto });
  separarFortes(W, perfil, !asfalto);
  // 6) volume da semana sobe no máximo 25% sobre a maior das 4 semanas anteriores (Nielsen et al. 2014)
  // e, com o volume final de cada semana, confere de novo a intensidade por sessão
  return limitarZonas(limitarVolume(W, perfil), perfil);
}
function limitarZonas(W, perfil) {
  const kmSem = (w) => w.sess.reduce((a, x) => a + kmDe(x[1], perfil), 0);
  // intensidade por sessão (limites de Daniels), sobre o km final da semana
  W.forEach((w) => {
    const tot = kmSem(w);
    w.sess = w.sess.map(([d, t]) => {
      if (t.tipo === 'prova' || t.tipo === 'teste') return [d, t];
      let t2 = t;
      Object.entries(ZONA_LIM).forEach(([z, [pct, mn, mx]]) => {
        const lim = Math.min(Math.max(pct * tot, mn), mx);
        for (let k = 0; k < 3; k++) {
          const v = kmZona(t2, z, perfil);
          if (v <= lim + 0.05) break;
          const t3 = reduzZona(t2, z, lim / v);
          if (t3 === t2) break;
          t2 = t3;
        }
      });
      return [d, t2];
    });
  });
  return W;
}
function limitarFortes(W, perfil, niv) {
  // sessões-chave por semana: até 2 no iniciante e no intermediário, 3 no avançado e 5 no profissional (duplo limiar).
  // As que passam do limite: o longão perde o trecho em ritmo; as outras viram rodagem leve com a mesma distância.
  const limQ = { ini: 2, int: 2, ava: 3, pro: 5 }[niv] || 2;
  W.forEach((w) => {
    let sobra = w.sess.filter(([, t]) => chave(t, perfil)).length - limQ;
    if (sobra <= 0) return;
    const ordem = w.sess
      .map((x, i) => ({ x, i }))
      .filter(({ x: [, t] }) => chave(t, perfil) && t.tipo !== 'prova' && !ehTesteT(t))
      // primeiro o ritmo dos longões, depois as sessões com menos trabalho forte
      .sort(
        (a, b) =>
          (b.x[1].tipo === 'longao') - (a.x[1].tipo === 'longao') ||
          duroKmDe(a.x[1], perfil) - duroKmDe(b.x[1], perfil),
      );
    ordem.forEach(({ x, i }) => {
      if (sobra <= 0) return;
      const t = x[1];
      w.sess[i] = [
        x[0],
        t.tipo === 'longao' && duroKmDe(t, perfil) < 1 ? semRitmo(t) : sRod(Math.max(3, kmDe(t, perfil))),
      ];
      sobra--;
    });
  });
  return W;
}
function limitarVolume(W, perfil) {
  W.forEach((w, i) => {
    if (!i) return;
    const ref = Math.max(...W.slice(Math.max(0, i - 4), i).map((x) => kmSemDe(x, perfil)));
    if (ref > 0 && kmSemDe(w, perfil) > ref * 1.25 + 0.5) aliviar(w, ref * 1.25, perfil);
    // se ainda passou (semana só com sessões-chave), reduz tudo menos a prova
    for (let k = 0; k < 2 && ref > 0; k++) {
      const v = kmSemDe(w, perfil);
      if (v <= ref * 1.25 + 0.5) break;
      const prova = w.sess.filter(([, t]) => t.tipo === 'prova').reduce((a, x) => a + kmDe(x[1], perfil), 0);
      const f = Math.max(0.4, (ref * 1.25 - prova) / Math.max(1, v - prova));
      w.sess = w.sess.map(([d, t]) => [d, t.tipo === 'prova' ? t : encurtar(t, f)]);
    }
  });
  return W;
}
// sessão mais longa e volume da semana se influenciam: duas passadas deixam os dois dentro do limite
const limitarCargas = (W, perfil) => {
  for (let k = 0; k < 2; k++) limitarVolume(limitarSaltos(W, perfil), perfil);
  return marcarRec(limitarSaltos(W, perfil), perfil);
};
const cicCache = {};
const cicSemanas = (c) =>
  cicCache[c.id] ||
  (cicCache[c.id] = limitarCargas(
    ajustarCiencia(
      (c.gen ? c.gen(c) : c.modo === 'modelo' ? gerarModelo(c) : gerarCiclo(c)).map((w) => ({
        ...w,
        sess: w.sess.map((x) => [...x]),
      })),
      perfilNiv(c.niv),
      c,
    ),
    perfilNiv(c.niv),
  ));
const cicKm = (sem, perfil) => sem.sess.reduce((a, x) => a + kmDe(x[1], perfil), 0);

// biblioteca de ciclos (treinador)
const cicCardHTML = (c) => {
  const S2 = cicSemanas(c),
    p = perfilNiv(c.niv),
    kms = S2.map((s) => cicKm(s, p));
  const tr = Math.round(S2.reduce((a, s) => a + s.sess.length, 0) / S2.length);
  const np = S2.reduce((a, s) => a + s.sess.filter(([, t]) => t.tipo === 'prova').length, 0);
  return `<a class="card tap cic-card" href="#/treinos/ciclos/${c.id}" style="color:inherit"><div class="row between" style="gap:8px;align-items:flex-start"><div style="min-width:0"><b class="h3">${esc(c.nome)}</b><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="tag acc">${c.obj === 'volta' ? 'Todos os níveis' : CIC_NIV[c.niv]}</span><span class="tag">${c.sem} semana${c.sem > 1 ? 's' : ''}</span><span class="tag">~${tr} treinos/semana</span><span class="tag">${Math.round(Math.min(...kms))} a ${Math.round(Math.max(...kms))} km/sem</span>${c.obj === 'slz' ? `<span class="tag">${np} provas</span>` : ''}</div></div>${I.chev}</div>${cicBarra(S2)}${c.desc ? `<p class="small muted" style="margin-top:8px">${esc(c.desc)}</p>` : ''}</a>`;
};
const trlCard = (t, forca) => {
  const cs = t.seq.map((x) => (forca ? CICLOS_FORCA : CICLOS_CORR).find((c) => c.id === x)).filter(Boolean),
    tot = cs.reduce((a, c) => a + cicSem(c), 0);
  return `<a class="card tap cic-card" href="${forca ? '#/treinos/ciclos-forca/' : '#/treinos/ciclos/'}${t.id}" style="color:inherit"><div class="row between" style="gap:8px;align-items:flex-start"><div style="min-width:0"><b class="h3">${esc(t.nome)}</b><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="tag acc">${CIC_NIV[t.niv]}</span><span class="tag">${cs.length} ciclos</span><span class="tag">${tot} semanas</span></div></div>${I.chev}</div><div class="cic-barra trl-barra">${cs.map((c, i) => `<i style="flex:${cicSem(c)};background:hsl(${(i * 47 + 190) % 360} 70% 55%)"></i>`).join('')}</div><p class="small muted" style="margin-top:8px">${esc(t.desc)}</p><p class="tiny dim" style="margin-top:6px">${cs.map((c) => esc(c.nome)).join(' → ')}</p></a>`;
};
async function viewCiclos(id) {
  if (id)
    return id === 'slz'
      ? viewSLZ()
      : id === 'anual'
        ? viewMacro()
        : /^t-/.test(id)
          ? viewTrilha(id, false)
          : viewCiclo(id);
  const st = S.cache.cicObj || (S.cache.cicObj = { o: store.get('nx-cic-obj', 'ini') });
  const desenha = () => {
    st.m = st.m || store.get('nx-cic-mod', 'trad');
    const L = CICLOS_CORR.filter((c) => c.obj === st.o && (st.o !== 'modelos' || c.mod === st.m));
    const mi = MOD_INFO[st.m];
    $app.innerHTML = `<a class="back" href="#/treinos/corrida">${I.back} Treinos de corrida</a><p class="eyebrow">Biblioteca de corrida</p><h1 class="h1">Ciclos prontos</h1>
      <p class="muted" style="margin-top:6px">Ciclos completos, semana a semana. Ao aplicar, todas as semanas vão para a planilha do aluno <b>sem liberar</b>: você ajusta o que quiser e libera semana a semana. Os ritmos de cada zona saem do perfil de corrida de cada aluno.</p>
      <a class="card tap mac-cta" href="#/treinos/ciclos/anual" style="color:inherit;margin-top:14px"><span class="mac-cta-ic">${I.cal}</span><div class="grow" style="min-width:0"><b>Macrociclo anual</b><p class="small muted" style="margin-top:2px">Monte o ano do aluno a partir das provas principais, com todos os ciclos na ordem certa.</p></div>${I.chev}</a>
      <a class="card tap mac-cta" href="#/treinos/ciclos/slz" style="color:inherit;margin-top:10px"><span class="mac-cta-ic">${I.flag}</span><div class="grow" style="min-width:0"><b>Macrociclo São Luís</b><p class="small muted" style="margin-top:2px">Para quem corre muitas provas: de 2 a 6 no mês e de 10 a 50 no ano, em todos os níveis.</p></div>${I.chev}</a>
      <div class="chips" id="cic-o" style="margin-top:14px">${CIC_OBJ.map(([k, l]) => `<button type="button" class="chip ${k === st.o ? 'on' : ''}" data-o="${k}">${l}</button>`).join('')}</div>
      ${
        st.o === 'modelos'
          ? `<p class="small muted" style="margin-top:12px"><b>Periodização</b> é como as fases se encadeiam ao longo do ciclo. <b>Distribuição de intensidade</b> é como cada semana se divide entre leve e forte. Escolha o modelo e o nível do aluno.</p>
        <div class="chips wrap" id="cic-m" style="margin-top:10px">${MOD_CORR.map(([k, l]) => `<button type="button" class="chip ${k === st.m ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</div>
        <div class="card mod-info" style="margin-top:12px"><span class="eyebrow">${mi.tipo}</span><div class="h3" style="margin-top:2px">${esc((MOD_CORR.find((x) => x[0] === st.m) || [])[1])}</div><p class="small" style="margin-top:6px">${mi.oque}</p><p class="small" style="margin-top:6px"><b>Quando usar:</b> ${mi.quando}</p><p class="tiny dim" style="margin-top:6px">${mi.ci}</p></div>`
          : ''
      }
      ${st.o === 'trail' ? CIC_INFO_TRAIL : st.o === 'volta' ? CIC_INFO_VOLTA : ''}
      ${st.o === 'bloco' ? `<div class="card cic-macro" style="margin-top:12px"><span class="eyebrow">Macrociclo sugerido da temporada</span><ol>${CIC_MACRO.map((x) => `<li>${x}</li>`).join('')}</ol><p class="tiny dim">Aplique um ciclo depois do outro, cada um começando na segunda-feira seguinte ao fim do anterior.</p></div>` : ''}
      ${st.o === 'trilhas' ? `<p class="small muted" style="margin-top:12px"><b>Trilhas</b> são ciclos encadeados na ordem certa: cada um começa na segunda-feira seguinte ao fim do anterior. Aplique a trilha inteira de uma vez ou abra cada ciclo para ver o que vem depois.</p><div class="stack" style="margin-top:12px">${TRILHAS_CORR.map((t) => trlCard(t, false)).join('')}</div>` : ''}
      <div class="stack" style="margin-top:12px">${L.map(cicCardHTML).join('')}</div>`;
    document.getElementById('cic-o').onclick = (e) => {
      const x = e.target.closest('[data-o]');
      if (!x) return;
      st.o = x.dataset.o;
      store.set('nx-cic-obj', st.o);
      desenha();
    };
    const cm = document.getElementById('cic-m');
    if (cm)
      cm.onclick = (e) => {
        const x = e.target.closest('[data-m]');
        if (!x) return;
        st.m = x.dataset.m;
        store.set('nx-cic-mod', st.m);
        desenha();
      };
  };
  desenha();
}
// faixa colorida das fases
const cicBarra = (S2) =>
  `<div class="cic-barra">${S2.map((s) => `<i style="background:${CIC_FASE_COR[s.fase] || '#9aa8c0'};opacity:${s.rec ? 0.45 : 1}" title="${esc(s.fase)}"></i>`).join('')}</div><div class="cic-leg">${[...new Set(S2.map((s) => s.fase))].map((f) => `<span><i style="background:${CIC_FASE_COR[f] || '#9aa8c0'}"></i>${f}</span>`).join('')}${S2.some((s) => s.rec) ? '<span><i style="background:#9aa8c0;opacity:.45"></i>Recuperação</span>' : ''}</div>`;
function viewCiclo(id) {
  const c = CICLOS_CORR.find((x) => x.id === id);
  if (!c) {
    location.replace('#/treinos/ciclos');
    return;
  }
  const ehMod = !!c.mod;
  const S2 = cicSemanas(c),
    perfil = perfilNiv(c.niv);
  const CIENCIA = {
    corre:
      'Progressão de corrida e caminhada: o tempo correndo cresce aos poucos para o corpo (tendões e ossos) se adaptar ao impacto. Três treinos por semana, com um dia de descanso entre eles.',
    corre30:
      'Aumento gradual do tempo contínuo, sempre em ritmo de conversa. Se uma semana ficar pesada, repita antes de avançar.',
    base: 'Base aeróbica: quase todo o volume leve (Z1–Z2), um pouco de limiar controlado e subidas curtas para força e técnica. Semana de recuperação a cada 4.',
    prova:
      'Periodização em fases: base (volume leve e técnica), construção (limiar norueguês com pausas curtas), específica (ritmo e intensidade da prova) e polimento (volume 40–60% menor, mantendo a intensidade). Semana de recuperação a cada 4, volume crescendo aos poucos. Nenhum treino deve passar muito do mais longo dos últimos 30 dias: saltos acima de 10% num treino isolado aumentaram o risco de lesão (Frandsen et al. 2025).',
    limiar:
      'Modelo norueguês: muito volume de limiar controlado (lactato ~2–3,5 mmol, esforço 5–6 de 10) com pausas curtas, duas vezes por semana, e o resto leve. Para o profissional, duplo limiar (manhã e tarde) nas terças e quintas.',
    vo2: 'Bloco curto e concentrado de VO₂máx: 4 × 4 min (NTNU) e intervalados longos em Z5, com rodagens leves entre eles.',
    polimento:
      'Polimento: volume 41–60% menor nas últimas 1 a 3 semanas, mantendo a intensidade e o número de treinos. Na meta-análise mais recente, esse formato melhorou o desempenho em contrarrelógio de atletas de endurance (Wang et al. 2023; Bosquet et al. 2007).',
    pos: 'Recuperação depois da prova: só corridas leves e curtas. A inflamação e o dano muscular levam mais tempo para voltar ao normal quanto maior a prova (Alves et al. 2022, Front Physiol); 1 a 2 semanas leves depois de meia e maratona são a prática consagrada para voltar a treinar forte sem risco.',
    trans:
      'Descanso ativo: mantém o hábito e a base sem cansar, recuperando a cabeça e o corpo antes da próxima temporada.',
    trail:
      'Treino de trail por tempo e esforço: subidas curtas na base, subidas longas e limiar na construção, descidas e longões em terreno na fase específica (com dois longões seguidos nos ciclos longos) e polimento antes da prova. Caminhar nas subidas íngremes é mais econômico (Giovanelli et al. 2016) e treinar descidas protege a musculatura do dano excêntrico da prova (Bontemps et al. 2020). Acima de 90 min, 30 a 60 g de carboidrato por hora, chegando a 90 g ou mais nas provas longas com o intestino treinado (Thomas, Erdman & Burke 2016; Urdampilleta et al. 2020).',
    volta:
      'Protocolo de volta à corrida: corre e caminha progressivo até 30 min contínuos, sempre em dias alternados e em terreno plano. Só avança se a dor ficar em até 2 de 10 durante e sumir até a manhã seguinte; se passar disso, volta uma etapa (Silbernagel et al. 2007 e 2020; Warden et al. 2014 e 2021). Depois, nenhum treino mais de 10% maior que o mais longo dos últimos 30 dias (Frandsen et al. 2025). Exige liberação do médico ou fisioterapeuta. Faça força de panturrilha, glúteo e quadríceps nos dias sem corrida.',
    slz: 'Cada prova tem um papel: forte (no máximo, com véspera e dias seguintes leves), treino (ritmo de limiar, no lugar do treino de qualidade) ou leve (participação). Os treinos intensos da semana, contando a prova, ficam no limite do nível, e a maior parte do volume continua leve. As provas estão nos sábados e domingos do modelo: depois de aplicar, mova cada uma para a data real.',
  };
  const semHTML = (
    s,
    i,
  ) => `<details class="card cic-sem" ${i === 0 ? 'open' : ''}><summary><div class="grow"><b>Semana ${i + 1}</b> <span class="cic-fase" style="--fc:${CIC_FASE_COR[s.fase] || '#9aa8c0'}">${s.rec ? 'Recuperação' : s.fase}</span></div><span class="small muted">${f1(cicKm(s, perfil))} km · ${s.sess.length} treinos</span>${I.chev}</summary>
    <div class="stack" style="margin-top:10px;gap:8px">${s.sess.map(([d, t]) => `<div class="cic-tr"><span class="cic-dia">${DIAS_SEM[d]}</span><div class="grow" style="min-width:0"><b>${esc(t.titulo)}</b>${t.estrutura.length ? `<div style="margin:6px 0 2px">${perfilHTML(t.estrutura, perfil)}</div><p class="tiny dim">${f1(kmDe(t, perfil))} km · ${esc(descreverEstrutura(t.estrutura))}</p>` : ''}</div></div>`).join('')}</div></details>`;
  const slz = c.obj === 'slz';
  $app.innerHTML = `<a class="back" href="${slz ? '#/treinos/ciclos/slz' : '#/treinos/ciclos'}">${I.back} ${slz ? 'Macrociclo São Luís' : 'Ciclos prontos'}</a><p class="eyebrow">${ehMod ? 'Modelo de treino' : slz ? 'Macrociclo São Luís' : esc((CIC_OBJ.find((x) => x[0] === c.obj) || [])[1] || '')} · ${c.obj === 'volta' ? 'Todos os níveis' : CIC_NIV[c.niv]}</p><h1 class="h1">${esc(c.nome)}</h1>
    ${c.desc ? `<p class="muted" style="margin-top:6px">${esc(c.desc)}</p>` : ''}
    <div class="card" style="margin-top:14px"><div class="ck-res cic-res"><div><b>${c.sem}</b><span>semanas</span></div><div><b>${Math.round(S2.reduce((a, s) => a + s.sess.length, 0) / S2.length)}</b><span>treinos por semana</span></div><div><b>${Math.round(Math.max(...S2.map((s) => cicKm(s, perfil))))}</b><span>km na semana mais forte</span></div></div>${cicBarra(S2)}</div>
    <button class="btn block" id="cic-apl" style="margin-top:12px">${I.users} Aplicar a um aluno</button>
    ${c.mod ? `<div class="card mod-info" style="margin-top:12px"><span class="eyebrow">${MOD_INFO[c.mod].tipo}</span><p class="small" style="margin-top:6px">${MOD_INFO[c.mod].oque}</p><p class="small" style="margin-top:6px"><b>Quando usar:</b> ${MOD_INFO[c.mod].quando}</p><p class="small" style="margin-top:6px"><b>Base científica:</b> ${MOD_INFO[c.mod].ci}</p><p class="tiny dim" style="margin-top:6px">A última semana termina com um teste para medir a evolução. Se o aluno tiver prova, troque o teste pela prova.</p></div>` : ''}
    <div class="card cic-ci" style="margin-top:12px"><span class="eyebrow">Base científica</span><p class="small" style="margin-top:6px">${c.mod ? 'Em todos os modelos: volume crescendo aos poucos, semana de recuperação a cada 4 e a maior parte do treino leve.' : CIENCIA[c.modo] || CIENCIA.prova}</p><p class="tiny dim" style="margin-top:8px">${slz ? SLZ_REFS : { trail: 'Scheer et al. 2020 (Int J Sports Med); Bontemps et al. 2020 (Sports Med); Urdampilleta et al. 2020 (Nutrients); Oliveira et al. 2024 (Sports Med); Giovanelli et al. 2016 (J Appl Physiol); Thomas, Erdman & Burke 2016 (Med Sci Sports Exerc).', volta: 'Frandsen et al. 2025 (Br J Sports Med); Hoenig et al. 2023 (Br J Sports Med); Warden et al. 2021 (Curr Osteoporos Rep); Silbernagel et al. 2020 (J Athl Train); Warden et al. 2014 (J Orthop Sports Phys Ther); Silbernagel et al. 2007 (Am J Sports Med).' }[c.modo] || CIC_REFS}</p><p class="tiny dim" style="margin-top:6px">Os km são uma estimativa para um aluno típico deste nível. Os ritmos saem do perfil de corrida de cada aluno.</p></div>
    ${seqHTML(proximosCorr(c), '#/treinos/ciclos/')}
    <p class="sec-lbl">Semana a semana</p><div class="stack">${S2.map(semHTML).join('')}</div>`;
  document.getElementById('cic-apl').onclick = () => cicAplicar(c, S2);
}
async function cicAplicar(c, S2) {
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,ativo,aprovacao,treinador_id,modalidades,corrida,nascimento')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const alunos = ms.filter(
    (m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado' && faz('corrida', m),
  );
  const prox = (() => {
    const d = inicioSemana();
    d.setDate(d.getDate() + 7);
    return isoDia(d);
  })();
  const temProva = c.modo === 'prova' || c.modo === 'polimento' || c.modo === 'trail';
  const pre = S.cache.cicPre || {};
  S.cache.cicPre = null;
  openSheet(
    `<p class="eyebrow">Aplicar ciclo</p><div class="h2" style="margin-top:4px">${esc(c.nome)}</div>
    <form id="f-cic" style="margin-top:14px">
      <label class="field"><span>Aluno</span><select class="input" name="aluno" required><option value="">Escolha o aluno</option>${alunos.map((m) => `<option value="${m.user_id}" ${pre.aluno === m.user_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></label>
      ${temProva ? '<label class="field"><span>Data da prova (opcional)</span><input class="input" type="date" name="prova"><small class="tiny dim">Com a data da prova, o ciclo termina no domingo da semana da prova.</small></label>' : ''}
      <label class="field"><span>Começa na segunda-feira</span><input class="input" type="date" name="ini" value="${pre.ini || prox}" required></label>
      <p class="small" id="cic-fim" style="margin:-4px 0 10px;color:var(--acc)"></p>
      <label class="field"><span>Dia do longão</span><select class="input" name="longao"><option value="pad">Como no ciclo</option><option value="5">Sábado</option><option value="6">Domingo</option></select></label>
      <label class="ck-check"><input type="checkbox" name="limpar" checked><span>Apagar os treinos ainda não liberados a partir dessa data (inclusive os de ciclos aplicados antes)</span></label>
      <p class="tiny dim" style="margin:8px 0 12px">Nada é liberado para o aluno. Os treinos já liberados nunca são apagados.</p>
      <button class="btn block" type="submit">Montar ${c.sem} semana${c.sem > 1 ? 's' : ''} na planilha</button></form>`,
    (r) => {
      const f = r.querySelector('#f-cic');
      const segunda = (iso) => isoDia(inicioSemana(dia(iso)));
      const atual = () => {
        const pv = f.prova && f.prova.value;
        if (pv) {
          const d = inicioSemana(dia(pv));
          d.setDate(d.getDate() - 7 * (c.sem - 1));
          f.ini.value = isoDia(d);
        }
        const ini = segunda(f.ini.value || prox);
        const fim = dia(ini);
        fim.setDate(fim.getDate() + 7 * c.sem - 1);
        r.querySelector('#cic-fim').textContent = `Vai de ${fmtDia(ini)} a ${fmtDia(isoDia(fim))}.`;
      };
      f.oninput = atual;
      atual();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const alunoId = f.aluno.value;
        if (!alunoId) return toast('Escolha o aluno.', true);
        const m = alunos.find((x) => x.user_id === alunoId),
          perfil = perfilCorrida(m || {});
        const b = f.querySelector('button[type=submit]');
        b.disabled = true;
        b.textContent = 'Montando…';
        const ini = dia(segunda(f.ini.value || prox)),
          fim = new Date(ini);
        fim.setDate(fim.getDate() + 7 * c.sem - 1);
        const rows = linhasCiclo(c, alunoId, perfil, ini, f.longao.value);
        try {
          if (f.limpar.checked) {
            const { error: e1 } = await sb
              .from('nx_plano_corrida')
              .delete()
              .eq('aluno_id', alunoId)
              .eq('liberado', false)
              .gte('data', isoDia(ini));
            if (e1) throw e1;
          }
          for (let k = 0; k < rows.length; k += 150) {
            const { error: e2 } = await sb.from('nx_plano_corrida').insert(rows.slice(k, k + 150));
            if (e2) throw e2;
          }
        } catch (er) {
          console.error(er);
          b.disabled = false;
          b.textContent = 'Tentar de novo';
          return toast('Não foi possível montar o ciclo. Tente de novo.', true);
        }
        registrarCiclo(alunoId, 'corrida', c, ini, c.sem);
        closeSheet(true);
        toast(`${rows.length} treinos montados para ${firstName(m && m.nome)}. Libere semana a semana.`);
        abrirNaSemana(alunoId, isoDia(ini));
        location.hash = `#/aluno/${alunoId}/corrida`;
      };
    },
  );
}
