// Teste automático do metrônomo: o trecho que se repete tem de ter batidas igualmente espaçadas, inclusive na emenda.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31zh-metronomo.js'), 'utf8');
const m = src.match(/\/\* metronomo:puro:inicio[^]*?\*\/([^]*?)\/\* metronomo:puro:fim \*\//);
if (!m) throw new Error('Bloco do metrônomo não encontrado no app (marcadores metronomo:puro).');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { metroLimite, metroLaco, metroBatidas });', ctx);
const { metroLimite, metroLaco, metroBatidas } = ctx;
let falhas = 0;
const ok = (c, msg) => {
  if (!c) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
ok(
  metroLimite(90) === 120 && metroLimite(300) === 220 && metroLimite(144.6) === 145 && metroLimite(null) === 170,
  'limites',
);
for (const bpm of [120, 145, 163, 170, 181, 220]) {
  const taxa = 22050;
  const { seg, n } = metroLaco(bpm);
  const b = metroBatidas(bpm, taxa);
  const total = Math.round(seg * taxa);
  const passo = (60 / bpm) * taxa;
  // espaço entre batidas (e na emenda do fim para o começo) nunca erra mais de 1 amostra
  const gaps = b
    .slice(1)
    .map((x, i) => x - b[i])
    .concat(total - b[b.length - 1]);
  ok(
    gaps.every((g) => Math.abs(g - passo) <= 1),
    `batidas iguais a ${bpm}`,
  );
  ok(n >= 4 && Math.abs(seg - 30) < 60 / bpm, `trecho perto de 30 s a ${bpm}`);
  // tempo médio exato: n batidas em seg segundos
  ok(Math.abs((n / seg) * 60 - bpm) < 1e-9, `cadência exata a ${bpm}`);
}
if (falhas) {
  console.error(`Metrônomo: ${falhas} conta(s) com problema.`);
  process.exit(1);
}
console.log('Metrônomo: batidas conferidas.');
