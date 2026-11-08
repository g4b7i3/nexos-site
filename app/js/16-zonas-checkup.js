/* Nexos App · Zonas automáticas pelos testes de campo e Check-up do Corredor.
   Parte 16 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- zonas automáticas pelos testes de campo ---------- */
const TESTE_NOME = {
  t30: 'teste de 30 min (Friel)',
  vam: 'teste de VAM',
  vc: 'teste de velocidade crítica',
  cooper: 'teste de Cooper',
  t2400: 'teste de 2.400 m',
  t10k: 'teste de 10 km',
  t5k: 'teste de 5 km',
  t3k: 'teste de 3 km',
  fcmax: 'teste de FC máxima',
};
function tipoDoTeste(p) {
  const t = semAcento(String((p && p.titulo) || '')).toLowerCase();
  if (/30 ?min/.test(t) && /friel|limiar|teste/.test(t)) return 't30';
  if (/\bvam\b|leger|boucher|vo2 ?max/.test(t)) return 'vam';
  if (/velocidade critica|\bvc\b|1\.?200.*3\.?600/.test(t)) return 'vc';
  if (/cooper|12 ?min/.test(t)) return 'cooper';
  if (/2\.?400/.test(t)) return 't2400';
  if (/fc ?max|frequencia cardiaca maxima/.test(t)) return 'fcmax';
  if (/10 ?k|10 ?km/.test(t)) return 't10k';
  if (/teste de 5 ?km/.test(t)) return 't5k';
  if (/teste de 3 ?km/.test(t)) return 't3k';
  return null;
}
// janela de tempo com maior velocidade média: {v (m/s), i, j}
function melhorJanelaTempo(S_, W) {
  const T = S_.t,
    D = S_.d;
  let best = null,
    j = 0;
  for (let i = 0; i < T.length; i++) {
    while (j < T.length && T[j] - T[i] < W) j++;
    if (j >= T.length) break;
    const dt = T[j] - T[i];
    if (dt > W * 1.15) continue;
    const v = (D[j] - D[i]) / dt;
    if (!best || v > best.v) best = { v, i, j };
  }
  return best;
}
// trecho de distância mais rápido: {seg, i, j}
function melhorTrechoDist(S_, L) {
  const T = S_.t,
    D = S_.d;
  let best = null,
    j = 0;
  for (let i = 0; i < D.length; i++) {
    while (j < D.length && D[j] - D[i] < L) j++;
    if (j >= D.length) break;
    const dd = D[j] - D[i];
    const seg = ((T[j] - T[i]) * L) / dd;
    if (!best || seg < best.seg) best = { seg, i, j };
  }
  return best;
}
function fcMediaEntre(S_, t0, t1) {
  const T = S_.t,
    F = S_.fc;
  let soma = 0,
    peso = 0;
  for (let k = 1; k < T.length; k++) {
    if (T[k] <= t0 || T[k - 1] >= t1 || !F[k]) continue;
    const dt = Math.min(T[k], t1) - Math.max(T[k - 1], t0);
    if (dt > 0) {
      soma += F[k] * dt;
      peso += dt;
    }
  }
  return peso ? soma / peso : null;
}
// faixa de pace [rápido, lento] em s/km a partir de % de uma velocidade de referência (m/s)
const faixaPorVel = (v, a, b) => [Math.round(1000 / (v * b)), Math.round(1000 / (v * a))];
// paces por % do pace de limiar (Friel): maior % = mais lento
const faixaPorLimiar = (pl, rapido, lento) => [Math.round(pl * rapido), Math.round(pl * lento)];
function calcularTeste(tipo, c) {
  const S_ = c.analise && c.analise.serie;
  const temS = S_ && S_.t && S_.d && S_.t.length > 20;
  const hoje = isoDia(c.data);
  if (tipo === 't30') {
    if (!temS) return null;
    const w = melhorJanelaTempo(S_, 1800);
    if (!w || w.v < 1.5) return null;
    const pl = 1000 / w.v,
      t0 = S_.t[w.i],
      t1 = S_.t[w.j];
    const lthr = S_.fc ? Math.round(fcMediaEntre(S_, t0 + 600, t1) || 0) || null : null;
    const paces = {
      rec: faixaPorLimiar(pl, 1.29, 1.4),
      leve: faixaPorLimiar(pl, 1.14, 1.29),
      maratona: faixaPorLimiar(pl, 1.06, 1.13),
      limiar: faixaPorLimiar(pl, 0.99, 1.05),
      intervalado: faixaPorLimiar(pl, 0.9, 0.96),
      tiros: faixaPorLimiar(pl, 0.82, 0.89),
    };
    return {
      zonas_auto: {
        tipo,
        data: hoje,
        corrida_id: c.id,
        paces,
        pace_limiar: Math.round(pl),
        resumo: `limiar ${fmtPace(pl)}${lthr ? ` · FC de limiar ${lthr} bpm` : ''}`,
      },
      ...(lthr && lthr > 100 && lthr < 215 ? { lthr } : {}),
      teste_km: +(w.v * 1.8).toFixed(2),
      teste_seg: 1800,
      teste_data: hoje,
    }; // os 30 min também atualizam o VDOT e as previsões
  }
  if (tipo === 'vam') {
    // velocidade do último estágio completo (2 min) = melhor média de 2 min
    const vMan = c._vam ? c._vam / 3.6 : null;
    const w = vMan ? { v: vMan } : temS ? melhorJanelaTempo(S_, 120) : null;
    if (!w || w.v < 2) return null;
    const kmh = w.v * 3.6;
    const paces = {
      rec: faixaPorVel(w.v, 0.5, 0.6),
      leve: faixaPorVel(w.v, 0.6, 0.7),
      maratona: faixaPorVel(w.v, 0.75, 0.82),
      limiar: faixaPorVel(w.v, 0.83, 0.88),
      intervalado: faixaPorVel(w.v, 0.95, 1.0),
      tiros: faixaPorVel(w.v, 1.05, 1.15),
    };
    return {
      zonas_auto: {
        tipo,
        data: hoje,
        corrida_id: c.id || null,
        paces,
        vam: +kmh.toFixed(1),
        vo2: +(3.5 * kmh).toFixed(1),
        resumo: `VAM ${f1(kmh)} km/h · VO₂máx estimado ${f1(3.5 * kmh)}`,
      },
    };
  }
  if (tipo === 'vc') {
    const t1 = c._t1 || (temS ? (melhorTrechoDist(S_, 1200) || {}).seg : null),
      t2 = c._t2 || (temS ? (melhorTrechoDist(S_, 3600) || {}).seg : null);
    if (!t1 || !t2 || t2 <= t1) return null;
    const vc = 2400 / (t2 - t1);
    if (vc < 2 || vc > 7) return null;
    const dl = Math.round(1200 - vc * t1);
    const paces = {
      rec: faixaPorVel(vc, 0.6, 0.7),
      leve: faixaPorVel(vc, 0.7, 0.8),
      maratona: faixaPorVel(vc, 0.82, 0.88),
      limiar: faixaPorVel(vc, 0.9, 0.97),
      intervalado: faixaPorVel(vc, 1.0, 1.06),
      tiros: faixaPorVel(vc, 1.1, 1.2),
    };
    return {
      zonas_auto: {
        tipo,
        data: hoje,
        corrida_id: c.id || null,
        paces,
        vc: +vc.toFixed(2),
        dlinha: dl,
        resumo: `VC ${f1(vc * 3.6)} km/h (${fmtPace(1000 / vc)})${dl > 0 ? ` · D' ${dl} m` : ''}`,
      },
      teste_km: 3.6,
      teste_seg: Math.round(t2),
      teste_data: hoje,
    };
  }
  if (tipo === 'cooper' || tipo === 't2400' || tipo === 't10k' || tipo === 't5k' || tipo === 't3k') {
    let km, seg;
    if (tipo === 'cooper') {
      const w = temS ? melhorJanelaTempo(S_, 720) : null;
      const dist = w
        ? w.v * 720
        : c.duracao_s >= 690 && c.duracao_s <= 760
          ? (c.distancia_m * 720) / c.duracao_s
          : null;
      if (!dist) return null;
      km = +(dist / 1000).toFixed(2);
      seg = 720;
    } else {
      const L = { t2400: 2400, t5k: 5000, t3k: 3000 }[tipo] || 10000;
      const b = temS ? melhorTrechoDist(S_, L) : null;
      seg = b
        ? Math.round(b.seg)
        : c.distancia_m >= L * 0.99 && c.distancia_m <= L * 1.05
          ? Math.round((c.duracao_s * L) / c.distancia_m)
          : null;
      if (!seg) return null;
      km = L / 1000;
    }
    if (seg / km < 150) return null;
    return { teste_km: km, teste_seg: seg, teste_data: hoje };
  }
  if (tipo === 'fcmax') {
    const F = (S_ && S_.fc) || [];
    if (F.length < 20) return null;
    const sm = F.map((_, k) => {
      const v = F.slice(Math.max(0, k - 2), k + 3).filter(Boolean);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    });
    let mx = Math.round(Math.max(...sm));
    // a série é resumida (média de trechos), então o pico dela fica alguns bpm abaixo do real; o pico gravado pelo
    // relógio vale quando está até 6 bpm acima (mais que isso costuma ser falha do sensor)
    if (c.fc_max && c.fc_max > mx && c.fc_max - mx <= 6) mx = Math.round(c.fc_max);
    if (mx < 140 || mx > 225) return null;
    return { fc_max: mx };
  }
  return null;
}
// procura testes da planilha já corridos e ainda não usados, calcula e aplica no perfil
async function processarTestes(m) {
  const alunoId = m.user_id,
    feitos = new Set((m.corrida || {}).testes_proc || []);
  const { data: pl } = await sb
    .from('nx_plano_corrida')
    .select('id,titulo,tipo,data')
    .eq('aluno_id', alunoId)
    .eq('tipo', 'teste')
    .gte('data', isoDia(Date.now() - 45 * 864e5));
  const testes = (pl || []).map((p) => ({ p, tipo: tipoDoTeste(p) })).filter((x) => x.tipo);
  if (!testes.length) return [];
  const { data: cs } = await sb
    .from('nx_corridas')
    .select('id,data,distancia_m,duracao_s,fc_max,plano_id,analise')
    .in(
      'plano_id',
      testes.map((x) => x.p.id),
    );
  const novos = (cs || []).filter((c) => !feitos.has(c.id)).sort((a, b) => (a.data < b.data ? -1 : 1));
  const aplicados = [];
  for (const c of novos) {
    const t = testes.find((x) => x.p.id === c.plano_id);
    const r = calcularTeste(t.tipo, c);
    feitos.add(c.id);
    const dados = { ...(r || {}), testes_proc: [...feitos].slice(-30) };
    const { data: nova, error } = await sb.rpc('nx_aplicar_teste', { p_aluno: alunoId, p_dados: dados });
    if (error) {
      console.error(error);
      continue;
    }
    if (nova) m.corrida = nova;
    if (r) aplicados.push({ tipo: t.tipo, r });
  }
  if (alunoId === S.user.id && !S.staff) S.me.corrida = m.corrida;
  return aplicados;
}
function formTesteCampo(m, onSalvo) {
  openSheet(
    `<p class="eyebrow">Teste de campo</p><div class="h2" style="margin-top:4px">${esc(firstName(m.nome))}</div>
    <p class="small muted" style="margin-top:6px">Lance o resultado de um teste feito sem relógio ou na esteira. As zonas do aluno se atualizam na hora.</p>
    <div class="chips" id="tc-tipo" style="margin-top:12px"><button type="button" class="chip on" data-t="vam">VAM</button><button type="button" class="chip" data-t="vc">Velocidade crítica</button><button type="button" class="chip" data-t="t30">30 min (Friel)</button></div>
    <form id="f-tc" style="margin-top:12px"><div id="tc-campos"></div><label class="field"><span>Data do teste</span><input class="input" type="date" name="data" value="${hojeISO()}"></label><p class="small" id="tc-prev" style="margin:-4px 0 12px;color:var(--acc)"></p><button class="btn block">Aplicar nas zonas</button></form>`,
    (r) => {
      let tipo = 'vam';
      const f = r.querySelector('#f-tc'),
        cp = r.querySelector('#tc-campos');
      const CAMPOS = {
        vam: '<label class="field"><span>Velocidade do último estágio completo (km/h)</span><input class="input" name="vam" data-mask="dec" data-int="2" data-casas="1" inputmode="decimal" placeholder="Ex.: 16,5"></label>',
        vc: '<div class="grid2"><label class="field"><span>Tempo dos 1.200 m</span><input class="input" name="t1" data-mask="tempo" inputmode="numeric" placeholder="4:10"></label><label class="field"><span>Tempo dos 3.600 m</span><input class="input" name="t2" data-mask="tempo" inputmode="numeric" placeholder="14:05"></label></div>',
        t30: '<div class="grid2"><label class="field"><span>Distância em 30 min (km)</span><input class="input" name="km30" data-mask="dec" data-int="2" inputmode="decimal" placeholder="Ex.: 6,8"></label><label class="field"><span>FC média dos últimos 20 min</span><input class="input" name="fc30" data-mask="num" inputmode="numeric" placeholder="Ex.: 168"></label></div>',
      };
      const montar = () => {
        cp.innerHTML = CAMPOS[tipo];
        aplicarMascaras(f);
        prev();
      };
      const calc = () => {
        const base = { id: null, data: f.data.value || hojeISO(), analise: null };
        if (tipo === 'vam') return calcularTeste('vam', { ...base, _vam: num(f.vam.value) });
        if (tipo === 'vc')
          return calcularTeste('vc', { ...base, _t1: lerTempo(f.t1.value), _t2: lerTempo(f.t2.value) });
        const km = num(f.km30.value),
          fc = Math.round(num(f.fc30.value) || 0);
        if (!km) return null;
        const v = (km * 1000) / 1800;
        return calcularTeste('t30', {
          ...base,
          analise: {
            serie: {
              t: Array.from({ length: 31 }, (_, i) => i * 60),
              d: Array.from({ length: 31 }, (_, i) => Math.round(i * 60 * v)),
              fc: Array(31).fill(fc || null),
            },
          },
        });
      };
      const prev = () => {
        const x = calc();
        r.querySelector('#tc-prev').textContent =
          x && x.zonas_auto
            ? x.zonas_auto.resumo +
              ` · leve ${faixaPace(x.zonas_auto.paces.leve)} · limiar ${faixaPace(x.zonas_auto.paces.limiar)}`
            : '';
      };
      r.querySelector('#tc-tipo').onclick = (e) => {
        const b = e.target.closest('[data-t]');
        if (!b) return;
        tipo = b.dataset.t;
        r.querySelectorAll('#tc-tipo .chip').forEach((x) => x.classList.toggle('on', x === b));
        montar();
      };
      f.oninput = prev;
      montar();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const x = calc();
        if (!x) return toast('Confira os valores do teste.', true);
        if (x.zonas_auto) x.zonas_auto.data = f.data.value || hojeISO();
        if (x.teste_data) x.teste_data = f.data.value || hojeISO();
        const { error } = await sb.rpc('nx_aplicar_teste', { p_aluno: m.user_id, p_dados: x });
        if (error) {
          console.error(error);
          return toast('Não foi possível aplicar.', true);
        }
        closeSheet();
        toast('Zonas atualizadas pelo teste.');
        onSalvo();
      };
    },
  );
}

function formPerfilCorrida(m, onSalvo) {
  const c = m.corrida || {};
  openSheet(
    `<p class="eyebrow">Perfil de corrida</p><div class="h2" style="margin-top:4px">${esc(firstName(m.nome))}</div>
    <p class="small muted" style="margin-top:6px">Use uma prova ou teste recente feito no limite (ideal: 3 a 10 km). O app calcula o VDOT, os paces de treino e as previsões de prova.</p>
    <form id="f-pc" style="margin-top:16px">
      <div class="grid2"><label class="field"><span>Distância do teste (km)</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" value="${esc(c.teste_km != null ? String(c.teste_km).replace('.', ',') : '')}" placeholder="5"></label><label class="field"><span>Tempo (h:mm:ss)</span><input class="input" name="tempo" data-mask="tempo" inputmode="numeric" value="${c.teste_seg ? fmtDurLongo(c.teste_seg) : ''}" placeholder="25:30"></label></div>
      <label class="field"><span>Data do teste</span><input class="input" type="date" name="data" value="${esc(c.teste_data || hojeISO())}"></label>
      <div class="grid2"><label class="field"><span>FC máxima medida (opcional)</span><input class="input" name="fcmax" data-mask="num" inputmode="numeric" value="${esc(c.fc_max ?? '')}" placeholder="se souber"></label><label class="field"><span>FC de repouso</span><input class="input" name="fcrep" data-mask="num" inputmode="numeric" value="${esc(c.fc_rep ?? '')}"></label></div>
      <p class="small" id="pc-prev" style="margin:-4px 0 12px;color:var(--acc)"></p>
      <button class="btn block" type="submit">Salvar perfil</button></form>`,
    (r) => {
      const f = r.querySelector('#f-pc');
      const prev = () => {
        const v = vdotDe(num(f.km.value) * 1000, lerTempo(f.tempo.value));
        r.querySelector('#pc-prev').textContent =
          v > 0 ? `VDOT ${f1(v)} · leve ${faixaPace(pacesDe(v).leve)} · limiar ${faixaPace(pacesDe(v).limiar)}` : '';
      };
      f.oninput = prev;
      prev();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const corrida = {
          teste_km: num(f.km.value),
          teste_seg: lerTempo(f.tempo.value),
          teste_data: f.data.value || null,
          fc_max: num(f.fcmax.value) ? Math.round(num(f.fcmax.value)) : null,
          fc_rep: num(f.fcrep.value) ? Math.round(num(f.fcrep.value)) : null,
        };
        const { error } = await sb
          .from('nx_membros')
          .update({ corrida: { ...(m.corrida || {}), ...corrida } })
          .eq('org_id', S.org.id)
          .eq('user_id', m.user_id);
        if (error) return toast('Não foi possível salvar.', true);
        closeSheet();
        toast('Perfil de corrida salvo!');
        onSalvo();
      };
    },
  );
}

/* ---------- Check-up do Corredor: avaliação de entrada e saída de qualquer ciclo (Pré-temporada, aluno novo, ciclo de prova…) ----------
   Corrida: 5 km no limite (VDOT de Daniels) ou 30 min (Friel: FC média dos últimos 20 min = FC de limiar).
   Força e prevenção: prancha frontal (McGill), ponte unilateral até a falha (Freckleton et al., Br J Sports Med 2014),
   agachamento unilateral no banco, elevação de panturrilha unilateral (Hébert-Losier et al., 2009) e salto horizontal parado.
   Diferença entre lados acima de ~15% merece atenção (Bishop et al., 2018). O resultado é a comparação entrada x saída.
   Presencial: o treinador aplica e lança. Online: o treinador envia, o aluno faz e responde no app, o treinador confere e confirma. */
const temporadaAtual = () => {
  const d = new Date();
  return d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear();
};
const CK_FORCA = [
  [
    'prancha',
    'Prancha frontal',
    's',
    false,
    'Antebraços e pontas dos pés no chão, corpo alinhado da cabeça aos calcanhares. Conte até perder o alinhamento (quadril cai ou sobe). Pare em 3 min.',
  ],
  [
    'ponte',
    'Ponte unilateral',
    'rep',
    true,
    'Deitado de costas, calcanhar sobre um banco ou cadeira de uns 60 cm, joelho levemente dobrado e a outra perna para cima. Suba o quadril e encoste de volta no chão, até não conseguir manter a técnica. Um lado de cada vez.',
  ],
  [
    'agach',
    'Agachamento unilateral no banco',
    'rep',
    true,
    'Banco ou cadeira na altura do joelho, braços cruzados no peito. Sente e levante apoiado em uma perna só, até a falha técnica (joelho vai para dentro, perde o equilíbrio ou precisa do outro pé).',
  ],
  [
    'pant',
    'Panturrilha unilateral',
    'rep',
    true,
    'Em pé num degrau, joelho estendido, mão na parede só para equilíbrio. Suba o máximo e desça até embaixo, em ritmo constante (metrônomo a 60 por minuto: sobe numa batida, desce na outra), até a falha.',
  ],
  [
    'salto',
    'Salto horizontal parado',
    'cm',
    false,
    'Pés paralelos atrás de uma linha, sem passo. Salte o mais longe possível e caia firme. Meça da linha até o calcanhar mais próximo. Vale o melhor de 3.',
  ],
];
const CK_ROT = { s: 's', rep: 'rep.', cm: 'cm' };
const CK_COMO = {
  '5k': 'Aquecimento de 10 a 15 min leve, com 3 a 4 acelerações curtas. Depois 5 km no ritmo mais forte que dá para manter até o fim, em pista ou percurso plano e conhecido. Anote o tempo final.',
  t30: 'Aquecimento de 10 a 15 min leve. Corra 30 min sozinho, no maior esforço que dá para sustentar o tempo todo (como uma prova). Aos 10 min, aperte a volta no relógio: a FC média dos últimos 20 min é a FC de limiar. Anote a distância total dos 30 min.',
};
const CK_NOME_FASE = { entrada: 'entrada', saida: 'saída' };
const ciclosPadrao = () => [
  `Pré-temporada ${temporadaAtual()}`,
  'Avaliação inicial',
  'Ciclo de prova',
  'Retorno de lesão',
];
const ckDica = (ciclo, f) =>
  /^pré-temporada/i.test(ciclo)
    ? f === 'entrada'
      ? 'Ideal na semana de 1º de janeiro.'
      : 'Ideal na semana 8, no fim do bloco.'
    : f === 'entrada'
      ? 'No início do ciclo.'
      : 'No fim do ciclo, repetindo os mesmos testes.';
const ckLink = (alunoId, f, ciclo) => `#/checkup/${alunoId}/${f}/${encodeURIComponent(ciclo)}`;
const ckDec = (x) => {
  try {
    return decodeURIComponent(x || '');
  } catch {
    return x || '';
  }
};
// ciclo escolhido fica lembrado no aparelho (a lista e a ficha abrem no mesmo)
const ckCicloSalvo = () => store.get('nx-ck-ciclo', '') || `Pré-temporada ${temporadaAtual()}`;
// resultado do teste de corrida: VDOT, previsões, pace e FC de limiar
function ckCorrida(c) {
  if (!c || !c.tipo) return null;
  if (c.tipo === '5k') {
    if (!c.seg || c.seg < 600 || c.seg > 4500) return null;
    const vdot = vdotDe(5000, c.seg);
    if (!(vdot > 15 && vdot < 90)) return null;
    return { vdot, paces: pacesDe(vdot), teste: { teste_km: 5, teste_seg: Math.round(c.seg) } };
  }
  if (c.tipo === 't30') {
    if (!c.km || c.km < 2 || c.km > 12) return null;
    const v = (c.km * 1000) / 1800;
    const x = calcularTeste('t30', {
      id: null,
      data: hojeISO(),
      analise: {
        serie: {
          t: Array.from({ length: 31 }, (_, i) => i * 60),
          d: Array.from({ length: 31 }, (_, i) => Math.round(i * 60 * v)),
          fc: Array(31).fill(c.fc || null),
        },
      },
    });
    if (!x) return null;
    const vdot = vdotDe(x.teste_km * 1000, 1800);
    return { vdot, paces: x.zonas_auto.paces, plim: x.zonas_auto.pace_limiar, lthr: x.lthr || null, teste: x };
  }
  return null;
}
const ckAssim = (d, e) => (d > 0 && e > 0 ? Math.round((Math.abs(d - e) / Math.max(d, e)) * 100) : null);
async function viewCheckup(b, c, d) {
  if (!S.staff) return b === 'responder' && c ? ckResponder(c) : ckDetalhe(S.user.id);
  if (!b) return ckLista();
  if (c === 'entrada' || c === 'saida') return ckForm(b, c, ckDec(d) || ckCicloSalvo());
  return ckDetalhe(b);
}
function ckNovoCiclo(onOk) {
  openSheet(
    `<p class="eyebrow">Check-up do Corredor</p><div class="h2" style="margin-top:4px">Novo ciclo de avaliação</div>
    <p class="small muted" style="margin-top:6px">Dê um nome que vocês reconheçam depois. Cada aluno pode ter uma entrada e uma saída em cada ciclo.</p>
    <form id="f-nc" style="margin-top:14px"><label class="field"><span>Nome do ciclo</span><input class="input" name="n" maxlength="60" required placeholder="Ex.: Ciclo Meia de Junho 2027"></label>
    <div class="chips wrap" id="nc-sug" style="margin:-4px 0 14px">${ciclosPadrao()
      .map((x) => `<button type="button" class="chip" data-n="${esc(x)}">${esc(x)}</button>`)
      .join('')}</div>
    <button class="btn block">Criar ciclo</button></form>`,
    (r) => {
      const f = r.querySelector('#f-nc');
      r.querySelector('#nc-sug').onclick = (e) => {
        const x = e.target.closest('[data-n]');
        if (x) {
          f.n.value = x.dataset.n;
          f.n.focus();
        }
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const n = f.n.value.trim().replace(/\s+/g, ' ');
        if (n.length < 2) return toast('Escreva um nome com pelo menos 2 letras.', true);
        const ex = store.get('nx-ck-extras', []);
        if (!ex.includes(n)) store.set('nx-ck-extras', [n, ...ex].slice(0, 20));
        store.set('nx-ck-ciclo', n);
        closeSheet();
        onOk(n);
      };
    },
  );
}
async function ckLista() {
  loading();
  const [ms, rs] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,modalidades')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .eq('ativo', true)
      .order('nome')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_checkups')
      .select('aluno_id,fase,data,ciclo,status,respondido_em,criado_em')
      .eq('org_id', S.org.id)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const alunos = ms.filter((m) => ehMeuAluno(m) && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const ciclos = [
    ...new Set([
      ...rs.sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1)).map((r) => r.ciclo),
      ...store.get('nx-ck-extras', []),
      `Pré-temporada ${temporadaAtual()}`,
    ]),
  ];
  const st = { c: ciclos.includes(ckCicloSalvo()) ? ckCicloSalvo() : ciclos[0], f: 'todos' };
  const FILT = [
    ['todos', 'Todos'],
    ['conferir', 'Para conferir'],
    ['entrada', 'Falta entrada'],
    ['saida', 'Falta saída'],
    ['ok', 'Completos'],
  ];
  const desenha = () => {
    const doC = rs.filter((r) => r.ciclo === st.c),
      fase = (id, f) => doC.find((r) => r.aluno_id === id && r.fase === f);
    const ok = (r) => r && r.status === 'confirmado';
    const nE = alunos.filter((m) => ok(fase(m.user_id, 'entrada'))).length,
      nS = alunos.filter((m) => ok(fase(m.user_id, 'saida'))).length;
    const nConf = alunos.filter((m) =>
      ['entrada', 'saida'].some((f) => (fase(m.user_id, f) || {}).status === 'respondido'),
    ).length;
    const L = alunos.filter((m) => {
      const e = fase(m.user_id, 'entrada'),
        s = fase(m.user_id, 'saida');
      return (
        st.f === 'todos' ||
        (st.f === 'conferir' && [e, s].some((x) => x && x.status === 'respondido')) ||
        (st.f === 'entrada' && !ok(e)) ||
        (st.f === 'saida' && ok(e) && !ok(s)) ||
        (st.f === 'ok' && ok(e) && ok(s))
      );
    });
    const tag = (r, nm) =>
      !r
        ? `<span class="tag">Sem ${nm}</span>`
        : r.status === 'pedido'
          ? `<span class="tag warn">${nm[0].toUpperCase() + nm.slice(1)} enviada</span>`
          : r.status === 'respondido'
            ? `<span class="tag acc">${nm[0].toUpperCase() + nm.slice(1)}: conferir</span>`
            : `<span class="tag ok">${nm[0].toUpperCase() + nm.slice(1)} ${r.data ? fmtCurto(r.data + 'T12:00:00') : ''}</span>`;
    $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Avaliação de entrada e saída</p><h1 class="h1">Check-up do Corredor</h1>
      <p class="muted" style="margin-top:6px">Teste de corrida, frequência cardíaca e força no começo e no fim de um ciclo. Presencial, vocês aplicam e lançam. Online, vocês enviam os testes, o aluno faz e responde no app, e vocês conferem.</p>
      <p class="sec-lbl">Ciclo</p><div class="chips" id="ck-c">${ciclos.map((x) => `<button type="button" class="chip ${x === st.c ? 'on' : ''}" data-c="${esc(x)}">${esc(x)}</button>`).join('')}<button type="button" class="chip" id="ck-novo">${I.plus} Novo ciclo</button></div>
      <div class="card" style="margin-top:12px"><div class="ck-res"><div><b>${nE}<small> de ${alunos.length}</small></b><span>Entradas feitas</span></div><div><b>${nS}<small> de ${alunos.length}</small></b><span>Saídas feitas</span></div></div>${nConf ? `<p class="small" style="margin-top:10px;text-align:center;color:var(--acc)">${nConf} aluno${nConf > 1 ? 's' : ''} já ${nConf > 1 ? 'responderam' : 'respondeu'}: confira e confirme.</p>` : ''}</div>
      <div class="chips" id="ck-f" style="margin-top:14px">${FILT.map(([k, l]) => `<button type="button" class="chip ${k === st.f ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="stack" style="margin-top:12px">${L.length ? L.map((m) => `<a class="list-item" href="#/checkup/${m.user_id}" style="color:inherit">${avAluno(m, 'sm')}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap">${tag(fase(m.user_id, 'entrada'), 'entrada')}${tag(fase(m.user_id, 'saida'), 'saída')}</div></div>${I.chev}</a>`).join('') : '<div class="empty"><div class="h3">Ninguém nesta lista</div><p class="small">Troque o filtro acima.</p></div>'}</div>`;
    document.getElementById('ck-c').onclick = (e) => {
      if (e.target.closest('#ck-novo'))
        return ckNovoCiclo((n) => {
          if (!ciclos.includes(n)) ciclos.unshift(n);
          st.c = n;
          desenha();
        });
      const x = e.target.closest('[data-c]');
      if (!x) return;
      st.c = x.dataset.c;
      store.set('nx-ck-ciclo', st.c);
      desenha();
    };
    document.getElementById('ck-f').onclick = (e) => {
      const x = e.target.closest('[data-f]');
      if (!x) return;
      st.f = x.dataset.f;
      desenha();
    };
  };
  desenha();
}
async function ckDetalhe(alunoId) {
  loading();
  const [rsT, m] = await Promise.all([
    sb
      .from('nx_checkups')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('criado_em', { ascending: false })
      .then(
        (r) => r.data || [],
        () => [],
      ),
    S.staff
      ? sb
          .from('nx_membros')
          .select('user_id,nome,foto_url,org_id')
          .eq('org_id', S.org.id)
          .eq('user_id', alunoId)
          .maybeSingle()
          .then((r) => r.data || { nome: 'Aluno' })
      : Promise.resolve(S.me),
  ]);
  const pend = S.staff ? [] : rsT.filter((r) => r.status === 'pedido');
  const rs = rsT; // o aluno vê na comparação só o que o treinador confirmou
  const ok = (r) => r && r.status === 'confirmado';
  const ciclos = [...new Set([...rs.map((r) => r.ciclo), ...(S.staff ? [ckCicloSalvo()] : [])])];
  const st = {
    c: S.staff ? (ciclos.includes(ckCicloSalvo()) ? ckCicloSalvo() : ciclos[0]) : (rs.find(ok) || rs[0] || {}).ciclo,
  };
  const voltar = S.staff ? '#/checkup' : '#/historico/avaliacoes';
  const desenha = () => {
    const rE = rs.find((r) => r.ciclo === st.c && r.fase === 'entrada'),
      rS = rs.find((r) => r.ciclo === st.c && r.fase === 'saida');
    const E = ok(rE) ? rE : null,
      Sd = ok(rS) ? rS : null;
    const cE = E && ckCorrida(E.corrida),
      cS = Sd && ckCorrida(Sd.corrida);
    // linhas da comparação: [rótulo, valor entrada, valor saída, formatador, sentido (+1 maior é melhor, -1 menor é melhor, 0 neutro)]
    const L = [];
    const tempo = (v) => fmtDurLongo(v),
      pace = (v) => fmtPace(v);
    if (cE || cS) {
      L.push(['sec', 'Corrida']);
      L.push(['VDOT', cE && cE.vdot, cS && cS.vdot, (v) => f1(v), 1]);
      L.push(['Previsão 5 km', cE && tempoPorVdot(cE.vdot, 5000), cS && tempoPorVdot(cS.vdot, 5000), tempo, -1]);
      L.push(['Previsão 10 km', cE && tempoPorVdot(cE.vdot, 10000), cS && tempoPorVdot(cS.vdot, 10000), tempo, -1]);
      L.push([
        'Previsão meia maratona',
        cE && tempoPorVdot(cE.vdot, 21097),
        cS && tempoPorVdot(cS.vdot, 21097),
        tempo,
        -1,
      ]);
      if ((cE && cE.plim) || (cS && cS.plim)) L.push(['Pace de limiar', cE && cE.plim, cS && cS.plim, pace, -1]);
      if ((cE && cE.lthr) || (cS && cS.lthr))
        L.push(['FC de limiar', cE && cE.lthr, cS && cS.lthr, (v) => v + ' bpm', 0]);
    }
    if ((E && (E.fc_rep || E.fc_max)) || (Sd && (Sd.fc_rep || Sd.fc_max))) {
      L.push(['sec', 'Frequência cardíaca']);
      L.push(['FC de repouso', E && E.fc_rep, Sd && Sd.fc_rep, (v) => v + ' bpm', -1]);
      if ((E && E.fc_max) || (Sd && Sd.fc_max))
        L.push(['FC máxima', E && E.fc_max, Sd && Sd.fc_max, (v) => v + ' bpm', 0]);
    }
    const fE = (E && E.forca) || {},
      fS = (Sd && Sd.forca) || {};
    if (Object.keys(fE).length || Object.keys(fS).length) {
      L.push(['sec', 'Força e prevenção']);
      CK_FORCA.forEach(([k, n, u, bi]) => {
        const fmt = (v) => `${v} ${CK_ROT[u]}`;
        if (bi) {
          if ([fE[k + '_d'], fS[k + '_d'], fE[k + '_e'], fS[k + '_e']].some((x) => x != null)) L.push(['sub', n]);
          L.push(['Direita', fE[k + '_d'], fS[k + '_d'], fmt, 1]);
          L.push(['Esquerda', fE[k + '_e'], fS[k + '_e'], fmt, 1]);
        } else L.push([n, fE[k], fS[k], fmt, 1]);
      });
    }
    if ((E && E.peso) || (Sd && Sd.peso)) {
      L.push(['sec', 'Corpo']);
      L.push(['Peso', E && E.peso, Sd && Sd.peso, (v) => f1(v) + ' kg', 0]);
    }
    const dif = (a, b, fmt, sent, rot) => {
      if (a == null || b == null) return '';
      const d = b - a;
      if (Math.abs(d) < 1e-9) return '<span class="ck-d">igual</span>';
      const melhor = sent === 0 ? null : d > 0 === sent > 0;
      const ad = Math.abs(d),
        txt =
          (d > 0 ? '+' : '−') +
          (rot === 'VDOT'
            ? f1(ad)
            : fmt === tempo || fmt === pace
              ? fmtDurLongo(ad)
              : fmt(Number.isInteger(ad) ? ad : +ad.toFixed(1)).replace(' rep.', ''));
      return `<span class="ck-d ${melhor == null ? '' : melhor ? 'ok' : 'pior'}">${txt}</span>`;
    };
    const linhas = L.filter((l) => l[0] === 'sec' || l[0] === 'sub' || l[1] != null || l[2] != null);
    const tabela = linhas.length
      ? `<div class="card ck-tab"><div class="ck-row ck-h"><span></span><span>Entrada</span><span>Saída</span><span></span></div>${linhas.map((l) => (l[0] === 'sec' ? `<div class="ck-sec">${l[1]}</div>` : l[0] === 'sub' ? `<div class="ck-sub">${l[1]}</div>` : `<div class="ck-row"><span>${l[0]}</span><b>${l[1] != null ? l[3](l[1]) : '–'}</b><b>${l[2] != null ? l[3](l[2]) : '–'}</b><span>${dif(l[1], l[2], l[3], l[4], l[0])}</span></div>`)).join('')}</div>`
      : '';
    const ult = Sd || E,
      fu = (ult && ult.forca) || {};
    const assim = CK_FORCA.filter((x) => x[3])
      .map(([k, n]) => {
        const p = ckAssim(fu[k + '_d'], fu[k + '_e']);
        return p != null && p >= 15
          ? `${n}: o lado ${fu[k + '_d'] < fu[k + '_e'] ? 'direito' : 'esquerdo'} fez ${p}% a menos`
          : null;
      })
      .filter(Boolean);
    const cU = cS || cE;
    const ritmos =
      cU && cU.paces
        ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Ritmos de treino pelo teste ${Sd && cS ? 'de saída' : 'de entrada'}</span><div class="ck-rit">${[
            ['leve', 'Leve'],
            ['maratona', 'Moderado'],
            ['limiar', 'Limiar'],
            ['intervalado', 'Forte'],
          ]
            .filter(([k]) => cU.paces[k])
            .map(([k, n]) => `<div><span>${n}</span><b>${faixaPace(cU.paces[k])}</b></div>`)
            .join('')}</div></div>`
        : '';
    const faseCard = (r, f) => {
      const nm = f === 'entrada' ? 'Entrada' : 'Saída',
        lk = ckLink(alunoId, f, st.c);
      if (!r || (!S.staff && !ok(r)))
        return `<div class="card ck-fase vazia"><span class="eyebrow">${nm}</span><p class="small muted" style="margin-top:4px">${S.staff ? `Ainda não feita. ${ckDica(st.c, f)}` : 'Ainda não feita.'}</p>${S.staff ? `<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><a class="btn sm" href="${lk}">${I.plus} Registrar</a><button type="button" class="btn ghost sm" data-enviar="${f}">Enviar ao aluno</button></div>` : ''}</div>`;
      if (r.status === 'pedido')
        return `<div class="card ck-fase vazia"><span class="eyebrow">${nm}</span><div class="row" style="gap:6px;margin-top:6px"><span class="tag warn">Enviada ao aluno</span></div><p class="small muted" style="margin-top:6px">Esperando o aluno fazer os testes e responder no app.</p><div class="row" style="gap:12px;margin-top:10px;flex-wrap:wrap"><a class="btn ghost sm" href="${lk}">Preencher eu mesmo</a><button type="button" class="link-btn small" data-cancelar="${r.id}" style="color:var(--err)">Cancelar envio</button></div></div>`;
      if (r.status === 'respondido')
        return `<div class="card ck-fase ck-conf"><span class="eyebrow">${nm}</span><div class="row" style="gap:6px;margin-top:6px"><span class="tag acc">Aluno respondeu ${r.respondido_em ? quando(r.respondido_em) : ''}</span></div><p class="small muted" style="margin-top:6px">Confira os números (e os vídeos, se ele mandou) e confirme. Só depois disso entra na comparação.</p><a class="btn sm" href="${lk}" style="margin-top:10px">Conferir e confirmar</a></div>`;
      const cr = r.corrida || {};
      return `<div class="card ck-fase"><div class="row between" style="gap:8px"><span class="eyebrow">${nm}</span>${S.staff ? `<a class="link-btn small" href="${lk}">Editar</a>` : ''}</div><div class="h3" style="margin-top:2px">${r.data ? fmtDia(r.data) : ''}</div><p class="small muted" style="margin-top:4px">${cr.tipo === '5k' ? `5 km em ${fmtDurLongo(cr.seg)}` : cr.tipo === 't30' ? `30 min: ${f1(cr.km, 2)} km${cr.fc ? ` · FC ${cr.fc} bpm nos últimos 20 min` : ''}` : 'Sem teste de corrida'}${r.pedido ? ' · feita pelo aluno' : ''}</p>${r.observacoes ? `<p class="small" style="margin-top:6px">${esc(r.observacoes)}</p>` : ''}</div>`;
    };
    const resumo =
      E && Sd && cE && cS
        ? `<div class="card ck-dest"><span class="eyebrow">Resultado do ciclo</span><div class="h2" style="margin-top:4px">${cS.vdot > cE.vdot + 0.05 ? `5 km previsto ${fmtDurLongo(tempoPorVdot(cE.vdot, 5000) - tempoPorVdot(cS.vdot, 5000))} mais rápido` : cS.vdot < cE.vdot - 0.05 ? 'Desempenho de corrida abaixo da entrada' : 'Desempenho de corrida mantido'}</div><p class="small" style="margin-top:6px">VDOT de ${f1(cE.vdot)} para ${f1(cS.vdot)}.${E.corrida.tipo !== Sd.corrida.tipo ? ' Os testes foram diferentes na entrada e na saída: compare pelo VDOT e pelas previsões.' : ''}</p></div>`
        : '';
    const nada = !st.c || (!S.staff && !rs.some(ok));
    $app.innerHTML = `<a class="back" href="${voltar}">${I.back} ${S.staff ? 'Check-up do Corredor' : 'Avaliações'}</a>
      <p class="eyebrow">${esc(st.c || 'Avaliação de entrada e saída')}</p><h1 class="h1">Check-up do Corredor</h1>${S.staff ? `<p class="muted" style="margin-top:4px">${esc(m.nome || '')}</p>` : ''}
      ${pend.map((r) => `<a class="card ck-pend" href="#/checkup/responder/${r.id}" style="color:inherit;display:flex;gap:12px;align-items:center;margin-top:12px"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Seu treinador enviou testes para você fazer</b><div class="small muted">${esc(r.ciclo)} · ${CK_NOME_FASE[r.fase]}</div></div>${I.chev}</a>`).join('')}
      ${ciclos.length > 1 || S.staff ? `<div class="chips" id="ck-t" style="margin-top:12px">${ciclos.map((t) => `<button type="button" class="chip ${t === st.c ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}${S.staff ? `<button type="button" class="chip" id="ck-novo">${I.plus} Novo ciclo</button>` : ''}</div>` : ''}
      ${nada ? (S.staff ? '' : '<div class="empty" style="margin-top:12px"><div class="h3">Seu check-up ainda não foi feito</div><p class="small">O seu treinador faz a avaliação de entrada no começo do ciclo e a de saída no fim. Os resultados aparecem aqui.</p></div>') : ''}
      ${
        st.c && (S.staff || !nada)
          ? `<div class="grid2 ck-fases" style="margin-top:14px">${faseCard(rE, 'entrada')}${faseCard(rS, 'saida')}</div>${resumo}${tabela}
      ${assim.length ? `<div class="card ck-alerta"><b>Diferença entre os lados</b>${assim.map((a) => `<p class="small">${a}.</p>`).join('')}<p class="tiny dim" style="margin-top:6px">Diferenças acima de 15% merecem atenção no treino de força.</p></div>` : ''}${ritmos}`
          : ''
      }`;
    const ct = document.getElementById('ck-t');
    if (ct)
      ct.onclick = (e) => {
        if (e.target.closest('#ck-novo'))
          return ckNovoCiclo((n) => {
            if (!ciclos.includes(n)) ciclos.unshift(n);
            st.c = n;
            desenha();
          });
        const x = e.target.closest('[data-t]');
        if (!x) return;
        st.c = x.dataset.t;
        if (S.staff) store.set('nx-ck-ciclo', st.c);
        desenha();
      };
    $app.querySelectorAll('[data-enviar]').forEach(
      (x) =>
        (x.onclick = () =>
          ckEnviar(
            m,
            x.dataset.enviar,
            st.c,
            rs.find((r) => r.ciclo === st.c && r.fase === 'entrada'),
            () => ckDetalhe(alunoId),
          )),
    );
    $app.querySelectorAll('[data-cancelar]').forEach(
      (x) =>
        (x.onclick = async () => {
          if (!confirm('Cancelar o envio? O card some do app do aluno.')) return;
          const { error } = await sb
            .from('nx_checkups')
            .delete()
            .eq('id', x.dataset.cancelar)
            .neq('status', 'confirmado');
          if (error) return toast('Não foi possível cancelar.', true);
          toast('Envio cancelado.');
          ckDetalhe(alunoId);
        }),
    );
  };
  desenha();
}
// treinador escolhe os testes e envia; o aluno recebe na conversa e no card "A preencher"
function ckEnviar(m, fase, ciclo, entrada, depois) {
  const pe = (entrada && entrada.pedido) || null,
    ce = (entrada && entrada.corrida) || null;
  const tipo0 = (ce && ce.tipo) || (pe && pe.corrida) || '5k';
  const forca0 =
    fase === 'saida' && entrada
      ? CK_FORCA.filter(([k, , , bi]) =>
          pe && pe.forca
            ? pe.forca.includes(k)
            : entrada.forca && (bi ? entrada.forca[k + '_d'] != null : entrada.forca[k] != null),
        ).map((x) => x[0])
      : CK_FORCA.map((x) => x[0]);
  openSheet(
    `<p class="eyebrow">${esc(ciclo)} · ${CK_NOME_FASE[fase]}</p><div class="h2" style="margin-top:4px">Enviar testes para ${esc(firstName(m.nome))}</div>
    <p class="small muted" style="margin-top:6px">Ele recebe uma mensagem e um card em "A preencher", com o passo a passo de cada teste. Quando ele responder, vocês conferem e confirmam.</p>
    <form id="f-env" style="margin-top:14px">
      <p class="sec-lbl" style="margin-top:0">Corrida</p>
      <div class="chips wrap" id="env-c"><button type="button" class="chip ${tipo0 === '5k' ? 'on' : ''}" data-c="5k">5 km no limite</button><button type="button" class="chip ${tipo0 === 't30' ? 'on' : ''}" data-c="t30">30 min (Friel)</button><button type="button" class="chip" data-c="">Sem corrida</button></div>
      <p class="sec-lbl">Força e prevenção</p>
      <div class="stack" style="gap:6px">${CK_FORCA.map(([k, n]) => `<label class="ck-check"><input type="checkbox" name="f_${k}" ${forca0.includes(k) ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
      <p class="sec-lbl">Outros</p>
      <div class="stack" style="gap:6px"><label class="ck-check"><input type="checkbox" name="fcrep" checked><span>FC de repouso (ao acordar)</span></label><label class="ck-check"><input type="checkbox" name="peso" checked><span>Peso</span></label><label class="ck-check"><input type="checkbox" name="video" checked><span>Pedir vídeo dos testes de força na conversa</span></label></div>
      <label class="field" style="margin-top:12px"><span>Recado (opcional)</span><textarea class="input" name="recado" rows="2" placeholder="Ex.: faça a corrida no sábado de manhã, na mesma pista da entrada"></textarea></label>
      <button class="btn block" type="submit">Enviar ao aluno</button></form>`,
    (r) => {
      const f = r.querySelector('#f-env');
      let tipo = tipo0;
      r.querySelector('#env-c').onclick = (e) => {
        const x = e.target.closest('[data-c]');
        if (!x) return;
        tipo = x.dataset.c;
        r.querySelectorAll('#env-c .chip').forEach((y) => y.classList.toggle('on', y === x));
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const forca = CK_FORCA.filter(([k]) => f['f_' + k].checked).map((x) => x[0]);
        const pedido = {
          corrida: tipo || null,
          forca,
          fc_rep: f.fcrep.checked,
          peso: f.peso.checked,
          video: f.video.checked,
          recado: f.recado.value.trim() || null,
        };
        if (!pedido.corrida && !forca.length && !pedido.fc_rep && !pedido.peso)
          return toast('Escolha pelo menos um teste.', true);
        const b = f.querySelector('button[type=submit]');
        b.disabled = true;
        const { error } = await sb
          .from('nx_checkups')
          .upsert(
            {
              org_id: S.org.id,
              aluno_id: m.user_id,
              avaliador_id: S.user.id,
              ciclo,
              fase,
              status: 'pedido',
              pedido,
              data: null,
            },
            { onConflict: 'aluno_id,ciclo,fase' },
          );
        if (error) {
          console.error(error);
          b.disabled = false;
          return toast('Não foi possível enviar. Tente de novo.', true);
        }
        const texto = `Preparei o seu Check-up do Corredor (${ciclo} · ${CK_NOME_FASE[fase]}). Abra o app em Hoje, no card "A preencher", e siga o passo a passo de cada teste.${pedido.video && forca.length ? ' Se puder, grave os testes de força e me mande os vídeos aqui.' : ''}${pedido.recado ? ' ' + pedido.recado : ''}`;
        const { data: nm } = await sb
          .from('nx_mensagens')
          .insert({ org_id: S.org.id, aluno_id: m.user_id, autor_id: S.user.id, texto })
          .select('id')
          .single()
          .then(
            (x) => x,
            () => ({ data: null }),
          );
        if (nm) notificar('mensagem', nm.id);
        closeSheet();
        toast('Testes enviados ao aluno.');
        depois();
      };
    },
  );
}
// tela do aluno: faz os testes pedidos e responde
async function ckResponder(id) {
  loading();
  const { data: r } = await sb.from('nx_checkups').select('*').eq('id', id).maybeSingle();
  if (!r || r.aluno_id !== S.user.id) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Check-up não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  if (r.status === 'confirmado') {
    location.replace('#/checkup');
    return;
  }
  const p = r.pedido || {},
    ant = r.resposta || {},
    ca = ant.corrida || {},
    fa = ant.forca || {};
  const v = (x) => (x == null ? '' : String(x).replace('.', ','));
  const nm = CK_NOME_FASE[r.fase];
  const inp = (nome, rot, val, ph, mask = 'num') =>
    `<label class="field"><span>${rot}</span><input class="input" name="${nome}" data-mask="${mask}" inputmode="${mask === 'num' ? 'numeric' : 'decimal'}" value="${v(val)}" placeholder="${ph || ''}"></label>`;
  const forca = CK_FORCA.filter(([k]) => (p.forca || []).includes(k));
  $app.innerHTML = `<a class="back" href="#/">${I.back} Hoje</a><p class="eyebrow">${esc(r.ciclo)} · ${nm}</p><h1 class="h1">Check-up do Corredor</h1>
    <p class="muted" style="margin-top:6px">Seu treinador pediu estes testes. Faça com calma, podendo ser em dias diferentes, e anote os resultados aqui. Deixe em branco o que não conseguir fazer.</p>
    ${p.recado ? `<div class="card" style="margin-top:12px;border-color:rgba(70,214,255,.3)"><span class="eyebrow">Recado do treinador</span><p style="margin-top:6px">${esc(p.recado)}</p></div>` : ''}
    ${r.status === 'respondido' ? '<p class="small" style="margin-top:10px;color:var(--ok)">Você já respondeu. Pode corrigir e enviar de novo até o treinador conferir.</p>' : ''}
    <form id="f-resp" class="stack" style="margin-top:14px">
      ${
        p.corrida
          ? `<div class="card"><span class="eyebrow">Teste de corrida · ${p.corrida === '5k' ? '5 km no limite' : '30 min'}</span><p class="small" style="margin-top:8px">${CK_COMO[p.corrida]}</p>
        ${p.corrida === '5k' ? inp('seg', 'Tempo dos 5 km (mm:ss)', ca.seg ? fmtDurLongo(ca.seg) : '', 'Ex.: 24:30', 'tempo') : `<div class="grid2">${inp('km', 'Distância em 30 min (km)', ca.km, 'Ex.: 6,4', 'dec')}${inp('fc', 'FC média dos últimos 20 min', ca.fc, 'Ex.: 168')}</div>`}
        <p class="tiny dim">Se correu com o relógio conectado ao app, a corrida também chega sozinha para o treinador.</p></div>`
          : ''
      }
      ${p.fc_rep || p.peso ? `<div class="card"><span class="eyebrow">Repouso e peso</span><div class="grid2" style="margin-top:8px">${p.fc_rep ? inp('fc_rep', 'FC de repouso', ant.fc_rep, 'Ex.: 54') : ''}${p.peso ? inp('peso', 'Peso (kg)', ant.peso, 'Ex.: 68,5', 'dec') : ''}</div>${p.fc_rep ? '<p class="tiny dim">FC de repouso: ao acordar, ainda deitado, depois de 1 a 2 min parado (pelo relógio ou contando o pulso por 1 min).</p>' : ''}</div>` : ''}
      ${
        forca.length
          ? `<div class="card"><span class="eyebrow">Força e prevenção</span><p class="tiny dim" style="margin-top:4px">Aqueça 5 min antes. Faça na ordem, com 2 a 3 min de descanso entre os testes.${p.video ? ' Grave cada teste e mande os vídeos na conversa com o treinador.' : ''}</p>
        ${forca
          .map(
            ([
              k,
              n,
              u,
              bi,
              como,
            ]) => `<div class="ck-teste"><div class="row between" style="gap:8px;align-items:baseline"><b>${n}</b><span class="tiny dim">${u === 's' ? 'segundos' : u === 'cm' ? 'centímetros' : 'repetições'}</span></div><p class="small muted" style="margin-top:6px">${como}</p>
          ${bi ? `<div class="grid2">${inp(k + '_d', 'Perna direita', fa[k + '_d'])}${inp(k + '_e', 'Perna esquerda', fa[k + '_e'])}</div>` : inp(k, 'Resultado', fa[k])}</div>`,
          )
          .join('')}</div>`
          : ''
      }
      <div class="card"><label class="field" style="margin:0"><span>Comentário (opcional)</span><textarea class="input" name="obs" rows="2" placeholder="Como se sentiu, clima, alguma dor">${esc(ant.obs || '')}</textarea></label></div>
      <button class="btn block" type="submit">${I.check} Enviar ao treinador</button>
    </form>`;
  const f = document.getElementById('f-resp');
  aplicarMascaras(f);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const out = {};
    if (p.corrida === '5k' && f.seg && f.seg.value) {
      const seg = lerTempo(f.seg.value);
      if (!ckCorrida({ tipo: '5k', seg })) return toast('Confira o tempo dos 5 km (ex.: 24:30).', true);
      out.corrida = { tipo: '5k', seg };
    }
    if (p.corrida === 't30' && f.km && f.km.value) {
      const c = { tipo: 't30', km: num(f.km.value), fc: num(f.fc.value) ? Math.round(num(f.fc.value)) : null };
      if (!ckCorrida(c)) return toast('Confira a distância dos 30 min (ex.: 6,4).', true);
      out.corrida = c;
    }
    if (f.fc_rep && num(f.fc_rep.value) != null) {
      const x = Math.round(num(f.fc_rep.value));
      if (x < 25 || x > 120) return toast('A FC de repouso fica entre 25 e 120 bpm.', true);
      out.fc_rep = x;
    }
    if (f.peso && num(f.peso.value) != null) {
      const x = num(f.peso.value);
      if (x < 25 || x > 250) return toast('Confira o peso.', true);
      out.peso = x;
    }
    const fo = {};
    forca.forEach(([k, , , bi]) =>
      (bi ? [k + '_d', k + '_e'] : [k]).forEach((c) => {
        const x = num(f[c].value);
        if (x != null && x >= 0 && x < 1000) fo[c] = Math.round(x);
      }),
    );
    if (Object.keys(fo).length) out.forca = fo;
    if (f.obs.value.trim()) out.obs = f.obs.value.trim().slice(0, 500);
    if (!out.corrida && !out.forca && out.fc_rep == null && out.peso == null)
      return toast('Preencha pelo menos um resultado.', true);
    const b = f.querySelector('button[type=submit]');
    b.disabled = true;
    const { error } = await sb.rpc('nx_checkup_responder', { p_id: r.id, p_resposta: out });
    if (error) {
      console.error(error);
      b.disabled = false;
      return toast('Não foi possível enviar. Tente de novo.', true);
    }
    const { data: msg } = await sb
      .from('nx_mensagens')
      .insert({
        org_id: S.org.id,
        aluno_id: S.user.id,
        autor_id: S.user.id,
        texto: `Respondi o Check-up do Corredor (${r.ciclo} · ${nm}).`,
      })
      .select('id')
      .single()
      .then(
        (x) => x,
        () => ({ data: null }),
      );
    if (msg) notificar('mensagem', msg.id);
    toast('Enviado! Seu treinador vai conferir.');
    location.hash = '#/';
  };
}
async function ckForm(alunoId, fase, ciclo) {
  loading();
  const [m, rs] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,corrida,nascimento')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle()
      .then((r) => r.data),
    sb
      .from('nx_checkups')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('ciclo', ciclo)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  if (!m) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div><a class="btn sm" href="#/checkup" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const atual = rs.find((r) => r.fase === fase) || null,
    entR = fase === 'saida' ? rs.find((r) => r.fase === 'entrada') : null;
  const ent = entR && entR.status === 'confirmado' ? entR : null;
  // respostas do aluno (envio online) entram como ponto de partida para o treinador conferir
  const resp = atual && atual.status !== 'confirmado' ? atual.resposta || {} : {};
  const base =
    atual && atual.status === 'confirmado'
      ? atual
      : {
          data: hojeISO(),
          peso: resp.peso,
          fc_rep: resp.fc_rep,
          fc_max: null,
          corrida: resp.corrida || null,
          forca: resp.forca || null,
          observacoes: resp.obs ? `Aluno: ${resp.obs}` : '',
        };
  const cr = base.corrida || {},
    fo = base.forca || {},
    fe = (ent && ent.forca) || {};
  const st = {
    tipo:
      cr.tipo || (atual && atual.pedido && atual.pedido.corrida) || (ent && ent.corrida && ent.corrida.tipo) || '5k',
  };
  const v = (x) => (x == null ? '' : String(x).replace('.', ','));
  const ant = (x, u) =>
    ent && x != null ? `<small class="ck-ant">Entrada: ${String(x).replace('.', ',')}${u ? ' ' + u : ''}</small>` : '';
  const campoNum = (nome, rot, val, ph, mask = 'num', antV, u) =>
    `<label class="field"><span>${rot}</span><input class="input" name="${nome}" data-mask="${mask}" inputmode="${mask === 'num' ? 'numeric' : 'decimal'}" value="${v(val)}" placeholder="${ph || ''}">${ant(antV, u)}</label>`;
  const nm = CK_NOME_FASE[fase];
  $app.innerHTML = `<a class="back" href="#/checkup/${alunoId}">${I.back} Check-up do Corredor</a>
    <p class="eyebrow">${esc(ciclo)} · ${nm}</p><h1 class="h1">${esc(firstName(m.nome))}</h1>
    ${atual && atual.status === 'respondido' ? `<div class="card ck-conf" style="margin-top:12px"><b>Respostas enviadas pelo aluno ${atual.respondido_em ? quando(atual.respondido_em) : ''}</b><p class="small muted" style="margin-top:4px">Confira cada número (e os vídeos na conversa, se ele mandou). Ao salvar, a ${nm} fica confirmada e entra na comparação.</p></div>` : ''}
    ${fase === 'saida' && ent ? '<p class="small muted" style="margin-top:6px">Para a comparação valer, repita os mesmos testes da entrada, no mesmo lugar e em condições parecidas (horário, calçado, descanso).</p>' : ''}
    <form id="f-ck" class="stack" style="margin-top:14px">
      <div class="card"><span class="eyebrow">Dados do dia</span><div class="grid2" style="margin-top:8px"><label class="field"><span>Data</span><input class="input" type="date" name="data" value="${esc(base.data || hojeISO())}"></label>${campoNum('peso', 'Peso (kg)', base.peso, 'Ex.: 68,5', 'dec', ent && ent.peso, 'kg')}</div></div>
      <div class="card"><span class="eyebrow">Frequência cardíaca</span><div class="grid2" style="margin-top:8px">${campoNum('fc_rep', 'FC de repouso', base.fc_rep, 'Ex.: 54', 'num', ent && ent.fc_rep, 'bpm')}${campoNum('fc_max', 'FC máxima (se souber)', base.fc_max, 'medida em teste ou prova', 'num', ent && ent.fc_max, 'bpm')}</div>
        <p class="tiny dim">Repouso: ao acordar, ainda deitado, depois de 1 a 2 min parado. Máxima: só se foi medida num teste ou numa prova (não use fórmula).</p></div>
      <div class="card"><span class="eyebrow">Teste de corrida</span>
        <div class="chips" id="ck-tipo" style="margin-top:8px"><button type="button" class="chip ${st.tipo === '5k' ? 'on' : ''}" data-t="5k">5 km no limite</button><button type="button" class="chip ${st.tipo === 't30' ? 'on' : ''}" data-t="t30">30 min (Friel)</button></div>
        <div id="ck-campos" style="margin-top:10px"></div>
        <p class="small" id="ck-prev" style="color:var(--acc);margin-top:-4px"></p>
        <details class="ck-como"><summary>Como fazer</summary><p class="small" id="ck-como-t"></p></details></div>
      <div class="card"><span class="eyebrow">Força e prevenção</span><p class="tiny dim" style="margin-top:4px">Faça na mesma ordem, com 2 a 3 min de descanso entre os testes. Deixe em branco o que não fizer.</p>
        ${CK_FORCA.map(
          ([
            k,
            n,
            u,
            bi,
            como,
          ]) => `<div class="ck-teste"><div class="row between" style="gap:8px;align-items:baseline"><b>${n}</b><span class="tiny dim">${u === 's' ? 'segundos' : u === 'cm' ? 'centímetros' : 'repetições'}</span></div>
          ${bi ? `<div class="grid2">${campoNum(k + '_d', 'Direita', fo[k + '_d'], '', 'num', fe[k + '_d'])}${campoNum(k + '_e', 'Esquerda', fo[k + '_e'], '', 'num', fe[k + '_e'])}</div>` : campoNum(k, 'Resultado', fo[k], '', 'num', fe[k])}
          <details class="ck-como"><summary>Como fazer</summary><p class="small">${como}</p></details></div>`,
        ).join('')}</div>
      <div class="card"><label class="field" style="margin:0"><span>Observações</span><textarea class="input" name="obs" rows="3" placeholder="Clima, dor, sono, presencial ou online, algo que influenciou o teste">${esc(base.observacoes || '')}</textarea></label></div>
      <label class="ck-check"><input type="checkbox" name="aplicar" checked><span>Atualizar o perfil de corrida do aluno com este teste (VDOT, ritmos de treino, previsões e FC)</span></label>
      <button class="btn block" type="submit">${I.check} ${atual && atual.status === 'respondido' ? 'Confirmar' : 'Salvar'} ${nm}</button>
      ${atual ? `<button type="button" class="link-btn small" id="ck-apagar" style="color:var(--err);margin:4px auto 0">Apagar esta ${nm}</button>` : ''}
    </form>`;
  const f = document.getElementById('f-ck'),
    cp = document.getElementById('ck-campos');
  const crE = (ent && ent.corrida) || {};
  const montar = () => {
    cp.innerHTML =
      st.tipo === '5k'
        ? `<label class="field"><span>Tempo dos 5 km (mm:ss)</span><input class="input" name="seg" data-mask="tempo" inputmode="numeric" value="${cr.tipo === '5k' && cr.seg ? fmtDurLongo(cr.seg) : ''}" placeholder="Ex.: 24:30">${crE.tipo === '5k' && crE.seg ? `<small class="ck-ant">Entrada: ${fmtDurLongo(crE.seg)}</small>` : ''}</label>`
        : `<div class="grid2"><label class="field"><span>Distância em 30 min (km)</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" value="${cr.tipo === 't30' ? v(cr.km) : ''}" placeholder="Ex.: 6,4">${crE.tipo === 't30' && crE.km ? `<small class="ck-ant">Entrada: ${v(crE.km)} km</small>` : ''}</label><label class="field"><span>FC média dos últimos 20 min</span><input class="input" name="fc" data-mask="num" inputmode="numeric" value="${cr.tipo === 't30' ? v(cr.fc) : ''}" placeholder="Ex.: 168">${crE.tipo === 't30' && crE.fc ? `<small class="ck-ant">Entrada: ${crE.fc} bpm</small>` : ''}</label></div>`;
    document.getElementById('ck-como-t').textContent = CK_COMO[st.tipo];
    aplicarMascaras(f);
    prev();
  };
  const lerCorrida = () =>
    st.tipo === '5k'
      ? { tipo: '5k', seg: lerTempo(f.seg.value) }
      : { tipo: 't30', km: num(f.km.value), fc: num(f.fc.value) ? Math.round(num(f.fc.value)) : null };
  const prev = () => {
    const r = ckCorrida(lerCorrida());
    document.getElementById('ck-prev').textContent = r
      ? `VDOT ${f1(r.vdot)} · 5 km previsto ${fmtDurLongo(tempoPorVdot(r.vdot, 5000))} · 10 km ${fmtDurLongo(tempoPorVdot(r.vdot, 10000))}${r.lthr ? ` · FC de limiar ${r.lthr} bpm` : ''}`
      : '';
  };
  document.getElementById('ck-tipo').onclick = (e) => {
    const x = e.target.closest('[data-t]');
    if (!x) return;
    st.tipo = x.dataset.t;
    document.querySelectorAll('#ck-tipo .chip').forEach((y) => y.classList.toggle('on', y === x));
    montar();
  };
  f.oninput = (e) => {
    if (e.target.closest('#ck-campos')) prev();
  };
  montar();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector('button[type=submit]');
    b.disabled = true;
    const corrida = lerCorrida(),
      rc = ckCorrida(corrida);
    const temCorrida = st.tipo === '5k' ? !!corrida.seg : !!corrida.km;
    if (temCorrida && !rc) {
      b.disabled = false;
      return toast(
        st.tipo === '5k' ? 'Confira o tempo dos 5 km (ex.: 24:30).' : 'Confira a distância dos 30 min (ex.: 6,4).',
        true,
      );
    }
    const forca = {};
    CK_FORCA.forEach(([k, , , bi]) => {
      (bi ? [k + '_d', k + '_e'] : [k]).forEach((c) => {
        const x = num(f[c].value);
        if (x != null && x >= 0) forca[c] = Math.round(x);
      });
    });
    const fcRep = num(f.fc_rep.value),
      fcMax = num(f.fc_max.value);
    if (fcRep != null && (fcRep < 25 || fcRep > 120)) {
      b.disabled = false;
      return toast('A FC de repouso fica entre 25 e 120 bpm.', true);
    }
    if (fcMax != null && (fcMax < 120 || fcMax > 230)) {
      b.disabled = false;
      return toast('A FC máxima fica entre 120 e 230 bpm.', true);
    }
    const row = {
      org_id: S.org.id,
      aluno_id: alunoId,
      avaliador_id: S.user.id,
      ciclo,
      fase,
      status: 'confirmado',
      data: f.data.value || hojeISO(),
      peso: num(f.peso.value),
      fc_rep: fcRep != null ? Math.round(fcRep) : null,
      fc_max: fcMax != null ? Math.round(fcMax) : null,
      corrida: temCorrida ? corrida : null,
      forca: Object.keys(forca).length ? forca : null,
      observacoes: f.obs.value.trim() || null,
    };
    const { error } = await sb.from('nx_checkups').upsert(row, { onConflict: 'aluno_id,ciclo,fase' });
    if (error) {
      console.error(error);
      b.disabled = false;
      return toast('Não foi possível salvar. Tente de novo.', true);
    }
    if (f.aplicar.checked && (rc || row.fc_rep || row.fc_max)) {
      const dados = {
        ...(rc ? { ...rc.teste, teste_data: row.data } : {}),
        ...(rc && rc.teste.zonas_auto ? { zonas_auto: { ...rc.teste.zonas_auto, data: row.data } } : {}),
        ...(row.fc_rep ? { fc_rep: row.fc_rep } : {}),
        ...(row.fc_max ? { fc_max: row.fc_max } : {}),
      };
      const { error: e2 } = await sb.rpc('nx_aplicar_teste', { p_aluno: alunoId, p_dados: dados });
      if (e2) {
        console.error(e2);
        toast('Avaliação salva, mas o perfil de corrida não foi atualizado.', true);
        location.hash = '#/checkup/' + alunoId;
        return;
      }
    }
    store.set('nx-ck-ciclo', ciclo);
    toast(`Check-up de ${nm} ${atual && atual.status === 'respondido' ? 'confirmado' : 'salvo'}.`);
    location.hash = '#/checkup/' + alunoId;
  };
  const ap = document.getElementById('ck-apagar');
  if (ap)
    ap.onclick = async () => {
      if (!confirm(`Apagar a avaliação de ${nm}? O perfil de corrida do aluno não muda.`)) return;
      const { error } = await sb.from('nx_checkups').delete().eq('id', atual.id);
      if (error) return toast('Não foi possível apagar.', true);
      toast('Avaliação apagada.');
      location.hash = '#/checkup/' + alunoId;
    };
}
