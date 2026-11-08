/* Nexos App · Relatório mensal, planilha do treinador, editor de treino, provas e polimento, calendário e painel de corrida.
   Parte 18 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- relatório mensal do aluno (PDF para mandar no WhatsApp) ---------- */
async function relatorioMes(alunoId, box, staff, m) {
  const st = S.cache.relM || (S.cache.relM = { comp: compDe(), msg: '' });
  const [y, mm] = st.comp.split('-').map(Number);
  const ini = isoDia(new Date(y, mm - 1, 1, 12)),
    fim = isoDia(new Date(y, mm, 0, 12));
  const iniAnt = isoDia(new Date(y, mm - 2, 1, 12)),
    fimAnt = isoDia(new Date(y, mm - 1, 0, 12));
  box.innerHTML = esqBloco();
  const ate = (d) => d + 'T23:59:59';
  const [corrs, corrsAnt, sess, sessAnt, plano, regs, provas] = await Promise.all([
    sb
      .from('nx_corridas')
      .select('data,tipo,distancia_m,duracao_s,plano_id')
      .eq('aluno_id', alunoId)
      .gte('data', ini)
      .lte('data', ate(fim))
      .order('data')
      .then((r) => (r.data || []).filter(ehCorr))
      .catch(() => []),
    sb
      .from('nx_corridas')
      .select('data,tipo,distancia_m')
      .eq('aluno_id', alunoId)
      .gte('data', iniAnt)
      .lte('data', ate(fimAnt))
      .then((r) => (r.data || []).filter(ehCorr))
      .catch(() => []),
    sb
      .from('nx_sessoes')
      .select('iniciado_em,treino_titulo')
      .eq('aluno_id', alunoId)
      .not('finalizado_em', 'is', null)
      .gte('iniciado_em', ini)
      .lte('iniciado_em', ate(fim))
      .then((r) => r.data || [])
      .catch(() => []),
    sb
      .from('nx_sessoes')
      .select('iniciado_em')
      .eq('aluno_id', alunoId)
      .not('finalizado_em', 'is', null)
      .gte('iniciado_em', iniAnt)
      .lte('iniciado_em', ate(fimAnt))
      .then((r) => r.data || [])
      .catch(() => []),
    sb
      .from('nx_plano_corrida')
      .select('id,data,tipo,liberado')
      .eq('aluno_id', alunoId)
      .gte('data', ini)
      .lte('data', fim)
      .then((r) => (r.data || []).filter((p) => !semCorrida(p) && p.liberado !== false))
      .catch(() => []),
    sb
      .from('nx_registros')
      .select('exercicio_nome,carga_kg,criado_em')
      .eq('aluno_id', alunoId)
      .not('carga_kg', 'is', null)
      .lte('criado_em', ate(fim))
      .order('criado_em')
      .limit(3000)
      .then((r) => r.data || [])
      .catch(() => []),
    sb
      .from('nx_participacoes')
      .select('titulo,data,distancia')
      .eq('aluno_id', alunoId)
      .gte('data', ini)
      .lte('data', fim)
      .then((r) => r.data || [])
      .catch(() => []),
  ]);
  const km = corrs.reduce((a, c) => a + c.distancia_m, 0) / 1000,
    kmAnt = corrsAnt.reduce((a, c) => a + c.distancia_m, 0) / 1000;
  const diasT = new Set([...corrs.map((c) => isoDia(c.data)), ...sess.map((x) => isoDia(x.iniciado_em))]).size;
  const diasAnt = new Set([...corrsAnt.map((c) => isoDia(c.data)), ...sessAnt.map((x) => isoDia(x.iniciado_em))]).size;
  const feitosPl = plano.filter((p) => corrs.some((c) => c.plano_id === p.id)).length;
  const ader = plano.length ? Math.round((feitosPl / plano.length) * 100) : null;
  // km e pace por semana do mês
  const semanas = [];
  for (let d = inicioSemana(dia(ini)); isoDia(d) <= fim; d.setDate(d.getDate() + 7)) semanas.push(isoDia(d));
  const porSem = semanas.map((s0) => {
    const s1 = isoDia(dia(s0).getTime() + 6 * 864e5);
    const l = corrs.filter((c) => isoDia(c.data) >= s0 && isoDia(c.data) <= s1);
    const dist = l.reduce((a, c) => a + c.distancia_m, 0);
    const t = l
      .filter((c) => c.distancia_m >= 2500)
      .reduce((a, c) => [a[0] + c.duracao_s, a[1] + c.distancia_m], [0, 0]);
    return { s0, km: dist / 1000, pace: t[1] ? t[0] / (t[1] / 1000) : null };
  });
  const maxKm = Math.max(5, ...porSem.map((x) => x.km));
  const longa = corrs.reduce((a, c) => (!a || c.distancia_m > a.distancia_m ? c : a), null);
  const rapida = corrs
    .filter((c) => c.distancia_m >= 3000)
    .reduce((a, c) => (!a || paceDe(c) < paceDe(a) ? c : a), null);
  // cargas: melhor carga no mês x antes do mês
  const porEx = {};
  regs.forEach((r) => {
    const n = r.exercicio_nome || 'Exercício';
    const e = (porEx[n] = porEx[n] || { antes: 0, mes: 0, vezes: 0 });
    const c = +r.carga_kg || 0;
    if (isoDia(r.criado_em) >= ini) {
      e.mes = Math.max(e.mes, c);
      e.vezes++;
    } else e.antes = Math.max(e.antes, c);
  });
  const cargas = Object.entries(porEx)
    .filter(([, e]) => e.mes > 0)
    .sort((a, b) => b[1].mes - b[1].antes - (a[1].mes - a[1].antes) || b[1].vezes - a[1].vezes)
    .slice(0, 5);
  const delta = (a, b, un = '') => {
    if (!b) return '';
    const d = a - b;
    if (Math.abs(d) < 0.05) return '<span class="rm-d">igual ao mês anterior</span>';
    return `<span class="rm-d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${un === 'km' ? f1(Math.abs(d)) + ' km' : Math.abs(Math.round(d))} vs. mês anterior</span>`;
  };
  const treinador = (await carregarEquipe()).find((p) => p.user_id === (m.treinador_id || S.user.id));
  const nomeMesTxt = nomeMes(st.comp);
  const fC = faz('corrida', m),
    fM = faz('musculacao', m);
  box.innerHTML = `
    <div class="rm-bar"><div class="row" style="gap:6px"><button class="icon-btn sm" id="rm-a" aria-label="Mês anterior">${I.back}</button><b class="rm-mes">${nomeMesTxt}</b><button class="icon-btn sm" id="rm-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
      <div class="row" style="gap:6px"><button class="btn sm" id="rm-pdf">${I.ficha} ${staff ? 'Gerar PDF' : 'Baixar PDF'}</button></div></div>
    ${staff ? `<label class="field" style="margin-top:12px"><span>Mensagem do treinador (vai no relatório)</span><textarea class="textarea" id="rm-msg" placeholder="Ex.: Mês muito consistente! Agora é manter os longões e caprichar no sono.">${esc(st.msg)}</textarea></label>` : ''}
    <div class="rm-folha" id="rm-folha">
      <div class="rm-top"><img src="icons/simbolo-escuro.svg" alt="Nexos"><div><span class="rm-ey">Relatório mensal</span><b>${nomeMesTxt}</b></div></div>
      <div class="rm-aluno">${fotoHTML(m, 'md')}<div><h2>${esc(m.nome || '')}</h2><span>${m.objetivo ? 'Objetivo: ' + esc(m.objetivo) : 'Nexos Performance e Saúde'}</span></div></div>
      <div class="rm-nums">
        ${fC ? `<div><b>${f1(km)}</b><span>km corridos</span>${delta(km, kmAnt, 'km')}</div><div><b>${corrs.length}</b><span>corridas</span></div>` : ''}
        ${fM ? `<div><b>${sess.length}</b><span>treinos de força</span></div>` : ''}
        <div><b>${diasT}</b><span>dias treinados</span>${delta(diasT, diasAnt)}</div>
        ${fC && ader != null ? `<div><b>${ader}%</b><span>da planilha cumprida</span></div>` : ''}
      </div>
      ${
        fC && corrs.length
          ? `<div class="rm-sec"><h3>Quilômetros por semana</h3><div class="rm-barras">${porSem.map((x) => `<div><i style="height:${Math.max(3, (x.km / maxKm) * 100)}%"></i><b>${f1(x.km)}</b><small>${dia(x.s0).getDate()}/${dia(x.s0).getMonth() + 1}</small></div>`).join('')}</div></div>
      <div class="rm-sec"><h3>Pace médio por semana</h3><div class="rm-paces">${
        porSem
          .filter((x) => x.pace)
          .map(
            (x) =>
              `<div><small>semana de ${dia(x.s0).getDate()}/${dia(x.s0).getMonth() + 1}</small><b>${fmtPace(x.pace)}</b></div>`,
          )
          .join('') || '<p class="small muted">Sem corridas de 2,5 km ou mais no mês.</p>'
      }</div></div>
      <div class="rm-sec"><h3>Destaques</h3><ul class="rm-dest">${longa ? `<li>Corrida mais longa: <b>${fmtKm(longa.distancia_m, 1)}</b> em ${fmtDia(longa.data)}</li>` : ''}${rapida ? `<li>Melhor pace (3 km ou mais): <b>${fmtPace(paceDe(rapida))}</b> em ${fmtDia(rapida.data)}</li>` : ''}${provas.map((p) => `<li>${icT(I.flag)}Prova: <b>${esc(p.titulo)}</b>${p.distancia ? ' · ' + esc(p.distancia) : ''}</li>`).join('')}</ul></div>`
          : ''
      }
      ${fM && cargas.length ? `<div class="rm-sec"><h3>Evolução de cargas</h3><div class="rm-cargas">${cargas.map(([n, e]) => `<div><span>${esc(n)}</span><b>${e.antes && e.antes !== e.mes ? `${fmtKg(e.antes)} → ` : ''}${fmtKg(e.mes)}</b>${!e.antes ? '<em class="nv">novo</em>' : e.mes > e.antes ? `<em>+${fmtKg(e.mes - e.antes)}</em>` : e.mes === e.antes ? '<em class="nv">mantida</em>' : ''}</div>`).join('')}</div></div>` : ''}
      ${!corrs.length && !sess.length ? '<p class="small muted" style="margin:14px 0">Nenhum treino registrado neste mês.</p>' : ''}
      <div class="rm-msg" id="rm-msg-out" ${st.msg ? '' : 'hidden'}><span>Mensagem do seu treinador</span><p>${esc(st.msg)}</p>${treinador ? `<b>${esc(firstName(treinador.nome))}</b>` : ''}</div>
      <div class="rm-pe">Nexos Performance e Saúde · ${esc(CONTATO.insta)} · São Luís–MA</div>
    </div>`;
  const re = () => relatorioMes(alunoId, box, staff, m);
  box.querySelector('#rm-a').onclick = () => {
    st.comp = somaMes(st.comp, -1);
    re();
  };
  box.querySelector('#rm-p').onclick = () => {
    st.comp = somaMes(st.comp, 1);
    re();
  };
  const msg = box.querySelector('#rm-msg');
  if (msg)
    msg.oninput = () => {
      st.msg = msg.value;
      const o = box.querySelector('#rm-msg-out');
      o.hidden = !st.msg.trim();
      o.querySelector('p').textContent = st.msg;
    };
  box.querySelector('#rm-pdf').onclick = async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    const txt = b.innerHTML;
    b.textContent = 'Gerando…';
    try {
      if (!window.html2pdf)
        await new Promise((ok, erro) => {
          const sc = document.createElement('script');
          sc.src =
            (window.NX_DEMO && window.NX_VENDOR) || new URL('vendor/html2pdf.bundle.min.js', document.baseURI).href;
          sc.onload = ok;
          sc.onerror = erro;
          document.head.appendChild(sc);
        });
      // o gerador de PDF não desenha SVG: troca a logo por PNG antes
      for (const im of box.querySelectorAll('#rm-folha img')) {
        if (!/svg/i.test(im.src)) continue;
        const w = im.clientWidth || 80,
          h = im.clientHeight || 34,
          cv = document.createElement('canvas');
        cv.width = w * 3;
        cv.height = h * 3;
        await new Promise((ok) => {
          const t = new Image();
          t.onload = () => {
            cv.getContext('2d').drawImage(t, 0, 0, cv.width, cv.height);
            ok();
          };
          t.onerror = ok;
          t.src = im.src;
        });
        im.style.width = w + 'px';
        im.style.height = h + 'px';
        im.src = cv.toDataURL('image/png');
      }
      const nomeArq = `Relatorio-Nexos-${firstName(m.nome || 'aluno')}-${st.comp}.pdf`;
      // gera a partir de uma cópia com largura de folha A4 (assim fica igual no celular e no computador)
      const caixa = document.createElement('div');
      caixa.style.cssText = 'position:fixed;left:0;top:0;width:760px;z-index:-1;pointer-events:none;opacity:1';
      const copia = box.querySelector('#rm-folha').cloneNode(true);
      copia.removeAttribute('id');
      copia.classList.add('rm-print');
      caixa.appendChild(copia);
      document.body.appendChild(caixa);
      let blob;
      try {
        blob = await window
          .html2pdf()
          .set({
            margin: 0,
            filename: nomeArq,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: 760,
              windowWidth: 760,
              scrollX: 0,
              scrollY: 0,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          })
          .from(copia)
          .outputPdf('blob');
      } finally {
        caixa.remove();
      }
      const arq = new File([blob], nomeArq, { type: 'application/pdf' });
      if (staff) {
        const tel = telWa(m.telefone);
        openSheet(
          `<p class="eyebrow">Relatório de ${esc(nomeMesTxt)}</p><div class="h2" style="margin-top:4px">PDF pronto</div><p class="small muted" style="margin-top:6px">Compartilhe direto no WhatsApp do aluno ou baixe o arquivo.</p>
          <div class="stack" style="margin-top:16px">${navigator.canShare && navigator.canShare({ files: [arq] }) ? '<button class="btn block wa-btn" id="rm-share">Compartilhar o PDF (WhatsApp)</button>' : ''}
          <button class="btn ghost block" id="rm-down">Baixar o PDF</button>
          ${tel ? `<a class="btn ghost block" href="https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${firstName(m.nome || '')}! Segue o seu relatório de ${nomeMesTxt} da Nexos`)}" target="_blank" rel="noopener">Abrir a conversa no WhatsApp</a>` : ''}</div>
          <p class="tiny dim" style="margin-top:12px">No computador: baixe o PDF, abra a conversa e arraste o arquivo para o WhatsApp.</p>`,
          (r) => {
            const sh = r.querySelector('#rm-share');
            if (sh)
              sh.onclick = () =>
                navigator
                  .share({ files: [arq], title: nomeArq, text: `Relatório de ${nomeMesTxt} · Nexos` })
                  .catch(() => {});
            r.querySelector('#rm-down').onclick = () => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = nomeArq;
              a.click();
            };
          },
        );
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nomeArq;
        a.click();
        toast('PDF baixado!');
      }
    } catch (err) {
      console.error(err);
      toast('Não foi possível gerar o PDF. Tente de novo.', true);
    }
    b.disabled = false;
    b.innerHTML = txt;
  };
}

/* ---------- guia rápido da planilha (primeira vez) ---------- */
function guiaPlanilha() {
  const toque = matchMedia('(pointer:coarse)').matches;
  const passos = [
    [
      '1',
      'Arraste da Biblioteca',
      toque
        ? 'Segure um treino da Biblioteca por um instante, até ele “descolar”, e arraste até o dia. Solte e pronto.'
        : 'Clique num treino da Biblioteca, segure e arraste até o dia. Solte e pronto.',
      'mod',
    ],
    [
      '2',
      'Mude de dia ou exclua',
      `Arraste um treino de um dia para outro para mudar a data. Para excluir, arraste até “Solte aqui para excluir”, que aparece no topo.${toque ? '' : ' Segure Ctrl ou Alt para copiar em vez de mover.'}`,
      'mov',
    ],
    [
      '3',
      'Toque para editar',
      'O + de cada dia cria um treino do zero. Tocando num treino você muda os passos, distâncias e zonas. No fim, use “Avisar aluno” para ele receber a notificação.',
      'ed',
    ],
  ];
  let i = 0;
  const draw = (r) => {
    const [n, t, d, k] = passos[i];
    r.querySelector('#gp').innerHTML =
      `<div class="gp-ilu gp-${k}"><span class="gp-card"></span><span class="gp-dia"></span><span class="gp-mao"></span></div>
      <p class="eyebrow" style="margin-top:16px">Passo ${n} de ${passos.length}</p><div class="h2" style="margin-top:4px">${t}</div><p class="small muted" style="margin-top:6px">${d}</p>
      <div class="gp-dots">${passos.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="grid2" style="margin-top:16px"><button class="btn ghost" id="gp-a">${i ? 'Voltar' : 'Pular'}</button><button class="btn" id="gp-p">${i === passos.length - 1 ? 'Entendi' : 'Próximo'}</button></div>`;
    r.querySelector('#gp-a').onclick = () => {
      if (!i) {
        store.set('nx_guia_plan', true);
        return closeSheet();
      }
      i--;
      draw(r);
    };
    r.querySelector('#gp-p').onclick = () => {
      if (i === passos.length - 1) {
        store.set('nx_guia_plan', true);
        return closeSheet();
      }
      i++;
      draw(r);
    };
  };
  openSheet('<div id="gp"></div>', draw);
}

/* ---------- arrastar e soltar (mouse e dedo) ---------- */
function arrastar(root, { item, alvo, soltar, handle }) {
  let st = null;
  let bloqueiaClique = false;
  const limpar = () => {
    if (!st) return;
    clearTimeout(st.timer);
    if (st.ghost) st.ghost.remove();
    if (st.alvoEl) st.alvoEl.classList.remove('alvo-on');
    if (st.el) st.el.classList.remove('arrastando-origem');
    document.body.classList.remove('arrastando');
    document.documentElement.classList.remove('trava-scroll');
    removeEventListener('scroll', segura);
    cancelAnimationFrame(st.raf);
    st = null;
  };
  // trava a página enquanto arrasta (no celular o dedo não pode rolar a tela)
  const segura = () => {
    if (st && st.ativo && Math.abs(scrollY - st.sy) > 1) scrollTo(scrollX, st.sy);
  };
  const comecar = () => {
    st.ativo = true;
    bloqueiaClique = true;
    st.sy = scrollY;
    document.documentElement.classList.add('trava-scroll');
    addEventListener('scroll', segura, { passive: true });
    const r = st.el.getBoundingClientRect();
    const g = st.el.cloneNode(true);
    g.classList.add('fantasma');
    g.style.width = Math.min(r.width, 260) + 'px';
    g.style.left = '0px';
    g.style.top = '0px';
    document.body.appendChild(g);
    st.ghost = g;
    st.dx = Math.min(st.x - r.left, 240);
    st.dy = st.y - r.top;
    st.el.classList.add('arrastando-origem');
    document.body.classList.add('arrastando');
    try {
      navigator.vibrate && navigator.vibrate(15);
    } catch {}
    mover(st.x, st.y);
    const sc = root.closest('.sheet');
    const auto = () => {
      if (!st) return;
      const dv = st.y < 70 ? -12 : st.y > innerHeight - 60 ? 12 : 0;
      if (dv) {
        if (sc) sc.scrollTop += dv;
        else {
          window.scrollBy(0, dv);
          st.sy = scrollY;
        }
      }
      st.raf = requestAnimationFrame(auto);
    };
    st.raf = requestAnimationFrame(auto);
  };
  const mover = (x, y) => {
    st.x = x;
    st.y = y;
    if (!st.ativo) return;
    st.ghost.style.transform = `translate(${x - st.dx}px, ${y - st.dy}px) rotate(-2deg)`;
    const el = document.elementFromPoint(x, y);
    const a = el && el.closest(alvo);
    if (a !== st.alvoEl) {
      if (st.alvoEl) st.alvoEl.classList.remove('alvo-on');
      if (a) a.classList.add('alvo-on');
      st.alvoEl = a;
    }
  };
  const terminar = () => {
    if (st && st.ativo && st.alvoEl) {
      const el = st.el,
        a = st.alvoEl,
        ev = { copia: st.copia };
      limpar();
      soltar(el, a, ev);
    } else limpar();
    setTimeout(() => (bloqueiaClique = false), 50);
  };
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    const el = e.target.closest(item);
    if (!el || !root.contains(el)) return;
    if (handle && !e.target.closest(handle)) return;
    if (e.target.closest('input,select,textarea')) return;
    st = { el, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, copia: e.altKey || e.ctrlKey || e.metaKey };
    const mv = (ev) => {
      if (!st) return;
      st.copia = ev.ctrlKey || ev.altKey || ev.metaKey;
      if (!st.ativo && Math.hypot(ev.clientX - st.x0, ev.clientY - st.y0) > 6) {
        st.x = ev.clientX;
        st.y = ev.clientY;
        comecar();
      }
      mover(ev.clientX, ev.clientY);
      if (st && st.ativo) ev.preventDefault();
    };
    const up = () => {
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
      terminar();
    };
    document.addEventListener('pointermove', mv);
    document.addEventListener('pointerup', up);
  });
  root.addEventListener(
    'touchstart',
    (e) => {
      const el = e.target.closest(item);
      if (!el || !root.contains(el) || e.touches.length > 1) return;
      if (handle && !e.target.closest(handle)) return;
      if (e.target.closest('input,select,textarea')) return;
      const t = e.touches[0];
      st = { el, x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, toque: true };
      st.timer = setTimeout(
        () => {
          if (st && !st.ativo) comecar();
        },
        handle ? 120 : 280,
      );
      const mv = (ev) => {
        if (!st) return;
        const tt = ev.touches[0];
        if (!st.ativo) {
          if (Math.hypot(tt.clientX - st.x0, tt.clientY - st.y0) > 10) {
            limpar();
            off();
          }
          return;
        }
        if (ev.cancelable) ev.preventDefault();
        mover(tt.clientX, tt.clientY);
      };
      const end = () => {
        off();
        terminar();
      };
      const off = () => {
        document.removeEventListener('touchmove', mv);
        document.removeEventListener('touchend', end);
        document.removeEventListener('touchcancel', end);
      };
      document.addEventListener('touchmove', mv, { passive: false });
      document.addEventListener('touchend', end);
      document.addEventListener('touchcancel', end);
    },
    { passive: true },
  );
  root.addEventListener(
    'click',
    (e) => {
      if (bloqueiaClique) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );
  root.addEventListener('contextmenu', (e) => {
    if (st || e.target.closest(item)) e.preventDefault();
  });
}

/* ---------- planilha do treinador: o que o aluno fez naquele treino (aparece junto do editor) ---------- */
async function montarFeito(r, feitoBase, plano) {
  const plan = document.createElement('div');
  plan.id = 'ed-plan';
  plan.hidden = true;
  while (r.firstChild) plan.appendChild(r.firstChild);
  r.innerHTML = `<p class="eyebrow">${fmtDia(plano.data)} · ${esc(plano.titulo || nomeTipo(plano.tipo))}</p>
    <div class="seg ed-modo" style="margin-top:10px"><button type="button" data-modo="feito" class="on">${I.check} Feito pelo aluno</button><button type="button" data-modo="plan">Treino prescrito</button></div>
    <div id="ed-feito" style="margin-top:14px"><p class="small muted">Carregando o treino do aluno…</p></div>`;
  r.appendChild(plan);
  r.querySelector('.ed-modo').onclick = (e) => {
    const b = e.target.closest('[data-modo]');
    if (!b) return;
    r.querySelectorAll('.ed-modo button').forEach((x) => x.classList.toggle('on', x === b));
    r.querySelector('#ed-feito').hidden = b.dataset.modo !== 'feito';
    plan.hidden = b.dataset.modo !== 'plan';
  };
  const box = r.querySelector('#ed-feito');
  const [{ data: c }, { data: al }] = await Promise.all([
    sb.from('nx_corridas').select('*').eq('id', feitoBase.id).maybeSingle(),
    sb
      .from('nx_membros')
      .select('nome,corrida,nascimento')
      .eq('org_id', S.org.id)
      .eq('user_id', feitoBase.aluno_id || plano.aluno_id)
      .maybeSingle(),
  ]);
  const hist90 = c ? await buscarHist90(c.aluno_id, c.data) : [];
  if (!c) {
    box.innerHTML = '<p class="small muted">Não foi possível carregar o treino do aluno.</p>';
    return;
  }
  const pace = paceDe(c),
    parc = c.parciais || [];
  const pk = (x) => x.seg / (x.parcial ? x.km % 1 || 1 : 1);
  const pMin = parc.length ? Math.min(...parc.map(pk)) : 0,
    pMax = parc.length ? Math.max(...parc.map(pk)) : 0;
  const prevKm = plano.distancia_km ? Number(plano.distancia_km) : null;
  box.innerHTML = `
    <div class="row between" style="gap:8px;flex-wrap:wrap"><b>${fmtDia(c.data)} · ${fmtHora(c.data)}${c.fonte === 'garmin' ? ' · Garmin' : c.fonte === 'celular' ? ' · GPS do celular' : ''}</b>
      ${c.comentario_treinador ? `<span class="tag ok">${I.check} Comentado</span>` : c.visto_treinador ? `<span class="tag ok">${I.check} Visto</span>` : '<span class="tag warn">Ainda não visto</span>'}</div>
    <div class="metrics" style="margin-top:10px">
      ${comDist(c) ? `<div class="metric"><span>Distância</span><b>${fmtKm(c.distancia_m).replace(' km', '')}<small>km</small></b>${prevKm ? `<em>previsto ${String(prevKm).replace('.', ',')} km · ${Math.round((c.distancia_m / 1000 / prevKm) * 100)}%</em>` : ''}</div>` : ''}
      <div class="metric"><span>Tempo</span><b>${fmtDurLongo(c.duracao_s)}</b></div>
      ${comDist(c) ? `<div class="metric"><span>Pace médio</span><b>${fmtPace(pace).replace('/km', '')}<small>/km</small></b></div>` : ''}
      ${c.fc_media ? `<div class="metric"><span>FC média</span><b>${c.fc_media}<small>bpm</small></b>${c.fc_max ? `<em>máx ${c.fc_max}</em>` : ''}</div>` : ''}
      ${c.elevacao_m ? `<div class="metric"><span>Subida</span><b>${Math.round(c.elevacao_m)}<small>m</small></b></div>` : ''}
      ${c.rpe != null ? `<div class="metric"><span>Esforço</span><b>${c.rpe}<small>/10</small></b><em>${rpeTxt(c.rpe)}</em></div>` : ''}
    </div>
    ${nexosIntHTML(nexosInteligencia(c, { plano, perfil: perfilCorrida(al || {}), hist: hist90 }))}
    ${c.dor ? `<div class="card" style="margin-top:10px;border-color:rgba(214,120,0,.35)"><span class="eyebrow" style="color:var(--warn)">Relatou dor${c.dor_local ? ': ' + esc(c.dor_local) : ''}</span></div>` : ''}
    ${corpoTags(c) ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">${corpoTags(c)}</div>` : ''}
    ${c.comentario ? `<div class="card" style="margin-top:10px"><span class="eyebrow">Como foi, nas palavras do aluno</span><p style="margin-top:6px">“${esc(c.comentario)}”</p></div>` : ''}
    ${c.comentario_treinador ? `<div class="card coment-tr" style="margin-top:10px"><span class="eyebrow">${I.feed} Seu comentário</span><p style="margin-top:6px;white-space:pre-line">${esc(c.comentario_treinador)}</p></div>` : ''}
    ${
      parc.length
        ? `<div class="card" style="margin-top:10px"><span class="eyebrow">Parciais</span><div class="splits" style="margin-top:8px">${parc
            .slice(0, 30)
            .map((x) => {
              const v = pk(x);
              const w = pMax > pMin ? 35 + (65 * (pMax - v)) / (pMax - pMin) : 100;
              return `<div><span>${x.parcial ? String(x.km).replace('.', ',') : 'km ' + x.km}</span><i style="width:${w.toFixed(0)}%"></i><b>${fmtPace(v).replace('/km', '')}</b><em>${x.fc ? x.fc + ' bpm' : ''}</em></div>`;
            })
            .join('')}</div></div>`
        : ''
    }
    <div class="grid2" style="margin-top:14px">${c.visto_treinador ? '' : `<button type="button" class="btn ghost" data-visto="corrida|${c.id}">${I.check} Visto</button>`}<button type="button" class="btn ghost" id="fe-coment">${I.feed} ${c.comentario_treinador ? 'Editar comentário' : 'Comentar'}</button></div>
    <a class="btn block" href="#/corrida/${c.id}" style="margin-top:8px">Ver análise completa (gráficos, mapa e voltas)</a>
    <button type="button" class="link-btn small" id="fe-editar" style="display:block;margin:12px auto 0">Editar o treino prescrito</button>`;
  const vb = box.querySelector('[data-visto]');
  if (vb) vb.onclick = () => marcarVisto(vb);
  box.querySelector('#fe-coment').onclick = () => comentarTreino(c, al || { nome: 'Aluno' });
  box.querySelector('#fe-editar').onclick = () => r.querySelector('[data-modo="plan"]').click();
  box.querySelector('a[href^="#/corrida/"]').onclick = () => closeSheet(true);
}

/* ---------- editor de treino estruturado ---------- */
function editorTreino({ alunoId, perfil, sessao, data, modelo, aoSalvar, modelos, feito }) {
  const base = sessao
    ? { ...sessao, estrutura: clone(estruturaDe(sessao)) }
    : {
        data,
        tipo: (modelo && modelo.tipo) || 'rodagem',
        titulo: modelo ? modelo.nome : '',
        estrutura: clone(modelo ? modelo.estrutura : [passo('co', 6, 'km', 'leve')]),
        descricao: '',
      };
  const t = base;
  const zonaSel = (z, cam) =>
    `<select class="input zsel" data-cam="${cam}" data-f="z" style="--zc:${(ZONAS_INFO[z] || ZONAS_INFO.leve).c}">${Object.entries(
      ZONAS_INFO,
    )
      .map(([k, i]) => `<option value="${k}" ${z === k ? 'selected' : ''}>${i.n}</option>`)
      .join('')}</select>`;
  const medSel = (m, cam) =>
    `<select class="input msel" data-cam="${cam}" data-f="med">${[
      ['km', 'km'],
      ['m', 'metros'],
      ['min', 'min'],
    ]
      .map(([k, l]) => `<option value="${k}" ${m === k ? 'selected' : ''}>${l}</option>`)
      .join('')}</select>`;
  const linhaPasso = (
    s,
    cam,
  ) => `<div class="passo" data-cam="${cam}" style="--zc:${(ZONAS_INFO[s.z] || ZONAS_INFO.leve).c}">
      <span class="alca" aria-label="Arrastar">⋮⋮</span>
      <select class="input ksel" data-cam="${cam}" data-f="k">${Object.entries(PASSOS)
        .map(([k, l]) => `<option value="${k}" ${s.k === k ? 'selected' : ''}>${l}</option>`)
        .join('')}</select>
      <input class="input vin" data-cam="${cam}" data-f="v" data-mask="dec" data-int="4" inputmode="decimal" value="${esc(String(s.v).replace('.', ','))}">
      ${medSel(s.med, cam)}${alvoLivre(s) ? '<span></span>' : zonaSel(s.z, cam)}
      <em class="pace-dica">${alvoLivre(s) ? alvoLivre(s) : perfil.pse ? pseTxt(s.z, true) + ' <span>(modo adaptação)</span>' : `pace ${paceZonaTxt(s.z, perfil)}${perfil.paces && (perfil.paces[s.z] || s.z === 'rec') ? '' : ' <span>(média, sem teste)</span>'} · ${s.med === 'min' ? 'dist.' : 'tempo'} est. ≈ ${estimaPasso(s, perfil).txt}`}</em>
      <button type="button" class="x-passo" data-del="${cam}" aria-label="Remover">${I.x}</button></div>`;
  const desenhar = (r) => {
    r.querySelector('#passos').innerHTML =
      t.estrutura
        .map((s, i) =>
          s.k === 'rep'
            ? `<div class="serie" data-cam="${i}"><div class="serie-h"><span class="alca" aria-label="Arrastar">⋮⋮</span><b>Repetir</b><input class="input nin" data-cam="${i}" data-f="n" data-mask="num" data-max="2" inputmode="numeric" value="${s.n}"><b>vezes</b><button type="button" class="x-passo" data-del="${i}" aria-label="Remover série">${I.x}</button></div>
          <div class="serie-c">${(s.passos || []).map((p, j) => linhaPasso(p, i + '.' + j)).join('')}<button type="button" class="link-btn small" data-addin="${i}">+ passo na série</button></div></div>`
            : linhaPasso(s, String(i)),
        )
        .join('') || '<p class="small muted">Adicione os passos do treino abaixo.</p>';
    r.querySelector('#perf').innerHTML = perfilHTML(t.estrutura, perfil, true);
    r.querySelector('#tot').innerHTML = `${(() => {
      const tt = estimaTotal(t.estrutura, perfil);
      return `<b>${tt.soDist ? '' : '≈ '}${tt.km}</b> · ${tt.soTempo ? '' : '≈ '}${tt.tempo}`;
    })()}${perfil.paces ? '' : ' <span class="tiny dim">(estimativa com paces médios)</span>'}`;
    r.querySelector('#desc-auto').textContent = descreverEstrutura(t.estrutura, perfil);
  };
  const pega = (cam) => {
    const [a, b] = String(cam).split('.').map(Number);
    return b == null ? { lista: t.estrutura, i: a } : { lista: t.estrutura[a].passos, i: b };
  };
  openSheet(
    `<p class="eyebrow">${sessao ? 'Editar treino' : 'Novo treino'} · ${fmtDia(base.data)}</p>
    <div class="grid2" style="margin-top:12px"><label class="field"><span>Nome do treino</span><input class="input" id="t-nome" value="${esc(t.titulo || '')}" placeholder="Ex.: 6 × 800 m"></label><label class="field"><span>Tipo</span><select class="input" id="t-tipo">${TIPOS_CORRIDA.map(([k, l]) => `<option value="${k}" ${t.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <p class="small muted sobre-ed" id="t-sobre">${esc(sobreTreino(t.tipo))}</p>
    <div class="card perf-card"><div id="perf"></div><div class="row between" style="margin-top:8px"><span class="small" id="tot"></span><span class="legenda">${Object.entries(
      ZONAS_INFO,
    )
      .map(([, z]) => `<i style="background:${z.c}" title="${z.n}"></i>`)
      .join('')}</span></div><p class="tiny dim" id="desc-auto" style="margin-top:6px"></p></div>
    <div id="passos" class="passos"></div>
    <div class="add-passos">${Object.entries(PASSOS)
      .map(([k, l]) => `<button type="button" class="chip" data-add="${k}">+ ${l}</button>`)
      .join('')}<button type="button" class="chip" data-add="rep">+ Série (repetir)</button></div>
    <label class="field" style="margin-top:16px"><span>Sua observação para o aluno (opcional)</span><textarea class="textarea" id="t-desc" placeholder="Ex.: terreno plano, hidrate a cada 20 min">${esc(t.descricao || '')}</textarea></label>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn grow" id="t-salvar">Salvar treino ${I.check}</button>${sessao ? '<button class="btn ghost" id="t-dup">Duplicar</button>' : ''}</div>
    <div class="row between" style="margin-top:12px"><button class="link-btn small" id="t-modelo">Salvar como modelo</button>${sessao ? '<button class="link-btn small" id="t-del" style="color:var(--err)">Excluir treino</button>' : ''}</div>`,
    (r) => {
      desenhar(r);
      if (feito && sessao) montarFeito(r, feito, sessao);
      const pc = r.querySelector('#passos');
      pc.addEventListener('change', (e) => {
        const el = e.target.closest('[data-cam]');
        if (!el || !el.dataset.f) return;
        if (el.dataset.f === 'n') {
          t.estrutura[+el.dataset.cam].n = Math.max(1, Math.round(num(el.value) || 1));
          desenhar(r);
          return;
        }
        const { lista, i } = pega(el.dataset.cam);
        const f = el.dataset.f;
        lista[i][f] = f === 'v' ? num(el.value) || 0 : el.value;
        if (f === 'k' && el.value === 'rc' && lista[i].z !== 'rec') lista[i].z = 'rec';
        if (f === 'k' && (el.value === 'aq' || el.value === 'dq')) lista[i].z = 'leve';
        desenhar(r);
      });
      pc.addEventListener('click', (e) => {
        const d = e.target.closest('[data-del]'),
          ai = e.target.closest('[data-addin]');
        if (d) {
          const { lista, i } = pega(d.dataset.del);
          lista.splice(i, 1);
          desenhar(r);
        }
        if (ai) {
          t.estrutura[+ai.dataset.addin].passos.push(passo('co', 400, 'm', 'intervalado'));
          desenhar(r);
        }
      });
      r.querySelector('.add-passos').onclick = (e) => {
        const b = e.target.closest('[data-add]');
        if (!b) return;
        const k = b.dataset.add;
        const novo =
          k === 'rep'
            ? serie(4, [passo('co', 400, 'm', 'intervalado'), passo('rc', 90, 'm', 'rec')])
            : k === 'aq'
              ? passo('aq', 2, 'km', 'leve')
              : k === 'dq'
                ? passo('dq', 1, 'km', 'leve')
                : k === 'rc'
                  ? passo('rc', 2, 'min', 'rec')
                  : k === 'ca'
                    ? passo('ca', 2, 'min', 'rec')
                    : k === 'lv'
                      ? passo('lv', 10, 'min', 'leve')
                      : passo('co', 2, 'km', 'leve');
        const iDq = t.estrutura.findIndex((s) => s.k === 'dq');
        if (k === 'aq') t.estrutura.unshift(novo);
        else if (k !== 'dq' && iDq >= 0) t.estrutura.splice(iDq, 0, novo);
        else t.estrutura.push(novo);
        desenhar(r);
      };
      // reordenar passos arrastando pela alça
      arrastar(pc, {
        item: '.passo, .serie',
        handle: '.alca',
        alvo: '.passo, .serie',
        soltar: (el, alvoEl) => {
          const de = el.dataset.cam,
            para = alvoEl.dataset.cam;
          if (de === para || para.startsWith(de + '.')) return;
          const o = pega(de),
            d = pega(para);
          const mov = o.lista[o.i];
          if (mov.k === 'rep' && d.lista !== t.estrutura)
            return toast('Uma série não pode ficar dentro de outra.', true);
          const ref = d.lista[d.i],
            mesma = o.lista === d.lista,
            desce = mesma && o.i < d.i;
          o.lista.splice(o.i, 1);
          const idx = d.lista.indexOf(ref);
          d.lista.splice(desce ? idx + 1 : idx, 0, mov);
          desenhar(r);
        },
      });
      const lerTopo = () => {
        t.titulo = r.querySelector('#t-nome').value.trim();
        t.tipo = r.querySelector('#t-tipo').value;
        t.descricao = r.querySelector('#t-desc').value.trim();
      };
      r.querySelector('#t-tipo').addEventListener('change', (e) => {
        r.querySelector('#t-sobre').textContent = sobreTreino(e.target.value);
      });
      const linha = () => {
        lerTopo();
        const rs = resumoEstrutura(t.estrutura, perfil);
        const zs = achatar(t.estrutura, perfil)
          .filter((s) => s.k === 'co')
          .sort((a, b) => b.seg - a.seg);
        return {
          data: t.data,
          tipo: t.tipo,
          titulo: t.titulo || null,
          estrutura: t.estrutura,
          distancia_km: Math.round(rs.km * 10) / 10,
          duracao_min: Math.round(rs.seg / 60),
          zona: zs[0] ? (zs[0].z === 'rec' ? 'leve' : zs[0].z) : null,
          descricao: t.descricao || null,
        };
      };
      r.querySelector('#t-salvar').onclick = async (e) => {
        if (!t.estrutura.length) return toast('Adicione pelo menos um passo.', true);
        e.currentTarget.disabled = true;
        const row = linha();
        const { error } = sessao
          ? await sb.from('nx_plano_corrida').update(row).eq('id', sessao.id)
          : await sb
              .from('nx_plano_corrida')
              .insert({ ...row, org_id: S.org.id, aluno_id: alunoId, criado_por: S.user.id });
        if (error) {
          e.currentTarget.disabled = false;
          return toast('Não foi possível salvar.', true);
        }
        closeSheet();
        toast('Treino salvo!');
        aoSalvar();
        // treino já liberado e enviado ao Garmin: manda a versão nova para o relógio
        if (sessao && sessao.liberado && S.cache.garmOn)
          enviarGarmin(alunoId, [{ ...sessao, ...row, id: sessao.id, liberado: true }], perfil)
            .then((r) => {
              if (r.enviados) toast(`Treino atualizado também no ${nomeRelogio(r)} do aluno ⌚`);
            })
            .catch(() => {});
      };
      const dup = r.querySelector('#t-dup');
      if (dup)
        dup.onclick = async () => {
          const row = linha();
          const d = dia(row.data);
          d.setDate(d.getDate() + 1);
          const { error } = await sb
            .from('nx_plano_corrida')
            .insert({ ...row, data: isoDia(d), org_id: S.org.id, aluno_id: alunoId, criado_por: S.user.id });
          if (error) return toast('Não foi possível duplicar.', true);
          closeSheet();
          toast('Duplicado no dia seguinte. Arraste para onde quiser.');
          aoSalvar();
        };
      const del = r.querySelector('#t-del');
      if (del)
        del.onclick = async () => {
          if (sessao.garmin_workout_id)
            await chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: [{ plano_id: sessao.id }] }).catch(
              () => {},
            );
          const { error } = await sb.from('nx_plano_corrida').delete().eq('id', sessao.id);
          if (error) return toast('Não foi possível excluir.', true);
          closeSheet();
          toast('Treino excluído.');
          aoSalvar();
        };
      r.querySelector('#t-modelo').onclick = async () => {
        lerTopo();
        const nome = t.titulo || nomeTipo(t.tipo);
        const { data: novo, error } = await sb
          .from('nx_modelos_corrida')
          .insert({ org_id: S.org.id, nome, tipo: t.tipo, estrutura: t.estrutura, criado_por: S.user.id })
          .select('*')
          .single();
        if (error) return toast('Não foi possível salvar o modelo.', true);
        if (modelos && novo) modelos.push(novo);
        toast(`Modelo “${nome}” salvo na biblioteca.`);
      };
    },
  );
}

/* ---------- detalhe do treino para o aluno ---------- */
function verTreinoPlanilha(p, perfil, feito) {
  const est = estruturaDe(p);
  const passoH = (s, extra = '') => {
    if (alvoLivre(s))
      return `<div class="passo-v" style="--zc:#9aa8c0"><b>${PASSOS[s.k]}${extra}</b><span>${medTxt(s)} · <strong>${alvoLivre(s)}</strong></span></div>`;
    const z = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
    const pzt = paceZonaTxt(s.z, perfil);
    const e = estimaPasso(s, perfil);
    const alvoT =
      perfil && perfil.pse
        ? ''
        : ` <em class="alvo-t">${e.tipo === 'dist' ? 'dist. est.' : 'tempo est.'} ≈ ${e.txt}</em>`;
    return `<div class="passo-v" style="--zc:${z.c}"><b>${PASSOS[s.k]}${extra}</b><span>${medTxt(s)} · ${z.n} · <strong>${pzt}</strong>${alvoT}</span></div>`;
  };
  openSheet(
    `<p class="eyebrow">${fmtDia(p.data)} · ${esc(nomeTipo(p.tipo))}</p><div class="h2" style="margin-top:4px">${esc(p.titulo || nomeTipo(p.tipo))}</div>
    ${sobreTreino(p.tipo) ? `<p class="small muted" style="margin-top:6px">${esc(sobreTreino(p.tipo))}</p>` : ''}
    <div class="card perf-card" style="margin-top:12px">${perfilHTML(est, perfil, true)}<p class="small" style="margin-top:8px">${(() => {
      const t = estimaTotal(est, perfil);
      return `<b>${t.soDist ? '' : '≈ '}${t.km}</b> · ${t.soTempo ? '' : '≈ '}${t.tempo}`;
    })()}</p></div>
    <div class="stack" style="margin-top:12px">${est.map((s) => (s.k === 'rep' ? `<div class="serie-v"><b>Repita ${s.n} vezes:</b>${(s.passos || []).map((x) => passoH(x)).join('')}</div>` : passoH(s))).join('')}</div>
    ${p.descricao ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Observação do treinador</span><p style="margin-top:6px;white-space:pre-line">${esc(p.descricao)}</p></div>` : ''}
    ${feito ? `<a class="btn ghost block" href="#/corrida/${feito.id}" style="margin-top:16px">✓ Feito: ${fmtKm(feito.distancia_m, 1)} · ${fmtPace(paceDe(feito))}</a>` : `<button class="btn block" id="reg-agora" style="margin-top:16px">${I.plus} Registrar esta corrida</button>`}
    ${!feito && !S.staff && p.data >= hojeISO() && est.length ? `<button class="btn ghost block gar-btn" id="gar-env" style="margin-top:8px" hidden>${RELOGIO_IC} ${p.garmin_enviado_em ? 'Já está no seu relógio ✓ · reenviar' : 'Enviar para o meu relógio'}</button>` : ''}
    <button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`,
    (r) => {
      const b = r.querySelector('#reg-agora');
      if (b)
        b.onclick = () =>
          registrarCorrida(S.user.id, (id) => {
            location.hash = '#/corrida/' + id;
          });
      const g = r.querySelector('#gar-env');
      if (g) {
        sb.from('nx_integracoes')
          .select('provedor,escopo')
          .eq('user_id', S.user.id)
          .in('provedor', ['garmin', 'intervals'])
          .then(
            ({ data }) => {
              if ((data || []).some((i) => i.provedor === 'garmin' || icuEscreve(i))) g.hidden = false;
            },
            () => {},
          );
        g.onclick = async () => {
          g.disabled = true;
          g.textContent = 'Enviando…';
          try {
            const res = await enviarGarmin(S.user.id, [p], perfil);
            if (res.enviados) {
              p.garmin_enviado_em = new Date().toISOString();
              g.innerHTML = `${RELOGIO_IC} No seu relógio ✓`;
              toast(
                res.via === 'intervals'
                  ? 'Treino enviado! Abra o app do relógio (Zepp, Coros, Huawei…) e sincronize para ele aparecer.'
                  : 'Treino enviado! Sincronize o relógio para ele aparecer.',
              );
            } else {
              g.disabled = false;
              g.textContent = 'Tentar de novo';
              toast(
                res.precisa_reconectar
                  ? 'Reconecte o relógio na aba Conexões para liberar o envio de treinos.'
                  : res.sem_garmin
                    ? 'Conecte o relógio na aba Conexões.'
                    : 'Não consegui enviar agora. Tente de novo.',
                true,
              );
            }
          } catch (er) {
            g.disabled = false;
            g.textContent = 'Tentar de novo';
            toast(er.message, true);
          }
        };
      }
    },
  );
}

/* ================= PROVAS NA PLANILHA + POLIMENTO ================= */
const kmDaProva = (txt) => {
  const m = String(txt || '')
    .replace(',', '.')
    .match(/\d+(\.\d+)?/);
  const v = m ? +m[0] : 10;
  return /mi(lha)?s?\b/i.test(txt || '') ? v * 1.609 : v;
};
const janelaPolimento = (km) => (km >= 30 ? 14 : km >= 15 ? 10 : 7);
const fatorPolimento = (diasAntes) => (diasAntes <= 2 ? 0.45 : diasAntes <= 7 ? 0.6 : 0.8);
const diasAte = (iso) => Math.round((dia(iso) - dia(hojeISO())) / 864e5);
function arredPasso(v, med) {
  if (med === 'km') return Math.max(1, Math.round(v * 2) / 2);
  if (med === 'm') return Math.max(100, Math.round(v / 100) * 100);
  return Math.max(5, Math.round(v / 5) * 5);
}
function reduzirEstrutura(est, f) {
  return est.map((s) =>
    s.k === 'rep'
      ? { ...s, n: Math.max(1, Math.round(s.n * f)) }
      : s.k === 'co'
        ? { ...s, v: arredPasso(s.v * f, s.med) }
        : clone(s),
  );
}
function tempoAteProva(iso) {
  const d = diasAte(iso);
  if (d <= 0) return { big: d === 0 ? 'Hoje' : '–', un: d === 0 ? '' : '', txt: d === 0 ? 'é hoje!' : 'já passou' };
  if (d < 7)
    return {
      big: String(d),
      un: d === 1 ? 'dia' : 'dias',
      txt: d === 1 ? 'é amanhã' : `é nesta semana · faltam ${d} dias`,
    };
  const s = Math.floor(d / 7),
    r = d % 7,
    sr = Math.round(d / 7);
  return {
    big: String(sr),
    un: sr === 1 ? 'semana' : 'semanas',
    txt: `faltam ${s} semana${s > 1 ? 's' : ''}${r ? ` e ${r} dia${r > 1 ? 's' : ''}` : ''} (${d} dias)`,
  };
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pa-nav]');
  if (!b) return;
  const car = b.closest('.prova-alertas').querySelector('.pa-car');
  car.scrollBy({ left: +b.dataset.paNav * car.clientWidth, behavior: 'smooth' });
});
document.addEventListener(
  'scroll',
  (e) => {
    const car = e.target;
    if (!car.classList || !car.classList.contains('pa-car')) return;
    const box = car.closest('.prova-alertas');
    const n = car.children.length;
    const i = Math.round(car.scrollLeft / Math.max(1, car.clientWidth));
    const lab = box.querySelector('[data-pa-i]');
    if (lab) lab.textContent = i + 1;
    box.querySelectorAll('[data-pa-nav]').forEach((x) => {
      x.disabled = x.dataset.paNav === '-1' ? i <= 0 : i >= n - 1;
    });
  },
  true,
);
function provasBannerHTML(provas, staff, semPol) {
  if (!provas.length) return '';
  const varias = provas.length > 1;
  return `<div class="prova-alertas">${varias ? `<div class="pa-nav"><span class="pa-cont"><b data-pa-i>1</b> de ${provas.length} provas</span><button type="button" class="pa-seta" data-pa-nav="-1" aria-label="Prova anterior" disabled>${I.back}</button><button type="button" class="pa-seta" data-pa-nav="1" aria-label="Próxima prova">${I.chev}</button></div>` : ''}<div class="pa-car">${provas
    .map((p, i) => {
      const t = tempoAteProva(p.data);
      const km = kmDaProva(p.distancia);
      const jan = janelaPolimento(km);
      const d = diasAte(p.data);
      const outra = provas[i + 1] && Math.round((dia(provas[i + 1].data) - dia(p.data)) / 864e5);
      const fase =
        !staff || semPol
          ? ''
          : d <= jan
            ? '<span class="pa-fase">Janela de polimento</span>'
            : `<span class="pa-fase off">Janela de polimento a partir de ${fmtCurto(isoDia(dia(p.data).getTime() - jan * 864e5) + 'T12:00:00')}</span>`;
      return `<div class="prova-alerta"><div class="pa-n"><b>${t.big}</b><span>${t.un}</span></div>
      <div class="grow" style="min-width:0"><span class="pa-ey">${icT(I.flag)}${staff ? 'Aluno tem prova' : 'Você tem prova'}</span><b class="pa-t">${esc(p.titulo)}</b>
        <span class="pa-s">${fmtDiaSem(p.data)}${p.distancia ? ' · ' + esc(p.distancia) : ''}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span>
        <span class="pa-s pa-falta">${t.txt}</span>
        ${staff && outra && outra <= 14 ? `<span class="pa-s" style="color:var(--prova);font-weight:700">Outra prova ${outra} dia${outra > 1 ? 's' : ''} depois</span>` : ''}${fase}
        ${staff && !semPol ? `<button class="btn sm pa-btn" data-pol="${p.id}">Ver sugestão de polimento</button>` : ''}</div></div>`;
    })
    .join('')}</div>
  ${staff ? `<p class="tiny dim" style="margin-top:2px">${semPol ? 'Sugestão de polimento desligada para este aluno (compete com frequência). <button class="link-btn tiny" data-semp="0">Ligar de novo</button>' : 'O polimento é só sugestão: nada muda na planilha sem você aplicar. <button class="link-btn tiny" data-semp="1">Não sugerir para este aluno</button>'}</p>` : ''}</div>`;
}
function semanaPolimentoPadrao(km) {
  const L = (n, k) => passo('co', n, 'km', k);
  const base = [
    [6, 'Rodagem leve', 'rodagem', [L(km >= 15 ? 7 : 5, 'leve')]],
    [
      4,
      'Ritmo de prova curto',
      'ritmo',
      [
        passo('aq', 2, 'km', 'leve'),
        serie(3, [passo('co', 1, 'km', km >= 15 ? 'maratona' : 'limiar'), passo('rc', 2, 'min', 'rec')]),
        passo('dq', 1, 'km', 'leve'),
      ],
    ],
    [
      2,
      'Soltura + acelerações',
      'regenerativo',
      [passo('co', 20, 'min', 'leve'), serie(4, [passo('co', 100, 'm', 'tiros'), passo('rc', 1, 'min', 'rec')])],
    ],
  ];
  if (km >= 15)
    base.unshift([9, 'Rodagem com ritmo de prova', 'ritmo', [L(3, 'leve'), L(4, 'maratona'), L(2, 'leve')]]);
  if (km >= 30)
    base.unshift(
      [13, 'Último longão (reduzido)', 'longao', [L(16, 'leve')]],
      [
        11,
        '3 × 3 km ritmo de prova',
        'ritmo',
        [
          passo('aq', 2, 'km', 'leve'),
          serie(3, [L(3, 'maratona'), passo('rc', 3, 'min', 'rec')]),
          passo('dq', 1, 'km', 'leve'),
        ],
      ],
    );
  return base.map(([d, titulo, tipo, estrutura]) => ({ d, titulo, tipo, estrutura }));
}
async function polimentoSheet(alunoId, prova, perfil, aoAplicar) {
  const km = kmDaProva(prova.distancia);
  const jan = janelaPolimento(km);
  const hoje = hojeISO();
  const ini = isoDia(dia(prova.data).getTime() - jan * 864e5);
  const fim = isoDia(dia(prova.data).getTime() - 864e5);
  const de = ini > hoje ? ini : hoje;
  const plano = de <= fim ? await buscarPlano(alunoId, de, fim) : [];
  const jaFeito = (p) => /polimento/i.test(p.titulo || '');
  const linhas = plano.map((p) => {
    const est = estruturaDe(p);
    const antes = resumoEstrutura(est, perfil).km;
    const da = Math.round((dia(prova.data) - dia(p.data)) / 864e5);
    const f = fatorPolimento(da);
    const nova = jaFeito(p) ? est : reduzirEstrutura(est, f);
    const depois = resumoEstrutura(nova, perfil).km;
    return { p, nova, antes, depois, da, f, ja: jaFeito(p) };
  });
  const totA = linhas.reduce((a, l) => a + l.antes, 0),
    totD = linhas.reduce((a, l) => a + (l.ja ? l.antes : l.depois), 0);
  const padrao = semanaPolimentoPadrao(km).filter((x) => isoDia(dia(prova.data).getTime() - x.d * 864e5) >= hoje);
  openSheet(
    `<p class="eyebrow">Sugestão de polimento · ${esc(prova.titulo)}</p><div class="h2" style="margin-top:4px">Semana${jan > 7 ? 's' : ''} mais leve${jan > 7 ? 's' : ''} antes da prova?</div><p class="small" style="margin-top:6px;color:var(--prova);font-weight:700">É só uma sugestão. Nada muda na planilha até você tocar em “Aplicar”.</p>
    <p class="small muted" style="margin-top:6px">Prova de ${f1(km)} km em ${fmtDiaSem(prova.data).toLowerCase()}. Sugestão: reduzir o <b>volume</b> nos ${jan} dias antes e manter a <b>intensidade</b> (os tiros e ritmos continuam no mesmo pace, só com menos repetições). Isso chega o aluno descansado sem perder o ritmo.</p>
    <div class="pol-regra"><span>8 a 14 dias antes</span><b>−20%</b><span>3 a 7 dias antes</span><b>−40%</b><span>1 e 2 dias antes</span><b>−55%</b></div>
    ${
      linhas.length
        ? `<div class="stack" style="margin-top:16px">${linhas.map((l) => `<div class="pol-l ${l.ja ? 'ja' : ''}"><div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(l.p.titulo || nomeTipo(l.p.tipo))}</b><span class="small muted">${DIAS[dia(l.p.data).getDay()]} ${dia(l.p.data).getDate()} · ${l.da} dia${l.da > 1 ? 's' : ''} antes</span></div>${l.ja ? '<span class="tag ok">já ajustado</span>' : `<span class="pol-km"><s>${f1(l.antes)} km</s> → <b>${f1(l.depois)} km</b></span>`}</div>`).join('')}</div>
      <p class="small" style="margin-top:12px">Volume nesses dias: <b>${f1(totA)} km → ${f1(totD)} km</b></p>
      <label class="aceite" style="margin-top:12px"><input type="checkbox" id="pol-avisar" checked><span>Avisar o aluno que a planilha mudou</span></label>
      ${linhas.some((l) => !l.ja) ? '<button class="btn block" id="pol-ok" style="margin-top:12px">Aplicar polimento</button>' : '<p class="small muted" style="margin-top:12px">O polimento já está aplicado nesses treinos.</p>'}`
        : `<div class="card" style="margin-top:16px"><b>Ainda não há treinos nesses dias</b><p class="small muted" style="margin:4px 0 10px">Posso montar uma semana de polimento pronta para ${f1(km)} km. Depois é só ajustar arrastando.</p>
        ${padrao.length ? `<div class="stack">${padrao.map((x) => `<div class="pol-l"><div class="grow"><b>${esc(x.titulo)}</b><span class="small muted" style="display:block">${x.d} dias antes · ${f1(resumoEstrutura(x.estrutura, perfil).km)} km</span></div>${perfilHTML(x.estrutura, perfil)}</div>`).join('')}</div><button class="btn block" id="pol-criar" style="margin-top:12px">Montar semana de polimento</button>` : '<p class="small muted">A prova está muito próxima para montar treinos.</p>'}</div>`
    }
    <p class="tiny dim" style="margin-top:12px">Base: polimento com redução de volume de 40–60% e intensidade mantida (Bosquet e col., 2007; Mujika e Padilla, 2003).</p>`,
    (r) => {
      const ok = r.querySelector('#pol-ok');
      if (ok)
        ok.onclick = async () => {
          ok.disabled = true;
          for (const l of linhas.filter((x) => !x.ja)) {
            const rs = resumoEstrutura(l.nova, perfil);
            await sb
              .from('nx_plano_corrida')
              .update({
                estrutura: l.nova,
                titulo: `${l.p.titulo || nomeTipo(l.p.tipo)} · polimento`,
                distancia_km: Math.round(rs.km * 10) / 10,
                duracao_min: Math.round(rs.seg / 60),
              })
              .eq('id', l.p.id);
          }
          if (r.querySelector('#pol-avisar').checked) notificarAluno('planilha', alunoId);
          closeSheet();
          toast('Polimento aplicado!');
          aoAplicar();
        };
      const cr = r.querySelector('#pol-criar');
      if (cr)
        cr.onclick = async () => {
          cr.disabled = true;
          const novos = padrao.map((x) => {
            const rs = resumoEstrutura(x.estrutura, perfil);
            return {
              org_id: S.org.id,
              aluno_id: alunoId,
              data: isoDia(dia(prova.data).getTime() - x.d * 864e5),
              tipo: x.tipo,
              titulo: x.titulo + ' · polimento',
              estrutura: x.estrutura,
              distancia_km: Math.round(rs.km * 10) / 10,
              duracao_min: Math.round(rs.seg / 60),
              zona: null,
              criado_por: S.user.id,
            };
          });
          const { error } = await sb.from('nx_plano_corrida').insert(novos);
          if (error) {
            cr.disabled = false;
            return toast('Não foi possível montar.', true);
          }
          closeSheet();
          toast('Semana de polimento montada!');
          aoAplicar();
        };
    },
  );
}

/* ---------- calendário da planilha ---------- */
// dias sem corrida na planilha: day off e dia de força por conta do aluno
const semCorrida = (p) => !!p && (p.tipo === 'folga' || p.tipo === 'forca');
const FORCA_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>';
const OFF_IC =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" opacity=".5"><rect x="2" y="7.6" width="3.6" height="11" rx="1.7"/><rect x="2.6" y="14.8" width="14.6" height="3.8" rx="1.7"/><rect x="3.8" y="18.2" width="2.2" height="3.2" rx=".9"/><rect x="14.4" y="18.2" width="2.2" height="3.2" rx=".9"/></g><g fill="none" stroke="currentColor" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"><path d="M8.2 8.8 9.7 13.4h6.2l1.6 6.6h2.4"/><path d="M8.6 10.4l4.2 2"/></g><circle cx="8" cy="4.5" r="2.5" fill="currentColor"/></svg>'; // pessoa sentada na poltrona
function cartaoSessao(p, perfil, feito, staff) {
  if (p.tipo === 'forca')
    return `<div class="ses forca-l ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}"><div class="ses-t"><span class="off-ic fo">${FORCA_IC}</span><b>Força</b></div><span class="ses-m">${p.descricao ? esc(p.descricao) : 'por conta do aluno'}</span></div>`;
  if (p.tipo === 'folga')
    return `<div class="ses folga ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}"><div class="ses-t"><span class="off-ic">${OFF_IC}</span><b>Day off</b></div><span class="ses-m">Descanso</span></div>`;
  const hoje = isoDia(new Date());
  const st = feito ? 'feito' : p.data < hoje ? 'perdido' : 'pend';
  const est = estruturaDe(p);
  const rs = resumoEstrutura(est, perfil);
  return `<div class="ses ${st} ${staff && p.liberado === false ? 'rasc' : ''}" data-ses="${p.id}" ${staff ? 'draggable="false"' : ''}>
    ${feito ? `<div class="ses-conc"><i>${I.check}</i>Treino concluído</div>` : ''}
    <div class="ses-t"><b>${esc(p.titulo || nomeTipo(p.tipo))}</b>${!feito && st === 'perdido' ? '<span class="ses-x">!</span>' : ''}</div>
    ${perfilHTML(est, perfil)}
    ${feito ? `<div class="ses-res"><div><small>Distância</small><b>${fmtKm(feito.distancia_m, 1)}</b></div><div><small>Pace</small><b>${fmtPace(paceDe(feito)).replace('/km', '')}<em>/km</em></b></div></div>` : ''}
    <span class="ses-m">${feito ? 'Previsto ' : ''}${rs.km && rs.mostraKm ? f1(rs.km) + ' km' : ''}${rs.seg && rs.mostraSeg ? (rs.km && rs.mostraKm ? ' · ' : '') + fmtDur(rs.seg) : ''}</span></div>`;
}
// etiqueta de força (Nexos) no dia da semana de corrida: prevista, feita ou rascunho (só o treinador vê)
function forcaDiaHTML(fc, k, semana, staff) {
  if (!fc) return '';
  const i = dsemIdx(k),
    lib = fc.lib.includes(semana),
    feitos = fc.se.filter((x) => isoDia(x.iniciado_em) === k);
  const prev = (lib || staff) && !fc.off.includes(i) ? fc.tr.filter((t) => (t.dias || []).includes(i)) : [];
  const itens = [
    ...prev.map((t) => ({ t: t.titulo, id: t.id, ok: feitos.some((x) => x.treino_id === t.id), rasc: !lib })),
    ...feitos
      .filter((x) => !prev.some((t) => t.id === x.treino_id))
      .map((x) => ({ t: x.treino_titulo || 'Treino', ok: true })),
  ];
  const hoje = hojeISO();
  // para o aluno, a etiqueta abre o treino de força
  return itens
    .map((x) => {
      const tag = !staff && x.id ? 'a' : 'div';
      return `<${tag} class="forca-tag ${x.ok ? 'ok' : k < hoje ? 'perdeu' : ''} ${x.rasc && !x.ok ? 'rasc' : ''}"${tag === 'a' ? ` href="#/treino/${x.id}" style="color:inherit;text-decoration:none"` : ''} title="Força · ${esc(x.t)}${x.ok ? ' (feito)' : x.rasc ? ' (semana de força ainda não liberada)' : ''}"><span class="ft-ic">${HALTER_S}</span><span class="ellip">${esc(x.t)}</span>${x.ok ? `<i class="ft-ok">${I.check}</i>` : ''}</${tag}>`;
    })
    .join('');
}
function calendarioHTML(ini, semanas, plano, ativs, perfil, staff, provas = [], m = null, fc = null, ciclo = null) {
  const corridas = ativs.filter(ehCorr),
    outras = ativs.filter((c) => !ehCorr(c));
  const hoje = isoDia(new Date());
  let h = '';
  for (let w = 0; w < semanas; w++) {
    const s0 = new Date(ini);
    s0.setDate(ini.getDate() + w * 7);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s0);
      d.setDate(s0.getDate() + i);
      return d;
    });
    const doPlano = plano.filter((p) => p.data >= isoDia(dias[0]) && p.data <= isoDia(dias[6]));
    const km = doPlano.reduce((a, p) => a + resumoEstrutura(estruturaDe(p), perfil).km, 0);
    const feitoKm = corridas
      .filter((c) => {
        const k = isoDia(c.data);
        return k >= isoDia(dias[0]) && k <= isoDia(dias[6]);
      })
      .reduce((a, c) => a + c.distancia_m / 1000, 0);
    const prSem = provas.filter((p) => p.data >= isoDia(dias[0]) && p.data <= isoDia(dias[6]));
    h += `<div class="cal-sem ${prSem.length ? 'sem-prova' : ''}">${prSem.length ? `<div class="sem-prova-l">${icT(I.flag)}Semana da prova: ${prSem.map((p) => esc(p.titulo)).join(', ')}</div>` : ''}<div class="cal-sem-h"><b>${dias[0].getDate()}/${dias[0].getMonth() + 1} – ${dias[6].getDate()}/${dias[6].getMonth() + 1}</b><span>${km ? `previsto ${f1(km)} km` : 'sem treinos'}${feitoKm ? ` · feito ${f1(feitoKm)} km` : ''}</span></div>${
      staff && doPlano.length
        ? (() => {
            const nLib = doPlano.filter((p) => p.liberado !== false).length;
            const de = isoDia(dias[0]),
              ate = isoDia(dias[6]);
            return nLib === doPlano.length
              ? `<div class="lib-bar ok"><span>✓ Semana liberada: o aluno já vê estes treinos</span><button type="button" class="link-btn small" data-desliberar="${de}|${ate}">Cancelar liberação</button></div>${
                  S.cache.garmOn
                    ? (() => {
                        const tr = doPlano.filter(
                          (p) => p.tipo !== 'folga' && estruturaDe(p).length && p.data >= hojeISO(),
                        );
                        const env = tr.filter((p) => p.garmin_enviado_em).length;
                        const err = tr.some((p) => p.garmin_erro);
                        return tr.length
                          ? `<div class="gar-bar ${env === tr.length ? 'ok' : err ? 'err' : ''}"><span>${RELOGIO_IC} ${env === tr.length ? (S.cache.relNome === 'relógio' ? 'No relógio do aluno ✓' : 'No Garmin e no relógio do aluno ✓') : err ? `Não consegui enviar ao ${S.cache.relNome || 'Garmin'}` : `${tr.length - env} treino${tr.length - env > 1 ? 's' : ''} ainda não enviado${tr.length - env > 1 ? 's' : ''} ao ${S.cache.relNome || 'Garmin'}`}</span><button type="button" class="link-btn small" data-garmin="${de}|${ate}">${env ? 'Reenviar' : `Enviar ao ${S.cache.relNome || 'Garmin'}`}</button></div>`
                          : '';
                      })()
                    : ''
                }`
              : `<div class="lib-bar"><span>${nLib ? `${doPlano.length - nLib} treino${doPlano.length - nLib > 1 ? 's' : ''} ainda não liberado${doPlano.length - nLib > 1 ? 's' : ''}` : 'Rascunho: o aluno ainda não vê esta semana'}</span><button type="button" class="btn sm lib-btn" data-liberar="${de}|${ate}">Liberar semana</button></div>`;
          })()
        : ''
    }<div class="cal-dias">`;
    dias.forEach((d) => {
      const k = isoDia(d);
      const itens = plano.filter((p) => p.data === k);
      const av = corridas.filter((c) => !c.plano_id && isoDia(c.data) === k);
      const ou = outras.filter((c) => isoDia(c.data) === k);
      const pr = provas.filter((p) => p.data === k);
      const fTag = forcaDiaHTML(fc, k, isoDia(dias[0]), staff);
      h += `<div class="cal-dia ${k === hoje ? 'hoje' : ''} ${k < hoje ? 'passado' : ''}" data-dia="${k}"><div class="cal-dia-h"><b>${DIAS[d.getDay()]}</b><span>${d.getDate()}</span>${cicloSeloHTML(ciclo, k)}${staff ? `<span class="disp-cal">${dispIcones(m, (d.getDay() + 6) % 7)}</span>` : ''}${staff ? `<button class="cal-add" data-novo="${k}" aria-label="Novo treino">${I.plus}</button>` : ''}</div><div class="cal-dia-c">
        ${fTag}
        ${pr.map((p) => `<a class="ses prova" href="${staff ? '#/eventos/equipe' : '#/eventos/minhas'}"><div class="ses-t"><b>${icT(I.flag)}${esc(p.titulo)}</b></div><span class="ses-m">${esc(p.distancia || 'Prova')}${p.meta ? ' · meta ' + esc(p.meta) : ''}</span></a>`).join('')}
        ${itens
          .map((p) =>
            cartaoSessao(
              p,
              perfil,
              corridas.find((c) => c.plano_id === p.id),
              staff,
            ),
          )
          .join('')}
        ${av.map((c) => `<a class="ses feito avulsa" href="#/corrida/${c.id}"><div class="ses-conc"><i>${I.check}</i>Treino extra</div><div class="ses-t"><b>${c.tipo === 'caminhada' ? 'Caminhada' : 'Corrida avulsa'}</b></div><div class="ses-res"><div><small>Distância</small><b>${fmtKm(c.distancia_m, 1)}</b></div><div><small>Pace</small><b>${fmtPace(paceDe(c)).replace('/km', '')}<em>/km</em></b></div></div></a>`).join('')}
        ${ou.map((c) => `<a class="ses feito ${c.tipo === 'forca' ? 'ativ-fo' : 'ativ-ou'}" href="#/corrida/${c.id}"><div class="ses-conc ${c.tipo === 'forca' ? 'fo' : ''}"><i>${I.check}</i>Do relógio</div><div class="ses-t"><b>${esc(nomeAtiv(c))}</b></div><div class="ses-res"><div><small>${comDist(c) ? 'Distância' : 'Duração'}</small><b>${comDist(c) ? fmtKm(c.distancia_m, 1) : fmtDur(c.duracao_s)}</b></div>${c.fc_media ? `<div><small>FC média</small><b>${c.fc_media}<em>bpm</em></b></div>` : ''}</div></a>`).join('')}
        ${!itens.length && !av.length && !pr.length && !ou.length && !fTag ? `<span class="cal-vazio">${staff ? 'solte um treino aqui' : 'descanso'}</span>` : ''}</div></div>`;
    });
    h += '</div></div>';
  }
  return h;
}

/* ---------- painel de corrida (aluno e treinador) ---------- */
async function viewCorridaPainel(alunoId, box, staff, m, subs, silencioso) {
  // silencioso: atualiza sem piscar a tela nem perder a rolagem (depois de arrastar, salvar etc.)
  const sv =
    silencioso && box.isConnected
      ? { y: scrollY, h: box.offsetHeight, bl: (box.querySelector('.biblio-l') || {}).scrollLeft || 0 }
      : null;
  if (sv) box.style.minHeight = sv.h + 'px';
  else box.innerHTML = esqBloco('cal');
  if (!m || m.user_id !== alunoId) {
    const { data } = await sb
      .from('nx_membros')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle();
    m = data || {};
  }
  const st = S.cache.semCorr || (S.cache.semCorr = { off: 0, sub: 'planilha' });
  if (st.aluno !== alunoId) {
    st.aluno = alunoId;
    st.off = 0;
    st.sub = 'planilha';
    st.todas = false;
  }
  const SUBS = subs || ['planilha', 'evolucao', 'corridas', 'ritmos'];
  if (!SUBS.includes(st.sub)) st.sub = SUBS[0];
  const semanas = innerWidth >= 900 ? 2 : 1;
  const ini = inicioSemana();
  ini.setDate(ini.getDate() + st.off * 7);
  const fim = new Date(ini);
  fim.setDate(ini.getDate() + semanas * 7 - 1);
  const comForca = faz('musculacao', m);
  const comCiclo = (staff ? m.sexo : S.me.sexo) === 'F';
  const [ativsTodas, plano, integs, modelosOrg, provas, provasProx, forcaTr, forcaSe, forcaLib, ciclo] =
    await Promise.all([
      buscarCorridas(alunoId),
      buscarPlano(alunoId, isoDia(ini), isoDia(fim)),
      sb
        .from('nx_integracoes')
        .select('provedor,athlete_id,ultima_sync,erro,conectado_em,escopo')
        .eq('user_id', alunoId)
        .in('provedor', ['intervals', 'garmin'])
        .then((r) => r.data || [])
        .catch(() => []),
      staff
        ? sb
            .from('nx_modelos_corrida')
            .select('*')
            .eq('org_id', S.org.id)
            .order('criado_em')
            .then((r) => r.data || [])
            .catch(() => [])
        : Promise.resolve([]),
      sb
        .from('nx_participacoes')
        .select('*')
        .eq('aluno_id', alunoId)
        .gte('data', isoDia(ini))
        .lte('data', isoDia(fim))
        .then((r) => r.data || [])
        .catch(() => []),
      sb
        .from('nx_participacoes')
        .select('*')
        .eq('aluno_id', alunoId)
        .gte('data', hojeISO())
        .order('data')
        .limit(3)
        .then((r) => r.data || [])
        .catch(() => []),
      // força da Nexos no mesmo dia (etiqueta na semana de corrida)
      comForca
        ? sb
            .from('nx_treinos')
            .select('id,titulo,dias')
            .eq('aluno_id', alunoId)
            .eq('ativo', true)
            .then(
              (r) => r.data || [],
              () => [],
            )
        : Promise.resolve([]),
      comForca
        ? sb
            .from('nx_sessoes')
            .select('id,treino_id,treino_titulo,iniciado_em')
            .eq('aluno_id', alunoId)
            .not('finalizado_em', 'is', null)
            .gte('iniciado_em', isoDia(ini))
            .lte('iniciado_em', isoDia(fim) + 'T23:59:59')
            .then(
              (r) => r.data || [],
              () => [],
            )
        : Promise.resolve([]),
      comForca
        ? sb
            .from('nx_forca_semanas')
            .select('semana')
            .eq('aluno_id', alunoId)
            .gte('semana', isoDia(ini))
            .lte('semana', isoDia(fim))
            .then(
              (r) => (r.data || []).map((x) => x.semana),
              () => [],
            )
        : Promise.resolve([]),
      comCiclo ? buscarCiclo(alunoId).catch(() => null) : Promise.resolve(null), // fase do ciclo em cada dia da planilha
    ]);
  const forcaCal = comForca ? { tr: forcaTr, se: forcaSe, lib: forcaLib, off: dispDe(m).off_forca || [] } : null;
  const corridas = ativsTodas.filter(ehCorr); // força, pedal etc. do relógio aparecem na planilha e na lista, mas não entram nos km
  const integ = integs.find((x) => x.provedor === 'intervals') || null,
    garm = integs.find((x) => x.provedor === 'garmin') || null;
  S.cache.garmOn = !!garm || icuEscreve(integ);
  S.cache.relNome = garm ? 'Garmin' : 'relógio';
  const perfil = perfilCorrida(m);
  const recarregar = () => viewCorridaPainel(alunoId, box, staff, m, subs, true);
  // testes da planilha que o aluno já correu: o treinador confere e confirma as zonas em Ritmos e zonas
  if (staff && st.testesDe !== alunoId) {
    st.testesDe = alunoId;
    st.testes = [];
    processarTestes(m)
      .then((r) => {
        st.testes = r || [];
        if (st.testes.length && S.cache.semCorr === st && st.aluno === alunoId) recarregar();
      })
      .catch((e) => console.error(e));
  }
  const sub = st.sub;
  const subTabs = `<div class="subtabs">${[
    ['planilha', 'Planilha'],
    ['evolucao', 'Evolução'],
    ['corridas', `Atividades${ativsTodas.length ? ' (' + ativsTodas.length + ')' : ''}`],
    ['ritmos', 'Ritmos e zonas'],
  ]
    .filter(([k]) => SUBS.includes(k))
    .map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-sub="${k}">${l}</button>`)
    .join('')}</div>`;
  const rotulo =
    st.off === 0
      ? semanas > 1
        ? 'Esta semana e a próxima'
        : 'Esta semana'
      : st.off === 1
        ? 'Próxima semana'
        : st.off === -1
          ? 'Semana passada'
          : `${ini.getDate()}/${ini.getMonth() + 1} a ${fim.getDate()}/${fim.getMonth() + 1}`;
  let corpo = '';
  if (sub === 'planilha') {
    const modelos = [...MODELOS_PADRAO, ...modelosOrg];
    corpo = `${staff ? '<div id="sug-ficha"></div>' : ''}${provasBannerHTML(provasProx, staff, !!(m.corrida && m.corrida.sem_polimento))}${staff ? cargaHTML3(cargaCorrida(corridas, perfil)).replace('class="card carga3"', 'class="card carga3 compacto"') : ''}
      <div class="pl-top"><div class="row" style="gap:6px"><button class="icon-btn sm" id="sem-a" aria-label="Semana anterior">${I.back}</button><button class="btn ghost sm" id="sem-h">${rotulo}</button><button class="icon-btn sm" id="sem-p" aria-label="Próxima semana" style="transform:scaleX(-1)">${I.back}</button></div>
        ${
          staff
            ? (() => {
                const clip = store.get('nx_clip_corr', null);
                return `<div class="pl-tools">
          <div class="tool-grp" role="group" aria-label="${semanas > 1 ? 'Semanas' : 'Semana'}"><button type="button" id="copiar-sem" ${plano.length ? '' : 'disabled'} title="Copiar os treinos ${semanas > 1 ? 'destas semanas' : 'desta semana'}">${I.copy}<span>Copiar</span></button><button type="button" id="colar-sem" class="${clip ? 'pronto' : ''}" ${clip ? '' : 'disabled'} title="${clip ? esc('Colar: ' + clip.itens.length + ' treinos de ' + clip.origem) : 'Copie uma semana primeiro'}">${I.paste}<span>Colar</span>${clip ? '<i class="tool-dot"></i>' : ''}</button></div>
          <button type="button" class="tool-ic" id="avisar" title="Avisar aluno da planilha" aria-label="Avisar aluno">${I.bell}</button><button type="button" class="tool-ic" id="guia-plan" title="Como usar a planilha" aria-label="Como usar a planilha">?</button></div>`;
              })()
            : `<button class="btn sm" id="reg-c">${I.plus} Registrar corrida</button>`
        }</div>
      <div class="${staff ? 'pl-grid' : ''}">
        ${
          staff
            ? `<aside class="biblio ${store.get('nx_bib_aberta', false) ? 'aberta' : ''}"><div class="biblio-h"><b>Biblioteca</b><span class="tiny dim">arraste para um dia</span><button type="button" class="bib-tog" id="bib-tog" aria-label="Mostrar ou esconder a biblioteca"><span class="bt-abrir">Abrir</span><span class="bt-fechar">Fechar</span>${I.chev}</button></div><p class="bib-dica">Toque em <b>+</b> no dia para escolher um treino, ou abra a biblioteca para arrastar.</p>${chipsNivHTML(store.get('nx_bib_niv', 'todos'), 'bib-niv')}<div class="biblio-l">${modelos
                .slice()
                .sort((x, y) => ordemCat(x) - ordemCat(y))
                .map((md) =>
                  md.tipo === 'folga'
                    ? `<div class="mod mod-off" data-mod="${md.id}"><div class="off-faixa">${OFF_IC}</div><b>Day off</b><span>Descanso</span></div>`
                    : md.tipo === 'forca'
                      ? `<div class="mod mod-forca" data-mod="${md.id}"><div class="off-faixa">${FORCA_IC}</div><b>Força</b><span>por conta do aluno</span></div>`
                      : `<div class="mod" data-mod="${md.id}" ${passaNiv(md, store.get('nx_bib_niv', 'todos')) ? '' : 'hidden'}>${perfilHTML(md.estrutura, perfil)}<b>${esc(md.nome)}</b><span>${f1(resumoEstrutura(md.estrutura, perfil).km)} km · ${md.org_id ? 'meu modelo' : esc((CATS_CORR.find((c) => c[0] === md.cat) || [])[1] || '')}</span></div>`,
                )
                .join('')}</div></aside>`
            : ''
        }
        <div class="cal">${
          cicloFaseDia(ciclo, hojeISO())
            ? `<div class="cic-leg">${Object.entries(FASES_CICLO)
                .map(
                  ([k, [n, cor]]) =>
                    `<span><i class="cic-selo ${k === 'menstrual' ? 'gota' : ''}" style="--cf:${cor}">${k === 'menstrual' ? '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z"/></svg>' : ''}</i>${n.replace('Fase ', '')}</span>`,
                )
                .join('')}<span class="dim">vazado = previsão</span></div>`
            : ''
        }${calendarioHTML(ini, semanas, plano, ativsTodas, perfil, staff, provas, m, forcaCal, ciclo)}</div>
      </div>
      ${staff ? '<div class="lixeira" id="lixeira">Solte aqui para excluir</div><p class="tiny dim" style="margin-top:12px">Dica: arraste os modelos da biblioteca para os dias. Arraste um treino de um dia para outro para mudar a data (segure Ctrl ou Alt no computador para copiar). Toque no treino para editar os passos.</p>' : ''}
      ${!staff && !plano.length ? '<p class="small muted" style="margin-top:12px">Quando o seu treinador montar a planilha de corrida, os treinos aparecem aqui.</p>' : ''}`;
  } else if (sub === 'evolucao') {
    const c3 = cargaHTML3(cargaCorrida(corridas, perfil));
    const sem = Array(12).fill(0);
    const base = inicioSemana();
    corridas.forEach((c) => {
      const w = Math.floor((base - inicioSemana(new Date(c.data))) / (7 * 864e5));
      if (w >= 0 && w < 12) sem[11 - w] += c.distancia_m / 1000;
    });
    const maxS = Math.max(10, ...sem);
    const c30 = corridas.filter((c) => diasDesde(c.data) < 30);
    const km30 = c30.reduce((a, c) => a + c.distancia_m, 0);
    const paceMed = c30.length ? c30.reduce((a, c) => a + c.duracao_s, 0) / (km30 / 1000) : null;
    const longa = corridas.reduce((a, c) => (!a || c.distancia_m > a.distancia_m ? c : a), null);
    const tend = corridas
      .filter((c) => c.distancia_m >= 3000 && c.tipo !== 'caminhada')
      .slice(0, 16)
      .reverse()
      .map((c) => ({ x: fmtCurto(c.data), y: +(paceDe(c) / 60).toFixed(2) }));
    corpo =
      c3 +
      `${staff ? `<div id="pv-evo" style="margin-top:${c3 ? 12 : 0}px"></div>` : ''}<div class="stats" style="margin-top:${c3 || staff ? 12 : 0}px"><div class="stat"><b>${f1(km30 / 1000)}</b><span>km em 30 dias</span></div><div class="stat"><b>${c30.length}</b><span>corridas em 30 dias</span></div><div class="stat"><b>${paceMed ? fmtPace(paceMed).replace('/km', '') : '–'}</b><span>pace médio (30 dias)</span></div></div>
      <div class="grid2 g-charts">
        <div class="card" style="padding:14px"><div class="row between"><span class="small muted" style="font-weight:700">Km por semana</span><span class="tiny dim">12 semanas</span></div><div style="display:flex;gap:5px;margin-top:12px;align-items:flex-end;height:110px">${sem.map((v, i) => `<div title="${f1(v)} km" style="flex:1;height:${(v / maxS) * 100}%;min-height:${v ? 6 : 2}px;border-radius:5px;background:${i === 11 ? 'linear-gradient(180deg,var(--acc),var(--acc2))' : 'var(--s3)'}"></div>`).join('')}</div><div class="row between tiny dim" style="margin-top:6px"><span>12 semanas atrás</span><span>esta semana: ${f1(sem[11])} km</span></div></div>
        ${tend.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">Pace médio por corrida · menor é melhor</span>${grafico(tend, { fmt: (v) => fmtPace(v * 60).replace('/km', '') })}</div>` : ''}
      </div>
      ${longa ? `<p class="small muted" style="margin-top:12px">Corrida mais longa: <b style="color:var(--ink)">${fmtKm(longa.distancia_m, 1)}</b> em ${fmtDia(longa.data)}</p>` : ''}
      ${!corridas.length ? '<div class="empty" style="margin-top:12px"><div class="h3">Sem corridas ainda</div><p class="small">A evolução aparece conforme as corridas forem registradas.</p></div>' : ''}`;
  } else if (sub === 'corridas') {
    if (staff)
      relogiosDosAlunos([alunoId]).then(
        (R) => {
          const r = R[alunoId],
            el = document.getElementById('rel-staff');
          if (el && r && r.modelo) el.insertAdjacentHTML('beforeend', ` Modelo: <b>${esc(r.modelo)}</b>.`);
        },
        () => {},
      );
    corpo = `${staff ? '<div id="atv-feed"></div>' : `<button class="btn sm" id="reg-c">${I.plus} Registrar corrida</button>`}
      ${
        staff
          ? ''
          : ativsTodas.length
            ? `<div class="stack" style="margin-top:12px">${ativsTodas
                .slice(0, st.todas ? 300 : 12)
                .map(
                  (c) =>
                    `<a class="card tap corr-item" href="#/corrida/${c.id}"><div class="hist-date"><b>${new Date(c.data).getDate()}</b><span>${MESES[new Date(c.data).getMonth()]}</span></div><div class="grow"><div class="row" style="gap:8px">${staff && !c.visto_treinador ? '<i class="alert-dot"></i>' : ''}${ehCorr(c) ? `<b>${fmtKm(c.distancia_m, 1)}</b><span class="muted">· ${fmtDur(c.duracao_s)} · ${fmtPace(paceDe(c))}</span>` : `<b>${esc(nomeAtiv(c))}</b><span class="muted">· ${resumoAtiv(c)}</span>`}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${c.rpe != null ? `<span class="rpe" style="background:${rpeCor(c.rpe)}">Esforço ${c.rpe}</span>` : ''}${c.fc_media ? `<span class="tag">${c.fc_media} bpm</span>` : ''}${c.dor ? '<span class="tag warn">dor</span>' : ''}${c.plano_id ? '<span class="tag ok">da planilha</span>' : ''}<span class="tag">${c.fonte === 'arquivo' ? 'relógio' : c.fonte === 'intervals' ? 'Intervals' : c.fonte === 'garmin' ? 'Garmin' : 'digitada'}</span></div></div>${I.chev}</a>`,
                )
                .join(
                  '',
                )}</div>${ativsTodas.length > 12 && !st.todas ? `<button class="btn ghost block sm" id="ver-todas" style="margin-top:12px">Ver todas as ${corridas.length} corridas</button>` : ''}`
            : `<div class="empty" style="margin-top:12px"><div class="h3">Nenhuma corrida registrada</div><p class="small">${staff ? 'As corridas do aluno aparecem aqui.' : 'Depois de correr, toque em “Registrar corrida”. Dá para enviar o arquivo do relógio.'}</p></div>`
      }
      ${staff ? `<p class="small muted" style="margin-top:16px" id="rel-staff">${I.watch.replace('<svg', '<svg class="rel-ic"')} ${garm ? 'Garmin conectado: as corridas chegam sozinhas e os treinos liberados vão para o relógio.' : integ ? 'Relógio conectado pelo Intervals.icu.' : 'O aluno ainda não conectou um relógio (ele faz isso na aba Conexões).'}</p>` : `<a class="list-item" href="#/conexoes" style="margin-top:16px">${I.watch}<div class="grow"><b>${garm || integ ? 'Relógio conectado ✓' : 'Conectar o seu relógio'}</b><div class="small muted">${garm || integ ? 'Gerencie na aba Conexões' : 'Garmin, Coros, Polar e outros: as corridas chegam sozinhas'}</div></div>${I.chev}</a>`}`;
  } else {
    const ZT = [['rec', 'Z1 · Recuperação (trote)'], ...ZONAS_PACE];
    const faixaDe = (k) =>
      (perfil.paces && perfil.paces[k]) ||
      (k === 'rec' && perfil.paces && perfil.paces.leve
        ? [Math.round(perfil.paces.leve[1] * 1.08), Math.round(perfil.paces.leve[1] * 1.16)]
        : [ZONAS_INFO[k].pd - 10, ZONAS_INFO[k].pd + 10]);
    const mmss = (sg) => {
      const v = Math.round(sg);
      return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
    };
    const tileZ = ([k, l]) =>
      staff
        ? `<div class="pz-ed" style="border-left:4px solid ${ZONAS_INFO[k].c}"><span>${l}</span><div class="pz-in"><input class="input mono" data-pz="${k}" data-i="0" data-mask="pace" value="${mmss(faixaDe(k)[0])}" inputmode="numeric" aria-label="${l} de"><i>–</i><input class="input mono" data-pz="${k}" data-i="1" data-mask="pace" value="${mmss(faixaDe(k)[1])}" inputmode="numeric" aria-label="${l} até"><em>/km</em></div></div>`
        : `<div style="border-left:4px solid ${ZONAS_INFO[k].c}"><span>${l}</span><b>${paceZonaTxt(k, perfil)}</b></div>`;
    const pseCard = `<div class="card pse-card"><span class="eyebrow">Fase de adaptação · percepção de esforço</span>
      <p class="small" style="margin-top:6px">${staff ? 'Nesta fase o aluno não segue ritmo nem frequência cardíaca: cada zona aparece para ele como esforço de 0 a 10 e pelo teste da fala.' : 'Nesta fase você não precisa olhar o ritmo nem o relógio. Cada treino diz o esforço: siga a sensação do seu corpo e o quanto consegue falar.'}</p>
      <div class="pse-lista">${['rec', 'leve', 'maratona', 'limiar', 'intervalado', 'tiros'].map((k) => `<div style="--zc:${ZONAS_INFO[k].c}"><b>${ZONAS_INFO[k].z}</b><span>${pseTxt(k, true)}</span><em>${PSE_Z[k][2]}</em></div>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">0 = parado · 10 = esforço máximo. O teste da fala e a escala de esforço acompanham bem a intensidade e são o método indicado para quem está começando (Foster et al. 2008; Reed & Pipe 2014). ${staff ? 'Quando você cadastrar o teste, os ritmos passam a aparecer e o modo desliga sozinho.' : 'Depois da adaptação, seu treinador faz um teste e os ritmos passam a aparecer aqui.'}</p></div>`;
    const pseBtn =
      staff && !perfil.vdot && !perfil.auto && !perfil.manual
        ? `<div class="card" style="margin-bottom:12px"><div class="row between" style="gap:10px"><div class="grow" style="min-width:0"><b>Modo adaptação por esforço</b><p class="small muted" style="margin-top:2px">${perfil.pse ? 'Ligado: o aluno vê esforço de 0 a 10, sem pace e sem FC.' : 'Para iniciantes sem teste: troca pace e FC estimados por esforço de 0 a 10.'}</p></div><button class="btn sm ${perfil.pse ? 'ghost' : ''}" id="pse-tg">${perfil.pse ? 'Desligar' : 'Ligar'}</button></div></div>`
        : '';
    corpo = `${pseBtn}${perfil.pse ? pseCard : ''}${
      perfil.paces || staff
        ? `<div class="card"><div class="row between" style="gap:8px;flex-wrap:wrap"><span class="small muted">${perfil.auto && !perfil.manual ? `Base: ${esc(TESTE_NOME[perfil.auto.tipo] || 'teste de campo')}${perfil.auto.data ? ' · ' + fmtDia(perfil.auto.data) : ''} · ${esc(perfil.auto.resumo || '')}` : perfil.vdot ? `Base: ${String(perfil.teste_km).replace('.', ',')} km em ${fmtDurLongo(perfil.teste_seg)}${perfil.teste_data ? ' · ' + fmtDia(perfil.teste_data) : ''}` : 'Sem teste cadastrado'}</span><span class="row" style="gap:6px">${perfil.manual ? '<span class="tag warn">ajustado pelo treinador</span>' : perfil.auto ? '<span class="tag ok">atualizado pelo teste</span>' : perfil.vdot ? '<span class="tag">automático</span>' : ''}${perfil.vdot ? `<span class="tag acc">VDOT ${f1(perfil.vdot)}</span>` : ''}</span></div>
        ${staff ? '<p class="tiny dim" style="margin-top:8px">Edite o pace de cada zona (minutos:segundos por km) e toque em “Salvar zonas”. É o que o aluno vê nos treinos.</p>' : ''}
        <div class="paces">${ZT.map(tileZ).join('')}</div>
        ${staff ? `<div class="${perfil.manual ? 'grid2' : ''}" style="margin-top:12px"><button class="btn block" id="pz-salvar">${I.check} Salvar zonas</button>${perfil.manual ? '<button class="btn ghost" id="pz-auto">Voltar ao automático</button>' : ''}</div>` : ''}
        ${
          perfil.vdot
            ? `<span class="small muted" style="display:block;margin-top:14px;font-weight:700">Previsão de provas</span>
        <div class="prev-prova">${[
          [5000, '5 km'],
          [10000, '10 km'],
          [21097, '21 km'],
          [42195, '42 km'],
        ]
          .map(
            ([d, l]) =>
              `<div><span>${l}</span><b>${fmtDurLongo(prever(perfil.teste_km * 1000, perfil.teste_seg, d))}</b></div>`,
          )
          .join('')}</div>
        <p class="tiny dim" style="margin-top:8px">${perfil.auto && !perfil.manual ? { t30: 'Zonas em % do pace e da FC de limiar (Friel, 2009)', vam: 'Zonas em % da VAM (Léger e Boucher, 1980; Billat, 2001)', vc: 'Zonas em % da velocidade crítica (Jones e Vanhatalo, 2017)' }[perfil.auto.tipo] || 'Zonas pelo teste de campo' : 'Paces automáticos pelo VDOT de Jack Daniels'}; previsões pela fórmula de Riegel. São estimativas para provas no plano e com treino específico.</p>`
            : ''
        }</div>`
        : perfil.pse
          ? ''
          : `<div class="empty"><div class="h3">Ritmos ainda não calculados</div><p class="small">Seu treinador vai cadastrar um teste para calcular os seus paces.</p></div>`
    }
      ${
        staff
          ? `<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn ${perfil.paces ? 'ghost' : ''} sm" id="ed-perfil">${perfil.paces ? 'Atualizar teste de prova' : 'Cadastrar teste'}</button><button class="btn ghost sm" id="ed-campo">Lançar teste de campo</button>${(m.corrida || {}).zonas_hist && (m.corrida || {}).zonas_hist.length ? '<button class="btn ghost sm" id="zn-volta">Voltar às zonas anteriores</button>' : ''}</div>
        <p class="tiny dim" style="margin-top:8px">Quando o aluno corre um teste da biblioteca (30 min de Friel, VAM, velocidade crítica, Cooper, 2.400 m, 10 km ou FC máxima), o resultado é calculado sozinho pelos dados do relógio e aparece aqui para você confirmar as zonas.</p>`
          : ''
      }
      ${
        perfil.fcMax || perfil.lthr
          ? `<div class="card" style="margin-top:12px"><span class="small muted">Zonas de FC · ${perfil.lthr ? `pela FC de limiar ${perfil.lthr} bpm (teste de 30 min, Friel)` : `FC máx ${Math.round(perfil.fcMax)} bpm${perfil.fc_max ? ' (medida)' : ' (estimada)'}${perfil.fcRep ? ` · repouso ${perfil.fcRep}` : ''}`}</span><div class="zonas" style="margin-top:12px">${zonasFCPerfil(
              perfil,
            )
              .map(
                (z, i) => `<div class="zona z${i + 1}"><b>${z.z}</b><span>${z.n}</span><em>${z.de}–${z.ate}</em></div>`,
              )
              .join('')}</div></div>`
          : ''
      }`;
  }
  const tPend = staff && st.testesDe === alunoId ? st.testes || [] : [];
  const avisoTeste = tPend.length
    ? sub === 'ritmos' && SUBS.includes('ritmos')
      ? testesPendentesHTML(m, tPend)
      : SUBS.includes('ritmos')
        ? `<div class="card tst-aviso"><span class="tst-ic">${I.timer}</span><div class="tst-txt"><b>${tPend.length > 1 ? `${tPend.length} testes feitos` : esc(tPend[0].p.titulo || 'Teste') + ' feito'}</b><span>Resultado pronto. Confira e confirme as zonas.</span></div><button class="btn sm tst-ir" type="button">Revisar</button></div>`
        : ''
    : '';
  box.innerHTML = (SUBS.length > 1 ? subTabs : '') + `<div class="sub-corpo">${avisoTeste}${corpo}</div>`;
  box.querySelectorAll('.tst-ir').forEach(
    (b) =>
      (b.onclick = () => {
        st.sub = 'ritmos';
        recarregar();
      }),
  );
  box.querySelectorAll('[data-tst-ok],[data-tst-no],[data-tst-mao]').forEach((b) => {
    b.onclick = async () => {
      const x = tPend[+(b.dataset.tstOk || b.dataset.tstNo || b.dataset.tstMao)];
      if (!x) return;
      if (b.dataset.tstMao != null) return formTesteCampo(m, recarregar);
      b.disabled = true;
      try {
        if (b.dataset.tstOk != null) await confirmarTeste(m, x);
        else await descartarTeste(m, x);
      } catch (e) {
        console.error(e);
        b.disabled = false;
        return toast('Não foi possível salvar. Tente de novo.', true);
      }
      st.testes = tPend.filter((y) => y !== x);
      toast(
        b.dataset.tstOk != null
          ? 'Zonas confirmadas. O aluno já vê os novos ritmos.'
          : 'Teste descartado. As zonas continuam como estavam.',
      );
      recarregar();
    };
  });
  // sugestão de ciclo pela ficha de entrada (as zonas continuam vindo do teste), enquanto nenhum ciclo de corrida foi aplicado
  if (staff && sub === 'planilha')
    Promise.all([
      sb
        .from('nx_form_respostas')
        .select('dados')
        .eq('aluno_id', alunoId)
        .order('criado_em', { ascending: false })
        .limit(1)
        .then(
          (r) => (r.data || [])[0],
          () => null,
        ),
      sb
        .from('nx_ciclos_aplicados')
        .select('id')
        .eq('aluno_id', alunoId)
        .eq('tipo', 'corrida')
        .limit(1)
        .then(
          (r) => r.data || [],
          () => [1],
        ),
    ]).then(([fr, ja]) => {
      const el = document.getElementById('sug-ficha');
      const ds = fr && fr.dados && fr.dados.desemp;
      if (!el || !ds || ja.length) return;
      el.innerHTML = sugCicloHTML(analisarDesemp(ds), alunoId);
    });
  if (sv) {
    const bl = box.querySelector('.biblio-l');
    if (bl) bl.scrollLeft = sv.bl;
    scrollTo(scrollX, sv.y);
    requestAnimationFrame(() => {
      box.style.minHeight = '';
    });
  }
  if (SUBS.length > 1)
    box.querySelector('.subtabs').onclick = (e) => {
      const b = e.target.closest('[data-sub]');
      if (b) {
        st.sub = b.dataset.sub;
        recarregar();
      }
    };
  const q = (s) => box.querySelector(s);
  if (q('#pv-evo')) previsoesCard(q('#pv-evo'), corridas, perfil);
  if (q('#reg-c'))
    q('#reg-c').onclick = () =>
      registrarCorrida(alunoId, (id) => {
        location.hash = '#/corrida/' + id;
      });
  if (q('#ver-todas'))
    q('#ver-todas').onclick = () => {
      st.todas = true;
      recarregar();
    };
  if (q('#pse-tg'))
    q('#pse-tg').onclick = async () => {
      const corrida = { ...(m.corrida || {}), modo_pse: !perfil.pse };
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.corrida = corrida;
      toast(corrida.modo_pse ? 'Modo adaptação ligado: o aluno vê esforço, sem pace.' : 'Modo adaptação desligado.');
      recarregar();
    };
  if (q('#pz-salvar'))
    q('#pz-salvar').onclick = async () => {
      const lerS = (v) => {
        const m2 =
          String(v || '')
            .trim()
            .match(/^(\d{1,2})[:.,](\d{1,2})$/) ||
          String(v || '')
            .trim()
            .match(/^(\d{1,2})$/);
        if (!m2) return null;
        const sg = +m2[1] * 60 + +(m2[2] || 0);
        return m2[2] && +m2[2] > 59 ? null : sg;
      };
      const man = {};
      let erro = '';
      [['rec'], ...ZONAS_PACE].forEach(([k]) => {
        const a2 = lerS(box.querySelector(`[data-pz="${k}"][data-i="0"]`).value),
          b2 = lerS(box.querySelector(`[data-pz="${k}"][data-i="1"]`).value);
        if (a2 == null || b2 == null || a2 < 150 || b2 > 1200) erro = ZONAS_INFO[k].z;
        else man[k] = [Math.min(a2, b2), Math.max(a2, b2)];
      });
      if (erro) return toast(`Confira o pace da ${erro} (use minutos:segundos, ex.: 5:30).`, true);
      const corrida = { ...(m.corrida || {}), paces_manual: man };
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.corrida = corrida;
      toast('Zonas salvas! O aluno já vê esses paces.');
      recarregar();
    };
  if (q('#pz-auto'))
    q('#pz-auto').onclick = async () => {
      const corrida = { ...(m.corrida || {}) };
      delete corrida.paces_manual;
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível salvar.', true);
      m.corrida = corrida;
      toast('Zonas voltaram ao cálculo automático.');
      recarregar();
    };
  const recarregarM = async () => {
    const { data } = await sb
      .from('nx_membros')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('user_id', alunoId)
      .maybeSingle();
    m = data || m;
    recarregar();
  };
  if (q('#ed-campo')) q('#ed-campo').onclick = () => formTesteCampo(m, recarregarM);
  if (q('#zn-volta'))
    q('#zn-volta').onclick = async () => {
      const h = ((m.corrida || {}).zonas_hist || [])[0];
      if (!h || !h.antes) return;
      const corrida = {
        ...h.antes,
        zonas_hist: ((m.corrida || {}).zonas_hist || []).slice(1),
        testes_proc: (m.corrida || {}).testes_proc || [],
      };
      const { error } = await sb.from('nx_membros').update({ corrida }).eq('org_id', S.org.id).eq('user_id', alunoId);
      if (error) return toast('Não foi possível voltar.', true);
      toast('Zonas anteriores restauradas.');
      recarregarM();
    };
  if (q('#ed-perfil'))
    q('#ed-perfil').onclick = () =>
      formPerfilCorrida(m, async () => {
        const { data } = await sb
          .from('nx_membros')
          .select('*')
          .eq('org_id', S.org.id)
          .eq('user_id', alunoId)
          .maybeSingle();
        m = data || m;
        recarregar();
      });
  if (q('#intervals-box')) bindIntervals(q('#intervals-box'), integ, staff, alunoId, recarregar);
  if (staff && sub === 'corridas' && q('#atv-feed')) feedAtividades(alunoId, q('#atv-feed'), true);
  if (q('#garmin-box')) bindGarmin(q('#garmin-box'), recarregar);
  // sincronização automática com o Garmin: todo treino liberado que ainda não está no relógio vai sozinho
  if (garm || icuEscreve(integ))
    sincronizarGarmin(alunoId, plano, perfil, staff).then((n) => {
      if (n) recarregar();
    });
  if (sub === 'planilha') {
    box.querySelectorAll('[data-pol]').forEach(
      (b) =>
        (b.onclick = () =>
          polimentoSheet(
            alunoId,
            provasProx.find((x) => x.id === b.dataset.pol),
            perfil,
            recarregar,
          )),
    );
    box.querySelectorAll('[data-semp]').forEach(
      (b) =>
        (b.onclick = async () => {
          const corrida = { ...(m.corrida || {}), sem_polimento: b.dataset.semp === '1' };
          const { error } = await sb
            .from('nx_membros')
            .update({ corrida })
            .eq('org_id', S.org.id)
            .eq('user_id', alunoId);
          if (error) return toast('Não foi possível salvar.', true);
          m.corrida = corrida;
          toast(
            corrida.sem_polimento
              ? 'Pronto: o app não sugere polimento para este aluno.'
              : 'Sugestão de polimento ligada.',
          );
          recarregar();
        }),
    );
    q('#sem-a').onclick = () => {
      st.off -= semanas;
      recarregar();
    };
    q('#sem-p').onclick = () => {
      st.off += semanas;
      recarregar();
    };
    q('#sem-h').onclick = () => {
      st.off = 0;
      recarregar();
    };
    const modelos = [...MODELOS_PADRAO, ...modelosOrg];
    const bt = q('#bib-tog');
    if (bt)
      bt.onclick = () => {
        const ab = bt.closest('.biblio').classList.toggle('aberta');
        store.set('nx_bib_aberta', ab);
      };
    const bn = q('#bib-niv');
    if (bn)
      bn.onclick = (e) => {
        const b = e.target.closest('[data-niv]');
        if (!b) return;
        store.set('nx_bib_niv', b.dataset.niv);
        bn.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
        box.querySelectorAll('.biblio-l .mod').forEach((el) => {
          const md = modelos.find((x) => x.id === el.dataset.mod);
          el.hidden = !!md && md.tipo !== 'folga' && !passaNiv(md, b.dataset.niv);
        });
      };
    const cal = q('.cal');
    cal.addEventListener('click', async (e) => {
      const lb = e.target.closest('[data-liberar],[data-desliberar]');
      if (lb) {
        const lib = !!lb.dataset.liberar;
        const [de, ate] = (lb.dataset.liberar || lb.dataset.desliberar).split('|');
        lb.disabled = true;
        if (!lib && !confirm('Cancelar a liberação? O aluno deixa de ver os treinos desta semana.')) {
          lb.disabled = false;
          return;
        }
        const { error } = await sb
          .from('nx_plano_corrida')
          .update({ liberado: lib })
          .eq('org_id', S.org.id)
          .eq('aluno_id', alunoId)
          .gte('data', de)
          .lte('data', ate);
        if (error) {
          lb.disabled = false;
          return toast('Não foi possível salvar.', true);
        }
        const daSemana = plano.filter((p) => p.data >= de && p.data <= ate).map((p) => ({ ...p, liberado: lib }));
        if (lib) {
          notificarAluno('planilha', alunoId);
          toast('Semana liberada! O aluno foi avisado.');
          if (S.cache.garmOn) {
            const k = 'garSync:' + alunoId;
            S.cache.garSync = S.cache.garSync || {};
            S.cache.garSync[k] = (S.cache.garSync[k] || []).filter((id) => !daSemana.some((p) => p.id === id));
            sincronizarGarmin(alunoId, daSemana, perfil, true).then((n) => {
              if (n) recarregar();
            });
          }
        } else {
          toast('Liberação cancelada. A semana voltou a ser rascunho.');
          const noG = daSemana.filter((p) => p.garmin_workout_id);
          if (noG.length)
            chamarGarmin({
              acao: 'remover_treinos',
              aluno_id: alunoId,
              itens: noG.map((p) => ({ plano_id: p.id })),
            }).catch(() => {});
        }
        return recarregar();
      }
      const gb = e.target.closest('[data-garmin]');
      if (gb) {
        const [de, ate] = gb.dataset.garmin.split('|');
        gb.disabled = true;
        gb.textContent = 'Enviando…';
        try {
          const r = await enviarGarmin(
            alunoId,
            plano.filter((p) => p.data >= de && p.data <= ate),
            perfil,
          );
          toast(
            r.precisa_reconectar
              ? 'O aluno precisa reconectar o relógio no app (aba Conexões) para receber os treinos.'
              : r.sem_garmin
                ? 'O aluno não está com relógio conectado.'
                : r.enviados
                  ? `${r.enviados} treino${r.enviados > 1 ? 's' : ''} no ${nomeRelogio(r)} do aluno ⌚`
                  : r.erros
                    ? `Não consegui enviar ao ${nomeRelogio(r)}. Tente de novo em instantes.`
                    : 'Nada para enviar nesta semana.',
            !r.enviados,
          );
        } catch (er) {
          toast(er.message, true);
        }
        return recarregar();
      }
      const nv = e.target.closest('[data-novo]'),
        se = e.target.closest('[data-ses]');
      if (nv) return escolherModelo(nv.dataset.novo);
      if (se) {
        const p = plano.find((x) => x.id === se.dataset.ses);
        if (!p) return;
        if (p.tipo === 'forca')
          return staff
            ? openSheet(
                `<p class="eyebrow">${fmtDia(p.data)}</p><div class="h2" style="margin-top:4px">Dia de força</div><p class="small muted" style="margin-top:6px">O aluno faz força por conta própria e não tem corrida nesse dia. Ele vê “Hoje é dia de força” na tela inicial.</p><label class="field" style="margin-top:14px"><span>Recado para o aluno (opcional)</span><input class="input" id="fo-obs" maxlength="120" placeholder="Ex.: academia às 18h, foco em pernas" value="${esc(p.descricao || '')}"></label><button class="btn block" id="fo-ok" style="margin-top:12px">Salvar</button><button class="btn ghost danger block" id="fo-del" style="margin-top:8px">Tirar o dia de força</button>`,
                (r) => {
                  r.querySelector('#fo-ok').onclick = async () => {
                    const { error } = await sb
                      .from('nx_plano_corrida')
                      .update({ descricao: r.querySelector('#fo-obs').value.trim() || null })
                      .eq('id', p.id);
                    closeSheet();
                    error ? toast('Não foi possível salvar.', true) : (toast('Dia de força salvo.'), recarregar());
                  };
                  r.querySelector('#fo-del').onclick = async () => {
                    await sb.from('nx_plano_corrida').delete().eq('id', p.id);
                    closeSheet();
                    toast('Dia de força removido.');
                    recarregar();
                  };
                },
              )
            : toast(
                p.descricao
                  ? `Dia de força: ${p.descricao}`
                  : 'Dia de força: treino de força por sua conta, sem corrida.',
              );
        if (p.tipo === 'folga')
          return staff
            ? openSheet(
                `<p class="eyebrow">${fmtDia(p.data)}</p><div class="h2" style="margin-top:4px">Day off</div><p class="small muted" style="margin-top:6px">Dia de descanso de corrida. O aluno vê “Hoje é day off” na tela inicial.</p><button class="btn danger block" id="off-del" style="margin-top:16px">Tirar o day off</button>`,
                (r) => {
                  r.querySelector('#off-del').onclick = async () => {
                    await sb.from('nx_plano_corrida').delete().eq('id', p.id);
                    closeSheet();
                    toast('Day off removido.');
                    recarregar();
                  };
                },
              )
            : toast('Day off: dia de descanso.');
        staff
          ? editorTreino({
              alunoId,
              perfil,
              sessao: p,
              aoSalvar: recarregar,
              modelos: modelosOrg,
              feito: corridas.find((c) => c.plano_id === p.id),
            })
          : verTreinoPlanilha(
              p,
              perfil,
              corridas.find((c) => c.plano_id === p.id),
            );
      }
    });
    const escolherModelo = (data) =>
      openSheet(
        `<p class="eyebrow">${fmtDia(data)}</p><div class="h2" style="margin-top:4px">Escolha um ponto de partida</div><div style="margin-top:12px">${chipsNivHTML(store.get('nx_bib_niv', 'todos'), 'pick-niv')}</div><div class="sheet-mods" id="pick-l"></div>`,
        (r) => {
          const desenhaPick = () => {
            const sel = store.get('nx_bib_niv', 'todos');
            const lst = modelos.filter((md) => !semCorrida(md) && passaNiv(md, sel));
            const grupos = CATS_CORR.filter((c) => c[0] !== 'off')
              .map(([k, l]) => [l, lst.filter((md) => (md.cat || (md.org_id ? '' : 'base')) === k)])
              .filter(([, l2]) => l2.length);
            const meus = lst.filter((md) => md.org_id);
            const card = (md) =>
              `<button class="mod" data-pick="${md.id}">${perfilHTML(md.estrutura, perfil)}<b>${esc(md.nome)}</b><span>${f1(resumoEstrutura(md.estrutura, perfil).km)} km</span></button>`;
            r.querySelector('#pick-l').innerHTML =
              `<div class="pick-g"><div class="biblio-l"><button class="mod mod-off" data-pick="p-off"><div class="off-faixa">${OFF_IC}</div><b>Day off</b><span>Descanso</span></button><button class="mod mod-forca" data-pick="p-forca"><div class="off-faixa">${FORCA_IC}</div><b>Força</b><span>por conta do aluno</span></button><button class="mod" data-pick=""><div class="perfil-int vazio"></div><b>Em branco</b><span>montar do zero</span></button></div></div>` +
              (meus.length
                ? `<p class="mes-rot">Meus modelos</p><div class="biblio-l">${meus.map(card).join('')}</div>`
                : '') +
              grupos
                .map(([l, l2]) => `<p class="mes-rot">${l}</p><div class="biblio-l">${l2.map(card).join('')}</div>`)
                .join('');
          };
          desenhaPick();
          r.querySelector('#pick-niv').onclick = (e) => {
            const b = e.target.closest('[data-niv]');
            if (!b) return;
            store.set('nx_bib_niv', b.dataset.niv);
            r.querySelectorAll('#pick-niv .chip').forEach((x) => x.classList.toggle('on', x === b));
            desenhaPick();
          };
          r.querySelector('.sheet-mods').onclick = async (e) => {
            const b = e.target.closest('[data-pick]');
            if (!b) return;
            const md = modelos.find((x) => x.id === b.dataset.pick);
            if (md && semCorrida(md)) {
              const { error } = await sb.from('nx_plano_corrida').insert({
                org_id: S.org.id,
                aluno_id: alunoId,
                data,
                tipo: md.tipo,
                titulo: md.nome,
                estrutura: [],
                distancia_km: 0,
                duracao_min: 0,
                zona: null,
                criado_por: S.user.id,
              });
              closeSheet();
              return error
                ? toast('Não foi possível salvar.', true)
                : (toast(md.tipo === 'forca' ? 'Dia de força marcado.' : 'Day off marcado.'), recarregar());
            }
            editorTreino({
              alunoId,
              perfil,
              data,
              modelo: md || { nome: '', tipo: 'rodagem', estrutura: [] },
              aoSalvar: recarregar,
              modelos: modelosOrg,
            });
          };
        },
      );
    if (staff) {
      const area = q('.pl-grid');
      arrastar(area, {
        item: '.mod, .ses[data-ses]',
        alvo: '.cal-dia, .lixeira',
        soltar: async (el, alvoEl, ev) => {
          // mostra o resultado na hora, antes de salvar
          if (alvoEl.id === 'lixeira') {
            if (el.dataset.ses) el.remove();
          } else {
            const c = alvoEl.querySelector('.cal-dia-c');
            if (c) {
              c.querySelector('.cal-vazio')?.remove();
              const nv = el.dataset.mod
                ? Object.assign(document.createElement('div'), {
                    className: 'ses salvando',
                    innerHTML: `<div class="ses-t"><b>${esc(el.querySelector('b')?.textContent || 'Treino')}</b></div>${el.querySelector('.perfil-int')?.outerHTML || ''}<span class="ses-m">salvando…</span>`,
                  })
                : ev.copia
                  ? Object.assign(el.cloneNode(true), { className: el.className + ' salvando' })
                  : el;
              c.appendChild(nv);
            }
          }
          if (alvoEl.id === 'lixeira') {
            if (!el.dataset.ses) return;
            const pg = plano.find((x) => x.id === el.dataset.ses);
            if (pg && pg.garmin_workout_id)
              await chamarGarmin({ acao: 'remover_treinos', aluno_id: alunoId, itens: [{ plano_id: pg.id }] }).catch(
                () => {},
              );
            const { error } = await sb.from('nx_plano_corrida').delete().eq('id', el.dataset.ses);
            error ? toast('Não foi possível excluir.', true) : (toast('Treino excluído.'), recarregar());
            return;
          }
          const data = alvoEl.dataset.dia;
          if (el.dataset.mod) {
            const md = modelos.find((x) => x.id === el.dataset.mod);
            if (!md) return;
            const rs = resumoEstrutura(md.estrutura, perfil);
            const { error } = await sb.from('nx_plano_corrida').insert({
              org_id: S.org.id,
              aluno_id: alunoId,
              data,
              tipo: md.tipo,
              titulo: md.nome,
              estrutura: md.estrutura,
              distancia_km: Math.round(rs.km * 10) / 10,
              duracao_min: Math.round(rs.seg / 60),
              zona: null,
              criado_por: S.user.id,
            });
            error
              ? toast('Não foi possível adicionar.', true)
              : (toast(`${md.nome} em ${DIAS[dia(data).getDay()]} ${dia(data).getDate()}`), recarregar());
          } else if (el.dataset.ses) {
            const p = plano.find((x) => x.id === el.dataset.ses);
            if (!p || (p.data === data && !ev.copia)) return;
            if (ev.copia) {
              const { id, criado_em, garmin_workout_id, garmin_schedule_id, garmin_enviado_em, garmin_erro, ...resto } =
                p;
              const { error } = await sb
                .from('nx_plano_corrida')
                .insert({ ...resto, data, liberado: false, criado_por: S.user.id });
              error ? toast('Não foi possível copiar.', true) : (toast('Treino copiado.'), recarregar());
            } else {
              const { error } = await sb.from('nx_plano_corrida').update({ data }).eq('id', p.id);
              error
                ? toast('Não foi possível mover.', true)
                : (toast(`Movido para ${DIAS[dia(data).getDay()]} ${dia(data).getDate()}`), recarregar());
              if (!error && p.garmin_workout_id && p.liberado && S.cache.garmOn)
                enviarGarmin(alunoId, [{ ...p, data }], perfil).catch(() => {});
            }
          }
        },
      });
      // copiar/colar semana: a cópia fica guardada e dá para colar em outra semana ou em outro aluno
      q('#copiar-sem').onclick = () => {
        if (!plano.length) return;
        const base = isoDia(ini);
        const itens = plano.map((p) => {
          const {
            id,
            criado_em,
            aluno_id,
            org_id,
            data,
            criado_por,
            garmin_workout_id,
            garmin_schedule_id,
            garmin_enviado_em,
            garmin_erro,
            ...resto
          } = p;
          return { ...resto, off: Math.round((dia(data) - dia(base)) / 864e5) };
        });
        store.set('nx_clip_corr', {
          origem: `${firstName(m.nome || 'aluno')} · ${ini.getDate()}/${ini.getMonth() + 1}`,
          semanas,
          itens,
        });
        toast(
          `${itens.length} treino${itens.length > 1 ? 's' : ''} copiado${itens.length > 1 ? 's' : ''}. Vá até a semana (ou outro aluno) e toque em “Colar”.`,
        );
        recarregar();
      };
      const colar = q('#colar-sem');
      if (colar)
        colar.onclick = () => {
          const clip = store.get('nx_clip_corr', null);
          if (!clip) return;
          const fimC = new Date(ini);
          fimC.setDate(ini.getDate() + clip.semanas * 7 - 1);
          const ja = plano.filter((p) => p.data >= isoDia(ini) && p.data <= isoDia(fimC)).length;
          openSheet(
            `<p class="eyebrow">Colar ${clip.semanas > 1 ? 'semanas' : 'semana'}</p><div class="h2" style="margin-top:4px">${clip.itens.length} treino${clip.itens.length > 1 ? 's' : ''} de ${esc(clip.origem)}</div>
          <p class="small muted" style="margin-top:6px">Vão para ${esc(firstName(m.nome || 'o aluno'))}, a partir de ${fmtDia(isoDia(ini))}, nos mesmos dias da semana.${ja ? ` Essa semana já tem ${ja} treino${ja > 1 ? 's' : ''}.` : ''}</p>
          <div class="stack" style="margin-top:16px">${ja ? `<button class="btn block" data-modo="trocar">Substituir os ${ja} treinos que já estão lá</button><button class="btn ghost block" data-modo="somar">Somar aos que já estão</button>` : '<button class="btn block" data-modo="somar">Colar aqui</button>'}
          <button class="link-btn small" data-modo="limpar" style="color:var(--err)">Descartar a cópia</button></div>`,
            (r) => {
              r.onclick = async (e) => {
                const b2 = e.target.closest('[data-modo]');
                if (!b2) return;
                const modo = b2.dataset.modo;
                if (modo === 'limpar') {
                  store.del('nx_clip_corr');
                  closeSheet();
                  toast('Cópia descartada.');
                  return recarregar();
                }
                b2.disabled = true;
                if (modo === 'trocar') {
                  const velhos = plano.filter((p) => p.data >= isoDia(ini) && p.data <= isoDia(fimC));
                  const ids = velhos.map((p) => p.id);
                  const noG = velhos.filter((p) => p.garmin_workout_id);
                  if (noG.length)
                    await chamarGarmin({
                      acao: 'remover_treinos',
                      aluno_id: alunoId,
                      itens: noG.map((p) => ({ plano_id: p.id })),
                    }).catch(() => {});
                  if (ids.length) await sb.from('nx_plano_corrida').delete().in('id', ids);
                }
                const novos = clip.itens.map(
                  ({ off, garmin_workout_id, garmin_schedule_id, garmin_enviado_em, garmin_erro, ...resto }) => {
                    const d = new Date(ini);
                    d.setDate(ini.getDate() + off);
                    return {
                      ...resto,
                      org_id: S.org.id,
                      aluno_id: alunoId,
                      data: isoDia(d),
                      liberado: false,
                      criado_por: S.user.id,
                    };
                  },
                );
                const { error } = await sb.from('nx_plano_corrida').insert(novos);
                closeSheet();
                if (error) return toast('Não foi possível colar.', true);
                toast('Treinos colados!');
                recarregar();
              };
            },
          );
        };
      q('#avisar').onclick = () => {
        notificarAluno('planilha', alunoId);
        toast('Aluno avisado da planilha.');
      };
      q('#guia-plan').onclick = () => guiaPlanilha();
      if (!store.get('nx_guia_plan', false))
        setTimeout(() => {
          if (box.isConnected) guiaPlanilha();
        }, 400);
    }
  }
  if (
    !staff &&
    integ &&
    (!integ.ultima_sync || Date.now() - new Date(integ.ultima_sync) > 30 * 60000) &&
    !st.syncTentado
  ) {
    st.syncTentado = true;
    sincronizarIntervals(alunoId)
      .then((n) => {
        if (n > 0) {
          toast(`${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''} do relógio`);
          recarregar();
        }
      })
      .catch(() => {});
  }
}

function notificarAluno(acao, alunoId) {
  try {
    sb.functions.invoke('nx-push', { body: { acao, aluno_id: alunoId } }).catch(() => {});
  } catch {}
}
