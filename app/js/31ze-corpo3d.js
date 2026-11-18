/* Nexos App · Corpo 3D: anatomia em 3D para corrida e força, ligada ao mapa de dor do check-in.
   Os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo.
   Motor: three.js (MIT), carregado só quando a tela abre. Modelos: Z-Anatomy (CC BY-SA 4.0), em app/corpo3d. */
'use strict';

const C3D_VER = 2;
const C3D_DIR = '/app/'; // aluno e treinador usam os mesmos arquivos
const C3D_ORDEM = ['joelho', 'perna', 'tornozelo-pe', 'coxa', 'quadril', 'lombar', 'ombro'];
const C3D_TIPO = {
  musculo: 'Músculos',
  tendao: 'Tendões e ligamentos',
  ligamento: 'Tendões e ligamentos',
  osso: 'Ossos',
};
const C3D_AVISO =
  'Material educativo. Não substitui avaliação, diagnóstico ou tratamento por um profissional de saúde.';
const C3D_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6m0 0-3 8m3-8 3 8M7 9.5l5-1 5 1"/><path d="M3 12a9 4 0 0 0 18 0" opacity=".55"/></svg>';
const C3D_IC_CAM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>';
const C3D_IC_CENTRO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>';
let c3dLibP = null;
const c3dLib = () =>
  c3dLibP ||
  (c3dLibP = import(C3D_DIR + 'vendor/three-corpo.js').catch((e) => {
    c3dLibP = null;
    throw e;
  }));
const c3dBase = (n) => String(n || '').replace(/\.[a-z0-9]*$/, '');
const c3dNome = (n) => C3D_NOMES[c3dBase(n)] || c3dBase(n);

// modelo da região: guarda no Cache Storage depois do primeiro uso (abre sem internet nas próximas vezes)
async function c3dModelo(reg) {
  const url = `${C3D_DIR}corpo3d/${reg}.glb?v=${C3D_VER}`;
  try {
    const nome = 'nx-corpo3d-v' + C3D_VER;
    // apaga os modelos de versões anteriores
    caches.keys().then((ks) => ks.forEach((k) => k.startsWith('nx-corpo3d-') && k !== nome && caches.delete(k)));
    const c = await caches.open(nome);
    let r = await c.match(url);
    if (!r) {
      r = await fetch(url);
      if (!r.ok) throw new Error('modelo ' + r.status);
      c.put(url, r.clone()).catch(() => {});
    }
    return await r.arrayBuffer();
  } catch (e) {
    const r = await fetch(url);
    if (!r.ok) throw e;
    return await r.arrayBuffer();
  }
}

/* ---------- link a partir do mapa de dor ---------- */
// chave do mapa de dor (ex.: joelho_e, coxa_t_d) → rota do Corpo 3D
function c3dRotaDor(chave) {
  const k = String(chave || '');
  const lado = /_e$/.test(k) ? 'e' : 'd';
  const base = k.replace(/_(d|e)$/, '');
  const m = C3D_DOR[base];
  return m ? `#/corpo3d/${m[0]}/${lado}/dor-${base}` : null;
}
function c3dBotaoDor(locais, rotulo = 'Ver em 3D') {
  const k = (locais || []).find((x) => c3dRotaDor(x));
  return k ? `<a class="btn ghost sm c3d-bt" href="${c3dRotaDor(k)}">${C3D_IC}${rotulo}</a>` : '';
}

/* ---------- lista de regiões ---------- */
function viewCorpo3d(reg, lado, sel) {
  if (reg && C3D_REG[reg]) return viewCorpo3dRegiao(reg, lado === 'e' ? 'e' : 'd', sel || '');
  layout(S.staff ? 'wide' : '');
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Anatomia</p><h1 class="h1">Corpo 3D</h1>
    <p class="small muted" style="margin-top:6px">Gire, aproxime e toque nas estruturas. Veja as dores mais comuns na corrida e o que cada exercício trabalha.</p>
    <div class="stack" style="margin-top:16px">${C3D_ORDEM.map(
      (r) =>
        `<a class="list-item" href="#/corpo3d/${r}" style="color:inherit"><span class="ativ-ic">${C3D_IC}</span><div class="grow"><b>${C3D_REG[r].t}</b><div class="small muted">${C3D_REG[r].d} ${C3D_REG[r].cond.length} ${C3D_REG[r].cond.length === 1 ? 'condição' : 'condições'}.</div></div>${I.chev}</a>`,
    ).join('')}</div>
    <p class="tiny dim c3d-pe">${C3D_AVISO}<br>Modelos 3D: Z-Anatomy (CC BY-SA 4.0), a partir do BodyParts3D, © DBCLS (CC BY-SA 2.1 JP). Motor 3D: three.js.</p>`;
  // adianta o carregamento: o motor já na lista, e o modelo assim que o dedo encosta na região
  c3dLib().catch(() => {});
  $app.querySelectorAll('a[href^="#/corpo3d/"]').forEach((a) =>
    a.addEventListener('pointerdown', () => c3dModelo(a.getAttribute('href').split('/')[2]).catch(() => {}), {
      once: true,
    }),
  );
}

/* ---------- tela da região ---------- */
async function viewCorpo3dRegiao(reg, lado, sel) {
  layout(S.staff ? 'wide' : '');
  const R = C3D_REG[reg];
  $app.innerHTML = `<a class="back" href="#/corpo3d">${I.back} Corpo 3D</a>
    <div class="row between" style="align-items:flex-end;gap:10px"><div><p class="eyebrow">Corpo 3D</p><h1 class="h1">${R.t}</h1></div>
      ${reg === 'lombar' ? '' : `<div class="c3d-lado" role="group" aria-label="Lado"><button type="button" data-lado="d" class="${lado === 'd' ? 'on' : ''}">Direito</button><button type="button" data-lado="e" class="${lado === 'e' ? 'on' : ''}">Esquerdo</button></div>`}</div>
    <div class="c3d-vp" id="c3d-vp"><div class="c3d-carga" id="c3d-carga"><span class="c3d-spin"></span><span class="small muted">Carregando o modelo 3D</span></div>
      <div class="c3d-rot" id="c3d-rot" hidden></div>
      <div class="c3d-ferr"><button type="button" class="c3d-fb" id="c3d-cam" aria-label="Camadas">${C3D_IC_CAM}</button><button type="button" class="c3d-fb" id="c3d-centro" aria-label="Centralizar">${C3D_IC_CENTRO}</button></div>
      <div class="c3d-camadas" id="c3d-camadas" hidden>${['musculo', 'tendao', 'osso'].map((t) => `<label><input type="checkbox" data-camada="${t}" checked> ${C3D_TIPO[t]}</label>`).join('')}</div></div>
    <div class="tabs c3d-abas" role="tablist"><button type="button" data-aba="exp">Explorar</button><button type="button" data-aba="cond">Condições</button><button type="button" data-aba="ex">Exercícios</button></div>
    <div id="c3d-painel"></div>
    <p class="tiny dim c3d-pe">${C3D_AVISO}<br>Modelos 3D: Z-Anatomy (CC BY-SA 4.0), a partir do BodyParts3D, © DBCLS (CC BY-SA 2.1 JP).</p>`;
  const vp = $app.querySelector('#c3d-vp'),
    painel = $app.querySelector('#c3d-painel'),
    rot = $app.querySelector('#c3d-rot');
  $app
    .querySelectorAll('[data-lado]')
    .forEach(
      (b) =>
        (b.onclick = () => trocarRota(location.pathname + `#/corpo3d/${reg}/${b.dataset.lado}${sel ? '/' + sel : ''}`)),
    );
  let cena;
  try {
    cena = await c3dCena(vp, reg, lado);
  } catch (e) {
    console.error(e);
    vp.querySelector('#c3d-carga').innerHTML =
      `<span class="small muted" style="text-align:center;padding:0 20px">${e && e.message === 'sem-webgl' ? 'Este aparelho não consegue mostrar 3D (WebGL desligado).' : 'Não foi possível carregar o modelo. Confira a internet e tente de novo.'}</span>`;
    return;
  }
  vp.querySelector('#c3d-carga').remove();
  cena.aoTocar = (malha) => {
    abrirAba('exp');
    mostrarEstrutura(malha);
  };
  cena.aoRotulo = (txt, x, y) => {
    rot.hidden = !txt;
    if (txt) {
      rot.textContent = txt;
      rot.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-130%)`;
    }
  };
  vp.querySelector('#c3d-cam').onclick = () => {
    const c = vp.querySelector('#c3d-camadas');
    c.hidden = !c.hidden;
  };
  vp.querySelectorAll('[data-camada]').forEach((i) => (i.onchange = () => cena.camada(i.dataset.camada, i.checked)));
  vp.querySelector('#c3d-centro').onclick = () => cena.enquadrar();

  // painéis
  const mostrarEstrutura = (m) => {
    const n = m ? c3dBase(m.userData.nx) : null;
    painel.innerHTML = m
      ? `<div class="card"><p class="eyebrow">${C3D_TIPO[m.userData.tipo] || ''}</p><h3 class="c3d-tit">${esc(c3dNome(n))}</h3>
          <p class="small" style="margin-top:6px">${esc(C3D_FUNC[n] || 'Toque em outras estruturas para comparar, ou abra a lista para ver todas.')}</p>
          <div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn ghost sm" id="c3d-lista">Lista de estruturas</button><button type="button" class="btn ghost sm" id="c3d-tudo">Mostrar tudo</button></div></div>`
      : `<div class="card"><p class="small"><b>Toque numa estrutura</b> para ver o nome e para que ela serve. Gire com um dedo e aproxime com dois.</p>
          <div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn ghost sm" id="c3d-lista">Lista de estruturas</button><button type="button" class="btn ghost sm" id="c3d-tudo">Mostrar tudo</button></div></div>`;
    painel.querySelector('#c3d-lista').onclick = () => listaEstruturas();
    painel.querySelector('#c3d-tudo').onclick = () => {
      cena.limpar();
      mostrarEstrutura(null);
    };
  };
  const listaEstruturas = () => {
    const grupos = {};
    cena.malhas.forEach((m) => {
      const g = C3D_TIPO[m.userData.tipo] || 'Outros';
      const n = c3dNome(m.userData.nx);
      (grupos[g] = grupos[g] || new Map()).set(n, m);
    });
    openSheet(
      `<h3 class="h2">Estruturas</h3><input class="input" id="c3d-busca" placeholder="Buscar (ex.: menisco)" style="margin-top:10px">
      <div id="c3d-l">${Object.entries(grupos)
        .map(
          ([g, mp]) =>
            `<p class="sec-lbl">${g}</p><div class="stack">${[...mp.keys()]
              .sort((a, b) => a.localeCompare(b, 'pt'))
              .map(
                (n) =>
                  `<button type="button" class="list-item c3d-li" data-n="${esc(n)}"><div class="grow"><b>${esc(n)}</b></div></button>`,
              )
              .join('')}</div>`,
        )
        .join('')}</div>`,
      (root) => {
        const porNome = new Map();
        Object.values(grupos).forEach((mp) => mp.forEach((m, n) => porNome.set(n, m)));
        root.querySelector('#c3d-busca').oninput = (e) => {
          const q = semAcento(e.target.value.toLowerCase());
          root
            .querySelectorAll('.c3d-li')
            .forEach((b) => (b.hidden = q && !semAcento(b.dataset.n.toLowerCase()).includes(q)));
        };
        root.onclick = (e) => {
          const b = e.target.closest('.c3d-li');
          if (!b) return;
          closeSheet();
          const m = porNome.get(b.dataset.n);
          cena.selecionar(m);
          mostrarEstrutura(m);
        };
      },
    );
  };
  const mostrarCondicoes = (id) => {
    const c = R.cond.find((x) => x.id === id);
    if (!c) {
      cena.limpar();
      painel.innerHTML = `<div class="stack">${R.cond.map((x) => `<button type="button" class="list-item" data-cond="${x.id}"><div class="grow"><b>${x.t}</b><div class="small muted">${x.oque}</div></div>${I.chev}</button>`).join('')}</div>`;
      painel.querySelectorAll('[data-cond]').forEach((b) => (b.onclick = () => mostrarCondicoes(b.dataset.cond)));
      return;
    }
    cena.condicao(c.alvo);
    const exs = c.ex.map((k) => C3D_EX[k]).filter(Boolean);
    painel.innerHTML = `<button type="button" class="link-btn small" id="c3d-volta-c">${I.back} Todas as condições</button>
      <div class="card" style="margin-top:8px"><h3 class="c3d-tit">${c.t}</h3>
        <p class="small c3d-lbl">O que é</p><p class="small">${c.oque}</p>
        <p class="small c3d-lbl">Quem costuma ter e o que sente</p><p class="small">${c.quem}</p>
        <p class="small c3d-lbl">O que costuma ajudar</p><p class="small">${c.treino}</p>
        ${
          exs.length
            ? `<div class="chips" style="margin-top:10px">${c.ex
                .filter((k) => C3D_EX[k])
                .map((k) => `<button type="button" class="chip" data-ex="${k}">${C3D_EX[k].t}</button>`)
                .join('')}</div>`
            : ''
        }</div>
      <div class="c3d-alerta"><b>Procure um profissional de saúde se tiver</b><ul>${c.alerta.map((a) => `<li>${a}</li>`).join('')}</ul></div>`;
    painel.querySelector('#c3d-volta-c').onclick = () => mostrarCondicoes(null);
    painel.querySelectorAll('[data-ex]').forEach((b) => (b.onclick = () => irExercicio(b.dataset.ex)));
  };
  const irExercicio = (k) => {
    const e = C3D_EX[k];
    if (!e) return;
    if (e.r !== reg) return trocarRota(location.pathname + `#/corpo3d/${e.r}/${lado}/x-${k}`);
    abrirAba('ex');
    mostrarExercicios(k);
  };
  const exsReg = Object.entries(C3D_EX).filter(([, e]) => e.r === reg);
  const mostrarExercicios = (k) => {
    painel.innerHTML = exsReg.length
      ? `<div class="stack">${exsReg.map(([id, e]) => `<button type="button" class="list-item${id === k ? ' on' : ''}" data-x="${id}"><div class="grow"><b>${e.t}</b><div class="small muted">${e.m.map((n) => c3dNome(n)).join(', ')}</div></div></button>`).join('')}</div>`
      : '<p class="small muted">Os exercícios desta região ficam nas outras partes do corpo.</p>';
    painel.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => mostrarExercicios(b.dataset.x)));
    if (k && C3D_EX[k]) cena.exercicio(C3D_EX[k].m);
    else cena.limpar();
  };
  const abas = $app.querySelectorAll('[data-aba]');
  const abrirAba = (a) => abas.forEach((b) => b.classList.toggle('on', b.dataset.aba === a));
  abas.forEach(
    (b) =>
      (b.onclick = () => {
        abrirAba(b.dataset.aba);
        if (b.dataset.aba === 'exp') {
          cena.limpar();
          mostrarEstrutura(null);
        } else if (b.dataset.aba === 'cond') mostrarCondicoes(null);
        else mostrarExercicios(null);
      }),
  );
  // seleção inicial pela rota: c-<condição>, x-<exercício>, dor-<chave do mapa de dor>, s-<estrutura>
  if (sel.startsWith('c-')) {
    abrirAba('cond');
    mostrarCondicoes(sel.slice(2));
  } else if (sel.startsWith('x-')) {
    abrirAba('ex');
    mostrarExercicios(sel.slice(2));
  } else if (sel.startsWith('dor-') && C3D_DOR[sel.slice(4)]) {
    abrirAba('exp');
    const alvo = C3D_DOR[sel.slice(4)][1];
    cena.condicao(alvo);
    const conds = R.cond.filter((c) => c.alvo.some((n) => alvo.includes(n)));
    painel.innerHTML = `<div class="card"><p class="eyebrow" style="color:var(--err)">Região da dor marcada</p><h3 class="c3d-tit">${alvo.map((n) => esc(c3dNome(n))).join(', ')}</h3>
      <p class="small" style="margin-top:6px">As estruturas em vermelho ficam na região marcada no check-in. Isso não diz qual delas está doendo. As condições abaixo são as mais comuns nessa região em quem corre.</p></div>
      ${conds.length ? `<div class="stack" style="margin-top:10px">${conds.map((x) => `<button type="button" class="list-item" data-cond="${x.id}"><div class="grow"><b>${x.t}</b></div>${I.chev}</button>`).join('')}</div>` : ''}`;
    painel.querySelectorAll('[data-cond]').forEach(
      (b) =>
        (b.onclick = () => {
          abrirAba('cond');
          mostrarCondicoes(b.dataset.cond);
        }),
    );
  } else {
    abrirAba('exp');
    mostrarEstrutura(null);
  }
}

/* ---------- cena 3D ---------- */
async function c3dCena(vp, reg, lado) {
  const tem = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  })();
  if (!tem) throw new Error('sem-webgl');
  const [{ THREE, GLTFLoader, OrbitControls, MeshoptDecoder }, buf] = await Promise.all([c3dLib(), c3dModelo(reg)]);
  const cs = getComputedStyle(document.documentElement);
  const acc = new THREE.Color((cs.getPropertyValue('--acc') || '#46d6ff').trim() || '#46d6ff');
  const vermelho = new THREE.Color('#e5484d');
  const W = () => vp.clientWidth,
    H = () => vp.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  // 1,5 de densidade já fica nítido no celular e desenha quase metade dos pontos de 2
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  vp.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a6, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 1.8);
  sol.position.set(1, 2, 3);
  scene.add(sol);
  const contra = new THREE.DirectionalLight(0xffffff, 0.7);
  contra.position.set(-2, 1, -2);
  scene.add(contra);
  const camera = new THREE.PerspectiveCamera(35, W() / H(), 0.01, 20);
  const ctr = new OrbitControls(camera, renderer.domElement);
  ctr.enableDamping = true;
  // giro mais solto e parada mais curta: responde rápido ao dedo
  ctr.dampingFactor = 0.16;
  ctr.rotateSpeed = 1.3;
  ctr.zoomSpeed = 1.4;
  ctr.enablePan = false;
  const gltf = await new Promise((ok, falha) => {
    const ld = new GLTFLoader();
    ld.setMeshoptDecoder(MeshoptDecoder);
    ld.parse(buf, '', ok, falha);
  });
  const root = gltf.scene;
  if (lado === 'e') root.scale.x = -1; // lado esquerdo: o mesmo modelo espelhado
  root.updateMatrixWorld(true);
  const COR = { osso: '#ece4d4', musculo: '#c4665b', tendao: '#e9edf2', ligamento: '#dfe6ee' };
  const malhas = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    // nome original: sobe pelos pais até achar um nó com nome (malhas repetidas vêm sem nome próprio)
    let nome = '';
    for (let x = o; x && !nome; x = x.parent) {
      const a = gltf.parser.associations.get(x);
      nome = (a && a.nodes != null && gltf.parser.json.nodes[a.nodes].name) || '';
    }
    nome = nome || o.name;
    const tipo = /ligament|capsule|meniscus|labrum|retinaculum|membrane|disc|nucleus|symphysis|aponeurosis|tract/i.test(
      nome,
    )
      ? 'ligamento'
      : /tendon/i.test(nome)
        ? 'tendao'
        : /muscle|head of|part of|adductor|abductor|flexor|extensor|fibularis|tibialis|gracilis|sartorius|soleus|plantaris|popliteus|psoas|iliacus|iliopsoas|erector|multifidus|serratus|piriformis|obturator|gemellus|quadratus|vastus|rectus|lumbrical|interossei|levator|rhomboid|latissimus|pectoralis|spinalis|longissimus|iliocostalis|intertransvers|interspinales|coracobrachialis|brachialis/i.test(
              nome,
            )
          ? 'musculo'
          : 'osso';
    // ".o/.e" no fim são as áreas de origem e inserção dos músculos: aparecem como tendão
    const t = /\.(o|e)\d*[rl]?$/.test(nome) && tipo === 'musculo' ? 'tendao' : tipo;
    o.userData.nx = nome;
    o.userData.tipo = t;
    o.material = new THREE.MeshStandardMaterial({
      color: COR[t],
      roughness: t === 'osso' ? 0.75 : 0.55,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
    });
    o.userData.base = o.material.color.clone();
    malhas.push(o);
  });
  scene.add(root);
  // o modelo não se mexe: as matrizes ficam calculadas uma vez só
  root.traverse((o) => (o.matrixAutoUpdate = false));
  // enquadra a região e define o ângulo inicial
  // enquadra pelas estruturas centrais da região (os músculos longos passam das bordas)
  const ancora = malhas.filter((m) => (C3D_REG[reg].foco || []).includes(c3dBase(m.userData.nx)));
  const caixa = new THREE.Box3();
  (ancora.length ? ancora : [root]).forEach((m) => caixa.expandByObject(m));
  // distância da câmera pela altura que a região deve ocupar na tela (alt, em metros)
  const centro = caixa.getCenter(new THREE.Vector3()),
    tam = Math.max(caixa.getSize(new THREE.Vector3()).length() * 0.9, C3D_REG[reg].alt || 0.4);
  const v = C3D_REG[reg].vista || [0, 0, 1];
  const dir = new THREE.Vector3(lado === 'e' ? -v[0] : v[0], v[1], v[2]).normalize();
  ctr.minDistance = tam * 0.3;
  ctr.maxDistance = tam * 4;
  let voo = null;
  const voar = (alvo, dist, d = dir) => {
    voo = {
      t0: performance.now(),
      de: [ctr.target.clone(), camera.position.clone()],
      para: [alvo.clone(), alvo.clone().add(d.clone().multiplyScalar(dist))],
    };
  };
  ctr.target.copy(centro);
  camera.position.copy(centro).add(dir.clone().multiplyScalar(tam * 1.75));
  ctr.update();
  // estado de destaque
  const selC = new THREE.Vector3();
  let sel = null,
    pulsar = [],
    destaque = new Set();
  const pintar = () => {
    const algum = destaque.size > 0;
    malhas.forEach((m) => {
      const on = destaque.has(m);
      m.material.color.copy(m.userData.base);
      m.material.emissive.setRGB(0, 0, 0);
      // só fica transparente o que está apagado; o resto desenha sem custo extra
      m.material.transparent = algum && !on;
      m.material.opacity = !algum || on ? 1 : 0.22;
      m.material.depthWrite = !algum || on;
      m.renderOrder = on ? 2 : 1;
      if (on && !pulsar.length) {
        m.material.color.copy(acc);
        m.material.emissive.copy(acc).multiplyScalar(0.18);
      }
    });
    sujo = true;
  };
  const focar = (lista) => {
    if (!lista.length) return;
    const b = new THREE.Box3();
    lista.forEach((m) => b.expandByObject(m));
    const c = b.getCenter(new THREE.Vector3()),
      t = Math.max(b.getSize(new THREE.Vector3()).length(), tam * 0.45);
    const d = camera.position.clone().sub(ctr.target).normalize();
    voar(c, t * 1.6, d);
  };
  const porBase = (nomes) => malhas.filter((m) => nomes.includes(c3dBase(m.userData.nx)));
  const api = {
    malhas,
    aoTocar: null,
    aoRotulo: null,
    selecionar(m) {
      sel = m || null;
      if (sel) new THREE.Box3().setFromObject(sel).getCenter(selC);
      pulsar = [];
      destaque = new Set(m ? [m] : []);
      pintar();
      if (m) focar([m]);
    },
    limpar() {
      sel = null;
      pulsar = [];
      destaque = new Set();
      pintar();
    },
    condicao(nomes) {
      const ms = porBase(nomes);
      sel = null;
      pulsar = ms;
      destaque = new Set(ms);
      pintar();
      focar(ms);
    },
    exercicio(nomes) {
      const ms = porBase(nomes).filter((m) => m.userData.tipo === 'musculo' || m.userData.tipo === 'tendao');
      sel = null;
      pulsar = [];
      destaque = new Set(ms);
      pintar();
      focar(ms);
    },
    camada(t, on) {
      malhas.forEach((m) => {
        const g = m.userData.tipo === 'ligamento' ? 'tendao' : m.userData.tipo;
        if (g === t) m.visible = on;
      });
      sujo = true;
    },
    enquadrar() {
      voar(centro, tam * 1.75, dir);
    },
  };
  // toque: seleciona a estrutura (só se o dedo quase não andou, para não brigar com o giro)
  const ray = new THREE.Raycaster(),
    pt = new THREE.Vector2();
  let ini = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (ini = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!ini || Math.hypot(e.clientX - ini[0], e.clientY - ini[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pt, camera);
    const vis = malhas.filter((m) => m.visible && (!destaque.size || destaque.has(m) || m.material.opacity > 0.5));
    const hit = ray.intersectObjects(vis.length ? vis : malhas, false)[0];
    api.selecionar(hit ? hit.object : null);
    if (api.aoTocar) api.aoTocar(hit ? hit.object : null);
  });
  // laço de desenho: só desenha quando algo muda; para sozinho quando a tela sai
  let sujo = true;
  ctr.addEventListener('change', () => (sujo = true));
  const ro = new ResizeObserver(() => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    sujo = true;
  });
  ro.observe(vp);
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const proj = new THREE.Vector3();
  const quadro = (t) => {
    if (!renderer.domElement.isConnected) {
      ro.disconnect();
      renderer.dispose();
      malhas.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      return;
    }
    requestAnimationFrame(quadro);
    if (document.hidden) return;
    if (voo) {
      const k = reduzir ? 1 : Math.min(1, (t - voo.t0) / 420),
        e = 1 - Math.pow(1 - k, 3);
      ctr.target.lerpVectors(voo.de[0], voo.para[0], e);
      camera.position.lerpVectors(voo.de[1], voo.para[1], e);
      if (k >= 1) voo = null;
      sujo = true;
    }
    if (pulsar.length) {
      const p = reduzir ? 0.6 : 0.45 + 0.35 * Math.sin(t / 380);
      pulsar.forEach((m) => {
        m.material.color.copy(vermelho);
        m.material.emissive.copy(vermelho).multiplyScalar(p * 0.6);
      });
      sujo = true;
    }
    if (ctr.update()) sujo = true;
    if (!sujo) return;
    sujo = false;
    renderer.render(scene, camera);
    if (api.aoRotulo) {
      if (sel) {
        proj.copy(selC).project(camera);
        api.aoRotulo(c3dNome(sel.userData.nx), ((proj.x + 1) / 2) * W(), ((1 - proj.y) / 2) * H());
      } else api.aoRotulo('', 0, 0);
    }
  };
  requestAnimationFrame(quadro);
  return api;
}
