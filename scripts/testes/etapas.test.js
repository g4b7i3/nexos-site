// Teste automático das etapas do treino: roda antes de cada publicação (scripts/versao.sh).
// O relógio parte os tiros longos em voltas de 1 km (volta automática) e deixa pedacinhos de poucos segundos;
// aqui confere com voltas reais (sem nomes) que o app junta tudo de volta nas etapas da planilha:
// aquecimento, cada tiro e cada recuperação, e desaquecimento. Nasceu de um 3 × 8 min que aparecia picado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const s = fs.readFileSync(path.join(__dirname, '../../app/js/15-leitura-nexos.js'), 'utf8');
const m = s.match(/\/\* voltas:puro:inicio[^]*?\*\/([^]*?)\/\* voltas:puro:fim \*\//);
if (!m) throw new Error('Bloco voltas:puro não encontrado em 15-leitura-nexos.js.');
const ctx = {};
vm.runInNewContext(m[1] + ';this.etapasDasVoltas = etapasDasVoltas; this.tirosDasVoltas = tirosDasVoltas;', ctx);
const { etapasDasVoltas, tirosDasVoltas } = ctx;
const erros = [];
const ok = (c, msg) => c || erros.push(msg);
const V = (l) => l.map(([d, seg]) => ({ d, seg }));
const rep = (n, ...p) => ({ k: 'rep', n, passos: p.map(([k, v, med]) => ({ k, v, med })) });
const resumo = (r) => r && r.etapas.map((e) => `${e.k}${e.rep || ''}:${Math.round(e.seg)}`).join(' ');

// 3 × 8 min com 1 min: tiro 1 = 1000 m + 275 m, tiros 2 e 3 com pedacinhos de 10 s e 5 s
let r = etapasDasVoltas(
  V([
    [1000, 414],
    [1000, 428],
    [1000, 371],
    [275, 109],
    [89, 60],
    [1000, 470],
    [15, 10],
    [83, 60],
    [1000, 475],
    [8, 5],
    [92, 60],
    [1000, 507],
    [6, 4],
  ]),
  rep(3, ['co', 8, 'min'], ['rc', 1, 'min']),
);
ok(resumo(r) === 'aq:842 co1:480 rc1:60 co2:480 rc2:60 co3:480 rc3:60 dq:511', '3 × 8 min: ' + resumo(r));
ok(r && Math.round(r.esf[0].d) === 1275, '3 × 8 min: o 1º tiro tem 1275 m');

// 5 × 6 min: cada tiro partido em 1000 m + ~740 m
r = etapasDasVoltas(
  V([
    [1000, 265],
    [1000, 267],
    [1000, 208],
    [748, 152],
    [220, 60],
    [1000, 209],
    [744, 151],
    [229, 60],
    [1000, 208],
    [738, 152],
    [229, 60],
    [1000, 208],
    [736, 152],
    [229, 60],
    [1000, 208],
    [720, 152],
    [214, 60],
    [1000, 258],
    [10, 2],
  ]),
  rep(5, ['co', 6, 'min'], ['rc', 1, 'min']),
);
ok(r && r.esf.length === 5 && r.esf.every((e) => e.seg === 360), '5 × 6 min: ' + resumo(r));

// 2 × 2 km (distância) partidos em dois de 1 km
r = etapasDasVoltas(
  V([
    [1000, 391],
    [1000, 362],
    [1002, 311],
    [998, 308],
    [145, 59],
    [1000, 305],
    [1002, 303],
    [140, 59],
    [1003, 358],
    [4, 1],
  ]),
  rep(2, ['co', 2, 'km'], ['rc', 1, 'min']),
);
ok(resumo(r) === 'aq:753 co1:619 rc1:59 co2:608 rc2:59 dq:359', '2 × 2 km: ' + resumo(r));

// corre e caminha pelo celular: cada passo já é uma volta
r = etapasDasVoltas(
  V([
    [366, 300],
    [143, 60],
    [125, 91],
    [158, 60],
    [132, 91],
    [156, 60],
    [88, 142],
    [227, 60],
    [121, 91],
    [148, 60],
    [112, 91],
    [139, 60],
    [120, 91],
    [135, 60],
    [111, 91],
    [162, 60],
    [128, 91],
    [386, 301],
    [37, 31],
  ]),
  rep(8, ['co', 1, 'min'], ['ca', 1.5, 'min']),
);
// a 3ª caminhada durou 142 s (o celular pausou): as outras batem, então monta as etapas com ela como está
ok(
  r && r.esf.length === 8 && r.rec[2].seg === 142 && r.etapas[0].k === 'aq',
  'corre e caminha com uma caminhada fora do tempo: ' + resumo(r),
);

// rodagem 5 km + 4 acelerações de 100 m (o que vem antes das séries entra como uma etapa só)
r = etapasDasVoltas(
  V([
    [1000, 382],
    [1000, 341],
    [1000, 331],
    [1000, 311],
    [1000, 317],
    [100, 25],
    [100, 44],
    [100, 23],
    [100, 43],
    [100, 23],
    [100, 55],
    [100, 22],
    [100, 44],
    [214, 71],
  ]),
  rep(4, ['co', 100, 'm'], ['rc', 100, 'm']),
);
ok(
  resumo(r) === 'aq:1682 co1:25 rc1:44 co2:23 rc2:43 co3:23 rc3:55 co4:22 rc4:44 dq:71',
  'rodagem + acelerações: ' + resumo(r),
);

// 6 × 200 m terminando com voltas soltas
r = etapasDasVoltas(
  V([
    [1000, 325],
    [500, 179],
    [200, 41],
    [279, 120],
    [200, 38],
    [246, 120],
    [200, 36],
    [224, 120],
    [200, 37],
    [235, 120],
    [200, 35],
    [281, 120],
    [6, 2],
    [5, 1],
    [163, 59],
  ]),
  rep(6, ['co', 200, 'm'], ['rc', 2, 'min']),
);
ok(r && r.esf.length === 5, '6 × 200 m com 5 feitos: ' + resumo(r));

// registro manual com 2 voltas: sem etapas
ok(
  etapasDasVoltas(
    V([
      [1000, 932],
      [820, 855],
    ]),
    rep(8, ['co', 1, 'min'], ['rc', 1.5, 'min']),
  ) === null,
  'manual: sem etapas',
);

// tirosDasVoltas usa as etapas quando há planilha
const t = tirosDasVoltas(
  V([
    [1000, 414],
    [1000, 428],
    [1000, 371],
    [275, 109],
    [89, 60],
    [1000, 470],
    [15, 10],
    [83, 60],
    [1000, 475],
    [8, 5],
    [92, 60],
    [1000, 507],
    [6, 4],
  ]),
  true,
  rep(3, ['co', 8, 'min'], ['rc', 1, 'min']),
);
ok(t && t.esf.length === 3 && t.rec.length === 3 && t.etapas, 'tiros do 3 × 8 min vêm das etapas');

if (erros.length) {
  console.error('Etapas do treino: ' + erros.length + ' erro(s)\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Etapas do treino: voltas juntadas nas etapas da planilha.');
