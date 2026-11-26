/* Nexos App · Modo demonstração (só para a equipe)
   Para gravar vídeos e mostrar o app sem expor aluno de verdade: troca, só neste aparelho e só nesta aba, os dados do
   app por uma assessoria fictícia (atleta principal: Ana Júlia Costa). Nada é lido nem gravado no banco enquanto o modo
   estiver ligado: as buscas respondem com os dados inventados e o que se salva fica só na memória. Liga e desliga em
   Mais › Modo demonstração; fechar o app também desliga. */

const DEMO_ON = (() => {
  try {
    return sessionStorage.getItem('nx-demo') === '1';
  } catch {
    return false;
  }
})();
function demoLigar() {
  try {
    sessionStorage.setItem('nx-demo', '1');
  } catch {
    return toast('Não foi possível ligar o modo demonstração neste navegador.', true);
  }
  location.hash = '#/';
  location.reload();
}
function demoDesligar() {
  try {
    sessionStorage.removeItem('nx-demo');
  } catch {}
  location.hash = '#/';
  location.reload();
}

/* ---------- dados fictícios ---------- */
let DEMO_DADOS = null;
function demoGerar(uid, eu) {
  let s = 11;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const DIA = 864e5,
    agora = Date.now();
  const iso = (t) => new Date(t).toISOString(),
    dia = (t) => iso(t - 3 * 3600e3).slice(0, 10);
  const hoje0 = new Date(dia(agora) + 'T00:00:00-03:00').getTime();
  const seg0 = hoje0 - ((new Date(hoje0 + 12 * 3600e3).getDay() + 6) % 7) * DIA;
  const org = { id: 'demo-org', nome: 'Nexos', slug: 'nexos', config: {} };
  const A = 'demo-ana';
  const al = (id, nome, sexo, mods, extra = {}) => ({
    id: 'm-' + id,
    user_id: id,
    org_id: org.id,
    papel: 'aluno',
    ativo: true,
    nome,
    sexo,
    aprovacao: 'aprovado',
    treinador_id: uid,
    modalidades: mods,
    criado_em: iso(hoje0 - (60 + rnd() * 150) * DIA),
    email: id + '@demo.nexos',
    ...extra,
  });
  const ana = al(A, 'Ana Júlia Costa', 'F', ['corrida', 'musculacao'], {
    nascimento: '1996-04-12',
    objetivo: 'Meia maratona abaixo de 1h50',
    corrida: { fc_rep: 54, fc_max: 189 },
    telefone: '98900000000',
    criado_em: iso(hoje0 - 190 * DIA),
  });
  const outros = [
    al('demo-2', 'Rafael Mendes', 'M', ['corrida']),
    al('demo-3', 'Larissa Pinheiro', 'F', ['corrida', 'musculacao']),
    al('demo-4', 'Bruno Carvalho', 'M', ['musculacao']),
    al('demo-5', 'Camila Rocha', 'F', ['corrida']),
    al('demo-6', 'Thiago Moraes', 'M', ['corrida', 'musculacao']),
  ];
  // 6 meses de corrida da Ana: seg intervalado, qua rodagem, sex ritmo, dom longão, com evolução constante
  const corr = [];
  let n = 0;
  const alunos = [A, ...outros.filter((o) => o.modalidades.includes('corrida')).map((o) => o.user_id)];
  alunos.forEach((aid, ai) => {
    for (let d = aid === A ? 182 : 40; d >= 1; d--) {
      const t = hoje0 - d * DIA + (6 + ai * 0.5) * 3600e3 + ((rnd() * 40) | 0) * 60e3,
        wd = new Date(t).getDay(),
        p = 1 - d / 182;
      const mk = (tit, km, pace, fc, rpe, tipo) => {
        const dur = Math.round(km * pace * (0.99 + rnd() * 0.02));
        corr.push({
          id: 'demo-r' + ++n,
          org_id: org.id,
          aluno_id: aid,
          data: iso(t),
          tipo: 'corrida',
          titulo: tit,
          distancia_m: Math.round(km * 1000),
          duracao_s: dur,
          fc_media: fc,
          fc_max: fc + 15,
          rpe,
          cadencia: 168 + Math.round(p * 8),
          fonte: 'garmin',
          elev_ganho: 30 + ((rnd() * 40) | 0),
          visto_treinador: d > 2,
          _tipo: tipo,
        });
      };
      if (wd === 1) mk('Intervalado', 6.5 + p * 1.5, 352 - 50 * p, (162 - 3 * p) | 0, 8, 'intervalado');
      else if (wd === 3) mk('Rodagem leve', 6 + p * 2, 392 - 50 * p, (147 - 5 * p) | 0, 4, 'rodagem');
      else if (wd === 5) mk('Ritmo', 6 + p * 2, 335 - 42 * p, (168 - 3 * p) | 0, 7, 'ritmo');
      else if (wd === 0) mk('Longão', 9 + p * 7, 400 - 50 * p, (150 - 5 * p) | 0, 5, 'longao');
    }
  });
  corr.sort((a, b) => (a.data < b.data ? -1 : 1));
  // check-in da manhã: hoje com dor no joelho direito (o treinador recebe e ajusta a carga)
  const pront = [];
  for (let d = 120; d >= 0; d--) {
    const v = () => (rnd() < 0.75 ? 5 : 4);
    const r = {
      id: 'demo-pr' + d,
      org_id: org.id,
      aluno_id: A,
      dia: dia(hoje0 - d * DIA + 12 * 3600e3),
      sono: v(),
      energia: v(),
      dor: rnd() < 0.85 ? 5 : 4,
      estresse: v(),
      alerta: false,
      criado_em: iso(hoje0 - d * DIA + 7 * 3600e3),
    };
    if (d === 0)
      Object.assign(r, {
        sono: 3,
        energia: 3,
        dor: 2,
        alerta: true,
        dor_locais: ['joelho_d'],
        dor_int: 5,
        obs: 'Senti o joelho direito na descida da escada.',
      });
    r.total = r.sono + r.energia + r.dor + r.estresse;
    pront.push(r);
  }
  // planilha de corrida: semana atual e a próxima, liberadas
  const plano = [];
  const est = {
    intervalado: [
      { k: 'aq', v: 15, med: 'min', z: 'leve' },
      {
        k: 'rep',
        n: 6,
        itens: [
          { k: 'tiro', v: 800, med: 'm', z: 'limiar' },
          { k: 'rec', v: 2, med: 'min', z: 'rec' },
        ],
      },
      { k: 'dq', v: 10, med: 'min', z: 'rec' },
    ],
    rodagem: [{ k: 'lv', v: 45, med: 'min', z: 'leve' }],
    ritmo: [
      { k: 'aq', v: 15, med: 'min', z: 'leve' },
      { k: 'ritmo', v: 20, med: 'min', z: 'moderado' },
      { k: 'dq', v: 10, med: 'min', z: 'rec' },
    ],
    longao: [{ k: 'lv', v: 16, med: 'km', z: 'leve' }],
  };
  const dias = {
    0: ['intervalado', 'Intervalado 6 × 800 m'],
    2: ['rodagem', 'Rodagem leve'],
    4: ['ritmo', 'Ritmo 20 min'],
    6: ['longao', 'Longão 16 km'],
  };
  for (let sem = -3; sem <= 1; sem++)
    Object.entries(dias).forEach(([o, [tipo, tit]]) => {
      const t = seg0 + (sem * 7 + +o) * DIA + 12 * 3600e3;
      const id = `demo-pl-${sem}-${o}`;
      plano.push({
        id,
        org_id: org.id,
        aluno_id: A,
        data: dia(t),
        tipo,
        titulo: tit,
        liberado: true,
        estrutura: est[tipo],
        criado_por: uid,
      });
      const feito = corr.find((c) => c.aluno_id === A && dia(Date.parse(c.data)) === dia(t));
      if (feito) feito.plano_id = id;
    });
  // força: dois treinos por semana (terça e quinta), semanas liberadas
  const ex = (id, nome, grupo, eq) => ({ id, nome, grupo, equipamento: eq });
  const item = (tid, o, e, series, reps, carga) => ({
    id: `${tid}-i${o}`,
    treino_id: tid,
    ordem: o,
    exercicio_id: e.id,
    series,
    repeticoes: reps,
    carga_kg: carga,
    nx_exercicios: e,
  });
  const exs = {
    ag: ex('demo-e1', 'Agachamento goblet', 'Pernas', 'Halter'),
    rdl: ex('demo-e2', 'Levantamento terra romeno', 'Posterior', 'Barra'),
    bulg: ex('demo-e3', 'Afundo búlgaro', 'Pernas', 'Halter'),
    pel: ex('demo-e4', 'Elevação pélvica', 'Glúteos', 'Barra'),
    pant: ex('demo-e5', 'Panturrilha em pé', 'Panturrilha', 'Máquina'),
    pr: ex('demo-e6', 'Prancha lateral', 'Core', 'Peso do corpo'),
    rem: ex('demo-e7', 'Remada curvada', 'Costas', 'Barra'),
    sup: ex('demo-e8', 'Supino com halteres', 'Peito', 'Halter'),
  };
  const treinos = [
    {
      id: 'demo-tA',
      org_id: org.id,
      aluno_id: A,
      titulo: 'Treino A',
      foco: 'Inferiores e core',
      ativo: true,
      dias: [2],
      ordem: 0,
      nx_treino_itens: [
        item('demo-tA', 0, exs.ag, 3, '10', 20),
        item('demo-tA', 1, exs.rdl, 3, '8', 40),
        item('demo-tA', 2, exs.pant, 3, '15', 40),
        item('demo-tA', 3, exs.pr, 3, '30 s', null),
      ],
    },
    {
      id: 'demo-tB',
      org_id: org.id,
      aluno_id: A,
      titulo: 'Treino B',
      foco: 'Unilateral e superiores',
      ativo: true,
      dias: [4],
      ordem: 1,
      nx_treino_itens: [
        item('demo-tB', 0, exs.bulg, 3, '10', 10),
        item('demo-tB', 1, exs.pel, 3, '12', 60),
        item('demo-tB', 2, exs.rem, 3, '10', 30),
        item('demo-tB', 3, exs.sup, 3, '10', 12),
      ],
    },
  ];
  const semanas = [-3, -2, -1, 0, 1].map((k) => ({
    org_id: org.id,
    aluno_id: A,
    semana: dia(seg0 + k * 7 * DIA + 12 * 3600e3),
    id: 'demo-fs' + k,
  }));
  const sessoes = [];
  for (let k = -3; k <= 0; k++)
    [
      [1, 'demo-tA', 'Treino A · Inferiores e core'],
      [3, 'demo-tB', 'Treino B · Unilateral e superiores'],
    ].forEach(([o, tid, tit]) => {
      const t = seg0 + (k * 7 + o) * DIA + 18 * 3600e3;
      if (t > agora) return;
      sessoes.push({
        id: `demo-s${k}${o}`,
        org_id: org.id,
        aluno_id: A,
        treino_id: tid,
        treino_titulo: tit,
        iniciado_em: iso(t),
        finalizado_em: iso(t + 52 * 60e3),
        esforco: 7,
        psr: 8,
        visto_treinador: k < 0,
        itens_feitos: [],
        total_itens: 4,
      });
    });
  // análise biomecânica da corrida (de lado), já comentada
  const passada = {
    id: 'demo-ps1',
    org_id: org.id,
    aluno_id: A,
    criado_por: A,
    criado_em: iso(hoje0 - 3 * DIA + 19 * 3600e3),
    vista: 'lado',
    local: 'esteira',
    metricas: {
      cadencia: 172,
      contato: 248,
      tibia: 6.2,
      frente: 9.8,
      joelhoIC: 18.5,
      joelhoMax: 44.2,
      tronco: 7.5,
      oscilacao: 8.1,
      cotovelo: 84,
      bracoFrente: 28,
      bracoTras: 31,
      coxaIC: 23.1,
      pe: 9.4,
      coxaTO: 18.2,
      joelhoBal: 96.5,
    },
    qualidade: { ok: true, fps: 60, vis: 0.98, razao: 0.07, altura: 166, apoios: 8, avisos: [], deteccao: 0.99 },
    quadros: [
      { path: 'demo/passada-0.jpg', legenda: 'Toque do pé no chão' },
      { path: 'demo/passada-1.jpg', legenda: 'Meio do apoio' },
    ],
    serie: null,
    extra: {
      an: { dir: 1, lado: 'D', vista: 'lado', altura: 166 },
      rel: { passos: '', textos: {} },
      lados: {
        D: {
          tibia: 6.2,
          joelhoIC: 18.5,
          coxaIC: 23.1,
          pe: 9.4,
          frente: 9.8,
          joelhoMax: 44.2,
          contato: 248,
          coxaTO: 18.2,
          joelhoBal: 96.5,
          apoios: 4,
        },
        E: {
          tibia: 7.9,
          joelhoIC: 16.2,
          coxaIC: 24.6,
          pe: 10.8,
          frente: 11.5,
          joelhoMax: 41.0,
          contato: 256,
          coxaTO: 16.4,
          joelhoBal: 94.0,
          apoios: 4,
        },
      },
      ritmo: { kmh: 10 },
      camera: { fps: 60, auto: true, fator: 2 },
      ajustes: {},
    },
    comentario: null,
    relatorio_path: null,
  };
  const membros = [
    {
      id: 'm-eu',
      user_id: uid,
      org_id: org.id,
      papel: 'admin',
      ativo: true,
      nome: eu.nome || 'Treinador',
      foto_url: eu.foto_url || null,
      telefone: '98900000001',
      nx_orgs: org,
    },
    ana,
    ...outros,
  ];
  // tênis da aluna principal: as corridas dela entram no tênis principal
  const tenis = [
    {
      id: 'demo-tn1',
      org_id: org.id,
      aluno_id: A,
      nome: 'Asics Novablast 5',
      inicio: dia(hoje0 - 120 * DIA),
      km_inicial: 0,
      limite_km: 1000,
      principal: true,
      aposentado_em: null,
      criado_em: iso(hoje0 - 120 * DIA),
    },
    {
      id: 'demo-tn2',
      org_id: org.id,
      aluno_id: A,
      nome: 'Nike Vaporfly 3',
      inicio: dia(hoje0 - 60 * DIA),
      km_inicial: 38,
      limite_km: 400,
      principal: false,
      aposentado_em: null,
      criado_em: iso(hoje0 - 60 * DIA),
    },
  ];
  corr.forEach((c) => {
    if (c.aluno_id === A && ['corrida', 'trail', 'esteira'].includes(c.tipo || 'corrida')) c.tenis_id = 'demo-tn1';
  });
  return {
    org,
    tabelas: {
      nx_membros: membros,
      nx_tenis: tenis,
      nx_orgs: [org],
      nx_corridas: corr,
      nx_prontidao: pront,
      nx_plano_corrida: plano,
      nx_treinos: treinos,
      nx_treino_itens: treinos.flatMap((t) => t.nx_treino_itens),
      nx_forca_semanas: semanas,
      nx_sessoes: sessoes,
      nx_passadas: [passada],
      // taxa de suor da atleta principal: 4 medições em dias de calor diferente (dá a taxa prevista pelo calor)
      nx_taxa_suor: [
        [30, 58.4, 57.9, 50, 150, 26, 84, false],
        [20, 58.2, 57.5, 60, 200, 28, 78, false],
        [10, 58.0, 57.2, 60, 250, 30, 70, true],
        [2, 58.1, 57.15, 65, 300, 32, 66, true],
      ].map(([d, pa, pd, mn, bb, t, u, sl], i) => ({
        id: 'demo-su' + i,
        org_id: org.id,
        aluno_id: A,
        dia: dia(hoje0 - d * DIA),
        peso_antes: pa,
        peso_depois: pd,
        dur_min: mn,
        bebeu_ml: bb,
        xixi_ml: 0,
        temp_c: t,
        umid: u,
        sens_c: null,
        corrida_id: null,
        pace_s_km: 345 - i * 5,
        fc_media: 152 + i,
        sal: sl,
        balanca_g: 50,
        criado_em: iso(hoje0 - d * DIA + 7 * 3600e3),
      })),
      nx_consentimentos: membros.map((m) => ({ id: 'demo-c-' + m.user_id, aluno_id: m.user_id, org_id: org.id })),
      nx_anamneses: [ana, ...outros].map((m) => ({
        id: 'demo-a-' + m.user_id,
        aluno_id: m.user_id,
        org_id: org.id,
        parq_positivo: false,
        respostas: {},
      })),
      nx_metas: [
        {
          id: 'demo-mt1',
          aluno_id: A,
          org_id: org.id,
          ativa: true,
          tipo: 'tempo',
          distancia_m: 21097,
          tempo_alvo_s: 6600,
          tempo_inicial_s: 7500,
          prazo: dia(hoje0 + 42 * DIA),
          criado_em: iso(hoje0 - 150 * DIA),
        },
      ],
      nx_participacoes: [
        {
          id: 'demo-pv1',
          org_id: org.id,
          aluno_id: A,
          titulo: 'Meia Maratona de São Luís',
          data: dia(hoje0 + 42 * DIA),
          distancia: '21 km',
        },
      ],
      nx_ciclos_aplicados: [
        {
          aluno_id: A,
          tipo: 'corrida',
          ciclo_id: '21k-int',
          nome: 'Meia maratona · intermediário',
          inicio: dia(hoje0 - 40 * DIA),
          fim: dia(hoje0 + 42 * DIA),
        },
      ],
      nx_avaliacoes: [
        { id: 'demo-av1', aluno_id: A, org_id: org.id, data: dia(hoje0 - 170 * DIA), peso: 61.2, gordura: 24.8 },
        { id: 'demo-av2', aluno_id: A, org_id: org.id, data: dia(hoje0 - 90 * DIA), peso: 60.9, gordura: 22.9 },
        { id: 'demo-av3', aluno_id: A, org_id: org.id, data: dia(hoje0 - 12 * DIA), peso: 60.6, gordura: 21.4 },
      ],
      nx_integracoes: [
        {
          user_id: A,
          provedor: 'garmin',
          ultima_sync: iso(agora - 3600e3),
          erro: null,
          conectado_em: dia(hoje0 - 182 * DIA),
        },
      ],
      nx_registros: [],
      nx_resumos: [],
    },
  };
}

/* ---------- motor: responde as buscas do app com os dados fictícios ---------- */
function demoInstalar() {
  const orig = { from: sb.from.bind(sb) };
  let pronto = null;
  const preparar = () =>
    (pronto =
      pronto ||
      (async () => {
        const { data } = await sb.auth.getSession();
        const uid = data && data.session && data.session.user.id;
        let eu = {};
        if (uid) {
          const r = await orig.from('nx_membros').select('nome,foto_url').eq('user_id', uid).limit(1);
          eu = (r.data && r.data[0]) || {};
        }
        DEMO_DADOS = demoGerar(uid || 'demo-eu', eu);
      })());
  const cmp = (a, b) => (a == null ? -1 : b == null ? 1 : a < b ? -1 : a > b ? 1 : 0);
  const busca = (t) => {
    const st = { single: false, f: [], ord: [], lim: null, escrita: null, dados: null };
    const F = (op) => (c, v) => {
      const col = String(c).split('.').pop();
      st.f.push((r) => !(col in r) || op(r[col], v));
      return p;
    };
    const p = {
      select: () => p,
      eq: F((a, b) => a === b),
      neq: F((a, b) => a !== b),
      in: F((a, b) => (b || []).includes(a)),
      gte: F((a, b) => a == null || a >= b),
      lte: F((a, b) => a == null || a <= b),
      gt: F((a, b) => a == null || a > b),
      lt: F((a, b) => a == null || a < b),
      is: F((a, b) => (b === null ? a == null : a === b)),
      ilike: () => p,
      like: () => p,
      or: () => p,
      not: () => p,
      filter: () => p,
      match: () => p,
      contains: () => p,
      range: () => p,
      returns: () => p,
      abortSignal: () => p,
      order: (c, o) => (st.ord.push([c, !(o && o.ascending === false)]), p),
      limit: (n) => ((st.lim = n), p),
      maybeSingle: () => ((st.single = true), p),
      single: () => ((st.single = true), p),
      insert: (x) => ((st.escrita = 'insert'), (st.dados = x), p),
      upsert: (x) => ((st.escrita = 'upsert'), (st.dados = x), p),
      update: (x) => ((st.escrita = 'update'), (st.dados = x), p),
      delete: () => ((st.escrita = 'delete'), p),
      then: (ok, er) =>
        preparar()
          .then(() => {
            const tb = (DEMO_DADOS.tabelas[t] = DEMO_DADOS.tabelas[t] || []);
            const filtra = (r) => st.f.every((fn) => fn(r));
            if (st.escrita === 'insert' || st.escrita === 'upsert') {
              const novos = (Array.isArray(st.dados) ? st.dados : [st.dados]).map((r) => ({
                id: 'demo-' + Math.random().toString(36).slice(2),
                criado_em: new Date().toISOString(),
                ...r,
              }));
              tb.push(...novos);
              return { data: st.single ? novos[0] : novos, error: null };
            }
            if (st.escrita === 'update') {
              const alvo = tb.filter(filtra);
              alvo.forEach((r) => Object.assign(r, st.dados));
              return { data: st.single ? alvo[0] || null : alvo, error: null };
            }
            if (st.escrita === 'delete') {
              DEMO_DADOS.tabelas[t] = tb.filter((r) => !filtra(r));
              return { data: null, error: null };
            }
            let d = tb.filter(filtra);
            if (st.ord.length)
              d = d.slice().sort((a, b) => {
                for (const [c, asc] of st.ord) {
                  const x = asc ? cmp(a[c], b[c]) : cmp(b[c], a[c]);
                  if (x) return x;
                }
                return 0;
              });
            if (st.lim) d = d.slice(0, st.lim);
            const v = st.single ? d[0] || null : d;
            return { data: v, error: null, count: Array.isArray(v) ? v.length : v ? 1 : 0 };
          })
          .then(ok, er),
      catch: (er) => p.then(undefined, er),
      finally: (fn) => p.then((x) => (fn(), x)),
    };
    return p;
  };
  // propriedades próprias por cima das do cliente (algumas são só de leitura no protótipo)
  const troca = (k, v) => Object.defineProperty(sb, k, { value: v, configurable: true, writable: true });
  troca('from', (t) => busca(t));
  troca('rpc', (nome) => {
    const p = {
      then: (ok, er) =>
        preparar()
          .then(() => {
            const eq = DEMO_DADOS.tabelas.nx_membros.filter((m) => m.papel !== 'aluno');
            if (nome === 'nx_equipe' || nome === 'nx_contatos_equipe') return { data: eq, error: null };
            return { data: null, error: null };
          })
          .then(ok, er),
      catch: (er) => p.then(undefined, er),
    };
    return p;
  });
  troca('storage', {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
      download: async () => ({ data: null, error: new Error('demonstração') }),
      remove: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      createSignedUrl: async (path) => ({ data: { signedUrl: demoImagem(path) }, error: null }),
      createSignedUrls: async (ps) => ({
        data: ps.map((path) => ({ path, signedUrl: demoImagem(path) })),
        error: null,
      }),
    }),
  });
  troca('functions', { invoke: async () => ({ data: { ok: true }, error: null }) });
  troca('channel', () => {
    const c = { on: () => c, subscribe: () => c, unsubscribe: () => {}, send: () => {}, track: () => {} };
    return c;
  });
  troca('removeChannel', () => {});
}
// quadros da análise da corrida: esqueleto desenhado sobre fundo escuro (não há pessoa real na demonstração)
const DEMO_IMG = {};
function demoImagem(path) {
  if (DEMO_IMG[path]) return DEMO_IMG[path];
  const cv = document.createElement('canvas');
  cv.width = 540;
  cv.height = 860;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, '#0d1f3f');
  g.addColorStop(1, '#050b18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  for (let y = 790; y < 860; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(540, y);
    ctx.stroke();
  }
  const apoio = /-1\./.test(path);
  // corredor de lado indo para a direita: pontos nos índices do MediaPipe
  const p = [];
  const set = (k, x, y) => (p[PS_P[k]] = [x, y, 1]);
  set('nariz', 300, 150);
  set('ombroE', 275, 230);
  set('ombroD', 282, 232);
  set('cotoveloE', apoio ? 230 : 320, 320);
  set('cotoveloD', apoio ? 330 : 240, 318);
  set('punhoE', apoio ? 260 : 360, 380);
  set('punhoD', apoio ? 360 : 265, 372);
  set('quadrilE', 262, 450);
  set('quadrilD', 268, 452);
  set('joelhoD', apoio ? 290 : 330, apoio ? 600 : 590);
  set('tornD', apoio ? 275 : 300, 760);
  set('calcD', apoio ? 255 : 285, 775);
  set('pontaD', apoio ? 320 : 345, 778);
  set('joelhoE', apoio ? 210 : 220, apoio ? 560 : 600);
  set('tornE', apoio ? 150 : 170, apoio ? 640 : 700);
  set('calcE', apoio ? 130 : 150, apoio ? 630 : 690);
  set('pontaE', apoio ? 175 : 195, apoio ? 660 : 715);
  for (let i = 0; i < 33; i++) if (!p[i]) p[i] = null;
  psEsqueleto(ctx, p, 1, 'D');
  const lin = (a, b, c) => psLinha(ctx, a, b, c, 6);
  if (!apoio) {
    lin(p[PS_P.joelhoD], p[PS_P.tornD], '#22c55e');
    psLinha(ctx, p[PS_P.tornD], [p[PS_P.tornD][0], 560], 'rgba(255,255,255,.7)', 2, [8, 8]);
    psEtiqueta(ctx, 350, 640, 'Canela 6°', '#22c55e');
    psEtiqueta(ctx, 330, 470, 'Pé à frente 10 cm', '#22c55e');
  } else {
    lin(p[PS_P.quadrilD], p[PS_P.joelhoD], '#22c55e');
    lin(p[PS_P.joelhoD], p[PS_P.tornD], '#22c55e');
    psEtiqueta(ctx, 320, 560, 'Joelho 44°', '#22c55e');
    lin(p[PS_P.quadrilD], p[PS_P.ombroD], '#46d6ff');
    psEtiqueta(ctx, 300, 250, 'Tronco 7°', '#46d6ff');
  }
  psEtiqueta(ctx, 16, 20, 'Cadência 172 passos/min', '#46d6ff');
  return (DEMO_IMG[path] = cv.toDataURL('image/jpeg', 0.88));
}
if (DEMO_ON) demoInstalar();

/** faixa na tela Hoje do treinador enquanto a demonstração estiver ligada (fica fora das telas da ficha do aluno) */
function demoFaixaHTML() {
  return DEMO_ON
    ? '<div class="card demo-faixa"><div class="grow"><b>Modo demonstração</b><div class="small muted">Dados fictícios. Nada aqui vai para o banco.</div></div><button type="button" class="btn ghost sm" onclick="demoDesligar()">Sair</button></div>'
    : '';
}
