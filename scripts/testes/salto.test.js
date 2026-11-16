// Teste automático do aviso de salto na planilha: roda antes de cada publicação (scripts/versao.sh) e bloqueia se falhar.
// Treino mais de 10% acima do mais longo dos 30 dias anteriores (Frandsen et al. 2025) ganha aviso.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/27-ciclos-corrida.js'), 'utf8');
const ini = src.indexOf('/* salto:puro:inicio */'),
  fim = src.indexOf('/* salto:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do aviso de salto não encontrado (marcadores salto:puro).');
const { saltoTreino } = new Function(src.slice(ini, fim) + ';return {saltoTreino};')();
const erros = [];
const ok = (c, m) => c || erros.push(m);
const refs = [
  { id: 'c1', dia: '2026-10-20', km: 12 },
  { id: 'c2', dia: '2026-11-01', km: 10 },
  { id: 'c3', dia: '2026-11-08', km: 8 },
];

ok(saltoTreino('2026-11-16', 13, refs) === null, '13 km com 12 km de maior treino fica dentro dos 10%');
let s = saltoTreino('2026-11-16', 15, refs);
ok(s && s.pct === 25 && s.mx === 12 && s.nivel === 'medio', '15 km sobre 12 km é 25% acima');
ok(s && s.lim === 13, 'limite sugerido arredonda para meio quilômetro abaixo (13,2 vira 13)');
s = saltoTreino('2026-11-16', 18, refs);
ok(s && s.pct === 50 && s.nivel === 'alto', 'acima de 30% é nível alto');
// o treino de 12 km de 20/10 sai da janela de 30 dias em 20/11
s = saltoTreino('2026-11-21', 12, refs);
ok(s && s.mx === 10 && s.pct === 20, 'só conta o que está nos 30 dias anteriores');
ok(saltoTreino('2026-11-16', 15, []) === null, 'sem histórico não avisa');
ok(saltoTreino('2026-11-16', 0, refs) === null, 'treino sem distância não avisa');
ok(
  saltoTreino('2026-11-16', 3.4, [{ id: 'a', dia: '2026-11-10', km: 3 }]) === null,
  'diferença menor que meio km não avisa',
);
ok(
  saltoTreino('2026-11-16', 15, [...refs, { id: 'p1', dia: '2026-11-16', km: 15 }], 'p1') !== null,
  'o próprio treino não serve de referência',
);
ok(
  saltoTreino('2026-11-16', 15, [...refs, { id: 'p0', dia: '2026-11-14', km: 14 }]) === null,
  'treino planejado antes conta como referência',
);
ok(saltoTreino('2026-11-08', 15, refs).mx === 12, 'treino do mesmo dia ou depois não conta');

ok(
  saltoTreino('2027-01-16', 16, [{ id: 'a', dia: '2027-01-09', km: 14.5 }]).pct === 11,
  '10,3% acima aparece como 11%',
);

if (erros.length) {
  console.error('Aviso de salto com problema:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('salto: ok');
