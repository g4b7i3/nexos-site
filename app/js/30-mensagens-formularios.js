/* Nexos App · Mensagens do treinador, formulários e ficha de inscrição.
   Parte 30 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- mensagens (caixa de entrada do treinador, estilo WhatsApp) ---------- */
const horaMsg = (iso) => {
  const d = new Date(iso);
  const q = quando(iso);
  return q === 'hoje'
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : q === 'ontem'
      ? 'Ontem'
      : `${d.getDate()}/${d.getMonth() + 1}`;
};
async function staffMensagens(alunoId) {
  const largo = innerWidth >= 900;
  const st = S.cache.msgSt || (S.cache.msgSt = { q: '' });
  if (!S.cache.msgLista) loading();
  const [{ data: membrosT }, { data: msgsT }] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,treinador_id,ativo')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome'),
    sb
      .from('nx_mensagens')
      .select('aluno_id,autor_id,texto,criado_em,lida')
      .eq('org_id', S.org.id)
      .order('criado_em', { ascending: false })
      .limit(2000),
  ]);
  const membros = (membrosT || []).filter(ehMeuAluno),
    vis = new Set(membros.map((m) => m.user_id)),
    msgs = (msgsT || []).filter((m) => vis.has(m.aluno_id));
  dockStaff();
  const ult = {},
    nl = {};
  (msgs || []).forEach((m) => {
    if (!ult[m.aluno_id]) ult[m.aluno_id] = m;
    if (m.autor_id === m.aluno_id && !m.lida) nl[m.aluno_id] = (nl[m.aluno_id] || 0) + 1;
  });
  S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0);
  dockStaff();
  const porId = Object.fromEntries((membros || []).map((m) => [m.user_id, m]));
  let conversas = Object.keys(ult)
    .filter((id) => porId[id])
    .sort((a, b) => (ult[b].criado_em > ult[a].criado_em ? 1 : -1));
  S.cache.msgLista = true;
  const itemHTML = (id) => {
    const m = porId[id],
      u = ult[id],
      n = nl[id] || 0;
    const eu = u.autor_id !== id;
    return `<a class="cv ${n ? 'nova' : ''} ${id === alunoId ? 'on' : ''}" href="#/mensagens/${id}" data-cv="${id}">${avAluno(m)}<div class="cv-c"><div class="cv-l1"><b class="ellip">${esc(m.nome)}</b><span class="cv-h">${horaMsg(u.criado_em)}</span></div>
      <div class="cv-l2"><span class="ellip">${eu ? '<i class="cv-eu">Você:</i> ' : ''}${esc(u.texto || '')}</span>${n ? `<i class="cv-n">${n}</i>` : ''}</div></div></a>`;
  };
  const listaHTML = () => {
    const q = semAcento(st.q);
    const l = conversas.filter((id) => !q || semAcento(porId[id].nome).includes(q));
    return l.length
      ? l.map(itemHTML).join('')
      : `<div class="empty" style="margin-top:12px"><div class="h3">${conversas.length ? 'Nenhuma conversa aqui' : 'Nenhuma mensagem ainda'}</div><p class="small">${conversas.length ? 'Tente outra busca.' : 'Quando um aluno mandar mensagem, a conversa aparece aqui.'}</p></div>`;
  };
  const painelLista = `<div class="cv-top"><div><p class="eyebrow">Conversas</p><h1 class="h1" style="margin:2px 0 0">Mensagens</h1></div><button class="btn sm" id="cv-nova">${I.plus} Nova</button></div>
    <div class="search" style="margin-top:12px">${I.search}<input class="input" id="cv-q" placeholder="Buscar aluno" value="${esc(st.q)}"></div>
    <div class="cv-lista" id="cv-lista">${listaHTML()}</div>`;
  const aluno = alunoId && porId[alunoId];
  const cabChat = aluno
    ? `<div class="cv-chat-h">${largo ? '' : `<a class="icon-btn sm" href="#/mensagens" aria-label="Voltar">${I.back}</a>`}${avAluno(aluno)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(aluno.nome)}</b><span data-pres="${alunoId}"></span></div><a class="btn ghost sm" href="#/aluno/${alunoId}">Ver atleta</a></div><div id="cv-box"></div>`
    : '';
  if (largo) {
    $app.innerHTML = `<div class="cv-split"><aside class="cv-side">${painelLista}</aside><section class="cv-main">${aluno ? cabChat : `<div class="cv-vazio">${I.feed}<b>Escolha uma conversa</b><span class="small muted">As mensagens dos alunos aparecem à esquerda, a mais recente em cima.</span></div>`}</section></div>`;
  } else {
    $app.innerHTML = aluno ? cabChat : painelLista;
  }
  if (aluno) {
    await viewConversa(alunoId, document.getElementById('cv-box'), true);
    vigiarPresenca(); // online, ausente ou offline do aluno no topo da conversa
    nl[alunoId] = 0;
    S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0);
    dockStaff();
    const it = document.querySelector(`[data-cv="${alunoId}"]`);
    if (it) {
      it.classList.remove('nova');
      it.querySelector('.cv-n')?.remove();
    }
  }
  // a lista se atualiza sozinha (mensagens novas sobem para o topo)
  const atualizar = async () => {
    const lst = document.getElementById('cv-lista');
    if (!lst || !location.hash.startsWith('#/mensagens')) return clearInterval(S.msgT);
    const { data } = await sb
      .from('nx_mensagens')
      .select('aluno_id,autor_id,texto,criado_em,lida')
      .eq('org_id', S.org.id)
      .order('criado_em', { ascending: false })
      .limit(2000);
    if (!data) return;
    Object.keys(ult).forEach((k) => delete ult[k]);
    Object.keys(nl).forEach((k) => delete nl[k]);
    data.forEach((m) => {
      if (!ult[m.aluno_id]) ult[m.aluno_id] = m;
      if (m.autor_id === m.aluno_id && !m.lida && m.aluno_id !== alunoId) nl[m.aluno_id] = (nl[m.aluno_id] || 0) + 1;
    });
    conversas = Object.keys(ult)
      .filter((id) => porId[id])
      .sort((a, b) => (ult[b].criado_em > ult[a].criado_em ? 1 : -1));
    const y = lst.scrollTop;
    lst.innerHTML = listaHTML();
    lst.scrollTop = y;
    S.cache.msgNovas = Object.values(nl).reduce((a, b) => a + b, 0);
    dockStaff();
  };
  clearInterval(S.msgT);
  S.msgT = setInterval(atualizar, 12000);
  const fm = document.getElementById('f-msg');
  if (fm) fm.addEventListener('submit', () => setTimeout(atualizar, 1200));
  const qi = document.getElementById('cv-q');
  if (qi)
    qi.oninput = () => {
      st.q = qi.value;
      document.getElementById('cv-lista').innerHTML = listaHTML();
    };
  const nv = document.getElementById('cv-nova');
  if (nv)
    nv.onclick = () => {
      const al = (membros || []).filter((m) => m.ativo);
      openSheet(
        `<p class="eyebrow">Nova conversa</p><div class="h2" style="margin-top:4px">Para qual aluno?</div><div class="search" style="margin-top:12px">${I.search}<input class="input" id="nc-q" placeholder="Buscar aluno"></div><div class="stack" id="nc-l" style="margin-top:10px;max-height:52vh;overflow:auto"></div>`,
        (r) => {
          const draw = (q) => {
            r.querySelector('#nc-l').innerHTML =
              al
                .filter((m) => !q || semAcento(m.nome).includes(semAcento(q)))
                .map(
                  (m) =>
                    `<a class="list-item" href="#/mensagens/${m.user_id}" style="color:inherit">${avAluno(m)}<b class="grow">${esc(m.nome)}</b>${I.chev}</a>`,
                )
                .join('') || '<p class="small muted">Nenhum aluno encontrado.</p>';
          };
          draw('');
          r.querySelector('#nc-q').oninput = (e) => draw(e.target.value);
        },
      );
    };
}

/* ---------- formulários (ficha de entrada por link) ---------- */
const FICHA_RELOGIOS = [
  'Garmin',
  'Coros',
  'Apple Watch',
  'Polar',
  'Amazfit',
  'Samsung',
  'Xiaomi',
  'Outro',
  'Não tenho',
];
const FICHA_EXP = [
  ['nunca', 'Nunca corri'],
  ['iniciante', 'Comecei há menos de 6 meses'],
  ['intermediario', 'Corro de 6 meses a 2 anos'],
  ['experiente', 'Corro há mais de 2 anos'],
];
const FICHA_HOR = [
  ['cedo', 'Bem cedo (5h–7h)'],
  ['manha', 'Manhã'],
  ['tarde', 'Tarde'],
  ['noite', 'Noite'],
];
const FICHA_LOCAL = [
  ['rua', 'Rua / orla'],
  ['esteira', 'Esteira'],
  ['academia', 'Academia'],
  ['pista', 'Pista de atletismo'],
  ['trilha', 'Trilha'],
  ['casa', 'Em casa'],
];
const FICHA_ORIGEM = [
  ['instagram', 'Instagram'],
  ['indicacao', 'Indicação de amigo'],
  ['radar', 'Radar Corridas Maranhão'],
  ['evento', 'Em uma prova ou treinão'],
  ['outro', 'Outro'],
];
const FICHA_ESPORTES = [
  ['nunca', 'Nunca pratiquei'],
  ['corrida', 'Corrida'],
  ['natacao', 'Natação'],
  ['ciclismo', 'Ciclismo'],
  ['musculacao', 'Musculação'],
  ['triathlon', 'Triathlon'],
  ['futebol', 'Futebol'],
  ['voleibol', 'Voleibol'],
  ['basquete', 'Basquetebol'],
  ['judo', 'Judô'],
  ['lutas', 'Artes marciais'],
  ['outros', 'Outros esportes'],
];
const FICHA_NIVEL = [
  ['sedentario', 'Sedentário'],
  ['iniciante', 'Iniciante'],
  ['intermediario', 'Intermediário'],
  ['avancado', 'Avançado'],
  ['profissional', 'Profissional'],
];
const FICHA_HIST = [
  'Alguma doença na família nos últimos anos?',
  'Alguma doença pessoal nos últimos anos?',
  'Possui alguma restrição à prática de atividade física?',
  'Já fez alguma cirurgia?',
  'Possui algum tipo de alergia?',
  'Já sofreu algum acidente ou lesão nos ossos, músculos ou articulações?',
  'Usa algum medicamento?',
  'Fuma ou já teve o hábito de fumar?',
  'Tem sentido dores no corpo?',
  'Está em dieta para perder ou ganhar peso?',
  'Fez algum exame do coração nos últimos 6 meses?',
];
const FICHA_TERMO =
  'Declaro que conheço os riscos próprios da prática de corrida, musculação e outros exercícios físicos, em treinos e em provas, como lesões musculares, articulares e ósseas, mal-estar, desidratação, problemas cardíacos, quedas e acidentes e, em casos extremos, morte súbita, e que pratico a atividade por livre escolha, assumindo esses riscos. Declaro que estou apto para a atividade física, que as informações desta ficha são verdadeiras e completas e que vou informar à Nexos Performance e Saúde qualquer mudança na minha saúde, apresentando atestado médico sempre que for recomendado ou solicitado. A Nexos, seus sócios e treinadores não se responsabilizam por lesões, doenças, acidentes ou morte decorrentes dos riscos próprios da atividade, de condições de saúde não informadas, do descumprimento das orientações, de treinos sem a supervisão presencial da Nexos, de provas organizadas por terceiros ou de qualquer outro fato fora do seu controle. Autorizo a Nexos a usar estes dados, inclusive os de saúde, somente para montar e acompanhar o meu treino, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).';
const fichaLink = (tk) => loginURL() + '#/ficha/' + tk;
const telWa = (t) => {
  const d = String(t || '').replace(/\D/g, '');
  return d ? (d.length <= 11 ? '55' + d : d) : '';
};
const fichaMsg = (nome, link) =>
  `Olá${nome ? ', ' + firstName(nome) : ''}! Aqui é da Nexos Performance e Saúde\n\nPara montarmos o seu treino, preencha sua ficha de entrada (leva uns 5 minutos):\n${link}`;
/* ---------- desempenho recente na ficha de entrada e sugestão de ciclo ----------
   Só resultados dos últimos 6 meses entram no cálculo: sem treino, o VO2máx e o desempenho caem em poucas semanas
   (Mujika & Padilla 2000, Sports Med). O nível vem do VDOT de Daniels pelo melhor resultado recente e é limitado pelo
   volume atual, porque o volume é que mostra o que os tecidos já toleram (Frandsen et al. 2025; Nielsen et al. 2014). */
const FICHA_CONT = [
  ['nao', 'Não corro hoje (só caminho ou estou parado)'],
  ['10', 'Até 10 minutos'],
  ['20', 'De 10 a 20 minutos'],
  ['30', 'De 20 a 30 minutos'],
  ['60', 'De 30 a 60 minutos'],
  ['mais', 'Mais de 1 hora'],
];
const FICHA_QUANDO = [
  ['nunca', 'Nunca corri essa distância'],
  ['3m', 'Nos últimos 3 meses'],
  ['6m', 'Entre 3 e 6 meses atrás'],
  ['12m', 'Entre 6 meses e 1 ano atrás'],
  ['antigo', 'Há mais de 1 ano'],
];
const FICHA_DIST = [
  ['5', '5 km', 5000],
  ['10', '10 km', 10000],
  ['21', 'Meia maratona (21 km)', 21097],
  ['42', 'Maratona (42 km)', 42195],
];
const FICHA_ALVO = [
  ['5', '5 km'],
  ['10', '10 km'],
  ['21', 'Meia maratona'],
  ['42', 'Maratona'],
  ['trail', 'Trail ou ultra'],
  ['nenhuma', 'Sem prova: saúde e condicionamento'],
];
const fichaDesempHTML = () => `<div class="ficha-corr ficha-desemp">
    <p class="ficha-sub">Seu momento atual na corrida</p>
    <label class="field"><span>Hoje, quanto tempo você consegue correr sem parar?</span><select class="input" name="cont"><option value="">Selecione</option>${FICHA_CONT.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
    <div class="grid2"><label class="field"><span>Km por semana no último mês</span><input class="input" name="km_sem" data-mask="num" data-max="3" inputmode="numeric" placeholder="Ex.: 15"></label>
    <label class="field"><span>Dias de corrida por semana hoje</span><input class="input" name="dias_sem" data-mask="num" data-max="1" inputmode="numeric" placeholder="Ex.: 3"></label></div>
    <p class="small muted" style="margin:4px 0 8px">Último resultado em cada distância: prova ou treino feito no seu máximo. Se não lembrar o tempo exato, deixe o tempo em branco.</p>
    ${FICHA_DIST.map(([k, l]) => `<div class="ficha-pv"><b>${l}</b><select class="input" name="pq${k}" aria-label="Quando correu ${l}"><option value="">Quando foi?</option>${FICHA_QUANDO.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select><input class="input" name="pt${k}" data-mask="tempo" inputmode="numeric" placeholder="Tempo (ex.: ${{ 5: '28:30', 10: '58:00', 21: '2:05:00', 42: '4:30:00' }[k]})" aria-label="Tempo nos ${l}" hidden></div>`).join('')}
    <div class="field" style="margin-top:10px"><span>Qual distância quer treinar nos próximos meses?</span><div class="chips wrap">${FICHA_ALVO.map(([k, l]) => `<label class="chipc"><input type="radio" name="alvo" value="${k}"><span>${l}</span></label>`).join('')}</div></div>
  </div>`;
const lerDesemp = (fd) => {
  const o = {
    cont: fd.get('cont') || null,
    km_sem: num(fd.get('km_sem')),
    dias_sem: num(fd.get('dias_sem')),
    alvo: fd.get('alvo') || null,
    p: {},
  };
  FICHA_DIST.forEach(([k]) => {
    // pq/pt: quando correu e o tempo em cada distância (q1…q7 são as perguntas do PAR-Q)
    const q = fd.get('pq' + k);
    if (q) o.p[k] = { q, t: ['nunca', 'antigo'].includes(q) ? null : String(fd.get('pt' + k) || '').trim() || null };
  });
  return o.cont || Object.keys(o.p).length || o.alvo ? o : null;
};
const bindDesemp = (f) => {
  const ver = () =>
    FICHA_DIST.forEach(([k]) => {
      const q = f.querySelector(`[name=pq${k}]`),
        t = f.querySelector(`[name=pt${k}]`);
      if (q && t) t.hidden = !q.value || ['nunca', 'antigo'].includes(q.value);
    });
  f.addEventListener('change', (e) => {
    if (/^pq\d+$/.test(e.target.name || '')) ver();
  });
  ver();
};
const nivVdot = (v) => (v < 37 ? 'ini' : v < 46 ? 'int' : v < 57 ? 'ava' : 'pro');
const NIV_ORD = ['ini', 'int', 'ava', 'pro'];
const minNiv = (a, b) => NIV_ORD[Math.min(NIV_ORD.indexOf(a), NIV_ORD.indexOf(b))];
// análise do desempenho informado e sugestão de ciclo da biblioteca
function analisarDesemp(ds) {
  if (!ds) return null;
  const P = ds.p || {},
    km = ds.km_sem,
    cont = ds.cont;
  const pv = FICHA_DIST.map(([k, l, m]) => {
    const x = P[k];
    if (!x) return null;
    const seg = x.t ? lerTempo(x.t) : null;
    const ok = seg && seg > (m / 1000) * 150 && seg < (m / 1000) * 1200;
    const vd = ok ? vdotDe(m, seg) : null;
    return { k, l, m, q: x.q, seg: ok ? seg : null, vdot: vd, recente: ['3m', '6m'].includes(x.q) };
  }).filter(Boolean);
  const rec = pv.filter((x) => x.recente && x.vdot);
  const melhor = rec.sort((a, b) => b.vdot - a.vdot)[0] || null;
  const fez = (k, quais) => pv.some((x) => x.k === k && quais.includes(x.q));
  const contMin = { nao: 0, 10: 10, 20: 20, 30: 30, 60: 60, mais: 90 }[cont];
  const motivos = [];
  let id = null,
    niv = 'ini';
  // nível: VDOT recente, limitado pelo volume atual
  if (melhor) {
    niv = nivVdot(melhor.vdot);
    motivos.push(
      `Melhor resultado recente: ${melhor.l} em ${fmtDurLongo(melhor.seg)} (VDOT ${Math.round(melhor.vdot)}), nível ${CIC_NIV[niv].toLowerCase()} pelo desempenho.`,
    );
    if (km != null) {
      const capV = km < 15 ? 'ini' : km < 30 ? 'int' : km < 50 ? 'ava' : 'pro';
      if (NIV_ORD.indexOf(capV) < NIV_ORD.indexOf(niv)) {
        motivos.push(
          `O volume atual (${km} km por semana) é de nível ${CIC_NIV[capV].toLowerCase()}: o ciclo começa por aí, porque é o volume que mostra o que músculos, tendões e ossos já toleram hoje.`,
        );
        niv = capV;
      }
    } else if (ds.dias_sem != null && ds.dias_sem <= 3 && NIV_ORD.indexOf(niv) > 1) {
      niv = 'int';
      motivos.push('Corre 3 dias ou menos por semana: os ciclos avançados pedem 5 ou mais.');
    }
  } else if (pv.some((x) => x.vdot && !x.recente))
    motivos.push(
      'Os tempos informados são de mais de 6 meses e não entram no cálculo: sem treino, o condicionamento cai em poucas semanas.',
    );
  const alvo = ds.alvo;
  // quem ainda não corre 30 min seguidos começa pela adaptação, qualquer que seja o objetivo
  if (contMin != null && contMin < 30) {
    id = contMin <= 10 ? 'ini-zero' : 'ini-30';
    motivos.push(
      contMin === 0
        ? 'Não corre hoje: começa pelo corre e caminha, que adapta tendões e ossos ao impacto.'
        : `Corre até ${contMin} minutos sem parar: primeiro chegar aos 30 minutos contínuos.`,
    );
  } else if (!alvo || alvo === 'nenhuma') {
    id = niv === 'ini' ? 'ini-base' : niv === 'int' ? 'bl-base-int' : 'bl-base-ava';
    motivos.push(
      'Sem prova em vista: um bloco de base aeróbica, com a maior parte do volume leve. Depois dele, a biblioteca sugere o próximo passo.',
    );
  } else if (alvo === 'trail') {
    id = niv === 'ini' ? 'tr-ini' : niv === 'int' ? 'tr-int21' : 'tr-ava21';
    motivos.push('Objetivo de trail: treino por tempo e esforço, com subidas e descidas.');
  } else {
    let a = alvo;
    if (a === '42' && !(fez('21', ['3m', '6m', '12m']) && (km || 0) >= 30)) {
      a = '21';
      motivos.push(
        'Para a maratona, o recomendado é ter completado uma meia no último ano e correr pelo menos uns 30 km por semana. O ciclo sugerido prepara a meia primeiro.',
      );
    }
    if (a === '21' && !(fez('10', ['3m', '6m']) || (km || 0) >= 20)) {
      a = '10';
      motivos.push(
        'Para a meia, o recomendado é ter corrido 10 km nos últimos meses ou estar com uns 20 km por semana. O ciclo sugerido prepara os 10 km primeiro.',
      );
    }
    if (a === '10' && niv === 'ini' && !(fez('5', ['3m', '6m']) || fez('10', ['3m', '6m'])) && (contMin || 0) < 60) {
      a = '5';
      motivos.push('Ainda sem 5 km recentes: o primeiro ciclo é o de 5 km.');
    }
    id = MAC_CIC[a] && MAC_CIC[a][niv];
    if (a === alvo) motivos.push(`Objetivo: ${(FICHA_ALVO.find((x) => x[0] === alvo) || [])[1]}.`);
  }
  const c = id && CICLOS_CORR.find((x) => x.id === id);
  return { pv, melhor, niv, ciclo: c || null, motivos };
}
function desempHTML(ds, alunoId) {
  const A = analisarDesemp(ds);
  if (!A) return '';
  const qN = (q) => (FICHA_QUANDO.find((x) => x[0] === q) || [, q])[1];
  return `<div class="card"><span class="eyebrow">Momento atual na corrida</span>
    ${ds.cont ? `<div class="ficha-l"><span>Corre sem parar</span><b>${esc((FICHA_CONT.find((x) => x[0] === ds.cont) || [, ds.cont])[1])}</b></div>` : ''}
    ${ds.km_sem != null ? `<div class="ficha-l"><span>Volume</span><b>${ds.km_sem} km por semana${ds.dias_sem != null ? ` · ${ds.dias_sem} dias` : ''}</b></div>` : ''}
    ${A.pv.map((x) => `<div class="ficha-l"><span>${x.l}</span><b>${x.seg ? fmtDurLongo(x.seg) + ' · ' : ''}${esc(qN(x.q))}${x.vdot ? ` <span class="tag ${x.recente ? 'acc' : ''}">${x.recente ? 'VDOT ' + Math.round(x.vdot) : 'antigo'}</span>` : ''}</b></div>`).join('')}
    ${ds.alvo ? `<div class="ficha-l"><span>Quer treinar</span><b>${esc((FICHA_ALVO.find((x) => x[0] === ds.alvo) || [, ds.alvo])[1])}</b></div>` : ''}</div>
    ${sugCicloHTML(A, alunoId)}`;
}
const sugCicloHTML = (A, alunoId) =>
  A && A.ciclo
    ? `<div class="card sug-ciclo"><span class="eyebrow">Sugestão Nexos</span>
    <a class="list-item" href="#/treinos/ciclos/${A.ciclo.id}" data-sugal="${alunoId || ''}" style="color:inherit;margin-top:6px"><span class="ativ-ic">${I.run}</span><div class="grow" style="min-width:0"><b>${esc(A.ciclo.nome)}</b><div class="small muted">${A.ciclo.sem} semanas · ${CIC_NIV[A.ciclo.niv]}</div></div>${I.chev}</a>
    <ul class="small sug-mot">${A.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
    <p class="small" style="margin-top:4px"><b>Antes de aplicar:</b> o aluno faz o teste de entrada (5 km, 30 min ou outro do Check-up). É o teste que define as zonas e os ritmos dos treinos; os tempos da ficha servem só para escolher o tipo de ciclo.</p>
    <a class="btn ghost sm" href="#/checkup" style="margin-top:8px">Pedir o teste no Check-up</a>
    <p class="tiny dim" style="margin-top:8px">Só resultados dos últimos 6 meses entram na sugestão, porque o condicionamento cai em poucas semanas sem treino (Mujika & Padilla 2000); o nível é limitado pelo volume atual.</p></div>`
    : '';
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-sugal]');
  if (a && a.dataset.sugal) S.cache.cicPre = { aluno: a.dataset.sugal };
});

// disponibilidade do aluno (dias que corre / faz força), marcada na ficha ou pelo treinador
const dispDe = (m) => (m && m.disponibilidade) || {};
const dispIcones = (m, i) => {
  const dp = dispDe(m);
  return `${(dp.corrida || []).includes(i) ? selo('corrida', 'disp-ic') : ''}${(dp.forca || []).includes(i) ? selo('forca', 'disp-ic') : ''}`;
};
const dispResumo = (m) => {
  const dp = dispDe(m);
  const t = (l) =>
    (l || [])
      .slice()
      .sort()
      .map((i) => DSEM[i].slice(0, 3))
      .join(', ');
  return [
    dp.corrida && dp.corrida.length ? `${selo('corrida', 'sm')} ${t(dp.corrida)}` : '',
    dp.forca && dp.forca.length ? `${selo('forca', 'sm')} ${t(dp.forca)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
};
function editarDisponibilidade(m, aoSalvar) {
  const dp = dispDe(m);
  const linha = (k, ic, l) =>
    `<div class="field"><span>${ic} ${l}</span><div class="chips wrap">${DSEM.map((d, i) => `<label class="chipc"><input type="checkbox" name="${k}" value="${i}" ${(dp[k] || []).includes(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></div>`;
  openSheet(
    `<p class="eyebrow">${esc(firstName(m.nome))}</p><div class="h2" style="margin-top:4px">Dias de treino</div><p class="small muted" style="margin-top:4px">Os dias aparecem com ${selo('corrida', 'sm')} e ${selo('forca', 'sm')} nas planilhas, para você encaixar os treinos certinho.</p>
    <form id="f-disp" style="margin-top:16px">${faz('corrida', m) ? linha('corrida', selo('corrida', 'sm'), 'Corrida') : ''}${faz('musculacao', m) ? linha('forca', selo('forca', 'sm'), 'Força') : ''}
    <label class="field"><span>Comentário sobre a disponibilidade</span><textarea class="textarea" name="obs">${esc(dp.obs || '')}</textarea></label><button class="btn block" type="submit">Salvar</button></form>`,
    (r) => {
      r.querySelector('#f-disp').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const nv = {
          ...dp,
          corrida: fd.getAll('corrida').map(Number),
          forca: fd.getAll('forca').map(Number),
          obs: String(fd.get('obs') || '').trim() || undefined,
        };
        const { error } = await sb
          .from('nx_membros')
          .update({ disponibilidade: nv })
          .eq('org_id', S.org.id)
          .eq('user_id', m.user_id);
        if (error) return toast('Não foi possível salvar.', true);
        m.disponibilidade = nv;
        closeSheet();
        toast('Dias salvos.');
        aoSalvar && aoSalvar();
      };
    },
  );
}

async function chamarForm(body) {
  const { data, error } = await sb.functions.invoke('nx-form', { body });
  if (error) {
    let m = 'Não foi possível carregar. Verifique sua internet.';
    try {
      const j = await error.context.json();
      m = j.erro || m;
    } catch {}
    throw new Error(m);
  }
  if (data && data.erro) throw new Error(data.erro);
  return data;
}

async function viewFicha(token) {
  $dock.hidden = true;
  layout('bare');
  loading();
  let info;
  try {
    info = await chamarForm({ acao: 'abrir', token });
  } catch (e) {
    $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="empty" style="margin-top:30px"><div class="h3">Link indisponível</div><p class="small">${esc(e.message)}</p></div>`;
    return;
  }
  if (info.respondido) {
    $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="card center" style="margin-top:24px;padding:26px 18px">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Ficha já enviada</div><p class="small muted" style="margin-top:6px">Recebemos suas respostas. O seu treinador vai falar com você pelo WhatsApp.</p></div>`;
    return;
  }
  const chips = (name, ops, tipo = 'checkbox') =>
    `<div class="chips wrap">${ops.map(([k, l]) => `<label class="chipc"><input type="${tipo}" name="${name}" value="${k}"><span>${l}</span></label>`).join('')}</div>`;
  const sn = (name) =>
    `<div class="radios"><label><input type="radio" name="${name}" value="nao"><span>Não</span></label><label><input type="radio" name="${name}" value="sim"><span>Sim</span></label></div>`;
  const sn3 = (name) =>
    `<div class="radios r3"><label><input type="radio" name="${name}" value="sim"><span>Sim</span></label><label><input type="radio" name="${name}" value="nao"><span>Não</span></label><label><input type="radio" name="${name}" value="naosei"><span>Não sei</span></label></div>`;
  const diasL = (k, ic, l) =>
    `<div class="field disp-l" data-disp="${k}"><span>${ic} ${l}</span>${chips(
      'd_' + k,
      DSEM.map((d, i) => [String(i), d.slice(0, 3)]),
    )}</div>`;
  const sec = (n, t, d, corpo) =>
    `<section class="card ficha-sec wz-step" data-k="${n}" data-titulo="${t.split(' · ')[0]}"><div class="ficha-n">${n}</div><div class="grow" style="min-width:0"><div class="h3">${t}</div>${d ? `<p class="tiny dim" style="margin:3px 0 0">${d}</p>` : ''}<div class="stack" style="margin-top:12px;gap:2px">${corpo}</div></div></section>`;
  $app.innerHTML = `
    <div class="ficha-top"><img src="${LOGO.s()}" alt="">${slashes}</div>
    <p class="eyebrow">${esc(info.org)}</p><h1 class="h1" style="margin-top:4px">Ficha de entrada</h1>
    <p class="muted small" style="margin:8px 0 0">São 8 etapas rápidas, uns 5 minutos. Com essas respostas o treinador monta um treino certo para você, com segurança. Campos com * são obrigatórios.</p>
    <form id="f-ficha" class="stack" style="margin-top:16px" novalidate>
      ${sec(
        1,
        'Seus dados',
        '',
        `
        <label class="field"><span>Nome completo *</span><input class="input" name="nome" required value="${esc(info.nome)}" autocomplete="name"></label>
        <div class="grid2"><label class="field"><span>WhatsApp *</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" required placeholder="(98) 9 9999-9999" value="${esc(info.telefone)}" autocomplete="tel"></label>
        <label class="field"><span>E-mail *</span><input class="input" type="email" name="email" required inputmode="email" autocomplete="email" placeholder="será o seu login no app"></label></div>
        <div class="grid2"><label class="field"><span>Data de nascimento *</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa"></label>
        <label class="field"><span>Sexo *</span><select class="input" name="sexo"><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="nao_informar">Prefiro não dizer</option></select></label></div>
        <div class="grid2"><label class="field"><span>Altura</span><div class="un-wrap"><input class="input" name="altura" data-mask="altura" inputmode="numeric" placeholder="1,75"><i>m</i></div></label>
        <label class="field"><span>Peso</span><div class="un-wrap"><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="70"><i>kg</i></div></label></div>
        <label class="field"><span>Bairro / cidade</span><input class="input" name="cidade" placeholder="Ex.: Cohama, São Luís"></label>`,
      )}
      ${sec(
        2,
        'Objetivo',
        '',
        `
        <div class="field"><span>Quer treinar com a Nexos *</span>${chips('modalidades', MODS)}</div>
        <div class="field"><span>Objetivo principal</span>${chips('objetivo', OBJETIVOS, 'radio')}</div>
        <label class="field"><span>Quais são os seus objetivos pessoais com o treino? *</span><textarea class="textarea" name="meta" placeholder="Ex.: correr meus primeiros 10 km, perder peso, voltar a treinar sem dor"></textarea></label>
        <label class="field"><span>Tem alguma prova em vista?</span><input class="input" name="prova" placeholder="Nome e data, se já souber"></label>`,
      )}
      ${sec(
        3,
        'Histórico esportivo',
        '',
        `
        <div class="field"><span>Já praticou ou pratica algum esporte? *</span>${chips('esportes', FICHA_ESPORTES)}</div>
        <label class="field" id="esp-outros" hidden><span>Quais outros esportes?</span><input class="input" name="esportes_outros"></label>
        <label class="field"><span>Como é ou foi a sua rotina de exercícios?</span><textarea class="textarea" name="atividade" placeholder="Ex.: musculação 3x por semana há 1 ano, futebol aos sábados"></textarea></label>
        <div class="field"><span>Como avalia o seu condicionamento físico hoje? *</span>${chips('nivel', FICHA_NIVEL, 'radio')}</div>
        <div class="field ficha-corr"><span>Experiência com corrida</span><select class="input" name="corrida_exp"><option value="">Selecione</option>${FICHA_EXP.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        ${fichaDesempHTML()}
        <label class="field ficha-corr"><span>Relógio ou app que usa</span><select class="input" name="relogio"><option value="">Selecione</option>${FICHA_RELOGIOS.map((r) => `<option>${r}</option>`).join('')}</select></label>`,
      )}
      ${sec(
        4,
        'Histórico médico',
        'Responda todas. Se tiver dúvida, marque “Não sei”.',
        `
        ${FICHA_HIST.map((q, i) => `<div class="parq"><p>${q}</p>${sn3('h' + (i + 1))}</div>`).join('')}
        <label class="field" style="margin-top:8px"><span>Observações sobre o seu histórico médico</span><textarea class="textarea" name="obs_medica" placeholder="Conte o que marcou como “sim”: qual doença, cirurgia, remédio, lesão…"></textarea></label>`,
      )}
      ${sec(
        5,
        'PAR-Q+ · prontidão para atividade física',
        'Responda com sinceridade. Um "sim" não impede o treino, só pede uma conversa com o médico antes.',
        `
        ${PARQ_PLUS.map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1))}</div>`).join('')}`,
      )}
      ${sec(
        6,
        'Disponibilidade para treinar',
        'Marque os dias em que você consegue treinar cada modalidade.',
        `
        ${diasL('corrida', selo('corrida', 'sm'), 'Dias de corrida')}${diasL('forca', selo('forca', 'sm'), 'Dias de força (musculação)')}
        <div class="field"><span>Melhor horário</span>${chips('horario', FICHA_HOR)}</div>
        <div class="field"><span>Onde prefere treinar</span>${chips('local', FICHA_LOCAL)}</div>
        <label class="field"><span>Algum comentário sobre a sua disponibilidade?</span><textarea class="textarea" name="disp_obs" placeholder="Ex.: às quartas só depois das 19h"></textarea></label>`,
      )}
      ${sec(
        7,
        'Termo de aceite',
        '',
        `
        <div class="ficha-termo">${FICHA_TERMO}</div>
        <label class="ficha-aceite"><input type="checkbox" name="aceite"><span>Li e aceito o termo de responsabilidade acima. *</span></label>
        ${
          info.plano
            ? `<div class="ficha-plano" style="margin-top:14px"><span class="eyebrow">Termo de adesão · seu plano</span><b>${esc(info.plano.nome)} · ${esc(COMPROMISSO_NOME[info.plano.periodo] || '')}</b><span class="small muted">${esc(planoCombinadoTxt(info.plano).split(' · ').slice(2).join(' · '))}</span></div>
        <div class="ficha-termo termo" style="margin-top:8px">${adesaoTexto()}</div>
        <label class="ficha-aceite"><input type="checkbox" name="adesao"><span>Li e aceito o Termo de Adesão do plano ${esc(info.plano.nome)} ${esc(COMPROMISSO_NOME[info.plano.periodo] || '')}. *</span></label>`
            : ''
        }
        <div class="field" style="margin-top:12px"><span>Como conheceu a Nexos?</span>${chips('origem', FICHA_ORIGEM, 'radio')}</div>
        <label class="field"><span>Quer contar mais alguma coisa?</span><textarea class="textarea" name="obs"></textarea></label>`,
      )}
      ${sec(
        8,
        'Seu acesso ao app',
        'Crie a senha que você vai usar para entrar no app da Nexos. Ao enviar, você já entra.',
        `
        <div class="fx-login small muted">Seu login: <b id="fx-login">o e-mail da etapa 1</b></div>
        <label class="field"><span>Confirme o seu e-mail *</span><input class="input" type="email" name="email2" inputmode="email" autocomplete="off" autocapitalize="off" placeholder="digite o e-mail de novo"></label>
        <label class="field"><span>Crie uma senha *</span><div class="pass-wrap"><input class="input" type="password" name="senha" autocomplete="new-password" placeholder="mínimo de 6 caracteres"><button type="button" class="icon-btn" id="fx-ver" aria-label="Mostrar senha">${I.eye}</button></div></label>
        <label class="field"><span>Repita a senha *</span><input class="input" type="password" name="senha2" autocomplete="new-password" placeholder="a mesma senha"></label>
        <p class="tiny dim">Guarde essa senha: é com ela e com o seu e-mail que você entra no app.</p>`,
      )}
      <button class="btn block" type="submit">Enviar ficha ${I.check}</button>
      <p class="tiny dim center">Suas respostas vão só para a equipe de treinadores da Nexos.</p>
    </form>`;
  const f = document.getElementById('f-ficha');
  bindDesemp(f);
  const ajustar = () => {
    const mods = [...f.querySelectorAll('[name=modalidades]:checked')].map((x) => x.value);
    const corrOn = !mods.length || mods.includes('corrida'),
      forOn = !mods.length || mods.includes('musculacao');
    f.querySelectorAll('.ficha-corr').forEach((x) => (x.hidden = !corrOn));
    f.querySelector('[data-disp=corrida]').hidden = !corrOn;
    f.querySelector('[data-disp=forca]').hidden = !forOn;
    f.querySelector('#esp-outros').hidden = !f.querySelector('[name=esportes][value=outros]').checked;
  };
  f.addEventListener('change', (e) => {
    if (e.target.name === 'esportes' && e.target.checked) {
      // "nunca pratiquei" exclui os outros
      if (e.target.value === 'nunca')
        f.querySelectorAll('[name=esportes]').forEach((x) => {
          if (x !== e.target) x.checked = false;
        });
      else f.querySelector('[name=esportes][value=nunca]').checked = false;
    }
    ajustar();
  });
  aplicarMascaras(f);
  ajustar();
  const fxLogin = f.querySelector('#fx-login');
  f.querySelector('[name=email]').addEventListener('input', (e) => {
    fxLogin.textContent = e.target.value.trim() || 'o e-mail da etapa 1';
  });
  f.querySelector('#fx-ver').onclick = () => {
    const vis = f.querySelector('[name=senha]').type === 'password';
    f.querySelectorAll('[name=senha],[name=senha2]').forEach((x) => (x.type = vis ? 'text' : 'password'));
  };
  const erroAcesso = (fd) => {
    const v = (n) => String(fd.get(n) || '').trim();
    if (v('email2').toLowerCase() !== v('email').toLowerCase())
      return { msg: 'Os e-mails não são iguais. Confira o e-mail.', sel: '[name=email2]' };
    if (String(fd.get('senha') || '').length < 6)
      return { msg: 'A senha precisa ter pelo menos 6 caracteres.', sel: '[name=senha]' };
    if (fd.get('senha') !== fd.get('senha2')) return { msg: 'As senhas não são iguais.', sel: '[name=senha2]' };
    return null;
  };
  etapas(f, (el) => {
    const fd = new FormData(f),
      v = (n) => String(fd.get(n) || '').trim(),
      k = el.dataset.k;
    const mods = fd.getAll('modalidades');
    if (k === '1') {
      if (v('nome').length < 3 || !v('nome').includes(' '))
        return { msg: 'Escreva o seu nome completo.', sel: '[name=nome]' };
      if (soDig(v('telefone')).length < 10) return { msg: 'Confira o seu WhatsApp com DDD.', sel: '[name=telefone]' };
      if (!/^\S+@\S+\.\S+$/.test(v('email'))) return { msg: 'Confira o seu e-mail.', sel: '[name=email]' };
      const nas = dataISO(v('nascimento'));
      if (!nas || nas > hojeISO() || nas < '1920-01-01')
        return { msg: 'Confira a data de nascimento (dd/mm/aaaa).', sel: '[name=nascimento]' };
      if (!v('sexo')) return { msg: 'Escolha uma opção em Sexo.', sel: '[name=sexo]' };
      if (v('altura') && !/^[12],\d{2}$/.test(v('altura')))
        return { msg: 'Confira a altura (ex.: 1,75).', sel: '[name=altura]' };
      return null;
    }
    if (k === '2') {
      if (!mods.length) return { msg: 'Marque corrida, musculação ou as duas.', sel: '[name=modalidades]' };
      if (!v('meta')) return { msg: 'Conte quais são os seus objetivos.', sel: '[name=meta]' };
      return null;
    }
    if (k === '3') {
      if (!fd.getAll('esportes').length)
        return { msg: 'Marque os esportes que já praticou (ou “Nunca pratiquei”).', sel: '[name=esportes]' };
      if (!v('nivel')) return { msg: 'Escolha o seu nível de condicionamento.', sel: '[name=nivel]' };
      return null;
    }
    if (k === '4') {
      const ih = FICHA_HIST.findIndex((_, i) => !fd.get('h' + (i + 1)));
      return ih >= 0 ? { msg: 'Responda todas as perguntas do histórico médico.', sel: `[name=h${ih + 1}]` } : null;
    }
    if (k === '5') {
      const iq = PARQ_PLUS.findIndex((_, i) => !fd.get('q' + (i + 1)));
      return iq >= 0 ? { msg: `Responda a pergunta ${iq + 1} do PAR-Q.`, sel: `[name=q${iq + 1}]` } : null;
    }
    if (k === '6') {
      const c = mods.includes('corrida') ? fd.getAll('d_corrida') : [],
        fo = mods.includes('musculacao') ? fd.getAll('d_forca') : [];
      return c.length || fo.length
        ? null
        : { msg: 'Marque os dias em que pode treinar.', sel: '.disp-l:not([hidden]) input' };
    }
    if (k === '7') {
      if (!fd.get('aceite')) return { msg: 'Aceite o termo de responsabilidade.', sel: '[name=aceite]' };
      if (info.plano && !fd.get('adesao'))
        return { msg: 'Aceite o Termo de Adesão do seu plano.', sel: '[name=adesao]' };
      return null;
    }
    if (k === '8') return erroAcesso(fd);
    return null;
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const btn = f.querySelector('[type=submit]');
    const d = {};
    [
      'nome',
      'telefone',
      'email',
      'nascimento',
      'sexo',
      'altura',
      'peso',
      'cidade',
      'objetivo',
      'meta',
      'prova',
      'esportes_outros',
      'atividade',
      'nivel',
      'corrida_exp',
      'maior_dist',
      'tempo_recente',
      'relogio',
      'obs_medica',
      'disp_obs',
      'origem',
      'obs',
    ].forEach((k) => {
      const v = String(fd.get(k) || '').trim();
      if (v) d[k] = v.slice(0, 1500);
    });
    ['modalidades', 'esportes', 'horario', 'local'].forEach((k) => {
      const v = fd.getAll(k);
      if (v.length) d[k] = v;
    });
    if (d.nascimento) d.nascimento = dataISO(d.nascimento) || undefined;
    const mods = d.modalidades || [];
    d.disponibilidade = {
      corrida: mods.includes('corrida') ? fd.getAll('d_corrida').map(Number) : [],
      forca: mods.includes('musculacao') ? fd.getAll('d_forca').map(Number) : [],
    };
    if (!mods.length || mods.includes('corrida')) {
      const ds = lerDesemp(fd);
      if (ds) d.desemp = ds;
    }
    d.hist = {};
    FICHA_HIST.forEach((_, i) => {
      d.hist['h' + (i + 1)] = fd.get('h' + (i + 1)) || null;
    });
    d.parq = { v: 'plus' };
    PARQ_PLUS.forEach((_, i) => {
      d.parq['q' + (i + 1)] = fd.get('q' + (i + 1)) || null;
    });
    const falta = (sel, msg) => {
      const el = f.querySelector(sel);
      toast(msg, true);
      if (el)
        el.closest('.field, .parq, .ficha-aceite, label')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    if (!d.nome || d.nome.length < 3) return falta('[name=nome]', 'Escreva seu nome completo.');
    if (String(d.telefone || '').replace(/\D/g, '').length < 10)
      return falta('[name=telefone]', 'Confira o seu WhatsApp com DDD.');
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) return falta('[name=email]', 'Confira o seu e-mail.');
    if (!mods.length) return falta('[name=modalidades]', 'Marque corrida, musculação ou as duas.');
    if (!d.meta) return falta('[name=meta]', 'Conte quais são os seus objetivos.');
    if (!d.esportes) return falta('[name=esportes]', 'Marque os esportes que já praticou (ou “Nunca pratiquei”).');
    if (!d.nivel) return falta('[name=nivel]', 'Escolha o seu nível de condicionamento.');
    const ih = FICHA_HIST.findIndex((_, i) => !d.hist['h' + (i + 1)]);
    if (ih >= 0) return falta(`[name=h${ih + 1}]`, 'Responda todas as perguntas do histórico médico.');
    const iq = PARQ_PLUS.findIndex((_, i) => !d.parq['q' + (i + 1)]);
    if (iq >= 0) return falta(`[name=q${iq + 1}]`, `Responda a pergunta ${iq + 1} do PAR-Q.`);
    if (!d.disponibilidade.corrida.length && !d.disponibilidade.forca.length)
      return falta('.disp-l:not([hidden]) input', 'Marque os dias em que pode treinar.');
    if (!fd.get('aceite')) return falta('[name=aceite]', 'Aceite o termo de responsabilidade no final.');
    if (info.plano && !fd.get('adesao')) return falta('[name=adesao]', 'Aceite o Termo de Adesão do seu plano.');
    if (!d.nascimento) return falta('[name=nascimento]', 'Confira a data de nascimento.');
    const ea = erroAcesso(fd);
    if (ea) return falta(ea.sel, ea.msg);
    const senha = String(fd.get('senha'));
    d.aceite = true;
    if (info.plano) d.adesao = { versao: ADESAO_VERSAO, aceite: true }; // a data, o IP e o aparelho são gravados pelo servidor
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    try {
      const env = await chamarForm({ acao: 'enviar', token, dados: d });
      window.scrollTo(0, 0);
      const tela = (corpo) => {
        $app.innerHTML = `<div class="ficha-top"><img src="${LOGO.s()}" alt=""></div><div class="card center" style="margin-top:24px;padding:28px 18px">${corpo}</div>`;
      };
      const irLogin = (email, txt) =>
        tela(
          `${estIc(I.caixa)}<div class="h3" style="margin-top:6px">Ficha enviada, ${esc(firstName(d.nome))}!</div><p class="small muted" style="margin:8px 0 14px">${txt}</p><a class="btn block" href="${esc(loginURL())}">Entrar no app</a><p class="tiny dim" style="margin-top:10px">Login: <b>${esc(email)}</b></p>`,
        );
      // cria a conta com a senha que o aluno escolheu e já entra no app (fica aguardando a aprovação do treinador)
      const criar = async () => {
        tela(
          `${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Ficha enviada, ${esc(firstName(d.nome))}!</div><p class="small muted" style="margin-top:8px">Criando o seu acesso ao app…</p>`,
        );
        try {
          const r = await chamarForm({ acao: 'criar_acesso', token, resposta: env.resposta, senha });
          if (r.existente)
            return irLogin(
              r.email,
              'Você já tem acesso ao app da Nexos. Entre com o seu e-mail e a senha que você já usa.',
            );
          if (r.conta_existente)
            return irLogin(
              r.email,
              'Este e-mail já tinha uma conta. Entre com a senha que você já usa (ou toque em “Esqueci minha senha”). Seu treinador vai aprovar o seu acesso.',
            );
          const { data: li, error: le } = await sb.auth.signInWithPassword({ email: r.email, password: senha });
          if (le || !li || !li.user)
            return irLogin(
              r.email,
              'Seu acesso foi criado. Entre com o seu e-mail e a senha que você acabou de criar.',
            );
          S.user = li.user;
          try {
            await carregarPerfil();
          } catch {}
          if (location.hash !== '#/') location.hash = '#/';
          else router(); // a troca do endereço chama o router
        } catch (er) {
          tela(
            `<div class="h3">Falta só um passo</div><p class="small muted" style="margin:6px 0 12px">${esc(er.message || 'Não conseguimos criar o seu acesso agora.')}</p><button class="btn block" id="receber">Tentar de novo</button>`,
          );
          document.getElementById('receber').onclick = criar;
        }
      };
      if (env && env.resposta) await criar();
      else
        tela(
          `${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Ficha enviada, ${esc(firstName(d.nome))}!</div><p class="small muted" style="margin-top:8px">O seu treinador da Nexos já recebeu as suas respostas.</p>`,
        );
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Enviar ficha';
      toast(err.message, true);
    }
  };
}

function fichaResumo(d) {
  const sim = parqLista(d.parq)
    .map((q, i) => [i + 1, q])
    .filter(([n]) => (d.parq || {})['q' + n] === 'sim');
  const histSim = FICHA_HIST.map((q, i) => [q, (d.hist || {})['h' + (i + 1)]]).filter(
    ([, v]) => v === 'sim' || v === 'naosei',
  );
  return {
    sim,
    histSim,
    mods: (d.modalidades || []).map((k) => (MODS.find((m) => m[0] === k) || [k, k])[1]).join(' + '),
    obj: (OBJETIVOS.find((o) => o[0] === d.objetivo) || [])[1] || '',
  };
}

async function staffFormularios(id) {
  loading();
  if (id) return staffFichaResposta(id);
  const [{ data: formsT }, { data: respsT }] = await Promise.all([
    sb.from('nx_formularios').select('*').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(500),
    sb.from('nx_form_respostas').select('*').eq('org_id', S.org.id).order('criado_em', { ascending: false }).limit(300),
  ]);
  const meusForms = (formsT || []).filter(formMeu);
  const idsForms = new Set(meusForms.map((f) => f.id));
  const forms = meusForms.filter((f) => f.ativo);
  const resps = (respsT || []).filter((r) => !r.form_id || idsForms.has(r.form_id));
  const { data: mbs } = await sb
    .from('nx_membros')
    .select('user_id,aprovacao,ativo')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno');
  const stM = Object.fromEntries((mbs || []).map((m) => [m.user_id, m]));
  const semAcesso = (r) => !r.aluno_id || (stM[r.aluno_id] && stM[r.aluno_id].aprovacao === 'pendente');
  dockStaff();
  S.cache.fichasNovas = (resps || []).filter((r) => !r.visto).length;
  const geral = (forms || []).find((f) => f.multiplo);
  const aguardando = (forms || []).filter((f) => !f.multiplo && !f.respondido_em);
  const linhaResp = (r) => {
    const d = r.dados || {};
    const rs = fichaResumo(d);
    return `<a class="list-item ficha-it" href="#/formularios/${r.id}" style="color:inherit"><span class="ativ-ic">${I.ficha}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(d.nome || 'Sem nome')}</b><div class="small muted ellip">${[rs.mods, rs.obj].filter(Boolean).map(esc).join(' · ') || 'Ficha de entrada'}</div>
      <div class="ficha-tags">${!r.visto ? '<span class="tag acc">nova</span>' : ''}${rs.sim.length ? '<span class="tag err">PAR-Q</span>' : ''}${semAcesso(r) ? '<span class="tag warn">aguardando acesso</span>' : r.aluno_id ? '<span class="tag ok">cadastrado</span>' : ''}<span class="tiny dim">${quando(r.criado_em)}</span></div></div>${I.chev}</a>`;
  };
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>
    <p class="eyebrow">Formulários</p><h1 class="h1">Ficha de entrada</h1>
    <p class="muted small" style="margin-top:6px">Gere o link, mande no WhatsApp e a pessoa preenche pelo celular, sem precisar de login. As respostas chegam aqui.</p>
    <div class="grid2" style="margin-top:16px"><button class="btn" id="gerar">${I.plus} Gerar link</button><button class="btn ghost" id="geral">${I.feed} Link geral</button></div>
    <div class="section"><div class="section-h"><h2 class="h2">Respostas</h2>${slashes}</div>
      <div class="stack">${(resps || []).length ? resps.map(linhaResp).join('') : '<div class="empty"><div class="h3">Nenhuma ficha ainda</div><p class="small">Quando alguém preencher, aparece aqui e você recebe uma notificação.</p></div>'}</div></div>
    ${
      aguardando.length
        ? `<div class="section"><div class="section-h"><h2 class="h2">Aguardando resposta</h2></div><div class="stack">${aguardando
            .map(
              (
                f,
              ) => `<div class="list-item"><span class="ativ-ic">${I.espera}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(f.nome || 'Link sem nome')}</b><div class="small muted">${f.plano ? esc(f.plano.nome + ' ' + (COMPROMISSO_NOME[f.plano.periodo] || '')) + ' · ' : ''}${f.telefone ? esc(f.telefone) + ' · ' : ''}enviado ${quando(f.criado_em)}</div></div>
      <button class="icon-btn sm" data-wa="${f.id}" aria-label="Mandar de novo no WhatsApp" title="WhatsApp">${I.feed}</button><button class="icon-btn sm" data-del="${f.id}" aria-label="Cancelar link" title="Cancelar link">${I.x}</button></div>`,
            )
            .join('')}</div></div>`
        : ''
    }`;
  const mostrar = (f) => {
    const link = fichaLink(f.token);
    const msg =
      fichaMsg(f.nome, link) +
      (f.plano
        ? `\n\nSeu plano: ${planoCombinadoTxt(f.plano)}.\nNo fim da ficha está o Termo de Adesão com as regras do plano.`
        : '');
    const tel = telWa(f.telefone);
    openSheet(
      `<p class="eyebrow">${f.multiplo ? 'Link geral' : 'Link pronto'}</p><div class="h2" style="margin-top:4px">${f.multiplo ? 'Use na bio do Instagram ou em grupos' : esc(f.nome ? 'Ficha de ' + firstName(f.nome) : 'Ficha de entrada')}</div>
      <p class="small muted" style="margin-top:6px">${f.multiplo ? 'Qualquer pessoa pode preencher este link, quantas vezes for preciso.' : 'Vale para uma pessoa. Depois que ela enviar, o link fecha.'}</p>
      ${f.plano ? `<div class="ficha-plano" style="margin-top:10px"><span class="eyebrow">Plano e Termo de Adesão</span><b>${esc(planoCombinadoTxt(f.plano))}</b></div>` : ''}
      <div class="ficha-link mono">${esc(link)}</div>
      <a class="btn block wa-btn" href="https://wa.me/${tel}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" style="margin-top:12px">Enviar no WhatsApp${tel ? '' : ' (escolher contato)'}</a>
      <div class="mail-row" style="margin-top:8px"><input class="input" type="email" id="fx-mail" placeholder="E-mail da pessoa" value="${esc(f.email || '')}"><button class="btn mail-btn" id="fx-env">${I.mail} Enviar</button></div>
      <div class="grid2" style="margin-top:8px"><button class="btn ghost" id="cp-link">Copiar link</button><button class="btn ghost" id="cp-msg">Copiar mensagem</button></div>`,
      (r) => {
        r.querySelector('#fx-env').onclick = (ev) => {
          const para = r.querySelector('#fx-mail').value.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return toast('Digite um e-mail válido.', true);
          enviarEmailNexos({ tipo: 'ficha', para, nome: f.nome || '', link }, ev.currentTarget);
        };
        const cp = async (t, ok) => {
          try {
            await navigator.clipboard.writeText(t);
            toast(ok);
          } catch {
            toast('Não foi possível copiar.', true);
          }
        };
        r.querySelector('#cp-link').onclick = () => cp(link, 'Link copiado!');
        r.querySelector('#cp-msg').onclick = () => cp(msg, 'Mensagem copiada!');
      },
    );
  };
  document.getElementById('gerar').onclick = () =>
    openSheet(
      `<p class="eyebrow">Ficha de entrada</p><div class="h2" style="margin-top:4px">Gerar link</div>
    <form id="f-gl" style="margin-top:16px"><label class="field"><span>Nome da pessoa (opcional)</span><input class="input" name="nome" placeholder="Já aparece preenchido para ela"></label>
    <label class="field"><span>WhatsApp (opcional)</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999"></label>
    <p class="tiny dim" style="margin:-4px 0 14px">Com o número, o WhatsApp já abre na conversa dela.</p>
    <label class="field"><span>Plano</span><select class="input" name="plano">${PLANOS_NEXOS.map((p) => `<option value="${p.k}">${esc(p.nome)}</option>`).join('')}<option value="">Sem plano (parceria ou combinar depois)</option></select></label>
    <div class="grid2" id="gl-per"><label class="field"><span>Período</span><select class="input" name="periodo">${PERIODOS_PLANO.map((v) => `<option value="${v}" ${v === 12 ? 'selected' : ''}>${COMPROMISSO_NOME[v][0].toUpperCase() + COMPROMISSO_NOME[v].slice(1)}</option>`).join('')}</select></label>
    <label class="field"><span>Pagamento</span><select class="input" name="forma"></select></label></div>
    <div class="ficha-plano" id="gl-res" style="margin:-2px 0 14px"></div>
    <button class="btn block" type="submit">Gerar link</button></form>`,
      (r) => {
        const fm = r.querySelector('#f-gl');
        const plAtual = () => {
          const k = fm.plano.value,
            per = +fm.periodo.value,
            forma = fm.forma.value,
            pr = precoPlanoNexos(k, per, forma);
          return pr ? { k, nome: PLANOS_NEXOS.find((p) => p.k === k).nome, periodo: per, forma, ...pr } : null;
        };
        const atualizar = () => {
          const sem = !fm.plano.value;
          r.querySelector('#gl-per').hidden = sem;
          const ant = fm.forma.value;
          fm.forma.innerHTML = formasDoPeriodo(+fm.periodo.value)
            .map((k) => `<option value="${k}" ${k === ant ? 'selected' : ''}>${FORMAS_PLANO[k]}</option>`)
            .join('');
          const p = plAtual();
          r.querySelector('#gl-res').innerHTML = sem
            ? '<span class="small muted">Sem plano, a ficha vai sem o Termo de Adesão.</span>'
            : p
              ? `<span class="eyebrow">Vai no fim da ficha, com o Termo de Adesão</span><b>${esc(planoCombinadoTxt(p))}</b>`
              : '';
        };
        ['plano', 'periodo', 'forma'].forEach((n) => fm[n].addEventListener('change', atualizar));
        atualizar();
        r.querySelector('#f-gl').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          e.target.querySelector('button').disabled = true;
          const { data, error } = await sb
            .from('nx_formularios')
            .insert({
              org_id: S.org.id,
              tipo: 'entrada',
              nome: String(fd.get('nome') || '').trim() || null,
              telefone: String(fd.get('telefone') || '').trim() || null,
              criado_por: S.user.id,
              plano: plAtual(),
            })
            .select('*')
            .single();
          if (error) {
            e.target.querySelector('button').disabled = false;
            return toast('Não foi possível gerar o link.', true);
          }
          closeSheet();
          staffFormularios().then(() => mostrar(data));
        };
      },
    );
  document.getElementById('geral').onclick = async () => {
    if (geral) return mostrar(geral);
    const { data, error } = await sb
      .from('nx_formularios')
      .insert({ org_id: S.org.id, tipo: 'entrada', multiplo: true, criado_por: S.user.id })
      .select('*')
      .single();
    if (error) return toast('Não foi possível gerar o link.', true);
    mostrar(data);
  };
  $app
    .querySelectorAll('[data-wa]')
    .forEach((b) => (b.onclick = () => mostrar(forms.find((f) => f.id === b.dataset.wa))));
  $app.querySelectorAll('[data-del]').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm('Cancelar este link? A pessoa não vai mais conseguir preencher.')) return;
        await sb.from('nx_formularios').update({ ativo: false }).eq('id', b.dataset.del);
        staffFormularios();
      }),
  );
}

/* ---------- editar a ficha de inscrição (treinador) ---------- */
async function preencherFichaIns(alunoId) {
  const el = document.querySelector(`[data-ficha-ins="${alunoId}"]`);
  if (!el) return;
  const { data } = await sb
    .from('nx_form_respostas')
    .select('id')
    .eq('aluno_id', alunoId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  if (data && data[0]) {
    el.href = '#/formularios/' + data[0].id;
    el.hidden = false;
  }
}
function editarFicha(r, aoSalvar) {
  const d = JSON.parse(JSON.stringify(r.dados || {}));
  const dp = d.disponibilidade || {};
  const h = d.hist || {},
    pq = d.parq || {};
  const v = (k) => esc(d[k] || '');
  const chk = (name, ops, sel, tipo = 'checkbox') =>
    `<div class="chips wrap">${ops.map(([k, l]) => `<label class="chipc"><input type="${tipo}" name="${name}" value="${k}" ${(Array.isArray(sel) ? sel.map(String).includes(String(k)) : String(sel) === String(k)) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const sn = (name, val, tres) =>
    `<div class="radios ${tres ? 'r3' : ''}">${(tres
      ? [
          ['sim', 'Sim'],
          ['nao', 'Não'],
          ['naosei', 'Não sei'],
        ]
      : [
          ['nao', 'Não'],
          ['sim', 'Sim'],
        ]
    )
      .map(
        ([k, l]) =>
          `<label><input type="radio" name="${name}" value="${k}" ${val === k ? 'checked' : ''}><span>${l}</span></label>`,
      )
      .join('')}</div>`;
  const sec = (t, corpo, aberto) =>
    `<details class="card ed-sec" ${aberto ? 'open' : ''}><summary><b>${t}</b>${I.chev}</summary><div class="stack" style="margin-top:12px;gap:2px">${corpo}</div></details>`;
  const diasOps = DSEM.map((x, i) => [String(i), x.slice(0, 3)]);
  openSheet(
    `<p class="eyebrow">Ficha de inscrição</p><div class="h2" style="margin-top:4px">Editar ${esc(firstName(d.nome || ''))}</div>
    <p class="small muted" style="margin-top:4px">Corrija o que precisar. ${r.aluno_id ? 'O cadastro do aluno no app é atualizado junto (modalidade, dados, dias de treino e PAR-Q).' : ''}</p>
    <form id="f-edf" class="stack" style="margin-top:14px;gap:10px">
      ${sec(
        'Seus dados',
        `<label class="field"><span>Nome completo</span><input class="input" name="nome" value="${v('nome')}"></label>
        <div class="grid2"><label class="field"><span>WhatsApp</span><input class="input" name="telefone" data-mask="tel" inputmode="numeric" value="${esc(MASCARA.tel(d.telefone || ''))}"></label><label class="field"><span>E-mail</span><input class="input" name="email" type="email" value="${v('email')}"></label></div>
        <div class="grid2"><label class="field"><span>Nascimento</span><input class="input" name="nascimento" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${dataBR(d.nascimento)}"></label>
        <label class="field"><span>Sexo</span><select class="input" name="sexo">${[
          ['', 'Selecione'],
          ['feminino', 'Feminino'],
          ['masculino', 'Masculino'],
          ['nao_informar', 'Prefere não dizer'],
        ]
          .map(([k, l]) => `<option value="${k}" ${d.sexo === k ? 'selected' : ''}>${l}</option>`)
          .join('')}</select></label></div>
        <div class="grid2"><label class="field"><span>Altura</span><input class="input" name="altura" data-mask="altura" inputmode="numeric" value="${v('altura')}"></label><label class="field"><span>Peso</span><input class="input" name="peso" data-mask="peso" inputmode="numeric" value="${v('peso')}"></label></div>
        <label class="field"><span>Bairro / cidade</span><input class="input" name="cidade" value="${v('cidade')}"></label>`,
        true,
      )}
      ${sec(
        'Objetivo e modalidade',
        `<div class="field"><span>Quer treinar</span>${chk('modalidades', MODS, d.modalidades || [])}</div>
        <div class="field"><span>Objetivo principal</span>${chk('objetivo', OBJETIVOS, d.objetivo, 'radio')}</div>
        <label class="field"><span>Objetivos pessoais</span><textarea class="textarea" name="meta">${v('meta')}</textarea></label>
        <label class="field"><span>Prova em vista</span><input class="input" name="prova" value="${v('prova')}"></label>`,
        true,
      )}
      ${sec(
        'Histórico esportivo',
        `<div class="field"><span>Esportes</span>${chk('esportes', FICHA_ESPORTES, d.esportes || [])}</div>
        <label class="field"><span>Outros esportes</span><input class="input" name="esportes_outros" value="${v('esportes_outros')}"></label>
        <label class="field"><span>Rotina de exercícios</span><textarea class="textarea" name="atividade">${v('atividade')}</textarea></label>
        <div class="field"><span>Condicionamento</span>${chk('nivel', FICHA_NIVEL, d.nivel, 'radio')}</div>
        <label class="field"><span>Experiência com corrida</span><select class="input" name="corrida_exp"><option value="">Selecione</option>${FICHA_EXP.map(([k, l]) => `<option value="${k}" ${d.corrida_exp === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="grid2"><label class="field"><span>Maior distância</span><input class="input" name="maior_dist" value="${v('maior_dist')}"></label><label class="field"><span>Tempo recente</span><input class="input" name="tempo_recente" value="${v('tempo_recente')}"></label></div>
        <label class="field"><span>Relógio</span><select class="input" name="relogio"><option value="">Selecione</option>${FICHA_RELOGIOS.map((x) => `<option ${d.relogio === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`,
      )}
      ${sec(
        'Histórico médico',
        `${FICHA_HIST.map((q, i) => `<div class="parq"><p>${q}</p>${sn('h' + (i + 1), h['h' + (i + 1)], true)}</div>`).join('')}
        <label class="field" style="margin-top:8px"><span>Observações médicas</span><textarea class="textarea" name="obs_medica">${v('obs_medica')}</textarea></label>`,
      )}
      ${sec(
        parqNome(pq),
        parqLista(pq)
          .map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1), pq['q' + (i + 1)])}</div>`)
          .join(''),
      )}
      ${sec(
        'Disponibilidade',
        `<div class="field"><span>${selo('corrida', 'sm')} Dias de corrida</span>${chk('d_corrida', diasOps, (dp.corrida || []).map(String))}</div>
        <div class="field"><span>${selo('forca', 'sm')} Dias de força</span>${chk('d_forca', diasOps, (dp.forca || []).map(String))}</div>
        <div class="field"><span>Melhor horário</span>${chk('horario', FICHA_HOR, d.horario || [])}</div>
        <div class="field"><span>Onde prefere treinar</span>${chk('local', FICHA_LOCAL, d.local || [])}</div>
        <label class="field"><span>Comentário</span><textarea class="textarea" name="disp_obs">${v('disp_obs')}</textarea></label>`,
      )}
      ${sec('Outros', `<div class="field"><span>Como conheceu a Nexos</span>${chk('origem', FICHA_ORIGEM, d.origem, 'radio')}</div><label class="field"><span>Comentário</span><textarea class="textarea" name="obs">${v('obs')}</textarea></label>`)}
      <button class="btn block" type="submit">Salvar alterações ${I.check}</button>
    </form>`,
    (root) => {
      const f = root.querySelector('#f-edf');
      aplicarMascaras(f);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(f);
        const btn = f.querySelector('[type=submit]');
        [
          'nome',
          'telefone',
          'email',
          'sexo',
          'altura',
          'peso',
          'cidade',
          'objetivo',
          'meta',
          'prova',
          'esportes_outros',
          'atividade',
          'nivel',
          'corrida_exp',
          'maior_dist',
          'tempo_recente',
          'relogio',
          'obs_medica',
          'disp_obs',
          'origem',
          'obs',
        ].forEach((k) => {
          const x = String(fd.get(k) || '').trim();
          if (x) d[k] = x.slice(0, 1500);
          else delete d[k];
        });
        const nas = String(fd.get('nascimento') || '').trim();
        if (nas) {
          const iso = dataISO(nas);
          if (!iso) return toast('Confira a data de nascimento (dd/mm/aaaa).', true);
          d.nascimento = iso;
        } else delete d.nascimento;
        ['modalidades', 'esportes', 'horario', 'local'].forEach((k) => {
          const x = fd.getAll(k);
          if (x.length) d[k] = x;
          else delete d[k];
        });
        if (!(d.modalidades || []).length) return toast('Marque corrida, musculação ou as duas.', true);
        d.disponibilidade = { corrida: fd.getAll('d_corrida').map(Number), forca: fd.getAll('d_forca').map(Number) };
        d.hist = {};
        FICHA_HIST.forEach((_, i) => {
          d.hist['h' + (i + 1)] = fd.get('h' + (i + 1)) || null;
        });
        {
          const L = parqLista(pq);
          d.parq = L === PARQ_PLUS ? { v: 'plus' } : {};
          L.forEach((_, i) => {
            d.parq['q' + (i + 1)] = fd.get('q' + (i + 1)) || null;
          });
        }
        btn.disabled = true;
        const { error } = await sb.from('nx_form_respostas').update({ dados: d }).eq('id', r.id);
        if (error) {
          btn.disabled = false;
          return toast('Não foi possível salvar a ficha.', true);
        }
        if (r.aluno_id) {
          // o cadastro do aluno acompanha
          const mods = (d.modalidades || []).filter((x) => x === 'corrida' || x === 'musculacao');
          const { data: mAnt } = await sb
            .from('nx_membros')
            .select('disponibilidade')
            .eq('org_id', S.org.id)
            .eq('user_id', r.aluno_id)
            .maybeSingle();
          const upd = {
            nome: d.nome || undefined,
            telefone: d.telefone || null,
            nascimento: d.nascimento || null,
            objetivo: d.meta || null,
            sexo: d.sexo === 'feminino' ? 'F' : d.sexo === 'masculino' ? 'M' : null,
            modalidades: mods.length ? mods : null,
            disponibilidade: {
              ...((mAnt && mAnt.disponibilidade) || {}),
              corrida: d.disponibilidade.corrida,
              forca: d.disponibilidade.forca,
              ...(d.disp_obs ? { obs: d.disp_obs } : {}),
            },
          };
          Object.keys(upd).forEach((k) => upd[k] === undefined && delete upd[k]);
          const { error: e2 } = await sb
            .from('nx_membros')
            .update(upd)
            .eq('org_id', S.org.id)
            .eq('user_id', r.aluno_id);
          if (e2) console.error(e2);
          const parq = d.parq && d.parq.v === 'plus' ? { v: 'plus' } : {};
          parqLista(d.parq).forEach((_, i) => {
            parq['q' + (i + 1)] = d.parq['q' + (i + 1)] || 'nao';
          });
          await sb
            .from('nx_anamneses')
            .update({ parq, parq_positivo: Object.values(parq).includes('sim') })
            .eq('org_id', S.org.id)
            .eq('aluno_id', r.aluno_id)
            .then(
              () => {},
              () => {},
            );
          S.cache.nomes = null;
        }
        closeSheet();
        toast(r.aluno_id ? 'Ficha e cadastro do aluno atualizados.' : 'Ficha atualizada.');
        aoSalvar && aoSalvar();
      };
    },
  );
}

async function staffFichaResposta(id) {
  const { data: r } = await sb.from('nx_form_respostas').select('*').eq('id', id).maybeSingle();
  dockStaff();
  if (!r) {
    $app.innerHTML = `<a class="back" href="#/formularios">${I.back} Formulários</a><div class="empty"><div class="h3">Ficha não encontrada</div></div>`;
    return;
  }
  if (!r.visto) {
    sb.from('nx_form_respostas')
      .update({ visto: true })
      .eq('id', id)
      .then(
        () => {},
        () => {},
      );
    S.cache.fichasNovas = Math.max(0, (S.cache.fichasNovas || 1) - 1);
  }
  const d = r.dados || {};
  const rs = fichaResumo(d);
  const mbr = r.aluno_id
    ? (
        await sb
          .from('nx_membros')
          .select('aprovacao,ativo')
          .eq('org_id', S.org.id)
          .eq('user_id', r.aluno_id)
          .maybeSingle()
      ).data
    : null;
  const pend = !!(d.email && (!r.aluno_id || (mbr && mbr.aprovacao === 'pendente')));
  const nome = (l, k) => (l.find((x) => x[0] === k) || [])[1] || '';
  const idade = d.nascimento ? Math.floor((Date.now() - dia(d.nascimento)) / 31557600000) : null;
  const lin = (t, v) => (v ? `<div class="ficha-l"><span>${t}</span><b>${v}</b></div>` : '');
  const lista = (arr, l) => (arr || []).map((k) => esc(l ? nome(l, k) || k : k)).join(', ');
  const tel = telWa(d.telefone);
  const dp = d.disponibilidade || {};
  const diasT = (l) =>
    (l || [])
      .slice()
      .sort()
      .map((i) => DSEM[i].slice(0, 3))
      .join(', ');
  $app.innerHTML = `<a class="back" href="#/formularios">${I.back} Formulários</a>
    <div class="card plan-head"><div class="ph-id"><div class="av lg">${esc(initials(d.nome || '?'))}</div><div class="grow" style="min-width:0"><h1 class="h2">${esc(d.nome || 'Sem nome')}</h1><div class="small muted">Ficha enviada ${fmtData(r.criado_em)}${rs.mods ? ' · ' + esc(rs.mods) : ''}</div></div></div>
      ${pend ? `<div class="aviso-acesso"><b>Esta pessoa ainda não tem acesso ao app.</b><span class="small muted">${r.aluno_id ? 'O pedido está esperando a sua aprovação.' : 'Ela mandou a ficha, mas não chegou a pedir o acesso.'}</span><button class="btn block" id="ap-acesso" style="margin-top:12px">${I.check} Aprovar acesso</button></div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" id="ed-ficha">✎ Editar ficha</button>${r.aluno_id ? `<a class="btn ghost sm" href="#/aluno/${r.aluno_id}">Ver aluno ${I.chev}</a>` : ''}</div></div>
    ${rs.sim.length ? `<div class="card ficha-alerta"><b>${icT(I.alerta, 'warn')}PAR-Q com ${rs.sim.length} resposta${rs.sim.length > 1 ? 's' : ''} SIM</b>${rs.sim.map(([n, q]) => `<p class="small">${n}. ${esc(q.replace(/\s*<small[^>]*>[\s\S]*?<\/small>/, ''))}</p>`).join('')}<p class="tiny dim">Peça liberação médica antes de começar.</p></div>` : ''}
    <div class="grid2" style="margin-top:12px">${tel ? `<a class="btn wa-btn" href="https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${firstName(d.nome || '')}! Aqui é da Nexos Recebemos sua ficha.`)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>` : ''}${r.aluno_id || pend ? '' : `<button class="btn ${tel ? 'ghost' : ''}" id="cadastrar">${I.plus} Cadastrar como aluno</button>`}</div>
    <div class="stack" style="margin-top:16px">
      <div class="card"><span class="eyebrow">Contato</span>${lin('WhatsApp', esc(d.telefone || ''))}${lin('E-mail', esc(d.email || ''))}${lin('Nascimento', d.nascimento ? fmtData(d.nascimento + 'T12:00:00') + (idade != null ? ` · ${idade} anos` : '') : '')}${lin(
        'Sexo',
        esc(
          nome(
            [
              ['feminino', 'Feminino'],
              ['masculino', 'Masculino'],
              ['nao_informar', 'Prefere não dizer'],
            ],
            d.sexo,
          ),
        ),
      )}${lin('Altura e peso', esc([d.altura && d.altura + ' m', d.peso && d.peso + ' kg'].filter(Boolean).join(' · ')))}${lin('Bairro / cidade', esc(d.cidade || ''))}</div>
      <div class="card"><span class="eyebrow">Objetivo</span>${lin('Quer treinar', esc(rs.mods))}${lin('Objetivo', esc(rs.obj))}${lin('Objetivos pessoais', esc(d.meta || ''))}${lin('Prova em vista', esc(d.prova || ''))}</div>
      <div class="card"><span class="eyebrow">Disponibilidade</span>${lin(selo('corrida', 'sm') + ' Corrida', diasT(dp.corrida))}${lin(selo('forca', 'sm') + ' Força', diasT(dp.forca))}${lin('Horário', lista(d.horario, FICHA_HOR))}${lin('Local', lista(d.local, FICHA_LOCAL))}${lin('Comentário', esc(d.disp_obs || ''))}</div>
      <div class="card"><span class="eyebrow">Histórico esportivo</span>${lin('Esportes', lista(d.esportes, FICHA_ESPORTES) + (d.esportes_outros ? ` (${esc(d.esportes_outros)})` : ''))}${lin('Rotina', esc(d.atividade || ''))}${lin('Condicionamento', esc(nome(FICHA_NIVEL, d.nivel)))}${lin('Corrida', esc(nome(FICHA_EXP, d.corrida_exp)))}${lin('Maior distância', esc(d.maior_dist || ''))}${lin('Tempo recente', esc(d.tempo_recente || ''))}${lin('Relógio', esc(d.relogio || ''))}</div>
      ${d.desemp ? desempHTML(d.desemp, r.aluno_id) : ''}
      <div class="card"><span class="eyebrow">Histórico médico</span>${rs.histSim.length ? rs.histSim.map(([q, v]) => lin(esc(q), v === 'sim' ? '<span style="color:var(--err)">Sim</span>' : 'Não sei')).join('') : lin('Respostas', 'Tudo “não”')}${lin('Observações', esc(d.obs_medica || ''))}${lin('PAR-Q', rs.sim.length ? `<span style="color:var(--err)">${rs.sim.length} sim</span>` : 'Tudo “não”')}</div>
      ${d.origem || d.obs ? `<div class="card"><span class="eyebrow">Outros</span>${lin('Conheceu por', esc(nome(FICHA_ORIGEM, d.origem)))}${lin('Comentário', esc(d.obs || ''))}</div>` : ''}
      <p class="tiny dim">✓ Aceitou o termo de responsabilidade ao enviar.</p>
      ${d.adesao && d.adesao.aceite ? `<p class="tiny dim">✓ Aceitou o Termo de Adesão (versão ${esc(d.adesao.versao || '')}) em ${d.adesao.aceito_em ? esc(new Date(d.adesao.aceito_em).toLocaleString('pt-BR')) : ''}${d.adesao.plano ? ': ' + esc(planoCombinadoTxt(d.adesao.plano)) : ''}.</p>` : ''}
      <button class="link-btn small" id="apagar" style="color:var(--err);justify-self:start">Apagar esta ficha</button>
    </div>`;
  const cad = document.getElementById('cadastrar');
  if (cad)
    cad.onclick = () => {
      const saude = [
        rs.histSim
          .filter(([, v]) => v === 'sim')
          .map(([q]) => q.replace(/\?$/, ''))
          .join('; '),
        d.obs_medica,
        rs.sim.length ? `PAR-Q com ${rs.sim.length} sim` : '',
      ]
        .filter(Boolean)
        .join('. ');
      formPessoa(
        'aluno',
        {
          nome: d.nome,
          email: d.email,
          telefone: d.telefone,
          nascimento: d.nascimento,
          objetivo: d.meta || rs.obj,
          observacoes: saude,
          mods: d.modalidades,
        },
        async (res) => {
          if (!res || !res.user_id) return;
          await sb.from('nx_form_respostas').update({ aluno_id: res.user_id }).eq('id', id);
          if (dp.corrida || dp.forca)
            await sb
              .from('nx_membros')
              .update({
                disponibilidade: { corrida: dp.corrida || [], forca: dp.forca || [], obs: d.disp_obs || undefined },
              })
              .eq('org_id', S.org.id)
              .eq('user_id', res.user_id);
          // a ficha já vale como anamnese: o aluno não responde o PAR-Q de novo no primeiro acesso
          try {
            const h = d.hist || {};
            const simH = (k) => h[k] === 'sim';
            const parq = d.parq && d.parq.v === 'plus' ? { v: 'plus' } : {};
            parqLista(d.parq).forEach((_, i) => {
              parq['q' + (i + 1)] = (d.parq || {})['q' + (i + 1)] || 'nao';
            });
            const resp = {
              origem: 'ficha_entrada',
              objetivo: d.objetivo,
              objetivo_txt: d.meta,
              experiencia: {
                sedentario: 'parado',
                iniciante: 'iniciante',
                intermediario: 'intermediario',
                avancado: 'avancado',
                profissional: 'avancado',
              }[d.nivel],
              atividades: [lista(d.esportes, FICHA_ESPORTES), d.atividade].filter(Boolean).join(' · ') || undefined,
              dias: String(new Set([...(dp.corrida || []), ...(dp.forca || [])]).size || '') || undefined,
              prova: d.prova,
              doencas: [],
              doencas_txt:
                [
                  rs.histSim.map(([q, v]) => q.replace(/\?$/, '') + (v === 'naosei' ? ' (não sabe)' : '')).join('; '),
                  d.obs_medica,
                ]
                  .filter(Boolean)
                  .join('. ') || undefined,
              cirurgias: simH('h4') ? 'Sim (ver detalhes)' : undefined,
              alergias: simH('h5') ? 'Sim (ver detalhes)' : undefined,
              lesoes: simH('h6') ? 'Sim (ver detalhes)' : undefined,
              medicamentos: simH('h7') ? 'Sim (ver detalhes)' : undefined,
              dores: simH('h9') ? 'Sim (ver detalhes)' : undefined,
              fuma: h.h8 === 'sim' ? 'sim' : h.h8 === 'nao' ? 'nao' : undefined,
            };
            Object.keys(resp).forEach((k) => resp[k] === undefined && delete resp[k]);
            const { data: ja } = await sb
              .from('nx_anamneses')
              .select('id')
              .eq('org_id', S.org.id)
              .eq('aluno_id', res.user_id)
              .maybeSingle();
            if (!ja)
              await sb.from('nx_anamneses').insert({
                org_id: S.org.id,
                aluno_id: res.user_id,
                parq,
                parq_positivo: Object.values(parq).includes('sim'),
                respostas: resp,
                visto_treinador: true,
              });
          } catch (e2) {
            console.error(e2);
          }
        },
      );
    };
  document.getElementById('ed-ficha').onclick = () => editarFicha(r, () => staffFichaResposta(id));
  const apA = document.getElementById('ap-acesso');
  if (apA)
    apA.onclick = async () => {
      apA.disabled = true;
      apA.textContent = 'Criando o acesso…';
      try {
        let alunoId = r.aluno_id;
        if (!alunoId) {
          // cria o pedido como se a pessoa tivesse pedido no fim da ficha
          const { data: fm } = await sb.from('nx_formularios').select('token').eq('id', r.form_id).maybeSingle();
          if (!fm) throw new Error('O link desta ficha não existe mais.');
          await chamarForm({ acao: 'criar_acesso', token: fm.token, resposta: r.id });
          const { data: r2 } = await sb.from('nx_form_respostas').select('aluno_id').eq('id', r.id).maybeSingle();
          alunoId = r2 && r2.aluno_id;
          if (!alunoId) throw new Error('Não foi possível criar o acesso.');
        }
        const { data: res, error: er } = await sb.functions.invoke('nx-email', {
          body: { org_id: S.org.id, acao: 'aprovar', aluno_id: alunoId },
        });
        if (er || !res || res.erro) throw new Error((res && res.erro) || 'Não foi possível aprovar agora.');
        S.cache.nomes = null;
        S.cache.pendentes = Math.max(0, (S.cache.pendentes || 1) - 1);
        if (res.enviado) toast(`Acesso aprovado! O login foi para ${res.email}.`);
        else if (res.senha)
          mostrarCredenciais(
            { nome: d.nome, telefone: d.telefone, email: res.email, senha: res.senha },
            false,
            true,
            'acesso',
          );
        else toast('Acesso aprovado! Já pode entrar no app com a senha que criou.');
        staffFichaResposta(id);
      } catch (e) {
        apA.disabled = false;
        apA.innerHTML = `${I.check} Aprovar acesso`;
        toast(e.message, true);
      }
    };
  document.getElementById('apagar').onclick = async () => {
    if (!confirm('Apagar esta ficha? Não dá para desfazer.')) return;
    await sb.from('nx_form_respostas').delete().eq('id', id);
    location.hash = '#/formularios';
  };
}

/* ================= VIDEOCHAMADA (Daily, sala privada criada pela função nx-video) ================= */
const DAILY_JS = 'https://unpkg.com/@daily-co/daily-js@0.93.0/dist/daily.js';
let dailyP = null;
const carregarDaily = () =>
  (dailyP =
    dailyP ||
    new Promise((res, rej) => {
      if (window.DailyIframe) return res(window.DailyIframe);
      const s = document.createElement('script');
      s.src = DAILY_JS;
      s.onload = () => (window.DailyIframe ? res(window.DailyIframe) : rej(new Error('vazio')));
      s.onerror = () => {
        dailyP = null;
        rej(new Error('Não foi possível carregar a videochamada. Verifique a internet e tente de novo.'));
      };
      document.head.appendChild(s);
    }));
async function funcaoVideo(body) {
  const { data, error } = await sb.functions.invoke('nx-video', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let msg = 'Não foi possível abrir a videochamada. Tente de novo.';
    try {
      const j = await error.context.json();
      if (j?.erro) msg = j.erro;
    } catch {}
    throw new Error(msg);
  }
  if (data?.erro && !data.encerrada) throw new Error(data.erro);
  return data;
}
let chamadaAtual = null;
// abre a sala por cima de tudo; quando a equipe sai, a chamada é encerrada e a duração fica registrada
async function abrirSalaVideo(d, { staff = false, equipe = false, titulo = 'Videochamada', extra = '' } = {}) {
  const Daily = await carregarDaily();
  await fecharSalaVideo(false);
  const box = document.createElement('div');
  box.className = 'video-sala';
  box.innerHTML = `<div class="video-top"><b class="grow">${esc(titulo)}</b>${extra}<button type="button" class="btn sm ghost" id="vs-sair">${staff && !equipe ? 'Encerrar' : 'Sair'}</button></div><div class="video-frame"></div>`;
  document.body.appendChild(box);
  document.body.classList.add('em-video');
  const call = Daily.createFrame(box.querySelector('.video-frame'), {
    showLeaveButton: false,
    showFullscreenButton: true,
    lang: 'pt-BR',
    iframeStyle: { width: '100%', height: '100%', border: '0' },
  });
  chamadaAtual = { id: d.id, call, box, staff, equipe };
  call.on('left-meeting', () => fecharSalaVideo(true));
  box.querySelector('#vs-sair').onclick = () => fecharSalaVideo(true);
  try {
    await call.join({ url: d.url, token: d.token });
  } catch (e) {
    await fecharSalaVideo(false);
    const cod = String((e && (e.errorMsg || e.message)) || '');
    if (cod.includes('payment-method'))
      throw new Error(
        'A videochamada ainda não está liberada: a conta do Daily precisa de um cartão cadastrado (o uso continua grátis até 10.000 minutos por mês).',
      );
    throw new Error('Não foi possível entrar na videochamada. Confira a internet e a permissão da câmera.');
  }
}
async function fecharSalaVideo(encerrar) {
  const c = chamadaAtual;
  if (!c) return;
  chamadaAtual = null;
  // sala da equipe ou entre professores: só fecha quando o último sai
  let outros = 0;
  try {
    outros = Object.keys(c.call.participants() || {}).filter((k) => k !== 'local').length;
  } catch {}
  if (c.equipe && outros) encerrar = false;
  // a tela sai na hora; a chamada fecha por trás (no celular o Daily às vezes demora para responder)
  c.box.remove();
  document.body.classList.remove('em-video');
  (async () => {
    try {
      await Promise.race([c.call.leave(), new Promise((r) => setTimeout(r, 3000))]);
    } catch {}
    try {
      await c.call.destroy();
    } catch {}
  })();
  if (c.staff && encerrar) {
    await funcaoVideo({ acao: 'encerrar', id: c.id }).catch(() => {});
    window.dispatchEvent(new Event('nx:video-fim'));
  }
}
// treinador: chama o aluno (ele recebe a notificação) e entra na sala
async function iniciarVideochamada(m, btn) {
  if (btn) btn.disabled = true;
  try {
    const d = await funcaoVideo({ acao: 'criar', aluno_id: m.user_id });
    const link = `${location.origin}/app/#/chamada/${d.id}`;
    const tel = String(m.telefone || '').replace(/\D/g, '');
    const txt = `Oi, ${firstName(m.nome)}! Estou te esperando na videochamada da Nexos. Toque para entrar: ${link}`;
    const wa = tel
      ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${tel.length <= 11 ? '55' + tel : tel}?text=${encodeURIComponent(txt)}">Mandar link no WhatsApp</a>`
      : '';
    if (!d.avisados)
      toast(
        `${firstName(m.nome)} não tem as notificações ativas. ${tel ? 'Mande o link pelo WhatsApp (botão no alto da chamada).' : 'Avise por mensagem para ele abrir o app.'}`,
        true,
      );
    else toast(`${firstName(m.nome)} foi avisado pelo app.`);
    await abrirSalaVideo(d, { staff: true, titulo: `Videochamada com ${firstName(m.nome)}`, extra: wa });
  } catch (e) {
    toast(e.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}
// aluno (ou equipe) abrindo pelo aviso: #/chamada/<id>
async function viewChamada(id) {
  $app.innerHTML = `<section class="card" style="margin-top:24px;text-align:center"><span class="eyebrow">Videochamada</span><h1 class="h2" style="margin-top:6px">Entrando na videochamada</h1><p class="small muted" id="ch-msg" style="margin-top:8px">Quando aparecer, permita o uso da câmera e do microfone.</p><button class="btn" id="ch-entrar" style="margin-top:16px" hidden>Entrar</button><a class="btn ghost" href="#/" style="margin-top:10px">Voltar ao início</a></section>`;
  const msg = document.getElementById('ch-msg'),
    bt = document.getElementById('ch-entrar');
  const tentar = async () => {
    bt.hidden = true;
    try {
      const d = await funcaoVideo({ acao: 'entrar', id });
      if (d.encerrada) {
        msg.textContent = 'Esta videochamada já terminou. Se o treinador ainda quiser falar, ele chama de novo.';
        return;
      }
      await abrirSalaVideo(d, {
        staff: S.staff,
        equipe: d.tipo === 'equipe' || d.tipo === 'professor',
        titulo: d.tipo === 'equipe' ? 'Videochamada da equipe' : S.staff ? 'Videochamada' : 'Videochamada com a Nexos',
      });
    } catch (e) {
      msg.textContent = e.message;
      bt.hidden = false;
    }
  };
  bt.onclick = tentar;
  tentar();
}
// cartão na Hoje do aluno quando o treinador está chamando (para quem não viu a notificação)
async function cartaoChamadaAtiva() {
  const el = document.getElementById('cham-ativa');
  if (!el || S.staff) return;
  const { data } = await sb
    .from('nx_chamadas')
    .select('id,criado_em')
    .eq('aluno_id', S.user.id)
    .is('encerrada_em', null)
    .gte('criado_em', new Date(Date.now() - 30 * 60e3).toISOString())
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  if (!data || !data[0] || !document.getElementById('cham-ativa')) return;
  el.innerHTML = `<a class="card cham-ativa" href="#/chamada/${data[0].id}"><span class="go">${I.user}</span><div class="grow"><b>Seu treinador está te chamando</b><p class="small muted">Videochamada da Nexos. Toque para entrar.</p></div>${I.chev}</a>`;
}
// ficha do aluno: a última videochamada (data e duração)
async function linhaUltimaChamada(alunoId) {
  const el = document.getElementById('ficha-cham');
  if (!el) return;
  const { data } = await sb
    .from('nx_chamadas')
    .select('criado_em,atendida_em,encerrada_em')
    .eq('aluno_id', alunoId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const c = data && data[0];
  if (!c || !document.getElementById('ficha-cham')) return;
  const min = c.atendida_em && c.encerrada_em ? Math.max(1, minutos(c.atendida_em, c.encerrada_em)) : null;
  el.innerHTML = `<span class="tag">Última videochamada ${fmtCurto(c.criado_em)}${min ? ` · ${min} min` : c.atendida_em ? '' : ' · não atendida'}</span>`;
}

// videochamada com outro professor: só ele é avisado
async function ligarProfessor(m, btn) {
  if (btn) btn.disabled = true;
  try {
    const d = await funcaoVideo({ acao: 'professor', para: m.user_id });
    const tel = String(m.telefone || '').replace(/\D/g, '');
    const link = `${location.origin}/treinador/#/chamada/${d.id}`;
    const wa = tel
      ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${tel.length <= 11 ? '55' + tel : tel}?text=${encodeURIComponent(`${firstName(m.nome)}, estou te esperando na videochamada: ${link}`)}">Mandar link no WhatsApp</a>`
      : '';
    toast(
      d.avisados
        ? `${firstName(m.nome)} foi avisado pelo app.`
        : `${firstName(m.nome)} não tem as notificações ativas.${tel ? ' Mande o link pelo WhatsApp (botão no alto da chamada).' : ''}`,
      !d.avisados,
    );
    await abrirSalaVideo(d, { staff: true, equipe: true, titulo: `Videochamada com ${firstName(m.nome)}`, extra: wa });
  } catch (e) {
    toast(e.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}
// chamadas abertas que envolvem a equipe (para voltar a entrar ou atender)
async function chamadasAbertas() {
  const { data } = await sb
    .from('nx_chamadas')
    .select('id,tipo,aluno_id,treinador_id,convidado_id,criado_em')
    .eq('org_id', S.org.id)
    .is('encerrada_em', null)
    .gt('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: false })
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  return (data || []).filter(
    (c) =>
      c.tipo === 'equipe' ||
      c.treinador_id === S.user.id ||
      c.convidado_id === S.user.id ||
      (c.tipo === 'aluno' && c.treinador_id === S.user.id),
  );
}
// no Mais: avisa quando alguém está te chamando ou há chamada sua aberta
async function statusVideoEquipe() {
  const el = document.getElementById('mais-video-st');
  if (!el) return;
  const l = await chamadasAbertas();
  if (!l.length || !document.getElementById('mais-video-st')) return;
  el.innerHTML = l.some((c) => c.convidado_id === S.user.id)
    ? '<span class="tag acc">Estão te chamando: toque para entrar</span>'
    : '<span class="tag acc">Chamada em andamento</span>';
}
// tela de videochamadas: professores e alunos para ligar, chamadas abertas e minutos do mês
async function staffVideochamadas() {
  loading();
  const [{ data: ms }, abertas, semNot] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,papel,treinador_id,telefone,ativo')
      .eq('org_id', S.org.id)
      .eq('ativo', true)
      .order('nome'),
    chamadasAbertas(),
    sb.rpc('nx_sem_notificacao', { p_org: S.org.id }).then(
      (r) => r.data || [],
      () => [],
    ),
  ]);
  const todos = ms || [];
  const nome = Object.fromEntries(todos.map((m) => [m.user_id, m]));
  const profs = todos.filter((m) => (m.papel === 'admin' || m.papel === 'treinador') && m.user_id !== S.user.id);
  const alunos = todos.filter((m) => m.papel === 'aluno' && ehMeuAluno(m));
  const semPush = new Set(semNot);
  const linha = (m, tipo) =>
    `<div class="list-item vc-l" data-nome="${esc(semAcento(m.nome || ''))}">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome || '')}</b><span data-pres="${m.user_id}"></span>${tipo === 'a' && semPush.has(m.user_id) ? `<div class="tiny dim">Sem notificação: o app mostra o botão de mandar o link no WhatsApp</div>` : ''}</div><button type="button" class="btn sm" data-lig="${tipo}:${m.user_id}">${I.cam} Ligar</button></div>`;
  const descAberta = (c) =>
    c.tipo === 'equipe'
      ? 'Sala da equipe'
      : c.tipo === 'professor'
        ? c.convidado_id === S.user.id
          ? `${esc(firstName((nome[c.treinador_id] || {}).nome || 'Professor'))} está te chamando`
          : `Com ${esc(firstName((nome[c.convidado_id] || {}).nome || 'professor'))}`
        : `Com ${esc(firstName((nome[c.aluno_id] || {}).nome || 'aluno'))}`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Equipe e comunicação</p><h1 class="h1">Videochamadas</h1>
    <p class="small muted" style="margin-top:6px">Toque em <b>Ligar</b>: a pessoa recebe a notificação e entra pelo aviso. A data e a duração das chamadas com alunos ficam na ficha.</p>
    <p class="tiny dim" id="mais-video-uso" style="margin-top:6px"></p>
    ${abertas.length ? `<p class="sec-lbl">Em andamento</p><div class="stack">${abertas.map((c) => `<a class="list-item" href="#/chamada/${c.id}" style="color:inherit"><span class="ativ-ic">${I.cam}</span><div class="grow"><b>${descAberta(c)}</b><div class="small muted">Toque para entrar</div></div>${I.chev}</a>`).join('')}</div>` : ''}
    <p class="sec-lbl">Professores</p><div class="stack" id="vc-p">${profs.map((m) => linha(m, 'p')).join('') || '<div class="empty"><p class="small">Nenhum outro professor na equipe.</p></div>'}</div>
    <p class="sec-lbl">Alunos</p>${alunos.length > 6 ? '<input class="input" id="vc-busca" placeholder="Buscar aluno pelo nome" style="margin-bottom:10px">' : ''}<div class="stack" id="vc-a">${alunos.map((m) => linha(m, 'a')).join('') || '<div class="empty"><p class="small">Nenhum aluno ativo.</p></div>'}</div>`;
  usoVideoMais();
  vigiarPresenca();
  $app.onclick = (e) => {
    const b = e.target.closest('[data-lig]');
    if (!b) return;
    const [t, id] = b.dataset.lig.split(':'),
      m = nome[id];
    if (m) (t === 'p' ? ligarProfessor : iniciarVideochamada)(m, b);
  };
  const busca = document.getElementById('vc-busca');
  if (busca)
    busca.oninput = () => {
      const q = semAcento(busca.value.trim());
      document.querySelectorAll('#vc-a .vc-l').forEach((x) => (x.hidden = !!q && !x.dataset.nome.includes(q)));
    };
  window.addEventListener('nx:video-fim', () => location.hash === '#/videochamadas' && staffVideochamadas(), {
    once: true,
  });
}
// no Mais: minutos usados no ciclo do Daily (10.000 grátis por mês, cada pessoa na chamada conta)
async function usoVideoMais() {
  const el = document.getElementById('mais-video-uso');
  if (!el) return;
  const u = await funcaoVideo({ acao: 'uso' }).catch(() => null);
  if (!u || u.minutos == null || !document.getElementById('mais-video-uso')) return;
  const pct = u.minutos / u.limite;
  el.innerHTML = `Neste ciclo: ${u.minutos.toLocaleString('pt-BR')} de ${u.limite.toLocaleString('pt-BR')} minutos grátis${pct >= 1 ? ' <span class="tag err">Cobrando</span>' : pct >= 0.8 ? ' <span class="tag warn">Perto do limite</span>' : ''}`;
}

/* ---------- chamada recebida: tela cheia de ligação enquanto o app está aberto ---------- */
let escutaChamT = null;
const chamRecusadas = new Set();
function escutarChamadas() {
  if (escutaChamT || !S.user || !S.org) return;
  const ver = () => document.visibilityState === 'visible' && verChamadaRecebida();
  escutaChamT = setInterval(ver, 12000);
  document.addEventListener('visibilitychange', ver);
  ver();
}
async function verChamadaRecebida() {
  if (chamadaAtual || document.querySelector('.cham-toca') || !S.user) return;
  let q = sb
    .from('nx_chamadas')
    .select('id,tipo,treinador_id,criado_em')
    .is('encerrada_em', null)
    .is('atendida_em', null)
    .gte('criado_em', new Date(Date.now() - 3 * 60e3).toISOString())
    .order('criado_em', { ascending: false })
    .limit(3);
  q = S.staff ? q.eq('convidado_id', S.user.id) : q.eq('aluno_id', S.user.id);
  const { data } = await q.then(
    (r) => r,
    () => ({ data: [] }),
  );
  const c = (data || []).find((x) => !chamRecusadas.has(x.id));
  if (!c || location.hash === '#/chamada/' + c.id || chamadaAtual || document.querySelector('.cham-toca')) return;
  const { data: quem } = await sb
    .from('nx_membros')
    .select('nome,foto_url')
    .eq('org_id', S.org.id)
    .eq('user_id', c.treinador_id)
    .maybeSingle()
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  tocarChamada(c, quem || {});
}
// toque de ligação (dois bipes a cada 2,5 s); devolve a função que para o som
function tocarToque() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let parar = false;
    const bip = () => {
      if (parar) return;
      [0, 0.45].forEach((t) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          t0 = ctx.currentTime + t;
        o.frequency.value = 880;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
        o.start(t0);
        o.stop(t0 + 0.4);
      });
    };
    ctx.resume().catch(() => {});
    bip();
    const t = setInterval(bip, 2500);
    return () => {
      parar = true;
      clearInterval(t);
      ctx.close().catch(() => {});
    };
  } catch {
    return () => {};
  }
}
function tocarChamada(c, quem) {
  const nome = firstName(quem.nome) || (S.staff ? 'Um professor' : 'Seu treinador');
  const box = document.createElement('div');
  box.className = 'cham-toca';
  box.innerHTML = `<div class="ct-in"><div class="ct-av"><i></i><i></i>${avAluno({ ...quem, nome: quem.nome || nome }, 'lg')}</div>
    <p class="eyebrow">${c.tipo === 'aluno' ? 'Videochamada da Nexos' : 'Videochamada'}</p><h1 class="h1">${esc(nome)} está te chamando</h1>
    <div class="ct-bts"><button type="button" class="ct-nao" id="ct-nao"><span>${I.x}</span>Agora não</button><button type="button" class="ct-sim" id="ct-sim"><span>${I.cam}</span>Atender</button></div></div>`;
  document.body.appendChild(box);
  const pararSom = tocarToque();
  // o navegador só deixa vibrar depois que a pessoa já tocou na tela
  const podeVibrar = () => navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive);
  const vibra = () => podeVibrar() && navigator.vibrate([700, 300, 700]);
  vibra();
  const vib = setInterval(vibra, 2500);
  const fim = setTimeout(() => fechar(), 90e3);
  // se quem ligou desistir, a tela some
  const conf = setInterval(async () => {
    const { data } = await sb
      .from('nx_chamadas')
      .select('encerrada_em')
      .eq('id', c.id)
      .maybeSingle()
      .then(
        (r) => r,
        () => ({ data: {} }),
      );
    if (!data || data.encerrada_em) fechar();
  }, 5000);
  function fechar() {
    clearTimeout(fim);
    clearInterval(vib);
    clearInterval(conf);
    pararSom();
    if (podeVibrar()) navigator.vibrate(0);
    box.remove();
  }
  box.querySelector('#ct-sim').onclick = () => {
    fechar();
    if (location.hash === '#/chamada/' + c.id) viewChamada(c.id);
    else location.hash = '#/chamada/' + c.id;
  };
  box.querySelector('#ct-nao').onclick = () => {
    chamRecusadas.add(c.id);
    fechar();
    funcaoVideo({ acao: 'recusar', id: c.id }).catch(() => {});
  };
}

/* ---------- presença: Online (app na tela), Ausente (app minimizado ou sem sinal há pouco), Offline ---------- */
let presT = null;
function iniciarPresenca() {
  if (presT || !S.user) return;
  const marca = (e) =>
    sb.rpc('nx_presenca_marcar', { p_estado: e }).then(
      () => {},
      () => {},
    );
  const agora = () => marca(document.visibilityState === 'visible' ? 'online' : 'ausente');
  agora();
  presT = setInterval(() => document.visibilityState === 'visible' && marca('online'), 30000);
  document.addEventListener('visibilitychange', agora);
  window.addEventListener('pagehide', () => marca('ausente'));
}
const PRES_ON = 75e3,
  PRES_AUS = 20 * 60e3;
function haTempo(d) {
  const m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60e3));
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const dd = Math.round(h / 24);
  return `há ${dd} dia${dd > 1 ? 's' : ''}`;
}
function presencaDe(p) {
  if (!p) return { k: 'off', t: 'Offline' };
  const dt = Date.now() - new Date(p.visto_em).getTime();
  if (p.estado === 'online' && dt < PRES_ON) return { k: 'on', t: 'Online' };
  if (dt < PRES_AUS) return { k: 'aus', t: 'Ausente' };
  return { k: 'off', t: `Offline · visto ${haTempo(p.visto_em)}` };
}
// preenche todos os [data-pres="user_id"] da tela e atualiza a cada 20 s enquanto a tela estiver aberta
async function vigiarPresenca() {
  clearInterval(S.presVer);
  const preencher = async () => {
    const els = [...document.querySelectorAll('[data-pres]')];
    if (!els.length) return clearInterval(S.presVer);
    const ids = [...new Set(els.map((e) => e.dataset.pres))];
    const { data } = await sb
      .from('nx_presenca')
      .select('user_id,estado,visto_em')
      .in('user_id', ids)
      .then(
        (r) => r,
        () => ({ data: null }),
      );
    if (!data) return;
    const por = Object.fromEntries(data.map((p) => [p.user_id, p]));
    els.forEach((el) => {
      const s = presencaDe(por[el.dataset.pres]);
      el.className = `pres pres-${s.k}`;
      el.innerHTML = `<i></i>${(el.dataset.presPre || '') + s.t}`;
    });
  };
  await preencher();
  S.presVer = setInterval(preencher, 20000);
}
