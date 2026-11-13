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
    '\n;Object.assign(this, { PS_P, PS_LADO, psAng, psMediana, psApoios, psAnalisarLado, psAnalisarTras, psNivel, psCm, psDirecao, psLadoVisivel });',
  ctx,
);
const { PS_P, psAng, psMediana, psAnalisarLado, psAnalisarTras, psNivel, psDirecao, psLadoVisivel } = ctx;
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
function corredorLado({ cad = 170, dir = 1, fps = 60, seg = 3, tronco = 7, osc = 20, frente = 70 } = {}) {
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
      p[L === 'E' ? PS_P.ombroE : PS_P.ombroD] = [
        H[0] + (L === 'E' ? 0 : 6) + dir * 250 * Math.sin(rad(tronco)),
        H[1] - 250 * Math.cos(rad(tronco)),
        vis,
      ];
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

// 3. corredor por trás: quadril do lado sem apoio cai 6°, pés sem cruzar
function corredorTras({ queda = 6, cruza = false, fps = 60, seg = 3 } = {}) {
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
    if (apoioE) qD[1] += dy * Math.sin((Math.PI * fase0) / 0.38);
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

if (erros.length) {
  console.error('Análise da passada: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Análise da passada: todas as contas conferidas.');
