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
# quantos arquivos de código a página carrega: o celular que abrir uma página velha (lista antiga) com código novo percebe e recarrega
n=$(grep -c 'src="js/[0-9]' app/index.html)
nt=$(grep -c 'src="../app/js/[0-9]\|src="/app/js/[0-9]\|src="js/[0-9]' treinador/index.html)
[ "$n" = "$nt" ] || { echo "Commit cancelado: app/index.html tem $n arquivos e treinador/index.html tem $nt."; exit 1; }
printf '{"v":"%s","n":%s}\n' "$v" "$n" > app/versao.json
git add app/js/01-base.js app/versao.json
