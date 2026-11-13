// Teste automático do Resumo do mês: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere as sugestões de pontos fortes e do que melhorar que o app escreve a partir dos números do mês.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31s-resumo-mes.js'), 'utf8');
const ini = src.indexOf('/* resumo:puro:inicio */'),
  fim = src.indexOf('/* resumo:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do resumo não encontrado (marcadores resumo:puro).');
const { resumoSugestoes, resumoPace, resumoIndice, resumoCalendario, resumoIntensidade, resumoRecordes } = new Function(
  src.slice(ini, fim) +
    ';return {resumoSugestoes,resumoPace,resumoIndice,resumoCalendario,resumoIntensidade,resumoRecordes};',
)();
const erros = [];
const ok = (c, m) => c || erros.push(m);
const base = {
  fC: true,
  fM: true,
  km: 80,
  kmAnt: 72,
  corridas: 12,
  previstos: 12,
  feitosPl: 11,
  ader: 92,
  paceMes: 350,
  paceAnt: 362,
  longaKm: 14,
  forca: 8,
  forcaAnt: 6,
  dores: [],
  treinos: 20,
  vistos: 20,
  comentados: 5,
  pront: { media: 16, dias: 20 },
};
let s = resumoSugestoes(base);
ok(
  s.fortes.some((t) => t.includes('92%')),
  'cumprimento alto vira ponto forte',
);
ok(
  s.fortes.some((t) => t.includes('11% a mais')),
  'aumento seguro de volume vira ponto forte',
);
ok(
  s.fortes.some((t) => t.includes('12 s por km')),
  'ritmo melhor vira ponto forte',
);
ok(
  s.fortes.some((t) => t.includes('Nenhuma dor')),
  'mês sem dor vira ponto forte',
);
ok(!s.melhorar.length, 'mês bom não deveria ter o que melhorar: ' + s.melhorar.join(' | '));
s = resumoSugestoes({
  ...base,
  km: 110,
  kmAnt: 72,
  ader: 50,
  feitosPl: 6,
  dores: [{ local: 'joelho' }, { local: 'joelho' }],
  forca: 1,
  pront: { media: 10, dias: 8 },
});
ok(
  s.melhorar.some((t) => t.includes('50%')),
  'cumprimento baixo vai para o que melhorar',
);
ok(
  s.melhorar.some((t) => t.includes('53%')),
  'salto de volume acima de 30% vai para o que melhorar',
);
ok(
  s.melhorar.some((t) => t.includes('2 treinos (joelho)')),
  'dores repetidas com o local',
);
ok(
  s.melhorar.some((t) => t.includes('Só 1 treino de força')),
  'pouca força',
);
ok(
  s.melhorar.some((t) => t.includes('Prontidão média baixa')),
  'prontidão baixa',
);
ok(!s.fortes.some((t) => t.includes('a mais que no mês anterior')), 'salto grande não é elogiado');
s = resumoSugestoes({ ...base, fC: false, fM: true, treinos: 2, forca: 2 });
ok(!s.fortes.some((t) => t.includes('corrida')), 'aluno só de força não recebe frase de corrida');
ok(
  s.melhorar.some((t) => t.includes('Poucos treinos')),
  'poucos treinos registrados',
);
ok(resumoPace(361) === '6:01/km', 'formato do ritmo');
// índice do mês
let ix = resumoIndice({ ader: 100, semanas: [3, 4, 3, 5], pront: { media: 20 }, dores: [] });
ok(ix.nota === 100 && ix.faixa === 'Excelente', 'índice perfeito');
ix = resumoIndice({ ader: 50, semanas: [3, 1, 0, 3], pront: { media: 10 }, dores: [{}, {}] });
ok(ix.nota === Math.round((40 * 50 + 30 * 50 + 15 * 50 + 15 * 30) / 100), 'índice ponderado ' + ix.nota);
ix = resumoIndice({ ader: null, semanas: [3, 3], pront: null, dores: [] });
ok(ix.nota === 100 && ix.partes.length === 2, 'partes sem dado saem da conta');
// calendário: novembro de 2026 começa num domingo
const cal = resumoCalendario('2026-11', '2026-11-13', {
  '2026-11-03': { km: 5, prev: true },
  '2026-11-05': { prev: true },
  '2026-11-20': { prev: true },
});
ok(cal[0].filter(Boolean).length === 1 && cal[0][6].dia === 1, 'novembro começa no domingo');
const c = cal.flat().filter(Boolean);
ok(c.length === 30, '30 dias');
ok(c.find((d) => d.dia === 5).perdido && !c.find((d) => d.dia === 3).perdido, 'treino previsto e não feito');
ok(c.find((d) => d.dia === 20).futuro && !c.find((d) => d.dia === 20).perdido, 'dia futuro não conta como perdido');
// intensidade
const it = resumoIntensidade([
  { min: 160, int: 'leve' },
  { min: 20, int: 'mod' },
  { min: 20, int: 'forte' },
]);
ok(it.leve === 80 && it.mod === 10 && it.forte === 10, 'intensidade 80/10/10');
ok(resumoIntensidade([{ min: 10, int: 'leve' }]) === null, 'pouco tempo não mostra intensidade');
// recordes
const rc = resumoRecordes(
  [
    { data: '2026-11-02', km: 5, seg: 1500 },
    { data: '2026-11-04', km: 10, seg: 3300 },
    { data: '2026-11-12', km: 3, seg: 840 },
  ],
  ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-12'],
);
ok(rc.longa.km === 10 && rc.rapida.data === '2026-11-12' && rc.semana.km === 15 && rc.sequencia === 3, 'recordes');
ok(resumoSugestoes(base).metas.length >= 1, 'metas do próximo mês');
if (erros.length) {
  console.error('Resumo do mês: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Resumo do mês: sugestões conferidas.');
