/* Nexos · monitoramento de erros das páginas públicas (site, planos, pré-temporada).
   Todo erro vai para a Saúde do sistema do app (Mais → Erros do app), marcado com a área "site". */
(function () {
  var URL = 'https://gbcshtmesawpokuwiaxb.supabase.co/rest/v1/rpc/nx_registrar_erro';
  var KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY3NodG1lc2F3cG9rdXdpYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MDg2MjYsImV4cCI6MjEwODk4NDYyNn0.ZR4vHBDAa_yMA8pSCWUriKAoh8OsEUKXO7WgZnR89Ak';
  var ORG = '937c7734-5b23-4cda-ba74-31c0171ed582';
  var enviados = {},
    n = 0;
  function reportar(err, onde) {
    try {
      var msg = String((err && (err.message || (typeof err.reason === 'string' && err.reason))) || err || '').slice(
        0,
        500,
      );
      // ruído de internet, extensões e navegadores embutidos que não é defeito do site
      if (
        !msg ||
        /ResizeObserver loop|^Script error\.?$|AbortError|Load failed|NetworkError|Failed to fetch|cancelad|The user aborted/i.test(
          msg,
        )
      )
        return;
      // código do navegador do Instagram e do Facebook (iabjs://), não do site
      if (/iabjs:\/\/|Java object is gone/.test(msg + ' ' + String((err && err.stack) || ''))) return;
      var chave = msg + '|' + onde;
      if (enviados[chave] || ++n > 10) return;
      enviados[chave] = 1;
      fetch(URL, {
        method: 'POST',
        keepalive: true,
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_org: ORG,
          p_msg: msg,
          p_stack: '[' + onde + ']\n' + String((err && err.stack) || '').slice(0, 3800),
          p_url: (location.pathname + location.hash).slice(0, 300),
          p_area: 'site',
          p_ua: navigator.userAgent,
          p_versao: 'site',
        }),
      }).catch(function () {});
    } catch (e) {}
  }
  window.nxReportarErro = reportar;
  addEventListener(
    'error',
    function (e) {
      if (e && e.target && e.target !== window && (e.target.src || e.target.href))
        return reportar('Arquivo não carregou: ' + (e.target.src || e.target.href), 'arquivo');
      if (e && (e.error || e.message)) reportar(e.error || e.message, 'erro na página');
    },
    true,
  );
  addEventListener('unhandledrejection', function (e) {
    reportar(e && e.reason, 'ação que falhou');
  });
})();
