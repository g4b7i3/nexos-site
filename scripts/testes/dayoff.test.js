// Teste automático: as dicas do Day off do aluno mudam conforme a distância até a prova.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/09-tour-recordes-hidratacao.js'), 'utf8');
const m = src.match(/\/\* dayoff:puro:inicio \*\/([^]*?)\/\* dayoff:puro:fim \*\//);
if (!m) throw new Error('Bloco das dicas do Day off não encontrado no app (marcadores dayoff:puro).');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { dicasDayOff });', ctx);
const { dicasDayOff } = ctx;
let falhas = 0;
const ok = (c, msg) => {
  if (!c) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
const vesp = dicasDayOff(1, 5);
ok(vesp.length === 4 && /conhece/.test(vesp[0][0]), 'véspera traz as 4 dicas da véspera');
ok(
  /carboidrato/i.test(dicasDayOff(2, 5)[0][0]) && /carboidrato/i.test(dicasDayOff(3, 5)[0][0]),
  '2 e 3 dias antes falam de carboidrato',
);
for (const d of [undefined, null, 0, 4, 30]) {
  for (let n = 0; n < 12; n++) {
    const g = dicasDayOff(d, n);
    ok(g.length === 3, `fora da prova são 3 dicas (dias ${d}, n ${n})`);
    ok(new Set(g.map((x) => x[0])).size === 3, `sem dica repetida (dias ${d}, n ${n})`);
    ok(
      g.every((x) => x && x[0] && x[1]),
      `toda dica tem título e texto (dias ${d}, n ${n})`,
    );
  }
}
ok(dicasDayOff(null, 1)[0][0] !== dicasDayOff(null, 2)[0][0], 'as dicas mudam de um dia para o outro');
const todas = [1, 2, null].flatMap((d) => [0, 1, 2, 3, 4, 5].flatMap((n) => dicasDayOff(d, n)));
ok(
  todas.every((x) => !/[*_]{2}/.test(x.join(' '))),
  'nenhuma dica com asteriscos soltos',
);
if (falhas) {
  console.error(falhas + ' falha(s) no teste do Day off.');
  process.exit(1);
}
console.log('Day off: ok');
