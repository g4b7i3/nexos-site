// Teste automático da taxa de suor (a conta vira orientação de hidratação para o aluno).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31zm-suor.js'), 'utf8');
const m = src.match(/\/\* suor:puro:inicio \*\/([^]*?)\/\* suor:puro:fim \*\//);
if (!m) throw new Error('Bloco suor:puro não encontrado no app.');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { taxaSuor, suorPrever });', ctx);
const { taxaSuor, suorPrever } = ctx;
let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
// 70 kg, perdeu 1 kg em 1 h bebendo 500 ml: suou 1,5 L, 1,5 L/h, 1,4% do peso
let r = taxaSuor({ antes: 70, depois: 69, min: 60, bebeu: 500 });
ok(r.taxaMlh === 1500, 'taxa 1,5 L/h: ' + r.taxaMlh);
ok(r.suorMl === 1500, 'suor total 1500 ml');
ok(Math.abs(r.pct - 1.4) < 0.05, 'perda 1,4%: ' + r.pct);
ok(r.nivel === 'atencao', 'entre 1% e 2% é atenção');
// beber durante: 2% de 70 kg = 1,4 kg. Em 1 h: 1,5 - 1,4 = 0,1 L/h; em 2 h: 1,5 - 0,7 = 0,8 L/h; nunca mais que 1,5 L/h
ok(r.plano[0].min === 60 && r.plano[0].mlh === 100, '1 h: 100 ml/h: ' + r.plano[0].mlh);
ok(r.plano[2].min === 120 && r.plano[2].mlh === 800, '2 h: 800 ml/h: ' + r.plano[2].mlh);
ok(
  r.plano.every((p) => p.mlh <= p.maxMlh && p.maxMlh === 1500),
  'nunca beber mais do que sua',
);
// depois: 1,25 a 1,5 L por kg perdido
ok(r.depoisMl[0] === 1250 && r.depoisMl[1] === 1500, 'reposição 1,25 a 1,5 L');
// xixi desconta do suor
r = taxaSuor({ antes: 70, depois: 69, min: 60, bebeu: 500, xixi: 300 });
ok(r.taxaMlh === 1200, 'xixi desconta: ' + r.taxaMlh);
// meia hora: taxa dobra
r = taxaSuor({ antes: 60, depois: 59.6, min: 30, bebeu: 0 });
ok(r.taxaMlh === 800, '30 min: 0,8 L/h: ' + r.taxaMlh);
ok(r.nivel === 'ok', 'menos de 1% é ok');
ok(r.plano[0].mlh === 0, 'treino de 1 h com folga: pela sede');
// ganhou peso: bebeu demais
r = taxaSuor({ antes: 60, depois: 60.4, min: 90, bebeu: 1500 });
ok(r.nivel === 'ganhou' && r.depoisMl === null, 'ganhou peso: alerta de excesso, sem reposição');
// passou de 2%
r = taxaSuor({ antes: 60, depois: 58.6, min: 90, bebeu: 0 });
ok(r.nivel === 'alto', 'mais de 2% é alto: ' + r.pct);
// erros de digitação
ok(!!taxaSuor({ antes: 70, depois: 60, min: 60 }).erro, '10 kg de diferença é erro');
ok(!!taxaSuor({ antes: 70, depois: 70.5, min: 60, bebeu: 0 }).erro, 'sem suor é erro');
ok(!!taxaSuor({ antes: 70, depois: 69, min: 5 }).erro, 'treino curto demais é erro');
ok(!!taxaSuor({ antes: 7, depois: 6.5, min: 60 }).erro, 'peso fora da faixa é erro');
ok(!!taxaSuor({ antes: 70, depois: 67, min: 30, bebeu: 0 }).erro, 'mais de 4 L/h é erro');
// margem da balança: 2 × 100 g em 1 h = ±200 ml/h; balança de 50 g em 2 h = ±50 ml/h
ok(taxaSuor({ antes: 70, depois: 69, min: 60 }).erroMlh === 200, 'margem 100 g');
ok(taxaSuor({ antes: 70, depois: 69, min: 120, balancaG: 50 }).erroMlh === 50, 'margem 50 g em 2 h');
// previsão pelo calor
const regs = [
  { temp: 26, mlh: 800 },
  { temp: 28, mlh: 900 },
  { temp: 30, mlh: 1000 },
];
let p = suorPrever(regs, 29);
ok(p && p.mlh === 950 && p.porGrau === 50 && p.n === 3, 'reta 50 ml/h por grau: ' + JSON.stringify(p));
ok(suorPrever(regs.slice(0, 2), 29) === null, 'precisa de 3 medições');
ok(
  suorPrever(
    [
      { temp: 28, mlh: 900 },
      { temp: 29, mlh: 950 },
      { temp: 30, mlh: 1000 },
    ],
    29,
  ) === null,
  'precisa de 3 °C de diferença',
);
p = suorPrever(
  [
    { temp: 26, mlh: 1000 },
    { temp: 28, mlh: 900 },
    { temp: 30, mlh: 800 },
  ],
  34,
);
ok(p && p.mlh === 900 && p.porGrau === 0 && p.fora, 'taxa não cai com o calor: usa a média e avisa que está fora');
p = suorPrever(regs, 45);
ok(p && p.mlh <= 1300, 'limita a 130% da maior medida: ' + (p && p.mlh));
if (falhas) {
  console.error(`suor: ${falhas} falha(s)`);
  process.exit(1);
}
console.log('suor: ok');
