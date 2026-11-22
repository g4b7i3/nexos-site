// Vídeos dos exercícios: cada aparelho baixa cada vídeo uma vez só, guarda no próprio aparelho e toca dali.
// Antes o vídeo vinha da internet toda vez (o iPhone pedia de novo a cada volta do vídeo em loop e a cada lista
// redesenhada), e um aparelho chegou a puxar 36 GB num dia. Listas mostram só a capa (uma foto tirada do vídeo).
const EXV_CACHE = 'nx-exvideos-v1';
const exvMemo = new Map(); // endereço -> Promise do endereço local (blob)

function exvLocal(url) {
  if (exvMemo.has(url)) return exvMemo.get(url);
  const p = (async () => {
    let c = null,
      r = null;
    try {
      c = await caches.open(EXV_CACHE);
      r = await c.match(url);
    } catch {
      c = null;
    }
    if (!r) {
      const rede = await fetch(url, { cache: 'force-cache' });
      if (!rede.ok) throw new Error('vídeo ' + rede.status);
      if (c) await c.put(url, rede.clone()).catch(() => {});
      r = rede;
    }
    const b = await r.blob();
    if (!b.size) throw new Error('vídeo vazio');
    return URL.createObjectURL(b.type && b.type.startsWith('video/') ? b : new Blob([b], { type: 'video/mp4' }));
  })();
  exvMemo.set(url, p);
  p.catch(() => exvMemo.delete(url));
  // guarda na memória só os mais recentes (o aparelho continua com todos no armazenamento)
  if (exvMemo.size > 16) {
    const [velho, pv] = exvMemo.entries().next().value;
    exvMemo.delete(velho);
    pv.then((u) => setTimeout(() => URL.revokeObjectURL(u), 60000)).catch(() => {});
  }
  return p;
}

// vídeo que não abre (arquivo vazio ou formato que o celular não lê): troca a tela preta por um aviso
function exvQuebrado(v) {
  if (!v.isConnected || v.dataset.exvErro) return;
  v.dataset.exvErro = '1';
  const d = document.createElement('div');
  d.className = 'exv-erro';
  d.innerHTML = `<b>Vídeo indisponível</b><span>${
    typeof S !== 'undefined' && S.staff
      ? 'O arquivo deste vídeo não abre neste celular. Envie o vídeo de novo em Editar.'
      : 'Siga as instruções abaixo enquanto o vídeo não volta.'
  }</span>`;
  v.replaceWith(d);
}

async function exvLigar(v) {
  if (v.dataset.exvOk) return;
  v.dataset.exvOk = '1';
  const url = v.dataset.exv;
  v.addEventListener('error', () => exvQuebrado(v));
  try {
    v.src = await exvLocal(url);
    v.preload = 'auto'; // já está no aparelho: mostra o primeiro quadro sem gastar internet
  } catch {
    v.src = url; // sem armazenamento no aparelho: toca direto, sem repetir em loop
    v.loop = false;
  }
  if (v.autoplay) v.play().catch(() => {});
}

const exvVisto =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            exvVisto.unobserve(e.target);
            exvLigar(e.target);
          }),
        { rootMargin: '200px' },
      )
    : null;

function exvProcurar(raiz) {
  if (!raiz || !raiz.querySelectorAll) return;
  const vs = raiz.matches && raiz.matches('video[data-exv]') ? [raiz] : [...raiz.querySelectorAll('video[data-exv]')];
  vs.forEach((v) => {
    if (v.dataset.exvOk || v.dataset.exvVisto) return;
    v.dataset.exvVisto = '1';
    if (exvVisto) exvVisto.observe(v);
    else exvLigar(v);
  });
}

if (window.MutationObserver)
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(exvProcurar))).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

// capa de cada vídeo: a equipe gera aos poucos, em segundo plano, a partir do vídeo já guardado no aparelho
async function exvCapaDe(url) {
  const local = await exvLocal(url);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = local;
  const espera = (ev, ms) =>
    new Promise((ok, erro) => {
      const t = setTimeout(() => erro(new Error('tempo')), ms);
      v.addEventListener(ev, () => (clearTimeout(t), ok()), { once: true });
    });
  await espera('loadeddata', 15000);
  await v
    .play()
    .then(() => v.pause())
    .catch(() => {});
  // um quadro do meio do movimento (perto do início a pessoa costuma estar parada se preparando)
  const alvo = (isFinite(v.duration) && v.duration > 0 ? v.duration : 1) * 0.4;
  if (Math.abs(v.currentTime - alvo) > 0.05) {
    v.currentTime = alvo;
    await espera('seeked', 8000);
  }
  const w = 480,
    h = Math.round((w * (v.videoHeight || 270)) / (v.videoWidth || 480));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext('2d');
  cx.drawImage(v, 0, 0, w, h);
  v.removeAttribute('src');
  v.load();
  // quadro todo preto (alguns celulares não desenham o vídeo): não vira capa
  const px = cx.getImageData(0, 0, w, h).data;
  let soma = 0;
  for (let i = 0; i < px.length; i += 400) soma += px[i] + px[i + 1] + px[i + 2];
  if (soma / (px.length / 400) / 3 < 10) return null;
  return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.8));
}

let exvCapasRodou = false,
  exvCapasRodando = false;
// exercícios com vídeo próprio e ainda sem capa
const exvSemCapa = (exs) =>
  (exs || []).filter((e) => !e.capa_url && e.video_url && /\/storage\/v1\/object\//.test(e.video_url));
async function exvGerarCapas({ limite = 30, aoProgresso } = {}) {
  if (exvCapasRodando || !S.staff || !S.org) return null;
  exvCapasRodando = true;
  const res = { feitas: 0, falhas: 0, total: 0 };
  try {
    const { data } = await sb
      .from('nx_exercicios')
      .select('id,video_url')
      .eq('org_id', S.org.id)
      .is('capa_url', null)
      .like('video_url', '%/storage/v1/object/%')
      .limit(limite);
    // o mesmo vídeo pode servir a mais de um exercício: tira a capa uma vez só
    const porVideo = new Map();
    const lista = exvSemCapa(data);
    for (const ex of lista) {
      const u = ex.video_url.split('#')[0];
      if (!porVideo.has(u)) porVideo.set(u, []);
      porVideo.get(u).push(ex.id);
    }
    res.total = lista.length;
    let k = 0;
    for (const [u, ids] of porVideo) {
      if (aoProgresso) aoProgresso(k, porVideo.size);
      k++;
      try {
        const jpg = await exvCapaDe(u);
        if (!jpg) {
          res.falhas += ids.length;
          continue;
        }
        const path = `${S.org.id}/capa-${ids[0]}-${Date.now().toString(36)}.jpg`;
        // sem upsert: substituir arquivo pede permissão de leitura no armazenamento, que a equipe não tem
        const up = await sb.storage
          .from('nx-exvideos')
          .upload(path, jpg, { cacheControl: '31536000', contentType: 'image/jpeg' });
        if (up.error) {
          res.falhas += ids.length;
          continue;
        }
        const capa = sb.storage.from('nx-exvideos').getPublicUrl(path).data.publicUrl;
        const { error } = await sb.from('nx_exercicios').update({ capa_url: capa }).in('id', ids);
        if (error) {
          res.falhas += ids.length;
          continue;
        }
        res.feitas += ids.length;
        ids.forEach((id) => {
          const c = S.cache && S.cache.ex && S.cache.ex.find && S.cache.ex.find((e) => e.id === id);
          if (c) c.capa_url = capa;
        });
      } catch {
        res.falhas += ids.length; // tenta de novo na próxima vez
      }
    }
    if (aoProgresso) aoProgresso(porVideo.size, porVideo.size);
  } finally {
    exvCapasRodando = false;
  }
  return res;
}
// botão da biblioteca: gera todas as capas que faltam, mostrando o andamento
function exvBotaoCapas(box, exs, aoTerminar) {
  const falta = exvSemCapa(exs).length;
  if (!box || !falta || !S.staff) return;
  box.innerHTML = `<div class="card exv-capas"><div class="grow"><b>${falta} ${falta === 1 ? 'vídeo sem capa' : 'vídeos sem capa'}</b><p class="small muted">A capa é um quadro do próprio vídeo e aparece na lista e para o aluno. Use o Wi-Fi: o app baixa cada vídeo uma vez.</p><p class="small" data-capas-st hidden></p></div><button type="button" class="btn sm" data-capas>Gerar capas</button></div>`;
  const bt = box.querySelector('[data-capas]'),
    st = box.querySelector('[data-capas-st]');
  bt.onclick = async () => {
    bt.disabled = true;
    st.hidden = false;
    st.textContent = 'Começando…';
    const r = await exvGerarCapas({
      limite: 500,
      aoProgresso: (k, n) => (st.textContent = `Gerando ${Math.min(k + 1, n)} de ${n}… deixe esta tela aberta.`),
    });
    if (!r) {
      st.textContent = 'As capas já estão sendo geradas. Tente de novo em instantes.';
      bt.disabled = false;
      return;
    }
    const prontas = `${r.feitas} ${r.feitas === 1 ? 'capa pronta' : 'capas prontas'}.`;
    toast(
      r.falhas
        ? `${prontas} ${r.falhas} ${r.falhas === 1 ? 'vídeo não abriu' : 'vídeos não abriram'} neste celular; envie de novo em Editar.`
        : prontas,
      !!r.falhas,
    );
    if (aoTerminar) aoTerminar();
  };
}
// começa um tempo depois de abrir o app, para não disputar a internet com a tela inicial
setTimeout(function tentarCapas() {
  if (typeof S !== 'undefined' && S.org) {
    if (S.staff && !exvCapasRodou) {
      exvCapasRodou = true;
      exvGerarCapas();
    }
  } else setTimeout(tentarCapas, 30000);
}, 45000);
