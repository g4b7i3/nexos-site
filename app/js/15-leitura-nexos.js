/* Nexos App · Leitura Nexos (análise automática de cada corrida).
   Parte 15 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Leitura Nexos: leitura automática de cada corrida ----------
   Roda no próprio aparelho com regras de fisiologia (zonas, FC, parciais, histórico e planilha):
   não depende de servidor, então funciona igual com 5 ou 5 mil alunos. */
const N1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
function zonaDoPace(pace, perfil) {
  const P = perfil && perfil.paces;
  if (!P || !pace) return null;
  const ordem = ['tiros', 'intervalado', 'limiar', 'maratona', 'leve'];
  for (const k of ordem) {
    const f = P[k];
    if (f && pace <= Math.max(f[0], f[1]) + 3) return k;
  }
  return 'rec';
}
const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const fmtSeg = (s) => {
  s = Math.round(Math.abs(s));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}min${s % 60 ? ' ' + String(s % 60).padStart(2, '0') + 's' : ''}`;
};
/** separa as voltas do relógio em esforço x recuperação (2 grupos pelo pace) */
function tirosDasVoltas(voltas, comAqDq, repPl) {
  const L = (voltas || [])
    .map((v, i) => ({ ...v, i, pace: v.d > 30 && v.seg > 8 ? v.seg / (v.d / 1000) : null }))
    .filter((v) => v.pace && v.pace > 120 && v.pace < 1200);
  if (L.length < 4) return null;
  // com a planilha: o tiro é a volta com a duração (ou distância) do passo forte; sobrando, ficam os mais rápidos
  const co = repPl && (repPl.passos || []).find((p) => p.k === 'co'),
    rc = repPl && (repPl.passos || []).find((p) => p.k !== 'co');
  if (co) {
    const alvo = co.med === 'min' ? { k: 'seg', v: co.v * 60 } : { k: 'd', v: co.med === 'km' ? co.v * 1000 : co.v };
    const alvoRc =
      rc && (rc.med === 'min' ? { k: 'seg', v: rc.v * 60 } : { k: 'd', v: rc.med === 'km' ? rc.v * 1000 : rc.v });
    const bate = (v, a, tol) => Math.abs(v[a.k] - a.v) / a.v <= tol;
    const ambiguo = alvoRc && alvoRc.k === alvo.k && Math.abs(alvoRc.v - alvo.v) / alvo.v < 0.3;
    if (!ambiguo) {
      let esf = L.filter((v) => bate(v, alvo, 0.2));
      if (esf.length >= 2) {
        if (esf.length > repPl.n)
          esf = esf
            .slice()
            .sort((x, y) => x.pace - y.pace)
            .slice(0, repPl.n)
            .sort((x, y) => x.i - y.i);
        const ids = new Set(esf.map((v) => v.i)),
          i0 = esf[0].i,
          i1 = esf[esf.length - 1].i;
        const rec = L.filter((v) => !ids.has(v.i) && v.i > i0 && v.i < i1);
        if (rec.length) return { esf, rec };
      }
    }
  }
  const miolo = comAqDq && L.length > 5 ? L.slice(1, -1) : L;
  let a = Math.min(...miolo.map((v) => v.pace)),
    b = Math.max(...miolo.map((v) => v.pace));
  for (let k = 0; k < 12; k++) {
    const lim = (a + b) / 2;
    const f = miolo.filter((v) => v.pace <= lim),
      s = miolo.filter((v) => v.pace > lim);
    if (!f.length || !s.length) break;
    a = media(f.map((v) => v.pace));
    b = media(s.map((v) => v.pace));
  }
  const lim = (a + b) / 2,
    esf = miolo.filter((v) => v.pace <= lim),
    rec = miolo.filter((v) => v.pace > lim);
  if (esf.length < 2 || !rec.length || a > b * 0.88) return null; // não é um treino de tiros de verdade
  return { esf, rec };
}
/** tempo em cada zona de FC (Z1 a Z5, as mesmas do perfil do aluno) pela série do relógio */
function tempoZonasFC(serie, zs) {
  const T = serie && serie.t,
    F = serie && serie.fc;
  if (!T || !F || !zs || T.length < 20) return null;
  const z = [0, 0, 0, 0, 0];
  let tot = 0;
  for (let i = 1; i < T.length; i++) {
    const f = F[i];
    const dt = T[i] - T[i - 1];
    if (!f || !(dt > 0) || dt > 30) continue;
    z[zonaFCIdx(zs, f)] += dt;
    tot += dt;
  }
  return tot > 300 ? z.map((x) => x / tot) : null;
}
/** zonas da análise da corrida: as mesmas do perfil, com a frase que explica a base */
function zonasDaAnalise(pc, fm) {
  if (pc.lthr) return Object.assign(zonasFCLimiar(pc.lthr, fm), { base: `Zonas pela FC de limiar de ${pc.lthr} bpm` });
  if (!fm) return null;
  return Object.assign(zonasFC(fm, pc.fcRep), {
    base: `FC máxima ${Math.round(fm)} bpm${pc.fcRep ? ` e de repouso ${pc.fcRep} bpm (reserva de FC)` : ''}`,
  });
}
function nexosInteligencia(c, { plano = null, perfil = {}, hist = [] } = {}) {
  if (!c || !comDist(c) || !c.duracao_s) return null;
  const A = c.analise || {},
    EX = A.extras || {},
    km = c.distancia_m / 1000,
    pace = paceDe(c);
  const tipo = (plano && plano.tipo) || c.tipo;
  const est = plano ? estruturaDe(plano) : [];
  const repPl = est.find((s) => s.k === 'rep');
  let misto = !!repPl || ['intervalado', 'tiros', 'fartlek'].includes(tipo);
  const leveP = ['rodagem', 'regenerativo', 'longao'].includes(tipo);
  const sec = { exe: [], ritmo: [], fc: [], tec: [], cond: [], comp: [] }; // detalhes do "Ver mais"
  const frases = [];
  let dica = '';
  const F = { km, pace, misto, leve: leveP, tipo }; // fatos para a sugestão de comentário do treinador
  // só usa % da FC máxima quando a máxima foi medida (a estimativa pela idade erra muito de pessoa para pessoa)
  const fcMax = perfil.fc_max || null;
  // ---------- esforço geral: só afirma quando as fontes concordam ----------
  const pctFc = c.fc_media && fcMax ? c.fc_media / fcMax : null;
  const nFc = pctFc ? (pctFc < 0.75 ? 1 : pctFc < 0.83 ? 2 : pctFc < 0.9 ? 3 : 4) : 0;
  const nRpe = c.rpe != null ? (c.rpe <= 3 ? 1 : c.rpe <= 5 ? 2 : c.rpe <= 7 ? 3 : 4) : 0;
  const zP = !misto && zonaDoPace(pace, perfil),
    nZ = { rec: 1, leve: 1, maratona: 2, limiar: 3, intervalado: 4, tiros: 4 }[zP] || 0;
  const fontes = [nFc, nRpe, nZ].filter(Boolean);
  let esfN = fontes.length && Math.max(...fontes) - Math.min(...fontes) <= 1 ? nFc || nRpe || nZ : 0;
  const esf = ['', 'esforço leve', 'esforço moderado', 'esforço relativo elevado', 'esforço muito alto'][esfN];
  const nome =
    tipo === 'ritmo'
      ? 'Treino de ritmo'
      : TIPOS_CORRIDA.some((t) => t[0] === tipo) && tipo !== 'folga'
        ? nomeTipo(tipo)
        : 'Corrida';
  let abertura = `${nome} de ${N1(km)} km${esf ? ` com ${esf}` : ''}`;
  // ---------- 1. execução de treino intervalado ----------
  let tiros = misto ? tirosDasVoltas(A.voltas, est.some((s) => s.k === 'aq') || !plano, repPl) : null;
  if (!tiros && !misto && !leveP) {
    const t = tirosDasVoltas(A.voltas, true);
    if (t && t.esf.length >= 3 && media(t.esf.map((v) => v.pace)) < media(t.rec.map((v) => v.pace)) * 0.85) tiros = t;
  } // tiros sem planilha
  if (tiros) {
    const { esf: E, rec: R } = tiros,
      pE = E.map((v) => v.pace),
      nPl = repPl ? repPl.n : null;
    const pm = media(pE),
      melhor = Math.min(...pE),
      pior = Math.max(...pE),
      spread = pior - melhor;
    const ini = media(pE.slice(0, Math.min(2, Math.floor(pE.length / 2)))),
      fim = media(pE.slice(-Math.min(2, Math.floor(pE.length / 2))));
    const queda = (fim - ini) / ini;
    const alvoPasso = repPl && (repPl.passos || []).find((p) => p.k === 'co');
    F.tiros = {
      feitos: E.length,
      plan: nPl,
      dist: queda > 0.04 ? 'caiu' : queda < -0.02 ? 'negativo' : spread / pm < 0.04 ? 'regular' : 'variou',
    };
    if (!misto) {
      misto = true;
    }
    abertura =
      repPl && plano.titulo
        ? `${plano.titulo}: ${E.length >= nPl ? `fez ${nPl === E.length ? 'as' : 'mais que as'} ${nPl} repetições` : `${E.length} de ${nPl} repetições`}${esf ? `, com ${esf}` : ''}`
        : `${tipo === 'corrida' ? 'Treino intervalado' : nome} com ${E.length} ${E.length === 1 ? 'tiro' : 'tiros'}${nPl ? ` de ${nPl} previstos` : ''}${esf ? `, ${esf}` : ''}`;
    sec.exe.push(
      `${E.length} ${E.length === 1 ? 'esforço' : 'esforços'} identificados nas ${c.fonte === 'celular' ? 'etapas gravadas pelo celular' : 'voltas do relógio'}${nPl ? ` (planilha: ${nPl})` : ''}. Pace médio nos tiros: ${fmtPace(pm)}; o mais rápido em ${fmtPace(melhor)} e o mais lento em ${fmtPace(pior)}.`,
    );
    sec.exe.push(
      `Tiros: ${E.map((v, k) => `${k + 1}º ${v.d >= 950 ? N1(v.d / 1000) + ' km' : Math.round(v.d) + ' m'} em ${fmtSeg(v.seg)}${v.fc ? ` (${v.fc} bpm)` : ''}`).join(' · ')}.`,
    );
    if (alvoPasso) {
      const alvoQ = alvoPasso.med === 'm' ? alvoPasso.v : alvoPasso.med === 'km' ? alvoPasso.v * 1000 : null,
        alvoT = alvoPasso.med === 'min' ? alvoPasso.v * 60 : null;
      if (alvoQ) {
        const dm = media(E.map((v) => v.d));
        if (Math.abs(dm - alvoQ) / alvoQ > 0.12)
          sec.exe.push(`Os tiros tiveram em média ${Math.round(dm)} m, e a planilha pedia ${Math.round(alvoQ)} m.`);
      }
      if (alvoT) {
        const tm = media(E.map((v) => v.seg));
        if (Math.abs(tm - alvoT) / alvoT > 0.15)
          sec.exe.push(`Os tiros duraram em média ${fmtSeg(tm)}, e a planilha pedia ${fmtSeg(alvoT)}.`);
      }
      const fx = perfil.paces && perfil.paces[alvoPasso.z];
      if (fx) {
        const rap = Math.min(...fx),
          len = Math.max(...fx);
        if (pm < rap - 4) {
          sec.exe.push(
            `Os tiros saíram ${fmtSeg(rap - pm)}/km mais rápidos que a zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`,
          );
          dica = dica || `o alvo dos tiros na planilha é ${faixaPace(fx)}`;
          F.tiros.zona = 'rapido';
        } else if (pm > len + 4) {
          sec.exe.push(
            `Os tiros ficaram ${fmtSeg(pm - len)}/km mais lentos que a zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`,
          );
          dica = dica || `o alvo dos tiros na planilha é ${faixaPace(fx)}`;
          F.tiros.zona = 'lento';
        } else
          ((F.tiros.zona = 'dentro'),
            sec.exe.push(`Os tiros ficaram dentro da zona pedida (${ZONAS_INFO[alvoPasso.z].n}: ${faixaPace(fx)}).`));
      }
    }
    if (nPl && E.length < nPl && !(repPl && plano.titulo)) {
      frases.push(`Faltaram ${nPl - E.length} ${nPl - E.length === 1 ? 'tiro' : 'tiros'} em relação à planilha.`);
    }
    if (queda > 0.04) frases.push(`Os últimos tiros ficaram ${fmtSeg(fim - ini)}/km mais lentos que os primeiros.`);
    else if (queda < -0.02) frases.push(`Terminou os tiros mais rápido do que começou, ótima distribuição de esforço.`);
    else if (spread / pm < 0.04)
      frases.push(`Tiros muito regulares: diferença de só ${fmtSeg(spread)}/km entre o mais rápido e o mais lento.`);
    else frases.push(`Variação de ${fmtSeg(spread)}/km entre o tiro mais rápido e o mais lento.`);
    const fE = E.filter((v) => v.fc).map((v) => v.fc),
      fR = R.filter((v) => v.fc).map((v) => v.fc);
    if (fE.length && fR.length && media(R.map((v) => v.seg)) >= 60) {
      const queda2 = media(fE) - media(fR),
        pico = Math.max(...E.map((v) => v.fcmax || v.fc || 0));
      sec.fc.push(
        `FC média nos tiros: ${Math.round(media(fE))} bpm${pico ? ` (pico de ${pico})` : ''}; nas recuperações: ${Math.round(media(fR))} bpm.`,
      );
      F.tiros.recFC = queda2 < 8 ? 'pouca' : 'boa';
      if (queda2 < 8)
        sec.fc.push(
          `A frequência quase não baixou nas recuperações (${queda2 > 0 ? Math.round(queda2) + ' bpm' : 'ficou igual'}).`,
        );
      else
        sec.fc.push(`A frequência baixou ${Math.round(queda2)} bpm nas recuperações: boa recuperação entre os tiros.`);
    }
  }
  // ---------- 2. ritmo e fadiga em corrida contínua ----------
  const sp = (c.parciais || []).filter((p) => !p.parcial && p.seg > 0);
  if (!tiros && sp.length >= 4) {
    const med = media(sp.map((p) => p.seg)),
      h = Math.floor(sp.length / 2);
    const m1 = media(sp.slice(0, h).map((p) => p.seg)),
      m2 = media(sp.slice(-h).map((p) => p.seg));
    const cv = Math.sqrt(media(sp.map((p) => (p.seg - med) ** 2))) / med;
    const fimN = Math.min(3, Math.ceil(sp.length / 4)),
      mFim = media(sp.slice(-fimN).map((p) => p.seg));
    const rapido = sp.reduce((a, p) => (p.seg < a.seg ? p : a)),
      lento = sp.reduce((a, p) => (p.seg > a.seg ? p : a));
    const dif = (m2 - m1) / m1;
    let r;
    if (misto) r = `ritmo variando entre ${fmtPace(rapido.seg)} e ${fmtPace(lento.seg)}, como pede o treino`;
    else if (dif < -0.02) r = 'terminou mais forte do que começou (split negativo)';
    else if (mFim > med * 1.05) r = `perdeu ${fmtSeg(mFim - med)}/km nos últimos ${fimN} km`;
    else if (cv < 0.03) r = 'ritmo muito consistente do início ao fim';
    else if (dif > 0.04) r = 'começou forte e foi caindo';
    else r = 'ritmo regular';
    if (!misto)
      F.ritmo =
        dif < -0.02
          ? 'negativo'
          : mFim > med * 1.05
            ? 'perdeu'
            : cv < 0.03
              ? 'consistente'
              : dif > 0.04
                ? 'caiu'
                : 'regular';
    abertura += `; ${r}`;
    sec.ritmo.push(
      `Primeira metade em ${fmtPace(m1)} e segunda em ${fmtPace(m2)} (${m2 > m1 ? '+' : '−'}${fmtSeg(m2 - m1)}/km). Km mais rápido: o ${rapido.km}º em ${fmtPace(rapido.seg)}; mais lento: o ${lento.km}º em ${fmtPace(lento.seg)}.`,
    );
    sec.ritmo.push(
      `Variação entre os quilômetros: ${Math.round(cv * 100)}% (${cv < 0.03 ? 'muito estável' : cv < 0.06 ? 'estável' : 'oscilou bastante'}).`,
    );
    // desacoplamento aeróbico (Friel): eficiência = velocidade ÷ FC, 1ª x 2ª metade
    const f1 = sp.slice(0, h).filter((p) => p.fc),
      f2 = sp.slice(-h).filter((p) => p.fc);
    if (!misto && f1.length >= 3 && f2.length >= 3 && c.duracao_s >= 1800) {
      const ef1 = media(f1.map((p) => 1000 / p.seg / p.fc)),
        ef2 = media(f2.map((p) => 1000 / p.seg / p.fc));
      const dec = (ef1 - ef2) / ef1;
      sec.fc.push(
        `Desacoplamento aeróbico de ${N1(dec * 100)}% (relação entre ritmo e frequência da 1ª para a 2ª metade). ${dec < 0.05 ? 'Abaixo de 5%: boa base aeróbica para esse ritmo e distância.' : 'Acima de 5%: o coração precisou trabalhar mais para manter o ritmo no fim.'}`,
      );
      if (dec < 0.05) F.aerobico = true;
      if (dec >= 0.08 && km >= 8) F.deriva = true;
      if (dec >= 0.08 && km >= 8)
        frases.push(
          `A frequência subiu ${Math.round(media(f2.map((p) => p.fc)) - media(f1.map((p) => p.fc)))} bpm na segunda metade sem ganho de ritmo (deriva cardíaca).`,
        );
    }
  } else if (!tiros) abertura += '';
  // ---------- 3. zonas de frequência ----------
  // zonas: pela FC de limiar (teste de 30 min) ou pela máxima medida, com a reserva quando há FC de repouso
  const zf = tempoZonasFC(
    A.serie,
    perfil.lthr ? zonasFCLimiar(perfil.lthr, fcMax) : fcMax ? zonasFC(fcMax, perfil.fcRep) : null,
  );
  if (zf) {
    sec.fc.push(`Tempo em cada zona de FC: ${zf.map((x, i) => `Z${i + 1} ${Math.round(x * 100)}%`).join(' · ')}.`);
    if (leveP && zf[2] + zf[3] + zf[4] > 0.35) F.leveForte = true;
    if (leveP && zf[2] + zf[3] + zf[4] > 0.35)
      frases.push(
        `Num treino leve, ${Math.round((zf[2] + zf[3] + zf[4]) * 100)}% do tempo ficou acima da Z2 de frequência.`,
      );
  } else if (pctFc)
    sec.fc.push(
      `FC média de ${c.fc_media} bpm, cerca de ${Math.round(pctFc * 100)}% da sua máxima${c.fc_max ? `; pico de ${c.fc_max}` : ''}.`,
    );
  if (leveP && perfil.paces && perfil.paces.leve && pace < Math.min(...perfil.paces.leve) - 5) {
    F.leveForte = true;
    frases.push(
      `O ritmo médio (${fmtPace(pace)}) ficou mais rápido que a sua zona leve (${faixaPace(perfil.paces.leve)}).`,
    );
    dica = dica || `a zona leve da sua planilha é ${faixaPace(perfil.paces.leve)}`;
  }
  if (!misto) {
    const zp = zonaDoPace(pace, perfil);
    if (zp) sec.ritmo.push(`Ritmo médio de ${fmtPace(pace)}, que fica na sua zona ${ZONAS_INFO[zp].n}.`);
  }
  // ---------- 4. condições: calor, subida, cadência ----------
  const temp = EX.temp_med != null ? EX.temp_med : null,
    sub = EX.sub != null ? EX.sub : c.elevacao_m;
  if (temp != null)
    sec.cond.push(
      `Temperatura registrada pelo relógio: ${N1(temp)} °C (o sensor fica no pulso e costuma marcar acima do ar).`,
    );
  if (sub != null && km > 0 && sub > 0)
    sec.cond.push(`${Math.round(sub)} m de subida no percurso (${N1(sub / km)} m por km).`);
  const cad = c.cadencia || (A.voltas && media(A.voltas.filter((v) => v.cad > 100).map((v) => v.cad)));
  if (cad) sec.cond.push(`Cadência média de ${Math.round(cad)} passos por minuto.`);
  // técnica (dinâmica de corrida): só quando o relógio ou o sensor mede
  if (EX.contato_ms) sec.tec.push(`Tempo de contato com o solo: ${EX.contato_ms} ms.`);
  if (EX.bal_med)
    sec.tec.push(
      `Equilíbrio de contato: ${N1(EX.bal_med)}% esquerda e ${N1(100 - EX.bal_med)}% direita${Math.abs(EX.bal_med - 50) >= 2 ? ' (diferença de ' + N1(Math.abs(2 * EX.bal_med - 100)) + ' pontos entre as pernas)' : ''}.`,
    );
  if (EX.oscil_cm)
    sec.tec.push(
      `Oscilação vertical: ${N1(EX.oscil_cm)} cm${EX.razao_vert ? `; razão vertical de ${N1(EX.razao_vert)}%` : ''}.`,
    );
  if (EX.passada_m) sec.tec.push(`Comprimento médio da passada: ${String(EX.passada_m).replace('.', ',')} m.`);
  if (EX.resp_med) sec.tec.push(`Respiração média: ${Math.round(EX.resp_med)} respirações por minuto.`);
  if (EX.carga) sec.cond.push(`Carga do treino calculada pelo Garmin: ${EX.carga}.`);
  if (EX.te_aer != null)
    sec.cond.push(
      `Efeito de treino do relógio: aeróbico ${N1(EX.te_aer)}${EX.te_ana != null ? ` e anaeróbico ${N1(EX.te_ana)}` : ''} (escala de 0 a 5).`,
    );
  // ---------- 5. planilha ----------
  let planTxt = '';
  if (plano) {
    const prev = Number(plano.distancia_km) || 0;
    if (prev) {
      const pc = km / prev;
      F.planoPc = pc;
      planTxt =
        pc >= 0.95
          ? pc > 1.15
            ? `foi além do previsto (${N1(km)} de ${N1(prev)} km)`
            : 'cumpriu a distância prevista'
          : `fez ${Math.round(pc * 100)}% da distância prevista`;
      sec.exe.unshift(
        `Planilha: ${plano.titulo || nomeTipo(plano.tipo)}, ${N1(prev)} km previstos; feito ${N1(km)} km.`,
      );
    }
  }
  // ---------- 6. comparação com o próprio atleta (90 dias) ----------
  const t0 = Date.parse(c.data);
  const ant = hist.filter(
    (x) =>
      x.id !== c.id &&
      ehCorr(x) &&
      x.distancia_m >= 2000 &&
      Date.parse(x.data) < t0 &&
      Date.parse(x.data) > t0 - 90 * 864e5,
  );
  let marco = '',
    dEf = null;
  if (ant.length >= 3) {
    const maxKm = Math.max(...ant.map((x) => x.distancia_m)) / 1000;
    const rap = ant
      .filter((x) => x.distancia_m >= Math.min(5000, c.distancia_m * 0.9))
      .map(paceDe)
      .filter(Boolean);
    if (km > maxKm + 0.2 && km >= 5) marco = 'sua corrida mais longa dos últimos 3 meses';
    else if (!misto && rap.length && c.distancia_m >= 5000 && pace < Math.min(...rap) - 1)
      marco = `seu melhor ritmo dos últimos 3 meses em ${N1(km)} km ou mais`;
    // eficiência aeróbica: ritmo na mesma frequência, comparado com as corridas aeróbicas anteriores
    if (!misto && c.fc_media && fcMax && pctFc < 0.86) {
      const ef = (x) => x.distancia_m / x.duracao_s / x.fc_media;
      const base = ant.filter((x) => x.fc_media && x.fc_media / fcMax < 0.86 && x.duracao_s > 900).map(ef);
      if (base.length >= 3) {
        const d = (ef(c) - media(base)) / media(base);
        dEf = d;
        const sKm = Math.round(pace - 1000 / (media(base) * c.fc_media));
        if (d > 0.03) {
          sec.comp.push(
            `Na mesma frequência cardíaca, você correu cerca de ${fmtSeg(-sKm)}/km mais rápido que a média das suas corridas leves e moderadas dos últimos 3 meses.`,
          );
          frases.push(
            `Na mesma frequência cardíaca, correu cerca de ${fmtSeg(-sKm)}/km mais rápido que a média das suas corridas dos últimos 3 meses.`,
          );
        } else if (d < -0.05)
          sec.comp.push(
            `Na mesma frequência cardíaca, o ritmo ficou cerca de ${fmtSeg(sKm)}/km mais lento que a sua média dos últimos 3 meses.`,
          );
        else sec.comp.push('Eficiência (ritmo para a mesma frequência) igual à sua média recente.');
      }
    }
    // corridas parecidas: distância até 25% diferente e ritmo até 20 s/km diferente
    if (!misto && pace) {
      const par = ant.filter(
        (x) =>
          Math.abs(x.distancia_m - c.distancia_m) / c.distancia_m <= 0.25 &&
          paceDe(x) &&
          Math.abs(paceDe(x) - pace) <= 20,
      );
      const pF = par.filter((x) => x.fc_media);
      if (c.fc_media && pF.length >= 2) {
        const mf = Math.round(media(pF.map((x) => x.fc_media))),
          df = c.fc_media - mf;
        sec.comp.push(
          `Em ${pF.length} corridas parecidas dos últimos 3 meses (distância e ritmo semelhantes), sua FC média foi ${mf} bpm; hoje, ${c.fc_media} bpm${Math.abs(df) <= 2 ? ', praticamente igual' : df < 0 ? `, ${-df} bpm a menos (sinal de boa adaptação ou de um dia descansado)` : `, ${df} bpm a mais (calor, cansaço, sono ou desidratação costumam explicar)`}.`,
        );
      }
      const pR = par.filter((x) => x.rpe != null);
      if (c.rpe != null && pR.length >= 2) {
        const mr = media(pR.map((x) => x.rpe)),
          dr = c.rpe - mr;
        if (Math.abs(dr) >= 1.5)
          sec.comp.push(
            `O esforço que você deu (${c.rpe}/10) ficou ${dr > 0 ? 'acima' : 'abaixo'} do que costuma dar em corridas parecidas (média ${N1(mr)}/10)${dr > 0 ? ': o mesmo treino pareceu mais pesado hoje' : ': o mesmo treino pareceu mais leve, bom sinal de evolução'}.`,
          );
      }
    }
    // cadência comparada com a sua média
    const cads = ant.map((x) => x.cadencia).filter((v) => v > 100);
    if (c.cadencia > 100 && cads.length >= 3) {
      const mc = Math.round(media(cads)),
        dc = Math.round(c.cadencia - mc);
      F.cadDif = dc;
      if (Math.abs(dc) >= 4)
        sec.comp.push(
          `Cadência de ${Math.round(c.cadencia)} passos por minuto, ${Math.abs(dc)} ${dc > 0 ? 'acima' : 'abaixo'} da sua média (${mc}).${misto ? ' Em treinos com tiros ela costuma subir.' : ''}`,
        );
    }
    // frequência de treino: dias desde a corrida anterior e corridas na semana
    const todas = hist.filter((x) => x.id !== c.id && ehCorr(x) && Date.parse(x.data) < t0); // aqui conta toda corrida, mesmo as curtas
    const ultAnt = todas.reduce((m, x) => Math.max(m, Date.parse(x.data)), 0);
    const nSem = todas.filter((x) => Date.parse(x.data) > t0 - 7 * 864e5).length + 1,
      mSem =
        todas.filter((x) => Date.parse(x.data) > t0 - 35 * 864e5 && Date.parse(x.data) <= t0 - 7 * 864e5).length / 4;
    if (ultAnt) {
      const dd = Math.round((t0 - ultAnt) / 864e5);
      if (dd >= 4) sec.comp.push(`Foram ${dd} dias desde a sua corrida anterior.`);
    }
    if (mSem >= 1 && nSem >= mSem + 2)
      sec.comp.push(`Esta é a sua ${nSem}ª corrida em 7 dias, acima do seu costume (cerca de ${N1(mSem)} por semana).`);
    const sem4 = ant.filter((x) => Date.parse(x.data) > t0 - 28 * 864e5).reduce((a, x) => a + x.distancia_m, 0) / 4000;
    if (sem4 > 0)
      sec.comp.push(
        `Sua média nas últimas 4 semanas é de ${N1(sem4)} km por semana; este treino representa ${Math.round((km / sem4) * 100)}% disso.`,
      );
    // salto de treino isolado (Frandsen et al. 2025): mais de 10% acima do mais longo dos 30 dias anteriores
    const ult30 = ant.filter((x) => Date.parse(x.data) > t0 - 30 * 864e5 && Date.parse(x.data) < t0 - 36e5);
    const mx30 = ult30.length >= 3 ? Math.max(...ult30.map((x) => x.distancia_m / 1000)) : 0;
    if (mx30 >= 3 && km > mx30 * 1.1) {
      const pc = Math.round((km / mx30 - 1) * 100);
      F.salto = pc;
      sec.comp.push(
        `Este treino foi ${pc}% maior que o mais longo dos 30 dias anteriores (${N1(mx30)} km). Saltos acima de 10% num treino isolado aumentaram o risco de lesão no maior estudo sobre o tema; se for proposital, capriche na recuperação.`,
      );
    }
  }
  // ---------- 7. corpo ----------
  let alerta = '';
  if (c.dor)
    alerta = `Você relatou dor${c.dor_local ? ' (' + c.dor_local + ')' : ''}: se continuar nos próximos treinos, avise o seu treinador.`;
  else {
    // escalas: sono 0 bom, 1 regular, 2 ruim; cansaço 0 normal, 1 cansado, 2 muito cansado
    const sinais = [
      c.cansaco === 2 ? 'muito cansaço' : c.cansaco === 1 ? 'cansaço' : '',
      c.sono === 2 ? 'sono ruim' : '',
    ].filter(Boolean);
    if (sinais.length) {
      const q = sinais.join(' e ');
      let t = `Se você marcou ${q} neste treino, vale dar atenção à recuperação nos próximos dias, principalmente ao sono.`;
      if (dEf != null && dEf > 0.03)
        t +=
          ' Mesmo assim, os números mostram que o corpo respondeu bem: o ritmo para a mesma frequência ficou melhor que a sua média.';
      else if (dEf != null && dEf < -0.05)
        t +=
          ' Os números também mostram um dia mais pesado: o ritmo para a mesma frequência ficou abaixo da sua média.';
      sec.comp.push(t);
    }
    // padrão nas últimas 2 semanas
    const rec14 = [
      c,
      ...hist.filter(
        (x) => x.id !== c.id && ehCorr(x) && Date.parse(x.data) < t0 && Date.parse(x.data) > t0 - 14 * 864e5,
      ),
    ].filter((x) => x.sono != null || x.cansaco != null);
    const pes = rec14.filter((x) => x.cansaco >= 1 || x.sono === 2).length;
    if (rec14.length >= 3 && pes >= 3)
      sec.comp.push(
        `Nos registros das últimas 2 semanas, cansaço ou sono ruim aparecem em ${pes} de ${rec14.length} corridas. Quando isso se repete, pode ser sinal de que o corpo precisa de mais descanso; vale comentar com o seu treinador.`,
      );
  }
  // ---------- texto final ----------
  let txt = abertura + '.';
  const extra = [marco && `Foi ${marco}`, planTxt && (marco ? `e ${planTxt}` : `Você ${planTxt}`)]
    .filter(Boolean)
    .join(' ');
  if (extra) txt += ` ${extra}.`;
  frases.slice(0, 2).forEach((f) => {
    txt += ' ' + f;
  });
  if (alerta) txt += ' ' + alerta;
  else if (dica) txt += ` Lembrete: ${dica}.`;
  const det = [
    ['Execução do treino', sec.exe],
    ['Ritmo', sec.ritmo],
    ['Frequência cardíaca', sec.fc],
    ['Técnica da corrida', sec.tec],
    ['Condições', sec.cond],
    ['Comparado com você mesmo', sec.comp],
  ].filter(([, l]) => l.length);
  Object.assign(F, {
    marco,
    ef: dEf,
    dor: c.dor ? c.dor_local || true : null,
    cansaco: c.cansaco,
    sono: c.sono,
    rpe: c.rpe,
  });
  return { txt: txt.charAt(0).toUpperCase() + txt.slice(1), det, fatos: F };
}
// sugestão de comentário do treinador, a partir dos fatos da Leitura Nexos: frases curtas, em tom de conversa
function escolhaFixa(lista, semente) {
  let h = 0;
  for (const ch of String(semente || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}
function sugestaoCorrida(F, nomeAluno, semente) {
  if (!F) return '';
  const nome = nomeAluno ? firstName(nomeAluno) : '';
  const partes = [];
  const T = F.tiros;
  if (F.dor)
    partes.push(
      `Vi que você sentiu dor${typeof F.dor === 'string' ? ` (${F.dor.toLowerCase()})` : ''}. Como está hoje? Se continuar, me avisa que a gente ajusta os próximos treinos.`,
    );
  if (T) {
    const faltou = T.plan && T.feitos < T.plan;
    let a = faltou
      ? `Você fez ${T.feitos} de ${T.plan} tiros`
      : T.zona === 'dentro'
        ? escolhaFixa(
            [
              'Treino muito bem executado! Os tiros saíram na zona certa',
              'Que treino! Os tiros ficaram certinhos na zona pedida',
            ],
            semente,
          )
        : T.zona === 'rapido'
          ? 'Treino forte! Os tiros saíram mais rápidos que a zona pedida'
          : T.zona === 'lento'
            ? 'Treino feito! Os tiros ficaram um pouco abaixo do ritmo pedido'
            : escolhaFixa(['Treino muito bem feito', 'Bom treino de tiros'], semente);
    if (!faltou && (T.zona === 'dentro' || !T.zona)) {
      if (T.dist === 'negativo') a += ', e você terminou mais forte do que começou';
      else if (T.dist === 'regular') a += ', bem regulares do início ao fim';
    }
    partes.push(a + (faltou || T.zona === 'lento' ? '.' : '!'));
    if (T.recFC === 'boa')
      partes.push('A frequência baixou bem nas recuperações, sinal de que o corpo está assimilando a carga.');
    if (T.zona === 'rapido')
      partes.push(
        'Da próxima vez, segura um pouco: a ideia é fazer a série inteira no ritmo certo, sem passar do ponto.',
      );
    else if (T.zona === 'lento') partes.push('Normal dependendo do dia. Vamos acompanhando.');
    if (T.dist === 'caiu') partes.push('Os últimos caíram um pouco, sinal de que a intensidade estava no limite.');
  } else {
    if (F.leveForte)
      partes.push(
        `Bom treino! Só um detalhe: ${F.tipo === 'longao' ? 'o longão é para ser no ritmo leve' : 'esse era um treino leve'}, então pode segurar mais o ritmo. É no leve que a base aeróbica cresce.`,
      );
    else if (F.ritmo === 'negativo')
      partes.push('Treino muito bem feito! Terminou mais forte do que começou, ótimo controle de ritmo.');
    else if (F.ritmo === 'consistente')
      partes.push(
        escolhaFixa(
          [
            'Treino muito bem feito! Ritmo constante do início ao fim.',
            'Que treino constante! Ritmo bem controlado do início ao fim.',
          ],
          semente,
        ),
      );
    else if (F.ritmo === 'perdeu')
      partes.push(
        'Treino feito! No final o ritmo caiu um pouco. Vale cuidar da hidratação e começar um pouco mais leve.',
      );
    else if (F.ritmo === 'caiu')
      partes.push('Treino feito! Começou forte e foi caindo. Da próxima, começa um pouco mais leve e cresce no fim.');
    else partes.push(escolhaFixa(['Bom treino!', 'Treino feito, muito bom!', 'Boa, treino cumprido!'], semente));
    if (F.aerobico && !F.leveForte) partes.push('A frequência ficou controlada, sinal de boa base aeróbica.');
    if (F.deriva) partes.push('A frequência subiu bastante no fim: calor e hidratação contam muito nesses dias.');
  }
  if (F.marco) partes.push(`E foi ${F.marco}!`);
  else if (F.ef != null && F.ef > 0.03)
    partes.push('Seu corpo está respondendo bem: o ritmo para a mesma frequência melhorou.');
  if (F.planoPc != null && F.planoPc < 0.8 && !(T && T.plan && T.feitos < T.plan))
    partes.push('Ficou um pouco abaixo da distância prevista. Se teve algum motivo, me conta.');
  if (F.salto >= 10) partes.push('Foi bem mais longo que o normal, então capricha no descanso nos próximos dias.');
  if (!F.dor && (F.cansaco === 2 || F.sono === 2))
    partes.push('Vi que você marcou cansaço ou sono ruim: prioriza o descanso esses dias.');
  // no máximo 4 frases, para não virar relatório
  const corpo = partes.slice(0, 4).join(' ');
  const fim = escolhaFixa(
    ['Segue firme!', 'Continua assim!', 'Bora para o próximo!', 'Parabéns pelo treino!'],
    semente + 'f',
  );
  return `${nome && !F.dor ? nome + ', ' + corpo.charAt(0).toLowerCase() + corpo.slice(1) : corpo} ${F.dor ? '' : fim}`.trim();
}
const NI_LOGO = '<span class="ni-logo" aria-hidden="true"><i></i><i></i><i></i></span>';
function nexosIntHTML(r) {
  if (!r) return '';
  return `<div class="ni-card"><div class="ni-h">${NI_LOGO}<b>Leitura Nexos</b></div><p class="ni-txt">${esc(r.txt)}</p>
    ${r.det.length ? `<details class="ni-mais"><summary><span class="ni-a">Ver mais</span><span class="ni-b">Ver menos</span></summary>${r.det.map(([t, l]) => `<div class="ni-sec"><b>${t}</b><ul>${l.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>`).join('')}</details>` : ''}</div>`;
}
const buscarHist90 = (alunoId, ate) =>
  sb
    .from('nx_corridas')
    .select('id,data,tipo,distancia_m,duracao_s,fc_media,cadencia,rpe,sono,cansaco')
    .eq('aluno_id', alunoId)
    .gte('data', new Date(Date.parse(ate) - 92 * 864e5).toISOString())
    .lte('data', ate)
    .then(
      (r) => r.data || [],
      () => [],
    );

async function viewCorrida(id) {
  loading();
  const { data: c } = await sb.from('nx_corridas').select('*').eq('id', id).maybeSingle();
  if (!c) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Corrida não encontrada</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const [plano, nome, hist90] = await Promise.all([
    c.plano_id
      ? sb
          .from('nx_plano_corrida')
          .select('*')
          .eq('id', c.plano_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
    S.staff
      ? sb
          .from('nx_membros')
          .select('nome,corrida,nascimento')
          .eq('org_id', S.org.id)
          .eq('user_id', c.aluno_id)
          .maybeSingle()
          .then((r) => r.data || { nome: 'Aluno' })
      : Promise.resolve(null),
    ehCorr(c) ? buscarHist90(c.aluno_id, c.data) : Promise.resolve([]),
  ]);
  const membroC = S.staff ? nome : S.me;
  const pc = perfilCorrida(membroC || {});
  const fcMaxFonte =
    membroC && membroC.corrida && membroC.corrida.fc_max
      ? 'medida no perfil de corrida'
      : pc.fcMax
        ? 'estimada pela idade'
        : '';
  const analiseBlocos = c.analise
    ? analiseCorridaHTML(
        c,
        pc.fcMax && (!c.fc_max || pc.fcMax >= c.fc_max) ? pc.fcMax : c.fc_max,
        pc.fcMax && (!c.fc_max || pc.fcMax >= c.fc_max) ? fcMaxFonte : 'a maior da corrida',
        pc.paces,
        zonasDaAnalise(pc, pc.fcMax && (!c.fc_max || pc.fcMax >= c.fc_max) ? pc.fcMax : c.fc_max),
      )
    : [];
  // o treinador marca como visto quando quiser (o aluno é avisado)
  const pace = paceDe(c);
  const parc = c.parciais || [];
  const pk = (p) => p.seg / (p.parcial ? p.km % 1 || 1 : 1);
  const pMin = parc.length ? Math.min(...parc.map(pk)) : 0,
    pMax = parc.length ? Math.max(...parc.map(pk)) : 0;
  const voltar = S.staff ? `#/aluno/${c.aluno_id}/corrida` : '#/historico/corrida';
  const niR = ehCorr(c) ? nexosInteligencia(c, { plano, perfil: pc, hist: hist90 }) : null;
  $app.innerHTML = `
    <div class="row between"><a class="back" href="${voltar}" style="margin:0">${I.back} ${S.staff ? esc(nome.nome || 'Aluno') : 'Corridas'}</a>${S.staff ? `<div class="row" style="gap:6px">${c.visto_treinador ? `<span class="tag ok">${I.check} Visto</span>` : `<button class="btn sm visto-btn grande" data-visto="corrida|${c.id}">${I.check} Visto</button>`}<button class="btn ghost sm" id="coment-tr">${I.feed} Comentar</button></div>` : c.comentario_treinador ? `<span class="tag ok">${I.check} Analisado e comentado pelo treinador</span>` : c.visto_treinador ? `<span class="tag ok">${I.check} Analisado pelo treinador</span>` : ''}</div>
    <p class="eyebrow" style="margin-top:16px">${esc((TIPOS_ATIV.find((t) => t[0] === c.tipo) || [, nomeAtiv(c)])[1])} · ${fmtDia(c.data)} · ${fmtHora(c.data)}${c.fonte === 'garmin' ? ' · Garmin' : ''}</p>
    <h1 class="h1">${esc(c.titulo && !/^\d/.test(c.titulo) ? c.titulo : comDist(c) ? fmtKm(c.distancia_m) : nomeAtiv(c))}</h1>
    ${c.rota && c.rota.length > 10 ? `<button class="card-cta replay-cta" id="replay"><span class="card-cta-ic">${I.play}</span><div class="grow" style="text-align:left"><b>Replay do percurso</b><span class="small">Vídeo do trajeto sendo desenhado, pronto para o story</span></div>${I.chev}</button>` : ''}
    <div id="vcv"></div>
    ${!S.staff && comDist(c) ? `<button class="card-cta" id="gerar-card"><span class="card-cta-ic">${I.cam}</span><div class="grow" style="text-align:left"><b>Gerar card para o story</b><span class="small">Com foto de fundo ou sem fundo, com a marca da Nexos</span></div>${I.chev}</button>` : ''}
    <div class="metrics">
      ${comDist(c) ? `<div class="metric"><span>Distância</span><b>${fmtKm(c.distancia_m).replace(' km', '')}<small>km</small></b></div>` : ''}
      <div class="metric"><span>${comDist(c) ? 'Tempo' : 'Duração'}</span><b>${fmtDurLongo(c.duracao_s)}</b></div>
      ${ehCorr(c) && comDist(c) ? `<div class="metric"><span>Pace médio</span><b>${fmtPace(pace).replace('/km', '')}<small>/km</small></b></div>` : comDist(c) ? `<div class="metric"><span>Velocidade</span><b>${(c.distancia_m / 1000 / (c.duracao_s / 3600)).toFixed(1).replace('.', ',')}<small>km/h</small></b></div>` : ''}
      ${c.fc_media ? `<div class="metric"><span>FC média</span><b>${c.fc_media}<small>bpm</small></b>${c.fc_max ? `<em>máx ${c.fc_max}</em>` : ''}</div>` : ''}
      ${c.elevacao_m ? `<div class="metric"><span>Subida</span><b>${Math.round(c.elevacao_m)}<small>m</small></b></div>` : ''}
      ${c.cadencia ? `<div class="metric"><span>Cadência</span><b>${c.cadencia}<small>ppm</small></b></div>` : ''}
      ${c.rpe != null ? `<div class="metric"><span>Esforço</span><b>${c.rpe}<small>/10</small></b><em>${rpeTxt(c.rpe)}</em></div>` : ''}
    </div>
    ${ehCorr(c) ? nexosIntHTML(niR) : ''}
    ${S.staff && !c.comentario_treinador ? '<div id="sug-corr"></div>' : ''}
    ${c.dor ? `<div class="card" style="margin-top:12px;border-color:rgba(214,120,0,.35)"><span class="eyebrow" style="color:var(--warn)">Relatou dor${c.dor_local ? ': ' + esc(c.dor_local) : ''}</span></div>` : ''}
    ${corpoTags(c) ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${corpoTags(c)}</div>` : ''}
    ${c.comentario ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Como foi</span><p style="margin-top:6px">“${esc(c.comentario)}”</p></div>` : ''}
    ${c.comentario_treinador ? `<div class="card coment-tr" style="margin-top:12px"><div class="row between"><span class="eyebrow">${I.feed} Comentário do treinador</span>${c.comentario_treinador_em ? `<span class="tiny dim">${fmtDia(c.comentario_treinador_em)}</span>` : ''}</div><p style="margin-top:6px;white-space:pre-line">${esc(c.comentario_treinador)}</p>${S.staff ? `<button class="link-btn tiny" id="coment-tr-ed" style="margin-top:8px">Editar</button>` : ''}</div>` : ''}
    ${
      plano
        ? `<div class="card plan-vs"><span class="eyebrow">Previsto × realizado</span><div class="h3" style="margin-top:4px">${esc(plano.titulo || nomeTipo(plano.tipo))}</div>
      <div class="pv"><div><span>Previsto</span><b>${plano.distancia_km ? String(plano.distancia_km).replace('.', ',') + ' km' : plano.duracao_min ? plano.duracao_min + ' min' : '–'}</b></div><div><span>Feito</span><b>${fmtKm(c.distancia_m)}</b></div>
      ${plano.distancia_km ? `<div><span>Cumprido</span><b>${Math.round((c.distancia_m / 1000 / plano.distancia_km) * 100)}%</b></div>` : ''}</div>
      ${plano.descricao ? `<p class="small muted" style="margin-top:8px">${esc(plano.descricao)}</p>` : ''}
      <button type="button" class="link-btn small" id="trocar-plano" style="margin-top:10px">Não era este treino? Trocar</button></div>`
        : ehCorr(c) && c.tipo !== 'caminhada'
          ? `<div class="card avulsa-card"><div class="grow"><span class="eyebrow">Corrida por fora</span><p class="small muted" style="margin-top:4px">Não conta como treino da planilha.</p></div><button type="button" class="btn sm ghost" id="trocar-plano">Era um treino da planilha</button></div>`
          : ''
    }
    ${
      c.rota
        ? (() => {
            const rc = coresRotaPace(c, pc);
            return `<div class="section"><div class="section-h"><h2 class="h2">Percurso</h2>${slashes}</div><div class="card rota-box">${rotaSVG(c.rota, 200, rc && rc.cores)}${rc ? `<div class="rota-leg">${rc.leg}</div>` : ''}</div></div>`;
          })()
        : ''
    }
    ${analiseBlocos.slice(0, analiseBlocos.length - (c.analise && analiseBlocos.length && analiseBlocos[analiseBlocos.length - 1].includes('Todos os números') ? 1 : 0)).join('')}
    ${
      parc.length
        ? `<div class="section"><div class="section-h"><h2 class="h2">Parciais</h2>${slashes}</div><div class="card"><div class="splits">${parc
            .map((p) => {
              const v = pk(p);
              const w = pMax > pMin ? 35 + (65 * (pMax - v)) / (pMax - pMin) : 100;
              return `<div><span>${p.parcial ? String(p.km).replace('.', ',') : 'km ' + p.km}</span><i style="width:${w.toFixed(0)}%"></i><b>${fmtPace(v).replace('/km', '')}</b><em>${p.fc ? p.fc + ' bpm' : ''}</em></div>`;
            })
            .join('')}</div></div></div>`
        : ''
    }
    ${analiseBlocos.length && analiseBlocos[analiseBlocos.length - 1].includes('Todos os números') ? analiseBlocos[analiseBlocos.length - 1] : ''}
    <p class="tiny dim" style="margin-top:16px">Fonte: ${c.fonte === 'garmin' ? 'Garmin' : c.fonte === 'arquivo' ? 'arquivo do relógio' : c.fonte === 'celular' ? 'GPS do celular' : c.fonte === 'intervals' ? 'Intervals.icu' : 'digitado'} · <button class="link-btn tiny" id="apagar-c">Apagar corrida</button></p>`;
  const gc = document.getElementById('gerar-card');
  if (gc) gc.onclick = () => abrirCardCorrida(c, plano);
  const rp = document.getElementById('replay');
  if (rp) rp.onclick = () => abrirReplay(c, pc);
  vcvHTML(c)
    .then((h) => {
      const bx = document.getElementById('vcv');
      if (bx && h) bx.innerHTML = h;
    })
    .catch(() => {});
  $app.querySelectorAll('[data-visto]').forEach((b) => (b.onclick = () => marcarVisto(b)));
  const tp = document.getElementById('trocar-plano');
  if (tp) tp.onclick = () => trocarTreinoDaCorrida(c);
  ['coment-tr', 'coment-tr-ed'].forEach((k) => {
    const e = document.getElementById(k);
    if (e) e.onclick = () => comentarTreino(c, nome);
  });
  // sugestão de comentário (só a equipe): Usar abre a Análise do treinador já preenchida, para editar e enviar
  const sgBox = document.getElementById('sug-corr');
  if (sgBox && niR)
    montarSugestao(sgBox, {
      chave: 'sug:corrida:' + c.id,
      texto: sugestaoCorrida(niR.fatos, nome && nome.nome, c.id),
      destino: 'Abre a Análise do treinador para você editar e enviar.',
      usar: (t) => comentarTreino(c, nome, t),
    });
  if (c.analise) bindGraficos($app, c);
  document.getElementById('apagar-c').onclick = async () => {
    if (!confirm('Apagar esta corrida?')) return;
    const { error } = await sb.from('nx_corridas').delete().eq('id', c.id);
    error ? toast('Não foi possível apagar.', true) : (toast('Corrida apagada.'), (location.hash = voltar));
  };
}

/* ---------- de qual treino foi esta corrida: o aluno (ou o treinador) corrige à mão ----------
   O app liga sozinho só o treino do mesmo dia (ou o treino enviado ao relógio, pelo nome). Aqui dá para dizer que foi
   uma corrida por fora (não conta como treino) ou escolher o treino certo da planilha. */
async function trocarTreinoDaCorrida(c) {
  const d = isoDia(c.data);
  const [{ data: pl }, { data: usados }] = await Promise.all([
    sb
      .from('nx_plano_corrida')
      .select('id,data,titulo,tipo,distancia_km,duracao_min,liberado')
      .eq('aluno_id', c.aluno_id)
      .gte('data', somaDias(d, -7))
      .lte('data', somaDias(d, 7))
      .not('tipo', 'in', '(folga,forca)')
      .order('data'),
    sb
      .from('nx_corridas')
      .select('id,plano_id')
      .eq('aluno_id', c.aluno_id)
      .not('plano_id', 'is', null)
      .gte('data', new Date(Date.parse(d + 'T12:00:00') - 9 * 864e5).toISOString()),
  ]);
  const ocupado = new Set((usados || []).filter((u) => u.id !== c.id).map((u) => u.plano_id));
  const lista = (pl || []).filter((p) => p.liberado !== false || S.staff);
  const linha = (p) => {
    const oc = ocupado.has(p.id);
    const qt = p.distancia_km
      ? `${String(p.distancia_km).replace('.', ',')} km`
      : p.duracao_min
        ? `${p.duracao_min} min`
        : '';
    return `<button type="button" class="list-item" data-esc="${p.id}" ${oc ? 'disabled' : ''} style="width:100%;text-align:left;color:inherit${oc ? ';opacity:.5' : ''}"><div class="grow" style="min-width:0"><b>${esc(p.titulo || nomeTipo(p.tipo))}</b><div class="small muted">${fmtData(p.data + 'T12:00:00')}${p.data === d ? ' · mesmo dia' : ''}${qt ? ' · ' + qt : ''}${oc ? ' · já feito com outra corrida' : ''}</div></div>${c.plano_id === p.id ? `<span class="tag ok">${I.check} atual</span>` : ''}</button>`;
  };
  openSheet(
    `<p class="eyebrow">Corrida de ${fmtData(c.data)}</p><div class="h2" style="margin-top:4px">De qual treino foi?</div>
    <p class="small muted" style="margin-top:6px">O app liga sozinho a corrida ao treino do mesmo dia. Se foi uma corrida por fora, marque abaixo: ela fica no histórico, mas não conta como treino feito.</p>
    <button type="button" class="list-item avulsa-op" data-esc="" style="width:100%;text-align:left;color:inherit;margin-top:12px"><div class="grow"><b>Corrida por fora</b><div class="small muted">Não era treino da planilha</div></div>${!c.plano_id ? `<span class="tag ok">${I.check} atual</span>` : ''}</button>
    <p class="sec-lbl" style="margin-top:14px">Treinos da planilha (uma semana antes e depois)</p>
    <div class="stack">${lista.length ? lista.map(linha).join('') : '<p class="small muted">Nenhum treino de corrida nesse período.</p>'}</div>`,
    (r) =>
      r.querySelectorAll('[data-esc]').forEach(
        (b) =>
          (b.onclick = async () => {
            const id = b.dataset.esc || null;
            b.disabled = true;
            const { error } = await sb.from('nx_corridas').update({ plano_id: id, avulsa: !id }).eq('id', c.id);
            if (error) {
              b.disabled = false;
              return toast('Não foi possível trocar agora.', true);
            }
            closeSheet();
            toast(id ? 'Pronto. A corrida agora conta como esse treino.' : 'Pronto. Ficou como corrida por fora.');
            S.cache = { ...S.cache, planilha: null };
            viewCorrida(c.id);
          }),
      ),
  );
}
