/* Nexos App · Ciclos de força, sequência entre ciclos, macrociclo anual, macrociclo São Luís, trail e volta depois de lesão.
   Parte 28 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Ciclos de força (periodização): sequência de fases semana a semana ----------
   Cada semana recebe uma fase (resistência, hipertrofia, força, potência, ondulatório diário ou semana leve).
   O aluno continua com os treinos dele (A, B, C…); a fase muda a faixa de repetições e o descanso daquela semana.
   Base: Williams et al. 2017 e Moesgaard et al. 2022 (Sports Med); Harries et al. 2015 e Rhea et al. 2002/2003 (J Strength Cond Res);
   Issurin 2010 (Sports Med, blocos); Bell et al. 2023 (Sports Med Open, semana leve); Blagrove et al. 2018 (Sports Med, força para corredores). */
const CF_COD = {
  R: 'resistencia',
  H: 'hipertrofia',
  F: 'forca',
  P: 'potencia',
  O: 'ondulatorio',
  L: 'deload',
  X: 'flexivel',
  A: 'autorregulada',
  C: 'conjugada',
};
const CF_OBJ = [
  ['trilhas', 'Trilhas'],
  ['res', 'Resistência e adaptação'],
  ['hip', 'Hipertrofia'],
  ['for', 'Força e potência'],
  ['corr', 'Para corredores'],
  ['macro', 'Macrociclos e transição'],
];
const CICLOS_FORCA = [
  {
    id: 'cf-adapt',
    obj: 'res',
    niv: 'ini',
    nome: 'Adaptação anatômica',
    seq: 'RRRL',
    modelo: 'Linear',
    desc: 'Primeiro mês de quem começa ou volta: muitas repetições com carga leve para aprender os movimentos e preparar tendões e articulações.',
  },
  {
    id: 'cf-resist',
    obj: 'res',
    niv: 'int',
    nome: 'Resistência muscular',
    seq: 'RRRLRR',
    modelo: 'Linear',
    desc: 'Foco em aguentar mais repetições e treinos longos. Bom para iniciantes avançando e para quem treina provas longas.',
  },
  {
    id: 'cf-rev',
    obj: 'res',
    niv: 'int',
    nome: 'Linear reverso (resistência no fim)',
    seq: 'FFHHLRRR',
    modelo: 'Linear reverso',
    desc: 'Começa pesado e termina com muitas repetições. Na comparação de Rhea et al. (2003), foi o modelo que mais melhorou a resistência muscular.',
  },
  {
    id: 'cf-hip-ini',
    obj: 'hip',
    niv: 'ini',
    nome: 'Hipertrofia linear · iniciante',
    seq: 'RRHHHLHH',
    modelo: 'Linear',
    desc: 'Duas semanas de adaptação e depois hipertrofia (8 a 12 repetições), com uma semana leve no meio.',
  },
  {
    id: 'cf-hip-int',
    obj: 'hip',
    niv: 'int',
    nome: 'Hipertrofia em blocos · intermediário',
    seq: 'HHHLHHHLFFHL',
    modelo: 'Blocos',
    desc: '12 semanas: dois blocos de hipertrofia e um bloco curto de força, que ajuda a mover mais carga quando volta para a hipertrofia.',
  },
  {
    id: 'cf-hip-wup',
    obj: 'hip',
    niv: 'int',
    nome: 'Hipertrofia ondulatória semanal',
    seq: 'HFHRLHFH',
    modelo: 'Ondulatório semanal',
    desc: 'A faixa de repetições muda a cada semana (hipertrofia, força, resistência). Variedade de estímulo com o mesmo volume.',
  },
  {
    id: 'cf-dup',
    obj: 'hip',
    niv: 'ava',
    nome: 'Ondulatório diário (DUP)',
    seq: 'OOOLOOOL',
    modelo: 'Ondulatório diário',
    desc: 'Na mesma semana, o treino A é de força (4 a 6 repetições), o B de hipertrofia (8 a 12) e o C de resistência (15 a 20). Semana leve a cada 4.',
  },
  {
    id: 'cf-flex',
    obj: 'hip',
    niv: 'int',
    nome: 'Ondulatório flexível',
    seq: 'XXXLXXXL',
    modelo: 'Ondulatório flexível',
    desc: 'O aluno escolhe a faixa do dia pela recuperação: pesado quando está bem, moderado quando está normal e leve quando está cansado. Bom para quem tem rotina pesada, sono irregular ou treina corrida junto.',
  },
  {
    id: 'cf-rir',
    obj: 'for',
    niv: 'int',
    nome: 'Autorregulada por repetições sobrando (RIR)',
    seq: 'AAALAAAL',
    modelo: 'Autorregulada',
    desc: 'As repetições seguem o treino, mas a carga sai do esforço do dia: cada série termina com 2 repetições sobrando. Ajusta sozinho aos dias bons e ruins.',
  },
  {
    id: 'cf-conj',
    obj: 'for',
    niv: 'ava',
    nome: 'Conjugada (Westside)',
    seq: 'CCCLCCCL',
    modelo: 'Conjugada',
    desc: 'Na mesma semana: treino A de esforço máximo, B de esforço dinâmico (velocidade) e C de repetições. Para quem já tem boa técnica nos levantamentos.',
  },
  {
    id: 'cf-lin',
    obj: 'for',
    niv: 'int',
    nome: 'Força linear clássica',
    seq: 'RRHHHLFFFLPP',
    modelo: 'Linear',
    desc: '12 semanas do volume para a intensidade: resistência, hipertrofia, força e, no fim, potência. O modelo mais usado e mais simples de acompanhar.',
  },
  {
    id: 'cf-blocos',
    obj: 'for',
    niv: 'ava',
    nome: 'Força em blocos (acumulação, transmutação e realização)',
    seq: 'HHHFFFLPPL',
    modelo: 'Blocos',
    desc: 'Modelo de Issurin: 3 semanas de acumulação (hipertrofia), 3 de transmutação (força) e realização (potência), com semanas leves.',
  },
  {
    id: 'cf-pot',
    obj: 'for',
    niv: 'ava',
    nome: 'Força e potência',
    seq: 'HFFLFPPL',
    modelo: 'Linear',
    desc: 'Para quem já tem base: sobe a carga e termina com potência (carga moderada movida o mais rápido possível).',
  },
  {
    id: 'cf-corr',
    obj: 'corr',
    niv: 'int',
    nome: 'Força para corredores (economia de corrida)',
    seq: 'HFFLFPFP',
    modelo: 'Ondulatório semanal',
    desc: 'Força com carga alta, pliometria e a combinação das duas melhoram a economia de corrida; carga leve e isometria, não (Llanos-Lagos et al. 2024, Sports Med; Blagrove et al. 2018). Faça em outro dia ou com pelo menos 3 h de intervalo da corrida, para não perder ganho de explosão (Schumann et al. 2022).',
  },
  {
    id: 'cf-corr-temp',
    obj: 'corr',
    niv: 'int',
    nome: 'Manutenção de força na temporada de provas',
    seq: 'FPFL',
    modelo: 'Manutenção',
    desc: 'Pouco volume e carga alta para manter a força durante a fase específica e as provas. Repita enquanto durar a temporada.',
  },
  {
    id: 'cf-corr-pre',
    obj: 'corr',
    niv: 'ini',
    nome: 'Pré-temporada do corredor (base de força)',
    seq: 'RRHHLFFL',
    modelo: 'Linear',
    desc: 'Acompanha a Pré-temporada Nexos de corrida: começa leve, constrói hipertrofia e termina com força.',
  },
  {
    id: 'cf-anual',
    obj: 'macro',
    niv: 'ava',
    nome: 'Macrociclo de 6 meses',
    seq: 'RRRLHHHLHHHLFFFLFFFLPPPL',
    modelo: 'Linear em blocos',
    desc: '24 semanas: resistência, dois blocos de hipertrofia, dois de força e um de potência, cada um com a sua semana leve.',
  },
  {
    id: 'cf-deload',
    obj: 'macro',
    niv: 'int',
    nome: 'Semana leve e transição',
    seq: 'LL',
    modelo: 'Recuperação',
    desc: 'Duas semanas leves entre ciclos ou depois de uma prova: metade das séries e carga um pouco menor.',
  },
];
const CF_REFS =
  'Williams et al. 2017 e Moesgaard et al. 2022 (Sports Med); Harries et al. 2015, Rhea et al. 2002 e 2003 e McNamara & Stearne 2010 (J Strength Cond Res); Issurin 2010 e Greig et al. 2020 (Sports Med); Helms et al. 2016 (Strength Cond J); Bell et al. 2023 (Sports Med Open); Llanos-Lagos et al. 2024 (Sports Med); Blagrove et al. 2018 (Sports Med); Schoenfeld et al. 2021 (Sports); Robinson et al. 2024 (Sports Med); Singer et al. 2024 (Front Sports Act Living); Hickmott et al. 2022 (Sports Med Open); Schumann et al. 2022 (Sports Med); Coleman et al. 2024 (PeerJ).';
const cfFases = (c) => [...c.seq].map((x) => CF_COD[x]);
/** no máximo 6 semanas de carga seguidas: a 7ª vira semana leve (Bell et al. 2023: semana leve a cada 4 a 8,
    mais comum a cada 5 ou 6). Usado na junção dos ciclos das trilhas e na força do macrociclo. */
const fasesComLeve = (fs, max = 6) => {
  let run = 0;
  return fs.map((f) => {
    if (f === 'deload') {
      run = 0;
      return f;
    }
    if (++run > max) {
      run = 0;
      return 'deload';
    }
    return f;
  });
};
const cfBarra = (fs) =>
  `<div class="cic-barra">${fs.map((f) => `<i style="background:${FASES_F[f].cor}" title="${esc(FASES_F[f].n)}"></i>`).join('')}</div><div class="cic-leg">${[...new Set(fs)].map((f) => `<span><i style="background:${FASES_F[f].cor}"></i>${FASES_F[f].n}</span>`).join('')}</div>`;
async function viewCiclosForca(id) {
  if (id) return /^tf-/.test(id) ? viewTrilha(id, true) : viewCicloForca(id);
  const st = S.cache.cfObj || (S.cache.cfObj = { o: store.get('nx-cf-obj', 'hip') });
  const desenha = () => {
    const L = CICLOS_FORCA.filter((c) => c.obj === st.o);
    $app.innerHTML = `<a class="back" href="#/treinos">${I.back} Treinos de musculação</a><p class="eyebrow">Biblioteca de força</p><h1 class="h1">Ciclos de força</h1>
      <p class="muted" style="margin-top:6px">Periodização pronta: cada semana recebe uma fase, que muda a faixa de repetições e o descanso. O aluno continua com os treinos dele (A, B, C). Ao aplicar, as fases vão para as semanas do aluno; a liberação continua com você.</p>
      <div class="chips" id="cf-o" style="margin-top:14px">${CF_OBJ.map(([k, l]) => `<button type="button" class="chip ${k === st.o ? 'on' : ''}" data-o="${k}">${l}</button>`).join('')}</div>
      ${st.o === 'trilhas' ? `<p class="small muted" style="margin-top:12px"><b>Trilhas</b> são ciclos de força encadeados na ordem certa, com semanas leves entre os blocos. Aplique a trilha inteira de uma vez ou abra cada ciclo para ver o que vem depois.</p><div class="stack" style="margin-top:12px">${TRILHAS_FORCA.map((t) => trlCard(t, true)).join('')}</div>` : ''}
      <div class="stack" style="margin-top:12px">${L.map((c) => {
        const fs = cfFases(c);
        return `<a class="card tap cic-card" href="#/treinos/ciclos-forca/${c.id}" style="color:inherit"><div class="row between" style="gap:8px;align-items:flex-start"><div style="min-width:0"><b class="h3">${esc(c.nome)}</b><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="tag acc">${CIC_NIV[c.niv]}</span><span class="tag">${fs.length} semana${fs.length > 1 ? 's' : ''}</span><span class="tag">${esc(c.modelo)}</span></div></div>${I.chev}</div>${cfBarra(fs)}<p class="small muted" style="margin-top:8px">${esc(c.desc)}</p></a>`;
      }).join('')}</div>`;
    document.getElementById('cf-o').onclick = (e) => {
      const x = e.target.closest('[data-o]');
      if (!x) return;
      st.o = x.dataset.o;
      store.set('nx-cf-obj', st.o);
      desenha();
    };
  };
  desenha();
}
function viewCicloForca(id) {
  const c = CICLOS_FORCA.find((x) => x.id === id);
  if (!c) {
    location.replace('#/treinos/ciclos-forca');
    return;
  }
  const fs = cfFases(c);
  const MODELO = {
    Linear:
      'Periodização linear: começa com mais repetições e carga menor e, a cada bloco, diminui as repetições e aumenta a carga. Programas periodizados ganham mais força do que os não periodizados (Williams et al. 2017).',
    'Linear reverso':
      'Linear reverso: começa pesado e termina com muitas repetições. Indicado quando o objetivo final é resistência muscular (Rhea et al. 2003).',
    'Ondulatório semanal':
      'Ondulatório semanal: a faixa de repetições muda de uma semana para a outra. Com o mesmo volume, a hipertrofia é parecida entre linear e ondulatório; para força máxima, o ondulatório teve pequena vantagem, principalmente em quem já treina (Moesgaard et al. 2022, Sports Med; Harries et al. 2015).',
    'Ondulatório diário':
      'Ondulatório diário (DUP): treino A em força, B em hipertrofia e C em resistência na mesma semana (Rhea et al. 2002). O app mostra ao aluno a faixa certa em cada treino.',
    Blocos:
      'Periodização em blocos (Issurin 2010): concentra um objetivo por vez (acumulação, transmutação, realização), em blocos de 2 a 4 semanas.',
    'Linear em blocos':
      'Macrociclo em blocos lineares, cada um com a sua semana leve. A semana leve (metade das séries, carga ~10% menor) ajuda a recuperar e a consolidar os ganhos (Bell et al. 2023).',
    Manutenção:
      'Manutenção: com pouco volume e carga alta é possível manter a força por semanas, desde que a intensidade continue alta.',
    Recuperação:
      'Semanas leves: metade das séries e carga um pouco menor, mantendo os movimentos. É a forma recomendada pelo consenso de especialistas para controlar o cansaço (Bell et al. 2023); parar totalmente por uma semana não trouxe vantagem para o músculo e reduziu um pouco a força (Coleman et al. 2024, PeerJ).',
    'Ondulatório flexível':
      'Ondulatório flexível: a faixa do dia é escolhida pela recuperação. Em estudo com universitários iniciantes, rendeu ganhos de força iguais ou maiores que o ondulatório fixo (McNamara & Stearne 2010, J Strength Cond Res). O app já pergunta a recuperação (PSR) antes de cada treino.',
    Autorregulada:
      'Autorregulação: a carga é ajustada pelo esforço do dia, pelas repetições sobrando (RIR) ou pela velocidade da barra (Helms et al. 2016). Na meta-análise mais recente, deu ganhos de força parecidos com a carga fixa em porcentagem, com leve tendência a favor em programas de 8 semanas ou mais (Hickmott et al. 2022, Sports Med Open); a vantagem prática é lidar melhor com os dias ruins (Greig et al. 2020).',
    Conjugada:
      'Conjugada (Westside, Louie Simmons): esforço máximo, esforço dinâmico e repetições na mesma semana. Muito usada no powerlifting; a pesquisa controlada é pouca, então a base é principalmente prática.',
  };
  $app.innerHTML = `<a class="back" href="#/treinos/ciclos-forca">${I.back} Ciclos de força</a><p class="eyebrow">${esc((CF_OBJ.find((x) => x[0] === c.obj) || [])[1] || '')} · ${CIC_NIV[c.niv]}</p><h1 class="h1">${esc(c.nome)}</h1>
    <p class="muted" style="margin-top:6px">${esc(c.desc)}</p>
    <div class="card" style="margin-top:14px"><div class="ck-res"><div><b>${fs.length}</b><span>semanas</span></div><div><b style="font-size:1.05rem">${esc(c.modelo)}</b><span>modelo</span></div></div>${cfBarra(fs)}</div>
    <button class="btn block" id="cf-apl" style="margin-top:12px">${I.users} Aplicar a um aluno</button>
    <div class="card" style="margin-top:12px"><span class="eyebrow">Base científica</span><p class="small" style="margin-top:6px">${MODELO[c.modelo] || ''}</p><p class="tiny dim" style="margin-top:8px">${CF_REFS}</p></div>
    ${seqHTML(proximosForca(c), '#/treinos/ciclos-forca/')}
    <p class="sec-lbl">Semana a semana</p><div class="stack">${fs
      .map((f, i) => {
        const x = FASES_F[f];
        return `<div class="card cf-sem" style="--fc:${x.cor}"><span class="fase-c">${x.c}</span><div class="grow" style="min-width:0"><b>Semana ${i + 1} · ${x.n}</b><p class="small muted" style="margin-top:2px">${x.reps} · ${x.desc2}</p><p class="tiny dim" style="margin-top:2px">${i === fs.indexOf(f) ? x.desc : x.desc.split(/(?<=\.) /)[0]}</p></div></div>`;
      })
      .join('')}</div>`;
  document.getElementById('cf-apl').onclick = () => cfAplicar(c, fs);
}
/** grava as fases de força de um ciclo novo: tudo o que havia do início em diante sai (senão as semanas de um ciclo
    aplicado antes continuavam depois do fim do novo), e a tela do aluno abre na semana em que o ciclo começa */
async function gravarFasesForca(alunoId, rows) {
  if (!rows.length) return;
  const ini = rows.map((r) => r.semana).sort()[0];
  const { error: e1 } = await sb.from('nx_forca_fases').delete().eq('aluno_id', alunoId).gte('semana', ini);
  if (e1) throw e1;
  const { error } = await sb.from('nx_forca_fases').upsert(rows, { onConflict: 'aluno_id,semana' });
  if (error) throw error;
  abrirNaSemana(alunoId, ini);
}
/** a planilha (força e corrida) daquele aluno abre na semana indicada */
function abrirNaSemana(alunoId, iniISO) {
  const off = Math.round((dia(iniISO) - inicioSemana()) / 6048e5);
  S.cache.fsem = { off: Math.max(0, off), aluno: alunoId };
  S.cache.semCorr = { ...(S.cache.semCorr || { sub: 'planilha' }), aluno: alunoId, off: Math.max(0, off) };
}
/* ---------- treinos de força na semana ----------
   Os ciclos de força definem a fase de cada semana (faixa de repetições e carga). Os exercícios vêm dos treinos do
   aluno, que ficam em dias fixos. Quando o aluno ainda não tem treino de força em nenhum dia, o app monta os treinos
   base da Nexos para corredor e põe nos dias de força dele, para a semana não ficar vazia na planilha.
   Escolha dos exercícios: multiarticulares de membros inferiores, cadeia posterior, unilaterais, panturrilha e core,
   que são os que melhoram a economia de corrida e protegem contra lesão (Llanos-Lagos et al. 2024; Blagrove et al. 2018). */
const TREINOS_BASE_F = [
  {
    titulo: 'Treino A',
    foco: 'Inferiores e core',
    itens: [
      ['Agachamento goblet', 3],
      ['Levantamento terra romeno', 3],
      ['Avanço para trás com halteres', 3],
      ['Panturrilha em pé com halteres', 3],
      ['Panturrilha sentado', 3],
      ['Prancha', 3, '30 s'],
    ],
  },
  {
    titulo: 'Treino B',
    foco: 'Posteriores, glúteos, superiores e core',
    itens: [
      ['Elevação pélvica com barra', 3],
      ['Mesa flexora', 3],
      ['Puxada frontal pegada aberta', 3],
      ['Supino reto com halteres', 3],
      ['Remada unilateral com halter (serrote)', 3],
      ['Monster walk (caminhada com elástico)', 2, '12 passos cada lado'],
      ['Prancha lateral', 2, '30 s cada lado'],
    ],
  },
  {
    titulo: 'Treino C',
    foco: 'Unilateral e pliometria',
    itens: [
      [
        'Saltos sobre barreiras',
        3,
        '5',
        'Saltos reativos: contato curto com o chão, como uma mola. Descanso completo.',
      ],
      [
        'Progressão de saltos unilaterais sobre cones',
        3,
        '5 cada perna',
        'Aterrisse estável e já salte de novo. Pare se a técnica cair.',
      ],
      ['Subida no banco com halteres', 3],
      ['Levantamento terra unilateral com kettlebell', 3],
      ['Prancha de Copenhague curta (joelho apoiado)', 2, '20 s cada lado'],
      ['Pallof press', 2, '10 cada lado'],
    ],
  },
  {
    titulo: 'Treino D',
    foco: 'Prevenção: panturrilha, quadril e core',
    itens: [
      ['Panturrilha em pé com halteres', 3, '12 a 15', 'Desça devagar, em 3 segundos.'],
      ['Panturrilha sentado', 3, '12 a 15', 'Trabalha o sóleo, muito exigido na corrida.'],
      ['Monster walk (caminhada com elástico)', 3, '12 passos cada lado'],
      ['Ponte de glúteos unilateral', 3, '10 cada lado'],
      ['Prancha de Copenhague curta (joelho apoiado)', 3, '20 s cada lado'],
      ['Bird dog', 3, '8 cada lado'],
    ],
  },
];
/* ---------- Biblioteca Nexos: treinos de força prontos ----------
   Montados com os exercícios da biblioteca do app. Séries e repetições seguem a fase da semana do aluno.
   Corredor: força pesada, unilateral e pliometria melhoram a economia de corrida (Llanos-Lagos et al. 2024; Blagrove et
   al. 2018). Prevenção: panturrilha (gastrocnêmio e sóleo), glúteo médio, adutores e core, regiões mais ligadas às lesões
   do corredor. Iniciante: corpo inteiro 2 a 3 vezes por semana, com máquinas e halteres para aprender os movimentos.
   Hipertrofia: divisão superiores e inferiores, cada grupo 2 vezes por semana (Schoenfeld et al. 2016). */
const CAT_TN = [
  ['corredor', 'Para corredores'],
  ['prev', 'Prevenção de lesão do corredor'],
  ['ini', 'Iniciante: corpo inteiro'],
  ['hip', 'Hipertrofia: superiores e inferiores'],
];
const TREINOS_NEXOS = [
  { id: 'cor-a', cat: 'corredor', nome: 'Corredor A', ...TREINOS_BASE_F[0] },
  { id: 'cor-b', cat: 'corredor', nome: 'Corredor B', ...TREINOS_BASE_F[1] },
  { id: 'cor-c', cat: 'corredor', nome: 'Corredor C', ...TREINOS_BASE_F[2] },
  { id: 'prev-a', cat: 'prev', nome: 'Prevenção do corredor', ...TREINOS_BASE_F[3] },
  {
    id: 'prev-p',
    cat: 'prev',
    nome: 'Pliometria do corredor',
    foco: 'Saltos e elasticidade',
    itens: [
      ['Skipping rápido', 3, '20 s', 'Contato curto com o chão.'],
      ['Agachamento com salto sem peso', 3, '6', 'Aterrisse macio e já salte de novo.'],
      ['Salto com afundo alternado', 3, '6 cada lado'],
      ['Saltos sobre barreiras', 3, '5', 'Saltos reativos: contato curto com o chão. Descanso completo.'],
      ['Prancha', 3, '30 s'],
    ],
  },
  {
    id: 'ini-a',
    cat: 'ini',
    nome: 'Corpo inteiro A',
    foco: 'Iniciante, máquinas',
    itens: [
      ['Leg press', 3],
      ['Supino reto na máquina', 3],
      ['Puxada frontal pegada aberta', 3],
      ['Mesa flexora sentada', 3],
      ['Elevação lateral com halteres', 2],
      ['Prancha', 3, '20 a 30 s'],
    ],
  },
  {
    id: 'ini-b',
    cat: 'ini',
    nome: 'Corpo inteiro B',
    foco: 'Iniciante, halteres e cabo',
    itens: [
      ['Agachamento goblet', 3],
      ['Remada baixa no cabo', 3],
      ['Desenvolvimento de ombros na máquina', 3],
      ['Ponte de glúteos', 3],
      ['Panturrilha em pé na máquina', 3],
      ['Dead bug', 3, '8 cada lado'],
    ],
  },
  {
    id: 'hip-s',
    cat: 'hip',
    nome: 'Superiores',
    foco: 'Peito, costas, ombros e braços',
    itens: [
      ['Supino reto com barra (pegada média)', 4],
      ['Remada curvada com barra', 4],
      ['Desenvolvimento com halteres', 3],
      ['Puxada frontal com pegada supinada', 3],
      ['Rosca direta com barra', 3],
      ['Tríceps corda', 3],
    ],
  },
  {
    id: 'hip-i',
    cat: 'hip',
    nome: 'Inferiores',
    foco: 'Quadríceps, posteriores, glúteos e panturrilha',
    itens: [
      ['Agachamento livre com barra', 4],
      ['Levantamento terra romeno', 3],
      ['Leg press', 3],
      ['Cadeira extensora', 3],
      ['Mesa flexora', 3],
      ['Panturrilha em pé na máquina', 3],
    ],
  },
];
/** os treinos prontos no formato de modelo (com o id de cada exercício da biblioteca) */
async function modelosNexos() {
  if (S.cache.mdNx) return S.cache.mdNx;
  const nomes = [...new Set(TREINOS_NEXOS.flatMap((t) => t.itens.map((x) => x[0])))];
  const { data } = await sb.from('nx_exercicios').select('id,nome,org_id').in('nome', nomes);
  const idDe = {};
  (data || []).forEach((e) => {
    if (!idDe[e.nome] || e.org_id === S.org.id) idDe[e.nome] = e.id;
  });
  S.cache.mdNx = TREINOS_NEXOS.map((t) => ({
    id: 'nx:' + t.id,
    cat: t.cat,
    nome: t.nome,
    foco: t.foco,
    observacoes: 'Séries e repetições seguem a fase da semana, que aparece no topo do treino.',
    nexos: true,
    itens: t.itens
      .filter(([n]) => idDe[n])
      .map(([n, series, reps, obs]) => ({
        exercicio_id: idDe[n],
        _nome: n,
        series,
        repeticoes: reps || '',
        carga: '',
        descanso_seg: reps === '5' || reps === '6' ? 120 : 90,
        observacao: obs || '',
      })),
  }));
  return S.cache.mdNx;
}
/** Biblioteca: treinos prontos (Nexos e os seus modelos) e, para o aluno, os ciclos de força prontos */
async function bibliotecaForca({ alunoId = null, aoTreino, aba = 'treinos', ciclos = true }) {
  const [nx, seus] = await Promise.all([modelosNexos(), buscarModelosTreino()]);
  const exNome = (md, it) => it._nome || (S.cache.ex || []).find((e) => e.id === it.exercicio_id)?.nome || 'Exercício';
  const cartao = (md) =>
    `<div class="bib-t" data-md="${md.id}"><button type="button" class="list-item bib-tb" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.lib}</span><div class="grow"><b>${esc(md.nome)}</b><div class="small muted">${md.foco ? esc(md.foco) + ' · ' : ''}${(md.itens || []).length} exercícios</div></div>${I.chev}</button>
    <div class="bib-prev" hidden><ol>${(md.itens || []).map((it) => `<li>${esc(exNome(md, it))}${it.repeticoes ? ` <span class="dim">· ${esc(it.series || 3)} × ${esc(it.repeticoes)}</span>` : ''}</li>`).join('')}</ol><button type="button" class="btn sm block" data-usar="${md.id}">${I.plus} Usar este treino</button></div></div>`;
  const treinosH = () =>
    `${seus.length ? `<p class="sec-lbl">Seus modelos</p><div class="stack">${seus.map(cartao).join('')}</div>` : ''}
    ${CAT_TN.map(
      ([k, n]) =>
        `<p class="sec-lbl">${n}</p><div class="stack">${nx
          .filter((m) => m.cat === k)
          .map(cartao)
          .join('')}</div>`,
    ).join('')}`;
  const ciclosH = () =>
    `<p class="small muted" style="margin:8px 0 0">Cada semana recebe a sua fase (repetições e carga). Se o aluno ainda não tiver treino com dia, o app monta os treinos na hora de aplicar.</p>${CF_OBJ.map(
      ([k, n]) => {
        const l = CICLOS_FORCA.filter((c) => c.obj === k);
        return l.length
          ? `<p class="sec-lbl">${esc(n)}</p><div class="stack">${l.map((c) => `<button type="button" class="list-item" data-cic="${c.id}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.hist}</span><div class="grow"><b>${esc(c.nome)}</b><div class="small muted">${CIC_NIV[c.niv] || ''} · ${cfFases(c).length} semanas · ${esc(c.modelo)}</div></div>${I.chev}</button>`).join('')}</div>`
          : '';
      },
    ).join('')}
    <p class="sec-lbl">Trilhas: ciclos em sequência</p><div class="stack">${TRILHAS_FORCA.map((t) => {
      const cs = t.seq.map((x) => CICLOS_FORCA.find((c) => c.id === x)).filter(Boolean);
      return `<button type="button" class="list-item" data-trl="${t.id}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.hist}</span><div class="grow"><b>${esc(t.nome)}</b><div class="small muted">${CIC_NIV[t.niv] || ''} · ${cs.length} ciclos · ${cs.reduce((a, c) => a + cicSem(c), 0)} semanas</div></div>${I.chev}</button>`;
    }).join('')}</div>
    <p class="sec-lbl">Ano inteiro</p><a class="list-item" href="#/treinos/ciclos/anual" style="color:inherit"><span class="ativ-ic">${I.hist}</span><div class="grow"><b>Macrociclo anual</b><div class="small muted">Corrida do ano pelas provas, com a musculação acompanhando</div></div>${I.chev}</a>`;
  openSheet(
    `<p class="eyebrow">Biblioteca Nexos</p><div class="h2" style="margin-top:4px">${ciclos ? 'Treinos e ciclos prontos' : 'Escolha um treino pronto'}</div>
    ${ciclos ? `<div class="seg bib-abas" style="margin-top:12px"><button type="button" data-ba="treinos">Treinos prontos</button><button type="button" data-ba="ciclos">Ciclos prontos</button></div>` : ''}
    <div id="bib-c"></div>`,
    (r) => {
      const pinta = (a) => {
        aba = a;
        r.querySelectorAll('[data-ba]').forEach((b) => b.classList.toggle('on', b.dataset.ba === a));
        r.querySelector('#bib-c').innerHTML = a === 'ciclos' ? ciclosH() : treinosH();
      };
      pinta(ciclos ? aba : 'treinos');
      r.onclick = (e) => {
        const ba = e.target.closest('[data-ba]');
        if (ba) return pinta(ba.dataset.ba);
        const us = e.target.closest('[data-usar]');
        if (us) {
          const md = [...seus, ...nx].find((m) => m.id === us.dataset.usar);
          closeSheet();
          return md && aoTreino(md);
        }
        const tb = e.target.closest('.bib-tb');
        if (tb) {
          const pv = tb.parentElement.querySelector('.bib-prev');
          pv.hidden = !pv.hidden;
          tb.classList.toggle('aberto', !pv.hidden);
          return;
        }
        const tr = e.target.closest('[data-trl]');
        if (tr) {
          const t = TRILHAS_FORCA.find((x) => x.id === tr.dataset.trl);
          const cs = t.seq.map((x) => CICLOS_FORCA.find((c) => c.id === x)).filter(Boolean);
          closeSheet();
          if (alunoId) S.cache.cicPre = { aluno: alunoId };
          setTimeout(
            () =>
              aplicarTrilha(
                t,
                cs,
                true,
                cs.reduce((a, c) => a + cicSem(c), 0),
              ),
            250,
          );
          return;
        }
        if (e.target.closest('a[href]')) return closeSheet();
        const ci = e.target.closest('[data-cic]');
        if (ci) {
          const c = CICLOS_FORCA.find((x) => x.id === ci.dataset.cic);
          closeSheet();
          if (alunoId) S.cache.cicPre = { aluno: alunoId };
          setTimeout(() => cfAplicar(c, cfFases(c)), 250);
        }
      };
    },
  );
}
// dias padrão quando o aluno não marcou os dias de força (0 = segunda)
const DIAS_BASE_F = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4] };
/** quantos treinos de força por semana sugerir: os dias de força que o aluno marcou; sem marcação, 2 para quem
    também corre (dose mais usada nos estudos com corredores) e 3 para quem só faz musculação */
const sugestaoTreinosF = (m) => {
  const dp = dispDe(m),
    off = dp.off_forca || [];
  const n = [...new Set(dp.forca || [])].filter((d) => !off.includes(d)).length;
  if (n) return { n: Math.min(4, Math.max(2, n)), por: `pelos ${n} dia${n > 1 ? 's' : ''} de força que ele marcou` };
  return faz('corrida', m)
    ? { n: 2, por: 'ele também corre: 2 por semana é a dose mais usada para corredor' }
    : { n: 3, por: 'só musculação: 3 por semana trabalha cada grupo duas vezes ou mais' };
};
// escolhe os dias: os marcados pelo aluno (espalhados na semana), completando com os dias padrão
const escolherDiasF = (m, s) => {
  const dp = dispDe(m),
    off = dp.off_forca || [];
  const marc = [...new Set(dp.forca || [])].filter((d) => !off.includes(d)).sort((x, y) => x - y);
  if (marc.length >= s) return Array.from({ length: s }, (_, k) => marc[Math.floor((k * marc.length) / s)]);
  const dias = [...marc];
  for (const d of [...DIAS_BASE_F[s], 0, 1, 2, 3, 4, 5, 6]) {
    if (dias.length >= s) break;
    if (!dias.includes(d) && !off.includes(d)) dias.push(d);
  }
  return dias.sort((x, y) => x - y);
};
/** garante que a semana de força do aluno tenha treinos nos dias. s = treinos por semana (2 a 4).
    Devolve um texto curto para o aviso, ou '' quando o aluno já tem treinos com dia (o ciclo só troca a fase) */
async function garantirTreinosForca(alunoId, s, inicio) {
  const [m, treinos] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,modalidades,disponibilidade')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle()
      .then((r) => r.data || {}),
    sb
      .from('nx_treinos')
      .select('id,titulo,ativo,dias,ordem')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .order('ordem')
      .then((r) => r.data || []),
  ]);
  const ativos = treinos.filter((t) => t.ativo);
  if (ativos.some((t) => t.dias && t.dias.length)) return '';
  s = Math.min(4, Math.max(2, s || sugestaoTreinosF(m).n));
  const dias = escolherDiasF(m, s);
  const nomesDias = (l) => l.map((d) => DSEM[d].toLowerCase()).join(', ');
  // 1) já tem treinos, só sem dia: distribui nos dias, em sequência (A, B, C, A…)
  if (ativos.length) {
    const map = {};
    dias.forEach((d, k) => {
      const t = ativos[k % ativos.length];
      map[t.id] = [...(map[t.id] || []), d];
    });
    for (const t of ativos) {
      if (!map[t.id]) continue;
      const { error } = await sb
        .from('nx_treinos')
        .update({ dias: map[t.id], ...(inicio ? { inicio } : {}) })
        .eq('id', t.id);
      if (error) throw error;
    }
    return `Os treinos de força dele foram para ${nomesDias(dias)}.`;
  }
  // 2) não tem treino nenhum: monta os treinos base
  // 4 por semana: A, B, C e o D de prevenção (força pesada + pliometria + prevenção: Llanos-Lagos et al. 2024)
  const base = TREINOS_BASE_F.slice(0, s);
  const nomes = [...new Set(base.flatMap((t) => t.itens.map((x) => x[0])))];
  const { data: exs } = await sb.from('nx_exercicios').select('id,nome,org_id').in('nome', nomes);
  const idDe = {};
  (exs || []).forEach((e) => {
    if (!idDe[e.nome] || e.org_id === S.org.id) idDe[e.nome] = e.id;
  });
  const diasDe = base.map(() => []);
  dias.forEach((d, k) => diasDe[k % base.length].push(d));
  const agora = new Date().toISOString();
  const { data: novos, error } = await sb
    .from('nx_treinos')
    .insert(
      base.map((t, i) => ({
        org_id: S.org.id,
        aluno_id: alunoId,
        titulo: t.titulo,
        foco: t.foco,
        observacoes: 'Séries e repetições seguem a fase da semana, que aparece no topo do treino.',
        ativo: true,
        ordem: treinos.length + i,
        dias: diasDe[i].length ? diasDe[i] : null,
        ...(inicio ? { inicio } : {}),
        criado_por: S.user.id,
        atualizado_em: agora,
      })),
    )
    .select('id,titulo');
  if (error) throw error;
  const itens = [];
  (novos || []).forEach((nv) => {
    const t = base.find((x) => x.titulo === nv.titulo);
    t.itens
      .filter(([nome]) => idDe[nome])
      .forEach(([nome, series, reps, obs], k) =>
        itens.push({
          treino_id: nv.id,
          exercicio_id: idDe[nome],
          ordem: k,
          series,
          repeticoes: reps || null,
          descanso_seg: reps === '5' ? 120 : 90,
          observacao: obs || null,
        }),
      );
  });
  if (itens.length) {
    const { error: e2 } = await sb.from('nx_treino_itens').insert(itens);
    if (e2) throw e2;
  }
  return `Montamos ${s} treinos de força por semana (${base
    .map((t, i) => `${t.titulo} na ${nomesDias(diasDe[i])}`)
    .join('; ')}). Ajuste os exercícios se quiser.`;
}
/* escolha de quantos treinos de força por semana, na hora de aplicar um ciclo, trilha ou macrociclo */
const escTreinosFHTML = () =>
  `<div class="field ntf-box"><span>Treinos de força por semana</span><div class="seg ntf" id="ntf">${[2, 3, 4]
    .map((n) => `<button type="button" data-ntf="${n}">${n}x</button>`)
    .join('')}</div><p class="tiny dim" id="ntf-info">Escolha o aluno para ver a sugestão.</p></div>`;
/** liga o seletor; devolve uma função que diz o número escolhido */
function ligarTreinosF(r, alunos) {
  let n = null;
  const box = r.querySelector('.ntf-box'),
    info = r.querySelector('#ntf-info');
  const marca = () => box.querySelectorAll('[data-ntf]').forEach((b) => b.classList.toggle('on', +b.dataset.ntf === n));
  box.querySelector('#ntf').onclick = (e) => {
    const b = e.target.closest('[data-ntf]');
    if (!b || b.disabled) return;
    n = +b.dataset.ntf;
    marca();
    info.textContent =
      n === 4
        ? '4 por semana: A (inferiores), B (posteriores e superiores), C (unilateral e pliometria) e D (prevenção).'
        : n === 3
          ? '3 por semana: A (inferiores), B (posteriores e superiores) e C (unilateral e pliometria).'
          : '2 por semana: A (inferiores) e B (posteriores e superiores).';
  };
  const atualizar = async (alunoId) => {
    n = null;
    box.querySelectorAll('[data-ntf]').forEach((b) => (b.disabled = false));
    marca();
    if (!alunoId) return (info.textContent = 'Escolha o aluno para ver a sugestão.');
    const m = alunos.find((x) => x.user_id === alunoId) || {};
    const tr = await sb
      .from('nx_treinos')
      .select('titulo,dias,ativo')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .then(
        (x) => (x.data || []).filter((t) => t.ativo),
        () => [],
      );
    const comDia = tr.filter((t) => t.dias && t.dias.length);
    if (comDia.length) {
      box.querySelectorAll('[data-ntf]').forEach((b) => (b.disabled = true));
      info.innerHTML = `Ele já tem treinos com dia: ${comDia.map((t) => `<b>${esc(t.titulo)}</b> (${diasTxt(t.dias)})`).join(', ')}. O ciclo mantém esses treinos e só troca a fase. Para montar de novo, apague os treinos na aba Força.`;
      return;
    }
    const sg = sugestaoTreinosF(m);
    n = sg.n;
    marca();
    info.textContent = `Sugestão: ${sg.n} por semana (${sg.por}).`;
  };
  return { atualizar, valor: () => n };
}
async function cfAplicar(c, fs) {
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,ativo,aprovacao,treinador_id,modalidades,disponibilidade')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const alunos = ms.filter(
    (m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado' && faz('musculacao', m),
  );
  const prox = (() => {
    const d = inicioSemana();
    d.setDate(d.getDate() + 7);
    return isoDia(d);
  })();
  const pre = S.cache.cicPre || {};
  S.cache.cicPre = null;
  openSheet(
    `<p class="eyebrow">Aplicar ciclo de força</p><div class="h2" style="margin-top:4px">${esc(c.nome)}</div>
    <form id="f-cf" style="margin-top:14px">
      <label class="field"><span>Aluno</span><select class="input" name="aluno" required><option value="">Escolha o aluno</option>${alunos.map((m) => `<option value="${m.user_id}" ${pre.aluno === m.user_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></label>
      <label class="field"><span>Começa na segunda-feira</span><input class="input" type="date" name="ini" value="${pre.ini || prox}" required></label>
      <p class="small" id="cf-fim" style="margin:-4px 0 10px;color:var(--acc)"></p>
      ${escTreinosFHTML()}
      <p class="tiny dim" style="margin-bottom:12px">As fases dessas semanas são trocadas pelas do ciclo. Se o aluno ainda não tiver treino de força nos dias, o app monta os treinos base e põe nos dias de força dele. Tudo fica em rascunho até você liberar a semana.</p>
      <button class="btn block" type="submit">Aplicar ${fs.length} semana${fs.length > 1 ? 's' : ''}</button></form>`,
    (r) => {
      const f = r.querySelector('#f-cf');
      const ntf = ligarTreinosF(r, alunos);
      f.aluno.addEventListener('change', () => ntf.atualizar(f.aluno.value));
      if (f.aluno.value) ntf.atualizar(f.aluno.value);
      const atual = () => {
        const ini = isoDia(inicioSemana(dia(f.ini.value || prox)));
        const fim = dia(ini);
        fim.setDate(fim.getDate() + 7 * fs.length - 1);
        r.querySelector('#cf-fim').textContent = `Vai de ${fmtDia(ini)} a ${fmtDia(isoDia(fim))}.`;
      };
      f.oninput = atual;
      atual();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const alunoId = f.aluno.value;
        if (!alunoId) return toast('Escolha o aluno.', true);
        const b = f.querySelector('button[type=submit]');
        b.disabled = true;
        const ini = inicioSemana(dia(f.ini.value || prox));
        const rows = fs.map((fase, i) => {
          const d = new Date(ini);
          d.setDate(d.getDate() + 7 * i);
          return { org_id: S.org.id, aluno_id: alunoId, semana: isoDia(d), fase, criado_por: S.user.id };
        });
        try {
          await gravarFasesForca(alunoId, rows);
        } catch (error) {
          console.error(error);
          b.disabled = false;
          return toast('Não foi possível aplicar. Tente de novo.', true);
        }
        const m = alunos.find((x) => x.user_id === alunoId);
        registrarCiclo(alunoId, 'forca', c, ini, fs.length);
        const extra = await garantirTreinosForca(alunoId, ntf.valor(), isoDia(ini)).catch((er) => {
          console.error(er);
          return 'Atenção: não foi possível montar os treinos da semana. Monte em Força.';
        });
        closeSheet(true);
        toast(`Ciclo aplicado: ${fs.length} semanas de ${firstName(m && m.nome)}.${extra ? ' ' + extra : ''}`);
        location.hash = `#/aluno/${alunoId}/forca`;
      };
    },
  );
}
/* ---------- Sequência entre ciclos: o que fazer quando um ciclo termina ----------
   Regras: sobrecarga progressiva (o próximo ciclo começa perto do volume em que o anterior terminou, sem saltos grandes —
   Nielsen et al. 2014), periodização em sequência (Issurin 2010; Haugen et al. 2022), recuperação depois de provas longas
   e semana leve entre blocos de força (Bell et al. 2023). Depois de cada teste, as zonas novas deixam o mesmo ciclo mais forte. */
const SEQ_POR = {
  rec: 'Depois de prova longa: 1 a 2 semanas leves. A recuperação da inflamação e do dano muscular cresce com a distância da prova (Alves et al. 2022).',
  base: 'Consolidar a base: volume leve antes de voltar à intensidade. Uma base maior sustenta treinos mais fortes depois.',
  sobe: 'Próximo degrau: o mesmo tipo de trabalho com mais volume e intensidade (sobrecarga progressiva).',
  dist: 'Próxima distância: aproveita a base construída para uma prova mais longa.',
  bloco: 'Bloco curto para desenvolver uma qualidade (limiar ou VO₂) antes do próximo ciclo de prova.',
  repete: 'Repetir a estrutura com os ritmos novos do teste: mesmo treino, mais rápido.',
  trans: 'Transição: descanso ativo para recuperar o corpo e a cabeça antes da próxima temporada.',
  pre: 'Começo de temporada: base aeróbica antes dos ciclos de prova.',
  prova: 'Ciclo de prova: com a base e o limiar feitos, entra a parte específica da prova-alvo.',
  pol: 'Polimento: reduz o volume para chegar descansado na prova.',
  acum: 'Volta à acumulação (hipertrofia): músculo maior dá base para a próxima fase de força.',
  forca: 'Converter a base em força: menos repetições e mais carga.',
  pot: 'Transformar a força em potência: carga moderada movida rápido.',
  varia:
    'Variar o estímulo com o mesmo volume: para hipertrofia os modelos rendem parecido; para força, o ondulatório tem pequena vantagem em quem já treina (Moesgaard et al. 2022). Trocar o modelo também ajuda quando o aluno estagna.',
  leve: 'Semana leve antes do próximo bloco: recupera e consolida os ganhos.',
  menos:
    'Mês com menos provas: quando o aluno acumulou cansaço, reduz o número de provas e volta a ter semanas de treino completas.',
  corr: 'Ajustar a força à fase da corrida: pesado na base, manutenção na temporada de provas.',
};
const SEQ_CORR = {
  'ini-zero': [
    ['ini-base', 'base'],
    ['5k-ini', 'dist'],
  ],
  'ini-30': [
    ['ini-base', 'base'],
    ['5k-ini', 'dist'],
  ],
  'ini-base': [
    ['5k-ini', 'prova'],
    ['10k-ini', 'dist'],
  ],
  '5k-ini': [
    ['10k-ini', 'dist'],
    ['bl-base-int', 'sobe'],
    ['5k-ini', 'repete'],
  ],
  '5k-int4': [
    ['bl-lim-int', 'bloco'],
    ['10k-int', 'dist'],
    ['5k-int', 'repete'],
  ],
  '5k-int': [
    ['bl-base-int', 'base'],
    ['10k-int', 'dist'],
    ['5k-ava', 'sobe'],
  ],
  '5k-ava': [
    ['bl-base-ava', 'base'],
    ['10k-ava', 'dist'],
    ['5k-ava', 'repete'],
  ],
  '5k-pro': [
    ['bl-lim-pro', 'bloco'],
    ['10k-pro', 'dist'],
  ],
  '10k-ini': [
    ['bl-base-int', 'sobe'],
    ['21k-ini', 'dist'],
    ['10k-int', 'sobe'],
  ],
  '10k-int': [
    ['bl-lim-int', 'bloco'],
    ['21k-int', 'dist'],
    ['10k-ava', 'sobe'],
  ],
  '10k-ava': [
    ['bl-lim-ava', 'bloco'],
    ['21k-ava', 'dist'],
    ['10k-ava', 'repete'],
  ],
  '10k-pro': [
    ['bl-lim-pro', 'bloco'],
    ['21k-pro', 'dist'],
  ],
  '21k-ini': [
    ['bl-pos', 'rec'],
    ['10k-int', 'sobe'],
    ['21k-int', 'sobe'],
  ],
  '21k-int': [
    ['bl-pos', 'rec'],
    ['42k-int16', 'dist'],
    ['21k-ava', 'sobe'],
  ],
  '21k-ava': [
    ['bl-pos', 'rec'],
    ['42k-ava', 'dist'],
    ['10k-ava', 'bloco'],
  ],
  '21k-pro': [
    ['bl-pos', 'rec'],
    ['42k-pro', 'dist'],
  ],
  '42k-int16': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['bl-base-int', 'base'],
  ],
  '42k-int12': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['bl-base-int', 'base'],
  ],
  '42k-ava': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['bl-base-ava', 'base'],
  ],
  '42k-pro': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['bl-lim-pro', 'bloco'],
  ],
  'ul-int': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['ul-ava', 'sobe'],
  ],
  'ul-ava': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
  ],
  'bl-pre': [
    ['bl-lim-int', 'bloco'],
    ['10k-int', 'prova'],
    ['21k-int', 'prova'],
  ],
  'bl-base-int': [
    ['bl-lim-int', 'bloco'],
    ['10k-int', 'prova'],
  ],
  'bl-base-ava': [
    ['bl-lim-ava', 'bloco'],
    ['10k-ava', 'prova'],
  ],
  'bl-lim-int': [
    ['bl-vo2', 'bloco'],
    ['10k-int', 'prova'],
    ['21k-int', 'prova'],
  ],
  'bl-lim-ava': [
    ['bl-vo2', 'bloco'],
    ['10k-ava', 'prova'],
    ['21k-ava', 'prova'],
  ],
  'bl-lim-pro': [
    ['10k-pro', 'prova'],
    ['21k-pro', 'prova'],
    ['42k-pro', 'prova'],
  ],
  'bl-vo2': [
    ['bl-pol', 'pol'],
    ['5k-ava', 'prova'],
    ['10k-ava', 'prova'],
  ],
  'bl-pol': [['bl-pos', 'rec']],
  'bl-pos': [
    ['bl-trans', 'trans'],
    ['bl-base-int', 'base'],
    ['bl-pre', 'pre'],
  ],
  'bl-trans': [
    ['bl-pre', 'pre'],
    ['bl-base-int', 'base'],
  ],
};
const SEQ_FORCA = {
  'cf-adapt': [
    ['cf-hip-ini', 'acum'],
    ['cf-resist', 'repete'],
  ],
  'cf-resist': [
    ['cf-hip-ini', 'acum'],
    ['cf-lin', 'forca'],
  ],
  'cf-rev': [
    ['cf-deload', 'leve'],
    ['cf-hip-int', 'acum'],
  ],
  'cf-hip-ini': [
    ['cf-hip-int', 'sobe'],
    ['cf-lin', 'forca'],
    ['cf-flex', 'varia'],
  ],
  'cf-hip-int': [
    ['cf-deload', 'leve'],
    ['cf-dup', 'varia'],
    ['cf-lin', 'forca'],
  ],
  'cf-hip-wup': [
    ['cf-dup', 'varia'],
    ['cf-blocos', 'forca'],
  ],
  'cf-dup': [
    ['cf-deload', 'leve'],
    ['cf-blocos', 'forca'],
    ['cf-conj', 'varia'],
  ],
  'cf-flex': [
    ['cf-dup', 'varia'],
    ['cf-rir', 'varia'],
  ],
  'cf-rir': [
    ['cf-blocos', 'forca'],
    ['cf-dup', 'varia'],
  ],
  'cf-conj': [
    ['cf-deload', 'leve'],
    ['cf-blocos', 'varia'],
  ],
  'cf-lin': [
    ['cf-deload', 'leve'],
    ['cf-pot', 'pot'],
    ['cf-blocos', 'varia'],
  ],
  'cf-blocos': [
    ['cf-deload', 'leve'],
    ['cf-hip-int', 'acum'],
    ['cf-conj', 'varia'],
  ],
  'cf-pot': [
    ['cf-deload', 'leve'],
    ['cf-hip-int', 'acum'],
  ],
  'cf-corr-pre': [
    ['cf-corr', 'corr'],
    ['cf-corr-temp', 'corr'],
  ],
  'cf-corr': [['cf-corr-temp', 'corr']],
  'cf-corr-temp': [
    ['cf-corr-temp', 'corr'],
    ['cf-deload', 'leve'],
    ['cf-corr-pre', 'corr'],
  ],
  'cf-anual': [
    ['cf-deload', 'leve'],
    ['cf-hip-int', 'acum'],
  ],
  'cf-deload': [
    ['cf-hip-int', 'acum'],
    ['cf-lin', 'forca'],
    ['cf-corr-pre', 'corr'],
  ],
};
// modelos de treino: sobe de nível no mesmo modelo, ou repete com os ritmos novos
const seqModelo = (c) => {
  const nx = { ini: 'int', int: 'ava', ava: 'pro' }[c.niv];
  const out = [];
  if (nx && c.niv !== 'ava') out.push([`m-${c.mod}-${nx}`, 'sobe']);
  out.push([c.id, 'repete']);
  if (c.niv === 'ini') out.push(['10k-ini', 'dist']);
  if (c.niv === 'ava') out.push(['bl-lim-ava', 'bloco']);
  if (c.niv === 'pro') out.push(['bl-trans', 'trans']);
  return out;
};
const proximosCorr = (c) =>
  (c.mod ? seqModelo(c) : SEQ_CORR[c.id] || [])
    .map(([id, k]) => [CICLOS_CORR.find((x) => x.id === id), k])
    .filter((x) => x[0]);
// se o ciclo já termina com semana leve, não sugere outra
const proximosForca = (c) =>
  (SEQ_FORCA[c.id] || [])
    .filter(([id]) => !(id === 'cf-deload' && c.seq.endsWith('L')))
    .map(([id, k]) => [CICLOS_FORCA.find((x) => x.id === id), k])
    .filter((x) => x[0]);
const seqHTML = (lista, base) =>
  lista.length
    ? `<p class="sec-lbl">Depois deste ciclo</p><div class="stack">${lista.map(([n, k]) => `<a class="card tap seq-it" href="${base}${n.id}" style="color:inherit"><div class="grow" style="min-width:0"><b>${esc(n.nome)}</b><div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap"><span class="tag">${n.sem || (n.seq || '').length} semana${(n.sem || (n.seq || '').length) > 1 ? 's' : ''}</span><span class="tag acc">${CIC_NIV[n.niv]}</span></div><p class="small muted" style="margin-top:6px">${SEQ_POR[k]}</p></div>${I.chev}</a>`).join('')}</div><p class="tiny dim" style="margin-top:8px">O ciclo começa na segunda-feira seguinte ao fim deste. Antes de subir de nível, o aluno deve ter feito a maior parte dos treinos sem dor nem cansaço acumulado; se não fez, repita o ciclo ou fique no mesmo nível.</p>`
    : '';
// trilhas: vários ciclos encadeados de uma vez
const TRILHAS_CORR = [
  {
    id: 't-zero-21',
    nome: 'Do zero à primeira meia maratona',
    niv: 'ini',
    seq: ['ini-zero', 'ini-base', '5k-ini', '10k-ini', '21k-ini', 'bl-pos'],
    desc: 'Para quem está começando do zero: corre e caminha, base, primeiros 5 km, primeiros 10 km e a primeira meia, com recuperação no fim.',
  },
  {
    id: 't-5-10',
    nome: 'Dos 5 aos 10 km',
    niv: 'ini',
    seq: ['ini-base', '5k-ini', '10k-ini'],
    desc: 'Para quem já corre 30 min: base, melhora dos 5 km e os primeiros 10 km.',
  },
  {
    id: 't-temp-21',
    nome: 'Temporada de meia maratona',
    niv: 'int',
    seq: ['bl-pre', 'bl-lim-int', '21k-int', 'bl-pos'],
    desc: 'Pré-temporada, bloco de limiar, ciclo da meia e recuperação.',
  },
  {
    id: 't-temp-42',
    nome: 'Temporada de maratona',
    niv: 'int',
    seq: ['bl-pre', 'bl-lim-int', '42k-int16', 'bl-pos', 'bl-trans'],
    desc: 'Pré-temporada, limiar, ciclo de 16 semanas, recuperação e transição.',
  },
  {
    id: 't-temp-10a',
    nome: 'Temporada de 10 km · avançado',
    niv: 'ava',
    seq: ['bl-base-ava', 'bl-lim-ava', 'bl-vo2', '10k-ava', 'bl-trans'],
    desc: 'Base, limiar, VO₂ e o ciclo de 10 km, em blocos.',
  },
  {
    id: 't-temp-42a',
    nome: 'Temporada de maratona · avançado',
    niv: 'ava',
    seq: ['bl-base-ava', 'bl-lim-ava', '42k-ava', 'bl-pos', 'bl-trans'],
    desc: 'Base, limiar, ciclo de maratona de 16 semanas, recuperação e transição.',
  },
  {
    id: 't-ultra',
    nome: 'Da maratona à ultra de 50 km',
    niv: 'int',
    seq: ['bl-trans', 'bl-base-int', 'ul-int', 'bl-pos'],
    desc: 'Para quem acabou de correr uma maratona e quer a primeira ultra.',
  },
];
const TRILHAS_FORCA = [
  {
    id: 'tf-ini',
    nome: 'Do iniciante ao intermediário',
    niv: 'ini',
    seq: ['cf-adapt', 'cf-hip-ini', 'cf-lin'],
    desc: 'Adaptação, hipertrofia e força linear, com as semanas leves de cada ciclo.',
  },
  {
    id: 'tf-hip',
    nome: 'Hipertrofia contínua',
    niv: 'int',
    seq: ['cf-hip-int', 'cf-dup', 'cf-hip-wup', 'cf-blocos'],
    desc: 'Alterna modelos (blocos, ondulatório diário e semanal) para continuar ganhando sem estagnar.',
  },
  {
    id: 'tf-forca',
    nome: 'Força máxima e potência',
    niv: 'ava',
    seq: ['cf-hip-int', 'cf-lin', 'cf-deload', 'cf-blocos'],
    desc: 'Acumulação, força linear e blocos até a potência.',
  },
  {
    id: 'tf-corr',
    nome: 'Força do corredor: temporada completa',
    niv: 'int',
    seq: ['cf-corr-pre', 'cf-corr', 'cf-corr-temp', 'cf-corr-temp'],
    desc: 'Base de força na pré-temporada, força e potência na construção e manutenção durante as provas.',
  },
];
const cicSem = (c) => c.sem || (c.seq || '').length;
// registra o ciclo aplicado (para o aviso de "ciclo terminando" e para sugerir o próximo)
const registrarCiclo = (alunoId, tipo, c, ini, semanas, trilha) => {
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 7 * semanas - 1);
  return sb
    .from('nx_ciclos_aplicados')
    .insert({
      org_id: S.org.id,
      aluno_id: alunoId,
      tipo,
      ciclo_id: c.id,
      nome: c.nome,
      inicio: isoDia(ini),
      fim: isoDia(fim),
      trilha: trilha || null,
      criado_por: S.user.id,
    })
    .then(
      () => {},
      () => {},
    );
};
// linhas da planilha de corrida de um ciclo
/** o ciclo do jeito que vai para este aluno: o dia do longão que o treinador escolheu e todas as conferências
    (intensidade, longão, volume, sessão mais longa, dias seguidos) feitas de novo com o ritmo do próprio aluno.
    Sem teste (treina por percepção de esforço), usa o ritmo médio do nível. */
function ciclParaAluno(c, perfil, dL = 'pad') {
  const pNiv = perfilNiv(c.niv),
    proprio = perfil && perfil.paces && !perfil.pse,
    pf = proprio ? perfil : pNiv;
  const W = cicSemanas(c).map((s) => ({
    ...s,
    sess: s.sess.map(([d, t]) => {
      let dd = d;
      if (dL !== 'pad' && t.tipo === 'longao') dd = +dL;
      else if (dL !== 'pad' && t.tipo !== 'prova' && d === +dL && s.sess.some(([, x]) => x.tipo === 'longao'))
        dd = dL === '5' ? 6 : 5;
      return [dd, t];
    }),
  }));
  W.forEach((w) => w.sess.sort((a, b) => a[0] - b[0]));
  const trail = ['trail', 'ultra'].includes(c.obj) || c.modo === 'trail';
  if (proprio) ajustarCiencia(W, pf, c);
  separarFortes(W, pf, trail);
  return limitarCargas(W, pf);
}
function linhasCiclo(c, alunoId, perfil, ini, dL) {
  const rows = [];
  ciclParaAluno(c, perfil, dL).forEach((s, i) =>
    s.sess.forEach(([dd, t]) => {
      const data = new Date(ini);
      data.setDate(data.getDate() + i * 7 + dd);
      const rs = resumoEstrutura(t.estrutura, perfil);
      rows.push({
        org_id: S.org.id,
        aluno_id: alunoId,
        data: isoDia(data),
        tipo: t.tipo,
        titulo: t.titulo,
        estrutura: t.estrutura,
        distancia_km: Math.round(rs.km * 10) / 10,
        duracao_min: Math.round(rs.seg / 60),
        zona: null,
        descricao: t.obs || null,
        liberado: false,
        criado_por: S.user.id,
      });
    }),
  );
  return rows;
}
function viewTrilha(id, forca) {
  const t = (forca ? TRILHAS_FORCA : TRILHAS_CORR).find((x) => x.id === id);
  if (!t) {
    location.replace(forca ? '#/treinos/ciclos-forca' : '#/treinos/ciclos');
    return;
  }
  const cs = t.seq.map((x) => (forca ? CICLOS_FORCA : CICLOS_CORR).find((c) => c.id === x)).filter(Boolean);
  const tot = cs.reduce((a, c) => a + cicSem(c), 0);
  const base = forca ? '#/treinos/ciclos-forca/' : '#/treinos/ciclos/';
  $app.innerHTML = `<a class="back" href="${forca ? '#/treinos/ciclos-forca' : '#/treinos/ciclos'}">${I.back} ${forca ? 'Ciclos de força' : 'Ciclos prontos'}</a><p class="eyebrow">Trilha · ${CIC_NIV[t.niv]}</p><h1 class="h1">${esc(t.nome)}</h1>
    <p class="muted" style="margin-top:6px">${esc(t.desc)}</p>
    <div class="card" style="margin-top:14px"><div class="ck-res"><div><b>${cs.length}</b><span>ciclos</span></div><div><b>${tot}</b><span>semanas (~${Math.round(tot / 4.3)} meses)</span></div></div>
      <div class="cic-barra trl-barra">${cs.map((c, i) => `<i style="flex:${cicSem(c)};background:hsl(${(i * 47 + 190) % 360} 70% 55%)" title="${esc(c.nome)}"></i>`).join('')}</div></div>
    <button class="btn block" id="trl-apl" style="margin-top:12px">${I.users} Aplicar a trilha inteira a um aluno</button>
    <p class="tiny dim" style="margin-top:8px">${forca ? 'As fases de todas as semanas vão para o aluno; a liberação continua com você.' : 'Todas as semanas vão para a planilha do aluno sem liberar. Os ritmos de cada zona seguem o perfil de corrida do aluno: atualize o perfil depois de cada teste.'}</p>
    <p class="sec-lbl">Ciclos em sequência</p><div class="stack">${cs.map((c, i) => `<a class="card tap seq-it" href="${base}${c.id}" style="color:inherit"><span class="trl-n" style="background:hsl(${(i * 47 + 190) % 360} 70% 55%)">${i + 1}</span><div class="grow" style="min-width:0"><b>${esc(c.nome)}</b><div class="small muted">${cicSem(c)} semanas · ${CIC_NIV[c.niv]}</div></div>${I.chev}</a>`).join('')}</div>`;
  document.getElementById('trl-apl').onclick = () => aplicarTrilha(t, cs, forca, tot);
}
async function aplicarTrilha(t, cs, forca, tot) {
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,ativo,aprovacao,treinador_id,modalidades,corrida,nascimento,disponibilidade')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome')
    .then(
      (r) => r.data || [],
      () => [],
    );
  const alunos = ms.filter(
    (m) =>
      ehMeuAluno(m) &&
      m.aprovacao !== 'pendente' &&
      m.aprovacao !== 'recusado' &&
      faz(forca ? 'musculacao' : 'corrida', m),
  );
  const prox = (() => {
    const d = inicioSemana();
    d.setDate(d.getDate() + 7);
    return isoDia(d);
  })();
  const preT = S.cache.cicPre || {};
  S.cache.cicPre = null;
  openSheet(
    `<p class="eyebrow">Aplicar trilha</p><div class="h2" style="margin-top:4px">${esc(t.nome)}</div>
    <form id="f-trl" style="margin-top:14px">
      <label class="field"><span>Aluno</span><select class="input" name="aluno" required><option value="">Escolha o aluno</option>${alunos.map((m) => `<option value="${m.user_id}" ${preT.aluno === m.user_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></label>
      <label class="field"><span>Começa na segunda-feira</span><input class="input" type="date" name="ini" value="${prox}" required></label>
      <p class="small" id="trl-fim" style="margin:-4px 0 10px;color:var(--acc)"></p>
      ${forca ? escTreinosFHTML() : '<label class="field"><span>Dia do longão</span><select class="input" name="longao"><option value="pad">Como nos ciclos</option><option value="5">Sábado</option><option value="6">Domingo</option></select></label><label class="ck-check"><input type="checkbox" name="limpar" checked><span>Apagar os treinos ainda não liberados a partir dessa data (inclusive os de ciclos aplicados antes)</span></label>'}
      <button class="btn block" type="submit" style="margin-top:12px">Aplicar ${tot} semanas</button></form>`,
    (r) => {
      const f = r.querySelector('#f-trl');
      const ntf = forca ? ligarTreinosF(r, alunos) : null;
      if (ntf) f.aluno.addEventListener('change', () => ntf.atualizar(f.aluno.value));
      if (ntf && f.aluno.value) ntf.atualizar(f.aluno.value);
      const atual = () => {
        const ini = inicioSemana(dia(f.ini.value || prox));
        const fim = new Date(ini);
        fim.setDate(fim.getDate() + 7 * tot - 1);
        r.querySelector('#trl-fim').textContent = `Vai de ${fmtDia(isoDia(ini))} a ${fmtDia(isoDia(fim))}.`;
      };
      f.oninput = atual;
      atual();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const alunoId = f.aluno.value;
        if (!alunoId) return toast('Escolha o aluno.', true);
        const m = alunos.find((x) => x.user_id === alunoId),
          b = f.querySelector('button[type=submit]');
        b.disabled = true;
        b.textContent = 'Montando…';
        const ini0 = inicioSemana(dia(f.ini.value || prox)),
          fimT = new Date(ini0);
        fimT.setDate(fimT.getDate() + 7 * tot - 1);
        let extraF = '';
        try {
          let ini = new Date(ini0);
          if (forca) {
            const todas = fasesComLeve(cs.flatMap((c) => cfFases(c)));
            const rows = todas.map((fase, i) => {
              const d = new Date(ini0);
              d.setDate(d.getDate() + 7 * i);
              return { org_id: S.org.id, aluno_id: alunoId, semana: isoDia(d), fase, criado_por: S.user.id };
            });
            cs.forEach((c) => {
              registrarCiclo(alunoId, 'forca', c, ini, cicSem(c), t.id);
              ini.setDate(ini.getDate() + 7 * cicSem(c));
            });
            await gravarFasesForca(alunoId, rows);
            extraF = await garantirTreinosForca(alunoId, ntf && ntf.valor(), isoDia(ini0));
          } else {
            const perfil = perfilCorrida(m || {}),
              rows = [];
            cs.forEach((c) => {
              rows.push(...linhasCiclo(c, alunoId, perfil, ini, f.longao.value));
              registrarCiclo(alunoId, 'corrida', c, ini, cicSem(c), t.id);
              ini.setDate(ini.getDate() + 7 * cicSem(c));
            });
            if (f.limpar.checked) {
              const { error: e1 } = await sb
                .from('nx_plano_corrida')
                .delete()
                .eq('aluno_id', alunoId)
                .eq('liberado', false)
                .gte('data', isoDia(ini0));
              if (e1) throw e1;
            }
            for (let k = 0; k < rows.length; k += 150) {
              const { error: e2 } = await sb.from('nx_plano_corrida').insert(rows.slice(k, k + 150));
              if (e2) throw e2;
            }
          }
        } catch (er) {
          console.error(er);
          b.disabled = false;
          b.textContent = 'Tentar de novo';
          return toast('Não foi possível aplicar a trilha. Tente de novo.', true);
        }
        closeSheet(true);
        toast(`Trilha aplicada para ${firstName(m && m.nome)}: ${tot} semanas.${extraF ? ' ' + extraF : ''}`);
        abrirNaSemana(alunoId, isoDia(ini0));
        location.hash = `#/aluno/${alunoId}/${forca ? 'forca' : 'corrida'}`;
      };
    },
  );
}
// aviso no Hoje do treinador: ciclos dos seus alunos que terminam nos próximos 10 dias (ou já terminaram) sem um próximo
async function ciclosTerminandoHTML(meus, nomes) {
  const hoje = hojeISO(),
    ate = somaDias(hoje, 10),
    de = somaDias(hoje, -14);
  const { data } = await sb
    .from('nx_ciclos_aplicados')
    .select('aluno_id,tipo,ciclo_id,nome,inicio,fim')
    .eq('org_id', S.org.id)
    .gte('fim', de)
    .order('fim')
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const L = (data || []).filter(
    (x) =>
      meus.has(x.aluno_id) &&
      x.fim <= ate &&
      !(data || []).some((y) => y.aluno_id === x.aluno_id && y.tipo === x.tipo && y.inicio > x.fim),
  );
  if (!L.length) return '';
  return `<div class="section"><div class="section-h"><h2 class="h2">Ciclos terminando</h2><span class="tag acc">${L.length}</span></div><div class="stack">${L.map(
    (x) => {
      const c = (x.tipo === 'forca' ? CICLOS_FORCA : CICLOS_CORR).find((k) => k.id === x.ciclo_id);
      const nx = c ? (x.tipo === 'forca' ? proximosForca(c) : proximosCorr(c))[0] : null;
      const prox = somaDias(x.fim, 1);
      return `<button type="button" class="list-item" data-cicnx="${nx ? nx[0].id : ''}" data-cictipo="${x.tipo}" data-cical="${x.aluno_id}" data-cicini="${prox}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${x.tipo === 'forca' ? HALTER_S : I.run}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(firstName(nomes[x.aluno_id] || 'Aluno'))}: ${esc(x.nome || '')}</b><div class="small muted">${x.fim < hoje ? 'Terminou' : 'Termina'} ${fmtCurto(x.fim + 'T12:00:00')}${nx ? ` · próximo sugerido: <b>${esc(nx[0].nome)}</b>` : ''}</div></div>${I.chev}</button>`;
    },
  ).join('')}</div></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cicnx]');
  if (!b) return;
  S.cache.cicPre = { aluno: b.dataset.cical, ini: b.dataset.cicini };
  location.hash = b.dataset.cicnx
    ? (b.dataset.cictipo === 'forca' ? '#/treinos/ciclos-forca/' : '#/treinos/ciclos/') + b.dataset.cicnx
    : b.dataset.cictipo === 'forca'
      ? '#/treinos/ciclos-forca'
      : '#/treinos/ciclos';
});

/* ---------- Macrociclo anual: o ano montado de trás para frente a partir das provas A ----------
   Base: Matveyev (periodização simples e dupla); Issurin 2010 (Sports Med, blocos e múltiplos picos); Bosquet et al. 2007
   (Med Sci Sports Exerc, polimento); Mujika & Padilla 2003 (Med Sci Sports Exerc, polimento); Haugen et al. 2022 (Sports Med Open);
   Rønnestad & Mujika 2014 (Scand J Med Sci Sports, força em manutenção na temporada); Blagrove et al. 2018 (Sports Med). */
const MAC_DIST = [
  ['5', '5 km', 5],
  ['10', '10 km', 10],
  ['21', 'Meia maratona', 21.1],
  ['42', 'Maratona', 42.2],
  ['u50', 'Ultra até 50 km', 50],
  ['u80', 'Ultra de 80 a 100 km', 80],
];
const MAC_KM = Object.fromEntries(MAC_DIST.map((x) => [x[0], x[2]]));
const MAC_NOMED = Object.fromEntries(MAC_DIST.map((x) => [x[0], x[1]]));
const MAC_CIC = {
  5: { ini: '5k-ini', int: '5k-int', ava: '5k-ava', pro: '5k-pro' },
  10: { ini: '10k-ini', int: '10k-int', ava: '10k-ava', pro: '10k-pro' },
  21: { ini: '21k-ini', int: '21k-int', ava: '21k-ava', pro: '21k-pro' },
  42: { ini: '42k-int16', int: '42k-int16', ava: '42k-ava', pro: '42k-pro' },
  u50: { ini: 'ul-int', int: 'ul-int', ava: 'ul-int', pro: 'ul-int' },
  u80: { ini: 'ul-ava', int: 'ul-ava', ava: 'ul-ava', pro: 'ul-ava' },
};
const MAC_BASE = { ini: 'ini-base', int: 'bl-base-int', ava: 'bl-base-ava', pro: 'bl-base-ava' };
const MAC_LIM = { ini: null, int: 'bl-lim-int', ava: 'bl-lim-ava', pro: 'bl-lim-pro' };
// intervalo mínimo recomendado (semanas) antes de uma nova prova A, conforme a distância da prova anterior
const MAC_MIN = { 5: 4, 10: 6, 21: 10, 42: 16, u50: 16, u80: 20 };
// semanas mínimas de preparação específica para chegar bem numa prova A
const MAC_PREP = { 5: 4, 10: 6, 21: 8, 42: 12, u50: 12, u80: 16 };
const MAC_LONGA = (d) => ['21', '42', 'u50', 'u80'].includes(String(d));
const MAC_COR = { pre: '#3ddc97', base: '#3ddc97', lim: '#46d6ff', prova: '#ffcf5c', pos: '#b794ff', trans: '#9aa8c0' };
const MAC_TIPO = {
  pre: 'Pré-temporada',
  base: 'Base',
  lim: 'Limiar',
  prova: 'Ciclo da prova',
  pos: 'Recuperação',
  trans: 'Transição',
};
const macDistDe = (txt) => {
  const k = parseFloat(String(txt || '').replace(',', '.'));
  if (!k) return '10';
  return k <= 7 ? '5' : k <= 15 ? '10' : k <= 30 ? '21' : k <= 45 ? '42' : k <= 60 ? 'u50' : 'u80';
};
const cicPor = (id) => CICLOS_CORR.find((x) => x.id === id);
function planoMacro(ini, niv, provas) {
  const segs = [],
    avisos = [],
    semIdx = (iso) => Math.round((inicioSemana(dia(iso)) - ini) / 6048e5);
  const todas = provas.filter((p) => p.data && p.dist).map((p) => ({ ...p, w: semIdx(p.data) }));
  const fora = todas.filter((p) => p.w < 0 || p.w > 60);
  fora.forEach((p) =>
    avisos.push(
      `${p.nome || 'Prova'} (${fmtDia(p.data)}) está fora do período do plano (até cerca de 14 meses a partir do início).`,
    ),
  );
  let A = todas.filter((p) => p.pri === 'A' && p.w >= 0 && p.w <= 60).sort((a, b) => a.w - b.w);
  const outras = todas.filter((p) => p.pri !== 'A' && p.w >= 0 && p.w <= 60);
  // iniciante: maratona e ultra não entram como prova principal (ver aviso)
  const longasIni = niv === 'ini' ? A.filter((p) => ['42', 'u50', 'u80'].includes(p.dist)) : [];
  if (longasIni.length) A = A.filter((p) => !longasIni.includes(p));
  if (!A.length)
    return {
      segs,
      avisos: longasIni.length
        ? [
            'Maratona ou ultra no nível iniciante: o app não monta. Para a primeira maratona, o aluno precisa de uns 6 meses de base, uma meia maratona completa e 30 km ou mais por semana. Escolha o nível intermediário só se ele já tiver isso; senão, use a meia como prova A.',
          ]
        : [],
      semA: true,
      total: 0,
      outras: [],
    };
  if (A.length > 3)
    avisos.push('Mais de 3 provas A no ano: cada pico exige polimento e recuperação. Considere deixar algumas como B.');
  if (longasIni.length)
    avisos.push(
      'Maratona ou ultra no nível iniciante: o app não monta. Para a primeira maratona, o aluno precisa de uns 6 meses de base, uma meia maratona completa e 30 km ou mais por semana. Escolha o nível intermediário só se ele já tiver isso; senão, use a meia como prova A.',
    );
  const add = (id, w0, from, n, tipo, extra) => {
    const c = cicPor(id);
    if (!c || n <= 0) return;
    segs.push({ c, w0, from, n, tipo, ...extra });
  };
  const preencher = (a, b, primeiro) => {
    // base e limiar entre a e b
    let rest = b - a;
    if (rest <= 0) return;
    const lim = MAC_LIM[niv];
    let fimLim = null;
    if (lim && rest >= 4) {
      fimLim = b - 4;
      rest -= 4;
    }
    let w = a;
    if (primeiro && niv === 'int' && rest >= 8) {
      add('bl-pre', w, 0, 8, 'pre');
      w += 8;
      rest -= 8;
    }
    const base = MAC_BASE[niv],
      Lb = cicPor(base).sem;
    while (rest > 0) {
      const n = Math.min(Lb, rest);
      add(base, w, 0, n, 'base');
      w += n;
      rest -= n;
    }
    if (fimLim != null) add(lim, fimLim, 0, 4, 'lim');
  };
  let cur = 0,
    ant = null;
  A.forEach((p, i) => {
    if (ant && p.w - ant.w < (MAC_MIN[ant.dist] || 6))
      avisos.push(
        `Só ${p.w - ant.w} semanas entre ${ant.nome || 'a prova anterior'} e ${p.nome || 'esta prova'}. Depois de ${MAC_NOMED[ant.dist].toLowerCase()}, o recomendado é pelo menos ${MAC_MIN[ant.dist]} semanas até outra prova principal.`,
      );
    if (p.w < cur) {
      avisos.push(
        `${p.nome || 'Prova'} (${fmtDia(p.data)}) cai dentro do ciclo ou da recuperação da prova anterior. Ela entrou como prova B.`,
      );
      outras.push({ ...p, pri: 'B' });
      return;
    }
    let id = MAC_CIC[p.dist][niv];
    let c = cicPor(id);
    const disp = p.w - cur + 1;
    if (id === '42k-int16' && disp < 16 && disp >= 12) {
      id = '42k-int12';
      c = cicPor(id);
    }
    let L = c.sem,
      from = 0,
      w0 = p.w - L + 1;
    if (w0 < cur) {
      from = cur - w0;
      w0 = cur;
    }
    if (disp < (MAC_PREP[p.dist] || 6))
      avisos.push(
        `Só ${disp} semana${disp > 1 ? 's' : ''} até ${p.nome || 'a prova'} (${fmtDia(p.data)}). O mínimo recomendado para ${MAC_NOMED[p.dist].toLowerCase()} é ${MAC_PREP[p.dist]} semanas de preparação; o ciclo foi encurtado pelo começo.`,
      );
    else if (from > 0)
      avisos.push(
        `O ciclo de ${p.nome || 'a prova'} foi encurtado: começa na semana ${from + 1} de ${L} (pula parte da base).`,
      );
    preencher(cur, w0, i === 0);
    add(id, w0, from, L - from, 'prova', { prova: p });
    cur = p.w + 1;
    const prox = A[i + 1];
    if (MAC_LONGA(p.dist)) {
      add('bl-pos', cur, 0, 2, 'pos');
      cur += 2;
    }
    if (['42', 'u50', 'u80'].includes(p.dist) && (!prox || prox.w - cur >= 10)) {
      add('bl-trans', cur, 0, 2, 'trans');
      cur += 2;
    } else if (!prox && !MAC_LONGA(p.dist)) {
      add('bl-trans', cur, 0, 2, 'trans');
      cur += 2;
    }
    ant = p;
  });
  // provas B e C: entram nas semanas em que caem
  const vistas = [];
  outras.forEach((p) => {
    if (p.w >= cur) {
      avisos.push(`${p.nome || 'Prova'} (${fmtDia(p.data)}) é depois do fim do plano e não entrou.`);
      return;
    }
    const s = segs.find((x) => p.w >= x.w0 && p.w < x.w0 + x.n);
    if (!s) return;
    if (s.tipo === 'pos')
      avisos.push(
        `${p.nome || 'Prova'} (${fmtDia(p.data)}) cai na recuperação da prova principal. Se possível, só participe leve.`,
      );
    if (s.tipo === 'prova' && p.w === s.w0 + s.n - 1) {
      avisos.push(`${p.nome || 'Prova'} cai na semana da prova principal e não entrou.`);
      return;
    }
    vistas.push(p);
  });
  return {
    segs: segs.sort((a, b) => a.w0 - b.w0),
    avisos,
    total: cur,
    outras: vistas.sort((a, b) => a.w - b.w),
    niv,
  };
}
// semanas com os treinos, já com as provas A, B e C nos dias certos
function semanasMacro(pl) {
  const W = [];
  pl.segs.forEach((s) =>
    cicSemanas(s.c)
      .slice(s.from, s.from + s.n)
      .forEach((w, k) => W.push({ ...w, sess: w.sess.map((x) => [...x]), seg: s, k })),
  );
  const diaSem = (iso) => (dia(iso).getDay() + 6) % 7;
  const titulo = (p, km) => `Prova ${String(km).replace('.', ',')} km${p.nome ? ' · ' + p.nome : ''}`;
  pl.segs
    .filter((s) => s.prova)
    .forEach((s) => {
      const w = W[s.prova.w];
      if (!w) return;
      const rd = diaSem(s.prova.data);
      const pv = w.sess.find(([, t]) => t.tipo === 'prova');
      const km = s.c.prova || MAC_KM[s.prova.dist];
      const t = pv ? { ...pv[1], titulo: titulo(s.prova, km) } : sProva(km, 'limiar');
      w.sess = w.sess.filter(([d, x]) => x.tipo !== 'prova' && d < rd);
      w.sess.push([rd, { ...t, titulo: titulo(s.prova, km) }]);
    });
  pl.outras.forEach((p) => {
    const w = W[p.w];
    if (!w) return;
    const rd = diaSem(p.data),
      km = MAC_KM[p.dist];
    const z = { 5: 'intervalado', 10: 'limiar', 21: 'limiar', 42: 'maratona' }[p.dist] || 'leve';
    // a prova toma o lugar do longão; na B, os 2 dias antes ficam leves
    w.sess = w.sess.filter(([d, x]) => d !== rd && x.tipo !== 'longao');
    if (p.pri === 'B')
      w.sess = w.sess.map(([d, x]) =>
        d < rd && d >= rd - 2 && !['regenerativo', 'rodagem'].includes(x.tipo) ? [d, sRod(5, true)] : [d, x],
      );
    const t = sProva(km, z);
    w.sess.push([
      rd,
      {
        ...t,
        titulo: `Prova ${p.pri} · ${String(km).replace('.', ',')} km${p.nome ? ' · ' + p.nome : ''}`,
        obs:
          p.pri === 'B'
            ? 'Prova de preparação: alivie 2 a 3 dias antes e use para testar ritmo, alimentação e equipamento. Não é o pico da temporada.'
            : 'Prova C: faça como um treino forte, sem aliviar antes. Serve de estímulo e experiência de prova.',
      },
    ]);
    w.sess.sort((a, b) => a[0] - b[0]);
  });
  // a junção dos ciclos também passa pelos limites de volume e de sessão mais longa
  if (!pl.segs.length) return W;
  // depois de juntar os ciclos e encaixar as provas, revisa de novo: sessões-chave, longão e polimento de cada
  // prova principal, dias separados, volume e sessão mais longa
  const niv = pl.niv || pl.segs[0].c.niv;
  return revisarMacro(W, perfilNiv(niv), niv, pl);
}
// revisão do macrociclo (com o ritmo do nível, ou com o do aluno na hora de aplicar)
function revisarMacro(W, pf, niv, pl) {
  limitarZonas(W, pf);
  limitarFortes(W, pf, niv);
  limitarCargas(W, pf);
  revisarProvas(W, pf, { niv, asfalto: true, principais: pl.segs.filter((x) => x.prova).map((x) => x.prova.w) });
  separarFortes(W, pf, false);
  return limitarZonas(limitarCargas(W, pf), pf);
}
// força acompanhando a corrida semana a semana
function forcaMacro(W, niv = 'int') {
  // base: resistência no começo (iniciante 4 semanas, os outros 2) e depois hipertrofia; construção: força
  // (iniciante: hipertrofia); específica: força e potência alternadas (iniciante: só força); polimento: a 1ª semana
  // mantém força curta e pesada e as outras são leves; prova, recuperação e semanas de recuperação: semana leve
  let pp = 0,
    nBase = 0,
    nPol = 0,
    ant = '';
  return fasesComLeve(
    W.map((w) => {
      const f = w.fase;
      nBase = f === 'Base' ? (ant === 'Base' ? nBase + 1 : 1) : 0;
      nPol = f === 'Polimento' ? (ant === 'Polimento' ? nPol + 1 : 1) : 0;
      ant = f;
      if (f === 'Polimento') return nPol === 1 && niv !== 'ini' ? 'forca' : 'deload';
      if (w.rec || ['Prova', 'Recuperação'].includes(f)) return 'deload';
      if (['Transição', 'Adaptação', 'Teste'].includes(f)) return 'resistencia';
      if (f === 'Base') return nBase <= (niv === 'ini' ? 4 : 2) ? 'resistencia' : 'hipertrofia';
      if (f === 'Construção') return niv === 'ini' ? 'hipertrofia' : 'forca';
      return niv === 'ini' ? 'forca' : pp++ % 2 ? 'potencia' : 'forca';
    }),
  );
}
const MAC_GUIA = [
  [
    'Para quem é',
    'Para o corredor que já treina com regularidade (pelo menos uns 3 meses correndo 30 min sem parar) e tem um calendário de provas no ano, com pelo menos uma prova principal. Quem está começando do zero deve antes fazer os ciclos de iniciante ou a trilha "Do zero à primeira meia"; quem não tem prova marcada se dá melhor com as trilhas e os modelos de treino.',
  ],
  [
    'Para que serve',
    'Organizar o ano inteiro para o aluno chegar no pico nas provas que mais importam, em vez de tentar estar no auge o ano todo, o que não é possível. Cada fase prepara a seguinte: base aeróbica, depois limiar, depois a parte específica da prova e o polimento. Depois de cada prova principal entram recuperação e transição. Essa organização em fases é a periodização (Matveyev; Issurin 2010).',
  ],
  [
    'Provas A, B e C',
    '<b>A:</b> as principais do ano, no máximo 2 ou 3. O ciclo inteiro é montado para elas, com polimento. <b>B:</b> provas de preparação; alivia 2 a 3 dias antes e serve para testar ritmo, alimentação e equipamento. <b>C:</b> entram como treino forte, sem aliviar. A classificação em A, B e C é a prática consagrada no treinamento de endurance para proteger os picos do ano.',
  ],
  [
    'Quantos picos no ano',
    '<b>Uma prova A:</b> periodização simples, com a preparação mais longa e completa. <b>Duas:</b> periodização dupla, a mais usada, por exemplo uma no primeiro e outra no segundo semestre. <b>Três ou mais:</b> funciona melhor com blocos curtos e concentrados, que permitem vários picos no ano (Issurin 2010). Maratona: na prática, atletas de alto nível fazem no máximo duas por ano.',
  ],
  [
    'Intervalo entre provas principais',
    'O app avisa quando o calendário não fecha. Depois de uma maratona, a inflamação e o dano muscular demoram mais a normalizar do que em provas curtas, e o tempo cresce com a distância (Alves et al. 2022); somando a recuperação e a nova preparação, o recomendado é pelo menos uns 4 meses até outra maratona. Depois de uma meia, 8 a 10 semanas. Em 5 e 10 km a recuperação é rápida e cabem vários picos.',
  ],
  [
    'O polimento',
    'Nas 1 a 3 últimas semanas antes de cada prova A, o volume cai de 40% a 60%, mantendo a intensidade e o número de treinos. Na meta-análise mais recente, esse formato (até 21 dias) melhorou o desempenho em contrarrelógio de atletas de endurance (Wang et al. 2023, PLoS One; Bosquet et al. 2007). Prova B só tem alívio curto; prova C, nenhum.',
  ],
  [
    'E a musculação',
    'Se marcar a força, ela acompanha a corrida: força pesada e hipertrofia na base, força e potência na construção e na fase específica, e semana leve nas semanas de recuperação, no polimento e na prova. Força com carga alta e pliometria melhoram a economia de corrida (Llanos-Lagos et al. 2024, Sports Med), e uma sessão por semana com carga alta já mantém a força durante a temporada de provas (Rønnestad & Mujika 2014). Corrida e musculação juntas não atrapalham o ganho de músculo e de força; para não perder explosão, separe as duas por pelo menos 3 h ou faça em dias diferentes (Schumann et al. 2022, Sports Med).',
  ],
  [
    'Como o app monta',
    'De trás para frente: para cada prova A, o ciclo da distância e do nível termina na semana da prova. Antes dele, um bloco de limiar e, antes do limiar, blocos de base (no começo da temporada, a Pré-temporada Nexos). Depois de meia, maratona e ultra entra a recuperação; depois de maratona e ultra, a transição. Se não houver tempo para o ciclo inteiro, ele é encurtado pelo começo e o app avisa. Tudo vai para a planilha sem liberar.',
  ],
];
const MAC_REFS =
  'Haugen et al. 2022 (Sports Med Open); Wang et al. 2023 (PLoS One); Mølmen et al. 2019 (Open Access J Sports Med); Alves et al. 2022 (Front Physiol); Llanos-Lagos et al. 2024 (Sports Med); Frandsen et al. 2025 (Br J Sports Med); Issurin 2010 (Sports Med); Bosquet et al. 2007 (Med Sci Sports Exerc); Rønnestad & Mujika 2014 (Scand J Med Sci Sports); Matveyev (periodização clássica).';
async function viewMacro() {
  const ms = await sb
    .from('nx_membros')
    .select('user_id,nome,ativo,aprovacao,treinador_id,modalidades,corrida,nascimento,disponibilidade')
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
  const st = S.cache.macro || (S.cache.macro = { aluno: '', niv: 'int', ini: prox, provas: [], forca: false });
  const salvar = () => {
    if (st.aluno) store.set('nx-macro-' + st.aluno, { niv: st.niv, provas: st.provas, forca: st.forca });
  };
  const nivelDe = (m) => {
    const v = perfilCorrida(m || {}).vdot;
    return v ? { v: Math.round(v), n: v < 37 ? 'ini' : v < 46 ? 'int' : v < 57 ? 'ava' : 'pro' } : null;
  };
  const carregar = async () => {
    const sg = nivelDe(alunos.find((x) => x.user_id === st.aluno));
    st.sug = sg;
    if (sg) st.niv = sg.n;
    const sv = store.get('nx-macro-' + st.aluno, null);
    if (sv && sv.provas && sv.provas.length) {
      Object.assign(st, sv);
      return;
    }
    const ps = await sb
      .from('nx_participacoes')
      .select('titulo,data,distancia')
      .eq('aluno_id', st.aluno)
      .gte('data', st.ini)
      .lte('data', somaDias(st.ini, 420))
      .order('data')
      .then(
        (r) => r.data || [],
        () => [],
      );
    st.provas = ps.map((p) => ({ nome: p.titulo || '', data: p.data, dist: macDistDe(p.distancia), pri: 'B' }));
    if (st.provas.length) {
      const ord = ['5', '10', '21', '42', 'u50', 'u80'];
      let mx = st.provas[0];
      st.provas.forEach((p) => {
        if (ord.indexOf(p.dist) >= ord.indexOf(mx.dist)) mx = p;
      });
      mx.pri = 'A';
    }
    const m = alunos.find((x) => x.user_id === st.aluno);
    st.forca = !!(m && faz('musculacao', m));
  };
  const corpo = () => {
    const pl = planoMacro(inicioSemana(dia(st.ini)), st.niv, st.provas);
    const W = pl.segs.length ? semanasMacro(pl) : [];
    const fimISO = pl.total ? somaDias(isoDia(inicioSemana(dia(st.ini))), 7 * pl.total - 1) : null;
    const dataSem = (w) => isoDia(new Date(inicioSemana(dia(st.ini)).getTime() + w * 6048e5));
    if (pl.semA)
      return `${pl.avisos.length ? `<div class="stack" style="margin-top:12px">${pl.avisos.map((a) => `<p class="aviso-dup" style="margin:0">${esc(a)}</p>`).join('')}</div>` : ''}<div class="card mac-vazio" style="margin-top:12px"><b>${st.provas.length ? 'Falta escolher a prova principal' : 'Adicione as provas do ano'}</b><p class="small muted" style="margin-top:4px">${st.provas.length ? 'Toque em A na prova mais importante. O ano é montado de trás para frente a partir dela.' : 'Coloque pelo menos a prova principal do ano e marque como A.'}</p></div>`;
    return `${pl.avisos.length ? `<div class="stack" style="margin-top:12px">${pl.avisos.map((a) => `<p class="aviso-dup" style="margin:0">${esc(a)}</p>`).join('')}</div>` : ''}
      ${
        pl.segs.length
          ? `<div class="card" style="margin-top:12px"><div class="ck-res cic-res"><div><b>${pl.total}</b><span>semanas</span></div><div><b>${pl.segs.length}</b><span>ciclos</span></div><div><b>${W.reduce((a, w) => a + w.sess.length, 0)}</b><span>treinos</span></div></div>
        <div class="mac-barra">${pl.segs.map((s) => `<i style="flex:${s.n};background:${MAC_COR[s.tipo]}">${s.prova ? '<b>A</b>' : ''}</i>`).join('')}</div>
        <div class="cic-leg">${[...new Set(pl.segs.map((s) => s.tipo))].map((t) => `<span><i style="background:${MAC_COR[t]}"></i>${MAC_TIPO[t]}</span>`).join('')}</div>
        <p class="small" style="margin-top:10px;color:var(--acc)">De ${fmtDia(st.ini)} a ${fmtDia(fimISO)}</p></div>
      <p class="sec-lbl">3. O ano, ciclo a ciclo</p>
      <div class="stack">${pl.segs
        .map((s) => {
          const bs = pl.outras.filter((p) => p.w >= s.w0 && p.w < s.w0 + s.n);
          return `<a class="card tap mac-seg" href="#/treinos/ciclos/${s.c.id}" style="color:inherit;--fc:${MAC_COR[s.tipo]}"><div class="grow" style="min-width:0"><span class="eyebrow">${MAC_TIPO[s.tipo]} · semana${s.n > 1 ? 's' : ''} ${s.w0 + 1}${s.n > 1 ? '–' + (s.w0 + s.n) : ''}</span><b style="display:block;margin-top:2px">${esc(s.c.nome)}</b><span class="small muted">${fmtCurto(dataSem(s.w0))} a ${fmtCurto(somaDias(dataSem(s.w0 + s.n - 1), 6))} · ${s.n} semana${s.n > 1 ? 's' : ''}${s.from ? ` (a partir da ${s.from + 1}ª)` : ''}</span>${s.prova ? `<div class="mac-prova A">Prova A · ${esc(s.prova.nome || MAC_NOMED[s.prova.dist])} · ${fmtCurto(s.prova.data)}</div>` : ''}${bs.map((p) => `<div class="mac-prova">Prova ${p.pri} · ${esc(p.nome || MAC_NOMED[p.dist])} · ${fmtCurto(p.data)}</div>`).join('')}</div>${I.chev}</a>`;
        })
        .join('')}</div>
      <label class="ck-check" style="margin-top:14px"><input type="checkbox" id="mac-limpar" checked><span>Apagar os treinos ainda não liberados a partir dessa data (inclusive os de ciclos aplicados antes)</span></label>
      <button class="btn block" id="mac-apl" style="margin-top:12px" ${st.aluno ? '' : 'disabled'}>${I.users} ${st.aluno ? `Aplicar as ${pl.total} semanas` : 'Escolha o aluno para aplicar'}</button>
      <p class="tiny dim" style="margin-top:8px">Nada é liberado para o aluno. Os treinos já liberados nunca são apagados. Os ritmos saem do perfil de corrida do aluno.</p>`
          : ''
      }`;
  };
  const provaHTML = (
    p,
    i,
  ) => `<div class="card mac-pv" data-i="${i}"><div class="row" style="gap:8px"><input class="input" data-k="nome" placeholder="Nome da prova" value="${esc(p.nome || '')}"><button type="button" class="icon-btn" data-del="${i}" aria-label="Remover">${I.x}</button></div>
    <div class="mac-pv-l"><input class="input" type="date" data-k="data" value="${p.data || ''}"><select class="input" data-k="dist">${MAC_DIST.map(([k, l]) => `<option value="${k}" ${p.dist === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="mac-pri">${['A', 'B', 'C'].map((x) => `<button type="button" class="${p.pri === x ? 'on' : ''}" data-pri="${x}">${x}<small>${{ A: 'Principal', B: 'Preparação', C: 'Treino' }[x]}</small></button>`).join('')}</div></div>`;
  const tela = () => {
    $app.innerHTML = `<a class="back" href="#/treinos/ciclos">${I.back} Ciclos prontos</a><p class="eyebrow">Planejamento da temporada</p><h1 class="h1">Macrociclo anual</h1>
      <p class="muted" style="margin-top:6px">O ano do aluno montado de trás para frente a partir das provas principais: base, limiar, ciclo da prova, polimento, recuperação e transição, na ordem certa.</p>
      <a class="small" href="#mac-entenda" id="mac-ir" style="display:inline-block;margin-top:8px;color:var(--acc);font-weight:600">Entenda o macrociclo e a base científica</a>
      <p class="sec-lbl">1. Aluno</p>
      <div class="card"><label class="field"><span>Aluno</span><select class="input" id="mac-al"><option value="">Escolha o aluno</option>${alunos.map((m) => `<option value="${m.user_id}" ${st.aluno === m.user_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></label>
        <label class="field"><span>Nível</span><select class="input" id="mac-niv">${Object.entries(CIC_NIV)
          .map(([k, l]) => `<option value="${k}" ${st.niv === k ? 'selected' : ''}>${l}</option>`)
          .join(
            '',
          )}</select>${st.aluno ? `<small class="tiny dim">${st.sug ? `Sugerido pelo último teste do aluno (VDOT ${st.sug.v}). Ajuste se o volume semanal dele for bem diferente.` : 'O aluno ainda não tem teste no perfil de corrida: confira o nível.'}</small>` : ''}</label>
        <label class="field"><span>Começa na segunda-feira</span><input class="input" type="date" id="mac-ini" value="${st.ini}"></label>
        <label class="ck-check"><input type="checkbox" id="mac-forca" ${st.forca ? 'checked' : ''}><span>Montar também a musculação acompanhando a corrida</span></label>
        <div id="mac-ntf" ${st.forca ? '' : 'hidden'}>${escTreinosFHTML()}</div></div>
      <p class="sec-lbl">2. Provas do ano</p>
      <p class="small muted" style="margin:-4px 0 10px">Toque em <b>A</b> na prova principal do ano (até 3). As outras ficam como <b>B</b> (preparação) ou <b>C</b> (treino).</p>
      ${st.aluno && !st.provas.length ? '<p class="small muted">Nenhuma prova cadastrada para este aluno no próximo ano. Adicione abaixo.</p>' : ''}
      <div class="stack" id="mac-pvs">${st.provas.map(provaHTML).join('')}</div>
      <button type="button" class="btn ghost block" id="mac-add" style="margin-top:10px">${I.plus} Adicionar prova</button>
      <div id="mac-res">${corpo()}</div>
      <p class="sec-lbl" id="mac-entenda">Entenda o macrociclo</p>
      <div class="stack" >${MAC_GUIA.map(([t, x], i) => `<details class="card cic-sem mac-guia" ><summary><b class="grow">${t}</b>${I.chev}</summary><p class="small" style="margin-top:8px">${x}</p></details>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">${MAC_REFS}</p>
`;
    document.getElementById('mac-ir').onclick = (e) => {
      e.preventDefault();
      document.getElementById('mac-entenda').scrollIntoView({ behavior: 'smooth' });
    };
    const res = () => {
      document.getElementById('mac-res').innerHTML = corpo();
      bindApl();
      salvar();
    };
    document.getElementById('mac-al').onchange = async (e) => {
      st.aluno = e.target.value;
      if (st.aluno) await carregar();
      tela();
    };
    document.getElementById('mac-niv').onchange = (e) => {
      st.niv = e.target.value;
      res();
    };
    document.getElementById('mac-ini').onchange = (e) => {
      if (e.target.value) st.ini = isoDia(inicioSemana(dia(e.target.value)));
      e.target.value = st.ini;
      res();
    };
    const ntfM = ligarTreinosF(document.getElementById('mac-ntf'), alunos);
    if (st.aluno) ntfM.atualizar(st.aluno);
    st.ntf = ntfM;
    document.getElementById('mac-forca').onchange = (e) => {
      st.forca = e.target.checked;
      document.getElementById('mac-ntf').hidden = !st.forca;
      salvar();
    };
    document.getElementById('mac-add').onclick = () => {
      st.provas.push({ nome: '', data: '', dist: '21', pri: st.provas.some((p) => p.pri === 'A') ? 'B' : 'A' });
      tela();
      const l = $app.querySelectorAll('.mac-pv');
      if (l.length) l[l.length - 1].querySelector('input').focus();
    };
    const pvs = document.getElementById('mac-pvs');
    pvs.onchange = (e) => {
      const x = e.target.closest('[data-k]'),
        c = e.target.closest('.mac-pv');
      if (!x || !c) return;
      st.provas[+c.dataset.i][x.dataset.k] = x.value;
      res();
    };
    pvs.onclick = (e) => {
      const d = e.target.closest('[data-del]');
      if (d) {
        st.provas.splice(+d.dataset.del, 1);
        salvar();
        return tela();
      }
      const b = e.target.closest('[data-pri]'),
        c = e.target.closest('.mac-pv');
      if (!b || !c) return;
      st.provas[+c.dataset.i].pri = b.dataset.pri;
      c.querySelectorAll('[data-pri]').forEach((x) => x.classList.toggle('on', x === b));
      res();
    };
    bindApl();
  };
  const bindApl = () => {
    const b = document.getElementById('mac-apl');
    if (b) b.onclick = () => aplicarMacro(b);
  };
  async function aplicarMacro(b) {
    const ini0 = inicioSemana(dia(st.ini)),
      pl = planoMacro(ini0, st.niv, st.provas);
    if (!pl.segs.length || !st.aluno) return;
    const m = alunos.find((x) => x.user_id === st.aluno),
      perfil = perfilCorrida(m || {});
    // com o ritmo do próprio aluno (quando ele tem teste), a revisão é refeita para ele
    const W0 = semanasMacro(pl),
      W =
        perfil && perfil.paces && !perfil.pse
          ? revisarMacro(
              W0.map((w) => ({ ...w, sess: w.sess.map((x) => [...x]) })),
              perfil,
              st.niv,
              pl,
            )
          : W0;
    b.disabled = true;
    b.textContent = 'Montando…';
    const rows = [];
    W.forEach((w, i) =>
      w.sess.forEach(([d, t]) => {
        const data = new Date(ini0);
        data.setDate(data.getDate() + i * 7 + d);
        const rs = resumoEstrutura(t.estrutura, perfil);
        rows.push({
          org_id: S.org.id,
          aluno_id: st.aluno,
          data: isoDia(data),
          tipo: t.tipo,
          titulo: t.titulo,
          estrutura: t.estrutura,
          distancia_km: Math.round(rs.km * 10) / 10,
          duracao_min: Math.round(rs.seg / 60),
          zona: null,
          descricao: t.obs || null,
          liberado: false,
          criado_por: S.user.id,
        });
      }),
    );
    const fim = new Date(ini0);
    fim.setDate(fim.getDate() + 7 * pl.total - 1);
    let extraF = '';
    try {
      if (document.getElementById('mac-limpar').checked) {
        const { error: e1 } = await sb
          .from('nx_plano_corrida')
          .delete()
          .eq('aluno_id', st.aluno)
          .eq('liberado', false)
          .gte('data', isoDia(ini0));
        if (e1) throw e1;
      }
      for (let k = 0; k < rows.length; k += 150) {
        const { error: e2 } = await sb.from('nx_plano_corrida').insert(rows.slice(k, k + 150));
        if (e2) throw e2;
      }
      pl.segs.forEach((s) => {
        const d = new Date(ini0);
        d.setDate(d.getDate() + 7 * s.w0);
        registrarCiclo(st.aluno, 'corrida', { id: s.c.id, nome: s.c.nome }, d, s.n, 'anual');
      });
      if (st.forca) {
        const fs = forcaMacro(W, st.niv).map((fase, i) => {
          const d = new Date(ini0);
          d.setDate(d.getDate() + 7 * i);
          return { org_id: S.org.id, aluno_id: st.aluno, semana: isoDia(d), fase, criado_por: S.user.id };
        });
        await gravarFasesForca(st.aluno, fs);
        extraF = await garantirTreinosForca(st.aluno, st.ntf && st.ntf.valor(), isoDia(ini0));
        registrarCiclo(
          st.aluno,
          'forca',
          { id: 'macro-anual', nome: 'Macrociclo anual (força)' },
          ini0,
          pl.total,
          'anual',
        );
      }
    } catch (er) {
      console.error(er);
      b.disabled = false;
      b.textContent = 'Tentar de novo';
      return toast('Não foi possível montar o macrociclo. Tente de novo.', true);
    }
    toast(
      `${rows.length} treinos montados para ${firstName(m && m.nome)} em ${pl.total} semanas. Libere semana a semana.${extraF ? ' Força: ' + extraF : ''}`,
    );
    abrirNaSemana(st.aluno, isoDia(ini0));
    location.hash = `#/aluno/${st.aluno}/corrida`;
  }
  tela();
}

/* ---------- Macrociclo São Luís: para quem corre muitas provas no mês e no ano ----------
   Princípios: nem toda prova é para correr no máximo (forte, treino ou leve); a prova toma o lugar de um treino de qualidade,
   mantendo a maior parte do volume leve (Seiler 2010; Stöggl & Sperlich 2014); progressão de volume sem saltos (Nielsen et al. 2014);
   periodização dupla com dois picos no ano (Matveyev; Issurin 2010); calor e umidade (Racinais et al. 2015, Br J Sports Med). */
const SLZ_NIV = ['ini', 'int', 'ava', 'pro'];
const SLZ_FORTE_MES = { ini: 1, int: 2, ava: 2, pro: 3 };
const SLZ_FORTE_ANO = { ini: 6, int: 10, ava: 14, pro: 18 };
const SLZ_CAP = { ini: 1, int: 2, ava: 3, pro: 3 }; // treinos intensos por semana, contando a prova
const SLZ_OBS = {
  forte:
    'Prova forte: corra no máximo do dia. Na véspera só trote leve; nos 2 a 3 dias seguintes, só leve. Em São Luís, chegue hidratado e reduza o ritmo se estiver muito quente.',
  treino:
    'Prova como treino: aquecimento, a prova em ritmo de limiar (forte, mas controlado, sem ir ao máximo) e desaquecimento. Substitui o treino de qualidade da semana.',
  leve: 'Prova de participação: ritmo de conversa (Z2), sem forçar. Conta como rodagem ou longão leve da semana.',
};
const sPr = (km, papel, rot, extra) => {
  const k = String(km).replace('.', ',');
  if (extra >= 2 && papel === 'treino')
    return cT(
      'prova',
      `${rot || 'Prova'} ${k} km · treino + longão`,
      [_A(3), _C(km, 'km', 'limiar'), _D(r05(extra))],
      SLZ_OBS.treino +
        ` Depois da chegada, continue ${String(r05(extra)).replace('.', ',')} km leve para completar o longão da semana.`,
    );
  if (extra >= 2 && papel === 'leve')
    return cT(
      'prova',
      `${rot || 'Prova'} ${k} km · leve + longão`,
      [_A(r05(extra / 2)), _C(km, 'km', 'leve'), _D(r05(extra / 2))],
      SLZ_OBS.leve + ' Corra leve antes e depois da prova para completar o longão da semana.',
    );
  if (papel === 'forte')
    return cT(
      'prova',
      `${rot || 'Prova'} ${k} km · forte`,
      [_A(2), _C(km, 'km', km <= 5 ? 'intervalado' : km <= 10 ? 'limiar' : km <= 21.1 ? 'limiar' : 'maratona'), _D(1)],
      SLZ_OBS.forte,
    );
  if (papel === 'treino')
    return cT('prova', `${rot || 'Prova'} ${k} km · treino`, [_A(2), _C(km, 'km', 'limiar'), _D(2)], SLZ_OBS.treino);
  return cT('prova', `${rot || 'Prova'} ${k} km · leve`, [_C(km, 'km', 'leve')], SLZ_OBS.leve);
};
// semana de treino por nível e fase; as provas tomam o lugar do longão e dos treinos de qualidade, respeitando o limite de intensos
function slzSemana(niv, fase, f, provas, posForte) {
  const rec = fase === 'Recuperação',
    pol = fase === 'Polimento' || fase === 'Prova',
    tra = fase === 'Transição';
  const fv = rec ? 0.7 : pol ? 0.6 : tra ? 0.6 : f;
  const E = { ini: 4, int: 6, ava: 8, pro: 12 }[niv] * fv,
    L = { ini: 7, int: 13, ava: 18, pro: 24 }[niv] * (rec || pol ? 0.65 : f);
  const Q = (k) => {
    // treinos de qualidade por fase
    if (niv === 'ini')
      return fase === 'Base' ? (k ? sSub(6, 60) : sFar(6, true)) : fase === 'Específica' ? sMil(3) : sFar(8, true);
    const n = { int: 1, ava: 1.4, pro: 2 }[niv];
    if (fase === 'Base')
      return k === 0
        ? sSub(Math.round(8 * Math.min(n, 1.25)), 80)
        : k === 1
          ? sBlo(Math.round(4 * n), 5)
          : sX(Math.round(8 * n));
    if (fase === 'Específica' || fase === 'Competitiva')
      return k === 0
        ? sVo(Math.round(5 * Math.min(n, 1.6)), 1000)
        : k === 1
          ? sKm(Math.round(3 * n), 2, 'limiar')
          : sX(Math.round(8 * n));
    if (pol) return k === 0 ? sMil(4) : sRod(E, true);
    return k === 0 ? sMil(Math.round(6 * n)) : k === 1 ? sKm(Math.round(3 * n), 2, 'maratona') : sX(Math.round(8 * n));
  };
  let S;
  if (tra)
    S =
      niv === 'ini'
        ? [
            [1, sCont(25)],
            [3, sCont(30)],
            [6, sCont(35)],
          ]
        : [
            [1, sCont(35)],
            [3, sRod(E, true)],
            [6, sCont(45)],
          ];
  else if (rec)
    S =
      niv === 'ini'
        ? [
            [1, sReg(20)],
            [3, sReg(25)],
            [6, sRod(4)],
          ]
        : [
            [1, sReg(25)],
            [2, sRod(E)],
            [3, sRod(E, true)],
            ...(niv !== 'int' ? [[4, sRod(E)]] : []),
            [6, sRod(E * 1.3)],
          ];
  else if (niv === 'ini')
    S = [
      [1, Q(0)],
      [3, sRod(E, true)],
      [6, sLon(L)],
    ];
  else if (niv === 'int')
    S = [
      [1, Q(0)],
      [2, sRod(E)],
      [3, Q(1)],
      [6, sLon(L)],
    ];
  else if (niv === 'ava')
    S = [
      [1, Q(0)],
      [2, sRod(E)],
      [3, Q(1)],
      [4, sRod(E)],
      [5, Q(2)],
      [6, sLon(L, fase === 'Específica' ? 4 : 0)],
    ];
  else
    S = [
      [0, sRod(E)],
      [1, Q(0)],
      [2, sRod(E)],
      [3, Q(1)],
      [4, sRod(E)],
      [5, Q(2)],
      [6, sLon(L, fase === 'Específica' ? 6 : 0)],
    ];
  // depois de prova forte longa no fim de semana anterior, o primeiro treino forte vira leve
  if (posForte && !['ava', 'pro'].includes(niv))
    S = S.map(([d, t]) => (d === 1 && t.tipo !== 'regenerativo' ? [d, sRod(E * 0.8)] : [d, t]));
  if (!provas.length) return S;
  const intensos = provas.filter((p) => p.papel !== 'leve').length;
  const qual = (t) => ['ritmo', 'intervalado', 'fartlek', 'tiros'].includes(t.tipo);
  provas.forEach((p) => {
    S = S.filter(([d, t]) => d !== p.d && !(p.d >= 5 && t.tipo === 'longao'));
  });
  provas
    .filter((p) => p.papel === 'forte')
    .forEach((p) => {
      S = S.filter(([d]) => d !== p.d - 1);
    });
  // corta treinos de qualidade além do limite semanal (do fim da semana para o começo)
  let qs = S.filter(([, t]) => qual(t)).length,
    sobra = qs + intensos - SLZ_CAP[niv];
  if (provas.some((p) => p.papel === 'forte')) sobra = Math.max(sobra, 1);
  for (let i = S.length - 1; i >= 0 && sobra > 0; i--)
    if (qual(S[i][1])) {
      S[i] = [S[i][0], sRod(E, S[i][0] < 5)];
      sobra--;
    }
  // véspera de prova forte: trote leve
  provas
    .filter((p) => p.papel === 'forte')
    .forEach((p) => {
      if (niv !== 'ini') S.push([p.d - 1, sRod(Math.max(3, E * 0.5), true)]);
    });
  const comLongao =
    niv !== 'ini' &&
    !rec &&
    !pol &&
    f >= 0.9 &&
    !provas.some((p) => p.papel === 'forte') &&
    !S.some(([, t]) => t.tipo === 'longao');
  provas.forEach((p) =>
    S.push([
      p.d,
      sPr(p.km, p.papel, p.rot, comLongao && p.d === 6 ? L * 0.85 - p.km - (p.papel === 'treino' ? 3 : 0) : 0),
    ]),
  );
  // se a prova é curta e leve, o longão continua na semana (no sábado) para quem treina 4+ dias
  return S.sort((a, b) => a[0] - b[0]);
}
// mês: 4 semanas com 2 a 6 provas
const SLZ_POS = {
  2: [
    [1, 6],
    [3, 6],
  ],
  3: [
    [0, 6],
    [1, 6],
    [3, 6],
  ],
  4: [
    [0, 6],
    [1, 6],
    [2, 6],
    [3, 6],
  ],
  5: [
    [0, 6],
    [1, 5],
    [1, 6],
    [2, 6],
    [3, 6],
  ],
  6: [
    [0, 5],
    [0, 6],
    [1, 6],
    [2, 5],
    [2, 6],
    [3, 6],
  ],
};
function slzPapeis(lst, niv, nForte, gapMin) {
  // escolhe as provas fortes (só domingos), espalhadas, do fim para o começo
  const dupla = new Set(lst.filter((p) => p.d === 5).map((p) => p.w));
  const dom = lst.filter((p) => p.d === 6 && !dupla.has(p.w) && !p.bloq).map((p) => p.w),
    fortes = [];
  for (let i = dom.length - 1; i >= 0 && fortes.length < nForte; i--)
    if (fortes.every((w) => Math.abs(w - dom[i]) >= gapMin)) fortes.push(dom[i]);
  return lst.map((p, i) => {
    const forte = p.d === 6 && fortes.includes(p.w) && !p.bloq;
    const papel = forte
      ? 'forte'
      : niv === 'ini'
        ? 'leve'
        : p.d === 5 && niv !== 'pro'
          ? 'leve'
          : niv === 'int'
            ? i % 2
              ? 'leve'
              : 'treino'
            : 'treino';
    const km = forte
      ? niv === 'ini'
        ? 5
        : fortes.indexOf(p.w) % 2
          ? 5
          : 10
      : papel === 'treino'
        ? niv === 'int'
          ? 5
          : i % 2
            ? 5
            : 10
        : 5;
    return { ...p, papel, km };
  });
}
function slzMes(c) {
  const lst = slzPapeis(
    SLZ_POS[c.np].map(([w, d]) => ({ w, d })),
    c.niv,
    Math.min(SLZ_FORTE_MES[c.niv], c.np),
    c.niv === 'ini' || c.niv === 'int' ? 2 : 1,
  );
  const F = [1, 1.05, 1.1, 0.85];
  return F.map((f, w) => {
    const pv = lst.filter((p) => p.w === w),
      ant = lst.filter((p) => p.w === w - 1 && p.papel === 'forte' && p.km >= 10).length > 0;
    const fo = pv.some((p) => p.papel === 'forte');
    return {
      fase: fo ? 'Prova' : w === 3 ? 'Recuperação' : 'Construção',
      rec: w === 3 && !fo,
      sess: slzSemana(c.niv, 'Construção', f, pv, ant),
    };
  });
}
// ano: periodização dupla (dois picos) e período competitivo no fim do ano
const SLZ_ANO = (() => {
  const F = [];
  const p = (n, fase, rec = []) => {
    for (let i = 0; i < n; i++) F.push({ fase, rec: rec.includes(i) });
  };
  p(2, 'Transição');
  p(8, 'Base', [3, 7]);
  p(6, 'Construção', [3]);
  p(2, 'Específica');
  p(1, 'Polimento');
  p(1, 'Prova');
  p(2, 'Recuperação');
  p(6, 'Base', [3]);
  p(6, 'Construção', [3]);
  p(2, 'Específica');
  p(1, 'Polimento');
  p(1, 'Prova');
  p(2, 'Recuperação');
  p(10, 'Competitiva', [3, 7]);
  p(2, 'Transição');
  return F;
})();
const SLZ_A = { ini: [5, 10], int: [10, 21.1], ava: [10, 21.1], pro: [10, 21.1] };
function slzAno(c) {
  const W = SLZ_ANO.map((x) => ({ ...x })),
    n = W.length,
    aW = W.map((x, i) => (x.fase === 'Prova' ? i : -1)).filter((i) => i >= 0);
  const livres = W.map((x, i) =>
    ['Base', 'Construção', 'Específica', 'Competitiva'].includes(x.fase) ? i : -1,
  ).filter((i) => i >= 0);
  const k = Math.max(0, c.np - aW.length),
    lst = [];
  // uma prova por semana, espalhadas; o que passar vira fim de semana com duas provas (sábado e domingo), nunca em semana leve
  const um = Math.min(k, livres.length);
  for (let i = 0; i < um; i++) lst.push({ w: livres[Math.floor(((i + 0.5) * livres.length) / um)], d: 6 });
  const duplas = livres
    .filter((i) => !W[i].rec && ['Competitiva', 'Construção', 'Base'].includes(W[i].fase))
    .sort((a, b) => (W[b].fase === 'Competitiva') - (W[a].fase === 'Competitiva'));
  for (let i = 0; i < k - um && i < duplas.length; i++)
    lst.push({ w: duplas[Math.floor(((i + 0.5) * duplas.length) / (k - um))], d: 5 });
  // na semana leve, só prova leve; nas 2 semanas antes do polimento, nada de prova forte
  // prova forte nunca na semana leve, nas 2 semanas antes do polimento, nas 2 primeiras depois de recuperação ou transição, nem na base do iniciante e do intermediário
  const fz = (i) => (W[Math.max(0, Math.min(n - 1, i))] || {}).fase;
  lst.forEach((p) => {
    p.bloq =
      W[p.w].rec ||
      fz(p.w + 1) === 'Polimento' ||
      fz(p.w + 2) === 'Polimento' ||
      ['Recuperação', 'Transição'].includes(fz(p.w - 1)) ||
      ['Recuperação', 'Transição'].includes(fz(p.w - 2)) ||
      (W[p.w].fase === 'Base' && ['ini', 'int'].includes(c.niv));
  });
  lst.sort((a, b) => a.w - b.w || a.d - b.d);
  const pap = slzPapeis(lst, c.niv, SLZ_FORTE_ANO[c.niv] - 2, { ini: 4, int: 3, ava: 2, pro: 2 }[c.niv]).map((p) =>
    W[p.w].rec && p.papel !== 'leve' ? { ...p, papel: 'leve', km: 5 } : p,
  );
  aW.forEach((w, j) => pap.push({ w, d: 6, papel: 'forte', km: SLZ_A[c.niv][j], rot: 'Prova A ·' }));
  let fase0 = 0;
  return W.map((x, i) => {
    if (x.fase !== (W[i - 1] || {}).fase) fase0 = i;
    const prog = i / n,
      f =
        (x.rec ? 0.75 : 1) *
        lerp(0.85, 1.12, x.fase === 'Competitiva' ? 0.8 : prog * 1.4) *
        (x.fase === 'Base' && i - fase0 < 2 ? 0.92 : 1);
    const pv = pap.filter((p) => p.w === i),
      ant = pap.some((p) => p.w === i - 1 && p.papel === 'forte' && p.km >= 10);
    return {
      fase: x.fase === 'Competitiva' ? (pv.some((p) => p.papel === 'forte') ? 'Prova' : 'Específica') : x.fase,
      rec: x.rec,
      sess: slzSemana(c.niv, x.fase, f, pv, ant),
    };
  });
}
const SLZ_NOMEN = { ini: 'iniciante', int: 'intermediário', ava: 'avançado', pro: 'profissional' };
SLZ_NIV.forEach((niv) => {
  [2, 3, 4, 5, 6].forEach(
    (np) =>
      (SEQ_CORR[`slz-m${np}-${niv}`] = [
        [`slz-m${np}-${niv}`, 'repete'],
        ...(niv !== 'pro' ? [[`slz-m${np}-${SLZ_NIV[SLZ_NIV.indexOf(niv) + 1]}`, 'sobe']] : []),
        ...(np > 2 ? [[`slz-m${np - 1}-${niv}`, 'menos']] : []),
      ]),
  );
  [10, 20, 30, 40, 50].forEach(
    (np) =>
      (SEQ_CORR[`slz-a${np}-${niv}`] = [
        ['bl-trans', 'trans'],
        [`slz-a${np}-${niv}`, 'repete'],
        ...(niv !== 'pro' ? [[`slz-a${np}-${SLZ_NIV[SLZ_NIV.indexOf(niv) + 1]}`, 'sobe']] : []),
      ]),
  );
  [2, 3, 4, 5, 6].forEach((np) =>
    CICLOS_CORR.push({
      id: `slz-m${np}-${niv}`,
      obj: 'slz',
      slz: 'mes',
      np,
      niv,
      sem: 4,
      modo: 'slz',
      gen: slzMes,
      nome: `${np} provas no mês · ${SLZ_NOMEN[niv]}`,
      desc: `Mesociclo de 4 semanas com ${np} provas: ${SLZ_FORTE_MES[niv] >= np ? 'as duas fortes, espaçadas' : `${SLZ_FORTE_MES[niv]} forte${SLZ_FORTE_MES[niv] > 1 ? 's' : ''}, as outras como ${niv === 'ini' ? 'participação leve' : 'treino ou leve'}`}. A prova toma o lugar do treino de qualidade. Repita mês a mês.${np >= 5 && niv === 'ini' ? ' Para iniciante é muita prova: quase todas devem ser leves.' : ''}`,
    }),
  );
  [10, 20, 30, 40, 50].forEach((np) =>
    CICLOS_CORR.push({
      id: `slz-a${np}-${niv}`,
      obj: 'slz',
      slz: 'ano',
      np,
      niv,
      sem: 52,
      modo: 'slz',
      gen: slzAno,
      nome: `${np} provas no ano · ${SLZ_NOMEN[niv]}`,
      desc: `Macrociclo de 52 semanas com dois picos (${SLZ_A[niv].map((k) => String(k).replace('.', ',') + ' km').join(' e ')}) e ${np - 2} provas encaixadas no ano: até ${SLZ_FORTE_ANO[niv]} fortes no total, as outras como ${niv === 'ini' ? 'participação leve' : 'treino ou leve'}.${np >= 40 && niv === 'ini' ? ' Para iniciante é muita prova: o foco é participar leve e chegar bem nos dois picos.' : ''}`,
    }),
  );
});
const SLZ_GUIA = [
  [
    'Para quem é',
    'Para o corredor de São Luís e região que quer correr muitas provas: no mês ou no ano. A região tem prova quase todo fim de semana, e quem participa de muitas precisa de um plano em que a prova faça parte do treino, e não que atrapalhe.',
  ],
  [
    'Nem toda prova é para correr no máximo',
    'Cada prova recebe um papel. <b>Forte:</b> no máximo do dia, com véspera leve e 2 a 3 dias leves depois. <b>Treino:</b> em ritmo de limiar, forte mas controlado; substitui o treino de qualidade. <b>Leve:</b> participação em ritmo de conversa, conta como rodagem. Correr tudo no máximo acumula cansaço e aumenta o risco de lesão.',
  ],
  [
    'A prova toma o lugar de um treino',
    'O número de treinos intensos por semana, contando a prova, fica no limite de cada nível: 1 no iniciante, 2 no intermediário e 3 no avançado e no profissional. Assim a maior parte do volume continua leve, como nos corredores de melhor desempenho (Haugen et al. 2022; Oliveira et al. 2024). Cuidado com a prova + longão: um treino mais de 10% maior que o mais longo dos últimos 30 dias aumenta o risco de lesão (Frandsen et al. 2025, Br J Sports Med).',
  ],
  [
    'Quantas provas fortes',
    'Não existe estudo que defina o número ideal de provas fortes por ano. Os limites do app são orientação prática: por mês, 1 forte no iniciante, 2 no intermediário e no avançado e 3 no profissional; por ano, cerca de 6, 10, 14 e 18. Provas de 5 e 10 km se recuperam em dias; meia e maratona, em semanas.',
  ],
  [
    'O ano em dois picos',
    'O ciclo anual usa periodização dupla: transição, base, construção e fase específica até a primeira prova A (por volta de 5 meses), recuperação, um segundo bloco até a segunda prova A e um período competitivo no fim do ano, com mais provas. As provas fortes ficam fora da semana leve e das 2 semanas antes do polimento (Matveyev; Issurin 2010).',
  ],
  [
    'Calor e umidade',
    'Em São Luís quase toda prova é com calor e umidade altos. Segundo o consenso do Comitê Olímpico Internacional, a adaptação ao calor vem com pelo menos 2 semanas de treinos de 60 a 90 min no calor, 4 ou mais vezes por semana, e se mantém com 2 por semana (Racinais et al. 2023, Br J Sports Med). Na prova: começar hidratado, beber para limitar a desidratação (sem exagerar), preferir bebida fresca e baixar o ritmo nos dias mais quentes. O ritmo forte de um dia quente não é comparável ao de um dia fresco.',
  ],
  [
    'Como usar',
    'Escolha quantas provas o aluno vai fazer no mês ou no ano e o nível. As provas ficam nos sábados e domingos do modelo; depois de aplicar, mova cada uma para a data real e troque a distância se precisar. Nada é liberado para o aluno sem você.',
  ],
];
const SLZ_REFS =
  'Racinais et al. 2023 (Br J Sports Med, consenso do COI); Frandsen et al. 2025 (Br J Sports Med); Oliveira et al. 2024 (Sports Med); Haugen et al. 2022 (Sports Med Open); Wang et al. 2023 (PLoS One); Issurin 2010 (Sports Med); Seiler 2010 (Int J Sports Physiol Perform).';
function viewSLZ() {
  const st = S.cache.slz || (S.cache.slz = { t: store.get('nx-slz-t', 'mes'), n: store.get('nx-slz-n', 'int') });
  const desenha = () => {
    const L = CICLOS_CORR.filter((c) => c.obj === 'slz' && c.slz === st.t && c.niv === st.n);
    $app.innerHTML = `<a class="back" href="#/treinos/ciclos">${I.back} Ciclos prontos</a><p class="eyebrow">Biblioteca de corrida</p><h1 class="h1">Macrociclo São Luís</h1>
      <p class="muted" style="margin-top:6px">Para quem corre muitas provas: ciclos do mês (de 2 a 6 provas) e do ano (de 10 a 50 provas), com cada prova no seu papel: forte, treino ou leve.</p>
      <a class="small" href="#slz-entenda" id="slz-ir" style="display:inline-block;margin-top:8px;color:var(--acc);font-weight:600">Entenda o método e a base científica</a>
      <div class="subtabs" id="slz-t" style="margin-top:14px">${[
        ['mes', 'Provas no mês'],
        ['ano', 'Provas no ano'],
      ]
        .map(([k, l]) => `<a href="#" class="${st.t === k ? 'on' : ''}" data-t="${k}">${l}</a>`)
        .join('')}</div>
      <div class="chips" id="slz-n" style="margin-top:12px">${SLZ_NIV.map((k) => `<button type="button" class="chip ${k === st.n ? 'on' : ''}" data-n="${k}">${CIC_NIV[k]}</button>`).join('')}</div>
      <div class="stack" style="margin-top:12px">${L.map(cicCardHTML).join('')}</div>
      <p class="sec-lbl" id="slz-entenda">Entenda o método</p>
      <div class="stack">${SLZ_GUIA.map(([t, x]) => `<details class="card cic-sem mac-guia"><summary><b class="grow">${t}</b>${I.chev}</summary><p class="small" style="margin-top:8px">${x}</p></details>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">${SLZ_REFS}</p>`;
    document.getElementById('slz-t').onclick = (e) => {
      const x = e.target.closest('[data-t]');
      if (!x) return;
      e.preventDefault();
      st.t = x.dataset.t;
      store.set('nx-slz-t', st.t);
      desenha();
    };
    document.getElementById('slz-n').onclick = (e) => {
      const x = e.target.closest('[data-n]');
      if (!x) return;
      st.n = x.dataset.n;
      store.set('nx-slz-n', st.n);
      desenha();
    };
    document.getElementById('slz-ir').onclick = (e) => {
      e.preventDefault();
      document.getElementById('slz-entenda').scrollIntoView({ behavior: 'smooth' });
    };
  };
  desenha();
}

/* ---------- Trilha (trail): treino por tempo e esforço, subidas, descidas e longões em terreno ----------
   Base: Scheer et al. 2020 (Int J Sports Med, definição de corrida fora de estrada); Giovanelli et al. 2016 (J Appl Physiol, caminhar é
   mais econômico nas subidas íngremes); McHugh 2003 (Scand J Med Sci Sports, efeito protetor da carga excêntrica repetida);
   Thomas, Erdman & Burke 2016 (Med Sci Sports Exerc, carboidrato durante o exercício). */
const OBS_TR = {
  lon: 'Em trilha ou terreno com subidas, por tempo e esforço (ritmo de conversa), não por pace. Caminhe firme nas subidas íngremes e desça controlado. Treine a hidratação e, acima de 90 min, a alimentação da prova: 30 a 60 g de carboidrato por hora, subindo aos poucos se a prova for longa.',
  b2b: 'Primeiro dia do “back-to-back”: longão no sábado e outro no domingo. Treina correr cansado sem precisar de um longão enorme num dia só.',
  desc: 'Descidas em ritmo firme e controlado, passos curtos e rápidos, olhando 2 a 3 metros à frente. Prepara a musculatura para o impacto das descidas da prova (a carga excêntrica repetida diminui a dor e o dano nas provas).',
  sub: 'Subida longa e contínua em esforço de limiar; em rampa muito íngreme, caminhe forte com as mãos nas coxas. Desça trotando devagar.',
  pro: 'Ritmo por esforço, não por pace: o terreno e o desnível mudam tudo. Comece mais leve do que parece necessário e coma e beba desde o começo.',
};
const sLonT = (min, b2b) =>
  cT(
    'longao',
    `Longão em trilha ${Math.round(min / 5) * 5} min${b2b ? ' (dia 1)' : ''}`,
    [_C(Math.round(min / 5) * 5, 'min', 'leve')],
    b2b ? OBS_TR.b2b + ' ' + OBS_TR.lon : OBS_TR.lon,
  );
const sDesc = (n) =>
  cT(
    'tiros',
    `Descidas ${n} × 1 min`,
    [_A(10, 'min'), serie(n, [_C(1, 'min', 'limiar'), _R(2, 'min', 'leve')]), _D(10, 'min')],
    OBS_TR.desc,
  );
const sSubT = (n, min) =>
  cT(
    'ritmo',
    `Subidas ${n} × ${min} min`,
    [_A(15, 'min'), serie(n, [_C(min, 'min', 'limiar'), _R(min, 'min', 'rec')]), _D(10, 'min')],
    OBS_TR.sub,
  );
const sProvaT = (km) =>
  cT('prova', `Prova trail ${km} km`, [_C(km, 'km', km <= 15 ? 'limiar' : 'maratona')], OBS_TR.pro);
function gerarTrail(c) {
  const n = c.sem,
    T = n >= 16 ? 2 : 1,
    R = n - T - 1,
    b = Math.max(1, Math.round(R * 0.4)),
    co = Math.max(1, Math.round(R * 0.35));
  const [l0, l1] = c.lon,
    N = c.niv,
    E = { ini: 4.5, int: 7, ava: 9 }[N];
  return Array.from({ length: n }, (_, i) => {
    const fase = i < b ? 'Base' : i < b + co ? 'Construção' : i < R ? 'Específica' : i < n - 1 ? 'Polimento' : 'Prova';
    const rec = i < R - 1 && i % 4 === 3,
      p = R > 1 ? Math.min(1, i / (R - 1)) : 1,
      red = rec ? 0.65 : 1;
    const k = (a, z) => Math.max(2, Math.round(lerp(a, z, p) * red));
    if (fase === 'Prova')
      return {
        fase,
        sess: [
          [1, sRod(E * 0.6, true)],
          [3, sFar(4, true)],
          ...(N === 'ava' ? [[4, sRod(E * 0.5)]] : []),
          [6, sProvaT(c.prova)],
        ],
      };
    const pol = fase === 'Polimento';
    const lon = pol ? l1 * (i === n - 2 ? 0.4 : 0.6) : lerp(l0, l1, p) * (rec ? 0.7 : 1);
    const q1 = pol
      ? sSubT(3, 3)
      : fase === 'Base'
        ? sSub(k(6, 10), 80)
        : fase === 'Construção'
          ? sSubT(k(3, 5), N === 'ini' ? 2 : 3)
          : sSubT(k(4, 6), N === 'ini' ? 3 : 4);
    const q2 = pol
      ? sRod(E * 0.7, true)
      : fase === 'Base'
        ? sFar(k(6, 10), N === 'ini')
        : fase === 'Construção'
          ? sMin(k(3, 4), 6)
          : sDesc(k(5, 9));
    const b2b = c.b2b && fase === 'Específica' && !rec;
    const S = [
      [1, q1],
      [6, b2b ? sLonT(lon * 0.8) : sLonT(lon)],
    ];
    if (N === 'ini') S.push([3, fase === 'Específica' && !pol ? sDesc(k(4, 6)) : sRod(E, true)]);
    else {
      S.push([2, sRod(E * (pol ? 0.7 : 1))], [3, q2]);
      if (c.dias >= 5) S.push([4, sRod(E * (pol ? 0.6 : 0.9))]);
      if (b2b) S.push([5, sLonT(lon * 0.5, true)]);
      else if (c.dias >= 6) S.push([5, sRod(E * (pol ? 0.6 : 1), true)]);
    }
    return { fase, rec, sess: S.sort((x, y) => x[0] - y[0]) };
  });
}
/* ---------- Volta à corrida depois de lesão: corre e caminha progressivo, com regra da dor ----------
   Base: Warden et al. 2014 (J Orthop Sports Phys Ther, volta após fratura por estresse); Silbernagel et al. 2007 (Am J Sports Med,
   modelo de monitoramento da dor); Nielsen et al. 2014 (J Orthop Sports Phys Ther, progressão de volume). */
const VL_DOR =
  'Regra da dor: dor até 2 de 10 durante a corrida e que some até a manhã seguinte, siga em frente. Dor 3 ou mais, mancar, ou dor maior na manhã seguinte: pare, volte para a etapa anterior e avise o treinador. Nunca corra em dias seguidos nesta fase.';
const VL_PRE =
  'Antes da primeira corrida, confira: liberação do médico ou fisioterapeuta, caminhada rápida de 30 min sem dor, 10 saltitos em um pé só sem dor (em cada perna) e 20 elevações de panturrilha em uma perna. ';
const VL_E = [
  [5, 1, 2],
  [5, 2, 2],
  [5, 3, 1],
  [4, 5, 1],
  [3, 8, 1],
  [2, 12, 1],
  ['c', 20],
  ['c', 22],
  ['c', 24],
  ['c', 26],
  ['c', 28],
  ['c', 30],
  ['a', 30],
];
const vlSess = (e, pre) => {
  const obs = (pre ? VL_PRE : '') + VL_DOR;
  if (e[0] === 'c')
    return { ...sCont(e[1]), obs: 'Corrida contínua, leve (ritmo de conversa), em terreno plano. ' + obs };
  if (e[0] === 'a')
    return cT(
      'rodagem',
      'Contínuo 30 min + 4 acelerações',
      [_C(30, 'min', 'leve'), serie(4, [_C(80, 'm', 'tiros'), _R(1, 'min', 'rec')])],
      'Corrida leve e, no fim, 4 acelerações de 80 m soltas, sem sprint. Primeiro estímulo mais rápido depois da lesão. ' +
        obs,
    );
  return {
    ...sCC(e[0], e[1], e[2]),
    obs: `Corra ${e[1]} min leve e caminhe ${e[2]} min, ${e[0]} vezes, em terreno plano. ` + obs,
  };
};
function gerarVolta(c) {
  // etapas de corre e caminha repetidas (c.rep vezes) antes de avançar; as contínuas, uma vez cada
  const tot = c.sem * 3,
    est = VL_E.slice(c.ini);
  const seq = [];
  est.forEach((e) => {
    const r = typeof e[0] === 'number' ? c.rep : 1;
    for (let k = 0; k < r && seq.length < tot; k++) seq.push(e);
  });
  while (seq.length < tot) seq.push(seq.length >= tot - 3 ? ['a', 30] : ['c', 30]);
  return Array.from({ length: c.sem }, (_, w) => {
    const ss = seq.slice(w * 3, w * 3 + 3);
    return {
      fase: ss.every((e) => e[0] === 'c' || e[0] === 'a') ? 'Base' : 'Adaptação',
      sess: ss.map((e, j) => [[1, 3, 5][j], vlSess(e, w === 0 && j === 0)]),
    };
  });
}
CICLOS_CORR.push(
  {
    id: 'tr-ini',
    obj: 'trail',
    niv: 'ini',
    sem: 10,
    nome: 'Primeiro trail (até 12 km)',
    modo: 'trail',
    gen: gerarTrail,
    dias: 3,
    lon: [50, 100],
    prova: 10,
    desc: 'Para quem corre 10 km no asfalto e quer estrear na trilha: subidas, descidas e longões por tempo em terreno.',
  },
  {
    id: 'tr-int21',
    obj: 'trail',
    niv: 'int',
    sem: 12,
    nome: 'Trail de 21 km · intermediário',
    modo: 'trail',
    gen: gerarTrail,
    dias: 4,
    lon: [75, 160],
    prova: 21,
    desc: 'Subidas curtas na base, subidas longas e limiar na construção, descidas na fase específica. Longão por tempo até cerca de 2h40.',
  },
  {
    id: 'tr-ava21',
    obj: 'trail',
    niv: 'ava',
    sem: 12,
    nome: 'Trail de 21 a 30 km · avançado',
    modo: 'trail',
    gen: gerarTrail,
    dias: 6,
    lon: [90, 180],
    prova: 25,
    b2b: true,
    desc: 'Seis treinos por semana, com longões seguidos no fim de semana (back-to-back) na fase específica.',
  },
  {
    id: 'tr-int42',
    obj: 'trail',
    niv: 'int',
    sem: 16,
    nome: 'Trail de 42 km · intermediário',
    modo: 'trail',
    gen: gerarTrail,
    dias: 5,
    lon: [90, 240],
    prova: 42,
    b2b: true,
    desc: 'Para quem já fez um trail de 21 km. Longão por tempo até cerca de 4h e fins de semana com dois longões seguidos.',
  },
  {
    id: 'tr-ava50',
    obj: 'trail',
    niv: 'ava',
    sem: 18,
    nome: 'Ultra trail de 50 a 60 km · avançado',
    modo: 'trail',
    gen: gerarTrail,
    dias: 6,
    lon: [120, 270],
    prova: 50,
    b2b: true,
    desc: 'Para quem já completou um trail de 42 km ou uma maratona. Longões de até 4h30, back-to-back e muito treino de subida e descida.',
  },
  {
    id: 'vl-curta',
    obj: 'volta',
    niv: 'ini',
    sem: 4,
    ini: 2,
    rep: 1,
    nome: 'Volta após pausa curta (2 a 4 semanas parado)',
    modo: 'volta',
    gen: gerarVolta,
    desc: 'Lesão leve ou pausa curta, já sem dor no dia a dia. Começa no corre 3 min e caminha 1 min e chega a 30 min contínuos.',
  },
  {
    id: 'vl-media',
    obj: 'volta',
    niv: 'ini',
    sem: 6,
    ini: 0,
    rep: 2,
    nome: 'Volta após lesão moderada (1 a 2 meses parado)',
    modo: 'volta',
    gen: gerarVolta,
    desc: 'Tendinite, entorse ou lesão muscular já tratada. Começa no corre 1 min e caminha 2 min, com cada etapa repetida antes de avançar.',
  },
  {
    id: 'vl-longa',
    obj: 'volta',
    niv: 'ini',
    sem: 8,
    ini: 0,
    rep: 3,
    nome: 'Volta após lesão longa ou fratura por estresse',
    modo: 'volta',
    gen: gerarVolta,
    desc: 'Mais de 2 meses parado ou fratura por estresse, só com liberação médica. Progressão mais lenta, sempre em dias alternados.',
  },
);
Object.assign(SEQ_CORR, {
  'tr-ini': [
    ['tr-int21', 'dist'],
    ['tr-ini', 'repete'],
  ],
  'tr-int21': [
    ['bl-pos', 'rec'],
    ['tr-int42', 'dist'],
    ['tr-ava21', 'sobe'],
  ],
  'tr-ava21': [
    ['bl-pos', 'rec'],
    ['tr-ava50', 'dist'],
  ],
  'tr-int42': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
    ['tr-ava50', 'dist'],
  ],
  'tr-ava50': [
    ['bl-pos', 'rec'],
    ['bl-trans', 'trans'],
  ],
  'vl-curta': [
    ['ini-base', 'base'],
    ['bl-base-int', 'base'],
  ],
  'vl-media': [
    ['ini-base', 'base'],
    ['vl-media', 'repete'],
  ],
  'vl-longa': [
    ['ini-base', 'base'],
    ['ini-30', 'base'],
  ],
});
const CIC_INFO_TRAIL = `<div class="card cic-macro" style="margin-top:12px"><span class="eyebrow">Como é o treino de trail</span><ol>
  <li><b>Por tempo e esforço, não por pace.</b> O desnível e o terreno mudam o ritmo; os longões são em minutos.</li>
  <li><b>Caminhar nas subidas íngremes é técnica.</b> Acima de uns 15–20% de inclinação, caminhar forte gasta menos energia que correr (Giovanelli et al. 2016).</li>
  <li><b>Descer também se treina.</b> A descida é excêntrica e é ela que mais dói depois da prova; treinar descidas protege a musculatura nas seguintes (Bontemps et al. 2020, Sports Med; McHugh 2003).</li>
  <li><b>Comer e beber é treino.</b> Acima de 90 min, 30 a 60 g de carboidrato por hora; nas provas longas, até 90 g ou mais, desde que o intestino tenha sido treinado (Thomas, Erdman & Burke 2016). Numa maratona de montanha, 120 g por hora preservou mais a força no dia seguinte do que 60 ou 90 g (Urdampilleta et al. 2020, Nutrients).</li>
  <li><b>Back-to-back:</b> dois longões em dias seguidos simulam o cansaço da prova longa com menos risco que um longão enorme.</li></ol>
  <p class="tiny dim">Scheer et al. 2020 (Int J Sports Med); Bontemps et al. 2020 (Sports Med); Urdampilleta et al. 2020 (Nutrients); Giovanelli et al. 2016 (J Appl Physiol); Thomas, Erdman & Burke 2016 (Med Sci Sports Exerc); McHugh 2003 (Scand J Med Sci Sports).</p></div>`;
const CIC_INFO_VOLTA = `<div class="card cic-macro" style="margin-top:12px"><span class="eyebrow">Antes de começar</span><ol>
  <li><b>Liberação:</b> do médico ou do fisioterapeuta que acompanhou a lesão. O protocolo não substitui avaliação.</li>
  <li><b>Critérios para a primeira corrida:</b> caminhada rápida de 30 min sem dor, 10 saltitos em um pé só sem dor e 20 elevações de panturrilha em uma perna.</li>
  <li><b>Regra da dor:</b> até 2 de 10 durante e que passa até a manhã seguinte, segue. 3 ou mais, mancar ou piora no dia seguinte, volta uma etapa (Silbernagel et al. 2007; usado nas orientações atuais, Silbernagel et al. 2020).</li>
  <li><b>Dias alternados:</b> o osso responde melhor à carga com descanso entre as sessões; nunca correr em dias seguidos nesta fase (Warden et al. 2014 e 2021). O tempo total de volta depende do local da lesão: em fraturas por estresse, de cerca de 6 semanas na tíbia a mais de 4 meses no navicular (Hoenig et al. 2023, Br J Sports Med).</li>
  <li><b>Força junto:</b> panturrilha, glúteo e quadríceps 2 a 3 vezes por semana, nos dias sem corrida.</li>
  <li><b>Depois do protocolo:</b> nenhum treino mais de 10% maior que o mais longo dos últimos 30 dias. No maior estudo sobre o tema, com mais de 5 mil corredores, foi esse salto num treino isolado, e não o volume da semana, que aumentou o risco de lesão (Frandsen et al. 2025, Br J Sports Med).</li></ol>
  <p class="tiny dim">Frandsen et al. 2025 (Br J Sports Med); Hoenig et al. 2023 (Br J Sports Med); Warden et al. 2021 (Curr Osteoporos Rep); Silbernagel et al. 2020 (J Athl Train); Warden et al. 2014 (J Orthop Sports Phys Ther); Silbernagel et al. 2007 (Am J Sports Med).</p></div>`;

const treinosAbas = (k) =>
  `<div class="subtabs" style="margin-top:16px">${[
    ['musculacao', 'Musculação', '#/treinos'],
    ['corrida', 'Corrida', '#/treinos/corrida'],
    ['exercicios', 'Exercícios', '#/biblioteca'],
  ]
    .map(([x, l, h]) => `<a class="${k === x ? 'on' : ''}" href="${h}">${l}</a>`)
    .join('')}</div>`;
async function staffTreinos(aba) {
  if (aba !== 'corrida') return staffBiblioteca('modelos');
  loading();
  const org = await sb
    .from('nx_modelos_corrida')
    .select('*')
    .eq('org_id', S.org.id)
    .order('criado_em')
    .then((r) => r.data || [])
    .catch(() => []);
  const perfil = perfilCorrida({});
  const st = S.cache.libCorr || (S.cache.libCorr = { niv: store.get('nx_lib_niv', 'ini') });
  const nomeNiv = Object.fromEntries(NIVEIS_CORR);
  const card = (
    md,
    meu,
  ) => `<div class="card mod-corr"><div class="row between" style="gap:10px;align-items:flex-start"><div style="min-width:0"><b>${esc(md.nome)}</b><div class="mc-tags">${meu ? '<span class="tag acc">meu modelo</span>' : (md.niv || []).length === 4 ? '<span class="tag">todos os níveis</span>' : (md.niv || []).map((n) => `<span class="tag niv-${n}">${nomeNiv[n]}</span>`).join('')}</div></div>${meu ? `<button class="link-btn tiny" data-delmc="${md.id}" style="color:var(--err)">Excluir</button>` : ''}</div>
    <div style="margin:10px 0 6px">${md.tipo === 'folga' ? `<div class="off-faixa grande">${OFF_IC}</div>` : md.tipo === 'forca' ? `<div class="off-faixa grande fo">${FORCA_IC}</div>` : perfilHTML(md.estrutura, perfil, true)}</div>
    ${semCorrida(md) ? '' : `<p class="small"><b>${f1(resumoEstrutura(md.estrutura, perfil).km)} km</b> · ~${fmtDur(resumoEstrutura(md.estrutura, perfil).seg)}</p><p class="small muted" style="margin-top:2px">${esc(descreverEstrutura(md.estrutura))}</p>`}
    ${md.info ? `<p class="mc-info">${esc(md.info)}</p>` : ''}</div>`;
  const desenhar = () => {
    const sel = st.niv;
    const lst = sel === 'meus' ? [] : MODELOS_PADRAO.filter((md) => passaNiv(md, sel));
    const grupos = CATS_CORR.map(([k, l]) => [k, l, lst.filter((md) => md.cat === k)]).filter(([, , l2]) => l2.length);
    const cont = (k) =>
      k === 'meus'
        ? org.length
        : k === 'todos'
          ? MODELOS_PADRAO.length
          : MODELOS_PADRAO.filter((md) => (md.niv || []).includes(k)).length;
    $app.innerHTML = `<p class="eyebrow">Montagem de treino</p><h1 class="h1">Treinos</h1>${treinosAbas('corrida')}
      <p class="muted small">Biblioteca de corrida organizada por nível. A maior parte segue o <b>método norueguês</b> (limiar controlado com pausas curtas, duplo limiar e muito volume leve). Para usar, abra a planilha do aluno e arraste o treino para o dia.</p>
      <a class="card tap cic-cta" href="#/treinos/ciclos" style="color:inherit"><span class="ativ-ic">${I.cal}</span><div class="grow"><b>Ciclos prontos</b><div class="small muted">Do zero aos 5 km, 10 km, meia, maratona, ultra e blocos (base, limiar norueguês, VO₂, polimento). Aplica todas as semanas de uma vez na planilha do aluno, sem liberar.</div></div>${I.chev}</a>
      <div class="niv-tabs" id="niv-tabs">${[...NIVEIS_CORR, ['todos', 'Todos'], ['meus', 'Meus']].map(([k, l]) => `<button type="button" class="${sel === k ? 'on' : ''}" data-niv="${k}"><b>${l}</b><span>${cont(k)} treinos</span></button>`).join('')}</div>
      ${GUIA_NIV[sel] ? `<div class="card guia-niv"><span class="eyebrow">Como montar a semana · ${nomeNiv[sel]}</span><ul>${GUIA_NIV[sel].map((t) => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      ${
        sel === 'meus'
          ? org.length
            ? `<div class="cols" style="margin-top:16px">${org.map((m2) => card(m2, true)).join('')}</div>`
            : '<div class="empty" style="margin-top:16px"><div class="h3">Nenhum modelo seu ainda</div><p class="small">Monte um treino na planilha de um aluno e toque em “Salvar como modelo”.</p></div>'
          : grupos
              .map(
                ([k, l, l2]) =>
                  `<div class="section"><div class="section-h"><h2 class="h2">${l}</h2><span class="tiny dim">${l2.length}</span></div><div class="cols">${l2.map((m2) => card(m2, false)).join('')}</div></div>`,
              )
              .join('')
      }
      <a class="btn ghost block" href="#/alunos" style="margin-top:16px">${I.users} Abrir a planilha de um aluno</a>`;
    document.getElementById('niv-tabs').onclick = (e) => {
      const b = e.target.closest('[data-niv]');
      if (!b) return;
      st.niv = b.dataset.niv;
      store.set('nx_lib_niv', st.niv);
      desenhar();
    };
  };
  desenhar();
  $app.onclick = async (e) => {
    const d = e.target.closest('[data-delmc]');
    if (!d) return;
    if (!confirm('Excluir este modelo de corrida?')) return;
    const { error } = await sb.from('nx_modelos_corrida').delete().eq('id', d.dataset.delmc);
    error ? toast('Não foi possível excluir.', true) : (toast('Modelo excluído.'), staffTreinos('corrida'));
  };
}
