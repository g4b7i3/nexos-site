/* Nexos App · Mural da Nexos e conversa dentro de cada treino.
   Mural: recados da equipe (fixados primeiro), WhatsApp do treinador e Instagram. A equipe publica, o aluno vê.
   Conversa do treino: bate-papo ligado a um treino (planilha de corrida, corrida feita ou treino de força),
   separado da conversa geral, com aviso para o outro lado (nx-push, acao treino_msg). */

const MURAL_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const PIN_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z"/></svg>';
const INSTA_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>';
const CT_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14.5h4"/></svg>';
const NEXOS_INSTA = 'nexos.perform';
const MURAL_MAX_FIXADOS = 3;
const MURAL_MAX_OUTROS = 8;

/* ---------- mural ---------- */
async function muralBuscar() {
  const { data } = await sb
    .from('nx_recados')
    .select('*')
    .eq('org_id', S.org.id)
    .order('fixado', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(MURAL_MAX_FIXADOS + MURAL_MAX_OUTROS + 10);
  const l = data || [];
  // organizado: os fixados e só os recados mais recentes
  return [...l.filter((r) => r.fixado), ...l.filter((r) => !r.fixado).slice(0, MURAL_MAX_OUTROS)];
}
function recadoHTML(r, staff) {
  const longo = (r.texto || '').length > 220;
  return `<article class="card mr-card ${r.fixado ? 'fixo' : ''}" data-rec="${r.id}">
    <div class="row between" style="gap:8px"><span class="tiny dim">${fmtDia(r.criado_em)}</span>${r.fixado ? `<span class="mr-pin">${PIN_IC} Fixado</span>` : ''}</div>
    <h3 class="h3" style="margin-top:4px">${esc(r.titulo)}</h3>
    ${r.texto ? `<p class="mr-txt ${longo ? 'curto' : ''}">${esc(r.texto)}</p>${longo ? '<button type="button" class="link-btn small mr-mais">Ver tudo</button>' : ''}` : ''}
    ${r.imagem_url ? `<img class="mr-img" src="${esc(r.imagem_url)}" alt="" loading="lazy">` : ''}
    ${staff ? `<div class="row mr-ac"><button type="button" class="link-btn small" data-rec-ed="${r.id}">Editar</button><button type="button" class="link-btn small" data-rec-fix="${r.id}">${r.fixado ? 'Desafixar' : 'Fixar no topo'}</button><button type="button" class="link-btn small danger" data-rec-del="${r.id}">Apagar</button></div>` : ''}
  </article>`;
}
async function viewMural() {
  loading();
  const [recs, cont] = await Promise.all([
    muralBuscar().catch(() => []),
    sb.rpc('nx_contatos_equipe', { p_org: S.org.id }).then(
      (r) => r.data || [],
      () => [],
    ),
  ]);
  if (recs[0])
    store.set(
      'nx-mural-visto',
      recs.reduce((a, r) => (r.criado_em > a ? r.criado_em : a), ''),
    );
  // aluno: o WhatsApp dos treinadores dele; equipe: os dois, para conferir como o aluno vê
  const ids = S.staff
    ? cont.map((p) => p.user_id)
    : [S.me.treinador_id, S.me.treinador_corrida_id, S.me.treinador_forca_id].filter(
        (x, i, a) => x && a.indexOf(x) === i,
      );
  const trs = ids.map((id) => cont.find((p) => p.user_id === id)).filter((p) => p && telWa(p.telefone));
  const zap = (p) =>
    `<a class="mr-ct wa" href="https://wa.me/${telWa(p.telefone)}" target="_blank" rel="noopener">${I.wa}<span>WhatsApp<b>${esc(firstName(p.nome))}</b></span></a>`;
  $app.innerHTML = `<section class="mr-topo"><img src="${LOGO.s()}" alt=""><div><p class="eyebrow">Nexos</p><h1 class="h2">Performance e Saúde</h1><p class="small muted">Assessoria esportiva · São Luís, MA</p></div></section>
    <div class="mr-cts">${trs.map(zap).join('')}<a class="mr-ct ig" href="https://instagram.com/${NEXOS_INSTA}" target="_blank" rel="noopener">${INSTA_IC}<span>Instagram<b>@${NEXOS_INSTA}</b></span></a></div>
    <div class="section"><div class="section-h"><h2 class="h2">Mural de recados</h2>${S.staff ? `<button class="btn sm" id="mr-novo">${I.plus} Novo recado</button>` : ''}</div>
    <div class="stack" id="mr-lista">${recs.length ? recs.map((r) => recadoHTML(r, S.staff)).join('') : `<div class="empty"><div class="h3">Nenhum recado por enquanto</div><p class="small">${S.staff ? 'Publique avisos, treinões e novidades da Nexos. Os alunos recebem uma notificação.' : 'Os avisos da equipe aparecem aqui.'}</p></div>`}</div></div>`;
  const novo = document.getElementById('mr-novo');
  if (novo) novo.onclick = () => recadoForm(null);
  document.getElementById('mr-lista').onclick = async (e) => {
    const mais = e.target.closest('.mr-mais');
    if (mais) {
      mais.previousElementSibling.classList.remove('curto');
      mais.remove();
      return;
    }
    const ed = e.target.closest('[data-rec-ed]'),
      fx = e.target.closest('[data-rec-fix]'),
      dl = e.target.closest('[data-rec-del]');
    const r = recs.find((x) => x.id === (ed || fx || dl || {}).dataset?.[ed ? 'recEd' : fx ? 'recFix' : 'recDel']);
    if (!r) return;
    if (ed) return recadoForm(r);
    if (fx) {
      if (!r.fixado && recs.filter((x) => x.fixado).length >= MURAL_MAX_FIXADOS)
        return toast(`Até ${MURAL_MAX_FIXADOS} recados fixados. Desafixe um antes.`, true);
      const { error } = await sb.from('nx_recados').update({ fixado: !r.fixado }).eq('id', r.id);
      if (error) return toast('Não foi possível salvar.', true);
      return viewMural();
    }
    if (dl)
      openSheet(
        `<div class="h2">Apagar o recado?</div><p class="small muted" style="margin-top:6px">“${esc(r.titulo)}” sai do mural de todos os alunos.</p>
        <button class="btn danger block" id="rd-ok" style="margin-top:14px">Apagar</button><button class="btn ghost block" data-close style="margin-top:8px">Cancelar</button>`,
        (box) =>
          (box.querySelector('#rd-ok').onclick = async () => {
            const { error } = await sb.from('nx_recados').delete().eq('id', r.id);
            if (error) return toast('Não foi possível apagar.', true);
            closeSheet();
            toast('Recado apagado.');
            viewMural();
          }),
      );
  };
}
function recadoForm(r) {
  const fixados = [...document.querySelectorAll('.mr-card.fixo')].length;
  openSheet(
    `<p class="eyebrow">Mural da Nexos</p><div class="h2" style="margin-top:4px">${r ? 'Editar recado' : 'Novo recado'}</div>
    <form id="rf" class="stack" style="margin-top:12px">
      <label class="field"><span>Título</span><input class="input" name="titulo" maxlength="120" required value="${esc(r ? r.titulo : '')}" placeholder="Ex.: Chegou a camisa nova da equipe"></label>
      <label class="field"><span>Texto</span><textarea class="textarea" name="texto" rows="4" maxlength="1500" placeholder="Tamanhos, valores, data, local...">${esc(r ? r.texto || '' : '')}</textarea></label>
      <label class="field"><span>Foto (opcional)</span><input type="file" name="foto" accept="image/*"></label>
      ${r && r.imagem_url ? '<label class="chk"><input type="checkbox" name="semfoto"> Tirar a foto atual</label>' : ''}
      <label class="chk"><input type="checkbox" name="fixado" ${r ? (r.fixado ? 'checked' : '') : ''} ${!r?.fixado && fixados >= MURAL_MAX_FIXADOS ? 'disabled' : ''}> Fixar no topo do mural${!r?.fixado && fixados >= MURAL_MAX_FIXADOS ? ` (já há ${MURAL_MAX_FIXADOS} fixados)` : ''}</label>
      ${r ? '' : '<label class="chk"><input type="checkbox" name="avisar" checked> Avisar os alunos com uma notificação</label>'}
      <button class="btn block" type="submit">${r ? 'Salvar' : 'Publicar'}</button>
    </form>`,
    (box) => {
      box.querySelector('#rf').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.currentTarget,
          bt = f.querySelector('[type=submit]');
        bt.disabled = true;
        try {
          let imagem_url = r ? r.imagem_url : null;
          if (f.semfoto && f.semfoto.checked) imagem_url = null;
          const arq = f.foto.files[0];
          if (arq) {
            const blob = await comprimirImagem(arq, 1280);
            const caminho = `${S.user.id}/recado-${Date.now()}.jpg`;
            const up = await sb.storage
              .from('nx-avatares')
              .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
            if (up.error) throw up.error;
            imagem_url = sb.storage.from('nx-avatares').getPublicUrl(caminho).data.publicUrl;
          }
          const dados = {
            titulo: f.titulo.value.trim(),
            texto: f.texto.value.trim() || null,
            imagem_url,
            fixado: !!f.fixado.checked,
          };
          if (r) {
            const { error } = await sb
              .from('nx_recados')
              .update({ ...dados, editado_em: new Date().toISOString() })
              .eq('id', r.id);
            if (error) throw error;
          } else {
            const { data, error } = await sb
              .from('nx_recados')
              .insert({ ...dados, org_id: S.org.id })
              .select('id')
              .single();
            if (error) throw error;
            if (f.avisar.checked) notificar('recado', data.id);
          }
          closeSheet();
          toast(r ? 'Recado atualizado.' : 'Recado publicado.');
          viewMural();
        } catch (err) {
          console.error(err);
          if (typeof reportarErro === 'function') reportarErro(err, 'mural da Nexos');
          bt.disabled = false;
          toast('Não foi possível salvar. Tente de novo.', true);
        }
      };
    },
  );
}
/** cartão pequeno na tela Hoje do aluno quando há recado novo no mural (some depois de abrir o mural) */
async function cartaoMural() {
  const el = document.getElementById('mural-hoje');
  if (!el || S.staff) return;
  const { data } = await sb
    .from('nx_recados')
    .select('id,titulo,criado_em')
    .eq('org_id', S.org.id)
    .gte('criado_em', new Date(Date.now() - 14 * 864e5).toISOString())
    .order('criado_em', { ascending: false })
    .limit(1);
  const r = (data || [])[0];
  const visto = store.get('nx-mural-visto') || '';
  if (!r || r.criado_em <= visto || !document.getElementById('mural-hoje')) return;
  el.innerHTML = `<a class="list-item msg-row" href="#/nexos"><span class="ativ-ic">${MURAL_IC}</span><div class="grow" style="min-width:0"><b>Novo no mural da Nexos</b><div class="small muted ellip">${esc(r.titulo)}</div></div>${I.chev}</a>`;
}

/* ---------- conversa dentro do treino ---------- */
// ref: 'plano:<id>' (treino da planilha de corrida, antes e depois de correr), 'corrida:<id>' (corrida fora da planilha)
// ou 'sessao:<id>' (treino de força feito)
const ctRefCorrida = (c) => (c.plano_id ? 'plano:' + c.plano_id : 'corrida:' + c.id);
function ctBotaoHTML(ref, alunoId, titulo) {
  return `<button type="button" class="ct-btn" data-ct="${ref}" data-ct-al="${alunoId}" data-ct-t="${esc(titulo || 'Treino')}">${CT_IC}<span>Conversa do treino</span><b class="ct-n" hidden></b></button>`;
}
// mostra quantas mensagens há em cada conversa da tela (e destaca as não lidas)
let ctContando = false;
async function ctContar(raiz) {
  const bts = [...(raiz || document).querySelectorAll('[data-ct]:not([data-ct-ok])')];
  if (!bts.length || ctContando || !S.org) return;
  ctContando = true;
  try {
    bts.forEach((b) => (b.dataset.ctOk = '1'));
    const refs = [...new Set(bts.map((b) => b.dataset.ct))];
    const { data } = await sb.from('nx_treino_msgs').select('ref,autor_id,lida_em').in('ref', refs);
    const por = {};
    (data || []).forEach((m) => {
      const x = (por[m.ref] = por[m.ref] || { n: 0, novas: 0 });
      x.n++;
      if (m.autor_id !== S.user.id && !m.lida_em) x.novas++;
    });
    bts.forEach((b) => {
      const x = por[b.dataset.ct];
      const n = b.querySelector('.ct-n');
      if (!x || !n) return;
      n.hidden = false;
      n.textContent = x.novas || x.n;
      b.classList.toggle('novo', !!x.novas);
    });
  } catch {
    /* a contagem é só um detalhe da tela */
  } finally {
    ctContando = false;
  }
}
// qualquer tela que tenha o botão ganha a contagem, sem cada tela precisar chamar
let ctObsT = 0;
new MutationObserver(() => {
  clearTimeout(ctObsT);
  ctObsT = setTimeout(() => ctContar(document), 350);
}).observe(document.getElementById('app'), { childList: true, subtree: true });
// o botão fica dentro de cartões clicáveis: abre a conversa sem disparar o clique do cartão
document.addEventListener(
  'click',
  (e) => {
    const b = e.target.closest('[data-ct]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    abrirConversaTreino(b.dataset.ct, b.dataset.ctAl, b.dataset.ctT);
  },
  true,
);
async function abrirConversaTreino(ref, alunoId, titulo) {
  openSheet(
    `<p class="eyebrow">${CT_IC} Conversa do treino</p><div class="h2" style="margin-top:4px">${esc(titulo || 'Treino')}</div>
    <p class="tiny dim" style="margin-top:4px">${S.staff ? 'Só você, a equipe e o aluno veem.' : 'Tire dúvidas e conte como foi. Seu treinador recebe na hora.'}</p>
    <div class="chat ct-chat" id="ct-chat"><p class="small muted">Carregando…</p></div>
    <form id="ct-f" class="ct-f"><textarea class="textarea" id="ct-t" rows="2" maxlength="2000" placeholder="${S.staff ? 'Responder ao aluno' : 'Escreva para o seu treinador'}"></textarea><button class="btn" type="submit">Enviar</button></form>`,
    async (box) => {
      const chat = box.querySelector('#ct-chat');
      const [equipe, alunoNome] = await Promise.all([
        carregarEquipe().catch(() => []),
        S.staff
          ? sb
              .from('nx_membros')
              .select('nome')
              .eq('org_id', S.org.id)
              .eq('user_id', alunoId)
              .maybeSingle()
              .then(
                (r) => (r.data && r.data.nome) || 'Aluno',
                () => 'Aluno',
              )
          : Promise.resolve(S.me.nome),
      ]);
      const nomeDe = (id) =>
        id === alunoId ? alunoNome : (equipe.find((p) => p.user_id === id) || {}).nome || 'Treinador';
      const carregar = async () => {
        const { data, error } = await sb
          .from('nx_treino_msgs')
          .select('*')
          .eq('ref', ref)
          .order('criado_em', { ascending: true });
        if (error) {
          chat.innerHTML = '<p class="small muted">Não foi possível carregar. Verifique a internet.</p>';
          return;
        }
        const ms = data || [];
        chat.innerHTML = ms.length
          ? ms
              .map((m) => {
                const meu = m.autor_id === S.user.id;
                return `<div class="bubble ${meu ? 'me' : ''}">${meu ? '' : `<span class="b-autor">${esc(firstName(nomeDe(m.autor_id)))}</span>`}<p>${esc(m.texto)}</p><span class="b-meta">${fmtDia(m.criado_em)} · ${fmtHora(m.criado_em)}</span></div>`;
              })
              .join('')
          : `<p class="small muted">${S.staff ? 'Nenhuma mensagem neste treino ainda.' : 'Nenhuma mensagem ainda. Ficou com dúvida ou quer contar como foi? Escreva aqui.'}</p>`;
        chat.scrollTop = chat.scrollHeight;
        // o que o outro lado escreveu passa a contar como lido
        if (ms.some((m) => m.autor_id !== S.user.id && !m.lida_em))
          sb.from('nx_treino_msgs')
            .update({ lida_em: new Date().toISOString() })
            .eq('ref', ref)
            .neq('autor_id', S.user.id)
            .is('lida_em', null)
            .then(
              () => {
                document.querySelectorAll(`[data-ct="${ref}"]`).forEach((b) => b.removeAttribute('data-ct-ok'));
                ctContar(document);
              },
              () => {},
            );
      };
      await carregar();
      box.querySelector('#ct-f').onsubmit = async (e) => {
        e.preventDefault();
        const ta = box.querySelector('#ct-t'),
          bt = e.currentTarget.querySelector('button');
        const texto = ta.value.trim();
        if (!texto) return;
        bt.disabled = true;
        const { data, error } = await sb
          .from('nx_treino_msgs')
          .insert({ org_id: S.org.id, aluno_id: alunoId, ref, titulo: titulo || null, texto })
          .select('id')
          .single();
        bt.disabled = false;
        if (error) return toast('Não foi possível enviar. Verifique a internet.', true);
        ta.value = '';
        notificar('treino_msg', data.id);
        await carregar();
        document.querySelectorAll(`[data-ct="${ref}"]`).forEach((b) => b.removeAttribute('data-ct-ok'));
        ctContar(document);
      };
    },
  );
}
/** abre a conversa a partir da notificação (#/conversa-treino/plano:<id>): mostra a tela Hoje e a conversa por cima */
async function viewConversaTreinoRota(ref) {
  if (S.staff) await staffHoje();
  else await alunoHoje();
  const { data } = await sb
    .from('nx_treino_msgs')
    .select('aluno_id,titulo')
    .eq('ref', ref)
    .order('criado_em', { ascending: false })
    .limit(1);
  const m = (data || [])[0];
  if (m) abrirConversaTreino(ref, m.aluno_id, m.titulo);
}
/** equipe: conversas de treino com mensagem do aluno ainda sem leitura (tela Retornos e Hoje) */
async function ctNaoLidasEquipe() {
  const { data } = await sb
    .from('nx_treino_msgs')
    .select('ref,aluno_id,titulo,texto,criado_em,autor_id')
    .eq('org_id', S.org.id)
    .is('lida_em', null)
    .order('criado_em', { ascending: false })
    .limit(100);
  const meus = typeof idsMeusAlunos === 'function' ? await idsMeusAlunos() : null;
  const por = {};
  (data || [])
    .filter((m) => m.autor_id === m.aluno_id && (!meus || meus.has(m.aluno_id)))
    .forEach((m) => {
      if (!por[m.ref]) por[m.ref] = { ...m, n: 0 };
      por[m.ref].n++;
    });
  return Object.values(por);
}
