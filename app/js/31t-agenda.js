/* Nexos App · Agenda do aluno com o treinador: videochamada (mensal ou avulsa), avaliação física, treino presencial e outros.
   Equipe: calendário do mês, agendar com o aluno, remarcar, cancelar e ligar. Aluno: vê as chamadas e confirma a presença.
   Avisos e lembretes (manhã do dia e 15 min antes) saem da função nx-agenda. Cartões na Hoje dos dois lados. */

/* agenda:puro:inicio */
const AG_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const AG_SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const agPad = (n) => String(n).padStart(2, '0');
const agDiaIso = (d) => `${d.getFullYear()}-${agPad(d.getMonth() + 1)}-${agPad(d.getDate())}`;
const agHora = (d) => `${agPad(d.getHours())}:${agPad(d.getMinutes())}`;
/** quanto falta, em texto curto: "faltam 3 dias", "faltam 2 h 10 min", "começa em 8 min", "agora" */
function agFalta(ini, agora) {
  const min = Math.round((ini - agora) / 60000);
  if (min <= 0) return 'agora';
  if (min < 60) return `começa em ${min} min`;
  const d0 = new Date(agora),
    d1 = new Date(ini);
  const dias = Math.round(
    (new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()) -
      new Date(d0.getFullYear(), d0.getMonth(), d0.getDate())) /
      864e5,
  );
  if (dias >= 2) return `faltam ${dias} dias`;
  if (dias === 1) return 'amanhã';
  const h = Math.floor(min / 60),
    m = min % 60;
  return `faltam ${h} h${m ? ` ${m} min` : ''}`;
}
/** em que fase a chamada está: 'longe' (mais de 7 dias), 'semana', 'hoje', 'ja' (10 min antes até o fim), 'passou' */
function agFase(a, agora) {
  const ini = Date.parse(a.inicio),
    fim = ini + (a.duracao_min || 30) * 60000;
  if (agora > fim) return 'passou';
  if (agora >= ini - 10 * 60000) return 'ja';
  if (agDiaIso(new Date(ini)) === agDiaIso(new Date(agora))) return 'hoje';
  if (ini - agora <= 7 * 864e5) return 'semana';
  return 'longe';
}
/** semanas do mês para o calendário (segunda a domingo), com as chamadas de cada dia */
function agCalendario(comp, ags) {
  const [y, m] = comp.split('-').map(Number);
  const ult = new Date(y, m, 0).getDate();
  const ini = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const porDia = {};
  ags.forEach((a) => (porDia[agDiaIso(new Date(a.inicio))] = porDia[agDiaIso(new Date(a.inicio))] || []).push(a));
  const cel = [];
  for (let i = 0; i < ini; i++) cel.push(null);
  for (let d = 1; d <= ult; d++) {
    const iso = `${y}-${agPad(m)}-${agPad(d)}`;
    cel.push({ iso, dia: d, ags: (porDia[iso] || []).sort((a, b) => (a.inicio < b.inicio ? -1 : 1)) });
  }
  while (cel.length % 7) cel.push(null);
  const sem = [];
  for (let i = 0; i < cel.length; i += 7) sem.push(cel.slice(i, i + 7));
  return sem;
}
/* agenda:puro:fim */

const AG_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M10 14.5l2 1.5 3-3"/></svg>';
const AG_CAM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="m16 10 6-3v10l-6-3"/></svg>';
// tipos de compromisso (coluna categoria)
const AG_CAT = {
  video_mensal: { nome: 'Videochamada mensal', video: true },
  video: { nome: 'Videochamada', video: true },
  avaliacao: { nome: 'Avaliação física' },
  presencial: { nome: 'Treino presencial' },
  outro: { nome: 'Compromisso' },
};
// motivos prontos (o treinador escolhe um e detalha na pauta)
const AG_MOTIVOS = [
  'Resumo do mês',
  'Ajuste da planilha',
  'Preparação para prova',
  'Retorno da avaliação física',
  'Retorno da análise biomecânica',
  'Acompanhamento de dor ou lesão',
  'Recuperação, sono e rotina',
  'Alimentação e hidratação nos treinos',
  'Objetivos e metas',
  'Boas-vindas e início do acompanhamento',
  'Teste de desempenho',
];
const AG_MOTIVO_PADRAO = {
  video_mensal: 'Resumo do mês',
  avaliacao: 'Retorno da avaliação física',
  presencial: 'Treino técnico',
};
// bloco do motivo e da pauta, para o aluno entender por que vai conversar
const agMotivoHTML = (a, cls = 'ag-mot') =>
  a.motivo || a.obs
    ? `<div class="${cls}"><span>Motivo</span><b>${esc(a.motivo || 'Conversa com o treinador')}</b>${a.obs ? `<p>${esc(a.obs)}</p>` : ''}</div>`
    : '';
const agCat = (a) => AG_CAT[a.categoria] || AG_CAT.video_mensal;
const agVideo = (a) => !!agCat(a).video;
const agNome = (a) => (a.categoria === 'outro' && a.titulo ? a.titulo : agCat(a).nome);
const agIc = (a) =>
  agVideo(a) ? AG_CAM : a.categoria === 'presencial' ? I.run : a.categoria === 'avaliacao' ? I.check : AG_IC;
const agQuando = (iso) => {
  const d = new Date(iso);
  return `${AG_SEM[d.getDay()]}, ${d.getDate()} de ${AG_MESES[d.getMonth()]} às ${agHora(d)}`;
};
const agFunc = (body) =>
  sb.functions.invoke('nx-agenda', { body }).then(
    (r) => r,
    (e) => ({ error: e }),
  );
async function agBuscar(de, ate, alunoId) {
  let q = sb
    .from('nx_agenda')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('status', 'agendada')
    .gte('inicio', de)
    .lt('inicio', ate)
    .order('inicio');
  if (alunoId) q = q.eq('aluno_id', alunoId);
  const { data } = await q.then(
    (r) => r,
    () => ({ data: [] }),
  );
  return data || [];
}
// eventos e treinões da Nexos (aparecem na agenda de todos, só para ver)
async function agEventos(de, ate) {
  const { data } = await sb
    .from('nx_eventos')
    .select('id,titulo,data,hora,local,tipo')
    .eq('org_id', S.org.id)
    .gte('data', de.slice(0, 10))
    .lt('data', ate.slice(0, 10))
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  return (data || []).map((e) => ({
    evento: true,
    id: 'ev-' + e.id,
    titulo: e.titulo,
    local: e.local,
    inicio: new Date(`${e.data}T${(e.hora || '07:00').slice(0, 5)}:00`).toISOString(),
    duracao_min: 60,
  }));
}
async function agAlunos() {
  const { data } = await sb
    .from('nx_membros')
    .select('user_id,nome,foto_url,telefone,treinador_id,ativo,aprovacao,email')
    .eq('org_id', S.org.id)
    .eq('papel', 'aluno')
    .eq('ativo', true)
    .order('nome');
  return (data || []).filter((m) => m.aprovacao !== 'pendente' && !/^aluno\.teste/i.test(m.email || ''));
}

// tela da agenda (#/agenda e #/agenda/AAAA-MM)
async function viewAgenda(compArg) {
  loading();
  const st = S.cache.agenda || (S.cache.agenda = { comp: compDe(), sel: hojeISO() });
  if (/^\d{4}-\d{2}$/.test(compArg || '')) st.comp = compArg;
  const [y, m] = st.comp.split('-').map(Number);
  const de = new Date(y, m - 1, 1).toISOString(),
    ate = new Date(y, m, 1).toISOString();
  const staff = S.staff;
  const deL = agDiaIso(new Date(y, m - 1, 1)) + 'T00',
    ateL = agDiaIso(new Date(y, m, 1)) + 'T00';
  const [agsC, alunos, proximas, evs] = await Promise.all([
    agBuscar(de, ate, staff ? null : S.user.id),
    staff ? agAlunos() : Promise.resolve([]),
    agBuscar(new Date(Date.now() - 3 * 3600e3).toISOString(), '2100-01-01', staff ? null : S.user.id),
    agEventos(deL, ateL),
  ]);
  const ags = [...agsC, ...evs].sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  const porId = Object.fromEntries(alunos.map((a) => [a.user_id, a]));
  const equipe = staff ? [] : await carregarEquipe().catch(() => []);
  const nomeTr = (id) => firstName(((equipe || []).find((p) => p.user_id === id) || {}).nome || '') || 'seu treinador';
  const cal = agCalendario(st.comp, ags);
  if (!st.sel.startsWith(st.comp)) st.sel = st.comp === compDe() ? hojeISO() : st.comp + '-01';
  const doDia = ags.filter((a) => agDiaIso(new Date(a.inicio)) === st.sel);
  const hoje = hojeISO();
  const item = (a) => {
    if (a.evento)
      return `<a class="ag-it ag-ev" href="#/eventos" style="color:inherit;text-decoration:none"><div class="ag-hora"><b>${agHora(new Date(a.inicio))}</b><small>evento</small></div><div class="grow" style="min-width:0"><b>${esc(a.titulo)}</b><div class="small muted" style="margin-top:4px">Evento da Nexos${a.local ? ` · ${esc(a.local)}` : ''}</div></div>${I.chev}</a>`;
    const al = porId[a.aluno_id] || { nome: 'Aluno' };
    const fase = agFase(a, Date.now());
    return `<div class="ag-it ${fase === 'ja' ? 'ja' : ''}" data-ag="${a.id}">
      <div class="ag-hora"><b>${agHora(new Date(a.inicio))}</b><small>${a.duracao_min} min</small></div>
      <div class="grow" style="min-width:0">${staff ? `<div class="row" style="gap:8px;align-items:center">${avAluno(al, 'sm')}<b class="ellip">${esc(al.nome)}</b></div>` : `<b>${esc(agNome(a))} com ${esc(nomeTr(a.treinador_id))}</b>`}
        <div class="small muted" style="margin-top:4px"><span class="ag-cat">${agIc(a)}${esc(staff ? agNome(a) : agVideo(a) ? 'pelo app' : a.local || 'presencial')}</span>${staff && a.local && !agVideo(a) ? ` · ${esc(a.local)}` : ''} · ${a.confirmado_em ? '<span class="ag-ok">presença confirmada</span>' : '<span class="ag-pend">aguardando confirmação</span>'}</div>
        ${agMotivoHTML(a)}
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${
          staff
            ? `${agVideo(a) ? `<button type="button" class="btn sm" data-ag-ligar="${a.id}">${AG_CAM} Ligar</button>` : ''}<button type="button" class="btn ghost sm" data-ag-ed="${a.id}">Remarcar ou cancelar</button>${a.categoria === 'video_mensal' ? `<a class="btn ghost sm" href="#/aluno/${a.aluno_id}/relmes">Resumo do mês</a>` : a.categoria === 'avaliacao' ? `<a class="btn ghost sm" href="#/aluno/${a.aluno_id}/avaliacoes">Avaliações</a>` : ''}`
            : a.confirmado_em
              ? ''
              : `<button type="button" class="btn sm" data-ag-conf="${a.id}">Confirmar presença</button>`
        }</div></div></div>`;
  };
  const prox = proximas.filter((a) => agFase(a, Date.now()) !== 'passou').slice(0, staff ? 6 : 3);
  $app.innerHTML = `<p class="eyebrow">Nexos</p><h1 class="h1">Agenda</h1>
    <p class="muted small" style="margin-top:6px">${staff ? 'Videochamadas, avaliações, treinos presenciais e outros compromissos com os alunos. Toque num dia para ver ou agendar: o aluno recebe o aviso na hora e os lembretes no dia.' : 'Os seus compromissos com o treinador e os eventos da Nexos. Você recebe um lembrete no dia.'}</p>
    ${staff ? `<button type="button" class="btn block" id="ag-novo" style="margin-top:14px">${AG_IC} Agendar</button>` : ''}
    <div class="card ag-cal">
      <div class="ag-cal-top"><button class="icon-btn sm" id="ag-a" aria-label="Mês anterior">${I.back}</button><b>${AG_MESES[m - 1]} ${y}</b><button class="icon-btn sm" id="ag-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
      <div class="ag-sem">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<span>${d}</span>`).join('')}</div>
      ${cal
        .map(
          (w) =>
            `<div class="ag-sem">${w
              .map((c) =>
                c
                  ? `<button type="button" class="ag-d ${c.iso === st.sel ? 'sel' : ''} ${c.iso === hoje ? 'hoje' : ''} ${c.iso < hoje ? 'pass' : ''}" data-ag-dia="${c.iso}"><span>${c.dia}</span>${
                      c.ags.length
                        ? `<i class="ag-pts">${c.ags
                            .slice(0, 3)
                            .map((a) => `<em class="${a.evento ? 'ev' : a.confirmado_em ? 'ok' : ''}"></em>`)
                            .join('')}</i>`
                        : ''
                    }</button>`
                  : '<span class="ag-d vazio"></span>',
              )
              .join('')}</div>`,
        )
        .join('')}
      <div class="ag-leg"><span><em class="ok"></em>confirmado</span><span><em></em>aguardando confirmação</span><span><em class="ev"></em>evento da Nexos</span></div>
    </div>
    <div class="ag-dia-h"><b>${(() => {
      const d = new Date(st.sel + 'T12:00:00');
      const t = `${AG_SEM[d.getDay()]}, ${d.getDate()} de ${AG_MESES[d.getMonth()]}`;
      return t[0].toUpperCase() + t.slice(1);
    })()}</b>${staff && st.sel >= hoje ? `<button type="button" class="link-btn small" id="ag-novo-dia">+ Agendar neste dia</button>` : ''}</div>
    <div class="stack">${doDia.length ? doDia.map(item).join('') : '<p class="small muted">Nada agendado neste dia.</p>'}</div>
    ${prox.length ? `<p class="sec-lbl" style="margin-top:20px">Próximas</p><div class="stack">${prox.map((a) => `<button type="button" class="list-item ag-prox" data-ag-ir="${agDiaIso(new Date(a.inicio))}"><span class="ativ-ic">${agIc(a)}</span><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${staff ? `${esc((porId[a.aluno_id] || { nome: 'Aluno' }).nome)} · ${esc(agNome(a))}` : `${esc(agNome(a))} com ${esc(nomeTr(a.treinador_id))}`}</b><div class="small muted">${a.motivo ? `${esc(a.motivo)} · ` : ''}${esc(agQuando(a.inicio))} · ${agFalta(Date.parse(a.inicio), Date.now())}</div></div>${a.confirmado_em ? '<span class="tag ok">Confirmado</span>' : '<span class="tag">Aguardando</span>'}</button>`).join('')}</div>` : ''}`;
  if (staff) dockStaff();
  const re = () => viewAgenda();
  $app.querySelector('#ag-a').onclick = () => {
    st.comp = somaMes(st.comp, -1);
    re();
  };
  $app.querySelector('#ag-p').onclick = () => {
    st.comp = somaMes(st.comp, 1);
    re();
  };
  $app.querySelectorAll('[data-ag-dia]').forEach(
    (b) =>
      (b.onclick = () => {
        st.sel = b.dataset.agDia;
        re();
      }),
  );
  $app.querySelectorAll('[data-ag-ir]').forEach(
    (b) =>
      (b.onclick = () => {
        st.sel = b.dataset.agIr;
        st.comp = b.dataset.agIr.slice(0, 7);
        re();
      }),
  );
  const bn = $app.querySelector('#ag-novo'),
    bnd = $app.querySelector('#ag-novo-dia');
  if (bn) bn.onclick = () => agFormulario(null, alunos, st.sel >= hoje ? st.sel : hoje, re);
  if (bnd) bnd.onclick = () => agFormulario(null, alunos, st.sel, re);
  $app.querySelectorAll('[data-ag-ed]').forEach(
    (b) =>
      (b.onclick = () =>
        agFormulario(
          ags.find((a) => a.id === b.dataset.agEd),
          alunos,
          null,
          re,
        )),
  );
  $app.querySelectorAll('[data-ag-ligar]').forEach(
    (b) =>
      (b.onclick = () => {
        const a = ags.find((x) => x.id === b.dataset.agLigar);
        const al = porId[a.aluno_id];
        if (al) iniciarVideochamada({ ...al, user_id: a.aluno_id }, b);
      }),
  );
  $app.querySelectorAll('[data-ag-conf]').forEach((b) => (b.onclick = () => agConfirmar(b.dataset.agConf, b, re)));
}

async function agConfirmar(id, b, depois) {
  b.disabled = true;
  b.textContent = 'Confirmando…';
  const { data, error } = await agFunc({ acao: 'confirmar', id });
  if (error || (data && data.erro)) {
    b.disabled = false;
    b.textContent = 'Confirmar presença';
    return toast((data && data.erro) || 'Não foi possível confirmar agora.', true);
  }
  toast('Presença confirmada! O seu treinador foi avisado.');
  if (depois) depois();
}

// agendar ou remarcar: aluno, dia, hora, duração e tipo
function agFormulario(a, alunos, dia, depois) {
  const ed = !!a;
  const d0 = a ? new Date(a.inicio) : null;
  const meus = alunos.filter(ehMeuAluno),
    outros = alunos.filter((x) => !ehMeuAluno(x));
  const opt = (x) =>
    `<option value="${x.user_id}" ${a && a.aluno_id === x.user_id ? 'selected' : ''}>${esc(x.nome)}</option>`;
  openSheet(
    `<p class="eyebrow">Agenda</p><h2 class="h2">${ed ? 'Remarcar ou cancelar' : 'Agendar'}</h2>
    <form id="ag-f" class="stack" style="margin-top:14px;gap:12px">
      <label class="field"><span>O que é</span><select class="input" name="cat">${Object.entries(AG_CAT)
        .map(
          ([k, c]) =>
            `<option value="${k}" ${(a ? a.categoria : 'video_mensal') === k ? 'selected' : ''}>${k === 'video_mensal' ? 'Videochamada mensal (resumo do mês)' : k === 'outro' ? 'Outro compromisso' : c.nome}</option>`,
        )
        .join('')}</select></label>
      <label class="field" id="ag-tit-c"><span>Título</span><input class="input" name="titulo" maxlength="60" placeholder="Ex.: Teste de 5 km na pista" value="${esc((a && a.titulo) || '')}"></label>
      <label class="field" id="ag-loc-c"><span>Local</span><input class="input" name="local" maxlength="80" placeholder="Ex.: Lagoa da Jansen, em frente ao quiosque" value="${esc((a && a.local) || '')}"></label>
      <label class="field"><span>Aluno</span><select class="input" name="aluno" required ${ed ? 'disabled' : ''}><option value="">Escolha o aluno</option>${meus.length ? `<optgroup label="Seus alunos">${meus.map(opt).join('')}</optgroup>` : ''}${outros.length ? `<optgroup label="Outros alunos">${outros.map(opt).join('')}</optgroup>` : ''}</select></label>
      <div class="grid2" style="gap:10px"><label class="field"><span>Dia</span><input class="input" type="date" name="dia" required min="${hojeISO()}" value="${d0 ? agDiaIso(d0) : dia || hojeISO()}"></label>
      <label class="field"><span>Hora</span><input class="input" type="time" name="hora" required step="300" value="${d0 ? agHora(d0) : '19:00'}"></label></div>
      <div class="grid2" style="gap:10px"><label class="field"><span>Duração</span><select class="input" name="dur">${[20, 30, 45, 60, 90, 120].map((n) => `<option value="${n}" ${(a ? a.duracao_min : 30) === n ? 'selected' : ''}>${n < 60 ? n + ' min' : n / 60 + ' h'}</option>`).join('')}</select></label>
      <span></span></div>
      <label class="field"><span>Motivo</span><select class="input" name="motivo">${[
        ...new Set([
          ...(a && a.motivo && !AG_MOTIVOS.includes(a.motivo) ? [a.motivo] : []),
          ...AG_MOTIVOS,
          'Treino técnico',
        ]),
      ]
        .map((x) => `<option ${a && a.motivo === x ? 'selected' : ''}>${esc(x)}</option>`)
        .join('')}<option value="__outro">Outro motivo…</option></select></label>
      <label class="field" id="ag-mot-c" hidden><span>Qual o motivo</span><input class="input" name="motivo_txt" maxlength="60" placeholder="Ex.: Plano de férias"></label>
      <label class="field"><span>Pauta: o que vocês vão ver (o aluno lê antes)</span><textarea class="textarea" name="obs" rows="3" maxlength="400" placeholder="Ex.: ver juntos o resumo de novembro, ajustar os longões para a meia e combinar a semana de polimento.">${esc((a && a.obs) || '')}</textarea></label>
      <p class="tiny dim">${ed ? 'Se mudar o dia ou a hora, o aluno recebe o aviso da nova data e confirma de novo.' : 'O aluno recebe a notificação na hora, com o pedido para confirmar a presença, e os lembretes no dia.'}</p>
      <button class="btn block" type="submit">${ed ? 'Salvar e avisar o aluno' : 'Agendar e avisar o aluno'}</button>
      ${ed ? '<button class="btn ghost block ag-cancelar" type="button" id="ag-canc">Cancelar o compromisso</button>' : ''}
    </form>`,
    (r) => {
      const f = r.querySelector('#ag-f');
      // título só para "outro"; local só para o que não é videochamada
      const ajusta = () => {
        const c = f.cat.value;
        r.querySelector('#ag-tit-c').hidden = c !== 'outro';
        r.querySelector('#ag-loc-c').hidden = !!(AG_CAT[c] || {}).video;
      };
      // motivo sugerido pelo tipo (só se o treinador ainda não escolheu outro)
      let motivoMexido = !!a;
      f.motivo.onchange = () => {
        motivoMexido = true;
        r.querySelector('#ag-mot-c').hidden = f.motivo.value !== '__outro';
      };
      f.cat.onchange = () => {
        ajusta();
        const pd = AG_MOTIVO_PADRAO[f.cat.value];
        if (!motivoMexido && pd) f.motivo.value = pd;
      };
      ajusta();
      if (!a) f.motivo.value = AG_MOTIVO_PADRAO.video_mensal;
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = f.querySelector('[type=submit]');
        const alunoId = ed ? a.aluno_id : f.aluno.value;
        if (!alunoId) return toast('Escolha o aluno.', true);
        const cat = f.cat.value;
        if (cat === 'outro' && !f.titulo.value.trim()) return toast('Escreva o título do compromisso.', true);
        const motivo = f.motivo.value === '__outro' ? f.motivo_txt.value.trim() : f.motivo.value;
        if (!motivo) return toast('Escreva o motivo.', true);
        const inicio = new Date(`${f.dia.value}T${f.hora.value}:00`);
        if (!(inicio.getTime() > Date.now() - 60000)) return toast('Escolha um horário que ainda não passou.', true);
        b.disabled = true;
        b.textContent = 'Salvando…';
        const row = {
          inicio: inicio.toISOString(),
          duracao_min: +f.dur.value,
          categoria: cat,
          tipo: cat === 'video_mensal' ? 'mensal' : 'avulsa',
          titulo: cat === 'outro' ? f.titulo.value.trim() : null,
          local: AG_CAT[cat].video ? null : f.local.value.trim() || null,
          motivo,
          obs: f.obs.value.trim() || null,
          atualizado_em: new Date().toISOString(),
        };
        let id = a && a.id,
          aviso = 'nova';
        if (ed) {
          const mudou =
            Date.parse(a.inicio) !== inicio.getTime() ||
            a.categoria !== cat ||
            (a.local || null) !== row.local ||
            (a.motivo || null) !== motivo;
          if (mudou) Object.assign(row, { confirmado_em: null, lembrete_dia_em: null, lembrete_15_em: null });
          aviso = mudou ? 'mudou' : null;
          const { error } = await sb.from('nx_agenda').update(row).eq('id', a.id);
          if (error) {
            b.disabled = false;
            b.textContent = 'Salvar e avisar o aluno';
            return toast('Não foi possível salvar.', true);
          }
        } else {
          const { data, error } = await sb
            .from('nx_agenda')
            .insert({ ...row, org_id: S.org.id, aluno_id: alunoId, treinador_id: S.user.id })
            .select('id')
            .single();
          if (error || !data) {
            b.disabled = false;
            b.textContent = 'Agendar e avisar o aluno';
            return toast('Não foi possível agendar.', true);
          }
          id = data.id;
        }
        if (aviso) agFunc({ acao: 'avisar', id, tipo: aviso });
        closeSheet(true);
        toast(aviso ? 'Pronto! O aluno recebeu o aviso no app.' : 'Salvo.');
        if (S.cache.agenda) {
          S.cache.agenda.sel = f.dia.value;
          S.cache.agenda.comp = f.dia.value.slice(0, 7);
        }
        if (depois) depois();
      };
      const bc = r.querySelector('#ag-canc');
      if (bc)
        bc.onclick = async () => {
          if (!confirm('Cancelar este compromisso? O aluno recebe o aviso.')) return;
          bc.disabled = true;
          const { error } = await sb
            .from('nx_agenda')
            .update({ status: 'cancelada', atualizado_em: new Date().toISOString() })
            .eq('id', a.id);
          if (error) {
            bc.disabled = false;
            return toast('Não foi possível cancelar.', true);
          }
          agFunc({ acao: 'avisar', id: a.id, tipo: 'cancelada' });
          closeSheet(true);
          toast('Cancelada. O aluno foi avisado.');
          if (depois) depois();
        };
    },
  );
}

// cartão na Hoje: chegando (até 7 dias) ou grande no dia, com a contagem
let agTimer = null;
async function cartaoAgenda() {
  const el = document.getElementById('agenda-hoje');
  if (!el) return;
  const staff = S.staff;
  const lista = await agBuscar(
    new Date(Date.now() - 3 * 3600e3).toISOString(),
    new Date(Date.now() + 7 * 864e5).toISOString(),
    staff ? null : S.user.id,
  );
  let ags = lista.filter((a) => agFase(a, Date.now()) !== 'passou');
  if (staff) {
    const al = await agAlunos();
    const meus = new Set(al.filter(ehMeuAluno).map((x) => x.user_id));
    ags = ags.filter((a) => a.treinador_id === S.user.id || meus.has(a.aluno_id));
    el._alunos = Object.fromEntries(al.map((x) => [x.user_id, x]));
  }
  if (!ags.length || !document.getElementById('agenda-hoje')) return;
  const equipe = staff ? [] : await carregarEquipe().catch(() => []);
  const desenha = () => {
    const agora = Date.now();
    const vivos = ags.filter((a) => agFase(a, agora) !== 'passou');
    if (!vivos.length || !document.body.contains(el)) {
      el.innerHTML = '';
      clearInterval(agTimer);
      return;
    }
    const a = vivos[0];
    const fase = agFase(a, agora);
    const ini = Date.parse(a.inicio);
    const tr =
      firstName(((equipe || []).find((p) => p.user_id === a.treinador_id) || {}).nome || '') || 'seu treinador';
    const al = staff ? (el._alunos || {})[a.aluno_id] || { nome: 'Aluno' } : null;
    const quem = staff ? esc(firstName(al.nome)) : esc(tr);
    const video = agVideo(a);
    const nomeA = agNome(a);
    const hojeN = vivos.filter((x) => ['hoje', 'ja'].includes(agFase(x, agora))).length;
    const ondeTxt = !video && a.local ? `<span class="ag-g-local">${AG_IC} ${esc(a.local)}</span>` : '';
    if (fase === 'hoje' || fase === 'ja') {
      const txt = staff
        ? fase === 'ja'
          ? video
            ? 'Toque em Ligar: o aluno recebe a chamada no celular.'
            : `${quem} ${a.confirmado_em ? 'confirmou a presença' : 'ainda não confirmou'}.`
          : `${a.confirmado_em ? `${quem} confirmou a presença.` : `${quem} ainda não confirmou.`} O lembrete sai 15 min antes.`
        : video
          ? fase === 'ja'
            ? 'Deixe o app aberto: o seu treinador vai te ligar aqui. A chamada toca na tela.'
            : `O seu treinador te liga aqui no app no horário.${a.categoria === 'video_mensal' && !a.motivo ? ' Vocês vão ver juntos o resumo do seu mês.' : ''}`
          : 'Você recebe um lembrete 15 min antes.';
      el.innerHTML = `<div class="ag-grande ${fase === 'ja' ? 'ja' : ''}">
        <div class="ag-g-fundo"></div>
        <div class="ag-g-top"><span class="ag-g-chip">${fase === 'ja' ? '<i></i>Começando agora' : 'Hoje'}</span>${staff && hojeN > 1 ? `<a class="ag-g-mais" href="#/agenda">${hojeN} hoje</a>` : ''}</div>
        <p class="ag-g-ey">${esc(nomeA)}${staff ? ' com' : ' com o treinador'}</p>
        <div class="ag-g-quem">${staff ? avAluno(al, 'lg') : ''}<b>${quem}</b></div>
        <div class="ag-g-hora"><b>${agHora(new Date(ini))}</b><span>${fase === 'ja' ? (agora < ini ? agFalta(ini, agora) : 'em andamento') : agFalta(ini, agora)}</span></div>
        ${ondeTxt}
        ${agMotivoHTML(a, 'ag-g-mot')}
        <p class="ag-g-txt">${txt}</p>
        <div class="ag-g-acoes">${
          staff
            ? `${video ? `<button type="button" class="btn ag-g-bt" id="ag-g-ligar">${AG_CAM} Ligar para ${quem}</button>` : ''}${a.categoria === 'video_mensal' ? `<a class="btn ghost ag-g-bt2" href="#/aluno/${a.aluno_id}/relmes">Resumo do mês</a>` : a.categoria === 'avaliacao' ? `<a class="btn ghost ag-g-bt2" href="#/aluno/${a.aluno_id}/avaliacoes">Avaliações</a>` : `<a class="btn ghost ag-g-bt2" href="#/agenda">Ver a agenda</a>`}`
            : a.confirmado_em
              ? '<span class="ag-g-conf">Presença confirmada</span>'
              : '<button type="button" class="btn ag-g-bt" id="ag-g-conf">Confirmar presença</button>'
        }</div></div>`;
    } else {
      const d = new Date(ini);
      el.innerHTML = `<a class="card ag-chega" href="#/agenda"><div class="ag-c-data"><small>${AG_SEM[d.getDay()].slice(0, 3)}</small><b>${d.getDate()}</b><small>${AG_MESES[d.getMonth()].slice(0, 3)}</small></div>
        <div class="grow" style="min-width:0"><span class="eyebrow">${staff ? 'Próximo na agenda' : `${esc(nomeA)} chegando`}</span><b class="ellip" style="display:block;margin-top:2px">${staff ? `${esc(nomeA)} com ${quem}` : `Com ${quem}`} às ${agHora(d)}</b>${a.motivo ? `<div class="ag-c-mot">Motivo: <b>${esc(a.motivo)}</b></div>` : ''}<div class="small muted">${agFalta(ini, agora)}${!video && a.local ? ` · ${esc(a.local)}` : ''}${staff ? '' : a.confirmado_em ? ' · presença confirmada' : ' · toque para confirmar'}</div></div>${I.chev}</a>`;
    }
    const bl = el.querySelector('#ag-g-ligar'),
      bc = el.querySelector('#ag-g-conf');
    if (bl && al) bl.onclick = () => iniciarVideochamada({ ...al, user_id: a.aluno_id }, bl);
    if (bc)
      bc.onclick = () =>
        agConfirmar(a.id, bc, () => {
          a.confirmado_em = new Date().toISOString();
          desenha();
        });
  };
  clearInterval(agTimer);
  desenha();
  agTimer = setInterval(desenha, 30000);
}
