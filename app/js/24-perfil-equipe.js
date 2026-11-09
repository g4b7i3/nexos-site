/* Nexos App · Perfil, equipe de treinadores e fotos.
   Parte 24 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= PERFIL (todos) ================= */
/* ---------- equipe (treinadores) e fotos ---------- */
async function carregarEquipe(forcar) {
  if (S.cache.equipe && !forcar) return S.cache.equipe;
  let data = null;
  try {
    const r = await sb.rpc('nx_equipe', { p_org: S.org.id });
    data = r.data;
  } catch (e) {
    console.error(e);
  }
  S.cache.equipe = data || [];
  return S.cache.equipe;
}
const fotoHTML = (p, cls = '') =>
  p && p.foto_url
    ? `<img class="foto ${cls}" src="${esc(p.foto_url)}" alt="${esc(p.nome || '')}" loading="lazy">`
    : `<span class="foto ini ${cls}">${esc(initials((p && p.nome) || 'N'))}</span>`;
const avAluno = (m, cls = '') =>
  `<div class="av ${cls} ${m && m.foto_url ? 'com-foto' : ''}">${m && m.foto_url ? `<img src="${esc(m.foto_url)}" alt="${esc((m && m.nome) || '')}" data-nome="${esc((m && m.nome) || '')}" loading="lazy">` : esc(initials((m && m.nome) || ''))}</div>`;
/** treinador toca na foto do aluno e vê a foto inteira, para reconhecer quem é */
function verFoto(src, nome) {
  const old = document.getElementById('foto-full');
  if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'foto-full';
  d.className = 'foto-full';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-label', nome ? `Foto de ${nome}` : 'Foto');
  d.innerHTML = `<button type="button" class="foto-full-x" aria-label="Fechar">${I.x}</button><img src="${esc(src)}" alt="${esc(nome || '')}">${nome ? `<p>${esc(nome)}</p>` : ''}`;
  const fechar = () => {
    d.remove();
    document.removeEventListener('keydown', esc1);
  };
  const esc1 = (e) => {
    if (e.key === 'Escape') fechar();
  };
  d.addEventListener('click', fechar);
  document.addEventListener('keydown', esc1);
  document.body.append(d);
  d.querySelector('button').focus();
}
document.addEventListener(
  'click',
  (e) => {
    if (!S.staff) return;
    const img = e.target.closest && e.target.closest('.av.com-foto img, .b-linha img.foto');
    if (!img || !img.getAttribute('src')) return;
    e.preventDefault();
    e.stopPropagation();
    verFoto(img.getAttribute('src'), img.dataset.nome || img.getAttribute('alt') || '');
  },
  true,
);
function reduzirImagem(file, lado = 512) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = c.height = lado;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, lado, lado);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error('img'))), 'image/jpeg', 0.86);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('img'));
    };
    img.src = url;
  });
}
async function trocarFoto(depois) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    try {
      toast('Enviando foto…');
      let blob;
      try {
        blob = await reduzirImagem(f);
      } catch {
        return toast('Não consegui ler essa imagem. Tente outra foto (JPG ou PNG).', true);
      }
      const caminho = `${S.user.id}/foto-${Date.now()}.jpg`;
      const { error } = await sb.storage
        .from('nx-avatares')
        .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (error) throw error;
      const url = sb.storage.from('nx-avatares').getPublicUrl(caminho).data.publicUrl;
      const { error: e2 } = await sb.rpc('nx_definir_foto', { p_url: url });
      if (e2) throw e2;
      S.me.foto_url = url;
      S.cache.equipe = null;
      toast(S.staff ? 'Foto atualizada! Os alunos já veem na conversa.' : 'Foto atualizada! Seu treinador já vê.');
      if (typeof depois === 'function') depois();
      else viewPerfil();
    } catch (e) {
      console.error(e);
      toast('Não foi possível enviar a foto. Verifique a internet e tente de novo.', true);
    }
  };
  inp.click();
}

function viewPerfil() {
  const papel = { admin: 'Administrador', treinador: 'Treinador', aluno: 'Aluno' }[S.me.papel];
  $app.innerHTML = `
    <a class="back" href="${S.staff ? '#/mais' : '#/'}">${I.back} Voltar</a>
    <p class="eyebrow">Perfil</p>
    <div class="row" style="margin-top:12px;gap:16px"><button class="foto-edit" id="trocar-foto" aria-label="Trocar foto">${fotoHTML(S.me, 'lg')}<i>${I.cam}</i></button><div class="grow"><div class="h2">${esc(S.me.nome)}</div><div class="small muted ellip">${esc(S.user.email)}</div><span class="tag acc" style="margin-top:6px">${papel} · ${esc(S.org.nome)}</span></div></div>
    <div class="perfil-grid"><div>
    <div class="section"><div class="section-h"><h2 class="h2">Minha conta</h2></div>
      <button type="button" class="list-item" id="trocar-foto2" style="width:100%;text-align:left"><span class="ativ-ic">${I.cam}</span><div class="grow"><b>Trocar foto</b><div class="small muted">Aparece para o seu ${S.staff ? 'aluno' : 'treinador'}</div></div>${I.chev}</button>
      <details class="list-item acc-item"><summary><span class="ativ-ic">${I.user}</span><div class="grow"><b>Trocar senha</b><div class="small muted">Toque para abrir</div></div>${I.chev}</summary>
        <form id="f-senha" style="margin-top:12px"><label class="field"><span>Nova senha</span><input class="input" type="password" name="s1" minlength="6" required autocomplete="new-password"></label><label class="field"><span>Repita a nova senha</span><input class="input" type="password" name="s2" minlength="6" required autocomplete="new-password"></label><button class="btn block">Salvar nova senha</button></form></details></div>
    ${S.staff ? '' : '<div class="section" id="meu-tr" hidden></div>'}
    ${
      S.staff
        ? ''
        : `<div class="section"><div class="section-h"><h2 class="h2">Saúde e pagamentos</h2></div>
      <a class="list-item" href="#/saude" style="color:inherit"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Minha ficha de saúde</b><div class="small muted">Anamnese e PAR-Q</div></div>${I.chev}</a>
      ${S.me.sexo !== 'M' ? `<button type="button" class="list-item" id="perf-ciclo" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic" style="color:#e85d75">${I.cal}</span><div class="grow"><b>Ciclo menstrual</b><div class="small muted">Registrar a menstruação ou ativar o acompanhamento</div></div>${I.chev}</button>` : ''}
      <a class="list-item" href="#/pagamentos" style="color:inherit"><span class="ativ-ic">${I.money}</span><div class="grow"><b>Pagamentos</b><div class="small muted">Mensalidades e Pix</div></div>${I.chev}</a>
      <a class="list-item" href="#/termo" style="color:inherit"><span class="ativ-ic">${I.ficha}</span><div class="grow"><b>Termo e meus dados</b><div class="small muted">O que guardamos e seus direitos (LGPD)</div></div>${I.chev}</a></div>`
    }
    ${S.me.papel === 'admin' ? `<div class="section"><div class="section-h"><h2 class="h2">Equipe</h2></div><div class="card"><p class="small muted">Adicione outro treinador da Nexos. Ele vai poder cadastrar alunos e montar treinos.</p><button class="btn ghost block" id="add-trein" style="margin-top:12px">${I.plus} Adicionar treinador</button><div id="eq-senhas" class="stack" style="margin-top:14px;gap:8px"></div></div></div>` : ''}
    </div><div>
    <div class="section"><div class="section-h"><h2 class="h2">Configurações</h2></div>
      <div id="notif"></div>
      <div class="card aparencia" style="margin-top:12px"><b>Aparência</b>
        <p class="small muted" style="margin-top:2px">Fundo</p>
        <div class="ap-fundos" id="tema">${[
          ['claro', 'Nexos padrão', 'Claro, melhor para ler no sol e na academia'],
          ['escuro', 'Escura', 'Fundo escuro, mais confortável à noite'],
        ]
          .map(
            ([k, l, d]) =>
              `<button type="button" data-tema="${k}" class="ap-fundo ${k} ${(document.documentElement.dataset.tema || 'claro') === k ? 'on' : ''}"><i></i><b>${l}</b><small>${d}</small></button>`,
          )
          .join('')}</div>
        <p class="small muted" style="margin-top:14px">Paletas de cor</p>
        <div class="ap-paletas" id="paleta">${PALETAS.map(([k, l, c1, c2]) => `<button type="button" data-paleta="${k}" class="${(document.documentElement.dataset.paleta || 'nexos') === k ? 'on' : ''}" aria-label="Paleta ${l}"><i style="background:linear-gradient(135deg,${c1} 0 45%,${c2} 55% 100%)"></i><span>${l}</span></button>`).join('')}</div>
        <p class="tiny dim" style="margin-top:8px">A paleta muda os botões, os destaques e os cartões. Fica salva neste celular.</p></div>
      <details class="list-item acc-item" style="margin-top:12px"><summary><span class="ativ-ic">${I.home}</span><div class="grow"><b>Instalar no celular</b><div class="small muted">Ter o app na tela de início</div></div>${I.chev}</summary><p class="small muted" style="margin-top:12px">No navegador, toque em “Compartilhar” ou no menu ⋮ e escolha “Adicionar à tela de início”.</p></details></div>
    <button class="btn danger block" id="sair" style="margin-top:16px">Sair da conta</button>
    <p class="tiny dim center" style="margin-top:16px">Nexos Performance e Saúde · app v1.9 · <a href="../privacidade.html" target="_blank" rel="noopener" class="dim">Política de Privacidade</a></p>
    </div></div>`;
  // confirma antes de sair, para ninguém sair da conta sem querer
  document.getElementById('sair').onclick = () =>
    openSheet(
      `<div class="h2">Sair da conta?</div><p class="muted" style="margin:10px 0 18px">Tem certeza que deseja sair? Para voltar, você vai precisar entrar de novo com o seu e-mail e a sua senha.</p>
      <button class="btn danger block" id="sair-sim">Sim, sair da conta</button><button class="btn ghost block" data-close style="margin-top:8px">Cancelar</button>`,
      (r) => {
        r.querySelector('#sair-sim').onclick = async () => {
          closeSheet();
          await sb.auth.signOut();
          location.hash = '#/';
        };
      },
    );
  const tf = document.getElementById('trocar-foto');
  if (tf) tf.onclick = trocarFoto;
  const tf2 = document.getElementById('trocar-foto2');
  if (tf2) tf2.onclick = trocarFoto;
  secaoNotificacoes(document.getElementById('notif'));
  // administrador: senha nova para um colega da equipe que perdeu o acesso (sem depender de e-mail)
  if (S.me.papel === 'admin')
    carregarEquipe(true)
      .then((eq) => {
        const box = document.getElementById('eq-senhas');
        const outros = (eq || []).filter((p) => p.user_id !== S.user.id);
        if (!box || !outros.length) return;
        box.innerHTML =
          '<p class="tiny dim">Algum colega perdeu o acesso? Gere uma senha nova e mande para ele.</p>' +
          outros
            .map(
              (p) =>
                `<div class="list-item">${fotoHTML(p, 'sm')}<b class="grow ellip">${esc(p.nome)}</b><button type="button" class="btn ghost sm" data-eqsenha="${p.user_id}">Gerar nova senha</button></div>`,
            )
            .join('');
        box.onclick = (e) => {
          const b = e.target.closest('[data-eqsenha]');
          if (!b) return;
          const p = outros.find((x) => x.user_id === b.dataset.eqsenha);
          openSheet(
            `<p class="eyebrow">Equipe</p><div class="h2" style="margin-top:4px">Gerar uma senha nova para ${esc(p.nome)}?</div>
            <p class="small muted" style="margin-top:6px">A senha atual de ${esc(firstName(p.nome))} deixa de funcionar. Depois de entrar, ${esc(firstName(p.nome))} pode trocar em Mais › Perfil e equipe › Trocar senha.</p>
            <button class="btn block" id="eqs-ok" style="margin-top:14px">Sim, gerar a senha</button>
            <button class="btn ghost block" data-close style="margin-top:8px">Cancelar</button>`,
            (r) => {
              r.querySelector('#eqs-ok').onclick = async (ev) => {
                ev.currentTarget.disabled = true;
                const nova = gerarSenha();
                try {
                  const res = await chamarFuncao({ acao: 'senha', user_id: p.user_id, senha: nova });
                  const url = location.origin + '/treinador/';
                  const msg = `Oi, ${firstName(p.nome)}! Sua senha nova do app da Nexos:\n\nAcesse: ${url}\nE-mail: ${(res && res.email) || ''}\nSenha: ${nova}\n\nDepois de entrar, troque em Mais › Perfil e equipe › Trocar senha.`;
                  r.innerHTML = `<div class="center">${estIc(I.okc, 'ok')}<div class="h2" style="margin-top:6px">Senha nova de ${esc(firstName(p.nome))}</div></div>
                  <div class="cred" style="margin-top:12px">Acesso: <b>${esc(url)}</b><br>E-mail: <b>${esc((res && res.email) || '')}</b><br>Senha: <b>${esc(nova)}</b></div>
                  <a class="btn block" style="margin-top:16px;background:#25d366;color:#04122b" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${I.wa} Enviar pelo WhatsApp</a>
                  <button class="btn ghost block" id="eqs-copiar" style="margin-top:8px">Copiar mensagem</button>
                  <button class="btn ghost block" data-close style="margin-top:8px">Concluir</button>`;
                  r.querySelector('#eqs-copiar').onclick = () =>
                    navigator.clipboard.writeText(msg).then(
                      () => toast('Mensagem copiada.'),
                      () => toast('Não foi possível copiar.', true),
                    );
                } catch (err) {
                  ev.currentTarget.disabled = false;
                  toast(err.message, true);
                }
              };
            },
          );
        };
      })
      .catch(() => {});
  if (!S.staff)
    carregarEquipe().then(
      (eq) => {
        // o aluno vê com quem está treinando
        const box = document.getElementById('meu-tr');
        const t = eq.find((p) => p.user_id === S.me.treinador_id);
        if (!box || !t) return;
        box.innerHTML = `<div class="section-h"><h2 class="h2">Meu treinador</h2></div><a class="list-item" href="#/conversa" style="color:inherit">${fotoHTML(t, 'md')}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(t.nome)}</b><div class="small muted">Responsável pelos seus treinos · toque para conversar</div></div>${I.chev}</a>`;
        box.hidden = false;
      },
      () => {},
    );
  document.getElementById('tema').onclick = (e) => {
    const b = e.target.closest('[data-tema]');
    if (!b) return;
    aplicarTema(b.dataset.tema);
    salvarAparencia();
    document.querySelectorAll('#tema button').forEach((x) => x.classList.toggle('on', x === b));
  };
  document.getElementById('paleta').onclick = (e) => {
    const b = e.target.closest('[data-paleta]');
    if (!b) return;
    aplicarPaleta(b.dataset.paleta);
    salvarAparencia();
    document.querySelectorAll('#paleta button').forEach((x) => x.classList.toggle('on', x === b));
  };
  const pc = document.getElementById('perf-ciclo');
  if (pc)
    pc.onclick = async () => {
      pc.disabled = true;
      const c = await buscarCiclo(S.user.id).catch(() => null);
      pc.disabled = false;
      c ? abrirCiclo(c, () => viewPerfil()) : ativarCiclo(() => viewPerfil());
    };
  document.getElementById('f-senha').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.s1.value !== f.s2.value) return toast('As senhas não conferem.', true);
    const { error } = await sb.auth.updateUser({ password: f.s1.value });
    if (error)
      return toast(
        /different|same/i.test(error.message)
          ? 'Use uma senha diferente da atual.'
          : 'Não foi possível trocar a senha.',
        true,
      );
    f.reset();
    toast('Senha atualizada!');
  };
  const add = document.getElementById('add-trein');
  if (add) add.onclick = () => formPessoa('treinador');
}
