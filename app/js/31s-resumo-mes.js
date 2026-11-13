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
  return { fortes, melhorar };
}
/* resumo:puro:fim */
