/* Nexos App · Fotos (postural, antes e depois) e notificações push.
   Parte 13 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= FOTOS: progresso e avaliação postural ================= */
const VISTAS = [
  ['frente', 'Frente'],
  ['lado', 'Lado'],
  ['costas', 'Costas'],
];
const ACHADOS = {
  frente: [
    ['cab_incl_d', 'Cabeça inclinada para a direita'],
    ['cab_incl_e', 'Cabeça inclinada para a esquerda'],
    ['ombro_d_alto', 'Ombro direito mais alto'],
    ['ombro_e_alto', 'Ombro esquerdo mais alto'],
    ['pelve_d_alta', 'Crista ilíaca direita mais alta'],
    ['pelve_e_alta', 'Crista ilíaca esquerda mais alta'],
    ['joelho_valgo', 'Joelhos para dentro (valgo)'],
    ['joelho_varo', 'Joelhos para fora (varo)'],
    ['pes_abd', 'Pés abertos (rotação externa)'],
    ['pes_adu', 'Pés para dentro (rotação interna)'],
  ],
  lado: [
    ['cab_ant', 'Cabeça anteriorizada'],
    ['ombro_prot', 'Ombros projetados para frente'],
    ['hipercifose', 'Hipercifose torácica'],
    ['hiperlordose', 'Hiperlordose lombar'],
    ['retificacao', 'Retificação lombar'],
    ['antev', 'Anteversão pélvica'],
    ['retrov', 'Retroversão pélvica'],
    ['recurvato', 'Hiperextensão de joelho'],
    ['flexo', 'Joelho semiflexionado'],
    ['tronco_ant', 'Tronco inclinado para frente'],
  ],
  costas: [
    ['esc_alada_d', 'Escápula direita alada'],
    ['esc_alada_e', 'Escápula esquerda alada'],
    ['esc_abd', 'Escápulas afastadas da coluna'],
    ['desvio_lat', 'Desvio lateral da coluna (sugere escoliose)'],
    ['gluteo_assim', 'Assimetria das pregas glúteas'],
    ['calc_valgo', 'Calcanhar para dentro (pé pronado)'],
    ['calc_varo', 'Calcanhar para fora (pé supinado)'],
  ],
};
const urlCache = {};
async function urlsAssinadas(paths) {
  const falta = paths.filter((p) => p && (!urlCache[p] || urlCache[p].exp < Date.now()));
  if (falta.length) {
    const { data } = await sb.storage.from('nx-fotos').createSignedUrls(falta, 3600);
    (data || []).forEach((d) => {
      if (d.signedUrl) urlCache[d.path] = { url: d.signedUrl, exp: Date.now() + 50 * 60000 };
    });
  }
  return Object.fromEntries(paths.map((p) => [p, urlCache[p] ? urlCache[p].url : '']));
}
async function comprimirImagem(file, max = 1440) {
  let img;
  try {
    img = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    img = await new Promise((ok, err) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = err;
      i.src = URL.createObjectURL(file);
    });
  }
  const w = img.width,
    h = img.height,
    k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}
async function enviarFoto(file, alunoId, extra) {
  const blob = await comprimirImagem(file);
  const caminho = `${S.org.id}/${alunoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage
    .from('nx-fotos')
    .upload(caminho, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { error: e2 } = await sb
    .from('nx_fotos')
    .insert({ org_id: S.org.id, aluno_id: alunoId, caminho, enviado_por: S.user.id, ...extra });
  if (e2) {
    await sb.storage.from('nx-fotos').remove([caminho]);
    throw e2;
  }
  return caminho;
}
const slotFotoHTML = (v, l, url = '', grade = false) => `<label class="foto-slot ${url ? 'tem' : ''}" data-slot="${v}">
  <input type="file" accept="image/*" capture="environment" name="f_${v}" hidden>
  <div class="foto-prev">${url ? `<img src="${esc(url)}" alt="${l}">` : `<span>${I.plus}<b>${l}</b></span>`}${grade ? '<i class="grade"></i>' : ''}</div><em>${l}</em></label>`;
function bindSlots(root, grade) {
  const files = {};
  root.querySelectorAll('[data-slot] input[type=file]').forEach((inp) => {
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const v = inp.closest('[data-slot]').dataset.slot;
      files[v] = f;
      const lab = inp.closest('[data-slot]');
      lab.classList.add('tem');
      lab.querySelector('.foto-prev').innerHTML =
        `<img src="${URL.createObjectURL(f)}" alt="">${grade ? '<i class="grade"></i>' : ''}`;
    };
  });
  return files;
}
const DICAS_FOTO =
  '<p class="tiny dim" style="margin-top:12px">Dicas: mesma luz, mesma roupa justa, mesma distância (uns 2,5 m), celular na altura do umbigo e corpo inteiro no quadro. Assim a comparação fica fiel.</p>';

async function viewFotos(alunoId, box, staff) {
  box.innerHTML = esqBloco();
  const [{ data: fotos }, { data: posts }] = await Promise.all([
    sb.from('nx_fotos').select('*').eq('org_id', S.org.id).eq('aluno_id', alunoId).order('data').order('criado_em'),
    sb
      .from('nx_posturais')
      .select('id,data,achados,observacoes')
      .eq('org_id', S.org.id)
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false }),
  ]);
  const prog = (fotos || []).filter((f) => f.tipo === 'progresso');
  const datas = [...new Set(prog.map((f) => f.data))];
  const urls = await urlsAssinadas((fotos || []).map((f) => f.caminho));
  const st = { a: datas[0], b: datas[datas.length - 1], vista: 'frente', grade: false };
  const fotoDe = (d, v) => prog.filter((f) => f.data === d && f.vista === v).slice(-1)[0];
  const qtdAchados = (p) => Object.values(p.achados || {}).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
  const draw = () => {
    const vistasComFoto = VISTAS.filter(([v]) => prog.some((f) => f.vista === v));
    if (vistasComFoto.length && !vistasComFoto.some(([v]) => v === st.vista)) st.vista = vistasComFoto[0][0];
    const fa = fotoDe(st.a, st.vista),
      fb = fotoDe(st.b, st.vista);
    const op = (sel) =>
      datas.map((d) => `<option value="${d}" ${d === sel ? 'selected' : ''}>${fmtDia(d)}</option>`).join('');
    const quadro = (f, d) =>
      `<figure class="cmp-f">${f ? `<img src="${esc(urls[f.caminho])}" alt="Foto de ${fmtDia(d)}" data-foto="${f.id}">` : '<div class="cmp-vazio">Sem foto nesta vista</div>'}${st.grade ? '<i class="grade"></i>' : ''}<figcaption>${d ? fmtDia(d) : ''}</figcaption></figure>`;
    box.innerHTML = `
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" id="add-fotos">${I.plus} Fotos de progresso</button>${staff ? `<a class="btn ghost sm" href="#/aluno/${alunoId}/postural/nova">${I.plus} Avaliação postural</a>` : ''}</div>
      ${
        datas.length
          ? `<div class="section" style="margin-top:16px"><div class="section-h"><h2 class="h2">Antes e depois</h2>${slashes}</div>
        <div class="card cmp">
          <div class="chips">${VISTAS.map(([v, l]) => `<button class="chip ${st.vista === v ? 'on' : ''}" data-vista="${v}">${l}</button>`).join('')}<button class="chip ${st.grade ? 'on' : ''}" id="grade">Grade</button></div>
          ${datas.length > 1 ? `<div class="grid2" style="margin-top:12px"><select class="input" id="da">${op(st.a)}</select><select class="input" id="db">${op(st.b)}</select></div>` : ''}
          <div class="cmp-grid ${datas.length > 1 ? '' : 'one'}" style="margin-top:12px">${quadro(fa, st.a)}${datas.length > 1 ? quadro(fb, st.b) : ''}</div>
          ${datas.length > 1 ? `<p class="tiny dim center" style="margin-top:8px">${Math.max(0, Math.round((dia(st.b) - dia(st.a)) / 86400000))} dias entre as fotos</p>` : ''}
        </div></div>
        <div class="section"><div class="section-h"><h2 class="h2">Todas as fotos</h2>${slashes}</div>
          <div class="stack">${[...datas]
            .reverse()
            .map(
              (d) =>
                `<div class="card foto-dia"><b>${fmtDia(d)}</b><div class="thumbs">${prog
                  .filter((f) => f.data === d)
                  .map(
                    (f) =>
                      `<button class="thumb-f" data-foto="${f.id}"><img src="${esc(urls[f.caminho])}" alt="" loading="lazy"><span>${VISTAS.find((x) => x[0] === f.vista)?.[1] || 'Foto'}</span></button>`,
                  )
                  .join('')}</div></div>`,
            )
            .join('')}</div></div>`
          : `<div class="empty" style="margin-top:16px"><div class="h3">Nenhuma foto de progresso ainda</div><p class="small">Tire fotos de frente, de lado e de costas a cada 4 a 8 semanas para ver a evolução lado a lado.</p></div>`
      }
      <div class="section"><div class="section-h"><h2 class="h2">Avaliação postural</h2>${slashes}</div>
        ${
          (posts || []).length
            ? (posts || [])
                .map(
                  (p) =>
                    `<a class="card tap av-item" href="#/postural/${p.id}"><div class="hist-date"><b>${dia(p.data).getDate()}</b><span>${MESES[dia(p.data).getMonth()]}</span></div><div class="grow"><div class="h3">Postural de ${fmtDia(p.data)}</div><span class="small muted">${qtdAchados(p) ? qtdAchados(p) + ' ponto' + (qtdAchados(p) > 1 ? 's' : '') + ' de atenção' : 'Sem desvios marcados'}</span></div>${I.chev}</a>`,
                )
                .join('')
            : `<div class="empty"><div class="h3">Nenhuma avaliação postural</div><p class="small">${staff ? 'Faça a primeira com fotos de frente, lado e costas.' : 'Quando o seu treinador fizer a sua avaliação postural, ela aparece aqui.'}</p></div>`
        }
      </div>`;
    const g = box.querySelector('#grade');
    if (g)
      g.onclick = () => {
        st.grade = !st.grade;
        draw();
      };
    box.querySelectorAll('[data-vista]').forEach(
      (b) =>
        (b.onclick = () => {
          st.vista = b.dataset.vista;
          draw();
        }),
    );
    const da = box.querySelector('#da'),
      db = box.querySelector('#db');
    if (da)
      da.onchange = () => {
        st.a = da.value;
        draw();
      };
    if (db)
      db.onchange = () => {
        st.b = db.value;
        draw();
      };
    box
      .querySelectorAll('[data-foto]')
      .forEach((el) => (el.onclick = () => abrirFoto((fotos || []).find((f) => f.id === el.dataset.foto))));
    box.querySelector('#add-fotos').onclick = () => novasFotos();
  };
  const abrirFoto = (f) => {
    if (!f) return;
    const podeApagar = staff || f.enviado_por === S.user.id;
    openSheet(
      `<p class="eyebrow">${VISTAS.find((x) => x[0] === f.vista)?.[1] || 'Foto'} · ${fmtDia(f.data)}</p><div class="foto-grande" style="margin-top:12px"><img src="${esc(urls[f.caminho])}" alt=""><i class="grade" hidden></i></div>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost sm" id="g2">Grade</button>${podeApagar ? '<button class="btn danger sm" id="apagar-f">Apagar foto</button>' : ''}<button class="btn ghost sm" data-close style="margin-left:auto">Fechar</button></div>`,
      (r) => {
        r.querySelector('#g2').onclick = () => {
          const gi = r.querySelector('.grade');
          gi.hidden = !gi.hidden;
        };
        const ap = r.querySelector('#apagar-f');
        if (ap)
          ap.onclick = async () => {
            if (!confirm('Apagar esta foto? Não dá para desfazer.')) return;
            await sb.storage.from('nx-fotos').remove([f.caminho]);
            const { error } = await sb.from('nx_fotos').delete().eq('id', f.id);
            if (error) return toast('Não foi possível apagar.', true);
            closeSheet();
            toast('Foto apagada.');
            viewFotos(alunoId, box, staff);
          };
      },
    );
  };
  const novasFotos = () => {
    openSheet(
      `<p class="eyebrow">Fotos de progresso</p><div class="h2" style="margin-top:4px">Novo registro</div>
      <label class="field" style="margin-top:16px"><span>Data</span><input class="input" type="date" id="fdata" value="${hojeISO()}"></label>
      <div class="slots">${VISTAS.map(([v, l]) => slotFotoHTML(v, l)).join('')}</div>${DICAS_FOTO}
      <button class="btn block" id="enviar-f" style="margin-top:16px">Salvar fotos</button><button class="btn ghost block" data-close style="margin-top:8px">Cancelar</button>`,
      (r) => {
        const files = bindSlots(r, false);
        r.querySelector('#enviar-f').onclick = async (e) => {
          const vs = Object.keys(files);
          if (!vs.length) return toast('Escolha pelo menos uma foto.', true);
          const b = e.currentTarget;
          b.disabled = true;
          b.textContent = 'Enviando…';
          try {
            for (const v of vs)
              await enviarFoto(files[v], alunoId, {
                tipo: 'progresso',
                vista: v,
                data: r.querySelector('#fdata').value || hojeISO(),
              });
            closeSheet();
            toast('Fotos salvas!');
            viewFotos(alunoId, box, staff);
          } catch (err) {
            console.error(err);
            b.disabled = false;
            b.textContent = 'Salvar fotos';
            toast('Não foi possível enviar. Verifique a internet.', true);
          }
        };
      },
    );
  };
  draw();
}

async function formPostural(alunoId, posId) {
  loading();
  const [{ data: m }, pq] = await Promise.all([
    sb.from('nx_membros').select('nome').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
    posId ? sb.from('nx_posturais').select('*').eq('id', posId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const p = pq.data || { data: hojeISO(), achados: {}, observacoes: '' };
  let fotos = [];
  if (posId) {
    const { data } = await sb.from('nx_fotos').select('*').eq('postural_id', posId);
    fotos = data || [];
  }
  const urls = await urlsAssinadas(fotos.map((f) => f.caminho));
  const fv = (v) => fotos.find((f) => f.vista === v);
  $app.innerHTML = `
    <a class="back" href="#/aluno/${alunoId}/fotos">${I.back} ${esc(m ? m.nome : 'Aluno')}</a>
    <p class="eyebrow">${posId ? 'Editar' : 'Nova'} avaliação postural</p><h1 class="h1">${esc(firstName(m ? m.nome : ''))}</h1>
    <form id="f-pos" class="stack" style="margin-top:16px">
      <div class="card"><label class="field"><span>Data</span><input class="input" type="date" name="data" value="${esc(p.data)}" required></label>
        <span class="small muted" style="font-weight:700">Fotos (com grade de referência)</span>
        <div class="slots" style="margin-top:8px">${VISTAS.map(([v, l]) => slotFotoHTML(v, l, fv(v) ? urls[fv(v).caminho] : '', true)).join('')}</div>${DICAS_FOTO}</div>
      ${VISTAS.map(
        ([
          v,
          l,
        ]) => `<div class="card"><span class="eyebrow">Vista ${v === 'lado' ? 'lateral' : l.toLowerCase() === 'frente' ? 'anterior' : 'posterior'}</span>
        <div class="chips wrap" style="margin-top:12px">${ACHADOS[v].map(([k, t]) => `<label class="chipc"><input type="checkbox" name="${v}" value="${k}" ${((p.achados || {})[v] || []).includes(k) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>`,
      ).join('')}
      <div class="card"><label class="field"><span>Observações e orientações para o aluno</span><textarea class="textarea" name="obs" placeholder="Ex.: reforçar glúteo médio e mobilidade torácica; manter alongamento de peitoral">${esc(p.observacoes || '')}</textarea></label></div>
      <button class="btn block" type="submit">Salvar avaliação postural ${I.check}</button>
      ${posId ? '<button class="btn danger block sm" type="button" id="apagar-p">Excluir avaliação</button>' : ''}
    </form>`;
  const f = document.getElementById('f-pos');
  const files = bindSlots(f, true);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const btn = f.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Salvando…';
    const achados = {};
    VISTAS.forEach(([v]) => {
      achados[v] = fd.getAll(v);
    });
    const row = { data: fd.get('data'), achados, observacoes: String(fd.get('obs') || '').trim() || null };
    try {
      let id = posId;
      if (id) {
        const { error } = await sb.from('nx_posturais').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await sb
          .from('nx_posturais')
          .insert({ ...row, org_id: S.org.id, aluno_id: alunoId, avaliador_id: S.user.id })
          .select('id')
          .single();
        if (error) throw error;
        id = data.id;
      }
      for (const v of Object.keys(files)) {
        const velha = fv(v);
        await enviarFoto(files[v], alunoId, { tipo: 'postural', vista: v, data: row.data, postural_id: id });
        if (velha) {
          await sb.storage.from('nx-fotos').remove([velha.caminho]);
          await sb.from('nx_fotos').delete().eq('id', velha.id);
        }
      }
      if (!posId) notificar('postural', id);
      toast('Avaliação postural salva!');
      location.hash = '#/postural/' + id;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = 'Salvar avaliação postural';
      toast('Não foi possível salvar. Verifique a internet.', true);
    }
  };
  const ap = document.getElementById('apagar-p');
  if (ap)
    ap.onclick = async () => {
      if (!confirm('Excluir esta avaliação postural e as fotos dela?')) return;
      if (fotos.length) await sb.storage.from('nx-fotos').remove(fotos.map((x) => x.caminho));
      const { error } = await sb.from('nx_posturais').delete().eq('id', posId);
      error
        ? toast('Não foi possível excluir.', true)
        : (toast('Avaliação excluída.'), (location.hash = `#/aluno/${alunoId}/fotos`));
    };
}

async function viewPostural(posId) {
  loading();
  const { data: p } = await sb.from('nx_posturais').select('*').eq('id', posId).maybeSingle();
  if (!p) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Avaliação não encontrada</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const [{ data: fotos }, nome] = await Promise.all([
    sb.from('nx_fotos').select('*').eq('postural_id', posId),
    S.staff
      ? sb
          .from('nx_membros')
          .select('nome')
          .eq('org_id', S.org.id)
          .eq('user_id', p.aluno_id)
          .maybeSingle()
          .then((r) => r.data?.nome || 'Aluno')
      : Promise.resolve(S.me.nome),
  ]);
  const urls = await urlsAssinadas((fotos || []).map((f) => f.caminho));
  const voltar = S.staff ? `#/aluno/${p.aluno_id}/fotos` : '#/historico/fotos';
  const nomeAch = (v, k) => (ACHADOS[v].find((x) => x[0] === k) || [, k])[1];
  const total = VISTAS.reduce((n, [v]) => n + ((p.achados || {})[v] || []).length, 0);
  $app.innerHTML = `
    <div class="no-print row between"><a class="back" href="${voltar}" style="margin:0">${I.back} Voltar</a><div class="row" style="gap:8px">${S.staff ? `<a class="btn ghost sm" href="#/aluno/${p.aluno_id}/postural/${p.id}">Editar</a>` : ''}<button class="btn ghost sm" id="grade-t">Grade</button><button class="btn ghost sm" id="imprimir">Salvar PDF</button></div></div>
    <div class="rel-head"><img src="${LOGO.s()}" alt=""><div><p class="eyebrow">Avaliação postural</p><h1 class="h1" style="margin-top:4px">${esc(nome)}</h1><p class="small muted">${fmtDia(p.data)} · ${total ? total + ' ponto' + (total > 1 ? 's' : '') + ' de atenção' : 'sem desvios marcados'}</p></div></div>
    <div class="post-fotos">${VISTAS.map(([v, l]) => {
      const f = (fotos || []).find((x) => x.vista === v);
      return `<figure class="cmp-f">${f ? `<img src="${esc(urls[f.caminho])}" alt="${l}">` : '<div class="cmp-vazio">Sem foto</div>'}<i class="grade" hidden></i><figcaption>${l}</figcaption></figure>`;
    }).join('')}</div>
    <div class="section"><div class="section-h"><h2 class="h2">O que foi observado</h2>${slashes}</div>
      ${VISTAS.map(([v, l]) => {
        const ls = (p.achados || {})[v] || [];
        return `<div class="card"><span class="eyebrow">${l}</span>${ls.length ? `<ul class="achados">${ls.map((k) => `<li>${esc(nomeAch(v, k))}</li>`).join('')}</ul>` : '<p class="small muted" style="margin-top:6px">Sem desvios marcados nesta vista.</p>'}</div>`;
      }).join('')}</div>
    ${p.observacoes ? `<div class="card" style="margin-top:16px;border-color:rgba(70,214,255,.3)"><span class="eyebrow">Orientações do avaliador</span><p style="margin-top:6px;white-space:pre-line">${esc(p.observacoes)}</p></div>` : ''}
    <p class="tiny dim" style="margin-top:16px">A avaliação postural por fotos é observacional: registra o alinhamento naquele momento para orientar o treino e acompanhar mudanças. Não é diagnóstico. Desvios com dor ou limitação devem ser avaliados por médico ou fisioterapeuta.</p>`;
  document.getElementById('imprimir').onclick = () => window.print();
  document.getElementById('grade-t').onclick = () =>
    $app.querySelectorAll('.post-fotos .grade').forEach((g) => (g.hidden = !g.hidden));
}

/* ================= NOTIFICAÇÕES PUSH ================= */
const VAPID_PUB = 'BJaMy5iaiHmB1quf2fmZe0m8IabwKFr98xYW9N4y-3yGtQKNTg-CIU9kvt5NwKGsyVFBq-shuTEkVcgDz78gRBo';
const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
// Android/Chrome: guarda o pedido de instalação para o botão "Instalar o app"
let pedidoInstalar = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pedidoInstalar = e;
  if (location.hash === '#/conexoes') viewConexoes();
});
window.addEventListener('appinstalled', () => {
  pedidoInstalar = null;
  try {
    localStorage.setItem('nx-instalado', '1');
  } catch {}
  if (location.hash === '#/conexoes') viewConexoes();
});
const IC_COMPART =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
const IC_MAIS =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-3px"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
function instalarHTML() {
  if (instalado())
    return `<div class="card inst-card ok"><b>App instalado ✓</b><p class="small muted" style="margin-top:4px">Você já está usando o app da Nexos pela tela de início.</p></div>`;
  if (ehIOS())
    return `<div class="card inst-card"><b>No iPhone, pelo Safari</b><ol class="inst-passos">
      <li>Abra este link no <b>Safari</b>.</li>
      <li>Toque em <span class="inst-ic">${IC_COMPART}</span> <b>Compartilhar</b>, na barra de baixo (ou de cima).</li>
      <li>Role a lista e toque em <span class="inst-ic">${IC_MAIS}</span> <b>Adicionar à Tela de Início</b>.</li>
      <li>Toque em <b>Adicionar</b>. Pronto: o ícone da Nexos aparece junto dos seus apps.</li></ol>
      <p class="tiny dim">Depois abra sempre pelo ícone. É assim que as notificações funcionam no iPhone.</p></div>`;
  return `<div class="card inst-card"><b>No Android</b>
      ${pedidoInstalar ? `<p class="small muted" style="margin-top:4px">Um toque e o app da Nexos fica na sua tela de início, como qualquer aplicativo.</p><button class="btn block" id="inst-btn" style="margin-top:12px"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg> Instalar o app</button>` : ''}
      ${pedidoInstalar ? '<p class="tiny dim" style="margin:14px 0 0">Se o botão não funcionar:</p>' : ''}<ol class="inst-passos">
      <li>Abra este link no <b>Chrome</b>.</li>
      <li>Toque nos <b>três pontinhos ⋮</b>, no canto de cima.</li>
      <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>
      <li>Confirme em <b>Instalar</b>. O ícone da Nexos aparece junto dos seus apps.</li></ol></div>`;
}
function bindInstalar(root) {
  const b = root.querySelector('#inst-btn');
  if (!b) return;
  b.onclick = async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    const r = await pedidoInstalar.userChoice.catch(() => null);
    pedidoInstalar = null;
    if (r && r.outcome === 'accepted') toast('App instalado! Procure o ícone da Nexos na tela de início.');
    viewConexoes();
  };
}
let swReg = null;
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker
    .register('sw.js', AREA === 'treinador' ? { scope: '/treinador/' } : undefined)
    .then((r) => {
      swReg = r;
      r.update().catch(() => {});
    })
    .catch(() => {}); // sempre procura versão nova do service worker
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.nav) location.href = e.data.nav;
    if (e.data && e.data.atualizado) versaoNova = true; // aplicada sozinha na próxima volta ao app
  });
}
// versão nova sem botão de atualizar: quem fecha e abre o app já recebe a versão nova; quem só deixou o app em
// segundo plano recebe ao voltar depois de um tempo, desde que não esteja no meio de algo (treino pelo GPS,
// formulário aberto, vídeo gravando ou digitando)
let versaoNova = false,
  saiuEm = 0;
const podeRecarregar = () => {
  const gps = store.get('nx-gps', null);
  if (gps && (gps.estado === 'correndo' || gps.estado === 'pausado')) return false;
  if (!$sheet.hidden || document.querySelector('.replay, .retro')) return false;
  const a = document.activeElement;
  return !(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
};
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saiuEm = Date.now();
  else if (versaoNova && saiuEm && Date.now() - saiuEm > 15000 && podeRecarregar()) location.reload();
  else checarVersao();
});
/* conferência de versão: app/versao.json traz a versão publicada; se o código aberto no aparelho for outro
   (cópia velha guardada no celular), apaga as cópias e recarrega uma vez (sem interromper treino ou formulário) */
let versaoChecadaEm = 0;
async function checarVersao(forcar) {
  // arquivo de base velho junto com este novo (cópia misturada): NX_BUILD nem existe, então também conta como versão velha
  const aberta = typeof NX_BUILD === 'string' ? NX_BUILD : '';
  if ((aberta && !/^v/.test(aberta)) || (!forcar && Date.now() - versaoChecadaEm < 60000)) return;
  versaoChecadaEm = Date.now();
  try {
    const r = await fetch(new URL('/app/versao.json?t=' + Date.now(), location.href), { cache: 'no-store' });
    const { v, n } = await r.json();
    // página velha guardada (lista antiga de arquivos) aberta com o código novo: falta arquivo e alguma tela quebra
    const nAberta = [...document.scripts].filter((x) => /\/js\/\d\d[a-z]?-/.test(x.src)).length;
    const misturada = !!n && nAberta > 0 && nAberta !== n;
    if (!v || (v === aberta && !misturada)) return;
    let tentou = '';
    try {
      tentou = sessionStorage.getItem('nx-versao-tentou') || '';
    } catch {}
    const chave = misturada ? v + '+lista' : v;
    if (tentou === chave) return; // já recarregou uma vez para esta versão
    if (window.caches) for (const k of await caches.keys()) if (k.startsWith('nx-app-')) await caches.delete(k);
    if (swReg) swReg.update().catch(() => {});
    try {
      sessionStorage.setItem('nx-versao-tentou', chave);
    } catch {}
    if (!podeRecarregar()) {
      versaoNova = true;
      return;
    }
    location.reload();
  } catch {}
}
setTimeout(checarVersao, 1500);
// quem já permitiu as notificações tem a inscrição conferida uma vez por dia (se o servidor perdeu, volta sem perguntar nada)
async function sincronizarPush() {
  try {
    if (!pushSuportado() || Notification.permission !== 'granted' || !S.user || !(S.org || S.esperaOrg)) return;
    const hoje = hojeISO();
    if (store.get('nx-push-sync') === hoje) return;
    await ativarPushInterno(true);
    store.set('nx-push-sync', hoje);
  } catch {}
}
setTimeout(sincronizarPush, 6000);
// versão nova esperando porque havia um aviso aberto na entrada: atualiza assim que ele for fechado
document.addEventListener('nx:painel-fechado', () =>
  setTimeout(() => {
    if (versaoNova && podeRecarregar()) location.reload();
  }, 400),
);
function notificar(acao, id, extra) {
  if (!id) return;
  try {
    sb.functions.invoke('nx-push', { body: { acao, id, ...(extra || {}) } }).catch(() => {});
  } catch {}
}
const b64u = (s) => {
  const p = '='.repeat((4 - (s.length % 4)) % 4);
  const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...r].map((c) => c.charCodeAt(0)));
};
async function inscricaoAtual() {
  if (!pushSuportado()) return null;
  try {
    const reg = swReg || (await navigator.serviceWorker.getRegistration());
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}
class ErroPT extends Error {}
async function ativarPush() {
  try {
    await ativarPushInterno();
  } catch (e) {
    throw e instanceof ErroPT ? e : new Error('Não foi possível ativar as notificações neste navegador.');
  }
}
async function ativarPushInterno(silencioso) {
  if (!pushSuportado()) {
    if (ehIOS() && !instalado())
      throw new ErroPT(
        'No iPhone, primeiro adicione o app à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.',
      );
    throw new ErroPT('Este navegador não aceita notificações.');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted')
    throw new ErroPT('Notificações bloqueadas. Libere nas configurações do navegador para este site.');
  const reg =
    swReg ||
    (await navigator.serviceWorker.register('sw.js', AREA === 'treinador' ? { scope: '/treinador/' } : undefined));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUB) });
  const j = sub.toJSON();
  const { data, error } = await sb.functions.invoke('nx-push', {
    body: {
      acao: 'inscrever',
      org_id: (S.org || S.esperaOrg).id,
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
      dispositivo: navigator.userAgent.slice(0, 120),
    },
  });
  if (error || data?.erro) throw new ErroPT('Não foi possível ativar agora. Tente de novo.');
  if (!silencioso) sb.functions.invoke('nx-push', { body: { acao: 'teste' } }).catch(() => {});
  store.set('nx-push-ok', 1);
}
async function desativarPush() {
  const sub = await inscricaoAtual();
  if (sub) {
    await sb.functions.invoke('nx-push', { body: { acao: 'desinscrever', endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  }
  store.del('nx-push-ok');
}
// "Agora não" esconde o cartão por 3 dias; depois ele volta até a pessoa ativar
const pushDispensado = () => {
  const t = +store.get('nx-push-dispensado') || 0;
  return t > 1 && Date.now() - t < 3 * 864e5;
};
function cartaoPushHTML() {
  if (pushDispensado() || store.get('nx-push-ok')) return '';
  // bloqueou sem querer: explica como liberar nas configurações
  if (pushSuportado() && Notification.permission === 'denied')
    return `<div class="card push-card" id="push-card"><div class="row" style="gap:12px;align-items:flex-start"><span class="go">${I.bell}</span><div class="grow"><b>As notificações estão bloqueadas</b><p class="small muted">${S.staff ? 'Assim você não fica sabendo na hora dos treinos, dores e mensagens dos alunos.' : 'Assim você não recebe o aviso do treino do dia, das mensagens do treinador nem da mensalidade.'} Para liberar: <b>Android:</b> toque e segure o ícone da Nexos › Informações do app › Notificações › Permitir. <b>iPhone:</b> Ajustes › Notificações › Nexos › Permitir Notificações. <b>Computador:</b> clique no cadeado ao lado do endereço › Notificações › Permitir.</p>
    <div class="row" style="gap:8px;margin-top:10px"><button class="link-btn small" id="push-x">Agora não</button></div></div></div></div>`;
  if (pushSuportado() && Notification.permission !== 'default') return '';
  if (!pushSuportado() && !(ehIOS() && !instalado())) return '';
  return `<div class="card push-card" id="push-card"><div class="row" style="gap:12px;align-items:flex-start"><span class="go">${I.bell}</span><div class="grow"><b>Ative as notificações</b><p class="small muted">${S.staff ? 'Saiba na hora quando um aluno finalizar o treino, relatar dor ou mandar mensagem.' : 'Saiba na hora quando o treinador mandar treino novo, mensagem ou relatório.'}</p>
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" id="push-on">Ativar</button><button class="link-btn small" id="push-x">Agora não</button></div></div></div></div>`;
}
function bindCartaoPush() {
  const on = document.getElementById('push-on');
  if (!document.getElementById('push-card')) return;
  if (on)
    on.onclick = async () => {
      try {
        await ativarPush();
        toast('Notificações ativadas!');
        document.getElementById('push-card').remove();
      } catch (e) {
        toast(e.message, true);
      }
    };
  document.getElementById('push-x').onclick = () => {
    store.set('nx-push-dispensado', Date.now());
    document.getElementById('push-card').remove();
  };
}
async function secaoNotificacoes(el) {
  const sub = await inscricaoAtual();
  const ativo = !!sub && pushSuportado() && Notification.permission === 'granted';
  el.innerHTML = `<div class="card"><div class="row between" style="gap:12px"><div><b>Notificações neste aparelho</b><p class="small muted">${ativo ? 'Ativadas.' : !pushSuportado() ? (ehIOS() && !instalado() ? 'No iPhone, adicione o app à tela de início e abra por lá para ativar.' : 'Este navegador não aceita notificações.') : Notification.permission === 'denied' ? 'Bloqueadas no navegador. Libere nas configurações do site.' : 'Desativadas.'}</p></div>
    ${pushSuportado() && Notification.permission !== 'denied' ? `<button class="btn ${ativo ? 'ghost' : ''} sm" id="push-tg">${ativo ? 'Desativar' : 'Ativar'}</button>` : ''}</div></div>`;
  const b = el.querySelector('#push-tg');
  if (b)
    b.onclick = async () => {
      b.disabled = true;
      try {
        ativo ? await desativarPush() : await ativarPush();
        toast(ativo ? 'Notificações desativadas.' : 'Notificações ativadas!');
      } catch (e) {
        toast(e.message, true);
      }
      secaoNotificacoes(el);
    };
}

function viewTermoLido() {
  const t = (S.cache.saude || {}).termo;
  $app.innerHTML = `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Privacidade</p><h1 class="h1">Termo e seus dados</h1>
    ${t ? `<span class="tag ok" style="margin-top:12px">Você aceitou em ${fmtDia(t.aceito_em)} · versão ${esc(t.versao)}</span>` : ''}
    <div class="card termo" style="margin-top:16px">${termoTexto()}</div>
    <p class="small muted" style="margin-top:16px">Quer uma cópia dos seus dados, corrigir algo ou pedir a exclusão? Escreva para <b>${esc(CONTATO.email)}</b> ou fale com o seu treinador.</p>`;
}
