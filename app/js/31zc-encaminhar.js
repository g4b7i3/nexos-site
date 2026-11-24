/* Nexos App · Acrescentar modalidade com outro treinador e Relatório para entrevista.
   O aluno não sai de ninguém: quem faz corrida ganha a força com outro treinador (ou o contrário), o app marca a
   modalidade nova, avisa o treinador que entrou e monta a ficha do aluno (tudo o que ele já respondeu e fez no app)
   para a entrevista, com PDF para baixar. Sem formulário novo: usa a ficha de entrada, a anamnese e o histórico. */
'use strict';

const ENC_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M19 8v6M16 11h6"/></svg>';
const ENC_AREA = { musculacao: 'força', corrida: 'corrida' };

/* ---------- dados da ficha ---------- */
async function fichaEntrevistaDados(alunoId) {
  const lista = (q) =>
    q.then(
      (r) => r.data || [],
      () => [],
    );
  const d30 = isoDia(new Date(Date.now() - 30 * 864e5));
  const [mb, fichas, anas, mulher, prs, corrs, eq] = await Promise.all([
    sb
      .from('nx_membros')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
    lista(
      sb
        .from('nx_form_respostas')
        .select('dados,criado_em')
        .eq('aluno_id', alunoId)
        .order('criado_em', { ascending: false })
        .limit(1),
    ),
    lista(
      sb.from('nx_anamneses').select('parq,respostas,parq_positivo,atualizado_em').eq('aluno_id', alunoId).limit(1),
    ),
    lista(sb.from('nx_saude_mulher').select('energia,pelvico').eq('aluno_id', alunoId).limit(1)),
    lista(
      sb
        .from('nx_prontidao')
        .select('dia,total,sono,dor_locais')
        .eq('aluno_id', alunoId)
        .gte('dia', d30)
        .order('dia', { ascending: false }),
    ),
    lista(
      sb
        .from('nx_corridas')
        .select('data,tipo,distancia_m,dor,dor_local')
        .eq('aluno_id', alunoId)
        .gte('data', d30)
        .order('data', { ascending: false }),
    ),
    carregarEquipe().catch(() => []),
  ]);
  return { m: mb, ficha: fichas[0] || null, ana: anas[0] || null, mulher: mulher[0] || null, prs, corrs, eq };
}

/** folha da ficha (usa cores fixas de papel, para o PDF sair igual no tema claro e no escuro) */
function fichaEntrevistaHTML(D, enc) {
  const m = D.m || {},
    f = (D.ficha && D.ficha.dados) || {},
    an = (D.ana && D.ana.respostas) || {};
  const nomeL = (l, k) => (l.find((x) => x[0] === k) || [])[1] || k || '';
  const lista = (arr, l) => (arr || []).map((k) => nomeL(l, k)).join(', ');
  const nomeEq = (id) => ((D.eq || []).find((p) => p.user_id === id) || {}).nome || '';
  const rs = fichaResumo({ ...f, parq: f.parq || (D.ana && D.ana.parq) });
  const nasc = m.nascimento || f.nascimento;
  const idade = nasc ? Math.floor((Date.now() - dia(nasc)) / 31557600000) : null;
  const dp = m.disponibilidade || f.disponibilidade || {};
  const dias = (l) =>
    (l || [])
      .slice()
      .sort()
      .map((i) => DSEM[i].slice(0, 3))
      .join(', ');
  const alt = parseFloat(String(f.altura || an.altura || '').replace(',', '.')),
    peso = parseFloat(String(f.peso || an.peso || '').replace(',', '.'));
  const imc = alt > 1 && peso > 20 ? (peso / (alt * alt)).toFixed(1).replace('.', ',') : '';
  const lin = (t, v) => (v ? `<div class="fe-l"><span>${t}</span><b>${v}</b></div>` : '');
  const sec = (t, corpo) => (corpo.trim() ? `<section class="fe-sec"><h3>${t}</h3>${corpo}</section>` : '');
  const mods = (m.modalidades || []).map((k) => ENC_AREA[k] || k);
  // no app até agora
  const prs = D.prs || [],
    cs = (D.corrs || []).filter((c) => c.tipo !== 'caminhada');
  const kmCs = cs.reduce((a, c) => a + (c.distancia_m || 0), 0) / 1000;
  const mediaPr = prs.length ? prs.reduce((a, p) => a + (+p.total || 0), 0) / prs.length : null;
  const dores = [
    ...new Set([
      ...prs.flatMap((p) => (p.dor_locais || []).map(nomeRegDor)),
      ...(D.corrs || []).filter((c) => c.dor && c.dor_local).map((c) => c.dor_local),
    ]),
  ];
  const energia = D.mulher && D.mulher.energia;
  // roteiro da entrevista de início: por modalidade, pelo que a ficha respondeu e pelo que ela pede para aprofundar
  const area = enc && enc.area;
  const ds = f.desemp || null;
  const A = ds && typeof analisarDesemp === 'function' ? analisarDesemp(ds) : null;
  const roteiro = roteiroEntrevista({ m, f, an, rs, dores, area, ds });
  const hoje = new Date().toLocaleDateString('pt-BR');
  return `<div class="fe-folha">
    <header class="fe-cab"><img src="icons/wordmark-escuro.svg" alt="Nexos Performance e Saúde"><div><b>Relatório para entrevista</b><span>${hoje}</span></div></header>
    <div class="fe-id"><div><h1>${esc(m.nome || f.nome || 'Aluno')}</h1><p>${[idade != null ? `${idade} anos` : '', m.sexo === 'F' ? 'feminino' : m.sexo === 'M' ? 'masculino' : '', m.matricula ? `matrícula ${m.matricula}` : '', m.criado_em ? `na Nexos desde ${fmtCurto(m.criado_em)}` : ''].filter(Boolean).join(' · ')}</p></div></div>
    ${
      enc
        ? `<div class="fe-enc"><b>${esc(nomeEq(enc.para) || 'Novo treinador')} vai cuidar da ${ENC_AREA[enc.area]}</b><span>Acrescentado por ${esc(nomeEq(enc.de) || 'a equipe')}. ${
            enc.area === 'musculacao'
              ? `A corrida continua com ${esc(nomeEq(m.treinador_corrida_id || m.treinador_id) || 'o treinador atual')}.`
              : `A força continua com ${esc(nomeEq(m.treinador_forca_id || m.treinador_id) || 'o treinador atual')}.`
          }</span>${enc.recado ? `<p>“${esc(enc.recado)}”</p>` : ''}</div>`
        : ''
    }
    ${sec('Contato', lin('WhatsApp', esc(m.telefone || f.telefone || '')) + lin('E-mail', esc(m.email || f.email || '')) + lin('Bairro / cidade', esc(f.cidade || '')))}
    ${sec(
      'Objetivo',
      lin('Faz com a Nexos', esc(mods.join(' e '))) +
        lin('Objetivo', esc(rs.obj)) +
        lin('Nas palavras do aluno', esc(f.meta || an.objetivo_txt || m.objetivo || '')) +
        lin('Prova em vista', esc(f.prova || an.prova || '')),
    )}
    ${sec(
      'Disponibilidade',
      lin('Corrida', dias(dp.corrida)) +
        lin('Força', dias(dp.forca) || (area === 'musculacao' ? 'combinar na entrevista' : '')) +
        lin('Horário', esc(lista(f.horario, FICHA_HOR))) +
        lin('Local', esc(lista(f.local, FICHA_LOCAL))) +
        lin('Comentário', esc(dp.obs || f.disp_obs || '')) +
        lin('Recado na ficha', esc(f.obs || '')),
    )}
    ${sec(
      'Histórico esportivo',
      lin('Esportes', esc(lista(f.esportes, FICHA_ESPORTES))) +
        lin('Rotina', esc(f.atividade || an.atividades || '')) +
        lin('Condicionamento', esc(nomeL(FICHA_NIVEL, f.nivel))) +
        lin('Corrida', esc(nomeL(FICHA_EXP, f.corrida_exp))) +
        lin('Maior distância', esc(f.maior_dist || '')) +
        lin('Tempo recente', esc(f.tempo_recente || '')) +
        lin('Relógio', esc(f.relogio || '')),
    )}
    ${A ? sec('Momento atual na corrida', momentoCorridaHTML(ds, A, lin)) : ''}
    ${sec(
      'Saúde',
      lin(
        'Altura e peso',
        esc(
          [
            f.altura || an.altura ? `${f.altura || an.altura} m` : '',
            f.peso || an.peso ? `${f.peso || an.peso} kg` : '',
            imc ? `IMC ${imc}` : '',
          ]
            .filter(Boolean)
            .join(' · '),
        ),
      ) +
        lin(
          'PAR-Q',
          rs.sim.length
            ? `<span class="fe-alerta">${rs.sim.length} resposta${rs.sim.length > 1 ? 's' : ''} SIM</span>`
            : D.ficha || D.ana
              ? 'Todas as respostas NÃO'
              : '',
        ) +
        rs.sim.map(([n, q]) => lin(`PAR-Q ${n}`, esc(q.replace(/\s*<small[^>]*>[\s\S]*?<\/small>/, '')))).join('') +
        (rs.histSim.length
          ? lin(
              'Marcou SIM',
              esc(rs.histSim.map(([q, v]) => q.replace(/\?$/, '') + (v === 'naosei' ? ' (não sabe)' : '')).join('; ')),
            )
          : '') +
        lin('Observações de saúde', esc(f.obs_medica || m.observacoes || '').replace(/\n+/g, '<br>')) +
        lin('Fuma', an.fuma === 'sim' ? 'Sim' : '') +
        (energia && energia.nivel && energia.nivel !== 'ok'
          ? lin(
              'Triagem de energia',
              `${energia.nivel === 'alerta' ? '<span class="fe-alerta">alerta</span>' : 'atenção'}${(energia.sinais || []).length ? ` (${esc(energia.sinais.join(', '))})` : ''}`,
            )
          : ''),
    )}
    ${sec(
      'No app (últimos 30 dias)',
      lin('Check-ins', prs.length ? `${prs.length}, prontidão média ${f1(mediaPr)} de 20` : 'nenhum') +
        lin('Corridas', cs.length ? `${cs.length}, ${f1(kmCs)} km no total` : 'nenhuma registrada') +
        lin('Dores marcadas', esc(dores.join(', '))),
    )}
    ${
      roteiro.length
        ? `<section class="fe-sec fe-roteiro"><h3>Roteiro da entrevista</h3>${roteiro.map(([t, qs]) => `<div class="fe-bloco"><b>${esc(t)}</b><ul class="fe-perg">${qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>`).join('')}</section>`
        : ''
    }
    <footer class="fe-rod">Documento interno da equipe Nexos. Contém dados de saúde do aluno: use só para montar e acompanhar o treino (LGPD).</footer>
  </div>`;
}

/** momento atual na corrida, pelo que o aluno marcou na ficha de entrada (e a sugestão de ciclo do app) */
function momentoCorridaHTML(ds, A, lin) {
  const nomeDe = (l, k) => (l.find((x) => x[0] === k) || [, k])[1];
  return (
    lin('Corre sem parar', ds.cont ? esc(nomeDe(FICHA_CONT, ds.cont)) : '') +
    lin(
      'Volume hoje',
      ds.km_sem != null || ds.dias_sem != null
        ? [ds.km_sem != null ? `${ds.km_sem} km por semana` : '', ds.dias_sem != null ? `${ds.dias_sem} dias` : '']
            .filter(Boolean)
            .join(' · ')
        : '',
    ) +
    A.pv
      .map((x) =>
        lin(
          x.l,
          esc(
            [
              x.seg ? fmtDurLongo(x.seg) : (ds.p[x.k] || {}).t ? `tempo informado ${ds.p[x.k].t}` : '',
              nomeDe(FICHA_QUANDO, x.q),
              x.vdot && x.recente ? `VDOT ${Math.round(x.vdot)}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        ),
      )
      .join('') +
    lin('Quer treinar', ds.alvo ? esc(nomeDe(FICHA_ALVO, ds.alvo)) : '') +
    lin(
      'Sugestão do app',
      A.ciclo ? `${esc(A.ciclo.nome)} (${A.ciclo.sem} semanas)<br><small>${A.motivos.map(esc).join(' ')}</small>` : '',
    )
  );
}

/** perguntas da entrevista de início, em blocos. Cada pergunta sai do que a ficha respondeu (ou deixou em branco). */
function roteiroEntrevista({ m, f, an, rs, dores, area, ds }) {
  const mods = m.modalidades || f.modalidades || [];
  const corre = area ? area === 'corrida' : mods.includes('corrida');
  const forca = area ? area === 'musculacao' : mods.includes('musculacao');
  const esportes = f.esportes || [];
  const nomeEsp = (k) => ((FICHA_ESPORTES.find((x) => x[0] === k) || [])[1] || k).toLowerCase();
  const contMin = ds && { nao: 0, 10: 10, 20: 20, 30: 30, 60: 60, mais: 90 }[ds.cont];
  const B = [];
  if (corre)
    B.push([
      'Corrida',
      [
        ds && ds.cont
          ? `Na ficha marcou que corre ${(FICHA_CONT.find((x) => x[0] === ds.cont) || [, ds.cont])[1].toLowerCase()} sem parar. Confirmar, ver em que ritmo e como se sente no dia seguinte.`
          : 'Quanto tempo corre hoje sem parar, em que ritmo e como se sente no dia seguinte.',
        ...(contMin != null &&
        contMin < 30 &&
        ds.p &&
        ['5', '10'].some((k) => ds.p[k] && ['3m', '6m'].includes(ds.p[k].q))
          ? [
              'Marcou 5 km ou mais nos últimos meses, mas corre pouco tempo sem parar. Confirmar se foi intercalando com caminhada e qual foi o tempo.',
            ]
          : []),
        'Já teve dor ou lesão correndo (joelho, canela, tornozelo, pé, quadril)? O que foi, quando e se ainda incomoda. Lesão anterior é o que mais pesa no risco de nova lesão.',
        'Onde vai correr (rua, esteira, pista), se o percurso tem subida e quanto tempo tem por treino.',
        f.prova && !/^(ainda )?n[aã]o\.?$/i.test(String(f.prova).trim())
          ? `Prova em vista: "${f.prova}". Confirmar data e distância.`
          : 'Tem alguma prova em mente? Uma data ajuda a dar prazo ao ciclo.',
        `Tênis que usa (modelo e há quanto tempo) e relógio${f.relogio ? ` (marcou "${f.relogio}")` : ''}. Se for Garmin, conectar no app.`,
      ],
    ]);
  if (forca)
    B.push([
      'Força',
      [
        'Experiência com musculação: há quanto tempo, com que frequência e se já parou e voltou.',
        'Onde vai treinar a força (academia, casa, condomínio) e que equipamentos tem.',
        'Dias e horários para a força, combinando com os dias de corrida.',
        'O que espera da força (desempenho na corrida, prevenção de lesão, composição corporal).',
      ],
    ]);
  const rot = [];
  if (corre && !forca && esportes.includes('musculacao'))
    rot.push(
      'Faz musculação por fora: quem prescreve e em que dias treina perna. Evitar o treino forte de corrida no dia seguinte ao de perna.',
    );
  const outros = esportes.filter((k) => !['nunca', 'corrida', 'musculacao', 'outros'].includes(k));
  if (outros.length)
    rot.push(
      `Outros esportes (${outros.map(nomeEsp).join(', ')}): frequência e intensidade hoje, para contar na carga da semana.`,
    );
  rot.push('Sono (horas por noite), trabalho ou estudo e como anda o estresse.');
  if (f.obs) rot.push(`Recado na ficha: "${f.obs}". Responder na conversa.`);
  B.push(['Rotina e recuperação', rot]);
  const sau = [];
  if ((m.sexo || '') === 'F' || f.sexo === 'feminino')
    sau.push(
      'Ciclo menstrual: se é regular, se tem cólica forte e se usa anticoncepcional. Mostrar o acompanhamento do ciclo no app.',
    );
  if (rs.histSim.some(([q]) => /lesão|cirurgia/i.test(q)))
    sau.push('Lesões e cirurgias: o que foi, quando, se ainda dói e o que evitar nos exercícios.');
  if (rs.histSim.some(([q]) => /medicamento/i.test(q))) sau.push('Medicamentos em uso e para quê.');
  if (rs.histSim.some(([q]) => /dores/i.test(q)) || dores.length)
    sau.push('Dores atuais: onde, desde quando e em que movimento.');
  if (rs.sim.length) sau.push('PAR-Q com resposta SIM: confirmar a liberação médica antes de começar.');
  if (an.fuma === 'sim') sau.push('Fuma: quanto por dia.');
  if (sau.length) B.push(['Saúde', sau]);
  const fecha = [];
  if (corre)
    fecha.push(
      contMin != null && contMin < 30
        ? 'Ainda não corre 30 minutos seguidos: começar pelo corre e caminha. O teste de entrada fica para depois da adaptação.'
        : 'Combinar o teste de entrada no Check-up (5 km ou 30 min). É ele que define as zonas e os ritmos.',
    );
  fecha.push('Explicar o check-in do dia e como registrar os treinos no app.');
  B.push(['Para fechar', fecha]);
  return B;
}

/* ---------- PDF ---------- */
async function carregarHtml2pdf() {
  if (window.html2pdf) return;
  await new Promise((ok, erro) => {
    const sc = document.createElement('script');
    sc.src = (window.NX_DEMO && window.NX_VENDOR) || new URL('vendor/html2pdf.bundle.min.js', document.baseURI).href;
    sc.onload = ok;
    sc.onerror = erro;
    document.head.appendChild(sc);
  });
}
/** quebra as páginas do PDF sem cortar linha nem deixar título sozinho no pé da página: mede cada item e, se ele
   passar do fim da página (A4 com 10 mm de margem em cima e embaixo, 277 mm úteis), empurra para a página seguinte */
function paginarFolha(folha, W) {
  const pagH = Math.floor((277 * W) / 210);
  const y0 = folha.getBoundingClientRect().top;
  const itens = folha.querySelectorAll('.fe-id, .fe-enc, .fe-sec>h3, .fe-l, .fe-bloco>b, .fe-perg li, .fe-rod');
  for (const el of itens) {
    const r = el.getBoundingClientRect();
    const topo = r.top - y0;
    let fim = r.bottom - y0;
    // título vai junto com o primeiro item que vem depois dele
    if (el.matches('.fe-sec>h3, .fe-bloco>b')) {
      const prox = el.nextElementSibling;
      const alvo = prox && prox.matches('.fe-perg, .fe-bloco') ? prox.querySelector('li, b') : prox;
      if (alvo) fim = alvo.getBoundingClientRect().bottom - y0;
    }
    const fimPag = (Math.floor(topo / pagH) + 1) * pagH;
    if (fim > fimPag && fim - topo < pagH) {
      const esp = document.createElement('div');
      esp.style.height = Math.ceil(fimPag - topo + 6) + 'px';
      el.parentNode.insertBefore(esp, el);
    }
  }
}
async function fichaEntrevistaPdf(folha, nomeArq) {
  await carregarHtml2pdf();
  const caixa = document.createElement('div');
  // largura de uma A4 em px (210 mm a 96 dpi): a mesma que o gerador usa para calcular onde cada página termina
  const W = 794;
  caixa.style.cssText = `position:fixed;left:0;top:0;width:${W}px;z-index:-1;pointer-events:none`;
  const copia = folha.cloneNode(true);
  copia.classList.add('fe-pdf');
  copia.style.width = W + 'px';
  caixa.appendChild(copia);
  document.body.appendChild(caixa);
  // o gerador de PDF não desenha SVG: troca a logo por PNG
  for (const im of copia.querySelectorAll('img')) {
    if (!/svg/i.test(im.src)) continue;
    const w = im.clientWidth || 110,
      h = im.clientHeight || 30,
      cv = document.createElement('canvas');
    cv.width = w * 3;
    cv.height = h * 3;
    await new Promise((ok) => {
      const t = new Image();
      t.onload = () => {
        cv.getContext('2d').drawImage(t, 0, 0, cv.width, cv.height);
        ok();
      };
      t.onerror = ok;
      t.src = im.src;
    });
    im.style.width = w + 'px';
    im.style.height = h + 'px';
    im.src = cv.toDataURL('image/png');
  }
  paginarFolha(copia, W);
  try {
    const blob = await window
      .html2pdf()
      .set({
        margin: [10, 0, 10, 0],
        filename: nomeArq,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: W,
          windowWidth: W,
          height: copia.scrollHeight,
          windowHeight: copia.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['legacy'] },
      })
      .from(copia)
      .outputPdf('blob');
    return new File([blob], nomeArq, { type: 'application/pdf' });
  } finally {
    caixa.remove();
  }
}

/* ---------- tela: Relatório para entrevista ---------- */
async function staffFichaEntrevista(alunoId) {
  loading();
  const D = await fichaEntrevistaDados(alunoId);
  dockStaff();
  if (!D.m) {
    $app.innerHTML = `<a class="back" href="#/alunos">${I.back} Atletas</a><div class="empty"><div class="h3">Aluno não encontrado</div></div>`;
    return;
  }
  // o encaminhamento mais recente fica guardado no próprio aluno (quem acrescentou, para quem, a área e o recado)
  const enc = D.m.encaminhamento || null;
  const nomeArq = `Relatorio-entrevista-Nexos-${firstName(D.m.nome).replace(/[^\p{L}\d]/gu, '')}.pdf`;
  $app.innerHTML = `<a class="back" href="#/aluno/${alunoId}/dados">${I.back} ${esc(firstName(D.m.nome))}</a><p class="eyebrow">Equipe</p><h1 class="h1">Relatório para entrevista</h1>
    <p class="small muted" style="margin-top:6px">Tudo o que o aluno respondeu na ficha de entrada e já fez no app, com o roteiro da conversa de início. Baixe o PDF antes da chamada.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:14px 0"><button class="btn" id="fe-pdf">${icT(BAIXAR_IC)}Baixar PDF</button>${D.m.telefone ? `<a class="btn ghost" href="https://wa.me/${telWa(D.m.telefone)}" target="_blank" rel="noopener">WhatsApp do aluno</a>` : ''}</div>
    <div class="fe-tela">${fichaEntrevistaHTML(D, enc)}</div>`;
  // o PDF leva alguns segundos para ficar pronto. No celular, o compartilhar só abre se vier de um toque recente,
  // por isso o primeiro toque gera o arquivo e o segundo (no botão que aparece) salva ou compartilha.
  let arqPronto = null;
  const salvar = async (arq) => {
    if (navigator.canShare && navigator.canShare({ files: [arq] })) {
      try {
        await navigator.share({ files: [arq], title: arq.name });
        return;
      } catch (er) {
        if (er && er.name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(arq);
    a.download = arq.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  document.getElementById('fe-pdf').onclick = async (e) => {
    const b = e.currentTarget,
      h0 = b.innerHTML;
    if (arqPronto) return salvar(arqPronto);
    b.disabled = true;
    b.textContent = 'Gerando…';
    try {
      arqPronto = await fichaEntrevistaPdf($app.querySelector('.fe-folha'), nomeArq);
      b.disabled = false;
      b.innerHTML = `${icT(BAIXAR_IC)}Salvar o PDF`;
      // link direto como reserva, caso o compartilhar não abra
      const link = document.createElement('a');
      link.className = 'btn ghost';
      link.href = URL.createObjectURL(arqPronto);
      link.download = arqPronto.name;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Abrir o PDF';
      b.after(link);
      toast('PDF pronto. Toque em Salvar o PDF.');
    } catch (er) {
      console.error(er);
      toast('Não foi possível gerar o PDF.', true);
      b.disabled = false;
      b.innerHTML = h0;
    }
  };
}

/* ---------- acrescentar modalidade com outro treinador ---------- */
function encaminharCardHTML(m) {
  const tem = (k) => (m.modalidades || []).includes(k);
  const falta = ['musculacao', 'corrida'].filter((k) => !tem(k));
  return `<div class="card" id="enc-card"><b>${icT(ENC_IC)}Acrescentar modalidade com outro treinador</b>
    <p class="small muted" style="margin:4px 0 10px">O aluno continua com quem já treina. Ele ganha a ${falta.length ? falta.map((k) => ENC_AREA[k]).join(' ou a ') : 'outra modalidade'} com o treinador que você escolher, que recebe um aviso com o relatório para entrevista (com PDF).</p>
    ${falta.length ? `<button class="btn sm" id="enc-abrir">${icT(ENC_IC)}Acrescentar ${falta.map((k) => ENC_AREA[k]).join(' ou ')}</button>` : '<p class="small muted">Este aluno já faz corrida e força. Para trocar quem cuida de cada uma, use os campos acima.</p>'}
    <a class="link-btn small" href="#/ficha-entrevista/${m.user_id}" style="display:block;margin-top:10px">Ver o relatório para entrevista</a></div>`;
}
async function encaminharSheet(m, depois) {
  const eq = (await carregarEquipe()).filter((p) => p.user_id);
  const falta = ['musculacao', 'corrida'].filter((k) => !(m.modalidades || []).includes(k));
  if (!falta.length) return;
  const st = { area: falta[0] };
  const atual = () => m.treinador_id; // o responsável, que já cuida do aluno
  openSheet(
    `<p class="eyebrow">${esc(m.nome)}</p><div class="h2" style="margin-top:4px">Acrescentar modalidade</div>
    ${falta.length > 1 ? `<div class="seg" id="enc-area" style="margin-top:12px">${falta.map((k) => `<button type="button" data-a="${k}" class="${k === st.area ? 'on' : ''}">${ENC_AREA[k][0].toUpperCase() + ENC_AREA[k].slice(1)}</button>`).join('')}</div>` : `<p class="small muted" style="margin-top:6px">Modalidade nova: <b>${ENC_AREA[st.area]}</b></p>`}
    <label class="field" style="margin-top:12px"><span>Quem vai cuidar da <span id="enc-nome">${ENC_AREA[st.area]}</span></span><select class="select" id="enc-para">${eq.map((p) => `<option value="${p.user_id}" ${p.user_id !== S.user.id && p.user_id !== atual() ? 'selected' : ''}>${esc(p.nome)}${p.user_id === S.user.id ? ' (você)' : ''}</option>`).join('')}</select></label>
    <label class="field"><span>Recado para o treinador (opcional)</span><textarea class="textarea" id="enc-recado" rows="3" placeholder="Ex.: ela quer começar na semana que vem, de manhã"></textarea></label>
    <p class="small muted">O aluno continua com quem já treina. O relatório para entrevista vai junto, com tudo o que ele já respondeu.</p>
    <button class="btn block" id="enc-ok" style="margin-top:12px">${I.check} Acrescentar e avisar</button>`,
    (r) => {
      const ar = r.querySelector('#enc-area');
      if (ar)
        ar.onclick = (e) => {
          const b = e.target.closest('[data-a]');
          if (!b) return;
          st.area = b.dataset.a;
          ar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          r.querySelector('#enc-nome').textContent = ENC_AREA[st.area];
        };
      r.querySelector('#enc-ok').onclick = async (e) => {
        const btn = e.currentTarget;
        const para = r.querySelector('#enc-para').value,
          recado = r.querySelector('#enc-recado').value.trim().slice(0, 500);
        btn.disabled = true;
        btn.textContent = 'Salvando…';
        // corrida e força: quem já cuida continua; o treinador novo entra só na modalidade nova
        const upd = { modalidades: [...new Set([...(m.modalidades || []), st.area])] };
        // regra do responsável fixo: o responsável não muda; o treinador novo cuida só da modalidade que entrou
        const campo = st.area === 'musculacao' ? 'treinador_forca_id' : 'treinador_corrida_id';
        upd[campo] = para === m.treinador_id ? null : para;
        upd.encaminhamento = {
          area: st.area,
          de: S.user.id,
          para,
          recado: recado || null,
          em: new Date().toISOString(),
        };
        const { error } = await sb.from('nx_membros').update(upd).eq('org_id', S.org.id).eq('user_id', m.user_id);
        if (error) {
          console.error(error);
          btn.disabled = false;
          btn.innerHTML = `${I.check} Acrescentar e avisar`;
          return toast('Não foi possível salvar.', true);
        }
        Object.assign(m, upd);
        if (para !== S.user.id)
          try {
            sb.functions.invoke('nx-push', { body: { acao: 'encaminhar', aluno_id: m.user_id } }).catch(() => {});
          } catch {}
        closeSheet();
        toast(
          para === S.user.id
            ? `Pronto. Agora você cuida da ${ENC_AREA[st.area]} de ${firstName(m.nome)}.`
            : `Pronto. ${firstName((eq.find((p) => p.user_id === para) || {}).nome || 'O treinador')} recebeu o aviso com a ficha.`,
        );
        depois && depois();
      };
    },
  );
}
