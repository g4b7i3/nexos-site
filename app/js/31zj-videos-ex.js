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

async function exvLigar(v) {
  if (v.dataset.exvOk) return;
  v.dataset.exvOk = '1';
  const url = v.dataset.exv;
  try {
    v.src = await exvLocal(url);
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
  const alvo = Math.min(0.5, (v.duration || 1) / 2);
  if (Math.abs(v.currentTime - alvo) > 0.05) {
    v.currentTime = alvo;
    await espera('seeked', 8000);
  }
  const w = 480,
    h = Math.round((w * (v.videoHeight || 270)) / (v.videoWidth || 480));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.getContext('2d').drawImage(v, 0, 0, w, h);
  v.removeAttribute('src');
  v.load();
  return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.8));
}

let exvCapasRodou = false;
async function exvGerarCapas() {
  if (exvCapasRodou || !S.staff || !S.org) return;
  exvCapasRodou = true;
  const { data } = await sb
    .from('nx_exercicios')
    .select('id,video_url')
    .eq('org_id', S.org.id)
    .is('capa_url', null)
    .like('video_url', '%/storage/v1/object/%')
    .limit(12);
  for (const ex of data || []) {
    try {
      const jpg = await exvCapaDe(ex.video_url.split('#')[0]);
      if (!jpg) continue;
      const path = `${S.org.id}/capa-${ex.id}.jpg`;
      const up = await sb.storage
        .from('nx-exvideos')
        .upload(path, jpg, { upsert: true, cacheControl: '31536000', contentType: 'image/jpeg' });
      if (up.error) continue;
      const capa = sb.storage.from('nx-exvideos').getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
      await sb.from('nx_exercicios').update({ capa_url: capa }).eq('id', ex.id);
      const c = S.cache && S.cache.ex && S.cache.ex.find && S.cache.ex.find((e) => e.id === ex.id);
      if (c) c.capa_url = capa;
    } catch {
      /* tenta de novo na próxima vez que o app abrir */
    }
  }
}
// começa um tempo depois de abrir o app, para não disputar a internet com a tela inicial
setTimeout(function tentarCapas() {
  if (typeof S !== 'undefined' && S.org) {
    if (S.staff) exvGerarCapas();
  } else setTimeout(tentarCapas, 30000);
}, 45000);
