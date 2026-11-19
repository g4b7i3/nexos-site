// Teste automático do corredor 3D da análise da passada: roda antes de cada publicação (scripts/versao.sh).
// Confere que a "direção do ajuste" só mexe no que saiu da faixa e só um passo, como a literatura apoia.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31zg-corredor3d.js'), 'utf8');
const m = src.match(/\/\* corredor:puro:inicio[^]*?\*\/([^]*?)\/\* corredor:puro:fim \*\//);
if (!m) throw new Error('Bloco do corredor 3D não encontrado no app (marcadores corredor:puro).');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { cr3Curva, cr3Parametros, cr3Direcao, cr3Linhas });', ctx);
const { cr3Curva, cr3Parametros, cr3Direcao, cr3Linhas } = ctx;
let falhas = 0;
const ok = (c, msg) => {
  if (!c) {
    falhas++;
    console.error('FALHOU: ' + msg);
  }
};
// curva periódica passa pelos pontos e fecha o ciclo
const c = cr3Curva([
  [0, 10],
  [0.3, 40],
  [0.7, -5],
]);
ok(
  Math.abs(c(0) - 10) < 1e-6 && Math.abs(c(0.3) - 40) < 1e-6 && Math.abs(c(1) - 10) < 1e-6,
  'curva passa pelos pontos',
);
ok(Math.abs(c(0.999) - c(0)) < 1, 'curva fecha o ciclo sem salto');
// valores impossíveis (erro do vídeo) ficam no limite plausível
const pL = cr3Parametros({ frente: -37, joelhoMax: 23.8, cadencia: 900, tronco: 60 });
ok(pL.frente === -4 && pL.kMax === 28 && pL.cad === 200 && pL.tronco === 18, 'limites plausíveis');
// análise real (Jadeline, 19/11/2026): só cadência e oscilação fora
const pJ = cr3Parametros({ cadencia: 134.58, frente: 7.39, tronco: 4.06, joelhoIC: 17.27, oscilacao: 19.39 });
const dJ = cr3Direcao(pJ, { cadencia: 'fora', oscilacao: 'fora', frente: 'ok', tronco: 'ok', joelhoIC: 'ok' });
ok(dJ.q.cad === 145, 'cadência sobe 7,5% (135 → 145)');
ok(dJ.q.frente === pJ.frente && dJ.q.tronco === pJ.tronco && dJ.q.kIC === pJ.kIC, 'o que está na faixa não muda');
ok(cr3Linhas(pJ, dJ.q, dJ.mudou).length === 2, 'tabela só com cadência e subida do corpo');
// nada fora: nada muda (o card não aparece)
ok(cr3Direcao(pJ, { cadencia: 'ok' }).mudou.length === 0, 'sem nada fora, sem ajuste');
// cadência nunca passa de 190 nem sobe mais que 10%
const pA = cr3Parametros({ cadencia: 185 });
const dA = cr3Direcao(pA, { cadencia: 'atencao' });
ok(dA.q.cad <= 190 && dA.q.cad <= pA.cad * 1.1, 'teto da cadência');
// pé muito à frente: reduz 30%, sem passar da borda da faixa (12 cm)
const pF = cr3Parametros({ frente: 25 });
const dF = cr3Direcao(pF, { frente: 'fora' });
ok(Math.abs(dF.q.frente - 17.5) < 1e-9, 'pé à frente 25 → 17,5 cm');
ok(cr3Direcao(cr3Parametros({ frente: 14 }), { frente: 'atencao' }).q.frente === 12, 'pé à frente para na borda');
// joelho esticado no toque: dobra um pouco mais, sem passar do meio da faixa
const dK = cr3Direcao(cr3Parametros({ joelhoIC: 5 }), { joelhoIC: 'fora' });
ok(dK.q.kIC === 13, 'joelho no toque 5 → 13°');
// quadril caindo e joelho para dentro: reduzem, nunca vão a zero
const dQ = cr3Direcao(cr3Parametros({ queda: 10, joelhoDentro: 16 }), { queda: 'fora', joelhoDentro: 'fora' });
ok(dQ.q.queda === 6 && dQ.q.joelhoDentro === 9.6, 'queda e joelho para dentro diminuem');
// oscilação alta com cadência boa: só +5% de cadência
const dO = cr3Direcao(cr3Parametros({ cadencia: 172, oscilacao: 13 }), { oscilacao: 'fora', cadencia: 'ok' });
ok(dO.q.cad === 181, 'oscilação alta: cadência +5%');
// cadência não medida: não inventa (análise real da Letícia, 19/11/2026)
const pLe = cr3Parametros({ oscilacao: 16.09, frente: -37.07, joelhoIC: 9.18, tronco: 2.22 });
const dLe = cr3Direcao(pLe, { oscilacao: 'fora', frente: 'ok', joelhoIC: 'atencao', tronco: 'atencao' });
ok(
  dLe.q.cad === pLe.cad && !dLe.mudou.includes('oscilacao') && !dLe.mudou.includes('cadencia'),
  'sem cadência medida, não mexe nela',
);
ok(dLe.mudou.includes('joelhoIC') && dLe.mudou.includes('tronco'), 'mexe só no que foi medido e saiu');
// tabela com o valor medido, mesmo fora do plausível (Elizabeth, 13/11/2026: cadência 112,5)
const pE = cr3Parametros({ cadencia: 112.5 }, null, true);
const dE = cr3Direcao(pE, { cadencia: 'fora' });
ok(cr3Linhas(pE, dE.q, dE.mudou)[0][1] === '113 passos/min' && dE.q.cad === 121, 'tabela mostra 113 → 121');
if (falhas) {
  console.error(`Corredor 3D: ${falhas} conta(s) com problema.`);
  process.exit(1);
}
console.log('Corredor 3D: direção do ajuste conferida.');
