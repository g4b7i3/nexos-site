/* Nexos App · Marcas de relógio e Garmin Connect.
   Parte 21 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- marcas de relógio: Garmin pela API oficial; as outras pelo Intervals.icu ---------- */
const MARCAS = [
  ['garmin', 'Garmin'],
  ['coros', 'Coros'],
  ['polar', 'Polar'],
  ['suunto', 'Suunto'],
  ['wahoo', 'Wahoo'],
  ['amazfit', 'Amazfit'],
  ['outro', 'Outro relógio'],
];
const MARCA_NOME = Object.fromEntries(MARCAS);
// logo oficial se o arquivo existir em icons/marcas/<marca>.png; senão, o nome da marca
const marcaLogo = (k, nome) =>
  k === 'outro'
    ? `<span class="marca-txt outro">${I.plus}<small>${nome}</small></span>`
    : `<img class="marca-img" src="icons/marcas/${k}.png" alt="${nome}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'marca-txt',textContent:'${nome}'}))">`;
function abrirMarca(k, garm, integ, marcaInt, recarregar) {
  const nome = MARCA_NOME[k];
  const fechar = () => {
    closeSheet();
    recarregar();
  };
  if (k === 'garmin') {
    openSheet(
      `<div class="marca-topo">${marcaLogo(k, nome)}</div><div class="h2" style="margin-top:12px">Garmin</div>
      ${integ && !garm ? `<p class="aviso-dup">Você já conectou um relógio pelo Intervals.icu. Se esse relógio também for Garmin, use só uma das conexões para as corridas não entrarem duas vezes.</p>` : ''}
      <div id="m-box" style="margin-top:12px">${garminCardHTML(garm, false)}</div>`,
      (r) => bindGarmin(r.querySelector('#m-box'), fechar),
    );
    return;
  }
  if (k === 'outro') {
    openSheet(
      `<div class="h2">Outro relógio</div><p class="small muted" style="margin-top:6px">Apple Watch, Samsung, Xiaomi ou app de celular: envie o arquivo da corrida ou digite os dados.</p>
      <button class="btn block" id="m-arq" style="margin-top:16px">${I.plus} Registrar uma corrida</button>
      <p class="tiny dim" style="margin-top:12px"><b>Apple Watch:</b> o app HealthFit (iPhone) exporta a corrida em .FIT. <b>Amazfit:</b> conecte pelo botão Amazfit, que as corridas entram sozinhas.</p>`,
      (r) => {
        r.querySelector('#m-arq').onclick = () => {
          closeSheet();
          registrarCorrida(S.user.id, (id) => {
            location.hash = '#/corrida/' + id;
          });
        };
      },
    );
    return;
  }
  const ligado = integ && (!marcaInt || marcaInt === k);
  openSheet(
    `<div class="marca-topo">${marcaLogo(k, nome)}</div><div class="h2" style="margin-top:12px">${nome}</div>
    ${garm ? `<p class="aviso-dup">Você já conectou um Garmin. Se for usar o ${nome}, desconecte o Garmin para as corridas não entrarem duas vezes.</p>` : ''}
    ${
      ligado
        ? `<div id="m-box" style="margin-top:12px">${intervalsCardHTML(integ, false).replace('Intervals.icu conectado ✓', `${nome} conectado ✓ <span class="tiny dim">pelo Intervals.icu</span>`)}</div>`
        : integ
          ? `<p class="aviso-dup">Você já tem um relógio conectado pelo Intervals.icu. Para trocar para o ${nome}, conecte o ${nome} lá no Intervals (Configurações → Conexões). As corridas dele já vão chegar por esta mesma conexão.</p>`
          : `<p class="small muted" style="margin-top:6px">O ${nome} chega ao app pelo <b>Intervals.icu</b>, um site gratuito que recebe as corridas do seu relógio. É só fazer uma vez:</p>
      <ol class="passos-marca">
        <li>Crie uma conta grátis no <a href="https://intervals.icu" target="_blank" rel="noopener">intervals.icu</a> (pode entrar com o Google).</li>
        <li>Lá, abra <b>Configurações → Conexões</b> e conecte o seu <b>${nome}</b>.${k === 'amazfit' ? ' Ele entra com a sua conta do app <b>Zepp</b>; abra o Zepp no celular antes, para sincronizar.' : ''}</li>
        <li>Volte aqui e toque no botão abaixo para autorizar.</li></ol>
      <div id="m-box"><button class="btn block" id="int-on">Conectar ${nome}</button></div>
      <p class="tiny dim" style="margin-top:8px">Depois de conectado, cada corrida nova entra no app com gráficos, voltas, zonas e mapa.</p>`
    }`,
    (r) => {
      const on = r.querySelector('#int-on');
      if (on)
        on.addEventListener(
          'click',
          () => {
            try {
              localStorage.setItem('nx-marca', k);
            } catch {}
          },
          true,
        );
      const box = r.querySelector('#m-box');
      if (box) bindIntervals(box, integ, false, S.user.id, fechar);
    },
  );
}

/* ---------- Garmin Connect (conexão oficial) ---------- */
const RELOGIO_IC =
  '<svg class="rel-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 9.5V12l1.5 1.5"/></svg>';
/** converte um treino da planilha para o formato de passos enviado ao Garmin */
function garminItem(p, perfil) {
  const est = estruturaDe(p);
  if (!est.length) return null;
  const INT = { aq: 'WARMUP', dq: 'COOLDOWN', rc: 'RECOVERY', co: 'INTERVAL', ca: 'RECOVERY', lv: 'ACTIVE' };
  const conv = (s, emSerie) => {
    const zi = ZONAS_INFO[s.z] || ZONAS_INFO.leve;
    const [pmin, pmax] = (perfil && perfil.pse) || alvoLivre(s) ? [null, null] : faixaZona(s.z, perfil); // todo passo leva a faixa de pace como alvo (no modo adaptação, sem alvo)
    return {
      int: s.k === 'co' && !emSerie ? 'ACTIVE' : INT[s.k] || 'ACTIVE',
      dur: s.med === 'min' ? 'TIME' : 'DISTANCE',
      valor: s.med === 'km' ? s.v * 1000 : s.med === 'm' ? s.v : s.v * 60,
      pmin: pmin && Math.round(pmin),
      pmax: pmax && Math.round(pmax),
      nota: alvoLivre(s)
        ? `${PASSOS[s.k]} · ${alvoLivre(s)}`
        : pmin
          ? `${zi.z} ${zi.d} · ${fmtPace(pmin).replace('/km', '')}–${fmtPace(pmax)}`
          : `${zi.z} ${zi.d} · ${pseTxt(s.z, true)}`.slice(0, 100),
    };
  };
  const tot = estimaTotal(est, perfil);
  // o treino estruturado por escrito, na mesma ordem do app (aparece no Garmin Connect)
  const NOMES = {
    aq: 'Aquecimento',
    co: 'Corrida',
    rc: 'Recuperação',
    ca: 'Caminhada',
    lv: 'Livre',
    dq: 'Desaquecimento',
  };
  const linhaPasso = (x) => {
    if (alvoLivre(x)) return `${NOMES[x.k]} ${medTxt(x)} · ${alvoLivre(x)}`;
    const zi = ZONAS_INFO[x.z] || ZONAS_INFO.leve;
    const [a, b] = perfil && perfil.pse ? [null, null] : faixaZona(x.z, perfil);
    return `${NOMES[x.k] || 'Corrida'} ${medTxt(x)} · ${zi.z} ${zi.d}${a && b ? ` (${fmtPace(a).replace('/km', '')}–${fmtPace(b)})` : perfil && perfil.pse ? ` (${pseTxt(x.z, true)})` : ''}`;
  };
  const estruturaTxt = est
    .map((x, i) =>
      x.k === 'rep'
        ? `${i + 1}. Repetir ${x.n || 1}×:\n${(x.passos || []).map((y) => `   • ${linhaPasso(y)}`).join('\n')}`
        : `${i + 1}. ${linhaPasso(x)}`,
    )
    .join('\n');
  const montar = (sobre) =>
    [
      `TREINO\n${estruturaTxt}`,
      `Total est.: ${tot.soDist ? '' : '≈ '}${tot.km} · ${tot.soTempo ? '' : '≈ '}${tot.tempo}`,
      p.descricao ? 'Treinador: ' + p.descricao : '',
      sobre,
    ]
      .filter(Boolean)
      .join('\n\n');
  // o Garmin aceita até 500 letras: o texto sobre o tipo de treino sai primeiro se não couber
  let desc = montar(sobreTreino(p.tipo));
  if (desc.length > 500) desc = montar('');
  return {
    plano_id: p.id,
    data: p.data,
    nome: p.titulo || nomeTipo(p.tipo),
    descricao: desc,
    obs: p.descricao || '',
    passos: est.map((s) =>
      s.k === 'rep' ? { repetir: s.n || 1, passos: (s.passos || []).map((x) => conv(x, true)) } : conv(s, false),
    ),
  };
}
/** manda ao Garmin os treinos liberados (de hoje em diante) que ainda não estão lá — uma vez por sessão por aluno */
async function sincronizarGarmin(alunoId, planos, perfil, staff) {
  const chave = 'garSync:' + alunoId;
  S.cache.garSync = S.cache.garSync || {};
  const GARMIN_FMT = '2026-11-04T03:05:00Z'; // mudou o que vai para o relógio: o que foi antes disso é reenviado
  const pend = (planos || []).filter(
    (p) =>
      p.liberado !== false &&
      !semCorrida(p) &&
      p.data >= hojeISO() &&
      (!p.garmin_workout_id || (p.garmin_enviado_em && p.garmin_enviado_em < GARMIN_FMT)) &&
      estruturaDe(p).length &&
      !(S.cache.garSync[chave] || []).includes(p.id),
  );
  if (!pend.length) return 0;
  S.cache.garSync[chave] = [...(S.cache.garSync[chave] || []), ...pend.map((p) => p.id)];
  try {
    const r = await enviarGarmin(alunoId, pend, perfil);
    if (r.enviados)
      toast(
        staff
          ? `${r.enviados} treino${r.enviados > 1 ? 's' : ''} enviado${r.enviados > 1 ? 's' : ''} ao ${nomeRelogio(r)} do aluno ⌚`
          : `${r.enviados} treino${r.enviados > 1 ? 's' : ''} da sua planilha ${r.enviados > 1 ? 'foram' : 'foi'} para o seu ${nomeRelogio(r)} ⌚`,
      );
    return r.enviados || 0;
  } catch {
    return 0;
  }
}
async function enviarGarmin(alunoId, planos, perfil) {
  const itens = planos
    .filter((p) => !semCorrida(p) && p.liberado !== false && p.data >= hojeISO())
    .map((p) => garminItem(p, perfil))
    .filter(Boolean);
  if (!itens.length) return { enviados: 0 };
  return chamarGarmin({ acao: 'enviar_treinos', aluno_id: alunoId, itens });
}
function garminCardHTML(g, staff) {
  if (g)
    return `<div class="card garmin-card on"><div class="row between" style="gap:12px"><div style="min-width:0"><b>Garmin conectado ✓</b><p class="small muted">${g.erro ? `<span style="color:var(--warn)">${esc(g.erro)}</span>` : g.ultima_sync ? 'Última corrida recebida ' + quando(g.ultima_sync) + ' às ' + fmtHora(g.ultima_sync) : 'As próximas corridas do relógio chegam aqui sozinhas.'}</p></div>${staff ? '' : '<button class="link-btn small" id="gar-off">Desconectar</button>'}</div></div>`;
  if (staff)
    return '<div class="card"><p class="small muted">O aluno ainda não conectou o Garmin. Ele faz isso na aba Conexões, com um toque.</p></div>';
  return `<div class="card garmin-card"><b>Tem relógio Garmin?</b><p class="small muted" style="margin-top:4px">Conecte uma vez e cada corrida que você terminar no relógio entra sozinha aqui, já ligada ao treino do dia, com pace, frequência cardíaca, parciais e percurso.</p>
    <button class="btn sm" id="gar-on" style="margin-top:12px">Conectar Garmin</button>
    <p class="tiny dim" style="margin-top:8px">Você autoriza na tela oficial da Garmin e pode desconectar quando quiser. Só entram as atividades feitas depois da conexão.</p></div>`;
}
async function chamarGarmin(body) {
  const { data, error } = await sb.functions.invoke('nx-garmin', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let msg = 'Não foi possível falar com o Garmin agora.';
    try {
      const j = await error.context.json();
      if (j?.erro) msg = j.erro;
    } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  // sem Garmin: os treinos vão pelo Intervals.icu (calendário → relógio Coros, Amazfit, Huawei…)
  if (data?.sem_garmin && (body.acao === 'enviar_treinos' || body.acao === 'remover_treinos')) {
    const r = await chamarIntervals(body);
    return r.sem_intervals ? data : { ...r, sem_garmin: !!r.precisa_reconectar };
  }
  return data;
}
/** o relógio recebe treinos? Garmin direto, ou Intervals.icu autorizado a escrever no calendário */
const icuEscreve = (i) => !!(i && /CALENDAR:WRITE/.test(i.escopo || ''));
const nomeRelogio = (r) => (r && r.via === 'intervals' ? 'relógio' : 'Garmin');
function bindGarmin(el, recarregar) {
  const on = el.querySelector('#gar-on'),
    off = el.querySelector('#gar-off');
  if (on)
    on.onclick = async () => {
      on.disabled = true;
      try {
        const r = await chamarGarmin({ acao: 'iniciar', retorno: location.origin + location.pathname });
        if (!r.configurado) {
          on.disabled = false;
          return openSheet(
            `<div class="h2">Quase lá</div><p class="muted" style="margin:10px 0 18px">A conexão com o Garmin está aguardando a liberação final da Garmin para o app da Nexos. Assim que sair, este botão passa a funcionar. Enquanto isso, registre as corridas enviando o arquivo do relógio.</p><button class="btn block" data-close>Entendi</button>`,
          );
        }
        location.href = r.url;
      } catch (e) {
        on.disabled = false;
        toast(e.message, true);
      }
    };
  if (off)
    off.onclick = async () => {
      if (
        !confirm(
          'Desconectar o Garmin? As corridas que já chegaram continuam no app e os treinos param de ir para o relógio.',
        )
      )
        return;
      try {
        await chamarGarmin({ acao: 'desconectar' });
        toast('Garmin desconectado.');
        recarregar();
      } catch (e) {
        toast(e.message, true);
      }
    };
}
async function chamarIntervals(body) {
  const { data, error } = await sb.functions.invoke('nx-intervals', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let msg = 'Não foi possível falar com o Intervals.icu agora.';
    try {
      const j = await error.context.json();
      if (j?.erro) msg = j.erro;
    } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}
async function sincronizarIntervals(alunoId) {
  const r = await chamarIntervals({ acao: 'sync', aluno_id: alunoId });
  return r.novas || 0;
}
function bindIntervals(el, integ, staff, alunoId, recarregar) {
  const on = el.querySelector('#int-on'),
    sy = el.querySelector('#int-sync'),
    off = el.querySelector('#int-off');
  if (on)
    on.onclick = async () => {
      on.disabled = true;
      try {
        const r = await chamarIntervals({ acao: 'iniciar', retorno: location.origin + location.pathname });
        if (!r.configurado) {
          on.disabled = false;
          return openSheet(
            `<div class="h2">Quase lá</div><p class="muted" style="margin:10px 0 18px">A conexão com o Intervals.icu está aguardando a aprovação do aplicativo da Nexos pelo Intervals. Assim que for aprovada, este botão passa a funcionar. Enquanto isso, registre as corridas enviando o arquivo do relógio.</p><button class="btn block" data-close>Entendi</button>`,
          );
        }
        location.href = r.url;
      } catch (e) {
        on.disabled = false;
        toast(e.message, true);
      }
    };
  if (sy)
    sy.onclick = async () => {
      sy.disabled = true;
      sy.textContent = 'Sincronizando…';
      try {
        const n = await sincronizarIntervals(alunoId);
        toast(n ? `${n} corrida${n > 1 ? 's' : ''} nova${n > 1 ? 's' : ''}!` : 'Nenhuma corrida nova.');
        recarregar();
      } catch (e) {
        toast(e.message, true);
        sy.disabled = false;
        sy.textContent = 'Sincronizar';
      }
    };
  if (off)
    off.onclick = async () => {
      if (!confirm('Desconectar o Intervals.icu? As corridas já importadas continuam no app.')) return;
      try {
        await chamarIntervals({ acao: 'desconectar' });
        toast('Intervals.icu desconectado.');
        recarregar();
      } catch (e) {
        toast(e.message, true);
      }
    };
}
