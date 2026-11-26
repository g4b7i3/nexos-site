/* Nexos App · Taxa de suor.
   Método de campo usado em pesquisa e por equipes profissionais: peso sem roupa antes e depois do treino, somando o que
   bebeu e descontando o xixi (ACSM, Sawka e colegas, 2007; Baker, 2017). Resultado em litros por hora, perda em % do
   peso, quanto beber durante treinos de cada duração (sem passar de 2% de perda e sem beber mais do que sua), reposição
   depois (1,25 a 1,5 L por kg perdido) e, com 3 medições ou mais em temperaturas diferentes, a taxa prevista pelo calor
   de cada treino. Aluno mede em #/suor; o treinador vê na ficha (aba Saúde) e o painel da equipe em #/suor. */

/* suor:puro:inicio */
// perda de peso a partir da qual o rendimento cai no calor (ACSM, Sawka e colegas, 2007)
const SUOR_LIMITE_PCT = 2;
// reposição depois do treino: 1,25 a 1,5 L para cada kg perdido (Shirreffs e colegas, 1996; ACSM, 2007)
const SUOR_REPOR = [1.25, 1.5];
const SUOR_DURACOES = [60, 90, 120, 180];
const r50 = (x) => Math.round(x / 50) * 50;
function taxaSuor({ antes, depois, min, bebeu = 0, xixi = 0, balancaG = 100 }) {
  antes = +antes;
  depois = +depois;
  min = +min;
  bebeu = +bebeu || 0;
  xixi = +xixi || 0;
  if (!(antes >= 25 && antes <= 250) || !(depois >= 25 && depois <= 250))
    return { erro: 'Confira os dois pesos, em kg.' };
  if (!(min >= 15 && min <= 360)) return { erro: 'O treino precisa ter entre 15 minutos e 6 horas.' };
  if (bebeu < 0 || bebeu > 6000 || xixi < 0 || xixi > 3000) return { erro: 'Confira a água e o xixi, em ml.' };
  const perdaKg = antes - depois;
  if (Math.abs(perdaKg) > antes * 0.06)
    return {
      erro: 'A diferença entre os pesos ficou grande demais. Confira se pesou do mesmo jeito, na mesma balança.',
    };
  const h = min / 60;
  // 1 kg de peso perdido = 1 litro de suor (a perda pela respiração e pela queima é pequena e entra junto)
  const suorL = perdaKg + bebeu / 1000 - xixi / 1000;
  if (suorL <= 0) return { erro: 'Pela conta, você não perdeu suor. Confira os pesos e o que bebeu.' };
  const taxa = suorL / h;
  if (taxa > 4) return { erro: 'Mais de 4 litros por hora não é possível. Confira os pesos e o tempo de treino.' };
  const pct = (perdaKg / antes) * 100;
  const nivel = pct < -0.2 ? 'ganhou' : pct <= 1 ? 'ok' : pct <= SUOR_LIMITE_PCT ? 'atencao' : 'alto';
  // quanto beber por hora para não passar de 2% numa sessão de d minutos, nunca mais do que o suor
  const beber = (d) => {
    const permitido = (antes * SUOR_LIMITE_PCT) / 100 / (d / 60);
    return Math.min(r50(taxa * 1000), Math.max(0, r50((taxa - permitido) * 1000)));
  };
  const plano = SUOR_DURACOES.map((d) => ({ min: d, mlh: beber(d), maxMlh: r50(taxa * 1000) }));
  // margem de erro: duas pesagens na mesma balança, espalhadas pela hora de treino
  const erroMlh = Math.round(((2 * (+balancaG || 100)) / h) * 1) || 0;
  const depoisMl = perdaKg > 0 ? SUOR_REPOR.map((k) => r50(perdaKg * k * 1000)) : null;
  return {
    taxaMlh: Math.round(taxa * 1000),
    suorMl: Math.round(suorL * 1000),
    perdaKg: Math.round(perdaKg * 100) / 100,
    pct: Math.round(pct * 10) / 10,
    nivel,
    plano,
    erroMlh,
    depoisMl,
  };
}
// taxa prevista para uma temperatura: reta pelos treinos medidos (mínimos quadrados), só com 3 medições ou mais
// espalhadas por pelo menos 3 °C. A taxa não cai com o calor: inclinação negativa vira a média.
function suorPrever(regs, temp) {
  const R = (regs || []).filter((r) => r && r.temp != null && isFinite(r.temp) && r.mlh > 0);
  if (R.length < 3 || temp == null || !isFinite(temp)) return null;
  const ts = R.map((r) => +r.temp),
    tMin = Math.min(...ts),
    tMax = Math.max(...ts);
  if (tMax - tMin < 3) return null;
  const n = R.length,
    mt = ts.reduce((a, x) => a + x, 0) / n,
    my = R.reduce((a, r) => a + r.mlh, 0) / n;
  let sxy = 0,
    sxx = 0;
  R.forEach((r) => {
    sxy += (r.temp - mt) * (r.mlh - my);
    sxx += (r.temp - mt) ** 2;
  });
  const b = Math.max(0, Math.min(150, sxy / sxx));
  const yMin = Math.min(...R.map((r) => r.mlh)),
    yMax = Math.max(...R.map((r) => r.mlh));
  const y = my + b * (temp - mt);
  return {
    mlh: r50(Math.max(yMin * 0.7, Math.min(yMax * 1.3, y))),
    porGrau: Math.round(b),
    n,
    faixa: [tMin, tMax],
    fora: temp < tMin - 2 || temp > tMax + 2,
  };
}
/* suor:puro:fim */

const SUOR_NIVEL = {
  ok: ['Dentro do esperado', 'Você perdeu menos de 1% do peso. A hidratação desse treino funcionou.'],
  atencao: ['Perto do limite', 'Entre 1% e 2% do peso. Em treinos mais longos ou mais quentes, beba mais durante.'],
  alto: [
    'Passou de 2%',
    'Acima de 2% do peso o rendimento já cai no calor e o coração trabalha mais. Beba mais durante o treino.',
  ],
  ganhou: [
    'Bebeu mais do que suou',
    'Você terminou mais pesado do que começou. Beber além do suor, em provas longas, pode baixar o sódio do sangue (hiponatremia). Beba pela sede e pelo plano abaixo.',
  ],
};
const SUOR_FONTES =
  'Método e limites: ACSM (Sawka e colegas, 2007); Baker, 2017 (Sports Medicine); reposição: Shirreffs e colegas, 1996.';
const milBR = (n) => Math.round(n).toLocaleString('pt-BR');
const fmtMl = (ml) => (ml >= 1000 ? fmtL(r50(ml)) : `${Math.round(ml)} ml`);
const suorRegs = (rows) => rows.map((r) => ({ temp: r.temp_c != null ? +r.temp_c : null, mlh: suorCalc(r).taxaMlh }));
const suorCalc = (r) =>
  taxaSuor({
    antes: r.peso_antes,
    depois: r.peso_depois,
    min: r.dur_min,
    bebeu: r.bebeu_ml,
    xixi: r.xixi_ml,
    balancaG: r.balanca_g,
  });

function suorResHTML(r, doAluno = true) {
  const c = suorCalc(r);
  if (c.erro) return '';
  const [tit, txt] = SUOR_NIVEL[c.nivel];
  const ctx = [
    `${r.dur_min} min`,
    r.temp_c != null ? `${f1(r.temp_c, 0)}°${r.umid != null ? `, ${r.umid}% de umidade` : ''}` : '',
    r.pace_s_km ? `${fmtPace(r.pace_s_km)}/km` : '',
    r.fc_media ? `FC ${r.fc_media}` : '',
  ].filter(Boolean);
  const pctBar = Math.max(0, Math.min(100, (Math.max(0, c.pct) / 3) * 100));
  return `<div class="card suor-res">
    <div class="row between" style="gap:8px"><b class="suor-t">${AGUA_IC} Taxa de suor</b><span class="tiny dim">${fmtDia(r.dia)}</span></div>
    <div class="suor-big"><b>${f1(c.taxaMlh / 1000, 2)}</b><span>litros por hora</span></div>
    <p class="tiny dim">${esc(ctx.join(' · '))} · margem da balança ±${c.erroMlh} ml/h</p>
    <div class="suor-pct suor-${c.nivel}"><div class="row between"><b>${tit}</b><span>${c.pct > 0 ? '−' : c.pct < 0 ? '+' : ''}${f1(Math.abs(c.pct))}% do peso</span></div>
      <div class="suor-escala"><i style="width:${pctBar}%"></i><em style="left:${(1 / 3) * 100}%">1%</em><em style="left:${(2 / 3) * 100}%">2%</em></div>
      <p class="small">${txt}</p></div>
    <p class="sec-lbl">Quanto beber durante o treino</p>
    <div class="suor-plano">${c.plano
      .map(
        (p) =>
          `<div><span>${p.min < 120 ? (p.min === 60 ? '1 h' : '1h30') : p.min / 60 + ' h'}</span><b>${p.mlh ? `${milBR(p.mlh)} a ${milBR(p.maxMlh)}` : 'pela sede'}</b><small>${p.mlh ? 'ml por hora' : 'se começar hidratado'}</small></div>`,
      )
      .join('')}</div>
    <p class="tiny dim" style="margin-top:6px">O mínimo segura a perda abaixo de 2% do peso. O máximo é o quanto você sua: beber além disso não ajuda. Em goles, a cada 15 a 20 minutos.</p>
    <p class="sec-lbl">Depois do treino</p>
    <p class="small">${c.depoisMl ? `Beba de <b>${fmtMl(c.depoisMl[0])} a ${fmtMl(c.depoisMl[1])}</b> nas próximas horas, aos poucos e junto com a refeição. É 1,25 a 1,5 litro para cada kg perdido, porque parte da água sai na urina.` : 'Você não perdeu peso neste treino. Volte a beber pela sede.'}</p>
    ${r.sal ? `<p class="sec-lbl">Sódio</p><p class="small">Você marcou suor salgado. Em treinos de mais de 2 horas ou muito quentes, use bebida com eletrólitos (cerca de 500 a 700 mg de sódio por litro) ou cápsula de sal, e não só água.</p>` : ''}
    ${doAluno ? '' : '<p class="tiny dim" style="margin-top:8px">O aluno vê esta mesma orientação na tela dele.</p>'}
    ${doAluno ? `<button type="button" class="link-btn small" data-suor-apagar="${esc(r.id)}" style="margin-top:10px">Apagar esta medição</button>` : ''}
    <p class="tiny dim" style="margin-top:8px">${SUOR_FONTES}</p></div>`;
}

// previsão pelo calor: hoje no horário atual e amanhã cedo, pela Leitura do tempo
async function suorPrevisaoHTML(rows) {
  const regs = suorRegs(rows).filter((x) => x.mlh);
  const comTemp = regs.filter((x) => x.temp != null);
  if (comTemp.length < 3) {
    const falta = 3 - comTemp.length;
    return `<div class="card suor-prev vazio"><b>Taxa prevista pelo calor</b><p class="small muted" style="margin-top:4px">Com 3 medições em dias de temperaturas diferentes, o app aprende como o seu suor sobe com o calor e mostra quanto beber no clima de cada treino. ${falta === 3 ? 'Faltam 3 medições.' : `Falta${falta > 1 ? 'm' : ''} ${falta} ${falta > 1 ? 'medições' : 'medição'} com temperatura.`}</p></div>`;
  }
  let horas = null;
  try {
    const prev = await previsaoCalor(await localCalor());
    horas = prev && prev.horas;
  } catch {}
  if (!horas) return '';
  const agora = new Date();
  const hojeS = isoDia(agora);
  const amanha = isoDia(new Date(agora.getTime() + 864e5));
  const pega = (d, h) => horas.find((x) => x.t === `${d}T${String(h).padStart(2, '0')}:00`);
  const alvos = [
    agora.getHours() < 20 ? ['Agora', pega(hojeS, agora.getHours())] : null,
    ['Amanhã às 6h', pega(amanha, 6)],
    ['Amanhã às 17h', pega(amanha, 17)],
  ].filter((x) => x && x[1] && x[1].temp != null);
  if (!alvos.length) return '';
  const linhas = alvos
    .map(([rot, hh]) => {
      const p = suorPrever(regs, hh.temp);
      if (!p) return '';
      const peso = +rows[0].peso_antes;
      const min90 = Math.max(0, r50(p.mlh - (peso * SUOR_LIMITE_PCT * 10) / 1.5));
      return `<div><span>${rot} · ${Math.round(hh.temp)}°</span><b>${f1(p.mlh / 1000, 2)} L/h</b><small>${p.fora ? 'fora das temperaturas medidas' : `1h30 de treino: ${min90 ? `${milBR(min90)} a ${milBR(p.mlh)} ml por hora` : 'beber pela sede'}`}</small></div>`;
    })
    .join('');
  const p0 = suorPrever(regs, alvos[0][1].temp);
  return `<div class="card suor-prev"><b>Taxa prevista pelo calor</b>
    <div class="suor-plano" style="margin-top:10px">${linhas}</div>
    <p class="tiny dim" style="margin-top:6px">Pelas suas ${p0.n} medições, entre ${Math.round(p0.faixa[0])}° e ${Math.round(p0.faixa[1])}°: o seu suor sobe cerca de ${p0.porGrau} ml por hora a cada grau. Vale para treinos parecidos com os medidos; treino forte sua mais.</p></div>`;
}

const SUOR_COMO = `<ol class="suor-passos">
  <li><b>Antes.</b> Faça xixi e se pese sem roupa (ou só de roupa íntima seca), logo antes de sair.</li>
  <li><b>No treino.</b> Anote quanto bebeu, pela garrafa. Se fizer xixi no meio, estime a quantidade.</li>
  <li><b>Depois.</b> Seque bem o suor e se pese de novo, do mesmo jeito, antes de beber ou ir ao banheiro.</li>
  <li><b>A mesma balança</b>, no mesmo lugar do chão. Um treino de 45 a 60 minutos no seu ritmo normal é o ideal.</li>
</ol>`;

// painel de medição (aluno ou treinador na ficha do aluno)
async function suorFormAbrir({ alunoId, aoSalvar }) {
  const desde = new Date(Date.now() - 36 * 3600e3).toISOString();
  const [peso, corr] = await Promise.all([
    pesoDoAluno(alunoId).catch(() => null),
    sb
      .from('nx_corridas')
      .select('id,data,titulo,tipo,distancia_m,duracao_s,fc_media,analise,rota,fonte')
      .eq('aluno_id', alunoId)
      .gte('data', desde)
      .order('data', { ascending: false })
      .limit(4)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const hm2 = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  openSheet(
    `<p class="eyebrow">Saúde</p><div class="h2">Medir a taxa de suor</div>
    <details class="suor-como"><summary>Como medir certo</summary>${SUOR_COMO}</details>
    <form id="f-suor" style="margin-top:12px">
      ${
        corr.length
          ? `<p class="sec-lbl">Qual treino</p><div class="chips wrap" id="suor-corr">${corr
              .map(
                (c, i) =>
                  `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-c="${esc(c.id)}">${esc(c.titulo || 'Corrida')} · ${hm2(c.data)}</button>`,
              )
              .join('')}<button type="button" class="chip" data-c="">Outro treino</button></div>`
          : ''
      }
      <div class="row" style="gap:10px;margin-top:10px">
        <label class="field grow"><span>Peso antes (kg)</span><input class="input" name="antes" data-mask="dec" data-int="3" data-casas="2" inputmode="decimal" required value="${peso ? String(peso).replace('.', ',') : ''}"></label>
        <label class="field grow"><span>Peso depois (kg)</span><input class="input" name="depois" data-mask="dec" data-int="3" data-casas="2" inputmode="decimal" required></label>
      </div>
      <div class="row" style="gap:10px">
        <label class="field grow"><span>Tempo de treino (min)</span><input class="input" name="min" data-mask="num" data-max="3" inputmode="numeric" required></label>
        <label class="field grow"><span>Água que bebeu (ml)</span><input class="input" name="bebeu" data-mask="num" data-max="4" inputmode="numeric" value="0"></label>
      </div>
      <div class="chips" style="margin:-4px 0 12px"><button type="button" class="chip" data-ml="250">+250 ml</button><button type="button" class="chip" data-ml="500">+500 ml</button><button type="button" class="chip" data-ml="0">Não bebi</button></div>
      <label class="field"><span>Xixi durante o treino (ml, se fez)</span><input class="input" name="xixi" data-mask="num" data-max="4" inputmode="numeric" value="0" placeholder="um xixi comum tem uns 300 ml"></label>
      <div class="row" style="gap:10px">
        <label class="field grow"><span>Temperatura (°C)</span><input class="input" name="temp" data-mask="dec" data-int="2" data-casas="1" inputmode="decimal" placeholder="automática"></label>
        <label class="field grow"><span>Umidade (%)</span><input class="input" name="umid" data-mask="num" data-max="3" inputmode="numeric" placeholder="automática"></label>
      </div>
      <p class="tiny dim" id="suor-clima" style="margin:-4px 0 12px"></p>
      <label class="field"><span>Precisão da balança</span><select class="input" name="balanca"><option value="100">100 g (balança comum)</option><option value="50">50 g</option><option value="20">20 g</option><option value="10">10 g (balança de precisão)</option></select></label>
      <p class="sec-lbl">Ficou marca branca de sal na roupa, no boné ou no rosto?</p>
      <div class="seg" id="suor-sal" style="grid-template-columns:1fr 1fr 1fr"><button type="button" data-v="1">Sim</button><button type="button" data-v="0">Não</button><button type="button" data-v="" class="on">Não reparei</button></div>
      <div id="suor-prev" style="margin-top:14px"></div>
      <button class="btn block" type="submit" style="margin-top:12px">Salvar medição</button>
    </form>`,
    (el) => {
      const f = el.querySelector('#f-suor');
      aplicarMascaras(f);
      let corrSel = corr[0] || null,
        sal = null,
        clima = null;
      const prevEl = el.querySelector('#suor-prev'),
        climaEl = el.querySelector('#suor-clima');
      const valores = () => ({
        antes: num(f.antes.value),
        depois: num(f.depois.value),
        min: num(f.min.value),
        bebeu: num(f.bebeu.value) || 0,
        xixi: num(f.xixi.value) || 0,
        balancaG: +f.balanca.value,
      });
      const atualiza = () => {
        const v = valores();
        if (!v.antes || !v.depois || !v.min) return (prevEl.innerHTML = '');
        const c = taxaSuor(v);
        prevEl.innerHTML = c.erro
          ? `<p class="small" style="color:var(--warn)">${esc(c.erro)}</p>`
          : `<div class="suor-mini suor-${c.nivel}"><b>${f1(c.taxaMlh / 1000, 2)} L/h</b><span>${c.pct > 0 ? '−' : '+'}${f1(Math.abs(c.pct))}% do peso · ${SUOR_NIVEL[c.nivel][0].toLowerCase()}</span></div>`;
      };
      const usaCorrida = async (c) => {
        corrSel = c;
        clima = null;
        climaEl.textContent = '';
        if (!c) return atualiza();
        if (c.duracao_s) f.min.value = Math.round(c.duracao_s / 60);
        climaEl.textContent = 'Buscando o clima da hora do treino…';
        clima = await climaDe(c).catch(() => null);
        if (corrSel !== c) return;
        if (clima && clima.temp != null) {
          f.temp.value = String(clima.temp);
          if (clima.umid != null) f.umid.value = String(clima.umid);
          climaEl.textContent =
            clima.fonte === 'relogio'
              ? 'Temperatura do relógio.'
              : `Clima da hora do treino${clima.sens != null ? `, sensação de ${clima.sens}°` : ''}.`;
        } else climaEl.textContent = 'Sem clima para esse treino. Se souber, preencha.';
        atualiza();
      };
      // sem corrida escolhida: clima de agora, pela Leitura do tempo
      const climaAgora = async () => {
        try {
          const prev = await previsaoCalor(await localCalor());
          const t = `${isoDia(new Date())}T${String(new Date().getHours()).padStart(2, '0')}:00`;
          const hh = prev.horas.find((x) => x.t === t);
          if (hh && !corrSel && !f.temp.value) {
            f.temp.value = String(Math.round(hh.temp));
            f.umid.value = String(Math.round(hh.ur));
            climaEl.textContent = 'Clima de agora. Se treinou em outro horário, ajuste.';
          }
        } catch {}
      };
      const cs = el.querySelector('#suor-corr');
      if (cs)
        cs.onclick = (e) => {
          const b = e.target.closest('[data-c]');
          if (!b) return;
          cs.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
          const c = corr.find((x) => x.id === b.dataset.c) || null;
          usaCorrida(c);
          if (!c) climaAgora();
        };
      el.querySelectorAll('[data-ml]').forEach(
        (b) =>
          (b.onclick = () => {
            const ml = +b.dataset.ml;
            f.bebeu.value = ml ? String((num(f.bebeu.value) || 0) + ml) : '0';
            atualiza();
          }),
      );
      const ss = el.querySelector('#suor-sal');
      ss.onclick = (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        ss.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        sal = b.dataset.v === '' ? null : b.dataset.v === '1';
      };
      f.addEventListener('input', atualiza);
      f.balanca.onchange = atualiza;
      if (corrSel) usaCorrida(corrSel);
      else climaAgora();
      f.onsubmit = async (e) => {
        e.preventDefault();
        const v = valores();
        const c = taxaSuor(v);
        if (c.erro) return toast(c.erro, true);
        const temp = num(f.temp.value),
          umid = num(f.umid.value);
        if (temp != null && (temp < 0 || temp > 50)) return toast('Confira a temperatura.', true);
        if (umid != null && (umid < 0 || umid > 100)) return toast('Confira a umidade.', true);
        const cs2 = corrSel;
        const pace =
          cs2 && cs2.distancia_m > 500 && cs2.duracao_s ? Math.round(cs2.duracao_s / (cs2.distancia_m / 1000)) : null;
        const row = {
          org_id: S.org.id,
          aluno_id: alunoId,
          dia: cs2 ? isoDia(cs2.data) : hojeISO(),
          peso_antes: v.antes,
          peso_depois: v.depois,
          dur_min: Math.round(v.min),
          bebeu_ml: Math.round(v.bebeu),
          xixi_ml: Math.round(v.xixi),
          temp_c: temp,
          umid: umid != null ? Math.round(umid) : null,
          sens_c: clima && clima.sens != null && cs2 ? clima.sens : null,
          corrida_id: cs2 ? cs2.id : null,
          pace_s_km: pace && pace >= 120 && pace <= 1200 ? pace : null,
          fc_media: cs2 && cs2.fc_media >= 60 && cs2.fc_media <= 230 ? cs2.fc_media : null,
          sal,
          balanca_g: v.balancaG,
        };
        const b = f.querySelector('[type=submit]');
        b.disabled = true;
        const { error } = await sb.from('nx_taxa_suor').insert(row);
        b.disabled = false;
        if (error) {
          console.error(error);
          return toast('Não foi possível salvar a medição.', true);
        }
        closeSheet();
        toast(`Taxa de suor: ${f1(c.taxaMlh / 1000, 2)} litros por hora.`);
        aoSalvar && aoSalvar();
      };
    },
  );
}

async function suorDoAluno(alunoId, n = 20) {
  return sb
    .from('nx_taxa_suor')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('dia', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(n)
    .then(
      (r) => r.data || [],
      () => [],
    );
}
function suorHistHTML(rows) {
  if (rows.length < 2) return '';
  return `<p class="sec-lbl">Medições</p><div class="card suor-hist">${rows
    .map((r) => {
      const c = suorCalc(r);
      return c.erro
        ? ''
        : `<div><span>${fmtCurto(r.dia)}</span><span class="dim">${r.temp_c != null ? f1(r.temp_c, 0) + '°' : '–'}</span><b>${f1(c.taxaMlh / 1000, 2)} L/h</b><em class="suor-${c.nivel}">${c.pct > 0 ? '−' : '+'}${f1(Math.abs(c.pct))}%</em></div>`;
    })
    .join('')}</div>`;
}

// tela do aluno
async function viewSuor() {
  if (S.staff) return staffSuorEquipe();
  loading();
  const rows = await suorDoAluno(S.user.id);
  const ult = rows[0];
  $app.innerHTML = `<a class="back" href="#/agua">${I.back} Hidratação</a><p class="eyebrow">Saúde</p><h1 class="h1">Taxa de suor</h1>
    <p class="small muted" style="margin-top:6px">Quanto líquido você perde por hora de treino. Cada pessoa sua de um jeito, de meio litro a mais de 2 litros por hora, e é esse número que define a sua hidratação no calor.</p>
    <button class="btn block" id="suor-novo" style="margin-top:16px">${AGUA_IC} ${ult ? 'Fazer nova medição' : 'Medir minha taxa de suor'}</button>
    ${ult ? '' : `<div class="card" style="margin-top:14px"><b>Como medir</b>${SUOR_COMO}</div>`}
    <div style="margin-top:16px">${ult ? suorResHTML(ult) : ''}</div>
    <div id="suor-prevbox" style="margin-top:14px"></div>
    ${suorHistHTML(rows)}`;
  document.getElementById('suor-novo').onclick = () => suorFormAbrir({ alunoId: S.user.id, aoSalvar: viewSuor });
  $app.onclick = async (e) => {
    const a = e.target.closest('[data-suor-apagar]');
    if (!a) return;
    if (!confirm('Apagar esta medição?')) return;
    const { error } = await sb.from('nx_taxa_suor').delete().eq('id', a.dataset.suorApagar);
    if (error) return toast('Não foi possível apagar.', true);
    toast('Medição apagada.');
    viewSuor();
  };
  if (rows.length)
    suorPrevisaoHTML(rows)
      .then((h) => {
        const box = document.getElementById('suor-prevbox');
        if (box) box.innerHTML = h;
      })
      .catch(() => {});
}

// ficha do aluno no treinador (aba Saúde)
async function suorStaffHTML(m) {
  const rows = await suorDoAluno(m.user_id, 8);
  const ult = rows[0];
  return `<div id="suor-staff">${ult ? suorResHTML(ult, false) : `<div class="card"><b>${AGUA_IC} Taxa de suor</b><p class="small muted" style="margin-top:4px">Ainda sem medição. O aluno mede em Hidratação › Taxa de suor, ou você registra aqui numa avaliação presencial.</p></div>`}
    ${suorHistHTML(rows)}
    <button type="button" class="btn ghost block" id="suor-reg" style="margin:10px 0 14px">Registrar medição do aluno</button></div>`;
}
function bindSuorStaff(m) {
  const b = document.getElementById('suor-reg');
  if (b) b.onclick = () => suorFormAbrir({ alunoId: m.user_id, aoSalvar: () => staffAluno(m.user_id, 'saude') });
}

// painel da equipe: a última medição de cada aluno do treinador
async function staffSuorEquipe() {
  loading();
  const [membT, rows] = await Promise.all([
    sb
      .from('nx_membros')
      .select('user_id,nome,foto_url,ativo,aprovacao,treinador_id,treinador_forca_id,treinador_corrida_id,modalidades')
      .eq('org_id', S.org.id)
      .eq('papel', 'aluno')
      .order('nome')
      .then(
        (r) => r.data || [],
        () => [],
      ),
    sb
      .from('nx_taxa_suor')
      .select('*')
      .eq('org_id', S.org.id)
      .order('dia', { ascending: false })
      .limit(500)
      .then(
        (r) => r.data || [],
        () => [],
      ),
  ]);
  const al = membT.filter((m) => ehMeuAluno(m) && m.ativo && m.aprovacao !== 'pendente' && m.aprovacao !== 'recusado');
  const porAluno = {};
  rows.forEach((r) => (porAluno[r.aluno_id] = porAluno[r.aluno_id] || []).push(r));
  const lin = al
    .map((m) => {
      const rs = porAluno[m.user_id] || [];
      const r = rs[0],
        c = r && suorCalc(r);
      return { m, r, c: c && !c.erro ? c : null, n: rs.length };
    })
    .sort((a, b) => (b.c ? b.c.taxaMlh : -1) - (a.c ? a.c.taxaMlh : -1));
  const com = lin.filter((x) => x.c);
  const alto = com.filter((x) => x.c.taxaMlh >= 1500).length,
    perde = com.filter((x) => x.c.nivel === 'alto').length,
    ganha = com.filter((x) => x.c.nivel === 'ganhou').length;
  dockStaff();
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a><p class="eyebrow">Equipe</p><h1 class="h1">Taxa de suor</h1>
    <p class="small muted" style="margin-top:6px">A última medição de cada aluno seu. Os alunos medem em Hidratação › Taxa de suor; você também registra pela ficha do aluno, aba Saúde.</p>
    <div class="suor-resumo" style="margin-top:14px"><div><b>${com.length}</b><span>com medição</span></div><div class="${alto ? 'q' : ''}"><b>${alto}</b><span>suam 1,5 L/h ou mais</span></div><div class="${perde ? 'q' : ''}"><b>${perde}</b><span>perderam mais de 2%</span></div><div class="${ganha ? 'q' : ''}"><b>${ganha}</b><span>beberam demais</span></div></div>
    <div class="stack" style="margin-top:14px">${lin
      .map(
        ({ m, r, c, n }) =>
          `<a class="list-item" href="#/aluno/${m.user_id}/saude" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><div class="small muted">${c ? `${fmtCurto(r.dia)}${r.temp_c != null ? ' · ' + f1(r.temp_c, 0) + '°' : ''} · ${n} ${n > 1 ? 'medições' : 'medição'}` : 'Ainda sem medição'}</div></div>${c ? `<div class="suor-lado"><b>${f1(c.taxaMlh / 1000, 2)} L/h</b><em class="suor-${c.nivel}">${c.pct > 0 ? '−' : '+'}${f1(Math.abs(c.pct))}%</em></div>` : ''}${I.chev}</a>`,
      )
      .join('')}</div>
    <p class="tiny dim" style="margin-top:12px">${SUOR_FONTES}</p>`;
}
