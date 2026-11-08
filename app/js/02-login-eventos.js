/* Nexos App · Login, eventos da equipe e planilha do aluno.
   Parte 2 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= LOGIN ================= */
function viewLogin() {
  $dock.hidden = true;
  layout('bare');
  $app.innerHTML = `
  <section class="login">
    <div class="login-hero">
      <img class="sym" src="${LOGO.s()}" alt="">
      <img class="wm" src="${LOGO.w()}" alt="Nexos Performance e Saúde">
      <div class="row" style="gap:12px">${slashes}<span class="eyebrow">${AREA === 'treinador' ? 'Área do treinador' : 'Área do aluno'}</span></div>
    </div>
    <form id="f-login" class="card" autocomplete="on">
      <label class="field"><span>E-mail</span><input class="input" type="email" name="email" required autocomplete="username" inputmode="email" placeholder="seuemail@exemplo.com"></label>
      <label class="field"><span>Senha</span><div class="pass-wrap"><input class="input" type="password" name="senha" required autocomplete="current-password" placeholder="Sua senha"><button type="button" class="icon-btn" id="ver-senha" aria-label="Mostrar senha">${I.eye}</button></div></label>
      <button class="btn block" type="submit">Entrar ${I.arrow}</button>
      <p class="small muted center" id="login-msg" style="margin-top:12px;min-height:1.4em"></p>
    </form>
    <div class="login-foot small muted">
      <button class="link-btn" id="esqueci">Esqueci minha senha</button>
      <p style="margin-top:16px">${AREA === 'treinador' ? '<a href="/app/" class="muted">Sou aluno → Área do aluno</a>' : ''}</p>
      <p style="margin-top:12px"><a href="../" class="muted">← Voltar ao site da Nexos</a> · <a href="../privacidade.html" class="muted" target="_blank" rel="noopener">Privacidade</a></p>
    </div>
  </section>`;
  const f = document.getElementById('f-login');
  document.getElementById('ver-senha').onclick = () => {
    const i = f.senha;
    i.type = i.type === 'password' ? 'text' : 'password';
  };
  document.getElementById('esqueci').onclick = () =>
    openSheet(`
    <div class="h2">Esqueceu a senha?</div>
    <p class="muted" style="margin:10px 0 18px">${AREA === 'treinador' ? 'Fale com o administrador da Nexos para gerar uma senha nova.' : 'Fale com seu treinador da Nexos. Ele gera uma senha nova pra você na hora, pelo próprio app.'}</p>
    <button class="btn block" data-close>Entendi</button>`);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg');
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    msg.textContent = 'Entrando…';
    const { data, error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.senha.value });
    if (error) {
      btn.disabled = false;
      msg.textContent = /invalid/i.test(error.message)
        ? 'E-mail ou senha incorretos.'
        : 'Não foi possível entrar. Tente de novo.';
      return;
    }
    S.user = data.user;
    try {
      await carregarPerfil();
    } catch {}
    location.hash = '#/';
    router();
  };
}
function viewOutraArea(destino) {
  $dock.hidden = true;
  layout('bare');
  const t = destino === 'treinador';
  $app.innerHTML = `<section class="login"><div class="login-hero"><img class="sym" src="${LOGO.s()}" alt=""><img class="wm" src="${LOGO.w()}" alt="Nexos Performance e Saúde"></div>
    <div class="card center"><div class="h3">${t ? 'Você é treinador da Nexos' : 'Esta é a área dos treinadores'}</div>
    <p class="small muted" style="margin:8px 0 16px">${t ? 'Sua conta entra pela Área do treinador, onde ficam alunos, planilhas, financeiro e eventos.' : 'Sua conta é de aluno. Seus treinos ficam na Área do aluno.'}</p>
    <a class="btn block" href="${t ? '/treinador/' : '/app/'}">Ir para a ${t ? 'Área do treinador' : 'Área do aluno'} ${I.arrow}</a>
    <button class="link-btn small" id="sair" style="margin-top:12px">Sair e entrar com outra conta</button></div></section>`;
  document.getElementById('sair').onclick = () => sb.auth.signOut();
}
async function viewSemAcesso() {
  $dock.hidden = true;
  layout('bare');
  loading();
  const { data } = await sb.rpc('nx_espera').then(
    (r) => r,
    () => ({ data: null }),
  );
  const e = data && data[0];
  if (!e) {
    $app.innerHTML = `<section class="login"><div class="empty"><div class="h3">Sua conta ainda não está ligada a uma assessoria</div><p class="small" style="margin:8px 0 16px">Peça ao seu treinador o link da ficha de entrada da Nexos.</p><button class="btn sm ghost" id="sair">Sair</button></div></section>`;
    document.getElementById('sair').onclick = () => sb.auth.signOut();
    return;
  }
  S.esperaOrg = { id: e.org_id, nome: e.org_nome };
  const tr = { nome: e.tr_nome || 'Equipe Nexos', foto_url: e.tr_foto };
  const mods = e.modalidades || [];
  const zap = telWa(e.tr_telefone);
  const pushOk = () => store.get('nx-push-ok') || (pushSuportado() && Notification.permission === 'granted');
  const pinta = () => {
    $app.innerHTML = `
    <div class="ficha-top"><img src="${LOGO.s()}" alt="">${slashes}</div>
    <p class="eyebrow">${esc(e.org_nome || 'Nexos')}</p>
    <h1 class="h1" style="margin-top:4px">Ficha recebida, ${esc(firstName(e.nome))}!</h1>
    <p class="muted small" style="margin-top:8px">Seu treinador está analisando sua ficha. Assim que ele aprovar, você recebe um aviso e seus treinos aparecem aqui.</p>
    <div class="card esp-tr" style="margin-top:16px">${avAluno(tr)}<div class="grow" style="min-width:0"><span class="tiny dim">Seu treinador</span><b class="ellip" style="display:block">${esc(tr.nome)}</b>${mods.length ? `<span class="small muted">${mods.map((k) => (MODS.find((m) => m[0] === k) || [k, k])[1]).join(' + ')}</span>` : ''}</div>${zap ? `<a class="btn sm ghost esp-wa" href="https://wa.me/${zap}?text=${encodeURIComponent(`Olá! Aqui é ${firstName(e.nome)}, acabei de enviar minha ficha da Nexos.`)}" target="_blank" rel="noopener" aria-label="Falar com o treinador no WhatsApp" title="WhatsApp">${I.wa}</a>` : ''}</div>
    <div class="card esp-passos" style="margin-top:12px">
      <div class="esp-p ok"><span>${I.check}</span><div><b>Ficha enviada</b><small>${e.pedido_em ? quando(e.pedido_em) : 'Recebida'}</small></div></div>
      <div class="esp-p on"><span>${I.espera}</span><div><b>Aprovação do treinador</b><small>Em análise</small></div></div>
      <div class="esp-p"><span>3</span><div><b>Primeiro treino liberado</b><small>Logo depois da aprovação</small></div></div>
    </div>
    <div class="section"><div class="section-h"><h2 class="h2">Enquanto isso</h2></div><div class="stack">
      <div class="list-item">${'<span class="ativ-ic">' + I.bell + '</span>'}<div class="grow"><b>Ative as notificações</b><div class="small muted">${pushOk() ? 'Ativadas. Você vai saber na hora da aprovação.' : !pushSuportado() && ehIOS() && !instalado() ? 'No iPhone, adicione o app à tela de início (Compartilhar, Adicionar à Tela de Início) e abra por lá.' : 'Para saber na hora em que o acesso for liberado.'}</div></div>${!pushOk() && pushSuportado() ? '<button class="btn sm" id="esp-push">Ativar</button>' : ''}</div>
      <div class="list-item"><span class="ativ-ic">${I.cam}</span><div class="grow"><b>Coloque sua foto</b><div class="small muted">${e.foto_url ? 'Foto enviada. Seu treinador já vê.' : 'Aparece para o seu treinador.'}</div></div><button class="btn sm ${e.foto_url ? 'ghost' : ''}" id="esp-foto">${e.foto_url ? 'Trocar' : 'Enviar'}</button></div>
      <div class="list-item"><span class="ativ-ic">${I.watch}</span><div class="grow"><b>Relógio</b><div class="small muted">Depois da aprovação, conecte o seu Garmin ou outro relógio em Perfil, Conexões. As corridas chegam sozinhas.</div></div></div>
    </div></div>
    <div class="row" style="gap:8px;margin-top:18px;justify-content:center"><button class="btn sm ghost" id="de-novo">Verificar aprovação</button><button class="link-btn small" id="sair">Sair</button></div>
    <p class="tiny dim center" style="margin-top:8px">Login: ${esc(S.user.email || e.email || '')}</p>`;
    document.getElementById('sair').onclick = () => {
      clearInterval(S.msgT);
      sb.auth.signOut();
    };
    document.getElementById('de-novo').onclick = () => verificar(true);
    const bp = document.getElementById('esp-push');
    if (bp)
      bp.onclick = async () => {
        bp.disabled = true;
        try {
          await ativarPush();
          toast('Notificações ativadas!');
        } catch (er) {
          toast(er.message, true);
        }
        pinta();
      };
    document.getElementById('esp-foto').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = async () => {
        const fl = inp.files && inp.files[0];
        if (!fl) return;
        try {
          toast('Enviando foto…');
          const blob = await reduzirImagem(fl);
          const caminho = `${S.user.id}/foto-${Date.now()}.jpg`;
          const { error } = await sb.storage
            .from('nx-avatares')
            .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
          if (error) throw error;
          const url = sb.storage.from('nx-avatares').getPublicUrl(caminho).data.publicUrl;
          const { error: e2 } = await sb.rpc('nx_definir_foto', { p_url: url });
          if (e2) throw e2;
          e.foto_url = url;
          toast('Foto enviada!');
          pinta();
        } catch (er) {
          console.error(er);
          toast('Não foi possível enviar a foto. Tente outra imagem.', true);
        }
      };
      inp.click();
    };
  };
  const verificar = async (manual) => {
    await carregarPerfil().catch(() => {});
    if (S.me) {
      clearInterval(S.msgT);
      document.removeEventListener('visibilitychange', S.esperaVis);
      toast('Acesso liberado! Bem-vindo(a) à Nexos.');
      return router();
    }
    if (manual) toast('Ainda aguardando a aprovação do treinador.');
  };
  pinta();
  clearInterval(S.msgT);
  S.msgT = setInterval(() => {
    if (!document.hidden) verificar(false);
  }, 30000);
  document.removeEventListener('visibilitychange', S.esperaVis);
  S.esperaVis = () => {
    if (!document.hidden && location.hash.replace(/^#\/?/, '') === '' && !S.me && S.user) verificar(false);
  };
  document.addEventListener('visibilitychange', S.esperaVis);
}

/* ================= EVENTOS: provas do Radar + eventos da Nexos ================= */
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDiaSem = (iso) => {
  const d = dia(iso);
  return `${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`;
};
const faltam = (iso) => {
  const n = Math.round((dia(iso) - dia(hojeISO())) / 864e5);
  return n === 0
    ? 'é hoje!'
    : n === 1
      ? 'é amanhã'
      : n > 0
        ? `faltam ${n} dias`
        : `foi há ${-n} dia${n < -1 ? 's' : ''}`;
};
async function carregarEventos() {
  if (S.cache.eventos && Date.now() - S.cache.eventos.t < 10 * 60000) return S.cache.eventos;
  const [radar, { data: nx }, { data: part }] = await Promise.all([
    sb.functions
      .invoke('nx-eventos', { body: {} })
      .then((r) => (r.data && r.data.eventos) || [])
      .catch(() => []),
    sb
      .from('nx_eventos')
      .select('*')
      .eq('org_id', S.org.id)
      .gte('data', isoDia(Date.now() - 864e5))
      .order('data'),
    S.staff
      ? sb
          .from('nx_participacoes')
          .select('*')
          .eq('org_id', S.org.id)
          .gte('data', isoDia(Date.now() - 60 * 864e5))
          .order('data')
      : sb.from('nx_participacoes').select('*').eq('org_id', S.org.id).eq('aluno_id', S.user.id).order('data'),
  ]);
  const eventos = [
    ...(nx || []).map((e) => ({
      ref: 'nx:' + e.id,
      fonte: 'nexos',
      nexos: e,
      nome: e.titulo,
      data: e.data,
      hora: e.hora,
      cidade: e.local,
      local: e.local,
      distancias: e.distancias
        ? e.distancias
            .split(/[,;/]/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      tipo: e.tipo,
      obs: e.descricao,
      link: e.link,
    })),
    ...radar.map((e) => ({
      ref: 'radar:' + e.id,
      fonte: 'radar',
      nome: e.nome,
      data: e.data,
      hora: e.hora,
      cidade: e.cidade,
      local: e.local,
      distancias: (e.distancias || []).map((x) => String(x).replace('.', ',') + ' km'),
      modalidade: e.modalidade,
      status: e.status,
      preco: e.preco,
      obs: e.obs,
      link: e.link,
    })),
  ].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.fonte === 'nexos' ? -1 : 1));
  const meus = S.staff ? await idsMeusAlunos() : null;
  S.cache.eventos = { t: Date.now(), eventos, part: (part || []).filter((p) => !meus || meus.has(p.aluno_id)) };
  return S.cache.eventos;
}
const TIPO_EV = { treinao: 'Treinão Nexos', prova: 'Prova da equipe', evento: 'Evento Nexos' };
function cartaoEvento(e, minhas, contagem) {
  const d = dia(e.data);
  const eu = minhas && minhas.find((p) => p.evento_ref === e.ref);
  return `<button class="ev-card ${e.fonte === 'nexos' ? 'nexos' : ''}" data-ev="${esc(e.ref)}">
    <div class="ev-data"><b>${d.getDate()}</b><span>${MES_CURTO[d.getMonth()]}</span></div>
    <div class="grow" style="min-width:0">
      ${e.fonte === 'nexos' ? `<span class="tag acc">${esc(TIPO_EV[e.tipo] || 'Nexos')}</span>` : ''}
      <b class="ev-nome">${esc(e.nome)}</b>
      <span class="small muted ellip">${[e.cidade, e.hora ? e.hora.replace(':00', 'h') : ''].filter(Boolean).map(esc).join(' · ')}</span>
      <div class="row" style="gap:5px;flex-wrap:wrap;margin-top:6px">${(e.distancias || [])
        .slice(0, 4)
        .map((x) => `<span class="pill">${esc(String(x))}</span>`)
        .join(
          '',
        )}${e.status && /adiad|cancel|esgot|encerr/i.test(e.status) ? `<span class="tag warn">${esc(e.status)}</span>` : ''}${eu ? `<span class="tag ok">✓ você vai${eu.distancia ? ' · ' + esc(eu.distancia) : ''}</span>` : ''}${contagem ? `<span class="tag">${contagem} aluno${contagem > 1 ? 's' : ''}</span>` : ''}</div>
    </div>${I.chev}</button>`;
}
function detalheEvento(e, dados, aoMudar) {
  const eu = !S.staff && dados.part.find((p) => p.evento_ref === e.ref);
  const quem = S.staff ? dados.part.filter((p) => p.evento_ref === e.ref) : [];
  const dists = e.distancias || [];
  openSheet(
    `<p class="eyebrow">${e.fonte === 'nexos' ? esc(TIPO_EV[e.tipo] || 'Evento Nexos') : e.fonte === 'manual' ? 'Prova cadastrada por você' : 'Agenda do Radar Corridas MA'}</p>
    <div class="h2" style="margin-top:4px">${esc(e.nome)}</div>
    <p class="small muted" style="margin-top:6px">${fmtDiaSem(e.data)}${e.hora ? ' · ' + esc(e.hora) : ''} · ${faltam(e.data)}</p>
    <div class="ev-info">
      ${e.local ? `<div><span>Local</span><b>${esc(e.local)}${e.cidade && e.cidade !== e.local ? ' · ' + esc(e.cidade) : ''}</b></div>` : ''}
      ${dists.length ? `<div><span>Distâncias</span><b>${dists.map(esc).join(' · ')}</b></div>` : ''}
      ${e.preco ? `<div><span>Inscrição</span><b>${esc(e.preco)}${e.status ? ' · ' + esc(e.status) : ''}</b></div>` : e.status ? `<div><span>Inscrições</span><b>${esc(e.status)}</b></div>` : ''}
    </div>
    ${e.obs ? `<p class="small" style="margin-top:12px;white-space:pre-line">${esc(e.obs)}</p>` : ''}
    ${e.link ? `<a class="btn ghost block" href="${esc(e.link)}" target="_blank" rel="noopener" style="margin-top:16px">${e.fonte === 'radar' ? 'Fazer a inscrição no site oficial' : 'Abrir link do evento'} ↗</a>` : ''}
    ${
      S.staff
        ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2" style="font-size:1rem">Alunos que vão (${quem.length})</h2></div>${quem.length ? quem.map((p) => `<a class="list-item" href="#/prova/${p.id}" data-close style="color:inherit"><b class="grow">${esc((S.cache.nomes || {})[p.aluno_id] || 'Aluno')}</b>${p.distancia ? `<span class="pill">${esc(p.distancia)}</span>` : ''}${p.meta ? `<span class="tag">meta ${esc(p.meta)}</span>` : ''}</a>`).join('') : '<p class="small muted">Ninguém marcou ainda.</p>'}</div>
      ${e.fonte === 'nexos' ? '<button class="btn ghost block sm" id="ev-editar" style="margin-top:12px">Editar evento</button>' : ''}`
        : eu
          ? `<div class="card" style="margin-top:14px;border-color:rgba(14,154,95,.4)"><b>✓ Você vai${eu.distancia ? ' nos ' + esc(eu.distancia) : ''}</b>${eu.meta ? `<p class="small muted">Meta: ${esc(eu.meta)}</p>` : ''}<p class="small muted">A prova aparece na sua planilha e no calendário. ${faltam(e.data)}.</p><a class="btn sm" href="#/prova/${eu.id}" data-close style="margin-top:10px">Plano de prova: ritmo, alimentação e checagem</a></div><button class="link-btn small" id="ev-sair" style="margin-top:10px;color:var(--err)">Não vou mais</button>`
          : `<form id="ev-vou" class="card" style="margin-top:16px"><b>Vai participar?</b><p class="small muted" style="margin:4px 0 10px">${e.fonte === 'radar' ? 'Faça a inscrição no site oficial e marque aqui para a prova entrar na sua planilha.' : 'Confirme para o treinador saber quem vai.'}</p>
        ${dists.length ? `<div class="chips wrap" style="margin-bottom:10px">${dists.map((x, i) => `<label class="chipc"><input type="radio" name="dist" value="${esc(String(x))}" ${i === dists.length - 1 ? 'checked' : ''}><span>${esc(String(x))}</span></label>`).join('')}</div>` : ''}
        ${e.fonte === 'radar' ? '<label class="field"><span>Meta de tempo (opcional)</span><input class="input" name="meta" data-mask="tempo" inputmode="numeric" placeholder="Ex.: 55:00"></label>' : ''}
        <button class="btn block">${e.fonte === 'radar' ? 'Vou correr ✓' : 'Vou ✓'}</button></form>`
    }`,
    (r) => {
      const f = r.querySelector('#ev-vou');
      if (f)
        f.onsubmit = async (ev) => {
          ev.preventDefault();
          const fd = new FormData(f);
          const { data: nova, error } = await sb
            .from('nx_participacoes')
            .insert({
              org_id: S.org.id,
              aluno_id: S.user.id,
              evento_ref: e.ref,
              fonte: e.fonte,
              titulo: e.nome,
              data: e.data,
              cidade: e.cidade || null,
              distancia: fd.get('dist') || null,
              meta: (fd.get('meta') || '').trim() || null,
              link: e.link || null,
            })
            .select('id')
            .single();
          if (error) return toast('Não foi possível confirmar.', true);
          notificar('prova', nova && nova.id);
          S.cache.eventos = null;
          closeSheet();
          toast('Confirmado! A prova entrou no seu calendário.');
          aoMudar();
        };
      const sair = r.querySelector('#ev-sair');
      if (sair)
        sair.onclick = async () => {
          await sb.from('nx_participacoes').delete().eq('id', eu.id);
          S.cache.eventos = null;
          closeSheet();
          toast('Participação removida.');
          aoMudar();
        };
      const ed = r.querySelector('#ev-editar');
      if (ed) ed.onclick = () => formEventoNexos(e.nexos, aoMudar);
    },
  );
}
function formEventoNexos(ev, aoSalvar) {
  ev = ev || { tipo: 'treinao', data: hojeISO(), hora: '06:00' };
  openSheet(
    `<p class="eyebrow">${ev.id ? 'Editar evento' : 'Novo evento da Nexos'}</p><form id="f-ev" style="margin-top:12px">
    <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">${Object.entries(TIPO_EV)
      .map(
        ([k, l]) =>
          `<button type="button" data-tipo="${k}" class="${ev.tipo === k ? 'on' : ''}">${l.replace(' Nexos', '').replace(' da equipe', '')}</button>`,
      )
      .join('')}</div>
    <label class="field"><span>Título</span><input class="input" name="titulo" value="${esc(ev.titulo || '')}" placeholder="Ex.: Treinão de domingo na Litorânea" required></label>
    <div class="grid2"><label class="field"><span>Data</span><input class="input" type="date" name="data" value="${esc(ev.data)}" required></label><label class="field"><span>Horário</span><input class="input" type="time" name="hora" value="${esc(ev.hora || '')}"></label></div>
    <label class="field"><span>Local</span><input class="input" name="local" value="${esc(ev.local || '')}" placeholder="Ex.: Espigão Costeiro, Ponta d'Areia"></label>
    <label class="field"><span>Distâncias (opcional)</span><input class="input" name="distancias" value="${esc(ev.distancias || '')}" placeholder="Ex.: 5 km, 10 km"></label>
    <label class="field"><span>Detalhes</span><textarea class="textarea" name="descricao" placeholder="Ex.: concentração 5h40, leve água e boné">${esc(ev.descricao || '')}</textarea></label>
    <label class="field"><span>Link (opcional)</span><input class="input" name="link" value="${esc(ev.link || '')}" placeholder="Inscrição, localização no mapa…"></label>
    <label class="aceite"><input type="checkbox" name="avisar" ${ev.id ? '' : 'checked'}><span>Avisar todos os alunos por notificação</span></label>
    <button class="btn block">Salvar evento</button>${ev.id ? '<button type="button" class="link-btn small" id="ev-del" style="margin-top:10px;color:var(--err)">Excluir evento</button>' : ''}</form>`,
    (r) => {
      let tipo = ev.tipo;
      r.querySelectorAll('[data-tipo]').forEach(
        (b) =>
          (b.onclick = () => {
            tipo = b.dataset.tipo;
            r.querySelectorAll('[data-tipo]').forEach((x) => x.classList.toggle('on', x === b));
          }),
      );
      const f = r.querySelector('#f-ev');
      f.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(f);
        const g = (k) => String(fd.get(k) || '').trim() || null;
        const row = {
          tipo,
          titulo: g('titulo'),
          data: g('data'),
          hora: g('hora'),
          local: g('local'),
          distancias: g('distancias'),
          descricao: g('descricao'),
          link: g('link'),
        };
        const q = ev.id
          ? await sb.from('nx_eventos').update(row).eq('id', ev.id).select('id').single()
          : await sb
              .from('nx_eventos')
              .insert({ ...row, org_id: S.org.id, criado_por: S.user.id })
              .select('id')
              .single();
        if (q.error) return toast('Não foi possível salvar.', true);
        if (fd.get('avisar')) notificar('evento', (q.data && q.data.id) || ev.id);
        S.cache.eventos = null;
        closeSheet();
        toast('Evento salvo!');
        aoSalvar();
      };
      const del = r.querySelector('#ev-del');
      if (del)
        del.onclick = async () => {
          if (!confirm('Excluir este evento?')) return;
          await sb.from('nx_eventos').delete().eq('id', ev.id);
          S.cache.eventos = null;
          closeSheet();
          toast('Evento excluído.');
          aoSalvar();
        };
    },
  );
}
async function viewEventos(aba) {
  loading();
  const st = S.cache.evSt || (S.cache.evSt = { filtro: 'slz', q: '', max: 20 });
  aba = aba === 'minhas' || aba === 'equipe' ? aba : 'proximas';
  const dados = await carregarEventos();
  if (S.staff && !S.cache.nomes) {
    const { data } = await sb.from('nx_membros').select('user_id,nome').eq('org_id', S.org.id);
    S.cache.nomes = Object.fromEntries((data || []).map((m) => [m.user_id, m.nome]));
  }
  const abas = S.staff
    ? [
        ['proximas', 'Agenda'],
        ['equipe', 'Equipe nas provas'],
      ]
    : [
        ['proximas', 'Próximas provas'],
        [
          'minhas',
          `Minhas provas${dados.part.filter((p) => p.data >= hojeISO()).length ? ' (' + dados.part.filter((p) => p.data >= hojeISO()).length + ')' : ''}`,
        ],
      ];
  const cont = {};
  if (S.staff)
    dados.part.forEach((p) => {
      cont[p.evento_ref] = (cont[p.evento_ref] || 0) + 1;
    });
  let corpo = '';
  if (aba === 'proximas') {
    const nq = semAcento(st.q);
    const hj = hojeISO();
    const bate = (e) => !nq || semAcento(e.nome + ' ' + (e.cidade || '') + ' ' + (e.local || '')).includes(nq);
    const daNexos = dados.eventos.filter((e) => e.fonte === 'nexos' && e.data >= hj && bate(e));
    const todas = dados.eventos.filter(
      (e) =>
        e.fonte === 'radar' &&
        e.data >= hj &&
        bate(e) &&
        (st.filtro === 'todas' ||
          (st.filtro === 'slz'
            ? /s[aã]o lu[ií]s|ribamar|pa[cç]o do lumiar|raposa|alc[aâ]ntara/i.test(e.cidade || '')
            : /trail/i.test(e.modalidade || ''))),
    );
    const lista = todas.slice(0, st.max);
    const meses = {};
    lista.forEach((e) => {
      const k = e.data.slice(0, 7);
      (meses[k] = meses[k] || []).push(e);
    });
    corpo = `<div class="search">${I.search}<input class="input" id="ev-q" placeholder="Buscar prova ou cidade" value="${esc(st.q)}"></div>
      ${daNexos.length ? `<p class="mes-rot">Da equipe Nexos</p><div class="stack">${daNexos.map((e) => cartaoEvento(e, S.staff ? null : dados.part, cont[e.ref])).join('')}</div>` : ''}
      <div class="row between" style="margin-top:18px;gap:10px;flex-wrap:wrap"><p class="mes-rot" style="margin:0">Provas no Maranhão</p></div>
      <div class="chips" id="ev-f" style="margin-top:8px">${[
        ['slz', 'Grande São Luís'],
        ['todas', 'Todo o Maranhão'],
        ['trail', 'Trail'],
      ]
        .map(([k, l]) => `<button class="chip ${st.filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`)
        .join('')}</div>
      <div id="ev-l">${
        Object.entries(meses)
          .map(
            ([k, l]) =>
              `<p class="mes-rot">${nomeMes(k)}</p><div class="stack">${l.map((e) => cartaoEvento(e, S.staff ? null : dados.part, cont[e.ref])).join('')}</div>`,
          )
          .join('') ||
        '<div class="empty" style="margin-top:16px"><div class="h3">Nenhuma prova encontrada</div><p class="small">Tente outro filtro.</p></div>'
      }
      ${todas.length > lista.length ? `<button class="btn ghost block" id="ev-mais" style="margin-top:16px">Ver mais provas (${todas.length - lista.length})</button>` : ''}</div>
      <p class="tiny dim" style="margin-top:16px">Agenda de provas do Maranhão pelo <b>Radar Corridas MA</b>. A inscrição é feita no site oficial de cada prova.</p>`;
  } else if (aba === 'minhas') {
    const fut = dados.part.filter((p) => p.data >= hojeISO()),
      pas = dados.part.filter((p) => p.data < hojeISO()).reverse();
    const linha = (p) =>
      `<button class="ev-card" data-part="${p.id}"><div class="ev-data"><b>${dia(p.data).getDate()}</b><span>${MES_CURTO[dia(p.data).getMonth()]}</span></div><div class="grow" style="min-width:0"><b class="ev-nome">${esc(p.titulo)}</b><span class="small muted">${[p.distancia, p.cidade].filter(Boolean).map(esc).join(' · ')}</span><span class="small" style="color:var(--acc);font-weight:700">${faltam(p.data)}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span></div>${I.chev}</button>`;
    corpo = fut.length
      ? `<div class="stack">${fut.map(linha).join('')}</div>`
      : `<div class="empty"><div class="h3">Nenhuma prova marcada</div><p class="small">Veja as próximas provas e toque em “Vou correr”.</p><a class="btn sm" href="#/eventos" style="margin-top:12px">Ver próximas provas</a></div>`;
    if (pas.length)
      corpo += `<div class="section"><div class="section-h"><h2 class="h2">Provas que você já correu</h2>${slashes}</div><div class="stack">${pas.map(linha).join('')}</div></div>`;
  } else {
    const fut = dados.part.filter((p) => p.data >= hojeISO());
    const porEv = {};
    fut.forEach((p) => {
      (porEv[p.evento_ref] = porEv[p.evento_ref] || { p, l: [] }).l.push(p);
    });
    corpo = Object.values(porEv).length
      ? `<div class="stack">${Object.values(porEv)
          .map(
            ({ p, l }) =>
              `<div class="card"><div class="row between" style="gap:10px;align-items:flex-start"><div><b>${esc(p.titulo)}</b><div class="small muted">${fmtDiaSem(p.data)} · ${faltam(p.data)}</div></div><span class="tag acc">${l.length} aluno${l.length > 1 ? 's' : ''}</span></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">${l.map((x) => `<a class="pill" href="#/aluno/${x.aluno_id}/corrida">${esc(firstName((S.cache.nomes || {})[x.aluno_id] || 'Aluno'))}${x.distancia ? ' · ' + esc(x.distancia) : ''}</a>`).join('')}</div></div>`,
          )
          .join('')}</div>`
      : '<div class="empty"><div class="h3">Nenhum aluno marcou prova ainda</div><p class="small">Quando os alunos marcarem “Vou correr”, aparece aqui.</p></div>';
  }
  $app.innerHTML = `<p class="eyebrow">Eventos</p><h1 class="h1">${S.staff ? 'Provas e eventos' : 'Provas e eventos'}</h1>
    <div class="subtabs" style="margin-top:16px">${abas.map(([k, l]) => `<a class="${aba === k ? 'on' : ''}" href="#/eventos${k === 'proximas' ? '' : '/' + k}">${l}</a>`).join('')}</div>
    ${S.staff ? `<button class="btn sm" id="ev-novo" style="margin-bottom:12px">${I.plus} Treinão ou evento da Nexos</button>` : `<button class="card tap prova-fora" id="ev-minha"><span class="go">${I.plus}</span><div class="grow"><b>A prova que vou correr não está aqui</b><div class="small muted">Cadastre a sua prova e ela entra na sua planilha</div></div>${I.chev}</button>`}
    ${corpo}`;
  const re = () => viewEventos(aba);
  const q = document.getElementById('ev-q');
  if (q) {
    q.oninput = () => {
      st.q = q.value;
      clearTimeout(st.t);
      st.t = setTimeout(() => {
        viewEventos(aba).then(() => {
          const n = document.getElementById('ev-q');
          if (n) {
            n.focus();
            n.setSelectionRange(n.value.length, n.value.length);
          }
        });
      }, 250);
    };
  }
  const ff = document.getElementById('ev-f');
  if (ff)
    ff.onclick = (e) => {
      const b = e.target.closest('[data-f]');
      if (b) {
        st.filtro = b.dataset.f;
        st.max = 20;
        re();
      }
    };
  const vm = document.getElementById('ev-mais');
  if (vm)
    vm.onclick = async () => {
      const y = scrollY;
      st.max += 20;
      await re();
      scrollTo(0, y);
    };
  $app.onclick = (e) => {
    const c = e.target.closest('[data-ev]');
    if (c)
      return detalheEvento(
        dados.eventos.find((x) => x.ref === c.dataset.ev),
        dados,
        re,
      );
    const p = e.target.closest('[data-part]');
    if (p) {
      const pp = dados.part.find((x) => x.id === p.dataset.part);
      const ev = dados.eventos.find((x) => x.ref === pp.evento_ref) || {
        ref: pp.evento_ref,
        fonte: pp.fonte,
        nome: pp.titulo,
        data: pp.data,
        cidade: pp.cidade,
        distancias: pp.distancia ? [pp.distancia] : [],
        link: pp.link,
      };
      return detalheEvento(ev, dados, re);
    }
  };
  const nv = document.getElementById('ev-novo');
  if (nv) nv.onclick = () => formEventoNexos(null, re);
  const mp = document.getElementById('ev-minha');
  if (mp)
    mp.onclick = () =>
      formProvaPropria(() => {
        location.hash = '#/eventos/minhas';
        if (aba === 'minhas') re();
      });
}
function formProvaPropria(aoSalvar) {
  const DIST = ['5 km', '10 km', '21 km', '42 km'];
  openSheet(
    `<p class="eyebrow">Minha prova</p><div class="h2" style="margin-top:4px">Cadastrar uma prova</div><p class="small muted" style="margin-top:4px">Para provas fora do Maranhão ou que ainda não estão na agenda. O treinador é avisado e a prova entra na sua planilha.</p>
    <form id="f-pp" style="margin-top:16px">
      <label class="field"><span>Nome da prova *</span><input class="input" name="titulo" required placeholder="Ex.: Maratona do Rio"></label>
      <div class="grid2"><label class="field"><span>Data *</span><input class="input" type="date" name="data" required min="${hojeISO()}"></label><label class="field"><span>Cidade</span><input class="input" name="cidade" placeholder="Ex.: Rio de Janeiro"></label></div>
      <div class="field"><span>Distância</span><div class="chips wrap">${DIST.map((d) => `<label class="chipc"><input type="radio" name="dist" value="${d}"><span>${d}</span></label>`).join('')}<label class="chipc"><input type="radio" name="dist" value="outra"><span>Outra</span></label></div></div>
      <label class="field" id="pp-outra" hidden><span>Qual distância?</span><input class="input" name="dist_outra" placeholder="Ex.: 15 km, trail 25 km"></label>
      <div class="grid2"><label class="field"><span>Meta de tempo</span><input class="input" name="meta" data-mask="tempo" inputmode="numeric" placeholder="Ex.: 55:00"></label><label class="field"><span>Site da prova</span><input class="input" name="link" inputmode="url" placeholder="opcional"></label></div>
      <button class="btn block" type="submit">Salvar minha prova</button></form>`,
    (r) => {
      const f = r.querySelector('#f-pp');
      f.onchange = (e) => {
        if (e.target.name === 'dist') r.querySelector('#pp-outra').hidden = e.target.value !== 'outra';
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(f);
        const btn = f.querySelector('[type=submit]');
        const titulo = String(fd.get('titulo') || '').trim();
        const data = fd.get('data');
        if (titulo.length < 3) return toast('Escreva o nome da prova.', true);
        if (!data) return toast('Escolha a data da prova.', true);
        let dist = fd.get('dist') || '';
        if (dist === 'outra') dist = String(fd.get('dist_outra') || '').trim();
        let link = String(fd.get('link') || '').trim();
        if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
        btn.disabled = true;
        const { data: nova, error } = await sb
          .from('nx_participacoes')
          .insert({
            org_id: S.org.id,
            aluno_id: S.user.id,
            evento_ref: 'manual-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            fonte: 'manual',
            titulo: titulo.slice(0, 140),
            data,
            cidade: String(fd.get('cidade') || '').trim() || null,
            distancia: dist || null,
            meta: String(fd.get('meta') || '').trim() || null,
            link: link || null,
          })
          .select('id')
          .single();
        if (error) {
          btn.disabled = false;
          return toast('Não foi possível salvar.', true);
        }
        notificar('prova', nova && nova.id);
        S.cache.eventos = null;
        closeSheet();
        toast('Prova salva! Ela já está na sua planilha.');
        aoSalvar && aoSalvar();
      };
    },
  );
}

/* ================= PLANILHA DO ALUNO: corrida, musculação e calendário ================= */
async function viewPlanilhaAluno(aba) {
  // quem faz corrida e força vê uma planilha só: a semana com os dois juntos e, embaixo, os treinos de força
  if (faz('corrida') && faz('musculacao')) {
    const mes = aba === 'calendario';
    $app.innerHTML = `<p class="eyebrow">Planilha</p><div class="row" style="justify-content:space-between;align-items:flex-end;gap:10px"><h1 class="h1">Seus treinos</h1><a class="btn ghost sm" href="#/planilha${mes ? '' : '/calendario'}">${mes ? 'Ver a semana' : `${I.cal} Ver o mês`}</a></div>
      ${mes ? '' : '<p class="small muted" style="margin-top:6px">Corrida e força na mesma planilha.</p>'}<div id="pl-c" style="margin-top:12px"></div><div id="pl-f"></div>`;
    const box = document.getElementById('pl-c');
    if (mes) return viewCalendarioMes(S.user.id, box);
    await viewCorridaPainel(S.user.id, box, false, S.me, ['planilha']);
    return planilhaForcaAluno(document.getElementById('pl-f'), true);
  }
  const abasP = [
    ['corrida', 'Corrida'],
    ['musculacao', 'Musculação'],
    ['calendario', 'Calendário'],
  ].filter(([k]) => k === 'calendario' || faz(k));
  aba = abasP.some(([k]) => k === aba) ? aba : abasP[0][0];
  $app.innerHTML = `<p class="eyebrow">Planilha</p><h1 class="h1">Seus treinos</h1>
    <div class="subtabs" style="margin-top:16px">${abasP.map(([k, l]) => `<a class="${aba === k ? 'on' : ''}" href="#/planilha/${k}">${l}</a>`).join('')}</div><div id="pl-c"></div>`;
  const box = document.getElementById('pl-c');
  if (aba === 'corrida') return viewCorridaPainel(S.user.id, box, false, S.me, ['planilha']);
  if (aba === 'musculacao') return planilhaForcaAluno(box, false);
  return viewCalendarioMes(S.user.id, box);
}
// treinos de força do aluno; soLista = sem a grade da semana (na planilha única a força já aparece em cada dia)
async function planilhaForcaAluno(box, soLista) {
  {
    const [treinos, sessoes] = await Promise.all([buscarTreinosDoAluno(S.user.id), buscarSessoes(S.user.id, 200)]);
    if (!box || !box.isConnected) return; // o aluno já trocou de tela enquanto carregava
    const ativos = treinos.filter((t) => t.ativo);
    const hj = dsemIdx(hojeISO());
    const seq = ativos.filter((t) => !(t.dias && t.dias.length));
    let prox = ativos.find((t) => (t.dias || []).includes(hj)) || null;
    // semana de força do aluno (mesma visão do treinador, só leitura)
    const fs = S.cache.fsemA || (S.cache.fsemA = { off: 0 });
    const iniF = inicioSemana();
    iniF.setDate(iniF.getDate() + fs.off * 7);
    const diasF = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(iniF);
      d.setDate(iniF.getDate() + i);
      return isoDia(d);
    });
    const hojeF = hojeISO();
    const temDias = ativos.some((t) => t.dias && t.dias.length);
    const semHj = isoDia(inicioSemana());
    const [libA, faseA, movA, avulA] = await Promise.all([
      sb
        .from('nx_forca_semanas')
        .select('id')
        .eq('aluno_id', S.user.id)
        .eq('semana', diasF[0])
        .maybeSingle()
        .then((r) => !!r.data)
        .catch(() => false),
      faseDaSemana(S.user.id, diasF[0]),
      buscarMovidos(S.user.id, diasF[0] < semHj ? diasF[0] : semHj, diasF[0] > semHj ? diasF[0] : semHj),
      buscarAvulsos(S.user.id, diasF[0] < semHj ? diasF[0] : semHj, diasF[0] > semHj ? diasF[0] : semHj),
    ]);
    // treino de hoje considerando as trocas de dia desta semana
    prox = ativos.find((t) => treinoNoDia(t, hj, movA, semHj, avulA)) || null;
    const offF = libA ? dispDe(S.me).off_forca || [] : [];
    const semanaF = `<div class="pl-top" style="margin-top:4px"><div class="row" style="gap:6px"><button class="icon-btn sm" id="fa-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="fa-h">${fs.off === 0 ? 'Esta semana' : fs.off === -1 ? 'Semana passada' : fs.off === 1 ? 'Próxima semana' : `${dia(diasF[0]).getDate()}/${dia(diasF[0]).getMonth() + 1} a ${dia(diasF[6]).getDate()}/${dia(diasF[6]).getMonth() + 1}`}</button><button class="icon-btn sm" id="fa-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>
        <span class="small muted">${sessoes.filter((x) => isoDia(x.iniciado_em) >= diasF[0] && isoDia(x.iniciado_em) <= diasF[6]).length} treino(s) feitos</span></div>
      ${temDias && !libA ? '<div class="lib-bar"><span>Seu treinador ainda não liberou esta semana de força.</span></div>' : ''}
      ${faseA && (libA || !temDias) && FASES_F[faseA] ? `<p class="small muted" style="margin:6px 0 0">Semana de <b>${FASES_F[faseA].n.toLowerCase()}</b>: as séries e repetições estão em cada exercício.</p>` : ''}
      <div class="fsem">${diasF
        .map((k, i) => {
          const doDia = libA ? ativos.filter((t) => treinoNoDia(t, i, movA, diasF[0], avulA)) : [];
          const feitos = sessoes.filter((x) => isoDia(x.iniciado_em) === k);
          return `<div class="fdia ${k === hojeF ? 'hoje' : ''} ${k < hojeF ? 'passado' : ''}"><div class="fdia-h"><b class="fdia-n">${dia(k).getDate()}</b><span>${DSEM[i]}</span></div>
          <div class="fdia-c">${doDia
            .map((t) => {
              const ok = feitos.find((x) => x.treino_id === t.id);
              return `<a class="ftr ${ok ? 'feito' : k < hojeF ? 'perdeu' : ''}" href="#/treino/${t.id}" style="color:inherit"><span class="grow" style="min-width:0">${ok ? `<span class="ses-conc fo"><i>${I.check}</i>Treino concluído</span>` : ''}<b class="ellip" style="display:block">${esc(t.titulo)}</b><small>${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios${ok ? '' : k < hojeF ? ' · não feito' : ''}</small></span>${!ok && k >= hojeF ? `<span class="add-ic">${I.play}</span>` : ''}</a>`;
            })
            .join('')}
          ${feitos
            .filter((x) => !doDia.some((t) => t.id === x.treino_id))
            .map(
              (x) =>
                `<div class="ftr feito extra"><span class="grow"><span class="ses-conc fo"><i>${I.check}</i>Treino extra</span><b>${esc(x.treino_titulo || 'Treino')}</b></span></div>`,
            )
            .join('')}
          ${offF.includes(i) ? `<div class="ftr folga"><span class="off-ic">${OFF_IC}</span><span class="grow"><b>Day off</b><small>Descanso de força</small></span></div>` : ''}
          ${!doDia.length && !feitos.length && !offF.includes(i) ? `<span class="cal-vazio">${temDias ? 'sem treino' : 'treino na sequência abaixo'}</span>` : ''}</div></div>`;
        })
        .join('')}</div>
      ${seq.length && temDias ? `<p class="small muted" style="margin-top:8px">Sem dia fixo (faça na sequência): ${seq.map((t) => `<b>${esc(t.titulo)}</b>`).join(', ')}.</p>` : ''}`;
    box.innerHTML = ativos.length
      ? (soLista ? '' : semanaF) +
        `<div class="section"><div class="section-h"><h2 class="h2">${soLista ? 'Seus treinos de força' : 'Seus treinos'}</h2>${slashes}</div><div class="stack">${ativos
          .map((t, i) => {
            const ex = sessoes.filter((s) => s.treino_id === t.id);
            return `<div class="card tr-card ${prox && prox.id === t.id ? 'prox' : ''}"><div class="row" style="gap:12px;align-items:flex-start"><div class="wletter sm">${esc(letraTreino(t, i))}</div>
      <div class="grow">${prox && prox.id === t.id ? `<span class="eyebrow">${treinoNoDia(t, hj, movA, semHj, avulA) ? 'Treino de hoje' : 'Próximo da sequência'}</span>` : ''}<div class="h3" style="margin-top:2px">${esc(t.titulo)}</div><div class="small muted">${t.foco ? esc(t.foco) + ' · ' : ''}${t.nx_treino_itens.length} exercícios</div>${t.dias && t.dias.length ? `<span class="tag acc" style="margin-top:4px">${diasTxt(t.dias)}</span>` : ''}</div></div>
      <p class="small" style="margin:10px 0 0;color:var(--acc)">${ex.length ? `Você fez ${ex.length} ${ex.length === 1 ? 'vez' : 'vezes'}, a última em ${fmtData(ex[0].iniciado_em)}` : 'Você ainda não fez este treino'}</p>
      <div class="grid2 tr-acoes"><a class="btn sm" href="#/treino/${t.id}">${I.play} Começar</a><a class="btn ghost sm" href="#/historico/cargas">${I.hist} Evolução</a></div></div>`;
          })
          .join('')}</div></div>`
      : soLista
        ? '<div class="section"><div class="section-h"><h2 class="h2">Seus treinos de força</h2>' +
          slashes +
          '</div><div class="empty"><div class="h3">Seu treino de musculação está sendo preparado</div><p class="small">Assim que o treinador liberar, ele aparece aqui.</p></div></div>'
        : '<div class="empty"><div class="h3">Seu treino de musculação está sendo preparado</div><p class="small">Assim que o treinador liberar, ele aparece aqui.</p></div>';
    const reF = () => planilhaForcaAluno(box, soLista);
    const fa = (id, f) => {
      const el = document.getElementById(id);
      if (el)
        el.onclick = () => {
          f();
          reF();
        };
    };
    fa('fa-a', () => fs.off--);
    fa('fa-p', () => fs.off++);
    fa('fa-h', () => {
      fs.off = 0;
    });
  }
}
async function viewCalendarioMes(alunoId, box) {
  const st = S.cache.calMes || (S.cache.calMes = { comp: compDe() });
  const [y, m] = st.comp.split('-').map(Number);
  const ini = new Date(y, m - 1, 1, 12),
    fim = new Date(y, m, 0, 12);
  const de = isoDia(ini),
    ate = isoDia(fim);
  const [plano, corrs, sess, provas] = await Promise.all([
    buscarPlano(alunoId, de, ate),
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,plano_id,fc_media')
      .eq('aluno_id', alunoId)
      .gte('data', de)
      .lte('data', ate + 'T23:59:59')
      .then((r) => r.data || []),
    sb
      .from('nx_sessoes')
      .select('id,iniciado_em,treino_titulo')
      .eq('aluno_id', alunoId)
      .not('finalizado_em', 'is', null)
      .gte('iniciado_em', de)
      .lte('iniciado_em', ate + 'T23:59:59')
      .then((r) => r.data || []),
    sb
      .from('nx_participacoes')
      .select('*')
      .eq('aluno_id', alunoId)
      .gte('data', de)
      .lte('data', ate)
      .then((r) => r.data || []),
  ]);
  const perfil = perfilCorrida(S.staff ? {} : S.me);
  const hoje = hojeISO();
  const off = (ini.getDay() + 6) % 7;
  const nd = fim.getDate();
  const doDia = (k) => ({
    pl: plano.filter((p) => p.data === k),
    co: corrs.filter((c) => ehCorr(c) && isoDia(c.data) === k),
    ou: corrs.filter((c) => !ehCorr(c) && isoDia(c.data) === k),
    se: sess.filter((s) => isoDia(s.iniciado_em) === k),
    pr: provas.filter((p) => p.data === k),
  });
  let cells = '';
  for (let i = 0; i < off; i++) cells += '<div class="cm-d vazio"></div>';
  for (let d = 1; d <= nd; d++) {
    const k = `${st.comp}-${String(d).padStart(2, '0')}`;
    const x = doDia(k);
    const corPl = x.pl.map((p) => {
      if (p.tipo === 'forca') return 'var(--fpc-ac)';
      const z = achatar(estruturaDe(p), perfil)
        .filter((s) => s.k === 'co')
        .sort((a, b) => b.seg - a.seg)[0];
      return (ZONAS_INFO[(z && z.z) || 'leve'] || ZONAS_INFO.leve).c;
    });
    const lbl = [
      ...x.pr.map((p) => `<i class="cm-t pr">${icT(I.flag)}${esc(p.titulo)}</i>`),
      ...x.pl.map(
        (p, j) =>
          `<i class="cm-t ${x.co.some((c) => c.plano_id === p.id) ? 'ok' : ''}" style="--c:${corPl[j]}">${esc(p.titulo || nomeTipo(p.tipo))}</i>`,
      ),
      ...x.co
        .filter((c) => !c.plano_id)
        .map((c) => `<i class="cm-t ok" style="--c:var(--ok)">${f1(c.distancia_m / 1000)} km</i>`),
      ...x.se.map((s2) => `<i class="cm-t tmu">${esc(s2.treino_titulo || 'Musculação')}</i>`),
    ].join('');
    cells += `<button class="cm-d ${k === hoje ? 'hoje' : ''} ${k < hoje ? 'passado' : ''} ${x.co.length ? 'co-ok' : ''} ${x.se.length || x.ou.some((c) => c.tipo === 'forca') ? 'fo-ok' : ''}" data-k="${k}"><span>${d}</span>${x.co.length || x.se.length || x.ou.length ? `<div class="cm-faixas">${x.co.length ? '<i class="fx-co"></i>' : ''}${x.se.length || x.ou.some((c) => c.tipo === 'forca') ? '<i class="fx-fo"></i>' : ''}${x.ou.some((c) => c.tipo !== 'forca') ? '<i class="fx-ou"></i>' : ''}</div>` : ''}<div class="cm-txt">${lbl}</div><div class="cm-ic">${x.pr.length ? `<i class="pr">${icT(I.flag)}</i>` : ''}${x.pl.map((p, j) => `<i class="dot ${x.co.some((c) => c.plano_id === p.id) ? 'ok' : ''}" style="--c:${corPl[j]}"></i>`).join('')}${x.co
      .filter((c) => !c.plano_id)
      .map(() => '<i class="dot ok" style="--c:var(--ok)"></i>')
      .join('')}${x.se.length ? '<i class="mu"></i>' : ''}</div></button>`;
  }
  const totKm = plano.reduce((a, p) => a + resumoEstrutura(estruturaDe(p), perfil).km, 0),
    feitoKm = corrs.reduce((a, c) => a + c.distancia_m / 1000, 0);
  box.innerHTML = `<div class="mes-nav" style="margin-top:4px"><button class="icon-btn sm" id="cm-a" aria-label="Mês anterior">${I.back}</button><b>${nomeMes(st.comp)}</b><button class="icon-btn sm" id="cm-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
    <p class="small muted center">${totKm ? `previsto ${f1(totKm)} km · ` : ''}feito ${f1(feitoKm)} km${sess.length ? ` · ${sess.length} treino${sess.length > 1 ? 's' : ''} de musculação` : ''}</p>
    <div class="cal-mes"><div class="cm-sem">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((x) => `<span>${x}</span>`).join('')}</div><div class="cm-grade">${cells}</div></div>
    <div class="cm-leg"><span><i class="dot" style="--c:var(--acc)"></i>corrida planejada</span><span><i class="lg-co"></i>corrida concluída</span><span><i class="lg-fo"></i>força concluída</span><span><i class="lg-ou"></i>outras atividades</span><span>${icT(I.flag, 'pr')}prova</span></div>
    ${provas.length ? `<div class="section"><div class="section-h"><h2 class="h2">Provas do mês</h2>${slashes}</div><div class="stack">${provas.map((p) => `<a class="list-item" href="#/eventos/minhas" style="color:inherit"><span class="li-ic pr">${I.flag}</span><div class="grow"><b>${esc(p.titulo)}</b><div class="small muted">${fmtData(p.data + 'T12:00:00')}${p.distancia ? ' · ' + esc(p.distancia) : ''} · ${faltam(p.data)}</div></div>${I.chev}</a>`).join('')}</div></div>` : ''}`;
  box.querySelector('#cm-a').onclick = () => {
    st.comp = somaMes(st.comp, -1);
    viewCalendarioMes(alunoId, box);
  };
  box.querySelector('#cm-p').onclick = () => {
    st.comp = somaMes(st.comp, 1);
    viewCalendarioMes(alunoId, box);
  };
  box.querySelector('.cm-grade').onclick = (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const k = b.dataset.k;
    const x = doDia(k);
    if (!x.pl.length && !x.co.length && !x.se.length && !x.pr.length && !x.ou.length)
      return toast('Dia livre: descanso.');
    openSheet(
      `<p class="eyebrow">${fmtDiaSem(k)}</p><div class="stack" style="margin-top:12px">
      ${x.pr.map((p) => `<a class="list-item" href="#/eventos/minhas" style="color:inherit"><span class="li-ic pr">${I.flag}</span><div class="grow"><b>${esc(p.titulo)}</b><div class="small muted">${esc(p.distancia || '')} ${p.meta ? '· meta ' + esc(p.meta) : ''}</div></div></a>`).join('')}
      ${x.pl
        .map((p) =>
          cartaoSessao(
            p,
            perfil,
            x.co.find((c) => c.plano_id === p.id),
            false,
          ),
        )
        .join('')}
      ${x.co
        .filter((c) => !c.plano_id)
        .map(
          (c) =>
            `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><span class="ativ-ic">${icCorr(S.staff ? null : S.me)}</span><div class="grow"><b>Corrida · ${fmtKm(c.distancia_m, 1)}</b><div class="small muted">${fmtPace(paceDe(c))}</div></div>${I.chev}</a>`,
        )
        .join('')}
      ${x.ou.map((c) => `<a class="list-item" href="#/corrida/${c.id}" style="color:inherit"><span class="ativ-ic">${c.tipo === 'forca' ? HALTER_S : I.watch}</span><div class="grow"><b>${esc(nomeAtiv(c))}</b><div class="small muted">${resumoAtiv(c)} · do relógio</div></div>${I.chev}</a>`).join('')}
      ${x.se.map((s) => `<div class="list-item"><span class="ativ-ic">${I.lib}</span><div class="grow"><b>${esc(s.treino_titulo || 'Musculação')}</b><div class="small muted">feito às ${fmtHora(s.iniciado_em)}</div></div></div>`).join('')}</div>`,
      (r) => {
        r.querySelectorAll('[data-ses]').forEach(
          (el) =>
            (el.onclick = () => {
              const p = x.pl.find((q) => q.id === el.dataset.ses);
              verTreinoPlanilha(
                p,
                perfil,
                x.co.find((c) => c.plano_id === p.id),
              );
            }),
        );
      },
    );
  };
}
