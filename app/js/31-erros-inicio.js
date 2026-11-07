/* Nexos App · Monitoramento de erros e início do app (este arquivo precisa ser o último).
   Parte 31 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- monitoramento de erros: todo erro do app chega para a equipe em Mais → Erros do app ---------- */
const NX_VERSAO = '2026.11.03';
const ERROS_ENVIADOS = new Set();
let errosN = 0;
function reportarErro(err, onde) {
  try {
    if (window.NX_DEMO) return;
    const msg = String((err && (err.message || (typeof err.reason === 'string' && err.reason))) || err || '').slice(
      0,
      500,
    );
    // ruído de internet e de navegador que não é defeito do app
    if (
      !msg ||
      /ResizeObserver loop|^Script error\.?$|AbortError|Load failed|NetworkError|Failed to fetch|cancelad|The user aborted|JWT expired|refresh_token/i.test(
        msg,
      )
    )
      return;
    const chave = msg + '|' + (onde || '');
    if (ERROS_ENVIADOS.has(chave) || ++errosN > 15) return; // o mesmo erro vai uma vez por sessão; no máximo 15
    ERROS_ENVIADOS.add(chave);
    sb.rpc('nx_registrar_erro', {
      p_org: S.org ? S.org.id : null,
      p_msg: msg,
      p_stack: `${onde ? '[' + onde + ']\n' : ''}${String((err && err.stack) || '').slice(0, 3800)}`,
      p_url: (location.hash || '#/').slice(0, 300),
      p_area: AREA,
      p_ua: navigator.userAgent,
      p_versao: NX_VERSAO,
    }).then(
      () => {},
      () => {},
    );
  } catch {}
}
window.addEventListener('error', (e) => {
  if (e && (e.error || e.message)) reportarErro(e.error || e.message, 'erro na tela');
});
window.addEventListener('unhandledrejection', (e) => reportarErro(e && e.reason, 'ação que falhou'));
// resumo em português dos erros mais comuns do navegador (o texto original fica nos detalhes)
const erroPT = (m) => {
  m = String(m || '');
  let x;
  if (
    (x = m.match(
      /(?:Cannot read propert(?:y|ies) of (?:undefined|null)(?: \(reading '([^']+)'\))?|undefined is not an object|null is not an object)/,
    ))
  )
    return `Faltou uma informação que a tela esperava${x[1] ? ` (“${x[1]}”)` : ''}`;
  if (/is not a function/.test(m)) return 'Uma parte do app tentou fazer algo que não existe';
  if (/is not defined/.test(m)) return 'Uma parte do app não foi carregada';
  if (/row-level security|permission denied|42501/i.test(m)) return 'O banco de dados recusou a gravação (permissão)';
  if (/duplicate key|23505/i.test(m)) return 'Tentou salvar algo que já existia';
  if (/QuotaExceeded|quota/i.test(m)) return 'A memória do navegador do aparelho está cheia';
  if (/timeout|timed out/i.test(m)) return 'Demorou demais para responder';
  if (/NotAllowedError|permission/i.test(m)) return 'O aparelho não deu permissão (câmera, notificação ou arquivo)';
  if (/JSON/.test(m)) return 'Recebeu um dado em formato errado';
  return '';
};
const aparelhoTxt = (ua) => {
  ua = ua || '';
  const so = /iPhone|iPad/.test(ua)
    ? 'iPhone'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'Mac'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Outro';
  const nav = /SamsungBrowser/.test(ua)
    ? 'Samsung Internet'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /CriOS|Chrome\//.test(ua)
        ? 'Chrome'
        : /FxiOS|Firefox/.test(ua)
          ? 'Firefox'
          : /Safari/.test(ua)
            ? 'Safari'
            : 'navegador';
  return `${so} · ${nav}`;
};
async function staffErros() {
  dockStaff();
  loading();
  const [{ data: erros, error }, { data: membros }] = await Promise.all([
    sb
      .from('nx_erros')
      .select('*')
      .eq('org_id', S.org.id)
      .order('resolvido')
      .order('ultimo_em', { ascending: false })
      .limit(100),
    sb.from('nx_membros').select('user_id,nome').eq('org_id', S.org.id),
  ]);
  if (error) throw error;
  const nomes = Object.fromEntries((membros || []).map((m) => [m.user_id, m.nome]));
  const abertos = (erros || []).filter((e) => !e.resolvido),
    resolvidos = (erros || []).filter((e) => e.resolvido);
  const quando = (d) => `${fmtData(d)} às ${fmtHora(d)}`;
  const item = (e) => {
    const pessoas = (e.usuarios || []).map((u) => nomes[u] || 'alguém de fora').slice(0, 4);
    return `<div class="card erro-it ${e.resolvido ? 'ok' : ''}" data-id="${e.id}">
      <div class="erro-top"><span class="erro-ic ${e.resolvido ? 'ok' : ''}">${e.resolvido ? I.okc : I.alerta}</span><div class="grow"><b class="erro-msg">${esc(erroPT(e.msg) || e.msg)}</b>
        <div class="small muted">${e.vezes}× · ${pessoas.length ? esc(pessoas.join(', ')) + ((e.usuarios || []).length > 4 ? ` e mais ${(e.usuarios || []).length - 4}` : '') : 'sem login'} · área do ${e.area === 'treinador' ? 'treinador' : 'aluno'}</div>
        <div class="tiny dim">Última vez ${quando(e.ultimo_em)}${e.vezes > 1 ? ` · primeira ${quando(e.primeiro_em)}` : ''} · tela ${esc(e.url || '#/')} · ${esc(aparelhoTxt(e.ua))}</div></div></div>
      <details class="erro-det"><summary class="tiny">Detalhes técnicos</summary><pre>${esc(e.msg)}${e.stack ? '\n\n' + esc(e.stack) : ''}</pre></details>
      <div class="erro-acoes"><button type="button" class="link-btn small" data-copiar-erro="${e.id}">${I.copy || ''}Copiar erro</button>${e.resolvido ? `<button type="button" class="link-btn small" data-reabrir="${e.id}">Reabrir</button>` : `<button type="button" class="btn sm" data-resolver="${e.id}">Resolvido</button>`}<button type="button" class="link-btn small" data-apagar-erro="${e.id}">Apagar</button></div></div>`;
  };
  $app.innerHTML = `<p class="eyebrow">Mais</p><h1 class="h1">Erros do app</h1>
    <p class="muted small" style="margin-top:6px">Quando algo dá errado no app de um aluno ou de um treinador, o erro aparece aqui sozinho, com quem pegou, em que tela e em qual aparelho. Erros iguais se juntam num só.</p>
    <div class="section"><div class="section-h"><h2 class="h2">Abertos${abertos.length ? ` <span class="tag acc">${abertos.length}</span>` : ''}</h2></div>
      ${abertos.length ? `<div class="stack">${abertos.map(item).join('')}</div>` : `<div class="empty"><div class="h3">Nenhum erro aberto</div><p class="small muted">Tudo funcionando para os alunos.</p></div>`}</div>
    ${resolvidos.length ? `<div class="section"><div class="section-h"><h2 class="h2">Resolvidos</h2></div><div class="stack">${resolvidos.slice(0, 30).map(item).join('')}</div></div>` : ''}`;
  $app.onclick = async (ev) => {
    const cp = ev.target.closest('[data-copiar-erro]');
    if (cp) {
      const e = (erros || []).find((x) => x.id === Number(cp.dataset.copiarErro));
      if (!e) return;
      const pessoas = (e.usuarios || []).map((u) => nomes[u] || 'alguém de fora');
      const texto = [
        `Erro no app Nexos — pode corrigir?`,
        '',
        `Resumo: ${erroPT(e.msg) || e.msg}`,
        `Mensagem: ${e.msg}`,
        `Tela: ${e.url || '#/'} (área do ${e.area === 'treinador' ? 'treinador' : 'aluno'})`,
        `Aparelho: ${aparelhoTxt(e.ua)} — ${e.ua || 'desconhecido'}`,
        `Aconteceu ${e.vezes}× com ${pessoas.length ? pessoas.join(', ') : 'quem estava sem login'}`,
        `Primeira vez: ${quando(e.primeiro_em)} · Última: ${quando(e.ultimo_em)} · Versão ${e.versao || '?'} · Código do erro #${e.id}`,
        '',
        'Detalhes técnicos:',
        e.stack || '(sem detalhes)',
      ].join('\n');
      try {
        await navigator.clipboard.writeText(texto);
      } catch {
        const t = document.createElement('textarea');
        t.value = texto;
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try {
          document.execCommand('copy');
        } catch {}
        t.remove();
      }
      return toast('Copiado! Cole na conversa com o Claude.');
    }
    const r = ev.target.closest('[data-resolver],[data-reabrir],[data-apagar-erro]');
    if (!r) return;
    const id = Number(r.dataset.resolver || r.dataset.reabrir || r.dataset.apagarErro);
    if (r.dataset.apagarErro && !confirm('Apagar este erro da lista?')) return;
    const q = r.dataset.apagarErro
      ? sb.from('nx_erros').delete().eq('id', id)
      : sb.from('nx_erros').update({ resolvido: !!r.dataset.resolver }).eq('id', id);
    const { error: er } = await q;
    if (er) return toast('Não foi possível salvar.', true);
    S.cache.errosAbertos = null;
    toast(r.dataset.resolver ? 'Marcado como resolvido.' : r.dataset.reabrir ? 'Erro reaberto.' : 'Erro apagado.');
    staffErros();
  };
}

if (window.NX_DEMO)
  window.__nx = {
    loading,
    toast,
    garminItem,
    CICLOS_CORR,
    cicSemanas,
    kmDe,
    perfilNiv,
    analisarDesemp,
    desempHTML,
    tipoDoTeste,
    calcularTeste,
  };
iniciar();
