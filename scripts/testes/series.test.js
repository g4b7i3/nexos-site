// Teste automático do card de séries (tiros, acelerações, ritmo): roda antes de cada publicação (scripts/versao.sh).
// Confere com voltas reais do relógio que o card reconhece o tipo do treino pela planilha e separa os tiros
// do aquecimento e da recuperação. Nasceu de dois erros: acelerações num dia "regenerativo" que viraram
// "Regenerativo" sem tiros, e 3 × 1 km de ritmo em que o aquecimento entrava como tiro.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bloco = (arq, nome) => {
  const s = fs.readFileSync(path.join(__dirname, '../../app/js/' + arq), 'utf8');
  const m = s.match(new RegExp('/\\* ' + nome + ':puro:inicio[^]*?\\*/([^]*?)/\\* ' + nome + ':puro:fim \\*/'));
  if (!m) throw new Error(`Bloco ${nome} não encontrado em ${arq} (marcadores ${nome}:puro).`);
  return m[1];
};
const ctx = { estruturaDe: (p) => (p && p.estrutura) || [] };
vm.runInNewContext(
  bloco('15-leitura-nexos.js', 'voltas') +
    '\n' +
    bloco('14-corrida.js', 'serie') +
    '\n;Object.assign(this, { serieDe, tirosDe });',
  ctx,
);
const { serieDe, tirosDe } = ctx;
const erros = [];
const ok = (c, m) => c || erros.push(m);
const V = (l) => l.map(([d, seg]) => ({ d, seg }));
const card = (c, p) => {
  c._serie = serieDe(c, p);
  return { s: c._serie, t: tirosDe(c) };
};

// 1) regenerativo com 4 acelerações de 200 m (voltas reais, 19/11/2026)
const a = card(
  {
    titulo: 'Soltura + acelerações · polim',
    analise: {
      voltas: V([
        [1001, 397],
        [999, 365],
        [1000, 356],
        [234, 82],
        [200, 54],
        [152, 59],
        [200, 53],
        [154, 59],
        [201, 54],
        [153, 59],
        [200, 52],
        [166, 59],
        [15, 10],
      ]),
    },
  },
  {
    tipo: 'regenerativo',
    titulo: 'Soltura + acelerações · polimento',
    estrutura: [
      { k: 'co', v: 20, z: 'leve', med: 'min' },
      {
        k: 'rep',
        n: 4,
        passos: [
          { k: 'co', v: 200, z: 'limiar', med: 'm' },
          { k: 'rc', v: 1, z: 'rec', med: 'min' },
        ],
      },
    ],
  },
);
ok(a.s.titulo === 'Acelerações' && a.s.qual, 'acelerações em dia regenerativo viram card de séries');
ok(a.t.length === 4 && a.t.every((v) => v.d >= 195 && v.d <= 205), 'as 4 acelerações de 200 m, sem a volta de 234 m');
ok(a.s.nome === 'Soltura + acelerações', 'card de nome usa o nome do treino, não "Regenerativo"');

// 2) ritmo de prova: 2 km de aquecimento + 3 × 1 km (voltas reais, 18/11/2026)
const r = card(
  {
    titulo: 'Ritmo de prova curto',
    analise: {
      voltas: V([
        [1000, 393],
        [1000, 362],
        [1000, 308],
        [211, 120],
        [1000, 300],
        [220, 120],
        [1000, 301],
        [253, 120],
        [3, 1],
        [37, 17],
      ]),
    },
  },
  {
    tipo: 'ritmo',
    titulo: 'Ritmo de prova curto · polimento',
    estrutura: [
      { k: 'aq', v: 2, z: 'leve', med: 'km' },
      {
        k: 'rep',
        n: 3,
        passos: [
          { k: 'co', v: 1, z: 'maratona', med: 'km' },
          { k: 'ca', v: 2, z: 'rec', med: 'min' },
        ],
      },
    ],
  },
);
ok(r.s.titulo === 'Ritmo de prova', 'ritmo de maratona não vira "Limiar"');
ok(r.t.length === 3 && r.t.map((v) => v.seg).join() === '308,300,301', 'os 3 tiros de 1 km, sem o aquecimento');

// 3) rodagem contínua: nada de tiros
const c = card(
  {
    titulo: 'Rodagem',
    analise: {
      voltas: V([
        [1000, 350],
        [1000, 348],
        [1000, 352],
        [1000, 349],
        [1000, 351],
        [1000, 347],
      ]),
    },
  },
  { tipo: 'rodagem', titulo: 'Rodagem leve 6 km', estrutura: [{ k: 'co', v: 6, z: 'leve', med: 'km' }] },
);
ok(!c.s.qual && c.t.length === 0, 'rodagem contínua não tem card de tiros');
ok(c.s.nome === 'Rodagem leve 6 km', 'rodagem usa o nome do treino');

// 4) sem planilha, título "Tiros": separa pelo pace
const s = card(
  {
    titulo: 'Tiros 5 × 400',
    analise: {
      voltas: V([
        [1000, 380],
        [400, 92],
        [200, 75],
        [400, 91],
        [200, 76],
        [400, 90],
        [200, 74],
        [400, 92],
        [200, 75],
        [400, 90],
        [1000, 385],
      ]),
    },
  },
  null,
);
ok(s.s.titulo === 'Tiros' && s.t.length === 5, 'tiros sem planilha: 5 × 400 pelo pace');

if (erros.length) {
  console.error('Card de séries: ' + erros.length + ' erro(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Card de séries: conferido.');
