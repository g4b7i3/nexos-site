/* Nexos App · Avaliação do movimento por vídeo (arquivo 31v-movimento)
   Testes de movimento filmados com o celular: agachamento com bastão (de frente e de lado), agachamento em uma perna,
   salto e aterrissagem e mobilidade do tornozelo. Usa o mesmo motor da análise biomecânica da corrida (MediaPipe Pose,
   no próprio aparelho; o vídeo não sai do celular): acha o momento certo (o fundo do agachamento, a aterrissagem, o
   joelho mais à frente), mede os ângulos e marca os quadros com as linhas e os números.
   Referências: Munro, Herrington e Carolan (2012) e Herrington (2014) para o ângulo do joelho no plano frontal em vídeo 2D;
   Mizner et al. (2012) para a razão de afastamento joelho/tornozelo; Crossley et al. (2011) para o agachamento em uma perna;
   Bennell et al. (1998) e Hoch e McKeon (2011) para o teste do joelho na parede; Cook et al. (2006) e a avaliação de
   agachamento com bastão (NASM) para as compensações do agachamento. */

/* movimento:puro:inicio (contas sem tela: testadas em scripts/testes/movimento.test.js) */
const MV_TESTES = {
  agach_frente: {
    nome: 'Agachamento com bastão · de frente',
    curto: 'Agachamento com bastão (frente)',
    vista: 'frente',
    lado: false,
    dur: 14,
    resumo: 'Joelho para dentro, abertura dos joelhos e quadril indo para um lado',
    dicas: [
      'Câmera parada (tripé ou apoiada) na altura do quadril, de frente para você, a uns 3 metros.',
      'Corpo inteiro na imagem, dos pés às mãos com o bastão (cabo de vassoura) acima da cabeça.',
      'Pés na largura do quadril, apontando para a frente. Braços estendidos segurando o bastão acima da cabeça.',
      'Faça 5 agachamentos devagar, descendo o máximo que conseguir sem tirar o calcanhar do chão.',
      'Bermuda ou legging: calça larga esconde o joelho.',
    ],
  },
  agach_lado: {
    nome: 'Agachamento com bastão · de lado',
    curto: 'Agachamento com bastão (lado)',
    vista: 'lado',
    lado: false,
    dur: 14,
    resumo: 'Profundidade, tronco, calcanhar e braços',
    dicas: [
      'Câmera parada (tripé ou apoiada) na altura do quadril, de lado para você, a uns 3 metros.',
      'Corpo inteiro na imagem, dos pés às mãos com o bastão acima da cabeça.',
      'Pés na largura do quadril. Braços estendidos segurando o bastão acima da cabeça.',
      'Faça 5 agachamentos devagar, descendo o máximo que conseguir.',
      'Roupa justa: o app precisa ver o joelho, o quadril e o ombro.',
    ],
  },
  unipodal: {
    nome: 'Agachamento em uma perna',
    curto: 'Agachamento em uma perna',
    vista: 'frente',
    lado: true,
    dur: 14,
    resumo: 'Joelho para dentro, queda do quadril e tronco, perna por perna',
    dicas: [
      'Câmera parada na altura do quadril, de frente para você, a uns 3 metros.',
      'Fique numa perna só, com a outra levantada à frente. Mãos na cintura.',
      'Faça 5 agachamentos devagar, descendo até uns 60° de joelho (meio agachamento), e suba.',
      'Grave uma perna de cada vez: escolha aqui qual é a de apoio.',
      'Bermuda ou legging: o app precisa ver o joelho.',
    ],
  },
  salto: {
    nome: 'Salto e aterrissagem',
    curto: 'Salto e aterrissagem',
    vista: 'frente',
    lado: false,
    dur: 6,
    resumo: 'Joelho para dentro ao cair do salto, o momento de mais risco de lesão',
    dicas: [
      'Câmera parada na altura do quadril, de frente para você, a uns 3 metros.',
      'Suba num degrau ou caixote de uns 30 cm, com os pés na largura do quadril.',
      'Deixe o corpo cair do degrau (sem pular para cima), aterrisse com os dois pés e salte o mais alto que puder.',
      'Faça 2 ou 3 vezes no mesmo vídeo, com descanso entre elas. O app escolhe a aterrissagem mais funda.',
      'Só faça se estiver sem dor nos joelhos e tornozelos.',
    ],
  },
  tornozelo: {
    nome: 'Mobilidade do tornozelo',
    curto: 'Mobilidade do tornozelo',
    vista: 'lado',
    lado: true,
    dur: 12,
    resumo: 'Quanto a canela avança sobre o pé com o calcanhar no chão (teste do joelho na parede)',
    dicas: [
      'Câmera parada no chão ou baixa, de lado para você, a uns 2 metros.',
      'De frente para uma parede, pé de teste à frente, a um palmo da parede. A outra perna atrás, como num passo.',
      'Leve o joelho da frente até a parede sem tirar o calcanhar do chão. Se encostar fácil, afaste o pé e repita.',
      'Fique uns 2 segundos na posição mais à frente que conseguir com o calcanhar no chão.',
      'Grave uma perna de cada vez: escolha aqui qual é a perna da frente.',
    ],
  },
};
const MV_ORDEM = {
  agach_frente: ['valgoE', 'valgoD', 'kasr', 'desvio'],
  agach_lado: ['profundidade', 'troncoTibia', 'calcanhar', 'bracos'],
  unipodal: ['valgo', 'pelve', 'troncoLat'],
  salto: ['valgoE', 'valgoD', 'kasr'],
  tornozelo: ['canela'],
};
// faixas: ok até a, atenção até b, depois fora (inv: maior é melhor)
const MV_REF = {
  valgo: { nome: 'Joelho para dentro', un: '°', a: 10, b: 15 },
  valgoE: { nome: 'Joelho esquerdo para dentro', un: '°', a: 8, b: 15 },
  valgoD: { nome: 'Joelho direito para dentro', un: '°', a: 8, b: 15 },
  kasr: { nome: 'Abertura dos joelhos', un: '', a: 0.8, b: 0.6, inv: true },
  desvio: { nome: 'Quadril indo para um lado', un: '%', a: 10, b: 20 },
  profundidade: { nome: 'Profundidade', un: '°', info: true },
  troncoTibia: { nome: 'Tronco à frente da canela', un: '°', a: 10, b: 20 },
  calcanhar: { nome: 'Calcanhar sai do chão', un: '%', a: 3, b: 6 },
  bracos: { nome: 'Braços caindo à frente', un: '°', a: 20, b: 35 },
  pelve: { nome: 'Queda do quadril', un: '°', a: 5, b: 8 },
  troncoLat: { nome: 'Tronco inclinado para o lado', un: '°', a: 5, b: 10 },
  canela: { nome: 'Ângulo da canela', un: '°', a: 38, b: 35, inv: true },
};
// no salto o joelho vai mais para dentro do que no agachamento: faixas próprias
const MV_REF_SALTO = { valgoE: { a: 12, b: 20 }, valgoD: { a: 12, b: 20 } };
function mvNivel(teste, k, v) {
  const r = { ...MV_REF[k], ...((teste === 'salto' && MV_REF_SALTO[k]) || {}) };
  if (v == null || !isFinite(v) || !r || r.info) return 'info';
  if (r.inv) return v >= r.a ? 'ok' : v >= r.b ? 'atencao' : 'fora';
  // joelho para fora e quadril que sobe (em vez de cair) não contam como problema destas medidas
  const x = k.startsWith('valgo') || k === 'pelve' ? v : Math.abs(v);
  return x <= r.a ? 'ok' : x <= r.b ? 'atencao' : 'fora';
}
const mvMeio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
// ângulo de um segmento com a vertical (0 = em pé), em graus
const mvVert = (baixo, cima) => (Math.atan2(Math.abs(cima[0] - baixo[0]), baixo[1] - cima[1]) * 180) / Math.PI;
/** ângulo do joelho no plano frontal (FPPA): quanto a linha quadril-joelho-tornozelo se dobra.
 *  Positivo = joelho para dentro (em direção ao meio do corpo); negativo = para fora. meioX: x do meio do corpo. */
function mvFppa(q, j, t, meioX) {
  const ang = psAng(q, j, t);
  if (ang == null || t[1] === q[1]) return null;
  const xLinha = q[0] + ((t[0] - q[0]) * (j[1] - q[1])) / (t[1] - q[1]);
  const lado = Math.sign(meioX - q[0]) || 1;
  const dentro = (j[0] - xLinha) * lado > 0;
  return (dentro ? 1 : -1) * (180 - ang);
}
/** razão de afastamento: distância entre os joelhos dividida pela distância entre os tornozelos (1 = alinhados) */
function mvKasr(jE, jD, tE, tD) {
  const dt = Math.abs(tE[0] - tD[0]);
  return dt > 1 ? Math.abs(jE[0] - jD[0]) / dt : null;
}
/** fundos das repetições: picos da altura do quadril na imagem (y cresce para baixo), separados por 0,8 s */
function mvFundos(ys, fps) {
  const v = ys.filter((y) => y != null);
  if (!v.length) return [];
  const lo = psPercentil(v, 0.05),
    hi = psPercentil(v, 0.95);
  const lim = lo + 0.6 * (hi - lo);
  const sep = Math.max(3, Math.round(0.8 * fps));
  const picos = [];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    if (y == null || y < lim) continue;
    let max = true;
    for (let k = Math.max(0, i - sep); k <= Math.min(ys.length - 1, i + sep); k++)
      if (k !== i && ys[k] != null && (ys[k] > y || (ys[k] === y && k < i))) max = false;
    if (max) picos.push(i);
  }
  if (!picos.length) {
    let m = 0;
    ys.forEach((y, i) => y != null && (ys[m] == null || y > ys[m]) && (m = i));
    return [m];
  }
  return picos;
}
const mvPts = (f, ...ns) => {
  const r = ns.map((n) => psPt(f, n, 0.35));
  return r.every(Boolean) ? r : null;
};
// mediana de uma medida nos quadros escolhidos e o quadro que melhor representa (mais perto da mediana)
function mvMedida(ids, fn) {
  const vs = ids.map((i) => ({ i, v: fn(i) })).filter((x) => x.v != null && isFinite(x.v));
  if (!vs.length) return { v: null, i: ids[0] };
  const m = psMediana(vs.map((x) => x.v));
  const rep = vs.reduce((a, x) => (Math.abs(x.v - m) < Math.abs(a.v - m) ? x : a));
  return { v: m, i: rep.i };
}
/** analisa os quadros de um teste. fr: [{ p: [[x, y, vis]...] }], fps, lado ('E'|'D' nos testes de uma perna).
 *  Devolve { m: medidas, momento: índice do quadro marcado, reps, aviso } */
function mvAnalisar(teste, fr, fps, lado) {
  const P = PS_P,
    LE = PS_LADO.E,
    LD = PS_LADO.D;
  const yQuadril = fr.map((f) => {
    const a = mvPts(f, P.quadrilE, P.quadrilD);
    return a ? (a[0][1] + a[1][1]) / 2 : null;
  });
  const ys = psSuavizar(yQuadril);
  const m = {};
  let momento = 0,
    reps = 0,
    aviso = null;
  const meioX = (f) => {
    const a = mvPts(f, P.quadrilE, P.quadrilD);
    return a ? (a[0][0] + a[1][0]) / 2 : null;
  };
  const frontal = (ids) => {
    const vE = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], LE.q, LE.j, LE.t);
      return a ? mvFppa(a[0], a[1], a[2], meioX(fr[i])) : null;
    });
    const vD = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], LD.q, LD.j, LD.t);
      return a ? mvFppa(a[0], a[1], a[2], meioX(fr[i])) : null;
    });
    const k = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], LE.j, LD.j, LE.t, LD.t);
      return a ? mvKasr(...a) : null;
    });
    m.valgoE = vE.v;
    m.valgoD = vD.v;
    m.kasr = k.v;
    // quadro marcado: o do joelho que mais vai para dentro
    momento = (vE.v ?? -99) >= (vD.v ?? -99) ? vE.i : vD.i;
  };
  if (teste === 'agach_frente') {
    const ids = mvFundos(ys, fps);
    reps = ids.length;
    frontal(ids);
    m.desvio = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], LE.q, LD.q, LE.t, LD.t);
      if (!a) return null;
      const larg = Math.abs(a[0][0] - a[1][0]);
      return larg > 1 ? ((mvMeio(a[0], a[1])[0] - mvMeio(a[2], a[3])[0]) / larg) * 100 : null;
    }).v;
  } else if (teste === 'salto') {
    // aterrissagem mais funda: o ponto mais baixo do quadril no vídeo
    const ids = mvFundos(ys, fps);
    const fundo = ids.reduce((a, i) => (ys[i] > ys[a] ? i : a), ids[0]);
    const viz = [fundo - 1, fundo, fundo + 1].filter((i) => i >= 0 && i < fr.length);
    reps = ids.length;
    frontal(viz);
    momento = fundo;
  } else if (teste === 'unipodal') {
    const S = PS_LADO[lado || 'E'],
      O = PS_LADO[lado === 'D' ? 'E' : 'D'];
    const ids = mvFundos(ys, fps);
    reps = ids.length;
    const v = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.q, S.j, S.t);
      return a ? mvFppa(a[0], a[1], a[2], meioX(fr[i])) : null;
    });
    m.valgo = v.v;
    momento = v.i;
    // queda do quadril do lado da perna levantada (positivo = caiu)
    m.pelve = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.q, O.q);
      if (!a) return null;
      return (Math.atan2(a[1][1] - a[0][1], Math.abs(a[1][0] - a[0][0])) * 180) / Math.PI;
    }).v;
    m.troncoLat = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], P.quadrilE, P.quadrilD, P.ombroE, P.ombroD);
      return a ? mvVert(mvMeio(a[0], a[1]), mvMeio(a[2], a[3])) : null;
    }).v;
  } else if (teste === 'agach_lado') {
    const L = psLadoVisivel(fr).lado;
    const S = PS_LADO[L];
    const ysL = psSuavizar(fr.map((f) => (psPt(f, S.q, 0.35) || [0, null])[1]));
    const ids = mvFundos(ysL, fps);
    reps = ids.length;
    // coxa em relação à linha paralela ao chão: positivo = quadril acima do joelho
    const prof = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.q, S.j);
      return a ? (Math.atan2(a[1][1] - a[0][1], Math.abs(a[1][0] - a[0][0]) || 1e-6) * 180) / Math.PI : null;
    });
    m.profundidade = prof.v;
    momento = prof.i;
    m.tronco = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.q, S.o);
      return a ? mvVert(a[0], a[1]) : null;
    }).v;
    m.tibia = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.t, S.j);
      return a ? mvVert(a[0], a[1]) : null;
    }).v;
    m.troncoTibia = m.tronco != null && m.tibia != null ? m.tronco - m.tibia : null;
    // calcanhar: quanto subiu em relação ao início (em pé), em % do comprimento da perna
    const n0 = Math.max(3, Math.round(fr.length * 0.12));
    const base = psMediana(fr.slice(0, n0).map((f) => (psPt(f, S.c, 0.35) || [0, null])[1]));
    const perna = psPerna(fr, L);
    m.calcanhar =
      base != null && perna
        ? Math.max(
            0,
            psMediana(
              ids.map((i) => {
                const c = psPt(fr[i], S.c, 0.35);
                return c ? ((base - c[1]) / perna) * 100 : null;
              }),
            ) ?? 0,
          )
        : null;
    // braços: o quanto a linha ombro-punho sai do prolongamento do tronco (0 = alinhados acima da cabeça)
    m.bracos = mvMedida(ids, (i) => {
      const a = mvPts(fr[i], S.q, S.o, S.pu);
      const ang = a ? psAng(a[0], a[1], a[2]) : null;
      return ang == null ? null : 180 - ang;
    }).v;
    m.ladoFilmado = L;
  } else if (teste === 'tornozelo') {
    const S = PS_LADO[lado || 'E'];
    const angs = fr.map((f) => {
      const a = mvPts(f, S.t, S.j);
      return a ? mvVert(a[0], a[1]) : null;
    });
    const sv = psSuavizar(angs);
    const alvo = psPercentil(sv, 0.95);
    let mi = 0;
    sv.forEach((v, i) => v != null && Math.abs(v - alvo) < Math.abs((sv[mi] ?? 1e9) - alvo) && (mi = i));
    m.canela = alvo;
    momento = mi;
    reps = 1;
    const n0 = Math.max(3, Math.round(fr.length * 0.12));
    const base = psMediana(fr.slice(0, n0).map((f) => (psPt(f, S.c, 0.35) || [0, null])[1]));
    const perna = psPerna(fr, lado || 'E');
    const c = psPt(fr[mi], S.c, 0.35);
    if (base != null && perna && c && ((base - c[1]) / perna) * 100 > 3)
      aviso = 'O calcanhar parece ter saído do chão no ponto mais à frente: a medida pode estar maior que a real.';
  }
  // qualidade: quantos quadros têm os pontos principais
  const vis = fr.filter((f) => mvPts(f, P.quadrilE, P.quadrilD, LE.j, LD.j, LE.t, LD.t)).length / (fr.length || 1);
  if (!aviso && vis < 0.6)
    aviso = 'Em parte do vídeo o app não achou o corpo inteiro. Para medir melhor, filme com o corpo todo na imagem.';
  if (!aviso && ['agach_frente', 'agach_lado', 'unipodal'].includes(teste) && reps < 2)
    aviso = 'O app achou só uma repetição. Com 3 a 5 repetições a medida fica mais confiável.';
  Object.keys(m).forEach((k) => typeof m[k] === 'number' && (m[k] = Math.round(m[k] * 100) / 100));
  return { m, momento, reps, aviso, vis: Math.round(vis * 100) };
}
/* movimento:puro:fim */

// textos de cada medida (o que é, e o que fazer quando sai do comum)
const MV_EXPLICA = {
  valgo:
    'Quanto o joelho vai em direção ao meio do corpo no fundo do agachamento. Joelho muito para dentro se associa a dor na frente do joelho e a lesões; costuma melhorar com força de glúteo médio e controle do quadril.',
  valgoE: 'Quanto o joelho esquerdo vai em direção ao meio do corpo no ponto mais baixo.',
  valgoD: 'Quanto o joelho direito vai em direção ao meio do corpo no ponto mais baixo.',
  kasr: 'Distância entre os joelhos dividida pela distância entre os tornozelos. Perto de 1, os joelhos ficam alinhados com os pés; abaixo de 0,6, eles se aproximam demais.',
  desvio:
    'Quanto o quadril se desloca para um dos lados no fundo, em relação aos pés (em % da largura do quadril). Pode indicar diferença de força ou de mobilidade entre os lados.',
  profundidade:
    'Ângulo da coxa com a linha paralela ao chão no ponto mais baixo. Abaixo de zero, o quadril desceu abaixo do joelho.',
  troncoTibia:
    'Quanto o tronco inclina a mais do que a canela. Num agachamento equilibrado, tronco e canela ficam quase paralelos. Tronco bem mais à frente costuma vir de pouca mobilidade do tornozelo ou do quadril, ou de pouca força do core.',
  calcanhar:
    'Quanto o calcanhar subiu no fundo do agachamento. Calcanhar saindo do chão costuma indicar pouca mobilidade do tornozelo.',
  bracos:
    'Quanto os braços saem da linha do tronco e caem para a frente. Pode indicar pouca mobilidade do ombro e da coluna torácica.',
  pelve:
    'Quanto o quadril do lado da perna levantada cai. Queda grande indica pouca força do glúteo médio do lado do apoio.',
  troncoLat: 'Quanto o tronco inclina para o lado para equilibrar. Costuma compensar pouca força do quadril.',
  canela:
    'Ângulo da canela com a vertical com o calcanhar no chão (teste do joelho na parede). Menos de 35° indica tornozelo duro, o que se associa a lesões na corrida; diferença de mais de 5° entre as pernas também merece atenção.',
};
const MV_NIVEL_TXT = { ok: 'Dentro do comum', atencao: 'Atenção', fora: 'Fora do comum', info: 'Informativo' };
const mvFmt = (k, v) => {
  if (v == null || !isFinite(v)) return '–';
  if (k === 'kasr') return f1(v, 2);
  if (k === 'profundidade')
    return `${f1(Math.abs(v), 0)}° ${v > 2 ? 'acima da paralela' : v < -2 ? 'abaixo da paralela' : '(na paralela)'}`;
  if (k.startsWith('valgo')) return `${f1(Math.abs(v), 0)}° ${v >= 0 ? 'para dentro' : 'para fora'}`;
  if (k === 'desvio') return `${f1(Math.abs(v), 0)}%`;
  if (k === 'pelve') return `${f1(Math.abs(v), 0)}° ${v >= 0 ? 'de queda' : 'para cima'}`;
  return f1(v, 0) + MV_REF[k].un;
};
const MV_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1.8"/><path d="M12 7v5"/><path d="m8 21 1.5-5H14l1.5 5"/><path d="M9.5 16 12 12l2.5 4"/><path d="M5 9h14"/></svg>';
const MV_COR = { ok: '#22c55e', atencao: '#f59e0b', fora: '#ef4444', info: '#46d6ff' };

/* ---------- quadro marcado com as linhas e os ângulos ---------- */
async function mvDesenha(v, f, teste, an, lado) {
  await psBuscar(v, f.tv ?? f.t);
  const W = v.videoWidth,
    H = v.videoHeight;
  const cw = Math.min(720, W),
    sc = cw / W;
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = Math.round(H * sc);
  const ctx = cv.getContext('2d');
  ctx.drawImage(v, 0, 0, cv.width, cv.height);
  ctx.fillStyle = 'rgba(4,10,24,.25)';
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (!f.p) return cv;
  psEsqueleto(ctx, f.p, sc, null);
  const pt = (i) => (f.p[i] ? [f.p[i][0] * sc, f.p[i][1] * sc] : null);
  const cor = (k) => MV_COR[mvNivel(teste, k, an.m[k])];
  const joelho = (L, k) => {
    const s = PS_LADO[L];
    const q = pt(s.q),
      j = pt(s.j),
      t = pt(s.t);
    if (!q || !j || !t || an.m[k] == null) return;
    psLinha(ctx, q, t, 'rgba(255,255,255,.7)', 2, [8, 8]);
    psLinha(ctx, q, j, cor(k), 6);
    psLinha(ctx, j, t, cor(k), 6);
    psEtiqueta(
      ctx,
      j[0] + (L === 'E' ? 14 : -200),
      j[1] - 20,
      `${f1(Math.abs(an.m[k]), 0)}° ${an.m[k] >= 0 ? 'p/ dentro' : 'p/ fora'}`,
      cor(k),
    );
  };
  if (teste === 'agach_frente' || teste === 'salto') {
    joelho('E', 'valgoE');
    joelho('D', 'valgoD');
  } else if (teste === 'unipodal') {
    const S = PS_LADO[lado],
      O = PS_LADO[lado === 'D' ? 'E' : 'D'];
    joelho(lado, 'valgo');
    const a = pt(S.q),
      b = pt(O.q);
    if (a && b && an.m.pelve != null) {
      psLinha(ctx, a, b, cor('pelve'), 6);
      psLinha(ctx, a, [b[0], a[1]], 'rgba(255,255,255,.7)', 2, [8, 8]);
      psEtiqueta(
        ctx,
        Math.min(a[0], b[0]),
        Math.min(a[1], b[1]) - 60,
        `Quadril ${f1(Math.abs(an.m.pelve), 0)}°`,
        cor('pelve'),
      );
    }
  } else if (teste === 'agach_lado') {
    const S = PS_LADO[an.m.ladoFilmado || 'E'];
    const q = pt(S.q),
      o = pt(S.o),
      j = pt(S.j),
      t = pt(S.t),
      pu = pt(S.pu);
    if (q && o) {
      psLinha(ctx, q, o, cor('troncoTibia'), 6);
      psLinha(ctx, q, [q[0], q[1] - 160], 'rgba(255,255,255,.7)', 2, [8, 8]);
      psEtiqueta(ctx, o[0] + 16, o[1] - 10, `Tronco ${f1(an.m.tronco, 0)}°`, cor('troncoTibia'));
    }
    if (j && t) {
      psLinha(ctx, t, j, cor('troncoTibia'), 6);
      psLinha(ctx, t, [t[0], t[1] - 160], 'rgba(255,255,255,.7)', 2, [8, 8]);
      psEtiqueta(ctx, t[0] + 16, t[1] - 70, `Canela ${f1(an.m.tibia, 0)}°`, cor('troncoTibia'));
    }
    if (q && j) {
      psLinha(ctx, [j[0] - 120, j[1]], [j[0] + 120, j[1]], 'rgba(255,255,255,.7)', 2, [8, 8]);
      psEtiqueta(
        ctx,
        j[0] - 100,
        j[1] + 18,
        `Coxa ${mvFmt('profundidade', an.m.profundidade).replace(' da paralela', '')}`,
        MV_COR.info,
      );
    }
    if (o && pu && an.m.bracos != null) {
      psLinha(ctx, o, pu, cor('bracos'), 6);
      psEtiqueta(ctx, pu[0] + 14, pu[1], `Braços ${f1(an.m.bracos, 0)}°`, cor('bracos'));
    }
  } else if (teste === 'tornozelo') {
    const S = PS_LADO[lado];
    const j = pt(S.j),
      t = pt(S.t);
    if (j && t) {
      psLinha(ctx, t, [t[0], t[1] - Math.hypot(j[0] - t[0], j[1] - t[1])], 'rgba(255,255,255,.75)', 3, [8, 8]);
      psLinha(ctx, t, j, cor('canela'), 7);
      psEtiqueta(ctx, j[0] + 16, j[1] - 20, `Canela ${f1(an.m.canela, 0)}°`, cor('canela'));
    }
  }
  return cv;
}
const mvBlob = (cv) => new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));

/* ---------- listas, detalhe e telas ---------- */
async function mvListar(alunoId) {
  const { data } = await sb
    .from('nx_movimento')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('criado_em', { ascending: false })
    .limit(60);
  return data || [];
}
async function mvUrls(x) {
  const urls = {};
  await Promise.all(
    (x.quadros || []).map(async (q) => {
      const { data } = await sb.storage.from('nx-fotos').createSignedUrl(q.path, 3600);
      if (data && data.signedUrl) urls[q.path] = data.signedUrl;
    }),
  );
  return urls;
}
const mvTitulo = (x) =>
  MV_TESTES[x.teste].curto + (x.lado ? ` · perna ${x.lado === 'E' ? 'esquerda' : 'direita'}` : '');
function mvMedidasHTML(x, outro) {
  return `<div class="stack" style="margin-top:8px">${(MV_ORDEM[x.teste] || [])
    .filter((k) => x.metricas[k] != null)
    .map((k) => {
      const n = mvNivel(x.teste, k, x.metricas[k]);
      const cmp =
        outro && outro.metricas[k] != null
          ? `<p class="tiny dim" style="margin-top:4px">Outra perna (${fmtDia(outro.criado_em)}): ${mvFmt(k, outro.metricas[k])}${Math.abs(outro.metricas[k] - x.metricas[k]) > 5 ? ' · diferença de ' + f1(Math.abs(outro.metricas[k] - x.metricas[k]), 0) + '°' : ''}</p>`
          : '';
      return `<div class="card mv-med"><div class="row between" style="gap:8px"><b>${MV_REF[k].nome}</b><span class="mv-niv ${n}">${MV_NIVEL_TXT[n]}</span></div>
        <div class="mv-val">${mvFmt(k, x.metricas[k])}</div><p class="small muted">${MV_EXPLICA[k]}</p>${cmp}</div>`;
    })
    .join('')}</div>`;
}
function mvQuadrosHTML(x, urls) {
  return (x.quadros || [])
    .filter((q) => urls[q.path] || q.src)
    .map(
      (q) =>
        `<figure class="mv-quadro"><img src="${q.src || urls[q.path]}" alt=""><figcaption>${esc(q.legenda || '')}</figcaption></figure>`,
    )
    .join('');
}
const MV_RODAPE =
  '<p class="tiny dim" style="margin-top:14px">Medidas feitas pelo celular a partir do vídeo (2D), aproximadas e sensíveis ao ângulo da câmera. Quem interpreta é o seu treinador. Baseado em Munro et al. (2012), Herrington (2014), Mizner et al. (2012), Crossley et al. (2011), Bennell et al. (1998) e Hoch e McKeon (2011).</p>';

// central: corrida (análise biomecânica) e os testes de movimento
async function viewMovimento(sub) {
  loading();
  dockAluno();
  if (sub === 'nova') return mvNova(S.user.id, '#/movimento');
  const lista = await mvListar(S.user.id);
  if (sub) {
    const x = lista.find((y) => y.id === sub);
    if (!x)
      return ($app.innerHTML = `<a class="back" href="#/movimento">${I.back} Avaliação do movimento</a><p class="muted">Avaliação não encontrada.</p>`);
    const topo = `<a class="back" href="#/movimento">${I.back} Avaliação do movimento</a><p class="eyebrow">${fmtDia(x.criado_em)}</p><h1 class="h1">${esc(mvTitulo(x))}</h1>`;
    if (!x.enviado_em)
      return ($app.innerHTML = `${topo}<div class="card ps-rel"><span class="eyebrow">Com o seu treinador</span><p style="margin-top:6px">Seu treinador está analisando o vídeo e vai te mandar o resultado aqui mesmo. Você recebe uma notificação quando chegar.</p></div>`);
    const urls = await mvUrls(x);
    const outro = x.lado ? lista.find((y) => y.teste === x.teste && y.lado && y.lado !== x.lado && y.enviado_em) : null;
    $app.innerHTML = `${topo}
      ${x.comentario ? `<div class="card ps-rel pronto"><span class="eyebrow">O que o seu treinador viu</span><p style="margin-top:8px;white-space:pre-line">${esc(x.comentario)}</p></div>` : ''}
      ${mvQuadrosHTML(x, urls)}
      <p class="eyebrow" style="margin-top:18px">As medidas</p>${mvMedidasHTML(x, outro)}${MV_RODAPE}`;
    if (!x.visto_em)
      sb.rpc('nx_movimento_visto', { p_id: x.id }).then(
        () => {},
        () => {},
      );
    return;
  }
  const fC = faz('corrida');
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Avaliações</p><h1 class="h1">Avaliação do movimento</h1>
    <p class="muted" style="margin-top:6px">Filme o teste com o celular e mande para o seu treinador. O app mede os ângulos no próprio aparelho, e o resultado chega aqui com a análise dele.</p>
    <div class="stack" style="margin-top:14px">
      ${fC ? `<a class="list-item" href="#/passada" style="color:inherit"><span class="ativ-ic">${PS_IC}</span><div class="grow"><b>Análise biomecânica da corrida</b><div class="small muted">Passada, joelho, tronco e quadril correndo</div></div>${I.chev}</a>` : ''}
      <a class="list-item" href="#/movimento/nova" style="color:inherit"><span class="ativ-ic">${MV_IC}</span><div class="grow"><b>Testes de movimento</b><div class="small muted">Agachamento com bastão, agachamento em uma perna, salto e aterrissagem e mobilidade do tornozelo</div></div>${I.chev}</a>
    </div>
    ${mvListaHTML(lista, '#/movimento/')}`;
}
function mvListaHTML(lista, base) {
  if (!lista.length) return '';
  return `<p class="sec-lbl" style="margin-top:20px">Suas avaliações</p><div class="stack">${lista
    .map((x) => {
      const ruins = (MV_ORDEM[x.teste] || []).filter((k) =>
        ['atencao', 'fora'].includes(mvNivel(x.teste, k, x.metricas[k])),
      ).length;
      const sub = !S.staff
        ? x.enviado_em
          ? 'Resultado do treinador'
          : 'Com o treinador'
        : ruins
          ? `${ruins} ponto${ruins > 1 ? 's' : ''} para olhar`
          : 'Tudo dentro do comum';
      const tag = x.enviado_em
        ? `<span class="tag ok">${!S.staff && !x.visto_em ? 'Novo' : 'Enviado'}</span>`
        : `<span class="tag">${S.staff ? 'A enviar' : 'Aguardando'}</span>`;
      return `<a class="list-item" href="${base}${x.id}" style="color:inherit"><span class="ativ-ic">${MV_IC}</span><div class="grow"><b>${esc(mvTitulo(x))}</b><div class="small muted">${fmtDia(x.criado_em)} · ${sub}</div></div>${tag}${I.chev}</a>`;
    })
    .join('')}</div>`;
}

/* ---------- nova avaliação (aluno ou treinador) ---------- */
async function mvNova(alunoId, voltar, nomeAluno) {
  const st = { teste: null, lado: 'E', url: null, ini: 0, fim: 0 };
  const topo = `<a class="back" href="${voltar}">${I.back} Avaliação do movimento</a><p class="eyebrow">Novo teste${nomeAluno ? ' · ' + esc(firstName(nomeAluno)) : ''}</p>`;
  const passo1 = () => {
    $app.innerHTML = `${topo}<h1 class="h1">Qual teste?</h1>
      <div class="stack" style="margin-top:14px">${Object.entries(MV_TESTES)
        .map(
          ([k, t]) =>
            `<button type="button" class="list-item" data-t="${k}" style="width:100%;text-align:left"><span class="ativ-ic">${MV_IC}</span><div class="grow"><b>${t.nome}</b><div class="small muted">${t.resumo}</div></div>${I.chev}</button>`,
        )
        .join('')}</div>
      <p class="small muted" style="margin-top:12px">No agachamento com bastão, faça os dois vídeos, de frente e de lado. Nos testes de uma perna, grave as duas pernas, uma de cada vez, para comparar.</p>`;
    $app.querySelectorAll('[data-t]').forEach(
      (b) =>
        (b.onclick = () => {
          st.teste = b.dataset.t;
          passo2();
        }),
    );
    window.scrollTo(0, 0);
  };
  const passo2 = () => {
    const t = MV_TESTES[st.teste];
    $app.innerHTML = `${topo}<h1 class="h1">${t.nome}</h1>
      <ol class="ps-dicas">${t.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
      ${t.lado ? `<div class="seg" id="mv-lado" style="margin-top:14px;grid-template-columns:1fr 1fr"><button type="button" data-l="E" class="${st.lado === 'E' ? 'on' : ''}">${st.teste === 'tornozelo' ? 'Perna da frente: esquerda' : 'Apoio na esquerda'}</button><button type="button" data-l="D" class="${st.lado === 'D' ? 'on' : ''}">${st.teste === 'tornozelo' ? 'Perna da frente: direita' : 'Apoio na direita'}</button></div>` : ''}
      <input type="file" accept="video/*" capture="environment" id="mv-gravar" hidden><input type="file" accept="video/*" id="mv-escolher" hidden>
      <p class="sec-lbl" style="margin-top:16px">Como quer mandar o vídeo?</p>
      <div class="ps-envio">
        <button type="button" class="ps-op" id="mv-b-gravar"><span class="ps-op-ic">${I.cam}</span><b>Gravar agora</b><small>Abre a câmera do celular</small></button>
        <button type="button" class="ps-op" id="mv-b-escolher"><span class="ps-op-ic">${PS_UP_IC}</span><b>Enviar um vídeo</b><small>Da galeria ou de um arquivo</small></button>
      </div>
      <p class="small muted" style="margin-top:12px">O vídeo não sai do celular. Só as medidas e os quadros marcados vão para o treinador.</p>
      <button class="link-btn small" id="mv-voltar" style="margin-top:10px">Escolher outro teste</button>`;
    const sg = document.getElementById('mv-lado');
    if (sg)
      sg.onclick = (e) => {
        const b = e.target.closest('[data-l]');
        if (!b) return;
        st.lado = b.dataset.l;
        sg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      };
    ['gravar', 'escolher'].forEach((k) => {
      const inp = document.getElementById('mv-' + k);
      document.getElementById('mv-b-' + k).onclick = () => inp.click();
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return;
        if (st.url) URL.revokeObjectURL(st.url);
        st.url = URL.createObjectURL(f);
        passo3();
      };
    });
    document.getElementById('mv-voltar').onclick = passo1;
    window.scrollTo(0, 0);
  };
  const passo3 = () => {
    const t = MV_TESTES[st.teste];
    $app.innerHTML = `${topo}<h1 class="h1">Escolha o trecho</h1>
      <p class="muted" style="margin-top:6px">Até ${t.dur} segundos, com o corpo inteiro na imagem e o teste completo.</p>
      <div class="ps-video"><video id="mv-v" src="${st.url}" playsinline muted preload="auto"></video><div class="ps-carr" id="mv-carr"><span class="ps-spin"></span><small>Carregando o vídeo…</small></div></div>
      <div class="field"><span id="mv-tr-t">Trecho</span><input type="range" id="mv-ini" min="0" max="0" step="0.1" value="0" class="ps-range"></div>
      <button class="btn block" id="mv-analisar" disabled>Analisar</button>
      <button class="link-btn small" id="mv-trocar" style="margin-top:10px">Trocar o vídeo</button>`;
    const v = document.getElementById('mv-v'),
      r = document.getElementById('mv-ini'),
      tt = document.getElementById('mv-tr-t');
    const atual = () => {
      st.ini = +r.value;
      st.fim = Math.min(v.duration, st.ini + t.dur);
      tt.textContent = `Trecho: de ${f1(st.ini, 1)} s a ${f1(st.fim, 1)} s`;
    };
    const tira = () => document.getElementById('mv-carr') && document.getElementById('mv-carr').remove();
    v.onloadeddata = tira;
    v.onloadedmetadata = () => {
      setTimeout(tira, 1500);
      if (!isFinite(v.duration) || v.duration < 1.5) {
        tt.textContent = 'Vídeo muito curto.';
        return;
      }
      r.max = Math.max(0, v.duration - t.dur).toFixed(1);
      r.value = '0';
      atual();
      v.currentTime = 0;
      document.getElementById('mv-analisar').disabled = false;
    };
    v.onerror = () => {
      tira();
      tt.textContent = 'Este vídeo não abriu no navegador. Tente gravar de novo ou em outro formato.';
    };
    r.oninput = () => {
      atual();
      v.currentTime = st.ini;
    };
    document.getElementById('mv-trocar').onclick = passo2;
    document.getElementById('mv-analisar').onclick = () => passo4(v);
    window.scrollTo(0, 0);
  };
  const passo4 = async (v) => {
    const t = MV_TESTES[st.teste];
    $app.innerHTML = `${topo}<h1 class="h1">Analisando o movimento</h1>
      <div class="card ps-prog"><div class="ps-barra"><i id="mv-p-b"></i></div><p class="ps-pct" id="mv-pct">0%</p>
      <p class="tiny dim" style="margin-top:6px" id="mv-et">Na primeira vez, o celular baixa o modelo de pontos do corpo. Deixe esta tela aberta.</p></div>
      <div class="ps-video ps-video-an"><canvas class="ps-vivo" id="mv-vivo"></canvas></div>`;
    $app.querySelector('.ps-video').prepend(v);
    const vivo = document.getElementById('mv-vivo'),
      pb = document.getElementById('mv-p-b'),
      pc = document.getElementById('mv-pct');
    const barra = (f) => {
      const x = Math.round(Math.max(0, Math.min(1, f)) * 100);
      pb.style.width = x + '%';
      pc.textContent = x + '%';
    };
    let res;
    try {
      await psMotor((f) => barra(f * 0.25));
      document.getElementById('mv-et').textContent = 'Encontrando os pontos do corpo, quadro a quadro.';
      res = await psProcessar(v, st.ini, st.fim, (p, q, W, H) => {
        barra(0.25 + p * 0.67);
        psDesenhaVivo(vivo, v, q, W, H);
      });
    } catch (e) {
      console.error(e);
      if (typeof reportarErro === 'function') reportarErro(e, 'avaliação do movimento');
      pc.textContent =
        'Não foi possível analisar neste aparelho. Verifique a internet (na primeira vez o modelo é baixado) e tente de novo.';
      return;
    }
    const an = mvAnalisar(st.teste, res.fr, res.fps, t.lado ? st.lado : null);
    const okMedidas = (MV_ORDEM[st.teste] || []).some((k) => an.m[k] != null);
    if (!okMedidas) {
      $app.innerHTML = `${topo}<h1 class="h1">Não deu para medir</h1><p class="muted" style="margin-top:8px">O app não achou o corpo inteiro no vídeo. Confira as dicas: câmera parada, corpo todo na imagem e roupa justa.</p><button class="btn block" id="mv-de-novo" style="margin-top:14px">Gravar de novo</button>`;
      document.getElementById('mv-de-novo').onclick = passo2;
      return;
    }
    barra(0.95);
    const cv = await mvDesenha(v, res.fr[an.momento] || res.fr[0], st.teste, an, st.lado);
    barra(1);
    const blob = await mvBlob(cv);
    const legenda =
      st.teste === 'salto'
        ? 'Aterrissagem mais funda'
        : st.teste === 'tornozelo'
          ? 'Canela mais à frente com o calcanhar no chão'
          : 'Ponto mais baixo do agachamento';
    resultado({ an, blob, src: cv.toDataURL('image/jpeg', 0.85), legenda });
  };
  const resultado = ({ an, blob, src, legenda }) => {
    const x = {
      teste: st.teste,
      lado: MV_TESTES[st.teste].lado ? st.lado : null,
      metricas: an.m,
      quadros: [{ src, legenda }],
      criado_em: new Date().toISOString(),
    };
    $app.innerHTML = `${topo}<h1 class="h1">${esc(mvTitulo(x))}</h1>
      ${an.aviso ? `<div class="card" style="margin-top:10px;border-color:rgba(214,120,0,.35)"><p class="small">${esc(an.aviso)}</p></div>` : ''}
      ${S.staff ? mvQuadrosHTML(x, {}) + `<p class="eyebrow" style="margin-top:18px">As medidas</p>${mvMedidasHTML(x)}` : `<div class="card ps-rel" style="margin-top:12px"><span class="eyebrow">Pronto para enviar</span><p style="margin-top:6px">O app mediu ${an.reps > 1 ? an.reps + ' repetições' : 'o teste'}. Envie para o seu treinador analisar: o resultado chega aqui com a análise dele.</p></div>${mvQuadrosHTML(x, {})}`}
      <button class="btn block" id="mv-salvar" style="margin-top:14px">${S.staff ? 'Salvar na ficha do aluno' : 'Enviar ao treinador'}</button>
      <button class="link-btn small" id="mv-refazer" style="margin-top:10px">Refazer o vídeo</button>${S.staff ? MV_RODAPE : ''}`;
    document.getElementById('mv-refazer').onclick = passo2;
    document.getElementById('mv-salvar').onclick = async (e) => {
      const bt = e.currentTarget;
      bt.disabled = true;
      bt.textContent = 'Enviando…';
      try {
        const id = crypto.randomUUID();
        const path = `${S.org.id}/${alunoId}/movimento/${id}-0.jpg`;
        const up = await sb.storage.from('nx-fotos').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        const { error } = await sb.from('nx_movimento').insert({
          id,
          org_id: S.org.id,
          aluno_id: alunoId,
          teste: x.teste,
          lado: x.lado,
          metricas: an.m,
          quadros: [{ path, legenda }],
          qualidade: { reps: an.reps, vis: an.vis, aviso: an.aviso },
        });
        if (error) throw error;
        if (!S.staff) notificar('movimento_novo', id);
        toast(S.staff ? 'Salvo na ficha do aluno.' : 'Enviado! Seu treinador vai analisar.');
        location.hash = voltar.replace(/^#/, '#') + '/' + id;
      } catch (err) {
        console.error(err);
        if (typeof reportarErro === 'function') reportarErro(err, 'avaliação do movimento');
        bt.disabled = false;
        bt.textContent = S.staff ? 'Salvar na ficha do aluno' : 'Enviar ao treinador';
        toast('Não foi possível enviar. Verifique a internet e tente de novo.', true);
      }
    };
    window.scrollTo(0, 0);
  };
  passo1();
}

/* ---------- ficha do aluno (treinador) ---------- */
async function mvTreinador(box, m, sub) {
  const alunoId = m.user_id;
  const base = `#/aluno/${alunoId}/movimento`;
  if (sub === 'nova') return mvNova(alunoId, base, m.nome);
  const lista = await mvListar(alunoId);
  if (!sub) {
    box.innerHTML = `<p class="small muted">Testes filmados com o celular: agachamento com bastão, agachamento em uma perna, salto e aterrissagem e mobilidade do tornozelo. O aluno faz em Mais › Avaliação do movimento, ou você filma aqui.</p>
      <a class="btn block" href="${base}/nova" style="margin-top:12px">${I.cam} Novo teste</a>${mvListaHTML(lista, base + '/')}`;
    return;
  }
  const x = lista.find((y) => y.id === sub);
  if (!x) return (box.innerHTML = '<p class="muted">Avaliação não encontrada.</p>');
  const urls = await mvUrls(x);
  const outro = x.lado ? lista.find((y) => y.teste === x.teste && y.lado && y.lado !== x.lado) : null;
  const sug = mvSugestao(x, m.nome);
  box.innerHTML = `<a class="back" href="${base}">${I.back} Avaliação do movimento</a><p class="eyebrow">${fmtDia(x.criado_em)}${x.qualidade && x.qualidade.reps ? ` · ${x.qualidade.reps} repetiç${x.qualidade.reps > 1 ? 'ões' : 'ão'}` : ''}</p><h2 class="h2">${esc(mvTitulo(x))}</h2>
    ${x.qualidade && x.qualidade.aviso ? `<div class="card" style="margin-top:10px;border-color:rgba(214,120,0,.35)"><p class="small">${esc(x.qualidade.aviso)}</p></div>` : ''}
    ${mvQuadrosHTML(x, urls)}${mvMedidasHTML(x, outro)}
    <div class="card" style="margin-top:14px"><span class="eyebrow">O que você viu</span>
      <textarea class="textarea" id="mv-com" rows="6" style="margin-top:8px" placeholder="O que o aluno deve saber e o que vai mudar no treino.">${esc(x.comentario || sug)}</textarea>
      <button class="btn block" id="mv-enviar" style="margin-top:10px">${x.enviado_em ? 'Reenviar ao aluno' : 'Enviar ao aluno'}</button>
      ${x.enviado_em ? `<p class="tiny dim" style="margin-top:6px">Enviado em ${fmtDia(x.enviado_em)} às ${fmtHora(x.enviado_em)}.</p>` : '<p class="tiny dim" style="margin-top:6px">O app sugeriu um texto a partir das medidas. Edite do seu jeito: o aluno só vê depois que você enviar.</p>'}
    </div>${MV_RODAPE}`;
  document.getElementById('mv-enviar').onclick = async (e) => {
    const bt = e.currentTarget;
    bt.disabled = true;
    const agora = new Date().toISOString();
    const { error } = await sb
      .from('nx_movimento')
      .update({ comentario: document.getElementById('mv-com').value.trim() || null, enviado_em: agora, visto_em: null })
      .eq('id', x.id);
    bt.disabled = false;
    if (error) return toast('Não foi possível enviar.', true);
    notificar('movimento', x.id);
    toast('Enviado. O aluno foi avisado.');
    mvTreinador(box, m, sub);
  };
}
// texto sugerido a partir das medidas (o treinador edita antes de enviar)
function mvSugestao(x, nome) {
  const pontos = (MV_ORDEM[x.teste] || [])
    .filter((k) => ['atencao', 'fora'].includes(mvNivel(x.teste, k, x.metricas[k])))
    .map((k) => `${MV_REF[k].nome.toLowerCase()} (${mvFmt(k, x.metricas[k])})`);
  const n = firstName(nome || '');
  if (!pontos.length)
    return `${n ? n + ', o' : 'O'} seu ${MV_TESTES[x.teste].curto.toLowerCase()} ficou dentro do comum em todas as medidas. Vamos manter o trabalho de força e mobilidade para continuar assim.`;
  return `${n ? n + ', no' : 'No'} ${MV_TESTES[x.teste].curto.toLowerCase()} apareceu ${pontos.join(' e ')}. Vou colocar no seu treino exercícios para isso e repetimos o teste em 6 a 8 semanas para comparar.`;
}
