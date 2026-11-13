/* Nexos App · Resumo do mês do atleta (para a videochamada mensal).
   As contas e as sugestões ficam no bloco puro (testado em scripts/testes/resumo.test.js); a tela é o relatorioMes (18). */

/* resumo:puro:inicio */
const resumoPace = (seg) => {
  if (!seg || !isFinite(seg)) return '';
  const s = Math.round(seg);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`;
};
const resumoKm = (v) => (Math.round(v * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** pontos fortes e o que melhorar, sugeridos a partir dos números do mês (o treinador edita antes de enviar).
 *  r = { fC, fM, km, kmAnt, corridas, previstos, feitosPl, ader, paceMes, paceAnt, longaKm, forca, forcaAnt,
 *        dores [{ data, local }], treinos, vistos, comentados, pront { media, dias } } */
function resumoSugestoes(r) {
  const fortes = [],
    melhorar = [];
  const pct = (a, b) => Math.round(((a - b) / b) * 100);
  if (r.fC && r.previstos >= 3 && r.ader != null && r.ader >= 80)
    fortes.push(`Cumpriu ${r.ader}% dos treinos de corrida da planilha (${r.feitosPl} de ${r.previstos}).`);
  if (r.fC && r.kmAnt >= 5 && r.km > r.kmAnt * 1.05 && r.km <= r.kmAnt * 1.3)
    fortes.push(`Correu ${resumoKm(r.km)} km, ${pct(r.km, r.kmAnt)}% a mais que no mês anterior, num aumento seguro.`);
  if (r.fC && r.paceMes && r.paceAnt && r.paceAnt - r.paceMes >= 5)
    fortes.push(
      `Ritmo médio de ${resumoPace(r.paceMes)} nas corridas de 2,5 km ou mais, ${Math.round(r.paceAnt - r.paceMes)} s por km mais rápido que no mês anterior.`,
    );
  if (r.fC && r.longaKm >= 5) fortes.push(`Corrida mais longa do mês: ${resumoKm(r.longaKm)} km.`);
  if (r.fM && r.forca >= 8) fortes.push(`Fez ${r.forca} treinos de força, uma ótima regularidade.`);
  if (r.treinos >= 4 && !r.dores.length) fortes.push('Nenhuma dor registrada nos treinos do mês.');
  if (r.pront && r.pront.dias >= 5 && r.pront.media >= 15)
    fortes.push(`Chegou bem recuperado aos treinos: prontidão média de ${resumoKm(r.pront.media)} de 20.`);

  if (r.fC && r.previstos >= 4 && r.ader != null && r.ader < 70)
    melhorar.push(
      `Cumpriu ${r.ader}% da planilha de corrida (${r.feitosPl} de ${r.previstos}). Vamos encaixar os treinos na rotina para chegar perto de 80%.`,
    );
  if (r.fC && r.kmAnt >= 10 && r.km > r.kmAnt * 1.3)
    melhorar.push(
      `O volume subiu ${pct(r.km, r.kmAnt)}% em relação ao mês anterior. Vale segurar o aumento para o corpo se adaptar.`,
    );
  if (r.dores.length) {
    const locais = [...new Set(r.dores.map((d) => d.local).filter(Boolean))];
    melhorar.push(
      r.dores.length === 1
        ? `Dor registrada em 1 treino${locais.length ? ` (${locais[0]})` : ''}. Avise se voltar, para ajustarmos a carga.`
        : `Dor registrada em ${r.dores.length} treinos${locais.length ? ` (${locais.join(', ')})` : ''}. Vamos acompanhar de perto e ajustar a carga se continuar.`,
    );
  }
  if (r.fM && r.forca < 4)
    melhorar.push(
      `${r.forca ? `Só ${r.forca} treino${r.forca === 1 ? '' : 's'}` : 'Nenhum treino'} de força no mês. Duas vezes por semana ajuda a prevenir lesões e a correr melhor.`,
    );
  if (r.pront && r.pront.dias >= 3 && r.pront.media < 12)
    melhorar.push(
      `Prontidão média baixa (${resumoKm(r.pront.media)} de 20): sono e recuperação merecem atenção neste mês.`,
    );
  if (r.treinos < 4)
    melhorar.push('Poucos treinos registrados no app. Registrar todos ajuda a acompanhar a evolução de perto.');
  if (r.fC && r.leve != null && r.leve < 65)
    melhorar.push(
      `Só ${r.leve}% do tempo de corrida foi em ritmo leve. Os treinos leves precisam ser leves de verdade, num ritmo em que dá para conversar.`,
    );
  // metas do próximo mês: poucas e medíveis
  const metas = [];
  if (r.fC && r.previstos >= 3)
    metas.push(
      r.ader != null && r.ader >= 80
        ? 'Manter 80% ou mais da planilha cumprida.'
        : 'Cumprir pelo menos 80% dos treinos da planilha.',
    );
  if (r.fM) metas.push('Fazer 2 treinos de força por semana.');
  if (r.fC && r.leve != null && r.leve < 70)
    metas.push('Fazer os treinos leves em ritmo de conversa (perto de 80% do tempo leve).');
  if (r.dores.length) metas.push('Avisar o treinador no mesmo dia se a dor voltar.');
  if (r.pront && r.pront.dias < 15) metas.push('Fazer o check-in da manhã na maioria dos dias.');
  if (!metas.length) metas.push('Seguir a planilha e registrar todos os treinos no app.');
  return { fortes, melhorar, metas: metas.slice(0, 4) };
}

/** Índice Nexos do mês (0 a 100): planilha cumprida (40), regularidade semanal (30), recuperação (15) e saúde (15).
 *  Partes sem dado saem da conta e o peso é redistribuído. r = { ader, semanas [n de treinos], pront { media }, dores } */
function resumoIndice(r) {
  const partes = [];
  if (r.ader != null) partes.push({ nome: 'Planilha cumprida', peso: 40, v: Math.min(100, r.ader) });
  if (r.semanas && r.semanas.length)
    partes.push({
      nome: 'Regularidade',
      peso: 30,
      v: Math.round((r.semanas.filter((n) => n >= 3).length / r.semanas.length) * 100),
    });
  if (r.pront && r.pront.media != null)
    partes.push({ nome: 'Recuperação', peso: 15, v: Math.round((Math.min(20, r.pront.media) / 20) * 100) });
  const nd = (r.dores || []).length;
  partes.push({ nome: 'Sem dor', peso: 15, v: nd === 0 ? 100 : nd === 1 ? 60 : nd === 2 ? 30 : 0 });
  const pt = partes.reduce((a, p) => a + p.peso, 0);
  const nota = Math.round(partes.reduce((a, p) => a + p.peso * p.v, 0) / pt);
  const faixa = nota >= 85 ? 'Excelente' : nota >= 70 ? 'Muito bom' : nota >= 55 ? 'Bom' : 'Em construção';
  return { nota, faixa, partes };
}

/** calendário do mês em semanas (segunda a domingo). dias = { 'AAAA-MM-DD': { km, forca, dor, prev } } */
function resumoCalendario(mes, hoje, dias) {
  const [y, m] = mes.split('-').map(Number);
  const ult = new Date(y, m, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  const ini = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const cel = [];
  for (let i = 0; i < ini; i++) cel.push(null);
  for (let d = 1; d <= ult; d++) {
    const iso = `${y}-${pad(m)}-${pad(d)}`;
    const x = dias[iso] || {};
    const treinou = (x.km || 0) > 0 || !!x.forca;
    cel.push({
      iso,
      dia: d,
      km: x.km || 0,
      forca: !!x.forca,
      dor: !!x.dor,
      futuro: iso > hoje,
      perdido: !!x.prev && !treinou && iso < hoje,
    });
  }
  while (cel.length % 7) cel.push(null);
  const sem = [];
  for (let i = 0; i < cel.length; i += 7) sem.push(cel.slice(i, i + 7));
  return sem;
}

/** distribuição da intensidade pelo tempo de corrida. runs = [{ min, int: 'leve' | 'mod' | 'forte' }] */
function resumoIntensidade(runs) {
  const t = { leve: 0, mod: 0, forte: 0 };
  runs.forEach((x) => x.int && t[x.int] != null && (t[x.int] += x.min || 0));
  const tot = t.leve + t.mod + t.forte;
  if (tot < 30) return null;
  const leve = Math.round((t.leve / tot) * 100),
    forte = Math.round((t.forte / tot) * 100);
  return { leve, mod: 100 - leve - forte, forte, min: Math.round(tot) };
}

/** recordes do mês. corridas = [{ data 'AAAA-MM-DD', km, seg }], dias = datas com treino (corrida ou força) */
function resumoRecordes(corridas, dias) {
  const r = {};
  corridas.forEach((c) => {
    if (!r.longa || c.km > r.longa.km) r.longa = { km: c.km, data: c.data };
    if (c.km >= 3 && c.seg) {
      const p = c.seg / c.km;
      if (!r.rapida || p < r.rapida.pace) r.rapida = { pace: p, km: c.km, data: c.data };
    }
  });
  const porSem = {};
  corridas.forEach((c) => {
    const d = new Date(c.data + 'T12:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = d.toISOString().slice(0, 10);
    porSem[k] = (porSem[k] || 0) + c.km;
  });
  Object.entries(porSem).forEach(([k, v]) => (!r.semana || v > r.semana.km) && (r.semana = { km: v, ini: k }));
  const ds = [...new Set(dias)].sort();
  let seq = 0,
    melhor = 0,
    ant = null;
  ds.forEach((d) => {
    const ok = ant && (Date.parse(d + 'T12:00:00') - Date.parse(ant + 'T12:00:00')) / 864e5 === 1;
    seq = ok ? seq + 1 : 1;
    melhor = Math.max(melhor, seq);
    ant = d;
  });
  r.sequencia = melhor;
  return r;
}
/* resumo:puro:fim */
