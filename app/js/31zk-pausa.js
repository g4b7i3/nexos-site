/* ---------- pausa para alongar (lembrete de quem trabalha sentado) ----------
   O aviso (função nx-alongar) abre #/pausa/0, 1 ou 2: uma sequência diferente a cada aviso,
   5 alongamentos de 30 segundos, sentado ou em pé ao lado da mesa, sem equipamento. */
const PAUSAS = [
  {
    nome: 'Pescoço e ombros',
    itens: [
      [
        'Side_Neck_Stretch',
        'Pescoço de lado',
        'Leve a orelha em direção ao ombro, sem subir o ombro. Na metade do tempo, troque de lado.',
      ],
      ['Chin_To_Chest_Stretch', 'Queixo ao peito', 'Abaixe o queixo devagar até sentir a nuca alongar. Respire fundo.'],
      [
        'Shoulder_Circles',
        'Círculos de ombros',
        'Faça círculos grandes e lentos com os ombros, para trás. Na metade, para a frente.',
      ],
      [
        'Chest_And_Front_Of_Shoulder_Stretch',
        'Peito e ombros',
        'Entrelace as mãos atrás do corpo e abra o peito, levando os ombros para trás.',
      ],
      ['Overhead_Stretch', 'Braços para cima', 'Entrelace os dedos e empurre as mãos para o teto, crescendo o corpo.'],
    ],
  },
  {
    nome: 'Costas e quadril',
    itens: [
      [
        'Chair_Upper_Body_Stretch',
        'Tronco na cadeira',
        'Na cadeira, gire o tronco para um lado segurando no encosto. Na metade, troque.',
      ],
      [
        'Chair_Lower_Back_Stretch',
        'Lombar na cadeira',
        'Na cadeira, incline o tronco à frente e deixe os braços caírem entre os joelhos.',
      ],
      [
        'Standing_Lateral_Stretch',
        'Lateral em pé',
        'Em pé, braço acima da cabeça, incline o tronco para o lado. Na metade, troque.',
      ],
      [
        'Standing_Hip_Flexors',
        'Frente do quadril',
        'Dê um passo à frente, contraia o glúteo da perna de trás e leve o quadril à frente. Na metade, troque.',
      ],
      ['Middle_Back_Stretch', 'Rotação em pé', 'Mãos na cintura, gire o tronco devagar para um lado e para o outro.'],
    ],
  },
  {
    nome: 'Punhos e pernas',
    itens: [
      [
        'Wrist_Circles',
        'Círculos com os punhos',
        'Gire os punhos devagar, nos dois sentidos. Ótimo para quem digita muito.',
      ],
      ['Elbows_Back', 'Cotovelos para trás', 'Mãos na lombar, leve os cotovelos para trás e junte as escápulas.'],
      [
        'Standing_Hip_Circles',
        'Círculos de quadril',
        'Em pé, mãos na cintura, faça círculos com o quadril. Na metade, inverta.',
      ],
      [
        'Calf_Stretch_Hands_Against_Wall',
        'Panturrilha na parede',
        'Mãos na parede, uma perna atrás com o calcanhar no chão. Na metade, troque.',
      ],
      [
        'Upper_Back_Stretch',
        'Parte de cima das costas',
        'Entrelace as mãos à frente e empurre, arredondando as costas.',
      ],
    ],
  },
];
const PAUSA_SEG = 30;
let pausaT = null;
async function viewPausa(b) {
  clearInterval(pausaT);
  const p = PAUSAS[Math.abs(parseInt(b, 10) || 0) % PAUSAS.length];
  let i = 0,
    resta = PAUSA_SEG,
    rodando = false;
  $app.innerHTML = `<a class="back" href="#/">${I.back} Início</a><p class="eyebrow">Pausa ativa</p><h1 class="h1">Pausa para alongar</h1>
    <p class="muted" style="margin-top:6px">${esc(p.nome)} · ${p.itens.length} alongamentos de ${PAUSA_SEG} segundos. Dá para fazer na cadeira ou em pé, do lado da mesa.</p>
    <div class="card" id="pz-box" style="margin-top:16px;padding:16px"></div>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn grow" id="pz-ir"></button><button class="btn ghost" id="pz-prox">Próximo</button></div>
    <ol class="steps" id="pz-lista" style="margin-top:18px"></ol>`;
  const box = document.getElementById('pz-box'),
    ir = document.getElementById('pz-ir'),
    prox = document.getElementById('pz-prox'),
    lista = document.getElementById('pz-lista');
  const fim = () => {
    clearInterval(pausaT);
    rodando = false;
    box.innerHTML = `<div style="text-align:center;padding:18px 6px"><div class="h2">Pronto!</div><p class="muted" style="margin-top:8px">Seu corpo agradece. Até a próxima pausa.</p></div>`;
    ir.textContent = 'Fazer de novo';
    ir.onclick = () => viewPausa(b);
    prox.hidden = true;
    lista.querySelectorAll('li').forEach((li) => li.classList.add('ok'));
  };
  const pinta = () => {
    const [img, nome, dica] = p.itens[i];
    box.innerHTML = `${exFig({ nome, imagens: [img + '/0.webp', img + '/1.webp'] }, 'big')}
      <div class="row" style="justify-content:space-between;align-items:baseline;margin-top:12px"><b style="font-size:1.1rem">${esc(nome)}</b><span class="tiny dim">${i + 1} de ${p.itens.length}</span></div>
      <p class="small muted" style="margin-top:4px">${esc(dica)}</p>
      <div style="font-family:var(--f-d);font-size:3rem;font-weight:700;text-align:center;margin-top:10px" id="pz-seg">${resta}s</div>`;
    ir.textContent = rodando ? 'Pausar' : resta < PAUSA_SEG ? 'Continuar' : i ? 'Começar este' : 'Começar';
    lista.innerHTML = p.itens
      .map(([, n], k) => `<li${k < i ? ' class="ok"' : ''}${k === i ? ' style="font-weight:700"' : ''}>${esc(n)}</li>`)
      .join('');
  };
  const avanca = () => {
    if (i >= p.itens.length - 1) return fim();
    i++;
    resta = PAUSA_SEG;
    try {
      navigator.vibrate && navigator.vibrate(200);
    } catch {}
    pinta();
  };
  ir.onclick = () => {
    if (!document.getElementById('pz-box')) return;
    rodando = !rodando;
    clearInterval(pausaT);
    if (rodando)
      pausaT = setInterval(() => {
        if (!document.getElementById('pz-box')) return clearInterval(pausaT);
        resta--;
        const s = document.getElementById('pz-seg');
        if (s) s.textContent = resta + 's';
        if (resta <= 0) avanca();
      }, 1000);
    pinta();
  };
  prox.onclick = avanca;
  pinta();
}

/* ---------- pernas para cima antes de dormir ----------
   O aviso das 21h (função nx-alongar, campo "relaxar" da ficha) abre #/relaxar: o vídeo da posição,
   o passo a passo e o que ouvir enquanto fica na posição (meditação guiada ou som da noite). */
const RELAX_OUVIR = [
  ['dormir', 'Relaxar para dormir', 'Meditação guiada'],
  ['corpo', 'Escaneamento do corpo', 'Meditação guiada'],
  ['chuva', 'Chuva a noite inteira', 'Som para dormir'],
  ['mar', 'Mar a noite inteira', 'Som para dormir'],
  ['floresta', 'Floresta viva', 'Som para dormir'],
];
function viewRelaxar() {
  $app.innerHTML = `<a class="back" href="#/">${I.back} Início</a><p class="eyebrow">Antes de dormir</p><h1 class="h1">Pernas para cima</h1>
    <p class="muted" style="margin-top:6px">Na cama, com as pernas apoiadas na parede ou na cabeceira, por 5 a 10 minutos. Ajuda o sangue a voltar das pernas depois de um dia sentado e prepara o corpo para dormir.</p>
    <video src="media/pernas-para-cima.mp4" poster="media/pernas-para-cima.jpg" autoplay muted loop playsinline style="width:100%;border-radius:16px;margin-top:14px;background:#000;aspect-ratio:16/9;object-fit:cover"></video>
    <ol class="steps" style="margin-top:14px">
      <li>Deite de barriga para cima, com o quadril perto da parede ou da cabeceira.</li>
      <li>Suba as pernas e apoie na parede, com os joelhos soltos, sem travar.</li>
      <li>Braços largados ao lado do corpo, ombros relaxados.</li>
      <li>Respire devagar pelo nariz e solte o ar com calma.</li>
      <li>Fique de 5 a 10 minutos. Se formigar, dobre os joelhos ou desça as pernas.</li>
    </ol>
    <div class="h2" style="margin-top:22px">O que ouvir enquanto relaxa</div>
    <div style="display:grid;gap:8px;margin-top:10px">${RELAX_OUVIR.map(
      ([id, n, t]) =>
        `<a class="btn ghost block" href="#/meditacao/${id}" style="justify-content:space-between;text-align:left"><span>${esc(n)}</span><span class="tiny dim">${t}</span></a>`,
    ).join('')}</div>`;
}
