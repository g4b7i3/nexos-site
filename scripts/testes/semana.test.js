// Teste automático do Resumo da semana: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere o que o app aponta como "foi bem" e "atenção" e o rascunho da mensagem que o treinador envia ao aluno.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31y-resumo-semana.js'), 'utf8');
const ini = src.indexOf('/* semana:puro:inicio */'),
  fim = src.indexOf('/* semana:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do resumo da semana não encontrado (marcadores semana:puro).');
const { semanaAnalise, semanaPeriodo } = new Function(src.slice(ini, fim) + ';return {semanaAnalise,semanaPeriodo};')();
const erros = [];
const ok = (c, m) => c || erros.push(m);
const base = {
  nome: 'Camile Sampaio',
  s0: '2026-11-09',
  fC: true,
  fM: false,
  km: 30,
  kmCronico: 28,
  corridas: 5,
  longaoKm: 12,
  previstos: 5,
  feitos: 5,
  forca: 0,
  dores: [],
  checkin: { dias: 6, media: 17, sono: 4 },
  relogio: null,
};
const A = (o) => semanaAnalise({ ...base, ...o });

ok(semanaPeriodo('2026-11-09') === '9 a 15 de novembro', 'período na mesma semana do mês');
ok(semanaPeriodo('2026-10-26') === '26 de outubro a 1 de novembro', 'período virando o mês');

let s = A({});
ok(
  s.texto.startsWith('Oi, Camile! Fechamos a sua semana de 9 a 15 de novembro.'),
  'abre com o primeiro nome e o período',
);
ok(s.texto.includes('Foram 5 corridas, 30 km no total.'), 'resume corridas e km');
ok(s.texto.includes('A corrida mais longa teve 12 km.'), 'mostra o longão');
ok(
  s.bem.some((t) => t.includes('todos os 5')),
  'planilha cumprida vai para o que foi bem',
);
ok(!s.atencao.length, 'semana boa sem pontos de atenção');
ok(
  s.texto.endsWith('Para esta semana, é manter a constância. Bons treinos!'),
  'fecha com a constância quando está tudo bem',
);
ok(!s.texto.includes(':'), 'o texto não usa dois-pontos');

// volume: acima de 1,3x a média das semanas anteriores
s = A({ km: 40, kmCronico: 28 });
ok(
  s.atencao.some((t) => t.includes('subiu 43%')),
  'aumento de 43% acende atenção',
);
ok(!A({ km: 36, kmCronico: 28 }).atencao.some((t) => t.includes('subiu')), 'aumento de 29% não acende');
ok(!A({ km: 20, kmCronico: 8 }).atencao.some((t) => t.includes('subiu')), 'volume pequeno de base não compara');
ok(!A({ km: 40, kmCronico: null }).atencao.some((t) => t.includes('subiu')), 'sem histórico não compara');

// planilha
s = A({ previstos: 6, feitos: 3 });
ok(
  s.atencao.some((t) => t.includes('3 dos 6')),
  'menos de 60% da planilha acende atenção',
);
ok(!s.bem.some((t) => t.includes('planilha')), 'planilha baixa não vira ponto bom');

// dor
s = A({ dores: [['Joelho direito'], ['Joelho direito', 'Ombro esquerdo'], []] });
ok(
  s.atencao.some((t) => t.includes('3 vezes (Joelho direito, Ombro esquerdo)')),
  'dor com local e sem repetir o local',
);
ok(s.texto.includes('Para esta semana, antes dos treinos mais fortes'), 'dor vira o foco da semana');
ok(!s.bem.some((t) => t.includes('Nenhuma dor')), 'com dor não diz que não teve dor');

// relógio
s = A({ relogio: { noites: 6, sonoH: 6.5, diasFc: 6, fcRep: 58, fcBase: 52, vfc: 'abaixo' } });
ok(
  s.atencao.some((t) => t.includes('6h30')),
  'sono abaixo de 7 h',
);
ok(
  s.atencao.some((t) => t.includes('6 bpm acima')),
  'FC de repouso 6 bpm acima do normal',
);
ok(
  s.atencao.some((t) => t.includes('VFC ficou abaixo')),
  'VFC abaixo da faixa',
);
s = A({ relogio: { noites: 6, sonoH: 7.6, diasFc: 6, fcRep: 53, fcBase: 52, vfc: 'normal' } });
ok(
  s.bem.some((t) => t.includes('7h36')),
  'sono bom vai para o que foi bem',
);
ok(
  s.bem.some((t) => t.includes('VFC ficou dentro')),
  'VFC normal vai para o que foi bem',
);
ok(!s.atencao.length, 'relógio bom sem atenção');
s = A({ relogio: { noites: 2, sonoH: 5, diasFc: 2, fcRep: 70, fcBase: 50, vfc: null } });
ok(!s.atencao.length, 'poucas noites não geram conclusão');

// check-in sem relógio
s = A({ checkin: { dias: 5, media: 11, sono: 2 } });
ok(
  s.atencao.some((t) => t.includes('sono foi o ponto mais baixo')),
  'sono baixo no check-in',
);
ok(
  s.atencao.some((t) => t.includes('11 de 20')),
  'prontidão baixa',
);
ok(!A({ checkin: { dias: 2, media: 8, sono: 1 } }).atencao.length, 'menos de 3 check-ins não conclui');

// força
s = A({ fM: true, forca: 0 });
ok(
  s.atencao.some((t) => t.includes('Nenhum treino de força')),
  'faz força e não treinou força',
);
s = A({ fM: true, forca: 2 });
ok(s.texto.includes('Foram 5 corridas, 30 km no total e 2 treinos de força.'), 'junta corrida e força na frase');

// semana sem treino
s = A({ km: 0, corridas: 0, previstos: 4, feitos: 0, checkin: null });
ok(s.atencao[0].includes('Não vi treinos'), 'semana sem treino');
ok(!s.texto.includes('Bons treinos'), 'semana sem treino pergunta da rotina');
ok(!s.atencao.some((t) => t.includes('0 dos 4')), 'sem treino não repete a planilha');

// sem planilha nem força no app: não cobra treino
s = A({
  fC: false,
  fM: false,
  km: 0,
  corridas: 0,
  previstos: 0,
  feitos: 0,
  semPlano: true,
  checkin: { dias: 4, media: 13, sono: 2 },
});
ok(!s.atencao.some((t) => t.includes('Não vi treinos')), 'sem planilha no app não diz que não treinou');
ok(s.texto.endsWith('Bons treinos!'), 'sem planilha fecha normalmente');

// frases
ok(
  A({}).bem.some((t) => t.includes('todos os 5 treinos')),
  'planilha inteira cumprida',
);
ok(
  A({}).bem.some((t) => t.includes('prontidão média no check-in foi de 17 de 20')),
  'prontidão boa sem marcar gênero',
);

if (erros.length) {
  console.error('Resumo da semana com problema:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('semana: ok');
