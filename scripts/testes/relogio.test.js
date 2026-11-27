// Teste automático do card Relógio e zonas de FC (só a equipe vê): roda antes de cada publicação (scripts/versao.sh).
// Os casos imitam os alunos reais de novembro de 2026, sem nomes: relógio com FC máxima baixa e zonas de fábrica
// (ajustar), FC alta de verdade no pace certo (orientar), leve corrido rápido (segurar o pace) e tudo certo.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31zq-relogio-zonas.js'), 'utf8');
const m = src.match(/\/\* relogio:puro:inicio \*\/([^]*?)\/\* relogio:puro:fim \*\//);
if (!m) throw new Error('Bloco relogio:puro não encontrado em 31zq-relogio-zonas.js.');
const { rzAnalisar, rzFcMaxTanaka } = new Function(m[1] + ';return {rzAnalisar, rzFcMaxTanaka};')();
const erros = [];
const ok = (c, msg) => c || erros.push(msg);
const T = (pace, fc, t, lim) => ({ pace, fc, t, lim });

// 23 anos, pace dentro do leve, relógio com Z5 em 161 (FC máxima de uns 179)
let a = rzAnalisar({
  treinos: [
    T(272, 142, [23, 61, 501, 1577, 0], [90, 108, 126, 143, 161]),
    T(271, 149, [20, 5, 368, 2307, 1], [91, 109, 127, 145, 163]),
    T(313, 133, [31, 314, 2070, 299, 0], [91, 109, 127, 145, 163]),
  ],
  leve: [262, 291],
  idade: 23,
});
ok(a.tipo === 'relogio', 'pace certo, FC moderada e Z4 no relógio: ajustar o relógio');
ok(a.fcMax === 192 && a.zonas.join() === '106,138,157,167,177', 'zonas pelo Olympiatoppen sobre a FC de Tanaka');
ok(a.maxRel >= 178 && a.maxRel <= 182, 'FC máxima que o relógio usa sai do início da Z5');

// FC máxima medida 190, pace no leve, FC média 158 (83%)
a = rzAnalisar({
  treinos: [
    T(382, 161, [36, 30, 27, 2210, 0], [103, 123, 140, 152, 175]),
    T(348, 158, [11, 15, 20, 2027, 0], [102, 122, 139, 151, 174]),
  ],
  leve: [340, 391],
  idade: 32,
  fcMaxMedida: 190,
});
ok(a.tipo === 'alta' && a.medida, 'FC acima de 82% da máxima no pace certo: FC alta de verdade');

// 57 anos, leve 7:35 a 7:50, correndo 7:28
a = rzAnalisar({
  treinos: [
    T(446, 164, [18, 29, 103, 1035, 585], [97, 116, 135, 154, 173]),
    T(448, 160, [8, 31, 161, 1340, 225], [97, 116, 135, 154, 173]),
  ],
  leve: [455, 470],
  idade: 57,
});
ok(a.tipo === 'forte', 'mais rápido que a faixa do leve: segurar o pace');

// pouco tempo em Z4
a = rzAnalisar({
  treinos: [
    T(340, 138, [59, 254, 2640, 8, 0], [96, 114, 133, 152, 171]),
    T(363, 136, [166, 398, 1841, 102, 0], [96, 114, 133, 152, 171]),
  ],
  leve: [319, 354],
  idade: 33,
});
ok(a.tipo === 'ok', 'pouco tempo em Z4 ou Z5: tudo certo');

ok(
  rzAnalisar({ treinos: [T(300, 140, [0, 0, 0, 100, 0], [])], leve: [280, 300], idade: 30 }) === null,
  'um treino só não basta',
);
ok(rzFcMaxTanaka(40) === 180 && rzFcMaxTanaka(null) === null, 'Tanaka: 208 − 0,7 × idade');

if (erros.length) {
  console.error('Relógio e zonas de FC com erro:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('Relógio e zonas de FC: conferido.');
