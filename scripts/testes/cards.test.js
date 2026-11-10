// Teste automático das contas dos cards do relógio (VO2máx, efeito do treino e tempo nas zonas).
// Roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/14-corrida.js'), 'utf8');
const m = src.match(/\/\* card:puro:inicio[^]*?\*\/([^]*?)\/\* card:puro:fim \*\//);
if (!m) throw new Error('Bloco dos cards não encontrado no app (marcadores card:puro).');
const ctx = {};
vm.runInNewContext(m[1] + '\n;Object.assign(this, { teNome, vo2Classe, segZonas });', ctx);
const { teNome, vo2Classe, segZonas } = ctx;
const erros = [];
const ok = (cond, msg) => cond || erros.push(msg);

// efeito do treino (escala Garmin)
ok(teNome(0.5) === 'Sem benefício', 'TE 0,5');
ok(teNome(1) === 'Benefício menor', 'TE 1,0');
ok(teNome(2.9) === 'Mantendo', 'TE 2,9');
ok(teNome(3.4) === 'Impactando', 'TE 3,4');
ok(teNome(4) === 'Muito impactante', 'TE 4,0');
ok(teNome(5) === 'Sobrecarga', 'TE 5,0');
ok(teNome(null) === null, 'TE vazio');

// VO2máx (Cooper Institute, como no relógio)
ok(vo2Classe(55, 27, 'M').nome === 'Excelente', 'homem 27 anos, 55 = Excelente');
ok(vo2Classe(55.4, 27, 'M').nome === 'Superior', 'homem 27 anos, 55,4 = Superior (limite)');
ok(vo2Classe(41, 27, 'M').nome === 'Ruim', 'homem 27 anos, 41 = Ruim');
ok(vo2Classe(45, 45, 'M').nome === 'Bom', 'homem 45 anos, 45 = Bom');
ok(vo2Classe(40, 33, 'F').nome === 'Bom', 'mulher 33 anos, 40 = Bom');
ok(vo2Classe(37, 72, 'F').nome === 'Superior', 'mulher 72 anos, 37 = Superior');
ok(vo2Classe(50, 17, 'M').faixa === '20 a 29 anos', 'menos de 20 usa a faixa de 20 a 29');
ok(vo2Classe(40, 85, 'M').faixa === '70 a 79 anos', 'mais de 79 usa a faixa de 70 a 79');
ok(vo2Classe(50, 30, null) === null, 'sem sexo não classifica');
ok(vo2Classe(50, null, 'M') === null, 'sem idade não classifica');

// tempo nas zonas: a soma bate com o total
const s = segZonas([0.32, 0.33, 0.25, 0.08, 0.02], 2860);
ok(s.reduce((a, b) => a + b, 0) === 2860, 'soma das zonas igual ao tempo total');
ok(segZonas(null, 100) === null, 'sem frações não há zonas');

// leitura do tempo em cada zona do arquivo do relógio (números de uma corrida real conferidos com a tela do relógio)
const fit = fs.readFileSync(path.join(__dirname, '../../app/nxfit.js'), 'utf8');
const nxZonasRel = new Function(fit.slice(0, fit.indexOf('(()=>{')) + ';return nxZonasRel')();
const zr = nxZonasRel({
  timeInZoneMesgs: [
    {
      referenceMesg: 'session',
      timeInHrZone: [7.177, 21.001, 114.999, 332.81, 439.288, 434.74, 0],
      hrZoneHighBoundary: [97, 116, 136, 155, 175, 198],
      timeInPowerZone: [525.089, 112.765, 350.207, 170.989, 18.995, 171.969, 0, 0],
      powerZoneHighBoundary: [244, 301, 339, 377, 431, 4000, null, null],
    },
  ],
});
ok(
  JSON.stringify(zr.fc.t) === '[21,115,333,439,435]',
  'zonas de FC iguais às do relógio (0:21, 1:55, 5:33, 7:19, 7:15)',
);
ok(JSON.stringify(zr.fc.lim) === '[98,117,137,156,176]', 'início das zonas de FC');
ok(
  JSON.stringify(zr.pot.t) === '[113,350,171,19,172]',
  'zonas de potência iguais às do relógio (1:53, 5:50, 2:51, 0:19, 2:52)',
);
ok(JSON.stringify(zr.pot.lim) === '[245,302,340,378,432]', 'início das zonas de potência');
ok(nxZonasRel({}) === null, 'arquivo sem zonas');

if (erros.length) {
  console.error('Cards do relógio: ' + erros.length + ' erro(s)\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Cards do relógio: tudo certo.');
