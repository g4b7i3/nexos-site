// Meus tênis: a quilometragem de cada par e o aviso de troca
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31x-tenis.js'), 'utf8');
const m = src.match(/\/\* tenis:puro:inicio \*\/([\s\S]*?)\/\* tenis:puro:fim \*\//);
if (!m) throw new Error('bloco tenis:puro não encontrado');
const { tnKm, tnEstado, tnSomar } = new Function(m[1] + '; return { tnKm, tnEstado, tnSomar };')();
const erros = [];
const ok = (c, msg) => c || erros.push(msg);
const perto = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

ok(perto(tnKm({ km_inicial: 120 }, 35500), 155.5), 'km antes do app + corridas');
ok(perto(tnKm({ km_inicial: null }, 10000), 10), 'sem km anterior');
ok(perto(tnKm({ km_inicial: -5 }, -100), 0), 'nunca negativo');
const s = tnSomar([
  { tenis_id: 'a', distancia_m: 5000 },
  { tenis_id: 'a', distancia_m: '7500' },
  { tenis_id: 'b', distancia_m: 10000 },
  { tenis_id: null, distancia_m: 3000 },
  { tenis_id: 'b', distancia_m: null },
]);
ok(
  s.a === 12500 && s.b === 10000 && Object.keys(s).length === 2,
  'soma por tênis ignora corrida sem tênis e sem distância',
);
ok(tnEstado(500, 700).nivel === 'ok', '500 de 700 km está em uso');
ok(tnEstado(595, 700).nivel === 'perto', '85% do limite avisa');
ok(tnEstado(700, 700).nivel === 'trocar', 'no limite é hora de trocar');
ok(perto(tnEstado(650, 700).falta, 50), 'quanto falta');
ok(tnEstado(900, 700).falta === 0, 'depois do limite não falta nada');
ok(tnEstado(350, 0).pct === 0.5, 'sem limite usa 700 km');

if (erros.length) {
  console.error('Meus tênis: ' + erros.join('; '));
  process.exit(1);
}
console.log('Meus tênis: contas conferidas.');
