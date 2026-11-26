/* Nexos App · Minha voz.
   O treinador grava frases curtas uma vez (tela Mais › Minha voz) e o GPS do aluno toca a voz dele nos momentos do
   treino: começo, aquecimento, tiros, recuperação, fora do ritmo, metade e fim. Números (pace, km, tempo) continuam
   com a voz do celular. Cada aluno ouve o próprio treinador. Os áudios ficam guardados no celular do aluno, para
   tocar sem internet. Gravação convertida para WAV (toca em Android e iPhone), sem silêncio no começo e no fim. */
'use strict';

// [chave, quando toca, frase sugerida]
const VOZ_FRASES = [
  ['inicio', 'Quando o aluno toca em Começar', 'Bora! Começou o treino.'],
  ['aquece', 'No começo do aquecimento', 'Aquece bem leve, sem pressa.'],
  ['principal', 'Quando acaba o aquecimento e começa a corrida', 'Aquecimento feito. Agora é a parte principal.'],
  ['tiro', 'No começo de cada tiro', 'Agora é o tiro. Vai!'],
  ['ultimo', 'No começo do último tiro', 'Último tiro! Dá tudo agora.'],
  ['recupera', 'No começo de cada recuperação', 'Boa! Recupera e solta a respiração.'],
  ['rapido', 'Quando o aluno passa do ritmo (depois o app diz o pace)', 'Tá rápido, segura um pouco.'],
  ['lento', 'Quando o aluno fica abaixo do ritmo (depois o app diz o pace)', 'Tá lento, dá pra acelerar um pouco.'],
  ['ritmo', 'Quando o aluno volta para o ritmo certo', 'Isso, agora no ritmo certo.'],
  ['constancia', 'De vez em quando, enquanto ele está no ritmo', 'Mantém assim. Constância.'],
  ['metade', 'Na metade do treino', 'Metade do treino. Tá indo muito bem.'],
  ['desaquece', 'No começo do desaquecimento', 'Agora desaquece, bem leve.'],
  ['fim', 'Quando o treino termina', 'Treino feito, parabéns! Registra aí que eu vou ver.'],
  ['retomando', 'Quando o aluno volta de uma pausa', 'Bora, voltando.'],
];
const VOZ_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';
const VOZ_CACHE = 'nx-voz-v1';
const VOZ_MAX_S = 8;

/* ---------- áudio: gravação limpa em WAV ---------- */
/** tira o silêncio do começo e do fim, ajusta o volume e converte para WAV mono de 22 kHz */
async function vozParaWav(blob) {
  const C = window.AudioContext || window.webkitAudioContext;
  const ctx = new C();
  let buf;
  try {
    buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    try {
      ctx.close();
    } catch {}
  }
  const ch = buf.getChannelData(0);
  const sr = buf.sampleRate;
  let pico = 0;
  for (let i = 0; i < ch.length; i++) pico = Math.max(pico, Math.abs(ch[i]));
  if (pico < 0.01) throw new Error('Não deu para ouvir nada. Fale mais perto do celular.');
  // começo e fim da fala: primeira e última amostra acima de 6% do pico, com uma folga de 120 ms
  const lim = pico * 0.06,
    folga = Math.round(sr * 0.12);
  let a = 0,
    b = ch.length - 1;
  while (a < ch.length && Math.abs(ch[a]) < lim) a++;
  while (b > a && Math.abs(ch[b]) < lim) b--;
  a = Math.max(0, a - folga);
  b = Math.min(ch.length, b + folga);
  const alvo = 22050;
  const n = Math.max(1, Math.round(((b - a) * alvo) / sr));
  const out = new Int16Array(n);
  const ganho = 0.9 / pico;
  for (let i = 0; i < n; i++) {
    const x = a + (i * sr) / alvo,
      i0 = Math.floor(x),
      f = x - i0;
    const v = ((ch[i0] || 0) * (1 - f) + (ch[i0 + 1] || 0) * f) * ganho;
    out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff;
  }
  // rampa de 15 ms no começo e no fim para não estalar
  const r = Math.round(alvo * 0.015);
  for (let i = 0; i < r && i < n; i++) {
    out[i] = Math.round((out[i] * i) / r);
    out[n - 1 - i] = Math.round((out[n - 1 - i] * i) / r);
  }
  return { blob: vozWav(out, alvo), ms: Math.round((n / alvo) * 1000) };
}
function vozWav(pcm, sr) {
  const dv = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const txt = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  txt(0, 'RIFF');
  dv.setUint32(4, 36 + pcm.length * 2, true);
  txt(8, 'WAVE');
  txt(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  txt(36, 'data');
  dv.setUint32(40, pcm.length * 2, true);
  pcm.forEach((v, i) => dv.setInt16(44 + i * 2, v, true));
  return new Blob([dv.buffer], { type: 'audio/wav' });
}
/** um áudio mudo e curtinho: toca no toque de Começar para o iPhone liberar o som do treino */
const vozMudo = () => vozWav(new Int16Array(1100), 22050);

/* ---------- tela do treinador ---------- */
async function staffMinhaVoz() {
  loading();
  const { data } = await sb
    .from('nx_voz')
    .select('chave,path,dur_ms,atualizado_em')
    .eq('org_id', S.org.id)
    .eq('treinador_id', S.user.id)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  dockStaff();
  const gr = Object.fromEntries((data || []).map((x) => [x.chave, x]));
  const urls = {};
  const caminhos = Object.values(gr).map((x) => x.path);
  if (caminhos.length) {
    const { data: us } = await sb.storage
      .from('nx-audios')
      .createSignedUrls(caminhos, 3600)
      .catch(() => ({ data: [] }));
    (us || []).forEach((u, i) => u.signedUrl && (urls[caminhos[i]] = u.signedUrl));
  }
  const cartao = ([k, quando, frase], i) => {
    const g = gr[k];
    return `<div class="card voz-card ${g ? 'ok' : ''}" data-voz="${k}">
      <div class="voz-top"><span class="voz-n">${i + 1}</span><span class="small muted grow">${esc(quando)}</span>${g ? `<span class="tag ok">${icT(I.check)}${(g.dur_ms / 1000).toFixed(1).replace('.', ',')} s</span>` : '<span class="tag warn">Falta gravar</span>'}</div>
      <p class="voz-frase">“${esc(frase)}”</p>
      <div class="row voz-bts"><button type="button" class="btn sm voz-gravar">${icT(VOZ_IC)}${g ? 'Regravar' : 'Gravar'}</button>${g ? `<button type="button" class="btn ghost sm voz-ouvir">${icT(I.play)}Ouvir</button><button type="button" class="link-btn small voz-apagar" style="margin-left:auto;color:var(--err)">Apagar</button>` : ''}</div>
    </div>`;
  };
  const feitas = VOZ_FRASES.filter(([k]) => gr[k]).length;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Treino pelo celular</p><h1 class="h1">Minha voz</h1>
    <p class="small muted" style="margin-top:6px">Grave cada frase uma vez. Quando seus alunos treinarem pelo GPS do app, eles ouvem a sua voz nesses momentos. Os números (pace, km e tempo) continuam com a voz do celular, logo depois da sua.</p>
    <div class="pe-resumo voz-res"><div class="${feitas === VOZ_FRASES.length ? 'ok' : ''}"><b>${feitas} de ${VOZ_FRASES.length}</b><span>frases gravadas</span></div></div>
    <div class="card voz-dicas"><b class="small">Para ficar bom</b><ul class="small muted">
      <li>Lugar silencioso, sem vento e sem música.</li>
      <li>Celular a um palmo da boca.</li>
      <li>Fale com a energia do treino, do seu jeito. Pode mudar as palavras, desde que a frase sirva para aquele momento.</li>
      <li>Frase curta, de 1 a 4 segundos. A gravação para sozinha em ${VOZ_MAX_S} segundos.</li>
      <li>Frase que você não gravar fica com a voz do celular, como hoje.</li>
    </ul></div>
    <div class="stack" style="margin-top:14px">${VOZ_FRASES.map(cartao).join('')}</div>`;

  let gravando = null;
  const parar = () => gravando && gravando.stop();
  $app.querySelectorAll('.voz-card').forEach((c) => {
    const k = c.dataset.voz,
      g = gr[k];
    const ouvir = c.querySelector('.voz-ouvir');
    if (ouvir)
      ouvir.onclick = () => {
        const u = urls[g.path];
        if (!u) return toast('Não foi possível tocar agora.', true);
        new Audio(u).play().catch(() => toast('Não foi possível tocar agora.', true));
      };
    const ap = c.querySelector('.voz-apagar');
    if (ap)
      ap.onclick = async () => {
        await sb.from('nx_voz').delete().eq('treinador_id', S.user.id).eq('chave', k);
        sb.storage
          .from('nx-audios')
          .remove([g.path])
          .catch(() => {});
        toast('Frase apagada. Nesse momento volta a voz do celular.');
        staffMinhaVoz();
      };
    const bt = c.querySelector('.voz-gravar');
    bt.onclick = async () => {
      if (gravando) {
        if (gravando.k === k) parar();
        return;
      }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Este navegador não grava áudio.', true);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        return toast('Libere o microfone para gravar.', true);
      }
      const tipo =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find((t) =>
          MediaRecorder.isTypeSupported(t),
        ) || '';
      const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const partes = [],
        t0 = Date.now();
      gravando = rec;
      rec.k = k;
      rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
      const tm = setInterval(() => {
        const s = (Date.now() - t0) / 1000;
        bt.innerHTML = `<span class="voz-rec"></span>Parar · ${Math.floor(s)} s`;
        if (s >= VOZ_MAX_S) parar();
      }, 250);
      rec.onstop = async () => {
        clearInterval(tm);
        stream.getTracks().forEach((t) => t.stop());
        gravando = null;
        bt.disabled = true;
        bt.textContent = 'Salvando…';
        try {
          const { blob, ms } = await vozParaWav(
            new Blob(partes, { type: (rec.mimeType || 'audio/webm').split(';')[0] }),
          );
          if (ms < 300) throw new Error('Ficou curto demais. Grave de novo.');
          const path = `${S.org.id}/voz/${S.user.id}/${k}-${Date.now()}.wav`;
          const { error } = await sb.storage.from('nx-audios').upload(path, blob, { contentType: 'audio/wav' });
          if (error) throw new Error('Não foi possível enviar o áudio.');
          const { error: e2 } = await sb.from('nx_voz').upsert(
            {
              org_id: S.org.id,
              treinador_id: S.user.id,
              chave: k,
              path,
              dur_ms: ms,
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: 'treinador_id,chave' },
          );
          if (e2) throw new Error('Não foi possível salvar a frase.');
          if (g)
            sb.storage
              .from('nx-audios')
              .remove([g.path])
              .catch(() => {});
          new Audio(URL.createObjectURL(blob)).play().catch(() => {});
          toast('Frase gravada. Ouça se ficou boa.');
          staffMinhaVoz();
        } catch (e) {
          console.error(e);
          bt.disabled = false;
          bt.innerHTML = `${icT(VOZ_IC)}${g ? 'Regravar' : 'Gravar'}`;
          toast(e.message || 'Não foi possível gravar.', true);
        }
      };
      rec.start();
      bt.classList.add('gravando');
      bt.innerHTML = '<span class="voz-rec"></span>Parar · 0 s';
    };
  });
}

/* ---------- celular do aluno: baixa e guarda a voz do treinador ---------- */
/** endereços locais (blob) das frases do treinador; usa o que já está guardado quando não há internet */
async function vozCarregar(treinadorId) {
  if (!treinadorId || !window.caches) return {};
  const idx = 'nx-voz-idx-' + treinadorId;
  let linhas = null;
  try {
    const { data, error } = await sb.from('nx_voz').select('chave,path').eq('treinador_id', treinadorId);
    if (!error) linhas = data || [];
  } catch {}
  if (linhas) {
    try {
      localStorage.setItem(idx, JSON.stringify(linhas));
    } catch {}
  } else {
    try {
      linhas = JSON.parse(localStorage.getItem(idx) || '[]');
    } catch {
      linhas = [];
    }
  }
  if (!linhas.length) return {};
  let cache;
  try {
    cache = await caches.open(VOZ_CACHE);
  } catch {
    return {};
  }
  const chaveCache = (p) => 'https://voz.nexos.local/' + p;
  const falta = [];
  const out = {};
  for (const l of linhas) {
    const r = await cache.match(chaveCache(l.path)).catch(() => null);
    if (r) out[l.chave] = URL.createObjectURL(await r.blob());
    else falta.push(l);
  }
  if (falta.length) {
    try {
      const { data: us } = await sb.storage.from('nx-audios').createSignedUrls(
        falta.map((l) => l.path),
        600,
      );
      await Promise.all(
        falta.map(async (l, i) => {
          const u = us && us[i] && us[i].signedUrl;
          if (!u) return;
          const resp = await fetch(u);
          if (!resp.ok) return;
          const b = await resp.blob();
          await cache.put(chaveCache(l.path), new Response(b, { headers: { 'Content-Type': 'audio/wav' } }));
          out[l.chave] = URL.createObjectURL(b);
        }),
      );
    } catch {}
  }
  // frases regravadas deixam o áudio antigo no celular: limpa o que não está mais na lista
  try {
    const vivos = new Set(linhas.map((l) => chaveCache(l.path)));
    (await cache.keys()).forEach((rq) => {
      if (rq.url.includes('/voz/' + treinadorId + '/') && !vivos.has(rq.url)) cache.delete(rq);
    });
  } catch {}
  return out;
}
/** de quem é a voz no GPS: o treinador do aluno; o treinador testando ouve a própria */
const vozDeQuem = () => (S.staff ? S.user.id : S.me && S.me.treinador_id) || null;
/** qual frase toca no começo de um passo do treino */
function vozChavePasso(s, anterior) {
  if (!s) return null;
  if (s.k === 'aq') return 'aquece';
  if (s.k === 'dq') return 'desaquece';
  if (s.nrep && (s.k === 'rc' || s.k === 'ca' || s.k === 'dp')) return 'recupera';
  if (s.k === 'co' && s.nrep) return s.rep === s.nrep && s.nrep > 1 ? 'ultimo' : 'tiro';
  if (s.k === 'co' && anterior && anterior.k === 'aq') return 'principal';
  return null;
}
