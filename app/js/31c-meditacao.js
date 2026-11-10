/* Nexos App · Meditação (Mais › Entretenimento): sessões guiadas por voz, exercícios de respiração com sons que
   guiam a inspiração e a expiração, sons de fundo, meditação livre com sino, sequência de dias e humor depois da sessão.
   Parte 31c: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo.
   Base: respiração lenta, perto de 6 por minuto, acalma o corpo (Zaccaro et al., 2018, Front Hum Neurosci);
   o suspiro fisiológico (duas inspirações e uma expiração longa) melhora o humor e reduz a ansiedade em poucos minutos
   (Balban et al., 2023, Cell Rep Med); atenção plena ajuda atletas a lidar com ansiedade e estresse
   (Bühlmayer et al., 2017, Sports Med) e melhora a qualidade do sono (Rusch et al., 2019, Ann N Y Acad Sci). */
'use strict';

// lótus: símbolo da meditação no app
const MEDIT_IC =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5c1.9 2 2.9 4.3 2.9 6.6 0 2.3-1 4.2-2.9 5.4-1.9-1.2-2.9-3.1-2.9-5.4 0-2.3 1-4.6 2.9-6.6z"/><path d="M12 16.5c-1.3-2.7-3.9-4.8-7.6-5.2.2 3.5 3.1 5.6 7.6 5.2z"/><path d="M12 16.5c1.3-2.7 3.9-4.8 7.6-5.2-.2 3.5-3.1 5.6-7.6 5.2z"/><path d="M4.5 19.5c2.4-1.3 4.9-1.9 7.5-1.9s5.1.6 7.5 1.9"/></svg>';
const MEDIT_KEY = 'nx-meditacao';
const MEDIT_CFG = 'nx-medit-cfg';

// resp: [inspira, segura, solta, segura] em segundos (null = respiração natural); dupla: duas inspirações (suspiro)
// roteiro: [segundo, fala]; mins: durações que a pessoa pode escolher (a primeira com * é a padrão)
const MEDIT_RESP = [
  {
    id: 'coerente',
    nome: 'Respiração coerente',
    resumo: '6 por minuto',
    desc: 'Inspire 5 e solte 5. O ritmo que mais acalma o coração e a mente.',
    resp: [5, 0, 5, 0],
    mins: [3, 5, 10],
    padrao: 5,
  },
  {
    id: 'quadrada',
    nome: 'Respiração quadrada',
    resumo: '4 · 4 · 4 · 4',
    desc: 'Inspire, segure, solte e segure, 4 tempos cada. Foco e controle antes da prova.',
    resp: [4, 4, 4, 4],
    mins: [2, 3, 5],
    padrao: 3,
  },
  {
    id: '478',
    nome: 'Respiração 4-7-8',
    resumo: 'para dormir',
    desc: 'Inspire 4, segure 7 e solte 8. Desacelera o corpo para pegar no sono.',
    resp: [4, 7, 8, 0],
    mins: [2, 4, 6],
    padrao: 4,
  },
  {
    id: 'suspiro',
    nome: 'Suspiro fisiológico',
    resumo: 'alívio rápido',
    desc: 'Duas inspirações pelo nariz e uma expiração longa pela boca. Baixa o estresse em poucos minutos.',
    resp: [3, 0, 6, 0],
    dupla: true,
    mins: [1, 3, 5],
    padrao: 3,
  },
  {
    id: 'recuperar-r',
    nome: 'Expiração longa',
    resumo: '4 · 8',
    desc: 'Solte o ar no dobro do tempo da entrada. Ajuda o corpo a sair do modo de esforço.',
    resp: [4, 0, 8, 0],
    mins: [3, 5, 10],
    padrao: 5,
  },
];
const MEDIT_SESSOES = [
  {
    id: 'acalmar',
    grupo: 'Para o dia a dia',
    nome: 'Respirar e acalmar',
    min: 5,
    desc: 'Seis respirações por minuto para baixar a ansiedade e o estresse do dia.',
    resp: [4, 0, 6, 0],
    roteiro: [
      [0, 'Sente-se ou deite-se numa posição confortável. Se quiser, feche os olhos.'],
      [10, 'Siga o som. Quando ele sobe, inspire pelo nariz.'],
      [20, 'Quando ele desce, solte o ar devagar.'],
      [70, 'Se a mente se distrair, tudo bem. Volte com calma para a respiração.'],
      [140, 'Perceba os ombros e o rosto. Deixe que fiquem soltos.'],
      [210, 'Cada vez que o ar sai, o corpo fica um pouco mais leve.'],
      [270, 'Mais algumas respirações, no seu ritmo.'],
      [295, 'Abra os olhos devagar. Você terminou.'],
    ],
  },
  {
    id: 'manha',
    grupo: 'Para o dia a dia',
    nome: 'Começar o dia',
    min: 4,
    desc: 'Respiração para acordar o corpo, clarear a mente e definir a intenção do dia.',
    resp: [4, 0, 4, 0],
    roteiro: [
      [0, 'Bom dia. Sente-se com as costas retas e os pés no chão.'],
      [10, 'Inspire fundo pelo nariz, enchendo a barriga e o peito.'],
      [20, 'Solte o ar pela boca, sem pressa.'],
      [70, 'Perceba como está o seu corpo hoje, sem julgar.'],
      [130, 'Pense em uma coisa que você quer fazer bem hoje. Só uma.'],
      [190, 'Leve essa intenção com você.'],
      [230, 'Abra os olhos. Bom treino e bom dia.'],
    ],
  },
  {
    id: 'gratidao',
    grupo: 'Para o dia a dia',
    nome: 'Gratidão',
    min: 5,
    desc: 'Cinco minutos para reconhecer o que vai bem, inclusive no seu treino.',
    resp: null,
    roteiro: [
      [0, 'Sente-se confortável e feche os olhos se quiser.'],
      [10, 'Respire naturalmente e deixe o corpo se acomodar.'],
      [50, 'Lembre de algo bom que aconteceu hoje ou ontem, por menor que seja.'],
      [110, 'Agora pense no seu corpo. No que ele já conseguiu fazer nos treinos.'],
      [170, 'Pense em uma pessoa que te apoia. Mande um obrigado em pensamento.'],
      [240, 'Guarde essa sensação.'],
      [292, 'Abra os olhos devagar. Você terminou.'],
    ],
  },
  {
    id: 'prova',
    grupo: 'Treino e prova',
    nome: 'Foco antes da prova',
    min: 3,
    desc: 'Respiração quadrada para controlar o nervosismo da largada e entrar com foco.',
    resp: [4, 4, 4, 4],
    roteiro: [
      [0, 'Fique de pé ou sente-se, com os pés firmes no chão.'],
      [8, 'Inspire em quatro tempos. Segure. Solte em quatro. Segure.'],
      [60, 'Pense no seu plano: largar com calma e manter o ritmo combinado.'],
      [110, 'Você treinou para isso. Confie no seu treino.'],
      [170, 'Mais uma respiração. Agora é com você.'],
    ],
  },
  {
    id: 'recuperar',
    grupo: 'Treino e prova',
    nome: 'Recuperar depois do treino',
    min: 5,
    desc: 'Expiração longa para o corpo sair do modo de esforço e começar a recuperar.',
    resp: [4, 0, 8, 0],
    roteiro: [
      [0, 'Deite-se de costas, com as pernas apoiadas, se der.'],
      [10, 'Inspire em quatro tempos e solte o ar bem devagar, em oito.'],
      [70, 'Sinta as pernas pesadas, apoiadas no chão.'],
      [130, 'O coração vai desacelerando. Deixe acontecer.'],
      [200, 'Repare como você se sente agora, depois do treino que fez.'],
      [290, 'Quando quiser, mexa as mãos e os pés devagar. Você terminou.'],
    ],
  },
  {
    id: 'dormir',
    grupo: 'Sono',
    nome: 'Relaxar para dormir',
    min: 10,
    desc: 'Relaxamento do corpo inteiro, dos pés à cabeça, para pegar no sono com mais facilidade.',
    resp: [4, 0, 6, 0],
    semFim: true,
    roteiro: [
      [0, 'Deite-se na cama, apague a luz e deixe o celular de lado. Só escute.'],
      [15, 'Respire devagar. A cada saída do ar, o corpo afunda um pouco mais no colchão.'],
      [60, 'Leve a atenção para os pés. Deixe que eles relaxem.'],
      [110, 'Agora as panturrilhas e os joelhos. Soltos e pesados.'],
      [160, 'As coxas e o quadril. Nenhum esforço.'],
      [210, 'A barriga sobe e desce com a respiração.'],
      [260, 'O peito e as costas. Deixe que o colchão segure você.'],
      [310, 'As mãos, os braços e os ombros. Soltos.'],
      [360, 'O pescoço, o queixo, os olhos e a testa. Tudo relaxado.'],
      [420, 'O corpo inteiro está em descanso. Siga respirando devagar.'],
      [540, 'Pode continuar assim e deixar o sono chegar.'],
    ],
  },
  {
    id: 'atencao',
    grupo: 'Atenção plena',
    nome: 'Atenção plena',
    min: 5,
    desc: 'Cinco minutos para sair do piloto automático e voltar ao momento presente.',
    resp: null,
    roteiro: [
      [0, 'Sente-se com as costas retas, sem tensão. Feche os olhos se quiser.'],
      [10, 'Não precisa mudar nada. Só observe a sua respiração natural.'],
      [70, 'Perceba os sons ao redor, perto e longe. Só escute, sem julgar.'],
      [130, 'Pensamentos vão aparecer. Note cada um e volte para a respiração.'],
      [200, 'Perceba o contato do corpo com o chão ou com a cadeira.'],
      [260, 'Agradeça a você por estes minutos.'],
      [295, 'Abra os olhos devagar. Você terminou.'],
    ],
  },
  {
    id: 'corpo',
    grupo: 'Atenção plena',
    nome: 'Escaneamento do corpo',
    min: 8,
    desc: 'Percorra o corpo com atenção e encontre onde está a tensão do treino e do dia.',
    resp: null,
    roteiro: [
      [0, 'Deite-se ou sente-se confortável. Feche os olhos.'],
      [12, 'Respire fundo três vezes e deixe o corpo pesar.'],
      [45, 'Leve a atenção para o topo da cabeça. Só perceba o que está ali.'],
      [95, 'Desça para o rosto: testa, olhos, mandíbula. Solte o que estiver apertado.'],
      [150, 'Pescoço e ombros. Muito da tensão do dia fica aqui. Deixe ir.'],
      [210, 'Braços e mãos, até a ponta dos dedos.'],
      [265, 'Peito e barriga, subindo e descendo com o ar.'],
      [320, 'Costas e quadril. Perceba o apoio.'],
      [375, 'Coxas, joelhos, panturrilhas e pés. As pernas que te levam em cada treino.'],
      [430, 'Agora sinta o corpo inteiro de uma vez, respirando.'],
      [470, 'Mexa os dedos devagar e abra os olhos quando quiser.'],
    ],
  },
];
const MEDIT_SONS = [
  ['silencio', 'Silêncio'],
  ['chuva', 'Chuva'],
  ['mar', 'Mar'],
  ['vento', 'Vento'],
  ['tigela', 'Tigela'],
  ['marrom', 'Ruído suave'],
];
const MEDIT_HUMOR = [
  [1, 'Agitado'],
  [2, 'Tenso'],
  [3, 'Neutro'],
  [4, 'Calmo'],
  [5, 'Em paz'],
];

const meditCfg = () => ({
  voz: true,
  tons: true,
  vib: true,
  som: 'silencio',
  vol: 0.7,
  ...(store.get(MEDIT_CFG, {}) || {}),
});
const meditSalvarCfg = (c) => store.set(MEDIT_CFG, c);
function meditHist() {
  return (store.get(MEDIT_KEY, []) || []).filter((x) => x && x.d && x.m > 0);
}
const meditDia = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
function meditResumo() {
  const h = meditHist();
  const porDia = {};
  h.forEach((x) => (porDia[meditDia(x.d)] = (porDia[meditDia(x.d)] || 0) + x.m));
  // sequência: dias seguidos com meditação, contando de hoje (ou de ontem, se hoje ainda não meditou)
  let seq = 0;
  const d = new Date();
  if (!porDia[meditDia(d)]) d.setDate(d.getDate() - 1);
  while (porDia[meditDia(d)]) {
    seq++;
    d.setDate(d.getDate() - 1);
  }
  const semana = [];
  for (let i = 6; i >= 0; i--) {
    const x = new Date();
    x.setDate(x.getDate() - i);
    semana.push({ dia: x, m: porDia[meditDia(x)] || 0 });
  }
  return {
    seq,
    semana,
    min7: Math.round(semana.reduce((a, x) => a + x.m, 0)),
    total: Math.round(h.reduce((a, x) => a + x.m, 0)),
    sessoes: new Set(h.map((x) => x.k || x.d)).size,
  };
}
// compatível com o atalho antigo: minutos dos últimos 7 dias
const meditMinSemana = () => meditResumo().min7;

/* ---------- sons (Web Audio): tons da respiração, sino e sons de fundo, tudo gerado no aparelho ---------- */
const MED_AUDIO = { c: null, mestre: null, fundo: null, fundoNos: [] };
function medCtx() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  if (!MED_AUDIO.c) {
    MED_AUDIO.c = new C();
    MED_AUDIO.mestre = MED_AUDIO.c.createGain();
    MED_AUDIO.mestre.connect(MED_AUDIO.c.destination);
  }
  if (MED_AUDIO.c.state === 'suspended') MED_AUDIO.c.resume().catch(() => {});
  return MED_AUDIO.c;
}
function medRuido(c, tipo, seg = 4) {
  const n = c.sampleRate * seg,
    buf = c.createBuffer(1, n, c.sampleRate),
    d = buf.getChannelData(0);
  let ult = 0,
    b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (tipo === 'marrom') {
      ult = (ult + 0.02 * w) / 1.02;
      d[i] = ult * 3.5;
    } else if (tipo === 'rosa') {
      b0 = 0.99765 * b0 + w * 0.099;
      b1 = 0.963 * b1 + w * 0.2965;
      b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
    } else d[i] = w;
  }
  const s = c.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
}
// tom suave que sobe (inspirar) ou desce (soltar) durante a fase inteira
function medTom(sobe, dur, vol = 1) {
  const c = medCtx();
  if (!c || dur <= 0) return;
  const t0 = c.currentTime,
    f0 = sobe ? 174 : 261,
    f1 = sobe ? 261 : 174;
  [1, 2].forEach((h, i) => {
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0 * h, t0);
    o.frequency.exponentialRampToValueAtTime(f1 * h, t0 + dur);
    const pico = (i ? 0.025 : 0.09) * vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(pico, t0 + Math.min(1.2, dur * 0.35));
    g.gain.linearRampToValueAtTime(pico * 0.8, t0 + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(MED_AUDIO.mestre);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  });
  // sopro de ar, bem baixo, junto com o tom (lembra a respiração)
  const r = medRuido(c, 'rosa', 2),
    bp = c.createBiquadFilter(),
    g = c.createGain();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(sobe ? 500 : 1100, t0);
  bp.frequency.exponentialRampToValueAtTime(sobe ? 1100 : 500, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.05 * vol, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  r.connect(bp).connect(g).connect(MED_AUDIO.mestre);
  r.start(t0);
  r.stop(t0 + dur + 0.05);
}
// toque curto para "segure"
function medToque(vol = 1) {
  const c = medCtx();
  if (!c) return;
  const t0 = c.currentTime,
    o = c.createOscillator(),
    g = c.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.05 * vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
  o.connect(g).connect(MED_AUDIO.mestre);
  o.start(t0);
  o.stop(t0 + 1.2);
}
// sino de tigela: parciais fora de proporção, como uma tigela tibetana
function medSino(vol = 1) {
  const c = medCtx();
  if (!c) return;
  const t0 = c.currentTime;
  [
    [220, 0.16, 6],
    [528, 0.12, 5],
    [839, 0.05, 3.5],
    [1243, 0.025, 2.4],
  ].forEach(([f, a, dur]) => {
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    o.detune.value = Math.random() * 6 - 3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(a * vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(MED_AUDIO.mestre);
    o.start(t0);
    o.stop(t0 + dur + 0.1);
  });
}
function medFundoParar(fade = 1.5) {
  const c = MED_AUDIO.c;
  if (!c || !MED_AUDIO.fundo) return;
  const g = MED_AUDIO.fundo,
    nos = MED_AUDIO.fundoNos;
  try {
    g.gain.cancelScheduledValues(c.currentTime);
    g.gain.setValueAtTime(g.gain.value, c.currentTime);
    g.gain.linearRampToValueAtTime(0.0001, c.currentTime + fade);
  } catch {}
  setTimeout(
    () =>
      nos.forEach((n) => {
        try {
          n.stop();
        } catch {}
      }),
    fade * 1000 + 100,
  );
  MED_AUDIO.fundo = null;
  MED_AUDIO.fundoNos = [];
}
function medFundo(tipo, vol = 0.7) {
  medFundoParar(0.6);
  const c = medCtx();
  if (!c || !tipo || tipo === 'silencio') return;
  const g = c.createGain(),
    nos = [];
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 2.5);
  g.connect(MED_AUDIO.mestre);
  const lfo = (freq, prof, alvo) => {
    const o = c.createOscillator(),
      og = c.createGain();
    o.frequency.value = freq;
    og.gain.value = prof;
    o.connect(og).connect(alvo);
    o.start();
    nos.push(o);
  };
  if (tipo === 'chuva') {
    const r = medRuido(c, 'branco'),
      hp = c.createBiquadFilter(),
      lp = c.createBiquadFilter(),
      v = c.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    v.gain.value = 0.11;
    r.connect(hp).connect(lp).connect(v).connect(g);
    r.start();
    nos.push(r);
    const r2 = medRuido(c, 'marrom'),
      v2 = c.createGain();
    v2.gain.value = 0.25;
    r2.connect(v2).connect(g);
    r2.start();
    nos.push(r2);
  } else if (tipo === 'mar') {
    const r = medRuido(c, 'rosa'),
      lp = c.createBiquadFilter(),
      v = c.createGain();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;
    v.gain.value = 0.32;
    lfo(0.085, 0.26, v.gain); // ondas a cada ~12 s
    lfo(0.085, 500, lp.frequency);
    r.connect(lp).connect(v).connect(g);
    r.start();
    nos.push(r);
  } else if (tipo === 'vento') {
    const r = medRuido(c, 'rosa'),
      bp = c.createBiquadFilter(),
      v = c.createGain();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.value = 520;
    v.gain.value = 0.55;
    lfo(0.06, 260, bp.frequency);
    lfo(0.11, 0.18, v.gain);
    r.connect(bp).connect(v).connect(g);
    r.start();
    nos.push(r);
  } else if (tipo === 'marrom') {
    const r = medRuido(c, 'marrom'),
      lp = c.createBiquadFilter(),
      v = c.createGain();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    v.gain.value = 0.5;
    r.connect(lp).connect(v).connect(g);
    r.start();
    nos.push(r);
  } else if (tipo === 'tigela') {
    [
      [110, 0.05],
      [110.6, 0.04],
      [165, 0.025],
      [220.4, 0.018],
    ].forEach(([f, a], i) => {
      const o = c.createOscillator(),
        v = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      v.gain.value = a;
      lfo(0.05 + i * 0.013, a * 0.6, v.gain);
      o.connect(v).connect(g);
      o.start();
      nos.push(o);
    });
  }
  MED_AUDIO.fundo = g;
  MED_AUDIO.fundoNos = nos;
}
let medVozEscolhida;
function medFalar(t) {
  if (!window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'pt-BR';
    if (medVozEscolhida === undefined) {
      const vs = speechSynthesis.getVoices().filter((v) => /^pt(-|_)BR/i.test(v.lang));
      medVozEscolhida = vs.find((v) => /Luciana|Francisca|Google|Natural/i.test(v.name)) || vs[0] || null;
    }
    if (medVozEscolhida) u.voice = medVozEscolhida;
    u.rate = 0.86;
    u.pitch = 0.95;
    u.volume = 0.95;
    speechSynthesis.speak(u);
  } catch {}
}
const medCalar = () => {
  try {
    speechSynthesis.cancel();
  } catch {}
};
const medVibrar = (p) => {
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch {}
};

/* ---------- telas ---------- */
const medCard = (href, titulo, sub, extra = '', cls = '') =>
  `<a class="med-card ${cls}" href="${href}"><span class="med-card-ic">${MEDIT_IC}</span><span class="med-card-tx"><b>${esc(titulo)}</b><small>${sub}</small>${extra}</span>${I.chev}</a>`;

/** #/meditacao (início), #/meditacao/<id> (sessão ou respiração) e #/meditacao/livre */
async function viewMeditacao(id) {
  if (id === 'livre')
    return meditSessao({ id: 'livre', grupo: 'Meditação livre', nome: 'Meditação livre', livre: true });
  const r = id && MEDIT_RESP.find((x) => x.id === id);
  if (r) return meditSessao({ ...r, grupo: 'Respiração', tipoResp: true });
  const s = id && MEDIT_SESSOES.find((x) => x.id === id);
  if (s) return meditSessao(s);
  const R = meditResumo();
  const h = new Date().getHours();
  const sug = h < 11 ? 'manha' : h >= 21 || h < 4 ? 'dormir' : h >= 17 ? 'recuperar' : 'acalmar';
  const sugS = MEDIT_SESSOES.find((x) => x.id === sug);
  const maxS = Math.max(10, ...R.semana.map((x) => x.m));
  const grupos = [...new Set(MEDIT_SESSOES.map((x) => x.grupo))];
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>
    <div class="med-topo">
      <div class="med-topo-cab"><span class="med-logo">${MEDIT_IC}</span><div><p class="med-eyebrow">Bem-estar</p><h1>Meditação</h1></div></div>
      <div class="med-stats">
        <div><b>${R.seq}</b><span>${R.seq === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
        <div><b>${R.min7}</b><span>min nesta semana</span></div>
        <div><b>${R.total}</b><span>min no total</span></div>
      </div>
      <div class="med-semana-g">${R.semana
        .map(
          (x) =>
            `<div class="${x.m ? 'on' : ''}"><i style="height:${Math.max(6, (x.m / maxS) * 100)}%"></i><span>${DSEM[x.dia.getDay()].slice(0, 1)}</span></div>`,
        )
        .join('')}</div>
    </div>
    <a class="med-sug" href="#/meditacao/${sugS.id}"><span class="med-sug-play">${I.play}</span><span><small>${h < 11 ? 'PARA COMEÇAR O DIA' : h >= 21 || h < 4 ? 'PARA ESTA NOITE' : h >= 17 ? 'DEPOIS DO TREINO' : 'PARA AGORA'}</small><b>${esc(sugS.nome)}</b><em>${sugS.min} min · guiada por voz</em></span></a>
    <p class="sec-lbl">Respiração guiada</p>
    <div class="med-resp">${MEDIT_RESP.map(
      (x) =>
        `<a href="#/meditacao/${x.id}" class="med-resp-c"><span class="med-resp-anel"><i></i></span><b>${esc(x.nome)}</b><small>${esc(x.resumo)}</small></a>`,
    ).join('')}</div>
    <p class="tiny dim" style="margin-top:6px">Com som: o tom sobe para inspirar e desce para soltar. Dá para fazer de olhos fechados.</p>
    ${grupos
      .map(
        (g) =>
          `<p class="sec-lbl">${esc(g)}</p><div class="stack">${MEDIT_SESSOES.filter((x) => x.grupo === g)
            .map((x) => medCard(`#/meditacao/${x.id}`, x.nome, `${x.min} min · ${esc(x.desc)}`))
            .join('')}</div>`,
      )
      .join('')}
    <p class="sec-lbl">No seu tempo</p><div class="stack">${medCard('#/meditacao/livre', 'Meditação livre', 'Escolha o tempo, o som de fundo e o sino de intervalo. Sem voz.')}</div>
    <p class="tiny dim" style="margin-top:18px">Use fone de ouvido para a melhor experiência. A meditação ajuda no bem-estar e não substitui acompanhamento de saúde. Se sentir tontura, volte a respirar no seu ritmo natural.</p>`;
}

function meditSessao(s) {
  const cfg = meditCfg();
  const st = {
    t: 0,
    rodando: false,
    feito: 0,
    min: s.padrao || s.min || 10,
    intervalo: store.get('nx-medit-int', 0),
    fase: '',
    ciclo: -1,
    k: Date.now().toString(36),
    fim: false,
    olhos: false,
  };
  let timer = null,
    lock = null,
    ultimo = 0,
    falados = new Set();
  const total = () => st.min * 60;
  const opcoesMin = s.livre ? [3, 5, 10, 15, 20, 30] : s.mins || null;
  const chip = (on, attr, txt) => `<button class="med-chip${on ? ' on' : ''}" ${attr}>${txt}</button>`;
  $app.innerHTML = `<div class="med-play" id="m-raiz">
    <div class="med-play-top"><a class="med-x" href="#/meditacao" aria-label="Voltar">${I.back}</a><div class="grow" style="min-width:0"><p class="med-eyebrow">${esc(s.grupo)}</p><h1>${esc(s.nome)}</h1></div><button class="med-x" id="m-olhos" aria-label="Modo olhos fechados" title="Olhos fechados"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 10c2.5 3 5.5 4.5 9 4.5s6.5-1.5 9-4.5M7 13.5 5.5 16M12 14.5V17M17 13.5l1.5 2.5"/></svg></button></div>
    ${s.desc ? `<p class="med-desc">${esc(s.desc)}</p>` : ''}
    <div class="med-palco"><span class="med-onda o1"></span><span class="med-onda o2"></span><div class="med-circ" id="m-circ"></div><div class="med-centro"><div class="med-fase" id="m-fase">Pronto</div><div class="med-conta" id="m-conta"></div></div></div>
    <p class="med-fala" id="m-fala">${esc(s.roteiro ? s.roteiro[0][1] : s.livre ? 'Sente-se confortável, feche os olhos e apenas respire. O sino avisa o fim.' : 'Siga o som e o círculo. Quando o tom sobe, inspire. Quando desce, solte o ar.')}</p>
    <div class="med-barra"><i id="m-prog"></i></div>
    <div class="med-tempo-l"><span id="m-ja">0:00</span><span id="m-tempo"></span></div>
    <div class="med-ctrl"><button class="med-bt2" id="m-rec" aria-label="Recomeçar"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
      <button class="med-bt" id="m-play" aria-label="Começar">${I.play}</button>
      <button class="med-bt2" id="m-som" aria-label="Som de fundo"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></button></div>
    <div class="med-opc" id="m-opc">
      ${opcoesMin ? `<div class="med-opc-l"><span>Duração</span><div class="med-chips" id="m-min">${opcoesMin.map((m) => chip(m === st.min, `data-min="${m}"`, `${m} min`)).join('')}</div></div>` : ''}
      ${
        s.livre
          ? `<div class="med-opc-l"><span>Sino de intervalo</span><div class="med-chips" id="m-int">${[0, 1, 5]
              .map((m) => chip(m === st.intervalo, `data-int="${m}"`, m ? `a cada ${m} min` : 'só no fim'))
              .join('')}</div></div>`
          : ''
      }
      <div class="med-opc-l"><span>Som de fundo</span><div class="med-chips" id="m-sons">${MEDIT_SONS.map(([k, l]) => chip(cfg.som === k, `data-som="${k}"`, l)).join('')}</div></div>
      <div class="med-opc-l"><span>Guia</span><div class="med-chips">
        ${s.roteiro || s.tipoResp ? chip(cfg.voz, 'data-tg="voz"', 'Voz') : ''}
        ${s.resp || s.tipoResp ? chip(cfg.tons, 'data-tg="tons"', 'Sons da respiração') : ''}
        ${'vibrate' in navigator ? chip(cfg.vib, 'data-tg="vib"', 'Vibração') : ''}
      </div></div>
    </div>
    <div class="med-escuro" id="m-escuro" hidden><div class="med-circ" id="m-circ2"></div><p id="m-fase2"></p><small>Toque para sair do modo olhos fechados</small></div>
  </div>`;
  const tela = {};
  $app._med = tela;
  const el = (x) => document.getElementById(x);
  const minha = () => $app._med === tela && !!el('m-raiz');
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  const pintarTempo = () => {
    el('m-tempo').textContent = s.semFim && st.t >= total() ? '' : '-' + fmt(Math.max(0, total() - st.t));
    el('m-ja').textContent = fmt(st.t);
    el('m-prog').style.width = `${Math.min(100, (st.t / total()) * 100)}%`;
  };
  pintarTempo();
  const pedirTela = async () => {
    try {
      if ('wakeLock' in navigator && !lock) {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => (lock = null));
      }
    } catch {}
  };
  const soltarTela = () => {
    try {
      if (lock) lock.release();
    } catch {}
    lock = null;
  };
  // padrão da respiração: lista de fases [nome, chave, segundos]
  const padrao = (() => {
    if (!s.resp) return null;
    const [a, b, c, d] = s.resp;
    const L = s.dupla
      ? [
          ['Inspire', 'in', a * 0.65],
          ['Mais um pouco', 'in2', a * 0.35],
          ['Solte devagar', 'out', c],
        ]
      : [
          ['Inspire', 'in', a],
          ['Segure', 'cheio', b],
          ['Solte o ar', 'out', c],
          ['Segure', 'vazio', d],
        ];
    return L.filter((x) => x[2] > 0);
  })();
  const ciclo = padrao ? padrao.reduce((x, f) => x + f[2], 0) : 0;
  const faseEm = (t) => {
    if (!padrao) return null;
    let x = t % ciclo;
    for (let i = 0; i < padrao.length; i++) {
      if (x < padrao[i][2])
        return {
          i,
          n: padrao[i][0],
          k: padrao[i][1],
          dur: padrao[i][2],
          resta: padrao[i][2] - x,
          c: Math.floor(t / ciclo),
        };
      x -= padrao[i][2];
    }
    return null;
  };
  // círculo: muda de tamanho na duração exata da fase (animação suave pelo CSS)
  const escala = { in: 1, in2: 1.08, cheio: 1, out: 0.55, vazio: 0.55 };
  const mexerCirc = (k, dur) => {
    ['m-circ', 'm-circ2'].forEach((id) => {
      const c = el(id);
      if (!c) return;
      c.style.transition = `transform ${dur}s ${k === 'in' || k === 'in2' || k === 'out' ? 'cubic-bezier(.45,.05,.55,.95)' : 'linear'}`;
      c.style.transform = `scale(${escala[k] || 0.8})`;
    });
    el('m-raiz').dataset.fase = k;
  };
  const salvar = () => {
    const m = Math.round((st.t / 60) * 10) / 10;
    if (m - st.feito < 0.5) return;
    const h = meditHist().filter((x) => new Date(x.d).getTime() > Date.now() - 400 * 864e5);
    h.push({ d: new Date().toISOString(), m: Math.round((m - st.feito) * 10) / 10, s: s.id, k: st.k });
    store.set(MEDIT_KEY, h);
    st.feito = m;
  };
  const botaoPlay = () => {
    el('m-play').innerHTML = st.rodando
      ? '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>'
      : I.play;
    el('m-play').setAttribute('aria-label', st.rodando ? 'Pausar' : 'Começar');
    el('m-raiz').classList.toggle('rodando', st.rodando);
  };
  const parar = (fim) => {
    clearInterval(timer);
    timer = null;
    st.rodando = false;
    soltarTela();
    salvar();
    medFundoParar(fim ? 4 : 1.2);
    if (!minha()) return medCalar();
    botaoPlay();
    if (!fim) {
      el('m-fase').textContent = 'Pausado';
      el('m-conta').textContent = '';
      return;
    }
    st.fim = true;
    sairOlhos();
    mexerCirc('vazio', 2);
    el('m-fase').textContent = 'Concluído';
    el('m-conta').textContent = '';
    const R = meditResumo();
    el('m-fala').innerHTML =
      `<span class="med-fim"><b>Sessão concluída</b><span>${fmt(st.t)} de meditação · ${R.seq} ${R.seq === 1 ? 'dia seguido' : 'dias seguidos'}</span><span class="med-fim-q">Como você está agora?</span><span class="med-chips med-humor">${MEDIT_HUMOR.map(([v, l]) => `<button class="med-chip" data-humor="${v}">${l}</button>`).join('')}</span></span>`;
    el('m-fala')
      .querySelectorAll('[data-humor]')
      .forEach(
        (b) =>
          (b.onclick = () => {
            const h = meditHist();
            const ult = h.filter((x) => x.k === st.k).pop();
            if (ult) {
              ult.humor = +b.dataset.humor;
              store.set(MEDIT_KEY, h);
            }
            el('m-fala').querySelector('.med-humor').innerHTML = `<span class="med-ok">Anotado. Bom trabalho.</span>`;
          }),
      );
  };
  const guiaFase = (f) => {
    if (cfg.tons) {
      if (f.k === 'in' || f.k === 'in2') medTom(true, f.dur, f.k === 'in2' ? 0.7 : 1);
      else if (f.k === 'out') medTom(false, f.dur);
      else medToque();
    }
    if (cfg.vib) medVibrar(f.k === 'in' ? 60 : f.k === 'out' ? [30, 60, 30] : 25);
    // nos exercícios de respiração, a voz conta as primeiras fases e depois deixa só o som
    if (cfg.voz && s.tipoResp && f.c < 2) medFalar(f.n);
  };
  const tique = () => {
    if (!minha()) {
      parar(false);
      return;
    }
    const agora = performance.now();
    st.t += Math.min(1, (agora - ultimo) / 1000);
    ultimo = agora;
    const f = faseEm(st.t);
    if (f) {
      const chave = f.c * 10 + f.i;
      if (chave !== st.fase) {
        st.fase = chave;
        mexerCirc(f.k, f.resta);
        guiaFase(f);
      }
      el('m-fase').textContent = f.n;
      el('m-conta').textContent = Math.ceil(f.resta);
      el('m-fase2').textContent = f.n;
    } else {
      el('m-fase').textContent = s.livre ? 'Respire' : 'Respire naturalmente';
      el('m-conta').textContent = '';
      el('m-fase2').textContent = '';
      // respiração livre: o círculo pulsa devagar
      const k = Math.floor(st.t / 5) % 2 ? 'out' : 'in';
      if (k !== st.fase) {
        st.fase = k;
        mexerCirc(k === 'in' ? 'livreIn' : 'livreOut', 5);
        ['m-circ', 'm-circ2'].forEach(
          (id) => el(id) && (el(id).style.transform = `scale(${k === 'in' ? 0.86 : 0.74})`),
        );
      }
    }
    if (s.livre && st.intervalo && st.t < total() - 2) {
      const marca = Math.floor(st.t / (st.intervalo * 60));
      if (marca > 0 && marca !== st.ultSino) {
        st.ultSino = marca;
        medSino(0.7);
      }
    }
    (s.roteiro || []).forEach(([seg, txt]) => {
      if (st.t >= seg && !falados.has(seg)) {
        falados.add(seg);
        el('m-fala').textContent = txt;
        if (cfg.voz) medFalar(txt);
      }
    });
    pintarTempo();
    if (st.t >= total() && !st.fim) {
      medSino();
      if (s.semFim) {
        // sono: não acorda a pessoa; os sons de fundo terminam devagar
        st.fim = true;
        salvar();
        medFundoParar(30);
        cfg.tons = false;
        return;
      }
      parar(true);
    }
  };
  const comecar = () => {
    if (st.rodando) return parar(false);
    medCtx();
    if (st.fim || st.t >= total()) {
      st.t = 0;
      st.feito = 0;
      st.fim = false;
      st.fase = '';
      st.k = Date.now().toString(36);
      falados = new Set();
    }
    st.rodando = true;
    botaoPlay();
    pedirTela();
    medFundo(cfg.som, cfg.vol);
    if (st.t === 0) medSino(0.8);
    st.fase = '';
    ultimo = performance.now();
    // começa depois do sino, para dar tempo de se acomodar
    setTimeout(
      () => {
        if (!st.rodando || !minha()) return;
        ultimo = performance.now();
        timer = setInterval(tique, 100);
        tique();
      },
      st.t === 0 ? 1800 : 0,
    );
    if (st.t === 0) {
      el('m-fase').textContent = 'Prepare-se';
      el('m-conta').textContent = '';
    }
  };
  el('m-play').onclick = comecar;
  el('m-rec').onclick = () => {
    const ia = st.rodando;
    if (ia) parar(false);
    st.t = 0;
    st.feito = 0;
    st.fim = false;
    st.fase = '';
    st.ultSino = 0;
    falados = new Set();
    medCalar();
    pintarTempo();
    mexerCirc('vazio', 0.6);
    el('m-fase').textContent = 'Pronto';
    el('m-conta').textContent = '';
    if (s.roteiro) el('m-fala').textContent = s.roteiro[0][1];
    if (ia) comecar();
  };
  el('m-som').onclick = () => el('m-sons').scrollIntoView({ behavior: 'smooth', block: 'center' });
  const raiz = el('m-raiz');
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-min],[data-int],[data-som],[data-tg]');
    if (!b) return;
    if (b.dataset.min) {
      st.min = +b.dataset.min;
      if (st.t >= total()) st.fim = true;
      raiz.querySelectorAll('[data-min]').forEach((x) => x.classList.toggle('on', x === b));
      pintarTempo();
    } else if (b.dataset.int) {
      st.intervalo = +b.dataset.int;
      store.set('nx-medit-int', st.intervalo);
      raiz.querySelectorAll('[data-int]').forEach((x) => x.classList.toggle('on', x === b));
    } else if (b.dataset.som) {
      cfg.som = b.dataset.som;
      meditSalvarCfg(cfg);
      raiz.querySelectorAll('[data-som]').forEach((x) => x.classList.toggle('on', x === b));
      // toca na hora para a pessoa ouvir (e para de novo se a sessão estiver parada)
      medFundo(cfg.som, cfg.vol);
      if (!st.rodando) setTimeout(() => !st.rodando && medFundoParar(1), 3500);
    } else if (b.dataset.tg) {
      cfg[b.dataset.tg] = !cfg[b.dataset.tg];
      meditSalvarCfg(cfg);
      b.classList.toggle('on', cfg[b.dataset.tg]);
      if (b.dataset.tg === 'voz' && !cfg.voz) medCalar();
    }
  });
  // modo olhos fechados: tela escura, só o círculo bem fraco e o som guiando
  const sairOlhos = () => {
    st.olhos = false;
    const e = el('m-escuro');
    if (e) e.hidden = true;
  };
  el('m-olhos').onclick = () => {
    st.olhos = true;
    el('m-escuro').hidden = false;
    if (!st.rodando) comecar();
  };
  el('m-escuro').onclick = sairOlhos;
  // ao sair da tela, para tudo
  const sair = () => {
    if ($app._med !== tela || !el('m-raiz')) {
      medCalar();
      medFundoParar(0.5);
      soltarTela();
      clearInterval(timer);
      removeEventListener('hashchange', aoTrocar);
    }
  };
  const aoTrocar = () => setTimeout(sair, 50);
  addEventListener('hashchange', aoTrocar);
}
