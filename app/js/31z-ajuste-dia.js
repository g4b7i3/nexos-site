/* Nexos App · Ajuste do dia (treinador aprova, aluno vê o treino trocado).
   De manhã o app cruza o check-in (sono, energia, estresse) e, para quem tem Garmin, a noite de sono, a FC de repouso
   e a VFC com o treino de corrida do dia. Se o corpo não está pronto, sugere a troca ao treinador, que aprova com um
   toque. O app nunca troca sozinho. Dor fica com as Sugestões do app (06-sugestoes-dor.js), que já tratam a região.
   A regra fica no bloco puro (testado em scripts/testes/ajuste.test.js). */
'use strict';

/* ajuste:puro:inicio */
/** sugestão de troca para o treino de hoje.
 *  r = { nome, plano { tipo, titulo, forte, min }, ck { sono, energia, estresse, total, locais } | null,
 *        rel { sonoH, fcRep, fcBase, vfc } | null }
 *  Escala do check-in de Hooper e Mackinnon (1995): 1 pior, 5 melhor, total de 4 a 20.
 *  Troca de treino forte por leve nos dias de prontidão baixa, como no treino guiado pela VFC
 *  (Kiviniemi et al., 2007; Vesterinen et al., 2016). A decisão é sempre do treinador. */
function ajusteDia(r) {
  const p = r.plano;
  if (!p || ['folga', 'forca', 'bike', 'caminhada', 'prova'].includes(p.tipo)) return null;
  const ck = r.ck,
    rel = r.rel;
  // com dor marcada, quem cuida é a sugestão de dor (ela ajusta pela região)
  if (ck && ck.locais && ck.locais.length) return null;
  const sinais = [];
  const add = (curto, forte) => sinais.push({ curto, forte: !!forte });
  if (ck) {
    if (ck.sono <= 2) add(ck.sono === 1 ? 'sono muito ruim' : 'sono ruim', ck.sono === 1);
    if (ck.energia <= 2) add(ck.energia === 1 ? 'energia muito baixa' : 'energia baixa', ck.energia === 1);
    if (ck.estresse <= 2) add(ck.estresse === 1 ? 'estresse muito alto' : 'estresse alto', ck.estresse === 1);
  }
  if (rel) {
    if (rel.sonoH > 0 && rel.sonoH < 6) {
      const m = Math.round(rel.sonoH * 60);
      add(`noite curta no relógio (${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')})`, rel.sonoH < 5);
    }
    if (rel.fcRep && rel.fcBase && rel.fcRep - rel.fcBase >= 5) {
      const d = Math.round(rel.fcRep - rel.fcBase);
      add(`FC de repouso ${d} bpm acima do normal`, d >= 10);
    }
    if (rel.vfc === 'abaixo') add('VFC abaixo da faixa normal', false);
  }
  if (!sinais.length) return null;
  const n = sinais.length,
    fortes = sinais.filter((s) => s.forte).length,
    total = ck ? ck.total : null;
  const nivel = n >= 3 || fortes >= 2 || (total != null && total <= 8) ? 'alto' : n === 2 || fortes ? 'medio' : 'leve';
  const dur = +p.min > 0 ? +p.min : 40;
  const m5 = (v) => Math.max(15, Math.round(v / 5) * 5);
  let novo = null;
  if (p.forte)
    novo =
      nivel === 'alto'
        ? { tipo: 'regenerativo', titulo: 'Regenerativo', min: Math.min(30, m5(dur * 0.5)), z: 'rec' }
        : { tipo: 'rodagem', titulo: 'Rodagem leve', min: m5(nivel === 'medio' ? dur * 0.8 : dur), z: 'leve' };
  else if (nivel === 'alto')
    novo = { tipo: 'regenerativo', titulo: 'Regenerativo', min: Math.min(35, m5(dur * 0.6)), z: 'rec' };
  else if (nivel === 'medio' && dur > 25)
    novo =
      p.tipo === 'regenerativo'
        ? { tipo: 'regenerativo', titulo: 'Regenerativo', min: m5(dur * 0.8), z: 'rec' }
        : { tipo: 'rodagem', titulo: 'Rodagem leve', min: m5(dur * 0.8), z: 'leve' };
  // mudança pequena demais não vale a troca (rodagem de 30 que viraria de 25)
  if (!novo || (!p.forte && dur - novo.min < 5)) return null;
  const nomes = sinais.map((s) => s.curto);
  const motivo = nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1] : nomes[0];
  const tit = p.titulo || 'o treino';
  const para = `${novo.titulo.toLowerCase()} de ${novo.min} min`;
  const teste = p.tipo === 'teste';
  const desc =
    `Ajustado hoje pelo seu check-in (${motivo}). Troquei "${tit}" por ${para} em ritmo confortável, ` +
    `em que dá para conversar. ${teste ? 'O teste fica para um dia em que o corpo esteja descansado, para as zonas saírem certas.' : 'O treino forte volta quando o corpo estiver recuperado.'}`;
  const nome = String(r.nome || '')
    .trim()
    .split(/\s+/)[0];
  const msg = [
    `Oi${nome ? ', ' + nome : ''}! Vi seu check-in de hoje, com ${motivo}.`,
    `Troquei "${tit}" por ${para}, em ritmo confortável. ${teste ? 'O teste fica para outro dia, com o corpo descansado, para as suas zonas saírem certas.' : 'Treino leve bem feito também conta, e o forte volta quando o corpo estiver recuperado.'}`,
    nivel === 'alto'
      ? 'Capricha no sono hoje à noite. Se continuar assim amanhã, me conta como está.'
      : 'Se durante o treino sentir algo diferente, me avisa por aqui.',
  ].join('\n\n');
  return { nivel, sinais: nomes, novo, desc, msg, teste };
}
/* ajuste:puro:fim */

/* ---------- dados e cartão do treinador ---------- */
/** sono, FC de repouso (com a média pessoal) e VFC (pela faixa pessoal) do dia, a partir das linhas do Garmin */
function relogioDoDia(g, hoje) {
  const gh = g.find((x) => x.dia === hoje);
  if (!gh) return null;
  return {
    sonoH: gh.sono_s > 0 ? gh.sono_s / 3600 : null,
    fcRep: gh.fc_repouso > 0 ? +gh.fc_repouso : null,
    fcBase: mediaPessoal(
      g.filter((x) => x.fc_repouso > 0).map((x) => ({ dia: x.dia, v: +x.fc_repouso })),
      hoje,
      30,
      7,
    ),
    vfc: leituraVfc(
      g.filter((x) => x.vfc > 0).map((x) => ({ dia: x.dia, v: +x.vfc })),
      hoje,
    ).estado,
  };
}
/** no celular do aluno, logo depois do check-in: a mesma conta do cartão do treinador, para avisá-lo na hora */
async function ajusteDoCheckin(row) {
  const hoje = row.dia;
  const lista = (q) =>
    q.then(
      (r) => r.data || [],
      () => [],
    );
  const [pl, g] = await Promise.all([
    lista(sb.from('nx_plano_corrida').select('*').eq('aluno_id', S.user.id).eq('data', hoje)),
    lista(
      sb
        .from('nx_garmin_dia')
        .select('dia,sono_s,fc_repouso,vfc')
        .eq('aluno_id', S.user.id)
        .gte('dia', somaDias(hoje, -66))
        .lte('dia', hoje),
    ),
  ]);
  const q = pl.find((x) => !semCorrida(x) && x.tipo !== 'prova' && x.liberado !== false);
  if (!q) return null;
  const perfil = perfilCorrida(S.me || {});
  const tt = estimaTotalSeg(estruturaDe(q), perfil);
  return ajusteDia({
    nome: '',
    plano: {
      tipo: q.tipo,
      titulo: q.titulo || nomeTipo(q.tipo),
      forte: ehForte(q),
      min: tt && tt[1] ? Math.round((tt[0] + tt[1]) / 2 / 60) : +q.duracao_min || null,
    },
    ck: {
      sono: row.sono,
      energia: row.energia,
      estresse: row.estresse,
      total: row.total ?? row.sono + row.energia + row.dor + row.estresse,
      locais: row.dor_locais,
    },
    rel: relogioDoDia(g, hoje),
  });
}
/** sugestões de hoje para os alunos do treinador (uma busca por tabela) */
async function ajustesDoDia(alunos) {
  const hoje = hojeISO();
  const ids = alunos.map((m) => m.user_id);
  if (!ids.length) return [];
  const lista = (q) =>
    q.then(
      (r) => r.data || [],
      () => [],
    );
  const [pronts, planos] = await Promise.all([
    lista(
      sb
        .from('nx_prontidao')
        .select('aluno_id,dia,sono,energia,dor,estresse,total,dor_locais')
        .eq('org_id', S.org.id)
        .in('aluno_id', ids)
        .eq('dia', hoje),
    ),
    lista(sb.from('nx_plano_corrida').select('*').eq('org_id', S.org.id).in('aluno_id', ids).eq('data', hoje)),
  ]);
  const pl = planos.filter((q) => !semCorrida(q) && q.tipo !== 'prova' && q.liberado !== false);
  if (!pl.length) return [];
  const comPlano = [...new Set(pl.map((q) => q.aluno_id))];
  const chaves = pl.map((q) => 'dia:' + q.id);
  const [rel, ajs, ocultas, feitos, membs] = await Promise.all([
    lista(
      sb
        .from('nx_garmin_dia')
        .select('aluno_id,dia,sono_s,fc_repouso,vfc')
        .in('aluno_id', comPlano)
        .gte('dia', somaDias(hoje, -66))
        .lte('dia', hoje),
    ),
    lista(
      sb.from('nx_ajustes_dor').select('id,chave,criado_em,desfeito_em').eq('org_id', S.org.id).in('chave', chaves),
    ),
    lista(sb.from('nx_sug_ocultas').select('chave').eq('org_id', S.org.id).in('chave', chaves)),
    lista(
      sb
        .from('nx_corridas')
        .select('plano_id')
        .in(
          'plano_id',
          pl.map((q) => q.id),
        ),
    ),
    lista(sb.from('nx_membros').select('user_id,corrida,nascimento').eq('org_id', S.org.id).in('user_id', comPlano)),
  ]);
  const oc = new Set(ocultas.map((x) => x.chave)),
    fe = new Set(feitos.map((c) => c.plano_id));
  const out = [];
  for (const q of pl) {
    const m = alunos.find((x) => x.user_id === q.aluno_id);
    if (!m || fe.has(q.id) || !faz('corrida', m)) continue;
    const chave = 'dia:' + q.id;
    const aj = ajs.find((a) => a.chave === chave);
    // o treinador já decidiu (manteve, trocou ou desfez a troca): não pergunta de novo
    if (oc.has(chave) || (aj && aj.desfeito_em)) continue;
    const pr = pronts.find((x) => x.aluno_id === q.aluno_id);
    const r2 = relogioDoDia(
      rel.filter((x) => x.aluno_id === q.aluno_id),
      hoje,
    );
    if (!pr && !r2) continue;
    const mb = membs.find((x) => x.user_id === q.aluno_id) || {};
    const perfil = perfilCorrida({ ...m, ...mb });
    const tt = estimaTotalSeg(estruturaDe(q), perfil);
    const min = tt && tt[1] ? Math.round((tt[0] + tt[1]) / 2 / 60) : +q.duracao_min || null;
    const forte = ehForte(q);
    const sg = ajusteDia({
      nome: m.apelido || m.nome,
      plano: { tipo: q.tipo, titulo: q.titulo || nomeTipo(q.tipo), forte, min },
      ck: pr
        ? { sono: pr.sono, energia: pr.energia, estresse: pr.estresse, total: pr.total, locais: pr.dor_locais }
        : null,
      rel: r2,
    });
    if (!sg && !aj) continue;
    out.push({
      chave,
      k: 'prontidao',
      m,
      q,
      sg,
      min,
      perfil,
      ajuste: aj ? { id: aj.id, chave, criado_em: aj.criado_em } : null,
    });
  }
  const peso = { alto: 0, medio: 1, leve: 2 };
  return out.sort((a, b) => (a.ajuste ? 1 : 0) - (b.ajuste ? 1 : 0) || peso[a.sg?.nivel] - peso[b.sg?.nivel]);
}

const AJD_NIVEL = { alto: ['Prontidão baixa', 'err'], medio: ['Prontidão moderada', 'warn'], leve: ['Um sinal', ''] };
function ajusteDiaCardHTML(x) {
  const nm = firstName(x.m.apelido || x.m.nome);
  if (x.ajuste)
    return `<div class="card ajd-card" data-ajd="${esc(x.chave)}"><div class="row" style="gap:12px">${avAluno(x.m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(x.m.nome)}</b><span class="small muted">Hoje · ${esc(x.q.titulo || nomeTipo(x.q.tipo))}${x.q.duracao_min ? ` ${x.q.duracao_min} min` : ''}</span></div></div>
      <div class="sug-ok">${I.check}<span class="grow">Treino trocado. ${esc(nm)} já vê o treino novo e a sua mensagem.</span><button type="button" class="link-btn small" data-ajd-desfazer="${esc(x.chave)}">Desfazer</button></div></div>`;
  const s = x.sg,
    [nvT, nvC] = AJD_NIVEL[s.nivel];
  const de = `${x.q.titulo || nomeTipo(x.q.tipo)}${x.min ? ` (~${x.min} min)` : ''}`;
  return `<div class="card ajd-card" data-ajd="${esc(x.chave)}">
    <div class="row" style="gap:12px">${avAluno(x.m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(x.m.nome)}</b><span class="tag ${nvC}">${nvT}</span></div></div>
    <div class="ajd-sinais">${s.sinais.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="ajd-troca"><div><small>Na planilha</small><b>${esc(de)}</b></div><i aria-hidden="true">${I.chev}</i><div class="novo"><small>Sugestão</small><b>${esc(s.novo.titulo)} ${s.novo.min} min</b></div></div>
    ${s.teste ? '<p class="small muted" style="margin-top:8px">Era dia de teste. Depois de trocar, remarque o teste na planilha para outro dia.</p>' : ''}
    <details class="ajd-msg"><summary class="small">Ver a mensagem que ${esc(nm)} recebe</summary><textarea class="textarea" rows="7" data-ajd-tx>${esc(s.msg)}</textarea><label class="aj-chk"><input type="checkbox" data-ajd-env checked><span>Enviar na conversa (com notificação)</span></label></details>
    <div class="row" style="gap:8px;margin-top:12px"><button type="button" class="btn grow" data-ajd-trocar>${I.check} Trocar treino</button><button type="button" class="btn ghost grow" data-ajd-manter>Manter</button></div>
    </div>`;
}
function bindAjusteDia(box, lista, depois) {
  const redesenha = (x) => {
    const c = box.querySelector(`[data-ajd="${CSS.escape(x.chave)}"]`);
    if (c) c.outerHTML = ajusteDiaCardHTML(x);
    bindAjusteDia(box, lista, depois);
  };
  box.querySelectorAll('.ajd-card').forEach((c) => {
    const x = lista.find((y) => y.chave === c.dataset.ajd);
    if (!x) return;
    const tr = c.querySelector('[data-ajd-trocar]');
    if (tr)
      tr.onclick = async () => {
        tr.disabled = true;
        tr.textContent = 'Trocando…';
        try {
          const texto = c.querySelector('[data-ajd-env]').checked ? c.querySelector('[data-ajd-tx]').value.trim() : '';
          await aplicarAjuste(x, { perfil: x.perfil }, [{ q: x.q, novo: x.sg.novo, desc: x.sg.desc }], [], texto);
          x.q = { ...x.q, tipo: x.sg.novo.tipo, titulo: x.sg.novo.titulo, duracao_min: x.sg.novo.min };
          toast('Treino trocado. O aluno já vê o treino novo.');
          redesenha(x);
        } catch (e) {
          console.error(e);
          tr.disabled = false;
          tr.innerHTML = `${I.check} Trocar treino`;
          toast(e.message || 'Não foi possível trocar o treino.', true);
        }
      };
    const mt = c.querySelector('[data-ajd-manter]');
    if (mt)
      mt.onclick = async () => {
        const { error } = await sb
          .from('nx_sug_ocultas')
          .insert({ org_id: S.org.id, aluno_id: x.m.user_id, chave: x.chave });
        if (error && !/duplicate/i.test(error.message || '')) return toast('Não foi possível salvar.', true);
        lista.splice(lista.indexOf(x), 1);
        c.remove();
        toast('Treino mantido como está na planilha.');
        depois && depois();
      };
    const dz = c.querySelector('[data-ajd-desfazer]');
    if (dz)
      dz.onclick = () =>
        desfazerAjuste(x, () => {
          lista.splice(lista.indexOf(x), 1);
          c.remove();
          depois && depois();
        });
  });
}
/** caixa "Ajuste do dia" na tela inicial do treinador */
async function ajusteDiaEquipe(box, alunos) {
  if (!box) return;
  const lista = await ajustesDoDia(alunos.filter(ehMinhaCorrida));
  if (!lista.length) return (box.innerHTML = '');
  const pend = lista.filter((x) => !x.ajuste).length;
  box.innerHTML = `<div class="section"><div class="section-h"><h2 class="h2">Ajuste do dia</h2>${pend ? `<span class="tag acc">${pend}</span>` : ''}</div>
    <p class="small muted" style="margin:-4px 0 10px">Check-in ou relógio mostrando que o corpo não está pronto para o treino de hoje. Troque com um toque ou mantenha.</p>
    <div class="stack">${lista.map(ajusteDiaCardHTML).join('')}</div>
    <p class="tiny dim" style="margin-top:10px">Troca de treino forte por leve nos dias de prontidão baixa, como no treino guiado por sinais de recuperação (Kiviniemi et al., 2007; Vesterinen et al., 2016). Com dor marcada, quem cuida é a Sugestão do app. A decisão é sua, e o aluno não vê estes cartões.</p></div>`;
  bindAjusteDia(box, lista, () => {
    if (!box.querySelector('.ajd-card')) box.innerHTML = '';
  });
}
