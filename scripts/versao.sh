#!/bin/sh
# Marca a versão do app a cada commit: o app compara a versão do código aberto no celular com app/versao.json
# e, se for diferente (cópia velha guardada), apaga a cópia e recarrega. Instale uma vez:
#   ln -sf ../../scripts/versao.sh .git/hooks/pre-commit
# testes automáticos: se alguma conta do app sair errada, a versão não é criada e nada é publicado
for t in scripts/testes/*.test.js; do
  [ -f "$t" ] || continue
  node "$t" || { echo "Commit cancelado: o teste $t falhou."; exit 1; }
done
v="v$(date -u +%Y%m%d%H%M%S)"
sed -i "s/^const NX_BUILD = '[^']*';/const NX_BUILD = '$v';/" app/js/01-base.js
printf '{"v":"%s"}\n' "$v" > app/versao.json
git add app/js/01-base.js app/versao.json
