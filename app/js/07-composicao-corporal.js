/* Nexos App · Composição corporal no formato de relatório de bioimpedância.
   Parte 7 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- composição corporal no formato de relatório de bioimpedância ---------- */
// faixas de % de gordura (American Council on Exercise)
const FAIXAS_G = {
  M: [
    [2, 'Essencial'],
    [6, 'Atleta'],
    [14, 'Boa forma'],
    [18, 'Aceitável'],
    [25, 'Excesso'],
    [45, ''],
  ],
  F: [
    [10, 'Essencial'],
    [14, 'Atleta'],
    [21, 'Boa forma'],
    [25, 'Aceitável'],
    [32, 'Excesso'],
    [50, ''],
  ],
};
const faixaG = (g, sx) => {
  const F = FAIXAS_G[sx];
  if (!F || g == null) return '';
  let n = F[0][1];
  F.forEach(([v, l], i) => {
    if (g >= v && l) n = l;
  });
  return n;
};
function composicaoHTML(av, r, ra) {
  const sx = av.sexo,
    peso = num(av.peso);
  if (r.gordura == null || !peso || !FAIXAS_G[sx]) return '';
  const F = FAIXAS_G[sx],
    min = F[0][0],
    max = F[F.length - 1][0],
    pos = Math.max(0, Math.min(100, ((r.gordura - min) / (max - min)) * 100));
  const seg = F.slice(0, -1)
    .map(([v, l], i) => `<i style="flex:${F[i + 1][0] - v}" class="fx${i}"><span>${l}</span></i>`)
    .join('');
  const pctM = Math.round((r.massa_magra / peso) * 100),
    pctG = 100 - pctM;
  const linha = (l, v, ant, u, bom, dec = 1, sub = '') =>
    v == null
      ? ''
      : `<div class="cb-l"><span>${l}${sub ? `<em>${sub}</em>` : ''}</span><b>${f1(v, dec)}${u}</b>${ant != null ? deltaTag(v - ant, bom, u.trim() ? ' ' + u.trim() : '', dec) : '<span></span>'}</div>`;
  return `<div class="card comp-bio"><div class="row between"><span class="eyebrow">Composição corporal</span><span class="tiny dim">${av.metodo === 'bioimpedancia' ? 'bioimpedância' : av.metodo === 'perimetros' ? 'estimada por perímetros' : 'estimada por dobras cutâneas'}</span></div>
    <div class="cb-top"><div><b>${f1(r.gordura)}<small>%</small></b><span>gordura corporal · ${faixaG(r.gordura, sx)}</span></div></div>
    <div class="cb-faixa"><div class="cb-seg">${seg}</div><div class="cb-pin" style="left:${pos}%"></div></div>
    <div class="cb-pizza"><div class="cb-bar"><i style="width:${pctM}%">${pctM}% massa magra</i><i style="width:${pctG}%">${pctG}%</i></div></div>
    <div class="cb-lista">
      ${linha('Peso', peso, null, ' kg', null)}
      ${linha('Massa magra', r.massa_magra, ra.massa_magra, ' kg', 'up', 1, 'músculos, ossos, órgãos e água')}
      ${linha('Massa gorda', r.massa_gorda, ra.massa_gorda, ' kg', 'down')}
      ${linha('Água corporal', r.agua_l, ra.agua_l, ' L', null, 1, r.agua_pct ? `${f1(r.agua_pct)}% do peso (Watson)` : '')}
      ${linha('Metabolismo basal', r.tmb, ra.tmb, ' kcal', null, 0, r.tmb_metodo || '')}
      ${linha('IMC', r.imc, ra.imc, '', null, 1, clsIMC(r.imc))}
      ${r.rfm != null ? linha('Massa gorda relativa (RFM)', r.rfm, ra.rfm, '%', 'down', 1, 'conferência pela cintura e altura') : ''}
    </div>
    <p class="tiny dim" style="margin-top:8px">${av.metodo === 'perimetros' ? 'Estimativa pelas medidas de fita (Hodgdon e Beckett, 1984), com erro típico de 3 a 4%, semelhante ao de balanças de bioimpedância domésticas. Para comparar, use sempre o mesmo método e meça nas mesmas condições.' : 'Para comparar a evolução, use sempre o mesmo método e meça nas mesmas condições.'}</p></div>`;
}
// Faixa saudável de % de gordura por idade e sexo (Gallagher et al., 2000, Am J Clin Nutr), a mesma referência das balanças de bioimpedância:
// [idade até, saudável de, saudável até, obesidade a partir de]
const GALLAGHER = {
  F: [
    [39, 21, 33, 39],
    [59, 23, 34, 40],
    [200, 24, 36, 42],
  ],
  M: [
    [39, 8, 19, 25],
    [59, 11, 21, 28],
    [200, 13, 24, 30],
  ],
};
function metasHTML(av, r) {
  const sx = av.sexo,
    idade = num(av.idade),
    peso = num(av.peso),
    alt = num(av.altura),
    cint = num((av.perimetros || {}).cintura);
  if (!sx || !peso || !(idade >= 18)) return '';
  const fxG = GALLAGHER[sx].find((x) => idade <= x[0]),
    [, gMin, gMax, gOb] = fxG;
  const temComp = r.gordura != null && r.massa_magra;
  const kg = (v) => f1(v, 1).replace(',0', '');
  const faixaIdade = idade < 40 ? '20 a 39 anos' : idade < 60 ? '40 a 59 anos' : '60 anos ou mais';
  const linhas = [],
    tag = (ok, t) => `<span class="mt-tag ${ok ? 'ok' : 'at'}">${t || (ok ? 'Dentro' : 'Fora')}</span>`;
  let kpis = '',
    plano = '',
    regua = '';
  if (temComp) {
    const g = r.gordura,
      mm = r.massa_magra,
      mid = Math.round((gMin + gMax) / 2);
    const pesoCom = (pct) => mm / (1 - pct / 100); // mesmo peso de massa magra, outra % de gordura
    let meta = null,
      etapa1 = null;
    if (g > gMax) {
      meta = mid;
      etapa1 = gMax;
    } else if (g > mid + 1) meta = mid;
    else if (g < gMin) meta = gMin;
    const st = g > gOb ? 'Obesidade' : g > gMax ? 'Acima do ideal' : g < gMin ? 'Abaixo do ideal' : 'Saudável';
    // régua: abaixo · saudável · acima · obesidade, com o ponto de hoje e o da meta
    const lo = Math.max(0, gMin - 8),
      hi = gOb + 10,
      pc = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
    regua = `<div class="mt-regua"><div class="mt-faixas"><i class="b0" style="width:${pc(gMin)}%"></i><i class="b1" style="width:${pc(gMax) - pc(gMin)}%"></i><i class="b2" style="width:${pc(gOb) - pc(gMax)}%"></i><i class="b3" style="width:${100 - pc(gOb)}%"></i></div>
      <span class="mt-pin hoje" style="left:${pc(g)}%"><b>Hoje ${f1(g)}%</b></span>${meta != null ? `<span class="mt-pin meta" style="left:${pc(meta)}%"><b>Meta ${meta}%</b></span>` : ''}
      <div class="mt-leg"><span style="left:${pc(gMin) / 2}%">Abaixo</span><span style="left:${(pc(gMin) + pc(gMax)) / 2}%">Saudável ${gMin}–${gMax}%</span><span style="left:${(pc(gMax) + pc(gOb)) / 2}%">Acima</span><span style="left:${(pc(gOb) + 100) / 2}%">Obesidade</span></div></div>`;
    linhas.push(['Gordura corporal', `${gMin} a ${gMax}%`, `${f1(g)}%`, tag(g >= gMin && g <= gMax, st)]);
    linhas.push([
      'Massa gorda',
      `${kg((mm * gMin) / (100 - gMin))} a ${kg((mm * gMax) / (100 - gMax))} kg`,
      `${kg(r.massa_gorda)} kg`,
      tag(g >= gMin && g <= gMax),
    ]);
    linhas.push([
      'Peso saudável mantendo a sua massa magra',
      `${kg(pesoCom(gMin))} a ${kg(pesoCom(gMax))} kg`,
      `${kg(peso)} kg`,
      tag(peso >= pesoCom(gMin) - 0.5 && peso <= pesoCom(gMax) + 0.5),
    ]);
    linhas.push(['Massa magra', 'manter ou aumentar', `${kg(mm)} kg`, '<span class="mt-tag neu">Proteger</span>']);
    if (meta != null) {
      const pMeta = pesoCom(meta),
        dif = peso - pMeta,
        perder = dif > 0;
      // perda: 0,5 a 1% do peso por semana preserva a massa magra (Helms et al., 2014; Garthe et al., 2011)
      // ganho de massa magra: cerca de 0,5 a 1 kg por mês em homens e metade disso em mulheres
      const mes = (v) => Math.max(1, Math.round(v));
      const [mR, mL] = perder
        ? [mes(dif / (peso * 0.01) / 4.345), mes(dif / (peso * 0.005) / 4.345)]
        : sx === 'M'
          ? [mes(-dif / 1), mes(-dif / 0.5)]
          : [mes(-dif / 0.5), mes(-dif / 0.25)];
      const prazo = mR === mL ? `${mR} ${mR > 1 ? 'meses' : 'mês'}` : `${mR} a ${mL} meses`;
      kpis = `<div class="mt-kpis"><div><span>Meta de gordura</span><b>${meta}<small>%</small></b><em>hoje ${f1(g)}%</em></div><div><span>Peso-meta</span><b>${kg(pMeta)}<small> kg</small></b><em>${perder ? `${kg(dif)} kg de gordura a menos` : `${kg(-dif)} kg de massa magra a mais`}</em></div><div><span>Prazo estimado</span><b>${prazo}</b><em>${perder ? 'ritmo seguro, sem perder músculo' : 'com treino de força e proteína'}</em></div></div>`;
      const e1 =
        etapa1 != null
          ? (() => {
              const p1 = pesoCom(etapa1),
                d1 = peso - p1;
              const a = mes(d1 / (peso * 0.01) / 4.345),
                b = mes(d1 / (peso * 0.005) / 4.345);
              return `<li><b>1ª etapa · sair da faixa acima do ideal</b><span>Chegar a ${etapa1}% de gordura, cerca de ${kg(p1)} kg, em ${a === b ? a : `${a} a ${b}`} meses.</span></li>`;
            })()
          : '';
      plano = `<ol class="mt-plano">${e1}<li><b>${etapa1 != null ? '2ª etapa · meta final' : 'Meta'}</b><span>${perder ? `Chegar a ${meta}% de gordura, cerca de ${kg(pMeta)} kg, perdendo ${kg(dif)} kg de gordura e mantendo os ${kg(mm)} kg de massa magra.` : `Chegar a ${meta}% de gordura ganhando cerca de ${kg(-dif)} kg de massa magra, sem ganhar gordura.`}</span></li>
        <li><b>Ritmo</b><span>${perder ? `Entre ${kg(peso * 0.005)} e ${kg(peso * 0.01)} kg por semana (0,5 a 1% do peso). Mais rápido que isso aumenta a perda de músculo e cai o rendimento nos treinos.` : `Ganho gradual, com treino de força 2 a 3 vezes por semana e proteína suficiente. Não é preciso comer em excesso.`}</span></li>
        <li><b>Acompanhamento</b><span>Nova avaliação a cada 4 a 6 semanas, sempre pelo mesmo método, para ajustar a rota.</span></li></ol>`;
    } else
      kpis = `<div class="mt-kpis um"><div><span>Situação</span><b>Dentro do ideal</b><em>${f1(g)}% de gordura, faixa saudável ${gMin}–${gMax}% para ${faixaIdade}. A meta agora é manter a gordura e ganhar massa magra.</em></div></div>`;
  }
  if (alt) {
    const h = alt / 100,
      rcqLim = sx === 'M' ? 0.9 : 0.85,
      cLim = sx === 'M' ? 94 : 80;
    linhas.push([
      'IMC (referência da OMS)',
      `18,5 a 24,9 · ${kg(18.5 * h * h)} a ${kg(24.9 * h * h)} kg`,
      f1(r.imc),
      tag(r.imc >= 18.5 && r.imc < 25, clsIMC(r.imc)),
    ]);
    if (cint) {
      const alvo = Math.min(cLim, Math.round(alt * 0.5));
      linhas.push([
        'Cintura',
        `abaixo de ${alvo} cm`,
        `${f1(cint)} cm`,
        tag(cint < alvo, cint < alvo ? 'Dentro' : `${f1(cint - alvo)} cm acima`),
      ]);
      linhas.push(['Cintura/altura', 'até 0,50', f1(cint / alt, 2), tag(cint / alt <= 0.5)]);
    }
    if (r.rcq) linhas.push(['Cintura/quadril', `abaixo de ${f1(rcqLim, 2)}`, f1(r.rcq, 2), tag(r.rcq < rcqLim)]);
  }
  if (!linhas.length) return '';
  return `<div class="section metas-sec"><div class="section-h"><h2 class="h2">Metas e valores ideais</h2>${slashes}</div>
    <div class="card metas"><p class="small muted">Referências para ${sx === 'F' ? 'mulheres' : 'homens'} de ${faixaIdade}, calculadas com as suas medidas de hoje.</p>
      ${kpis}${regua}
      <div class="mt-tbl"><div class="mt-th"><span>Indicador</span><span>Ideal</span><span>Hoje</span><span></span></div>${linhas.map(([a, b, c, d]) => `<div><span>${a}</span><span>${b}</span><b>${c}</b>${d}</div>`).join('')}</div>
      ${plano ? `<p class="eyebrow" style="margin-top:18px">Plano para chegar lá</p>${plano}` : ''}
      <p class="tiny dim" style="margin-top:12px">Faixa de gordura por idade e sexo: Gallagher e colaboradores (2000), a mesma referência usada pelas balanças de bioimpedância. Peso-meta calculado mantendo a massa magra atual. Ritmo de perda de 0,5 a 1% do peso por semana para preservar músculo (Helms e colaboradores, 2014; Garthe e colaboradores, 2011). Cintura e cintura/quadril pela OMS; cintura até metade da altura (Ashwell e colaboradores, 2012; NICE, 2022). Os prazos são estimativas e mudam com a rotina de treino, sono e alimentação.</p></div></div>`;
}
// o aluno registra as próprias medidas em casa (fita métrica + balança)
function registrarMedidas(depois) {
  const sx = S.me.sexo === 'F' ? 'F' : S.me.sexo === 'M' ? 'M' : null;
  const idade = S.me.nascimento ? idadeEm(S.me.nascimento) : null;
  openSheet(
    `<p class="eyebrow">Composição corporal</p><div class="h2" style="margin-top:4px">Registrar minhas medidas</div>
    <p class="small muted" style="margin-top:6px">Meça de manhã, em jejum, depois de ir ao banheiro. Fita justa, sem apertar, e relaxado.</p>
    <form id="f-med" style="margin-top:14px">
      ${sx ? '' : `<div class="field"><span>Sexo (usado na equação)</span><div class="seg" id="med-sx"><button type="button" data-v="M">Masculino</button><button type="button" data-v="F">Feminino</button></div></div>`}
      <div class="grid2"><label class="field"><span>Peso (kg)</span><input class="input" name="peso" data-mask="peso" inputmode="numeric" placeholder="Ex.: 70,5" required></label><label class="field"><span>Altura (m)</span><input class="input" name="altura" data-mask="altura" inputmode="numeric" placeholder="Ex.: 1,75" required></label></div>
      <label class="field"><span>Pescoço (cm)</span><input class="input" name="pescoco" data-mask="circ" inputmode="numeric" placeholder="Ex.: 38,5" required><small class="tiny dim">Logo abaixo do pomo de Adão, com a fita levemente inclinada para a frente.</small></label>
      <label class="field" data-sxm><span>Abdômen (cm)</span><input class="input" name="abdomen" data-mask="circ" inputmode="numeric"><small class="tiny dim">Na altura do umbigo, no fim de uma expiração normal.</small></label>
      <label class="field" data-sxf><span>Cintura (cm)</span><input class="input" name="cintura" data-mask="circ" inputmode="numeric"><small class="tiny dim">Na parte mais fina, entre as costelas e o umbigo.</small></label>
      <label class="field" data-sxf><span>Quadril (cm)</span><input class="input" name="quadril" data-mask="circ" inputmode="numeric"><small class="tiny dim">Na parte mais larga do bumbum, com os pés juntos.</small></label>
      <p class="small" id="med-prev" style="margin:2px 0 12px;color:var(--acc)"></p>
      <button class="btn block">Salvar e ver o resultado</button></form>`,
    (r) => {
      const f = r.querySelector('#f-med');
      aplicarMascaras(f);
      let sexo = sx;
      const mostra = () => {
        f.querySelectorAll('[data-sxm]').forEach((e) => (e.hidden = sexo !== 'M'));
        f.querySelectorAll('[data-sxf]').forEach((e) => (e.hidden = sexo !== 'F'));
      };
      const ler = () => ({
        sexo,
        idade,
        peso: num(f.peso.value),
        altura: altCm(f.altura.value),
        metodo: 'perimetros',
        perimetros: Object.fromEntries(
          ['pescoco', 'abdomen', 'cintura', 'quadril'].map((k) => [k, num(f[k].value)]).filter(([, v]) => v),
        ),
      });
      const prev = () => {
        const x = calcAval(ler());
        r.querySelector('#med-prev').textContent =
          x.gordura != null ? `Gordura estimada: ${f1(x.gordura)}% · massa magra ${f1(x.massa_magra)} kg` : '';
      };
      const sg = r.querySelector('#med-sx');
      if (sg)
        sg.onclick = (e) => {
          const b = e.target.closest('[data-v]');
          if (!b) return;
          sexo = b.dataset.v;
          sg.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y === b));
          mostra();
          prev();
        };
      mostra();
      f.oninput = prev;
      // reaproveita peso e altura da última avaliação
      buscarAvaliacoes(S.user.id)
        .then((avs) => {
          const u = avs[avs.length - 1];
          if (!u) return;
          if (u.altura && !f.altura.value) f.altura.value = altM(u.altura);
          if (!sexo && u.sexo) {
            sexo = u.sexo;
            mostra();
          }
          prev();
        })
        .catch(() => {});
      f.onsubmit = async (e) => {
        e.preventDefault();
        const a = ler();
        if (!a.sexo) return toast('Escolha o sexo.', true);
        // valores fora do possível (dígito a mais, vírgula no lugar errado) não entram
        if (!(a.peso >= 30 && a.peso <= 250)) return toast('Confira o peso, em kg (ex.: 70,5).', true);
        if (!(a.altura >= 120 && a.altura <= 230)) return toast('Confira a altura, em metros (ex.: 1,75).', true);
        const fora = Object.entries(a.perimetros).find(
          ([k, v]) => !(v >= (k === 'pescoco' ? 20 : 40) && v <= (k === 'pescoco' ? 70 : 200)),
        );
        if (fora)
          return toast(
            `Confira ${{ pescoco: 'o pescoço', abdomen: 'o abdômen', cintura: 'a cintura', quadril: 'o quadril' }[fora[0]]}, em cm.`,
            true,
          );
        const x = calcAval(a);
        if (x.gordura == null)
          return toast(
            a.sexo === 'M'
              ? 'Confira pescoço e abdômen (o abdômen precisa ser maior que o pescoço).'
              : 'Confira pescoço, cintura e quadril.',
            true,
          );
        const { data, error } = await sb
          .from('nx_avaliacoes')
          .insert({
            org_id: S.org.id,
            aluno_id: S.user.id,
            avaliador_id: S.user.id,
            data: hojeISO(),
            ...a,
            dobras: {},
            bio: {},
            resultados: x,
            observacoes: null,
          })
          .select('id')
          .single();
        if (error) {
          console.error(error);
          return toast('Não foi possível salvar.', true);
        }
        sb.functions.invoke('nx-faltas', { body: { acao: 'medidas', id: data.id } }).catch(() => {}); // avisa o treinador
        closeSheet();
        toast('Medidas salvas.');
        if (depois) depois(data.id);
      };
    },
  );
}
