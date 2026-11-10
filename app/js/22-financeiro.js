/* Nexos App · Financeiro: Pix, mensalidades, pagamento online e lado do aluno.
   Parte 22 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ================= FINANCEIRO: planos, mensalidades e Pix ================= */
const MESES_LONGOS = [
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
const CICLOS = [
  [1, 'Mensal'],
  [3, 'Trimestral'],
  [6, 'Semestral'],
  [12, 'Anual'],
];
const FORMAS = [
  ['pix', 'Pix'],
  ['dinheiro', 'Dinheiro'],
  ['cartao', 'Cartão'],
  ['transferencia', 'Transferência'],
];
const brl = (v) => (+v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const compDe = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const somaMes = (comp, n) => {
  const [y, m] = comp.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return compDe(d);
};
const nomeMes = (comp) => {
  const [y, m] = comp.split('-').map(Number);
  return `${MESES_LONGOS[m - 1]} ${y}`;
};
const mesesEntre = (a, b) => {
  const [y1, m1] = a.split('-').map(Number),
    [y2, m2] = b.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
};
// plano parceria (pelo nome) ou mensalidade sem valor: já nasce paga, sem cobrança, aviso nem confirmação
const ehParceria = (pl, valor) =>
  !(+valor > 0) ||
  /parceri/i.test(
    String((pl && pl.nome) || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  );
function statusCob(c) {
  if (c.forma === 'parceria') return { k: 'paga', l: 'Parceria', cls: 'ok' };
  if (c.status === 'paga') return { k: 'paga', l: 'Paga', cls: 'ok' };
  if (c.status === 'cancelada') return { k: 'cancelada', l: 'Cancelada', cls: '' };
  if (c.status === 'informada') return { k: 'informada', l: 'Avisou que pagou', cls: 'acc' };
  return c.vencimento < hojeISO()
    ? { k: 'atrasada', l: 'Atrasada', cls: 'err' }
    : { k: 'aberta', l: 'A receber', cls: 'warn' };
}
function quandoVence(c) {
  const st = statusCob(c);
  if (c.forma === 'parceria') return 'plano parceria: sem cobrança';
  if (st.k === 'paga')
    return `paga em ${fmtData(c.pago_em || c.vencimento)}${c.forma ? ' · ' + (FORMAS.find((f) => f[0] === c.forma) || [, c.forma])[1] : ''}`;
  if (st.k === 'cancelada') return 'cancelada';
  const d = Math.round((dia(c.vencimento) - dia(hojeISO())) / 864e5);
  if (d < 0) return `venceu há ${-d} dia${d < -1 ? 's' : ''}`;
  if (d === 0) return 'vence hoje';
  return `vence ${fmtData(c.vencimento + 'T12:00:00')}`;
}

/* ---------- Pix copia e cola (BR Code estático) ---------- */
const pixTexto = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,@+\-_]/g, '')
    .trim();
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function chavePix(ch) {
  ch = String(ch || '').trim();
  if (ch.includes('@')) return ch.toLowerCase();
  const d = ch.replace(/\D/g, '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ch)) return ch.toLowerCase();
  if (ch.startsWith('+')) return '+' + d;
  if (d.length === 11 && /^\d{2}9/.test(d) && !/^\d{3}\.\d{3}/.test(ch)) return '+55' + d; // celular
  return d.length >= 11 ? d : ch;
}
function pixCopiaECola({ chave, nome, cidade, valor, txid }) {
  const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const conta = f('00', 'br.gov.bcb.pix') + f('01', chavePix(chave));
  let p = f('00', '01') + f('26', conta) + f('52', '0000') + f('53', '986');
  if (valor) p += f('54', (+valor).toFixed(2));
  p +=
    f('58', 'BR') +
    f('59', pixTexto(nome).toUpperCase().slice(0, 25) || 'NEXOS') +
    f('60', pixTexto(cidade).toUpperCase().slice(0, 15) || 'SAO LUIS');
  p += f(
    '62',
    f(
      '05',
      String(txid || '***')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 25) || '***',
    ),
  );
  p += '6304';
  return p + crc16(p);
}
let qrCarregando = null;
function carregarQR() {
  if (window.qrcode) return Promise.resolve();
  if (!qrCarregando)
    qrCarregando = new Promise((ok, err) => {
      const s = document.createElement('script');
      s.src = 'qr.js';
      s.onload = ok;
      s.onerror = () => {
        qrCarregando = null;
        err(new Error('qr'));
      };
      document.head.appendChild(s);
    });
  return qrCarregando;
}
async function qrSVG(texto) {
  await carregarQR();
  const q = window.qrcode(0, 'M');
  q.addData(texto);
  q.make();
  return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

/* ---------- Pix de cada treinador (o aluno paga direto na chave do próprio treinador) ---------- */
async function meuPix(forcar) {
  if (!forcar && S.cache.meuPix !== undefined) return S.cache.meuPix || {};
  const { data } = await sb
    .from('nx_pix_treinador')
    .select('chave,nome,cidade')
    .eq('user_id', S.user.id)
    .eq('ativo', true)
    .maybeSingle()
    .then(
      (r) => r,
      () => ({ data: null }),
    );
  S.cache.meuPix = data || null;
  return data || {};
}
/* ---------- geração das mensalidades do mês ---------- */
async function carregarFinanceiroBase() {
  const [{ data: planos }, { data: alunos }, { data: fins }] = await Promise.all([
    sb.from('nx_planos').select('*').eq('org_id', S.org.id).eq('dono', S.user.id).order('valor'), // cada treinador com os próprios planos
    sb
      .from('nx_membros')
      .select('user_id,nome,ativo,telefone,treinador_id')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome'),
    sb.from('nx_alunos_fin').select('aluno_id,financeiro').eq('org_id', S.org.id), // o banco só entrega os dos próprios alunos
  ]);
  const fin = Object.fromEntries((fins || []).map((f) => [f.aluno_id, f.financeiro]));
  return {
    planos: planos || [],
    alunos: (alunos || []).filter(ehMeuAluno).map((a) => ({ ...a, financeiro: fin[a.user_id] || {} })),
  }; // financeiro de cada treinador: só os próprios alunos
}
/** grava o plano do aluno (só o treinador dele consegue) */
function salvarFinAluno(alunoId, financeiro) {
  return sb
    .from('nx_alunos_fin')
    .upsert({ aluno_id: alunoId, org_id: S.org.id, financeiro, atualizado_em: new Date().toISOString() });
}
/** a mensalidade de um aluno num mês, pelo plano dele (null se não paga neste mês).
    Paga todo mês (ou a cada 3, 6, 12 no plano trimestral, semestral, anual) desde o início até o mês em que foi encerrada. */
function cobrancaDoMes(a, comp, base) {
  const fz = a.financeiro || {};
  if (!a.ativo || !fz.plano_id) return null;
  const pl = base.planos.find((p) => p.id === fz.plano_id);
  if (!pl) return null;
  const ini = fz.inicio || comp;
  const dm = mesesEntre(ini, comp);
  if (dm < 0 || dm % (pl.meses || 1) !== 0) return null;
  if (fz.fim && comp > fz.fim) return null;
  const [y, m] = comp.split('-').map(Number);
  const diaV = Math.min(+fz.dia || 10, new Date(y, m, 0).getDate());
  const valor = fz.valor != null && fz.valor !== '' ? +fz.valor : +pl.valor;
  const parc = ehParceria(pl, valor) ? { status: 'paga', forma: 'parceria', pago_em: new Date().toISOString() } : {};
  return {
    ...parc,
    org_id: S.org.id,
    aluno_id: a.user_id,
    plano_id: pl.id,
    competencia: comp,
    descricao: `${pl.nome} · ${nomeMes(comp)}`,
    valor,
    vencimento: `${comp}-${String(diaV).padStart(2, '0')}`,
  };
}
// as cobranças de verdade são criadas até o mês seguinte; dali em diante o app só mostra as previstas
const mesComCobranca = (comp) => mesesEntre(compDe(), comp) <= 1;
async function gerarCobrancas(comp, base, soAluno) {
  if (!mesComCobranca(comp)) return 0;
  const { data: existentes } = await sb
    .from('nx_cobrancas')
    .select('aluno_id')
    .eq('org_id', S.org.id)
    .eq('competencia', comp);
  const ja = new Set((existentes || []).map((c) => c.aluno_id));
  const novas = base.alunos
    .filter((a) => (!soAluno || a.user_id === soAluno) && !ja.has(a.user_id))
    .map((a) => cobrancaDoMes(a, comp, base))
    .filter(Boolean);
  if (novas.length) await sb.from('nx_cobrancas').insert(novas);
  return novas.length;
}
/** meses à frente: as mensalidades que vão vir, pelo plano de cada aluno (nada é gravado) */
const previstasDoMes = (comp, base) =>
  base.alunos
    .map((a) => cobrancaDoMes(a, comp, base))
    .filter(Boolean)
    .map((c) => ({ ...c, id: 'prev-' + c.aluno_id, status: c.forma === 'parceria' ? 'paga' : 'prevista' }));
/** o aluno saiu ou não paga mais: ele continua no app, só fica sem mensalidade.
    As mensalidades em aberto (inclusive as atrasadas) são canceladas; as pagas ficam no histórico. */
function encerrarMensalidade(aluno, _comp, depois) {
  const fz = aluno.financeiro || {};
  const nm = esc(firstName(aluno.nome));
  openSheet(
    `<p class="eyebrow">Mensalidade</p><div class="h2" style="margin-top:4px">Deixar ${nm} sem mensalidade?</div>
    <p class="small muted" style="margin:6px 0 14px">${nm} continua no app normalmente, com treinos e tudo. Só deixa de ter mensalidade: as que estão em aberto são canceladas e não vem mais nenhuma. As já pagas ficam no histórico. Dá para voltar a cobrar depois.</p>
    <button class="btn block" id="enc-ok" style="background:var(--err);border-color:var(--err)">Encerrar mensalidade</button>
    <button class="btn ghost block" data-close style="margin-top:8px">Voltar</button>`,
    (r) => {
      r.querySelector('#enc-ok').onclick = async () => {
        const b = r.querySelector('#enc-ok');
        b.disabled = true;
        b.textContent = 'Encerrando…';
        // vale até o último mês pago; sem nenhum pago, fica sem mensalidade desde o início
        const { data: pagas } = await sb
          .from('nx_cobrancas')
          .select('competencia')
          .eq('org_id', S.org.id)
          .eq('aluno_id', aluno.user_id)
          .eq('status', 'paga')
          .order('competencia', { ascending: false })
          .limit(1)
          .then(
            (x) => x,
            () => ({ data: [] }),
          );
        const fim = (pagas && pagas[0] && pagas[0].competencia) || somaMes(fz.inicio || compDe(), -1);
        // sem plano: o aluno volta para a lista de "alunos sem plano" do Financeiro (o plano antigo fica guardado para voltar a cobrar)
        const novo = { ...fz, plano_id: null, plano_anterior: fz.plano_id || fz.plano_anterior || null, fim };
        const { error } = await salvarFinAluno(aluno.user_id, novo);
        if (error) {
          b.disabled = false;
          b.textContent = 'Encerrar mensalidade';
          return toast('Não foi possível salvar.', true);
        }
        await sb
          .from('nx_cobrancas')
          .update({ status: 'cancelada' })
          .eq('org_id', S.org.id)
          .eq('aluno_id', aluno.user_id)
          .eq('status', 'aberta')
          .then(
            () => {},
            () => {},
          );
        aluno.financeiro = novo;
        closeSheet();
        toast(`${firstName(aluno.nome)} está sem mensalidade agora. Continua no app normalmente.`);
        (depois || staffFinanceiro)();
      };
    },
  );
}
/** volta a cobrar quem tinha a mensalidade encerrada */
async function reativarMensalidade(aluno, depois) {
  const fz = { ...(aluno.financeiro || {}), inicio: compDe() };
  if (!fz.plano_id) fz.plano_id = fz.plano_anterior || null;
  delete fz.fim;
  delete fz.plano_anterior;
  if (!fz.plano_id) return toast('Escolha o plano do aluno e salve.', true);
  const { error } = await salvarFinAluno(aluno.user_id, fz);
  if (error) return toast('Não foi possível salvar.', true);
  aluno.financeiro = fz;
  await gerarCobrancas(compDe(), { ...(await carregarFinanceiroBase()) }, aluno.user_id).catch(() => 0);
  toast(`Mensalidade de ${firstName(aluno.nome)} ativa de novo, a partir deste mês.`);
  (depois || staffFinanceiro)();
}
function detalhePrevista(c, aluno) {
  openSheet(
    `<p class="eyebrow">${esc(c.descricao)}</p><div class="h2" style="margin-top:4px">${esc(aluno.nome || 'Aluno')}</div>
    <div class="cob-det"><b>${brl(c.valor)}</b><span class="tag">Prevista</span></div>
    <p class="small muted">Vence no dia ${+c.vencimento.slice(8)} de ${esc(nomeMes(c.competencia))}. A cobrança é criada sozinha um mês antes e o aluno vê no app. Ela segue todo mês até você encerrar.</p>
    <a class="btn ghost block" style="margin-top:14px" href="#/aluno/${c.aluno_id}/dados">Mudar valor ou vencimento no plano do aluno</a>
    <button class="btn ghost block" id="pv-enc" style="margin-top:8px;color:var(--err)">Encerrar mensalidade (aluno saiu)</button>`,
    (r) => {
      r.querySelector('#pv-enc').onclick = () => encerrarMensalidade(aluno, somaMes(c.competencia, -1));
    },
  );
}

/* transparência entre os treinadores: só os totais do mês de cada um, sem nomes de alunos */
function transparenciaEquipeHTML(equipe, comp) {
  const ts = (equipe || []).filter((t) => t && t.nome);
  if (ts.length < 2) return '';
  const linha = (t) =>
    `<div class="fin-eq-l"><div class="row between"><b>${esc(t.treinador_id === S.user.id ? 'Você' : t.nome.split(' ')[0])}</b><span class="small muted">${t.alunos} aluno${t.alunos === 1 ? '' : 's'} com mensalidade</span></div>
    <div class="fin-tot mini"><div class="ok"><span>Recebido</span><b>${brl(+t.recebido)}</b></div><div><span>A receber</span><b>${brl(+t.a_receber)}</b></div><div class="${+t.atrasado ? 'err' : ''}"><span>Atrasado</span><b>${brl(+t.atrasado)}</b></div></div></div>`;
  return `<div class="card fin-eq"><p class="eyebrow">Transparência da equipe · ${esc(nomeMes(comp))}</p>
    <p class="small muted">Os totais de cada treinador no mês. Os nomes dos alunos ficam só com o treinador de cada um.</p>
    ${ts.map(linha).join('')}</div>`;
}

/* ---------- tela Financeiro (treinador) ---------- */
async function staffFinanceiro() {
  loading();
  const st = S.cache.fin || (S.cache.fin = { comp: compDe(), filtro: 'todas' });
  const base = await carregarFinanceiroBase();
  await gerarCobrancas(st.comp, base);
  const [{ data: cobsT }, { data: equipe }] = await Promise.all([
    sb.from('nx_cobrancas').select('*').eq('org_id', S.org.id).eq('competencia', st.comp).order('vencimento'),
    sb.rpc('nx_fin_resumo_equipe', { p_org: S.org.id, p_comp: st.comp }),
  ]);
  const nome = Object.fromEntries(base.alunos.map((a) => [a.user_id, a]));
  const futuro = !mesComCobranca(st.comp);
  const reais = (cobsT || []).filter((c) => c.status !== 'cancelada' && nome[c.aluno_id]);
  const lista = (
    futuro
      ? [...reais, ...previstasDoMes(st.comp, base).filter((p) => !reais.some((c) => c.aluno_id === p.aluno_id))]
      : reais
  ).sort(
    (x, y) =>
      x.vencimento.localeCompare(y.vencimento) ||
      String((nome[x.aluno_id] || {}).nome || '').localeCompare(String((nome[y.aluno_id] || {}).nome || '')),
  );
  const tot = { pago: 0, aberto: 0, atraso: 0 };
  lista.forEach((c) => {
    const k = statusCob(c).k;
    if (k === 'paga') tot.pago += +c.valor;
    else if (k === 'atrasada') tot.atraso += +c.valor;
    else tot.aberto += +c.valor;
  });
  // sem plano: nunca teve plano ou teve a mensalidade encerrada
  const semPlano = base.alunos.filter((a) => {
    const fz = a.financeiro || {};
    return a.ativo && (!fz.plano_id || (fz.fim && fz.fim < compDe()));
  });
  await meuPix();
  const pix = S.cache.meuPix || {};
  const atrasadas = lista.filter((c) => statusCob(c).k === 'atrasada');
  const filtros = [
    ['todas', 'Todas'],
    ['receber', 'A receber'],
    ['atrasada', 'Atrasadas'],
    ['informada', 'Avisaram'],
    ['paga', 'Pagas'],
  ];
  const passa = (c) => {
    const k = statusCob(c).k;
    return st.filtro === 'todas' || (st.filtro === 'receber' ? k === 'aberta' : k === st.filtro);
  };
  $app.innerHTML = `
    <div class="row between"><div><p class="eyebrow">Financeiro</p><h1 class="h1">Mensalidades</h1></div><button class="icon-btn" id="fin-cfg" aria-label="Planos e Pix">${I.gear}</button></div>
    <div class="mes-nav"><button class="icon-btn sm" id="m-a" aria-label="Mês anterior">${I.back}</button><b>${nomeMes(st.comp)}</b><button class="icon-btn sm" id="m-p" aria-label="Próximo mês" style="transform:scaleX(-1)">${I.back}</button></div>
    ${futuro ? `<p class="small muted fin-prev">Mês à frente: as mensalidades aparecem como <b>previstas</b>, pelo plano de cada aluno. A cobrança de verdade é criada um mês antes e segue todo mês até você encerrar.</p>` : ''}
    <div class="fin-tot"><div class="ok"><span>Recebido</span><b>${brl(tot.pago)}</b></div><div><span>${futuro ? 'Previsto' : 'A receber'}</span><b>${brl(tot.aberto)}</b></div><div class="${tot.atraso ? 'err' : ''}"><span>Atrasado</span><b>${brl(tot.atraso)}</b></div></div>
    ${!pix.chave ? `<button class="aviso-linha" id="cfg-pix">${I.bell}<span><b>Cadastre a sua chave Pix</b> para os seus alunos pagarem pelo app.</span>${I.chev}</button>` : ''}
    ${
      !base.planos.length
        ? `<button class="aviso-linha" id="cfg-planos">${I.plus}<span><b>Crie os planos</b> (ex.: Corrida mensal R$ 150) para gerar as mensalidades.</span>${I.chev}</button>`
        : semPlano.length
          ? `<button class="aviso-linha" id="sem-plano">${I.users}<span><b>${semPlano.length} aluno${semPlano.length > 1 ? 's' : ''} sem plano</b>: defina para gerar a mensalidade.</span>${I.chev}</button>`
          : ''
    }
    <div class="row between" style="margin-top:18px;gap:10px;flex-wrap:wrap"><div class="chips" id="fin-f">${filtros.map(([k, l]) => `<button class="chip ${st.filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      ${atrasadas.length ? `<button class="btn ghost sm" id="lembrar-todos">${I.bell} Lembrar atrasados (${atrasadas.length})</button>` : ''}</div>
    <div class="stack" style="margin-top:12px" id="fin-l">${
      lista
        .filter(passa)
        .map((c) => {
          const s = statusCob(c);
          const a = nome[c.aluno_id] || {};
          if (c.status === 'prevista')
            return `<div class="list-item cob prev" data-cob="${c.id}"><div class="av">${esc(initials(a.nome))}</div><div class="grow"><b class="ellip" style="display:block">${esc(a.nome || 'Aluno')}</b><span class="small muted">vence ${fmtData(c.vencimento + 'T12:00:00')}</span></div><div class="cob-v"><b>${brl(c.valor)}</b><span class="tag">Prevista</span></div></div>`;
          return `<div class="list-item cob" data-cob="${c.id}"><div class="av">${esc(initials(a.nome))}</div><div class="grow"><b class="ellip" style="display:block">${esc(a.nome || 'Aluno')}</b><span class="small muted">${quandoVence(c)}</span></div><div class="cob-v"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div>${s.k === 'informada' ? `<button class="mini-acao ok" data-conf="${c.id}" aria-label="Confirmar pagamento">${I.check}</button>` : s.k === 'paga' ? '' : `<button class="mini-acao" data-lemb="${c.id}" aria-label="Lembrar aluno">${I.bell}</button>`}</div>`;
        })
        .join('') ||
      `<div class="empty"><div class="h3">${lista.length ? 'Nada neste filtro' : 'Nenhuma mensalidade neste mês'}</div><p class="small">${lista.length ? '' : base.planos.length ? 'Defina o plano dos alunos para as mensalidades aparecerem aqui.' : 'Comece criando os planos da Nexos.'}</p></div>`
    }</div>
    ${transparenciaEquipeHTML(equipe, st.comp)}`;
  const ir = (n) => {
    st.comp = somaMes(st.comp, n);
    staffFinanceiro();
  };
  document.getElementById('m-a').onclick = () => ir(-1);
  document.getElementById('m-p').onclick = () => ir(1);
  document.getElementById('fin-f').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (b) {
      st.filtro = b.dataset.f;
      staffFinanceiro();
    }
  };
  document.getElementById('fin-cfg').onclick = () => ajustesFinanceiro(base);
  ['cfg-pix', 'cfg-planos'].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.onclick = () => ajustesFinanceiro(base);
  });
  const sp = document.getElementById('sem-plano');
  if (sp) sp.onclick = () => planoEmLote(semPlano, base);
  const lt = document.getElementById('lembrar-todos');
  if (lt)
    lt.onclick = async () => {
      for (const c of atrasadas) await lembrarCobranca(c, nome[c.aluno_id], true);
      toast(`Lembrete enviado para ${atrasadas.length} aluno${atrasadas.length > 1 ? 's' : ''}.`);
      staffFinanceiro();
    };
  document.getElementById('fin-l').onclick = async (e) => {
    const conf = e.target.closest('[data-conf]'),
      lemb = e.target.closest('[data-lemb]'),
      row = e.target.closest('[data-cob]');
    if (conf) {
      e.stopPropagation();
      await marcarPaga(
        lista.find((c) => c.id === conf.dataset.conf),
        'pix',
      );
      return;
    }
    if (lemb) {
      e.stopPropagation();
      const c = lista.find((x) => x.id === lemb.dataset.lemb);
      return lembrarCobranca(c, nome[c.aluno_id]);
    }
    // parceria não tem o que confirmar nem cobrar
    if (row && (lista.find((x) => x.id === row.dataset.cob) || {}).forma === 'parceria') return;
    if (row && row.dataset.cob.startsWith('prev-')) {
      const c = lista.find((x) => x.id === row.dataset.cob);
      return detalhePrevista(c, nome[c.aluno_id] || {});
    }
    if (row)
      detalheCobranca(
        lista.find((c) => c.id === row.dataset.cob),
        nome[lista.find((c) => c.id === row.dataset.cob).aluno_id] || {},
      );
  };
}
/** alunos sem plano: marca vários e aplica o mesmo plano de uma vez (a aba Dados continua para o ajuste individual) */
function planoEmLote(semPlano, base) {
  const ativos = base.planos.filter((p) => p.ativo !== false);
  openSheet(
    `<div class="h2">Alunos sem plano</div><p class="small muted" style="margin:6px 0 10px">Marque os alunos, escolha o plano e salve. Para ajustar um aluno só, use a seta.</p>
    <div class="row between" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="lt-todos">Marcar todos</button><span class="small muted" id="lt-n">0 marcados</span></div>
    <div class="stack" id="lt-l">${semPlano.map((a) => `<div class="list-item lt-it" data-al="${a.user_id}"><label class="lt-chk"><input type="checkbox" value="${a.user_id}"><div class="av">${esc(initials(a.nome))}</div><b class="grow">${esc(a.nome)}</b></label><a class="icon-btn sm" href="#/aluno/${a.user_id}/dados" aria-label="Abrir dados de ${esc(a.nome)}">${I.chev}</a></div>`).join('')}</div>
    <form id="lt-f" class="lt-form"><label class="field"><span>Plano</span><select class="input" name="plano" required><option value="">Escolha o plano</option>${ativos.map((p) => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.valor)}</option>`).join('')}</select></label>
      <div class="grid2"><label class="field"><span>Vence dia</span><input class="input" name="dia" data-mask="num" data-max="2" inputmode="numeric" value="10"></label><label class="field"><span>Início</span><input class="input" type="month" name="inicio" value="${esc(compDe())}"></label></div>
      <button class="btn block" id="lt-ok" disabled>Aplicar plano</button></form>`,
    (r) => bindLote(r, semPlano, base),
  );
}
function bindLote(r, semPlano, base) {
  const box = r.querySelectorAll('#lt-l input[type=checkbox]'),
    f = r.querySelector('#lt-f'),
    ok = r.querySelector('#lt-ok');
  const marcados = () => [...box].filter((b) => b.checked).map((b) => b.value);
  const atual = () => {
    const n = marcados().length;
    r.querySelector('#lt-n').textContent = `${n} marcado${n === 1 ? '' : 's'}`;
    ok.disabled = !n;
    ok.textContent = n ? `Aplicar plano a ${n} aluno${n > 1 ? 's' : ''}` : 'Aplicar plano';
    r.querySelector('#lt-todos').textContent = n === box.length ? 'Desmarcar todos' : 'Marcar todos';
    r.querySelectorAll('.lt-it').forEach((it) => it.classList.toggle('on', it.querySelector('input').checked));
  };
  r.querySelector('#lt-l').addEventListener('change', atual);
  r.querySelector('#lt-todos').onclick = () => {
    const todos = marcados().length !== box.length;
    box.forEach((b) => {
      b.checked = todos;
    });
    atual();
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const ids = marcados();
    if (!ids.length) return;
    if (!f.plano.value) return toast('Escolha o plano.', true);
    const dd = Math.round(num(f.dia.value) || 10);
    if (dd < 1 || dd > 28) return toast('Use um dia de 1 a 28.', true);
    const financeiro = { plano_id: f.plano.value, valor: null, dia: dd, inicio: f.inicio.value || compDe() };
    ok.disabled = true;
    ok.textContent = 'Salvando…';
    const res = await Promise.all(
      ids.map((id) =>
        salvarFinAluno(id, financeiro).then(
          (x) => !x.error,
          () => false,
        ),
      ),
    );
    const feitos = ids.filter((_, i) => res[i]);
    if (!feitos.length) {
      atual();
      return toast('Não foi possível salvar.', true);
    }
    const alunos = base.alunos.filter((a) => feitos.includes(a.user_id)).map((a) => ({ ...a, financeiro }));
    const n = await gerarCobrancas(compDe(), { ...base, alunos }).catch(() => 0);
    closeSheet();
    toast(
      `Plano aplicado a ${feitos.length} aluno${feitos.length > 1 ? 's' : ''}${n ? ` e ${n} mensalidade${n > 1 ? 's' : ''} do mês gerada${n > 1 ? 's' : ''}` : ''}.${feitos.length < ids.length ? ` ${ids.length - feitos.length} não salvou.` : ''}`,
      feitos.length < ids.length,
    );
    staffFinanceiro();
  };
}
async function marcarPaga(c, forma, depois) {
  const { error } = await sb
    .from('nx_cobrancas')
    .update({ status: 'paga', forma, pago_em: new Date().toISOString() })
    .eq('id', c.id);
  if (error) return toast('Não foi possível registrar.', true);
  toast('Pagamento registrado ✓');
  closeSheet();
  (depois || staffFinanceiro)();
}
async function lembrarCobranca(c, aluno, silencioso) {
  // notificação no celular do aluno (mesmo texto do aviso automático: vencendo, vence hoje ou atrasada)
  try {
    sb.functions.invoke('nx-cobrancas', { body: { acao: 'lembrar', id: c.id } }).catch(() => {});
  } catch {}
  await sb.from('nx_cobrancas').update({ lembrete_em: new Date().toISOString() }).eq('id', c.id);
  if (silencioso) return;
  const pix = await meuPix();
  const tel = String((aluno || {}).telefone || '').replace(/\D/g, '');
  const msg = `Olá, ${firstName((aluno || {}).nome)}! Passando para lembrar da mensalidade da Nexos de ${brl(c.valor)}, ${quandoVence(c)}.${pix.chave ? `\n\nPix copia e cola:\n${pixCopiaECola({ ...pix, valor: c.valor, txid: 'NX' + c.competencia.replace('-', '') })}` : ''}\n\nVocê também pode pagar pelo app. Obrigado!`;
  openSheet(`<div class="h2">Lembrete enviado no app</div><p class="small muted" style="margin:6px 0 16px">${esc(firstName((aluno || {}).nome))} recebe uma notificação (se ativou no celular). Quer mandar também pelo WhatsApp?</p>
    <a class="btn block" style="background:#25d366;color:#04122b" href="https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${I.wa} Enviar pelo WhatsApp</a>
    <button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`);
}
function detalheCobranca(c, aluno, depois) {
  const s = statusCob(c);
  depois = depois || staffFinanceiro;
  openSheet(
    `<p class="eyebrow">${esc(c.descricao || nomeMes(c.competencia))}</p><div class="h2" style="margin-top:4px">${esc(aluno.nome || 'Aluno')}</div>
    <div class="cob-det"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div><p class="small muted">${quandoVence(c)}${c.informada_em && s.k === 'informada' ? ` · avisou ${quando(c.informada_em)}` : ''}${c.lembrete_em ? ` · último lembrete ${quando(c.lembrete_em)}` : ''}</p>
    ${
      s.k !== 'paga'
        ? `<div class="card" style="margin-top:16px"><b>Registrar pagamento</b><div class="seg four" id="formas" style="margin-top:12px">${FORMAS.map(([k, l]) => `<button type="button" data-forma="${k}">${l}</button>`).join('')}</div></div>
      <button class="btn ghost block" id="d-lemb" style="margin-top:12px">${I.bell} Lembrar o aluno</button>`
        : '<button class="btn ghost block" id="d-desf" style="margin-top:16px">Desfazer pagamento</button>'
    }
    <details class="ajuda" style="margin-top:16px"><summary>Editar valor ou vencimento</summary>
      <div class="grid2" style="margin-top:12px"><label class="field"><span>Valor (R$)</span><input class="input" id="d-val" data-mask="dec" data-int="5" inputmode="decimal" value="${String(c.valor).replace('.', ',')}"></label><label class="field"><span>Vencimento</span><input class="input" type="date" id="d-ven" value="${c.vencimento}"></label></div>
      <div class="row between"><button class="btn sm" id="d-salvar">Salvar</button><button class="link-btn small" id="d-canc" style="color:var(--err)">Cancelar esta cobrança</button></div></details>
    ${aluno.user_id ? `<button class="btn ghost block" id="d-enc" style="margin-top:12px;color:var(--err)">Encerrar mensalidade (aluno saiu)</button>` : ''}`,
    (r) => {
      const fm = r.querySelector('#formas');
      if (fm)
        fm.onclick = (e) => {
          const b = e.target.closest('[data-forma]');
          if (b) marcarPaga(c, b.dataset.forma, depois);
        };
      const en = r.querySelector('#d-enc');
      if (en) en.onclick = () => encerrarMensalidade(aluno, c.competencia, depois);
      const lb = r.querySelector('#d-lemb');
      if (lb) lb.onclick = () => lembrarCobranca(c, aluno);
      const df = r.querySelector('#d-desf');
      if (df)
        df.onclick = async () => {
          await sb.from('nx_cobrancas').update({ status: 'aberta', pago_em: null, forma: null }).eq('id', c.id);
          toast('Pagamento desfeito.');
          closeSheet();
          depois();
        };
      r.querySelector('#d-salvar').onclick = async () => {
        const v = num(r.querySelector('#d-val').value);
        if (v == null) return toast('Valor inválido.', true);
        const { error } = await sb
          .from('nx_cobrancas')
          .update({ valor: v, vencimento: r.querySelector('#d-ven').value || c.vencimento })
          .eq('id', c.id);
        if (error) return toast('Não foi possível salvar.', true);
        toast('Cobrança atualizada.');
        closeSheet();
        depois();
      };
      r.querySelector('#d-canc').onclick = async () => {
        if (!confirm('Cancelar esta cobrança?')) return;
        await sb.from('nx_cobrancas').update({ status: 'cancelada' }).eq('id', c.id);
        toast('Cobrança cancelada.');
        closeSheet();
        depois();
      };
    },
  );
}
function ajustesFinanceiro(base) {
  const pix = S.cache.meuPix || {};
  const admin = S.me.papel === 'admin';
  const desenhar = (r) => {
    r.querySelector('#pl-l').innerHTML = base.planos.length
      ? base.planos
          .map(
            (p) =>
              `<div class="list-item" data-pl="${p.id}"><div class="grow"><b>${esc(p.nome)}</b><div class="small muted">${brl(p.valor)} · ${(CICLOS.find((c) => c[0] === p.meses) || [, 'Mensal'])[1]}${p.ativo ? '' : ' · inativo'}</div></div>${I.chev}</div>`,
          )
          .join('')
      : '<p class="small muted">Nenhum plano ainda.</p>';
  };
  openSheet(
    `<p class="eyebrow">Ajustes do financeiro</p>
    <div class="section" style="margin-top:12px"><div class="section-h"><h2 class="h2">Planos</h2><button class="btn sm" id="pl-novo">${I.plus} Novo plano</button></div><div id="pl-l" class="stack"></div></div>
    <div class="section"><div class="section-h"><h2 class="h2">Minha chave Pix</h2></div>
      <p class="small muted" style="margin:-4px 0 10px">Os seus alunos pagam direto nesta chave. Cada treinador tem a sua, e os planos e mensalidades também são separados.</p>
      ${
        true
          ? `<form id="f-pix"><label class="field"><span>Chave Pix</span><input class="input" name="chave" value="${esc(pix.chave || '')}" placeholder="CNPJ, e-mail, chave aleatória ou celular (+5598…)" required></label>
      <div class="grid2"><label class="field"><span>Nome do recebedor</span><input class="input" name="nome" value="${esc(pix.nome || '')}" placeholder="Como aparece no banco" required></label><label class="field"><span>Cidade</span><input class="input" name="cidade" value="${esc(pix.cidade || 'São Luís')}" required></label></div>
      <p class="tiny dim" style="margin:-4px 0 12px">O app gera o QR Code e o “copia e cola” com o valor certo. O dinheiro cai direto na conta da chave.</p>
      <button class="btn block">Salvar Pix</button></form>`
          : `<p class="small muted">${pix.chave ? 'Chave cadastrada: ' + esc(pix.chave) : 'Peça ao administrador para cadastrar a chave Pix.'}</p>`
      }</div>
    <div class="section"><div class="section-h"><h2 class="h2">Pagamento online</h2>${pagCfg(S.org.config).conectado ? `<span class="tag ok">Conectado${pagCfg(S.org.config).ambiente === 'producao' ? '' : ' · teste'}</span>` : '<span class="tag">Desligado</span>'}</div>
      ${
        !admin
          ? '<p class="small muted">Só o administrador configura o pagamento online.</p>'
          : pagCfg(S.org.config).conectado
            ? `
      <p class="small muted">Pix com QR Code, cartão, Pix Automático e cartão recorrente pelo Asaas. Os pagamentos se confirmam sozinhos.</p>
      <form id="f-pagcfg" style="margin-top:12px"><div class="grid2"><label class="field"><span>Acréscimo no cartão (%)</span><input class="input" name="acres" data-mask="dec" data-int="2" inputmode="decimal" value="${String(pagCfg(S.org.config).acrescimo_cartao || 0).replace('.', ',')}"></label><label class="field"><span>Parcelas no cartão (máx.)</span><select class="input" name="parc">${[1, 2, 3, 4, 6, 12].map((n) => `<option value="${n}" ${(+pagCfg(S.org.config).parcelas_max || 3) === n ? 'selected' : ''}>${n}x</option>`).join('')}</select></label></div>
      <label class="field"><span>Parcelar a partir de (R$)</span><input class="input" name="pmin" data-mask="dec" data-int="5" inputmode="decimal" value="${String(pagCfg(S.org.config).parcelas_min != null ? pagCfg(S.org.config).parcelas_min : 300).replace('.', ',')}"></label>
      <p class="tiny dim" style="margin:-4px 0 12px">O acréscimo cobre os juros da operadora. Abaixo do valor mínimo, o cartão é só à vista (o aluno vê o aviso).</p>
      <button class="btn ghost block">Salvar</button></form>
      <button class="link-btn small" id="pag-desc" style="margin-top:10px;color:var(--err)">Desconectar o Asaas</button>`
            : `
      <p class="small muted">Com a conta da Nexos no Asaas, o aluno paga pelo app com Pix (QR Code) ou cartão, e pode ativar o Pix Automático ou o cartão recorrente. Tudo se confirma sozinho.</p>
      <form id="f-asaas" style="margin-top:12px"><label class="field"><span>Chave da API do Asaas</span><input class="input mono" name="chave" type="password" autocomplete="off" placeholder="$aact_..." required></label>
      <label class="field"><span>Ambiente</span><select class="input" name="amb"><option value="teste">Teste (sandbox)</option><option value="producao">Produção (dinheiro de verdade)</option></select></label>
      <p class="tiny dim" style="margin:-4px 0 12px">No Asaas: Integrações, Chave de API. A chave fica guardada só no servidor e não aparece de novo no app.</p>
      <button class="btn block">Conectar</button></form>`
      }</div>`,
    (r) => {
      desenhar(r);
      const fa = r.querySelector('#f-asaas');
      if (fa)
        fa.onsubmit = async (e) => {
          e.preventDefault();
          const bt = fa.querySelector('button');
          bt.disabled = true;
          bt.textContent = 'Conectando…';
          try {
            const res = await chamarPag({ acao: 'configurar', chave: fa.chave.value.trim(), ambiente: fa.amb.value });
            S.org.config = {
              ...(S.org.config || {}),
              pagamentos: { ...pagCfg(S.org.config), gateway: 'asaas', ambiente: res.ambiente, conectado: true },
            };
            if (res.webhook) {
              toast('Asaas conectado!');
              closeSheet();
              staffFinanceiro();
            } else
              openSheet(`<div class="h2">Conectado, falta um passo</div><p class="small muted" style="margin:8px 0 12px">Não conseguimos cadastrar o aviso automático no Asaas${res.webhook_erro ? ` (${esc(res.webhook_erro)})` : ''}. No Asaas, vá em Integrações, Webhooks, e cadastre:</p>
          <label class="field"><span>URL</span><input class="input mono" readonly value="${esc(res.webhook_url)}"></label><label class="field"><span>Token de autenticação</span><input class="input mono" readonly value="${esc(res.webhook_token || '')}"></label>
          <p class="tiny dim">Marque os eventos de cobranças, assinaturas e Pix Automático. Esse token aparece só agora.</p><button class="btn block" data-close style="margin-top:12px">Feito</button>`);
          } catch (er) {
            bt.disabled = false;
            bt.textContent = 'Conectar';
            toast(er.message, true);
          }
        };
      const fc = r.querySelector('#f-pagcfg');
      if (fc)
        fc.onsubmit = async (e) => {
          e.preventDefault();
          const ac = num(fc.acres.value) || 0;
          if (ac < 0 || ac > 30) return toast('Use um acréscimo de 0 a 30%.', true);
          const pmin = num(fc.pmin.value);
          if (pmin == null || pmin < 0) return toast('Valor mínimo inválido.', true);
          const cfg = {
            ...(S.org.config || {}),
            pagamentos: {
              ...pagCfg(S.org.config),
              acrescimo_cartao: ac,
              parcelas_max: +fc.parc.value,
              parcelas_min: pmin,
            },
          };
          const { error } = await sb.from('nx_orgs').update({ config: cfg }).eq('id', S.org.id);
          if (error) return toast('Não foi possível salvar.', true);
          S.org.config = cfg;
          toast('Pagamento online salvo!');
        };
      const pd = r.querySelector('#pag-desc');
      if (pd)
        pd.onclick = async () => {
          if (!confirm('Desconectar o Asaas? Os alunos voltam a pagar pelo Pix manual.')) return;
          try {
            await chamarPag({ acao: 'desconectar' });
            S.org.config = { ...(S.org.config || {}), pagamentos: { ...pagCfg(S.org.config), conectado: false } };
            toast('Asaas desconectado.');
            closeSheet();
            staffFinanceiro();
          } catch (er) {
            toast(er.message, true);
          }
        };
      const formPlano = (p) =>
        openSheet(
          `<p class="eyebrow">${p ? 'Editar plano' : 'Novo plano'}</p><form id="f-pl" style="margin-top:12px">
      <label class="field"><span>Nome</span><input class="input" name="nome" value="${esc(p ? p.nome : '')}" placeholder="Ex.: Corrida mensal" required></label>
      <div class="grid2"><label class="field"><span>Valor (R$)</span><input class="input" name="valor" data-mask="dec" data-int="5" inputmode="decimal" value="${p ? String(p.valor).replace('.', ',') : ''}" required></label><label class="field"><span>Cobrança</span><select class="input" name="meses">${CICLOS.map(([k, l]) => `<option value="${k}" ${p && p.meses === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      ${p ? `<label class="aceite" style="padding:4px 0 12px"><input type="checkbox" name="ativo" ${p.ativo ? 'checked' : ''}><span>Plano ativo</span></label>` : ''}
      <button class="btn block">Salvar plano</button>${p ? '<button type="button" class="link-btn small" id="pl-del" style="margin-top:10px;color:var(--err)">Excluir plano</button>' : ''}</form>`,
          (r2) => {
            const f = r2.querySelector('#f-pl');
            f.onsubmit = async (e) => {
              e.preventDefault();
              const valor = num(f.valor.value);
              if (valor == null) return toast('Valor inválido.', true);
              const row = {
                nome: f.nome.value.trim(),
                valor,
                meses: +f.meses.value,
                ...(p ? { ativo: f.ativo.checked } : {}),
              };
              const q = p
                ? await sb.from('nx_planos').update(row).eq('id', p.id).select('*').single()
                : await sb
                    .from('nx_planos')
                    .insert({ ...row, org_id: S.org.id })
                    .select('*')
                    .single();
              if (q.error) return toast('Não foi possível salvar.', true);
              if (p) Object.assign(p, q.data || row);
              else base.planos.push(q.data);
              toast('Plano salvo!');
              closeSheet();
              location.hash === '#/financeiro' ? staffFinanceiro() : null;
            };
            const del = r2.querySelector('#pl-del');
            if (del)
              del.onclick = async () => {
                if (!confirm('Excluir este plano? As mensalidades já geradas continuam.')) return;
                const { error } = await sb.from('nx_planos').delete().eq('id', p.id);
                if (error) return toast('Não foi possível excluir.', true);
                toast('Plano excluído.');
                closeSheet();
                staffFinanceiro();
              };
          },
        );
      r.querySelector('#pl-novo').onclick = () => formPlano(null);
      r.querySelector('#pl-l').onclick = (e) => {
        const it = e.target.closest('[data-pl]');
        if (it) formPlano(base.planos.find((p) => p.id === it.dataset.pl));
      };
      const fp = r.querySelector('#f-pix');
      if (fp)
        fp.onsubmit = async (e) => {
          e.preventDefault();
          const px = { chave: fp.chave.value.trim(), nome: fp.nome.value.trim(), cidade: fp.cidade.value.trim() };
          const { error } = await sb
            .from('nx_pix_treinador')
            .upsert(
              { user_id: S.user.id, org_id: S.org.id, ...px, ativo: true, atualizado_em: new Date().toISOString() },
              { onConflict: 'user_id' },
            );
          if (error) return toast('Não foi possível salvar.', true);
          S.cache.meuPix = px;
          toast('Pix salvo! Seus alunos já pagam nesta chave.');
          closeSheet();
          staffFinanceiro();
        };
    },
  );
}
/** cartão “Plano e pagamento” na aba Dados do aluno */
async function planoDoAlunoHTML(m) {
  // plano e mensalidades ficam só com o treinador do aluno
  if (!ehMeuAluno(m))
    return {
      base: { planos: [], alunos: [] },
      cobs: [],
      auto: null,
      valorPlano: 0,
      mesesPlano: 1,
      descPlano: '',
      html: '',
    };
  const base = await carregarFinanceiroBase();
  m.financeiro = (base.alunos.find((a) => a.user_id === m.user_id) || {}).financeiro || {};
  const { data: cobs } = await sb
    .from('nx_cobrancas')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('aluno_id', m.user_id)
    .neq('status', 'cancelada')
    .order('vencimento', { ascending: false })
    .limit(6);
  const fz = m.financeiro || {};
  const auto = await assinaturaDoAluno(m.user_id).catch(() => null);
  const adesao = fz.plano_id
    ? (
        await sb
          .from('nx_adesoes')
          .select('versao,compromisso,plano_nome,aceito_em')
          .eq('org_id', S.org.id)
          .eq('aluno_id', m.user_id)
          .order('aceito_em', { ascending: false })
          .limit(1)
      ).data?.[0] || null
    : null;
  const plA = base.planos.find((p) => p.id === fz.plano_id);
  const valorPlano = plA ? (fz.valor != null && fz.valor !== '' ? +fz.valor : +plA.valor) : 0;
  return {
    base,
    cobs: cobs || [],
    auto,
    valorPlano,
    mesesPlano: plA ? plA.meses || 1 : 1,
    descPlano: plA ? plA.nome : '',
    html: `<div class="card" id="plano-card"><b>Plano e pagamento</b>
    ${
      base.planos.length
        ? `<form id="f-plano" style="margin-top:12px"><label class="field"><span>Plano</span><select class="input" name="plano"><option value="">Sem plano (não gera mensalidade)</option>${base.planos
            .filter((p) => p.ativo || p.id === fz.plano_id)
            .map(
              (p) =>
                `<option value="${p.id}" ${fz.plano_id === p.id ? 'selected' : ''}>${esc(p.nome)} · ${brl(p.valor)}</option>`,
            )
            .join('')}</select></label>
      <div class="grid3"><label class="field"><span>Valor</span><input class="input" name="valor" data-mask="dec" data-int="5" inputmode="decimal" value="${fz.valor != null && fz.valor !== '' ? String(fz.valor).replace('.', ',') : ''}" placeholder="do plano"></label><label class="field"><span>Vence dia</span><input class="input" name="dia" data-mask="num" data-max="2" inputmode="numeric" value="${esc(fz.dia || 10)}"></label><label class="field"><span>Início</span><input class="input" type="month" name="inicio" value="${esc(fz.inicio || compDe())}"></label></div>
      <label class="field"><span>Compromisso do aluno</span><select class="input" name="compromisso">${[
        [1, 'Mensal (sem compromisso)'],
        [3, 'Trimestral'],
        [6, 'Semestral'],
        [12, 'Anual'],
      ]
        .map(([v, l]) => `<option value="${v}" ${(+fz.compromisso || 1) === v ? 'selected' : ''}>${l}</option>`)
        .join('')}</select></label>
      ${adesaoStaffHTML(fz, adesao)}
      <button class="btn ghost block sm">Salvar plano do aluno</button></form>
      ${fz.fim && !fz.plano_id ? `<div class="fin-fim"><span><b>Sem mensalidade.</b> A mensalidade foi encerrada${fz.fim >= (fz.inicio || '') ? ` (último mês pago: ${esc(nomeMes(fz.fim))})` : ''}. Continua no app normalmente.</span>${fz.plano_anterior ? '<button type="button" class="link-btn small" id="pl-reat">Voltar a cobrar</button>' : ''}</div>` : fz.plano_id ? `<p class="tiny dim" style="margin-top:8px">A mensalidade se repete todo mês até você encerrar.</p><button type="button" class="btn ghost block sm" id="pl-enc" style="margin-top:8px;color:var(--err)">Encerrar mensalidade (aluno saiu)</button>` : ''}`
        : '<p class="small muted" style="margin-top:6px">Crie os planos em Financeiro → Ajustes.</p>'
    }
    ${autoStaffHTML(auto, m, valorPlano, plA ? plA.meses || 1 : 1)}
    ${
      (cobs || []).length
        ? `<div class="stack" style="margin-top:12px">${cobs
            .map((c) => {
              const s = statusCob(c);
              return `<div class="cob-mini" data-cobm="${c.id}"><span>${esc(nomeMes(c.competencia))}</span><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div>`;
            })
            .join('')}</div>`
        : ''
    }</div>`,
  };
}
function adesaoStaffHTML(fz, ad) {
  const c = +fz.compromisso || 1;
  const ok =
    ad && ad.compromisso === c && (!fz.adesao_desde || ad.aceito_em >= fz.adesao_desde) && ad.versao === ADESAO_VERSAO;
  if (c < 3 && !ok)
    return '<p class="small muted" style="margin:-4px 0 10px">Trimestral, semestral ou anual: o aluno aceita o Termo de Adesão ao abrir o app. Aluno novo aceita no fim da ficha (Formulários › Gerar link).</p>';
  return `<p style="margin:-4px 0 10px">${ok ? `<span class="tag ok">Termo de adesão aceito em ${fmtDia(ad.aceito_em)}</span>` : '<span class="tag warn">Termo de adesão pendente: aparece para o aluno ao abrir o app</span>'}</p>`;
}
function bindPlanoDoAluno(m, info, recarregar) {
  const f = document.getElementById('f-plano');
  if (f)
    f.onsubmit = async (e) => {
      e.preventDefault();
      const dd = Math.round(num(f.dia.value) || 10);
      if (dd < 1 || dd > 28) return toast('Use um dia de 1 a 28.', true);
      const financeiro = {
        plano_id: f.plano.value || null,
        valor: num(f.valor.value),
        dia: dd,
        inicio: f.inicio.value || compDe(),
        compromisso: +f.compromisso.value || 1,
      };
      // novo compromisso (ou novo plano com compromisso): o aluno aceita o termo de adesão de novo ao abrir o app
      const ant = m.financeiro || {};
      if (financeiro.compromisso >= 3)
        financeiro.adesao_desde =
          ant.adesao_desde && +ant.compromisso === financeiro.compromisso && ant.plano_id === financeiro.plano_id
            ? ant.adesao_desde
            : new Date().toISOString();
      const fimAnt = (m.financeiro || {}).fim;
      if (fimAnt && financeiro.plano_id && financeiro.inicio <= fimAnt) financeiro.inicio = compDe();
      const { error } = await salvarFinAluno(m.user_id, financeiro);
      if (error) return toast('Não foi possível salvar.', true);
      m.financeiro = financeiro;
      const base = { ...info.base, alunos: [{ ...m, ativo: m.ativo }] };
      const n = await gerarCobrancas(compDe(), base, m.user_id);
      toast(n ? 'Plano salvo e mensalidade do mês gerada!' : 'Plano salvo!');
      recarregar();
    };
  const card = document.getElementById('plano-card');
  if (card)
    card.addEventListener('click', (e) => {
      const r = e.target.closest('[data-cobm]');
      if (r)
        detalheCobranca(
          info.cobs.find((c) => c.id === r.dataset.cobm),
          m,
          recarregar,
        );
    });
  const pe = document.getElementById('pl-enc'),
    pr = document.getElementById('pl-reat');
  if (pe) pe.onclick = () => encerrarMensalidade(m, compDe(), recarregar);
  if (pr) pr.onclick = () => reativarMensalidade(m, recarregar);
  bindAutoStaff(m, info.auto, info.valorPlano, info.mesesPlano, info.descPlano, recarregar);
}

/* ---------- pagamento online (Asaas): Pix com QR Code, cartão, Pix Automático e cartão recorrente ---------- */
const pagCfg = (cfg) => (cfg || {}).pagamentos || {};
async function chamarPag(body) {
  const { data, error } = await sb.functions.invoke('nx-pagamentos', { body: { org_id: S.org.id, ...body } });
  if (error) {
    let m = 'Não foi possível falar com o pagamento agora. Tente de novo.';
    try {
      const j = await error.context.json();
      m = j.erro || m;
    } catch {}
    throw new Error(m);
  }
  if (data && data.erro) throw new Error(data.erro);
  return data || {};
}
const fmtCPF = (v) => {
  const d = String(v || '')
    .replace(/\D/g, '')
    .slice(0, 14);
  return d.length <= 11
    ? d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    : d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};
function cpfValido(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === +d[9] && dv(10) === +d[10];
}
// pede o CPF uma vez (vai só para o Asaas, que exige o CPF do pagador; a Nexos não guarda)
function pedirCPF() {
  return new Promise((ok) => {
    let feito = false;
    openSheet(
      `<p class="eyebrow">Pagamento seguro</p><div class="h2" style="margin-top:4px">Seu CPF</div>
      <p class="small muted" style="margin-top:6px">O banco exige o CPF de quem paga. Ele vai direto para a empresa de pagamentos e é pedido só desta vez.</p>
      <form id="f-cpf" style="margin-top:14px"><label class="field"><span>CPF</span><input class="input" name="cpf" data-mask="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" required></label>
      <button class="btn block" type="submit">Continuar ${I.arrow}</button></form>`,
      (r) => {
        const f = r.querySelector('#f-cpf');
        f.cpf.oninput = () => {
          f.cpf.value = fmtCPF(f.cpf.value);
        };
        f.onsubmit = (e) => {
          e.preventDefault();
          if (!cpfValido(f.cpf.value)) return toast('Confira o CPF.', true);
          feito = true;
          f.querySelector('button').disabled = true;
          f.querySelector('button').textContent = 'Preparando…';
          ok(f.cpf.value.replace(/\D/g, ''));
        }; // a próxima tela substitui esta
        document.addEventListener(
          'nx:painel-fechado',
          () => {
            if (!feito) ok(null);
          },
          { once: true },
        );
      },
    );
  });
}
async function comCPF(fn) {
  let r = await fn();
  if (r && r.precisa_cpf) {
    const cpf = await pedirCPF();
    if (!cpf) return null;
    r = await fn(cpf);
  }
  return r;
}
function telaPixOnline({ titulo, valor, sub, payload, qr, aguardar, passos }) {
  openSheet(
    `<p class="eyebrow">${esc(titulo)}</p><div class="h2" style="margin-top:4px">${valor != null ? brl(valor) : ''}</div>${sub ? `<p class="small muted">${sub}</p>` : ''}
    ${passos ? `<ol class="pag-passos">${passos.map(([t, d], i) => `<li><span>${i + 1}</span><div><b>${t}</b><small>${d}</small></div></li>`).join('')}</ol>` : ''}
    <div class="qr-box">${qr ? `<img src="data:image/png;base64,${qr}" alt="QR Code Pix" width="220" height="220">` : '<div class="boot-bar"><i></i></div>'}</div>
    ${payload ? `<label class="field"><span>Pix copia e cola</span><textarea class="textarea mono" id="pix-cod" readonly rows="3">${esc(payload)}</textarea></label><button class="btn block" id="copiar-pix">Copiar código Pix</button>` : '<p class="small muted center">O código Pix ainda não ficou pronto. Tente de novo em instantes.</p>'}
    <p class="pag-aguarda" id="pag-st"><span class="pulso"></span>Aguardando o pagamento. A confirmação chega sozinha.</p>`,
    async (r) => {
      if (!qr && payload) {
        try {
          r.querySelector('.qr-box').innerHTML = await qrSVG(payload);
        } catch {
          r.querySelector('.qr-box').remove();
        }
      }
      const cp = r.querySelector('#copiar-pix');
      if (cp)
        cp.onclick = async () => {
          try {
            await navigator.clipboard.writeText(payload);
            toast('Código copiado! Cole no app do banco.');
          } catch {
            r.querySelector('#pix-cod').select();
            toast('Selecione e copie o código.', true);
          }
        };
      if (!aguardar) return;
      const t0 = Date.now();
      const iv = setInterval(async () => {
        if (!document.getElementById('pag-st') || Date.now() - t0 > 15 * 60e3) return clearInterval(iv);
        if (await aguardar()) {
          clearInterval(iv);
          const st = document.getElementById('pag-st');
          if (st) {
            st.className = 'pag-aguarda ok';
            st.innerHTML = `${I.check} Pagamento confirmado. Obrigado!`;
          }
          setTimeout(() => {
            closeSheet();
            router();
          }, 1800);
        }
      }, 4000);
    },
  );
}
async function pagarOnline(c, cfg) {
  const pc = pagCfg(cfg),
    acres = +pc.acrescimo_cartao || 0,
    maxP = Math.max(1, +pc.parcelas_max || 3),
    minP = pc.parcelas_min != null ? +pc.parcelas_min : 300;
  const podeParcelar = maxP > 1 && +c.valor >= minP;
  const comAcres = Math.round(+c.valor * (1 + acres / 100) * 100) / 100;
  openSheet(
    `<p class="eyebrow">Pagar mensalidade</p><div class="h2" style="margin-top:4px">${brl(c.valor)}</div><p class="small muted">${esc(c.descricao || nomeMes(c.competencia))}</p>
    <div class="stack" style="margin-top:16px">
      <button class="pag-op" data-op="pix"><span class="ativ-ic">${I.money}</span><div class="grow"><b>Pix</b><small>QR Code ou copia e cola · confirmação na hora</small></div>${I.chev}</button>
      <button class="pag-op" data-op="cartao"><span class="ativ-ic">${I.card || I.money}</span><div class="grow"><b>Cartão de crédito</b><small>${acres ? `${brl(comAcres)} (acréscimo de ${String(acres).replace('.', ',')}% da operadora)` : 'Página segura do Asaas'}${podeParcelar ? ` · até ${maxP}x` : maxP > 1 ? ` · parcelamento a partir de ${brl(minP)}` : ''}</small></div>${I.chev}</button>
    </div>
    <p class="tiny dim center" style="margin-top:12px">Pagamento processado pelo Asaas. A Nexos não vê os dados do seu cartão.</p>`,
    (r) => {
      r.onclick = async (e) => {
        const b = e.target.closest('[data-op]');
        if (!b) return;
        const forma = b.dataset.op;
        let parcelas = 1;
        if (forma === 'cartao' && podeParcelar) {
          parcelas = await new Promise((ok) => {
            let esc_ = true;
            openSheet(
              `<div class="h2">Em quantas vezes?</div><div class="stack" style="margin-top:12px">${Array.from(
                { length: maxP },
                (_, i) => i + 1,
              )
                .map(
                  (n) =>
                    `<button class="pag-op" data-n="${n}"><div class="grow"><b>${n}x de ${brl(comAcres / n)}</b><small>${n === 1 ? 'à vista' : `total ${brl(comAcres)}`}</small></div>${I.chev}</button>`,
                )
                .join('')}</div>`,
              (r2) => {
                r2.onclick = (e2) => {
                  const bn = e2.target.closest('[data-n]');
                  if (bn) {
                    esc_ = false;
                    ok(+bn.dataset.n);
                  }
                };
              },
            );
            document.addEventListener(
              'nx:painel-fechado',
              () => {
                if (esc_) ok(0);
              },
              { once: true },
            );
          });
          if (!parcelas) return;
        }
        b.disabled = true;
        b.querySelector('small').textContent = 'Preparando o pagamento…';
        try {
          const res = await comCPF((cpf) =>
            chamarPag({ acao: 'pagar', cobranca: c.id, forma, parcelas, ...(cpf ? { cpf } : {}) }),
          );
          if (!res) {
            b.disabled = false;
            return;
          }
          if (forma === 'pix') {
            telaPixOnline({
              titulo: 'Pagar com Pix',
              valor: c.valor,
              sub: esc(c.descricao || ''),
              payload: res.payload,
              qr: res.qr,
              aguardar: async () => {
                const { data } = await sb.from('nx_cobrancas').select('status').eq('id', c.id).maybeSingle();
                return data && data.status === 'paga';
              },
            });
          } else {
            if (res.link) window.open(res.link, '_blank', 'noopener');
            openSheet(
              `<div class="h2">Pagamento no cartão</div><p class="muted" style="margin:10px 0 16px">Abrimos a página segura do Asaas${res.parcelas > 1 ? ` (${res.parcelas}x)` : ''}. Assim que o pagamento for aprovado, a mensalidade aparece como paga aqui no app.</p>${res.link ? `<a class="btn block" href="${esc(res.link)}" target="_blank" rel="noopener">Abrir a página de pagamento</a>` : ''}<button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`,
            );
          }
        } catch (er) {
          b.disabled = false;
          toast(er.message, true);
        }
      };
    },
  );
}

/* ---------- cobrança automática (Pix Automático ou cartão recorrente) ---------- */
const FORMA_AUTO = { pix_automatico: 'Pix Automático', cartao: 'Cartão recorrente' };
const ST_AUTO = {
  oferecida: ['Aguardando o aluno ativar', 'warn'],
  pendente: ['Aguardando a autorização', 'warn'],
  ativa: ['Ativa', 'ok'],
  recusada: ['Recusada', 'err'],
  cancelada: ['Cancelada', ''],
  expirada: ['Expirou', 'err'],
  erro: ['Com erro', 'err'],
};
async function assinaturaDoAluno(alunoId) {
  const { data } = await sb
    .from('nx_assinaturas')
    .select('*')
    .eq('aluno_id', alunoId)
    .not('status', 'in', '(cancelada)')
    .order('criado_em', { ascending: false })
    .limit(1)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  return (data || [])[0] || null;
}
// card do treinador, na aba Dados do aluno
function autoStaffHTML(a, m, valorPlano, mesesPlano) {
  if (!pagCfg(S.org.config).conectado) return '';
  if (a) {
    const [l, cls] = ST_AUTO[a.status] || [a.status, ''];
    return `<div class="auto-card"><div class="row between" style="gap:8px"><b>Cobrança automática</b><span class="tag ${cls}">${l}</span></div><p class="small muted" style="margin-top:4px">${FORMA_AUTO[a.forma]} · ${brl(a.valor)} ${a.ciclo_meses > 1 ? `a cada ${a.ciclo_meses} meses` : 'por mês'}${a.status === 'oferecida' ? ' · o aluno ativa pelo app' : ''}${a.erro ? ` · ${esc(a.erro)}` : ''}</p><button type="button" class="link-btn small" id="auto-canc" data-a="${a.id}" style="color:var(--err);margin-top:6px">${a.status === 'oferecida' || a.status === 'erro' || a.status === 'recusada' || a.status === 'expirada' ? 'Remover' : 'Cancelar cobrança automática'}</button></div>`;
  }
  if (!valorPlano)
    return '<div class="auto-card"><b>Cobrança automática</b><p class="small muted" style="margin-top:4px">Defina o plano do aluno para oferecer a cobrança automática.</p></div>';
  return `<div class="auto-card"><b>Cobrança automática</b><p class="small muted" style="margin-top:4px">O aluno autoriza uma vez e paga sozinho ${mesesPlano > 1 ? `a cada ${mesesPlano} meses` : 'todo mês'} (${brl(valorPlano)}). A confirmação chega automática.</p>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn sm" data-oferta="pix_automatico">Oferecer Pix Automático</button><button type="button" class="btn ghost sm" data-oferta="cartao">Oferecer cartão recorrente</button></div></div>`;
}
function bindAutoStaff(m, a, valorPlano, mesesPlano, descricao, recarregar) {
  const card = document.getElementById('plano-card');
  if (!card) return;
  card.querySelectorAll('[data-oferta]').forEach(
    (b) =>
      (b.onclick = async () => {
        const { data: nova, error } = await sb
          .from('nx_assinaturas')
          .insert({
            org_id: S.org.id,
            aluno_id: m.user_id,
            forma: b.dataset.oferta,
            valor: valorPlano,
            ciclo_meses: [1, 3, 6, 12].includes(mesesPlano) ? mesesPlano : 1,
            descricao: descricao || 'Plano Nexos',
            status: 'oferecida',
          })
          .select('id')
          .single();
        if (error) {
          console.error(error);
          return toast('Não foi possível oferecer agora.', true);
        }
        chamarPag({ acao: 'avisar_oferta', assinatura: nova.id }).catch(() => {}); // notificação no celular do aluno
        toast(`${FORMA_AUTO[b.dataset.oferta]} oferecido. ${firstName(m.nome)} recebe o aviso e ativa pelo app.`);
        recarregar();
      }),
  );
  const cc = card.querySelector('#auto-canc');
  if (cc)
    cc.onclick = async () => {
      if (!confirm('Cancelar a cobrança automática deste aluno?')) return;
      try {
        if (a.status === 'oferecida') {
          const { error } = await sb.from('nx_assinaturas').delete().eq('id', a.id);
          if (error) throw error;
        } else await chamarPag({ acao: 'cancelar_automatica', assinatura: a.id });
        toast('Cobrança automática cancelada.');
        recarregar();
      } catch (er) {
        toast(er.message || 'Não foi possível cancelar.', true);
      }
    };
}
// card do aluno: ativar a cobrança automática oferecida pelo treinador
function autoAlunoHTML(a) {
  if (!a || !['oferecida', 'pendente', 'erro'].includes(a.status)) return '';
  const pix = a.forma === 'pix_automatico';
  return `<div class="card auto-aluno"><div class="row" style="gap:12px"><span class="go">${I.money}</span><div class="grow"><b>${pix ? 'Ative o Pix Automático' : 'Ative a cobrança no cartão'}</b><div class="small muted">${brl(a.valor)} ${a.ciclo_meses > 1 ? `a cada ${a.ciclo_meses} meses` : 'por mês'}, ${pix ? 'debitado sozinho da sua conta' : 'cobrado sozinho no seu cartão'}. Sem precisar lembrar.</div><div class="tiny dim" style="margin-top:4px">${pix ? '3 passos' : '2 passos'} · leva 1 minuto</div></div></div>
    <button class="btn block sm" id="auto-ativar" style="margin-top:12px">${a.status === 'pendente' ? 'Continuar a ativação' : 'Ativar agora'}</button></div>`;
}
function bindAutoAluno(a) {
  const b = document.getElementById('auto-ativar');
  if (!b || !a) return;
  b.onclick = async () => {
    b.disabled = true;
    b.textContent = 'Preparando…';
    try {
      const res = await comCPF((cpf) =>
        chamarPag({ acao: 'ativar_automatica', assinatura: a.id, ...(cpf ? { cpf } : {}) }),
      );
      b.disabled = false;
      b.textContent = 'Continuar a ativação';
      if (!res) return;
      if (res.forma === 'pix_automatico')
        telaPixOnline({
          titulo: 'Ativar Pix Automático',
          valor: a.valor,
          passos: [
            ['Pague este Pix', 'No app do seu banco: QR Code ou copia e cola.'],
            [
              'Aceite a autorização',
              'Logo depois do pagamento, o banco mostra o Pix Automático da Nexos. Toque em aceitar.',
            ],
            [
              'Pronto',
              `As próximas mensalidades saem sozinhas ${a.ciclo_meses > 1 ? `a cada ${a.ciclo_meses} meses` : 'todo mês'}. Você cancela quando quiser.`,
            ],
          ],
          payload: res.payload,
          qr: res.qr,
          aguardar: async () => {
            const { data } = await sb.from('nx_assinaturas').select('status').eq('id', a.id).maybeSingle();
            return data && data.status === 'ativa';
          },
        });
      else {
        if (res.link) window.open(res.link, '_blank', 'noopener');
        openSheet(
          `<div class="h2">Cartão recorrente</div><ol class="pag-passos"><li><span>1</span><div><b>Pague a primeira mensalidade</b><small>Na página segura do Asaas, com o seu cartão.</small></div></li><li><span>2</span><div><b>Pronto</b><small>As próximas são cobradas sozinhas no mesmo cartão. Você cancela quando quiser.</small></div></li></ol><p class="muted" style="margin:10px 0 16px">Se a página não abriu, toque no botão abaixo.</p>${res.link ? `<a class="btn block" href="${esc(res.link)}" target="_blank" rel="noopener">Abrir a página de pagamento</a>` : ''}<button class="btn ghost block" data-close style="margin-top:8px">Fechar</button>`,
        );
      }
    } catch (er) {
      b.disabled = false;
      b.textContent = 'Tentar de novo';
      toast(er.message, true);
    }
  };
}

/* ---------- lado do aluno ---------- */
async function minhaCobrancaPendente() {
  const { data } = await sb
    .from('nx_cobrancas')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('aluno_id', S.user.id)
    .in('status', ['aberta', 'informada'])
    .order('vencimento')
    .limit(3);
  const lim = isoDia(Date.now() + 5 * 864e5);
  // plano parceria (ou sem valor) não tem cartão de pagamento
  const parceria = (c) => !(+c.valor > 0) || /parceri/i.test(String(c.descricao || '').normalize('NFD'));
  return (data || []).find((c) => !parceria(c) && (c.status === 'informada' || c.vencimento <= lim)) || null;
}
function cartaoCobrancaHTML(c) {
  if (!c) return '';
  const s = statusCob(c);
  if (s.k === 'informada')
    return `<div class="card cob-card info"><div class="row" style="gap:12px"><span class="go">${I.check}</span><div class="grow"><b>Pagamento informado</b><div class="small muted">Mensalidade de ${esc(nomeMes(c.competencia).split(' ')[0])} · aguardando confirmação do treinador</div></div></div></div>`;
  return `<div class="card cob-card ${s.k === 'atrasada' ? 'atraso' : ''}"><div class="row" style="gap:12px"><span class="go">${I.money}</span><div class="grow"><b>Mensalidade de ${esc(nomeMes(c.competencia).split(' ')[0])} · ${brl(c.valor)}</b><div class="small muted">${quandoVence(c)}</div></div><button class="btn sm" id="pagar-pix" data-cob="${c.id}">Pagar</button></div></div>`;
}
async function pagarComPix(c) {
  const { data: org } = await sb.from('nx_orgs').select('config').eq('id', S.org.id).maybeSingle();
  if (pagCfg(org && org.config).conectado) return pagarOnline(c, org.config);
  const pix =
    (await sb.rpc('nx_meu_pix').then(
      (r) => r.data,
      () => null,
    )) || {};
  if (!pix.chave)
    return openSheet(
      '<div class="h2">Pix ainda não configurado</div><p class="muted" style="margin:10px 0 18px">Fale com o seu treinador para combinar o pagamento.</p><button class="btn block" data-close>Entendi</button>',
    );
  const codigo = pixCopiaECola({ ...pix, valor: c.valor, txid: 'NX' + c.competencia.replace('-', '') });
  openSheet(
    `<p class="eyebrow">Pagar com Pix</p><div class="h2" style="margin-top:4px">${brl(c.valor)}</div><p class="small muted">${esc(c.descricao || '')} · para ${esc(pix.nome)}</p>
    <div class="qr-box" id="qr"><div class="boot-bar"><i></i></div></div>
    <label class="field"><span>Pix copia e cola</span><textarea class="textarea mono" id="pix-cod" readonly rows="3">${esc(codigo)}</textarea></label>
    <button class="btn block" id="copiar-pix">Copiar código Pix</button>
    <p class="tiny dim center" style="margin-top:8px">No app do banco: Pix → Pagar → Pix copia e cola (ou ler QR Code).</p>
    <button class="btn ghost block" id="ja-paguei" style="margin-top:16px">${I.check} Já paguei</button>`,
    async (r) => {
      try {
        r.querySelector('#qr').innerHTML = await qrSVG(codigo);
      } catch {
        r.querySelector('#qr').remove();
      }
      r.querySelector('#copiar-pix').onclick = async () => {
        try {
          await navigator.clipboard.writeText(codigo);
          toast('Código copiado! Cole no app do banco.');
        } catch {
          r.querySelector('#pix-cod').select();
          toast('Selecione e copie o código.', true);
        }
      };
      r.querySelector('#ja-paguei').onclick = async () => {
        const { error } = await sb.rpc('nx_informar_pagamento', { cobranca: c.id });
        if (error) return toast('Não foi possível avisar agora.', true);
        notificar('pagamento', c.id);
        closeSheet();
        toast('Obrigado! Seu treinador vai confirmar.');
        router();
      };
    },
  );
}
/** minhas mensalidades; com o id de uma cobrança (vindo do aviso de vencimento), já abre o Pix dela */
async function viewPagamentos(abrir) {
  loading();
  const { data } = await sb
    .from('nx_cobrancas')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('aluno_id', S.user.id)
    .neq('status', 'cancelada')
    .order('vencimento', { ascending: false })
    .limit(24);
  const l = data || [];
  const auto = await assinaturaDoAluno(S.user.id).catch(() => null);
  $app.innerHTML = `<a class="back" href="#/perfil">${I.back} Perfil</a><p class="eyebrow">Pagamentos</p><h1 class="h1">Minhas mensalidades</h1>
    ${autoAlunoHTML(auto)}${auto && auto.status === 'ativa' ? `<div class="lib-bar ok" style="margin-top:12px"><span>${I.check} ${FORMA_AUTO[auto.forma]} ativo: ${brl(auto.valor)} ${auto.ciclo_meses > 1 ? `a cada ${auto.ciclo_meses} meses` : 'por mês'}</span></div>` : ''}
    <div class="stack" style="margin-top:16px" id="pg-l">${
      l
        .map((c) => {
          const s = statusCob(c);
          return `<div class="list-item" ${s.k === 'aberta' || s.k === 'atrasada' ? `data-pagar="${c.id}"` : ''}><div class="grow"><b>${esc(nomeMes(c.competencia))}</b><div class="small muted">${quandoVence(c)}</div></div><div class="cob-v"><b>${brl(c.valor)}</b><span class="tag ${s.cls}">${s.l}</span></div></div>`;
        })
        .join('') ||
      '<div class="empty"><div class="h3">Nenhuma mensalidade</div><p class="small">Quando houver mensalidade, ela aparece aqui.</p></div>'
    }</div>`;
  document.getElementById('pg-l').onclick = (e) => {
    const it = e.target.closest('[data-pagar]');
    if (it) pagarComPix(l.find((c) => c.id === it.dataset.pagar));
  };
  bindAutoAluno(auto);
  const doAviso = abrir && l.find((c) => c.id === abrir && ['aberta', 'atrasada'].includes(statusCob(c).k));
  if (doAviso) pagarComPix(doAviso);
}
