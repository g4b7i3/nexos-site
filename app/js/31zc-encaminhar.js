/* Nexos App · Acrescentar modalidade com outro treinador e Ficha para a entrevista.
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
  // perguntas para a entrevista: as da área nova e as que a ficha pede para aprofundar
  const area = enc && enc.area;
  const perguntas = [
    ...(area === 'musculacao'
      ? [
          'Experiência com musculação: há quanto tempo, com que frequência e se já parou e voltou.',
          'Onde vai treinar a força (academia, casa, condomínio) e que equipamentos tem.',
          'Dias e horários para a força, combinando com os dias de corrida.',
          'O que espera da força (desempenho na corrida, prevenção de lesão, composição corporal).',
        ]
      : area === 'corrida'
        ? [
            'Experiência com corrida: maior distância, tempos recentes e se já teve lesão correndo.',
            'Onde vai correr (rua, esteira, pista) e se usa relógio.',
            'Dias e horários para correr, combinando com os dias de força.',
            'Objetivo com a corrida (prova, tempo, saúde) e prazo.',
          ]
        : []),
    ...(rs.histSim.some(([q]) => /lesão|cirurgia/i.test(q))
      ? ['Lesões e cirurgias: o que foi, quando, se ainda dói e o que evitar nos exercícios.']
      : []),
    ...(rs.histSim.some(([q]) => /medicamento/i.test(q)) ? ['Medicamentos em uso e para quê.'] : []),
    ...(rs.histSim.some(([q]) => /dores/i.test(q)) || dores.length
      ? ['Dores atuais: onde, desde quando e em que movimento.']
      : []),
    ...(rs.sim.length ? ['PAR-Q com resposta SIM: confirmar a liberação médica antes de começar.'] : []),
  ];
  const hoje = new Date().toLocaleDateString('pt-BR');
  return `<div class="fe-folha">
    <header class="fe-cab"><img src="icons/wordmark-escuro.svg" alt="Nexos Performance e Saúde"><div><b>Ficha para a entrevista</b><span>${hoje}</span></div></header>
    <div class="fe-id"><div><h1>${esc(m.nome || f.nome || 'Aluno')}</h1><p>${[idade != null ? `${idade} anos` : '', m.sexo === 'F' ? 'feminino' : m.sexo === 'M' ? 'masculino' : '', m.matricula ? `matrícula ${m.matricula}` : '', m.criado_em ? `na Nexos desde ${fmtCurto(m.criado_em)}` : ''].filter(Boolean).join(' · ')}</p></div></div>
    ${
      enc
        ? `<div class="fe-enc"><b>${esc(nomeEq(enc.para) || 'Novo treinador')} vai cuidar da ${ENC_AREA[enc.area]}</b><span>Acrescentado por ${esc(nomeEq(enc.de) || 'a equipe')}. ${
            enc.area === 'musculacao'
              ? `A corrida continua com ${esc(nomeEq(m.treinador_id) || 'o treinador atual')}.`
              : `A força continua com ${esc(nomeEq(m.treinador_forca_id) || 'o treinador atual')}.`
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
        lin('Comentário', esc(dp.obs || f.disp_obs || '')),
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
    ${perguntas.length ? `<section class="fe-sec"><h3>Para conversar na entrevista</h3><ul class="fe-perg">${perguntas.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></section>` : ''}
    <footer class="fe-rod">Documento interno da equipe Nexos. Contém dados de saúde do aluno: use só para montar e acompanhar o treino (LGPD).</footer>
  </div>`;
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
async function fichaEntrevistaPdf(folha, nomeArq) {
  await carregarHtml2pdf();
  const caixa = document.createElement('div');
  caixa.style.cssText = 'position:fixed;left:0;top:0;width:760px;z-index:-1;pointer-events:none';
  const copia = folha.cloneNode(true);
  copia.classList.add('fe-pdf');
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
          width: 760,
          windowWidth: 760,
          height: copia.scrollHeight,
          windowHeight: copia.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css'], avoid: ['.fe-l', '.fe-enc', '.fe-id', '.fe-perg li'] },
      })
      .from(copia)
      .outputPdf('blob');
    return new File([blob], nomeArq, { type: 'application/pdf' });
  } finally {
    caixa.remove();
  }
}

/* ---------- tela: Ficha para a entrevista ---------- */
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
  const nomeArq = `Ficha-entrevista-Nexos-${firstName(D.m.nome).replace(/[^\p{L}\d]/gu, '')}.pdf`;
  $app.innerHTML = `<a class="back" href="#/aluno/${alunoId}/dados">${I.back} ${esc(firstName(D.m.nome))}</a><p class="eyebrow">Equipe</p><h1 class="h1">Ficha para a entrevista</h1>
    <p class="small muted" style="margin-top:6px">Tudo o que o aluno já respondeu e fez no app, para a conversa de começo com o treinador novo. Não precisa de formulário novo.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:14px 0"><button class="btn" id="fe-pdf">${icT(BAIXAR_IC)}Baixar PDF</button>${D.m.telefone ? `<a class="btn ghost" href="https://wa.me/${telWa(D.m.telefone)}" target="_blank" rel="noopener">WhatsApp do aluno</a>` : ''}</div>
    <div class="fe-tela">${fichaEntrevistaHTML(D, enc)}</div>`;
  document.getElementById('fe-pdf').onclick = async (e) => {
    const b = e.currentTarget,
      h0 = b.innerHTML;
    b.disabled = true;
    b.textContent = 'Gerando…';
    try {
      const arq = await fichaEntrevistaPdf($app.querySelector('.fe-folha'), nomeArq);
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
    } catch (er) {
      console.error(er);
      toast('Não foi possível gerar o PDF.', true);
    } finally {
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
    <p class="small muted" style="margin:4px 0 10px">O aluno continua com quem já treina. Ele ganha a ${falta.length ? falta.map((k) => ENC_AREA[k]).join(' ou a ') : 'outra modalidade'} com o treinador que você escolher, que recebe um aviso com a ficha para a entrevista (com PDF).</p>
    ${falta.length ? `<button class="btn sm" id="enc-abrir">${icT(ENC_IC)}Acrescentar ${falta.map((k) => ENC_AREA[k]).join(' ou ')}</button>` : '<p class="small muted">Este aluno já faz corrida e força. Para trocar quem cuida de cada uma, use os campos acima.</p>'}
    <a class="link-btn small" href="#/ficha-entrevista/${m.user_id}" style="display:block;margin-top:10px">Ver a ficha para a entrevista</a></div>`;
}
async function encaminharSheet(m, depois) {
  const eq = (await carregarEquipe()).filter((p) => p.user_id);
  const falta = ['musculacao', 'corrida'].filter((k) => !(m.modalidades || []).includes(k));
  if (!falta.length) return;
  const st = { area: falta[0] };
  const atual = () => (st.area === 'musculacao' ? m.treinador_id : m.treinador_forca_id || m.treinador_id); // quem já cuida do aluno
  openSheet(
    `<p class="eyebrow">${esc(m.nome)}</p><div class="h2" style="margin-top:4px">Acrescentar modalidade</div>
    ${falta.length > 1 ? `<div class="seg" id="enc-area" style="margin-top:12px">${falta.map((k) => `<button type="button" data-a="${k}" class="${k === st.area ? 'on' : ''}">${ENC_AREA[k][0].toUpperCase() + ENC_AREA[k].slice(1)}</button>`).join('')}</div>` : `<p class="small muted" style="margin-top:6px">Modalidade nova: <b>${ENC_AREA[st.area]}</b></p>`}
    <label class="field" style="margin-top:12px"><span>Quem vai cuidar da <span id="enc-nome">${ENC_AREA[st.area]}</span></span><select class="select" id="enc-para">${eq.map((p) => `<option value="${p.user_id}" ${p.user_id !== S.user.id && p.user_id !== atual() ? 'selected' : ''}>${esc(p.nome)}${p.user_id === S.user.id ? ' (você)' : ''}</option>`).join('')}</select></label>
    <label class="field"><span>Recado para o treinador (opcional)</span><textarea class="textarea" id="enc-recado" rows="3" placeholder="Ex.: ela quer começar na semana que vem, de manhã"></textarea></label>
    <p class="small muted">O aluno continua com quem já treina. A ficha para a entrevista vai junto, com tudo o que ele já respondeu.</p>
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
        if (st.area === 'musculacao') upd.treinador_forca_id = para === m.treinador_id ? null : para;
        else {
          // a corrida fica com o responsável; quem cuidava do aluno passa a cuidar só da força
          const antes = m.treinador_forca_id || m.treinador_id;
          upd.treinador_id = para;
          upd.treinador_forca_id = antes && antes !== para ? antes : null;
        }
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
