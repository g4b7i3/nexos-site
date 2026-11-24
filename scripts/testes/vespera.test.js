// Teste automático do aviso da véspera (sono e calor), enviado pelo servidor com o mesmo código do app.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/09-tour-recordes-hidratacao.js'), 'utf8');
const c = src.match(/\/\* calor:puro:inicio[^]*?\*\/([^]*?)\/\* calor:puro:fim \*\//);
const v = src.match(/\/\* vespera:puro:inicio[^]*?\*\/([^]*?)\/\* vespera:puro:fim \*\//);
if (!c || !v) throw new Error('Blocos calor:puro ou vespera:puro não encontrados no app.');
const ctx = {};
vm.runInNewContext(c[1] + v[1] + '\n;Object.assign(this, { avisoVespera, horaHabitual, CALOR_LIMITES });', ctx);
const { avisoVespera, horaHabitual, CALOR_LIMITES } = ctx;
let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
const L = CALOR_LIMITES[3]; // São Luís: categoria 3
// previsão de amanhã com o mesmo WBGT em todas as horas, menos as indicadas
const prev = (w, extra = {}) => Array.from({ length: 24 }, (_, h) => ({ h, temp: 28, w: extra[h] ?? w }));
const leve = { titulo: 'Contínuo 30 min leve', tipo: 'rodagem' };
const forte = { titulo: 'Intervalado 6 × 400 m', tipo: 'intervalado' };
const base = { apelido: 'Vini', cat: 3, hora: 6 };

ok(horaHabitual([]) === 6, 'sem histórico, 6h');
ok(horaHabitual([5, 6, 6, 7, 18]) === 6, 'mediana das horas');
ok(horaHabitual([5, 18]) === 5, 'mediana com número par fica na menor');

ok(avisoVespera({ ...base, treino: null, prova: null, prev: prev(L[3] + 1) }) === null, 'sem treino amanhã, nada');
ok(avisoVespera({ ...base, treino: leve, prev: prev(L[0] - 1) }) === null, 'treino leve no tempo bom, nada');
ok(avisoVespera({ ...base, treino: leve, prev: prev(L[0] + 0.5) }) === null, 'leve com "atenção" não avisa');

const lf = avisoVespera({ ...base, treino: leve, prev: prev(L[1] + 0.5) });
ok(lf && /calor moderado/.test(lf.body) && !/dormir/.test(lf.body), 'leve com calor moderado avisa o calor, sem sono');
ok(lf && /atenção ao calor/.test(lf.title), 'título do calor');

const f = avisoVespera({ ...base, treino: forte, prev: prev(L[0] - 1) });
ok(
  f && /treino forte/.test(f.title) && /7 a 9 horas/.test(f.body) && !/°C/.test(f.body),
  'forte no tempo bom: só sono',
);

const fa = avisoVespera({ ...base, treino: forte, prev: prev(L[0] + 0.5) });
ok(fa && /um pouco mais quente/.test(fa.body) && /7 a 9 horas/.test(fa.body), 'forte com atenção: calor e sono');

const pr = avisoVespera({ ...base, treino: null, prova: 'Meia Maratona de São Luís', prev: prev(L[0] - 1) });
ok(pr && /dia de prova/.test(pr.title) && /Meia Maratona/.test(pr.body), 'véspera de prova');

const mh = avisoVespera({ ...base, hora: 7, treino: leve, prev: prev(L[2] + 0.5, { 5: L[0] - 1 }) });
ok(
  mh && /calor alto/.test(mh.body) && /mais fresco perto disso é 5h/.test(mh.body),
  'sugere o horário mais fresco perto',
);
const longe = avisoVespera({ ...base, hora: 17, treino: leve, prev: prev(L[2] + 0.5, { 5: L[0] - 1 }) });
ok(longe && !/mais fresco/.test(longe.body), 'não sugere horário a mais de 3 h do habitual');

ok(avisoVespera({ ...base, treino: leve, prev: [] }) === null, 'sem previsão e treino leve, nada');
const fsp = avisoVespera({ ...base, treino: forte, prev: [] });
ok(fsp && /7 a 9 horas/.test(fsp.body) && !/°C/.test(fsp.body), 'sem previsão, forte ainda lembra do sono');
ok(!/:/.test((f || {}).body || 'x:'), 'texto sem dois-pontos');

if (falhas) {
  console.error(`vespera.test.js: ${falhas} falha(s)`);
  process.exit(1);
}
console.log('vespera.test.js: ok');
