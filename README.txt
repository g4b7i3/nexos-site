NEXOS · Site de teste
=====================

COMO PUBLICAR NO NETLIFY
1. Acesse app.netlify.com/drop
2. Arraste a pasta "nexos-site" inteira (ou este .zip descompactado)
3. Pronto: o Netlify gera um link na hora.

O QUE EDITAR (arquivo script.js, bloco CONFIG no topo)
- whatsapp: número com DDI e DDD, só dígitos (ex: 5598912345678)
- instagram: link do perfil
- precoAvulsa: valor da aula avulsa
- diasFuncional: dias da semana do funcional (0=dom ... 6=sáb)
- horarios: horários das turmas
- vagasPorTurma: limite de vagas
- local: onde acontece o treino
- linkPix / linkCartao: links de pagamento (Mercado Pago, InfinitePay etc.)
- patrocinadores: lista de logos (imagens na pasta img/)

OBSERVAÇÃO
As vagas mostradas na aula avulsa são simuladas. Controle real de vagas e
confirmação automática de pagamento precisam de um backend (próxima etapa).
Textos marcados como "Edite aqui" no FAQ devem ser trocados.

MODELOS DE TREINO (musculação)
- No script.js, procure "WORKOUTS". Cada exercício é:
  ['Nome', séries, 'repetições', descanso em segundos]
- Dá pra trocar exercícios, criar objetivos novos ou remover os que não quiser.

ESTRUTURA DO FUNCIONAL
- No index.html, procure class="aula" para ajustar as etapas e os minutos.

CORES (tema claro/escuro)
- Botão de sol/lua no menu troca entre azul-marinho (escuro) e branco com azul-marinho (claro).
- O site lembra a escolha da pessoa na próxima visita.
- As cores ficam no style.css: bloco ":root" (escuro) e ':root[data-theme="light"]' (claro).

TREINADORES
- Fotos em img/treinadores/ (retrato do card + fotos da galeria).
- Para adicionar foto na galeria: copie um bloco <button class="gal-item" ...> no index.html
  e troque o caminho da imagem e a legenda.
- O botão flutuante "Conheça os treinadores" aparece depois do topo e some quando a seção está na tela.

LOGO ANIMADA NO FUNDO
- A logo grande fica atrás do site inteiro e se move com a rolagem (desliza, gira e cresce de leve).
- Efeitos contínuos: contorno se desenhando, brilho passando, ecos/rastros de movimento e respiração.
- Cada seção muda o efeito (brilho, ecos, contorno, linhas de scanner). No script.js, procure "const FX".
- Intensidade: no style.css, bloco "FUNDO: logo grande animada" (valores de opacity).
