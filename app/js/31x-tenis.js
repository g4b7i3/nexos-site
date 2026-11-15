/* ---------- Meus tênis: quilometragem de cada par ---------- */
// Cada corrida (corrida, trail e esteira) entra sozinha no tênis principal do aluno (gatilho no banco).
// O aluno pode trocar o tênis de uma corrida na tela dela. A conta é: km que o tênis já tinha + km das corridas ligadas a ele.

const TENIS_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5V12l3-1 2.2 1.6c.9.6 2 .9 3 .9H13l3.5 1.2c2.6.9 4.5 1.5 4.5 3.3V18H4.5A1.5 1.5 0 0 1 3 16.5Z"/><path d="M3 18h18"/><path d="m8.5 12.8 1.2-2M11 13.4l1.2-2.1"/></svg>';
const TN_TIPOS = ['corrida', 'trail', 'esteira'];

/* tenis:puro:inicio */
// quilometragem total do tênis: o que ele já tinha quando foi cadastrado + as corridas ligadas a ele (em metros)
function tnKm(t, metros) {
  const ini = Math.max(0, +(t && t.km_inicial) || 0);
  return ini + Math.max(0, +metros || 0) / 1000;
}
// situação do tênis em relação ao limite que o aluno escolheu: em uso, perto do limite (a partir de 85%) ou hora de trocar
function tnEstado(km, limite) {
  const lim = +limite > 0 ? +limite : 700;
  const pct = km / lim;
  return { pct, falta: Math.max(0, lim - km), nivel: pct >= 1 ? 'trocar' : pct >= 0.85 ? 'perto' : 'ok' };
}
// soma os metros das corridas por tênis
function tnSomar(corridas) {
  const s = {};
  (corridas || []).forEach((c) => {
    if (c && c.tenis_id && +c.distancia_m > 0) s[c.tenis_id] = (s[c.tenis_id] || 0) + +c.distancia_m;
  });
  return s;
}
/* tenis:puro:fim */

const tnKmTxt = (km) => `${Math.round(km).toLocaleString('pt-BR')} km`;
const TN_SOBRE =
  'Os fabricantes costumam indicar a troca entre 500 e 800 km. Não existe um número certo para todo mundo: o desgaste depende do peso, da pisada, do piso e do modelo. Sola gasta, amortecimento duro ou uma dor nova nas pernas também são sinais de troca.';

async function tnCarregar(alunoId) {
  const { data: tenis, error } = await sb
    .from('nx_tenis')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('aposentado_em', { ascending: false, nullsFirst: true })
    .order('criado_em', { ascending: false });
  if (error) throw error;
  const ids = (tenis || []).map((t) => t.id);
  let corr = [];
  if (ids.length) {
    const r = await sb.from('nx_corridas').select('tenis_id,distancia_m').in('tenis_id', ids);
    corr = r.data || [];
  }
  const soma = tnSomar(corr);
  return (tenis || []).map((t) => {
    const km = tnKm(t, soma[t.id]);
    return { ...t, km, est: tnEstado(km, t.limite_km), corridas: corr.filter((c) => c.tenis_id === t.id).length };
  });
}

function tnCartaoHTML(t, podeEditar) {
  const e = t.est;
  const cor = e.nivel === 'trocar' ? 'var(--err)' : e.nivel === 'perto' ? 'var(--warn)' : 'var(--ok, #16a34a)';
  const msg = t.aposentado_em
    ? `Aposentado em ${fmtDia(t.aposentado_em)}`
    : e.nivel === 'trocar'
      ? 'Passou do limite marcado. Hora de pensar no próximo par.'
      : e.nivel === 'perto'
        ? `Faltam ${tnKmTxt(e.falta)} para o limite.`
        : `Faltam ${tnKmTxt(e.falta)} para o limite.`;
  return `<div class="card tn-card ${t.aposentado_em ? 'apos' : e.nivel}" data-tn="${t.id}">
    <div class="row between" style="align-items:flex-start;gap:10px"><div class="grow" style="min-width:0"><b class="tn-nome">${esc(t.nome)}</b>${t.principal && !t.aposentado_em ? '<span class="tag ok" style="margin-left:6px">principal</span>' : ''}
    <div class="tiny dim" style="margin-top:2px">Desde ${fmtDia(t.inicio + 'T12:00:00')} · ${t.corridas} corrida${t.corridas === 1 ? '' : 's'} no app</div></div>
    <div class="tn-km"><b>${Math.round(t.km).toLocaleString('pt-BR')}</b><small>/ ${Math.round(t.limite_km)} km</small></div></div>
    <div class="tn-bar"><i style="width:${Math.min(100, e.pct * 100).toFixed(1)}%;background:${cor}"></i></div>
    <p class="small ${e.nivel !== 'ok' && !t.aposentado_em ? '' : 'muted'}" style="margin-top:6px${e.nivel !== 'ok' && !t.aposentado_em ? ';color:' + cor + ';font-weight:700' : ''}">${msg}</p>
    ${
      podeEditar
        ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${!t.principal && !t.aposentado_em ? '<button class="btn sm" data-tn-acao="principal">Usar como principal</button>' : ''}<button class="btn sm ghost" data-tn-acao="editar">Editar</button>${t.aposentado_em ? '<button class="btn sm ghost" data-tn-acao="voltar">Voltar a usar</button>' : '<button class="btn sm ghost" data-tn-acao="aposentar">Aposentar</button>'}</div>`
        : ''
    }</div>`;
}

// lista de tênis de um aluno (tela do aluno e aba da ficha do treinador)
async function tnPainel(box, alunoId, staff) {
  box.innerHTML = '<div class="skel" style="height:120px"></div>';
  let lista;
  try {
    lista = await tnCarregar(alunoId);
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="small muted">Não foi possível carregar os tênis.</p>';
    return;
  }
  const ativos = lista.filter((t) => !t.aposentado_em).sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0));
  const apos = lista.filter((t) => t.aposentado_em);
  const temPrincipal = ativos.some((t) => t.principal);
  box.innerHTML = `${
    !lista.length
      ? `<div class="card"><p>${staff ? 'O aluno ainda não cadastrou nenhum tênis.' : 'Cadastre o tênis que você usa para correr. Cada corrida entra sozinha na quilometragem dele.'}</p></div>`
      : ''
  }
    ${ativos.length && !temPrincipal ? `<div class="card" style="border-color:rgba(214,120,0,.35)"><p class="small">Nenhum tênis está marcado como principal, então as corridas novas não entram em nenhum. ${staff ? '' : 'Toque em “Usar como principal” no tênis que você mais usa.'}</p></div>` : ''}
    ${ativos.map((t) => tnCartaoHTML(t, true)).join('')}
    <button class="btn block" id="tn-novo" style="margin-top:4px">${TENIS_IC} Cadastrar tênis</button>
    ${apos.length ? `<details class="tn-apos"><summary class="sec-lbl" style="cursor:pointer">Aposentados (${apos.length})</summary><div class="stack" style="margin-top:8px">${apos.map((t) => tnCartaoHTML(t, true)).join('')}</div></details>` : ''}
    <p class="tiny dim" style="margin-top:12px">${esc(TN_SOBRE)}</p>`;
  const recarregar = () => tnPainel(box, alunoId, staff);
  box.querySelector('#tn-novo').onclick = () => tnForm(null, alunoId, !temPrincipal, recarregar);
  box.querySelectorAll('[data-tn-acao]').forEach((b) => {
    b.onclick = async () => {
      const t = lista.find((x) => x.id === b.closest('[data-tn]').dataset.tn);
      const acao = b.dataset.tnAcao;
      if (acao === 'editar') return tnForm(t, alunoId, false, recarregar);
      b.disabled = true;
      let erro = null;
      if (acao === 'principal') erro = await tnTornarPrincipal(t, alunoId);
      if (acao === 'aposentar')
        erro = (
          await sb.from('nx_tenis').update({ aposentado_em: new Date().toISOString(), principal: false }).eq('id', t.id)
        ).error;
      if (acao === 'voltar') erro = (await sb.from('nx_tenis').update({ aposentado_em: null }).eq('id', t.id)).error;
      if (erro) {
        console.error(erro);
        toast('Não foi possível salvar.', true);
        b.disabled = false;
        return;
      }
      toast(
        acao === 'principal'
          ? 'As próximas corridas entram neste tênis.'
          : acao === 'aposentar'
            ? 'Tênis aposentado.'
            : 'Tênis de volta.',
      );
      recarregar();
    };
  });
}

// só um tênis principal por aluno: tira o principal dos outros antes
async function tnTornarPrincipal(t, alunoId) {
  const a = await sb.from('nx_tenis').update({ principal: false }).eq('aluno_id', alunoId).eq('principal', true);
  if (a.error) return a.error;
  return (await sb.from('nx_tenis').update({ principal: true, aposentado_em: null }).eq('id', t.id)).error;
}

function tnForm(t, alunoId, sugerirPrincipal, depois) {
  const novo = !t;
  openSheet(
    `<p class="eyebrow">Meus tênis</p><div class="h2" style="margin-top:4px">${novo ? 'Cadastrar tênis' : 'Editar tênis'}</div>
    <form id="tn-f" class="stack" style="margin-top:12px">
      <label class="field"><span>Marca e modelo</span><input class="input" name="nome" maxlength="80" required value="${esc(t ? t.nome : '')}" placeholder="Ex.: Nike Pegasus 41"></label>
      <div class="grid2"><label class="field"><span>Começou a usar em</span><input class="input" type="date" name="inicio" required value="${t ? t.inicio : hojeISO()}" max="${hojeISO()}"></label>
      <label class="field"><span>Km antes do app</span><input class="input" type="number" name="km_inicial" min="0" max="19999" step="1" inputmode="numeric" value="${t ? Math.round(t.km_inicial) : 0}"></label></div>
      <p class="tiny dim" style="margin-top:-4px">Use “Km antes do app” só para o que ele rodou antes de você registrar as corridas aqui.</p>
      <label class="field"><span>Avisar quando chegar a (km)</span><input class="input" type="number" name="limite_km" min="100" max="3000" step="10" inputmode="numeric" value="${t ? Math.round(t.limite_km) : 700}"></label>
      ${novo ? `<label class="chk"><input type="checkbox" name="principal" ${sugerirPrincipal ? 'checked' : ''}> É o tênis que mais uso (as corridas novas entram nele)</label>` : ''}
      ${novo ? '<label class="chk"><input type="checkbox" name="passadas" checked> Somar as corridas do app desde a data em que comecei a usar</label>' : ''}
      <button class="btn block" type="submit">${novo ? 'Cadastrar' : 'Salvar'}</button>
      ${t ? '<button class="btn ghost block danger-txt" type="button" id="tn-apagar">Apagar este tênis</button>' : ''}
    </form>`,
    (box) => {
      box.querySelector('#tn-f').onsubmit = async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const bt = f.querySelector('button[type=submit]');
        bt.disabled = true;
        const dados = {
          nome: f.nome.value.trim(),
          inicio: f.inicio.value,
          km_inicial: Math.max(0, Math.round(+f.km_inicial.value || 0)),
          limite_km: Math.min(3000, Math.max(100, Math.round(+f.limite_km.value || 700))),
        };
        let erro = null;
        let id = t && t.id;
        if (novo) {
          const principal = f.principal.checked;
          if (principal) {
            const a = await sb
              .from('nx_tenis')
              .update({ principal: false })
              .eq('aluno_id', alunoId)
              .eq('principal', true);
            erro = a.error;
          }
          if (!erro) {
            const r = await sb
              .from('nx_tenis')
              .insert({ ...dados, principal, org_id: S.org.id, aluno_id: alunoId })
              .select('id')
              .single();
            erro = r.error;
            id = r.data && r.data.id;
          }
          // corridas que já estão no app desde a data entram neste tênis (só as que ainda não têm tênis)
          if (!erro && id && f.passadas.checked) {
            const r = await sb
              .from('nx_corridas')
              .update({ tenis_id: id })
              .eq('aluno_id', alunoId)
              .is('tenis_id', null)
              .in('tipo', TN_TIPOS)
              .gte('data', dados.inicio + 'T00:00:00-03:00');
            erro = r.error;
          }
        } else erro = (await sb.from('nx_tenis').update(dados).eq('id', t.id)).error;
        if (erro) {
          console.error(erro);
          toast('Não foi possível salvar.', true);
          bt.disabled = false;
          return;
        }
        closeSheet(true);
        toast(novo ? 'Tênis cadastrado.' : 'Tênis salvo.');
        depois && depois();
      };
      const ap = box.querySelector('#tn-apagar');
      if (ap)
        ap.onclick = async () => {
          if (ap.dataset.ok !== '1') {
            ap.dataset.ok = '1';
            ap.textContent = 'Toque de novo para apagar (as corridas continuam no app)';
            return;
          }
          const { error } = await sb.from('nx_tenis').delete().eq('id', t.id);
          if (error) return toast('Não foi possível apagar.', true);
          closeSheet(true);
          toast('Tênis apagado.');
          depois && depois();
        };
    },
  );
}

// tela do aluno: #/tenis
async function viewTenis() {
  loading();
  dockAluno();
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Corrida</p><h1 class="h1">Meus tênis</h1>
    <p class="small muted" style="margin-top:4px">Quilometragem de cada par, somada sozinha a cada corrida.</p><div class="stack" id="tn-box" style="margin-top:14px"></div>`;
  await tnPainel(document.getElementById('tn-box'), S.user.id, false);
}

// na tela da corrida: qual tênis foi usado, com opção de trocar
async function tnCorrida(c) {
  const box = document.getElementById('tn-corr');
  if (!box || !TN_TIPOS.includes(c.tipo || 'corrida')) return;
  let lista = [];
  try {
    lista =
      (
        await sb
          .from('nx_tenis')
          .select('id,nome,aposentado_em')
          .eq('aluno_id', c.aluno_id)
          .order('criado_em', { ascending: false })
      ).data || [];
  } catch {
    return;
  }
  if (!lista || !lista.length) {
    if (!S.staff)
      box.innerHTML = `<a class="card-cta" href="#/tenis" style="margin-top:12px"><span class="card-cta-ic">${TENIS_IC}</span><div class="grow" style="text-align:left"><b>Marcar o tênis desta corrida</b><span class="small">Cadastre o seu tênis e acompanhe a quilometragem</span></div>${I.chev}</a>`;
    return;
  }
  const opcoes = lista.filter((t) => !t.aposentado_em || t.id === c.tenis_id);
  box.innerHTML = `<div class="card tn-corr"><span class="ativ-ic">${TENIS_IC}</span><div class="grow"><span class="eyebrow">Tênis</span>
    <select class="input" id="tn-sel" style="margin-top:4px"><option value="">Nenhum</option>${opcoes.map((t) => `<option value="${t.id}" ${t.id === c.tenis_id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></div></div>`;
  box.querySelector('#tn-sel').onchange = async (e) => {
    const v = e.target.value || null;
    const { error } = await sb.from('nx_corridas').update({ tenis_id: v }).eq('id', c.id);
    if (error) {
      console.error(error);
      toast('Não foi possível trocar o tênis.', true);
      e.target.value = c.tenis_id || '';
      return;
    }
    c.tenis_id = v;
    toast(v ? 'Corrida somada a este tênis.' : 'Corrida tirada do tênis.');
  };
}

// aviso na tela Hoje do aluno quando um tênis em uso chega perto do limite
async function tnAvisoHoje() {
  const box = document.getElementById('tenis-hoje');
  if (!box) return;
  const lista = (await tnCarregar(S.user.id)).filter((t) => !t.aposentado_em && t.est.nivel !== 'ok');
  if (!lista.length) return;
  const t = lista.sort((a, b) => b.est.pct - a.est.pct)[0];
  box.innerHTML = `<a class="card-cta" href="#/tenis" style="margin-top:12px"><span class="card-cta-ic" style="color:${t.est.nivel === 'trocar' ? 'var(--err)' : 'var(--warn)'}">${TENIS_IC}</span><div class="grow" style="text-align:left"><b>${esc(t.nome)}: ${tnKmTxt(t.km)}</b><span class="small">${t.est.nivel === 'trocar' ? 'Passou do limite que você marcou' : `Faltam ${tnKmTxt(t.est.falta)} para o limite`}</span></div>${I.chev}</a>`;
}
