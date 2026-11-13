// Teste automático do Resumo do mês: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere as sugestões de pontos fortes e do que melhorar que o app escreve a partir dos números do mês.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31s-resumo-mes.js'), 'utf8');
const ini = src.indexOf('/* resumo:puro:inicio */'),
  fim = src.indexOf('/* resumo:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do resumo não encontrado (marcadores resumo:puro).');
const { resumoSugestoes, resumoPace } = new Function(src.slice(ini, fim) + ';return {resumoSugestoes,resumoPace};')();
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
if (erros.length) {
  console.error('Resumo do mês: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Resumo do mês: sugestões conferidas.');
