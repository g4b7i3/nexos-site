// Teste automático da leitura da VFC e das médias pessoais dos dados do relógio (Dados do relógio).
// Roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31-saude-atleta.js'), 'utf8');
const m = src.match(/\/\* vfc:puro:inicio[^]*?\*\/([^]*?)\/\* vfc:puro:fim \*\//);
if (!m) throw new Error('Bloco da VFC não encontrado no app (marcadores vfc:puro).');
const ctx = {};
vm.runInNewContext(
  m[1] + '\n;Object.assign(this, { leituraVfc, mediaPessoal, vfcDia, VFC_MIN_REF, VFC_MIN_SEMANA });',
  ctx,
);
const { leituraVfc, mediaPessoal, vfcDia, VFC_MIN_REF, VFC_MIN_SEMANA } = ctx;
const erros = [];
const ok = (cond, msg) => cond || erros.push(msg);
const HOJE = '2026-11-09';
// noites de hoje para trás: f(i) dá o valor da noite i dias atrás
const serie = (n, f) => Array.from({ length: n }, (_, i) => ({ dia: vfcDia(HOJE, -i), v: f(i) }));
const ruido = (i) => 50 + [3, -4, 2, -1, 5, -3, 0, 4, -2, 1][i % 10];

// 1. datas
ok(vfcDia('2026-03-01', -1) === '2026-02-28', 'vfcDia: 1º de março menos 1 dia');
ok(vfcDia('2026-12-31', 1) === '2027-01-01', 'vfcDia: virada do ano');

// 2. sem referência suficiente não há leitura, só a contagem
ok(leituraVfc([], HOJE).estado === 'base', 'sem noites deveria ser base');
ok(
  leituraVfc(serie(VFC_MIN_REF + VFC_MIN_SEMANA - 1, ruido), HOJE).estado === 'base',
  'com uma noite a menos deveria ser base',
);
ok(leituraVfc(serie(30, ruido), HOJE).estado !== 'base', '30 noites deveriam dar leitura');
// semana sem noites suficientes: base, mesmo com referência longa
ok(
  leituraVfc(
    serie(40, ruido).filter((x, i) => i >= 5),
    HOJE,
  ).estado === 'base',
  'só 2 noites na semana deveria ser base',
);

// 3. valores iguais todo dia: dentro do normal
ok(
  leituraVfc(
    serie(30, () => 50),
    HOJE,
  ).estado === 'normal',
  'VFC constante deveria ser normal',
);
// variação pequena e estável: normal
ok(leituraVfc(serie(40, ruido), HOJE).estado === 'normal', 'VFC estável com ruído deveria ser normal');
// queda clara na última semana: abaixo; subida clara: acima
ok(
  leituraVfc(
    serie(40, (i) => (i < 7 ? 35 : ruido(i))),
    HOJE,
  ).estado === 'abaixo',
  'queda de 30% na semana deveria ser abaixo',
);
ok(
  leituraVfc(
    serie(40, (i) => (i < 7 ? 70 : ruido(i))),
    HOJE,
  ).estado === 'acima',
  'subida de 40% na semana deveria ser acima',
);
// variação do dia a dia de uma pessoa real (CV perto de 8%): uma noite um pouco mais baixa não muda a leitura
const real = (i) => 50 * Math.exp(0.08 * [0.9, -1.2, 0.4, -0.3, 1.5, -0.8, 0.1, 1.1, -0.6, 0.2, -1.4, 0.7][i % 12]);
ok(leituraVfc(serie(40, real), HOJE).estado === 'normal', 'VFC real estável deveria ser normal');
ok(
  leituraVfc(
    serie(40, (i) => (i === 0 ? 44 : real(i))),
    HOJE,
  ).estado === 'normal',
  'uma noite um pouco mais baixa não deveria virar abaixo',
);
// a faixa contém a média de referência e a semana bate com a média geométrica
const L = leituraVfc(
  serie(30, () => 50),
  HOJE,
);
ok(
  Math.abs(L.semana - 50) < 1e-6 && L.faixa[0] <= 50 + 1e-6 && L.faixa[1] >= 50 - 1e-6,
  'faixa e média da semana com VFC constante',
);

// 4. noites futuras, zeradas ou muito antigas não entram
const lixo = [
  { dia: vfcDia(HOJE, 1), v: 10 },
  { dia: vfcDia(HOJE, -1), v: 0 },
  { dia: vfcDia(HOJE, -2), v: null },
  { dia: vfcDia(HOJE, -90), v: 5 },
];
ok(
  leituraVfc([...serie(30, () => 50).filter((x, i) => i !== 1 && i !== 2), ...lixo], HOJE).estado === 'normal',
  'valores inválidos deveriam ser ignorados',
);

// 5. média pessoal (FC de repouso): só dias anteriores a hoje, dentro da janela, com mínimo de dias
const fc = serie(40, (i) => (i === 0 ? 90 : 50));
ok(mediaPessoal(fc, HOJE) === 50, `média de 30 dias deveria ignorar hoje: ${mediaPessoal(fc, HOJE)}`);
ok(
  mediaPessoal(
    serie(5, () => 50),
    HOJE,
  ) === null,
  'com menos de 7 dias não há média',
);
ok(
  mediaPessoal(
    serie(40, (i) => (i > 30 ? 200 : 50)),
    HOJE,
  ) === 50,
  'dias fora da janela de 30 dias não entram',
);

if (erros.length) {
  console.error('VFC: ' + erros.length + ' erro(s):\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('VFC e médias do relógio: tudo certo.');
