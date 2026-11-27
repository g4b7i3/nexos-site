/* Nexos App · Relógio e zonas de FC (só a equipe vê).
   Muitos relógios vêm de fábrica com as zonas de 10 em 10% da FC máxima e com a FC máxima estimada (ou detectada
   errada pelo sensor de pulso); aí o aluno corre leve e o relógio marca Z4. Mas nem sempre o culpado é o relógio:
   pode ser calor, sensor travado na cadência ou um leve que não é leve. O app cruza, nos treinos leves dos últimos
   60 dias, o pace (faixa de leve do aluno) com a FC e com o tempo em cada zona que o próprio relógio mandou, e diz
   qual é o caso. Quando é o relógio, mostra os números para ajustar: FC máxima (medida ou Tanaka, 208 − 0,7 × idade;
   Tanaka et al. 2001) e o início de cada zona pela escala do Olympiatoppen (55, 72, 82, 87 e 92% da FC máxima). */
'use strict';

/* relogio:puro:inicio */
const RZ_OLYMP = [0.55, 0.72, 0.82, 0.87, 0.92];
const rzMediana = (a) => {
  const v = a.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y);
  return v.length ? v[Math.floor((v.length - 1) / 2)] : null;
};
const rzFcMaxTanaka = (idade) => (idade ? Math.round(208 - 0.7 * idade) : null);
/** treinos: leves com zonas do relógio [{ pace (s/km), fc (média), t: [s em Z1..Z5], lim: [início Z1..Z5] }];
    leve: faixa de pace do leve [rápido, lento]; fcMaxMedida: do teste, se houver */
function rzAnalisar({ treinos, leve, idade, fcMaxMedida }) {
  const ok = (treinos || []).filter((x) => x && Array.isArray(x.t) && x.t.length >= 5 && x.pace > 0);
  if (ok.length < 2) return null;
  const tot = ok.reduce((a, x) => a + x.t.slice(0, 5).reduce((s, v) => s + (+v || 0), 0), 0);
  if (!tot) return null;
  const z45 = ok.reduce((a, x) => a + (+x.t[3] || 0) + (+x.t[4] || 0), 0) / tot;
  const fcMax = fcMaxMedida || rzFcMaxTanaka(idade);
  const limZ5 = rzMediana(ok.map((x) => x.lim && x.lim[4]));
  const maxRel = limZ5 ? Math.round(limZ5 / 0.9) : null; // FC máxima que o relógio usa (zonas de fábrica: Z5 em 90%)
  const paceMed = rzMediana(ok.map((x) => x.pace));
  const fcMed = rzMediana(ok.map((x) => x.fc));
  const zonas = fcMax ? RZ_OLYMP.map((p) => Math.round(fcMax * p)) : null;
  let tipo = 'ok';
  if (z45 >= 0.4) {
    if (leve && paceMed < leve[0] - 5) tipo = 'forte';
    else if (fcMax && fcMed >= fcMax * 0.82) tipo = 'alta';
    else tipo = 'relogio';
  }
  return { tipo, z45, n: ok.length, paceMed, fcMed, maxRel, fcMax, medida: !!fcMaxMedida, zonas };
}
/* relogio:puro:fim */

const RZ_TIPOS = ['rodagem', 'regenerativo', 'longao'];
/** treinos leves (dos últimos 60 dias) com as zonas do relógio, por aluno */
async function rzTreinos(ids) {
  if (!ids.length) return {};
  const desde = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data: cs } = await sb
    .from('nx_corridas')
    .select('aluno_id,plano_id,distancia_m,duracao_s,fc_media,zr:analise->extras->zonas_rel->fc')
    .in('aluno_id', ids)
    .not('plano_id', 'is', null)
    .gte('data', desde)
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const comZona = (cs || []).filter((c) => c.zr && c.zr.t && c.distancia_m > 500 && c.duracao_s > 0);
  if (!comZona.length) return {};
  const { data: pls } = await sb
    .from('nx_plano_corrida')
    .select('id,tipo')
    .in('id', [...new Set(comZona.map((c) => c.plano_id))])
    .then(
      (r) => r,
      () => ({ data: [] }),
    );
  const leve = new Set((pls || []).filter((p) => RZ_TIPOS.includes(p.tipo)).map((p) => p.id));
  const out = {};
  comZona
    .filter((c) => leve.has(c.plano_id))
    .forEach((c) =>
      (out[c.aluno_id] = out[c.aluno_id] || []).push({
        pace: c.duracao_s / (c.distancia_m / 1000),
        fc: c.fc_media,
        t: c.zr.t,
        lim: c.zr.lim,
      }),
    );
  return out;
}
function rzDoAluno(m, treinos) {
  const perfil = perfilCorrida(m || {});
  const idade = m && m.nascimento ? idadeEm(m.nascimento) : null;
  const c = (m && m.corrida) || {};
  return rzAnalisar({
    treinos,
    leve: perfil.paces && perfil.paces.leve,
    idade,
    fcMaxMedida: c.fc_max ? +c.fc_max : null,
  });
}
const RZ_TXT = {
  relogio: 'Relógio com as zonas erradas',
  alta: 'FC alta de verdade no leve',
  forte: 'Correndo o leve rápido demais',
};
function rzCardHTML(a, nome) {
  if (!a) return '';
  const pct = Math.round(a.z45 * 100);
  if (a.tipo === 'ok')
    return `<div class="card rz-card ok"><b>Relógio e zonas de FC</b><p class="small muted" style="margin-top:4px">Nos últimos ${a.n} treinos leves, o relógio marcou Z4 ou Z5 em ${pct}% do tempo. Está tudo certo, não precisa ajustar.</p></div>`;
  const ped = `<p class="tiny dim" style="margin-top:8px">Só você vê este card. Base: ${a.n} treinos leves dos últimos 60 dias · pace mediano ${fmtPace(a.paceMed)} · FC média mediana ${a.fcMed} bpm · ${pct}% do tempo em Z4 ou Z5 no relógio.</p>`;
  if (a.tipo === 'forte')
    return `<div class="card rz-card warn"><b>${RZ_TXT.forte}</b><p class="small" style="margin-top:4px">O relógio marca Z4 porque ${esc(nome)} está correndo o leve mais rápido que a faixa de leve da planilha. Ajustar o relógio não resolve. Oriente a segurar o pace e a ir pelo teste da fala: consegue conversar em frases completas, está leve.</p>${a.fcMax && a.fcMed >= a.fcMax * 0.9 ? `<p class="small" style="margin-top:6px">A FC média passa de 90% da máxima${a.medida ? '' : ' esperada para a idade'} até no leve. Vale conferir um treino com cinta no peito e, se repetir, pedir um teste ergométrico.</p>` : ''}${ped}</div>`;
  if (a.tipo === 'alta')
    return `<div class="card rz-card warn"><b>${RZ_TXT.alta}</b><p class="small" style="margin-top:4px">O pace está na faixa do leve, mas a FC fica acima de 82% da máxima${a.medida ? '' : ' estimada para a idade'}. Mesmo com o relógio ajustado, seria esforço moderado. Pode ser calor (a FC sobe de 10 a 20 batimentos no mesmo pace), sensor de pulso travado na cadência ou leve rápido para ${esc(nome)}. Oriente a ir pela conversa e, se puder, conferir um treino com cinta no peito.</p>${ped}</div>`;
  const z = a.zonas;
  return `<div class="card rz-card err"><b>${RZ_TXT.relogio}</b><p class="small" style="margin-top:4px">${esc(nome)} corre o leve no pace certo e o relógio marca Z4. ${a.maxRel && a.fcMax && a.maxRel < a.fcMax - 5 ? `O relógio usa FC máxima de uns ${a.maxRel} bpm, e a ${a.medida ? 'medida' : 'esperada para a idade'} é ${a.fcMax}. ` : ''}As zonas de fábrica (10 em 10%) não servem para quem corre. É só ajustar o relógio:</p>
    ${
      z
        ? `<div class="rz-nums"><div><small>FC máxima</small><b>${a.fcMax}</b></div>${z.map((v, i) => `<div><small>Z${i + 1} começa</small><b>${v}</b></div>`).join('')}</div>
    <p class="small" style="margin-top:8px"><b>No Garmin:</b> segurar o botão do meio › Configurações do relógio › Perfil do usuário › Zonas de FC › FC máxima ${a.fcMax} (desligar a detecção automática) › Zonas › Baseado em BPM › colocar o início de cada zona acima.</p>
    <button type="button" class="btn ghost sm rz-copiar" style="margin-top:8px" data-txt="${esc(`Ajuste das zonas de FC no relógio\nFC máxima: ${a.fcMax}\n${z.map((v, i) => `Zona ${i + 1}: a partir de ${v} bpm`).join('\n')}\nGarmin: segure o botão do meio > Configurações do relógio > Perfil do usuário > Zonas de FC. Coloque a FC máxima, desligue a detecção automática, e em Zonas > Baseado em > BPM coloque o início de cada zona.`)}">Copiar para mandar ao aluno</button>`
        : '<p class="small muted" style="margin-top:6px">Falta a data de nascimento ou a FC máxima do aluno para calcular os números.</p>'
    }
    <p class="tiny dim" style="margin-top:8px">FC máxima ${a.medida ? 'medida' : 'pela fórmula de Tanaka (208 − 0,7 × idade); com o teste fica mais certo'}. Zonas pela escala do Olympiatoppen (55, 72, 82, 87 e 92% da FC máxima).</p>${ped}</div>`;
}
/** card na ficha do aluno (Ritmos e zonas) */
async function rzMontar(el, m) {
  if (!el || !S.staff) return;
  const tr = await rzTreinos([m.user_id]);
  if (!el.isConnected) return;
  const a = rzDoAluno(m, tr[m.user_id]);
  el.innerHTML = rzCardHTML(a, firstName(m.nome || 'O aluno'));
  el.querySelectorAll('.rz-copiar').forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await navigator.clipboard.writeText(b.dataset.txt);
          toast('Copiado. É só colar na conversa com o aluno.');
        } catch {
          toast('Não deu para copiar neste aparelho.', true);
        }
      }),
  );
}
/** lista de quem tem o problema (Relógios dos alunos) */
async function rzListaHTML(alunos) {
  const tr = await rzTreinos(alunos.map((m) => m.user_id));
  const casos = alunos
    .map((m) => ({ m, a: rzDoAluno(m, tr[m.user_id]) }))
    .filter((x) => x.a && x.a.tipo !== 'ok')
    .sort((x, y) => y.a.z45 - x.a.z45);
  if (!casos.length) return '';
  return `<div class="section"><div class="section-h"><h2 class="h2">Zonas de FC no relógio</h2><span class="tag">${casos.length}</span></div>
    <p class="small muted" style="margin:-4px 0 10px">Quem o relógio marca em Z4 ou Z5 na maior parte do treino leve, e por quê. Toque para ver os números na ficha (em Ritmos e zonas).</p>
    <div class="stack">${casos
      .map(
        ({ m, a }) =>
          `<a class="list-item" href="#/aluno/${m.user_id}/corrida" data-rz="1" style="color:inherit">${avAluno(m)}<div class="grow" style="min-width:0"><b class="ellip" style="display:block">${esc(m.nome)}</b><div class="small muted">${RZ_TXT[a.tipo]} · ${Math.round(a.z45 * 100)}% do leve em Z4 ou Z5</div></div><span class="tag ${a.tipo === 'relogio' ? 'err' : 'warn'}">${a.tipo === 'relogio' ? 'ajustar' : 'orientar'}</span></a>`,
      )
      .join('')}</div></div>`;
}
