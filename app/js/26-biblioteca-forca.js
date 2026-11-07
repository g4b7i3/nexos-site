/* Nexos App · Biblioteca de força Nexos.
   Parte 26 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- montagem de treino: modelos de musculação e de corrida ---------- */
/* ================= BIBLIOTECA DE FORÇA NEXOS =================
   Base científica (resumo):
   - ACSM 2026 (Currier et al., Med Sci Sports Exerc 58(4):851-872): cada grupo muscular ≥2x/semana; força com ≥80% 1RM e 2–3 séries;
     hipertrofia com ≥10 séries por músculo/semana (retorno diminui depois de ~18–20), qualquer carga de ~30–100% 1RM se a série for
     perto da falha (2–3 reps sobrando); falha total não traz ganho extra; amplitude completa; máquina = peso livre; potência com subida rápida.
   - Robinson et al. 2024 (Sports Med): mais perto da falha → mais hipertrofia; para força, a distância da falha pesa pouco.
   - Pelland et al. 2026 (Sports Med 56:481): mais volume semanal → mais ganho, com retorno decrescente.
   - Singer et al. 2024 (Front Sports Act Living): descanso >60 s dá pequena vantagem para hipertrofia; acima de ~90 s pouco muda.
   - Wolf et al. 2023 (IJSC) e Maeo et al. 2021/2022: treinar o músculo alongado ajuda (mesa flexora sentada > deitada; tríceps acima da cabeça > pulley).
   - Plotkin et al. 2023 (Front Physiol): elevação pélvica e agachamento dão glúteo parecido; agachamento dá mais coxa.
   - Wewege et al. 2021 (Sports Med): só musculação já reduz ~1,4% de gordura corporal; melhor resultado = força + aeróbio + alimentação.
   - Llanos-Lagos et al. 2024 (Sports Med): para corredores, força pesada (≥80% 1RM), pliometria e a combinação melhoram a economia de corrida.
   - Lauersen et al. 2014 (BJSM): treino de força reduz lesões esportivas para menos de 1/3.
   - Rønnestad et al. 2011 (JSCR): 1 sessão de força por semana mantém os ganhos na temporada; a cada 2 semanas, não.
   - Iversen et al. 2021 (Sports Med): mínimo de 4 séries por músculo/semana (6–15 RM); bi-séries, drop-set e rest-pause cortam o tempo pela metade.
   - Sødal et al. 2023 (Sports Med Open): drop-set dá hipertrofia parecida com séries tradicionais em menos tempo.
   - van Dyk et al. 2019 (BJSM): programas com flexão nórdica reduzem lesões de posterior em ~51% (8.459 atletas).
   - Harøy et al. 2019 (BJSM): prancha de Copenhague reduz problemas na virilha em ~41%.
   - Watson et al. 2018 (JBMR, LIFTMOR): 5×5 a >80–85% + impacto, 2x/semana, aumenta densidade óssea em pós-menopausa.
   - Su et al. 2023 (Front Endocrinol): musculação reduz HbA1c no diabetes tipo 2.
   - Hayden et al. 2021 (Cochrane): exercício reduz a dor lombar crônica.
   - Meta-análise de treino concorrente 2022 (Sports Med 52:2391): a corrida reduz um pouco o crescimento das fibras. */
const NIVEIS_FORCA = [
  ['ini', 'Iniciante'],
  ['int', 'Intermediário'],
  ['ava', 'Avançado'],
];
const CATS_FORCA = [
  ['hipertrofia', 'Hipertrofia'],
  ['gluteo', 'Glúteos e pernas'],
  ['emagrecimento', 'Emagrecimento'],
  ['forca', 'Força máxima'],
  ['rapido', 'Treino rápido'],
  ['corredor', 'Força para corredores'],
  ['prevencao', 'Prevenção de lesões'],
  ['casa', 'Em casa'],
  ['saude', 'Saúde e longevidade'],
];
const GUIA_FORCA = {
  ini: [
    '2 a 3 treinos por semana, corpo inteiro, com pelo menos 1 dia de descanso entre eles.',
    'Pare cada série com 2–3 repetições sobrando: técnica primeiro, falha não é necessária.',
    'Quando fizer o topo da faixa de repetições em todas as séries, aumente a carga (2–5%).',
    'Descanso de 1 a 2 minutos. Amplitude completa em todos os exercícios.',
  ],
  int: [
    '3 a 4 treinos por semana, cada músculo pelo menos 2 vezes.',
    'Cerca de 10–15 séries por músculo na semana. Compostos pesados com 2–3 reps sobrando; isoladores podem chegar a 0–1.',
    'Descanso de 1,5 a 3 min nos compostos e 1 a 1,5 min nos isoladores.',
    'Anote as cargas: progredir carga ou repetições toda semana é o que faz evoluir.',
  ],
  ava: [
    '4 a 6 treinos por semana, cada músculo 2 vezes.',
    '12–20 séries por músculo na semana (acima de ~18–20 o ganho extra é pequeno).',
    'Priorize exercícios que alongam o músculo sob carga (mesa sentada, tríceps acima da cabeça, rosca inclinada, búlgaro).',
    'Organize em blocos de 4–8 semanas e faça uma semana mais leve quando o desempenho cair.',
  ],
};
const _F = (nome, series, repeticoes, descanso_seg, observacao) => ({
  nome,
  series,
  repeticoes,
  descanso_seg,
  observacao: observacao || null,
});
const BIB_FORCA = [
  /* ---------- HIPERTROFIA ---------- */
  {
    id: 'hip-ini',
    cat: 'hipertrofia',
    niv: 'ini',
    nome: 'Hipertrofia · Corpo inteiro',
    freq: '3x por semana, em sequência A → B → C',
    info: 'Corpo inteiro 3x por semana: cada músculo é treinado com frequência, que é o que mais rende para quem está começando. Faixa de 8–15 repetições, parando com 2–3 sobrando (ACSM 2026).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Corpo inteiro',
        itens: [
          _F('Agachamento goblet', 3, '10–12', 90, 'Desça até a coxa passar da paralela, coluna neutra.'),
          _F('Supino reto com halteres', 3, '10–12', 90, 'Desça até alongar o peito, 2–3 reps sobrando.'),
          _F('Puxada frontal pegada aberta', 3, '10–12', 90, 'Puxe até o queixo, sem jogar o tronco.'),
          _F('Stiff com halteres', 3, '10–12', 90, 'Quadril para trás, sinta alongar o posterior.'),
          _F('Desenvolvimento sentado com halteres', 2, '10–12', 75),
          _F('Mesa flexora sentada', 2, '12–15', 60, 'Sentada alonga mais o posterior e rende mais que a deitada.'),
          _F('Prancha', 3, '30 s', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Corpo inteiro',
        itens: [
          _F('Leg press', 3, '10–12', 90, 'Desça o máximo que conseguir sem tirar o quadril do banco.'),
          _F('Remada baixa no cabo', 3, '10–12', 90, 'Estique bem os braços na volta, alongando as costas.'),
          _F('Supino inclinado com halteres', 3, '10–12', 90),
          _F('Elevação pélvica com barra', 3, '10–12', 90, 'Segure 1 s em cima, apertando o glúteo.'),
          _F('Elevação lateral com halteres', 2, '12–15', 60),
          _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 60, 'Banco inclinado alonga o bíceps.'),
          _F('Tríceps francês no cabo com corda', 2, '10–12', 60, 'Braços acima da cabeça: cresce mais que o pulley.'),
          _F('Dead bug', 2, '8 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Corpo inteiro',
        itens: [
          _F(
            'Agachamento com afundo e pé elevado com halteres',
            3,
            '10 cada perna',
            90,
            'Búlgaro: comece só com o peso do corpo se precisar.',
          ),
          _F('Puxada frontal com pegada supinada', 3, '10–12', 90),
          _F('Supino reto na máquina', 3, '10–12', 90),
          _F('Levantamento terra romeno', 3, '10–12', 90, 'Barra perto das pernas, coluna neutra.'),
          _F('Remada unilateral com halter (serrote)', 2, '10–12 cada lado', 75),
          _F('Panturrilha em pé com halteres', 2, '12–15', 60, 'Pausa embaixo, com a panturrilha alongada.'),
          _F('Pallof press', 2, '10 cada lado', 45),
        ],
      },
    ],
  },
  {
    id: 'hip-int',
    cat: 'hipertrofia',
    niv: 'int',
    nome: 'Hipertrofia · Superior e inferior',
    freq: '4x por semana (Sup A, Inf A, Sup B, Inf B)',
    info: 'Divisão superior/inferior: cada músculo 2x por semana com 10–15 séries semanais. Compostos com 2–3 reps sobrando e isoladores mais perto da falha (Robinson 2024). Descanso maior que 60 s (Singer 2024).',
    treinos: [
      {
        titulo: 'Superior A',
        foco: 'Peito, costas e braços',
        itens: [
          _F('Supino reto com barra (pegada média)', 3, '6–10', 150, '2–3 reps sobrando.'),
          _F('Remada curvada com barra', 3, '8–10', 120),
          _F('Supino inclinado com halteres', 3, '8–12', 120),
          _F('Puxada frontal com pegada supinada', 3, '8–12', 90),
          _F('Elevação lateral sentada no cabo', 3, '12–15', 60, 'O cabo mantém tensão no começo do movimento.'),
          _F('Tríceps francês no cabo com corda', 3, '10–12', 60, 'Última série perto da falha.'),
          _F('Rosca alternada com halteres no banco inclinado', 3, '10–12', 60, 'Última série perto da falha.'),
        ],
      },
      {
        titulo: 'Inferior A',
        foco: 'Quadríceps e posterior',
        itens: [
          _F('Agachamento livre com barra', 3, '6–10', 180, 'Amplitude completa, 2–3 reps sobrando.'),
          _F('Levantamento terra romeno', 3, '8–10', 150, 'Desça até sentir o posterior bem alongado.'),
          _F(
            'Agachamento com afundo e pé elevado com halteres',
            3,
            '8–12 cada perna',
            90,
            'Búlgaro: ótimo para glúteo e quadríceps.',
          ),
          _F('Mesa flexora sentada', 3, '10–12', 75),
          _F('Cadeira extensora', 2, '12–15', 60),
          _F('Panturrilha em pé na máquina', 3, '10–15', 60, 'Pausa de 1–2 s embaixo, com a panturrilha alongada.'),
          _F('Abdominal no cabo com corda', 3, '10–12', 60),
        ],
      },
      {
        titulo: 'Superior B',
        foco: 'Ombros, costas e braços',
        itens: [
          _F('Desenvolvimento sentado com halteres', 3, '8–10', 120),
          _F('Barra fixa', 3, '6–10', 120, 'Use a assistida com elástico se ainda não fizer 6.'),
          _F('Supino reto na máquina', 3, '10–12', 90),
          _F('Remada unilateral com halter (serrote)', 3, '10–12 cada lado', 75),
          _F('Crucifixo na máquina (peck deck)', 2, '12–15', 60),
          _F('Face pull', 2, '12–15', 60, 'Ombro posterior e saúde do ombro.'),
          _F('Rosca martelo com halteres', 2, '10–12', 60),
          _F('Tríceps corda', 2, '10–12', 60),
        ],
      },
      {
        titulo: 'Inferior B',
        foco: 'Glúteo e posterior',
        itens: [
          _F('Leg press', 3, '10–12', 120),
          _F('Elevação pélvica com barra', 3, '8–12', 120),
          _F('Stiff com halteres', 3, '10–12', 90),
          _F('Avanço para trás com halteres', 3, '10 cada perna', 90),
          _F('Cadeira abdutora', 2, '15–20', 60),
          _F('Panturrilha sentado', 3, '12–15', 60),
          _F('Roda abdominal', 3, '8–10', 60),
        ],
      },
    ],
  },
  {
    id: 'hip-ava',
    cat: 'hipertrofia',
    niv: 'ava',
    nome: 'Hipertrofia · Empurrar, puxar e pernas',
    freq: '3 a 6x por semana (repita o ciclo)',
    info: 'Divisão empurrar/puxar/pernas. Feita 2x na semana, dá 12–20 séries por músculo, a faixa de mais ganho (ACSM 2026; Pelland). Usa exercícios com o músculo alongado sob carga (Maeo 2021/2022; Wolf 2023).',
    treinos: [
      {
        titulo: 'Empurrar',
        foco: 'Peito, ombros e tríceps',
        itens: [
          _F('Supino inclinado com halteres', 4, '6–10', 150, 'Desça fundo, alongando o peito.'),
          _F('Supino reto com barra (pegada média)', 3, '6–8', 150),
          _F('Desenvolvimento sentado com halteres', 3, '8–10', 120),
          _F('Paralelas para peito', 3, '8–12', 90, 'Tronco inclinado à frente; adicione peso quando passar de 12.'),
          _F('Elevação lateral sentada no cabo', 4, '12–20', 60, 'Última série até a falha.'),
          _F('Tríceps francês no cabo com corda', 3, '10–12', 75),
          _F('Tríceps corda', 2, '12–15', 60, 'Última série até a falha.'),
        ],
      },
      {
        titulo: 'Puxar',
        foco: 'Costas, ombro posterior e bíceps',
        itens: [
          _F('Barra fixa com peso', 4, '6–10', 150),
          _F('Remada cavalinho apoiada no peito', 3, '8–10', 120),
          _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75, 'Deixe o braço subir todo, alongando o dorsal.'),
          _F('Remada baixa no cabo', 3, '10–12', 90),
          _F('Crucifixo inverso na máquina (peck deck)', 3, '12–20', 60),
          _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 75),
          _F('Rosca martelo com halteres', 2, '10–12', 60, 'Última série até a falha.'),
        ],
      },
      {
        titulo: 'Pernas',
        foco: 'Quadríceps, posterior, glúteo e panturrilha',
        itens: [
          _F('Agachamento livre com barra', 4, '5–8', 180),
          _F('Levantamento terra romeno', 3, '6–10', 150),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8–10 cada perna', 120),
          _F('Mesa flexora sentada', 3, '8–12', 75),
          _F('Cadeira extensora', 3, '10–15', 75, 'Incline o tronco para trás para alongar o reto femoral.'),
          _F('Elevação pélvica com barra', 3, '8–12', 90),
          _F('Panturrilha em pé na máquina', 4, '8–12', 60, 'Pausa embaixo, alongada.'),
          _F('Elevação de pernas suspenso na barra', 3, '10–15', 60),
        ],
      },
    ],
  },

  /* ---------- EMAGRECIMENTO ---------- */
  {
    id: 'ema-ini',
    cat: 'emagrecimento',
    niv: 'ini',
    nome: 'Emagrecimento · Circuito corpo inteiro',
    freq: '3x por semana (A, B e C) + caminhada ou corrida leve',
    info: 'Circuito: faça um exercício atrás do outro com 30–45 s de pausa e descanse 2 min ao fim de cada volta. Só musculação já reduz ~1,4% de gordura (Wewege 2021); o melhor resultado vem de força + aeróbio + alimentação, preservando músculo.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Circuito corpo inteiro (3 voltas)',
        itens: [
          _F('Agachamento goblet', 3, '12', 40, 'Séries = voltas do circuito.'),
          _F('Flexão de braço inclinada', 3, '8–12', 40, 'Mãos no banco; quanto mais baixo, mais difícil.'),
          _F('Remada baixa no cabo', 3, '12', 40),
          _F('Ponte de glúteos', 3, '15', 40),
          _F('Desenvolvimento sentado com halteres', 3, '12', 40),
          _F('Bicicleta ergométrica', 3, '1 min', 40, 'Ritmo moderado a forte.'),
          _F('Prancha', 3, '30 s', 120, 'Ao fim da volta, descanse 2 min.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Circuito corpo inteiro (3 voltas)',
        itens: [
          _F('Leg press', 3, '12', 40),
          _F('Puxada frontal pegada aberta', 3, '12', 40),
          _F('Supino reto na máquina', 3, '12', 40),
          _F('Avanço para trás com halteres', 3, '10 cada perna', 40),
          _F('Remada unilateral com halter (serrote)', 3, '12 cada lado', 40),
          _F('Remo ergométrico', 3, '1 min', 40, 'Ritmo moderado a forte.'),
          _F('Dead bug', 3, '8 cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Circuito corpo inteiro (3 voltas)',
        itens: [
          _F('Subida no banco com halteres', 3, '10 cada perna', 40),
          _F('Supino reto com halteres', 3, '12', 40),
          _F('Puxada frontal com pegada supinada', 3, '12', 40),
          _F('Stiff com halteres', 3, '12', 40),
          _F('Elevação lateral com halteres', 3, '12–15', 40),
          _F('Bicicleta ergométrica', 3, '1 min', 40, 'Ritmo moderado a forte.'),
          _F('Prancha lateral', 3, '20–30 s cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
        ],
      },
    ],
  },
  {
    id: 'ema-int',
    cat: 'emagrecimento',
    niv: 'int',
    nome: 'Emagrecimento · Bi-séries + finalizador',
    freq: '3x por semana (A, B e C) + aeróbio',
    info: 'Bi-séries de músculos opostos: o treino fica mais denso e curto sem perder o estímulo de força. No fim, um finalizador intervalado. Carga desafiadora: no déficit calórico, o treino pesado é o que segura a massa muscular.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Bi-séries corpo inteiro',
        itens: [
          _F('Agachamento livre com barra', 4, '8–10', 30, 'Bi-série 1: faça e vá direto para a puxada.'),
          _F('Puxada frontal pegada aberta', 4, '10', 90, 'Fim da bi-série 1: descanse 90 s.'),
          _F('Levantamento terra romeno', 3, '10', 30, 'Bi-série 2.'),
          _F('Supino inclinado com halteres', 3, '10', 90),
          _F('Avanço com halteres', 3, '10 cada perna', 30, 'Bi-série 3.'),
          _F('Face pull', 3, '15', 90),
          _F('Kettlebell swing', 6, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s de pausa.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Bi-séries corpo inteiro',
        itens: [
          _F('Leg press', 4, '12', 30, 'Bi-série 1.'),
          _F('Supino reto com halteres', 4, '10', 90),
          _F('Elevação pélvica com barra', 3, '12', 30, 'Bi-série 2.'),
          _F('Remada baixa no cabo', 3, '12', 90),
          _F('Subida no banco com halteres', 3, '10 cada perna', 30, 'Bi-série 3.'),
          _F('Desenvolvimento sentado com halteres', 3, '12', 90),
          _F('Remo ergométrico', 8, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s leve.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Bi-séries corpo inteiro',
        itens: [
          _F('Agachamento com afundo e pé elevado com halteres', 3, '10 cada perna', 30, 'Bi-série 1.'),
          _F('Remada curvada com halteres', 3, '10', 90),
          _F('Levantamento terra com barra hexagonal', 3, '8', 30, 'Bi-série 2.'),
          _F('Flexão de braços', 3, '8–15', 90, 'Apoie os joelhos se precisar.'),
          _F('Mesa flexora sentada', 3, '12', 30, 'Bi-série 3.'),
          _F('Elevação lateral com halteres', 3, '15', 75),
          _F('Bicicleta ergométrica', 8, '20 s forte', 40, 'Finalizador: 20 s forte e 40 s leve.'),
        ],
      },
    ],
  },
  {
    id: 'ema-ava',
    cat: 'emagrecimento',
    niv: 'ava',
    nome: 'Emagrecimento · Força + condicionamento',
    freq: '3x por semana (A, B e C) + aeróbio',
    info: 'Junta treino pesado (para manter força e músculo no déficit) com condicionamento de alta intensidade. Avance só se a recuperação estiver boa: sono e alimentação mandam no resultado.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Pernas pesado + intervalado',
        itens: [
          _F('Agachamento livre com barra', 4, '5–6', 180, 'Pesado: 2 reps sobrando.'),
          _F('Levantamento terra romeno', 3, '6–8', 150),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 90),
          _F('Empurrar trenó', 6, '20 m', 60, 'Rápido e forte.'),
          _F('Corda naval', 6, '20 s', 40),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Superior em bi-séries',
        itens: [
          _F('Supino reto com barra (pegada média)', 4, '6–8', 30, 'Bi-série 1.'),
          _F('Barra fixa com peso', 4, '6–8', 120),
          _F('Desenvolvimento militar com barra em pé', 3, '8', 30, 'Bi-série 2.'),
          _F('Remada curvada com barra', 3, '8', 120),
          _F('Paralelas para peito', 3, '8–12', 75),
          _F('Burpee', 10, '6–8', 0, 'EMOM: 1 série no início de cada minuto, por 10 minutos.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Circuito metabólico (4 voltas)',
        itens: [
          _F('Thruster com kettlebells', 4, '10', 30, 'Séries = voltas.'),
          _F('Kettlebell swing', 4, '15', 30),
          _F('Remada renegada alternada', 4, '8 cada lado', 30),
          _F('Mountain climber', 4, '30 s', 30),
          _F('Remo ergométrico', 4, '250 m', 30),
          _F('Prancha lateral', 4, '30 s cada lado', 120, 'Ao fim da volta, descanse 2 min.'),
        ],
      },
    ],
  },

  /* ---------- FORÇA MÁXIMA ---------- */
  {
    id: 'for-ini',
    cat: 'forca',
    niv: 'ini',
    nome: 'Força · Base técnica',
    freq: '3x por semana, em sequência A → B → C',
    info: 'Progressão linear: mesmas séries de 5, subindo um pouco a carga a cada treino enquanto a técnica estiver perfeita. Força responde melhor a cargas altas (≥80% 1RM) e 2–3 séries (ACSM 2026). Falha não é necessária.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Agachamento e supino',
        itens: [
          _F('Agachamento livre com barra', 3, '5', 180, 'Suba 2,5–5 kg por treino enquanto a técnica estiver boa.'),
          _F('Supino reto com barra (pegada média)', 3, '5', 180, 'Suba 1–2,5 kg por treino.'),
          _F('Remada curvada com barra', 3, '6–8', 120),
          _F('Mesa flexora sentada', 2, '8–10', 90),
          _F('Prancha', 3, '30–45 s', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Levantamento terra e desenvolvimento',
        itens: [
          _F('Levantamento terra com barra hexagonal', 3, '5', 180, 'Mais fácil de aprender que o terra tradicional.'),
          _F('Desenvolvimento militar com barra em pé', 3, '5', 150),
          _F('Barra fixa assistida com elástico', 3, '5–8', 120, 'Diminua a ajuda do elástico com o tempo.'),
          _F('Agachamento goblet', 2, '8', 90, 'Treino de técnica do agachamento.'),
          _F('Pallof press', 3, '10 cada lado', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Agachamento e supino (variação)',
        itens: [
          _F('Agachamento livre com barra', 3, '5', 180, 'Mesma progressão do Treino A.'),
          _F('Supino inclinado com halteres', 3, '6–8', 150),
          _F('Remada unilateral com halter (serrote)', 3, '6–8 cada lado', 120),
          _F('Levantamento terra romeno', 2, '6–8', 150, 'Reforça o posterior para o terra.'),
          _F('Prancha lateral', 3, '30 s cada lado', 60),
        ],
      },
    ],
  },
  {
    id: 'for-int',
    cat: 'forca',
    niv: 'int',
    nome: 'Força · Pesado por movimento',
    freq: '3 a 4x por semana (A, B e C)',
    info: 'Cada treino tem um levantamento principal pesado (80–88% 1RM, 4–6 reps, 2–3 sobrando) e acessórios para os pontos fracos. Descanso longo (3–4 min) nos principais para manter a carga alta.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Agachamento',
        itens: [
          _F('Agachamento livre com barra', 4, '4–6', 210, '80–85% 1RM.'),
          _F('Levantamento terra romeno', 3, '6', 150),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '6–8 cada perna', 90),
          _F('Elevação pélvica com barra', 3, '6–8', 120),
          _F('Roda abdominal', 3, '8', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Supino e barra fixa',
        itens: [
          _F('Supino reto com barra (pegada média)', 4, '4–6', 210, '80–85% 1RM.'),
          _F('Barra fixa com peso', 4, '4–6', 150),
          _F('Desenvolvimento militar com barra em pé', 3, '5–6', 150),
          _F('Remada curvada com barra', 3, '6', 120),
          _F('Supino fechado com barra', 3, '6–8', 120),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Levantamento terra',
        itens: [
          _F('Levantamento terra com barra', 4, '3–5', 240, '80–88% 1RM. Pare se a lombar arredondar.'),
          _F('Agachamento frontal com barra', 3, '5', 180),
          _F('Mesa flexora sentada', 3, '8', 90),
          _F('Panturrilha em pé na máquina', 3, '8', 75),
          _F('Prancha lateral', 3, '30 s cada lado', 60),
        ],
      },
    ],
  },
  {
    id: 'for-ava',
    cat: 'forca',
    niv: 'ava',
    nome: 'Força · Ondulado (pesado, volume e velocidade)',
    freq: '3x por semana (A, B e C)',
    info: 'Periodização ondulada: um dia pesado (85–90%), um de volume (75–80%) e um de velocidade (60–70% movidos o mais rápido possível). A velocidade na subida é o que mais transfere para potência (ACSM 2026).',
    treinos: [
      {
        titulo: 'Pesado',
        foco: 'Cargas de 85–90% 1RM',
        itens: [
          _F('Agachamento livre com barra', 5, '3', 240, '85–90% 1RM, 1–2 reps sobrando.'),
          _F('Supino reto com barra (pegada média)', 5, '3', 240, '85–90% 1RM.'),
          _F('Remada curvada com barra', 4, '5', 150),
          _F('Glute-ham raise no chão', 3, '4–6', 120, 'Flexão nórdica: desça devagar.'),
        ],
      },
      {
        titulo: 'Volume',
        foco: 'Cargas de 75–80% 1RM',
        itens: [
          _F('Levantamento terra com barra', 4, '4', 210, '75–80% 1RM, técnica perfeita.'),
          _F('Supino inclinado com halteres', 4, '6', 150),
          _F('Barra fixa com peso', 4, '6', 150),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 120),
          _F('Desenvolvimento militar com barra em pé', 3, '6', 150),
        ],
      },
      {
        titulo: 'Velocidade',
        foco: 'Cargas de 60–70% 1RM, subida explosiva',
        itens: [
          _F('Power clean', 6, '2', 120, 'Técnica antes de carga.'),
          _F('Agachamento livre com barra', 6, '2', 90, '60–70% 1RM, suba o mais rápido possível.'),
          _F('Supino reto com barra (pegada média)', 6, '3', 90, '60–70% 1RM, suba o mais rápido possível.'),
          _F('Salto frontal na caixa', 4, '3', 90, 'Desça do caixote andando.'),
        ],
      },
    ],
  },

  /* ---------- FORÇA PARA CORREDORES ---------- */
  {
    id: 'cor-ini',
    cat: 'corredor',
    niv: 'ini',
    nome: 'Corredor · Força e prevenção',
    freq: '2x por semana em rodízio A → B → C, longe dos treinos fortes de corrida',
    info: 'Base de força para correr: unilaterais, glúteo, posterior e panturrilha (a cada passada o chão devolve 2 a 3 vezes o peso do corpo, e a panturrilha é o músculo que mais trabalha). Treino de força reduz lesões esportivas para menos de 1/3 (Lauersen 2014).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Pernas e core',
        itens: [
          _F('Agachamento goblet', 3, '8–10', 90),
          _F('Avanço para trás com halteres', 3, '8 cada perna', 75),
          _F('Ponte de glúteos unilateral', 3, '10 cada perna', 60),
          _F('Panturrilha em pé com halteres', 3, '12–15', 60, 'Desça devagar (3 s) e pause embaixo.'),
          _F('Stiff com halteres', 3, '10', 75),
          _F('Prancha lateral', 3, '30 s cada lado', 45),
          _F('Dead bug', 3, '8 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Unilateral e estabilidade',
        itens: [
          _F('Subida no banco com halteres', 3, '8 cada perna', 75, 'Suba empurrando com a perna de cima.'),
          _F('Levantamento terra unilateral com kettlebell', 3, '8 cada perna', 75, 'Equilíbrio e posterior.'),
          _F('Panturrilha sentado', 3, '15', 60, 'Sóleo: muito exigido na corrida.'),
          _F(
            'Monster walk (caminhada com elástico)',
            2,
            '12 passos cada lado',
            45,
            'Glúteo médio: estabiliza o joelho.',
          ),
          _F('Glute-ham raise no chão', 2, '4–6', 90, 'Flexão nórdica: protege o posterior.'),
          _F('Bird dog', 3, '8 cada lado', 45),
          _F('Pallof press', 2, '10 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Posterior, pé e quadril',
        itens: [
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 75),
          _F('Levantamento terra romeno', 3, '8', 90),
          _F('Panturrilha em pé com halteres', 3, '12 cada perna', 60, 'Uma perna por vez, descida em 3 s.'),
          _F('Abdução de quadril com elástico', 2, '15 cada lado', 45),
          _F('Elevação pélvica com barra', 3, '10', 75),
          _F('Prancha', 3, '40 s', 45),
        ],
      },
    ],
  },
  {
    id: 'cor-int',
    cat: 'corredor',
    niv: 'int',
    nome: 'Corredor · Força pesada + saltos',
    freq: '2x por semana em rodízio A → B → C',
    info: 'Força pesada (≥80% 1RM, poucas repetições) e pliometria melhoram a economia de corrida; a combinação dos dois teve o maior efeito, mas com evidência ainda fraca (Llanos-Lagos 2024). Cargas altas com poucas repetições quase não aumentam o peso do corpo.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Agachamento pesado + saltos',
        itens: [
          _F('Salto na caixa (múltiplas repetições)', 3, '5', 90, 'Antes da força, com as pernas descansadas.'),
          _F('Agachamento livre com barra', 4, '4–6', 180, '≥80% 1RM, 2–3 reps sobrando.'),
          _F('Levantamento terra romeno', 3, '6', 150),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 90),
          _F('Panturrilha em pé na máquina', 4, '8', 75, 'Pesada.'),
          _F('Prancha', 3, '45 s', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Terra + reatividade',
        itens: [
          _F('Saltos laterais sobre cones', 3, '10', 75, 'Contato curto com o chão.'),
          _F('Skipping rápido', 4, '15 s', 45),
          _F('Levantamento terra com barra hexagonal', 4, '4–6', 180, '≥80% 1RM.'),
          _F('Subida no banco com halteres', 3, '6 cada perna', 90, 'Pesado.'),
          _F('Glute-ham raise no chão', 3, '5', 90),
          _F('Panturrilha sentado', 3, '10', 60),
          _F('Pallof press', 3, '10 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Unilateral pesado + elasticidade',
        itens: [
          _F('Saltito unilateral com calcanhar ao glúteo', 3, '10 cada perna', 60, 'Contato rápido com o chão.'),
          _F('Agachamento com afundo e pé elevado com halteres', 4, '5 cada perna', 120, 'Pesado.'),
          _F('Levantamento terra unilateral com kettlebell', 3, '6 cada perna', 90),
          _F('Elevação pélvica com barra', 3, '6', 120, 'Pesada.'),
          _F('Panturrilha em pé na máquina', 4, '8', 75),
          _F('Prancha lateral', 3, '30 s cada lado', 45),
        ],
      },
    ],
  },
  {
    id: 'cor-ava',
    cat: 'corredor',
    niv: 'ava',
    nome: 'Corredor · Força máxima + pliometria',
    freq: '2x por semana em rodízio A → B → C (1x na semana de prova)',
    info: 'Método de contraste: exercício pesado seguido de salto. É a combinação que mais melhorou a economia de corrida (Llanos-Lagos 2024), com efeito maior em quem corre mais rápido. Nunca na véspera de treino forte.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Contraste agachamento + salto',
        itens: [
          _F('Agachamento livre com barra', 4, '3–5', 150, '85–90% 1RM. Logo depois, faça o salto.'),
          _F('Salto frontal na caixa', 4, '3', 150, 'Contraste: 30 s depois do agachamento.'),
          _F('Levantamento terra romeno', 3, '5', 150),
          _F('Salto em profundidade linear', 3, '5', 120, 'Caia e saia do chão o mais rápido possível.'),
          _F('Panturrilha em pé na máquina', 4, '6', 75, 'Bem pesada.'),
          _F('Roda abdominal', 3, '8', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Contraste terra + saltos horizontais',
        itens: [
          _F('Levantamento terra com barra hexagonal', 4, '3', 180, '85–90% 1RM.'),
          _F('Salto lateral alternado (bound)', 4, '6', 120, 'Contraste: depois do terra.'),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '5 cada perna', 120, 'Pesado.'),
          _F('Saltos sobre barreiras', 4, '6', 90),
          _F('Glute-ham raise no chão', 3, '5', 90),
          _F('Panturrilha sentado', 3, '8', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Potência e reatividade',
        itens: [
          _F('Power clean', 5, '2', 120, 'Técnica antes de carga.'),
          _F('Salto em profundidade linear', 4, '4', 120),
          _F('Elevação pélvica com barra', 4, '4–5', 150, 'Pesada.'),
          _F('Salto com afundo alternado', 3, '6 cada perna', 90),
          _F('Panturrilha em pé na máquina', 4, '6', 75, 'Bem pesada.'),
          _F('Pallof press', 3, '10 cada lado', 45),
        ],
      },
    ],
  },

  /* ---------- SAÚDE E LONGEVIDADE ---------- */
  {
    id: 'sau-ini',
    cat: 'saude',
    niv: 'ini',
    nome: 'Saúde · Primeiros passos',
    freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem está começando ou voltando: máquinas e movimentos simples, 2 séries, longe da falha. 2 treinos por semana já trazem ganho real de força e função, e o treino de força está ligado a 10–17% menos risco de morte por todas as causas.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Máquinas, corpo inteiro',
        itens: [
          _F('Leg press', 2, '10–12', 90),
          _F('Supino reto na máquina', 2, '10–12', 90),
          _F('Puxada frontal pegada aberta', 2, '10–12', 90),
          _F('Mesa flexora sentada', 2, '10–12', 75),
          _F('Remada baixa no cabo', 2, '10–12', 75),
          _F('Panturrilha sentado', 2, '12–15', 60),
          _F('Bird dog', 2, '8 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Movimentos do dia a dia',
        itens: [
          _F('Agachamento com halteres até o banco', 2, '10', 90, 'Sentar e levantar com controle.'),
          _F('Flexão de braço inclinada', 2, '8–10', 75),
          _F('Remada unilateral com halter (serrote)', 2, '10 cada lado', 75),
          _F('Ponte de glúteos', 2, '12', 60),
          _F('Subida no banco com halteres', 2, '8 cada perna', 75, 'Equilíbrio: segure em algo se precisar.'),
          _F('Panturrilha em pé com halteres', 2, '12', 60),
          _F('Pallof press', 2, '10 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Máquinas e equilíbrio',
        itens: [
          _F('Cadeira extensora', 2, '10–12', 75),
          _F('Desenvolvimento de ombros na máquina', 2, '10–12', 75),
          _F('Remada baixa no cabo', 2, '10–12', 75),
          _F('Mesa flexora sentada', 2, '10–12', 75),
          _F('Supino reto na máquina', 2, '10–12', 75),
          _F('Panturrilha sentado', 2, '12–15', 60),
          _F('Prancha', 2, '20–30 s', 45),
        ],
      },
    ],
  },
  {
    id: 'sau-int',
    cat: 'saude',
    niv: 'int',
    nome: 'Saúde · Força e potência',
    freq: '2 a 3x por semana (A, B e C)',
    info: 'Subir o peso o mais rápido possível (descer com controle) melhora velocidade de marcha, equilíbrio e subir escadas: é a recomendação mais forte para função (ACSM 2026). Mantenha 2–3 reps sobrando.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Força com subida rápida',
        itens: [
          _F('Agachamento goblet', 3, '8', 90, 'Suba rápido, desça em 2–3 s.'),
          _F('Supino reto com halteres', 3, '8', 90, 'Suba rápido.'),
          _F('Remada baixa no cabo', 3, '10', 75),
          _F('Levantamento terra romeno', 3, '8', 90),
          _F('Arremesso de peito com bola (múltiplas repetições)', 3, '6', 60, 'Potência.'),
          _F('Prancha lateral', 2, '30 s cada lado', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Potência e equilíbrio',
        itens: [
          _F('Leg press', 3, '8', 90, 'Empurre rápido, volte devagar.'),
          _F('Desenvolvimento sentado com halteres', 3, '8', 90),
          _F('Puxada frontal pegada aberta', 3, '10', 75),
          _F('Avanço para trás com halteres', 3, '8 cada perna', 75),
          _F('Arremesso de medicine ball no chão', 3, '6', 60),
          _F('Panturrilha em pé com halteres', 3, '12', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Força e carregamento',
        itens: [
          _F('Levantamento terra com barra hexagonal', 3, '6', 120, 'Suba rápido, desça com controle.'),
          _F('Flexão de braços', 3, '6–12', 75, 'Mãos num banco se precisar.'),
          _F('Remada unilateral com halter (serrote)', 3, '10 cada lado', 75),
          _F('Subida no banco com halteres', 3, '8 cada perna', 75, 'Suba rápido.'),
          _F('Kettlebell swing', 3, '10', 60),
          _F('Pallof press', 3, '10 cada lado', 45),
        ],
      },
    ],
  },
  {
    id: 'sau-ava',
    cat: 'saude',
    niv: 'ava',
    nome: 'Saúde · Força total e potência',
    freq: '3x por semana (A, B e C)',
    info: 'Para quem já treina há tempo e quer força, potência e independência física a longo prazo: levantamentos básicos, exercícios explosivos e carregamentos. Falha não é necessária, principalmente depois dos 60 anos.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Força e potência',
        itens: [
          _F('Agachamento livre com barra', 4, '5', 180),
          _F('Push press com barra', 4, '3', 120, 'Impulso das pernas, barra rápida.'),
          _F('Levantamento terra com barra hexagonal', 3, '5', 180),
          _F('Barra fixa', 3, '5–8', 120),
          _F('Kettlebell swing', 4, '10', 60, 'Quadril explosivo.'),
          _F(
            'Turkish get-up com kettlebell (estilo agachamento)',
            2,
            '2 cada lado',
            60,
            'Mobilidade e controle do corpo todo.',
          ),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Potência e unilateral',
        itens: [
          _F('Agachamento com salto e carga', 4, '4', 90, 'Carga leve, salto máximo.'),
          _F('Supino reto com halteres', 3, '6', 120),
          _F('Remada curvada com halteres', 3, '8', 90),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 90),
          _F('Arremesso de peito com bola (múltiplas repetições)', 4, '5', 60),
          _F('Pallof press', 3, '10 cada lado', 45),
          _F('Panturrilha em pé com halteres', 3, '10', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Força pesada e core',
        itens: [
          _F('Agachamento frontal com barra', 4, '5', 180),
          _F('Desenvolvimento militar com barra em pé', 3, '5', 150),
          _F('Levantamento terra romeno', 3, '6', 150),
          _F('Barra fixa com peso', 3, '5', 150),
          _F('Salto frontal na caixa', 3, '3', 90),
          _F('Roda abdominal', 3, '8', 60),
        ],
      },
    ],
  },
  /* ---------- EM CASA ---------- */
  {
    id: 'casa-ini',
    cat: 'casa',
    niv: 'ini',
    nome: 'Em casa · Peso do corpo',
    freq: '3x por semana (A, B e C)',
    info: 'Sem academia: peso do corpo, uma cadeira firme e, se tiver, um elástico. Elásticos e peso do corpo dão ganhos de força e massa parecidos com os do treino convencional quando a série é feita perto da falha (ACSM 2026).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Corpo inteiro',
        itens: [
          _F('Agachamento livre com peso do corpo', 3, '12–20', 60, 'Desça devagar (3 s).'),
          _F('Flexão de braço inclinada', 3, '8–15', 60, 'Mãos na cadeira ou na mesa.'),
          _F('Ponte de glúteos', 3, '15–20', 45, 'Segure 2 s em cima.'),
          _F('Abertura com elástico (pull apart)', 3, '15', 45),
          _F('Superman', 2, '10', 45),
          _F('Prancha', 3, '30 s', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Corpo inteiro',
        itens: [
          _F('Avanço para trás com halteres', 3, '10 cada perna', 60, 'Sem halteres, use mochila com livros.'),
          _F('Mergulho no banco', 3, '8–12', 60, 'Use uma cadeira firme.'),
          _F('Elevação pélvica com elástico', 3, '15', 45),
          _F('Desenvolvimento de ombros com elástico', 3, '12', 45),
          _F('Dead bug', 3, '8 cada lado', 45),
          _F('Polichinelo', 3, '30 s', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Corpo inteiro',
        itens: [
          _F('Subida no banco com elevação de joelho', 3, '10 cada perna', 60, 'Degrau ou cadeira baixa.'),
          _F('Flexão de braços', 3, 'máximo com boa técnica', 75, 'Joelhos no chão se precisar.'),
          _F('Ponte de glúteos unilateral', 3, '10 cada perna', 45),
          _F('Crucifixo inverso com elástico', 3, '15', 45),
          _F('Bird dog', 3, '8 cada lado', 45),
          _F('Prancha lateral', 2, '20–30 s cada lado', 45),
        ],
      },
    ],
  },
  {
    id: 'casa-int',
    cat: 'casa',
    niv: 'int',
    nome: 'Em casa · Elásticos e halteres',
    freq: '3 a 4x por semana (A, B e C)',
    info: 'Com um par de halteres (ou galões de água) e elásticos dá para treinar todo o corpo com carga. Quando ficar fácil, use mais repetições, desça mais devagar ou faça uma perna por vez: o importante é a série terminar perto da falha.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Pernas e empurrar',
        itens: [
          _F('Agachamento goblet', 4, '10–15', 75, 'Desça em 3 s.'),
          _F('Supino reto com halteres', 3, '10–15', 75, 'No chão ou num banco.'),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '10 cada perna', 75, 'Pé de trás no sofá.'),
          _F('Desenvolvimento sentado com halteres', 3, '10–12', 60),
          _F('Tríceps francês sentado com halter', 3, '10–12', 60),
          _F('Prancha', 3, '45 s', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Puxar e posterior',
        itens: [
          _F('Stiff com halteres', 4, '10–12', 75),
          _F('Remada curvada com halteres', 3, '10–12', 75),
          _F('Remada unilateral com halter (serrote)', 3, '10–12 cada lado', 60),
          _F('Elevação pélvica com elástico', 3, '15', 60),
          _F('Rosca alternada com halteres no banco inclinado', 3, '10–12', 60, 'Encostado num sofá reclinado.'),
          _F('Dead bug', 3, '8 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Corpo inteiro',
        itens: [
          _F('Subida no banco com halteres', 3, '10 cada perna', 75),
          _F('Flexão de braços', 3, 'máximo − 2', 75),
          _F('Agachamento com elástico (alças)', 3, '15', 60),
          _F('Crucifixo inverso com elástico', 3, '15', 45),
          _F('Elevação lateral com elástico', 3, '15', 45),
          _F('Rosca martelo com halteres', 2, '12', 45),
          _F('Kettlebell swing', 4, '15', 45, 'Um halter segurado pelas duas mãos funciona.'),
        ],
      },
    ],
  },
  {
    id: 'casa-ava',
    cat: 'casa',
    niv: 'ava',
    nome: 'Em casa · Calistenia avançada',
    freq: '4x por semana (A, B, C e repete)',
    info: 'Peso do corpo em variações difíceis: unilaterais, excêntricas lentas e saltos. Precisa de uma barra fixa. Progrida trocando para a variação mais difícil quando passar de ~15 repetições.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Empurrar e pernas',
        itens: [
          _F('Flexão de braços com pés elevados', 4, '8–15', 90),
          _F(
            'Agachamento unilateral no caixote alto',
            4,
            '6–10 cada perna',
            90,
            'Desça até sentar no caixote, em 3 s.',
          ),
          _F('Paralelas para tríceps', 3, '8–12', 90, 'Entre duas cadeiras firmes.'),
          _F('Flexão de braço em parada de mão', 3, '3–8', 120, 'Contra a parede; comece com pike.'),
          _F('Salto com afundo alternado', 3, '8 cada perna', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Puxar e posterior',
        itens: [
          _F('Barra fixa', 4, '6–12', 120, 'Desça em 3 s.'),
          _F('Glute-ham raise natural', 3, '4–6', 120, 'Flexão nórdica com os pés presos no sofá.'),
          _F('Barra fixa supinada', 3, '6–10', 90),
          _F('Ponte de glúteos unilateral', 3, '12–15 cada perna', 60, 'Ombros no sofá.'),
          _F('Elevação de pernas suspenso na barra', 3, '8–12', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Potência e core',
        itens: [
          _F('Flexão pliométrica', 4, '5', 90),
          _F('Agachamento com salto sem peso', 4, '6', 90, 'Salto máximo, aterrisse macio.'),
          _F('Flexão de braço unilateral', 3, '3–6 cada lado', 90, 'Mão num banco para facilitar.'),
          _F('Burpee', 4, '10', 60),
          _F('Rastejar de aranha', 3, '10 m', 45),
          _F('Prancha lateral', 3, '45 s cada lado', 45),
        ],
      },
    ],
  },

  /* ---------- GLÚTEOS E PERNAS ---------- */
  {
    id: 'glu-ini',
    cat: 'gluteo',
    niv: 'ini',
    nome: 'Glúteos e pernas · Base',
    freq: '3x por semana (A, B e C)',
    info: 'Foco em glúteos e pernas, com o resto do corpo em menor volume. Elevação pélvica e agachamento crescem o glúteo de forma parecida; o agachamento ainda trabalha mais a coxa (Plotkin 2023), por isso os dois entram.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Glúteo e quadríceps',
        itens: [
          _F('Agachamento goblet', 3, '10–12', 90),
          _F('Elevação pélvica com barra', 3, '10–12', 90, 'Segure 1 s em cima.'),
          _F('Cadeira abdutora', 3, '15', 60),
          _F('Leg press', 3, '12', 90, 'Pés mais altos na plataforma pegam mais glúteo.'),
          _F('Puxada frontal pegada aberta', 2, '12', 75),
          _F('Prancha', 3, '30 s', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Glúteo e posterior',
        itens: [
          _F('Stiff com halteres', 3, '10–12', 90),
          _F('Ponte de glúteos unilateral', 3, '10 cada perna', 60),
          _F('Mesa flexora sentada', 3, '12', 75),
          _F('Avanço para trás com halteres', 3, '10 cada perna', 75),
          _F('Supino reto com halteres', 2, '12', 75),
          _F('Panturrilha em pé com halteres', 2, '15', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Glúteo médio e unilateral',
        itens: [
          _F('Subida no banco com halteres', 3, '10 cada perna', 75),
          _F('Monster walk (caminhada com elástico)', 3, '12 passos cada lado', 45),
          _F('Coice no cabo unilateral', 3, '12 cada perna', 60),
          _F('Agachamento plié com halter', 3, '12', 75, 'Pés afastados, desça fundo.'),
          _F('Remada baixa no cabo', 2, '12', 75),
          _F('Dead bug', 3, '8 cada lado', 45),
        ],
      },
    ],
  },
  {
    id: 'glu-int',
    cat: 'gluteo',
    niv: 'int',
    nome: 'Glúteos e pernas · Volume',
    freq: '3 a 4x por semana (A, B e C)',
    info: 'Cerca de 12–16 séries de glúteo na semana, com cargas mais altas nos compostos e mais repetições nos isoladores. Os exercícios com o quadril bem flexionado (búlgaro, stiff, agachamento fundo) alongam o glúteo sob carga.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Agachamento e glúteo',
        itens: [
          _F('Agachamento livre com barra', 4, '6–10', 150, 'Fundo, até onde a técnica permitir.'),
          _F('Elevação pélvica com barra', 4, '8–12', 120),
          _F(
            'Agachamento com afundo e pé elevado com halteres',
            3,
            '8–10 cada perna',
            90,
            'Tronco levemente inclinado à frente.',
          ),
          _F('Cadeira abdutora', 3, '15–20', 60, 'Tronco inclinado à frente pega mais glúteo.'),
          _F('Elevação de pernas suspenso na barra', 3, '10–12', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Posterior e glúteo',
        itens: [
          _F('Levantamento terra romeno', 4, '6–10', 150),
          _F('Mesa flexora sentada', 3, '10–12', 75),
          _F('Extensão lombar no banco', 3, '12–15', 60, 'Costas arredondadas e foco em apertar o glúteo.'),
          _F('Pull through no cabo', 3, '12–15', 60),
          _F('Puxada frontal pegada aberta', 3, '10–12', 75),
          _F('Desenvolvimento sentado com halteres', 2, '10–12', 75),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Unilateral e quadríceps',
        itens: [
          _F('Leg press', 4, '10–12', 120, 'Pés altos e afastados.'),
          _F('Avanço com halteres', 3, '10 cada perna', 90, 'Passo longo.'),
          _F('Ponte de glúteos com barra', 3, '12–15', 75),
          _F('Coice no cabo unilateral', 3, '12 cada perna', 60),
          _F('Cadeira extensora', 2, '12–15', 60),
          _F('Panturrilha sentado', 3, '12–15', 60),
        ],
      },
    ],
  },
  {
    id: 'glu-ava',
    cat: 'gluteo',
    niv: 'ava',
    nome: 'Glúteos e pernas · Avançado',
    freq: '4x por semana (A, B, C e repete A)',
    info: 'Volume alto de glúteo (16–20 séries na semana) distribuído em vários dias, com progressão de carga nos compostos e isoladores perto da falha. Acima de ~20 séries o ganho extra é pequeno (ACSM 2026).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Pesado: agachamento e elevação pélvica',
        itens: [
          _F('Agachamento livre com barra', 4, '5–8', 180),
          _F('Elevação pélvica com barra', 4, '6–10', 150, 'Pesada, pausa de 1 s em cima.'),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 120),
          _F('Cadeira abdutora', 3, '15–20', 60, 'Última série até a falha.'),
          _F('Panturrilha em pé na máquina', 3, '10–12', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Pesado: terra e posterior',
        itens: [
          _F('Levantamento terra sumô', 4, '4–6', 180),
          _F('Levantamento terra romeno', 3, '8', 150),
          _F('Mesa flexora sentada', 3, '8–12', 75),
          _F('Extensão reversa de quadril', 3, '12–15', 75),
          _F('Barra fixa', 3, '6–10', 120),
          _F('Roda abdominal', 3, '8–10', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Volume: unilateral e isoladores',
        itens: [
          _F('Leg press', 4, '10–15', 120, 'Pés altos e afastados.'),
          _F('Subida no banco com halteres', 3, '8–10 cada perna', 90, 'Banco alto.'),
          _F('Ponte de glúteos com barra', 3, '15–20', 75),
          _F('Coice no cabo unilateral', 3, '12–15 cada perna', 45),
          _F('Pull through no cabo', 3, '15', 60),
          _F('Desenvolvimento sentado com halteres', 3, '10–12', 75),
        ],
      },
    ],
  },

  /* ---------- MAIS HIPERTROFIA, SAÚDE E CORREDORES ---------- */
  {
    id: 'hip-abc',
    cat: 'hipertrofia',
    niv: 'int',
    nome: 'Hipertrofia · ABC clássico',
    freq: '6x por semana (ABC 2 vezes) ou 3x',
    info: 'Divisão ABC por grupos musculares. Feita 2 vezes na semana (ABCABC), cada músculo é treinado 2x, o que é melhor que 1x. Feita só 3x na semana, cada músculo fica com 1x: aí aumente o número de séries de cada treino.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Peito, ombros e tríceps',
        itens: [
          _F('Supino reto com barra (pegada média)', 4, '6–10', 150),
          _F('Supino inclinado com halteres', 3, '8–12', 120),
          _F('Crucifixo na máquina (peck deck)', 3, '12–15', 60),
          _F('Desenvolvimento sentado com halteres', 3, '8–12', 90),
          _F('Elevação lateral com halteres', 4, '12–20', 60),
          _F('Tríceps francês no cabo com corda', 3, '10–12', 60),
          _F('Tríceps corda', 2, '12–15', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Costas, ombro posterior e bíceps',
        itens: [
          _F('Barra fixa', 4, '6–10', 120),
          _F('Remada curvada com barra', 3, '8–10', 120),
          _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75),
          _F('Remada baixa no cabo', 3, '10–12', 90),
          _F('Face pull', 3, '15', 60),
          _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 60),
          _F('Rosca martelo com halteres', 2, '10–12', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Pernas completas',
        itens: [
          _F('Agachamento livre com barra', 4, '6–10', 180),
          _F('Leg press', 3, '10–12', 120),
          _F('Levantamento terra romeno', 3, '8–10', 150),
          _F('Mesa flexora sentada', 3, '10–12', 75),
          _F('Cadeira extensora', 3, '12–15', 60),
          _F('Elevação pélvica com barra', 3, '8–12', 90),
          _F('Panturrilha em pé na máquina', 4, '10–15', 60),
        ],
      },
    ],
  },
  {
    id: 'sau-60',
    cat: 'saude',
    niv: 'ini',
    nome: 'Saúde · 60+ equilíbrio e prevenção de quedas',
    freq: '2 a 3x por semana (A, B e C)',
    info: 'Força de pernas, equilíbrio e potência para levantar, subir escadas e evitar quedas. Os estudos com mais de 11 mil idosos mostram que o treino de força é seguro; evite ir até a falha e faça a subida rápida, com a descida controlada (ACSM 2026).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Levantar e sentar',
        itens: [
          _F('Agachamento com halteres até o banco', 2, '8–10', 90, 'Levante rápido, sente devagar.'),
          _F('Supino reto na máquina', 2, '10', 75),
          _F('Remada baixa no cabo', 2, '10', 75),
          _F('Panturrilha em pé com halteres', 2, '12', 60, 'Segure em algo firme.'),
          _F('Prancha de equilíbrio', 2, '20–30 s', 45, 'Perto de uma parede ou apoio.'),
          _F('Bird dog', 2, '6 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Degraus e marcha',
        itens: [
          _F('Subida no banco com halteres', 2, '8 cada perna', 75, 'Degrau baixo, com apoio para a mão.'),
          _F('Leg press', 2, '10', 90, 'Empurre rápido, volte devagar.'),
          _F('Puxada frontal pegada aberta', 2, '10', 75),
          _F('Elevação lateral de perna em pé', 2, '10 cada perna', 45, 'Apoiado na cadeira.'),
          _F('Mesa flexora sentada', 2, '10', 75),
          _F('Pallof press', 2, '8 cada lado', 45),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Força geral',
        itens: [
          _F('Cadeira extensora', 2, '10–12', 75),
          _F('Desenvolvimento de ombros na máquina', 2, '10', 75),
          _F('Ponte de glúteos', 2, '12', 60),
          _F('Flexão de braço inclinada', 2, '8–10', 60, 'Mãos na parede ou na mesa.'),
          _F('Avanço para trás com halteres', 2, '6 cada perna', 75, 'Sem halteres e com apoio no começo.'),
          _F('Prancha', 2, '20 s', 45),
        ],
      },
    ],
  },
  {
    id: 'cor-manut',
    cat: 'corredor',
    niv: 'int',
    nome: 'Corredor · Manutenção em fase de provas',
    freq: '1x por semana, em rodízio A → B → C',
    info: 'Na fase de provas, 1 sessão curta e pesada por semana costuma manter a força ganha na preparação; a cada 2 semanas já se perde força e velocidade (Rønnestad 2011, com atletas). Faça pelo menos 48 h antes de treino forte ou prova.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Agachamento pesado',
        itens: [
          _F('Salto frontal na caixa', 3, '3', 90),
          _F('Agachamento livre com barra', 3, '3–5', 180, '≥80% 1RM, 2–3 reps sobrando.'),
          _F('Panturrilha em pé na máquina', 3, '6–8', 75),
          _F('Prancha lateral', 2, '30 s cada lado', 45),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Terra pesado',
        itens: [
          _F('Skipping rápido', 3, '15 s', 45),
          _F('Levantamento terra com barra hexagonal', 3, '3–5', 180, '≥80% 1RM.'),
          _F('Glute-ham raise no chão', 2, '4–5', 90),
          _F('Panturrilha sentado', 3, '8', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Unilateral pesado',
        itens: [
          _F('Saltos laterais sobre cones', 3, '8', 60),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '4–6 cada perna', 120, 'Pesado.'),
          _F('Elevação pélvica com barra', 3, '5', 120),
          _F('Pallof press', 2, '10 cada lado', 45),
        ],
      },
    ],
  },

  /* ---------- TREINO RÁPIDO ---------- */
  {
    id: 'rap-ini',
    cat: 'rapido',
    niv: 'ini',
    nome: 'Treino rápido · 30 minutos',
    freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem tem pouco tempo: exercícios multiarticulares em bi-séries, aquecimento só com séries leves do primeiro exercício e sem alongamento antes. Mínimo de 4 séries por músculo na semana, com 6–15 repetições perto da falha, já traz resultado (Iversen 2021).',
    treinos: [
      {
        titulo: 'Treino A',
        foco: '30 min · corpo inteiro',
        itens: [
          _F('Agachamento goblet', 3, '8–12', 30, 'Bi-série 1. Aqueça com 1 série leve.'),
          _F('Puxada frontal pegada aberta', 3, '8–12', 75, 'Fim da bi-série 1.'),
          _F('Supino reto com halteres', 3, '8–12', 30, 'Bi-série 2.'),
          _F('Levantamento terra romeno', 3, '8–12', 75, 'Fim da bi-série 2.'),
          _F('Prancha', 2, '40 s', 30),
        ],
      },
      {
        titulo: 'Treino B',
        foco: '30 min · corpo inteiro',
        itens: [
          _F('Leg press', 3, '10–12', 30, 'Bi-série 1.'),
          _F('Supino reto na máquina', 3, '10–12', 75),
          _F('Remada baixa no cabo', 3, '10–12', 30, 'Bi-série 2.'),
          _F('Elevação pélvica com barra', 3, '10–12', 75),
          _F('Dead bug', 2, '8 cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: '30 min · corpo inteiro',
        itens: [
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8–10 cada perna', 30, 'Bi-série 1.'),
          _F('Desenvolvimento sentado com halteres', 3, '8–12', 75),
          _F('Remada unilateral com halter (serrote)', 3, '10 cada lado', 30, 'Bi-série 2.'),
          _F('Flexão de braço inclinada', 3, '8–15', 75),
          _F('Pallof press', 2, '10 cada lado', 30),
        ],
      },
    ],
  },
  {
    id: 'rap-int',
    cat: 'rapido',
    niv: 'int',
    nome: 'Treino rápido · 40 minutos com drop-set',
    freq: '3x por semana (A, B e C)',
    info: 'Bi-séries de músculos opostos e drop-set na última série dos isoladores: dão hipertrofia parecida com o treino tradicional em cerca da metade do tempo (Iversen 2021; Sødal 2023). Funcionam melhor para massa do que para força máxima.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: '40 min · inferior + empurrar',
        itens: [
          _F('Agachamento livre com barra', 3, '6–10', 120, 'Aqueça com 2 séries leves. Descanso normal aqui.'),
          _F('Supino inclinado com halteres', 3, '8–12', 30, 'Bi-série.'),
          _F('Mesa flexora sentada', 3, '10–12', 75),
          _F(
            'Elevação lateral com halteres',
            3,
            '12–15',
            45,
            'Última série em drop-set: tire ~25% do peso e continue até a falha, 2 vezes.',
          ),
          _F('Tríceps francês no cabo com corda', 2, '10–12', 45, 'Última série em drop-set.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: '40 min · posterior + puxar',
        itens: [
          _F('Levantamento terra romeno', 3, '6–10', 120),
          _F('Barra fixa', 3, '6–10', 30, 'Bi-série. Assistida se precisar.'),
          _F('Elevação pélvica com barra', 3, '8–12', 75),
          _F('Remada baixa no cabo', 3, '10–12', 45, 'Última série em drop-set.'),
          _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 45, 'Última série em drop-set.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: '40 min · corpo inteiro',
        itens: [
          _F('Leg press', 3, '10–12', 30, 'Bi-série.'),
          _F('Supino reto com halteres', 3, '8–12', 75),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 30, 'Bi-série.'),
          _F('Puxada frontal com pegada supinada', 3, '10–12', 75),
          _F('Panturrilha em pé na máquina', 3, '10–15', 45, 'Última série em drop-set.'),
        ],
      },
    ],
  },
  {
    id: 'rap-ava',
    cat: 'rapido',
    niv: 'ava',
    nome: 'Treino rápido · rest-pause',
    freq: '3 a 4x por semana (A, B e C)',
    info: 'Rest-pause: faça a série até perto da falha, descanse 15–20 s e faça mais repetições com o mesmo peso, 2 a 3 vezes. Num estudo, o treino caiu de 57 para 35 minutos mantendo o volume (Iversen 2021). Use nos isoladores e máquinas, não em agachamento e terra pesados.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Empurrar + quadríceps',
        itens: [
          _F('Supino reto com barra (pegada média)', 3, '5–8', 150, 'Pesado, sem rest-pause.'),
          _F(
            'Agachamento hack na máquina',
            2,
            '8–10 + rest-pause',
            120,
            'Rest-pause: 2 mini-séries com 15–20 s de pausa.',
          ),
          _F('Supino inclinado com halteres', 2, '8–10', 90),
          _F('Elevação lateral sentada no cabo', 2, '12–15 + rest-pause', 60),
          _F('Tríceps corda', 2, '10–12 + rest-pause', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Puxar + posterior',
        itens: [
          _F('Barra fixa com peso', 3, '5–8', 150, 'Sem rest-pause.'),
          _F('Mesa flexora sentada', 2, '8–10 + rest-pause', 75),
          _F('Remada cavalinho apoiada no peito', 2, '8–10 + rest-pause', 90),
          _F('Crucifixo inverso na máquina (peck deck)', 2, '12–15 + rest-pause', 60),
          _F('Rosca alternada com halteres no banco inclinado', 2, '10–12 + rest-pause', 60),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Pernas + ombros',
        itens: [
          _F('Levantamento terra romeno', 3, '6–8', 150, 'Sem rest-pause.'),
          _F('Leg press', 2, '10–12 + rest-pause', 120),
          _F('Desenvolvimento de ombros na máquina', 2, '8–10 + rest-pause', 90),
          _F('Cadeira extensora', 2, '12–15 + rest-pause', 60),
          _F('Panturrilha em pé na máquina', 2, '10–12 + rest-pause', 60),
        ],
      },
    ],
  },

  /* ---------- TÉCNICAS AVANÇADAS DE HIPERTROFIA ---------- */
  {
    id: 'hip-tec',
    cat: 'hipertrofia',
    niv: 'ava',
    nome: 'Hipertrofia · Técnicas avançadas',
    freq: '4 a 5x por semana (A, B, C e repete)',
    info: 'Bloco de 4–6 semanas com drop-set, rest-pause e excêntrica lenta nos isoladores. Drop-sets dão hipertrofia parecida com séries tradicionais gastando menos tempo (Sødal 2023). Use só no fim do exercício: muitas séries até a falha atrapalham a recuperação.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Peito, ombros e tríceps',
        itens: [
          _F('Supino inclinado com halteres', 4, '6–10', 150, 'Descida em 3 s.'),
          _F('Supino reto na máquina', 3, '8–10', 120, 'Última série em drop-set (2 quedas de ~25%).'),
          _F('Crucifixo na máquina (peck deck)', 2, '12–15 + rest-pause', 60),
          _F('Elevação lateral sentada no cabo', 4, '12–20', 60, 'Última série em drop-set.'),
          _F('Tríceps francês no cabo com corda', 3, '10–12', 60, 'Última série em rest-pause.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Costas e bíceps',
        itens: [
          _F('Barra fixa com peso', 4, '6–10', 150, 'Descida em 3 s.'),
          _F('Remada cavalinho apoiada no peito', 3, '8–10', 120, 'Última série em drop-set.'),
          _F('Puxada frontal unilateral', 3, '10–12 cada lado', 75),
          _F('Crucifixo inverso na máquina (peck deck)', 3, '15–20 + rest-pause', 60),
          _F('Rosca alternada com halteres no banco inclinado', 3, '8–12', 60, 'Última série em drop-set.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Pernas',
        itens: [
          _F('Agachamento livre com barra', 4, '5–8', 180, 'Sem técnicas: só carga.'),
          _F('Levantamento terra romeno', 3, '6–10', 150, 'Descida em 3 s.'),
          _F('Leg press', 2, '10–12', 120, 'Última série em drop-set.'),
          _F('Mesa flexora sentada', 3, '8–12 + rest-pause', 75),
          _F('Cadeira extensora', 2, '12–15', 60, 'Última série em drop-set.'),
          _F('Panturrilha em pé na máquina', 4, '8–12', 60, 'Pausa de 2 s embaixo.'),
        ],
      },
    ],
  },

  /* ---------- PREVENÇÃO DE LESÕES ---------- */
  {
    id: 'pre-ini',
    cat: 'prevencao',
    niv: 'ini',
    nome: 'Prevenção de lesões · Base',
    freq: '2x por semana (rodízio A → B → C), 20–30 min',
    info: 'Os exercícios com melhor prova contra lesão: flexão nórdica (programas com ela cortam as lesões de posterior pela metade, van Dyk 2019), prancha de Copenhague (41% menos problemas na virilha, Harøy 2019), panturrilha e glúteo médio. Pode ser feito como complemento de outro treino.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Posterior e virilha',
        itens: [
          _F(
            'Glute-ham raise no chão',
            2,
            '3–5',
            90,
            'Flexão nórdica: desça o mais devagar que conseguir, apoie as mãos no fim.',
          ),
          _F('Prancha de Copenhague curta (joelho apoiado)', 2, '15–20 s cada lado', 45),
          _F('Ponte de glúteos unilateral', 3, '10 cada perna', 45),
          _F('Panturrilha em pé com halteres', 3, '12 cada perna', 45, 'Uma perna por vez, descida em 3 s.'),
          _F('Bird dog', 2, '8 cada lado', 30),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Quadril e joelho',
        itens: [
          _F('Monster walk (caminhada com elástico)', 2, '12 passos cada lado', 30),
          _F('Agachamento isométrico na parede (cadeirinha)', 3, '30–45 s', 60),
          _F('Subida no banco com halteres', 3, '8 cada perna', 60, 'Joelho alinhado com o pé.'),
          _F('Abdução de quadril com elástico', 2, '15 cada lado', 30),
          _F('Prancha lateral', 2, '30 s cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Tornozelo, panturrilha e core',
        itens: [
          _F('Panturrilha sentado unilateral com halter', 3, '12 cada perna', 45, 'Sóleo.'),
          _F('Prancha de equilíbrio', 3, '30 s', 30),
          _F('Levantamento terra unilateral com kettlebell', 2, '8 cada perna', 60, 'Equilíbrio e posterior.'),
          _F('Pallof press', 2, '10 cada lado', 30),
          _F('Dead bug', 2, '8 cada lado', 30),
        ],
      },
    ],
  },
  {
    id: 'pre-int',
    cat: 'prevencao',
    niv: 'int',
    nome: 'Prevenção de lesões · Progressão',
    freq: '2x por semana (rodízio A → B → C)',
    info: 'Mais volume nos protetores: nórdicas e Copenhague com repetições, panturrilha pesada e unilaterais. O efeito protetor aparece com regularidade: o que funciona é fazer toda semana, durante a temporada inteira.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Posterior e virilha',
        itens: [
          _F('Glute-ham raise no chão', 3, '5–6', 90),
          _F('Prancha de Copenhague curta (joelho apoiado)', 3, '8–10 cada lado', 45, 'Agora em repetições.'),
          _F('Levantamento terra romeno', 3, '8', 90),
          _F('Panturrilha em pé na máquina', 3, '10', 60, 'Pesada, pausa embaixo.'),
          _F('Prancha lateral', 2, '40 s cada lado', 30),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Quadril e joelho',
        itens: [
          _F('Agachamento com afundo e pé elevado com halteres', 3, '8 cada perna', 75),
          _F('Cadeira adutora', 3, '12', 45),
          _F(
            'Agachamento isométrico na parede (cadeirinha)',
            3,
            '45 s',
            60,
            'Segure um halter no colo para dificultar.',
          ),
          _F('Cadeira abdutora', 3, '15', 45),
          _F('Pallof press', 3, '10 cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Reatividade e tornozelo',
        itens: [
          _F('Saltito unilateral com calcanhar ao glúteo', 3, '10 cada perna', 45),
          _F('Panturrilha sentado unilateral com halter', 3, '10 cada perna', 45),
          _F('Subida no banco com halteres', 3, '8 cada perna', 60),
          _F('Caminhada do fazendeiro', 3, '30 m', 60, 'Core e postura.'),
          _F('Bird dog', 2, '10 cada lado', 30),
        ],
      },
    ],
  },
  {
    id: 'pre-ava',
    cat: 'prevencao',
    niv: 'ava',
    nome: 'Prevenção de lesões · Atleta',
    freq: '2x por semana (rodízio A → B → C)',
    info: 'Para quem já faz nórdicas e Copenhague completas: carga excêntrica alta, saltos com aterrissagem controlada e força unilateral pesada. Mantenha 1 sessão por semana nas fases de competição para não perder o efeito.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Posterior e virilha avançado',
        itens: [
          _F('Glute-ham raise no chão', 3, '6–8', 120, 'Sem apoiar as mãos.'),
          _F('Prancha de Copenhague (pé apoiado)', 3, '8–12 cada lado', 60),
          _F('Levantamento terra romeno', 3, '6', 120, 'Pesado.'),
          _F('Panturrilha em pé na máquina', 4, '8', 60, 'Pesada.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Aterrissagem e joelho',
        itens: [
          _F('Salto frontal na caixa', 3, '5', 90, 'Aterrisse macio, joelho alinhado.'),
          _F('Salto lateral alternado (bound)', 3, '6', 90, 'Segure 2 s em cada aterrissagem.'),
          _F('Agachamento com afundo e pé elevado com halteres', 3, '6 cada perna', 90, 'Pesado.'),
          _F('Agachamento isométrico na parede (cadeirinha)', 3, '45 s', 60, 'Com carga.'),
          _F('Pallof press', 3, '12 cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Força unilateral e tronco',
        itens: [
          _F('Subida no banco com halteres', 3, '6 cada perna', 90, 'Banco alto, pesado.'),
          _F('Levantamento terra unilateral com kettlebell', 3, '6 cada perna', 75),
          _F('Cadeira adutora', 3, '10', 45),
          _F('Caminhada do fazendeiro', 3, '40 m', 60),
          _F('Roda abdominal', 3, '8', 45),
        ],
      },
    ],
  },

  /* ---------- SAÚDE: OSSOS, GLICEMIA E COLUNA ---------- */
  {
    id: 'sau-ossos',
    cat: 'saude',
    niv: 'int',
    nome: 'Saúde · Ossos fortes (pós-menopausa)',
    freq: '2x por semana, 30 min (A, B e C)',
    info: 'Baseado no estudo LIFTMOR: mulheres pós-menopausa com baixa massa óssea fizeram 5×5 acima de 80–85% da carga máxima em terra, agachamento e desenvolvimento, mais saltos com aterrissagem, 2x por semana por 8 meses, e ganharam densidade óssea na coluna e no fêmur (Watson 2018). O primeiro mês é de adaptação com cargas leves. Precisa de liberação médica e supervisão próxima.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Terra e desenvolvimento',
        itens: [
          _F(
            'Levantamento terra com barra hexagonal',
            5,
            '5',
            150,
            '>80–85% 1RM depois do mês de adaptação. Coluna neutra sempre.',
          ),
          _F('Desenvolvimento militar com barra em pé', 5, '5', 120, '>80–85% 1RM.'),
          _F('Agachamento com salto sem peso', 3, '5', 60, 'Impacto: aterrisse firme nos calcanhares.'),
          _F('Prancha', 2, '30 s', 30),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Agachamento e puxada',
        itens: [
          _F('Agachamento livre com barra', 5, '5', 150, '>80–85% 1RM. Pode ser no banco (sentar e levantar).'),
          _F('Barra fixa assistida com elástico', 3, '5', 90),
          _F('Salto frontal na caixa', 3, '5', 60, 'Desça do caixote pulando (impacto).'),
          _F('Bird dog', 2, '8 cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Corpo inteiro',
        itens: [
          _F('Levantamento terra com barra hexagonal', 3, '5', 150),
          _F('Agachamento livre com barra', 3, '5', 150),
          _F('Desenvolvimento sentado com halteres', 3, '6', 90),
          _F('Caminhada do fazendeiro', 3, '30 m', 60),
        ],
      },
    ],
  },
  {
    id: 'sau-glic',
    cat: 'saude',
    niv: 'ini',
    nome: 'Saúde · Controle da glicemia',
    freq: '2 a 3x por semana (A, B e C), por pelo menos 12 semanas',
    info: 'Na meta-análise de 2023 sobre diabetes tipo 2, a musculação baixou a hemoglobina glicada; os melhores resultados vieram com 2–3 treinos por semana, 3 séries de 6–10 repetições a ~70–80% da carga máxima e 12–16 semanas (Su 2023). Complementa, não substitui, o tratamento médico: confira a glicemia antes e depois no começo.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Grandes músculos',
        itens: [
          _F('Leg press', 3, '8–10', 75),
          _F('Supino reto na máquina', 3, '8–10', 75),
          _F('Remada baixa no cabo', 3, '8–10', 75),
          _F('Mesa flexora sentada', 3, '8–10', 60),
          _F('Bicicleta ergométrica', 1, '10 min', 0, 'Leve, no fim do treino.'),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Grandes músculos',
        itens: [
          _F('Agachamento goblet', 3, '8–10', 75),
          _F('Puxada frontal pegada aberta', 3, '8–10', 75),
          _F('Desenvolvimento sentado com halteres', 3, '8–10', 75),
          _F('Elevação pélvica com barra', 3, '8–10', 60),
          _F('Caminhada na esteira', 1, '10 min', 0, 'Leve, no fim do treino.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Grandes músculos',
        itens: [
          _F('Cadeira extensora', 3, '8–10', 60),
          _F('Supino reto com halteres', 3, '8–10', 75),
          _F('Remada unilateral com halter (serrote)', 3, '8–10 cada lado', 60),
          _F('Levantamento terra romeno', 3, '8–10', 75),
          _F('Panturrilha sentado', 3, '10–12', 45),
        ],
      },
    ],
  },
  {
    id: 'sau-coluna',
    cat: 'saude',
    niv: 'ini',
    nome: 'Saúde · Coluna e core',
    freq: '2 a 3x por semana (A, B e C)',
    info: 'Para quem quer uma coluna mais forte ou tem dor lombar crônica sem sinal de alerta. Na revisão Cochrane de 2021 (249 estudos), o exercício reduziu a dor lombar crônica em média 15 pontos (de 100) em relação a não tratar, sem um tipo melhor que outro. Dor forte, irradiada ou depois de queda: avaliação antes.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Estabilidade',
        itens: [
          _F('Bird dog', 3, '8 cada lado', 30, 'Devagar, sem girar o quadril.'),
          _F('Dead bug', 3, '8 cada lado', 30),
          _F('Ponte de glúteos', 3, '12', 45),
          _F('Prancha lateral', 3, '20–30 s cada lado', 30, 'Joelhos no chão para facilitar.'),
          _F('Agachamento com halteres até o banco', 2, '10', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Movimento de quadril',
        itens: [
          _F('Levantamento terra romeno', 3, '10', 75, 'Leve: aprenda a dobrar no quadril com a coluna neutra.'),
          _F('Pallof press', 3, '10 cada lado', 30),
          _F('Remada baixa no cabo', 3, '10–12', 60),
          _F('Superman', 2, '10', 30),
          _F('Caminhada do fazendeiro', 3, '20 m', 45, 'Peso leve, postura alta.'),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Força geral',
        itens: [
          _F('Agachamento goblet', 3, '8–10', 75),
          _F('Extensão lombar no banco', 2, '10–12', 60, 'Amplitude que não doa.'),
          _F('Puxada frontal pegada aberta', 3, '10', 60),
          _F('Prancha', 3, '30 s', 30),
          _F('Elevação pélvica com barra', 3, '10', 60),
        ],
      },
    ],
  },

  /* ---------- CORREDOR QUE QUER MASSA ---------- */
  {
    id: 'cor-hip',
    cat: 'corredor',
    niv: 'int',
    nome: 'Corredor · Ganhar massa sem parar de correr',
    freq: '3x por semana (A, B e C), em dias de corrida leve',
    info: 'Correr e treinar força juntos atrapalha pouco o ganho de massa, mas a corrida tende a reduzir um pouco o crescimento das fibras (meta-análise de 2022). Por isso: musculação nos dias de corrida leve, de preferência antes da corrida ou com 6 h ou mais de intervalo, e longe dos treinos fortes.',
    treinos: [
      {
        titulo: 'Treino A',
        foco: 'Superior',
        itens: [
          _F('Supino inclinado com halteres', 3, '8–12', 120),
          _F('Barra fixa', 3, '6–10', 120),
          _F('Desenvolvimento sentado com halteres', 3, '8–12', 90),
          _F('Remada baixa no cabo', 3, '10–12', 90),
          _F('Tríceps francês no cabo com corda', 2, '10–12', 60),
          _F('Rosca alternada com halteres no banco inclinado', 2, '10–12', 60),
        ],
      },
      {
        titulo: 'Treino B',
        foco: 'Inferior (força)',
        itens: [
          _F('Agachamento livre com barra', 3, '6–8', 150),
          _F('Levantamento terra romeno', 3, '8', 120),
          _F('Agachamento com afundo e pé elevado com halteres', 2, '8 cada perna', 90),
          _F('Panturrilha em pé na máquina', 3, '8–12', 60),
          _F('Prancha lateral', 2, '30 s cada lado', 30),
        ],
      },
      {
        titulo: 'Treino C',
        foco: 'Superior + core',
        itens: [
          _F('Supino reto com barra (pegada média)', 3, '6–10', 120),
          _F('Remada cavalinho apoiada no peito', 3, '8–10', 90),
          _F('Elevação lateral sentada no cabo', 3, '12–15', 60),
          _F('Puxada frontal unilateral', 2, '10–12 cada lado', 60),
          _F('Paralelas para peito', 2, '8–12', 75),
          _F('Roda abdominal', 3, '8–10', 45),
        ],
      },
    ],
  },
];
