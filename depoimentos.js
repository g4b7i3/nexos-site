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
  ];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const card = (d) => `<figure class="depo">
      ${d.foto ? `<div class="depo-foto"><img src="${esc(d.foto)}" alt="${esc(d.nome)}" loading="lazy"></div>` : ''}
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
