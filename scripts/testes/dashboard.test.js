// Teste automático do Dashboard da equipe: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere as contas dos feedbacks (treinos com Visto), o modo de esconder nomes e o selo da demonstração.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31r-dashboard.js'), 'utf8');
const ini = src.indexOf('/* dash:puro:inicio */'),
  fim = src.indexOf('/* dash:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do dashboard não encontrado (marcadores dash:puro).');
const f = new Function(
  src.slice(ini, fim) + ';return {dashFeedMontar,dashFeedHTML,dashMontar,dashDemoDados,dashHTML};',
)();
const agora = Date.parse('2026-11-13T18:00:00-03:00');
const T = [
  {
    aluno_id: 'a',
    tipo: 'corrida',
    quando: Date.parse('2026-11-12T06:00:00-03:00'),
    km: 5,
    visto: true,
    comentario: 'Comentario-unico',
  },
  { aluno_id: 'a', tipo: 'forca', quando: Date.parse('2026-11-05T06:00:00-03:00'), km: 0, visto: true },
  { aluno_id: 'b', tipo: 'corrida', quando: Date.parse('2026-10-20T06:00:00-03:00'), km: 10, visto: true },
  { aluno_id: 'b', tipo: 'corrida', quando: Date.parse('2026-11-11T06:00:00-03:00'), km: 7, visto: false },
];
const F = f.dashFeedMontar({ agora, treinos: T });
const ok = (c, m) => {
  if (!c) {
    console.error('Dashboard: FALHOU ' + m + ' ' + JSON.stringify(F.k));
    process.exit(1);
  }
};
ok(F.k.vistos === 3 && F.k.recebidos === 4 && F.k.pct === 75, 'totais');
ok(F.k.mes === 2 && F.k.semana === 1, 'mês e semana');
ok(F.k.alunos === 2 && F.k.km === 15 && F.k.comentados === 1 && F.k.forca === 1, 'alunos, km, comentários');
ok(F.meses.map((m) => m.n).join() === '0,0,0,0,1,2', 'meses');
const h = f.dashFeedHTML(F, { anonimo: true });
ok(!h.includes('Comentario-unico') && h.includes('Atleta Nexos'), 'esconder nomes');
const M = f.dashMontar(f.dashDemoDados(62, agora));
ok(M.k.ativos === 62 && f.dashHTML(M, { demo: true, n: 62 }).includes('Demonstração'), 'selo da demonstração');
console.log('Dashboard: contas conferidas.');
