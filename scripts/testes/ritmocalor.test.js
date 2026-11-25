// Teste automático da sugestão de ritmo no calor (o treinador aplica ou dispensa; a planilha nunca muda).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/09-tour-recordes-hidratacao.js'), 'utf8');
const bloco = (n) => {
  const m = src.match(new RegExp(`/\\* ${n}:puro:inicio[^]*?\\*/([^]*?)/\\* ${n}:puro:fim \\*/`));
  if (!m) throw new Error(`Bloco ${n}:puro não encontrado no app.`);
  return m[1];
};
const ctx = {};
vm.runInNewContext(
  bloco('calor') + bloco('vespera') + bloco('ritmocalor') + '\n;Object.assign(this, { sugestaoCalor, CALOR_LIMITES });',
  ctx,
);
const { sugestaoCalor, CALOR_LIMITES } = ctx;
let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
const L = CALOR_LIMITES[3]; // São Luís
const prev = (w, extra = {}) => Array.from({ length: 24 }, (_, h) => ({ h, temp: 29, w: extra[h] ?? w }));
const leve = { tipo: 'rodagem', titulo: 'Contínuo 30 min leve', estrutura: [{ k: 'co', v: 30, z: 'leve', med: 'min' }] };
const tiros = {
  tipo: 'tiros',
  titulo: 'Tiros 7 × 1 min',
  estrutura: [
    { k: 'aq', v: 10, z: 'leve', med: 'min' },
    { k: 'rep', n: 7, passos: [{ k: 'co', v: 1, z: 'limiar', med: 'min' }, { k: 'rc', v: 1, z: 'rec', med: 'min' }] },
  ],
};
const aceleracoes = {
  tipo: 'rodagem',
  titulo: 'Rodagem 6 km + 6 acelerações',
  estrutura: [
    { k: 'co', v: 6, z: 'leve', med: 'km' },
    { k: 'rep', n: 6, passos: [{ k: 'co', v: 100, z: 'tiros', med: 'm' }, { k: 'rc', v: 100, z: 'rec', med: 'm' }] },
  ],
};
const cc = { ...tiros, tipo: 'intervalado', titulo: 'Corre e caminha 8 × 2 min' };
const b = { cat: 3, hora: 6 };

ok(sugestaoCalor({ ...b, treino: leve, prev: prev(L[0] - 1) }) === null, 'tempo bom: nenhuma sugestão');
ok(sugestaoCalor({ ...b, treino: null, prev: prev(L[3] + 1) }) === null, 'sem treino: nada');
ok(sugestaoCalor({ ...b, treino: leve, prev: [] }) === null, 'sem previsão: nada');

const a1 = sugestaoCalor({ ...b, treino: leve, prev: prev(L[0] + 0.3) });
ok(a1 && a1.modo === 'ritmo' && a1.pct[0] === 0.02 && a1.pct[1] === 0.04, 'atenção: 2% a 4% mais lento');
ok(a1 && /2% a 4% mais lento/.test(a1.texto) && /frequência cardíaca/.test(a1.texto), 'texto do contínuo');
const a3 = sugestaoCalor({ ...b, treino: leve, prev: prev(L[2] + 0.3) });
ok(a3 && a3.nivel === 'alto' && a3.pct[0] === 0.06 && a3.pct[1] === 0.09, 'alto: 6% a 9% mais lento');

const t2 = sugestaoCalor({ ...b, treino: tiros, prev: prev(L[1] + 0.3) });
ok(t2 && t2.modo === 'pausa' && t2.pausa === 0.5, 'tiros no moderado: mantém ritmo, pausa 50% maior');
ok(t2 && /manter o ritmo dos tiros/.test(t2.texto), 'texto dos tiros');
const ac = sugestaoCalor({ ...b, treino: aceleracoes, prev: prev(L[1] + 0.3) });
ok(ac && ac.modo === 'ritmo', 'rodagem com acelerações conta como contínuo');
const c2 = sugestaoCalor({ ...b, treino: cc, prev: prev(L[1] + 0.3) });
ok(c2 && c2.modo === 'ritmo', 'corre e caminha nunca vira tiro');

const e = sugestaoCalor({ ...b, treino: tiros, prev: prev(L[3] + 1) });
ok(e && e.modo === 'mover' && /outro dia/.test(e.texto), 'extremo: sugere mudar horário ou dia');

const m = sugestaoCalor({ ...b, treino: leve, prev: prev(L[1] + 0.3, { 5: L[0] - 1 }) });
ok(m && m.melhor === 5 && /mais fresco perto disso é 5h/.test(m.texto), 'aponta o horário mais fresco');
ok(m && m.hora === 6 && m.temp === 29, 'guarda hora e temperatura');

if (falhas) {
  console.error(`ritmocalor: ${falhas} falha(s)`);
  process.exit(1);
}
console.log('Ritmo no calor: tudo certo.');
