// Teste automático do encaixe do ciclo na data da prova: roda antes de cada publicação (scripts/versao.sh).
// Quando a prova está mais perto do que o ciclo cabe, o app pula as semanas do começo (base) e nunca grava treino
// em semana que já passou; o fim do ciclo (parte específica e polimento) fica inteiro.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/27-ciclos-corrida.js'), 'utf8');
const m = src.match(/\/\* ciclo:encaixe:inicio \*\/([^]*?)\/\* ciclo:encaixe:fim \*\//);
if (!m) throw new Error('Bloco ciclo:encaixe não encontrado em 27-ciclos-corrida.js.');
const { encaixeCiclo, cicMinSem } = new Function(m[1] + ';return {encaixeCiclo, cicMinSem};')();
const erros = [];
const ok = (c, msg) => c || erros.push(msg);

// meia de 12 semanas com a prova daqui a 8 (semana atual = 30/11): o ciclo começaria 4 semanas atrás, em 02/11
let e = encaixeCiclo('2026-11-02', 12, '2026-11-30');
ok(
  e.pulo === 4 && e.resta === 8 && e.iniEf === '2026-11-30',
  'prova em 8 semanas num ciclo de 12: pula 4, começa nesta semana',
);
// tempo de sobra: nada muda
e = encaixeCiclo('2026-12-07', 12, '2026-11-30');
ok(e.pulo === 0 && e.resta === 12 && e.iniEf === '2026-12-07', 'ciclo começando na próxima semana não pula nada');
// começa exatamente nesta semana
e = encaixeCiclo('2026-11-30', 8, '2026-11-30');
ok(e.pulo === 0 && e.resta === 8, 'ciclo que começa nesta semana não pula nada');
// prova já passou
e = encaixeCiclo('2026-09-07', 8, '2026-11-30');
ok(e.resta <= 0, 'ciclo inteiro no passado: não sobra semana');
// troca de horário de verão ou de mês não desalinha a segunda-feira
e = encaixeCiclo('2026-10-05', 10, '2026-11-02');
ok(e.pulo === 4 && e.iniEf === '2026-11-02', 'pulo conta semanas inteiras');
ok(cicMinSem({ obj: '42k' }) === 6 && cicMinSem({ obj: '10k' }) === 5, 'mínimo: polimento + 3 semanas específicas');

if (erros.length) {
  console.error('Encaixe do ciclo com erro:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('Encaixe do ciclo: conferido.');
