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
  const chao = psPercentil(baixo, 0.9);
  if (chao == null || !perna) return [];
  const tol = Math.max(3, perna * 0.035);
  const no = baixo.map((y) => y != null && y >= chao - tol);
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
        frentePx: dir * (c[0] - q[0]),
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
    const seg = yq.slice(ap[k].ic, ap[k + 1].ic + 1).filter((y) => y != null);
    if (seg.length >= 3) osc.push(Math.max(...seg) - Math.min(...seg));
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
    m: {
      cadencia: ciclo ? 120 / ciclo : null,
      tibia: psMediana(porApoio.map((x) => x.tibia)),
      joelhoIC: psMediana(porApoio.map((x) => x.joelhoIC)),
      joelhoMax: psMediana(porApoio.map((x) => x.joelhoMax)),
      frente: psCm(psMediana(porApoio.map((x) => x.frentePx)), perna, alturaCm),
      tronco,
      oscilacao: psCm(psMediana(osc), perna, alturaCm),
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
  const max = (k) => {
    const v = [res.E[k], res.D[k]].filter((x) => x != null);
    return v.length ? Math.max(...v) : null;
  };
  return {
    vista: 'tras',
    troca,
    apoiosE: psApoios(fr, L('E'), pernaMed),
    apoiosD: psApoios(fr, L('D'), pernaMed),
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
  if (razao != null && vista === 'lado' && razao > 0.22) avisos.push('nao_parece_lado');
  if (razao != null && vista === 'tras' && razao < 0.12) avisos.push('nao_parece_tras');
  return { deteccao: det, vis, apoios: nApoios, razao, avisos, ok: !avisos.some((a) => a !== 'pouco_visivel') };
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
let _psMotor = null;
async function psMotor() {
  if (_psMotor) return _psMotor;
  _psMotor = (async () => {
    const mp = await import('/app/vendor/mediapipe/vision_bundle.mjs');
    const files = await mp.FilesetResolver.forVisionTasks('/app/vendor/mediapipe/wasm');
    const opc = (delegate) => ({
      baseOptions: { modelAssetPath: PS_MODELO_URL, delegate },
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
  return f > 90 ? 120 : f > 50 ? 60 : 30;
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
async function psProcessar(v, ini, fim, prog) {
  const motor = await psMotor();
  const fps = Math.min(60, await psFpsVideo(v));
  const passo = 1 / fps;
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
    fr.push({ t: +t.toFixed(4), p });
    if (prog) prog((t - ini) / (fim - ini || 1));
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
  await psBuscar(v, f.t);
  const W = 720,
    sc = W / v.videoWidth,
    H = Math.round(v.videoHeight * sc);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.drawImage(v, 0, 0, W, H);
  ctx.fillStyle = 'rgba(4,10,24,.18)';
  ctx.fillRect(0, 0, W, H);
  const p = f.p;
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
        const cm = psCm(an.dir * (c[0] - q[0]), an.perna, an.altura);
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
  nao_parece_lado:
    'Pelo jeito do vídeo, a câmera não está bem de lado. Grave de perfil para as medidas ficarem certas.',
  nao_parece_tras:
    'Pelo jeito do vídeo, a câmera não está bem atrás. Grave pelas costas para as medidas ficarem certas.',
};
// sugestão de comentário para o treinador, a partir das medidas
function psSugestao(x, nome) {
  const m = x.metricas || {},
    n = firstName(nome || '');
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
      'O quadril e o joelho pedem mais estabilidade, então vou reforçar o glúteo médio e os exercícios de uma perna só no treino de força.',
    );
  if (fora.includes('cruza'))
    partes.push('Em alguns passos o pé cruza a linha do corpo. Imagine correr sobre dois trilhos, um para cada pé.');
  if (!fora.length)
    partes.push(
      'Sua mecânica está muito boa. Vamos manter o trabalho de força para sustentar isso nos treinos longos.',
    );
  partes.push('Daqui a umas 8 semanas a gente grava de novo para comparar.');
  return partes.join(' ');
}

/* ---------- telas ---------- */
const psDataHora = (iso) => `${fmtDia(iso)} · ${fmtHora(iso)}`;
function psCardsMetricas(x, ant) {
  const m = x.metricas || {};
  return `<div class="ps-mets">${(PS_ORDEM[x.vista] || [])
    .filter((k) => m[k] != null)
    .map((k) => {
      const nv = psNivel(k, m[k]) || 'info';
      const ex = PS_EXPLICA[k] || {};
      const d = ant && ant.metricas && ant.metricas[k] != null ? m[k] - ant.metricas[k] : null;
      return `<details class="ps-met ${nv}"><summary><span class="ps-met-t">${PS_TITULO[k]}</span><span class="ps-met-v"><b>${psFmt(k, m[k])}</b>${psUn(k) ? `<small>${psUn(k)}</small>` : ''}</span>${d != null && Math.abs(d) >= (k === 'cruza' ? 0.05 : 0.5) ? `<span class="ps-met-d">${d > 0 ? '+' : '−'}${psFmt(k, Math.abs(d))} desde a última</span>` : ''}<span class="ps-met-x">${esc(ex[nv] || ex.info || '')}</span></summary><p class="small muted">${esc(ex.sobre || '')}</p></details>`;
    })
    .join('')}</div>`;
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
// replay do esqueleto em loop (sem o vídeo)
function psReplay(cv, serie) {
  if (!cv || !serie || !serie.q || !serie.q.length) return;
  const pts = serie.q.filter(Boolean).flat().filter(Boolean);
  if (!pts.length) return;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  const W = (cv.width = 640),
    H = (cv.height = 420);
  const sc = Math.min((W - 60) / (x1 - x0 || 1), (H - 60) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * sc) / 2 - x0 * sc,
    oy = (H - (y1 - y0) * sc) / 2 - y0 * sc;
  const ctx = cv.getContext('2d');
  const idx = {};
  serie.ids.forEach((k, i) => (idx[k] = i));
  let i = 0,
    ult = 0;
  const vel = (serie.fps || 30) / 2; // metade da velocidade, para dar para ver
  const loop = (ts) => {
    if (!document.body.contains(cv)) return;
    if (ts - ult >= 1000 / vel) {
      ult = ts;
      const f = serie.q[i % serie.q.length];
      i++;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(70,214,255,.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, oy + y1 * sc + 8);
      ctx.lineTo(W - 20, oy + y1 * sc + 8);
      ctx.stroke();
      if (f) {
        const p = {};
        Object.entries(PS_P).forEach(([n, k]) => {
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
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function psDetalheHTML(x, urls, ant, staff, previa) {
  const q = x.qualidade || {};
  return `<div class="card ps-topo-card"><div class="row" style="justify-content:space-between;align-items:center;gap:10px"><div><span class="eyebrow">${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${esc(x.local === 'esteira' ? 'Esteira' : x.local === 'rua' ? 'Rua' : 'Vídeo')}</span><div class="h3" style="margin-top:2px">${psDataHora(x.criado_em)}</div></div><span class="ps-selo">${PS_IC}</span></div>
    ${(q.avisos || []).length ? `<div class="ps-avisos">${q.avisos.map((a) => `<p class="small">${esc(PS_AVISO_TXT[a] || '')}</p>`).join('')}</div>` : ''}</div>
    ${psQuadrosHTML(x, urls)}
    ${x.serie ? '<div class="card ps-replay"><span class="eyebrow">Sua passada em movimento</span><canvas id="ps-rp"></canvas><p class="tiny dim">Esqueleto de duas passadas, em câmera lenta.</p></div>' : ''}
    ${psCardsMetricas(x, ant)}
    ${
      previa
        ? ''
        : `<div class="card ps-coment"><span class="eyebrow">Comentário do treinador</span>${
            staff
              ? `<div id="ps-sug"></div><textarea class="textarea" id="ps-txt" rows="5" placeholder="Escreva o que você viu e o que o aluno deve ajustar. Ele vê aqui.">${esc(x.comentario || '')}</textarea><button class="btn sm" id="ps-salvar" style="margin-top:8px">${x.comentario ? 'Atualizar comentário' : 'Enviar comentário ao aluno'}</button>`
              : `<p style="margin-top:6px;white-space:pre-line">${x.comentario ? esc(x.comentario) : 'Seu treinador vai olhar o vídeo e deixar o comentário aqui. Você recebe uma notificação.'}</p>`
          }</div>`
    }
    <p class="tiny dim" style="margin-top:12px">Medidas feitas pelo celular a partir do vídeo (2D), aproximadas e sensíveis ao ângulo da câmera. As faixas são referências gerais: quem interpreta é o seu treinador. Baseado em Souza (2016), Heiderscheit et al. (2011) e Bramah et al. (2018).</p>`;
}

// fluxo de nova análise (aluno ou treinador)
async function psNova(alunoId, voltar, nomeAluno) {
  const altura0 = await psAltura(alunoId);
  const st = { vista: null, local: 'esteira', altura: altura0, url: null, ini: 0, fim: 0 };
  const topo = `<a class="back" href="${voltar}">${I.back} Análise da passada</a><p class="eyebrow">Nova análise${nomeAluno ? ' · ' + esc(firstName(nomeAluno)) : ''}</p>`;
  const passo1 = () => {
    $app.innerHTML = `${topo}<h1 class="h1">Como vai filmar?</h1>
      <div class="ps-vistas">
        <button type="button" class="ps-vista" data-v="lado">${psIlustra('lado')}<b>De lado</b><small>Cadência, passada, joelho, tronco e o quanto você sobe e desce</small></button>
        <button type="button" class="ps-vista" data-v="tras">${psIlustra('tras')}<b>Por trás</b><small>Quadril, joelho para dentro e pé cruzando a linha</small></button>
      </div>
      <p class="small muted" style="margin-top:12px">O ideal é fazer as duas, uma de cada vez. O vídeo não sai do seu celular: só os números e algumas imagens marcadas ficam salvos.</p>`;
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
      <input type="file" accept="video/*" capture="environment" id="ps-gravar" hidden><input type="file" accept="video/*" id="ps-escolher" hidden>
      <div class="row" style="gap:8px;margin-top:14px"><button class="btn grow" id="ps-b-gravar">${I.cam} Gravar agora</button><button class="btn ghost grow" id="ps-b-escolher">Escolher vídeo</button></div>`;
    document.getElementById('ps-local').value = st.local;
    const pegar = (inp) => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      st.local = document.getElementById('ps-local').value;
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
      <p class="muted" style="margin-top:6px">Até 8 segundos, com você correndo e o corpo inteiro na imagem.</p>
      <div class="ps-video"><video id="ps-v" src="${st.url}" playsinline muted preload="auto"></video></div>
      <div class="field"><span id="ps-tr-t">Trecho</span><input type="range" id="ps-ini" min="0" max="0" step="0.1" value="0" class="ps-range"></div>
      <button class="btn block" id="ps-analisar" disabled>Analisar</button>
      <button class="link-btn small" id="ps-trocar" style="margin-top:10px">Trocar o vídeo</button>`;
    const v = document.getElementById('ps-v'),
      r = document.getElementById('ps-ini'),
      tt = document.getElementById('ps-tr-t');
    const atual = () => {
      st.ini = +r.value;
      st.fim = Math.min(v.duration, st.ini + 8);
      tt.textContent = `Trecho: de ${f1(st.ini, 1)} s a ${f1(st.fim, 1)} s`;
    };
    v.onloadedmetadata = () => {
      if (!isFinite(v.duration) || v.duration < 2) {
        tt.textContent = 'Vídeo muito curto. Grave pelo menos 5 segundos.';
        return;
      }
      if (v.videoWidth * v.videoHeight > 2200 * 2200) toast('Vídeo muito grande: a análise pode demorar.', false);
      r.max = Math.max(0, v.duration - 8).toFixed(1);
      r.value = Math.min(1, +r.max).toFixed(1);
      atual();
      v.currentTime = st.ini;
      document.getElementById('ps-analisar').disabled = false;
    };
    v.onerror = () => (tt.textContent = 'Este vídeo não abriu no navegador. Tente gravar de novo ou em outro formato.');
    r.oninput = () => {
      atual();
      v.currentTime = st.ini;
    };
    document.getElementById('ps-trocar').onclick = passo2;
    document.getElementById('ps-analisar').onclick = () => passo4(v);
    window.scrollTo(0, 0);
  };
  const passo4 = async (v) => {
    $app.innerHTML = `${topo}<h1 class="h1">Analisando…</h1>
      <div class="card ps-prog"><p id="ps-p-t">Preparando a análise (na primeira vez, o celular baixa o modelo de pontos do corpo).</p><div class="ps-barra"><i id="ps-p-b"></i></div><p class="tiny dim" style="margin-top:8px">Deixe a tela aberta. Leva de 20 segundos a 1 minuto.</p></div>
      <div class="ps-video" style="opacity:.55"></div>`;
    $app.querySelector('.ps-video').appendChild(v);
    const pt = document.getElementById('ps-p-t'),
      pb = document.getElementById('ps-p-b');
    let res;
    try {
      await psMotor();
      pt.textContent = 'Encontrando os pontos do corpo em cada quadro…';
      res = await psProcessar(v, st.ini, st.fim, (p) => (pb.style.width = Math.round(p * 100) + '%'));
    } catch (e) {
      console.error(e);
      pt.textContent =
        'Não foi possível analisar neste aparelho. Verifique a internet (na primeira vez o modelo é baixado) e tente de novo.';
      pt.insertAdjacentHTML(
        'afterend',
        '<button class="btn ghost sm" id="ps-tentar" style="margin-top:10px">Tentar de novo</button>',
      );
      document.getElementById('ps-tentar').onclick = () => passo4(v);
      return;
    }
    const an = st.vista === 'lado' ? psAnalisarLado(res.fr, st.altura) : psAnalisarTras(res.fr, st.altura);
    an.altura = st.altura;
    pt.textContent = 'Marcando os quadros…';
    // quadros marcados: de lado, o toque do pé e o meio do apoio; por trás, o meio do apoio de cada pé
    const escolhidos = [];
    if (an.vista === 'lado' && an.apoios.length) {
      const a = an.apoios[Math.min(1, an.apoios.length - 1)];
      escolhidos.push([a.ic, 'contato', 'Toque do pé no chão'], [a.meio, 'apoio', 'Meio do apoio']);
    } else if (an.vista === 'tras') {
      const a = an.apoiosE[Math.min(1, an.apoiosE.length - 1)],
        b = an.apoiosD[Math.min(1, an.apoiosD.length - 1)];
      if (a) escolhidos.push([a.meio, 'E', 'Apoio no pé esquerdo']);
      if (b) escolhidos.push([b.meio, 'D', 'Apoio no pé direito']);
    }
    const imgs = [];
    for (const [i, tipo, legenda] of escolhidos)
      try {
        const cv = await psQuadro(v, res.fr[i], tipo, an);
        imgs.push({ cv, legenda, tipo });
      } catch (e) {
        console.error(e);
      }
    const metricas = {};
    Object.entries(an.m).forEach(([k, val]) => val != null && isFinite(val) && (metricas[k] = +val.toFixed(2)));
    const reg = {
      vista: st.vista,
      local: st.local,
      metricas,
      qualidade: { ...an.qualidade, fps: res.fps, altura: st.altura },
      serie: psSerie(res.fr, an),
      criado_em: new Date().toISOString(),
    };
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
  $app.innerHTML = `<a class="back" href="${voltar}">${I.back} Análise da passada</a><p class="eyebrow">Resultado${nomeAluno ? ' · ' + esc(firstName(nomeAluno)) : ''}</p><h1 class="h1">Sua passada</h1>
    ${psDetalheHTML(x, urls, ant, false, true)}
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn grow" id="ps-enviar">${S.staff ? 'Salvar na ficha do aluno' : 'Enviar para o treinador'}</button><button class="btn ghost grow" id="ps-refazer">Refazer</button></div>
    ${ruim ? '<p class="small" style="margin-top:8px;color:var(--warn,#d97706)">O vídeo não ficou ideal para todas as medidas. Dá para enviar assim mesmo, mas o resultado fica mais certo gravando de novo com as dicas acima.</p>' : ''}`;
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
  // desenho simples: celular parado, pessoa correndo de lado ou de costas
  return vista === 'lado'
    ? '<svg class="ps-il" viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="44" width="16" height="28" rx="3"/><path d="M16 72v10M10 82h12"/><path d="M28 58h60" stroke-dasharray="3 5" opacity=".5"/><circle cx="112" cy="16" r="6"/><path d="m110 24-6 22 10 10-4 18"/><path d="m104 46-12 6-6-4"/><path d="M110 24l10 12 10-2"/><path d="M114 56l14 4 4 12"/><path d="M80 84h76"/></svg>'
    : '<svg class="ps-il" viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="72" y="62" width="16" height="22" rx="3"/><circle cx="80" cy="10" r="6"/><path d="M80 18v26M66 28l14-6 14 6M70 44h20"/><path d="m72 44-3 18 2 10M88 44l3 16-2 12"/><path d="M80 44v36" stroke-dasharray="3 5" opacity=".5"/><path d="M30 86h100"/></svg>';
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
    const ant = lista.find((y) => y.vista === x.vista && y.criado_em < x.criado_em);
    const urls = await psUrls([x]);
    $app.innerHTML = `<a class="back" href="#/passada">${I.back} Análise da passada</a><h1 class="h1">Sua passada</h1>${psDetalheHTML(x, urls, ant, false)}`;
    psLigarQuadros($app);
    psReplay(document.getElementById('ps-rp'), x.serie);
    if (x.comentario && !x.visto_em)
      sb.rpc('nx_passada_vista', { p_id: x.id }).then(
        () => {},
        () => {},
      );
    return;
  }
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Corrida</p><h1 class="h1">Análise da passada</h1>
    <p class="muted" style="margin-top:6px">Filme 10 segundos da sua corrida e o app mede a sua cadência, a passada, o joelho, o tronco e o quadril. O seu treinador comenta em cima.</p>
    <a class="btn block" href="#/passada/nova" style="margin-top:14px">${I.cam} Nova análise</a>
    ${psListaHTML(lista, '#/passada/')}`;
}
function psListaHTML(lista, base) {
  if (!lista.length)
    return '<div class="card" style="margin-top:14px"><p class="small muted">Nenhuma análise ainda. A primeira serve de base para comparar depois.</p></div>';
  return `<div class="stack" style="margin-top:14px">${lista
    .map((x) => {
      const m = x.metricas || {};
      const k = x.vista === 'lado' ? 'cadencia' : 'queda';
      const ruins = (PS_ORDEM[x.vista] || []).filter((c) => ['atencao', 'fora'].includes(psNivel(c, m[c]))).length;
      return `<a class="list-item" href="${base}${x.id}" style="color:inherit"><span class="ativ-ic">${PS_IC}</span><div class="grow"><b>${x.vista === 'lado' ? 'De lado' : 'Por trás'} · ${fmtDia(x.criado_em)}</b><div class="small muted">${m[k] != null ? `${PS_TITULO[k]} ${psFmt(k, m[k])} ${psUn(k)}` : ''}${ruins ? ` · ${ruins} ponto${ruins > 1 ? 's' : ''} para ajustar` : ' · tudo dentro do comum'}</div></div>${x.comentario ? '<span class="tag ok">Comentado</span>' : '<span class="tag">Aguardando</span>'}${I.chev}</a>`;
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
    const urls = await psUrls([x]);
    box.innerHTML = `<a class="back" href="${base}">${I.back} Todas as análises</a>${psDetalheHTML(x, urls, ant, true)}`;
    psLigarQuadros(box);
    psReplay(document.getElementById('ps-rp'), x.serie);
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
    document.getElementById('ps-salvar').onclick = async (e) => {
      const t = ta.value.trim();
      if (!t) return toast('Escreva o comentário.', true);
      e.currentTarget.disabled = true;
      const { error } = await sb
        .from('nx_passadas')
        .update({ comentario: t, comentado_em: new Date().toISOString(), comentado_por: S.user.id, visto_em: null })
        .eq('id', x.id);
      e.currentTarget.disabled = false;
      if (error) return toast('Não foi possível salvar.', true);
      notificar('passada', x.id);
      toast(`Comentário enviado. ${firstName(m.nome)} foi avisado.`);
    };
    return;
  }
  box.innerHTML = `<p class="small muted">Vídeo da corrida de lado ou por trás, com cadência, passada, joelho, tronco e quadril medidos pelo celular. O aluno faz pelo app em Mais › Análise da passada, ou você analisa aqui um vídeo que ele mandou ou que você gravou.</p>
    <a class="btn block" href="${base}/nova" style="margin-top:12px">${I.cam} Analisar um vídeo</a>${psListaHTML(lista, base + '/')}`;
}
