// Teste automático da Agenda: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere a contagem que aparece para o aluno ("faltam 2 h", "amanhã"), a fase do cartão e o calendário do mês.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31t-agenda.js'), 'utf8');
const ini = src.indexOf('/* agenda:puro:inicio */'),
  fim = src.indexOf('/* agenda:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco da agenda não encontrado (marcadores agenda:puro).');
const { agFalta, agFase, agCalendario } = new Function(src.slice(ini, fim) + ';return {agFalta,agFase,agCalendario};')();
const erros = [];
const ok = (c, m) => c || erros.push(m);
const t0 = new Date(2026, 10, 13, 10, 0).getTime(); // sexta, 13/11, 10h
ok(agFalta(t0 + 8 * 60000, t0) === 'começa em 8 min', 'minutos');
ok(agFalta(t0 + 130 * 60000, t0) === 'faltam 2 h 10 min', 'horas');
ok(agFalta(new Date(2026, 10, 14, 9, 0).getTime(), t0) === 'amanhã', 'amanhã');
ok(agFalta(new Date(2026, 10, 16, 9, 0).getTime(), t0) === 'faltam 3 dias', 'dias');
ok(agFalta(t0 - 1000, t0) === 'agora', 'agora');
const a = (h, d = 0, dur = 30) => ({ inicio: new Date(2026, 10, 13 + d, h, 0).toISOString(), duracao_min: dur });
ok(agFase(a(19), t0) === 'hoje', 'fase hoje');
ok(agFase(a(10, 0), t0 - 5 * 60000) === 'ja', 'fase já (10 min antes)');
ok(agFase(a(9, 0, 30), t0) === 'passou', 'fase passou');
ok(agFase(a(9, 3), t0) === 'semana', 'fase semana');
ok(agFase(a(9, 10), t0) === 'longe', 'fase longe');
const cal = agCalendario('2026-11', [a(19), a(8, 6)]);
const dias = cal.flat().filter(Boolean);
ok(dias.length === 30 && cal[0][6].dia === 1, 'novembro: 30 dias, começa no domingo');
ok(dias.find((d) => d.dia === 13).ags.length === 1 && dias.find((d) => d.dia === 19).ags.length === 1, 'chamadas nos dias');
if (erros.length) {
  console.error('Agenda: ' + erros.length + ' conta(s) errada(s):\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Agenda: contas conferidas.');
