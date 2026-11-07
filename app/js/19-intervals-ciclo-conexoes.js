/* Nexos App · Intervals.icu, ciclo menstrual e aba Conexões.
   Parte 19 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- Intervals.icu ---------- */
function intervalsCardHTML(integ, staff) {
  if (integ)
    return `<div class="card"><div class="row between" style="gap:12px"><div><b>Intervals.icu conectado ✓</b><p class="small muted">${integ.ultima_sync ? 'Última sincronização ' + quando(integ.ultima_sync) + ' às ' + fmtHora(integ.ultima_sync) : 'Aguardando a primeira sincronização'}${integ.erro ? ` · <span style="color:var(--warn)">${esc(integ.erro)}</span>` : ''}</p></div>
    <div class="row" style="gap:6px">${staff ? '' : '<button class="btn ghost sm" id="int-sync">Sincronizar</button><button class="link-btn small" id="int-off">Desconectar</button>'}</div></div>
    ${
      icuEscreve(integ)
        ? `<p class="tiny dim" style="margin-top:10px">${RELOGIO_IC} Os treinos liberados vão para o calendário do Intervals e, de lá, para o relógio. <b>Amazfit:</b> no app Zepp, ligue o Intervals.icu em Perfil → Contas de terceiros e sincronize em Treino → Meu plano de treino (Zepp OS 5 ou mais novo). <b>Coros, Huawei e outros:</b> ative o envio de treinos para a marca nas Conexões do Intervals.</p>`
        : staff
          ? '<p class="tiny dim" style="margin-top:10px">Para receber os treinos no relógio, o aluno precisa tocar em “Receber treinos no relógio” no app dele (uma vez só).</p>'
          : '<div class="int-rel"><p class="small"><b>Receba os treinos no relógio</b><br><span class="muted">Autorize uma vez e os treinos da planilha vão para o seu relógio pelo Intervals.icu.</span></p><button class="btn sm" id="int-on">Receber treinos no relógio</button></div>'
    }</div>`;
  if (staff)
    return '<div class="card"><p class="small muted">O aluno ainda não conectou o relógio. Ele faz isso aqui mesmo, na aba de corrida dele. Enquanto isso, as corridas podem ser enviadas por arquivo.</p></div>';
  return `<div class="card"><b>Corridas chegando sozinhas</b><p class="small muted" style="margin-top:4px">Conecte o seu relógio (Coros, Polar, Suunto, Wahoo, Amazfit e outros) ao <b>Intervals.icu</b>, que é gratuito, e depois conecte o Intervals.icu aqui. As corridas passam a aparecer no app sem você fazer nada, e os treinos da planilha vão para o relógio nas marcas que aceitam.</p>
    <ol class="small muted passos-int"><li>Crie uma conta grátis em intervals.icu e conecte o seu relógio lá (Configurações → Conexões).</li><li>Volte aqui e toque em “Conectar Intervals.icu”.</li></ol>
    <button class="btn sm" id="int-on" style="margin-top:12px">Conectar Intervals.icu</button>
    <p class="tiny dim" style="margin-top:8px">Tem relógio Garmin? Use o botão “Conectar Garmin” acima, que é direto e oficial.</p></div>`;
}
/* ---------- ciclo menstrual (opcional, só a aluna e os treinadores veem) ---------- */
const FASES_CICLO = {
  menstrual: [
    'Fase menstrual',
    '#e85d75',
    'A energia pode estar menor. Treine pela sensação e ajuste a intensidade se precisar.',
  ],
  folicular: ['Fase folicular', '#2fb6e0', 'Muitas mulheres sentem mais energia nesta fase. Siga o plano normalmente.'],
  ovulatoria: ['Fase ovulatória', '#e0a400', 'Siga o plano normalmente e capriche no aquecimento.'],
  lutea: [
    'Fase lútea',
    '#8b6be8',
    'Calor e cansaço maiores são comuns. Hidratação extra e intensidade pelo esforço percebido.',
  ],
};
const SIT_CICLO = [
  ['regular', 'Regular, todo mês'],
  ['irregular', 'Irregular'],
  ['contraceptivo', 'Anticoncepcional sem menstruação'],
  ['nao_menstrua', 'Não menstruo (menopausa, gestação…)'],
];
async function buscarCiclo(alunoId) {
  const [c, ini] = await Promise.all([
    sb
      .from('nx_ciclo')
      .select('*')
      .eq('aluno_id', alunoId)
      .maybeSingle()
      .then((r) => r.data)
      .catch(() => null),
    sb
      .from('nx_ciclo_inicios')
      .select('data')
      .eq('aluno_id', alunoId)
      .order('data', { ascending: false })
      .limit(6)
      .then((r) => r.data || [])
      .catch(() => []),
  ]);
  return c ? { ...c, inicios: ini.map((x) => x.data) } : null;
}
function cicloInfo(c, ref = hojeISO()) {
  if (!c || !c.ativo) return null;
  if (c.situacao === 'contraceptivo' || c.situacao === 'nao_menstrua') return { semFase: true };
  const ins = (c.inicios || []).filter((d) => d <= ref);
  if (!ins.length) return { semData: true };
  let cl = c.duracao_ciclo || 28;
  const difs = [];
  for (let i = 0; i < Math.min(ins.length - 1, 3); i++) {
    const d = Math.round((dia(ins[i]) - dia(ins[i + 1])) / 864e5);
    if (d >= 20 && d <= 45) difs.push(d);
  }
  if (difs.length) cl = Math.round(difs.reduce((a, b) => a + b, 0) / difs.length);
  const desde = Math.round((dia(ref) - dia(ins[0])) / 864e5),
    d = (desde % cl) + 1,
    dm = c.duracao_menstr || 5,
    ov = cl - 14;
  const fase = d <= dm ? 'menstrual' : d < ov - 1 ? 'folicular' : d <= ov + 1 ? 'ovulatoria' : 'lutea';
  return {
    dia: d,
    ciclo: cl,
    fase,
    prox: somaDias(ins[0], cl * (Math.floor(desde / cl) + 1)),
    ultimo: ins[0],
    atraso: desde >= cl ? desde - cl + 1 : 0,
  };
}
/** fase do ciclo num dia (usa a menstruação registrada mais recente até aquele dia; antes dela, conta para trás) */
function cicloFaseDia(c, k) {
  if (!c || !c.ativo || c.situacao === 'contraceptivo' || c.situacao === 'nao_menstrua') return null;
  const ins = (c.inicios || []).slice().sort().reverse();
  if (!ins.length) return null;
  let cl = c.duracao_ciclo || 28;
  const difs = [];
  for (let i = 0; i < Math.min(ins.length - 1, 3); i++) {
    const x = Math.round((dia(ins[i]) - dia(ins[i + 1])) / 864e5);
    if (x >= 20 && x <= 45) difs.push(x);
  }
  if (difs.length) cl = Math.round(difs.reduce((a, b) => a + b, 0) / difs.length);
  const base = ins.find((x) => x <= k) || ins[ins.length - 1];
  const desde = Math.round((dia(k) - dia(base)) / 864e5),
    d = (((desde % cl) + cl) % cl) + 1,
    dm = c.duracao_menstr || 5,
    ov = cl - 14;
  const fase = d <= dm ? 'menstrual' : d < ov - 1 ? 'folicular' : d <= ov + 1 ? 'ovulatoria' : 'lutea';
  return { fase, dia: d, ciclo: cl, previsto: k > hojeISO() || desde < 0 || (fase === 'menstrual' && desde >= cl) };
}
/** sinal do ciclo no cabeçalho do dia da planilha: gota na menstruação, ponto colorido nas outras fases */
function cicloSeloHTML(c, k) {
  const f = cicloFaseDia(c, k);
  if (!f) return '';
  const [nome, cor] = FASES_CICLO[f.fase];
  const dica = `${nome} · dia ${f.dia} de ${f.ciclo}${f.previsto ? ' (previsão)' : ''}`;
  return `<i class="cic-selo ${f.fase === 'menstrual' ? 'gota' : ''} ${f.previsto ? 'prev' : ''}" style="--cf:${cor}" title="${esc(dica)}" aria-label="${esc(dica)}">${f.fase === 'menstrual' ? '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/></svg>' : ''}</i>`;
}
/** linha resumida da fase (aluna no Hoje e treinador na planilha) */
function cicloLinhaHTML(c, staff) {
  const inf = cicloInfo(c);
  if (!inf) return '';
  if (inf.semFase)
    return staff
      ? `<div class="ciclo-l" style="--cf:#8b9ab8"><i></i><span>Ciclo: ${esc((SIT_CICLO.find((x) => x[0] === c.situacao) || [, ''])[1].split(' (')[0])}</span></div>`
      : '';
  if (inf.semData)
    return staff
      ? ''
      : `<button type="button" class="ciclo-l btn-ciclo" style="--cf:#e85d75"><i></i><span><b>Ciclo menstrual</b> · registre o início da última menstruação</span>${I.chev}</button>`;
  const f = FASES_CICLO[inf.fase];
  const txt = inf.atraso
    ? `previsão passou há ${inf.atraso} dia${inf.atraso > 1 ? 's' : ''}${staff ? '' : ': já começou? toque para registrar'}`
    : `dia ${inf.dia} de ${inf.ciclo} · próxima menstruação ~${fmtCurto(inf.prox + 'T12:00:00')}`;
  return staff
    ? `<div class="ciclo-l" style="--cf:${f[1]}"><i></i><span><b>${f[0]}</b> · ${txt}</span></div>`
    : `<button type="button" class="ciclo-l btn-ciclo" style="--cf:${f[1]}"><i></i><span><b>${f[0]}</b> · ${txt}</span>${I.chev}</button>`;
}
// ativar o acompanhamento do ciclo sem precisar abrir a ficha de saúde inteira
function ativarCiclo(depois) {
  const sel = (ops, v) =>
    ops.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('');
  openSheet(
    `<p class="eyebrow">Ciclo menstrual · opcional</p><div class="h2" style="margin-top:4px">Acompanhar o meu ciclo</div>
    <p class="muted small" style="margin-top:6px">O seu treinador ajusta a intensidade dos treinos de acordo com a fase do ciclo. Só você e os treinadores da Nexos veem.</p>
    <form id="f-cic" style="margin-top:14px">
      <label class="field"><span>Como é o seu ciclo?</span><select class="input" name="sit">${sel(SIT_CICLO, 'regular')}</select></label>
      <div id="cic-d">
        <label class="field"><span>Início da última menstruação</span><input class="input" type="date" name="ini" max="${hojeISO()}" required></label>
        <div class="grid2"><label class="field"><span>Duração média do ciclo (dias)</span><input class="input" name="cl" data-mask="num" data-max="2" inputmode="numeric" value="28" maxlength="2"></label><label class="field"><span>Dias de menstruação</span><input class="input" name="dm" data-mask="num" data-max="2" inputmode="numeric" value="5" maxlength="2"></label></div>
      </div>
      <p class="tiny dim">Ao ativar, você concorda que esses dados de saúde sejam usados só para orientar o seu treino (LGPD, art. 11). Pode desativar quando quiser em Perfil > Minha ficha de saúde, e os registros são apagados.</p>
      <button class="btn block" type="submit" style="margin-top:12px">Ativar acompanhamento</button>
    </form>`,
    (r) => {
      const f = r.querySelector('#f-cic'),
        d = r.querySelector('#cic-d');
      const ver = () => {
        const sem = f.sit.value === 'contraceptivo' || f.sit.value === 'nao_menstrua';
        d.hidden = sem;
        f.ini.required = !sem;
      };
      f.sit.onchange = ver;
      ver();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = f.querySelector('[type=submit]');
        b.disabled = true;
        const sit = f.sit.value,
          sem = sit === 'contraceptivo' || sit === 'nao_menstrua';
        const cl = Math.min(45, Math.max(20, parseInt(f.cl.value, 10) || 28)),
          dm = Math.min(10, Math.max(2, parseInt(f.dm.value, 10) || 5));
        if (!sem && (!f.ini.value || f.ini.value > hojeISO())) {
          b.disabled = false;
          return toast('Confira a data do início da última menstruação.', true);
        }
        const agora = new Date().toISOString();
        const { error } = await sb
          .from('nx_ciclo')
          .upsert(
            {
              aluno_id: S.user.id,
              org_id: S.org.id,
              ativo: true,
              situacao: sit,
              duracao_ciclo: cl,
              duracao_menstr: dm,
              consentimento_em: agora,
              atualizado_em: agora,
            },
            { onConflict: 'aluno_id' },
          );
        if (error) {
          b.disabled = false;
          return toast('Não foi possível ativar agora.', true);
        }
        if (!sem)
          await sb
            .from('nx_ciclo_inicios')
            .upsert({ org_id: S.org.id, aluno_id: S.user.id, data: f.ini.value }, { onConflict: 'aluno_id,data' });
        if (S.me.sexo !== 'F') {
          await sb.from('nx_membros').update({ sexo: 'F' }).eq('org_id', S.org.id).eq('user_id', S.user.id);
          S.me.sexo = 'F';
        }
        closeSheet();
        toast('Acompanhamento do ciclo ativado.');
        depois && depois();
      };
    },
  );
}
/** folha para a aluna registrar a menstruação e ver a fase */
function abrirCiclo(c, depois) {
  const inf = cicloInfo(c) || {};
  const f = inf.fase ? FASES_CICLO[inf.fase] : null;
  openSheet(
    `<p class="eyebrow">Meu ciclo</p><div class="h2" style="margin-top:4px">${f ? f[0] : 'Ciclo menstrual'}</div>
    ${f ? `<p class="muted small" style="margin-top:6px">${inf.atraso ? 'A menstruação prevista ainda não foi registrada.' : `Dia ${inf.dia} de um ciclo de cerca de ${inf.ciclo} dias.`} ${f[2]}</p>` : '<p class="muted small" style="margin-top:6px">Registre o início da menstruação para o app calcular a sua fase e o seu treinador ajustar os treinos.</p>'}
    <button class="btn block" id="ci-hoje" style="margin-top:16px">Minha menstruação começou hoje</button>
    <label class="field" style="margin-top:12px"><span>Ou escolha a data em que começou</span><div class="row" style="gap:8px"><input class="input" type="date" id="ci-data" max="${hojeISO()}" value="${hojeISO()}"><button class="btn ghost sm" id="ci-salvar">Salvar</button></div></label>
    ${
      c && c.inicios && c.inicios.length
        ? `<p class="tiny dim" style="margin-top:6px">Últimos registros: ${c.inicios
            .slice(0, 4)
            .map((d) => fmtCurto(d + 'T12:00:00'))
            .join(' · ')}</p>`
        : ''
    }
    <a class="link-btn small" href="#/saude" style="display:inline-block;margin-top:12px">Editar ou desativar o acompanhamento</a>
    <button class="btn ghost block" data-close style="margin-top:12px">Fechar</button>`,
    (r) => {
      const salvar = async (data) => {
        const { error } = await sb
          .from('nx_ciclo_inicios')
          .upsert({ org_id: S.org.id, aluno_id: S.user.id, data }, { onConflict: 'aluno_id,data' });
        if (error) return toast('Não foi possível salvar.', true);
        closeSheet();
        toast('Registrado! A fase do seu ciclo foi atualizada.');
        depois && depois();
      };
      r.querySelector('#ci-hoje').onclick = () => salvar(hojeISO());
      r.querySelector('#ci-salvar').onclick = () => {
        const v = r.querySelector('#ci-data').value;
        if (!v || v > hojeISO()) return toast('Escolha uma data válida.', true);
        salvar(v);
      };
    },
  );
}

/* ---------- Ciclo menstrual: área completa (Mais > Ciclo menstrual) ---------- */
const CIC_SINT = [
  ['colica', 'Cólica'],
  ['lombar', 'Dor lombar'],
  ['cabeca', 'Dor de cabeça'],
  ['inchaco', 'Inchaço'],
  ['seios', 'Seios sensíveis'],
  ['cansaco', 'Cansaço'],
  ['pernas', 'Pernas pesadas'],
  ['sono_ruim', 'Sono ruim'],
  ['intestino', 'Intestino alterado'],
  ['doce', 'Vontade de doce'],
  ['espinhas', 'Espinhas'],
  ['calor', 'Ondas de calor'],
  ['nausea', 'Náusea'],
  ['tontura', 'Tontura'],
  ['manchas', 'Manchas fora da menstruação'],
];
const CIC_CUID = [
  ['remedio', 'Tomei remédio para dor'],
  ['bolsa', 'Usei bolsa quente'],
  ['alongou', 'Fiz alongamento ou respiração'],
];
const CIC_HUMOR = [
  ['bem', 'Bem'],
  ['calma', 'Calma'],
  ['motivada', 'Motivada'],
  ['sensivel', 'Sensível'],
  ['irritada', 'Irritada'],
  ['ansiosa', 'Ansiosa'],
  ['estressada', 'Estressada'],
  ['triste', 'Triste'],
  ['desanimada', 'Desanimada'],
];
const CIC_FLUXO = [
  ['leve', 'Leve', 1],
  ['medio', 'Médio', 2],
  ['intenso', 'Intenso', 3],
];
const CIC_ROSA = '#e85d75';
const nomeSint = (k) => ([...CIC_SINT, ...CIC_CUID].find((x) => x[0] === k) || [, k])[1];
const nomeHumor = (k) => (CIC_HUMOR.find((x) => x[0] === k) || [, k])[1];
const nomeFluxo = (k) => (CIC_FLUXO.find((x) => x[0] === k) || [, k])[1];
const gotasSVG = (n, cor = 'currentColor') =>
  `<span class="gotas">${Array.from({ length: 3 }, (_, i) => `<svg viewBox="0 0 24 24" width="13" height="13" style="opacity:${i < n ? 1 : 0.25}"><path fill="${cor}" d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/></svg>`).join('')}</span>`;
/** resumo curto de um dia registrado (para o treinador e o histórico) */
function resumoDiaCiclo(r) {
  if (!r) return '';
  const p = [];
  if (r.menstruada) p.push(`Menstruada${r.fluxo ? ' · fluxo ' + nomeFluxo(r.fluxo).toLowerCase() : ''}`);
  (r.sintomas || [])
    .filter((k) => !CIC_CUID.some((x) => x[0] === k))
    .forEach((k) => p.push(k === 'colica' && r.colica_int != null ? `Cólica ${r.colica_int}/10` : nomeSint(k)));
  return p.join(' · ');
}
// marca o início da menstruação quando ela não foi registrada nos 10 dias anteriores
async function marcarInicioSePreciso(diaK, inicios) {
  const perto = (inicios || []).some((d) => d <= diaK && d >= somaDias(diaK, -10));
  if (perto) return false;
  await sb
    .from('nx_ciclo_inicios')
    .upsert({ org_id: S.org.id, aluno_id: S.user.id, data: diaK }, { onConflict: 'aluno_id,data' })
    .then(
      () => {},
      () => {},
    );
  return true;
}
async function salvarDiaCiclo(row, inicios) {
  const dados = {
    org_id: S.org.id,
    aluno_id: S.user.id,
    dia: row.dia,
    menstruada: !!row.menstruada,
    fluxo: row.menstruada ? row.fluxo || null : null,
    sintomas: row.sintomas || [],
    colica_int: (row.sintomas || []).includes('colica') ? (row.colica_int ?? null) : null,
    humor: row.humor || [],
    nota: row.nota || null,
    atualizado_em: new Date().toISOString(),
  };
  const { error } = await sb.from('nx_ciclo_dias').upsert(dados, { onConflict: 'aluno_id,dia' });
  if (error) return { error };
  const novoInicio = dados.menstruada ? await marcarInicioSePreciso(dados.dia, inicios) : false;
  return { novoInicio };
}
/** campos do registro do dia (usado na folha da área do ciclo e no check-in da manhã) */
function camposCicloHTML(r, curto) {
  const sint = curto
    ? CIC_SINT.filter((x) => ['colica', 'lombar', 'cabeca', 'inchaco', 'cansaco', 'seios'].includes(x[0]))
    : CIC_SINT;
  return `<div class="cic-campos">
    <div class="pq"><b>Está menstruada${curto ? ' hoje' : ''}?</b><div class="seg sm cic-mens"><button type="button" data-m="1" class="${r.menstruada ? 'on' : ''}">Sim</button><button type="button" data-m="0" class="${r.menstruada === false ? 'on' : ''}">Não</button></div></div>
    <div class="pq cic-fluxo" ${r.menstruada ? '' : 'hidden'}><b>Fluxo</b><div class="cic-chips">${CIC_FLUXO.map(([k, t, n]) => `<button type="button" data-fl="${k}" class="${r.fluxo === k ? 'on' : ''}">${gotasSVG(n)}${t}</button>`).join('')}</div></div>
    <div class="pq"><b>Sintomas</b><div class="cic-chips">${sint.map(([k, t]) => `<button type="button" data-s="${k}" class="${(r.sintomas || []).includes(k) ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <div class="pq cic-colint" ${(r.sintomas || []).includes('colica') ? '' : 'hidden'}><b>Intensidade da cólica</b><div class="pq-int">${Array.from({ length: 11 }, (_, i) => `<button type="button" data-ci="${i}" class="${r.colica_int === i ? 'on' : ''}">${i}</button>`).join('')}</div><div class="row between tiny dim" style="margin-top:4px"><span>leve</span><span>pior dor possível</span></div></div>
    ${
      curto
        ? ''
        : `<div class="pq"><b>Cuidados de hoje</b><div class="cic-chips">${CIC_CUID.map(([k, t]) => `<button type="button" data-s="${k}" class="${(r.sintomas || []).includes(k) ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <div class="pq"><b>Humor</b><div class="cic-chips">${CIC_HUMOR.map(([k, t]) => `<button type="button" data-h="${k}" class="${(r.humor || []).includes(k) ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <label class="field"><span>Anotação do dia (opcional)</span><textarea class="input" id="cic-nota" rows="2" maxlength="1000" placeholder="Ex.: cólica forte de manhã, melhorou depois da caminhada">${esc(r.nota || '')}</textarea></label>`
    }
  </div>`;
}
function bindCamposCiclo(box, r) {
  box.addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]'),
      fl = e.target.closest('[data-fl]'),
      s = e.target.closest('[data-s]'),
      h = e.target.closest('[data-h]'),
      ci = e.target.closest('[data-ci]');
    if (m) {
      r.menstruada = m.dataset.m === '1';
      box.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === m));
      box.querySelector('.cic-fluxo').hidden = !r.menstruada;
    }
    if (fl) {
      r.fluxo = r.fluxo === fl.dataset.fl ? null : fl.dataset.fl;
      box.querySelectorAll('[data-fl]').forEach((x) => x.classList.toggle('on', x.dataset.fl === r.fluxo));
    }
    if (s) {
      const k = s.dataset.s;
      r.sintomas = (r.sintomas || []).includes(k) ? r.sintomas.filter((x) => x !== k) : [...(r.sintomas || []), k];
      s.classList.toggle('on');
      box.querySelector('.cic-colint').hidden = !r.sintomas.includes('colica');
    }
    if (h) {
      const k = h.dataset.h;
      r.humor = (r.humor || []).includes(k) ? r.humor.filter((x) => x !== k) : [...(r.humor || []), k];
      h.classList.toggle('on');
    }
    if (ci) {
      r.colica_int = +ci.dataset.ci;
      box.querySelectorAll('[data-ci]').forEach((x) => x.classList.toggle('on', x === ci));
    }
  });
}
/** folha para registrar um dia (faixa de dias no topo para escolher o dia) */
async function registrarDiaCiclo(c, diaIni, depois) {
  const hj = hojeISO();
  let diaK = diaIni && diaIni <= hj ? diaIni : hj;
  const ini = somaDias(diaK, -6) < somaDias(hj, -13) ? somaDias(diaK, -6) : somaDias(hj, -13);
  const rows = await sb
    .from('nx_ciclo_dias')
    .select('*')
    .eq('aluno_id', S.user.id)
    .gte('dia', ini)
    .then(
      (x) => x.data || [],
      () => [],
    );
  const porDia = Object.fromEntries(rows.map((x) => [x.dia, x]));
  const faixa = () => {
    const fim = somaDias(diaK, 3) > hj ? hj : somaDias(diaK, 3);
    return Array.from({ length: 7 }, (_, i) => somaDias(fim, i - 6));
  };
  const desenhar = () => {
    const r = { ...(porDia[diaK] || { dia: diaK, sintomas: [], humor: [] }) };
    if (r.menstruada == null && !porDia[diaK]) {
      const f = cicloFaseDia(c, diaK);
      r.menstruada = f && f.fase === 'menstrual' && !f.previsto ? true : null;
    }
    openSheet(
      `<p class="eyebrow">Ciclo menstrual</p><div class="h2" style="margin-top:4px">${diaK === hj ? 'Como você está hoje?' : `Registro de ${fmtCurto(diaK + 'T12:00:00')}`}</div>
      <div class="cic-faixa">${faixa()
        .map((k) => {
          const d = new Date(k + 'T12:00:00');
          const x = porDia[k];
          return `<button type="button" data-dia="${k}" class="${k === diaK ? 'on' : ''}"><small>${k === hj ? 'Hoje' : ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()]}</small><b>${d.getDate()}</b><i class="${x ? (x.menstruada ? 'm' : 'r') : ''}"></i></button>`;
        })
        .join('')}</div>
      ${camposCicloHTML(r, false)}
      <button class="btn block" id="cic-salvar" style="margin-top:6px">Salvar ${I.check}</button>
      ${porDia[diaK] ? '<button class="btn ghost block" id="cic-apagar" style="margin-top:8px">Apagar o registro deste dia</button>' : ''}`,
      (root) => {
        bindCamposCiclo(root.querySelector('.cic-campos'), r);
        root.querySelectorAll('[data-dia]').forEach(
          (b) =>
            (b.onclick = () => {
              diaK = b.dataset.dia;
              desenhar();
            }),
        );
        root.querySelector('#cic-salvar').onclick = async (e) => {
          if (
            r.menstruada == null &&
            !(r.sintomas || []).length &&
            !(r.humor || []).length &&
            !root.querySelector('#cic-nota').value.trim()
          )
            return toast('Marque pelo menos uma informação.', true);
          e.currentTarget.disabled = true;
          r.nota = root.querySelector('#cic-nota').value.trim() || null;
          const res = await salvarDiaCiclo(r, c && c.inicios);
          if (res.error) {
            e.currentTarget.disabled = false;
            return toast('Não foi possível salvar. Tente de novo.', true);
          }
          closeSheet();
          toast(
            res.novoInicio
              ? 'Registrado. O início da menstruação foi marcado e a previsão foi atualizada.'
              : 'Registrado.',
          );
          depois && depois();
        };
        const ap = root.querySelector('#cic-apagar');
        if (ap)
          ap.onclick = async () => {
            await sb
              .from('nx_ciclo_dias')
              .delete()
              .eq('aluno_id', S.user.id)
              .eq('dia', diaK)
              .then(
                () => {},
                () => {},
              );
            closeSheet();
            toast('Registro apagado.');
            depois && depois();
          };
      },
    );
  };
  desenhar();
}

// rotinas guiadas de autocuidado (exercício leve e respiração têm evidência de aliviar a dor da cólica)
const ROTINAS_CICLO = {
  colica: {
    t: 'Alívio da cólica',
    d: 'Mobilidade suave e respiração, 8 minutos',
    passos: [
      [
        'Respiração abdominal',
        'Deitada de barriga para cima, joelhos dobrados. Mão na barriga: inspire pelo nariz enchendo a barriga e solte devagar pela boca.',
        60,
      ],
      [
        'Postura da criança',
        'Ajoelhada, sente nos calcanhares e leve o tronco à frente, braços estendidos. Solte o peso e respire fundo.',
        60,
      ],
      [
        'Gato e vaca',
        'Em quatro apoios: ao inspirar, afunde as costas e olhe à frente; ao soltar o ar, arredonde as costas. Movimento lento.',
        60,
      ],
      [
        'Báscula da pelve',
        'Deitada, joelhos dobrados. Encoste a lombar no chão contraindo de leve o abdome e solte. Devagar, sem dor.',
        60,
      ],
      [
        'Joelhos ao peito',
        'Deitada, abrace os joelhos e traga ao peito. Pode balançar de leve de um lado para o outro.',
        60,
      ],
      [
        'Torção deitada',
        'Deitada, joelhos dobrados juntos: deixe cair para um lado e olhe para o outro. Troque de lado na metade do tempo.',
        90,
      ],
      [
        'Borboleta deitada',
        'Deitada, junte as solas dos pés e deixe os joelhos abrirem. Mãos na barriga, respire devagar.',
        60,
      ],
      ['Respiração 4 e 6', 'Inspire contando até 4 e solte contando até 6. Expirar mais devagar ajuda a relaxar.', 60],
    ],
  },
  lombar: {
    t: 'Lombar mais leve',
    d: 'Para a dor nas costas do período, 5 minutos',
    passos: [
      ['Gato e vaca', 'Em quatro apoios, alterne arredondar e afundar as costas, no ritmo da respiração.', 60],
      [
        'Postura da criança',
        'Sente nos calcanhares e leve o tronco à frente. Respire levando o ar para as costas.',
        60,
      ],
      ['Joelhos ao peito', 'Deitada, abrace os dois joelhos e solte a lombar no chão.', 60],
      ['Ponte suave', 'Deitada, joelhos dobrados: suba o quadril devagar e desça vértebra por vértebra.', 60],
      ['Torção deitada', 'Joelhos dobrados caem para um lado, depois para o outro. Sem forçar.', 60],
    ],
  },
  pernas: {
    t: 'Pernas leves',
    d: 'Para inchaço e pernas pesadas, 6 minutos',
    passos: [
      [
        'Pernas na parede',
        'Deitada, apoie as pernas na parede com o quadril perto dela. Respire devagar e solte o peso.',
        120,
      ],
      [
        'Bomba da panturrilha',
        'Ainda com as pernas para cima, flexione e estenda os tornozelos sem parar, em ritmo calmo.',
        60,
      ],
      [
        'Alongamento de posterior',
        'Deitada, uma perna estendida para cima com as mãos atrás da coxa. Troque na metade do tempo.',
        60,
      ],
      ['Borboleta deitada', 'Solas dos pés juntas, joelhos abertos. Mãos na barriga, respiração lenta.', 60],
      ['Respiração 4 e 6', 'Inspire em 4 tempos e solte o ar em 6.', 60],
    ],
  },
  dormir: {
    t: 'Relaxar para dormir',
    d: 'Relaxamento do corpo antes de deitar, 5 minutos',
    passos: [
      ['Ajeite-se', 'Deitada de barriga para cima, braços ao lado do corpo. Feche os olhos e respire normalmente.', 30],
      [
        'Pés e pernas',
        'Contraia os pés e as pernas por 5 segundos e solte tudo. Repita duas vezes e sinta o peso das pernas.',
        50,
      ],
      [
        'Barriga e quadril',
        'Leve a atenção para a barriga. A cada vez que soltar o ar, deixe a região mais solta.',
        50,
      ],
      ['Ombros e braços', 'Suba os ombros em direção às orelhas, segure e solte. Deixe os braços pesados.', 50],
      ['Rosto', 'Solte a mandíbula, a testa e os olhos. Língua solta dentro da boca.', 40],
      ['Respiração lenta', 'Inspire em 4 tempos e solte em 6, até o fim do tempo. Se der sono, pode dormir.', 80],
    ],
  },
  resp: { t: 'Respirar e relaxar', d: 'Respiração guiada para dor, ansiedade e sono, 3 minutos', resp: 180 },
};
function abrirRotina(k) {
  const R = ROTINAS_CICLO[k];
  if (!R) return;
  if (R.resp) return abrirRespiracao(R);
  let i = 0,
    resta = R.passos[0][2],
    pausa = false,
    tm = null;
  const total = R.passos.reduce((a, p) => a + p[2], 0);
  openSheet(
    `<p class="eyebrow">Autocuidado</p><div class="h2" style="margin-top:4px">${esc(R.t)}</div>
    <div class="rot"><div class="rot-anel"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="fundo"/><circle cx="60" cy="60" r="52" class="prog" id="rot-prog"/></svg><b id="rot-seg"></b></div>
      <p class="tiny dim" id="rot-n"></p><div class="h3" id="rot-t" style="margin-top:4px"></div><p class="small muted" id="rot-d" style="margin-top:6px;min-height:3.6em"></p>
      <div class="row" style="gap:8px;justify-content:center;margin-top:12px"><button class="btn ghost sm" id="rot-ant">Anterior</button><button class="btn sm" id="rot-pausa">Pausar</button><button class="btn ghost sm" id="rot-prox">Próximo</button></div>
      <p class="tiny dim" style="margin-top:14px">Sem dor: se algum movimento incomodar, pule para o próximo.</p></div>`,
    (root) => {
      const C = 2 * Math.PI * 52,
        prog = root.querySelector('#rot-prog');
      prog.style.strokeDasharray = C;
      const mostra = () => {
        const p = R.passos[i];
        root.querySelector('#rot-n').textContent =
          `${i + 1} de ${R.passos.length} · ${Math.round(total / 60)} min no total`;
        root.querySelector('#rot-t').textContent = p[0];
        root.querySelector('#rot-d').textContent = p[1];
        root.querySelector('#rot-seg').textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
        prog.style.strokeDashoffset = C * (resta / p[2]);
      };
      const vai = (n) => {
        if (n >= R.passos.length) {
          clearInterval(tm);
          closeSheet();
          confete();
          toast('Rotina concluída. Bom descanso.');
          return;
        }
        i = Math.max(0, n);
        resta = R.passos[i][2];
        if (navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {}
        }
        mostra();
      };
      tm = setInterval(() => {
        if (!document.body.contains(prog)) return clearInterval(tm);
        if (pausa) return;
        resta--;
        if (resta <= 0) vai(i + 1);
        else mostra();
      }, 1000);
      root.querySelector('#rot-ant').onclick = () => vai(i - 1);
      root.querySelector('#rot-prox').onclick = () => vai(i + 1);
      root.querySelector('#rot-pausa').onclick = (e) => {
        pausa = !pausa;
        e.currentTarget.textContent = pausa ? 'Continuar' : 'Pausar';
      };
      mostra();
    },
  );
}
function abrirRespiracao(R) {
  let resta = R.resp,
    t0 = Date.now(),
    tm = null;
  openSheet(
    `<p class="eyebrow">Autocuidado</p><div class="h2" style="margin-top:4px">${esc(R.t)}</div>
    <div class="resp"><div class="resp-bola" id="resp-bola"><span id="resp-txt">Inspire</span></div>
      <p class="small muted" style="margin-top:14px">Inspire pelo nariz em 4 segundos e solte o ar devagar em 6. Acompanhe o círculo.</p>
      <p class="tiny dim" id="resp-resta" style="margin-top:6px"></p>
      <button class="btn ghost block" data-close style="margin-top:14px">Encerrar</button></div>`,
    (root) => {
      const bola = root.querySelector('#resp-bola'),
        txt = root.querySelector('#resp-txt');
      const passo = () => {
        if (!document.body.contains(bola)) return clearInterval(tm);
        const s = Math.floor((Date.now() - t0) / 1000) % 10;
        const ins = s < 4;
        txt.textContent = ins ? 'Inspire' : 'Solte o ar';
        bola.classList.toggle('ins', ins);
        resta = R.resp - Math.floor((Date.now() - t0) / 1000);
        root.querySelector('#resp-resta').textContent =
          `${Math.max(0, Math.floor(resta / 60))}:${String(Math.max(0, resta % 60)).padStart(2, '0')} restantes`;
        if (resta <= 0) {
          clearInterval(tm);
          closeSheet();
          toast('Respiração concluída.');
        }
      };
      tm = setInterval(passo, 250);
      passo();
    },
  );
}
const DICAS_CICLO = [
  [
    'Calor local',
    'Bolsa de água morna ou compressa quente no abdome por 15 a 20 minutos alivia a dor da cólica. Os estudos mostram efeito real na dor.',
  ],
  [
    'Mexer o corpo ajuda',
    'Atividade física regular e exercício leve, como caminhada e alongamento, reduzem a intensidade da cólica. Não precisa parar de treinar: ajuste a intensidade pela sensação.',
  ],
  [
    'Hidratação',
    'Na segunda metade do ciclo a temperatura do corpo sobe um pouco e o calor incomoda mais. Capriche na água nos treinos.',
  ],
  [
    'Fluxo intenso e ferro',
    'Menstruação muito volumosa aumenta a chance de falta de ferro, que causa cansaço e queda de rendimento. Inclua carnes, feijão e folhas escuras e converse com o seu médico se o cansaço for grande.',
  ],
  [
    'Quando procurar um médico',
    'Dor muito forte que não melhora com remédio comum; precisar trocar o absorvente a cada 1 ou 2 horas; ciclos menores que 21 ou maiores que 35 dias; ou ficar 3 meses sem menstruar. Em quem treina, ficar sem menstruar pode indicar que a alimentação não está cobrindo o gasto do treino.',
  ],
];
const FASE_TXT = {
  menstrual:
    'Energia e disposição podem cair, principalmente com cólica. Treinar é seguro e exercício leve pode até aliviar a dor. Ajuste a intensidade pela sensação.',
  folicular:
    'Muitas mulheres se sentem com mais energia nesta fase. A diferença no desempenho entre as fases é pequena e muda de pessoa para pessoa: siga o seu plano normalmente.',
  ovulatoria: 'Fase curta, perto da ovulação. Siga o plano normalmente e mantenha um bom aquecimento.',
  lutea:
    'A temperatura do corpo sobe um pouco e o calor pode incomodar mais: hidrate-se bem. Nos dias antes da menstruação podem aparecer sintomas de TPM, como inchaço e irritação.',
};

async function viewCicloAluna(mesSel) {
  loading();
  dockAluno();
  const hj = hojeISO();
  const [c0, inis, dias, prontsC] = await Promise.all([
    sb
      .from('nx_ciclo')
      .select('*')
      .eq('aluno_id', S.user.id)
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
    sb
      .from('nx_ciclo_inicios')
      .select('data')
      .eq('aluno_id', S.user.id)
      .order('data', { ascending: false })
      .limit(13)
      .then(
        (r) => (r.data || []).map((x) => x.data),
        () => [],
      ),
    sb
      .from('nx_ciclo_dias')
      .select('*')
      .eq('aluno_id', S.user.id)
      .gte('dia', somaDias(hj, -400))
      .order('dia', { ascending: false })
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_prontidao')
      .select('dia,sono,energia,total')
      .eq('aluno_id', S.user.id)
      .gte('dia', somaDias(hj, -200))
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const c = c0 ? { ...c0, inicios: inis } : null;
  if (c && c.ativo && mesSel === 'relatorio') return relatorioCiclo(c, inis, dias);
  const topo = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Saúde</p><h1 class="h1">Ciclo menstrual</h1>`;
  if (!c || !c.ativo) {
    $app.innerHTML = `${topo}<div class="card cic-intro" style="margin-top:14px"><div class="h3">Acompanhe o seu ciclo junto com o treino</div>
      <p class="small muted" style="margin-top:8px">Veja a fase do ciclo, a previsão da próxima menstruação e registre sintomas como cólica, fluxo e humor. O seu treinador usa essas informações para ajustar a intensidade dos treinos quando você precisar.</p>
      <p class="tiny dim" style="margin-top:8px">Só você e os treinadores da Nexos veem. Você pode desativar e apagar tudo quando quiser.</p>
      <button class="btn block" id="cic-ativar" style="margin-top:14px">Ativar acompanhamento</button></div>
      ${autocuidadoHTML()}`;
    document.getElementById('cic-ativar').onclick = () => ativarCiclo(() => viewCicloAluna());
    bindAutocuidado();
    return;
  }
  const inf = cicloInfo(c) || {};
  const porDia = Object.fromEntries(dias.map((x) => [x.dia, x]));
  const hojeR = porDia[hj];
  // dias de menstruação já vividos: registrados no dia a dia ou, sem registro, os dias após cada início
  const mensDias = new Set(dias.filter((x) => x.menstruada).map((x) => x.dia));
  const dm = c.duracao_menstr || 5;
  inis.forEach((ini) => {
    const temReg = dias.some((x) => x.dia >= ini && x.dia <= somaDias(ini, 9));
    if (!temReg)
      for (let i = 0; i < dm; i++) {
        const k = somaDias(ini, i);
        if (k <= hj) mensDias.add(k);
      }
  });
  // histórico
  const ciclos = [];
  for (let i = 0; i < inis.length - 1; i++) {
    const n = Math.round((dia(inis[i]) - dia(inis[i + 1])) / 864e5);
    if (n >= 15 && n <= 60) ciclos.push({ ini: inis[i + 1], n });
  }
  const durMens = inis
    .map((ini) => {
      let n = 0;
      while (n < 12 && dias.some((x) => x.dia === somaDias(ini, n) && x.menstruada)) n++;
      return n;
    })
    .filter((n) => n >= 2);
  const medCiclo = ciclos.length ? Math.round(ciclos.reduce((a, x) => a + x.n, 0) / ciclos.length) : null;
  const medMens = durMens.length ? Math.round(durMens.reduce((a, n) => a + n, 0) / durMens.length) : null;
  const ult90 = dias.filter((x) => x.dia >= somaDias(hj, -90));
  const contS = {};
  ult90.forEach((x) => (x.sintomas || []).forEach((k) => (contS[k] = (contS[k] || 0) + 1)));
  const topS = Object.entries(contS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxS = topS.length ? topS[0][1] : 1;
  // cabeçalho
  let hero = '';
  if (inf.semFase)
    hero = `<div class="cic-hero"><p class="eyebrow">Seu ciclo</p><div class="cic-grande" style="font-size:1.6rem">${esc((SIT_CICLO.find((x) => x[0] === c.situacao) || [, ''])[1])}</div><p class="small" style="opacity:.8;margin-top:8px">Sem previsão de fases. Você ainda pode registrar sintomas e usar o autocuidado.</p></div>`;
  else if (inf.semData)
    hero = `<div class="cic-hero"><p class="eyebrow">Seu ciclo</p><div class="cic-grande" style="font-size:1.6rem">Falta registrar a menstruação</div><button class="btn sm" id="cic-ini" style="margin-top:14px">Registrar o início</button></div>`;
  else {
    const fa = FASES_CICLO[inf.fase],
      cl = inf.ciclo,
      ov = cl - 14;
    const faltam = Math.round((dia(inf.prox) - dia(hj)) / 864e5);
    const seg = [
      ['menstrual', dm],
      ['folicular', Math.max(1, ov - 2 - dm)],
      ['ovulatoria', 3],
      ['lutea', Math.max(1, cl - ov - 1)],
    ];
    const grande = inf.atraso
      ? `Atrasada ${inf.atraso} dia${inf.atraso > 1 ? 's' : ''}`
      : inf.fase === 'menstrual'
        ? `Menstruação · dia ${inf.dia}`
        : `Faltam ${faltam} dia${faltam !== 1 ? 's' : ''}`;
    const sub = inf.atraso
      ? 'A menstruação prevista ainda não foi registrada. Já começou?'
      : inf.fase === 'menstrual'
        ? `Próxima prevista para ~${fmtCurto(inf.prox + 'T12:00:00')}`
        : `para a próxima menstruação · ~${fmtCurto(inf.prox + 'T12:00:00')}`;
    hero = `<div class="cic-hero" style="--cf:${fa[1]}"><p class="eyebrow"><i class="cic-pt"></i>${fa[0]} · dia ${inf.dia} do ciclo</p>
      <div class="cic-grande">${grande}</div><p class="small" style="opacity:.82;margin-top:4px">${sub}</p>
      <div class="cic-barra">${seg.map(([k, n]) => `<span style="flex:${n};background:${FASES_CICLO[k][1]}"></span>`).join('')}<b class="cic-hoje" style="left:${Math.min(100, ((inf.dia - 0.5) / cl) * 100)}%"><em>Hoje</em></b></div>
      <div class="cic-leg">${seg.map(([k]) => `<span><i style="background:${FASES_CICLO[k][1]}"></i>${FASES_CICLO[k][0].replace('Fase ', '')}</span>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn sm" id="cic-reg">${hojeR ? 'Editar o registro de hoje' : 'Registrar como estou hoje'}</button><button class="btn ghost sm" id="cic-ini">Menstruação começou</button></div></div>
      <div class="card" style="margin-top:12px"><b style="color:${fa[1]}">${fa[0]}</b><p class="small muted" style="margin-top:6px">${FASE_TXT[inf.fase]}</p></div>`;
  }
  // calendário do mês
  const mesK = /^\d{4}-\d{2}$/.test(mesSel || '') ? mesSel : hj.slice(0, 7);
  const prim = mesK + '-01',
    d0 = new Date(prim + 'T12:00:00'),
    offset = (d0.getDay() + 6) % 7;
  const nDias = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const mesAnt = isoDia(new Date(d0.getFullYear(), d0.getMonth() - 1, 15)).slice(0, 7),
    mesProx = isoDia(new Date(d0.getFullYear(), d0.getMonth() + 1, 15)).slice(0, 7);
  const cel = [];
  for (let i = 0; i < offset; i++) cel.push('<span></span>');
  for (let n = 1; n <= nDias; n++) {
    const k = `${mesK}-${String(n).padStart(2, '0')}`,
      futuro = k > hj;
    const f = !inf.semFase ? cicloFaseDia(c, k) : null;
    const mens = mensDias.has(k),
      prev = !mens && f && f.fase === 'menstrual' && (futuro || f.previsto) && k >= hj;
    const reg = porDia[k];
    cel.push(
      `<button type="button" class="cic-d${mens ? ' mens' : ''}${prev ? ' prev' : ''}${k === hj ? ' hoje' : ''}${futuro ? ' fut' : ''}" data-dia="${k}" ${futuro ? 'disabled' : ''}><b>${n}</b>${reg && ((reg.sintomas || []).length || (reg.humor || []).length || reg.nota) ? '<i></i>' : ''}</button>`,
    );
  }
  const verAno = mesSel === 'ano';
  const nomeMes = `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][d0.getMonth()]} de ${d0.getFullYear()}`;
  $app.innerHTML = `${topo}${hero}
    <div class="section"><div class="cic-modo"><a href="#/ciclo" class="${verAno ? '' : 'on'}">Mês</a><a href="#/ciclo/ano" class="${verAno ? 'on' : ''}">Ano</a></div>
      ${
        verAno
          ? anoCicloHTML(c, mensDias, porDia, inf)
          : `<div class="section-h" style="margin-top:12px"><h2 class="h2">${nomeMes}</h2><div class="row" style="gap:6px"><a class="icon-btn sm" href="#/ciclo/${mesAnt}" aria-label="Mês anterior">${I.back}</a><a class="icon-btn sm" href="#/ciclo/${mesProx}" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</a></div></div>
      <div class="cic-cal"><div class="cic-sem">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x) => `<span>${x}</span>`).join('')}</div><div class="cic-grade">${cel.join('')}</div></div>`
      }
      <div class="cic-leg cal"><span><i class="m"></i>Menstruação</span><span><i class="p"></i>Previsão</span><span><i class="r"></i>Registro do dia</span></div>
      ${verAno ? '' : '<p class="tiny dim" style="margin-top:6px">Toque em um dia para registrar ou ver como você estava.</p>'}</div>
    <div class="section"><div class="section-h"><h2 class="h2">Seu histórico</h2></div>
      <div class="cic-stats"><div><b>${medCiclo || inf.ciclo || c.duracao_ciclo || '–'}<small> dias</small></b><span>ciclo ${medCiclo ? 'médio' : 'informado'}</span></div><div><b>${medMens || dm}<small> dias</small></b><span>menstruação ${medMens ? 'média' : 'informada'}</span></div><div><b>${inis.length}</b><span>${inis.length === 1 ? 'início registrado' : 'inícios registrados'}</span></div></div>
      ${
        ciclos.length
          ? `<div class="card" style="margin-top:10px"><b class="small">Últimos ciclos</b><div class="cic-hist">${ciclos
              .slice(0, 6)
              .map(
                (x) =>
                  `<div><span class="tiny dim">${fmtCurto(x.ini + 'T12:00:00')}</span><i style="width:${Math.min(100, (x.n / 45) * 100)}%"></i><b class="tiny">${x.n} dias</b></div>`,
              )
              .join(
                '',
              )}</div>${ciclos.some((x) => x.n < 21 || x.n > 35) ? '<p class="tiny" style="color:var(--warn);margin-top:8px">Algum ciclo ficou fora da faixa comum (21 a 35 dias). Se isso se repetir, vale conversar com o seu médico.</p>' : ''}</div>`
          : '<p class="small muted" style="margin-top:10px">Com dois ou mais inícios registrados aparece a duração de cada ciclo.</p>'
      }
      ${topS.length ? `<div class="card" style="margin-top:10px"><b class="small">Sintomas mais frequentes (90 dias)</b><div class="cic-hist">${topS.map(([k, n]) => `<div><span class="tiny dim">${esc(nomeSint(k))}</span><i style="width:${(n / maxS) * 100}%;background:${CIC_ROSA}"></i><b class="tiny">${n}x</b></div>`).join('')}</div></div>` : ''}</div>
    ${padroesCicloHTML(c, dias, prontsC, inf)}
    ${!inf.semFase ? hormoniosHTML(inf) : ''}
    ${autocuidadoHTML()}
    <div class="section"><div class="section-h"><h2 class="h2">Configurações</h2></div><div class="stack">
      <label class="list-item" style="cursor:pointer"><span class="ativ-ic">${I.bell}</span><div class="grow"><b>Lembretes do ciclo</b><div class="small muted">Aviso 2 dias antes da menstruação prevista e lembrete para registrar quando ela atrasar</div></div><input type="checkbox" id="cic-lemb" class="switch" ${c.lembretes ? 'checked' : ''}></label>
      <a class="list-item" href="#/ciclo/relatorio" style="color:inherit"><span class="ativ-ic">${I.hist || I.cal}</span><div class="grow"><b>Relatório para o médico</b><div class="small muted">Resumo dos ciclos e sintomas para salvar em PDF ou imprimir</div></div>${I.chev}</a>
      <a class="list-item" href="#/saude" style="color:inherit"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Editar ou desativar</b><div class="small muted">Duração do ciclo, situação e apagar os dados</div></div>${I.chev}</a>
    </div></div>`;
  const lb = document.getElementById('cic-lemb');
  if (lb)
    lb.onchange = async () => {
      const { error } = await sb.from('nx_ciclo').update({ lembretes: lb.checked }).eq('aluno_id', S.user.id);
      if (error) {
        lb.checked = !lb.checked;
        return toast('Não foi possível salvar.', true);
      }
      toast(lb.checked ? 'Lembretes do ciclo ativados.' : 'Lembretes do ciclo desativados.');
    };
  const rg = document.getElementById('cic-reg');
  if (rg) rg.onclick = () => registrarDiaCiclo(c, hj, () => viewCicloAluna(mesK));
  const bi = document.getElementById('cic-ini');
  if (bi) bi.onclick = () => abrirCiclo(c, () => viewCicloAluna(mesK));
  $app
    .querySelectorAll('.cic-d[data-dia]')
    .forEach(
      (b) => (b.onclick = () => registrarDiaCiclo(c, b.dataset.dia, () => viewCicloAluna(verAno ? 'ano' : mesK))),
    );
  bindAutocuidado();
}

/** visão do ano: 12 meses pequenos com menstruação registrada e prevista */
function anoCicloHTML(c, mensDias, porDia, inf) {
  const hj = hojeISO(),
    ano = +hj.slice(0, 4);
  const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `<div class="cic-ano">${MES.map((nm, mi) => {
    const d0 = new Date(ano, mi, 1, 12),
      off = (d0.getDay() + 6) % 7,
      n = new Date(ano, mi + 1, 0).getDate();
    const cel = Array.from({ length: off }, () => '<span></span>');
    for (let d = 1; d <= n; d++) {
      const k = `${ano}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const f = !inf.semFase ? cicloFaseDia(c, k) : null,
        mens = mensDias.has(k),
        prev = !mens && f && f.fase === 'menstrual' && k >= hj;
      cel.push(
        `<span class="${mens ? 'm' : prev ? 'p' : ''}${k === hj ? ' h' : ''}${porDia[k] && !mens ? ' r' : ''}">${d}</span>`,
      );
    }
    return `<a class="cic-mini" href="#/ciclo/${ano}-${String(mi + 1).padStart(2, '0')}"><b>${nm}</b><div>${cel.join('')}</div></a>`;
  }).join('')}</div>`;
}
/** padrões pessoais: em que dias do ciclo cada sintoma aparece e como ficam energia e prontidão em cada fase */
function padroesCicloHTML(c, dias, pronts, inf) {
  if (inf.semFase || !c.inicios || !c.inicios.length) return '';
  const cl = inf.ciclo || c.duracao_ciclo || 28;
  const porSint = {};
  dias.forEach((x) => {
    const f = cicloFaseDia(c, x.dia);
    if (!f || f.previsto) return;
    (x.sintomas || [])
      .filter((k) => !CIC_CUID.some((y) => y[0] === k))
      .forEach((k) => {
        (porSint[k] = porSint[k] || Array(cl).fill(0))[Math.min(cl, f.dia) - 1]++;
      });
  });
  const top = Object.entries(porSint)
    .map(([k, a]) => [k, a, a.reduce((s2, v) => s2 + v, 0)])
    .filter((x) => x[2] >= 2)
    .sort((a, b) => b[2] - a[2])
    .slice(0, 4);
  const fases = {};
  pronts.forEach((p) => {
    const f = cicloFaseDia(c, p.dia);
    if (!f || f.previsto) return;
    const g = (fases[f.fase] = fases[f.fase] || { n: 0, en: 0, tot: 0 });
    g.n++;
    g.en += p.energia;
    g.tot += p.total;
  });
  const comFase = Object.entries(fases).filter(([, g]) => g.n >= 3);
  if (!top.length && comFase.length < 2)
    return `<div class="section"><div class="section-h"><h2 class="h2">Seus padrões</h2></div><div class="card"><p class="small muted">Registre os sintomas e responda o check-in da manhã por alguns ciclos. Aqui vai aparecer em que dias do ciclo cada sintoma costuma vir e como fica a sua energia em cada fase.</p></div></div>`;
  const maxT = comFase.length ? Math.max(...comFase.map(([, g]) => g.tot / g.n)) : 20;
  const frase = (k, a) => {
    let best = 0;
    a.forEach((v, i) => {
      if (v > a[best]) best = i;
    });
    const ini = Math.max(0, best - 1),
      fim = Math.min(cl - 1, best + 1);
    return `costuma aparecer perto do dia ${best + 1} do ciclo${a[ini] && a[fim] && ini !== fim ? ` (dias ${ini + 1} a ${fim + 1})` : ''}`;
  };
  return `<div class="section"><div class="section-h"><h2 class="h2">Seus padrões</h2></div>
    ${
      top.length
        ? `<div class="card"><b class="small">Sintomas por dia do ciclo</b><p class="tiny dim" style="margin-top:2px">Quanto mais forte a cor, mais vezes você registrou naquele dia do ciclo.</p>
      ${top
        .map(([k, a]) => {
          const mx = Math.max(...a);
          return `<div class="cic-pad"><div class="row between"><span class="small"><b>${esc(nomeSint(k))}</b> · ${frase(k, a)}</span></div><div class="cic-pad-l">${a.map((v, i) => `<i style="opacity:${v ? 0.25 + 0.75 * (v / mx) : 0.08}" title="Dia ${i + 1}: ${v}x"></i>`).join('')}</div></div>`;
        })
        .join('')}
      <div class="row between tiny dim" style="margin-top:4px"><span>dia 1</span><span>dia ${cl}</span></div></div>`
        : ''
    }
    ${
      comFase.length >= 2
        ? `<div class="card" style="margin-top:10px"><b class="small">Sua prontidão em cada fase</b><p class="tiny dim" style="margin-top:2px">Média do check-in da manhã (de 4 a 20) nos dias de cada fase.</p>
      <div class="cic-hist">${['menstrual', 'folicular', 'ovulatoria', 'lutea']
        .filter((f) => fases[f] && fases[f].n >= 3)
        .map((f) => {
          const g = fases[f],
            v = g.tot / g.n;
          return `<div><span class="tiny dim">${FASES_CICLO[f][0].replace('Fase ', '')}</span><i style="width:${(v / maxT) * 100}%;background:${FASES_CICLO[f][1]}"></i><b class="tiny">${f1(v)}</b></div>`;
        })
        .join('')}</div>
      <p class="tiny dim" style="margin-top:8px">Isso é só o seu histórico. Cada mulher responde de um jeito ao ciclo, e é por isso que o treino é ajustado pelo que você sente.</p></div>`
        : ''
    }</div>`;
}
/** curva dos hormônios ao longo do ciclo, com a marca de hoje */
function hormoniosHTML(inf) {
  if (!inf || !inf.ciclo) return '';
  const cl = inf.ciclo,
    ov = cl - 14,
    W = 320,
    H = 120,
    x = (d) => 10 + ((d - 1) / (cl - 1)) * (W - 20);
  const g = (d, mu, sd) => Math.exp(-((d - mu) ** 2) / (2 * sd * sd));
  const est = (d) => 0.15 + 0.85 * g(d, ov - 1, 2.6) + 0.4 * g(d, ov + 7, 3.2),
    prog = (d) => 0.05 + 0.85 * g(d, ov + 7, 3.4) * (d > ov ? 1 : 0.15);
  const caminho = (fn) =>
    Array.from({ length: cl * 2 }, (_, i) => {
      const d = 1 + (i * (cl - 1)) / (cl * 2 - 1);
      return `${i ? 'L' : 'M'}${x(d).toFixed(1)} ${(H - 14 - fn(d) * (H - 30)).toFixed(1)}`;
    }).join(' ');
  const hx = x(Math.min(cl, inf.dia || 1));
  return `<div class="section"><div class="section-h"><h2 class="h2">Entenda o seu ciclo</h2></div><div class="card">
    <svg viewBox="0 0 ${W} ${H}" class="cic-horm" role="img" aria-label="Variação do estrogênio e da progesterona ao longo do ciclo">
      <rect x="10" y="${H - 10}" width="${x((inf.dm || 5) + 0.5) - 10}" height="4" rx="2" fill="${FASES_CICLO.menstrual[1]}"/>
      <rect x="${x(ov - 1)}" y="${H - 10}" width="${x(ov + 1) - x(ov - 1)}" height="4" rx="2" fill="${FASES_CICLO.ovulatoria[1]}"/>
      <path d="${caminho(est)}" fill="none" stroke="#35c3f0" stroke-width="3" stroke-linecap="round"/>
      <path d="${caminho(prog)}" fill="none" stroke="#8b6be8" stroke-width="3" stroke-linecap="round"/>
      <line x1="${hx}" x2="${hx}" y1="6" y2="${H - 12}" stroke="currentColor" stroke-dasharray="3 4" opacity=".6"/><text x="${hx}" y="12" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">hoje</text>
    </svg>
    <div class="cic-leg cal" style="margin-top:6px"><span><i style="background:#35c3f0"></i>Estrogênio</span><span><i style="background:#8b6be8"></i>Progesterona</span></div>
    <details class="ajuda" style="margin-top:10px"><summary>O que acontece em cada fase</summary>
      <p><b>Menstrual:</b> os dois hormônios estão baixos e o útero descama. Cólica e cansaço são mais comuns.</p>
      <p><b>Folicular:</b> o estrogênio sobe aos poucos até perto da ovulação. Muitas mulheres se sentem com mais energia.</p>
      <p><b>Ovulatória:</b> pico de estrogênio e liberação do óvulo, cerca de 14 dias antes da próxima menstruação.</p>
      <p><b>Lútea:</b> a progesterona sobe, a temperatura do corpo aumenta um pouco e, perto do fim, podem surgir sintomas de TPM.</p>
      <p class="tiny dim">Curva ilustrativa: os níveis reais variam de mulher para mulher. Com anticoncepcional hormonal esse padrão não acontece.</p></details>
  </div></div>`;
}
/** relatório para levar ao médico (salvar em PDF ou imprimir) */
function relatorioCiclo(c, inis, dias) {
  dockAluno();
  const hj = hojeISO(),
    lista = inis.slice().sort().reverse();
  const linhas = lista
    .slice(0, 8)
    .map((ini, i) => {
      const prox = lista[i - 1],
        dur = prox ? Math.round((dia(prox) - dia(ini)) / 864e5) : null;
      const seus = dias.filter((x) => x.dia >= ini && (!prox || x.dia < prox));
      let mens = 0;
      while (mens < 12 && seus.some((x) => x.dia === somaDias(ini, mens) && x.menstruada)) mens++;
      const flx = seus.map((x) => x.fluxo).filter(Boolean);
      const fMax = flx.includes('intenso') ? 'Intenso' : flx.includes('medio') ? 'Médio' : flx.length ? 'Leve' : '–';
      const col = seus.map((x) => x.colica_int).filter((v) => v != null);
      const colMax = col.length ? Math.max(...col) : null;
      return `<tr><td>${fmtCurto(ini + 'T12:00:00')}</td><td>${dur ? dur + ' dias' : 'em curso'}</td><td>${mens >= 2 ? mens + ' dias' : '–'}</td><td>${fMax}</td><td>${colMax != null ? colMax + '/10' : '–'}</td></tr>`;
    })
    .join('');
  const ult = dias.filter((x) => x.dia >= somaDias(hj, -180));
  const cont = {};
  ult.forEach((x) => (x.sintomas || []).forEach((k) => (cont[k] = (cont[k] || 0) + 1)));
  const sint = Object.entries(cont)
    .filter(([k]) => !CIC_CUID.some((y) => y[0] === k))
    .sort((a, b) => b[1] - a[1]);
  const rem = cont.remedio || 0;
  $app.innerHTML = `<a class="back no-print" href="#/ciclo">${I.back} Ciclo menstrual</a>
    <div class="cic-rel"><p class="eyebrow">Nexos Performance e Saúde</p><h1 class="h1" style="margin-top:4px">Relatório do ciclo menstrual</h1>
      <p class="small muted" style="margin-top:6px">${esc(S.me.nome || '')} · gerado em ${fmtCurto(hj + 'T12:00:00')} · situação informada: ${esc((SIT_CICLO.find((x) => x[0] === c.situacao) || [, ''])[1].toLowerCase())}</p>
      <h2 class="h3" style="margin-top:18px">Ciclos registrados</h2>
      ${linhas ? `<table class="cic-tab"><thead><tr><th>Início</th><th>Duração do ciclo</th><th>Menstruação</th><th>Fluxo máximo</th><th>Cólica máxima</th></tr></thead><tbody>${linhas}</tbody></table>` : '<p class="small muted">Nenhum início registrado ainda.</p>'}
      <h2 class="h3" style="margin-top:18px">Sintomas nos últimos 6 meses</h2>
      ${sint.length ? `<p class="small">${sint.map(([k, n]) => `${esc(nomeSint(k))} (${n} ${n === 1 ? 'dia' : 'dias'})`).join(' · ')}</p>` : '<p class="small muted">Nenhum sintoma registrado.</p>'}
      ${rem ? `<p class="small" style="margin-top:6px">Uso de remédio para dor registrado em ${rem} ${rem === 1 ? 'dia' : 'dias'}.</p>` : ''}
      <p class="tiny dim" style="margin-top:18px">Dados registrados pela própria aluna no app da Nexos. Não substitui avaliação médica.</p></div>
    <button class="btn block no-print" id="rel-imp" style="margin-top:16px">Salvar em PDF ou imprimir</button>`;
  document.getElementById('rel-imp').onclick = () => window.print();
}
function autocuidadoHTML() {
  return `<div class="section" id="cic-auto"><div class="section-h"><h2 class="h2">Autocuidado</h2></div>
    <div class="cic-rots">${Object.entries(ROTINAS_CICLO)
      .map(
        ([k, r]) =>
          `<button type="button" class="cic-rot" data-rot="${k}"><span class="cic-rot-ic">${I.play}</span><b>${esc(r.t)}</b><small>${esc(r.d)}</small></button>`,
      )
      .join('')}</div>
    <div class="stack" style="margin-top:12px">${DICAS_CICLO.map(([t, d]) => `<details class="ajuda cic-dica"><summary>${esc(t)}</summary><p>${esc(d)}</p></details>`).join('')}</div></div>`;
}
function bindAutocuidado() {
  $app.querySelectorAll('[data-rot]').forEach((b) => (b.onclick = () => abrirRotina(b.dataset.rot)));
}

/* ---------- aba Conexões (aluno): relógios e apps ---------- */
async function viewConexoes(ret) {
  loading();
  dockAluno();
  const integs = await sb
    .from('nx_integracoes')
    .select('provedor,athlete_id,ultima_sync,erro,conectado_em,escopo')
    .eq('user_id', S.user.id)
    .in('provedor', ['intervals', 'garmin'])
    .then((r) => r.data || [])
    .catch(() => []);
  const integ = integs.find((x) => x.provedor === 'intervals') || null,
    garm = integs.find((x) => x.provedor === 'garmin') || null;
  let marcaInt = null;
  try {
    marcaInt = localStorage.getItem('nx-marca');
  } catch {}
  if (!MARCA_NOME[marcaInt] || marcaInt === 'garmin' || marcaInt === 'outro') marcaInt = null;
  if (ret) {
    const ok = /ok$/.test(ret),
      g = ret.startsWith('garmin');
    toast(
      g
        ? ok
          ? 'Garmin conectado! Suas corridas chegam sozinhas e os treinos vão para o relógio.'
          : 'Não foi possível conectar o Garmin. Tente de novo.'
        : ok
          ? 'Intervals.icu conectado! Buscando suas corridas…'
          : 'Não foi possível conectar o Intervals.icu.',
      !ok,
    );
    history.replaceState(null, '', location.pathname + '#/conexoes');
  }
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""></div><a class="perfil-btn" href="#/perfil">${I.user}<span>Editar perfil</span></a></div>
    <p class="eyebrow">Conexões</p><h1 class="h1">Seus aparelhos</h1>
    <p class="muted" style="margin-top:6px">Conecte o seu relógio uma vez: as corridas entram sozinhas no app${garm ? ' e os treinos da planilha vão para o relógio' : ''}.</p>
    <div class="section"><div class="section-h"><h2 class="h2">Seu relógio</h2>${slashes}</div><p class="small muted" style="margin:-4px 0 12px">Toque na marca do seu relógio.</p>
      <div class="marcas">${MARCAS.map(([k, nome]) => {
        const on = (k === 'garmin' && garm) || (k !== 'garmin' && k !== 'outro' && integ && marcaInt === k);
        return `<button type="button" class="marca${on ? ' on' : ''}" data-marca="${k}">${marcaLogo(k, nome)}${on ? '<span class="marca-ok">Conectado ✓</span>' : ''}</button>`;
      }).join('')}</div>
      ${garm || integ ? `<div class="stack" style="margin-top:12px">${garm ? `<div id="garmin-box">${garminCardHTML(garm, false)}</div>` : ''}${integ ? `<div id="intervals-box">${intervalsCardHTML(integ, false).replace('Intervals.icu conectado ✓', `${esc(MARCA_NOME[marcaInt] || 'Relógio')} conectado ✓ <span class="tiny dim">pelo Intervals.icu</span>`)}</div>` : ''}</div>` : ''}
    </div>
    <div class="section"><a class="gps-cta" href="#/gps"><span class="gps-cta-ic">${I.run}</span><div class="grow"><b>Não tem relógio compatível com a Nexos?</b><span>Faça o treino da sua planilha pelo celular, com GPS, aviso de cada parte e registro automático.</span></div>${I.chev}</a></div>
    <div class="section"><div class="section-h"><h2 class="h2">Sem conexão?</h2>${slashes}</div><button class="list-item" id="cx-arq" style="width:100%;text-align:left"><span class="ativ-ic">${I.plus}</span><div class="grow"><b>Enviar o arquivo do relógio</b><div class="small muted">.FIT, .GPX ou .TCX, ou digite distância e tempo</div></div>${I.chev}</button></div>
    <div class="section"><div class="section-h"><h2 class="h2">Instalar o aplicativo</h2>${slashes}</div><p class="small muted" style="margin:-4px 0 10px">Tenha a Nexos na tela de início do celular, abrindo como um aplicativo e recebendo notificações.</p><div id="inst-box">${instalarHTML()}</div></div>`;
  bindInstalar($app);
  const recarregar = () => viewConexoes();
  if (document.getElementById('garmin-box')) bindGarmin(document.getElementById('garmin-box'), recarregar);
  if (document.getElementById('intervals-box'))
    bindIntervals(document.getElementById('intervals-box'), integ, false, S.user.id, recarregar);
  $app
    .querySelectorAll('[data-marca]')
    .forEach((b) => (b.onclick = () => abrirMarca(b.dataset.marca, garm, integ, marcaInt, recarregar)));
  document.getElementById('cx-arq').onclick = () =>
    registrarCorrida(S.user.id, (id) => {
      location.hash = '#/corrida/' + id;
    });
  if (integ && (!integ.ultima_sync || Date.now() - new Date(integ.ultima_sync) > 30 * 60000))
    sincronizarIntervals(S.user.id)
      .then((n) => {
        if (n > 0) toast(`${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''} do relógio`);
      })
      .catch(() => {});
}
