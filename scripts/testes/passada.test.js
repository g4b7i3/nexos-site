// Teste automático da Análise da passada: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Monta corredores sintéticos (de lado e por trás) com medidas conhecidas e confere se as contas do app chegam nelas.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31p-passada.js'), 'utf8');
const m = src.match(/\/\* passada:puro:inicio[^]*?\*\/([^]*?)\/\* passada:puro:fim \*\//);
if (!m) throw new Error('Bloco da passada não encontrado no app (marcadores passada:puro).');
const ctx = {};
vm.runInNewContext(
  m[1] +
    '\n;Object.assign(this, { PS_P, PS_LADO, psAng, psMediana, psApoios, psAnalisarLado, psAnalisarTras, psNivel, psCm, psDirecao, psLadoVisivel, psMedidasQuadro, psFinais, psAssimetria, psCompara, psSugereFator, psRitmoKmh, psPaceTxt });',
  ctx,
);
const {
  PS_P,
  psAng,
  psMediana,
  psAnalisarLado,
  psAnalisarTras,
  psNivel,
  psDirecao,
  psLadoVisivel,
  psMedidasQuadro,
  psFinais,
  psAssimetria,
  psCompara,
  psSugereFator,
  psRitmoKmh,
  psPaceTxt,
} = ctx;
const erros = [];
const ok = (c, msg) => c || erros.push(msg);
const perto = (a, b, tol) => a != null && Math.abs(a - b) <= tol;
const rad = (g) => (g * Math.PI) / 180;

// 1. contas básicas
ok(perto(psAng([0, -1], [0, 0], [1, 0]), 90, 0.01), 'ângulo reto');
ok(perto(psAng([0, -1], [0, 0], [0, 1]), 180, 0.01), 'ângulo raso');
ok(psMediana([3, 1, 2, null]) === 2, 'mediana');
ok(
  psNivel('cadencia', 176) === 'ok' && psNivel('cadencia', 165) === 'atencao' && psNivel('cadencia', 150) === 'fora',
  'faixas da cadência',
);
ok(
  psNivel('queda', 3) === 'ok' && psNivel('queda', 7) === 'atencao' && psNivel('queda', 10) === 'fora',
  'faixas da queda do quadril',
);

// joelho por cinemática inversa (dobra para a frente, no sentido da corrida)
function joelho(H, A, L1, L2, dir) {
  let d = Math.hypot(A[0] - H[0], A[1] - H[1]);
  d = Math.min(d, L1 + L2 - 0.01);
  const a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const u = [(A[0] - H[0]) / d, (A[1] - H[1]) / d];
  const r = (s) => [
    H[0] + L1 * (u[0] * Math.cos(s) - u[1] * Math.sin(s)),
    H[1] + L1 * (u[0] * Math.sin(s) + u[1] * Math.cos(s)),
  ];
  const k1 = r(a),
    k2 = r(-a);
  return dir * k1[0] > dir * k2[0] ? k1 : k2;
}

// 2. corredor de lado, na esteira, indo para a direita: cadência 170, tronco a 7°, quadril sobe e desce 20 px
function corredorLado({
  cad = 170,
  dir = 1,
  fps = 60,
  seg = 3,
  tronco = 7,
  osc = 20,
  frente = 70,
  cotovelo = 90,
  bracoF = 35,
  bracoT = 25,
} = {}) {
  const ciclo = 120 / cad,
    L1 = 210,
    L2 = 210,
    chao = 1000;
  const fr = [];
  for (let i = 0; i <= seg * fps; i++) {
    const t = i / fps;
    const p = Array.from({ length: 33 }, () => null);
    const fase0 = (t / ciclo) % 1;
    // quadril: mais baixo no meio de cada apoio (2 vezes por ciclo)
    const hy = 590 + (osc / 2) * Math.cos(2 * Math.PI * (fase0 * 2 - 0.19 * 2));
    const H = [500, hy];
    [
      ['E', 0, 0.95],
      ['D', 0.5, 0.5],
    ].forEach(([L, off, vis]) => {
      const f = (fase0 + off) % 1;
      let ax, ay;
      if (f < 0.38) {
        ax = 500 + dir * (frente - (f / 0.38) * (frente + 80)); // apoio: o pé vai para trás com a esteira
        ay = chao - 10;
      } else {
        const s = (f - 0.38) / 0.62;
        ax = 500 + dir * (-80 + s * (frente + 80));
        ay = chao - 10 - 90 * Math.sin(Math.PI * s);
      }
      const A = [ax, ay];
      const K = joelho(H, A, L1, L2, dir);
      const q = L === 'E' ? PS_P.quadrilE : PS_P.quadrilD;
      p[q] = [H[0] + (L === 'E' ? 0 : 6), H[1], vis];
      p[L === 'E' ? PS_P.joelhoE : PS_P.joelhoD] = [K[0], K[1], vis];
      p[L === 'E' ? PS_P.tornE : PS_P.tornD] = [A[0], A[1], vis];
      p[L === 'E' ? PS_P.calcE : PS_P.calcD] = [A[0] - dir * 15, A[1] + 10, vis];
      p[L === 'E' ? PS_P.pontaE : PS_P.pontaD] = [A[0] + dir * 30, A[1] + 10, vis];
      const O = [H[0] + (L === 'E' ? 0 : 6) + dir * 250 * Math.sin(rad(tronco)), H[1] - 250 * Math.cos(rad(tronco))];
      p[L === 'E' ? PS_P.ombroE : PS_P.ombroD] = [O[0], O[1], vis];
      // braço balança ao contrário da perna do mesmo lado: de bracoT para trás até bracoF à frente
      const a = rad((bracoF - bracoT) / 2 + ((bracoF + bracoT) / 2) * Math.cos(2 * Math.PI * f));
      const b = a + rad(180 - cotovelo);
      const C = [O[0] + dir * 120 * Math.sin(a), O[1] + 120 * Math.cos(a)];
      p[L === 'E' ? PS_P.cotoveloE : PS_P.cotoveloD] = [C[0], C[1], vis];
      p[L === 'E' ? PS_P.punhoE : PS_P.punhoD] = [C[0] + dir * 110 * Math.sin(b), C[1] + 110 * Math.cos(b), vis];
    });
    p[0] = [H[0] + dir * 300 * Math.sin(rad(tronco)), H[1] - 330, 0.9];
    fr.push({ t, p });
  }
  return fr;
}
const altura = 175;
const lado = psAnalisarLado(corredorLado(), altura);
ok(lado.lado === 'E', `lado visível: ${lado.lado} (esperado E)`);
ok(lado.dir === 1, `sentido da corrida: ${lado.dir} (esperado 1)`);
ok(perto(lado.m.cadencia, 170, 3), `cadência: ${lado.m.cadencia} (esperado 170)`);
ok(perto(lado.m.tronco, 7, 0.6), `tronco: ${lado.m.tronco} (esperado 7)`);
// oscilação: 20 px numa perna de 420 px, com 1,75 m de altura → 20/420 × 175 × 0,49 ≈ 4,1 cm
ok(perto(lado.m.oscilacao, 4.08, 0.6), `oscilação: ${lado.m.oscilacao} cm (esperado ≈ 4,1)`);
// calcanhar 70 − 15 = 55 px à frente do quadril → 55/420 × 85,75 ≈ 11,2 cm (tolerância de 1 quadro de deslocamento)
ok(perto(lado.m.frente, 11.2, 1.6), `pé à frente: ${lado.m.frente} cm (esperado ≈ 11,2)`);
ok(lado.m.tibia > -15 && lado.m.tibia < 25, `tíbia no contato em faixa possível: ${lado.m.tibia}`);
ok(lado.m.joelhoMax >= lado.m.joelhoIC, 'joelho dobra mais no apoio do que no toque');
ok(lado.m.contato > 200 && lado.m.contato < 330, `tempo de contato: ${lado.m.contato} ms (esperado ≈ 268)`);
ok(lado.qualidade.ok, `qualidade boa no vídeo sintético: ${JSON.stringify(lado.qualidade.avisos)}`);
// passada mais longa → tíbia mais inclinada e pé mais à frente
const longa = psAnalisarLado(corredorLado({ frente: 130 }), altura);
ok(longa.m.tibia > lado.m.tibia + 3, `passada longa aumenta a tíbia: ${longa.m.tibia} x ${lado.m.tibia}`);
ok(longa.m.frente > lado.m.frente + 8, `passada longa aumenta o pé à frente: ${longa.m.frente} x ${lado.m.frente}`);
// correndo para a esquerda dá as mesmas medidas
const esq = psAnalisarLado(corredorLado({ dir: -1 }), altura);
ok(esq.dir === -1, 'sentido para a esquerda');
ok(perto(esq.m.tronco, 7, 0.6) && perto(esq.m.cadencia, 170, 3), 'medidas iguais correndo para a esquerda');
// 30 quadros por segundo: sem tempo de contato, mas com cadência
const v30 = psAnalisarLado(corredorLado({ fps: 30 }), altura);
ok(v30.m.contato == null, 'a 30 qps não mostra tempo de contato');
ok(perto(v30.m.cadencia, 170, 4), `cadência a 30 qps: ${v30.m.cadencia}`);
// cadência baixa
const lenta = psAnalisarLado(corredorLado({ cad: 156 }), altura);
ok(
  perto(lenta.m.cadencia, 156, 3) && psNivel('cadencia', lenta.m.cadencia) === 'fora',
  `cadência baixa: ${lenta.m.cadencia}`,
);
// vídeo sem gente quase toda hora: avisa
const vazio = corredorLado().map((f, i) => (i % 3 ? { t: f.t, p: null } : f));
ok(psAnalisarLado(vazio, altura).qualidade.avisos.includes('pouca_deteccao'), 'avisa quando o corpo some do vídeo');
ok(psDirecao([]) === 1 && psLadoVisivel([]).vis === 0, 'listas vazias não quebram');

// corredor vindo em direção à câmera (fica 50% maior no vídeo): as medidas em cm não podem inflar
const chegando = corredorLado().map((f, i, arr) => {
  const k = 1 + (0.5 * i) / (arr.length - 1);
  return { t: f.t, p: f.p.map((q) => (q ? [500 + (q[0] - 500) * k, q[1] * k, q[2]] : null)) };
});
const ch = psAnalisarLado(chegando, altura);
ok(perto(ch.m.cadencia, 170, 3), `vindo para a câmera, cadência: ${ch.m.cadencia}`);
ok(perto(ch.m.oscilacao, 4.08, 0.9), `vindo para a câmera, oscilação: ${ch.m.oscilacao} cm (esperado ≈ 4,1)`);
ok(perto(ch.m.frente, 11.2, 2), `vindo para a câmera, pé à frente: ${ch.m.frente} cm (esperado ≈ 11,2)`);
ok(ch.qualidade.avisos.includes('distancia_muda'), 'avisa quando a distância até a câmera muda');
ok(!lado.qualidade.avisos.includes('distancia_muda'), 'não avisa distância na esteira');

// 3. corredor por trás: quadril do lado sem apoio cai 6°, pés sem cruzar
function corredorTras({ queda = 6, quedaE = null, cruza = false, fps = 60, seg = 3, maoE = -15, maoD = -15 } = {}) {
  const ciclo = 120 / 170,
    chao = 1000;
  const fr = [];
  for (let i = 0; i <= seg * fps; i++) {
    const t = i / fps;
    const p = Array.from({ length: 33 }, () => null);
    const fase0 = (t / ciclo) % 1;
    const qE = [450, 600],
      qD = [550, 600];
    const apoioE = fase0 < 0.38,
      apoioD = fase0 >= 0.5 && fase0 < 0.88;
    const dy = 100 * Math.tan(rad(queda));
    const dyE = 100 * Math.tan(rad(quedaE ?? queda));
    if (apoioE) qD[1] += dyE * Math.sin((Math.PI * fase0) / 0.38);
    if (apoioD) qE[1] += dy * Math.sin((Math.PI * (fase0 - 0.5)) / 0.38);
    [
      ['E', qE, apoioE, 0],
      ['D', qD, apoioD, 0.5],
    ].forEach(([L, Q, ap, off]) => {
      const f = (fase0 + 1 - off) % 1;
      const ay = ap ? chao - 10 : chao - 10 - 90 * Math.sin((Math.PI * (f - 0.38)) / 0.62);
      const ax = L === 'E' ? (cruza && ap ? 515 : 470) : cruza && ap ? 485 : 530;
      const K = [(Q[0] + ax) / 2, (Q[1] + ay) / 2];
      const s = L === 'E' ? 'E' : 'D';
      p[PS_P['quadril' + s]] = [Q[0], Q[1], 0.9];
      p[PS_P['joelho' + s]] = [K[0], K[1], 0.9];
      p[PS_P['torn' + s]] = [ax, ay, 0.9];
      p[PS_P['calc' + s]] = [ax, ay + 10, 0.9];
      p[PS_P['ponta' + s]] = [ax, ay + 12, 0.8];
      p[PS_P['ombro' + s]] = [Q[0] + (L === 'E' ? -20 : 20), 350, 0.9];
      // mão vai em direção ao meio do corpo (x = 500) no balanço; maoE/maoD = quanto passa do meio no ponto máximo
      const passa = L === 'E' ? maoE : maoD,
        lad = L === 'E' ? -1 : 1;
      const fora = 70 - (70 + passa) * (0.5 + 0.5 * Math.cos(2 * Math.PI * f));
      p[PS_P['cotovelo' + s]] = [500 + lad * 85, 450, 0.8];
      p[PS_P['punho' + s]] = [500 + lad * fora, 500, 0.7];
    });
    fr.push({ t, p });
  }
  return fr;
}
const tras = psAnalisarTras(corredorTras(), altura);
ok(perto(tras.m.queda, 6, 1), `queda do quadril: ${tras.m.queda} (esperado 6)`);
ok(tras.m.cruza === 0, `pés sem cruzar: ${tras.m.cruza}`);
ok(tras.qualidade.ok, `qualidade boa por trás: ${JSON.stringify(tras.qualidade.avisos)}`);
const trasCruza = psAnalisarTras(corredorTras({ queda: 2, cruza: true }), altura);
ok(perto(trasCruza.m.queda, 2, 1), `queda pequena: ${trasCruza.m.queda}`);
ok(trasCruza.m.cruza > 0.8, `pés cruzando: ${trasCruza.m.cruza}`);
// filmado por trás mas analisado como lado: avisa que a câmera não está de lado
ok(
  psAnalisarLado(corredorTras(), altura).qualidade.avisos.includes('nao_parece_lado'),
  'reconhece vídeo que não é de lado',
);

// 4. por trás, cada lado separado: apoio no pé esquerdo deixa o quadril direito cair 9°, no direito só 3°
const assim = psAnalisarTras(corredorTras({ queda: 3, quedaE: 9 }), altura);
ok(perto(assim.lados.E.queda, 9, 1.2), `queda com apoio no pé esquerdo: ${assim.lados.E.queda} (esperado 9)`);
ok(perto(assim.lados.D.queda, 3, 1.2), `queda com apoio no pé direito: ${assim.lados.D.queda} (esperado 3)`);
ok(perto(assim.m.queda, 9, 1.2), 'a queda geral fica com o pior lado');
ok(psAssimetria('queda', assim.lados.E.queda, assim.lados.D.queda).alto, 'diferença de 6° entre os lados é marcada');
ok(
  perto(tras.lados.E.passo, tras.lados.D.passo, 25),
  `tempo de passo igual nos dois lados: ${tras.lados.E.passo} x ${tras.lados.D.passo}`,
);
ok(perto(tras.lados.E.passo, 353, 25), `tempo de passo ≈ 353 ms a 170 passos/min: ${tras.lados.E.passo}`);
ok(tras.lados.E.contato > 200 && tras.lados.E.contato < 330, `contato por lado: ${tras.lados.E.contato}`);
ok(!psAssimetria('passo', 350, 360).alto && psAssimetria('passo', 320, 380).alto, 'assimetria de tempo acima de 10%');

// 5. medida de um quadro (conferência do treinador) bate com a conta automática
const frL = corredorLado();
const apL = lado.apoios[1];
const ptsDe = (f) => {
  const P = {};
  f.p.forEach((q, i) => q && (P[i] = [q[0], q[1]]));
  return P;
};
const anL = { vista: 'lado', lado: lado.lado, dir: lado.dir, altura };
const mq = psMedidasQuadro('contato', ptsDe(frL[apL.ic]), anL);
const s = { q: PS_P.quadrilE, j: PS_P.joelhoE, t: PS_P.tornE };
const fq = frL[apL.ic].p;
const tibiaEsp = (Math.atan2(fq[s.t][0] - fq[s.j][0], fq[s.t][1] - fq[s.j][1]) * 180) / Math.PI;
ok(perto(mq.tibia, tibiaEsp, 0.01), `tíbia do quadro: ${mq.tibia} x ${tibiaEsp}`);
ok(mq.frente > 5 && mq.frente < 20, `pé à frente no quadro: ${mq.frente}`);
const ma = psMedidasQuadro('apoio', ptsDe(frL[apL.meio]), anL);
ok(perto(ma.tronco, 7, 0.5), `tronco no quadro: ${ma.tronco}`);
// mexer o joelho para a frente muda a tíbia na direção certa
const P2 = ptsDe(frL[apL.ic]);
P2[PS_P.joelhoE] = [P2[PS_P.joelhoE][0] - 30, P2[PS_P.joelhoE][1]];
ok(psMedidasQuadro('contato', P2, anL).tibia > mq.tibia, 'joelho mais para trás aumenta a tíbia');
const anT = { vista: 'tras', troca: assim.troca, altura };
const frT = corredorTras({ queda: 3, quedaE: 9 });
const mt = psMedidasQuadro('E', ptsDe(frT[assim.apoiosE[1].meio]), anT);
ok(perto(mt.queda, 9, 1.5), `queda num quadro de apoio esquerdo: ${mt.queda}`);

// 6. medidas finais com as correções do treinador
const fin = psFinais({
  vista: 'tras',
  metricas: { queda: 9, joelhoDentro: 4 },
  extra: { lados: { E: { queda: 9 }, D: { queda: 3 } }, ajustes: { 'E.queda': { valor: 5, auto: 9 } } },
});
ok(fin.m.queda === 5 && fin.conf.has('queda') && fin.lados.E.queda === 5, 'correção do lado entra na queda geral');
const finL = psFinais({
  vista: 'lado',
  metricas: { tibia: 12, cadencia: 160 },
  extra: { ajustes: { tibia: { valor: 8, auto: 12 } } },
});
ok(
  finL.m.tibia === 8 && finL.m.cadencia === 160 && finL.conf.has('tibia'),
  'correção de lado troca só a medida conferida',
);
ok(psFinais({ vista: 'lado', metricas: { tibia: 1 } }).m.tibia === 1, 'análise antiga sem extra funciona');

// 7. antes e depois
ok(psCompara('cadencia', 158, 168).efeito === 'melhorou', 'cadência subindo para a faixa melhora');
ok(psCompara('cadencia', 168, 158).efeito === 'piorou', 'cadência caindo piora');
ok(psCompara('cadencia', 160, 161).efeito === 'igual', 'diferença pequena é igual (erro da medida)');
ok(psCompara('tibia', 14, 9).efeito === 'melhorou', 'tíbia voltando para a faixa melhora');
ok(psCompara('tronco', 6, 10).efeito === 'mudou', 'mudança dentro da faixa não é melhora nem piora');
ok(psCompara('contato', 260, 230).efeito === 'mudou', 'medida sem faixa só muda');
ok(psCompara('queda', null, 3) == null, 'sem valor anterior não compara');

// 8. câmera lenta: vídeo de 120 quadros salvo para tocar devagar (4 vezes) dá cadência 4 vezes menor
const lento = corredorLado({ fps: 30, seg: 3 }).map((f) => ({ t: f.t * 4, p: f.p }));
const anLento = psAnalisarLado(lento, altura);
ok(
  anLento.m.cadencia == null && psSugereFator(anLento.cadBruta) === 4,
  `percebe a câmera lenta: cadência ${anLento.cadBruta} → fator ${psSugereFator(anLento.cadBruta)}`,
);
const rapido = corredorLado({ fps: 120, seg: 3 });
const anRap = psAnalisarLado(rapido, altura);
ok(
  perto(anRap.m.cadencia, 170, 3) && anRap.m.contato != null,
  `a 120 qps mede cadência e contato: ${anRap.m.cadencia}, ${anRap.m.contato}`,
);
ok(psSugereFator(170) === 1 && psSugereFator(null) === 1, 'vídeo normal não muda');

// 9. ritmo
ok(perto(psRitmoKmh('6:00'), 10, 0.01) && perto(psRitmoKmh('10,5'), 10.5, 0.01), 'pace e km/h');
ok(psRitmoKmh('abc') == null && psRitmoKmh('0:30') == null, 'ritmo inválido');
ok(psPaceTxt(12) === '5:00/km', 'pace a partir de km/h');

// 10. braços: de lado, cotovelo a 90° e balanço de 35° à frente e 25° atrás
ok(perto(lado.m.cotovelo, 90, 2), `cotovelo: ${lado.m.cotovelo} (esperado 90)`);
ok(perto(lado.m.bracoFrente, 35, 3), `braço à frente: ${lado.m.bracoFrente} (esperado ≈ 35)`);
ok(perto(lado.m.bracoTras, 25, 3), `braço atrás: ${lado.m.bracoTras} (esperado ≈ 25)`);
ok(perto(esq.m.bracoFrente, 35, 3) && perto(esq.m.cotovelo, 90, 2), 'braços iguais correndo para a esquerda');
const aberto = psAnalisarLado(corredorLado({ cotovelo: 140, bracoF: 40, bracoT: 10 }), altura);
ok(perto(aberto.m.cotovelo, 140, 2), `cotovelo aberto: ${aberto.m.cotovelo}`);
ok(aberto.m.bracoTras < aberto.m.bracoFrente * 0.5, 'braço que vai mais à frente do que atrás');
ok(
  ['cotovelo', 'bracoFrente', 'bracoTras', 'bracoCruza'].every((k) => psNivel(k, 50) === 'info'),
  'braços sem faixa (só informação)',
);
// por trás: mão esquerda passa 30 px do meio, a direita não chega
const maos = psAnalisarTras(corredorTras({ maoE: 30 }), altura);
ok(maos.lados.E.bracoCruza > 4, `mão esquerda cruzando: ${maos.lados.E.bracoCruza} cm`);
ok(maos.lados.D.bracoCruza < 0, `mão direita sem cruzar: ${maos.lados.D.bracoCruza} cm`);
ok(perto(maos.m.bracoCruza, maos.lados.E.bracoCruza, 0.01), 'a medida geral fica com o lado que mais cruza');
ok(
  psAssimetria('bracoCruza', maos.lados.E.bracoCruza, maos.lados.D.bracoCruza).alto,
  'diferença grande entre as mãos é marcada',
);
// conferência: cotovelo medido no quadro do meio do apoio
const ptsA = ptsDe(frL[apL.meio]);
ok(perto(psMedidasQuadro('apoio', ptsA, anL).cotovelo, 90, 0.5), 'cotovelo num quadro');

if (erros.length) {
  console.error('Análise da passada: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Análise da passada: todas as contas conferidas.');
