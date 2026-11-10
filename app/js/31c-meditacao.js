/* Nexos App · Meditação (Mais › Bem-estar): sessões guiadas por voz, com o círculo da respiração.
   Parte 31c: os arquivos de app/js são carregados em ordem pelo index.html e dividem o mesmo escopo.
   Base: respiração lenta, perto de 6 por minuto, acalma o corpo (Zaccaro et al., 2018, Front Hum Neurosci);
   atenção plena ajuda atletas a lidar com ansiedade e estresse (Bühlmayer et al., 2017, Sports Med);
   e melhora a qualidade do sono (Rusch et al., 2019, Ann N Y Acad Sci). */
'use strict';

const MEDIT_IC =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 8.5v5M7 11.5l5 2 5-2M4.5 19c2.5-2.2 5-3 7.5-3s5 .8 7.5 3"/></svg>';
const MEDIT_KEY = 'nx-meditacao';

// resp: [inspira, segura, solta, segura] em segundos; null = respiração natural
// roteiro: [segundo, fala]
const MEDIT_SESSOES = [
  {
    id: 'acalmar',
    grupo: 'Respiração',
    nome: 'Respirar e acalmar',
    min: 5,
    desc: 'Seis respirações por minuto para baixar a ansiedade e o estresse do dia.',
    resp: [4, 0, 6, 0],
    roteiro: [
      [0, 'Sente-se ou deite-se numa posição confortável. Se quiser, feche os olhos.'],
      [10, 'Siga o círculo. Inspire pelo nariz enquanto ele cresce.'],
      [20, 'E solte o ar devagar, enquanto ele diminui.'],
      [70, 'Se a mente se distrair, tudo bem. Volte com calma para a respiração.'],
      [140, 'Perceba os ombros e o rosto. Deixe que fiquem soltos.'],
      [210, 'Cada vez que o ar sai, o corpo fica um pouco mais leve.'],
      [270, 'Mais algumas respirações, no seu ritmo.'],
      [295, 'Abra os olhos devagar. Você terminou.'],
    ],
  },
  {
    id: 'prova',
    grupo: 'Respiração',
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
    grupo: 'Depois do treino',
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
];

function meditHist() {
  return store.get(MEDIT_KEY, []).filter((x) => x && x.d && x.m > 0);
}
function meditMinSemana() {
  const desde = Date.now() - 7 * 864e5;
  return Math.round(meditHist().reduce((a, x) => a + (new Date(x.d).getTime() >= desde ? x.m : 0), 0));
}

/** #/meditacao (lista) e #/meditacao/<id> (sessão) */
async function viewMeditacao(id) {
  const s = id && MEDIT_SESSOES.find((x) => x.id === id);
  if (s) return meditSessao(s);
  const min = meditMinSemana();
  const grupos = [...new Set(MEDIT_SESSOES.map((x) => x.grupo))];
  $app.innerHTML = `<a class="back" href="#/mais">${I.back} Mais</a>
    <div class="tv-cab"><span class="tv-logo med-logo">${MEDIT_IC}</span><div><p class="eyebrow">Bem-estar</p><h1 class="h1">Meditação</h1></div></div>
    <p class="muted" style="margin-top:4px">Sessões curtas, guiadas por voz, para acalmar, focar, recuperar e dormir melhor. Use fone de ouvido se puder.</p>
    <div class="card med-semana"><b>${min}</b><span>${min === 1 ? 'minuto' : 'minutos'} de meditação nos últimos 7 dias</span></div>
    ${grupos
      .map(
        (g) =>
          `<p class="sec-lbl">${esc(g)}</p><div class="stack">${MEDIT_SESSOES.filter((x) => x.grupo === g)
            .map(
              (x) =>
                `<a class="list-item" href="#/meditacao/${x.id}" style="color:inherit"><span class="ativ-ic med-ic">${MEDIT_IC}</span><div class="grow"><b>${esc(x.nome)}</b><div class="small muted">${x.min} min · ${esc(x.desc)}</div></div>${I.chev}</a>`,
            )
            .join('')}</div>`,
      )
      .join('')}
    <p class="tiny dim" style="margin-top:18px">A meditação ajuda no bem-estar e não substitui acompanhamento de saúde. Se sentir tontura, volte a respirar no seu ritmo natural.</p>`;
}

function meditSessao(s) {
  const total = s.min * 60;
  const st = { t: 0, rodando: false, voz: store.get('nx-medit-voz', true), feito: 0 };
  let timer = null,
    lock = null,
    falados = new Set();
  $app.innerHTML = `<a class="back" href="#/meditacao">${I.back} Meditação</a>
    <p class="eyebrow">${esc(s.grupo)}</p><h1 class="h1">${esc(s.nome)}</h1>
    <p class="muted" style="margin-top:4px">${esc(s.desc)}</p>
    <div class="med-palco"><div class="med-circ${s.resp ? '' : ' livre'}" id="m-circ"></div><div class="med-fase" id="m-fase">Toque em começar</div></div>
    <p class="med-fala" id="m-fala">${esc(s.roteiro[0][1])}</p>
    <div class="med-tempo" id="m-tempo">${s.min}:00</div>
    <div class="row" style="gap:10px;justify-content:center;margin-top:14px">
      <button class="btn" id="m-play">Começar</button>
      <button class="btn ghost" id="m-voz">${st.voz ? 'Voz ligada' : 'Voz desligada'}</button>
    </div>`;
  const tela = {};
  $app._med = tela;
  const minha = () => $app._med === tela && document.getElementById('m-circ');
  const el = (x) => document.getElementById(x);
  const sino = () => {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const c = (sino.c = sino.c || new C()),
        t0 = c.currentTime;
      [528, 792].forEach((f, i) => {
        const o = c.createOscillator(),
          g = c.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(g).connect(c.destination);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(i ? 0.08 : 0.18, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3);
        o.start(t0);
        o.stop(t0 + 3.1);
      });
    } catch {}
  };
  const falar = (t) => {
    if (!st.voz || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'pt-BR';
      u.rate = 0.9;
      u.pitch = 0.95;
      speechSynthesis.speak(u);
    } catch {}
  };
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
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  // fase da respiração no segundo t
  const fase = (t) => {
    if (!s.resp) return { n: 'Respire naturalmente', k: 'livre', p: 0 };
    const [a, b, c, d] = s.resp,
      ciclo = a + b + c + d,
      x = t % ciclo;
    if (x < a) return { n: 'Inspire', k: 'in', p: x / a };
    if (x < a + b) return { n: 'Segure', k: 'cheio', p: 1 };
    if (x < a + b + c) return { n: 'Solte o ar', k: 'out', p: 1 - (x - a - b) / c };
    return { n: 'Segure', k: 'vazio', p: 0 };
  };
  const salvar = () => {
    const m = Math.round((st.t / 60) * 10) / 10;
    if (m - st.feito < 0.5) return;
    const h = meditHist().filter((x) => new Date(x.d).getTime() > Date.now() - 90 * 864e5);
    h.push({ d: new Date().toISOString(), m: Math.round((m - st.feito) * 10) / 10, s: s.id });
    store.set(MEDIT_KEY, h);
    st.feito = m;
  };
  const parar = (fim) => {
    clearInterval(timer);
    timer = null;
    st.rodando = false;
    soltarTela();
    salvar();
    if (!minha()) return;
    el('m-play').textContent = fim ? 'Fazer de novo' : 'Continuar';
    if (fim) {
      el('m-fase').textContent = 'Concluído';
      el('m-circ').style.transform = 'scale(.55)';
    }
  };
  const tique = () => {
    if (!minha()) {
      parar(false);
      try {
        speechSynthesis.cancel();
      } catch {}
      return;
    }
    st.t += 0.25;
    const f = fase(st.t),
      esc2 = s.resp ? 0.55 + f.p * 0.45 : 0.78 + Math.sin(st.t / 2) * 0.06;
    el('m-circ').style.transform = `scale(${esc2.toFixed(3)})`;
    el('m-fase').textContent = f.n;
    el('m-tempo').textContent = fmt(Math.max(0, total - st.t));
    s.roteiro.forEach(([seg, txt]) => {
      if (st.t >= seg && !falados.has(seg)) {
        falados.add(seg);
        el('m-fala').textContent = txt;
        falar(txt);
      }
    });
    if (st.t >= total) {
      sino();
      parar(true);
    }
  };
  el('m-play').onclick = () => {
    if (st.rodando) return parar(false);
    if (st.t >= total) {
      st.t = 0;
      st.feito = 0;
      falados = new Set();
    }
    if (st.t === 0) sino();
    st.rodando = true;
    el('m-play').textContent = 'Pausar';
    pedirTela();
    timer = setInterval(tique, 250);
    tique();
  };
  el('m-voz').onclick = () => {
    st.voz = !st.voz;
    store.set('nx-medit-voz', st.voz);
    el('m-voz').textContent = st.voz ? 'Voz ligada' : 'Voz desligada';
    if (!st.voz)
      try {
        speechSynthesis.cancel();
      } catch {}
  };
}
