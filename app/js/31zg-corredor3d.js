// Corredor 3D da análise da passada: um boneco corre com as medidas do aluno e outro mostra a direção do ajuste,
// no mesmo ritmo. A direção só mexe no que saiu da faixa e só até onde a literatura apoia (ex.: cadência +5 a 10%,
// Heiderscheit et al. 2011). Curvas-base da marcha de corrida aproximadas de Novacheck (1998).

/* corredor:puro:inicio (contas sem tela: testadas em scripts/testes/corredor.test.js) */
const CR3_RAD = Math.PI / 180;
// interpolação periódica (Catmull-Rom) por pontos [fase 0..1, valor]
function cr3Curva(pts) {
  const n = pts.length;
  return (f) => {
    f = ((f % 1) + 1) % 1;
    let i = 0;
    while (i < n - 1 && pts[i + 1][0] <= f) i++;
    if (f < pts[0][0]) i = n - 1;
    const p = (k) => {
      const j = (((i + k) % n) + n) % n;
      const voltas = Math.floor((i + k) / n);
      return [pts[j][0] + voltas, pts[j][1]];
    };
    let [x0, y0] = p(-1),
      [x1, y1] = p(0),
      [x2, y2] = p(1),
      [x3, y3] = p(2);
    let ff = f;
    if (ff < x1) ff += 1;
    const t = (ff - x1) / (x2 - x1 || 1);
    const m1 = ((y2 - y0) / (x2 - x0)) * (x2 - x1),
      m2 = ((y3 - y1) / (x3 - x1)) * (x2 - x1);
    const t2 = t * t,
      t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * y2 + (t3 - t2) * m2;
  };
}
// parâmetros do movimento a partir das medidas; valor fora do plausível (erro do vídeo) fica no limite
// solto = true: sem limitar (para a tabela mostrar o valor medido de verdade)
function cr3Parametros(m, alturaM, solto) {
  const lim = (v, a, b, pad) => (v == null || !isFinite(v) ? pad : solto ? v : Math.max(a, Math.min(b, v)));
  const tem = (k) => m[k] != null && isFinite(m[k]);
  return {
    medido: ['cadencia', 'frente', 'joelhoIC', 'tronco', 'queda', 'joelhoDentro', 'oscilacao'].filter(tem),
    H: lim(alturaM, 1.4, 2.05, 1.7),
    cad: lim(m.cadencia, 130, 200, 165),
    kIC: lim(m.joelhoIC, 4, 34, 18),
    kMax: lim(m.joelhoMax, 28, 55, 40),
    kBal: lim(m.joelhoBal, 70, 120, 95),
    frente: lim(m.frente, -4, 30, 10),
    tronco: lim(m.tronco, -2, 18, 6),
    queda: lim(m.queda, 0, 12, 3),
    joelhoDentro: lim(m.joelhoDentro, 0, 20, 3),
    cotovelo: lim(m.cotovelo, 55, 120, 85),
    bracoFrente: lim(m.bracoFrente, 0, 50, 25),
    bracoTras: lim(m.bracoTras, 10, 60, 35),
    apoio: 0.27,
  };
}
// direção de ajuste: só o que saiu da faixa (nivel 'atencao' ou 'fora'), um passo na direção da faixa
function cr3Direcao(p, nivel) {
  const q = { ...p };
  // só o que foi medido e saiu da faixa
  const fora = (k) => (p.medido || []).includes(k) && (nivel[k] === 'atencao' || nivel[k] === 'fora');
  const mudou = [];
  if (fora('cadencia')) {
    q.cad = Math.round(Math.min(p.cad * 1.075, 190));
    mudou.push('cadencia');
  }
  if (fora('frente') && p.frente > 12) {
    q.frente = Math.max(12, p.frente * 0.7);
    mudou.push('frente');
  }
  if (fora('joelhoIC')) {
    q.kIC = p.kIC < 10 ? Math.min(15, p.kIC + 8) : Math.max(24, p.kIC - 8);
    mudou.push('joelhoIC');
  }
  if (fora('tronco')) {
    q.tronco = p.tronco < 3 ? 5 : Math.max(10, p.tronco - 5);
    mudou.push('tronco');
  }
  if (fora('queda') && p.queda >= 5) {
    q.queda = Math.max(3, p.queda * 0.6);
    mudou.push('queda');
  }
  if (fora('joelhoDentro') && p.joelhoDentro >= 8) {
    q.joelhoDentro = Math.max(5, p.joelhoDentro * 0.6);
    mudou.push('joelhoDentro');
  }
  // oscilação alta com cadência medida e já boa: um pouco mais de cadência (passo mais curto, voo menor)
  if (fora('oscilacao') && (p.medido || []).includes('cadencia') && !fora('cadencia')) {
    q.cad = Math.round(Math.min(p.cad * 1.05, 190));
    mudou.push('oscilacao');
  }
  return { q, mudou };
}
// linhas da tabela "hoje › na direção de" (só o que mudou)
function cr3Linhas(p, q, mudou) {
  const n = (v) => String(Math.round(v));
  const L = [];
  if (p.cad !== q.cad) L.push(['Cadência', n(p.cad) + ' passos/min', n(q.cad) + ' passos/min']);
  if (p.cad !== q.cad) L.push(['Subida e descida do corpo', 'maior', 'menor']);
  if (mudou.includes('frente')) L.push(['Pé à frente do quadril', n(p.frente) + ' cm', n(q.frente) + ' cm']);
  if (mudou.includes('joelhoIC')) L.push(['Joelho ao tocar o chão', n(p.kIC) + '°', n(q.kIC) + '°']);
  if (mudou.includes('tronco')) L.push(['Inclinação do tronco', n(p.tronco) + '°', n(q.tronco) + '°']);
  if (mudou.includes('queda')) L.push(['Queda do quadril', n(p.queda) + '°', n(q.queda) + '°']);
  if (mudou.includes('joelhoDentro')) L.push(['Joelho para dentro', n(p.joelhoDentro) + '°', n(q.joelhoDentro) + '°']);
  return L;
}
/* corredor:puro:fim */

function cr3Boneco(THREE, p, cores) {
  const H = p.H;
  const L = {
    coxa: 0.245 * H,
    perna: 0.246 * H,
    pe: 0.15 * H,
    tornoz: 0.039 * H,
    tronco: 0.29 * H,
    braco: 0.186 * H,
    ante: 0.16 * H,
    pelve: 0.1 * H,
    ombro: 0.13 * H,
  };
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: cores.corpo,
    roughness: 0.55,
    metalness: 0.05,
    transparent: cores.op < 1,
    opacity: cores.op,
  });
  const matJ = mat;
  const caps = (r, l, m = mat) => {
    const me = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, l - 2 * r), 6, 14), m);
    me.position.y = -l / 2;
    const piv = new THREE.Group();
    piv.add(me);
    return piv;
  };
  const esf = (r, m = matJ) => new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m);
  const pelve = new THREE.Group();
  g.add(pelve);
  const quadril = caps(0.062 * H, L.pelve * 1.45);
  quadril.rotation.x = Math.PI / 2;
  quadril.position.z = (L.pelve * 1.5) / 2;
  pelve.add(quadril);
  const tronco = new THREE.Group();
  pelve.add(tronco);
  // tronco mais largo no peito que na cintura
  const torso = caps(0.072 * H, L.tronco * 0.98);
  torso.rotation.z = Math.PI;
  torso.scale.set(0.85, 1, 1.35);
  tronco.add(torso);
  const pesc = caps(0.022 * H, 0.06 * H);
  pesc.rotation.z = Math.PI;
  pesc.position.y = L.tronco - 0.01 * H;
  tronco.add(pesc);
  const cab = esf(0.058 * H, mat);
  cab.scale.set(1, 1.12, 0.95);
  cab.position.y = L.tronco + 0.095 * H;
  tronco.add(cab);
  const pernas = [],
    bracos = [];
  for (const s of [1, -1]) {
    const qd = new THREE.Group();
    qd.position.set(0, 0, s * L.pelve * 0.5);
    pelve.add(qd);
    qd.add(esf(0.039 * H));
    const coxa = caps(0.039 * H, L.coxa);
    qd.add(coxa);
    const jo = new THREE.Group();
    jo.position.y = -L.coxa;
    coxa.add(jo);
    jo.add(esf(0.029 * H));
    const perna = caps(0.029 * H, L.perna);
    jo.add(perna);
    const tz = new THREE.Group();
    tz.position.y = -L.perna;
    perna.add(tz);
    tz.add(esf(0.019 * H));
    const pe = caps(0.02 * H, L.pe);
    pe.rotation.z = Math.PI / 2;
    pe.position.set(-0.25 * L.pe, -L.tornoz, 0);
    tz.add(pe);
    pernas.push({ s, qd, coxa, jo, perna, tz, pe });
    const om = new THREE.Group();
    om.position.set(0, L.tronco - 0.035 * H, s * L.ombro);
    tronco.add(om);
    om.add(esf(0.026 * H));
    const bra = caps(0.024 * H, L.braco);
    om.add(bra);
    const co = new THREE.Group();
    co.position.y = -L.braco;
    bra.add(co);
    co.add(esf(0.02 * H));
    const ant = caps(0.019 * H, L.ante);
    co.add(ant);
    bracos.push({ s, bra, co, ant });
  }
  g.traverse((o) => o.isMesh && ((o.castShadow = true), (o.receiveShadow = false)));
  // curvas da marcha (fase 0 = toque do pé no chão)
  const D = () => Math.min(0.42, p.apoio / (120 / p.cad)); // fração do ciclo com o pé no chão
  const ideias = {};
  const montar = () => {
    const d = D();
    // quadril no toque: resolvido para o calcanhar cair 'frente' cm à frente do quadril, com o joelho em kIC
    const fr = p.frente / 100;
    let a = -10,
      b = 50;
    for (let i = 0; i < 40; i++) {
      const h = (a + b) / 2;
      const x = L.coxa * Math.sin(h * CR3_RAD) + L.perna * Math.sin((h - p.kIC) * CR3_RAD) - 0.03 * H;
      x > fr ? (b = h) : (a = h);
    }
    const hIC = (a + b) / 2;
    ideias.hIC = hIC;
    ideias.d = d;
    ideias.quadril = cr3Curva([
      [0, hIC],
      [d * 0.45, hIC * 0.45],
      [d, -12],
      [d + 0.08, -10],
      [0.6, 12],
      [0.8, hIC + 12],
      [0.92, hIC + 6],
    ]);
    ideias.joelho = cr3Curva([
      [0, p.kIC],
      [d * 0.42, p.kMax],
      [d, 18],
      [0.55, p.kBal * 0.85],
      [0.66, p.kBal],
      [0.82, 55],
      [0.95, p.kIC + 4],
    ]);
    ideias.tornoz = cr3Curva([
      [0, 4],
      [d * 0.45, 18],
      [d, -22],
      [d + 0.1, -12],
      [0.7, 4],
      [0.92, 6],
    ]);
    ideias.ombro = cr3Curva([
      [0, -p.bracoTras * 0.8],
      [0.5, p.bracoFrente],
    ]);
  };
  montar();
  // pose numa fase do ciclo (perna direita na fase f, esquerda em f + 0.5)
  const pose = (f) => {
    const d = ideias.d;
    let algumApoio = false;
    for (const pr of pernas) {
      const fi = pr.s === 1 ? f : f + 0.5;
      const ff = ((fi % 1) + 1) % 1;
      const apoio = ff < d;
      pr.apoio = apoio;
      algumApoio = algumApoio || apoio;
      pr.coxa.rotation.z = ideias.quadril(ff) * CR3_RAD;
      pr.jo.rotation.z = -ideias.joelho(ff) * CR3_RAD;
      pr.tz.rotation.z = ideias.tornoz(ff) * CR3_RAD;
      // no apoio: joelho que entra (valgo) visto de trás
      const bell = apoio ? Math.sin((ff / d) * Math.PI) : 0;
      pr.coxa.rotation.x = -pr.s * p.joelhoDentro * 0.6 * CR3_RAD * bell;
    }
    // quadril cai do lado da perna no ar
    const fd = ((f % 1) + 1) % 1,
      fe = (fd + 0.5) % 1;
    const qD = fd < d ? Math.sin((fd / d) * Math.PI) : 0,
      qE = fe < d ? Math.sin((fe / d) * Math.PI) : 0;
    pelve.rotation.x = (qD - qE) * p.queda * CR3_RAD;
    tronco.rotation.z = -p.tronco * CR3_RAD;
    for (const br of bracos) {
      const fi = br.s === 1 ? f : f + 0.5;
      br.bra.rotation.z = ideias.ombro(fi) * CR3_RAD;
      br.co.rotation.z = (180 - p.cotovelo) * CR3_RAD;
    }
    return algumApoio;
  };
  // altura da pelve: no apoio, o pé encosta no chão; no voo, parábola com a gravidade
  const tabela = [];
  const N = 240;
  const pAux = new THREE.Vector3();
  const minPe = () => {
    let mn = Infinity;
    g.updateMatrixWorld(true);
    for (const pr of pernas) {
      if (!pr.apoio) continue;
      for (const y of [-0.0, L.pe * 0.95]) {
        pAux.set(0, 0, 0);
        pr.pe.children[0].localToWorld(pAux.set(0, y - L.pe / 2, 0));
        // pontas da cápsula do pé
        mn = Math.min(mn, pAux.y - 0.02 * H);
      }
    }
    return mn;
  };
  const calibrar = () => {
    montar();
    g.position.set(0, 0, 0);
    pelve.position.set(0, 0, 0);
    const passo = 60 / p.cad;
    for (let i = 0; i < N; i++) {
      const f = i / N;
      const ap = pose(f);
      tabela[i] = ap ? -minPe() : null;
    }
    // voo: parábola balística entre o fim de um apoio e o começo do próximo
    for (let i = 0; i < N; i++) {
      if (tabela[i] != null) continue;
      let a = i,
        b = i;
      while (tabela[(a - 1 + N) % N] == null) a--;
      while (tabela[(b + 1) % N] == null) b++;
      const ya = tabela[(a - 1 + N) % N],
        yb = tabela[(b + 1) % N];
      const tv = ((b - a + 2) / N) * 2 * passo;
      const u = (i - a + 1) / (b - a + 2);
      const ap = (9.81 * tv * tv) / 8;
      tabela[i] = ya + (yb - ya) * u + 4 * ap * u * (1 - u);
    }
    const ys = tabela.slice();
    return { osc: (Math.max(...ys) - Math.min(...ys)) * 100 };
  };
  const cal = calibrar();
  // velocidade da esteira: quanto o pé de apoio anda para trás por segundo
  let vel = 0;
  {
    const pr = pernas[0],
      w = new THREE.Vector3();
    pose(0.001);
    g.updateMatrixWorld(true);
    pr.tz.getWorldPosition(w);
    const x0 = w.x;
    pose(ideias.d * 0.98);
    g.updateMatrixWorld(true);
    pr.tz.getWorldPosition(w);
    vel = (x0 - w.x) / (ideias.d * 0.98 * (120 / p.cad));
  }
  const api = {
    grupo: g,
    osc: cal.osc,
    vel,
    hIC: ideias.hIC,
    // t em segundos
    quadro(t) {
      const f = (t / (120 / p.cad)) % 1;
      pose(f);
      const i = Math.floor(f * N) % N,
        u = f * N - Math.floor(f * N);
      pelve.position.y = tabela[i] * (1 - u) + tabela[(i + 1) % N] * u;
      return f;
    },
    pernas,
    pelve,
  };
  return api;
}

// card do corredor 3D (vazio quando nada saiu da faixa)
function cr3HTML(x) {
  const { m } = psFinais(x);
  const nivel = {};
  Object.keys(m).forEach((k) => (nivel[k] = psNivel(k, m[k])));
  const pr = cr3Parametros(m, null, true);
  const { q, mudou } = cr3Direcao(pr, nivel);
  if (!mudou.length) return '';
  const linhas = cr3Linhas(pr, q, mudou);
  return `<div class="card cr3" id="cr3" data-id="${x.id}"><span class="eyebrow">Na direção do ajuste</span>
    <p class="small muted" style="margin-top:2px">O boneco cinza corre com as suas medidas. O colorido mostra só o que vale ajustar, no mesmo ritmo.</p>
    <div class="cr3-vp" id="cr3-vp"><span class="cr3-rot h">Hoje</span><span class="cr3-rot d">Na direção de</span><div class="cr3-carga small muted">Carregando o 3D…</div></div>
    <div class="cr3-tab">${linhas.map(([a, b, c]) => `<div class="cr3-lin"><span>${a}</span><b class="h">${b}</b><i>›</i><b class="d">${c}</b></div>`).join('')}</div>
    <p class="tiny dim" style="margin-top:8px">Não existe um jeito único de correr. O ajuste é pequeno e gradual, e quem orienta é o seu treinador.</p></div>`;
}
// liga o 3D do card (carrega só quando aparece na tela; para quando sai)
async function cr3Ligar(raiz, x) {
  const card = raiz.querySelector('#cr3');
  if (!card || !window.WebGLRenderingContext) return;
  const vp = card.querySelector('#cr3-vp');
  const iniciar = async () => {
    let lib;
    try {
      lib = await c3dLib();
    } catch {
      vp.querySelector('.cr3-carga').textContent = 'Não foi possível carregar o 3D agora.';
      return;
    }
    if (!document.body.contains(vp)) return;
    const THREE = lib.THREE;
    const { m } = psFinais(x);
    const nivel = {};
    Object.keys(m).forEach((k) => (nivel[k] = psNivel(k, m[k])));
    const p0 = cr3Parametros(m),
      { q: p1 } = cr3Direcao(p0, nivel);
    const css = getComputedStyle(document.documentElement);
    const cor = (v, pad) => new THREE.Color((css.getPropertyValue(v) || '').trim() || pad);
    const W = vp.clientWidth,
      Hh = vp.clientHeight;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setSize(W, Hh);
    r.shadowMap.enabled = true;
    vp.querySelector('.cr3-carga').remove();
    vp.prepend(r.domElement);
    const cena = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, W / Hh, 0.1, 50);
    cena.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1));
    const sol = new THREE.DirectionalLight(0xffffff, 1.5);
    sol.position.set(2, 5, 4);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
    cena.add(sol);
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.3 }));
    chao.rotation.x = -Math.PI / 2;
    chao.receiveShadow = true;
    cena.add(chao);
    // cinza do "hoje": no tema claro um cinza médio, no escuro um cinza claro (contraste com o colorido nos dois)
    const fundo = cor('--bg', '#050c1c');
    const claro = fundo.r * 0.3 + fundo.g * 0.59 + fundo.b * 0.11 > 0.5;
    const cH = claro ? new THREE.Color('#a3aec2') : cor('--mute', '#8fa1c4'),
      cD = cor('--acc', '#3ec6e0');
    const A = cr3Boneco(THREE, p0, { corpo: cH, op: 1 }),
      B = cr3Boneco(THREE, p1, { corpo: cD, op: 1 });
    A.grupo.position.x = -0.85;
    B.grupo.position.x = 0.85;
    cena.add(A.grupo, B.grupo);
    const esteira = (xx, c) => {
      const g = new THREE.Group();
      g.position.x = xx;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.04, 0.5),
        new THREE.MeshStandardMaterial({ color: cor('--s2', '#10224a'), roughness: 0.9 }),
      );
      base.position.y = -0.02;
      base.receiveShadow = true;
      g.add(base);
      const fx = [];
      for (let i = 0; i < 8; i++) {
        const f = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.005, 0.46),
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4 }),
        );
        f.position.y = 0.002;
        g.add(f);
        fx.push(f);
      }
      cena.add(g);
      return fx;
    };
    const fA = esteira(-0.85, cH),
      fB = esteira(0.85, cD);
    const alvo = new THREE.Vector3(0, 0.82, 0);
    const lib2 = lib.OrbitControls ? new lib.OrbitControls(cam, r.domElement) : null;
    const tras = x.vista !== 'lado';
    cam.position.set(tras ? -5.2 : 0.9, 1.25, tras ? 0.6 : 5.3);
    if (lib2) {
      lib2.target.copy(alvo);
      lib2.enablePan = false;
      lib2.enableDamping = true;
      lib2.dampingFactor = 0.16;
      lib2.minDistance = 2.5;
      lib2.maxDistance = 8;
      lib2.maxPolarAngle = Math.PI * 0.55;
    }
    cam.lookAt(alvo);
    const rots = card.querySelectorAll('.cr3-rot');
    const v3 = new THREE.Vector3();
    const proj = (o, el) => {
      o.getWorldPosition(v3);
      v3.y += 0.98 * (p0.H / 1.7);
      v3.project(cam);
      el.style.left = ((v3.x + 1) / 2) * W - el.offsetWidth / 2 + 'px';
      el.style.top = ((1 - v3.y) / 2) * Hh - 12 + 'px';
      el.style.opacity = v3.z < 1 ? 1 : 0;
    };
    const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visivel = true,
      t0 = performance.now(),
      tPausa = 0;
    const io = new IntersectionObserver((es) => (visivel = es[0].isIntersecting));
    io.observe(vp);
    const laco = () => {
      if (!document.body.contains(vp)) {
        io.disconnect();
        r.dispose();
        return;
      }
      requestAnimationFrame(laco);
      if (!visivel || document.hidden) return;
      const t = parado ? tPausa : (performance.now() - t0) / 1000;
      A.quadro(t);
      B.quadro(t);
      for (const [fx, v] of [
        [fA, A.vel],
        [fB, B.vel],
      ])
        fx.forEach((f, i) => (f.position.x = ((((i * 0.18 - t * v) % 1.44) + 1.44) % 1.44) - 0.72));
      if (lib2) lib2.update();
      r.render(cena, cam);
      proj(A.pelve, rots[0]);
      proj(B.pelve, rots[1]);
    };
    laco();
  };
  // só monta quando o card chega perto da tela
  const io0 = new IntersectionObserver(
    (es) => {
      if (es[0].isIntersecting) {
        io0.disconnect();
        iniciar();
      }
    },
    { rootMargin: '200px' },
  );
  io0.observe(card);
}
