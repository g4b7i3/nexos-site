// Teste automático: quando o aluno corrige a distância do GPS, os tiros, as voltas e as parciais acompanham na proporção.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/14-corrida.js'), 'utf8');
const m = src.match(/\/\* distancia:puro:inicio[^]*?\*\/([^]*?)\/\* distancia:puro:fim \*\//);
if (!m) throw new Error('Bloco da distância não encontrado no app (marcadores distancia:puro).');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { escalarAnalise, parciaisDaSerie, tempoOficial, ehProvaC });', ctx);
const { escalarAnalise, parciaisDaSerie, tempoOficial, ehProvaC } = ctx;
let falhas = 0;
const ok = (c, msg) => {
  if (!c) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
// tiros de 2 min e trotes, GPS marcou 2.000 m e o certo era 2.500 m
const a = {
  v: 1,
  serie: { t: [0, 120, 240, 360, 480], d: [0, 600, 800, 1400, 2000], vel: [5, 5, 1.7, 5, 5] },
  voltas: [
    { d: 600, seg: 120 },
    { d: 200, seg: 120 },
    { d: 600, seg: 120 },
    { d: 600, seg: 120 },
  ],
  extras: { dispositivo: 'Celular (GPS)' },
};
const r = escalarAnalise(a, 2500 / 2000);
ok(r.voltas.length === 4 && r.voltas[0].d === 750 && r.voltas[1].d === 250, 'os tiros acompanham a distância certa');
ok(
  r.voltas.every((v, i) => v.seg === a.voltas[i].seg),
  'o tempo de cada tiro não muda',
);
ok(r.serie.d[4] === 2500 && r.serie.vel[0] === 6.25 && r.serie.t[4] === 480, 'a série acompanha, o tempo fica');
ok(
  r.extras.dispositivo === 'Celular (GPS)' && r.extras.distancia_corrigida === 1.25,
  'guarda que a distância foi corrigida',
);
ok(a.voltas[0].d === 600, 'não mexe no original');
const p = parciaisDaSerie(r.serie);
ok(p.length === 2 && p[0].km === 1 && p.reduce((x, y) => x + y.seg, 0) <= 480, 'parciais por km a partir da série');
ok(parciaisDaSerie(null) === null && parciaisDaSerie({ t: [0], d: [0] }) === null, 'sem série, sem parciais');
// tempo na distância oficial da prova (caso real: meia de BH, GPS 21,29 km, passagem nos 21,1 km com 1h56min30s)
const meia = {
  titulo: 'Belo Horizonte - Prova 21km',
  distancia_m: 21289,
  duracao_s: 7048,
  analise: {
    serie: { d: [20953, 21012, 21072, 21131, 21192, 21249, 21289], t: [6947, 6965, 6983, 7000, 7018, 7036, 7047] },
  },
};
const of = tempoOficial(meia, ehProvaC(meia));
ok(
  of && of.m === 21097.5 && of.nome === '21,1 km' && of.t === 6990,
  'meia: passagem nos 21,1 km pela série (1h56min30s)',
);
ok(Math.round(of.pace) === 331, 'meia: ritmo na distância oficial 5:31/km');
ok(tempoOficial(meia, false) === null, 'treino comum não ganha tempo oficial');
ok(
  ehProvaC({ titulo: 'Rodagem leve' }, { tipo: 'prova' }) && !ehProvaC({ titulo: 'Rodagem leve' }, { tipo: 'rodagem' }),
  'prova pela planilha',
);
ok(tempoOficial({ ...meia, distancia_m: 21090 }, true) === null, 'GPS abaixo da distância oficial: sem tempo oficial');
ok(tempoOficial({ ...meia, distancia_m: 23500 }, true) === null, 'mais de 5% acima: não é a mesma prova');
const dezk = {
  titulo: 'Prova 10k',
  distancia_m: 10120,
  analise: { serie: { d: [9900, 10050, 10120], t: [3000, 3045, 3066] } },
};
ok(tempoOficial(dezk, true).t === 3030 && tempoOficial(dezk, true).nome === '10 km', '10 km: interpolação certa');
if (falhas) process.exit(1);
console.log('Distância corrigida: tiros e parciais conferidos.');
