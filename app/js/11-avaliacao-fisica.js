/* Nexos App · Avaliação física, relatório e metas.
   Parte 11 de 31: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo. */
'use strict';

/* ---------- avaliação física ---------- */
const DOBRAS = [
  ['peitoral', 'Peitoral'],
  ['axilar', 'Axilar média'],
  ['triceps', 'Tríceps'],
  ['subescapular', 'Subescapular'],
  ['abdominal', 'Abdominal'],
  ['suprailiaca', 'Suprailíaca'],
  ['coxa', 'Coxa'],
  ['panturrilha', 'Panturrilha medial'],
];
const PROTOCOLOS = {
  pollock7: {
    nome: 'Pollock 7 dobras',
    M: DOBRAS.slice(0, 7).map((d) => d[0]),
    F: DOBRAS.slice(0, 7).map((d) => d[0]),
  },
  petroski: {
    nome: 'Petroski 4 dobras (brasileiros)',
    M: ['subescapular', 'triceps', 'suprailiaca', 'panturrilha'],
    F: ['subescapular', 'triceps', 'suprailiaca', 'panturrilha'],
  },
  pollock3: { nome: 'Pollock 3 dobras', M: ['peitoral', 'abdominal', 'coxa'], F: ['triceps', 'suprailiaca', 'coxa'] },
  faulkner: {
    nome: 'Faulkner 4 dobras',
    M: ['triceps', 'subescapular', 'suprailiaca', 'abdominal'],
    F: ['triceps', 'subescapular', 'suprailiaca', 'abdominal'],
  },
};
const PERIM = [
  ['pescoco', 'Pescoço'],
  ['torax', 'Tórax'],
  ['cintura', 'Cintura'],
  ['abdomen', 'Abdômen'],
  ['quadril', 'Quadril'],
  ['braco_d', 'Braço dir.'],
  ['braco_e', 'Braço esq.'],
  ['antebraco', 'Antebraço'],
  ['coxa_d', 'Coxa dir.'],
  ['coxa_e', 'Coxa esq.'],
  ['panturrilha_d', 'Panturrilha dir.'],
  ['panturrilha_e', 'Panturrilha esq.'],
];
const BIO = [
  ['gordura', '% de gordura', '%'],
  ['musculo', 'Massa muscular', 'kg'],
  ['agua', 'Água corporal', '%'],
  ['visceral', 'Gordura visceral', 'nível'],
  ['tmb', 'Metabolismo basal', 'kcal'],
];
function calcAval(a) {
  const r = {};
  const peso = num(a.peso),
    alt = num(a.altura),
    sexo = a.sexo,
    idade = num(a.idade);
  if (peso && alt) r.imc = peso / (alt / 100) ** 2;
  const p = a.perimetros || {};
  const ci = num(p.cintura),
    qu = num(p.quadril);
  if (ci && qu) r.rcq = ci / qu;
  let g = null;
  if (a.metodo === 'bioimpedancia') g = num((a.bio || {}).gordura);
  else if (a.metodo === 'perimetros') {
    // Marinha americana (Hodgdon e Beckett, 1984): homens com abdômen na altura do umbigo; mulheres com cintura e quadril
    const pe = num(p.pescoco),
      ab = num(p.abdomen) || ci;
    if (alt && pe && sexo === 'M' && ab && ab > pe)
      g = 495 / (1.0324 - 0.19077 * Math.log10(ab - pe) + 0.15456 * Math.log10(alt)) - 450;
    if (alt && pe && sexo === 'F' && ci && qu && ci + qu > pe)
      g = 495 / (1.29579 - 0.35004 * Math.log10(ci + qu - pe) + 0.221 * Math.log10(alt)) - 450;
  } else if (PROTOCOLOS[a.protocolo] && (sexo === 'M' || sexo === 'F')) {
    const vals = PROTOCOLOS[a.protocolo][sexo].map((k) => num((a.dobras || {})[k]));
    if (vals.every((v) => v != null && v > 0)) {
      const s = vals.reduce((x, y) => x + y, 0);
      r.soma_dobras = s;
      if (a.protocolo === 'faulkner') g = 0.153 * s + 5.783;
      else if (a.protocolo === 'petroski') {
        if (idade != null && (sexo === 'M' || (peso && alt))) {
          const D =
            sexo === 'M'
              ? 1.10726863 - 0.00081201 * s + 0.00000212 * s * s - 0.00041761 * idade
              : 1.02902361 -
                0.00067159 * s +
                0.00000242 * s * s -
                0.00026073 * idade -
                0.00056009 * peso +
                0.00054649 * alt;
          r.densidade = D;
          g = (4.95 / D - 4.5) * 100;
        }
      } else if (idade != null) {
        const D =
          a.protocolo === 'pollock7'
            ? sexo === 'M'
              ? 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * idade
              : 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * idade
            : sexo === 'M'
              ? 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * idade
              : 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * idade;
        r.densidade = D;
        g = (4.95 / D - 4.5) * 100;
      }
    }
  }
  if (g != null && isFinite(g) && g > 0 && g < 70) {
    r.gordura = g;
    if (peso) {
      r.massa_gorda = (peso * g) / 100;
      r.massa_magra = peso - r.massa_gorda;
    }
  }
  if (a.metodo === 'bioimpedancia') {
    const mm = num((a.bio || {}).musculo);
    if (mm) r.massa_muscular = mm;
  }
  if (idade != null) r.fc_max = 208 - 0.7 * idade;
  // água corporal total (Watson, 1980) e massa gorda relativa (RFM, Woolcott e Bergman, 2018)
  if (peso && alt && (sexo === 'F' || (sexo === 'M' && idade != null))) {
    const tbw =
      sexo === 'M' ? 2.447 - 0.09516 * idade + 0.1074 * alt + 0.3362 * peso : -2.097 + 0.1069 * alt + 0.2466 * peso;
    if (tbw > 10) {
      r.agua_l = tbw;
      r.agua_pct = (tbw / peso) * 100;
    }
  }
  if (alt && ci && (sexo === 'M' || sexo === 'F')) r.rfm = 64 - 20 * (alt / ci) + (sexo === 'F' ? 12 : 0);
  if (r.massa_magra) {
    r.tmb = 370 + 21.6 * r.massa_magra;
    r.tmb_metodo = 'Katch-McArdle';
  } else if (peso && alt && idade != null && (sexo === 'M' || sexo === 'F')) {
    r.tmb = 10 * peso + 6.25 * alt - 5 * idade + (sexo === 'M' ? 5 : -161);
    r.tmb_metodo = 'Mifflin-St Jeor';
  }
  return r;
}
const clsIMC = (v) =>
  v == null
    ? ''
    : v < 18.5
      ? 'Abaixo do peso'
      : v < 25
        ? 'Peso adequado'
        : v < 30
          ? 'Sobrepeso'
          : v < 35
            ? 'Obesidade grau I'
            : v < 40
              ? 'Obesidade grau II'
              : 'Obesidade grau III';
const clsRCQ = (v, sx) =>
  v == null || !sx ? '' : v < (sx === 'M' ? 0.9 : 0.85) ? 'Dentro da referência' : 'Acima da referência';
const clsCint = (v, sx) =>
  v == null || !sx
    ? ''
    : sx === 'M'
      ? v >= 102
        ? 'Risco muito aumentado'
        : v >= 94
          ? 'Risco aumentado'
          : 'Dentro da referência'
      : v >= 88
        ? 'Risco muito aumentado'
        : v >= 80
          ? 'Risco aumentado'
          : 'Dentro da referência';
const clsPA = (s, d) => {
  if (!s || !d) return '';
  if (s >= 180 || d >= 110) return 'Hipertensão estágio 3';
  if (s >= 160 || d >= 100) return 'Hipertensão estágio 2';
  if (s >= 140 || d >= 90) return 'Hipertensão estágio 1';
  if (s >= 120 || d >= 80) return 'Pré-hipertensão';
  return 'Normal';
}; // Diretriz Brasileira de Hipertensão Arterial 2025
const mediana = (l) => {
  const v = l.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
// zonas de FC pela FC de limiar (Friel, 2009): Z1 < 85%, Z2 85-89%, Z3 90-94%, Z4 95-99%, Z5 100% ou mais da LTHR
function zonasFCLimiar(lthr, fcMax) {
  const Z = [
    ['Z1', 'Regenerativo', 0.65, 0.84],
    ['Z2', 'Aeróbico leve', 0.85, 0.89],
    ['Z3', 'Aeróbico moderado', 0.9, 0.94],
    ['Z4', 'Limiar', 0.95, 0.99],
    ['Z5', 'Acima do limiar', 1, null],
  ];
  return Z.map(([z, n, a, b]) => ({
    z,
    n,
    de: Math.round(a * lthr),
    ate: b ? Math.round(b * lthr) : Math.round(fcMax && fcMax > lthr ? fcMax : lthr * 1.08),
  }));
}
const zonasFCPerfil = (p) => (p.lthr ? zonasFCLimiar(p.lthr, p.fcMax) : zonasFC(p.fcMax, p.fcRep));
/** zona (0 a 4) de uma FC pelos limites do aluno: os mesmos que aparecem no perfil */
const zonaFCIdx = (zs, f) => zs.slice(1).filter((z) => f >= z.de).length;
function zonasFC(fcMax, fcRep) {
  const Z = [
    ['Z1', 'Regenerativo', 0.5, 0.6],
    ['Z2', 'Aeróbico leve', 0.6, 0.7],
    ['Z3', 'Aeróbico moderado', 0.7, 0.8],
    ['Z4', 'Limiar', 0.8, 0.9],
    ['Z5', 'Máximo', 0.9, 1],
  ];
  return Z.map(([z, n, a, b]) => ({
    z,
    n,
    de: Math.round(fcRep ? fcRep + a * (fcMax - fcRep) : a * fcMax),
    ate: Math.round(fcRep ? fcRep + b * (fcMax - fcRep) : b * fcMax),
  }));
}
const idadeEm = (nasc, data) => {
  if (!nasc) return null;
  const n = dia(nasc),
    d = dia(data || hojeISO());
  let i = d.getFullYear() - n.getFullYear();
  if (d.getMonth() < n.getMonth() || (d.getMonth() === n.getMonth() && d.getDate() < n.getDate())) i--;
  return i;
};

async function buscarAvaliacoes(alunoId) {
  const { data, error } = await sb
    .from('nx_avaliacoes')
    .select('*')
    .eq('org_id', S.org.id)
    .eq('aluno_id', alunoId)
    .order('data');
  if (error) throw error;
  return data || [];
}
function avaliacoesHTML(avs, alunoId, staff) {
  const lista = [...avs].reverse();
  const ult = lista[0];
  const prox =
    ult && ult.proxima
      ? `<div class="card" style="border-color:rgba(70,214,255,.3)"><span class="eyebrow">Próxima avaliação</span><div class="h3" style="margin-top:4px">${fmtDia(ult.proxima)}</div><p class="small muted">${dia(ult.proxima) < new Date() ? 'Já passou da data: ' + (staff ? 'agende com o aluno.' : 'combine com seu treinador.') : 'Faltam ' + Math.ceil((dia(ult.proxima) - new Date()) / 86400000) + ' dias.'}</p></div>`
      : '';
  const pp = avs.filter((a) => a.peso != null).map((a) => ({ x: fmtCurto(a.data), y: +a.peso }));
  const pg = avs.map((a) => ({ x: fmtCurto(a.data), y: calcAval(a).gordura })).filter((p) => p.y != null);
  const charts =
    avs.length > 1
      ? `<div class="grid2 g-charts">${pp.length > 1 ? `<div class="card" style="padding:12px 8px"><span class="small muted" style="padding-left:6px;font-weight:700">Peso (kg)</span>${grafico(pp)}</div>` : ''}${pg.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">% de gordura</span>${grafico(pg, { unid: '%' })}</div>` : ''}</div>`
      : '';
  return `${staff ? `<a class="btn block" href="#/aluno/${alunoId}/avaliacao/nova" style="margin-bottom:14px">${I.plus} Nova avaliação</a>` : ''}${prox}${charts}
    <div class="stack" style="margin-top:12px">${
      lista.length
        ? lista
            .map((a) => {
              const r = calcAval(a);
              return `<a class="card tap av-item" href="#/relatorio/${a.id}"><div class="hist-date"><b>${dia(a.data).getDate()}</b><span>${MESES[dia(a.data).getMonth()]}</span></div>
        <div class="grow"><div class="h3">Avaliação de ${fmtDia(a.data)}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${a.peso ? `<span class="tag">${f1(a.peso)} kg</span>` : ''}${r.gordura != null ? `<span class="tag acc">${f1(r.gordura)}% gordura</span>` : ''}<span class="tag">${a.metodo === 'bioimpedancia' ? 'Bioimpedância' : esc((PROTOCOLOS[a.protocolo] || {}).nome || 'Medidas')}</span></div></div>${I.chev}</a>`;
            })
            .join('')
        : `<div class="empty"><div class="h3">Nenhuma avaliação ainda</div><p class="small">${staff ? 'Registre a primeira avaliação física deste aluno.' : 'Quando seu treinador fizer a sua avaliação física, o relatório aparece aqui.'}</p></div>`
    }</div>`;
}

async function formAvaliacao(alunoId, avId) {
  loading();
  const [{ data: m }, avs] = await Promise.all([
    sb.from('nx_membros').select('*').eq('org_id', S.org.id).eq('user_id', alunoId).maybeSingle(),
    buscarAvaliacoes(alunoId),
  ]);
  if (!m) {
    $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Aluno não encontrado</div></div>';
    return;
  }
  const ant = avs[avs.length - 1];
  const av = avId
    ? avs.find((a) => a.id === avId)
    : {
        data: hojeISO(),
        proxima: somaDias(hojeISO(), 60),
        sexo: m.sexo || ant?.sexo || '',
        idade: idadeEm(m.nascimento, hojeISO()) ?? ant?.idade ?? null,
        altura: ant?.altura ?? null,
        metodo: ant?.metodo || 'dobras',
        protocolo: ant?.protocolo || 'pollock7',
        dobras: {},
        bio: {},
        perimetros: {},
      };
  if (!av) {
    $app.innerHTML = '<div class="empty" style="margin-top:40px"><div class="h3">Avaliação não encontrada</div></div>';
    return;
  }
  const v = (x) => (x == null ? '' : String(x).replace('.', ','));
  const mk = (name) =>
    name === 'peso'
      ? 'data-mask="peso" inputmode="numeric"'
      : name === 'altura'
        ? 'data-mask="altura" inputmode="numeric"'
        : /^(idade|pa_sis|pa_dia|fc_rep)$/.test(name)
          ? 'data-mask="num" data-max="3" inputmode="numeric"'
          : /^p_/.test(name)
            ? 'data-mask="circ" inputmode="numeric"'
            : /^b_/.test(name)
              ? 'data-mask="dec" data-int="3" data-casas="1" inputmode="decimal"'
              : 'data-mask="dec" data-int="2" data-casas="1" inputmode="decimal"';
  const inp = (name, val, ph = '', unid = '') =>
    `<div class="inp-u"><input class="input" name="${name}" ${mk(name)} value="${esc(v(val))}" placeholder="${ph}">${unid ? `<em>${unid}</em>` : ''}</div>`;
  const radios = (name, val, ops) =>
    `<div class="radios">${ops.map(([k, l]) => `<label><input type="radio" name="${name}" value="${k}" ${val === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  $app.innerHTML = `
    <a class="back" href="#/aluno/${alunoId}/avaliacoes">${I.back} ${esc(m.nome)}</a>
    <p class="eyebrow">${avId ? 'Editar avaliação' : 'Nova avaliação física'}</p><h1 class="h1">${esc(firstName(m.nome))}</h1>
    ${ant && !avId ? `<p class="small muted" style="margin-top:6px">Última avaliação em ${fmtDia(ant.data)}. Altura, sexo e protocolo já vieram preenchidos.</p>` : ''}
    <form id="f-av" class="av-form" autocomplete="off">
      <div class="av-main">
        <div class="card"><span class="eyebrow">Dados</span>
          <div class="grid2" style="margin-top:12px"><label class="field"><span>Data da avaliação</span><input class="input" type="date" name="data" value="${esc(av.data)}" required></label><label class="field"><span>Próxima avaliação</span><input class="input" type="date" name="proxima" value="${esc(av.proxima || '')}"></label></div>
          <div class="field"><span>Sexo (usado nas equações)</span>${radios('sexo', av.sexo, [
            ['M', 'Masculino'],
            ['F', 'Feminino'],
          ])}</div>
          <div class="grid3"><label class="field"><span>Idade</span>${inp('idade', av.idade, '', 'anos')}</label><label class="field"><span>Peso</span>${inp('peso', av.peso, '', 'kg')}</label><label class="field"><span>Altura</span>${inp('altura', altM(av.altura), '1,75', 'm')}</label></div>
          <div class="grid3"><label class="field"><span>PA sistólica</span>${inp('pa_sis', av.pa_sis, '120', 'mmHg')}</label><label class="field"><span>PA diastólica</span>${inp('pa_dia', av.pa_dia, '80', 'mmHg')}</label><label class="field"><span>FC repouso</span>${inp('fc_rep', av.fc_rep, '', 'bpm')}</label></div>
        </div>
        <div class="card"><span class="eyebrow">Composição corporal</span>
          <div class="field" style="margin-top:12px"><span>Método</span>${radios('metodo', av.metodo, [
            ['dobras', 'Dobras cutâneas'],
            ['bioimpedancia', 'Bioimpedância'],
            ['perimetros', 'Perímetros (fita)'],
          ])}</div>
          <p class="tiny dim" id="b-perim" style="margin:-4px 0 10px">Método da Marinha americana: preencha pescoço, altura e, nos perímetros abaixo, abdômen na altura do umbigo (homens) ou cintura e quadril (mulheres).</p>
          <div id="b-dobras">
            <label class="field"><span>Protocolo</span><select class="input" name="protocolo">${Object.entries(
              PROTOCOLOS,
            )
              .map(([k, p]) => `<option value="${k}" ${av.protocolo === k ? 'selected' : ''}>${p.nome}</option>`)
              .join('')}</select></label>
            <p class="tiny dim" style="margin:-4px 0 10px">Meça até 3 vezes cada ponto (lado direito). O app usa a mediana automaticamente.</p>
            <div id="dobras">${DOBRAS.map(([k, l]) => {
              const ms = ((av.dobras || {})._medidas || {})[k] || [(av.dobras || {})[k]];
              return `<div class="dobra-row" data-dobra="${k}"><span>${l}</span>${[0, 1, 2].map((n) => `<input class="input c" name="d_${k}_${n}" data-mask="dec" data-int="2" data-casas="1" inputmode="decimal" value="${esc(v(ms[n]))}" placeholder="${n + 1}ª" aria-label="${l} medida ${n + 1}">`).join('')}<b data-med="${k}">–</b></div>`;
            }).join('')}</div>
            <p class="tiny dim" id="dobras-msg"></p>
          </div>
          <div id="b-bio"><div class="grid2">${BIO.map(([k, l, u]) => `<label class="field"><span>${l}</span>${inp('b_' + k, (av.bio || {})[k], '', u)}</label>`).join('')}</div></div>
        </div>
        <div class="card"><span class="eyebrow">Perímetros</span>
          <div class="grid3" style="margin-top:12px">${PERIM.map(([k, l]) => `<label class="field"><span>${l}</span>${inp('p_' + k, (av.perimetros || {})[k], '', 'cm')}</label>`).join('')}</div></div>
        <div class="card"><span class="eyebrow">Flexibilidade e observações</span>
          <label class="field" style="margin-top:12px"><span>Banco de Wells (sentar e alcançar)</span>${inp('flex', av.flexibilidade, '', 'cm')}</label>
          <label class="field"><span>Observações para o aluno</span><textarea class="textarea" name="obs" placeholder="Ex.: ótima evolução na cintura; manter foco no sono e hidratação">${esc(av.observacoes || '')}</textarea></label></div>
      </div>
      <aside class="av-side"><div class="card res-card" id="res"></div>
        <button class="btn block" type="submit" style="margin-top:12px">Salvar e ver relatório ${I.arrow}</button>
        ${avId ? '<button class="btn danger block sm" type="button" id="excluir" style="margin-top:8px">Excluir avaliação</button>' : ''}</aside>
    </form>`;
  const f = document.getElementById('f-av');
  const lerDobras = () => {
    const fd = new FormData(f);
    const o = {},
      med = {};
    DOBRAS.forEach(([k]) => {
      const l = [0, 1, 2].map((n) => num(fd.get(`d_${k}_${n}`))).filter((x) => x != null);
      if (l.length) {
        o[k] = Math.round(mediana(l) * 10) / 10;
        if (l.length > 1) med[k] = l;
      }
    });
    if (Object.keys(med).length) o._medidas = med;
    return o;
  };
  const ler = () => {
    const fd = new FormData(f);
    const g = (k) => fd.get(k);
    const obj = (pre, lista) => {
      const o = {};
      lista.forEach(([k]) => {
        const n = num(g(pre + k));
        if (n != null) o[k] = n;
      });
      return o;
    };
    const int = (k) => {
      const n = num(g(k));
      return n == null ? null : Math.round(n);
    };
    const metodo = g('metodo') || 'dobras';
    return {
      data: g('data'),
      proxima: g('proxima') || null,
      sexo: g('sexo') || null,
      idade: int('idade'),
      peso: num(g('peso')),
      altura: altCm(g('altura')),
      pa_sis: int('pa_sis'),
      pa_dia: int('pa_dia'),
      fc_rep: int('fc_rep'),
      metodo,
      protocolo: metodo === 'dobras' ? g('protocolo') : null,
      dobras: metodo === 'dobras' ? lerDobras() : {},
      bio: metodo === 'bioimpedancia' ? obj('b_', BIO) : {},
      perimetros: obj('p_', PERIM),
      flexibilidade: num(g('flex')),
      observacoes: (g('obs') || '').trim() || null,
    };
  };
  const atualizar = () => {
    const a = ler();
    const r = calcAval(a);
    document.getElementById('b-dobras').hidden = a.metodo !== 'dobras';
    document.getElementById('b-bio').hidden = a.metodo !== 'bioimpedancia';
    document.getElementById('b-perim').hidden = a.metodo !== 'perimetros';
    const prot = PROTOCOLOS[a.protocolo];
    const usadas = prot && a.sexo ? prot[a.sexo] : prot ? [...new Set([...prot.M, ...prot.F])] : [];
    f.querySelectorAll('[data-dobra]').forEach((el) => {
      el.hidden = !usadas.includes(el.dataset.dobra);
    });
    f.querySelectorAll('[data-med]').forEach((el) => {
      const x = (a.dobras || {})[el.dataset.med];
      el.textContent = x != null ? fN(x) + ' mm' : '–';
    });
    document.getElementById('dobras-msg').textContent = !a.sexo
      ? 'Escolha o sexo para ver as dobras do protocolo.'
      : a.protocolo !== 'faulkner' && a.idade == null
        ? 'Esse protocolo usa a idade: preencha a idade.'
        : a.protocolo === 'petroski' && a.sexo === 'F' && !(a.peso && a.altura)
          ? 'Petroski feminino usa peso e altura: preencha os dois.'
          : '';
    const linha = (l, val, extra = '') =>
      `<div class="res-l"><span>${l}</span><b>${val}</b>${extra ? `<em>${extra}</em>` : ''}</div>`;
    document.getElementById('res').innerHTML = `<span class="eyebrow">Resultado ao vivo</span>
      <div class="res-big"><b>${r.gordura != null ? f1(r.gordura) + '%' : '–'}</b><span>gordura corporal</span></div>
      ${linha('Massa gorda', r.massa_gorda != null ? f1(r.massa_gorda) + ' kg' : '–')}
      ${linha('Massa magra', r.massa_magra != null ? f1(r.massa_magra) + ' kg' : '–')}
      ${r.massa_muscular != null ? linha('Massa muscular', f1(r.massa_muscular) + ' kg') : ''}
      ${linha('IMC', r.imc != null ? f1(r.imc) : '–', clsIMC(r.imc))}
      ${linha('Relação cintura/quadril', r.rcq != null ? f1(r.rcq, 2) : '–', clsRCQ(r.rcq, a.sexo))}
      ${r.soma_dobras != null ? linha('Soma das dobras', f1(r.soma_dobras) + ' mm') : ''}
      ${r.densidade != null ? linha('Densidade corporal', f1(r.densidade, 4)) : ''}
      ${a.pa_sis && a.pa_dia ? linha('Pressão arterial', a.pa_sis + '/' + a.pa_dia, clsPA(a.pa_sis, a.pa_dia)) : ''}
      ${r.fc_max ? linha('FC máxima estimada', Math.round(r.fc_max) + ' bpm', 'Tanaka: 208 − 0,7 × idade') : ''}
      ${r.tmb ? linha('Metabolismo basal', Math.round(r.tmb) + ' kcal/dia', r.tmb_metodo) : ''}
      ${r.agua_pct ? linha('Água corporal estimada', f1(r.agua_l) + ' L · ' + f1(r.agua_pct) + '%', 'Watson') : ''}`;
  };
  f.oninput = atualizar;
  f.onchange = (e) => {
    if (e.target.name === 'data' && m.nascimento) {
      const i = idadeEm(m.nascimento, e.target.value);
      if (i != null) f.idade.value = i;
    }
    atualizar();
  };
  atualizar();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const btn = f.querySelector('[type=submit]');
    const a = ler();
    if (!a.data) return toast('Informe a data.', true);
    if (!a.peso) return toast('Informe o peso.', true);
    btn.disabled = true;
    const row = { ...a, resultados: calcAval(a) };
    let id = avId,
      error;
    if (avId) ({ error } = await sb.from('nx_avaliacoes').update(row).eq('id', avId));
    else {
      const r = await sb
        .from('nx_avaliacoes')
        .insert({ ...row, org_id: S.org.id, aluno_id: alunoId, avaliador_id: S.user.id })
        .select('id')
        .single();
      error = r.error;
      id = r.data && r.data.id;
    }
    if (error || !id) {
      btn.disabled = false;
      return toast('Não foi possível salvar a avaliação.', true);
    }
    if (!avId) notificar('avaliacao', id);
    if (a.sexo && m.sexo !== a.sexo)
      await sb.from('nx_membros').update({ sexo: a.sexo }).eq('org_id', S.org.id).eq('user_id', alunoId);
    toast('Avaliação salva!');
    location.hash = '#/relatorio/' + id;
  };
  const ex = document.getElementById('excluir');
  if (ex)
    ex.onclick = async () => {
      if (!confirm('Excluir esta avaliação? Não dá para desfazer.')) return;
      const { error } = await sb.from('nx_avaliacoes').delete().eq('id', avId);
      error
        ? toast('Não foi possível excluir.', true)
        : (toast('Avaliação excluída.'), (location.hash = `#/aluno/${alunoId}/avaliacoes`));
    };
}

// sugestão de recado do avaliador: pontos fortes, pontos de atenção e o próximo passo, com as referências que o relatório já usa
// (faixas de gordura do ACE, cintura e cintura/quadril da OMS, pressão pela Diretriz Brasileira 2025)
function sugestaoAvaliacao(av, r, ant, ra, nomeAluno) {
  const sx = av.sexo,
    fortes = [],
    atencao = [];
  const fx = (v, d = 1) => fN(v, d);
  const cint = num((av.perimetros || {}).cintura),
    cintA = ant ? num((ant.perimetros || {}).cintura) : null;
  if (r.gordura != null) {
    const fg = faixaG(r.gordura, sx);
    if (ra.gordura != null && ant && ant.metodo === av.metodo) {
      const d = r.gordura - ra.gordura;
      if (d <= -0.5)
        fortes.push(`a gordura corporal caiu ${fx(-d)} pontos, de ${fx(ra.gordura)}% para ${fx(r.gordura)}%`);
      else if (d >= 0.5)
        atencao.push(`a gordura corporal subiu ${fx(d)} pontos, de ${fx(ra.gordura)}% para ${fx(r.gordura)}%`);
    }
    if (fg === 'Atleta' || fg === 'Boa forma')
      fortes.push(`o percentual de gordura (${fx(r.gordura)}%) está na faixa de ${fg.toLowerCase()}`);
    else if (fg === 'Aceitável' && !fortes.length)
      fortes.push(`o percentual de gordura (${fx(r.gordura)}%) está na faixa aceitável`);
    else if (fg === 'Excesso')
      atencao.push(`o percentual de gordura (${fx(r.gordura)}%) está acima da faixa recomendada`);
  }
  if (r.massa_magra != null && ra.massa_magra != null && ant && ant.metodo === av.metodo) {
    const d = r.massa_magra - ra.massa_magra;
    if (d >= 0.5) fortes.push(`ganhou ${fx(d)} kg de massa magra`);
    else if (d <= -0.8) atencao.push(`perdeu ${fx(-d)} kg de massa magra, o que pede atenção à força e à alimentação`);
  }
  if (cint) {
    const c = clsCint(cint, sx);
    if (cintA && cint - cintA <= -1) fortes.push(`a cintura diminuiu ${fx(cintA - cint)} cm`);
    if (c === 'Dentro da referência' && !(cintA && cint - cintA <= -1))
      fortes.push(`a cintura (${fx(cint)} cm) está dentro da referência de saúde`);
    else if (c === 'Risco aumentado' || c === 'Risco muito aumentado')
      atencao.push(`a cintura (${fx(cint)} cm) está acima da referência de saúde (${sx === 'M' ? '94' : '80'} cm)`);
  }
  if (
    r.rcq != null &&
    clsRCQ(r.rcq, sx) === 'Acima da referência' &&
    !(cint && clsCint(cint, sx) !== 'Dentro da referência')
  )
    atencao.push(`a relação cintura/quadril (${fx(r.rcq, 2)}) está um pouco acima da referência`);
  if (av.pa_sis && av.pa_dia) {
    const pa = clsPA(av.pa_sis, av.pa_dia);
    if (pa === 'Normal') fortes.push(`a pressão arterial (${av.pa_sis}/${av.pa_dia}) está normal`);
    else if (pa === 'Pré-hipertensão')
      atencao.push(
        `a pressão (${av.pa_sis}/${av.pa_dia}) está na faixa de pré-hipertensão: vale medir de novo em outro dia, em repouso`,
      );
    else
      atencao.push(
        `a pressão (${av.pa_sis}/${av.pa_dia}) ficou alta na medida de hoje: o ideal é confirmar com um médico antes de treinos intensos`,
      );
  }
  if (av.fc_rep) {
    if (ant && ant.fc_rep && ant.fc_rep - av.fc_rep >= 3)
      fortes.push(
        `a frequência cardíaca de repouso caiu de ${ant.fc_rep} para ${av.fc_rep} bpm, sinal de melhora do condicionamento`,
      );
    else if (av.fc_rep <= 60)
      fortes.push(`a frequência cardíaca de repouso (${av.fc_rep} bpm) mostra um bom condicionamento`);
    else if (av.fc_rep >= 85)
      atencao.push(
        `a frequência cardíaca de repouso (${av.fc_rep} bpm) está alta: sono, estresse e cafeína influenciam, vale acompanhar`,
      );
  }
  if (ant && num(av.peso) && num(ant.peso) && !fortes.length && !atencao.length) {
    const dp = num(av.peso) - num(ant.peso);
    if (Math.abs(dp) >= 0.5) fortes.push(`o peso foi de ${fx(num(ant.peso))} para ${fx(num(av.peso))} kg`);
  }
  if (!fortes.length && !atencao.length) return '';
  const nome = nomeAluno ? firstName(nomeAluno) : '';
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const lista = (l) => (l.length > 1 ? l.slice(0, -1).join('; ') + '; e ' + l[l.length - 1] : l[0]);
  let t = `${nome ? nome + ', ' : ''}${
    ant
      ? fortes.length >= atencao.length
        ? 'comparei com a sua avaliação anterior e tem coisa boa aqui'
        : 'comparei com a sua avaliação anterior'
      : 'esta é a sua primeira avaliação com a gente: ela vira o nosso ponto de partida'
  }.`;
  if (fortes.length) t += `\n\nPontos fortes: ${lista(fortes)}.`;
  if (atencao.length) t += `\n\nPontos de atenção: ${lista(atencao)}.`;
  t += `\n\n${
    atencao.length
      ? 'Próximo passo: nada que a gente não trabalhe junto. Vou ajustar os treinos para esses pontos, e na próxima avaliação a gente compara.'
      : 'Próximo passo: manter a constância. Na próxima avaliação a gente compara e ajusta o que for preciso.'
  }`;
  return cap(t);
}
function editarRecadoAval(av, texto) {
  openSheet(
    `<p class="eyebrow">Avaliação de ${fmtDia(av.data)}</p><div class="h2" style="margin-top:4px">Recado do avaliador</div>
    <p class="small muted" style="margin-top:6px">Aparece para o aluno no relatório da avaliação. Edite à vontade antes de salvar.</p>
    <textarea class="input" id="ra-txt" rows="10" style="margin-top:12px">${esc(texto || av.observacoes || '')}</textarea>
    <button class="btn block" id="ra-ok" style="margin-top:12px">Salvar recado</button>`,
    (r) => {
      r.querySelector('#ra-ok').onclick = async () => {
        const b = r.querySelector('#ra-ok');
        b.disabled = true;
        const txt = r.querySelector('#ra-txt').value.trim() || null;
        const { error } = await sb.from('nx_avaliacoes').update({ observacoes: txt }).eq('id', av.id);
        if (error) {
          b.disabled = false;
          return toast('Não foi possível salvar.', true);
        }
        closeSheet();
        toast('Recado salvo. O aluno vê no relatório.');
        router();
      };
    },
  );
}
async function viewRelatorio(avId) {
  loading();
  const { data: av, error } = await sb.from('nx_avaliacoes').select('*').eq('id', avId).maybeSingle();
  if (error) throw error;
  if (!av) {
    $app.innerHTML =
      '<div class="empty" style="margin-top:40px"><div class="h3">Relatório não encontrado</div><a class="btn sm" href="#/" style="margin-top:12px">Voltar</a></div>';
    return;
  }
  const [avs, nome] = await Promise.all([
    buscarAvaliacoes(av.aluno_id),
    S.staff
      ? sb
          .from('nx_membros')
          .select('nome')
          .eq('org_id', S.org.id)
          .eq('user_id', av.aluno_id)
          .maybeSingle()
          .then((r) => r.data?.nome || 'Aluno')
      : Promise.resolve(S.me.nome),
  ]);
  const idx = avs.findIndex((a) => a.id === av.id);
  const ant = idx > 0 ? avs[idx - 1] : null;
  const ate = avs.slice(0, idx + 1);
  const r = calcAval(av),
    ra = ant ? calcAval(ant) : {};
  const voltar = S.staff ? `#/aluno/${av.aluno_id}/avaliacoes` : '#/historico/avaliacoes';
  const met = (l, val, prev, unid, bom, dec = 1, sub = '') =>
    val == null
      ? ''
      : `<div class="metric"><span>${l}</span><b>${f1(val, dec)}<small>${unid}</small></b>${prev != null ? deltaTag(val - prev, bom, unid ? ' ' + unid.trim() : '', dec) : ''}${sub ? `<em>${sub}</em>` : ''}</div>`;
  const tabela = (lista, cur, prev, unid) => {
    const ln = lista.filter(([k]) => (cur || {})[k] != null);
    if (!ln.length) return '';
    return `<div class="tbl">${ln.map(([k, l]) => `<div><span>${l}</span><b>${fN(cur[k])} ${unid}</b>${prev && prev[k] != null ? deltaTag(cur[k] - prev[k], null, '') : '<span></span>'}</div>`).join('')}</div>`;
  };
  const sx = av.sexo;
  const pts = (fn) => ate.map((a) => ({ x: fmtCurto(a.data), y: fn(a) })).filter((p) => p.y != null && isFinite(p.y));
  const pPeso = pts((a) => num(a.peso)),
    pG = pts((a) => calcAval(a).gordura ?? null);
  $app.innerHTML = `
    <div class="no-print row between"><a class="back" href="${voltar}" style="margin:0">${I.back} Voltar</a><div class="row" style="gap:8px">${S.staff ? `<a class="btn ghost sm" href="#/aluno/${av.aluno_id}/avaliacao/${av.id}">Editar</a>` : ''}<button class="btn ghost sm" id="imprimir">Salvar PDF</button></div></div>
    <div class="rel-head"><img src="${LOGO.s()}" alt=""><div><p class="eyebrow">Relatório de avaliação física</p><h1 class="h1" style="margin-top:4px">${esc(nome)}</h1>
      <p class="small muted">${fmtDia(av.data)}${av.idade ? ` · ${av.idade} anos` : ''}${av.altura ? ` · ${altM(av.altura)} m` : ''} · ${av.metodo === 'bioimpedancia' ? 'Bioimpedância' : av.metodo === 'perimetros' ? `Perímetros (Marinha americana)${av.avaliador_id === av.aluno_id ? ' · medidas feitas pelo aluno' : ''}` : esc((PROTOCOLOS[av.protocolo] || {}).nome || '')}${ant ? ` · comparado a ${fmtDia(ant.data)}` : ''}</p></div></div>
    ${composicaoHTML(av, r, ant && ant.metodo === av.metodo ? ra : {})}
    ${metasHTML(av, r)}
    <div class="metrics">
      ${met('Peso', num(av.peso), ant ? num(ant.peso) : null, ' kg', null)}
      ${met('Gordura corporal', r.gordura, ra.gordura, '%', 'down')}
      ${met('Massa magra', r.massa_magra, ra.massa_magra, ' kg', 'up')}
      ${met('Massa gorda', r.massa_gorda, ra.massa_gorda, ' kg', 'down')}
      ${met('Massa muscular', r.massa_muscular, ra.massa_muscular, ' kg', 'up')}
      ${met('IMC', r.imc, ra.imc, '', null, 1, clsIMC(r.imc))}
      ${met('Cintura/quadril', r.rcq, ra.rcq, '', 'down', 2, clsRCQ(r.rcq, sx))}
      ${met('Cintura', num((av.perimetros || {}).cintura), ant ? num((ant.perimetros || {}).cintura) : null, ' cm', 'down', 1, clsCint(num((av.perimetros || {}).cintura), sx))}
    </div>
    ${pPeso.length > 1 || pG.length > 1 ? `<div class="grid2 g-charts" style="margin-top:12px">${pPeso.length > 1 ? `<div class="card" style="padding:12px 8px"><span class="small muted" style="padding-left:6px;font-weight:700">Peso (kg)</span>${grafico(pPeso)}</div>` : ''}${pG.length > 1 ? `<div class="card" style="padding:12px 8px;margin-top:0"><span class="small muted" style="padding-left:6px;font-weight:700">% de gordura</span>${grafico(pG, { unid: '%' })}</div>` : ''}</div>` : ''}
    ${Object.keys(av.perimetros || {}).length ? `<div class="section"><div class="section-h"><h2 class="h2">Perímetros</h2>${slashes}</div>${tabela(PERIM, av.perimetros, ant && ant.perimetros, 'cm')}</div>` : ''}
    ${av.metodo === 'dobras' && Object.keys(av.dobras || {}).length ? `<div class="section"><div class="section-h"><h2 class="h2">Dobras cutâneas</h2>${slashes}</div>${tabela(DOBRAS, av.dobras, ant && ant.metodo === 'dobras' && ant.dobras, 'mm')}${r.soma_dobras != null ? `<p class="small muted" style="margin-top:8px">Soma do protocolo: <b>${f1(r.soma_dobras)} mm</b>${ra.soma_dobras != null ? ' ' + deltaTag(r.soma_dobras - ra.soma_dobras, 'down', ' mm') : ''}</p>` : ''}</div>` : ''}
    ${
      av.metodo === 'bioimpedancia' && Object.keys(av.bio || {}).length
        ? `<div class="section"><div class="section-h"><h2 class="h2">Bioimpedância</h2>${slashes}</div><div class="tbl">${BIO.filter(
            ([k]) => av.bio[k] != null,
          )
            .map(
              ([k, l, u]) =>
                `<div><span>${l}</span><b>${f1(av.bio[k])} ${u}</b>${ant && ant.bio && ant.bio[k] != null ? deltaTag(av.bio[k] - ant.bio[k], null, '') : '<span></span>'}</div>`,
            )
            .join('')}</div></div>`
        : ''
    }
    ${
      av.pa_sis || av.fc_rep || av.flexibilidade != null || r.tmb
        ? `<div class="section"><div class="section-h"><h2 class="h2">Outros dados</h2>${slashes}</div><div class="tbl">
      ${av.pa_sis ? `<div><span>Pressão arterial${av.pa_dia ? `<br><em class="tbl-sub">${clsPA(av.pa_sis, av.pa_dia)}</em>` : ''}</span><b>${av.pa_sis}/${av.pa_dia || '–'} mmHg</b><span></span></div>` : ''}
      ${r.tmb ? `<div><span>Metabolismo basal<br><em class="tbl-sub">${r.tmb_metodo}</em></span><b>${Math.round(r.tmb)} kcal/dia</b><span></span></div>` : ''}
      ${av.fc_rep ? `<div><span>FC de repouso</span><b>${av.fc_rep} bpm</b>${ant && ant.fc_rep ? deltaTag(av.fc_rep - ant.fc_rep, 'down', '', 0) : '<span></span>'}</div>` : ''}
      ${av.flexibilidade != null ? `<div><span>Flexibilidade (Wells)</span><b>${f1(av.flexibilidade)} cm</b>${ant && ant.flexibilidade != null ? deltaTag(av.flexibilidade - ant.flexibilidade, 'up', '') : '<span></span>'}</div>` : ''}</div></div>`
        : ''
    }
    ${
      r.fc_max
        ? `<div class="section"><div class="section-h"><h2 class="h2">Zonas de frequência cardíaca</h2>${slashes}</div>
      <p class="small muted" style="margin-bottom:10px">FC máxima estimada <b style="color:var(--ink)">${Math.round(r.fc_max)} bpm</b> (Tanaka)${av.fc_rep ? ` · zonas por FC de reserva (Karvonen), repouso ${av.fc_rep} bpm` : ' · percentual da FC máxima'}</p>
      <div class="zonas">${zonasFC(r.fc_max, av.fc_rep)
        .map(
          (z, i) => `<div class="zona z${i + 1}"><b>${z.z}</b><span>${z.n}</span><em>${z.de}–${z.ate} bpm</em></div>`,
        )
        .join('')}</div></div>`
        : ''
    }
    ${S.staff && !av.observacoes ? '<div id="sug-aval" class="no-print"></div>' : ''}
    ${av.observacoes ? `<div class="card" style="margin-top:24px;border-color:rgba(70,214,255,.3)"><span class="eyebrow">Recado do avaliador</span><p style="margin-top:6px;white-space:pre-line">${esc(av.observacoes)}</p></div>` : ''}
    ${av.proxima ? `<div class="card"><span class="eyebrow">Próxima avaliação</span><div class="h3" style="margin-top:4px">${fmtDia(av.proxima)}</div></div>` : ''}
    <p class="tiny dim" style="margin-top:16px">Os percentuais de gordura são estimativas por equações de referência (Jackson & Pollock, Petroski, Faulkner, conversão de Siri) ou pela balança de bioimpedância. Servem para acompanhar a sua evolução ao longo do tempo e não são diagnóstico. Classificações de IMC, cintura e cintura/quadril seguem a OMS; pressão arterial, a Diretriz Brasileira de Hipertensão Arterial (2025), que passou a chamar de pré-hipertensão a pressão de 120/80 a 139/89. FC máxima por Tanaka (2001); zonas por Karvonen; metabolismo basal por Katch-McArdle ou Mifflin-St Jeor.</p>
    <p class="tiny dim" style="margin-top:6px">Nexos Performance e Saúde · São Luís–MA</p>`;
  document.getElementById('imprimir').onclick = () => window.print();
  const sgA = document.getElementById('sug-aval');
  if (sgA)
    cartaoSugestao(sgA, {
      chave: 'sug:aval:' + av.id,
      titulo: 'Sugestão de recado do avaliador',
      texto: sugestaoAvaliacao(av, r, ant, ra, nome),
      destino: 'Abre o Recado do avaliador para você editar e salvar.',
      usar: (t) => editarRecadoAval(av, t),
    });
}
