// Teste automático da Avaliação do movimento: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere as contas com bonecos montados à mão (ângulo do joelho, abertura, queda do quadril, canela e as faixas).
const fs = require('fs');
const path = require('path');
const ps = fs.readFileSync(path.join(__dirname, '../../app/js/31p-passada.js'), 'utf8');
const mv = fs.readFileSync(path.join(__dirname, '../../app/js/31v-movimento.js'), 'utf8');
const corta = (s, a, b) => {
  const i = s.indexOf(a),
    j = s.indexOf(b);
  if (i < 0 || j < 0) throw new Error('Bloco não encontrado: ' + a);
  return s.slice(i, j);
};
const api = new Function(
  corta(ps, '/* passada:puro:inicio', '/* passada:puro:fim */') +
    corta(mv, '/* movimento:puro:inicio', '/* movimento:puro:fim */') +
    ';return {mvFppa, mvKasr, mvFundos, mvNivel, mvAnalisar, PS_P};',
)();
const { mvFppa, mvKasr, mvFundos, mvNivel, mvAnalisar, PS_P } = api;
const erros = [];
const ok = (c, m) => c || erros.push(m);
const perto = (a, b, t = 1) => a != null && Math.abs(a - b) <= t;
// joelho esquerdo da pessoa aparece à direita da imagem (filmagem de frente); o meio do corpo fica em x = 300
// quadril (350,300), tornozelo (350,600): joelho em (330,450) vai para o meio do corpo = para dentro
const q = [350, 300],
  t = [350, 600];
const v1 = mvFppa(q, [330, 450], t, 300);
ok(v1 > 0 && perto(v1, 15.2, 0.5), 'joelho para dentro dá ângulo positivo de ~15°: ' + v1);
const v2 = mvFppa(q, [370, 450], t, 300);
ok(v2 < 0, 'joelho para fora dá ângulo negativo: ' + v2);
ok(perto(mvFppa(q, [350, 450], t, 300), 0, 0.01), 'perna reta dá zero');
ok(perto(mvKasr([280, 450], [320, 450], [250, 600], [350, 600]), 0.4, 0.001), 'abertura dos joelhos 0,4');
// fundos de 3 agachamentos (y do quadril sobe e desce)
const ys = [];
for (let i = 0; i < 90; i++)
  ys.push(300 + 100 * Math.max(0, Math.sin((i / 30) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5));
ok(mvFundos(ys, 30).length === 3, '3 repetições achadas: ' + mvFundos(ys, 30).length);
ok(
  mvNivel('unipodal', 'valgo', 6) === 'ok' &&
    mvNivel('unipodal', 'valgo', 12) === 'atencao' &&
    mvNivel('unipodal', 'valgo', 18) === 'fora',
  'faixas do joelho',
);
ok(mvNivel('unipodal', 'valgo', -10) === 'ok', 'joelho para fora não conta como joelho para dentro');
ok(
  mvNivel('salto', 'valgoE', 14) === 'atencao' &&
    mvNivel('agach_frente', 'valgoE', 14) === 'atencao' &&
    mvNivel('salto', 'valgoE', 11) === 'ok',
  'faixas do salto',
);
ok(
  mvNivel('tornozelo', 'canela', 42) === 'ok' &&
    mvNivel('tornozelo', 'canela', 36) === 'atencao' &&
    mvNivel('tornozelo', 'canela', 30) === 'fora',
  'faixas do tornozelo',
);
ok(
  mvNivel('unipodal', 'pelve', -9) === 'ok' && mvNivel('unipodal', 'pelve', 9) === 'fora',
  'quadril que sobe não conta como queda',
);
ok(mvNivel('salto', 'kasr', 0.9) === 'ok' && mvNivel('salto', 'kasr', 0.5) === 'fora', 'faixas da abertura');
// boneco do teste do joelho na parede: canela a 40° da vertical
const boneco = (ang) => {
  const p = Array.from({ length: 33 }, () => [0, 0, 0]);
  const T = [400, 700],
    r = (ang * Math.PI) / 180;
  const J = [T[0] + 200 * Math.sin(r), T[1] - 200 * Math.cos(r)];
  p[PS_P.tornE] = [...T, 1];
  p[PS_P.joelhoE] = [...J, 1];
  p[PS_P.quadrilE] = [J[0] - 60, J[1] - 200, 1];
  p[PS_P.calcE] = [T[0] - 20, T[1] + 10, 1];
  p[PS_P.pontaE] = [T[0] + 60, T[1] + 10, 1];
  return { p };
};
const fr = [];
for (let i = 0; i < 40; i++) fr.push(boneco(i < 10 ? 20 : i < 30 ? 20 + (i - 10) : 40));
const an = mvAnalisar('tornozelo', fr, 30, 'E');
ok(perto(an.m.canela, 40, 1), 'canela a 40°: ' + an.m.canela);
if (erros.length) {
  console.error('Avaliação do movimento: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Avaliação do movimento: contas conferidas.');
