# Nexos — site e app

- Site estático + app em `/app` (aluno) e `/treinador` (equipe). Publicado direto do GitHub no Netlify, sem build.
- O código do app fica em `app/js/`, dividido por assunto em arquivos numerados (`01-base.js` … `32-erros-inicio.js`).
  - Eles são carregados em ordem por `<script>` em `app/index.html` e `treinador/index.html` e dividem o mesmo escopo global.
  - Ao criar um arquivo novo, inclua-o nos DOIS index.html, na posição certa. O `32-erros-inicio.js` precisa continuar sendo o último (ele chama `iniciar()`).
  - Código que roda na carga do arquivo só pode usar o que foi declarado no próprio arquivo ou nos anteriores; funções chamadas depois (eventos, rotas) podem estar em qualquer arquivo.
  - Formatação: Prettier 3.6 (`singleQuote`, `printWidth: 120`, `trailingComma: all`).
- Estilos em `app/app.css`. Service worker em `app/sw.js`.
- Central de ajuda do aluno em `ajuda/index.html` (PDFs em `ajuda/pdf/`) e do treinador em `treinador/ajuda/index.html` (com o `guia-do-treinador.pdf` na mesma pasta). Páginas estáticas, separadas. Quando uma função do app mudar, atualize o tutorial correspondente e os PDFs.
- Versão do app: cada commit precisa passar por `scripts/versao.sh` (troca `NX_BUILD` em `01-base.js` e grava `app/versao.json`). Instale o gancho uma vez: `ln -sf ../../scripts/versao.sh .git/hooks/pre-commit`. Com a versão nova, o celular que estiver com cópia velha apaga a cópia e recarrega sozinho.
- Atualização garantida para todos (regra fixa): nunca publicar sem passar pelo `scripts/versao.sh`, e nunca mudar o `app/sw.js` de um jeito que o aparelho possa ficar preso numa cópia velha sem a conferência de versão (`checarVersao` em `13-fotos-push.js`). Ao trocar algo no service worker, suba o nome do cache (`nx-app-vN`).
- Antes de cada push: juntar os arquivos de `app/js` e rodar o ESLint (variável não declarada e nome declarado duas vezes quebram o app inteiro, porque todos os arquivos dividem o mesmo escopo) e abrir o app no navegador sem erro no console.
