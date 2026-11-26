/* Nexos App · Áudio do treinador no treino.
   O treinador grava um áudio de feedback logo abaixo da Conversa do treino (corrida, treino da planilha ou treino de
   força). O aluno recebe uma notificação (função nx-audio-treino, que também marca o treino como visto) e ouve no
   próprio treino, com a onda da voz, avanço tocando na onda e velocidade 1x, 1,5x e 2x. O treinador vê se o aluno já
   ouviu. Até 3 minutos por áudio, gravado em AAC (toca em Android e iPhone) quando o celular permite. */
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
        if (c) taBindPlayer(c, a);
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

function taGravar(ref, alunoId, titulo) {
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Este navegador não grava áudio.', true);
  openSheet(
    `<p class="eyebrow">${TA_IC} Áudio para o aluno</p><div class="h2" style="margin-top:4px">${esc(titulo || 'Treino')}</div>
    <p class="tiny dim" style="margin-top:4px">O aluno recebe um aviso no celular e ouve aqui no treino. Até 3 minutos.</p>
    <div class="ta-rec" id="ta-rec">
      <canvas class="ta-viz" id="ta-viz" width="600" height="120" aria-hidden="true"></canvas>
      <div class="ta-relogio" id="ta-rel">0:00<small> / 3:00</small></div>
      <button type="button" class="ta-mic" id="ta-mic" aria-label="Começar a gravar">${TA_IC}</button>
      <p class="small muted" id="ta-dica">Toque para começar a gravar</p>
    </div>
    <div class="ta-rev" id="ta-rev" hidden>
      <div id="ta-prev"></div>
      <div class="row" style="gap:8px;margin-top:14px"><button type="button" class="btn ghost" id="ta-de-novo">Gravar de novo</button><button type="button" class="btn grow" id="ta-enviar">Enviar para o aluno</button></div>
    </div>`,
    (box) => {
      const mic = box.querySelector('#ta-mic'),
        rel = box.querySelector('#ta-rel'),
        dica = box.querySelector('#ta-dica'),
        cv = box.querySelector('#ta-viz'),
        g = cv.getContext('2d');
      let rec = null,
        stream = null,
        ctx = null,
        an = null,
        raf = 0,
        tm = 0,
        t0 = 0,
        niveis = [],
        partes = [],
        blob = null,
        seg = 0,
        ondas = null,
        url = null;
      const cor = getComputedStyle(document.documentElement).getPropertyValue('--p2').trim() || '#e5383b';
      const desenhar = () => {
        const W = cv.width,
          H = cv.height,
          n = 60;
        g.clearRect(0, 0, W, H);
        const ult = niveis.slice(-n);
        const bw = W / n;
        g.fillStyle = cor;
        ult.forEach((v, i) => {
          const h = Math.max(4, Math.min(H, Math.sqrt(v) * H * 2.2));
          const x = W - (ult.length - i) * bw;
          g.globalAlpha = 0.35 + (0.65 * i) / n;
          g.beginPath();
          if (g.roundRect) g.roundRect(x + 2, (H - h) / 2, bw - 4, h, 3);
          else g.rect(x + 2, (H - h) / 2, bw - 4, h);
          g.fill();
        });
        g.globalAlpha = 1;
      };
      const limpar = () => {
        cancelAnimationFrame(raf);
        clearInterval(tm);
        if (stream) stream.getTracks().forEach((t) => t.stop());
        stream = null;
        if (ctx) ctx.close().catch(() => {});
        ctx = null;
      };
      // fechar o painel no meio da gravação desliga o microfone
      const aoFechar = () => {
        if (rec && rec.state !== 'inactive') {
          rec.onstop = null;
          rec.stop();
        }
        limpar();
        if (url) URL.revokeObjectURL(url);
        document.removeEventListener('nx:painel-fechado', aoFechar);
      };
      document.addEventListener('nx:painel-fechado', aoFechar);
      const parar = () => rec && rec.state !== 'inactive' && rec.stop();
      const comecar = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
        } catch {
          return toast('Libere o microfone para gravar.', true);
        }
        const tipo = taTipo();
        try {
          rec = new MediaRecorder(stream, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 64000 });
        } catch {
          rec = new MediaRecorder(stream);
        }
        partes = [];
        niveis = [];
        const C = window.AudioContext || window.webkitAudioContext;
        if (C) {
          ctx = new C();
          an = ctx.createAnalyser();
          an.fftSize = 1024;
          ctx.createMediaStreamSource(stream).connect(an);
        }
        const buf = new Float32Array(1024);
        let ultimo = 0;
        const loop = (t) => {
          if (an && t - ultimo > 90) {
            ultimo = t;
            an.getFloatTimeDomainData(buf);
            let s = 0;
            for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
            niveis.push(Math.sqrt(s / buf.length));
            desenhar();
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        rec.ondataavailable = (e) => e.data && e.data.size && partes.push(e.data);
        rec.onstop = () => {
          seg = Math.max(1, Math.round((Date.now() - t0) / 1000));
          limpar();
          mic.classList.remove('gravando');
          mic.innerHTML = TA_IC;
          mic.setAttribute('aria-label', 'Começar a gravar');
          if (seg < 2) {
            dica.textContent = 'Muito curto. Toque e fale um pouco mais.';
            rel.innerHTML = '0:00<small> / 3:00</small>';
            return;
          }
          const mime = ((rec && rec.mimeType) || tipo || 'audio/webm').split(';')[0];
          blob = new Blob(partes, { type: mime });
          ondas = taReduzirOndas(niveis);
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(blob);
          const prev = box.querySelector('#ta-prev');
          prev.innerHTML = taPlayerHTML(
            { id: 'previa', seg, ondas, autor_id: S.user.id, criado_em: new Date().toISOString(), ouvido_em: 1 },
            url,
            [{ user_id: S.user.id, nome: S.me && S.me.nome, foto_url: S.me && S.me.foto_url }],
          )
            .replace('Ainda não ouviu', 'Prévia')
            .replace(`${I.check} Ouvido`, 'Prévia');
          prev.querySelector('.ta-apagar')?.remove();
          taBindPlayer(prev.querySelector('.ta-card'), { id: 'previa', seg, ouvido_em: 1 });
          box.querySelector('#ta-rec').hidden = true;
          box.querySelector('#ta-rev').hidden = false;
        };
        rec.start(1000);
        t0 = Date.now();
        mic.classList.add('gravando');
        mic.innerHTML = TA_STOP;
        mic.setAttribute('aria-label', 'Parar a gravação');
        dica.textContent = 'Gravando. Toque para parar.';
        tm = setInterval(() => {
          const s = (Date.now() - t0) / 1000;
          rel.innerHTML = `${taDur(s)}<small> / 3:00</small>`;
          if (s >= TA_MAX_S) parar();
        }, 250);
      };
      mic.onclick = () => (rec && rec.state === 'recording' ? parar() : comecar());
      box.querySelector('#ta-de-novo').onclick = () => {
        box.querySelector('#ta-prev').querySelector('audio')?.pause();
        blob = null;
        rec = null;
        box.querySelector('#ta-rev').hidden = true;
        box.querySelector('#ta-rec').hidden = false;
        rel.innerHTML = '0:00<small> / 3:00</small>';
        dica.textContent = 'Toque para começar a gravar';
        g.clearRect(0, 0, cv.width, cv.height);
      };
      box.querySelector('#ta-enviar').onclick = async (e) => {
        const bt = e.currentTarget;
        if (!blob) return;
        if (blob.size > 5 * 1024 * 1024) return toast('Áudio grande demais. Grave um mais curto.', true);
        box.querySelector('#ta-prev').querySelector('audio')?.pause();
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
        closeSheet();
        toast('Áudio enviado! O aluno recebe o aviso e ouve no treino.');
        document.querySelectorAll(`[data-ta="${ref}"]`).forEach((b) => b.removeAttribute('data-ta-ok'));
        taCarregar(document);
        if (typeof contarNaoVistos === 'function')
          contarNaoVistos()
            .then(dockStaff)
            .catch(() => {});
      };
    },
  );
}
