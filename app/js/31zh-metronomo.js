// Metrônomo da Nexos: toca a cadência-alvo do aluno. Pode ficar ligado nas corridas pelo GPS do app
// (toca no fone durante o treino, inclusive com a tela bloqueada, porque é um áudio em repetição, não um cronômetro).
// Aumentar a cadência de 5 a 10% ouvindo um metrônomo é o método usado nos estudos (Heiderscheit et al. 2011).

/* metronomo:puro:inicio (contas sem tela: testadas em scripts/testes/metronomo.test.js) */
const METRO_MIN = 120,
  METRO_MAX = 220;
const metroLimite = (bpm) => Math.max(METRO_MIN, Math.min(METRO_MAX, Math.round(+bpm || 170)));
// trecho que se repete: um número inteiro de batidas, perto de 30 s, para a emenda cair certinho no tempo
function metroLaco(bpm, alvoSeg = 30) {
  const per = 60 / bpm;
  const n = Math.max(4, Math.round(alvoSeg / per));
  return { n, seg: n * per, per };
}
// posição (em amostras) de cada batida no trecho
function metroBatidas(bpm, taxa, alvoSeg = 30) {
  const { n, per } = metroLaco(bpm, alvoSeg);
  return Array.from({ length: n }, (_, i) => Math.round(i * per * taxa));
}
/* metronomo:puro:fim */

// áudio WAV do trecho (mono, 16 bits): um "tic" curto e limpo em cada batida
function metroWav(bpm) {
  const taxa = 22050;
  const { seg } = metroLaco(bpm);
  const total = Math.round(seg * taxa);
  const dados = new Int16Array(total);
  const durTic = Math.round(0.03 * taxa);
  const tic = new Float32Array(durTic);
  for (let i = 0; i < durTic; i++) {
    const t = i / taxa;
    tic[i] = (Math.sin(2 * Math.PI * 1760 * t) * 0.7 + Math.sin(2 * Math.PI * 3520 * t) * 0.2) * Math.exp(-t * 140);
  }
  for (const ini of metroBatidas(bpm, taxa))
    for (let i = 0; i < durTic && ini + i < total; i++) dados[ini + i] = Math.round(tic[i] * 0.9 * 32767);
  const buf = new ArrayBuffer(44 + dados.length * 2),
    dv = new DataView(buf);
  const txt = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  txt(0, 'RIFF');
  dv.setUint32(4, 36 + dados.length * 2, true);
  txt(8, 'WAVE');
  txt(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, taxa, true);
  dv.setUint32(28, taxa * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  txt(36, 'data');
  dv.setUint32(40, dados.length * 2, true);
  new Int16Array(buf, 44).set(dados);
  return new Blob([buf], { type: 'audio/wav' });
}
const METRO = { el: null, bpm: 0, url: null };
const METRO_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l4 18H5z"/><path d="m12 15 5-9"/><path d="M8 17h8"/></svg>';
const METRO_PAUSA =
  '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
function metroTocar(bpm) {
  bpm = metroLimite(bpm);
  const el = METRO.el || (METRO.el = new Audio());
  if (METRO.bpm !== bpm) {
    if (METRO.url) URL.revokeObjectURL(METRO.url);
    METRO.url = URL.createObjectURL(metroWav(bpm));
    METRO.bpm = bpm;
    el.src = METRO.url;
  }
  el.loop = true;
  try {
    if ('mediaSession' in navigator)
      navigator.mediaSession.metadata = new MediaMetadata({ title: `Metrônomo · ${bpm} passos/min`, artist: 'Nexos' });
  } catch {}
  return el.play();
}
function metroParar() {
  try {
    METRO.el && METRO.el.pause();
  } catch {}
}
const metroTocando = () => !!(METRO.el && !METRO.el.paused);
// configuração do aluno logado: { bpm, ativo }
const metroConfig = () => (S.me && S.me.metronomo) || null;
async function metroSalvar(bpm, ativo) {
  const { error } = await sb.rpc('nx_metronomo', { p_bpm: metroLimite(bpm), p_ativo: !!ativo });
  if (error) throw error;
  if (S.me) S.me.metronomo = { bpm: metroLimite(bpm), ativo: !!ativo };
}

// tela do metrônomo no app (#/metronomo ou #/metronomo/145, vindo do QR code ou do relatório)
async function viewMetronomo(b) {
  const cfg = metroConfig();
  let bpm = metroLimite(b || (cfg && cfg.bpm) || 170);
  const aplicado = () => {
    const c = metroConfig();
    return !!(c && c.ativo && c.bpm === bpm);
  };
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Corrida</p><h1 class="h1">Metrônomo</h1>
    <p class="muted" style="margin-top:6px">Corra pisando no compasso. Cada batida é um pé no chão.</p>
    <div class="card mt-card"><div class="mt-pulso" id="mt-pulso"><button class="mt-play" id="mt-play" aria-label="Tocar">${I.play}</button></div>
      <div class="mt-ctl"><button class="mt-pm" id="mt-menos" aria-label="Menos">−</button><div class="mt-num"><b id="mt-bpm">${bpm}</b><span>passos por minuto</span></div><button class="mt-pm" id="mt-mais" aria-label="Mais">+</button></div></div>
    <div class="card" style="margin-top:12px"><label class="mt-usar"><div class="grow"><b>Usar nas minhas corridas</b><small class="small muted" style="display:block;margin-top:3px">Toda corrida que você abrir pelo GPS do app começa com o metrônomo tocando no fone, inclusive com a tela bloqueada. Dá para pausar na tela da corrida.</small></div><input type="checkbox" class="g2-sw" id="mt-usar" ${aplicado() ? 'checked' : ''}></label>
      <a class="btn ghost block" href="#/gps/livre" style="margin-top:12px">Ir para o GPS</a></div>
    <p class="tiny dim" style="margin-top:12px">Suba a cadência aos poucos, uns 5 a 10% por vez, e mantenha o mesmo ritmo de corrida: o passo fica um pouco mais curto. Quem corre só com relógio pode deixar esta tela aberta no celular.</p>`;
  const $ = (i) => document.getElementById(i);
  const pulso = $('mt-pulso');
  const desenhar = () => {
    $('mt-bpm').textContent = bpm;
    pulso.style.setProperty('--mt-per', 60 / bpm + 's');
    pulso.classList.toggle('on', metroTocando());
    $('mt-play').innerHTML = metroTocando() ? METRO_PAUSA : I.play;
    $('mt-usar').checked = aplicado();
  };
  const mudar = (d) => {
    bpm = metroLimite(bpm + d);
    if (metroTocando()) metroTocar(bpm).catch(() => {});
    desenhar();
  };
  $('mt-menos').onclick = () => mudar(-1);
  $('mt-mais').onclick = () => mudar(1);
  $('mt-play').onclick = async () => {
    if (metroTocando()) metroParar();
    else await metroTocar(bpm).catch(() => toast('Não foi possível tocar o som neste aparelho.', true));
    desenhar();
  };
  $('mt-usar').onchange = async (e) => {
    try {
      await metroSalvar(bpm, e.target.checked);
      toast(e.target.checked ? `Metrônomo de ${bpm} ligado nas suas corridas.` : 'Metrônomo desligado das corridas.');
    } catch {
      e.target.checked = !e.target.checked;
      toast('Não foi possível salvar agora.', true);
    }
    desenhar();
  };
  desenhar();
  // sai da tela: para o som (nas corridas, quem toca é o GPS)
  const saiu = () =>
    setTimeout(() => {
      if (document.getElementById('mt-pulso')) return;
      metroParar();
      window.removeEventListener('hashchange', saiu);
    }, 50);
  window.addEventListener('hashchange', saiu);
}
