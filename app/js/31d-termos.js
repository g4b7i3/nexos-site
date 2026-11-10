/* ---------- Meus termos (aluno): o compromisso com a Nexos e os termos aceitos, para ler e baixar em PDF ---------- */
const TERMOS_IC =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg>';
const BAIXAR_IC =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>';
const PCT_PERIODO = { 1: 0, 3: 3, 6: 6, 12: 10 };
const JSPDF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
let jspdfP = null;
const carregarJsPDF = () =>
  (jspdfP =
    jspdfP ||
    new Promise((res, rej) => {
      if (window.jspdf) return res(window.jspdf);
      const s = document.createElement('script');
      s.src = JSPDF_JS;
      s.onload = () => (window.jspdf ? res(window.jspdf) : rej(new Error('vazio')));
      s.onerror = () => {
        jspdfP = null;
        rej(new Error('Não foi possível gerar o PDF. Verifique a internet e tente de novo.'));
      };
      document.head.appendChild(s);
    }));

async function carregarTermos() {
  const [{ data: ads }, { data: cons }] = await Promise.all([
    sb
      .from('nx_adesoes')
      .select('*')
      .eq('org_id', S.org.id)
      .eq('aluno_id', S.user.id)
      .order('aceito_em', { ascending: false })
      .limit(1),
    sb
      .from('nx_consentimentos')
      .select('versao,aceito_em,termo_riscos,responsavel_nome')
      .eq('org_id', S.org.id)
      .eq('aluno_id', S.user.id)
      .order('aceito_em', { ascending: false })
      .limit(1),
  ]);
  return { adesao: (ads || [])[0] || null, cons: (cons || [])[0] || null };
}

const somaMesesData = (iso, n) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d;
};
// em que mês do compromisso o aluno está (1 = primeiro mês)
const mesDoCompromisso = (iso) => {
  const a = new Date(iso),
    h = new Date();
  let m = (h.getFullYear() - a.getFullYear()) * 12 + (h.getMonth() - a.getMonth());
  if (h.getDate() < a.getDate()) m--;
  return Math.max(1, m + 1);
};
// preço cheio (mensal) do mesmo plano e da mesma forma de pagamento, quando o plano é um dos da página de planos
function mensalCheio(ad) {
  const pl = PLANOS_NEXOS.find((p) => p.nome === ad.plano_nome);
  if (!pl) return null;
  return ad.forma === 'cartao' || ad.forma === 'parc' ? pl.cartao[0] : pl.pix[0];
}

function compromissoHTML(ad) {
  const c = +ad.compromisso || 1;
  const nomeP = COMPROMISSO_NOME[c] || '';
  const assinado = fmtDia(ad.aceito_em);
  if (c < 3)
    return `<div class="card cmp-card mensal"><span class="eyebrow">Plano mensal</span><div class="h2" style="margin-top:4px">${esc(ad.plano_nome || 'Plano Nexos')}</div>
      <p class="small muted" style="margin-top:6px">Termo de Adesão assinado em ${assinado}. Sem compromisso de período: você pode cancelar quando quiser, com aviso ao treinador.</p>
      <p class="small" style="margin-top:10px">Quer pagar menos por mês? No trimestral, semestral e anual a mensalidade cai até 10%. Fale com o seu treinador.</p></div>`;
  const fim = somaMesesData(ad.aceito_em, c);
  const mes = Math.min(c, mesDoCompromisso(ad.aceito_em));
  const cheio = mensalCheio(ad);
  const mensal = +ad.valor || 0;
  const econMes = cheio && mensal && cheio > mensal ? cheio - mensal : 0;
  const econTotal =
    ad.forma === 'avista' && cheio
      ? cheio * 12 - PLANOS_NEXOS.find((p) => p.nome === ad.plano_nome).avista
      : econMes * c;
  const camisetas = c === 12 ? 2 : c === 6 && /Integral/.test(ad.plano_nome || '') ? 1 : 0;
  const multaHoje = econMes && (ad.forma === 'pix' || ad.forma === 'cartao') ? econMes * mes : 0;
  return `<div class="card cmp-card">
    <div class="cmp-topo"><span class="cmp-selo">${TERMOS_IC}</span><div class="grow" style="min-width:0"><span class="eyebrow">Compromisso ${nomeP}</span><div class="h2" style="margin-top:2px">${esc(ad.plano_nome || 'Plano Nexos')}</div></div></div>
    <p class="cmp-frase">Você assinou o Termo de Adesão e garantiu <b>${c} meses de assessoria</b> com <b>${PCT_PERIODO[c]}% de desconto</b> em todas as mensalidades.</p>
    <div class="cmp-datas"><div><small>ASSINADO EM</small><b>${assinado}</b></div><div><small>VÁLIDO ATÉ</small><b>${fmtDia(fim.toISOString())}</b></div><div><small>FORMA</small><b>${esc(FORMAS_PLANO[ad.forma] || 'Combinada com o treinador')}</b></div></div>
    <div class="cmp-prog"><div class="cmp-prog-t"><span>Mês <b>${mes}</b> de ${c}</span><span>${Math.round((mes / c) * 100)}%</span></div><div class="cmp-bar"><i style="width:${(mes / c) * 100}%"></i></div></div>
    <div class="cmp-ben">
      <div><small>SEU BENEFÍCIO</small><b>${PCT_PERIODO[c]}% de desconto</b>${econTotal > 0 ? `<span>${brl(econTotal)} de economia no período</span>` : '<span>em todas as mensalidades</span>'}</div>
      ${camisetas ? `<div><small>PRESENTE</small><b>${camisetas === 2 ? '2 camisetas' : '1 camiseta'}</b><span>oficiais da Nexos</span></div>` : `<div><small>VALOR FIXO</small><b>Sem reajuste</b><span>até o fim do período</span></div>`}
    </div>
    <div class="cmp-aviso"><b>Um compromisso sério, dos dois lados.</b> A Nexos garante o seu acompanhamento e o valor fixo até ${fmtDia(fim.toISOString())}. Você garante a permanência pelos ${c} meses: é isso que dá direito ao desconto. Se cancelar antes do fim, ${
      ad.forma === 'avista' || ad.forma === 'parc'
        ? 'recebe de volta o valor pago menos os meses já utilizados, cobrados pelo preço do mensal'
        : `paga a diferença entre o valor com desconto e o mensal dos meses já utilizados${multaHoje ? ` (hoje, no mês ${mes}, seriam ${brl(multaHoje)})` : ''}`
    }, como prevê a cláusula 4 do termo.</div>
  </div>`;
}

async function viewTermos() {
  loading();
  const { adesao, cons } = await carregarTermos();
  const doc = (k, t, d, ok) =>
    `<div class="list-item termo-it"><span class="ativ-ic">${TERMOS_IC}</span><div class="grow" style="min-width:0"><b>${t}</b><div class="small muted">${d}</div>${ok ? `<span class="tag ok" style="margin-top:6px">${ok}</span>` : ''}</div>
      <div class="termo-bt"><button class="btn ghost sm" data-ler="${k}">Ler</button><button class="btn sm" data-pdf="${k}">${BAIXAR_IC} PDF</button></div></div>`;
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Conta</p><h1 class="h1">Meus termos</h1>
    <p class="muted small" style="margin-top:6px">Os documentos que você aceitou na Nexos, com data e versão. Leia quando quiser e baixe uma cópia em PDF.</p>
    ${adesao ? `<div style="margin-top:16px">${compromissoHTML(adesao)}</div>` : ''}
    <p class="sec-lbl">Documentos</p><div class="stack">
      ${adesao ? doc('adesao', 'Termo de Adesão', `${esc(adesao.plano_nome || '')} · ${COMPROMISSO_NOME[adesao.compromisso] || ''} · versão ${esc(adesao.versao)}`, `Assinado em ${fmtDia(adesao.aceito_em)}`) : ''}
      ${doc('dados', 'Termo de consentimento de dados', 'Seus dados de saúde e fotos, conforme a LGPD', cons ? `Aceito em ${fmtDia(cons.aceito_em)} · versão ${esc(cons.versao)}` : '')}
      ${doc('riscos', 'Termo de responsabilidade e riscos', 'Riscos da atividade física e cuidados com a saúde', cons && cons.termo_riscos ? `Aceito em ${fmtDia(cons.aceito_em)}` : '')}
    </div>
    <p class="small muted" style="margin-top:16px">Dúvidas sobre os termos? Fale com o seu treinador ou escreva para <b>${esc(CONTATO.email)}</b>.</p>`;
  const dados = { adesao, cons };
  $app.querySelectorAll('[data-ler]').forEach(
    (b) =>
      (b.onclick = () => {
        const t = termoDoc(b.dataset.ler, dados);
        openSheet(
          `<p class="eyebrow">${esc(t.reg)}</p><div class="h2" style="margin-top:4px">${esc(t.titulo)}</div><div class="card termo" style="margin-top:14px;max-height:none">${t.html}</div><button class="btn block" id="sh-pdf" style="margin-top:14px">Baixar em PDF</button>`,
          (r) => (r.querySelector('#sh-pdf').onclick = (e) => baixarTermoPDF(b.dataset.ler, dados, e.currentTarget)),
        );
      }),
  );
  $app.querySelectorAll('[data-pdf]').forEach((b) => (b.onclick = () => baixarTermoPDF(b.dataset.pdf, dados, b)));
}

// texto e registro de cada termo (o mesmo na tela e no PDF)
function termoDoc(k, { adesao, cons }) {
  const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  if (k === 'adesao' && adesao)
    return {
      titulo: 'Termo de Adesão aos Planos da Nexos',
      arq: 'Termo-de-Adesao-Nexos',
      html: adesaoTexto({
        nome: S.me.nome,
        cpf: adesao.cpf || '',
        email: S.me.email || S.user.email || '',
        telefone: S.me.telefone ? MASCARA.tel(S.me.telefone) : '',
      }),
      reg: `Assinado em ${fmtDia(adesao.aceito_em)}`,
      registro: [
        `Aluno(a): ${S.me.nome}${adesao.cpf ? ', CPF ' + adesao.cpf : ''}`,
        `Plano: ${adesao.plano_nome || ''} · período ${COMPROMISSO_NOME[adesao.compromisso] || ''}${adesao.forma ? ' · ' + (FORMAS_PLANO[adesao.forma] || '') : ''}${adesao.valor ? ' · ' + brl(adesao.valor) + ' por mês' : ''}`,
        `Aceite eletrônico em ${quando(adesao.aceito_em)}, versão ${adesao.versao}${adesao.ip ? ', IP ' + adesao.ip : ''}`,
      ],
    };
  const base = cons
    ? [
        `Aluno(a): ${S.me.nome}${cons.responsavel_nome ? ' · aceito pelo responsável legal ' + cons.responsavel_nome : ''}`,
        `Aceite eletrônico em ${quando(cons.aceito_em)}, versão ${cons.versao}`,
      ]
    : [];
  if (k === 'riscos')
    return {
      titulo: 'Termo de responsabilidade e assunção de riscos',
      arq: 'Termo-de-Responsabilidade-Nexos',
      html: termoRiscosTexto(),
      reg: cons ? `Aceito em ${fmtDia(cons.aceito_em)}` : 'Termo',
      registro: base,
    };
  return {
    titulo: 'Termo de consentimento para tratamento de dados',
    arq: 'Termo-de-Consentimento-Nexos',
    html: termoTexto(),
    reg: cons ? `Aceito em ${fmtDia(cons.aceito_em)}` : 'Termo',
    registro: base,
  };
}

// HTML do termo em blocos de texto: título de seção, parágrafo ou item de lista
function termoBlocos(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const out = [];
  div.querySelectorAll('p, li').forEach((el) => {
    if (el.tagName === 'P' && el.querySelector('li')) return;
    const txt = el.textContent.replace(/\s+/g, ' ').trim();
    if (!txt) return;
    const b = el.querySelector('b');
    const soTitulo = el.tagName === 'P' && b && b.textContent.trim() === txt;
    out.push({
      tipo: el.tagName === 'LI' ? 'li' : soTitulo ? 'h' : 'p',
      txt,
      rot: b && !soTitulo ? b.textContent.trim() : '',
    });
  });
  return out.slice(1); // o primeiro parágrafo é o título com a versão (vai no cabeçalho do PDF)
}
// as fontes padrão do PDF só têm o alfabeto latino básico
const pdfTxt = (t) =>
  String(t || '')
    .replace(/[−–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/→/g, '->')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

async function baixarTermoPDF(k, dados, btn) {
  const t = termoDoc(k, dados);
  const txtAnt = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Gerando…';
  }
  try {
    const { jsPDF } = await carregarJsPDF();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const M = 18,
      W = 210 - 2 * M,
      FIM = 297 - 18;
    let y = 20;
    const pagina = () => {
      pdf.addPage();
      y = 20;
    };
    const escreve = (texto, { tam = 10, neg = false, cor = [40, 48, 66], rot = '', rec = 0, esp = 1.6 } = {}) => {
      pdf.setFontSize(tam);
      const linhas = pdf.splitTextToSize(pdfTxt(texto), W - rec);
      const lh = tam * 0.42;
      linhas.forEach((ln, i) => {
        if (y + lh > FIM) pagina();
        // rótulo em negrito no começo do parágrafo (ex.: "Atraso:")
        if (i === 0 && rot && ln.startsWith(pdfTxt(rot))) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(11, 24, 52);
          pdf.text(pdfTxt(rot), M + rec, y);
          const w = pdf.getTextWidth(pdfTxt(rot));
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...cor);
          pdf.text(ln.slice(pdfTxt(rot).length), M + rec + w, y);
        } else {
          pdf.setFont('helvetica', neg ? 'bold' : 'normal');
          pdf.setTextColor(...cor);
          pdf.text(ln, M + rec, y);
        }
        y += lh;
      });
      y += esp;
    };
    // cabeçalho
    pdf.setFillColor(11, 24, 52);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text('NEXOS PERFORMANCE E SAÚDE', M, 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(159, 233, 255);
    pdf.text(pdfTxt('CNPJ 66.401.426/0001-65 · São Luís - MA · nexosperformanceesaude.com.br'), M, 21);
    y = 42;
    escreve(t.titulo, { tam: 15, neg: true, cor: [11, 24, 52], esp: 3 });
    termoBlocos(t.html).forEach((b) => {
      if (b.tipo === 'h') {
        y += 2;
        escreve(b.txt, { tam: 11, neg: true, cor: [11, 24, 52], esp: 1.2 });
      } else if (b.tipo === 'li') {
        pdf.setFillColor(47, 107, 255);
        if (y + 4 > FIM) pagina();
        pdf.circle(M + 1.3, y - 1.2, 0.7, 'F');
        escreve(b.txt, { rot: b.rot, rec: 5, esp: 1.4 });
      } else escreve(b.txt, { rot: b.rot });
    });
    // registro do aceite
    if (t.registro.length) {
      y += 4;
      const alt = 10 + t.registro.length * 5.6;
      if (y + alt > FIM) pagina();
      pdf.setDrawColor(47, 107, 255);
      pdf.setFillColor(238, 243, 255);
      pdf.roundedRect(M, y, W, alt, 2, 2, 'FD');
      y += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(11, 24, 52);
      pdf.text('REGISTRO DO ACEITE ELETRÔNICO', M + 5, y);
      y += 5.6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(40, 48, 66);
      t.registro.forEach((l) => {
        pdf.text(pdf.splitTextToSize(pdfTxt(l), W - 10)[0], M + 5, y);
        y += 5.6;
      });
    }
    const n = pdf.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7.5);
      pdf.setTextColor(122, 136, 168);
      pdf.text(
        pdfTxt(
          `${t.titulo} · página ${i} de ${n} · documento gerado pelo aplicativo Nexos em ${new Date().toLocaleDateString('pt-BR')}`,
        ),
        M,
        297 - 9,
      );
    }
    const nome = `${t.arq}-${firstName(S.me.nome)}.pdf`;
    const blob = pdf.output('blob');
    const arq = new File([blob], nome, { type: 'application/pdf' });
    if (!ehDesk() && navigator.canShare && navigator.canShare({ files: [arq] })) {
      await navigator.share({ files: [arq], title: t.titulo }).catch(() => {});
    } else pdf.save(nome);
  } catch (e) {
    toast(e.message || 'Não foi possível gerar o PDF.', true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = txtAnt;
    }
  }
}
