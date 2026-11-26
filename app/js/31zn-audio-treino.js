/* Nexos App · Áudio do treinador no treino.
   O treinador grava um áudio de feedback logo abaixo da Conversa do treino (corrida, treino da planilha ou treino de
   força). O aluno recebe uma notificação (função nx-audio-treino, que também marca o treino como visto) e ouve no
   próprio treino, com a onda da voz, avanço tocando na onda e velocidade 1x, 1,5x e 2x. O treinador vê se o aluno já
   ouviu. Até 3 minutos por áudio, gravado em AAC (toca em Android e iPhone) quando o celular permite. A gravação
   fica numa barra flutuante: a tela continua livre para rolar e ver os números enquanto o treinador fala. */
'use strict';

const TA_MAX_S = 180;
const TA_BARRAS = 48;
const TA_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';
const TA_PLAY =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
const TA_PAUSE =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>';
const TA_STOP =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>';

const TA_RAPIDAS = ['Entendi, valeu!', 'Bora pro próximo!', 'Fiquei com uma dúvida'];
const taDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** lugar do áudio na tela do treino (fica logo abaixo do botão da Conversa do treino) */
function taHTML(ref, alunoId, titulo) {
  return `<div class="ta-box" data-ta="${ref}" data-ta-al="${alunoId}" data-ta-t="${esc(titulo || 'Treino')}"></div>`;
}

/** ondas guardadas (0 a 100) ou uma onda neutra para áudio sem onda */
function taOndas(a) {
  const o = Array.isArray(a.ondas) && a.ondas.length ? a.ondas : null;
  return Array.from({ length: TA_BARRAS }, (_, i) =>
    o ? o[Math.floor((i * o.length) / TA_BARRAS)] || 6 : 30 + 25 * Math.sin(i * 0.7),
  );
}

function taPlayerHTML(a, url, equipe) {
  const autor = (equipe || []).find((p) => p.user_id === a.autor_id) || {};
  const meu = S.staff;
  const novo = !S.staff && !a.ouvido_em;
  const ondas = taOndas(a);
  return `<div class="ta-card${novo ? ' novo' : ''}" data-ta-id="${a.id}">
    <div class="ta-top">
      <span class="ta-av">${typeof fotoHTML === 'function' ? fotoHTML(autor) : ''}<i>${TA_IC}</i></span>
      <div class="grow" style="min-width:0"><b>${S.staff ? 'Áudio para o aluno' : 'Áudio do seu treinador'}</b>
        <span class="ta-sub">${esc(firstName(autor.nome) || 'Treinador')} · ${fmtDia(a.criado_em)} · ${fmtHora(a.criado_em)}</span></div>
      ${novo ? '<span class="ta-novo">Novo</span>' : ''}
      ${meu ? `<span class="ta-ouvido ${a.ouvido_em ? 'sim' : ''}">${a.ouvido_em ? `${I.check} Ouvido` : 'Ainda não ouviu'}</span>` : ''}
    </div>
    <div class="ta-player">
      <button type="button" class="ta-play" aria-label="Ouvir">${TA_PLAY}</button>
      <div class="ta-onda" role="slider" aria-label="Posição do áudio" aria-valuemin="0" aria-valuemax="${a.seg}" aria-valuenow="0" tabindex="0">${ondas
        .map((v) => `<i style="height:${Math.max(10, Math.min(100, v))}%"></i>`)
        .join('')}</div>
      <span class="ta-tempo">${taDur(a.seg)}</span>
      <button type="button" class="ta-vel" aria-label="Velocidade">1x</button>
    </div>
    ${meu && a.autor_id === S.user.id ? '<button type="button" class="link-btn tiny ta-apagar">Apagar áudio</button>' : ''}
    ${
      !S.staff
        ? `<div class="ta-resp-area"><button type="button" class="ta-resp">${CT_IC}<span>Responder ao treinador</span></button>
      <form class="ta-resp-f" hidden><div class="ta-rapidas">${TA_RAPIDAS.map((t) => `<button type="button" class="chip">${esc(t)}</button>`).join('')}</div>
        <textarea class="textarea" rows="2" maxlength="2000" placeholder="Escreva a sua resposta"></textarea>
        <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn ghost sm ta-resp-x">Cancelar</button><button type="submit" class="btn sm grow">Enviar resposta</button></div></form></div>`
        : ''
    }
    <audio preload="metadata" ${url ? `src="${esc(url)}"` : ''}></audio>
  </div>`;
}

function taBindPlayer(card, a) {
  const au = card.querySelector('audio'),
    bt = card.querySelector('.ta-play'),
    onda = card.querySelector('.ta-onda'),
    tempo = card.querySelector('.ta-tempo'),
    vel = card.querySelector('.ta-vel');
  const barras = [...onda.children];
  const dur = () => (isFinite(au.duration) && au.duration > 0 ? au.duration : a.seg);
  const pintar = () => {
    const f = au.currentTime / dur();
    const k = Math.round(f * barras.length);
    barras.forEach((b, i) => b.classList.toggle('on', i < k));
    tempo.textContent = au.paused && !au.currentTime ? taDur(a.seg) : taDur(au.currentTime);
    onda.setAttribute('aria-valuenow', String(Math.round(au.currentTime)));
  };
  let marcou = !!a.ouvido_em;
  bt.onclick = async () => {
    if (!au.src) return toast('Áudio ainda carregando. Tente de novo.', true);
    if (au.paused) {
      document.querySelectorAll('.ta-card audio').forEach((x) => x !== au && x.pause());
      try {
        await au.play();
      } catch {
        return toast('Não foi possível tocar o áudio. Verifique a internet.', true);
      }
      if (!marcou && !S.staff && a.aluno_id === S.user.id) {
        marcou = true;
        sb.rpc('nx_treino_audio_ouvido', { p_id: a.id }).then(
          () => {
            card.classList.remove('novo');
            card.querySelector('.ta-novo')?.remove();
          },
          () => {},
        );
      }
    } else au.pause();
  };
  au.onplay = () => {
    bt.innerHTML = TA_PAUSE;
    bt.setAttribute('aria-label', 'Pausar');
    card.classList.add('tocando');
  };
  au.onpause = () => {
    bt.innerHTML = TA_PLAY;
    bt.setAttribute('aria-label', 'Ouvir');
    card.classList.remove('tocando');
  };
  au.onended = () => {
    au.currentTime = 0;
    pintar();
  };
  au.ontimeupdate = pintar;
  const ir = (x) => {
    const r = onda.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (x - r.left) / r.width));
    if (au.src) au.currentTime = f * dur();
    pintar();
  };
  onda.onclick = (e) => ir(e.clientX);
  onda.onkeydown = (e) => {
    if (e.key === 'ArrowRight') au.currentTime = Math.min(dur(), au.currentTime + 5);
    else if (e.key === 'ArrowLeft') au.currentTime = Math.max(0, au.currentTime - 5);
    else return;
    e.preventDefault();
    pintar();
  };
  const vs = [1, 1.5, 2];
  vel.onclick = () => {
    const i = (vs.indexOf(au.playbackRate) + 1) % vs.length;
    au.playbackRate = vs[i];
    vel.textContent = String(vs[i]).replace('.', ',') + 'x';
  };
  const ap = card.querySelector('.ta-apagar');
  if (ap)
    ap.onclick = async () => {
      if (!confirm('Apagar este áudio? O aluno deixa de ver.')) return;
      const { error } = await sb.from('nx_treino_audios').delete().eq('id', a.id);
      if (error) return toast('Não foi possível apagar.', true);
      sb.storage
        .from('nx-audios')
        .remove([a.path])
        .catch(() => {});
      const box = card.closest('[data-ta]');
      if (box) box.removeAttribute('data-ta-ok');
      taCarregar(document);
      toast('Áudio apagado.');
    };
}

/** o aluno responde ao áudio com uma mensagem: vai para a Conversa do treino e o treinador recebe o aviso */
function taBindResposta(card, a, box) {
  const bt = card.querySelector('.ta-resp'),
    f = card.querySelector('.ta-resp-f');
  if (!bt || !f) return;
  const ta = f.querySelector('textarea');
  bt.onclick = () => {
    bt.hidden = true;
    f.hidden = false;
    setTimeout(() => ta.focus(), 50);
  };
  f.querySelector('.ta-resp-x').onclick = () => {
    f.hidden = true;
    bt.hidden = false;
  };
  f.querySelectorAll('.ta-rapidas .chip').forEach(
    (c) =>
      (c.onclick = () => {
        ta.value = c.textContent === 'Fiquei com uma dúvida' ? 'Fiquei com uma dúvida: ' : c.textContent;
        ta.focus();
      }),
  );
  f.onsubmit = async (e) => {
    e.preventDefault();
    const texto = ta.value.trim();
    if (!texto) return toast('Escreva a resposta.', true);
    const env = f.querySelector('[type=submit]');
    env.disabled = true;
    env.textContent = 'Enviando…';
    const { data, error } = await sb
      .from('nx_treino_msgs')
      .insert({
        org_id: a.org_id || S.org.id,
        aluno_id: S.user.id,
        ref: a.ref,
        titulo: box.dataset.taT || a.titulo || null,
        texto: `Sobre o seu áudio: ${texto}`,
      })
      .select('id')
      .single();
    if (error) {
      env.disabled = false;
      env.textContent = 'Tentar de novo';
      return toast('Não foi possível enviar. Verifique a internet.', true);
    }
    notificar('treino_msg', data && data.id);
    f.outerHTML = `<p class="ta-resp-ok">${I.check}<span>Resposta enviada. Seu treinador recebe o aviso e responde na <b>Conversa do treino</b>.</span></p>`;
    bt.remove();
    document.querySelectorAll(`[data-ct="${a.ref}"]`).forEach((b) => b.removeAttribute('data-ct-ok'));
    if (typeof ctContar === 'function') ctContar(document);
  };
}

let taCarregando = false;
async function taCarregar(raiz) {
  const boxes = [...(raiz || document).querySelectorAll('[data-ta]:not([data-ta-ok])')];
  if (!boxes.length || taCarregando || !S.org) return;
  taCarregando = true;
  try {
    boxes.forEach((b) => (b.dataset.taOk = '1'));
    const refs = [...new Set(boxes.map((b) => b.dataset.ta))];
    const [{ data }, equipe] = await Promise.all([
      sb.from('nx_treino_audios').select('*').in('ref', refs).order('criado_em', { ascending: true }),
      carregarEquipe().catch(() => []),
    ]);
    const lista = data || [];
    let urls = {};
    if (lista.length) {
      const r = await sb.storage
        .from('nx-audios')
        .createSignedUrls(
          lista.map((a) => a.path),
          3600,
        )
        .catch(() => ({ data: [] }));
      (r.data || []).forEach((u, i) => u && u.signedUrl && (urls[lista[i].id] = u.signedUrl));
    }
    boxes.forEach((box) => {
      const meus = lista.filter((a) => a.ref === box.dataset.ta);
      box.innerHTML =
        meus.map((a) => taPlayerHTML(a, urls[a.id], equipe)).join('') +
        (S.staff
          ? `<button type="button" class="ta-gravar">${TA_IC}<span><b>${meus.length ? 'Mandar outro áudio' : 'Mandar áudio para o aluno'}</b><small>Feedback falado do treino, até 3 minutos</small></span></button>`
          : '');
      box.hidden = !box.innerHTML;
      meus.forEach((a) => {
        const c = box.querySelector(`[data-ta-id="${a.id}"]`);
        if (c) {
          taBindPlayer(c, a);
          if (!S.staff) taBindResposta(c, a, box);
        }
      });
      const g = box.querySelector('.ta-gravar');
      if (g) g.onclick = () => taGravar(box.dataset.ta, box.dataset.taAl, box.dataset.taT);
    });
  } catch (e) {
    console.error(e);
  } finally {
    taCarregando = false;
  }
}
// qualquer tela que tenha o lugar do áudio é preenchida sozinha
let taObsT = 0;
new MutationObserver(() => {
  clearTimeout(taObsT);
  taObsT = setTimeout(() => taCarregar(document), 300);
}).observe(document.getElementById('app'), { childList: true, subtree: true });
// o áudio fica dentro de cartões clicáveis (lista de treinos de força): tocar não abre o cartão
document.addEventListener(
  'click',
  (e) => {
    if (e.target.closest('.ta-box') && e.target.closest('[data-sessao]')) e.stopPropagation();
  },
  true,
);

/* ---------- gravação (só a equipe) ---------- */
function taTipo() {
  if (!window.MediaRecorder) return '';
  return (
    ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    ) || ''
  );
}
/** níveis de volume (gravados a cada 100 ms) viram 48 barras de 0 a 100 */
function taReduzirOndas(niveis) {
  if (!niveis.length) return null;
  const out = [];
  for (let i = 0; i < TA_BARRAS; i++) {
    const a = Math.floor((i * niveis.length) / TA_BARRAS),
      b = Math.max(a + 1, Math.floor(((i + 1) * niveis.length) / TA_BARRAS));
    out.push(Math.max(...niveis.slice(a, b)));
  }
  const m = Math.max(...out) || 1;
  return out.map((v) => Math.max(6, Math.round((Math.sqrt(v / m) * 100) | 0)));
}

/** voz mais natural, como áudio de WhatsApp: corta o grave do vento e do ar-condicionado, comprime de leve e baixa o
    chiado nos intervalos da fala (o volume do fundo cai quando ninguém está falando) */
function taCadeiaVoz(stream) {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  const ctx = new C({ latencyHint: 'interactive' });
  const fonte = ctx.createMediaStreamSource(stream);
  const passaAlta = ctx.createBiquadFilter();
  passaAlta.type = 'highpass';
  passaAlta.frequency.value = 90;
  passaAlta.Q.value = 0.7;
  const corteChiado = ctx.createBiquadFilter();
  corteChiado.type = 'lowpass';
  corteChiado.frequency.value = 9000;
  const presenca = ctx.createBiquadFilter();
  presenca.type = 'peaking';
  presenca.frequency.value = 3000;
  presenca.Q.value = 0.9;
  presenca.gain.value = 2;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -26;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.008;
  comp.release.value = 0.25;
  const portao = ctx.createGain();
  const ganho = ctx.createGain();
  ganho.gain.value = 1.5;
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  const saida = ctx.createMediaStreamDestination();
  fonte.connect(passaAlta);
  passaAlta.connect(corteChiado);
  corteChiado.connect(presenca);
  presenca.connect(an);
  presenca.connect(comp);
  comp.connect(portao);
  portao.connect(ganho);
  ganho.connect(saida);
  return { ctx, an, portao, saida: saida.stream };
}

let taAtual = null;
function taGravar(ref, alunoId, titulo) {
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Este navegador não grava áudio.', true);
  if (taAtual) return toast('Termine o áudio que está aberto embaixo da tela.', true);
  // barra flutuante: a tela continua livre para rolar e ver os números do treino enquanto grava
  const el = document.createElement('div');
  el.className = 'ta-flut';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Gravação de áudio para o aluno');
  el.innerHTML = `<div class="ta-f-rec">
      <span class="ta-f-ponto" aria-hidden="true"></span>
      <div class="grow" style="min-width:0"><b class="ta-f-rel">0:00</b><span class="ta-f-t">${esc(titulo || 'Treino')}</span></div>
      <canvas class="ta-f-viz" width="240" height="60" aria-hidden="true"></canvas>
      <button type="button" class="ta-f-x" aria-label="Descartar">${I.x || '×'}</button>
      <button type="button" class="ta-f-parar" aria-label="Parar a gravação">${TA_STOP}</button>
    </div>
    <div class="ta-f-rev" hidden>
      <div class="ta-f-prev"></div>
      <div class="ta-f-acoes"><button type="button" class="btn ghost sm ta-f-x2">Descartar</button><button type="button" class="btn ghost sm ta-f-denovo">Gravar de novo</button><button type="button" class="btn sm ta-f-enviar">Enviar</button></div>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add('com-ta-flut');
  taAtual = el;
  const $ = (q) => el.querySelector(q);
  const rel = $('.ta-f-rel'),
    cv = $('.ta-f-viz'),
    g = cv.getContext('2d');
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--p2').trim() || '#e5383b';
  let rec = null,
    stream = null,
    cadeia = null,
    raf = 0,
    tm = 0,
    t0 = 0,
    niveis = [],
    partes = [],
    blob = null,
    seg = 0,
    ondas = null,
    url = null,
    descartando = false;
  const desenhar = () => {
    const W = cv.width,
      H = cv.height,
      n = 30,
      bw = W / n;
    g.clearRect(0, 0, W, H);
    const ult = niveis.slice(-n);
    g.fillStyle = cor;
    ult.forEach((v, i) => {
      const h = Math.max(4, Math.min(H, Math.sqrt(v) * H * 2.4));
      const x = W - (ult.length - i) * bw;
      g.globalAlpha = 0.35 + (0.65 * i) / n;
      g.beginPath();
      if (g.roundRect) g.roundRect(x + 2, (H - h) / 2, bw - 4, h, 3);
      else g.rect(x + 2, (H - h) / 2, bw - 4, h);
      g.fill();
    });
    g.globalAlpha = 1;
  };
  const soltar = () => {
    cancelAnimationFrame(raf);
    clearInterval(tm);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (cadeia) cadeia.ctx.close().catch(() => {});
    cadeia = null;
  };
  const fechar = () => {
    descartando = true;
    if (rec && rec.state !== 'inactive') rec.stop();
    soltar();
    $('.ta-f-prev audio')?.pause();
    if (url) URL.revokeObjectURL(url);
    el.classList.add('saindo');
    setTimeout(() => el.remove(), 200);
    document.body.classList.remove('com-ta-flut');
    taAtual = null;
  };
  const parar = () => rec && rec.state !== 'inactive' && rec.stop();
  const comecar = async () => {
    descartando = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
    } catch {
      toast('Libere o microfone para gravar.', true);
      return fechar();
    }
    cadeia = taCadeiaVoz(stream);
    const tipo = taTipo();
    const fonte = cadeia ? cadeia.saida : stream;
    try {
      rec = new MediaRecorder(fonte, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 96000 });
    } catch {
      rec = new MediaRecorder(fonte);
    }
    partes = [];
    niveis = [];
    const buf = new Float32Array(1024);
    const janela = [];
    let ultimo = 0,
      piso = 0.004,
      aberto = 1;
    const loop = (t) => {
      if (cadeia && t - ultimo > 40) {
        ultimo = t;
        cadeia.an.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const v = Math.sqrt(s / buf.length);
        // piso de ruído: o nível dos 15% mais baixos dos últimos 4 segundos (as pausas entre palavras). Fala bem acima
        // dele abre o portão; perto do piso o fundo cai uns 14 dB, com fechamento suave para não cortar o fim das palavras
        janela.push(v);
        if (janela.length > 100) janela.shift();
        const ord = janela.slice().sort((x, y) => x - y);
        piso = Math.max(0.0008, ord[Math.floor(ord.length * 0.15)]);
        const alvo = janela.length < 10 ? 1 : v > piso * 2.5 ? 1 : v < piso * 1.6 ? 0.2 : aberto;
        if (alvo !== aberto) {
          aberto = alvo;
          cadeia.portao.gain.setTargetAtTime(alvo, cadeia.ctx.currentTime, alvo === 1 ? 0.01 : 0.12);
        }
        if (niveis.length < 100000 && (!niveis._t || t - niveis._t > 90)) {
          niveis._t = t;
          niveis.push(v);
          desenhar();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    rec.ondataavailable = (e) => e.data && e.data.size && partes.push(e.data);
    rec.onstop = () => {
      seg = Math.max(1, Math.round((Date.now() - t0) / 1000));
      soltar();
      if (descartando) return;
      if (seg < 2) {
        toast('Muito curto. Fale um pouco mais.', true);
        return fechar();
      }
      const mime = ((rec && rec.mimeType) || tipo || 'audio/webm').split(';')[0];
      blob = new Blob(partes, { type: mime });
      ondas = taReduzirOndas(niveis);
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      $('.ta-f-prev').innerHTML = taPlayerHTML(
        { id: 'previa', seg, ondas, autor_id: S.user.id, criado_em: new Date().toISOString(), ouvido_em: 1 },
        url,
        [{ user_id: S.user.id, nome: S.me && S.me.nome, foto_url: S.me && S.me.foto_url }],
      );
      const card = $('.ta-f-prev .ta-card');
      card.querySelector('.ta-top')?.remove();
      card.querySelector('.ta-apagar')?.remove();
      taBindPlayer(card, { id: 'previa', seg, ouvido_em: 1 });
      $('.ta-f-rec').hidden = true;
      $('.ta-f-rev').hidden = false;
      el.classList.add('revisao');
    };
    rec.start(1000);
    t0 = Date.now();
    tm = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      rel.textContent = `${taDur(s)} / 3:00`;
      if (s >= TA_MAX_S) parar();
    }, 250);
  };
  $('.ta-f-parar').onclick = parar;
  $('.ta-f-x').onclick = fechar;
  $('.ta-f-x2').onclick = fechar;
  $('.ta-f-denovo').onclick = () => {
    $('.ta-f-prev audio')?.pause();
    blob = null;
    rel.textContent = '0:00';
    g.clearRect(0, 0, cv.width, cv.height);
    $('.ta-f-rev').hidden = true;
    $('.ta-f-rec').hidden = false;
    el.classList.remove('revisao');
    comecar();
  };
  $('.ta-f-enviar').onclick = async (e) => {
    const bt = e.currentTarget;
    if (!blob) return;
    if (blob.size > 5 * 1024 * 1024) return toast('Áudio grande demais. Grave um mais curto.', true);
    $('.ta-f-prev audio')?.pause();
    bt.disabled = true;
    bt.textContent = 'Enviando…';
    const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('aac') ? 'aac' : 'm4a';
    const path = `${S.org.id}/${alunoId}/treino-${Date.now()}.${ext}`;
    const up = await sb.storage.from('nx-audios').upload(path, blob, { contentType: blob.type });
    if (up.error) {
      console.error(up.error);
      bt.disabled = false;
      bt.textContent = 'Tentar de novo';
      return toast('Não foi possível enviar o áudio. Verifique a internet.', true);
    }
    const { data, error } = await sb
      .from('nx_treino_audios')
      .insert({ org_id: S.org.id, aluno_id: alunoId, ref, titulo: titulo || null, path, seg, ondas })
      .select('id')
      .single();
    if (error) {
      console.error(error);
      sb.storage
        .from('nx-audios')
        .remove([path])
        .catch(() => {});
      bt.disabled = false;
      bt.textContent = 'Tentar de novo';
      return toast('Não foi possível enviar o áudio.', true);
    }
    try {
      await sb.functions.invoke('nx-audio-treino', { body: { id: data.id } });
    } catch {}
    fechar();
    toast('Áudio enviado! O aluno recebe o aviso e ouve no treino.');
    document.querySelectorAll(`[data-ta="${ref}"]`).forEach((b) => b.removeAttribute('data-ta-ok'));
    taCarregar(document);
    if (typeof contarNaoVistos === 'function')
      contarNaoVistos()
        .then(dockStaff)
        .catch(() => {});
  };
  comecar();
}
