/* ---------- ritmo no calor: sugestão para o treinador aplicar ou dispensar ----------
   O servidor (nx-vespera, 20h30) cruza o treino de amanhã com a previsão na hora em que o aluno costuma correr
   (conta sugestaoCalor, bloco ritmocalor:puro). O treinador vê aqui, em números para o aluno, e decide.
   A planilha e o treino do relógio nunca mudam; o aluno só vê depois que o treinador aplica. */
const SUG_NIVEL = { atencao: 'Atenção', moderado: 'Calor moderado', alto: 'Calor alto', extremo: 'Calor extremo' };
const durCurta = (seg) => {
  const s = Math.round(seg / 5) * 5,
    m = Math.floor(s / 60),
    x = s % 60;
  return m ? (x ? `${m} min ${x} s` : `${m} min`) : `${x} s`;
};
/** a sugestão em números para este aluno (pelas zonas dele) */
function sugCalorLinhas(sg, estrutura, perfil) {
  const est = estrutura || [];
  const linhas = [];
  const pace = (v) => fmtPace(v).replace('/km', '');
  if (sg.modo === 'ritmo' || sg.modo === 'pausa') {
    // partes contínuas (fora dos tiros), cada zona uma vez
    const zs = [];
    est.forEach((s) => {
      if (s && s.k !== 'rep' && s.k !== 'ca' && s.z && !zs.includes(s.z)) zs.push(s.z);
    });
    zs.forEach((z) => {
      const [a, b] = faixaZona(z, perfil);
      const [lo, hi] = sg.pct || [0, 0];
      const nome = (ZONAS_INFO[z] && ZONAS_INFO[z].d) || z;
      linhas.push(`${nome}: ${pace(a)}–${pace(b)} → <b>${pace(a * (1 + lo))}–${pace(b * (1 + hi))}</b> /km`);
    });
  }
  if (sg.modo === 'pausa') {
    est
      .filter((s) => s && s.k === 'rep')
      .forEach((r) =>
        (r.passos || [])
          .filter((p) => (p.k === 'rc' || p.k === 'ca') && p.med === 'min')
          .forEach((p) =>
            linhas.push(
              `Recuperação entre os tiros: ${durCurta(p.v * 60)} → <b>${durCurta(p.v * 60 * (1 + sg.pausa))}</b>`,
            ),
          ),
      );
    if (!linhas.some((l) => /Recuperação/.test(l))) linhas.push('Recuperação entre os tiros: <b>mais longa</b>');
  }
  return [...new Set(linhas)];
}
const sugDiaTxt = (d) =>
  d === hojeISO() ? 'hoje' : d === somaDias(hojeISO(), 1) ? 'amanhã' : fmtData(d + 'T12:00:00');

/** treinador: seção na Hoje com as sugestões pendentes dos seus alunos */
async function calorSugEquipe(ids, porId) {
  const box = document.getElementById('calor-sug');
  if (!box || !ids.length) return;
  const { data: sugs } = await sb
    .from('nx_sugestoes_calor')
    .select('id,aluno_id,plano_id,data,sugestao')
    .eq('org_id', S.org.id)
    .eq('status', 'pendente')
    .in('aluno_id', ids)
    .gte('data', hojeISO())
    .order('data')
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  if (!sugs || !sugs.length || !document.getElementById('calor-sug')) return;
  const [{ data: planos }, { data: membros }] = await Promise.all([
    sb
      .from('nx_plano_corrida')
      .select('id,titulo,tipo,estrutura')
      .in(
        'id',
        sugs.map((s) => s.plano_id),
      ),
    sb
      .from('nx_membros')
      .select('user_id,nome,corrida,nascimento,sexo')
      .eq('org_id', S.org.id)
      .in('user_id', [...new Set(sugs.map((s) => s.aluno_id))]),
  ]);
  const pl = Object.fromEntries((planos || []).map((p) => [p.id, p]));
  const mb = Object.fromEntries((membros || []).map((m) => [m.user_id, m]));
  box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Ritmo no calor</h2><span class="tag acc">${sugs.length}</span></div>
    <p class="small muted" style="margin:-4px 0 10px">Sugestões do app pela previsão na hora em que cada aluno costuma correr. A planilha não muda: se aplicar, o aluno vê a orientação no treino do dia.</p>
    <div class="stack">${sugs
      .map((s) => {
        const p = pl[s.plano_id] || {},
          m = mb[s.aluno_id] || porId[s.aluno_id] || { nome: 'Aluno' },
          sg = s.sugestao || {};
        const linhas = sugCalorLinhas(sg, estruturaDe(p), perfilCorrida(m));
        return `<div class="card" data-sugc="${s.id}"><div class="row between" style="gap:8px"><b class="ellip">${esc(m.nome)}</b><span class="tag ${sg.nivel === 'alto' || sg.nivel === 'extremo' ? 'bad' : 'warn'}">${esc(SUG_NIVEL[sg.nivel] || 'Calor')}</span></div>
          <p class="small muted" style="margin-top:2px">${esc(p.titulo || 'Treino')} · ${sugDiaTxt(s.data)}${sg.cidade ? ' · ' + esc(sg.cidade) : ''}</p>
          <p class="small" style="margin-top:8px">${esc(sg.texto || '')}</p>
          ${linhas.length ? `<ul class="small" style="margin:8px 0 0 18px;display:grid;gap:4px">${linhas.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}
          <div class="row" style="gap:8px;margin-top:12px"><button class="btn sm" data-sugc-ok="${s.id}">${I.check} Aplicar</button><button class="btn sm ghost" data-sugc-nao="${s.id}">Dispensar</button></div></div>`;
      })
      .join('')}</div></div>`;
  box.onclick = async (e) => {
    const b = e.target.closest('[data-sugc-ok],[data-sugc-nao]');
    if (!b) return;
    const id = b.dataset.sugcOk || b.dataset.sugcNao,
      ok = !!b.dataset.sugcOk;
    b.disabled = true;
    const { error } = await sb
      .from('nx_sugestoes_calor')
      .update({
        status: ok ? 'aplicada' : 'dispensada',
        decidido_por: S.user.id,
        decidido_em: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      b.disabled = false;
      return toast('Não foi possível salvar. Tente de novo.', true);
    }
    toast(ok ? 'Aplicada. O aluno vê a orientação no treino do dia.' : 'Sugestão dispensada.');
    const c = box.querySelector(`[data-sugc="${id}"]`);
    if (c) c.remove();
    const tag = box.querySelector('.section-h .tag');
    const rest = box.querySelectorAll('[data-sugc]').length;
    if (!rest) box.innerHTML = '';
    else if (tag) tag.textContent = rest;
  };
}

/** aluno: orientação do treinador para o calor no treino do dia (só as que o treinador aplicou) */
async function calorSugAluno(planoIds, perfil) {
  if (!planoIds.length) return;
  const [{ data: sugs }, { data: pr }] = await Promise.all([
    sb
      .from('nx_sugestoes_calor')
      .select('plano_id,sugestao')
      .in('plano_id', planoIds)
      .eq('status', 'aplicada')
      .then(
        (r) => r,
        () => ({ data: [] }),
      ),
    sb
      .from('nx_prontidao')
      .select('sono')
      .eq('aluno_id', S.user.id)
      .eq('dia', hojeISO())
      .maybeSingle()
      .then(
        (r) => r,
        () => ({ data: null }),
      ),
  ]);
  (sugs || []).forEach((s) => {
    const el = document.querySelector(`[data-sugcalor="${s.plano_id}"]`);
    if (!el) return;
    const sg = s.sugestao || {};
    const linhas = sugCalorLinhas(sg, JSON.parse(el.dataset.est || '[]'), perfil);
    const sono = pr && pr.sono != null && pr.sono <= 2;
    el.innerHTML = `<div class="sug-calor-box"><b>Orientação do treinador para o calor</b>
      <p class="small" style="margin-top:6px">${esc(sg.texto || '')}</p>
      ${linhas.length ? `<ul class="small" style="margin:6px 0 0 18px;display:grid;gap:4px">${linhas.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}
      ${sono ? '<p class="small muted" style="margin-top:6px">Você contou no check-in que dormiu mal. Hoje, vá ainda mais pelo esforço e pela frequência cardíaca do que pelo relógio.</p>' : ''}
      <p class="tiny dim" style="margin-top:6px">A planilha continua a mesma. É só para o calor de hoje.</p></div>`;
  });
}
