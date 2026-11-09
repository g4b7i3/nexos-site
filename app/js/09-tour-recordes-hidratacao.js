/* Nexos App · Tour de boas-vindas, recordes pessoais e hidratação.
   Parte 9 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- tour de boas-vindas pelo app (aluno) ---------- */
// tour completo: cada passo aponta uma parte do app (passos sem a parte na tela do aluno são pulados)
const TOUR_PASSOS = [
  // tela Hoje
  {
    rota: '#/',
    sel: '.hoje-hero',
    t: 'Seu dia em um lugar só',
    d: () =>
      `Saudação, o que tem de treino hoje, a sua hidratação e quantas semanas seguidas você está treinando${faz('corrida') ? ', além dos km da semana' : ''}.`,
  },
  {
    rota: '#/',
    sel: '#hh-agua',
    t: 'Hidratação no topo',
    d: 'Quanto você já bebeu e quanto falta para a meta do dia.',
  },
  {
    rota: '#/',
    sel: '#momentos .card',
    t: 'Momentos',
    d: () =>
      `Aqui aparecem as novidades na hora certa: nova medalha, retrospectiva do mês${faz('corrida') ? ', modo prova na semana da sua prova' : ''} e o antes e depois aos 3 meses.`,
  },
  {
    rota: '#/',
    sel: '#pend-sec:not([hidden])',
    t: 'A preencher',
    d: 'O que está esperando por você. Responda e o card some.',
  },
  {
    rota: '#/',
    sel: '#pront-abrir',
    t: 'Check-in da manhã',
    d: 'De manhã, 20 segundos: sono, energia, dor e estresse. Se marcar dor, um boneco mostra onde dói. Seu treinador recebe e ajusta o treino.',
  },
  {
    rota: '#/',
    sel: '.hoje-main > .stack',
    t: 'Treino de hoje',
    d: () =>
      faz('corrida') && faz('musculacao')
        ? 'O treino do dia: na corrida, o passo a passo com os ritmos de cada trecho; na força, os exercícios. E o recado do treinador.'
        : faz('corrida')
          ? 'O treino do dia com o passo a passo, os ritmos de cada trecho e o recado do treinador.'
          : 'O treino de força do dia, com os exercícios e o recado do treinador.',
  },
  {
    so: 'corrida',
    rota: '#/',
    sel: '.corr-home a[href^="#/gps"]',
    t: 'Treinar pelo celular',
    d: 'Sem relógio? O app marca distância, pace e voz a cada trecho, na rua (GPS) ou na esteira.',
  },
  {
    rota: '#/',
    sel: '#agua-box',
    t: 'Copo de água',
    d: 'Toque a cada água que beber. A meta é calculada pelo seu peso e pelo treino do dia. Você recebe lembretes até bater a meta, no intervalo que escolher ali embaixo (ou nenhum).',
  },
  {
    rota: '#/',
    sel: '.hoje-tiles',
    t: 'Seus números',
    d: () => {
      const c = faz('corrida'),
        m = faz('musculacao');
      const it = [
        c && 'contagem para a próxima prova',
        c && 'previsão do seu tempo nos 5 km',
        c && 'quantas corridas e km você fez na semana',
        m && 'a fase do seu treino de força',
      ].filter(Boolean);
      return (
        it
          .join(', ')
          .replace(/, ([^,]*)$/, ' e $1')
          .replace(/^./, (x) => x.toUpperCase()) + '.'
      );
    },
  },
  { rota: '#/', sel: '.semana-comp', t: 'Sua semana', d: 'Os dias em que você treinou nesta semana.' },
  {
    rota: '#/',
    sel: '#fab-reg',
    t: 'Botão +',
    d: () =>
      faz('corrida')
        ? 'Treinar pelo celular, registrar uma corrida feita sem relógio ou falar com o treinador.'
        : 'Atalho para falar com o seu treinador: dor, dúvida ou recado.',
  },
  // planilha
  {
    rota: '#/planilha',
    sel: '#pl-c',
    t: 'Planilha',
    d: () =>
      `A sua semana de treinos. Toque em um dia para ver o treino completo.${faz('corrida') ? ' Treinos de corrida liberados pelo treinador vão sozinhos para o relógio Garmin.' : ''}`,
  },
  {
    so: 'musculacao',
    rota: '#/planilha',
    sel: '#pl-f .section,#pl-c .tr-card',
    t: 'Treinos de força',
    d: 'Seus treinos de força com vídeos dos exercícios. No treino, marque cada série e a carga: o app guarda a sua evolução.',
  },
  // evolução
  {
    rota: '#/historico',
    sel: '.freq-sem,.sec-grid',
    t: 'Evolução',
    d: 'Sua frequência e a constância nas últimas semanas.',
  },
  {
    rota: '#/historico',
    sel: '.sec-mom',
    t: 'Seus momentos',
    d: 'Medalhas das suas conquistas, retrospectiva de cada mês e o seu antes e depois. Tudo vira card para o story.',
  },
  {
    rota: '#/historico',
    sel: '.sec-det',
    t: 'Detalhes da evolução',
    d: () => {
      const c = faz('corrida'),
        m = faz('musculacao');
      return `${c ? 'Previsões de prova, r' : 'R'}elatório do mês em PDF, histórico de treinos${c ? ', corridas' : ''}${m ? ', cargas' : ''}, avaliações físicas e fotos.`;
    },
  },
  {
    rota: '#/medalhas',
    sel: '.med-hero',
    t: 'Medalhas',
    d: 'Quantas conquistas você já tem. Toque numa medalha conquistada para gerar o card do story.',
  },
  {
    rota: '#/medalhas',
    sel: '.med-sec',
    t: 'Próximas conquistas',
    d: 'As medalhas apagadas mostram quanto falta para conquistar.',
  },
  {
    so: 'corrida',
    rota: '#/historico/corrida',
    sel: '.corr-item,.card.tap',
    t: 'Cada corrida',
    d: 'Abra uma corrida para ver mapa, parciais, frequência cardíaca, análise do treino, o replay do percurso em vídeo e a comparação com você mesmo semanas atrás.',
  },
  // treinador
  {
    rota: '#/conversa',
    sel: '#f-msg',
    t: 'Treinador',
    d: 'Conversa direta com o seu treinador. Ele pode mandar recados de voz.',
  },
  // mais
  {
    rota: '#/mais',
    sel: '#mais-treino',
    t: 'Mais: treino e desempenho',
    d: () =>
      faz('corrida')
        ? 'Eventos e provas da Nexos, seus recordes, avaliações físicas, fotos de evolução e testes com previsões e zonas de treino.'
        : 'Eventos da Nexos, avaliações físicas e fotos de evolução.',
  },
  {
    rota: '#/mais',
    sel: '#mais-saude',
    t: 'Mais: saúde',
    d: 'Hidratação da semana, histórico de check-ins e dores, ciclo menstrual (para quem ativar) e a sua ficha de saúde. Em Avaliações dá também para registrar as suas medidas em casa.',
  },
  {
    rota: '#/mais',
    sel: 'a[href="#/conexoes"]',
    t: 'Conecte o seu relógio',
    d: () =>
      faz('corrida')
        ? 'Garmin e outras marcas: as corridas chegam sozinhas e os treinos vão para o relógio.'
        : 'Garmin e outras marcas: suas atividades chegam sozinhas ao app.',
  },
  { rota: '#/mais', sel: 'a[href="#/pagamentos"]', t: 'Pagamentos', d: 'Suas mensalidades e as formas de pagamento.' },
  {
    rota: '#/mais',
    sel: '#mais-notif',
    t: 'Notificações',
    d: 'Ative para receber o treino do dia, os lembretes de água e as mensagens do treinador.',
  },
  {
    rota: '#/mais',
    sel: 'a[href="#/perfil"]',
    t: 'Seu perfil',
    d: 'Foto, dados, tema claro ou escuro e sair da conta.',
  },
  {
    rota: '#/mais',
    sel: '#mais-tour',
    t: 'Pronto!',
    d: 'Você viu tudo. Para rever este tour, é só vir aqui em Mais > Tour pelo app. Bons treinos!',
  },
];
// tour do painel do treinador
const TOUR_STAFF = [
  {
    rota: '#/',
    sel: 'h1.h1',
    t: 'Seu dia de treinador',
    d: 'A tela Hoje junta tudo o que pede a sua atenção. Aqui em cima, quantos alunos seus precisam de você hoje.',
  },
  {
    rota: '#/',
    sel: '.stats',
    t: 'Números da assessoria',
    d: 'Alunos ativos, treinos feitos nos últimos 7 dias e quanto há a receber no mês.',
  },
  {
    rota: '#/',
    sel: '#pront-eq',
    t: 'Prontidão de hoje',
    d: 'Quantos alunos responderam o check-in da manhã, quem pede atenção e quem está pronto para treinar. Toque para abrir o painel completo.',
  },
  {
    rota: '#/',
    sel: '#alertas',
    t: 'Alunos que pedem atenção',
    d: 'Dor relatada, prontidão baixa, alerta de carga, dias sem treinar, planilha acabando, mensagens e pagamentos. Toque no aluno e o app leva direto ao ponto certo.',
  },
  {
    rota: '#/',
    sel: '#sug-hoje .section',
    t: 'Sugestões do app',
    d: 'Quando um aluno marca dor no check-in, o app monta um ajuste pronto para a corrida e a força. Você revisa, aplica, desfaz ou descarta.',
  },
  {
    rota: '#/',
    sel: '.rs-grid',
    t: 'Resumo da semana',
    d: 'Quem treinou, quem faltou, provas nos próximos 14 dias e quem ainda está com a semana sem liberar.',
  },
  {
    rota: '#/',
    sel: '#ativ-corpo,.empty',
    t: 'Atividade da semana',
    d: 'Cada treino que chega dos alunos. Marque como visto e o aluno recebe o aviso de que você analisou.',
  },
  {
    rota: '#/prontidao-equipe',
    sel: '.pe-resumo',
    t: 'Painel de prontidão',
    d: 'O check-in de todos em uma tela: quem pede atenção, quem está moderado, quem está pronto para treinar forte e quem ainda não respondeu. Dá para voltar aos dias anteriores.',
  },
  {
    rota: '#/prontidao-equipe',
    sel: '#pe-carga',
    t: 'Alerta de carga',
    d: 'Avisa quando um aluno aumenta a carga rápido demais em relação às semanas anteriores, o que eleva o risco de lesão. Você também recebe uma notificação.',
  },
  {
    rota: '#/alunos',
    sel: 'h1.h1',
    t: 'Atletas',
    d: 'Todos os seus alunos, com ícones de alerta. Abra um aluno para montar a planilha de corrida, os treinos de força, ver avaliações, saúde, check-ins e conversar.',
  },
  {
    rota: '#/mensagens',
    sel: '#cv-lista,h1.h1',
    t: 'Mensagens',
    d: 'As conversas com todos os alunos em um lugar. Você pode mandar texto ou recado de voz.',
  },
  {
    rota: '#/treinos',
    sel: 'h1.h1',
    t: 'Treinos',
    d: 'Sua biblioteca de modelos de corrida e força por nível, para montar planilhas mais rápido.',
  },
  {
    rota: '#/laboratorio',
    sel: '.lab-cards',
    t: 'Laboratório Nexos',
    d: 'Só a equipe vê. O dossiê completo de cada atleta (com PDF e o seu parecer), a visão da assessoria mês a mês e a evolução de todos os alunos lado a lado.',
  },
  { rota: '#/mais', sel: 'a[href="#/financeiro"]', t: 'Financeiro', d: 'Mensalidades, Pix e quem está em dia.' },
  {
    rota: '#/mais',
    sel: 'a[href="#/formularios"]',
    t: 'Formulários',
    d: 'Gere o link da ficha de entrada e mande no WhatsApp. Quem preencher aparece no Hoje para você aprovar.',
  },
  {
    rota: '#/mais',
    sel: 'a[href="#/eventos"]',
    t: 'Eventos',
    d: 'Treinões da Nexos e os alunos inscritos em cada prova.',
  },
  {
    rota: '#/mais',
    sel: 'a[href="#/saude-sistema"]',
    t: 'Saúde do sistema',
    d: 'Erros do app, conexões do Garmin, notificações e avisos automáticos, com botões para resolver.',
  },
  {
    rota: '#/mais',
    sel: 'a[href="#/perfil"]',
    t: 'Perfil e equipe',
    d: 'Sua conta, os treinadores da equipe e as notificações. Ative as notificações para receber os avisos no celular.',
  },
  {
    rota: '#/mais',
    sel: '#mais-tour',
    t: 'Pronto!',
    d: 'Você viu o painel todo. Para rever este tour, é só vir aqui em Mais > Tour pelo painel.',
  },
];
function esperarEl(sel, ms = 2000) {
  return new Promise((ok) => {
    const t0 = Date.now();
    const f = () => {
      const e = document.querySelector(sel);
      if (e && e.getBoundingClientRect().height > 0) return ok(e);
      if (Date.now() - t0 > ms) return ok(null);
      setTimeout(f, 120);
    };
    f();
  });
}
async function iniciarTour() {
  closeSheet(true);
  let i = 0;
  const ov = document.createElement('div');
  ov.className = 'tour';
  ov.innerHTML = '<div class="tour-luz"></div><div class="tour-box" role="dialog" aria-live="polite"></div>';
  document.body.append(ov);
  const luz = ov.querySelector('.tour-luz'),
    box = ov.querySelector('.tour-box');
  const sair = (feito) => {
    ov.remove();
    window.removeEventListener('resize', pos);
    window.removeEventListener('scroll', pos);
    if (feito) {
      sb.rpc('nx_tour', { p_estado: 'feito' }).then(
        () => {},
        () => {},
      );
      S.me.tour = 'feito';
    }
    if (location.hash !== '#/') location.hash = '#/';
  };
  // só o que o aluno assinou: passos de corrida ou de força ficam de fora para quem não tem
  const passos = (S.staff ? TOUR_STAFF : TOUR_PASSOS)
    .filter((p) => !p.so || faz(p.so))
    .map((p) => ({ ...p, d: typeof p.d === 'function' ? p.d() : p.d }));
  let alvo = null;
  function pos() {
    if (!alvo) return;
    const r = alvo.getBoundingClientRect(),
      m = 8;
    Object.assign(luz.style, {
      left: r.left - m + 'px',
      top: r.top - m + 'px',
      width: r.width + m * 2 + 'px',
      height: r.height + m * 2 + 'px',
    });
    const bh = box.offsetHeight,
      emBaixo = r.bottom + bh + 24 < innerHeight || r.top < bh + 24;
    box.style.top = (emBaixo ? Math.min(innerHeight - bh - 12, r.bottom + 16) : Math.max(12, r.top - bh - 16)) + 'px';
  }
  async function vai(n) {
    i = n;
    const p = passos[i];
    if (!p) return sair(true);
    if (location.hash !== p.rota && !(p.rota === '#/' && (location.hash === '' || location.hash === '#'))) {
      location.hash = p.rota;
      await new Promise((r) => setTimeout(r, 450));
    }
    box.innerHTML = '<p class="small muted">Carregando…</p>';
    luz.style.opacity = '0';
    alvo = await esperarEl(p.sel);
    if (!alvo) {
      if (i < passos.length - 1) return vai(i + 1);
    }
    if (alvo) {
      alvo.scrollIntoView({ block: 'center', behavior: semMov() ? 'auto' : 'smooth' });
      await new Promise((r) => setTimeout(r, 380));
    }
    box.innerHTML = `<div class="tour-top"><span class="tour-n">${i + 1} de ${passos.length}</span><button type="button" class="link-btn small" data-t="sair">Sair do tour</button></div>
      <b>${p.t}</b><p>${p.d}</p>
      <div class="tour-bts">${i ? '<button type="button" class="btn ghost sm" data-t="volta">Voltar</button>' : '<span></span>'}<button type="button" class="btn sm" data-t="prox">${i === passos.length - 1 ? 'Concluir' : 'Próximo'}</button></div>
      <div class="tour-pts">${passos.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'ok' : ''}"></i>`).join('')}</div>`;
    luz.style.opacity = alvo ? '1' : '0';
    pos();
  }
  window.addEventListener('resize', pos);
  window.addEventListener('scroll', pos, { passive: true });
  ov.onclick = (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'sair') return sair(false);
    if (b.dataset.t === 'volta') return vai(Math.max(0, i - 1));
    if (b.dataset.t === 'prox') return vai(i + 1);
  };
  vai(0);
}
// convite: aparece uma vez por sessão para quem ainda não fez nem recusou
function convidarTour() {
  if (!S.me || S.me.tour || sessionStorage.getItem('nx-tour-conv')) return; // tour null = ainda não viu esta versão
  setTimeout(() => {
    if (
      !$sheet.hidden ||
      document.querySelector('.tour,.retro,.replay') ||
      location.hash.replace('#', '').replace('/', '')
    )
      return;
    try {
      sessionStorage.setItem('nx-tour-conv', '1');
    } catch {}
    openSheet(
      `<div class="tour-conv"><div class="tour-conv-ic">${I.play}</div><p class="eyebrow">${S.staff ? 'Painel do treinador' : 'Bem-vindo ao app da Nexos'}</p><div class="h2" style="margin-top:4px">${S.staff ? 'Quer conhecer tudo o que o painel faz?' : 'Quer conhecer tudo o que o app faz?'}</div>
      <p class="muted" style="margin-top:8px">${S.staff ? 'Um tour rápido mostrando cada parte: alertas, prontidão da equipe, alerta de carga, sugestões, atletas, mensagens, relatórios e gestão.' : 'Um tour rápido, de 1 minuto, mostrando cada parte: treino do dia, check-in, hidratação, planilha, medalhas, conexão com o relógio e mais.'}</p>
      <button class="btn block" id="tr-sim" style="margin-top:16px">Fazer o tour</button>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost grow" id="tr-depois">Agora não</button><button class="btn ghost grow" id="tr-nao">Não quero</button></div>
      <p class="tiny dim center" style="margin-top:10px">Você pode fazer o tour quando quiser em Mais > ${S.staff ? 'Tour pelo painel' : 'Tour pelo app'}.</p></div>`,
      (r) => {
        r.querySelector('#tr-sim').onclick = () => iniciarTour();
        r.querySelector('#tr-depois').onclick = () => closeSheet();
        r.querySelector('#tr-nao').onclick = () => {
          sb.rpc('nx_tour', { p_estado: 'recusado' }).then(
            () => {},
            () => {},
          );
          S.me.tour = 'recusado';
          closeSheet();
          toast(`Tudo bem. O tour fica em Mais > ${S.staff ? 'Tour pelo painel' : 'Tour pelo app'}.`);
        };
      },
    );
  }, 1500);
}

/* ---------- recordes pessoais de corrida ---------- */
const DIST_REC = [
  [1, '1 km'],
  [5, '5 km'],
  [10, '10 km'],
  [21.0975, 'Meia maratona'],
];
function melhoresDaCorrida(c) {
  const out = {};
  if (!c || c.tipo === 'esteira' || !c.distancia_m || !c.duracao_s) return out;
  const sp = (c.parciais || []).filter((p) => !p.parcial && p.seg > 0).map((p) => p.seg);
  DIST_REC.forEach(([d]) => {
    let best = null;
    const n = Math.round(d) === 21 ? 21 : d;
    if (sp.length >= n) {
      let s = sp.slice(0, n).reduce((a, b) => a + b, 0);
      best = s;
      for (let i = n; i < sp.length; i++) {
        s += sp[i] - sp[i - n];
        if (s < best) best = s;
      }
      if (n === 21) best = (best * d) / 21;
    }
    const dm = d * 1000;
    if (best == null && c.distancia_m >= dm * 0.995 && c.distancia_m <= dm * 1.03)
      best = (c.duracao_s * dm) / c.distancia_m;
    if (best && best / d >= 150) out[d] = Math.round(best); // descarta erro de GPS (mais rápido que 2:30/km)
  });
  return out;
}
function recordesDoDia(corridas, dia_) {
  const antes = {},
    hoje = {};
  corridas.forEach((c) => {
    const m = melhoresDaCorrida(c),
      alvo = isoDia(c.data) === dia_ ? hoje : isoDia(c.data) < dia_ ? antes : null;
    if (!alvo) return;
    Object.entries(m).forEach(([d, t]) => {
      if (alvo[d] == null || t < alvo[d]) alvo[d] = t;
    });
  });
  return DIST_REC.filter(([d]) => hoje[d] != null && antes[d] != null && hoje[d] < antes[d]).map(([d, n]) => ({
    n,
    t: hoje[d],
    antes: antes[d],
  }));
}

/* ---------- hidratação: copo que enche a cada registro ---------- */
async function aguaStaffHTML(m, doAluno = false) {
  const ini = isoDia(Date.now() - 6 * 864e5);
  const [rows, corr, ses, peso] = await Promise.all([
    sb
      .from('nx_hidratacao')
      .select('dia,ml,meta')
      .eq('aluno_id', m.user_id)
      .gte('dia', ini)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_corridas')
      .select('data')
      .eq('aluno_id', m.user_id)
      .gte('data', ini)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_sessoes')
      .select('iniciado_em')
      .eq('aluno_id', m.user_id)
      .gte('iniciado_em', ini)
      .then(
        (r) => r.data || [],
        () => [],
      ),
    m.meta_agua_ml ? Promise.resolve(null) : pesoDoAluno(m.user_id),
  ]);
  const treinou = new Set([...corr.map((c) => isoDia(c.data)), ...ses.map((x) => isoDia(x.iniciado_em))]);
  const dias = Array.from({ length: 7 }, (_, i) => isoDia(Date.now() - (6 - i) * 864e5));
  const metaPadrao = metaAgua(peso, 0, m.meta_agua_ml).ml;
  const D = dias.map((d) => {
    const r = rows.find((x) => x.dia === d);
    const meta = (r && r.meta) || metaPadrao;
    return { d, ml: r ? r.ml : 0, meta, pct: r ? r.ml / meta : 0, t: treinou.has(d) };
  });
  const comReg = D.filter((x) => x.ml > 0),
    media = comReg.length ? comReg.reduce((a, x) => a + Math.min(1.3, x.pct), 0) / comReg.length : null;
  return `<div class="card agua-staff"><div class="row between" style="gap:8px"><b>${AGUA_IC} Hidratação</b><span class="tiny dim">últimos 7 dias</span></div>
    <div class="as-cols">${D.map((x) => `<div class="as-col" title="${fmtCurto(x.d)}: ${fmtL(x.ml)} de ${fmtL(x.meta)}"><div class="as-bar"><i style="height:${Math.min(100, x.pct * 100)}%" class="${x.pct >= 1 ? 'ok' : x.pct >= 0.6 ? '' : 'baixo'}"></i></div><small>${DSEM[dsemIdx(x.d)].slice(0, 3)}</small>${x.t ? '<em title="treinou">•</em>' : '<em></em>'}</div>`).join('')}</div>
    <p class="small muted" style="margin-top:8px">${media == null ? (doAluno ? 'Nenhum registro de água nesta semana.' : 'O aluno ainda não registrou água nesta semana.') : `Média de <b>${Math.round(media * 100)}%</b> da meta nos dias com registro · ${comReg.filter((x) => x.pct >= 1).length} de 7 dias com meta batida.`} O ponto marca os dias com treino.</p>
    ${
      doAluno
        ? '</div>'
        : `<form id="f-agua-meta" class="row" style="gap:8px;margin-top:10px;align-items:flex-end"><label class="field grow" style="margin:0"><span>Meta diária (litros)</span><input class="input" name="l" data-mask="dec" data-int="2" data-casas="1" inputmode="decimal" value="${m.meta_agua_ml ? String(m.meta_agua_ml / 1000).replace('.', ',') : ''}" placeholder="automática: ${fmtL(metaPadrao)} + treino"></label><button class="btn ghost sm">Salvar</button></form>
    <p class="tiny dim" style="margin-top:6px">Automática: ~35 ml por kg, mais ~600 ml por hora de treino do dia. Deixe vazio para usar a automática.</p></div>`
    }`;
}
function bindAguaStaff(m) {
  const f = document.getElementById('f-agua-meta');
  if (!f) return;
  aplicarMascaras(f);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const l = num(f.l.value);
    const ml = l ? Math.round(l * 1000) : null;
    if (ml != null && (ml < 500 || ml > 10000)) return toast('Use uma meta entre 0,5 e 10 litros.', true);
    const { error } = await sb
      .from('nx_membros')
      .update({ meta_agua_ml: ml })
      .eq('org_id', S.org.id)
      .eq('user_id', m.user_id);
    if (error) return toast('Não foi possível salvar.', true);
    m.meta_agua_ml = ml;
    toast(ml ? `Meta de ${fmtL(ml)} salva.` : 'Meta automática.');
  };
}
const PRONT_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>';
const TROFEU_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>';
const AGUA_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8s6.5 7.2 6.5 11.7a6.5 6.5 0 0 1-13 0C5.5 10 12 2.8 12 2.8z"/></svg>';
const FOGO_IC =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c.6 3.2 3.6 5 4.9 7.9 1.6 3.6.2 8.4-3.4 9.8 1.3-1.6 1.4-3.9.1-5.6-.5 1.4-1.6 2.3-2.9 2.6.8-2.5-.4-5-2.6-6.3.2 2.2-1.4 3.4-2.1 5.1-1 2.4.1 4.8 2 5.9C4.6 19.7 3.6 15 5.7 11.3 7.5 8.2 11.1 6.5 12 2z"/></svg>';
const COPO_SVG = (
  pct,
) => `<svg viewBox="0 0 120 150" class="copo" aria-hidden="true"><defs><linearGradient id="agG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cc8ff"/><stop offset="1" stop-color="#1f6fe0"/></linearGradient><clipPath id="agC"><path d="M15 9H105L95.5 140.5Q95 145 90 145H30Q25 145 24.5 140.5Z"/></clipPath></defs>
  <g clip-path="url(#agC)"><rect width="120" height="150" class="copo-fundo"/><g class="agua-nivel" style="transform:translateY(${(146 - Math.min(1, pct) * 137).toFixed(1)}px)"><path class="onda o2" d="M0 7Q15 1 30 7T60 7T90 7T120 7T150 7T180 7T210 7T240 7V170H0Z"/><path class="onda" d="M0 6Q15 0 30 6T60 6T90 6T120 6T150 6T180 6T210 6T240 6V170H0Z" fill="url(#agG)"/></g></g>
  <path d="M15 9H105L95.5 140.5Q95 145 90 145H30Q25 145 24.5 140.5Z" fill="none" class="copo-borda" stroke-width="3" stroke-linejoin="round"/><path d="M27 22 31 120" class="copo-brilho" stroke-width="4" stroke-linecap="round"/></svg>`;
const fmtL = (ml) => (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : ml % 100 === 0 ? 1 : 2).replace('.', ',') + ' L';
async function pesoDoAluno(alunoId) {
  const av = await sb
    .from('nx_avaliacoes')
    .select('peso')
    .eq('aluno_id', alunoId)
    .not('peso', 'is', null)
    .order('data', { ascending: false })
    .limit(1)
    .then(
      (r) => (r.data || [])[0],
      () => null,
    );
  if (av && +av.peso) return +av.peso;
  const an = await sb
    .from('nx_anamneses')
    .select('respostas')
    .eq('aluno_id', alunoId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => (r.data || [])[0],
      () => null,
    );
  const p = an && an.respostas && num(String(an.respostas.peso || ''));
  return p && p > 30 && p < 250 ? p : null;
}
// meta diária: ~35 ml por kg (dia comum) + ~600 ml por hora de treino planejado; o treinador pode fixar a meta
function metaAgua(peso, minTreino, manual) {
  if (manual) return { ml: manual, fonte: 'definida pelo treinador' };
  const base = (peso || 70) * 35,
    extra = ((minTreino || 0) / 60) * 600;
  return {
    ml: Math.round((base + extra) / 50) * 50,
    fonte: `${peso ? Math.round(peso) + ' kg' : 'peso médio'}${minTreino ? ` + treino de ${Math.round(minTreino)} min` : ''}`,
  };
}
async function montarAgua(box, minTreino) {
  if (!box) return;
  const dia_ = isoDia(new Date());
  const [row, peso] = await Promise.all([
    sb
      .from('nx_hidratacao')
      .select('*')
      .eq('aluno_id', S.user.id)
      .eq('dia', dia_)
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
    S.me.meta_agua_ml ? Promise.resolve(null) : pesoDoAluno(S.user.id),
  ]);
  const meta = metaAgua(peso, minTreino, S.me.meta_agua_ml);
  const st = { ml: row ? row.ml : 0, reg: row ? row.registros || [] : [] };
  let salvando = Promise.resolve();
  const desenha = (anim) => {
    const pct = st.ml / meta.ml,
      ok = pct >= 1;
    box.innerHTML = `<div class="agua-card ${ok ? 'cheio' : ''}"><div class="agua-top"><span class="eyebrow">${AGUA_IC} Hidratação</span><span class="tiny dim">${Math.round(pct * 100)}%</span></div>
      <div class="agua-corpo"><div class="copo-wrap">${COPO_SVG(anim ? Math.max(0, pct - 0.0001) : pct)}</div>
        <div class="agua-info"><b>${fmtL(st.ml)}</b><span>de ${fmtL(meta.ml)}</span><small>${ok ? 'Meta batida hoje!' : `Faltam ${fmtL(meta.ml - st.ml)}`}</small><small class="dim">Meta: ${esc(meta.fonte)}</small></div></div>
      <div class="agua-bts"><button type="button" data-ml="200">${AGUA_IC}<b>+200 ml</b><small>copo</small></button><button type="button" data-ml="500">${AGUA_IC}<b>+500 ml</b><small>garrafa</small></button><button type="button" data-ml="outro"><b>Outro</b><small>valor</small></button></div>
      <div class="agua-pe">${st.reg.length ? `<button type="button" class="link-btn tiny agua-desf" id="agua-desf">Desfazer o último (${st.reg[st.reg.length - 1].ml} ml)</button>` : '<span></span>'}<button type="button" class="link-btn tiny agua-lemb" id="agua-lemb">${S.me.lembrete_agua === false ? 'Lembretes desligados' : `Lembretes: ${AGUA_INT_TXT(S.me.agua_intervalo_min || 60)}`}</button></div></div>`;
    const hh = document.getElementById('hh-agua');
    if (hh) {
      hh.hidden = false;
      hh.innerHTML = `${AGUA_IC}<span>Hidratação: ${ok ? `meta do dia atingida (${fmtL(st.ml)})` : `${fmtL(st.ml)} de ${fmtL(meta.ml)} · ${Math.round(pct * 100)}% da meta`}</span>`;
    }
    if (anim)
      requestAnimationFrame(() => {
        const n = box.querySelector('.agua-nivel');
        if (n) n.style.transform = `translateY(${(146 - Math.min(1, pct) * 137).toFixed(1)}px)`;
      });
  };
  const salvar = () => {
    salvando = salvando.then(() =>
      sb
        .from('nx_hidratacao')
        .upsert(
          {
            org_id: S.org.id,
            aluno_id: S.user.id,
            dia: dia_,
            ml: st.ml,
            meta: meta.ml,
            registros: st.reg.slice(-60),
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'aluno_id,dia' },
        )
        .then(({ error }) => {
          if (error) {
            console.error(error);
            toast('Não foi possível salvar a água. Tente de novo.', true);
          }
        }),
    );
  };
  const somar = (ml) => {
    const antes = st.ml / meta.ml;
    st.ml = Math.min(20000, st.ml + ml);
    st.reg.push({ ml, t: new Date().toISOString() });
    const nivel = box.querySelector('.agua-nivel'),
      antesT = nivel ? nivel.style.transform : null;
    desenha(false);
    const n2 = box.querySelector('.agua-nivel');
    if (n2 && antesT) {
      n2.style.transform = antesT;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          n2.style.transform = `translateY(${(146 - Math.min(1, st.ml / meta.ml) * 137).toFixed(1)}px)`;
        }),
      );
    }
    try {
      navigator.vibrate && navigator.vibrate(12);
    } catch {}
    if (antes < 1 && st.ml / meta.ml >= 1) toast('Meta de água batida! Seu corpo agradece.');
    salvar();
  };
  box.onclick = (e) => {
    const b = e.target.closest('[data-ml]');
    if (b) {
      if (b.dataset.ml !== 'outro') return somar(+b.dataset.ml);
      return openSheet(
        `<div class="h2">Quanto você bebeu?</div><form id="f-agua" style="margin-top:12px"><label class="field"><span>Quantidade (ml)</span><input class="input" name="ml" inputmode="numeric" data-mask="num" data-max="4" placeholder="Ex.: 350" autofocus required></label><div class="chips" style="margin-bottom:12px">${[150, 250, 300, 750, 1000].map((v) => `<button type="button" class="chip" data-v="${v}">${v} ml</button>`).join('')}</div><button class="btn block">Adicionar</button></form>`,
        (r) => {
          const f = r.querySelector('#f-agua');
          aplicarMascaras(f);
          r.querySelectorAll('[data-v]').forEach(
            (c) =>
              (c.onclick = () => {
                closeSheet();
                somar(+c.dataset.v);
              }),
          );
          f.onsubmit = (ev) => {
            ev.preventDefault();
            const v = Math.round(num(f.ml.value) || 0);
            if (v < 20 || v > 3000) return toast('Use de 20 a 3.000 ml.', true);
            closeSheet();
            somar(v);
          };
        },
      );
    }
    if (e.target.closest('#agua-lemb')) return lembretesAguaSheet(() => desenha(false));
    if (e.target.closest('#agua-desf')) {
      const u = st.reg.pop();
      if (u) {
        st.ml = Math.max(0, st.ml - u.ml);
        desenha(false);
        salvar();
      }
    }
  };
  desenha(false);
  S.cache.aguaSomar = somar;
}
// sequência de semanas com pelo menos um treino (a semana atual só conta a favor)
function semanasSeguidas(datas) {
  const sem = new Set(datas.filter(Boolean).map((d) => isoDia(inicioSemana(new Date(d)))));
  let k = isoDia(inicioSemana()),
    n = 0;
  if (!sem.has(k)) k = somaDias(k, -7);
  while (sem.has(k)) {
    n++;
    k = somaDias(k, -7);
  }
  return n;
}

async function alunoHoje() {
  loading();
  const hoje = isoDia(new Date());
  const [treinos, sessoes, , planoSem, cobP, corrSem, provaProx, semNota] = await Promise.all([
    buscarTreinosDoAluno(S.user.id),
    buscarSessoes(S.user.id, 40),
    contarMsgNovas(),
    buscarPlano(S.user.id, hoje, isoDia(Date.now() + 13 * 864e5)).catch(() => []),
    minhaCobrancaPendente().catch(() => null),
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,plano_id,titulo,elevacao_m,fc_media,cadencia,rota')
      .eq('aluno_id', S.user.id)
      .gte('data', isoDia(Date.now() - 8 * 864e5))
      .then((r) => (r.data || []).filter(ehCorr))
      .catch(() => []),
    sb
      .from('nx_participacoes')
      .select('*')
      .eq('aluno_id', S.user.id)
      .gte('data', hoje)
      .order('data')
      .limit(1)
      .then((r) => (r.data || [])[0] || null)
      .catch(() => null),
    // corridas que chegaram do relógio sem o check-in (esforço/dor)
    sb
      .from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,fonte,titulo,comentario')
      .eq('aluno_id', S.user.id)
      .is('rpe', null)
      .gte('data', isoDia(Date.now() - 3 * 864e5))
      .order('data', { ascending: false })
      .limit(1)
      .then((r) => (r.data || [])[0] || null)
      .catch(() => null),
  ]);
  const histDatas = await sb
    .from('nx_corridas')
    .select('data')
    .eq('aluno_id', S.user.id)
    .gte('data', isoDia(Date.now() - 120 * 864e5))
    .then(
      (r) => (r.data || []).map((x) => x.data),
      () => [],
    );
  const corrNova = corrSem
    .filter(
      (c) =>
        c.distancia_m &&
        Date.now() - new Date(c.data) < 864e5 &&
        !(() => {
          try {
            return localStorage.getItem('nx-card-' + c.id);
          } catch {
            return 1;
          }
        })(),
    )
    .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  corrSem.splice(0, corrSem.length, ...corrSem.filter((c) => isoDia(c.data) >= isoDia(inicioSemana())));
  const corrHoje = corrSem.filter((c) => isoDia(c.data) === hoje);
  const perfC = perfilCorrida(S.me);
  dockAluno();
  const ativos = treinos.filter((t) => t.ativo);
  const ativSem = [...sessoes, ...corrSem.map((c) => ({ iniciado_em: c.data }))];
  let prox = null;
  const forcaLib = await sb
    .from('nx_forca_semanas')
    .select('id')
    .eq('aluno_id', S.user.id)
    .eq('semana', isoDia(inicioSemana()))
    .maybeSingle()
    .then((r) => !!r.data)
    .catch(() => false);
  const [movHj, avulHj] = forcaLib
    ? await Promise.all([
        buscarMovidos(S.user.id, isoDia(inicioSemana())),
        buscarAvulsos(S.user.id, isoDia(inicioSemana())),
      ])
    : [[], []];
  const doDiaM = forcaLib
    ? ativos.filter((t) => treinoNoDia(t, dsemIdx(hoje), movHj, isoDia(inicioSemana()), avulHj))
    : [];
  let fixoHoje = false;
  if (doDiaM.length) {
    prox =
      doDiaM.find((t) => !sessoes.some((s) => s.treino_id === t.id && isoDia(s.iniciado_em) === hoje)) || doDiaM[0];
    fixoHoje = true;
  }
  // só mostra musculação no Hoje quando há treino marcado para este dia (sem “próximo da sequência”)
  const fC = faz('corrida'),
    fM = faz('musculacao');
  if (!fM) prox = null;
  const muscHoje = sessoes.find((s) => isoDia(s.iniciado_em) === hoje);
  const offCorr = fC && planoSem.some((p) => p.data === hoje && p.tipo === 'folga');
  const offForca = fM && forcaLib && (dispDe(S.me).off_forca || []).includes(dsemIdx(hoje));
  if (offForca) prox = null;
  const corrDoDia = fC ? planoSem.filter((p) => p.data === hoje && !semCorrida(p)) : [];
  const forcaHoje = fC ? planoSem.find((p) => p.data === hoje && p.tipo === 'forca') : null;
  const proxCorr = fC ? planoSem.find((p) => p.data > hoje && !semCorrida(p)) : null;
  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const cardCorr = (p) => {
    const feito = corrSem.find((c) => c.plano_id === p.id);
    const est = estruturaDe(p);
    return `<div class="card corr-home ${feito ? 'feito' : ''}"><div class="row between" style="gap:8px"><span class="eyebrow">${icCorr(S.me)} Corrida</span>${feito ? `<span class="tag ok">✓ ${isoDia(feito.data) < p.data ? 'antecipada' : 'feita'}</span>` : ''}</div>
      <div class="h3" style="margin-top:4px">${esc(p.titulo || nomeTipo(p.tipo))}</div>
      <div style="margin:8px 0 6px">${perfilHTML(est, perfC, true)}</div>
      ${
        est.length
          ? (() => {
              const t = estimaTotal(est, perfC);
              return `<div class="kv-t"><div><span>Tipo</span><b>${esc(nomeTipo(p.tipo))}</b></div><div><span>Distância</span><b>${t.soDist ? '' : '≈ '}${t.km.replace('–', ' a ')}</b></div><div><span>Duração</span><b>${(() => {
                const tt = estimaTotalSeg(est, perfC);
                return tt[0] === tt[1] ? tempoAsp(tt[0]) : `${tempoAsp(tt[0])} a ${tempoAsp(tt[1])}`;
              })()}</b></div></div>
      <ul class="linhas-t">${linhasTreino(est, perfC)}</ul>`;
            })()
          : ''
      }
      ${p.descricao ? `<p class="obs-t"><b>Obs. do treinador:</b> ${esc(p.descricao)}</p>` : ''}
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">${feito ? `<a class="btn ghost sm" href="#/corrida/${feito.id}">Ver minha corrida</a>` : `<a class="btn sm" href="#/gps/${p.id}">${I.play} Treinar pelo celular</a><button class="btn ghost sm" data-reg="${p.id}">${I.plus} Registrar</button>`}<button class="btn ghost sm" data-ver="${p.id}">Ver passos</button></div></div>`;
  };
  const cardMusc = prox
    ? muscHoje
      ? `<div class="card wcard feito" style="display:flex"><div class="wletter">✓</div><div class="grow"><span class="eyebrow">Musculação</span><div class="h3" style="margin-top:2px">${esc(muscHoje.treino_titulo || 'Treino')} feito</div><div class="small muted">${fixoHoje ? 'Bom trabalho! Treino do dia concluído.' : 'Próximo da sequência: ' + esc(prox.titulo)}</div></div></div>`
      : `<a class="card tap wcard" href="#/treino/${prox.id}" style="display:flex"><div class="wletter">${esc(letraTreino(prox, ativos.indexOf(prox)))}</div><div class="grow"><span class="eyebrow">Musculação · ${fixoHoje ? 'treino de hoje' : 'próximo da sequência'}</span><div class="h3" style="margin-top:2px">${esc(prox.titulo)}</div>${prox.foco ? `<div class="small muted">${esc(prox.foco)}</div>` : ''}<div class="meta"><span class="tag">${prox.nx_treino_itens.length} exercícios</span></div></div><span class="go">${I.play}</span></a>`
    : '';
  const descanso = !corrDoDia.length && !cardMusc && !forcaHoje;
  const resumoDia = (() => {
    if (descanso) return 'Dia de descanso.';
    const itens = [
      ...corrDoDia.map((p) => ({ n: p.titulo || nomeTipo(p.tipo), ok: !!corrSem.find((c) => c.plano_id === p.id) })),
      ...(prox && fixoHoje ? [{ n: prox.titulo + ' (força)', ok: !!muscHoje }] : []),
      ...(forcaHoje ? [{ n: 'força', ok: false }] : []),
    ];
    if (!itens.length) return 'Sem treino marcado para hoje.';
    if (itens.every((x) => x.ok)) return itens.length > 1 ? 'Treinos do dia concluídos.' : 'Treino do dia concluído.';
    const falta = itens.filter((x) => !x.ok).map((x) => x.n);
    return (itens.some((x) => x.ok) ? 'Falta hoje: ' : 'Hoje: ') + falta.join(' + ') + '.';
  })();
  const seq = semanasSeguidas([...sessoes.map((x) => x.iniciado_em), ...histDatas]);
  const kmSem = corrSem.reduce((a, c) => a + (+c.distancia_m || 0), 0) / 1000;
  const nTreinosSem = ativSem.filter((x) => isoDia(x.iniciado_em) >= isoDia(inicioSemana())).length;
  const minTreinoHoje =
    (corrDoDia.length
      ? corrDoDia.reduce((a, p) => {
          const tt = estimaTotalSeg(estruturaDe(p), perfC);
          return a + (tt[0] + tt[1]) / 2 / 60;
        }, 0)
      : 0) + (prox ? 60 : 0);
  const prev5 = fC && perfC.vdot ? tempoPorVdot(perfC.vdot, 5000) : null;
  const pend = [
    cartaoCobrancaHTML(cobP),
    semNota
      ? `<button class="list-item msg-row termo-row" id="termo-corr" style="width:100%;text-align:left"><span class="ativ-ic">${icCorr(S.me)}</span><div class="grow"><b>Como foi ${comArtigo(semNota)} de ${isoDia(semNota.data) === hoje ? 'hoje' : isoDia(semNota.data) === isoDia(Date.now() - 864e5) ? 'ontem' : fmtDiaSem(isoDia(semNota.data)).split(',')[0].toLowerCase()}?</b><div class="small muted">${resumoAtiv(semNota)} · leva 10 segundos responder</div></div>${I.chev}</button>`
      : '',
    S.cache.msgNovas
      ? `<a class="list-item msg-row" href="#/conversa"><span class="ativ-ic">${I.feed}</span><div class="grow"><b>${S.cache.msgNovas === 1 ? 'Nova mensagem' : S.cache.msgNovas + ' novas mensagens'} do treinador</b><div class="small muted">Toque para ler e responder</div></div><i class="cv-n">${S.cache.msgNovas}</i></a>`
      : '',
    cartaoPushHTML(),
    !S.me.foto_url && !(Date.now() < (+store.get('nx-foto-adiada') || 0))
      ? `<div class="list-item" id="foto-pend" style="align-items:flex-start"><span class="ativ-ic">${I.cam}</span><div class="grow"><b>Coloque sua foto</b><div class="small muted">Assim seu treinador e a equipe reconhecem você.</div><div class="row" style="gap:12px;margin-top:10px"><button class="btn sm" id="foto-env">Enviar foto</button><button class="link-btn small" id="foto-x">Agora não</button></div></div></div>`
      : '',
  ]
    .filter(Boolean)
    .join('');
  $app.innerHTML = `
    <div class="top"><div class="top-brand"><img src="${LOGO.s()}" alt=""></div><div class="top-acoes">${sinoHTML()}<a class="perfil-btn" href="#/perfil">${I.user}<span>Editar perfil</span></a></div></div>
    <div id="cham-ativa"></div>
    <section class="hoje-hero">
      <div class="hh-top"><span class="hh-data">${fmtDiaSem(hoje)}</span><div class="row" style="gap:8px"><a class="hh-btn" href="#/conversa" aria-label="Falar com o treinador">${I.feed}${S.cache.msgNovas ? `<i>${S.cache.msgNovas}</i>` : ''}</a><a class="top-foto" href="#/perfil" aria-label="Meu perfil">${fotoHTML(S.me)}</a></div></div>
      <h1>${saud}, ${esc(firstName(S.me.nome) || 'atleta')}</h1>
      <p>${resumoDia}</p><p class="hh-agua" id="hh-agua" hidden></p>
      <div class="hh-stats">
        <div><span class="hh-ic fogo">${FOGO_IC}</span><span><b>${seq}</b> ${seq === 1 ? 'semana' : 'semanas'}<small>em sequência</small></span></div>
        ${fC ? `<div><span class="hh-ic">${icCorr(S.me)}</span><span><b>${kmSem ? f1(kmSem) : '0'}</b> km<small>nesta semana</small></span></div>` : `<div><span class="hh-ic">${FORCA_IC}</span><span><b>${nTreinosSem}</b> ${nTreinosSem === 1 ? 'treino' : 'treinos'}<small>nesta semana</small></span></div>`}
      </div>
    </section>
    <div class="hoje-grid"><div class="hoje-main">
    ${S.me.sexo === 'F' ? faseVidaCardHTML(S.me, false) : ''}
    ${fC ? '<div id="calor-hoje"></div>' : ''}
    <div id="momentos" class="stack mom-box"></div>
    <div id="pend-sec" ${pend ? '' : 'hidden'}><p class="sec-lbl">A preencher <i></i></p><div class="stack" id="pend"><div id="falta-pend"></div><div id="pront-pend"></div><div id="ck-pend"></div>${pend}<div id="auto-hoje"></div><div id="rel-pend"></div><div id="reav-pend"></div><div id="sat-pend"></div></div></div>
    <div id="desafio-box"></div>
    <div id="meta-hoje"></div>
    <p class="sec-lbl">${descanso ? 'Hoje' : 'Treino de hoje'}</p>
    <div class="stack">
      ${forcaHoje ? `<div class="card wcard dia-forca" style="display:flex"><div class="wletter fo">${FORCA_IC}</div><div class="grow"><span class="eyebrow">Definido pelo treinador</span><div class="h3" style="margin-top:2px">Hoje é dia de força</div><div class="small">${forcaHoje.descricao ? esc(forcaHoje.descricao) : 'Treino de força por sua conta. Hoje não tem corrida.'}</div></div></div>` : ''}
      ${corrDoDia.map(cardCorr).join('')}
      ${cardMusc}
      ${descanso ? `<div class="card wcard dayoff" style="display:flex"><div class="wletter off">${OFF_IC}</div><div class="grow"><span class="eyebrow">Day off${offCorr || offForca ? ' · definido pelo treinador' : ''}</span><div class="h3" style="margin-top:2px">Hoje é dia de descanso</div><div class="small muted">Recuperar também é treino. Hidrate-se, coma bem e durma bem.</div>${proxCorr ? `<div class="meta"><span class="tag">Próximo: ${esc(proxCorr.titulo || nomeTipo(proxCorr.tipo))}</span></div>` : ''}</div></div>` : ''}
    </div>
    <div id="rec-box"></div>
    <div id="agua-slot-m" class="agua-slot-m"></div>
    ${corrNova ? `<button class="card-cta" id="card-nova" style="margin-top:12px"><span class="card-cta-ic">${I.cam}</span><div class="grow" style="text-align:left"><b>Corrida de ${fmtKm(corrNova.distancia_m, 1)} registrada!</b><span class="small">Gere o card e poste no seu story</span></div>${I.chev}</button>` : ''}
    <div id="ciclo-box"></div>
    </div><div class="hoje-side">
    <p class="sec-lbl hide-desk">Seus números</p>
    <div id="agua-box" class="agua-box"></div>
    <div class="hoje-tiles">
      ${fC && provaProx ? `<a class="tile tap" href="#/eventos/minhas"><span class="tile-l">${icT(I.flag)}Próxima prova</span><b>${provaProx.data === hoje ? 'Hoje!' : `${Math.round((dia(provaProx.data) - dia(hoje)) / 864e5)} <small>${Math.round((dia(provaProx.data) - dia(hoje)) / 864e5) === 1 ? 'dia' : 'dias'}</small>`}</b><small class="ellip">${esc(provaProx.titulo)}</small></a>` : ''}
      ${prev5 ? `<a class="tile tap" href="#/historico/previsoes"><span class="tile-l">${I.hist}Previsão 5 km</span><b>${fmtDurLongo(Math.round(prev5))}</b><small>pelo seu último teste</small></a>` : ''}
      ${fM ? '<div class="tile" id="fase-tile" hidden></div>' : ''}
      ${fC ? `<a class="tile tap" href="#/planilha"><span class="tile-l">${icCorr(S.me)}Semana</span><b>${corrSem.length} <small>${corrSem.length === 1 ? 'corrida' : 'corridas'}</small></b><small>${kmSem ? f1(kmSem) + ' km' : 'nenhuma ainda'}</small></a>` : ''}
    </div>
    <div class="semana-comp" style="margin-top:12px">${freqSemanaHTML(
      ativSem.map((x) => x.iniciado_em),
      'Sua semana',
    )}</div>
    </div></div>
    <button class="fab-reg mini" id="fab-reg" aria-label="Registrar">${I.plus}</button>`;
  cartaoChamadaAtiva();
  const pendSec = document.getElementById('pend-sec');
  const mostrarPend = () => {
    if (pendSec) pendSec.hidden = !document.querySelector('#pend .card,#pend .list-item,#pend .auto-aluno');
  };
  // Check-up do Corredor enviado pelo treinador e ainda não respondido
  sb.from('nx_checkups')
    .select('id,ciclo,fase')
    .eq('aluno_id', S.user.id)
    .eq('status', 'pedido')
    .then(
      ({ data }) => {
        const b = document.getElementById('ck-pend');
        if (!b || !data || !data.length) return;
        b.innerHTML = data
          .map(
            (r) =>
              `<a class="list-item" href="#/checkup/responder/${r.id}" style="color:inherit"><span class="ativ-ic">${I.check}</span><div class="grow"><b>Check-up do Corredor</b><div class="small muted">Seu treinador enviou os testes de ${CK_NOME_FASE[r.fase]} (${esc(r.ciclo)}). Toque para ver como fazer.</div></div>${I.chev}</a>`,
          )
          .join('');
        const ps = document.getElementById('pend-sec');
        if (ps) ps.hidden = false;
      },
      () => {},
    );
  {
    const ab = document.getElementById('agua-box'),
      sm = document.getElementById('agua-slot-m');
    if (ab && sm && !matchMedia('(min-width:900px)').matches) sm.appendChild(ab);
  }
  // check-in do dia: aparece o dia todo, até a pessoa responder (o mesmo vale para os lembretes)
  {
    if (!S.staff)
      sb.from('nx_prontidao')
        .select('id')
        .eq('aluno_id', S.user.id)
        .eq('dia', hoje)
        .maybeSingle()
        .then(({ data }) => {
          const b = document.getElementById('pront-pend');
          if (!b || data) return;
          b.innerHTML = prontCardHTML();
          const ps = document.getElementById('pend-sec');
          if (ps) ps.hidden = false;
          b.querySelector('#pront-abrir').onclick = () =>
            abrirProntidao(() => {
              b.innerHTML = '';
              mostrarPend();
            });
        })
        .catch(() => {});
  }
  if (fC)
    sb.from('nx_corridas')
      .select('id,data,tipo,distancia_m,duracao_s,parciais')
      .eq('aluno_id', S.user.id)
      .lte('data', new Date(Date.now() + 864e5).toISOString())
      .order('data', { ascending: false })
      .limit(600)
      .then(({ data }) => {
        const recs = recordesDoDia(data || [], hoje),
          b = document.getElementById('rec-box');
        if (!b || !recs.length) return;
        b.innerHTML = `<div class="rec-card"><span class="rec-ic">${TROFEU_IC}</span><div class="grow"><span class="eyebrow">${recs.length > 1 ? 'Novos recordes pessoais' : 'Novo recorde pessoal'}</span>${recs.map((r) => `<div class="rec-l"><b>${r.n} em ${fmtDurLongo(r.t)}</b><small>antes ${fmtDurLongo(r.antes)} · ${fmtDurLongo(r.antes - r.t)} mais rápido</small></div>`).join('')}</div></div>`;
      })
      .catch(() => {});
  momentosHoje(document.getElementById('momentos'), perfC, provaProx).catch((e) => console.error(e));
  if (fC) calorHoje(document.getElementById('calor-hoje'), corrDoDia[0]);
  convidarTour();
  if (fC)
    processarTestes(S.me)
      .then((r) => {
        // o teste chegou: as zonas mudam quando o treinador conferir e confirmar
        const x = (r || []).find((y) => y.r);
        if (!x) return;
        try {
          if (localStorage.getItem('nx-teste-' + x.c.id)) return;
          localStorage.setItem('nx-teste-' + x.c.id, '1');
        } catch {}
        toast(`Seu ${TESTE_NOME[x.tipo] || 'teste'} chegou. Seu treinador vai conferir e atualizar as suas zonas.`);
      })
      .catch(() => {});
  montarAgua(document.getElementById('agua-box'), minTreinoHoje).catch((e) => console.error(e));
  if (fM)
    faseDaSemana(S.user.id, isoDia(inicioSemana()))
      .then((f) => {
        const t = document.getElementById('fase-tile');
        if (!t || !FASES_F[f]) return;
        const x = FASES_F[f];
        t.hidden = false;
        t.style.setProperty('--fc', x.cor);
        t.classList.add('tile-fase');
        t.innerHTML = `<span class="tile-l">${FORCA_IC}Força</span><b>${x.n}</b><small>${x.reps}</small>`;
      })
      .catch(() => {});
  if (fC)
    sb.from('nx_integracoes')
      .select('id')
      .eq('user_id', S.user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length) return;
        const b = document.getElementById('rel-pend');
        if (!b || store.get('nx-rel-pend-off', false)) return;
        b.innerHTML = `<a class="list-item msg-row" href="#/conexoes"><span class="ativ-ic">${I.hist}</span><div class="grow"><b>Conecte o seu relógio</b><div class="small muted">Garmin e outras marcas: as corridas chegam sozinhas</div></div>${I.chev}</a>`;
        mostrarPend();
      })
      .catch(() => {});
  document.getElementById('fab-reg').onclick = () =>
    openSheet(
      `<p class="eyebrow">Registrar</p><div class="stack" style="margin-top:12px">
      ${
        fC
          ? `<a class="pag-op" href="#/gps" data-close><span class="ativ-ic">${I.play}</span><div class="grow"><b>Treinar pelo celular</b><small>Na rua (GPS) ou na esteira</small></div>${I.chev}</a>
      <button class="pag-op" data-r="corr"><span class="ativ-ic">${icCorr(S.me)}</span><div class="grow"><b>Registrar uma corrida</b><small>Distância, tempo e como foi</small></div>${I.chev}</button>`
          : ''
      }
      <a class="pag-op" href="#/conversa" data-close><span class="ativ-ic">${I.feed}</span><div class="grow"><b>Falar com o treinador</b><small>Dor, dúvida ou recado</small></div>${I.chev}</a></div>`,
      (r) => {
        r.onclick = (e) => {
          if (e.target.closest('a[data-close]')) return closeSheet(true);
          const b = e.target.closest('[data-r]');
          if (!b) return;
          if (b.dataset.r === 'corr') {
            closeSheet();
            registrarCorrida(S.user.id, () => alunoHoje());
          }
        };
      },
    );
  bindCartaoPush();
  const fEnv = document.getElementById('foto-env');
  desafioCard(document.getElementById('desafio-box'));
  atualizarSino();
  metaAtual(S.user.id, S.me).then(
    (dm) => {
      const bx = document.getElementById('meta-hoje');
      if (bx && dm.meta) bx.innerHTML = metaCardHTML(dm, { compacto: true });
    },
    () => {},
  );
  pesquisaSatisfacao(document.getElementById('sat-pend'));
  // reavaliação física: avisa o aluno quando a data marcada já passou e ainda não houve avaliação nova
  sb.from('nx_avaliacoes')
    .select('data,proxima')
    .eq('aluno_id', S.user.id)
    .order('data', { ascending: false })
    .limit(1)
    .then(
      (r) => {
        const av = (r.data || [])[0],
          bx = document.getElementById('reav-pend');
        if (!bx || !av || !av.proxima || av.proxima >= hojeISO()) return;
        bx.innerHTML = `<a class="list-item" href="#/conversa" style="color:inherit"><span class="ativ-ic">${I.cal}</span><div class="grow"><b>Hora da reavaliação física</b><div class="small muted">Estava marcada para ${fmtCurto(av.proxima)}. Combine o dia com seu treinador.</div></div>${I.chev}</a>`;
        const sec = document.getElementById('pend-sec');
        if (sec) sec.hidden = false;
      },
      () => {},
    );
  faltasPendentes();
  if (fEnv) {
    fEnv.onclick = () =>
      trocarFoto(() => {
        const c = document.getElementById('foto-pend');
        if (c) c.remove();
      });
    document.getElementById('foto-x').onclick = () => {
      store.set('nx-foto-adiada', Date.now() + 7 * 864e5);
      document.getElementById('foto-pend').remove();
    };
  }
  $app.onclick = (e) => {
    const r = e.target.closest('[data-reg]');
    if (r) return registrarCorrida(S.user.id, () => alunoHoje());
    const v = e.target.closest('[data-ver]');
    if (v) {
      const p = corrDoDia.find((x) => x.id === v.dataset.ver);
      return verTreinoPlanilha(
        p,
        perfC,
        corrSem.find((c) => c.plano_id === p.id),
      );
    }
  };
  const rh = document.getElementById('reg-home');
  if (rh) rh.onclick = () => registrarCorrida(S.user.id, () => alunoHoje());
  const cn = document.getElementById('card-nova');
  if (cn)
    cn.onclick = async () => {
      let c = corrNova,
        plano = null;
      try {
        const { data: full } = await sb.from('nx_corridas').select('*').eq('id', corrNova.id).maybeSingle();
        if (full) c = full;
        if (c.plano_id)
          plano = (await sb.from('nx_plano_corrida').select('*').eq('id', c.plano_id).maybeSingle()).data || null;
      } catch {}
      abrirCardCorrida(c, plano);
    };
  const tc = document.getElementById('termo-corr');
  if (tc) tc.onclick = () => termometroCorrida(semNota, () => alunoHoje());
  let jaAvisou = true;
  try {
    jaAvisou = !!(
      semNota &&
      (localStorage.getItem('nx-pop-' + semNota.id) || sessionStorage.getItem('nx-pop-' + semNota.id))
    );
  } catch {}
  if (semNota && !jaAvisou)
    setTimeout(() => {
      if (location.hash && location.hash !== '#/') return;
      try {
        sessionStorage.setItem('nx-pop-' + semNota.id, '1');
      } catch {}
      const c = semNota;
      const quandoC =
        isoDia(c.data) === hoje
          ? 'hoje'
          : isoDia(c.data) === isoDia(Date.now() - 864e5)
            ? 'ontem'
            : fmtDiaSem(isoDia(c.data)).split(',')[0].toLowerCase();
      openSheet(
        `<div class="center"><div class="chegou-ic">${I.check}</div>
      <p class="eyebrow" style="margin-top:12px">${c.fonte === 'garmin' ? 'Treino carregado do Garmin' : 'Treino registrado'}</p>
      <div class="h2" style="margin-top:4px">${ehCorr(c) && c.tipo !== 'caminhada' ? 'Sua corrida' : c.tipo === 'caminhada' ? 'Sua caminhada' : c.tipo === 'forca' ? 'Seu treino de força' : c.tipo === 'bike' ? 'Seu pedal' : c.tipo === 'natacao' ? 'Sua natação' : 'Sua atividade'} de ${quandoC} foi concluída</div></div>
      <div class="mini-stats" style="margin-top:16px">${comDist(c) ? `<div><b>${fmtKm(c.distancia_m, 1)}</b><span>distância</span></div>` : ''}${c.duracao_s ? `<div><b>${fmtDur(c.duracao_s)}</b><span>tempo</span></div>` : ''}${comDist(c) && ehCorr(c) && c.duracao_s ? `<div><b>${fmtPace(paceDe(c))}</b><span>pace</span></div>` : ''}</div>
      <p class="small muted center" style="margin-top:16px">Quer comentar como foi o treino? Seu treinador usa isso para ajustar os próximos.</p>
      <button class="btn block" id="pop-sim" style="margin-top:16px">Comentar o treino</button>
      <button class="btn ghost block" id="pop-nao" style="margin-top:8px">Agora não</button>`,
        (r) => {
          r.querySelector('#pop-sim').onclick = () => {
            closeSheet();
            termometroCorrida(c, () => alunoHoje());
          };
          r.querySelector('#pop-nao').onclick = () => {
            try {
              localStorage.setItem('nx-pop-' + c.id, '1');
            } catch {}
            closeSheet();
          };
        },
      );
    }, 500);
  if (S.me.sexo === 'F')
    buscarCiclo(S.user.id)
      .then((c) => {
        const bx = document.getElementById('ciclo-box');
        if (!bx) return;
        if (!c) {
          if (store.get('nx_ciclo_conv', false)) return;
          bx.innerHTML = `<div class="ciclo-l ciclo-conv" style="--cf:#e85d75"><i></i><span class="grow"><b>Ciclo menstrual</b> · ajuste o treino a cada fase</span><button type="button" class="link-btn small" id="cic-at">Ativar</button><button type="button" class="link-btn small" id="cic-nao" style="color:var(--dim)">Agora não</button></div>`;
          bx.querySelector('#cic-at').onclick = () => ativarCiclo(() => alunoHoje());
          bx.querySelector('#cic-nao').onclick = () => {
            store.set('nx_ciclo_conv', true);
            bx.innerHTML = '';
          };
          return;
        }
        bx.innerHTML = cicloLinhaHTML(c, false);
        const b = bx.querySelector('.btn-ciclo');
        if (b)
          b.onclick = () => {
            location.hash = '#/ciclo';
          };
      })
      .catch(() => {});
  if (fC && planoSem.length)
    sb.from('nx_integracoes')
      .select('provedor,escopo')
      .eq('user_id', S.user.id)
      .in('provedor', ['garmin', 'intervals'])
      .then(
        ({ data }) => {
          if ((data || []).some((i) => i.provedor === 'garmin' || icuEscreve(i)))
            sincronizarGarmin(S.user.id, planoSem, perfC, false);
        },
        () => {},
      );
  const pp = document.getElementById('pagar-pix');
  if (pp) pp.onclick = () => pagarComPix(cobP);
  // oferta de cobrança automática feita pelo treinador
  assinaturaDoAluno(S.user.id)
    .then((a) => {
      const box = document.getElementById('auto-hoje');
      if (box && a) {
        box.innerHTML = autoAlunoHTML(a);
        bindAutoAluno(a);
        const ps = document.getElementById('pend-sec');
        if (ps && box.innerHTML.trim()) ps.hidden = false;
      }
    })
    .catch(() => {});
}

// check-in em dois passos: primeiro o esforço (tela cheia), depois dor, corpo e recado
function passosCheckin(root, valor) {
  const vai = (n) => {
    root.querySelector('#ck-1').hidden = n !== 1;
    root.querySelector('#ck-2').hidden = n !== 2;
    try {
      $sheet.scrollTop = 0;
      root.scrollTop = 0;
    } catch {}
  };
  root.querySelector('#ck-prox').onclick = () => {
    if (valor() == null) return toast('Arraste a barra para marcar o esforço.', true);
    vai(2);
  };
  root.querySelector('#ck-volta').onclick = () => vai(1);
}
/* check-in rápido de uma corrida que veio do relógio */
function termometroCorrida(c, depois) {
  let rpe = null,
    dor = false;
  const corpo = {};
  openSheet(
    `<div id="ck-1"><p class="eyebrow center">${resumoAtiv(c)}</p><div class="h2 center" style="margin-top:4px">Qual foi o esforço ${comArtigo(c).replace(/^a /, 'da ').replace(/^o /, 'do ')}?</div>
      ${esforcoHTML(c.rpe ?? null)}
      <button class="btn block" id="ck-prox">Próximo</button></div>
    <div id="ck-2" hidden><button type="button" class="back" id="ck-volta" style="background:none;border:0;padding:0">${I.back} Esforço</button>
    <p class="eyebrow" style="margin-top:8px">Check-in</p><div class="h2" style="margin-top:4px">E o corpo, como está?</div>
    <div style="margin-top:16px"><span class="small muted" style="font-weight:700">Sentiu alguma dor?</span>
      <div class="seg" style="margin-top:8px"><button type="button" class="on" data-dor="0">Não</button><button type="button" data-dor="1">Sim</button></div>
      <input class="input" id="dor-local" placeholder="Onde? Ex.: joelho direito" style="margin-top:12px" hidden></div>
    ${corpoHTML()}
    <label class="field" style="margin-top:16px"><span>Comentário para o treinador (opcional)</span><textarea class="textarea" id="t-coment" placeholder="Ex.: senti as pernas pesadas no fim, o calor atrapalhou">${esc(c.comentario || '')}</textarea></label>
    <button class="btn block" id="t-salvar" style="margin-top:12px">Enviar ${I.check}</button></div>`,
    (root) => {
      bindEsforco(root, (n) => {
        rpe = n;
      });
      passosCheckin(root, () => rpe);
      root.querySelectorAll('[data-dor]').forEach(
        (b) =>
          (b.onclick = () => {
            dor = b.dataset.dor === '1';
            root.querySelectorAll('[data-dor]').forEach((x) => {
              x.classList.toggle('on', x === b);
              x.classList.toggle('alert', x === b && dor);
            });
            root.querySelector('#dor-local').hidden = !dor;
          }),
      );
      bindCorpo(root, corpo);
      root.querySelector('#t-salvar').onclick = async (e) => {
        if (rpe == null) return toast('Escolha o esforço de 0 a 10.', true);
        e.currentTarget.disabled = true;
        const { error } = await sb
          .from('nx_corridas')
          .update({
            rpe,
            dor,
            dor_local: dor ? root.querySelector('#dor-local').value.trim() || null : null,
            cansaco: corpo.cansaco ?? null,
            sono: corpo.sono ?? null,
            comentario: root.querySelector('#t-coment').value.trim() || null,
            visto_treinador: false,
          })
          .eq('id', c.id);
        if (error) {
          e.currentTarget.disabled = false;
          return toast('Não foi possível salvar. Verifique a internet.', true);
        }
        try {
          localStorage.setItem('nx-pop-' + c.id, '1');
        } catch {}
        closeSheet();
        toast('Valeu! Seu treinador já vê como você está.');
        depois && depois();
      };
    },
  );
}

function sessaoCard(s, nome) {
  const d = new Date(s.iniciado_em);
  return `<div class="card hist" ${nome !== undefined ? `data-sessao="${s.id}" style="cursor:pointer"` : ''}>
    <div class="hist-date"><b>${d.getDate()}</b><span>${MESES[d.getMonth()]}</span></div>
    <div class="grow">
      ${nome ? `<div class="row" style="gap:8px">${!s.visto_treinador ? '<i class="alert-dot" title="Novo"></i>' : ''}<b class="ellip">${esc(nome)}</b></div>` : ''}
      <div class="${nome ? 'small muted' : 'h3'}">${esc(s.treino_titulo || 'Treino')}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">
        ${s.psr != null ? `<span class="rpe" style="background:${psrCor(s.psr)}">PSR ${s.psr}</span>` : ''}
        ${s.esforco != null ? `<span class="rpe" style="background:${rpeCor(s.esforco)}">Esforço ${s.esforco}</span>` : ''}
        ${s.finalizado_em ? `<span class="tag">${minutos(s.iniciado_em, s.finalizado_em)} min</span>` : ''}
        ${s.finalizado_em && s.esforco != null ? `<span class="tag">${cargaSessao(s.esforco, minutos(s.iniciado_em, s.finalizado_em))} UA</span>` : ''}
        ${FASES_F[s.fase] ? `<span class="tag" style="color:${FASES_F[s.fase].cor}">${FASES_F[s.fase].n}</span>` : ''}
        ${s.total_itens ? `<span class="tag">${s.itens_feitos.length}/${s.total_itens} exercícios</span>` : ''}
        ${s.dor ? `<span class="tag warn">Dor${s.dor_local ? ': ' + esc(s.dor_local) : ''}</span>` : ''}
        ${corpoTags(s)}
        <span class="tag">${quando(s.iniciado_em)} · ${fmtHora(s.iniciado_em)}</span>
      </div>
      ${s.comentario ? `<p class="small muted" style="margin-top:8px">“${esc(s.comentario)}”</p>` : ''}
    </div></div>`;
}

function freqSemanaHTML(datas, titulo = 'Frequência da semana') {
  const hoje = isoDia(new Date());
  const seg = inicioSemana();
  const set = new Set(datas.map((d) => isoDia(d)));
  const circ = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    const k = isoDia(d);
    return `<div class="fq-d ${set.has(k) ? 'ok' : ''} ${k === hoje ? 'hoje' : ''} ${k > hoje ? 'fut' : ''}"><i>${set.has(k) ? I.check : ''}</i><span>${'STQQSSD'[i]}</span></div>`;
  }).join('');
  const n = [...set].filter((k) => k >= isoDia(seg) && k <= hoje).length;
  return `<div class="card ov-card"><div class="row between"><b>${titulo}</b><span class="tag acc">${n} ${n === 1 ? 'dia' : 'dias'} treinados</span></div><div class="fq">${circ}</div></div>`;
}
function constanciaHTML(datas, titulo = 'Sua constância') {
  const ord = datas.map((d) => isoDia(d)).sort();
  const ult = ord[ord.length - 1];
  const dias = ult ? Math.round((dia(isoDia(new Date())) - dia(ult)) / 864e5) : null;
  const media = datas.filter((d) => diasDesde(d) < 28).length / 4;
  const st =
    dias == null
      ? ['Comece hoje', 'acc']
      : dias > 21
        ? ['Hora de voltar', 'err']
        : dias > 7
          ? ['Bora retomar', 'warn']
          : ['Em dia', 'ok'];
  return `<div class="card ov-card"><div class="row between"><b>${titulo}</b><span class="tag ${st[1]}">${st[0]}</span></div>
    <div class="ov-num"><div><span>Último treino</span><b>${dias == null ? '–' : dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}</b></div><div><span>Média</span><b>${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x por semana</b></div></div></div>`;
}

/* ================= LEITURA DO TEMPO (aluno que corre) =================
   Uma leitura calma do tempo, como a Leitura Nexos: mostra o calor de agora, o melhor horário e uma sugestão.
   Só pede cuidado de verdade quando o calor está alto para a região.
   - Índice de calor: WBGT estimado (o índice usado no esporte) = 0,7 × bulbo úmido + 0,2 × globo + 0,1 × temperatura.
     Bulbo úmido pela fórmula de Stull (2011); o globo soma o efeito do sol pela radiação prevista da hora.
   - Faixas pela adaptação de quem vive na região (Grundstein et al. 2015, guias regionais de WBGT usados no esporte):
     quem mora em lugar quente e úmido, como São Luís, está adaptado e tem limites mais altos que quem mora em BH.
   - Cidade: a que o aluno escolheu ou a do início da última corrida com GPS (o banco acha o município do IBGE);
     para o serviço de clima vai só o centro do município, nunca o ponto da corrida. Previsão do Open-Meteo. */
const CALOR_PADRAO = { nome: 'São Luís', uf: 'MA', lat: -2.53874, lon: -44.2825, origem: 'padrao' };
const CALOR_NIVEIS = [
  { k: 'baixo', nome: 'Tranquilo' },
  { k: 'atencao', nome: 'Atenção' },
  { k: 'moderado', nome: 'Moderado' },
  { k: 'alto', nome: 'Alto' },
  { k: 'extremo', nome: 'Extremo' },
];
// limites (°C de WBGT) de cada nível por categoria de clima da região (1 mais fresca, 3 quente e úmida)
const CALOR_LIMITES = { 1: [24.5, 27.3, 29, 30.1], 2: [26.5, 29.3, 31, 32.1], 3: [27.8, 30.6, 32.3, 33.4] };
// norte e nordeste quentes e úmidos: categoria 3; o resto do país: 2; sul frio: 1
const categoriaCalor = (lat) => (lat > -16 ? 3 : lat > -25 ? 2 : 1);
const nivelCalor = (w, cat) => CALOR_NIVEIS[CALOR_LIMITES[cat].findIndex((l) => w < l) + 1 || 4];
const TIPOS_FORTES = ['ritmo', 'intervalado', 'tiros', 'fartlek', 'longao', 'prova', 'teste'];
function bulboUmido(t, ur) {
  return (
    t * Math.atan(0.151977 * Math.sqrt(ur + 8.313659)) +
    Math.atan(t + ur) -
    Math.atan(ur - 1.676331) +
    0.00391838 * Math.pow(ur, 1.5) * Math.atan(0.023101 * ur) -
    4.686035
  );
}
function wbgtDe(t, ur, sol) {
  const tw = bulboUmido(t, Math.min(99, Math.max(5, ur)));
  const tg = t + Math.min(12, Math.max(0, sol || 0) * 0.0125); // globo: o sol esquenta o corpo além do ar
  return 0.7 * tw + 0.2 * tg + 0.1 * t;
}
async function localCalor() {
  const { data } = await sb.rpc('nx_cidade_calor').then(
    (r) => r,
    () => ({ data: null }),
  );
  return data && data.lat != null ? data : CALOR_PADRAO;
}
async function previsaoCalor(loc) {
  const ch = `nx-calor-${loc.lat},${loc.lon}-${new Date().toISOString().slice(0, 13)}`;
  try {
    const c = sessionStorage.getItem(ch);
    if (c) return JSON.parse(c);
  } catch {}
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,wind_speed_10m,shortwave_radiation&forecast_days=2&timezone=auto`,
  );
  if (!r.ok) throw new Error('clima');
  const h = (await r.json()).hourly || {};
  const horas = (h.time || []).map((t, i) => {
    const temp = h.temperature_2m[i],
      ur = h.relative_humidity_2m[i];
    return {
      t, // hora local da cidade, "AAAA-MM-DDTHH:00"
      temp,
      ur,
      sens: h.apparent_temperature[i],
      uv: h.uv_index[i],
      vento: h.wind_speed_10m[i],
      w: temp != null && ur != null ? wbgtDe(temp, ur, (h.shortwave_radiation || [])[i]) : null,
    };
  });
  try {
    sessionStorage.setItem(ch, JSON.stringify(horas));
  } catch {}
  return horas;
}
const CALOR_LEITURA = {
  baixo: 'Tempo bom para treinar. Hidratação de sempre.',
  atencao:
    'Um pouco mais quente que o ideal. Corra pela zona de frequência cardíaca do seu teste: o ritmo pode sair alguns segundos mais lento, e isso é normal no calor. Em treino de mais de 1 hora, leve água.',
  moderado:
    'Calor moderado. Se puder, prefira o horário mais fresco e siga a frequência cardíaca da zona. Em treino longo, leve água.',
  alto: 'Calor alto para treino forte. O ideal é treinar no horário mais fresco; se não der, mantenha a frequência cardíaca da zona, aceite o ritmo mais lento e faça pausas para beber água.',
  extremo:
    'Calor muito alto. Treino forte fica melhor em outro horário ou outro dia; se for correr, que seja leve e curto. Se tiver dúvida, fale com o seu treinador.',
};
function calorCardHTML(loc, horas, treino) {
  const cat = categoriaCalor(loc.lat);
  const hojeL = horas[0] ? horas[0].t.slice(0, 10) : '';
  const agoraH = new Date().getHours();
  const hora = (x) => +x.t.slice(11, 13);
  const doDia = horas.filter((x) => x.t.slice(0, 10) === hojeL && x.w != null);
  const janela = doDia.filter((x) => hora(x) >= 5 && hora(x) <= 20);
  const agora = doDia.find((x) => hora(x) === agoraH) || janela[0];
  if (!agora) return '';
  const resto = janela.filter((x) => hora(x) >= agoraH);
  const base = resto.length ? resto : janela;
  const melhor = base.reduce((a, b) => (b.w < a.w ? b : a));
  const nv = nivelCalor(agora.w, cat),
    nvM = nivelCalor(melhor.w, cat);
  const hh = (x) => `${hora(x)}h`;
  const cidade = `${loc.nome}${loc.uf ? ` (${loc.uf})` : ''}`;
  const forte = treino && TIPOS_FORTES.includes(treino.tipo);
  // a leitura parte do melhor horário que ainda dá para treinar (é quando a pessoa deve correr)
  const nvLeitura = resto.length ? nvM : nv;
  if (store.get('nx-calor-oculto', '') === hojeL)
    return `<div class="card calor-card calor-${nv.k} cal-mini"><div class="grow" style="min-width:0"><span class="eyebrow">Leitura do tempo · ${esc(cidade)}</span><b>${nv.nome} agora${resto.length ? ` · melhor horário ${hh(melhor)}` : ''}</b></div><button type="button" class="link-btn small" data-cal-tg="mostrar">Mostrar</button></div>`;
  const barras = janela
    .map((x) => {
      const n = nivelCalor(x.w, cat),
        h = hora(x);
      return `<div class="cal-h${h === agoraH ? ' ag' : ''}${h < agoraH ? ' pas' : ''}"><i class="cal-${n.k}" style="height:${Math.max(16, Math.min(100, ((x.w - 18) / 17) * 100))}%"></i><span>${h % 3 === 2 ? h + 'h' : ''}</span></div>`;
    })
    .join('');
  const avisoTreino =
    forte && ['alto', 'extremo'].includes(nvLeitura.k)
      ? ' É um treino forte num dia de calor alto: faça no horário mais fresco e siga a frequência cardíaca da zona.'
      : '';
  return `<div class="card calor-card calor-${nv.k}"><div class="cal-top"><span class="eyebrow">Leitura do tempo · ${esc(cidade)}</span><button type="button" class="link-btn small" data-cal-tg="ocultar">Ocultar</button></div>
    <div class="cal-main"><div class="cal-sel cal-${nv.k}"><small>Calor agora</small><b>${nv.nome}</b></div>
      <div class="cal-num"><div><span>Temperatura</span><b>${Math.round(agora.temp)}°</b></div><div><span>Sensação</span><b>${Math.round(agora.sens)}°</b></div><div><span>Umidade</span><b>${Math.round(agora.ur)}%</b></div></div></div>
    ${resto.length ? `<p class="cal-melhor">Melhor horário para correr hoje: <b>${hh(melhor)}</b> (${nvM.nome.toLowerCase()})</p>` : '<p class="cal-melhor">Amanhã cedo costuma ser o horário mais fresco.</p>'}
    <div class="cal-graf" aria-label="Calor por hora, das 5h às 20h">${barras}</div>
    <p class="small cal-dica">${treino ? `<b>${esc(treino.titulo || 'Treino de hoje')}:</b> ` : ''}${CALOR_LEITURA[nvLeitura.k]}${avisoTreino}</p>
    <details class="cal-mais"><summary>Ver mais</summary>
      <div class="cal-det" style="margin-top:8px"><div><span>Índice de calor</span><b>${f1(agora.w)}°</b></div><div><span>Índice UV</span><b>${agora.uv != null ? f1(agora.uv) : '–'}</b></div><div><span>Vento</span><b>${agora.vento != null ? Math.round(agora.vento) + ' km/h' : '–'}</b></div></div>
      <p class="sec-lbl">No calor</p><ul class="cal-lista"><li>Beba água ao longo do dia e leve água em treinos de mais de 1 hora.</li><li>Roupa clara e leve; boné e protetor solar se houver sol.</li><li>Tontura, náusea, dor de cabeça forte ou arrepio no calor: pare, vá para a sombra e se refresque.</li><li>O corpo se adapta ao calor em cerca de 10 a 14 dias treinando nele. Se você viajou de um lugar mais frio, vá com mais calma.</li></ul>
      <p class="sec-lbl">Como é feita esta leitura</p><p class="tiny dim">O índice de calor estima o WBGT, a medida usada no esporte, a partir da temperatura, da umidade e do sol previstos para cada hora. Os níveis levam em conta que quem mora na região já está adaptado ao clima dela (guias regionais de calor para o esporte, Grundstein e colegas, 2015). Cidade: ${loc.origem === 'escolhido' ? 'a que você escolheu' : loc.origem === 'corrida' ? 'a da sua última corrida com GPS' : 'São Luís, porque ainda não há corrida com GPS'}. Só a cidade é usada, nunca o local exato da corrida. Previsão do Open-Meteo.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn ghost sm" data-cal-loc="aqui">Usar minha localização atual</button>${loc.origem === 'escolhido' ? '<button type="button" class="link-btn small" data-cal-loc="auto">Voltar para a cidade da última corrida</button>' : ''}</div>
    </details></div>`;
}
async function calorHoje(el, treino) {
  if (!el) return;
  try {
    const loc = await localCalor();
    const horas = await previsaoCalor(loc);
    if (!document.body.contains(el)) return;
    el.innerHTML = calorCardHTML(loc, horas, treino);
    el.onclick = async (e) => {
      const tg = e.target.closest('[data-cal-tg]');
      if (tg) {
        store.set('nx-calor-oculto', tg.dataset.calTg === 'ocultar' ? (horas[0] || { t: '' }).t.slice(0, 10) : '');
        el.innerHTML = calorCardHTML(loc, horas, treino);
        return;
      }
      const lb = e.target.closest('[data-cal-loc]');
      if (!lb) return;
      const salvar = async (lat, lon) => {
        const { data, error } = await sb.rpc('nx_local_clima_salvar', { p_lat: lat, p_lon: lon });
        if (error) return toast('Não foi possível salvar a localização.', true);
        S.me.local_clima = data;
        calorHoje(el, treino);
      };
      if (lb.dataset.calLoc === 'auto') return salvar(null, null);
      if (!navigator.geolocation) return toast('Este aparelho não informa a localização.', true);
      lb.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (p) => salvar(p.coords.latitude, p.coords.longitude),
        () => {
          lb.disabled = false;
          toast('Localização não permitida. Libere a localização para o app nas configurações do celular.', true);
        },
        { maximumAge: 3600e3, timeout: 15000 },
      );
    };
  } catch {
    el.innerHTML = '';
  }
}
