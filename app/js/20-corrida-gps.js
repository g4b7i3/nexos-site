/* Nexos App · Treino pelo celular (GPS do aparelho).
   Parte 20 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- treino pelo celular (GPS do aparelho, para quem não tem relógio compatível) ----------
   App web: o GPS só funciona com a tela ligada. Por isso a tela fica acesa durante o treino (Wake Lock),
   o progresso é guardado no aparelho a cada poucos segundos e, se a tela apagar, o treino continua de onde parou. */
const GPS_IC = {
  som: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  mudo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
  esteira:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.6"/><path d="m9.5 13 2-3.5 2.5 1.5 1.5 2.5M11.5 9.5 9 8l-2 2M12 13l-1.5 3"/><path d="M3 18.5h15.5l2.5-5"/><circle cx="5" cy="20.5" r=".6"/><circle cx="16.5" cy="20.5" r=".6"/></svg>',
  trava:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  baixo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  alvo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  expandir:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg>',
  pausa:
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.4"/><rect x="14" y="5" width="4" height="14" rx="1.4"/></svg>',
  parar: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  pular:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 6 7 6-7 6zM13 6l7 6-7 6z"/></svg>',
  volta:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
  autop:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6" stroke-linecap="round"/></svg>',
};
// biblioteca do mapa (MapLibre, código aberto) fica no próprio app; só carrega na tela de treinar pelo celular
let MAPA_LIB = null;
const carregarMapaLib = () =>
  MAPA_LIB ||
  (MAPA_LIB = new Promise((ok, er) => {
    if (window.maplibregl) return ok();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = new URL('vendor/maplibre-gl.css', document.baseURI).href;
    document.head.append(l);
    const sc = document.createElement('script');
    sc.src = new URL('vendor/maplibre-gl.js', document.baseURI).href;
    sc.onload = () => ok();
    sc.onerror = () => {
      MAPA_LIB = null;
      er(new Error('mapa'));
    };
    document.head.append(sc);
  }));
const GPS_KEY = 'nx-gps';
const gpsSalvo = () => {
  const s = store.get(GPS_KEY, null);
  return s && s.inicio && Date.now() - s.salvoEm < 8 * 3600e3 ? s : null;
};
// passos do treino em ordem, com o número da repetição (ex.: Tiro 3 de 6)
function gpsPassos(p, perfil) {
  const out = [];
  const add = (s, rep, nrep) => {
    const alvo = s.med === 'min' ? { t: s.v * 60 } : { d: s.med === 'km' ? s.v * 1000 : s.v };
    const [a, b] = (perfil && perfil.pse) || alvoLivre(s) ? [null, null] : faixaZona(s.z, perfil);
    out.push({ k: s.k, z: s.z, med: s.med, v: s.v, rep, nrep, ...alvo, pa: a, pb: b });
  };
  (estruturaDe(p) || []).forEach((s) => {
    if (s.k === 'rep') {
      for (let i = 0; i < (s.n || 1); i++) (s.passos || []).forEach((x) => add(x, i + 1, s.n || 1));
    } else add(s);
  });
  return out;
}
const gpsNomePasso = (s, curto) => {
  const n = s.k === 'co' ? (s.nrep ? 'Tiro' : 'Corrida') : PASSOS[s.k] || 'Corrida';
  return s.nrep && !curto ? `${n} ${s.rep} de ${s.nrep}` : n;
};
const gpsAlvoTxt = (s) =>
  s.t
    ? `${String(s.v).replace('.', ',')} min`
    : s.d >= 1000
      ? `${String(+(s.d / 1000).toFixed(2)).replace('.', ',')} km`
      : `${Math.round(s.d)} m`;
const kmhDe = (pace) => (pace > 0 ? (3600 / pace).toFixed(1).replace('.', ',') : '–'); // pace (s/km) → velocidade da esteira
const gpsDist = (a, b) => {
  const R = 6371000,
    r = Math.PI / 180,
    dLa = (b[0] - a[0]) * r,
    dLo = (b[1] - a[1]) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// lista: os treinos da semana para escolher e fazer pelo celular
function viewGpsLista() {
  const sv = gpsSalvo();
  trocarRota(location.pathname + location.search + (sv ? `#/gps/${sv.id}${sv.est ? '/esteira' : ''}` : '#/gps/livre'));
}

// tela do treino
async function viewGps(id, modo) {
  loading();
  $dock.hidden = true;
  layout('gps-app');
  const est = modo === 'esteira'; // esteira: sem GPS, conta os passos pelo sensor de movimento do celular
  const rotaTela = '#/gps/' + id + (est ? '/esteira' : '');
  let p = null;
  if (id !== 'livre') {
    const { data } = await sb.from('nx_plano_corrida').select('*').eq('id', id).maybeSingle();
    p = data;
    if (!p) {
      $app.innerHTML =
        '<div class="empty" style="margin-top:40px"><div class="h3">Treino não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
      return;
    }
  }
  const perfil = perfilCorrida(S.me);
  const passos = p ? gpsPassos(p, perfil) : [];
  const titulo = p ? p.titulo || nomeTipo(p.tipo) : est ? 'Esteira livre' : 'Corrida livre';
  // estado (guardado no aparelho)
  const ant = gpsSalvo();
  const st =
    ant && ant.id === id && !!ant.est === est
      ? ant
      : {
          id,
          est,
          titulo,
          inicio: null,
          estado: 'pronto',
          mov: 0,
          dist: 0,
          passo: 0,
          pIni: { t: 0, d: 0 },
          voltas: [],
          parciais: [],
          rota: [],
          serie: { t: [], d: [], vel: [], ...(est ? { cad: [] } : {}) },
          lacunas: 0,
          voz: true,
          passos: 0,
        };
  if (st.estado === 'correndo') st.estado = 'pausado'; // voltou depois de fechar: espera o aluno continuar
  const recuperado = !!(ant && ant.id === id && !!ant.est === est && ant.inicio);
  const pref = { autopausa: false, voltas: false, ...store.get('nx-gps-pref', {}) };
  const outro = ant && ant.inicio && !(ant.id === id && !!ant.est === est) ? ant : null; // outro treino ficou em andamento
  let mapa = null,
    mapaPronto = false,
    seguir = true,
    eu = null,
    euMk = null,
    euNoMapa = false,
    p3d = false,
    ultMov = 0,
    autoBase = null,
    ultPosSalva = 0,
    folhaAberta = false,
    aproxDesde = 0;
  let btsChave = '',
    nTick = 0,
    podeSemSinal = false,
    ultimo = null,
    ultimoT = 0,
    tickRef = 0,
    watch = null,
    lock = null,
    actx = null,
    marcaMov = 0,
    janela = [],
    gpsOk = est;
  // esteira: detector de passos (pico da aceleração) e passada calibrada pelo painel nas corridas anteriores
  // onde está o celular: no corpo (bolso/braçadeira) sente a pisada; na mão sente o balanço do braço. Cada jeito tem a sua passada calibrada.
  if (est && !st.local) st.local = store.get('nx-esteira-local', 'corpo') === 'mao' ? 'mao' : 'corpo';
  const passadaKey = () => 'nx-passada-esteira' + (st.local === 'mao' ? '-mao' : '');
  const passada = () => {
    const v = +store.get(passadaKey(), 0);
    return v >= 0.5 && v <= 2 ? v : 1.0;
  };
  let sensOn = false,
    sensVisto = 0,
    lp = 9.8,
    mMed = 9.8,
    mVar = 1,
    acima = false,
    ultPasso = 0,
    passosJan = [];
  const cadAgora = () => {
    const ag = Date.now(),
      j = passosJan.filter((x) => ag - x < 15000);
    passosJan = j;
    return j.length >= 6 ? Math.round(j.length * 4) : 0;
  };
  const salvar = () => {
    st.salvoEm = Date.now();
    store.set(GPS_KEY, st);
  };
  const movAgora = () => st.mov + (st.estado === 'correndo' && marcaMov ? Date.now() - marcaMov : 0);

  $app.innerHTML = `<div class="g2 ${est ? 'g2-est' : ''}">
    <div class="g2-mapa" id="g-mapa">${est ? `<div class="g2-est-bg">${GPS_IC.esteira}<span>Esteira</span></div>` : '<div class="g2-mapa-msg" id="g-mapa-msg">Carregando o mapa…</div>'}</div>
    <button class="g2-rd g2-sair" id="g-sair" aria-label="Sair">${GPS_IC.baixo}</button>
    <div class="g2-pill"><img src="icons/simbolo.svg" alt=""><div><b class="ellip">${esc(titulo)}</b><span id="g-sinal">${est ? 'Esteira · sensor de movimento' : 'Procurando GPS…'}</span></div></div>
    <div class="g2-cola"></div>
    <div class="g2-meio" id="g-meio">
      ${est ? '' : `<div class="g2-lado"><button class="g2-rd" id="g-3d" aria-label="Mudar a visão do mapa">3D</button><button class="g2-rd" id="g-centro" aria-label="Centralizar em você">${GPS_IC.alvo}</button></div>`}
      <div class="gps-passo" id="g-passo" hidden></div>
      <div class="g2-stats">
        <div class="g2-st-h"><b>${est ? 'Esteira' : 'Corrida'}</b><button class="g2-exp" id="g-exp" aria-label="Mais números">${GPS_IC.expandir}</button></div>
        <div class="g2-tres"><div><b id="g-tempo">0:00</b><span>Tempo</span></div><div><b id="g-pace">–</b><span>Pace agora (/km)</span></div><div><b id="g-dist">0,00</b><span>Distância (km)</span></div></div>
        <div class="g2-extra" id="g-extra" ${est ? '' : 'hidden'}><div><b id="g-pm">–</b><span>Pace médio</span></div>${est ? '<div><b id="g-cad">–</b><span>Cadência</span></div><div><b id="g-np">0</b><span>Passos</span></div>' : '<div><b id="g-volta">1</b><span>Volta</span></div><div><b id="g-vkm">0,00</b><span>Km na volta</span></div>'}</div>
        <div class="gps-prox" id="g-prox"></div>
      </div>
    </div>
    <div class="g2-folha" id="g-folha">
      <button class="g2-grip" id="g-grip" aria-label="Opções do treino"></button>
      <div id="g-rec"></div>
      ${est ? '<div class="est-local" id="g-local"></div>' : ''}
      <div class="g2-bts" id="g-bts"></div>
      <p class="g2-dica" id="g-dica"></p>
      <div class="g2-opc" id="g-opc" hidden></div>
    </div>
    <div class="gps-trava" id="g-trava" hidden><div class="gps-trava-c"><div class="h3">Tela travada</div><p class="small" style="margin:6px 0 18px">Os toques estão desligados para não atrapalhar a corrida.</p><button class="btn ghost" id="g-dest">Segure para destravar</button></div></div>
  </div>`;
  const tela = {};
  $app._gps = tela;
  const minha = () => $app._gps === tela; // outra tela do treino abriu: esta para de mexer na página
  const $ = (s) => document.getElementById(s);

  // som, vibração e voz nas trocas
  // tom no estilo dos relógios: curto e grave na contagem, longo e agudo quando começa a parte nova
  const tom = (freq, dur, vol = 0.45) => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const o = actx.createOscillator(),
        g = actx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(actx.destination);
      const t0 = actx.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + 0.01);
      g.gain.setValueAtTime(vol * 0.35, t0 + dur - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch {}
  };
  const beep = (n = 1) => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < n; i++) {
        const o = actx.createOscillator(),
          g = actx.createGain();
        o.frequency.value = 880;
        o.connect(g);
        g.connect(actx.destination);
        const t0 = actx.currentTime + i * 0.28;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
        o.start(t0);
        o.stop(t0 + 0.22);
      }
    } catch {}
  };
  const falar = (t) => {
    if (!st.voz || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'pt-BR';
      u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch {}
  };
  const paceFala = (s) => {
    const x = Math.round(s);
    return `${Math.floor(x / 60)} e ${String(x % 60).padStart(2, '0')}`;
  };
  const anunciar = (s) => {
    if (!s) return;
    const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
    falar(
      `${gpsNomePasso(s)}. ${gpsAlvoTxt(s).replace(',', ' vírgula ').replace(/ km$/, ' quilômetros').replace(/ m$/, ' metros').replace(/ min$/, ' minutos')}. ${z.d.replace(/\s*\(.*\)/, '')}, ${est ? `velocidade de ${kmhDe(s.pb).replace(',', ' vírgula ')} a ${kmhDe(s.pa).replace(',', ' vírgula ')}` : `pace de ${paceFala(s.pa)} a ${paceFala(s.pb)}`}.`,
    );
  };
  const vibrar = (p2) => {
    try {
      navigator.vibrate && navigator.vibrate(p2);
    } catch {}
  };

  // tela acesa
  const pedirTela = async () => {
    try {
      if ('wakeLock' in navigator && !lock) {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => {
          lock = null;
        });
      }
    } catch {}
  };
  const soltarTela = () => {
    try {
      lock && lock.release();
    } catch {}
    lock = null;
  };

  const passoAtual = () => passos[st.passo] || null;
  const paceAgora = () => {
    let pa = null;
    if (est) {
      const cd = cadAgora();
      if (cd) pa = 1000 / ((cd / 60) * passada());
    } else {
      const j = janela.filter((x) => Date.now() - x.t < 20000);
      if (j.length > 1) pa = (j[j.length - 1].t - j[0].t) / 1000 / ((j[j.length - 1].d - j[0].d) / 1000);
    }
    return pa && isFinite(pa) && pa > 120 && pa < 1200 ? pa : null;
  };
  // a voz diz o pace a cada 2 min; fora do ritmo do treino ela avisa logo (depois de 8 s fora, para não reagir a oscilação do GPS)
  // e repete uma vez 30 s depois se continuar fora: no máximo 2 avisos por vez que sai do ritmo
  let ultFalaPace = Date.now(),
    ultTroca = 0,
    foraDir = 0,
    foraDesde = 0,
    foraFalas = 0,
    ultFora = 0;
  const falarPace = () => {
    if (st.estado !== 'correndo' || !st.voz) return;
    const ag = Date.now();
    if (ag - ultTroca < 20000) return;
    const pa = paceAgora();
    if (!pa) return;
    const s = passoAtual(),
      alvo = s && s.pa && s.pb;
    const dir = !alvo ? 0 : pa < s.pa * 0.97 ? 1 : pa > s.pb * 1.03 ? -1 : 0;
    const txtFora = (d) =>
      d > 0
        ? est
          ? 'Acima do alvo, confira a velocidade da esteira.'
          : 'Rápido demais, segure um pouco.'
        : est
          ? 'Abaixo do alvo, confira a velocidade da esteira.'
          : 'Abaixo do alvo, acelere um pouco.';
    if (dir !== foraDir) {
      // mudou de situação: começa a contar de novo
      if (foraDir && !dir && foraFalas) {
        falar('Agora sim, no ritmo.');
        ultFalaPace = ag;
      }
      foraDir = dir;
      foraDesde = ag;
      foraFalas = 0;
      return;
    }
    if (dir) {
      if (foraFalas < 2 && ag - foraDesde >= 8000 && ag - ultFora >= 30000) {
        foraFalas++;
        ultFora = ag;
        ultFalaPace = ag;
        falar(`Pace ${est ? 'aproximado ' : ''}${paceFala(pa)}. ${txtFora(dir)}`);
      }
      return;
    }
    if (ag - ultFalaPace < 120000) return;
    ultFalaPace = ag;
    falar(`Pace ${est ? 'aproximado ' : ''}${paceFala(pa)}.${alvo ? ' No ritmo.' : ''}`);
  };
  const desenha = () => {
    if (!minha()) return;
    const mov = movAgora() / 1000,
      s = passoAtual();
    $('g-tempo').textContent = fmtDurLongo(mov);
    $('g-dist').textContent = `${est ? '~' : ''}${(st.dist / 1000).toFixed(2).replace('.', ',')}`;
    const pa = paceAgora();
    $('g-pm').textContent = st.dist > 50 ? (est ? '~' : '') + fmtPace(mov / (st.dist / 1000)).replace('/km', '') : '–';
    $('g-pace').textContent = pa ? (est ? '~' : '') + fmtPace(pa).replace('/km', '') : '–';
    if (est) {
      const cd = cadAgora();
      $('g-cad').textContent = cd ? `${cd} ppm` : '–';
      $('g-np').textContent = String(st.passos || 0);
    } else {
      $('g-volta').textContent = String(st.voltas.length + 1);
      $('g-vkm').textContent = ((st.dist - st.pIni.d) / 1000).toFixed(2).replace('.', ',');
    }
    $('g-passo').hidden = !passos.length;
    if (s) {
      const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve,
        fT = mov - st.pIni.t,
        fD = st.dist - st.pIni.d;
      const falta = s.t ? Math.max(0, s.t - fT) : Math.max(0, s.d - fD),
        pr = s.t ? fT / s.t : fD / s.d;
      const noRitmo =
        pa && isFinite(pa) && s.pa ? (pa < s.pa * 0.97 ? 'rapido' : pa > s.pb * 1.03 ? 'lento' : 'ok') : '';
      $('g-passo').style.setProperty('--zc', z.c);
      $('g-passo').innerHTML =
        `<div class="gps-p-h"><span class="gps-z">${z.z} · ${z.d}</span><span class="tiny">Parte ${st.passo + 1} de ${passos.length}</span></div>
        <div class="gps-p-n">${gpsNomePasso(s)}</div>
        <div class="gps-p-f">${s.t ? fmtDurLongo(falta) : falta >= 1000 ? (falta / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(falta) + ' m'}<small>${s.t ? ' faltando' : ' faltando'}</small></div>
        <div class="gps-bar"><i style="width:${Math.min(100, pr * 100).toFixed(1)}%"></i></div>
        <div class="gps-p-alvo">${alvoLivre(s) ? `<b>${alvoLivre(s)}</b>` : !s.pa ? `Esforço <b>${pseTxt(s.z, true)}</b> · ${(PSE_Z[s.z] || PSE_Z.leve)[2]}` : est ? `Velocidade na esteira <b>${kmhDe(s.pb)} a ${kmhDe(s.pa)} km/h</b>` : `Pace alvo <b>${fmtPace(s.pa).replace('/km', '')} a ${fmtPace(s.pb)}</b>`}${noRitmo === 'rapido' ? '<span class="gps-r r">Rápido demais</span>' : noRitmo === 'lento' ? '<span class="gps-r l">Acelere</span>' : noRitmo === 'ok' ? '<span class="gps-r ok">No ritmo</span>' : ''}</div>`;
      const nx = passos[st.passo + 1];
      $('g-prox').innerHTML = nx
        ? `Depois: <b>${gpsNomePasso(nx)}</b> · ${gpsAlvoTxt(nx)} · ${alvoLivre(nx) ? PASSOS[nx.k] : !nx.pa ? pseTxt(nx.z, true) : est ? `${kmhDe(nx.pb)} a ${kmhDe(nx.pa)} km/h` : (ZONAS_INFO[nx.z] || ZONAS_INFO.leve).z}`
        : 'Última parte do treino';
    } else if (passos.length) {
      $('g-passo').style.setProperty('--zc', 'var(--ok)');
      $('g-passo').innerHTML =
        '<div class="gps-p-n">Treino completo</div><p class="small" style="margin-top:6px">Pode desacelerar e tocar em Terminar para salvar.</p>';
      $('g-prox').innerHTML = '';
    } else $('g-prox').innerHTML = '';
    const E = st.estado,
      chave = E + gpsOk + podeSemSinal + !!passoAtual() + (st.local || '') + st.voz + pref.voltas + !!st.auto + !!outro;
    if (chave === btsChave) return;
    if (est) {
      const gl = $('g-local');
      gl.hidden = E !== 'pronto';
      gl.innerHTML = `<span>Onde está o celular?</span><div class="est-seg"><button type="button" data-loc="corpo" class="${st.local === 'corpo' ? 'on' : ''}">Bolso ou braçadeira</button><button type="button" data-loc="mao" class="${st.local === 'mao' ? 'on' : ''}">Na mão</button></div>${st.local === 'mao' ? '<p class="tiny">Na mão a contagem é um pouco menos precisa. Evite segurar no corrimão.</p>' : '<p class="tiny">Mais preciso: o celular sente cada pisada.</p>'}`;
      gl.querySelectorAll('[data-loc]').forEach(
        (b) =>
          (b.onclick = () => {
            st.local = b.dataset.loc;
            store.set('nx-esteira-local', st.local);
            salvar();
            desenha();
          }),
      );
    }
    btsChave = chave; // botões só mudam quando o estado muda (não some no meio do toque)
    const circ = (i, ic, rot, cls = '') =>
      `<button type="button" class="g2-c ${cls}" id="${i}"><span class="g2-c-ic">${ic}</span><span>${rot}</span></button>`;
    const grande = (i, ic, rot, cls = '', dis = false) =>
      `<button type="button" class="g2-play ${cls}" id="${i}" aria-label="${rot}" ${dis ? 'disabled' : ''}>${ic}</button>`;
    const vozB = circ(
      'g-vozb',
      st.voz ? GPS_IC.som : GPS_IC.mudo,
      st.voz ? 'Voz ligada' : 'Voz desligada',
      st.voz ? '' : 'off',
    );
    $('g-rec').innerHTML =
      E === 'pronto' && outro
        ? `<div class="g2-rec"><b>Você tem um treino em andamento</b><p class="small muted">${esc(outro.titulo)} · ${fmtKm(outro.dist, 2)} · ${fmtDurLongo(outro.mov / 1000)}</p><div class="row" style="gap:8px;margin-top:8px"><a class="btn sm" href="#/gps/${outro.id}${outro.est ? '/esteira' : ''}">Continuar</a><button class="btn ghost sm" id="g-desc">Descartar</button></div></div>`
        : '';
    $('g-bts').innerHTML =
      E === 'pronto'
        ? circ('g-tipo', est ? GPS_IC.esteira : I.run, est ? 'Esteira' : 'Na rua', 'on') +
          grande(
            'g-ini',
            I.play,
            'Começar',
            gpsOk ? '' : podeSemSinal ? 'fraco' : 'esperando',
            !gpsOk && !podeSemSinal,
          ) +
          circ('g-treino', I.cal, p ? 'Treino' : 'Livre', p ? 'on' : '')
        : E === 'correndo'
          ? circ('g-trv', GPS_IC.trava, 'Travar') +
            grande('g-pau', GPS_IC.pausa, 'Pausar', 'pausa') +
            (passos.length && passoAtual()
              ? circ('g-pul', GPS_IC.pular, 'Pular parte')
              : !passos.length && pref.voltas
                ? circ('g-vlt', GPS_IC.volta, 'Volta')
                : vozB)
          : circ('g-fim', GPS_IC.parar, 'Terminar', 'fim') + grande('g-con', I.play, 'Continuar') + vozB;
    $('g-dica').textContent =
      E === 'pronto'
        ? est
          ? st.local === 'mao'
            ? 'Corra com o celular na mão, balançando o braço normalmente (não no suporte da esteira), e toque em começar.'
            : 'Coloque o celular no bolso ou na braçadeira (preso ao corpo, não no suporte da esteira) e toque em começar.'
          : gpsOk
            ? 'GPS pronto. Toque no botão quando for sair.'
            : aproxDesde && Date.now() - aproxDesde > 8000
              ? 'O celular está dando só a localização aproximada para a Nexos. Ative a localização precisa: toque e segure o ícone da Nexos, Informações do app, Permissões, Localização e ligue "Usar localização precisa". Se abrir pelo Chrome, faça o mesmo no app Chrome.'
              : podeSemSinal
                ? 'Sinal fraco (dentro de casa ou entre prédios). Dá para começar: a distância passa a contar quando o sinal melhorar.'
                : 'Procurando o GPS. Ao ar livre ele acha o sinal mais rápido.'
        : E === 'pausado'
          ? st.auto
            ? 'Pausa automática. O treino volta sozinho quando você voltar a correr.'
            : recuperado && !marcaMov
              ? 'Treino recuperado. Toque em continuar para seguir.'
              : 'Treino pausado.'
          : est
            ? 'Distância estimada pelos passos. No fim, confirme com o painel da esteira.'
            : 'A tela fica acesa durante o treino.';
    if (folhaAberta) $('g-opc').innerHTML = opcHTML();
    liga();
  };
  // opções (puxar a alça da folha): voz, pausa automática, contar voltas
  const linhaOpc = (i, ic, t, d, on) =>
    `<label class="g2-li"><span class="g2-li-ic">${ic}</span><div class="grow"><b>${t}</b><small>${d}</small></div><input type="checkbox" class="g2-sw" id="${i}" ${on ? 'checked' : ''}></label>`;
  const opcHTML = () => `<div class="g2-lista">
      ${linhaOpc('o-voz', GPS_IC.som, 'Avisos de voz', passos.length ? 'Cada parte do treino e o seu pace' : 'Cada quilômetro e o seu pace', st.voz)}
      ${est ? '' : linhaOpc('o-auto', GPS_IC.autop, 'Pausa automática', 'Pausa quando você para e volta sozinho', pref.autopausa)}
      ${passos.length ? '' : linhaOpc('o-vlt', GPS_IC.volta, 'Contar voltas', 'Botão para marcar as voltas (pista, quarteirão)', pref.voltas)}
      <div class="g2-li"><span class="g2-li-ic">${I.raio}</span><div class="grow"><b>Tela acesa</b><small>Fica ligada sozinha durante o treino</small></div></div>
    </div>`;
  const ligaOpc = () => {
    const o = $('g-opc');
    if (!o) return;
    o.onchange = (e) => {
      const c = e.target;
      if (!c.classList.contains('g2-sw')) return;
      if (c.id === 'o-voz') {
        st.voz = c.checked;
        salvar();
      }
      if (c.id === 'o-auto') {
        pref.autopausa = c.checked;
        store.set('nx-gps-pref', pref);
      }
      if (c.id === 'o-vlt') {
        pref.voltas = c.checked;
        store.set('nx-gps-pref', pref);
      }
      btsChave = '';
      desenha();
    };
  };
  const liga = () => {
    const b = (i, f) => {
      const el = $(i);
      if (el) el.onclick = f;
    };
    b('g-ini', comecar);
    b('g-pau', pausar);
    b('g-con', continuar);
    b('g-fim', terminar);
    b('g-pul', () => fecharPasso());
    b('g-trv', () => {
      $('g-trava').hidden = false;
    });
    b('g-vlt', () => marcarVolta());
    b('g-treino', abrirTreinos);
    b('g-tipo', abrirTipo);
    b('g-vozb', () => {
      st.voz = !st.voz;
      salvar();
      btsChave = '';
      desenha();
      if (st.voz) falar('Voz ligada.');
      else
        try {
          speechSynthesis.cancel();
        } catch {}
    });
    b('g-desc', () => {
      if (!confirm('Descartar o treino em andamento?')) return;
      store.del(GPS_KEY);
      location.reload();
    });
  };

  // fecha a parte atual (volta) e passa para a próxima
  // contagem regressiva: bipe curto a cada segundo nos 5 últimos segundos de cada parte (aquecimento, tiro, recuperação...)
  // em parte por distância, os segundos que faltam vêm do pace atual
  let contou = 9;
  const contagem = () => {
    if (st.estado !== 'correndo' || !passos.length) return;
    const s = passoAtual();
    if (!s) return;
    const mov = movAgora() / 1000;
    let rest = null;
    if (s.t) rest = s.t - (mov - st.pIni.t);
    else if (s.d) {
      const pa = paceAgora();
      if (pa) rest = ((s.d - (st.dist - st.pIni.d)) / 1000) * pa;
    }
    if (rest == null || rest <= 0 || rest > 5.2) return;
    const n = Math.ceil(rest - 0.05);
    if (n >= 1 && n < contou) {
      contou = n;
      tom(880, 0.14);
      vibrar(70);
    }
  };
  const fecharPasso = () => {
    ultTroca = Date.now();
    foraDir = 0;
    foraFalas = 0;
    contou = 9;
    const mov = movAgora() / 1000;
    const v = { d: Math.round(st.dist - st.pIni.d), seg: Math.round(mov - st.pIni.t) };
    if (v.seg > 0) st.voltas.push(v);
    st.pIni = { t: mov, d: st.dist };
    if (passos.length) {
      st.passo++;
      const nx = passoAtual();
      vibrar([500]);
      tom(1320, 0.7);
      contou = 9;
      if (nx) anunciar(nx);
      else falar('Treino completo. Muito bem! Toque em terminar para salvar.');
    } else {
      vibrar(200);
      beep(1);
      falar(
        `${st.voltas.length} quilômetro${st.voltas.length > 1 ? 's' : ''}. Pace ${paceFala(v.seg / (v.d / 1000))}.`,
      );
    }
    salvar();
    desenha();
  };
  const durFala = (x) => {
    x = Math.round(x);
    const m = Math.floor(x / 60),
      sg = x % 60;
    return `${m ? `${m} minuto${m > 1 ? 's' : ''}` : ''}${m && sg ? ' e ' : ''}${sg || !m ? `${sg} segundos` : ''}`;
  };
  const marcarVolta = () => {
    const mov = movAgora() / 1000,
      v = { d: Math.round(st.dist - st.pIni.d), seg: Math.round(mov - st.pIni.t) };
    if (v.seg < 3) return;
    st.voltas.push(v);
    st.pIni = { t: mov, d: st.dist };
    ultTroca = Date.now();
    foraDir = 0;
    foraFalas = 0;
    vibrar(200);
    beep(1);
    falar(`Volta ${st.voltas.length}. ${durFala(v.seg)}${v.d > 50 ? `. Pace ${paceFala(v.seg / (v.d / 1000))}` : ''}.`);
    salvar();
    desenha();
  };
  const verificaPasso = () => {
    if (st.estado !== 'correndo') return;
    const s = passoAtual(),
      mov = movAgora() / 1000;
    if (s) {
      if ((s.t && mov - st.pIni.t >= s.t) || (s.d && st.dist - st.pIni.d >= s.d)) fecharPasso();
    } else if (!passos.length && !pref.voltas && st.dist - st.pIni.d >= 1000) fecharPasso();
  };

  // GPS: filtro de Kalman simples (cada ponto pesa conforme a precisão) e passo mínimo, para o tremor do sinal não virar distância
  let kf = null;
  const filtrar = (pt, acc, t) => {
    const a = Math.max(acc, 3);
    if (!kf || t - kf.t > 30000) {
      kf = { la: pt[0], lo: pt[1], v: a * a, t };
      return [pt[0], pt[1]];
    }
    const dt = Math.max(0, (t - kf.t) / 1000);
    kf.v += dt * 9; // até ~3 m/s de mudança esperada por segundo
    const k = kf.v / (kf.v + a * a);
    kf.la += k * (pt[0] - kf.la);
    kf.lo += k * (pt[1] - kf.lo);
    kf.v *= 1 - k;
    kf.t = t;
    return [+kf.la.toFixed(6), +kf.lo.toFixed(6)];
  };
  const onPos = (pos) => {
    if (!document.getElementById('g-sinal') || !minha()) return; // já saiu da tela do treino
    const c = pos.coords,
      pt = [+c.latitude.toFixed(6), +c.longitude.toFixed(6)],
      t = pos.timestamp || Date.now();
    gpsOk = c.accuracy <= 25;
    if (c.accuracy >= 1000) aproxDesde = aproxDesde || Date.now();
    else if (c.accuracy <= 100) aproxDesde = 0; // ±2 km fixo = permissão de localização aproximada
    // posição da rede (±centenas de metros, comum logo que a tela volta) não move o seu ponto no mapa:
    // fica no último ponto bom (da rota, do último treino) até o GPS de verdade responder
    if (c.accuracy <= 100) {
      eu = pt;
      if (Date.now() - ultPosSalva > 60000) {
        store.set('nx-gps-ult', pt);
        ultPosSalva = Date.now();
      }
    } else if (!eu) eu = st.rota.length ? st.rota[st.rota.length - 1] : store.get('nx-gps-ult', null) || pt;
    $('g-sinal').textContent =
      c.accuracy <= 12 ? 'GPS ótimo' : c.accuracy <= 25 ? 'GPS bom' : `GPS fraco (±${Math.round(c.accuracy)} m)`;
    $('g-sinal').className = 'tiny ' + (c.accuracy <= 25 ? 'gps-ok' : 'gps-fraco');
    if (st.estado === 'pronto') desenha();
    const fp = c.accuracy <= 35 ? filtrar(pt, c.accuracy, t) : null;
    if (st.estado === 'pausado' && st.auto && fp && c.accuracy <= 25) {
      // pausa automática: voltou a se mover, retoma
      if (!autoBase) autoBase = fp;
      else if (gpsDist(autoBase, fp) > Math.max(15, c.accuracy)) {
        continuar();
        falar('Retomando.');
      }
    }
    if (st.estado !== 'correndo') {
      ultimo = null;
      atualizaMapa();
      return;
    }
    if (!fp) return;
    if (ultimo) {
      const inc = gpsDist(ultimo, fp),
        dt = (t - ultimoT) / 1000;
      if (dt <= 0) return;
      if (inc / dt > 9) return; // salto do GPS (mais rápido que 9 m/s): ignora
      if (inc < Math.max(4, c.accuracy * 0.5)) return; // passo menor que a incerteza do sinal: espera juntar mais (não perde distância, só soma depois)
      if (c.speed != null && c.speed < 0.5 && inc < c.accuracy) return; // o próprio GPS diz que está parado
      if (dt > 30) st.lacunas++; // ficou um tempo sem sinal (tela apagada): liga em linha reta
      st.dist += inc;
      ultMov = Date.now();
    }
    ultimo = fp;
    ultimoT = t;
    st.rota.push(fp);
    const mov = movAgora() / 1000;
    janela.push({ t: Date.now(), d: st.dist });
    if (janela.length > 40) janela.shift();
    const sr = st.serie,
      ul = sr.t[sr.t.length - 1];
    if (ul == null || mov - ul >= 5) {
      const j = janela.filter((x) => Date.now() - x.t < 15000);
      const vel = j.length > 1 ? (j[j.length - 1].d - j[0].d) / ((j[j.length - 1].t - j[0].t) / 1000) : 0;
      sr.t.push(Math.round(mov));
      sr.d.push(Math.round(st.dist));
      sr.vel.push(+(isFinite(vel) ? vel : 0).toFixed(2));
    }
    const km = Math.floor(st.dist / 1000);
    if (km > st.parciais.length) {
      const antT = st.parciais.reduce((a, x) => a + x.seg, 0);
      st.parciais.push({ km: st.parciais.length + 1, seg: Math.round(mov - antT) });
      if (pref.voltas && !passos.length) falar(`${km} quilômetro${km > 1 ? 's' : ''}.`);
    }
    verificaPasso();
    desenha();
    atualizaMapa();
  };
  const onErro = (e) => {
    $('g-sinal').textContent = e.code === 1 ? 'Sem permissão de localização' : 'GPS sem sinal';
    $('g-sinal').className = 'tiny gps-fraco';
    if (e.code === 1)
      toast('Permita o acesso à localização para treinar pelo celular (configurações do navegador).', true);
  };
  const onMov = (ev) => {
    const a = ev.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    sensVisto = Date.now();
    const m = Math.hypot(a.x, a.y, a.z);
    const mao = st.local === 'mao';
    lp = mao ? lp * 0.75 + m * 0.25 : lp * 0.7 + m * 0.3;
    mMed = mMed * 0.98 + lp * 0.02;
    const dv = lp - mMed;
    mVar = mVar * 0.98 + dv * dv * 0.02;
    const lim = mao ? Math.max(1.0, Math.sqrt(mVar) * 0.65) : Math.max(1.1, Math.sqrt(mVar) * 0.6),
      ag = performance.now();
    if (!acima && dv > lim && ag - ultPasso > (mao ? 270 : 250)) {
      // um pico = um passo (no máximo 240 por minuto)
      acima = true;
      ultPasso = ag;
      if (st.estado === 'correndo') {
        st.passos = (st.passos || 0) + 1;
        passosJan.push(Date.now());
        st.dist = st.passos * passada();
      }
    } else if (acima && dv < 0) acima = false;
  };
  const ligarSensor = async () => {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const r = await DeviceMotionEvent.requestPermission();
        if (r !== 'granted') {
          toast(
            'Sem acesso ao sensor de movimento: o app conta só o tempo. No fim, digite a distância do painel.',
            true,
          );
          return;
        }
      }
    } catch {}
    if (!sensOn && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', onMov);
      sensOn = true;
    }
  };
  const desligarSensor = () => {
    if (sensOn) window.removeEventListener('devicemotion', onMov);
    sensOn = false;
  };
  const sinalEsteira = () => {
    const el = $('g-sinal');
    if (!el) return;
    const ok = sensVisto && Date.now() - sensVisto < 3000;
    el.textContent =
      st.estado !== 'correndo'
        ? 'Esteira · sensor de movimento'
        : ok
          ? cadAgora()
            ? 'Contando os passos'
            : 'Sensor ligado · comece a correr'
          : 'Sensor sem sinal: contando só o tempo';
    el.className = 'tiny ' + (st.estado !== 'correndo' || ok ? 'gps-ok' : 'gps-fraco');
  };
  // série da esteira (a cada 5 s): distância estimada, velocidade e cadência
  const serieEsteira = () => {
    const mov = movAgora() / 1000,
      sr = st.serie,
      ul = sr.t[sr.t.length - 1];
    if (ul != null && mov - ul < 5) return;
    janela.push({ t: Date.now(), d: st.dist });
    if (janela.length > 40) janela.shift();
    const jj = janela.filter((x) => Date.now() - x.t < 15000);
    const vel = jj.length > 1 ? (jj[jj.length - 1].d - jj[0].d) / ((jj[jj.length - 1].t - jj[0].t) / 1000) : 0;
    sr.t.push(Math.round(mov));
    sr.d.push(Math.round(st.dist));
    sr.vel.push(+(isFinite(vel) ? vel : 0).toFixed(2));
    (sr.cad = sr.cad || []).push(cadAgora());
  };
  const ligarGPS = () => {
    if (est) return;
    if (!navigator.geolocation) {
      toast('Este celular não tem GPS disponível no navegador.', true);
      return;
    }
    if (watch == null)
      watch = navigator.geolocation.watchPosition(onPos, onErro, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      });
  };
  const desligarGPS = () => {
    if (watch != null) navigator.geolocation.clearWatch(watch);
    watch = null;
  };

  const comecar = () => {
    if (est) ligarSensor(); // o iPhone só libera o sensor a partir de um toque
    actx =
      actx ||
      (() => {
        try {
          return new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          return null;
        }
      })();
    st.inicio = new Date().toISOString();
    st.estado = 'correndo';
    marcaMov = Date.now();
    ultimo = null;
    ultMov = Date.now();
    st.auto = false;
    pedirTela();
    beep(1);
    vibrar(200);
    const s = passoAtual();
    if (s) anunciar(s);
    else falar('Corrida iniciada.');
    salvar();
    desenha();
  };
  const pausar = () => {
    st.mov = movAgora();
    marcaMov = 0;
    st.estado = 'pausado';
    st.auto = false;
    ultimo = null;
    salvar();
    falar('Pausado.');
    desenha();
  };
  const continuar = () => {
    if (est) ligarSensor();
    ligarGPS();
    st.estado = 'correndo';
    st.auto = false;
    autoBase = null;
    ultMov = Date.now();
    marcaMov = Date.now();
    ultimo = null;
    pedirTela();
    recuperado && falar('Continuando.');
    salvar();
    desenha();
  };
  // parado por 10 s (semáforo, água): pausa sozinho e tira esse tempo parado do treino
  const autoPausar = () => {
    const parado = Date.now() - ultMov;
    st.mov = Math.max(0, movAgora() - parado);
    marcaMov = 0;
    st.estado = 'pausado';
    st.auto = true;
    autoBase = eu;
    ultimo = null;
    vibrar(150);
    falar('Pausa automática.');
    salvar();
    desenha();
  };
  const terminar = () => {
    openSheet(
      `<div class="h2">Terminar o treino?</div><p class="small muted" style="margin-top:6px">${fmtKm(st.dist, 2)} em ${fmtDurLongo(movAgora() / 1000)}.</p>
      <div class="stack" style="margin-top:16px"><button class="btn block" id="t-sal">${I.check} Terminar e salvar</button><button class="btn ghost block" id="t-vol">Voltar ao treino</button><button class="link-btn small" id="t-desc" style="margin-top:6px;color:var(--err)">Descartar este treino</button></div>`,
      (r) => {
        r.querySelector('#t-vol').onclick = () => closeSheet();
        r.querySelector('#t-desc').onclick = () => {
          if (!confirm('Descartar? A corrida não será salva.')) return;
          closeSheet(true);
          encerrar();
          store.del(GPS_KEY);
          location.hash = '#/';
        };
        r.querySelector('#t-sal').onclick = () => finalizar(); // abre a ficha de salvar no mesmo painel
      },
    );
  };
  const encerrar = () => {
    try {
      mapa && mapa.remove();
    } catch {}
    mapa = null;
    clearInterval(tickRef);
    desligarGPS();
    desligarSensor();
    soltarTela();
    document.removeEventListener('visibilitychange', onVis);
    try {
      speechSynthesis.cancel();
    } catch {}
  };
  const finalizar = () => {
    if (!est) return salvarTreino();
    const mov = Math.round(movAgora() / 1000);
    if (mov < 30) return toast('O treino ficou curto demais para salvar.', true);
    const estim = st.dist > 0 ? String(+(st.dist / 1000).toFixed(2)).replace('.', ',') : '';
    openSheet(
      `<p class="eyebrow">Esteira</p><div class="h2" style="margin-top:4px">Distância no painel</div>
      <p class="small muted" style="margin-top:6px">${st.dist > 0 ? `Pelos seus ${st.passos} passos, o app estimou <b>${estim} km</b>. ` : ''}Digite a distância que aparece no painel da esteira. Assim o pace fica certo e o app aprende a sua passada para as próximas vezes.</p>
      <form id="f-painel" style="margin-top:14px"><label class="field"><span>Distância do painel (km)</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" value="${estim}" placeholder="Ex.: 5,2" required></label>
      <button class="btn block" type="submit">${I.check} Continuar</button></form>`,
      (r) => {
        const f = r.querySelector('#f-painel');
        aplicarMascaras(f);
        f.onsubmit = (e) => {
          e.preventDefault();
          const km = parseFloat(String(f.km.value).replace(/\./g, '').replace(',', '.'));
          if (!(km > 0.05 && km < 100)) return toast('Digite a distância do painel, por exemplo 5,2.', true);
          const novo = km * 1000,
            fator = st.dist > 0 ? novo / st.dist : 0;
          if (st.passos > 200) {
            const pd = novo / st.passos;
            if (pd >= 0.5 && pd <= 2) store.set(passadaKey(), +pd.toFixed(3));
          } // calibra a passada
          if (fator) {
            st.serie.d = st.serie.d.map((x) => Math.round(x * fator));
            st.serie.vel = st.serie.vel.map((x) => +(x * fator).toFixed(2));
            st.voltas = st.voltas.map((v) => ({ ...v, d: Math.round(v.d * fator) }));
            st.pIni = { ...st.pIni, d: st.pIni.d * fator };
          } else {
            st.serie = {
              t: [0, mov],
              d: [0, Math.round(novo)],
              vel: [+(novo / mov).toFixed(2), +(novo / mov).toFixed(2)],
            };
            st.voltas = [];
            st.pIni = { t: 0, d: 0 };
          }
          st.dist = novo;
          salvarTreino();
        };
      },
    );
  };
  const salvarTreino = () => {
    const mov = Math.round(movAgora() / 1000);
    if (st.dist < 100 || mov < 30) return toast('O treino ficou curto demais para salvar (menos de 100 m).', true);
    // última parte em andamento entra como volta
    const resto = { d: Math.round(st.dist - st.pIni.d), seg: Math.round(mov - st.pIni.t) },
      voltas = resto.seg > 5 && resto.d > 0 ? [...st.voltas, resto] : st.voltas;
    const passo = Math.max(1, Math.ceil(st.rota.length / 400)),
      rota = st.rota.filter((_, i) => i % passo === 0 || i === st.rota.length - 1);
    const d = {
      data: st.inicio,
      tipo: est ? 'esteira' : 'corrida',
      distancia_m: Math.round(st.dist),
      duracao_s: mov,
      rota: rota.length > 1 ? rota : null,
      parciais: !est && st.parciais.length ? st.parciais : null,
      plano_id: p ? p.id : null,
      livre: !p,
      titulo: titulo,
      fonte: 'celular',
      ext_id: 'cel-' + new Date(st.inicio).getTime(),
      cadencia: est && st.passos > 100 ? Math.round(st.passos / (mov / 60)) : null,
      analise: {
        v: 1,
        serie: st.serie,
        voltas,
        extras: {
          dispositivo: est ? `Celular (esteira, ${st.local === 'mao' ? 'na mão' : 'no corpo'})` : 'Celular (GPS)',
          total_s: Math.round((Date.now() - new Date(st.inicio)) / 1000),
          lacunas: st.lacunas,
          ...(est ? { passos: st.passos } : {}),
        },
      },
    };
    st.estado = 'pausado';
    salvar();
    const plano = p ? [p] : [];
    formCorrida(S.user.id, d, plano, (novo) => {
      encerrar();
      store.del(GPS_KEY);
      setTimeout(() => {
        location.hash = '#/corrida/' + novo;
      }, 150);
    });
  };
  // tela apagou e voltou: GPS e tela acesa de novo; o tempo corre certo porque é pelo relógio do aparelho
  const onVis = () => {
    if (document.visibilityState === 'visible') {
      ultimo = null;
      if (st.estado === 'correndo') pedirTela();
      desenha();
    } else salvar();
  };
  document.addEventListener('visibilitychange', onVis);
  // mapa: ruas de verdade (OpenFreeMap, dados do OpenStreetMap), o seu ponto e o percurso na cor da Nexos
  const linhaRota = () =>
    st.rota.length > 1
      ? {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: st.rota.map(([la, lo]) => [lo, la]) },
        }
      : { type: 'FeatureCollection', features: [] };
  const atualizaMapa = () => {
    if (!mapa || !mapaPronto) return;
    if (eu && euMk) {
      euMk.setLngLat([eu[1], eu[0]]);
      if (!euNoMapa) {
        euMk.addTo(mapa);
        euNoMapa = true;
      }
    }
    const fonte = mapa.getSource('rota');
    if (fonte) fonte.setData(linhaRota());
    if (seguir && eu) mapa.easeTo({ center: [eu[1], eu[0]], padding: folgaMapa(), duration: 700 });
  };
  // o seu ponto fica no meio da parte do mapa que aparece (acima dos números e dos botões)
  const folgaMapa = () => {
    const ps = $('g-passo'),
      c = ps && !ps.hidden ? ps : document.querySelector('.g2-stats');
    const topo = c ? c.getBoundingClientRect().top : innerHeight * 0.6;
    return { top: 80, bottom: Math.max(0, innerHeight - topo + 10), left: 0, right: 0 };
  };
  const iniciarMapa = () => {
    if (est) return;
    carregarMapaLib()
      .then(() => {
        const box = $('g-mapa');
        if (!box || mapa) return;
        const raiz = document.documentElement,
          escuro = raiz.dataset.tema === 'escuro';
        const cor =
          getComputedStyle(raiz)
            .getPropertyValue(escuro ? '--p1' : '--accC')
            .trim() || '#2f6bff';
        const ini = eu || (st.rota.length ? st.rota[st.rota.length - 1] : store.get('nx-gps-ult', [-2.53, -44.29]));
        let trocou = false;
        mapa = new window.maplibregl.Map({
          container: box,
          style: `https://tiles.openfreemap.org/styles/${escuro ? 'dark' : 'liberty'}`,
          center: [ini[1], ini[0]],
          zoom: 15.5,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });
        mapa.addControl(
          new window.maplibregl.AttributionControl({ compact: true, customAttribution: 'OpenFreeMap' }),
          'top-left',
        );
        mapa.on('error', (e) => {
          if (!mapaPronto && escuro && !trocou) {
            trocou = true;
            try {
              mapa.setStyle('https://tiles.openfreemap.org/styles/liberty');
            } catch {}
          } else if (!mapaPronto) {
            const m = $('g-mapa-msg');
            if (m) m.textContent = 'Mapa indisponível agora. O GPS continua funcionando.';
          }
          void e;
        });
        mapa.on('style.load', () => {
          if (!mapa.getSource('rota')) {
            mapa.addSource('rota', { type: 'geojson', data: linhaRota() });
            mapa.addLayer({
              id: 'rota-borda',
              type: 'line',
              source: 'rota',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 },
            });
            mapa.addLayer({
              id: 'rota',
              type: 'line',
              source: 'rota',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': cor, 'line-width': 5.5 },
            });
          }
          mapaPronto = true;
          const m = $('g-mapa-msg');
          if (m) m.remove();
          atualizaMapa();
        });
        const el = document.createElement('div');
        el.className = 'g2-eu';
        euMk = new window.maplibregl.Marker({ element: el });
        mapa.on('dragstart', () => {
          seguir = false;
          const c = $('g-centro');
          if (c) c.classList.add('solto');
        });
      })
      .catch(() => {
        const m = $('g-mapa-msg');
        if (m) m.textContent = 'Mapa indisponível agora. O GPS continua funcionando.';
      });
  };
  const b3 = $('g-3d');
  if (b3)
    b3.onclick = () => {
      if (!mapa) return;
      p3d = !p3d;
      b3.textContent = p3d ? '2D' : '3D';
      mapa.easeTo({ pitch: p3d ? 60 : 0, zoom: p3d ? 16.5 : 15.5, duration: 600 });
    };
  const bc = $('g-centro');
  if (bc)
    bc.onclick = () => {
      seguir = true;
      bc.classList.remove('solto');
      if (mapa && eu)
        mapa.easeTo({
          center: [eu[1], eu[0]],
          padding: folgaMapa(),
          zoom: Math.max(mapa.getZoom(), 15.5),
          duration: 600,
        });
    };
  $('g-exp').onclick = () => {
    const x = $('g-extra');
    x.hidden = !x.hidden;
  };
  $('g-grip').onclick = () => {
    folhaAberta = !folhaAberta;
    $('g-folha').classList.toggle('aberta', folhaAberta);
    const o = $('g-opc');
    o.hidden = !folhaAberta;
    if (folhaAberta) {
      o.innerHTML = opcHTML();
      ligaOpc();
    }
  };
  // escolher o treino da semana (ou corrida livre) e o tipo (rua ou esteira)
  const irPara = (h) => {
    closeSheet(true);
    if (st.estado !== 'pronto') return;
    location.hash = h;
  };
  const abrirTreinos = async () => {
    if (st.estado !== 'pronto') return;
    const ini = inicioSemana(),
      fim = new Date(ini);
    fim.setDate(ini.getDate() + 6);
    const pl = (await buscarPlano(S.user.id, isoDia(ini), isoDia(fim)).catch(() => [])).filter(
      (x) => !semCorrida(x) && estruturaDe(x).length,
    );
    const hoje = hojeISO(),
      suf = est ? '/esteira' : '';
    openSheet(
      `<p class="eyebrow">Treinar pelo celular</p><div class="h2" style="margin-top:4px">Escolha o treino</div>
      <div class="stack" style="margin-top:14px">
        <button type="button" class="list-item" data-ir="#/gps/livre${suf}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.run}</span><div class="grow"><b>Corrida livre</b><div class="small muted">Tempo, distância e pace, com aviso a cada 1 km</div></div>${!p ? I.check : I.chev}</button>
        ${pl.length ? pl.map((x) => `<button type="button" class="list-item" data-ir="#/gps/${x.id}${suf}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.cal}</span><div class="grow" style="min-width:0"><b>${esc(x.titulo || nomeTipo(x.tipo))}</b><div class="small muted g2-trd">${x.data === hoje ? 'Hoje' : fmtDiaSem(x.data)} · ${esc(descreverEstrutura(estruturaDe(x), perfil))}</div></div>${p && p.id === x.id ? I.check : I.chev}</button>`).join('') : '<p class="small muted">Nenhum treino liberado nesta semana. Quando o treinador liberar, ele aparece aqui.</p>'}
      </div>`,
      (r) => {
        r.querySelectorAll('[data-ir]').forEach((x) => (x.onclick = () => irPara(x.dataset.ir)));
      },
    );
  };
  const abrirTipo = () => {
    if (st.estado !== 'pronto') return;
    const base = '#/gps/' + id;
    openSheet(
      `<p class="eyebrow">Treinar pelo celular</p><div class="h2" style="margin-top:4px">Onde você vai correr?</div>
      <div class="stack" style="margin-top:14px">
        <button type="button" class="list-item" data-ir="${base}" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${I.run}</span><div class="grow"><b>Na rua</b><div class="small muted">GPS com mapa, distância e pace</div></div>${!est ? I.check : I.chev}</button>
        <button type="button" class="list-item" data-ir="${base}/esteira" style="width:100%;text-align:left;color:inherit"><span class="ativ-ic">${GPS_IC.esteira}</span><div class="grow"><b>Na esteira</b><div class="small muted">Sensor de movimento conta os passos; no fim você confirma a distância do painel</div></div>${est ? I.check : I.chev}</button>
      </div>`,
      (r) => {
        r.querySelectorAll('[data-ir]').forEach((x) => (x.onclick = () => irPara(x.dataset.ir)));
      },
    );
  };
  $('g-sair').onclick = () => {
    if (st.estado === 'pronto') {
      encerrar();
      location.hash = '#/';
      return;
    }
    if (
      st.estado === 'correndo' &&
      !confirm('Sair da tela do treino? Ele fica pausado e você pode continuar depois em Treinar pelo celular.')
    )
      return;
    if (st.estado === 'correndo') {
      st.mov = movAgora();
      marcaMov = 0;
      st.estado = 'pausado';
    }
    salvar();
    encerrar();
    location.hash = '#/';
  };
  // destravar: segurar 1 s
  let segura = 0;
  const dest = $('g-dest');
  const ini = (e) => {
    e.preventDefault();
    dest.classList.add('segurando');
    segura = setTimeout(() => {
      $('g-trava').hidden = true;
      dest.classList.remove('segurando');
      vibrar(60);
    }, 900);
  };
  const sol = () => {
    clearTimeout(segura);
    dest.classList.remove('segurando');
  };
  dest.addEventListener('pointerdown', ini);
  dest.addEventListener('pointerup', sol);
  dest.addEventListener('pointerleave', sol);
  dest.addEventListener('contextmenu', (e) => e.preventDefault());
  // relógio da tela + checagem das partes por tempo
  const tick = () => {
    if (!document.getElementById('g-tempo') || !minha()) return encerrar();
    if (!est && pref.autopausa && st.estado === 'correndo' && ultMov && Date.now() - ultMov > 10000 && st.dist > 30)
      autoPausar();
    if (est && st.estado === 'correndo') serieEsteira();
    verificaPasso();
    if (est) sinalEsteira();
    if (st.estado === 'correndo') {
      falarPace();
      desenha();
      if (++nTick % 5 === 0) salvar();
    }
  };
  tickRef = setInterval(tick, 1000);
  const contRef = setInterval(() => {
    if (!document.getElementById('g-tempo')) return clearInterval(contRef);
    contagem();
  }, 200);
  ligarGPS();
  desenha();
  iniciarMapa();
  setTimeout(() => {
    podeSemSinal = true;
    if (document.getElementById('g-bts')) desenha();
  }, 15000); // sem sinal bom em 15 s: libera começar assim mesmo
  // saiu da tela por navegação: libera GPS e tela
  const sairRota = () => {
    if (location.hash !== rotaTela) {
      if (st.estado === 'correndo') {
        st.mov = movAgora();
        marcaMov = 0;
        st.estado = 'pausado';
        salvar();
      }
      encerrar();
      window.removeEventListener('hashchange', sairRota);
    }
  };
  window.addEventListener('hashchange', sairRota);
}
