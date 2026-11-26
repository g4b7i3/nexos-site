// Teste automático da escolha do estilo do ciclo de prova (padrão ou Treinamento Nexos) na Sugestão de ciclo.
// Roda antes de cada publicação (scripts/versao.sh). Os perfis imitam os alunos reais de novembro de 2026, sem nomes:
// quem corre umas 4 vezes e 20 km por semana sem dor vai para o Nexos; os outros ficam no padrão; depois de um ciclo
// Nexos, só repete quem cumpriu pelo menos 70% das qualidades sem dor repetida.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const s = fs.readFileSync(path.join(__dirname, '../../app/js/16-zonas-checkup.js'), 'utf8');
const m = s.match(/const QUALIDADE_TIPOS[^]*?\n}\n/);
if (!m) throw new Error('estiloDoCiclo não encontrado em 16-zonas-checkup.js.');
const CICLOS_CORR = [
  { id: '21k-int', modo: 'prova', niv: 'int' },
  { id: '21k-int-tn', modo: 'prova', niv: 'int', estilo: 'nexos' },
  { id: '5k-ini', modo: 'prova', niv: 'ini' },
  { id: '5k-ini-tn', modo: 'prova', niv: 'ini', estilo: 'nexos' },
  { id: 'bl-base-int', modo: 'base', niv: 'int' },
];
const ctx = {
  CICLOS_CORR,
  ehCorrHist: (c) => !c.tipo || ['corrida', 'trail', 'esteira'].includes(c.tipo),
  f1: (n) => String(Math.round(n * 10) / 10).replace('.', ','),
};
vm.runInNewContext(m[0] + ';this.estiloDoCiclo = estiloDoCiclo;', ctx);
const { estiloDoCiclo } = ctx;
const erros = [];
const ok = (c, msg) => c || erros.push(msg);
const C = (id) => CICLOS_CORR.find((c) => c.id === id);
// n corridas nas últimas 4 semanas somando kmSem por semana; as primeiras 'dor' com dor marcada
const corr = (n, kmSem, dor = 0) =>
  Array.from({ length: n }, (_, i) => ({
    data: new Date(Date.now() - (i + 1) * 864e5).toISOString(),
    distancia_m: (kmSem * 4 * 1000) / n,
    dor: i < dor,
  }));
const est = (id, o) => estiloDoCiclo(C(id), o).ciclo.id;

ok(est('21k-int', { corridas: corr(19, 36) }) === '21k-int-tn', '19 corridas e 36 km por semana: Treinamento Nexos');
ok(est('21k-int', { corridas: corr(16, 33) }) === '21k-int-tn', '16 corridas e 33 km por semana: Treinamento Nexos');
ok(est('21k-int', { corridas: corr(14, 16) }) === '21k-int', '14 corridas mas 16 km por semana: padrão');
ok(est('21k-int', { corridas: corr(11, 25) }) === '21k-int', '11 corridas em 4 semanas: padrão');
ok(est('21k-int', { corridas: corr(19, 36, 2) }) === '21k-int', 'dor marcada 2 vezes: padrão');
ok(est('5k-ini', { corridas: corr(20, 30) }) === '5k-ini', 'iniciante: sempre padrão');
ok(est('21k-int-tn', { corridas: corr(5, 8) }) === '21k-int', 'ciclo Nexos para quem corre pouco volta ao padrão');
ok(
  est('21k-int', { corridas: corr(19, 36), ultNexos: { total: 10, feitas: 6, dores: 0 } }) === '21k-int',
  'fez 60% das qualidades do último Nexos: padrão',
);
ok(
  est('21k-int', { corridas: corr(19, 36), ultNexos: { total: 10, feitas: 9, dores: 2 } }) === '21k-int',
  'dor 2 vezes no último Nexos: padrão',
);
ok(
  est('21k-int', { corridas: corr(19, 36), ultNexos: { total: 10, feitas: 8, dores: 1 } }) === '21k-int-tn',
  'fez 80% das qualidades do último Nexos sem dor repetida: segue no Nexos',
);
ok(
  est('21k-int', { corridas: corr(19, 36), ultNexos: { total: 2, feitas: 0, dores: 0 } }) === '21k-int-tn',
  'menos de 4 qualidades planejadas não entram na conta',
);
ok(est('bl-base-int', { corridas: corr(19, 36) }) === 'bl-base-int', 'ciclo de base não muda de estilo');
ok(/Treinamento Nexos/.test(estiloDoCiclo(C('21k-int'), { corridas: corr(19, 36) }).motivo), 'motivo explica o estilo');

if (erros.length) {
  console.error('Estilo do ciclo com erro:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('Estilo do ciclo: conferido.');
