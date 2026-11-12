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
  ];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const card = (d) => `<figure class="depo">
      ${d.foto ? `<div class="depo-foto"><img src="${esc(d.foto)}" alt="${esc(d.nome)}" loading="lazy">${d.foto2 ? `<img class="depo-foto2" src="${esc(d.foto2)}" alt="" loading="lazy">` : ''}</div>` : ''}
      <div class="depo-corpo">
        <span class="depo-aspas" aria-hidden="true">“</span>
        <blockquote>${esc(d.texto)}</blockquote>
        ${d.conquistas && d.conquistas.length ? `<ul class="depo-conq">${d.conquistas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <figcaption><b>${esc(d.nome)}</b><span>${esc(d.quem || '')}</span></figcaption>
      </div>
    </figure>`;
  // versão compacta (topo da página de planos): texto em poucas linhas, com "Ler o depoimento completo"
  const compacto = (d) => `<figure class="depo depo-c">
      <div class="depo-c-top">${d.foto ? `<img class="depo-c-foto" src="${esc(d.foto)}" alt="${esc(d.nome)}" loading="lazy">` : ''}
        <figcaption><b>${esc(d.nome)}</b><span>${esc(d.quem || '')}</span></figcaption></div>
      ${d.conquistas && d.conquistas.length ? `<ul class="depo-conq">${d.conquistas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <blockquote class="depo-c-txt">“${esc(d.texto)}”</blockquote>
      <button type="button" class="depo-c-mais">Ler o depoimento completo</button>
    </figure>`;
  document.querySelectorAll('[data-depoimentos]').forEach((box) => {
    const c = box.classList.contains('compacto');
    box.classList.toggle('varios', DEPOIMENTOS.length > 1);
    box.innerHTML = DEPOIMENTOS.map(c ? compacto : card).join('');
    // vários depoimentos: carrossel de arrastar, com bolinhas e setas
    if (DEPOIMENTOS.length > 1) {
      const nav = document.createElement('div');
      nav.className = 'depo-nav';
      nav.innerHTML = `<button type="button" class="depo-seta" data-d="-1" aria-label="Anterior">‹</button>${DEPOIMENTOS.map((_, i) => `<button type="button" class="depo-pt${i ? '' : ' on'}" data-i="${i}" aria-label="Depoimento ${i + 1}"></button>`).join('')}<button type="button" class="depo-seta" data-d="1" aria-label="Próximo">›</button>`;
      box.after(nav);
      const cards = [...box.children];
      const atual = () => Math.round(box.scrollLeft / (box.scrollWidth / cards.length));
      const ir = (i) => {
        i = Math.max(0, Math.min(cards.length - 1, i));
        box.scrollTo({ left: i * (box.scrollWidth / cards.length), behavior: 'smooth' });
      };
      nav.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        ir(b.dataset.i != null ? +b.dataset.i : atual() + +b.dataset.d);
      });
      box.addEventListener(
        'scroll',
        () => nav.querySelectorAll('.depo-pt').forEach((p, i) => p.classList.toggle('on', i === atual())),
        { passive: true },
      );
    }
    box.querySelectorAll('.depo-c-mais').forEach((b) => {
      const t = b.previousElementSibling;
      if (t.scrollHeight <= t.clientHeight + 2) return b.remove();
      b.onclick = () => {
        const ab = t.classList.toggle('aberto');
        b.textContent = ab ? 'Mostrar menos' : 'Ler o depoimento completo';
      };
    });
  });
})();
