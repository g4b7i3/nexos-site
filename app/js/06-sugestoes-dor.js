/* Nexos App · Sugestões do app quando o aluno relata dor e ajuste pronto.
   Parte 6 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- sugestões do app quando o aluno relata dor (só a equipe vê) ---------- */
// base: literatura de lesões na corrida e no treino de força. O app não diagnostica: aponta padrões e cuidados.
const SUG_DOR = {
  joelho: {
    c: [
      'Padrão compatível com dor patelofemoral ou sobrecarga do trato iliotibial, as queixas de joelho mais comuns na corrida.',
      [
        'Reduzir o volume e evitar descidas por alguns dias',
        'Aumentar a cadência em 5 a 10% reduz a carga no joelho',
        'Fortalecer quadríceps e glúteo médio (abdução de quadril)',
      ],
    ],
    f: [
      /agach|afundo|avan[cç]|passada|leg ?press|b[uú]lgar|extensora|salto|pliom|step|lunge|hack/,
      [
        'Reduzir a amplitude e a carga de: {ex}',
        'Trocar saltos e impacto por isometria de quadríceps (cadeira extensora isométrica ou wall sit)',
        'Manter o trabalho de quadril e glúteo médio, que protege o joelho',
      ],
    ],
  },
  canela: {
    c: [
      'Padrão compatível com estresse tibial medial (canelite), ligado a aumento rápido de volume e de impacto.',
      [
        'Reduzir o impacto por 3 a 5 dias (bike, elíptico ou piscina)',
        'Evitar piso duro e tiros até a dor ceder',
        'Conferir os km do tênis e a progressão de volume',
      ],
    ],
    f: [
      /salto|pliom|corda|box ?jump|pular/,
      ['Suspender saltos e pliometria: {ex}', 'Manter o fortalecimento de panturrilha sem impacto'],
    ],
  },
  panturrilha: {
    c: [
      'Compatível com sobrecarga ou estiramento leve da panturrilha, comum após tiros e subidas.',
      [
        'Evitar tiros e subidas por alguns dias',
        'Rodagem leve só se a dor não aumentar durante a corrida',
        'Fortalecimento progressivo de panturrilha (elevação em pé e sentado)',
      ],
    ],
    f: [
      /panturrilha|g[eê]meos|s[oó]leo|salto|pliom|corda/,
      ['Reduzir a carga de: {ex}', 'Voltar de forma progressiva, sem dor durante o exercício'],
    ],
  },
  aquiles: {
    c: [
      'Compatível com tendinopatia do Aquiles, sensível a subidas, tiros e aumento rápido de volume.',
      [
        'Tirar subidas e tiros temporariamente',
        'Carga progressiva na panturrilha (isometria e depois elevação lenta), base do tratamento de tendinopatia',
        'Evitar alongamento forte do tendão na fase dolorosa',
      ],
    ],
    f: [
      /panturrilha|salto|pliom|corda/,
      ['Reduzir ou pausar: {ex}', 'Substituir por isometria de panturrilha (30 a 45 s, 4 a 5 séries)'],
    ],
  },
  calcanhar: {
    c: [
      'Padrão compatível com fascite plantar (dor no calcanhar e na sola, pior nos primeiros passos do dia).',
      [
        'Reduzir o volume e evitar andar descalço ou em piso duro',
        'Alongar fáscia plantar e panturrilha',
        'Fortalecer a musculatura do pé (exercício do pé curto, toalha)',
      ],
    ],
    f: [/salto|pliom|corda/, ['Suspender: {ex}']],
  },
  pe: {
    c: [
      'Dor localizada no osso do pé que piora com impacto pode indicar sobrecarga óssea (fratura por estresse nos metatarsos).',
      [
        'Se a dor for pontual no osso e piorar ao pular ou correr, encaminhar para avaliação',
        'Reduzir o impacto até ter clareza',
        'Conferir tênis e superfície',
      ],
    ],
    f: [/salto|pliom|corda/, ['Suspender: {ex}']],
  },
  tornozelo: {
    c: [
      'Se houve torção, o padrão é de entorse; sem torção, sobrecarga dos tendões ao redor do tornozelo.',
      [
        'Com torção ou inchaço: repouso relativo e encaminhar para avaliação',
        'Na volta, treino de equilíbrio e propriocepção',
        'Evitar trilha e piso irregular por enquanto',
      ],
    ],
    f: [/salto|pliom|afundo|agach|corda/, ['Reduzir ou adaptar: {ex}', 'Priorizar exercícios estáveis e com apoio']],
  },
  coxa_t: {
    c: [
      'Compatível com sobrecarga ou estiramento dos isquiotibiais, comum em tiros e acelerações.',
      [
        'Suspender tiros e velocidade máxima',
        'Rodagem leve apenas sem dor',
        'Na volta, excêntrico de posteriores (nórdico) reduz o risco de recidiva',
      ],
    ],
    f: [
      /stiff|terra|levantamento|n[oó]rdico|flexora|good ?morning|ponte|rdl/,
      ['Reduzir a carga e a amplitude de: {ex}', 'Manter isometria de posteriores sem dor'],
    ],
  },
  coxa_f: {
    c: [
      'Sobrecarga do quadríceps, comum depois de descidas, provas e volume alto.',
      ['Evitar descidas por alguns dias', 'Reduzir o volume da semana'],
    ],
    f: [/agach|leg ?press|extensora|afundo|avan[cç]|b[uú]lgar|hack/, ['Reduzir a carga de: {ex}']],
  },
  quadril: {
    c: [
      'Em corredores, dor no quadril ou na virilha costuma ser sobrecarga de flexores ou adutores. Dor profunda na virilha que piora com impacto merece avaliação: a fratura por estresse do colo do fêmur é rara, mas grave.',
      [
        'Se a dor for profunda na virilha e piorar ao correr, encaminhar para avaliação',
        'Reduzir volume e velocidade',
        'Fortalecer glúteo médio e core',
      ],
    ],
    f: [/agach|terra|afundo|leg ?press|abdu|adu|hip ?thrust/, ['Reduzir a amplitude e a carga de: {ex}']],
  },
  gluteo: {
    c: [
      'Sobrecarga de glúteo ou do piriforme. Se a dor descer para a perna com formigamento, a origem pode ser a coluna lombar.',
      ['Se irradiar para a perna com formigamento, encaminhar', 'Reduzir volume e subidas', 'Mobilidade de quadril'],
    ],
    f: [/agach|terra|stiff|hip ?thrust|ponte|afundo|b[uú]lgar/, ['Reduzir a carga de: {ex}']],
  },
  lombar: {
    c: [
      'Dor lombar em corredores costuma acompanhar fadiga do core e volume alto.',
      [
        'Reduzir volume e intensidade',
        'Fortalecer o core (prancha, bird-dog, dead bug)',
        'Dor que desce para a perna, formigamento ou fraqueza: encaminhar',
      ],
    ],
    f: [
      /terra|stiff|agach|remada curvada|good ?morning|levantamento|rdl/,
      ['Reduzir a carga de {ex} e priorizar a técnica', 'Trocar por variações com apoio (remada apoiada, leg press)'],
    ],
  },
  costas: {
    c: [
      'Dor nas costas raramente limita a corrida.',
      ['Manter a corrida leve se a dor não piorar', 'Mobilidade torácica'],
    ],
    f: [/remada|puxada|barra|pull|terra|pulldown/, ['Reduzir a carga de: {ex}', 'Mobilidade torácica antes do treino']],
  },
  pescoco: {
    c: [
      'Tensão cervical ou de trapézio, geralmente ligada a postura e estresse.',
      ['Observar a postura dos ombros na corrida'],
    ],
    f: [
      /desenvolvimento|encolhimento|remada alta|trap[eé]zio|terra|militar/,
      ['Reduzir a carga de: {ex}', 'Mobilidade cervical leve'],
    ],
  },
  ombro: {
    c: null,
    f: [
      /supino|desenvolvimento|eleva[cç][aã]o lateral|crucifixo|paralela|mergulho|flex[aã]o|militar|arremesso|push/,
      [
        'Evitar exercícios acima da cabeça por alguns dias',
        'Reduzir a carga de: {ex}',
        'Manter exercícios de manguito rotador e de escápula',
      ],
    ],
  },
  peito: {
    c: null,
    f: [/supino|crucifixo|flex[aã]o|paralela|peck|voador|push/, ['Reduzir a carga de: {ex}']],
    alerta:
      'Se a dor no peito não for muscular (aperto, falta de ar, dor que vai para o braço ou a mandíbula), orientar atendimento médico imediato.',
  },
  abdomen: { c: null, f: [/abdominal|prancha|crunch|eleva[cç][aã]o de pernas|terra|rota[cç][aã]o/, ['Reduzir: {ex}']] },
  braco: { c: null, f: [/rosca|b[ií]ceps|barra fixa|puxada|remada/, ['Reduzir a carga de: {ex}']] },
  triceps: { c: null, f: [/tr[ií]ceps|supino|paralela|mergulho|franc[eê]s|testa|push/, ['Reduzir a carga de: {ex}']] },
  antebraco: {
    c: null,
    f: [/rosca|terra|remada|barra|farmer|pegada/, ['Usar pegada neutra ou strap', 'Reduzir a carga de: {ex}']],
  },
  mao: {
    c: null,
    f: [
      /rosca|terra|remada|barra|farmer|pegada|flex[aã]o/,
      ['Usar pegada neutra ou strap', 'Reduzir a carga de: {ex}'],
    ],
  },
  // cólica marcada pela aluna (check-in ou área do ciclo): não é lesão, então o ajuste é só de intensidade
  colica: {
    c: [
      'Cólica menstrual. Exercício leve costuma aliviar a dor; treino intenso pode aumentar o desconforto nos dias de cólica forte.',
      [
        'Trocar tiros e treinos fortes por rodagem leve ou regenerativo nos dias de cólica forte',
        'Se ela se sentir bem, pode manter o treino: estar menstruada não é motivo para parar',
        'Cólica muito forte, que não melhora com analgésico comum ou que se repete todo ciclo: orientar avaliação ginecológica',
      ],
    ],
    f: [
      /abdominal|prancha|crunch|eleva[cç][aã]o de pernas|terra|agach|stiff|rdl|hip ?thrust|leg ?press/,
      ['Reduzir a carga de: {ex}', 'Evitar exercícios com muita pressão no abdome nos dias de cólica forte'],
    ],
  },
};
const baseReg = (k) => {
  const m = /^(.*)_(d|e)$/.exec(k);
  return m && SUG_DOR[m[1]] ? m[1] : k;
};
// junta os dados de um ou mais alunos para montar as sugestões
async function dadosSugestoes(alunoIds, diasPront = 2) {
  if (!alunoIds.length) return [];
  const ini = isoDia(Date.now() - diasPront * 864e5);
  const [pronts, ocultas] = await Promise.all([
    sb
      .from('nx_prontidao')
      .select('id,aluno_id,dia,dor,dor_locais,dor_int,obs,total')
      .eq('org_id', S.org.id)
      .in('aluno_id', alunoIds)
      .gte('dia', isoDia(Date.now() - 7 * 864e5))
      .order('dia', { ascending: false })
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_sug_ocultas')
      .select('chave')
      .eq('org_id', S.org.id)
      .in('aluno_id', alunoIds)
      .then(
        (r) => new Set((r.data || []).map((x) => x.chave)),
        () => new Set(),
      ),
  ]);
  const cics = await sb
    .from('nx_ciclo_dias')
    .select('id,aluno_id,dia,colica_int')
    .eq('org_id', S.org.id)
    .in('aluno_id', alunoIds)
    .gte('dia', ini)
    .gte('colica_int', 6)
    .order('dia', { ascending: false })
    .then(
      (r) => r.data || [],
      () => [],
    );
  const comDor = [
    ...pronts.filter((p) => p.dia >= ini && p.dor_locais && p.dor_locais.length),
    ...cics.map((x) => ({
      id: 'cic' + x.id,
      aluno_id: x.aluno_id,
      dia: x.dia,
      dor: null,
      dor_locais: ['colica'],
      dor_int: x.colica_int,
      obs: null,
    })),
  ].sort((a, b) => (a.dia < b.dia ? 1 : -1));
  const ids = [...new Set(comDor.map((p) => p.aluno_id))];
  if (!ids.length) return [];
  const ini28 = isoDia(Date.now() - 28 * 864e5);
  const [membs, corrs, trs, sess, ajs, cargas] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,sexo,modalidades,foto_url')
      .eq('org_id', S.org.id)
      .in('user_id', ids)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_corridas')
      .select('aluno_id,data,distancia_m,rpe,tipo,titulo')
      .in('aluno_id', ids)
      .gte('data', ini28)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_treinos')
      .select('aluno_id,titulo,nx_treino_itens(nx_exercicios(nome))')
      .in('aluno_id', ids)
      .eq('ativo', true)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_sessoes')
      .select('aluno_id,iniciado_em,psr,fase,treino_titulo')
      .in('aluno_id', ids)
      .gte('iniciado_em', isoDia(Date.now() - 7 * 864e5))
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_ajustes_dor')
      .select('id,chave,criado_em,desfeito_em')
      .eq('org_id', S.org.id)
      .in('aluno_id', ids)
      .is('desfeito_em', null)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    buscarCargas(ids).catch(() => ({})),
  ]);
  const out = [],
    vistos = new Set();
  for (const p of comDor) {
    // pronts vêm do mais novo ao mais antigo: vale a queixa mais recente de cada região
    const m = membs.find((x) => x.user_id === p.aluno_id);
    if (!m) continue;
    const regs = [...new Set(p.dor_locais)];
    const rep = (k) => pronts.filter((x) => x.aluno_id === p.aluno_id && (x.dor_locais || []).includes(k)).length;
    for (const k of regs) {
      if (vistos.has(p.aluno_id + k)) continue;
      vistos.add(p.aluno_id + k);
      const chave = `${p.id}:${k}`;
      if (ocultas.has(chave)) continue;
      const sg = montarSugestao(
        p,
        k,
        m,
        corrs.filter((c) => c.aluno_id === p.aluno_id),
        trs.filter((t) => t.aluno_id === p.aluno_id),
        sess.filter((x) => x.aluno_id === p.aluno_id),
        rep(k),
        chave,
        cargas[p.aluno_id],
      );
      if (sg) sg.ajuste = ajs.find((a) => a.chave === chave) || null;
      out.push(sg);
    }
  }
  return out.filter(Boolean);
}
function montarSugestao(p, k, m, corrs, trs, sess, repeticoes, chave, cg) {
  const b = baseReg(k),
    base = SUG_DOR[b];
  if (!base) return null;
  const fazC = faz('corrida', m),
    fazF = faz('musculacao', m);
  const blocos = [],
    dados = [],
    alertas = [];
  const int = p.dor_int;
  if (b === 'colica') {
    if (int != null && int >= 8)
      alertas.push(
        `Cólica muito forte (${int}/10). Se não melhorar com analgésico comum ou se repetir todo ciclo, orientar avaliação ginecológica.`,
      );
  } else if (int != null && int >= 7)
    alertas.push(
      `Dor intensa (${int}/10): encaminhar para avaliação de fisioterapeuta ou médico antes de treinar a região.`,
    );
  if (b !== 'colica' && repeticoes >= 3)
    alertas.push(`Dor relatada em ${repeticoes} check-ins nos últimos 7 dias: encaminhar para avaliação.`);
  if (base.alerta) alertas.push(base.alerta);
  // corrida: volume da semana e carga aguda x crônica
  if (fazC && base.c) {
    // mesmo cálculo do alerta de carga (painel de prontidão), para os números baterem
    if (cg && cg.salto)
      dados.push(
        `Treino de ${f1(cg.salto.km)} km nos últimos 7 dias, ${cg.salto.pct}% acima do mais longo dos 30 dias anteriores (${f1(cg.salto.mx)} km). Um treino isolado mais de 10% maior que o mais longo do último mês aumentou o risco de lesão no maior estudo sobre o tema (Frandsen et al. 2025).`,
      );
    if (cg && cg.acwr != null && cg.acwr >= 1.5)
      dados.push(
        `Carga dos últimos 7 dias ${f1(cg.acwr)}x a média das 4 semanas anteriores. Serve como monitoramento; essa relação sozinha não previu lesão nos estudos mais recentes.`,
      );
    const forte = corrs.find(
      (c) =>
        diasDesde(c.data) <= 2 && (c.rpe >= 8 || /tiro|interval|prova|fartlek/i.test(c.tipo + ' ' + (c.titulo || ''))),
    );
    if (forte)
      dados.push(
        `Treino forte de corrida há ${diasDesde(forte.data) || 'menos de 1'} dia(s)${forte.rpe ? ` (esforço ${forte.rpe}/10)` : ''}.`,
      );
    blocos.push({ t: 'Corrida', padrao: base.c[0], sug: base.c[1] });
  }
  // força: exercícios da ficha que carregam a região, fase e PSR
  if (fazF && base.f) {
    const nomes = [
      ...new Set(
        trs.flatMap((t) =>
          (t.nx_treino_itens || []).map((i) => i.nx_exercicios && i.nx_exercicios.nome).filter(Boolean),
        ),
      ),
    ];
    const ex = nomes.filter((n) => base.f[0].test(semAcento(n)) || base.f[0].test(n.toLowerCase()));
    const fase = (sess.find((x) => x.fase) || {}).fase;
    const psrs = sess.map((x) => x.psr).filter((x) => x != null);
    if (fase && FASES_F[fase])
      dados.push(
        `Força na fase de ${FASES_F[fase].n.toLowerCase()}${fase === 'forca' || fase === 'potencia' ? ' (cargas altas ou explosivas)' : ''}.`,
      );
    if (psrs.length && psrs.reduce((a, x) => a + x, 0) / psrs.length <= 4)
      dados.push(
        `Recuperação percebida baixa nas sessões da semana (PSR média ${f1(psrs.reduce((a, x) => a + x, 0) / psrs.length)}/10).`,
      );
    if (ex.length || !base.c) {
      const lista = ex.slice(0, 4).join(', ');
      blocos.push({
        t: 'Força',
        padrao: ex.length
          ? `Exercícios da ficha que carregam a região: ${lista}.`
          : 'Nenhum exercício da ficha atual carrega diretamente essa região.',
        sug: base.f[1].filter((x) => ex.length || !x.includes('{ex}')).map((x) => x.replace('{ex}', lista)),
      });
    }
  }
  if (
    fazC &&
    fazF &&
    blocos.length === 2 &&
    /joelho|canela|panturrilha|aquiles|coxa|quadril|gluteo|calcanhar|pe|tornozelo/.test(b)
  ) {
    const pesado = sess.some((x) => diasDesde(x.iniciado_em) <= 2),
      forteC = corrs.some(
        (c) => diasDesde(c.data) <= 2 && (c.rpe >= 8 || /tiro|interval/i.test(c.tipo + ' ' + (c.titulo || ''))),
      );
    if (pesado && forteC)
      dados.push('Força e corrida intensa nos últimos 2 dias: a soma das cargas pode ter contribuído.');
  }
  if (!blocos.length && !alertas.length) return null;
  return { chave, p, k, m, blocos, dados, alertas, rep: repeticoes };
}

/* ---------- ajuste pronto a partir da sugestão: treinos e textos escritos como o treinador ---------- */
const REG_PERNA = [
  'colica',
  'joelho',
  'canela',
  'panturrilha',
  'aquiles',
  'calcanhar',
  'pe',
  'tornozelo',
  'coxa_t',
  'coxa_f',
  'quadril',
  'gluteo',
  'lombar',
];
const DICA_DOR = {
  colica:
    'Ritmo confortável. Se a cólica apertar durante o treino, diminua o ritmo ou caminhe. Bolsa de água morna depois do treino ajuda.',
  joelho: 'Evite descidas e mantenha passadas curtas, com a cadência um pouco mais alta.',
  canela: 'Prefira terra batida ou grama. Se a dor aumentar durante a corrida, pare e caminhe.',
  panturrilha: 'Sem subidas e sem acelerações por enquanto.',
  aquiles: 'Sem subidas e sem tiros. Só corra se não sentir dor ao caminhar.',
  calcanhar: 'Evite piso duro e andar descalço. Alongue a sola do pé e a panturrilha depois do treino.',
  pe: 'Corra em piso regular e firme. Se a dor for num ponto do osso, me avise antes de correr.',
  tornozelo: 'Piso regular, nada de trilha por enquanto.',
  coxa_t: 'Nada de tiros ou acelerações. Rodagem leve e sem dor.',
  coxa_f: 'Evite descidas nesta semana.',
  quadril: 'Ritmo confortável e sem subidas. Se a dor for profunda na virilha, me avise.',
  gluteo: 'Ritmo confortável e sem subidas. Se a dor descer para a perna, me avise.',
  lombar: 'Ritmo confortável, postura alta e core ativo. Se a dor descer para a perna, me avise.',
};
const ehForte = (p) =>
  /tiros|intervalado|ritmo|fartlek|longao|teste/.test(p.tipo || '') ||
  estruturaDe(p).some(
    (e) =>
      ['limiar', 'intervalado', 'tiros'].includes(e.z) ||
      (e.passos || []).some((x) => ['limiar', 'intervalado', 'tiros'].includes(x.z)),
  );
const nivelDor = (x) =>
  x.k === 'colica'
    ? x.p.dor_int != null && x.p.dor_int >= 8
      ? 'medio'
      : 'leve'
    : (x.p.dor_int != null && x.p.dor_int >= 7) || x.rep >= 3 || x.p.dor === 1
      ? 'alto'
      : x.p.dor_int != null && x.p.dor_int <= 3
        ? 'leve'
        : 'medio';
const min5 = (v) => Math.max(15, Math.round(v / 5) * 5);
async function dadosAjuste(x) {
  const hoje = hojeISO(),
    fimSem = somaDias(isoDia(inicioSemana()), 6);
  const ate = fimSem > somaDias(hoje, 2) ? fimSem : somaDias(hoje, 6);
  const [pl, trs, mb] = await Promise.all([
    sb
      .from('nx_plano_corrida')
      .select('*')
      .eq('aluno_id', x.m.user_id)
      .gte('data', hoje)
      .lte('data', ate)
      .order('data')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_treinos')
      .select('id,titulo,nx_treino_itens(id,observacao,nx_exercicios(nome))')
      .eq('aluno_id', x.m.user_id)
      .eq('ativo', true)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_membros')
      .select('corrida,nascimento,nome')
      .eq('org_id', S.org.id)
      .eq('user_id', x.m.user_id)
      .maybeSingle()
      .then(
        (r) => r.data || {},
        () => ({}),
      ),
  ]);
  const ids = pl.map((q) => q.id);
  const feitos = ids.length
    ? await sb
        .from('nx_corridas')
        .select('plano_id')
        .in('plano_id', ids)
        .then(
          (r) => new Set((r.data || []).map((c) => c.plano_id)),
          () => new Set(),
        )
    : new Set();
  return {
    plano: pl.filter((q) => !feitos.has(q.id) && q.tipo !== 'prova'),
    provas: pl.filter((q) => q.tipo === 'prova'),
    trs,
    perfil: perfilCorrida({ ...x.m, ...mb }),
    ate,
  };
}
function proporAjuste(x, d, nivel) {
  const b = baseReg(x.k),
    reg = nomeRegDor(x.k).toLowerCase(),
    hoje = hojeISO();
  const motivo =
    b === 'colica'
      ? `Ajustado por causa da cólica ${x.p.dor_int != null ? `(${x.p.dor_int}/10) ` : ''}que você registrou.`
      : `Ajustado por causa da dor ${x.p.dor_int != null ? `(${x.p.dor_int}/10) ` : ''}que você marcou no check-in: ${reg}.`;
  const dica = DICA_DOR[b] || '';
  const fim = 'Se a dor passar de 5 de 10 durante o treino, pare e me avise.';
  const corr = [];
  if (faz('corrida', x.m) && REG_PERNA.includes(b)) {
    d.plano
      .filter((q) => !semCorrida(q))
      .forEach((q) => {
        const tt = estimaTotalSeg(estruturaDe(q), d.perfil),
          durMin = tt && tt[1] ? (tt[0] + tt[1]) / 2 / 60 : +q.duracao_min || 40;
        const forte = ehForte(q);
        let novo = null;
        if (nivel === 'alto')
          novo =
            q.data === hoje
              ? { tipo: 'folga', titulo: 'Folga (recuperação)', min: null, z: null }
              : forte
                ? { tipo: 'regenerativo', titulo: 'Regenerativo', min: Math.min(30, min5(durMin * 0.5)), z: 'rec' }
                : { tipo: 'regenerativo', titulo: 'Regenerativo', min: Math.min(35, min5(durMin * 0.6)), z: 'rec' };
        else if (nivel === 'medio')
          novo = forte
            ? { tipo: 'rodagem', titulo: 'Rodagem leve', min: min5(durMin * 0.8), z: 'leve' }
            : durMin > 25
              ? {
                  tipo: q.tipo === 'regenerativo' ? 'regenerativo' : 'rodagem',
                  titulo: q.tipo === 'regenerativo' ? 'Regenerativo' : 'Rodagem leve',
                  min: min5(durMin * 0.8),
                  z: q.tipo === 'regenerativo' ? 'rec' : 'leve',
                }
              : null;
        else novo = forte ? { tipo: 'rodagem', titulo: 'Rodagem leve', min: min5(durMin), z: 'leve' } : null;
        if (!novo) return;
        const desc =
          novo.tipo === 'folga'
            ? `${motivo} Hoje é dia de descanso para a região recuperar. ${nivel === 'alto' ? 'Quero que você procure uma avaliação antes de voltar a correr.' : ''}`.trim()
            : `${motivo} Troquei ${q.titulo ? `"${q.titulo}"` : 'o treino'} por ${novo.titulo.toLowerCase()} de ${novo.min} min em ritmo confortável. ${dica} ${fim}`
                .replace(/\s+/g, ' ')
                .trim();
        corr.push({
          q,
          novo,
          desc,
          de: `${q.titulo || nomeTipo(q.tipo)}${durMin ? ` (~${Math.round(durMin)} min)` : ''}`,
          para: novo.tipo === 'folga' ? 'Folga' : `${novo.titulo} ${novo.min} min`,
        });
      });
  }
  const forca = [];
  if (faz('musculacao', x.m) && SUG_DOR[b] && SUG_DOR[b].f) {
    const re = SUG_DOR[b].f[0];
    d.trs.forEach((t) =>
      (t.nx_treino_itens || []).forEach((it) => {
        const n = it.nx_exercicios && it.nx_exercicios.nome;
        if (!n || !(re.test(semAcento(n)) || re.test(n.toLowerCase()))) return;
        const impacto = /salto|pliom|corda|box|pular/.test(semAcento(n));
        const tipo = nivel === 'alto' || impacto ? 'pausar' : 'reduzir';
        const nota =
          tipo === 'pausar'
            ? `Pausado até ${fmtCurto(d.ate)} por causa da dor: ${reg}. Pule este exercício.`
            : `Até ${fmtCurto(d.ate)}: use cerca de 30% menos carga e amplitude confortável, sem dor. Motivo: dor (${reg}).`;
        forca.push({ it, t, n, tipo, nota });
      }),
    );
  }
  return { corr, forca, msg: msgAjuste(x, corr, forca, nivel) };
}
function msgAjuste(x, corr, forca, nivel) {
  const b = baseReg(x.k),
    reg = nomeRegDor(x.k).toLowerCase(),
    dica = DICA_DOR[b] || '',
    fim = 'Se a dor passar de 5 de 10 durante o treino, pare e me avise.';
  const diaC = (q) => `${DSEM[dsemIdx(q.data)].slice(0, 3)} ${fmtCurto(q.data)}`;
  const linhas = [
    ...corr.map((c) => `- ${diaC(c.q)}: ${c.para}`),
    ...forca.map((f) => `- ${f.n}: ${f.tipo === 'pausar' ? 'pausado' : 'carga reduzida'}`),
  ];
  if (b === 'colica')
    return [
      `Oi, ${firstName(x.m.nome)}! Vi que você registrou cólica ${x.p.dor_int != null ? `(${x.p.dor_int}/10) ` : ''}hoje.`,
      linhas.length
        ? `Deixei os próximos treinos mais leves:\n${linhas.join('\n')}`
        : 'Treine pela sensação nos próximos dias.',
      dica,
      'Se a cólica estiver muito forte e não melhorar com o remédio de costume, vale conversar com o seu ginecologista.',
      'Qualquer coisa, me chama por aqui.',
    ]
      .filter(Boolean)
      .join('\n\n');
  return [
    `Oi, ${firstName(x.m.nome)}! Vi no seu check-in a dor ${x.p.dor_int != null ? `(${x.p.dor_int}/10) ` : ''}que você marcou: ${reg}.`,
    linhas.length
      ? `Ajustei seus treinos para a região recuperar:\n${linhas.join('\n')}`
      : 'Vamos acompanhar de perto nos próximos dias.',
    dica,
    nivel === 'alto'
      ? 'Como a dor está forte, quero que você procure uma avaliação com fisioterapeuta ou médico antes de voltar a treinar a região.'
      : fim,
    'Qualquer coisa, me chama por aqui.',
  ]
    .filter(Boolean)
    .join('\n\n');
}
async function revisarAjuste(x, depois) {
  const d = await dadosAjuste(x);
  // cólica passa em poucos dias: o ajuste vale só para hoje e os 2 dias seguintes
  if (x.k === 'colica') {
    d.ate = somaDias(hojeISO(), 2);
    d.plano = d.plano.filter((q) => q.data <= d.ate);
  }
  let nivel = nivelDor(x),
    prop = proporAjuste(x, d, nivel);
  const reg = nomeRegDor(x.k).toLowerCase();
  const corpo =
    () => `<p class="eyebrow">Ajuste pronto · revise antes de aplicar</p><div class="h2" style="margin-top:4px">${esc(firstName(x.m.nome))} · dor: ${esc(reg)}</div>
    <p class="small muted" style="margin-top:4px">O app montou os treinos e os textos como se fosse você. Desmarque o que não quiser e edite o que precisar.</p>
    <div class="seg aj-niv" style="margin-top:12px">${[
      ['leve', 'Dor leve'],
      ['medio', 'Moderada'],
      ['alto', 'Forte'],
    ]
      .map(([k, l]) => `<button type="button" data-niv="${k}" class="${nivel === k ? 'on' : ''}">${l}</button>`)
      .join('')}</div>
    ${d.provas.length ? `<p class="sug-alerta">Prova na semana (${esc(d.provas[0].titulo || 'prova')}, ${fmtCurto(d.provas[0].data)}): ela não foi alterada. Avalie se ele deve correr.</p>` : ''}
    ${prop.corr.length ? `<p class="sec-lbl" style="margin-top:16px">Corrida</p><div class="stack">${prop.corr.map((c, i) => `<div class="aj-item"><label class="aj-chk"><input type="checkbox" data-c="${i}" checked><span><b>${esc(DSEM[dsemIdx(c.q.data)].slice(0, 3))} ${fmtCurto(c.q.data)}</b> · ${esc(c.de)} <i>→</i> <b>${esc(c.para)}</b></span></label><textarea class="textarea" rows="4" data-cd="${i}">${esc(c.desc)}</textarea></div>`).join('')}</div>` : faz('corrida', x.m) && REG_PERNA.includes(baseReg(x.k)) ? '<p class="small muted" style="margin-top:12px">Nenhum treino de corrida a mudar nesta semana.</p>' : ''}
    ${prop.forca.length ? `<p class="sec-lbl" style="margin-top:16px">Força</p><div class="stack">${prop.forca.map((f, i) => `<div class="aj-item"><label class="aj-chk"><input type="checkbox" data-f="${i}" checked><span><b>${esc(f.n)}</b> <small class="muted">(${esc(f.t.titulo)})</small></span></label><div class="seg aj-tipo" data-ft="${i}"><button type="button" data-v="reduzir" class="${f.tipo === 'reduzir' ? 'on' : ''}">Reduzir carga</button><button type="button" data-v="pausar" class="${f.tipo === 'pausar' ? 'on' : ''}">Pausar</button></div><textarea class="textarea" rows="2" data-fd="${i}">${esc(f.nota)}</textarea></div>`).join('')}</div>` : ''}
    <p class="sec-lbl" style="margin-top:16px">Mensagem para o aluno</p>
    <label class="aj-chk"><input type="checkbox" id="aj-msg-on" checked><span>Enviar esta mensagem (ele recebe notificação)</span></label>
    <textarea class="textarea" rows="9" id="aj-msg">${esc(prop.msg)}</textarea>
    <button class="btn block" id="aj-aplicar" style="margin-top:14px">${I.check} Aplicar ajustes</button>
    <p class="tiny dim center" style="margin-top:8px">Dá para desfazer depois, pelo card da sugestão.</p>`;
  openSheet(corpo(), (r) => {
    const bind = () => {
      r.querySelectorAll('[data-niv]').forEach(
        (b) =>
          (b.onclick = () => {
            nivel = b.dataset.niv;
            prop = proporAjuste(x, d, nivel);
            const sh = r.querySelector('.sheet-c') || r;
            sh.innerHTML = corpo();
            bindOuter();
          }),
      );
      r.querySelectorAll('[data-ft]').forEach(
        (sg) =>
          (sg.onclick = (e) => {
            const b = e.target.closest('[data-v]');
            if (!b) return;
            const f = prop.forca[+sg.dataset.ft];
            f.tipo = b.dataset.v;
            sg.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y === b));
            const ta = r.querySelector(`[data-fd="${sg.dataset.ft}"]`);
            ta.value =
              f.tipo === 'pausar'
                ? `Pausado até ${fmtCurto(d.ate)} por causa da dor: ${reg}. Pule este exercício.`
                : `Até ${fmtCurto(d.ate)}: use cerca de 30% menos carga e amplitude confortável, sem dor. Motivo: dor (${reg}).`;
          }),
      );
      let msgAuto = r.querySelector('#aj-msg').value;
      const refazMsg = () => {
        const ta = r.querySelector('#aj-msg');
        if (ta.value !== msgAuto) return;
        const selC = prop.corr.filter((_, i) => r.querySelector(`[data-c="${i}"]`).checked),
          selF = prop.forca.filter((_, i) => r.querySelector(`[data-f="${i}"]`).checked);
        msgAuto = ta.value = msgAjuste(x, selC, selF, nivel);
      };
      r.querySelectorAll('[data-c],[data-f]').forEach((cb) => (cb.onchange = refazMsg));
      r.querySelectorAll('[data-ft]').forEach((sg) => sg.addEventListener('click', () => setTimeout(refazMsg, 0)));
      r.querySelector('#aj-aplicar').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Aplicando…';
        try {
          const selC = prop.corr
            .filter((_, i) => r.querySelector(`[data-c="${i}"]`).checked)
            .map((c) => ({ ...c, desc: r.querySelector(`[data-cd="${prop.corr.indexOf(c)}"]`).value.trim() }));
          const selF = prop.forca
            .filter((_, i) => r.querySelector(`[data-f="${i}"]`).checked)
            .map((f) => ({ ...f, nota: r.querySelector(`[data-fd="${prop.forca.indexOf(f)}"]`).value.trim() }));
          const msgOn = r.querySelector('#aj-msg-on').checked,
            texto = r.querySelector('#aj-msg').value.trim();
          await aplicarAjuste(x, d, selC, selF, msgOn ? texto : '');
          closeSheet();
          toast('Ajuste aplicado. O aluno já vê os treinos novos.');
          depois && depois();
        } catch (er) {
          console.error(er);
          btn.disabled = false;
          btn.textContent = 'Aplicar ajustes';
          toast(er.message || 'Não foi possível aplicar.', true);
        }
      };
    };
    const bindOuter = () => bind();
    bind();
  });
}
const CAMPOS_PLANO = ['tipo', 'titulo', 'distancia_km', 'duracao_min', 'zona', 'descricao', 'estrutura'];
async function aplicarAjuste(x, d, selC, selF, texto) {
  const antes = [],
    mudados = [],
    comGarmin = selC.filter((c) => c.q.garmin_workout_id).map((c) => ({ plano_id: c.q.id }));
  if (comGarmin.length)
    await chamarGarmin({ acao: 'remover_treinos', aluno_id: x.m.user_id, itens: comGarmin }).catch(() => {});
  for (const c of selC) {
    antes.push(Object.fromEntries(['id', ...CAMPOS_PLANO].map((k) => [k, c.q[k] ?? null])));
    const upd =
      c.novo.tipo === 'folga'
        ? {
            tipo: 'folga',
            titulo: c.novo.titulo,
            distancia_km: null,
            duracao_min: null,
            zona: null,
            estrutura: null,
            descricao: c.desc,
          }
        : {
            tipo: c.novo.tipo,
            titulo: c.novo.titulo,
            distancia_km: null,
            duracao_min: c.novo.min,
            zona: c.novo.z,
            estrutura: [passo('co', c.novo.min, 'min', c.novo.z)],
            descricao: c.desc,
          };
    const { error } = await sb
      .from('nx_plano_corrida')
      .update({ ...upd, garmin_workout_id: null, garmin_schedule_id: null, garmin_enviado_em: null, garmin_erro: null })
      .eq('id', c.q.id);
    if (error) throw new Error('Não foi possível mudar a planilha.');
    mudados.push({ ...c.q, ...upd, garmin_workout_id: null });
  }
  let mensagem_id = null;
  if (texto) {
    const { data: nm } = await sb
      .from('nx_mensagens')
      .insert({ org_id: S.org.id, aluno_id: x.m.user_id, autor_id: S.user.id, texto })
      .select('id')
      .single();
    if (nm) {
      mensagem_id = nm.id;
      notificar('mensagem', nm.id);
    }
  }
  const { data: aj, error: e2 } = await sb
    .from('nx_ajustes_dor')
    .insert({ org_id: S.org.id, aluno_id: x.m.user_id, chave: x.chave, regiao: x.k, plano_antes: antes, mensagem_id })
    .select('id')
    .single();
  if (e2) throw new Error('O ajuste foi feito, mas não foi possível registrar o histórico.');
  if (selF.length)
    await sb
      .from('nx_ajustes_forca')
      .insert(
        selF.map((f) => ({
          org_id: S.org.id,
          aluno_id: x.m.user_id,
          item_id: f.it.id,
          tipo: f.tipo,
          nota: f.nota || null,
          ate: d.ate,
          ajuste_id: aj.id,
        })),
      );
  if (comGarmin.length || S.cache.garmOn)
    sincronizarGarmin(
      x.m.user_id,
      mudados.filter((q) => !semCorrida(q)),
      d.perfil,
      true,
    ).catch(() => {});
  x.ajuste = { id: aj.id, chave: x.chave, criado_em: new Date().toISOString() };
}
async function desfazerAjuste(x, depois) {
  const { data: aj } = await sb.from('nx_ajustes_dor').select('*').eq('id', x.ajuste.id).maybeSingle();
  if (!aj) return;
  const ids = (aj.plano_antes || []).map((q) => q.id);
  const atuais = ids.length
    ? await sb
        .from('nx_plano_corrida')
        .select('id,garmin_workout_id')
        .in('id', ids)
        .then(
          (r) => r.data || [],
          () => [],
        )
    : [];
  const noG = atuais.filter((q) => q.garmin_workout_id).map((q) => ({ plano_id: q.id }));
  if (noG.length) await chamarGarmin({ acao: 'remover_treinos', aluno_id: x.m.user_id, itens: noG }).catch(() => {});
  for (const q of aj.plano_antes || []) {
    const { id, ...resto } = q;
    await sb
      .from('nx_plano_corrida')
      .update({
        ...resto,
        garmin_workout_id: null,
        garmin_schedule_id: null,
        garmin_enviado_em: null,
        garmin_erro: null,
      })
      .eq('id', id);
  }
  await sb.from('nx_ajustes_forca').delete().eq('ajuste_id', aj.id);
  await sb.from('nx_ajustes_dor').update({ desfeito_em: new Date().toISOString() }).eq('id', aj.id);
  x.ajuste = null;
  toast('Ajuste desfeito: os treinos voltaram ao que eram.');
  depois && depois();
}
function recarregarSug(root, sugs, x, depois) {
  const c = root.querySelector(`[data-sug="${CSS.escape(x.chave)}"]`);
  if (c) {
    c.outerHTML = sugCardHTML(x, !!root.closest('#sug-hoje'));
    bindSugestoes(root, sugs, depois);
  }
}

function sugCardHTML(x, comNome = true) {
  const nm = firstName(x.m.nome),
    reg = nomeRegDor(x.k).toLowerCase();
  return `<div class="card sug-card" data-sug="${esc(x.chave)}"><div class="sug-top"><span class="sug-ic">${PRONT_IC}</span><div class="grow"><span class="eyebrow">Sugestão do app${x.p.dia === hojeISO() ? ' · hoje' : ' · ' + fmtCurto(x.p.dia)}</span><b>${comNome ? esc(nm) + ' · ' : ''}dor: ${esc(reg)}${x.p.dor_int != null ? ` (${x.p.dor_int}/10)` : ''}</b></div><button type="button" class="sug-x" data-ocultar="${esc(x.chave)}" aria-label="Ocultar sugestão">${I.x}</button></div>
    ${x.alertas.map((a) => `<p class="sug-alerta">${a}</p>`).join('')}
    ${x.dados.length ? `<ul class="sug-dados">${x.dados.map((d) => `<li>${d}</li>`).join('')}</ul>` : ''}
    ${x.blocos.map((bk) => `<div class="sug-bloco"><span class="sug-t">${bk.t}</span><p class="small muted">${bk.padrao}</p><ul>${bk.sug.map((sg) => `<li>${esc(sg)}</li>`).join('')}</ul></div>`).join('')}
    ${x.p.obs ? `<p class="small muted" style="margin-top:6px">Recado: "${esc(x.p.obs)}"</p>` : ''}
    ${
      x.ajuste
        ? `<div class="sug-ok">${I.check}<span class="grow">Ajuste aplicado ${fmtData ? fmtData(x.ajuste.criado_em) : ''}. O aluno já vê os treinos novos e a sua mensagem.</span><button type="button" class="link-btn small" data-desfazer="${x.ajuste.id}">Desfazer</button></div>`
        : `<div class="row sug-acoes"><button type="button" class="btn sm" data-revisar="${esc(x.chave)}">Revisar ajuste pronto</button><a class="btn ghost sm" href="#/aluno/${x.m.user_id}/${faz('corrida', x.m) ? 'corrida' : 'forca'}">Abrir planilha</a><button type="button" class="link-btn small" data-msg="${x.m.user_id}" data-reg="${esc(reg)}" data-nome="${esc(nm)}">Só mandar mensagem</button><button type="button" class="link-btn small" data-ocultar="${esc(x.chave)}">Ocultar</button></div>`
    }
    <p class="tiny dim">Sugestão baseada em padrões da literatura, não é diagnóstico. A decisão é do treinador. O aluno não vê este card.</p></div>`;
}
function bindSugestoes(root, sugs, depois) {
  root.querySelectorAll('[data-ocultar]').forEach(
    (b) =>
      (b.onclick = async () => {
        const ch = b.dataset.ocultar,
          x = sugs.find((y) => y.chave === ch);
        if (!x) return;
        const { error } = await sb
          .from('nx_sug_ocultas')
          .insert({ org_id: S.org.id, aluno_id: x.m.user_id, chave: ch });
        if (error && !/duplicate/i.test(error.message || '')) return toast('Não foi possível ocultar.', true);
        const c = root.querySelector(`[data-sug="${CSS.escape(ch)}"]`);
        if (c) c.remove();
        toast('Sugestão ocultada.');
        if (depois) depois();
      }),
  );
  root.querySelectorAll('[data-revisar]').forEach(
    (b) =>
      (b.onclick = () => {
        const x = sugs.find((y) => y.chave === b.dataset.revisar);
        if (x) revisarAjuste(x, () => recarregarSug(root, sugs, x, depois));
      }),
  );
  root.querySelectorAll('[data-desfazer]').forEach(
    (b) =>
      (b.onclick = () => {
        const x = sugs.find((y) => y.ajuste && y.ajuste.id === b.dataset.desfazer);
        if (x) desfazerAjuste(x, () => recarregarSug(root, sugs, x, depois));
      }),
  );
  root.querySelectorAll('[data-msg]').forEach(
    (b) =>
      (b.onclick = () => {
        try {
          sessionStorage.setItem(
            'nx-rasc-' + b.dataset.msg,
            `Oi, ${b.dataset.nome}! Vi no seu check-in a dor que você marcou (${b.dataset.reg}). Como está agora? Vou ajustar seus próximos treinos.`,
          );
        } catch {}
        location.hash = `#/aluno/${b.dataset.msg}/conversa`;
      }),
  );
}
