/* Nexos · Depoimentos de alunos (site e página de planos).
   Para acrescentar um depoimento: copie um bloco da lista abaixo, troque os dados e, se tiver foto, coloque em /img/depoimentos/.
   Só depoimentos reais, enviados pelo próprio aluno, com autorização para publicar. */
'use strict';
(function () {
  const DEPOIMENTOS = [
    {
      nome: 'Elizabeth Ribeiro',
      quem: 'Aluna · Belo Horizonte (MG)',
      foto: '/img/depoimentos/elizabeth.jpg',
      conquistas: ['Sub-2 na meia maratona', 'Primeira maratona concluída'],
      texto:
        'Minha satisfação com o treinador Gabriel Vinícius é enorme! Com sua metodologia e acompanhamento, conquistei o sub-2 na meia maratona e completei minha primeira maratona com muito sucesso. Hoje, sigo sendo treinada para o desafio da minha segunda maratona, com a mesma confiança e motivação. Um trabalho de muita qualidade, profissionalismo e suporte ao aluno. Um treinamento que entrega resultados e faz a diferença na evolução do atleta. Recomendo de olhos fechados!',
    },
    {
      nome: 'Kelly Stender',
      quem: 'Aluna · Alemanha',
      foto: '/img/depoimentos/kelly-trilha.jpg',
      foto2: '/img/depoimentos/kelly-academia.jpg',
      conquistas: ['Saiu do sedentarismo', 'Primeira trilha'],
      texto:
        'Sempre fui totalmente sedentária, mas hoje, aos 27, senti que precisava cuidar melhor da minha saúde. Ter um acompanhamento profissional tem sido essencial para eu não desistir. Depois de 2 meses, sinto uma enorme diferença no meu dia a dia, com mais força e fôlego para explorar coisas novas: da academia até a minha primeira trilha! Muito obrigada à equipe Nexos pela dedicação, disponibilidade e por estar sempre me orientando no que posso melhorar.',
    },
    {
      nome: 'Robenilson Muniz',
      quem: 'Aluno · Icatu (MA)',
      foto: '/img/depoimentos/robenilson.jpg',
      conquistas: ['Treino adaptado à rotina', 'Acompanhamento treino a treino'],
      texto:
        'Gosto muito da metodologia Nexos, principalmente pela maneira como vocês conversam com o atleta, procuram entender a rotina e adaptam os treinos de acordo com a realidade de cada um. Uma coisa que considero muito importante é o equilíbrio na distribuição das cargas, dando a devida importância ao descanso e à recuperação. Outro ponto é a preocupação da equipe em sempre procurar saber como foi o treino, como o atleta se sentiu e se conseguiu executar o que foi proposto. Isso faz muita diferença, porque mostra que não é simplesmente passar uma planilha, mas acompanhar de verdade a evolução do atleta.',
    },
  ];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const selos = (d) =>
    d.conquistas && d.conquistas.length
      ? `<ul class="depo-conq">${d.conquistas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
      : '';
  const fotos = (d) =>
    d.foto
      ? `<div class="depo-foto"><img src="${esc(d.foto)}" alt="${esc(d.nome)}" loading="lazy">${d.foto2 ? `<img class="depo-foto2" src="${esc(d.foto2)}" alt="" loading="lazy">` : ''}</div>`
      : '';
  // cartão do site: foto em cima com nome por cima, texto em poucas linhas e "Ler o depoimento completo"
  const card = (d, i) => `<figure class="depo" data-i="${i}">
      <div class="depo-topo">${fotos(d)}
        <figcaption><b>${esc(d.nome)}</b><span>${esc(d.quem || '')}</span></figcaption></div>
      <div class="depo-corpo">
        <svg class="depo-aspas" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14C0 6 4 1.5 12 0l1.5 3.5C9 5 7 8 7 11h6v13H0zm19 0V14c0-8 4-12.5 12-14l1.5 3.5C28 5 26 8 26 11h6v13H19z"/></svg>
        <blockquote>${esc(d.texto)}</blockquote>
        <button type="button" class="depo-mais">Ler o depoimento completo</button>
        ${selos(d)}
      </div>
    </figure>`;
  // versão compacta (topo da página de planos)
  const compacto = (d, i) => `<figure class="depo depo-c" data-i="${i}">
      <div class="depo-c-top">${d.foto ? `<img class="depo-c-foto" src="${esc(d.foto)}" alt="${esc(d.nome)}" loading="lazy">` : ''}
        <figcaption><b>${esc(d.nome)}</b><span>${esc(d.quem || '')}</span></figcaption></div>
      ${selos(d)}
      <blockquote>“${esc(d.texto)}”</blockquote>
      <button type="button" class="depo-mais">Ler o depoimento completo</button>
    </figure>`;
  // depoimento inteiro numa janela por cima da página
  const abrir = (d) => {
    const fundo = document.createElement('div');
    fundo.className = 'depo-modal';
    fundo.innerHTML = `<div class="depo-modal-box" role="dialog" aria-modal="true" aria-label="Depoimento de ${esc(d.nome)}">
        <button type="button" class="depo-fechar" aria-label="Fechar">×</button>
        ${fotos(d)}
        <div class="depo-modal-txt">
          <svg class="depo-aspas" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14C0 6 4 1.5 12 0l1.5 3.5C9 5 7 8 7 11h6v13H0zm19 0V14c0-8 4-12.5 12-14l1.5 3.5C28 5 26 8 26 11h6v13H19z"/></svg>
          <blockquote>${esc(d.texto)}</blockquote>${selos(d)}
          <p class="depo-modal-quem"><b>${esc(d.nome)}</b><span>${esc(d.quem || '')}</span></p>
        </div></div>`;
    const fechar = () => {
      fundo.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', tecla);
    };
    const tecla = (e) => e.key === 'Escape' && fechar();
    fundo.addEventListener('click', (e) => (e.target === fundo || e.target.closest('.depo-fechar')) && fechar());
    document.addEventListener('keydown', tecla);
    document.body.appendChild(fundo);
    document.body.style.overflow = 'hidden';
    fundo.querySelector('.depo-fechar').focus();
  };
  document.querySelectorAll('[data-depoimentos]').forEach((box) => {
    const c = box.classList.contains('compacto');
    box.innerHTML = DEPOIMENTOS.map(c ? compacto : card).join('');
    const cards = [...box.children];
    // "Ler o depoimento completo" só aparece quando o texto foi cortado
    const conferir = () =>
      cards.forEach((f) => {
        const t = f.querySelector('blockquote');
        f.querySelector('.depo-mais').hidden = t.scrollHeight <= t.clientHeight + 2;
      });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.depo-mais');
      if (b) abrir(DEPOIMENTOS[+b.closest('.depo').dataset.i]);
    });
    // carrossel: setas e bolinhas só quando nem todos cabem na tela
    const nav = document.createElement('div');
    nav.className = 'depo-nav';
    nav.innerHTML = `<button type="button" class="depo-seta" data-d="-1" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><span class="depo-pts">${cards.map((_, i) => `<button type="button" class="depo-pt" data-i="${i}" aria-label="Depoimento ${i + 1}"></button>`).join('')}</span><button type="button" class="depo-seta" data-d="1" aria-label="Próximo"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`;
    box.after(nav);
    const passo = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : box.clientWidth);
    const atual = () => Math.round(box.scrollLeft / passo());
    const visiveis = () => Math.max(1, Math.round(box.clientWidth / passo()));
    const marcar = () => {
      const a = atual();
      const v = visiveis();
      const fim = box.scrollLeft + box.clientWidth >= box.scrollWidth - 4;
      nav.querySelectorAll('.depo-pt').forEach((p, i) => {
        p.hidden = i > cards.length - v;
        p.classList.toggle('on', fim ? i === cards.length - v : i === a);
      });
      nav.querySelector('[data-d="-1"]').disabled = box.scrollLeft < 4;
      nav.querySelector('[data-d="1"]').disabled = fim;
    };
    const ajustar = () => {
      nav.hidden = box.scrollWidth <= box.clientWidth + 4;
      conferir();
      marcar();
    };
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const i = b.dataset.i != null ? +b.dataset.i : atual() + +b.dataset.d;
      box.scrollTo({ left: Math.max(0, i) * passo(), behavior: 'smooth' });
    });
    box.addEventListener('scroll', marcar, { passive: true });
    addEventListener('resize', ajustar);
    addEventListener('load', ajustar);
    ajustar();
  });
})();
