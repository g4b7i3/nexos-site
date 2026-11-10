// Teste automático da Leitura do tempo: roda antes de cada publicação (scripts/versao.sh) e bloqueia se algo sair errado.
// Confere as contas puras do app (o mesmo código que vai para o celular, lido direto do arquivo).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../app/js/09-tour-recordes-hidratacao.js'), 'utf8');
const m = src.match(/\/\* calor:puro:inicio[^]*?\*\/([^]*?)\/\* calor:puro:fim \*\//);
if (!m) throw new Error('Bloco do calor não encontrado no app (marcadores calor:puro).');
const ctx = {};
vm.runInNewContext(
  m[1] +
    '\n;Object.assign(this, { CALOR_NIVEIS, CALOR_LIMITES, categoriaCalor, nivelCalor, bulboUmido, wbgtDe, CALOR_MODELOS, mediaModelos, condicaoHora, entreHoras });',
  ctx,
);
const {
  CALOR_NIVEIS,
  CALOR_LIMITES,
  categoriaCalor,
  nivelCalor,
  bulboUmido,
  wbgtDe,
  CALOR_MODELOS,
  mediaModelos,
  condicaoHora,
  entreHoras,
} = ctx;
const erros = [];
const ok = (cond, msg) => cond || erros.push(msg);
const perto = (a, b, tol) => Math.abs(a - b) <= tol;

// 1. bulbo úmido: exemplo do próprio artigo de Stull (2011): 20 °C e 50% de umidade dão 13,7 °C
ok(perto(bulboUmido(20, 50), 13.7, 0.1), `bulbo úmido 20°C/50%: ${bulboUmido(20, 50).toFixed(2)} (esperado 13,7)`);
// bulbo úmido nunca passa da temperatura do ar e chega perto dela com o ar saturado
for (const t of [15, 25, 35])
  for (const ur of [20, 50, 80]) ok(bulboUmido(t, ur) <= t + 0.3, `bulbo úmido acima do ar em ${t}°C/${ur}%`);
ok(
  perto(bulboUmido(30, 99), 30, 0.6),
  `ar saturado: bulbo úmido ${bulboUmido(30, 99).toFixed(2)} deveria ser perto de 30`,
);

// 2. sol aumenta o índice; mais umidade aumenta o índice
ok(wbgtDe(30, 70, 800) > wbgtDe(30, 70, 0), 'o sol deveria aumentar o índice de calor');
ok(wbgtDe(30, 80, 0) > wbgtDe(30, 50, 0), 'mais umidade deveria aumentar o índice de calor');

// 3. níveis: abaixo do 1º limite é Tranquilo; em cada limite sobe um nível; acima do último é Extremo
for (const cat of [1, 2, 3]) {
  const L = CALOR_LIMITES[cat];
  ok(nivelCalor(L[0] - 0.01, cat).k === 'baixo', `categoria ${cat}: abaixo de ${L[0]} deveria ser Tranquilo`);
  L.forEach((lim, i) => {
    ok(
      nivelCalor(lim - 0.01, cat).k === CALOR_NIVEIS[i].k,
      `categoria ${cat}: ${lim - 0.01} deveria ser ${CALOR_NIVEIS[i].nome}`,
    );
    ok(
      nivelCalor(lim, cat).k === CALOR_NIVEIS[i + 1].k,
      `categoria ${cat}: ${lim} deveria ser ${CALOR_NIVEIS[i + 1].nome}`,
    );
  });
  ok(nivelCalor(45, cat).k === 'extremo', `categoria ${cat}: 45 deveria ser Extremo`);
  // nunca desce de nível quando o índice sobe
  let ant = 0;
  for (let w = 10; w <= 40; w += 0.1) {
    const i = CALOR_NIVEIS.findIndex((n) => n.k === nivelCalor(w, cat).k);
    ok(i >= ant, `categoria ${cat}: nível desceu em ${w.toFixed(1)}`);
    ant = i;
  }
}

// 4. clima da região
ok(categoriaCalor(-2.54) === 3, 'São Luís deveria ser região quente (3)');
ok(categoriaCalor(-3.73) === 3, 'Fortaleza deveria ser região quente (3)');
ok(categoriaCalor(-19.91) === 2, 'Belo Horizonte deveria ser intermediária (2)');
ok(categoriaCalor(-30.03) === 1, 'Porto Alegre deveria ser mais fria (1)');
ok(categoriaCalor(38.72) === 1, 'Lisboa deveria ser mais fria (1)');

// 5. dias reais (previsão de 9/11/2026): a leitura tem que ser calma quando o tempo está normal
const caso = (nome, t, ur, sol, cat, esperado) => {
  const n = nivelCalor(wbgtDe(t, ur, sol), cat);
  ok(n.k === esperado, `${nome}: saiu ${n.nome}, esperado ${CALOR_NIVEIS.find((x) => x.k === esperado).nome}`);
};
caso('São Luís 5h (26,6 °C, 85%, sem sol)', 26.6, 85, 0, 3, 'baixo');
caso('São Luís 8h (29,6 °C, 70%, sol 324)', 29.6, 70, 324, 3, 'baixo');
caso('São Luís 12h (33,1 °C, 55%, sol 921)', 33.1, 55, 921, 3, 'atencao');
caso('São Luís 19h (27,5 °C, 79%, sem sol)', 27.5, 79, 0, 3, 'baixo');
caso('Belo Horizonte 13h (20,3 °C, 78%, sol 722)', 20.3, 78, 722, 2, 'baixo');

// 6. média dos modelos (Nova Lima, 9/11/2026 às 17h: 20,3 / 19,8 / 17,0 / 17,0; o iPhone mostrou 18)
const h17 = {};
const pos = (chave, vals) => CALOR_MODELOS.forEach((m, k) => (h17[`${chave}_${m}`] = [vals[k]]));
pos('temperature_2m', [20.3, 19.8, 17.0, 17.0]);
pos('precipitation', [0, 0, 0.2, 0.1]);
pos('weather_code', [3, 3, 51, 3]);
pos('cloud_cover', [100, 95, 100, 98]);
ok(
  Math.abs(mediaModelos(h17, 'temperature_2m', 0) - 18.525) < 1e-9,
  `média de Nova Lima: ${mediaModelos(h17, 'temperature_2m', 0)}`,
);
// modelo sem dado não entra na média; sem nenhum, volta null; sem sufixo (um modelo só), usa o valor puro
ok(
  mediaModelos({ temperature_2m_best_match: [20], temperature_2m_gfs_seamless: [null] }, 'temperature_2m', 0) === 20,
  'modelo sem dado não deveria entrar na média',
);
ok(mediaModelos({}, 'temperature_2m', 0) === null, 'sem dados a média deveria ser null');
ok(mediaModelos({ temperature_2m: [25] }, 'temperature_2m', 0) === 25, 'resposta de um modelo só deveria funcionar');
// chuva: precisa de pelo menos 2 modelos com 0,1 mm ou mais
const c17 = condicaoHora(h17, 0);
ok(c17.k === 'chuva' && c17.nome === 'Garoa', `Nova Lima 17h deveria ser Garoa: ${c17.nome}`);
const seco = {};
CALOR_MODELOS.forEach(
  (m, k) => ((seco[`precipitation_${m}`] = [[0, 0, 0.3, 0][k]]), (seco[`cloud_cover_${m}`] = [10])),
);
ok(
  condicaoHora(seco, 0).k === 'seco' && condicaoHora(seco, 0).nome === 'Céu limpo',
  'um modelo só com chuva não deveria virar chuva',
);
const forte = {};
CALOR_MODELOS.forEach((m) => ((forte[`precipitation_${m}`] = [4]), (forte[`weather_code_${m}`] = [95])));
ok(condicaoHora(forte, 0).nome === 'Chuva com raios', 'chuva com raios em todos os modelos');
// agora entre duas horas
ok(
  entreHoras(20, 18, 0.5) === 19 && entreHoras(null, 18, 0.5) === 18 && entreHoras(20, null, 0.5) === 20,
  'valor entre duas horas',
);

if (erros.length) {
  console.error('Leitura do tempo: TESTE FALHOU. Nada foi publicado.\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('Leitura do tempo: todas as contas conferidas.');
