/* Nexos App · Conversa aluno e treinador, saúde, formulários em etapas e máscaras de números.
   Parte 12 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- conversa aluno ↔ treinador ---------- */
async function contarMsgNovas() {
  let q = sb.from('nx_mensagens').select('aluno_id,autor_id').eq('org_id', S.org.id).eq('lida', false).limit(1000);
  if (!S.staff) q = q.eq('aluno_id', S.user.id);
  const [{ data }, vis] = await Promise.all([q, S.staff ? idsMeusAlunos() : null]);
  const l = (data || []).filter((m) =>
    S.staff ? m.autor_id === m.aluno_id && vis.has(m.aluno_id) : m.autor_id !== S.user.id,
  );
  S.cache.msgNovas = l.length;
  S.cache.msgPorAluno = {};
  l.forEach((m) => {
    S.cache.msgPorAluno[m.aluno_id] = (S.cache.msgPorAluno[m.aluno_id] || 0) + 1;
  });
  return l;
}
async function viewConversa(alunoId, box, staff, sessaoId) {
  let ref = null;
  if (sessaoId) {
    const { data } = await sb
      .from('nx_sessoes')
      .select('id,treino_titulo,iniciado_em,comentario,esforco')
      .eq('id', sessaoId)
      .maybeSingle();
    ref = data;
  }
  const equipeToda = await carregarEquipe();
  const porId = Object.fromEntries(equipeToda.map((p) => [p.user_id, p]));
  const resp = !staff && S.me.treinador_id && porId[S.me.treinador_id];
  const equipe = resp ? [resp] : equipeToda;
  const nomesEq = equipe.map((p) => firstName(p.nome));
  if (staff) {
    const { data: al } = await sb
      .from('nx_membros')
      .select('user_id,nome,foto_url')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle();
    if (al) porId[al.user_id] = al;
  }
  box.innerHTML = `${
    staff
      ? ''
      : `<p class="eyebrow">Conversa</p>
    <div class="treinador-top">${
      equipe.length
        ? `<div class="fotos-eq">${equipe
            .slice(0, 3)
            .map((p) => fotoHTML(p, 'md'))
            .join('')}</div>`
        : ''
    }<div class="grow" style="min-width:0"><h1 class="h2">${equipe.length ? esc(nomesEq.length > 1 ? nomesEq.slice(0, -1).join(', ') + ' e ' + nomesEq[nomesEq.length - 1] : nomesEq[0]) : 'Seu treinador'}</h1><p class="small muted">${equipe.length > 1 ? 'Treinadores da Nexos' : 'Seu treinador na Nexos'}</p><div class="row" style="gap:10px;flex-wrap:wrap;margin-top:4px">${equipe.map((p) => `<span data-pres="${p.user_id}" data-pres-pre="${equipe.length > 1 ? esc(firstName(p.nome)) + ': ' : ''}"></span>`).join('')}</div></div></div>
    <p class="small muted" style="margin-top:12px">Dúvidas, ajustes no treino ou como você está se sentindo.</p>`
  }
    <div class="chat" id="chat">${esqBloco('chat')}</div>
    <form class="composer" id="f-msg">
      <div id="ref-box"></div>
      <div class="row" style="gap:8px;align-items:flex-end"><textarea class="textarea" name="texto" rows="1" maxlength="2000" placeholder="${staff ? 'Escreva para o aluno…' : 'Escreva para o seu treinador…'}" required></textarea>${staff ? botaoAudioHTML() : ''}<button class="btn send" aria-label="Enviar">${I.arrow}</button></div>
    </form>`;
  const $chat = box.querySelector('#chat'),
    f = box.querySelector('#f-msg');
  if (!staff) vigiarPresenca();
  try {
    const rk = 'nx-rasc-' + alunoId,
      rs = sessionStorage.getItem(rk);
    if (rs && f && f.texto) {
      f.texto.value = rs;
      sessionStorage.removeItem(rk);
      setTimeout(() => f.texto.focus(), 300);
    }
  } catch {}
  const drawRef = () => {
    box.querySelector('#ref-box').innerHTML = ref
      ? `<div class="ref-chip"><span>Respondendo ao check-in: <b>${esc(ref.treino_titulo || 'Treino')}</b> · ${fmtData(ref.iniciado_em)}</span><button type="button" class="icon-btn" id="ref-x" aria-label="Remover">${I.x}</button></div>`
      : '';
    const x = box.querySelector('#ref-x');
    if (x)
      x.onclick = () => {
        ref = null;
        drawRef();
      };
  };
  drawRef();
  let assin = '';
  const ladoMeu = (m) => (staff ? m.autor_id !== alunoId : m.autor_id === S.user.id);
  // apagar: a equipe apaga qualquer mensagem da conversa; o aluno, só as dele
  const podeApagar = (m) => !!m && (staff || m.autor_id === S.user.id);
  const sel = new Set();
  let selMode = false;
  const barra = document.createElement('div');
  barra.className = 'msg-selbar';
  barra.hidden = true;
  f.parentNode.insertBefore(barra, f);
  const marcarSel = () => {
    $chat.querySelectorAll('[data-msg]').forEach((b) => b.classList.toggle('sel', sel.has(b.dataset.msg)));
    $chat.classList.toggle('selecionando', selMode);
    barra.hidden = !selMode;
    f.hidden = selMode;
    if (selMode)
      barra.innerHTML = `<button type="button" class="link-btn" data-sel="sair">Cancelar</button><b>${sel.size ? `${sel.size} selecionada${sel.size > 1 ? 's' : ''}` : 'Toque nas mensagens'}</b><button type="button" class="btn sm" data-sel="apagar" style="background:var(--err)" ${sel.size ? '' : 'disabled'}>Apagar</button>`;
  };
  const sairSel = () => {
    selMode = false;
    sel.clear();
    marcarSel();
  };
  barra.onclick = async (e) => {
    const b = e.target.closest('[data-sel]');
    if (!b) return;
    if (b.dataset.sel === 'sair') return sairSel();
    if (!sel.size) return;
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Confirmar';
      return;
    }
    b.disabled = true;
    const ids = [...sel];
    const { error } = await sb.from('nx_mensagens').delete().in('id', ids);
    if (error) {
      b.disabled = false;
      return toast('Não foi possível apagar.', true);
    }
    toast(`${ids.length} mensage${ids.length > 1 ? 'ns apagadas' : 'm apagada'}`);
    sairSel();
    assin = '';
    await carregar();
    contarMsgNovas();
  };
  const carregar = async () => {
    const { data, error } = await sb
      .from('nx_mensagens')
      .select('*, nx_sessoes(treino_titulo,iniciado_em)')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .order('criado_em')
      .limit(400);
    if (error || !document.body.contains($chat)) return;
    const msgs = data || [];
    S.chatMsgs = msgs;
    const nova = msgs.map((m) => m.id + (m.lida ? 1 : 0)).join();
    if (nova !== assin) {
      assin = nova;
      let ult = '';
      $chat.innerHTML = msgs.length
        ? msgs
            .map((m) => {
              const d = new Date(m.criado_em).toDateString();
              const sep =
                d !== ult
                  ? `<div class="day-sep">${quando(m.criado_em) === 'hoje' ? 'Hoje' : quando(m.criado_em) === 'ontem' ? 'Ontem' : fmtData(m.criado_em)}</div>`
                  : '';
              ult = d;
              const meu = ladoMeu(m);
              const autor = porId[m.autor_id];
              const bolha = `<div class="bubble ${meu ? 'me' : ''}" data-msg="${m.id}">${autor && (!meu || m.autor_id !== S.user.id) && !(staff && m.autor_id === alunoId) ? `<span class="b-autor">${esc(firstName(autor.nome))}</span>` : ''}${m.nx_sessoes ? `<span class="b-ref">Sobre: ${esc(m.nx_sessoes.treino_titulo || 'treino')} · ${fmtData(m.nx_sessoes.iniciado_em)}</span>` : ''}${m.audio_path ? `<div class="b-audio" data-audio="${esc(m.audio_path)}"><audio controls preload="none"></audio></div>` : `<p>${esc(m.texto)}</p>`}<span class="b-meta">${fmtHora(m.criado_em)}${meu && m.lida ? ' · lida' : ''}</span></div>`;
              return sep + (!meu && autor ? `<div class="b-linha">${fotoHTML(autor, 'sm')}${bolha}</div>` : bolha);
            })
            .join('')
        : `<div class="empty"><div class="h3">Nenhuma mensagem ainda</div><p class="small">${staff ? 'Mande um recado, um ajuste ou um parabéns.' : 'Mande sua primeira mensagem para o treinador.'}</p></div>`;
      if (selMode) marcarSel();
      else $chat.scrollTop = $chat.scrollHeight;
      carregarAudios($chat).catch(() => {});
      if (!staff) window.scrollTo(0, document.body.scrollHeight);
    }
    const naoLidas = msgs.filter((m) => !m.lida && !ladoMeu(m));
    if (naoLidas.length) {
      let q = sb.from('nx_mensagens').update({ lida: true }).eq('aluno_id', alunoId).eq('lida', false);
      q = staff ? q.eq('autor_id', alunoId) : q.neq('autor_id', S.user.id);
      await q;
      await contarMsgNovas();
      staff ? dockStaff() : dockAluno();
      const tb = document.querySelector('[data-aba="conversa"]');
      if (tb) tb.textContent = 'Conversa';
    }
  };
  const ta = f.texto;
  if (staff) bindAudio(box, alunoId, () => carregar());
  ta.oninput = () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(160, ta.scrollHeight) + 'px';
  };
  ta.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer:fine)').matches) {
      e.preventDefault();
      f.requestSubmit();
    }
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const texto = ta.value.trim();
    if (!texto) return;
    const btn = f.querySelector('.send');
    btn.disabled = true;
    const { data: nm, error } = await sb
      .from('nx_mensagens')
      .insert({ org_id: S.org.id, aluno_id: alunoId, autor_id: S.user.id, texto, sessao_id: ref ? ref.id : null })
      .select('id')
      .single();
    btn.disabled = false;
    if (error) return toast('Não foi possível enviar.', true);
    notificar('mensagem', nm && nm.id);
    ta.value = '';
    ta.style.height = '';
    ref = null;
    drawRef();
    await carregar();
  };
  // pressionar a mensagem (ou botão direito no computador): copiar / apagar
  const menuMsg = (id) => {
    const m = (S.chatMsgs || []).find((x) => x.id === id);
    if (!m) return;
    const minha = podeApagar(m);
    try {
      navigator.vibrate && navigator.vibrate(15);
    } catch {}
    openSheet(
      `<div class="msg-prev">${m.audio_path ? 'Mensagem de áudio' : esc(m.texto.length > 160 ? m.texto.slice(0, 159) + '…' : m.texto)}</div>
      <div class="stack" style="margin-top:16px">
        <button class="list-item msg-ac" id="mc-copiar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><b>Copiar</b></button>
        ${
          minha
            ? `<button class="list-item msg-ac del" id="mc-apagar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg><b>Apagar para todos</b></button>
        <button class="list-item msg-ac" id="mc-varias"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M15.5 17.5l2 2 3.5-4"/></svg><b>Selecionar várias para apagar</b></button>`
            : ''
        }
      </div>
      <button class="btn ghost block" data-close style="margin-top:12px">Cancelar</button>`,
      (r) => {
        const vs = r.querySelector('#mc-varias');
        if (vs)
          vs.onclick = () => {
            closeSheet();
            selMode = true;
            sel.clear();
            sel.add(m.id);
            marcarSel();
          };
        r.querySelector('#mc-copiar').onclick = async () => {
          try {
            await navigator.clipboard.writeText(m.texto || '');
          } catch {
            const t = document.createElement('textarea');
            t.value = m.texto;
            document.body.appendChild(t);
            t.select();
            try {
              document.execCommand('copy');
            } catch {}
            t.remove();
          }
          closeSheet();
          toast('Mensagem copiada');
        };
        const ap = r.querySelector('#mc-apagar');
        if (ap)
          ap.onclick = async () => {
            if (!ap.dataset.ok) {
              ap.dataset.ok = '1';
              ap.querySelector('b').textContent = 'Toque de novo para apagar';
              return;
            }
            ap.disabled = true;
            const { error } = await sb.from('nx_mensagens').delete().eq('id', m.id);
            if (error) {
              ap.disabled = false;
              return toast('Não foi possível apagar.', true);
            }
            closeSheet();
            toast('Mensagem apagada');
            assin = '';
            await carregar();
            contarMsgNovas();
          };
      },
    );
  };
  let pressT = null,
    pressXY = null;
  $chat.addEventListener('click', (e) => {
    if (!selMode) return;
    const b = e.target.closest('[data-msg]');
    if (!b) return;
    e.preventDefault();
    const m = (S.chatMsgs || []).find((x) => x.id === b.dataset.msg);
    if (!podeApagar(m)) return toast('Você só pode apagar as suas mensagens.', true);
    sel.has(m.id) ? sel.delete(m.id) : sel.add(m.id);
    marcarSel();
  });
  $chat.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-msg]');
    if (!b || e.button > 0 || selMode) return;
    pressXY = [e.clientX, e.clientY];
    b.classList.add('press');
    pressT = setTimeout(() => {
      pressT = null;
      b.classList.remove('press');
      menuMsg(b.dataset.msg);
    }, 480);
  });
  const soltar = () => {
    if (pressT) clearTimeout(pressT);
    pressT = null;
    $chat.querySelectorAll('.press').forEach((x) => x.classList.remove('press'));
  };
  $chat.addEventListener('pointerup', soltar);
  $chat.addEventListener('pointercancel', soltar);
  $chat.addEventListener('pointerleave', soltar);
  $chat.addEventListener('pointermove', (e) => {
    if (pressXY && Math.hypot(e.clientX - pressXY[0], e.clientY - pressXY[1]) > 10) soltar();
  });
  $chat.addEventListener('contextmenu', (e) => {
    const b = e.target.closest('[data-msg]');
    if (!b || selMode) return;
    e.preventDefault();
    soltar();
    menuMsg(b.dataset.msg);
  });
  await carregar();
  clearInterval(S.chatT);
  S.chatT = setInterval(carregar, 15000);
  if (sessaoId) ta.focus();
}

/* ================= SAÚDE: termo LGPD, anamnese e PAR-Q ================= */
const TERMO_VERSAO = '2026-11.2'; // 2026-11.2: entra o termo de responsabilidade e assunção de riscos
const CONTATO = { email: 'nexosperformanceesaude@gmail.com', insta: '@nexos.perform' };
const PARQ = [
  'Algum médico já disse que você tem algum problema de coração e que só deveria fazer atividade física com supervisão de profissionais de saúde?',
  'Você sente dor no peito quando pratica atividade física?',
  'No último mês, você sentiu dor no peito quando praticou atividade física?',
  'Você perde o equilíbrio por causa de tontura ou já perdeu a consciência?',
  'Você tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
  'Você toma atualmente algum remédio para pressão arterial ou para o coração?',
  'Você sabe de alguma outra razão pela qual não deveria praticar atividade física?',
];
// PAR-Q+ (versão 2025, Warburton et al.): usado por quem preenche a ficha a partir de agora. Quem já respondeu o PAR-Q clássico
// continua com ele (as respostas antigas não têm o campo v: 'plus').
const PARQ_PLUS = [
  'Algum médico já disse que você tem algum problema de coração OU pressão alta?',
  'Você sente dor no peito em repouso, nas atividades do dia a dia OU quando faz atividade física?',
  'Você perde o equilíbrio por causa de tontura OU perdeu a consciência nos últimos 12 meses? <small class="dim">Responda NÃO se a tontura foi por respirar rápido demais, inclusive em exercício intenso.</small>',
  'Algum médico já disse que você tem outra doença crônica (além de doença do coração ou pressão alta)?',
  'Você toma atualmente algum remédio receitado para uma doença crônica?',
  'Você tem hoje (ou teve nos últimos 12 meses) algum problema de osso, articulação, músculo, ligamento ou tendão que pode piorar se você ficar mais ativo? <small class="dim">Responda NÃO se foi um problema no passado que hoje não limita a sua atividade.</small>',
  'Algum médico já disse que você só deveria fazer atividade física com supervisão médica?',
];
const parqLista = (pq) => (pq && pq.q1 && pq.v !== 'plus' ? PARQ : PARQ_PLUS);
const parqNome = (pq) => (parqLista(pq) === PARQ ? 'PAR-Q' : 'PAR-Q+');
const DOENCAS = [
  'Hipertensão',
  'Diabetes',
  'Doença cardíaca',
  'Asma ou bronquite',
  'Colesterol alto',
  'Problema de tireoide',
  'Hérnia de disco',
  'Artrose',
  'Ansiedade ou depressão',
  'Outra',
];
const OBJETIVOS = [
  ['emagrecimento', 'Emagrecimento'],
  ['hipertrofia', 'Ganho de massa muscular'],
  ['corrida', 'Performance na corrida'],
  ['saude', 'Saúde e qualidade de vida'],
  ['condicionamento', 'Condicionamento físico'],
  ['retorno', 'Voltar depois de lesão ou pausa'],
];
function termoTexto() {
  return `
  <p><b>Termo de consentimento para tratamento de dados pessoais e de saúde</b> · versão ${TERMO_VERSAO}</p>
  <p>Ao usar o app da <b>Nexos Performance e Saúde</b> (assessoria esportiva de São Luís–MA, sob responsabilidade de Gabriel Vinícius e Orlando Borges), você autoriza o tratamento dos seus dados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
  <p><b>Quais dados.</b> Nome, e-mail, telefone, data de nascimento, objetivo, treinos, cargas, check-ins e mensagens. Também dados de saúde, que a LGPD chama de dados sensíveis: respostas da anamnese e do PAR-Q, medidas da avaliação física, pressão arterial, frequência cardíaca, relatos de dor e fotos de progresso e de avaliação postural.</p>
  <p><b>Para quê.</b> Exclusivamente para prescrever, acompanhar e ajustar o seu treino com segurança, montar os relatórios de evolução e falar com você. Os seus dados não são vendidos nem usados para publicidade.</p>
  <p><b>Fotos.</b> Servem só para acompanhamento técnico. Ficam em área privada, visíveis apenas para você e para os treinadores da Nexos. Nenhuma foto é publicada ou usada em divulgação sem uma autorização separada e por escrito.</p>
  <p><b>Quem acessa.</b> Você e os treinadores da Nexos. Os dados ficam guardados em servidores da Supabase localizados em São Paulo (Brasil), com acesso protegido por senha e regras de segurança no banco de dados.</p>
  <p><b>Por quanto tempo.</b> Enquanto você for aluno e, depois disso, por até 5 anos para cumprir obrigações legais, salvo se você pedir a exclusão antes, nos casos em que a lei permite.</p>
  <p><b>Seus direitos.</b> Você pode, a qualquer momento, pedir acesso, correção, cópia ou exclusão dos seus dados e revogar este consentimento (art. 18 da LGPD), pelo e-mail ${esc(CONTATO.email)} ou pelo Instagram ${esc(CONTATO.insta)}. Sem o consentimento para dados de saúde não é possível acompanhar o seu treino pelo app.</p>
  <p>Detalhes completos na <a href="../privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</p>`;
}
// termo de responsabilidade e assunção de riscos (aceito por todo aluno, com versão e data)
function termoRiscosTexto() {
  return `
  <p><b>Termo de responsabilidade e assunção de riscos</b> · versão ${TERMO_VERSAO}</p>
  <p><b>Riscos da atividade.</b> Declaro que conheço os riscos próprios da prática de corrida, musculação e outros exercícios físicos, em treinos e em provas, como lesões musculares, articulares e ósseas, mal-estar, desidratação, alterações da pressão arterial, problemas cardíacos, quedas e acidentes e, em casos extremos, morte súbita. Pratico a atividade por livre escolha e assumo esses riscos.</p>
  <p><b>Saúde.</b> Declaro estar apto para a atividade física e que as informações da minha anamnese e do PAR-Q são verdadeiras e completas. Comprometo-me a informar à Nexos, antes do treino seguinte, qualquer mudança na minha saúde, lesão, dor, medicação ou sintoma, e a apresentar atestado médico de aptidão sempre que for recomendado ou solicitado.</p>
  <p><b>Orientações.</b> Comprometo-me a seguir as orientações dos treinadores, a respeitar os meus limites e a interromper o exercício e procurar atendimento médico diante de dor no peito, falta de ar fora do normal, tontura, desmaio ou qualquer sinal de alerta.</p>
  <p><b>Limites da responsabilidade.</b> A Nexos Performance e Saúde, seus sócios e treinadores não se responsabilizam por lesões, doenças, acidentes, danos materiais ou morte decorrentes: dos riscos próprios da atividade; de condições de saúde existentes ou não informadas; do descumprimento das orientações ou da alteração do treino por conta própria; de treinos feitos sem a supervisão presencial da Nexos; de provas e eventos organizados por terceiros; de trânsito, clima, terreno ou equipamentos; de alimentação, suplementação ou uso de medicamentos e substâncias sem orientação; ou de qualquer outro fato fora do controle da Nexos.</p>
  <p><b>Menores de idade.</b> Se o aluno tiver menos de 18 anos, este termo é aceito pelo seu responsável legal, que assume as declarações acima em nome dele.</p>`;
}
async function carregarSaude(force) {
  if (S.cache.saude && !force) return S.cache.saude;
  const [{ data: c }, { data: a }] = await Promise.all([
    sb
      .from('nx_consentimentos')
      .select('id,versao,aceito_em')
      .eq('org_id', S.org.id)
      .eq('aluno_id', S.user.id)
      .eq('versao', TERMO_VERSAO)
      .maybeSingle(),
    sb.from('nx_anamneses').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).maybeSingle(),
  ]);
  S.cache.saude = { termo: c || null, anamnese: a || null };
  return S.cache.saude;
}
function viewTermo() {
  $dock.hidden = true;
  layout('bare');
  const idade = S.me && S.me.nascimento ? idadeEm(S.me.nascimento) : null,
    menor = idade != null && idade < 18;
  $app.innerHTML = `
    <section class="login" style="justify-content:flex-start;padding-top:10px">
      <div class="row" style="gap:12px;margin-bottom:14px"><img src="${LOGO.s()}" alt="" style="width:44px">${slashes}</div>
      <p class="eyebrow">Antes de começar</p><h1 class="h1" style="margin-top:4px">Seus dados, suas regras</h1>
      <p class="muted small" style="margin:8px 0 14px">Para acompanhar seu treino com segurança precisamos guardar alguns dados de saúde e combinar algumas responsabilidades. Leia com calma:</p>
      <div class="card termo">${termoTexto()}</div>
      <div class="card termo" style="margin-top:12px">${termoRiscosTexto()}</div>
      <form id="f-termo" style="margin-top:16px">
        ${
          menor
            ? `<div class="card" style="margin-bottom:12px"><span class="eyebrow">Responsável legal</span><p class="small muted" style="margin:6px 0 10px">Como o aluno tem menos de 18 anos, os termos são aceitos pelo responsável.</p>
          <label class="field"><span>Nome completo do responsável</span><input class="input" name="resp_nome" required autocomplete="name"></label>
          <label class="field"><span>CPF do responsável</span><input class="input" name="resp_cpf" required data-mask="cpf" inputmode="numeric" placeholder="000.000.000-00" maxlength="14"></label></div>`
            : ''
        }
        <label class="aceite"><input type="checkbox" name="a" required><span>Li e concordo com o termo e com a Política de Privacidade.</span></label>
        <label class="aceite"><input type="checkbox" name="b" required><span>Autorizo, de forma específica e destacada, o tratamento dos meus dados de saúde e das minhas fotos para o acompanhamento do treino (art. 11, I, da LGPD).</span></label>
        <label class="aceite"><input type="checkbox" name="c" required><span>Li e aceito o termo de responsabilidade e assunção de riscos${menor ? ', como responsável legal do aluno' : ''}.</span></label>
        <button class="btn block" type="submit" style="margin-top:8px">Aceitar e continuar ${I.arrow}</button>
        <button class="btn ghost block" type="button" id="recusar" style="margin-top:8px">Não aceito</button>
      </form>
    </section>`;
  const f = document.getElementById('f-termo');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector('[type=submit]');
    b.disabled = true;
    const cpf = menor ? soDig(f.resp_cpf.value) : null;
    if (menor && cpf.length !== 11) {
      b.disabled = false;
      return toast('Confira o CPF do responsável (11 números).', true);
    }
    const { error } = await sb.from('nx_consentimentos').insert({
      org_id: S.org.id,
      aluno_id: S.user.id,
      versao: TERMO_VERSAO,
      dispositivo: navigator.userAgent.slice(0, 180),
      termo_riscos: true,
      responsavel_nome: menor ? f.resp_nome.value.trim() : null,
      responsavel_cpf: menor ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : null,
    });
    if (error && !/duplicate|unique/i.test(error.message || '')) {
      b.disabled = false;
      return toast('Não foi possível registrar. Tente de novo.', true);
    }
    await carregarSaude(true);
    router();
  };
  document.getElementById('recusar').onclick = () =>
    openSheet(
      `<div class="h2">Tudo bem</div><p class="muted" style="margin:10px 0 18px">Sem o seu consentimento não conseguimos usar o app para acompanhar o seu treino. Se tiver dúvidas sobre os seus dados, fale com o seu treinador ou escreva para ${esc(CONTATO.email)}.</p><button class="btn block" data-close>Voltar e ler de novo</button><button class="btn ghost block" id="sair-t" style="margin-top:8px">Sair</button>`,
      (r) => {
        r.querySelector('#sair-t').onclick = () => {
          closeSheet();
          sb.auth.signOut();
        };
      },
    );
}

/** ficha de anamnese + PAR-Q. alunoId/nome quando o treinador edita. */
/* ---------- formulários em etapas + máscaras de números ---------- */
const soDig = (v) => String(v || '').replace(/\D/g, '');
const MASCARA = {
  tel: (v) => {
    const d = soDig(v).slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    const dd = d.slice(0, 2),
      r = d.slice(2);
    if (d.length === 11) return `(${dd}) ${r[0]} ${r.slice(1, 5)}-${r.slice(5)}`;
    return r.length > 4 ? `(${dd}) ${r.slice(0, 4)}-${r.slice(4)}` : `(${dd}) ${r}`;
  },
  data: (v) => {
    const d = soDig(v).slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
  },
  hora: (v) => {
    const d = soDig(v).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
  },
  // altura em metros: 1 · 17 → 1,7 · 175 → 1,75
  altura: (v) => {
    const d = soDig(v).slice(0, 3);
    return d.length > 1 ? `${d[0]},${d.slice(1)}` : d;
  },
  peso: (v) => {
    const d = soDig(v).slice(0, 4);
    const n = d[0] === '1' || d[0] === '2' ? 3 : 2;
    return d.length > n ? `${d.slice(0, n)},${d[n]}` : d;
  }, // 88 · 885→88,5 · 105 · 1055→105,5
  num: (v, el) => soDig(v).slice(0, +(el && el.dataset.max) || 3),
  // tempo como no relógio: 2530 → 25:30 · 12530 → 1:25:30
  tempo: (v) => {
    const d = soDig(v)
      .replace(/^0+(?=\d{3})/, '')
      .slice(0, 6);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`;
    return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`;
  },
  // pace: 512 → 5:12 · 1005 → 10:05
  pace: (v) => {
    const d = soDig(v)
      .replace(/^0+(?=\d{3})/, '')
      .slice(0, 4);
    return d.length <= 2 ? d : `${d.slice(0, -2)}:${d.slice(-2)}`;
  },
  // número com vírgula (km, kg, cm, R$): aceita ponto ou vírgula e mostra vírgula
  // número com vírgula (km, kg, cm, R$): aceita ponto ou vírgula, mostra vírgula e limita o tamanho
  // data-int = dígitos antes da vírgula (padrão 4) · data-casas = depois (padrão 2); passou do limite sem vírgula, a vírgula entra sozinha
  dec: (v, el) => {
    const nI = +(el && el.dataset.int) || 4,
      nC = el && el.dataset.casas != null ? +el.dataset.casas : 2;
    let t = String(v || '')
      .replace(/\./g, ',')
      .replace(/[^\d,]/g, '');
    const i = t.indexOf(',');
    if (i < 0) return t.length > nI && nC ? `${t.slice(0, nI)},${t.slice(nI, nI + nC)}` : t.slice(0, nI);
    const a = t.slice(0, i).slice(0, nI),
      b = t
        .slice(i + 1)
        .replace(/,/g, '')
        .slice(0, nC);
    return nC ? `${a},${b}` : a;
  },
  // altura em cm: 175 · 1755 → 175,5
  cm: (v) => {
    const d = soDig(v).slice(0, 4);
    const n = d[0] === '1' || d[0] === '2' ? 3 : 2;
    return d.length > n ? `${d.slice(0, n)},${d[n]}` : d;
  },
  // circunferência em cm (pescoço, cintura, braço…): 38 · 385 → 38,5 · 102 · 1025 → 102,5
  circ: (v) => {
    const d = soDig(v).slice(0, 4);
    const n = d[0] === '1' ? 3 : 2;
    return d.length > n ? `${d.slice(0, n)},${d[n]}` : d;
  },
  cpf: (v) => {
    const d = soDig(v).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  },
};
// "25/03/1995" -> "1995-03-25" (ou '' se não for uma data válida)
const dataISO = (br) => {
  const m = String(br || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(iso + 'T12:00:00');
  return !isNaN(d) && d.getDate() === +m[1] && d.getMonth() + 1 === +m[2] ? iso : '';
};
const dataBR = (iso) =>
  /^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
function aplicarMascaras(root) {
  root.querySelectorAll('[data-mask]').forEach((el) => {
    const fn = MASCARA[el.dataset.mask];
    if (fn && el.value) el.value = fn(el.value, el);
  });
}
// vale para todos os campos com data-mask do app, em qualquer tela ou janela
document.addEventListener(
  'input',
  (e) => {
    const el = e.target;
    const fn = el && el.dataset && MASCARA[el.dataset.mask];
    if (fn) {
      const nv = fn(el.value, el);
      if (nv !== el.value) el.value = nv;
    }
  },
  true,
);
// mostra uma etapa por vez; "Próximo" só avança quando validar(etapa) não devolve erro
function etapas(form, validar, aoAvancar) {
  // aoAvancar(etapa): salva na hora o que não pode se perder se a pessoa sair no meio
  form.classList.add('wz');
  const enviar = form.querySelector('[type=submit]');
  const prog = document.createElement('div');
  prog.className = 'wz-prog';
  const nav = document.createElement('div');
  nav.className = 'wz-nav';
  nav.innerHTML = `<button type="button" class="btn ghost" data-wz="volta">${I.back} Voltar</button><button type="button" class="btn grow" data-wz="prox">Próximo ${I.arrow}</button>`;
  form.prepend(prog);
  enviar.before(nav);
  nav.append(enviar);
  enviar.classList.add('grow');
  enviar.classList.remove('block');
  const volta = nav.querySelector('[data-wz=volta]'),
    prox = nav.querySelector('[data-wz=prox]');
  let i = 0;
  const lista = () => [...form.querySelectorAll('.wz-step')].filter((x) => !x.hidden);
  const atual = () => {
    const L = lista();
    i = Math.max(0, Math.min(i, L.length - 1));
    return L[i];
  };
  const checar = () => {
    const L = lista(),
      el = atual();
    const ok = !validar(el);
    (i === L.length - 1 ? enviar : prox).classList.toggle('wz-bloq', !ok);
  };
  const pinta = (rolar) => {
    const L = lista(),
      el = atual();
    form.querySelectorAll('.wz-step').forEach((x) => x.classList.toggle('wz-on', x === el));
    prog.innerHTML = `<div class="wz-txt"><b>Etapa ${i + 1} de ${L.length}</b><span>${esc(el.dataset.titulo || '')}</span></div><div class="wz-bar">${L.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
    volta.hidden = i === 0;
    prox.hidden = i === L.length - 1;
    enviar.hidden = i !== L.length - 1;
    checar();
    if (rolar) {
      // a barra de etapas é fixa: rola até o começo do formulário (página ou painel)
      const sc = form.closest('.sheet'),
        y = form.getBoundingClientRect().top;
      if (sc) sc.scrollTop += y - sc.getBoundingClientRect().top - 8;
      else window.scrollTo(0, Math.max(0, y + window.scrollY - 8));
    }
  };
  prox.onclick = () => {
    const err = validar(atual());
    if (err) {
      toast(err.msg, true);
      const alvo = err.sel && atual().querySelector(err.sel);
      const box = alvo && alvo.closest('.field, .parq, .ficha-aceite, label, .card');
      if (box) {
        box.classList.add('wz-erro');
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => box.classList.remove('wz-erro'), 1600);
      }
      return;
    }
    if (aoAvancar) aoAvancar(atual());
    i++;
    pinta(true);
  };
  volta.onclick = () => {
    i--;
    pinta(true);
  };
  form.addEventListener('input', checar);
  form.addEventListener('change', () => setTimeout(() => pinta()));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && enviar.hidden) {
      e.preventDefault();
      prox.click();
    }
  });
  pinta();
  return { pinta };
}

async function viewAnamnese(opts = {}) {
  const staff = !!opts.alunoId;
  const alunoId = opts.alunoId || S.user.id;
  let a = opts.anamnese;
  if (a === undefined) {
    const { data } = await sb
      .from('nx_anamneses')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .maybeSingle();
    a = data;
  }
  const r = (a && a.respostas) || {};
  const pq = (a && a.parq) || {};
  const LPQ = parqLista(pq);
  const box = opts.box || $app;
  const cic = !staff && S.me.sexo === 'F' ? await buscarCiclo(S.user.id) : null;
  if (opts.gate) {
    $dock.hidden = true;
    layout('bare');
  }
  const sel = (name, val, ops) =>
    `<select class="input" name="${name}"><option value="">Selecione</option>${ops.map(([k, l]) => `<option value="${k}" ${val === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const sn = (name, val) =>
    `<div class="radios"><label><input type="radio" name="${name}" value="nao" ${val === 'nao' ? 'checked' : ''}><span>Não</span></label><label><input type="radio" name="${name}" value="sim" ${val === 'sim' ? 'checked' : ''}><span>Sim</span></label></div>`;
  box.innerHTML = `
    ${
      opts.gate
        ? `<div class="row" style="gap:12px;margin-bottom:14px"><img src="${LOGO.s()}" alt="" style="width:44px">${slashes}</div><p class="eyebrow">Passo 2 de 2</p><h1 class="h1" style="margin-top:4px">Sua ficha de saúde</h1><p class="muted small" style="margin:8px 0 4px">Leva uns 3 minutos. Com isso o seu treinador monta um treino seguro pra você.</p>`
        : staff
          ? ''
          : `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Minha saúde</p><h1 class="h1">Anamnese e PAR-Q</h1><p class="muted small" style="margin-top:6px">Mudou alguma coisa? Atualize aqui e o seu treinador é avisado.</p><div style="margin-top:14px">${atestadoHTML(a, false)}</div>`
    }
    <form id="f-ana" class="stack" style="margin-top:16px">
      <div class="card wz-step" data-k="parq" data-titulo="PAR-Q"><span class="eyebrow">${LPQ === PARQ ? 'PAR-Q' : 'PAR-Q+'} · prontidão para atividade física</span>
        <p class="tiny dim" style="margin:6px 0 4px">Responda com sinceridade. Uma resposta "sim" não impede o treino, mas pede uma conversa com o médico antes.</p>
        ${LPQ.map((q, i) => `<div class="parq"><p>${i + 1}. ${q}</p>${sn('q' + (i + 1), pq['q' + (i + 1)])}</div>`).join('')}
      </div>
      <div class="stack wz-step" data-k="objetivo" data-titulo="Sobre você e objetivo">
      <div class="card"><span class="eyebrow">Sobre você</span>
        ${!staff && !S.me.sexo ? `<div class="field" style="margin-top:12px"><span>Sexo</span><div class="radios"><label><input type="radio" name="sexo_al" value="F"><span>Feminino</span></label><label><input type="radio" name="sexo_al" value="M"><span>Masculino</span></label></div></div>` : ''}
        <div class="grid2" style="margin-top:12px"><label class="field"><span>Altura</span><div class="un-wrap"><input class="input" name="altura" data-mask="altura" inputmode="numeric" placeholder="1,75" value="${esc(r.altura || '')}"><i>m</i></div></label><label class="field"><span>Peso</span><div class="un-wrap"><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="70" value="${esc(r.peso || '')}"><i>kg</i></div></label></div></div>
      <div class="card"><span class="eyebrow">Objetivo e rotina</span>
        <label class="field" style="margin-top:12px"><span>Objetivo principal</span>${sel('objetivo', r.objetivo, OBJETIVOS)}</label>
        <label class="field"><span>Conte mais sobre o seu objetivo (opcional)</span><input class="input" name="objetivo_txt" value="${esc(r.objetivo_txt || '')}" placeholder="Ex.: correr 10 km abaixo de 55 min"></label>
        <label class="field"><span>Experiência com treino</span>${sel('experiencia', r.experiencia, [
          ['nunca', 'Nunca treinei'],
          ['parado', 'Parado há mais de 6 meses'],
          ['iniciante', 'Treino há menos de 1 ano'],
          ['intermediario', 'Treino de 1 a 3 anos'],
          ['avancado', 'Treino há mais de 3 anos'],
        ])}</label>
        <label class="field"><span>Atividades que pratica hoje</span><input class="input" name="atividades" value="${esc(r.atividades || '')}" placeholder="Ex.: corrida 3x por semana, futebol no sábado"></label>
        <div class="grid2"><label class="field"><span>Dias por semana para treinar</span>${sel(
          'dias',
          r.dias,
          [1, 2, 3, 4, 5, 6, 7].map((n) => [String(n), n + (n === 1 ? ' dia' : ' dias')]),
        )}</label><label class="field"><span>Tempo por treino</span>${sel('tempo', r.tempo, [
          ['30', '30 min'],
          ['45', '45 min'],
          ['60', '1 hora'],
          ['90', '1h30 ou mais'],
        ])}</label></div>
        <div class="grid2"><label class="field"><span>Se corre: km por semana</span><input class="input" name="km_semana" data-mask="num" data-max="3" inputmode="numeric" value="${esc(r.km_semana || '')}"></label><label class="field"><span>Prova-alvo (se tiver)</span><input class="input" name="prova" value="${esc(r.prova || '')}" placeholder="Ex.: 10 km em março"></label></div>
      </div></div>
      <div class="card wz-step" data-k="saude" data-titulo="Histórico de saúde"><span class="eyebrow">Histórico de saúde</span>
        <div class="field" style="margin-top:12px"><span>Tem ou já teve alguma destas condições?</span><div class="chips wrap" id="doencas">${DOENCAS.map((d) => `<label class="chipc"><input type="checkbox" name="doencas" value="${d}" ${(r.doencas || []).includes(d) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div></div>
        <label class="field"><span>Detalhes das condições (se marcou alguma)</span><input class="input" name="doencas_txt" value="${esc(r.doencas_txt || '')}"></label>
        <label class="field"><span>Lesões atuais ou anteriores</span><input class="input" name="lesoes" value="${esc(r.lesoes || '')}" placeholder="Ex.: entorse no tornozelo direito em 2024"></label>
        <label class="field"><span>Sente alguma dor hoje? Onde?</span><input class="input" name="dores" value="${esc(r.dores || '')}" placeholder="Ex.: lombar ao acordar"></label>
        <label class="field"><span>Cirurgias</span><input class="input" name="cirurgias" value="${esc(r.cirurgias || '')}"></label>
        <label class="field"><span>Medicamentos de uso contínuo</span><input class="input" name="medicamentos" value="${esc(r.medicamentos || '')}"></label>
        <label class="field"><span>Alergias</span><input class="input" name="alergias" value="${esc(r.alergias || '')}"></label>
        <div class="field" id="gest-f" ${!staff && S.me.sexo === 'M' ? 'hidden' : ''}><span>Está gestante ou teve bebê nos últimos 6 meses?</span>${sn('gestante', r.gestante)}</div>
      </div>
      <div class="card wz-step" data-k="habitos" data-titulo="Hábitos"><span class="eyebrow">Hábitos</span>
        <div class="grid2" style="margin-top:12px"><div class="field"><span>Fuma?</span>${sn('fuma', r.fuma)}</div><label class="field"><span>Bebida alcoólica</span>${sel(
          'alcool',
          r.alcool,
          [
            ['nunca', 'Não bebo'],
            ['social', 'Às vezes'],
            ['frequente', 'Toda semana'],
          ],
        )}</label></div>
        <div class="grid2"><label class="field"><span>Horas de sono por noite</span>${sel('sono_h', r.sono_h, [
          ['5', 'Até 5 h'],
          ['6', '6 h'],
          ['7', '7 h'],
          ['8', '8 h ou mais'],
        ])}</label><label class="field"><span>Qualidade do sono</span>${sel('sono_q', r.sono_q, [
          ['boa', 'Boa'],
          ['regular', 'Regular'],
          ['ruim', 'Ruim'],
        ])}</label></div>
        <label class="field"><span>Nível de estresse no dia a dia</span>${sel('estresse', r.estresse, [
          ['baixo', 'Baixo'],
          ['medio', 'Médio'],
          ['alto', 'Alto'],
        ])}</label>
      </div>
      ${
        !staff && S.me.sexo !== 'M'
          ? `<div class="card wz-step" data-k="ciclo" data-titulo="Ciclo menstrual" id="ciclo-card" ${S.me.sexo === 'F' ? '' : 'hidden'}><span class="eyebrow">Ciclo menstrual · opcional</span>
        <p class="tiny dim" style="margin:6px 0 10px">Ajuda o seu treinador a ajustar a intensidade de acordo com a fase do ciclo. Só você e os treinadores da Nexos veem.</p>
        <label class="aceite"><input type="checkbox" name="cic_on" ${cic && cic.ativo ? 'checked' : ''}><span>Quero acompanhar o meu ciclo no app</span></label>
        <div id="cic-campos" ${cic && cic.ativo ? '' : 'hidden'}>
          <label class="field" style="margin-top:12px"><span>Como é o seu ciclo?</span>${sel('cic_sit', cic ? cic.situacao : 'regular', SIT_CICLO)}</label>
          <div id="cic-datas">
            <label class="field"><span>Início da última menstruação</span><input class="input" name="cic_ini" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa" value="${cic && cic.inicios && cic.inicios[0] ? dataBR(cic.inicios[0]) : ''}"></label>
            <div class="grid2"><label class="field"><span>Duração média do ciclo (dias)</span><input class="input" name="cic_cl" data-mask="num" data-max="2" inputmode="numeric" value="${cic ? cic.duracao_ciclo : 28}"></label><label class="field"><span>Dias de menstruação</span><input class="input" name="cic_dm" data-mask="num" data-max="2" inputmode="numeric" value="${cic ? cic.duracao_menstr : 5}"></label></div>
          </div>
          <p class="tiny dim">Ao marcar, você concorda que esses dados de saúde sejam usados só para orientar o seu treino (LGPD, art. 11). Pode desativar quando quiser, e os registros são apagados.</p>
        </div>
      </div>`
          : ''
      }
      <div class="card wz-step" data-k="emerg" data-titulo="Contato de emergência"><span class="eyebrow">Contato de emergência</span><p class="tiny dim" style="margin:6px 0 0">Quem a gente avisa se acontecer alguma coisa no treino.</p>
        <div class="grid2" style="margin-top:12px"><label class="field"><span>Nome</span><input class="input" name="emerg_nome" value="${esc(r.emerg_nome || '')}"></label><label class="field"><span>Telefone</span><input class="input" name="emerg_tel" data-mask="tel" inputmode="numeric" placeholder="(98) 9 9999-9999" value="${esc(r.emerg_tel || '')}"></label></div>
      </div>
      <button class="btn block" type="submit">${opts.gate ? 'Concluir e começar' : 'Salvar ficha'} ${I.check}</button>
    </form>`;
  const f = box.querySelector('#f-ana');
  if (!staff && !opts.gate && a)
    bindAtestado(box, a, alunoId, () => {
      const el = box.querySelector('#atestado-box');
      if (el) {
        el.outerHTML = atestadoHTML(a, false);
        bindAtestado(box, a, alunoId);
      }
    });
  const cc = box.querySelector('#ciclo-card');
  if (cc) {
    const mostrar = () => {
      cc.querySelector('#cic-campos').hidden = !f.cic_on.checked;
      const sit = f.cic_sit.value;
      cc.querySelector('#cic-datas').hidden = sit === 'contraceptivo' || sit === 'nao_menstrua';
    };
    f.cic_on.onchange = mostrar;
    f.cic_sit.onchange = mostrar;
    mostrar();
    f.querySelectorAll('[name=sexo_al]').forEach(
      (x) =>
        (x.onchange = () => {
          cc.hidden = f.sexo_al.value !== 'F';
          if (cc.hidden) f.cic_on.checked = false;
          mostrar();
        }),
    );
  }
  aplicarMascaras(f);
  f.querySelectorAll('[name=sexo_al]').forEach((x) =>
    x.addEventListener('change', () => {
      f.querySelector('#gest-f').hidden = f.sexo_al.value === 'M';
    }),
  );
  if (!staff) {
    const vz = (n) => !f.querySelector(`[name="${n}"]`) || String(new FormData(f).get(n) || '').trim();
    etapas(
      f,
      (el) => {
        const fd = new FormData(f),
          k = el.dataset.k;
        if (k === 'parq') {
          const q = LPQ.findIndex((_, i) => !fd.get('q' + (i + 1)));
          return q >= 0 ? { msg: `Responda a pergunta ${q + 1} do PAR-Q.`, sel: `[name=q${q + 1}]` } : null;
        }
        if (k === 'objetivo') {
          if (f.querySelector('[name=sexo_al]') && !fd.get('sexo_al'))
            return { msg: 'Marque o seu sexo.', sel: '[name=sexo_al]' };
          const al = String(fd.get('altura') || '');
          if (al && !/^[12],\d{2}$/.test(al)) return { msg: 'Confira a altura (ex.: 1,75).', sel: '[name=altura]' };
          for (const [n, m] of [
            ['objetivo', 'Escolha o seu objetivo principal.'],
            ['experiencia', 'Escolha a sua experiência com treino.'],
            ['dias', 'Escolha quantos dias por semana pode treinar.'],
            ['tempo', 'Escolha o tempo por treino.'],
          ])
            if (!vz(n)) return { msg: m, sel: `[name=${n}]` };
          return null;
        }
        if (k === 'saude') {
          if (!fd.get('gestante') && !f.querySelector('#gest-f').hidden)
            return { msg: 'Responda sobre gestação.', sel: '[name=gestante]' };
          return null;
        }
        if (k === 'habitos') {
          for (const [n, m] of [
            ['fuma', 'Responda se fuma.'],
            ['alcool', 'Responda sobre bebida alcoólica.'],
            ['sono_h', 'Escolha as horas de sono.'],
            ['sono_q', 'Escolha a qualidade do sono.'],
            ['estresse', 'Escolha o nível de estresse.'],
          ])
            if (!vz(n)) return { msg: m, sel: `[name=${n}]` };
          return null;
        }
        if (k === 'ciclo') {
          if (!f.cic_on.checked) return null;
          const sit = f.cic_sit.value;
          if (sit === 'contraceptivo' || sit === 'nao_menstrua') return null;
          const d = dataISO(f.cic_ini.value);
          return !d || d > hojeISO()
            ? { msg: 'Confira a data do início da última menstruação (dd/mm/aaaa).', sel: '[name=cic_ini]' }
            : null;
        }
        if (k === 'emerg') {
          if (String(fd.get('emerg_nome') || '').trim().length < 2)
            return { msg: 'Escreva o nome do contato de emergência.', sel: '[name=emerg_nome]' };
          if (soDig(fd.get('emerg_tel')).length < 10)
            return { msg: 'Confira o telefone com DDD.', sel: '[name=emerg_tel]' };
          return null;
        }
        return null;
      },
      (el) => {
        if (el.dataset.k === 'ciclo') salvarCiclo();
      },
    ); // o ciclo é salvo já ao passar da etapa
  }
  const salvarCiclo = async () => {
    if (!cc || cc.hidden) return true;
    if (!f.cic_on.checked) {
      if (cic) {
        await sb.from('nx_ciclo_inicios').delete().eq('aluno_id', S.user.id);
        await sb.from('nx_ciclo_dias').delete().eq('aluno_id', S.user.id);
        await sb.from('nx_ciclo').delete().eq('aluno_id', S.user.id);
      }
      return true;
    }
    const sit = f.cic_sit.value || 'regular',
      semData = sit === 'contraceptivo' || sit === 'nao_menstrua';
    const cl = Math.min(45, Math.max(20, parseInt(f.cic_cl.value, 10) || 28)),
      dm = Math.min(10, Math.max(2, parseInt(f.cic_dm.value, 10) || 5));
    const ini = dataISO(f.cic_ini.value);
    if (!semData && (!ini || ini > hojeISO())) {
      toast('Confira a data do início da última menstruação.', true);
      return false;
    }
    const { error } = await sb.from('nx_ciclo').upsert(
      {
        aluno_id: S.user.id,
        org_id: S.org.id,
        ativo: true,
        situacao: sit,
        duracao_ciclo: cl,
        duracao_menstr: dm,
        consentimento_em: (cic && cic.consentimento_em) || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'aluno_id' },
    );
    if (error) {
      toast('Não foi possível salvar o ciclo.', true);
      return false;
    }
    if (!semData)
      await sb
        .from('nx_ciclo_inicios')
        .upsert({ org_id: S.org.id, aluno_id: S.user.id, data: ini }, { onConflict: 'aluno_id,data' });
    return true;
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const parq = {};
    let falta = 0;
    LPQ.forEach((_, i) => {
      const v = fd.get('q' + (i + 1));
      if (!v) falta++;
      parq['q' + (i + 1)] = v || null;
    });
    if (LPQ === PARQ_PLUS) parq.v = 'plus';
    if (falta) return toast('Responda todas as perguntas do PAR-Q.', true);
    const resp = {};
    [
      'altura',
      'peso',
      'objetivo',
      'objetivo_txt',
      'experiencia',
      'atividades',
      'dias',
      'tempo',
      'km_semana',
      'prova',
      'doencas_txt',
      'lesoes',
      'dores',
      'cirurgias',
      'medicamentos',
      'alergias',
      'gestante',
      'fuma',
      'alcool',
      'sono_h',
      'sono_q',
      'estresse',
      'emerg_nome',
      'emerg_tel',
    ].forEach((k) => {
      const v = String(fd.get(k) || '').trim();
      if (v) resp[k] = v;
    });
    resp.doencas = fd.getAll('doencas');
    const positivo = Object.values(parq).includes('sim');
    const btn = f.querySelector('[type=submit]');
    btn.disabled = true;
    if (f.sexo_al && f.sexo_al.value) {
      await sb.rpc('nx_definir_sexo', { p_sexo: f.sexo_al.value }).then(
        () => {},
        () => {},
      );
      S.me.sexo = f.sexo_al.value;
    }
    if (!(await salvarCiclo())) {
      btn.disabled = false;
      return;
    }
    const row = {
      parq,
      parq_positivo: positivo,
      respostas: resp,
      atualizado_em: new Date().toISOString(),
      visto_treinador: staff,
    };
    let id = a && a.id,
      error;
    if (id) ({ error } = await sb.from('nx_anamneses').update(row).eq('id', id));
    else {
      const q = await sb
        .from('nx_anamneses')
        .insert({ ...row, org_id: S.org.id, aluno_id: alunoId })
        .select('id')
        .single();
      error = q.error;
      id = q.data && q.data.id;
    }
    if (error) {
      btn.disabled = false;
      return toast('Não foi possível salvar a ficha.', true);
    }
    if (!staff) notificar('anamnese', id);
    toast('Ficha salva!');
    if (staff) return opts.onSave && opts.onSave();
    await carregarSaude(true);
    const seguir = () => {
      const alvo = opts.gate ? '#/' : '#/perfil';
      if (location.hash === alvo || (alvo === '#/' && !location.hash)) router();
      else location.hash = alvo;
    };
    if (positivo) {
      box.innerHTML = `<section class="login center">${estIc(I.saude)}<h1 class="h1" style="margin-top:8px">Converse com um médico</h1>
        <p class="muted" style="margin:12px 0 18px">Você respondeu "sim" em pelo menos uma pergunta do PAR-Q. Antes de começar ou aumentar a intensidade dos treinos, procure um médico para uma avaliação. Seu treinador já foi avisado e vai ajustar o treino com você.</p>
        <div style="text-align:left;width:100%">${atestadoHTML({ id, parq_positivo: true, atestado_path: a && a.atestado_path, atestado_em: a && a.atestado_em }, false)}</div>
        <button class="btn" id="seguir" style="margin-top:16px">${a && a.atestado_path ? 'Continuar' : 'Enviar depois e continuar'}</button></section>`;
      bindAtestado(
        box,
        { id, parq_positivo: true, atestado_path: a && a.atestado_path, atestado_em: a && a.atestado_em },
        alunoId,
        seguir,
      );
      box.querySelector('#seguir').onclick = seguir;
      window.scrollTo(0, 0);
      return;
    }
    seguir();
  };
}
// atestado médico (quando o PAR-Q tem "sim"): foto ou PDF guardado na área privada
function atestadoHTML(a, staff) {
  if (!a || !a.parq_positivo) return '';
  const ok = !!a.atestado_path;
  return `<div class="card atestado ${ok ? 'ok' : ''}" id="atestado-box"><div><div>
    <span class="eyebrow">Atestado médico</span>
    <b style="display:block;margin-top:2px">${ok ? `Enviado em ${fmtDia(a.atestado_em)}` : staff ? 'Ainda não enviado' : 'Envie o seu atestado de aptidão'}</b>
    <p class="small muted" style="margin-top:4px">${ok ? (staff ? 'Liberação médica guardada na área privada do aluno.' : 'Obrigado. O seu treinador já pode ver a liberação.') : staff ? 'O PAR-Q teve “sim”. Peça a liberação médica antes de intensificar o treino.' : 'Como o PAR-Q teve “sim”, envie o atestado do seu médico liberando a atividade física (foto ou PDF).'}</p>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${ok ? '<button type="button" class="btn ghost sm" data-at="ver">Ver atestado</button>' : ''}${!staff ? `<label class="btn ${ok ? 'ghost' : ''} sm" style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg> ${ok ? 'Trocar' : 'Enviar atestado'}<input type="file" accept="image/*,application/pdf" data-at="arq" hidden></label>` : ''}</div>
  </div></div></div>`;
}
function bindAtestado(box, a, alunoId, aoMudar) {
  const el = box && box.querySelector('#atestado-box');
  if (!el) return;
  const ver = el.querySelector('[data-at="ver"]');
  if (ver)
    ver.onclick = async () => {
      const { data, error } = await sb.storage.from('nx-fotos').createSignedUrl(a.atestado_path, 600);
      if (error || !data) return toast('Não foi possível abrir o atestado.', true);
      window.open(data.signedUrl, '_blank', 'noopener');
    };
  const inp = el.querySelector('[data-at="arq"]');
  if (inp)
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const pdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
      if (pdf && f.size > 5 * 1024 * 1024) return toast('O PDF passa de 5 MB. Envie uma foto do atestado.', true);
      const lb = inp.closest('label');
      lb.classList.add('carregando');
      lb.firstChild && (lb.childNodes[1].textContent = ' Enviando…');
      try {
        const corpo = pdf ? f : await comprimirImagem(f, 2000);
        const caminho = `${S.org.id}/${alunoId}/atestado-${Date.now()}.${pdf ? 'pdf' : 'jpg'}`;
        const { error } = await sb.storage
          .from('nx-fotos')
          .upload(caminho, corpo, { contentType: pdf ? 'application/pdf' : 'image/jpeg', upsert: false });
        if (error) throw error;
        const quando = new Date().toISOString();
        const { error: e2 } = await sb
          .from('nx_anamneses')
          .update({ atestado_path: caminho, atestado_em: quando, visto_treinador: false })
          .eq('id', a.id);
        if (e2) throw e2;
        a.atestado_path = caminho;
        a.atestado_em = quando;
        notificar('anamnese', a.id);
        toast('Atestado enviado! O seu treinador foi avisado.');
        aoMudar ? aoMudar() : ((el.outerHTML = atestadoHTML(a, false)), bindAtestado(box, a, alunoId));
      } catch (e) {
        console.error(e);
        toast('Não foi possível enviar. Verifique a internet e tente de novo.', true);
        lb.classList.remove('carregando');
      }
    };
}
function anamneseResumoHTML(a, termo) {
  const termoH =
    (termo
      ? `<span class="tag ok">Termo aceito em ${fmtDia(termo.aceito_em)} · v${esc(termo.versao)}</span>${termo.termo_riscos ? '<span class="tag ok">Assunção de riscos aceita</span>' : '<span class="tag warn">Falta aceitar o termo de riscos</span>'}${termo.responsavel_nome ? `<span class="tag">Responsável: ${esc(termo.responsavel_nome)}</span>` : ''}`
      : '<span class="tag warn">Termo ainda não aceito</span>') +
    (a && a.parq_positivo
      ? a.atestado_path
        ? '<span class="tag ok">Atestado enviado</span>'
        : '<span class="tag err">Sem atestado médico</span>'
      : '');
  if (!a)
    return `<div class="row" style="gap:6px;flex-wrap:wrap">${termoH}</div><div class="empty" style="margin-top:12px"><div class="h3">Ficha ainda não preenchida</div><p class="small">O aluno preenche a anamnese no primeiro acesso ao app. Você também pode preencher junto com ele.</p></div>`;
  const r = a.respostas || {};
  const nomeOp = (lista, v) => (lista.find((x) => x[0] === v) || [, v])[1];
  const linha = (l, v) => (v ? `<div><span>${l}</span><b>${esc(v)}</b></div>` : '');
  const sim = parqLista(a.parq)
    .map((q, i) => [i + 1, q, (a.parq || {})['q' + (i + 1)]])
    .filter((x) => x[2] === 'sim');
  return `<div class="row" style="gap:6px;flex-wrap:wrap">${termoH}<span class="tag">Atualizada ${quando(a.atualizado_em)}</span></div>
    <div class="card" style="margin-top:12px;${a.parq_positivo ? 'border-color:rgba(255,207,92,.45)' : ''}"><span class="eyebrow" style="${a.parq_positivo ? 'color:var(--warn)' : ''}">PAR-Q ${a.parq_positivo ? '· atenção' : '· sem alterações'}</span>
      ${a.parq_positivo ? `<p class="small" style="margin:6px 0 8px">Respondeu <b>sim</b> em:</p>${sim.map(([n, q]) => `<p class="small" style="margin-top:6px">${icT(I.alerta, 'warn')}${n}. ${q}</p>`).join('')}<p class="tiny dim" style="margin-top:12px">Recomendado pedir liberação médica antes de intensificar o treino.</p>` : '<p class="small muted" style="margin-top:6px">Respondeu "não" a todas as perguntas.</p>'}
    </div>
    ${atestadoHTML(a, true)}
    <div class="card"><span class="eyebrow">Ficha</span><div class="kv" style="margin-top:8px">
      ${linha('Altura e peso', [r.altura && r.altura + ' m', r.peso && r.peso + ' kg'].filter(Boolean).join(' · '))}
      ${linha('Objetivo', [nomeOp(OBJETIVOS, r.objetivo), r.objetivo_txt].filter(Boolean).join(' · '))}
      ${linha('Experiência', { nunca: 'Nunca treinou', parado: 'Parado há mais de 6 meses', iniciante: 'Menos de 1 ano', intermediario: '1 a 3 anos', avancado: 'Mais de 3 anos' }[r.experiencia])}
      ${linha('Pratica hoje', r.atividades)}
      ${linha('Disponibilidade', [r.dias && r.dias + 'x por semana', r.tempo && r.tempo + ' min'].filter(Boolean).join(' · '))}
      ${linha('Corrida', [r.km_semana && r.km_semana + ' km/semana', r.prova].filter(Boolean).join(' · '))}
      ${linha('Condições', [(r.doencas || []).join(', '), r.doencas_txt].filter(Boolean).join(' · '))}
      ${linha('Lesões', r.lesoes)}${linha('Dor atual', r.dores)}${linha('Cirurgias', r.cirurgias)}${linha('Medicamentos', r.medicamentos)}${linha('Alergias', r.alergias)}
      ${r.gestante === 'sim' ? linha('Gestação/pós-parto', 'Sim') : ''}
      ${linha('Fuma', r.fuma === 'sim' ? 'Sim' : r.fuma === 'nao' ? 'Não' : '')}${linha('Álcool', { nunca: 'Não bebe', social: 'Às vezes', frequente: 'Toda semana' }[r.alcool])}
      ${linha('Sono', [r.sono_h && r.sono_h + ' h', { boa: 'boa qualidade', regular: 'qualidade regular', ruim: 'qualidade ruim' }[r.sono_q]].filter(Boolean).join(' · '))}${linha('Estresse', { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }[r.estresse])}
      ${linha('Emergência', [r.emerg_nome, r.emerg_tel].filter(Boolean).join(' · '))}
    </div></div>
    <button class="btn ghost block" id="editar-ana" style="margin-top:12px">Editar ficha</button>`;
}
