/* Nexos App · Saúde da atleta: o ciclo cruzado com o treino, os sinais de baixa energia (RED-S) e as fases da vida
   (gestação, pós-parto, perimenopausa e menopausa).
   Fontes: IOC 2023 sobre RED-S (Mountjoy et al., Br J Sports Med); ACOG 2020 e diretriz canadense 2019 (Mottola et al.)
   sobre exercício na gestação; Goom, Donnelly e Brockwell 2019 sobre a volta à corrida no pós-parto; LIFTMOR
   (Watson et al., 2018) sobre força e osso na pós-menopausa; McNulty et al. 2020 sobre o ciclo e o desempenho. */

/* ---------- fases da vida ---------- */
const FASES_VIDA = [
  ['gestante', 'Gestação', 'Data prevista do parto'],
  ['pos_parto', 'Pós-parto', 'Data do parto'],
  ['perimenopausa', 'Perimenopausa', ''],
  ['menopausa', 'Menopausa', ''],
];
const FV_IC =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.4-9.2-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.2 12C19 16.6 12 21 12 21z"/></svg>';
const ENERGIA_IC =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M7 10v4"/></svg>';
const semanasEntre = (a, b) => Math.floor((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / (7 * 864e5));

/** o que a fase da vida pede, já com a semana em que ela está */
function faseVidaInfo(m) {
  const fv = m && m.fase_vida;
  if (!fv || !fv.tipo) return null;
  const hoje = hojeISO();
  if (fv.tipo === 'gestante') {
    const sem = fv.data
      ? Math.max(0, Math.min(42, 40 - Math.ceil((Date.parse(fv.data + 'T12:00:00') - Date.now()) / (7 * 864e5))))
      : null;
    const tri = sem == null ? '' : sem <= 13 ? '1º trimestre' : sem <= 27 ? '2º trimestre' : '3º trimestre';
    return {
      tipo: 'gestante',
      titulo: 'Gestação',
      sub: sem != null ? `${sem} semanas · ${tri}` : 'Defina a data prevista do parto',
      etapa: 'Treinar com segurança, pela sensação',
      treino: [
        'Pelo menos 150 minutos por semana de atividade moderada, com a liberação do médico e uma gestação sem complicações.',
        'Intensidade pelo esforço e pelo teste da fala: dá para conversar enquanto corre (esforço até uns 6 de 10).',
        'Quem já corria pode continuar, diminuindo volume e ritmo conforme o conforto.',
        'Força com cargas moderadas. A partir do 2º trimestre, evitar ficar muito tempo deitada de barriga para cima.',
        'Fugir do calor forte e beber água antes, durante e depois. Evitar atividades com risco de queda ou de batida na barriga.',
      ],
      parar: [
        'Sangramento ou perda de líquido pela vagina',
        'Contrações regulares e doloridas',
        'Tontura, desmaio, dor no peito ou falta de ar antes do esforço',
        'Dor de cabeça forte, ou dor e inchaço na panturrilha',
        'Diminuição dos movimentos do bebê',
      ],
      fonte: 'ACOG 2020 e diretriz canadense de atividade física na gestação (Mottola et al., 2019).',
      pse: true,
    };
  }
  if (fv.tipo === 'pos_parto') {
    const sem = fv.data ? Math.max(0, semanasEntre(fv.data, hoje)) : null;
    const etapa =
      sem == null
        ? 'Defina a data do parto'
        : sem < 6
          ? 'Recuperação'
          : sem < 12
            ? 'Força e assoalho pélvico'
            : 'Volta gradual à corrida';
    const ces = fv.parto === 'cesarea';
    return {
      tipo: 'pos_parto',
      titulo: 'Pós-parto',
      sub: sem != null ? `${sem} semanas depois do parto${ces ? ' · cesárea' : ''}` : 'Defina a data do parto',
      etapa,
      treino:
        sem != null && sem < 6
          ? [
              'Caminhadas leves e exercícios de respiração e de assoalho pélvico, se liberada pelo médico.',
              ces ? 'Cesárea: esperar a liberação da cicatriz antes de qualquer exercício de abdômen.' : '',
              'Ainda sem corrida e sem impacto.',
            ]
          : sem != null && sem < 12
            ? [
                'Fortalecimento progressivo: glúteos, pernas, abdômen profundo e assoalho pélvico.',
                'Caminhadas mais longas e bicicleta leve.',
                'O ideal é uma avaliação com fisioterapeuta pélvica antes de voltar a correr.',
              ]
            : [
                'A partir de 12 semanas, a volta à corrida pode começar com corre e caminha, se ela passou na avaliação do assoalho pélvico e nos testes abaixo.',
                'Testes de prontidão: caminhar 30 minutos; ficar num pé só por 10 segundos; 10 agachamentos num pé só de cada lado; 10 pulinhos no lugar; 1 minuto de corrida parada no lugar. Tudo sem dor, sem perder urina e sem peso na vagina.',
                'Se der para todos, o ciclo "Do zero aos 5 km" é um bom começo.',
              ],
      parar: [
        'Perda de urina ou de fezes',
        'Sensação de peso ou pressão na vagina',
        'Dor na pelve, na lombar ou na cicatriz',
        'Sangramento que volta depois de ter parado',
      ],
      fonte: 'Guia de volta à corrida no pós-parto (Goom, Donnelly e Brockwell, 2019).',
      ciclo: sem != null && sem >= 12 ? 'ini-zero' : null,
      pse: sem != null && sem < 12,
    };
  }
  const meno = fv.tipo === 'menopausa';
  return {
    tipo: fv.tipo,
    titulo: meno ? 'Menopausa' : 'Perimenopausa',
    sub: meno ? 'Mais de 12 meses sem menstruar' : 'Transição para a menopausa',
    etapa: 'Força e osso em primeiro lugar',
    treino: [
      'Força com carga alta (o peso que dá para fazer 5 a 8 vezes, com boa técnica), 2 a 3 vezes por semana: protege o osso e a massa muscular.',
      'Impacto ajuda o osso: corrida e saltos, começando devagar e aumentando aos poucos.',
      'Mais dias leves entre os fortes: calorões e sono pior atrasam a recuperação.',
      'Proteína em todas as refeições, cálcio e vitamina D: vale conversar com nutricionista e médico.',
    ],
    parar: [
      'Dor óssea que não passa',
      meno ? 'Sangramento depois de 12 meses sem menstruar' : 'Sangramento muito intenso ou fora do comum',
      'Palpitação, tontura ou falta de ar fora do normal',
    ],
    fonte: 'LIFTMOR (Watson et al., 2018) e consenso sobre exercício na menopausa.',
  };
}
/** cartão da fase da vida (para a aluna no Hoje e para o treinador na Saúde da atleta) */
function faseVidaCardHTML(m, staff) {
  const f = faseVidaInfo(m);
  if (!f) return '';
  return `<div class="card sa-card fv-card"><div class="sa-top"><span class="sa-ic">${FV_IC}</span><div class="sa-txt"><span class="eyebrow">${staff ? 'Fase da vida' : 'Cuidados desta fase'}</span><b>${esc(f.titulo)}</b><span>${esc(f.sub)}</span></div>${staff ? '<button class="btn ghost sm" type="button" data-fv-ed>Alterar</button>' : ''}</div>
    <div class="fv-etapa">${esc(f.etapa)}</div>
    <ul class="sug-lista">${f.treino
      .filter(Boolean)
      .map((t) => `<li>${esc(t)}</li>`)
      .join('')}</ul>
    <div class="fv-parar"><b>${staff ? 'Ela deve parar e procurar o médico se tiver' : 'Pare e procure o médico se tiver'}</b><ul>${f.parar.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    ${staff && f.pse && !(m.corrida || {}).modo_pse ? `<button class="btn sm" type="button" data-fv-pse style="margin-top:12px">Passar os treinos para esforço (sem pace)</button>` : ''}
    ${staff && f.ciclo ? `<a class="btn ghost sm" href="#/treinos/ciclos/${f.ciclo}" data-sugal="${m.user_id}" style="margin-top:12px">Ver o ciclo Do zero aos 5 km</a>` : ''}
    <p class="tiny dim" style="margin-top:10px">${esc(f.fonte)} ${staff ? 'Orientação geral: vale sempre a liberação do médico dela.' : 'Siga sempre a liberação do seu médico.'}</p></div>`;
}
/** treinador marca a fase da vida */
function editarFaseVida(m, depois) {
  const fv = m.fase_vida || {};
  openSheet(
    `<p class="eyebrow">Saúde da atleta</p><div class="h2" style="margin-top:4px">Fase da vida</div>
    <p class="small muted" style="margin-top:4px">Muda as orientações que ela vê no app e o que aparece para você.</p>
    <form id="fv-f" style="margin-top:12px">
      <div class="fv-opcoes">${[['', 'Nenhuma'], ...FASES_VIDA]
        .map(
          ([k, l]) =>
            `<label class="chipc"><input type="radio" name="tipo" value="${k}" ${(fv.tipo || '') === k ? 'checked' : ''}><span>${l}</span></label>`,
        )
        .join('')}</div>
      <label class="field" id="fv-data" hidden><span id="fv-data-l">Data</span><input class="input" type="date" name="data" value="${esc(fv.data || '')}"></label>
      <div class="field" id="fv-parto" hidden><span>Tipo de parto</span><div class="fv-opcoes">${[
        ['normal', 'Normal'],
        ['cesarea', 'Cesárea'],
      ]
        .map(
          ([k, l]) =>
            `<label class="chipc"><input type="radio" name="parto" value="${k}" ${(fv.parto || 'normal') === k ? 'checked' : ''}><span>${l}</span></label>`,
        )
        .join('')}</div></div>
      <button class="btn block" style="margin-top:14px">Salvar</button></form>`,
    (r) => {
      const f = r.querySelector('#fv-f');
      const mostra = () => {
        const t = f.tipo.value;
        const def = FASES_VIDA.find((x) => x[0] === t);
        r.querySelector('#fv-data').hidden = !(def && def[2]);
        if (def && def[2]) r.querySelector('#fv-data-l').textContent = def[2];
        r.querySelector('#fv-parto').hidden = t !== 'pos_parto';
      };
      f.onchange = mostra;
      mostra();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const t = f.tipo.value;
        const novo = t
          ? {
              tipo: t,
              data: f.data.value || null,
              ...(t === 'pos_parto' ? { parto: f.parto.value } : {}),
              atualizado_em: new Date().toISOString(),
            }
          : null;
        if (novo && ['gestante', 'pos_parto'].includes(t) && !novo.data) return toast('Coloque a data.', true);
        const { error } = await sb
          .from('nx_membros')
          .update({ fase_vida: novo })
          .eq('org_id', S.org.id)
          .eq('user_id', m.user_id);
        if (error) return toast('Não foi possível salvar.', true);
        m.fase_vida = novo;
        closeSheet();
        toast('Fase da vida salva.');
        if (depois) depois();
      };
    },
  );
}

/* ---------- sinais de baixa energia (RED-S) ----------
   Baixa disponibilidade de energia: o corpo recebe menos energia do que gasta e passa a economizar (ciclo, osso,
   desempenho, imunidade). Acontece em mulheres e em homens. O app não diagnostica: junta os sinais e avisa o treinador. */
const OSSO_REG = ['canela', 'pe', 'calcanhar', 'quadril'];
const OSSO_TXT = /canela|t[ií]bia|\bp[eé]\b|p[eé]s\b|metatars|calcanh|quadril|virilha|f[eê]mur|bacia/i;
const SINAIS_RED = [
  ['ciclo', 'Ciclo menstrual'],
  ['desempenho', 'Desempenho'],
  ['cansaco', 'Cansaço'],
  ['osso', 'Dor em osso'],
  ['peso', 'Peso'],
];
/** busca tudo o que os sinais precisam, de um aluno ou da equipe inteira, em poucas consultas */
async function sinaisEnergia(ids) {
  const out = {};
  if (!ids || !ids.length) return out;
  const d = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const q = (p) => p.then((r) => r.data || []).catch(() => []);
  const [ms, pr, co, se, av, ci, ini] = await Promise.all([
    q(
      sb
        .from('nx_membros')
        .select('user_id,nome,sexo,nascimento,objetivo,corrida,fase_vida')
        .eq('org_id', S.org.id)
        .in('user_id', ids),
    ),
    q(
      sb
        .from('nx_prontidao')
        .select('aluno_id,dia,energia,dor_locais')
        .in('aluno_id', ids)
        .gte('dia', d(28).slice(0, 10)),
    ),
    q(
      sb
        .from('nx_corridas')
        .select('aluno_id,data,tipo,distancia_m,duracao_s,fc_media,fc_max,rpe,dor,dor_local')
        .in('aluno_id', ids)
        .gte('data', d(90)),
    ),
    q(sb.from('nx_sessoes').select('aluno_id,iniciado_em,dor,dor_local').in('aluno_id', ids).gte('iniciado_em', d(28))),
    q(sb.from('nx_avaliacoes').select('aluno_id,data,peso').in('aluno_id', ids).gte('data', d(150).slice(0, 10))),
    q(sb.from('nx_ciclo').select('aluno_id,ativo,situacao,duracao_ciclo').in('aluno_id', ids)),
    q(sb.from('nx_ciclo_inicios').select('aluno_id,data').in('aluno_id', ids).order('data', { ascending: false })),
  ]);
  const hoje = hojeISO();
  for (const m of ms) {
    const id = m.user_id;
    const fv = m.fase_vida && m.fase_vida.tipo;
    const sinais = {};
    // 1) ciclo: sem menstruação há mais de 45 dias, ou ciclos longos (só para quem acompanha o ciclo no app)
    const c = ci.find((x) => x.aluno_id === id);
    if (m.sexo === 'F') {
      const ins = ini.filter((x) => x.aluno_id === id).map((x) => x.data);
      const semCiclo =
        ['gestante', 'pos_parto', 'menopausa'].includes(fv) ||
        !c ||
        !c.ativo ||
        !['regular', 'irregular'].includes(c.situacao);
      if (semCiclo)
        sinais.ciclo = { st: 'na', t: fv ? 'Não se aplica nesta fase da vida' : 'Ela não acompanha o ciclo no app' };
      else if (ins.length < 2) sinais.ciclo = { st: 'na', t: 'Poucos ciclos registrados para avaliar' };
      else {
        const desde = Math.round((Date.parse(hoje) - Date.parse(ins[0])) / 864e5);
        const difs = [];
        for (let i = 0; i < Math.min(ins.length - 1, 3); i++)
          difs.push(Math.round((Date.parse(ins[i]) - Date.parse(ins[i + 1])) / 864e5));
        const med = difs.reduce((a, b) => a + b, 0) / difs.length;
        if (desde > 45)
          sinais.ciclo = {
            st: 'alerta',
            t: `Sem menstruação registrada há ${desde} dias (confirme com ela, pode ter esquecido de registrar)`,
          };
        else if (med > 35) sinais.ciclo = { st: 'alerta', t: `Ciclos longos: média de ${Math.round(med)} dias` };
        else sinais.ciclo = { st: 'ok', t: `Ciclos regulares (média de ${Math.round(med)} dias)` };
      }
    }
    // 2) desempenho: o condicionamento estimado caiu 3% ou mais em 6 semanas
    const corr = co.filter((x) => x.aluno_id === id);
    const corrC = corr.filter((x) => ehCorrHist(x));
    const n1 = corrC.filter((x) => Date.now() - Date.parse(x.data) < 42 * 864e5).length,
      n2 = corrC.length - n1;
    if (n1 >= 4 && n2 >= 4) {
      try {
        const pf = perfilCorrida(m);
        const a = previsaoEm(corrC, pf, Date.now()),
          b = previsaoEm(corrC, pf, Date.now() - 42 * 864e5);
        if (a && b && a.vdot && b.vdot) {
          const q2 = (a.vdot - b.vdot) / b.vdot;
          sinais.desempenho =
            q2 <= -0.03
              ? {
                  st: 'alerta',
                  t: `Condicionamento estimado caiu ${Math.round(-q2 * 100)}% em 6 semanas (VDOT ${f1(b.vdot)} → ${f1(a.vdot)})`,
                }
              : { st: 'ok', t: `Estável ou melhorando (VDOT ${f1(b.vdot)} → ${f1(a.vdot)})` };
        }
      } catch {}
    }
    if (!sinais.desempenho) sinais.desempenho = { st: 'na', t: 'Poucas corridas nas últimas 12 semanas para comparar' };
    // 3) cansaço: energia baixa em 40% ou mais dos check-ins das últimas 2 semanas
    const pr14 = pr.filter((x) => x.aluno_id === id && Date.now() - Date.parse(x.dia + 'T12:00:00') < 14 * 864e5);
    if (pr14.length >= 5) {
      const n = pr14.filter((x) => x.energia != null && x.energia <= 2).length;
      sinais.cansaco =
        n / pr14.length >= 0.4
          ? { st: 'alerta', t: `Cansada ou exausta em ${n} de ${pr14.length} check-ins das últimas 2 semanas` }
          : { st: 'ok', t: `Energia boa na maioria dos check-ins (${pr14.length - n} de ${pr14.length})` };
    } else sinais.cansaco = { st: 'na', t: 'Poucos check-ins da manhã nas últimas 2 semanas' };
    // 4) dor em osso: canela, pé, calcanhar ou quadril em 3 dias ou mais no último mês (risco de fratura por estresse)
    const diasOsso = new Set();
    pr.filter((x) => x.aluno_id === id).forEach((x) => {
      if ((x.dor_locais || []).some((k) => OSSO_REG.includes(String(k).replace(/_(d|e)$/, '')))) diasOsso.add(x.dia);
    });
    corr
      .filter((x) => Date.now() - Date.parse(x.data) < 28 * 864e5 && x.dor && OSSO_TXT.test(x.dor_local || ''))
      .forEach((x) => diasOsso.add(isoDia(x.data)));
    se.filter((x) => x.aluno_id === id && x.dor && OSSO_TXT.test(x.dor_local || '')).forEach((x) =>
      diasOsso.add(isoDia(x.iniciado_em)),
    );
    sinais.osso =
      diasOsso.size >= 3
        ? { st: 'alerta', t: `Dor em canela, pé, calcanhar ou quadril em ${diasOsso.size} dias do último mês` }
        : {
            st: 'ok',
            t: diasOsso.size
              ? `Dor nessas regiões em ${diasOsso.size} dia(s), abaixo do sinal`
              : 'Sem dor em regiões de osso',
          };
    // 5) peso: perdeu 5% ou mais entre avaliações, sem ser o objetivo
    const avs = av.filter((x) => x.aluno_id === id && x.peso).sort((a2, b2) => (a2.data < b2.data ? -1 : 1));
    if (avs.length >= 2) {
      const p0 = +avs[0].peso,
        p1 = +avs[avs.length - 1].peso,
        perda = (p0 - p1) / p0;
      const quer = /emagrec|perder|peso|gordura|secar|defini/i.test(m.objetivo || '');
      sinais.peso =
        perda >= 0.05 && !quer
          ? {
              st: 'alerta',
              t: `Perdeu ${f1(p0 - p1)} kg (${Math.round(perda * 100)}%) entre as avaliações, sem ser o objetivo`,
            }
          : { st: 'ok', t: perda >= 0.05 ? 'Perdeu peso, mas é o objetivo dela' : 'Peso estável entre as avaliações' };
    } else sinais.peso = { st: 'na', t: 'Precisa de 2 avaliações físicas para comparar' };
    const n = Object.values(sinais).filter((x) => x.st === 'alerta').length;
    out[id] = { m, sinais, n, nivel: n >= 3 ? 'alerta' : n === 2 ? 'atencao' : n === 1 ? 'observar' : 'ok' };
  }
  return out;
}
/** cartão dos sinais de baixa energia (só para o treinador) */
function sinaisEnergiaHTML(x) {
  if (!x) return '';
  const fem = x.m.sexo === 'F';
  const ela = fem ? 'ela' : 'ele';
  const lista = SINAIS_RED.filter(([k]) => x.sinais[k]);
  const titulo =
    x.nivel === 'alerta'
      ? `${x.n} sinais de baixa energia`
      : x.nivel === 'atencao'
        ? '2 sinais de baixa energia'
        : x.nivel === 'observar'
          ? '1 sinal para observar'
          : 'Nenhum sinal de baixa energia';
  return `<div class="card sa-card red-${x.nivel}"><div class="sa-top"><span class="sa-ic">${ENERGIA_IC}</span><div class="sa-txt"><span class="eyebrow">Energia (RED-S)</span><b>${titulo}</b><span>${x.nivel === 'ok' || x.nivel === 'observar' ? 'Acompanhe: o app avisa quando aparecerem 2 ou mais sinais' : `Converse com ${ela} e encaminhe para avaliação`}</span></div></div>
    <div class="red-lista">${lista
      .map(([k, l]) => {
        const s = x.sinais[k];
        return `<div class="red-l ${s.st}"><i></i><div><b>${l}</b><span>${esc(s.t)}</span></div></div>`;
      })
      .join('')}</div>
    ${
      x.n >= 2
        ? `<div class="red-acao"><b>O que fazer</b><ul class="sug-lista">
      <li>Conversar com ${ela} sem julgamento: alimentação, sono, estresse e como está se sentindo.</li>
      ${fem ? '<li>Aplicar o questionário LEAF-Q (sobre energia baixa em mulheres) ou perguntar sobre o ciclo nos últimos meses.</li>' : '<li>Perguntar sobre perda de peso, sono, libido e disposição nos últimos meses.</li>'}
      <li>Encaminhar para médico e nutricionista do esporte.</li>
      <li>Enquanto isso, segurar o volume e a intensidade, e ficar de olho em dor nos ossos.</li></ul></div>`
        : ''
    }
    <p class="tiny dim" style="margin-top:10px">Não é diagnóstico: o app junta sinais da baixa disponibilidade de energia (RED-S, consenso do Comitê Olímpico Internacional, Mountjoy et al., 2023). ${fem ? '' : 'Em homens, o ciclo não entra; os outros sinais valem igual.'} Só você vê este cartão.</p></div>`;
}

/* ---------- ciclo cruzado com o treino ---------- */
const CT_FASES = ['menstrual', 'folicular', 'ovulatoria', 'lutea'];
async function cicloTreinoDados(alunoId, c) {
  if (!c || !c.inicios || !c.inicios.length) return null;
  const desde = new Date(Date.now() - 180 * 864e5).toISOString();
  const q = (p) => p.then((r) => r.data || []).catch(() => []);
  const [pr, co, se] = await Promise.all([
    q(sb.from('nx_prontidao').select('dia,sono,energia,dor').eq('aluno_id', alunoId).gte('dia', desde.slice(0, 10))),
    q(
      sb
        .from('nx_corridas')
        .select('data,tipo,distancia_m,duracao_s,fc_media,rpe')
        .eq('aluno_id', alunoId)
        .gte('data', desde),
    ),
    q(sb.from('nx_sessoes').select('iniciado_em,esforco').eq('aluno_id', alunoId).gte('iniciado_em', desde)),
  ]);
  const F = Object.fromEntries(CT_FASES.map((f) => [f, { energia: [], sono: [], dor: [], esforco: [], efic: [] }]));
  const fase = (k) => {
    const f = cicloFaseDia(c, k);
    return f && !f.previsto ? F[f.fase] : null;
  };
  pr.forEach((p) => {
    const g = fase(p.dia);
    if (!g) return;
    if (p.energia) g.energia.push(p.energia);
    if (p.sono) g.sono.push(p.sono);
    if (p.dor) g.dor.push(p.dor);
  });
  // eficiência: velocidade dividida pela FC, comparada com a mediana dela (mais alta = correu mais fácil)
  const corr = co.filter((x) => ehCorrHist(x));
  const efs = corr
    .filter((x) => x.fc_media && x.distancia_m >= 2000 && x.duracao_s > 0)
    .map((x) => (x.distancia_m / x.duracao_s / x.fc_media) * 1000);
  const med = efs.length ? efs.slice().sort((a, b) => a - b)[Math.floor(efs.length / 2)] : null;
  corr.forEach((x) => {
    const g = fase(isoDia(x.data));
    if (!g) return;
    if (x.rpe != null && x.rpe > 0) g.esforco.push(x.rpe);
    if (med && x.fc_media && x.distancia_m >= 2000 && x.duracao_s > 0)
      g.efic.push(((x.distancia_m / x.duracao_s / x.fc_media) * 1000) / med - 1);
  });
  se.forEach((s) => {
    const g = fase(isoDia(s.iniciado_em));
    if (g && s.esforco != null && s.esforco > 0) g.esforco.push(s.esforco);
  });
  return F;
}
const CT_METRICAS = [
  ['energia', 'Energia de manhã', 'de 1 a 5', true, 0.5, (v) => f1(v)],
  ['sono', 'Sono', 'de 1 a 5', true, 0.5, (v) => f1(v)],
  ['dor', 'Sem dor muscular', '5 = nenhuma dor', true, 0.5, (v) => f1(v)],
  ['esforco', 'Esforço dos treinos', 'de 0 a 10', false, 0.8, (v) => f1(v)],
  ['efic', 'Eficiência na corrida', 'pace pela FC', true, 0.03, (v) => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%'],
];
function cicloTreinoHTML(F, aluna) {
  if (!F) return '';
  const media = (a) => (a.length >= 3 ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const nomeF = (f) => ({ menstrual: 'Menstrual', folicular: 'Folicular', ovulatoria: 'Ovulação', lutea: 'Lútea' })[f];
  const naF = (f) =>
    ({
      menstrual: 'na menstruação',
      folicular: 'na fase folicular',
      ovulatoria: 'na ovulação',
      lutea: 'na fase lútea',
    })[f];
  const linhas = [],
    frases = [];
  CT_METRICAS.forEach(([k, l, u, maior, lim, fmt]) => {
    const vs = CT_FASES.map((f) => media(F[f][k]));
    const com = vs.map((v, i) => [v, i]).filter(([v]) => v != null);
    if (com.length < 2) return;
    const melhor = com.reduce((a, b) => ((maior ? b[0] > a[0] : b[0] < a[0]) ? b : a));
    const pior = com.reduce((a, b) => ((maior ? b[0] < a[0] : b[0] > a[0]) ? b : a));
    const dif = Math.abs(melhor[0] - pior[0]) >= lim;
    linhas.push(
      `<div class="ct-l"><span><b>${l}</b><small>${u}</small></span>${vs.map((v, i) => `<em class="${dif && i === melhor[1] ? 'bom' : dif && i === pior[1] ? 'ruim' : ''}">${v == null ? '–' : fmt(v)}</em>`).join('')}</div>`,
    );
    if (dif)
      frases.push(
        `${l}: ${k === 'esforco' ? 'os treinos parecem mais leves' : 'melhor'} ${naF(CT_FASES[melhor[1]])} e ${k === 'esforco' ? 'mais pesados' : 'pior'} ${naF(CT_FASES[pior[1]])}.`,
      );
  });
  if (!linhas.length)
    return `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.run}</span><div class="sa-txt"><span class="eyebrow">Ciclo e treino</span><b>Ainda juntando dados</b><span>${aluna ? 'Responda o check-in da manhã e registre o esforço dos treinos por 2 ou 3 ciclos' : 'Com 2 ou 3 ciclos de check-ins e treinos registrados'}, aqui aparece como cada fase muda ${aluna ? 'os seus treinos' : 'os treinos dela'}.</span></div></div></div>`;
  return `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.run}</span><div class="sa-txt"><span class="eyebrow">Ciclo e treino</span><b>${aluna ? 'Como cada fase muda os seus treinos' : 'Como cada fase muda os treinos dela'}</b><span>Médias dos últimos 6 meses, só com dias registrados</span></div></div>
    <div class="ct-tab"><div class="ct-l ct-h"><span></span>${CT_FASES.map((f) => `<em style="--cf:${FASES_CICLO[f][1]}">${nomeF(f)}</em>`).join('')}</div>${linhas.join('')}</div>
    ${frases.length ? `<ul class="sug-lista">${frases.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p class="small muted" style="margin-top:10px">Até aqui o ciclo não mudou muito ${aluna ? 'os seus treinos' : 'os treinos dela'}: as diferenças entre as fases são pequenas.</p>`}
    <p class="tiny dim" style="margin-top:10px">Verde é a melhor fase em cada linha e laranja a mais difícil. Na média, o ciclo muda pouco o desempenho, e cada mulher responde de um jeito (McNulty et al., 2020). Por isso vale o padrão ${aluna ? 'seu' : 'dela'}, não uma regra geral.</p></div>`;
}

/* ---------- tela do treinador: Saúde da atleta ---------- */
async function viewSaudeAtleta(box, m) {
  const fem = m.sexo === 'F';
  box.innerHTML = '<div class="card"><p class="small muted">Carregando…</p></div>';
  const [sin, c, rel] = await Promise.all([
    sinaisEnergia([m.user_id]),
    fem ? buscarCiclo(m.user_id).catch(() => null) : null,
    buscarRelogio(m.user_id, m.sexo).catch(() => null),
  ]);
  const ct = fem && c ? await cicloTreinoDados(m.user_id, c) : null;
  if (!box.isConnected) return;
  const fv = fem
    ? m.fase_vida && m.fase_vida.tipo
      ? faseVidaCardHTML(m, true)
      : `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${FV_IC}</span><div class="sa-txt"><span class="eyebrow">Fase da vida</span><b>Nenhuma marcada</b><span>Gestação, pós-parto, perimenopausa ou menopausa mudam o treino e as orientações que ela vê.</span></div><button class="btn ghost sm" type="button" data-fv-ed>Marcar</button></div></div>`
    : '';
  const rs = rel ? relogioResumoHTML(rel, `#/aluno/${m.user_id}/relogio`, false) : '';
  box.innerHTML = `${rs}${sinaisEnergiaHTML(sin[m.user_id])}${fv}${fem ? (c ? cicloTreinoHTML(ct, false) : `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.run}</span><div class="sa-txt"><span class="eyebrow">Ciclo e treino</span><b>Ela não acompanha o ciclo no app</b><span>Quando ela ativar o acompanhamento do ciclo, aqui aparece como cada fase muda os treinos dela.</span></div></div></div>`) : ''}`;
  box
    .querySelectorAll('[data-fv-ed]')
    .forEach((b) => (b.onclick = () => editarFaseVida(m, () => viewSaudeAtleta(box, m))));
  const ps = box.querySelector('[data-fv-pse]');
  if (ps)
    ps.onclick = async () => {
      const corrida = { ...(m.corrida || {}), modo_pse: true };
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', m.user_id);
      if (error) return toast('Não foi possível salvar.', true);
      m.corrida = corrida;
      toast('Pronto: os treinos dela passam a mostrar esforço, sem pace.');
      viewSaudeAtleta(box, m);
    };
}
/** Hoje do treinador: quem tem 2 ou mais sinais de baixa energia */
async function energiaEquipe(ids, porId) {
  const box = document.getElementById('energia-eq');
  if (!box || !ids.length) return;
  const sin = await sinaisEnergia(ids);
  const lista = Object.values(sin)
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n);
  if (!lista.length || !box.isConnected) return;
  box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Saúde da atleta</h2><span class="tag warn">${lista.length}</span></div><div class="stack">${lista
    .map((x) => {
      const m = porId[x.m.user_id] || x.m;
      const quais = SINAIS_RED.filter(([k]) => x.sinais[k] && x.sinais[k].st === 'alerta')
        .map(([, l]) => l.toLowerCase())
        .join(', ');
      return `<a class="list-item" href="#/aluno/${x.m.user_id}/energia" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(firstName(m.nome))} · ${x.n} sinais de baixa energia</b><div class="small muted">${esc(quais)}</div></div>${I.chev}</a>`;
    })
    .join('')}</div></div>`;
}

/* ---------- dados do relógio: sono, VFC, frequência de repouso, Body Battery, estresse, SpO2 e mais ----------
   Chegam do Garmin (Health API e Women's Health API) sozinhos, todo dia. Quem não tem Garmin vê o que registra no check-in. */
/* vfc:puro:inicio
   Leitura da VFC no modelo de Plews et al. (2012, 2013) e Buchheit (2014): a média das últimas 7 noites do ln(rMSSD)
   comparada com a faixa normal da própria pessoa (média das noites anteriores ± 0,5 desvio-padrão).
   Só dá leitura com pelo menos 14 noites de referência e 3 noites na semana. */
const VFC_MIN_REF = 14;
const VFC_MIN_SEMANA = 3;
const vfcDia = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
function leituraVfc(serie, hoje) {
  const ini = vfcDia(hoje, -66),
    corte = vfcDia(hoje, -6);
  const ok = (serie || []).filter((x) => x && x.v > 0 && x.dia <= hoje && x.dia >= ini);
  const sem = ok.filter((x) => x.dia >= corte).map((x) => Math.log(x.v));
  const ref = ok.filter((x) => x.dia < corte).map((x) => Math.log(x.v));
  if (ref.length < VFC_MIN_REF || sem.length < VFC_MIN_SEMANA)
    return { estado: 'base', noites: ok.length, precisa: VFC_MIN_REF + VFC_MIN_SEMANA };
  const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mu = media(ref),
    sd = Math.sqrt(ref.reduce((s, v) => s + (v - mu) ** 2, 0) / (ref.length - 1)),
    m7 = media(sem),
    lo = mu - 0.5 * sd,
    hi = mu + 0.5 * sd;
  return {
    estado: m7 < lo - 1e-9 ? 'abaixo' : m7 > hi + 1e-9 ? 'acima' : 'normal',
    semana: Math.exp(m7),
    faixa: [Math.exp(lo), Math.exp(hi)],
    noites: ok.length,
  };
}
/** média pessoal de um número (ex.: FC de repouso) nos dias anteriores a hoje; precisa de um mínimo de dias */
function mediaPessoal(serie, hoje, dias = 30, min = 7) {
  const ini = vfcDia(hoje, -dias);
  const vs = (serie || [])
    .filter((x) => x && x.v != null && isFinite(x.v) && x.dia < hoje && x.dia >= ini)
    .map((x) => +x.v);
  return vs.length >= min ? vs.reduce((s, v) => s + v, 0) / vs.length : null;
}
/* vfc:puro:fim */

const SONO_QUAL = { EXCELLENT: 'Excelente', GOOD: 'Bom', FAIR: 'Razoável', POOR: 'Ruim' };
const estresseNome = (v) => (v <= 25 ? 'Descansado' : v <= 50 ? 'Baixo' : v <= 75 ? 'Médio' : 'Alto');
const hhmm = (s) => {
  const m = Math.round(s / 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
};
const FASE_GARMIN = {
  MENSTRUAL: 'Menstrual',
  MENSTRUATION: 'Menstrual',
  FOLLICULAR: 'Folicular',
  OVULATION: 'Ovulação',
  FERTILE: 'Janela fértil',
  LUTEAL: 'Lútea',
};
async function buscarRelogio(alunoId, sexo) {
  const ini = somaDias(hojeISO(), -70);
  const [ig, dias, pr, mct] = await Promise.all([
    sb
      .from('nx_integracoes')
      .select('provedor,permissoes,ultima_saude,ultima_sync,conectado_em,erro')
      .eq('user_id', alunoId)
      .eq('provedor', 'garmin')
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
    sb
      .from('nx_garmin_dia')
      .select('*')
      .eq('aluno_id', alunoId)
      .gte('dia', ini)
      .order('dia')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_prontidao')
      .select('dia,sono,energia,dor,estresse')
      .eq('aluno_id', alunoId)
      .gte('dia', somaDias(hojeISO(), -13))
      .order('dia')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sexo === 'F'
      ? sb
          .from('nx_garmin_saude')
          .select('dia,dados')
          .eq('aluno_id', alunoId)
          .in('tipo', ['menstrualCycleTracking', 'mct'])
          .order('dia', { ascending: false })
          .limit(1)
          .then(
            (r) => (r.data || [])[0] || null,
            () => null,
          )
      : null,
  ]);
  return { ig, dias, pr, mct };
}
// a série de um campo, com o valor mais recente
function relSerie(dias, k, conv = (v) => +v) {
  const s = dias.filter((d) => d[k] != null && isFinite(+d[k])).map((d) => ({ dia: d.dia, v: conv(d[k]) }));
  return { s, ult: s[s.length - 1] || null };
}
function relLeituras(D) {
  const hoje = hojeISO();
  const sono = relSerie(D.dias, 'sono_s'),
    vfc = relSerie(D.dias, 'vfc'),
    fcr = relSerie(D.dias, 'fc_repouso');
  return {
    sono,
    vfc,
    fcr,
    lv: leituraVfc(vfc.s, hoje),
    fcrMedia: mediaPessoal(fcr.s, hoje),
    noite: [...D.dias].reverse().find((d) => d.sono_s != null) || null,
  };
}
const VFC_TXT = {
  normal: ['Dentro do normal', 'ok'],
  abaixo: ['Abaixo do normal', 'warn'],
  acima: ['Acima do normal', 'acc'],
};
/** resumo curto (Saúde do atleta e outras telas): última noite, VFC e FC de repouso */
function relogioResumoHTML(D, href, eu) {
  if (!D.ig && !D.dias.length) return '';
  const L = relLeituras(D);
  const itens = [];
  if (L.noite) itens.push(`Sono <b>${hhmm(L.noite.sono_s)}</b>`);
  if (L.vfc.ult) itens.push(`VFC <b>${Math.round(L.vfc.ult.v)} ms</b>`);
  if (L.fcr.ult) itens.push(`FC de repouso <b>${Math.round(L.fcr.ult.v)}</b>`);
  const tag =
    L.lv.estado !== 'base'
      ? `<span class="tag ${VFC_TXT[L.lv.estado][1]}">VFC ${VFC_TXT[L.lv.estado][0].toLowerCase()}</span>`
      : '';
  return `<a class="card sa-card" href="${href}" style="color:inherit"><div class="sa-top"><span class="sa-ic">${I.watch}</span><div class="sa-txt"><span class="eyebrow">Dados do relógio</span><b>${itens.length ? itens.join(' · ') : 'Esperando os primeiros dados de saúde'}</b><span>${itens.length ? 'Sono, VFC, frequência de repouso, Body Battery, estresse e mais' : eu ? 'Chegam sozinhos do seu Garmin depois da primeira noite com o relógio' : 'Chegam sozinhos do Garmin depois da primeira noite com o relógio'}</span></div>${I.chev}</div>${tag ? `<div style="margin-top:10px">${tag}</div>` : ''}</a>`;
}
/** tela completa: tudo o que o relógio mede, mais o check-in */
async function viewRelogioSaude(box, alunoId, { eu = false, nome = '', sexo = null } = {}) {
  box.innerHTML = '<div class="card"><p class="small muted">Carregando…</p></div>';
  const D = await buscarRelogio(alunoId, sexo);
  if (!box.isConnected) return;
  const L = relLeituras(D),
    hoje = hojeISO(),
    ele = sexo === 'F' ? 'ela' : 'ele',
    quem = eu ? 'você' : esc(firstName(nome) || ele);
  const ult14 = (s) => s.filter((x) => x.dia >= somaDias(hoje, -13)).map((x) => ({ x: fmtCurto(x.dia), y: x.v }));
  const qdo = (d) => (d === hoje ? 'hoje' : d === somaDias(hoje, -1) ? 'ontem' : fmtCurto(d));
  const tile = (titulo, serie, valor, sub) =>
    serie.ult
      ? `<div class="rel-tile"><span class="rel-t">${titulo}</span><b class="rel-v">${valor(serie.ult.v)}</b><span class="rel-s">${sub || ''}${serie.ult.dia < somaDias(hoje, -1) ? `${sub ? ' · ' : ''}${qdo(serie.ult.dia)}` : ''}</span>${serie.s.length > 1 ? grafico(ult14(serie.s), { mini: true }) : ''}</div>`
      : '';
  let topo = '';
  if (!D.ig)
    topo = `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.watch}</span><div class="sa-txt"><span class="eyebrow">Relógio</span><b>${eu ? 'Seu Garmin não está conectado' : `${quem} não tem Garmin conectado`}</b><span>${eu ? 'Com o Garmin conectado, aqui aparecem sozinhos o seu sono, a VFC, a frequência de repouso, o Body Battery, o estresse e mais. Outras marcas mandam só as corridas.' : 'Aqui aparece só o que vem do check-in da manhã. Com o Garmin conectado, entram sozinhos sono, VFC, frequência de repouso, Body Battery, estresse e mais.'}</span></div></div>${eu ? '<a class="btn ghost sm" href="#/conexoes" style="margin-top:12px;align-self:flex-start">Conectar relógio</a>' : ''}</div>`;
  else {
    const pm = D.ig.permissoes;
    const semSaude = Array.isArray(pm) && !pm.includes('HEALTH_EXPORT');
    if (semSaude)
      topo = `<div class="card sa-card red-atencao"><div class="sa-top"><span class="sa-ic">${I.watch}</span><div class="sa-txt"><span class="eyebrow">Garmin</span><b>Os dados de saúde não estão liberados</b><span>${eu ? 'O Garmin está mandando só as atividades. Conecte de novo e deixe marcados os dados de saúde na tela da Garmin.' : `O Garmin de ${quem} está mandando só as atividades. Peça para conectar de novo em Conexões e deixar marcados os dados de saúde.`}</span></div></div>${eu ? '<button class="btn sm" id="rs-recon" style="margin-top:12px;align-self:flex-start">Conectar de novo</button>' : ''}</div>`;
    else if (!D.dias.length)
      topo = `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.watch}</span><div class="sa-txt"><span class="eyebrow">Garmin conectado</span><b>Esperando os primeiros dados de saúde</b><span>${eu ? 'Durma com o relógio e sincronize pelo app Garmin Connect. Sono, VFC e o resumo do dia chegam sozinhos.' : `Chegam sozinhos depois que ${quem} dormir com o relógio e sincronizar o Garmin Connect.`}</span></div></div></div>`;
  }
  let corpo = '';
  if (D.dias.length) {
    const passos7 = mediaPessoal(relSerie(D.dias, 'passos').s, somaDias(hoje, 1), 7, 3);
    const ss = relSerie(D.dias, 'estresse'),
      bb = relSerie(D.dias, D.dias.some((d) => d.bb_max != null) ? 'bb_max' : 'bb_carga'),
      tp = relSerie(D.dias, 'temp_pele'),
      vo = relSerie(D.dias, 'vo2max');
    const n = L.noite;
    const tiles = [
      tile(
        'Sono',
        L.sono,
        (v) => hhmm(v),
        n && n.sono_nota != null
          ? `Nota ${Math.round(n.sono_nota)}${SONO_QUAL[n.sono_qualidade] ? ' · ' + SONO_QUAL[n.sono_qualidade] : ''}`
          : '',
      ),
      tile(
        'VFC da noite',
        L.vfc,
        (v) => `${Math.round(v)} <small>ms</small>`,
        L.lv.estado !== 'base'
          ? VFC_TXT[L.lv.estado][0]
          : `Referência: ${Math.min(L.lv.noites, L.lv.precisa)} de ${L.lv.precisa} noites`,
      ),
      tile(
        'FC de repouso',
        L.fcr,
        (v) => `${Math.round(v)} <small>bpm</small>`,
        L.fcrMedia != null ? `Média de 30 dias: ${Math.round(L.fcrMedia)}` : '',
      ),
      tile(
        bb.s.length && D.dias.some((d) => d.bb_max != null) ? 'Body Battery (máx.)' : 'Body Battery recarregado',
        bb,
        (v) => Math.round(v),
        '',
      ),
      tile('Estresse médio', ss, (v) => Math.round(v), ss.ult ? estresseNome(ss.ult.v) : ''),
      tile(
        'Passos',
        relSerie(D.dias, 'passos'),
        (v) => Math.round(v).toLocaleString('pt-BR'),
        passos7 != null ? `Média de 7 dias: ${Math.round(passos7).toLocaleString('pt-BR')}` : '',
      ),
      tile('SpO2', relSerie(D.dias, 'spo2'), (v) => `${f1(v, v % 1 ? 1 : 0)}<small>%</small>`, 'Oxigenação do sangue'),
      tile(
        'Respiração',
        relSerie(D.dias, 'respiracao'),
        (v) => `${f1(v, v % 1 ? 1 : 0)} <small>rpm</small>`,
        'Média do dia',
      ),
      tile(
        'Temperatura da pele',
        tp,
        (v) => `${v > 0 ? '+' : ''}${f1(v, 1)} <small>°C</small>`,
        eu ? 'Variação da sua base' : 'Variação da base pessoal',
      ),
      tile(
        'VO2máx do relógio',
        vo,
        (v) => Math.round(v),
        (() => {
          const ia = relSerie(D.dias, 'idade_fitness').ult;
          return ia ? `Idade fitness ${Math.round(ia.v)}` : '';
        })(),
      ),
    ].join('');
    // fases do sono da última noite
    let fases = '';
    if (n && n.sono_s) {
      const F = [
        ['Profundo', n.sono_profundo_s, '#3b5bdb'],
        ['REM', n.sono_rem_s, '#9c6ade'],
        ['Leve', n.sono_leve_s, '#5c9ded'],
        ['Acordado', n.acordado_s, '#f0a35e'],
      ].filter((x) => x[1] > 0);
      const tot = F.reduce((s, x) => s + +x[1], 0);
      if (F.length && tot)
        fases = `<div class="card"><div class="row between"><b>Última noite</b><span class="small muted">${qdo(n.dia)} · ${hhmm(n.sono_s)}</span></div>
          <div class="rel-barra">${F.map(([, v, c]) => `<i style="flex:${v};background:${c}"></i>`).join('')}</div>
          <div class="rel-leg">${F.map(([l, v, c]) => `<span><i style="background:${c}"></i>${l} <b>${hhmm(v)}</b></span>`).join('')}</div></div>`;
    }
    // explicação da VFC
    const lv = L.lv;
    const vfcCard = L.vfc.ult
      ? `<div class="card"><div class="row between"><b>VFC: como ${eu ? 'você está' : `${quem} está`}</b>${lv.estado !== 'base' ? `<span class="tag ${VFC_TXT[lv.estado][1]}">${VFC_TXT[lv.estado][0]}</span>` : ''}</div>
          <p class="small" style="margin-top:8px">${
            lv.estado === 'base'
              ? `Ainda montando a referência ${eu ? 'sua' : `de ${quem}`}: ${Math.min(lv.noites, lv.precisa)} de ${lv.precisa} noites. Até lá os valores aparecem, mas sem comparação, porque a VFC só tem sentido comparada com a da própria pessoa.`
              : `Média das últimas 7 noites: <b>${Math.round(lv.semana)} ms</b>. ${eu ? 'Sua faixa normal' : `Faixa normal de ${quem}`}: ${Math.round(lv.faixa[0])} a ${Math.round(lv.faixa[1])} ms. ${
                  lv.estado === 'abaixo'
                    ? 'Noites mal dormidas, estresse, treinos fortes seguidos, calor, álcool ou começo de gripe costumam baixar a VFC. É uma leitura para olhar junto com o check-in de como se sente, não um alarme.'
                    : lv.estado === 'acima'
                      ? 'Em geral aparece com boa recuperação.'
                      : 'Recuperação dentro do esperado.'
                }`
          }</p></div>`
      : '';
    // ciclo pelo Garmin (só alunas, quando a Garmin manda)
    let cic = '';
    if (D.mct && D.mct.dados) {
      const c = D.mct.dados,
        fase = FASE_GARMIN[String(c.currentPhaseType || c.currentPhase || '').toUpperCase()] || null;
      const it = [
        c.dayInCycle != null ? `Dia ${c.dayInCycle} do ciclo` : '',
        fase ? `Fase ${fase.toLowerCase()}` : '',
        c.predictedCycleLength || c.cycleLength ? `Ciclo de ${c.predictedCycleLength || c.cycleLength} dias` : '',
      ].filter(Boolean);
      if (it.length)
        cic = `<div class="card sa-card"><div class="sa-top"><span class="sa-ic" style="color:#e85d75;background:color-mix(in srgb,#e85d75 14%,transparent)">${I.cal}</span><div class="sa-txt"><span class="eyebrow">Ciclo registrado no Garmin</span><b>${it.join(' · ')}</b><span>Atualizado ${qdo(D.mct.dia)}</span></div></div></div>`;
    }
    corpo = `<div class="rel-grid">${tiles}</div>${vfcCard}${fases}${cic}`;
  }
  // check-in: vale para todo mundo, com ou sem relógio
  let chk = '';
  if (D.pr.length) {
    const med = (k) => D.pr.reduce((s, x) => s + x[k], 0) / D.pr.length;
    const u = D.pr[D.pr.length - 1];
    chk = `<div class="card"><div class="row between"><b>Como ${eu ? 'você se sente' : `${quem} se sente`}</b><span class="small muted">check-in · ${D.pr.length} dia${D.pr.length > 1 ? 's' : ''}</span></div>
      <div class="rel-chk">${['sono', 'energia', 'dor', 'estresse'].map((k) => `<span><i style="background:${PRONT_COR[u[k] - 1]}"></i>${PRONT_CURTO[k]} <b>${u[k]}</b><small>média ${f1(med(k))}</small></span>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">Último check-in ${qdo(u.dia)}. De 1 a 5, 5 é o melhor. O relógio mede o corpo; o check-in mostra como ${eu ? 'você se sente' : `${ele} se sente`}. Os dois juntos contam a história.</p></div>`;
  } else
    chk = `<div class="card"><b>Como ${eu ? 'você se sente' : `${quem} se sente`}</b><p class="small muted" style="margin-top:6px">${eu ? 'Sem check-in nos últimos 14 dias. O check-in da manhã leva 20 segundos e completa o que o relógio mede.' : 'Sem check-in nos últimos 14 dias.'}</p>${eu ? '<a class="btn ghost sm" href="#/prontidao/agora" style="margin-top:10px">Fazer o check-in</a>' : ''}</div>`;
  const rodape = D.dias.length
    ? `<p class="tiny dim" style="margin-top:4px">Valores medidos pelo relógio${D.ig && D.ig.ultima_saude ? `, recebidos ${quando(D.ig.ultima_saude)} às ${fmtHora(D.ig.ultima_saude)}` : ''}. VFC lida pela média de 7 noites comparada com a faixa normal da própria pessoa (Plews et al., 2012 e 2013; Buchheit, 2014).</p>`
    : '';
  box.innerHTML = `${topo}${corpo}${chk}${rodape}`;
  const rc = box.querySelector('#rs-recon');
  if (rc)
    rc.onclick = async () => {
      rc.disabled = true;
      try {
        const r = await chamarGarmin({ acao: 'iniciar', retorno: location.origin + location.pathname });
        if (r.url) location.href = r.url;
        else rc.disabled = false;
      } catch (e) {
        rc.disabled = false;
        toast(e.message, true);
      }
    };
  // permissões ainda desconhecidas (conexões antigas): pergunta à Garmin uma vez e redesenha se faltar algo
  if (D.ig && !Array.isArray(D.ig.permissoes) && !box.dataset.pm) {
    box.dataset.pm = '1';
    chamarGarmin({ acao: 'permissoes', aluno_id: alunoId })
      .then((r) => {
        if (Array.isArray(r.permissoes) && !r.permissoes.includes('HEALTH_EXPORT') && box.isConnected)
          viewRelogioSaude(box, alunoId, { eu, nome, sexo });
      })
      .catch(() => {});
  }
}
/** aluno: Mais > Dados do relógio */
async function viewRelogioAluno() {
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Saúde</p><h1 class="h1">Dados do relógio</h1><p class="muted" style="margin-top:6px">Sono, VFC, frequência de repouso, Body Battery, estresse e mais, junto com o seu check-in.</p><div id="rs" class="stack" style="margin-top:16px"></div>`;
  await viewRelogioSaude(document.getElementById('rs'), S.user.id, { eu: true, nome: S.me.nome, sexo: S.me.sexo });
}
