let grupoAtual = null;

// ── Utilidades ────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ── Navegação ─────────────────────────────
function voltarInicio() {
  grupoAtual = null;
  mostrarTela('tela-inicio');
  carregarGrupos();
}

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  $(id).classList.add('ativa');
}

// ── Modal ─────────────────────────────────
function abrirModalGrupo() {
  $('inp-grupo-nome').value = '';
  $('modal-msg').textContent = '';
  $('modal-overlay').classList.add('aberto');
  setTimeout(() => $('inp-grupo-nome').focus(), 50);
}
function fecharModal() {
  $('modal-overlay').classList.remove('aberto');
}

// ── Grupos: Tela Inicial ──────────────────
async function carregarGrupos() {
  const lista = $('lista-grupos');
  const grupos = await api('/api/grupos');
  if (!grupos.length) {
    lista.innerHTML = '<div class="vazio">Nenhum grupo criado ainda. Clique em "+ Novo grupo" para começar.</div>';
    return;
  }

  // Busca totais de cada grupo
  lista.innerHTML = '';
  for (const g of grupos) {
    const respostas = await api(`/api/grupos/${g.id}/respostas`);
    const total = respostas.length;
    const div = document.createElement('div');
    div.className = 'grupo-item';
    div.innerHTML = `
      <div class="grupo-item-letra">${esc(g.nome[0].toUpperCase())}</div>
      <div class="grupo-item-info" onclick="abrirGrupo(${g.id}, '${esc(g.nome)}')">
        <div class="grupo-item-nome">${esc(g.nome)}</div>
        <div class="grupo-item-total">${total} resposta${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}</div>
      </div>
      <div class="grupo-item-seta" onclick="abrirGrupo(${g.id}, '${esc(g.nome)}')">›</div>
      <button class="grupo-item-del" onclick="deletarGrupo(${g.id}, '${esc(g.nome)}')" title="Excluir grupo">✕</button>
    `;
    lista.appendChild(div);
  }
}

async function criarGrupo() {
  const nome = $('inp-grupo-nome').value.trim();
  if (!nome) { $('modal-msg').textContent = 'Digite o nome do grupo.'; return; }

  const res = await api('/api/grupos', 'POST', { nome });
  if (res.erro) { $('modal-msg').textContent = res.erro; return; }

  fecharModal();
  carregarGrupos();
}

async function deletarGrupo(id, nome) {
  if (!confirm(`Excluir o grupo "${nome}" e todas as respostas?\nEssa ação não pode ser desfeita.`)) return;
  await api(`/api/grupos/${id}`, 'DELETE');
  carregarGrupos();
}

// ── Grupo: Tela de Detalhes ───────────────
async function abrirGrupo(id, nome) {
  grupoAtual = id;
  $('grupo-nome-topo').textContent = nome;
  mostrarTela('tela-grupo');
  await atualizar();
}

async function atualizar() {
  if (!grupoAtual) return;
  const respostas = await api(`/api/grupos/${grupoAtual}/respostas`);
  $('total-num').textContent = respostas.length;
  renderizarLista(respostas);
  renderizarGrafico(respostas);
}

// ── Adicionar resposta ────────────────────
async function adicionarResposta() {
  const nome = $('inp-nome').value.trim();
  const religiao = $('inp-religiao').value.trim();
  const msg = $('form-msg');

  if (!religiao) { setMsg(msg, 'Informe a religião.', 'err'); return; }

  const res = await api(`/api/grupos/${grupoAtual}/respostas`, 'POST', { nome, religiao });
  if (res.erro) { setMsg(msg, res.erro, 'err'); return; }

  $('inp-nome').value = '';
  $('inp-religiao').value = '';
  setMsg(msg, '✓ Adicionado!', 'ok');
  setTimeout(() => { msg.textContent = ''; msg.className = ''; }, 2000);
  await atualizar();
}

async function deletarResposta(id) {
  await api(`/api/respostas/${id}`, 'DELETE');
  await atualizar();
}

// ── Renderizar Lista ──────────────────────
function renderizarLista(respostas) {
  const cont = $('lista-respostas');
  if (!respostas.length) {
    cont.innerHTML = '<div class="lista-vazia">Nenhuma resposta registrada ainda.</div>';
    return;
  }
  cont.innerHTML = respostas.map(r => `
    <div class="resposta-item">
      <div class="resposta-dot"></div>
      <div class="resposta-nome">${esc(r.nome || '—')}</div>
      <div class="resposta-religiao">${esc(r.religiao)}</div>
      <button class="resposta-del" onclick="deletarResposta(${r.id})" title="Remover">✕</button>
    </div>
  `).join('');
}

// ── Renderizar Gráfico ────────────────────
function renderizarGrafico(respostas) {
  const cont = $('grafico');
  if (!respostas.length) {
    cont.innerHTML = '<div class="grafico-vazio">Adicione respostas para ver o resultado.</div>';
    return;
  }

  // Contagem
  const contagem = {};
  respostas.forEach(r => {
    const k = r.religiao.trim();
    contagem[k] = (contagem[k] || 0) + 1;
  });
  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const total = respostas.length;

  const resumo = `
    <div class="grafico-resumo">
      <div class="resumo-item">
        <span class="resumo-num">${total}</span>
        <span class="resumo-label">Total</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-num">${ordenado.length}</span>
        <span class="resumo-label">Religiões</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-num">${((ordenado[0][1]/total)*100).toFixed(0)}%</span>
        <span class="resumo-label">${esc(ordenado[0][0])}</span>
      </div>
    </div>
  `;

  const barras = ordenado.map(([rel, qtd], i) => {
    const pct = ((qtd / total) * 100).toFixed(1);
    const cor = i < 8 ? `c${i}` : 'cn';
    return `
      <div class="barra-linha">
        <div class="barra-topo">
          <span class="barra-nome">${esc(rel)}</span>
          <div class="barra-stats">
            <span class="barra-qtd">${qtd}</span>
            <span class="barra-pct">${pct}%</span>
          </div>
        </div>
        <div class="barra-trilho">
          <div class="barra-fill ${cor}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  cont.innerHTML = resumo + barras;
}

// ── PDF ───────────────────────────────────
async function baixarPDF() {
  const formCard = document.querySelector('.form-card');
  const listaCard = document.querySelector('.lista-card');
  const acoes = document.querySelector('.resultado-acoes');
  const voltar = document.querySelector('.voltar');

  formCard.style.display = 'none';
  listaCard.style.display = 'none';
  acoes.style.visibility = 'hidden';
  voltar.style.visibility = 'hidden';

  await html2pdf()
    .set({
      margin: 0,
      filename: `pesquisa-${$('grupo-nome-topo').textContent.toLowerCase().replace(/\s+/g,'-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0e0e10' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(document.getElementById('tela-grupo'))
    .save();

  formCard.style.display = '';
  listaCard.style.display = '';
  acoes.style.visibility = '';
  voltar.style.visibility = '';
}

// ── API helper ────────────────────────────
async function api(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return await res.json();
  } catch {
    return { erro: 'Erro de conexão.' };
  }
}

function setMsg(el, txt, tipo) {
  el.textContent = txt;
  el.className = tipo;
}

// ── Enter key ─────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if ($('modal-overlay').classList.contains('aberto')) { criarGrupo(); return; }
  if (document.getElementById('tela-grupo').classList.contains('ativa')) adicionarResposta();
});

// ── Init ──────────────────────────────────
carregarGrupos();
