// Teste automático do Ajuste do dia: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere quando o app sugere trocar o treino de hoje, para o quê, e o texto que o aluno recebe.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/31z-ajuste-dia.js'), 'utf8');
const ini = src.indexOf('/* ajuste:puro:inicio */'),
  fim = src.indexOf('/* ajuste:puro:fim */');
if (ini < 0 || fim < 0) throw new Error('Bloco do ajuste do dia não encontrado (marcadores ajuste:puro).');
const { ajusteDia } = new Function(src.slice(ini, fim) + ';return {ajusteDia};')();
const erros = [];
const ok = (c, m) => c || erros.push(m);
const bom = { sono: 4, energia: 4, estresse: 4, total: 16, locais: null };
const tiro = { tipo: 'fartlek', titulo: 'Fartlek 6 × 1 min', forte: true, min: 33 };
const leve = { tipo: 'rodagem', titulo: 'Rodagem leve 6 km', forte: false, min: 40 };
const A = (o) => ajusteDia({ nome: 'Camile Sampaio', plano: tiro, ck: bom, rel: null, ...o });

ok(A({}) === null, 'check-in bom não sugere troca');
ok(A({ ck: null }) === null, 'sem check-in e sem relógio não sugere');
ok(A({ plano: null }) === null, 'sem treino hoje não sugere');
for (const t of ['folga', 'forca', 'bike', 'caminhada', 'prova'])
  ok(A({ plano: { ...tiro, tipo: t }, ck: { ...bom, sono: 1, energia: 1 } }) === null, `não mexe em dia de ${t}`);
ok(
  A({ ck: { ...bom, sono: 1, energia: 1, locais: ['joelho_d'] } }) === null,
  'com dor marcada deixa para a sugestão de dor',
);

// caso real (Camile, 10/11): sono 2, energia 1, estresse 2, total 8, fartlek
let s = A({ ck: { sono: 2, energia: 1, dor: 3, estresse: 2, total: 8, locais: null } });
ok(s && s.nivel === 'alto', 'três sinais é prontidão baixa');
ok(s && s.novo.tipo === 'regenerativo' && s.novo.min === 15, 'treino forte vira regenerativo curto');
ok(
  s && s.msg.startsWith('Oi, Camile! Vi seu check-in de hoje, com sono ruim, energia muito baixa e estresse alto.'),
  'mensagem com o motivo',
);
ok(s && s.desc.includes('Troquei "Fartlek 6 × 1 min" por regenerativo de 15 min'), 'descrição na planilha diz a troca');

// caso real (Jadeline, 10/11): sono 1, limiar
s = A({
  plano: { tipo: 'ritmo', titulo: 'Limiar leve 4 × 3 min', forte: true, min: 35 },
  ck: { ...bom, sono: 1, total: 13 },
});
ok(s && s.nivel === 'medio', 'sono "muito mal" sozinho é moderado');
ok(s && s.novo.tipo === 'rodagem' && s.novo.min === 30, 'limiar vira rodagem leve de 80% do tempo');

// caso real (Robenilson, 12/11): sono 2, fartlek de 30 min
s = A({ plano: { ...tiro, min: 30 }, ck: { ...bom, sono: 2, total: 13 } });
ok(s && s.nivel === 'leve', 'um sinal só é leve');
ok(s && s.novo.tipo === 'rodagem' && s.novo.min === 30, 'treino forte vira rodagem leve do mesmo tempo');

// treino leve
ok(A({ plano: leve, ck: { ...bom, sono: 2 } }) === null, 'rodagem leve com um sinal fica como está');
s = A({ plano: leve, ck: { ...bom, sono: 2, energia: 2 } });
ok(s && s.novo.tipo === 'rodagem' && s.novo.min === 30, 'rodagem leve com dois sinais fica 20% menor');
s = A({ plano: leve, ck: { sono: 1, energia: 1, estresse: 3, total: 9, locais: null } });
ok(s && s.novo.tipo === 'regenerativo' && s.novo.min === 25, 'rodagem com prontidão baixa vira regenerativo');
ok(A({ plano: { ...leve, min: 25 }, ck: { ...bom, sono: 2, energia: 2 } }) === null, 'rodagem curta não encurta');

// relógio
s = A({ ck: null, rel: { sonoH: 5.5, fcRep: 60, fcBase: 52, vfc: 'abaixo' } });
ok(s && s.nivel === 'alto', 'relógio com três sinais é prontidão baixa');
ok(s && s.sinais.includes('noite curta no relógio (5h30)'), 'mostra as horas de sono');
ok(s && s.sinais.includes('FC de repouso 8 bpm acima do normal'), 'mostra a FC acima do normal');
ok(A({ ck: null, rel: { sonoH: 7.2, fcRep: 54, fcBase: 52, vfc: 'normal' } }) === null, 'relógio bom não sugere');
ok(
  A({ ck: null, rel: { sonoH: 7, fcRep: 60, fcBase: null, vfc: 'base' } }) === null,
  'sem base pessoal não compara a FC',
);

// teste de zonas
s = A({ plano: { tipo: 'teste', titulo: 'Teste de 3 km', forte: true, min: 30 }, ck: { ...bom, sono: 2 } });
ok(s && s.teste && s.msg.includes('O teste fica para outro dia'), 'dia de teste avisa que o teste fica para outro dia');

// textos
for (const x of [A({ ck: { ...bom, sono: 1, energia: 2 } }), s])
  ok(x && !x.msg.includes(':') && !x.desc.includes(':'), 'textos para o aluno sem dois-pontos');

if (erros.length) {
  console.error('Ajuste do dia com problema:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('ajuste: ok');
