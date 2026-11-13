/* Nexos App · Análise da passada por vídeo
   O aluno (ou o treinador) filma 5 a 10 segundos de corrida, de lado ou por trás. O próprio celular encontra os
   pontos do corpo em cada quadro (MediaPipe Pose, sem mandar o vídeo para fora), o app acha os apoios do pé e mede
   cadência, tíbia e joelho no contato, inclinação do tronco, oscilação vertical, queda do quadril e joelho para dentro.
   Ficam salvos só os números, alguns quadros marcados e o esqueleto de duas passadas (o vídeo não sai do celular).
   O treinador comenta em cima e o aluno vê no app.
   Referências: Souza (2016) para a análise em vídeo 2D; Heiderscheit et al. (2011) para a cadência; Bramah et al.
   (2018) para a queda do quadril; Winter (2009) para as proporções do corpo. */

/* passada:puro:inicio (contas sem tela: testadas em scripts/testes/passada.test.js) */
// índices dos pontos do MediaPipe Pose
const PS_P = {
  nariz: 0,
  ombroE: 11,
  ombroD: 12,
  quadrilE: 23,
  quadrilD: 24,
  joelhoE: 25,
  joelhoD: 26,
  tornE: 27,
  tornD: 28,
  calcE: 29,
  calcD: 30,
  pontaE: 31,
  pontaD: 32,
};
const PS_LADO = {
  E: { q: PS_P.quadrilE, j: PS_P.joelhoE, t: PS_P.tornE, c: PS_P.calcE, p: PS_P.pontaE, o: PS_P.ombroE },
  D: { q: PS_P.quadrilD, j: PS_P.joelhoD, t: PS_P.tornD, c: PS_P.calcD, p: PS_P.pontaD, o: PS_P.ombroD },
};
const psMediana = (v) => {
  const a = v.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const psPercentil = (v, p) => {
  const a = v.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const i = Math.min(a.length - 1, Math.max(0, Math.round((a.length - 1) * p)));
  return a[i];
};
const psDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// ângulo no ponto b (graus), entre os segmentos b→a e b→c
function psAng(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]],
    v2 = [c[0] - b[0], c[1] - b[1]];
  const n = Math.hypot(...v1) * Math.hypot(...v2);
  if (!n) return null;
  return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n))) * 180) / Math.PI;
}
const psMeio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
// ponto de um quadro (null se não foi encontrado ou ficou pouco visível)
const psPt = (f, i, vis = 0.3) => (f && f.p && f.p[i] && (f.p[i][2] == null || f.p[i][2] >= vis) ? f.p[i] : null);
// preenche buracos curtos (até 3 quadros) e suaviza com a mediana de 3
function psSuavizar(s) {
  const r = s.slice();
  for (let i = 0; i < r.length; i++) {
    if (r[i] != null) continue;
    let j = i;
    while (j < r.length && r[j] == null) j++;
    if (i > 0 && j < r.length && j - i <= 3)
      for (let k = i; k < j; k++) r[k] = r[i - 1] + ((r[j] - r[i - 1]) * (k - i + 1)) / (j - i + 1);
    i = j;
  }
  return r.map((x, i) => (x == null ? null : psMediana([r[i - 1], x, r[i + 1]])));
}
// lado do corpo mais visível para a câmera (filmagem de lado)
function psLadoVisivel(fr) {
  const vis = (L) =>
    psMediana(
      fr.map((f) =>
        f && f.p ? ((f.p[PS_LADO[L].q][2] ?? 1) + (f.p[PS_LADO[L].j][2] ?? 1) + (f.p[PS_LADO[L].t][2] ?? 1)) / 3 : null,
      ),
    ) || 0;
  const e = vis('E'),
    d = vis('D');
  return { lado: e >= d ? 'E' : 'D', vis: Math.max(e, d) };
}
// sentido da corrida na imagem: +1 para a direita, -1 para a esquerda (a ponta do pé aponta para onde a pessoa vai)
function psDirecao(fr) {
  const d = [];
  fr.forEach((f) =>
    ['E', 'D'].forEach((L) => {
      const c = psPt(f, PS_LADO[L].c),
        p = psPt(f, PS_LADO[L].p);
      if (c && p) d.push(p[0] - c[0]);
    }),
  );
  const m = psMediana(d);
  return m == null ? 1 : m >= 0 ? 1 : -1;
}
// comprimento da perna em pixels (quadril → joelho → tornozelo), mediana do vídeo
function psPerna(fr, L) {
  const s = PS_LADO[L];
  return psMediana(
    fr.map((f) => {
      const q = psPt(f, s.q),
        j = psPt(f, s.j),
        t = psPt(f, s.t);
      return q && j && t ? psDist(q, j) + psDist(j, t) : null;
    }),
  );
}
// comprimento da perna num quadro só (muda quando a pessoa chega mais perto da câmera)
function psPernaQuadro(f, L) {
  const s = PS_LADO[L];
  const q = psPt(f, s.q),
    j = psPt(f, s.j),
    t = psPt(f, s.t);
  return q && j && t ? psDist(q, j) + psDist(j, t) : null;
}
// apoios do pé: trechos em que o ponto mais baixo do pé (calcanhar ou ponta) fica colado no chão
function psApoios(fr, L, perna) {
  const s = PS_LADO[L];
  const baixo = psSuavizar(
    fr.map((f) => {
      const c = psPt(f, s.c, 0.2),
        p = psPt(f, s.p, 0.2);
      return c || p ? Math.max(c ? c[1] : -1e9, p ? p[1] : -1e9) : null;
    }),
  );
  if (!perna || !baixo.some((y) => y != null)) return [];
  const fps = psFps(fr) || 30;
  const jan = Math.max(6, Math.round(fps * 0.45));
  const pernaQ = psSuavizar(fr.map((f) => psPernaQuadro(f, L)));
  // chão de cada momento: reta que passa pelos pontos mais baixos do pé em cada trecho de ~1 passada
  // (na esteira fica parada; se a pessoa vem chegando perto da câmera, ela desce junto)
  const env = [];
  for (let i0 = 0; i0 < baixo.length; i0 += jan * 2) {
    let bi = -1;
    for (let k = i0; k < Math.min(baixo.length, i0 + jan * 2); k++)
      if (baixo[k] != null && (bi < 0 || baixo[k] > baixo[bi])) bi = k;
    if (bi >= 0) env.push([bi, baixo[bi]]);
  }
  // reta pelos pontos (mínimos quadrados); o chão passa pelos mais baixos, não pela média
  const reta = (pts) => {
    const mx = pts.reduce((x, e) => x + e[0], 0) / pts.length,
      my = pts.reduce((x, e) => x + e[1], 0) / pts.length;
    const sxx = pts.reduce((x, e) => x + (e[0] - mx) ** 2, 0);
    const b = sxx ? pts.reduce((x, e) => x + (e[0] - mx) * (e[1] - my), 0) / sxx : 0;
    return [Math.max(...pts.map((e) => e[1] - b * e[0])), b];
  };
  let a0 = psPercentil(baixo, 0.9),
    b0 = 0;
  if (env.length >= 3) {
    // trecho sem nenhum apoio daquele pé (pé no ar o tempo todo) não é chão: sai o ponto mais acima da reta, um por vez
    let pts = env.slice();
    for (;;) {
      [a0, b0] = reta(pts);
      if (pts.length <= 3) break;
      const res = pts.map((e) => e[1] - (a0 + b0 * e[0]));
      const pior = res.indexOf(Math.min(...res));
      if (res[pior] > -perna * 0.04) break;
      pts.splice(pior, 1);
    }
  }
  const no = baixo.map((y, i) => y != null && y >= a0 + b0 * i - Math.max(3, (pernaQ[i] || perna) * 0.035));

  // junta apoios separados por um quadro só (ruído)
  for (let i = 1; i < no.length - 1; i++) if (!no[i] && no[i - 1] && no[i + 1]) no[i] = true;
  const ap = [];
  for (let i = 0; i < no.length; i++) {
    if (!no[i]) continue;
    let j = i;
    while (j + 1 < no.length && no[j + 1]) j++;
    // apoio cortado no começo ou no fim do vídeo não entra
    if (i > 0 && j < no.length - 1 && j - i >= 1) ap.push({ ic: i, to: j, meio: Math.round((i + j) / 2) });
    i = j;
  }
  return ap;
}
// converte pixels em centímetros pela altura da pessoa (perna, do trocânter ao maléolo, ≈ 0,49 da altura: Winter)
const psCm = (px, pernaPx, alturaCm) => (pernaPx && alturaCm ? (px / pernaPx) * alturaCm * 0.49 : null);

// análise com a câmera de lado
function psAnalisarLado(fr, alturaCm) {
  const { lado, vis } = psLadoVisivel(fr);
  const dir = psDirecao(fr);
  const s = PS_LADO[lado];
  const perna = psPerna(fr, lado);
  const ap = psApoios(fr, lado, perna);
  const t = (i) => fr[i].t;
  const porApoio = ap
    .map((a) => {
      const f = fr[a.ic];
      const q = psPt(f, s.q),
        j = psPt(f, s.j),
        tn = psPt(f, s.t),
        c = psPt(f, s.c, 0.2) || tn;
      if (!q || !j || !tn) return null;
      const tibia = (Math.atan2(dir * (tn[0] - j[0]), tn[1] - j[1]) * 180) / Math.PI;
      const ang = psAng(q, j, tn);
      let jMax = null;
      for (let k = a.ic; k <= a.to; k++) {
        const fk = fr[k];
        const qk = psPt(fk, s.q),
          jk = psPt(fk, s.j),
          tk = psPt(fk, s.t);
        if (qk && jk && tk) jMax = Math.max(jMax ?? 0, 180 - psAng(qk, jk, tk));
      }
      return {
        tibia,
        joelhoIC: ang == null ? null : 180 - ang,
        joelhoMax: jMax,
        frenteCm: psCm(dir * (c[0] - q[0]), psPernaQuadro(f, lado) || perna, alturaCm),
        contatoMs: (t(a.to) - t(a.ic)) * 1000,
      };
    })
    .filter(Boolean);
  // tronco: inclinação para a frente (graus) do meio do quadril até o meio dos ombros
  const tronco = psMediana(
    fr.map((f) => {
      const qe = psPt(f, PS_P.quadrilE),
        qd = psPt(f, PS_P.quadrilD),
        oe = psPt(f, PS_P.ombroE),
        od = psPt(f, PS_P.ombroD);
      const q = qe && qd ? psMeio(qe, qd) : psPt(f, s.q),
        o = oe && od ? psMeio(oe, od) : psPt(f, s.o);
      return q && o ? (Math.atan2(dir * (o[0] - q[0]), q[1] - o[1]) * 180) / Math.PI : null;
    }),
  );
  // oscilação vertical: quanto o quadril sobe e desce em cada passada
  const yq = psSuavizar(fr.map((f) => (psPt(f, s.q) ? psPt(f, s.q)[1] : null)));
  const osc = [];
  for (let k = 0; k + 1 < ap.length; k++) {
    const i0 = ap[k].ic,
      i1 = ap[k + 1].ic;
    if (yq[i0] == null || yq[i1] == null || i1 - i0 < 3) continue;
    // tira a tendência da passada (a pessoa chegando perto ou se afastando da câmera)
    const res = [];
    for (let i = i0; i <= i1; i++)
      if (yq[i] != null) res.push(yq[i] - (yq[i0] + ((yq[i1] - yq[i0]) * (i - i0)) / (i1 - i0)));
    const pl = psMediana(fr.slice(i0, i1 + 1).map((f) => psPernaQuadro(f, lado))) || perna;
    if (res.length >= 3) osc.push(psCm(Math.max(...res) - Math.min(...res), pl, alturaCm));
  }
  // cadência pelos apoios do mesmo pé (uma passada completa = 2 passos)
  const ciclos = [];
  for (let k = 0; k + 1 < ap.length; k++) ciclos.push(t(ap[k + 1].ic) - t(ap[k].ic));
  const ciclo = psMediana(ciclos.filter((x) => x > 0.45 && x < 1.6));
  const fps = psFps(fr);
  return {
    vista: 'lado',
    lado,
    dir,
    perna,
    apoios: ap,
    fps,
    qualidade: psQualidade(fr, vis, ap.length, 'lado'),
    // cadência sem o filtro de tempo plausível (serve para perceber vídeo em câmera lenta)
    cadBruta: psMediana(ciclos) > 0 ? 120 / psMediana(ciclos) : null,
    m: {
      cadencia: ciclo ? 120 / ciclo : null,
      tibia: psMediana(porApoio.map((x) => x.tibia)),
      joelhoIC: psMediana(porApoio.map((x) => x.joelhoIC)),
      joelhoMax: psMediana(porApoio.map((x) => x.joelhoMax)),
      frente: psMediana(porApoio.map((x) => x.frenteCm)),
      tronco,
      oscilacao: psMediana(osc),
      contato: fps >= 50 ? psMediana(porApoio.map((x) => x.contatoMs)) : null,
    },
  };
}

// análise com a câmera por trás: queda do quadril, joelho para dentro e pé cruzando a linha do corpo
function psAnalisarTras(fr, alturaCm) {
  // por trás, o lado esquerdo da pessoa fica à esquerda da imagem: separa as pernas pela posição, não pelo nome
  const xs = fr.map((f) => {
    const a = psPt(f, PS_P.quadrilE),
      b = psPt(f, PS_P.quadrilD);
    return a && b ? a[0] - b[0] : null;
  });
  const troca = (psMediana(xs) ?? -1) > 0; // nome "E" à direita da imagem: inverte
  const L = (x) => (troca ? (x === 'E' ? 'D' : 'E') : x);
  const vis = psLadoVisivel(fr).vis;
  const res = { E: {}, D: {} };
  let nAp = 0;
  const pernaMed = psMediana([psPerna(fr, 'E'), psPerna(fr, 'D')]);
  ['E', 'D'].forEach((lado) => {
    const s = PS_LADO[L(lado)],
      o = PS_LADO[L(lado === 'E' ? 'D' : 'E')];
    const ap = psApoios(fr, L(lado), pernaMed);
    nAp += ap.length;
    const quedas = [],
      valgos = [],
      larg = [],
      cruza = [];
    ap.forEach((a) => {
      const f = fr[a.meio];
      const q = psPt(f, s.q),
        qo = psPt(f, o.q),
        j = psPt(f, s.j),
        t = psPt(f, s.t);
      if (!q || !qo || !t) return;
      const meio = (q[0] + qo[0]) / 2;
      // queda do quadril do outro lado (o lado sem apoio), em graus; positiva = caiu
      quedas.push((Math.atan2(qo[1] - q[1], Math.abs(qo[0] - q[0])) * 180) / Math.PI);
      // joelho para dentro: desvio do joelho em relação à linha quadril-tornozelo, positivo = em direção ao meio
      if (j) {
        const a2 = psAng(q, j, t);
        const xLinha = q[0] + ((t[0] - q[0]) * (j[1] - q[1])) / (t[1] - q[1] || 1);
        const paraMeio = Math.sign(meio - xLinha) === Math.sign(j[0] - xLinha) ? 1 : -1;
        if (a2 != null) valgos.push(paraMeio * (180 - a2));
      }
      // largura do passo: distância do tornozelo de apoio até a linha do meio do corpo
      const ladoSinal = Math.sign(q[0] - meio) || 1;
      const dx = (t[0] - meio) * ladoSinal;
      larg.push(dx);
      cruza.push(dx < 0 ? 1 : 0);
    });
    res[lado] = {
      apoios: ap.length,
      queda: psMediana(quedas),
      joelhoDentro: psMediana(valgos),
      largura: psCm(psMediana(larg), pernaMed, alturaCm),
      cruza: cruza.length ? cruza.reduce((x, y) => x + y, 0) / cruza.length : null,
    };
  });
  // tempos por lado: contato (só com 50 quadros por segundo ou mais) e tempo de passo (do toque do outro pé até o toque deste)
  const fpsT = psFps(fr);
  const apE = psApoios(fr, L('E'), pernaMed),
    apD = psApoios(fr, L('D'), pernaMed);
  const toques = apE
    .map((a) => ['E', a.ic])
    .concat(apD.map((a) => ['D', a.ic]))
    .sort((x, y) => x[1] - y[1]);
  const passos = { E: [], D: [] },
    brutos = [];
  for (let k = 1; k < toques.length; k++)
    if (toques[k][0] !== toques[k - 1][0]) {
      const dt = fr[toques[k][1]].t - fr[toques[k - 1][1]].t;
      if (dt > 0) brutos.push(dt);
      if (dt > 0.2 && dt < 0.8) passos[toques[k][0]].push(dt * 1000);
    }
  [
    ['E', apE],
    ['D', apD],
  ].forEach(([lado, ap]) => {
    res[lado].passo = psMediana(passos[lado]);
    res[lado].contato = fpsT >= 50 ? psMediana(ap.map((a) => (fr[a.to].t - fr[a.ic].t) * 1000)) : null;
  });
  const max = (k) => {
    const v = [res.E[k], res.D[k]].filter((x) => x != null);
    return v.length ? Math.max(...v) : null;
  };
  return {
    vista: 'tras',
    troca,
    cadBruta: psMediana(brutos) > 0 ? 60 / psMediana(brutos) : null,
    apoiosE: apE,
    apoiosD: apD,
    perna: pernaMed,
    fps: psFps(fr),
    qualidade: psQualidade(fr, vis, nAp, 'tras'),
    lados: res,
    m: {
      queda: max('queda'),
      joelhoDentro: max('joelhoDentro'),
      cruza: max('cruza'),
      largura: psMediana([res.E.largura, res.D.largura]),
    },
  };
}
// quadros por segundo de fato analisados
function psFps(fr) {
  const d = [];
  for (let i = 1; i < fr.length; i++) d.push(fr[i].t - fr[i - 1].t);
  const m = psMediana(d.filter((x) => x > 0));
  return m ? Math.round(1 / m) : 0;
}
// o vídeo serve? (pessoa encontrada na maioria dos quadros, apoios suficientes e câmera no ângulo pedido)
function psQualidade(fr, vis, nApoios, vista) {
  const com = fr.filter((f) => f && f.p).length;
  const det = fr.length ? com / fr.length : 0;
  // largura do quadril em relação à perna: de lado fica pequena, por trás fica grande
  const razao = psMediana(
    fr.map((f) => {
      const a = psPt(f, PS_P.quadrilE),
        b = psPt(f, PS_P.quadrilD),
        j = psPt(f, PS_P.joelhoE),
        t = psPt(f, PS_P.tornE);
      return a && b && j && t ? Math.abs(a[0] - b[0]) / (psDist(a, j) + psDist(j, t) || 1) : null;
    }),
  );
  const avisos = [];
  if (det < 0.6) avisos.push('pouca_deteccao');
  if (nApoios < (vista === 'lado' ? 3 : 4)) avisos.push('poucos_passos');
  if (vis < 0.5) avisos.push('pouco_visivel');
  const pq = fr.map((f) => psPernaQuadro(f, psLadoVisivel(fr).lado));
  const p10 = psPercentil(pq, 0.1),
    p90 = psPercentil(pq, 0.9);
  if (p10 && p90 / p10 > 1.3) avisos.push('distancia_muda');
  if (razao != null && vista === 'lado' && razao > 0.22) avisos.push('nao_parece_lado');
  if (razao != null && vista === 'tras' && razao < 0.12) avisos.push('nao_parece_tras');
  return {
    deteccao: det,
    vis,
    apoios: nApoios,
    razao,
    avisos,
    ok: !avisos.some((a) => a !== 'pouco_visivel' && a !== 'distancia_muda'),
  };
}

// faixas de referência (gerais, para orientar a conversa; quem interpreta é o treinador)
const PS_REF = {
  cadencia: { un: 'passos/min', ok: (v) => v >= 170, at: (v) => v >= 160 },
  tibia: { un: '°', ok: (v) => v >= -6 && v <= 8, at: (v) => v >= -12 && v <= 14 },
  joelhoIC: { un: '°', ok: (v) => v >= 10 && v <= 28, at: (v) => v >= 6 && v <= 34 },
  joelhoMax: { un: '°', ok: (v) => v >= 35 && v <= 55, at: (v) => v >= 28 && v <= 62 },
  frente: { un: 'cm', ok: (v) => v <= 12, at: (v) => v <= 20 },
  tronco: { un: '°', ok: (v) => v >= 3 && v <= 12, at: (v) => v >= 0 && v <= 18 },
  oscilacao: { un: 'cm', ok: (v) => v <= 10, at: (v) => v <= 12 },
  contato: { un: 'ms', info: true },
  queda: { un: '°', ok: (v) => v < 5, at: (v) => v <= 8 },
  joelhoDentro: { un: '°', ok: (v) => v < 8, at: (v) => v <= 15 },
  cruza: { un: '%', ok: (v) => v < 0.2, at: (v) => v < 0.5 },
  largura: { un: 'cm', info: true },
};
function psNivel(k, v) {
  const r = PS_REF[k];
  if (!r || v == null || !isFinite(v)) return null;
  if (r.info) return 'info';
  return r.ok(v) ? 'ok' : r.at(v) ? 'atencao' : 'fora';
}

// medidas de um quadro só, a partir dos pontos (usadas quando o treinador confere e corrige os pontos)
// P: { índice do MediaPipe: [x, y] }; an: { vista, lado, dir, troca, altura }
function psMedidasQuadro(tipo, P, an) {
  const g = (i) => (P && P[i] ? P[i] : null);
  const r = {};
  if (an.vista === 'lado') {
    const s = PS_LADO[an.lado];
    const q = g(s.q),
      j = g(s.j),
      t = g(s.t),
      c = g(s.c) || t,
      o = g(s.o);
    if (tipo === 'contato') {
      if (j && t) r.tibia = (Math.atan2(an.dir * (t[0] - j[0]), t[1] - j[1]) * 180) / Math.PI;
      if (q && j && t) {
        r.joelhoIC = 180 - psAng(q, j, t);
        const pl = psDist(q, j) + psDist(j, t);
        if (c) r.frente = psCm(an.dir * (c[0] - q[0]), pl, an.altura);
      }
    } else {
      if (q && j && t) r.joelhoMax = 180 - psAng(q, j, t);
      if (q && o) r.tronco = (Math.atan2(an.dir * (o[0] - q[0]), q[1] - o[1]) * 180) / Math.PI;
    }
  } else {
    // tipo 'E' ou 'D': pé de apoio neste quadro (lado da imagem, que por trás é o lado do corpo)
    const s = PS_LADO[an.troca ? (tipo === 'E' ? 'D' : 'E') : tipo],
      o = PS_LADO[an.troca ? tipo : tipo === 'E' ? 'D' : 'E'];
    const q = g(s.q),
      qo = g(o.q),
      j = g(s.j),
      t = g(s.t);
    if (q && qo) r.queda = (Math.atan2(qo[1] - q[1], Math.abs(qo[0] - q[0])) * 180) / Math.PI;
    if (q && qo && j && t) {
      const meio = (q[0] + qo[0]) / 2;
      const a2 = psAng(q, j, t);
      const xLinha = q[0] + ((t[0] - q[0]) * (j[1] - q[1])) / (t[1] - q[1] || 1);
      const paraMeio = Math.sign(meio - xLinha) === Math.sign(j[0] - xLinha) ? 1 : -1;
      if (a2 != null) r.joelhoDentro = paraMeio * (180 - a2);
    }
  }
  return r;
}
// medidas finais: as automáticas, trocadas pelas que o treinador conferiu
// por trás, a queda e o joelho para dentro ficam com o pior dos dois lados
function psFinais(x) {
  const ex = x.extra || {},
    aj = ex.ajustes || {};
  const m = { ...(x.metricas || {}) };
  const conf = new Set();
  const lados = JSON.parse(JSON.stringify(ex.lados || {}));
  Object.entries(aj).forEach(([k, a]) => {
    if (!a || a.valor == null || !isFinite(a.valor)) return;
    if (k.includes('.')) {
      const [L, kk] = k.split('.');
      lados[L] = lados[L] || {};
      lados[L][kk] = a.valor;
      conf.add(k);
    } else {
      m[k] = a.valor;
      conf.add(k);
    }
  });
  if (x.vista === 'tras' && (lados.E || lados.D))
    ['queda', 'joelhoDentro'].forEach((k) => {
      const v = [lados.E && lados.E[k], lados.D && lados.D[k]].filter((y) => y != null && isFinite(y));
      if (v.length) m[k] = Math.max(...v);
      if (conf.has('E.' + k) || conf.has('D.' + k)) conf.add(k);
    });
  return { m, lados, conf };
}
// diferença entre os lados: em graus para ângulos, em % para tempos
function psAssimetria(k, a, b) {
  if (a == null || b == null || !isFinite(a) || !isFinite(b)) return null;
  if (k === 'contato' || k === 'passo') {
    const med = (a + b) / 2;
    return med ? { valor: (Math.abs(a - b) / med) * 100, un: '%', alto: (Math.abs(a - b) / med) * 100 > 10 } : null;
  }
  if (k === 'cruza') return { valor: Math.abs(a - b) * 100, un: '%', alto: Math.abs(a - b) > 0.3 };
  return {
    valor: Math.abs(a - b),
    un: k === 'largura' ? 'cm' : '°',
    alto: Math.abs(a - b) > (k === 'largura' ? 3 : 4),
  };
}
// faixa comum de cada medida (a mesma das cores) e a menor diferença que vale como mudança (abaixo disso pode ser erro da medida)
const PS_FAIXA = {
  cadencia: [170, Infinity],
  tibia: [-6, 8],
  joelhoIC: [10, 28],
  joelhoMax: [35, 55],
  frente: [-Infinity, 12],
  tronco: [3, 12],
  oscilacao: [-Infinity, 10],
  queda: [-Infinity, 5],
  joelhoDentro: [-Infinity, 8],
  cruza: [-Infinity, 0.2],
};
const PS_MUDA = {
  cadencia: 3,
  tibia: 3,
  joelhoIC: 3,
  joelhoMax: 3,
  frente: 2,
  tronco: 2,
  oscilacao: 1,
  contato: 15,
  queda: 2,
  joelhoDentro: 3,
  cruza: 0.1,
  largura: 2,
};
// antes e depois de uma medida: melhorou (chegou mais perto da faixa comum), piorou, igual ou mudou (sem faixa)
function psCompara(k, antes, depois) {
  if (antes == null || depois == null || !isFinite(antes) || !isFinite(depois)) return null;
  const d = depois - antes;
  if (Math.abs(d) < (PS_MUDA[k] ?? 0)) return { d, efeito: 'igual' };
  const f = PS_FAIXA[k];
  if (!f) return { d, efeito: 'mudou' };
  const fora = (v) => (v < f[0] ? f[0] - v : v > f[1] ? v - f[1] : 0);
  const a = fora(antes),
    b = fora(depois);
  if (a === b) return { d, efeito: 'mudou' };
  return { d, efeito: b < a ? 'melhorou' : 'piorou' };
}
// vídeo em câmera lenta salvo como normal: a cadência sai baixa demais; acha o fator que deixa a cadência plausível
function psSugereFator(cadencia) {
  if (cadencia == null || !isFinite(cadencia) || cadencia >= 110) return 1;
  for (const f of [2, 4, 8]) if (cadencia * f >= 140 && cadencia * f <= 230) return f;
  return 1;
}
// ritmo: km/h a partir do pace (min:seg por km) e o contrário
function psRitmoKmh(txt) {
  const t = String(txt || '')
    .trim()
    .replace(',', '.');
  if (!t) return null;
  const m = t.match(/^(\d{1,2})[:'h.](\d{1,2})$/);
  if (m && t.includes(':')) {
    const s = +m[1] * 60 + +m[2];
    return s >= 150 && s <= 1200 ? 3600 / s : null;
  }
  const v = +t;
  return v >= 3 && v <= 30 ? v : null;
}
const psPaceTxt = (kmh) => {
  if (!kmh) return '';
  const s = Math.round(3600 / kmh);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`;
};
/* passada:puro:fim */

const PS_TITULO = {
  cadencia: 'Cadência',
  tibia: 'Tíbia no contato',
  joelhoIC: 'Joelho no contato',
  joelhoMax: 'Joelho no apoio',
  frente: 'Pé à frente do quadril',
  tronco: 'Inclinação do tronco',
  oscilacao: 'Sobe e desce',
  contato: 'Tempo de contato',
  queda: 'Queda do quadril',
  joelhoDentro: 'Joelho para dentro',
  cruza: 'Pé cruzando a linha',
  largura: 'Largura do passo',
};
const PS_EXPLICA = {
  cadencia: {
    ok: 'Passos curtos e rápidos, o que costuma diminuir o impacto em cada apoio.',
    atencao: 'Um pouco baixa. Subir 5% a 10% (passos mais curtos e rápidos) reduz a carga no joelho e no quadril.',
    fora: 'Baixa. Passos mais curtos e rápidos, subindo aos poucos, reduzem a carga no joelho e no quadril.',
    sobre:
      'Quantos passos por minuto. Muda com o ritmo e a altura, então compare sempre no mesmo ritmo. Aumentar 5% a 10% reduz a carga no joelho e no quadril (Heiderscheit, 2011).',
  },
  tibia: {
    ok: 'A canela chega perto da vertical: o pé toca o chão embaixo do corpo.',
    atencao: 'A canela chega um pouco inclinada para a frente, sinal de passada um pouco longa.',
    fora: 'A canela chega bem inclinada: o pé toca o chão longe do corpo, o que freia e aumenta o impacto.',
    sobre: 'Ângulo da canela com a vertical no toque do pé. Perto da vertical é o que se busca (Souza, 2016).',
  },
  joelhoIC: {
    ok: 'O joelho chega levemente dobrado, ajudando a amortecer.',
    atencao: 'O joelho chega mais esticado ou mais dobrado do que o comum.',
    fora: 'O joelho chega bem fora do comum no toque do pé.',
    sobre: 'Quanto o joelho está dobrado no toque do pé. Joelho esticado demais costuma vir junto da passada longa.',
  },
  joelhoMax: {
    ok: 'O joelho dobra o suficiente para absorver o impacto.',
    atencao: 'O joelho dobra um pouco menos ou um pouco mais que o comum no apoio.',
    fora: 'A flexão do joelho no apoio está fora do comum.',
    sobre: 'Quanto o joelho dobra no meio do apoio, quando o corpo passa por cima do pé.',
  },
  frente: {
    ok: 'O pé toca o chão perto da linha do quadril.',
    atencao: 'O pé toca o chão um pouco à frente do quadril.',
    fora: 'O pé toca o chão bem à frente do quadril: passada longa.',
    sobre: 'Distância entre o calcanhar e o quadril no toque. Valor aproximado, calculado pela sua altura.',
  },
  tronco: {
    ok: 'Tronco levemente inclinado para a frente, como deve ser.',
    atencao: 'Tronco reto demais ou inclinado demais.',
    fora: 'Inclinação do tronco bem fora do comum.',
    sobre: 'Inclinação do tronco para a frente. Uma inclinação leve, a partir do tornozelo, é o comum.',
  },
  oscilacao: {
    ok: 'O corpo sobe e desce pouco: a energia vai para a frente.',
    atencao: 'O corpo sobe e desce um pouco mais que o comum.',
    fora: 'O corpo sobe e desce bastante a cada passo.',
    sobre: 'Quanto o quadril sobe e desce em cada passada. Valor aproximado, calculado pela sua altura.',
  },
  contato: {
    info: 'Tempo que o pé fica no chão em cada passo. Cai quando o ritmo aumenta.',
    sobre: 'Só aparece quando o vídeo tem 60 quadros por segundo ou mais.',
  },
  queda: {
    ok: 'O quadril fica estável quando um pé está no chão.',
    atencao: 'O quadril do lado sem apoio cai um pouco. Fortalecer o glúteo médio ajuda.',
    fora: 'O quadril do lado sem apoio cai bastante. Vale trabalhar o glúteo médio com o treino de força.',
    sobre:
      'Quanto o quadril do lado sem apoio cai no meio do apoio. Corredores com dor costumam mostrar mais queda (Bramah, 2018).',
  },
  joelhoDentro: {
    ok: 'O joelho fica alinhado com o quadril e o pé.',
    atencao: 'O joelho vai um pouco para dentro no apoio.',
    fora: 'O joelho vai bem para dentro no apoio.',
    sobre: 'Desvio do joelho para dentro em relação à linha do quadril até o pé, no meio do apoio.',
  },
  cruza: {
    ok: 'Os pés pisam cada um do seu lado.',
    atencao: 'Em alguns passos, o pé cruza a linha do meio do corpo.',
    fora: 'O pé cruza a linha do meio do corpo na maioria dos passos.',
    sobre: 'Quantos passos pisam do outro lado da linha do meio do corpo, como se corresse numa corda.',
  },
  largura: {
    info: 'Distância média do pé até a linha do meio do corpo.',
    sobre: 'Valor aproximado, calculado pela sua altura.',
  },
};
const PS_ORDEM = {
  lado: ['cadencia', 'tibia', 'frente', 'joelhoIC', 'joelhoMax', 'tronco', 'oscilacao', 'contato'],
  tras: ['queda', 'joelhoDentro', 'cruza', 'largura'],
};
const PS_MODELO_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
const PS_UP_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
const PS_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4" r="1.8"/><path d="M13 7.5 10.5 13l3 3-1.5 5"/><path d="m10.5 13-3.5 2-2-1"/><path d="M13 7.5 16 11l3-.5"/><path d="M3 21h18" stroke-dasharray="2 3"/></svg>';

const psFmt = (k, v) => {
  if (v == null || !isFinite(v)) return '–';
  if (k === 'cruza') return Math.round(v * 100) + '%';
  if (k === 'cadencia' || k === 'contato') return String(Math.round(v));
  return f1(v, Math.abs(v) >= 10 ? 0 : 1);
};
const psUn = (k) => (k === 'cruza' ? '' : PS_REF[k].un);

/* ---------- motor: carrega o MediaPipe só nesta tela ---------- */
// o modelo (≈ 9 MB) fica guardado no aparelho depois da primeira vez; prog(fração) mostra o download
async function psModelo(prog) {
  let cache = null;
  try {
    cache = await caches.open('nx-modelos-v1');
    const r = await cache.match(PS_MODELO_URL);
    if (r) return new Uint8Array(await r.arrayBuffer());
  } catch {}
  const r = await fetch(PS_MODELO_URL);
  if (!r.ok) throw new Error('modelo ' + r.status);
  const total = +r.headers.get('content-length') || 9.4e6;
  const leitor = r.body.getReader();
  const partes = [];
  let n = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    partes.push(value);
    n += value.length;
    if (prog) prog(Math.min(1, n / total));
  }
  const buf = new Uint8Array(n);
  let o = 0;
  partes.forEach((pt) => {
    buf.set(pt, o);
    o += pt.length;
  });
  try {
    if (cache)
      await cache.put(PS_MODELO_URL, new Response(buf, { headers: { 'content-type': 'application/octet-stream' } }));
  } catch {}
  return buf;
}
let _psMotor = null;
async function psMotor(prog) {
  if (_psMotor) return _psMotor;
  _psMotor = (async () => {
    const [mp, modelo] = await Promise.all([import('/app/vendor/mediapipe/vision_bundle.mjs'), psModelo(prog)]);
    const files = await mp.FilesetResolver.forVisionTasks('/app/vendor/mediapipe/wasm');
    const opc = (delegate) => ({
      baseOptions: { modelAssetBuffer: modelo, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try {
      return await mp.PoseLandmarker.createFromOptions(files, opc('GPU'));
    } catch {
      return await mp.PoseLandmarker.createFromOptions(files, opc('CPU'));
    }
  })();
  _psMotor.catch(() => (_psMotor = null));
  return _psMotor;
}
// quadros por segundo do vídeo, medindo alguns quadros tocando (sem som)
async function psFpsVideo(v) {
  if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return 30;
  const ts = [];
  await new Promise((ok) => {
    let n = 0;
    const fim = setTimeout(ok, 1500);
    const cb = (_, meta) => {
      ts.push(meta.mediaTime);
      if (++n < 14) v.requestVideoFrameCallback(cb);
      else {
        clearTimeout(fim);
        ok();
      }
    };
    v.requestVideoFrameCallback(cb);
    v.play().catch(ok);
  });
  v.pause();
  const d = [];
  for (let i = 1; i < ts.length; i++) if (ts[i] > ts[i - 1]) d.push(ts[i] - ts[i - 1]);
  const m = psMediana(d);
  const f = m ? 1 / m : 30;
  return f > 180 ? 240 : f > 90 ? 120 : f > 50 ? 60 : 30;
}
const psBuscar = (v, t) =>
  new Promise((ok) => {
    const fim = () => {
      v.removeEventListener('seeked', fim);
      ok();
    };
    v.addEventListener('seeked', fim);
    v.currentTime = t;
  });
// passa o vídeo quadro a quadro e guarda os pontos do corpo (em pixels do vídeo)
// fator: vídeo em câmera lenta salvo para tocar devagar (4 = gravado a 120 e tocando a 30). t = tempo real, tv = tempo no vídeo
async function psProcessar(v, ini, fim, prog, fator = 1) {
  const motor = await psMotor();
  const fpsV = await psFpsVideo(v);
  // vídeo de 120 quadros tocando em tempo real: usa até 120 por segundo, num trecho mais curto
  const fpsUso = fator > 1 ? Math.min(60, fpsV) : Math.min(120, fpsV);
  if (fator === 1 && fpsUso > 60) fim = Math.min(fim, ini + 5);
  const fps = fpsUso * fator;
  const passo = 1 / fpsUso;
  const W = v.videoWidth,
    H = v.videoHeight;
  const fr = [];
  let ts = Math.floor(performance.now());
  for (let t = ini; t <= fim; t += passo) {
    await psBuscar(v, t);
    ts = Math.max(ts + 1, Math.floor(performance.now()));
    let p = null;
    try {
      const r = motor.detectForVideo(v, ts);
      const lm = r && r.landmarks && r.landmarks[0];
      if (lm) p = lm.map((q) => [q.x * W, q.y * H, q.visibility ?? 1]);
    } catch {}
    fr.push({ t: +((t - ini) / fator).toFixed(5), tv: +t.toFixed(4), p });
    if (prog) prog((t - ini) / (fim - ini || 1), p, W, H);
  }
  return { fr, W, H, fps };
}

/* ---------- desenho dos quadros marcados ---------- */
const PS_LIG = [
  ['ombroE', 'ombroD'],
  ['quadrilE', 'quadrilD'],
  ['ombroE', 'quadrilE'],
  ['ombroD', 'quadrilD'],
  ['quadrilE', 'joelhoE'],
  ['joelhoE', 'tornE'],
  ['tornE', 'calcE'],
  ['calcE', 'pontaE'],
  ['tornE', 'pontaE'],
  ['quadrilD', 'joelhoD'],
  ['joelhoD', 'tornD'],
  ['tornD', 'calcD'],
  ['calcD', 'pontaD'],
  ['tornD', 'pontaD'],
];
function psEsqueleto(ctx, p, sc, perto) {
  const pt = (n) => (p[PS_P[n]] ? [p[PS_P[n]][0] * sc, p[PS_P[n]][1] * sc] : null);
  const ehPerto = (n) => !perto || n.endsWith(perto) || n.startsWith('ombro') || n.startsWith('quadril');
  ctx.lineCap = 'round';
  PS_LIG.forEach(([a, b]) => {
    const A = pt(a),
      B = pt(b);
    if (!A || !B) return;
    const forte = ehPerto(a) && ehPerto(b);
    ctx.strokeStyle = forte ? '#46d6ff' : 'rgba(255,255,255,.55)';
    ctx.lineWidth = forte ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(...A);
    ctx.lineTo(...B);
    ctx.stroke();
  });
  Object.keys(PS_P).forEach((n) => {
    if (n === 'nariz') return;
    const A = pt(n);
    if (!A) return;
    ctx.fillStyle = ehPerto(n) ? '#fff' : 'rgba(255,255,255,.6)';
    ctx.beginPath();
    ctx.arc(A[0], A[1], ehPerto(n) ? 6 : 4, 0, 7);
    ctx.fill();
  });
}
function psEtiqueta(ctx, x, y, txt, cor = '#46d6ff') {
  ctx.font = "700 26px 'Manrope', system-ui, sans-serif";
  const w = ctx.measureText(txt).width + 24;
  x = Math.max(8, Math.min(ctx.canvas.width - w - 8, x));
  y = Math.max(8, Math.min(ctx.canvas.height - 48, y));
  ctx.fillStyle = 'rgba(4,10,24,.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 40, 12);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.fillRect(x, y + 8, 4, 24);
  ctx.fillStyle = '#fff';
  ctx.fillText(txt, x + 14, y + 28);
}
function psLinha(ctx, a, b, cor, larg = 3, trac = null) {
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = larg;
  if (trac) ctx.setLineDash(trac);
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
  ctx.restore();
}
// desenha um quadro do vídeo com o esqueleto e as medidas daquele momento
async function psQuadro(v, f, tipo, an) {
  await psBuscar(v, f.tv ?? f.t);
  return psDesenhaQuadro(v, 0, 0, v.videoWidth, v.videoHeight, f.p, tipo, an);
}
// src: vídeo ou imagem; (sx, sy, sw, sh): pedaço usado; p: pontos nas coordenadas desse pedaço
function psDesenhaQuadro(src, sx, sy, sw, sh, p, tipo, an) {
  const W = 720,
    sc = W / sw,
    H = Math.round(sh * sc);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
  ctx.fillStyle = 'rgba(4,10,24,.18)';
  ctx.fillRect(0, 0, W, H);
  if (!p) return cv;
  const P = (i) => (p[i] ? [p[i][0] * sc, p[i][1] * sc] : null);
  if (an.vista === 'lado') {
    const s = PS_LADO[an.lado];
    psEsqueleto(ctx, p, sc, an.lado);
    const q = P(s.q),
      j = P(s.j),
      t = P(s.t),
      c = P(s.c) || t;
    if (tipo === 'contato' && j && t) {
      const L = psDist(j, t);
      psLinha(ctx, j, [j[0], j[1] + L * 1.1], 'rgba(255,255,255,.8)', 3, [8, 8]);
      psLinha(ctx, j, [j[0] + (t[0] - j[0]) * 1.15, j[1] + (t[1] - j[1]) * 1.15], '#ffd166', 5);
      const ang = (Math.atan2(an.dir * (t[0] - j[0]), t[1] - j[1]) * 180) / Math.PI;
      psEtiqueta(ctx, j[0] + 18, j[1] - 10, `Tíbia ${f1(ang, 0)}°`, '#ffd166');
      if (q && c) {
        const y = c[1] + 26;
        psLinha(ctx, [q[0], q[1]], [q[0], y], 'rgba(255,255,255,.8)', 2, [6, 6]);
        psLinha(ctx, [q[0], y], [c[0], y], '#46d6ff', 4);
        const cm = psCm(an.dir * (c[0] - q[0]), j && t ? psDist(q, j) + psDist(j, t) : an.perna * sc, an.altura);
        if (cm != null)
          psEtiqueta(
            ctx,
            Math.min(q[0], c[0]),
            y + 12,
            cm >= 0 ? `Pé ${f1(cm, 0)} cm à frente` : `Pé ${f1(-cm, 0)} cm atrás`,
          );
      }
      if (q && j && t) psEtiqueta(ctx, j[0] - 230, j[1] - 60, `Joelho ${f1(180 - psAng(q, j, t), 0)}°`);
    }
    if (tipo === 'apoio') {
      const oe = P(PS_P.ombroE),
        od = P(PS_P.ombroD),
        qe = P(PS_P.quadrilE),
        qd = P(PS_P.quadrilD);
      const qq = qe && qd ? psMeio(qe, qd) : q,
        oo = oe && od ? psMeio(oe, od) : P(s.o);
      if (qq && oo) {
        const L = psDist(qq, oo);
        psLinha(ctx, qq, [qq[0], qq[1] - L * 1.15], 'rgba(255,255,255,.8)', 3, [8, 8]);
        psLinha(ctx, qq, [qq[0] + (oo[0] - qq[0]) * 1.15, qq[1] + (oo[1] - qq[1]) * 1.15], '#ffd166', 5);
        const ang = (Math.atan2(an.dir * (oo[0] - qq[0]), qq[1] - oo[1]) * 180) / Math.PI;
        psEtiqueta(ctx, oo[0] + 20, oo[1] - 20, `Tronco ${f1(ang, 0)}°`, '#ffd166');
      }
      if (q && j && t) psEtiqueta(ctx, j[0] + 20, j[1] + 10, `Joelho ${f1(180 - psAng(q, j, t), 0)}°`);
    }
  } else {
    psEsqueleto(ctx, p, sc, null);
    const ap = tipo; // 'E' ou 'D': pé de apoio neste quadro (já trocado para a posição na imagem)
    const s = PS_LADO[an.troca ? (ap === 'E' ? 'D' : 'E') : ap],
      o = PS_LADO[an.troca ? ap : ap === 'E' ? 'D' : 'E'];
    const q = P(s.q),
      qo = P(o.q),
      j = P(s.j),
      t = P(s.t);
    if (q && qo) {
      psLinha(ctx, [q[0] - 40, q[1]], [qo[0] + (qo[0] - q[0]) * 0.3, q[1]], 'rgba(255,255,255,.8)', 3, [8, 8]);
      psLinha(ctx, q, qo, '#ffd166', 5);
      const queda = (Math.atan2(qo[1] - q[1], Math.abs(qo[0] - q[0])) * 180) / Math.PI;
      psEtiqueta(ctx, (q[0] + qo[0]) / 2 - 90, Math.min(q[1], qo[1]) - 60, `Quadril ${f1(queda, 0)}°`, '#ffd166');
      const meio = (q[0] + qo[0]) / 2;
      psLinha(ctx, [meio, q[1]], [meio, H], 'rgba(70,214,255,.6)', 2, [6, 8]);
    }
    if (q && j && t) {
      psLinha(ctx, q, t, 'rgba(255,255,255,.6)', 2, [6, 6]);
      psEtiqueta(ctx, j[0] + (j[0] < W / 2 ? -200 : 20), j[1] - 20, `Joelho ${f1(180 - psAng(q, j, t), 0)}°`);
    }
  }
  return cv;
}
// esqueleto de duas passadas para o replay (pontos arredondados, até 30 quadros por segundo)
function psSerie(fr, an) {
  const ap = an.vista === 'lado' ? an.apoios : (an.apoiosE || []).concat(an.apoiosD || []).sort((a, b) => a.ic - b.ic);
  let i0 = 0,
    i1 = Math.min(fr.length - 1, 90);
  if (ap.length >= 3) {
    i0 = Math.max(0, ap[0].ic - 2);
    i1 = Math.min(fr.length - 1, ap[Math.min(ap.length - 1, 2)].ic + 2);
  }
  const passo = Math.max(1, Math.round((an.fps || 30) / 30));
  const ids = Object.values(PS_P);
  const q = [];
  for (let i = i0; i <= i1; i += passo) {
    const f = fr[i];
    q.push(f.p ? ids.map((k) => (f.p[k] ? [Math.round(f.p[k][0]), Math.round(f.p[k][1])] : null)) : null);
  }
  return { ids, q, fps: Math.round((an.fps || 30) / passo) };
}

/* ---------- dados ---------- */
async function psAltura(alunoId) {
  try {
    const { data } = await sb
      .from('nx_avaliacoes')
      .select('altura')
      .eq('aluno_id', alunoId)
      .not('altura', 'is', null)
      .order('data', { ascending: false })
      .limit(1);
    if (data && data[0] && num(data[0].altura)) return Math.round(num(data[0].altura));
  } catch {}
  try {
    const { data } = await sb
      .from('nx_anamneses')
      .select('respostas')
      .eq('aluno_id', alunoId)
      .order('criado_em', { ascending: false })
      .limit(1);
    const a = data && data[0] && data[0].respostas && num(String(data[0].respostas.altura || '').replace(',', '.'));
    if (a) return Math.round(a < 3 ? a * 100 : a);
  } catch {}
  return null;
}
const psListar = (alunoId) =>
  sb
    .from('nx_passadas')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('criado_em', { ascending: false })
    .limit(40)
    .then(
      (r) => r.data || [],
      () => [],
    );
async function psUrls(lista) {
  const caminhos = lista.flatMap((x) => (x.quadros || []).map((q) => q.path)).filter(Boolean);
  if (!caminhos.length) return {};
  try {
    const { data } = await sb.storage.from('nx-fotos').createSignedUrls(caminhos, 3600);
    const m = {};
    (data || []).forEach((u) => u.signedUrl && (m[u.path] = u.signedUrl));
    return m;
  } catch {
    return {};
  }
}

/* ---------- textos ---------- */
const PS_DICAS = {
  lado: [
    'Celular deitado ou em pé, parado, na altura do quadril (apoie numa mesa, banco ou tripé).',
    'Uns 3 metros de distância, filmando de lado, com o corpo inteiro na imagem, da cabeça aos pés.',
    'Na esteira é o ideal. Na rua, corra passando em frente ao celular, em linha reta.',
    'Corra no seu ritmo leve por pelo menos 10 segundos. Se o celular tiver câmera lenta (60 ou 120 quadros), use.',
    'Roupa justa ajuda, e o lugar bem iluminado também. Evite outras pessoas passando na imagem.',
  ],
  tras: [
    'Celular parado, na altura do quadril, atrás de você, a uns 2 a 3 metros.',
    'Na esteira é o ideal: o celular fica no chão ou num banco, atrás da esteira.',
    'Corpo inteiro na imagem, da cabeça aos pés, com a câmera bem no meio das suas costas.',
    'Corra no ritmo leve por pelo menos 10 segundos. Roupa justa e lugar bem iluminado ajudam.',
  ],
};
const PS_AVISO_TXT = {
  pouca_deteccao: 'O corpo não foi encontrado em boa parte do vídeo. Veja se ele aparece inteiro e bem iluminado.',
  poucos_passos: 'Poucos apoios do pé no trecho escolhido. Grave mais tempo correndo ou escolha outro trecho.',
  pouco_visivel: 'Algumas partes do corpo ficaram pouco visíveis. Roupa justa e mais luz ajudam.',
  distancia_muda:
    'Você chegou mais perto ou se afastou da câmera durante o trecho. O app compensa, mas fica mais certo correndo de lado, na mesma distância (na esteira é o ideal).',
  nao_parece_lado:
    'Pelo jeito do vídeo, a câmera não está bem de lado. Grave de perfil para as medidas ficarem certas.',
  nao_parece_tras:
    'Pelo jeito do vídeo, a câmera não está bem atrás. Grave pelas costas para as medidas ficarem certas.',
  camera_lenta_detectada:
    'O vídeo parecia estar em câmera lenta e o app ajustou o tempo sozinho. Se não era câmera lenta, refaça marcando Normal em Velocidade do vídeo.',
};
// sugestão de comentário para o treinador, a partir das medidas (já com as conferidas)
function psSugestao(x, nome) {
  const { m, lados } = psFinais(x);
  const n = firstName(nome || '');
  const lista = PS_ORDEM[x.vista] || [];
  const fora = lista.filter((k) => ['atencao', 'fora'].includes(psNivel(k, m[k])));
  const ok = lista.filter((k) => psNivel(k, m[k]) === 'ok').map((k) => PS_TITULO[k].toLowerCase());
  const junta = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0]);
  const partes = [
    `${n ? n + ', ' : ''}analisei o vídeo da sua corrida ${x.vista === 'lado' ? 'de lado' : 'por trás'}.`,
  ];
  if (ok.length) partes.push(`Gostei do que vi em ${junta(ok)}.`);
  if (fora.includes('cadencia') || fora.includes('tibia') || fora.includes('frente'))
    partes.push(
      `O principal ajuste é na passada${m.cadencia ? `, que está com ${Math.round(m.cadencia)} passos por minuto` : ''}. Vamos encurtar um pouco o passo e deixar o pé tocar o chão mais embaixo do corpo, subindo a cadência uns 5% aos poucos. Isso diminui o impacto no joelho e no quadril.`,
    );
  if (fora.includes('tronco'))
    partes.push('Vale cuidar da postura, com o corpo levemente inclinado para a frente a partir do tornozelo.');
  if (fora.includes('oscilacao'))
    partes.push('Você sobe e desce bastante a cada passo. Pense em levar o corpo para a frente, e não para cima.');
  if (fora.includes('queda') || fora.includes('joelhoDentro'))
    partes.push(
      'O quadril e o joelho pedem mais estabilidade. Vou reforçar o glúteo médio e os exercícios de uma perna só no treino de força, e vamos treinar o movimento correndo na esteira de frente para o espelho.',
    );
  if (lados && lados.E && lados.D) {
    const a = psAssimetria('queda', lados.E.queda, lados.D.queda);
    if (a && a.alto)
      partes.push(
        `O quadril cai mais quando você apoia no pé ${lados.E.queda > lados.D.queda ? 'esquerdo' : 'direito'}, então esse lado vai ganhar atenção extra no treino de força.`,
      );
  }
  if (fora.includes('cruza'))
    partes.push('Em alguns passos o pé cruza a linha do corpo. Imagine correr sobre dois trilhos, um para cada pé.');
  if (!fora.length)
    partes.push(
      'Sua mecânica está muito boa. Vamos manter o trabalho de força para sustentar isso nos treinos longos.',
    );
  partes.push('Daqui a umas 8 semanas a gente grava de novo para comparar.');
  return partes.join(' ');
}

// o que a medida quer dizer, em palavras (tíbia inclinada para trás tem texto próprio)
function psExplicaTxt(k, v) {
  const nv = psNivel(k, v) || 'info';
  if (k === 'tibia' && v != null && v < PS_FAIXA.tibia[0])
    return 'A canela chega inclinada para trás, o que é raro correndo. Costuma ser o ângulo da câmera ou um ponto fora do lugar.';
  const ex = PS_EXPLICA[k] || {};
  return ex[nv] || ex.info || '';
}
/* ---------- o que fazer com cada medida (só a equipe vê) ---------- */
function psFazer(k, v) {
  const nv = psNivel(k, v);
  if (!nv || nv === 'ok' || nv === 'info') return '';
  if (k === 'tibia' && v < PS_FAIXA.tibia[0])
    return 'Antes de concluir, abra Conferir os pontos e veja se o joelho e o tornozelo estão no lugar, e se a câmera estava mesmo de perfil. Se o valor continuar assim, grave de novo de lado, na altura do quadril.';
  const f = PS_FAIXA[k];
  const baixo = f && v < f[0];
  const t = {
    cadencia:
      'Suba a cadência de 5% a 10%, aos poucos, com metrônomo ou música no ritmo certo, começando pelos treinos leves. Isso diminuiu a carga no quadril e no joelho e também o sobe e desce do corpo (Heiderscheit et al., 2011). Grave de novo em 6 a 8 semanas.',
    tibia:
      'É sinal de passada longa, com o pé tocando o chão à frente do corpo. O caminho mais simples é subir a cadência, porque o passo encurta junto (Heiderscheit et al., 2011). A dica para passar ao aluno é pisar embaixo do quadril, com passos mais curtos e rápidos.',
    frente:
      'É sinal de passada longa. Subir a cadência encurta o passo e traz o pé para baixo do corpo (Heiderscheit et al., 2011). A dica para passar ao aluno é pisar embaixo do quadril, com passos mais curtos e rápidos.',
    joelhoIC: baixo
      ? 'Joelho esticado no toque costuma vir junto da passada longa. Trabalhe primeiro a cadência e a tíbia, e o joelho costuma acompanhar.'
      : 'Joelho muito dobrado no toque. Veja se aparece só no fim dos treinos (cansaço) e reforce quadríceps e glúteo no treino de força.',
    joelhoMax: baixo
      ? 'Pouca flexão do joelho no apoio deixa a aterrissagem mais dura. Peça uma corrida mais macia e silenciosa.'
      : 'Muita flexão do joelho no apoio pede mais do quadríceps. Veja junto com a tíbia e o pé à frente, porque com passos mais curtos isso costuma diminuir (Heiderscheit et al., 2011).',
    tronco: baixo
      ? 'Tronco reto demais. Uma leve inclinação para a frente diminuiu a carga na articulação da patela num estudo com corredores (Teng e Powers, 2014), o que ajuda quem sente dor na frente do joelho. A dica é inclinar o corpo inteiro a partir do tornozelo, sem dobrar a cintura.'
      : 'Tronco inclinado demais, o que pede mais da lombar e do posterior da coxa. Reforce core e glúteo e peça para o aluno correr mais alto.',
    oscilacao:
      'O corpo sobe e desce muito. Menos oscilação do quadril esteve ligada a uma corrida mais econômica (Folland et al., 2017), e subir a cadência costuma diminuir o sobe e desce (Heiderscheit et al., 2011). A dica é levar o corpo para a frente, e não para cima.',
    queda:
      'Reforce o glúteo médio e os exercícios de uma perna só, mas saiba que só o fortalecimento melhorou o agachamento numa perna e não mudou a corrida (Willy e Davis, 2011). O que mudou a corrida foi treinar o movimento correndo na esteira de frente para um espelho, mantendo o quadril nivelado (Willy et al., 2012). Faça os dois.',
    joelhoDentro:
      'Reforce o glúteo médio e os exercícios de uma perna só, e treine o movimento correndo na esteira de frente para um espelho, com o joelho alinhado com o pé. Só a força não mudou a corrida (Willy e Davis, 2011), e o treino com espelho mudou (Willy et al., 2012).',
    cruza:
      'Pé cruzando a linha do corpo aumenta a adução do quadril. Correr com os pés um pouco mais afastados diminuiu essa adução (Brindle et al., 2014). A dica é correr sobre dois trilhos, um para cada pé.',
  };
  return t[k] || '';
}
const PS_REFS =
  'Heiderscheit et al. (2011), Med Sci Sports Exerc; Souza (2016), Phys Med Rehabil Clin N Am; Bramah et al. (2018), Am J Sports Med; Teng e Powers (2014), J Orthop Sports Phys Ther; Folland et al. (2017), Med Sci Sports Exerc; Willy e Davis (2011), J Orthop Sports Phys Ther; Willy et al. (2012), Clin Biomech; Brindle et al. (2014), Gait Posture.';
const PS_TITULO_LADO = {
  queda: 'Queda do quadril',
  joelhoDentro: 'Joelho para dentro',
  largura: 'Largura do passo',
  cruza: 'Pé cruzando a linha',
  passo: 'Tempo de passo',
  contato: 'Tempo de contato',
};
const psUnL = (k) => (k === 'passo' ? 'ms' : psUn(k));
const psFmtL = (k, v) => (k === 'passo' ? (v == null ? '–' : String(Math.round(v))) : psFmt(k, v));
const psValor = (k, v) => `${psFmtL(k, v)}${psUnL(k) && psUnL(k) !== '°' ? ' ' : ''}${psUnL(k)}`;

/* ---------- telas ---------- */
const psDataHora = (iso) => `${fmtDia(iso)} · ${fmtHora(iso)}`;
// ritmo e câmera da análise, em texto
function psRitmoTxt(x) {
  const ex = x.extra || {};
  const p = [];
  if (ex.ritmo && ex.ritmo.kmh) p.push(`${f1(ex.ritmo.kmh, 1)} km/h (${psPaceTxt(ex.ritmo.kmh)})`);
  const c = ex.camera;
  if (c && c.fator > 1) p.push(`câmera lenta ${c.fator}x${c.auto ? ', percebida pelo app' : ''}`);
  else if (c && c.fps >= 90) p.push(`${Math.round(c.fps)} quadros por segundo`);
  return p.join(' · ');
}
function psCardsMetricas(x, ant, staff) {
  const { m, conf } = psFinais(x);
  const ma = ant ? psFinais(ant).m : null;
  return `<div class="ps-mets">${(PS_ORDEM[x.vista] || [])
    .filter((k) => m[k] != null)
    .map((k) => {
      const nv = psNivel(k, m[k]) || 'info';
      const ex = PS_EXPLICA[k] || {};
      const c = ma ? psCompara(k, ma[k], m[k]) : null;
      const cTxt = c
        ? c.efeito === 'igual'
          ? 'igual à última'
          : `${c.d > 0 ? '+' : '−'}${psFmt(k, Math.abs(c.d))} desde a última${c.efeito === 'melhorou' ? ', melhorou' : c.efeito === 'piorou' ? ', piorou' : ''}`
        : '';
      const faz = staff ? psFazer(k, m[k]) : '';
      return `<details class="ps-met ${nv}"><summary><span class="ps-met-t">${PS_TITULO[k]}${conf.has(k) ? '<i class="ps-conf">conferido</i>' : ''}</span><span class="ps-met-v"><b>${psFmt(k, m[k])}</b>${psUn(k) ? `<small>${psUn(k)}</small>` : ''}</span>${cTxt ? `<span class="ps-met-d ${c.efeito}">${cTxt}</span>` : ''}<span class="ps-met-x">${esc(psExplicaTxt(k, m[k]))}</span></summary><p class="small muted">${esc(ex.sobre || '')}</p>${faz ? `<p class="small ps-faz"><b>O que fazer</b>${esc(faz)}</p>` : ''}</details>`;
    })
    .join('')}</div>`;
}
// leitura para o treinador: o que olhar primeiro e o que fazer
function psLeituraHTML(x, ant) {
  const { m, lados, conf } = psFinais(x);
  const ex = x.extra || {};
  const ordem = { fora: 0, atencao: 1 };
  const ach = (PS_ORDEM[x.vista] || [])
    .filter((k) => m[k] != null && ['fora', 'atencao'].includes(psNivel(k, m[k])))
    .sort((a, b) => ordem[psNivel(a, m[a])] - ordem[psNivel(b, m[b])]);
  const notas = [];
  const conferir = ex.conferir || [];
  const faltam = conferir.filter((c) => !c.conferido_em).length;
  if (faltam)
    notas.push(
      `Confira os pontos ${faltam === conferir.length ? 'dos quadros marcados' : `de ${faltam} quadro${faltam > 1 ? 's' : ''}`} antes de mandar o relatório. Leva um minuto e deixa os ângulos mais confiáveis, porque o app às vezes erra o lugar do joelho ou do tornozelo.`,
    );
  if (!(ex.ritmo && ex.ritmo.kmh))
    notas.push(
      'Sem o ritmo anotado, a comparação com outras análises fica menos confiável, porque cadência, passada e contato mudam com a velocidade.',
    );
  const fps = (x.qualidade || {}).fps || (ex.camera || {}).fps;
  if (x.vista === 'lado' && fps && fps < 50)
    notas.push('Vídeo a 30 quadros por segundo não mede o tempo de contato. Na próxima, peça câmera lenta.');
  if (ex.camera && ex.camera.auto)
    notas.push(
      `O vídeo estava em câmera lenta e o app ajustou o tempo sozinho (${ex.camera.fator}x). Confira se a cadência faz sentido para esse aluno.`,
    );
  if (x.vista === 'lado') notas.push('Para comparar a perna direita com a esquerda, peça também o vídeo por trás.');
  if (lados && lados.E && lados.D) {
    const altos = ['queda', 'joelhoDentro', 'passo', 'contato'].filter((k) => {
      const a = psAssimetria(k, lados.E[k], lados.D[k]);
      return a && a.alto;
    });
    if (altos.length)
      notas.push(
        `Diferença grande entre os lados em ${altos.map((k) => PS_TITULO_LADO[k].toLowerCase()).join(' e ')}. Veja o quadro Direita e esquerda.`,
      );
  }
  let resumoAnt = '';
  if (ant) {
    const ma = psFinais(ant).m;
    const ef = (PS_ORDEM[x.vista] || []).map((k) => [k, psCompara(k, ma[k], m[k])]).filter(([, c]) => c);
    const mel = ef.filter(([, c]) => c.efeito === 'melhorou').map(([k]) => PS_TITULO[k].toLowerCase());
    const pio = ef.filter(([, c]) => c.efeito === 'piorou').map(([k]) => PS_TITULO[k].toLowerCase());
    if (mel.length || pio.length)
      resumoAnt = `Desde a análise de ${fmtDia(ant.criado_em)}, ${mel.length ? `melhorou em ${mel.join(', ')}` : 'nada melhorou'}${pio.length ? ` e piorou em ${pio.join(', ')}` : ''}.`;
    else resumoAnt = `Desde a análise de ${fmtDia(ant.criado_em)}, as medidas ficaram praticamente iguais.`;
  }
  return `<div class="card ps-leitura"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><span class="eyebrow">Leitura da análise</span><span class="tag">Só a equipe vê</span></div>
    ${
      ach.length
        ? `<p class="small muted" style="margin-top:4px">O que olhar primeiro, em ordem de importância.</p>${ach
            .map((k, i) => {
              const nv = psNivel(k, m[k]);
              return `<div class="ps-lei ${nv}"><div class="ps-lei-t"><span class="ps-lei-n">${i + 1}</span><b>${PS_TITULO[k]}</b><span class="ps-lei-v">${psValor(k, m[k])}${conf.has(k) ? ' · conferido' : ''}</span></div><p class="small">${esc(psExplicaTxt(k, m[k]))}</p><p class="small ps-faz"><b>O que fazer</b>${esc(psFazer(k, m[k]))}</p></div>`;
            })
            .join('')}`
        : '<p style="margin-top:6px">Todas as medidas estão dentro do comum. Mantenha o treino de força e grave de novo em uns 3 meses para acompanhar.</p>'
    }
    ${resumoAnt ? `<p class="small" style="margin-top:10px"><b>Evolução.</b> ${esc(resumoAnt)}</p>` : ''}
    ${notas.length ? `<ul class="ps-notas">${notas.map((t) => `<li class="small">${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
}
// direita e esquerda (vídeo por trás)
function psLadosHTML(x, staff) {
  const { lados, conf } = psFinais(x);
  if (!lados || !lados.E || !lados.D) return '';
  const ks = ['queda', 'joelhoDentro', 'largura', 'cruza', 'passo', 'contato'].filter(
    (k) => lados.E[k] != null || lados.D[k] != null,
  );
  if (!ks.length) return '';
  let algumAlto = false;
  const linhas = ks
    .map((k) => {
      const a = psAssimetria(k, lados.E[k], lados.D[k]);
      if (a && a.alto) algumAlto = true;
      const cE = conf.has('E.' + k),
        cD = conf.has('D.' + k);
      return `<tr class="${a && a.alto ? 'alto' : ''}"><td>${PS_TITULO_LADO[k]}</td><td>${psValor(k, lados.E[k])}${cE ? '<i class="ps-conf">c</i>' : ''}</td><td>${psValor(k, lados.D[k])}${cD ? '<i class="ps-conf">c</i>' : ''}</td><td>${a ? `${f1(a.valor, 0)}${a.un === 'cm' ? ' cm' : a.un}` : '–'}</td></tr>`;
    })
    .join('');
  return `<div class="card ps-lados"><span class="eyebrow">Direita e esquerda</span>
    <table class="ps-tab"><thead><tr><th></th><th>Pé esquerdo no chão</th><th>Pé direito no chão</th><th>Diferença</th></tr></thead><tbody>${linhas}</tbody></table>
    <p class="small muted" style="margin-top:8px">Cada coluna mostra o que acontece quando o pé daquele lado está no chão. A queda do quadril com o pé esquerdo no chão é o quadril direito caindo.</p>
    ${
      staff
        ? `<p class="small ps-faz" style="margin-top:8px"><b>${algumAlto ? 'Atenção à diferença' : 'Como ler'}</b>${
            algumAlto
              ? 'As linhas marcadas passam de uns 4° nos ângulos ou 10% nos tempos. Isso merece atenção, ainda mais em quem já teve lesão de um lado. É uma referência prática, não um limite da ciência. Teste força de uma perna só dos dois lados (agachamento ou ponte numa perna) para ver se a diferença aparece também, e dê mais volume ao lado mais fraco.'
              : 'Diferenças até uns 4° nos ângulos ou 10% nos tempos são comuns e podem ser erro da medida. É uma referência prática, não um limite da ciência.'
          }</p>`
        : ''
    }</div>`;
}
function psQuadrosHTML(x, urls) {
  const qs = (x.quadros || []).filter((q) => urls[q.path]);
  if (!qs.length) return '';
  return `<div class="ps-quadros">${qs.map((q) => `<button type="button" class="ps-q" data-src="${esc(urls[q.path])}"><img src="${esc(urls[q.path])}" alt="${esc(q.legenda)}" loading="lazy"><span>${esc(q.legenda)}</span></button>`).join('')}</div>`;
}
function psLigarQuadros(raiz) {
  raiz
    .querySelectorAll('.ps-q')
    .forEach(
      (b) =>
        (b.onclick = () =>
          openSheet(
            `<img src="${b.dataset.src}" alt="" style="width:100%;border-radius:14px;display:block"><p class="small muted" style="margin-top:8px">${esc(b.querySelector('span').textContent)}</p>`,
          )),
    );
}
// replay do esqueleto em loop (sem o vídeo); com mais de um, todos andam juntos no mesmo momento da passada
function psReplay(cv, serie) {
  psReplayVarios([[cv, serie]]);
}
function psReplayVarios(pares) {
  const itens = pares
    .map(([cv, serie]) => {
      if (!cv || !serie || !serie.q || !serie.q.length) return null;
      const pts = serie.q.filter(Boolean).flat().filter(Boolean);
      if (!pts.length) return null;
      const xs = pts.map((p) => p[0]),
        ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys);
      const W = (cv.width = 640),
        H = (cv.height = 420);
      const sc = Math.min((W - 60) / (x1 - x0 || 1), (H - 60) / (y1 - y0 || 1));
      const idx = {};
      serie.ids.forEach((k, i) => (idx[k] = i));
      return {
        cv,
        serie,
        W,
        H,
        sc,
        y1,
        idx,
        ox: (W - (x1 - x0) * sc) / 2 - x0 * sc,
        oy: (H - (y1 - y0) * sc) / 2 - y0 * sc,
        ctx: cv.getContext('2d'),
        dur: serie.q.length / (serie.fps || 30),
      };
    })
    .filter(Boolean);
  if (!itens.length) return;
  // metade da velocidade, para dar para ver; com dois, o tempo é o mais longo dos dois
  const periodo = Math.max(...itens.map((it) => it.dur)) * 2000;
  let ult = -1;
  const t0 = performance.now();
  const loop = (ts) => {
    if (!itens.some((it) => document.body.contains(it.cv))) return;
    const fase = ((((ts - t0) % periodo) + periodo) % periodo) / periodo;
    const passo = Math.floor(fase * 60);
    if (passo !== ult) {
      ult = passo;
      itens.forEach((it) => {
        const { ctx, W, H, sc, ox, oy, y1, idx, serie } = it;
        const f = serie.q[Math.min(serie.q.length - 1, Math.floor(fase * serie.q.length))];
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(70,214,255,.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, oy + y1 * sc + 8);
        ctx.lineTo(W - 20, oy + y1 * sc + 8);
        ctx.stroke();
        if (!f) return;
        const p = {};
        Object.values(PS_P).forEach((k) => {
          const v = f[idx[k]];
          if (v) p[k] = [ox + v[0] * sc, oy + v[1] * sc, 1];
        });
        psEsqueleto(ctx, p, 1, null);
        if (p[0]) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(p[0][0], p[0][1], 12, 0, 7);
          ctx.fill();
        }
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
// cartão "Conferir os pontos" (só a equipe)
function psConferirCardHTML(x) {
  const c = (x.extra || {}).conferir || [];
  if (!c.length)
    return x.quadros && x.quadros.length
      ? '<div class="card ps-conferir"><span class="eyebrow">Conferir os pontos</span><p class="small muted" style="margin-top:4px">Esta análise foi feita antes da conferência de pontos existir. As próximas já vêm com os quadros para conferir.</p></div>'
      : '';
  return `<div class="card ps-conferir"><span class="eyebrow">Conferir os pontos</span>
    <p class="small muted" style="margin-top:4px">Veja quadro a quadro e arraste os pontos que o app errou. As medidas daquele momento são refeitas na hora e entram no relatório como conferidas.</p>
    <div class="stack" style="margin-top:10px">${c
      .map(
        (it, i) =>
          `<button type="button" class="list-item ps-conf-it" data-i="${i}"><span class="ativ-ic">${PS_IC}</span><div class="grow"><b>${esc(it.legenda)}</b><div class="small muted">${it.n} quadros${it.conferido_em ? ` · conferido em ${fmtDia(it.conferido_em)}` : ' · ainda no automático'}</div></div>${it.conferido_em ? '<span class="tag ok">Conferido</span>' : '<span class="tag">Conferir</span>'}${I.chev}</button>`,
      )
      .join('')}</div></div>`;
}
function psDetalheHTML(x, urls, ant, staff, previa, outras = []) {
  const q = x.qualidade || {};
  const rit = psRitmoTxt(x);
  return `<div class="card ps-topo-card"><div class="row" style="justify-content:space-between;align-items:center;gap:10px"><div><span class="eyebrow">${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${esc(x.local === 'esteira' ? 'Esteira' : x.local === 'rua' ? 'Rua' : 'Vídeo')}</span><div class="h3" style="margin-top:2px">${psDataHora(x.criado_em)}</div>${rit ? `<div class="small muted" style="margin-top:2px">${esc(rit)}</div>` : ''}${staff && !previa && !((x.extra || {}).ritmo || {}).kmh ? '<button type="button" class="link-btn small" id="ps-rit-ed" style="margin-top:4px">Anotar o ritmo do vídeo</button>' : ''}</div><span class="ps-selo">${PS_IC}</span></div>
    ${(q.avisos || []).length ? `<div class="ps-avisos">${q.avisos.map((a) => `<p class="small">${esc(PS_AVISO_TXT[a] || '')}</p>`).join('')}</div>` : ''}</div>
    ${staff ? psLeituraHTML(x, ant) : ''}
    ${psQuadrosHTML(x, urls)}
    ${x.serie ? '<div class="card ps-replay"><span class="eyebrow">Passada em movimento</span><canvas id="ps-rp"></canvas><p class="tiny dim">Esqueleto de duas passadas, em câmera lenta.</p></div>' : ''}
    ${psCardsMetricas(x, ant, staff)}
    ${psLadosHTML(x, staff)}
    ${staff && !previa ? psConferirCardHTML(x) : ''}
    ${
      staff && !previa && outras.length
        ? `<div class="card ps-comp"><span class="eyebrow">Antes e depois</span><p class="small muted" style="margin-top:4px">Compare com outra análise feita do mesmo jeito: imagens lado a lado, as duas passadas andando juntas e o que melhorou ou piorou.</p>
          <div class="row" style="gap:8px;margin-top:10px"><select class="input grow" id="ps-comp-sel">${outras.map((o) => `<option value="${o.id}">${fmtDia(o.criado_em)}${psRitmoTxt(o) ? ' · ' + esc(psRitmoTxt(o)) : ''}</option>`).join('')}</select><button class="btn sm" id="ps-comp-ir">Comparar</button></div></div>`
        : ''
    }
    ${
      previa
        ? ''
        : `<div class="card ps-coment"><span class="eyebrow">${staff ? 'Relatório para o aluno' : 'Comentário do treinador'}</span>${
            staff
              ? `<div id="ps-sug"></div><textarea class="textarea" id="ps-txt" rows="6" placeholder="Escreva o que você viu e o que o aluno deve ajustar. Vai no relatório em PDF, junto com as imagens e as medidas.">${esc(x.comentario || '')}</textarea><button class="btn block" id="ps-salvar" style="margin-top:10px">${x.relatorio_path ? 'Gerar de novo e reenviar o relatório' : 'Gerar relatório em PDF e enviar'}</button>${x.relatorio_path ? `<p class="tiny dim" style="margin-top:8px">Relatório enviado em ${fmtDia(x.relatorio_em)}. <a href="#" id="ps-ver-rel">Abrir o PDF enviado</a></p>` : '<p class="tiny dim" style="margin-top:8px">O aluno só vê as medidas depois que você enviar. O relatório fica na aba Análise da passada dele, com o PDF para baixar.</p>'}`
              : `<p style="margin-top:6px;white-space:pre-line">${x.comentario ? esc(x.comentario) : 'Seu treinador vai olhar o vídeo e deixar o comentário aqui. Você recebe uma notificação.'}</p>`
          }</div>`
    }
    <p class="tiny dim" style="margin-top:12px">Medidas feitas pelo celular a partir do vídeo (2D), aproximadas e sensíveis ao ângulo da câmera. As faixas são referências gerais, e quem interpreta é o treinador. Baseado em Souza (2016), Heiderscheit et al. (2011) e Bramah et al. (2018).</p>`;
}

/* ---------- antes e depois ---------- */
function psFraseCompara(k, va, vb, c) {
  const a = psValor(k, va),
    b = psValor(k, vb);
  if (c.efeito === 'igual')
    return `Ficou praticamente igual (${a} e ${b}). A diferença é menor do que o erro da medida.`;
  if (c.efeito === 'melhorou') return `Foi de ${a} para ${b}, mais perto da faixa comum.`;
  if (c.efeito === 'piorou') return `Foi de ${a} para ${b}, mais longe da faixa comum.`;
  return PS_FAIXA[k]
    ? `Foi de ${a} para ${b}, e as duas ficam dentro da faixa comum.`
    : `Foi de ${a} para ${b}. Essa medida não tem faixa de referência, então olhe junto com o ritmo.`;
}
async function psComparar(raiz, a, b, voltar, staff) {
  // a = antes (mais antiga), b = depois
  if (a.criado_em > b.criado_em) [a, b] = [b, a];
  raiz.innerHTML =
    '<div class="ps-carr-s"><span class="ps-spin"></span><small>Montando o antes e depois…</small></div>';
  const urls = await psUrls([a, b]);
  const fa = psFinais(a),
    fb = psFinais(b);
  const ka = ((a.extra || {}).ritmo || {}).kmh,
    kb = ((b.extra || {}).ritmo || {}).kmh;
  const avisos = [];
  if (ka && kb && Math.abs(ka - kb) / ((ka + kb) / 2) > 0.05)
    avisos.push(
      `Os dois vídeos foram feitos em ritmos diferentes (${f1(ka, 1)} e ${f1(kb, 1)} km/h). Cadência, passada e contato mudam com a velocidade, então compare essas medidas com cuidado.`,
    );
  else if (!ka || !kb)
    avisos.push(
      'Falta o ritmo de pelo menos um dos vídeos. Se foram em velocidades diferentes, cadência, passada e contato mudam por causa disso.',
    );
  if (a.local !== b.local)
    avisos.push('Um vídeo foi na esteira e o outro na rua. A esteira costuma mudar um pouco a passada.');
  const linhas = (PS_ORDEM[b.vista] || [])
    .map((k) => [k, psCompara(k, fa.m[k], fb.m[k])])
    .filter(([, c]) => c)
    .map(
      ([k, c]) =>
        `<div class="ps-cmp ${c.efeito}"><div class="ps-cmp-t"><b>${PS_TITULO[k]}</b><span class="ps-cmp-e">${{ melhorou: 'Melhorou', piorou: 'Piorou', igual: 'Igual', mudou: 'Mudou' }[c.efeito]}</span></div><div class="ps-cmp-v"><span>${psValor(k, fa.m[k])}</span>${I.chev}<b>${psValor(k, fb.m[k])}</b></div><p class="small muted">${esc(psFraseCompara(k, fa.m[k], fb.m[k], c))}</p></div>`,
    )
    .join('');
  const pares = [];
  const n = Math.max((a.quadros || []).length, (b.quadros || []).length);
  for (let i = 0; i < n; i++) {
    const qa = (a.quadros || [])[i],
      qb = (b.quadros || [])[i];
    if (qa && qb && urls[qa.path] && urls[qb.path])
      pares.push(
        `<div class="ps-ad"><p class="sec-lbl">${esc(qb.legenda)}</p><div class="ps-ad-par"><button type="button" class="ps-q" data-src="${esc(urls[qa.path])}"><img src="${esc(urls[qa.path])}" alt=""><span>Antes · ${fmtDia(a.criado_em)}</span></button><button type="button" class="ps-q" data-src="${esc(urls[qb.path])}"><img src="${esc(urls[qb.path])}" alt=""><span>Depois · ${fmtDia(b.criado_em)}</span></button></div></div>`,
      );
  }
  let resumo = '';
  if (staff) {
    const ef = (PS_ORDEM[b.vista] || []).map((k) => [k, psCompara(k, fa.m[k], fb.m[k])]).filter(([, c]) => c);
    const mel = ef.filter(([, c]) => c.efeito === 'melhorou').map(([k]) => PS_TITULO[k].toLowerCase());
    const pio = ef.filter(([, c]) => c.efeito === 'piorou').map(([k]) => PS_TITULO[k].toLowerCase());
    resumo = `<div class="card ps-leitura"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><span class="eyebrow">Como ler</span><span class="tag">Só a equipe vê</span></div>
      <p class="small" style="margin-top:6px">${mel.length ? `Melhorou em ${esc(mel.join(', '))}.` : 'Nenhuma medida melhorou de forma clara.'} ${pio.length ? `Piorou em ${esc(pio.join(', '))}.` : 'Nenhuma piorou.'}</p>
      <p class="small ps-faz" style="margin-top:6px"><b>Sugestão</b>Comece o comentário pelo que melhorou e mostre as imagens lado a lado ao aluno. Se algo piorou, veja primeiro se o ritmo e o local foram os mesmos, e só depois mude o treino. Diferença marcada como igual fica dentro do erro da medida.</p></div>`;
  }
  raiz.innerHTML = `<button type="button" class="back ps-volta" id="ps-cmp-v">${I.back} Voltar à análise</button><p class="eyebrow">Antes e depois · ${b.vista === 'lado' ? 'De lado' : 'Por trás'}</p><h1 class="h1">${fmtDia(a.criado_em)} e ${fmtDia(b.criado_em)}</h1>
    ${avisos.length ? `<div class="ps-avisos" style="margin-top:12px">${avisos.map((t) => `<p class="small">${esc(t)}</p>`).join('')}</div>` : ''}
    ${resumo}
    ${a.serie && b.serie ? `<div class="card ps-replay ps-rp-par"><span class="eyebrow">As duas passadas andando juntas</span><div class="ps-rp2"><figure><canvas id="ps-rpa"></canvas><figcaption>Antes</figcaption></figure><figure><canvas id="ps-rpb"></canvas><figcaption>Depois</figcaption></figure></div><p class="tiny dim">Cada esqueleto mostra duas passadas, no mesmo momento da passada, em câmera lenta.</p></div>` : ''}
    ${pares.join('')}
    <p class="sec-lbl" style="margin-top:16px">As medidas</p><div class="stack">${linhas}</div>
    <p class="tiny dim" style="margin-top:12px">Diferenças pequenas (2 a 3 graus, 1 a 2 cm, 3 passos por minuto) podem ser erro da medida e aparecem como igual.</p>`;
  raiz.querySelector('#ps-cmp-v').onclick = (e) => {
    e.preventDefault();
    voltar();
  };
  psLigarQuadros(raiz);
  psReplayVarios([
    [raiz.querySelector('#ps-rpa'), a.serie],
    [raiz.querySelector('#ps-rpb'), b.serie],
  ]);
  window.scrollTo(0, 0);
}

/* ---------- conferir os pontos, quadro a quadro (só a equipe) ---------- */
const PS_ONDE = {
  quadril: 'Na saliência do osso na lateral do quadril (trocânter), um pouco abaixo da cintura.',
  joelho: 'No centro do joelho visto de lado. Por trás, no meio da parte de trás do joelho.',
  torn: 'No ossinho saliente do tornozelo (maléolo).',
  calc: 'Na parte de trás do pé, onde ele encosta no chão.',
  ombro: 'No centro do ombro, na ponta do braço.',
};
const PS_NOME_PT = { quadril: 'Quadril', joelho: 'Joelho', torn: 'Tornozelo', calc: 'Calcanhar', ombro: 'Ombro' };
function psAlvos(tipo, an) {
  if (an.vista === 'lado') {
    const s = PS_LADO[an.lado];
    return tipo === 'contato' ? [s.q, s.j, s.t, s.c] : [s.o, s.q, s.j, s.t];
  }
  const s = PS_LADO[an.troca ? (tipo === 'E' ? 'D' : 'E') : tipo],
    o = PS_LADO[an.troca ? tipo : tipo === 'E' ? 'D' : 'E'];
  return [s.q, o.q, s.j, s.t];
}
const psNomeIdx = (i) => {
  const n = Object.keys(PS_P).find((k) => PS_P[k] === i) || '';
  return n.replace(/[ED]$/, '');
};
// quais medidas cada momento confere
const psChavesMomento = (tipo, an) =>
  an.vista === 'lado'
    ? tipo === 'contato'
      ? ['tibia', 'joelhoIC', 'frente']
      : ['joelhoMax', 'tronco']
    : [tipo + '.queda', tipo + '.joelhoDentro'];
const PS_DICA_MOMENTO = {
  contato:
    'Ande os quadros até o primeiro em que o pé encosta no chão. Depois confira o quadril, o joelho, o tornozelo e o calcanhar.',
  apoio:
    'Escolha o quadro em que o joelho está mais dobrado, com o corpo passando por cima do pé. Depois confira o ombro, o quadril, o joelho e o tornozelo.',
  tras: 'Escolha o quadro do meio do apoio, quando o quadril do outro lado está mais baixo. Depois confira os dois lados do quadril, o joelho e o tornozelo.',
};
async function psConferir(raiz, x, idx, voltar) {
  const ex = x.extra || {};
  const it = ex.conferir[idx];
  const an = ex.an || {};
  const sair = () => voltar();
  raiz.innerHTML = `<button type="button" class="back ps-volta" id="pc-v">${I.back} Voltar à análise</button><p class="eyebrow">Conferir os pontos</p><h1 class="h1">${esc(it.legenda)}</h1><div class="ps-carr-s"><span class="ps-spin"></span><small>Carregando os quadros…</small></div>`;
  raiz.querySelector('#pc-v').onclick = (e) => {
    e.preventDefault();
    sair();
  };
  let img;
  try {
    const { data, error } = await sb.storage.from('nx-fotos').download(it.path);
    if (error || !data) throw error || new Error('sem arquivo');
    img = new Image();
    await new Promise((ok, erro) => {
      img.onload = ok;
      img.onerror = erro;
      img.src = URL.createObjectURL(data);
    });
  } catch (e) {
    console.error(e);
    raiz.querySelector('.ps-carr-s').innerHTML =
      '<p class="small muted">Não foi possível carregar os quadros. Tente de novo.</p>';
    return;
  }
  const alvos = psAlvos(it.tipo, an);
  const edit = {};
  if (it.editado && it.editado.quadro != null) edit[it.editado.quadro] = it.editado.pts;
  let fi = it.editado ? it.editado.quadro : it.centro;
  const pontos = (k) => edit[k] || it.pts[k] || {};
  const chaves = psChavesMomento(it.tipo, an);
  const auto = (kk) => {
    if (!kk.includes('.')) return (x.metricas || {})[kk];
    const [L, k] = kk.split('.');
    return ((ex.lados || {})[L] || {})[k];
  };
  const dicaM = an.vista === 'lado' ? PS_DICA_MOMENTO[it.tipo] : PS_DICA_MOMENTO.tras;
  raiz.innerHTML = `<button type="button" class="back ps-volta" id="pc-v">${I.back} Voltar à análise</button><p class="eyebrow">Conferir os pontos</p><h1 class="h1">${esc(it.legenda)}</h1>
    <p class="small muted" style="margin-top:6px">${esc(dicaM)}</p>
    <div class="pc-tela"><canvas id="pc-cv"></canvas></div>
    <div class="pc-nav"><button type="button" class="btn ghost sm" id="pc-ant" aria-label="Quadro anterior">${I.back}</button><div class="grow" style="text-align:center"><b id="pc-q"></b><div class="tiny dim" id="pc-t"></div></div><button type="button" class="btn ghost sm pc-prox" id="pc-prox" aria-label="Quadro seguinte">${I.chev}</button></div>
    <div class="pc-med" id="pc-med"></div>
    <details class="card pc-onde"><summary><b>Onde colocar cada ponto</b></summary><ul>${[...new Set(alvos.map(psNomeIdx))].map((n) => `<li class="small"><b>${PS_NOME_PT[n]}.</b> ${esc(PS_ONDE[n])}</li>`).join('')}</ul><p class="tiny dim">Arraste com o dedo. A lupa no canto mostra o ponto de perto enquanto você arrasta.</p></details>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost grow" id="pc-auto">Voltar ao automático</button><button class="btn grow" id="pc-salvar">Salvar a conferência</button></div>`;
  raiz.querySelector('#pc-v').onclick = (e) => {
    e.preventDefault();
    sair();
  };
  const cv = raiz.querySelector('#pc-cv');
  const ctx = cv.getContext('2d');
  let arrasta = null,
    pedido = false;
  const desenhar = () => {
    pedido = false;
    const P = pontos(fi);
    const base = psDesenhaQuadro(img, 0, fi * it.h, it.w, it.h, P, it.tipo, an);
    const sc = base.width / it.w;
    cv.width = base.width;
    cv.height = base.height;
    ctx.drawImage(base, 0, 0);
    alvos.forEach((i) => {
      if (!P[i]) return;
      const x0 = P[i][0] * sc,
        y0 = P[i][1] * sc;
      const ativo = arrasta === i;
      ctx.beginPath();
      ctx.arc(x0, y0, ativo ? 24 : 18, 0, 7);
      ctx.fillStyle = ativo ? 'rgba(255,209,102,.35)' : 'rgba(70,214,255,.28)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = ativo ? '#ffd166' : '#fff';
      ctx.stroke();
    });
    // lupa: mostra o ponto de perto enquanto arrasta (o dedo cobre o ponto)
    if (arrasta != null && P[arrasta]) {
      const px = P[arrasta][0] * sc,
        py = P[arrasta][1] * sc,
        r = 110;
      const lx = px < cv.width / 2 && py < cv.height / 2 ? cv.width - r - 16 : r + 16,
        ly = r + 16;
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, 7);
      ctx.clip();
      ctx.drawImage(cv, px - r / 3, py - r / 3, (2 * r) / 3, (2 * r) / 3, lx - r, ly - r, 2 * r, 2 * r);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, 7);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffd166';
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx - 18, ly);
      ctx.lineTo(lx + 18, ly);
      ctx.moveTo(lx, ly - 18);
      ctx.lineTo(lx, ly + 18);
      ctx.stroke();
    }
    raiz.querySelector('#pc-q').textContent =
      `Quadro ${fi + 1} de ${it.n}${fi === it.centro ? ' · escolhido pelo app' : ''}${edit[fi] ? ' · com ajuste' : ''}`;
    const dt = it.tempos ? Math.round((it.tempos[fi] - it.tempos[it.centro]) * 1000) : null;
    raiz.querySelector('#pc-t').textContent =
      dt == null ? '' : dt === 0 ? 'momento marcado pelo app' : `${dt > 0 ? '+' : '−'}${Math.abs(dt)} ms`;
    raiz.querySelector('#pc-ant').disabled = fi <= 0;
    raiz.querySelector('#pc-prox').disabled = fi >= it.n - 1;
    const med = psMedidasQuadro(it.tipo, P, an);
    raiz.querySelector('#pc-med').innerHTML = chaves
      .map((kk) => {
        const k = kk.split('.').pop();
        const v = med[k];
        const a = auto(kk);
        const nv = psNivel(k, v) || 'info';
        return `<div class="pc-m ${nv}"><span>${PS_TITULO[k]}</span><b>${v == null ? '–' : psValor(k, v)}</b><small>automático ${a == null ? '–' : psValor(k, a)}</small></div>`;
      })
      .join('');
  };
  const pede = () => {
    if (!pedido) {
      pedido = true;
      requestAnimationFrame(desenhar);
    }
  };
  const naTela = (e) => {
    const r = cv.getBoundingClientRect();
    const sc = cv.width / it.w;
    return [((e.clientX - r.left) * (cv.width / r.width)) / sc, ((e.clientY - r.top) * (cv.height / r.height)) / sc];
  };
  cv.addEventListener('pointerdown', (e) => {
    const [px, py] = naTela(e);
    const P = pontos(fi);
    let melhor = null,
      dist = (60 * it.w) / 720;
    alvos.forEach((i) => {
      if (!P[i]) return;
      const d = Math.hypot(P[i][0] - px, P[i][1] - py);
      if (d < dist) {
        dist = d;
        melhor = i;
      }
    });
    if (melhor == null) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    arrasta = melhor;
    edit[fi] = JSON.parse(JSON.stringify(P));
    pede();
  });
  cv.addEventListener('pointermove', (e) => {
    if (arrasta == null) return;
    const [px, py] = naTela(e);
    edit[fi][arrasta] = [Math.max(0, Math.min(it.w, +px.toFixed(1))), Math.max(0, Math.min(it.h, +py.toFixed(1)))];
    pede();
  });
  const solta = () => {
    if (arrasta == null) return;
    arrasta = null;
    pede();
  };
  cv.addEventListener('pointerup', solta);
  cv.addEventListener('pointercancel', solta);
  raiz.querySelector('#pc-ant').onclick = () => {
    if (fi > 0) fi--;
    pede();
  };
  raiz.querySelector('#pc-prox').onclick = () => {
    if (fi < it.n - 1) fi++;
    pede();
  };
  raiz.querySelector('#pc-auto').onclick = () => {
    delete edit[fi];
    pede();
  };
  raiz.querySelector('#pc-salvar').onclick = async (e) => {
    const bt = e.currentTarget;
    bt.disabled = true;
    bt.textContent = 'Salvando…';
    try {
      const P = pontos(fi);
      const med = psMedidasQuadro(it.tipo, P, an);
      const ajustes = { ...(ex.ajustes || {}) };
      chaves.forEach((kk) => {
        const k = kk.split('.').pop();
        if (med[k] != null && isFinite(med[k]))
          ajustes[kk] = { valor: +med[k].toFixed(2), auto: auto(kk) ?? null, quadro: fi };
      });
      // refaz a imagem marcada deste momento com os pontos conferidos
      const quadros = (x.quadros || []).slice();
      if (it.quadro != null && quadros[it.quadro]) {
        const cvq = psDesenhaQuadro(img, 0, fi * it.h, it.w, it.h, P, it.tipo, an);
        const blob = await new Promise((ok) => cvq.toBlob(ok, 'image/jpeg', 0.85));
        const path = `${x.org_id}/${x.aluno_id}/passada/${x.id}-${it.quadro}-c${Date.now().toString(36)}.jpg`;
        const up = await sb.storage.from('nx-fotos').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        const velho = quadros[it.quadro].path;
        quadros[it.quadro] = { ...quadros[it.quadro], path };
        if (velho && velho !== path)
          sb.storage
            .from('nx-fotos')
            .remove([velho])
            .then(
              () => {},
              () => {},
            );
      }
      const conferir = ex.conferir.slice();
      conferir[idx] = {
        ...it,
        editado: { quadro: fi, pts: P },
        conferido_em: new Date().toISOString(),
        conferido_por: S.user.id,
      };
      const extra = { ...ex, conferir, ajustes };
      const { error } = await sb.from('nx_passadas').update({ extra, quadros }).eq('id', x.id);
      if (error) throw error;
      Object.assign(x, { extra, quadros });
      toast(
        x.relatorio_path
          ? 'Conferido. Gere o relatório de novo para o aluno receber as medidas conferidas.'
          : 'Conferido. As medidas desse momento foram atualizadas.',
      );
      sair();
    } catch (err) {
      console.error(err);
      toast('Não foi possível salvar a conferência. Tente de novo.', true);
      bt.disabled = false;
      bt.textContent = 'Salvar a conferência';
    }
  };
  desenhar();
  window.scrollTo(0, 0);
}

// relatório em PDF que o treinador manda ao aluno (as medidas só aparecem aqui)
async function psCarregaPdfLib() {
  if (window.html2pdf) return;
  await new Promise((ok, erro) => {
    const sc = document.createElement('script');
    sc.src = (window.NX_DEMO && window.NX_VENDOR) || new URL('vendor/html2pdf.bundle.min.js', document.baseURI).href;
    sc.onload = ok;
    sc.onerror = erro;
    document.head.appendChild(sc);
  });
}
async function psDataUrl(url) {
  try {
    const b = await (await fetch(url)).blob();
    return await new Promise((ok) => {
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = () => ok(null);
      r.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}
const PS_NIVEL_TXT = { ok: 'Dentro do comum', atencao: 'Atenção', fora: 'Fora do comum', info: 'Informativo' };
const PS_NIVEL_COR = { ok: '#15803d', atencao: '#b45309', fora: '#b91c1c', info: '#475569' };
function psRelatorioHTML(x, imgs, ant, m, logo, pares = []) {
  const fin = psFinais(x);
  const me = fin.m;
  const ma = ant ? psFinais(ant).m : null;
  const q = x.qualidade || {};
  const linhas = (PS_ORDEM[x.vista] || [])
    .filter((k) => me[k] != null)
    .map((k) => {
      const nv = psNivel(k, me[k]) || 'info';
      const ex = PS_EXPLICA[k] || {};
      const c = ma ? psCompara(k, ma[k], me[k]) : null;
      const dt = c
        ? c.efeito === 'igual'
          ? 'igual à anterior'
          : `${c.d > 0 ? '+' : '−'}${psFmt(k, Math.abs(c.d))} desde a anterior${c.efeito === 'melhorou' ? ', melhorou' : c.efeito === 'piorou' ? ', piorou' : ''}`
        : '';
      const corDt = c && c.efeito === 'melhorou' ? '#15803d' : c && c.efeito === 'piorou' ? '#b91c1c' : '#64748b';
      return `<div class="psr-l" style="display:flex;border-bottom:1px solid #e2e8f0"><div style="padding:10px 8px;width:34%;box-sizing:border-box"><b style="font-size:13px">${PS_TITULO[k]}</b><div style="font-size:10.5px;color:#64748b;margin-top:3px;line-height:1.4">${esc(ex.sobre || '')}</div></div>
        <div style="padding:10px 8px;width:18%;box-sizing:border-box;white-space:nowrap"><b style="font-size:18px">${psFmt(k, me[k])}</b>${psUn(k) === '°' ? '' : ' '}<span style="font-size:11px;color:#64748b">${psUn(k)}</span>${dt ? `<div style="font-size:10px;color:${corDt};margin-top:2px;white-space:normal">${dt}</div>` : ''}${fin.conf.has(k) ? '<div style="font-size:9.5px;color:#1d4ed8;margin-top:2px;font-weight:700">conferido pelo treinador</div>' : ''}</div>
        <div style="padding:10px 8px;flex:1"><span style="display:inline-block;font-size:10.5px;font-weight:700;color:#fff;background:${PS_NIVEL_COR[nv]};border-radius:99px;padding:2px 9px">${PS_NIVEL_TXT[nv]}</span><div style="font-size:12px;margin-top:5px;line-height:1.45">${esc(psExplicaTxt(k, me[k]))}</div></div></div>`;
    });
  const fotos = imgs
    .map(
      (im) =>
        `<div style="width:calc(33.33% - 8px);"><img src="${im.src}" style="width:100%;border-radius:8px;display:block"><div style="font-size:11px;color:#475569;margin-top:4px">${esc(im.legenda)}</div></div>`,
    )
    .join('');
  const treinador = (S.me && S.me.nome) || '';
  return `<div style="width:760px;background:#fff;color:#0f172a;font-family:Manrope,system-ui,sans-serif;padding:36px 40px;box-sizing:border-box">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0b1f44;padding-bottom:14px">
      ${logo ? `<img src="${logo}" style="height:38px">` : '<b style="font-size:20px;color:#0b1f44">NEXOS</b>'}
      <div style="text-align:right;font-size:11px;color:#475569">Nexos Performance e Saúde<br>Relatório de ${fmtDia(new Date().toISOString())}</div></div>
    <div style="margin-top:20px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#1d4ed8;font-weight:800">Análise da passada</div>
    <div style="font-size:26px;font-weight:800;margin-top:4px">${esc(m.nome || '')}</div>
    <div style="font-size:12.5px;color:#475569;margin-top:4px">Vídeo ${x.vista === 'lado' ? 'de lado' : 'por trás'} · ${esc(x.local === 'esteira' ? 'Esteira' : x.local === 'rua' ? 'Rua' : 'Vídeo enviado')} · gravado em ${psDataHora(x.criado_em)}${psRitmoTxt(x) ? ' · ' + esc(psRitmoTxt(x)) : ''}</div>
    <div class="psr-l" style="margin-top:20px;background:#f1f5f9;border-left:4px solid #0b1f44;border-radius:8px;padding:14px 16px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0b1f44">O que o seu treinador viu</div>
      <div style="font-size:13.5px;line-height:1.55;margin-top:6px;white-space:pre-line">${esc(x.comentario || '')}</div>
      ${treinador ? `<div style="font-size:12px;color:#475569;margin-top:10px">${esc(treinador)}</div>` : ''}</div>
    <div class="psr-l" style="margin-top:22px"><div style="font-size:15px;font-weight:800;margin-bottom:6px">As medidas</div>${linhas[0] || ''}</div>${linhas.slice(1).join('')}
    ${(q.avisos || []).length ? `<div class="psr-l" style="margin-top:14px;font-size:11px;color:#92400e;background:#fffbeb;border-radius:8px;padding:10px 12px;">${q.avisos.map((a) => esc(PS_AVISO_TXT[a] || '')).join('<br>')}</div>` : ''}
    ${psRelLados(fin.lados)}
    ${pares.length ? `<div class="psr-l" style="margin-top:22px"><div style="font-size:15px;font-weight:800">Antes e depois</div><div style="font-size:11px;color:#64748b;margin-top:2px">${fmtDia(ant.criado_em)} e ${fmtDia(x.criado_em)}</div>${pares.map((p) => `<div style="display:flex;gap:14px;margin-top:10px"><div style="width:220px"><img src="${p.a}" style="width:100%;border-radius:8px;display:block"><div style="font-size:11px;color:#475569;margin-top:4px">Antes · ${esc(p.legenda)}</div></div><div style="width:220px"><img src="${p.b}" style="width:100%;border-radius:8px;display:block"><div style="font-size:11px;color:#475569;margin-top:4px">Depois · ${esc(p.legenda)}</div></div></div>`).join('')}</div>` : ''}
    ${fotos ? `<div class="psr-l" style="margin-top:22px"><div style="font-size:15px;font-weight:800">Momentos marcados no vídeo</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px">${fotos}</div></div>` : ''}
    <div class="psr-l" style="margin-top:18px;font-size:10px;color:#64748b;line-height:1.5;">Medidas feitas pelo celular a partir do vídeo (2D), aproximadas e sensíveis ao ângulo da câmera. As faixas são referências gerais, e quem interpreta é o seu treinador. Referências: ${PS_REFS}</div>
  </div>`;
}
// direita e esquerda no PDF
function psRelLados(lados) {
  if (!lados || !lados.E || !lados.D) return '';
  const ks = ['queda', 'joelhoDentro', 'largura', 'cruza', 'passo', 'contato'].filter(
    (k) => lados.E[k] != null || lados.D[k] != null,
  );
  if (!ks.length) return '';
  const td = 'padding:7px 8px;border-bottom:1px solid #e2e8f0;font-size:12px';
  return `<div class="psr-l" style="margin-top:22px"><div style="font-size:15px;font-weight:800">Direita e esquerda</div>
    <table style="width:100%;border-collapse:collapse;margin-top:6px"><tr style="color:#64748b;font-size:11px"><td style="${td}"></td><td style="${td}">Pé esquerdo no chão</td><td style="${td}">Pé direito no chão</td><td style="${td}">Diferença</td></tr>
    ${ks
      .map((k) => {
        const a = psAssimetria(k, lados.E[k], lados.D[k]);
        const cor = a && a.alto ? 'color:#b45309;font-weight:700' : '';
        return `<tr><td style="${td};font-weight:700">${PS_TITULO_LADO[k]}</td><td style="${td}">${psValor(k, lados.E[k])}</td><td style="${td}">${psValor(k, lados.D[k])}</td><td style="${td};${cor}">${a ? `${f1(a.valor, 0)}${a.un === 'cm' ? ' cm' : a.un}` : '–'}</td></tr>`;
      })
      .join('')}</table>
    <div style="font-size:10.5px;color:#64748b;margin-top:6px">Cada coluna mostra o que acontece quando o pé daquele lado está no chão. Diferenças acima de uns 4° nos ângulos ou 10% nos tempos aparecem em destaque.</div></div>`;
}
async function psRelatorioPdf(x, urls, ant, m) {
  await psCarregaPdfLib();
  const imgs = [];
  for (const q of x.quadros || []) {
    const src = urls[q.path] && (await psDataUrl(urls[q.path]));
    if (src) imgs.push({ src, legenda: q.legenda });
  }
  // antes e depois: só o primeiro momento (o toque do pé ou o apoio esquerdo), para o PDF não crescer demais
  const pares = [];
  if (ant && (ant.quadros || [])[0] && imgs[0]) {
    const ua = await psUrls([ant]);
    const a = ua[ant.quadros[0].path] && (await psDataUrl(ua[ant.quadros[0].path]));
    if (a) pares.push({ a, b: imgs[0].src, legenda: imgs[0].legenda });
  }
  // logo em PNG (o gerador de PDF não desenha SVG)
  const logo = await psDataUrl(new URL('/img/nexos-logo-navy.png', location.origin).href);
  const caixa = document.createElement('div');
  caixa.style.cssText = 'position:fixed;left:0;top:0;width:760px;z-index:-1;pointer-events:none';
  caixa.innerHTML = psRelatorioHTML(x, imgs, ant, m, logo && /^data:image/.test(logo) ? logo : null, pares);
  document.body.appendChild(caixa);
  try {
    await Promise.all([...caixa.querySelectorAll('img')].map((im) => im.decode().catch(() => {})));
    const gera = (escala) =>
      window
        .html2pdf()
        .set({
          margin: [8, 0, 8, 0],
          image: { type: 'jpeg', quality: 0.9 },
          html2canvas: {
            scale: escala,
            backgroundColor: '#ffffff',
            width: 760,
            windowWidth: 760,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'], avoid: '.psr-l' },
        })
        .from(caixa.firstElementChild)
        .outputPdf('blob');
    let blob = await gera(2);
    // o armazenamento aceita até 5 MB por arquivo
    if (blob.size > 4.8e6) blob = await gera(1.3);
    return blob;
  } finally {
    caixa.remove();
  }
}
// duração do trecho analisado, em segundos de vídeo (em câmera lenta precisa de mais vídeo para ter 3 passadas)
const psDurTrecho = (fator) => ({ 1: 8, 2: 10, 4: 12, 8: 20 })[fator] || 8;
// tira de quadros (um embaixo do outro numa imagem só) com os pontos de cada um, para conferir depois
async function psTira(v, fr, ids) {
  const w = 540,
    sc = w / v.videoWidth,
    h = Math.round(v.videoHeight * sc);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h * ids.length;
  const ctx = cv.getContext('2d');
  const pts = [],
    tempos = [];
  for (let k = 0; k < ids.length; k++) {
    const f = fr[ids[k]];
    await psBuscar(v, f.tv ?? f.t);
    ctx.drawImage(v, 0, k * h, w, h);
    const P = {};
    if (f.p)
      Object.values(PS_P).forEach((i) => {
        const q = f.p[i];
        if (q) P[i] = [+(q[0] * sc).toFixed(1), +(q[1] * sc).toFixed(1)];
      });
    pts.push(P);
    tempos.push(f.t);
  }
  return { cv, n: ids.length, w, h, pts, tempos };
}
// boneco desenhado por cima do vídeo enquanto o celular analisa (mesma área que o vídeo ocupa na tela)
function psDesenhaVivo(cv, v, p, W, H) {
  if (!cv || !W) return;
  const box = cv.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(box.width * dpr)) {
    cv.width = Math.round(box.width * dpr);
    cv.height = Math.round(box.height * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!p) return;
  // o vídeo fica "contido" na caixa: calcula a escala e a sobra das laterais
  const sc = Math.min(cv.width / W, cv.height / H);
  ctx.save();
  ctx.translate((cv.width - W * sc) / 2, (cv.height - H * sc) / 2);
  psEsqueleto(ctx, p, sc, null);
  ctx.restore();
}
// fluxo de nova análise (aluno ou treinador)
async function psNova(alunoId, voltar, nomeAluno) {
  const altura0 = await psAltura(alunoId);
  const st = { vista: null, local: 'esteira', altura: altura0, url: null, ini: 0, fim: 0, fator: 1, ritmo: '' };
  const topo = `<a class="back" href="${voltar}">${I.back} Análise da passada</a><p class="eyebrow">Nova análise${nomeAluno ? ' · ' + esc(firstName(nomeAluno)) : ''}</p>`;
  const passo1 = () => {
    $app.innerHTML = `${topo}<h1 class="h1">Como vai filmar?</h1>
      <div class="ps-vistas">
        <button type="button" class="ps-vista" data-v="lado">${psIlustra('lado')}<b>De lado</b><small>Cadência, passada, joelho, tronco e o quanto você sobe e desce</small></button>
        <button type="button" class="ps-vista" data-v="tras">${psIlustra('tras')}<b>Por trás</b><small>Quadril, joelho para dentro e pé cruzando a linha</small></button>
      </div>
      <p class="small muted" style="margin-top:12px">O ideal é fazer as duas, uma de cada vez. O vídeo não sai do seu celular. Só as medidas e alguns quadros vão para o seu treinador conferir.</p>`;
    $app.querySelectorAll('.ps-vista').forEach(
      (b) =>
        (b.onclick = () => {
          st.vista = b.dataset.v;
          passo2();
        }),
    );
    window.scrollTo(0, 0);
  };
  const passo2 = () => {
    $app.innerHTML = `${topo}<h1 class="h1">${st.vista === 'lado' ? 'Filmando de lado' : 'Filmando por trás'}</h1>
      <div class="ps-ilustra-g">${psIlustra(st.vista)}</div>
      <ol class="ps-dicas">${PS_DICAS[st.vista].map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
      <div class="grid2" style="margin-top:12px"><label class="field"><span>Onde</span><select class="input" id="ps-local"><option value="esteira">Esteira</option><option value="rua">Rua ou pista</option></select></label>
      <label class="field"><span>Altura (cm)</span><input class="input" id="ps-alt" inputmode="numeric" placeholder="Ex.: 172" value="${st.altura || ''}"></label></div>
      <p class="tiny dim">A altura serve para transformar as medidas em centímetros.</p>
      <div class="grid2" style="margin-top:4px"><label class="field"><span id="ps-rit-l">Velocidade da esteira</span><input class="input" id="ps-rit" inputmode="decimal" placeholder="Ex.: 10 (km/h)" value="${esc(st.ritmo)}"></label>
      <label class="field"><span>Velocidade do vídeo</span><select class="input" id="ps-fator"><option value="1">Normal</option><option value="2">Câmera lenta 60 (2x)</option><option value="4">Câmera lenta 120 (4x)</option><option value="8">Câmera lenta 240 (8x)</option></select></label></div>
      <p class="tiny dim">O ritmo é opcional, mas ajuda muito: cadência, passada e contato mudam com a velocidade, e assim dá para comparar uma análise com a outra. A câmera lenta deixa o toque do pé e o tempo de contato mais precisos.</p>
      <input type="file" accept="video/*" capture="environment" id="ps-gravar" hidden><input type="file" accept="video/*" id="ps-escolher" hidden>
      <p class="sec-lbl" style="margin-top:16px">Como quer mandar o vídeo?</p>
      <div class="ps-envio">
        <button type="button" class="ps-op" id="ps-b-gravar"><span class="ps-op-ic">${I.cam}</span><b>Gravar agora</b><small>Abre a câmera do celular</small></button>
        <button type="button" class="ps-op" id="ps-b-escolher"><span class="ps-op-ic">${PS_UP_IC}</span><b>Enviar um vídeo</b><small>Da galeria ou de um arquivo que alguém mandou</small></button>
      </div>`;
    document.getElementById('ps-local').value = st.local;
    document.getElementById('ps-fator').value = String(st.fator);
    const ritL = () => {
      const est = document.getElementById('ps-local').value === 'esteira';
      document.getElementById('ps-rit-l').textContent = est ? 'Velocidade da esteira' : 'Pace (min:seg por km)';
      document.getElementById('ps-rit').placeholder = est ? 'Ex.: 10 (km/h)' : 'Ex.: 6:00';
    };
    ritL();
    document.getElementById('ps-local').onchange = ritL;
    const pegar = (inp) => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      st.local = document.getElementById('ps-local').value;
      st.fator = +document.getElementById('ps-fator').value || 1;
      st.ritmo = document.getElementById('ps-rit').value.trim();
      if (st.ritmo && !psRitmoKmh(st.ritmo))
        return toast(
          st.local === 'esteira' ? 'Confira a velocidade, em km/h (ex.: 10).' : 'Confira o pace (ex.: 6:00).',
          true,
        );
      const a = num(document.getElementById('ps-alt').value);
      st.altura = a ? Math.round(a < 3 ? a * 100 : a) : null;
      if (!(st.altura >= 120 && st.altura <= 230)) return toast('Confira a altura, em centímetros (ex.: 172).', true);
      if (st.url) URL.revokeObjectURL(st.url);
      st.url = URL.createObjectURL(f);
      passo3();
    };
    ['gravar', 'escolher'].forEach((k) => {
      const inp = document.getElementById('ps-' + k);
      document.getElementById('ps-b-' + k).onclick = () => inp.click();
      inp.onchange = () => pegar(inp);
    });
    window.scrollTo(0, 0);
  };
  const passo3 = () => {
    $app.innerHTML = `${topo}<h1 class="h1">Escolha o trecho</h1>
      <p class="muted" style="margin-top:6px">Até ${psDurTrecho(st.fator)} segundos${st.fator > 1 ? ' de vídeo (em câmera lenta)' : ''}, com o corpo inteiro na imagem e correndo no ritmo de sempre.</p>
      <div class="ps-video"><video id="ps-v" src="${st.url}" playsinline muted preload="auto"></video><div class="ps-carr" id="ps-carr"><span class="ps-spin"></span><small>Carregando o vídeo…</small></div></div>
      <div class="field"><span id="ps-tr-t">Trecho</span><input type="range" id="ps-ini" min="0" max="0" step="0.1" value="0" class="ps-range"></div>
      <button class="btn block" id="ps-analisar" disabled>Analisar</button>
      <button class="link-btn small" id="ps-trocar" style="margin-top:10px">Trocar o vídeo</button>`;
    const v = document.getElementById('ps-v'),
      r = document.getElementById('ps-ini'),
      tt = document.getElementById('ps-tr-t');
    const atual = () => {
      st.ini = +r.value;
      st.fim = Math.min(v.duration, st.ini + psDurTrecho(st.fator));
      tt.textContent = `Trecho: de ${f1(st.ini, 1)} s a ${f1(st.fim, 1)} s`;
    };
    const tiraCarr = () => document.getElementById('ps-carr') && document.getElementById('ps-carr').remove();
    v.onloadeddata = tiraCarr;
    v.onloadedmetadata = () => {
      setTimeout(tiraCarr, 1500);
      if (!isFinite(v.duration) || v.duration < 2) {
        tt.textContent = 'Vídeo muito curto. Grave pelo menos 5 segundos.';
        return;
      }
      if (v.videoWidth * v.videoHeight > 2200 * 2200) toast('Vídeo muito grande: a análise pode demorar.', false);
      r.max = Math.max(0, v.duration - psDurTrecho(st.fator)).toFixed(1);
      r.value = Math.min(1, +r.max).toFixed(1);
      atual();
      v.currentTime = st.ini;
      document.getElementById('ps-analisar').disabled = false;
    };
    v.onerror = () => {
      tiraCarr();
      tt.textContent = 'Este vídeo não abriu no navegador. Tente gravar de novo ou em outro formato.';
    };
    r.oninput = () => {
      atual();
      v.currentTime = st.ini;
    };
    document.getElementById('ps-trocar').onclick = passo2;
    document.getElementById('ps-analisar').onclick = () => passo4(v);
    window.scrollTo(0, 0);
  };
  const passo4 = async (v) => {
    $app.innerHTML = `${topo}<h1 class="h1">Analisando a sua passada</h1>
      <div class="card ps-prog">
        <div class="ps-etapas">
          <div class="ps-et" data-e="1"><span class="ps-et-ic"></span><div class="grow"><b>Preparando a análise</b><small id="ps-e1">Na primeira vez, o celular baixa o modelo de pontos do corpo</small></div></div>
          <div class="ps-et" data-e="2"><span class="ps-et-ic"></span><div class="grow"><b>Encontrando os pontos do corpo</b><small id="ps-e2">Quadro a quadro do trecho escolhido</small></div></div>
          <div class="ps-et" data-e="3"><span class="ps-et-ic"></span><div class="grow"><b>Medindo e marcando os quadros</b><small>Apoios do pé, ângulos e cadência</small></div></div>
        </div>
        <div class="ps-barra"><i id="ps-p-b"></i></div><p class="ps-pct" id="ps-pct">0%</p>
        <p class="tiny dim" style="margin-top:6px">Deixe esta tela aberta. Leva de 20 segundos a 1 minuto.</p></div>
      <div class="ps-video ps-video-an"><canvas class="ps-vivo" id="ps-vivo"></canvas></div>`;
    $app.querySelector('.ps-video').prepend(v);
    const vivo = document.getElementById('ps-vivo');
    const pt = document.getElementById('ps-e2'),
      pb = document.getElementById('ps-p-b'),
      pc = document.getElementById('ps-pct');
    // barra única: 0–25% preparar, 25–92% pontos do corpo, 92–100% marcar os quadros
    const barra = (f) => {
      const v2 = Math.round(Math.max(0, Math.min(1, f)) * 100);
      pb.style.width = v2 + '%';
      pc.textContent = v2 + '%';
    };
    const etapa = (n) =>
      $app.querySelectorAll('.ps-et').forEach((el) => {
        const e = +el.dataset.e;
        el.classList.toggle('feita', e < n);
        el.classList.toggle('agora', e === n);
      });
    etapa(1);
    let res;
    try {
      await psMotor((f) => {
        barra(f * 0.25);
        document.getElementById('ps-e1').textContent = `Baixando o modelo de pontos do corpo: ${Math.round(f * 100)}%`;
      });
      barra(0.25);
      etapa(2);
      res = await psProcessar(
        v,
        st.ini,
        st.fim,
        (p, q, W, H) => {
          barra(0.25 + p * 0.67);
          pt.textContent = `Quadro a quadro: ${Math.round(p * 100)}%`;
          psDesenhaVivo(vivo, v, q, W, H);
        },
        st.fator,
      );
      etapa(3);
      barra(0.93);
    } catch (e) {
      console.error(e);
      const pe = $app.querySelector('.ps-pct');
      pe.textContent =
        'Não foi possível analisar neste aparelho. Verifique a internet (na primeira vez o modelo é baixado) e tente de novo.';
      pe.classList.add('erro');
      pe.insertAdjacentHTML(
        'afterend',
        '<button class="btn ghost sm" id="ps-tentar" style="margin-top:10px">Tentar de novo</button>',
      );
      document.getElementById('ps-tentar').onclick = () => passo4(v);
      return;
    }
    const analisar = () =>
      st.vista === 'lado' ? psAnalisarLado(res.fr, st.altura) : psAnalisarTras(res.fr, st.altura);
    let an = analisar();
    // vídeo em câmera lenta marcado como normal: a cadência sai baixa demais; o app corrige o tempo sozinho
    let fatorAuto = 1;
    if (st.fator === 1) {
      fatorAuto = psSugereFator(an.cadBruta);
      if (fatorAuto > 1) {
        res.fr.forEach((f) => (f.t = +(f.t / fatorAuto).toFixed(5)));
        res.fps *= fatorAuto;
        an = analisar();
        an.qualidade.avisos.push('camera_lenta_detectada');
      }
    }
    an.altura = st.altura;
    // quadros marcados: de lado, o toque do pé e o meio do apoio; por trás, o meio do apoio de cada pé
    const escolhidos = [];
    if (an.vista === 'lado' && an.apoios.length) {
      const a = an.apoios[Math.min(1, an.apoios.length - 1)];
      escolhidos.push([a.ic, 'contato', 'Toque do pé no chão', a], [a.meio, 'apoio', 'Meio do apoio', a]);
    } else if (an.vista === 'tras') {
      const a = an.apoiosE[Math.min(1, an.apoiosE.length - 1)],
        b = an.apoiosD[Math.min(1, an.apoiosD.length - 1)];
      if (a) escolhidos.push([a.meio, 'E', 'Apoio no pé esquerdo', a]);
      if (b) escolhidos.push([b.meio, 'D', 'Apoio no pé direito', b]);
    }
    const imgs = [],
      tiras = [];
    for (const [i, tipo, legenda, ap] of escolhidos)
      try {
        const cv = await psQuadro(v, res.fr[i], tipo, an);
        imgs.push({ cv, legenda, tipo });
        // quadros em volta deste momento, guardados para o treinador conferir e corrigir os pontos
        let ids;
        if (tipo === 'contato') ids = [-3, -2, -1, 0, 1, 2, 3].map((d) => i + d);
        else {
          const n = Math.min(7, ap.to - ap.ic + 1);
          ids = Array.from({ length: n }, (_, k) => Math.round(ap.ic + ((ap.to - ap.ic) * k) / Math.max(1, n - 1)));
          if (!ids.includes(i)) ids[Math.floor(n / 2)] = i;
        }
        ids = [...new Set(ids.filter((k) => k >= 0 && k < res.fr.length))].sort((x, y) => x - y);
        tiras.push({
          ...(await psTira(v, res.fr, ids)),
          centro: ids.indexOf(i),
          tipo,
          legenda,
          quadro: imgs.length - 1,
        });
      } catch (e) {
        console.error(e);
      }
    const metricas = {};
    Object.entries(an.m).forEach(([k, val]) => val != null && isFinite(val) && (metricas[k] = +val.toFixed(2)));
    const r2 = (o) => {
      const r = {};
      Object.entries(o || {}).forEach(([k, val]) => val != null && isFinite(val) && (r[k] = +val.toFixed(2)));
      return r;
    };
    const kmh = psRitmoKmh(st.ritmo);
    const fator = st.fator > 1 ? st.fator : fatorAuto;
    const reg = {
      vista: st.vista,
      local: st.local,
      metricas,
      qualidade: { ...an.qualidade, fps: res.fps, altura: st.altura },
      serie: psSerie(res.fr, an),
      criado_em: new Date().toISOString(),
      extra: {
        ritmo: kmh ? { kmh: +kmh.toFixed(2) } : null,
        camera: { fator, fps: res.fps, auto: fatorAuto > 1 },
        lados: an.vista === 'tras' ? { E: r2(an.lados.E), D: r2(an.lados.D) } : null,
        an: { vista: an.vista, lado: an.lado, dir: an.dir, troca: an.troca, altura: st.altura },
        ajustes: {},
      },
    };
    reg._tiras = tiras;
    psResultadoLocal(reg, imgs, alunoId, voltar, nomeAluno, () => passo3());
  };
  passo1();
}
// resultado antes de salvar: mostra tudo e pergunta se envia
async function psResultadoLocal(reg, imgs, alunoId, voltar, nomeAluno, refazer) {
  const lista = await psListar(alunoId);
  const ant = lista.find((x) => x.vista === reg.vista);
  const urls = {};
  imgs.forEach((im, i) => {
    im.url = im.cv.toDataURL('image/jpeg', 0.85);
    urls['local-' + i] = im.url;
  });
  const x = { ...reg, quadros: imgs.map((im, i) => ({ path: 'local-' + i, legenda: im.legenda })) };
  const ruim = !(reg.qualidade && reg.qualidade.ok);
  const q = reg.qualidade || {};
  $app.innerHTML = S.staff
    ? `<a class="back" href="${voltar}">${I.back} Análise da passada</a><p class="eyebrow">Resultado${nomeAluno ? ' · ' + esc(firstName(nomeAluno)) : ''}</p><h1 class="h1">Passada analisada</h1>
    ${psDetalheHTML(x, urls, ant, true, true)}`
    : `<a class="back" href="${voltar}">${I.back} Análise da passada</a><p class="eyebrow">Vídeo analisado</p><h1 class="h1">Pronto para enviar</h1>
    <p class="muted" style="margin-top:6px">O app encontrou os pontos do seu corpo. Agora o seu treinador olha tudo com calma e te manda um relatório.</p>
    ${(q.avisos || []).length ? `<div class="ps-avisos" style="margin-top:12px">${q.avisos.map((a) => `<p class="small">${esc(PS_AVISO_TXT[a] || '')}</p>`).join('')}</div>` : ''}
    ${reg.serie ? '<div class="card ps-replay"><span class="eyebrow">Sua passada em movimento</span><canvas id="ps-rp"></canvas><p class="tiny dim">Esqueleto de duas passadas, em câmera lenta.</p></div>' : ''}`;
  $app.insertAdjacentHTML(
    'beforeend',
    `<div class="row" style="gap:8px;margin-top:14px"><button class="btn grow" id="ps-enviar">${S.staff ? 'Salvar na ficha do aluno' : 'Enviar para o treinador'}</button><button class="btn ghost grow" id="ps-refazer">Refazer</button></div>
    ${ruim ? '<p class="small" style="margin-top:8px;color:var(--warn,#d97706)">O vídeo não ficou ideal. Dá para enviar assim mesmo, mas fica mais certo gravando de novo com as dicas.</p>' : ''}`,
  );
  psLigarQuadros($app);
  psReplay(document.getElementById('ps-rp'), reg.serie);
  document.getElementById('ps-refazer').onclick = refazer;
  document.getElementById('ps-enviar').onclick = async (e) => {
    const bt = e.currentTarget;
    bt.disabled = true;
    bt.textContent = 'Salvando…';
    const id = crypto.randomUUID();
    const quadros = [];
    for (let i = 0; i < imgs.length; i++) {
      const blob = await new Promise((ok) => imgs[i].cv.toBlob(ok, 'image/jpeg', 0.85));
      const path = `${S.org.id}/${alunoId}/passada/${id}-${i}.jpg`;
      const { error } = await sb.storage
        .from('nx-fotos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (!error) quadros.push({ path, legenda: imgs[i].legenda });
    }
    const conferir = [];
    for (let i = 0; i < (reg._tiras || []).length; i++) {
      const t = reg._tiras[i];
      bt.textContent = `Salvando… ${i + 1} de ${reg._tiras.length}`;
      const blob = await new Promise((ok) => t.cv.toBlob(ok, 'image/jpeg', 0.8));
      const path = `${S.org.id}/${alunoId}/passada/${id}-tira-${i}.jpg`;
      const { error } = await sb.storage
        .from('nx-fotos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (!error)
        conferir.push({
          path,
          tipo: t.tipo,
          legenda: t.legenda,
          n: t.n,
          w: t.w,
          h: t.h,
          pts: t.pts,
          tempos: t.tempos,
          centro: t.centro,
          quadro: t.quadro,
        });
    }
    const { error } = await sb.from('nx_passadas').insert({
      id,
      org_id: S.org.id,
      aluno_id: alunoId,
      vista: reg.vista,
      local: reg.local,
      metricas: reg.metricas,
      qualidade: reg.qualidade,
      serie: reg.serie,
      quadros,
      extra: { ...reg.extra, conferir },
    });
    if (error) {
      bt.disabled = false;
      bt.textContent = S.staff ? 'Salvar na ficha do aluno' : 'Enviar para o treinador';
      return toast('Não foi possível salvar. Tente de novo.', true);
    }
    if (!S.staff) notificar('passada_nova', id);
    toast(S.staff ? 'Análise salva na ficha.' : 'Enviado! Seu treinador foi avisado.');
    location.hash = S.staff ? `#/aluno/${alunoId}/passada/${id}` : `#/passada/${id}`;
  };
  window.scrollTo(0, 0);
}
function psIlustra(vista) {
  // cena simples: celular no tripé filmando, corredor na esteira (de perfil ou de costas)
  const corredorLado =
    '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<path d="M131 40 120 52 109 50" stroke-width="7" opacity=".38"/>' +
    '<path d="M124 66 113 80 99 79" stroke-width="8" opacity=".38"/>' +
    '<path d="M124 66 134 37" stroke-width="10"/>' +
    '<path d="M131 40 142 52 152 45" stroke-width="7"/>' +
    '<path d="M124 66 139 79 136 97 144 98" stroke-width="8"/>' +
    '</g><circle cx="139" cy="24" r="8" fill="currentColor"/>';
  const corredorTras =
    '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
    '<path d="M109 41 117 54 113 64" stroke-width="7" opacity=".38"/>' +
    '<path d="M108 66 112 82 111 92" stroke-width="8" opacity=".38"/>' +
    '<path d="M92 66 108 66" stroke-width="9"/>' +
    '<path d="M100 66 100 38" stroke-width="12"/>' +
    '<path d="M89 39 111 39" stroke-width="8"/>' +
    '<path d="M91 41 83 54 87 64" stroke-width="7"/>' +
    '<path d="M92 66 89 83 90 101" stroke-width="8"/>' +
    '</g><circle cx="100" cy="24" r="8.5" fill="currentColor"/>';
  const tripe = (x, y) =>
    `<g stroke="currentColor" stroke-linecap="round" stroke-width="2.4" fill="none" opacity=".55"><path d="M${x} ${y} v14 M${x} ${y + 14} l-9 13 M${x} ${y + 14} l9 13"/></g>`;
  return vista === 'lado'
    ? `<svg class="ps-il" viewBox="0 0 200 120" aria-hidden="true">
        <path d="M37 60 L106 14 L106 112 Z" fill="currentColor" opacity=".08"/>
        <path d="M37 60 H104" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 5" opacity=".45"/>
        ${tripe(30, 76)}
        <rect x="23" y="44" width="15" height="31" rx="3.5" fill="currentColor"/><circle cx="35" cy="50" r="1.8" fill="var(--s1,#fff)"/>
        <path d="M92 104 H178 a5 5 0 0 1 0 10 H92 a5 5 0 0 1 0 -10 Z" fill="currentColor" opacity=".22"/>
        <path d="M174 104 L166 62 H156" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".45"/>
        ${corredorLado}
      </svg>`
    : `<svg class="ps-il" viewBox="0 0 200 120" aria-hidden="true">
        <path d="M100 96 L68 4 L132 4 Z" fill="currentColor" opacity=".08"/>
        <path d="M100 94 V8" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 5" opacity=".45"/>
        <path d="M72 76 H128 L136 86 H64 Z" fill="currentColor" opacity=".22"/>
        <g transform="translate(20,-7) scale(.8)">${corredorTras}</g>
        <g stroke="currentColor" stroke-linecap="round" stroke-width="2.4" fill="none" opacity=".55"><path d="M100 106 v5 M100 111 l-8 8 M100 111 l8 8"/></g>
        <rect x="92" y="93" width="16" height="13" rx="3" fill="currentColor"/><circle cx="100" cy="99.5" r="2.4" fill="var(--s1,#fff)"/>
      </svg>`;
}

// tela do aluno: #/passada, #/passada/nova, #/passada/<id>
async function viewPassada(sub) {
  loading();
  dockAluno();
  if (sub === 'nova') return psNova(S.user.id, '#/passada');
  const lista = await psListar(S.user.id);
  if (sub) {
    const x = lista.find((y) => y.id === sub);
    if (!x)
      return ($app.innerHTML = `<a class="back" href="#/passada">${I.back} Análise da passada</a><p class="muted">Análise não encontrada.</p>`);
    const topoA = `<a class="back" href="#/passada">${I.back} Análise da passada</a><p class="eyebrow">${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${psDataHora(x.criado_em)}</p><h1 class="h1">Sua passada</h1>`;
    if (x.relatorio_path) {
      // relatório enviado: o aluno vê tudo aqui na aba e pode baixar o PDF
      const ant = lista.find((y) => y.vista === x.vista && y.criado_em < x.criado_em && y.relatorio_path);
      const urls = await psUrls([x]);
      $app.innerHTML = `${topoA}
        <div class="card ps-rel pronto"><span class="eyebrow">Relatório do seu treinador</span><p class="small muted" style="margin-top:2px">Enviado em ${fmtDia(x.relatorio_em || x.comentado_em)}</p>
          ${x.comentario ? `<p style="margin-top:10px;white-space:pre-line">${esc(x.comentario)}</p>` : ''}
          <button class="btn block" id="ps-baixar" style="margin-top:14px">${PS_UP_IC.replace('M12 15V4', 'M12 4v11').replace('m7 9 5-5 5 5', 'm7 10 5 5 5-5')} Baixar o relatório (PDF)</button></div>
        ${ant ? `<button class="btn ghost block" id="ps-ad" style="margin-top:12px">Ver antes e depois (${fmtDia(ant.criado_em)})</button>` : ''}
        ${psQuadrosHTML(x, urls)}
        ${x.serie ? '<div class="card ps-replay"><span class="eyebrow">Sua passada em movimento</span><canvas id="ps-rp"></canvas><p class="tiny dim">Esqueleto de duas passadas, em câmera lenta.</p></div>' : ''}
        <p class="eyebrow" style="margin-top:18px">As medidas</p>
        ${psCardsMetricas(x, ant, false)}
        ${psLadosHTML(x, false)}
        <p class="tiny dim" style="margin-top:12px">Medidas feitas pelo celular a partir do vídeo (2D), aproximadas e sensíveis ao ângulo da câmera. Quem interpreta é o seu treinador. Baseado em Souza (2016), Heiderscheit et al. (2011) e Bramah et al. (2018).</p>`;
      psLigarQuadros($app);
      const bAd = document.getElementById('ps-ad');
      if (bAd) bAd.onclick = () => psComparar($app, ant, x, () => viewPassada(sub), false);
      document.getElementById('ps-baixar').onclick = async (e) => {
        const bt = e.currentTarget;
        const txt = bt.innerHTML;
        bt.disabled = true;
        bt.textContent = 'Baixando…';
        try {
          const { data, error } = await sb.storage.from('nx-fotos').download(x.relatorio_path);
          if (error || !data) throw error || new Error('sem arquivo');
          const nome = `Analise-da-passada-${x.criado_em.slice(0, 10)}.pdf`;
          const arq = new File([data], nome, { type: 'application/pdf' });
          // no celular, abre o menu de compartilhar (salvar em arquivos); no computador, baixa direto
          if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [arq] }))
            await navigator.share({ files: [arq], title: nome }).catch(() => {});
          else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(arq);
            a.download = nome;
            a.click();
          }
        } catch (err) {
          console.error(err);
          toast('Não foi possível baixar agora. Tente de novo.', true);
        }
        bt.disabled = false;
        bt.innerHTML = txt;
      };
    } else
      $app.innerHTML = `${topoA}
        <div class="card ps-rel"><span class="eyebrow">Com o seu treinador</span><p style="margin-top:6px">Seu treinador está analisando o vídeo e vai te mandar o relatório aqui mesmo. Você recebe uma notificação quando ficar pronto.</p></div>
        ${x.serie ? '<div class="card ps-replay"><span class="eyebrow">Sua passada em movimento</span><canvas id="ps-rp"></canvas><p class="tiny dim">Esqueleto de duas passadas, em câmera lenta.</p></div>' : ''}`;
    psReplay(document.getElementById('ps-rp'), x.serie);
    if ((x.comentario || x.relatorio_path) && !x.visto_em)
      sb.rpc('nx_passada_vista', { p_id: x.id }).then(
        () => {},
        () => {},
      );
    return;
  }
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Corrida</p><h1 class="h1">Análise da passada</h1>
    <p class="muted" style="margin-top:6px">Filme 10 segundos da sua corrida e mande para o seu treinador. Ele analisa a sua passada e o relatório aparece aqui, com o PDF para baixar.</p>
    <a class="btn block" href="#/passada/nova" style="margin-top:14px">${I.cam} Nova análise</a>
    ${psListaHTML(lista, '#/passada/')}`;
}
function psListaHTML(lista, base) {
  if (!lista.length)
    return '<div class="card" style="margin-top:14px"><p class="small muted">Nenhuma análise ainda. A primeira serve de base para comparar depois.</p></div>';
  return `<div class="stack" style="margin-top:14px">${lista
    .map((x) => {
      if (!S.staff)
        return `<a class="list-item" href="${base}${x.id}" style="color:inherit"><span class="ativ-ic">${PS_IC}</span><div class="grow"><b>${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${fmtDia(x.criado_em)}</b><div class="small muted">${x.relatorio_path ? 'Relatório enviado pelo treinador' : 'Com o treinador'}</div></div>${x.relatorio_path ? `<span class="tag ok">${x.visto_em ? 'Relatório' : 'Novo'}</span>` : '<span class="tag">Aguardando</span>'}${I.chev}</a>`;
      const m = psFinais(x).m;
      const k = x.vista === 'lado' ? 'cadencia' : 'queda';
      const ruins = (PS_ORDEM[x.vista] || []).filter((c) => ['atencao', 'fora'].includes(psNivel(c, m[c]))).length;
      return `<a class="list-item" href="${base}${x.id}" style="color:inherit"><span class="ativ-ic">${PS_IC}</span><div class="grow"><b>${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${fmtDia(x.criado_em)}</b><div class="small muted">${m[k] != null ? `${PS_TITULO[k]} ${psFmt(k, m[k])} ${psUn(k)}` : ''}${ruins ? ` · ${ruins} ponto${ruins > 1 ? 's' : ''} para ajustar` : ' · tudo dentro do comum'}</div></div>${x.relatorio_path ? '<span class="tag ok">Relatório enviado</span>' : '<span class="tag">Sem relatório</span>'}${I.chev}</a>`;
    })
    .join('')}</div>`;
}

// ficha do aluno no app do treinador: lista, nova análise e detalhe com comentário
async function psTreinador(box, m, sub) {
  const alunoId = m.user_id;
  const base = `#/aluno/${alunoId}/passada`;
  if (sub === 'nova') return psNova(alunoId, base, m.nome);
  const lista = await psListar(alunoId);
  if (sub) {
    const x = lista.find((y) => y.id === sub);
    if (!x) return (box.innerHTML = '<p class="muted">Análise não encontrada.</p>');
    const ant = lista.find((y) => y.vista === x.vista && y.criado_em < x.criado_em);
    const outras = lista.filter((y) => y.vista === x.vista && y.id !== x.id);
    const urls = await psUrls([x]);
    const reabrir = () => psTreinador(box, m, sub);
    box.innerHTML = `<a class="back" href="${base}">${I.back} Todas as análises</a>${psDetalheHTML(x, urls, ant, true, false, outras)}`;
    psLigarQuadros(box);
    psReplay(document.getElementById('ps-rp'), x.serie);
    box.querySelectorAll('.ps-conf-it').forEach((b) => (b.onclick = () => psConferir(box, x, +b.dataset.i, reabrir)));
    const cmp = document.getElementById('ps-comp-ir');
    if (cmp)
      cmp.onclick = () => {
        const o = outras.find((y) => y.id === document.getElementById('ps-comp-sel').value);
        if (o) psComparar(box, o, x, reabrir, true);
      };
    const rit = document.getElementById('ps-rit-ed');
    if (rit)
      rit.onclick = () =>
        openSheet(
          `<p class="eyebrow">Análise da passada</p><div class="h2" style="margin-top:4px">Ritmo do vídeo</div><p class="small muted" style="margin-top:6px">Velocidade da esteira em km/h (ex.: 10) ou pace em min:seg por km (ex.: 6:00).</p><input class="input" id="ps-rit-v" inputmode="decimal" style="margin-top:12px"><button class="btn block" id="ps-rit-ok" style="margin-top:12px">Salvar</button>`,
          (r) => {
            r.querySelector('#ps-rit-ok').onclick = async () => {
              const kmh = psRitmoKmh(r.querySelector('#ps-rit-v').value);
              if (!kmh) return toast('Confira o ritmo (ex.: 10 ou 6:00).', true);
              const extra = { ...(x.extra || {}), ritmo: { kmh: +kmh.toFixed(2) } };
              const { error } = await sb.from('nx_passadas').update({ extra }).eq('id', x.id);
              if (error) return toast('Não foi possível salvar.', true);
              x.extra = extra;
              closeSheet();
              reabrir();
            };
          },
        );
    const ta = document.getElementById('ps-txt');
    cartaoSugestao(document.getElementById('ps-sug'), {
      chave: 'sug:passada:' + x.id,
      titulo: 'Sugestão de comentário',
      texto: x.comentario ? '' : psSugestao(x, m.nome),
      destino: 'Vai para o campo do comentário, para você editar e enviar.',
      usar: (t) => {
        ta.value = t;
        ta.focus();
      },
    });
    const ver = document.getElementById('ps-ver-rel');
    if (ver)
      ver.onclick = async (e) => {
        e.preventDefault();
        const w = window.open('', '_blank');
        const { data } = await sb.storage.from('nx-fotos').createSignedUrl(x.relatorio_path, 600);
        if (data && data.signedUrl) {
          if (w) w.location = data.signedUrl;
          else location.href = data.signedUrl;
        } else if (w) w.close();
      };
    document.getElementById('ps-salvar').onclick = async (e) => {
      const t = ta.value.trim();
      if (!t) return toast('Escreva o seu comentário para o relatório.', true);
      const bt = e.currentTarget;
      const txt = bt.textContent;
      bt.disabled = true;
      bt.textContent = 'Gerando o PDF…';
      try {
        const blob = await psRelatorioPdf({ ...x, comentario: t }, urls, ant, m);
        bt.textContent = 'Enviando…';
        // arquivo novo a cada envio (o armazenamento não deixa substituir); o anterior é apagado depois
        const path = `${x.org_id}/${alunoId}/passada/${x.id}-relatorio-${Date.now().toString(36)}.pdf`;
        const up = await sb.storage.from('nx-fotos').upload(path, blob, { contentType: 'application/pdf' });
        if (up.error) throw up.error;
        const velho = x.relatorio_path;
        const agora = new Date().toISOString();
        const { error } = await sb
          .from('nx_passadas')
          .update({
            comentario: t,
            comentado_em: agora,
            comentado_por: S.user.id,
            relatorio_path: path,
            relatorio_em: agora,
            visto_em: null,
          })
          .eq('id', x.id);
        if (error) throw error;
        notificar('passada', x.id);
        if (velho && velho !== path)
          sb.storage
            .from('nx-fotos')
            .remove([velho])
            .then(
              () => {},
              () => {},
            );
        Object.assign(x, { comentario: t, relatorio_path: path, relatorio_em: agora });
        const nomeArq = `Analise-da-passada-${firstName(m.nome || 'aluno')}-${x.criado_em.slice(0, 10)}.pdf`;
        const arq = new File([blob], nomeArq, { type: 'application/pdf' });
        const tel = telWa(m.telefone);
        openSheet(
          `<p class="eyebrow">Análise da passada</p><div class="h2" style="margin-top:4px">Relatório enviado</div><p class="small muted" style="margin-top:6px">${esc(firstName(m.nome || 'O aluno'))} foi avisado. O relatório já está na aba Análise da passada do app dele, com o PDF para baixar. Se quiser, mande também pelo WhatsApp.</p>
          <div class="stack" style="margin-top:16px">${navigator.canShare && navigator.canShare({ files: [arq] }) ? '<button class="btn block wa-btn" id="ps-share">Compartilhar o PDF (WhatsApp)</button>' : ''}
          <button class="btn ghost block" id="ps-down">Baixar o PDF</button>
          ${tel ? `<a class="btn ghost block" href="https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${firstName(m.nome || '')}! Segue o relatório da análise da sua passada`)}" target="_blank" rel="noopener">Abrir a conversa no WhatsApp</a>` : ''}</div>`,
          (r) => {
            const sh = r.querySelector('#ps-share');
            if (sh)
              sh.onclick = () =>
                navigator.share({ files: [arq], title: nomeArq, text: 'Análise da passada · Nexos' }).catch(() => {});
            r.querySelector('#ps-down').onclick = () => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = nomeArq;
              a.click();
            };
          },
        );
        bt.textContent = 'Gerar de novo e reenviar o relatório';
      } catch (err) {
        console.error(err);
        toast('Não foi possível gerar ou enviar o relatório. Tente de novo.', true);
        bt.textContent = txt;
      }
      bt.disabled = false;
    };
    return;
  }
  box.innerHTML = `<p class="small muted">Vídeo da corrida de lado ou por trás, com cadência, passada, joelho, tronco e quadril medidos pelo celular. O aluno faz pelo app em Mais › Análise da passada, ou você analisa aqui um vídeo que ele mandou ou que você gravou.</p>
    <a class="btn block" href="${base}/nova" style="margin-top:12px">${I.cam} Analisar um vídeo</a>${psListaHTML(lista, base + '/')}`;
}
