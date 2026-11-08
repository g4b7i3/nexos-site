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
  const [sin, c] = await Promise.all([
    sinaisEnergia([m.user_id]),
    fem ? buscarCiclo(m.user_id).catch(() => null) : null,
  ]);
  const ct = fem && c ? await cicloTreinoDados(m.user_id, c) : null;
  if (!box.isConnected) return;
  const fv = fem
    ? m.fase_vida && m.fase_vida.tipo
      ? faseVidaCardHTML(m, true)
      : `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${FV_IC}</span><div class="sa-txt"><span class="eyebrow">Fase da vida</span><b>Nenhuma marcada</b><span>Gestação, pós-parto, perimenopausa ou menopausa mudam o treino e as orientações que ela vê.</span></div><button class="btn ghost sm" type="button" data-fv-ed>Marcar</button></div></div>`
    : '';
  box.innerHTML = `${sinaisEnergiaHTML(sin[m.user_id])}${fv}${fem ? (c ? cicloTreinoHTML(ct, false) : `<div class="card sa-card"><div class="sa-top"><span class="sa-ic">${I.run}</span><div class="sa-txt"><span class="eyebrow">Ciclo e treino</span><b>Ela não acompanha o ciclo no app</b><span>Quando ela ativar o acompanhamento do ciclo, aqui aparece como cada fase muda os treinos dela.</span></div></div></div>`) : ''}`;
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
