/* Nexos App · Histórico de testes do aluno, em Ritmos e zonas.
   Cada teste que muda as zonas (confirmado do relógio, do Check-up ou cadastrado à mão) é guardado pelo banco em
   nx_testes (gatilho em nx_membros). A equipe também pode lançar um teste antigo, que entra só no histórico e não mexe
   nas zonas de hoje. Para comparar testes de distâncias diferentes, cada um vira o tempo equivalente nos 5 km pelo
   VDOT (Daniels & Gilbert). O aluno só vê a seção quando tem teste. */
'use strict';

const thVdot = (t) => (t.km && t.seg ? vdotDe(t.km * 1000, t.seg) : t.vdot ? +t.vdot : null);
const thNome = (t) =>
  t.km && t.seg
    ? `${String(+t.km).replace('.', ',')} km em ${fmtDurLongo(t.seg)}`
    : (TESTE_NOME[t.tipo] || 'Teste de campo').replace(/^t/, 'T') + (t.resumo ? ' · ' + t.resumo : '');

async function thMontar(el, { alunoId, staff, orgId }) {
  if (!el) return;
  const { data, error } = await sb
    .from('nx_testes')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false });
  if (!el.isConnected) return;
  const lista = error ? [] : data || [];
  if (!lista.length && !staff) {
    el.innerHTML = '';
    return;
  }
  const comV = lista.filter((t) => thVdot(t));
  let resumo = '';
  if (comV.length >= 2) {
    const a = comV[comV.length - 1],
      b = comV[0];
    const va = thVdot(a),
      vb = thVdot(b),
      d = vb - va;
    resumo = `<div class="th-resumo ${d > 0.2 ? 'sobe' : d < -0.2 ? 'cai' : ''}"><b>${d > 0 ? '+' : ''}${f1(d)}</b><span>VDOT de ${f1(va)} para ${f1(vb)} entre ${fmtCurto(a.data + 'T12:00:00')} e ${fmtCurto(b.data + 'T12:00:00')}. Nos 5 km, de ${fmtDurLongo(tempoPorVdot(va, 5000))} para ${fmtDurLongo(tempoPorVdot(vb, 5000))}.</span></div>`;
  }
  const linhas = lista
    .map((t, i) => {
      const v = thVdot(t);
      const ant = lista.slice(i + 1).find((x) => thVdot(x));
      const dv = v && ant ? v - thVdot(ant) : null;
      const seta =
        dv == null
          ? ''
          : `<span class="th-dif ${dv > 0.2 ? 'sobe' : dv < -0.2 ? 'cai' : ''}">${dv > 0 ? '+' : ''}${f1(dv)}</span>`;
      return `<li class="th-it" data-id="${t.id}"><div class="th-data">${fmtCurto(t.data + 'T12:00:00')}<small>${new Date(t.data + 'T12:00:00').getFullYear()}</small></div>
        <div class="grow" style="min-width:0"><b>${esc(thNome(t))}</b><div class="small muted">${v ? `VDOT ${f1(v)} · 5 km em ${fmtDurLongo(tempoPorVdot(v, 5000))}` : 'Sem VDOT'}${t.origem === 'manual' ? ' · lançado no histórico' : ''}${i === 0 ? ' · atual' : ''}</div></div>
        ${seta}${staff ? `<button type="button" class="icon-btn th-del" aria-label="Apagar do histórico">${I.x}</button>` : ''}</li>`;
    })
    .join('');
  el.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Histórico de testes</h2>${slashes}</div>
    ${resumo}
    ${lista.length ? `<ol class="th-lista">${linhas}</ol>` : '<p class="small muted">Nenhum teste guardado ainda. Os próximos testes entram aqui sozinhos.</p>'}
    ${
      staff
        ? `<button type="button" class="btn ghost sm" id="th-add" style="margin-top:10px">Lançar teste antigo</button>
      <form id="th-form" class="card" hidden style="margin-top:10px"><div class="grid2"><label class="field"><span>Data</span><input class="input" type="date" name="data" required max="${hojeISO()}"></label><label class="field"><span>Distância (km)</span><input class="input" name="km" data-mask="dec" data-int="3" inputmode="decimal" placeholder="5" required></label></div>
        <label class="field"><span>Tempo (h:mm:ss)</span><input class="input" name="tempo" data-mask="tempo" inputmode="numeric" placeholder="25:30" required></label>
        <p class="tiny dim">Entra só no histórico, para comparar. As zonas de hoje continuam pelo teste atual.</p>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" type="submit">Guardar</button><button class="btn ghost sm" type="button" id="th-cancel">Cancelar</button></div></form>`
        : ''
    }
    <p class="tiny dim" style="margin-top:8px">Para comparar testes de distâncias diferentes, cada um vira o tempo equivalente nos 5 km pelo VDOT (Daniels e Gilbert).</p></div>`;
  if (!staff) return;
  const f = el.querySelector('#th-form');
  el.querySelector('#th-add').onclick = () => {
    f.hidden = false;
    el.querySelector('#th-add').hidden = true;
  };
  el.querySelector('#th-cancel').onclick = () => {
    f.hidden = true;
    el.querySelector('#th-add').hidden = false;
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const km = num(f.km.value),
      seg = lerTempo(f.tempo.value);
    if (!km || !seg || !f.data.value) return toast('Preencha a data, a distância e o tempo.');
    const { error: er } = await sb.from('nx_testes').insert({
      org_id: orgId,
      aluno_id: alunoId,
      data: f.data.value,
      km,
      seg,
      vdot: Math.round(vdotDe(km * 1000, seg) * 100) / 100,
      tipo: 'prova',
      origem: 'manual',
    });
    if (er)
      return toast(/duplicate|unique/i.test(er.message) ? 'Esse teste já está no histórico.' : 'Não deu para guardar.');
    toast('Teste guardado no histórico.');
    thMontar(el, { alunoId, staff, orgId });
  };
  el.querySelectorAll('.th-del').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!b.classList.contains('conf')) {
          b.classList.add('conf');
          toast('Toque de novo para apagar do histórico.');
          setTimeout(() => b.classList.remove('conf'), 3000);
          return;
        }
        const id = b.closest('[data-id]').dataset.id;
        const { error: er } = await sb.from('nx_testes').delete().eq('id', id);
        if (er) return toast('Não deu para apagar.');
        thMontar(el, { alunoId, staff, orgId });
      }),
  );
}
