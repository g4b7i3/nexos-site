/* Nexos App · Sessão de alongamento na planilha.
   O treinador coloca um dia de "Alongamento" na planilha (da biblioteca de modelos, como um treino de corrida). O aluno
   abre a sessão guiada: vídeo ou imagens de cada alongamento, contagem regressiva por lado e por série, próximo sozinho,
   e no fim conta como ficou o incômodo. A resposta vai para a Conversa do treino (o treinador recebe o aviso).
   Cada item da sessão (plano.estrutura): { k: 'al', ex: id do exercício, seg: segundos parado ou reps: repetições,
   series, lados: 2 quando é um lado de cada vez, dica }. */
'use strict';

const AL_PREP = 5; // segundos para se posicionar antes de cada alongamento
let alT = null;

const alItens = (p) => (Array.isArray(p && p.estrutura) ? p.estrutura.filter((x) => x && x.k === 'al' && x.ex) : []);
/** duração estimada da sessão, em minutos */
function alMinutos(itens) {
  const s = itens.reduce((a, x) => {
    const rep = (x.series || 1) * (x.lados === 2 ? 2 : 1);
    return a + rep * ((x.seg || Math.max(30, (x.reps || 10) * 3)) + AL_PREP);
  }, 0);
  return Math.max(5, Math.round(s / 60));
}
const alDoseTxt = (x) =>
  `${x.series && x.series > 1 ? x.series + ' × ' : ''}${x.seg ? x.seg + ' s' : (x.reps || 10) + ' repetições'}${x.lados === 2 ? ' de cada lado' : ''}`;

async function viewAlongamento(planoId) {
  clearInterval(alT);
  $app.innerHTML = '<div class="skel" style="height:220px;margin-top:20px"></div>';
  const { data: p } = await sb.from('nx_plano_corrida').select('*').eq('id', planoId).maybeSingle();
  if (!p || p.tipo !== 'alongamento') {
    $app.innerHTML = `<a class="back" href="#/">${I.back} Início</a><div class="empty" style="margin-top:20px">Sessão de alongamento não encontrada.</div>`;
    return;
  }
  const itens = alItens(p);
  const ids = [...new Set(itens.map((x) => x.ex))];
  const [{ data: exs }, { data: feito }] = await Promise.all([
    ids.length ? sb.from('nx_exercicios').select('*').in('id', ids) : { data: [] },
    sb.from('nx_alongamento_feito').select('*').eq('plano_id', p.id).order('feito_em', { ascending: false }).limit(1),
  ]);
  const exDe = Object.fromEntries((exs || []).map((e) => [e.id, e]));
  // passos da sessão: cada série e cada lado vira um passo com o seu tempo
  const passos = [];
  itens.forEach((x, k) => {
    const ex = exDe[x.ex] || { nome: 'Alongamento', imagens: [] };
    const series = Math.max(1, x.series || 1),
      lados = x.lados === 2 ? ['Lado direito', 'Lado esquerdo'] : [''];
    for (let s = 1; s <= series; s++)
      lados.forEach((ld) => passos.push({ k, ex, x, s, series, ld, seg: x.seg || 0, reps: x.seg ? 0 : x.reps || 10 }));
  });
  const voltar = S.staff ? `#/aluno/${p.aluno_id}/corrida` : '#/planilha';
  const min = alMinutos(itens);
  const ja = feito && feito[0];
  $app.innerHTML = `<a class="back" href="${voltar}">${I.back} ${S.staff ? 'Planilha do aluno' : 'Planilha'}</a>
    <p class="eyebrow">${fmtDia(p.data)} · Sessão de alongamento</p><h1 class="h1">${esc(p.titulo || 'Alongamento')}</h1>
    <p class="muted" style="margin-top:6px">${itens.length} alongamentos · cerca de ${min} min${p.descricao ? ' · ' + esc(p.descricao) : ''}</p>
    ${ja ? `<div class="card al-feito">${I.check}<span>Feito em ${fmtDia(ja.feito_em)} às ${fmtHora(ja.feito_em)}${ja.sentiu ? ` · incômodo ${esc(ja.sentiu)}` : ''}</span></div>` : ''}
    <div class="card al-box" id="al-box"></div>
    <div class="row al-ctl"><button type="button" class="btn ghost" id="al-ant" aria-label="Voltar um">${I.back}</button><button type="button" class="btn grow" id="al-ir"></button><button type="button" class="btn ghost" id="al-prox">Próximo</button></div>
    <p class="tiny dim" style="margin-top:10px">Alongue até sentir a musculatura esticar, sem dor. Respire devagar e solte o corpo a cada expiração. Se doer de verdade ou a dor aumentar, pare e avise o seu treinador.</p>
    <div class="section"><div class="section-h"><h2 class="h2">A sessão</h2>${slashes}</div><ol class="al-lista" id="al-lista"></ol></div>`;
  const box = document.getElementById('al-box'),
    ir = document.getElementById('al-ir'),
    prox = document.getElementById('al-prox'),
    ant = document.getElementById('al-ant'),
    lista = document.getElementById('al-lista');
  lista.innerHTML = itens
    .map((x, k) => {
      const ex = exDe[x.ex] || { nome: 'Alongamento' };
      return `<li data-k="${k}"><span class="al-n">${k + 1}</span><div class="grow"><b>${esc(ex.nome)}</b><small>${alDoseTxt(x)}</small></div></li>`;
    })
    .join('');
  if (!passos.length) {
    box.innerHTML = '<p class="muted">Esta sessão ainda não tem alongamentos.</p>';
    ir.hidden = prox.hidden = ant.hidden = true;
    return;
  }
  let i = 0,
    fase = 'pronto', // pronto | prep | vai | fim
    resta = 0,
    exMostrado = -1;
  const pintaLista = () =>
    lista.querySelectorAll('li').forEach((li) => {
      const k = +li.dataset.k;
      li.classList.toggle('ok', fase === 'fim' || k < passos[i].k);
      li.classList.toggle('atual', fase !== 'fim' && k === passos[i].k);
    });
  const pinta = () => {
    const q = passos[i];
    // a mídia só troca quando muda o alongamento (o vídeo não recomeça a cada lado)
    if (exMostrado !== q.k) {
      exMostrado = q.k;
      const midia =
        q.ex.video_url && ehVideoArquivo(q.ex.video_url)
          ? exVideoHTML({ ...q.ex, video_url: q.ex.video_url.split('#')[0] + '#loop' })
          : exFig(q.ex, 'big');
      box.innerHTML = `<div class="al-midia">${midia}</div><div class="al-info"></div>`;
    }
    const tempo =
      fase === 'prep' || fase === 'pausa-prep'
        ? `<div class="al-prep">Prepare-se<b>${resta}</b></div>`
        : q.seg
          ? `<div class="al-seg${fase === 'vai' ? ' vai' : ''}">${fase === 'vai' || fase === 'pausa-vai' ? resta : q.seg}<small>s</small></div>`
          : `<div class="al-seg reps">${q.reps}<small>repetições</small></div>`;
    box.querySelector('.al-info').innerHTML =
      `<div class="al-top"><b>${esc(q.ex.nome)}</b><span class="tiny dim">${q.k + 1} de ${itens.length}</span></div>
      <div class="al-sub">${[q.ld, q.series > 1 ? `série ${q.s} de ${q.series}` : ''].filter(Boolean).join(' · ') || alDoseTxt(q.x)}</div>
      ${q.x.dica ? `<p class="small muted" style="margin-top:6px">${esc(q.x.dica)}</p>` : ''}
      ${tempo}`;
    ir.textContent =
      fase === 'vai' || fase === 'prep' ? 'Pausar' : !q.seg ? 'Feito, próximo' : i || resta ? 'Continuar' : 'Começar';
    ant.disabled = i === 0;
    pintaLista();
  };
  const fim = () => {
    clearInterval(alT);
    fase = 'fim';
    pintaLista();
    exMostrado = -1;
    box.innerHTML = `<div class="al-fim"><div class="h2">Sessão concluída</div><p class="muted" style="margin-top:6px">${S.staff ? 'Esta é a sessão que o aluno vê.' : 'Como está o incômodo agora?'}</p>
      ${S.staff ? '' : `<div class="chips wrap" id="al-sentiu" style="justify-content:center;margin-top:12px">${['melhorou', 'igual', 'piorou'].map((s) => `<button type="button" class="chip" data-s="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>`}</div>`;
    ir.textContent = 'Fazer de novo';
    prox.hidden = true;
    ant.hidden = true;
    ir.onclick = () => viewAlongamento(planoId);
    const ch = document.getElementById('al-sentiu');
    if (ch)
      ch.onclick = async (e) => {
        const b = e.target.closest('[data-s]');
        if (!b) return;
        ch.querySelectorAll('.chip').forEach((x) => (x.disabled = true));
        b.classList.add('on');
        const sentiu = b.dataset.s;
        await sb.from('nx_alongamento_feito').insert({ org_id: p.org_id, plano_id: p.id, aluno_id: S.user.id, sentiu });
        // conta para o treinador pela Conversa do treino (ele recebe o aviso)
        const { data: m } = await sb
          .from('nx_treino_msgs')
          .insert({
            org_id: p.org_id,
            aluno_id: S.user.id,
            ref: 'plano:' + p.id,
            titulo: p.titulo || 'Alongamento',
            texto: `Fiz a sessão de alongamento. O incômodo ${sentiu === 'igual' ? 'ficou igual' : sentiu}.`,
          })
          .select('id')
          .single();
        if (m) notificar('treino_msg', m.id);
        toast('Pronto! Seu treinador recebe o aviso.');
      };
  };
  const tick = () => {
    if (!document.getElementById('al-box')) return clearInterval(alT);
    resta--;
    if (resta > 0) return pinta();
    if (fase === 'prep') {
      fase = 'vai';
      resta = passos[i].seg;
      vibrar(120);
      return pinta();
    }
    vibrar([180, 80, 180]);
    if (i >= passos.length - 1) return fim();
    i++;
    fase = 'prep';
    resta = AL_PREP;
    pinta();
  };
  const rodar = () => {
    clearInterval(alT);
    alT = setInterval(tick, 1000);
  };
  ir.onclick = () => {
    const q = passos[i];
    if (fase === 'vai' || fase === 'prep') {
      clearInterval(alT);
      fase = 'pausa-' + fase;
      return pinta();
    }
    if (!q.seg) {
      // exercício por repetições: a pessoa marca quando termina
      if (i >= passos.length - 1) return fim();
      i++;
      fase = 'prep';
      resta = AL_PREP;
      rodar();
      return pinta();
    }
    if (fase === 'pausa-vai') fase = 'vai';
    else if (fase === 'pausa-prep') fase = 'prep';
    else {
      fase = 'prep';
      resta = AL_PREP;
    }
    rodar();
    pinta();
  };
  const ir2 = (n) => {
    clearInterval(alT);
    i = Math.max(0, Math.min(passos.length - 1, n));
    fase = 'pronto';
    resta = 0;
    pinta();
  };
  prox.onclick = () => (i >= passos.length - 1 ? fim() : ir2(i + 1));
  ant.onclick = () => ir2(i - 1);
  lista.onclick = (e) => {
    const li = e.target.closest('li[data-k]');
    if (li && fase !== 'fim') ir2(passos.findIndex((q) => q.k === +li.dataset.k));
  };
  pinta();
}
